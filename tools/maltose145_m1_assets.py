# V145 M1 Maltose Market (麦芽糖市场) schoolyard: textures -> bc/dist/assets/l11-v145/.
# Run from the project root (pip install numpy pillow). Each output is its own texture (TEXTURE IRON RULE):
#  court145(-n,-r): sage-green acrylic court paint, seamless 4 m tile, from art-v145/m145_court.png
#  track145(-n,-r): maroon painted asphalt border, seamless 3 m tile, from art-v145/m145_track.png
#  board145(-n,-r): weathered white backboard face with the orange-red border + shooter square, from art-v145/m145_board.png
#  boardb145: backboard rear (painted steel sheet + bracing shadow lines), procedural
#  line145: worn white line paint (alpha = chips), 1 m along x, 5 cm across
#  chain145(-n): black vinyl chain-link diamond mesh, RGBA alpha-cut, 0.6 m tile (12 diamonds of 50 mm)
#  post145(-n,-r): black painted galvanised fence pipe; pole145(-n,-r): dark green hoop pole with rusty foot
#  rim145(-r): orange-red painted rim steel; net145: white nylon net diamonds RGBA
import numpy as np, os, math
from PIL import Image, ImageFilter
SRC='art-v145/';OUT='bc/dist/assets/l11-v145/';os.makedirs(OUT,exist_ok=True)
rng=np.random.default_rng(145)
def save(a,name,q=88):
    im=Image.fromarray(np.clip(a,0,255).astype(np.uint8));im.save(OUT+name+'.webp',quality=q,method=6);return im
def seamless(a):
    H,W=a.shape[:2];r=np.roll(np.roll(a,H//2,0),W//2,1)
    y=np.abs(np.linspace(-1,1,H))[:,None];x=np.abs(np.linspace(-1,1,W))[None,:]
    m=np.clip((1-np.maximum(x,y))*2.2,0,1);m=m*m*(3-2*m)
    if a.ndim==3:m=m[...,None]
    return a*m+r*(1-m)
def normal(h,s=3.0):
    gx=(np.roll(h,-1,1)-np.roll(h,1,1))*s;gy=(np.roll(h,-1,0)-np.roll(h,1,0))*s
    n=np.dstack([-gx,gy,np.ones_like(h)]);n/=np.linalg.norm(n,axis=2,keepdims=True);return (n*.5+.5)*255
def blur(a,r):return np.asarray(Image.fromarray(np.clip(a,0,255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r)),dtype=np.float32)
def lum(a):return a[...,0]*.3+a[...,1]*.59+a[...,2]*.11
def surface(src,name,size,crop,tint,hs,rough0,roughk):
    im=Image.open(SRC+src).convert('RGB');W,H=im.size;c=crop;im=im.crop(((W-c)//2,(H-c)//2,(W+c)//2,(H+c)//2)).resize((size,size),Image.LANCZOS)
    a=np.asarray(im,dtype=np.float32);a=seamless(a)
    # pull the overall mean onto the photo's measured court colour, keep the variation
    mean=a.reshape(-1,3).mean(0);a=(a-mean)*.85+np.array(tint)
    a=np.round(a/4)*4   # light quantize (PS1 low-fi)
    save(a,name)
    L=lum(a);hp=L-blur(L,4);save(normal(hp/255,hs),name+'-n')
    r=np.clip(rough0+roughk*(hp/255),0,1)*255;save(np.dstack([r,r,r]),name+'-r')
# measured in the reference: court paint ~ (162,174,159) lit, lines (172,191,169) near; border maroon ~ (70,28,32)
surface('m145_court.png','court145',512,760,(140,160,138),5.0,.86,-1.2)
surface('m145_track.png','track145',384,700,(92,40,42),6.0,.9,-1.0)
# ---- backboard face: crop the board out of its grey margin
im=Image.open(SRC+'m145_board.png').convert('RGB');a=np.asarray(im,dtype=np.float32)
g=np.abs(a-a[5,5]).sum(2)>40;ys,xs=np.where(g);x0,x1,y0,y1=xs.min(),xs.max(),ys.min(),ys.max()
b=im.crop((x0+4,y0+4,x1-4,y1-4)).resize((256,176),Image.LANCZOS);ba=np.asarray(b,dtype=np.float32)*.97
save(ba,'board145');L=lum(ba);hp=L-blur(L,2);save(normal(hp/255,4),'board145-n')
red=(ba[...,0]-ba[...,2])>60;r=np.where(red,.55,.7)+ (lum(ba)<120)*.2;r=np.clip(r,0,1)*255;save(np.dstack([r,r,r]),'board145-r')
# ---- backboard rear: grey-white steel sheet, a frame of bracing and rust bleeding at bolts
H,W=176,256;a=np.full((H,W,3),(178,180,176),np.float32)+rng.normal(0,5,(H,W,1))
for x in (8,W//2,W-9):a[:,x-3:x+3]*=.72
for y in (8,H//2,H-9):a[y-3:y+3,:]*=.72
for _ in range(14):
    x,y=rng.integers(10,W-10),rng.integers(10,H-40);l=rng.integers(10,40);a[y:y+l,x:x+2]=a[y:y+l,x:x+2]*.6+np.array((120,60,30))*.4
save(blur(a,.6),'boardb145')
# ---- white line paint: 512 x 32 (1 m x 5 cm... stretched; across = 32 px), alpha chipped
H,W=32,512;n=blur(rng.normal(0,1,(H,W)).astype(np.float32)*60+128,1.2);n2=blur(rng.normal(0,1,(H,W)).astype(np.float32)*80+128,3)
al=((n2>98)&(n>70))*255.0;al[:2]=0;al[-2:]=0
c=np.dstack([np.full((H,W),222.)-(255-n)*.15,np.full((H,W),226.)-(255-n)*.15,np.full((H,W),214.)-(255-n)*.15,al])
c[...,3]=np.roll(c[...,3],0,1);save(c,'line145')
# ---- chain link: 0.6 m tile, 12 diamonds per side (50 mm pitch); wires 3.5 mm vinyl-coated black
S=384;yy,xx=np.mgrid[0:S,0:S].astype(np.float32);p=S/12
u=((xx+yy)/p)%1.0;v=((xx-yy)/p)%1.0;du=np.minimum(u,1-u)*p/math.sqrt(2);dv=np.minimum(v,1-v)*p/math.sqrt(2)
d=np.minimum(du,dv);wr=2.0;al=np.clip((wr-d)/0.8+.5,0,1)
prof=np.clip(1-(d/wr)**2,0,1);sh=(prof**.5)
base=np.dstack([18+22*sh,20+22*sh,19+20*sh])
# knuckles where wires twist (weave crossings) slightly thicker/brighter
cross=(du<wr*1.3)&(dv<wr*1.3);base[cross]*=1.25
save(np.dstack([base,al*255]),'chain145')
hh=prof*al;save(normal(hh,6),'chain145-n')
# ---- fence pipe: 128 x 256 black paint over galvanised steel, chips show zinc grey; vertical streaks
H,W=256,128;n=blur(rng.normal(0,1,(H,W)).astype(np.float32),1)*12;stre=blur(rng.normal(0,1,(1,W)).astype(np.float32).repeat(H,0),.5)*8
chips=blur(rng.normal(0,1,(H,W)).astype(np.float32)*90+128,2)>200
a=np.dstack([26+n+stre,27+n+stre,28+n+stre]);a[chips]=np.array((120,124,122))+n[chips][:,None]
save(a,'post145');save(normal(blur((chips*1.0).astype(np.float32)*255,1)/255*-.5+n/80,3),'post145-n');r=np.where(chips,.45,.62)*255;save(np.dstack([r,r,r]),'post145-r')
# ---- hoop pole: dark green park paint, rust creeping up the first 0.5 m (texture v = 0 at the foot, 4.5 m tall)
H,W=512,64;n=blur(rng.normal(0,1,(H,W)).astype(np.float32),1.5)*10
a=np.dstack([38+n,52+n,44+n]);ry=np.linspace(0,1,H)[:,None]  # image bottom = pole foot (v 0)
rust=np.clip((ry-.9)*10,0,1)*(blur(rng.normal(0,1,(H,W)).astype(np.float32)*70+128,3)>110)
a=a*(1-rust[...,None])+np.array((104,58,30))*rust[...,None]
save(a,'pole145');save(normal(n/40+rust*.6,3),'pole145-n');r=(.55+.35*rust)*255;save(np.dstack([r,r,r]),'pole145-r')
# ---- rim: orange-red paint, worn to dark steel at the front lip
H,W=64,256;n=blur(rng.normal(0,1,(H,W)).astype(np.float32),1)*10;wear=blur(rng.normal(0,1,(H,W)).astype(np.float32)*80+128,2)>185
a=np.dstack([196+n,64+n,30+n]);a[wear]=np.array((70,62,58))
save(a,'rim145');r=np.where(wear,.4,.55)*255;save(np.dstack([r,r,r]),'rim145-r')
# ---- net: white nylon, 12 meshes around x 6 down, alpha
H,W=96,192;yy,xx=np.mgrid[0:H,0:W].astype(np.float32);px=W/12;py=H/6
u=((xx/px+yy/py))%1;v=((xx/px-yy/py))%1;d=np.minimum(np.minimum(u,1-u),np.minimum(v,1-v))*px*.7
al=np.clip((1.3-d)/.7+.5,0,1);c=np.dstack([np.full((H,W),222.)-yy*.3,np.full((H,W),220.)-yy*.3,np.full((H,W),212.)-yy*.3,al*255])
save(c,'net145')
print('ok',sorted(os.listdir(OUT)))
