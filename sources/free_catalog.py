#!/usr/bin/env python3
"""Refresh the free, official-platform VOD layer. Does not download video or touch M3U."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.parse import urlparse
import io,json,re
import requests
from bs4 import BeautifulSoup
from PIL import Image,ImageOps
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets/free';OUT.mkdir(exist_ok=True)
IC='https://www.itauculturalplay.com.br'

# Curated public title routes. The streaming service performs playback and handles login/territory.
IC_FILMS=['carandiru-3','durval-discos','eles-nao-usam-black-tie','sao-paulo-sociedade-anonima','uma-historia-de-amor-e-furia','lilian-m-relatorio-confidencial','mato-seco-em-chamas','os-primeiros-soldados','chuva-e-cantoria-na-aldeia-dos-mortos','lulina-e-a-lua','teca-e-tuti']
IC_SERIES=['o-diario-de-mika','gildo','crisalida','brinquedonautas']
def get(url,**kw):
    r=requests.get(url,timeout=12,headers={'User-Agent':'Mozilla/5.0 NovaIPTV Catalog'},**kw);r.raise_for_status();return r

def artwork(slug,url,hero=False):
    assert urlparse(url).scheme=='https'
    r=get(url); src=Image.open(io.BytesIO(r.content)).convert('RGB');
    # Preserve faces on landscape stills and keep imagery compact in the standalone preview.
    img=ImageOps.fit(src,(968,544) if hero else (448,252),Image.Resampling.LANCZOS,centering=(.5,.46));img.save(OUT/(slug+'.webp'),'WEBP',quality=84 if hero else 79,method=5)

def ic(kind,slug):
    url=f'{IC}/content/{kind}/{slug}'
    soup=BeautifulSoup(get(url).content,'html.parser'); data=None
    for el in soup.find_all('script'):
        t=el.get_text(); m=re.fullmatch(r'self\.__next_f\.push\((\[.*\])\)',t,re.S)
        if not m or 'initialData' not in t:continue
        decoded=json.loads(m[1])[1]; found=decoded.split('"initialData":',1)
        if len(found)==2:
            candidate=json.JSONDecoder().raw_decode(found[1])[0]
            if isinstance(candidate,dict) and candidate.get('slug')==slug:data=candidate;break
    assert data and data['type']==('Movie' if kind=='movies' else 'Serie'),'ficha indisponível'
    image=data['imageUrl']; art='free-'+slug; artwork(art,image,hero=slug=='carandiru-3')
    return dict(id=slug,type=kind,kind='website',name=data['title'],year=data['releaseDate'][:4],genre=data['genre'] if data['genre']!='Série' else ('Drama' if slug=='crisalida' else 'Animação'),description=data['synopsis'],source=url,provider='Itaú Cultural Play',collection='brasil',access='Grátis · cadastro gratuito no Itaú Cultural Play. A disponibilidade depende da região.',language='Português',duration=data['duration'] if str(data['duration']).endswith('min') else '',rating=(data.get('ageRating') or {}).get('label',''),credit=(data.get('directors') or 'Itaú Cultural Play'),art=art,artSource=image)

def safe(fn,arg):
    try:return fn(arg)
    except Exception as e:print('Título omitido:',arg[0] if isinstance(arg,tuple) else arg,str(e)[:210]);return None
if __name__=='__main__':
    path=ROOT/'catalogo-gratis.json'
    cur=json.loads(path.read_text())
    with ThreadPoolExecutor(max_workers=12) as pool:
        movies_br=list(pool.map(lambda x:safe(lambda a:ic('movies',a),x),IC_FILMS))
        series_br=list(pool.map(lambda x:safe(lambda a:ic('series',a),x),IC_SERIES))
    assert movies_br[0] and sum(x is not None for x in movies_br)>=10
    for key,rows in [('movies',movies_br),('series',series_br)]:
        cur[key]=[x for x in cur[key] if x.get('provider')!='Itaú Cultural Play']+[x for x in rows if x]
    path.write_text(json.dumps(cur,ensure_ascii=False,indent=2)+'\n')
