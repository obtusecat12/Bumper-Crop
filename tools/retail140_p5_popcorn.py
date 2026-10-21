#!/usr/bin/env python3
"""V140 P5: glass-cabinet popcorn machine atlas.
Generated art, one large image per item (art-v140retail/p5/v140_*.png, 1408x768): popcorn heap (top-down), red
powder-coated steel, stainless kettle wall, striped popcorn box print, pinstripe paper bag, fingerprint / oil smudges on
glass. Header sign, control panel, lamp, caster rubber are composed here. Each cell = its own crop, blur + resize + 3-bit crush.
Packs 1024 x 512:
  pop140.webp     baseColor sRGB
  pop140_r.webp   G = roughness, B = metalness
  pop140_n.webp   tangent normal from luminance height
  pop140_e.webp   emission (sign backlight, warming lamp, pilot)
  pop140_g.webp   glass 512x512, 2x2 panes: R = transmission, G = roughness (smudges), B = 0
  pop140_gn.webp  glass normal (smear ridges)
and dist/retail140-popcorn-uv.js: UVP140 rects [u0,v0,u1,v1] (v up, inset 2 px against mip bleed), ASPP140 aspects.
Run from the project root: python3 bc/tools/retail140_p5_popcorn.py"""
import json, os
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ART = os.path.join(os.path.dirname(ROOT), 'art-v140retail', 'p5')
OUT = os.path.join(ROOT, 'dist', 'assets', 'l11-v140')
AW, AH = 1024, 512
FB = lambda s: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', s)
FR = lambda s: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', s)


def crush(im, size, bits=3):
    im = im.convert('RGB')
    im = im.filter(ImageFilter.GaussianBlur(max(0.0, im.width / size[0] * .3))).resize(size, Image.LANCZOS)
    a = np.asarray(im).astype(np.int32)
    a = (a >> bits << bits) + (1 << bits >> 1)
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


def art(n):
    return Image.open(os.path.join(ART, f'v140_{n}.png')).convert('RGB')


def lum(im):
    return np.asarray(im.convert('L')).astype(np.float32) / 255


def normal_from(h, k):
    gy, gx = np.gradient(h)
    n = np.stack([-gx * k, gy * k, np.ones_like(h)], -1)
    n /= np.linalg.norm(n, axis=-1, keepdims=True)
    return Image.fromarray(((n * .5 + .5) * 255).astype(np.uint8))


base = Image.new('RGB', (AW, AH), (60, 20, 20))
rgh = np.zeros((AH, AW, 3), np.uint8); rgh[..., 1] = 200
nrm = Image.new('RGB', (AW, AH), (128, 128, 255))
emi = Image.new('RGB', (AW, AH), (0, 0, 0))
UV, ASP = {}, {}
IN = 2  # px inset of every uv rect


def put(name, im, x, y, rough, metal=0, nk=2.0, hgt=None, e=None):
    w, h = im.size
    base.paste(im, (x, y))
    r = rough if isinstance(rough, np.ndarray) else np.full((h, w), rough, np.float32)
    rgh[y:y + h, x:x + w, 1] = np.clip(r * 255, 0, 255).astype(np.uint8)
    rgh[y:y + h, x:x + w, 2] = (metal if isinstance(metal, np.ndarray) else np.full((h, w), metal)) * 255
    nrm.paste(normal_from(lum(im) if hgt is None else hgt, nk), (x, y))
    if e is not None: emi.paste(e, (x, y))
    UV[name] = [round((x + IN) / AW, 5), round(1 - (y + h - IN) / AH, 5), round((x + w - IN) / AW, 5), round(1 - (y + IN) / AH, 5)]
    ASP[name] = round(w / h, 4)


# ---- popcorn heap: one 512x256 cell (mound surface + per-kernel crops) ----
pile = crush(art('pile').crop((0, 0, 1408, 704)), (512, 256))
l = lum(pile); put('pile', pile, 0, 0, np.clip(.75 - .3 * l, .35, .8), 0, 4.0)
# ---- red enamel steel: four different crops (cart sides / front, machine base, roof) ----
rp = art('redpaint')
for nm, (cx, cy, cw, ch), pos in [('redA', (60, 40, 620, 310), (0, 256)), ('redB', (700, 60, 620, 310), (256, 256)),
                                  ('redC', (40, 400, 640, 320), (0, 384)), ('redD', (720, 420, 640, 320), (256, 384))]:
    c = crush(rp.crop((cx, cy, cx + cw, cy + ch)), (256, 128)); a = np.asarray(c).astype(np.float32) / 255
    bare = np.clip((a.min(-1) - .42) * 4, 0, 1)                       # chipped to bare steel = metal, rougher
    put(nm, c, *pos, np.clip(.32 + .35 * bare, .2, .7), bare, 2.2)
# ---- stainless kettle: wall (stained) + lid / clean chrome crops ----
kt = art('kettle')
c = crush(kt.crop((100, 120, 1300, 720)), (256, 128)); put('kettle', c, 512, 0, np.clip(.25 + .4 * (.6 - lum(c)), .15, .65), 1, 2.0)
c = crush(kt.crop((60, 0, 700, 300)), (256, 128)); put('lid', c, 768, 0, np.clip(.22 + .3 * (.6 - lum(c)), .12, .55), 1, 1.6)
c = crush(kt.crop((1150, 20, 1400, 150)), (128, 48)); put('chrome', c, 512, 464, .18, 1, 1.2)
# ---- header sign (fictional brand), backlit ----
def card(w, h, draw, bg=(245, 236, 210)):
    im = Image.new('RGB', (w * 2, h * 2), bg); d = ImageDraw.Draw(im); draw(d, w * 2, h * 2)
    return crush(im, (w, h))


def sign(d, W, H):
    d.rectangle((0, 0, W, H), fill=(190, 22, 20))
    for k in range(0, W, 28): d.ellipse((k + 4, 6, k + 20, 22), fill=(255, 228, 120)); d.ellipse((k + 4, H - 22, k + 20, H - 6), fill=(255, 228, 120))
    d.text((W * .06, H * .22), 'KERNEL KING', font=FB(int(H * .42)), fill=(255, 220, 40), stroke_width=4, stroke_fill=(60, 10, 8))
    d.text((W * .66, H * .3), 'HOT · FRESH', font=FB(int(H * .2)), fill=(255, 250, 235))
    d.text((W * .66, H * .56), 'Palomitas', font=FR(int(H * .18)), fill=(255, 250, 235))


s = card(512, 96, sign); a = np.asarray(s).astype(np.float32) / 255
e = np.clip(a * 1.1 - .15, 0, 1) * np.where(a[..., 0:1] > .6, 1, .35)
put('sign', s, 512, 128, .4, 0, 1.0, e=Image.fromarray((e * 255).astype(np.uint8)))


def panel(d, W, H):
    d.rectangle((0, 0, W, H), fill=(26, 26, 28))
    for i, t in enumerate(['HEAT', 'LIGHT', 'MOTOR', 'WARM']):
        x = W * (.04 + i * .24); d.rectangle((x, H * .18, x + W * .07, H * .62), fill=(200, 30, 20) if i < 3 else (40, 40, 40), outline=(90, 90, 90), width=3)
        d.text((x, H * .7), t, font=FR(int(H * .17)), fill=(220, 220, 210))
    d.ellipse((W * .9, H * .2, W * .97, H * .55), fill=(255, 160, 30))


pn = card(256, 64, panel)
pe = Image.new('RGB', (256, 64)); dd = ImageDraw.Draw(pe); dd.ellipse((231, 6, 248, 22), fill=(255, 150, 30)); pe = pe.filter(ImageFilter.GaussianBlur(2))
put('panel', pn, 512, 224, .45, 0, 1.2, e=pe)
lp = Image.new('RGB', (64, 64))
for k in range(32, 0, -1): ImageDraw.Draw(lp).ellipse((32 - k, 32 - k * .45, 32 + k, 32 + k * .45), fill=(int(255 - k * 2), int(230 - k * 3.5), int(150 - k * 4)))
put('lamp', lp, 768, 224, .2, 0, .5, e=lp.point(lambda v: min(255, int(v * 1.1))))
rb = card(64, 64, lambda d, W, H: (d.rectangle((0, 0, W, H), fill=(22, 22, 22)), d.ellipse((W * .3, H * .3, W * .7, H * .7), fill=(120, 120, 120))), bg=(22, 22, 22))
put('rubber', rb, 832, 224, .85, 0, 1.0)
# ---- popcorn box print: front (badge) / back (badge, other crop) / side (stripes only) ----
bx = art('box').crop((45, 15, 1365, 755))
put('boxF', crush(bx.crop((330, 0, 1000, 740)), (128, 176)), 512, 288, .7, 0, 1.4)
put('boxB', crush(bx.crop((300, 30, 1030, 740)), (128, 176)), 896, 288, .72, 0, 1.4)
put('boxS', crush(bx.crop((0, 0, 360, 740)), (96, 176)), 640, 288, .72, 0, 1.4)
# ---- paper bag (glassine, grease spots darker = shinier) ----
bg = art('bag').crop((70, 40, 1350, 740))
c = crush(bg, (160, 200)); a = lum(c); put('bag', c, 736, 288, np.clip(.55 + .6 * (a - .8), .25, .75), 0, 1.2)
c = crush(bg.crop((0, 400, 300, 700)), (160, 24)); put('bagEdge', c, 736, 488, .7, 0, 1.0)
c = crush(art('pile').crop((600, 300, 1000, 500)), (96, 48)); put('pileB', c, 640, 464, .7, 0, 3.0)

# ---- glass: 2x2 panes 256x256 each from different crops of the smudge photo ----
sm = art('smudge'); G = np.zeros((512, 512, 3), np.uint8); GN = Image.new('RGB', (512, 512))
for i, (cx, cy) in enumerate([(40, 60), (700, 300), (300, 380), (980, 40)]):
    c = crush(sm.crop((cx, cy, cx + 420, cy + 420)), (256, 256), 2); s = lum(c)
    s = np.clip(s * (.55 if i == 0 else .75), 0, 1)                 # hand print pane = dimmer
    x, y = (i % 2) * 256, (i // 2) * 256
    G[y:y + 256, x:x + 256, 0] = np.clip((1 - .35 * s) * 255, 0, 255)  # transmission
    G[y:y + 256, x:x + 256, 1] = np.clip((.04 + .6 * s) * 255, 0, 255)  # roughness
    GN.paste(normal_from(np.asarray(Image.fromarray((s * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.5))).astype(np.float32) / 255, 1.2), (x, y))

os.makedirs(OUT, exist_ok=True)
base.save(os.path.join(OUT, 'pop140.webp'), quality=90)
Image.fromarray(rgh).save(os.path.join(OUT, 'pop140_r.webp'), lossless=True)
nrm.save(os.path.join(OUT, 'pop140_n.webp'), lossless=True)
emi.save(os.path.join(OUT, 'pop140_e.webp'), quality=92)
Image.fromarray(G).save(os.path.join(OUT, 'pop140_g.webp'), lossless=True)
GN.save(os.path.join(OUT, 'pop140_gn.webp'), lossless=True)
with open(os.path.join(ROOT, 'dist', 'retail140-popcorn-uv.js'), 'w') as f:
    f.write('// generated by bc/tools/retail140_p5_popcorn.py\n')
    f.write('export const UVP140=' + json.dumps(UV) + ';\n')
    f.write('export const ASPP140=' + json.dumps(ASP) + ';\n')
print('ok', list(UV))
