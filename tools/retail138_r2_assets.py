# V138-retail-interiors R2: market fixture textures. Product "facings" are fake: shelf-front strips cut from generated
# orthographic shelf photos (art-v138retail/r2/g_*.png, each generated large on its own) -> crushed PS1 atlas goods.webp
# (2 columns x 19 rows, 512x64 per strip = 2.4 m x 0.30 m of shelf). Top views (chest freezer, fruit, veg), promo
# standees, plus PIL-drawn price strips, aisle signs, cardboard case prints, belt rubber. Out: bc/dist/assets/l11-v138.
# Run from project root with system python3 (PIL only). Strip slot table printed as JSON -> paste into retail138-market.js.
import os,json,random
from PIL import Image,ImageDraw,ImageFilter,ImageFont,ImageOps
SRC='art-v138retail/r2';OUT='bc/dist/assets/l11-v138';os.makedirs(OUT,exist_ok=True)
def crush(im,size,colors):
    im=im.resize(size,Image.LANCZOS).filter(ImageFilter.GaussianBlur(.3))
    return im.quantize(colors,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.FLOYDSTEINBERG).convert('RGB')
# (file, x-crop, [bands y0,y1])
SHELF=[
 ('dry','g_cereal2',(0,1408),[(0,164),(206,371),(412,571),(616,768)]),
 ('dry','g_cans',(0,1408),[(7,149),(196,365),(424,564),(613,768)]),
 ('dry','g_chips',(0,1408),[(12,186),(224,396),(434,602),(639,768)]),
 ('dry','g_house',(0,1408),[(29,178),(239,382),(415,589),(654,754)]),
 ('dry','g_pasta',(0,1408),[(0,145),(187,341),(403,558),(609,745)]),
 ('cool','g_soda',(30,1360),[(30,195),(212,380),(400,565),(585,768)]),
 ('dairy','g_dairy',(0,1408),[(40,198),(240,375),(395,550),(575,768)]),
 ('frozen','g_frozen',(40,1340),[(35,150),(200,385),(420,565),(595,768)]),
 ('candy','g_candy',(0,1408),[(0,135),(150,290),(305,445),(455,595),(610,745)]),
]
SW,SH,ROWS=512,64,19
atlas=Image.new('RGB',(SW*2,SH*ROWS),(30,30,30));slots={};k=0
for cat,f,(xa,xb),bands in SHELF:
    im=Image.open(f'{SRC}/{f}.png').convert('RGB')
    for (y0,y1) in bands:
        s=im.crop((xa,y0,xb,y1)).resize((SW*2,SH*2),Image.LANCZOS)
        # darker toward the top of the strip (the shelf above shades it) and a hint at the base
        g=Image.linear_gradient('L').resize((SW*2,SH*2));g=g.point(lambda v:int(70*(1-v/255)**2.2))
        s=Image.composite(Image.new('RGB',s.size,(8,8,10)),s,g)
        atlas.paste(s.resize((SW,SH),Image.LANCZOS),((k//ROWS)*SW,(k%ROWS)*SH));slots.setdefault(cat,[]).append(k);k+=1
crush(atlas,atlas.size,96).save(f'{OUT}/goods.webp',quality=84)
def top(f,box,name,size,colors=64):
    im=Image.open(f'{SRC}/{f}.png').convert('RGB').crop(box);crush(im,size,colors).save(f'{OUT}/{name}.webp',quality=90)
top('g_chest',(20,20,1388,748),'chest',(512,272))
top('g_fruit',(0,0,1408,768),'fruit',(512,280))
top('g_veg',(0,0,1408,768),'veg',(512,280))
top('g_promo1',(30,40,738,1336),'promo1',(128,236),48)
top('g_promo2',(0,0,848,1264),'promo2',(128,192),48)

F='/usr/share/fonts/truetype/dejavu/';U='/usr/share/fonts/opentype/urw-base35/'
def font(p,s):
    try:return ImageFont.truetype(p,s)
    except Exception:return ImageFont.truetype(F+'DejaVuSans-Bold.ttf',s)
rnd=random.Random(1382)
# price strip: 2.4 m x 4 cm label rail, white with yellow/red tags, printed prices (1024x32 -> 512x16)
ps=Image.new('RGB',(1024,64),(232,232,226));d=ImageDraw.Draw(ps);fp=font(U+'NimbusSans-Bold.otf',30);fs=font(U+'NimbusSans-Regular.otf',13)
x=6
while x<1000:
    w=rnd.randrange(70,120);c=rnd.choice([(250,250,246),(250,250,246),(255,220,40),(230,40,40)]);d.rectangle([x,6,x+w,58],fill=c,outline=(150,150,150))
    tc=(255,255,255) if c[0]==230 and c[1]==40 else (20,20,20)
    d.text((x+6,10),f'{rnd.randrange(0,9)}.{rnd.randrange(10,99)}',font=fp,fill=tc);d.text((x+6,44),rnd.choice(['ea','/lb','2/$','UNIT 12¢/oz','SALE','oferta']),font=fs,fill=tc)
    d.rectangle([x+w-24,12,x+w-6,52],fill=(40,40,40));x+=w+rnd.randrange(30,110)
ps=ps.filter(ImageFilter.GaussianBlur(.6));crush(ps,(512,16),24).save(f'{OUT}/price.webp',quality=90)
# aisle sign atlas: 8 cells 2:1 (512x256 each -> 128x64), number + 3 categories, mixed languages
AISLE=[('1','CEREAL','CAFÉ · TEA','BREAKFAST'),('2','CANNED','SOUPS','FRIJOLES'),('3','SNACKS','CHIPS · PAPAS','COOKIES'),('4','HOUSEHOLD','PAPER','LIMPIEZA'),
       ('5','PASTA','RICE · RIZ','BAKING'),('6','WORLD FOODS','SAUCES','ÉPICES'),('7','PET FOOD','BABY','HEALTH'),('8','BEVERAGES','WATER · AGUA','JUICE')]
sa=Image.new('RGB',(512,256*len(AISLE)));fb=font(U+'NimbusSans-Bold.otf',120);fc=font(F+'DejaVuSans-Bold.ttf',32)
for i,(n,a,b,c) in enumerate(AISLE):
    im=Image.new('RGB',(512,256),(22,70,140));d=ImageDraw.Draw(im);d.rectangle([6,6,505,249],outline=(240,240,240),width=6)
    d.ellipse([22,40,192,210],fill=(250,206,30));tw=d.textlength(n,font=fb);d.text((107-tw/2,58),n,font=fb,fill=(20,20,20))
    for j,t in enumerate((a,b,c)):d.text((210,40+j*62),t,font=fc,fill=(255,255,255))
    sa.paste(im,(0,i*256))
crush(sa,(128,64*len(AISLE)),48).save(f'{OUT}/aisle.webp',quality=90)
# cardboard case prints: 4 cells (side faces of overstock cases), kraft + one-colour flexo print
CASE=[('SUNNY HOOPS','12 x 375 g','THIS SIDE UP'),('CAMPO FRESCO','24 x 400 ml','FRÁGIL'),('KIBO RICE','6 x 2 kg','ATTENZIONE'),('ASEO TOTAL','8 x 3 L','HANDLE WITH CARE')]
ca=Image.new('RGB',(256,128*len(CASE)));fk=font(U+'NimbusSans-Bold.otf',28);fk2=font(F+'DejaVuSans.ttf',18)
for i,(a,b,c) in enumerate(CASE):
    im=Image.new('RGB',(256,128),(176,132,82));d=ImageDraw.Draw(im)
    for _ in range(400):x,y=rnd.randrange(256),rnd.randrange(128);d.point((x,y),fill=(150+rnd.randrange(30),110+rnd.randrange(25),66))
    col=[(40,40,40),(30,60,120),(140,30,30),(30,90,50)][i];d.text((12,14),a,font=fk,fill=col);d.text((12,58),b,font=fk2,fill=col);d.text((12,92),c,font=fk2,fill=col)
    d.rectangle([0,0,255,127],outline=(120,86,50),width=3);d.rectangle([0,0,255,8],fill=(196,170,120))
    ca.paste(im,(0,i*128))
crush(ca.filter(ImageFilter.GaussianBlur(.4)),(128,64*len(CASE)),32).save(f'{OUT}/case.webp',quality=90)
# belt rubber: dark ribbed, tiles along the belt (0.5 m)
be=Image.new('RGB',(128,128),(34,35,36));d=ImageDraw.Draw(be)
for y in range(0,128,8):d.line([(0,y),(127,y)],fill=(22,22,23),width=2);d.line([(0,y+3),(127,y+3)],fill=(48,48,49))
for _ in range(300):d.point((rnd.randrange(128),rnd.randrange(128)),fill=(60,60,58))
crush(be,(64,64),12).save(f'{OUT}/belt.webp',quality=90)
# basket wall (RGBA: red moulded plastic with slot holes), cart wire mesh (RGBA grid), produce-stand planks
bk=Image.new('RGBA',(128,64),(196,28,30,255));d=ImageDraw.Draw(bk)
for r in range(3):
    for c in range(9):d.rounded_rectangle([8+c*13,12+r*15,16+c*13,22+r*15],2,fill=(0,0,0,0))
d.rectangle([0,0,127,5],fill=(170,20,24,255));d.rectangle([0,58,127,63],fill=(150,18,20,255))
bk.resize((64,32),Image.NEAREST).save(f'{OUT}/basket.webp',lossless=True)
wi=Image.new('RGBA',(64,64),(0,0,0,0));d=ImageDraw.Draw(wi)
for i in range(0,64,8):d.line([(i,0),(i,63)],fill=(190,192,190,255),width=1);d.line([(0,i),(63,i)],fill=(190,192,190,255),width=1)
wi.save(f'{OUT}/wire.webp',lossless=True)
wd=Image.new('RGB',(256,256));d=ImageDraw.Draw(wd)
for k in range(8):
    base=(120+rnd.randrange(-14,14),82+rnd.randrange(-10,10),48+rnd.randrange(-8,8));d.rectangle([0,k*32,255,k*32+31],fill=base)
    for _ in range(26):y=k*32+rnd.randrange(2,30);d.line([(0,y),(255,y+rnd.randrange(-2,3))],fill=tuple(max(0,v-rnd.randrange(8,26)) for v in base))
    d.line([(0,k*32),(255,k*32)],fill=(52,34,20),width=2)
    for x in (rnd.randrange(20,100),rnd.randrange(150,240)):d.ellipse([x-2,k*32+14,x+2,k*32+18],fill=(60,50,40))
crush(wd.filter(ImageFilter.GaussianBlur(.6)),(64,64),24).save(f'{OUT}/wood.webp',quality=90)
print(json.dumps(slots))
