# V144 B2 alley barricade props (door slab, cast-iron stove, bucket, DOOR board, tarps + frame, graffiti shed, picket fence,
# garbage bags, hay, rope, plastic film): generated sources art-v144/b144b2_*.png -> bc/dist/assets/l11-v144/b2_*.webp
# (base, -n normal, -r roughness per item). Spray paint (DOOR arrow, shed graffiti), the bucket label, the notices, the rope
# and the film are drawn here. Run from the project root (system python3 + PIL).
from PIL import Image,ImageFilter,ImageOps,ImageChops,ImageEnhance,ImageDraw,ImageFont
import math,os,random,sys
sys.path.insert(0,'bc/tools')
SRC='art-v144/b144b2_';OUT='bc/dist/assets/l11-v144/';os.makedirs(OUT,exist_ok=True)
R=random.Random(1443)
BOLD='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';SANS='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
ITAL='/usr/share/fonts/opentype/urw-base35/URWBookman-LightItalic.otf'
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
def kit(name,im,size,rough_base,rough_span=50,nstr=2.5,hr=5,tile=False,height=None):
    if tile:im=seam(im)
    im=im.convert('RGB').resize(size,Image.LANCZOS);save(im,name)
    g=(height or im.convert('L')).resize(size);save(normal_from_height(hpass(g,hr),nstr),name+'-n',92)
    r=ImageChops.add(ImageOps.invert(im.convert('L')).point(lambda v:int(v*rough_span/255)),Image.new('L',size,rough_base))
    save(Image.merge('RGB',(r,r,r)),name+'-r');return im
def src(n):return Image.open(SRC+n+'.png').convert('RGB')
def spray(im,text,xy,size,col,ang=0,font=BOLD,blur=1.2,R=R,jit=0):
    """spray paint: soft edged, overspray specks, slight drips"""
    W,H=im.size;m=Image.new('L',(W,H),0);d=ImageDraw.Draw(m);f=ImageFont.truetype(font,size)
    x,y=xy
    for ch in text:   # per-glyph jitter = hand sprayed
        d.text((x,y+R.uniform(-jit,jit)),ch,font=f,fill=255);x+=d.textlength(ch,font=f)*R.uniform(.9,1.05)
    if ang:m=m.rotate(ang,resample=Image.BICUBIC,center=xy)
    return paint_mask(im,m,col,blur)
def paint_mask(im,m,col,blur=1.2):
    W,H=im.size;px=m.load()
    for _ in range(W*H//400):
        x,y=R.randrange(W),R.randrange(H)
        if px[x,y]>60:
            for k in range(2):
                xx,yy=x+R.randint(-14,14),y+R.randint(-14,14)
                if 0<=xx<W and 0<=yy<H:px[xx,yy]=max(px[xx,yy],R.randint(60,200))
    bb=m.getbbox()
    if bb:  # drips
        for _ in range(6):
            x=R.randint(bb[0],bb[2]-1);ys=[y for y in range(bb[1],bb[3]) if px[x,y]>200]
            if ys:
                y0=ys[-1];L=R.randint(6,28)
                for y in range(y0,min(H,y0+L)):px[x,y]=max(px[x,y],int(220*(1-(y-y0)/L)))
    m=m.filter(ImageFilter.GaussianBlur(blur))
    return Image.composite(Image.new('RGB',im.size,col),im,m.point(lambda v:min(255,int(v*.95))))
# ---------------- door slab (0.91 x 2.03 m): long axis horizontal in the texture (u = along the door)
d=src('door').rotate(90,expand=True);d=ImageEnhance.Brightness(d).enhance(.97)
kit('b2_door',d,(1024,512),120,70,1.6,4)
kit('b2_alu',src('alu'),(512,256),85,60,1.2,3,tile=True)
kit('b2_iron',src('iron'),(512,256),175,40,3.0,5,tile=True)
# ---------------- bucket: white HDPE wall with a red/white warning label (front only), top row = rim band
b=src('bucket');W,H=b.size;b=seam(b)
lab=Image.new('RGB',(220,300),(244,242,236));dl=ImageDraw.Draw(lab);dl.rectangle([0,0,219,299],outline=(200,30,32),width=10)
dl.rectangle([12,12,207,70],fill=(200,30,32));dl.text((26,22),'WARNING',font=ImageFont.truetype(BOLD,32),fill=(250,250,250))
dl.ellipse([60,90,160,190],outline=(200,30,32),width=10);dl.line([75,175,145,105],fill=(200,30,32),width=10)
dl.ellipse([88,118,132,162],fill=(30,30,30))
for i,t in enumerate(['CHILDREN CAN FALL','INTO BUCKET','AND DROWN','KEEP CHILDREN AWAY','ADVERTENCIA']):dl.text((20,200+i*18),t,font=ImageFont.truetype(BOLD,14),fill=(30,30,30))
lab=lab.resize((int(220*H/700),int(300*H/700)))
b.paste(lab,(int(W*.38),int(H*.3)));kit('b2_bucket',b,(512,256),70,60,1.0,3)
# ---------------- DOOR board (2.6 x 0.24 m) with green spray arrow + lettering; plain board / frame lumber from other crops
p=src('plank');W,H=p.size;g=p.convert('L');rows=[y for y in range(H) if sum(g.getpixel((x,y)) for x in range(0,W,16))/(W/16)>55]
p=p.crop((8,rows[0]+10,W-8,rows[-1]-10));W,H=p.size;print('plank',p.size)
board=p.crop((0,int(H*.15),W,int(H*.65))).resize((2048,190))
GREEN=(46,170,92)
board=spray(board,'DOOR',(1380,22),132,GREEN,0,BOLD,1.6,jit=6)
m=Image.new('L',board.size,0);dm=ImageDraw.Draw(m)   # arrow pointing left with a hook down at the right end (photo)
dm.line([(150,92),(1150,80),(1240,110),(1262,190)],fill=255,width=16,joint='curve');dm.line([(150,92),(240,30)],fill=255,width=16);dm.line([(150,92),(250,150)],fill=255,width=16)
board=paint_mask(board,m,GREEN,1.8);kit('b2_dboard',board,(1024,96),160,50,2.0,3)
plain=ImageOps.mirror(p.crop((0,int(H*.4),W,int(H*.95)))).resize((1024,96));kit('b2_board',ImageEnhance.Color(plain).enhance(.8),(1024,96),165,50,2.0,3)
post=p.rotate(90,expand=True).resize((128,1024));kit('b2_post',ImageEnhance.Brightness(post).enhance(.85),(128,1024),170,45,2.2,3)
# ---------------- tarps (woven poly), seamless; fold shading comes from the geometry
kit('b2_tarpb',src('tarpb'),(512,256),95,60,2.2,2,tile=True)
kit('b2_tarpg',src('tarpg'),(512,256),110,60,2.2,2,tile=True)
# ---------------- shed front: cream siding with the blue graffiti, plus the blue-painted corrugated panel
s=src('siding');W,H=s.size;s=s.resize((1408,1056))   # wall ~2.0 x 1.5 m visible face
BLUE=(40,110,220);CYAN=(40,190,210)
s=spray(s,'Destroy',(420,170),150,BLUE,4,ITAL,1.4,jit=8)
s=spray(s,'What',(470,380),160,BLUE,-3,ITAL,1.4,jit=10);s=spray(s,'@',(680,370),120,BLUE,0,ITAL,1.4)
s=spray(s,'destroys',(450,580),150,BLUE,2,ITAL,1.4,jit=8);s=spray(s,'YOU',(700,780),150,BLUE,-2,ITAL,1.4,jit=8)
s=spray(s,'KAB ∂ 1D',(560,20),100,CYAN,0,ITAL,1.3,jit=6)
kit('b2_shed',s,(1024,768),150,60,2.2,4)
c=src('alu');c=ImageOps.colorize(c.convert('L'),(18,52,120),(90,150,230));c=spray(c,'NOBODY',(120,120),150,(20,40,170),-4,BOLD,1.2,jit=6)
c=spray(c,'CAN',(380,320),150,(20,40,170),0,BOLD,1.2,jit=6);c=spray(c,'DRIVE',(260,520),150,(240,240,250),3,BOLD,1.0,jit=6)
kit('b2_corr',c,(512,512),110,50,1.4,3)
# notices / stickers: 2 x 1 atlas (black event flyer, white typed notice)
n=Image.new('RGB',(512,512),(20,20,22));dn=ImageDraw.Draw(n)
dn.text((40,30),'COMMUNITY',font=ImageFont.truetype(BOLD,40),fill=(235,235,235));dn.text((40,80),'MEETING',font=ImageFont.truetype(BOLD,52),fill=(235,235,235))
for i in range(9):dn.rectangle([40,170+i*30,40+R.randint(240,420),184+i*30],fill=(190,190,190))
dn.rectangle([40,450,470,470],fill=(220,60,60))
n2=Image.new('RGB',(512,512),(232,230,222));d2=ImageDraw.Draw(n2);d2.text((40,30),'NOTICE',font=ImageFont.truetype(BOLD,56),fill=(20,20,20))
for i in range(12):d2.rectangle([40,120+i*28,40+R.randint(260,430),130+i*28],fill=(60,60,60))
dirt=src('iron').convert('L').resize((512,512))
def aged(im):return Image.composite(im,ImageEnhance.Brightness(im).enhance(.82),ImageOps.autocontrast(dirt).point(lambda v:255 if v>90 else 0).filter(ImageFilter.GaussianBlur(2)))
note=Image.new('RGB',(1024,512));note.paste(aged(n),(0,0));note.paste(aged(n2),(512,0));kit('b2_note',note,(512,256),200,30,.8,2)
# ---------------- picket fence green paint, garbage bag film, hay
kit('b2_pick',src('picket'),(256,512),130,50,2.0,3,tile=True)
kit('b2_bag',src('bag'),(512,256),60,90,3.0,3,tile=True)
h=seam(src('hay'));kit('b2_hay',h,(512,256),220,30,3.0,3)
# hay tuft cards (two tufts side by side): straw strands drawn as lines fanning up from the base, coloured from the hay photo
t=src('hay').resize((512,256),Image.LANCZOS);a=Image.new('L',(512,256),0);da=ImageDraw.Draw(a)
for half in (0,1):
    for i in range(170):
        x0=half*256+128+R.gauss(0,45);x0=min(half*256+250,max(half*256+6,x0));ang=R.gauss(0,.55);L=R.uniform(60,240)
        x1=x0+math.sin(ang)*L;y1=255-math.cos(ang)*L;da.line([(x0,255),((x0+x1)/2+R.uniform(-8,8),(255+y1)/2),(x1,y1)],fill=255,width=R.choice((2,2,3)))
tt=t.copy();tt.putalpha(a);tt.save(OUT+'b2_tuft.webp',lossless=True)
# ---------------- rope (white polypropylene, 3-strand twist), u around, v along: 64 x 256
rp=Image.new('L',(64,256));q=rp.load()
for y in range(256):
    for x in range(64):q[x,y]=int(150+90*abs(math.sin((x/64*3+y/256*12)*math.pi)))
rp=rp.filter(ImageFilter.GaussianBlur(1));rr=Image.merge('RGB',(rp,rp,rp.point(lambda v:int(v*.96))))
kit('b2_rope',rr,(64,256),150,40,2.5,2,height=rp)
# ---------------- plastic film shreds: clear stretch wrap with dirt and a red smear (photo), RGBA
f=Image.new('RGBA',(256,256),(0,0,0,0));fp=f.load()
cr=src('bag').convert('L').resize((256,256))
for y in range(256):
    for x in range(256):
        v=cr.getpixel((x,y));fp[x,y]=(min(255,200+v//4),min(255,200+v//4),min(255,205+v//4),int(60+v*.55))
fd=ImageDraw.Draw(f)
for _ in range(5):x,y=R.randint(60,200),R.randint(60,200);fd.ellipse([x-12,y-30,x+14,y+30],fill=(150,40,42,170))
f=f.filter(ImageFilter.GaussianBlur(1.2));f.save(OUT+'b2_film.webp',lossless=True)
print('ok')
