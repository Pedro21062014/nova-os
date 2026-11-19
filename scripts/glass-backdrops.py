"""Create lightweight blurred wallpaper samples for WebViews without backdrop-filter.
Run with Pillow. The source photos and their credits are packaged with Nova OS.
"""
from pathlib import Path
from PIL import Image, ImageEnhance, ImageFilter, ImageOps

assets = Path(__file__).resolve().parents[1] / 'app/src/main/assets'
w, h = 640, 360
vertical = [(0, '#050a119f'), (.13, '#050a1126'), (.25, '#09101b05'), (.36, '#080d1528'), (.48, '#080d158f'), (.63, '#080d15e5'), (.77, '#080d15ff'), (1, '#080d15ff')]
horizontal = [(0, '#060a1259'), (.42, '#080d1522'), (.85, '#080d1500'), (1, '#080d1500')]

def line(stops, size):
    stops = [(pos, tuple(bytes.fromhex(rgba[1:]))) for pos, rgba in stops]
    result = []
    for i in range(size):
        pos = (i + .5) / size
        (a, ca), (b, cb) = next(((x, y) for x, y in zip(stops, stops[1:]) if x[0] <= pos <= y[0]))
        t = (pos - a) / (b - a)
        alpha = ca[3]*(1-t) + cb[3]*t
        rgb = tuple(round((ca[j]*ca[3]*(1-t)+cb[j]*cb[3]*t)/alpha) if alpha else 0 for j in range(3))
        result.append((*rgb, round(alpha)))
    return result

shade_x = Image.new('RGBA', (w, 1)); shade_x.putdata(line(horizontal, w)); shade_x = shade_x.resize((w, h))
shade_y = Image.new('RGBA', (1, h)); shade_y.putdata(line(vertical, h)); shade_y = shade_y.resize((w, h))
for name in ('dolomitas', 'braies', 'moraine', 'reine', 'aoraki'):
    source = assets / ('img' if name=='dolomitas' else 'wallpapers') / (name+'.webp')
    image = ImageOps.fit(Image.open(source).convert('RGBA'), (w, h), Image.Resampling.LANCZOS, centering=(.5, 0))
    image = Image.alpha_composite(Image.alpha_composite(image, shade_x), shade_y).convert('RGB')
    image = ImageEnhance.Color(image.filter(ImageFilter.GaussianBlur(11 * w / 1600))).enhance(1.48)
    image.save(assets/'wallpapers'/('glass-'+name+'.webp'), quality=80, method=6)
