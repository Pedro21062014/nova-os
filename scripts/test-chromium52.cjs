const WebSocket = require('ws');
const assert = require('node:assert/strict');
const endpoint=process.env.CHROMIUM_52_CDP||'http://127.0.0.1:9224';
const preview=process.env.NOVA_PREVIEW_URL||'http://localhost:8091/';
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function run(){
 const pages=await (await fetch(`${endpoint}/json`)).json();
 const ws=new WebSocket(pages.find(t=>t.type==='page').webSocketDebuggerUrl);
 await new Promise((r,j)=>{ws.once('open',r);ws.once('error',j);});
 const pending=new Map(),errors=[];let seq=0;
 ws.on('message',buf=>{const o=JSON.parse(buf);if(o.method==='Runtime.exceptionThrown')errors.push(o.params);
  if(!pending.has(o.id))return;const [r,j]=pending.get(o.id);pending.delete(o.id);o.error?j(Error(JSON.stringify(o.error))):r(o.result);
 });
 const cmd=(method,params={})=>new Promise((r,j)=>{const id=++seq;pending.set(id,[r,j]);ws.send(JSON.stringify({method,params,id}));});
 const js=async expression=>{const r=await cmd('Runtime.evaluate',{expression,returnByValue:true});if(r.wasThrown||r.exceptionDetails)throw Error(JSON.stringify(r));return r.result.value;};
 const until=async expr=>{for(let retry=0;retry<50;retry++){if(await js(expr))return;await pause(100);}throw Error('Timed out: '+expr);};
 try {
  await cmd('Page.enable');await cmd('Runtime.enable');
  await cmd('Page.setDeviceMetricsOverride',{width:1600,height:900,deviceScaleFactor:1,mobile:false,fitWindow:false});
  await cmd('Page.navigate',{url:preview});
  await until('document.body && !!window.NovaUi && !!document.querySelector(".scenery").dataset.wallpaper');
  assert.match(await js('navigator.userAgent'),/Chrome\/52\./);
  assert.equal(await js('document.body.classList.contains("legacy-layout")'),true);
  assert.equal(await js('document.body.classList.contains("legacy-glass")'),true);
  assert.equal(await js('document.querySelectorAll(".tile").length'),8);
  assert.match(await js('getComputedStyle(document.querySelector(".nav")).backgroundImage'),/glass-[a-z]+\.webp/);
  assert.deepEqual(await js('(function(){var r=document.querySelector(".banner").getBoundingClientRect();return [Math.round(r.width),Math.round(r.height)];})()'),[356,200]);
  await js('document.querySelector(".nav [data-arg=home]").focus();NovaUi.key("ArrowRight",true,false,true)');
  await until('document.querySelector(".nav [aria-current=page]").dataset.arg==="movies" && !!document.querySelector(".portrait-frame")');
  assert.deepEqual(await js('(function(){var r=document.querySelector(".portrait-frame").getBoundingClientRect();return [Math.round(r.width),Math.round(r.height)];})()'),[231,347]);
  await js('NovaUi.key("ArrowRight",true,false,true)');
  await until('document.querySelector(".nav [aria-current=page]").dataset.arg==="series"');
  await js('document.querySelector(".top [data-do=settings]").click()');
  assert.equal(await js('Math.round(document.querySelector(".settings-nav").getBoundingClientRect().width)'),300);
  await js('document.querySelector("[data-arg=glass]").click()');
  assert.equal(await js('document.body.classList.contains("solid")'),true);
  await js('document.querySelector("[data-arg=glass]").click()');
  await js('document.querySelector(".top [data-do=search]").click();var input=document.querySelector("#query");input.value="netflix";input.dispatchEvent(new Event("input"));');
  assert.equal(await js('!!document.querySelector("#results [data-arg=netflix]")'),true);
  await js('var nowOriginal=Date.now;Date.now=function(){return nowOriginal()+241000};document.dispatchEvent(new Event("visibilitychange"))');
  assert.equal(await js('document.body.classList.contains("idle-ambient")'),true);
  await js('Date.now=nowOriginal;NovaUi.key("Enter",true,false,true);NovaUi.key("Enter",false,false,true)');
  assert.equal(await js('document.body.classList.contains("idle-ambient")'),false);
  assert.equal(await js('!!document.querySelector("#query")'),true);
  assert.deepEqual(errors,[]);
  console.log('Chromium 52 real: inicialização, vidro alternativo, layout, controle, catálogo local, ajustes, busca e descanso validados.');
 } finally {ws.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1;});
