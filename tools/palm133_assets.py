#!/usr/bin/env python3
"""V133-palm-plaza textures (all procedural, drawn large then downscaled + quantized to PS1 low-fi).
Output: bc/dist/assets/l11-v133p/*.webp|png
  pavers133 / pavers133_n / pavers133_r  wet terracotta square tiles (3 m repeat, 8x8 tiles), normal, roughness (G = rough)
  stone133 / stone133_n                  dark green-grey cast stone
  mosaic133 / mosaic133_n                blue pool mosaic (1.28 m repeat)
  band133                                deep blue glazed rim tile band
  leaf133                                2x2 atlas of broadleaf clusters (alpha cards)
  leafbody133                            seamless dense leaf mass for canopy volumes
  bark133                                seamless bark
  glow133.png                            radial sodium glow sprite
"""
import os, math, random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
OUT = os.path.join(os.path.dirname(__file__), '..', 'bc', 'dist', 'assets', 'l11-v133p')
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(133)

def noise(n, octaves=5, seed=0, base=4):
    """tileable value noise in [0,1], size n"""
    r = np.random.default_rng(seed); acc = np.zeros((n, n)); amp = 1; tot = 0
    for o in range(octaves):
        f = base * 2 ** o
        g = r.random((f, f))
        im = Image.fromarray((g * 255).astype(np.uint8)).resize((n, n), Image.BICUBIC)
        # make tileable: wrap by resizing a padded grid
        g2 = np.pad(g, ((0, 1), (0, 1)), mode='wrap')
        im = Image.fromarray((g2 * 255).astype(np.uint8)).resize((n + n // f, n + n // f), Image.BICUBIC)
        a = np.asarray(im, dtype=float)[:n, :n] / 255
        acc += a * amp; tot += amp; amp *= .5
    return acc / tot

def lowfi(arr, size, colors=None, blur=0):
    im = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    if blur: im = im.filter(ImageFilter.GaussianBlur(blur))
    im = im.resize((size, size), Image.LANCZOS)
    if colors:
        mode = im.mode
        if mode == 'RGBA':
            a = im.getchannel('A'); im = im.convert('RGB').quantize(colors, dither=Image.FLOYDSTEINBERG).convert('RGB'); im.putalpha(a)
        else: im = im.quantize(colors, dither=Image.FLOYDSTEINBERG).convert('RGB')
    return im

def normal_from(h, strength=4.0):
    gy, gx = np.gradient(np.pad(h, 1, mode='wrap'))
    gx = gx[1:-1, 1:-1]; gy = gy[1:-1, 1:-1]
    n = np.dstack([-gx * strength, gy * strength, np.ones_like(h)])
    n /= np.linalg.norm(n, axis=2, keepdims=True)
    return ((n * .5 + .5) * 255)

def save(im, name, q=88):
    p = os.path.join(OUT, name)
    if name.endswith('.png'): im.save(p)
    else: im.save(p, 'WEBP', quality=q, method=6)
    print('wrote', name, im.size)

N = 1024
# ---------- wet terracotta pavers: 8x8 square tiles per 3 m, 6 mm-ish joints ----------
T8 = 8; cell = N // T8
col = np.zeros((N, N, 3)); h = np.ones((N, N)); rough = np.zeros((N, N))
grain = noise(N, 6, 1, 8); blot = noise(N, 4, 2, 4); puddle = noise(N, 5, 3, 2)
yy, xx = np.mgrid[0:N, 0:N]
r = random.Random(7)
for j in range(T8):
    for i in range(T8):
        base = np.array([172, 88, 58]) * (0.84 + 0.26 * r.random()) + np.array([r.uniform(-8, 8), r.uniform(-6, 6), r.uniform(-4, 4)])
        if r.random() < .12: base = base * np.array([1.08, .92, .85])  # a few burnt tiles
        sl = (slice(j * cell, (j + 1) * cell), slice(i * cell, (i + 1) * cell))
        col[sl] = base
        tilt = (r.random() - .5) * .08
        h[sl] = .85 + tilt * (xx[sl] - i * cell) / cell
jx = (xx % cell); jy = (yy % cell); jw = 5
joint = (np.minimum(jx, cell - 1 - jx) < jw) | (np.minimum(jy, cell - 1 - jy) < jw)
edge = np.clip(np.minimum(np.minimum(jx, cell - 1 - jx), np.minimum(jy, cell - 1 - jy)) / 14, 0, 1)
col *= (0.86 + 0.24 * grain[..., None]) * (0.95 + 0.1 * blot[..., None])
col[joint] = np.array([70, 58, 50]) * (0.8 + 0.4 * grain[joint][:, None])
h = h * (0.6 + 0.4 * edge) + grain * .05; h[joint] = .2
wet = np.clip((puddle - .48) * 5, 0, 1)
col *= (1 - .2 * wet[..., None])  # wet = darker, saturated
col[..., 0] *= 1 + .05 * wet
rough = 150 - 110 * wet; rough[joint] = 60  # water sits in joints
save(lowfi(col, 512, 64, 1), 'pavers133.webp')
save(lowfi(normal_from(h * 6, 1.2), 512), 'pavers133_n.webp', 92)
rr = np.dstack([rough, rough, rough]); save(lowfi(rr, 256, None, 2), 'pavers133_r.webp', 90)

# ---------- dark green-grey cast stone ----------
n1 = noise(N, 7, 11, 4); n2 = noise(N, 3, 12, 2); pits = (noise(N, 2, 13, 64) > .78)
base = np.array([86, 98, 88])
col = base * (0.62 + 0.55 * n1[..., None]) * (0.85 + 0.25 * n2[..., None])
col[..., 1] += 6 * n2
col[pits] *= .7
lich = np.clip((noise(N, 4, 14, 3) - .6) * 4, 0, 1)
col = col * (1 - .35 * lich[..., None]) + np.array([60, 72, 52]) * .35 * lich[..., None]
save(lowfi(col, 256, 48, 1), 'stone133.webp')
save(lowfi(normal_from(n1 * 3 - pits * .3, 1.0), 256), 'stone133_n.webp', 92)

# ---------- blue pool mosaic (32x32 chips per 1.28 m = 4 cm) ----------
C = 32; cs = N // C
col = np.zeros((N, N, 3)); h = np.ones((N, N))
for j in range(C):
    for i in range(C):
        k = r.random()
        b = np.array([46, 104, 168]) if k < .55 else np.array([62, 128, 186]) if k < .85 else np.array([34, 78, 140]) if k < .97 else np.array([170, 196, 210])
        col[j * cs:(j + 1) * cs, i * cs:(i + 1) * cs] = b * (0.92 + 0.16 * r.random())
mj = (np.minimum(xx % cs, cs - 1 - xx % cs) < 3) | (np.minimum(yy % cs, cs - 1 - yy % cs) < 3)
col[mj] = [150, 160, 162]; h[mj] = .3
col *= (0.88 + 0.2 * noise(N, 4, 21, 4)[..., None])
save(lowfi(col, 512, 48, .8), 'mosaic133.webp')
save(lowfi(normal_from(h * 3, 1.0), 512), 'mosaic133_n.webp', 92)

# ---------- deep blue glazed band (10 cm tiles, 8 per 0.8 m along, 2 rows) ----------
col = np.zeros((N, N, 3)); B = 8; bs = N // B
for j in range(B):
    for i in range(B):
        col[j * bs:(j + 1) * bs, i * bs:(i + 1) * bs] = np.array([18, 44, 98]) * (0.85 + 0.3 * r.random())
bj = (np.minimum(xx % bs, bs - 1 - xx % bs) < 5) | (np.minimum(yy % bs, bs - 1 - yy % bs) < 5)
col[bj] = [120, 128, 130]
gl = np.clip(1 - np.hypot((xx % bs) / bs - .35, (yy % bs) / bs - .3) * 3, 0, 1)
col += 40 * gl[..., None] ** 3
save(lowfi(col, 256, 32, .6), 'band133.webp')

# ---------- broadleaf cluster atlas 2x2 (alpha) ----------
def leaf_poly(cx, cy, L, W, a):
    pts = []
    for k in range(13):
        t = k / 12; w = W * math.sin(math.pi * t) ** .8 * (1 - .25 * t)
        pts.append((t * L, w))
    for k in range(12, -1, -1):
        t = k / 12; w = W * math.sin(math.pi * t) ** .8 * (1 - .25 * t)
        pts.append((t * L, -w))
    ca, sa = math.cos(a), math.sin(a)
    return [(cx + x * ca - y * sa, cy + x * sa + y * ca) for x, y in pts]

def cluster(S, seed, leaves=1100, dense=1.0):
    rr = random.Random(seed)
    im = Image.new('RGBA', (S, S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    c = S / 2
    blobs = [(c + rr.uniform(-.2, .2) * S, c + rr.uniform(-.18, .2) * S, rr.uniform(.2, .3) * S) for _ in range(7)]
    for n in range(leaves):
        bx, by, br = rr.choice(blobs)
        ang = rr.uniform(0, math.tau); rad = br * math.sqrt(rr.random())
        x, y = bx + math.cos(ang) * rad, by + math.sin(ang) * rad
        if not (12 < x < S - 12 and 12 < y < S - 12): continue
        L = rr.uniform(.06, .095) * S; W = L * rr.uniform(.26, .36)
        a = rr.uniform(0, math.tau)
        # light from top: leaves lower in the card are darker, later (front) leaves lighter
        lit = .55 + .45 * (1 - y / S) * .6 + .4 * n / leaves
        g = (int(34 * lit + rr.randint(-6, 6)), int(70 * lit + rr.randint(-8, 10)), int(26 * lit + rr.randint(-5, 6)))
        if rr.random() < .08: g = (int(g[0] * 1.5), int(g[1] * 1.25), int(g[2] * 1.2))
        poly = leaf_poly(x, y, L, W, a)
        d.polygon(poly, fill=g + (255,))
        mid = (int(g[0] * .75), int(g[1] * .78), int(g[2] * .7), 255)
        d.line([poly[0], ((poly[6][0] + poly[-7][0]) / 2, (poly[6][1] + poly[-7][1]) / 2), poly[12]], fill=mid, width=2)
    # a few twigs
    for _ in range(10):
        x0, y0 = c + rr.uniform(-.1, .1) * S, S * .9
        d.line([(x0, y0), (x0 + rr.uniform(-.3, .3) * S, y0 - rr.uniform(.3, .55) * S)], fill=(52, 40, 30, 255), width=3)
    return im

S = 1024
atlas = Image.new('RGBA', (2 * S, 2 * S))
for k in range(4):
    atlas.paste(cluster(S, 300 + k), ((k % 2) * S, (k // 2) * S))
small = atlas.resize((512, 512), Image.LANCZOS)
a = np.asarray(small.getchannel('A')); a = np.where(a > 110, 255, 0).astype(np.uint8)
rgb = small.convert('RGB').quantize(48, dither=Image.FLOYDSTEINBERG).convert('RGB'); rgb.putalpha(Image.fromarray(a))
# bleed colour under transparent pixels so mips don't halo
save(rgb, 'leaf133.webp', 92)

# ---------- seamless dense leaf mass for canopy volumes ----------
S2 = 1024; im = Image.new('RGB', (S2, S2), (24, 46, 20)); d = ImageDraw.Draw(im); rr = random.Random(5)
for n in range(2600):
    x, y = rr.uniform(0, S2), rr.uniform(0, S2); L = rr.uniform(40, 70); W = L * rr.uniform(.26, .36); a = rr.uniform(0, math.tau)
    lit = .45 + .55 * n / 2600
    g = (int(34 * lit + rr.randint(-6, 6)), int(72 * lit + rr.randint(-8, 10)), int(26 * lit + rr.randint(-5, 6)))
    for ox in (-S2, 0, S2):
        for oy in (-S2, 0, S2):
            if -80 < x + ox < S2 + 80 and -80 < y + oy < S2 + 80:
                d.polygon(leaf_poly(x + ox, y + oy, L, W, a), fill=g)
save(lowfi(np.asarray(im, dtype=float), 256, 40, .5), 'leafbody133.webp')

# ---------- bark ----------
nb = noise(N, 6, 41, 4); stretch = np.asarray(Image.fromarray((noise(N, 5, 42, 8) * 255).astype(np.uint8)).resize((N, N // 8)).resize((N, N)), dtype=float) / 255
col = np.array([92, 82, 70]) * (0.55 + 0.5 * nb[..., None]) * (0.7 + 0.45 * stretch[..., None])
save(lowfi(col, 256, 32, 1), 'bark133.webp')

# ---------- glow sprite ----------
G = 128; gy, gx = np.mgrid[0:G, 0:G]; d = np.hypot(gx - G / 2 + .5, gy - G / 2 + .5) / (G / 2)
core = np.clip(1 - d, 0, 1); alpha = core ** 2.4 * .9 + np.exp(-d * d * 30) * .6
c = np.dstack([np.full_like(d, 255), 190 + 50 * np.exp(-d * d * 30), 110 + 120 * np.exp(-d * d * 40), np.clip(alpha, 0, 1) * 255])
save(Image.fromarray(np.clip(c, 0, 255).astype(np.uint8), 'RGBA').resize((64, 64), Image.LANCZOS), 'glow133.png')
