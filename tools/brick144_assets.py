# V144 A1 capital brick apartment block: textures from the generated sources in art-v144/ -> bc/dist/assets/l11-v144/.
# Run from the project root (system python3 + PIL). Each output is its own texture (no lazy reuse):
#  brick144(-n,-r): seamless running-bond tile rebuilt from harvested bricks of b144_brick.png (8 x 32 bricks = 2.4 m square),
#                   normal from a mortar height field, roughness brick/mortar.
#  panel144(-n): dark ground-floor metal cladding, seamless (cut on its own seams + vertical cross-fade), 3 panels = 3.6 m.
#  wood144(-n): cedar board cladding, seamless, 1.2 m.
#  win144: 3 x 2 atlas of six window interiors (glass tint + darkening like the photo's glazing).
#  trim144(-n): white painted aluminium window surround (procedural grime), redf144: dark red painted metal frame strip.
from PIL import Image,ImageFilter,ImageOps,ImageChops,ImageEnhance
import random,math,os
SRC='art-v144/';OUT='bc/dist/assets/l11-v144/';os.makedirs(OUT,exist_ok=True)
R=random.Random(144)
def save(im,name,q=86):im.save(OUT+name+'.webp',quality=q,method=6)
def normal_from_height(h,strength=2.0):
    W,H=h.size;p=h.load();o=Image.new('RGB',(W,H));q=o.load()
    for y in range(H):
        for x in range(W):
            dx=(p[(x+1)%W,y]-p[(x-1)%W,y])/255*strength;dy=(p[x,(y+1)%H]-p[x,(y-1)%H])/255*strength
            l=math.sqrt(dx*dx+dy*dy+1);q[x,y]=(int((-dx/l*.5+.5)*255),int((dy/l*.5+.5)*255),int((1/l*.5+.5)*255))
    return o
def vfade(im,band=None):
    # seamless top/bottom: cross-fade the last band into the first
    W,H=im.size;band=band or H//6;a=im.crop((0,0,W,H-band));top=im.crop((0,H-band,W,H));base=a.crop((0,0,W,band))
    m=Image.linear_gradient('L').resize((W,band));blend=Image.composite(base,top,m)
    a.paste(blend,(0,0));return a
def lowfi(im,size,colors=None):
    im=im.resize(size,Image.LANCZOS)
    return im
# ---- brick: harvest cells on the measured grid (pitch 122 px, course 35 px, alternate courses offset 61)
src=Image.open(SRC+'b144_brick.png').convert('RGB')
peaks=[2,37,73,109,145,180,215,250,285,319,354,389,424,458,493,528,563,598,632,667,702]
cells=[]
for ci,(a,b) in enumerate(zip(peaks,peaks[1:])):
    x0=115 if ci%2==0 else 53
    for k in range(11):
        x=x0+k*122
        if x+122<src.size[0]:cells.append(src.crop((x,a,x+122,b)))
BW,BH,NX,NY=128,32,8,32
tile=Image.new('RGB',(BW*NX,BH*NY));hgt=Image.new('L',tile.size,0)
cellh=Image.new('L',(BW,BH),0)
from PIL import ImageDraw
d=ImageDraw.Draw(cellh)
for i in range(6):
    v=int(255*(i+1)/6);d.rectangle([2+i//2,2+i//2,BW-3-i//2,BH-3-i//2],fill=v)
cellh=cellh.filter(ImageFilter.GaussianBlur(.8))
for j in range(NY):
    off=0 if j%2==0 else BW//2
    for i in range(NX+1):
        c=R.choice(cells).resize((BW,BH),Image.LANCZOS)
        if R.random()<.5:c=ImageOps.mirror(c)
        if R.random()<.3:c=ImageOps.flip(c)
        t=.9+R.random()*.2;c=ImageEnhance.Brightness(c).enhance(t)
        x=i*BW-off
        for xx in (x,x+tile.size[0]):
            tile.paste(c,(xx,j*BH));hgt.paste(cellh,(xx,j*BH))
# brick surface detail into the height
lum=tile.convert('L').filter(ImageFilter.GaussianBlur(1));hgt=ImageChops.add(ImageChops.multiply(hgt,Image.new('L',hgt.size,235)),ImageChops.multiply(lum,Image.new('L',hgt.size,20)))
# photo's brick reads darker and plummier with quieter mortar: mortar pulled down where the height mask is low, whole tile toned
mm=hgt.point(lambda v:255 if v<70 else 0).filter(ImageFilter.GaussianBlur(1))
tile=Image.composite(ImageEnhance.Brightness(tile).enhance(.8),tile,mm)
tile=Image.blend(ImageEnhance.Brightness(tile).enhance(1.02),Image.new('RGB',tile.size,(104,94,108)),.14)
b512=tile.resize((512,512),Image.LANCZOS);save(b512,'brick144')
save(normal_from_height(hgt.resize((512,512),Image.LANCZOS),3.0),'brick144-n',92)
rough=hgt.resize((512,512)).point(lambda v:255 if v<60 else 225);save(Image.merge('RGB',(rough,rough,rough)),'brick144-r')
# ---- panel: crop to whole panels on its seams, vertical fade
p=Image.open(SRC+'b144_panel.png').convert('RGB');g=p.convert('L');W,H=p.size;pp=g.load()
cols=[sum(pp[x,y] for y in range(0,H,4))/(H/4) for x in range(W)];m=sum(cols)/W
seams=[x for x in range(4,W-4) if cols[x]==min(cols[x-4:x+5]) and cols[x]<m-12]
print('panel seams',seams)
pairs=[(seams[i]+seams[i+1])//2 for i in range(len(seams)-1) if seams[i+1]-seams[i]<12]
a,b=pairs[0],pairs[2]
pc=vfade(p.crop((a,0,b,H)));pc=pc.resize((768,512),Image.LANCZOS);save(pc,'panel144')
ph=pc.convert('L').filter(ImageFilter.GaussianBlur(1.5));save(normal_from_height(ph.resize((384,256)),2.2),'panel144-n',92)
# ---- wood
w=Image.open(SRC+'b144_wood.png').convert('RGB');g=w.convert('L');W,H=w.size;pp=g.load()
cols=[sum(pp[x,y] for y in range(0,H,4))/(H/4) for x in range(W)];m=sum(cols)/W
seams=[x for x in range(4,W-4) if cols[x]==min(cols[x-4:x+5]) and cols[x]<m-15]
print('wood seams',seams[:20])
a=seams[0];bb=[s for s in seams if s-a>W*.55];b=bb[0] if bb else seams[-1]
wc=vfade(w.crop((a,0,b,H)));wc=wc.resize((512,512),Image.LANCZOS);save(wc,'wood144')
save(normal_from_height(wc.convert('L').filter(ImageFilter.GaussianBlur(1)).resize((256,256)),2.0),'wood144-n',92)
# ---- window interiors: crop the generated frame margins, tint like the photo's glazing (darker, blue/green)
atlas=Image.new('RGB',(768,512))
tints=[(40,62,78),(34,52,74),(36,56,54),(80,118,104),(36,58,86),(96,98,90)]
for i in range(6):
    im=Image.open(SRC+f'b144_int{i+1}.png').convert('RGB');W,H=im.size;mg=int(W*.07);im=im.crop((mg,mg,W-mg,H-mg)).resize((256,256),Image.LANCZOS)
    im=ImageEnhance.Contrast(ImageEnhance.Brightness(im).enhance(.42 if i!=5 else .5)).enhance(1.15)
    im=Image.blend(im,Image.new('RGB',im.size,tints[i]),.3)
    # sky reflection gradient across the top
    gr=Image.linear_gradient('L').rotate(180).resize((256,256)).point(lambda v:int(v*.5))
    im=Image.composite(Image.new('RGB',im.size,(138,176,206)),im,gr)
    atlas.paste(im,(i%3*256,i//3*256))
save(atlas,'win144',84)
# ---- white trim + red frame (procedural, grime from low-frequency noise)
def noise(size,scale,seed):
    r=random.Random(seed);s=Image.new('L',(max(2,size[0]//scale),max(2,size[1]//scale)))
    s.putdata([r.randint(0,255) for _ in range(s.size[0]*s.size[1])]);return s.resize(size,Image.BICUBIC)
n1=noise((256,256),16,1);n2=noise((256,256),4,2)
trim=Image.new('RGB',(256,256),(226,226,220));dirt=ImageChops.multiply(n1,n2).point(lambda v:int(v*.25))
trim=Image.composite(Image.new('RGB',(256,256),(150,148,140)),trim,dirt);save(trim,'trim144')
save(normal_from_height(n2.filter(ImageFilter.GaussianBlur(2)),.4),'trim144-n',92)
red=Image.new('RGB',(128,128),(122,38,30));red=Image.composite(Image.new('RGB',(128,128),(70,30,28)),red,noise((128,128),8,3).point(lambda v:int(v*.4)));save(red,'redf144')
print('ok')
