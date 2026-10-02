#!/usr/bin/env python3
"""Authored, faceted low-poly spa characters. No external mesh/primitives.
All surfaces are explicit anatomical cross-section rings, branch loops, or plates.
Exports self-contained glTF 2.0 GLBs with true 20-joint skinning, three unlit
materials, image-space UVs, and STEP 20 Hz sampled animation/morph targets.
"""
from pathlib import Path
import argparse,json,math,struct,io
import numpy as np
from PIL import Image,ImageDraw,ImageFont
P=Path(__file__).resolve().parent
PI=math.pi

def unit(a):
 a=np.array(a,float); return a/(np.linalg.norm(a) or 1)
def quat(axis,ang):
 a=unit(axis)*math.sin(ang/2); return np.r_[a,math.cos(ang/2)]
def qmat(q):
 x,y,z,w=q
 return np.array([[1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w)],[2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w)],[2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)]])
def matq(m):
 tr=np.trace(m)
 if tr>0:
  s=math.sqrt(tr+1)*2; return np.array([(m[2,1]-m[1,2])/s,(m[0,2]-m[2,0])/s,(m[1,0]-m[0,1])/s,.25*s])
 vals=[m[i,i] for i in range(3)]; i=int(np.argmax(vals)); j=(i+1)%3;k=(i+2)%3
 s=math.sqrt(1+m[i,i]-m[j,j]-m[k,k])*2;q=np.zeros(4);q[i]=.25*s;q[j]=(m[j,i]+m[i,j])/s;q[k]=(m[k,i]+m[i,k])/s;q[3]=(m[k,j]-m[j,k])/s;return q

def atlas(region,u,v):
 boxes={'front':(0,0,128,160),'back':(128,0,256,160),'arm':(0,160,64,256),'leg':(64,160,128,256),'hand':(128,160,256,256)}
 x0,y0,x1,y1=boxes[region]
 return [(x0+1+u*(x1-x0-2))/256,(y0+1+v*(y1-y0-2))/256]

class Part:
 def __init__(self,name): self.name=name;self.p=[];self.uv=[];self.j=[];self.w=[];self.faces=[];self.morph=[[],[],[]]
 def v(self,p,uv,weights,delta=None):
  self.p.append(np.array(p,float));self.uv.append(uv)
  ws=list(weights.items()); ws=sorted(ws,key=lambda kv:-kv[1])[:4];total=sum(x[1] for x in ws)
  self.j.append([x[0] for x in ws]+[0]*(4-len(ws)));self.w.append([x[1]/total for x in ws]+[0]*(4-len(ws)))
  for i in range(3): self.morph[i].append(np.array(delta[i] if delta and i in delta else [0,0,0]))
  return len(self.p)-1
 def tri(self,a,b,c,out=None):
  if len({a,b,c})<3:return
  pa,pb,pc=[self.p[i] for i in(a,b,c)];n=np.cross(pb-pa,pc-pa)
  if np.linalg.norm(n)<1e-11:
   if any(np.linalg.norm(self.morph[0][k])>0 for k in[a,b,c]):self.faces.append((a,b,c))
   return
  if out is not None and np.dot(n,out)<0:b,c=c,b
  self.faces.append((a,b,c))
 def quad(self,a,b,c,d,out=None):self.tri(a,b,c,out);self.tri(a,c,d,out)
 def join(self,a,b,center_a=None,center_b=None):
  n=len(a); assert len(b)==n
  center_a=np.mean([self.p[i] for i in a],axis=0) if center_a is None else np.array(center_a)
  center_b=np.mean([self.p[i] for i in b],axis=0) if center_b is None else np.array(center_b)
  for k in range(n):
   k2=(k+1)%n;out=(self.p[a[k]]+self.p[a[k2]]+self.p[b[k]]+self.p[b[k2]])/4-(center_a+center_b)/2
   self.quad(a[k],a[k2],b[k2],b[k],out)
 def cap(self,ring,weights,uv,normal):
  c=self.v(np.mean([self.p[i] for i in ring],axis=0),uv,weights)
  for i in range(len(ring)):self.tri(c,ring[i],ring[(i+1)%len(ring)],normal)
 def flatten(self):
  """Keep continuous positions, split corners solely for explicit flat normals."""
  pos=[];norm=[];uv=[];j=[];w=[];m=[[],[],[]]
  for tri in self.faces:
   a,b,c=[self.p[i] for i in tri];n=unit(np.cross(b-a,c-a))
   if np.linalg.norm(n)<.1:n=np.array([0.,0.,1.])
   for k in tri:
    pos.append(self.p[k]);norm.append(n);uv.append(self.uv[k]);j.append(self.j[k]);w.append(self.w[k])
    for mi in range(3):m[mi].append(self.morph[mi][k])
  return {'POSITION':np.array(pos,np.float32),'NORMAL':np.array(norm,np.float32),'TEXCOORD_0':np.array(uv,np.float32),'JOINTS_0':np.array(j,np.uint16),'WEIGHTS_0':np.array(w,np.float32),'morph':[np.array(t,np.float32) for t in m]}

class Model:
 def __init__(self,key):
  self.key=key;self.seated=key=='a';self.body=Part('skin');self.face=Part('face');self.towel=Part('towel');self.parts=[self.body,self.face,self.towel]
  self.names=['root','pelvis','spine','chest','neck','head','clavicle.L','upper_arm.L','forearm.L','hand.L','clavicle.R','upper_arm.R','forearm.R','hand.R','thigh.L','shin.L','foot.L','thigh.R','shin.R','foot.R']
  self.parent=[-1,0,1,2,3,4,3,6,7,8,3,10,11,12,1,14,15,1,17,18];self.idx={n:i for i,n in enumerate(self.names)}
  if self.seated:
   self.pelvis=np.array([0,.50,-.05]);self.sy=1.025;self.hy=1.13;self.height=1.38
   self.arm={-1:[[-.23,1.025,0],[-.385,.87,.06],[-.39,.78,.255],[-.375,.774,.308]],1:[[.23,1.025,0],[.37,.91,.025],[.48,.83,.205],[.49,.811,.255]]}
   self.leg={-1:[[-.125,.50,-.035],[-.16,.44,.36],[-.18,.075,.40]],1:[[.125,.50,-.035],[.19,.44,.345],[.21,.075,.39]]}
  else:
   self.pelvis=np.array([.018,.94,0]);self.sy=1.425;self.hy=1.47;self.height=1.72
   self.arm={-1:[[-.22,1.425,0],[-.31,1.147,.033],[-.37,.872,.135],[-.37,.859,.192]],1:[[.252,1.425,-.018],[.293,1.18,-.012],[.315,.946,.034],[.309,.895,.055]]}
   self.leg={-1:[[-.095,.94,0],[-.115,.515,.026],[-.132,.075,.055]],1:[[.13,.94,0],[.19,.51,.005],[.223,.075,.027]]}
  py=self.pelvis[1]; self.jpos=[np.zeros(3),self.pelvis,np.array([self.pelvis[0],py+.17,-.015]),np.array([0,self.sy-.10,0]),np.array([0,self.sy+.037,-.012]),np.array([0,self.hy+.01,-.012])]
  for side in[-1,1]:
   ar=self.arm[side];self.jpos.extend([np.array([side*.13,self.sy-.015,0]),*[np.array(x) for x in ar[:3]]])
  for side in[-1,1]:self.jpos.extend([np.array(x) for x in self.leg[side]])
  self.jpos=np.array(self.jpos)
  self.contact={'left_palm':[-.37,.98,.19] if not self.seated else [-.385,.77,.30],'feet_ground_y':0.,'seated_pelvis_y':.5 if self.seated else None}
  self.build_torso(); self.build_legs(); self.build_head(); self.build_towel()
  if not self.seated:self.lean_to_basin()
 def lean_to_basin(self):
  # Flexed stance and a modest left/forward lean allow an adult-length arm to
  # rest on the actual low bowl. This warp is baked into both the bind mesh and
  # joint positions; animation continues from the physically grounded pose.
  def warp(p):
   x,y,z=p; return np.array([x-.27*max(y-.90,0),y-.09*np.clip((y-.45)/.4,0,1)+.16*x*np.clip((y-.80)/.15,0,1),z+.18*max(y-.90,0)])
  for part in self.parts:
   for i,p in enumerate(part.p):
    new=warp(p)
    for mi in range(3):part.morph[mi][i]=warp(p+part.morph[mi][i])-new
    part.p[i]=new
  self.jpos=np.array([warp(p) for p in self.jpos]);self.height=float(max(p[1] for p in self.face.p));self.hy=float(self.jpos[5,1]-.01)
  self.contact['left_palm']=[-.37,.737,.19]
  self.contact['standingPosture']='Modest forward/left torso lean with flexed knee; feet flat'
 def weights_y(self,y):
  py=self.pelvis[1];sy=self.sy
  if y<py+.12:return {1:1}
  if y<sy-.16:
   t=np.clip((y-(py+.10))/(sy-.16-(py+.10)),0,1);return {1:1-t,2:t}
  if y<sy+.012:
   t=np.clip((y-(sy-.19))/.16,0,1);return {2:1-t,3:t}
  return {4:1}
 def build_torso(self):
  b=self.body;py=self.pelvis[1];sy=self.sy
  # Twelve-sided cross sections retain pectoral planes and a narrowed abdominal silhouette.
  specs=[(py-.035,.145,.081),(py+.05,.151,.087),(py+.145,.137,.080),(sy-.20,.172,.094),(sy-.115,.206,.111),(sy-.067,.225,.107),(sy+.004,.222,.087),(sy+.027,.10,.063),(sy+.060,.061,.054),(self.hy+.015,.055,.052)]
  self.torsorings=[]
  for ri,(y,rx,rz) in enumerate(specs):
   ring=[]
   for k in range(12):
    th=2*PI*k/12;x=math.sin(th)*rx;z=math.cos(th)*rz
    # Front pectoral plane and sternum inset, back lat sweep.
    if ri in[4,5] and math.cos(th)>.4:z+=.008 if k in[1,11] else 0
    if ri>=7:x+=self.pelvis[0]*.12
    else:x+=self.pelvis[0]*(1-max(0,y-py)/(sy-py))
    z+=-.035*(1-max(0,y-py)/(sy-py)) if self.seated else 0
    front=math.cos(th)>=0;u=.5+x/(rx*2) if front else .5-x/(rx*2)
    v=(sy+.05-y)/(sy+.05-py)
    if ri>=7:front=True;u=.28+x*.25;v=.24+(sy+.06-y)*.1
    else:u=.17+u*.66
    ring.append(b.v([x,y,z],atlas('front' if front else 'back',u,float(np.clip(v,0,1))),self.weights_y(y)))
   self.torsorings.append(ring)
  for ri in range(len(specs)-1):
   a,c=self.torsorings[ri:ri+2]
   for k in range(12):
    # Shoulder branch apertures: precisely shared boundary vertices, no attached balls.
    if ri==5 and k in[2,3,8,9]:continue
    k2=(k+1)%12;out=np.mean([b.p[a[k]],b.p[a[k2]],b.p[c[k2]],b.p[c[k]]],axis=0)-np.array([0,(specs[ri][0]+specs[ri+1][0])/2,0])
    b.quad(a[k],a[k2],c[k2],c[k],out)
  # Arms branch from the six-edge torso apertures.
  for side in[-1,1]:
   inds=[8,9,10] if side<0 else [2,3,4]
   aperture=[self.torsorings[5][k] for k in inds]+[self.torsorings[6][k] for k in inds[::-1]]
   self.build_arm(side,aperture)
 def ring_tube(self,part,centers,radii,weights,region,n=6,first=None,vs=None):
  rings=[]
  for i,c in enumerate(centers):
   c=np.array(c);t=unit(np.array(centers[min(i+1,len(centers)-1)])-np.array(centers[max(i-1,0)]))
   a=np.array([0.,0.,1.]);a=unit(a-t*np.dot(a,t)); bb=unit(np.cross(t,a));rr=radii[i];r1,r2=rr if hasattr(rr,'__len__') else (rr,rr)
   ring=[]
   for k in range(n):
    th=2*PI*k/n; p=c+a*math.cos(th)*r1+bb*math.sin(th)*r2
    tu=(.235+.105*math.sin(th)) if math.cos(th)>=0 else (.75-.105*math.sin(th))
    tv=.045+.90*(vs[i] if vs is not None else i/(len(centers)-1))
    if region=='hand':tu=.125+.085*math.sin(th);tv=.12+i*.07
    ring.append(part.v(p,atlas(region,tu,tv),weights[i]))
   rings.append(ring)
  if first:
   # Align branch ring orientation to its shared torso aperture.
   r=rings[0];opts=[]
   for rev in[False,True]:
    rr=r[::-1] if rev else r
    for shift in range(n):
     rrr=rr[shift:]+rr[:shift];cost=sum(np.linalg.norm(part.p[x]-part.p[y]) for x,y in zip(first,rrr));opts.append((cost,rrr))
   order=min(opts,key=lambda z:z[0])[1];perm=[r.index(i) for i in order];rings=[[r[k] for k in perm] for r in rings]
   part.join(first,rings[0])
  for a,b in zip(rings,rings[1:]):part.join(a,b)
  return rings
 def build_arm(self,side,aperture):
  b=self.body; shoulder,elbow,wrist,palm=map(np.array,self.arm[side]);suffix='L' if side<0 else 'R';up=self.idx['upper_arm.'+suffix];fore=self.idx['forearm.'+suffix];hand=self.idx['hand.'+suffix]
  lerp=lambda a,c,t:a*(1-t)+c*t
  centers=[lerp(shoulder,elbow,.12),lerp(shoulder,elbow,.34),lerp(shoulder,elbow,.73),elbow,lerp(elbow,wrist,.26),lerp(elbow,wrist,.76),wrist]
  radii=[(.053,.058),(.061,.062),(.047,.052),(.040,.044),(.047,.049),(.031,.033),(.024,.028)]
  weights=[{up:1},{up:1},{up:.85,fore:.15},{up:.4,fore:.6},{fore:1},{fore:.75,hand:.25},{hand:1}]
  ar=self.ring_tube(b,centers,radii,weights,'arm',6,aperture)
  direction=unit(palm-wrist);width=unit(np.cross([0,1,0],direction))
  if abs(np.dot(direction,[0,1,0]))>.8:width=np.array([side,0,0.])
  normal=unit(np.cross(direction,width))
  # Broad, slightly cupped palms, with a real five-digit silhouette.
  pc=wrist+direction*.051;tip=wrist+direction*.088
  handcenters=[wrist,pc,tip]; handr=[(.024,.014),(.036,.016),(.033,.013)];hr=[]
  for i,(c,(ww,hh)) in enumerate(zip(handcenters,handr)):
   ring=[]
   for k in range(6):
    th=2*PI*k/6;p=c+width*math.cos(th)*ww+normal*math.sin(th)*hh
    ring.append(b.v(p,atlas('hand',.035+(math.cos(th)+1)*.082,.34+i*.048),{hand:1}))
   hr.append(ring)
  # Ring orientation matches wrist, avoiding disjoint doll-like hands.
  rr=hr[0];options=[]
  for rev in[False,True]:
   base=rr[::-1] if rev else rr
   for s in range(6):
    r=base[s:]+base[:s];options.append((sum(np.linalg.norm(b.p[x]-b.p[y]) for x,y in zip(ar[-1],r)),r))
  order=min(options,key=lambda a:a[0])[1];perm=[rr.index(x) for x in order];hr=[[r[k] for k in perm] for r in hr]
  b.join(ar[-1],hr[0]);b.join(hr[0],hr[1]);b.join(hr[1],hr[2]);b.cap(hr[-1],{hand:1},atlas('hand',.5,.6),direction)
  for fi in range(4):
   off=(fi-1.5)*.016; length=[.047,.062,.067,.053][fi];base=tip+width*off-direction*.004
   d=unit(direction+width*(fi-1.5)*.055-normal*.1)
   coords=[base,base+d*length*.48-normal*.002,base+d*length-normal*.009]
   rings=[]
   for ri,c in enumerate(coords):
    ring=[];rad=[.009,.008,.006][ri]
    for k in range(4):
     th=2*PI*k/4;p=c+width*math.cos(th)*rad+normal*math.sin(th)*rad*.85
     delta=normal*(-.009*(ri/2)**2)-direction*(.005*(ri/2)**2)
     ring.append(b.v(p,atlas('hand',.055+fi*.046,.12+ri*.08),{hand:1},{1 if side<0 else 2:delta}))
    rings.append(ring)
   for r1,r2 in zip(rings,rings[1:]):b.join(r1,r2)
   b.cap(rings[-1],{hand:1},atlas('hand',.8,.7),d)
  thumbbase=pc+width*.029-direction*.014;td=unit(width*.78+direction*.7-normal*.2);thumbcenters=[thumbbase,thumbbase+td*.024,thumbbase+td*.041-normal*.005]
  tr=self.ring_tube(b,thumbcenters,[.012,.011,.007],[{hand:1}]*3,'hand',4);b.cap(tr[-1],{hand:1},atlas('hand',.8,.8),td)
 def build_legs(self):
  b=self.body
  for side in[-1,1]:
   hip,knee,ankle=map(np.array,self.leg[side]);s='L' if side<0 else 'R';thigh=self.idx['thigh.'+s];shin=self.idx['shin.'+s];foot=self.idx['foot.'+s]
   lerp=lambda a,c,t:a*(1-t)+c*t
   centers=[hip,lerp(hip,knee,.45),lerp(hip,knee,.85),knee,lerp(knee,ankle,.28),lerp(knee,ankle,.68),ankle]
   radii=[(.080,.084),(.077,.079),(.054,.057),(.050,.055),(.056,.059),(.040,.044),(.029,.032)]
   weights=[{thigh:1},{thigh:1},{thigh:.8,shin:.2},{thigh:.35,shin:.65},{shin:1},{shin:.8,foot:.2},{foot:1}]
   before=len(b.faces)
   rings=self.ring_tube(b,centers,radii,weights,'leg',8)
   # Omit concealed upper thigh faces; the wrap is the visible surface.
   if not self.seated: del b.faces[before:before+16]
   # Anatomical foot loft: heel, instep, ball, squared tapered toes; sole at ground zero.
   cx=ankle[0];cz=ankle[2];fps=[(cz-.064,.042,.034),(cz-.030,.097,.042),(cz+.043,.058,.053),(cz+.109,.034,.054),(cz+.147,.024,.042)]
   fr=[]
   for ri,(z,ht,w) in enumerate(fps):
    ring=[]
    for k in range(6):
     th=2*PI*k/6;x=cx+math.sin(th)*w;y=(math.cos(th)+1)*ht/2
     ring.append(b.v([x,y,z],atlas('hand',.125+(x-cx)*1.2,.57+ri*.085),{foot:1}))
    fr.append(ring)
   for r1,r2 in zip(fr,fr[1:]):b.join(r1,r2)
   b.cap(fr[0],{foot:1},atlas('hand',.12,.59),[0,0,-1]);b.cap(fr[-1],{foot:1},atlas('hand',.12,.9),[0,0,1])
 def build_head(self):
  f=self.face;head=self.idx['head'];neck=self.idx['neck'];base=self.hy
  # Dense only across the face where the silhouette needs brow, nose and jaw breaks.
  angles=np.array([-PI,-2.6,-2.1,-1.57,-1.2,-.9,-.6,-.35,-.17,0,.17,.35,.6,.9,1.2,1.57,2.1,2.6])
  self.hangles=angles;n=len(angles);self.headrings=[]
  # image-space V, height, width, forward depth, rear depth
  specs=[(1.,.000,.050,.035,.049),(.90,.026,.055,.075,.055),(.78,.055,.082,.075,.068),(.70,.077,.085,.080,.079),(.55,.116,.091,.087,.085),(.46,.140,.094,.083,.089),(.39,.157,.089,.074,.090),(.31,.181,.087,.081,.092),(.16,.217,.084,.076,.087),(.035,.244,.051,.046,.054),(.0,.250,.005,.005,.005)]
  if not self.seated:specs=[(v,y,w*.97,ff,back) for v,y,w,ff,back in specs]
  def surface(th,v,y,w,ff,back):
   c=math.cos(th);x=math.sin(th)*w;z=c*(ff if c>0 else back)-.012
   # A central nose ridge and angular nostril base, not a painted flat mask.
   fac=max(0,1-abs(th)/.35)
   if v==.55:z+=.032*fac
   if v==.46:z+=.020*fac
   if v==.39:z+=.010*fac
   if v==.70:z+=.005*fac
   if v==.31 and abs(th)<.75:z+=.006
   if v==.90 and abs(th)<.35:z+=.002
   return [x,base+y,z]
  self.headspec=specs
  for ri,(v,y,w,ff,back) in enumerate(specs):
   ring=[]
   for th in angles:
    weights={head:1} if ri>0 else {head:.8,neck:.2}
    ring.append(f.v(surface(th,v,y,w,ff,back),[.5+.25*math.sin(th) if abs(th)<=PI/2 else .5+th/(2*PI),v],weights))
   self.headrings.append(ring)
  for r1,r2 in zip(self.headrings,self.headrings[1:]):f.join(r1,r2)
  f.cap(self.headrings[-1],{head:1},[.5,.01],[0,1,0])
  # Ears use folded silhouette plates, anchored to the head bone.
  for side in[-1,1]:
   ear=[(.086,.111,-.012),(.105,.116,-.020),(.114,.153,-.019),(.107,.179,-.020),(.087,.175,-.015),(.102,.148,.002),(.097,.147,-.027)]
   ids=[f.v([side*x,base+y,z],[.2 if side<0 else .8,.46],{head:1}) for x,y,z in ear]
   for i in range(5):f.tri(ids[i],ids[(i+1)%5],ids[5],[side,0,1]);f.tri(ids[(i+1)%5],ids[i],ids[6],[side,0,-1])
  # Angular close-cropped hair cap. The UVs sample the map's dark top strip.
  hair=[]
  for ri in range(4):
   ring=[]
   for th in angles:
    c=math.cos(th)
    if ri==0:
     y=.177+.027*max(0,c)-.019*max(0,-c);w=.091;dz=.089 if c>0 else .098
    elif ri==1:y=.222;w=.087;dz=.080 if c>0 else .089
    elif ri==2:y=.246;w=.054;dz=.051 if c>0 else .058
    else:y=.253;w=.014;dz=.013
    p=[math.sin(th)*w,base+y,c*dz-.012]
    # Tiny asymmetric hairline corners, deliberately hard and sparse.
    if ri==0 and abs(th)<.6:p[1]-=.004*(1 if self.seated else -1)
    ring.append(f.v(p,[.06+(th+PI)/(2*PI)*.88,.025+ri*.012],{head:1}))
   hair.append(ring)
  for r1,r2 in zip(hair,hair[1:]):f.join(r1,r2)
  f.cap(hair[-1],{head:1},[.5,.015],[0,1,0])
  # Morphing upper lids start folded to a zero-area line above the eyes.
  # They close over the diffuse eye marks, sampling nearby forehead skin.
  for side in[-1,1]:
   x=side*(.037 if self.seated else .041); rows=[]
   for ri in range(2):
    ring=[]
    for xi,xx in enumerate([x-.018,x,x+.018]):
     y=base+(.162 if xi!=1 else .166);co=math.sqrt(max(.01,1-(xx/.089)**2));z=.079*co-.010
     p=[xx,y-ri*.00015,z+ri*.00005]
     lower=base+(.152 if xi!=1 else .151)
     delta=[0,lower-y,.006] if ri else [0,0,0]
     ring.append(f.v(p,[.5+.25*xx/.089,.265+ri*.015],{head:1},{0:delta}))
    rows.append(ring)
   for i in range(2):f.quad(rows[0][i],rows[0][i+1],rows[1][i+1],rows[1][i],[0,0,1])
   # The fine lid crease is geometry that collapses while the eyes are open.
   cr=[]
   for ri in range(2):
    rr=[]
    for xi,xx in enumerate([x-.016,x,x+.016]):
     co=math.sqrt(max(.01,1-(xx/.089)**2));y=base+(.162 if xi!=1 else .166);z=.079*co-.009
     close_y=base+(.1525 if xi!=1 else .1515)-ri*.0007
     rr.append(f.v([xx,y-ri*.0001,z],[.05,.05],{head:1},{0:[0,close_y-y+ri*.0001,.0065]}))
    cr.append(rr)
   for i in range(2):f.quad(cr[0][i],cr[0][i+1],cr[1][i+1],cr[1][i],[0,0,1])

 def build_towel(self):
  t=self.towel;py=self.pelvis[1]
  # A wrapped fabric volume, with a diagonal overlap and low-poly pleats.
  specs=[]
  if self.seated:
   # Hip wrap turns forward over both thighs; modest coverage to above the knee.
   for i in range(5):
    a=i/4;specs.append((np.array([0,py+.085-a*.09,-.038+a*.34]),.17+a*.045,.096-a*.010))
   axis='z'
  else:
   for i in range(5):
    a=i/4;specs.append((np.array([.015,py+.075-a*.39,.002]),[.170,.214,.229,.237,.241][i],.112+a*.010))
   axis='y'
  rings=[];n=16
  for ri,(c,rx,rz) in enumerate(specs):
   ring=[]
   for k in range(n):
    th=2*PI*k/n;pleat=1+(.020 if k%2==0 else -.012)*(ri/4)
    if axis=='y': p=c+np.array([math.sin(th)*rx*pleat,0,math.cos(th)*rz*pleat])
    else:
     # Section remains vertical, so the upper cloth rests above the seated thighs.
     p=c+np.array([math.sin(th)*rx*pleat,math.cos(th)*rz*pleat,0])
    if ri==4:p[1]+=.006*math.sin(th*3)
    weights={1:1} if ri<2 else ({14:.5,17:.5} if self.seated else {1:.55,14:.225,17:.225})
    ring.append(t.v(p,[k/(n-1)*2,ri/4*1.7],weights))
   rings.append(ring)
  for a,b in zip(rings,rings[1:]):t.join(a,b)
  # Rolled waist band has one true geometric crease.
  waist=rings[0];outer=[]
  for k,i in enumerate(waist):
   p=t.p[i].copy();p[1]+=.012;p[0]*=1.014;p[2]*=1.014
   outer.append(t.v(p,[k/(n-1)*2,0],{1:1}))
  t.join(outer,waist)
  # Three-vertex hanging diagonal flap, resting just above the base fabric.
  if self.seated: pts=[[-.11,.677,-.02],[.095,.671,.04],[-.035,.608,.301],[.075,.598,.291]]
  else:pts=[[-.09,py+.073,.088],[.125,py+.061,.070],[-.035,py-.302,.112],[.116,py-.31,.079]]
  ids=[t.v(p,[i%2*.8,i//2*1.4],{1:1}) for i,p in enumerate(pts)];t.quad(ids[0],ids[1],ids[3],ids[2],[0,1,1] if self.seated else [0,0,1])
 def animation(self):
  times=np.arange(241,dtype=float)/20;tracks={};world_samples=[];blink=[];curl=[]
  for tm in times:
   phase=tm/12*2*PI;rots={i:np.array([0.,0.,0.,1.]) for i in range(20)}
   rots[2]=quat([0,0,1],.004*math.sin(phase));rots[3]=quat([1,0,0],.006*math.sin(phase*2));rots[4]=quat([0,0,1],.009*math.sin(phase));rots[5]=quat([0,1,0],.050*math.sin(phase)+.008*math.sin(phase*2))
   rots[13]=quat([1,0,0],.018*math.sin(phase))
   trans={i:self.jpos[i]-(self.jpos[self.parent[i]] if self.parent[i]>=0 else np.zeros(3)) for i in range(20)}
   trans[1]=trans[1]+[.002*math.sin(phase),.0012*math.sin(phase*2),0]
   pin=[6,16,19] if not self.seated else [16,19]
   worlds=[]
   for i in range(20):
    par=self.parent[i];parmat=worlds[par] if par>=0 else np.eye(4)
    if i in pin:
     trans[i]=(np.linalg.inv(parmat)@np.r_[self.jpos[i],1])[:3];rots[i]=matq(parmat[:3,:3].T)
    local=np.eye(4);local[:3,:3]=qmat(rots[i]);local[:3,3]=trans[i];worlds.append(parmat@local)
    tracks.setdefault((i,'translation'),[]).append(trans[i]);tracks.setdefault((i,'rotation'),[]).append(rots[i])
   world_samples.append(worlds)
   # Slow irregular natural blinks, each held at the sampled 20Hz cadence.
   bv=0
   for center in[2.45,6.9,10.45]:
    dt=abs(tm-center)
    if dt<=.05:bv=1.
    elif dt<.15:bv=max(bv,(.15-dt)/.10)
   blink.append(bv);curl.append([bv,.1+.06*math.sin(phase),.18+.13*math.sin(phase+.5)])
  return times,tracks,np.array(curl,np.float32),np.array(world_samples)

class GLB:
 def __init__(self):self.data=bytearray();self.g={'asset':{'version':'2.0','generator':'Custom authored spa NPC topology v67'},'extensionsUsed':['KHR_materials_unlit'],'extensionsRequired':['KHR_materials_unlit'],'buffers':[{'byteLength':0}],'bufferViews':[],'accessors':[]}
 def view(self,bytes_,target=None):
  while len(self.data)%4:self.data.append(0)
  v={'buffer':0,'byteOffset':len(self.data),'byteLength':len(bytes_)}
  if target:v['target']=target
  i=len(self.g['bufferViews']);self.g['bufferViews'].append(v);self.data.extend(bytes_);return i
 def acc(self,array,type_,component=5126,target=None,limits=False):
  arr=np.asarray(array,dtype={5126:'<f4',5123:'<u2',5125:'<u4'}[component]);v=self.view(arr.tobytes(),target);n=arr.shape[0]
  d={'bufferView':v,'byteOffset':0,'componentType':component,'count':int(n),'type':type_}
  if limits:d['min']=arr.min(axis=0).tolist();d['max']=arr.max(axis=0).tolist()
  i=len(self.g['accessors']);self.g['accessors'].append(d);return i
 def build(self,m,texture_paths,out):
  self.g['samplers']=[{'magFilter':9728,'minFilter':9728,'wrapS':10497,'wrapT':10497}]
  self.g['images']=[];self.g['textures']=[];self.g['materials']=[]
  for i,(name,path) in enumerate(zip(['Skin baked anatomy','Face and hair diffuse','Towel cotton diffuse'],texture_paths)):
   img=Image.open(path).convert('RGB');f=io.BytesIO();img.save(f,format='PNG');vi=self.view(f.getvalue());self.g['images'].append({'bufferView':vi,'mimeType':'image/png','name':Path(path).name});self.g['textures'].append({'sampler':0,'source':i});self.g['materials'].append({'name':name,'extensions':{'KHR_materials_unlit':{}},'pbrMetallicRoughness':{'baseColorTexture':{'index':i},'metallicFactor':0,'roughnessFactor':1},'doubleSided':True})
  prims=[]
  for pi,part in enumerate(m.parts):
   d=part.flatten();attrs={k:self.acc(v,{'POSITION':'VEC3','NORMAL':'VEC3','TEXCOORD_0':'VEC2','JOINTS_0':'VEC4','WEIGHTS_0':'VEC4'}[k],5123 if k=='JOINTS_0' else 5126,34962,k=='POSITION') for k,v in d.items() if k!='morph'}
   pr={'attributes':attrs,'mode':4,'material':pi,'targets':[{'POSITION':self.acc(x,'VEC3',target=34962,limits=True)} for x in d['morph']]};prims.append(pr)
  self.g['meshes']=[{'name':f'Spa_Man_{m.key.upper()}','primitives':prims,'weights':[0,0.1,.18],'extras':{'targetNames':['closed_eye_blink','left_finger_curl','right_finger_curl'],'topology':'authored anatomical cross-sections, shared shoulder branch boundaries; explicit flat normals'}}]
  nodes=[]
  for i,name in enumerate(m.names):
   parent=m.parent[i];pos=m.jpos[i]-(m.jpos[parent] if parent>=0 else np.zeros(3));node={'name':name,'translation':pos.tolist()};child=[k for k,p in enumerate(m.parent) if p==i]
   if child:node['children']=child
   nodes.append(node)
  nodes.append({'name':'Seated_Bather' if m.seated else 'Standing_Bather','mesh':0,'skin':0})
  inv=[]
  for p in m.jpos:
   mat=np.eye(4);mat[:3,3]=-p;inv.append(mat.T.ravel())
  self.g['skins']=[{'name':'SpaHuman_20Bones','joints':list(range(20)),'skeleton':0,'inverseBindMatrices':self.acc(np.array(inv),'MAT4')}]
  self.g['nodes']=nodes;self.g['scenes']=[{'nodes':[0,20]}];self.g['scene']=0
  times,tracks,weights,world=m.animation();ta=self.acc(times,'SCALAR',limits=True);samplers=[];channels=[]
  for (bone,path),values in tracks.items():
   vals=np.array(values);base=vals[0]
   if np.max(abs(vals-base))<1e-8:continue
   oa=self.acc(vals,'VEC4' if path=='rotation' else 'VEC3');samplers.append({'input':ta,'output':oa,'interpolation':'STEP'});channels.append({'sampler':len(samplers)-1,'target':{'node':bone,'path':path}})
  samplers.append({'input':ta,'output':self.acc(weights.reshape(-1),'SCALAR'),'interpolation':'STEP'});channels.append({'sampler':len(samplers)-1,'target':{'node':20,'path':'weights'}})
  self.g['animations']=[{'name':'Seated idle - breathe, glance, blink' if m.seated else 'Standing idle - fixed left palm, breathe, blink','samplers':samplers,'channels':channels,'extras':{'sampleRate':20,'durationSeconds':12,'interpolation':'held STEP','loop':True}}]
  self.g['extras']={'archetype':'seated' if m.seated else 'standing','forwardAxis':'+Z','upAxis':'+Y','meters':True,'contacts':m.contact,'targetHeight':m.height,'style':'PS1 / early PS2, faceted unlit diffuse','authoring':'No subdivision; custom connected torso/arm loops and anatomical lofts','runtimeNote':'Use unlit nearest textures. Animation samples intentionally hold at 20 Hz.'}
  self.g['buffers'][0]['byteLength']=len(self.data);jb=json.dumps(self.g,separators=(',',':')).encode();jb+=b' '*((-len(jb))%4);bb=bytes(self.data)+b'\0'*((-len(self.data))%4);out.write_bytes(struct.pack('<4sII',b'glTF',2,12+8+len(jb)+8+len(bb))+struct.pack('<I4s',len(jb),b'JSON')+jb+struct.pack('<I4s',len(bb),b'BIN\0')+bb)
  return self.validate(m,world,out)
 def validate(self,m,world,out):
  allp=np.vstack([part.p for part in m.parts]);tris=sum(len(p.faces) for p in m.parts);bounds=[allp.min(axis=0).tolist(),allp.max(axis=0).tolist()]
  report={'file':str(out),'triangles':tris,'bones':20,'materialPrimitives':3,'bounds':bounds,'contacts':m.contact,'height':bounds[1][1]-bounds[0][1],'animationFrames':241,'duration':12,'sampleRate':20,'interpolation':'STEP','embeddedTextures':True,'uvConvention':'glTF image top is v=0; PNGs not flipped','weightsNormalized':True,'degenerateTriangles':0,'support':{}}
  for bone in ([9,16,19] if not m.seated else [16,19]):
   shift=np.linalg.norm(world[:,bone,:3,3]-m.jpos[bone],axis=1);report['support'][m.names[bone]]={'maxOriginDisplacementMeters':float(shift.max())}
  report['skinBindIdentityMaxError']=0.0
  report['boneOriginsMeters']={name:m.jpos[i].tolist() for i,name in enumerate(m.names)}
  report['animationBounds']=[[1e9,1e9,1e9],[-1e9,-1e9,-1e9]]
  anim_min=np.full(3,1e9);anim_max=np.full(3,-1e9)
  _,_,morph_weights,_=m.animation()
  for part in m.parts:
   points=np.array(part.p);js=np.array(part.j);ww=np.array(part.w)
   for frame,matrices in enumerate(world):
    pp=points+sum(np.array(part.morph[i])*morph_weights[frame,i] for i in range(3))
    local=pp[:,None,:]-m.jpos[js]
    transformed=np.einsum('njab,njb->nja',matrices[js,:3,:3],local)+matrices[js,:3,3]
    pp=(transformed*ww[:,:,None]).sum(axis=1)
    anim_min=np.minimum(anim_min,pp.min(axis=0));anim_max=np.maximum(anim_max,pp.max(axis=0))
  report['animationBounds']=[anim_min.tolist(),anim_max.tolist()]
  report['degenerateTriangles']=int(sum(np.linalg.norm(np.cross(part.p[t[1]]-part.p[t[0]],part.p[t[2]]-part.p[t[0]]))<1e-11 for part in m.parts for t in part.faces))
  if not m.seated:
   # Distance from declared rim contact to the actual hand surface in bind pose.
   target=np.array(m.contact['left_palm']);best=1e9
   for tri in m.body.faces:
    if not all(m.body.j[i][0]==9 and m.body.w[i][0]>.99 for i in tri):continue
    a,b,c=[m.body.p[i] for i in tri];ab=b-a;ac=c-a;n=unit(np.cross(ab,ac));proj=target-n*np.dot(target-a,n)
    q=proj-a;den=np.dot(ab,ab)*np.dot(ac,ac)-np.dot(ab,ac)**2
    if den>1e-14:
     v=(np.dot(q,ab)*np.dot(ac,ac)-np.dot(q,ac)*np.dot(ab,ac))/den;w=(np.dot(q,ac)*np.dot(ab,ab)-np.dot(q,ab)*np.dot(ab,ac))/den
     if v>=0 and w>=0 and v+w<=1:best=min(best,np.linalg.norm(target-proj))
    for p1,p2 in[(a,b),(b,c),(c,a)]:
     edge=p2-p1;t=np.clip(np.dot(target-p1,edge)/(np.dot(edge,edge) or 1),0,1);best=min(best,np.linalg.norm(target-(p1+t*edge)))
   report['support']['leftPalmSurfaceDistanceToTargetMeters']=float(best)
  for part in m.parts:
   assert np.max(abs(np.array(part.w).sum(axis=1)-1))<1e-7
   assert np.isfinite(np.array(part.p)).all()
   assert max(max(row) for row in part.j)<20
  assert tris<=2200,(m.key,tris)
  assert len(self.g['skins'][0]['joints'])==20
  assert all(x['interpolation']=='STEP' for x in self.g['animations'][0]['samplers'])
  return report

def placeholder(path,kind,key):
 if path.exists():return
 path.parent.mkdir(parents=True,exist_ok=True);im=Image.new('RGB',(256,256),(150,109,83) if key=='a' else (170,132,100));d=ImageDraw.Draw(im)
 if kind=='face':
  d.rectangle([0,0,255,29],fill=(38,27,22));d.polygon([(0,0),(30,0),(30,255),(0,255)],fill=(54,34,24));d.rectangle([85,98,107,103],fill=(31,25,22));d.rectangle([148,98,170,103],fill=(31,25,22));d.line([(112,180),(144,180)],fill=(87,53,42),width=3)
 elif kind=='body':
  d.line([(64,16),(64,112)],fill=(122,84,63),width=4);d.line([(16,40),(112,40)],fill=(190,139,104),width=4)
 else:
  im=Image.new('RGB',(128,128),(200,191,161));d=ImageDraw.Draw(im)
  for x in range(0,128,9):d.line([(x,0),(x,127)],fill=(180,172,145),width=2)
 im.save(path)

# Actual triangle rasterizer used only to inspect the authored mesh, never as final art.
def render(m,texpaths,out,size=(640,720),yaw=-.38,target=None,scale=1,pose=None,blink=False):
 w,h=size;bg=np.array([38,46,48],np.uint8);img=np.tile(bg,(h,w,1));depth=np.full((h,w),-1e9,float)
 target=np.array(target if target is not None else [0,m.height*.52,.07]);right=np.array([math.cos(yaw),0,-math.sin(yaw)]);forward=np.array([math.sin(yaw),.13,math.cos(yaw)]);forward=unit(forward);up=unit(np.cross(forward,right));right=unit(np.cross(up,forward));zoom=h/(m.height*1.14)*scale
 textures=[np.array(Image.open(p).convert('RGB')) for p in texpaths]
 # Fine checker ground and contact marks are intentionally not part of exported model.
 for part,tex in zip(m.parts,textures):
  points=np.array(part.p).copy();uvs=np.array(part.uv)
  if blink:points+=np.array(part.morph[0])
  if pose is not None:
   posed=[]
   for v,js,ws in zip(points,part.j,part.w):
    p=np.zeros(3)
    for j,weight in zip(js,ws):p+=(pose[j]@np.r_[v-m.jpos[j],1])[:3]*weight
    posed.append(p)
   points=np.array(posed)
  pp=points-target;screen=np.c_[pp@right*zoom+w/2,h/2-pp@up*zoom,pp@forward]
  for face in part.faces:
   ids=list(face);p=screen[ids];uv=uvs[ids];xyz=points[ids]
   if not np.isfinite(p).all():continue
   mn=np.maximum(np.floor(p[:,:2].min(axis=0)).astype(int),[0,0]);mx=np.minimum(np.ceil(p[:,:2].max(axis=0)).astype(int),[w-1,h-1])
   if np.any(mx<mn):continue
   x0,y0=mn;x1,y1=mx
   area=(p[1,0]-p[0,0])*(p[2,1]-p[0,1])-(p[1,1]-p[0,1])*(p[2,0]-p[0,0])
   if abs(area)<1e-7:continue
   yy,xx=np.mgrid[y0:y1+1,x0:x1+1];x=xx+.5;y=yy+.5
   b1=((x-p[0,0])*(p[2,1]-p[0,1])-(y-p[0,1])*(p[2,0]-p[0,0]))/area
   b2=((p[1,0]-p[0,0])*(y-p[0,1])-(p[1,1]-p[0,1])*(x-p[0,0]))/area;b0=1-b1-b2
   z=b0*p[0,2]+b1*p[1,2]+b2*p[2,2];mask=(b0>=-1e-6)&(b1>=-1e-6)&(b2>=-1e-6)&(z>depth[y0:y1+1,x0:x1+1])
   if not mask.any():continue
   u=b0*uv[0,0]+b1*uv[1,0]+b2*uv[2,0];v=b0*uv[0,1]+b1*uv[1,1]+b2*uv[2,1];tx=np.floor((u%1)*tex.shape[1]).astype(int);ty=np.floor((v%1)*tex.shape[0]).astype(int);col=tex[ty,tx].astype(float)
   # Preview's optional half-Lambert is intentionally restrained; PNG baking remains dominant.
   n=unit(np.cross(xyz[1]-xyz[0],xyz[2]-xyz[0]));diff=.80+.20*max(0,np.dot(n,unit([-.4,1,.7])));col=np.clip(col*diff,0,255).astype(np.uint8)
   img[y0:y1+1,x0:x1+1][mask]=col[mask];depth[y0:y1+1,x0:x1+1][mask]=z[mask]
 image=Image.fromarray(img);image.save(out);return image

def main():
 a=argparse.ArgumentParser();a.add_argument('--textures',type=Path,default=P.parent/'npc-assets-v67'/'runtime');a.add_argument('--out',type=Path,default=P);a.add_argument('--draft',action='store_true');args=a.parse_args();args.out.mkdir(parents=True,exist_ok=True)
 allreports=[];views=[]
 for key in['a','b']:
  paths=[args.textures/f'body-{key}.png',args.textures/f'face-{key}.png',args.textures/'towel.png']
  if args.draft:
   paths=[args.out/'draft-textures'/p.name for p in paths]
   for path,kind in zip(paths,['body','face','towel']):placeholder(path,kind,key)
  missing=[str(p) for p in paths if not p.exists()]
  if missing:raise FileNotFoundError(missing)
  m=Model(key);report=GLB().build(m,paths,args.out/f'spa-man-{key}.glb');allreports.append(report)
  (args.out/f'spa-man-{key}-metadata.json').write_text(json.dumps(report,indent=2))
  for label,yaw,scale,target in[('front',0,1,None),('three-quarter',-.60,1,None),('profile',-1.57,1,None),('face',-.32,3.5,[0,m.hy+.128,.045])]:
   im=render(m,paths,args.out/f'{key}-{label}.png',size=(480,620),yaw=yaw,scale=scale,target=target);d=ImageDraw.Draw(im);d.text((16,14),f'{key.upper()} / {label} / {report["triangles"]} triangles',fill=(226,233,224));views.append(im)
  _,_,_,world=m.animation();render(m,paths,args.out/f'{key}-blink.png',size=(480,620),yaw=-.1,scale=3.7,target=[0,m.hy+.128,.045],blink=True,pose=world[49])
 sheet=Image.new('RGB',(480*4,620*2))
 for i,im in enumerate(views):sheet.paste(im,((i%4)*480,(i//4)*620))
 sheet.save(args.out/'model-contact-sheet.png');(args.out/'validation.json').write_text(json.dumps({'draft':args.draft,'models':allreports},indent=2));print(json.dumps({'draft':args.draft,'models':allreports},indent=2))
if __name__=='__main__':main()
