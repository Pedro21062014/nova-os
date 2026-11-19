"""Generate static Manrope WOFF2 faces for WebViews without variable font support.
Requires Python fonttools and brotli. Based on the bundled SIL OFL Manrope font.
"""
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

assets = Path(__file__).resolve().parents[1] / 'app/src/main/assets'
(assets / 'fonts').mkdir(exist_ok=True)
for weight in (400, 600, 650, 700, 750, 800):
    font = instantiateVariableFont(TTFont(assets / 'manrope.woff2'), {'wght': weight}, updateFontNames=False)
    font['head'].modified = font['head'].created
    font.recalcTimestamp = False
    font.save(assets / 'fonts' / f'manrope-{weight}.woff2')
