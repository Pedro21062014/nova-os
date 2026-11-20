package br.com.novaos.store;

import android.os.SystemClock;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import javax.net.ssl.HttpsURLConnection;
import org.json.JSONObject;

final class StoreUpdates {
    static final String CHANNEL="https://raw.githubusercontent.com/Pedro21062014/nova-os/refs/heads/nova-store-app/atualizacao.json";
    static final String RELEASE="https://github.com/Pedro21062014/nova-os/releases/download/nova-store-v";
    private final StoreActivity host;
    private final ExecutorService worker=Executors.newSingleThreadExecutor();
    private long checked=-1;
    private boolean busy;
    private final int currentCode;
    private volatile Offer offer;
    static final class Offer {
        final String version,url;final CatalogFeed.Apk file;
        Offer(String version,String url,CatalogFeed.Apk file){this.version=version;this.url=url;this.file=file;}
        JSONObject info(){try{return new JSONObject().put("version",version).put("bytes",file.size);}catch(Exception e){return new JSONObject();}}
    }
    StoreUpdates(StoreActivity activity){host=activity;int code=Integer.MAX_VALUE;
        try{code=host.getPackageManager().getPackageInfo(host.getPackageName(),0).versionCode;}catch(Exception ignored){}currentCode=code;}
    static Offer parse(JSONObject d,int currentCode,String pkg) throws Exception {
        String version=d.getString("version"),digest=d.getString("sha256"),url=d.getString("url");long size=d.getLong("bytes"),code=d.getLong("versionCode");
        if(d.getInt("schema")!=1||!pkg.equals(d.getString("package"))||code<=currentCode||code>Integer.MAX_VALUE||
            !version.matches("[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}")||size<10000||size>80L*1024*1024||
            !digest.matches("[a-f0-9]{64}")||!url.equals(RELEASE+version+"/Nova-Store-"+version+".apk"))return null;
        return new Offer(version,url,new CatalogFeed.Apk(StoreTransfers.UPDATE,"universal",pkg,digest,size,(int)code,""));
    }
    void check(){
        long now=SystemClock.elapsedRealtime();if(busy||(checked>=0&&now-checked<300000))return;checked=now;busy=true;
        worker.execute(()->{
            HttpsURLConnection con=null;
            try{
                con=(HttpsURLConnection)new URL(CHANNEL).openConnection();con.setConnectTimeout(4500);con.setReadTimeout(5000);con.setInstanceFollowRedirects(false);
                if(con.getResponseCode()!=200||con.getContentLength()>8192)return;
                try(InputStream in=con.getInputStream();ByteArrayOutputStream out=new ByteArrayOutputStream()){
                    byte[] buffer=new byte[1024];int n;while((n=in.read(buffer))!=-1){if(out.size()+n>8192)return;out.write(buffer,0,n);}
                    offer=parse(new JSONObject(new String(out.toByteArray(),StandardCharsets.UTF_8)),currentCode,host.getPackageName());
                }
            }catch(Exception ignored){}finally{if(con!=null)con.disconnect();host.runOnUiThread(()->busy=false);}
        });
    }
    Offer offer(){return offer;}
    void close(){worker.shutdownNow();}
}
