# V135-capital ④-1 crowd bodies (notes/plan-v135-capital.md §3). Run with Blender 5.1 (arm64):
#   blender -b -P bc/scripts/crowd135/bodies135.py -- OUT_DIR
# Builds 4 body types (man / woman / heavy / child) x 3 silhouettes (short top + trousers, long coat, skirt-or-shorts)
# = 12 PS1 low-poly bodies, each skinned to the same 19-bone V75 hierarchy (scaled per body type) with explicit ring
# weights, keys ONE shared walk cycle (24 frames, 1 s at 24 Hz) and one idle loop (12 frames) as Blender actions, and
# evaluates the armature-deformed meshes frame by frame through the depsgraph. Output OUT_DIR/crowd135.bin:
#   [u32 json length][json][binary blocks]; json lists every block's byte offset (see JS reader dist/crowd135.js).
# The head is NOT in the body stream: each body type gets one front-UV'd head (face photo planar projection, a nose
# vertex at u .5) in bind pose plus the head bone's deformation matrix per frame; the runtime turns it into a whole
# head with retro-head130-gen retrofitSkinnedHead130 (generated rear band + modelled ears, no painted ears).
# Game frame: metres, +Y up, character faces +Z, +X = character's left. Blender frame: (x, -z, y).
import bpy, bmesh, sys, json, struct, math
from mathutils import Vector, Matrix, Quaternion, Euler

OUT = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else '/tmp'
G2B = lambda p: Vector((p[0], -p[2], p[1]))
B2G = lambda v: (v[0], v[2], -v[1])

TYPES = {
 'man':   dict(h=1.00, sh=1.00, hip=1.00, g=1.00, belly=1.00, head=1.00, chest=1.00),
 'woman': dict(h=.945, sh=.88, hip=1.08, g=.92, belly=.95, head=.96, chest=1.06),
 'heavy': dict(h=.985, sh=1.08, hip=1.18, g=1.30, belly=1.55, head=1.03, chest=1.12),
 'child': dict(h=.72, sh=.80, hip=.88, g=.86, belly=1.05, head=.90, chest=.92),
}
SILS = ['short', 'coat', 'skirt']   # 'skirt' = skirt for woman/child, shorts for man/heavy
REG = {'skin': 0, 'top': 1, 'bottom': 2, 'shoe': 3, 'coat': 4, 'trim': 5}

def bones_for(t):
  s = t['h']; sh = t['sh']
  B = {}
  def b(n, par, p): B[n] = (par, (p[0], p[1] * s, p[2]))
  b('hips', None, (0, .96, 0)); b('spine', 'hips', (0, 1.13, 0)); b('chest', 'spine', (0, 1.315, 0))
  b('neck', 'chest', (0, 1.51, 0)); b('head', 'neck', (0, 1.535, 0))
  for side, sg in (('L', 1), ('R', -1)):
    b('clavicle' + side, 'chest', (sg * .115 * sh, 1.45, 0)); b('upperArm' + side, 'clavicle' + side, (sg * .235 * sh, 1.45, 0))
    b('foreArm' + side, 'upperArm' + side, (sg * .245 * sh, 1.14, 0)); b('hand' + side, 'foreArm' + side, (sg * .25 * sh, .87, 0))
    b('thigh' + side, 'hips', (sg * .1 * t['hip'], .93, 0)); b('shin' + side, 'thigh' + side, (sg * .1 * t['hip'], .505, 0))
    b('foot' + side, 'shin' + side, (sg * .1 * t['hip'], .075, 0))
  return B

TAIL = {'hips': 'spine', 'spine': 'chest', 'chest': 'neck', 'neck': 'head', 'clavicleL': 'upperArmL', 'clavicleR': 'upperArmR',
        'upperArmL': 'foreArmL', 'upperArmR': 'foreArmR', 'foreArmL': 'handL', 'foreArmR': 'handR', 'thighL': 'shinL', 'thighR': 'shinR',
        'shinL': 'footL', 'shinR': 'footR'}

class Mesh:
  def __init__(s): s.v = []; s.w = []; s.r = []; s.f = []
  def ring(s, c, rx, rz, n, w, reg, a0=0., squash=None):
    out = []
    for k in range(n):
      a = a0 + 2 * math.pi * k / n
      x = math.sin(a) * rx; z = math.cos(a) * rz
      if squash: x, z = squash(a, x, z)
      s.v.append((c[0] + x, c[1], c[2] + z)); s.w.append(w); s.r.append(reg); out.append(len(s.v) - 1)
    return out
  def bridge(s, A, B):
    n = len(A)
    for k in range(n):
      a, b, c, d = A[k], A[(k + 1) % n], B[(k + 1) % n], B[k]
      s.f.append((a, b, c)); s.f.append((a, c, d))
  def cap(s, R, c, w, reg, up):
    s.v.append(c); s.w.append(w); s.r.append(reg); ci = len(s.v) - 1; n = len(R)
    for k in range(n):
      a, b = R[k], R[(k + 1) % n]
      s.f.append((ci, a, b) if up else (ci, b, a))
  def box(s, c, sx, sy, sz, w, reg, taper=1.):
    x, y, z = c; P = []
    for dy in (-1, 1):
      k = taper if dy > 0 else 1
      for dx, dz in ((-1, 1), (1, 1), (1, -1), (-1, -1)):
        s.v.append((x + dx * sx / 2 * k, y + dy * sy / 2, z + dz * sz / 2 * k)); s.w.append(w); s.r.append(reg); P.append(len(s.v) - 1)
    b0, t0 = P[:4], P[4:]
    s.bridge(b0, t0); s.f += [(b0[0], b0[2], b0[1]), (b0[0], b0[3], b0[2]), (t0[0], t0[1], t0[2]), (t0[0], t0[2], t0[3])]

def tube(m, pts, n, reg, capA=False, capB=False, a0=0.):
  """pts: list of (centre, rx, rz, weights[, reg]) rings, bottom to top or along a chain"""
  R = []
  for q in pts:
    R.append(m.ring(q[0], q[1], q[2], n, q[3], q[4] if len(q) > 4 else reg, a0))
  for i in range(len(R) - 1): m.bridge(R[i], R[i + 1])
  if capA: m.cap(R[0], pts[0][0], pts[0][3], reg, False)
  if capB: m.cap(R[-1], pts[-1][0], pts[-1][3], reg, True)
  return R

def body(tname, sil):
  t = TYPES[tname]; B = bones_for(t); s = t['h']; g = t['g']; m = Mesh()
  P = lambda n: B[n][1]
  W = lambda *a: list(zip(a[0::2], a[1::2]))
  skirtish = sil == 'skirt' and tname in ('woman', 'child')
  shorts = sil == 'skirt' and not skirtish
  coat = sil == 'coat'
  top = 'coat' if coat else 'top'
  # ---- torso (8 sides): crotch -> shoulders
  bel = t['belly']
  def tor(y, rx, rz, w, reg, zoff=0.): return ((0, y * s, zoff), rx, rz, w, reg)
  T = [tor(.885, .135 * t['hip'] * g, .095 * g, W('hips', 1), 'bottom'),
       tor(.97, .165 * t['hip'] * g, .11 * g, W('hips', 1), 'bottom'),
       tor(1.06, .15 * g * (1 + (bel - 1) * .5), .105 * g * bel, W('hips', .5, 'spine', .5), 'bottom' if not coat else top, .01 * (bel - 1)),
       tor(1.06, .15 * g * (1 + (bel - 1) * .5), .105 * g * bel, W('hips', .5, 'spine', .5), top, .01 * (bel - 1)),
       tor(1.19, .152 * g * (1 + (bel - 1) * .45), .112 * g * bel, W('spine', 1), top, .02 * (bel - 1)),
       tor(1.32, .168 * t['sh'] * g ** .5, .112 * g ** .7 * t['chest'], W('chest', .7, 'spine', .3), top),
       tor(1.43, .185 * t['sh'], .095 * g ** .5, W('chest', 1), top),
       tor(1.485, .11 * t['sh'], .075, W('chest', .6, 'neck', .4), top)]
  if coat:   # coat body continues the torso line down over the hips
    T[0] = tor(.885, .17 * t['hip'] * g, .12 * g, W('hips', 1), top); T[1] = tor(.97, .172 * t['hip'] * g, .118 * g, W('hips', 1), top)
    T[2] = T[3]
  Rt = tube(m, [q[:4] + (q[4],) for q in T], 8, top, capA=not (coat or skirtish))
  # neck (skin) and collar
  tube(m, [((0, 1.47 * s, -.005), .055, .05, W('neck', .5, 'chest', .5), 'skin'), ((0, 1.545 * s, -.008), .05, .047, W('neck', .3, 'head', .7), 'skin')], 6, 'skin')
  # ---- skirt / coat skirt: cone from the hips to the knee, weighted to hips + thighs by side
  if coat or skirtish:
    kn = .50 if coat else (.56 if tname == 'woman' else .52)
    def sq(a, x, z): return x, z
    rings = [((0, .97 * s, 0), .172 * t['hip'] * g, .118 * g), ((0, .76 * s, 0), .19 * t['hip'] * g, .135 * g), ((0, kn * s, 0), .215 * t['hip'] * g, .155 * g)]
    reg = top if coat else 'bottom'
    R = []
    for i, (c, rx, rz) in enumerate(rings):
      ids = []
      for k in range(10):
        a = 2 * math.pi * k / 10; x = math.sin(a) * rx; z = math.cos(a) * rz
        side = 'L' if x > 0 else 'R'; f = min(1, abs(x) / rx * 1.4)
        w = W('hips', 1) if i == 0 else W('thigh' + side, .55 * f + (.25 if i == 2 else 0), 'hips', 1 - .55 * f - (.25 if i == 2 else 0))
        m.v.append((c[0] + x, c[1], c[2] + z)); m.w.append(w); m.r.append(reg); ids.append(len(m.v) - 1)
      R.append(ids)
    for i in range(2): m.bridge(R[i], R[i + 1])
    if coat:   # hem trim
      pass
  # ---- legs (6 sides): thigh, knee, ankle; shoe box
  for side, sg in (('L', 1), ('R', -1)):
    x = P('thigh' + side)[0]; th = P('thigh' + side); kn = P('shin' + side); an = P('foot' + side)
    legreg_up = 'bottom'; legreg_lo = 'skin' if (skirtish or shorts) else 'bottom'
    rT = .088 * g * t['hip'] ** .5; rK = .058 * g ** .7; rA = .04 * g ** .5
    if shorts:
      tube(m, [((x, th[1], 0), rT, rT * .95, W('thigh' + side, 1)), ((x, (th[1] + kn[1]) / 2 - .03 * s, .005), rT * .92, rT * .9, W('thigh' + side, 1))], 6, 'bottom', a0=math.pi / 6)
      tube(m, [((x, (th[1] + kn[1]) / 2 - .03 * s, .005), rT * .7, rT * .68, W('thigh' + side, 1)), ((x, kn[1], .01), rK, rK, W('thigh' + side, .5, 'shin' + side, .5)),
               ((x, an[1] + .03, -.005), rA, rA, W('shin' + side, 1))], 6, 'skin', a0=math.pi / 6)
    else:
      top_y = th[1]
      if skirtish:   # bare/tights legs start inside the skirt
        tube(m, [((x * .9, .80 * s, 0), rT * .85, rT * .8, W('thigh' + side, 1)), ((x, kn[1], .01), rK, rK, W('thigh' + side, .5, 'shin' + side, .5)),
                 ((x, an[1] + .03, -.005), rA, rA, W('shin' + side, 1))], 6, 'skin', a0=math.pi / 6)
      else:
        tube(m, [((x, top_y, 0), rT, rT * .95, W('thigh' + side, 1)), ((x, kn[1], .01), rK, rK, W('thigh' + side, .5, 'shin' + side, .5)),
                 ((x, an[1] + .045, -.005), rA * 1.15, rA * 1.15, W('shin' + side, 1))], 6, 'bottom', a0=math.pi / 6)
    # shoe: tapered box, heel at the ankle, toe forward
    fl = .25 * (s ** .8); m.box((x, .045, .045 * s), .095 * g ** .3, .09, fl, W('foot' + side, 1), 'shoe', taper=.85)
  # ---- arms (6 sides): shoulder, elbow, wrist; hand box
  for side, sg in (('L', 1), ('R', -1)):
    ua = P('upperArm' + side); fa = P('foreArm' + side); hd = P('hand' + side)
    rS = .058 * g ** .6; rE = .044 * g ** .6; rW = .034 * g ** .4
    sleeve_full = coat or (tname in ('man', 'heavy') and sil == 'short' and False)
    sh = ((ua[0] - sg * .01, ua[1] - .01, 0), rS, rS * .95, W('upperArm' + side, .8, 'clavicle' + side, .2))
    el = ((fa[0], fa[1], -.005), rE, rE, W('upperArm' + side, .5, 'foreArm' + side, .5))
    mid = ((ua[0] * .5 + fa[0] * .5, (ua[1] + fa[1]) / 2 - .02, 0), rS * .93, rS * .9, W('upperArm' + side, 1))
    wr = ((hd[0], hd[1] + .01, 0), rW, rW, W('foreArm' + side, 1))
    if coat or sil == 'skirt' and tname == 'child':
      tube(m, [sh, mid, el, wr], 6, top)
    else:   # short sleeve: cloth to mid upper arm, skin below
      tube(m, [sh, mid], 6, top)
      tube(m, [(mid[0], mid[1] * .82, mid[2] * .82, mid[3]), el, wr], 6, 'skin')
    m.box((hd[0], hd[1] - .075 * s ** .5, .005), .045 * g ** .3, .15 * s ** .5, .07, W('hand' + side, 1), 'skin', taper=.8)
  return m, B

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

rigs = {}; heads = {}; bodies = []
for tname in TYPES:
  rig = make_armature(tname); rigs[tname] = (rig, key_clips(rig, tname))
  for sil in SILS:
    m, B = body(tname, sil)
    me = bpy.data.meshes.new(f'{tname}_{sil}'); me.from_pydata([G2B(v) for v in m.v], [], m.f); me.update()
    ob = bpy.data.objects.new(me.name, me); scn.collection.objects.link(ob)
    for n in B: ob.vertex_groups.new(name=n)
    for i, w in enumerate(m.w):
      tot = sum(x[1] for x in w)
      for n, x in w: ob.vertex_groups[n].add([i], x / tot, 'ADD')
    mod = ob.modifiers.new('rig', 'ARMATURE'); mod.object = rig; ob.parent = rig
    bodies.append((tname, sil, ob, m))
  heads[tname] = head_mesh(tname)

dg = bpy.context.evaluated_depsgraph_get()
blobs = bytearray(); meta = {'version': '135x', 'fps': 24, 'clips': {}, 'bodies': [], 'heads': {}, 'posScale': 1 / 8192, 'regions': REG}
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
  idx = struct.pack(f'<{len(m.f)*3}H', *[i for f in m.f for i in f])
  ys = [v[1] for v in m.v]
  meta['bodies'].append({'type': tname, 'sil': sil, 'verts': nv, 'tris': len(m.f), 'height': max(ys), 'index': put(idx),
                         'region': put(bytes(REG[r] for r in m.r)), 'pos': put(bytes(pos)), 'nrm': put(bytes(nrm))})
  print('body', tname, sil, nv, 'verts', len(m.f), 'tris')
for tname, (V, UV, F) in heads.items():
  rig, spans = rigs[tname]; pb = rig.pose.bones['head']; mats = bytearray()
  for name, f in frames:
    scn.frame_set(spans[name][0] + f); bpy.context.view_layer.update()
    D = rig.matrix_world @ pb.matrix @ pb.bone.matrix_local.inverted()
    # convert the Blender-space deformation matrix to the game frame: G = C^-1 D C, C maps game->blender
    C = Matrix(((1, 0, 0, 0), (0, 0, -1, 0), (0, 1, 0, 0), (0, 0, 0, 1)))
    Gm = C.inverted() @ D @ C
    mats += struct.pack('<12f', *[Gm[r][c] for c in range(4) for r in range(3)])
  meta['heads'][tname] = {'verts': len(V), 'tris': len(F), 'pos': put(struct.pack(f'<{len(V)*3}f', *[c for v in V for c in v])),
                          'uv': put(struct.pack(f'<{len(UV)*2}f', *[c for u in UV for c in u])), 'index': put(struct.pack(f'<{len(F)*3}H', *[i for f in F for i in f])),
                          'mat': put(bytes(mats))}
J = json.dumps(meta, separators=(',', ':')).encode()
pad = (4 - (len(J) + 4) % 4) % 4; J += b' ' * pad
with open(OUT + '/crowd135.bin', 'wb') as fh: fh.write(struct.pack('<I', len(J))); fh.write(J); fh.write(blobs)
bpy.ops.wm.save_as_mainfile(filepath=OUT + '/crowd135.blend')
print('WROTE', OUT + '/crowd135.bin', 4 + len(J) + len(blobs))
