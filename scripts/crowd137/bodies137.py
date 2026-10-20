# V137 Q1 crowd bodies (notes/spec-1020-crowd-quality.md). Run with Blender 5.1 (arm64):
#   blender -b -P bc/scripts/crowd137/bodies137.py -- OUT_DIR BASE_JSON
# Same output contract as crowd135/bodies135.py (crowd135.bin, version 135z layout: baked walk/idle frames, split V75 uv,
# head bind meshes + bone matrices, accessories) but the 12 bodies are no longer separate tubes: each one is derived from a
# single continuous skinned mesh (CC0 Wobble Blocks "PS2 Styled Characters" Masc / Femme base, opengameart.org/content/
# ps2-styled-characters, extracted by extract137.py with arms lowered and head removed) -> neck, deltoid shoulders, armpits,
# chest/waist taper, crotch and knees are one welded surface. Per type: uniform height scale + per-bone girth (weighted, so
# the deformation is continuous across joints); per silhouette: coat = bulkier torso + welded-on coat tail with a hem lip,
# skirt = bare slimmer legs + skirt cone with hem lip, shorts / t-shirt = skin below the cut. Game frame as bodies135.
import bpy, bmesh, sys, json, struct, math
from mathutils import Vector, Matrix, Quaternion, Euler

ARGS = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else ['/tmp']
OUT = ARGS[0]; BASE = json.load(open(ARGS[1] if len(ARGS) > 1 else OUT + '/base137.json'))
G2B = lambda p: Vector((p[0], -p[2], p[1]))
B2G = lambda v: (v[0], v[2], -v[1])

TYPES = {
 'man':   dict(h=1.00, head=1.00, sh=1.04, src='Masc'),
 'woman': dict(h=.945, head=.96, sh=.95, src='Femme'),
 'heavy': dict(h=.985, head=1.03, sh=1.12, src='Masc'),
 'child': dict(h=.72, head=.90, sh=.76, src='Masc'),
}
# per-bone girth (perpendicular scale about the bone segment, blended by skin weights). belly = extra forward push on spine.
GIRTH = {
 'man':   dict(upperArm=1.18, clavicle=1.08, chest=1.06, foreArm=1.10, neck=1.06),
 'woman': dict(),
 'heavy': dict(hips=1.22, spine=1.46, chest=1.18, clavicle=1.10, upperArm=1.22, foreArm=1.12, thigh=1.24, shin=1.10, neck=1.16, belly=1.25),
 'child': dict(hips=1.08, spine=1.12, chest=1.10, upperArm=1.12, foreArm=1.08, thigh=1.12, shin=1.08, neck=1.0),
}
SILS = ['short', 'coat', 'skirt']   # 'skirt' = skirt for woman/child, shorts for man/heavy
NS = 14
REG = {'skin': 0, 'top': 1, 'bottom': 2, 'shoe': 3, 'coat': 4, 'trim': 5}
J0 = BASE['joints']
CHILD = {'hips': 'spine', 'spine': 'chest', 'chest': 'neck', 'neck': 'head'}
for s_ in 'LR': CHILD.update({'clavicle' + s_: 'upperArm' + s_, 'upperArm' + s_: 'foreArm' + s_, 'foreArm' + s_: 'hand' + s_, 'thigh' + s_: 'shin' + s_, 'shin' + s_: 'foot' + s_})

def bones_for(t):
  s = t['h']; B = {}
  PAR = {'hips': None, 'spine': 'hips', 'chest': 'spine', 'neck': 'chest', 'head': 'neck'}
  for s_ in 'LR': PAR.update({'clavicle' + s_: 'chest', 'upperArm' + s_: 'clavicle' + s_, 'foreArm' + s_: 'upperArm' + s_, 'hand' + s_: 'foreArm' + s_,
                              'thigh' + s_: 'hips', 'shin' + s_: 'thigh' + s_, 'foot' + s_: 'shin' + s_})
  for n, par in PAR.items(): p = J0[n]; B[n] = (par, (p[0] * s, p[1] * s, p[2] * s))
  return B

TAIL = {'hips': 'spine', 'spine': 'chest', 'chest': 'neck', 'neck': 'head', 'clavicleL': 'upperArmL', 'clavicleR': 'upperArmR',
        'upperArmL': 'foreArmL', 'upperArmR': 'foreArmR', 'foreArmL': 'handL', 'foreArmR': 'handR', 'thighL': 'shinL', 'thighR': 'shinR',
        'shinL': 'footL', 'shinR': 'footR'}

def seg(n):
  a = Vector(J0[n])
  if n in CHILD: b = Vector(J0[CHILD[n]])
  elif n.startswith('hand'): b = a + Vector((0, -.12, 0))
  elif n.startswith('foot'): b = a + Vector((0, -.06, .16))
  else: b = a + Vector((0, .2, 0))
  return a, b
SEG = {n: seg(n) for n in J0}
def closest(p, n):
  a, b = SEG[n]; d = b - a; t = max(0., min(1., (p - a).dot(d) / d.length_squared)); return a + d * t
BONECLS = lambda n: n.rstrip('LR')

class Body:
  def __init__(s): s.v = []; s.w = []; s.f = []; s.r = []
MS = {}
def base_mesh(src):
  if src not in MS:
    d = BASE['meshes'][src]; MS[src] = ([Vector(p) for p in d['v']], d['f'], [dict((n, x) for n, x in w) for w in d['w']])
  return MS[src]

def body(tname, sil):
  t = TYPES[tname]; s = t['h']; B = bones_for(t); V0, F0, W0 = base_mesh(t['src'])
  skirtish = sil == 'skirt' and tname in ('woman', 'child'); shorts = sil == 'skirt' and not skirtish; coat = sil == 'coat'
  G = dict(GIRTH[tname]); belly = G.pop('belly', 1.)
  if coat:
    for k in ('hips', 'spine', 'chest', 'clavicle', 'upperArm', 'foreArm'): G[k] = G.get(k, 1.) * (1.07 if k != 'foreArm' else 1.05)
  m = Body(); kneeY = J0['shinL'][1]; midThigh = (J0['thighL'][1] + kneeY) / 2 - .03
  for p, w in zip(V0, W0):
    q = Vector((0, 0, 0)); tot = 0.
    for n, x in w.items():
      c = closest(p, n); k = G.get(BONECLS(n), 1.)
      if BONECLS(n) in ('thigh', 'shin'):
        if skirtish and (BONECLS(n) == 'shin' or p.y < J0['hipsL' if False else 'hips'][1] - .12): k *= .86   # bare legs, slimmer than trousers
        if shorts and p.y < midThigh: k *= .88
      off = p - c
      if BONECLS(n) == 'spine' and off.z > 0: off = Vector((off.x, off.y, off.z * belly))
      q += x * (c + off * k); tot += x
    q /= tot; m.v.append(tuple(q * s)); m.w.append(list(w.items()))
  m.f = [tuple(f) for f in F0]
  # garment region per vertex (accessory extents) and per face (uv slot), in the base frame scaled by s
  m.v0 = len(m.v)
  def pick(target, ok, win=.06):
    ys = sorted(set(round(m.v[i][1], 4) for i in range(m.v0) if ok(i) and abs(m.v[i][1] - target) < win))
    best = (0, target)
    for a, b in zip(ys, ys[1:]):
      if b - a > best[0]: best = (b - a, (a + b) / 2)
    return best[1]
  m.dom = [BONECLS(max(w, key=lambda x: x[1])[0]) for w in m.w]
  TOR = ('hips', 'spine', 'chest')
  m.hemY = pick((1.03 if t['src'] == 'Masc' else 1.04) * s, lambda i: m.dom[i] in TOR and abs(m.v[i][0]) < .2 * s)
  m.collarY = pick(1.465 * s, lambda i: m.dom[i] in ('neck', 'chest') and abs(m.v[i][0]) < .1 * s, .04 * s)
  m.shoeY = pick(.085 * s, lambda i: m.dom[i] in ('shin', 'foot'), .04 * s)
  m.cutY = pick(J0['upperArmL'][1] * s - .17 * s, lambda i: m.dom[i] in ('upperArm', 'foreArm'), .05 * s)
  m.midY = pick(midThigh * s, lambda i: m.dom[i] in ('thigh',), .05 * s)
  print('CUTS', tname, sil, 'hem %.3f collar %.3f shoe %.3f sleeve %.3f thigh %.3f' % (m.hemY, m.collarY, m.shoeY, m.cutY, m.midY))
  m.dom = [BONECLS(max(w, key=lambda x: x[1])[0]) for w in m.w]
  m.sk = dict(s=s, coat=coat, skirtish=skirtish, shorts=shorts, hem=None, B=B, mid=midThigh * s)
  m.r = []
  for i, (p, w) in enumerate(zip(m.v, m.w)):
    dom = m.dom[i]
    m.r.append('skin' if dom == 'hand' else 'shoe' if dom == 'foot' else 'bottom' if dom in ('thigh', 'shin') or p[1] < m.hemY else 'top')
  m.extra = []   # (first vertex, kind) of welded-on garment shells
  m.ftag = {}    # face index -> uv kind for added shells
  long_sleeve = coat or (sil == 'skirt' and tname == 'child')
  if not long_sleeve:
    for side in 'LR': add_lip(m, lambda i, sd=side: m.dom[i] in ('upperArm', 'foreArm') and (m.v[i][0] > 0) == (sd == 'L'), m.cutY, -1,
                              lambda p, sd=side: closest(Vector(p) / s, 'upperArm' + sd) * s, .007 * s, .016 * s, 'sleeve')
  if coat or skirtish: add_tail(m, tname, 'coat' if coat else 'skirt')
  return m, B

def add_lip(m, ok, cutY, up, centre, dout, dy, kind):
  """cloth thickness at a garment edge: the vertex loop on the cloth side of cutY (up=-1: cloth above the cut, edge faces
  down) is duplicated, pushed outward by dout and past the cut by dy, and bridged to it -> a visible rolled edge."""
  ring = set()
  for f in m.f[:]:
    for a, b in ((f[0], f[1]), (f[1], f[2]), (f[2], f[0])):
      if not (ok(a) and ok(b)): continue
      ya, yb = m.v[a][1], m.v[b][1]
      cloth = (lambda y: y > cutY) if up < 0 else (lambda y: y < cutY)
      if cloth(ya) != cloth(yb): ring.add(a if cloth(ya) else b)
  if len(ring) < 4: print('LIP skip', kind, len(ring)); return
  ring = list(ring); c0 = sum((Vector(m.v[i]) for i in ring), Vector()) / len(ring)
  ax = centre(c0)
  def ang(i):
    d = Vector(m.v[i]) - centre(m.v[i]); return math.atan2(d.x, d.z)
  ring.sort(key=ang); new = []
  for i in ring:
    p = Vector(m.v[i]); c = centre(m.v[i]); d = p - c; d.y = 0; d = d.normalized() if d.length > 1e-6 else Vector((0, 0, 1))
    q = p + d * dout + Vector((0, up * dy, 0)) * (1 if up > 0 else 1)
    m.v.append(tuple(q)); m.w.append(list(m.w[i])); m.r.append(m.r[i]); m.dom.append(m.dom[i]); new.append(len(m.v) - 1)
  n = len(ring)
  for k in range(n):
    a, b, c, d = ring[k], ring[(k + 1) % n], new[(k + 1) % n], new[k]
    for tri in ((a, b, c), (a, c, d)):
      P = [Vector(m.v[j]) for j in tri]; nrm = (P[1] - P[0]).cross(P[2] - P[0]); mid = (P[0] + P[1] + P[2]) / 3; out = mid - centre(tuple(mid)); out.y = 0
      if nrm.dot(out) < 0: tri = (tri[0], tri[2], tri[1])
      m.ftag[len(m.f)] = kind; m.f.append(tri)
  print('LIP', kind, n)

def add_tail(m, tname, kind):
  """coat tail / skirt: cone from just under the shirt hem to the knee, hem lip folded back inside (cloth thickness)."""
  s = m.sk['s']; top = m.hemY + (.04 * s if kind == 'coat' else .01 * s)
  def ext(y0, y1):
    rx = rz = rzb = 0.
    for i in range(m.v0):
      p = m.v[i]
      if m.dom[i] not in ('hips', 'spine', 'thigh', 'shin', 'chest'): continue
      if y0 <= p[1] <= y1: rx = max(rx, abs(p[0])); rz = max(rz, p[2]); rzb = max(rzb, -p[2])
    return rx, rz, rzb
  rx0, rz0, rzb0 = ext(top - .06 * s, top + .02 * s)
  rx1, rz1, rzb1 = ext(.62 * s, top)   # whole span under the tail (buttocks are wider than the thighs)
  rx0, rz0, rzb0 = max(rx0, rx1), max(rz0, rz1), max(rzb0, rzb1) + .008
  kn = (.50 if kind == 'coat' else (.56 if tname == 'woman' else .52)) * s; m.sk['hem'] = kn / s
  rings = [(top, rx0 + .025, rz0 + .015, rzb0 + .015, 0), ((top + kn) / 2 + .02 * s, rx1 + .03, rz1 + .03, rzb1 + .03, 1),
           (kn, rx1 + .05, rz1 + .05, rzb1 + .05, 2), (kn + .025 * s, rx1 + .038, rz1 + .038, rzb1 + .038, 3)]
  R = []; first = len(m.v)
  for y, rx, rz, rzb, i in rings:
    ids = []
    for k in range(NS):
      a = 2 * math.pi * k / NS; x = math.sin(a) * rx; zf = math.cos(a); z = zf * (rz if zf > 0 else rzb)
      side = 'L' if x > 0 else 'R'; f = min(1, abs(x) / rx * 1.4)
      if i == 0: w = [('hips', .7), ('spine', .3)]
      else:
        kk = .55 * f + (.25 if i >= 2 else 0); w = [('thigh' + side, kk), ('hips', 1 - kk)]
      m.v.append((x, y, z)); m.w.append(w); m.r.append('top' if kind == 'coat' else 'bottom'); ids.append(len(m.v) - 1)
    R.append(ids)
  for i in range(3):
    A, Bq = R[i], R[i + 1]
    for k in range(NS):
      a, b, c, d = A[k], A[(k + 1) % NS], Bq[(k + 1) % NS], Bq[k]
      for tri in ((a, c, b), (a, d, c)): m.ftag[len(m.f)] = 'tailc' if kind == 'coat' else 'skirt'; m.f.append(tri)   # lip ring 3 is above/inside ring 2: same winding faces inward-down = the hem fold
  m.extra.append((first, kind))

def head_mesh(tname):
  """Head in bind pose (game frame), 8 sides x 9 rings, front planar UV for the face photo: u = .5 + x/(2W) (image-left =
  character's right = -x), v = (y - y0) / (y1 - y0) with y0 the chin and y1 just under the crown (photo crop)."""
  t = TYPES[tname]; s = t['h']; k = t['head']; y0 = 1.525 * s; Hh = .245 * k
  prof = [(0, .030, .040), (.06, .062, .072), (.16, .073, .088), (.30, .078, .095), (.45, .080, .098), (.60, .081, .099), (.75, .079, .097), (.88, .066, .084), (.97, .040, .052)]
  V = []; UV = []; F = []; R = []
  W = .080 * k
  for hf, rx, rz in prof:
    ids = []
    for j in range(8):
      a = 2 * math.pi * j / 8; x = math.sin(a) * rx * k; z = math.cos(a) * rz * k + .012 * k
      if j == 0 and .40 < hf < .50: z += .02 * k   # nose
      if j == 0 and hf < .1: z -= .004
      y = y0 + hf * Hh
      V.append((x, y, z)); UV.append((min(1, max(0, .5 + x / (2 * W))), 1 - min(1, max(0, hf / .93)))); ids.append(len(V) - 1)   # glTF-style v (image row from top), face texture flipY=false
    R.append(ids)
  for i in range(len(R) - 1):
    A, Bb = R[i], R[i + 1]
    for j in range(8):
      a, b, c, d = A[j], A[(j + 1) % 8], Bb[(j + 1) % 8], Bb[j]
      F.append((a, b, c)); F.append((a, c, d))
  for ring, top in ((R[0], False), (R[-1], True)):
    cy = V[ring[0]][1] + (.01 * k if top else -.004); V.append((0, cy, .012 * k)); UV.append((.5, 0. if top else 1.)); ci = len(V) - 1
    for j in range(8):
      a, b = ring[j], ring[(j + 1) % 8]
      F.append((ci, a, b) if top else (ci, b, a))
  return V, UV, F


# ---------------- ④-2 accessories: rigid props riding one baked bone each (per body type, bind pose, game frame).
# Texture = assets/crowd135/props135.png, 4x2 cells of 64x64 (textures135.py order); uv v runs down the image (flipY=false).
PROP_CELL = {'backpack': 0, 'satchel': 1, 'bag_kraft': 2, 'bag_white': 3, 'tote': 4, 'cap': 5, 'beanie': 6, 'phone': 7}
class Acc:
  def __init__(s, cell): s.cell = cell; s.p = []; s.uv = []
  def U(s, u, v): c = s.cell; return ((c % 4 + u) / 4, (c // 4 + v) / 2)
  def tri(s, a, b, c, ua, ub, uc): s.p += [a, b, c]; s.uv += [s.U(*ua), s.U(*ub), s.U(*uc)]
  def quad(s, a, b, c, d, r):
    """a b c d counter-clockwise seen from outside: a = bottom-left, b = bottom-right, c = top-right, d = top-left of the image rect r"""
    u0, v0, u1, v1 = r; s.tri(a, b, c, (u0, v1), (u1, v1), (u1, v0)); s.tri(a, c, d, (u0, v1), (u1, v0), (u0, v0))
  def box(s, c, sx, sy, sz, F, taper=1., top=True):
    x, y, z = c; hx, hy, hz = sx / 2, sy / 2, sz / 2; tx, tz = hx * taper, hz * taper
    P = lambda i, j, k, up: (x + i * (tx if up else hx), y + (hy if up else -hy), z + k * (tz if up else hz))
    # corners: (sign x, up?, sign z)
    q = lambda a, b, c_, d, f: s.quad(P(*a), P(*b), P(*c_), P(*d), F[f])
    q((-1, 0, 1, 0), (1, 0, 1, 0), (1, 0, 1, 1), (-1, 0, 1, 1), '+z') if False else None
    s.quad(P(-1, 0, 1, 0), P(1, 0, 1, 0), P(1, 0, 1, 1), P(-1, 0, 1, 1), F['+z'])     # +z face, image right -> +x
    s.quad(P(1, 0, -1, 0), P(-1, 0, -1, 0), P(-1, 0, -1, 1), P(1, 0, -1, 1), F['-z'])  # -z face, image right -> -x
    s.quad(P(1, 0, 1, 0), P(1, 0, -1, 0), P(1, 0, -1, 1), P(1, 0, 1, 1), F['+x'])     # +x face, image right -> -z
    s.quad(P(-1, 0, -1, 0), P(-1, 0, 1, 0), P(-1, 0, 1, 1), P(-1, 0, -1, 1), F['-x'])  # -x face, image right -> +z
    if top: s.quad(P(-1, 0, 1, 1), P(1, 0, 1, 1), P(1, 0, -1, 1), P(-1, 0, -1, 1), F['top'])
    s.quad(P(-1, 0, -1, 0), P(1, 0, -1, 0), P(1, 0, 1, 0), P(-1, 0, 1, 0), F['bot'])
  def strip(s, pts, out, w, r):
    """flat band along pts (list of points), width w, 'out' = function point -> outward normal"""
    for i in range(len(pts) - 1):
      a = Vector(pts[i]); b = Vector(pts[i + 1]); d = (b - a).normalized()
      na = Vector(out(pts[i])); nb = Vector(out(pts[i + 1]))
      sa = d.cross(na).normalized() * w / 2; sb = d.cross(nb).normalized() * w / 2
      s.quad(tuple(a - sa), tuple(a + sa), tuple(b + sb), tuple(b - sb), r)

def extent(meshes, y0, y1, axis, sign, regs=('top', 'coat', 'bottom')):
  best = 0.
  for m in meshes:
    for v, r in zip(m.v, m.r):
      if y0 <= v[1] <= y1 and r in regs: best = max(best, sign * v[axis])
  return best

def accessories(tname, meshes, B):
  t = TYPES[tname]; s = t['h']; k = t['head']; sc = .8 if tname == 'child' else 1.; out = {}
  P = lambda n: B[n][1]
  # backpack on the chest bone, flat against the back
  ch = P('chest')[1]; yb = ch - .08 * s; bh = .38 * sc; bw = .28 * sc; bd = .13 * sc
  back = extent(meshes, yb - bh / 2, yb + bh / 2, 2, -1) + .006
  A = Acc(PROP_CELL['backpack']); side = (.04, .35, .12, .65); topr = (.3, .03, .7, .1)
  A.box((0, yb, -back - bd / 2), bw, bh, bd, {'-z': (0, 0, 1, 1), '+z': side, '+x': side, '-x': side, 'top': topr, 'bot': side}, taper=.86)
  fz = extent(meshes, 1.2 * s, 1.36 * s, 2, 1) + .008
  for sg in (1, -1):
    sx = sg * .085 * t['sh']
    pts = [(sx * 1.1, yb + bh / 2 - .02, -back - .01), (sx, P('chest')[1] + .155 * s, -.07), (sx * 1.05, P('chest')[1] + .17 * s, .0), (sx * 1.15, P('chest')[1] + .12 * s, fz * .8), (sx * 1.25, ch - .05 * s, fz)]
    A.strip(pts, lambda q: (0, .6, 0) if abs(q[2]) < .03 else (0, 0, 1 if q[2] > 0 else -1), .045 * sc, side)
  out['backpack'] = ('chest', A)
  # crossbody satchel on the spine bone: bag at the right hip (-x), strap over the left shoulder
  A = Acc(PROP_CELL['satchel']); yh = .99 * s; sh_, sw, sd = .2 * sc, .28 * sc, .07 * sc
  hx = extent(meshes, yh - sh_ / 2, yh + sh_ / 2, 0, -1) + .008
  edge = (.03, .3, .09, .6)
  A.box((-hx - sd / 2, yh, .03), sd, sh_, sw, {'-x': (0, 0, 1, 1), '+x': edge, '+z': edge, '-z': edge, 'top': (.3, .02, .7, .08), 'bot': edge})
  fz2 = lambda y: extent(meshes, y - .05, y + .05, 2, 1) + .01
  bz2 = lambda y: extent(meshes, y - .05, y + .05, 2, -1) + .01
  shy = P('chest')[1] + .16 * s; shx = .1 * t['sh']
  front = [(-hx - .01, yh + sh_ / 2, .03), (-hx * .55, yh + .16 * s, fz2(yh + .16 * s)), (-.02, 1.2 * s, fz2(1.2 * s)), (shx * .6, 1.36 * s, fz2(1.36 * s) * .9), (shx, shy, .0)]
  backp = [(shx, shy, .0), (shx * .6, 1.36 * s, -bz2(1.36 * s) * .9), (-.02, 1.2 * s, -bz2(1.2 * s)), (-hx * .55, yh + .16 * s, -bz2(yh + .16 * s)), (-hx - .01, yh + sh_ / 2, .0)]
  out_n = lambda q: (q[0] * .3, .5 if abs(q[2]) < .04 else 0, 1 if q[2] > 0 else -1)
  A.strip(front, out_n, .035 * sc, edge); A.strip(backp, out_n, .035 * sc, edge)
  out['satchel'] = ('spine', A)
  # shopping bags in the right hand: handles from the grip, bag body hanging beside the leg, print on both faces
  hd = P('handR'); grip = hd[1] - .11 * s ** .5
  for name, (bt, bhh, bww, hl) in {'bag_kraft': (.11, .32, .26, .1), 'bag_white': (.1, .27, .32, .09), 'tote': (.035, .34, .32, .2)}.items():
    A = Acc(PROP_CELL[name]); bt *= sc; bhh *= sc; bww *= sc; hl *= sc
    ytop = grip - hl; yc = ytop - bhh / 2
    xb = max(abs(hd[0]), extent(meshes, yc - bhh / 2, ytop, 0, -1) + bt / 2 + .015)
    gus = (.02, .4, .07, .7)
    A.box((-xb, yc, .0), bt, bhh, bww, {'-x': (0, 0, 1, 1), '+x': (0, 0, 1, 1), '+z': gus, '-z': gus, 'top': gus, 'bot': gus})
    for zz in (-bww * .22, bww * .22):   # two handles, each a thin inverted V from the bag rim to the grip
      pts = [(-xb, ytop, zz), (-xb + (xb - abs(hd[0])) * .5, (ytop + grip) / 2 + .02 * sc, zz * .5), (-abs(hd[0]), grip, .0)]
      A.strip(pts, lambda q: (-1, 0, 0), .014, gus)
    out[name] = ('handR', A)
  # phone in the left hand, back facing out
  hl_ = P('handL'); A = Acc(PROP_CELL['phone'])
  A.box((hl_[0] + .005, hl_[1] - .11 * s ** .5, .045), .072 * sc, .15 * sc, .009, {'+z': (0, 0, 1, 1), '-z': (.3, .5, .7, .9), '+x': (.0, .4, .05, .6), '-x': (.0, .4, .05, .6), 'top': (.0, .4, .05, .6), 'bot': (.0, .4, .05, .6)})
  out['phone'] = ('handL', A)
  # hats on the head bone: dome over the head130 crown (+ hair band margin), cap brim / beanie cuff
  y0 = 1.525 * s; Hh = .245 * k; zc = .012 * k
  def dome(A, rings, apex, uvf, n=10):
    R = []
    for hf, rx, rz in rings:
      R.append([(math.sin(2 * math.pi * j / n) * rx, y0 + hf * Hh, math.cos(2 * math.pi * j / n) * rz + zc) for j in range(n)])
    top = (0, y0 + apex * Hh, zc)
    for i in range(len(R) - 1):
      for j in range(n):
        a, b, c_, d = R[i][j], R[i][(j + 1) % n], R[i + 1][(j + 1) % n], R[i + 1][j]
        A.tri(a, c_, b, uvf(a), uvf(c_), uvf(b)); A.tri(a, d, c_, uvf(a), uvf(d), uvf(c_))
    for j in range(n):
      a, b = R[-1][j], R[-1][(j + 1) % n]; A.tri(a, top, b, uvf(a), uvf(top), uvf(b))
    return R
  m_ = .014 * k
  A = Acc(PROP_CELL['cap'])
  rings = [(.64, .081 * k + m_, .099 * k + m_), (.8, .075 * k + m_, .092 * k + m_), (.93, .052 * k + m_, .066 * k + m_)]
  def capuv(q):
    if q[2] > zc - .01: return (min(1, max(0, .5 + q[0] / (2 * (.081 * k + m_) * 1.05))), min(1, max(0, 1 - (q[1] - y0 - .64 * Hh) / (.4 * Hh))))
    return (.12, .5)
  R = dome(A, rings, 1.02, capuv)
  n = len(R[0]); ring0 = R[0]
  for j in list(range(n - 3, n)) + list(range(0, 3)):   # brim over the front 6 segments
    a = ring0[j]; b = ring0[(j + 1) % n]
    ext = lambda q, f: (q[0] * 1.15, q[1] - .012 * k, q[2] + (q[2] - zc) * .9 * f)
    a2 = ext(a, 1); b2 = ext(b, 1)
    A.quad(a, b, b2, a2, (.2, .9, .8, .98)); A.quad(a2, b2, b, a, (.2, .9, .8, .98))
  out['cap'] = ('head', A)
  A = Acc(PROP_CELL['beanie']); mb = .018 * k
  rings = [(.6, .082 * k + mb, .1 * k + mb), (.68, .083 * k + mb, .101 * k + mb), (.68, .079 * k + m_, .097 * k + m_), (.84, .07 * k + m_, .087 * k + m_), (.97, .044 * k + m_, .056 * k + m_)]
  def beuv(q):
    a = math.atan2(q[0], q[2] - zc); return (abs(a) / math.pi, min(1, max(0, 1 - (q[1] - y0 - .6 * Hh) / (.48 * Hh))))
  dome(A, rings, 1.06, beuv)
  out['beanie'] = ('head', A)
  return out

# ---------------- Blender scene
bpy.ops.wm.read_factory_settings(use_empty=True)
scn = bpy.context.scene; scn.render.fps = 24

def make_armature(tname):
  B = bones_for(TYPES[tname]); ad = bpy.data.armatures.new('rig_' + tname); ob = bpy.data.objects.new('rig_' + tname, ad)
  scn.collection.objects.link(ob); bpy.context.view_layer.objects.active = ob; bpy.ops.object.mode_set(mode='EDIT')
  for n, (par, p) in B.items():
    eb = ad.edit_bones.new(n); eb.head = G2B(p)
    if n in TAIL: eb.tail = G2B(B[TAIL[n]][1])
    elif n == 'head': eb.tail = G2B((p[0], p[1] + .2, p[2]))
    elif n.startswith('hand'): eb.tail = G2B((p[0], p[1] - .15, p[2]))
    else: eb.tail = G2B((p[0], p[1], p[2] + .15))  # feet point forward
    if (eb.tail - eb.head).length < 1e-4: eb.tail = eb.head + Vector((0, 0, .05))
    eb.roll = 0
  for n, (par, p) in B.items():
    if par: ad.edit_bones[n].parent = ad.edit_bones[par]; ad.edit_bones[n].use_connect = False
  bpy.ops.object.mode_set(mode='OBJECT')
  return ob

# walk cycle: angles in character space (x = lateral pitch axis, y = yaw, z = roll), phase p in [0,1)
def walk_pose(p, tname):
  c = math.cos(2 * math.pi * p); sn = math.sin(2 * math.pi * p); c2 = math.cos(4 * math.pi * p)
  k = .8 if tname == 'child' else 1.
  P = {}
  # legs: L forward at p=0
  for side, ph in (('L', 0), ('R', .5)):
    q = 2 * math.pi * (p + ph); th = math.radians(24 * k) * math.cos(q)
    knee = math.radians(8 + 34 * max(0, math.sin(q + .5)) ** 1.5 * k + 6 * max(0, -math.cos(q)))
    P['thigh' + side] = Euler((-th, 0, 0)); P['shin' + side] = Euler((knee, 0, 0))
    P['foot' + side] = Euler((-.4 * th - .3 * knee + math.radians(4), 0, 0))
    arm = math.radians(20 * k) * -math.cos(q)
    P['upperArm' + side] = Euler((-arm, 0, (1 if side == 'L' else -1) * math.radians(-4)))
    P['foreArm' + side] = Euler((-math.radians(12 + 10 * max(0, -math.cos(q))), 0, 0))
  P['hips'] = Euler((math.radians(3), math.radians(6) * c, math.radians(3) * c))
  P['spine'] = Euler((0, -math.radians(4) * c, -math.radians(1.5) * c))
  P['chest'] = Euler((math.radians(2), -math.radians(5) * c, -math.radians(1.5) * c))
  P['neck'] = Euler((0, math.radians(4) * c, 0)); P['head'] = Euler((-math.radians(3), math.radians(1) * c, math.radians(1) * c))
  bob = .022 * k * (-c2) - .012; sway = .012 * k * c
  return P, Vector((sway, 0, bob))

def idle_pose(p, tname):
  c = math.cos(2 * math.pi * p); P = {}
  for side, sg in (('L', 1), ('R', -1)):
    P['upperArm' + side] = Euler((math.radians(2 + 1.5 * c), 0, sg * math.radians(-5)))
    P['foreArm' + side] = Euler((-math.radians(10 + 2 * c), 0, 0))
    P['thigh' + side] = Euler((0, 0, sg * math.radians(1.5) * (1 if side == 'L' else -1) * c * 0))
  P['hips'] = Euler((0, 0, math.radians(1.2) * c)); P['spine'] = Euler((math.radians(1) * c, 0, -math.radians(1) * c))
  P['chest'] = Euler((-math.radians(1.2) * c, 0, 0)); P['head'] = Euler((math.radians(1.5) * math.sin(2 * math.pi * p), math.radians(4) * math.sin(2 * math.pi * p + 1), 0))
  return P, Vector((.006 * c, 0, -.003 + .003 * c))

def char_rot(e):
  # character-space euler (x lateral, y up, z forward) -> Blender armature-space rotation
  return Euler((e.x, -e.z, e.y), 'XYZ').to_matrix().to_4x4()

CLIPS = [('walk', 24, walk_pose), ('idle', 12, idle_pose)]

def key_clips(rig, tname):
  rig.animation_data_create(); start = 0; spans = {}
  for name, n, fn in CLIPS:
    spans[name] = (start, n)
    for f in range(n):
      P, loc = fn(f / n, tname)
      for pb in rig.pose.bones:
        pb.rotation_mode = 'QUATERNION'; Bm = pb.bone.matrix_local.to_3x3().to_4x4(); Bi = Bm.inverted()
        e = P.get(pb.name)
        R = char_rot(e) if e else Matrix.Identity(4)
        pb.rotation_quaternion = (Bi @ R @ Bm).to_quaternion()
        pb.keyframe_insert('rotation_quaternion', frame=start + f)
        if pb.name == 'hips':
          pb.location = Bi.to_3x3() @ Vector((loc.x, loc.y, loc.z)); pb.keyframe_insert('location', frame=start + f)
    start += n
  for fc in rig.animation_data.action.fcurves if hasattr(rig.animation_data.action, 'fcurves') else []:
    for kp in fc.keyframe_points: kp.interpolation = 'CONSTANT'
  return spans


# ---- V75-style uv per face corner (same slots as bodies135 split75: 0 skin, 1 top front, 2 top back, 3 sleeve, 4 bottom,
# 5 shoe), welded into split vertices + map[] onto the baked (unsplit, smooth-normal) vertices.
def split137(m):
  K = m.sk; s = K['s']; coat = K['coat']; skirtish = K['skirtish']; shorts = K['shorts']; hem = K['hem']; B = K['B']
  yT = 1.485 * s; yB = (hem * s) if coat else m.hemY
  cl = lambda q: min(1., max(0., q))
  yS = B['upperArmL'][1][1]; yW = B['handL'][1][1]; cut = yS - .17 * s
  def face_slot(f, fi):
    if fi in m.ftag: return m.ftag[fi], None
    acc = {}
    for i in f:
      for n, x in m.w[i]: acc[BONECLS(n)] = acc.get(BONECLS(n), 0) + x
    dom = max(acc, key=acc.get); cy = sum(m.v[i][1] for i in f) / 3; cx = sum(m.v[i][0] for i in f) / 3
    lo = max(m.v[i][1] for i in f); hi = min(m.v[i][1] for i in f)   # all verts below lo / above hi
    if dom == 'hand': return 'skin', dom
    if dom == 'foot' or (dom == 'shin' and lo < m.shoeY): return 'shoe', dom
    if hi > m.collarY and abs(cx) < .1 * s and dom in ('neck', 'chest', 'clavicle', 'spine'): return 'skin', dom
    if dom in ('upperArm', 'foreArm'):
      if not (coat or (sil_child_long(m))) and lo < m.cutY: return 'skin', dom
      return 'sleeve', dom
    if dom in ('thigh', 'shin'):
      if skirtish: return ('waist' if hi > (hem + .1) * s else 'skin'), dom   # under the skirt: shorts/tights, not skin
      if shorts and lo < m.midY: return 'skin', dom
      return 'leg', dom
    if coat or lo > m.hemY or (hi > m.hemY - .002): return 'torso', dom
    return 'skin' if skirtish and False else 'waist', dom
  def cuv(i, kind, front):
    p = m.v[i]; x, y, z = p
    if kind in ('torso', 'tailc'):
      a = math.atan2(x, z); sn = math.sin(a)
      return (1 if front else 2, (.5 + .47 * sn) if front else (.5 - .47 * sn), cl((yT - y) / (yT - yB) * .97))
    if kind == 'skirt':
      a = math.atan2(x, z); return (4, .5 + .48 * math.sin(a), cl((m.hemY + .01 * s - y) / (m.hemY + .01 * s - hem * s)))
    if kind == 'waist':
      a = math.atan2(x, z); return (4, .5 + .475 * math.sin(a), cl((1.06 * s - y) / (.985 * s)))
    if kind == 'leg':
      side = 'L' if x > 0 else 'R'; c = closest(Vector(p) / s, 'thigh' + side if y > B['shinL'][1][1] else 'shin' + side) * s
      a = math.atan2(x - c.x, z - c.z); return (4, (.75 if side == 'L' else .25) + .23 * math.sin(a), cl((1.06 * s - y) / (.985 * s)))
    if kind == 'sleeve':
      side = 'L' if x > 0 else 'R'; c = closest(Vector(p) / s, 'upperArm' + side if y > B['foreArmL'][1][1] else 'foreArm' + side) * s
      a = math.atan2((x - c.x) * (1 if side == 'L' else -1), z - c.z); return (3, .5 + .45 * math.sin(a), cl((yS - y) / (yS - yW)))
    return (5 if kind == 'shoe' else 0, 0., 0.)
  keys = {}; mp = []; uv = []; sl = []; F = []
  for fi, f in enumerate(m.f):
    kind, dom = face_slot(f, fi)
    front = sum(m.v[i][2] for i in f) >= 0
    nf = []
    for i in f:
      q = cuv(i, kind, front); k = (i, q[0], round(q[1], 4), round(q[2], 4))
      if k not in keys: keys[k] = len(mp); mp.append(i); sl.append(q[0]); uv.append((q[1], q[2]))
      nf.append(keys[k])
    F.append(tuple(nf))
  return mp, uv, sl, F
def sil_child_long(m): return m.sk.get('long', False)

rigs = {}; heads = {}; bodies = []; accs = {}
for tname in TYPES:
  rig = make_armature(tname); rigs[tname] = (rig, key_clips(rig, tname))
  for sil in SILS:
    m, B = body(tname, sil); m.sk['long'] = (sil == 'skirt' and tname == 'child')
    me = bpy.data.meshes.new(f'{tname}_{sil}'); me.from_pydata([G2B(v) for v in m.v], [], m.f); me.update()
    ob = bpy.data.objects.new(me.name, me); scn.collection.objects.link(ob)
    for n in B: ob.vertex_groups.new(name=n)
    for i, w in enumerate(m.w):
      tot = sum(x[1] for x in w)
      for n, x in w: ob.vertex_groups[n].add([i], x / tot, 'ADD')
    mod = ob.modifiers.new('rig', 'ARMATURE'); mod.object = rig; ob.parent = rig
    bodies.append((tname, sil, ob, m))
  heads[tname] = head_mesh(tname)
  accs[tname] = accessories(tname, [x[3] for x in bodies if x[0] == tname], B)


dg = bpy.context.evaluated_depsgraph_get()
blobs = bytearray(); meta = {'version': '135z', 'fps': 24, 'clips': {}, 'bodies': [], 'heads': {}, 'posScale': 1 / 8192, 'regions': REG}
def put(b):
  global blobs
  while len(blobs) % 4: blobs.append(0)
  off = len(blobs); blobs += b; return [off, len(b)]
frames = []
for name, n, _ in CLIPS: meta['clips'][name] = {'start': len(frames), 'frames': n}; frames += [(name, f) for f in range(n)]
spans0 = rigs['man'][1]
for tname, sil, ob, m in bodies:
  rig, spans = rigs[tname]; nv = len(m.v)
  pos = bytearray(); nrm = bytearray()
  for name, f in frames:
    scn.frame_set(spans[name][0] + f); dg = bpy.context.evaluated_depsgraph_get(); ev = ob.evaluated_get(dg); me = ev.to_mesh()
    assert len(me.vertices) == nv
    me.calc_loop_triangles() if hasattr(me, 'calc_loop_triangles') else None
    for v in me.vertices:
      x, y, z = B2G(v.co); pos += struct.pack('<3h', *[max(-32767, min(32767, round(c * 8192))) for c in (x, y, z)])
      nx, ny, nz = B2G(v.normal); nrm += struct.pack('<3b', *[max(-127, min(127, round(c * 127))) for c in (nx, ny, nz)])
    ev.to_mesh_clear()
  mp, uv75, sl75, F75 = split137(m)
  idx = struct.pack(f'<{len(F75)*3}H', *[i for f in F75 for i in f])
  ys = [v[1] for v in m.v]
  meta['bodies'].append({'type': tname, 'sil': sil, 'verts': nv, 'tris': len(F75), 'height': max(ys), 'index': put(idx),
                         'pos': put(bytes(pos)), 'nrm': put(bytes(nrm)), 'split': len(mp), 'map': put(struct.pack(f'<{len(mp)}H', *mp)),
                         'slot': put(bytes(sl75)), 'uv75': put(struct.pack(f'<{len(mp)*2}f', *[c for u in uv75 for c in u]))})
  print('body', tname, sil, nv, 'verts', len(mp), 'split', len(m.f), 'tris')
for tname, (V, UV, F) in heads.items():
  rig, spans = rigs[tname]; BM = {b: bytearray() for b in ('head', 'spine', 'chest', 'hips', 'handL', 'handR')}
  for name, f in frames:
    scn.frame_set(spans[name][0] + f); bpy.context.view_layer.update()
    for bn, mats_b in BM.items():
      pb = rig.pose.bones[bn]
      D = rig.matrix_world @ pb.matrix @ pb.bone.matrix_local.inverted()
      # convert the Blender-space deformation matrix to the game frame: G = C^-1 D C, C maps game->blender
      C = Matrix(((1, 0, 0, 0), (0, 0, -1, 0), (0, 1, 0, 0), (0, 0, 0, 1)))
      Gm = C.inverted() @ D @ C
      mats_b += struct.pack('<12f', *[Gm[r][c] for c in range(4) for r in range(3)])
  mats = BM['head']
  meta['heads'][tname] = {'verts': len(V), 'tris': len(F), 'pos': put(struct.pack(f'<{len(V)*3}f', *[c for v in V for c in v])),
                          'uv': put(struct.pack(f'<{len(UV)*2}f', *[c for u in UV for c in u])), 'index': put(struct.pack(f'<{len(F)*3}H', *[i for f in F for i in f])),
                          'mat': put(bytes(mats)), 'bones': {b: put(bytes(v)) for b, v in BM.items() if b != 'head'}}
  ac = {}
  for an, (bone, A) in accs[tname].items():
    nn = []
    for i in range(0, len(A.p), 3):
      a, b, c = (Vector(A.p[i + j]) for j in range(3)); nv_ = (b - a).cross(c - a); nv_ = nv_.normalized() if nv_.length > 1e-9 else Vector((0, 1, 0)); nn += [nv_] * 3
    ac[an] = {'bone': bone, 'verts': len(A.p), 'pos': put(struct.pack(f'<{len(A.p)*3}f', *[c for p_ in A.p for c in p_])),
              'nrm': put(struct.pack(f'<{len(nn)*3}f', *[c for p_ in nn for c in p_])), 'uv': put(struct.pack(f'<{len(A.uv)*2}f', *[c for u in A.uv for c in u]))}
  meta['heads'][tname]['acc'] = ac
J = json.dumps(meta, separators=(',', ':')).encode()
pad = (4 - (len(J) + 4) % 4) % 4; J += b' ' * pad
with open(OUT + '/crowd135.bin', 'wb') as fh: fh.write(struct.pack('<I', len(J))); fh.write(J); fh.write(blobs)
bpy.ops.wm.save_as_mainfile(filepath=OUT + '/crowd135.blend')
print('WROTE', OUT + '/crowd135.bin', 4 + len(J) + len(blobs))
