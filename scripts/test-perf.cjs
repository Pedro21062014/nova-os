const {chromium}=require('playwright-core');
const assert=require('node:assert/strict');
const preview=process.env.NOVA_PREVIEW_URL||'http://127.0.0.1:8080/';
const pixel=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR42mNgAAIAAAUAAXpeqz8AAAAASUVORK5CYII=','base64');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_BIN||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const p=await browser.newPage({viewport:{width:1600,height:900}});
  await p.addInitScript(()=>{
   localStorage.setItem('nova.v1',JSON.stringify({motion:false,auto:false,rotate:false}));
   window.NovaNative={softwareRendering:()=>true,ready(){},isOnline:()=>true};
  });
  const errors=[];p.on('pageerror',e=>errors.push(e.message));
  let iconRequests=new Set();
  await p.route('**/icon?*',r=>{iconRequests.add(new URL(r.request().url()).searchParams.get('id'));return r.fulfill({contentType:'image/png',body:pixel});});
  await p.goto(preview);
  await p.evaluate(()=>{
   window.appFixtures=Array.from({length:140},(_,i)=>{const id=String(i).padStart(3,'0');return {id,label:'App '+id,pkg:'test.app'+id,icon:'/icon?id='+id};});
   window.initialMore=document.getElementById('home-more');
   NovaUi.updateApps(JSON.stringify(window.appFixtures));
  });
  await p.getByRole('button',{name:'App 000',exact:true}).focus();
  await p.evaluate(()=>NovaUi.updateApps(JSON.stringify(window.appFixtures.map(a=>a.id==='000'?{...a,label:'App 000 atualizado'}:a))));
  assert.equal(await p.evaluate(()=>initialMore===document.getElementById('home-more')),true);
  assert.equal(await p.evaluate(()=>document.activeElement.dataset.arg),'000');
  await p.evaluate(()=>{
   window.stableTile=document.querySelector('#home-app-grid [data-arg="000"]');
   NovaUi.updateApps(JSON.stringify(window.appFixtures.map(a=>a.id==='000'?{...a,label:'App 000 atualizado'}:a.id==='139'?{...a,label:'App 139 renomeado'}:a)));
  });
  assert.equal(await p.evaluate(()=>stableTile===document.activeElement&&stableTile.isConnected),true);
  await p.getByRole('button',{name:'Todos os apps',exact:true}).click();
  await p.waitForFunction(()=>document.querySelector('button[data-arg="010"] img[src]'));
  assert.equal(await p.locator('#main .tile').count(),140);
  assert.equal(await p.locator('button[data-arg="139"] img[src]').count(),0);
  const initial=iconRequests.size;
  assert(initial>0&&initial<100,`Unexpected initial icon count: ${initial}`);
  await p.getByRole('button',{name:'App 139 renomeado',exact:true}).focus();
  await p.waitForFunction(()=>document.querySelector('button[data-arg="139"] img[src]'));
  assert.equal(await p.evaluate(()=>document.activeElement.dataset.arg),'139');
  const starting=await p.evaluate(()=>({y:document.activeElement.getBoundingClientRect().top,scroll:document.querySelector('#main').scrollTop}));
  await p.keyboard.press('ArrowUp');
  const step=await p.evaluate(()=>({id:document.activeElement.dataset.arg,inside:document.activeElement.matches('#main .tile'),scroll:document.querySelector('#main').scrollTop}));
  assert(step.inside&&Number(step.id)<139&&Number(step.id)>125, JSON.stringify(step));
  assert(step.scroll<=starting.scroll);
  for(let i=0;i<5;i++){await p.keyboard.press('ArrowUp');assert(await p.evaluate(()=>document.activeElement.matches('#main .tile')));}
  assert.deepEqual(errors,[]);
  console.log(`140 apps: ${initial} ícones solicitados até o primeiro lote observado; último ícone carregado ao receber foco; Início manteve DOM e foco.`);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
