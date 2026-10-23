# V137 Q4 crowd garments (notes/spec-1020-crowd-quality.md "Q4"): every garment panel repainted at 512² ON THE V137 BODY UV
# (bodies137.py split137) with the reference-image (The Imitator PS1 cast, files/uploads/ba7f08…webp) look: baked fold
# light/shade, plackets + buttons, collars/lapels, pockets, hems, seams; fabric grain comes from the V135 photo panels
# (art-v135crowd/retro/z_*.png, high-passed + mirror-tiled), so the V75 photographic feel stays. Each panel is generated on
# its own at 512² (saved to art-v137crowd/garments/), then reduced V75-style (LANCZOS 256, blur, BOX 64, 96 colours/cell).
# Output: bc/dist/assets/crowd135/garments135.png, SAME cell order / size as garments135.py (dist/crowd135.js G135), so the
# per-seed YIQ hue / value / tint recolour keeps working unchanged.
#   python3 bc/scripts/crowd137/garments137.py
# UV facts (measured from crowd135.bin, heights y in units of body height H, identical for all 4 types):
#   top front/back cell: v = (.924 - y) / .347 (hem at v .97); u .5 = centre front (front: +x = character's left = u > .5,
#     back: u < .5 = character's left); u .03/.97 = side seams. chest v .2-.45, armpit v .47, waist v .76.
#   coat front/back: v = (.92 - y) / .65 (waist v .40, hip pockets v .57, hem v .97).
#   sleeve: v 0 = shoulder top, 1 = wrist; short-sleeve hem v ~.45; u .5 = front AND back centre line (they overlap),
#     u .95 = outside of the arm, .05 = inside.
#   bottoms: v = (.607 - y) / .543; waist band v 0-.05, crotch v .30, knee v .60, hem v .97. left half = character's right
#     leg (centre u .25), right half = left leg (.75); outer seams u .02/.98, inseams .48/.52; front and back overlap.
#   skirt: v 0 = waistband (y .60), 1 = hem; u .5 ± .48 sin(angle) (front/back overlap).
from PIL import Image, ImageFilter, ImageDraw
import numpy as np, os, math
R = os.path.dirname(os.path.abspath(__file__)) + '/../../..'
D = R + '/art-v135crowd/retro/'; O = R + '/bc/dist/assets/crowd135/'; BIG = R + '/art-v137crowd/garments/'
os.makedirs(BIG, exist_ok=True)
TOPS = ['tee', 'breton', 'chambray', 'floral', 'hoodie', 'knit', 'leather']
COATS = ['trench', 'wool']
BOTS = ['jeans', 'blackjeans', 'chinos', 'greytrousers', 'tartanskirt', 'navyskirt']
S = 512; C = 64; PER = 8
U, V = np.meshgrid((np.arange(S) + .5) / S, (np.arange(S) + .5) / S)
rng = np.random.default_rng(137)
FK = 1.7      # fold contrast boost (the reference cast bakes strong light/shade into the cloth)

def lowfi(im):
  im = im.convert('RGB').resize((256, 256), Image.LANCZOS).filter(ImageFilter.GaussianBlur(.6)).resize((C, C), Image.BOX)
  return im.quantize(96, method=Image.MEDIANCUT, dither=Image.NONE).convert('RGB')

def blur(a, r):
  if a.ndim == 2:   # separable gaussian (reflect padding)
    k = np.exp(-.5 * (np.arange(-3 * int(r + 1), 3 * int(r + 1) + 1) / r) ** 2); k /= k.sum(); n = len(k) // 2
    b = np.pad(a.astype(np.float32), n, mode='reflect')
    b = np.apply_along_axis(lambda x: np.convolve(x, k, 'valid'), 0, b)
    return np.apply_along_axis(lambda x: np.convolve(x, k, 'valid'), 1, b)
  return np.stack([blur(a[..., i], r) for i in range(a.shape[2])], -1)

def src(name):
  return np.asarray(Image.open(D + name).convert('RGB')).astype(np.float32) / 255

def tile(crop, rep):
  """mirror-tile a crop to a seamless S² sheet with `rep` crop-widths across"""
  n = max(8, int(S / rep)); c = np.asarray(Image.fromarray((crop * 255).astype(np.uint8)).resize((n, n), Image.LANCZOS)).astype(np.float32) / 255
  m = np.concatenate([np.concatenate([c, c[:, ::-1]], 1), np.concatenate([c[::-1], c[::-1, ::-1]], 1)], 0)
  k = int(math.ceil(S / (2 * n))) + 1
  return np.tile(m, (k, k, 1))[:S, :S]

def grain(name, box=(.3, .38, .7, .78), rep=1., k=1.0):
  """(base colour, luminance grain sheet ~1) from a V135 photo panel"""
  a = src(name); h, w = a.shape[:2]
  c = a[int(h * box[1]):int(h * box[3]), int(w * box[0]):int(w * box[2])]
  base = np.median(c.reshape(-1, 3), 0)
  # one crop stretched over the panel (no mirror tiling: that left kaleidoscope diamonds); rep > 1 = finer pattern repeat
  t = tile(c, rep) if rep > 1 else np.asarray(Image.fromarray((c * 255).astype(np.uint8)).resize((S, S), Image.LANCZOS)).astype(np.float32) / 255
  L = t.mean(2); g = L - blur(L, 2)                                        # fine weave only: photo seams/pockets drop out
  g = 1 + np.clip(k * g / max(.02, L.mean()), -.15, .15)
  return base, g, t

# ---- painting helpers (all in uv of one cell, 0..1) ----
def gauss(d, w): return np.exp(-(d / w) ** 2)
def seg_dist(px, py, a, b):
  ax, ay = a; bx, by = b; dx, dy = bx - ax, by - ay; L2 = dx * dx + dy * dy + 1e-12
  t = np.clip(((px - ax) * dx + (py - ay) * dy) / L2, 0, 1)
  return np.hypot(px - ax - t * dx, py - ay - t * dy), t
def poly_dist(pts):
  d = np.full(U.shape, 9.)
  for a, b in zip(pts[:-1], pts[1:]): d = np.minimum(d, seg_dist(U, V, a, b)[0])
  return d
def fold(sh, pts, w=.012, depth=.28, hi=.14, side=(0., -1.)):
  """crease: dark core along the polyline + soft highlight offset to one side (light comes from above)"""
  depth *= FK; hi *= FK; w *= 1.25                                       # read at 64²: bolder than life
  d = poly_dist(pts); sh -= depth * gauss(d, w)
  q = [(x + side[0] * w * 1.6, y + side[1] * w * 1.6) for x, y in pts]
  sh += hi * gauss(poly_dist(q), w * 1.3)
def wavy(y0, x0, x1, amp, n, ph=0., steps=24):
  return [(x0 + (x1 - x0) * i / steps, y0 + amp * math.sin(ph + n * math.pi * i / steps)) for i in range(steps + 1)]

class Panel:
  def __init__(s, base, g, scale=1.):
    s.col = np.ones((S, S, 3), np.float32) * base; s.g = g; s.sh = np.zeros((S, S), np.float32)
    s.ov = Image.new('RGBA', (S * 2, S * 2), (0, 0, 0, 0)); s.dr = ImageDraw.Draw(s.ov)
  def P(s, pts): return [(x * S * 2, y * S * 2) for x, y in pts]
  def line(s, pts, rgba, w): s.dr.line(s.P(pts), fill=rgba, width=max(1, int(w * 1.5 * S * 2)), joint='curve')
  def poly(s, pts, rgba, outline=None, w=.004):
    s.dr.polygon(s.P(pts), fill=rgba)
    if outline: s.dr.line(s.P(pts + [pts[0]]), fill=outline, width=max(1, int(w * 1.8 * S * 2)))
  def button(s, x, y, r, rgb, ring=None):
    R_ = r * 1.5 * S * 2; X, Y = x * S * 2, y * S * 2
    s.dr.ellipse([X - R_ * 1.35, Y - R_ * 1.35, X + R_ * 1.35, Y + R_ * 1.35], fill=(0, 0, 0, 70))   # cast shade
    s.dr.ellipse([X - R_, Y - R_, X + R_, Y + R_], fill=tuple(rgb) + (255,), outline=ring or (0, 0, 0, 160), width=max(1, int(R_ * .25)))
    s.dr.ellipse([X - R_ * .45, Y - R_ * .55, X - R_ * .05, Y - R_ * .15], fill=(255, 255, 255, 110))
  def stitch(s, pts, rgba=(255, 255, 255, 60), w=.0025, dash=.012):
    for a, b in zip(pts[:-1], pts[1:]):
      L = math.hypot(b[0] - a[0], b[1] - a[1]); n = max(1, int(L / dash))
      for i in range(0, n, 2):
        t0, t1 = i / n, min(1, (i + 1) / n)
        s.line([(a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0), (a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1)], rgba, w)
  def region_shade(s, mask, k): s.sh += k * mask
  def out(s, name, sides=.22):
    sh = s.sh - sides * np.abs(2 * U - 1) ** 3                      # wrap-around falloff at the side seams
    ov = np.asarray(s.ov.resize((S, S), Image.LANCZOS)).astype(np.float32) / 255
    img = s.col * (1 - ov[..., 3:]) + ov[..., :3] * ov[..., 3:]          # trims painted first, so grain + folds run over them
    img = img * (1 + (s.g[..., None] - 1) * .8) * np.clip(1 + sh, .25, 1.8)[..., None]
    im = Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8)); im.save(BIG + name + '.png'); return im

def dark(base, k): return tuple(int(c * 255 * k) for c in base)
def rgba(base, k, a): return dark(base, k) + (a,)
def hash_folds(p, n, v0, v1, seed, w=.012, depth=.2, ang=.25):
  r = np.random.default_rng(seed)
  for _ in range(n):
    x = r.uniform(.12, .88); y = r.uniform(v0, v1); L = r.uniform(.05, .12); a = r.uniform(-ang, ang) + (math.pi / 2 if r.random() < .5 else 0) * 0
    fold(p.sh, [(x - L * math.cos(a), y - L * math.sin(a)), (x, y + r.uniform(-.01, .01)), (x + L * math.cos(a), y + L * math.sin(a))], w, depth * r.uniform(.6, 1.1), .1)

# ---- shared torso / sleeve shaping (shirt-like tops) ----
def torso_common(p, front, hem=True, tuck=False, base=None):
  # armpit drag lines: from the armpit corners diagonally toward the centre (softer on the back)
  q = 1. if front else .45
  for sgn in (-1, 1):
    x0 = .5 + sgn * .44
    fold(p.sh, [(x0, .44), (.5 + sgn * .3, .52), (.5 + sgn * .2, .58)], .016, .26 * q, .14 * q)
    fold(p.sh, [(x0, .5), (.5 + sgn * .32, .6), (.5 + sgn * .24, .66)], .013, .18 * q, .14 * q)
  # chest underside shadow + waist blouse folds above the hem
  p.sh += -.12 * gauss(V - .46, .05) * gauss(U - .5, .3)
  for i, y in enumerate((.78, .84, .9)):
    fold(p.sh, wavy(y, .06, .94, .012, 3 + i, i * 1.3), .011, .14, .08)
  if hem:
    p.sh += -.25 * gauss(V - .965, .012); p.sh += .12 * gauss(V - .935, .012)
  # shoulder-top highlight band (seen from above) and shoulder seam
  p.sh += .1 * gauss(V - .09, .04)
  for sgn in (-1, 1): fold(p.sh, [(.5 + sgn * .2, .055), (.5 + sgn * .46, .12)], .006, .18, .06)

def sleeve_common(p, short=True, cuff=None):
  # armpit side (u small) shaded, outside (u .95) lit; elbow creases on long sleeves
  p.sh += -.18 * gauss(U - .02, .12) + .08 * gauss(U - .9, .12)
  fold(p.sh, [(.05, .18), (.2, .26), (.35, .3)], .015, .22)
  fold(p.sh, [(.05, .28), (.18, .34), (.3, .37)], .012, .16)
  fold(p.sh, [(.4, .04), (.6, .06), (.8, .04)], .02, .12, .05)       # shoulder cap seam
  if short:
    y = .43; p.sh += -.3 * gauss(V - y, .01) + .12 * gauss(V - (y - .03), .012)
    fold(p.sh, wavy(.36, .08, .92, .01, 2), .01, .14)
  else:
    for y in (.52, .56, .6): fold(p.sh, wavy(y, .1, .9, .015, 2, y * 9), .012, .18)
    if cuff is not None:
      p.sh += -.3 * gauss(V - cuff, .01) + .1 * gauss(V - (cuff + .03), .02)

# =====================================================================================================================
def tee():
  base, g, _ = grain('z_top_tee_f.png', k=.8)
  f = Panel(base, g); torso_common(f, True)
  # crew-neck rib band
  f.line(wavy(.06, .34, .66, .0, 1), rgba(base, .7, 0), .001)
  pts = [(.34 + .32 * i / 20, .055 + .05 * math.sin(math.pi * i / 20)) for i in range(21)]
  f.line(pts, rgba(base, .92, 255), .028); f.line([(x, y + .016) for x, y in pts], rgba(base, .62, 200), .005)
  f.line([(x, y - .014) for x, y in pts], rgba(base, .75, 150), .004)
  # left-breast patch pocket
  f.poly([(.57, .25), (.68, .25), (.68, .37), (.625, .385), (.57, .37)], rgba(base, .97, 255), rgba(base, .62, 230), .004)
  f.line([(.57, .27), (.68, .27)], rgba(base, .7, 160), .003)
  b = Panel(base, g); torso_common(b, False)
  pts = [(.36 + .28 * i / 20, .05 + .018 * math.sin(math.pi * i / 20)) for i in range(21)]
  b.line(pts, rgba(base, .92, 255), .022); b.line([(x, y + .013) for x, y in pts], rgba(base, .62, 200), .005)
  b.poly([(.47, .07), (.53, .07), (.53, .1), (.47, .1)], (200, 40, 40, 200))            # neck label shadow-through
  s = Panel(base, g); sleeve_common(s, True)
  return [f.out('tee_f'), b.out('tee_b'), s.out('tee_s')]

def breton():
  base, g, _ = grain('z_top_breton_f.png', box=(.3, .4, .7, .8), k=.5)
  ecru = np.array([.9, .88, .82]); navy = np.array([.12, .15, .3])
  def stripes(p, vscale, v0=.12, period=.042):          # period in body-height units -> horizontal on the body
    y = V * vscale; band = ((y / period) % 1) < .42
    p.col[:] = np.where(((band) & (V > v0))[..., None], navy, ecru)
  f = Panel(base, g); stripes(f, .347); torso_common(f, True)
  f.poly([(.3, .02), (.7, .02), (.68, .075), (.32, .075)], rgba(ecru, .95, 255))           # boat neck facing
  f.line([(.31, .078), (.69, .078)], rgba(ecru, .6, 200), .006)
  b = Panel(base, g); stripes(b, .347); torso_common(b, False)
  b.poly([(.32, .02), (.68, .02), (.66, .07), (.34, .07)], rgba(ecru, .95, 255)); b.line([(.33, .072), (.67, .072)], rgba(ecru, .6, 200), .006)
  s = Panel(base, g); stripes(s, .29, .0); sleeve_common(s, True)
  return [f.out('breton_f'), b.out('breton_b'), s.out('breton_s')]

def shirt_front(f, base, btn, collar_rgb, pockets=2, flap=True):
  torso_common(f, True)
  # placket: two edge stitches + overlap shadow, buttons
  f.poly([(.475, .1), (.525, .1), (.525, .97), (.475, .97)], rgba(base, 1.03, 120))
  f.line([(.475, .1), (.475, .97)], rgba(base, .55, 220), .004); f.line([(.528, .1), (.528, .97)], rgba(base, .7, 160), .003)
  for i in range(6): f.button(.5, .16 + i * .145, .011, btn)
  # spread collar: two points + stand
  for sgn in (-1, 1):
    pts = [(.5 + sgn * .02, .05), (.5 + sgn * .17, .04), (.5 + sgn * .13, .2), (.5 + sgn * .03, .12)]
    f.poly([(x + .006, y + .012) for x, y in pts], (0, 0, 0, 80))
    f.poly(pts, collar_rgb + (255,), dark(base, .55) + (230,), .004)
    f.line([(.5 + sgn * .14, .05), (.5 + sgn * .115, .17)], (255, 255, 255, 40), .006)
  f.poly([(.47, .05), (.53, .05), (.515, .12), (.485, .12)], rgba(base, .45, 200))       # open neck shadow
  for k in range(pockets):
    x0 = .56 if k == 0 else .32
    f.poly([(x0, .27), (x0 + .12, .27), (x0 + .12, .4), (x0 + .06, .415), (x0, .4)], rgba(base, 1.0, 255), rgba(base, .55, 230), .004)
    if flap:
      f.poly([(x0 - .005, .255), (x0 + .125, .255), (x0 + .125, .3), (x0 + .06, .315), (x0 - .005, .3)], rgba(base, 1.04, 255), rgba(base, .5, 240), .004)
      f.button(x0 + .06, .295, .008, btn)
    f.sh += -.12 * gauss(V - .42, .01) * (np.abs(U - x0 - .06) < .07)

def shirt_back(b, base, collar_rgb):
  torso_common(b, False)
  b.poly([(.33, .03), (.67, .03), (.65, .1), (.35, .1)], collar_rgb + (255,), dark(base, .55) + (220,), .004)  # collar band
  b.line([(.04, .22), (.96, .22)], rgba(base, .6, 200), .004); b.stitch([(.04, .235), (.96, .235)], rgba(base, .7, 160))  # yoke seam
  fold(b.sh, [(.5, .23), (.5, .5)], .02, .2, .1)                                                  # box pleat
  fold(b.sh, [(.47, .235), (.49, .3)], .008, .2); fold(b.sh, [(.53, .235), (.51, .3)], .008, .2)

def chambray():
  base, g, _ = grain('z_top_chambray_f.png', box=(.15, .45, .4, .85), k=1.)
  btn = dark(base, 1.25); btn = tuple(min(255, c) for c in btn); col = tuple(int(c * 255 * .97) for c in base)
  f = Panel(base, g); shirt_front(f, base, btn, col)
  b = Panel(base, g); shirt_back(b, base, col)
  s = Panel(base, g); sleeve_common(s, True); s.stitch([(.05, .4), (.95, .4)], rgba(base, 1.3, 90))
  return [f.out('chambray_f'), b.out('chambray_b'), s.out('chambray_s')]

def floral():
  base, g, t = grain('z_top_floral_f.png', box=(.06, .3, .42, .7), rep=1., k=.3)
  def pat(p): p.col[:] = t * .97
  btn = (238, 232, 220)
  f = Panel(base, g); pat(f); torso_common(f, True)
  # blouse: rounded peter-pan collar + short placket with small buttons, gathered yoke
  for sgn in (-1, 1):
    cx = .5 + sgn * .085
    f.dr.ellipse(f.P([(cx - .09, .02), (cx + .09, .17)])[0] + f.P([(cx + .09, .17)])[0], fill=(0, 0, 0, 70))
    f.dr.chord(f.P([(cx - .085, -.03)])[0] + f.P([(cx + .085, .15)])[0], 0, 180, fill=(246, 240, 228, 255), outline=(150, 140, 120, 230), width=4)
  f.line([(.5, .12), (.5, .5)], (120, 110, 95, 200), .004)
  for i in range(4): f.button(.5, .17 + i * .095, .008, btn)
  for x in np.linspace(.3, .7, 9): fold(f.sh, [(x, .2), (x + (x - .5) * .15, .34)], .007, .16, .08)
  b = Panel(base, g); pat(b); torso_common(b, False)
  b.dr.chord(b.P([(.36, -.04)])[0] + b.P([(.64, .1)])[0], 0, 180, fill=(246, 240, 228, 255), outline=(150, 140, 120, 230), width=4)
  for x in np.linspace(.35, .65, 7): fold(b.sh, [(x, .14), (x + (x - .5) * .2, .3)], .007, .15, .08)
  s = Panel(base, g); pat(s); sleeve_common(s, True)
  for x in np.linspace(.2, .8, 6): fold(s.sh, [(x, .02), (x, .12)], .01, .15, .08)   # puffed cap gathers
  return [f.out('floral_f'), b.out('floral_b'), s.out('floral_s')]

def hoodie():
  base, g, _ = grain('z_top_hoodie_f.png', box=(.3, .45, .7, .62), k=.8)
  f = Panel(base, g); torso_common(f, True, hem=False)
  # hood lying round the neck, drawstrings with aglets, kangaroo pocket, rib hem band
  pts = [(.28 + .44 * i / 24, .04 + .1 * math.sin(math.pi * i / 24)) for i in range(25)]
  f.line(pts, rgba(base, 1.05, 255), .07); f.line([(x, y + .035) for x, y in pts], rgba(base, .55, 220), .006)
  f.line([(x, y - .03) for x, y in pts], rgba(base, .7, 160), .004)
  for sgn in (-1, 1):
    f.line([(.5 + sgn * .05, .14), (.5 + sgn * .055, .3), (.5 + sgn * .045, .36)], (235, 235, 230, 255), .008)
    f.line([(.5 + sgn * .045, .36), (.5 + sgn * .044, .385)], (60, 60, 60, 255), .01)
  kp = [(.27, .62), (.73, .62), (.8, .88), (.2, .88)]
  f.poly([(x + .008, y + .01) for x, y in kp], (0, 0, 0, 60)); f.poly(kp, rgba(base, 1.02, 255), rgba(base, .55, 230), .005)
  f.line([(.27, .62), (.2, .75)], rgba(base, .45, 230), .006); f.line([(.73, .62), (.8, .75)], rgba(base, .45, 230), .006)
  f.sh += -.12 * gauss(V - .9, .02) * (np.abs(U - .5) < .3)
  f.poly([(0, .9), (1, .9), (1, 1), (0, 1)], rgba(base, .88, 255))
  for x in np.arange(0, 1, .02): f.line([(x, .9), (x, 1)], rgba(base, .7, 120), .003)
  b = Panel(base, g); torso_common(b, False, hem=False)
  hood = [(.24, .02), (.76, .02), (.72, .2), (.6, .36), (.5, .39), (.4, .36), (.28, .2)]
  b.poly([(x + .01, y + .02) for x, y in hood], (0, 0, 0, 90)); b.poly(hood, rgba(base, 1.04, 255), rgba(base, .5, 230), .006)
  b.line([(.5, .05), (.5, .37)], rgba(base, .55, 200), .005)
  fold(b.sh, [(.32, .08), (.42, .3)], .02, .2, .1); fold(b.sh, [(.68, .08), (.58, .3)], .02, .2, .1)
  b.poly([(0, .9), (1, .9), (1, 1), (0, 1)], rgba(base, .88, 255))
  for x in np.arange(0, 1, .02): b.line([(x, .9), (x, 1)], rgba(base, .7, 120), .003)
  s = Panel(base, g); sleeve_common(s, True)
  return [f.out('hoodie_f'), b.out('hoodie_b'), s.out('hoodie_s')]

def knit():
  base, g, _ = grain('z_top_knit_f.png', box=(.3, .5, .7, .8), k=.5)
  def cables(p, vs):
    for cx in (.2, .38, .62, .8):
      ph = (V * vs / .05) % 1
      sw = np.abs(U - cx - .025 * np.sin(2 * math.pi * ph)); sw2 = np.abs(U - cx + .025 * np.sin(2 * math.pi * ph))
      p.sh += .16 * gauss(sw, .012) + .16 * gauss(sw2, .012) - .2 * gauss(np.abs(U - cx) - .05, .006)
    p.sh += .05 * np.sin(U * S * .9)                                           # ribs of stocking stitch
  f = Panel(base, g); cables(f, .347); torso_common(f, True, hem=False)
  pts = [(.35 + .3 * i / 20, .055 + .05 * math.sin(math.pi * i / 20)) for i in range(21)]
  f.line(pts, rgba(base, .9, 255), .04)
  for i in range(0, 21, 1): f.line([pts[i], (pts[i][0], pts[i][1] + .02)], rgba(base, .65, 140), .003)
  for p_ in (f,):
    p_.poly([(0, .9), (1, .9), (1, 1), (0, 1)], rgba(base, .9, 255))
    for x in np.arange(0, 1, .016): p_.line([(x, .9), (x, 1)], rgba(base, .62, 150), .004)
  b = Panel(base, g); cables(b, .347); torso_common(b, False, hem=False)
  b.line([(.36 + .28 * i / 20, .05 + .02 * math.sin(math.pi * i / 20)) for i in range(21)], rgba(base, .9, 255), .035)
  b.poly([(0, .9), (1, .9), (1, 1), (0, 1)], rgba(base, .9, 255))
  for x in np.arange(0, 1, .016): b.line([(x, .9), (x, 1)], rgba(base, .62, 150), .004)
  s = Panel(base, g); s.sh += .05 * np.sin(U * S * .9); sleeve_common(s, True)
  return [f.out('knit_f'), b.out('knit_b'), s.out('knit_s')]

def leather():
  base, g, _ = grain('z_top_leather_f.png', box=(.15, .5, .4, .8), k=.7)
  zipc = (170, 170, 165, 255)
  def shine(p, n, seed):
    r = np.random.default_rng(seed)
    for _ in range(n):
      x, y = r.uniform(.1, .9), r.uniform(.1, .9); p.sh += .35 * gauss(np.hypot((U - x) * 1.6, V - y), r.uniform(.02, .05))
  f = Panel(base, g); torso_common(f, True); shine(f, 7, 1)
  # biker jacket: asymmetric diagonal zip, notch lapels with snaps, zip pockets, belted hem
  zp = [(.62, .06), (.58, .3), (.5, .45), (.47, .97)]
  f.line(zp, (25, 25, 25, 255), .016); f.line(zp, zipc, .005)
  for sgn, cx in ((-1, .38), (1, .7)):
    lap = [(cx - .1 * sgn * -1, .04), (cx + sgn * .14, .1), (cx + sgn * .12, .26), (cx, .34)] if sgn > 0 else [(.4, .04), (.24, .1), (.27, .26), (.42, .36)]
    f.poly([(x + .008, y + .014) for x, y in lap], (0, 0, 0, 120)); f.poly(lap, tuple(min(255, int(c * 255) + 38) for c in base) + (255,), (5, 5, 5, 240), .004)
    f.button(lap[2][0] + .01 * -sgn, lap[2][1] - .02, .009, (180, 180, 175))
  for x0 in (.18, .66): f.line([(x0, .58), (x0 + .16, .52)], (20, 20, 20, 255), .012); f.line([(x0, .58), (x0 + .16, .52)], zipc, .004)
  f.line([(.27, .32), (.36, .26)], (20, 20, 20, 255), .01); f.line([(.27, .32), (.36, .26)], zipc, .003)
  f.poly([(0, .88), (1, .88), (1, .97), (0, .97)], rgba(base, .95, 255), (8, 8, 8, 220), .004)
  f.poly([(.08, .885), (.15, .885), (.15, .965), (.08, .965)], (0, 0, 0, 0), zipc, .006)
  b = Panel(base, g); torso_common(b, False); shine(b, 6, 2)
  b.poly([(.3, .02), (.7, .02), (.68, .1), (.32, .1)], tuple(min(255, int(c * 255) + 38) for c in base) + (255,), (5, 5, 5, 240), .004)
  b.line([(.06, .3), (.5, .34), (.94, .3)], (10, 10, 10, 200), .005)
  b.poly([(0, .88), (1, .88), (1, .97), (0, .97)], rgba(base, .95, 255), (8, 8, 8, 220), .004)
  s = Panel(base, g); sleeve_common(s, True); shine(s, 4, 3)
  s.line([(.9, .05), (.9, .42)], (10, 10, 10, 160), .004)
  return [f.out('leather_f'), b.out('leather_b'), s.out('leather_s')]

def coat_common(p):
  for sgn in (-1, 1):
    fold(p.sh, [(.5 + sgn * .44, .2), (.5 + sgn * .3, .3)], .02, .2)
    fold(p.sh, [(.5 + sgn * .25, .45), (.5 + sgn * .28, .97)], .025, .22, .12)          # long skirt folds
    fold(p.sh, [(.5 + sgn * .4, .5), (.5 + sgn * .43, .97)], .02, .18, .1)
  p.sh += -.3 * gauss(V - .97, .01) + .12 * gauss(V - .94, .012)
  p.sh += .1 * gauss(V - .06, .04)

def trench():
  base, g, _ = grain('z_coat_trench_f.png', box=(.62, .6, .78, .72), k=.45)
  btn = dark(base, .35)
  f = Panel(base, g); coat_common(f)
  # double-breasted: storm flap, wide lapels + collar, 2 rows of buttons, belt + buckle at waist, slant welt pockets
  f.poly([(.62, .06), (.8, .1), (.78, .3), (.6, .26)], rgba(base, 1.04, 255), rgba(base, .5, 230), .004)            # gun flap
  for sgn in (-1, 1):
    lap = [(.5 + sgn * .03, .03), (.5 + sgn * .2, .02), (.5 + sgn * .22, .09), (.5 + sgn * .15, .1), (.5 + sgn * .16, .16), (.5 + sgn * .06, .36)]
    f.poly([(x + .01, y + .015) for x, y in lap], (0, 0, 0, 90)); f.poly(lap, rgba(base, 1.18, 255), rgba(base, .35, 240), .004)
  f.poly([(.44, .03), (.56, .03), (.5, .3)], (232, 228, 218, 255), (90, 85, 80, 220), .003)                         # shirt in the V
  f.line([(.56, .36), (.56, .97)], rgba(base, .45, 230), .005); f.stitch([(.58, .38), (.58, .96)], rgba(base, .6, 160))
  for y in (.2, .3, .52, .64):
    f.button(.42, y, .012, btn); f.button(.62, y, .012, btn)
  f.poly([(0, .37), (1, .37), (1, .43), (0, .43)], rgba(base, .95, 255), rgba(base, .45, 230), .004)              # belt
  f.sh += -.2 * gauss(V - .44, .012) - .15 * gauss(V - .36, .012)
  f.poly([(.53, .36), (.62, .36), (.62, .44), (.53, .44)], (0, 0, 0, 0), dark(base, .3) + (255,), .008)          # buckle
  for x0, sgn in ((.18, 1), (.82, -1)): f.line([(x0, .5), (x0 + sgn * .08, .64)], rgba(base, .35, 240), .009)
  for i in range(3): fold(f.sh, wavy(.39 + i * .003, .05, .95, .01, 6, i), .006, .12)
  for x in (.3, .42, .62, .72): fold(f.sh, [(x, .44), (x + .01, .52)], .008, .18)                                # belt gathers
  b = Panel(base, g); coat_common(b)
  b.poly([(.3, .0), (.7, .0), (.72, .08), (.28, .08)], rgba(base, 1.06, 255), rgba(base, .45, 230), .004)            # collar
  b.poly([(.08, .1), (.92, .1), (.94, .28), (.5, .33), (.06, .28)], rgba(base, 1.03, 255), rgba(base, .45, 220), .004)  # storm cape
  b.poly([(0, .37), (1, .37), (1, .43), (0, .43)], rgba(base, .95, 255), rgba(base, .45, 230), .004)
  b.line([(.5, .43), (.5, .97)], rgba(base, .4, 230), .005); fold(b.sh, [(.5, .7), (.5, .97)], .02, .25, .12)       # vent
  s = Panel(base, g); sleeve_common(s, False, cuff=.82)
  s.poly([(0, .78), (1, .78), (1, .82), (0, .82)], rgba(base, .95, 255), rgba(base, .45, 220), .003); s.button(.85, .8, .01, btn)
  return [f.out('trench_f'), b.out('trench_b'), s.out('trench_s')]

def wool():
  base, g, _ = grain('z_coat_wool_f.png', box=(.62, .6, .78, .72), k=.45)
  btn = (40, 32, 28)
  f = Panel(base, g); coat_common(f)
  for sgn in (-1, 1):   # notch lapels
    lap = [(.5 + sgn * .03, .03), (.5 + sgn * .16, .02), (.5 + sgn * .19, .1), (.5 + sgn * .13, .11), (.5 + sgn * .15, .15), (.5 + sgn * .02, .4)]
    f.poly([(x + .01, y + .015) for x, y in lap], (0, 0, 0, 100)); f.poly(lap, rgba(base, 1.35, 255), rgba(base, .3, 240), .004)
  f.poly([(.42, .03), (.58, .03), (.5, .36)], (232, 228, 218, 255))                                               # shirt in the V
  f.poly([(.48, .05), (.52, .05), (.515, .3), (.5, .34), (.485, .3)], (70, 40, 45, 255))                           # tie
  f.line([(.52, .4), (.52, .97)], rgba(base, .4, 240), .005)
  for y in (.46, .58, .7): f.button(.5, y, .013, btn)
  for x0 in (.18, .62):   # flap pockets
    f.poly([(x0, .58), (x0 + .2, .58), (x0 + .2, .63), (x0, .63)], rgba(base, 1.05, 255), rgba(base, .4, 230), .004)
    f.sh += -.15 * gauss(V - .635, .008) * (np.abs(U - x0 - .1) < .1)
  f.line([(.32, .22), (.41, .21)], rgba(base, .4, 230), .007)                                                       # breast welt
  b = Panel(base, g); coat_common(b)
  b.poly([(.32, .0), (.68, .0), (.7, .08), (.3, .08)], rgba(base, 1.1, 255), rgba(base, .4, 230), .004)
  b.line([(.5, .08), (.5, .97)], rgba(base, .55, 200), .004); b.line([(.5, .72), (.5, .97)], rgba(base, .35, 240), .006)
  b.line([(.04, .4), (.96, .4)], rgba(base, .6, 120), .004)
  s = Panel(base, g); sleeve_common(s, False, cuff=.84)
  for i in range(3): s.button(.88, .76 + i * .03, .007, btn)
  return [f.out('wool_f'), b.out('wool_b'), s.out('wool_s')]

# ---- bottoms ----
def trousers(name, srcn, box, kind):
  base, g, _ = grain(srcn, box=box, k=1.1 if 'jeans' in kind else .7)
  p = Panel(base, g)
  thread = (200, 150, 70, 200) if kind == 'jeans' else (rgba(base, 1.4, 120) if kind == 'blackjeans' else rgba(base, .6, 120))
  if 'jeans' in kind:   # whiskers + knee fade + seat/thigh lightening
    p.sh += .22 * gauss(U - .25, .12) * gauss(V - .4, .2) + .22 * gauss(U - .75, .12) * gauss(V - .4, .2)
    for sgn in (-1, 1):
      for i in range(5):
        y = .2 + i * .022; fold(p.sh, [(.5 + sgn * .03, y - .02), (.5 + sgn * (.12 + i * .02), y)], .006, -.25, -.0)
  # waistband, belt loops, fly, pockets, side + inseams, knee creases, ankle stacking
  p.poly([(0, 0), (1, 0), (1, .055), (0, .055)], rgba(base, .92, 255), rgba(base, .5, 220), .004)
  p.stitch([(0, .048), (1, .048)], thread)
  for x in (.06, .3, .5, .7, .94): p.poly([(x - .012, -.01), (x + .012, -.01), (x + .012, .07), (x - .012, .07)], rgba(base, 1.0, 255), rgba(base, .45, 200), .003)
  p.button(.5, .028, .012, (190, 170, 110) if 'jeans' in kind else (30, 30, 30))
  fly = [(.5, .055), (.5, .2), (.47, .25)] if True else []
  p.line([(.505, .06), (.505, .25)], rgba(base, .45, 230), .005); p.stitch([(.54, .06), (.54, .2), (.505, .26)], thread)
  for sgn in (-1, 1):
    if 'jeans' in kind:
      pk = [(.5 + sgn * .2, .055), (.5 + sgn * .28, .13), (.5 + sgn * .4, .15)]
    else:
      pk = [(.5 + sgn * .24, .055), (.5 + sgn * .4, .2)]
    p.line(pk, rgba(base, .4, 240), .006); p.stitch([(x + sgn * .012, y + .01) for x, y in pk], thread)
    if 'jeans' in kind: p.button(.5 + sgn * .4, .155, .006, (200, 160, 90))   # rivet
    fold(p.sh, [(.5 + sgn * .48, .0), (.5 + sgn * .48, 1)], .006, .3, .1)       # outer seam
    p.stitch([(.5 + sgn * .475, .07), (.5 + sgn * .475, .99)], thread)
  for cx in (.25, .75):
    fold(p.sh, [(cx + .23, .3), (cx + .23, 1)], .006, .25, .08)                    # inseam
    if kind in ('chinos', 'grey'):
      p.sh += .22 * gauss(U - cx, .008) * (V > .07) - .1 * gauss(U - cx - .012, .008) * (V > .07)   # pressed crease
    for i, y in enumerate((.56, .6, .64)): fold(p.sh, wavy(y, cx - .2, cx + .2, .012, 2, i + cx * 7), .009, .2, .1)
    for i, y in enumerate((.84, .89, .93)): fold(p.sh, wavy(y, cx - .21, cx + .21, .015, 3, i * 2 + cx), .01, .22, .12)
    fold(p.sh, [(cx - .1, .3), (cx + .05, .36), (cx + .15, .34)], .012, .18)           # crotch drag
  p.sh += -.3 * gauss(V - .975, .01)
  return p.out(name, sides=0.)

def skirt(name, srcn, kind):
  if kind == 'tartan':
    base = np.array([.12, .2, .12]); g = np.ones((S, S), np.float32)
    a = src(srcn); g = 1 + .4 * (lambda L: (L - blur(L, 6)))(tile(a[400:700, 300:700], 3).mean(2))
    p = Panel(base, np.clip(g, .6, 1.4))
    X = U * .35 / .023; Y = V * .26 / .023            # ~2.3 cm sett lines in body units
    red = np.array([.7, .1, .1]); green = np.array([.08, .3, .14]); navy = np.array([.08, .1, .25]); yel = np.array([.85, .75, .2])
    col = np.where(((np.floor(X) % 4) < 2)[..., None] ^ ((np.floor(Y) % 4) < 2)[..., None], green, navy).astype(np.float32)
    col = col * .6 + .4 * np.where(((np.floor(X) % 4) < 2)[..., None] & ((np.floor(Y) % 4) < 2)[..., None], green, navy)
    col = np.where(((np.abs((X % 4) - 3.5) < .12) | (np.abs((Y % 4) - 3.5) < .12))[..., None], red, col)
    col = np.where(((np.abs((X % 8) - 1) < .06) | (np.abs((Y % 8) - 1) < .06))[..., None], yel, col)
    p.col[:] = col
  else:
    base, g, _ = grain(srcn, box=(.3, .4, .7, .7), k=.7); p = Panel(base, g)
  # knife pleats: periodic light/shade in u, opening wider toward the hem
  for i in range(14):
    x = (i + .5) / 14
    q = [(x, .06), (x + (x - .5) * .06, 1)]
    fold(p.sh, q, .01, .22, .14, side=(1, 0))
  p.poly([(0, 0), (1, 0), (1, .08), (0, .08)], rgba(p.col[40, 256], .85, 255) if kind == 'tartan' else rgba(base, .9, 255), (20, 20, 20, 200), .004)
  p.sh += -.3 * gauss(V - .975, .012) + .1 * gauss(V - .95, .012)
  return p.out(name, sides=0.)

# ---- V145 M6 (10-24) winter garments for the Maltose Market cast (appended cells 33..38: crowd135.js G135 puffer / wrap) ----
def puffer():
  # quilted down jacket (short top): horizontal baffles with stitched channels, centre zip + storm flap, stand collar,
  # zip hand pockets, elastic cuffs; nylon sheen per baffle
  _, g, _ = grain('z_top_leather_f.png', box=(.15, .5, .4, .8), k=.35); base = np.array([.085, .09, .105])
  def baffles(p, v0=.1, v1=.97, n=7, sleeve=False):
    for i in range(n + 1):
      y = v0 + (v1 - v0) * i / n
      p.sh += -.38 * gauss(V - y, .008) + .1 * gauss(V - y - .012, .01)
      if i < n: p.sh += .2 * gauss(V - (y + (v1 - v0) / n * .42), (v1 - v0) / n * .22) * (1 - .4 * np.abs(2 * U - 1))   # puffed sheen
      if i and i < n: p.stitch([(.02, y), (.98, y)], (0, 0, 0, 120), .002, .008)
  zipc = (150, 150, 150, 255)
  f = Panel(base, g); torso_common(f, True, hem=False); baffles(f)
  f.poly([(.38, .0), (.62, .0), (.63, .1), (.37, .1)], rgba(base, 1.25, 255), (5, 5, 5, 230), .004)                 # stand collar
  f.line([(.5, .0), (.5, .97)], (12, 12, 12, 255), .02); f.line([(.5, .0), (.5, .97)], zipc, .004)                   # zip
  f.poly([(.505, .1), (.55, .1), (.55, .95), (.505, .95)], rgba(base, 1.1, 255), (5, 5, 5, 200), .003)              # storm flap
  for y in (.2, .4, .6, .8): f.button(.53, y, .008, (40, 40, 44))
  for x0, sgn in ((.2, 1), (.8, -1)): f.line([(x0, .6), (x0 + sgn * .06, .78)], (8, 8, 8, 255), .008)
  f.poly([(0, .93), (1, .93), (1, .99), (0, .99)], rgba(base, .7, 255))                                           # elastic hem
  f.poly([(.08, .14), (.18, .14), (.18, .18), (.08, .18)], (180, 60, 40, 255))                                     # small brand patch (unlettered)
  b = Panel(base, g); torso_common(b, False, hem=False); baffles(b)
  b.poly([(.36, .0), (.64, .0), (.65, .1), (.35, .1)], rgba(base, 1.25, 255), (5, 5, 5, 230), .004)
  b.poly([(0, .93), (1, .93), (1, .99), (0, .99)], rgba(base, .7, 255))
  s = Panel(base, g); sleeve_common(s, False, cuff=.9); baffles(s, .05, .9, 6, True)
  s.poly([(0, .9), (1, .9), (1, 1), (0, 1)], rgba(base, .6, 255))
  for x in np.arange(0, 1, .03): s.line([(x, .9), (x, 1)], rgba(base, .35, 140), .003)
  return [f.out('puffer_f'), b.out('puffer_b'), s.out('puffer_s')]

def wrapcoat():
  # women's long wool wrap coat (maroon): wide shawl collar, overlapping front edge, tie belt with hanging ends, patch
  # pockets, knitted scarf at the neck
  _, g, _ = grain('z_coat_wool_f.png', box=(.62, .6, .78, .72), k=.5); base = np.array([.40, .085, .115])
  f = Panel(base, g); coat_common(f)
  for sgn in (-1, 1):
    col = [(.5 + sgn * .04, .02), (.5 + sgn * .24, .03), (.5 + sgn * .26, .16), (.5 + sgn * .14, .3), (.5 + sgn * .05, .42)]
    f.poly([(x + .012, y + .016) for x, y in col], (0, 0, 0, 110)); f.poly(col, rgba(base, 1.22, 255), rgba(base, .35, 240), .004)
  f.line([(.55, .4), (.58, .97)], rgba(base, .38, 240), .006)                                                     # wrap edge
  fold(f.sh, [(.57, .45), (.6, .97)], .02, .25, .14, side=(1, 0))
  scarf = (52, 48, 56, 255)
  f.poly([(.36, .0), (.64, .0), (.6, .1), (.4, .1)], scarf, (20, 20, 24, 230), .004)                               # scarf wrap
  f.poly([(.44, .08), (.53, .08), (.55, .34), (.45, .33)], scarf, (20, 20, 24, 230), .004)                         # scarf end
  for y in np.arange(.1, .33, .025): f.line([(.445, y), (.545, y + .004)], (30, 28, 34, 200), .003)
  f.poly([(0, .39), (1, .39), (1, .44), (0, .44)], rgba(base, .92, 255), rgba(base, .4, 230), .004)              # tie belt
  f.poly([(.6, .44), (.64, .44), (.66, .64), (.62, .65)], rgba(base, .95, 255), rgba(base, .4, 230), .003)        # belt ends
  f.poly([(.64, .44), (.67, .44), (.71, .6), (.68, .61)], rgba(base, .9, 255), rgba(base, .4, 230), .003)
  for x0 in (.14, .64):
    f.poly([(x0, .55), (x0 + .2, .55), (x0 + .2, .7), (x0, .7)], rgba(base, 1.04, 255), rgba(base, .4, 230), .004)
    f.stitch([(x0 + .01, .56), (x0 + .19, .56)], rgba(base, .5, 160))
  b = Panel(base, g); coat_common(b)
  b.poly([(.26, .0), (.74, .0), (.76, .12), (.24, .12)], rgba(base, 1.18, 255), rgba(base, .38, 230), .004)        # collar back
  b.poly([(.4, .0), (.6, .0), (.58, .05), (.42, .05)], scarf)
  b.poly([(0, .39), (1, .39), (1, .44), (0, .44)], rgba(base, .92, 255), rgba(base, .4, 230), .004)
  b.line([(.5, .44), (.5, .97)], rgba(base, .45, 220), .004); fold(b.sh, [(.5, .65), (.5, .97)], .02, .22, .12)
  s = Panel(base, g); sleeve_common(s, False, cuff=.8)
  s.poly([(0, .8), (1, .8), (1, .86), (0, .86)], rgba(base, 1.1, 255), rgba(base, .4, 220), .003)                  # turned-back cuff
  return [f.out('wrap_f'), b.out('wrap_b'), s.out('wrap_s')]

cells = []
for fn in (tee, breton, chambray, floral, hoodie, knit, leather, trench, wool): cells += fn()
cells += [trousers('jeans', 'z_bot_jeans_f.png', (.3, .3, .45, .7), 'jeans'),
          trousers('blackjeans', 'z_bot_blackjeans_f.png', (.3, .3, .45, .7), 'blackjeans'),
          trousers('chinos', 'z_bot_chinos_f.png', (.3, .3, .45, .7), 'chinos'),
          trousers('greytrousers', 'z_bot_greytrousers_f.png', (.3, .3, .45, .7), 'grey'),
          skirt('tartanskirt', 'z_bot_tartanskirt_f.png', 'tartan'), skirt('navyskirt', 'z_bot_navyskirt_f.png', 'navy')]
cells += puffer() + wrapcoat()   # V145 M6: cells 33..38
cells = [lowfi(c) for c in cells]
rows = (len(cells) + PER - 1) // PER
A = Image.new('RGB', (PER * C, rows * C), (128, 128, 128))
for i, c in enumerate(cells): A.paste(c, ((i % PER) * C, (i // PER) * C))
A.save(O + 'garments135.png', optimize=True)
print('garments135.png', A.size, len(cells), 'cells')
