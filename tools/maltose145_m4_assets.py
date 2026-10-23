# V145 M4 Maltose Market (麦芽糖市场): stall hardware — pop-up tents, folding tables, tablecloths, garment rack + hung clothes,
# chrome wire rack, price / SALE signs, rug wall. Run from the project root (pip install numpy pillow scipy).
# Sources art-v145/m145d_*.png, each generated large on its own (no grid sheets). Shares helpers with maltose145_m2_assets.py.
# Outputs -> bc/dist/assets/l11-v145/:
#  canvas145 / tabtop145 / clw145 / clr145 / clp145 / tsteel145 / dsteel145 / chrome145 (-n,-r): seamless tiles
#  wire145: RGBA chrome wire-shelf grid (procedural, drawn at 1024 then reduced)
#  garm145 (-n,-r): 1024x1024 atlas, 4 cols x 8 rows of 256x128; garment i: col i%4, front row 2*(i//4), back row +1
#  sign145 (-n): 1280x512 atlas, 5 signs (fronts top row, plain card backs bottom row)
#  rug145 (-n): 1280x512 atlas, 5 rugs (256x512 each)
# Prints GARM / SIGN / RUG tables for dist/maltose145-stalls.js.
import numpy as np,json
from scipy import ndimage as nd
src=open('bc/tools/maltose145_m2_assets.py').read();exec(src[:src.index("brick('m145b_redbrick.png'")]);exec(src[src.index('def surf('):src.index("surf('m145b_lime.png'")])
rng=np.random.default_rng(1454)
# ---------------- seamless material tiles
surf('m145d_canvas.png','canvas145',256,(226,226,222),.25,1.2,r0=.85,rk=-.5)
surf('m145d_tabletop.png','tabtop145',256,(214,214,208),.3,1.5,r0=.7,rk=-.6)
surf('m145d_cloth_white.png','clw145',256,(222,220,212),.2,1.0,r0=.9,rk=-.4)
surf('m145d_cloth_red.png','clr145',256,(150,22,30),.3,.9,r0=.8,rk=-.5)
surf('m145d_cloth_pink.png','clp145',256,(196,40,92),.3,1.0,r0=.9,rk=-.4)
surf('m145d_steel_white.png','tsteel145',128,(218,218,214),.3,2.0,r0=.55,rk=-.8)
surf('m145d_steel_dark.png','dsteel145',128,(62,64,66),.35,2.5,r0=.6,rk=-.8)
surf('m145d_chrome.png','chrome145',128,(170,174,178),.2,1.0,r0=.25,rk=-.5)
print('tiles ok')
# ---------------- wire shelf grid (one 0.25 m tile): 10 long wires + one cross wire, chrome, alpha
S=1024;img=Image.new('RGBA',(S,S),(160,164,168,0));from PIL import ImageDraw;d=ImageDraw.Draw(img)
for i in range(10):
    x=(i+.5)*S/10;d.line([(x,0),(x,S)],fill=(196,200,204,255),width=14);d.line([(x-3,0),(x-3,S)],fill=(236,238,240,255),width=4)
for y in(S*.5,):
    d.line([(0,y),(S,y)],fill=(150,154,158,255),width=20);d.line([(0,y-4),(S,y-4)],fill=(226,228,230,255),width=5)
w=img.resize((256,256),Image.LANCZOS);a=np.asarray(w,dtype=np.float32);a[...,3]=np.where(a[...,3]>90,255,0)
Image.fromarray(a.astype(np.uint8)).save(OUT+'wire145.webp',quality=92,method=6)
# ---------------- garments: key, despill, silhouette analysis, front + synthesised back
GN=['jk_white','jk_red','jk_navy','jk_plum','jk_black','sw_burgundy','sw_grey','sw_mustard']
RO=[.6,.55,.5,.55,.95,.97,.96,.97]     # silk / brocade / velvet / knits
CW,CH=256,128;atl=np.zeros((1024,1024,4),np.float32);atn=np.zeros((1024,1024,3),np.float32)+(128,128,255);atr=np.zeros((1024,1024,3),np.float32)+200
def key(n):
    a=np.asarray(Image.open(SRC+'m145d_%s.png'%n).convert('RGBA'),dtype=np.float32)
    g=(a[...,1]>a[...,0]+25)&(a[...,1]>a[...,2]+25);m=(a[...,3]>100)&~g;m=nd.binary_opening(m,iterations=2)
    lab,k=nd.label(m);sz=nd.sum(m,lab,range(1,k+1));m=nd.binary_fill_holes(lab==(1+np.argmax(sz)));m=nd.binary_erosion(m,iterations=2)
    c=a[...,:3].copy();mx=np.maximum(c[...,0],c[...,2]);c[...,1]=np.minimum(c[...,1],mx+6)   # despill
    # bleed edge colours outward so mips never pull green / black into the silhouette
    idx=nd.distance_transform_edt(~m,return_distances=False,return_indices=True);c=c[idx[0],idx[1]]
    return c,m
def bbox(m):ys,xs=np.where(m);return xs.min(),xs.max(),ys.min(),ys.max()
GARM=[]
for i,n in enumerate(GN):
    c,m=key(n);x0,x1,y0,y1=bbox(m);H=y1-y0;pad=6;x0-=pad;x1+=pad;y0-=pad;y1+=pad
    hem=int(y0+H*.95);tc=np.where(m[hem])[0];tx0,tx1=tc.min(),tc.max();tw=tx1-tx0
    # shoulder line: topmost silhouette row a little inside each torso edge; collar top = centre column
    def top(x):return np.where(m[:,x])[0].min()
    sh=min(top(int(tx0+tw*.12)),top(int(tx1-tw*.12)));col=top(int((tx0+tx1)/2))
    sleeves=[]
    for side in(-1,1):
        # armpit: lowest silhouette row in the column just outside the torso edge
        ex=tx0-int(tw*.04) if side<0 else tx1+int(tw*.04);arm=np.where(m[:,ex])[0];armp=arm.max();armt=arm.min()
        cols=np.arange(x0,tx0-int(tw*.02)) if side<0 else np.arange(tx1+int(tw*.02),x1)
        far=[x for x in cols if m[:,x].any()];fx=far[0] if side<0 else far[-1]
        band=[x for x in far if abs(x-fx)<=int(tw*.06)];ys2=np.concatenate([np.where(m[:,x])[0] for x in band]);cy=float(ys2.mean());cw=float(ys2.max()-ys2.min())
        jx=float(ex);jw=float(min(armp-armt,tw*.42));jy=armt+jw/2   # knit raglan sleeves: the column outside the torso spans the whole side -> clamp
        sleeves.append(dict(j=[jx,jy],c=[float(fx),cy],jw=jw,cw=cw))
    # crop -> front cell, back cell (mirrored, centre placket / buttons smoothed away)
    cr=c[y0:y1,x0:x1];mr=m[y0:y1,x0:x1]
    fr=rs(cr,CW,CH);fm=np.asarray(Image.fromarray((mr*255).astype(np.uint8)).resize((CW,CH),Image.LANCZOS),dtype=np.float32)
    bk=fr[:,::-1].copy();bm=fm[:,::-1];cxp=int(((tx0+tx1)/2-x0)/(x1-x0)*CW);hw=int(tw/(x1-x0)*CW*.09)
    strip=bk[:,cxp-3*hw:cxp-hw].copy();bk[:,cxp-hw:cxp+hw]=rs(strip,2*hw,CH);bk=bk*.9   # back: placket replaced, a shade darker (no light-catching front)
    ci,ri=i%4,(i//4)*2
    for k,(img,mm) in enumerate(((fr,fm),(bk,bm))):
        Y=(ri+k)*CH;X=ci*CW;atl[Y:Y+CH,X:X+CW,:3]=img;atl[Y:Y+CH,X:X+CW,3]=np.where(mm>140,255,0)
        h=lum(img);hp=h-blur(h,2);atn[Y:Y+CH,X:X+CW]=normal(hp/255,4.5 if n.startswith('sw') else 2.5)
        r=np.clip(RO[i]-hp/255*.5,.2,1)*255;atr[Y:Y+CH,X:X+CW]=np.dstack([r,r,r])
    sx=lambda v:(v-x0)/(x1-x0);sy=lambda v:(v-y0)/(y1-y0)
    GARM.append(dict(n=n,cell=[ci,ri],t=[round(sx(tx0),3),round(sx(tx1),3)],sh=round(sy(sh),3),col=round(sy(col),3),hem=round(sy(hem),3),
        asp=round((x1-x0)/(y1-y0),3),sl=[dict(j=[round(sx(s['j'][0]),3),round(sy(s['j'][1]),3)],c=[round(sx(s['c'][0]),3),round(sy(s['c'][1]),3)],jw=round(s['jw']/(y1-y0),3),cw=round(s['cw']/(y1-y0),3)) for s in sleeves]))
Image.fromarray(atl.astype(np.uint8)).save(OUT+'garm145.webp',quality=90,method=6);save(atn,'garm145-n');save(atr,'garm145-r')
print('GARM',json.dumps(GARM,separators=(',',':')))
# ---------------- signs: card mask (yellow = saturated, white = bright), crop, atlas front + plain back
SN=['sign_each','sign_range','sign_all10','sign_sale','sign_3for'];sa=np.zeros((512,1280,4),np.float32);sn=np.zeros((512,1280,3),np.float32)+(128,128,255);SIGN=[]
for i,n in enumerate(SN):
    a=load('m145d_%s.png'%n);mx=a.max(2);mn=a.min(2);sat=(mx-mn)/(mx+1)
    m=(sat>.45)|(mn>(205 if n!='sign_sale' else 196));m=nd.binary_opening(m,iterations=3);lab,k=nd.label(m);sz=nd.sum(m,lab,range(1,k+1));m=nd.binary_fill_holes(lab==(1+np.argmax(sz)))
    x0,x1,y0,y1=bbox(m);cr=a[y0:y1,x0:x1];mr=m[y0:y1,x0:x1];idx=nd.distance_transform_edt(~mr,return_distances=False,return_indices=True);cr=cr[idx[0],idx[1]]
    f=rs(cr,256,256);fm=np.asarray(Image.fromarray((mr*255).astype(np.uint8)).resize((256,256),Image.LANCZOS),dtype=np.float32)
    sa[:256,i*256:(i+1)*256,:3]=f;sa[:256,i*256:(i+1)*256,3]=np.where(fm>128,255,0)
    base=np.median(cr[mr],axis=0);bk=np.zeros((256,256,3))+base*.93+(blur(rng.normal(0,1,(256,256,1)).repeat(3,2)*30+128,2)-128)*.2   # card back: plain stock, faint fibre noise
    sa[256:,i*256:(i+1)*256,:3]=bk[:,::-1] if False else bk;sa[256:,i*256:(i+1)*256,3]=np.where(fm[:,::-1]>128,255,0)
    h=lum(f);sn[:256,i*256:(i+1)*256]=normal((h-blur(h,3))/255,1.2)
    SIGN.append(dict(n=n,asp=round((x1-x0)/(y1-y0),3)))
Image.fromarray(sa.astype(np.uint8)).save(OUT+'sign145.webp',quality=90,method=6);save(sn,'sign145-n')
print('SIGN',json.dumps(SIGN,separators=(',',':')))
# ---------------- rugs: rug + fringe vs wood background (distance from the border colour), crop, 256x512 cells
RCROP=dict(rug1=(15,833,30,1258),rug2=(16,530,32,1930),rug3=(88,766,88,1235),rug4=(415,993,12,752),rug5=(15,833,15,1255))
RN=['rug1','rug2','rug3','rug4','rug5'];ra=np.zeros((512,1280,4),np.float32);rn=np.zeros((512,1280,3),np.float32)+(128,128,255);RUG=[]
for i,n in enumerate(RN):
    a=load('m145d_%s.png'%n);x0,x1,y0,y1=RCROP[n];cr=a[y0:y1,x0:x1]
    bd=np.concatenate([a[:6].reshape(-1,3),a[:,:6].reshape(-1,3)]);wl=lum(np.median(bd,0)[None,None])[0,0]
    # body opaque; the fringe bands (top / bottom 7 %) keyed: bright cotton threads vs the darker floor showing between them
    H=cr.shape[0];fb=int(H*.07);mr=np.ones(cr.shape[:2],bool);L=lum(cr)
    for sl in(slice(0,fb),slice(H-fb,H)):mr[sl]=L[sl]>max(wl+25,150)
    mr=nd.binary_opening(mr,iterations=1)|np.pad(np.ones((H-2*fb,cr.shape[1]),bool),((fb,fb),(0,0)))
    idx=nd.distance_transform_edt(~mr,return_distances=False,return_indices=True);cr=cr[idx[0],idx[1]]
    f=rs(cr,256,512);fm=np.asarray(Image.fromarray((mr*255).astype(np.uint8)).resize((256,512),Image.LANCZOS),dtype=np.float32)
    ra[:,i*256:(i+1)*256,:3]=f;ra[:,i*256:(i+1)*256,3]=np.where(fm>128,255,0)
    h=lum(f);rn[:,i*256:(i+1)*256]=normal((h-blur(h,2))/255,3.5)
    RUG.append(dict(n=n,asp=round(cr.shape[1]/cr.shape[0],3)))
Image.fromarray(ra.astype(np.uint8)).save(OUT+'rug145.webp',quality=90,method=6);save(rn,'rug145-n')
print('RUG',json.dumps(RUG,separators=(',',':')))
