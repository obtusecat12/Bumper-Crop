# V142-U2 · L1 UI chrome shells: height-field casting from the runtime's own masks (shape142.js → mask.html),
# rendered in Cycles as polished chrome under a studio HDRI, transparent film → one RGBA layer per shell.
# blender -b -P bake_shell142.py -- KIT KEY OUT.png [scale=2] [spp=64] [rotz=0] [rotx=0] [strength=1]
import bpy,sys,json,math,numpy as np
a=sys.argv[sys.argv.index('--')+1:];KIT,KEY,OUT=a[0],a[1],a[2]
S=float(a[3]) if len(a)>3 else 2;SPP=int(a[4]) if len(a)>4 else 64;ROTZ=float(a[5]) if len(a)>5 else 0;ROTX=float(a[6]) if len(a)>6 else 0;STR=float(a[7]) if len(a)>7 else 1
meta=json.load(open(f'{KIT}/{KEY}_domes.json'));W,H=meta['W'],meta['H'];edges=meta['edges']
def load(p):
 im=bpy.data.images.load(p);w,h=im.size;px=np.array(im.pixels[:],dtype=np.float32).reshape(h,w,4)[::-1,:,0];return im,px  # row 0 = top
imP,M=load(f'{KIT}/{KEY}_pieces.png');_,C=load(f'{KIT}/{KEY}_cuts.png');h0,w0=M.shape;s=w0/W
P=int(60*s)
def pad(A):
 t=P;B=np.pad(A,((t,t),(t,t)),mode='constant')
 E=np.pad(A,((t,t),(t,t)),mode='edge')
 if 'l' in edges:B[:,:t]=E[:,:t]
 if 'r' in edges:B[:,-t:]=E[:,-t:]
 if 't' in edges:B[:t,:]=E[:t,:]
 if 'b' in edges:B[-t:,:]=E[-t:,:]
 return B
def box(A,r,ax):
 r=max(1,int(r));c=np.cumsum(np.pad(A,[(r+1,r) if i==ax else (0,0) for i in range(2)],mode='edge'),axis=ax)
 return (np.take(c,range(2*r+1,c.shape[ax]),axis=ax)-np.take(c,range(0,c.shape[ax]-2*r-1),axis=ax))/(2*r+1)
def blur(A,ru):
 r=ru*s/1.7
 for _ in range(3):A=box(box(A,r,0),r,1)
 return A
Mp,Cp=pad(M),pad(C)
cl=lambda x:np.clip(x,0,1)
roll=lambda b:np.sqrt(cl((b-.5)*2))
hgt=9.0*roll(blur(Mp,5))+12.0*roll(blur(Mp,15))+14.0*blur(Mp,40)**1.5
yy,xx=np.mgrid[0:Mp.shape[0],0:Mp.shape[1]].astype(np.float32);ux=(xx-P)/s;uy=(yy-P)/s
for d in meta['domes']:
 if len(d)==4:x,y,R,hd=d;rx=ry=R
 else:x,y,rx,ry,hd=d
 r2=((ux-x)/rx)**2+((uy-y)/ry)**2;hgt+=hd*np.clip(1-r2,0,1)**1.6
hgt*=cl(blur(Mp,1.2)*2)                       # keep the far rim on the mask edge
ce=blur(Cp,3.2);lip=4*ce*(1-ce)
inner=cl((blur(Cp,1.2)-.5)*2.2)
hgt=hgt+6.0*lip-12.0*inner
hgt=hgt[P:-P,P:-P];Hh,Ww=hgt.shape
# ---- mesh: one vertex per pixel, user units (x right, y up = -row)
bpy.ops.wm.read_factory_settings(use_empty=True)
sc=bpy.context.scene
vx=(np.arange(Ww)+.5)/s;vy=-(np.arange(Hh)+.5)/s;X,Y=np.meshgrid(vx,vy)
co=np.stack([X,Y,hgt],-1).reshape(-1,3).astype(np.float32)
idx=np.arange(Hh*Ww).reshape(Hh,Ww);q=np.stack([idx[:-1,:-1],idx[1:,:-1],idx[1:,1:],idx[:-1,1:]],-1).reshape(-1,4)
me=bpy.data.meshes.new('shell');me.vertices.add(len(co));me.vertices.foreach_set('co',co.ravel())
me.loops.add(q.size);me.loops.foreach_set('vertex_index',q.ravel().astype(np.int32))
me.polygons.add(len(q));me.polygons.foreach_set('loop_start',np.arange(0,q.size,4,dtype=np.int32));me.polygons.foreach_set('loop_total',np.full(len(q),4,np.int32))
uvl=me.uv_layers.new(name='UV');U=np.stack([(X+0)/W*(Ww/s)/(Ww/s),1+Y/H],-1).reshape(-1,2)
uvl.data.foreach_set('uv',U[q.ravel()].ravel().astype(np.float32))
me.update(calc_edges=True);me.validate()
me.polygons.foreach_set('use_smooth',np.ones(len(q),bool))
ob=bpy.data.objects.new('shell',me);sc.collection.objects.link(ob)
# ---- material: brushed polished chrome, alpha from the mask
mt=bpy.data.materials.new('chrome');mt.use_nodes=True;nt=mt.node_tree;N=nt.nodes;L=nt.links;N.clear()
o=N.new('ShaderNodeOutputMaterial');bs=N.new('ShaderNodeBsdfPrincipled');tr=N.new('ShaderNodeBsdfTransparent');mx=N.new('ShaderNodeMixShader')
imP=bpy.data.images.load(f'{KIT}/{KEY}_pieces.png');tx=N.new('ShaderNodeTexImage');tx.image=imP;imP.colorspace_settings.name='Non-Color';tx.interpolation='Linear';tx.extension='EXTEND'
uvn=N.new('ShaderNodeUVMap');uvn.uv_map='UV';L.new(uvn.outputs[0],tx.inputs[0])
bs.inputs['Base Color'].default_value=(.78,.80,.83,1);bs.inputs['Metallic'].default_value=1
# brushing: roughness streaks stretched along x, anisotropy along the UV x tangent
nz=N.new('ShaderNodeTexNoise');nz.inputs['Scale'].default_value=3;nz.inputs['Detail'].default_value=8
mp=N.new('ShaderNodeMapping');tc=N.new('ShaderNodeTexCoord');L.new(tc.outputs['Object'],mp.inputs[0]);mp.inputs['Scale'].default_value=(.004,.6,1);L.new(mp.outputs[0],nz.inputs[0])
rm=N.new('ShaderNodeMapRange');rm.inputs[3].default_value=.13;rm.inputs[4].default_value=.24;L.new(nz.outputs[0],rm.inputs[0]);L.new(rm.outputs[0],bs.inputs['Roughness'])
try:
 bs.inputs['Anisotropic'].default_value=.55;tg=N.new('ShaderNodeTangent');tg.direction_type='UV_MAP';tg.uv_map='UV';L.new(tg.outputs[0],bs.inputs['Tangent'])
except Exception as e:print('aniso',e)
L.new(tx.outputs['Color'],mx.inputs[0]);L.new(tr.outputs[0],mx.inputs[1]);L.new(bs.outputs[0],mx.inputs[2]);L.new(mx.outputs[0],o.inputs[0])
me.materials.append(mt)
# ---- world: studio HDRI
w=bpy.data.worlds.new('w');sc.world=w;w.use_nodes=True;wn=w.node_tree;wn.nodes.clear()
et=wn.nodes.new('ShaderNodeTexEnvironment');et.image=bpy.data.images.load(f'{KIT}/studio.hdr');bg=wn.nodes.new('ShaderNodeBackground');bg.inputs[1].default_value=STR
wo=wn.nodes.new('ShaderNodeOutputWorld');wt=wn.nodes.new('ShaderNodeTexCoord');wm=wn.nodes.new('ShaderNodeMapping');wm.inputs['Rotation'].default_value=(math.radians(ROTX),0,math.radians(ROTZ))
wn.links.new(wt.outputs['Generated'],wm.inputs[0]);wn.links.new(wm.outputs[0],et.inputs[0]);wn.links.new(et.outputs[0],bg.inputs[0]);wn.links.new(bg.outputs[0],wo.inputs[0])
# ---- camera: orthographic, straight down, one shell unit per W
cam=bpy.data.cameras.new('c');cam.type='ORTHO';cam.ortho_scale=W;cam.clip_end=2000;co_=bpy.data.objects.new('c',cam);sc.collection.objects.link(co_);sc.camera=co_
co_.location=(W/2,-H/2,600)
sc.render.engine='CYCLES';sc.cycles.samples=SPP;sc.cycles.use_denoising=False;sc.cycles.max_bounces=6;sc.cycles.glossy_bounces=4
sc.render.resolution_x=int(W*S);sc.render.resolution_y=int(H*S);sc.render.resolution_percentage=100;sc.render.film_transparent=True
sc.view_settings.view_transform='Standard';sc.render.image_settings.file_format='PNG';sc.render.image_settings.color_mode='RGBA';sc.render.filepath=OUT
sc.cycles.device='CPU';sc.render.threads_mode='AUTO'
bpy.ops.render.render(write_still=True);print('WROTE',OUT)
