const { chromium } = require('playwright-core');
const assert = require('node:assert/strict');
const base = process.env.NOVA_PREVIEW_URL || 'http://127.0.0.1:8080/';
async function run() {
  const browser = await chromium.launch({executablePath: process.env.CHROMIUM_BIN || '/usr/bin/chromium', args:['--no-sandbox']});
  try {
    const p = await browser.newPage({viewport:{width:1600,height:900}});
    p.setDefaultTimeout(9000);
    const errors=[]; p.on('pageerror',e=>errors.push(e.message));
    const button=(name)=>p.getByRole('button',{name,exact:true});
    await p.clock.install(); await p.goto(base);
    await p.waitForFunction(()=>document.querySelector('.scenery').dataset.wallpaper==='braies');
    assert.equal(await p.locator('.tile').count(),8);
    assert.equal(await p.locator('.banner').count(),4);
    await button('Início').focus(); await p.keyboard.press('ArrowRight');
    assert.equal(await button('Filmes').getAttribute('aria-current'),'page');
    await p.waitForFunction(()=>document.querySelectorAll('.portrait-frame').length===12);
    await p.keyboard.press('ArrowRight');
    assert.equal(await button('Séries').getAttribute('aria-current'),'page');
    await p.waitForFunction(()=>document.querySelectorAll('.portrait-frame').length===12);
    await p.clock.fastForward(240100);
    assert.equal(await p.locator('.idle-ambient').count(),1);
    await p.keyboard.press('Enter');
    assert.equal(await p.locator('.idle-ambient').count(),0);
    assert.equal(await button('Séries').getAttribute('aria-current'),'page');
    await button('Configurações').click();
    await p.getByRole('switch',{name:/Efeito de vidro/}).click();
    assert.equal(await p.locator('body.solid').count(),1);
    await p.getByRole('button',{name:/Tela inicial/}).click();
    await p.getByRole('switch',{name:/Filmes e séries no início/}).click();
    await button('Início').click(); assert.equal(await p.locator('.banner').count(),0);
    await p.reload(); assert.equal(await p.locator('body.solid').count(),1);
    assert.equal(await p.locator('.banner').count(),0);
    assert.deepEqual(errors,[]);

    // Drive the updater's WebView interface with a deterministic fake Android bridge.
    const n=await browser.newPage({viewport:{width:1600,height:900}});n.setDefaultTimeout(9000);
    await n.addInitScript(()=>{
      const state={repo:'',automatic:true,status:'unconfigured',message:'Configure a fonte.',version:'1.1.0',available:'',progress:0};
      const post=(patch={})=>window.NovaUi.updateState(JSON.stringify(Object.assign(state,patch)));
      window.installerCalled=false;
      window.NovaNative={
        isOnline(){return true;},
        ready(){post();window.NovaUi.updateApps(JSON.stringify([{id:'com.netflix.ninja/.TV',pkg:'com.netflix.ninja',label:'Netflix'}]));},
        catalog(type){window.NovaUi.catalogReply(type,false,'');},
        updaterState(){post();},
        updaterConfigure(repo,automatic){post({repo,automatic,status:'idle',message:'Fonte de atualização salva.'});},
        updaterCheck(){post({status:'available',available:'1.2.0',message:'Nova versão disponível: 1.2.0.'});},
        updaterDownload(){post({status:'downloading',progress:55,message:'Baixando a atualização…'});setTimeout(()=>post({status:'ready',progress:100,message:'Atualização validada.'}),80);},
        updaterInstall(){window.installerCalled=true;post({status:'installing',message:'Confirme no instalador do Android.'});}
      };
    });
    await n.goto(base);
    await n.getByRole('button',{name:'Configurações',exact:true}).click();
    await n.getByRole('button',{name:/Sistema/}).click();
    await n.getByRole('button',{name:/Atualizações/}).click();
    await n.getByRole('textbox',{name:'Repositório'}).fill('dono/nova-os');
    await n.getByRole('button',{name:'Salvar fonte',exact:true}).click();
    await n.getByRole('button',{name:'Verificar agora',exact:true}).click();
    assert.match(await n.locator('#update-message').textContent(),/1\.2\.0/);
    await n.getByRole('button',{name:'Baixar atualização',exact:true}).click();
    await n.getByRole('button',{name:'Instalar atualização',exact:true}).click();
    assert(await n.evaluate(()=>window.installerCalled));
    assert.match(await n.locator('#update-message').textContent(),/instalador do Android/);
    console.log('Validados: layouts, setas, filme/série, fundo, descanso, preferências e interface do atualizador com ponte Android simulada.');
  } finally {await browser.close();}
}
run().catch(e=>{console.error(e);process.exit(1);});
