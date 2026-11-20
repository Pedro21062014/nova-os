#!/usr/bin/env python3
from pathlib import Path
import base64
import json
import sys
root=Path(__file__).resolve().parent
assets=root/'assets'
def url(path,mime):
    return f'data:{mime};base64,'+base64.b64encode(path.read_bytes()).decode('ascii')
media={asset.stem:url(asset,'image/webp') for asset in [assets/'logo.webp',*sorted((assets/'catalog').glob('*.webp')),*sorted((assets/'channels').glob('*.webp')),*sorted((assets/'free').glob('*.webp'))]}
def safe(data):
    return json.dumps(data,ensure_ascii=True,separators=(',',':')).replace('<','\\u003c')
css=(root/'ui/design.css').read_text().replace('__FONT__',url(assets/'manrope.woff2','font/woff2'))
catalog=json.loads((root/'catalogo.json').read_text())
extra=root/'catalogo-gratis.json'
if extra.exists():
    for group,rows in json.loads(extra.read_text()).items():
        ids={row['id'] for row in rows}
        catalog[group]=rows+[row for row in catalog[group] if row['id'] not in ids]
js=(root/'ui/app.js').read_text().replace('/*MEDIA*/{}',safe(media)).replace('/*CATALOG*/{}',safe(catalog)).replace("/*PLAYLIST*/''",safe((root/'Nova-IPTV-lista.m3u').read_text()))
hls='/*\n'+(assets/'hls.LICENSE').read_text()+'*/\n'+(assets/'hls.light.min.js').read_text().split('//# sourceMappingURL=')[0]
html=(root/'ui/page.html').read_text().replace('/*CSS*/',css).replace('/*HLS*/',hls).replace('/*JS*/',js)
out=Path(sys.argv[1]) if len(sys.argv)>1 else root/'index.html'
out.write_text(html,encoding='utf-8')
print(f'{out}: {out.stat().st_size:,} bytes')
