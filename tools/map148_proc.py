import json,base64,sys,numpy as np,cv2,glob
from PIL import Image
OUT='/workspace/work/v148/e4/'
files=sys.argv[1:] or [OUT+'dump.json']
H=C=S=CAN=CC=None;meta=None
for f in files:
  d=json.load(open(f));NW,NH=d['NW'],d['NH']
  dec=lambda k,t:np.frombuffer(base64.b64decode(d[k]),dtype=t).reshape(NH,NW).copy()
  h,c,s,can,cc=dec('H',np.float32),dec('C',np.uint32),dec('S',np.float32),dec('CAN',np.float32),dec('CC',np.uint32)
  if H is None:H,C,S,CAN,CC=h,c,s,can,cc;meta=d
  else:
    m=h>H;H[m]=h[m];C[m]=c[m];S=np.maximum(S,s);m=can>CAN;CAN[m]=can[m];CC[m]=cc[m]
  if d.get('wp'):meta['wp']=d['wp']
  print(f,d.get('info'))
json.dump({'wp':meta.get('wp')},open(OUT+'wp.json','w'),indent=1,ensure_ascii=False)
RES=meta['RES'];X0,Z0=meta['X0'],meta['Z0']
empty=H<-1e8;print('empty frac',empty.mean())
top=np.where(CAN>H,CAN,H);col=np.where(CAN>H,CC,C)
top[top<-1e8]=0
rgb=np.stack([(col>>16)&255,(col>>8)&255,col&255],-1).astype(np.float32)
rgb[empty&(CAN<-1e8)]=(75,76,74)
# hillshade (light from +x,+z i.e. opposite of the in-game SUN shadow offset (-.6,-.8)), elevation ~61deg
gz,gx=np.gradient(np.clip(top,-3,200),RES)
L=np.array([.6,.8]);elev=np.arctan(1/.55)
nx,nz,ny=-gx,-gz,np.ones_like(gx);n=np.sqrt(nx*nx+ny*ny+nz*nz)
lam=(nx*L[0]*np.cos(elev)+nz*L[1]*np.cos(elev)+ny*np.sin(elev))/n
shade=np.clip(.55+.55*lam,0.35,1.15)
# cast shadows: march toward the light
sh=np.zeros_like(top,bool);tanE=1/.55
hmax=top.copy()
for k in range(1,320):
  dx=int(round(L[0]*k));dz=int(round(L[1]*k))
  dist=k*RES
  sh_src=np.full_like(top,-1e9)
  sh_src[:NH-dz if dz else NH, :NW-dx if dx else NW]=top[dz:,dx:]
  sh|=sh_src>top+dist*tanE+0.3
shade=np.where(sh,shade*.55,shade)
img=rgb*shade[...,None]
# grade: slightly desaturated, cool shadows
l=img@np.array([.3,.59,.11]);img=l[...,None]+(img-l[...,None])*.85
img=np.clip(img*1.02+4,0,255).astype(np.uint8)
im=Image.fromarray(img,'RGB');im.save(OUT+'sat_full.png')
im.save(OUT+'sat148.webp',quality=72,method=6)
print('sat saved',im.size)
# ---- footprints
B=(S>3.2)
B=B.astype(np.uint8)
k3=np.ones((3,3),np.uint8)
B=cv2.morphologyEx(B,cv2.MORPH_OPEN,k3,iterations=2)
# cut at height steps > 2.5 m so adjacent buildings separate
Sc=np.where(S>-1e8,S,0)
cut=np.zeros_like(B)
cut[:,1:]|=(np.abs(Sc[:,1:]-Sc[:,:-1])>2.5).astype(np.uint8)
cut[1:,:]|=(np.abs(Sc[1:,:]-Sc[:-1,:])>2.5).astype(np.uint8)
B2=B&(1-cut)
n,lab,stats,_=cv2.connectedComponentsWithStats(B2,connectivity=4)
polys=[]
for i in range(1,n):
  if stats[i,cv2.CC_STAT_AREA]<60:continue
  x,y,w,h=stats[i,:4]
  m=(lab[y:y+h,x:x+w]==i).astype(np.uint8)
  m=cv2.dilate(m,k3,iterations=1)  # give back the cut line
  cs,hier=cv2.findContours(np.pad(m,1),cv2.RETR_CCOMP,cv2.CHAIN_APPROX_SIMPLE)
  hgt=float(np.median(Sc[y:y+h,x:x+w][lab[y:y+h,x:x+w]==i]))
  rings=[]
  for ci,cc in enumerate(cs):
    if hier[0][ci][3]!=-1 and cv2.contourArea(cc)<40:continue
    a=cv2.approxPolyDP(cc,1.0,True).reshape(-1,2)
    if len(a)<3:continue
    pts=[(int(px+x-1),int(py+y-1)) for px,py in a]
    rings.append((hier[0][ci][3]!=-1,pts))
  outer=[r for hole,r in rings if not hole];holes=[r for hole,r in rings if hole]
  if not outer:continue
  polys.append({'h':round(hgt,1),'r':[outer[0]]+holes})
print('polys',len(polys),sum(len(r) for p in polys for r in p['r']))
json.dump({'X0':X0,'Z0':Z0,'RES':RES,'NW':NW,'NH':NH,'polys':polys},open(OUT+'foot.json','w'))
# preview of mask
pv=np.full((NH,NW,3),242,np.uint8)
for p in polys:
  for j,r in enumerate(p['r']):
    cv2.fillPoly(pv,[np.array(r,np.int32)],(220,216,206) if j==0 else (242,239,233))
    cv2.polylines(pv,[np.array(r,np.int32)],True,(180,176,164),1)
Image.fromarray(pv).save(OUT+'foot_prev.png')
# per-building roof variation (real roofs share a few textures; aerial photos never look that uniform)
import random
im=np.asarray(Image.open(OUT+'sat_full.png')).astype(np.float32)
fac=np.ones((NH,NW,3),np.float32)
TINT=[(1.0,1.0,1.0),(1.08,1.04,.96),(.95,.98,1.04),(1.1,1.1,1.08),(1.05,.97,.92),(.92,.95,.98)]
for i,p in enumerate(polys):
  rnd=random.Random(i*7919+int(p['h']*10));k=.9+rnd.random()*.45;t=TINT[rnd.randrange(len(TINT))]
  m=np.zeros((NH,NW),np.uint8);cv2.fillPoly(m,[np.array(p['r'][0],np.int32)],1);m=cv2.erode(m,k3,iterations=1).astype(bool)
  fac[m]=(k*t[0],k*t[1],k*t[2])
im=np.clip(im*fac*1.12+6,0,255).astype(np.uint8)
Image.fromarray(im).save(OUT+'sat_full2.png');Image.fromarray(im).save(OUT+'sat148.webp',quality=70,method=6)
# final grade used for the shipped dist/assets/map148/sat148.webp
from PIL import ImageEnhance
im=np.asarray(Image.open(OUT+'sat_full2.png')).astype(np.float32)/255
im=np.clip((im**0.8)*1.08,0,1)
o=ImageEnhance.Color(Image.fromarray((im*255).astype(np.uint8))).enhance(1.1);o.save(OUT+'sat148.webp',quality=70,method=6)
# then: footprints foot.json -> dist/map148-foot.js (see V148 E4 in notes/version-history.md for the one-liner)
