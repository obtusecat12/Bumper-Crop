# V137 Q2 hair texture: assets/crowd135/hair137.png, 128x128 grey (tinted per person by its hair colour in the shader, mean ~.5).
# Drawn large (512²) as overlapping strands, then downscaled + quantised (PS1 low-fi). u wraps round the head (tiles in u),
# v runs from the crown/parting (row 0) to the strand tips (row 127). Left half = straight hair, right half = curly/coily.
import random, sys
from PIL import Image, ImageDraw, ImageFilter
OUT = sys.argv[1] if len(sys.argv) > 1 else 'hair137.png'
S = 512; rnd = random.Random(137)
im = Image.new('L', (S, S), 120); d = ImageDraw.Draw(im)
def strands(x0, x1, wav, curl):
  for _ in range(2600):
    x = rnd.uniform(x0, x1); y = rnd.uniform(-40, S); L = rnd.uniform(60, 220); g = rnd.randint(60, 200); w = rnd.choice((1, 2, 2, 3))
    pts = []; ph = rnd.uniform(0, 6.28)
    for i in range(12):
      t = i / 11; yy = y + t * L
      import math
      xx = x + math.sin(ph + t * curl) * wav + t * rnd.uniform(-3, 3)
      pts.append((xx % (x1 - x0) + x0 if curl else xx, yy))
    d.line(pts, fill=g, width=w)
strands(0, S // 2, 2.5, 0)            # straight: long vertical strands
strands(S // 2, S, 9, 14)             # curly: short wavy coils
im = im.filter(ImageFilter.GaussianBlur(1.2))
# parting/crown darker, tips slightly lighter; clumps (columns) for PS1 read
px = im.load()
for y in range(S):
  for x in range(S):
    v = px[x, y] * (.78 + .32 * y / S) * (1 + .12 * ((x // 24) % 3 - 1))
    px[x, y] = max(0, min(255, int(v)))
sm = im.resize((128, 128), Image.BILINEAR).quantize(16).convert('L')
# normalise mean to ~128
h = list(sm.getdata()); m = sum(h) / len(h); sm = sm.point(lambda v: max(0, min(255, int(v * 128 / m))))
sm.save(OUT); print('wrote', OUT, sum(sm.getdata()) / 16384)
