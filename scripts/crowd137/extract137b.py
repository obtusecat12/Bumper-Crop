# V137 Q1b: crowd base mesh from the CC0 orange juice games "free psx and n64 male base mesh"
# (https://orange-juice-games.itch.io/psx-and-n64-male-base-mesh, psx_male_base_mesh.glb, CC0 1.0).
# Replaces the Wobble Blocks base of Q1 (user 10-20 22:38: no neck, proportions did not match the V75 cast).
#  - arms lowered from the A pose to the V75 hanging pose, legs stretched 6 % (V75 / Hope St keeper proportions),
#  - head removed at the jaw, the modelled neck kept and extended up into the head130 head (two tapered rings + cap,
#    hidden inside the skull) -> no gap between collar and chin,
#  - duplicate (uv seam) vertices welded, one Catmull-Clark level (weights interpolated) -> ~1100 tris,
#  - weights merged onto the V75 19-bone set, 'Femme' derived from the same mesh by smooth shape offsets.
# Output = base137.json in the same contract as extract137.py (joints + meshes Masc/Femme v/f/w, game frame:
# x = character left, y up, z forward). Run: blender -b -P extract137b.py -- GLB OUT.json
import bpy, bmesh, sys, json, math
from mathutils import Matrix, Vector
A = sys.argv[sys.argv.index('--') + 1:]; GLB, OUT = A[0], A[1]
DOWN = math.radians(24)      # extra arm drop (A pose 33 deg from vertical -> ~13 deg)
K = .863                     # metres per base unit after the leg stretch: neck ring under the chin at ~1.48
LEG = 1.06; Z0 = -.995; THZ = -.038   # base floor and thigh joint height
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=GLB)
for o in list(bpy.data.objects):
  if o.name == 'Icosphere': bpy.data.objects.remove(o)
rig = bpy.data.objects['metarig']; ob = bpy.data.objects['mesh']
for pb in rig.pose.bones: pb.rotation_mode = 'QUATERNION'; pb.rotation_quaternion = (1, 0, 0, 0)
for s, sg in (('L', 1), ('R', -1)):
  pb = rig.pose.bones[f'upper_arm.{s}']; h = pb.head.copy()
  pb.matrix = Matrix.Translation(h) @ Matrix.Rotation(sg * DOWN, 4, 'Y') @ Matrix.Translation(-h) @ pb.matrix
  bpy.context.view_layer.update()
for s in 'LR': print('ARM', s, tuple(round(c, 3) for c in rig.matrix_world @ rig.pose.bones[f'hand.{s}'].head))

def g(v):   # base (x fwd, y left, z up) -> game, legs stretched
  z = v[2] - Z0; th = THZ - Z0
  z = z * LEG if z < th else th * LEG + (z - th)
  return Vector((v[1] * K, z * K, v[0] * K))
MAP = {'spine': 'hips', 'spine.002': 'neck', 'spine.003': 'neck'}
for s in 'LR':
  MAP.update({f'shoulder.{s}': 'clavicle' + s, f'upper_arm.{s}': 'upperArm' + s, f'forearm.{s}': 'foreArm' + s, f'hand.{s}': 'hand' + s,
              f'pelvis.{s}': 'hips', f'thigh.{s}': 'thigh' + s, f'shin.{s}': 'shin' + s, f'foot.{s}': 'foot' + s, f'toe.{s}': 'foot' + s, f'heel.02.{s}': 'foot' + s})
P = lambda n: rig.matrix_world @ rig.pose.bones[n].head
J = {'hips': g(P('spine')), 'spine': g(P('spine.001')), 'chest': g((P('spine.001') + rig.matrix_world @ rig.pose.bones['spine.001'].tail) / 2),
     'neck': g(P('spine.002')), 'head': g(P('spine.003'))}
for s in 'LR':
  J.update({'clavicle' + s: g(P(f'shoulder.{s}')), 'upperArm' + s: g(P(f'upper_arm.{s}')), 'foreArm' + s: g(P(f'forearm.{s}')),
            'hand' + s: g(P(f'hand.{s}')), 'thigh' + s: g(P(f'thigh.{s}')), 'shin' + s: g(P(f'shin.{s}')), 'foot' + s: g(P(f'foot.{s}'))})
for n in ('hips', 'spine', 'chest', 'neck', 'head'): J[n].x = 0
J['neck'].z = J['head'].z = -.004
spineMidZ = [J['spine'].y, J['chest'].y]

dg = bpy.context.evaluated_depsgraph_get(); ev = ob.evaluated_get(dg); me = ev.to_mesh(); me.calc_loop_triangles()
orig = ob.data; gn = {gr.index: gr.name for gr in ob.vertex_groups}
# weld uv-seam duplicates, drop the head (keep the modelled neck ring at z .71, drop the jaw/skull)
key = {}; V = []; W = []; vmap = {}
for v in orig.vertices:
  co0 = ob.matrix_world @ v.co
  if co0.z > .715 or (co0.z > .69 and co0.x > .07): vmap[v.index] = None; continue
  k = tuple(round(c, 4) for c in co0)
  if k not in key:
    key[k] = len(V); p = g(ob.matrix_world @ me.vertices[v.index].co); V.append(p)
    acc = {}
    for ge in v.groups:
      nm = gn[ge.group]; w = ge.weight
      if w <= 0: continue
      if nm == 'spine.001':   # long base bone -> V75 spine / chest by height
        t = max(0., min(1., (p.y - spineMidZ[0]) / (spineMidZ[1] - spineMidZ[0] + 1e-6)))
        acc['spine'] = acc.get('spine', 0) + w * (1 - t); acc['chest'] = acc.get('chest', 0) + w * t
      else:
        m = MAP[nm]; acc[m] = acc.get(m, 0) + w
    W.append(acc)
  vmap[v.index] = key[k]
F = []
for t in me.loop_triangles:
  ids = [vmap[i] for i in t.vertices]
  if None in ids or len(set(ids)) < 3: continue
  F.append(ids)
ev.to_mesh_clear()
# open neck boundary -> extend up into the head
from collections import Counter
ec = Counter()
for f in F:
  for a, b in ((f[0], f[1]), (f[1], f[2]), (f[2], f[0])): ec[tuple(sorted((a, b)))] += 1
bnd = [e for e, c in ec.items() if c == 1]
bv = sorted(set(i for e in bnd for i in e)); print('BOUNDARY verts', len(bv), [tuple(round(c, 3) for c in V[i]) for i in bv])
ring = [i for i in bv if V[i].y > 1.3]
c0 = sum((V[i] for i in ring), Vector()) / len(ring)
ring.sort(key=lambda i: math.atan2(V[i].x - c0.x, V[i].z - c0.z))
# orient: does the existing face on each boundary edge wind a->b or b->a?
def dirok(a, b):
  for f in F:
    for x, y in ((f[0], f[1]), (f[1], f[2]), (f[2], f[0])):
      if x == a and y == b: return True
  return False
prev = ring; rings = [(.045, .97, .008, {'neck': .5, 'head': .5}), (.080, .84, .012, {'head': 1.})]
for dy, sc, dz, w in rings:
  new = []
  for i in prev:
    q = Vector((c0.x + (V[i].x - c0.x) * sc, c0.y + dy, c0.z + dz + (V[i].z - c0.z) * sc))
    V.append(q); W.append(dict(w)); new.append(len(V) - 1)
  n = len(prev)
  for k in range(n):
    a, b, c, d = prev[k], prev[(k + 1) % n], new[(k + 1) % n], new[k]
    if dirok(a, b): F += [[b, a, d], [b, d, c]]
    else: F += [[a, b, c], [a, c, d]]
  prev = new
top = Vector((c0.x, c0.y + .095, c0.z + .012)); V.append(top); W.append({'head': 1.}); ti = len(V) - 1
n = len(prev)
for k in range(n):
  a, b = prev[k], prev[(k + 1) % n]
  F.append([b, a, ti] if dirok(ring[k], ring[(k + 1) % n]) else [a, b, ti])
# Blender mesh (Blender frame = game -> (x, -z, y)) + one Catmull-Clark level with weights
G2B = lambda p: Vector((p.x, -p.z, p.y))
mesh = bpy.data.meshes.new('base'); mesh.from_pydata([G2B(p) for p in V], [], F); mesh.update()
mo = bpy.data.objects.new('base', mesh); bpy.context.scene.collection.objects.link(mo)
BN = sorted(set(n for w in W for n in w))
for n in BN: mo.vertex_groups.new(name=n)
for i, w in enumerate(W):
  tot = sum(w.values()) or 1
  for n, x in w.items(): mo.vertex_groups[n].add([i], x / tot, 'REPLACE')
bpy.context.view_layer.objects.active = mo; mo.select_set(True)
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.normals_make_consistent(inside=False)
bpy.ops.mesh.tris_convert_to_quads(face_threshold=math.radians(50), shape_threshold=math.radians(50))
bpy.ops.object.mode_set(mode='OBJECT')
sub = mo.modifiers.new('sub', 'SUBSURF'); sub.levels = 1; sub.render_levels = 1; sub.boundary_smooth = 'ALL'
bpy.ops.object.modifier_apply(modifier='sub')
# Catmull-Clark shrinks the silhouette: push every vertex back out from its bone segments (girth restore)
CH = {'hips': 'spine', 'spine': 'chest', 'chest': 'neck', 'neck': 'head'}
for s in 'LR': CH.update({'clavicle' + s: 'upperArm' + s, 'upperArm' + s: 'foreArm' + s, 'foreArm' + s: 'hand' + s, 'thigh' + s: 'shin' + s, 'shin' + s: 'foot' + s})
def seg(n):
  a = J[n]; b = J[CH[n]] if n in CH else a + (Vector((0, -.1, 0)) if n.startswith('hand') else Vector((0, -.05, .12)) if n.startswith('foot') else Vector((0, .15, 0)))
  return a, b
def closest(p, n):
  a, b = seg(n); d = b - a; t = max(0., min(1., (p - a).dot(d) / d.length_squared)); return a + d * t
GROW = float(A[2]) if len(A) > 2 else 1.16
B2G = lambda v: Vector((v[0], v[2], -v[1]))
me2 = mo.data; gi = {gr.index: gr.name for gr in mo.vertex_groups}
for v in me2.vertices:
  p = B2G(v.co); q = Vector(); tot = 0
  for ge in v.groups:
    if ge.weight <= 1e-4: continue
    c = closest(p, gi[ge.group]); q += ge.weight * (c + (p - c) * GROW); tot += ge.weight
  if tot: v.co = G2B(q / tot)
# horizontal edge loops exactly at the garment cut lines (shirt hem, t-shirt sleeve, shorts) -> straight hems
CUTS = {'hem': J['thighL'].y + .07, 'sleeve': J['upperArmL'].y - .17, 'mid': (J['thighL'].y + J['shinL'].y) / 2 - .03}
bm = bmesh.new(); bm.from_mesh(me2)
for y in CUTS.values():
  bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=(0, 0, y), plane_no=(0, 0, 1))
bmesh.ops.triangulate(bm, faces=bm.faces[:]); bm.to_mesh(me2); bm.free(); me2.update(); me2.calc_loop_triangles()
VV = [B2G(v.co) for v in me2.vertices]; FF = [list(t.vertices) for t in me2.loop_triangles]
WW = []
for v in me2.vertices:
  it = sorted(((gi[ge.group], ge.weight) for ge in v.groups if ge.weight > 1e-4), key=lambda x: -x[1])[:4]; tot = sum(x[1] for x in it) or 1
  WW.append([[n, round(x / tot, 4)] for n, x in it])
print('NOWEIGHT', sum(1 for w in WW if not w))
res = {'src': 'orange juice games, free psx and n64 male base mesh, CC0, https://orange-juice-games.itch.io/psx-and-n64-male-base-mesh',
       'joints': {n: [round(c, 5) for c in v] for n, v in J.items()}, 'cuts': CUTS, 'meshes': {}}
def femme(p):
  x, y, z = p.x, p.y, p.z; sm = lambda a, b, t: max(0., min(1., (t - a) / (b - a))) ** 2 * (3 - 2 * max(0., min(1., (t - a) / (b - a))))
  band = lambda c, w: max(0., 1 - abs(y - c) / w)
  sx = 1 - .10 * sm(1.25, 1.42, y) - .13 * band(1.12, .10) + .10 * band(.92, .11)   # narrow shoulders, waist, wider hips
  nx = x * sx; nz = z
  if z > 0 and abs(x) < .14: nz += .045 * band(1.28, .075) * max(0., 1 - abs(abs(x) - .065) / .07)   # bust
  if z < 0: nz -= .018 * band(.86, .09)   # seat
  if y < .86 and abs(x) > .02: nx = x * .93 + (.01 if x > 0 else -.01)            # slimmer legs
  return Vector((nx, y, nz))
for name, fn in (('Masc', lambda p: p), ('Femme', femme)):
  res['meshes'][name] = {'v': [[round(c, 5) for c in fn(p)] for p in VV], 'f': FF, 'w': WW}
  print('MESH', name, len(VV), 'verts', len(FF), 'tris')
print('JOINTS', {n: tuple(round(c, 3) for c in v) for n, v in J.items()})
json.dump(res, open(OUT, 'w'))
