package br.com.novaos.iptv;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.AtomicFile;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.IOException;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Collections;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;
import javax.net.ssl.HttpsURLConnection;
import org.json.JSONArray;
import org.json.JSONObject;
import org.json.JSONTokener;

/** Fixed, data-only source. Keeps serving the last valid catalog if GitHub is unreachable. */
final class IptvFeed {
    static final String PATH="/catalog-feed.json";
    private static final String RAW="https://raw.githubusercontent.com/Pedro21062014/nova-os/refs/heads/nova-iptv-app/feed/catalogo-v1.json";
    private static final int MAX=4*1024*1024;
    private static final Pattern ID=Pattern.compile("[a-z0-9][a-z0-9-]{0,63}"), DOMAIN=Pattern.compile("(?:[a-z0-9-]+\\.)+[a-z]{2,63}");
    private static final Pattern ENTRY=Pattern.compile("#EXTINF:-1 tvg-id=\"([a-z0-9-]+)\" group-title=\"[^\"\\r\\n]+\",[^\\r\\n]+");
    private static final String WEBP="data:image/webp;base64,";
    private final AtomicFile cache;
    private final SharedPreferences prefs;
    private volatile Snapshot latest,previous;
    private String etag;
    private boolean loaded;
    IptvFeed(Context context){cache=new AtomicFile(new File(context.getFilesDir(),"iptv-catalog-v1.json"));prefs=context.getSharedPreferences("iptv-catalog-meta",0);}
    static final class Snapshot {
        final byte[] raw,playlist;final String hash;final Map<String,String> streams;
        Snapshot(byte[] data,String digest,String list,Map<String,String> hls){raw=data;hash=digest;playlist=list.getBytes(StandardCharsets.UTF_8);streams=Collections.unmodifiableMap(hls);}
    }
    static final class Result {final Snapshot snapshot;final String state;Result(Snapshot snap,String value){snapshot=snap;state=value;}}
    Snapshot forRevision(String rev){
        if(rev==null)return null;Snapshot now=latest,old=previous;
        if(now!=null&&rev.equals(now.hash))return now;
        return old!=null&&rev.equals(old.hash)?old:null;
    }
    private void loadCache(){
        if(!loaded){loaded=true;try(InputStream in=cache.openRead()){
            latest=parse(read(in));if(latest.hash.equals(prefs.getString("hash","")))etag=prefs.getString("etag",null);
        }catch(Exception ignored){}}
    }
    synchronized Result cached(){loadCache();return new Result(latest,latest==null?"bundled":"cache");}
    synchronized Result refresh(){
        loadCache();
        HttpsURLConnection c=null;
        try{
            c=(HttpsURLConnection)new URL(RAW).openConnection();c.setConnectTimeout(4500);c.setReadTimeout(7000);c.setUseCaches(false);c.setInstanceFollowRedirects(false);
            c.setRequestProperty("Accept","application/json");c.setRequestProperty("Cache-Control","no-cache");
            if(latest!=null&&etag!=null)c.setRequestProperty("If-None-Match",etag);
            int code=c.getResponseCode();
            if(code==304&&latest!=null)return new Result(latest,"online");
            check(code==200&&c.getContentLength()<=MAX);
            byte[] raw;try(InputStream in=c.getInputStream()){raw=read(in);}
            String digest=sha(raw);Snapshot next=latest!=null&&latest.hash.equals(digest)?latest:parse(raw);
            String responseTag=c.getHeaderField("ETag");if(responseTag!=null&&responseTag.length()>200)responseTag=null;
            if(next!=latest){
                FileOutputStream out=null;
                try{out=cache.startWrite();out.write(raw);cache.finishWrite(out);}
                catch(IOException failure){if(out!=null)cache.failWrite(out);}
                previous=latest;latest=next;
            }
            etag=responseTag;prefs.edit().putString("hash",digest).putString("etag",etag).apply();
            return new Result(next,"online");
        }catch(Exception failure){return new Result(latest,latest==null?"bundled":"cache");}
        finally{if(c!=null)c.disconnect();}
    }
    static Snapshot parse(byte[] raw)throws Exception{
        check(raw.length>0&&raw.length<=MAX);JSONTokener parser=new JSONTokener(new String(raw,StandardCharsets.UTF_8));Object v=parser.nextValue();check(v instanceof JSONObject&&parser.nextClean()==0);JSONObject envelope=(JSONObject)v;
        check(envelope.optInt("schema",0)==1);JSONObject featured=envelope.getJSONObject("featured"),data=envelope.getJSONObject("catalog"),media=envelope.getJSONObject("media");
        check(media.length()>0&&media.length()<=640);java.util.Iterator<String> keys=media.keys();
        while(keys.hasNext()){String key=keys.next();check(ID.matcher(key).matches()&&!"logo".equals(key));String uri=text(media.get(key),360000,false);check(webp(uri));}
        check(data.optInt("schema",0)==1);JSONArray sources=array(data,"sources",3,20);for(int i=0;i<sources.length();i++)url(sources.get(i),false);
        JSONArray channels=array(data,"channels",1,160),movies=array(data,"movies",1,300),series=array(data,"series",1,120);
        Set<String> ids=new HashSet<>(),movieIds=new HashSet<>();Map<String,String> streams=new LinkedHashMap<>(),exported=new LinkedHashMap<>();int episodes=0;
        for(int i=0;i<channels.length();i++){JSONObject row=channels.getJSONObject(i);String id=row(row,ids,media,false),kind=text(row.get("kind"),12,false);text(row.get("mark"),30,false);
            check(kind.equals("hls")||kind.equals("embed")||kind.equals("website"));
            if(kind.equals("hls")){String link=url(row.get("stream"),false);streams.put(id,link);exported.put(id,link);}else check(!row.has("stream"));
            if(kind.equals("embed"))url(row.get("embed"),true);else check(!row.has("embed"));}
        for(int i=0;i<movies.length();i++){JSONObject row=movies.getJSONObject(i);String id=row(row,ids,media,true);check("movies".equals(row.opt("type")));movieIds.add(id);playable(row,id,exported);}
        for(int i=0;i<series.length();i++){JSONObject row=series.getJSONObject(i);row(row,ids,media,true);check("series".equals(row.opt("type"))&&!row.has("stream")&&!row.has("embed"));
            if(row.has("episodes")){JSONArray eps=array(row,"episodes",1,100);episodes+=eps.length();check(episodes<=1200);
                for(int j=0;j<eps.length();j++){JSONObject e=eps.getJSONObject(j);String id=id(e,ids);text(e.get("name"),160,false);url(e.get("source"),false);int number=e.getInt("number");check(number>=1&&number<=999);playable(e,id,exported);}}}
        String hero=text(featured.get("id"),64,false);check(movieIds.contains(hero));text(featured.get("label"),100,false);text(featured.get("credit"),130,true);
        String list=text(envelope.get("playlist"),390000,false);check(!list.contains("\r")&&list.endsWith("\n"));validatePlaylist(list,exported);
        return new Snapshot(raw,sha(raw),list,streams);
    }
    private static String row(JSONObject row,Set<String> ids,JSONObject media,boolean vod)throws Exception{
        String id=id(row,ids);text(row.get("name"),160,false);text(row.get("genre"),100,false);url(row.get("source"),false);
        if(vod){String art=text(row.get("art"),64,false);check(media.has(art));text(row.get("year"),45,true);}
        if(row.has("alternative"))url(row.get("alternative"),false);if(row.has("licenseUrl"))url(row.get("licenseUrl"),false);
        if(row.has("description"))text(row.get("description"),5000,true);return id;
    }
    private static String id(JSONObject x,Set<String> ids)throws Exception{String v=text(x.get("id"),64,false);check(ID.matcher(v).matches()&&ids.add(v));return v;}
    private static void playable(JSONObject row,String id,Map<String,String> exported)throws Exception{
        String kind=text(row.get("kind"),14,false);check(!row.has("embed"));
        if("website".equals(kind)){check(!row.has("stream"));return;}
        check("video".equals(kind)||"hls-vod".equals(kind));exported.put(id,url(row.get("stream"),false));if(row.has("licenseUrl"))url(row.get("licenseUrl"),false);
    }
    private static void validatePlaylist(String list,Map<String,String> expected)throws Exception{
        String[] lines=list.split("\n",-1);check(lines.length>=3&&"#EXTM3U".equals(lines[0])&&"#PLAYLIST:Nova IPTV | Catálogo aberto".equals(lines[1]));
        Set<String> seen=new HashSet<>();
        for(int i=2;i<lines.length-1;i++){
            String line=lines[i];if(line.startsWith("# ")){check(line.length()<4300);continue;}
            java.util.regex.Matcher m=ENTRY.matcher(line);check(m.matches()&&i+1<lines.length-1);String id=m.group(1);
            check(seen.add(id)&&lines[++i].equals(expected.get(id)));
        }
        check(seen.size()==expected.size());
    }
    private static JSONArray array(JSONObject o,String key,int min,int max)throws Exception{JSONArray a=o.getJSONArray(key);check(a.length()>=min&&a.length()<=max);return a;}
    private static String text(Object value,int max,boolean empty)throws Exception{check(value instanceof String);String s=(String)value;check(s.length()<=max&&(empty||s.length()>0));return s;}
    private static String url(Object any,boolean embed)throws Exception{
        String value=text(any,2000,false);check(value.startsWith("https://"));for(int i=0;i<value.length();i++){char ch=value.charAt(i);check(ch>32&&ch!=127&&ch!='\\'&&ch!='<'&&ch!='>'&&ch!='\"');}
        URL u=new URL(value);String host=u.getHost().toLowerCase(Locale.ROOT);int port=u.getPort();boolean cdnPort=(port==8181&&host.equals("fpa-gateway.tvcultura.com.br"))||(port==8443&&host.equals("streaming.procergs.com.br"))||(port==1443&&host.equals("5b33b873179a2.streamlock.net"));
        check(u.getUserInfo()==null&&(port==-1||port==443||cdnPort)&&DOMAIN.matcher(host).matches()&&!host.endsWith(".local")&&!host.endsWith(".localhost")&&!host.endsWith(".invalid")&&!host.endsWith(".internal"));
        if(embed)check("geo.dailymotion.com".equals(host)&&u.getPath().matches("/player/[A-Za-z0-9]+\\.html"));return value;
    }
    private static boolean webp(String s){
        if(!s.startsWith(WEBP+"UklGR")||(s.length()-WEBP.length())%4!=0)return false;
        for(int i=WEBP.length();i<s.length();i++){char c=s.charAt(i);if((c>='0'&&c<='9')||(c>='a'&&c<='z')||(c>='A'&&c<='Z')||c=='+'||c=='/'||(c=='='&&i>=s.length()-2))continue;return false;}return true;
    }
    private static byte[] read(InputStream in)throws IOException{ByteArrayOutputStream out=new ByteArrayOutputStream();byte[] b=new byte[16384];int n;while((n=in.read(b))!=-1){if(out.size()+n>MAX)throw new IOException("Tamanho do catálogo");out.write(b,0,n);}return out.toByteArray();}
    private static String sha(byte[] b)throws Exception{StringBuilder hex=new StringBuilder(64);for(byte v:MessageDigest.getInstance("SHA-256").digest(b))hex.append(String.format(Locale.ROOT,"%02x",v&255));return hex.toString();}
    private static void check(boolean ok)throws IOException{if(!ok)throw new IOException("Catálogo inválido");}
}
