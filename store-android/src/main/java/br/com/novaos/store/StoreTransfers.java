package br.com.novaos.store;

import android.app.DownloadManager;
import android.content.ClipData;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.Settings;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.security.MessageDigest;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.json.JSONObject;
import org.json.JSONArray;

final class StoreTransfers {
    static final String UPDATE="store-update";
    private static final long INCLUDED=-2;
    private final StoreActivity host;
    private final DownloadManager manager;
    private final SharedPreferences prefs;
    private final ExecutorService verifyJobs=Executors.newSingleThreadExecutor();
    private final Map<String,Job> jobs=new LinkedHashMap<>();
    private boolean closed;
    static final class Job {
        long id;String key,token,pkg,hash,cert,abi,error="";long size;int code;boolean checking;
        Job(String key,String token,String pkg,String hash,long size,int code,long id,String cert,String abi){this.abi=abi;this.cert=cert;this.key=key;this.token=token;this.pkg=pkg;this.hash=hash;this.size=size;this.code=code;this.id=id;}
        JSONObject json() throws Exception {return new JSONObject().put("key",key).put("token",token).put("pkg",pkg).put("sha",hash).put("size",size).put("code",code).put("id",id).put("cert",cert).put("abi",abi);}
    }
    StoreTransfers(StoreActivity host){
        this.host=host;manager=(DownloadManager)host.getSystemService(StoreActivity.DOWNLOAD_SERVICE);prefs=host.getSharedPreferences("downloads-v1",0);
        try{JSONArray a=new JSONArray(prefs.getString("jobs","[]"));for(int i=0;i<a.length()&&i<12;i++){
            JSONObject j=a.getJSONObject(i);String key=j.getString("key"),token=j.getString("token");
            if(key.matches("[a-z0-9][a-z0-9-]{0,49}")&&token.matches("[a-f0-9]{32}")){
                Job job=new Job(key,token,j.getString("pkg"),j.getString("sha"),j.getLong("size"),j.getInt("code"),j.getLong("id"),j.optString("cert"),j.optString("abi"));
                if(job.id>0)jobs.put(key,job);
            }
        }}catch(Exception ignored){}
        Job update=jobs.get(UPDATE);
        if(update!=null)try{int now=host.getPackageManager().getPackageInfo(host.getPackageName(),0).versionCode;
            if(update.code<=now){remove(update);save();}}
        catch(PackageManager.NameNotFoundException ignored){}
    }
    private void save(){JSONArray a=new JSONArray();for(Job j:jobs.values())if(j.id>0)try{a.put(j.json());}catch(Exception ignored){}prefs.edit().putString("jobs",a.toString()).apply();}
    synchronized void start(String url,CatalogFeed.Apk file){
        if(closed||file==null)return;
        Job old=jobs.get(file.app);
        if(old!=null){String s=state(old).optString("status");if("waiting".equals(s)||"downloading".equals(s)||"verifying".equals(s))return;remove(old);}
        if(jobs.size()>=12){host.notice("Finalize ou cancele outro download primeiro.");return;}
        String token=UUID.randomUUID().toString().replace("-","");Job j=new Job(file.app,token,file.pkg,file.hash,file.size,file.code,-1,file.cert,file.abi);jobs.put(file.app,j);
        if(StoreActivity.IPTV_URL.equals(url)&&"nova-iptv".equals(file.app)&&"br.com.novaos.iptv".equals(file.pkg)&&file.size>0&&!file.hash.isEmpty()&&!file.cert.isEmpty()){j.id=INCLUDED;save();return;}
        try{
            DownloadManager.Request req=new DownloadManager.Request(Uri.parse(url)).setTitle("Nova Store · "+file.app)
                .setMimeType(StoreApkProvider.MIME).setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE)
                .setDestinationInExternalFilesDir(host,Environment.DIRECTORY_DOWNLOADS,token+".apk");
            if(manager==null)throw new IOException("Downloads");j.id=manager.enqueue(req);
        }catch(Exception failure){j.error="Não foi possível iniciar o download.";}
        save();
    }
    synchronized void cancel(String key){Job j=jobs.get(key);if(j!=null&&!j.checking){remove(j);save();}}
    private void remove(Job j){jobs.remove(j.key);if(manager!=null&&j.id>0)try{manager.remove(j.id);}catch(RuntimeException ignored){}StoreApkProvider.file(host,j.token).delete();}
    private JSONObject state(Job j){
        String s="failed",msg=j.error;long done=0,total=0;
        if(j.checking){s="verifying";msg="Conferindo o APK…";}
        else if(msg.isEmpty()&&j.id==INCLUDED){s="ready";msg="APK incluído na Nova Store";done=total=j.size;}
        else if(msg.isEmpty()&&j.id>0&&manager!=null)try(Cursor c=manager.query(new DownloadManager.Query().setFilterById(j.id))){
            if(c!=null&&c.moveToFirst()){
                done=c.getLong(c.getColumnIndexOrThrow(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR));
                total=c.getLong(c.getColumnIndexOrThrow(DownloadManager.COLUMN_TOTAL_SIZE_BYTES));
                switch(c.getInt(c.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS))){
                    case DownloadManager.STATUS_PENDING:s="waiting";msg="Aguardando download…";break;
                    case DownloadManager.STATUS_PAUSED:s="waiting";msg="Aguardando conexão…";break;
                    case DownloadManager.STATUS_RUNNING:s="downloading";msg="Baixando…";break;
                    case DownloadManager.STATUS_SUCCESSFUL:s="ready";msg="Download concluído";break;
                    default:msg="Não foi possível concluir o download. Tente novamente.";
                }
            }
        }catch(RuntimeException ignored){}
        if(msg.isEmpty())msg="Download indisponível. Tente novamente.";
        int percent="ready".equals(s)?100:total>0?(int)Math.max(0,Math.min(99,done*100.0/total)):-1;
        try{return new JSONObject().put("status",s).put("abi",j.abi).put("message",msg).put("progress",percent).put("bytes",Math.max(0,done)).put("total",Math.max(0,total));}catch(Exception ignored){return new JSONObject();}
    }
    synchronized JSONObject states(){JSONObject out=new JSONObject();for(Job job:jobs.values())try{out.put(job.key,state(job));}catch(Exception ignored){}return out;}
    synchronized void install(String key){
        Job j=jobs.get(key);if(closed||j==null||j.checking||!"ready".equals(state(j).optString("status")))return;
        if(Build.VERSION.SDK_INT>=26&&!host.getPackageManager().canRequestPackageInstalls()){
            host.runOnUiThread(()->{try{
                host.notice("Autorize esta fonte e volte para tocar em Instalar novamente.");
                host.startActivity(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,Uri.parse("package:"+host.getPackageName())));
            }catch(RuntimeException error){host.notice("A permissão de instalação deve ser ativada nos ajustes do Android.");}});return;
        }
        j.checking=true;verifyJobs.execute(()->validateAndOpen(j));
    }
    private void validateAndOpen(Job j){
        File output=StoreApkProvider.file(host,j.token);
        try{
            File input=null;
            if(j.id!=INCLUDED){File dir=host.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);if(dir==null)throw new IOException("Unavailable");input=new File(dir,j.token+".apk");}
            long limit=j.size>0?j.size:3_000_000_000L;
            if(input!=null&&(!input.isFile()||input.length()>limit||(j.size>0&&input.length()!=j.size)))throw new IOException("Size");
            MessageDigest sha=MessageDigest.getInstance("SHA-256");
            try(InputStream in=input==null?host.getAssets().open(StoreActivity.IPTV_ASSET):new FileInputStream(input);FileOutputStream out=new FileOutputStream(output)){
                byte[] b=new byte[32768];int n;long count=0;
                while((n=in.read(b))!=-1){count+=n;if(count>limit||Thread.currentThread().isInterrupted())throw new IOException("Cancelled");out.write(b,0,n);sha.update(b,0,n);}
                if(j.size>0&&count!=j.size)throw new IOException("Size");
            }
            if(!j.hash.isEmpty()&&!j.hash.equals(hex(sha.digest())))throw new SecurityException("Digest");
            PackageManager pm=host.getPackageManager();PackageInfo apk=pm.getPackageArchiveInfo(output.getAbsolutePath(),PackageManager.GET_SIGNATURES);
            if(apk==null||!j.pkg.equals(apk.packageName)||apk.signatures==null||apk.signatures.length==0)throw new SecurityException("APK");
            if(!j.cert.isEmpty()&&(apk.signatures.length!=1||!j.cert.equals(hex(sha.digest(apk.signatures[0].toByteArray())))))throw new SecurityException("Signer");
            if(j.id==INCLUDED&&apk.versionCode!=1)throw new SecurityException("Version");
            if(j.code>0){PackageInfo installed=pm.getPackageInfo(host.getPackageName(),PackageManager.GET_SIGNATURES);
                if(apk.versionCode!=j.code||apk.versionCode<=installed.versionCode||!Arrays.equals(apk.signatures,installed.signatures))throw new SecurityException("Update");}
            host.runOnUiThread(()->{
                if(host.isFinishing()||host.isDestroyed())return;
                try{Uri apkUri=StoreApkProvider.uri(host,j.token);Intent i=new Intent(Intent.ACTION_VIEW).setDataAndType(apkUri,StoreApkProvider.MIME).addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    i.setClipData(ClipData.newRawUri("APK",apkUri));host.startActivity(i);
                }catch(RuntimeException e){host.notice("Não foi possível abrir o instalador do Android.");}
            });
        }catch(Exception err){output.delete();synchronized(this){j.error="O arquivo não pôde ser verificado. Tente baixar novamente.";}}
        finally{synchronized(this){j.checking=false;}}
    }
    private static String hex(byte[] bytes){StringBuilder hex=new StringBuilder();for(byte b:bytes){hex.append(Character.forDigit(b>>4&15,16));hex.append(Character.forDigit(b&15,16));}return hex.toString();}
    synchronized void close(){closed=true;verifyJobs.shutdownNow();}
}
