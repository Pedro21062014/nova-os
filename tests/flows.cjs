const {chromium}=require('playwright');
const assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({args:['--no-sandbox']});
 try {
  const page=await browser.newPage({viewport:{width:1440,height:900},offline:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  page.setDefaultTimeout(4800);
  await page.goto(pathToFileURL(process.argv[2]).href);
  await page.locator('.hero-art').evaluate(i=>i.decode());await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.locator('.channel').count(),4);assert.equal(await page.locator('.tile').count(),4);
  await page.locator('#hero-action').focus();
  if(process.env.NOVA_SCREENSHOT)await page.screenshot({path:process.env.NOVA_SCREENSHOT});
  await page.keyboard.press('Enter');await page.getByRole('heading',{name:'Além da Serra',exact:true,level:2}).last().waitFor();
  await page.keyboard.press('Enter');
  await page.getByRole('button',{name:'Remover da lista'}).waitFor();
  await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'hero-action');
  await page.getByRole('button',{name:'Minha lista',exact:true}).first().click();
  await page.getByRole('button',{name:'Além da Serra',exact:true}).waitFor();
  await page.keyboard.press('/');await page.getByRole('searchbox').fill('mare profunda');
  await page.getByRole('button',{name:'Maré Profunda',exact:true}).waitFor();
  await page.getByRole('button',{name:'TV ao vivo',exact:true}).click();
  await page.getByRole('button',{name:'Guia de TV',exact:true}).click();
  await page.getByRole('button',{name:/Nova Notícias.*Panorama Brasil/}).waitFor();
  await page.keyboard.press('Escape');
  await page.getByRole('heading',{name:'TV ao vivo',exact:true,level:1}).waitFor();
  await page.locator('.channel').first().focus();await page.keyboard.press('ArrowRight');
  assert.equal(await page.evaluate(()=>document.activeElement.getAttribute('data-item')),'arena');
  await page.getByRole('button',{name:'Séries',exact:true}).click();assert.equal(await page.locator('.tile').count(),3);
  await page.getByRole('button',{name:'Filmes',exact:true}).click();assert.equal(await page.locator('.tile').count(),3);
  await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Início',exact:true}).click();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);
  assert.deepEqual(errors,[]);console.log('Prévia offline: TV e celular, setas, detalhes, favoritos, busca e guia de canais testados.');
 } finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
