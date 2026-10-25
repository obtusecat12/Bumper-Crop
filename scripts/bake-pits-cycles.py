"""Editable four-cell pit source. --source-only preserves the recovered EXR bake."""
import bpy,pathlib,json,numpy as np,sys
from mathutils import Vector
R=pathlib.Path(__file__).resolve().parents[1];S=R/'art-source/level0-pit-cycles';atlas=json.loads((S/'atlas.json').read_text())
bpy.ops.wm.read_factory_settings(use_empty=True);sc=bpy.context.scene;sc.render.engine='CYCLES';sc.cycles.samples=64;sc.cycles.diffuse_bounces=5;sc.cycles.max_bounces=7
sc.world=bpy.data.worlds.new('Black');sc.world.use_nodes=True;sc.world.node_tree.nodes.get('Background').inputs['Strength'].default_value=0
img=bpy.data.images.new('Irradiance',1024,1024,float_buffer=True);img.colorspace_settings.name='Non-Color';receivers=[]
def coord(p):return(p[0],-p[2],p[1])
def quad(name,ps,color,rect=None):
 me=bpy.data.meshes.new(name);me.from_pydata([coord(p) for p in ps],[],[(0,1,2,3)]);me.update();ob=bpy.data.objects.new(name,me);sc.collection.objects.link(ob)
 mat=bpy.data.materials.new(name);mat.use_nodes=True;mat.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=(*color,1);me.materials.append(mat)
 if rect:
  uv=me.uv_layers.new(name='Bake');x,y,w,h=rect
  for i,(u,v)in enumerate([(0,0),(1,0),(1,1),(0,1)]):uv.data[i].uv=((x+u*w)/1024,(y+v*h)/1024)
  tex=mat.node_tree.nodes.new('ShaderNodeTexImage');tex.image=img;mat.node_tree.nodes.active=tex;receivers.append(ob)
 return ob
for i,v in enumerate(atlas['variants']):
 ox=i*20
 for j,f in enumerate(v['walls']):
  o=np.array(f['o']);a=np.array(f['a']);b=np.array(f['b']);ps=[o,o+a,o+a+b,o+b];quad('Shaft %d wall %d'%(i,j),[[p[0]+ox,p[1],p[2]]for p in ps],[.52,.44,.29],f['rect'])
 # Each separated room has a real central opening and continuous surrounding carpet.
 for x0,x1,z0,z1 in [(-5.4,-1.17,-5.4,5.4),(1.17,5.4,-5.4,5.4),(-1.17,1.17,-5.4,-1.17),(-1.17,1.17,1.17,5.4)]:
  quad('Carpet',[(ox+x0,0,z1),(ox+x1,0,z1),(ox+x1,0,z0),(ox+x0,0,z0)],[.35,.30,.18])
 # Four non-overlapping floor strips share one continuous cell UV mapping.
 x,y,w,h=v['floor']
 for x0,x1,z0,z1 in [(-1.8,-1.17,-1.8,1.8),(1.17,1.8,-1.8,1.8),(-1.17,1.17,-1.8,-1.17),(-1.17,1.17,1.17,1.8)]:
  # Replacement receivers coincide only in this offline source; no duplicate runtime mesh.
  ob=quad('Cell receiver',[(ox+x0,.001,z1),(ox+x1,.001,z1),(ox+x1,.001,z0),(ox+x0,.001,z0)],[.35,.30,.18],[x,y,w,h])
  for k,(xx,zz)in enumerate([(x0,z1),(x1,z1),(x1,z0),(x0,z0)]):ob.data.uv_layers.active.data[k].uv=((x+(xx+1.8)/3.6*w)/1024,(y+(zz+1.8)/3.6*h)/1024)
 quad('Ceiling',[(ox-5.4,2.72,-5.4),(ox+5.4,2.72,-5.4),(ox+5.4,2.72,5.4),(ox-5.4,2.72,5.4)],[.62,.60,.49])
 for j in range(4):
  a=[(-5.4,-5.4),(5.4,-5.4),(5.4,5.4),(-5.4,5.4)];u=a[j];v0=a[(j+1)%4];quad('Room wall',[(ox+u[0],0,u[1]),(ox+v0[0],0,v0[1]),(ox+v0[0],2.72,v0[1]),(ox+u[0],2.72,u[1])],[.58,.53,.31])
 for lx,lz in [[(0,0),(-3.6,-3.6),(3.6,3.6)],[(2.4,1.8),(-3.6,-3.6)],[(3.6,3.6),(-3.6,-3.6)],[(5.,4.5)]][i]:
  light=bpy.data.lights.new('Fixed fluorescent','AREA');light.energy=28;light.shape='RECTANGLE';light.size=1.06;light.size_y=.46;light.color=(1,.96,.84);ob=bpy.data.objects.new(light.name,light);sc.collection.objects.link(ob);ob.location=(ox+lx,-lz,2.68)
sc.render.bake.use_pass_color=False;sc.render.bake.use_pass_direct=True;sc.render.bake.use_pass_indirect=True;sc.render.bake.margin=3
for ob in sc.objects:ob.select_set(False)
for ob in receivers:ob.select_set(True)
bpy.context.view_layer.objects.active=receivers[0]
bpy.ops.wm.save_as_mainfile(filepath=str(S/'pits.blend'),compress=True)
if '--source-only' not in sys.argv:
 bpy.ops.object.bake(type='DIFFUSE');sc.render.image_settings.file_format='OPEN_EXR';sc.render.image_settings.color_depth='16';sc.render.image_settings.exr_codec='DWAA';img.save_render(str(S/'irradiance.exr'),scene=sc)
else:img=bpy.data.images.load(str(S/'irradiance.exr'),check_existing=False)
pixels=np.empty(1024*1024*4,np.float32);img.pixels.foreach_get(pixels);pixels.tofile(S/'irradiance.f32')
