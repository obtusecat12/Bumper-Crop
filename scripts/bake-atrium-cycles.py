"""Bake the unchanged game atrium in Cycles; never export the player light."""
import bpy, json, base64, pathlib, numpy as np, gzip
ROOT=pathlib.Path(__file__).resolve().parents[1]
SRC=ROOT/'art-source/level0-atrium-cycles'; OUT=ROOT/'dist/assets/level0-atrium-cycles'
data=json.loads((SRC/'scene.json').read_text()); bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene; scene.render.engine='CYCLES'; scene.cycles.samples=48
scene.cycles.max_bounces=7; scene.cycles.diffuse_bounces=5; scene.cycles.use_denoising=False
scene.world=bpy.data.worlds.new('Black unlit void'); scene.world.use_nodes=True
scene.world.node_tree.nodes.get('Background').inputs['Strength'].default_value=0
scene.render.bake.target='VERTEX_COLORS'; scene.render.bake.use_pass_direct=True
scene.render.bake.use_pass_indirect=True; scene.render.bake.use_pass_color=False
def array(m,k,dtype): return np.frombuffer(base64.b64decode(m[k]),dtype=dtype).copy()
def coords(a):
 a=a.reshape(-1,3); return np.stack([a[:,0],-a[:,2],a[:,1]],axis=1)
objects=[];source_offset=0
for j,m in enumerate(data['meshes']+data['occ']):
 P=coords(array(m,'P','<f4')); I=array(m,'I','<u4').reshape(-1,3)
 me=bpy.data.meshes.new('Game mesh %d'%j); me.from_pydata(P.tolist(),[],I.tolist()); me.update()
 ob=bpy.data.objects.new(m.get('key',m.get('name','Occluder'))[:63],me); scene.collection.objects.link(ob)
 mat=bpy.data.materials.new('Surface %d'%j); mat.use_nodes=True; bs=mat.node_tree.nodes.get('Principled BSDF')
 bs.inputs['Base Color'].default_value=tuple(np.clip(m.get('albedo',[.32,.30,.23]),.015,.82))+ (1,)
 bs.inputs['Roughness'].default_value=.95; me.materials.append(mat)
 if 'key' in m:
  N=coords(array(m,'N','<f4')); me.polygons.foreach_set('use_smooth',np.ones(len(me.polygons),bool)); me.normals_split_custom_set_from_vertices(N.tolist())
  attr=me.color_attributes.new(name='CyclesIrradiance',type='FLOAT_COLOR',domain='CORNER'); me.color_attributes.active_color=attr
  ids=me.attributes.new(name='sourceVertex',type='INT',domain='POINT'); ids.data.foreach_set('value',np.arange(source_offset,source_offset+m['count'],dtype=np.int32)); source_offset+=m['count']
  objects.append((ob,m))
for i,a in enumerate(data['areas']):
 light=bpy.data.lights.new('Fixed fluorescent %d'%i,'AREA'); light.energy=a['power']; light.shape='SQUARE'; light.size=a['size']; light.color=(1,.965,.88)
 ob=bpy.data.objects.new(light.name,light); scene.collection.objects.link(ob); x,y,z=a['p']; ob.location=(x,-z,y)
for i,a in enumerate(data['lights']):
 if a['type']!='PointLight':continue
 light=bpy.data.lights.new('Warm practical %d'%i,'POINT'); light.energy=a['i']*12.566; light.color=a['c']; light.shadow_soft_size=.09
 ob=bpy.data.objects.new(light.name,light); scene.collection.objects.link(ob); x,y,z=a['p']; ob.location=(x,-z,y)
for ob in scene.objects:ob.select_set(False)
for ob,m in objects:ob.select_set(True)
bpy.context.view_layer.objects.active=objects[0][0]
print('BAKE START',len(objects),source_offset,flush=True)
# One joined receiver avoids rebuilding the same 2M-triangle scene for every material.
# A POINT id preserves the exact original welded-vertex ordering through the join.
bpy.ops.object.join(); receiver=bpy.context.view_layer.objects.active
receiver.data.color_attributes.active_color=receiver.data.color_attributes['CyclesIrradiance']
bpy.ops.object.bake(type='DIFFUSE')
me=receiver.data;ids=np.empty(len(me.loops),np.int32);me.loops.foreach_get('vertex_index',ids)
source_ids=np.empty(len(me.vertices),np.int32);me.attributes['sourceVertex'].data.foreach_get('value',source_ids);ids=source_ids[ids]
col=np.empty(len(me.loops)*4,np.float32);me.color_attributes['CyclesIrradiance'].data.foreach_get('color',col);col=col.reshape(-1,4)[:,:3]
all_rgb=np.zeros((source_offset,3),np.float32);np.add.at(all_rgb,ids,col);weights=np.bincount(ids,minlength=source_offset);all_rgb/=np.maximum(1,weights)[:,None]
rgb=[all_rgb];pos=[];normal=[];manifest={'version':149,'scale':4,'samples':48,'diffuseBounces':5,'meshes':[]};offset=0
for m in data['meshes']:
 pos.append(array(m,'P','<f4').reshape(-1,3));normal.append(array(m,'N','<f4').reshape(-1,3))
 manifest['meshes'].append({'key':m['key'],'offset':offset,'count':m['count']});offset+=m['count']*3
OUT.mkdir(parents=True,exist_ok=True)
np.savez_compressed(SRC/'irradiance-source.npz',rgb=np.concatenate(rgb),positions=np.concatenate(pos),normals=np.concatenate(normal))
(OUT/'manifest.json').write_text(json.dumps(manifest,separators=(',',':')))
bpy.ops.wm.save_as_mainfile(filepath=str(SRC/'atrium.blend'),compress=True)
print('BAKE FINISHED',offset,flush=True)
