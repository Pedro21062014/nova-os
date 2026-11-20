#!/usr/bin/env python3
"""Build a data-only, versioned Nova IPTV catalog snapshot (no remote app code)."""
import base64, json, re, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]

def catalog_and_feature():
    catalog=json.loads((ROOT/'catalogo.json').read_text())
    extra=ROOT/'catalogo-gratis.json'
    if extra.exists():
        for group,rows in json.loads(extra.read_text()).items():
            ids={row['id'] for row in rows}
            catalog[group]=rows+[row for row in catalog[group] if row['id'] not in ids]
    for row in catalog['channels']:
        for key in ('stream','embed'):
            if not row.get(key):row.pop(key,None)
    feature=json.loads((ROOT/'destaque.json').read_text())
    assert any(x['id']==feature['id'] for x in catalog['movies']), 'O destaque precisa ser um filme presente no catálogo.'
    return catalog,feature

def image_url(path):
    return 'data:image/webp;base64,'+base64.b64encode(path.read_bytes()).decode('ascii')

def artwork(catalog):
    assets=ROOT/'assets'; allowed={row.get('art',row['id']) for key in ('channels','movies','series') for row in catalog[key]}
    media={path.stem:image_url(path) for directory in ('catalog','channels','free') for path in sorted((assets/directory).glob('*.webp')) if path.stem in allowed}
    return media

def playlist(catalog):
    lines=['#EXTM3U','#PLAYLIST:Nova IPTV | Catálogo aberto']; clean=lambda t: re.sub(r'[\r\n\"]+', ' ',str(t)).strip()
    def add(x,group,title=None):
        if not x.get('stream'):return
        if x.get('license') and x.get('credit'):
            lines.append('# '+' | '.join([clean(x['credit']),clean(x['license'])+' '+x['licenseUrl'],x['source']]))
        lines.extend(['#EXTINF:-1 tvg-id="'+x['id']+'" group-title="'+clean(group)+'",'+clean(title or x['name']),x['stream']])
    for ch in catalog['channels']:add(ch,'TV ao vivo')
    for movie in catalog['movies']:add(movie,'Filmes abertos')
    for show in catalog['series']:
        for e in show.get('episodes',[]):add(e,'Séries · '+show['name'],show['name']+' — E'+str(e['number']).zfill(2)+' · '+e['name'])
    return '\n'.join(lines)+'\n'

if __name__=='__main__':
    catalog,feature=catalog_and_feature()
    dest=Path(sys.argv[1]) if len(sys.argv)>1 else ROOT/'feed/catalogo-v1.json'
    dest.parent.mkdir(parents=True,exist_ok=True)
    raw=(json.dumps(dict(schema=1,featured=feature,catalog=catalog,media=artwork(catalog),playlist=playlist(catalog)),ensure_ascii=False,separators=(',',':'))+'\n').encode()
    assert len(raw)<4*1024*1024
    dest.write_bytes(raw); print(dest,len(raw),'bytes')
