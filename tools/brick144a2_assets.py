# V144 A2 street + road works props in front of the capital brick slab: generated sources art-v144/b144a2_*.png
# -> bc/dist/assets/l11-v144/a2_*.webp (base, -n normal, -r roughness per item), plus PIL-drawn sign faces and the
# procedural chain-link alpha mesh, plus a silver repaint of the GGBotNet sedan (assets/l11-v132t/car5_silver.png).
# Run from the project root (system python3 + PIL).
from PIL import Image,ImageFilter,ImageOps,ImageChops,ImageEnhance,ImageDraw,ImageFont
import math,os,random
SRC='art-v144/';OUT='bc/dist/assets/l11-v144/';os.makedirs(OUT,exist_ok=True)
R=random.Random(1442)
def save(im,name,q=86):im.save(OUT+name+'.webp',quality=q,method=6)
def normal_from_height(h,strength=2.0):
    W,H=h.size;p=h.load();o=Image.new('RGB',(W,H));q=o.load()
    for y in range(H):
        for x in range(W):
            dx=(p[(x+1)%W,y]-p[(x-1)%W,y])/255*strength;dy=(p[x,(y+1)%H]-p[x,(y-1)%H])/255*strength
            l=math.sqrt(dx*dx+dy*dy+1);q[x,y]=(int((-dx/l*.5+.5)*255),int((dy/l*.5+.5)*255),int((1/l*.5+.5)*255))
    return o
def hpass(g,r=6):  # local height detail (lum minus blur), centred at 128
    b=g.filter(ImageFilter.GaussianBlur(r));return ImageChops.add(ImageChops.subtract(g,b,1,128),Image.new('L',g.size,0))
def seam(im,band=None):  # seamless both ways by cross-fading the far edge band into the near one
    for axis in (0,1):
        W,H=im.size
        if axis==0:
            bnd=band or W//8;core=im.crop((0,0,W-bnd,H));tail=im.crop((W-bnd,0,W,H));m=Image.linear_gradient('L').rotate(90,expand=True).resize((bnd,H));m=ImageOps.mirror(m)
            core.paste(Image.composite(tail,core.crop((0,0,bnd,H)),m),(0,0));im=core
        else:
            bnd=band or H//8;core=im.crop((0,0,W,H-bnd));tail=im.crop((0,H-bnd,W,H));m=ImageOps.flip(Image.linear_gradient('L').resize((W,bnd)))
            core.paste(Image.composite(tail,core.crop((0,0,W,bnd)),m),(0,0));im=core
    return im
def kit(name,im,size,rough_base,rough_span=50,nstr=2.5,hr=5,tile=False):
    if tile:im=seam(im)
    im=im.convert('RGB').resize(size,Image.LANCZOS);save(im,name)
    g=im.convert('L');h=hpass(g,hr);save(normal_from_height(h,nstr),name+'-n',92)
    r=ImageChops.add(ImageOps.invert(g).point(lambda v:int(v*rough_span/255)),Image.new('L',im.size,rough_base))
    save(Image.merge('RGB',(r,r,r)),name+'-r')
    return im
def src(n):return Image.open(SRC+'b144a2_'+n+'.png').convert('RGB')
# --- plywood: painted hoarding sheet (2.44 x 1.22) and raw sheet (box)
kit('a2_plyp',src('plypaint'),(512,256),150,60,2.2)
kit('a2_plyr',src('plyraw'),(512,256),170,50,1.8)
# --- HDPE water barrier: orange, plus a white unit moulding (white pigment, same plastic grade -> own colour pass + own grime)
o=src('hdpe');kit('a2_hdpe',o,(512,256),95,60,1.6,tile=True)
w=ImageOps.grayscale(o);w=ImageEnhance.Contrast(w).enhance(.55);w=w.point(lambda v:min(255,int(150+v*.55)))
grime=src('dirt').resize(o.size).convert('L').point(lambda v:255 if v<70 else 0).filter(ImageFilter.GaussianBlur(3))
wb=Image.merge('RGB',(w,w,w.point(lambda v:int(v*.97))));wb=Image.composite(ImageEnhance.Brightness(wb).enhance(.72),wb,ImageOps.flip(grime))
kit('a2_hdpw',wb,(512,256),100,55,1.6,tile=True)
# --- stripe barricade board: crop the board (bright rows/cols) out of the dark background
s=src('stripe');g=s.convert('L');W,H=g.size;px=g.load()
rows=[y for y in range(H) if sum(px[x,y] for x in range(W//4,3*W//4,8))/(W/16)>90];cols=[x for x in range(W) if sum(px[x,y] for y in range(rows[0],rows[-1],8))/((rows[-1]-rows[0])/8)>80]
s=s.crop((cols[0]+6,rows[0]+6,cols[-1]-6,rows[-1]-6));print('stripe crop',cols[0],rows[0],cols[-1],rows[-1]);kit('a2_strp',s,(512,128),120,60,1.4)
# --- diamond sign: crop to the diamond's bbox (non-grey pixels)
s=src('sign');hsv=s.convert('HSV');sat=hsv.split()[1];bb=sat.point(lambda v:255 if v>90 else 0).getbbox();print('sign bbox',bb)
kit('a2_sign',s.crop(bb),(256,256),110,50,1.2)
# --- corrugated pipe, cone, bin, shelter steel
kit('a2_pipe',src('pipe'),(512,256),90,50,3.0,tile=True)
c=src('cone');W,H=c.size;kit('a2_cone',c.crop((int(W*.02),int(H*.03),int(W*.98),int(H*.97))),(256,256),120,50,1.4)
kit('a2_bin',src('bin'),(256,256),150,60,2.0,tile=True)
kit('a2_stel',src('steel'),(256,256),110,50,1.2,tile=True)
kit('a2_dirt',src('dirt'),(512,512),220,35,3.2,tile=True)
# poster: inner lightbox picture (exclude the dark frame)
p=src('poster');rr,gg,_=p.split();bb=ImageChops.subtract(gg,rr).point(lambda v:255 if v>45 else 0).getbbox();x0,y0,x1,y1=bb;p=p.crop((x0+3,y0+3,x1-3,y1-3));print('poster',bb)
p.resize((128,192),Image.LANCZOS).save(OUT+'a2_post.webp',quality=88,method=6)
# --- sign faces drawn here (exact lettering), roughened with grime from the dirt source
dirt=src('dirt').convert('L')
def grimed(im,amt=.18):
    gr=dirt.resize(im.size).filter(ImageFilter.GaussianBlur(1));gr=ImageOps.autocontrast(gr)
    return Image.composite(im,ImageEnhance.Brightness(im).enhance(.78),gr.point(lambda v:255 if v>255*amt else int(v/amt)))
def font(sz):
    for f in['/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf','/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf']:
        if os.path.exists(f):return ImageFont.truetype(f,sz)
    return ImageFont.load_default()
S=512;im=Image.new('RGB',(S,S),(150,150,150));d=ImageDraw.Draw(im)
oct_=lambda r:[(S/2+r*math.cos(math.pi/8+i*math.pi/4),S/2+r*math.sin(math.pi/8+i*math.pi/4)) for i in range(8)]
d.polygon(oct_(S/2/math.cos(math.pi/8)*.995),fill=(235,235,230));d.polygon(oct_(S/2/math.cos(math.pi/8)*.93),fill=(178,28,30))
f=font(150);tw=d.textlength('STOP',font=f);d.text(((S-tw)/2,S/2-88),'STOP',font=f,fill=(240,240,236))
st=grimed(im);st.resize((128,128),Image.LANCZOS).save(OUT+'a2_stop.webp',quality=90);save(Image.new('RGB',(4,4),(110,110,110)),'a2_stop-r')
# street-name blades (two names, one per blade, both faces) 2 x (512x96) stacked
im=Image.new('RGB',(512,192),(22,110,62));d=ImageDraw.Draw(im);f=font(64)
for i,(t,n) in enumerate([('ALDER','ST'),('7TH','AVE')]):
    y=i*96;d.rectangle([4,y+4,507,y+91],outline=(235,240,235),width=4);d.text((26,y+12),t,font=f,fill=(240,244,240));d.text((380,y+30),n,font=font(40),fill=(240,244,240))
grimed(im,.1).resize((256,96),Image.LANCZOS).save(OUT+'a2_name.webp',quality=90)
# pedestrian push-button / crossing sign (yellow, pictogram) for the signal pole
im=Image.new('RGB',(256,256),(232,196,30));d=ImageDraw.Draw(im);d.rectangle([6,6,249,249],outline=(20,20,20),width=8)
d.ellipse([112,40,144,72],fill=(20,20,20));d.polygon([(118,78),(140,78),(150,150),(168,212),(150,216),(130,160),(112,216),(94,212),(110,150)],fill=(20,20,20))
for k in range(6):d.rectangle([30,226-k*0,226,232],fill=(20,20,20))
grimed(im,.12).resize((96,96),Image.LANCZOS).save(OUT+'a2_ped.webp',quality=90)
# --- chain-link: galvanized diamond wire mesh, RGBA (alpha-tested), 60 mm diamonds, tile = 0.48 m (8 diamonds)
T=256;N=8;cell=T/N;al=Image.new('L',(T*2,T*2),0);d=ImageDraw.Draw(al)
for k in range(-N,2*N+1):
    for x0 in (k*cell*2,):
        pass
for k in range(-2*N,4*N):
    # two families of zig-zag wires
    d.line([(k*cell*2,0),(k*cell*2+T*2,T*2)],fill=255,width=5);d.line([(k*cell*2,T*2),(k*cell*2+T*2,0)],fill=255,width=5)
al=al.resize((T,T),Image.LANCZOS)
col=Image.new('RGB',(T,T),(168,172,170));cg=dirt.resize((T,T)).filter(ImageFilter.GaussianBlur(2));col=Image.blend(col,Image.merge('RGB',(cg,cg,cg)),.25)
rgba=col.copy();rgba.putalpha(al.point(lambda v:255 if v>110 else 0));rgba.save(OUT+'a2_chain.webp',lossless=True)
save(normal_from_height(al.filter(ImageFilter.GaussianBlur(1)),3),'a2_chain-n',92)
# --- silver sedan paint: body pixels (where the stock red car5 differs from grey) lifted to a silver metallic
a=Image.open('bc/dist/assets/l11-v132t/car5_grey.png').convert('RGB');b=Image.open('bc/dist/assets/l11-v132t/car5.png').convert('RGB')
pa,pb=a.load(),b.load();o=a.copy();po=o.load()
for y in range(a.size[1]):
    for x in range(a.size[0]):
        r,g_,bl=pb[x,y]
        if r-bl>22:v=sum(pa[x,y])/3;k=min(255,int(v*2.0+18));po[x,y]=(k,k+2,min(255,k+8))
o.save('bc/dist/assets/l11-v132t/car5_silver.png')
print('ok')
