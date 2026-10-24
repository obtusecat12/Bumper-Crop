# V147 D2 Maltose Market goods batch 1 — records / books / framed paintings / clocks / lamps / radios / cameras / porcelain.
# Run from the project root (numpy pillow scipy). Sources art-v147/m147b_*.png, each generated large on its own (no grid sheets);
# the rest (sleeve designs, spine titles, vinyl grooves, mouldings, chrome, lamp linen) drawn here at 512 and reduced.
# Output -> bc/dist/assets/l11-v147/goods147(.webp, -n, -m = G roughness / B metalness, three.js channel layout): 1024 atlas, 8 x 8 cells of 128 (cell k = row k>>3, col k&7):
#  0 1   LP covers (generated)            2..11 LP covers (drawn: each its own design / title / wear)
#  12    sleeve top edges: 16 bands (one per sleeve colour)    13 sleeve backs (track list)
#  14 15 vinyl discs (grooves + red / blue label, radial uv)
#  16..23 book covers (book cloth, 8 tints, blind border / gilt title)   24..31 spines: 4 strips of 32 px each = 32 spines
#  32-33/40-41 land painting  34-35/42-43 portrait  36-37/44-45 still life  38-39/46-47 seascape (2 x 2 cells each)
#  48 page block side  49 page block top  50 gilt moulding  51 walnut moulding  52 canvas back + stretcher
#  53 mantel clock dial (radial)  54 mahogany (clock case)  55 radio front  56 radio cabinet walnut  57 camera leatherette
#  58 camera top plate (brushed chrome, engraved)  59 quadrants: lens front TL, alarm dial TR, bakelite knob BL, shutter dial BR
#  60 willow plate (radial)  61 chintz china  62 lamp-shade linen (pleats)  63 white glaze + gold band (cup rims / plate backs)
import numpy as np,os,math
from PIL import Image,ImageDraw,ImageFont,ImageFilter
from scipy import ndimage as nd
SRC='art-v147/';OUT='bc/dist/assets/l11-v147/';os.makedirs(OUT,exist_ok=True)
rng=np.random.default_rng(14702)
F=lambda n,s:ImageFont.truetype('/usr/share/fonts/truetype/dejavu/'+n,s)
def load(n):return np.asarray(Image.open(SRC+n).convert('RGB'),dtype=np.float32)
def rs(a,w,h):return np.asarray(Image.fromarray(np.clip(a,0,255).astype(np.uint8)).resize((w,h),Image.LANCZOS),dtype=np.float32)
def blur(a,r):return nd.gaussian_filter(a,r if isinstance(r,tuple) else ((r,r,0) if a.ndim==3 else r))
def lum(a):return a[...,0]*.3+a[...,1]*.59+a[...,2]*.11
def nrm(h,s):
    gx=(np.roll(h,-1,1)-np.roll(h,1,1))*s;gy=(np.roll(h,-1,0)-np.roll(h,1,0))*s
    n=np.dstack([-gx,gy,np.ones_like(h)]);n/=np.linalg.norm(n,axis=2,keepdims=True);return (n*.5+.5)*255
S=128;N=8;AT=np.zeros((S*N,S*N,3),np.float32);AN=np.zeros_like(AT)+(128,128,255);AR=np.zeros(AT.shape[:2],np.float32);AM=np.zeros_like(AR)
def put(k,img,r0=.7,rk=-.5,hs=2.0,met=0.,w=1,h=1,rough=None):
    """img (any size, RGB float) -> cell k (w x h cells); normal + roughness from its own high-pass"""
    r,c=k>>3,k&7;W,H=S*w,S*h;a=rs(img,W,H);AT[r*S:r*S+H,c*S:c*S+W]=a
    hl=lum(rs(img,W*2,H*2));hp=hl-blur(hl,2.5);hp=rs(np.dstack([hp+128]*3),W,H)[...,0]-128
    AN[r*S:r*S+H,c*S:c*S+W]=nrm(hp/255,hs)
    AR[r*S:r*S+H,c*S:c*S+W]=np.clip((rough if rough is not None else r0)+rk*hp/255,.04,1)
    AM[r*S:r*S+H,c*S:c*S+W]=met if np.isscalar(met) else rs(np.dstack([met*255]*3),W,H)[...,0]/255
def wear(a,amt=1.,seed=0):
    """ring wear, corner fray, grime: a is 512 float"""
    H,W=a.shape[:2];yy,xx=np.mgrid[0:H,0:W]/max(H,W);e=np.minimum(np.minimum(xx,1-xx),np.minimum(yy,1-yy))
    nz=blur(rng.normal(0,1,(H,W)).astype(np.float32),6)*14
    a=a*(1-.18*amt*np.clip(1-e/.05,0,1))[...,None]+nz[...,None]*amt
    return np.clip(a*(1-.06*amt)+np.array((210,196,160))*.06*amt,0,255)
def canvas(w,h,col):im=Image.new('RGB',(w,h),col);return im,ImageDraw.Draw(im)
# ------------------------------------------------------------------ LP covers
for k,n in((0,'m147b_lp1.png'),(1,'m147b_lp2.png')):
    a=load(n);H,W=a.shape[:2];m=int(W*.015);put(k,a[m:H-m,m:W-m],r0=.72)
TITLES=[('SYMPHONY No. 5','Berlin Kammerorchester',(232,226,210),(150,24,30)),('SURF CITY STOMP','The Breakers',(40,170,190),(250,220,60)),
 ('HONKY TONK HEART','Wade Tillman',(196,120,60),(250,240,220)),('MOOG ODYSSEY','Dr. Ferro',(20,20,30),(240,90,200)),
 ('CHA CHA CHA!','Orquesta Linares',(220,60,40),(250,230,90)),('ORGAN FAVOURITES','Bill Haskett at the Hammond',(110,150,90),(250,250,240)),
 ('GOSPEL TRAIN','The Mt. Zion Singers',(40,40,90),(240,200,70)),('LIVE AT THE PALAIS','Les Camarades',(240,236,226),(20,20,20)),
 ('CHRISTMAS WITH','The Holloway Family',(170,30,40),(240,240,230)),('DISCO INFERNO 79','Various Artists',(60,10,80),(255,140,40))]
for i,(t,ar,bg,fg) in enumerate(TITLES):
    im,d=canvas(512,512,bg);r=np.random.default_rng(i+30)
    st=i%5
    if st==0:   # classical: centred oval portrait + rules
        d.rectangle([40,40,472,472],outline=fg,width=6);d.ellipse([146,120,366,360],fill=tuple(int(c*.6) for c in bg),outline=fg,width=4)
        d.ellipse([206,160,306,270],fill=(70,50,40));d.rectangle([190,260,322,350],fill=(40,30,30))
    elif st==1:   # bold stripes / waves
        for y in range(0,512,40):d.rectangle([0,y,512,y+18],fill=tuple(min(255,int(c*1.25)) for c in bg))
        d.ellipse([280,60,470,250],fill=fg)
    elif st==2:   # photo-ish block
        d.rectangle([0,0,512,330],fill=tuple(int(c*.55) for c in bg))
        for kk in range(40):x=int(r.integers(0,512));d.line([(x,330),(x+int(r.integers(-60,60)),int(r.integers(120,330)))],fill=tuple(int(c*.8) for c in bg),width=3)
        d.ellipse([200,140,300,250],fill=(220,180,150));d.rectangle([180,240,320,330],fill=(60,40,30))
    elif st==3:   # geometric circles
        for kk in range(7):rr=60+kk*28;d.ellipse([256-rr,220-rr,256+rr,220+rr],outline=fg if kk%2 else tuple(int(c*.6+60) for c in fg),width=10)
    else:   # type-only with big shapes
        d.polygon([(0,512),(512,140),(512,512)],fill=tuple(int(c*.7) for c in bg));d.rectangle([60,60,200,200],fill=fg)
    tf=F('DejaVuSans-Bold.ttf',46 if len(t)<14 else 36);d.text((256,410),t,font=tf,fill=fg,anchor='mm');d.text((256,462),ar,font=F('DejaVuSerif-Italic.ttf' if os.path.exists('/usr/share/fonts/truetype/dejavu/DejaVuSerif-Italic.ttf') else 'DejaVuSerif.ttf',24),fill=fg,anchor='mm')
    if i%3==0:d.text((60,40),'STEREO',font=F('DejaVuSans-Bold.ttf',22),fill=fg)
    if i%4==1:d.rectangle([400,30,480,70],fill=(250,250,240));d.text((440,50),'$%d'%(2+i%4),font=F('DejaVuSans-Bold.ttf',26),fill=(200,20,20),anchor='mm')
    a=np.asarray(im.filter(ImageFilter.GaussianBlur(.8)),np.float32)
    # ring wear: the disc's circle rubbed lighter
    yy,xx=np.mgrid[0:512,0:512];rd=np.hypot(xx-256,yy-256);ring=np.exp(-((rd-236)/7)**2)+.5*np.exp(-((rd-60)/5)**2)
    a=a+ring[...,None]*28*(.5+r.random());put(2+i,wear(a,1.+.6*r.random()),r0=.75)
# sleeve top edges: 16 horizontal bands of the covers' main colours with a crease line
im,d=canvas(512,512,(0,0,0));cols=[(60,90,140),(230,220,200),(40,170,190),(196,120,60),(20,20,30),(220,60,40),(110,150,90),(40,40,90),(240,236,226),(170,30,40),(60,10,80),(210,200,180),(30,30,30),(120,40,30),(200,170,60),(80,120,110)]
for i,c in enumerate(cols):d.rectangle([0,i*32,512,i*32+31],fill=c);d.line([(0,i*32+15),(512,i*32+15)],fill=tuple(int(x*.75) for x in c),width=2)
a=np.asarray(im,np.float32);a=wear(a,.8);put(12,a,r0=.75)
im,d=canvas(512,512,(226,220,204))
for col in(0,1):
    for j in range(7):d.text((40+col*240,60+j*42),'%s%d.  %s'%('AB'[col],j+1,['Moonglow','Tin Roof','Back Porch','Valencia','Sundown','Lullaby','Coda'][(j+col*3)%7]),font=F('DejaVuSans.ttf',22),fill=(40,40,40))
d.rectangle([40,380,472,470],outline=(40,40,40),width=3);d.text((256,425),'HIGH FIDELITY  ·  33 1/3 RPM',font=F('DejaVuSans-Bold.ttf',22),fill=(40,40,40),anchor='mm')
put(13,wear(np.asarray(im,np.float32),1.2),r0=.8)
# vinyl discs: fine grooves (radial uv: cell centre = spindle), label + spindle hole, sheen bands
for k,lab in((14,(180,30,30)),(15,(30,60,150))):
    yy,xx=np.mgrid[0:512,0:512];rd=np.hypot(xx-256,yy-256);an=np.arctan2(yy-256,xx-256)
    g=14+6*np.sin(rd*2.2)+4*(np.sin(rd*.21)>.96)*12;g=g+10*np.abs(np.cos(an*1))*(rd>90)
    a=np.dstack([g,g,g]).astype(np.float32);lb=rd<88;a[lb]=lab;a[(rd<88)&(np.abs(yy-256)<4)&(rd>20)]=(240,230,210)
    im=Image.fromarray(np.clip(a,0,255).astype(np.uint8));d=ImageDraw.Draw(im);d.text((256,205),'MERIDIAN' if k==14 else 'TROUBADOUR',font=F('DejaVuSans-Bold.ttf',18),fill=(240,230,210),anchor='mm')
    d.text((256,306),'33⅓' if k==14 else 'SIDE B',font=F('DejaVuSans.ttf',16),fill=(240,230,210),anchor='mm');a=np.asarray(im,np.float32);a[rd<7]=(5,5,5);a[rd>255]=(12,12,12)
    rough=np.where(rd<88,.7,.22);put(k,a,rough=rs(np.dstack([rough*255]*3),128,128)[...,0]/255,rk=-.3,hs=1.2)
# ------------------------------------------------------------------ books
cl=load('m147b_bookcloth.png');CH,CW=cl.shape[:2]
TINTS=[(120,28,30),(30,50,90),(40,80,50),(90,60,30),(30,30,32),(140,110,60),(80,30,70),(150,140,120)]
for i,t in enumerate(TINTS):
    x0=int(rng.integers(0,CW-560));y0=int(rng.integers(0,CH-560));c=cl[y0:y0+512,x0:x0+512].copy()
    l=lum(c)[...,None];c=np.array(t)*(l/l.mean())*(.9+.2*rng.random())
    im=Image.fromarray(np.clip(c,0,255).astype(np.uint8));d=ImageDraw.Draw(im)
    if i%2==0:d.rectangle([30,30,482,482],outline=tuple(int(x*.7) for x in t),width=8)   # blind-stamped border
    if i%3==0:d.text((256,150),['POEMS','ATLAS','SERMONS','HISTORY'][i%4],font=F('DejaVuSerif-Bold.ttf',52),fill=(196,164,90),anchor='mm')
    put(16+i,wear(np.asarray(im,np.float32),1.),r0=.92,rk=-.3)
BT=['DICKENS','A HISTORY OF ROME','BIRDS OF NORTH AMERICA','THE YEARLING','COOKERY','MOBY DICK','ENCYCLOPAEDIA VOL. IV','SHORT STORIES','GARDENING','HYMNAL',
    'GREAT EXPECTATIONS','POPULAR MECHANICS','LIFE OF LINCOLN','WAR AND PEACE','ROAD ATLAS 1958','THE BIBLE','ANNE OF GREEN GABLES','CHEMISTRY','TREASURE ISLAND','POEMS',
    'GONE WITH THE WIND','THE ODYSSEY','HOME DOCTOR','SEA STORIES','FARMER\'S ALMANAC','READER\'S DIGEST','ULYSSES','MIDDLEMARCH','THE JUNGLE BOOK','IVANHOE','JANE EYRE','DRACULA']
for s,t in enumerate(BT):
    cell=24+(s>>2);sub=s&3;tint=TINTS[(s*5)%8];x0=int(rng.integers(0,CW-560));y0=int(rng.integers(0,CH-140))
    c=cl[y0:y0+128,x0:x0+512].copy();l=lum(c)[...,None];c=np.array(tint)*(l/l.mean())*(.85+.3*rng.random())
    if s%7==3:c=c*0+np.array((214,200,170))+(l-l.mean())*.5   # a paper dust-jacket spine
    im=Image.fromarray(np.clip(c,0,255).astype(np.uint8));d=ImageDraw.Draw(im);gold=(200,168,96) if s%7!=3 else (40,30,30)
    for xb in(18,494):d.rectangle([xb,10,xb+6,118],fill=gold)
    d.text((256,64),t,font=F('DejaVuSerif-Bold.ttf',40 if len(t)<14 else 30),fill=gold,anchor='mm')
    a=wear(np.asarray(im,np.float32),1.1);r,cc=cell>>3,cell&7
    AT[r*S+sub*32:r*S+sub*32+32,cc*S:cc*S+S]=rs(a,128,32);hl=lum(rs(a,256,64));hp=hl-blur(hl,2);hp=rs(np.dstack([hp+128]*3),128,32)[...,0]-128
    AN[r*S+sub*32:r*S+sub*32+32,cc*S:cc*S+S]=nrm(hp/255,2.);AR[r*S+sub*32:r*S+sub*32+32,cc*S:cc*S+S]=np.clip(.85-.3*hp/255,0,1)
# ------------------------------------------------------------------ paintings (2 x 2 cells each) + frames
for k,n,crop in((32,'m147b_paint_land.png',.02),(34,'m147b_paint_port.png',.03),(36,'m147b_paint_still.png',.03),(38,'m147b_paint_sea.png',.02)):
    a=load(n);H,W=a.shape[:2];a=a[int(H*crop):int(H*(1-crop)),int(W*crop):int(W*(1-crop))];put(k,a,r0=.42,rk=-.6,hs=3.,w=2,h=2)
# page block side (fine page lines) + top (fore-edge, yellowed)
yy,xx=np.mgrid[0:512,0:512].astype(np.float32);pl=226-14*(np.sin(yy*2.6+np.sin(xx*.02)*3)>.6)-blur(rng.normal(0,1,(512,512)).astype(np.float32),3)*20
side=np.dstack([pl,pl*.96,pl*.86]);side=side*(1-.15*np.exp(-(np.minimum(xx,511-xx)/30)))[...,None];put(48,side,r0=.95)
top=np.dstack([pl.T*.98,pl.T*.93,pl.T*.8]);put(49,top,r0=.95)
# gilt moulding: profile across v (bead row, cove, ogee), gold leaf with bole showing through on worn highs; walnut moulding
v=np.linspace(0,1,512)[:,None]*np.ones((1,512));u=np.linspace(0,1,512)[None,:]*np.ones((512,1))
PI=math.pi;prof=(np.sin(v*PI*5)*.5+.5)*(v<.6)+(v>=.6)*(1-np.abs(np.sin((v-.6)*PI*2.5)))
bead=(v>.15)&(v<.28);prof=prof+bead*(np.abs(np.sin(u*PI*90))*.6)
gold=np.dstack([196+40*prof,150+40*prof,70+30*prof]);bole=np.array((140,60,40))
worn=(blur(rng.random((512,512)).astype(np.float32),2)>.62)&(prof>.8);gold[worn]=gold[worn]*.4+bole*.6
gold=gold*(1-.35*blur((rng.random((512,512))>.97).astype(np.float32),1.5)[...,None]);put(50,gold,r0=.38,rk=-.8,hs=4.,met=.7)
wal=load('m147b_radio.png');Hh,Ww=wal.shape[:2];wc=wal[int(Hh*.02):int(Hh*.12),int(Ww*.05):int(Ww*.95)]
wc=rs(wc,512,512)*(1-.25*(np.sin(v*PI*4)>.7)[...,None]);put(51,wc*.8,r0=.5,rk=-.6,hs=3.)
# canvas back: raw linen + stretcher bars at the edges + a gallery sticker
ln=load('m147b_bookcloth.png')[0:512,0:512];l=lum(ln)[...,None];back=np.array((196,180,150))*(l/l.mean())
im=Image.fromarray(np.clip(back,0,255).astype(np.uint8));d=ImageDraw.Draw(im)
for bb in([0,0,512,50],[0,462,512,512],[0,0,50,512],[462,0,512,512],[231,0,281,512]):d.rectangle(bb,fill=(170,130,80))
d.rectangle([300,300,440,380],fill=(236,230,210));d.text((370,340),'LOT 214',font=F('DejaVuSans.ttf',22),fill=(60,40,30),anchor='mm');put(52,np.asarray(im,np.float32),r0=.95)
# ------------------------------------------------------------------ clocks / radio / camera
dial=load('m147b_clockdial.png');put(53,dial,r0=.35,rk=-.4)
mah=load('m147b_radio.png')[int(Hh*.82):int(Hh*.98),int(Ww*.1):int(Ww*.9)];mah=rs(mah,512,512)*np.array((1.05,.8,.7));put(54,mah,r0=.4,rk=-.7,hs=2.5)
fr=load('m147b_radio.png');put(55,fr,r0=.6)
cab=load('m147b_radio.png')[0:int(Hh*.1),:];cab=rs(cab,512,512);put(56,cab,r0=.5,rk=-.6)
le=load('m147b_leatherette.png')[:, :768];put(57,le,r0=.7,rk=-1.,hs=4.)
im,d=canvas(512,512,(176,178,182));a=np.asarray(im,np.float32)+blur(rng.normal(0,1,(512,512,1)).astype(np.float32)*np.ones((1,1,3)),(0,12,0))*30   # brushed
im=Image.fromarray(np.clip(a,0,255).astype(np.uint8));d=ImageDraw.Draw(im);d.text((256,200),'KESTREL 35',font=F('DejaVuSans-Bold.ttf',48),fill=(30,30,30),anchor='mm')
d.text((256,280),'No. 418827',font=F('DejaVuSansMono.ttf',28),fill=(40,40,40),anchor='mm');d.rectangle([0,0,512,512],outline=(90,90,95),width=10)
put(58,np.asarray(im,np.float32),r0=.25,rk=-.4,met=.95)
# quadrants of 59: lens front / alarm dial / knob top / shutter dial (each drawn at 512 -> 64)
def disc(draw_fn,bg=(0,0,0)):
    im,d=canvas(512,512,bg);draw_fn(d);return np.asarray(im,np.float32)
def lens(d):
    d.ellipse([0,0,511,511],fill=(18,18,20));d.ellipse([40,40,471,471],fill=(36,36,40))
    for k,t in enumerate('KESTREL ANASTIGMAT 1:2.8 f=45mm'):a=2*PI*k/34-PI*.8;d.text((256+200*math.cos(a),256+200*math.sin(a)),t,font=F('DejaVuSans.ttf',22),fill=(230,230,230),anchor='mm')
    d.ellipse([110,110,401,401],fill=(40,60,80));d.ellipse([170,150,300,250],fill=(120,150,180));d.ellipse([140,140,371,371],outline=(90,40,120),width=6)
def alarm(d):
    d.ellipse([0,0,511,511],fill=(236,232,216))
    for n in range(1,13):a=n/12*2*PI-PI/2;d.text((256+190*math.cos(a),256+190*math.sin(a)),str(n),font=F('DejaVuSans-Bold.ttf',52),fill=(20,20,20),anchor='mm')
    d.line([(256,256),(256,110)],fill=(20,20,20),width=12);d.line([(256,256),(370,300)],fill=(20,20,20),width=14);d.line([(256,256),(180,140)],fill=(200,30,30),width=5)
    d.text((256,350),'WESTCLOX' if False else 'BRAXTON',font=F('DejaVuSans.ttf',26),fill=(60,60,60),anchor='mm')
def knob(d):
    d.ellipse([0,0,511,511],fill=(70,40,24))
    for k in range(24):a=k/24*2*PI;d.line([(256+200*math.cos(a),256+200*math.sin(a)),(256+250*math.cos(a),256+250*math.sin(a))],fill=(40,22,12),width=14)
    d.ellipse([150,150,361,361],fill=(96,58,34));d.line([(256,256),(256,80)],fill=(220,200,160),width=12)
def shut(d):
    d.ellipse([0,0,511,511],fill=(170,172,176))
    for k,t in enumerate(['B','1','2','4','8','15','30','60','125','250','500']):a=k/11*2*PI;d.text((256+170*math.cos(a),256+170*math.sin(a)),t,font=F('DejaVuSans-Bold.ttf',34),fill=(20,20,20),anchor='mm')
    d.ellipse([200,200,311,311],fill=(120,122,126))
q=np.zeros((512,512,3),np.float32)
for (oy,ox),fn,bg in(((0,0),lens,(0,0,0)),((0,256),alarm,(150,150,150)),((256,0),knob,(0,0,0)),((256,256),shut,(150,150,150))):q[oy:oy+256,ox:ox+256]=rs(disc(fn,bg),256,256)
mq=np.zeros((512,512));mq[256:,256:]=.9;mq[:256,256:]=0
put(59,q,r0=.2,rk=-.3,met=mq)
# ------------------------------------------------------------------ porcelain + lamp
pl=load('m147b_plate.png');put(60,pl,r0=.14,rk=-.2,hs=1.)
ch=load('m147b_china.png')[:, :768];put(61,ch,r0=.14,rk=-.2,hs=.8)
ln=load('m147b_bookcloth.png')[100:612,300:812];l=lum(ln);lin=np.dstack([238+(l-l.mean())*.6,226+(l-l.mean())*.6,196+(l-l.mean())*.5])
lin=lin*(1-.1*(np.sin(np.linspace(0,1,512)[None,:,None]*PI*32)>.3));put(62,lin,r0=.95,rk=-.3)
im,d=canvas(512,512,(244,242,236));d.rectangle([0,0,512,34],fill=(196,156,70));d.rectangle([0,52,512,60],fill=(196,156,70))
a=np.asarray(im,np.float32)+blur(rng.normal(0,1,(512,512,1)).astype(np.float32)*np.ones((1,1,3)),(3,3,0))*4;mm=np.zeros((512,512));mm[:61]=.8
put(63,a,r0=.12,rk=-.2,hs=.5,met=mm)
# ------------------------------------------------------------------ save
def sv(a,n,q=90):Image.fromarray(np.clip(a,0,255).astype(np.uint8)).save(OUT+n+'.webp',quality=q,method=6)
sv(AT,'goods147');sv(AN,'goods147-n');Mm=np.dstack([AM*0,AR*255,AM*255]);sv(Mm,'goods147-m')
print('goods147 ok')
