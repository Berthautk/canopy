import sys, os, json
from PIL import Image, ImageDraw, ImageFont
src, boxes, out = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(out, exist_ok=True)
rep = json.load(open(boxes))
try: font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 34)
except Exception: font = ImageFont.load_default()
for f, bx in rep.items():
    im = Image.open(os.path.join(src, f)).convert("RGB"); d = ImageDraw.Draw(im)
    for i, (x0, y0, x1, y1) in enumerate(bx, 1):
        d.rectangle([x0, y0, x1, y1], outline=(255, 0, 0), width=4)
        d.rectangle([x0+4, y0+4, x0+62, y0+44], fill=(255, 0, 0))
        d.text((x0+8, y0+5), f"{i:02d}", fill="white", font=font)
    im.thumbnail((1200, 1200)); im.save(os.path.join(out, f[:9] + ".jpg"), quality=78)
