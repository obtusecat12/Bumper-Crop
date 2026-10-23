# V135-capital: Blender Cycles per-vertex OUTDOOR bake for the fixed L11 fabric, one batch of 112 m cells.
# Same output meaning as tools/bake133_sky.mjs (runtime venue133-bake.js prepareSky133/fillBake133 is unchanged):
#   a   = sky visibility: Cycles DIRECT diffuse light from an upper-hemisphere-only white sky (no sun) divided by the
#         open-field value (1+n.y)/2 -> fraction of the sky this vertex really sees (scales the realtime hemisphere term)
#   rgb = sqrt(B/2), B = Cycles INDIRECT diffuse light (2 bounces) under that sky + a mid-day sun (sunE*pi W/m2),
#         relative to an open up-facing surface = 1 -> coloured bounce (brick/sandstone spill). Ground-like meshes are
#         hidden from diffuse rays (the realtime hemisphere ground colour already stands for ground bounce, as in bake133).
# Coordinates stay three.js Y-up (data copied raw), so 'up' here is +Y.
# The weather changes sky + sun at runtime, so nothing absolute is baked.
# usage: blender -b --python bake135_city.py -- cut.json out.bin [ao_samples] [gi_samples]
import bpy,sys,json,base64,array,struct,time,math
import numpy as np
from mathutils import Vector
argv=sys.argv[sys.argv.index('--')+1:];SRC,OUT=argv[0],argv[1];AOS=int(argv[2]) if len(argv)>2 else 32;GIS=int(argv[3]) if len(argv)>3 else 96
import os
LEAF_T=float(os.environ.get('LEAF_T','0'))  # V146 T4: alpha-tested leaf-card occluders ('leaf' in name) let this fraction of rays through (0 = opaque, old behaviour)
SUN=(.42,.78,.46);SUNE=2.2;AO_DIST=5.0;SMOOTH=2
CLEAR=('glass','window','water','liquid','refraction','pane','glaze','mirror','spray','foam','steam','smoke','fog','halo','glow','beam')
d=json.load(open(SRC))
bpy.ops.wm.read_factory_settings(use_empty=True)
sc=bpy.context.scene;sc.render.engine='CYCLES';cy=sc.cycles;cy.device='CPU';cy.use_denoising=False
cy.max_bounces=2;cy.diffuse_bounces=2;cy.glossy_bounces=0;cy.transmission_bounces=0;cy.transparent_max_bounces=24 if LEAF_T>0 else 4;cy.sample_clamp_indirect=4
w=bpy.data.worlds.new('w');sc.world=w;w.use_nodes=True;wn=w.node_tree.nodes;wl=w.node_tree.links;bg=wn['Background'];bg.inputs[0].default_value=(1,1,1,1)
tc=wn.new('ShaderNodeTexCoord');sp=wn.new('ShaderNodeSeparateXYZ');gt=wn.new('ShaderNodeMath');gt.operation='GREATER_THAN';gt.inputs[1].default_value=0
wl.new(tc.outputs['Generated'],sp.inputs[0]);wl.new(sp.outputs['Y'],gt.inputs[0]);wl.new(gt.outputs[0],bg.inputs[1])
GROUND=('ground','road','pave','asphalt','kerb','curb','sidewalk','sett','slab','tarmac','lawn','grass')  # matched on the material part (last '/' segment)
def arr(b,t):a=array.array(t);a.frombytes(base64.b64decode(b));return a
mats={}
def material(m,clear,leaf=False):
  alb=m.get('albedo',[.3,.3,.3]);key=(tuple(round(x,2) for x in alb),clear,leaf)
  if key in mats:return mats[key]
  mt=bpy.data.materials.new('m%d'%len(mats));mt.use_nodes=True;nt=mt.node_tree;bs=nt.nodes['Principled BSDF']
  bs.inputs['Base Color'].default_value=(*[min(.9,max(0,x)) for x in alb],1);bs.inputs['Roughness'].default_value=1;bs.inputs['Specular IOR Level'].default_value=0
  if clear:tr=nt.nodes.new('ShaderNodeBsdfTransparent');nt.links.new(tr.outputs[0],nt.nodes['Material Output'].inputs[0])
  elif leaf:tr=nt.nodes.new('ShaderNodeBsdfTransparent');mx=nt.nodes.new('ShaderNodeMixShader');mx.inputs[0].default_value=LEAF_T;nt.links.new(bs.outputs[0],mx.inputs[1]);nt.links.new(tr.outputs[0],mx.inputs[2]);nt.links.new(mx.outputs[0],nt.nodes['Material Output'].inputs[0])
  mats[key]=mt;return mt
def mkobj(name,m,col=False,clear=False,leaf=False):
  P=np.frombuffer(base64.b64decode(m['P']),np.float32);I=np.frombuffer(base64.b64decode(m['I']),np.uint32);n=m['count'];nt=len(I)//3
  me=bpy.data.meshes.new(name);me.vertices.add(n);me.vertices.foreach_set('co',P)
  me.loops.add(len(I));me.loops.foreach_set('vertex_index',I.astype(np.int32));me.polygons.add(nt);me.polygons.foreach_set('loop_start',np.arange(0,len(I),3,dtype=np.int32));me.polygons.foreach_set('loop_total',np.full(nt,3,np.int32))
  me.update(calc_edges=True);me.validate(clean_customdata=False)
  if col and m.get('hasN',True):
    N=np.frombuffer(base64.b64decode(m['N']),np.float32)
    if len(N)==n*3 and len(me.vertices)==n:
      try:me.normals_split_custom_set_from_vertices(N.reshape(-1,3).tolist())
      except Exception as ex:print('normals',ex)
  me.materials.append(material(m,clear,leaf))
  o=bpy.data.objects.new(name,me);sc.collection.objects.link(o)
  nm=((m.get('key') or m.get('name','')).split('|')[0].split('/')[-1]+' '+m.get('mname','').split('/')[-1]).lower()
  if any(k in nm for k in GROUND):o.visible_diffuse=False
  if col:me.color_attributes.new('bk','FLOAT_COLOR','POINT');me.attributes.active_color=me.color_attributes['bk']
  return o
t0=time.time();targets=[]
for i,m in enumerate(d['meshes']):targets.append(mkobj('t%d'%i,m,col=True))
for i,m in enumerate(d['occ']):
  s=(m.get('name','')+' '+m.get('mname','')).lower();clear=m.get('opacity',1)<.95 or any(k in s for k in CLEAR)
  mkobj('o%d'%i,m,clear=clear,leaf=LEAF_T>0 and not clear and 'leaf' in s)
sd=bpy.data.lights.new('sun','SUN');sd.energy=SUNE*math.pi;sd.angle=math.radians(1.5);so=bpy.data.objects.new('sun',sd);sc.collection.objects.link(so)
so.rotation_mode='QUATERNION';so.rotation_quaternion=Vector((0,0,1)).rotation_difference(Vector(SUN).normalized())
print('built',len(targets),'targets',len(d['occ']),'occ',round(time.time()-t0,1),flush=True)
sc.render.bake.target='VERTEX_COLORS'
bpy.ops.object.select_all(action='DESELECT')
for o in targets:o.select_set(True)
bpy.context.view_layer.objects.active=targets[0]
def grab():
  R=[]
  for o in targets:
    c=o.data.color_attributes['bk'];a=np.zeros(len(c.data)*4,np.float32);c.data.foreach_get('color',a);R.append(a.reshape(-1,4)[:,:3].copy())
  return R
so.hide_render=True;t0=time.time();cy.samples=AOS;bpy.ops.object.bake(type='DIFFUSE',pass_filter={'DIRECT'});AO=grab();print('sky',round(time.time()-t0,1),flush=True);so.hide_render=False
t0=time.time();cy.samples=GIS;bpy.ops.object.bake(type='DIFFUSE',pass_filter={'INDIRECT'});GI=grab();print('gi',round(time.time()-t0,1),flush=True)
with open(OUT,'wb') as f:
  for o,ao,gi in zip(targets,AO,GI):
    me=o.data;n=len(ao);m=d['meshes'][int(o.name[1:])];N=np.frombuffer(base64.b64decode(m['N']),np.float32).reshape(-1,3) if m.get('hasN',True) else None
    ny=N[:,1] if N is not None and len(N)==n else np.ones(n,np.float32)
    vis=np.clip(ao.mean(1)/np.maximum(.06,(1+ny)/2),0,1)
    a=np.concatenate([gi,vis[:,None]],1)
    if SMOOTH and len(me.edges):
      e=np.zeros(len(me.edges)*2,np.int32);me.edges.foreach_get('vertices',e);e=e.reshape(-1,2)
      for _ in range(SMOOTH):
        s=a.copy();cnt=np.ones(n,np.float32);np.add.at(s,e[:,0],a[e[:,1]]);np.add.at(s,e[:,1],a[e[:,0]]);np.add.at(cnt,e[:,0],1);np.add.at(cnt,e[:,1],1);a=.5*a+.5*s/cnt[:,None]
    f.write(struct.pack('<I',n));f.write(a.astype(np.float32).tobytes())
print('wrote',OUT,flush=True)
