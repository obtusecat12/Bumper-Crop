# V135 ④-2 crowd textures: clothing pattern atlas + prop atlas.
#   python3 bc/scripts/crowd135/textures135.py
# cloth135.png (256x384, 4x3 tiles of 64x128, tile = 0.40 m x 0.80 m of cloth, seamless): DATA texture, not colour.
#   R = weave/print shading (1 = full dye), G = accent mask (0 = dye A, 1 = dye B). The runtime shader colours it with two
#   per-person dyes (crowd135.js), so 12 patterns x the dye palettes give the variety. Patterns photographed: each one
#   generated large on its own (art-v135crowd/pat_*.png); gingham / polka / corduroy / breton are procedural (the image
#   model refused regular grids; the breton photo's stripes broke under the seamless cross-fade) on top of the generated jersey weave.
# props135.png (256x128, 4x2 cells of 64x64): one generated product photo per prop (art-v135crowd/acc_*.png), cropped
#   to the object, colour kept (backpack + cap are grey so the runtime can tint them).
from PIL import Image, ImageFilter
import numpy as np, os
R = os.path.dirname(os.path.abspath(__file__)) + '/../../..'
D = R + '/art-v135crowd/'; O = R + '/bc/dist/assets/crowd135/'
TW, TH = 64, 128
TILES = ['plain', 'jersey', 'breton', 'gingham', 'tartan', 'denim', 'herringbone', 'floral', 'polka', 'corduroy', 'camo', 'tropical']
CROP = {'jersey': 150, 'breton': 300, 'tartan': 384, 'denim': 130, 'herringbone': 200, 'floral': 260, 'camo': 384, 'tropical': 384}
MIRROR = {'tartan'}
TWO = {'breton', 'gingham', 'tartan', 'floral', 'polka', 'camo', 'tropical'}

def lum(a): return a[..., 0] * .299 + a[..., 1] * .587 + a[..., 2] * .114
def seamless(a):
  # cross-fade with the half-rolled copy so both wraps are continuous (tile repeats via fract() in the shader)
  h, w = a.shape[:2]; y = np.abs(np.linspace(-1, 1, h))[:, None]; x = np.abs(np.linspace(-1, 1, w))[None, :]
  m = np.clip(1 - np.maximum(x, y), 0, 1) ** .7
  r = np.roll(np.roll(a, h // 2, 0), w // 2, 1)
  return a * m + r * (1 - m)
def photo(name):
  im = Image.open(D + 'pat_' + name + '.png').convert('RGB'); W, H = im.size; cw = CROP[name]
  x0 = (W - cw) // 2; y0 = (H - 2 * cw) // 2
  if name in MIRROR:   # strongly structured: quarter crop mirrored both ways (tartan is symmetric anyway)
    q = im.crop((x0, y0, x0 + cw // 2, y0 + cw)).resize((TW, TH), Image.LANCZOS).resize((TW // 2, TH // 2), Image.LANCZOS)
    a = lum(np.asarray(q).astype(float) / 255); a = np.concatenate([a, a[:, ::-1]], 1); return np.concatenate([a, a[::-1]], 0)
  sm = im.crop((x0, y0, x0 + cw, y0 + 2 * cw)).resize((TW * 2, TH * 2), Image.LANCZOS).resize((TW, TH), Image.LANCZOS)
  return seamless(lum(np.asarray(sm).astype(float) / 255))
def weave():
  return photo('jersey')
def encode(L, two):
  if not two:
    Rr = np.clip(.5 + (L - L.mean()) / (L.std() * 4 + 1e-6) * .5, 0, 1) * .3 + .7
    return Rr, np.zeros_like(L)
  t = (np.percentile(L, 30) + np.percentile(L, 70)) / 2
  G = np.clip((t - L) / .06 + .5, 0, 1)   # dark part = accent
  hi = L[G < .5].mean() if (G < .5).any() else 1; lo = L[G >= .5].mean() if (G >= .5).any() else 1
  Rr = np.where(G >= .5, L / lo, L / hi); Rr = np.clip(Rr * .9, .55, 1)
  return Rr, G
def proc(name, w):
  y, x = np.mgrid[0:TH, 0:TW]
  if name == 'gingham':
    a = ((x // 4) % 2 == 0).astype(float); b = ((y // 4) % 2 == 0).astype(float); G = (a + b) / 2
    return np.clip(w / w.mean() * .92, .6, 1), G
  if name == 'polka':
    gy = y % 8; gx = (x + 4 * ((y // 8) % 2)) % 8; G = (((gx - 3.5) ** 2 + (gy - 3.5) ** 2) < 4.2).astype(float)
    return np.clip(w / w.mean() * .92, .6, 1), G
  if name == 'breton':   # generated photo kept only as reference: the cross-fade broke its stripes, so regular stripes on the weave
    G = ((y % 8) < 3).astype(float); return np.clip(w / w.mean() * .92, .6, 1), G
  if name == 'corduroy':
    r = .78 + .22 * np.cos(2 * np.pi * x / 3) ** 2; return np.clip(r * (w / w.mean()) ** .5, 0, 1), np.zeros_like(w)
atlas = np.zeros((TH * 3, TW * 4, 3))
w = weave()
for i, n in enumerate(TILES):
  if n == 'plain': Rr, G = np.ones((TH, TW)), np.zeros((TH, TW))
  elif n in ('gingham', 'polka', 'corduroy', 'breton'): Rr, G = proc(n, w)
  else: Rr, G = encode(photo(n), n in TWO)
  ty, tx = divmod(i, 4)
  atlas[ty * TH:(ty + 1) * TH, tx * TW:(tx + 1) * TW, 0] = Rr; atlas[ty * TH:(ty + 1) * TH, tx * TW:(tx + 1) * TW, 1] = G
Image.fromarray((atlas * 255).round().astype(np.uint8)).save(O + 'cloth135.png')

PROPS = {'backpack': (456, 20, 951, 729), 'satchel': (230, 42, 1250, 759), 'bag_kraft': (481, 200, 990, 734), 'bag_white': (355, 110, 1142, 675),
         'tote': (423, 380, 847, 727), 'cap': (299, 17, 1109, 520), 'beanie': (300, 100, 1100, 668), 'phone': (539, 53, 869, 733)}
pa = Image.new('RGB', (256, 128))
for i, (n, b) in enumerate(PROPS.items()):
  im = Image.open(D + 'acc_' + n + '.png').convert('RGB').crop(b).resize((128, 128), Image.LANCZOS).resize((64, 64), Image.LANCZOS)
  im = im.quantize(colors=48, dither=Image.Dither.NONE).convert('RGB')
  pa.paste(im, ((i % 4) * 64, (i // 4) * 64))
pa.save(O + 'props135.png')
print('ok', list(PROPS))
