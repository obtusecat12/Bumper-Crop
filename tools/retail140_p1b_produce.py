#!/usr/bin/env python3
"""V140 P1b: loose fruit & vegetables for the V138 produce bin / veg rack (user 10-21 22:30: real shapes, own textures).
Each skin was generated on its own, large (art-v140retail/p1b/v140_skin_*.png). This tool crops a clean patch of each
(some sheets show a whole fruit: CROP picks a skin-only window), makes it wrap seamlessly left/right (lathe seam) by a
cross-fade, PS1-crushes it, adds small procedural cells (stems, calyx, carrot tops, banana tips, onion root), and packs
  produce140.webp    baseColor (sRGB)
  produce140_r.webp  G = roughness, B = metalness (0)
  produce140_n.webp  tangent-space normal from the skin's own luminance (pores, ridges, veins)
plus dist/retail140-produce-uv.js (cell rects). Run: python3 tools/retail140_p1b_produce.py (needs numpy)."""
import json, os
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ART = os.path.join(os.path.dirname(ROOT), 'art-v140retail', 'p1b')
OUT = os.path.join(ROOT, 'dist', 'assets', 'l11-v140')
AW = AH = 512
# name: (crop window as fractions, cell w, cell h, roughness, normal strength)
SKINS = {
 'apple':  ((.30, .05, .70, .95), 96, 96, .34, 1.4),
 'orange': ((0, 0, 1, 1), 96, 96, .55, 3.0),
 'lemon':  ((0, .05, 1, .45), 96, 64, .5, 2.6),
 'banana': ((0, 0, 1, 1), 64, 128, .5, 1.6),
 'tomato': ((.0, .55, .45, 1), 96, 80, .2, 1.0),
 'pepper': ((0, 0, 1, 1), 96, 96, .16, 1.2),
 'potato': ((0, 0, 1, 1), 96, 96, .9, 3.2),
 'onion':  ((.06, .02, .46, .42), 96, 96, .72, 2.0),
 'carrot': ((0, 0, 1, 1), 64, 128, .66, 2.2),
 'cabbage': ((.05, .05, .95, .95), 128, 128, .55, 2.4),
}


def crush(im, size):
    im = im.filter(ImageFilter.GaussianBlur(max(0.0, im.width / size[0] * .3)))
    im = im.resize(size, Image.LANCZOS)
    a = (np.asarray(im).astype(np.int32) >> 3 << 3) + 4
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


def wrap_x(im):
    """cross-fade the left/right 18 % so u=0 and u=1 meet without a seam (lathe wraps u around the fruit)"""
    a = np.asarray(im).astype(np.float32)
    h, w, _ = a.shape
    k = int(w * .18)
    out = a[:, k:].copy()  # width w-k; blend its last k columns with a's first k
    t = np.linspace(0, 1, k)[None, :, None]
    out[:, -k:] = out[:, -k:] * (1 - t) + a[:, :k] * t
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))


def proc(name, w, h):
    im = Image.new('RGB', (w, h), (80, 110, 40))
    d = ImageDraw.Draw(im)
    rs = np.random.RandomState(abs(hash(name)) % 9999)
    if name == 'stem':  # woody apple / pepper stem
        im.paste((92, 70, 40), (0, 0, w, h))
        for x in range(0, w, 3):
            d.line([x, 0, x + rs.randint(-2, 3), h], fill=(70 + rs.randint(0, 30), 52, 30))
    elif name == 'calyx':  # tomato / pepper green star seen from above
        im.paste((150, 40, 30), (0, 0, w, h))
        c = w / 2
        for i in range(6):
            a = i / 6 * 2 * np.pi
            d.polygon([(c, c), (c + np.cos(a - .25) * c * .4, c + np.sin(a - .25) * c * .4), (c + np.cos(a) * c * .95, c + np.sin(a) * c * .95),
                       (c + np.cos(a + .25) * c * .4, c + np.sin(a + .25) * c * .4)], fill=(58 + rs.randint(0, 30), 104, 36))
        d.ellipse([c - 5, c - 5, c + 5, c + 5], fill=(80, 120, 50))
    elif name == 'tops':  # carrot leaf stubs
        im.paste((52, 96, 34), (0, 0, w, h))
        for _ in range(60):
            x = rs.randint(0, w)
            d.line([x, h, x + rs.randint(-6, 7), 0], fill=(40 + rs.randint(0, 50), 100 + rs.randint(0, 60), 30), width=2)
    elif name == 'tip':  # banana stem / blossom end
        im.paste((96, 82, 40), (0, 0, w, h))
        for _ in range(40):
            x, y = rs.randint(0, w), rs.randint(0, h)
            d.point((x, y), fill=(40, 34, 20))
    elif name == 'root':  # onion root plate + dry neck
        im.paste((170, 130, 80), (0, 0, w, h))
        c = w / 2
        for _ in range(50):
            a = rs.rand() * 2 * np.pi
            d.line([c, c, c + np.cos(a) * c * rs.uniform(.3, 1), c + np.sin(a) * c * rs.uniform(.3, 1)], fill=(120, 90, 50))
    elif name == 'core':  # cabbage stalk base
        im.paste((214, 220, 170), (0, 0, w, h))
        d.ellipse([w * .3, h * .3, w * .7, h * .7], fill=(186, 196, 140))
    return im.filter(ImageFilter.GaussianBlur(.6))


cells = []
for k, (cr, w, h, rough, ns) in SKINS.items():
    src = Image.open(os.path.join(ART, 'v140_skin_' + k + '.png')).convert('RGB')
    W, H = src.size
    src = src.crop((int(cr[0] * W), int(cr[1] * H), int(cr[2] * W), int(cr[3] * H)))
    src = src.resize((int(w * 1.18) * 4, h * 4), Image.LANCZOS)
    cells.append((k, crush(wrap_x(src), (w, h)), rough, ns))
for k, w, h, rough in [('stem', 16, 32, .8), ('calyx', 32, 32, .6), ('tops', 32, 32, .7), ('tip', 16, 16, .7), ('root', 32, 32, .85), ('core', 32, 32, .5)]:
    cells.append((k, crush(proc(k, w * 4, h * 4), (w, h)), rough, 1.5))


def normal_from(rgb, strength):
    hm = np.asarray(rgb.convert('L').filter(ImageFilter.GaussianBlur(.7))).astype(np.float32) / 255
    gy, gx = np.gradient(np.pad(hm, 1, mode='wrap'))
    gx, gy = gx[1:-1, 1:-1], gy[1:-1, 1:-1]
    nx, ny, nz = -gx * strength, gy * strength, np.ones_like(hm)
    l = np.sqrt(nx * nx + ny * ny + nz * nz)
    return Image.fromarray((np.stack([nx / l * .5 + .5, ny / l * .5 + .5, nz / l * .5 + .5], 2) * 255).astype(np.uint8))


P = 2
base = Image.new('RGB', (AW, AH), (128, 128, 128))
rgh = Image.new('RGB', (AW, AH), (255, 200, 0))
nrm = Image.new('RGB', (AW, AH), (128, 128, 255))
x = y = rowh = 0
rects = {}
for k, im, rough, ns in sorted(cells, key=lambda c: -c[1].height):
    w, h = im.size
    if x + w + 2 * P > AW:
        x, y, rowh = 0, y + rowh, 0
    if y + h + 2 * P > AH:
        raise SystemExit('atlas full at ' + k)
    lum = np.asarray(im.convert('L')).astype(np.float32) / 255
    R = np.clip(rough + (.5 - lum) * .15, .05, 1)  # highlights on the skin read slightly glossier
    orm = Image.fromarray((np.stack([np.ones_like(lum), R, np.zeros_like(lum)], 2) * 255).astype(np.uint8))
    nn = normal_from(im, ns)
    for dst, src in ((base, im), (rgh, orm), (nrm, nn)):
        dst.paste(src.resize((w + 2 * P, h + 2 * P), Image.NEAREST), (x, y))
        dst.paste(src, (x + P, y + P))
    rects[k] = [(x + P) / AW, 1 - (y + P + h) / AH, (x + P + w) / AW, 1 - (y + P) / AH]
    x += w + 2 * P
    rowh = max(rowh, h + 2 * P)
os.makedirs(OUT, exist_ok=True)
base.save(os.path.join(OUT, 'produce140.webp'), quality=92)
rgh.save(os.path.join(OUT, 'produce140_r.webp'), quality=92)
nrm.save(os.path.join(OUT, 'produce140_n.webp'), quality=95)
open(os.path.join(ROOT, 'dist', 'retail140-produce-uv.js'), 'w').write(
    '// generated by bc/tools/retail140_p1b_produce.py — atlas rects [u0,v0,u1,v1]\nexport const UVP140=' +
    json.dumps({k: [round(v, 5) for v in r] for k, r in rects.items()}) + ';\n')
print('cells', len(cells), 'used %.0f%%' % ((y + rowh) / AH * 100))
