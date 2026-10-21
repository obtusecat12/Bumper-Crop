#!/usr/bin/env python3
"""V140 P1b-2: supermarket fixture props atlas (shipping cases, promo pallet, baskets, carts, checkout, produce cards).
Generated art, one image per item (art-v140retail/p1b2/v140_*.png): 4 case prints, belt rubber, POS screen, POS keyboard,
PIN pad, scanner platter. Each case gets its own front (the print), back (shipping label + stamps), end (logo panel) and
top (flaps + tape) cells; small materials (chrome, red / grey / beige plastic, rubber, kraft, steel) are procedural cells.
Packs, 1024 x 1024:
  fix140.webp    baseColor sRGB, alpha = basket / cart slots (alphaTest)
  fix140_r.webp  G = roughness, B = metalness
  fix140_n.webp  tangent normal from luminance (fibre, keys, slots)
and dist/retail140-fixtures-uv.js (UVX140 cell rects [u0,v0,u1,v1], v up). Run: python3 tools/retail140_p1b2_fixtures.py"""
import json, os
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ART = os.path.join(os.path.dirname(ROOT), 'art-v140retail', 'p1b2')
OUT = os.path.join(ROOT, 'dist', 'assets', 'l11-v140')
AW = AH = 1024
rs = np.random.RandomState(140)


def crush(im, size, bits=3):
    im = im.convert('RGBA')
    im = im.filter(ImageFilter.GaussianBlur(max(0.0, im.width / size[0] * .3))).resize(size, Image.LANCZOS)
    a = np.asarray(im).astype(np.int32)
    a[..., :3] = (a[..., :3] >> bits << bits) + (1 << bits >> 1)
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


def art(n):
    return Image.open(os.path.join(ART, f'v140_{n}.png')).convert('RGB')


def kraft(w, h, base, seed):
    r = np.random.RandomState(seed)
    a = np.ones((h, w, 3)) * np.array(base, float)
    n = r.normal(0, 1, (h, w))
    fib = np.asarray(Image.fromarray((128 + n * 40).clip(0, 255).astype(np.uint8)).filter(ImageFilter.BoxBlur(1))).astype(float) - 128
    a += fib[..., None] * .35
    a += np.linspace(-1, 1, h)[:, None, None] * 6 * r.uniform(-1, 1)
    return Image.fromarray(a.clip(0, 255).astype(np.uint8))


def med(im):
    a = np.asarray(im.resize((64, 32))).reshape(-1, 3)
    return tuple(int(v) for v in np.median(a, 0))


FONT = ImageFont.load_default()
cells, rough, metal, nstr = {}, {}, {}, {}


def put(name, im, r=.8, m=0., ns=1.5):
    cells[name] = im; rough[name] = r; metal[name] = m; nstr[name] = ns


# ---- shipping cases: front = print, back = label, end = logo panel, top = flaps + tape ----
CASES = {'cola': (.0, .0, 1, 1), 'cereal': (.0, .0, 1, 1), 'water': (.0, .0, 1, 1), 'chips': (.0, .0, 1, 1)}
LOGO = {'cola': (.30, .08, .80, .62), 'cereal': (.32, .05, .70, .55), 'water': (.32, .05, .68, .45), 'chips': (.0, .05, .45, .40)}
for k, c in CASES.items():
    im = art('case_' + k); W, H = im.size
    im = im.crop((int(W * c[0]), int(H * c[1]), int(W * c[2]), int(H * c[3])))
    base = med(im)
    put(f'case_{k}_f', crush(im, (256, 140)), .92, 0, 1.8)
    # back: plain board, shipping label, lot stamp, up arrows
    bk = kraft(512, 280, base, hash(k) % 999)
    d = ImageDraw.Draw(bk)
    lx, ly = 300 + rs.randint(-20, 20), 70 + rs.randint(-10, 20)
    d.rectangle([lx, ly, lx + 170, ly + 120], fill=(236, 233, 222), outline=(160, 155, 140))
    for i, t in enumerate(['SHIP TO: DC-04', 'BUMPER MART #118', 'PO 55821-' + str(rs.randint(10, 99)), 'QTY 1 / CASE', 'MFG ' + k.upper()]):
        d.text((lx + 8, ly + 8 + i * 15), t, fill=(30, 30, 30), font=FONT)
    for i in range(30):
        x = lx + 10 + i * 5; d.line([x, ly + 88, x, ly + 112], fill=(20, 20, 20), width=1 + (i * 7 % 3 == 0))
    ink = (40, 40, 40) if k != 'water' else (30, 60, 140)
    d.text((40, 40), 'LOT ' + str(rs.randint(1000, 9999)) + '  BEST BEFORE 03/2027', fill=ink, font=FONT)
    for x in (40, 90):
        d.polygon([(x, 150), (x + 18, 120), (x + 36, 150)], fill=ink); d.rectangle([x + 12, 150, x + 24, 180], fill=ink)
    d.text((40, 190), 'THIS SIDE UP / CE COTE EN HAUT', fill=ink, font=FONT)
    put(f'case_{k}_b', crush(bk, (256, 140)), .92, 0, 1.8)
    # end: logo panel
    en = kraft(256, 280, base, hash(k) % 777 + 1)
    lg = im.crop((int(im.width * LOGO[k][0]), int(im.height * LOGO[k][1]), int(im.width * LOGO[k][2]), int(im.height * LOGO[k][3])))
    lg.thumbnail((220, 180)); en.paste(lg, ((256 - lg.width) // 2, 40))
    ImageDraw.Draw(en).text((30, 240), 'NET ' + str(rs.randint(4, 12)) + '.' + str(rs.randint(0, 9)) + ' kg', fill=ink, font=FONT)
    put(f'case_{k}_e', crush(en, (128, 140)), .92, 0, 1.8)
    # top: two flaps meeting in a seam, tape over it
    tp = kraft(512, 352, base, hash(k) % 555 + 2)
    d = ImageDraw.Draw(tp)
    d.line([0, 176, 512, 176], fill=tuple(int(v * .55) for v in base), width=3)
    tape = (176 + rs.randint(-6, 6))
    d.rectangle([0, tape - 34, 512, tape + 34], fill=(min(255, base[0] + 25), min(255, base[1] + 10), max(0, base[2] - 20)))
    for x in range(0, 512, 7):
        d.line([x, tape - 34, x + 3, tape + 34], fill=(min(255, base[0] + 40), min(255, base[1] + 25), base[2]), width=1)
    d.line([rs.randint(380, 480), tape - 34, 512, tape - 10], fill=tuple(int(v * .7) for v in base), width=2)  # torn tape end
    put(f'case_{k}_t', crush(tp, (256, 176)), .9, 0, 1.6)

# ---- checkout art ----
put('belt', crush(art('belt').crop((0, 0, 1408, 704)), (256, 128)), .95, 0, 2.2)
put('pos_screen', crush(art('pos_screen'), (192, 144)), .25, 0, .3)
put('pos_keys', crush(art('pos_keys').crop((40, 20, 1368, 748)), (256, 140)), .55, 0, 2.4)
pp = art('pinpad'); a = np.asarray(pp).astype(int); m = (a.sum(2) < 690)
ys, xs = np.where(m); pp = pp.crop((xs.min() + 6, ys.min() + 4, xs.max() - 6, ys.max()))
put('pinpad', crush(pp, (96, 144)), .6, 0, 1.6)
sc = art('scanner_top'); put('scan_top', crush(sc.crop((60, 30, 1348, 738)), (256, 140)), .35, .55, 1.0)
put('scan_glass', crush(sc.crop((480, 120, 920, 520)), (96, 88)), .08, .1, .4)

# ---- produce price cards (readable, not mirrored) ----
for i, (t1, t2, t3) in enumerate([('ORANGES', '$1.29', '/lb'), ('BANANAS', '0.59', '/lb'), ('APFEL', '1.49', 'EUR/kg'), ('2 FOR', '$3', 'LEMONS'),
                                   ('TOMATOES', '$2.19', '/lb'), ('PATATAS', '0.99', '/kg')]):
    cd = Image.new('RGB', (384, 96), (250, 248, 240)); d = ImageDraw.Draw(cd)
    d.rectangle([0, 0, 383, 22], fill=(200, 30, 30) if i % 2 == 0 else (240, 190, 20))
    d.text((8, 5), 'FRESH PRODUCE  /  ' + ('SALE' if i % 3 == 0 else 'LOCAL'), fill=(255, 255, 255), font=FONT)
    big = ImageFont.load_default(size=40); mid = ImageFont.load_default(size=22)
    d.text((10, 34), t1, fill=(20, 20, 20), font=mid)
    d.text((200, 28), t2, fill=(190, 20, 20), font=big); d.text((330, 60), t3, fill=(20, 20, 20), font=FONT)
    put(f'card{i}', crush(cd, (128, 32)), .7, 0, .6)

# ---- basket wall / base: red plastic with slots (alpha) ----
def slots(w, h, col, sx, sy, sw, sh, border):
    im = Image.new('RGBA', (w * 4, h * 4), col + (255,)); d = ImageDraw.Draw(im)
    for y in range(border * 4, h * 4 - border * 4 - sh * 4 + 1, sy * 4):
        for x in range(border * 4, w * 4 - border * 4 - sw * 4 + 1, sx * 4):
            d.rounded_rectangle([x, y, x + sw * 4, y + sh * 4], 6, fill=(0, 0, 0, 0))
    a = np.asarray(im).astype(int); a[..., :3] = (a[..., :3] + rs.normal(0, 4, a[..., :3].shape)).clip(0, 255)
    return Image.fromarray(a.astype(np.uint8))
put('bwall', crush(slots(128, 64, (188, 24, 28), 10, 11, 6, 7, 6), (128, 64)), .45, 0, 1.0)
put('bbase', crush(slots(128, 96, (176, 22, 26), 12, 12, 7, 7, 8), (128, 96)), .45, 0, 1.0)
put('bwallg', crush(slots(128, 64, (40, 92, 160), 10, 11, 6, 7, 6), (128, 64)), .45, 0, 1.0)


def flat(name, col, r, m, ns=.6, noise=6, size=32, brushed=False, along_u=False):
    a = np.ones((size, size, 3)) * np.array(col, float) + rs.normal(0, noise, (size, size, 1))
    if brushed: a += np.repeat(rs.normal(0, noise * 1.6, (size, 1, 1)), size, 1) if along_u else np.repeat(rs.normal(0, noise * 1.6, (1, size, 1)), size, 0)
    put(name, Image.fromarray(a.clip(0, 255).astype(np.uint8)), r, m, ns)
flat('chrome', (205, 208, 212), .22, .9, .3, 3, brushed=True)
flat('steel', (176, 180, 182), .38, .75, .5, 2, 64, brushed=True, along_u=True)
flat('redp', (196, 30, 32), .4, 0, .4, 2)
flat('greyp', (60, 62, 66), .55, 0, .4, 2)
flat('beige', (198, 190, 168), .6, 0, .5, 2)
flat('rubber', (26, 26, 26), .92, 0, 1.2, 5)
flat('kraft', (166, 124, 78), .95, 0, 1.6, 10, 64)
flat('kraftin', (140, 102, 62), .95, 0, 1.6, 10, 64)
flat('wood', (170, 128, 82), .85, 0, 1.8, 14, 64, brushed=True, along_u=True)
flat('paper', (244, 242, 234), .8, 0, .3, 3)
flat('glassd', (22, 24, 30), .08, .2, .2, 3)

# ---- pack (shelf packer, tallest first) ----
names = sorted(cells, key=lambda n: -cells[n].height)
base = Image.new('RGBA', (AW, AH), (0, 0, 0, 255)); R = Image.new('RGB', (AW, AH), (0, 200, 0)); N = Image.new('RGB', (AW, AH), (128, 128, 255))
x = y = rowh = 0; uv = {}
for n in names:
    im = cells[n]; w, h = im.size
    if x + w + 2 > AW: x = 0; y += rowh + 2; rowh = 0
    assert y + h <= AH, 'atlas full'
    base.paste(im.convert('RGBA'), (x, y))
    g = np.asarray(im.convert('L')).astype(float) / 255
    rr = np.clip(rough[n] + (g - g.mean()) * .25, 0, 1); R.paste(Image.fromarray(np.stack([rr * 0, rr * 255, np.full_like(rr, metal[n] * 255)], 2).astype(np.uint8)), (x, y))
    hgt = np.asarray(Image.fromarray((g * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(.7))).astype(float) / 255
    if im.mode == 'RGBA': hgt = hgt * .4 + np.asarray(im)[..., 3] / 255 * .6
    dx = (np.roll(hgt, -1, 1) - np.roll(hgt, 1, 1)) * nstr[n]; dy = (np.roll(hgt, -1, 0) - np.roll(hgt, 1, 0)) * nstr[n]
    nz = 1 / np.sqrt(dx * dx + dy * dy + 1)
    N.paste(Image.fromarray(np.stack([(-dx * nz * .5 + .5) * 255, (dy * nz * .5 + .5) * 255, nz * 255], 2).clip(0, 255).astype(np.uint8)), (x, y))
    e = .5
    uv[n] = [round((x + e) / AW, 5), round(1 - (y + h - e) / AH, 5), round((x + w - e) / AW, 5), round(1 - (y + e) / AH, 5)]
    x += w + 2; rowh = max(rowh, h)
print('atlas used rows to', y + rowh, 'of', AH)
os.makedirs(OUT, exist_ok=True)
base.save(f'{OUT}/fix140.webp', lossless=True); R.save(f'{OUT}/fix140_r.webp', lossless=True); N.save(f'{OUT}/fix140_n.webp', lossless=True)
asp = {n: round(cells[n].width / cells[n].height, 4) for n in cells}
with open(os.path.join(ROOT, 'dist', 'retail140-fixtures-uv.js'), 'w') as f:
    f.write('// generated by bc/tools/retail140_p1b2_fixtures.py\nexport const UVX140=' + json.dumps(uv, separators=(',', ':')) +
            ';\nexport const ASPX140=' + json.dumps(asp, separators=(',', ':')) + ';\n')
