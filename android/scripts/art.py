from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
root=Path(__file__).resolve().parents[2]
out=root/'android/src/main/res/drawable-nodpi'
im=Image.open(root/'assets/app-icon-original.png').convert('RGBA')
im.thumbnail((246,246),Image.Resampling.LANCZOS)
icon=Image.new('RGBA',(256,256),(0,0,0,0));icon.alpha_composite(im,((256-im.width)//2,(256-im.height)//2));icon.save(out/'iptv_icon.png',optimize=True)
b=Image.new('RGB',(640,360),'#101211');icon.thumbnail((238,238),Image.Resampling.LANCZOS);b.paste(icon,((640-icon.width)//2,23),icon)
d=ImageDraw.Draw(b);f=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',47);d.text((320,304),'Nova IPTV',font=f,fill='#f3f4ee',anchor='mm');b.save(out/'iptv_banner.png',optimize=True)
