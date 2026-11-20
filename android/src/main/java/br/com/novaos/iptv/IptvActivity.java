package br.com.novaos.iptv;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.media.AudioManager;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.TextView;
import android.widget.Toast;
import android.widget.VideoView;
import java.io.InputStream;
import java.io.ByteArrayOutputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import org.json.JSONObject;
import org.json.JSONArray;

public final class IptvActivity extends Activity {
    private static final String HOST="iptv.nova.invalid", BASE="https://"+HOST;
    private static final int EXPORT=19;
    private final Map<String,String> streams=new HashMap<>();
    private final Handler main=new Handler(Looper.getMainLooper());
    private FrameLayout root,live;
    private WebView web;
    private VideoView video;
    private View custom;
    private WebChromeClient.CustomViewCallback customDone;
    private Runnable deadline;
    @Override public void onCreate(Bundle saved) {
        super.onCreate(saved);setVolumeControlStream(AudioManager.STREAM_MUSIC);readStreams();immersive();
        root=new FrameLayout(this);root.setBackgroundColor(Color.BLACK);setContentView(root);
        try {web=new WebView(this);}catch(RuntimeException failed){TextView text=new TextView(this);text.setText("Atualize o Android System WebView ou Chrome para abrir a Nova IPTV.");text.setTextColor(Color.WHITE);text.setGravity(Gravity.CENTER);root.addView(text,new FrameLayout.LayoutParams(-1,-1));return;}
        web.setBackgroundColor(0xff101211);web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        WebSettings ws=web.getSettings();ws.setJavaScriptEnabled(true);ws.setDomStorageEnabled(true);ws.setAllowFileAccess(false);ws.setAllowContentAccess(false);ws.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);ws.setSupportMultipleWindows(false);ws.setMediaPlaybackRequiresUserGesture(false);
        if(android.os.Build.VERSION.SDK_INT>=26)ws.setSafeBrowsingEnabled(true);
        web.setWebViewClient(new WebViewClient(){
            @Override public WebResourceResponse shouldInterceptRequest(WebView w,WebResourceRequest req){return asset(req.getUrl());}
            @Override public boolean shouldOverrideUrlLoading(WebView w,WebResourceRequest req){return navigate(req.getUrl(),req.isForMainFrame(),req.hasGesture());}
            @Override public WebResourceResponse shouldInterceptRequest(WebView w,String value){return asset(Uri.parse(value));}
            @Override public boolean shouldOverrideUrlLoading(WebView w,String value){Uri u=Uri.parse(value);if("https".equals(u.getScheme())&&"geo.dailymotion.com".equals(u.getHost()))return false;return navigate(u,true,true);}
        });
        web.setWebChromeClient(new WebChromeClient(){
            @Override public void onShowCustomView(View v,CustomViewCallback callback){if(custom!=null||live!=null){callback.onCustomViewHidden();return;}custom=v;customDone=callback;web.setVisibility(View.INVISIBLE);root.addView(v,new FrameLayout.LayoutParams(-1,-1));keep(true);immersive();}
            @Override public void onHideCustomView(){hideCustom();}
        });
        root.addView(web,new FrameLayout.LayoutParams(-1,-1));web.setFocusableInTouchMode(true);web.requestFocus();web.loadUrl(BASE+"/index.html");
    }
    private boolean local(Uri u){return "https".equals(u.getScheme())&&HOST.equals(u.getHost())&&(u.getPort()==-1||u.getPort()==443)&&u.getUserInfo()==null;}
    private WebResourceResponse asset(Uri u){
        if(!local(u))return null;
        String p=u.getPath();if(!"/index.html".equals(p)&&!"/".equals(p))return new WebResourceResponse("text/plain","UTF-8",404,"Not Found",java.util.Collections.emptyMap(),new java.io.ByteArrayInputStream(new byte[0]));
        try{return new WebResourceResponse("text/html","UTF-8",200,"OK",java.util.Collections.singletonMap("Content-Security-Policy","default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; font-src data:; connect-src https:; media-src https: blob:; frame-src https://geo.dailymotion.com; base-uri 'none'; form-action 'none'"),getAssets().open("index.html"));}catch(Exception error){return null;}
    }
    private boolean navigate(Uri u,boolean mainFrame,boolean gesture){
        String p=u.getPath();if(local(u)){
            if(!mainFrame)return true;
            if("/index.html".equals(p)||"/".equals(p))return false;
            if(p!=null&&p.startsWith("/live/")){String id=p.substring(6);if(streams.containsKey(id))play(id);}
            if("/export".equals(p))exportList();return true;
        }
        if(!mainFrame)return !"https".equals(u.getScheme());
        if("https".equals(u.getScheme())&&gesture)try{startActivity(new Intent(Intent.ACTION_VIEW,u).addCategory(Intent.CATEGORY_BROWSABLE));}catch(RuntimeException missing){Toast.makeText(this,"Instale um navegador para abrir a página oficial.",Toast.LENGTH_LONG).show();}
        return true;
    }
    private void readStreams(){
        try(InputStream in=getAssets().open("catalogo.json");ByteArrayOutputStream out=new ByteArrayOutputStream()){
            transfer(in,out);JSONArray channels=new JSONObject(new String(out.toByteArray(),StandardCharsets.UTF_8)).getJSONArray("channels");
            for(int i=0;i<channels.length();i++){JSONObject row=channels.getJSONObject(i);if(!"hls".equals(row.optString("kind")))continue;String id=row.getString("id"),url=row.getString("stream");Uri u=Uri.parse(url);
                if(id.matches("[a-z0-9-]{1,55}")&&"https".equals(u.getScheme())&&u.getHost()!=null&&u.getUserInfo()==null)streams.put(id,url);}
        }catch(Exception ignored){}
    }
    private static void transfer(InputStream in,OutputStream out)throws java.io.IOException{byte[] b=new byte[8192];int n;while((n=in.read(b))!=-1)out.write(b,0,n);}
    private void play(String id){
        stopLive(false);hideCustom();live=new FrameLayout(this);live.setBackgroundColor(Color.BLACK);root.addView(live,new FrameLayout.LayoutParams(-1,-1));web.setVisibility(View.INVISIBLE);keep(true);
        video=new VideoView(this);final VideoView opened=video;FrameLayout.LayoutParams size=new FrameLayout.LayoutParams(-1,-1,Gravity.CENTER);live.addView(video,size);
        TextView loading=new TextView(this);loading.setText("Conectando à transmissão…");loading.setTextSize(19);loading.setTextColor(Color.WHITE);loading.setGravity(Gravity.CENTER);live.addView(loading,new FrameLayout.LayoutParams(-1,-2,Gravity.CENTER));
        live.setFocusableInTouchMode(true);live.requestFocus();
        video.setOnPreparedListener(mp->{if(video!=opened)return;loading.setVisibility(View.GONE);mp.setScreenOnWhilePlaying(true);});
        video.setOnInfoListener((mp,what,extra)->{if(video==opened&&what==android.media.MediaPlayer.MEDIA_INFO_VIDEO_RENDERING_START){loading.setVisibility(View.GONE);cancelDeadline();}return false;});
        video.setOnErrorListener((mp,what,extra)->{fallback(opened,id);return true;});video.setOnCompletionListener(mp->fallback(opened,id));
        deadline=()->{if(video==opened&&!opened.isPlaying())fallback(opened,id);};main.postDelayed(deadline,14500);
        video.setVideoURI(Uri.parse(streams.get(id)));video.start();immersive();
    }
    private void fallback(VideoView expected,String id){if(video!=expected)return;stopLive(true);if(web!=null)web.evaluateJavascript("window.NovaIptv&&NovaIptv.webLive("+JSONObject.quote(id)+")",null);}
    private void cancelDeadline(){if(deadline!=null){main.removeCallbacks(deadline);deadline=null;}}
    private void stopLive(boolean restore){
        cancelDeadline();VideoView old=video;video=null;if(old!=null)old.stopPlayback();if(live!=null){root.removeView(live);live=null;}
        if(restore&&web!=null){web.setVisibility(View.VISIBLE);web.requestFocus();web.evaluateJavascript("window.NovaIptv&&NovaIptv.resumeFocus()",null);immersive();}if(custom==null)keep(false);
    }
    private void hideCustom(){if(custom==null)return;root.removeView(custom);custom=null;WebChromeClient.CustomViewCallback callback=customDone;customDone=null;if(callback!=null)callback.onCustomViewHidden();if(web!=null&&live==null){web.setVisibility(View.VISIBLE);web.requestFocus();}if(live==null)keep(false);immersive();}
    private void exportList(){try{Intent i=new Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("audio/x-mpegurl").putExtra(Intent.EXTRA_TITLE,"Nova-IPTV-lista.m3u");startActivityForResult(i,EXPORT);}catch(RuntimeException unavail){Toast.makeText(this,"Este aparelho não tem seletor de arquivos.",Toast.LENGTH_LONG).show();}}
    @Override protected void onActivityResult(int request,int result,Intent data){super.onActivityResult(request,result,data);if(request==EXPORT&&result==RESULT_OK&&data!=null&&data.getData()!=null){try(InputStream in=getAssets().open("Nova-IPTV-lista.m3u");OutputStream out=getContentResolver().openOutputStream(data.getData())){if(out==null)throw new java.io.IOException();transfer(in,out);Toast.makeText(this,"Playlist salva.",Toast.LENGTH_SHORT).show();}catch(Exception e){Toast.makeText(this,"Não foi possível salvar a playlist.",Toast.LENGTH_LONG).show();}}}
    @Override public boolean dispatchKeyEvent(KeyEvent e){if(e.getKeyCode()==KeyEvent.KEYCODE_ESCAPE){if(e.getAction()==KeyEvent.ACTION_UP)onBackPressed();return true;}return super.dispatchKeyEvent(e);}
    @Override public void onBackPressed(){if(live!=null){stopLive(true);return;}if(custom!=null){hideCustom();return;}if(web!=null){web.evaluateJavascript("!!(window.NovaIptv&&NovaIptv.back())",v->{if(!"true".equals(v)&&!isFinishing())finish();});}else finish();}
    private void keep(boolean active){if(active)getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);else getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);}
    private void immersive(){getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LAYOUT_STABLE|View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION|View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN|View.SYSTEM_UI_FLAG_HIDE_NAVIGATION|View.SYSTEM_UI_FLAG_FULLSCREEN|View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);}
    @Override public void onWindowFocusChanged(boolean focus){super.onWindowFocusChanged(focus);if(focus)immersive();}
    @Override protected void onPause(){if(live!=null)stopLive(true);if(custom!=null)hideCustom();if(web!=null){web.evaluateJavascript("window.NovaIptv&&NovaIptv.pause()",null);web.onPause();}super.onPause();}
    @Override protected void onResume(){super.onResume();if(web!=null)web.onResume();immersive();}
    @Override protected void onDestroy(){stopLive(false);hideCustom();if(web!=null){root.removeView(web);web.destroy();web=null;}super.onDestroy();}
}
