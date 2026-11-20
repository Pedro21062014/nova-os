package br.com.novaos.store;

import android.app.Activity;
import android.app.DownloadManager;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.view.View;
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
    private static final String HOME = "https://store.nova.invalid/index.html";
    private static final String APK = "application/vnd.android.package-archive";
    private final Map<String, String> downloads = new LinkedHashMap<>();
    private WebView web;
    private long lastRequest;
    private String lastUrl = "";
    @Override protected void onCreate(Bundle state) {
        super.onCreate(state);
        try (java.io.InputStream stream = getAssets().open("links.json")) {
            java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream();
            byte[] buffer = new byte[4096]; int n;
            while ((n=stream.read(buffer))!=-1) out.write(buffer,0,n);
            JSONArray rows=new JSONArray(out.toString("UTF-8"));
            for(int i=0;i<rows.length();i++){
                JSONObject row=rows.getJSONObject(i);
                downloads.put(row.getString("url"),row.getString("app")+"-"+row.getString("abi"));
            }
        } catch(Exception invalid){notice("Não foi possível carregar os links do catálogo.");}
        try {web=new WebView(this);} catch(RuntimeException error){notice("O Android System WebView não está disponível.");finish();return;}
        web.setBackgroundColor(0xff0b0812);
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
            @Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest r){return r.isForMainFrame()?navigate(r.getUrl()):true;}
            @Override public boolean shouldOverrideUrlLoading(WebView v,String u){return navigate(Uri.parse(u));}
            @Override public WebResourceResponse shouldInterceptRequest(WebView v,WebResourceRequest r){return local(r.getUrl());}
            @Override public WebResourceResponse shouldInterceptRequest(WebView v,String u){return local(Uri.parse(u));}
        });
        web.setDownloadListener((url,ua,disposition,mime,length)->{if(downloads.containsKey(url))navigate(Uri.parse(url));});
        setContentView(web);web.setFocusableInTouchMode(true);web.requestFocus();web.loadUrl(HOME);
    }
    private WebResourceResponse local(Uri uri){
        if(HOME.equals(uri.toString()))try {
            return new WebResourceResponse("text/html","UTF-8",200,"OK",Collections.singletonMap("Content-Security-Policy",
                "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; font-src data:; base-uri 'none'; form-action 'none'"),getAssets().open("index.html"));
        }catch(Exception ignored){}
        return new WebResourceResponse("text/plain","UTF-8",404,"Not Found",Collections.emptyMap(),new ByteArrayInputStream(new byte[0]));
    }
    private boolean navigate(Uri uri){
        String url=uri.toString();
        if(HOME.equals(url)||url.startsWith(HOME+"#"))return false;
        if(!"https".equals(uri.getScheme())||uri.getHost()==null||uri.getUserInfo()!=null)return true;
        String name=downloads.get(url);
        if(name!=null){
            long now=android.os.SystemClock.elapsedRealtime();
            if(url.equals(lastUrl)&&now-lastRequest<1500)return true;
            try {
                DownloadManager manager=(DownloadManager)getSystemService(DOWNLOAD_SERVICE);
                DownloadManager.Request request=new DownloadManager.Request(uri).setTitle("Nova Store · "+name)
                    .setMimeType(APK).setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                String file=name+"-"+System.currentTimeMillis()+".apk";
                if(android.os.Build.VERSION.SDK_INT>=29)request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS,file);
                else request.setDestinationInExternalFilesDir(this,Environment.DIRECTORY_DOWNLOADS,file);
                if(manager==null)throw new IllegalStateException("Downloads");
                manager.enqueue(request);lastUrl=url;lastRequest=now;notice("Download iniciado. Abra o APK em Downloads quando terminar.");
            }catch(RuntimeException error){notice("O gerenciador de downloads não pôde baixar este APK.");}
        }else try{startActivity(new Intent(Intent.ACTION_VIEW,uri).addCategory(Intent.CATEGORY_BROWSABLE));}
        catch(RuntimeException error){notice("Nenhum navegador disponível para abrir a fonte.");}
        return true;
    }
    private void notice(String message){Toast.makeText(this,message,Toast.LENGTH_LONG).show();}
    @Override public void onBackPressed(){
        if(web==null){super.onBackPressed();return;}
        web.evaluateJavascript("!!(window.novaStoreBack && window.novaStoreBack())",value->{if(!"true".equals(value)&&!isFinishing())finish();});
    }
    @Override protected void onDestroy(){if(web!=null){web.stopLoading();web.destroy();web=null;}super.onDestroy();}
}
