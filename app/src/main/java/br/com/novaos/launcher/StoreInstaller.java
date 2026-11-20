package br.com.novaos.launcher;

import android.content.ClipData;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.security.MessageDigest;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.RejectedExecutionException;
import javax.net.ssl.HttpsURLConnection;
import org.json.JSONObject;

final class StoreInstaller {
    static final String PACKAGE = "br.com.novaos.store";
    static final String URL = "https://github.com/Pedro21062014/nova-os/releases/download/nova-store-v1.0.0/Nova-Store-1.0.0.apk";
    private static final long SIZE = 4919997L;
    private static final String SHA256 = "27fc6b9aa805cc74c2084c73c1626a12d66a7a4df12648d19de7916dac955a1d";
    interface Callback { void state(JSONObject data); }
    private final NovaActivity activity;
    private final SharedPreferences prefs;
    private final Callback callback;
    private final ExecutorService worker=Executors.newSingleThreadExecutor();
    private volatile boolean closed;
    private String status="available", message="Baixe a Nova Store para explorar o catálogo de apps para TV.";
    private int progress;
    StoreInstaller(NovaActivity a, Callback c){activity=a;callback=c;prefs=a.getSharedPreferences("nova-store-invitation",0);}
    private boolean installed(){try{activity.getPackageManager().getPackageInfo(PACKAGE,0);return true;}catch(PackageManager.NameNotFoundException e){return false;}}
    synchronized boolean claimInvitation(){
        return !closed&&!installed()&&!prefs.getBoolean("shown",false)&&prefs.edit().putBoolean("shown",true).commit();
    }
    void skipInvitation(){prefs.edit().putBoolean("shown",true).apply();}
    private void run(Runnable task){if(!closed)try{worker.execute(task);}catch(RejectedExecutionException ignored){}}
    void close(){closed=true;worker.shutdownNow();}
    void send(){run(()->{
        if(installed()){show("installed","A Nova Store já está instalada neste aparelho.");return;}
        if("installed".equals(status))show("available","Baixe a Nova Store para explorar o catálogo de apps para TV.");
        else if("permission".equals(status)&&Build.VERSION.SDK_INT>=26&&activity.getPackageManager().canRequestPackageInstalls())show("ready","Permissão concedida. Selecione Instalar para continuar.");
        else if("installing".equals(status))show("ready","A instalação não foi confirmada. Você pode tentar de novo.");
        else if("available".equals(status)&&UpdateFileProvider.storeStaged(activity).isFile())try{
            verify(UpdateFileProvider.storeStaged(activity));progress=100;show("ready","APK verificado. Pronto para instalar.");
        }catch(Exception invalid){UpdateFileProvider.storeStaged(activity).delete();publish();}
        else publish();
    });}
    void open(){activity.runOnUiThread(()->{
        try{
            PackageManager pm=activity.getPackageManager();Intent intent=pm.getLeanbackLaunchIntentForPackage(PACKAGE);
            if(intent==null)intent=pm.getLaunchIntentForPackage(PACKAGE);
            if(intent==null)throw new IllegalStateException();
            activity.startActivity(intent);
        }catch(RuntimeException unavailable){run(()->show(installed()?"installed":"available","Não foi possível abrir a Nova Store neste aparelho."));}
    });}
    void download(){skipInvitation();run(this::downloadNow);}
    private void downloadNow(){
        if(installed()){show("installed","A Nova Store já está instalada neste aparelho.");return;}
        if("ready".equals(status)||"permission".equals(status)||"installing".equals(status)){publish();return;}
        progress=0;show("downloading","Baixando a Nova Store…");
        File temp=null,staged=UpdateFileProvider.storeStaged(activity);HttpsURLConnection c=null;
        try{
            temp=File.createTempFile("nova-store-",".tmp",activity.getCacheDir());c=connect();long total=0;
            try(InputStream in=c.getInputStream();FileOutputStream out=new FileOutputStream(temp)){
                byte[] buf=new byte[16384];int n;
                while((n=in.read(buf))!=-1){
                    if(closed||Thread.currentThread().isInterrupted())throw new IOException("Canceled");
                    total+=n;if(total>SIZE)throw new SecurityException("Size");
                    out.write(buf,0,n);int pct=(int)(100*total/SIZE);if(pct-progress>=5){progress=pct;publish();}
                }
            }
            verify(temp);
            if(closed)throw new IOException("Canceled");
            if(staged.exists()&&!staged.delete())throw new IOException("Cache");
            if(!temp.renameTo(staged))throw new IOException("Cache");
            progress=100;show("ready","APK verificado. Pronto para instalar.");
        }catch(SecurityException bad){show("available","APK rejeitado: o arquivo não confere com a versão oficial esperada.");}
        catch(Exception failure){show("available","Não foi possível baixar a Nova Store. Verifique a conexão ou tente novamente mais tarde.");}
        finally{if(temp!=null)temp.delete();if(c!=null)c.disconnect();}
    }
    void install(){run(()->{
        if(installed()){show("installed","A Nova Store já está instalada neste aparelho.");return;}
        try{verify(UpdateFileProvider.storeStaged(activity));}catch(Exception invalid){UpdateFileProvider.storeStaged(activity).delete();show("available","Baixe a Nova Store novamente para instalar.");return;}
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
    private static HttpsURLConnection connect() throws IOException {
        URL next=new URL(URL);
        for(int i=0;i<5;i++){
            String host=next.getHost().toLowerCase(Locale.ROOT);
            if(!"https".equals(next.getProtocol())||(next.getPort()!=-1&&next.getPort()!=443)||next.getUserInfo()!=null||
              !(host.equals("github.com")||host.equals("release-assets.githubusercontent.com")||host.equals("objects.githubusercontent.com")||host.equals("github-releases.githubusercontent.com")))throw new IOException("Origin");
            HttpsURLConnection c=(HttpsURLConnection)next.openConnection();c.setConnectTimeout(8000);c.setReadTimeout(12000);c.setInstanceFollowRedirects(false);
            try{int code=c.getResponseCode();if(code==200)return c;String where=c.getHeaderField("Location");if(code<300||code>=400||where==null)throw new IOException("HTTP "+code);next=new URL(next,where);}
            catch(IOException error){c.disconnect();throw error;}
            c.disconnect();
        }
        throw new IOException("Redirect limit");
    }
    private void verify(File apk) throws Exception {
        if(!apk.isFile()||apk.length()!=SIZE)throw new SecurityException("Size");
        MessageDigest sha=MessageDigest.getInstance("SHA-256");
        try(InputStream in=new FileInputStream(apk)){byte[] b=new byte[16384];int n;while((n=in.read(b))!=-1)sha.update(b,0,n);}
        StringBuilder value=new StringBuilder(64);for(byte b:sha.digest())value.append(String.format(Locale.ROOT,"%02x",b&255));
        if(!SHA256.contentEquals(value))throw new SecurityException("SHA-256");
        PackageInfo apkInfo=activity.getPackageManager().getPackageArchiveInfo(apk.getAbsolutePath(),0);
        if(apkInfo==null||!PACKAGE.equals(apkInfo.packageName)||!"1.0.0".equals(apkInfo.versionName))throw new SecurityException("Package");
    }
    private void show(String state,String detail){status=state;message=detail;publish();}
    private void publish(){if(!closed)try{callback.state(new JSONObject().put("status",status).put("message",message).put("progress",progress));}catch(Exception ignored){}}
}
