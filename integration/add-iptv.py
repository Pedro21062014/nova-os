#!/usr/bin/env python3
from pathlib import Path
import argparse, base64, hashlib, io, json, re, subprocess
from PIL import Image
store=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--iptv',type=Path,required=True);p.add_argument('--apk',type=Path,required=True);p.add_argument('--apksigner',type=Path,required=True);a=p.parse_args()
def webp(path,size,lossless=False):
    im=Image.open(path).convert('RGBA' if lossless else 'RGB');im.thumbnail(size,Image.Resampling.LANCZOS)
    out=io.BytesIO();im.save(out,'WEBP',lossless=lossless,quality=84,method=6)
    return 'data:image/webp;base64,'+base64.b64encode(out.getvalue()).decode('ascii')
certs=subprocess.check_output([str(a.apksigner),'verify','--print-certs',str(a.apk)],text=True)
cert=re.search(r'Signer #1 certificate SHA-256 digest: ([a-f0-9]{64})',certs)[1]
release='https://github.com/Pedro21062014/nova-os/releases/tag/nova-iptv-v1.0.0'
app={'id':'nova-iptv','name':'Nova IPTV','cat':'live','price':'Grátis','tone':'#243b25','desc':'Canais de TV ao vivo, filmes e séries de licença aberta, com busca, favoritos e exportação M3U. Alguns canais tocam no app e os demais remetem às plataformas oficiais. A reprodução precisa de internet e depende da disponibilidade das emissoras.','added':False,'wave':0,'rolling':False,'stage':'Nova para TV','galleryNote':'Imagens da própria interface da Nova IPTV no formato de TV.',
    'logo':webp(a.iptv/'android/src/main/res/drawable-nodpi/iptv_icon.png',(192,192),True),
    'shots':[webp(a.iptv/'tests/media'/shot,(1100,620)) for shot in ['inicio.png','canais.png']],
    'apks':[{'version':'1.0.0','abi':'universal','abis':[],'url':release.replace('/tag/','/download/')+'/Nova-IPTV-1.0.0.apk','source':release,'package':'br.com.novaos.iptv','minSdk':23,'sha256':hashlib.sha256(a.apk.read_bytes()).hexdigest(),'bytes':a.apk.stat().st_size,'cert':cert}]}
feature={'id':'nova-iptv','label':'NOVO PARA ANDROID TV','line':'TV ao vivo, filmes e séries de licença aberta, com busca e favoritos para usar com o controle remoto.','meta':['Grátis','Canais e mídia','Nova para TV'],'shot':1}
f=store/'catalogo.json';d=json.loads(f.read_text());d['apps']=[app]+[x for x in d['apps'] if x['id']!=app['id']];d['featured']=[feature]+[x for x in d['featured'] if x['id']!=app['id']];d['wellKnown']=[app['id']]+[x for x in d['wellKnown'] if x!=app['id']];f.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
