# V138-retail-interiors R1: store shell textures (art-v138retail/*.png generated large) -> downscaled, quantized PS1 tiles
# + normal maps, and the fascia sign atlas (fictional names, rendered then crushed). Output bc/dist/assets/l11-v138.
# Run from project root with system python3 (PIL only).
import os,random
from PIL import Image,ImageChops,ImageFilter,ImageDraw,ImageOps,ImageFont
SRC='art-v138retail';OUT='bc/dist/assets/l11-v138';os.makedirs(OUT,exist_ok=True)
def seamless(im):
    w,h=im.size;sh=ImageChops.offset(im,w//2,h//2)
    m=Image.new('L',(w,h));d=ImageDraw.Draw(m)
    for i in range(w//2):
        v=int(255*min(1,i/(w*.22)));d.line([(i,0),(i,h)],fill=v);d.line([(w-1-i,0),(w-1-i,h)],fill=v)
    m2=Image.new('L',(w,h));d=ImageDraw.Draw(m2)
    for j in range(h//2):
        v=int(255*min(1,j/(h*.22)));d.line([(0,j),(w,j)],fill=v);d.line([(0,h-1-j),(w,h-1-j)],fill=v)
    return Image.composite(im,sh,ImageChops.multiply(m,m2))
def seam1(im,axis,frac):
    # one-axis wrap: offset by half along axis, cross-fade a narrow band at the old edges (keeps grooves/joints single)
    w,h=im.size;sh=ImageChops.offset(im,w//2 if axis==0 else 0,h//2 if axis==1 else 0)
    m=Image.new('L',(w,h),255);d=ImageDraw.Draw(m);n=int((w if axis==0 else h)*frac)
    for i in range(n):
        v=int(255*i/n)
        if axis==0:d.line([(i,0),(i,h)],fill=v);d.line([(w-1-i,0),(w-1-i,h)],fill=v)
        else:d.line([(0,i),(w,i)],fill=v);d.line([(0,h-1-i),(w,h-1-i)],fill=v)
    return Image.composite(im,sh,m)
def crush(im,size,colors):
    im=im.resize(size if isinstance(size,tuple) else (size,size),Image.LANCZOS).filter(ImageFilter.GaussianBlur(.35))
    return im.quantize(colors,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.FLOYDSTEINBERG).convert('RGB')
def normal(im,strength):
    L=im.convert('L').filter(ImageFilter.GaussianBlur(.8))
    dx=L.filter(ImageFilter.Kernel((3,3),[-1,0,1,-2,0,2,-1,0,1],1/strength,128))
    dy=L.filter(ImageFilter.Kernel((3,3),[-1,-2,-1,0,0,0,1,2,1],1/strength,128))
    return Image.merge('RGB',(ImageOps.invert(dx),dy,Image.new('L',im.size,235)))
def job(src,box,name,size,colors,ns,blend=False):
    im=Image.open(os.path.join(SRC,src)).convert('RGB').crop(box).resize((768,768),Image.LANCZOS)
    if blend:im=seam1(seam1(im,0,blend[0]),1,blend[1])
    crush(im,size,colors).save(f'{OUT}/{name}.webp',quality=92)
    normal(im.resize((size,size),Image.LANCZOS),ns).save(f'{OUT}/{name}_n.webp',quality=90)
# grid textures are cropped on whole tiles (generated grids are regular), no blend so the grout stays single
job('r138_floor_market.png',(0,0,1024,1024),'floor_m',256,48,6)      # 6x6 VCT tiles = 1.83 m repeat (30 cm tiles)
job('r138_floor_bodega.png',(0,0,939,768),'floor_b',256,40,7)        # 4x4 checker = 1.2 m repeat
job('r138_ceiling.png',(0,0,1024,1024),'ceil',256,32,9)              # 4x4 drop tiles = 2.44 m repeat
job('r138_wall_market.png',(200,180,1100,768),'wall_m',256,32,10,(.05,.05))
job('r138_wall_bodega.png',(240,250,784,770),'wall_b',256,40,14,(.03,.18))

# fascia sign atlas: 8 cells 512x96 (each sign 5.33:1), fictional names, mixed languages
F='/usr/share/fonts/truetype/dejavu/';U='/usr/share/fonts/opentype/urw-base35/'
def font(p,s):
    try:return ImageFont.truetype(p,s)
    except Exception:return ImageFont.truetype(F+'DejaVuSans-Bold.ttf',s)
SIGNS=[ # (kind, bg, fg, accent, line1, line2)
 ('m',(196,30,36),(255,250,235),(255,214,0),'VALU-RITE','FOOD MARKET · OPEN 7AM–11PM'),
 ('m',(18,96,58),(248,246,232),(250,250,250),'GREENLEAF','supermercado · groceries'),
 ('m',(20,64,140),(255,255,255),(255,200,40),'KWIK FRESH','MARKET  ·  PRODUCE  ·  DAIRY'),
 ('m',(240,236,220),(176,24,30),(30,90,170),'Hanaya Mart','épicerie · FOOD & SUNDRIES'),
 ('b',(16,16,18),(255,214,40),(230,40,40),'DELI GROCERY','BEER · COLD CUTS · LOTTO · ATM'),
 ('b',(140,14,20),(255,244,214),(255,214,40),'ACE LIQUORS','WINE · SPIRITS · SMOKE SHOP'),
 ('b',(22,30,72),(255,255,255),(240,60,60),'24HR MINI MART','CIGARS · VAPE · BEER · SNACKS'),
 ('b',(236,190,30),(20,20,20),(190,20,20),'EL SOL BODEGA','CERVEZA · TABACO · CAFÉ'),
]
W,H=512*2,96*2
at=Image.new('RGB',(W,H*len(SIGNS)))
for k,(kind,bg,fg,ac,l1,l2) in enumerate(SIGNS):
    c=Image.new('RGB',(W,H),bg);d=ImageDraw.Draw(c)
    d.rectangle([6,6,W-7,H-7],outline=ac,width=6)
    f1=font(U+'NimbusSans-Bold.otf' if kind=='m' else U+'NimbusSansNarrow-Bold.otf',92)
    if 'ハ' in l2:f2=font(F+'DejaVuSans-Bold.ttf',34)
    else:f2=font(U+'NimbusSans-Bold.otf',34)
    tw=d.textlength(l1,font=f1);d.text(((W-tw)/2+3,22+3),l1,font=f1,fill=tuple(int(v*.45) for v in bg))
    d.text(((W-tw)/2,22),l1,font=f1,fill=fg)
    tw2=d.textlength(l2,font=f2);d.text(((W-tw2)/2,136),l2,font=f2,fill=ac)
    # weathering: soft grime toward the bottom + a few rust streaks
    rnd=random.Random(138+k);g=Image.new('L',(W,H),0);gd=ImageDraw.Draw(g)
    for y in range(H):gd.line([(0,y),(W,y)],fill=int(40*y/H))
    for _ in range(6):x=rnd.randrange(W);gd.line([(x,rnd.randrange(H//2)),(x+rnd.randrange(-6,6),H)],fill=70,width=rnd.randrange(2,5))
    g=g.filter(ImageFilter.GaussianBlur(3));c=Image.composite(Image.new('RGB',(W,H),(40,32,24)),c,g)
    at.paste(c,(0,k*H))
crush(at,(512,96*len(SIGNS)),64).save(f'{OUT}/signs.webp',quality=92)
print('ok',len(SIGNS),'signs')
