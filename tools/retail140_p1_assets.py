#!/usr/bin/env python3
"""V140 P1: real-shape shelf goods for the V138 stores.
Each product's printed art was generated on its own, large (art-v140retail/p1/v140_*.png, fictional brands).
This tool crops each print, sizes its atlas cell to the product's real printed area (no stretching: the product's
geometry takes the art's aspect, see JSON), draws the procedural panels a shopper can also see (box sides / backs /
tops, bag backs, lids, caps, liquid bodies), PS1-crushes everything, and packs three parallel atlases:
  goods140.webp    baseColor (sRGB)
  goods140_r.webp  G = roughness, B = metalness (three.js roughnessMap / metalnessMap channels)
  goods140_n.webp  tangent-space normal (bag crinkle, box creases, lid rings, label ribs, ink emboss)
and writes dist/retail140-goods-uv.js (cell rects + per-product sizes)."""
import json, math, os, random
from PIL import Image, ImageDraw, ImageFilter, ImageOps
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # bc/
ART = os.path.join(os.path.dirname(ROOT), 'art-v140retail', 'p1')
OUT = os.path.join(ROOT, 'dist', 'assets', 'l11-v140')
DPM = 680  # atlas texels per metre of printed surface
AW = AH = 1024

# kind, file, physical params.  wrap: r = radius, body = printed body height; front: h = printed height (width follows art)
ITEMS = {
 'cola':   dict(kind='can', file='can_cola', r=.033, body=.102, rough=.32, metal=.55),
 'lime':   dict(kind='can', file='can_lime', r=.033, body=.102, rough=.32, metal=.55),
 'beans':  dict(kind='tin', file='can_beans', r=.041, body=.074, rough=.7, metal=0),
 'water':  dict(kind='pet', file='pet_water', r=.032, body=.075, rough=.28, metal=0, liquid=(170, 200, 214), cap=(40, 90, 170)),
 'orange': dict(kind='pet', file='pet_orange', r=.034, body=.085, rough=.28, metal=0, liquid=(236, 120, 18), cap=(240, 240, 236)),
 'salsa':  dict(kind='jar', file='jar_salsa', r=.042, body=.066, rough=.75, metal=0, liquid=(150, 34, 20), cap=(196, 160, 70)),
 'yogurt': dict(kind='cup', file='cup_yogurt', r=.034, body=.072, rough=.42, metal=0),
 'candy':  dict(kind='bar', file='candy_bar', w=.135, rough=.3, metal=.25),
 'chips1': dict(kind='bag', file='bag_chips1', h=.30, rough=.3, metal=.3),
 'chips2': dict(kind='bag', file='bag_chips2', h=.29, rough=.3, metal=.3),
 'shrimp': dict(kind='bag', file='bag_shrimp', h=.24, rough=.34, metal=.2),
 'cereal1': dict(kind='box', file='box_cereal1', h=.28, d=.07, rough=.72, metal=0),
 'cereal2': dict(kind='box', file='box_cereal2', h=.27, d=.065, rough=.78, metal=0),
 'crackers': dict(kind='box', file='box_crackers', h=.2, d=.1, rough=.75, metal=0),
 'pasta':  dict(kind='box', file='box_pasta', h=.19, d=.045, rough=.7, metal=0),
 'pizza':  dict(kind='box', file='box_frozen', h=.29, d=.045, rough=.55, metal=0),
 'milk':   dict(kind='carton', file='carton_milk', h=.165, d=.096, rough=.5, metal=0),
 'detergent': dict(kind='jug', file='jug_detergent', h=.15, d=.12, rough=.38, metal=0, body=(28, 150, 160), cap=(240, 120, 30)),
}
MANUAL = {'lime': (.005, .235, .995, .765), 'cereal1': (.175, .04, .995, .995)}
CATS = {'dry': ['cereal1', 'cereal2', 'crackers', 'pasta', 'chips1', 'chips2', 'shrimp', 'beans', 'salsa', 'detergent'],
        'cool': ['cola', 'lime', 'water', 'orange'], 'dairy': ['milk', 'yogurt'], 'frozen': ['pizza'],
        'candy': ['candy', 'shrimp', 'chips1']}


def load(name):
    return Image.open(os.path.join(ART, 'v140_' + name + '.png')).convert('RGB')


def crop_print(im, band):
    """crop to the printed area: repeatedly strip rows/cols that mostly match the border colour."""
    a = np.asarray(im).astype(np.int32)
    for _ in range(3):
        h, w, _ = a.shape
        bg = np.median(np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]]), axis=0)
        diff = np.abs(a - bg).sum(2) > 42
        rows = np.where(diff.mean(1) > .45)[0]
        if len(rows) < 8:
            break
        y0, y1 = rows[0], rows[-1] + 1
        cols = np.where(diff[y0:y1].mean(0) > .45)[0]
        if len(cols) < 8:
            break
        x0, x1 = cols[0], cols[-1] + 1
        if (y0, y1, x0, x1) == (0, h, 0, w):
            break
        a = a[y0:y1, x0:x1]
    # shave 1.2 % (antialiased border / print marks)
    h, w, _ = a.shape
    m = max(2, int(min(h, w) * .012))
    a = a[m:h - m, m:w - m]
    return Image.fromarray(a.astype(np.uint8))


def crush(im, size):
    """generate large → downscale → PS1 low-fi (5-bit channels, slight blur first so text turns into texture)."""
    im = im.filter(ImageFilter.GaussianBlur(max(0.0, im.width / size[0] * .35)))
    im = im.resize(size, Image.LANCZOS)
    a = (np.asarray(im).astype(np.int32) >> 3 << 3) + 4
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


def avg(im, box=None):
    a = np.asarray(im.crop(box) if box else im).reshape(-1, 3).mean(0)
    return tuple(int(v) for v in a)


def dom(im):
    """dominant saturated-ish colour (brand colour) of a print"""
    q = im.resize((64, 64)).quantize(6)
    pal = q.getpalette()[:18]
    cnt = sorted(q.getcolors(), reverse=True)
    for n, i in cnt:
        c = tuple(pal[i * 3:i * 3 + 3])
        if max(c) - min(c) > 40:
            return c
    return tuple(pal[cnt[0][1] * 3:cnt[0][1] * 3 + 3])


rnd = random.Random(140)


def text_lines(d, x0, y0, x1, y1, col, step=5, th=2):
    y = y0
    while y < y1 - th:
        x = x0
        while x < x1 - 6:
            wl = rnd.randint(4, 22)
            d.rectangle([x, y, min(x1, x + wl), y + th - 1], fill=col)
            x += wl + rnd.randint(2, 4)
        y += step


def panel_side(w, h, brand, name, kind):
    """box side: brand colour, rotated brand bar, white nutrition-facts box (kind 0) or ingredients + barcode (1)"""
    im = Image.new('RGB', (w, h), brand)
    d = ImageDraw.Draw(im)
    light = tuple(min(255, c + 70) for c in brand)
    d.rectangle([0, 0, w, int(h * .16)], fill=light)
    text_lines(d, 4, 4, w - 4, int(h * .14), brand, 6, 3)
    if kind == 0:
        bx = [int(w * .1), int(h * .22), int(w * .9), int(h * .86)]
        d.rectangle(bx, fill=(250, 250, 246), outline=(20, 20, 20), width=2)
        d.rectangle([bx[0] + 3, bx[1] + 3, bx[2] - 3, bx[1] + 10], fill=(20, 20, 20))
        yy = bx[1] + 16
        while yy < bx[3] - 6:
            d.line([bx[0] + 4, yy, bx[2] - 4, yy], fill=(30, 30, 30), width=1)
            text_lines(d, bx[0] + 5, yy + 2, bx[2] - 5, yy + 5, (40, 40, 40), 4, 2)
            yy += 9
    else:
        text_lines(d, int(w * .1), int(h * .22), int(w * .9), int(h * .6), (250, 250, 240), 6, 2)
        bx = [int(w * .2), int(h * .68), int(w * .8), int(h * .9)]
        d.rectangle(bx, fill=(255, 255, 255))
        for x in range(bx[0] + 3, bx[2] - 3, 2):
            if rnd.random() < .55:
                d.line([x, bx[1] + 2, x, bx[3] - 6], fill=(0, 0, 0))
    return im


def panel_back(w, h, brand, front):
    """back: brand ground, a small cut of the front art as a 'recipe photo', text columns"""
    im = Image.new('RGB', (w, h), tuple(min(255, int(c * .85 + 30)) for c in brand))
    d = ImageDraw.Draw(im)
    ph = front.resize((max(8, w // 2), max(8, h // 3)), Image.LANCZOS).crop((0, 0, w // 2, h // 3))
    im.paste(ph.filter(ImageFilter.GaussianBlur(1)), (int(w * .08), int(h * .1)))
    text_lines(d, int(w * .62), int(h * .1), int(w * .92), int(h * .45), (255, 255, 255), 5, 2)
    d.rectangle([int(w * .08), int(h * .52), int(w * .92), int(h * .9)], fill=(250, 248, 236))
    text_lines(d, int(w * .1), int(h * .55), int(w * .9), int(h * .88), (60, 50, 40), 5, 2)
    return im


def panel_top(w, h, brand):
    im = Image.new('RGB', (w, h), brand)
    d = ImageDraw.Draw(im)
    d.line([0, h // 2, w, h // 2], fill=tuple(int(c * .6) for c in brand), width=1)  # flap seam
    d.rectangle([int(w * .3), int(h * .15), int(w * .7), int(h * .4)], fill=tuple(min(255, c + 60) for c in brand))
    return im


def disc(size, base, rings, tab=False, text=None):
    im = Image.new('RGB', (size, size), base)
    d = ImageDraw.Draw(im)
    c = size / 2
    for k, (rf, col) in enumerate(rings):
        r = c * rf
        d.ellipse([c - r, c - r, c + r, c + r], outline=col, width=max(1, size // 40))
    if tab:
        d.rounded_rectangle([c - size * .12, c - size * .32, c + size * .12, c + size * .06], radius=size * .06,
                            fill=tuple(min(255, v + 25) for v in base), outline=tuple(int(v * .6) for v in base))
        d.ellipse([c - size * .05, c - size * .26, c + size * .05, c - size * .14], fill=tuple(int(v * .5) for v in base))
    if text:
        text_lines(d, int(size * .25), int(size * .55), int(size * .75), int(size * .7), text, 4, 2)
    return im


def liquid(w, h, col, kind):
    """PET / jar body seen through clear plastic or glass: liquid colour, vertical highlight, bubbles or chunks"""
    a = np.zeros((h, w, 3), np.float32) + np.array(col, np.float32)
    x = np.linspace(0, 1, w)[None, :, None]
    a *= (.78 + .3 * np.exp(-((x - .35) / .08) ** 2) + .18 * np.exp(-((x - .7) / .05) ** 2))
    im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(im)
    for _ in range(w * h // 60):
        px, py = rnd.randrange(w), rnd.randrange(h)
        if kind == 'jar':
            c2 = tuple(int(v * rnd.uniform(.6, 1.3)) for v in (col if rnd.random() < .7 else (60, 120, 40)))
            d.ellipse([px, py, px + rnd.randint(2, 4), py + rnd.randint(2, 3)], fill=tuple(min(255, v) for v in c2))
        else:
            d.point((px, py), fill=tuple(min(255, int(v * 1.25 + 20)) for v in col))
    return im


def flat(w, h, col, noise=8):
    a = np.zeros((h, w, 3), np.float32) + np.array(col, np.float32)
    a += np.random.RandomState(w * h).randn(h, w, 1) * noise
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


# ---------- build cells ----------
cells = []  # (key, rgb Image, rough(0-1 array or float), metal, height-map kind)
meta = {}
for key, it in ITEMS.items():
    k = it['kind']
    art = crop_print(load(it['file']), k in ('can', 'tin', 'pet', 'jar', 'cup', 'bar'))
    if key in MANUAL:  # prints whose generated sheet kept a card / print marks around them
        f = MANUAL[key]
        art = art.crop((int(f[0] * art.width), int(f[1] * art.height), int(f[2] * art.width), int(f[3] * art.height)))
    asp = art.width / art.height
    m = dict(kind=k, rough=it['rough'], metal=it['metal'])
    brand = dom(art)
    if k in ('can', 'tin', 'pet', 'jar', 'cup'):
        circ = 2 * math.pi * it['r']
        lh = min(it['body'], circ / asp)  # printed label height follows the art (no stretch)
        cw = circ
        if circ / asp > it['body']:  # art taller than the body: crop art height to the body (no stretch)
            keep = art.width / (circ / it['body'])
            off = (art.height - keep) / 2
            art = art.crop((0, int(off), art.width, int(off + keep)))
            lh = it['body']
        m.update(r=it['r'], lh=lh, body=it['body'])
        # band colour above / below the label (printed body continuation)
        top_c = avg(art, (0, 0, art.width, max(1, art.height // 20)))
        bot_c = avg(art, (0, art.height - max(1, art.height // 20), art.width, art.height))
        lab = crush(art, (int(cw * DPM), int(lh * DPM)))
        if k in ('can', 'tin') and lh < it['body'] - .002:  # printed / bare body above + below the label, same cell (1 lathe segment)
            fullh = int(it['body'] * DPM)
            band = (172, 172, 170) if k == 'tin' else None
            pad = Image.new('RGB', (lab.width, fullh), band or bot_c)
            ImageDraw.Draw(pad).rectangle([0, 0, lab.width, (fullh - lab.height) // 2], fill=band or top_c)
            pad.paste(lab, (0, (fullh - lab.height) // 2))
            lab = pad
            lh = it['body']
            m['lh'] = lh
        cells.append((key + ':label', lab, it['rough'], it['metal'], 'rib' if k == 'pet' else 'ink'))
        if k == 'can':
            cells.append((key + ':lid', disc(48, (196, 198, 200), [(.96, (120, 120, 124)), (.82, (150, 150, 154)), (.5, (170, 170, 172))], tab=True), .3, .9, 'lid'))
            cells.append((key + ':band', flat(16, 16, top_c, 4), it['rough'], it['metal'], 'flat'))
        elif k == 'tin':
            cells.append((key + ':lid', disc(48, (170, 172, 168), [(.96, (110, 110, 108)), (.8, (140, 140, 138)), (.62, (130, 130, 128)), (.44, (140, 140, 138))]), .4, .85, 'lid'))
            cells.append((key + ':band', flat(16, 16, (172, 172, 170), 5), .4, .85, 'rib'))
        elif k in ('pet', 'jar'):
            cells.append((key + ':body', liquid(int(cw * DPM * .5), 64, it['liquid'], k), .12 if k == 'pet' else .08, 0, 'flat'))
            cap = it['cap']
            cells.append((key + ':lid', disc(40, cap, [(.95, tuple(int(v * .7) for v in cap)), (.7, tuple(int(v * .85) for v in cap))]), .45, .8 if k == 'jar' else 0, 'lid'))
            cells.append((key + ':capside', flat(24, 12, cap, 6), .45, .8 if k == 'jar' else 0, 'rib'))
        elif k == 'cup':
            cells.append((key + ':lid', disc(56, (222, 210, 214), [(.97, (180, 140, 150)), (.9, (200, 190, 196))], text=brand), .25, .7, 'lid'))
            cells.append((key + ':band', flat(16, 16, bot_c, 4), .5, 0, 'flat'))
    elif k == 'bar':
        w = it['w']
        h = w / asp
        m.update(w=w, h=h)
        cells.append((key + ':front', crush(art, (int(w * DPM), int(h * DPM))), it['rough'], it['metal'], 'crinkle'))
        cells.append((key + ':back', crush(panel_back(256, int(256 / asp), brand, art), (int(w * DPM * .6), int(h * DPM * .6))), it['rough'], it['metal'], 'crinkle'))
    elif k == 'bag':
        h = it['h']
        w = h * asp
        m.update(w=w, h=h)
        cells.append((key + ':front', crush(art, (int(w * DPM), int(h * DPM))), it['rough'], it['metal'], 'crinkle'))
        cells.append((key + ':back', crush(panel_back(256, int(256 / asp), brand, art), (int(w * DPM * .5), int(h * DPM * .5))), it['rough'], it['metal'], 'crinkle'))
    elif k in ('box', 'carton', 'jug'):
        h = it['h']
        w = h * asp
        d = it['d']
        m.update(w=w, h=h, d=d)
        cells.append((key + ':front', crush(art, (int(w * DPM), int(h * DPM))), it['rough'], it['metal'], 'box' if k != 'jug' else 'ink'))
        if k == 'jug':
            body = it['body']
            cells.append((key + ':body', flat(48, 48, body, 6), .35, 0, 'rib'))
            cells.append((key + ':lid', disc(32, it['cap'], [(.9, tuple(int(v * .7) for v in it['cap']))]), .45, 0, 'lid'))
            m['bodyc'] = body
        else:
            sw, sh = int(d * DPM * 1.6), int(h * DPM * .9)  # sides drawn big then crushed to d×h
            cells.append((key + ':sideA', crush(panel_side(max(32, sw * 2), max(48, sh * 2), brand, key, 0), (max(8, int(d * DPM)), int(h * DPM))), it['rough'], 0, 'box'))
            cells.append((key + ':sideB', crush(panel_side(max(32, sw * 2), max(48, sh * 2), brand, key, 1), (max(8, int(d * DPM)), int(h * DPM))), it['rough'], 0, 'box'))
            cells.append((key + ':back', crush(panel_back(256, int(256 / asp), brand, art), (int(w * DPM * .5), int(h * DPM * .5))), it['rough'], 0, 'box'))
            cells.append((key + ':top', crush(panel_top(128, max(16, int(128 * d / w)), brand), (int(w * DPM * .5), max(6, int(d * DPM * .5)))), it['rough'], 0, 'box'))
            if k == 'carton':
                cells.append((key + ':gable', crush(panel_side(200, 120, brand, key, 1), (int(w * DPM * .6), int(.07 * DPM * .6))), it['rough'], 0, 'box'))
    meta[key] = m

# ---------- height maps for normals ----------
def height(kind, w, h, rgb):
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    lum = np.asarray(rgb.convert('L')).astype(np.float32) / 255
    hm = (lum - lum.mean()) * .25  # ink emboss
    rs = np.random.RandomState(w * 131 + h)
    if kind == 'crinkle':
        n = np.zeros((h, w), np.float32)
        img = Image.new('L', (w, h), 0)
        d = ImageDraw.Draw(img)
        for _ in range(max(6, w * h // 220)):
            x0, y0 = rs.rand() * w, rs.rand() * h
            ang = rs.rand() * math.pi
            L = rs.uniform(.15, .5) * min(w, h)
            d.line([x0, y0, x0 + math.cos(ang) * L, y0 + math.sin(ang) * L], fill=int(rs.uniform(90, 255)), width=1)
        n = np.asarray(img.filter(ImageFilter.GaussianBlur(1.2))).astype(np.float32) / 255
        crimp = ((y < h * .06) | (y > h * .94)) * (np.sin(x * 1.6) * .5 + .5)
        hm = hm + n * 1.6 + crimp * 1.2
    elif kind == 'box':
        e = np.minimum(np.minimum(x, w - 1 - x), np.minimum(y, h - 1 - y))
        hm = hm - np.exp(-e / 1.5) * 1.0
    elif kind == 'rib':
        hm = hm + np.sin(y * 1.9) * .35
    elif kind == 'lid':
        c = (w - 1) / 2
        r = np.hypot(x - c, y - c) / c
        hm = np.sin(r * 18) * .25 * (r < .95) - (r > .9) * .8
    return hm


def normal_from(hm, strength=2.2):
    gy, gx = np.gradient(hm)
    nx, ny, nz = -gx * strength, gy * strength, np.ones_like(hm)
    l = np.sqrt(nx * nx + ny * ny + nz * nz)
    return np.stack([(nx / l * .5 + .5), (ny / l * .5 + .5), (nz / l * .5 + .5)], 2)


# ---------- pack ----------
P = 3
order = sorted(range(len(cells)), key=lambda i: -cells[i][1].height)
base = Image.new('RGB', (AW, AH), (128, 128, 128))
rgh = Image.new('RGB', (AW, AH), (255, 200, 0))
nrm = Image.new('RGB', (AW, AH), (128, 128, 255))
x = y = rowh = 0
rects = {}
for i in order:
    key, im, rough, metal, hk = cells[i]
    w, h = im.size
    if x + w + 2 * P > AW:
        x = 0
        y += rowh
        rowh = 0
    if y + h + 2 * P > AH:
        raise SystemExit('atlas full at ' + key)
    # edge bleed: paste a P-px expanded copy first
    big = ImageOps.expand(im, border=P, fill=None) if False else im.resize((w + 2 * P, h + 2 * P), Image.NEAREST)
    base.paste(big, (x, y))
    base.paste(im, (x + P, y + P))
    lum = np.asarray(im.convert('L')).astype(np.float32) / 255
    # ink is a touch glossier than bare stock on paper; metallic film / aluminium shows metal where the print is light
    R = np.clip(rough + (lum - .5) * (.12 if metal == 0 else -.1), .04, 1)
    M = np.clip(metal * (.55 + .6 * lum), 0, 1) if metal > 0 else np.zeros_like(lum)
    orm = np.stack([np.ones_like(lum), R, M], 2)
    oi = Image.fromarray((orm * 255).astype(np.uint8))
    rgh.paste(oi.resize((w + 2 * P, h + 2 * P), Image.NEAREST), (x, y))
    rgh.paste(oi, (x + P, y + P))
    nn = Image.fromarray((normal_from(height(hk, w, h, im)) * 255).astype(np.uint8))
    nrm.paste(nn.resize((w + 2 * P, h + 2 * P), Image.NEAREST), (x, y))
    nrm.paste(nn, (x + P, y + P))
    rects[key] = [(x + P) / AW, 1 - (y + P + h) / AH, (x + P + w) / AW, 1 - (y + P) / AH]
    x += w + 2 * P
    rowh = max(rowh, h + 2 * P)
os.makedirs(OUT, exist_ok=True)
base.save(os.path.join(OUT, 'goods140.webp'), quality=92)
rgh.save(os.path.join(OUT, 'goods140_r.webp'), quality=92)
nrm.save(os.path.join(OUT, 'goods140_n.webp'), quality=95)
used = (y + rowh) / AH
js = ('// generated by bc/tools/retail140_p1_assets.py — atlas rects [u0,v0,u1,v1] + real product sizes (m)\n'
      'export const UV140=' + json.dumps({k: [round(v, 5) for v in r] for k, r in rects.items()}) + ';\n'
      'export const ITEM140=' + json.dumps({k: {kk: (round(vv, 4) if isinstance(vv, float) else vv) for kk, vv in m.items()} for k, m in meta.items()}) + ';\n'
      'export const CAT140=' + json.dumps(CATS) + ';\n')
open(os.path.join(ROOT, 'dist', 'retail140-goods-uv.js'), 'w').write(js)
print('cells', len(cells), 'atlas used %.0f%%' % (used * 100))
for k, m in meta.items():
    print(k, m)
