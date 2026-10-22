# V144 B3 alley-mouth ground: wet trampled mud (seamless) + broken-wood chips/splinters.
# Sources (each generated large on its own): art-v144/b144b3_mud.png, art-v144/b144b3_chip.png
# -> bc/dist/assets/l11-v144/b3_{mud,chip}{,-n,-r}.webp and bc/dist/brick144-chips-data.js (one convex outline per chip piece,
# found by segmenting the chip sheet; the runtime extrudes each outline into a real chip). Run from the project root.
from PIL import Image,ImageFilter,ImageOps,ImageChops
import math,os,json
SRC='art-v144/b144b3_';OUT='bc/dist/assets/l11-v144/';os.makedirs(OUT,exist_ok=True)
def save(im,name,q=86):im.save(OUT+name+'.webp',quality=q,method=6)
def normal_from_height(h,strength=2.0):
    W,H=h.size;p=h.load();o=Image.new('RGB',(W,H));q=o.load()
    for y in range(H):
        for x in range(W):
            dx=(p[(x+1)%W,y]-p[(x-1)%W,y])/255*strength;dy=(p[x,(y+1)%H]-p[x,(y-1)%H])/255*strength
            l=math.sqrt(dx*dx+dy*dy+1);q[x,y]=(int((-dx/l*.5+.5)*255),int((dy/l*.5+.5)*255),int((1/l*.5+.5)*255))
    return o
def hpass(g,r=6):b=g.filter(ImageFilter.GaussianBlur(r));return ImageChops.subtract(g,b,1,128)
def seam(im):
    for axis in (0,1):
        W,H=im.size
        if axis==0:
            bnd=W//8;core=im.crop((0,0,W-bnd,H));tail=im.crop((W-bnd,0,W,H));m=ImageOps.mirror(Image.linear_gradient('L').rotate(90,expand=True).resize((bnd,H)))
            core.paste(Image.composite(tail,core.crop((0,0,bnd,H)),m),(0,0));im=core
        else:
            bnd=H//8;core=im.crop((0,0,W,H-bnd));tail=im.crop((0,H-bnd,W,H));m=ImageOps.flip(Image.linear_gradient('L').resize((W,bnd)))
            core.paste(Image.composite(tail,core.crop((0,0,W,bnd)),m),(0,0));im=core
    return im
# ---- mud: seamless 512, normal from luma high-pass, roughness low where the wet sheen is (bright, smooth spots)
mud=seam(Image.open(SRC+'mud.png').convert('RGB')).resize((512,512),Image.LANCZOS)
mud=mud.quantize(96,dither=Image.Dither.NONE).convert('RGB');save(mud,'b3_mud')
g=mud.convert('L');save(normal_from_height(hpass(g,5),3.0),'b3_mud-n',92)
sheen=g.filter(ImageFilter.GaussianBlur(3));r=sheen.point(lambda v:int(max(70,235-max(0,v-70)*1.6)))
save(Image.merge('RGB',(r,r,r)),'b3_mud-r')
# ---- chips: sheet 1024 on flat grey -> mask by colour distance from the background, components -> convex hulls
S=Image.open(SRC+'chip.png').convert('RGB');W0,H0=S.size;bg=S.getpixel((4,4))
px=S.load();mask=[[0]*W0 for _ in range(H0)]
for y in range(H0):
    for x in range(W0):
        c=px[x,y];d=abs(c[0]-bg[0])+abs(c[1]-bg[1])+abs(c[2]-bg[2])
        sat=max(c)-min(c)
        mask[y][x]=0 if (c[2]-c[0]>=4 and sat<30) else 1   # the backdrop is a cool blue-grey; wood (even weathered) is warm/neutral
_mi=Image.new('L',S.size);_mi.putdata([mask[y][x]*255 for y in range(H0) for x in range(W0)]);_mi=_mi.filter(ImageFilter.MinFilter(7))
_mp=_mi.load();mask=[[1 if _mp[x,y]>128 else 0 for x in range(W0)] for y in range(H0)]   # erode: split touching pieces, drop shadow rims
# components (4-neighbour flood fill) on a 2x downsampled grid for speed
D=2;w,h=W0//D,H0//D;m=[[mask[y*D][x*D] for x in range(w)] for y in range(h)];lab=[[0]*w for _ in range(h)]
pieces=[]
def hull(pts):
    pts=sorted(set(pts))
    if len(pts)<3:return pts
    def cr(o,a,b):return (a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0])
    lo=[];up=[]
    for p in pts:
        while len(lo)>=2 and cr(lo[-2],lo[-1],p)<=0:lo.pop()
        lo.append(p)
    for p in reversed(pts):
        while len(up)>=2 and cr(up[-2],up[-1],p)<=0:up.pop()
        up.append(p)
    return lo[:-1]+up[:-1]
def simplify(H,n=10):
    while len(H)>n:   # drop the vertex whose removal loses the least area
        best=None
        for i in range(len(H)):
            a,b,c=H[i-1],H[i],H[(i+1)%len(H)];A=abs((b[0]-a[0])*(c[1]-a[1])-(c[0]-a[0])*(b[1]-a[1]))
            if best is None or A<best[0]:best=(A,i)
        H.pop(best[1])
    return H
n=0
for y in range(h):
    for x in range(w):
        if m[y][x] and not lab[y][x]:
            n+=1;st=[(x,y)];lab[y][x]=n;pts=[]
            while st:
                cx,cy=st.pop();pts.append((cx,cy))
                for nx,ny in((cx+1,cy),(cx-1,cy),(cx,cy+1),(cx,cy-1)):
                    if 0<=nx<w and 0<=ny<h and m[ny][nx] and not lab[ny][nx]:lab[ny][nx]=n;st.append((nx,ny))
            if len(pts)<60:continue
            edge=[(p[0],p[1]) for p in pts]
            H=simplify(hull(edge),10)
            xs=[p[0] for p in pts];ys=[p[1] for p in pts]
            # pull the hull 1 px toward the centroid so the cut stays inside the wood
            cx_=sum(xs)/len(xs);cy_=sum(ys)/len(ys)
            H=[(p[0]+(cx_-p[0])*.04,p[1]+(cy_-p[1])*.04) for p in H]
            L=max(xs)-min(xs);Wd=max(ys)-min(ys)
            # sample colour -> kind (pale splinter / grey board / orange chip)
            c=S.getpixel((int(cx_*D),int(cy_*D)));kind='pale' if c[0]>185 and c[2]>140 else ('grey' if max(c)-min(c)<30 else 'chip')
            pieces.append({'h':[[round(p[0]*D/W0,4),round(1-p[1]*D/H0,4)] for p in H],'k':kind,'a':len(pts)*D*D/(W0*H0)})
print('chip pieces',len(pieces),{k:sum(1 for p in pieces if p['k']==k) for k in('pale','grey','chip')})
# chip texture: grey background replaced by the darkest wood tone (edges never show grey), 512, normal + roughness
fill=Image.new('RGB',S.size,(92,70,52));Mk=Image.new('L',S.size,0);Mk.putdata([mask[y][x]*255 for y in range(H0) for x in range(W0)])
Mk=Mk.filter(ImageFilter.MaxFilter(5));chip=Image.composite(S,fill,Mk).resize((512,512),Image.LANCZOS);save(chip,'b3_chip')
cg=chip.convert('L');save(normal_from_height(hpass(cg,3),2.6),'b3_chip-n',92)
rr=ImageOps.invert(cg).point(lambda v:int(170+v*60/255));save(Image.merge('RGB',(rr,rr,rr)),'b3_chip-r')
open('bc/dist/brick144-chips-data.js','w').write('// V144 B3 generated by bc/tools/brick144b3_assets.py: chip outlines (convex, uv of b3_chip, counter-clockwise), kind, sheet area share\n'
 'export const CHIP144_SHEET_M=.7;\nexport const CHIP144='+json.dumps(pieces,separators=(',',':'))+';\n')
