"""Rebuild the actual Level 0 spawn in Blender, bake colour-free irradiance, render.
Run export-spawn-cycles.mjs first. Blender 4.3: -b -t 8 --python this_file
"""
import bpy, json, math, sys
import numpy as np
from pathlib import Path
from mathutils import Vector, Matrix, Euler

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'art-source/level0-spawn-cycles'; OUT.mkdir(parents=True,exist_ok=True)
D=json.loads((OUT/'layout.json').read_text()); LOOK=D['look']; C=D['SPAWN_C']
SIZE=1024; DENSITY=24; PAD=3
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene; scene.render.engine='CYCLES'; scene.cycles.device='CPU'
scene.cycles.samples=64; scene.cycles.use_denoising=True
scene.cycles.max_bounces=8; scene.cycles.diffuse_bounces=6
scene.world.color=(0,0,0); scene.world.use_nodes=True
scene.world.node_tree.nodes.get('Background').inputs['Strength'].default_value=0
scene.render.resolution_x=640;scene.render.resolution_y=480;scene.render.resolution_percentage=100
scene.view_settings.view_transform='Standard';scene.view_settings.look='None'
scene.view_settings.exposure=0;scene.view_settings.gamma=1
def B(p):return (p[0],-p[2],p[1])
def local(p):return [p[0]-C['x'],p[1],p[2]-C['z']]
def add(a,b):return [x+y for x,y in zip(a,b)]
def mul(a,s):return [x*s for x in a]
atlas=bpy.data.images.new('Cycles irradiance — no albedo',width=SIZE,height=SIZE,float_buffer=True)
atlas.colorspace_settings.name='Non-Color'
materials={}; bump_nodes=[]
for name in ['right','dots','front','stripe','floor','ceiling','rail','skirt']:
    spec=LOOK[name];m=bpy.data.materials.new(name);m.use_nodes=True
    n=m.node_tree.nodes;l=m.node_tree.links;bs=n.get('Principled BSDF')
    bs.inputs['Roughness'].default_value=.94;bs.inputs['Specular IOR Level'].default_value=.15
    if spec.get('file'):
        uv=n.new('ShaderNodeUVMap');uv.uv_map='Surface'
        tex=n.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(ROOT/'dist/assets'/(spec['file']+'.webp')),check_existing=True)
        tex.extension='REPEAT';l.new(uv.outputs['UV'],tex.inputs['Vector'])
        tint=n.new('ShaderNodeMixRGB');tint.blend_type='MULTIPLY';tint.inputs[0].default_value=1;tint.inputs[2].default_value=(*spec['color'],1)
        l.new(tex.outputs['Color'],tint.inputs[1]);l.new(tint.outputs[0],bs.inputs['Base Color'])
        normal=n.new('ShaderNodeTexImage');normal.image=bpy.data.images.load(str(ROOT/'dist/assets'/(spec['file']+'-normal.webp')),check_existing=True);normal.image.colorspace_settings.name='Non-Color'
        l.new(uv.outputs['UV'],normal.inputs['Vector']);nm=n.new('ShaderNodeNormalMap');nm.uv_map='Surface';nm.inputs['Strength'].default_value=spec['bump']
        l.new(normal.outputs['Color'],nm.inputs['Color']);l.new(nm.outputs[0],bs.inputs['Normal']);bump_nodes.append((nm,spec['bump']))
    else:bs.inputs['Base Color'].default_value=(*spec['color'],1)
    target=n.new('ShaderNodeTexImage');target.name='BAKE_TARGET';target.image=atlas;n.active=target
    materials[name]=m

faces=[]
def face(name,kind,o,a,b):
    a=np.array(a);b=np.array(b);nn=np.cross(a,b);nn/=np.linalg.norm(nn)
    faces.append(dict(name=name,kind=kind,o=list(o),a=a.tolist(),b=b.tolist(),n=nn.tolist(),w=max(2,math.ceil(np.linalg.norm(a)*DENSITY)),h=max(2,math.ceil(np.linalg.norm(b)*DENSITY))))
def box(name,kind,x,y,z,w,h,d,ry=0):
    c=local([x,y,z]);co=math.cos(ry);si=math.sin(ry)
    X=[co*w,0,-si*w];Y=[0,h,0];Z=[si*d,0,co*d]
    def p(s,t,u):return add(c,add(mul(X,s),add(mul(Y,t),mul(Z,u))))
    face(name+' front',kind,p(-.5,-.5,.5),X,Y)
    face(name+' back',kind,p(.5,-.5,-.5),mul(X,-1),Y)
    face(name+' right',kind,p(.5,-.5,.5),mul(Z,-1),Y)
    face(name+' left',kind,p(-.5,-.5,-.5),Z,Y)
    # Walls reach the ceiling: hidden top/bottom faces are unnecessary atlas islands.
    if h<.2:
        face(name+' top',kind,p(-.5,.5,.5),X,mul(Z,-1))
        face(name+' bottom',kind,p(-.5,-.5,-.5),X,Z)
for w in D['SPAWN_WALLS']:
    kind={3:'right',4:'dots',6:'stripe',7:'dots',8:'front'}[w['mat']]
    box(w['id'],kind,w['x'],w['y'],w['z'],w['w'],w['h'],w['d'],w.get('ry',0))
for i,r in enumerate(D['SPAWN_RAILS']):box('oak bumper '+str(i),'rail',r['x'],r['y'],r['z'],r['w'],.035,r['d'])
for w in D['SPAWN_SKIRT']:box(w['id'],'skirt',w['x'],w['y'],w['z'],w['w'],w['h'],w['d'],w.get('ry',0))
face('carpet','floor',[-10,0,4.5],[20.5,0,0],[0,0,-18.1])
face('acoustic ceiling','ceiling',[-10,2.72,-13.6],[20.5,0,0],[0,0,18.1])
# Deterministic shelf packing, largest rows first, with independent island gutters.
x=y=row=0
for f in sorted(faces,key=lambda f:-f['h']):
    w,h=f['w']+2*PAD,f['h']+2*PAD
    if x+w>SIZE:x=0;y+=row;row=0
    if y+h>SIZE:raise RuntimeError('Atlas overflow; lower density or increase size')
    f['rect']=[x+PAD,y+PAD,f['w'],f['h']];x+=w;row=max(row,h)
objects=[]
for kind in materials:
    fs=[f for f in faces if f['kind']==kind];vs=[];polys=[]
    for f in fs:
        i=len(vs);o=f['o'];a=f['a'];b=f['b'];vs.extend(map(B,[o,add(o,a),add(add(o,a),b),add(o,b)]));polys.append((i,i+1,i+2,i+3))
    me=bpy.data.meshes.new(kind);me.from_pydata(vs,[],polys);me.update();ob=bpy.data.objects.new(kind,me);scene.collection.objects.link(ob);me.materials.append(materials[kind]);objects.append(ob)
    surface=me.uv_layers.new(name='Surface');baked=me.uv_layers.new(name='Irradiance');me.uv_layers.active=baked;surface.active_render=True
    scale=LOOK[kind].get('scale',[1,1])
    for poly,f in zip(me.polygons,fs):
        px,py,pw,ph=f['rect']
        for j,li in enumerate(poly.loop_indices):
            u,v=[(0,0),(1,0),(1,1),(0,1)][j];p=add(f['o'],add(mul(f['a'],u),mul(f['b'],v)))
            wp=[p[0]+C['x'],p[1],p[2]+C['z']];n=f['n']
            uv=(wp[0],wp[2]) if abs(n[1])>.5 else ((wp[2],wp[1]) if abs(n[0])>.5 else (wp[0],wp[1]))
            surface.data[li].uv=(uv[0]/scale[0],uv[1]/scale[1]);baked.data[li].uv=((px+u*pw)/SIZE,(py+v*ph)/SIZE)
def cube(name,loc,dim,mat,bevel=0):
    bpy.ops.mesh.primitive_cube_add(size=1,location=B(loc));o=bpy.context.object;o.name=name;o.dimensions=(dim[0],dim[2],dim[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(mat)
    if bevel:q=o.modifiers.new('Soft manufactured edge','BEVEL');q.width=bevel;q.segments=2
    return o
grid=bpy.data.materials.new('Matte painted T-grid');grid.diffuse_color=(.50,.48,.30,1)
for i in range(-8,10):
    o=cube('T-grid longitudinal',[i*1.2,2.718,-4.55],[.018,.012,18.1],grid,.001);o.visible_shadow=False;o.visible_diffuse=False
for i in range(-22,8):
    o=cube('T-grid cross',[.25,2.718,i*.6],[20.5,.012,.018],grid,.001);o.visible_shadow=False;o.visible_diffuse=False
white=bpy.data.materials.new('opal diffuser');white.use_nodes=True
bs=white.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(.82,.82,.76,1)
bs.inputs['Emission Color'].default_value=(*LOOK['lightColor'],1);bs.inputs['Emission Strength'].default_value=1.7
for i,p in enumerate(D['SPAWN_LIGHTS']):
    p=local([p['x'],2.70,p['z']]);cube('Troffer housing '+str(i),[p[0],2.75,p[2]],[1.196,.08,.596],grid,.006)
    cube('Opal lens '+str(i),[p[0],2.704,p[2]],[1.06,.012,.46],white,.003)
    lamp=bpy.data.lights.new('Fixed fluorescent '+str(i),'AREA');lamp.shape='RECTANGLE';lamp.size=1.06;lamp.size_y=.46;lamp.energy=LOOK.get('lightPowers',[LOOK['lightWatts']]*7)[i];lamp.color=LOOK['lightColor']
    o=bpy.data.objects.new(lamp.name,lamp);scene.collection.objects.link(o);o.location=B([p[0],2.69,p[2]])
socket=bpy.data.materials.new('Aged outlet');socket.diffuse_color=(.55,.50,.31,1)
holes=bpy.data.materials.new('Outlet slots');holes.diffuse_color=(.10,.095,.07,1)
for s in D['SPAWN_OUTLETS']:
    p=local([s['x'],s['y'],s['z']]);cube('Duplex cover',p,[.072,.114,.009],socket,.004)
    for yy in [-.027,.027]:
        for xx in [-.012,.012]:cube('Outlet slot',add(p,[xx,yy,.006]),[.004,.015,.003],holes)
v=D['SPAWN_VIEW'];cam=bpy.data.cameras.new('Reference camera 640x480');ob=bpy.data.objects.new(cam.name,cam);scene.collection.objects.link(ob);scene.camera=ob
ob.location=B(local([v['x'],v['y'],v['z']]))
# Three Euler YXZ -> world rotation, then Three Y-up to Blender Z-up.
rot=Matrix.Rotation(v['yaw'],3,'Y')@Matrix.Rotation(v['pitch'],3,'X')@Matrix.Rotation(v.get('roll',0),3,'Z')
convert=Matrix(((1,0,0),(0,0,-1),(0,1,0)));ob.rotation_euler=(convert@rot).to_euler()
cam.type='PERSP';cam.sensor_fit='HORIZONTAL';cam.sensor_width=36;cam.lens=36/(2*math.tan(math.radians(v['fov']/2))*4/3);cam.shift_y=-v['shiftY']*3/4
cam.clip_start=.04;cam.clip_end=180
# Use the same ACES fit as Three.js, followed by Blender's Standard sRGB output.
scene.use_nodes=True;n=scene.node_tree.nodes;l=scene.node_tree.links;n.clear();render=n.new('CompositorNodeRLayers');split=n.new('CompositorNodeSepRGBA');l.new(render.outputs['Image'],split.inputs[0])
def mathnode(op,a,b=None):
    q=n.new('CompositorNodeMath');q.operation=op
    for i,vv in enumerate([a,b] if b is not None else [a]):
        if isinstance(vv,(int,float)):q.inputs[i].default_value=vv
        else:l.new(vv,q.inputs[i])
    return q.outputs[0]
def dot(row,values):
    terms=[mathnode('MULTIPLY',a,b) for a,b in zip(row,values)]
    return mathnode('ADD',mathnode('ADD',terms[0],terms[1]),terms[2])
rgb=[mathnode('MULTIPLY',split.outputs[i],LOOK['exposure']/.6) for i in range(3)]
rgb=[dot(row,rgb) for row in [[.59719,.35458,.04823],[.076,.90834,.01566],[.0284,.13383,.83777]]]
fit=[]
for x in rgb:
    a=mathnode('SUBTRACT',mathnode('MULTIPLY',x,mathnode('ADD',x,.0245786)),.000090537)
    b=mathnode('ADD',mathnode('MULTIPLY',x,mathnode('ADD',mathnode('MULTIPLY',x,.983729),.432951)),.238081)
    fit.append(mathnode('DIVIDE',a,b))
rgb=[dot(row,fit) for row in [[1.60475,-.53108,-.07367],[-.10208,1.10813,-.00605],[-.00327,-.07276,1.07602]]]
comb=n.new('CompositorNodeCombRGBA')
for i,x in enumerate(rgb):l.new(mathnode('MINIMUM',mathnode('MAXIMUM',x,0),1),comb.inputs[i])
out=n.new('CompositorNodeComposite');l.new(comb.outputs[0],out.inputs[0])
meta={'size':SIZE,'padding':PAD,'density':DENSITY,'origin':[C['x'],0,C['z']],'faces':faces,'samples':64,'staticLights':7,'containsPlayerFlashlight':False}
(OUT/'bake.json').write_text(json.dumps(meta,indent=2))
for image in bpy.data.images:
    if image.source=='FILE':image.filepath=bpy.path.relpath(image.filepath,start=str(OUT))
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'level0-spawn.blend'),compress=True)
print('SOURCE_SAVED',flush=True)
if '--render-only' not in sys.argv:
    for nm,strength in bump_nodes:nm.inputs['Strength'].default_value=0
    bpy.ops.object.select_all(action='DESELECT')
    for o in objects:o.select_set(True)
    bpy.context.view_layer.objects.active=objects[0];scene.render.bake.use_pass_color=False;scene.render.bake.use_pass_direct=True;scene.render.bake.use_pass_indirect=True;scene.render.bake.margin=PAD
    bpy.ops.object.bake(type='DIFFUSE',uv_layer='Irradiance')
    data=np.empty(SIZE*SIZE*4,dtype=np.float32);atlas.pixels.foreach_get(data);data.tofile(str(OUT/'irradiance.f32'))
    scene.render.image_settings.file_format='OPEN_EXR';scene.render.image_settings.color_depth='16';scene.render.image_settings.exr_codec='ZIP';atlas.save_render(str(OUT/'irradiance.exr'),scene=scene)
    for nm,strength in bump_nodes:nm.inputs['Strength'].default_value=strength
    print('BAKE_FINISHED',len(faces),flush=True)
scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGB';scene.render.image_settings.color_depth='8';scene.render.filepath=str(OUT/'blender-reference.png')
bpy.ops.render.render(write_still=True)
print('RENDER_FINISHED',flush=True)
