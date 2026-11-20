package br.com.novaos.launcher;

import android.app.Activity;
import android.content.ClipData;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.widget.Toast;
import java.io.File;
import java.io.InputStream;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Arrays;
import java.util.Locale;
import java.util.concurrent.atomic.AtomicBoolean;

/** Installs only the build bundled into the signed launcher, and only after explicit selection. */
final class IptvOffer {
    static final String PACKAGE="br.com.novaos.iptv";
    private static final String STORE="br.com.novaos.store";
    private static final AtomicBoolean BUSY=new AtomicBoolean(false);
    private static Intent launch(Activity a,String pkg){PackageManager pm=a.getPackageManager();Intent i=pm.getLeanbackLaunchIntentForPackage(pkg);return i==null?pm.getLaunchIntentForPackage(pkg):i;}
    static boolean available(Activity a,String pkg){try{return launch(a,pkg)!=null;}catch(RuntimeException e){return false;}}
    static boolean hasStore(Activity a){try{return a.getPackageManager().getPackageInfo(STORE,0).versionCode>=6&&available(a,STORE);}catch(Exception e){return false;}}
    static void action(Activity a,String which){
        try{
            if("open".equals(which)){Intent i=launch(a,PACKAGE);if(i!=null)a.startActivity(i);else notice(a,"A Nova IPTV não está mais instalada.");return;}
            if("store".equals(which)){Intent i=hasStore(a)?launch(a,STORE):null;if(i!=null)a.startActivity(i.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP|Intent.FLAG_ACTIVITY_SINGLE_TOP).putExtra("br.com.novaos.store.APP","nova-iptv"));else notice(a,"Atualize a Nova Store para ver a ficha do app.");return;}
            if(!"install".equals(which))return;
            if(available(a,PACKAGE)){action(a,"open");return;}
            if(Build.VERSION.SDK_INT>=26&&!a.getPackageManager().canRequestPackageInstalls()){
                notice(a,"Autorize o Nova OS e, ao voltar, selecione Instalar novamente.");
                a.startActivity(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,Uri.parse("package:"+a.getPackageName())));return;
            }
            if(BUSY.compareAndSet(false,true))new Thread(()->stage(a),"nova-iptv-verify").start();
        }catch(RuntimeException e){notice(a,"Não foi possível abrir esta opção no Android.");}
    }
    private static void stage(Activity a){
        File apk=UpdateFileProvider.iptvStaged(a),temp=null;
        try{
            String expected;try(InputStream in=a.getAssets().open("nova-iptv.sha256")){byte[] all=new byte[65];int count=0,n;while(count<all.length&&(n=in.read(all,count,all.length-count))>0)count+=n;expected=new String(all,0,count,StandardCharsets.US_ASCII);}
            if(!expected.matches("[0-9a-f]{64}"))throw new SecurityException("Digest");
            temp=File.createTempFile("iptv-",".apk",a.getCacheDir());MessageDigest sha=MessageDigest.getInstance("SHA-256");
            try(InputStream in=a.getAssets().open("nova-iptv.apk");FileOutputStream out=new FileOutputStream(temp)){
                byte[] b=new byte[32768];int n;long total=0;while((n=in.read(b))!=-1){total+=n;if(total>16*1024*1024)throw new SecurityException("APK size");out.write(b,0,n);sha.update(b,0,n);}
            }
            StringBuilder digest=new StringBuilder();for(byte b:sha.digest())digest.append(String.format(Locale.ROOT,"%02x",b&255));
            if(!expected.contentEquals(digest))throw new SecurityException("APK digest");
            PackageManager pm=a.getPackageManager();PackageInfo file=pm.getPackageArchiveInfo(temp.getAbsolutePath(),PackageManager.GET_SIGNATURES);
            PackageInfo launcher=pm.getPackageInfo(a.getPackageName(),PackageManager.GET_SIGNATURES);
            if(file==null||!PACKAGE.equals(file.packageName)||file.versionCode!=1||file.signatures==null||file.signatures.length==0||!Arrays.equals(launcher.signatures,file.signatures))throw new SecurityException("APK signer or package");
            if(!temp.renameTo(apk))throw new java.io.IOException("Cache");
            a.runOnUiThread(()->{if(a.isDestroyed()||a.isFinishing()||!a.hasWindowFocus())return;
                try{Uri u=UpdateFileProvider.iptvUri(a);Intent i=new Intent(Intent.ACTION_VIEW).setDataAndType(u,UpdateFileProvider.MIME).addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    i.setClipData(ClipData.newRawUri("Nova IPTV",u));a.startActivity(i);
                }catch(RuntimeException e){notice(a,"O instalador do Android não está disponível.");}
            });
        }catch(Exception e){a.runOnUiThread(()->notice(a,"Não foi possível verificar a Nova IPTV deste launcher."));}
        finally{if(temp!=null)temp.delete();BUSY.set(false);}
    }
    private static void notice(Activity a,String text){if(!a.isFinishing())Toast.makeText(a,text,Toast.LENGTH_LONG).show();}
}
