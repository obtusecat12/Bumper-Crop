#!/usr/bin/env python3
"""V140 P3: open-air (horizontal air-curtain) butcher / fish case contents atlas.
Generated art, one large image per item (art-v140retail/p3/v140_*.png, 1408x768): ribeye, pork chop, ground beef,
stew cubes, salmon fillet, whole red snapper, crushed ice. Foam trays, absorbent pads and the scale labels are composed
here. Every cell is downscaled from its own large image (blur + resize + 3-bit crush). Packs 1024 x 1024:
  meat140.webp     baseColor sRGB
  meat140_r.webp   G = roughness (meat high, fat a bit lower, ice / skin lower), B = metalness (0)
  meat140_n.webp   tangent normal from luminance height (mince strands, cube crevices, scales, ice chunks, foam beads)
  meat140_cn.webp  clearcoat normal = cling-film wrinkles / stretch creases per cell (ice + fish skin: wet ripples)
and dist/retail140-meat-uv.js: UVM140 rects [u0,v0,u1,v1] (v up), ASPM140 aspects, SHAPE140 outlines traced from the
art (star polygon around the centroid in cell space for steak / chop, per-column top+bottom for the fish), so the
modelled pieces take the real silhouette of their own picture.
Run from the project root: python3 bc/tools/retail140_p3_meat.py"""
import json, os, math
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ART = os.path.join(os.path.dirname(ROOT), 'art-v140retail', 'p3')
OUT = os.path.join(ROOT, 'dist', 'assets', 'l11-v140')
AW = AH = 1024
rs = np.random.RandomState(1403)
Hs = lambda s: sum(ord(c) * (i + 1) for i, c in enumerate(s))
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


def blur(a, s):
    return np.asarray(Image.fromarray(np.clip(a * 255, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(s))).astype(np.float32) / 255


def normal_from(h, k):
    gy, gx = np.gradient(h)
    n = np.stack([-gx * k, gy * k, np.ones_like(h)], -1)
    n /= np.linalg.norm(n, axis=-1, keepdims=True)
    return Image.fromarray(((n * .5 + .5) * 255).astype(np.uint8))


def lum(im):
    return np.asarray(im.convert('L')).astype(np.float32) / 255


def wrinkles(w, h, n, seed, amp=1.):
    """cling film: long soft creases + a few sharp stretch lines, as a height field (large, then downscaled)."""
    r = np.random.RandomState(seed); W, H = w * 4, h * 4
    im = Image.new('L', (W, H), 128); d = ImageDraw.Draw(im)
    for i in range(n):
        x, y = r.rand() * W, r.rand() * H; a = r.rand() * math.pi; L = (.2 + r.rand() * .8) * max(W, H)
        c = int(128 + (r.rand() - .5) * 120 * amp)
        pts = [(x + math.cos(a) * L * t + math.sin(a) * 10 * math.sin(t * 7 + i), y + math.sin(a) * L * t) for t in np.linspace(-.5, .5, 12)]
        d.line(pts, fill=c, width=int(2 + r.rand() * 7))
    im = im.filter(ImageFilter.GaussianBlur(5)).resize((w, h), Image.LANCZOS)
    return np.asarray(im).astype(np.float32) / 255


# ---------------- cells ----------------
cells = {}   # name -> (base RGB, rough float, height float, nk, clearcoat height, ccK)
shapes = {}


def mask_shape(im, m, kind):
    m = blur(m.astype(np.float32), 3) > .5
    ys, xs = np.nonzero(m); x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    pad = 6; x0, y0 = max(0, x0 - pad), max(0, y0 - pad); x1, y1 = min(im.width, x1 + pad), min(im.height, y1 + pad)
    crop = im.crop((x0, y0, x1, y1)); mc = m[y0:y1, x0:x1]; H, W = mc.shape
    if kind == 'star':
        cy, cx = np.mean(np.nonzero(mc), 1); pts = []
        for k in range(40):
            a = k / 40 * 2 * math.pi; dx, dy = math.cos(a), math.sin(a); rr = 0; miss = 0; t = 0
            while True:
                t += 1.5; x, y = int(cx + dx * t), int(cy + dy * t)
                if x < 0 or y < 0 or x >= W or y >= H: break
                if mc[y, x]: rr = t; miss = 0
                else:
                    miss += 1
                    if miss > 25: break
            pts.append([round((cx + dx * rr) / W, 4), round(1 - (cy + dy * rr) / H, 4)])
        shp = {'c': [round(cx / W, 4), round(1 - cy / H, 4)], 'p': pts}
    else:  # fish: per column top/bottom, v up
        cols = []
        for k in range(29):
            x = min(W - 1, int(k / 28 * (W - 1))); col = np.nonzero(mc[:, max(0, x - 2):x + 3].any(1))[0]
            if len(col) == 0: cols.append([round(x / W, 4), .5, .5]); continue
            cols.append([round(x / W, 4), round(1 - col.max() / H, 4), round(1 - col.min() / H, 4)])
        shp = {'cols': cols}
    return crop, shp


def meat_cell(name, im, size, nk, rough_lo, rough_hi, shape=None, cc=30, ccamp=1., dark=1.):
    if dark != 1.:  # butcher-case dark red: pull the lean down and toward red before the crush
        a = np.asarray(im).astype(np.float32); a = a * np.array([dark, dark * .86, dark * .86]); im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
    b = crush(im, size); L = lum(b)
    h = blur(lum(im.resize(size, Image.LANCZOS)), .8)
    # fat (bright, low saturation) is a touch smoother than the lean
    a = np.asarray(b).astype(np.float32) / 255; sat = a.max(-1) - a.min(-1)
    fat = np.clip((L - .45) * 3 - sat * 2, 0, 1)
    rough = rough_hi + (rough_lo - rough_hi) * fat
    cells[name] = (b, rough, h, nk, wrinkles(size[0], size[1], cc, Hs(name) & 0xffff, ccamp), 3.)
    if shape: shapes[name] = shape


# ribeye (dark backdrop) / pork chop (white backdrop): trace the outline
im = art('ribeye'); A = np.asarray(im).astype(np.int32)
m = (A[..., 0] - A[..., 2] > 28) | (A.sum(-1) > 330)
crop, shp = mask_shape(im, m, 'star'); meat_cell('ribeye', crop, (300, int(300 * crop.height / crop.width)), 6, .62, .9, shp, dark=.78)
im = art('porkchop'); A = np.asarray(im).astype(np.int32)
m = A.min(-1) < 222
crop, shp = mask_shape(im, m, 'star'); meat_cell('porkchop', crop, (300, int(300 * crop.height / crop.width)), 6, .6, .88, shp, dark=.82)
im = art('snapper'); A = np.asarray(im).astype(np.int32)
m = A.min(-1) < 214
crop, shp = mask_shape(im, m, 'fish'); b = crop
meat_cell('snapper', crop, (360, int(360 * crop.height / crop.width)), 5, .35, .5, shp, cc=14, ccamp=.6, dark=.9)
im = art('salmon'); A = np.asarray(im).astype(np.int32)
m = (A[..., 0] > 150) & (A[..., 0] - A[..., 2] > 70)
ys, xs = np.nonzero(m); crop = im.crop((xs.min() + 8, ys.min() + 8, xs.max() - 8, ys.max() - 8))
meat_cell('salmon', crop, (300, int(300 * crop.height / crop.width)), 4, .55, .78)
for n in ('mince', 'stewcubes'):
    im = art(n); s = im.height; crop = im.crop(((im.width - s) // 2, 0, (im.width + s) // 2, s))
    meat_cell(n, crop, (224, 224), 9 if n == 'mince' else 7, .7, .92, dark=.8)
# second mince window (no two mince trays alike) + a second cube window
im = art('mince'); meat_cell('mince2', im.crop((0, 0, 700, 700)), (192, 192), 9, .7, .92, dark=.8)
im = art('stewcubes'); meat_cell('stew2', im.crop((700, 60, 1400, 760)), (192, 192), 7, .7, .92, dark=.8)
im = art('ice'); s = im.height; meat_cell('ice', im.crop((0, 0, s, s)), (256, 256), 5, .12, .3, cc=8, ccamp=.4)


def foam(name, base, size=(192, 128)):
    W, H = size[0] * 4, size[1] * 4; r = np.random.RandomState(Hs(name) & 0xffff)
    n = blur(r.rand(H, W).astype(np.float32), 2.2); beads = (n - n.mean()) * 6
    a = np.clip(np.array(base, np.float32)[None, None] / 255 * (1 + beads[..., None] * .35), 0, 1)
    im = Image.fromarray((a * 255).astype(np.uint8))
    b = crush(im, size); h = blur(lum(im.resize(size, Image.LANCZOS)), .6)
    cells[name] = (b, np.full(h.shape, .92, np.float32), h, 8, wrinkles(size[0], size[1], 24, Hs(name) & 0xfff), 3.)


foam('foamW', (236, 236, 230)); foam('foamB', (38, 38, 40)); foam('foamY', (226, 205, 140))
# absorbent pad (quilted white) under fish / chop
W, H = 512, 384; pad = Image.new('RGB', (W, H), (240, 240, 236)); d = ImageDraw.Draw(pad)
for x in range(0, W, 32): d.line([(x, 0), (x, H)], fill=(205, 205, 200), width=3)
for y in range(0, H, 32): d.line([(0, y), (W, y)], fill=(205, 205, 200), width=3)
pad = pad.filter(ImageFilter.GaussianBlur(3)); b = crush(pad, (128, 96))
cells['pad'] = (b, np.full((96, 128), .95, np.float32), blur(lum(pad.resize((128, 96))), 1), 4, wrinkles(128, 96, 8, 77), 3.)

LABELS = [('ribeye', 'Bone-In Ribeye', 'USDA Choice', 14.99, (255, 255, 255)), ('porkchop', 'Pork Loin Chops', 'Center Cut', 4.49, (255, 247, 210)),
          ('mince', 'Ground Beef 80/20', 'Family Pack', 4.79, (255, 255, 255)), ('stew', 'Beef Stew Meat', 'Boneless', 6.99, (255, 236, 236)),
          ('salmon', 'Filete de Salmón', 'Atlántico', 11.99, (232, 244, 255)), ('snapper', 'Vivaneau Rouge', 'Entier · Whole', 8.99, (232, 244, 255))]
for i, (k, t1, t2, ppl, bg) in enumerate(LABELS):
    W, H = 704, 288; im = Image.new('RGB', (W, H), bg); d = ImageDraw.Draw(im)
    d.rectangle([0, 0, W, 52], fill=(150, 24, 30) if i < 4 else (22, 70, 130))
    d.text((14, 6), 'HARROW & FINCH' if i < 4 else 'PIER 9 FISH CO.', font=FB(36), fill=(255, 255, 255))
    d.text((14, 62), t1, font=FB(40), fill=(20, 20, 20)); d.text((14, 118), t2, font=FR(30), fill=(70, 70, 70))
    lb = round(.8 + rs.rand() * 1.6, 2); tot = round(lb * ppl, 2)
    d.text((14, 160), f'NET WT {lb:.2f} lb', font=FR(28), fill=(30, 30, 30)); d.text((14, 194), f'${ppl:.2f}/lb', font=FR(28), fill=(30, 30, 30))
    d.text((14, 230), 'SELL BY 10/24', font=FR(24), fill=(120, 20, 20))
    d.rectangle([396, 150, W - 14, H - 14], fill=(255, 220, 40) if i % 2 == 0 else bg, outline=(30, 30, 30), width=3)
    d.text((412, 160), 'TOTAL PRICE', font=FB(24), fill=(20, 20, 20)); d.text((412, 196), f'${tot:.2f}', font=FB(56), fill=(20, 20, 20))
    x = 470
    while x < W - 20:
        w = 2 + (rs.rand() < .4) * 3; d.rectangle([x, 112, x + w, 144], fill=(10, 10, 10)); x += w + 2 + int(rs.rand() * 3)
    b = crush(im, (176, 72), 2)
    cells['lab_' + k] = (b, np.full((72, 176), .55, np.float32), np.full((72, 176), .5, np.float32), 1, wrinkles(176, 72, 6, 300 + i, .5), 2.)

# ---------------- pack (shelf) ----------------
order = sorted(cells, key=lambda n: -cells[n][0].height)
base = Image.new('RGB', (AW, AH), (128, 0, 128)); rgh = Image.new('RGB', (AW, AH), (0, 230, 0)); nrm = Image.new('RGB', (AW, AH), (128, 128, 255)); ccn = Image.new('RGB', (AW, AH), (128, 128, 255))
UV, ASP = {}, {}; x = y = 0; rowh = 0; G = 4
for n in order:
    b, rough, h, nk, cc, ck = cells[n]; w, hh = b.size
    if x + w > AW: x = 0; y += rowh + G; rowh = 0
    assert y + hh <= AH, ('atlas full', n)
    base.paste(b, (x, y)); r = np.zeros((hh, w, 3), np.uint8); r[..., 1] = np.clip(rough * 255, 0, 255); rgh.paste(Image.fromarray(r), (x, y))
    nrm.paste(normal_from(h, nk), (x, y)); ccn.paste(normal_from(cc, ck), (x, y))
    e = .5
    UV[n] = [round((x + e) / AW, 5), round(1 - (y + hh - e) / AH, 5), round((x + w - e) / AW, 5), round(1 - (y + e) / AH, 5)]; ASP[n] = round(w / hh, 4)
    x += w + G; rowh = max(rowh, hh)
print('atlas rows used', y + rowh, '/', AH)
os.makedirs(OUT, exist_ok=True)
base.save(os.path.join(OUT, 'meat140.webp'), quality=92); rgh.save(os.path.join(OUT, 'meat140_r.webp'), quality=92)
nrm.save(os.path.join(OUT, 'meat140_n.webp'), quality=92); ccn.save(os.path.join(OUT, 'meat140_cn.webp'), quality=92)
with open(os.path.join(ROOT, 'dist', 'retail140-meat-uv.js'), 'w') as f:
    f.write('// generated by bc/tools/retail140_p3_meat.py\n')
    f.write('export const UVM140=' + json.dumps(UV) + ';\nexport const ASPM140=' + json.dumps(ASP) + ';\nexport const SHAPE140=' + json.dumps(shapes) + ';\n')
