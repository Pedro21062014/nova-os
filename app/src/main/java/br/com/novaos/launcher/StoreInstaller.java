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
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
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
    private static final class Release {
        final String version,url,sha;
        final long size;
        final int code;
        Release(String version,int code,long size,String sha){this.code=code;
            this.version=version;this.size=size;this.sha=sha;
            this.url="https://github.com/Pedro21062014/nova-os/releases/download/nova-store-v"+version+"/Nova-Store-"+version+".apk";
        }
    }
    private static final Release CURRENT=new Release("1.0.2",3,5076713L,"067e141949dfd0f83487dd77dfd4d45ff2eb8446ae56ef70a6a74619902f8212");
    // Keeps the shortcut usable if the new asset isn't public yet. Both releases are pinned.
    private static final Release BACKUP=new Release("1.0.1",2,4965053L,"7cfe35833d0aab705c7687d7b69f5329006bcbb01420cc769ced993812173266");
    interface Callback { void state(JSONObject data); }
    private final NovaActivity activity;
    private final SharedPreferences prefs;
    private final Callback callback;
    private final ExecutorService worker=Executors.newSingleThreadExecutor();
    private volatile boolean closed;
    private String status="available", message="Baixe a Nova Store para explorar o catálogo de apps para TV.";
    private int progress, installedCode;
    StoreInstaller(NovaActivity a, Callback c){activity=a;callback=c;prefs=a.getSharedPreferences("nova-store-invitation",0);}
    private PackageInfo installedInfo(int flags){try{return activity.getPackageManager().getPackageInfo(PACKAGE,flags);}catch(PackageManager.NameNotFoundException e){return null;}}
    private boolean installed(){return installedInfo(0)!=null;}
    private int readInstalledCode(){
        PackageInfo info=installedInfo(0);
        if(info==null)return 0;
        long code=Build.VERSION.SDK_INT>=28?info.getLongVersionCode():info.versionCode;
        return (int)Math.min(Integer.MAX_VALUE,Math.max(1,code));
    }
    private boolean hasUpdate(){return installedCode>0&&installedCode<CURRENT.code;}
    synchronized boolean claimUpdateNotice(){
        int version=readInstalledCode();
        return !closed&&version>0&&version<CURRENT.code&&prefs.getInt("update-notice-code",0)<CURRENT.code
            &&prefs.edit().putInt("update-notice-code",CURRENT.code).commit();
    }
    private boolean reachedCurrent(){
        installedCode=readInstalledCode();
        if(installedCode<CURRENT.code)return false;
        UpdateFileProvider.storeStaged(activity).delete();
        show("installed","A Nova Store já está atualizada neste aparelho.");return true;
    }
    private String offerMessage(){return hasUpdate()?"Nova Store "+CURRENT.version+" disponível. Baixe a atualização sem desinstalar a loja.":"Baixe a Nova Store para explorar o catálogo de apps para TV.";}
    synchronized boolean claimInvitation(){
        return !closed&&!installed()&&!prefs.getBoolean("shown",false)&&prefs.edit().putBoolean("shown",true).commit();
    }
    void skipInvitation(){prefs.edit().putBoolean("shown",true).apply();}
    private void run(Runnable task){if(!closed)try{worker.execute(task);}catch(RejectedExecutionException ignored){}}
    void close(){closed=true;worker.shutdownNow();}
    void send(){run(()->{
        if(reachedCurrent())return;
        if("installed".equals(status))show("available",offerMessage());
        else if("permission".equals(status)&&Build.VERSION.SDK_INT>=26&&activity.getPackageManager().canRequestPackageInstalls())show("ready","Permissão concedida. Selecione Instalar para continuar.");
        else if("installing".equals(status))show("ready","A instalação não foi confirmada. Você pode tentar de novo.");
        else if("available".equals(status)&&UpdateFileProvider.storeStaged(activity).isFile())try{
            verifyStaged(UpdateFileProvider.storeStaged(activity));progress=100;show("ready","APK verificado. Pronto para instalar.");
        }catch(Exception invalid){UpdateFileProvider.storeStaged(activity).delete();show("available",offerMessage());}
        else if("available".equals(status))show("available",offerMessage());else publish();
    });}
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
            Release selected=CURRENT;
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
            progress=100;show("ready","APK verificado. Pronto para instalar.");
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
        verify(apk,hasUpdate()||apk.length()==CURRENT.size?CURRENT:BACKUP);
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
        PackageInfo apkInfo=activity.getPackageManager().getPackageArchiveInfo(apk.getAbsolutePath(),0);
        if(apkInfo==null||!PACKAGE.equals(apkInfo.packageName)||!release.version.equals(apkInfo.versionName)||apkInfo.versionCode!=release.code)throw new SecurityException("Package");
    }
    private void show(String state,String detail){status=state;message=detail;publish();}
    private void publish(){if(!closed)try{callback.state(new JSONObject().put("status",status).put("message",message).put("progress",progress).put("updateAvailable",hasUpdate()).put("targetVersion",CURRENT.version));}catch(Exception ignored){}}
}
