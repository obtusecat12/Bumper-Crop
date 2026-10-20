# V138-retail-interiors R3: bodega / liquor & smoke shop textures.
# Generated photos (art-v138retail/r3/r3_*.png, each generated large on its own, fictional brands) -> PS1-crushed strips:
#   beer.webp (beer-cave case rows, 4 bands), cigwall.webp (cigarette power wall), vape.webp, glass.webp (pipes),
#   papers.webp (rolling papers / lighters / cigarillo rack), cigars.webp (humidor shelves), lotto.webp (scratch-off
#   dispenser), liquor.webp (2 bands of back-bar bottles for the out-of-reach top rows).
# Re-used: the Tiki bar's 64 generated bottle labels (textures/tiki-v78/bottleLabels0..3, 4x4 cells each) -> one 8x8
#   labels.webp so every bodega bottle wears one of the Tiki labels. PIL-drawn: neon.webp (8 tube signs), fog.webp
#   (heated cooler-door condensation alpha), oak.webp (dark stained back-bar veneer, procedural grain).
# Run from project root (PIL only). Out: bc/dist/assets/l11-v138.
import os,random,math
from PIL import Image,ImageDraw,ImageFilter,ImageFont,ImageChops
SRC='art-v138retail/r3';OUT='bc/dist/assets/l11-v138';TIKI='bc/dist/textures/tiki-v78'
def crush(im,size,colors):
    im=im.resize(size,Image.LANCZOS).filter(ImageFilter.GaussianBlur(.3))
    return im.quantize(colors,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.FLOYDSTEINBERG).convert('RGB')
L=lambda f:Image.open(f'{SRC}/r3_{f}.png').convert('RGB')
# beer cave: four shelf bands; row 3 had a real-brand lookalike in the middle -> patched with row 1 cases
b=L('beercave');bands=[(79,216),(265,403),(452,600),(619,768)];bw,bh=512,72;beer=Image.new('RGB',(bw,bh*4))
for i,(y0,y1) in enumerate(bands):
    s=b.crop((40,y0,1336,y1)).copy()
    if i==2:s.paste(b.crop((40+275,79,40+540,216)).resize((265,y1-y0)),(275,0))
    beer.paste(s.resize((bw,bh),Image.LANCZOS),(0,i*bh))
crush(beer,beer.size,80).save(f'{OUT}/beer.webp',quality=86)
for name,box,size,c in [('cigwall',(0,0,1408,768),(512,280),72),('vape',(30,98,1356,766),(512,256),72),('glass',(0,160,1408,708),(512,200),64),
                        ('papers',(60,138,1316,708),(512,232),72),('cigars',(128,0,1288,768),(448,296),64),('lotto',(120,120,1300,674),(512,240),64)]:
    crush(L(name).crop(box),size,c).save(f'{OUT}/{name}.webp',quality=88)
lq=L('liquor');liq=Image.new('RGB',(512,256))
for i,(y0,y1) in enumerate([(11,334),(334,656)]):liq.paste(lq.crop((0,y0,1584,y1)).resize((512,128),Image.LANCZOS),(0,i*128))
crush(liq,liq.size,80).save(f'{OUT}/liquor.webp',quality=86)
# Tiki labels 4 x (2048, 4x4) -> 1024 8x8 (atlas a at (a%2, a//2))
lab=Image.new('RGB',(1024,1024))
for a in range(4):lab.paste(Image.open(f'{TIKI}/bottleLabels{a}.webp').convert('RGB').resize((512,512),Image.LANCZOS),((a%2)*512,(a//2)*512))
crush(lab,(1024,1024),128).save(f'{OUT}/labels.webp',quality=86)
# neon: 8 cells 256x128 (atlas 512x512): glowing tube lettering on black, emissive map in the game
F='/usr/share/fonts/truetype/dejavu/';U='/usr/share/fonts/opentype/urw-base35/'
def font(p,s):
    try:return ImageFont.truetype(p,s)
    except Exception:return ImageFont.truetype(F+'DejaVuSans-Bold.ttf',s)
NEON=[('OPEN',(255,40,60),(40,160,255),'box'),('COLD BEER',(40,170,255),None,'line'),('LOTTO',(255,220,40),(255,60,200),'star'),('CERVEZA FRÍA',(80,255,90),None,'line'),
      ('ATM',(40,230,255),(255,40,60),'box'),('CIGARS',(255,140,30),None,'line'),('VAPE · CBD',(200,60,255),(60,255,200),'box'),('24 HRS',(255,50,80),None,'line')]
CW,CH=1024,512;neon=Image.new('RGB',(CW*2,CH*4))
for k,(t,c1,c2,deco) in enumerate(NEON):
    cell=Image.new('RGB',(CW,CH),(6,5,8));glow=Image.new('L',(CW,CH));tube=Image.new('L',(CW,CH))
    fs=230 if len(t)<=5 else (150 if len(t)<=9 else 120);f=font(U+'NimbusSans-Bold.otf' if k%2==0 else U+'URWGothic-Demi.otf',fs)
    dt=ImageDraw.Draw(tube);bb=dt.textbbox((0,0),t,font=f);x=(CW-(bb[2]-bb[0]))//2-bb[0];y=(CH-(bb[3]-bb[1]))//2-bb[1]
    # tube = outline of the glyphs (hollow letters read as bent glass tube)
    mask=Image.new('L',(CW,CH));ImageDraw.Draw(mask).text((x,y),t,font=f,fill=255)
    tube=ImageChops.subtract(mask.filter(ImageFilter.MaxFilter(9)),mask.filter(ImageFilter.MinFilter(9)))
    col=Image.new('RGB',(CW,CH),c1)
    if c2:
        fr=Image.new('L',(CW,CH));df=ImageDraw.Draw(fr);m=26
        if deco=='box':df.rounded_rectangle([m,m,CW-m,CH-m],radius=60,outline=255,width=12)
        else:
            for a in range(5):
                r1,r2=(CH/2-30),(CH/2-120);pts=[]
                for i in range(10):ang=-math.pi/2+i*math.pi/5;r=r1 if i%2==0 else r2;pts.append((90+r*.55*math.cos(ang),CH/2+r*.55*math.sin(ang)))
            df.polygon(pts,outline=255,width=10);df.polygon([(CW-x2,y2) for x2,y2 in pts],outline=255,width=10)
        cell.paste(Image.new('RGB',(CW,CH),c2),(0,0),fr.filter(ImageFilter.GaussianBlur(14)));cell.paste(Image.new('RGB',(CW,CH),c2),(0,0),fr)
        cell.paste(Image.new('RGB',(CW,CH),tuple(min(255,v+120) for v in c2)),(0,0),fr.filter(ImageFilter.MinFilter(5)))
    cell.paste(col,(0,0),tube.filter(ImageFilter.GaussianBlur(22)));cell.paste(col,(0,0),tube.filter(ImageFilter.GaussianBlur(6)))
    cell.paste(Image.new('RGB',(CW,CH),tuple(min(255,v+150) for v in c1)),(0,0),tube.filter(ImageFilter.MinFilter(5)))
    # standoff clips + wire, so it reads as a real sign board
    d=ImageDraw.Draw(cell)
    for cx in(150,CW-150):d.rectangle([cx-8,CH-46,cx+8,CH-30],fill=(70,70,70))
    neon.paste(cell,((k%2)*CW,(k//2)*CH))
crush(neon,(512,512),96).save(f'{OUT}/neon.webp',quality=90)
# fog: alpha mask for heated glass doors (clear centre, condensation at the edges/bottom), 64x128 RGBA
fg=Image.new('L',(256,512));rnd=random.Random(1383);d=ImageDraw.Draw(fg)
for i in range(1400):
    x=rnd.random()*256;y=rnd.random()*512;edge=min(x,256-x,y*0.6,512-y)/128;a=int(max(0,1-edge)*190*rnd.random())
    r=rnd.randrange(2,9);d.ellipse([x-r,y-r,x+r,y+r],fill=a)
fg=fg.filter(ImageFilter.GaussianBlur(4));base=Image.linear_gradient('L').resize((256,512)).point(lambda v:int(40*(v/255)**3))
fg=ImageChops.add(fg,base);rgba=Image.merge('RGBA',[Image.new('L',fg.size,235)]*3+[fg])
rgba.resize((64,128),Image.LANCZOS).save(f'{OUT}/fog.webp',lossless=True)
# oak: procedural dark stained veneer, lacquered (smooth, low-contrast straight grain + a few cathedral arcs), 256x512
W,H=256,512;oak=Image.new('RGB',(W,H));px=oak.load();rnd=random.Random(77)
ph=[rnd.random()*6.28 for _ in range(5)]
for x in range(W):
    for y in range(H):
        u=x+9*math.sin(y*2*math.pi/H+ph[0])+5*math.sin(y*4*math.pi/H+ph[1])
        g=sum(math.sin(u*(0.06+0.17*i)+ph[i])*(0.62**i) for i in range(5))+0.5*math.sin(u*1.3+ph[2])*math.sin(u*.37)
        cat=math.sin(math.hypot(x-W/2,(y%H)-H*1.1)*.09)*max(0,1-abs(x-W/2)/70)
        v=0.5+0.2*g+0.18*cat;r=int(92+38*v);gg=int(44+20*v);bb=int(24+10*v);px[x,y]=(r,gg,bb)
oak=oak.filter(ImageFilter.GaussianBlur(.6))
crush(oak,(128,256),40).save(f'{OUT}/oak.webp',quality=92)
print('ok')
