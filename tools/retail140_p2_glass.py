#!/usr/bin/env python3
"""V140 P2: cooler-door glass maps for MeshPhysicalMaterial (transmission / IOR 1.5).
Atlas 4 cols x 3 rows of door cells (each generated at 512 x 1280, then downscaled to 256 x 640):
  row 0 = reach-in cooler (patchy condensation, heavier low + at the edges, a wiped smear by the handle, run-down drops)
  row 1 = freezer (ragged edge frost border, heavier in the bottom corners, light haze inside, crystal grain)
  row 2 = beer cave heated glass (mostly clear, a fogged band at the bottom, big drops with clear trails)
Outputs (bc/dist/assets/l11-v140/):
  glass140.webp    baseColor sRGB (transmission tint: near-white clear glass, cold white frost)
  glass140_r.webp  R = transmission (1 clear .. low in frost), G = roughness (fog white = rough, wiped / trail = black)
  glass140_n.webp  tangent normal: drop domes + frost crystal grain
  glass140_e.webp  frost / fog light mask (emissive, the doors are not in the store light bake)
  glass140_env.webp  equirect store interior (troffer rows, shelf bands, floor) -> PMREM'd envMap at runtime
Run from the project root: python3 bc/tools/retail140_p2_glass.py"""
import os
import numpy as np
from PIL import Image, ImageFilter

OUT = 'bc/dist/assets/l11-v140'
CW, CH, S = 256, 640, 2  # cell size, supersample
W, H = CW * S, CH * S
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
v = yy / H  # 0 top .. 1 bottom
u = xx / W


def blur(a, r):
    im = Image.fromarray(np.clip(a * 255, 0, 255).astype(np.uint8))
    return np.asarray(im.filter(ImageFilter.GaussianBlur(r)), np.float32) / 255


def noise(rng, scale, octaves=4):
    out = np.zeros((H, W), np.float32); amp = 1; tot = 0
    for o in range(octaves):
        n = rng.random((max(2, int(H / scale)) + 1, max(2, int(W / scale)) + 1)).astype(np.float32)
        im = Image.fromarray((n * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC)
        out += amp * np.asarray(im, np.float32) / 255; tot += amp; amp *= .5; scale /= 2
    return out / tot


def drops(rng, n, rmin, rmax, bias, trails):
    """height field of drop domes + trail mask (wiped streak above each running drop)."""
    h = np.zeros((H, W), np.float32); tr = np.zeros((H, W), np.float32)
    for _ in range(n):
        y = (rng.random() ** bias) * H; x = rng.random() * W
        r = rmin + (rmax - rmin) * rng.random() ** 3
        y0, y1, x0, x1 = int(max(0, y - r * 1.6)), int(min(H, y + r * 1.3)), int(max(0, x - r * 1.3)), int(min(W, x + r * 1.3))
        if y1 <= y0 or x1 <= x0: continue
        dy = (yy[y0:y1, x0:x1] - y); dx = (xx[y0:y1, x0:x1] - x)
        ry = np.where(dy < 0, r * 1.45, r)  # teardrop: longer upward (gravity flattens the bottom)
        d = (dx / r) ** 2 + (dy / ry) ** 2
        dome = np.sqrt(np.clip(1 - d, 0, 1)) * r / rmax
        h[y0:y1, x0:x1] = np.maximum(h[y0:y1, x0:x1], dome)
        if trails and r > rmax * .45 and rng.random() < .7:  # this one ran: clear trail above, wobbling
            L = int(r * (6 + rng.random() * 22)); tx = x; tw = r * .55
            for k in range(L):
                yk = int(y - r - k)
                if yk < 0: break
                tx += (rng.random() - .5) * .9
                a, b = int(max(0, tx - tw)), int(min(W, tx + tw))
                tr[yk, a:b] = np.maximum(tr[yk, a:b], 1 - k / L * .5)
                if rng.random() < .025:  # beads left along the trail
                    bx, by, br = tx + (rng.random() - .5) * tw, yk, r * (.15 + rng.random() * .2)
                    a2, b2, c2, d2 = int(max(0, by - br)), int(min(H, by + br + 1)), int(max(0, bx - br)), int(min(W, bx + br + 1))
                    if b2 > a2 and d2 > c2:
                        dd = ((xx[a2:b2, c2:d2] - bx) ** 2 + (yy[a2:b2, c2:d2] - by) ** 2) / br ** 2
                        h[a2:b2, c2:d2] = np.maximum(h[a2:b2, c2:d2], np.sqrt(np.clip(1 - dd, 0, 1)) * br / rmax)
    return h, tr


def edge_dist():
    """distance to the nearest glass edge in cell-widths (0 at the edge)."""
    return np.minimum(np.minimum(u, 1 - u) * W, np.minimum(v, 1 - v) * H) / W


def cell(kind, seed):
    rng = np.random.default_rng(seed)
    ed = edge_dist(); n1 = noise(rng, 90); n2 = noise(rng, 22, 3); grain = rng.random((H, W)).astype(np.float32)
    frost = np.zeros((H, W), np.float32)
    if kind == 0:  # reach-in: condensation patches, low + edges, wiped smear near the handle side
        fog = np.clip((v - .35) * 1.6, 0, 1) * .7 + np.clip(.12 - ed, 0, 1) * 5 + (n1 - .45) * 1.4
        side = seed & 1; hx = (1 - u) if side else u  # handle at the low-u or high-u edge per variant
        smear = np.exp(-((hx - .2) / .12) ** 2 - ((v - .5) / .22) ** 2) * (n2 > .42)
        fog = np.clip(fog, 0, 1) * (1 - np.clip(smear * 1.6, 0, 1) * .9)
        h, tr = drops(rng, 1400, 2.5, 13, .7, True)
        fog = np.clip(fog, 0, 1) * (1 - tr * .95)
        rough = .04 + fog * .7; trans = 1 - fog * .12
    elif kind == 1:  # freezer: ragged frost border + bottom corners, inner light haze
        corner = np.clip(1 - np.hypot(np.minimum(u, 1 - u) * W, (1 - v) * H) / (W * .55), 0, 1)
        border = .06 + .08 * n1 + .22 * corner ** 1.5 + .05 * np.clip(v - .8, 0, 1) * 5
        frost = np.clip((border - ed) / .045 + (n2 - .5) * 1.1, 0, 1)
        frost = np.clip(frost + (grain > .985) * (ed < border * 1.6) * .8, 0, 1)
        fog = np.clip(.18 + (n1 - .5) * .6 + np.clip(v - .6, 0, 1), 0, 1) * (1 - frost)
        h, tr = drops(rng, 500, 2, 8, 1.0, False); h *= (1 - frost)
        fog = fog * (1 - tr)
        rough = .05 + fog * .5 + frost * .9; trans = 1 - fog * .1 - frost * .82
        h = h + frost * (grain * .25 + n2 * .35)  # crystal grain
    else:  # beer cave heated door: clear, fogged band at the bottom, big drops + long trails
        fog = np.clip((v - .78) * 5, 0, 1) * (.6 + .5 * n1) + np.clip(.05 - ed, 0, 1) * 8
        h, tr = drops(rng, 900, 3, 16, .45, True)
        fog = np.clip(fog, 0, 1) * (1 - tr)
        rough = .03 + fog * .75; trans = 1 - fog * .1
    rough = np.clip(rough * (1 - np.clip(h * 3, 0, 1) * .8), 0, 1)  # drop domes themselves are smooth water
    # normal from height (drops) + fine fog micro-grain
    hh = blur(np.clip(h, 0, 1), 1.2) + fog * grain * .02
    gy, gx = np.gradient(hh * 18)
    nrm = np.stack([-gx, gy, np.ones_like(gx)], -1); nrm /= np.linalg.norm(nrm, axis=-1, keepdims=True)
    base = np.stack([.93 + 0 * u, .965 + 0 * u, .975 + 0 * u], -1) * (1 - frost[..., None]) + \
        np.stack([.86 + .1 * grain, .92 + .07 * grain, .98 + 0 * grain], -1) * frost[..., None]
    emis = np.clip(frost * .9 + fog * .22, 0, 1)
    return base, np.stack([trans, rough, np.zeros_like(rough)], -1), nrm * .5 + .5, emis


def down(a):
    im = Image.fromarray(np.clip(a * 255, 0, 255).astype(np.uint8))
    return np.asarray(im.resize((CW, CH), Image.LANCZOS))


def env():
    """equirect 512x256 store interior: white ceiling with troffer rows, shelf colour bands on the walls, grey floor."""
    EW, EH = 1024, 512
    rng = np.random.default_rng(140)
    y, x = np.mgrid[0:EH, 0:EW].astype(np.float32)
    th = (y / EH) * np.pi; ph = (x / EW) * 2 * np.pi
    dy = np.cos(th); dx = np.sin(th) * np.cos(ph); dz = np.sin(th) * np.sin(ph)
    img = np.zeros((EH, EW, 3), np.float32)
    ceil = dy > .25; floor_ = dy < -.2
    img[:] = [.42, .42, .4]
    with np.errstate(divide='ignore', invalid='ignore'):
        cx = dx / np.maximum(dy, 1e-3) * 3; cz = dz / np.maximum(dy, 1e-3) * 3
        trof = (np.abs(((cx + .6) % 2.4) - 1.2) < .3) & (np.abs((cz % 1.8) - .9) < .55)
    img[ceil] = [.78, .79, .78]
    img[ceil & trof] = [6, 5.9, 5.5]  # bright troffers -> highlight streaks on the glass
    with np.errstate(divide='ignore', invalid='ignore'):
        fx = dx / np.minimum(dy, -1e-3); fz = dz / np.minimum(dy, -1e-3)
        tile = ((np.floor(fx * 2) + np.floor(fz * 2)) % 2)
    img[floor_] = (.32 + .06 * tile[..., None])[floor_] * np.array([1, 1, .96])
    wall = ~ceil & ~floor_
    pal = np.array([[.8, .2, .15], [.95, .75, .2], [.2, .45, .8], [.9, .9, .85], [.25, .6, .3], [.7, .3, .6], [.95, .5, .15]], np.float32)
    seg = (np.floor(ph / (2 * np.pi) * 64)).astype(int); band = np.floor((dy + .2) / .09).astype(int)
    idx = (seg * 7 + band * 13 + (seg * band) % 5) % len(pal)
    shelfc = pal[idx] * (.55 + .25 * rng.random((EH, EW, 1)))
    gap = ((dy + .2) % .09) < .012
    sh = np.where(gap[..., None], [[.85, .85, .82]], shelfc)
    img[wall] = sh[wall]
    img = img / (1 + img * .0)  # keep >1 values for highlights; store as RGBE-ish via clamp in LDR then boost in JS
    return np.clip(img / 6, 0, 1) ** (1 / 2.2)


def main():
    os.makedirs(OUT, exist_ok=True)
    A = [np.zeros((CH * 3, CW * 4, c), np.uint8) for c in (3, 3, 3)]; E = np.zeros((CH * 3, CW * 4), np.uint8)
    for row in range(3):
        for col in range(4):
            b, r, n, e = cell(row, 1400 + row * 31 + col * 7)
            sl = (slice(row * CH, (row + 1) * CH), slice(col * CW, (col + 1) * CW))
            A[0][sl] = down(b); A[1][sl] = down(r); A[2][sl] = down(n); E[sl] = down(e)
    for a, nm in zip(A, ('glass140', 'glass140_r', 'glass140_n')):
        Image.fromarray(a).save(f'{OUT}/{nm}.webp', quality=92 if nm == 'glass140' else 96, method=6)
    Image.fromarray(E).resize((CW * 2, CH * 3 // 2), Image.LANCZOS).save(f'{OUT}/glass140_e.webp', quality=90)
    Image.fromarray((env() * 255).astype(np.uint8)).save(f'{OUT}/glass140_env.webp', quality=90)
    print('ok')


if __name__ == '__main__':
    main()
