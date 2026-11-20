#!/usr/bin/env python3
from pathlib import Path
import base64
import json
import sys
from sources.feed_data import catalog_and_feature, artwork, playlist
root=Path(__file__).resolve().parent
assets=root/'assets'
def url(path,mime):
    return f'data:{mime};base64,'+base64.b64encode(path.read_bytes()).decode('ascii')
catalog,featured=catalog_and_feature()
media=artwork(catalog)
media['logo']=url(assets/'logo.webp','image/webp')
def safe(data):
    return json.dumps(data,ensure_ascii=True,separators=(',',':')).replace('<','\\u003c')
css=(root/'ui/design.css').read_text().replace('__FONT__',url(assets/'manrope.woff2','font/woff2'))
js=(root/'ui/app.js').read_text().replace('/*MEDIA*/{}',safe(media)).replace('/*CATALOG*/{}',safe(catalog)).replace("/*PLAYLIST*/''",safe(playlist(catalog))).replace('/*FEATURED*/{}',safe(featured))
hls='/*\n'+(assets/'hls.LICENSE').read_text()+'*/\n'+(assets/'hls.light.min.js').read_text().split('//# sourceMappingURL=')[0]
html=(root/'ui/page.html').read_text().replace('/*CSS*/',css).replace('/*HLS*/',hls).replace('/*JS*/',js)
out=Path(sys.argv[1]) if len(sys.argv)>1 else root/'index.html'
out.write_text(html,encoding='utf-8')
if len(sys.argv)>2:
    Path(sys.argv[2]).write_text(playlist(catalog),encoding='utf-8')
print(f'{out}: {out.stat().st_size:,} bytes')
