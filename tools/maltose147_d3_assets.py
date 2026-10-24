# V147 D3 Maltose Market goods batch 2 — copper / enamel / toys / shoes + bags / mirrors / typewriter / small furniture / rug rolls / globe / silver.
# Run from the project root (numpy pillow scipy). Sources art-v147/m147c_*.png, each generated large on its own (no grid sheets);
# the rest (enamel, soles, tweed, typewriter decals + keycaps, spirals, stool top, brass, silver, paper) drawn here at 512 and reduced.
# Output -> bc/dist/assets/l11-v147/goods147b(.webp, -n, -m = G roughness / B metalness): 1024 atlas, 8 x 8 cells of 128 (cell k = row k>>3, col k&7):
#  0 hammered copper   1 tarnished copper (inside / bottom)   2 white enamel + blue rim + chips (mugs)   3 blue graniteware speckle
#  4 enamel inside (white, stains)   5 dark boot leather   6 tan bag leather   7 sole edge + welt stitching   8 suitcase tweed canvas
#  9 suitcase leather trim + stitching   10 mohair   11 bear face (muzzle felt, stitched nose; radial)   12 tin robot chest   13 robot tin side
#  14 toy-truck red paint on wood   15 spinning-top stripes   16 foxed mirror silvering   17 dark walnut (mirror frame / stand)
#  18 typewriter black crinkle + gold decal   19 typewriter keycaps (4 x 4 grid)   20 platen rubber + chrome ends   21 sage milk-paint wood (cabinet)
#  22 oak stool top (radial)   23 engraved brass (meridian)   24-25 globe (2 x 1)   26 tarnished silver   27 rug back (jute weave)   28 rug fringe
#  29 rolled-rug end spiral (radial)   30 typed sheet of paper   31 cream cabinet inner / drawer side
#  32-33/40-41 Persian rug (2 x 2)   34-35/42-43 kilim (2 x 2)
import numpy as np,os,math
from PIL import Image,ImageDraw,ImageFont,ImageFilter
from scipy import ndimage as nd
SRC='art-v147/';OUT='bc/dist/assets/l11-v147/';os.makedirs(OUT,exist_ok=True)
rng=np.random.default_rng(14703)
F=lambda n,s:ImageFont.truetype('/usr/share/fonts/truetype/dejavu/'+n,s)
def load(n):return np.asarray(Image.open(SRC+n).convert('RGB'),dtype=np.float32)
def crop(a,x0,x1,y0,y1):H,W=a.shape[:2];return a[int(H*y0):int(H*y1),int(W*x0):int(W*x1)]
def rs(a,w,h):return np.asarray(Image.fromarray(np.clip(a,0,255).astype(np.uint8)).resize((w,h),Image.LANCZOS),dtype=np.float32)
def blur(a,r):return nd.gaussian_filter(a,r if isinstance(r,tuple) else ((r,r,0) if a.ndim==3 else r))
def lum(a):return a[...,0]*.3+a[...,1]*.59+a[...,2]*.11
def nrm(h,s):
    gx=(np.roll(h,-1,1)-np.roll(h,1,1))*s;gy=(np.roll(h,-1,0)-np.roll(h,1,0))*s
    n=np.dstack([-gx,gy,np.ones_like(h)]);n/=np.linalg.norm(n,axis=2,keepdims=True);return (n*.5+.5)*255
S=128;N=8;AT=np.zeros((S*N,S*N,3),np.float32);AN=np.zeros_like(AT)+(128,128,255);AR=np.zeros(AT.shape[:2],np.float32);AM=np.zeros_like(AR)
def put(k,img,r0=.7,rk=-.5,hs=2.0,met=0.,w=1,h=1,rough=None,height=None):
    r,c=k>>3,k&7;W,H=S*w,S*h;a=rs(img,W,H);AT[r*S:r*S+H,c*S:c*S+W]=a
    hl=lum(rs(img,W*2,H*2)) if height is None else rs(np.dstack([height]*3),W*2,H*2)[...,0];hp=hl-blur(hl,2.5);hp=rs(np.dstack([hp+128]*3),W,H)[...,0]-128
    AN[r*S:r*S+H,c*S:c*S+W]=nrm(hp/255,hs)
    AR[r*S:r*S+H,c*S:c*S+W]=np.clip((rough if rough is not None else r0)+rk*hp/255,.04,1)
    AM[r*S:r*S+H,c*S:c*S+W]=met if np.isscalar(met) else rs(np.dstack([met*255]*3),W,H)[...,0]/255
def m512(m):return m if np.isscalar(m) else m
def noise(r,s=512):return blur(rng.normal(0,1,(s,s)).astype(np.float32),r)
def canvas(w,h,col):im=Image.new('RGB',(w,h),col);return im,ImageDraw.Draw(im)
yy,xx=np.mgrid[0:512,0:512].astype(np.float32);U=xx/511;V=yy/511
# ------------------------------------------------------------------ copper
cu=load('m147c_copper.png');put(0,crop(cu,.05,.6,.05,.95),r0=.32,rk=-.7,hs=3.5,met=.55)
t=crop(cu,.45,.95,.1,.9);t=t*.55+np.array((40,30,22))*.45;put(1,t,r0=.6,rk=-.5,hs=2.,met=.6)
# ------------------------------------------------------------------ enamel
def chips(n,rmin,rmax,seed):
    """irregular chipped-off enamel flakes: thresholded noise blobs (n ~ how many), edges frayed"""
    r=np.random.default_rng(seed);m=np.zeros((512,512),np.float32)
    for i in range(n):
        cx,cy,rr=r.uniform(0,512),r.uniform(0,512),r.uniform(rmin,rmax);w=np.exp(-((xx-cx)**2+(yy-cy)**2)/(2*(rr*1.6)**2))
        m=np.maximum(m,w)
    nz=blur(r.normal(0,1,(512,512)).astype(np.float32),2.2);nz/=nz.std()
    return (m*1.4+nz*.22>.75).astype(np.float32)
wh=np.dstack([240+noise(8)*6,238+noise(8)*6,230+noise(8)*6]);band=(V<.09)|((V>.12)&(V<.135));wh[band]=(30,60,140)   # top = rim band (v near 1 is the image top)
ch=chips(14,4,11,1);steel=np.array((38,36,40));wh=wh*(1-ch[...,None])+steel*ch[...,None]
rust=blur(ch,4)*(1-ch);wh=wh*(1-.5*rust[...,None])+np.array((120,70,40))*.5*rust[...,None]
put(2,wh,rough=np.clip(.15+.6*ch,0,1)[::4,::4],rk=-.1,hs=1.5,height=255-ch*120)
gw=np.dstack([40+0*U,72+0*U,140+0*U]);sp=(rng.random((512,512))>.93).astype(np.float32);sp=blur(sp,1.)>.15;gw[sp]=(235,235,240)
sp2=(rng.random((512,512))>.985);gw[blur(sp2.astype(np.float32),1.5)>.2]=(12,22,52)
c2=chips(8,4,9,2);gw=gw*(1-c2[...,None])+steel*c2[...,None];put(3,gw,rough=np.clip(.2+.6*c2,0,1)[::4,::4],rk=-.1,hs=1.2,height=255-c2*120)
iw=np.dstack([232+noise(10)*8,228+noise(10)*8,214+noise(10)*8]);st=np.clip(noise(30)*3,0,1)*.3;iw=iw*(1-st[...,None])+np.array((170,140,90))*st[...,None]
put(4,iw,r0=.25,rk=-.2,hs=1.)
# ------------------------------------------------------------------ leather, soles, tweed, trim
le=load('m147c_leather.png');put(5,crop(le,.02,.55,.03,.97),r0=.62,rk=-.9,hs=3.5)
tan=crop(le,.45,.98,.03,.97);l=lum(tan)[...,None];tan=np.array((172,112,60))*(l/l.mean())*.95;put(6,tan,r0=.55,rk=-.8,hs=3.)
im,d=canvas(512,512,(34,26,22));a=np.asarray(im,np.float32)+noise(2)[...,None]*14
a[(V>.55)]=a[(V>.55)]*.6+np.array((92,58,34))*.4   # upper half = leather welt
for x in range(0,512,16):a[300:308,x:x+9]=(196,170,120)                          # stitches along the welt
put(7,a,r0=.8,rk=-.5,hs=2.)
tw=np.dstack([110+0*U,98+0*U,80+0*U]);wv=(np.sin(xx*1.6)*np.sin(yy*1.6)>0).astype(np.float32);tw=tw+wv[...,None]*18+noise(1.2)[...,None]*16
tw+=((np.sin(xx*.09)>.97)|(np.sin(yy*.09)>.97))[...,None]*np.array((40,20,10))
put(8,tw,r0=.9,rk=-.4,hs=2.5)
tr=crop(le,.2,.7,.2,.8);l=lum(tr)[...,None];tr=np.array((120,64,30))*(l/l.mean());tr=rs(tr,512,512)
for x in range(0,512,20):tr[40:46,x:x+11]=(220,200,160);tr[466:472,x:x+11]=(220,200,160)
put(9,tr,r0=.5,rk=-.7,hs=3.)
# ------------------------------------------------------------------ toys
mo=load('m147c_mohair.png');put(10,crop(mo,.02,.6,.04,.96),r0=.95,rk=-.3,hs=4.)
im,d=canvas(512,512,(206,170,110));fe=np.asarray(im,np.float32)+noise(1.5)[...,None]*12
im=Image.fromarray(np.clip(fe,0,255).astype(np.uint8));d=ImageDraw.Draw(im)
d.polygon([(200,180),(312,180),(256,262)],fill=(40,26,20))                           # stitched nose (radial centre = muzzle tip)
for i in range(10):d.line([(206+i*10,182),(256,258)],fill=(26,16,12),width=3)
d.line([(256,262),(256,330)],fill=(40,26,20),width=6);d.arc([196,290,256,350],0,180,fill=(40,26,20),width=6);d.arc([256,290,316,350],0,180,fill=(40,26,20),width=6)
put(11,np.asarray(im,np.float32),r0=.95,rk=-.3,hs=2.)
rb=load('m147c_robot.png');put(12,crop(rb,.03,.97,.04,.96),r0=.35,rk=-.5,hs=2.,met=.55)
sd=crop(rb,.32,.62,.35,.62);sd=rs(sd,512,512);put(13,sd,r0=.38,rk=-.5,hs=2.,met=.55)
pw=load('m147c_paintwood.png');red=crop(pw,.5,.95,.05,.95);l=lum(red)[...,None];rr_=np.where(l>205,np.array((205,180,140)),np.array((168,32,26)))*(l/l.mean())*.9
put(14,rr_,r0=.55,rk=-.6,hs=2.5)
cols=[(200,40,40),(240,200,60),(40,90,170),(240,240,230),(40,140,80),(200,40,40)];a=np.zeros((512,512,3),np.float32)
for i in range(6):a[(V>=i/6)&(V<(i+1)/6)]=cols[i]
a=a*(1-.08*(np.sin(xx*.25)>.8)[...,None])+noise(3)[...,None]*6;put(15,a,r0=.3,rk=-.2,hs=1.,met=.3)
# ------------------------------------------------------------------ mirror, walnut, typewriter
mi=load('m147c_mirror.png');put(16,crop(mi,.05,.6,.05,.95)*1.12,r0=.3,rk=.6,hs=.8,met=.3)   # no env map in the city: a fully metal mirror renders black
wl=crop(pw,.05,.5,.05,.95);l=lum(wl)[...,None];wal=np.array((78,46,26))*(l/l.mean())*.85;put(17,wal,r0=.45,rk=-.6,hs=2.5)
cr=np.dstack([22+noise(1.)*10]*3);im=Image.fromarray(np.clip(cr,0,255).astype(np.uint8));d=ImageDraw.Draw(im)
d.text((256,250),'ROYALTON',font=F('DejaVuSerif-Bold.ttf',62),fill=(200,170,90),anchor='mm');d.text((256,318),'QUIET  DE LUXE',font=F('DejaVuSans.ttf',26),fill=(200,170,90),anchor='mm')
d.rectangle([60,200,452,360],outline=(200,170,90),width=3)
put(18,np.asarray(im,np.float32),r0=.55,rk=-.8,hs=3.5,met=.05)
im,d=canvas(512,512,(20,20,20));KEYS='QWERTYUIOPASDFGH'
for i,ch in enumerate(KEYS):
    cx,cy=64+(i&3)*128,64+(i>>2)*128;d.ellipse([cx-62,cy-62,cx+62,cy+62],fill=(196,198,202));d.ellipse([cx-52,cy-52,cx+52,cy+52],fill=(18,18,18))
    d.ellipse([cx-46,cy-46,cx+46,cy+46],fill=(236,232,220));d.text((cx,cy),ch,font=F('DejaVuSans-Bold.ttf',56),fill=(20,20,20),anchor='mm')
km=np.zeros((512,512));km[((xx%128-64)**2+(yy%128-64)**2>52**2)]=.9
put(19,np.asarray(im,np.float32),r0=.3,rk=-.2,hs=1.5,met=km)
pl=np.dstack([16+noise(1)*6]*3);ce=(U<.1)|(U>.9);pl[ce]=(180,182,186);pm=np.where(ce,.95,0.)
put(20,pl,rough=np.where(ce,.25,.8)[::4,::4],rk=-.2,hs=1.,met=pm)
put(21,crop(pw,.05,.55,.05,.95),r0=.75,rk=-.6,hs=3.)
rd=np.hypot(xx-256,yy-256);oak=np.dstack([176+18*np.sin(rd*.45+noise(8)*3),132+14*np.sin(rd*.45+noise(8)*3),82+10*np.sin(rd*.45)])
oak=oak*(1-.25*np.clip(rd/256-.85,0,1)[...,None]*6)+noise(2)[...,None]*8;put(22,oak,r0=.55,rk=-.5,hs=2.)
br=np.dstack([196+0*U,156+0*U,72+0*U])+noise(1)[...,None]*10
im=Image.fromarray(np.clip(br,0,255).astype(np.uint8));d=ImageDraw.Draw(im)
for i in range(0,512,16):d.line([(i,0),(i,40 if i%80 else 70)],fill=(90,64,24),width=3)
for i,dd in enumerate(range(0,180,20)):d.text((40+i*52,120),str(dd),font=F('DejaVuSans.ttf',22),fill=(90,64,24))
put(23,np.asarray(im,np.float32),r0=.3,rk=-.6,hs=2.,met=.9)
gl=crop(load('m147c_globe.png'),.022,.978,.04,.96);gl=gl*np.array((1.,.97,.9));put(24,gl,r0=.35,rk=-.3,hs=1.5,w=2,h=1)
sv_=np.dstack([170+noise(6)*10]*3)*np.array((1,.98,.93));tar=np.clip(noise(20)*2.5,0,1);sv_=sv_*(1-.45*tar[...,None])+np.array((70,56,40))*.45*tar[...,None]
put(26,sv_*1.15,rough=np.clip(.32+.4*tar,0,1)[::4,::4],rk=-.3,hs=1.5,met=.4)   # no env map: keep metals partly diffuse
ju=np.dstack([150+0*U,128+0*U,92+0*U])+((np.sin(xx*.8)>0)^(np.sin(yy*.8)>0))[...,None]*22+noise(1)[...,None]*14;put(27,ju,r0=.95,rk=-.3,hs=3.)
fr=np.dstack([214+0*U,204+0*U,180+0*U]);fr=fr*(.75+.25*np.abs(np.sin(xx*.7))[...,None])+noise(1)[...,None]*10;put(28,fr,r0=.95,rk=-.3,hs=3.)
an=np.arctan2(yy-256,xx-256);spr=(np.sin(rd*.3-an)>0)          # spiral of the rolled layers (back side dark between)
sp_=np.where(spr[...,None],np.array((150,40,36)),np.array((60,46,32)))+noise(2)[...,None]*14;sp_[rd>250]=(70,50,34);put(29,sp_,r0=.95,rk=-.6,hs=3.)
im,d=canvas(512,512,(236,230,214));lines=['Dear Margaret,','','I am sending the sewing','machine back with Harold','on Tuesday.  The bobbin','still sticks but the','man at Kessler\'s says','it only wants oil.','','Yours ever,','    Ruth']
for i,s in enumerate(lines):d.text((48,40+i*38),s,font=F('DejaVuSansMono.ttf',26),fill=(40,40,52))
put(30,np.asarray(im,np.float32)*(1-.08*noise(30)[...,None]),r0=.95,rk=-.2,hs=.8)
put(31,np.dstack([214+noise(6)*8,204+noise(6)*8,176+noise(6)*8]),r0=.85,rk=-.3,hs=1.)
put(32,crop(load('m147c_rug1.png'),.015,.985,.02,.98),r0=.95,rk=-.5,hs=3.,w=2,h=2)
put(34,crop(load('m147c_rug2.png'),.015,.985,.02,.98),r0=.95,rk=-.5,hs=3.,w=2,h=2)
def sv(a,n,q=90):Image.fromarray(np.clip(a,0,255).astype(np.uint8)).save(OUT+n+'.webp',quality=q,method=6)
sv(AT,'goods147b');sv(AN,'goods147b-n');sv(np.dstack([AM*0,AR*255,AM*255]),'goods147b-m')
print('goods147b ok')
