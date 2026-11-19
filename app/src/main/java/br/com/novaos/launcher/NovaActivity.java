package br.com.novaos.launcher;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.ComponentName;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.Drawable;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.util.LruCache;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.Gravity;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Button;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import javax.net.ssl.HttpsURLConnection;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Arrays;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public final class NovaActivity extends Activity {
    private static final String HOST = "nova.local";
    private static final String BASE = "https://" + HOST;
    private static final String FILMS = "https://itunes.apple.com/br/rss/topmovies/limit=12/json";
    private static final String SERIES = "https://api.tvmaze.com/shows?page=0";
    private static final long ART_TTL = 7L * 24 * 60 * 60 * 1000;
    private static final long ART_LIMIT = 6L * 1024 * 1024;
    private final ExecutorService requests = Executors.newFixedThreadPool(3);
    private final LruCache<String, byte[]> icons = new LruCache<String, byte[]>(1024 * 1024) {
        @Override protected int sizeOf(String key, byte[] data) {return data.length;}
    };
    private final Object artLock = new Object();
    private volatile Map<String, ComponentName> installed = new HashMap<>();
    private String lastApps = "";
    private long lastAppQuery = 0;
    private WebView web;
    private UpdateManager updater;
    private boolean ready;
    private final Handler startup = new Handler(Looper.getMainLooper());
    private Runnable bootDeadline;
    private void cancelBootDeadline(){if(bootDeadline!=null){startup.removeCallbacks(bootDeadline);bootDeadline=null;}}
    private void releaseWeb(){
        WebView old=web;web=null;ready=false;cancelBootDeadline();
        if(old==null)return;
        old.removeJavascriptInterface("NovaNative");
        if(old.getParent() instanceof ViewGroup)((ViewGroup)old.getParent()).removeView(old);
        old.stopLoading();old.destroy();
    }
    private void showStartupRecovery(){
        releaseWeb();
        LinearLayout panel=new LinearLayout(this);panel.setOrientation(LinearLayout.VERTICAL);
        panel.setGravity(Gravity.CENTER);panel.setPadding(32,24,32,24);panel.setBackgroundColor(0xff080d15);
        TextView title=new TextView(this);title.setText("Nova OS não conseguiu iniciar");title.setTextSize(24);title.setTextColor(0xfff6f7f9);title.setGravity(Gravity.CENTER);panel.addView(title);
        TextView detail=new TextView(this);detail.setText("Se o problema continuar, atualize o Android System WebView ou volte ao launcher anterior.");detail.setTextColor(0xffd4def0);detail.setGravity(Gravity.CENTER);detail.setPadding(0,12,0,16);panel.addView(detail);
        Button retry=new Button(this);retry.setText("Tentar novamente");retry.setOnClickListener(v->createWeb());panel.addView(retry);
        Button home=new Button(this);home.setText("Alterar launcher padrão");home.setOnClickListener(v->openRecoverySettings(Settings.ACTION_HOME_SETTINGS));panel.addView(home);
        Button settings=new Button(this);settings.setText("Abrir configurações do Android");settings.setOnClickListener(v->openRecoverySettings(Settings.ACTION_SETTINGS));panel.addView(settings);
        setContentView(panel);retry.requestFocus();
    }
    private void openRecoverySettings(String action){
        try{startActivity(new Intent(action));}
        catch(RuntimeException e){if(!Settings.ACTION_SETTINGS.equals(action))openRecoverySettings(Settings.ACTION_SETTINGS);else error("Os ajustes não estão disponíveis neste aparelho.");}
    }

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        updater=new UpdateManager(this,stateJson->js("updateState("+JSONObject.quote(stateJson.toString())+")"));
        createWeb();
    }
    private void createWeb(){
        try {
            web = new WebView(this);
        } catch (RuntimeException unavailable) {
            showStartupRecovery();return;
        }
        getWindow().addFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        web.setBackgroundColor(0xff080d15);
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        WebSettings cfg = web.getSettings();
        cfg.setJavaScriptEnabled(true);
        cfg.setDomStorageEnabled(true);
        cfg.setAllowFileAccess(false);
        cfg.setAllowContentAccess(false);
        cfg.setJavaScriptCanOpenWindowsAutomatically(false);
        cfg.setSupportMultipleWindows(false);
        cfg.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        cfg.setMediaPlaybackRequiresUserGesture(true);
        cfg.setCacheMode(WebSettings.LOAD_NO_CACHE);
        WebView.setWebContentsDebuggingEnabled(false);
        web.setWebViewClient(new LocalClient());
        web.addJavascriptInterface(new Bridge(web), "NovaNative");
        setContentView(web);
        web.setFocusableInTouchMode(true);
        web.requestFocus();
        immersive();
        web.loadUrl(BASE + "/index.html");
        final WebView starting=web;
        bootDeadline=()->{if(web==starting&&!ready&&!isFinishing())showStartupRecovery();};
        startup.postDelayed(bootDeadline,8000);
    }
    @Override public void onWindowFocusChanged(boolean focus) { super.onWindowFocusChanged(focus); if(focus)immersive(); }
    private void immersive() {
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LAYOUT_STABLE|
            View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION|View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN|
            View.SYSTEM_UI_FLAG_HIDE_NAVIGATION|View.SYSTEM_UI_FLAG_FULLSCREEN|View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
    }
    @Override protected void onResume() {
        super.onResume();
        if(web!=null){web.onResume();if(ready){refreshApps(false);js("reopen()");if(updater!=null)updater.onResume();}}
    }
    @Override protected void onPause(){super.onPause();if(web!=null){js("suspend()");web.onPause();}}
    @Override protected void onDestroy(){if(updater!=null)updater.close();requests.shutdownNow();releaseWeb();super.onDestroy();}
    @Override protected void onNewIntent(Intent intent) {super.onNewIntent(intent);if (intent.hasCategory(Intent.CATEGORY_HOME)) js("home()");}
    @Override public void onBackPressed() {
        if (web == null || !ready) {if(!isDeviceHome())super.onBackPressed();return;}
        // Stay on Home when selected as the device launcher; Back unwinds internal screens first.
        web.evaluateJavascript("window.NovaUi&&NovaUi.back()", handled -> {
            if (!"true".equals(handled) && !isDeviceHome()) NovaActivity.super.onBackPressed();
        });
    }
    private boolean isDeviceHome(){
        ResolveInfo r=getPackageManager().resolveActivity(new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME),PackageManager.MATCH_DEFAULT_ONLY);
        return r!=null&&r.activityInfo!=null&&getPackageName().equals(r.activityInfo.packageName);
    }
    // Route remote keys explicitly so focus stays in the launcher, not the WebView viewport.
    @Override public boolean dispatchKeyEvent(KeyEvent e){
        if(!ready||web==null)return super.dispatchKeyEvent(e);
        final boolean down=e.getAction()==KeyEvent.ACTION_DOWN;
        if(!down&&e.getAction()!=KeyEvent.ACTION_UP)return super.dispatchKeyEvent(e);
        String key;
        switch(e.getKeyCode()){
            case KeyEvent.KEYCODE_DPAD_UP: key="ArrowUp";break;
            case KeyEvent.KEYCODE_DPAD_DOWN: key="ArrowDown";break;
            case KeyEvent.KEYCODE_DPAD_LEFT: key="ArrowLeft";break;
            case KeyEvent.KEYCODE_DPAD_RIGHT: key="ArrowRight";break;
            case KeyEvent.KEYCODE_DPAD_CENTER: key="Enter";break;
            default:return super.dispatchKeyEvent(e);
        }
        final boolean center="Enter".equals(key);
        final String call="window.NovaUi&&NovaUi.key("+JSONObject.quote(key)+","+down+","+(e.getRepeatCount()>0)+",true)";
        if(!center)web.evaluateJavascript(call,null);
        else web.evaluateJavascript(call, handled->{
            if(!"true".equals(handled)&&!down&&web!=null){
                web.evaluateJavascript("document.activeElement&&document.activeElement.tagName==='INPUT'", input->{
                    if("true".equals(input)&&web!=null){
                        android.view.inputmethod.InputMethodManager ime=(android.view.inputmethod.InputMethodManager)getSystemService(INPUT_METHOD_SERVICE);
                        if(ime!=null)ime.showSoftInput(web,android.view.inputmethod.InputMethodManager.SHOW_IMPLICIT);
                    }
                });
            }
        });
        return true;
    }
    private void js(String call) {runOnUiThread(()->{if(web!=null&&ready)web.evaluateJavascript("window.NovaUi&&NovaUi."+call,null);});}
    private void error(String text){if(ready)js("toast("+JSONObject.quote(text)+")");else Toast.makeText(this,text,Toast.LENGTH_SHORT).show();}
    private void refreshApps(boolean force) {
        final long now=android.os.SystemClock.elapsedRealtime();if(!force&&now-lastAppQuery<600)return;lastAppQuery=now;
        requests.execute(()->{
            PackageManager pm=getPackageManager();Map<String,ComponentName> ids=new LinkedHashMap<>();JSONArray data=new JSONArray();
            Map<String,ResolveInfo> visible=new LinkedHashMap<>();
            for(String category:new String[]{Intent.CATEGORY_LEANBACK_LAUNCHER,Intent.CATEGORY_LAUNCHER}){
                for(ResolveInfo r:pm.queryIntentActivities(new Intent(Intent.ACTION_MAIN).addCategory(category),0)){
                    if(r.activityInfo==null||!r.activityInfo.exported||getPackageName().equals(r.activityInfo.packageName))continue;
                    if(!visible.containsKey(r.activityInfo.packageName)) visible.put(r.activityInfo.packageName,r);
                }
            }
            ArrayList<String> names=new ArrayList<>(visible.keySet());
            Collections.sort(names);
            for(String name:names){
                ResolveInfo r=visible.get(name);ComponentName c=new ComponentName(r.activityInfo.packageName,r.activityInfo.name);String id=c.flattenToShortString();ids.put(id,c);
                try{
                    CharSequence label=r.loadLabel(pm);JSONObject a=new JSONObject();
                    a.put("id",id);a.put("pkg",c.getPackageName());a.put("label",label==null?c.getPackageName():label.toString());a.put("icon","/icon?id="+Uri.encode(id));data.put(a);
                }catch(Exception ignored){}
            }
            installed=ids;
            runOnUiThread(()->{String result=data.toString();if(!lastApps.equals(result)){lastApps=result;js("updateApps("+JSONObject.quote(result)+")");}});
        });
    }
    public final class Bridge {
        private final WebView owner;
        Bridge(WebView owner){this.owner=owner;}
        @JavascriptInterface public void ready(){runOnUiThread(()->{if(web!=owner||ready)return;cancelBootDeadline();ready=true;lastApps="";refreshApps(true);if(updater!=null){updater.send();updater.onResume();}});}
        @JavascriptInterface public void updaterState(){if(updater!=null)updater.send();}
        @JavascriptInterface public void updaterConfigure(String repo,boolean automatic){if(updater!=null)updater.configure(repo,automatic);}
        @JavascriptInterface public void updaterCheck(boolean force){if(updater!=null)updater.check(force);}
        @JavascriptInterface public void updaterAutoDownload(boolean enabled){if(updater!=null)updater.autoDownload(enabled);}
        @JavascriptInterface public void updaterDownload(){if(updater!=null)updater.download();}
        @JavascriptInterface public void updaterInstall(){if(updater!=null)updater.install();}
        @JavascriptInterface public boolean isOnline(){
            ConnectivityManager cm=(ConnectivityManager)getSystemService(Context.CONNECTIVITY_SERVICE);if(cm==null)return false;
            Network n=cm.getActiveNetwork();NetworkCapabilities cap=n==null?null:cm.getNetworkCapabilities(n);return cap!=null&&cap.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET);
        }
        @JavascriptInterface public void catalog(String which){
            if(!"movies".equals(which)&&!"series".equals(which))return;
            runOnUiThread(()->{if(web==null)return;requests.execute(()->{
                try{
                    String raw=new String(download("movies".equals(which)?FILMS:SERIES,768*1024,false),StandardCharsets.UTF_8);
                    if("series".equals(which)){
                        JSONArray all=new JSONArray(raw), first=new JSONArray();
                        for(int i=0;i<Math.min(12,all.length());i++)first.put(all.getJSONObject(i));raw=first.toString();
                    }
                    js("catalogReply("+JSONObject.quote(which)+",true,"+JSONObject.quote(raw)+")");
                }catch(Exception ignored){js("catalogReply("+JSONObject.quote(which)+",false,'')");}
            });});
        }
        @JavascriptInterface public void launch(String id){runOnUiThread(()->{
            ComponentName c=installed.get(id);if(c==null){error("O aplicativo não está disponível.");return;}
            try{startActivity(Intent.makeMainActivity(c));}catch(RuntimeException e){error("Não foi possível abrir este aplicativo.");refreshApps(true);}
        });}
        @JavascriptInterface public void openExternal(String url){
            if(!allowedLink(url))return;
            runOnUiThread(()->{
                try{startActivity(new Intent(Intent.ACTION_VIEW,Uri.parse(url)).addCategory(Intent.CATEGORY_BROWSABLE));}
                catch(RuntimeException none){error("Instale um navegador ou aplicativo compatível para abrir este link.");}
            });
        }
        @JavascriptInterface public void openSystem(String where){runOnUiThread(()->{
            if("home".equals(where)){
                try {startActivity(new Intent(Settings.ACTION_HOME_SETTINGS));return;}
                catch(ActivityNotFoundException ignored) {error("Procure “App de início” nos ajustes do aparelho.");}
                catch(SecurityException ignored){error("O firmware bloqueia a troca do launcher.");return;}
            }
            try{startActivity(new Intent(Settings.ACTION_SETTINGS));}catch(RuntimeException ignored){error("Os ajustes não estão disponíveis neste aparelho.");}
        });}
    }
    private static boolean allowedLink(String raw){
        try{if(raw==null||raw.length()>1024)return false;URL u=new URL(raw);String h=u.getHost().toLowerCase(Locale.ROOT);return secure(u)&&(h.equals("itunes.apple.com")||h.equals("tv.apple.com")||h.equals("www.tvmaze.com")||h.equals("www.justwatch.com")||(h.equals("unsplash.com")&&u.getPath().startsWith("/photos/")));}catch(Exception e){return false;}
    }
    private static boolean secure(URL u){return "https".equalsIgnoreCase(u.getProtocol())&&(u.getPort()==-1||u.getPort()==443)&&u.getUserInfo()==null;}
    private static boolean allowedArt(String raw){
        try{if(raw==null||raw.length()>1024)return false;URL u=new URL(raw);String h=u.getHost().toLowerCase(Locale.ROOT);return secure(u)&&(h.matches("is[0-9]+-ssl\\.mzstatic\\.com")||h.equals("static.tvmaze.com"));}catch(Exception e){return false;}
    }
    private static byte[] read(InputStream in,int limit) throws IOException {
        try(InputStream source=in; ByteArrayOutputStream result=new ByteArrayOutputStream()){
            byte[] b=new byte[4096];int n,total=0;while((n=source.read(b))!=-1){total+=n;if(total>limit)throw new IOException("Response too large");result.write(b,0,n);}return result.toByteArray();
        }
    }
    private static byte[] download(String url,int limit,boolean image) throws IOException{
        HttpsURLConnection c=(HttpsURLConnection)new URL(url).openConnection();
        c.setConnectTimeout(4500);c.setReadTimeout(5000);c.setInstanceFollowRedirects(false);c.setRequestProperty("User-Agent","Nova OS Launcher/1.0");
        try{
            if(c.getResponseCode()!=200)throw new IOException("HTTP status "+c.getResponseCode());
            String type=c.getContentType();if(image&&(type==null||!(type.startsWith("image/jpeg")||type.startsWith("image/png")||type.startsWith("image/webp"))))throw new IOException("Unexpected image format");
            if(c.getContentLength()>limit)throw new IOException("Response too large");
            return read(c.getInputStream(),limit);
        }finally{c.disconnect();}
    }
    private byte[] icon(String id) throws IOException{
        ComponentName c=installed.get(id);if(c==null)throw new IOException("Missing icon");
        byte[] existing=icons.get(id);if(existing!=null)return existing;
        try{
            Drawable d=getPackageManager().getActivityIcon(c);
            Bitmap b=Bitmap.createBitmap(96,96,Bitmap.Config.ARGB_8888);Canvas canvas=new Canvas(b);
            d.setBounds(2,2,94,94);d.draw(canvas);ByteArrayOutputStream out=new ByteArrayOutputStream();b.compress(Bitmap.CompressFormat.PNG,100,out);b.recycle();
            byte[] data=out.toByteArray();icons.put(id,data);return data;
        }catch(PackageManager.NameNotFoundException e){throw new IOException(e);}
    }
    private static String hash(String s) throws Exception{byte[] d=MessageDigest.getInstance("SHA-256").digest(s.getBytes(StandardCharsets.UTF_8));StringBuilder b=new StringBuilder();for(byte n:d)b.append(String.format(Locale.ROOT,"%02x",n&255));return b.toString();}
    private byte[] art(String url) throws Exception{
        File base=new File(getCacheDir(),"covers"); if(!base.isDirectory())base.mkdirs();
        File file=new File(base,hash(url));
        if(file.isFile()&&System.currentTimeMillis()-file.lastModified()<ART_TTL)return read(new FileInputStream(file),340*1024);
        byte[] data;
        try{data=download(url,340*1024,true);}catch(IOException e){if(file.isFile())return read(new FileInputStream(file),340*1024);throw e;}
        synchronized(artLock){
            File tmp=File.createTempFile("cover-",".tmp",base);
            try{try(FileOutputStream out=new FileOutputStream(tmp)){out.write(data);}tmp.renameTo(file);}finally{if(tmp.exists())tmp.delete();}
            File[] files=base.listFiles();if(files!=null){Arrays.sort(files,(a,b)->Long.compare(a.lastModified(),b.lastModified()));long size=0;for(File f:files)size+=f.length();for(File f:files){if(size<=ART_LIMIT)break;long len=f.length();if(f.delete())size-=len;}}
        }
        return data;
    }
    private static String type(String p){
        if(p.endsWith(".json"))return "application/json";if(p.endsWith(".html"))return "text/html";if(p.endsWith(".css"))return "text/css";if(p.endsWith(".js"))return "application/javascript";if(p.endsWith(".woff2"))return "font/woff2";if(p.endsWith(".webp"))return "image/webp";return "application/octet-stream";
    }
    private static String bitmapType(byte[] d){if(d.length>11&&d[0]=='R'&&d[8]=='W'&&d[9]=='E')return "image/webp";if(d.length>3&&(d[0]&255)==137&&d[1]=='P')return "image/png";return "image/jpeg";}
    private static WebResourceResponse bytes(String mime,byte[] data){return new WebResourceResponse(mime,null,new ByteArrayInputStream(data));}
    private static WebResourceResponse notFound(){return new WebResourceResponse("text/plain","UTF-8",404,"Not Found",new HashMap<>(),new ByteArrayInputStream(new byte[0]));}
    private final class LocalClient extends WebViewClient {
        @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest r){return true;}
        @Override public boolean shouldOverrideUrlLoading(WebView view,String url){return true;}
        @Override public WebResourceResponse shouldInterceptRequest(WebView view,WebResourceRequest r){
            return "GET".equals(r.getMethod())?intercept(r.getUrl()):notFound();
        }
        @Override public WebResourceResponse shouldInterceptRequest(WebView view,String url){return intercept(Uri.parse(url));}
        private WebResourceResponse intercept(Uri u){
            if(!"https".equals(u.getScheme())||!HOST.equals(u.getHost())||u.getPort()!=-1)return notFound();
            String path=u.getPath();if(path==null)return notFound();
            try{
                if(path.equals("/icon"))return bytes("image/png",icon(u.getQueryParameter("id")));
                if(path.equals("/art")){String url=u.getQueryParameter("url");if(!allowedArt(url))return notFound();byte[] d=art(url);return bytes(bitmapType(d),d);}
                if(path.equals("/"))path="/index.html";
                if(!path.matches("/(index\\.html|app\\.js|style\\.css|manrope\\.woff2|wallpapers/(list\\.json|(braies|moraine|reine|aoraki)\\.webp)|img/(dolomitas|brand/(apple|hbo|netflix|nova-os-header|plex|prime|spotify|youtube)|media/(dune|hunger|interstellar|severance)(-poster)?)\\.webp)"))return notFound();
                String mime=type(path);return new WebResourceResponse(mime,mime.startsWith("text/")||(mime.equals("application/javascript")||mime.equals("application/json"))?"UTF-8":null,getAssets().open(path.substring(1)));
            }catch(Exception ignored){return notFound();}
        }
    }
}
