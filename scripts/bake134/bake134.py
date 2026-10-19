# V134 Blender Cycles per-vertex lighting bake for runtime-built interiors (dump from dump134.js)
# usage: blender -b --python bake134.py -- in.json out.bin preset samples
import bpy,sys,json,base64,math,struct,array,time
from mathutils import Vector
argv=sys.argv[sys.argv.index('--')+1:];SRC,OUT,PRESET=argv[0],argv[1],argv[2];SAMPLES=int(argv[3]) if len(argv)>3 else 128
d=json.load(open(SRC))
import importlib.util;spec=importlib.util.spec_from_file_location('preset',PRESET);P=importlib.util.module_from_spec(spec);spec.loader.exec_module(P)
bpy.ops.wm.read_factory_settings(use_empty=True)
sc=bpy.context.scene;sc.render.engine='CYCLES';cy=sc.cycles;cy.device='CPU';cy.samples=SAMPLES;cy.use_denoising=False
cy.max_bounces=P.BOUNCES;cy.diffuse_bounces=P.BOUNCES;cy.glossy_bounces=2;cy.transmission_bounces=4;cy.transparent_max_bounces=8;cy.sample_clamp_indirect=P.CLAMP_INDIRECT;cy.sample_clamp_direct=0
w=bpy.data.worlds.new('w');sc.world=w;w.use_nodes=True;w.node_tree.nodes['Background'].inputs[0].default_value=(*P.WORLD,1);w.node_tree.nodes['Background'].inputs[1].default_value=1
def arr(b,t):a=array.array(t);a.frombytes(base64.b64decode(b));return a
mats={}
def material(m,clear=False):
    key=(tuple(round(x,3) for x in m['albedo']),tuple(round(x,3) for x in m['emit']),round(m['rough'],2),round(m['metal'],2),clear)
    if key in mats:return mats[key]
    mt=bpy.data.materials.new('m%d'%len(mats));mt.use_nodes=True;nt=mt.node_tree;bs=nt.nodes['Principled BSDF']
    bs.inputs['Base Color'].default_value=(*[min(1,max(0,x)) for x in m['albedo']],1);bs.inputs['Roughness'].default_value=max(.05,m['rough']);bs.inputs['Metallic'].default_value=m['metal']
    e=P.emit(m)
    if max(e)>0:bs.inputs['Emission Color'].default_value=(*e,1);bs.inputs['Emission Strength'].default_value=1
    if clear:
        out=nt.nodes['Material Output'];tr=nt.nodes.new('ShaderNodeBsdfTransparent');nt.links.new(tr.outputs[0],out.inputs[0])
    mats[key]=mt;return mt
def mkobj(name,m,col=False,clear=False):
    Pp=arr(m['P'],'f');N=arr(m['N'],'f');I=arr(m['I'],'I');n=m['count']
    me=bpy.data.meshes.new(name);me.vertices.add(n);me.vertices.foreach_set('co',Pp)
    nt=len(I)//3;me.loops.add(len(I));me.loops.foreach_set('vertex_index',I);me.polygons.add(nt);me.polygons.foreach_set('loop_start',list(range(0,len(I),3)));me.polygons.foreach_set('loop_total',[3]*nt)
    me.update(calc_edges=True);me.validate(clean_customdata=False)
    if m.get('hasN',True) and len(N)==n*3:
        try:me.normals_split_custom_set_from_vertices([N[i*3:i*3+3] for i in range(n)])
        except Exception as ex:print('normals',ex)
    me.materials.append(material(m,clear))
    o=bpy.data.objects.new(name,me);sc.collection.objects.link(o)
    if col:me.color_attributes.new('bk','FLOAT_COLOR','POINT');me.attributes.active_color=me.color_attributes['bk']
    return o
t0=time.time();targets=[]
for i,m in enumerate(d['meshes']):targets.append(mkobj('t%d'%i,m,col=True))
for i,m in enumerate(d['occ']):
    if P.skip_occ(m):continue
    mkobj('o%d'%i,m,clear=P.clear_occ(m))
for i,L in enumerate(P.lights(d['lights'])):
    kind,p,c,power=L['kind'],Vector(L['p']),L['c'],L['power']
    ld=bpy.data.lights.new('L%d'%i,kind);ld.color=c;ld.energy=power
    if kind in('POINT','SPOT'):ld.shadow_soft_size=L.get('radius',.05)
    if kind=='SPOT':ld.spot_size=L['size'];ld.spot_blend=L['blend']
    if kind=='AREA':ld.shape='RECTANGLE';ld.size=L['w'];ld.size_y=L['h']
    lo=bpy.data.objects.new('L%d'%i,ld);lo.location=p;sc.collection.objects.link(lo)
    if 'dir' in L:lo.rotation_mode='QUATERNION';lo.rotation_quaternion=Vector((0,0,-1)).rotation_difference(Vector(L['dir']).normalized())
print('built',len(targets),'targets',time.time()-t0,flush=True)
sc.render.bake.target='VERTEX_COLORS'
bpy.ops.object.select_all(action='DESELECT')
for o in targets:o.select_set(True)
bpy.context.view_layer.objects.active=targets[0]
t0=time.time();bpy.ops.object.bake(type='DIFFUSE',pass_filter={'DIRECT','INDIRECT'});print('baked',time.time()-t0,flush=True)
import numpy as np
SMOOTH=int(getattr(P,'SMOOTH',2))
with open(OUT,'wb') as f:
    for o in targets:
        me=o.data;c=me.color_attributes['bk'];n=len(c.data);a=np.zeros(n*4,np.float32);c.data.foreach_get('color',a);a=a.reshape(n,4)
        if SMOOTH and len(me.edges):
            e=np.zeros(len(me.edges)*2,np.int32);me.edges.foreach_get('vertices',e);e=e.reshape(-1,2)
            for _ in range(SMOOTH):
                s=a[:,:3].copy();cnt=np.ones(n,np.float32)
                np.add.at(s,e[:,0],a[e[:,1],:3]);np.add.at(s,e[:,1],a[e[:,0],:3]);np.add.at(cnt,e[:,0],1);np.add.at(cnt,e[:,1],1)
                a[:,:3]=.5*a[:,:3]+.5*s/cnt[:,None]
        f.write(struct.pack('<I',n));f.write(a.astype(np.float32).tobytes())
print('wrote',OUT)
