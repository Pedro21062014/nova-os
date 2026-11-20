#!/usr/bin/env python3
"""Build the allowed Nova IPTV catalog. Discovery does not grant distribution rights."""
from concurrent.futures import ThreadPoolExecutor
from io import BytesIO
from pathlib import Path
from urllib.parse import urljoin, urlparse, quote
import json, re
from datetime import datetime, timezone

import requests
from bs4 import BeautifulSoup
from PIL import Image, ImageOps

ROOT=Path(__file__).resolve().parent.parent
ART=ROOT/'assets'/'catalog'; ART.mkdir(exist_ok=True)
CAT=ROOT/'catalogo.json'
M3U=ROOT/'Nova-IPTV-lista.m3u'
API='https://api.github.com/repos/lakson-llc/kyte-demo-media/releases/tags/v1'
KY='https://raw.githubusercontent.com/lakson-llc/kyte-demo-media/177041e86bbc4a1dfccb6fb1c57cc00b73ce652e/README.md'
BR='https://raw.githubusercontent.com/iptv-org/iptv/e31bf2d278215d665b3372ab4bcceadc95858323/streams/br.m3u'
HEADERS={'User-Agent':'NovaIPTV-Catalog/2.0 (open media curation)'}

def get(url,**kwargs):
 r=requests.get(url,headers=HEADERS|kwargs.pop('headers',{}),timeout=(5,9),**kwargs);r.raise_for_status();return r

def mp4_ok(url):
 with get(url,headers={'Range':'bytes=0-31'},stream=True) as r:
  head=next(r.iter_content(32),b'')
  return b'ftyp' in head[:24] or head.startswith(b'\x1aE\xdf\xa3')

def probe_live(url):
 def read(u):
  with get(u,stream=True) as r:
   data=next(r.iter_content(65536),b'').decode('utf-8','replace');final=r.url
   if not data.startswith('#EXTM3U') or final.split(':')[0]!='https':raise ValueError('Não é HLS HTTPS')
   return data,final
 data,end=read(url)
 uri=next((l.strip() for l in data.splitlines() if l and not l.startswith('#')),'')
 if not uri:raise ValueError('HLS vazio')
 if '#EXT-X-STREAM-INF' in data:
  data,end=read(urljoin(end,uri));uri=next((l.strip() for l in data.splitlines() if l and not l.startswith('#')),'')
 if not uri or '#EXT-X-ENDLIST' in data or not re.search(r'#EXTINF:',data) or re.search(r'#EXT-X-KEY:[^\n]*METHOD=(?!NONE)',data):raise ValueError('Não é playlist de mídia aberta')
 with get(urljoin(end,uri),headers={'Range':'bytes=0-255'},stream=True) as r:
  start=next(r.iter_content(256),b'');mime=r.headers.get('Content-Type','')
  if not start or mime.startswith('text/html') or urlparse(r.url).scheme!='https':raise ValueError('Segmento não encontrado')
 return True

def still(id,source,wide=False):
 path=ART/(id+'.webp')
 if path.exists():return True
 try:
  with get(source,stream=True) as response:
   data=bytearray()
   for chunk in response.iter_content(16384):
    data+=chunk
    if len(data)>5_000_000:return False
  im=ImageOps.exif_transpose(Image.open(BytesIO(data))).convert('RGB');im.thumbnail((1450 if wide else 560,900 if wide else 380))
  if im.width<120:return False
  im.save(path,quality=84 if wide else 80,method=6);return True
 except Exception as e: print('Sem arte:',id,type(e).__name__);return False

def image_from(page):
 soup=BeautifulSoup(get(page).content,'html.parser');m=soup.find('meta',property='og:image');return m['content'] if m else ''

VOD={
 'sintel':('Fantasia','Uma jovem sai em busca de seu dragão em um mundo de montanhas, ruínas e antigas criaturas.'),
 'spring':('Fantasia','Uma pastora e seu cão enfrentam espíritos ancestrais nas montanhas quando o inverno precisa dar lugar à primavera.'),
 'charge':('Ficção científica','Num futuro sem energia, um ladrão invade uma instalação para encontrar uma última fonte de poder.'),
 'tears-of-steel':('Ficção científica','Cientistas e combatentes tentam reescrever um momento do passado para salvar Amsterdã de um futuro dominado por máquinas.'),
 'sprite-fright':('Comédia de terror','Um grupo de adolescentes entra numa floresta e descobre que seus pequenos habitantes são tudo menos inofensivos.'),
 'wing-it':('Comédia','Um gato metódico e um cão cheio de ideias colocam uma invenção à prova dentro de casa.'),
 'big-buck-bunny':('Animação','Um coelho bem-humorado decide dar uma lição aos três pequenos valentões da floresta.'),
 'elephants-dream':('Fantasia','Dois viajantes percorrem uma máquina imensa em um mundo surreal.'),
 'coffee-run':('Comédia','Uma corrida por café atravessa cenários que refletem as fases de um relacionamento.'),
 'hero':('Fantasia','Um aventureiro enfrenta o perigo em um curta animado em 2D.'),
 'glass-half':('Comédia','Dois críticos de arte confrontam suas opiniões em uma galeria.'),
}
LIVE={
 'TVBrasil.br@SD':('tv-brasil','TV Brasil','TV pública','https://tvbrasil.ebc.com.br/webtv','tvbrasil-stream.ebc.com.br','BR','#214c46'),
 'CanalGov.br@SD':('canal-gov','Canal Gov','Notícias públicas','https://canalgov.ebc.com.br/ao-vivo','canalgov-stream.ebc.com.br','GOV','#273d62'),
 'TVCamara.br@SD':('tv-camara','TV Câmara','Legislativo','https://www.camara.leg.br/tv','stream3.camara.gov.br','CÂM','#3c4b34'),
 'CanalEducacao.br@SD':('canal-educacao','Canal Educação','Educação','https://canaleducacao.ebc.com.br/ao-vivo','canaleducacao-stream.ebc.com.br','EDU','#694937'),
 'TVCultura.br@SD':('tv-cultura','TV Cultura','Cultura','https://culturaplay.tvcultura.com.br/channels/14-01-tv-cultura-ao-vivo-01-tv-cultura-ao-vivo','player-tvcultura.stream.uol.com.br','C','#57466c'),
 'TVUFOP.br@HD':('tv-ufop','TV UFOP','Universitária','https://tvufop.com.br/','app.tvufop.com.br','UFOP','#294137'),
 'CulturaFast.br@SD':('cultura-fast','Cultura Fast','Cultura','https://culturaplay.tvcultura.com.br/channels','fpa-gateway.tvcultura.com.br','FAST','#394947'),
 'RecordNews.br@SD':('record-news','Record News','Notícias','https://www.youtube.com/@recordnews/streams','rnw-rn.otteravision.com','RN','#394658'),
 'TVAparecida.br@SD':('tv-aparecida','TV Aparecida','Religioso','https://www.a12.com/tv/tv-ao-vivo','cdn.jmvstream.com','AP','#444360'),
 'TVVilaReal.br@SD':('record-mt','Record MT · TV Vila Real','Afiliada regional','https://www.gazetadigital.com.br/tvs-ao-vivo/tv-vila-real-10-1/','cdn.jmvstream.com','VR','#2e4752'),
 'TVERS.br@SD':('tve-rs','TVE RS','Cultura regional','https://www.tve.com.br/inicial','streaming.procergs.com.br','RS','#334f65')
}
# Official web sources without a verified direct feed: never export as IPTV media.
WEB=[('tv-senado','TV Senado','Legislativo','https://www12.senado.leg.br/tv','SEN','#384a65'),('canal-saude','Canal Saúde','Saúde pública','https://www.canalsaude.fiocruz.br/channels/50','SUS','#445644'),('tv-justica','TV Justiça','Judiciário','https://radioetvjustica.jus.br/assista-ao-vivo','JUS','#4a435c'),('rede-minas','Rede Minas','Cultura regional','https://minasplay.com/aovivo/','MG','#5c4139'),('tv-alerj','TV Alerj','Legislativo','https://www.youtube.com/@TVALERJCanal/live','RJ','#3d5059'),
 ('tv-globo','TV Globo','Variedades','https://globoplay.globo.com/tv-globo/ao-vivo/7832875/','G','#364050'),
 ('sbt','SBT','Variedades','https://www.sbt.com.br/ao-vivo','SBT','#384658'),
 ('band','Band','Variedades','https://www.band.com.br/ao-vivo','B','#344d39'),
 ('record','Record','Variedades','https://www.recordplus.com/','R','#4d493e'),
 ('redetv','RedeTV!','Variedades','https://www.redetv.uol.com.br/aovivo','RTV','#3e4b61'),
 ('tv-gazeta','TV Gazeta','Variedades','https://www.tvgazeta.com.br/aovivo/','GZ','#4a4940'),
 ('redevida','REDEVIDA','Religioso','https://www.redevida.com.br/ao-vivo','RV','#53415c'),
 ('cancao-nova','Canção Nova','Religioso','https://tv.cancaonova.com/','CN','#3b4b57'),
 ('tve-bahia','TVE Bahia','Cultura regional','https://www.youtube.com/@tvebahia/live','BA','#4d5140'),
 ('tv-ceara','TV Ceará','Cultura regional','https://www.tvceara.ce.gov.br/2007/05/12/ao-vivo/','CE','#3d5042')]


# These embeds are published on the channels’ own live pages. Verify on-air status
# with Dailymotion's public metadata; do not extract or export the provider's HLS.
EMBED={
 'tv-gazeta':('https://geo.dailymotion.com/player/xb2fp.html?video=x9xwtpy','x9xwtpy','TV GAZETA'),
 'redevida':('https://geo.dailymotion.com/player/x1mmve.html?video=xb1dec2','xb1dec2','Rede Vida')
}
def check_embed(source,embed,video_id,owner):
 page=get(source).text
 if embed not in page:return False
 d=get('https://api.dailymotion.com/video/'+video_id,params={'fields':'live_status,allow_embed,private,owner.screenname'}).json()
 return d.get('allow_embed') and not d.get('private') and d.get('live_status')=='onair' and d.get('owner.screenname')==owner

def main():
 by_asset={i['name']:i for i in get(API).json()['assets']}
 md=get(KY).text
 rows={}
 for ln in md.splitlines():
  fields=[s.strip() for s in ln.strip('|').split('|')]
  if len(fields)!=6 or not fields[0].startswith('`'):continue
  filename=fields[0].strip('`');lic=re.fullmatch(r'\[(CC BY [0-9.]+)\]\((https://creativecommons.org/[^)]+)\)',fields[4]);src=re.search(r'\[Blender Studio\]\((https://studio.blender.org/[^)]+)\)',fields[5]);
  if lic and src and filename in by_asset:
   rows[filename[:-4]]=dict(name=fields[1],year=fields[2],credit='Blender Foundation / Blender Studio · direção: '+fields[3],license=lic[1],licenseUrl=lic[2],source=src[1],stream=by_asset[filename]['browser_download_url'])
 def blender(id):
  g,desc=VOD[id];entry=rows[id].copy();entry.update(id=id,type='movies',genre=g,description=desc,kind='video',discovery=API)
  if not mp4_ok(entry['stream']):raise ValueError(id+' media')
  img=image_from(entry['source']);entry['art']=id if still(id,img,id=='sintel') else '';entry['artSource']=img
  return entry
 with ThreadPoolExecutor(8) as ex:movies=list(ex.map(blender,VOD))
 for id,name,year,genre,desc,source,stream,license,lic,credit,img in [
  ('cosmos-laundromat','Cosmos Laundromat: First Cycle','2015','Fantasia','Em uma ilha desolada, um vendedor misterioso oferece a uma ovelha a chance de mudar de vida.','https://studio.blender.org/films/cosmos-laundromat/','https://media.xiph.org/cosmoslaundromat/Cosmos_Laundromat_First_Cycle_2k.mp4','CC BY-SA 4.0','https://creativecommons.org/licenses/by-sa/4.0/','Blender Foundation',''),
  ('internets-own-boy','The Internet’s Own Boy','2014','Documentário','A trajetória de Aaron Swartz e sua defesa do acesso aberto à informação.','https://archive.org/details/TheInternetsOwnBoyTheStoryOfAaronSwartz','https://archive.org/download/TheInternetsOwnBoyTheStoryOfAaronSwartz/TheInternetsOwnBoy_TheStoryofAaronSwartz-HD.mp4','CC BY-NC-SA 4.0','https://creativecommons.org/licenses/by-nc-sa/4.0/','Brian Knappenberger · uso não comercial','https://archive.org/services/img/TheInternetsOwnBoyTheStoryOfAaronSwartz')]:
  if not mp4_ok(stream):raise ValueError(id+' media')
  img=img or image_from(source)
  movies.append(dict(id=id,name=name,year=year,genre=genre,description=desc,source=source,stream=stream,license=license,licenseUrl=lic,credit=credit,type='movies',kind='video',art=id if still(id,img) else '',artSource=img))
 print('Filmes verificados:',len(movies),flush=True)
 cams=[]
 for n,slug,desc in [(1,'caminandes-1','Llama Drama'),(2,'caminandes-2','Gran Dillama'),(3,'caminandes-3','Llamigos')]:
  if n==2:
   file='Caminandes,_Gran_Dillama_-_Blender_Foundation.webm';entry=dict(stream='https://video.blender.org/object-storage/web_videos/fb70d459-48d2-4db5-adba-813c84f9200a-720.mp4',source='https://commons.wikimedia.org/wiki/File:'+file,license='CC BY-SA 3.0',licenseUrl='https://creativecommons.org/licenses/by-sa/3.0/',credit='Blender Foundation · Caminandes',year='2013')
  else:entry=rows[slug].copy()
  try: valid=mp4_ok(entry['stream'])
  except Exception:valid=False
  if valid:
   entry.update(id=slug,name=desc,number=n,kind='video');cams.append(entry)
 camart=image_from(rows['caminandes-3']['source']);still('caminandes',camart)
 series=[dict(id='caminandes',type='series',name='Caminandes',year='2013–2016',genre='Animação',description='Koro, uma lhama da Patagônia, enfrenta pequenos dilemas com grandes consequências.',source=rows['caminandes-3']['source'],art='caminandes',artSource=camart,episodes=cams)]
 # Archive copies of the CC BY-SA editions, cross-checked with the creators' descriptions.
 eps=[]
 for n,name,item,file,lic in [
  (3,'The Secret Ingredients','pepper-carrot-episode-3-the-secret-ingredients-english','79780d2c-419b-42a3-adb5-85ae2aea4d1e-1080.mp4','4.0'),
  (4,'Stroke of Genius','pepper-carrot-episode-4-stroke-of-genius-1080p','Pepper & Carrot Episode 4: Stroke of Genius 1080p.mp4','4.0'),
  (6,'The Potion Contest','peppercarrot-ep6','pepper-en-basic.mp4','3.0')]:
  stream='https://archive.org/download/'+item+'/'+quote(file);lic_url='https://creativecommons.org/licenses/by-sa/'+lic+'/'
  meta=get('https://archive.org/metadata/'+item).json()['metadata']
  if meta.get('licenseurl','').replace('http://','https://',1)!=lic_url or not mp4_ok(stream):raise ValueError(item+' media ou licença')
  eps.append(dict(id='pepper-'+str(n),number=n,name=name,language='Inglês',stream=stream,kind='video',source='https://archive.org/details/'+item,credit='Morevna Project · baseado em David Revoy',license='CC BY-SA '+lic,licenseUrl=lic_url))
 pa='https://peertube.touhoppai.moe/lazy-static/thumbnails/10ae0d90-3763-440f-a30d-bdc4b6e4c92c.jpg';still('pepper',pa)
 series.append(dict(id='pepper',type='series',name='Pepper & Carrot',year='2017–2022',genre='Animação',description='Uma jovem bruxa e seu gato vivem aventuras num universo cheio de poções e pequenos desastres.',source='https://morevnaproject.org/pepper-and-carrot/',art='pepper',artSource=pa,episodes=eps))
 morevna=[]
 for n,name,lang,file,lic in [(3,'Morevna — Episódio 3','Inglês','morevna-3.0.2-en.mp4','3.0'),(4,'Death(Less)','Russo','morevna-4.0.1-ru-hq.mp4','4.0')]:
  item='morevna-ep'+str(n);stream='https://archive.org/download/'+item+'/'+file
  if not mp4_ok(stream):raise ValueError(item+' media')
  morevna.append(dict(id=item,number=n,name=name,language=lang,stream=stream,kind='video',source='https://archive.org/details/'+item,credit='Morevna Project · Konstantin Dmitriev',license='CC BY-SA '+lic,licenseUrl='https://creativecommons.org/licenses/by-sa/'+lic+'/'))
 ma='https://archive.org/services/img/morevna-ep3';still('morevna',ma)
 series.append(dict(id='morevna',type='series',name='Morevna',year='2016–2019',genre='Ficção científica',description='Um anime independente que reimagina um conto popular russo em um universo futurista.',source='https://morevnaproject.org/anime/episode-4_old/',art='morevna',artSource=ma,episodes=morevna))
 src=get(BR).text.splitlines();direct={};
 for i,line in enumerate(src[:-1]):
  k=re.search(r'tvg-id="([^"]+)"',line)
  if k and k[1] in LIVE:
   u=src[i+1].strip();details=LIVE[k[1]];host=urlparse(u).hostname
   if host==details[4] and u.startswith('https://'):direct[k[1]]=u
 # Use the CDN’s canonical HTTPS address, not its historical redirect.
 for key in ('TVAparecida.br@SD','TVVilaReal.br@SD'):
  if key in direct:direct[key]=direct[key].replace('https://cdn.jmvstream.com/','https://cdn.live.br1.jmvstream.com/',1)
 def live(item):
  k,(id,name,genre,src,host,mark,tone)=item;u=direct.get(k,'');kind='website'
  try:
   if u and probe_live(u):kind='hls'
  except Exception as e:print('Apenas site oficial:',name,type(e).__name__)
  return dict(id=id,name=name,genre=genre,source=src,mark=mark,tone=tone,kind=kind,stream=u if kind=='hls' else '',discovery=BR)
 with ThreadPoolExecutor(8) as ex:channels=list(ex.map(live,LIVE.items()))
 # SBT Interior is explicitly published as a live player by the CDN. Do not
 # present the affiliate's transmission as the national or Vale do Paraíba feed.
 jmv='https://jmvstream.com/en/high-quality-live-video-streaming'
 interior_embed='https://player.jmvstream.com/lvw/e5whdeMpnNiJkSDXnyMWY4IopwpgTH'
 interior=dict(id='sbt-interior',name='SBT Interior (SP)',genre='Afiliada regional',source=interior_embed,mark='SBT',tone='#384658',kind='website',stream='',authorization=jmv)
 try:
  if interior_embed in get(jmv).text:
   public=get(interior_embed).text
   m=re.search(r'https://cdn\.live\.br1\.jmvstream\.com/w/LVW-10801/[A-Za-z0-9_]+/playlist\.m3u8',public)
   if m and probe_live(m[0]):interior.update(kind='hls',stream=m[0],discovery=interior_embed)
 except (requests.RequestException,ValueError) as ex:print('SBT Interior: apenas página do player',type(ex).__name__)
 channels.append(interior)
 # Supplemental public streams verified against the actual publisher pages.
 for id,name,genre,src,published,mark,tone,pattern in [
  ('tv-aratu','TV Aratu · SBT Bahia','Afiliada regional','https://aratuon.com.br/aovivo/','https://player.jmvstream.com/lvw/4ogmnvE11V1qNfjA4FKKN22G485q7u','AR','#4f3c39',r'https://cdn\.live\.br1\.jmvstream\.com/w/LVW-9359/[A-Za-z0-9_]+/playlist\.m3u8'),
  ('catve','Catve','TV regional','https://catve.com/ao-vivo','https://catve.com/ao-vivo','CT','#344b5a',r'https://5b33b873179a2\.streamlock\.net:1443/live/livestream/playlist\.m3u8')]:
  channel=dict(id=id,name=name,genre=genre,source=src,mark=mark,tone=tone,kind='website',stream='',discovery=published)
  try:
   if id!='tv-aratu' or published in get(jmv).text:
    found=re.search(pattern,get(published).text)
    if found and probe_live(found[0]):channel.update(kind='hls',stream=found[0])
  except (requests.RequestException,ValueError) as ex: print('Apenas página oficial:',id,type(ex).__name__)
  channels.append(channel)
 for id,name,genre,src,mark,tone in WEB:
  channel=dict(id=id,name=name,genre=genre,source=src,mark=mark,tone=tone,kind='website',stream='')
  if id in EMBED:
   try:
    if check_embed(src,*EMBED[id]):channel.update(kind='embed',embed=EMBED[id][0])
   except requests.RequestException as ex:print('Player oficial fora da curadoria:',id,type(ex).__name__)
  channels.append(channel)
 for o in channels:
  if o['id']=='tv-aparecida':o.update(alternative='https://www.youtube.com/tvaparecida/live',authorization=jmv)
  if o['id']=='record-mt':o.update(description='Sinal da TV Vila Real, afiliada da Record em Cuiabá (MT), com programação regional. Não é o sinal nacional.',authorization='https://www.gazetadigital.com.br/',alternative='https://www.gazetadigital.com.br/')
  if o['id']=='record-news':o['authorization']='https://propmark.com.br/record-news-chega-a-pluto-e-a-samsung-tv/'
 official_notes={
  'tv-globo':('O sinal oficial é no Globoplay, com Conta Globo e disponibilidade por região.','https://ajuda.globo.com/article/Quais-os-tipos-de-plano-do-Globoplay'),
  'record':('No RecordPlus, entre com sua conta e escolha a opção Ao Vivo. O sinal depende da região. Para ver a afiliada de Cuiabá, escolha Record MT na lista Na Nova.','https://descubra.recordplus.com/'),
  'sbt':('Este é o sinal do site do SBT. Pode haver restrição de região. O SBT Interior (SP) está listado separadamente e toca na Nova.','https://mais.sbt.com.br/'),
  'band':('Página oficial da Band. Você também pode assistir pelo Bandplay.','https://bandplay.com/'),
  'redetv':('O player publicado pela RedeTV! não iniciou no teste externo. Tente a página oficial ou a plataforma RedeTV! Go.','https://redetvgo.com.br/'),
  'tv-senado':('A programação ao vivo na internet depende do horário e das atividades legislativas.','https://www.youtube.com/@tvsenado/live'),
  'canal-saude':('Use o player oficial da Fiocruz. O sinal na web não foi aberto como uma URL M3U direta.','https://www.canalsaude.fiocruz.br/canal/comoAssistir'),
  'tv-justica':('Use a página oficial para assistir quando houver transmissão.','https://www.youtube.com/tvjusticaoficial'),
  'tve-bahia':('A TVE Bahia publica transmissões na página oficial do YouTube conforme a programação.',None),
  'tv-ceara':('O player oficial não iniciou no teste externo. Acompanhe a disponibilidade na página da TV Ceará.',None),
  'rede-minas':('A Rede Minas transmite pelo Minasplay. O player externo não iniciou no teste.',None),
  'tv-alerj':('Consulte a transmissão e os horários no canal oficial da TV Alerj.',None),
  'cancao-nova':('O player oficial da Canção Nova fica na página da emissora. O YouTube pediu verificação no teste externo.',None)
 }
 for o in channels:
  if o['id'] in official_notes:
   o['description'],alt=official_notes[o['id']]
   if alt:o['alternative']=alt
 result=dict(schema=1,checked=datetime.now(timezone.utc).isoformat(timespec='seconds'),sources=[API,KY,BR],movies=movies,series=series,channels=channels)
 CAT.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 playlist=['#EXTM3U','#PLAYLIST:Nova IPTV | Catálogo aberto']
 def add(item,group,title=None):
  if not item.get('stream'):return
  if item.get('credit'):playlist.append('# '+item['credit']+' | '+item['license']+' '+item['licenseUrl']+' | '+item['source'])
  playlist.extend(['#EXTINF:-1 tvg-id="'+item['id']+'" group-title="'+group+'",'+(title or item['name']),item['stream']])
 for item in channels:
  if item['kind']=='hls':add(item,'TV ao vivo')
 for item in movies:add(item,'Filmes abertos')
 for show in series:
  for ep in show['episodes']:add(ep,'Séries · '+show['name'],show['name']+' — E'+str(ep['number']).zfill(2)+' · '+ep['name'])
 M3U.write_text('\n'.join(playlist)+'\n',encoding='utf-8')
 print(f"{len(channels)} canais ({sum(c['kind']=='hls' for c in channels)} HLS), {len(movies)} filmes, {len(series)} séries / {sum(len(s['episodes']) for s in series)} episódios",flush=True)

if __name__=='__main__':main()
