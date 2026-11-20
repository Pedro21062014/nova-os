const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {execFileSync}=require('node:child_process'),{chromium}=require('playwright');
const root=fs.mkdtempSync(path.join(require('node:os').tmpdir(),'store-iptv-sync-'));
const catalog=fs.readFileSync(path.join(__dirname,'../../catalogo.json'));
const origin='https://store.nova.invalid';
const expected=JSON.parse(catalog).apps.find(a=>a.id==='nova-iptv').apks[0];
(async()=>{
 execFileSync('unzip',['-q',process.argv[2],'-d',root]);
 const local=JSON.parse(fs.readFileSync(root+'/assets/links.json')).find(apk=>apk.app==='nova-iptv');
 assert.equal(local.version,'1.0.0');assert.equal(expected.version,process.env.NOVA_IPTV_EXPECT||'1.0.2');assert.equal(expected.cert,local.cert);assert.equal(expected.package,local.package);
 const b=await chromium.launch({args:['--no-sandbox']});
 try{
  const p=await b.newPage({viewport:{width:1280,height:720}});p.setDefaultTimeout(6500);
  const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(()=>{window.commands=[];window.NovaStore={state:()=>JSON.stringify({jobs:{},abis:['arm64-v8a'],sdk:30}),download:u=>commands.push(u)};});
  await p.route(origin+'/**',r=>{const point=new URL(r.request().url()).pathname;
   if(point==='/catalogo.json')return r.fulfill({body:catalog,contentType:'application/json',headers:{'X-Nova-Catalog-Digest':'nova-online-1.0.1'}});
   const file=root+'/assets'+point;if(!fs.existsSync(file))return r.fulfill({status:404});
   return r.fulfill({path:file,contentType:point.endsWith('.webp')?'image/webp':'text/html; charset=utf-8'});
  });
  const sync=p.waitForResponse(r=>r.url()===origin+'/catalogo.json');await p.goto(origin+'/index.html');await sync;
  await p.getByText(/O catálogo e o destaque se atualizam/).first().waitFor();assert(await p.evaluate(()=>novaStoreOpenIptv()));
  await p.getByRole('heading',{name:'Nova IPTV',exact:true}).waitFor();await p.getByText('v'+expected.version,{exact:true}).waitFor();
  const download=p.locator('[data-primary-apk]');assert.equal(await download.getAttribute('href'),expected.url);await download.click();assert.deepEqual(await p.evaluate(()=>commands),[expected.url]);assert.deepEqual(errors,[]);
  console.log('Nova Store 1.0.5 publicada: RAW promove a ficha e envia o APK atual para download.');
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>fs.rmSync(root,{recursive:true,force:true}));
