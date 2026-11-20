const {chromium}=require('playwright'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process'),fs=require('node:fs'),crypto=require('node:crypto');
const path=require('node:path'),origin='https://iptv.nova.invalid';
const html=execFileSync('unzip',['-p',process.argv[2],'assets/index.html'],{maxBuffer:3000000});
const feed=JSON.parse(fs.readFileSync(path.join(__dirname,'../feed/catalogo-v1.json')));
const csp=fs.readFileSync(path.join(__dirname,'../android/src/main/java/br/com/novaos/iptv/IptvActivity.java'),'utf8').match(/"Content-Security-Policy","([^"]+)"/)[1];
const wrap=(featured,extra)=>{const data=structuredClone(feed);data.featured={...data.featured,id:featured};if(extra){data.featured.label='Escolha da semana';data.catalog.movies.find(o=>o.id==='durval-discos').name='Filme de teste';data.catalog.series[0].name='Série de teste';data.catalog.channels[0].name='Canal de teste';}const body=JSON.stringify(data);return{body,digest:crypto.createHash('sha256').update(body).digest('hex')};};
(async()=>{const b=await chromium.launch({args:['--no-sandbox']});try{
 const p=await b.newPage({viewport:{width:1280,height:720}});p.setDefaultTimeout(6000);const errors=[],routes=[];p.on('pageerror',e=>errors.push(e.message));
 let next=wrap('carandiru-3',false),cached=null,service=true;
 await p.route('https://**/*',r=>r.abort());await p.route(origin+'/**',r=>{const u=new URL(r.request().url());routes.push(u.pathname+u.search);
  if(u.pathname==='/index.html')return r.fulfill({body:html,status:200,contentType:'text/html',headers:{'Content-Security-Policy':csp}});
  if(u.pathname==='/catalog-feed.json'){
   const offline=u.searchParams.get('cached')==='1'||!service;if(!offline)cached=next;
   const value=offline?cached:next;if(!value)return r.fulfill({status:503,headers:{'X-Nova-Feed-Status':'bundled'}});
   return r.fulfill({status:200,body:value.body,contentType:'application/json',headers:{'X-Nova-Feed-Digest':value.digest,'X-Nova-Feed-Status':offline?'cache':'online'}});
  }
  return r.fulfill({status:204,body:''});
 });
 await p.goto(origin+'/index.html');await p.getByRole('heading',{name:'Carandiru',exact:true}).waitFor();await p.locator('#nav [data-go=sources]').click();await p.getByText(/1\.0\.2 · catálogo sincronizado/).waitFor();assert(routes.includes('/catalog-feed.json?cached=1'));
 await p.locator('#nav [data-go=home]').click();next=wrap('hora-do-acerto',true);
 // The update arrives while a detail is open; it applies only after going back.
 await p.locator('.hero [data-item=carandiru-3]').click();const online=p.waitForResponse(r=>r.url()===origin+'/catalog-feed.json');await p.evaluate(()=>NovaIptv.refresh());await online;assert(await p.getByRole('dialog',{name:'Carandiru'}).isVisible());await p.keyboard.press('Escape');await p.getByRole('heading',{name:'A Hora do Acerto',exact:true}).waitFor();await p.getByText('Escolha da semana',{exact:true}).waitFor();assert.match(await p.locator('.hero a').getAttribute('href'),/^https:\/\/www\.netmovies\.com\.br\//);assert.equal(await p.locator('a[href*=youtube],a[href*=youtu\\.be]').count(),0);
 for(const [group,name] of [['movies','Filme de teste'],['series','Série de teste'],['live','Canal de teste']]){await p.locator('#nav [data-go='+group+']').click();await p.getByText(name,{exact:true}).waitFor();}
 const playback=p.waitForRequest(r=>r.url()===origin+'/live/record-mt?rev='+next.digest);await p.locator('[data-play=record-mt]').click();await playback;assert(routes.includes('/live/record-mt?rev='+next.digest));await p.evaluate(()=>NovaIptv.resumeFocus());
 await p.locator('#nav [data-go=sources]').click();const exported=p.waitForRequest(r=>r.url()===origin+'/export?rev='+next.digest);await p.getByRole('button',{name:'Baixar M3U'}).click();await exported;
 service=false;await p.goto(origin+'/index.html');await p.getByRole('heading',{name:'A Hora do Acerto',exact:true}).waitFor();await p.locator('#nav [data-go=sources]').click();await p.getByText(/1\.0\.2 · último catálogo salvo/).waitFor();assert.deepEqual(errors,[]);
 console.log('Sync: destaques e catálogo atualizados no retorno, sem interromper a ficha; HLS e M3U usam a mesma revisão; reabertura offline usa cache.');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1);});
