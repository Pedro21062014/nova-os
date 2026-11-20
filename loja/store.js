(function(){
'use strict';
var drawing={download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v4h16v-4"/>',shield:'<path d="M12 2 3 6v6c0 5 4 8 9 10 5-2 9-5 9-10V6Z"/><path d="m8 12 3 3 5-6"/>',bag:'<path d="M5 8h14l1 12H4L5 8Z"/><path d="M8.5 9V7a3.5 3.5 0 0 1 7 0v2"/><path d="m11 11 4 2.5-4 2.5V11Z" fill="currentColor" stroke="none"/>',home:'<path d="m3 10 9-7 9 7v10h-6v-6H9v6H3Z"/>',grid:'<rect x="3" y="3" width="7" height="7" rx="1.4"/><rect x="14" y="3" width="7" height="7" rx="1.4"/><rect x="3" y="14" width="7" height="7" rx="1.4"/><rect x="14" y="14" width="7" height="7" rx="1.4"/>',library:'<path d="M6 3h12v18l-6-4-6 4Z"/>',tv:'<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8m-4-4v4"/>',search:'<circle cx="10.5" cy="10.5" r="5.5"/><path d="m15 15 5 5"/>',arrow:'<path d="M4 12h15m-6-6 6 6-6 6"/>',chev:'<path d="m9 6 6 6-6 6"/>',video:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="m10 8 6 4-6 4V8Z"/>',music:'<path d="M8 17V6l12-2v11M8 10l12-2"/><ellipse cx="5" cy="17" rx="3" ry="2"/><ellipse cx="17" cy="15" rx="3" ry="2"/>',tool:'<path d="M4 7h10m4 0h2M4 17h4m4 0h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',game:'<path d="M7 6h10c2 0 3 2 4 5l1 4c.6 3-2 5-4 3l-3-3H9l-3 3c-2 2-4.6 0-4-3l1-4c1-3 2-5 4-5Z"/><path d="M6 10h5m-2.5-2v5m7.5-3h.01m3 2h.01"/>',x:'<path d="m6 6 12 12M18 6 6 18"/>',check:'<path d="m5 12 4 4L19 6"/>',info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/>',external:'<path d="M13 4h7v7m0-7-9 9m8 0v6H5V5h6"/>',folder:'<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>',image:'<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="m4 18 5-5 3 3 3-3 5 5"/>',globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14 0 18M12 3c-3 3.5-3 14 0 18"/>',palette:'<path d="M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 1-3.7 2 2 0 0 1 1-3.8h2A4 4 0 0 0 21 10c0-4-4-7-9-7Z"/><circle cx="7.5" cy="10" r=".9" fill="currentColor" stroke="none"/><circle cx="10" cy="6.8" r=".9" fill="currentColor" stroke="none"/><circle cx="14" cy="6.8" r=".9" fill="currentColor" stroke="none"/>',spark:'<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.5l6.1-.9Z"/>'};
function icon(id,size){size=size||20;return '<svg viewBox="0 0 24 24" width="'+size+'" height="'+size+'" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+drawing[id]+'</svg>';}
var artwork=/*MEDIA*/{};
var categories=[['video','Vídeo e mídia','video'],['live','TV e listas','tv'],['music','Música','music'],['files','Arquivos','folder'],['photo','Fotos e ambiente','image'],['net','Navegadores','globe'],['game','Jogos','game'],['personal','Personalização','palette'],['tool','Utilitários','tool']];
var packages=/*CATALOG*/[];
var byApp=Object.create(null);packages.forEach(function(p){(byApp[p.app]||(byApp[p.app]=[])).push(p);});
var apps=[
 {id:'vlc',name:'VLC for Android',cat:'video',price:'Grátis',tone:'#694536',desc:'Reproduza arquivos de vídeo e áudio e acesse mídias da sua rede em um único player.',url:'https://www.videolan.org/vlc/download-android.html'},
 {id:'aerial',name:'Aerial Views',cat:'photo',price:'Grátis',tone:'#3d416b',desc:'Protetor de tela para Android TV com vídeos de paisagens. Configure nas opções de proteção de tela do aparelho.',url:'https://github.com/theothernt/AerialViews'},
 {id:'tvbro',name:'TV Bro',cat:'net',price:'Grátis',tone:'#263d62',desc:'Navegador para usar com o controle remoto. A edição leve usa o WebView do aparelho.',url:'https://github.com/truefedex/tv-bro'},
 {id:'just',name:'Just (Video) Player',cat:'video',price:'Grátis',tone:'#244a4b',desc:'Player de vídeo leve, com seleção de legendas e trilhas e ajuste de taxa de quadros em aparelhos compatíveis.',url:'https://github.com/moneytoo/Player'},
 {id:'nova',name:'Nova Video Player',cat:'video',price:'Grátis',tone:'#4c316d',desc:'Reproduza vídeos de armazenamento externo, servidor ou rede local em uma interface para TV. Projeto independente do Nova OS.',url:'https://github.com/nova-video-player/aos-AVP'},
 {id:'kodi',name:'Kodi',cat:'video',price:'Grátis',tone:'#204b63',desc:'Central de mídia de código aberto para organizar e reproduzir seus vídeos, fotos e músicas.',url:'https://kodi.tv/'},
 {id:'jellyfin',name:'Jellyfin',cat:'video',price:'Grátis',tone:'#392b62',desc:'Conecte a TV ao seu servidor Jellyfin para assistir à sua biblioteca pessoal.',url:'https://jellyfin.org/'},
 {id:'retro',name:'RetroArch',cat:'game',price:'Grátis',tone:'#432c67',desc:'Interface de emulação para jogar títulos compatíveis da sua própria coleção. Não inclui jogos.',url:'https://www.retroarch.com/'},
 {id:'moonlight',name:'Moonlight',cat:'game',price:'Grátis',tone:'#3c4c74',desc:'Transmita os jogos do seu computador para a TV. Requer um servidor de streaming compatível, como Sunshine. Esta é a edição sem root.',url:'https://moonlight-stream.org/'},
 {id:'wholphin',name:'Wholphin',cat:'video',price:'Grátis',tone:'#294762',desc:'Cliente alternativo para navegar pelo seu servidor Jellyfin na TV.',url:'https://github.com/damontecres/Wholphin'},
 {id:'arc',name:'Arc Launcher',cat:'personal',price:'Grátis',tone:'#534382',desc:'Tela inicial alternativa para Android TV com categorias, grade de apps e papéis de parede personalizáveis.',url:'https://github.com/meddouribadis/arclauncher'},
 {id:'lounge',name:'Lounge',cat:'personal',price:'Grátis',tone:'#604154',desc:'Launcher alternativo com temas, fileiras de apps e uma tela inicial voltada ao que você assiste.',url:'https://github.com/Gingerbreadfork/lounge'}
];
var additions=/*EXPANSION*/[];apps=apps.concat(additions);
var latestWave=additions.reduce(function(w,a){return Math.max(w,a.wave||0);},0);
categories=categories.filter(function(c){return apps.some(function(a){return a.cat===c[0];});});
var content=document.getElementById('content'),main=document.getElementById('main'),menu=document.getElementById('menu'),modal=document.getElementById('modal'),dialog=document.getElementById('dialog');
var page='home',selected='',query='',detailId='',catalogPlace=null,saved=[],shotIndex=0,heroIndex=0,guideOpen=false,returnFocus=null;
var PAGE_SIZE=15,catalogLimit=PAGE_SIZE,catalogQuery='',catalogSort='featured',catalogAbi='';
var railCount=0;
try{var initial=JSON.parse(localStorage.getItem('nova.store.wishlist')||'[]');if(Array.isArray(initial))saved=initial.filter(function(id){return appById(id);});}catch(e){}
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function normalize(s){s=String(s).toLowerCase();return (s.normalize?s.normalize('NFD'):s).replace(/[\u0300-\u036f]/g,'');}
function appById(id){return apps.filter(function(a){return a.id===id;})[0];}
function catRow(id){return categories.filter(function(c){return c[0]===id;})[0];}
function category(id){var row=catRow(id);return row?row[1]:'Apps';}
function onList(id){return saved.indexOf(id)!==-1;}
function host(url){try{return String(url).split('//')[1].split('/')[0];}catch(e){return url;}}
function size(bytes){return (bytes/1048576).toFixed(1).replace('.',',')+' MB';}
var abiLabel={universal:'APK universal','arm64-v8a':'ARM 64 bits','armeabi-v7a':'ARM 32 bits',x86:'x86 32 bits',x86_64:'x86 64 bits'};
var androidName={16:'4.1',17:'4.2',19:'4.4',21:'5.0',22:'5.1',23:'6.0',24:'7.0',25:'7.1',26:'8.0',27:'8.1',28:'9',29:'10',30:'11',31:'12',32:'12L',33:'13',34:'14',35:'15',36:'16'};
function platform(p){if(p.abi!=='universal')return p.abis.length>1?p.abis.map(function(a){return abiLabel[a]||a;}).join(' / '):abiLabel[p.abi]||p.abi;if(p.abis.length&&p.abis.length<4)return (p.abis.length===2&&p.abis.indexOf('arm64-v8a')>=0&&p.abis.indexOf('armeabi-v7a')>=0)?'ARM 32/64 bits':p.abis.map(function(a){return abiLabel[a]||a;}).join(' / ');return 'APK universal';}
function updateSaved(){var el=document.getElementById('saved-count');el.hidden=!saved.length;el.textContent=saved.length;}
function updateFoot(){var el=document.getElementById('foot-stats');if(el)el.innerHTML='NOVA STORE <b>·</b> '+apps.length+' APPS <b>·</b> '+packages.length+' APKS';}
var toastTimer=null;
function toast(msg){var el=document.getElementById('store-toast');if(!el){el=document.createElement('div');el.id='store-toast';el.className='toast';el.setAttribute('role','status');document.body.appendChild(el);}el.innerHTML=icon('check',14)+'<span>'+esc(msg)+'</span>';clearTimeout(toastTimer);toastTimer=setTimeout(function(){if(el.parentNode)el.parentNode.removeChild(el);},2400);}

/* ---------- imagens ---------- */
function imgLogo(id,cls){return '<img alt="" loading="lazy" decoding="async" '+(cls?'class="'+cls+'" ':'')+'data-art="'+id+':logo">';}
function imgShot(id,i,cls){return '<img alt="" loading="lazy" decoding="async" '+(cls?'class="'+cls+'" ':'')+'data-art="'+id+':'+i+'">';}
function hydrate(root){
 if(!root)return;
 [].forEach.call(root.querySelectorAll('img[data-art]'),function(img){
  var parts=img.getAttribute('data-art').split(':'),media=artwork[parts[0]];if(!media)return;
  if(parts[1]==='logo'){img.src=media.logo;img.alt='';}
  else{var app=appById(parts[0]),i=Number(parts[1]);img.src=media.shots[i];img.alt=img.className.indexOf('detail-bg')>=0?'':'Captura '+(i+1)+' de '+(app?app.name:'app');}
  img.removeAttribute('data-art');
 });
}

/* ---------- cards ---------- */
function card(a,kind){
 if(!a)return '';
 var files=byApp[a.id]||[],first=files[0],version=first?first.version.replace(/^v(?=\d)/i,''):'';
 if(kind==='wide'){
  return '<button type="button" class="app-card app-card--wide" data-app="'+a.id+'" aria-label="'+esc(a.name)+'">'
  +'<span class="wide-shot">'+imgShot(a.id,0)+'<span class="wide-top"><span class="detach-chip">'+icon('shield',10)+'APK oficial</span></span><span class="wide-logo">'+imgLogo(a.id)+'</span></span>'
  +'<span class="wide-body"><strong>'+esc(a.name)+'</strong><small>'+category(a.cat)+'</small>'
  +'<span class="wide-foot"><span class="mini-tag">'+icon('shield',11)+'APK oficial</span><i>'+esc(a.price||'Grátis')+'</i></span></span></button>';
 }
 var extra=files.length>1?files.length+' versões':(first?size(first.bytes):'');
 return '<button type="button" class="app-card" data-app="'+a.id+'" aria-label="'+esc(a.name)+'">'
 +'<span class="app-art" style="--tone:'+a.tone+'">'+imgLogo(a.id)+'</span>'
 +'<strong class="app-name">'+esc(a.name)+'</strong><small class="app-cat">'+category(a.cat)+'</small>'
 +'<span class="card-foot"><span class="mini-tag">'+icon('shield',10)+'APK</span><i>'+esc(version)+'</i><span class="card-ver">'+esc(extra)+'</span>'+(onList(a.id)?'<span class="bookmark">'+icon('library',12)+'</span>':'')+'</span></button>';
}
function grid(list){return '<div class="app-grid">'+list.map(function(a){return card(a);}).join('')+'</div>';}
function rail(list,kind){
 railCount++;
 return '<div class="rail"><div class="rail-track" id="rail-'+railCount+'">'+list.map(function(a){return card(a,kind);}).join('')+'</div>'
 +'<button type="button" class="rail-btn rail-prev" data-rail="-1" aria-label="Rolar a fileira para trás">'+icon('chev',18)+'</button>'
 +'<button type="button" class="rail-btn rail-next" data-rail="1" aria-label="Rolar a fileira para frente">'+icon('chev',18)+'</button></div>';
}
function updateRail(rail){
 var track=rail.querySelector('.rail-track');if(!track)return;
 var max=track.scrollWidth-track.clientWidth,over=max>6;
 rail.classList.toggle('no-rail',!over);
 var prev=rail.querySelector('[data-rail="-1"]'),next=rail.querySelector('[data-rail="1"]');
 if(prev)prev.disabled=!over||track.scrollLeft<6;
 if(next)next.disabled=!over||track.scrollLeft>max-6;
}
function updateRails(){[].forEach.call(content.querySelectorAll('.rail'),updateRail);}
function setupRails(){updateRails();}

/* ---------- navegação e cabeçalho ---------- */
function top(title){
 return '<div class="top"><div class="crumb">Nova Store'+icon('chev',12)+'<strong>'+esc(title)+'</strong></div><div class="top-right"><span class="top-stats"><b>'+apps.length+' apps</b> · '+packages.length+' APKs</span><span class="top-badge">'+icon('shield',13)+'FONTES OFICIAIS</span><button type="button" class="search-open" data-page="search">'+icon('search',17)+'<span>Buscar apps</span><kbd>/</kbd></button></div></div>';
}
function intro(k,title,desc){return '<header class="intro"><span class="kicker">'+k+'</span><h1>'+title+'</h1><p>'+desc+'</p></header>';}
function pageHead(k,title,desc,stats){
 return '<div class="intro-row"><div class="intro"><span class="kicker">'+k+'</span><h1>'+title+'</h1><p>'+desc+'</p></div><div class="head-stats">'+stats+'</div></div>';
}
function statPill(iconId,html){return '<span class="stat-pill">'+icon(iconId,14)+html+'</span>';}
function shelf(title,sub,body,action,kind,eyebrow){
 return '<section class="shelf'+(kind?' '+kind:'')+'"><div class="shelf-head"><div><span class="eyebrow">'+(eyebrow||'SELEÇÃO')+'</span><h2>'+title+'</h2><p>'+sub+'</p></div>'+(action||'')+'</div>'+body+'</section>';
}
function empty(title,sub,extra){
 return '<div class="empty"><span class="empty-ico">'+icon('search',22)+'</span><h2>'+title+'</h2><p>'+sub+'</p>'+(extra||'')+'</div>';
}
var showAll='<button type="button" class="text-button" data-page="downloads">Ver catálogo completo '+icon('arrow',15)+'</button>';

/* ---------- destaques ---------- */
var featured=[
 {id:'stremio',label:'EM DESTAQUE',line:'Sua central de mídia: escolha o que assistir e abra na TV em um só lugar.',meta:['Grátis','Vídeo e mídia','APK oficial'],shot:1},
 {id:'tivimate',label:'TV NA TELA GRANDE',line:'Sua lista de TV organizada em uma grade prática de navegar com o controle.',meta:['Grátis · Premium opcional','TV e listas','Requer lista própria'],shot:0},
 {id:'synphotos',label:'PARA SUAS FOTOS',line:'Seus álbuns do NAS na tela grande, com apresentação e favoritos.',meta:['Grátis','Fotos e ambiente','Requer um NAS Synology'],shot:0}
];
function heroSlide(item,index){
 var a=appById(item.id);if(!a)return '';
 var media=artwork[a.id]||{shots:[]},shot=Math.min(item.shot||0,Math.max(media.shots.length-1,0));
 return '<article class="hero-slide"'+(index?' hidden':'')+'><div class="hero-copy"><span class="hero-label"><i></i>'+item.label+'</span><h2>'+esc(a.name)+'</h2><p>'+item.line+'</p>'
 +'<div class="hero-meta">'+item.meta.map(function(t){return esc(t);}).join('<span class="dot">·</span>')+'</div>'
 +'<div class="hero-actions"><button type="button" class="primary hero-cta" data-app="'+a.id+'">'+icon('download',16)+' Baixar APK</button><button type="button" class="secondary" data-cat="'+a.cat+'">Ver em '+esc(category(a.cat))+'</button></div></div>'
 +'<div class="hero-visual"><div class="hero-frame">'+imgShot(a.id,shot)+'</div><span class="hero-chip"><span class="chip-logo">'+imgLogo(a.id)+'</span><span><strong>'+esc(a.name)+'</strong><small>'+esc(category(a.cat))+' · APK oficial</small></span></span></div></article>';
}
function hero(){
 return '<section class="hero" id="hero" aria-label="Aplicativos em destaque" style="--tone:'+(appById(featured[heroIndex].id)||{}).tone+'">'
 +featured.map(heroSlide).join('')
 +'<div class="hero-dots" role="group" aria-label="Escolher destaque">'+featured.map(function(f,i){var a=appById(f.id);return '<button type="button" class="hero-dot" data-hero="'+i+'" aria-label="Ver destaque '+(i+1)+' de '+featured.length+(a?': '+esc(a.name):'')+'" aria-pressed="'+(i===heroIndex)+'"></button>';}).join('')+'</div></section>';
}
function setHero(index){
 var total=featured.length;heroIndex=((index%total)+total)%total;
 var heroEl=document.getElementById('hero');if(!heroEl)return;
 var active=appById(featured[heroIndex].id);if(active)heroEl.style.setProperty('--tone',active.tone);
 [].forEach.call(heroEl.querySelectorAll('.hero-slide'),function(slide,i){if(i===heroIndex)slide.removeAttribute('hidden');else slide.setAttribute('hidden','');});
 [].forEach.call(heroEl.querySelectorAll('.hero-cta'),function(b){b.removeAttribute('id');});
 var current=heroEl.querySelectorAll('.hero-slide')[heroIndex];
 if(current){var cta=current.querySelector('.hero-cta');if(cta)cta.id='hero-action';}
 [].forEach.call(heroEl.querySelectorAll('[data-hero]'),function(dot){dot.setAttribute('aria-pressed',Number(dot.getAttribute('data-hero'))===heroIndex?'true':'false');});
}

/* ---------- categorias ---------- */
function chip(c,filter){
 var n=apps.filter(function(a){return a.cat===c[0];}).length;
 return '<button type="button" class="category" data-cat="'+c[0]+'"'+(filter?' aria-pressed="'+(selected===c[0])+'"':'')+'><span class="cat-ico">'+icon(c[2],19)+'</span><span class="cat-copy"><strong>'+c[1]+'</strong><small>'+n+(n===1?' app':' apps')+'</small></span><span class="arrow">'+icon('chev',15)+'</span></button>';
}
function categoryGrid(filter){return '<div class="category-grid'+(filter?' filters':'')+'">'+categories.map(function(c){return chip(c,filter);}).join('')+'</div>';}

/* ---------- home ---------- */
var wellKnownIds=['stremio','steamlink','ppsspp','emby','protonvpn','smarttube','tivimate','localsend','synphotos','hdhomerun','pxplay','stk','xbxplay','dolphin','xplore','nordvpn','lemuroid','surfshark','mullvad','kodi','vlc','jellyfin','retro','moonlight'];
var essentials=['vlc','kodi','jellyfin','smarttube','tvbro','aerial'];
function viewHome(){
 var known=wellKnownIds.map(appById).filter(Boolean).slice(0,6);
 var recents=additions.filter(function(a){return a.wave===latestWave;});
 return top('Descobrir')
 +pageHead('NOVA STORE · ANDROID TV','Apps para a sua TV.','Uma seleção de apps para Android TV com download direto do site oficial de cada desenvolvedor.',statPill('grid','<b>'+apps.length+'</b> apps')+statPill('download','<b>'+packages.length+'</b> APKs')+statPill('spark','<b>'+categories.length+'</b> categorias'))
 +hero()
 +'<div class="trustbar"><span>'+icon('shield',14)+'APKs de fontes oficiais</span><span>'+icon('check',14)+'Pacote e versão conferidos</span><span class="muted">Sem lojas de terceiros</span><button type="button" class="text-button" data-info>Como instalar '+icon('arrow',13)+'</button></div>'
 +shelf('Apps conhecidos','Nomes que você já ouviu falar, com download direto do desenvolvedor.',rail(known,'wide'),showAll,'known-shelf','CURADORIA')
 +shelf('Recém-adicionados','As últimas sete adições ao catálogo.',rail(recents,'wide'),showAll,'','NOVIDADES')
 +shelf('Essenciais para a TV','Um bom ponto de partida para montar a sua tela inicial.',rail(essentials.map(appById).filter(Boolean),'wide'),showAll,'','PARA COMEÇAR')
 +shelf('Explore por categoria','Escolha um assunto e veja os apps daquela seção.',categoryGrid(false),showAll,'','NAVEGUE')
 +'<div class="split"><section class="block"><h2>Instale em três passos</h2><p>O APK vem direto do desenvolvedor, sem intermediários.</p><div class="steps">'
 +'<div class="step"><div class="step-top">'+icon('download',18)+'<b>01</b></div><h3>Baixe o APK</h3><p>Abra o app e escolha a versão compatível com a sua TV.</p></div>'
 +'<div class="step"><div class="step-top">'+icon('folder',18)+'<b>02</b></div><h3>Abra o arquivo</h3><p>Use o gerenciador de arquivos da TV para localizar o download.</p></div>'
 +'<div class="step"><div class="step-top">'+icon('tv',18)+'<b>03</b></div><h3>Confirme</h3><p>Autorize a instalação de fontes confiáveis quando o Android pedir.</p></div></div></section>'
 +'<section class="block verify-card"><h2>'+icon('shield',16)+' Catálogo verificado</h2><p>Cada página mostra de onde o arquivo vem.</p><ul class="verify-list">'
 +'<li>'+icon('check',14)+'Link direto do site oficial do desenvolvedor</li><li>'+icon('check',14)+'Pacote, versão e arquitetura do APK</li><li>'+icon('check',14)+'Versão mínima do Android exigida</li><li>'+icon('check',14)+'SHA-256 quando o desenvolvedor publica</li></ul></section></div>';
}

/* ---------- catálogo ---------- */
var sortLabels={featured:'Destaques',az:'Nome A–Z',new:'Novos no catálogo'};
var abiFilters=['','arm64-v8a','armeabi-v7a','x86_64','x86'];
function abiFilterLabel(){return catalogAbi?abiLabel[catalogAbi]:'Todas as arquiteturas';}
function compatible(a){return !catalogAbi||(byApp[a.id]||[]).some(function(p){return p.abis.indexOf(catalogAbi)>=0||(p.abi==='universal'&&!p.abis.length)||p.abi===catalogAbi;});}
function matching(a,q){return !q||normalize(a.name+' '+category(a.cat)+' '+a.desc).indexOf(q)>=0;}
function wellKnownRank(a){var pos=wellKnownIds.indexOf(a.id);return pos<0?wellKnownIds.length:pos;}
function catalogItems(){
 var q=normalize(catalogQuery.trim());
 var rows=apps.filter(function(a){return (!selected||a.cat===selected)&&compatible(a)&&matching(a,q);});
 if(catalogSort==='az')rows.sort(function(a,b){return a.name.localeCompare(b.name,'pt-BR');});
 else if(catalogSort==='new')rows.sort(function(a,b){return ((b.wave||(b.added?1:0))-(a.wave||(a.added?1:0)))||a.name.localeCompare(b.name,'pt-BR');});
 else rows=wellKnownIds.map(appById).filter(function(a){return rows.indexOf(a)>=0;}).concat(rows.filter(function(a){return wellKnownRank(a)===wellKnownIds.length;}));
 return rows;
}
function filterPills(){
 var all=apps.length;
 return '<div class="filter-pills" role="group" aria-label="Filtrar por categoria"><button type="button" class="filter-pill" data-cat="" aria-pressed="'+(!selected)+'">Todas <span>'+all+'</span></button>'
 +categories.map(function(c){var n=apps.filter(function(a){return a.cat===c[0];}).length;return '<button type="button" class="filter-pill" data-cat="'+c[0]+'" aria-pressed="'+(selected===c[0])+'">'+c[1]+' <span>'+n+'</span></button>';}).join('')+'</div>';
}
function viewCatalog(){
 return top('Catálogo')
 +pageHead('DOWNLOAD DIRETO','Catálogo de apps',apps.length+' apps para explorar. Filtre por categoria, arquitetura ou procure pelo nome.',statPill('shield','Fontes oficiais')+statPill('download','<b>'+packages.length+'</b> APKs'))
 +'<div class="guide-line"><button type="button" class="text-button" data-guide aria-expanded="'+(guideOpen?'true':'false')+'" aria-controls="catalog-guide">'+icon('info',15)+' Como escolher o APK</button></div>'
 +'<div class="catalog-guide" id="catalog-guide"'+(guideOpen?'':' hidden')+'><strong>Confira a arquitetura e a versão do Android.</strong><p>Uma TV box pode ter processador de 64 bits e Android de 32 bits. Confira a arquitetura do sistema nas informações do aparelho ou num app de diagnóstico. O filtro usa as arquiteturas declaradas no arquivo; compatibilidade também depende da versão do Android exibida na página do app.</p></div>'
 +'<div class="catalog-tools"><label class="catalog-search">'+icon('search',18)+'<input type="search" id="catalog-query" aria-label="Buscar no catálogo" placeholder="Buscar por app ou função…" value="'+esc(catalogQuery)+'"></label>'
 +'<button type="button" class="catalog-control" id="order-action" data-sort><span>Ordem</span>'+sortLabels[catalogSort]+icon('chev',14)+'</button>'
 +'<button type="button" class="catalog-control" id="abi-action" data-abi><span>Arquitetura</span>'+abiFilterLabel()+icon('chev',14)+'</button></div>'
 +filterPills()+'<div class="catalog-results" id="catalog-results"></div>';
}
function renderCatalogResults(){
 var target=document.getElementById('catalog-results');if(!target)return;
 var rows=catalogItems(),limit=Math.min(rows.length,catalogLimit);
 var filters=!!(selected||catalogQuery||catalogAbi);
 target.innerHTML='<div class="catalog-summary"><span class="catalog-count" id="catalog-count" role="status">'+(rows.length===1?'1 app':rows.length+' apps')+(limit<rows.length?' · '+limit+' exibidos':'')+'</span>'+(filters?'<button type="button" class="clear-filters" data-clear>Limpar filtros '+icon('x',12)+'</button>':'')+'</div>'
 +(rows.length?grid(rows.slice(0,limit)):empty('Nenhum app encontrado','Tente outro termo ou ajuste a categoria e a arquitetura.',filters?'<button type="button" class="primary" data-clear>Limpar filtros</button>':''))
 +(limit<rows.length?'<div class="more-wrap"><button type="button" class="secondary" data-more>Mostrar mais apps '+icon('chev',15)+'</button></div>':'');
 hydrate(target);updateRails();
}
function bindCatalog(){
 var field=document.getElementById('catalog-query');
 if(field)field.addEventListener('input',function(){catalogQuery=field.value;catalogLimit=PAGE_SIZE;renderCatalogResults();});
 renderCatalogResults();
}
function openCatalog(cat){
 selected=typeof cat==='string'?cat:(selected||'');
 if(selected==='')selected='';
 page='downloads';catalogLimit=PAGE_SIZE;
 render(true);
 var pill=content.querySelector('.filter-pill[data-cat="'+selected+'"]');
 if(pill)pill.focus();else{var q=document.getElementById('catalog-query');if(q)q.focus();}
}

/* ---------- outras páginas ---------- */
function viewCategories(){
 var known=wellKnownIds.map(appById).filter(Boolean).slice(6,14);
 return top('Categorias')+pageHead('EXPLORE A LOJA','Categorias','Escolha uma seção para filtrar o catálogo.',statPill('grid','<b>'+categories.length+'</b> seções'))+categoryGrid(false)
 +shelf('Em alta na loja','Mais apps que valem o download.',rail(known,'wide'),showAll,'','CONTINUE EXPLORANDO');
}
function viewLibrary(){
 return top('Minha lista')+pageHead('SUA COLEÇÃO','Minha lista','Guarde os apps que você quer conhecer depois.',statPill('library','<b>'+saved.length+'</b> '+(saved.length===1?'app salvo':'apps salvos')))
 +(saved.length?grid(saved.map(appById).filter(Boolean)):empty('Nenhum app salvo','Abra a página de um app e escolha “Salvar na lista”.','<button type="button" class="primary" data-page="downloads">Explorar o catálogo</button>'));
}
function viewSearch(){
 return top('Buscar')+pageHead('ENCONTRE UM APP','Buscar','Pesquise por nome, categoria ou função.',statPill('search','<b>'+apps.length+'</b> apps no catálogo'))
 +'<label class="search-hero">'+icon('search',20)+'<input type="search" id="query" autocapitalize="off" autocomplete="off" placeholder="Digite o nome de um app…" aria-label="Nome ou categoria"><kbd>/</kbd></label>'
 +'<p class="search-hint">Dica: use o controle para navegar pelos resultados e OK para abrir o app.</p><div id="results" class="search-results" aria-live="polite"></div>';
}
function bindSearch(){
 var field=document.getElementById('query');if(!field)return;
 field.value=query;
 field.addEventListener('input',function(){query=field.value;searchResults();});
 searchResults();
 field.focus();
}
function searchResults(){
 var target=document.getElementById('results');if(!target)return;
 var q=normalize(query.trim()),matches=apps.filter(function(a){return matching(a,q);});
 target.innerHTML=matches.length?grid(matches):empty('Nenhum resultado','Tente buscar outro nome ou categoria.');
 hydrate(target);
}

/* ---------- detalhe ---------- */
function variant(p){
 return '<a class="variant" href="'+esc(p.url)+'" aria-label="Baixar '+esc(platform(p))+'"><span class="variant-ico">'+icon('download',17)+'</span><span class="variant-copy"><strong>'+esc(platform(p))+'</strong><small>Android '+(androidName[p.minSdk]||('API '+p.minSdk))+'+ · '+size(p.bytes)+'</small></span><span class="variant-arrow">'+icon('chev',18)+'</span></a>';
}
function specs(a,files){
 var abis=[];files.forEach(function(f){if(f.abi==='universal'&&!f.abis.length){abis.push('Universal');}else{f.abis.forEach(function(x){if(abis.indexOf(abiLabel[x]||x)<0)abis.push(abiLabel[x]||x);});}});
 var biggest=files.reduce(function(m,f){return Math.max(m,f.bytes);},0);
 var minSdk=Math.min.apply(null,files.map(function(f){return f.minSdk;}));
 return '<div class="spec-grid">'
 +'<div class="spec"><dt>Versão</dt><dd>'+esc(files[0].version.replace(/^v(?=\d)/i,''))+(a.rolling?' <span class="tag">link rolante</span>':'')+'</dd></div>'
 +'<div class="spec"><dt>Tamanho</dt><dd>'+size(biggest)+'</dd></div>'
 +'<div class="spec"><dt>Android mínimo</dt><dd>Android '+(androidName[minSdk]||('API '+minSdk))+'+</dd></div>'
 +'<div class="spec"><dt>Arquiteturas</dt><dd>'+esc(abis.join(' · '))+'</dd></div>'
 +'<div class="spec"><dt>Pacote</dt><dd><code>'+esc(files[0].package)+'</code></dd></div>'
 +'<div class="spec"><dt>Origem</dt><dd>'+esc(host(files[0].source))+' · '+files.length+(files.length===1?' arquivo':' arquivos')+'</dd></div></div>';
}
function gallery(a,media){
 var many=media.shots.length>1;
 return '<section class="gallery-section" aria-labelledby="capture-title"><div class="capture-head"><h2 id="capture-title">Capturas de tela</h2><span class="shot-count" id="shot-count" aria-live="polite">1 / '+media.shots.length+'</span></div>'
 +(a.galleryNote?'<p class="gallery-note">'+esc(a.galleryNote)+'</p>':'')
 +'<div class="slide-stage" id="slide-stage"><button class="slide-main" type="button" data-open-capture aria-label="Ampliar captura 1 de '+esc(a.name)+'"><img id="screen-image" data-art="'+a.id+':0" alt="Captura 1 de '+esc(a.name)+'"><span class="expand-label">'+icon('external',13)+' Ampliar</span></button>'+(many?slideArrow(-1,'')+slideArrow(1,''):'')+'</div>'
 +(many?'<div class="slide-thumbs" aria-label="Escolher captura">'+media.shots.map(function(src,i){return '<button type="button" data-select-shot="'+i+'" aria-label="Selecionar captura '+(i+1)+'" aria-pressed="'+(i===0)+'">'+imgShot(a.id,i)+'<span>0'+(i+1)+'</span></button>';}).join('')+'</div>':'')
 +'</section>';
}
function slideArrow(dir,scope){
 var prev=dir<0;
 return '<button type="button" class="slide-arrow '+(prev?'slide-prev':'slide-next')+'" data-slide="'+dir+'" aria-label="'+(prev?'Captura anterior':'Próxima captura')+scope+'">'+icon('chev',24)+'</button>';
}
function related(a){
 var list=apps.filter(function(x){return x.id!==a.id&&x.cat===a.cat;}).slice(0,8);
 if(list.length<3)list=wellKnownIds.map(appById).filter(function(x){return x&&x.id!==a.id;}).slice(0,8);
 return '<section class="related"><div class="shelf-head"><div><span class="eyebrow">TALVEZ VOCÊ GOSTE</span><h2>Parecidos com este</h2><p>Outros apps de '+esc(category(a.cat))+' na mesma fonte.</p></div></div>'+rail(list)+'</section>';
}
function renderDetail(){
 var a=appById(detailId);if(!a)return;
 var files=byApp[a.id],media=artwork[a.id];shotIndex=0;
 content.innerHTML='<div class="top detail-top"><button class="text-button" id="detail-back" type="button" data-back><span style="transform:rotate(180deg)">'+icon('arrow',17)+'</span> Voltar ao catálogo</button><div class="crumb">Detalhes'+icon('chev',12)+'<strong>'+esc(a.name)+'</strong></div></div>'
 +'<article class="product" style="--tone:'+a.tone+'">'
 +'<header class="detail-hero"><span class="detail-art" aria-hidden="true"><img class="detail-bg" data-art="'+a.id+':0" alt=""></span><div class="product-head"><div class="app-real-logo">'+imgLogo(a.id)+'</div>'
 +'<div class="product-title"><span class="kicker">'+esc(category(a.cat))+' · ANDROID TV</span><h1>'+esc(a.name)+'</h1><div class="detail-tags"><span class="tag verified">'+icon('shield',12)+' APK da fonte oficial</span><span class="tag">'+(a.rolling?'Versão verificada: ':'v')+esc(files[0].version.replace(/^v(?=\d)/i,''))+'</span><span class="tag">'+esc(a.price||'Grátis')+'</span>'+(a.stage?'<span class="tag stage-tag">'+esc(a.stage)+'</span>':'')+'</div></div>'
 +'<div class="product-actions"><a class="primary" href="'+esc(files[0].url)+'">'+icon('download',16)+' Baixar APK</a><button type="button" class="secondary" data-save>'+saveButton(a)+'</button></div></div></header>'
 +'<div class="product-columns"><div class="overview">'+gallery(a,media)
 +'<section class="about-section"><h2>Sobre o app</h2><p>'+esc(a.desc)+'</p>'+specs(a,files)+'</section>'
 +related(a)+'</div>'
 +'<aside class="download-panel" aria-label="Download direto"><div class="download-head"><div><span class="eyebrow">DOWNLOAD DIRETO</span><h2>Baixar APK</h2></div><span class="panel-icon">'+icon('download',21)+'</span></div>'
 +'<div class="variants">'+files.map(variant).join('')+'</div>'
 +'<p class="note">'+(a.rolling?'O link é mantido pelo desenvolvedor e pode oferecer uma versão mais recente. ':'')+(files.length>1?'Escolha a arquitetura do Android da sua TV box. ':'')+'Abra o arquivo baixado para confirmar a instalação no Android.</p>'
 +'<a class="text-button source-link" href="'+esc(files[0].source)+'" target="_blank" rel="noopener noreferrer">Fonte da versão '+icon('external',14)+'</a>'
 +'<ol class="steps-mini"><li>Baixe o APK pelo botão acima.</li><li>Abra o arquivo no gerenciador da TV.</li><li>Confirme a instalação quando o Android pedir.</li></ol></aside></div></article>';
 hydrate(content);
 var image=document.getElementById('screen-image');
 if(image){if(!image.getAttribute('src'))image.src=media.shots[0];}
 var count=document.getElementById('shot-count');
 if(count)count.textContent='1 / '+media.shots.length;
 updateRails();
 main.scrollTop=0;
}
function saveButton(a){return icon(onList(a.id)?'check':'library',16)+(onList(a.id)?' Na sua lista':' Salvar na lista');}

/* ---------- galeria ---------- */
function setShot(index){
 var a=appById(detailId);if(!a)return;
 var media=artwork[a.id],len=media.shots.length;shotIndex=((index%len)+len)%len;
 var src=media.shots[shotIndex],n=shotIndex+1;
 var image=document.getElementById('screen-image');if(image){image.src=src;image.alt='Captura '+n+' de '+a.name;}
 var count=document.getElementById('shot-count');if(count)count.textContent=n+' / '+len;
 var open=document.querySelector('[data-open-capture]');
 if(open)open.setAttribute('aria-label','Ampliar captura '+n+' de '+a.name);
 [].forEach.call(content.querySelectorAll('[data-select-shot]'),function(b,i){b.setAttribute('aria-pressed',i===shotIndex?'true':'false');});
 if(!modal.hidden){var large=document.getElementById('large-capture');if(large){large.src=src;large.alt='Captura '+n+' de '+a.name;}var lc=document.getElementById('large-count');if(lc)lc.textContent=n+' / '+len;}}
function galleryView(button){
 returnFocus=button;
 var a=appById(detailId),media=artwork[a.id],many=media.shots.length>1;
 dialog.className='dialog capture-dialog';
 dialog.innerHTML='<button type="button" class="close" data-close aria-label="Fechar captura">'+icon('x',21)+'</button><div class="capture-head"><h2 id="dialog-title">'+esc(a.name)+' · Capturas de tela</h2><span class="shot-count" id="large-count" aria-live="polite"></span></div><div class="slide-stage light-stage"><img class="lightbox-image" id="large-capture" alt="">'+(many?slideArrow(-1,' ampliada')+slideArrow(1,' ampliada'):'')+'</div>';
 modal.hidden=false;document.querySelector('.store').setAttribute('aria-hidden','true');
 setShot(shotIndex);
 dialog.querySelector(many?'.slide-next':'button').focus();
}
function closeModal(){
 if(modal.hidden)return;
 modal.hidden=true;dialog.className='dialog';dialog.innerHTML='';
 document.querySelector('.store').removeAttribute('aria-hidden');
 if(returnFocus&&returnFocus.focus)returnFocus.focus();
 returnFocus=null;
}

/* ---------- diálogo de ajuda ---------- */
function infoDialog(){
 returnFocus=document.activeElement;
 dialog.className='dialog info-dialog';
 dialog.innerHTML='<button type="button" class="close" data-close aria-label="Fechar ajuda">'+icon('x',21)+'</button><h2 id="dialog-title">Como instalar na TV</h2>'
 +'<p>Os APKs desta loja vêm do site oficial de cada desenvolvedor. Baixe pelo botão do app e abra o arquivo na própria TV.</p>'
 +'<ol><li>Escolha a versão compatível com a arquitetura do seu aparelho.</li><li>Abra o APK pelo gerenciador de arquivos da TV.</li><li>Se o Android pedir, autorize a instalação de apps de fontes confiáveis nas configurações do aparelho.</li><li>Confirme a instalação e abra o app pela tela inicial.</li></ol>'
 +'<p class="note">A Nova Store não hospeda arquivos: os links apontam para o site oficial do desenvolvedor e podem ser atualizados por ele.</p>';
 modal.hidden=false;document.querySelector('.store').setAttribute('aria-hidden','true');
 dialog.querySelector('.close').focus();
}

/* ---------- navegação ---------- */
function restoreCatalog(){
 var p=catalogPlace;catalogPlace=null;detailId='';
 if(p){page=p.page;selected=p.selected;query=p.query;catalogLimit=p.limit||PAGE_SIZE;}
 render(false);
 if(p){main.scrollTop=p.scroll;var target=p.hero?document.getElementById('hero-action'):content.querySelector('[data-app="'+p.app+'"]');if(target)target.focus();}
 else{var active=menu.querySelector('[aria-current]');if(active)active.focus();}
}
function currentHash(){var m=location.hash.match(/^#app\/([a-z0-9-]+)$/);return m&&appById(m[1])?m[1]:'';}
function syncDetail(){if(!modal.hidden)closeModal();var next=currentHash();if(next){detailId=next;render(false);var back=document.getElementById('detail-back');if(back)back.focus();}else if(detailId){restoreCatalog();}}
function openDetails(a){
 var focus=document.activeElement;
 if(!detailId)catalogPlace={page:page,selected:selected,query:query,scroll:main.scrollTop,app:a.id,hero:!!(focus&&focus.id==='hero-action'),limit:catalogLimit};
 location.hash='app/'+a.id;
}
function leaveDetails(){if(catalogPlace)history.back();else location.hash='';}
function go(to){
 if(to==='downloads'){selected='';catalogLimit=PAGE_SIZE;catalogQuery='';catalogAbi='';page='downloads';render(false);var field=document.getElementById('catalog-query');if(field)field.focus();return;}
 if(to!=='search')query='';
 page=to;render(false);
 if(to==='search'){var q=document.getElementById('query');if(q)q.focus();}
}
function back(){
 if(!modal.hidden){closeModal();return;}
 if(detailId){leaveDetails();return;}
 if(page==='downloads'&&(selected||catalogQuery||catalogAbi)){selected='';catalogQuery='';catalogAbi='';catalogLimit=PAGE_SIZE;render(false);var f=document.getElementById('catalog-query');if(f)f.focus();return;}
 if(page!=='home'){go('home');var active=menu.querySelector('[aria-current]');if(active)active.focus();}
}

/* ---------- render ---------- */
function updateMenu(){
 var buttons=menu.querySelectorAll('button');
 for(var i=0;i<buttons.length;i++){if(buttons[i].getAttribute('data-page')===page)buttons[i].setAttribute('aria-current','page');else buttons[i].removeAttribute('aria-current');}
}
function render(keepScroll){
 var scroll=main.scrollTop;
 updateMenu();updateSaved();updateFoot();
 if(detailId){renderDetail();return;}
 var html='';
 if(page==='home')html=viewHome();
 else if(page==='downloads')html=viewCatalog();
 else if(page==='categories')html=viewCategories();
 else if(page==='library')html=viewLibrary();
 else html=viewSearch();
 content.innerHTML=html;
 hydrate(content);
 setupRails();
 if(page==='home')setHero(heroIndex);
 if(page==='downloads')bindCatalog();
 if(page==='search')bindSearch();
 main.scrollTop=keepScroll?scroll:0;
}

/* ---------- eventos ---------- */
window.addEventListener('hashchange',syncDetail);
var iconNodes=document.querySelectorAll('[data-icon]');
for(var i=0;i<iconNodes.length;i++){iconNodes[i].innerHTML=icon(iconNodes[i].getAttribute('data-icon'),iconNodes[i].className==='brand-icon'?25:19);}
document.addEventListener('scroll',function(e){var t=e.target;if(t&&t.classList&&t.classList.contains('rail-track')){var rail=t.parentNode;while(rail&&rail.classList&&!rail.classList.contains('rail'))rail=rail.parentNode;if(rail)updateRail(rail);}},true);
document.addEventListener('focusin',function(e){
 var t=e.target;
 if(t&&t.classList&&t.classList.contains('rail-track'))return;
 if(t&&t.closest){var track=t.closest('.rail-track');if(track&&track.scrollIntoView){try{track.scrollIntoView({block:'nearest',inline:'center',behavior:'smooth'});}catch(err){}}}
});
window.addEventListener('resize',function(){updateRails();});
document.addEventListener('click',function(e){
 var b=e.target.closest('button,a');
 if(!modal.hidden){
  if(e.target===modal||b&&b.hasAttribute('data-close'))closeModal();
  else if(b&&b.hasAttribute('data-slide'))setShot(shotIndex+Number(b.getAttribute('data-slide')));
  return;
 }
 if(!b)return;
 if(detailId&&b.hasAttribute('data-back')){leaveDetails();return;}
 if(detailId&&b.hasAttribute('data-slide')){setShot(shotIndex+Number(b.getAttribute('data-slide')));return;}
 if(detailId&&b.hasAttribute('data-select-shot')){setShot(Number(b.getAttribute('data-select-shot')));return;}
 if(detailId&&b.hasAttribute('data-open-capture')){galleryView(b);return;}
 if(detailId&&b.hasAttribute('data-save')){
  var a=appById(detailId),wasOn=onList(a.id);
  if(wasOn)saved.splice(saved.indexOf(a.id),1);else saved.push(a.id);
  try{localStorage.setItem('nova.store.wishlist',JSON.stringify(saved));}catch(err){}
  updateSaved();b.innerHTML=saveButton(a);toast(wasOn?'Removido da sua lista':'Salvo na sua lista');
  return;
 }
 if(b.hasAttribute('data-hero')){setHero(Number(b.getAttribute('data-hero')));return;}
 if(b.hasAttribute('data-rail')){
  var rail=b.closest('.rail'),track=rail?rail.querySelector('.rail-track'):null;
  if(track){try{track.scrollBy({left:Number(b.getAttribute('data-rail'))*track.clientWidth*.85,behavior:'smooth'});}catch(err){track.scrollLeft+=Number(b.getAttribute('data-rail'))*track.clientWidth*.85;}setTimeout(function(){updateRail(rail);},320);}
  return;
 }
 if(b.hasAttribute('data-info')){infoDialog();return;}
 if(b.hasAttribute('data-page')){var dest=b.getAttribute('data-page'),inMenu=menu.contains(b);if(detailId){catalogPlace=null;detailId='';try{history.replaceState(null,'',location.href.split('#')[0]);}catch(err){location.hash='';}}go(dest);if(!inMenu&&page!=='search'){var cur=menu.querySelector('[aria-current]');if(cur)cur.focus();}return;}
 if(b.hasAttribute('data-cat')){
  var cat=b.getAttribute('data-cat');
  if(page==='downloads'){
   selected=cat;catalogLimit=PAGE_SIZE;render(true);
   var pill=content.querySelector('.filter-pill[data-cat="'+cat+'"]');if(pill)pill.focus();
  }else{openCatalog(cat);}
  return;
 }
 if(b.hasAttribute('data-guide')){guideOpen=!guideOpen;var guide=document.getElementById('catalog-guide');if(guide)guide.hidden=!guideOpen;b.setAttribute('aria-expanded',guideOpen?'true':'false');return;}
 if(b.hasAttribute('data-sort')){var modes=['featured','az','new'];catalogSort=modes[(modes.indexOf(catalogSort)+1)%modes.length];catalogLimit=PAGE_SIZE;render(true);var order=document.getElementById('order-action');if(order)order.focus();return;}
 if(b.hasAttribute('data-abi')){catalogAbi=abiFilters[(abiFilters.indexOf(catalogAbi)+1)%abiFilters.length];catalogLimit=PAGE_SIZE;render(true);var abi=document.getElementById('abi-action');if(abi)abi.focus();return;}
 if(b.hasAttribute('data-clear')){selected='';catalogQuery='';catalogAbi='';catalogLimit=PAGE_SIZE;page='downloads';render(false);var f2=document.getElementById('catalog-query');if(f2)f2.focus();return;}
 if(b.hasAttribute('data-more')){var start=catalogLimit;catalogLimit+=PAGE_SIZE;renderCatalogResults();var cards=document.querySelectorAll('#catalog-results .app-card');var target=cards[start];if(target)target.focus();return;}
 if(b.hasAttribute('data-app')){var app=appById(b.getAttribute('data-app'));if(app)openDetails(app);return;}
});
function controls(){var scope=modal.hidden?document.querySelector('.store'):dialog;return [].slice.call(scope.querySelectorAll('button, a[href], input')).filter(function(el){return el.getClientRects().length;});}
function spatial(key){
 var a=document.activeElement,options=controls();
 if(options.indexOf(a)<0){var fallback=document.getElementById('hero-action')||options[0];if(fallback)fallback.focus();return;}
 var r=a.getBoundingClientRect(),x=(r.left+r.right)/2,y=(r.top+r.bottom)/2,h=key==='ArrowRight'||key==='ArrowLeft',sign=key==='ArrowRight'||key==='ArrowDown'?1:-1,best=null,min=Infinity;
 options.forEach(function(b){if(b===a)return;var t=b.getBoundingClientRect(),tx=(t.left+t.right)/2,ty=(t.top+t.bottom)/2,major=sign*(h?tx-x:ty-y),cross=Math.abs(h?ty-y:tx-x),overlap=h?Math.min(r.bottom,t.bottom)-Math.max(r.top,t.top):Math.min(r.right,t.right)-Math.max(r.left,t.left);if(major<4)return;var score=major+cross*(overlap>0?.24:3)+(overlap>0?0:30);if(score<min){min=score;best=b;}});
 if(best)best.focus();
}
document.addEventListener('keydown',function(e){
 var input=e.target.tagName==='INPUT';
 if(!e.key)return;
 if(e.key==='Escape'||e.key==='BrowserBack'||e.key==='GoBack'){e.preventDefault();back();return;}
 if(e.key==='/'&&!input&&modal.hidden&&!detailId){e.preventDefault();go('search');return;}
 if((e.key==='ArrowLeft'||e.key==='ArrowRight')&&detailId&&(!modal.hidden||e.target.closest&&e.target.closest('#slide-stage'))){e.preventDefault();setShot(shotIndex+(e.key==='ArrowLeft'?-1:1));return;}
 if(e.key.indexOf('Arrow')===0&&!(input&&(e.key==='ArrowLeft'||e.key==='ArrowRight'))){e.preventDefault();spatial(e.key);return;}
 if(e.key==='Tab'&&!modal.hidden){var buttons=controls(),index=buttons.indexOf(document.activeElement);if((index===buttons.length-1&&!e.shiftKey)||(index===0&&e.shiftKey)){e.preventDefault();buttons[e.shiftKey?buttons.length-1:0].focus();}}
});
window.novaStoreBack=function(){if(modal.hidden&&!detailId&&page==='home')return false;back();return true;};
if(!(window.CSS&&CSS.supports&&CSS.supports('display','grid')&&CSS.supports('width','clamp(1px,2px,3px)')))document.body.classList.add('store-legacy');
if(currentHash())syncDetail();else render(false);
if(location.hostname==='store.nova.invalid'){document.body.classList.add('android-store');if(!detailId){var primary=document.querySelector('.hero-cta');if(primary)primary.focus();}}
}());
