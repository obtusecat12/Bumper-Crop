# V147 D1 Maltose Market densify — stall structure textures. Run from the project root (pip install numpy pillow scipy).
# Sources art-v147/m147_*.png, each generated large on its own (no grid sheets). Shares helpers with maltose145_m2_assets.py.
# Outputs -> bc/dist/assets/l11-v147/:
#  tarp147 / umb147 / crate147 / card147 / moving147 / plaid147 (-n,-r): seamless 256 tiles
#  quilt147 (-n,-r): whole quilt 256x384 (not tiling)
#  box147 (-n,-r): 768x384 atlas, 3 box kinds (rows) x 6 faces (cols) of 128x128 — every face its own crop of the kraft scan
#      plus its own print (fictional brands, arrows, tape, marker words)
#  sign147 (-n): 768x512 atlas, 3 hand-lettered signs (fronts top row, plain backs bottom row)
#  grid147 (-n): RGBA black powder-coat gridwall (one 0.3 m tile, 4 squares of 75 mm)
# Prints SIGN147 for dist/maltose147-stalls.js.
import numpy as np,json,os
from scipy import ndimage as nd
from PIL import Image,ImageDraw,ImageFont
src=open('bc/tools/maltose145_m2_assets.py').read();exec(src[:src.index("brick('m145b_redbrick.png'")]);exec(src[src.index('def surf('):src.index("surf('m145b_lime.png'")])
SRC='art-v147/';OUT='bc/dist/assets/l11-v147/';os.makedirs(OUT,exist_ok=True)
rng=np.random.default_rng(1471)
surf('m147_tarp.png','tarp147',256,(40,96,176),.15,1.4,r0=.55,rk=-.6)
surf('m147_umbrella.png','umb147',256,(170,120,110),0,1.0,r0=.9,rk=-.4)
cw=surf('m147_cratewood.png','crate147',256,(150,135,112),.2,2.2,r0=.9,rk=-.5)
cb=load('m147_cardboard.png')
surf('m147_cardboard.png','card147',256,(150,112,72),.1,1.2,r0=.92,rk=-.3)
surf('m147_moving.png','moving147',256,(92,104,120),.1,2.0,r0=1,rk=-.3)
surf('m147_plaid.png','plaid147',256,(140,40,40),0,1.4,r0=1,rk=-.2)
# quilt: crop the quilt itself (drop the floor strip), 256x384
q=load('m147_quilt.png');H,W=q.shape[:2];q=q[int(H*.02):int(H*.955),int(W*.03):int(W*.97)]
h=lum(q);hp=h-blur(h,3);save(rs(q,256,384),'quilt147');save(normal(rs(hp[...,None].repeat(3,2),256,384)[...,0]/255,2.0),'quilt147-n')
r=np.clip(.95-.3*hp/255,0,1)*255;save(rs(np.dstack([r,r,r]),256,384),'quilt147-r')
print('tiles ok')
# ---------------- cardboard boxes: 3 kinds x 6 faces, each face a different crop + print, drawn at 512 then reduced to 128
F=lambda n,s:ImageFont.truetype('/usr/share/fonts/truetype/dejavu/'+n,s)
KINDS=[dict(brand='HALVORSEN',sub='BANANAS · PRODUCT OF ECUADOR',ink=(40,70,140)),dict(brand='KITCHEN',sub='',ink=(20,20,20),marker=True),
       dict(brand='ORBIS',sub='HOUSEHOLD GOODS  12 x 1 L',ink=(150,30,30))]
CB=cb.copy();BH,BW=CB.shape[:2];bx=np.zeros((384,768,3),np.float32);bn=np.zeros((384,768,3),np.float32)+(128,128,255);br=np.zeros((384,768,3),np.float32)
for ki,K in enumerate(KINDS):
    for fi in range(6):   # 0 front 1 back 2 left 3 right 4 top (flaps) 5 bottom
        x0=int(rng.integers(0,BW-520));y0=int(rng.integers(0,BH-520));a=CB[y0:y0+512,x0:x0+512].copy()
        a=a*(.9+.12*rng.random())+(np.array((150,112,72))-a.reshape(-1,3).mean(0))*.25
        im=Image.fromarray(np.clip(a,0,255).astype(np.uint8));d=ImageDraw.Draw(im);ink=K['ink']
        if fi in(0,1) and not K.get('marker'):
            d.text((256,190),K['brand'],font=F('DejaVuSans-Bold.ttf',58 if fi==0 else 48),fill=ink,anchor='mm')
            d.text((256,270),K['sub'],font=F('DejaVuSans.ttf',20),fill=ink,anchor='mm')
            if fi==0:d.rectangle([60,330,452,334],fill=ink)
        if fi in(2,3):
            for k in range(2):d.polygon([(150+k*150,330),(190+k*150,250),(230+k*150,330),(205+k*150,330),(205+k*150,400),(175+k*150,400),(175+k*150,330)],fill=(30,30,30) if K.get('marker') else ink)
            d.text((256,440),'THIS SIDE UP' if fi==2 else 'HANDLE WITH CARE',font=F('DejaVuSans-Bold.ttf',30),fill=(30,30,30) if K.get('marker') else ink,anchor='mm')
            if fi==3 and not K.get('marker'):d.text((256,120),'LOT %d-%02d'%(4700+ki*13,fi*7),font=F('DejaVuSansMono.ttf',30),fill=ink,anchor='mm')
        if K.get('marker') and fi in(0,2):
            d.text((256,200 if fi==0 else 110),['KITCHEN','MISC.'][fi==2],font=F('DejaVuSans-Bold.ttf',84),fill=(18,18,22),anchor='mm')
            d.line([(110,270),(400,262)],fill=(18,18,22),width=8)
        if fi==4:   # top: brown packing tape strip down the middle + the flap seam
            d.rectangle([0,232,512,280],fill=(176,132,70));d.line([(0,256),(512,256)],fill=(90,64,36),width=3)
            for k in range(30):x=int(rng.integers(0,512));d.line([(x,232),(x+int(rng.integers(-8,8)),280)],fill=(196,156,92),width=2)
        if fi in(0,1):   # tape over the top edge
            d.rectangle([226,0,286,80],fill=(176,132,70))
        a=np.asarray(im,dtype=np.float32)
        # scuffed corners / edge crush
        yy,xx=np.mgrid[0:512,0:512]/511.;e=np.minimum(np.minimum(xx,1-xx),np.minimum(yy,1-yy));a*=(.82+.18*np.clip(e/.06,0,1))[...,None]
        s=rs(a,128,128);bx[ki*128:(ki+1)*128,fi*128:(fi+1)*128]=s
        hl=lum(a);hp=hl-blur(hl,3);hp[e<.02]-=40
        nm=normal(hp/255,1.5);bn[ki*128:(ki+1)*128,fi*128:(fi+1)*128]=rs(nm,128,128)
        rr=np.clip(.9-.3*hp/255,0,1)*255;br[ki*128:(ki+1)*128,fi*128:(fi+1)*128]=rs(np.dstack([rr,rr,rr]),128,128)
save(bx,'box147');save(bn,'box147-n');save(br,'box147-r')
# ---------------- hand-lettered signs: key the green, keep the largest card, crop, front + plain back
SN=['m147_sign_rec','m147_sign_blk','m147_sign_bk'];sa=np.zeros((512,768,4),np.float32);sn=np.zeros((512,768,3),np.float32)+(128,128,255);SIGN=[]
for i,n in enumerate(SN):
    a=np.asarray(Image.open(SRC+n+'.png').convert('RGBA'),dtype=np.float32)
    g=(a[...,1]>a[...,0]+18)&(a[...,1]>a[...,2]+18);m=(a[...,3]>100)&~g;m=nd.binary_opening(m,iterations=3)
    lab,k=nd.label(m);sz=nd.sum(m,lab,range(1,k+1));m=nd.binary_fill_holes(lab==(1+np.argmax(sz)));m=nd.binary_erosion(m,iterations=3)
    ys,xs=np.where(m);y0,y1,x0,x1=ys.min(),ys.max()+1,xs.min(),xs.max()+1;c=a[y0:y1,x0:x1,:3];mm=m[y0:y1,x0:x1]
    # despill green fringe
    gg=c[...,1];c[...,1]=np.minimum(gg,np.maximum(c[...,0],c[...,2])*1.05)
    asp=(x1-x0)/(y1-y0);cwid,chei=256,256;fw=min(cwid,int(chei*asp));fh=min(chei,int(cwid/asp))
    def put(img,row):
        im=Image.fromarray(np.clip(img,0,255).astype(np.uint8)).resize((fw,fh),Image.LANCZOS);al=Image.fromarray((mm*255).astype(np.uint8)).resize((fw,fh),Image.LANCZOS)
        ox=i*256+(256-fw)//2;oy=row*256+(256-fh)//2;sa[oy:oy+fh,ox:ox+fw,:3]=np.asarray(im);sa[oy:oy+fh,ox:ox+fw,3]=np.where(np.asarray(al)>128,255,0)
        return ox,oy
    ox,oy=put(c,0)
    # back: card colour (median of the bright card pixels) + the front's low-contrast grain mirrored, no lettering
    med=np.median(c[mm&(lum(c)>np.percentile(lum(c)[mm],40))],axis=0);hl=lum(c);grain=(hl-blur(hl,6))
    nz=blur(rng.normal(0,1,hl.shape).astype(np.float32),1.2);back=np.clip(med+nz[...,None]*6,0,255)*.92;put(back,1)
    hh=lum(c);hp=hh-blur(hh,3);sn[oy:oy+fh,ox:ox+fw]=rs(normal(hp/255,1.2),fw,fh)
    SIGN.append(dict(n=n[5:],asp=round(asp,3),u0=round(ox/768,4),u1=round((ox+fw)/768,4),v0=round(1-(oy+fh)/512,4),v1=round(1-oy/512,4)))
Image.fromarray(sa.astype(np.uint8)).save(OUT+'sign147.webp',quality=90,method=6);save(sn,'sign147-n')
# ---------------- gridwall: 0.3 m tile, 4 x 4 squares of 75 mm, 6 mm wire, black powder coat, alpha
S=1200;img=Image.new('RGBA',(S,S),(30,30,32,0));d=ImageDraw.Draw(img)
for k in range(4):
    p=k*S/4+S/8
    d.line([(p,0),(p,S)],fill=(36,36,38,255),width=26);d.line([(p-6,0),(p-6,S)],fill=(84,84,88,255),width=6)
    d.line([(0,p),(S,p)],fill=(32,32,34,255),width=26);d.line([(0,p-6),(S,p-6)],fill=(78,78,82,255),width=6)
w=img.resize((256,256),Image.LANCZOS);a=np.asarray(w,dtype=np.float32);a[...,3]=np.where(a[...,3]>90,255,0)
Image.fromarray(a.astype(np.uint8)).save(OUT+'grid147.webp',quality=92,method=6)
gl=a[...,:3].mean(2);save(normal(blur(gl,1)/255,3.0),'grid147-n')
print('SIGN147',json.dumps(SIGN,separators=(',',':')))
