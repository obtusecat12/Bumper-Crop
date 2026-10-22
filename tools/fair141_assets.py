#!/usr/bin/env python3
"""V141 F5a: SoHo street-fair stall props atlas + tiling canvas / gingham.
Generated art, one large image per item (art-v141fair/f141_*.png, 1408x768): grilled skewer meat, sausage casing, bamboo
steamer wall, bao bun top, crepe, fries heap, orchard crate slats, white tent canopy fabric, gingham oilcloth, charcoal
embers. Can / bottle labels, paper fry cone, cooler plastic, propane paint, brushed steel, condiment plastic are composed
here at 4x size. Every cell is downscaled from its own large image (blur + resize + 3-bit crush).
Packs into bc/dist/assets/l11-v141f/:
  fair141.webp      1024x1024 baseColor sRGB, 4x4 cells of 256 (cell rects -> dist/fair141-uv.js FAIRUV141)
  fair141_r.webp    G = roughness, B = metalness
  fair141_n.webp    tangent normal from luminance height
  fair141_e.webp    emission (glowing embers only)
  canvas141.webp / canvas141-n.webp   512 tiling tent fabric (white, tinted per stall by material colour)
  ging141.webp / ging141-n.webp       512 tiling oilcloth (red gingham; blue variant ging141b.webp)
Run from the project root: python3 bc/tools/fair141_assets.py"""
import json, os
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ART = os.path.join(os.path.dirname(ROOT), 'art-v141fair')
OUT = os.path.join(ROOT, 'dist', 'assets', 'l11-v141f')
os.makedirs(OUT, exist_ok=True)
FB = lambda s: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', s)
FS = lambda s: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf', s)
C = 256; N = 4; AW = C * N
rng = np.random.default_rng(141)


def crush(im, size, bits=3):
    im = im.convert('RGB')
    im = im.filter(ImageFilter.GaussianBlur(max(0.0, im.width / size[0] * .3))).resize(size, Image.LANCZOS)
    a = np.asarray(im).astype(np.int32)
    a = (a >> bits << bits) + (1 << bits >> 1)
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


def art(n):
    return Image.open(os.path.join(ART, f'f141_{n}.png')).convert('RGB')


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


base = Image.new('RGB', (AW, AW), (60, 60, 60))
rgh = np.zeros((AW, AW, 3), np.uint8); rgh[..., 1] = 200
nrm = Image.new('RGB', (AW, AW), (128, 128, 255))
emi = Image.new('RGB', (AW, AW), (0, 0, 0))
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
    UV[name] = [round(x / AW + e_, 5), round(1 - (y + C) / AW + e_, 5), round((x + C) / AW - e_, 5), round(1 - y / AW - e_, 5)]


# --- generated food / material art ---
put('meat', 0, sq(art('meat'), .5, .5, .9), .55, nk=3)
put('sausage', 1, sq(art('sausage'), .55, .5, .95), .45, nk=2.5)
put('bamboo', 2, sq(art('bamboo'), .5, .5), .8, nk=3)
put('bao', 3, sq(art('bao'), .5, .5, 1), .85, nk=1.5)
put('crepe', 4, sq(art('crepe'), .62, .5, .9), .7, nk=1.5)
put('fries', 5, sq(art('fries'), .5, .5), .7, nk=3)
put('crate', 6, sq(art('crate'), .55, .5, 1), .85, nk=2.5)
cr = art('crate'); put('slat', 7, cr.crop((0, 0, 360, 768)).resize((768, 768)), .88, nk=2.5)
co = sq(art('coals'), .5, .5)
cl = np.asarray(co).astype(np.float32); glow = np.clip((cl[..., 0] - cl[..., 2] - 40) / 120, 0, 1)
ge = Image.fromarray((cl * glow[..., None] * 1.2).clip(0, 255).astype(np.uint8))
put('coals', 8, co, .95, nk=4, e=ge)

# --- composed at 1024 (4x the cell) ---
B = 1024


def brushed():
    a = rng.normal(150, 10, (B, 1)).repeat(B, 1) + rng.normal(0, 6, (B, B))
    a = np.asarray(Image.fromarray(a.clip(0, 255).astype(np.uint8)).filter(ImageFilter.BoxBlur(1))).astype(np.float32)
    im = np.stack([a * .97, a, a * 1.03], -1)
    return Image.fromarray(im.clip(0, 255).astype(np.uint8))


put('steel', 9, brushed(), .4, metal=.5, nk=.8)

CANS = [('KOLAA', (176, 22, 30), (255, 255, 255), 'classic cola'), ('SUNNFIZZ', (238, 128, 20), (255, 240, 200), 'orange soda'),
        ('LIMÓN VIVO', (70, 160, 60), (250, 250, 220), 'lima-limón'), ('ROOT & CO.', (70, 40, 26), (240, 210, 150), 'root beer')]


def labels(items, wrap):
    im = Image.new('RGB', (B, B)); d = ImageDraw.Draw(im); h = B // len(items)
    for i, (t, bg, fg, sub) in enumerate(items):
        y = i * h; d.rectangle((0, y, B, y + h), fill=bg)
        if wrap:  # can: top/bottom metallic bands are modelled separately; stripe + big name
            d.rectangle((0, y + h * .72, B, y + h * .8), fill=fg)
        else:
            d.rectangle((0, y + 8, B, y + 18), fill=fg); d.rectangle((0, y + h - 18, B, y + h - 8), fill=fg)
        for k in range(2):  # the name twice round the can / bottle so the front always shows one
            x0 = k * B // 2 + 30
            d.text((x0, y + h * .18), t, font=FB(int(h * .23)), fill=fg)
            d.text((x0 + 4, y + h * .58), sub, font=FB(int(h * .09)), fill=fg)
    return im


put('cans', 10, labels(CANS, True), .35, metal=.3, nk=.15)
BOT = [('AQUA LUMEN', (40, 120, 200), (255, 255, 255), 'spring water 500 ml'), ("MABEL'S", (250, 220, 70), (120, 60, 20), 'old-fashioned lemonade'),
       ('Hēilóng TEA', (20, 20, 22), (220, 190, 90), 'iced jasmine tea'), ('MANGÚ', (240, 150, 30), (40, 110, 50), 'mango nectar')]
put('bottles', 11, labels(BOT, False), .5, nk=.15)


def cone():
    im = Image.new('RGB', (B, B), (245, 240, 228)); d = ImageDraw.Draw(im)
    for x in range(-B, B * 2, 128): d.polygon([(x, 0), (x + 64, 0), (x + 64 - 300, B), (x - 300, B)], fill=(196, 34, 38))
    d.rectangle((0, B * .38, B, B * .62), fill=(245, 240, 228))
    d.text((70, B * .4), 'POMME ROYALE', font=FS(96), fill=(30, 40, 110)); d.text((260, B * .52), 'frites · est. 1992', font=FB(44), fill=(196, 34, 38))
    a = np.asarray(im).astype(np.float32) * (1 - rng.random((B, B, 1)) * .06)
    return Image.fromarray(a.clip(0, 255).astype(np.uint8))


put('cone', 12, cone(), .9, nk=.25)


def cooler():
    im = Image.new('RGB', (B, B)); d = ImageDraw.Draw(im)
    d.rectangle((0, 0, B // 2, B), fill=(36, 92, 168))  # body: blue moulded plastic with horizontal ribs
    for y in range(40, B, 90): d.rectangle((0, y, B // 2, y + 22), fill=(28, 74, 140))
    d.rectangle((B // 2, 0, B, B), fill=(236, 236, 230))  # lid / handle: off-white
    for y in range(0, B, 160): d.rectangle((B // 2, y, B, y + 8), fill=(214, 214, 206))
    d.text((60, B * .45), 'FROSTKING', font=FB(70), fill=(236, 236, 230))
    a = np.asarray(im).astype(np.float32) * (1 - rng.random((B, B, 1)) * .05)
    return Image.fromarray(a.clip(0, 255).astype(np.uint8))


put('cooler', 13, cooler(), .55, nk=1.0)


def misc():
    """quadrants: wood (skewer sticks / chopping board) | propane tank paint | ketchup red | mustard yellow"""
    im = Image.new('RGB', (B, B)); d = ImageDraw.Draw(im); H = B // 2
    w = rng.normal(0, 1, (H, H)).cumsum(1); w = (w - w.min()) / (w.max() - w.min())
    g = 170 + 40 * np.sin(np.linspace(0, 40, H)[None, :] + w * 6)
    im.paste(Image.fromarray(np.stack([g, g * .78, g * .5], -1).clip(0, 255).astype(np.uint8)), (0, 0))
    d.rectangle((H, 0, B, H), fill=(228, 226, 216)); d.text((H + 40, H * .4), 'PROPANE', font=FB(64), fill=(180, 30, 30))
    d.text((H + 40, H * .62), 'BLUEFLAME 20 lb', font=FB(32), fill=(40, 40, 40))
    d.rectangle((0, H, H, B), fill=(196, 28, 24)); d.text((40, H + 200), 'KETCH', font=FB(64), fill=(255, 245, 220))
    d.rectangle((H, H, B, B), fill=(240, 196, 30)); d.text((H + 40, H + 200), 'MOSTAZA', font=FB(56), fill=(140, 40, 20))
    return im


put('misc', 14, misc(), np.concatenate([np.concatenate([np.full((128, 128), .8), np.full((128, 128), .5)], 1),
                                       np.full((128, 256), .3)], 0).astype(np.float32), nk=.8)


def plastic():
    """black plastic (crates, squeeze caps, cutting board rims) + white folding-table plastic halves"""
    a = np.zeros((B, B, 3), np.float32); a[:, :B // 2] = 34; a[:, B // 2:] = 222
    a += rng.normal(0, 4, (B, B, 1))
    return Image.fromarray(a.clip(0, 255).astype(np.uint8))


put('plastic', 15, plastic(), .6, nk=.4)

# --- write atlas ---
base.save(os.path.join(OUT, 'fair141.webp'), quality=92)
Image.fromarray(rgh).save(os.path.join(OUT, 'fair141_r.webp'), lossless=True)
nrm.save(os.path.join(OUT, 'fair141_n.webp'), quality=92)
emi.save(os.path.join(OUT, 'fair141_e.webp'), quality=90)

# --- tiling fabric ---
cv = tileable(sq(art('canvas'), .5, .5).resize((1024, 1024), Image.LANCZOS))
cv = Image.fromarray((np.asarray(cv).astype(np.float32) / np.asarray(cv).mean() * 228).clip(0, 255).astype(np.uint8))
cvs = crush(cv, (512, 512), 2); cvs.save(os.path.join(OUT, 'canvas141.webp'), quality=92)
normal_from(lum(cv.resize((512, 512), Image.LANCZOS)), 5).save(os.path.join(OUT, 'canvas141-n.webp'), quality=92)


def gingham(col, seed):
    g = np.full((1024, 1024, 3), 250, np.float32); k = 64
    xs = (np.arange(1024) // k) % 2; band = np.maximum(xs[None, :], xs[:, None]); both = xs[None, :] * xs[:, None]
    c = np.array(col, np.float32)
    g = np.where(band[..., None] == 1, 250 * .45 + c * .55, g); g = np.where(both[..., None] == 1, c, g)
    crease = lum(sq(art('gingham'), .5, .5).resize((1024, 1024), Image.LANCZOS))
    crease = np.asarray(tileable(Image.fromarray((crease * 255).astype(np.uint8)).convert('RGB')).convert('L')).astype(np.float32) / 255
    hp = crease - np.asarray(Image.fromarray((crease * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(24))).astype(np.float32) / 255
    g = g * (1 + hp[..., None] * 1.6)
    return Image.fromarray(g.clip(0, 255).astype(np.uint8)), hp


gr, hp = gingham((196, 30, 36), 1); crush(gr, (512, 512), 2).save(os.path.join(OUT, 'ging141.webp'), quality=92)
gb, _ = gingham((40, 80, 170), 2); crush(gb, (512, 512), 2).save(os.path.join(OUT, 'ging141b.webp'), quality=92)
normal_from(np.asarray(Image.fromarray(((hp + .5) * 255).clip(0, 255).astype(np.uint8)).resize((512, 512))).astype(np.float32) / 255, 4).save(
    os.path.join(OUT, 'ging141-n.webp'), quality=92)

with open(os.path.join(ROOT, 'dist', 'fair141-uv.js'), 'w') as o:
    o.write('// Generated by bc/tools/fair141_assets.py (V141 F5a): cell rects [u0,v0,u1,v1] (v up) in assets/l11-v141f/fair141*.webp\n')
    o.write('export const FAIRUV141=' + json.dumps(UV) + ';\n')
print(json.dumps(UV))
sheet = Image.new('RGB', (AW * 2, AW)); sheet.paste(base, (0, 0)); sheet.paste(nrm, (AW, 0)); sheet.save('/workspace/work/f141atlas.jpg')
