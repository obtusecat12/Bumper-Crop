#!/usr/bin/env python3
"""V140 P1c: liquor & smoke shop props atlas (beer cave cases, cigarette power wall, lottery dispenser, vape boxes,
rolling-paper displays, cigar boxes, lighters, hookah parts). The P1b-2 atlas fix140 is full, so this is its own atlas.
Generated art, one image per item (art-v140retail/p1c/v140_*.png): 3 beer case prints, 3 cigarette pack fronts,
2 scratch tickets, 2 vape boxes, 2 rolling-paper covers, 2 cigar box lids. Every other face (case backs / ends / tops,
pack sides / lids, price rails, bin LEDs, display-box lids, cigar box sides, cigar wrappers + bands) is composed here
per item; small materials are procedural cells. Packs 1024 x 1024:
  bod140.webp    baseColor sRGB
  bod140_r.webp  G = roughness, B = metalness
  bod140_n.webp  tangent normal from luminance
and dist/retail140-bodega-uv.js (UVB140 rects [u0,v0,u1,v1] v up, ASPB140 aspects).
Run from the project root: python3 bc/tools/retail140_p1c_bodega.py"""
import json, os
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ART = os.path.join(os.path.dirname(ROOT), 'art-v140retail', 'p1c')
OUT = os.path.join(ROOT, 'dist', 'assets', 'l11-v140')
AW = AH = 1024
rs = np.random.RandomState(1401)
Hs = lambda s: sum(ord(c) * (i + 1) for i, c in enumerate(s))
F = lambda s: ImageFont.load_default(size=s)


def crush(im, size, bits=3):
    im = im.convert('RGB')
    im = im.filter(ImageFilter.GaussianBlur(max(0.0, im.width / size[0] * .3))).resize(size, Image.LANCZOS)
    a = np.asarray(im).astype(np.int32)
    a = (a >> bits << bits) + (1 << bits >> 1)
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


def art(n, box=None):
    im = Image.open(os.path.join(ART, f'v140_{n}.png')).convert('RGB')
    return im.crop(box) if box else im


def frac(im, b):
    return im.crop((int(im.width * b[0]), int(im.height * b[1]), int(im.width * b[2]), int(im.height * b[3])))


def med(im):
    a = np.asarray(im.resize((64, 32))).reshape(-1, 3)
    return tuple(int(v) for v in np.median(a, 0))


def shade(c, f):
    return tuple(int(max(0, min(255, v * f))) for v in c)


def board(w, h, base, seed, fib=.3):
    r = np.random.RandomState(seed)
    a = np.ones((h, w, 3)) * np.array(base, float)
    n = np.asarray(Image.fromarray((128 + r.normal(0, 1, (h, w)) * 40).clip(0, 255).astype(np.uint8)).filter(ImageFilter.BoxBlur(1))).astype(float) - 128
    a += n[..., None] * fib
    return Image.fromarray(a.clip(0, 255).astype(np.uint8))


def ink(c):
    return (20, 20, 20) if sum(c) > 420 else (240, 240, 235)


cells, rough, metal, nstr = {}, {}, {}, {}


def put(name, im, r=.8, m=0., ns=1.5):
    cells[name] = im.convert('RGB'); rough[name] = r; metal[name] = m; nstr[name] = ns


# ---------------- beer cave cases ----------------
BEER = {'brennan': ((0, 29, 1792, 579), (.3, .0, .7, .98), '12 PACK', '12 x 355 ml cans'),
        'coldspur': ((3, 29, 1375, 738), (.2, .0, .66, .85), '30 CANS', '30 x 12 fl oz'),
        'faro': ((0, 2, 1375, 730), (.22, .0, .8, .98), '24 BOTELLAS', '24 x 355 ml')}
for k, (box, lg, cnt, sub) in BEER.items():
    im = art('beer_' + k, box); base = med(im); W, H = im.size
    put(f'beer_{k}_f', crush(im, (256, int(256 * H / W))), .9, 0, 1.6)
    logo = frac(im, lg)
    # back: brand colour, small logo, recycle / nutrition panel, barcode
    bk = board(512, int(512 * H / W), base, Hs(k) % 991, .25); d = ImageDraw.Draw(bk)
    l2 = logo.copy(); l2.thumbnail((200, bk.height - 30)); bk.paste(l2, (16, (bk.height - l2.height) // 2))
    tx = 240; c = ink(base)
    for i, t in enumerate(['NUTRITION FACTS / SERVING 12 FL OZ', 'CALORIES ' + str(rs.randint(95, 160)) + '  CARBS ' + str(rs.randint(3, 13)) + 'g',
                           'PLEASE RECYCLE  -  CA CASH REFUND', 'ME/VT/MA/NY/IA/OR 5c  MI 10c', 'BREWED & CANNED BY ' + k.upper() + ' CO.']):
        d.text((tx, 18 + i * 18), t, fill=c, font=F(12))
    bx = 300; d.rectangle([bx - 6, bk.height - 62, bx + 160, bk.height - 10], fill=(245, 245, 240))
    for i in range(40): d.line([bx + i * 4, bk.height - 56, bx + i * 4, bk.height - 22], fill=(15, 15, 15), width=1 + (i * 5 % 3 == 0))
    put(f'beer_{k}_b', crush(bk, (256, int(256 * H / W))), .9, 0, 1.6)
    # end: logo + count
    EH = {'brennan': 124, 'coldspur': 190, 'faro': 236}[k]  # end panel = case depth x height (0.27 x 0.13 / 0.20 / 0.25)
    en = board(256, EH, shade(base, .92), Hs(k) % 773 + 3, .25); d = ImageDraw.Draw(en)
    l3 = logo.copy(); l3.thumbnail((230, EH - 62)); en.paste(l3, ((256 - l3.width) // 2, 8))
    d.text((128, EH - 40), cnt, fill=ink(base), font=F(26), anchor='mm'); d.text((128, EH - 14), sub, fill=ink(base), font=F(13), anchor='mm')
    put(f'beer_{k}_e', crush(en, (128, EH // 2)), .9, 0, 1.6)
    # top: brand colour, two finger holes, perforated tear strip
    tp = board(512, 340, shade(base, .85), Hs(k) % 557 + 5, .3); d = ImageDraw.Draw(tp)
    for cx in (150, 362): d.rounded_rectangle([cx - 55, 150, cx + 55, 190], 20, fill=(28, 24, 20))
    for x in range(10, 502, 14): d.line([x, 90, x + 7, 90], fill=shade(base, .5), width=3)
    d.text((256, 70), 'TEAR HERE  >>>', fill=ink(base), font=F(18), anchor='mm')
    d.text((256, 280), k.upper() + '  ' + cnt, fill=ink(base), font=F(26), anchor='mm')
    put(f'beer_{k}_t', crush(tp, (192, 128)), .9, 0, 1.8)

# ---------------- cigarette packs (front / side / lid) + power-wall rails ----------------
CIG = {'redcrest': (27, 26, 821, 1250), 'pall': (14, 13, 834, 1252), 'menthe': (0, 0, 820, 1263)}
for k, box in CIG.items():
    im = art('cig_' + k, box); top = frac(im, (0, 0, 1, .4)); base = med(top)
    put(f'cig_{k}_f', crush(im, (96, 148)), .55, 0, .8)
    sd = Image.new('RGB', (120, 760), base); d = ImageDraw.Draw(sd)
    d.rectangle([0, 470, 120, 760], fill=(250, 250, 248)); d.text((60, 615), 'WARNING', fill=(10, 10, 10), font=F(18), anchor='mm')
    t = Image.new('RGB', (420, 60), base); ImageDraw.Draw(t).text((210, 30), k.upper(), fill=ink(base), font=F(40), anchor='mm')
    sd.paste(t.rotate(90, expand=True), (30, 20))
    put(f'cig_{k}_s', crush(sd, (16, 100)), .55, 0, .6)
    lid = Image.new('RGB', (440, 180), base); d = ImageDraw.Draw(lid)
    d.line([0, 60, 440, 60], fill=shade(base, .55), width=4); d.text((220, 120), '20 CLASS A', fill=ink(base), font=F(26), anchor='mm')
    put(f'cig_{k}_t', crush(lid, (64, 26)), .55, 0, .6)
    hd = Image.new('RGB', (640, 110), shade(base, .9)); d = ImageDraw.Draw(hd)
    lg = frac(im, (.05, .02, .95, .38)); lg.thumbnail((240, 104)); hd.paste(lg, (8, 3))
    d.text((440, 55), {'redcrest': 'REDCREST', 'pall': 'PALL AVENUE', 'menthe': 'MENTHE VERTE'}[k], fill=ink(base), font=F(44), anchor='mm')
    put(f'cighead_{k}', crush(hd, (192, 33)), .5, 0, .6)
PRICES = [('REDCREST KS BOX', '$10.49'), ('REDCREST 100s', '$10.79'), ('PALL AVE KS', '$11.29'), ('PALL AVE LIGHTS', '$11.29'),
          ('MENTHE VERTE KS', '$10.99'), ('MENTHE 100s', '$11.19'), ('2 PACKS', '$19.99'), ('CARTON', '$98.50')]
for i in range(6):
    st = Image.new('RGB', (1024, 64), (250, 214, 40) if i % 2 else (246, 246, 240)); d = ImageDraw.Draw(st)
    for j in range(4):
        n, p = PRICES[(i * 3 + j) % len(PRICES)]; x = j * 256 + 8
        d.text((x, 6), n, fill=(20, 20, 20), font=F(18)); d.text((x + 120, 30), p, fill=(200, 20, 20), font=F(28))
        d.line([x + 248, 0, x + 248, 64], fill=(60, 60, 60), width=2)
    put(f'cigrail{i}', crush(st, (256, 16), 2), .6, 0, .4)

# ---------------- lottery tickets + bin LEDs ----------------
put('lotto_7s', crush(art('lotto_7s'), (96, 172)), .5, 0, .7)
put('lotto_gold', crush(art('lotto_gold'), (96, 143)), .5, 0, .7)
for i, (g, p) in enumerate([('1427', '$5'), ('1388', '$2'), ('1452', '$10'), ('1401', '$1'), ('1460', '$20'), ('1419', '$3')]):
    led = Image.new('RGB', (256, 96), (8, 8, 10)); d = ImageDraw.Draw(led)
    d.text((10, 48), g, fill=(255, 60, 40), font=F(46), anchor='lm'); d.text((246, 48), p, fill=(255, 210, 40), font=F(52), anchor='rm')
    put(f'lbin{i}', crush(led, (64, 24), 2), .3, 0, .3)

# ---------------- vape boxes + devices ----------------
VAPE = {'nublr': (194, 79, 661, 1241), 'vapora': (212, 87, 638, 1175)}
for k, box in VAPE.items():
    im = art('vape_' + k, box); base = med(frac(im, (0, 0, 1, .5)))
    put(f'vape_{k}_f', crush(im, (64, 160)), .4, 0, .7)
    sd = Image.new('RGB', (100, 400), base); t = Image.new('RGB', (360, 60), base)
    ImageDraw.Draw(t).text((180, 30), k.upper() + ' 5%', fill=ink(base), font=F(34), anchor='mm'); sd.paste(t.rotate(90, expand=True), (20, 20))
    put(f'vape_{k}_s', crush(sd, (24, 96)), .4, 0, .5)
    tp = Image.new('RGB', (200, 80), shade(base, .85)); ImageDraw.Draw(tp).text((100, 40), 'NICOTINE', fill=ink(base), font=F(24), anchor='mm')
    put(f'vape_{k}_t', crush(tp, (40, 16)), .4, 0, .5)
for n, c in [('vpink', (226, 70, 160)), ('vteal', (30, 170, 170)), ('vblack', (30, 30, 34)), ('vgold', (200, 160, 70))]:
    a = np.ones((32, 64, 3)) * np.array(c, float) + np.linspace(30, -30, 64)[None, :, None] + rs.normal(0, 3, (32, 64, 1))
    put(n, Image.fromarray(a.clip(0, 255).astype(np.uint8)), .3, .45 if n == 'vgold' else .2, .3)

# ---------------- rolling papers: booklet covers, display-box lids, booklet edges ----------------
PAP = {'zagra': (36, 26, 1232, 817), 'rawleaf': (17, 19, 1249, 841)}
for k, box in PAP.items():
    im = art('papers_' + k, box); base = med(im)
    put(f'pap_{k}_f', crush(im, (144, 96)), .8, 0, 1.2)
    lid = board(600, 320, base, Hs(k) % 331, .3); d = ImageDraw.Draw(lid)
    lc = im.copy(); lc.thumbnail((260, 200)); lid.paste(lc, (20, 60))
    d.text((440, 110), '24 BOOKLETS', fill=ink(base), font=F(36), anchor='mm'); d.text((440, 170), '1 1/4  -  ' + k.upper(), fill=ink(base), font=F(28), anchor='mm')
    d.text((440, 230), 'NOT FOR SALE SEPARATELY', fill=ink(base), font=F(18), anchor='mm')
    put(f'pap_{k}_lid', crush(lid, (192, 102)), .85, 0, 1.4)
    fr = board(600, 100, shade(base, .9), Hs(k) % 113, .3); ImageDraw.Draw(fr).text((300, 50), k.upper() + '  RICE PAPER  -  PAPEL DE ARROZ', fill=ink(base), font=F(30), anchor='mm')
    put(f'pap_{k}_bx', crush(fr, (192, 32)), .85, 0, 1.4)
eg = Image.new('RGB', (256, 32), (238, 236, 226)); d = ImageDraw.Draw(eg)
for y in range(0, 32, 3): d.line([0, y, 256, y], fill=(205, 200, 188))
put('pap_edge', crush(eg, (64, 8), 2), .9, 0, 1.5)

# ---------------- cigar boxes + cigars ----------------
CG = {'paloma': (3, 15, 1308, 797), 'esteban': (26, 0, 1281, 815)}
for k, box in CG.items():
    im = art('cigar_' + k, box); base = med(im)
    put(f'cgr_{k}_lid', crush(im, (256, 160)), .5 if k == 'esteban' else .7, 0, 1.2)
    sd = board(800, 120, base, Hs(k) % 211, .45); d = ImageDraw.Draw(sd)
    if k == 'paloma':
        d.rectangle([0, 0, 800, 18], fill=(196, 160, 80)); d.rectangle([0, 102, 800, 120], fill=(196, 160, 80))
        st = frac(im, (.25, .1, .75, .3)); st.thumbnail((300, 70)); sd.paste(st, (250, 26))
    else:
        d.text((400, 60), 'DON ESTEBAN  -  HECHO EN REP. DOM.', fill=(18, 12, 8), font=F(30), anchor='mm')
    put(f'cgr_{k}_s', crush(sd, (192, 28)), .5 if k == 'esteban' else .7, 0, 1.2)
    inn = frac(im, (.18, .12, .82, .88)) if k == 'paloma' else board(400, 260, (178, 128, 82), 77, .5)
    if k != 'paloma': ImageDraw.Draw(inn).text((200, 130), 'TOTALMENTE A MANO', fill=(90, 50, 25), font=F(28), anchor='mm')
    put(f'cgr_{k}_in', crush(inn, (128, 80)), .8, 0, 1.2)
tb = np.zeros((64, 256, 3)); tb[:] = (96, 58, 32)
tb += rs.normal(0, 6, (64, 256, 1)); tb += np.repeat(rs.normal(0, 10, (1, 256, 1)), 64, 0)
for i in range(6):  # leaf veins (diagonal wrapper seams)
    x0 = rs.randint(0, 256); [tb.__setitem__((y, (x0 + y * 3) % 256), tb[y, (x0 + y * 3) % 256] * .7) for y in range(64)]
put('tobacco', crush(Image.fromarray(tb.clip(0, 255).astype(np.uint8)), (128, 32)), .85, 0, 2.0)
put('tobaccod', crush(Image.fromarray((tb * .6).clip(0, 255).astype(np.uint8)), (128, 32)), .8, 0, 2.0)
for i, (bg, tx) in enumerate([((170, 20, 30), 'LA PALOMA'), ((20, 20, 20), 'DON ESTEBAN'), ((120, 30, 90), 'MADURO')]):
    bd = Image.new('RGB', (256, 64), bg); d = ImageDraw.Draw(bd)
    d.rectangle([0, 0, 256, 8], fill=(214, 176, 80)); d.rectangle([0, 56, 256, 64], fill=(214, 176, 80)); d.text((128, 32), tx, fill=(232, 200, 110), font=F(30), anchor='mm')
    put(f'cband{i}', crush(bd, (64, 16), 2), .4, .3, .8)


# ---------------- flat materials ----------------
def flat(name, col, r, m, ns=.6, noise=6, size=32, brushed=False, along_u=False):
    a = np.ones((size, size, 3)) * np.array(col, float) + rs.normal(0, noise, (size, size, 1))
    if brushed: a += np.repeat(rs.normal(0, noise * 1.6, (size, 1, 1)), size, 1) if along_u else np.repeat(rs.normal(0, noise * 1.6, (1, size, 1)), size, 0)
    put(name, Image.fromarray(a.clip(0, 255).astype(np.uint8)), r, m, ns)


flat('cedar', (176, 118, 72), .85, 0, 1.8, 12, 64, True, True)
flat('mahog', (82, 38, 24), .45, 0, 1.0, 8, 64, True, True)
flat('brass', (186, 146, 72), .3, .9, .4, 4, 32, True)
flat('brassd', (120, 88, 40), .45, .8, .6, 6, 32)
flat('clay', (164, 82, 52), .9, 0, 1.6, 10)
flat('rubber', (24, 24, 26), .9, 0, 1.0, 4)
flat('steel', (178, 182, 184), .35, .8, .5, 3, 64, True, True)
flat('dark', (34, 34, 36), .6, 0, .4, 3)
flat('acryl', (44, 48, 52), .4, .05, .2, 2)
flat('white', (236, 236, 232), .5, 0, .4, 3)
for i, c in enumerate([(210, 30, 30), (30, 90, 200), (240, 200, 30), (30, 160, 70), (230, 120, 20), (20, 20, 20)]): flat(f'lt{i}', c, .35, 0, .3, 3, 16)
hs = np.zeros((32, 128, 3)); hs[:] = (40, 30, 26)
for x in range(0, 128, 4): hs[:, x:x + 1] = (70, 56, 46)
put('hose', Image.fromarray(hs.astype(np.uint8)), .6, 0, 2.2)
ty = Image.new('RGB', (256, 256), (190, 192, 192)); d = ImageDraw.Draw(ty)
for rr in range(20, 128, 14): d.ellipse([128 - rr, 128 - rr, 128 + rr, 128 + rr], outline=(140, 142, 140), width=2)
for i in range(16):
    a = i / 16 * 2 * np.pi; d.line([128 + np.cos(a) * 40, 128 + np.sin(a) * 40, 128 + np.cos(a) * 120, 128 + np.sin(a) * 120], fill=(150, 150, 148), width=2)
put('tray', crush(ty, (64, 64)), .3, .85, 1.0)

# ---------------- pack ----------------
names = sorted(cells, key=lambda n: -cells[n].height)
base = Image.new('RGB', (AW, AH), (0, 0, 0)); R = Image.new('RGB', (AW, AH), (0, 200, 0)); N = Image.new('RGB', (AW, AH), (128, 128, 255))
x = y = rowh = 0; uv = {}
for n in names:
    im = cells[n]; w, h = im.size
    if x + w + 2 > AW: x = 0; y += rowh + 2; rowh = 0
    assert y + h <= AH, 'atlas full'
    base.paste(im, (x, y))
    g = np.asarray(im.convert('L')).astype(float) / 255
    rr = np.clip(rough[n] + (g - g.mean()) * .25, 0, 1); R.paste(Image.fromarray(np.stack([rr * 0, rr * 255, np.full_like(rr, metal[n] * 255)], 2).astype(np.uint8)), (x, y))
    hgt = np.asarray(Image.fromarray((g * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(.7))).astype(float) / 255
    dx = (np.roll(hgt, -1, 1) - np.roll(hgt, 1, 1)) * nstr[n]; dy = (np.roll(hgt, -1, 0) - np.roll(hgt, 1, 0)) * nstr[n]
    nz = 1 / np.sqrt(dx * dx + dy * dy + 1)
    N.paste(Image.fromarray(np.stack([(-dx * nz * .5 + .5) * 255, (dy * nz * .5 + .5) * 255, nz * 255], 2).clip(0, 255).astype(np.uint8)), (x, y))
    e = .5
    uv[n] = [round((x + e) / AW, 5), round(1 - (y + h - e) / AH, 5), round((x + w - e) / AW, 5), round(1 - (y + e) / AH, 5)]
    x += w + 2; rowh = max(rowh, h)
print('atlas used rows to', y + rowh, 'of', AH, 'cells', len(cells))
os.makedirs(OUT, exist_ok=True)
base.save(f'{OUT}/bod140.webp', lossless=True); R.save(f'{OUT}/bod140_r.webp', lossless=True); N.save(f'{OUT}/bod140_n.webp', lossless=True)
asp = {n: round(cells[n].width / cells[n].height, 4) for n in cells}
with open(os.path.join(ROOT, 'dist', 'retail140-bodega-uv.js'), 'w') as f:
    f.write('// generated by bc/tools/retail140_p1c_bodega.py\nexport const UVB140=' + json.dumps(uv, separators=(',', ':')) +
            ';\nexport const ASPB140=' + json.dumps(asp, separators=(',', ':')) + ';\n')
