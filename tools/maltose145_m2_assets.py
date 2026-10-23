# V145 M2 Maltose Market (麦芽糖市场): the three near buildings across the street (red brick, beige, brown corner).
# Run from the project root (numpy + pillow). Sources art-v145/m145b_*.png / m145w_*.png, each generated large on its own.
# Outputs -> bc/dist/assets/l11-v145/ (TEXTURE IRON RULE: every surface its own texture):
#  rbrick145 / bbrick145 / buff145 (-n,-r): red painted brick (left), tawny Roman brick (brown corner), buff brick (beige upper)
#            seamless: crop to whole brick periods found by autocorrelation, then edge cross-fade of one period
#  rustic145(-n,-r): beige base banded rustication (horizontal channels)      lime145(-n,-r): limestone sills/lintels/bands
#  iron145(-n,-r): black fire-escape iron; grate145: RGBA bar grating for platforms (cut from iron145)
#  wpaint145(-n): white painted sash wood    win145: 3x2 atlas of six window interiors (frames cropped, darkened like the photo)
#  ac145: window AC front    corn145r/corn145b/corn145y (-n): cornice sheet metal, three crops / tints (red / brown / beige)
#  shopb145, shopg145: ground-floor shopfronts (black / green), entry145: beige entrance, stucco145(-n): roof penthouse,
#  roof145(-n): tar roof (procedural)
import numpy as np, os, math
from PIL import Image, ImageFilter
SRC='art-v145/';OUT='bc/dist/assets/l11-v145/';os.makedirs(OUT,exist_ok=True)
rng=np.random.default_rng(1452)
def save(a,name,q=88):
    Image.fromarray(np.clip(a,0,255).astype(np.uint8)).save(OUT+name+'.webp',quality=q,method=6)
def load(n):return np.asarray(Image.open(SRC+n).convert('RGB'),dtype=np.float32)
def rs(a,w,h):return np.asarray(Image.fromarray(np.clip(a,0,255).astype(np.uint8)).resize((w,h),Image.LANCZOS),dtype=np.float32)
def blur(a,r):
    if a.ndim==2:return np.asarray(Image.fromarray(np.clip(a,0,255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r)),dtype=np.float32)
    return np.asarray(Image.fromarray(np.clip(a,0,255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r)),dtype=np.float32)
def lum(a):return a[...,0]*.3+a[...,1]*.59+a[...,2]*.11
def normal(h,s=3.0):
    gx=(np.roll(h,-1,1)-np.roll(h,1,1))*s;gy=(np.roll(h,-1,0)-np.roll(h,1,0))*s
    n=np.dstack([-gx,gy,np.ones_like(h)]);n/=np.linalg.norm(n,axis=2,keepdims=True);return (n*.5+.5)*255
def period(sig,lo,hi):
    s=sig-sig.mean();ac=np.array([np.dot(s[:-k],s[k:])/(len(s)-k) for k in range(lo,hi)]);return lo+int(np.argmax(ac))
def xfade(a,bx,by):
    # make tileable: blend the last bx columns / by rows into the first ones, then drop them
    H,W=a.shape[:2];out=a.copy()
    if bx:
        m=np.linspace(0,1,bx)[None,:,None];out[:,:bx]=a[:,W-bx:]*(1-m)+a[:,:bx]*m;out=out[:,:W-bx]
    if by:
        H=out.shape[0];m=np.linspace(0,1,by)[:,None,None];o2=out.copy();o2[:by]=out[H-by:]*(1-m)+out[:by]*m;out=o2[:H-by]
    return out
def flatten(a,r):
    # remove broad stains (no repeated per-tile stains): divide out the heavily blurred luminance
    L=lum(a);B=blur(L,r)+1;return np.clip(a*(L.mean()/B)[...,None],0,255)
def destreak(a,k=14):
    # thin vertical soot runs: pixels much darker than the column-neighbourhood median are pulled up to it
    from numpy.lib.stride_tricks import sliding_window_view as sw
    def mf(x):p=np.pad(x,((0,0),(k//2,k-1-k//2)),mode='edge');return np.median(sw(p,k,axis=1),axis=-1)
    L=lum(a);M=mf(L);d=np.clip((M-L-12)/24,0,1);d=blur(d*255,1.5)/255;d=d[...,None]
    med=np.dstack([mf(a[...,i]) for i in range(3)]);return a*(1-d)+med*d
def brick(src,name,size,tint,mix,hs=4.0,courses=None,fr=30,ds=False):
    a=load(src)
    if ds:a=destreak(a)
    a=flatten(a,fr);L=lum(a)
    py=courses or period(blur(L,1).mean(1),8,60)       # course pitch (rows)
    # brick pitch: autocorrelate along one course band
    px=period(L[:, :].mean(0) if False else blur(L,1)[int(py*.5)::py].mean(0),30,200)
    H,W=a.shape[:2];ny=(H-py)//(2*py)*2;nx=(W-px)//px//2*2
    c=a[:ny*py+py,:nx*px+px//2*2]
    c=xfade(c,px//2*2,py)
    c=np.asarray(c);mean=c.reshape(-1,3).mean(0);c=c+(np.array(tint)-mean)*mix
    h=lum(c);hp=h-blur(h,3)
    out=rs(c,size,size);save(np.round(out/3)*3,name)
    save(normal(rs(hp[...,None].repeat(3,2),size,size)[...,0]/255,hs),name+'-n')
    r=np.clip(.92-hp/255*.8,0,1);save(rs(np.dstack([r,r,r])*255,size,size),name+'-r')
    print(name,'course px',py,'brick px',px,'crop',c.shape)
brick('m145b_redbrick.png','rbrick145',512,(132,46,40),.35,ds=True)
brick('m145b_brownbrick.png','bbrick145',512,(150,88,58),.25)
brick('m145b_buffbrick.png','buff145',512,(150,138,116),.3)
# rustication: horizontal bands -> cut to whole band pitch, x seamless by cross-fade
a=flatten(load('m145b_rustic.png'),60);L=lum(a);py=period(blur(L,2).mean(1),40,300);H,W=a.shape[:2];n=(H-60)//py
c=xfade(a[:n*py+60,:],160,60);mean=c.reshape(-1,3).mean(0);c=c+(np.array((152,140,120))-mean)*.4
h=lum(c);save(rs(c,512,512),'rustic145');save(normal(rs((h-blur(h,4))[...,None].repeat(3,2),512,512)[...,0]/255,5),'rustic145-n')
r=np.clip(.9-(h-blur(h,4))/255,0,1)*255;save(rs(np.dstack([r,r,r]),512,512),'rustic145-r');print('rustic bands',n,'pitch',py)
def surf(src,name,size,tint,mix,hs,crop=None,r0=.8,rk=-1.):
    a=load(src);H,W=a.shape[:2];c=a[:, (W-H)//2:(W-H)//2+H] if crop is None else a[crop[1]:crop[3],crop[0]:crop[2]]
    c=xfade(c,c.shape[1]//8,c.shape[0]//8);mean=c.reshape(-1,3).mean(0);c=c+(np.array(tint)-mean)*mix
    h=lum(c);hp=h-blur(h,3);save(rs(c,size,size),name);save(normal(rs(hp[...,None].repeat(3,2),size,size)[...,0]/255,hs),name+'-n')
    if r0 is not None:r=np.clip(r0+rk*hp/255,0,1)*255;save(rs(np.dstack([r,r,r]),size,size),name+'-r')
    return c
surf('m145b_lime.png','lime145',256,(170,164,150),.4,3)
iron=surf('m145b_iron.png','iron145',256,(30,28,27),.5,3,crop=(700,0,1408,768),r0=.5,rk=-1.5)
surf('m145b_whitepaint.png','wpaint145',256,(214,212,204),.3,2.5,r0=None)
surf('m145b_stucco.png','stucco145',256,(176,178,176),.4,3,r0=None)
for nm,cr,t in(('corn145r',(0,0,700,700),(74,72,70)),('corn145b',(700,0,1400,700),(58,46,40)),('corn145y',(350,60,1050,760),(86,80,70))):
    surf('m145b_cornice.png',nm,256,t,.6,3,crop=cr,r0=None)
# grating: parallel flat bars 25 mm pitch with a cross bar every 0.3 m (tile 0.3 m, 128 px)
S=128;yy,xx=np.mgrid[0:S,0:S].astype(np.float32);bar=((xx%10.67)<3.2)|((yy%64)<6);ir=rs(iron,S,S)*.9
save(np.dstack([ir,np.where(bar,255,0)]),'grate145')
# window interiors: crop the generated frames off (inner 84 %), photo-like: darker, a little blue-grey sky reflection
cells=[]
for n in('m145w_r1','m145w_r2','m145w_b1','m145w_b2','m145w_n1','m145w_n2'):
    a=load(n+'.png');H,W=a.shape[:2];a=a[int(H*.07):int(H*.93),int(W*.09):int(W*.91)]
    a=rs(a,128,192);g=np.linspace(1,0,192)[:,None,None]
    a=a*.42+np.array((126,134,146))*(.06+.14*g)   # the photo's panes read dark grey with a faint sky sheen
    cells.append(a)
atl=np.zeros((384,384,3),np.float32)
for i,cimg in enumerate(cells):atl[(i//3)*192:(i//3+1)*192,(i%3)*128:(i%3+1)*128]=cimg
save(atl,'win145')
a=load('m145b_ac.png');save(rs(a[40:-40,60:-60],192,112),'ac145')
for n,o in(('m145b_shop_black.png','shopb145'),('m145b_shop_green.png','shopg145')):
    a=load(n);H,W=a.shape[:2];a=a[int(H*.28):int(H*.9)];save(rs(a,512,192),o)
a=load('m145b_entry.png');save(rs(a,192,288),'entry145')
# tar roof: procedural speckled bitumen with seams
S=256;n=blur(rng.normal(0,1,(S,S))*40+128,1.2);seam=(np.arange(S)%64<2)[None,:].repeat(S,0)
r=np.dstack([58+(n-128)*.25]*3);r[seam]*=.75;save(r,'roof145');save(normal((n/255*.4+seam*.3),2),'roof145-n')
print('ok')
