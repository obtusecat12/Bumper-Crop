# V141 F1 SoHo cast-iron facade: photo as blueprint -> real high-poly relief (window recesses with segmental arches, spandrels,
# arch hoods, colonettes + capitals, belt courses, corner piers, stepped cornice with modillions/consoles, storefront with
# recessed shop windows + deep door, sign band, shop cornice) -> Cycles Selected-to-Active bake (albedo, AO, roughness,
# tangent normal) onto a low-poly that keeps the big relief (window/shop/door recesses, cornice + shop-cornice boxes).
# Photo stays on front-facing faces only (planar); every side/return face gets the procedural painted-iron PBR material.
# Fire escape + awnings are NOT here: they are separate runtime geometry (dist/soho141-facade.js).
#   blender -b -P bc/scripts/facade141/build141.py -- bc/scripts/facade141/a0.json OUTDIR [samples]
# Writes OUTDIR/{alb,ao,rough,nrm}.png + low.json (runtime coords: x along street, y up, z out of the wall, front plane z=0).
import bpy,bmesh,json,math,sys,os
argv=sys.argv[sys.argv.index('--')+1:];S=json.load(open(argv[0]));OUT=argv[1];SPP=int(argv[2]) if len(argv)>2 else 48
os.makedirs(OUT,exist_ok=True);ROOT=os.getcwd()
PW,PH=S['px'];W,H=S['w'],S['H']
X=lambda x:x/PW*W-W/2
Y=lambda y:(PH-y)/PH*H
VTOP=1-22/PH
TW,TH=1024,2048;FU=.75   # bake atlas; front planar block u 0..FU, packed return faces in the strip u FU..1

class M:
 def __init__(s):s.v=[];s.f=[]   # f = (idx list, tag, smooth)
 def vert(s,p):s.v.append(tuple(p));return len(s.v)-1
 def poly(s,pts,tag,smooth=False):s.f.append(([s.vert(p) for p in pts],tag,smooth))
 def quad(s,a,b,c,d,tag):s.poly([a,b,c,d],tag)
 def box(s,x0,x1,y0,y1,z0,z1,tag,back=False,skip=()):
  P=lambda x,y,z:(x,y,z)
  F={'front':[P(x0,y0,z1),P(x1,y0,z1),P(x1,y1,z1),P(x0,y1,z1)],'back':[P(x1,y0,z0),P(x0,y0,z0),P(x0,y1,z0),P(x1,y1,z0)],
     'top':[P(x0,y1,z1),P(x1,y1,z1),P(x1,y1,z0),P(x0,y1,z0)],'bottom':[P(x0,y0,z0),P(x1,y0,z0),P(x1,y0,z1),P(x0,y0,z1)],
     'left':[P(x0,y0,z0),P(x0,y0,z1),P(x0,y1,z1),P(x0,y1,z0)],'right':[P(x1,y0,z1),P(x1,y0,z0),P(x1,y1,z0),P(x1,y1,z1)]}
  for k,q in F.items():
   if (k=='back' and not back) or k in skip:continue
   s.poly(q,tag)
 def cyl(s,cx,cz,r,y0,y1,tag,seg=16):
  ring=[(cx+r*math.cos(2*math.pi*i/seg),cz+r*math.sin(2*math.pi*i/seg)) for i in range(seg)]
  for i in range(seg):
   a,b=ring[i],ring[(i+1)%seg]
   if (a[1]+b[1])/2<-.02:continue    # buried half (behind the wall plane)
   s.poly([(a[0],y0,a[1]),(a[0],y1,a[1]),(b[0],y1,b[1]),(b[0],y0,b[1])],tag,True)
  s.poly([(p[0],y1,p[1]) for p in reversed(ring)],tag)   # top cap (+y)

def arch(x0,x1,ys,ya,n=12):
 """segmental arch from (x0,ys) over the apex (xc,ya) to (x1,ys); metres"""
 hw=(x1-x0)/2;rise=max(1e-3,ya-ys);R=(hw*hw+rise*rise)/(2*rise);cx=(x0+x1)/2;cy=ya-R;a0=math.atan2(ys-cy,x0-cx);a1=math.atan2(ys-cy,x1-cx)
 return [(cx+R*math.cos(a0+(a1-a0)*i/n),cy+R*math.sin(a0+(a1-a0)*i/n)) for i in range(n+1)],(cx,cy,R)

# ---------------- holes shared by high + low ----------------
holes=[]   # (x0,x1,yb,yt,depth,kind,extra)
for (ya_,ys_,yb_) in S['floors']:
 for (c0,c1) in S['cols']:holes.append((X(c0),X(c1),Y(yb_),Y(ya_),S['glassD'],'win',Y(ys_)))
for (c0,c1) in S['shop']:holes.append((X(c0),X(c1),Y(S['shopY'][1]),Y(S['shopY'][0]),S['shopD'],'shop',None))
d=S['door'];holes.append((X(d[0]),X(d[1]),Y(d[3]),Y(d[2]),S['doorD'],'door',None))
YF=Y(S['frieze'][1]);SC=S['shopCornice']

def wall_grid(m,tag,bands):
 xs=sorted({-W/2,W/2,*[h[0] for h in holes],*[h[1] for h in holes]})
 ys=sorted({0,YF,*[h[2] for h in holes],*[h[3] for h in holes],*[b for bb in bands for b in bb]})
 for i in range(len(xs)-1):
  for j in range(len(ys)-1):
   cx,cy=(xs[i]+xs[i+1])/2,(ys[j]+ys[j+1])/2
   if cy>YF:continue
   if any(h[0]<cx<h[1] and h[2]<cy<h[3] for h in holes):continue
   if any(b0<cy<b1 for b0,b1 in bands):continue
   m.quad((xs[i],ys[j],0),(xs[i+1],ys[j],0),(xs[i+1],ys[j+1],0),(xs[i],ys[j+1],0),tag)

def rect_recess(m,h,tag,backtag):
 x0,x1,yb,yt,D=h[:5]
 m.quad((x0,yb,-D),(x1,yb,-D),(x1,yt,-D),(x0,yt,-D),backtag)
 m.quad((x0,yb,0),(x0,yb,-D),(x0,yt,-D),(x0,yt,0),tag)     # left reveal (normal +x)
 m.quad((x1,yb,-D),(x1,yb,0),(x1,yt,0),(x1,yt,-D),tag)     # right reveal (normal -x)
 m.quad((x0,yb,-D),(x0,yb,0),(x1,yb,0),(x1,yb,-D),tag)     # sill (normal +y)
 m.quad((x0,yt,0),(x0,yt,-D),(x1,yt,-D),(x1,yt,0),tag)     # soffit (normal -y)

# ---------------- HIGH ----------------
hi=M();Ysc=Y(SC[1]);Ysc1=Y(SC[0])
wall_grid(hi,'wall',[])
for h in holes:
 x0,x1,yb,yt,D,kind,ys=h
 if kind!='win':rect_recess(hi,h,'wall','glass' if kind=='shop' else 'wall');continue
 pts,(acx,acy,R)=arch(x0,x1,ys,yt)
 # spandrel fans (front plane) filling the rect corners above the arch
 L=[p for p in pts if p[0]<=acx+1e-6];Rr=[p for p in pts if p[0]>=acx-1e-6]
 for i in range(len(L)-1):hi.poly([(x0,yt,0),(L[i][0],L[i][1],0),(L[i+1][0],L[i+1][1],0)],'wall')
 for i in range(len(Rr)-1):hi.poly([(x1,yt,0),(Rr[i][0],Rr[i][1],0),(Rr[i+1][0],Rr[i+1][1],0)],'wall')
 # arch reveal strip + straight reveals + sill
 for i in range(len(pts)-1):a,b=pts[i],pts[i+1];hi.quad((a[0],a[1],0),(a[0],a[1],-D),(b[0],b[1],-D),(b[0],b[1],0),'wall')
 hi.quad((x0,yb,0),(x0,yb,-D),(x0,ys,-D),(x0,ys,0),'wall');hi.quad((x1,yb,-D),(x1,yb,0),(x1,ys,0),(x1,ys,-D),'wall')
 hi.quad((x0,yb,-D),(x0,yb,0),(x1,yb,0),(x1,yb,-D),'wall')
 # glass (rect + arch) at the back of the reveal
 hi.poly([(x0,yb,-D),(x1,yb,-D)]+[(p[0],p[1],-D) for p in reversed(pts)],'glass')
 # sash frames (perimeter stiles, bottom rail, meeting rail, centre mullion)
 fw=.07;zz=(-D,-D+.05)
 hi.box(x0,x0+fw,yb,ys,*zz,'wall');hi.box(x1-fw,x1,yb,ys,*zz,'wall');hi.box(x0,x1,yb,yb+.09,*zz,'wall')
 ym=yb+(ys-yb)*.52;hi.box(x0,x1,ym-.04,ym+.04,*zz,'wall');xc=(x0+x1)/2;hi.box(xc-.03,xc+.03,yb,ys+(yt-ys)*.6,*zz,'wall')
 # arch hood: ring band outside the arch, 0.15 wide, 0.1 out, keystone
 o=[(acx+(p[0]-acx)*(R+.15)/R,acy+(p[1]-acy)*(R+.15)/R) for p in pts]
 for i in range(len(pts)-1):
  a,b,c,dd=pts[i],pts[i+1],o[i+1],o[i]
  hi.quad((b[0],b[1],.1),(c[0],c[1],.1),(dd[0],dd[1],.1),(a[0],a[1],.1),'wall')      # front
  hi.quad((c[0],c[1],.1),(c[0],c[1],0),(dd[0],dd[1],0),(dd[0],dd[1],.1),'wall')      # outer edge
  hi.quad((b[0],b[1],0),(b[0],b[1],.1),(a[0],a[1],.1),(a[0],a[1],0),'wall')          # inner edge (soffit of the hood)
 hi.box(acx-.12,acx+.12,yt-.05,yt+.32,0,.16,'wall')
# colonettes + capitals + bases per upper floor
belts=S['belts']
for fi,(ya_,ys_,yb_) in enumerate(S['floors']):
 y0=Y(belts[fi][0]);y1=Y(ys_+20)
 for cxp in S['colonettes']:
  cx=X(cxp);hi.cyl(cx,.04,.2,y0+.25,y1,'wall')
  hi.box(cx-.32,cx+.32,y1,y1+.5,0,.34,'wall');hi.box(cx-.27,cx+.27,y0,y0+.25,0,.3,'wall')
for (b0,b1,out) in belts:
 hi.box(-W/2,W/2,Y(b1),Y(b0),0,out,'wall');hi.box(-W/2,W/2,Y(b0)-.06,Y(b0),0,out+.06,'wall')   # belt + drip lip
for (p0,p1) in S['piers']:
 hi.box(X(p0),X(p1),Y(PH),Y(S['pierTop']),0,S['pierOut'],'wall')
 for y in (Y(400),Y(600),Y(820)):hi.box(X(p0)+.15,X(p1)-.15,y-.6,y+.6,S['pierOut'],S['pierOut']+.05,'wall')  # raised panels
# cornice: frieze, modillion fascia + modillions, consoles, stepped crown
hi.box(-W/2,W/2,Y(S['frieze'][1]),Y(S['frieze'][0]),0,S['frieze'][2],'wall')
hi.box(-W/2,W/2,Y(S['modillion'][1]),Y(S['modillion'][0]),0,.22,'wall')
x=20
while x<735:
 hi.box(X(x-6),X(x+6),Y(98),Y(62),.22,S['modillion'][2],'wall');x+=34
for c in S['consoles']:hi.box(X(c-14),X(c+14),Y(165),Y(56),0,.58,'wall')
hi.box(-W/2,W/2,Y(60),Y(45),0,.65,'wall');hi.box(-W/2-.02,W/2+.02,Y(45),H,0,S['crown'][2],'wall')
# storefront
hi.box(-W/2,W/2,Ysc,Ysc1,0,SC[2],'wall')
sg=S['sign'];hi.box(X(sg[0]),X(sg[1]),Y(sg[3]),Y(sg[2]),0,sg[4],'wall')
for c in S['groundCols']:
 cx=X(c);hi.cyl(cx,.06,.26,Y(1345),Y(1100),'wall');hi.box(cx-.36,cx+.36,Y(1110),Y(1088),0,.4,'wall');hi.box(cx-.33,cx+.33,Y(1345),Y(1328),0,.36,'wall')
hi.box(-W/2,W/2,0,Y(1345),0,.06,'wall')

# ---------------- LOW ----------------
lo=M()
wall_grid(lo,'front',[(Ysc,Ysc1)])
for h in holes:rect_recess(lo,h,'side','front')
Y60=Y(60)
lo.box(-W/2,W/2,Ysc,Ysc1,0,SC[2],'box')          # shop cornice
lo.box(-W/2,W/2,YF,Y60,0,.3,'box',skip=('top',))  # frieze+modillion block
# crown: front/top/ends + bottom split (the part in front of the lower block)
lo.box(-W/2,W/2,Y60,H,0,S['crown'][2],'box',skip=('bottom',))
lo.quad((-W/2,Y60,.3),(W/2,Y60,.3),(W/2,Y60,S['crown'][2]),(-W/2,Y60,S['crown'][2]),'box')

# ---------------- to Blender ----------------
B=lambda p:(p[0],-p[2],p[1])   # runtime local (x, y up, z out) -> Blender (x, -z, y)
def normal(pts):
 nx=ny=nz=0
 for i in range(len(pts)):
  a,b=pts[i],pts[(i+1)%len(pts)];nx+=(a[1]-b[1])*(a[2]+b[2]);ny+=(a[2]-b[2])*(a[0]+b[0]);nz+=(a[0]-b[0])*(a[1]+b[1])
 l=math.sqrt(nx*nx+ny*ny+nz*nz) or 1;return(nx/l,ny/l,nz/l)
def make(name,m,mats,tagmat,uvf,weld=False):
 me=bpy.data.meshes.new(name);bm=bmesh.new();vs=[bm.verts.new(B(p)) for p in m.v];uv=bm.loops.layers.uv.new('UVMap')
 for k,(ix,tag,sm) in enumerate(m.f):
  try:f=bm.faces.new([vs[i] for i in ix])
  except ValueError:continue
  pts=[m.v[i] for i in ix];n=normal(pts);f.material_index=tagmat(tag,n);f.smooth=sm
  for j,(lp,i) in enumerate(zip(f.loops,ix)):lp[uv].uv=uvf(m.v[i],k,j,n,tag)
 if weld:bmesh.ops.remove_doubles(bm,verts=bm.verts,dist=1e-5)
 bm.to_mesh(me);bm.free();ob=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(ob)
 for mt in mats:me.materials.append(mt)
 return ob

for o in list(bpy.data.objects):bpy.data.objects.remove(o)
def principled(name):
 mt=bpy.data.materials.new(name);mt.use_nodes=True;nt=mt.node_tree;p=nt.nodes['Principled BSDF'];return mt,nt,p
photo=bpy.data.images.load(os.path.join(ROOT,S['photo']))
def photo_mat(name,rough,dark=1.0):
 mt,nt,p=principled(name);t=nt.nodes.new('ShaderNodeTexImage');t.image=photo;t.interpolation='Cubic'
 if dark<1:
  mx=nt.nodes.new('ShaderNodeMixRGB');mx.blend_type='MULTIPLY';mx.inputs[0].default_value=1;mx.inputs[2].default_value=(dark,dark,dark,1)
  nt.links.new(t.outputs[0],mx.inputs[1]);nt.links.new(mx.outputs[0],p.inputs['Base Color'])
 else:nt.links.new(t.outputs[0],p.inputs['Base Color'])
 p.inputs['Roughness'].default_value=rough;return mt
mPhoto=photo_mat('photo',.78);mGlass=photo_mat('glass',.1)
mIron,nt,p=principled('iron')   # painted cast iron: cream paint, fine orange-peel + chipped, grime in noise
tc=nt.nodes.new('ShaderNodeTexCoord');n1=nt.nodes.new('ShaderNodeTexNoise');n1.inputs['Scale'].default_value=9;n1.inputs['Detail'].default_value=6
nt.links.new(tc.outputs['Object'],n1.inputs['Vector'])
ramp=nt.nodes.new('ShaderNodeValToRGB');ramp.color_ramp.elements[0].position=.35;ramp.color_ramp.elements[0].color=(*[c*.78 for c in S['iron']],1)
ramp.color_ramp.elements[1].position=.7;ramp.color_ramp.elements[1].color=(*S['iron'],1);nt.links.new(n1.outputs['Fac'],ramp.inputs[0]);nt.links.new(ramp.outputs[0],p.inputs['Base Color'])
n2=nt.nodes.new('ShaderNodeTexNoise');n2.inputs['Scale'].default_value=60;nt.links.new(tc.outputs['Object'],n2.inputs['Vector'])
bump=nt.nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.25;nt.links.new(n2.outputs['Fac'],bump.inputs['Height']);nt.links.new(bump.outputs[0],p.inputs['Normal'])
rr=nt.nodes.new('ShaderNodeMapRange');rr.inputs[3].default_value=.55;rr.inputs[4].default_value=.8;nt.links.new(n1.outputs['Fac'],rr.inputs[0]);nt.links.new(rr.outputs[0],p.inputs['Roughness'])

def hi_mat(tag,n):
 if tag=='glass':return 1
 return 0 if n[2]>.7 else 2
def hi_uv(p,k,j,n,tag):return((p[0]+W/2)/W,min(p[1]/H,VTOP))
HI=make('high',hi,[mPhoto,mGlass,mIron],hi_mat,hi_uv,weld=True)

# low uv: front-facing faces planar into u 0..FU; everything else shelf-packed (rects) into the strip u FU..1
front=[];rest=[]
for k,(ix,tag,sm) in enumerate(lo.f):
 n=normal([lo.v[i] for i in ix]);(front if n[2]>.7 else rest).append(k)
def rect_dims(ix):
 p=[lo.v[i] for i in ix];import itertools
 e1=math.dist(p[0],p[1]);e2=math.dist(p[1],p[2]);return e1,e2
SW=(1-FU)*TW-8;sc=None
for scale in [x/10 for x in range(60,3,-1)]:   # px per metre in the strip
 X0=0;Yc=0;row=0;pl={};ok=True
 for k in sorted(rest,key=lambda k:-min(rect_dims(lo.f[k][0]))):
  e1,e2=rect_dims(lo.f[k][0]);a,b=e1*scale*10,e2*scale*10   # a along edge0, b along edge1
  rot=a>b and a>SW*.5
  ww,hh=(b,a) if rot else (a,b)
  if ww>SW:ok=False;break
  if X0+ww+4>SW:X0=0;Yc+=row+4;row=0
  pl[k]=(X0,Yc,ww,hh,rot);X0+=ww+4;row=max(row,hh)
 if ok and Yc+row<TH-8:sc=scale;break
print('strip scale px/m',sc*10,'faces',len(rest))
LOW_UV={}
for k in rest:
 x0,y0,ww,hh,rot=pl[k];u0=FU+(x0+4)/TW;v0=(y0+4)/TH;u1=u0+ww/TW;v1=v0+hh/TH
 LOW_UV[k]=[(u0,v0),(u1,v0),(u1,v1),(u0,v1)] if not rot else [(u0,v0),(u0,v1),(u1,v1),(u1,v0)]
fk={id(f):k for k,f in enumerate(lo.f)}
_cnt={'k':0}
def lo_uv(p,k,j,n,tag):
 if k in LOW_UV:return LOW_UV[k][j]
 return((p[0]+W/2)/W*FU,p[1]/H)
bk=bpy.data.materials.new('bake');bk.use_nodes=True;bnt=bk.node_tree;img_node=bnt.nodes.new('ShaderNodeTexImage');bnt.nodes.active=img_node
LO=make('low',lo,[bk],lambda t,n:0,lo_uv)
assert len(LO.data.polygons)==len(lo.f),'low faces dropped'
print('high faces',len(HI.data.polygons),'low faces',len(LO.data.polygons))

sc_=bpy.context.scene;sc_.render.engine='CYCLES';sc_.cycles.device='CPU';sc_.cycles.use_denoising=False;sc_.cycles.samples=SPP
sc_.world=bpy.data.worlds.new('w');sc_.world.color=(1,1,1)
for o in (LO,):o.visible_diffuse=o.visible_glossy=o.visible_shadow=o.visible_transmission=o.visible_volume_scatter=False
bpy.context.view_layer.objects.active=LO;HI.select_set(True);LO.select_set(True)
bs=sc_.render.bake;bs.use_selected_to_active=True;bs.cage_extrusion=.45;bs.max_ray_distance=1.6;bs.margin=12
def bake(kind,fn,cs='sRGB',**kw):
 im=bpy.data.images.new(fn,TW,TH,alpha=False,float_buffer=False);im.colorspace_settings.name=cs;img_node.image=im
 bpy.ops.object.bake(type=kind,**kw);im.filepath_raw=os.path.join(OUT,fn+'.png');im.file_format='PNG';im.save();print('baked',kind)
bake('DIFFUSE','alb',pass_filter={'COLOR'})
bake('NORMAL','nrm','Non-Color',normal_space='TANGENT')
bake('ROUGHNESS','rough','Non-Color')
sc_.cycles.samples=max(16,SPP);bake('AO','ao','Non-Color')
# low export (runtime coords), triangulated fans of the quads
pos=[];uvs=[];nrm=[]
me=LO.data;uvl=me.uv_layers['UVMap'].data
for poly in me.polygons:
 L=list(poly.loop_indices);n=poly.normal;nr=(n.x,n.z,-n.y)
 for t in range(1,len(L)-1):
  for li in (L[0],L[t],L[t+1]):
   v=me.vertices[me.loops[li].vertex_index].co;pos+= [round(v.x,4),round(v.z,4),round(-v.y,4)];u=uvl[li].uv;uvs+=[round(u.x,5),round(u.y,5)];nrm+=[round(nr[0],3),round(nr[1],3),round(nr[2],3)]
json.dump({'pos':pos,'uv':uvs,'nrm':nrm},open(os.path.join(OUT,'low.json'),'w'))
print('low tris',len(pos)//9)
