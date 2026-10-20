# V137 Q1: extract the CC0 Wobble Blocks "PS2 Styled Characters" base meshes (opengameart.org/content/ps2-styled-characters)
# into game-frame arrays with arms lowered to the V75 bind pose (arms hanging), head + hair + eyes removed (head130 replaces
# them), weights merged onto the V75 19-bone set. Run: blender -b PS2CharacterBase.blend -P extract137.py -- OUT.json
import bpy, sys, json, math
from mathutils import Matrix, Vector
OUT = sys.argv[sys.argv.index('--') + 1]
ZOFF = .034   # base rig spine sits at blender y=-.034 -> centre the character on game z=0
MAP = {'Hips': 'hips', 'Spine': 'spine', 'Spine1': ('spine', .5, 'chest', .5), 'Spine2': 'chest', 'Neck': 'neck', 'Head': 'head'}
for s in 'LR':
  MAP.update({f'Shoulder.{s}': 'clavicle' + s, f'UpperArm.{s}': 'upperArm' + s, f'ForeArm.{s}': 'foreArm' + s, f'Hand.{s}': 'hand' + s,
              f'UpperLeg.{s}': 'thigh' + s, f'LowerLeg.{s}': 'shin' + s, f'Foot.{s}': 'foot' + s, f'ToeBase.{s}': 'foot' + s})
  for f in ('Thumb', 'Index', 'Middle'):
    for k in '123': MAP[f'{f}{k}.{s}'] = 'hand' + s
JOINT = {'hips': 'Hips', 'spine': 'Spine', 'chest': 'Spine2', 'neck': 'Neck', 'head': 'Head'}
for s in 'LR': JOINT.update({'clavicle' + s: f'Shoulder.{s}', 'upperArm' + s: f'UpperArm.{s}', 'foreArm' + s: f'ForeArm.{s}', 'hand' + s: f'Hand.{s}',
                             'thigh' + s: f'UpperLeg.{s}', 'shin' + s: f'LowerLeg.{s}', 'foot' + s: f'Foot.{s}'})
rig = bpy.data.objects['Character_Rig']
DOWN = math.radians(float(sys.argv[sys.argv.index('--') + 2]) if len(sys.argv) > sys.argv.index('--') + 2 else 78)
for pb in rig.pose.bones: pb.rotation_mode = 'QUATERNION'; pb.rotation_quaternion = (1, 0, 0, 0)
for s, sg in (('L', 1), ('R', -1)):
  pb = rig.pose.bones[f'UpperArm.{s}']; Bm = pb.bone.matrix_local.to_3x3().to_4x4()
  R = Matrix.Rotation(sg * DOWN, 4, 'Y'); pb.rotation_quaternion = (Bm.inverted() @ R @ Bm).to_quaternion()
bpy.context.view_layer.update()
g = lambda v: [v[0], v[2], -v[1] - ZOFF]
res = {'src': 'Wobble Blocks, PS2 Styled Characters, CC0, https://opengameart.org/content/ps2-styled-characters', 'joints': {}, 'meshes': {}}
for jn, bn in JOINT.items():
  pb = rig.pose.bones[bn]; res['joints'][jn] = g(rig.matrix_world @ pb.head)
for name in ('Masc', 'Femme'):
  o = bpy.data.objects[name]; bpy.context.view_layer.objects.active = o; o.select_set(True)
  bpy.ops.object.modifier_apply(modifier='Mirror')
  dg = bpy.context.evaluated_depsgraph_get(); ev = o.evaluated_get(dg); me = ev.to_mesh(); me.calc_loop_triangles()
  gn = {gr.index: gr.name for gr in o.vertex_groups}; orig = o.data
  W = []
  for v in orig.vertices:
    acc = {}
    for ge in v.groups:
      m = MAP.get(gn[ge.group]);
      if m is None or ge.weight <= 0: continue
      if isinstance(m, tuple): acc[m[0]] = acc.get(m[0], 0) + ge.weight * m[1]; acc[m[2]] = acc.get(m[2], 0) + ge.weight * m[3]
      else: acc[m] = acc.get(m, 0) + ge.weight
    W.append(acc)
  drop = set(i for i, w in enumerate(W) if w.get('head', 0) / max(1e-6, sum(w.values())) > .5)
  keep = []; F = []
  for t in me.loop_triangles:
    if orig.polygons[t.polygon_index].material_index != 0: continue
    if any(i in drop for i in t.vertices): continue
    F.append(list(t.vertices))
  used = sorted(set(i for f in F for i in f)); remap = {i: k for k, i in enumerate(used)}
  V = [g(me.vertices[i].co) for i in used]
  WW = []
  for i in used:
    w = W[i]; w.pop('head', None); it = sorted(w.items(), key=lambda x: -x[1])[:4]; tot = sum(x[1] for x in it) or 1
    WW.append([[n, round(x / tot, 4)] for n, x in it])
  res['meshes'][name] = {'v': [[round(c, 5) for c in p] for p in V], 'f': [[remap[i] for i in f] for f in F], 'w': WW}
  print('MESH', name, len(V), 'verts', len(F), 'tris')
  ev.to_mesh_clear()
json.dump(res, open(OUT, 'w'))
