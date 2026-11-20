from pathlib import Path
from base64 import b64encode
from hashlib import sha256
import json
import sys

root = Path(__file__).resolve().parent
source = root.parent / 'catalogo.json'
raw = source.read_bytes()
if len(raw) > 12 * 1024 * 1024:
    raise ValueError('O catálogo deve ter no máximo 12 MiB')
catalog = json.loads(raw)
url = 'https://raw.githubusercontent.com/Pedro21062014/nova-os/refs/heads/nova-store-app/catalogo.json'

def asset(name, mime):
    return 'data:' + mime + ';base64,' + b64encode((root / 'assets' / name).read_bytes()).decode('ascii')

# Prevent data containing HTML-like text from ending the embedded script.
def literal(obj):
    return json.dumps(obj, ensure_ascii=True, separators=(',', ':')).replace('<', '\\u003c').replace('>', '\\u003e').replace('&', '\\u0026')

if len(sys.argv) > 1 and sys.argv[1] == '--links':
    print(json.dumps([{'url': p['url'], 'app': a['id'], 'abi': p['abi']} for a in catalog['apps'] for p in a['apks']]))
    sys.exit(0)

css = (root / 'store.css').read_text().replace('__HERO__', asset('hero.webp', 'image/webp')).replace('__FONT__', asset('manrope.woff2', 'font/woff2'))
js = (root / 'store.js').read_text().replace('/*FALLBACK_CATALOG*/null', literal(catalog)).replace('/*CATALOG_URL*/null', literal(url)).replace('/*CATALOG_DIGEST*/null', literal(sha256(raw).hexdigest()))
html = (root / 'page.html').read_text().replace('/*STYLE*/', css).replace('/*SCRIPT*/', js)
out = Path(sys.argv[1]) if len(sys.argv) > 1 else root / 'index.html'
out.write_text(html, encoding='utf-8')
print(out)
