#!/usr/bin/env python3
from pathlib import Path
import argparse, base64, hashlib, io, json, re, subprocess
from PIL import Image
store=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--version',required=True);p.add_argument('--screenshots',type=Path,required=True);p.add_argument('--iptv',type=Path,required=True);p.add_argument('--apk',type=Path,required=True);p.add_argument('--apksigner',type=Path,required=True);a=p.parse_args()
def webp(path,size,lossless=False):
    im=Image.open(path).convert('RGBA' if lossless else 'RGB');im.thumbnail(size,Image.Resampling.LANCZOS)
    out=io.BytesIO();im.save(out,'WEBP',lossless=lossless,quality=84,method=6)
    return 'data:image/webp;base64,'+base64.b64encode(out.getvalue()).decode('ascii')
certs=subprocess.check_output([str(a.apksigner),'verify','--print-certs',str(a.apk)],text=True)
cert=re.search(r'Signer #1 certificate SHA-256 digest: ([a-f0-9]{64})',certs)[1]
assert re.fullmatch(r'[0-9]+\.[0-9]+\.[0-9]+',a.version), 'Versão inválida'
release='https://github.com/Pedro21062014/nova-os/releases/tag/nova-iptv-v'+a.version
filename='Nova-IPTV-'+a.version+'.apk'
app={'id':'nova-iptv','name':'Nova IPTV','cat':'live','price':'Grátis','tone':'#243b25','desc':'29 canais de TV ao vivo, 30 filmes e 26 séries, com busca, favoritos, filtro Infantis e exportação M3U. Encontre Turma da Mônica, Pocoyo, Bluey e outros desenhos em português. Parte do conteúdo abre no YouTube ou no Itaú Cultural Play. A reprodução exige internet; o Itaú Cultural Play pode pedir cadastro gratuito.','added':False,'wave':0,'rolling':False,'stage':'Catálogo ampliado','galleryNote':'Imagens da própria interface da Nova IPTV no formato de TV.',
    'logo':webp(a.iptv/'android/src/main/res/drawable-nodpi/iptv_icon.png',(192,192),True),
    'shots':[webp(a.screenshots/shot,(1100,620)) for shot in ['Nova-IPTV-previa-inicio.png','Nova-IPTV-previa-series.png']],
    'apks':[{'version':a.version,'abi':'universal','abis':[],'url':release.replace('/tag/','/download/')+'/'+filename,'source':release,'package':'br.com.novaos.iptv','minSdk':23,'sha256':hashlib.sha256(a.apk.read_bytes()).hexdigest(),'bytes':a.apk.stat().st_size,'cert':cert}]}
feature={'id':'nova-iptv','label':'NOVO PARA ANDROID TV','line':'Agora com mais desenhos em português: Turma da Mônica, Pocoyo, Bluey e outros. Use o filtro Infantis para encontrar as séries.','meta':['Grátis','Canais e mídia','Nova para TV'],'shot':1}
f=store/'catalogo.json';d=json.loads(f.read_text());previous=next(x for x in d['apps'] if x['id']=='nova-iptv');assert previous['apks'][0]['cert']==cert, 'A assinatura não permite atualizar a Nova IPTV anterior.';d['apps']=[app]+[x for x in d['apps'] if x['id']!=app['id']];d['featured']=[feature]+[x for x in d['featured'] if x['id']!=app['id']];d['wellKnown']=[app['id']]+[x for x in d['wellKnown'] if x!=app['id']];f.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
