from pathlib import Path
from base64 import b64encode, b64decode
from hashlib import sha256
import json
import sys

root = Path(__file__).resolve().parent
raw = (root.parent / 'catalogo.json').read_bytes()
if len(raw) > 12 * 1024 * 1024:
    raise ValueError('O catálogo deve ter no máximo 12 MiB')
catalog = json.loads(raw)
url = 'https://raw.githubusercontent.com/Pedro21062014/nova-os/refs/heads/nova-store-app/catalogo.json'

def asset(name, mime):
    return 'data:' + mime + ';base64,' + b64encode((root / 'assets' / name).read_bytes()).decode('ascii')

def literal(obj):
    return json.dumps(obj, ensure_ascii=True, separators=(',', ':')).replace('<', '\\u003c').replace('>', '\\u003e').replace('&', '\\u0026')

args=sys.argv[1:]
if args and args[0] == '--android':
    dest=Path(args[1]);dest.mkdir(parents=True,exist_ok=True)
    links=[]
    for a in catalog['apps']+catalog.get('officialApps',[]):
        path=dest/'local-media'/a['id'];path.mkdir(parents=True,exist_ok=True)
        images=[('logo',a['logo'])]+[(str(i),s) for i,s in enumerate(a['shots'])]
        for key,value in images:
            (path/(key+'.webp')).write_bytes(b64decode(value.split(',',1)[1],validate=True))
        a['logo']='/local-media/'+a['id']+'/logo.webp'
        a['shots']=['/local-media/'+a['id']+'/'+str(i)+'.webp' for i in range(len(a['shots']))]
        a.pop('mediaSources',None)
        for p in a['apks']:
            links.append(dict(p,app=a['id'],rolling=a.get('rolling',False)))
    (dest/'links.json').write_text(literal(links))
    out=dest/'index.html'
else:
    out=Path(args[0]) if args else root/'index.html'
css = (root / 'store.css').read_text().replace('__HERO__', asset('hero.webp', 'image/webp')).replace('__FONT__', asset('manrope.woff2', 'font/woff2'))
js = (root / 'store.js').read_text().replace('/*FALLBACK_CATALOG*/null', literal(catalog)).replace('/*CATALOG_URL*/null', literal(url)).replace('/*CATALOG_DIGEST*/null', literal(sha256(raw).hexdigest()))
html = (root / 'page.html').read_text().replace('/*STYLE*/', css).replace('/*SCRIPT*/', js)
out.write_text(html, encoding='utf-8')
print(out)
