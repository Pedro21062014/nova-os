(() => {
'use strict';
const $ = id => document.getElementById(id);
const native = window.NovaNative;
const VERSION = '1.0.0';
const pref = {glass:true, films:true, wall:true, hero:true, auto:true, trending:false, pins:null, saved:[]};
try { Object.assign(pref, JSON.parse(localStorage.getItem('nova.v1')||'{}')); } catch (_) {}
const persist = () => {try{localStorage.setItem('nova.v1',JSON.stringify(pref));}catch(_){}};
const paths = {
star:'<path d="M12 2c1.2 6.2 3.8 8.8 10 10-6.2 1.2-8.8 3.8-10 10C10.8 15.8 8.2 13.2 2 12c6.2-1.2 8.8-3.8 10-10Z" fill="currentColor" stroke="none"/><path d="M19 3v4m-2-2h4"/>',
home:'<path d="m3.5 10 8.5-6.5 8.5 6.5v9.5a1 1 0 0 1-1 1H15v-6H9v6H4.5a1 1 0 0 1-1-1Z"/>',film:'<rect x="3" y="3.5" width="18" height="17" rx="2"/><path d="M7 4v16m10-16v16M3 9h4m-4 6h4m10-6h4m-4 6h4"/>',tv:'<rect x="3" y="5" width="18" height="13" rx="2"/><path d="M8 22h8"/>',live:'<circle cx="12" cy="12" r="2"/><path d="M7.7 7.7a6 6 0 0 0 0 8.6m8.6-8.6a6 6 0 0 1 0 8.6M4.2 4.2a11 11 0 0 0 0 15.6m15.6-15.6a11 11 0 0 1 0 15.6"/>',search:'<circle cx="10.8" cy="10.8" r="5.8"/><path d="m15.4 15.4 4.1 4.1"/>',wifi:'<path d="M2.5 8a15.6 15.6 0 0 1 19 0M5.5 11.6a10.6 10.6 0 0 1 13 0M8.5 15.1a5.7 5.7 0 0 1 7 0"/><circle cx="12" cy="18.6" r="1" fill="currentColor" stroke="none"/>',settings:'<circle cx="12" cy="12" r="3"/><path d="M10 3h4l.7 2.3 2.1 1.2 2.3-.5 2 3.5-1.6 1.7v2.4l1.6 1.7-2 3.5-2.3-.5-2.1 1.2L14 22h-4l-.7-2.5-2.1-1.2-2.3.5-2-3.5 1.6-1.7v-2.4L2.9 9.5l2-3.5 2.3.5 2.1-1.2Z"/>',
play:'<path d="M8 5.3a.8.8 0 0 0-1.2.7v12a.8.8 0 0 0 1.2.7l10-6a.8.8 0 0 0 0-1.4Z" fill="currentColor" stroke="none"/>',bookmark:'<path d="M6 4h12v17l-6-4-6 4Z"/>',mountain:'<path d="m2 18 6-9 4 5 3-8 7 12ZM6 12l2 1.5 2-1m3-2 2 1.5 2-1.5"/>',chev:'<path d="m9 5 7 7-7 7"/>',arrow:'<path d="M4 12h15m-6-6 6 6-6 6"/>',left:'<path d="M20 12H5m6-6-6 6 6 6"/>',grid:'<rect x="3.5" y="3.5" width="6" height="6" rx="1"/><rect x="14.5" y="3.5" width="6" height="6" rx="1"/><rect x="3.5" y="14.5" width="6" height="6" rx="1"/><rect x="14.5" y="14.5" width="6" height="6" rx="1"/>',sliders:'<path d="M4 7h5m4 0h7M4 17h9m4 0h3M9 4v6m8 4v6"/>',x:'<path d="m6 6 12 12M6 18 18 6"/>',check:'<path d="m5 12 5 5 9-10"/>',info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/>',reload:'<path d="M20 11a8 8 0 1 0-2 6m2-12v6h-6"/>',external:'<path d="M13 4h7v7m0-7-9 9m8 0v7H4V5h7"/>',up:'<path d="m6 14 6-6 6 6"/>',down:'<path d="m6 10 6 6 6-6"/>',layers:'<path d="m3 9 9-5 9 5-9 5Zm0 4 9 5 9-5M3 17l9 5 9-5"/>',bolt:'<path d="m13 3-8 11h6l-1 7 9-12h-6Z"/>'};
const ico = (id,n=20) => `<svg width="${n}" height="${n}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[id]||paths.grid}</svg>`;
const logo = {
 netflix:'<svg width="34" height="43" viewBox="0 0 34 43" aria-hidden="true"><path fill="#b20710" d="M5 0h8v41l-8 2zM21 0h8v43l-8-2z"/><path fill="#ed1d29" d="M5 0h8l16 43-8-2z"/></svg>',
 youtube:'<svg width="54" height="40" viewBox="0 0 54 40" aria-hidden="true"><rect x="1" y="3" width="52" height="34" rx="10" fill="#ff3f4c"/><path fill="#fff" d="m23 13 13 7-13 7z"/></svg>',
 prime:'<span class="prime">prime video<svg width="77" height="15" viewBox="0 0 77 15" fill="none" aria-hidden="true"><path d="M3 4c20 13 47 13 68-1m-7 0 10-1-2 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span>',
 hbo:'<span class="hbo">HBO</span>',spotify:'<svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true"><circle fill="#49dc86" cx="22" cy="22" r="21"/><path d="M10.5 17a26.6 26.6 0 0 1 24 2.5m-22 3.1a22 22 0 0 1 20 2.1m-18.1 3.1a17 17 0 0 1 16 1.8" fill="none" stroke="#102619" stroke-width="2.7" stroke-linecap="round"/></svg>',
 apple:'<span class="apple"><svg width="24" height="30" viewBox="0 0 26 30" aria-hidden="true"><path fill="currentColor" d="M18.5 6c1-1.5 1.5-3.6 1.2-5.2-1.8.3-3.7 1.4-4.7 2.8-1 1.2-1.6 3.1-1.4 4.7 2 .1 3.8-1 4.9-2.3Zm5 8.5c0-2.5 1.6-4.1 2.1-4.4-1.3-2-3.5-2.5-4.9-2.5-2.1-.2-4 1.1-5.2 1.1s-3.1-1.1-4.9-1.1c-2.6 0-4.9 1.6-6.3 3.8-2.7 4.4-.5 11 2 14.8 1.2 1.8 2.4 3.6 4.3 3.5 1.7-.1 2.5-1.1 4.8-1.1s2.9 1.1 4.9 1.1 3.2-1.8 4.3-3.6c1.4-2.1 2-4 2.1-4.2-4-1.7-4.2-5.4-4.2-7.4Z" transform="translate(-2 0)"/></svg>tv</span>',
 plex:'<span class="plex">plex<span>›</span></span>'};
const services = [
 ['netflix','Netflix','https://www.netflix.com/br/',['com.netflix.ninja','com.netflix.mediaclient']], ['youtube','YouTube','https://www.youtube.com/',['com.google.android.youtube.tv','com.google.android.youtube']], ['prime','Prime Video','https://www.primevideo.com/',['com.amazon.amazonvideo.livingroom','com.amazon.avod.thirdpartyclient']], ['hbo','HBO Max','https://www.hbomax.com/br/pt',['com.wbd.stream','com.hbo.hbonow']], ['spotify','Spotify','https://open.spotify.com/',['com.spotify.tv.android','com.spotify.music']], ['apple','Apple TV','https://tv.apple.com/br',['com.apple.atve.androidtv.appletv','com.apple.atve.androidtv.appletv.googleplay','com.apple.tv']], ['plex','Plex','https://www.plex.tv/pt-br/',['com.plexapp.android','com.plexapp.plex']]];
const demoApps = services.map(([brand,label,url])=>({id:brand,brand,label,url}));
const curated = [
 {id:'nova:interestelar',title:'Interestelar',meta:'2014 · Ficção científica',tag:'FILME',art:'img/cosmo.webp',url:'https://www.justwatch.com/br/filme/interestelar',source:'JustWatch',summary:'Com a Terra em crise, uma equipe de astronautas parte à procura de um novo lar para a humanidade.'},
 {id:'nova:severance',title:'Ruptura',meta:'2022 · Suspense',tag:'SÉRIE',art:'img/cidade.webp',url:'https://www.tvmaze.com/shows/44933/severance',source:'TVmaze',summary:'Um procedimento separa as memórias do trabalho e da vida pessoal de funcionários de uma empresa, até que as fronteiras começam a falhar.'},
 {id:'nova:jogos',title:'Jogos Vorazes',meta:'2023 · Ação e aventura',tag:'FILME',art:'img/areia.webp',url:'https://itunes.apple.com/br/movie/jogos-vorazes-a-cantiga-dos-p%C3%A1ssaros-e-das-serpentes/id1715087295?uo=2',source:'iTunes Store',summary:'A cantiga dos pássaros e das serpentes volta ao início da história de Coriolanus Snow e dos Jogos Vorazes.'}];
const catalogs = {movies:{items:[],state:'idle'},series:{items:[],state:'idle'}};
let apps = native ? [] : demoApps.slice(), page='home', dialog=null, previousFocus='', useDpad=!!native, toastTimer, searchValue='', organizeFrom='home', paintedHeader=false;
const escape = s => String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const attr=escape;
const slug=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const compact=s=>String(s||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
const bool=(key)=>!!pref[key];
const btn=(text,action,icon='',cls='ghost glass',arg='')=>`<button class="pill ${cls}" data-do="${action}" data-arg="${attr(arg)}">${icon?ico(icon,18):''}${escape(text)}</button>`;
const rnd=(name,action,icon=action)=>`<button type="button" class="round glass" aria-label="${name}" title="${name}" data-do="${action}">${ico(icon,21)}</button>`;
const tabs=[['home','Início','home'],['movies','Filmes','film'],['series','Séries','tv'],['live','Ao vivo','live']];
const syncHeader=()=>{
 if(!paintedHeader){$('top').innerHTML=`<button class="brand" aria-label="Nova OS, início" data-do="page" data-arg="home"><span class="brand-icon">${ico('star',25)}</span><span class="brand-name">Nova<small>OS</small></span></button><nav class="nav glass" aria-label="Navegação principal">${tabs.map(([id,name,i])=>`<button data-do="page" data-arg="${id}">${ico(i,17)}${name}</button>`).join('')}</nav><div class="header-right">${rnd('Buscar','search')}<span class="net" id="net" title="Conexão">${ico('wifi',21)}</span><div class="time"><b id="clock"></b><span id="date"></span></div>${rnd('Configurações','settings')}</div>`;paintedHeader=true;}
 document.querySelectorAll('.nav button').forEach(el=>{const active=el.dataset.arg===page;el.classList.toggle('active',active);if(active)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');}); clock(); net();
};
function clock(){const d=new Date();$('clock').textContent=d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',hour12:false});$('date').textContent=d.toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'short'}).replace(/\./g,'').replace(/ de /g,' ');if($('ambient-clock'))$('ambient-clock').textContent=$('clock').textContent;}
function net(){if(!$('net'))return;const online=native?connection():navigator.onLine;$('net').classList.toggle('off',!online);$('net').title=online?'Conectado':'Sem conexão';}
function connection(){try{return native.isOnline();}catch(_){return false;}}
const section=(title,sub,action,text,icon='arrow',arg='')=>`<div class="section-head"><h2>${title}</h2>${sub?`<p>${sub}</p>`:''}${action?`<button class="small" data-do="${action}" data-arg="${arg}">${text}${ico(icon,16)}</button>`:''}</div>`;
function appTile(a){const more=a.id==='__more';const mark=more?ico('grid',33):a.brand&&logo[a.brand]?logo[a.brand]:a.icon&&native?`<img alt="" loading="lazy" src="${attr(a.icon)}">`:`<span class="generic">${escape(a.label.charAt(0).toUpperCase())}</span>`;return `<button class="tile" data-do="${more?'page':'app'}" data-arg="${more?'apps':attr(a.id)}" aria-label="${attr(a.label)}"><span class="app-mark glass${more?' more':''}">${mark}</span><span class="app-label">${escape(a.label)}</span></button>`;}
function pins(){if(Array.isArray(pref.pins))return pref.pins; return apps.slice(0,7).map(a=>a.id);}
function tiles(){const map=new Map(apps.map(a=>[a.id,a]));return pins().map(id=>map.get(id)).filter(Boolean).slice(0,7);}
function card(t){const src=t.art||t.image&&'art?url='+encodeURIComponent(t.image);return `<button class="movie" data-do="detail" data-arg="${attr(t.id)}">${src?`<img alt="" class="art${t.art?'':' poster-art'}" src="${attr(src)}" loading="lazy">`:''}<span class="movie-info"><span class="tag">${escape(t.tag||'DESTAQUE')}</span><h3>${escape(t.title)}</h3><p>${escape(t.meta||'')}</p></span><span class="play-dot">${ico('chev',17)}</span></button>`;}
function home(){
 const appsMarkup=`<section class="shelf" aria-label="Seus apps">${section('Seus apps','Seus favoritos, sempre à mão.','organize','Organizar','sliders')}<div class="app-grid">${[...tiles(),{id:'__more',label:'Todos os apps'}].map(appTile).join('')}</div></section>`;
 const display=bool('trending')&&catalogs.movies.items.length?catalogs.movies.items.slice(0,3):curated;
 const shelf=bool('films')?`<section class="shelf" aria-label="Descobrir">${section('Descubra algo novo','Uma seleção para a sua próxima sessão.','page','Ver catálogo','arrow','movies')}<div class="card-grid">${display.map(card).join('')}</div></section>`:'';
 return `${bool('hero')?`<section class="hero"><span class="eyebrow">O SEU TEMPO. DO SEU JEITO.</span><h1>Chegue. Relaxe.<br><span>Dê o play.</span></h1><p>Seus apps e suas histórias favoritas, em um só lugar.</p><div class="actions">${btn(bool('films')?'Explorar agora':'Abrir seus apps','page',bool('films')?'play':'grid','primary',bool('films')?'movies':'apps')}${btn('Minha lista','page','bookmark','ghost glass','saved')}</div><button class="ambient-card glass" data-do="page" data-arg="ambient"><span class="picture">${ico('mountain',22)}</span><span class="words"><small>MODO AMBIENTE</small><b>Dolomitas, Itália</b></span><span class="chev">${ico('chev',18)}</span></button></section>`:'<div class="section-label" style="margin-top:36px">Tela inicial</div>'}${appsMarkup}${shelf}`;
}
const head=(mark,title,desc,actions='')=>`<div class="page-head"><div><span class="eyebrow">${mark}</span><h1>${title}</h1><p>${desc}</p></div>${actions?`<div class="actions">${actions}</div>`:''}</div>`;
const empty=(title,descr,actions='')=>`<div class="empty glass"><h2>${title}</h2><p>${descr}</p>${actions?`<div class="actions">${actions}</div>`:''}</div>`;
function setting(title,desc,icon,action,arg='',toggled=null){return `<button class="setting glass" data-do="${action}" data-arg="${attr(arg)}"${toggled!==null?` role="switch" aria-checked="${toggled}"`:''}><span class="setting-icon">${ico(icon,20)}</span><span class="setting-copy"><b>${escape(title)}</b><small>${escape(desc)}</small></span>${toggled!==null?`<span class="switch ${toggled?'on':''}" aria-hidden="true"></span>`:ico('chev',17)}</button>`;}
function settings(){return head('PREFERÊNCIAS','Configurações','Ajuste a aparência e escolha o que fica na sua tela inicial.')+`<h2 class="section-label">Aparência e tela inicial</h2><div class="setting-grid">${setting('Efeito de vidro','Transparência e bordas suaves, sem desfoque em tempo real.','layers','toggle','glass',bool('glass'))}${setting('Papel de parede','Mostra a paisagem na tela inicial.','mountain','toggle','wall',bool('wall'))}${setting('Boas-vindas','Mostra a chamada principal e o atalho para o modo ambiente.','star','toggle','hero',bool('hero'))}${setting('Filmes e séries no início','Mostra ou esconde a vitrine de recomendações.','film','toggle','films',bool('films'))}${setting('Filmes em alta no início','Troca a seleção editorial pelos três primeiros filmes do catálogo.','bolt','toggle','trending',bool('trending'))}</div><h2 class="section-label">Sistema e dados</h2><div class="setting-grid">${setting('Pré-carregar filmes','Atualiza o catálogo em segundo plano ao abrir o launcher.','bolt','toggle','auto',bool('auto'))}${setting('Organizar favoritos','Fixe até sete aplicativos e altere a ordem.','sliders','organize')}${setting('Launcher padrão','Abre a configuração de tela inicial do Android.','home','system','home')}${setting('Configurações do Android','Acesse rede, tela e outros ajustes do aparelho.','settings','system','all')}${setting('Sobre o Nova OS','Versão, fontes de catálogo e informações de privacidade.','info','about')}${setting('Modo ambiente','Exibe a paisagem em tela cheia.','mountain','page','ambient')}</div>`;}
function catalog(which){const m=which==='movies', s=catalogs[which], data=s.items.length?s.items:curated.filter(x=>x.tag===(m?'FILME':'SÉRIE'));return head('DESCOBRIR',m?'Filmes':'Séries',m?'Explore os títulos em destaque na iTunes Store do Brasil.':'Explore as séries do TVmaze. Alguns dados estão em inglês.',btn('Atualizar','refresh','reload','ghost glass',which))+(s.state==='loading'?'<p class="status" role="status">Atualizando o catálogo…</p>':s.state==='error'?'<p class="status offline" role="status">Não foi possível atualizar. Mostrando os títulos disponíveis localmente.</p>':s.state==='cache'?'<p class="status" role="status">Exibindo a última seleção salva no dispositivo.</p>':'')+`<div class="card-grid">${data.map(card).join('')}</div>`;}
function live(){const matches=apps.filter(a=>/globoplay|pluto|samsung tv|tv aberta|tv ao vivo|brasil tv|sbt|record|soul tv|zapping|tivimate|distro|sling|youtube/i.test(a.label));return head('CANAIS E TRANSMISSÕES','Ao vivo','Abra apps que oferecem canais ou transmissões. O Nova OS não fornece canais próprios.')+(matches.length?`<div class="app-grid">${matches.map(appTile).join('')}</div>`:empty('Nenhum app compatível encontrado','Os atalhos aparecerão aqui quando você instalar um app de TV ao vivo.',btn('Ver todos os apps','page','grid','primary','apps')));}
function allApps(){return head('BIBLIOTECA','Todos os apps',native?'Aplicativos instalados no seu aparelho.':'Nesta prévia, os atalhos abrem os sites dos serviços.',btn('Organizar','organize','sliders'))+(apps.length?`<div class="app-grid">${apps.map(appTile).join('')}</div>`:empty('Sem apps disponíveis','Aplicativos compatíveis aparecerão aqui depois da instalação.'));}
function saved(){return head('SUA BIBLIOTECA','Minha lista','Os títulos que você salvar ficam neste dispositivo.')+(pref.saved.length?`<div class="card-grid">${pref.saved.map(card).join('')}</div>`:empty('Sua lista está vazia','Abra os detalhes de um título para adicioná-lo à sua lista.',btn('Explorar catálogo','page','film','primary','movies')));}
function organizer(){return head('TELA INICIAL','Organizar apps','Escolha até sete favoritos. Selecione um app para fixar, remover ou mover.',btn('Concluir','page','check','primary',organizeFrom))+(apps.length?`<h2 class="section-label">Fixados · ${tiles().length}/7</h2><div class="mini-list">${tiles().map((a,i)=>setting(a.label,`${i+1}ª posição`,'star','manage',a.id)).join('')||'<p class="status">Nenhum favorito fixado.</p>'}</div><h2 class="section-label">Outros aplicativos</h2><div class="mini-list">${apps.filter(a=>!pins().includes(a.id)).map(a=>setting(a.label,'Não fixado','grid','manage',a.id)).join('')||'<p class="status">Nenhum outro aplicativo.</p>'}</div>`:empty('Sem apps para organizar','Quando você instalar um aplicativo, ele aparecerá aqui.'));}
function search(){return head('ENCONTRE MAIS RÁPIDO','Buscar','Pesquise apps e títulos disponíveis no catálogo.')+`<input class="search-box" id="query" type="search" enterkeyhint="search" aria-label="Buscar por nome" placeholder="Digite o nome de um app, filme ou série…" autocomplete="off" value="${attr(searchValue)}"><div id="results"></div>`;}
function searchResults(){const box=$('results');if(!box)return; const q=slug(searchValue.trim());if(!q){box.innerHTML='<p class="section-label">Digite para começar</p>';return;}const a=apps.filter(x=>slug(x.label).includes(q)), c=Array.from(new Map([...curated,...catalogs.movies.items,...catalogs.series.items,...pref.saved].map(x=>[x.id,x])).values()).filter(x=>slug(x.title).includes(q)).slice(0,15);box.innerHTML=(!a.length&&!c.length)?'<p class="section-label">Nenhum resultado encontrado</p>':`${a.length?`<h2 class="section-label">Aplicativos</h2><div class="app-grid">${a.map(appTile).join('')}</div>`:''}${c.length?`<h2 class="section-label">Filmes e séries</h2><div class="card-grid">${c.map(card).join('')}</div>`:''}`;}
function ambient(){return `<section class="amb-content"><div><span class="eyebrow">MODO AMBIENTE</span><h1>Dolomitas, Itália</h1><p id="ambient-clock"></p></div>${btn('Sair do modo ambiente','page','left','ghost glass','home')}</section>`;}
const pages={home,movies:()=>catalog('movies'),series:()=>catalog('series'),live,apps:allApps,saved,organize:organizer,settings,search,ambient};
const describe=el=>el&&el.dataset&&el.dataset.do?`${el.dataset.do}\n${el.dataset.arg||''}`:'';
function focusMatching(scope,signature){if(!signature)return false;const hit=Array.from(scope.querySelectorAll('button[data-do]')).find(el=>describe(el)===signature);if(hit){hit.focus();return true;}return false;}
function render(reset=false,refocus=true){
 const main=$('main'), old=document.activeElement, wasMain=main.contains(old), anchor=describe(old), y=main.scrollTop;
 document.body.className=`${page} ${pref.glass?'':'solid'} ${pref.wall?'':'no-wall'} ${useDpad?'dpad':''}`;
 syncHeader(); main.innerHTML=page==='home'||page==='ambient'?pages[page]():`<section class="panel">${pages[page]()}</section>`;
 main.scrollTop=reset?0:y;
 if(page==='search'){const q=$('query');q.addEventListener('input',()=>{searchValue=q.value;searchResults();});searchResults();}
 $('footer').innerHTML=`<span><kbd>OK</kbd> Selecionar</span><span><kbd>← ↑ ↓ →</kbd> Navegar</span><span><kbd>↩</kbd> Voltar</span><span class="signature"><i></i> Sua TV, do seu jeito</span>`;clock();
 if(refocus&&wasMain&&!dialog&&document.activeElement===document.body) focusMatching(main,anchor);
 if(page==='home'&&!useDpad&&!document.querySelector('.preset-focus')){const first=main.querySelector('.tile');if(first)first.classList.add('preset-focus');}
}
function focusPage(){
 const main=$('main'); const t=page==='home'?main.querySelector('.tile'):page==='search'?$('query'):page==='ambient'?main.querySelector('button'):null;
 if(t&&page==='search'&&native)return; // Enter on the input opens the system keyboard.
 if(t&&(useDpad||page==='search'||page==='ambient'))try{t.focus({preventScroll:true});}catch(_){t.focus();}
}
function go(to){
 if(!pages[to])return;
 if(dialog)closeDialog(false);
 if(to!==page&&to!=='search')searchValue='';
 if(to==='search'&&page!=='search')searchValue='';
 page=to;render(true,false);focusPage();
 if(to==='movies'||to==='series')load(to);
 if(to==='search'){load('movies');load('series');}
 if(to==='home'&&bool('trending'))load('movies');
}
function readCache(which){try{const v=JSON.parse(localStorage.getItem('nova.catalog.'+which)||'null');if(v&&Array.isArray(v.items)&&v.items.length)return v;}catch(_){}return null;}
const ttl=6*60*60*1000;
for(const key of ['movies','series']){const v=readCache(key);if(v)catalogs[key]={items:v.items,state:'cache',ts:v.ts};}
const artOk=s=>typeof s==='string'&&/^https:\/\/(is\d+-ssl\.mzstatic\.com|static\.tvmaze\.com)\//i.test(s)?s:'';
const urlOk=s=>typeof s==='string'&&/^https:\/\/(itunes\.apple\.com|tv\.apple\.com|www\.tvmaze\.com|www\.justwatch\.com)\//i.test(s)?s:'';
const year=s=>/^\d{4}/.test(s||'')?String(s).slice(0,4):'';
function normalize(which,raw){
 if(which==='movies'){
  const entries=raw&&raw.feed&&raw.feed.entry;if(!Array.isArray(entries))return [];
  return entries.slice(0,12).map(e=>{const leaf=k=>e[k]&&e[k].label||'';const images=e['im:image']||[];const c=e.category&&e.category.attributes||{};const id=e.id&&e.id.attributes&&e.id.attributes['im:id'];return {id:`apple:${id||leaf('im:name')}`,title:compact(leaf('im:name')),tag:'FILME',meta:[year(leaf('im:releaseDate')),compact(c.label)].filter(Boolean).join(' · '),image:artOk(images.length&&images[images.length-1].label),url:urlOk(leaf('id')),source:'iTunes Store',summary:compact(leaf('summary')).slice(0,740)};}).filter(x=>x.title&&x.url);
 }
 if(!Array.isArray(raw))return [];
 return raw.slice(0,12).filter(e=>e&&e.name&&urlOk(e.url)).map(e=>({id:`maze:${e.id}`,title:compact(e.name),tag:'SÉRIE',meta:[year(e.premiered),e.genres&&e.genres[0]].filter(Boolean).join(' · '),image:artOk(e.image&&e.image.medium),url:urlOk(e.url),source:'TVmaze',summary:compact(e.summary).slice(0,740)}));
}
function load(which,force=false){
 const s=catalogs[which];if(!s||s.state==='loading'||(!force&&s.ts&&Date.now()-s.ts<ttl))return;
 s.state='loading';if(page===which)render();
 if(native){try{native.catalog(which);}catch(_){catalogReply(which,false,'');}}
 else fetch(`catalog/${which}.json`).then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.text();}).then(s=>catalogReply(which,true,s)).catch(()=>catalogReply(which,false,''));
}
function catalogReply(which,good,body){
 const s=catalogs[which];if(!s)return;
 try{const items=good&&normalize(which,JSON.parse(body));if(!items||!items.length)throw Error('Catálogo vazio');s.items=items;s.ts=Date.now();s.state='ready';try{localStorage.setItem('nova.catalog.'+which,JSON.stringify({ts:s.ts,items}));}catch(_){} }catch(_){s.state='error';}
 if(page===which||(page==='home'&&which==='movies'&&bool('trending')))render(false,!dialog);
 if(page==='search'&&(!document.activeElement||!$('results').contains(document.activeElement))) searchResults();
}
function toast(s){clearTimeout(toastTimer);const t=$('toast');t.textContent=s;t.hidden=false;toastTimer=setTimeout(()=>{t.hidden=true;},3100);}
function openDialog(title,body,tag){
 if(!dialog) previousFocus=describe(document.activeElement);
 dialog=tag||'generic'; $('dialog').innerHTML=`<div class="dialog-head"><div><span class="eyebrow">NOVA OS</span><h2 id="dialog-title">${escape(title)}</h2></div>${rnd('Fechar','close','x')}</div>${body}`;
 $('overlay').hidden=false;$('viewport').setAttribute('aria-hidden','true');
 const first=$('dialog').querySelector('.actions button')||$('dialog').querySelector('button');if(first)first.focus();
}
function closeDialog(restore=true){if(!dialog)return;dialog=null;$('overlay').hidden=true;$('viewport').removeAttribute('aria-hidden');if(restore){if(!focusMatching($('stage'),previousFocus))focusPage();}}
function titleById(id){return [...curated,...catalogs.movies.items,...catalogs.series.items,...pref.saved].find(x=>x.id===id);}
function detail(id){const t=titleById(id);if(!t)return;const isSaved=pref.saved.some(x=>x.id===id);let src=t.art||t.image&&'art?url='+encodeURIComponent(t.image);
 openDialog(t.title,`${src?`<img class="detail-art${t.art?'':' poster'}" src="${attr(src)}" alt="">`:''}<div class="detail-meta">${escape([t.tag,t.meta].filter(Boolean).join(' · '))}</div><p>${escape(t.summary||'Sinopse não disponível.')}</p><div class="actions">${t.url?btn(t.source==='JustWatch'?'Onde assistir':'Abrir no '+t.source,'visit','external','primary',id):''}${btn(isSaved?'Remover da lista':'Salvar na minha lista','save',isSaved?'check':'bookmark','ghost glass',id)}</div><p class="credit">Fonte: ${escape(t.source||'Nova OS')}${t.art?' · Imagem ilustrativa':''}. A reprodução, quando disponível, acontece fora do launcher.</p>`,id);}
function manage(id){const a=apps.find(x=>x.id===id);if(!a)return;const i=pins().indexOf(id);openDialog(a.label,`<p>${i>=0?`${i+1}º favorito na tela inicial.`:'Este app não está fixado na tela inicial.'}</p><div class="actions">${btn(i>=0?'Desafixar':'Fixar no início','pin',i>=0?'x':'star','primary',id)}${i>0?btn('Mover à esquerda','raise','left','ghost glass',id):''}${i>=0&&i<tiles().length-1?btn('Mover à direita','lower','arrow','ghost glass',id):''}</div>`,'manage');}
function updatePins(id,mode){const ids=tiles().map(a=>a.id), i=ids.indexOf(id);if(mode==='pin'){if(i>=0)ids.splice(i,1);else if(ids.length<7)ids.push(id);else{toast('Já há sete favoritos. Desafixe um aplicativo primeiro.');return;}}else{const j=i+(mode==='raise'?-1:1);if(i<0||j<0||j>=ids.length)return;[ids[i],ids[j]]=[ids[j],ids[i]];}pref.pins=ids;persist();const focus=describe(document.activeElement);render(false,false);manage(id);focusMatching($('dialog'),focus);toast('Favoritos atualizados.');}
function navigateExternal(url){if(!url)return;if(native){try{native.openExternal(url);}catch(_){toast('Não foi possível abrir o link.');}}else window.open(url,'_blank','noopener,noreferrer');}
function doAction(action,arg){switch(action){
 case 'page': go(arg);break;
 case 'settings':case 'search':go(action);break;
 case 'close':closeDialog();break;
 case 'app':{const a=apps.find(v=>v.id===arg);if(!a)break;if(native)native.launch(a.id);else navigateExternal(a.url);break;}
 case 'organize':organizeFrom=page==='organize'?'home':page;go('organize');break;
 case 'manage':manage(arg);break;
 case 'pin':case 'raise':case 'lower':updatePins(arg,action);break;
 case 'detail':detail(arg);break;
 case 'visit':{const t=titleById(arg);if(t)navigateExternal(urlOk(t.url));break;}
 case 'save':{const t=titleById(arg);if(!t)break;const i=pref.saved.findIndex(x=>x.id===arg);if(i>=0)pref.saved.splice(i,1);else{if(pref.saved.length>=100){toast('Remova um título antes de salvar outro.');break;}pref.saved.push(t);}persist();if(page==='saved')render(false,false);if(titleById(arg)){detail(arg);focusMatching($('dialog'),'save\n'+arg);}else closeDialog();toast(i>=0?'Título removido.':'Título salvo na sua lista.');break;}
 case 'toggle': if(['glass','films','wall','hero','auto','trending'].includes(arg)){pref[arg]=!pref[arg];persist();render();if(pref[arg]&&(arg==='auto'||arg==='trending'))load('movies');}break;
 case 'refresh':load(arg,true);break;
 case 'about':openDialog('Sobre o Nova OS',`<p>Versão ${VERSION} · Launcher para Android TV e TV boxes.</p><p>Os favoritos e os ajustes são gravados neste aparelho. O catálogo consulta a iTunes Store (filmes) e o TVmaze (séries) e armazena a última seleção localmente. O Nova OS não acessa o seu histórico de reprodução nem faz login em serviços de streaming.</p><p class="credit">Dados de séries: TVmaze (CC BY-SA). Fonte Manrope (SIL OFL). Imagens editoriais ilustrativas.</p><div class="actions">${btn('Fechar','close','check','primary')}</div>`);break;
 case 'system': if(native)native.openSystem(arg);else toast('Esta opção fica disponível no aparelho Android.');break;
 }}
let held=null, suppressClick=false;
function back(){if(dialog){closeDialog();return true;}if(page==='home')return false;if(page==='organize')go(organizeFrom);else go('home');return true;}
function setDpad(){useDpad=true;document.body.classList.add('dpad');const f=document.querySelector('.preset-focus');if(f)f.classList.remove('preset-focus');}
function spatial(k){
 const isOverlay=!!dialog;
 const root=isOverlay?$('dialog'):$('stage');const active=document.activeElement;const elements=Array.from(root.querySelectorAll('button:not([disabled]),input:not([disabled])')).filter(el=>el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden');
 if(!elements.includes(active)){const first=page==='home'&&!isOverlay?elements.find(e=>e.classList.contains('tile')):null;const target=first||elements[0];if(target)target.focus();return;}
 const r=active.getBoundingClientRect(), x=(r.left+r.right)/2,y=(r.top+r.bottom)/2;let best=null, score=Infinity;
 for(const el of elements){if(el===active)continue;const t=el.getBoundingClientRect(), tx=(t.left+t.right)/2,ty=(t.top+t.bottom)/2, h=k==='ArrowLeft'||k==='ArrowRight';const major=h?(k==='ArrowLeft'?x-tx:tx-x):(k==='ArrowUp'?y-ty:ty-y);if(major<3)continue;const overlap=h?Math.min(t.bottom,r.bottom)-Math.max(t.top,r.top):Math.min(t.right,r.right)-Math.max(t.left,r.left);const off=h?Math.abs(ty-y):Math.abs(tx-x);const point=major+off*(overlap>1?.26:3)+(overlap>1?0:34);if(point<score){score=point;best=el;}}
 if(best)best.focus();
}
function key(k,down,repeat=false,fromRemote=false){
 if(k==='Escape'||k==='BrowserBack'||k==='GoBack'){if(!down)back();return true;}
 const arrows=['ArrowUp','ArrowRight','ArrowDown','ArrowLeft'];const el=document.activeElement;
 if(arrows.includes(k)){if(el&&el.tagName==='INPUT'&&(k==='ArrowLeft'||k==='ArrowRight')){if(!fromRemote)return false;if(down){const left=k==='ArrowLeft',pos=left?el.selectionStart:el.selectionEnd;const next=Math.max(0,Math.min(el.value.length,pos+(left?-1:1)));try{el.setSelectionRange(next,next);}catch(_){}}return true;}if(down){setDpad();spatial(k);}return true;}
 if(k!=='Enter'||!el||el.tagName!=='BUTTON')return false;
 if(down){setDpad();if(!held&&!repeat){held={el,long:false,timer:0};if(el.dataset.do==='app'&&page==='home')held.timer=setTimeout(()=>{if(!held||held.el!==el)return;held.long=true;organizeFrom='home';go('organize');render();manage(el.dataset.arg);},570);}}
 else if(held){const work=held;clearTimeout(work.timer);held=null;if(!work.long&&document.activeElement===work.el)work.el.click();}return true;
}
document.addEventListener('click',e=>{const b=e.target.closest('button[data-do]');if(b&&!suppressClick)doAction(b.dataset.do,b.dataset.arg||'');if(e.target===$('overlay'))closeDialog();});
document.addEventListener('keydown',e=>{
 if(e.key==='Tab'){setDpad();if(dialog){const bs=Array.from($('dialog').querySelectorAll('button'));if(bs.length&&((!e.shiftKey&&document.activeElement===bs[bs.length-1])||(e.shiftKey&&document.activeElement===bs[0]))){e.preventDefault();bs[e.shiftKey?bs.length-1:0].focus();}}return;}
 if(key(e.key===' '&&document.activeElement.tagName==='BUTTON'?'Enter':e.key,true,e.repeat))e.preventDefault();
});
document.addEventListener('keyup',e=>{if(key(e.key===' '&&document.activeElement.tagName==='BUTTON'?'Enter':e.key,false))e.preventDefault();});
let pointerTimer;document.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'||e.pointerType==='touch'){useDpad=false;document.body.classList.remove('dpad');const pre=document.querySelector('.preset-focus');if(pre)pre.classList.remove('preset-focus');}const el=e.target.closest('.tile[data-do="app"]');if(el&&page==='home'){pointerTimer=setTimeout(()=>{suppressClick=true;organizeFrom='home';go('organize');manage(el.dataset.arg);setTimeout(()=>{suppressClick=false;},500);},650);}});for(const k of ['pointerup','pointercancel','pointermove'])document.addEventListener(k,()=>clearTimeout(pointerTimer));document.addEventListener('contextmenu',e=>{if(e.target.closest('.tile'))e.preventDefault();});
function resize(){const w=innerWidth,h=innerHeight;const s=Math.min(w/1600,h/900);const rh=Math.min(1000,Math.max(900,h/s));const rw=Math.min(1750,Math.max(1600,w/s));const cs=document.documentElement.style;cs.setProperty('--s',s);cs.setProperty('--vh',`${rh}px`);cs.setProperty('--ww',`${rw}px`);}
window.NovaUi={
 updateApps(raw){try{const rows=JSON.parse(raw);if(!Array.isArray(rows))return;apps=rows.filter(a=>a&&a.id&&a.label).map(a=>{const entry=services.find(x=>x[3].includes(a.pkg));return {...a,brand:entry&&entry[0]};});apps.sort((a,b)=>{const rank=x=>x.brand?services.findIndex(s=>s[0]===x.brand):999;return rank(a)-rank(b)||a.label.localeCompare(b.label,'pt-BR');});if(['home','apps','organize','live'].includes(page)){render(false,!dialog);if(document.activeElement===document.body&&useDpad&&!dialog)focusPage();}if(page==='search')searchResults();}catch(_){}},
 catalogReply, toast, back, key, net, home(){go('home');}
};
window.addEventListener('resize',resize);window.addEventListener('online',net);window.addEventListener('offline',net);window.addEventListener('blur',()=>{if(held){clearTimeout(held.timer);held=null;}});
resize();render(true,false);focusPage();setInterval(()=>{clock();net();},30000);
if(native)native.ready();if(pref.auto||pref.trending) setTimeout(()=>load('movies'),550);
})();
