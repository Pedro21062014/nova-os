const {chromium}=require('playwright-core');const assert=require('node:assert/strict');
const preview=process.env.NOVA_PREVIEW_URL||'http://127.0.0.1:8080/';
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROMIUM_BIN||'/usr/bin/chromium',args:['--no-sandbox']});
 try {
  const p=await b.newPage({viewport:{width:1600,height:900}});
  const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(()=>{window.open=(url)=>{window.previewOpened=url;};});
  await p.route('**/catalog/movies.json',r=>r.fulfill({json:{feed:{entry:[{'im:name':{label:'Filme iTunes de teste'},id:{label:'https://itunes.apple.com/br/movie/filme-teste',attributes:{'im:id':'1'}}}]}}}));
  await p.goto(preview);
  await p.waitForFunction(()=>document.querySelector('.scenery').classList.contains('wall-settled'));
  assert.equal(await p.locator('.prime-home .movie').count(),4);
  await p.getByRole('button',{name:'Ver Prime Video'}).click();
  assert.equal(await p.getByRole('button',{name:'Prime Video',exact:true}).getAttribute('aria-pressed'),'true');
  assert.equal(await p.locator('.poster-grid .movie').count(),12);
  assert.equal(await p.locator('#movie-count').textContent(),'12 de 16 filmes');
  await p.getByRole('button',{name:'Mostrar mais filmes'}).click();
  assert.equal(await p.locator('.poster-grid .provider-prime').count(),16);
  assert.equal(await p.locator('#movie-count').textContent(),'16 de 16 filmes');
  assert.equal(await p.getByRole('button',{name:'Mostrar mais filmes'}).isVisible(),false);
  await p.locator('.poster-grid .movie').first().focus();await p.keyboard.press('Enter');
  assert.equal(await p.getByRole('dialog').isVisible(),true);
  await p.getByRole('button',{name:'Assistir no Prime Video'}).click();
  assert.equal(await p.evaluate(()=>window.previewOpened),'https://www.primevideo.com/-/pt/detail/0TDY5ZV7OX9E4MJYBTL5ODPZVI?language=pt_BR');
  await p.getByRole('button',{name:'Salvar na minha lista'}).click();
  await p.keyboard.press('Escape');await p.keyboard.press('Escape');
  assert.equal(await p.locator('#home-more .more-section[aria-label="Minha lista de títulos"] .movie').count(),1);
  assert.equal(await p.evaluate(()=>document.activeElement.dataset.arg),'primeMovies');
  await p.locator('.nav [data-arg=movies]').click();
  await p.getByRole('button',{name:'Todos',exact:true}).click();
  await p.getByRole('button',{name:'Filme iTunes de teste',exact:true}).waitFor();
  assert.equal(await p.locator('#movie-count').textContent(),'12 de 17 filmes');
  await p.getByRole('button',{name:'iTunes Store',exact:true}).click();
  assert.equal(await p.locator('.poster-grid .movie').count(),1);
  assert.equal(await p.locator('.poster-grid .provider-prime').count(),0);
  assert.deepEqual(errors,[]);console.log('Prime: catálogo paginado de 16 filmes, fontes separadas, play externo, atalhos e lista validados.');
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1)});
