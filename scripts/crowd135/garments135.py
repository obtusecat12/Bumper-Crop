# V135 ④-2b crowd garments in the V75 cast style (Hope St kiosk keeper / retro-cast-v75: photographic 128² body textures
# split in quadrants torso-front / torso-back / sleeve / trousers). User 10-20 06:26-06:28 asked the crowd to use that
# NPC style instead of the dyed pattern atlas.
#   python3 bc/scripts/crowd135/garments135.py
# Sources art-v135crowd/retro/z_<kind>_<name>_<f|b>.png: every garment panel generated large on its own (tops + coats front
# AND back, bottoms front), framed like the V75 quadrants (refs = crops of npc-v75 plaid/wallman body.png).
# Output assets/crowd135/garments135.png: 64x64 cells (8 per row), V75 low-fi (LANCZOS 256, blur, BOX 64, 96 colours/cell):
#   tops / coats: 3 cells each = front, back, sleeve (sleeve = the back panel's plain centre down to the hem rib = cuff)
#   bottoms: 1 cell = front of both legs (trousers) or the skirt unrolled (background removed, rows stretched to full width).
# The cell order is GARMENTS below; dist/crowd135.js keeps the same list (G135).
from PIL import Image, ImageFilter
import numpy as np, os
R = os.path.dirname(os.path.abspath(__file__)) + '/../../..'
D = R + '/art-v135crowd/retro/'; O = R + '/bc/dist/assets/crowd135/'
TOPS = ['tee', 'breton', 'chambray', 'floral', 'hoodie', 'knit', 'leather']
COATS = ['trench', 'wool']
BOTS = ['jeans', 'blackjeans', 'chinos', 'greytrousers', 'tartanskirt', 'navyskirt']
C = 64; PER = 8

def lowfi(im):
  im = im.convert('RGB').resize((256, 256), Image.LANCZOS).filter(ImageFilter.GaussianBlur(.6)).resize((C, C), Image.BOX)
  return im.quantize(96, method=Image.MEDIANCUT, dither=Image.NONE).convert('RGB')

def unbg(im):
  """skirts were shot on a plain backdrop: per row keep the cloth span and stretch it to the full width"""
  a = np.asarray(im.convert('RGB')).astype(np.float32); h, w = a.shape[:2]
  bg = np.median(np.concatenate([a[:8, :8].reshape(-1, 3), a[:8, -8:].reshape(-1, 3), a[-8:, :8].reshape(-1, 3), a[-8:, -8:].reshape(-1, 3)]), 0)
  m = np.linalg.norm(a - bg, axis=2) > 38
  rows = [y for y in range(h) if m[y].sum() > w * .15]
  rows = rows[2:-2]; out = np.zeros((len(rows), w, 3), np.float32)
  for i, y in enumerate(rows):
    xs = np.nonzero(m[y])[0]; x0, x1 = xs[int(len(xs) * .01)] + 3, xs[int(len(xs) * .99)] - 3
    src = np.linspace(x0, x1, w); out[i] = np.stack([np.interp(src, np.arange(w), a[y, :, c]) for c in range(3)], 1)
  return Image.fromarray(out.clip(0, 255).astype(np.uint8))

cells = []
for n in TOPS + COATS:
  k = 'top' if n in TOPS else 'coat'
  f = Image.open(D + f'z_{k}_{n}_f.png'); b = Image.open(D + f'z_{k}_{n}_b.png'); W, H = b.size
  s = b.crop((int(W * .3), int(H * .22), int(W * .7), H)).resize((W, H), Image.LANCZOS)
  cells += [lowfi(f), lowfi(b), lowfi(s)]
for n in BOTS:
  im = Image.open(D + f'z_bot_{n}_f.png')
  cells.append(lowfi(unbg(im) if 'skirt' in n else im))
rows = (len(cells) + PER - 1) // PER
A = Image.new('RGB', (PER * C, rows * C), (128, 128, 128))
for i, c in enumerate(cells): A.paste(c, ((i % PER) * C, (i // PER) * C))
A.save(O + 'garments135.png', optimize=True)
print('garments135.png', A.size, len(cells), 'cells')
