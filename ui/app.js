(() => {
'use strict';
// Older Android System WebViews lack these otherwise standard APIs.
const each = Array.prototype.forEach;
if (!NodeList.prototype.forEach) NodeList.prototype.forEach = each;
if (!Element.prototype.matches) Element.prototype.matches = Element.prototype.webkitMatchesSelector;
if (!Element.prototype.closest) Element.prototype.closest = function(selector) {
 for(let node=this;node;node=node.parentElement)if(node.matches(selector))return node;
 return null;
};
if (!Object.assign) Object.assign = (dst,...sources) => {sources.forEach(src=>{if(src!=null)Object.keys(src).forEach(key=>{dst[key]=src[key];});});return dst;};
if (!Array.prototype.findIndex) Object.defineProperty(Array.prototype,'findIndex',{value:function(test){for(let i=0;i<this.length;i++)if(test(this[i],i,this))return i;return -1;},configurable:true,writable:true});
if (!Array.prototype.find) Object.defineProperty(Array.prototype,'find',{value:function(test){const index=this.findIndex(test);return index<0?undefined:this[index];},configurable:true,writable:true});
if (!Object.entries) Object.entries = obj => Object.keys(obj).map(key=>[key,obj[key]]);
if (!Array.prototype.includes) Object.defineProperty(Array.prototype,'includes',{value:function(item){return this.indexOf(item)!==-1;},configurable:true,writable:true});
if (!Array.from) Array.from = items => Array.prototype.slice.call(items);
function getText(path){return new Promise((resolve,reject)=>{
 const req=new XMLHttpRequest();req.open('GET',path,true);req.timeout=12000;
 req.onload=()=>{if(req.status>=200&&req.status<300)resolve(req.responseText);else reject(Error('HTTP '+req.status));};
 req.onerror=req.ontimeout=()=>reject(Error('Arquivo indisponível'));req.send();
});}
const legacyLayout=!(window.CSS&&CSS.supports&&CSS.supports('display','grid')&&CSS.supports('aspect-ratio','16 / 9'));
const native = window.NovaNative;
function softwareMode(){try{return !!(native&&native.softwareRendering&&native.softwareRendering());}catch(_){return false;}}
const softwareRendering=softwareMode();
const legacyGlass=!!(window.CSS&&CSS.supports&&CSS.supports('--x','0')&&(softwareRendering||(!CSS.supports('backdrop-filter','blur(11px)')&&!CSS.supports('-webkit-backdrop-filter','blur(11px)'))));
const $ = id => document.getElementById(id);
const VERSION = '1.2.5';
let glassFrame=0;
function sampleGlass(){
 if(!legacyGlass||glassFrame)return;
 glassFrame=requestAnimationFrame(()=>{
  glassFrame=0;
  if(!pref.glass||!pref.wall||idleMode)return;
  const frame=$('tv-screen').getBoundingClientRect(), scale=frame.width/1600;if(!scale)return;
  const positions=Array.from(document.querySelectorAll('#top .nav,#top .round,#main .pill.ghost,#main .ambient-card')).map(el=>{
   const r=el.getBoundingClientRect();
   return [el,((frame.left-r.left)/scale)+'px '+((frame.top-r.top)/scale)+'px'];
  });
  positions.forEach(([el,position])=>{if(el.style.getPropertyValue('--legacy-sample-position')!==position)el.style.setProperty('--legacy-sample-position',position);});
 });
}
function glassWallpaper(id){if(legacyGlass)$('tv-screen').style.setProperty('--legacy-wall',`url("${location.origin}/wallpapers/glass-${id||'dolomitas'}.webp")`);}
const pref = {glass:true, films:true, wall:true, rotate:true, moreHome:true, hero:true, motion:true, auto:true, trending:false, pins:null, saved:[]};
try { Object.assign(pref, JSON.parse(localStorage.getItem('nova.v1')||'{}')); } catch (_) {}
const persist = () => {try{localStorage.setItem('nova.v1',JSON.stringify(pref));}catch(_){}};
const paths = {
store:'<path d="M5.5 8h13l1.2 12.5H4.3L5.5 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/><path d="m11 12 3.3 2.3L11 16.5Z" fill="currentColor" stroke="none"/>',
star:'<path d="M12 2c1.2 6.2 3.8 8.8 10 10-6.2 1.2-8.8 3.8-10 10C10.8 15.8 8.2 13.2 2 12c6.2-1.2 8.8-3.8 10-10Z" fill="currentColor" stroke="none"/><path d="M19 3v4m-2-2h4"/>',
home:'<path d="m3.5 10 8.5-6.5 8.5 6.5v9.5a1 1 0 0 1-1 1H15v-6H9v6H4.5a1 1 0 0 1-1-1Z"/>',film:'<rect x="3" y="3.5" width="18" height="17" rx="2"/><path d="M7 4v16m10-16v16M3 9h4m-4 6h4m10-6h4m-4 6h4"/>',tv:'<rect x="3" y="5" width="18" height="13" rx="2"/><path d="M8 22h8"/>',live:'<circle cx="12" cy="12" r="2"/><path d="M7.7 7.7a6 6 0 0 0 0 8.6m8.6-8.6a6 6 0 0 1 0 8.6M4.2 4.2a11 11 0 0 0 0 15.6m15.6-15.6a11 11 0 0 1 0 15.6"/>',search:'<circle cx="10.8" cy="10.8" r="5.8"/><path d="m15.4 15.4 4.1 4.1"/>',wifi:'<path d="M2.5 8a15.6 15.6 0 0 1 19 0M5.5 11.6a10.6 10.6 0 0 1 13 0M8.5 15.1a5.7 5.7 0 0 1 7 0"/><circle cx="12" cy="18.6" r="1" fill="currentColor" stroke="none"/>',settings:'<circle cx="12" cy="12" r="3"/><path d="M10 3h4l.7 2.3 2.1 1.2 2.3-.5 2 3.5-1.6 1.7v2.4l1.6 1.7-2 3.5-2.3-.5-2.1 1.2L14 22h-4l-.7-2.5-2.1-1.2-2.3.5-2-3.5 1.6-1.7v-2.4L2.9 9.5l2-3.5 2.3.5 2.1-1.2Z"/>',
play:'<path d="M8 5.3a.8.8 0 0 0-1.2.7v12a.8.8 0 0 0 1.2.7l10-6a.8.8 0 0 0 0-1.4Z" fill="currentColor" stroke="none"/>',bookmark:'<path d="M6 4h12v17l-6-4-6 4Z"/>',mountain:'<path d="m2 18 6-9 4 5 3-8 7 12ZM6 12l2 1.5 2-1m3-2 2 1.5 2-1.5"/>',chev:'<path d="m9 5 7 7-7 7"/>',arrow:'<path d="M4 12h15m-6-6 6 6-6 6"/>',left:'<path d="M20 12H5m6-6-6 6 6 6"/>',grid:'<rect x="3.5" y="3.5" width="6" height="6" rx="1"/><rect x="14.5" y="3.5" width="6" height="6" rx="1"/><rect x="3.5" y="14.5" width="6" height="6" rx="1"/><rect x="14.5" y="14.5" width="6" height="6" rx="1"/>',sliders:'<path d="M4 7h5m4 0h7M4 17h9m4 0h3M9 4v6m8 4v6"/>',x:'<path d="m6 6 12 12M6 18 18 6"/>',check:'<path d="m5 12 5 5 9-10"/>',info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/>',reload:'<path d="M20 11a8 8 0 1 0-2 6m2-12v6h-6"/>',external:'<path d="M13 4h7v7m0-7-9 9m8 0v7H4V5h7"/>',up:'<path d="m6 14 6-6 6 6"/>',down:'<path d="m6 10 6 6 6-6"/>',layers:'<path d="m3 9 9-5 9 5-9 5Zm0 4 9 5 9-5M3 17l9 5 9-5"/>',bolt:'<path d="m13 3-8 11h6l-1 7 9-12h-6Z"/>'};
const ico = (id,n=20) => `<svg width="${n}" height="${n}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[id]||paths.grid}</svg>`;
const logos = ['netflix','youtube','prime','hbo','spotify','apple','plex'];
const services = [
 ['netflix','Netflix','https://www.netflix.com/br/',['com.netflix.ninja','com.netflix.mediaclient']], ['youtube','YouTube','https://www.youtube.com/',['com.google.android.youtube.tv','com.google.android.youtube']], ['prime','Prime Video','https://www.primevideo.com/',['com.amazon.amazonvideo.livingroom','com.amazon.avod.thirdpartyclient']], ['hbo','HBO Max','https://www.hbomax.com/br/pt',['com.wbd.stream','com.hbo.hbonow']], ['spotify','Spotify','https://open.spotify.com/',['com.spotify.tv.android','com.spotify.music']], ['apple','Apple TV','https://tv.apple.com/br',['com.apple.atve.androidtv.appletv','com.apple.atve.androidtv.appletv.googleplay','com.apple.tv']], ['plex','Plex','https://www.plex.tv/pt-br/',['com.plexapp.android','com.plexapp.plex']]];
const demoApps = services.map(([brand,label,url])=>({id:brand,brand,label,url}));
const curated = [
 {id:'nova:interestelar',title:'Interestelar',meta:'2014 · Ficção científica · 2h49',tag:'FILME',art:'img/media/interstellar.webp',poster:'img/media/interstellar-poster.webp',url:'https://tv.apple.com/br/movie/interestelar/umc.cmc.1vrwat5k1ucm5k42q97ioqyq3',source:'Apple TV',summary:'Com a Terra em crise, uma equipe de astronautas parte à procura de um novo lar para a humanidade.'},
 {id:'nova:severance',title:'Ruptura',meta:'2022 · Suspense e mistério',tag:'SÉRIE',art:'img/media/severance.webp',poster:'img/media/severance-poster.webp',url:'https://tv.apple.com/br/show/ruptura/umc.cmc.1srk2goyh2q2zdxcx605w8vtx',source:'Apple TV',summary:'Um procedimento separa as memórias do trabalho e da vida pessoal de funcionários de uma empresa, até que as fronteiras começam a falhar.'},
 {id:'nova:duna',title:'Duna: Parte Dois',meta:'2024 · Ficção científica · 2h46',tag:'FILME',art:'img/media/dune.webp',poster:'img/media/dune-poster.webp',url:'https://tv.apple.com/br/movie/duna-parte-dois/umc.cmc.363aycnv6vy9qgekvew6fveb9',source:'Apple TV',summary:'Paul Atreides se une a Chani e aos Fremen enquanto procura vingar a destruição da sua família.'},
 {id:'nova:jogos',title:'Jogos Vorazes',fullTitle:'Jogos Vorazes: A Cantiga dos Pássaros e das Serpentes',meta:'2023 · Ação e aventura · 2h37',tag:'FILME',art:'img/media/hunger.webp',poster:'img/media/hunger-poster.webp',url:'https://tv.apple.com/br/movie/jogos-vorazes-a-cantiga-dos-passaros-e-das-serpentes/umc.cmc.4vck516h5k6fsg7r7srnfyp4w',source:'Apple TV',summary:'A cantiga dos pássaros e das serpentes volta ao início da história de Coriolanus Snow e dos Jogos Vorazes.'}];
const primeMovies = [
 {
  "id": "prime:contador",
  "title": "O Contador 2",
  "tag": "FILME",
  "meta": "2025 · Ação · 2h14",
  "art": "img/prime/contador.webp",
  "poster": "img/prime/contador-poster.webp",
  "url": "https://www.primevideo.com/-/pt/detail/0TDY5ZV7OX9E4MJYBTL5ODPZVI?language=pt_BR",
  "source": "Prime Video",
  "summary": "Christian Wolff se reúne com o irmão para investigar um assassinato e acaba no centro de uma conspiração."
 },
 {
  "id": "prime:mapa",
  "title": "O Mapa Que Leva Até Você",
  "tag": "FILME",
  "meta": "2025 · Romance · 1h38",
  "art": "img/prime/mapa.webp",
  "poster": "img/prime/mapa-poster.webp",
  "url": "https://www.primevideo.com/-/pt/detail/0FQ3FRT54P5UTYEE2JNMN6KOEA?language=pt_BR",
  "source": "Prime Video",
  "summary": "Uma viagem pela Europa muda de rumo quando Heather conhece Jack e começa a questionar os planos para seu futuro."
 },
 {
  "id": "prime:matador",
  "title": "Matador de Aluguel",
  "tag": "FILME",
  "meta": "2024 · Ação · 1h56",
  "art": "img/prime/matador.webp",
  "poster": "img/prime/matador-poster.webp",
  "url": "https://www.primevideo.com/-/pt/detail/0FC3O0LQUX1IKRA19XD4UKJASF?language=pt_BR",
  "source": "Prime Video",
  "summary": "Um ex-lutador aceita trabalhar como segurança em um bar da Flórida e descobre que a tarefa é mais perigosa do que imaginava."
 },
 {
  "id": "prime:ideia",
  "title": "Uma Ideia de Você",
  "tag": "FILME",
  "meta": "2024 · Romance · 1h51",
  "art": "img/prime/ideia.webp",
  "poster": "img/prime/ideia-poster.webp",
  "url": "https://www.primevideo.com/-/pt/detail/0NRT15S2XG06SG5HBV5NQAW3E3?language=pt_BR",
  "source": "Prime Video",
  "summary": "Uma mãe solteira conhece o vocalista de uma boy band e precisa lidar com os holofotes de um romance inesperado."
 },
 {
  "id": "prime:air",
  "title": "AIR: A História por Trás do Logo",
  "tag": "FILME",
  "meta": "2023 · Drama esportivo · 1h47",
  "art": "img/prime/air.webp",
  "poster": "img/prime/air-poster.webp",
  "url": "https://www.primevideo.com/-/pt/detail/0HU8NSAWO6AEW0DH1RNPMTRGLP?language=pt_BR",
  "source": "Prime Video",
  "summary": "A equipe de basquete da Nike aposta em um jovem Michael Jordan e muda os rumos da indústria esportiva."
 },
 {
  "id": "prime:guerra",
  "title": "A Guerra do Amanhã",
  "tag": "FILME",
  "meta": "2021 · Ficção científica · 2h11",
  "art": "img/prime/guerra.webp",
  "poster": "img/prime/guerra-poster.webp",
  "url": "https://www.primevideo.com/-/pt/detail/0HBQNYK934NCSB5O4DWA3EJ8CP?language=pt_BR",
  "source": "Prime Video",
  "summary": "Viajantes de 2051 chegam ao presente em busca de ajuda para vencer uma guerra que ameaça o futuro da humanidade."
 },
 {
  "id": "prime:operacao-natal",
  "title": "Operação Natal",
  "tag": "FILME",
  "meta": "2024 · Aventura · 1h53",
  "art": "img/prime/operacao-natal.webp",
  "poster": "img/prime/operacao-natal-poster.webp",
  "url": "https://www.primevideo.com/-/pt/detail/0RNA7FGRLKHSV1BNM01TY8Q33T?language=pt_BR",
  "source": "Prime Video",
  "summary": "Um chefe de segurança do Polo Norte e um caçador de recompensas procuram o Papai Noel desaparecido."
 },
 {
  "id": "prime:ricky",
  "title": "Ricky Stanicky",
  "tag": "FILME",
  "meta": "2024 · Comédia · 1h48",
  "art": "img/prime/ricky.webp",
  "poster": "img/prime/ricky-poster.webp",
  "url": "https://www.primevideo.com/-/pt/detail/0FU1IH3XI75U5QKDVT2XPPJ648?language=pt_BR",
  "source": "Prime Video",
  "summary": "Três amigos contratam um ator para interpretar o amigo imaginário que usam como desculpa há vinte anos."
 },
 {
  "id": "prime:vermelho",
  "title": "Vermelho, Branco & Sangue Azul",
  "tag": "FILME",
  "meta": "2023 · Romance · 2h01",
  "art": "img/prime/vermelho.webp",
  "poster": "img/prime/vermelho-poster.webp",
  "url": "https://www.primevideo.com/-/pt/detail/0G09O3U0SEXYXD3GGQIDZEH32I?language=pt_BR",
  "source": "Prime Video",
  "summary": "Uma trégua pública entre o filho da presidenta dos EUA e um príncipe britânico dá lugar a uma afeição inesperada."
 },
 {
  "id": "prime:minha-culpa",
  "title": "Minha Culpa",
  "tag": "FILME",
  "meta": "2023 · Romance · 1h58",
  "art": "img/prime/minha-culpa.webp",
  "poster": "img/prime/minha-culpa-poster.webp",
  "url": "https://www.primevideo.com/-/pt/detail/0S0OIMOTSETYIWA2EVTWWH7JR9?language=pt_BR",
  "source": "Prime Video",
  "summary": "Ao mudar para a casa da nova família, Noah conhece Nick e os dois precisam lidar com uma atração inesperada."
 },
 {
  "id": "prime:nossa-culpa",
  "title": "Nossa Culpa",
  "tag": "FILME",
  "meta": "2025 · Romance · 1h52",
  "art": "img/prime/nossa-culpa.webp",
  "poster": "img/prime/nossa-culpa-poster.webp",
  "url": "https://www.primevideo.com/-/pt/detail/0PCRKKG8397FYGEC8X1RH994X0?language=pt_BR",
  "source": "Prime Video",
  "summary": "O casamento de dois amigos reúne Noah e Nick e reacende sentimentos mal resolvidos."
 },
 {
  "id": "prime:sua-culpa",
  "title": "Sua Culpa",
  "tag": "FILME",
  "meta": "2024 · Drama romântico · 2h",
  "art": "img/prime/sua-culpa.webp",
  "poster": "img/prime/sua-culpa-poster.webp",
  "url": "https://www.primevideo.com/-/pt/detail/0G5EHVLC83CC57Z5DG60LLI69L?language=pt_BR",
  "source": "Prime Video",
  "summary": "Conforme Noah entra na faculdade e Nick começa a trabalhar, novas pessoas e conflitos testam a relação."
 },
 {
  "id": "prime:som",
  "title": "O Som do Silêncio",
  "tag": "FILME",
  "meta": "2020 · Drama · 2h01",
  "art": "img/prime/som.webp",
  "poster": "img/prime/som-poster.webp",
  "url": "https://www.primevideo.com/-/pt/detail/0OWOY28NCAYY94VCM9FFFXRKS1?language=pt_BR",
  "source": "Prime Video",
  "summary": "Um baterista começa a perder a audição e precisa repensar seu futuro e a forma como se relaciona com a música."
 },
 {
  "id": "prime:pisque",
  "title": "Pisque Duas Vezes",
  "tag": "FILME",
  "meta": "2024 · Suspense · 1h42",
  "art": "img/prime/pisque.webp",
  "poster": "img/prime/pisque-poster.webp",
  "url": "https://www.primevideo.com/-/pt/detail/0LOZEJ7DV129EESYFH1GFI0RZB?language=pt_BR",
  "source": "Prime Video",
  "summary": "Uma viagem a uma ilha privada toma um rumo inquietante quando uma convidada começa a desconfiar do anfitrião."
 },
 {
  "id": "prime:musica",
  "title": "Música",
  "tag": "FILME",
  "meta": "2024 · Comédia romântica · 1h31",
  "art": "img/prime/musica.webp",
  "poster": "img/prime/musica-poster.webp",
  "url": "https://www.primevideo.com/-/pt/detail/0L09R39KTOOPZS3KN0H28WOM4B?language=pt_BR",
  "source": "Prime Video",
  "summary": "Um jovem artista com sinestesia tenta conciliar a carreira, a vida amorosa e a cultura brasileira da família."
 },
 {
  "id": "prime:natal",
  "title": "A Batalha de Natal",
  "tag": "FILME",
  "meta": "2023 · Comédia · 1h52",
  "art": "img/prime/natal.webp",
  "poster": "img/prime/natal-poster.webp",
  "url": "https://www.primevideo.com/-/pt/detail/0HRQ67NQZWBZNAJCML7WX8VXYY?language=pt_BR",
  "source": "Prime Video",
  "summary": "Para vencer a competição de enfeites do bairro, um pai faz um acordo que dá vida às decorações natalinas."
 }
];
const isPrime = t => t.source==='Prime Video';
const MOVIE_BATCH=12;
let movieFilter='all', movieLimit=MOVIE_BATCH;

const catalogs = {movies:{items:[],state:'idle'},series:{items:[],state:'idle'}};
let apps = native ? [] : demoApps.slice(), page='home', dialog=null, previousFocus='', useDpad=!!native, toastTimer, searchValue='', organizeFrom='home', paintedHeader=false, headerPage='', clockMinute=-1, onlineState=null, homeReturn=null;
const escape = s => String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const attr=escape;
const slug=s=>{const text=String(s||'');return (text.normalize?text.normalize('NFD'):text).replace(/[\u0300-\u036f]/g,'').toLowerCase();};
const compact=s=>String(s||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
let appIndexSource=null, installedById=new Map(), appNames=[], lastAppPayload='';
const brandByPackage=Object.create(null), brandOrder=Object.create(null);
services.forEach(([brand,label,url,packages],i)=>{brandOrder[brand]=i;packages.forEach(pkg=>{if(!brandByPackage[pkg])brandByPackage[pkg]=brand;});});
function ensureAppIndex(){
 if(appIndexSource===apps)return;
 appIndexSource=apps;installedById=new Map();appNames=apps.map(a=>{installedById.set(a.id,a);return {app:a,name:slug(a.label)};});
}
const bool=(key)=>!!pref[key];
const btn=(text,action,icon='',cls='ghost glass',arg='')=>`<button class="pill ${cls}" data-do="${action}" data-arg="${attr(arg)}">${icon?ico(icon,18):''}${escape(text)}</button>`;
const rnd=(name,action,icon=action)=>`<button type="button" class="round glass" aria-label="${name}" title="${name}" data-do="${action}">${ico(icon,21)}</button>`;
const tabs=[['home','Início','home'],['movies','Filmes','film'],['series','Séries','tv'],['live','Ao vivo','live']];
const syncHeader=()=>{
 if(!paintedHeader){$('top').innerHTML=`<button class="brand" aria-label="Nova OS, início" data-do="page" data-arg="home"><img class="nova-wordmark" src="img/brand/nova-os-header.webp" alt="" width="174" height="54" decoding="async"></button><nav class="nav glass" aria-label="Navegação principal"><span class="nav-indicator" aria-hidden="true"></span>${tabs.map(([id,name,i])=>`<button data-do="page" data-arg="${id}" aria-label="${name}">${ico(i,18)}<span class="nav-label" aria-hidden="true">${name}</span></button>`).join('')}</nav><div class="header-right">${rnd('Nova Store','storeShortcut','store')}${rnd('Buscar','search')}<span class="net" id="net" title="Conexão">${ico('wifi',21)}</span><div class="time"><b id="clock"></b><span id="date"></span></div>${rnd('Configurações','settings')}</div>`;paintedHeader=true;}
 if(headerPage===page)return;headerPage=page;
 const nav=$('top').querySelector('.nav');const index=tabs.findIndex(t=>t[0]===page);nav.classList.toggle('has-current',index>=0);if(index>=0){nav.style.setProperty('--nav-index',index);if(legacyLayout)nav.querySelector('.nav-indicator').style.transform='translateX('+(index*44)+'px)';}
 nav.querySelectorAll('button').forEach(el=>{const active=el.dataset.arg===page;el.classList.toggle('active',active);if(active)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');});
 $('top').querySelectorAll('.header-right [data-do]').forEach(el=>{if(el.dataset.do===page)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');});
};
function clock(){
 const d=new Date(), minute=Math.floor(d.getTime()/60000);
 if(minute!==clockMinute){clockMinute=minute;$('clock').textContent=d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',hour12:false});$('date').textContent=d.toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'short'}).replace(/\./g,'').replace(/ de /g,' ');}
 const ambientClock=$('ambient-clock');if(ambientClock&&ambientClock.textContent!==$('clock').textContent)ambientClock.textContent=$('clock').textContent;
}
function net(){const el=$('net');if(!el)return;const online=native?connection():navigator.onLine;if(online===onlineState)return;onlineState=online;el.classList.toggle('off',!online);el.title=online?'Conectado':'Sem conexão';}
function connection(){try{return native.isOnline();}catch(_){return false;}}
const section=(title,sub,action,text,icon='arrow',arg='')=>`<div class="section-head"><h2>${title}</h2>${sub?`<p>${sub}</p>`:''}${action?`<button class="small" data-do="${action}" data-arg="${arg}">${text}${ico(icon,16)}</button>`:''}</div>`;
// Chromium 52 ignores loading=lazy. Observe in the scrolling panel and only
// assign a URL when an image is close enough to be needed.
const imageObserver=window.IntersectionObserver?new IntersectionObserver(entries=>{
 for(const entry of entries){
  if(!entry.isIntersecting&&entry.intersectionRatio<=0)continue;
  const img=entry.target, src=img.getAttribute('data-image');
  imageObserver.unobserve(img);
  if(src&&$('main').contains(img)){img.removeAttribute('data-image');img.setAttribute('src',src);}
 }
},{root:$('main'),rootMargin:'0px 0px 72px 0px'}):null;
function imageSource(src){return imageObserver?`data-image="${attr(src)}"`:`src="${attr(src)}" loading="lazy"`;}
function watchImages(root){if(imageObserver)each.call(root.querySelectorAll('img[data-image]'),img=>imageObserver.observe(img));}
function forgetImages(root){if(imageObserver)each.call(root.querySelectorAll('img[data-image]'),img=>imageObserver.unobserve(img));}
function appTile(a){const more=a.id==='__more';const mark=more?ico('grid',33):logos.includes(a.brand)?`<img alt="" class="app-logo logo-${a.brand}" src="img/brand/${a.brand}.webp">`:a.icon&&native?`<img alt="" ${imageSource(a.icon)}>`:`<span class="generic">${escape(a.label.charAt(0).toUpperCase())}</span>`;return `<button class="tile" data-do="${more?'page':'app'}" data-arg="${more?'apps':attr(a.id)}" aria-label="${attr(a.label)}"><span class="app-mark glass${more?' more':''}">${mark}</span><span class="app-label">${escape(a.label)}</span></button>`;}
function pins(){if(Array.isArray(pref.pins))return pref.pins; return apps.slice(0,7).map(a=>a.id);}
function tiles(){ensureAppIndex();return pins().map(id=>installedById.get(id)).filter(Boolean).slice(0,7);}
function card(t,vertical=false){
 const portrait=vertical===true;
 const image=portrait&&t.image?t.image.replace(/\/\d+x\d+bb\.(png|jpg)$/i,'/300x450bb.jpg'):t.image;
 const artwork=image&&'art?url='+encodeURIComponent(image);
 const src=portrait?(t.poster||artwork):t.art||artwork;
 const contained=!portrait&&!t.art;
 return `<button class="movie" data-do="detail" data-arg="${attr(t.id)}" aria-label="${attr(t.fullTitle||t.title)}"><span class="banner${portrait?' portrait-frame':contained?' poster-banner':''}">${src?`<img alt="" class="art${contained?' poster-art':''}" ${imageSource(src)}>`:''}${isPrime(t)?'<span class="provider-prime">Prime Video</span>':`<span class="tag">${escape(t.tag||'DESTAQUE')}</span>`}<span class="play-dot">${ico('chev',17)}</span></span><span class="movie-info"><span class="movie-title">${escape(t.title)}</span><span class="movie-meta">${escape(t.meta||'')}</span></span></button>`;
}
const moreDestinations=[
 ['movies','Filmes','Histórias para a sua próxima sessão','film','cinema'],
 ['series','Séries','Encontre a sua próxima maratona','tv','series'],
 ['live','Ao vivo','Acesse seus apps de transmissão','live','live']
];
const tvShortcuts=[
 ['apps','Todos os apps','Abra sua biblioteca de aplicativos','grid'],
 ['search','Buscar','Encontre apps, filmes e séries','search'],
 ['ambient','Modo ambiente','Deixe só a paisagem na tela','mountain']
];
function primeHome(){
 return bool('films')?`<section class="more-section prime-home" aria-label="No Prime Video">${section('No Prime Video','Filmes selecionados para abrir no streaming.','homeMore','Ver Prime Video','arrow','primeMovies')}<div class="card-grid">${primeMovies.slice(0,4).map(card).join('')}</div></section>`:'';
}
function extraHome(){
 if(!bool('moreHome'))return '';
 const category=([dest,title,desc,icon,art])=>`<button type="button" class="more-category glass cat-${art}" data-do="homeMore" data-arg="${dest}" aria-label="${title}, explorar"><span class="category-picture" aria-hidden="true"></span><span class="more-copy"><span class="more-symbol">${ico(icon,20)}</span><strong>${title}</strong><small>${desc}</small></span><span class="more-arrow" aria-hidden="true">${ico('arrow',18)}</span></button>`;
 const quick=([dest,title,desc,icon])=>`<button type="button" class="more-quick glass" data-do="homeMore" data-arg="${dest}" aria-label="${title}, atalho da TV"><span class="more-symbol">${ico(icon,23)}</span><span class="quick-copy"><strong>${title}</strong><small>${desc}</small></span>${ico('chev',19)}</button>`;
 const watchlist=pref.saved.slice(-4).reverse();
 return `<div class="home-more" id="home-more"><section class="more-section more-discover" aria-labelledby="discover-more-heading"><header class="more-intro"><span class="eyebrow">EXPLORE O NOVA OS</span><h2 id="discover-more-heading">Descubra mais</h2><p>Vá direto ao que você quer assistir.</p></header><div class="more-grid">${moreDestinations.map(category).join('')}</div></section>${primeHome()}<section class="more-section" aria-label="Minha lista de títulos">${section('Minha lista','Filmes e séries que você guardou.','homeMore','Ver lista','arrow','saved')}${watchlist.length?`<div class="card-grid">${watchlist.map(card).join('')}</div>`:`<div class="home-watchlist glass"><span class="watchlist-art" aria-hidden="true"><i></i><i></i><i>${ico('bookmark',26)}</i></span><div class="watchlist-copy"><strong>Guarde algo para assistir depois</strong><p>Salve um filme ou uma série e encontre seus títulos aqui.</p></div><div class="actions">${btn('Explorar catálogo','homeMore','arrow','ghost glass','movies')}</div></div>`}</section><section class="more-section" aria-label="Atalhos da TV">${section('Atalhos da TV','Controles úteis sempre à mão.')}<div class="more-grid">${tvShortcuts.map(quick).join('')}</div></section></div>`;
}
const homeAppTiles=()=>[...tiles(),{id:'__more',label:'Todos os apps'}].map(appTile).join('');
function refreshHomeApps(){
 const grid=$('home-app-grid');if(!grid)return;
 const html=homeAppTiles();if(grid._tiles===html)return;grid._tiles=html;
 const anchor=grid.contains(document.activeElement)?describe(document.activeElement):'';
 forgetImages(grid);grid.innerHTML=html;watchImages(grid);
 if(anchor&&!dialog)focusMatching(grid,anchor);
 if(!useDpad){const first=grid.querySelector('.tile');if(first)first.classList.add('preset-focus');}
}
let paintedTiles='';
function home(){
 paintedTiles=homeAppTiles();
 const appsMarkup=`<section class="shelf" aria-label="Seus apps">${section('Seus apps','Seus favoritos, sempre à mão.','organize','Organizar','sliders')}<div class="app-grid" id="home-app-grid">${paintedTiles}</div></section>`;
 const display=bool('trending')&&catalogs.movies.items.length?catalogs.movies.items.slice(0,4):curated;
 const shelf=bool('films')?`<section class="shelf" aria-label="Descobrir">${section('Para sua próxima sessão','Filmes e séries em destaque' ,'page','Ver catálogo','arrow','movies')}<div class="card-grid">${display.map(card).join('')}</div></section>`:'';
 return `${bool('hero')?`<section class="hero" aria-label="Atalhos do início"><div class="actions">${btn(bool('films')?'Explorar':'Seus apps','page',bool('films')?'film':'grid','primary',bool('films')?'movies':'apps')}${btn('Minha lista','page','bookmark','ghost glass','saved')}</div><button class="ambient-card glass" data-do="page" data-arg="ambient"><span class="picture">${ico('mountain',22)}</span><span class="words"><small>MODO AMBIENTE</small><b data-wall-title>${escape(wallNow.title)}</b></span><span class="chev">${ico('chev',18)}</span></button></section>`:'<div class="section-label" style="margin-top:36px">Tela inicial</div>'}${appsMarkup}${shelf}${extraHome()}`;
}
const head=(mark,title,desc,actions='')=>`<div class="page-head"><div><span class="eyebrow">${mark}</span><h1>${title}</h1><p>${desc}</p></div>${actions?`<div class="actions">${actions}</div>`:''}</div>`;
const empty=(title,descr,actions='')=>`<div class="empty glass"><h2>${title}</h2><p>${descr}</p>${actions?`<div class="actions">${actions}</div>`:''}</div>`;
function setting(title,desc,icon,action,arg='',toggled=null){return `<button class="setting glass" data-do="${action}" data-arg="${attr(arg)}"${toggled!==null?` role="switch" aria-checked="${toggled}"`:''}><span class="setting-icon">${ico(icon,20)}</span><span class="setting-copy"><b>${escape(title)}</b><small>${escape(desc)}</small></span>${toggled!==null?`<span class="switch ${toggled?'on':''}" aria-hidden="true"></span>`:ico('chev',17)}</button>`;}
let settingsSection='appearance';
const groups={
 appearance:{title:'Aparência',icon:'layers',hint:'Vidro, fundo e movimento',copy:'Ajuste o visual do Nova OS e a fluidez da interface.',rows:()=>[
   setting('Efeito de vidro','Usa reflexos nas bordas e desfoque nos controles. Desligue para usar superfícies opacas.','layers','toggle','glass',bool('glass')),
   setting('Papel de parede','Exibe a paisagem na tela inicial.','mountain','toggle','wall',bool('wall')),
   setting('Trocar paisagem automaticamente','Atualiza a foto do Unsplash ao abrir e depois a cada 15 minutos.','reload','toggle','rotate',bool('rotate')),
   setting('Animações da interface','Suaviza a navegação, o seletor de abas e os interruptores.','bolt','toggle','motion',bool('motion'))]},
 home:{title:'Tela inicial',icon:'home',hint:'Atalhos e favoritos',copy:'Decida o que aparece quando você abre o launcher.',rows:()=>[
   setting('Atalhos do início','Mostra Explorar, Minha lista e Modo ambiente sobre a paisagem.','star','toggle','hero',bool('hero')),
   setting('Filmes e séries no início','Mostra a vitrine de recomendações na tela inicial.','film','toggle','films',bool('films')),
   setting('Seções extras no início','Mostra Descubra mais, Minha lista e Atalhos da TV ao rolar a tela.','layers','toggle','moreHome',bool('moreHome')),
   setting('Organizar favoritos','Fixe até sete aplicativos e altere a ordem.','sliders','organize'),
   setting('Modo ambiente','Abre a paisagem em tela cheia. Sem interação por 4 minutos, os controles também somem.','mountain','page','ambient')]},
 catalog:{title:'Catálogo',icon:'film',hint:'Vitrine e atualização',copy:'Controle quais recomendações aparecem e quando o catálogo é atualizado.',rows:()=>[
   setting('Filmes em alta no início','Usa o catálogo no lugar da seleção editorial quando a vitrine está ligada.','star','toggle','trending',bool('trending')),
   setting('Pré-carregar filmes','Atualiza o catálogo em segundo plano ao abrir o launcher.','bolt','toggle','auto',bool('auto'))]},
 system:{title:'Sistema',icon:'settings',hint:'Android e informações',copy:'Gerencie a integração do Nova OS com o seu aparelho.',rows:()=>[
   setting('Launcher padrão','Abre a configuração de tela inicial do Android.','home','system','home'),
   setting('Configurações do Android','Acesse rede, tela e outros ajustes do aparelho.','settings','system','all'),
   setting('Nova Store','Baixe, instale ou abra o catálogo de apps para TV.','store','novaStore'),
   setting('Atualizações','Consulte, baixe e instale novas versões do Nova OS.','reload','page','updates'),
   setting('Sobre o Nova OS','Versão, fontes de catálogo e informações de privacidade.','info','about')]}
};
function settingContents(){const g=groups[settingsSection];return `<div class="settings-title"><span class="settings-emblem">${ico(g.icon,24)}</span><div><h2 id="settings-section-title">${g.title}</h2><p>${g.copy}</p></div></div><div class="settings-rows">${g.rows().join('')}</div>${settingsSection==='appearance'?`<div class="settings-note">${ico('info',17)}<span>A opção de reduzir movimentos do aparelho também é respeitada.</span></div>`:''}`;}
function settings(){return head('PREFERÊNCIAS','Configurações','Personalize o Nova OS para o seu jeito de assistir.')+`<div class="settings-layout"><nav class="settings-nav glass" aria-label="Categorias das configurações"><span class="settings-nav-caption">Categorias</span>${Object.entries(groups).map(([k,g])=>`<button class="category${k===settingsSection?' current':''}" type="button" data-do="settingsGroup" data-arg="${k}" aria-controls="settings-content"${k===settingsSection?' aria-current="true"':''}><span class="category-icon">${ico(g.icon,20)}</span><span class="category-copy"><strong>${g.title}</strong><small>${g.hint}</small></span>${ico('chev',15)}</button>`).join('')}</nav><section class="settings-card glass" id="settings-content" aria-labelledby="settings-section-title">${settingContents()}</section></div>`;}
function changeSettingsSection(id){
 if(!groups[id]||id===settingsSection||!$('settings-content'))return;
 settingsSection=id;
 document.querySelectorAll('.settings-nav .category').forEach(el=>{const on=el.dataset.arg===id;el.classList.toggle('current',on);if(on)el.setAttribute('aria-current','true');else el.removeAttribute('aria-current');});
 const content=$('settings-content');content.innerHTML=settingContents();animateIn(content,5);
}
function updateSettingsToggle(key){
 const on=bool(key);
 const b=Array.from($('main').querySelectorAll('[data-do="toggle"]')).find(el=>el.dataset.arg===key);
 if(b){b.setAttribute('aria-checked',String(on));b.querySelector('.switch').classList.toggle('on',on);}
 applyAppearance();
}

function mergeMovieSources(first,second){
 const out=[];for(let i=0;i<Math.max(first.length,second.length);i++){if(i<first.length)out.push(first[i]);if(i<second.length)out.push(second[i]);}return out;
}
function displayedMovies(){
 const itunes=catalogs.movies.items;
 const other=itunes.length?itunes:curated.filter(x=>x.tag==='FILME');
 return movieFilter==='prime'?primeMovies:movieFilter==='itunes'?itunes:mergeMovieSources(primeMovies,other);
}
function moreMovies(){
 const data=displayedMovies(), grid=$('movie-posters'), row=$('movie-more-row');
 if(page!=='movies'||!grid||!row||movieLimit>=data.length)return;
 const start=movieLimit;movieLimit+=MOVIE_BATCH;
 grid.insertAdjacentHTML('beforeend',data.slice(start,movieLimit).map(t=>card(t,true)).join(''));
 watchImages(grid);
 $('movie-count').textContent=movieCount(data.length);
 if(movieLimit>=data.length)row.hidden=true;
 const first=grid.children[start];if(first)first.focus();
}
const movieCount=count=>`${Math.min(count,movieLimit)} de ${count} ${count===1?'filme':'filmes'}`;
function catalog(which){
 const isMovie=which==='movies', state=catalogs[which];
 const primeOnly=isMovie&&movieFilter==='prime';
 const local=curated.filter(x=>x.tag===(isMovie?'FILME':'SÉRIE'));
 const listing=state.items.length?state.items:local;
 const data=isMovie?displayedMovies():listing;
 const filters=isMovie?`<div class="movie-filter-row"><div class="movie-filters" role="group" aria-label="Filtrar origem">${[['all','Todos','grid'],['prime','Prime Video','play'],['itunes','iTunes Store','film']].map(([id,title,icon])=>`<button type="button" class="movie-filter glass" data-do="movieFilter" data-arg="${id}" aria-pressed="${movieFilter===id}">${ico(icon,17)}<span>${title}</span></button>`).join('')}</div><span id="movie-count" class="source-note">${movieCount(data.length)}</span></div>`:'';
 const notice=primeOnly?'':state.state==='loading'?'<p class="status" role="status">Atualizando o catálogo…</p>':state.state==='error'?`<p class="status offline" role="status">${isMovie?'Não foi possível atualizar a iTunes Store.':'Não foi possível atualizar. Mostrando os títulos disponíveis localmente.'}</p>`:state.state==='cache'?'<p class="status" role="status">Exibindo a última seleção salva no dispositivo.</p>':'';
 return head('DESCOBRIR',isMovie?'Filmes':'Séries',isMovie?'Explore títulos da iTunes Store e uma seleção para assistir no Prime Video.':'Explore as séries do TVmaze. Alguns dados estão em inglês.',primeOnly?'':btn('Atualizar','refresh','reload','ghost glass',which))+filters+notice+(data.length?`<div class="card-grid poster-grid" ${isMovie?'id="movie-posters"':''}>${(isMovie?data.slice(0,movieLimit):data).map(t=>card(t,true)).join('')}</div>${isMovie&&movieLimit<data.length?`<div class="movie-more-row" id="movie-more-row">${btn('Mostrar mais filmes','moreMovies','down')}</div>`:''}`:state.state==='loading'?'':empty('Catálogo indisponível',isMovie?'Você ainda pode escolher um título no filtro Prime Video.':'Tente atualizar o catálogo mais tarde.'));
}
function live(){const matches=apps.filter(a=>/globoplay|pluto|samsung tv|tv aberta|tv ao vivo|brasil tv|sbt|record|soul tv|zapping|tivimate|distro|sling|youtube/i.test(a.label));return head('CANAIS E TRANSMISSÕES','Ao vivo','Abra apps que oferecem canais ou transmissões. O Nova OS não fornece canais próprios.')+(matches.length?`<div class="app-grid">${matches.map(appTile).join('')}</div>`:empty('Nenhum app compatível encontrado','Os atalhos aparecerão aqui quando você instalar um app de TV ao vivo.',btn('Ver todos os apps','page','grid','primary','apps')));}
function allApps(){return head('BIBLIOTECA','Todos os apps',native?'Aplicativos instalados no seu aparelho.':'Nesta prévia, os atalhos abrem os sites dos serviços.',btn('Organizar','organize','sliders'))+(apps.length?`<div class="app-grid">${apps.map(appTile).join('')}</div>`:empty('Sem apps disponíveis','Aplicativos compatíveis aparecerão aqui depois da instalação.'));}
function saved(){return head('SUA BIBLIOTECA','Minha lista','Os títulos que você salvar ficam neste dispositivo.')+(pref.saved.length?`<div class="card-grid">${pref.saved.map(card).join('')}</div>`:empty('Sua lista está vazia','Abra os detalhes de um título para adicioná-lo à sua lista.',btn('Explorar catálogo','page','film','primary','movies')));}
function organizer(){return head('TELA INICIAL','Organizar apps','Escolha até sete favoritos. Selecione um app para fixar, remover ou mover.',btn('Concluir','page','check','primary',organizeFrom))+(apps.length?`<h2 class="section-label">Fixados · ${tiles().length}/7</h2><div class="mini-list">${tiles().map((a,i)=>setting(a.label,`${i+1}ª posição`,'star','manage',a.id)).join('')||'<p class="status">Nenhum favorito fixado.</p>'}</div><h2 class="section-label">Outros aplicativos</h2><div class="mini-list">${apps.filter(a=>!pins().includes(a.id)).map(a=>setting(a.label,'Não fixado','grid','manage',a.id)).join('')||'<p class="status">Nenhum outro aplicativo.</p>'}</div>`:empty('Sem apps para organizar','Quando você instalar um aplicativo, ele aparecerá aqui.'));}
function search(){return head('ENCONTRE MAIS RÁPIDO','Buscar','Pesquise apps e títulos disponíveis no catálogo.')+`<input class="search-box" id="query" type="search" enterkeyhint="search" aria-label="Buscar por nome" placeholder="Digite o nome de um app, filme ou série…" autocomplete="off" value="${attr(searchValue)}"><div id="results"></div>`;}
function uniqueTitles(items){const map=new Map();items.forEach(item=>map.set(item.id,item));const out=[];map.forEach(item=>out.push(item));return out;}
let titleSearch=null;
function titleIndex(){
 if(!titleSearch)titleSearch=uniqueTitles(curated.concat(primeMovies,catalogs.movies.items,catalogs.series.items,pref.saved)).map(item=>({item,name:slug(item.title)}));
 return titleSearch;
}
function searchResults(){const box=$('results');if(!box)return;const q=slug(searchValue.trim());if(box._query===q&&box._catalog===titleSearch&&box._apps===apps)return;forgetImages(box);box._query=q;box._apps=apps;if(!q){box.innerHTML='<p class="section-label">Digite para começar</p>';return;}ensureAppIndex();const a=appNames.filter(x=>x.name.includes(q)).map(x=>x.app),c=[];for(const x of titleIndex()){if(x.name.includes(q))c.push(x.item);if(c.length===15)break;}box._catalog=titleSearch;box.innerHTML=(!a.length&&!c.length)?'<p class="section-label">Nenhum resultado encontrado</p>':`${a.length?`<h2 class="section-label">Aplicativos</h2><div class="app-grid">${a.map(appTile).join('')}</div>`:''}${c.length?`<h2 class="section-label">Filmes e séries</h2><div class="card-grid">${c.map(card).join('')}</div>`:''}`;watchImages(box);}
function ambient(){return `<section class="amb-content"><div><span class="eyebrow">MODO AMBIENTE</span><h1 data-wall-title>${escape(wallNow.title)}</h1><p id="ambient-clock"></p><button class="wall-credit" data-do="wallCredit" ${wallNow.author?'':'hidden'}>${wallNow.author?escape(wallNow.author+' · Unsplash'):''}</button></div>${btn('Sair do modo ambiente','page','left','ghost glass','home')}</section>`;}
let prefsUpdate={repo:'',automatic:true,autoDownload:false,status:'idle',version:VERSION,available:'',message:'',progress:0},repoDraft=null, updateNotice='';
function updateStatusActions(){
 const u=prefsUpdate;
 if(['checking','downloading'].includes(u.status))return '';
 if(u.status==='available')return btn('Baixar atualização','updateDownload','down','primary')+btn('Verificar novamente','updateCheck','reload');
 if(['ready','permission','installing'].includes(u.status))return btn(u.status==='permission'?'Abrir permissão':'Instalar atualização','updateInstall','down','primary');
 return u.repo?btn('Verificar agora','updateCheck','reload','primary'):'';
}
function updates(){
 if(!native)return head('SISTEMA','Atualizações','Atualizador do Nova OS')+empty('Disponível no Android','Abra o APK para verificar, baixar e instalar atualizações.');
 return head('SISTEMA','Atualizações','Consulte novas versões publicadas e instale pelo Android.',btn('Voltar','page','left','ghost glass','settings'))+`<div class="update-grid"><section class="glass update-card"><span class="eyebrow">STATUS</span><h2 id="update-version">Versão instalada ${escape(prefsUpdate.version)}</h2><p id="update-message" role="status">${escape(prefsUpdate.message||'Pronto para consultar a fonte de atualização.')}</p><progress id="update-progress" max="100" value="${Number(prefsUpdate.progress)||0}" ${prefsUpdate.status==='downloading'?'':'hidden'}></progress><div class="actions" id="update-actions">${updateStatusActions()}</div><small>O Nova OS só aceita uma versão mais recente com a mesma assinatura do app instalado.</small></section><section class="glass update-card"><span class="eyebrow">FONTE DE ATUALIZAÇÃO</span><h2>GitHub Releases</h2><p>O canal oficial já vem configurado. Você pode trocar a fonte ou desligar a verificação automática.</p><label for="release-repo">Repositório</label><input class="search-box" id="release-repo" inputmode="url" type="text" maxlength="160" autocapitalize="off" spellcheck="false" placeholder="dono/nova-os" value="${attr(repoDraft===null?prefsUpdate.repo:repoDraft)}"><div class="actions">${btn('Salvar fonte','updateSave','check')}</div>${setting('Verificar automaticamente','Ao abrir o app, no máximo uma vez a cada 12 horas quando há um repositório.','reload','updateAuto','',!!prefsUpdate.automatic)}${setting('Baixar automaticamente','Baixa versões novas nesta fonte. O Android ainda pede confirmação para instalar.','down','updateAutoDownload','',!!prefsUpdate.autoDownload)}</section></div>`;
}
function updateState(json){
 let next;try{next=JSON.parse(json);}catch(_){return;}
 if(!next||typeof next.status!=='string')return;
 const changedStatus=next.status!==prefsUpdate.status||next.repo!==prefsUpdate.repo;
 if(next.repo!==prefsUpdate.repo)repoDraft=null;
 prefsUpdate=next;if(changedStatus)applyAppearance();
 const message=$('update-message');if(message){
  message.textContent=next.message||'Pronto para consultar a fonte de atualização.';
  $('update-version').textContent='Versão instalada '+next.version;
  const progress=$('update-progress');progress.value=Number(next.progress)||0;progress.hidden=next.status!=='downloading';
  const field=$('release-repo');if(field&&document.activeElement!==field&&repoDraft===null)field.value=next.repo||'';
  for(const [action,key] of [['updateAuto','automatic'],['updateAutoDownload','autoDownload']]){const el=$('main').querySelector('[data-do="'+action+'"]');if(el){const on=!!next[key];el.setAttribute('aria-checked',String(on));el.querySelector('.switch').classList.toggle('on',on);}}
  const actions=$('update-actions');if(changedStatus){const focusInside=actions.contains(document.activeElement);actions.innerHTML=updateStatusActions();if(focusInside&&!idleMode){const button=actions.querySelector('button')||field;if(button)button.focus();}}
 }
 if(next.status==='available'&&next.available&&updateNotice!==next.available){updateNotice=next.available;if(page!=='updates'&&!idleMode)toast('Nova versão '+next.available+' disponível em Sistema → Atualizações.');}
}
const pages={home,movies:()=>catalog('movies'),series:()=>catalog('series'),live,apps:allApps,saved,organize:organizer,settings,search,ambient,updates};
const describe=el=>el&&el.dataset&&el.dataset.do?`${el.dataset.do}\n${el.dataset.arg||''}`:'';
function focusMatching(scope,signature){if(!signature)return false;const at=signature.indexOf('\n'),action=signature.slice(0,at),arg=signature.slice(at+1),nodes=scope.querySelectorAll('button[data-do]');for(let i=0;i<nodes.length;i++){const hit=nodes[i];if(hit.dataset.do===action&&(hit.dataset.arg||'')===arg){hit.focus();return true;}}return false;}
function applyAppearance(){
 document.body.className=`${page} ${legacyLayout?'legacy-layout':''} ${legacyGlass?'legacy-glass':''} ${softwareRendering?'software-rendering':''} ${prefsUpdate.status==='available'||prefsUpdate.status==='ready'?'has-update':''} ${pref.glass?'':'solid'} ${pref.wall?'':'no-wall'} ${useDpad?'dpad':''} ${pref.motion?'':'motion-off'} ${idleMode?'idle-ambient':''}`;sampleGlass();
}
function animateIn(el,distance=8){
 if(!el||!pref.motion||(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches))return;
 if(el.animate)el.animate([{opacity:.35,transform:`translateX(${distance}px)`},{opacity:1,transform:'none'}],{duration:195,easing:'cubic-bezier(.21,.7,.25,1)'});
}
function render(reset=false,refocus=true){
 const main=$('main'), old=document.activeElement, wasMain=main.contains(old), anchor=describe(old), y=main.scrollTop;
 applyAppearance();
 syncHeader();forgetImages(main);main.innerHTML=page==='home'||page==='ambient'?`<div class="page-surface">${pages[page]()}</div>`:`<section class="panel page-surface">${pages[page]()}</section>`;
 if(page==='home'){const grid=$('home-app-grid');if(grid)grid._tiles=paintedTiles;}
 main.scrollTop=reset?0:y;watchImages(main);
 if(page==='updates'){const input=$('release-repo');if(input)input.addEventListener('input',()=>{repoDraft=input.value;});}
 if(page==='search'){const q=$('query');q.addEventListener('input',()=>{searchValue=q.value;searchResults();});searchResults();}
 clock();
 if(refocus&&wasMain&&!dialog&&document.activeElement===document.body) focusMatching(main,anchor);
 if(page==='home'&&!useDpad&&!document.querySelector('.preset-focus')){const first=main.querySelector('.tile');if(first)first.classList.add('preset-focus');}
}
function focusPage(){
 const main=$('main'); const t=page==='home'?main.querySelector('.tile'):page==='search'?$('query'):page==='ambient'?main.querySelector('button'):null;
 if(t&&page==='search'&&native)return; // Enter on the input opens the system keyboard.
 if(t&&(useDpad||page==='search'||page==='ambient'))try{t.focus({preventScroll:true});}catch(_){t.focus();}
}
function go(to,keepNavFocus=false){
 if(!pages[to])return;
 if(homeReturn&&to!==homeReturn.destination)homeReturn=null;
 const oldPage=page, oldIndex=tabs.findIndex(t=>t[0]===oldPage), newIndex=tabs.findIndex(t=>t[0]===to);
 if(dialog)closeDialog(false);
 if(to!==page&&to!=='search')searchValue='';
 if(to==='search'&&page!=='search')searchValue='';
 page=to;const request=(to==='series'||(to==='movies'&&movieFilter!=='prime'))?prepareCatalog(to,false):null;
 render(true,false);if(!keepNavFocus)focusPage();
 if(request)request();
 if(to==='search'){load('movies');load('series');}
 if(to==='updates'&&native)native.updaterState();
 if(to==='home'){if(bool('trending'))load('movies');maybeStoreUpdate();}
 if(to==='ambient'&&!wallActive&&!wallLoading)rotateWallpaper(false);
 if(oldPage!==to&&to!=='ambient')animateIn($('main').querySelector('.page-surface'),oldIndex>=0&&newIndex>=0&&newIndex<oldIndex?-8:8);
}
function readCache(which){try{const v=JSON.parse(localStorage.getItem('nova.catalog.'+which)||'null');if(v&&Array.isArray(v.items)&&v.items.length)return v;}catch(_){}return null;}
const ttl=6*60*60*1000;
for(const key of ['movies','series']){const v=readCache(key);if(v)catalogs[key]={items:v.items,state:'cache',ts:v.ts};}
const artOk=s=>typeof s==='string'&&/^https:\/\/(is\d+-ssl\.mzstatic\.com|static\.tvmaze\.com)\//i.test(s)?s:'';
const primeUrlOk=s=>typeof s==='string'&&/^https:\/\/www\.primevideo\.com\/-\/pt\/detail\/[A-Z0-9]{24,30}(?:\?language=pt_BR)?$/.test(s);
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
function prepareCatalog(which,force){
 const s=catalogs[which];if(!s||s.state==='loading'||(!force&&s.ts&&Date.now()-s.ts<ttl))return null;
 s.state='loading';
 return ()=>{
  if(native){try{native.catalog(which);}catch(_){catalogReply(which,false,'');}}
  else getText(`catalog/${which}.json`).then(s=>catalogReply(which,true,s)).catch(()=>catalogReply(which,false,''));
 };
}
function load(which,force=false){const request=prepareCatalog(which,force);if(request){if(page===which)render();request();}}
const coverUpdates=Object.create(null);let coverFrame=0;
function artReady(url,revision){
 coverUpdates['art?url='+encodeURIComponent(url)]=revision;
 if(coverFrame)return;
 coverFrame=requestAnimationFrame(()=>{
  coverFrame=0;
  each.call(document.querySelectorAll('img.art[src^="art?"],img.detail-art[src^="art?"]'),el=>{
   const src=el.getAttribute('src'),base=src.split('&rev=')[0],rev=coverUpdates[base];
   if(rev!==undefined&&src!==base+'&rev='+rev)el.setAttribute('src',base+'&rev='+rev);
  });
  for(const src of Object.keys(coverUpdates))delete coverUpdates[src];
 });
}
function catalogReply(which,good,body){
 const s=catalogs[which];if(!s)return;
 try{const items=good&&normalize(which,JSON.parse(body));if(!items||!items.length)throw Error('Catálogo vazio');s.items=items;titleSearch=null;s.ts=Date.now();s.state='ready';try{localStorage.setItem('nova.catalog.'+which,JSON.stringify({ts:s.ts,items}));}catch(_){} }catch(_){s.state='error';}
 if((page===which&&!(which==='movies'&&movieFilter==='prime'))||(page==='home'&&which==='movies'&&bool('trending')))render(false,!dialog);
 if(page==='search'&&(!document.activeElement||!$('results').contains(document.activeElement))) searchResults();
}
function toast(s){clearTimeout(toastTimer);const t=$('toast');t.textContent=s;t.hidden=false;toastTimer=setTimeout(()=>{t.hidden=true;},3100);}
function openDialog(title,body,tag){
 if(!dialog) previousFocus=describe(document.activeElement);
 dialog=tag||'generic'; $('dialog').innerHTML=`<div class="dialog-head"><div><span class="eyebrow">NOVA OS</span><h2 id="dialog-title">${escape(title)}</h2></div>${rnd('Fechar','close','x')}</div>${body}`;
 $('overlay').hidden=false;$('viewport').setAttribute('aria-hidden','true');
 const first=$('dialog').querySelector('.actions button')||$('dialog').querySelector('button');if(first)first.focus();
}
function closeDialog(restore=true){if(!dialog)return;dialog=null;$('overlay').hidden=true;$('viewport').removeAttribute('aria-hidden');if(restore){if(!focusMatching($('stage'),previousFocus))focusPage();maybeStoreUpdate();}}
let storeInfo={status:'available',message:'Baixe a Nova Store para explorar o catálogo de apps para TV.',progress:0};
function storeInvite(){
 if(dialog||page!=='home'||!native||!native.claimStoreInvitation||!native.claimStoreInvitation())return;
 openDialog('Quer baixar a Nova Store?',`<p>Conheça a loja de apps do Nova OS. Ela é instalada separadamente e reúne APKs para TV baixados da fonte oficial de cada desenvolvedor.</p><div class="actions">${btn('Agora não','close','x','ghost glass')}${btn('Baixar Nova Store','storeDownload','down','primary')}</div><p class="credit">Este convite aparece uma vez. Depois, a Nova Store fica disponível em Configurações → Sistema.</p>`,'novaStoreInvite');
}
function maybeStoreUpdate(){
 if(dialog||page!=='home'||idleMode||suspended()||!storeInfo.updateAvailable||storeInfo.status!=='available'||!native||!native.claimStoreUpdateNotice||!native.claimStoreUpdateNotice())return;
 openDialog('A Nova Store foi atualizada',`<p>A versão ${escape(storeInfo.targetVersion||'')} já está disponível. Baixe a atualização sem sair do Nova OS e confirme no Android quando terminar.</p><div class="actions">${btn('Agora não','close','x','ghost glass')}${btn('Baixar atualização','storeDownload','down','primary')}</div><p class="credit">Se preferir, atualize depois em Configurações → Sistema → Nova Store.</p>`,'novaStoreUpdate');
}
function storeControls(){
 if(!native||!native.storeAction)return btn('Fechar','close','check','ghost glass');
 if(storeInfo.status==='installed')return btn('Abrir Nova Store','storeOpen','external','primary');
 if(storeInfo.status==='ready'||storeInfo.status==='permission')return btn(storeInfo.status==='permission'?'Autorizar instalação':storeInfo.updateAvailable?'Instalar atualização':'Instalar Nova Store','storeInstall','check','primary');
 if(storeInfo.status==='downloading'||storeInfo.status==='installing')return btn('Fechar','close','x','ghost glass');
 return storeInfo.updateAvailable?btn('Baixar atualização','storeDownload','down','primary')+btn('Abrir Nova Store','storeOpen','external','ghost glass'):btn('Baixar Nova Store','storeDownload','down','primary');
}
function renderStore(){
 openDialog('Nova Store',`<p id="nova-store-status" role="status">${escape(native&&native.storeAction?storeInfo.message:'O download integrado está disponível no aplicativo Android do Nova OS.')}</p><progress aria-label="Progresso do download" id="nova-store-progress" max="100" value="${Number(storeInfo.progress)||0}" ${storeInfo.status==='downloading'?'':'hidden'}></progress><div class="actions">${storeControls()}</div><p class="credit">A Nova Store é um aplicativo separado. O Android pede confirmação para instalar.</p>`,'novaStore');
}
function storeState(raw){
 try{const previous=storeInfo.status,wasUpdate=!!storeInfo.updateAvailable;storeInfo=JSON.parse(raw);if(dialog!=='novaStore'){maybeStoreUpdate();return;}
  if(previous!==storeInfo.status||wasUpdate!==!!storeInfo.updateAvailable){renderStore();return;}
  const msg=$('nova-store-status'), bar=$('nova-store-progress');if(msg&&msg.textContent!==storeInfo.message)msg.textContent=storeInfo.message;if(bar)bar.value=Number(storeInfo.progress)||0;
 }catch(_){}
}
function startStoreDownload(){
 if(!native||!native.storeAction)return;
 storeInfo={...storeInfo,status:'downloading',message:storeInfo.updateAvailable?'Baixando a atualização da Nova Store…':'Baixando a Nova Store…',progress:0};renderStore();native.storeAction('download');
}
function titleById(id){return [...curated,...primeMovies,...catalogs.movies.items,...catalogs.series.items,...pref.saved].find(x=>x.id===id);}
function detail(id){const t=titleById(id);if(!t)return;const isSaved=pref.saved.some(x=>x.id===id);let src=t.art||t.image&&'art?url='+encodeURIComponent(t.image);
 openDialog(t.fullTitle||t.title,`${src?`<img class="detail-art${t.art?'':' poster'}" src="${attr(src)}" alt="">`:''}<div class="detail-meta">${escape([t.tag,t.meta].filter(Boolean).join(' · '))}</div><p>${escape(t.summary||'Sinopse não disponível.')}</p><div class="actions">${t.url?btn(isPrime(t)?'Assistir no Prime Video':t.source==='JustWatch'?'Onde assistir':'Abrir no '+t.source,'visit',isPrime(t)?'play':'external','primary',id):''}${btn(isSaved?'Remover da lista':'Salvar na minha lista','save',isSaved?'check':'bookmark','ghost glass',id)}</div><p class="credit">Fonte: ${escape(t.source||'Nova OS')}${t.art?' · Banner do título':''}. ${isPrime(t)?'A reprodução abre no Prime Video. A disponibilidade depende da sua região e assinatura.':'A reprodução, quando disponível, acontece fora do launcher.'}</p>`,id);}
function manage(id){const a=apps.find(x=>x.id===id);if(!a)return;const i=pins().indexOf(id);openDialog(a.label,`<p>${i>=0?`${i+1}º favorito na tela inicial.`:'Este app não está fixado na tela inicial.'}</p><div class="actions">${btn(i>=0?'Desafixar':'Fixar no início','pin',i>=0?'x':'star','primary',id)}${i>0?btn('Mover à esquerda','raise','left','ghost glass',id):''}${i>=0&&i<tiles().length-1?btn('Mover à direita','lower','arrow','ghost glass',id):''}</div>`,'manage');}
function updatePins(id,mode){const ids=tiles().map(a=>a.id), i=ids.indexOf(id);if(mode==='pin'){if(i>=0)ids.splice(i,1);else if(ids.length<7)ids.push(id);else{toast('Já há sete favoritos. Desafixe um aplicativo primeiro.');return;}}else{const j=i+(mode==='raise'?-1:1);if(i<0||j<0||j>=ids.length)return;[ids[i],ids[j]]=[ids[j],ids[i]];}pref.pins=ids;persist();const focus=describe(document.activeElement);render(false,false);manage(id);focusMatching($('dialog'),focus);toast('Favoritos atualizados.');}
function navigateExternal(url){if(!url)return;if(native){try{native.openExternal(url);}catch(_){toast('Não foi possível abrir o link.');}}else window.open(url,'_blank','noopener,noreferrer');}
function doAction(action,arg){switch(action){
 case 'page': if(arg!==page)go(arg,useDpad&&!!document.activeElement.closest('.top .nav'));break;
 case 'settings':case 'search':go(action);break;
 case 'homeMore':{
  const stage=$('home-more'), from=document.activeElement;
  const buttons=stage?Array.from(stage.querySelectorAll('[data-do="homeMore"]')):[];
  const index=buttons.indexOf(from);
  const dest=arg==='primeMovies'?'movies':arg;if(arg==='primeMovies'){movieFilter='prime';movieLimit=MOVIE_BATCH;}
  homeReturn={destination:dest,index,scroll:$('main').scrollTop};go(dest);break;
 }
 case 'close':closeDialog();break;
 case 'app':{const a=apps.find(v=>v.id===arg);if(!a)break;if(native)native.launch(a.id);else navigateExternal(a.url);break;}
 case 'organize':organizeFrom=page==='organize'?'home':page;go('organize');break;
 case 'manage':manage(arg);break;
 case 'pin':case 'raise':case 'lower':updatePins(arg,action);break;
 case 'detail':detail(arg);break;
 case 'visit':{const t=titleById(arg);if(t){const link=isPrime(t)?(primeUrlOk(t.url)?t.url:''):urlOk(t.url);if(link)navigateExternal(link);}break;}
 case 'save':{const t=titleById(arg);if(!t)break;const i=pref.saved.findIndex(x=>x.id===arg);if(i>=0)pref.saved.splice(i,1);else{if(pref.saved.length>=100){toast('Remova um título antes de salvar outro.');break;}pref.saved.push(t);}titleSearch=null;persist();if(page==='saved'||page==='home')render(false,false);if(titleById(arg)){detail(arg);focusMatching($('dialog'),'save\n'+arg);}else closeDialog();toast(i>=0?'Título removido.':'Título salvo na sua lista.');break;}
 case 'moreMovies':moreMovies();break;
 case 'movieFilter':{
  if(page!=='movies'||arg===movieFilter||!['all','prime','itunes'].includes(arg))break;
  movieFilter=arg;movieLimit=MOVIE_BATCH;const request=arg==='prime'?null:prepareCatalog('movies',false);render(true,false);focusMatching($('main'),'movieFilter\n'+arg);if(request)request();break;
 }
 case 'storeShortcut':if(native&&native.openStoreIfInstalled&&native.openStoreIfInstalled())break;
  // Otherwise show the same install controls available in System settings.
 case 'novaStore':renderStore();if(native&&native.storeStatus)native.storeStatus();break;
 case 'storeDownload':startStoreDownload();break;
 case 'storeInstall':if(native&&native.storeAction)native.storeAction('install');break;
 case 'storeOpen':if(native&&native.storeAction)native.storeAction('open');break;
 case 'settingsGroup':changeSettingsSection(arg);break;
 case 'updateSave': if(native){const v=$('release-repo');if(v)native.updaterConfigure(v.value,prefsUpdate.automatic);}break;
 case 'updateAuto': if(native)native.updaterConfigure(prefsUpdate.repo,!prefsUpdate.automatic);break;
 case 'updateAutoDownload': if(native)native.updaterAutoDownload(!prefsUpdate.autoDownload);break;
 case 'updateCheck': if(native)native.updaterCheck(true);break;
 case 'updateDownload': if(native)native.updaterDownload();break;
 case 'updateInstall': if(native)native.updaterInstall();break;
 case 'toggle': if(['glass','films','wall','hero','moreHome','auto','trending','motion','rotate'].includes(arg)){pref[arg]=!pref[arg];persist();updateSettingsToggle(arg);if(pref[arg]&&(arg==='auto'||arg==='trending'))load('movies');if(arg==='rotate'||arg==='wall')wallPreferenceChanged(arg);}break;
 case 'wallCredit': if(wallNow.page)navigateExternal(wallNow.page);break;
 case 'refresh':load(arg,true);break;
 case 'about':openDialog('Sobre o Nova OS',`<p>Versão ${VERSION} · Launcher para Android TV e TV boxes.</p><p>Os favoritos e os ajustes são gravados neste aparelho. O catálogo reúne uma seleção editorial do Prime Video, filmes da iTunes Store e séries do TVmaze e armazena a última seleção localmente. O Nova OS não acessa o seu histórico de reprodução nem faz login em serviços de streaming.</p><p class="credit">Dados de séries: TVmaze (CC BY-SA). Fonte Manrope (SIL OFL). Banners dos títulos: catálogo Apple TV.</p><div class="actions">${btn('Fechar','close','check','primary')}</div>`);break;
 case 'system': if(native)native.openSystem(arg);else toast('Esta opção fica disponível no aparelho Android.');break;
 }}
let held=null, suppressClick=false, suppressedArrow='';
function back(){
 if(idleMode){wakeIdle();return true;}
 if(dialog){closeDialog();return true;}
 if(homeReturn&&page===homeReturn.destination){const savedPlace=homeReturn;go('home');$('main').scrollTop=savedPlace.scroll;const el=$('home-more');const target=el&&el.querySelectorAll('[data-do="homeMore"]')[savedPlace.index];if(target)target.focus();return true;}
 if(page==='updates'){go('settings');return true;}
 if(page==='home')return false;if(page==='organize')go(organizeFrom);else go('home');return true;
}
function setDpad(){if(useDpad)return;useDpad=true;document.body.classList.add('dpad');const f=document.querySelector('.preset-focus');if(f)f.classList.remove('preset-focus');}
function spatial(k){
 const isOverlay=!!dialog;
 const root=isOverlay?$('dialog'):page==='ambient'?$('main'):$('stage');const active=document.activeElement;const elements=Array.from(root.querySelectorAll('button:not([disabled]):not([hidden]),input:not([disabled]):not([hidden])'));
 if(!elements.includes(active)){const first=page==='home'&&!isOverlay?elements.find(e=>e.classList.contains('tile')):null;const target=first||elements[0];if(target)target.focus();return;}
 const r=active.getBoundingClientRect(), x=(r.left+r.right)/2,y=(r.top+r.bottom)/2;let best=null, score=Infinity;
 for(const el of elements){if(el===active)continue;const t=el.getBoundingClientRect();if(!t.width&&!t.height)continue;const tx=(t.left+t.right)/2,ty=(t.top+t.bottom)/2, h=k==='ArrowLeft'||k==='ArrowRight';const major=h?(k==='ArrowLeft'?x-tx:tx-x):(k==='ArrowUp'?y-ty:ty-y);if(major<3)continue;const overlap=h?Math.min(t.bottom,r.bottom)-Math.max(t.top,r.top):Math.min(t.right,r.right)-Math.max(t.left,r.left);const off=h?Math.abs(ty-y):Math.abs(tx-x);const point=major+off*(overlap>1?.26:3)+(overlap>1?0:34);if(point<score){score=point;best=el;}}
 if(best)best.focus();
}
function key(k,down,repeat=false,fromRemote=false){
 if(fromRemote&&idleKey(k,down))return true;
 if(k==='Escape'||k==='BrowserBack'||k==='GoBack'){if(!down)back();return true;}
 const arrows=['ArrowUp','ArrowRight','ArrowDown','ArrowLeft'];const el=document.activeElement;
 if(arrows.includes(k)){if(el&&el.tagName==='INPUT'&&(k==='ArrowLeft'||k==='ArrowRight')){if(!fromRemote)return false;if(down){const left=k==='ArrowLeft',pos=left?el.selectionStart:el.selectionEnd;const next=Math.max(0,Math.min(el.value.length,pos+(left?-1:1)));try{el.setSelectionRange(next,next);}catch(_){}}return true;}if(down){setDpad();spatial(k);}return true;}
 if(k!=='Enter'||!el||el.tagName!=='BUTTON')return false;
 if(down){setDpad();if(!held&&!repeat){held={el,long:false,timer:0};if(el.dataset.do==='app'&&page==='home')held.timer=setTimeout(()=>{if(!held||held.el!==el)return;held.long=true;organizeFrom='home';go('organize');render();manage(el.dataset.arg);},570);}}
 else if(held){const work=held;clearTimeout(work.timer);held=null;if(!work.long&&document.activeElement===work.el)work.el.click();}return true;
}
function remoteArrow(k,repeat){
 if(idleMode){suppressedArrow=k;wakeIdle();return true;}
 if(repeat&&suppressedArrow===k)return true;
 if(!repeat)suppressedArrow='';
 return key(k,true,repeat,true);
}
// A TV remote changes the top-level section on focus, without stealing focus from the tab.
document.addEventListener('focusin',e=>{
 const tab=e.target.closest('.top .nav button[data-arg]');
 if(useDpad&&!dialog&&tab&&page!==tab.dataset.arg)go(tab.dataset.arg,true);
});
document.addEventListener('click',e=>{const b=e.target.closest('button[data-do]');if(b&&!suppressClick)doAction(b.dataset.do,b.dataset.arg||'');if(e.target===$('overlay'))closeDialog();});
document.addEventListener('keydown',e=>{
 if(e.key==='Tab'){setDpad();if(dialog){const bs=Array.from($('dialog').querySelectorAll('button'));if(bs.length&&((!e.shiftKey&&document.activeElement===bs[bs.length-1])||(e.shiftKey&&document.activeElement===bs[0]))){e.preventDefault();bs[e.shiftKey?bs.length-1:0].focus();}}return;}
 if(key(e.key===' '&&document.activeElement.tagName==='BUTTON'?'Enter':e.key,true,e.repeat))e.preventDefault();
});
document.addEventListener('keyup',e=>{if(key(e.key===' '&&document.activeElement.tagName==='BUTTON'?'Enter':e.key,false))e.preventDefault();});
let pointerTimer;document.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'||e.pointerType==='touch'){useDpad=false;document.body.classList.remove('dpad');const pre=document.querySelector('.preset-focus');if(pre)pre.classList.remove('preset-focus');}const el=e.target.closest('.tile[data-do="app"]');if(el&&page==='home'){pointerTimer=setTimeout(()=>{suppressClick=true;organizeFrom='home';go('organize');manage(el.dataset.arg);setTimeout(()=>{suppressClick=false;},500);},650);}});for(const k of ['pointerup','pointercancel','pointermove'])document.addEventListener(k,()=>clearTimeout(pointerTimer));document.addEventListener('contextmenu',e=>{if(e.target.closest('.tile'))e.preventDefault();});
// Only fetch one photo at a time; leave the current or bundled photo on-screen if loading fails.
const WALL_INTERVAL=15*60*1000;
const DEFAULT_WALL={id:'',title:'Dolomitas, Itália',author:'',page:''};
let wallNow=DEFAULT_WALL, wallActive=false, wallLoading=false, wallTimer, wallList=null, wallSlot=-1, wallSettleTimer=0, nativePaused=false,lastWallChange=0;
const suspended=()=>native?nativePaused:document.hidden;
const wallLayers=Array.from(document.querySelectorAll('.wall-photo'));
const storedWall=()=>{try{return localStorage.getItem('nova.wallpaper.last')||'';}catch(_){return '';}};
function displayWall(next){
 wallSlot=(wallSlot+1)%wallLayers.length;
 const scene=document.querySelector('.scenery');clearTimeout(wallSettleTimer);scene.classList.remove('wall-settled');
 const layer=wallLayers[wallSlot];layer.style.backgroundImage=`url("wallpapers/${next.id}.webp?v=2")`;
 layer.classList.add('visible');wallLayers.forEach((other,i)=>{if(i!==wallSlot)other.classList.remove('visible');});
 wallSettleTimer=setTimeout(()=>{scene.classList.add('wall-settled');wallLayers.forEach((other,i)=>{if(i!==wallSlot)other.style.backgroundImage='';});},700);
 glassWallpaper(next.id);
 wallNow=next;wallActive=true;lastWallChange=Date.now();document.querySelector('.scenery').dataset.wallpaper=next.id;
 document.querySelectorAll('[data-wall-title]').forEach(el=>{el.textContent=next.title;});
 document.querySelectorAll('.wall-credit').forEach(el=>{el.hidden=false;el.textContent=next.author+' · Unsplash';});
 try{localStorage.setItem('nova.wallpaper.last',next.id);}catch(_){}
}
function loadWallImage(id){return new Promise((resolve,reject)=>{
 const img=new Image();img.onload=()=>resolve();img.onerror=reject;img.src=`wallpapers/${id}.webp?v=2`;
});}
function scheduleWallpaper(){clearTimeout(wallTimer);if(bool('rotate')&&(bool('wall')||page==='ambient')&&!suspended()){wallTimer=setTimeout(()=>rotateWallpaper(true),WALL_INTERVAL);}}
function rotateWallpaper(advance){
 if(wallLoading||suspended()||(!bool('wall')&&page!=='ambient'))return;
 wallLoading=true;
 const listPromise=wallList?Promise.resolve(wallList):getText('wallpapers/list.json').then(text=>{
  wallList=JSON.parse(text).filter(x=>x&&/^[a-z0-9-]{1,32}$/.test(x.id)&&typeof x.title==='string'&&typeof x.author==='string'&&/^https:\/\/unsplash\.com\/photos\//.test(x.page));
  return wallList;
 });
 const done=()=>{wallLoading=false;scheduleWallpaper();};
 listPromise.then(list=>{
  if(!list.length)return;
  const last=wallNow.id||storedWall();const found=list.findIndex(x=>x.id===last);
  const idx=found<0?0:advance?(found+1)%list.length:found;const next=list[idx];
  if(next.id===wallNow.id)return;
  return loadWallImage(next.id).then(()=>next,err=>{
   if(wallActive||found<0||idx===found)throw err;
   return loadWallImage(list[found].id).then(()=>list[found]);
  }).then(candidate=>{if(bool('wall')||page==='ambient')displayWall(candidate);});
 }).then(done,done);
}
function wallPreferenceChanged(key){
 clearTimeout(wallTimer);
 if(!bool('wall')&&page!=='ambient')return;
 if(!wallActive||(key==='rotate'&&bool('rotate')))rotateWallpaper(bool('rotate'));
 else scheduleWallpaper();
}
let wasHidden=false;
document.addEventListener('visibilitychange',()=>{
 if(native)return;
 if(document.hidden){wasHidden=true;clearTimeout(wallTimer);}
 else if(wasHidden){wasHidden=false;if(bool('rotate'))rotateWallpaper(true);else if(!wallActive)rotateWallpaper(false);}
});
// If nobody interacts for four minutes, leave only the wallpaper visible.
const IDLE_DELAY=4*60*1000;
let idleMode=false,idleAt=Date.now(),idleTimer=0,idleFocus=null,wakeKey='',wakeClickUntil=0;
function queueIdle(){
 clearTimeout(idleTimer);idleTimer=0;
 if(idleMode||suspended())return;
 const remaining=IDLE_DELAY-(Date.now()-idleAt);
 if(remaining<=0){showIdle();return;}
 idleTimer=setTimeout(queueIdle,remaining);
}
function trackActivity(){if(idleMode)return;idleAt=Date.now();if(!idleTimer)queueIdle();}
function showIdle(){
 if(idleMode)return;
 idleMode=true;idleFocus=document.activeElement;
 if(held){clearTimeout(held.timer);held=null;}
 applyAppearance();
 $('viewport').inert=true;$('overlay').inert=true;
}
function wakeIdle(){
 if(!idleMode)return;
 idleMode=false;idleAt=Date.now();applyAppearance();
 $('viewport').inert=false;$('overlay').inert=false;
 if(idleFocus&&document.documentElement.contains(idleFocus)&&idleFocus!==document.body){
  try{idleFocus.focus({preventScroll:true});}catch(_){idleFocus.focus();}
 }
 idleFocus=null;clock();net();queueIdle();
}
function idleKey(k,down){
 if(wakeKey&&wakeKey===k){if(!down)wakeKey='';return true;}
 if(!down)return false;
 if(idleMode){wakeKey=k;wakeIdle();return true;}
 trackActivity();return false;
}
function stopInput(e){e.preventDefault();e.stopImmediatePropagation();}
for(const type of ['keydown','keyup'])document.addEventListener(type,e=>{if(idleKey(e.key,type==='keydown'))stopInput(e);},true);
document.addEventListener(window.PointerEvent?'pointerdown':'touchstart',e=>{if(idleMode){wakeClickUntil=performance.now()+1000;wakeIdle();stopInput(e);}else{wakeClickUntil=0;trackActivity();}},{capture:true,passive:false});
document.addEventListener('click',e=>{if(idleMode||wakeClickUntil){if(idleMode||performance.now()<=wakeClickUntil){wakeClickUntil=0;wakeIdle();stopInput(e);}else wakeClickUntil=0;}},true);
for(const type of ['pointermove','wheel'])document.addEventListener(type,trackActivity,{passive:true});
document.addEventListener('visibilitychange',queueIdle);
window.addEventListener('blur',()=>{wakeKey='';});
function resize(){
 const frame=$('tv-screen');
 if(legacyLayout){
  const w=Math.min(window.innerWidth,window.innerHeight*16/9), h=w*9/16;
  frame.style.width=w+'px';frame.style.height=h+'px';
 }
 const bounds=frame.getBoundingClientRect();
 const scale=Math.min(bounds.width/1600,bounds.height/900);
 document.documentElement.style.setProperty('--s',scale);
 if(legacyLayout){
  $('stage').style.transform='translate(-50%,-50%) scale('+scale+')';
  $('dialog').style.transform='scale('+scale+')';
  $('toast').style.transform='translateX(-50%) scale('+scale+')';
 }
 sampleGlass();
}
window.NovaUi={
 updateApps(raw){try{if(raw===lastAppPayload)return;const rows=JSON.parse(raw);if(!Array.isArray(rows))return;lastAppPayload=raw;apps=rows.filter(a=>a&&a.id&&a.label).map(a=>({...a,brand:brandByPackage[a.pkg]}));const rank=x=>x.brand?brandOrder[x.brand]:999;apps.sort((a,b)=>rank(a)-rank(b)||a.label.localeCompare(b.label,'pt-BR'));if(['home','apps','organize','live'].includes(page)){if(page==='home')refreshHomeApps();else render(false,!dialog);if(document.activeElement===document.body&&useDpad&&!dialog)focusPage();}if(page==='search')searchResults();}catch(_){}},
 catalogReply, artReady, updateState, storeState, storeInvite, toast, back, key, remoteArrow, net,
 suspend(){nativePaused=true;clearTimeout(wallTimer);clearTimeout(idleTimer);idleTimer=0;},
 reopen(){nativePaused=false;clock();net();queueIdle();if((bool('rotate')||!wallActive)&&Date.now()-lastWallChange>1000)rotateWallpaper(bool('rotate'));else scheduleWallpaper();},
 home(){if(idleMode){wakeIdle();return;}go('home');}
};
window.addEventListener('resize',resize);window.addEventListener('online',net);window.addEventListener('offline',net);window.addEventListener('blur',()=>{if(held){clearTimeout(held.timer);held=null;}});
glassWallpaper('');if(legacyGlass){$('main').addEventListener('scroll',sampleGlass);$('top').addEventListener('transitionend',sampleGlass);}
resize();render(true,false);net();focusPage();queueIdle();rotateWallpaper(bool('rotate'));setInterval(()=>{if(!suspended()&&!idleMode){clock();net();}},30000);
if(native){native.ready();setInterval(()=>{if(!nativePaused)native.updaterCheck(false);},12*60*60*1000);}if(pref.auto||pref.trending) setTimeout(()=>load('movies'),550);
})();
