# V145 M5 Maltose Market (麦芽糖市场): table goods. Run from the project root (pip install numpy pillow scipy).
# Sources art-v145/m145e_*.png, each generated large on its own (no grid sheets). Shares helpers with maltose145_m2_assets.py.
# Outputs -> bc/dist/assets/l11-v145/:
#  brass145 bronze145 wood145 horn145 cane145 velvet145 celadon145 leather145 seat145 porc145 can145 (-n,-r): seamless tiles
#  goods145 (-n,-r): 1024 atlas, 4x4 cells of 256 (cell k: col k%4, row k//4):
#    0 lacquer lid  1 lacquer front (hasp)  2 lacquer end (ring)  3 lacquer back (hasp removed)  4 lacquer end 2 (mirrored, darker)
#    5 lacquer bottom (bare wood)  6 yellow box lid  7 yellow front  8 yellow end  9 yellow back  10 folio front  11 folio back
#    12 carved head front  13 carved head back/sides (dot carving)  14 jewellery tray bed  15 tumbled stones
#  tub145 (-r): clear plastic tub wall (front with label) / plain side, 512x256 two cells
#  beads145 (-n,-r): necklace spread 512x256     clut145 (-n): far-table clutter, two 512x256 cells (white cloth / red cloth)
#  glass145-r: smudged glass roughness
# Prints CLUTH (clutter height grids 32x16, digits 0-9) for dist/maltose145-goods.js.
import numpy as np,json
from scipy import ndimage as nd
src=open('bc/tools/maltose145_m2_assets.py').read();exec(src[:src.index("brick('m145b_redbrick.png'")]);exec(src[src.index('def surf('):src.index("surf('m145b_lime.png'")])
rng=np.random.default_rng(1455)
T=[('brass','brass145',256,(150,118,52),.25,2.5,.35,-.6),('bronze','bronze145',256,(78,70,48),.3,3,.55,-.6),('wood','wood145',256,(112,80,52),.25,3,.85,-.4),
   ('horn','horn145',256,(46,46,46),.3,2,.35,-.5),('cane','cane145',256,(52,36,26),.2,3,.5,-.5),('velvet','velvet145',256,(176,18,30),.2,1.5,.95,-.3),
   ('celadon','celadon145',256,(120,130,104),.25,1.5,.2,-.3),('leather','leather145',256,(104,66,40),.25,3,.6,-.5),('porcelain','porc145',256,(226,228,230),.15,1,.15,-.2)]
for s,n,sz,t,mx,hs,r0,rk in T:surf('m145e_%s.png'%s,n,sz,t,mx,hs,r0=r0,rk=rk)
surf('m145e_leather.png','seat145',128,(30,30,32),.85,2.5,r0=.7,rk=-.4)      # folding-chair seat: leather grain re-tinted near black
surf('m145e_can.png','can145',256,(118,122,124),.2,2.5,crop=(300,0,1100,768),r0=.75,rk=-.5)
print('tiles ok')
def bbox(m):ys,xs=np.where(m);return xs.min(),xs.max(),ys.min(),ys.max()
def obj(n,th=38,pad=0):
    # object on a plain background: distance from the border colour, largest blob, bbox crop
    a=load(n);bd=np.concatenate([a[:8].reshape(-1,3),a[-8:].reshape(-1,3),a[:,:8].reshape(-1,3),a[:,-8:].reshape(-1,3)]);bg=np.median(bd,0)
    m=np.linalg.norm(a-bg,axis=2)>th;m=nd.binary_opening(m,iterations=3);lab,k=nd.label(m);sz=nd.sum(m,lab,range(1,k+1));m=nd.binary_fill_holes(lab==(1+np.argmax(sz)))
    x0,x1,y0,y1=bbox(m);return a[y0+pad:y1-pad,x0+pad:x1-pad]
C=256;atl=np.zeros((1024,1024,3),np.float32);atn=np.zeros_like(atl)+(128,128,255);atr=np.zeros_like(atl)+200
def put(k,img,ro,hs=2.5):
    X,Y=(k%4)*C,(k//4)*C;f=rs(img,C,C);atl[Y:Y+C,X:X+C]=f;h=lum(f);hp=h-blur(h,2);atn[Y:Y+C,X:X+C]=normal(hp/255,hs)
    r=np.clip(ro-hp/255*.4,.05,1)*255;atr[Y:Y+C,X:X+C]=np.dstack([r,r,r])
lt=obj('m145e_lacq_top.png',pad=4);lf=obj('m145e_lacq_front.png',pad=4);ls=obj('m145e_lacq_side.png',pad=6)
put(0,lt,.32);put(1,lf,.34);put(2,ls,.36)
bk=lf.copy();W=bk.shape[1];c0,c1=int(W*.36),int(W*.64);bk[:,c0:c1]=rs(np.concatenate([lf[:,int(W*.12):int(W*.26)],lf[:,int(W*.74):int(W*.88)][:,::-1]],1),c1-c0,bk.shape[0]);put(3,bk[:,::-1]*.92,.4)
put(4,ls[:,::-1]*.86,.4)
wd=load('m145e_wood.png');put(5,wd[100:600,200:900]*.55,.9)
yb=obj('m145e_ybox.png',pad=3);H,W=yb.shape[:2];put(6,yb,.55)
put(7,yb[int(H*.02):int(H*.3),int(W*.05):int(W*.95)],.6);put(8,yb[int(H*.55):int(H*.95),int(W*.02):int(W*.45)],.6);put(9,yb[int(H*.68):int(H*.97),int(W*.1):int(W*.9)][:,::-1]*.9,.65)
fo=obj('m145e_folio.png',pad=4);put(10,fo,.9,1.5);put(11,fo[::-1,::-1]*.9,.9,1.5)
hd=obj('m145e_head_front.png',th=30,pad=0);H,W=hd.shape[:2]
# front: square crop around the face (head occupies the top ~80 % of the bust)
fr=hd[:int(H*.82),int(W*.08):int(W*.92)]
# back / sides: dot-carving from the temples, tiled 2x2 with a mirrored cross-fade (no face features)
tp=hd[int(H*.12):int(H*.32),int(W*.18):int(W*.34)];tp=np.concatenate([tp,tp[:,::-1]],1);tp=np.concatenate([tp,tp[::-1]],0);put(13,tp,.6,4)
# backdrop left in the front crop (corners above the ears) -> dot carving, so the cylindrical wrap never shows grey
a0=load('m145e_head_front.png');bg=np.median(a0[:8].reshape(-1,3),0);fr=rs(fr,C,C);bgm=nd.binary_dilation(np.linalg.norm(fr-bg,axis=2)<26,iterations=3)
fr[bgm]=rs(tp,C,C)[bgm];put(12,fr,.55,4)
jt=load('m145e_jtray.png');H,W=jt.shape[:2];put(14,jt[int(H*.06):int(H*.94),int(W*.04):int(W*.96)],.5,3)
st=load('m145e_stones.png');put(15,st[:,200:1208],.3,4)
Image.fromarray(np.clip(atl,0,255).astype(np.uint8)).save(OUT+'goods145.webp',quality=90,method=6);save(atn,'goods145-n');save(atr,'goods145-r')
print('atlas ok')
# tub: front wall (label) + plain side made from the label-free left part
tb=load('m145e_tub.png');H,W=tb.shape[:2];tf=tb[int(H*.08):int(H*.95),int(W*.02):int(W*.98)];ts=tf[:,:int(tf.shape[1]*.35)]
tu=np.concatenate([rs(tf,256,256),rs(ts,256,256)],1);save(tu,'tub145');h=lum(tu);r=np.clip(.25+(h-blur(h,3))/255*-.5,.05,1)*255;save(np.dstack([r,r,r]),'tub145-r')
# beads
be=load('m145e_beads.png');be=rs(be[40:740,60:1350],512,256);save(be,'beads145');h=lum(be);hp=h-blur(h,3);save(normal(hp/255,5),'beads145-n');r=np.clip(.45-hp/255*.6,.1,1)*255;save(np.dstack([r,r,r]),'beads145-r')
# clutter: two cells + coarse height grids (objects above the cloth: colour distance from the cloth, blurred)
CL=[];cl=np.zeros((512,512,3),np.float32)
for i,(n,cloth) in enumerate((('m145e_clutter1.png',(225,224,220)),('m145e_clutter2.png',(150,24,30)))):
    a=load(n);a=rs(a,512,256);cl[i*256:(i+1)*256]=a
    d=np.linalg.norm(a-np.array(cloth),axis=2);m=(d>60).astype(np.float32);hgt=nd.gaussian_filter(m,4)*(.6+.4*lum(a)/255)
    g=rs(np.dstack([hgt*255]*3),32,16)[...,0]/255;g=np.clip(g/max(g.max(),1e-3)*9,0,9).round().astype(int);CL.append(''.join(map(str,g.flatten())))
save(cl,'clut145');h=lum(cl);save(normal((h-blur(h,2))/255,4),'clut145-n')
# glass roughness: mostly polished, faint finger smudges
g=nd.gaussian_filter(rng.normal(0,1,(128,128)),6,mode='wrap');g=(g-g.min())/(g.max()-g.min());r=(.04+.2*(g>.62)*(g-.62)/.38)*255;save(np.dstack([r,r,r]),'glass145-r')
print('CLUTH',json.dumps(CL))
