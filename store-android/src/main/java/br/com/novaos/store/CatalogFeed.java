package br.com.novaos.store;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Base64;
import android.os.SystemClock;
import android.util.AtomicFile;
import android.util.JsonReader;
import android.util.JsonToken;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.StringReader;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;
import javax.net.ssl.HttpsURLConnection;
import org.json.JSONArray;
import org.json.JSONObject;
import org.json.JSONTokener;

/** Fixed-source, bounded HTTPS feed. Invalid or unavailable syncs cannot overwrite the last good catalog. */
final class CatalogFeed {
    static final String PATH = "/catalogo.json";
    static final String RAW = "https://raw.githubusercontent.com/Pedro21062014/nova-os/refs/heads/nova-store-app/catalogo.json";
    private static final int CAP = 12 * 1024 * 1024;
    private static final long INTERVAL = 5 * 60 * 1000;
    private static final Pattern HTTPS = Pattern.compile("https://(?:[a-z0-9-]+\\.)+[a-z]{2,63}(?:[/?#][^\\s<>\"'\\\\\\x00-\\x20\\x7f]*)?",Pattern.CASE_INSENSITIVE);
    private static final Pattern APK = Pattern.compile("https://[^/]+/[^?#]+\\.apk",Pattern.CASE_INSENSITIVE);
    private static final Pattern ID = Pattern.compile("[a-z0-9][a-z0-9-]{0,49}");
    private static final Pattern PKG = Pattern.compile("[a-z0-9_]+(?:\\.[a-z0-9_]+)+",Pattern.CASE_INSENSITIVE);
    private static final Pattern ABI = Pattern.compile("[a-z0-9_-]{1,25}",Pattern.CASE_INSENSITIVE);
    private static final Pattern TONE = Pattern.compile("#[a-f0-9]{6}",Pattern.CASE_INSENSITIVE);
    private static final Set<String> CATEGORIES = new HashSet<>(Arrays.asList("video","live","music","files","photo","net","game","personal","tool"));
    private static final Set<String> VARIANTS = new HashSet<>(Arrays.asList("universal","arm64-v8a","armeabi-v7a","x86","x86_64"));
    private final AtomicFile cache;
    private final SharedPreferences prefs;
    private volatile Snapshot current, previous;
    private boolean loaded;
    private long lastAttempt=Long.MIN_VALUE;
    private String etag;
    static final class Snapshot {
        final byte[] bytes;
        final String digest;
        final Map<String,Apk> links;
        final Map<String,String> images;
        Snapshot(byte[] b,String sha,Map<String,Apk> l,Map<String,String> pictures){bytes=b;digest=sha;links=l;images=pictures;}
    }
    static final class Apk {
        final String app, abi, pkg, hash, cert;
        final long size;
        final int code;
        Apk(String app,String abi,String pkg,String hash,long size,int code,String cert){this.app=app;this.abi=abi;this.pkg=pkg;this.hash=hash;this.size=size;this.code=code;this.cert=cert;}
        static Apk row(JSONObject row,String app,boolean rolling){return new Apk(app,row.optString("abi"),row.optString("package"),rolling?"":row.optString("sha256"),rolling?0:row.optLong("bytes"),0,row.optString("cert"));}
    }
    CatalogFeed(Context context){cache=new AtomicFile(new File(context.getFilesDir(),"catalogo-cache.json"));prefs=context.getSharedPreferences("catalog-etag",0);}
    Apk download(String url){Snapshot snap=current;return snap==null?null:snap.links.get(url);}
    byte[] media(String path){
        Snapshot a=current,b=previous;String val=a==null?null:a.images.get(path);
        if(val==null&&b!=null)val=b.images.get(path);
        return val==null?null:Base64.decode(val.substring("data:image/webp;base64,".length()),Base64.NO_WRAP);

    }
    synchronized Snapshot get(){
        if(!loaded){
            loaded=true;
            try(InputStream stream=cache.openRead()){set(parse(read(stream)));if(current.digest.equals(prefs.getString("hash","")))etag=prefs.getString("etag",null);}catch(Exception ignored){}
        }
        long now=SystemClock.elapsedRealtime();
        if(lastAttempt!=Long.MIN_VALUE&&now-lastAttempt<INTERVAL)return current;
        lastAttempt=now;
        HttpsURLConnection con=null;
        try{
            con=(HttpsURLConnection)new URL(RAW).openConnection();
            con.setConnectTimeout(5000);con.setReadTimeout(7000);con.setInstanceFollowRedirects(false);con.setUseCaches(false);
            if(current!=null&&etag!=null)con.setRequestProperty("If-None-Match",etag);
            int status=con.getResponseCode();
            if(status==304&&current!=null)return current;
            if(status!=200||con.getContentLength()>CAP)throw new IOException("Catalog response");
            byte[] bytes;try(InputStream in=con.getInputStream()){bytes=read(in);}
            String digest=hash(bytes);
            if(current==null||!current.digest.equals(digest)){
                Snapshot next=parse(bytes);
                FileOutputStream out=null;
                try{out=cache.startWrite();out.write(bytes);cache.finishWrite(out);}catch(IOException disk){if(out!=null)cache.failWrite(out);}
                set(next);
            }
            etag=con.getHeaderField("ETag");
            prefs.edit().putString("hash",digest).putString("etag",etag).apply();
        }catch(Exception ignored){/* Preserve last validated catalog; fall back to assets if there is none. */}
        finally{if(con!=null)con.disconnect();}
        return current;
    }
    private void set(Snapshot next){previous=current;current=next;}
    private static byte[] read(InputStream stream) throws IOException {
        ByteArrayOutputStream out=new ByteArrayOutputStream(64*1024);byte[] buffer=new byte[16384];int n;
        long deadline=SystemClock.elapsedRealtime()+15000;
        while((n=stream.read(buffer))!=-1){
            if(out.size()+n>CAP||SystemClock.elapsedRealtime()>deadline)throw new IOException("Catalog limit");
            out.write(buffer,0,n);
        }
        return out.toByteArray();
    }
    private static String text(Object o,int max,boolean empty) throws IOException {
        check(o instanceof String);String s=(String)o;check(s.length()<=max&&(empty||!s.isEmpty()));return s;
    }
    private static JSONArray array(Object o,int min,int max) throws IOException {
        check(o instanceof JSONArray);JSONArray a=(JSONArray)o;check(a.length()>=min&&a.length()<=max);return a;
    }
    private static long number(Object o,long min,long max) throws IOException {
        check(o instanceof Number);double x=((Number)o).doubleValue();check(x>=min&&x<=max&&Math.floor(x)==x);return (long)x;
    }
    private static void check(boolean pass) throws IOException {if(!pass)throw new IOException("Invalid catalog");}
    private static void picture(Object o) throws IOException {
        String im=text(o,350000,false), prefix="data:image/webp;base64,";
        int start=prefix.length(), end=im.length();check(im.startsWith(prefix)&&end>start);
        int base=end;
        while(base>start&&im.charAt(base-1)=='=')base--;
        check(end-base<=2&&base>start);
        for(int i=start;i<base;i++){
            char c=im.charAt(i);check(c>='a'&&c<='z'||c>='A'&&c<='Z'||c>='0'&&c<='9'||c=='+'||c=='/');
        }
    }
    static Snapshot parse(byte[] bytes) throws Exception {
        check(bytes.length<=CAP);
        String json=new String(bytes,StandardCharsets.UTF_8);
        try(JsonReader reader=new JsonReader(new StringReader(json))){
            reader.setLenient(false);reader.skipValue();check(reader.peek()==JsonToken.END_DOCUMENT);
        }
        JSONTokener parser=new JSONTokener(json);
        Object value=parser.nextValue();check(value instanceof JSONObject&&parser.nextClean()==0);
        JSONObject d=(JSONObject)value;
        number(d.opt("schema"),1,1);
        JSONArray apps=array(d.opt("apps"),1,400);
        Set<String> ids=new HashSet<>();Map<String,Apk> links=new LinkedHashMap<>();Map<String,String> media=new LinkedHashMap<>();
        String sha=hash(bytes), prefix="/remote-media/"+sha.substring(0,16)+"/";
        JSONArray official=d.has("officialApps")?array(d.opt("officialApps"),0,1):new JSONArray();
        for(int i=0;i<apps.length()+official.length();i++){
            boolean direct=i>=apps.length();
            JSONObject a=direct?official.getJSONObject(i-apps.length()):apps.getJSONObject(i);String id=text(a.opt("id"),50,false);check(ID.matcher(id).matches()&&ids.add(id));
            text(a.opt("name"),100,false); check(CATEGORIES.contains(a.opt("cat")));text(a.opt("desc"),1800,false);
            text(a.opt("price"),120,false);check(TONE.matcher(text(a.opt("tone"),7,false)).matches());
            text(a.opt("stage"),60,true);text(a.opt("galleryNote"),300,true);number(a.opt("wave"),0,999999);
            check(a.opt("added") instanceof Boolean&&a.opt("rolling") instanceof Boolean);
            picture(a.opt("logo"));String logo=prefix+id+"/logo.webp";media.put(logo,a.getString("logo"));a.put("logo",logo);a.remove("mediaSources");
            JSONArray shots=array(a.opt("shots"),2,12);for(int j=0;j<shots.length();j++){
                picture(shots.get(j));String path=prefix+id+"/"+j+".webp";media.put(path,shots.getString(j));shots.put(j,path);
            }
            if(direct)check(id.equals("youtube")&&"com.google.android.youtube.tv".equals(a.opt("package"))&&"https://www.youtube.com/tv".equals(a.opt("website"))&&HTTPS.matcher(text(a.opt("source"),1000,false)).matches());
            JSONArray apks=array(a.opt("apks"),direct?0:1,direct?0:12);
            for(int j=0;j<apks.length();j++){
                JSONObject p=apks.getJSONObject(j);String uri=text(p.opt("url"),1000,false);String abi=text(p.opt("abi"),25,false);
                check(VARIANTS.contains(abi)&&HTTPS.matcher(uri).matches()&&!uri.contains("#")&&!links.containsKey(uri)
                    &&(APK.matcher(uri.split("\\?",2)[0]).matches()||uri.equals("https://www.lonelycatgames.com/download/4-53-08?wpdmdl=3649")));
                check(HTTPS.matcher(text(p.opt("source"),1000,false)).matches());text(p.opt("version"),100,false);
                check(PKG.matcher(text(p.opt("package"),180,false)).matches());number(p.opt("minSdk"),1,100);number(p.opt("bytes"),1024,3000000000L);
                JSONArray abis=array(p.opt("abis"),0,12);for(int k=0;k<abis.length();k++)check(ABI.matcher(text(abis.get(k),25,false)).matches());
                String fileHash=p.optString("sha256","");String cert=p.optString("cert","");check((fileHash.isEmpty()||fileHash.matches("[0-9a-f]{64}"))&&(cert.isEmpty()||cert.matches("[0-9a-f]{64}")));
                links.put(uri,Apk.row(p,id,a.optBoolean("rolling")));
            }
        }
        for(String key:new String[]{"wellKnown","essentials"}){
            JSONArray rows=array(d.opt(key),0,key.equals("wellKnown")?100:24);
            for(int i=0;i<rows.length();i++) check(ids.contains(rows.get(i)));
        }
        JSONArray featured=array(d.opt("featured"),0,12);
        for(int i=0;i<featured.length();i++){
            JSONObject f=featured.getJSONObject(i);check(ids.contains(f.opt("id")));text(f.opt("label"),80,false);
            text(f.opt("line"),300,false);number(f.opt("shot"),0,11);
            JSONArray meta=array(f.opt("meta"),0,6);for(int j=0;j<meta.length();j++)text(meta.get(j),100,false);
        }
        return new Snapshot(d.toString().getBytes(StandardCharsets.UTF_8),sha,Collections.unmodifiableMap(links),Collections.unmodifiableMap(media));
    }
    private static String hash(byte[] bytes) throws Exception {
        byte[] digest=MessageDigest.getInstance("SHA-256").digest(bytes);StringBuilder hex=new StringBuilder(64);
        for(byte b:digest){hex.append(Character.forDigit(b>>4&15,16));hex.append(Character.forDigit(b&15,16));}
        return hex.toString();
    }
}
