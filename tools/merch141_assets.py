#!/usr/bin/env python3
"""V141 F5b: SoHo street-fair MERCH stall atlas + booth planks + d3 striped awning.
Generated art, one large image per item (art-v141merch/m141_*.png, 1408x768): tote canvas print, tan leather, rattan weave,
denim, cable knit, 70s floral rayon, buffalo-check flannel, paisley silk scarf, PVC sandbag with strap, painted pine planks,
walnut. Composed here at 4x: printed tees, honey-jar labels, warm bulb glass (emissive), hanger metal/plastic, solid totes,
amber glass + lids. Every cell is downscaled from its own large image (blur + resize + 3-bit crush).
Packs into bc/dist/assets/l11-v141f/:
  merch141{,_r,_n,_e}.webp   1024x1536 4x6 cells (rects -> dist/merch141-uv.js MERCHUV141): base / G rough B metal / normal / emission
  plank141(-n).webp         512 tiling booth planks (fairWood, 1.2 m tile)
  awnstr141(-n).webp        512 striped cream canvas for d3's awnings (u = 1.2 m run, v .25..1 slope, 0..25 valance)
Run from the project root: python3 bc/tools/merch141_assets.py"""
import json, os
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ART = os.path.join(os.path.dirname(ROOT), 'art-v141merch')
OUT = os.path.join(ROOT, 'dist', 'assets', 'l11-v141f')
os.makedirs(OUT, exist_ok=True)
FB = lambda s: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', s)
FS = lambda s: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf', s)
C = 256; N = 4; AW = C * N; NR = 6; AH = C * NR
rng = np.random.default_rng(1415)


def crush(im, size, bits=3):
    im = im.convert('RGB')
    im = im.filter(ImageFilter.GaussianBlur(max(0.0, im.width / size[0] * .3))).resize(size, Image.LANCZOS)
    a = np.asarray(im).astype(np.int32)
    a = (a >> bits << bits) + (1 << bits >> 1)
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


def art(n):
    return Image.open(os.path.join(ART, f'm141_{n}.png')).convert('RGB')


def sq(im, cx=.5, cy=.5, f=1.0):
    s = int(min(im.size) * f); x = int(im.width * cx - s / 2); y = int(im.height * cy - s / 2)
    x = max(0, min(im.width - s, x)); y = max(0, min(im.height - s, y))
    return im.crop((x, y, x + s, y + s))


def lum(im):
    return np.asarray(im.convert('L')).astype(np.float32) / 255


def normal_from(h, k):
    gy, gx = np.gradient(h)
    n = np.stack([-gx * k, gy * k, np.ones_like(h)], -1)
    n /= np.linalg.norm(n, axis=-1, keepdims=True)
    return Image.fromarray(((n * .5 + .5) * 255).astype(np.uint8))


def tileable(im):
    """cross-fade the image with its half-rolled copy so it wraps (used for fabric only)."""
    a = np.asarray(im).astype(np.float32); h, w = a.shape[:2]
    r = np.roll(np.roll(a, h // 2, 0), w // 2, 1)
    y = np.abs(np.linspace(-1, 1, h))[:, None]; x = np.abs(np.linspace(-1, 1, w))[None, :]
    m = np.clip(np.maximum(x, y) * 1.6 - .6, 0, 1)[..., None]
    return Image.fromarray((a * (1 - m) + r * m).astype(np.uint8))


base = Image.new('RGB', (AW, AH), (60, 60, 60))
rgh = np.zeros((AH, AW, 3), np.uint8); rgh[..., 1] = 200
nrm = Image.new('RGB', (AW, AH), (128, 128, 255))
emi = Image.new('RGB', (AW, AH), (0, 0, 0))
UV = {}


def put(name, cell, big, rough, metal=0., nk=2.0, e=None):
    x, y = (cell % N) * C, (cell // N) * C
    im = crush(big, (C, C))
    base.paste(im, (x, y))
    r = rough if isinstance(rough, np.ndarray) else np.full((C, C), rough, np.float32)
    rgh[y:y + C, x:x + C, 1] = np.clip(r * 255, 0, 255).astype(np.uint8)
    rgh[y:y + C, x:x + C, 2] = int(metal * 255)
    h = lum(big.resize((C, C), Image.LANCZOS).filter(ImageFilter.GaussianBlur(.6)))
    nrm.paste(normal_from(h, nk), (x, y))
    if e is not None: emi.paste(crush(e, (C, C)), (x, y))
    e_ = .5 / AW
    f_ = .5 / AH
    UV[name] = [round(x / AW + e_, 5), round(1 - (y + C) / AH + f_, 5), round((x + C) / AW - e_, 5), round(1 - y / AH - f_, 5)]



# --- generated art ---
put('tote', 0, sq(art('tote'), .5, .5, 1), .9, nk=1.2)
put('leather', 1, sq(art('leather'), .5, .55), .5, nk=2.5)
put('straw', 2, sq(art('straw'), .5, .5), .85, nk=3.5)
put('denim', 3, sq(art('denim'), .5, .5), .9, nk=2)
put('knit', 4, sq(art('knit'), .35, .5), .95, nk=4)
put('floral', 5, sq(art('floral'), .5, .5), .6, nk=.6)
put('flannel', 6, sq(art('flannel'), .5, .5), .95, nk=1.2)
sc = art('scarf'); put('scarf', 7, sc.crop((40, 20, sc.width - 40, sc.height - 20)).resize((1024, 1024), Image.LANCZOS), .45, nk=.5)
put('sandbag', 8, sq(art('sandbag'), .5, .5), .7, nk=3)
put('walnut', 9, sq(art('walnut'), .5, .5, .55), .45, nk=1.5)
B = 1024
def grain(a, f=.04):
    return Image.fromarray((np.asarray(a).astype(np.float32) * (1 - rng.random((B, B, 1)) * f)).clip(0, 255).astype(np.uint8))
TEES = [((214, 210, 196), (40, 40, 44), 'BOWERY', 'ATHLETIC CLUB'), ((32, 62, 112), (238, 200, 60), 'NOLITA', 'est. 1979'),
        ((150, 30, 36), (245, 240, 228), 'CANAL', 'ST. MARKET'), ((60, 90, 60), (230, 230, 220), 'PRINCE', 'records & tapes')]
def tees():
    """quadrants: four tees, chest print in the upper middle (the shirt mesh maps its front onto one quadrant)"""
    im = Image.new('RGB', (B, B)); d = ImageDraw.Draw(im); H_ = B // 2
    for i, (bg, fg, t, s) in enumerate(TEES):
        x, y = (i % 2) * H_, (i // 2) * H_; d.rectangle((x, y, x + H_, y + H_), fill=bg)
        d.ellipse((x + H_ * .32, y + H_ * .22, x + H_ * .68, y + H_ * .52), outline=fg, width=10)
        d.text((x + H_ * .2, y + H_ * .55), t, font=FB(64), fill=fg); d.text((x + H_ * .26, y + H_ * .7), s, font=FB(30), fill=fg)
    return grain(im, .08)
put('tees', 10, tees(), .95, nk=.4)
JARS = [('HENNA PASTE', 'natural · 25 g'), ('JAGUA GEL', 'blue-black · 20 g'), ('EUCALYPTUS', 'oil · 10 ml'), ('LEMON SUGAR', 'sealant · 30 ml')]
def jars():
    """dark henna-brown glass with a cream label band (v .35-.7) — four label variants in rows"""
    im = Image.new('RGB', (B, B)); d = ImageDraw.Draw(im); h = B // 4
    for i, (t, s) in enumerate(JARS):
        y = i * h; d.rectangle((0, y, B, y + h), fill=(92, 52, 28))
        for k in range(0, B, 7): d.line((k, y, k, y + h), fill=(104 - (k * 7) % 24, 60, 30))
        d.rectangle((0, y + h * .3, B, y + h * .65), fill=(240, 228, 196))
        for k in range(2):
            d.text((k * B // 2 + 30, y + h * .33), t, font=FS(int(h * .13)), fill=(90, 50, 20)); d.text((k * B // 2 + 60, y + h * .5), s, font=FB(int(h * .09)), fill=(140, 80, 30))
    return grain(im)
put('jars', 11, jars(), np.tile(np.r_[np.full(77, .2), np.full(90, .8), np.full(89, .2)][::-1][:, None], (1, 256)).astype(np.float32), nk=.2)
def bulb():
    yy, xx = np.mgrid[0:B, 0:B] / B; r = np.hypot(xx - .5, yy - .55)
    a = np.stack([255 - r * 120, 214 - r * 200, 130 - r * 220], -1); a[yy < .22] = (60, 58, 52)  # top 22 % = black socket
    return Image.fromarray(a.clip(0, 255).astype(np.uint8))
bl = bulb(); be = np.asarray(bl).astype(np.float32); be[:int(B * .22)] = 0
put('bulb', 12, bl, .2, nk=.1, e=Image.fromarray((be * .9).astype(np.uint8)))
def metal():
    """quadrants: chrome tube | black wire / cable | natural wood hanger | white plastic hanger"""
    im = Image.new('RGB', (B, B)); H_ = B // 2
    a = rng.normal(190, 12, (H_, 1)).repeat(H_, 1) + rng.normal(0, 5, (H_, H_)); im.paste(Image.fromarray(np.stack([a, a, a * 1.02], -1).clip(0, 255).astype(np.uint8)), (0, 0))
    im.paste(Image.fromarray(rng.normal(30, 4, (H_, H_, 3)).clip(0, 255).astype(np.uint8)), (H_, 0))
    w = rng.normal(0, 1, (H_, H_)).cumsum(0); w = (w - w.min()) / (w.max() - w.min()); g = 180 + 30 * np.sin(np.linspace(0, 30, H_)[:, None] + w * 5)
    im.paste(Image.fromarray(np.stack([g, g * .8, g * .55], -1).clip(0, 255).astype(np.uint8)), (0, H_))
    im.paste(Image.fromarray(rng.normal(232, 3, (H_, H_, 3)).clip(0, 255).astype(np.uint8)), (H_, H_))
    return im
r13 = np.ones((256, 256), np.float32); r13[:128, :128] = .25; r13[:128, 128:] = .6; r13[128:, :128] = .7; r13[128:, 128:] = .5
put('metal', 13, metal(), r13, metal=0, nk=.3)
TOTES = [((30, 60, 40), (240, 230, 200), 'GREEN MARKET'), ((236, 228, 206), (30, 40, 110), 'MOTT ST BOOKS'), ((200, 150, 40), (40, 30, 20), 'Le Petit Pain'), ((28, 28, 30), (230, 80, 60), 'WKRT 88.3 FM')]
def totes():
    im = Image.new('RGB', (B, B)); d = ImageDraw.Draw(im); H_ = B // 2
    cv = np.asarray(sq(art('tote'), .1, .1, .3).resize((H_, H_)).convert('L')).astype(np.float32) / 255
    for i, (bg, fg, t) in enumerate(TOTES):
        x, y = (i % 2) * H_, (i // 2) * H_; t_ = np.array(bg, np.float32)[None, None] * (.75 + .5 * (cv[..., None] - cv.mean()))
        im.paste(Image.fromarray(t_.clip(0, 255).astype(np.uint8)), (x, y)); d.text((x + 40, y + H_ * .44), t, font=FB(52 if len(t) < 13 else 44), fill=fg)
    return im
put('totes', 14, totes(), .9, nk=1)
def glass():
    """left: clear jar glass (candles: cream wax) | right: gold screw lids"""
    im = Image.new('RGB', (B, B)); d = ImageDraw.Draw(im)
    d.rectangle((0, 0, B // 2, B), fill=(236, 226, 200)); d.rectangle((0, int(B * .2), B // 2, int(B * .26)), fill=(180, 170, 150))
    for y in range(0, B, 24): d.rectangle((B // 2, y, B, y + 12), fill=(200, 160, 60)); d.rectangle((B // 2, y + 12, B, y + 24), fill=(170, 130, 40))
    return grain(im)
r15 = np.ones((256, 256), np.float32); r15[:, :128] = .6; r15[:, 128:] = .3
put('glass', 15, glass(), r15, nk=.6)

# --- V141 F5b (sign-matched stalls): kettle corn, sunglasses, tube socks, pashmina, henna ---
pc = art('popcorn'); put('popcorn', 16, sq(pc, .5, .5), .7, nk=3.5)
def popbag():
    """clear bag of kettle corn: popcorn through the film + a round POPSY'S sticker (centre) + a white film sheen stripe"""
    im = sq(pc, .3, .5, .8).resize((B, B), Image.LANCZOS); d = ImageDraw.Draw(im)
    d.ellipse((B * .22, B * .3, B * .78, B * .74), fill=(176, 20, 30), outline=(250, 220, 60), width=14)
    d.text((B * .3, B * .4), "POPSY'S", font=FB(84), fill=(250, 220, 60)); d.text((B * .3, B * .53), 'KETTLE CORN', font=FB(44), fill=(255, 250, 240))
    d.text((B * .38, B * .62), '$6 · $10', font=FB(40), fill=(255, 250, 240))
    a = np.asarray(im).astype(np.float32); x = np.arange(B)[None, :, None]; a += 40 * np.exp(-((x - B * .12) / 30.) ** 2); a[:int(B * .08)] = (230, 230, 226)
    return Image.fromarray(a.clip(0, 255).astype(np.uint8))
put('popbag', 17, popbag(), .35, nk=1.5)
put('kettle', 18, sq(art('kettle'), .5, .5, .8), .45, metal=.6, nk=1.5)
def shades():
    """quadrants: glossy black acetate | tortoiseshell | smoke lens (grey-green fade) | mirrored lens (blue -> amber)"""
    im = Image.new('RGB', (B, B)); H_ = B // 2
    im.paste(Image.fromarray(rng.normal(22, 3, (H_, H_, 3)).clip(0, 255).astype(np.uint8)), (0, 0))
    n = np.asarray(Image.fromarray(rng.random((32, 32)) .__mul__(255).astype(np.uint8)).resize((H_, H_), Image.BICUBIC)).astype(np.float32) / 255
    t = np.stack([60 + 120 * n ** 2, 30 + 70 * n ** 2.2, 10 + 20 * n], -1); im.paste(Image.fromarray(t.clip(0, 255).astype(np.uint8)), (H_, 0))
    yy = np.linspace(0, 1, H_)[:, None, None].repeat(H_, 1)
    im.paste(Image.fromarray((np.array([30, 40, 34]) + yy * np.array([40, 50, 40])).clip(0, 255).astype(np.uint8)), (0, H_))
    im.paste(Image.fromarray((np.array([40, 110, 200]) * (1 - yy) + np.array([230, 150, 60]) * yy).clip(0, 255).astype(np.uint8)), (H_, H_))
    return im
r19 = np.ones((256, 256), np.float32); r19[:128] = .25; r19[128:] = .08
put('shades', 19, shades(), r19, nk=.2)
SOCKS = [((200, 30, 40), (30, 60, 150)), ((40, 120, 60), (240, 200, 40)), ((30, 40, 100), (200, 30, 40)), ((20, 20, 22), (200, 200, 196))]
def socks():
    """rows = 4 tube-sock variants (u along the sock, stripes near the cuff at u .08-.25); right quarter = Big Al's paper band"""
    a = np.full((B, B, 3), 238, np.float32); h = B // 4
    rib = (np.sin(np.arange(B)[:, None] / 3.2) * 10)[..., None]
    for i, (c1, c2) in enumerate(SOCKS):
        y = i * h
        for x0, x1, c in ((80, 120, c1), (140, 180, c2), (200, 240, c1)): a[y:y + h, x0:x1] = c
    a += rib + rng.normal(0, 3, (B, B, 1)); im = Image.fromarray(a.clip(0, 255).astype(np.uint8)); d = ImageDraw.Draw(im)
    d.rectangle((B * .75, 0, B, B), fill=(214, 190, 140))
    for i in range(4): y = i * h; d.text((B * .77, y + h * .2), "BIG AL'S", font=FB(40), fill=(150, 30, 30)); d.text((B * .77, y + h * .5), '3 PR $10', font=FB(36), fill=(30, 40, 110))
    return im
put('socks', 20, socks(), .95, nk=1.2)
put('henna', 21, art('henna').crop((0, 0, 1408, 768)).resize((1024, 1024), Image.LANCZOS), .5, nk=.3)
def pashmina():
    im = Image.new('RGB', (B, B)); H_ = B // 2; w = lum(sq(art('knit'), .8, .5).resize((H_, H_)))
    for i, c in enumerate([(130, 24, 44), (24, 110, 120), (210, 160, 40), (60, 62, 70)]):
        t = np.array(c, np.float32)[None, None] * (.8 + .4 * (w[..., None] - w.mean()) * .6); im.paste(Image.fromarray(t.clip(0, 255).astype(np.uint8)), ((i % 2) * H_, (i // 2) * H_))
    return im
put('pashmina', 22, pashmina(), .9, nk=1.2)
def board():
    """chalk price board for the henna stall"""
    im = Image.new('RGB', (B, B), (40, 44, 40)); d = ImageDraw.Draw(im)
    a = np.asarray(im).astype(np.float32) + rng.normal(0, 6, (B, B, 1)); im = Image.fromarray(a.clip(0, 255).astype(np.uint8)); d = ImageDraw.Draw(im)
    d.rectangle((0, 0, B - 1, B - 1), outline=(150, 100, 60), width=40)
    d.text((140, 110), 'HENNA', font=FS(150), fill=(240, 236, 220)); d.text((150, 300), 'by Priya', font=FB(70), fill=(240, 200, 120))
    for i, (t, p) in enumerate([('small', '$5'), ('medium', '$10'), ('full hand', '$20'), ('jagua', '+$5')]):
        d.text((150, 470 + i * 120), t, font=FB(70), fill=(236, 236, 228)); d.text((720, 470 + i * 120), p, font=FB(70), fill=(250, 210, 120))
    return im
put('board', 23, board(), .95, nk=.6)
# metalness: chrome quadrant of 'metal' (cell 13 = row 3 col 1: x 256..384, y 768..896) and the gold lids (cell 15 right half)
m18 = rgh[1024:1280, 512:768, 2].copy(); rgh[:, :, 2] = 0; rgh[768:896, 256:384, 2] = 230; rgh[768:1024, 896:1024, 2] = 200; rgh[1024:1280, 512:768, 2] = m18

base.save(os.path.join(OUT, 'merch141.webp'), quality=92)
Image.fromarray(rgh).save(os.path.join(OUT, 'merch141_r.webp'), lossless=True)
nrm.save(os.path.join(OUT, 'merch141_n.webp'), quality=92)
emi.save(os.path.join(OUT, 'merch141_e.webp'), quality=90)

# booth planks (vertical boards; tile 1.2 m) — crop to a whole number of boards so it wraps across
pl = art('planks'); pl = pl.crop((0, 0, pl.width, pl.height)).resize((1024, 1024), Image.LANCZOS)
pl = tileable(pl); crush(pl, (512, 512), 2).save(os.path.join(OUT, 'plank141.webp'), quality=92)
normal_from(lum(pl.resize((512, 512), Image.LANCZOS).filter(ImageFilter.GaussianBlur(.7))), 6).save(os.path.join(OUT, 'plank141-n.webp'), quality=92)

# d3 café awning: cream / taupe stripes (12 bands per 1.2 m) on the fair canvas weave; valance (v < .25) plain cream with a taupe edge
cvw = Image.open(os.path.join(os.path.dirname(ROOT), 'art-v141fair', 'f141_canvas.png')).convert('L')
cvw = np.asarray(tileable(sq(cvw.convert('RGB'), .5, .5).resize((1024, 1024))).convert('L')).astype(np.float32) / 255
x = np.arange(1024)[None, :].repeat(1024, 0); band = (x // (1024 // 12)) % 2
cream = np.array((238, 230, 214), np.float32); taupe = np.array((190, 172, 150), np.float32)
a = np.where(band[..., None] == 1, taupe, cream)
y = np.arange(1024)[:, None].repeat(1024, 1); val = y > 768
a = np.where(val[..., None], cream, a); a = np.where(((y > 990) & (y < 1006))[..., None], taupe, a)
a = a * (.85 + .3 * (cvw[..., None] - cvw.mean()))
aw = Image.fromarray(a.clip(0, 255).astype(np.uint8)); crush(aw, (512, 512), 2).save(os.path.join(OUT, 'awnstr141.webp'), quality=92)
normal_from(cvw[::2, ::2], 5).save(os.path.join(OUT, 'awnstr141-n.webp'), quality=92)

with open(os.path.join(ROOT, 'dist', 'merch141-uv.js'), 'w') as o:
    o.write('// Generated by bc/tools/merch141_assets.py (V141 F5b): cell rects [u0,v0,u1,v1] (v up) in assets/l11-v141f/merch141*.webp\n')
    o.write('export const MERCHUV141=' + json.dumps(UV) + ';\n')
print(json.dumps(UV))
sheet = Image.new('RGB', (AW * 2, AH)); sheet.paste(base, (0, 0)); sheet.paste(nrm, (AW, 0)); sheet.save('/workspace/work/m141atlas.jpg')
s2 = Image.new('RGB', (1024, 512)); s2.paste(Image.open(os.path.join(OUT, 'plank141.webp')), (0, 0)); s2.paste(Image.open(os.path.join(OUT, 'awnstr141.webp')), (512, 0)); s2.save('/workspace/work/m141tiles.jpg')
