const { chromium }=require('playwright-core');
const assert=require('node:assert/strict');
const address=process.env.NOVA_PREVIEW_URL||'http://127.0.0.1:8097/';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_BIN||undefined,args:['--no-sandbox']});
 try{
  const p=await browser.newPage({viewport:{width:1440,height:900}});
  p.setDefaultTimeout(6000);const errors=[];p.on('pageerror',err=>errors.push(err.message));
  await p.addInitScript(()=>{
   localStorage.setItem('nova.v1',JSON.stringify({motion:false,auto:false,rotate:false}));
   let read=0;window.actions=[];
   window.NovaNative={softwareRendering:()=>true,ready(){},isOnline:()=>true,claimStoreInvitation:()=>false,
     claimStoreUpdateNotice:()=>++read===1,storeStatus(){},storeAction:a=>actions.push(a)};
  });
  await p.goto(address);
  const send=(status,updateAvailable,progress=0,check='idle')=>p.evaluate(({status,updateAvailable,progress,check})=>NovaUi.storeState(JSON.stringify({status,updateAvailable,progress,check,targetVersion:'1.0.4',message:status==='ready'?'APK verificado. Pronto para instalar.':'Nova Store 1.0.4 disponível.'})),{status,updateAvailable,progress,check});
  const heading=p.getByRole('heading',{name:'A Nova Store foi atualizada',exact:true});
  await send('installed',false);assert.equal(await heading.count(),0);
  await send('available',false);assert.equal(await heading.count(),0);
  await send('available',true);await heading.waitFor();
  assert.match(await p.locator('#dialog p').first().innerText(),/1\.0\.4/);
  assert.match(await p.evaluate(()=>document.activeElement.textContent.trim()),/Agora não/);
  if(process.env.NOVA_MODAL_SCREENSHOT)await p.screenshot({path:process.env.NOVA_MODAL_SCREENSHOT});
  await p.keyboard.press('ArrowRight');
  assert.match(await p.evaluate(()=>document.activeElement.textContent.trim()),/Baixar atualização/);
  await p.keyboard.press('Enter');
  assert.deepEqual(await p.evaluate(()=>actions),['download']);
  await send('downloading',true,37);assert.equal(await p.locator('#nova-store-progress').evaluate(el=>el.value),37);
  await send('ready',true,100);
  await p.getByRole('button',{name:'Instalar atualização',exact:true}).click();
  assert.deepEqual(await p.evaluate(()=>actions),['download','install']);
  await send('installed',false,100);await p.getByRole('button',{name:'Abrir Nova Store',exact:true}).waitFor();
  await p.keyboard.press('Escape');
  await p.reload();
  await send('available',true);await heading.waitFor();
  await p.getByRole('button',{name:'Agora não',exact:true}).click();
  await send('available',true);assert.equal(await heading.count(),0);
  assert.deepEqual(await p.evaluate(()=>actions),[]);
  await p.getByRole('button',{name:'Configurações',exact:true}).click();
  await p.locator('[data-do="settingsGroup"][data-arg="system"]').click();
  await p.locator('[data-do="novaStore"]').click();
  const check=p.getByRole('button',{name:'Verificar atualizações',exact:true});
  await check.click();
  await p.getByText('Verificando atualizações da Nova Store…',{exact:true}).waitFor();
  assert.deepEqual(await p.evaluate(()=>actions),['check']);
  await send('available',true,0,'error');
  await p.getByText('Não foi possível consultar o canal. Confira a conexão e tente de novo.').waitFor();
  await check.click();await send('available',true,0,'success');
  await p.getByText('Atualização encontrada.',{exact:true}).waitFor();
  await p.getByRole('button',{name:'Baixar atualização',exact:true}).waitFor();
  await send('installed',false,0,'success');
  await p.getByText('A Nova Store já está atualizada.',{exact:true}).waitFor();
  assert.deepEqual(errors,[]);
  console.log('Aviso exclusivo para loja antiga, D-pad, download, progresso, instalação e adiamento: OK.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
