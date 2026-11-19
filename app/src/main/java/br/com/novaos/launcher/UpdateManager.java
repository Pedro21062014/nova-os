package br.com.novaos.launcher;

import android.app.Activity;
import android.content.ClipData;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import javax.net.ssl.HttpsURLConnection;

final class UpdateManager {
    interface Listener { void state(JSONObject state); }
    static final String DEFAULT_REPO = "Pedro21062014/nova-os";
    private static final long MAX_APK = 25L * 1024 * 1024;
    private static final long CHECK_INTERVAL = 12L * 60 * 60 * 1000;
    private final Activity activity;
    private final Listener listener;
    private final SharedPreferences prefs;
    private final ExecutorService jobs = Executors.newSingleThreadExecutor();
    private final String runningVersion;
    private String repo, status="idle", message="", offeredVersion="";
    private boolean automatic,autoDownload;
    private int progress;
    private long lastAttempt;
    private Asset offer;
    private volatile boolean closed;
    private static final class Asset {
        String version, url, digest;
        long bytes;
    }

    UpdateManager(Activity activity,Listener listener) {
        this.activity=activity;this.listener=listener;
        prefs=activity.getSharedPreferences("nova_updater",Activity.MODE_PRIVATE);
        repo=prefs.getString("repo",DEFAULT_REPO);automatic=prefs.getBoolean("automatic",true);autoDownload=prefs.getBoolean("autoDownload",false);
        String v="1.2.0";
        try {v=installed(0).versionName;} catch(Exception ignored){}
        runningVersion=v;
    }
    private void run(Runnable job){if(!closed)try{jobs.execute(job);}catch(java.util.concurrent.RejectedExecutionException ignored){}}
    void close(){closed=true;jobs.shutdownNow();}
    void send(){run(this::publish);}
    void configure(String raw,boolean auto) {
        run(()->{
            try {
                String next=normalizeRepo(raw);
                boolean different=!next.equalsIgnoreCase(repo);
                if(different) {
                    repo=next;lastAttempt=0;offer=null;offeredVersion="";progress=0;
                    UpdateFileProvider.staged(activity).delete();
                    prefs.edit().remove("lastCheck").apply();
                }
                automatic=auto;prefs.edit().putString("repo",repo).putBoolean("automatic",auto).apply();
                if(different||repo.isEmpty())show(repo.isEmpty()?"unconfigured":"idle",repo.isEmpty()?"Configure um repositório público para ativar o atualizador.":"Fonte de atualização salva.");
                else publish();
                if(auto&&!repo.isEmpty())checkInternal(false);
            } catch(IllegalArgumentException e){show("error","Digite um repositório público no formato dono/repositório.");}
        });
    }
    void autoDownload(boolean enabled){run(()->{
        autoDownload=enabled;prefs.edit().putBoolean("autoDownload",enabled).apply();publish();
        if(enabled&&"available".equals(status))downloadInternal();
    });}
    void check(boolean force){run(()->checkInternal(force));}
    private void checkInternal(boolean force) {
        if(repo.isEmpty()){if(force||"idle".equals(status))show("unconfigured","Configure um repositório público para ativar o atualizador.");return;}
        long now=System.currentTimeMillis();
        if(!force&&(!automatic||recentCheck()||now-lastAttempt<5*60*1000))return;
        if("ready".equals(status)||"permission".equals(status)||"installing".equals(status)){if(force)publish();return;}
        if(!force&&UpdateFileProvider.staged(activity).isFile()){
            try{PackageInfo ready=verifyStaged(UpdateFileProvider.staged(activity));offeredVersion=ready.versionName;show("ready","Atualização validada e pronta para instalar.");return;}
            catch(Exception ignored){UpdateFileProvider.staged(activity).delete();}
        }
        lastAttempt=now;progress=0;show("checking","Consultando a versão publicada…");
        HttpsURLConnection connection=null;
        try{
            connection=connect(new URL("https://api.github.com/repos/"+repo+"/releases/latest"),true);
            int code=connection.getResponseCode();
            if(code==404){offer=null;offeredVersion="";saveCheck();show("no_release","Não encontrei uma release pública nesta fonte.");return;}
            if(code!=200){show("error",code==403||code==429?"Limite de consultas do GitHub. Tente mais tarde.":"Não foi possível consultar a fonte de atualização.");return;}
            JSONObject release=new JSONObject(new String(readSmall(connection.getInputStream(),512*1024),StandardCharsets.UTF_8));
            String tag=release.optString("tag_name","");
            if(!tag.matches("v?[0-9]{1,7}\\.[0-9]{1,7}\\.[0-9]{1,7}")||release.optBoolean("draft")||release.optBoolean("prerelease")){
                show("error","A release precisa usar uma versão estável como v1.2.0.");return;
            }
            String current=tag.startsWith("v")?tag.substring(1):tag;
            saveCheck();
            if(compare(current,runningVersion)<=0){offer=null;offeredVersion="";show("current","O Nova OS já está atualizado.");return;}
            Asset next=asset(release.optJSONArray("assets"),current);
            if(next==null){offer=null;offeredVersion="";show("error","A release não contém um APK compatível com o atualizador Nova OS.");return;}
            offer=next;offeredVersion=next.version;
            show("available","Nova versão disponível: "+next.version+".");
            if(autoDownload)downloadInternal();
        }catch(Exception ignored){show("error","Sem conexão com a fonte de atualização. Tente novamente.");}
        finally{if(connection!=null)connection.disconnect();}
    }
    private boolean recentCheck(){long last=prefs.getLong("lastCheck",0), age=System.currentTimeMillis()-last;return last>0&&age>=0&&age<CHECK_INTERVAL;}
    private void saveCheck(){prefs.edit().putLong("lastCheck",System.currentTimeMillis()).apply();}
    void download(){run(this::downloadInternal);}
    private void downloadInternal(){
        final Asset a=offer;if(a==null||!"available".equals(status))return;
        progress=0;show("downloading","Baixando a atualização…");
        File tmp=null, staged=UpdateFileProvider.staged(activity);
        HttpsURLConnection connection=null;
        try {
            tmp=File.createTempFile("nova-update-", ".apk", activity.getCacheDir());
            connection=downloadConnection(a.url);
            MessageDigest sha=MessageDigest.getInstance("SHA-256");long total=0;
            try(InputStream in=connection.getInputStream();FileOutputStream out=new FileOutputStream(tmp)){
                byte[] buf=new byte[16384];int read;
                while((read=in.read(buf))!=-1){
                    if(closed||Thread.currentThread().isInterrupted())throw new IOException("Canceled");
                    total+=read;if(total>MAX_APK||total>a.bytes)throw new IOException("Size mismatch");
                    out.write(buf,0,read);sha.update(buf,0,read);
                    int pct=(int)(total*100/a.bytes);if(pct-progress>=10){progress=pct;publish();}
                }
            }
            if(total!=a.bytes||!a.digest.equalsIgnoreCase(hex(sha.digest())))throw new SecurityException("Integrity");
            PackageInfo got=verifyStaged(tmp);
            if(!a.version.equals(got.versionName))throw new SecurityException("Version mismatch");
            if(closed)throw new IOException("Canceled");
            if(staged.exists()&&!staged.delete())throw new IOException("Cache");
            if(!tmp.renameTo(staged))throw new IOException("Cache");
            progress=100;show("ready","Atualização assinada e pronta para instalar.");
        }catch(SecurityException invalid){offer=null;offeredVersion="";show("error","APK rejeitado: pacote, versão, integridade ou assinatura não conferem.");}
        catch(Exception ignored){show("available","Não foi possível baixar. Verifique a conexão e tente de novo.");}
        finally{if(tmp!=null)tmp.delete();if(connection!=null)connection.disconnect();}
    }
    void install(){run(()->{
        if(!"ready".equals(status)&&!"permission".equals(status)&&!"installing".equals(status))return;
        try{verifyStaged(UpdateFileProvider.staged(activity));}catch(Exception invalid){UpdateFileProvider.staged(activity).delete();show("error","Atualização inválida. Verifique novamente.");return;}
        if(Build.VERSION.SDK_INT>=26&&!activity.getPackageManager().canRequestPackageInstalls()) {
            show("permission","Permita instalar apps desta fonte e volte para escolher Instalar atualização.");
            activity.runOnUiThread(()->{
                try{activity.startActivity(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,Uri.parse("package:"+activity.getPackageName())));}
                catch(RuntimeException e){run(()->show("ready","Este aparelho não abriu o ajuste. Confira a permissão de instalação nas configurações do Android."));}
            });return;
        }
        show("installing","Confirme no instalador do Android para concluir.");
        activity.runOnUiThread(()->{
            try{
                Uri apk=UpdateFileProvider.uri(activity);
                Intent install=new Intent(Intent.ACTION_VIEW).setDataAndType(apk,UpdateFileProvider.MIME).addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                install.setClipData(ClipData.newRawUri("Nova OS",apk));activity.startActivity(install);
            }catch(RuntimeException e){run(()->show("ready","O instalador do Android não está disponível neste aparelho."));}
        });
    });}
    void onResume(){run(()->{
        if("permission".equals(status)&&Build.VERSION.SDK_INT>=26&&activity.getPackageManager().canRequestPackageInstalls())show("ready","Permissão concedida. Escolha Instalar atualização para continuar.");
        else if("installing".equals(status))show("ready","A atualização ainda não foi aplicada. Você pode tentar instalar de novo.");
        else if("idle".equals(status)&&UpdateFileProvider.staged(activity).isFile()) {
            try{PackageInfo next=verifyStaged(UpdateFileProvider.staged(activity));offeredVersion=next.versionName;show("ready","Atualização validada e pronta para instalar.");}
            catch(Exception ignored){UpdateFileProvider.staged(activity).delete();}
        }
        checkInternal(false);
    });}
    private PackageInfo installed(int flags) throws PackageManager.NameNotFoundException{return activity.getPackageManager().getPackageInfo(activity.getPackageName(),flags);}
    @SuppressWarnings("deprecation") private PackageInfo verifyStaged(File apk) throws SecurityException {
        try {
            if(!apk.isFile()||apk.length()<=0||apk.length()>MAX_APK)throw new SecurityException();
            final int flags=Build.VERSION.SDK_INT>=28?PackageManager.GET_SIGNING_CERTIFICATES:PackageManager.GET_SIGNATURES;
            PackageInfo have=installed(flags), candidate=activity.getPackageManager().getPackageArchiveInfo(apk.getAbsolutePath(),flags);
            if(candidate==null||!have.packageName.equals(candidate.packageName)||code(candidate)<=code(have)||compare(candidate.versionName,have.versionName)<=0)throw new SecurityException();
            Set<String> a=signers(have),b=signers(candidate);if(a.isEmpty()||!a.equals(b))throw new SecurityException();
            return candidate;
        }catch(Exception e){throw new SecurityException("APK not compatible",e);}
    }
    private static long code(PackageInfo info){return Build.VERSION.SDK_INT>=28?info.getLongVersionCode():info.versionCode;}
    private static Set<String> signers(PackageInfo info) throws Exception {
        Signature[] sigs=Build.VERSION.SDK_INT>=28&&info.signingInfo!=null?info.signingInfo.getApkContentsSigners():info.signatures;
        Set<String> found=new HashSet<>();MessageDigest digest=MessageDigest.getInstance("SHA-256");
        if(sigs!=null)for(Signature sig:sigs)found.add(hex(digest.digest(sig.toByteArray())));return found;
    }
    private Asset asset(JSONArray assets,String version){
        if(assets==null)return null;Asset debug=null;
        for(int i=0;i<Math.min(assets.length(),100);i++){
            JSONObject row=assets.optJSONObject(i);if(row==null)continue;
            String name=row.optString("name"), url=row.optString("browser_download_url");long size=row.optLong("size",0);
            boolean standard=name.equals("Nova-OS-"+version+".apk")||name.equals("Nova-OS.apk");
            if((!standard&&!name.equals("Nova-OS-"+version+"-debug.apk"))||size<1024||size>MAX_APK||!initialAsset(url))continue;
            String digest=row.optString("digest","");if(!digest.matches("sha256:[0-9a-fA-F]{64}"))continue;Asset a=new Asset();a.version=version;a.url=url;a.bytes=size;
            a.digest=digest.substring(7);
            if(standard)return a;debug=a;
        }
        return debug;
    }
    private boolean initialAsset(String raw){try{
        URL u=new URL(raw);String path=u.getPath().toLowerCase(Locale.ROOT);
        return secure(u)&&"github.com".equalsIgnoreCase(u.getHost())&&path.startsWith("/"+repo.toLowerCase(Locale.ROOT)+"/releases/download/");
    }catch(Exception e){return false;}}
    private HttpsURLConnection downloadConnection(String url) throws IOException {
        if(!initialAsset(url))throw new IOException("Unexpected host");URL next=new URL(url);
        for(int hop=0;hop<5;hop++){
            String host=next.getHost().toLowerCase(Locale.ROOT);
            if(!secure(next)||!(host.equals("github.com")||host.equals("release-assets.githubusercontent.com")||host.equals("objects.githubusercontent.com")||host.equals("github-releases.githubusercontent.com")))throw new IOException("Unsafe redirect");
            HttpsURLConnection c=connect(next,false);int code=c.getResponseCode();if(code==200)return c;
            String where=c.getHeaderField("Location");c.disconnect();
            if(code<300||code>=400||where==null)throw new IOException("Download failed");next=new URL(next,where);
        }
        throw new IOException("Redirect limit");
    }
    private static boolean secure(URL u){return "https".equalsIgnoreCase(u.getProtocol())&&(u.getPort()==-1||u.getPort()==443)&&u.getUserInfo()==null;}
    private static HttpsURLConnection connect(URL u,boolean meta) throws IOException {
        if(!secure(u))throw new IOException("HTTPS required");
        HttpsURLConnection c=(HttpsURLConnection)u.openConnection();c.setUseCaches(false);c.setConnectTimeout(5000);c.setReadTimeout(7000);c.setInstanceFollowRedirects(false);c.setRequestProperty("User-Agent","Nova-OS-Updater/1.2.0");
        if(meta){c.setRequestProperty("Accept","application/vnd.github+json");c.setRequestProperty("X-GitHub-Api-Version","2022-11-28");}
        return c;
    }
    private static byte[] readSmall(InputStream in,int max) throws IOException{
        try(InputStream stream=in;ByteArrayOutputStream out=new ByteArrayOutputStream()){
            byte[] buf=new byte[8192];int n,total=0;while((n=stream.read(buf))!=-1){total+=n;if(total>max)throw new IOException("Size");out.write(buf,0,n);}return out.toByteArray();
        }
    }
    static String normalizeRepo(String raw){
        String value=raw==null?"":raw.trim();if(value.isEmpty())return "";
        value=value.replaceFirst("(?i)^https://github\\.com/","").replaceFirst("/$","").replaceFirst("(?i)\\.git$","");
        if(!value.matches("[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?/[A-Za-z0-9_.-]{1,100}")||value.endsWith("/.")||value.endsWith("/.."))throw new IllegalArgumentException();
        return value;
    }
    static int compare(String a,String b){
        if(a==null||b==null||!a.matches("[0-9]{1,7}\\.[0-9]{1,7}\\.[0-9]{1,7}")||!b.matches("[0-9]{1,7}\\.[0-9]{1,7}\\.[0-9]{1,7}"))throw new IllegalArgumentException("Version format");
        String[] left=a.split("\\."),right=b.split("\\.");for(int i=0;i<3;i++){int cmp=Integer.compare(Integer.parseInt(left[i]),Integer.parseInt(right[i]));if(cmp!=0)return cmp;}return 0;
    }
    private static String hex(byte[] bytes){StringBuilder text=new StringBuilder();for(byte b:bytes)text.append(String.format(Locale.ROOT,"%02x",b&255));return text.toString();}
    private void show(String state,String text){status=state;message=text;publish();}
    private void publish(){
        if(closed)return;
        try {
            JSONObject json=new JSONObject().put("repo",repo).put("automatic",automatic).put("autoDownload",autoDownload).put("status",status).put("message",message).put("version",runningVersion).put("available",offeredVersion).put("progress",progress);
            listener.state(json);
        }catch(Exception ignored){}
    }
}
