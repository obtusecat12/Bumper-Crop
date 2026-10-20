# V136-atm-lobby stage 2: aquarium + lounge furniture textures -> bc/dist/assets/atm136
# Fish/plant cutouts: art-v136atm/atm136_{fish_a,fish_b,plant_a,plant_b}.png (generated large, chroma-keyed) -> crop,
# downscale, 1-bit alpha, quantize. Rattan / fabric / dark wood / glass gravel are procedural (PIL only).
# Run from project root with system python3.
import os,random,math
from PIL import Image,ImageFilter,ImageDraw,ImageOps,ImageChops
SRC='art-v136atm';OUT='bc/dist/assets/atm136';os.makedirs(OUT,exist_ok=True)
def cut(src,name,w,h,colors=48):
    im=Image.open(os.path.join(SRC,src)).convert('RGBA');im=im.crop(im.split()[3].getbbox())
    bw,bh=im.size;s=min(w/bw,h/bh);nw,nh=max(1,round(bw*s)),max(1,round(bh*s))
    im=im.resize((nw*4,nh*4),Image.LANCZOS).resize((nw,nh),Image.LANCZOS)
    c=Image.new('RGBA',(w,h),(0,0,0,0));c.paste(im,((w-nw)//2,h-nh if h>w else (h-nh)//2))
    rgb=c.convert('RGB');a=c.split()[3].point(lambda v:255 if v>110 else 0)
    # bleed colour into transparent texels so nearest/linear filtering never shows a green fringe
    bl=rgb.filter(ImageFilter.MaxFilter(3));rgb=Image.composite(rgb,bl,a)
    rgb=rgb.quantize(colors,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.FLOYDSTEINBERG).convert('RGB')
    o=rgb.copy();o.putalpha(a);o.save(f'{OUT}/{name}.webp',lossless=True)
cut('atm136_fish_a.png','fish_a',64,32,32)
cut('atm136_fish_b.png','fish_b',64,32,32)
cut('atm136_plant_a.png','plant_a',64,128,48)
cut('atm136_plant_b.png','plant_b',128,64,48)
def normal(im,strength):
    L=im.convert('L').filter(ImageFilter.GaussianBlur(.8))
    dx=L.filter(ImageFilter.Kernel((3,3),[-1,0,1,-2,0,2,-1,0,1],1/strength,128))
    dy=L.filter(ImageFilter.Kernel((3,3),[-1,-2,-1,0,0,0,1,2,1],1/strength,128))
    return Image.merge('RGB',(ImageOps.invert(dx),dy,Image.new('L',im.size,235)))
def fin(im,name,size,colors,ns):
    t=im.resize((size,size),Image.LANCZOS).filter(ImageFilter.GaussianBlur(.3))
    t.quantize(colors,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.FLOYDSTEINBERG).convert('RGB').save(f'{OUT}/{name}.webp',quality=92)
    normal(im.resize((size,size),Image.LANCZOS),ns).save(f'{OUT}/{name}_n.webp',quality=90)
random.seed(1362)
# rattan: basket weave of honey-brown strands (tiles: 8 strands per tile, periodic)
N=512;r=Image.new('RGB',(N,N),(70,48,26));d=ImageDraw.Draw(r);S=N//8
for j in range(8):
    for i in range(8):
        x0,y0=i*S,j*S;hor=(i+j)%2==0
        for k in range(4):
            v=random.randint(-18,14);c=(176+v,128+v,72+v//2)
            if hor:d.rounded_rectangle([x0+2,y0+k*S//4+2,x0+S-2,y0+(k+1)*S//4-2],radius=6,fill=c)
            else:d.rounded_rectangle([x0+k*S//4+2,y0+2,x0+(k+1)*S//4-2,y0+S-2],radius=6,fill=c)
r=r.filter(ImageFilter.GaussianBlur(1.2));fin(r,'rattan',128,24,6)
# fabric: oatmeal linen, fine slub weave
N=256;f=Image.new('RGB',(N,N));px=f.load()
rows=[random.randint(-8,8) for _ in range(N)];cols=[random.randint(-8,8) for _ in range(N)]
for y in range(N):
    for x in range(N):
        v=rows[y]+cols[x]+((x+y)%2)*6+random.randint(-4,4);px[x,y]=(214+v,200+v,176+v)
fin(f,'fabric',64,16,4)
# dark wood: walnut grain + vertical panel grooves (tile 1 m)
N=512;w=Image.new('RGB',(N,N));px=w.load();ph=[random.random()*6 for _ in range(6)]
for y in range(N):
    for x in range(N):
        g=sum(math.sin(x/N*2*math.pi*(k+3)+ph[k]+2.2*math.sin(y/N*2*math.pi*(k%3+1)+ph[k]))/(k+1) for k in range(4))
        v=int(14*g)+random.randint(-3,3);px[x,y]=(64+v,38+v,24+v//2)
d=ImageDraw.Draw(w)
for gx in (0,N//2):d.rectangle([gx,0,gx+6,N],fill=(30,18,10));d.line([(gx+7,0),(gx+7,N)],fill=(96,62,38),width=2)
fin(w,'wood',128,24,8)
# blue glass aquarium gravel
N=256;g=Image.new('RGB',(N,N),(28,40,70));d=ImageDraw.Draw(g)
for _ in range(900):
    x,y=random.randrange(N),random.randrange(N);s=random.randint(6,13);b=random.choice([(70,120,200),(60,150,210),(110,170,230),(40,90,170),(200,210,230)])
    for ox in(-N,0,N):
        for oy in(-N,0,N):d.ellipse([x+ox,y+oy,x+ox+s,y+oy+s*.75],fill=b);d.ellipse([x+ox+2,y+oy+1,x+ox+4,y+oy+3],fill=(230,240,255))
fin(g,'gravel',64,24,3)
print('ok')
