# V146 capital stucco corner terrace (首都街角灰泥联排楼), T1 main building textures.
# Run from the project root (numpy + pillow). Sources art-v146/m146_*.png, each generated large on its own.
# Outputs -> bc/dist/assets/l11-v146/ (TEXTURE IRON RULE: every surface its own texture):
#  sbrick146(-n,-r) dark London stock brick (seamless: whole brick periods by autocorrelation + edge cross-fade)
#  srust146(-n,-r)  white rusticated stucco base (horizontal channels, cut to whole channel pitch)
#  sstuc146(-n,-r)  smooth painted stucco (pilasters, cornices, window surrounds, parapet)
#  scap146(-n)      Corinthian pilaster capital front (unit UV on the modelled capital block)
#  slate146(-n,-r)  slate roof     terra146(-n,-r) chimney-pot terracotta     iron146(-n,-r) black gloss cast iron
#  door146(-n)      six-panel black front door      win146 1x3 atlas of three window interiors (photo-dark, sky sheen)
import numpy as np, os
from PIL import Image, ImageFilter
SRC='art-v146/';OUT='bc/dist/assets/l11-v146/';os.makedirs(OUT,exist_ok=True)
def save(a,name,q=88):Image.fromarray(np.clip(a,0,255).astype(np.uint8)).save(OUT+name+'.webp',quality=q,method=6)
def load(n):return np.asarray(Image.open(SRC+n).convert('RGB'),dtype=np.float32)
def rs(a,w,h):return np.asarray(Image.fromarray(np.clip(a,0,255).astype(np.uint8)).resize((w,h),Image.LANCZOS),dtype=np.float32)
def blur(a,r):return np.asarray(Image.fromarray(np.clip(a,0,255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r)),dtype=np.float32)
def lum(a):return a[...,0]*.3+a[...,1]*.59+a[...,2]*.11
def normal(h,s=3.0):
    gx=(np.roll(h,-1,1)-np.roll(h,1,1))*s;gy=(np.roll(h,-1,0)-np.roll(h,1,0))*s
    n=np.dstack([-gx,gy,np.ones_like(h)]);n/=np.linalg.norm(n,axis=2,keepdims=True);return (n*.5+.5)*255
def period(sig,lo,hi):
    s=sig-sig.mean();ac=np.array([np.dot(s[:-k],s[k:])/(len(s)-k) for k in range(lo,hi)]);return lo+int(np.argmax(ac))
def xfade(a,bx,by):
    H,W=a.shape[:2];out=a.copy()
    if bx:m=np.linspace(0,1,bx)[None,:,None];out[:,:bx]=a[:,W-bx:]*(1-m)+a[:,:bx]*m;out=out[:,:W-bx]
    if by:H=out.shape[0];m=np.linspace(0,1,by)[:,None,None];o2=out.copy();o2[:by]=out[H-by:]*(1-m)+out[:by]*m;out=o2[:H-by]
    return out
def flatten(a,r):L=lum(a);B=blur(L,r)+1;return np.clip(a*(L.mean()/B)[...,None],0,255)
def maps(c,name,size,hs,r0=.85,rk=-1.,hr=3):
    h=lum(c);hp=h-blur(h,hr);save(rs(c,size,size),name)
    save(normal(rs(hp[...,None].repeat(3,2),size,size)[...,0]/255,hs),name+'-n')
    if r0 is not None:r=np.clip(r0+rk*hp/255,0,1)*255;save(rs(np.dstack([r,r,r]),size,size),name+'-r')
# ---- brick: whole courses / bricks, then pull toward the photo's dark sooty brown, keep brick-to-brick variation
a=flatten(load('m146_brick.png'),30);L=lum(a)
py=period(blur(L,1).mean(1),8,60);px=period(blur(L,1)[int(py*.5)::py].mean(0),30,200)
H,W=a.shape[:2];ny=(H-py)//(2*py)*2;nx=(W-px)//px//2*2;c=a[:ny*py+py,:nx*px+px//2*2];c=xfade(c,px//2*2,py)
mean=c.reshape(-1,3).mean(0);c=(c-mean)*.7+np.array((60,52,46))   # photo: dark umber stock brick, light mortar stays lighter
mo=lum(c)>lum(c).mean()+34;c[mo]=c[mo]*.55+np.array((128,124,116))*.45
maps(np.round(c/3)*3,'sbrick146',512,4.0,.92,-.8)
print('brick course px',py,'brick px',px,'crop',c.shape,'-> tile',(c.shape[1]/px*0.225*2/2),'m wide (2 bricks per px period? see TILE in stucco146.js)')
open('/tmp/b146.txt','w').write(f'{py} {px} {c.shape[0]} {c.shape[1]}')
# ---- rusticated stucco: channel pitch rows
a=flatten(load('m146_rustic.png'),60);L=lum(a);pr=period(blur(L,2).mean(1),60,400);H,W=a.shape[:2];n=(H-80)//pr
c=xfade(a[:n*pr+80,:],160,80);mean=c.reshape(-1,3).mean(0);c=(c-mean)*.9+np.array((206,204,196))
maps(c,'srust146',512,5,.75,-1.2,4);print('rustic channels',n,'pitch',pr,'rows of',c.shape[0])
# ---- smooth stucco
a=load('m146_stucco.png');c=xfade(flatten(a,90),128,128);mean=c.reshape(-1,3).mean(0);c=(c-mean)*.8+np.array((214,210,198))
maps(c,'sstuc146',256,2.5,.7,-1.)
# ---- capital: crop the capital (head + acanthus), unit uv
a=load('m146_capital.png');H,W=a.shape[:2];cap=a[int(H*.26):int(H*.70),int(W*.24):int(W*.78)]
cap=(cap-cap.reshape(-1,3).mean(0))*.95+np.array((206,202,192));h=lum(cap)
save(rs(cap,192,160),'scap146');save(normal(rs((h-blur(h,6))[...,None].repeat(3,2),192,160)[...,0]/255,6),'scap146-n')
# ---- slate / terracotta / iron
for src,name,t,mix,hs,size in(('m146_slate.png','slate146',(92,96,98),.5,4,512),('m146_terracotta.png','terra146',(168,92,58),.3,3,256),('m146_iron.png','iron146',(22,22,23),.6,2,256)):
    a=load(src);c=xfade(flatten(a,80),a.shape[1]//8,a.shape[0]//8);mean=c.reshape(-1,3).mean(0);c=c+(np.array(t)-mean)*mix
    maps(c,name,size,hs,.55 if name=='iron146' else .85,-1.5 if name=='iron146' else -1.)
# ---- door
a=load('m146_door.png');H,W=a.shape[:2];d=a[int(H*.01):int(H*.99),int(W*.03):int(W*.97)];h=lum(d)
save(rs(d,160,320),'door146');save(normal(rs((h-blur(h,5))[...,None].repeat(3,2),160,320)[...,0]/255,5),'door146-n')
# ---- window interiors (glass fills the frame): photo-dark, grey sky sheen toward the top
cells=[]
for n in('m146_win1','m146_win2','m146_win3'):
    a=load(n+'.png');H,W=a.shape[:2];a=a[int(H*.03):int(H*.97),int(W*.04):int(W*.96)];a=rs(a,128,192)
    g=np.linspace(1,0,192)[:,None,None];a=a*.55+np.array((150,158,166))*(.14+.26*g);cells.append(a)
save(np.concatenate(cells,1),'win146')
# ---- cast-iron balcony panel (procedural RGBA, one 0.5 m x 0.9 m bay): rails, uprights, a pair of C-scrolls + ring, dog bars
from PIL import ImageDraw
W,H=256,460;im=Image.new('L',(W,H),0);d=ImageDraw.Draw(im)
d.rectangle([0,0,W,14],255);d.rectangle([0,H-16,W,H],255);d.rectangle([0,H-70,W,H-62],255);d.rectangle([0,60,W,66],255)
for x in(0,W-10):d.rectangle([x,0,x+10,H],255)
for x in range(16,W-10,26):d.rectangle([x,H-62,x+5,H-16],255)        # dog bars
c=W//2;d.ellipse([c-44,150,c+44,238],outline=255,width=9);d.ellipse([c-14,180,c+14,208],outline=255,width=7)
for sgn in(-1,1):
    d.arc([c+sgn*60-50,66,c+sgn*60+50,166],0 if sgn<0 else 180,180 if sgn<0 else 360,fill=255,width=8)
    d.arc([c+sgn*60-50,232,c+sgn*60+50,332],180 if sgn<0 else 0,360 if sgn<0 else 180,fill=255,width=8)
    d.line([c+sgn*100,66,c+sgn*100,H-70],fill=255,width=7)
d.line([c,66,c,150],fill=255,width=7);d.line([c,238,c,H-70],fill=255,width=7)
d.polygon([(c,282),(c-16,312),(c,342),(c+16,312)],outline=255,width=6)
a=np.asarray(im.resize((128,230),Image.LANCZOS),dtype=np.float32);ir=rs(load('m146_iron.png'),128,230)
save(np.dstack([ir*.9,np.where(a>110,255,0)]),'rail146')
print('ok')
