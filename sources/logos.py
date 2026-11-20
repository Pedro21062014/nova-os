"""Fetch and embed the actual logos of the channels in this curated catalog."""
import csv,json
from concurrent.futures import ThreadPoolExecutor
from io import BytesIO
from pathlib import Path
import requests
from PIL import Image

ROOT=Path(__file__).resolve().parent.parent
INDEX='https://raw.githubusercontent.com/iptv-org/database/11c5d128d97a332799dae0c470901328bac2527c/data/logos.csv'
IDS=dict(zip('tv-brasil canal-gov tv-camara canal-educacao tv-cultura tve-rs tv-senado canal-saude tv-justica rede-minas tv-alerj'.split(),'TVBrasil CanalGov TVCamara CanalEducacao TVCultura TVERS TVSenado CanalSaude TVJustica RedeMinas TVALERJ'.split()))
PREFERRED={'catve':'https://catve.com/2022/assets/images/catve_azul.png','cultura-fast':'https://cdn.aws.eitvcloud.com/account351-i1438/channel/53/thumb_quadrada_-3-_pequeno-1723832301.png','canal-saude':'https://cdn.aws.eitvcloud.com/account351-i1495/portal-logo-1715282293.png','tve-rs':'https://www.tve.com.br/themes/padrao2019/images/logos/logo.png'}
IDS.update({'record-mt':'TVVilaReal','tv-aratu':'TVAratu','catve':'Catve','sbt-interior':'SBTInterior','tv-ufop':'TVUFOP','cultura-fast':'CulturaFast','tv-globo':'RedeGlobo','sbt':'SBTNacional','band':'Band','record':'Record','record-news':'RecordNews','redetv':'RedeTV','tv-gazeta':'TVGazeta','tv-aparecida':'TVAparecida','redevida':'RedeVida','cancao-nova':'TVCancaoNova','tve-bahia':'TVEBahia','tv-ceara':'TVCeara'})
def get(url):
 r=requests.get(url,headers={'User-Agent':'Mozilla/5.0 (compatible; NovaIPTV/2.1; channel logo curation)'},timeout=(4,8));r.raise_for_status();return r.content

def main():
 out=ROOT/'assets'/'channels';out.mkdir(exist_ok=True)
 table={r['channel']:r['url'] for r in csv.DictReader(get(INDEX).decode().splitlines()) if r['in_use']=='TRUE' and not r['feed']}
 def fetch(row):
  slug,name=row;url=table.get(name+'.br'); candidates=([PREFERRED[slug]] if slug in PREFERRED else [])+([url] if url else [])
  if url and '/thumb/' in url:candidates.append(url.rsplit('/',1)[0].replace('/thumb/','/'))
  for item in candidates:
   try:
    im=Image.open(BytesIO(get(item))).convert('RGBA');box=im.getchannel('A').getbbox();im=im.crop(box) if box else im;im.thumbnail((232,138),Image.Resampling.LANCZOS)
    im.save(out/(slug+'.webp'),lossless=True,method=6)
    return slug,item
   except Exception as e:last=e
  raise RuntimeError(slug) from last
 with ThreadPoolExecutor(8) as e: sources=dict(e.map(fetch,IDS.items()))
 (out/'sources.json').write_text(json.dumps({'index':INDEX,'logos':sources},indent=2)+'\n');print(f'{len(sources)} logos prontos')
if __name__=='__main__':main()
