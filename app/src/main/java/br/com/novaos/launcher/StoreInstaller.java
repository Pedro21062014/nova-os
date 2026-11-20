package br.com.novaos.launcher;

import android.content.ClipData;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.SystemClock;
import android.provider.Settings;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Arrays;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.RejectedExecutionException;
import javax.net.ssl.HttpsURLConnection;
import org.json.JSONObject;

final class StoreInstaller {
    static final String PACKAGE = "br.com.novaos.store";
    private static final String CHANNEL="https://raw.githubusercontent.com/Pedro21062014/nova-os/refs/heads/nova-store-app/atualizacao.json";
    private static final String ASSETS="https://github.com/Pedro21062014/nova-os/releases/download/nova-store-v";
    private static final String STORE_CERT="126fdf162c910bbf65b66c4f225f4adbec1ca102f8368fdf9f5ce0b5b7f4c004";
    static final class Release {
        final String version,url,sha;
        final long size;
        final int code;
        Release(String version,int code,long size,String sha){this.code=code;
            this.version=version;this.size=size;this.sha=sha;
            this.url=ASSETS+version+"/Nova-Store-"+version+".apk";
        }
    }
    private static final Release PINNED=new Release("1.0.4",5,5080809L,"253c4e1819f02078b210233f57efd13ddd0553cb98fbf243df5c1711f84e7208");
    private static final Release BACKUP=new Release("1.0.3",4,5080809L,"ba8bdf96e82f190a5df6b7f49d25f5565344ba37493e300d63dbded82ad4e5d8");
    private volatile Release target=PINNED;
    private Release stagedRelease;
    private long lastCheck=-1;
    private String checkStatus="idle";
    interface Callback { void state(JSONObject data); }
    private final NovaActivity activity;
    private final SharedPreferences prefs;
    private final Callback callback;
    private final ExecutorService worker=Executors.newSingleThreadExecutor();
    private volatile boolean closed;
    private String status="available", message="Baixe a Nova Store para explorar o catálogo de apps para TV.";
    private int progress, installedCode;
    StoreInstaller(NovaActivity a, Callback c){
        activity=a;callback=c;prefs=a.getSharedPreferences("nova-store-invitation",0);
        try{Release saved=parseChannel(new JSONObject(prefs.getString("last-channel","")));if(saved.code>target.code)target=saved;}
        catch(Exception ignored){}
    }
    private PackageInfo installedInfo(int flags){try{return activity.getPackageManager().getPackageInfo(PACKAGE,flags);}catch(PackageManager.NameNotFoundException e){return null;}}
    private boolean installed(){return installedInfo(0)!=null;}
    private int readInstalledCode(){
        PackageInfo info=installedInfo(0);
        if(info==null)return 0;
        long code=Build.VERSION.SDK_INT>=28?info.getLongVersionCode():info.versionCode;
        return (int)Math.min(Integer.MAX_VALUE,Math.max(1,code));
    }
    private boolean hasUpdate(){return installedCode>0&&installedCode<target.code;}
    synchronized boolean claimUpdateNotice(){
        int version=readInstalledCode(), notice=target.code;
        return !closed&&version>0&&version<notice&&prefs.getInt("update-notice-code",0)<notice
            &&prefs.edit().putInt("update-notice-code",notice).commit();
    }
    private boolean reachedCurrent(){
        installedCode=readInstalledCode();
        if(installedCode<target.code)return false;
        UpdateFileProvider.storeStaged(activity).delete();stagedRelease=null;progress=0;
        show("installed","A Nova Store já está atualizada neste aparelho.");return true;
    }
    private String offerMessage(){return hasUpdate()?"Nova Store "+target.version+" disponível. Baixe a atualização sem desinstalar a loja.":"Baixe a Nova Store para explorar o catálogo de apps para TV.";}
    synchronized boolean claimInvitation(){
        return !closed&&!installed()&&!prefs.getBoolean("shown",false)&&prefs.edit().putBoolean("shown",true).commit();
    }
    void skipInvitation(){prefs.edit().putBoolean("shown",true).apply();}
    private void run(Runnable task){if(!closed)try{worker.execute(task);}catch(RejectedExecutionException ignored){}}
    void close(){closed=true;worker.shutdownNow();}
    void send(){run(()->{refreshState();checkNow(false);});}
    private void refreshState(){
        if(reachedCurrent())return;
        if("installed".equals(status))show("available",offerMessage());
        else if("permission".equals(status)&&Build.VERSION.SDK_INT>=26&&activity.getPackageManager().canRequestPackageInstalls())show("ready","Permissão concedida. Selecione Instalar para continuar.");
        else if("installing".equals(status))show("ready","A instalação não foi confirmada. Você pode tentar de novo.");
        else if("available".equals(status)&&UpdateFileProvider.storeStaged(activity).isFile())try{
            verifyStaged(UpdateFileProvider.storeStaged(activity));progress=100;show("ready","APK verificado. Pronto para instalar.");
        }catch(Exception invalid){UpdateFileProvider.storeStaged(activity).delete();show("available",offerMessage());}
        else if("available".equals(status))show("available",offerMessage());else publish();
    }
    static Release parseChannel(JSONObject json) throws Exception {
        String version=json.getString("version"),hash=json.getString("sha256");
        long size=json.getLong("bytes"),code=json.getLong("versionCode");
        if(json.getInt("schema")!=1||!PACKAGE.equals(json.getString("package"))||code<1||code>Integer.MAX_VALUE||size<10000||size>80L*1024*1024||
            !version.matches("[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}")||!hash.matches("[a-f0-9]{64}"))throw new IOException("Channel rules");
        Release release=new Release(version,(int)code,size,hash);
        if(!release.url.equals(json.getString("url")))throw new IOException("Channel asset");
        return release;
    }
    private static Release queryChannel(boolean manual) throws Exception {
        HttpsURLConnection c=(HttpsURLConnection)new URL(CHANNEL+(manual?"?check="+System.currentTimeMillis():"")).openConnection();
        try{
            c.setConnectTimeout(4500);c.setReadTimeout(5000);c.setInstanceFollowRedirects(false);c.setUseCaches(false);c.setRequestProperty("Cache-Control","no-cache");
            if(c.getResponseCode()!=200||c.getContentLength()>8192)throw new IOException("Channel response");
            try(InputStream in=c.getInputStream();ByteArrayOutputStream out=new ByteArrayOutputStream()){
                byte[] b=new byte[1024];int n;while((n=in.read(b))!=-1){if(out.size()+n>8192)throw new IOException("Channel too large");out.write(b,0,n);}
                return parseChannel(new JSONObject(new String(out.toByteArray(),StandardCharsets.UTF_8)));
            }
        }finally{c.disconnect();}
    }
    void check(){run(()->checkNow(true));}
    private void checkNow(boolean manual){
        long now=SystemClock.elapsedRealtime();
        if(closed||"installing".equals(status)||(!manual&&lastCheck>=0&&now-lastCheck<300000))return;
        lastCheck=now;if(manual){checkStatus="checking";publish();}
        try{
            Release fresh=queryChannel(manual);
            if(closed)return;
            if(fresh.code>target.code){
                target=fresh;
                prefs.edit().putString("last-channel",new JSONObject().put("schema",1).put("package",PACKAGE).put("version",fresh.version)
                    .put("versionCode",fresh.code).put("url",fresh.url).put("bytes",fresh.size).put("sha256",fresh.sha).toString()).apply();
                if("ready".equals(status)||"permission".equals(status)){
                    UpdateFileProvider.storeStaged(activity).delete();stagedRelease=null;status="available";progress=0;
                }
            }
            if(manual)checkStatus="success";
            refreshState();
        }catch(Exception failure){if(manual){checkStatus="error";publish();}}
    }
    boolean openIfInstalled(){
        if(closed||!installed())return false;
        open();return true;
    }
    void open(){activity.runOnUiThread(()->{
        try{
            PackageManager pm=activity.getPackageManager();Intent intent=pm.getLeanbackLaunchIntentForPackage(PACKAGE);
            if(intent==null)intent=pm.getLaunchIntentForPackage(PACKAGE);
            if(intent==null)throw new IllegalStateException();
            activity.startActivity(intent);
        }catch(RuntimeException unavailable){
            activity.showStoreOpenError();
            run(()->{if(!reachedCurrent())show("available","Não foi possível abrir a Nova Store neste aparelho.");});
        }
    });}
    void download(){skipInvitation();run(this::downloadNow);}
    private void downloadNow(){
        if(reachedCurrent())return;
        if("ready".equals(status)||"permission".equals(status)||"installing".equals(status)){publish();return;}
        progress=0;show("downloading",hasUpdate()?"Baixando a atualização da Nova Store…":"Baixando a Nova Store…");
        File temp=null,staged=UpdateFileProvider.storeStaged(activity);HttpsURLConnection c=null;
        try{
            temp=File.createTempFile("nova-store-",".tmp",activity.getCacheDir());
            Release selected=target;
            try{c=connect(selected);}catch(FileNotFoundException unavailable){if(hasUpdate())throw unavailable;selected=BACKUP;c=connect(selected);}
            long total=0;
            try(InputStream in=c.getInputStream();FileOutputStream out=new FileOutputStream(temp)){
                byte[] buf=new byte[16384];int n;
                while((n=in.read(buf))!=-1){
                    if(closed||Thread.currentThread().isInterrupted())throw new IOException("Canceled");
                    total+=n;if(total>selected.size)throw new SecurityException("Size");
                    out.write(buf,0,n);int pct=(int)(100*total/selected.size);if(pct-progress>=5){progress=pct;publish();}
                }
            }
            verify(temp,selected);
            if(closed)throw new IOException("Canceled");
            if(staged.exists()&&!staged.delete())throw new IOException("Cache");
            if(!temp.renameTo(staged))throw new IOException("Cache");
            stagedRelease=selected;progress=100;show("ready","APK verificado. Pronto para instalar.");
        }catch(SecurityException bad){show("available","APK rejeitado: o arquivo não confere com a versão oficial esperada.");}
        catch(Exception failure){show("available","Não foi possível baixar a Nova Store. Verifique a conexão ou tente novamente mais tarde.");}
        finally{if(temp!=null)temp.delete();if(c!=null)c.disconnect();}
    }
    void install(){run(()->{
        if(reachedCurrent())return;
        try{verifyStaged(UpdateFileProvider.storeStaged(activity));}
        catch(SignatureMismatch invalid){UpdateFileProvider.storeStaged(activity).delete();show("available","A assinatura da Nova Store instalada é diferente. Não é possível atualizá-la por aqui.");return;}
        catch(Exception invalid){UpdateFileProvider.storeStaged(activity).delete();show("available","Baixe a Nova Store novamente para instalar.");return;}
        if(Build.VERSION.SDK_INT>=26&&!activity.getPackageManager().canRequestPackageInstalls()){
            show("permission","Autorize esta fonte nos ajustes do Android. Depois, volte e selecione Instalar.");
            activity.runOnUiThread(()->{try{activity.startActivity(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,Uri.parse("package:"+activity.getPackageName())));}catch(RuntimeException missing){run(()->show("ready","Não foi possível abrir a permissão. Verifique os ajustes do Android."));}});
            return;
        }
        show("installing","Confirme a instalação na tela do Android.");
        activity.runOnUiThread(()->{try{
            Uri uri=UpdateFileProvider.storeUri(activity);Intent launch=new Intent(Intent.ACTION_VIEW).setDataAndType(uri,UpdateFileProvider.MIME).addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            launch.setClipData(ClipData.newRawUri("Nova Store",uri));activity.startActivity(launch);
        }catch(RuntimeException missing){run(()->show("ready","O instalador do Android não está disponível neste aparelho."));}});
    });}
    private static HttpsURLConnection connect(Release release) throws IOException {
        URL next=new URL(release.url);
        for(int i=0;i<5;i++){
            String host=next.getHost().toLowerCase(Locale.ROOT);
            if(!"https".equals(next.getProtocol())||(next.getPort()!=-1&&next.getPort()!=443)||next.getUserInfo()!=null||
              !(host.equals("github.com")||host.equals("release-assets.githubusercontent.com")||host.equals("objects.githubusercontent.com")||host.equals("github-releases.githubusercontent.com")))throw new IOException("Origin");
            HttpsURLConnection c=(HttpsURLConnection)next.openConnection();c.setConnectTimeout(8000);c.setReadTimeout(12000);c.setInstanceFollowRedirects(false);
            try{int code=c.getResponseCode();if(code==200)return c;if(code==404||code==410)throw new FileNotFoundException("Store release not found");String where=c.getHeaderField("Location");if(code<300||code>=400||where==null)throw new IOException("HTTP "+code);next=new URL(next,where);}
            catch(IOException error){c.disconnect();throw error;}
            c.disconnect();
        }
        throw new IOException("Redirect limit");
    }
    private static final class SignatureMismatch extends SecurityException {}
    private void verifyStaged(File apk) throws Exception {
        Release staged=stagedRelease;
        if(staged==null&&installedCode==0){
            try{verify(apk,target);return;}catch(SecurityException unknown){verify(apk,BACKUP);return;}
        }
        if(staged==null)staged=target;
        if(staged.code<=installedCode||hasUpdate()&&staged.code!=target.code)throw new SecurityException("Outdated package");
        verify(apk,staged);
        if(hasUpdate()){
            PackageInfo installed=installedInfo(PackageManager.GET_SIGNATURES);
            PackageInfo next=activity.getPackageManager().getPackageArchiveInfo(apk.getAbsolutePath(),PackageManager.GET_SIGNATURES);
            if(installed==null||next==null||next.signatures==null||next.signatures.length==0||!Arrays.equals(installed.signatures,next.signatures))throw new SignatureMismatch();
        }
    }
    private void verify(File apk,Release release) throws Exception {
        if(!apk.isFile()||apk.length()!=release.size)throw new SecurityException("Size");
        MessageDigest sha=MessageDigest.getInstance("SHA-256");
        try(InputStream in=new FileInputStream(apk)){byte[] b=new byte[16384];int n;while((n=in.read(b))!=-1)sha.update(b,0,n);}
        StringBuilder value=new StringBuilder(64);for(byte b:sha.digest())value.append(String.format(Locale.ROOT,"%02x",b&255));
        if(!release.sha.contentEquals(value))throw new SecurityException("SHA-256");
        PackageInfo apkInfo=activity.getPackageManager().getPackageArchiveInfo(apk.getAbsolutePath(),PackageManager.GET_SIGNATURES);
        if(apkInfo==null||!PACKAGE.equals(apkInfo.packageName)||!release.version.equals(apkInfo.versionName)||apkInfo.versionCode!=release.code)throw new SecurityException("Package");
        if(apkInfo.signatures==null||apkInfo.signatures.length!=1)throw new SecurityException("Signer");
        value.setLength(0);
        for(byte b:sha.digest(apkInfo.signatures[0].toByteArray()))value.append(String.format(Locale.ROOT,"%02x",b&255));
        if(!STORE_CERT.contentEquals(value))throw new SecurityException("Signer");
    }
    private void show(String state,String detail){status=state;message=detail;publish();}
    private void publish(){if(!closed)try{callback.state(new JSONObject().put("status",status).put("message",message).put("progress",progress).put("updateAvailable",hasUpdate()).put("targetVersion",target.version).put("check",checkStatus));}catch(Exception ignored){}}
}
