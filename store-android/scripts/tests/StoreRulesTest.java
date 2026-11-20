package br.com.novaos.store;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import org.json.JSONObject;

public final class StoreRulesTest {
    static void check(boolean b) {if(!b)throw new AssertionError();}
    public static void main(String[] args) throws Exception {
        byte[] raw=Files.readAllBytes(Paths.get(args[0]));
        CatalogFeed.Snapshot snapshot=CatalogFeed.parse(raw);
        check(snapshot.links.size()==87&&snapshot.images.size()==271);
        CatalogFeed.Apk liv=snapshot.links.get("https://files.tivimate.com/tivimate.apk");
        check(liv!=null&&liv.size==0&&liv.hash.isEmpty()&&liv.cert.length()==64);
        check(snapshot.links.containsKey("https://www.lonelycatgames.com/download/4-53-08?wpdmdl=3649"));
        check(snapshot.bytes.length<raw.length/8);
        JSONObject shape=new JSONObject(new String(snapshot.bytes,StandardCharsets.UTF_8));
        check(shape.getJSONArray("officialApps").getJSONObject(0).getJSONArray("apks").length()==0);
        check(shape.getJSONArray("apps").getJSONObject(0).getString("logo").matches("/remote-media/[0-9a-f]{16}/vlc/logo\\.webp"));
        String json=new String(raw,StandardCharsets.UTF_8);
        reject(json.replace("https://files.tivimate.com/tivimate.apk","javascript:alert(1)"));
        reject(json.replace("com.google.android.youtube.tv","org.smarttube.stable"));
        JSONObject channel=new JSONObject(new String(Files.readAllBytes(Paths.get(args[1])),StandardCharsets.UTF_8));
        String pkg="br.com.novaos.store",url=channel.getString("url");
        check(StoreUpdates.parse(channel,2,pkg)!=null);
        check(StoreUpdates.parse(channel,3,pkg)==null);
        check(StoreUpdates.parse(channel.put("url",url.replace("github.com","example.com")),2,pkg)==null);
        check(StoreUpdates.parse(channel.put("url",url).put("sha256","short"),2,pkg)==null);
        System.out.println("Catálogo: 87 APKs, mídia WebP sob demanda e rota oficial. Atualizador rejeita downgrade, domínio externo e digest inválido.");
    }
    static void reject(String json) throws Exception {
        try{CatalogFeed.parse(json.getBytes(StandardCharsets.UTF_8));}catch(IOException expected){return;}
        throw new AssertionError("Feed inválido foi aceito");
    }
}
