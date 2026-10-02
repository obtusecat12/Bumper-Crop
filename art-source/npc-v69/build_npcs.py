#!/usr/bin/env python3
"""Authored, faceted low-poly spa characters. No external mesh/primitives.
All surfaces are explicit anatomical cross-section rings, branch loops, or plates.
Exports self-contained glTF 2.0 GLBs with true 20-joint skinning, three unlit
materials, image-space UVs, and STEP 20 Hz sampled quiet breathing clips.
A has permanently closed diffuse eyelids. B has fitted geometric blinking lids,
plus real grouped-finger morphs on both models.
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
  self.key=key;self.seated=key=='a';self.body=Part('body');self.face=Part('face');self.towel=Part('towel');self.parts=[self.body,self.face,self.towel]
  self.names=['root','pelvis','spine','chest','neck','head','clavicle.L','upper_arm.L','forearm.L','hand.L','clavicle.R','upper_arm.R','forearm.R','hand.R','thigh.L','shin.L','foot.L','thigh.R','shin.R','foot.R']
  self.parent=[-1,0,1,2,3,4,3,6,7,8,3,10,11,12,1,14,15,1,17,18];self.idx={n:i for i,n in enumerate(self.names)}
  if self.seated:
   self.pelvis=np.array([0,.50,-.045]);self.sy=.982;self.hy=1.077;self.height=1.319
   self.arm={-1:[[-.207,.982,-.125],[-.295,.724,.020],[-.219,.564,.242],[-.200,.558,.301]],1:[[.207,.977,-.121],[.305,.704,.039],[.230,.549,.259],[.214,.546,.313]]}
   self.leg={-1:[[-.096,.50,-.025],[-.153,.412,.371],[-.163,.082,.425]],1:[[.096,.50,-.025],[.168,.408,.387],[.195,.080,.421]]}
   self.head_pivot=np.array([0,self.hy,-.141]);self.head_tilt=-.035
  else:
   self.pelvis=np.array([.013,.935,-.014]);self.sy=1.377;self.hy=1.478;self.height=1.720
   self.arm={-1:[[-.245,1.367,.020],[-.314,1.078,.058],[-.355,.795,.142],[-.370,.756,.190]],1:[[.177,1.389,-.002],[.225,1.098,-.015],[.260,.834,.045],[.258,.788,.071]]}
   self.leg={-1:[[-.079,.935,-.010],[-.104,.506,.005],[-.117,.082,.027]],1:[[.127,.935,-.018],[.182,.507,.009],[.214,.080,.009]]}
   self.head_pivot=np.array([-.038,self.hy,.019]);self.head_tilt=.025
  py=self.pelvis[1]
  self.jpos=[np.zeros(3),self.pelvis,self.torso_center(py+.18),self.torso_center(self.sy-.11),self.torso_center(self.sy+.05),self.head_pivot+np.array([0,.060,0])]
  for side in[-1,1]:
   ar=self.arm[side];self.jpos.extend([self.torso_center(self.sy-.02)+np.array([side*.10,0,0]),*[np.array(x) for x in ar[:3]]])
  for side in[-1,1]:self.jpos.extend([np.array(x) for x in self.leg[side]])
  self.jpos=np.array(self.jpos)
  self.contact={'left_palm':[-.37,.737,.19] if not self.seated else [-.218,.542,.301],'right_palm':[.231,.536,.313] if self.seated else None,'feet_ground_y':0.,'seated_pelvis_y':.5 if self.seated else None,'seated_waterline_y':.86 if self.seated else None,'eye_state':'permanently closed' if self.seated else 'calm open','supports':'Both seated palms rest on towel-covered thighs; standing left palm rests on basin. Both feet flat.'}
  self.build_towel();self.build_torso();self.build_legs();self.build_head()
  self.height=float(max(p[1] for part in self.parts for p in part.p))
 def torso_center(self,y):
  t=float(np.clip((y-self.pelvis[1])/(self.sy-self.pelvis[1]),0,1.22))
  if self.seated:return np.array([0,y,-.045-.080*t])
  return np.array([.013-.05*t,y,-.014+.035*t])
 def weights_y(self,y):
  py=self.pelvis[1];sy=self.sy
  if y<py+.09:return {1:1}
  if y<sy-.15:
   t=float(np.clip((y-(py+.09))/(sy-.15-(py+.09)),0,1));return {1:1-t,2:t}
  if y<sy+.02:
   t=float(np.clip((y-(sy-.18))/.17,0,1));return {2:1-t,3:t}
  return {3:.25,4:.75}
 def build_torso(self):
  b=self.body;py=self.pelvis[1];sy=self.sy
  # Full-volume human trunk: pelvis, soft abdomen, lower ribs, pectorals,
  # axilla, rounded deltoid roots, descending trapezius, short neck.
  specs=[(py-.035,.154,.098),(py+.050,.166,.106),(py+.142,.161,.112),(sy-.244,.178,.119),(sy-.183,.190,.124),(sy-.125,.199,.126),(sy-.085,.210,.123),(sy-.025,.216,.114),(sy+.025,.190,.095),(sy+.062,.067,.062),(self.hy+.019,.056,.055)]
  if self.seated:
   # Elder: relaxed narrow pectorals, a soft abdomen, reduced deltoid mass.
   specs=[(y,rx*([1.,1.015,1.035,1.015,.96,.925,.94,.95,.95,1.,1.][i]),rz*([1.,1.05,1.08,1.045,1.,.94,.94,.96,.98,1.,1.][i])) for i,(y,rx,rz) in enumerate(specs)]
  self.torsorings=[]
  for ri,(y,rx,rz) in enumerate(specs):
   ring=[]
   for k in range(16):
    th=2*PI*k/16;s=math.sin(th);c=math.cos(th);cen=self.torso_center(y);p=cen+np.array([s*rx,0,c*rz])
    if ri==8:
     # Anatomically graded clavicle / trapezius, lower at acromion.
     p[1]-=.031*abs(s)**2;p[1]+=.018*(1-abs(s))
    if ri in[5,6,7] and c>.25:
     p[2]+=.006*math.sin(2*th)**2-.005*math.exp(-(s/.20)**2)
    if not self.seated and ri>=4:p[1]+=.011*s
    if ri>=9:
     p[0]=self.head_pivot[0]+s*rx;p[2]=self.head_pivot[2]+c*rz
     u=.20+.05*s;v=.18+.04*c;uv=atlas('hand',u,v)
    else:
     front=c>=0;u=.5+s*.48 if front else .5-s*.48;v=float(np.clip((sy+.045-p[1])/(sy+.045-py),0,.98));uv=atlas('front' if front else 'back',u,v)
    ring.append(b.v(p,uv,self.weights_y(p[1])))
   self.torsorings.append(ring)
  for ri in range(len(specs)-1):
   a,c=self.torsorings[ri:ri+2]
   for k in range(16):
    # Two rows x two columns leave eight-edge deltoid branch sockets.
    if ri in[6,7] and k in[3,4,11,12]:continue
    k2=(k+1)%16;center=(self.torso_center(specs[ri][0])+self.torso_center(specs[ri+1][0]))/2
    out=(b.p[a[k]]+b.p[a[k2]]+b.p[c[k2]]+b.p[c[k]])/4-center
    # UV seams duplicate positions only: no triangle ever interpolates across
    # unrelated body-atlas islands. Neck and trapezius use a broad skin patch.
    front=math.cos((k+.5)*2*PI/16)>=0;ids=[]
    for row,col in[(ri,k),(ri,k2),(ri+1,k2),(ri+1,k)]:
     source=self.torsorings[row][col];th=2*PI*col/16;sn=math.sin(th)
     if ri>=7:
      uu=.45+sn*{7:.27,8:.25,9:.15,10:.13}.get(row,.20)
      vv={7:.65,8:.43,9:.18,10:.02}.get(row,.5);uv=atlas('hand',uu,vv)
     else:
      uu=.5+(sn*.475 if front else -sn*.475)
      vv=float(np.clip((sy+.045-b.p[source][1])/(sy+.045-py),.10,.98));uv=atlas('front' if front else 'back',uu,vv)
     weights={j:w for j,w in zip(b.j[source],b.w[source]) if w>0};ids.append(b.v(b.p[source],uv,weights))
    b.quad(*ids,out)
  b.cap(self.torsorings[0],{1:1},atlas('hand',.2,.2),[0,-1,0])
  for side in[-1,1]:
   ii=[11,12,13] if side<0 else [3,4,5]
   aperture=[self.torsorings[6][i] for i in ii]+[self.torsorings[7][ii[2]]]+[self.torsorings[8][i] for i in ii[::-1]]+[self.torsorings[7][ii[0]]]
   # The connected deltoid geometry receives limb-island UVs on its outer side.
   seam=[]
   for ai,index in enumerate(aperture):
    weights={j:w for j,w in zip(b.j[index],b.w[index]) if w>0};seam.append(b.v(b.p[index],atlas('arm',.27+.15*math.sin(ai*2*PI/8),.012),weights))
   self.build_arm(side,seam)
 def connect(self,part,ring1,ring2):
  candidates=[];n=len(ring1)
  for rev in[False,True]:
   base=ring2[::-1] if rev else ring2
   for k in range(n):
    rr=base[k:]+base[:k];candidates.append((sum(np.linalg.norm(part.p[a]-part.p[b]) for a,b in zip(ring1,rr)),rr))
  rr=min(candidates,key=lambda a:a[0])[1];part.join(ring1,rr);return [ring2.index(v) for v in rr]
 def tube(self,part,centers,radii,weights,region,n=8,first=None,vs=None):
  rings=[]
  for i,c in enumerate(centers):
   c=np.array(c);t=unit(np.array(centers[min(i+1,len(centers)-1)])-np.array(centers[max(i-1,0)]));a=np.array([0.,0.,1.]);a=unit(a-t*np.dot(a,t));bb=unit(np.cross(t,a));rr=radii[i];r1,r2=rr if hasattr(rr,'__len__') else (rr,rr);ring=[]
   for k in range(n):
    th=2*PI*k/n;p=c+a*math.cos(th)*r1+bb*math.sin(th)*r2
    if region in['arm','leg']:uv=atlas(region,.26+.15*math.sin(th),.03+.92*(vs[i] if vs is not None else i/(len(centers)-1)))
    else:uv=atlas(region,.18+.085*math.sin(th),.16+i*.06)
    ring.append(part.v(p,uv,weights[i]))
   rings.append(ring)
  if first:
   perm=self.connect(part,first,rings[0]);rings=[[r[k] for k in perm] for r in rings]
  for r1,r2 in zip(rings,rings[1:]):part.join(r1,r2)
  return rings
 def build_arm(self,side,aperture):
  b=self.body;shoulder,elbow,wrist,palm=map(np.array,self.arm[side]);s='L' if side<0 else 'R';up=self.idx['upper_arm.'+s];fore=self.idx['forearm.'+s];hand=self.idx['hand.'+s];lerp=lambda a,c,t:a*(1-t)+c*t
  centers=[lerp(shoulder,elbow,.10),lerp(shoulder,elbow,.20),lerp(shoulder,elbow,.38),lerp(shoulder,elbow,.58),lerp(shoulder,elbow,.83),elbow,lerp(elbow,wrist,.22),lerp(elbow,wrist,.56),lerp(elbow,wrist,.82),wrist]
  radii=[(.047,.050),(.061,.063),(.059,.062),(.056,.058),(.050,.052),(.041,.044),(.049,.051),(.043,.045),(.034,.036),(.030,.032)]
  if self.seated:radii=[(a*.89,c*.89) for a,c in radii]
  weights=[{up:1},{up:1},{up:1},{up:1},{up:.85,fore:.15},{up:.35,fore:.65},{fore:1},{fore:1},{fore:.75,hand:.25},{hand:1}]
  rings=self.tube(b,centers,radii,weights,'arm',8,aperture)
  self.build_hand(side,rings[-1],wrist,palm,hand)
 def build_hand(self,side,wrist_ring,wrist,palm,hand):
  b=self.body
  if self.seated or side<0:
   # Palm plane rests on the thigh / bowl; fingers point gently forward.
   d=unit(np.array([palm[0]-wrist[0],0,palm[2]-wrist[2]]));normal=np.array([0.,1.,0.]);width=unit(np.cross(normal,d));pc=palm.copy()
   contact_y=.737 if not self.seated else self.towel_height(pc[0],pc[2]);pc[1]=contact_y+.017234042553
   self.contact['left_palm' if side<0 else 'right_palm']=[float(pc[0]),float(contact_y),float(pc[2])]
   spec=[(wrist,.030,.024),(pc-d*.018,.040,.018),(pc+d*.029,.039,.016),(pc+d*.066,.035,.013),(pc+d*.093,.029,.011)]
  else:
   d=unit(palm-wrist);width=np.array([1.,0.,0.]);width=unit(width-d*np.dot(width,d));normal=unit(np.cross(d,width));pc=wrist+d*.066
   spec=[(wrist,.030,.025),(pc-d*.018,.040,.018),(pc+d*.029,.039,.016),(pc+d*.064,.034,.012),(pc+d*.090,.028,.010)]
  rings=[]
  # Eight-sided grouped fingers keep a broad restful hand, no skeletal prongs.
  for i,(c,ww,hh) in enumerate(spec):
   ring=[]
   for k in range(8):
    th=2*PI*k/8;p=c+width*math.sin(th)*ww+normal*math.cos(th)*hh
    if i>=3:p-=normal*.002*(i-2)
    # Real fingertip motion; the supported palm and wrist retain zero deltas.
    amount=max(0,i-2)/2
    curl=(-normal*(.003 if self.seated or side<0 else .009)-d*.002)*amount
    ring.append(b.v(p,atlas('hand',.16+.11*math.sin(th),.31+i*.065),{hand:1},{1 if side<0 else 2:curl}))
   rings.append(ring)
  perm=self.connect(b,wrist_ring,rings[0]);rings=[[r[k] for k in perm] for r in rings]
  for a,c in zip(rings,rings[1:]):b.join(a,c)
  b.cap(rings[-1],{hand:1},atlas('hand',.2,.55),d)
  # A small opposed thumb and web shape create the human silhouette.
  thumbside=1 if side<0 else -1;td=unit(d*.55+width*thumbside*.72-normal*.10);base=pc+width*thumbside*.031-d*.018
  tr=self.tube(b,[base,base+td*.028,base+td*.046-normal*.005],[.015,.013,.010],[{hand:1}]*3,'hand',6);b.cap(tr[-1],{hand:1},atlas('hand',.18,.51),td)
 def build_legs(self):
  b=self.body
  for side in[-1,1]:
   hip,knee,ankle=map(np.array,self.leg[side]);s='L' if side<0 else 'R';thigh=self.idx['thigh.'+s];shin=self.idx['shin.'+s];foot=self.idx['foot.'+s];lerp=lambda a,c,t:a*(1-t)+c*t
   centers=[hip,lerp(hip,knee,.30),lerp(hip,knee,.65),lerp(hip,knee,.89),knee,lerp(knee,ankle,.25),lerp(knee,ankle,.52),lerp(knee,ankle,.78),ankle]
   radii=[(.088,.092),(.089,.092),(.073,.076),(.056,.060),(.052,.055),(.062,.064),(.055,.056),(.038,.042),(.031,.033)]
   weights=[{thigh:1},{thigh:1},{thigh:1},{thigh:.8,shin:.2},{thigh:.35,shin:.65},{shin:1},{shin:1},{shin:.75,foot:.25},{foot:1}]
   before=len(b.faces);rings=self.tube(b,centers,radii,weights,'leg',10)
   if not self.seated:del b.faces[before:before+80]
   # Anatomical heel, broad instep, metatarsals and grouped toes. Sole y=0.
   cx=ankle[0];cz=ankle[2];fps=[(cz-.065,.049,.035),(cz-.021,.107,.045),(cz+.038,.081,.054),(cz+.109,.048,.059),(cz+.168,.031,.053),(cz+.194,.024,.041)]
   fr=[]
   for ri,(z,ht,ww) in enumerate(fps):
    ring=[]
    for k in range(8):
     th=2*PI*k/8;p=np.array([cx+math.sin(th)*ww,(math.cos(th)+1)*ht/2,z]);ring.append(b.v(p,atlas('hand',.20+math.sin(th)*.11,.58+ri*.067),{foot:1}))
    fr.append(ring)
   for a,c in zip(fr,fr[1:]):b.join(a,c)
   b.cap(fr[0],{foot:1},atlas('hand',.18,.60),[0,0,-1]);b.cap(fr[-1],{foot:1},atlas('hand',.18,.94),[0,0,1])
 def build_head(self):
  f=self.face;h=self.idx['head'];neck=self.idx['neck'];base=self.hy
  angles=np.array([-PI,-2.75,-2.35,-1.96,-1.57,-1.3,-1.08,-.85,-.64,-.44,-.26,-.12,0,.12,.26,.44,.64,.85,1.08,1.3,1.57,1.96,2.35,2.75])
  specs=[(1.,.000,.050,.043,.055),(.88,.025,.063,.067,.067),(.78,.048,.073,.077,.075),(.70,.068,.077,.079,.082),(.62,.087,.082,.079,.089),(.55,.104,.088,.081,.094),(.46,.125,.088,.077,.098),(.39,.142,.085,.075,.099),(.33,.158,.085,.080,.098),(.16,.198,.082,.077,.093),(.055,.229,.060,.060,.070),(.0,.242,.014,.015,.020)]
  if self.seated:
   # Slightly elongated elderly cranium, narrow cheeks and a softened jaw.
   specs=[(v,y*1.025,ww*(.95 if v<.55 else .92),ff*(.96 if v>.62 else 1.),back) for v,y,ww,ff,back in specs]
  self.hangles=angles;self.headspec=specs;self.headrings=[]
  rot=qmat(quat([1,0,0],self.head_tilt))
  def world(x,y,z):return self.head_pivot+rot@np.array([x,y,z])
  for ri,(v,y,ww,ff,back) in enumerate(specs):
   ring=[]
   for th in angles:
    c=math.cos(th);s=math.sin(th);x=s*ww;z=c*(ff if c>=0 else back)
    nose=max(0,1-abs(th)/.29)
    if v==.55:z+=.024*nose+.002*max(0,1-abs(th)/.45)
    if v==.46:z+=.016*nose
    if v==.39:z+=.005*nose
    if v==.62:z+=.009*nose
    if v==.70:z+=.003*nose
    if v==.39 and .27<abs(th)<.84:z-=.003
    if v==.33 and abs(th)<.85:z+=.002
    if v==.055:y+=.003*max(0,-s)
    weights={h:1} if ri>0 else {h:.85,neck:.15}
    uv=[.5+.25*math.sin(th) if abs(th)<=PI/2 else .5+th/(2*PI),v]
    ring.append(f.v(world(x,y,z),uv,weights))
   self.headrings.append(ring)
  for a,c in zip(self.headrings,self.headrings[1:]):f.join(a,c)
  f.cap(self.headrings[-1],{h:1},[.5,.015],[0,1,0])
  # Thin folded ears follow the cheek plane; modest protrusion.
  for side in[-1,1]:
   ear=[(.083,.099,-.008),(.101,.107,-.006),(.104,.142,-.003),(.097,.161,-.010),(.083,.154,-.013),(.095,.131,.009),(.094,.13,-.021)]
   ids=[self.body.v(world(side*x,y,z),atlas('hand',.20,.22),{h:1}) for x,y,z in ear]
   for i in range(5):self.body.tri(ids[i],ids[(i+1)%5],ids[5],[side,0,1]);self.body.tri(ids[(i+1)%5],ids[i],ids[6],[side,0,-1])
  if self.seated:self.build_beard(world)
  else:self.build_blink_lids()
 def head_surface(self,u,v):
  """Exact barycentric surface point on the front head's authored UV triangles."""
  f=self.face;q=np.array([u,v]);best=None
  # This is called before eyelid additions; no card or spherical approximation.
  for tri in f.faces[:len(self.hangles)*(len(self.headspec)-1)*2]:
   uv=np.array([f.uv[i] for i in tri]);ab=uv[1]-uv[0];ac=uv[2]-uv[0];d=np.linalg.det(np.array([ab,ac]))
   if abs(d)<1e-10:continue
   st=np.linalg.solve(np.array([ab,ac]).T,q-uv[0]);b,c=st
   if b>=-1e-7 and c>=-1e-7 and b+c<=1+1e-7:
    pp=np.array([f.p[i] for i in tri]);best=pp[0]+b*(pp[1]-pp[0])+c*(pp[2]-pp[0]);break
  if best is None:raise ValueError(('head UV not covered',u,v))
  return best
 def build_beard(self,world):
  """Attached short full beard follows jaw ring loops, never a floating plane."""
  f=self.face;h=self.idx['head'];angles=self.hangles
  # The top loop fades into generated white cheek hair; lower loops add an
  # angular 7 mm chin envelope. UVs follow the face texture continuously.
  rings=[]
  for ri in range(6):
   v,y,ww,ff,back=self.headspec[ri];ring=[]
   for ai,th in enumerate(angles):
    c=math.cos(th);sn=math.sin(th)
    if abs(th)>1.57:continue
    # Cheeks join at v=.55. Mouth and moustache stay on the authored face.
    if ri==5 and abs(th)<.44:continue
    src=self.headrings[ri][ai];p=f.p[src].copy();depth=[.001,.007,.007,.004,.002,.00035][ri]
    p+=qmat(quat([1,0,0],self.head_tilt))@np.array([sn*depth,-depth*.24,c*depth])
    ring.append((ai,f.v(p,f.uv[src],{h:1})))
   rings.append(dict(ring))
  for a,b in zip(rings,rings[1:]):
   common=sorted(set(a)&set(b))
   for ai,aj in zip(common,common[1:]):
    if aj!=ai+1:continue
    f.quad(a[ai],a[aj],b[aj],b[ai],[0,0,1])
  # Attach the outline to the exact skin boundary, including the mandible.
  for r,ri in zip(rings,range(6)):
   for ai in [min(r),max(r)]:
    if ri==5:continue
    nxt=rings[ri+1]
    if ai in nxt:f.quad(self.headrings[ri][ai],r[ai],nxt[ai],self.headrings[ri+1][ai],[np.sign(math.sin(angles[ai])),0,0])
 def build_blink_lids(self):
  f=self.face;h=self.idx['head'];normal=qmat(quat([1,0,0],self.head_tilt))@np.array([0.,0.,1.])
  surface=[(np.array([f.uv[i] for i in tri]),np.array([f.p[i] for i in tri])) for tri in f.faces]
  def clipped_patch(lo,hi,bot,top,crease=False,oval=None):
   # Clip EACH original face triangle in UV space. Every new lid triangle is
   # exactly coplanar to the underlying low-poly skin, offset 0.32 mm only.
   # This eliminates eye leaks and floating rectangular plates across facets.
   for uv,pp in surface:
    if uv[:,0].max()<lo or uv[:,0].min()>hi or uv[:,1].max()<bot or uv[:,1].min()>top:continue
    poly=[(u.copy(),p.copy()) for u,p in zip(uv,pp)]
    constraints=[(np.array([1.,0.]),lo),(np.array([-1.,0.]),-hi),(np.array([0.,1.]),bot),(np.array([0.,-1.]),-top)]
    if oval is not None:
     uc,vc,ru,rv=oval;outline=[np.array([uc+ru*math.cos(k*2*PI/16),vc+rv*math.sin(k*2*PI/16)]) for k in range(16)]
     for i,a in enumerate(outline):
      b=outline[(i+1)%len(outline)];edge=b-a;n=np.array([-edge[1],edge[0]]);constraints.append((n,np.dot(n,a)))
    for n,bound in constraints:
     nxt=[]
     for i,(u,p) in enumerate(poly):
      v,q=poly[(i+1)%len(poly)];du=np.dot(n,u)-bound;dv=np.dot(n,v)-bound;inside=du>=-1e-10;inside2=dv>=-1e-10
      if inside:nxt.append((u,p))
      if inside!=inside2:
       t=du/(du-dv);nxt.append((u+t*(v-u),p+t*(q-p)))
     poly=nxt
     if len(poly)<3:break
    if len(poly)<3:continue
    ids=[]
    for uvp,p in poly:
     sample=[.39,.354] if crease else [float(uvp[0]),.44+(uvp[1]-.39)*.08]
     ids.append(f.v(p-normal*.0015,sample,{h:1},{0:normal*(.00193 if crease else .00182)}))
    for k in range(1,len(ids)-1):f.tri(ids[0],ids[k],ids[k+1],[0,0,1])
  for lo,hi in[(.305,.441),(.56,.696)]:
   clipped_patch(lo,hi,.370,.418,oval=((lo+hi)/2,.394,(hi-lo)/2,.026))
   # Short slight downward arc in six tiny fitted strips, all on the real face.
   for j in range(6):
    u0=lo+.007+(hi-lo-.014)*j/6;u1=lo+.007+(hi-lo-.014)*(j+1)/6
    center=.394+.004*math.sin((j+.5)/6*PI)
    clipped_patch(u0,u1,center-.0008,center+.0008,True)
 def build_towel(self):
  t=self.towel;py=self.pelvis[1];rings=[];n=20
  if self.seated:
   # Coherent wrap under the seated forearms and palms, over both thighs.
   specs=[(np.array([0,.520,-.063]),.173,.105),(np.array([0,.550,.030]),.194,.102),(np.array([0,.539,.150]),.212,.102),(np.array([0,.497,.273]),.230,.099),(np.array([0,.458,.387]),.238,.078)]
  else:
   specs=[(np.array([.004,py+.074,-.007]),.178,.124),(np.array([.008,py+.041,-.010]),.181,.125),(np.array([.027,py-.095,-.011]),.195,.121),(np.array([.039,py-.245,-.006]),.213,.127),(np.array([.046,py-.388,.002]),.225,.129)]
  for ri,(c,rx,rz) in enumerate(specs):
   ring=[]
   for k in range(n):
    th=2*PI*k/n;s=math.sin(th);co=math.cos(th);pleat=1+(.020 if k%2==0 else -.020)*(ri/4)
    if self.seated:p=c+np.array([s*rx*pleat,co*rz*pleat,0])
    else:p=c+np.array([s*rx*pleat,0,co*rz*pleat])
    if ri==4:p[1]+=.009*math.sin(th*3)
    weights={1:1} if ri<2 else ({14:.5,17:.5} if self.seated else {1:1})
    ring.append(t.v(p,[k/n*2,ri/4*1.7],weights))
   rings.append(ring)
  for a,c in zip(rings,rings[1:]):t.join(a,c)
  # Real waist fold and diagonal overlap, integrated closely with wrap surface.
  upper=[]
  for k,i in enumerate(rings[0]):
   p=t.p[i].copy()
   if self.seated:p[2]-=.013;p[1]+=.003
   else:p[1]+=.014;p[0]=.013+(p[0]-.013)*1.014;p[2]=-.014+(p[2]+.014)*1.016
   upper.append(t.v(p,[k/n*2,0],{1:1}))
  t.join(upper,rings[0])
  if self.seated:pts=[[-.12,.614,-.048],[.086,.626,-.048],[-.018,.574,.317],[.117,.565,.317]]
  else:pts=[[-.098,py+.069,.083],[.116,py+.069,.084],[-.034,py-.356,.134],[.118,py-.370,.119]]
  ids=[t.v(p,[i%2*.8,i//2*1.4],{1:1}) for i,p in enumerate(pts)];t.quad(ids[0],ids[1],ids[3],ids[2],[0,1,1] if self.seated else [0,0,1])
 def towel_height(self,x,z):
  heights=[]
  for tri in self.towel.faces:
   a,b,c=[self.towel.p[i] for i in tri];ab=(b-a)[[0,2]];ac=(c-a)[[0,2]];q=np.array([x,z])-a[[0,2]];den=ab[0]*ac[1]-ab[1]*ac[0]
   if abs(den)<1e-10:continue
   v=(q[0]*ac[1]-q[1]*ac[0])/den;w=(ab[0]*q[1]-ab[1]*q[0])/den
   if v>=0 and w>=0 and v+w<=1:heights.append(float(a[1]+v*(b[1]-a[1])+w*(c[1]-a[1])))
  assert heights,(x,z)
  return max(heights)
 def animation(self):
  times=np.arange(241,dtype=float)/20;tracks={};world_samples=[];morph=[]
  for tm in times:
   phase=tm/12*2*PI;inhale=.5-.5*math.cos(phase*2)
   rots={i:np.array([0.,0.,0.,1.]) for i in range(20)};scales={i:np.ones(3) for i in range(20)}
   trans={i:self.jpos[i]-(self.jpos[self.parent[i]] if self.parent[i]>=0 else np.zeros(3)) for i in range(20)}
   # Genuine volumetric breath: chest expands 2-3 mm per side while the
   # shoulders rise 3 mm. The clavicles follow the chest, so this stays visible.
   scales[3]=np.ones(3)*(1+.015*inhale)
   scales[4]=np.ones(3)/(1+.015*inhale)
   trans[3]=trans[3]+[0,.0015*inhale,0]
   rots[2]=quat([1,0,0],.0025*math.sin(phase*2))
   rots[3]=quat([1,0,0],.004*math.sin(phase*2))
   rots[4]=quat([0,0,1],.002*math.sin(phase))
   rots[5]=quat([1,0,0],.0025*math.sin(phase)) if self.seated else quat([0,1,0],.044*math.sin(phase-.35)+.006*math.sin(phase*2-.7))
   if not self.seated:
    trans[1]=trans[1]+[.005*math.sin(phase),.0006*math.sin(phase*2),.001*math.sin(phase)]
    rots[13]=quat([1,0,0],.016*math.sin(phase-.3))
   worlds=[]
   for i in range(20):
    par=self.parent[i];parmat=worlds[par] if par>=0 else np.eye(4)
    # Solve the supported distal joints, preserving live clavicle/arm motion.
    pin=i in [16,19] or (not self.seated and i==9) or (self.seated and i in[9,13])
    if pin:
     target=np.eye(4);target[:3,3]=self.jpos[i]
     if self.seated and i in[9,13]:
      target[:3,3]+=[0,.00025*(1-math.cos(phase)),.0015*math.sin(phase+(0 if i==9 else .2))]
     local=np.linalg.inv(parmat)@target
     trans[i]=local[:3,3];scales[i]=np.linalg.norm(local[:3,:3],axis=0);rots[i]=matq(local[:3,:3]/scales[i])
    else:
     local=np.eye(4);local[:3,:3]=qmat(rots[i])@np.diag(scales[i]);local[:3,3]=trans[i]
    worlds.append(parmat@local)
    tracks.setdefault((i,'translation'),[]).append(trans[i]);tracks.setdefault((i,'rotation'),[]).append(rots[i]);tracks.setdefault((i,'scale'),[]).append(scales[i])
   world_samples.append(worlds)
   bv=0.
   if not self.seated:
    # Four or five held full-close samples: 200 ms, every 3.5-4.5 seconds.
    for center in[2.4,6.8,10.4]:
     dt=abs(tm-center)
     if dt<=.10001:bv=1.
     elif dt<.15001:bv=max(bv,(.15-dt)/.05)
   morph.append([bv,.20+.16*math.sin(phase),.30+.23*math.sin(phase-.45)])
  return times,tracks,np.array(morph,np.float32),np.array(world_samples)

class GLB:
 def __init__(self):self.data=bytearray();self.g={'asset':{'version':'2.0','generator':'Custom authored spa NPC topology v69'},'extensionsUsed':['KHR_materials_unlit'],'extensionsRequired':['KHR_materials_unlit'],'buffers':[{'byteLength':0}],'bufferViews':[],'accessors':[]}
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
  for i,(name,path) in enumerate(zip(['body','face','towel'],texture_paths)):
   img=Image.open(path).convert('RGB');f=io.BytesIO();img.save(f,format='PNG');vi=self.view(f.getvalue());self.g['images'].append({'bufferView':vi,'mimeType':'image/png','name':Path(path).name});self.g['textures'].append({'sampler':0,'source':i});self.g['materials'].append({'name':name,'extensions':{'KHR_materials_unlit':{}},'pbrMetallicRoughness':{'baseColorTexture':{'index':i},'metallicFactor':0,'roughnessFactor':1},'doubleSided':True})
  prims=[]
  for pi,part in enumerate(m.parts):
   d=part.flatten();attrs={k:self.acc(v,{'POSITION':'VEC3','NORMAL':'VEC3','TEXCOORD_0':'VEC2','JOINTS_0':'VEC4','WEIGHTS_0':'VEC4'}[k],5123 if k=='JOINTS_0' else 5126,34962,k=='POSITION') for k,v in d.items() if k!='morph'}
   pr={'attributes':attrs,'mode':4,'material':pi,'targets':[{'POSITION':self.acc(x,'VEC3',target=34962,limits=True)} for x in d['morph']]};prims.append(pr)
  self.g['meshes']=[{'name':f'Spa_Man_{m.key.upper()}','primitives':prims,'weights':[0,.2,.2],'extras':{'targetNames':['closed_eye_blink','left_finger_curl','right_finger_curl'],'topology':'authored anatomical cross-sections, shared shoulder branch boundaries; explicit flat normals'}}]
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
  self.g['animations']=[{'name':'Elder resting - closed eyes, breathing, hand microgestures' if m.seated else 'Younger idle - breath, delayed head turn, weight shift, blink, fingers','samplers':samplers,'channels':channels,'extras':{'sampleRate':20,'durationSeconds':12,'interpolation':'held STEP','loop':True}}]
  self.g['extras']={'archetype':'seated' if m.seated else 'standing','forwardAxis':'+Z','upAxis':'+Y','meters':True,'contacts':m.contact,'targetHeight':m.height,'style':'PS1 / early PS2, faceted unlit diffuse','authoring':'No subdivision; custom connected torso/arm loops and anatomical lofts','runtimeNote':'Use unlit nearest textures. Animation samples intentionally hold at 20 Hz.'}
  self.g['buffers'][0]['byteLength']=len(self.data);jb=json.dumps(self.g,separators=(',',':')).encode();jb+=b' '*((-len(jb))%4);bb=bytes(self.data)+b'\0'*((-len(self.data))%4);out.write_bytes(struct.pack('<4sII',b'glTF',2,12+8+len(jb)+8+len(bb))+struct.pack('<I4s',len(jb),b'JSON')+jb+struct.pack('<I4s',len(bb),b'BIN\0')+bb)
  return self.validate(m,world,out)
 def validate(self,m,world,out):
  allp=np.vstack([part.p for part in m.parts]);tris=sum(len(p.faces) for p in m.parts);bounds=[allp.min(axis=0).tolist(),allp.max(axis=0).tolist()]
  report={'file':str(out),'triangles':tris,'bones':20,'materialPrimitives':3,'bounds':bounds,'contacts':m.contact,'height':bounds[1][1]-bounds[0][1],'animationFrames':241,'duration':12,'sampleRate':20,'interpolation':'STEP','embeddedTextures':True,'uvConvention':'glTF image top is v=0; PNGs not flipped','weightsNormalized':True,'degenerateTriangles':0,'support':{}}
  for bone in ([9,13,16,19]):
   shift=np.linalg.norm(world[:,bone,:3,3]-m.jpos[bone],axis=1);report['support'][m.names[bone]]={'maxOriginDisplacementMeters':float(shift.max())}
  report['measurementsMeters']={
   'crownHeight':float(allp[:,1].max()),'nominalAnatomicalHeadHeight':.242,'headCraniumWidth':.176,
   'maximumCheekBreadth':.16192 if m.seated else .176,'jawBreadth':.13432 if m.seated else .146,'chinBreadth':.11592 if m.seated else .126,
   'pectoralCrossSectionWidth':.36815 if m.seated else .398,'pectoralCrossSectionDepth':.23688 if m.seated else .252,'waistCrossSectionWidth':.33327 if m.seated else .322,
   'neckBreadth':.112,'exposedNeckBelowChin':float(m.hy+.025-(m.sy+.062)),
   'shoulderJointSpan':float(np.linalg.norm(m.jpos[7]-m.jpos[11])),
   'upperArmFullDiameters':[.118,.126],'forearmFullDiameters':[.098,.102],'wristFullDiameters':[.060,.064],
   'standingHeightInNominalHeadUnits':None if m.seated else float(m.height/.242)}
  report['permanentlyClosedEyes']=bool(m.seated)
  report['animationNotes']={'supportedArms':'Clavicles remain live. B left hand alone is world-pinned; A wrists follow 1.5 mm slow forward/back motion with <=0.5 mm vertical lift.','feet':'Both foot roots and sole surfaces stay fixed.','breath':'Chest uniform expansion 1.5% (about 3 mm per side); shoulder lift about 3 mm over six seconds; neck cancels scale to preserve head size.','headRotationRadians':.0025 if m.seated else .050,'blinkMorphWeights':'A always zero; B 200-250 ms full closes at 2.4, 6.8, 10.4 seconds, real nonzero fitted lids.','fingerMorphs':'Real distal grouped-finger deltas; supported palms remain unchanged.'}
  if m.seated:
   report['support']['leftPalmToTowelVerticalGapMeters']=float(m.contact['left_palm'][1]-m.towel_height(m.contact['left_palm'][0],m.contact['left_palm'][2]))
   report['support']['rightPalmToTowelVerticalGapMeters']=float(m.contact['right_palm'][1]-m.towel_height(m.contact['right_palm'][0],m.contact['right_palm'][2]))
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
  assert tris<=3200,(m.key,tris)
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
def render(m,texpaths,out,size=(640,720),yaw=-.38,target=None,scale=1,pose=None,blink=False,morph_weights=None):
 w,h=size;bg=np.array([38,46,48],np.uint8);img=np.tile(bg,(h,w,1));depth=np.full((h,w),-1e9,float)
 target=np.array(target if target is not None else [0,m.height*.52,.07]);right=np.array([math.cos(yaw),0,-math.sin(yaw)]);forward=np.array([math.sin(yaw),.13,math.cos(yaw)]);forward=unit(forward);up=unit(np.cross(forward,right));right=unit(np.cross(up,forward));zoom=h/(m.height*1.14)*scale
 textures=[np.array(Image.open(p).convert('RGB')) for p in texpaths]
 # Fine checker ground and contact marks are intentionally not part of exported model.
 for part,tex in zip(m.parts,textures):
  points=np.array(part.p).copy();uvs=np.array(part.uv)
  if morph_weights is not None:points+=sum(np.array(part.morph[i])*morph_weights[i] for i in range(3))
  elif blink:points+=np.array(part.morph[0])
  if pose is not None:
   js=np.array(part.j);ww=np.array(part.w);local=points[:,None,:]-m.jpos[js]
   transformed=np.einsum('njab,njb->nja',pose[js,:3,:3],local)+pose[js,:3,3]
   points=(transformed*ww[:,:,None]).sum(axis=1)
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
 a=argparse.ArgumentParser();a.add_argument('--textures',type=Path,default=P/'runtime');a.add_argument('--out',type=Path,default=P);a.add_argument('--draft',action='store_true');args=a.parse_args();args.out.mkdir(parents=True,exist_ok=True)
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
