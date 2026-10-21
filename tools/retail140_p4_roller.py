#!/usr/bin/env python3
"""V140 P4: convenience-store roller grill atlas.
Generated art, one large image per item (art-v140retail/p4/v140_*.png, 1408x768): grilled jumbo hot dog, rolled
taquito, brushed stainless sheet, red-hot heater element seen through the roller gap. Menu card, brand plate, knob and
pilot lamp are composed here. Every cell is downscaled from its own large image (blur + resize + 3-bit crush).
Packs 1024 x 512:
  roll140.webp     baseColor sRGB
  roll140_r.webp   G = roughness, B = metalness (steel 1, everything else 0)
  roll140_n.webp   tangent normal from luminance height (blistered casing, tortilla folds, brush lines, coil)
  roll140_e.webp   emission (sRGB): dull dark-orange heater coil glow, red pilot lamp; black elsewhere
and dist/retail140-roller-uv.js: UVR140 rects [u0,v0,u1,v1] (v up), ASPR140 aspects, PROFR140 radius profiles traced
from the food art (per column: s along the length, half thickness / length, centre offset / length, cell v of the lower and upper edge).
Run from the project root: python3 bc/tools/retail140_p4_roller.py"""
import json, os
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ART = os.path.join(os.path.dirname(ROOT), 'art-v140retail', 'p4')
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


base = Image.new('RGB', (AW, AH), (40, 40, 40))
rgh = np.zeros((AH, AW, 3), np.uint8); rgh[..., 1] = 200
nrm = Image.new('RGB', (AW, AH), (128, 128, 255))
emi = Image.new('RGB', (AW, AH), (0, 0, 0))
UV, ASP, PROF = {}, {}, {}


def put(name, im, x, y, rough, metal=0, nk=2.0, hgt=None, e=None):
    w, h = im.size
    base.paste(im, (x, y))
    r = rough if isinstance(rough, np.ndarray) else np.full((h, w), rough, np.float32)
    rgh[y:y + h, x:x + w, 1] = np.clip(r * 255, 0, 255).astype(np.uint8)
    rgh[y:y + h, x:x + w, 2] = int(metal * 255)
    nrm.paste(normal_from(lum(im) if hgt is None else hgt, nk), (x, y))
    if e is not None: emi.paste(e, (x, y))
    UV[name] = [round((x + .5) / AW, 5), round(1 - (y + h - .5) / AH, 5), round((x + w - .5) / AW, 5), round(1 - (y + .5) / AH, 5)]
    ASP[name] = round(w / h, 4)


# ---- food: crop to the piece, trace its thickness profile column by column ----
def food(name, x, y, w, h, rough):
    im = art(name); a = np.asarray(im).astype(np.float32)
    bg = np.median(np.concatenate([a[:20, :20].reshape(-1, 3), a[:20, -20:].reshape(-1, 3), a[-20:, :20].reshape(-1, 3), a[-20:, -20:].reshape(-1, 3)]), 0)
    m = np.abs(a - bg).max(-1) > 45   # differs clearly from the backdrop (estimated from the corners)
    m = np.asarray(Image.fromarray(m.astype(np.uint8) * 255).filter(ImageFilter.MedianFilter(9))) > 127
    ys, xs = np.nonzero(m); x0, x1 = xs.min(), xs.max()
    # body rows: ignore the thin shadow, use the tallest column run
    y0, y1 = np.percentile(ys, 2), np.percentile(ys, 98)
    crop = im.crop((x0, int(y0), x1 + 1, int(y1) + 1)); L = x1 - x0 + 1
    # backdrop -> the piece's own colour of that column, so mip levels never bleed white onto the casing
    ca = np.asarray(crop).astype(np.float32).copy(); cm = m[int(y0):int(y1) + 1, x0:x1 + 1]
    cm = cm & ~((ca.min(-1) > 105) & (ca.max(-1) - ca.min(-1) < 48))   # grey contact shadow / white edge line = backdrop too
    for cx in range(ca.shape[1]):
        k = cm[:, max(0, cx - 6):cx + 7].any(1) if cm[:, cx].sum() < 3 else cm[:, cx]
        col = ca[:, cx][k] if k.sum() else ca[cm][:]
        ca[~cm[:, cx], cx] = np.median(col, 0)
    crop = Image.fromarray(ca.astype(np.uint8))
    prof = []
    for k in range(25):
        s = k / 24; cx = int(x0 + min(L - 1, s * L))
        col = np.nonzero(cm[:, max(0, cx - x0 - 2):cx - x0 + 3].any(1))[0]   # refined mask (no contact shadow)
        if len(col) == 0: prof.append([round(s, 4), 0.0, 0.0, .5, .5]); continue
        tb, tt = col.min() / (y1 - y0), col.max() / (y1 - y0)
        prof.append([round(s, 4), round((tt - tb) / 2 * (y1 - y0) / L, 4), round(((tb + tt) / 2 - .5) * (y1 - y0) / L, 4), round(1 - tt, 4), round(1 - tb, 4)])  # + cell v of bottom / top edge (v up)
    prof[0][1] = prof[-1][1] = 0.0
    PROF[name] = prof
    cell = crush(crop, (w, h))
    # grease: highlights in the art lower roughness a touch
    l = lum(cell); put(name, cell, x, y, np.clip(rough + .25 * (.5 - l), .12, .7), 0, 3.0)
    ASP[name] = round(L / (y1 - y0), 4)   # true length / thickness aspect of the piece


food('hotdog', 0, 2, 512, 90, .32)
food('taquito', 0, 100, 512, 88, .62)
# gutters: replicate the cells' edge rows so mip levels do not mix the two food cells
for (ys, yd) in [(2, 0), (2, 1), (91, 92), (91, 93), (91, 94), (91, 95), (100, 96), (100, 97), (100, 98), (100, 99), (187, 188), (187, 189), (187, 190), (187, 191)]:
    base.paste(base.crop((0, ys, 512, ys + 1)), (0, yd)); nrm.paste(nrm.crop((0, ys, 512, ys + 1)), (0, yd)); rgh[yd, :512] = rgh[ys, :512]

# ---- brushed stainless: three crops (rollers / housing top / housing sides), horizontal brush lines ----
br = art('brushed')
for i, (cx, cy) in enumerate([(40, 60), (420, 260), (760, 480)]):
    c = br.crop((cx, cy, cx + 600, cy + 230 if i < 2 else cy + 260))
    sz = (512, 96) if i == 0 else (512, 160) if i == 1 else (256, 96)
    pos = [(512, 0), (512, 96), (512, 256)][i]
    cell = crush(c, sz)
    l = lum(cell); hh = np.asarray(Image.fromarray((l * 255).astype(np.uint8)).filter(ImageFilter.BoxBlur(1))).astype(np.float32) / 255
    put(['steelRoll', 'steelTop', 'steelSide'][i], cell, *pos, np.clip(.28 + .5 * (.55 - l), .18, .5), 1, 2.5, hh)

# ---- heater coil through the gap: base = sooty element, emission = dull dark-orange where the coil glows ----
ht = art('heater').crop((100, 300, 1300, 470))
cell = crush(ht, (512, 72)); a = np.asarray(cell).astype(np.float32) / 255
glow = np.clip((a[..., 0] - a[..., 2]) * 1.6 - .12, 0, 1) * np.clip(a[..., 0] * 1.4, 0, 1)
e = np.stack([glow * .9, glow * .28, glow * .05], -1)  # dull dark orange, not yellow
put('heater', cell, 0, 192, .88, 0, 2.0, e=Image.fromarray((e * 255).astype(np.uint8)))
soot = crush(art('heater').crop((40, 20, 1360, 220)), (256, 64))
put('soot', soot, 256, 264, .82, 0, 1.6)

# ---- menu card above the machine (fictional brand), brand plate, knob, pilot ----
def card(w, h, draw):
    im = Image.new('RGB', (w * 2, h * 2), (245, 236, 210)); d = ImageDraw.Draw(im); draw(d, w * 2, h * 2)
    return crush(im, (w, h))


def menu(d, W, H):
    d.rectangle((0, 0, W, H * .3), fill=(178, 28, 24)); d.text((W * .05, H * .04), 'ROLL-O GRILL', font=FB(int(H * .2)), fill=(255, 226, 60))
    d.text((W * .05, H * .36), 'HOT DOGS', font=FB(int(H * .16)), fill=(30, 20, 18)); d.text((W * .62, H * .34), '2/$3', font=FB(int(H * .2)), fill=(178, 28, 24))
    d.text((W * .05, H * .58), 'TAQUITOS', font=FB(int(H * .16)), fill=(30, 20, 18)); d.text((W * .62, H * .56), '$1.49', font=FB(int(H * .2)), fill=(178, 28, 24))
    d.text((W * .05, H * .82), 'Salchichas · Taquitos · Fresh all day', font=FR(int(H * .1)), fill=(80, 60, 50))
    d.rectangle((0, 0, W - 1, H - 1), outline=(120, 20, 18), width=6)


put('menu', card(512, 160, menu), 512, 352, .6)


def plate(d, W, H):
    d.rectangle((0, 0, W, H), fill=(28, 28, 30)); d.text((W * .06, H * .14), 'STARLITE', font=FB(int(H * .38)), fill=(220, 220, 214))
    d.text((W * .06, H * .6), 'ROLL-O 10 · 120V 1300W', font=FR(int(H * .24)), fill=(170, 170, 160))


put('plate', card(256, 64, plate), 0, 264, .45)


def knob(d, W, H):
    d.rectangle((0, 0, W, H), fill=(60, 60, 62)); d.ellipse((W * .08, H * .08, W * .92, H * .92), fill=(18, 18, 18))
    for k in range(16):
        t = k / 16 * 6.283; d.line((W / 2 + np.cos(t) * W * .3, H / 2 + np.sin(t) * H * .3, W / 2 + np.cos(t) * W * .42, H / 2 + np.sin(t) * H * .42), fill=(48, 48, 48), width=3)
    d.line((W / 2, H / 2, W / 2, H * .12), fill=(230, 230, 220), width=6)


put('knob', card(64, 64, knob), 0, 336, .4)
pil = card(64, 64, lambda d, W, H: (d.rectangle((0, 0, W, H), fill=(40, 40, 40)), d.ellipse((W * .2, H * .2, W * .8, H * .8), fill=(200, 30, 20))))
pe = Image.new('RGB', (64, 64)); ImageDraw.Draw(pe).ellipse((14, 14, 50, 50), fill=(255, 40, 20)); pe = pe.filter(ImageFilter.GaussianBlur(2))
put('pilot', pil, 64, 336, .2, e=pe)

os.makedirs(OUT, exist_ok=True)
base.save(os.path.join(OUT, 'roll140.webp'), quality=90)
Image.fromarray(rgh).save(os.path.join(OUT, 'roll140_r.webp'), lossless=True)
nrm.save(os.path.join(OUT, 'roll140_n.webp'), lossless=True)
emi.save(os.path.join(OUT, 'roll140_e.webp'), quality=92)
with open(os.path.join(ROOT, 'dist', 'retail140-roller-uv.js'), 'w') as f:
    f.write('// generated by bc/tools/retail140_p4_roller.py\n')
    f.write('export const UVR140=' + json.dumps(UV) + ';\n')
    f.write('export const ASPR140=' + json.dumps(ASP) + ';\n')
    f.write('export const PROFR140=' + json.dumps(PROF) + ';\n')
print('ok', list(UV), {k: v for k, v in ASP.items() if k in PROF})
