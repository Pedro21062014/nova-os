package br.com.novaos.store;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Build;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import java.io.ByteArrayInputStream;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import org.json.JSONArray;
import org.json.JSONObject;

public final class StoreActivity extends Activity {
    static final String IPTV_URL="https://github.com/Pedro21062014/nova-os/releases/download/nova-iptv-v1.0.0/Nova-IPTV-1.0.0.apk";
    static final String IPTV_ASSET="nova-iptv.apk";
    private static final String OPEN_APP="br.com.novaos.store.APP";
    private boolean iptvRequested;
    private static final String HOME = "https://store.nova.invalid/index.html";
    private static final String ORIGIN="https://store.nova.invalid";
    private static final String YOUTUBE="com.google.android.youtube.tv";
    private final Map<String, CatalogFeed.Apk> downloads = new LinkedHashMap<>();
    private WebView web;
    private CatalogFeed feed;
    private StoreTransfers transfers;
    private StoreUpdates updates;
    private volatile boolean youtubeInstalled;
    private final JSONArray deviceAbis=new JSONArray(java.util.Arrays.asList(Build.SUPPORTED_ABIS));
    @Override protected void onCreate(Bundle state) {
        super.onCreate(state);
        iptvRequested=getIntent()!=null&&"nova-iptv".equals(getIntent().getStringExtra(OPEN_APP));
        feed=new CatalogFeed(this);
        transfers=new StoreTransfers(this);updates=new StoreUpdates(this);
        try (java.io.InputStream stream = getAssets().open("links.json")) {
            java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream();
            byte[] buffer = new byte[4096]; int n;
            while ((n=stream.read(buffer))!=-1) out.write(buffer,0,n);
            JSONArray rows=new JSONArray(out.toString("UTF-8"));
            for(int i=0;i<rows.length();i++){
                JSONObject row=rows.getJSONObject(i);
                downloads.put(row.getString("url"),CatalogFeed.Apk.row(row,row.getString("app"),row.optBoolean("rolling")));
            }
        } catch(Exception invalid){notice("Não foi possível carregar os links do catálogo.");}
        try {web=new WebView(this);} catch(RuntimeException error){notice("O Android System WebView não está disponível.");finish();return;}
        web.setBackgroundColor(0xff101412);
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        WebSettings settings=web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setSupportMultipleWindows(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        WebView.setWebContentsDebuggingEnabled(false);
        web.setWebViewClient(new WebViewClient(){
            @Override public void onPageFinished(WebView v,String url){if(HOME.equals(url))openPendingIptv();}
            @Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest r){return r.isForMainFrame()?navigate(r.getUrl()):true;}
            @Override public boolean shouldOverrideUrlLoading(WebView v,String u){return navigate(Uri.parse(u));}
            @Override public WebResourceResponse shouldInterceptRequest(WebView v,WebResourceRequest r){return local(r.getUrl());}
            @Override public WebResourceResponse shouldInterceptRequest(WebView v,String u){return local(Uri.parse(u));}
        });
        web.addJavascriptInterface(new Bridge(),"NovaStore");
        web.setDownloadListener((url,ua,disposition,mime,length)->{if(downloadFile(url)!=null)navigate(Uri.parse(url));});
        setContentView(web);web.setFocusableInTouchMode(true);web.requestFocus();web.loadUrl(HOME);
    }
    @Override protected void onNewIntent(Intent intent){super.onNewIntent(intent);setIntent(intent);if(intent!=null&&"nova-iptv".equals(intent.getStringExtra(OPEN_APP))){iptvRequested=true;openPendingIptv();}}
    private void openPendingIptv(){if(!iptvRequested||web==null)return;web.evaluateJavascript("!!(window.novaStoreOpenIptv && window.novaStoreOpenIptv())",v->{if("true".equals(v))iptvRequested=false;});}
    private CatalogFeed.Apk downloadFile(String url){if(IPTV_URL.equals(url))return downloads.get(url);CatalogFeed.Apk fromFeed=feed.download(url);return fromFeed==null?downloads.get(url):fromFeed;}
    private WebResourceResponse local(Uri uri){
        if(("https://store.nova.invalid"+CatalogFeed.PATH).equals(uri.toString())){
            CatalogFeed.Snapshot snapshot=feed.get();
            if(snapshot!=null){
                Map<String,String> headers=new LinkedHashMap<>();headers.put("Cache-Control","no-store");
                headers.put("X-Nova-Catalog-Digest",snapshot.digest);headers.put("X-Content-Type-Options","nosniff");
                return new WebResourceResponse("application/json","UTF-8",200,"OK",headers,new ByteArrayInputStream(snapshot.bytes));
            }
        }
        if(ORIGIN.equals(uri.getScheme()+"://"+uri.getAuthority())&&uri.getQuery()==null){
            String path=uri.getPath();
            try{
                if(path!=null&&path.matches("/local-media/[a-z0-9-]{1,50}/(logo|[0-9]{1,2})\\.webp"))
                    return new WebResourceResponse("image/webp",null,200,"OK",Collections.singletonMap("Cache-Control","public, max-age=86400"),getAssets().open(path.substring(1)));
                if(path!=null&&path.matches("/remote-media/[a-f0-9]{16}/[a-z0-9-]{1,50}/(logo|[0-9]{1,2})\\.webp")){
                    byte[] data=feed.media(path);
                    if(data!=null)return new WebResourceResponse("image/webp",null,200,"OK",Collections.singletonMap("Cache-Control","public, max-age=86400"),new ByteArrayInputStream(data));
                }
            }catch(Exception ignored){}
        }
        if(HOME.equals(uri.toString()))try {
            return new WebResourceResponse("text/html","UTF-8",200,"OK",Collections.singletonMap("Content-Security-Policy",
                "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: 'self'; font-src data:; connect-src 'self'; base-uri 'none'; form-action 'none'"),getAssets().open("index.html"));
        }catch(Exception ignored){}
        return new WebResourceResponse("text/plain","UTF-8",404,"Not Found",Collections.emptyMap(),new ByteArrayInputStream(new byte[0]));
    }
    private boolean navigate(Uri uri){
        String url=uri.toString();
        if(HOME.equals(url)||url.startsWith(HOME+"#"))return false;
        if(!"https".equals(uri.getScheme())||uri.getHost()==null||uri.getUserInfo()!=null)return true;
        CatalogFeed.Apk apk=downloadFile(url);
        if(apk!=null)transfers.start(url,apk);
        else openExternal(uri,"Nenhum navegador disponível para abrir a fonte.");
        return true;
    }
    private boolean openExternal(Uri uri,String fallback){
        try{startActivity(new Intent(Intent.ACTION_VIEW,uri).addCategory(Intent.CATEGORY_BROWSABLE));return true;}
        catch(RuntimeException error){if(fallback!=null)notice(fallback);return false;}
    }
    private Intent launchFor(String pkg){
        Intent launch=getPackageManager().getLeanbackLaunchIntentForPackage(pkg);
        return launch==null?getPackageManager().getLaunchIntentForPackage(pkg):launch;
    }
    private Intent youtube(){return launchFor(YOUTUBE);}
    private void openYoutube(){
        try{Intent launch=youtube();if(launch!=null){startActivity(launch);return;}}catch(RuntimeException ignored){}
        try{startActivity(new Intent(Intent.ACTION_VIEW,Uri.parse("market://details?id="+YOUTUBE)).setPackage("com.android.vending"));return;}
        catch(RuntimeException ignored){}
        openExternal(Uri.parse("https://play.google.com/store/apps/details?id="+YOUTUBE),"Google Play indisponível nesta TV. Consulte youtube.com/tv em outro dispositivo.");
    }
    public final class Bridge {
        @JavascriptInterface public String state(){
            try{JSONObject s=new JSONObject().put("jobs",transfers.states()).put("youtube",youtubeInstalled).put("abis",deviceAbis).put("sdk",Build.VERSION.SDK_INT);
                StoreUpdates.Check check=updates.result();s.put("updateCheck",check.status);if(check.offer!=null)s.put("update",check.offer.info());return s.toString();}
            catch(Exception bad){return "{}";}
        }
        @JavascriptInterface public String appState(String url){
            CatalogFeed.Apk apk=url==null?null:downloadFile(url);if(apk==null)return "{}";
            try{
                android.content.pm.PackageInfo p=getPackageManager().getPackageInfo(apk.pkg,android.content.pm.PackageManager.GET_SIGNATURES);
                JSONObject j=new JSONObject().put("installed",true).put("version",p.versionName==null?"":p.versionName)
                    .put("code",Build.VERSION.SDK_INT>=28?p.getLongVersionCode():p.versionCode).put("open",launchFor(apk.pkg)!=null);
                if(!apk.cert.isEmpty())j.put("signer",p.signatures!=null&&p.signatures.length==1&&apk.cert.equals(StoreTransfers.hex(java.security.MessageDigest.getInstance("SHA-256").digest(p.signatures[0].toByteArray()))));
                return j.toString();
            }catch(Exception ignored){return "{}";}
        }
        @JavascriptInterface public void openApp(String url){
            CatalogFeed.Apk apk=url==null?null:downloadFile(url);if(apk==null)return;
            runOnUiThread(()->{try{Intent launch=launchFor(apk.pkg);if(launch!=null){startActivity(launch);return;}}catch(RuntimeException ignored){}notice("Não foi possível abrir este app.");});
        }
        @JavascriptInterface public void download(String url){CatalogFeed.Apk apk=downloadFile(url);if(apk!=null)transfers.start(url,apk);}
        @JavascriptInterface public void install(String key){if(key!=null)transfers.install(key);}
        @JavascriptInterface public void cancel(String key){if(key!=null)transfers.cancel(key);}
        @JavascriptInterface public void checkUpdates(){updates.check(true);}
        @JavascriptInterface public void update(){StoreUpdates.Offer next=updates.result().offer;if(next!=null)transfers.start(next.url,next.file);}
        @JavascriptInterface public void openOfficial(){runOnUiThread(()->openYoutube());}
    }
    void notice(String message){runOnUiThread(()->Toast.makeText(this,message,Toast.LENGTH_LONG).show());}
    @Override protected void onResume(){super.onResume();youtubeInstalled=youtube()!=null;updates.check(false);if(web!=null)web.evaluateJavascript("window.novaStoreRefresh && window.novaStoreRefresh()",null);}
    @Override public void onBackPressed(){
        if(web==null){super.onBackPressed();return;}
        web.evaluateJavascript("!!(window.novaStoreBack && window.novaStoreBack())",value->{if(!"true".equals(value)&&!isFinishing())finish();});
    }
    @Override protected void onDestroy(){if(web!=null){web.stopLoading();web.destroy();web=null;}transfers.close();updates.close();super.onDestroy();}
}
