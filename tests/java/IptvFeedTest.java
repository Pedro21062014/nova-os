package br.com.novaos.iptv;
import org.json.JSONObject;
import java.nio.file.Paths;
import java.nio.file.Files;
import java.nio.charset.StandardCharsets;

public final class IptvFeedTest {
    interface Change { void apply(JSONObject fixture)throws Exception; }
    static void rejects(byte[] raw,Change change)throws Exception{
        JSONObject fixture=new JSONObject(new String(raw,StandardCharsets.UTF_8));change.apply(fixture);
        try{IptvFeed.parse(fixture.toString().getBytes(StandardCharsets.UTF_8));throw new AssertionError("Fixture inválida aceita");}
        catch(java.io.IOException expected){}
    }
    public static void main(String... args)throws Exception{
        byte[] raw=Files.readAllBytes(Paths.get(args[0]));IptvFeed.Snapshot snap=IptvFeed.parse(raw);
        if(snap.hash.length()!=64||snap.streams.size()!=14||!snap.streams.containsKey("record-mt"))throw new AssertionError("Sinais inconsistentes");
        rejects(raw,j->j.getJSONObject("featured").put("id","ausente"));
        rejects(raw,j->j.getJSONObject("catalog").getJSONArray("channels").getJSONObject(0).put("stream","https://127.0.0.1/video.m3u8"));
        rejects(raw,j->j.getJSONObject("catalog").getJSONArray("movies").getJSONObject(0).put("source","javascript:alert(1)"));
        rejects(raw,j->j.getJSONObject("media").put("logo","data:image/svg+xml;base64,AAAA"));
        rejects(raw,j->j.put("playlist",j.getString("playlist").replace("#EXTM3U","#EXTM3U\n#EXTVLCOPT:example")));
        System.out.println("Feed Java: catálogo de produção aceito e dados inválidos rejeitados.");
    }
}
