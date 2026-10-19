# V135-capital ②c-2: per-cell HLOD proxies for the fixed L11 fabric (UE5 World Partition style: 1 mesh, 1 material, 1 draw per cell).
# For each 112 m city cell: every triangle of the dumped fixed fabric (dumpc.js -> city.json; baked meshes + glass occluders)
# whose centroid lies in the cell (same partition as the runtime split in capital135-lod.js) is rebuilt in Blender,
# a copy is merged + planar-dissolved + Decimate(collapse) to ~RATIO of the faces, smart-UV-unwrapped, and Cycles bakes the
# hi-poly look onto it (selected-to-active): DIFFUSE colour pass (albedo) x AO (16 spp, 4 m) -> one JPEG atlas per cell.
# Lighting is NOT baked absolute: runtime uses a Lambert material so weather/sun still apply (AO only darkens).
# usage: blender -b --python hlod135.py -- city.json outdir [cells "ix,iz;.."] [ratio] [albedo.json]
# out: outdir/h<ix>_<iz>.bin  (u32 nv, u32 ni, f32 pos[nv*3] (world), u16 uv[nv*2] (unorm), u16|u32 idx[ni]) + h<ix>_<iz>.jpg
#      outdir/hlod.json {cell:{nv,ni,tex,bin}}
import bpy,sys,json,base64,math,os,time,struct
import numpy as np
argv=sys.argv[sys.argv.index('--')+1:];SRC,OUT=argv[0],argv[1];ONLY=argv[2] if len(argv)>2 and argv[2] else None;RATIO=float(argv[3]) if len(argv)>3 else .08
# optional argv[4] = {key:[r,g,b] linear} albedo override (texture average x colour, sampled in the browser: /workspace/work/v135b/alb135.js)
ALB=json.load(open(argv[4])) if len(argv)>4 else {}
OX,OZ,A,B=520.3172,552.7043,-0.07667245,112.0;ca,sa=math.cos(A),math.sin(A)
AMIN=1.5
GLASS=('glass','window','pane','glaze')
SKIP=('synthetic ground','flame','waterfall','bulb','skinned','keeper','cast')
os.makedirs(OUT,exist_ok=True)
d=json.load(open(SRC))
def tri_cells(P,I):
  t=I.reshape(-1,3);c=(P[t[:,0]]+P[t[:,1]]+P[t[:,2]])/3;x=c[:,0]-OX;z=c[:,2]-OZ
  return np.floor((ca*x-sa*z)/B).astype(np.int32),np.floor((sa*x+ca*z)/B).astype(np.int32)
src=[]
for m in d['meshes']:src.append((m,ALB.get(m['key'],m.get('albedo',[.4,.4,.4])),False))
for m in d['occ']:
  s=(m.get('name','')+' '+m.get('mname','')).lower()
  if any(k in s for k in SKIP):continue
  if any(k in s for k in GLASS):src.append((m,[.06,.08,.1],True))
parts={}  # cell -> list of (P,I,albedo)
for m,alb,gl in src:
  P=np.frombuffer(base64.b64decode(m['P']),np.float32).reshape(-1,3)
  I=np.frombuffer(base64.b64decode(m['I']),np.uint32) if m.get('I') else np.arange(len(P),dtype=np.uint32)
  if len(I)<3:continue
  cx,cz=tri_cells(P,I);t=I.reshape(-1,3)
  for key in set(zip(cx.tolist(),cz.tolist())):
    sel=(cx==key[0])&(cz==key[1]);parts.setdefault(key,[]).append((P,t[sel],alb))
cells=sorted(parts) if not ONLY else [tuple(int(v) for v in c.split(',')) for c in ONLY.split(';')]
print('cells',len(parts),flush=True)
def build(name,items,mats):
  Ps=[];Is=[];Ms=[];off=0
  for P,t,alb in items:
    u,inv=np.unique(t.ravel(),return_inverse=True);Ps.append(P[u]);Is.append(inv.reshape(-1,3)+off);off+=len(u);Ms.append(np.full(len(t),mats(alb),np.int32))
  P=np.concatenate(Ps);I=np.concatenate(Is).astype(np.int32);M=np.concatenate(Ms)
  me=bpy.data.meshes.new(name);me.vertices.add(len(P));me.vertices.foreach_set('co',P.ravel())
  me.loops.add(I.size);me.loops.foreach_set('vertex_index',I.ravel());me.polygons.add(len(I))
  me.polygons.foreach_set('loop_start',np.arange(0,I.size,3,dtype=np.int32));me.polygons.foreach_set('loop_total',np.full(len(I),3,np.int32))
  me.update(calc_edges=True);me.validate(clean_customdata=False)
  for mt in matlist:me.materials.append(mt)
  me.polygons.foreach_set('material_index',M)
  o=bpy.data.objects.new(name,me);bpy.context.scene.collection.objects.link(o);return o,len(I)
report={}
if os.path.exists(os.path.join(OUT,'hlod.json')):report=json.load(open(os.path.join(OUT,'hlod.json')))
for cell in cells:
  if cell not in parts or sum(len(t) for _,t,_ in parts[cell])<1500:continue  # tiny cells stay full detail (cookhlod135 MIN)
  t0=time.time();bpy.ops.wm.read_factory_settings(use_empty=True);sc=bpy.context.scene
  sc.render.engine='CYCLES';cy=sc.cycles;cy.device='CPU';cy.use_denoising=False;cy.samples=16;cy.max_bounces=0
  w=bpy.data.worlds.new('w');sc.world=w;w.use_nodes=True;w.node_tree.nodes['Background'].inputs[0].default_value=(1,1,1,1)
  w.light_settings.distance=4.0
  matlist=[];mi={}
  def mats(alb):
    k=tuple(round(float(x),3) for x in alb)
    if k not in mi:
      mt=bpy.data.materials.new('m%d'%len(matlist));mt.use_nodes=True;bs=mt.node_tree.nodes['Principled BSDF']
      bs.inputs['Base Color'].default_value=(*[min(.95,max(0.0,x)) for x in k],1);bs.inputs['Roughness'].default_value=1
      mi[k]=len(matlist);matlist.append(mt)
    return mi[k]
  items=parts[cell];hi,nhi=build('hi',items,mats)
  bpy.ops.object.select_all(action='DESELECT');lo=hi.copy();lo.data=hi.data.copy();sc.collection.objects.link(lo);lo.name='lo'
  bpy.context.view_layer.objects.active=lo;lo.select_set(True)
  bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.remove_doubles(threshold=.06)
  bpy.ops.mesh.dissolve_limited(angle_limit=math.radians(.5),delimit={'NORMAL'});bpy.ops.object.mode_set(mode='OBJECT')
  # keep the biggest (coplanar-merged) faces up to the triangle budget: walls, roofs, roads survive; mullions, props, letters go.
  # The kept faces lie exactly on the hi surface, so the selected-to-active bake projects the dropped detail onto them.
  import bmesh
  target=max(400,int(nhi*RATIO));bm=bmesh.new();bm.from_mesh(lo.data);fs=sorted(bm.faces,key=lambda f:-f.calc_area());keep=0;kill=[]
  for f in fs:
    if keep<target and f.calc_area()>=AMIN:keep+=len(f.verts)-2
    else:kill.append(f)
  bmesh.ops.delete(bm,geom=kill,context='FACES');bmesh.ops.triangulate(bm,faces=bm.faces[:],quad_method='BEAUTY',ngon_method='BEAUTY');bm.to_mesh(lo.data);bm.free()
  lo.data.materials.clear();nlo=len(lo.data.polygons)
  if not nlo:print('cell',cell,'empty');continue
  for f in ('visible_camera','visible_diffuse','visible_glossy','visible_transmission','visible_volume_scatter','visible_shadow'):setattr(lo,f,False)
  # bigger cells get a bigger atlas
  R=512 if nhi>40000 else 256
  img=bpy.data.images.new('atlas',R,R,alpha=False,float_buffer=True);ao=bpy.data.images.new('ao',R,R,alpha=False,float_buffer=True)
  bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT')
  bpy.ops.uv.smart_project(angle_limit=math.radians(66),island_margin=2.0/R,area_weight=1.0);bpy.ops.uv.pack_islands(rotate=True,margin=2.0/R);bpy.ops.object.mode_set(mode='OBJECT')
  lm=bpy.data.materials.new('lo');lm.use_nodes=True;tn=lm.node_tree.nodes.new('ShaderNodeTexImage');lm.node_tree.nodes.active=tn;lo.data.materials.append(lm)
  bpy.ops.object.select_all(action='DESELECT');hi.select_set(True);lo.select_set(True);bpy.context.view_layer.objects.active=lo
  bk=sc.render.bake;bk.use_selected_to_active=True;bk.cage_extrusion=.5;bk.max_ray_distance=1.5;bk.margin=3;bk.target='IMAGE_TEXTURES'
  tn.image=img;cy.samples=2;bk.use_pass_direct=False;bk.use_pass_indirect=False;bk.use_pass_color=True
  bpy.ops.object.bake(type='DIFFUSE',pass_filter={'COLOR'})
  tn.image=ao;cy.samples=12;bpy.ops.object.bake(type='AO')
  c=np.array(img.pixels[:],np.float32).reshape(R,R,4);a=np.array(ao.pixels[:],np.float32).reshape(R,R,4)
  miss=c[...,:3].sum(-1)<.004  # selected-to-active misses come back black: fill with the cell's mean albedo, no AO
  if (~miss).any():c[miss,:3]=c[~miss,:3].mean(0);a[miss]=1
  out=c[...,:3]*(.5+.5*a[...,:1]);rgb=np.clip(out,0,1)
  rgb=np.where(rgb<=.0031308,rgb*12.92,1.055*np.power(rgb,1/2.4)-.055)  # linear -> sRGB
  fi=bpy.data.images.new('fin',R,R,alpha=False);px=np.ones((R,R,4),np.float32);px[...,:3]=rgb;fi.pixels.foreach_set(px.ravel())
  fi.filepath_raw=os.path.join(OUT,'h%d_%d.jpg'%cell);fi.file_format='JPEG';sc.render.image_settings.quality=82;fi.save()
  # export low mesh: unique (vertex, uv) pairs
  me=lo.data;nl=len(me.loops);vi=np.zeros(nl,np.int32);me.loops.foreach_get('vertex_index',vi)
  uv=np.zeros(nl*2,np.float32);me.uv_layers.active.data.foreach_get('uv',uv);uv=uv.reshape(-1,2)
  co=np.zeros(len(me.vertices)*3,np.float32);me.vertices.foreach_get('co',co);co=co.reshape(-1,3)
  q=np.round(np.clip(uv,0,1)*65535).astype(np.uint16);key=np.stack([vi,q[:,0].astype(np.int32),q[:,1].astype(np.int32)],1)
  u,first,inv=np.unique(key,axis=0,return_index=True,return_inverse=True);inv=inv.ravel()
  pos=co[vi[first]].astype(np.float32);uvq=q[first];idx=inv.astype(np.uint16 if len(u)<65536 else np.uint32)
  fn='h%d_%d.bin'%cell
  with open(os.path.join(OUT,fn),'wb') as f:
    f.write(struct.pack('<II',len(u),len(idx)));f.write(pos.tobytes());f.write(uvq.tobytes());f.write(idx.tobytes())
  report['%d,%d'%cell]={'nv':int(len(u)),'ni':int(len(idx)),'hi':int(nhi),'lo':int(nlo),'R':R}
  json.dump(report,open(os.path.join(OUT,'hlod.json'),'w'))
  print('cell',cell,'hi tris',nhi,'lo tris',nlo,'verts',len(u),'R',R,round(time.time()-t0,1),'s',flush=True)
