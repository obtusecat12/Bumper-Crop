# V136-atm-lobby: ATM building lobby textures (art-v136atm/*.png generated large) -> seamless, downscaled, quantized
# PS1 tiles + normal maps in bc/dist/assets/atm136. Ceiling plaster is procedural (no generated source).
# Run from project root with system python3 (PIL only).
import os,random
from PIL import Image,ImageChops,ImageFilter,ImageDraw,ImageOps
SRC='art-v136atm';OUT='bc/dist/assets/atm136';os.makedirs(OUT,exist_ok=True)
def seamless(im):
    w,h=im.size;sh=ImageChops.offset(im,w//2,h//2)
    m=Image.new('L',(w,h));d=ImageDraw.Draw(m)
    for i in range(w//2):
        v=int(255*min(1,i/(w*.22)));d.line([(i,0),(i,h)],fill=v);d.line([(w-1-i,0),(w-1-i,h)],fill=v)
    m2=Image.new('L',(w,h));d=ImageDraw.Draw(m2)
    for j in range(h//2):
        v=int(255*min(1,j/(h*.22)));d.line([(0,j),(w,j)],fill=v);d.line([(0,h-1-j),(w,h-1-j)],fill=v)
    m=ImageChops.multiply(m,m2)
    return Image.composite(im,sh,m)
def crush(im,size,colors):
    im=im.resize((size,size),Image.LANCZOS).filter(ImageFilter.GaussianBlur(.35))
    return im.quantize(colors,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.FLOYDSTEINBERG).convert('RGB')
def normal(im,strength):
    L=im.convert('L').filter(ImageFilter.GaussianBlur(.8))
    dx=L.filter(ImageFilter.Kernel((3,3),[-1,0,1,-2,0,2,-1,0,1],1/strength,128))
    dy=L.filter(ImageFilter.Kernel((3,3),[-1,-2,-1,0,0,0,1,2,1],1/strength,128))
    b=Image.new('L',im.size,235)
    return Image.merge('RGB',(ImageOps.invert(dx),dy,b))
def job(src,box,name,size,colors,ns,tint=None):
    im=Image.open(os.path.join(SRC,src)).convert('RGB').crop(box)
    if tint:
        r,g,b=im.split();im=Image.merge('RGB',(r.point(lambda v:min(255,int(v*tint[0]))),g.point(lambda v:min(255,int(v*tint[1]))),b.point(lambda v:min(255,int(v*tint[2])))))
    im=seamless(im.resize((768,768),Image.LANCZOS))
    t=crush(im,size,colors);t.save(f'{OUT}/{name}.webp',quality=92)
    normal(im.resize((size,size),Image.LANCZOS),ns).save(f'{OUT}/{name}_n.webp',quality=90)
job('atm136_marble.png',(0,0,768,768),'marble',256,48,10)
job('atm136_marble.png',(640,0,1408,768),'marble2',256,48,10,(1.0,.985,.96))   # stair treads + 2F floor
job('atm136_inlay.png',(320,0,1088,768),'inlay',128,32,8)
job('atm136_pebble.png',(320,0,1088,768),'pebble',256,64,2.5)
job('atm136_plaster.png',(0,0,768,768),'wall',128,24,14)
job('atm136_plaster.png',(640,0,1408,768),'column',128,24,14,(1.02,1.0,.93))
# procedural ceiling: fine stipple on cool off-white
random.seed(136);c=Image.new('RGB',(512,512),(236,234,226));d=ImageDraw.Draw(c)
for _ in range(26000):
    x,y=random.randrange(512),random.randrange(512);v=random.randint(-14,10);r=random.choice((1,1,1,2))
    d.ellipse([x,y,x+r,y+r],fill=(236+v,234+v,226+v))
c=seamless(c.resize((768,768)));crush(c,128,16).save(f'{OUT}/ceil.webp',quality=92);normal(c.resize((128,128)),18).save(f'{OUT}/ceil_n.webp',quality=90)
# sunset backdrop for the sea-side glazing (user: outside view not important yet) - simple banded gradient
s=Image.new('RGB',(64,128));d=ImageDraw.Draw(s)
stops=[(0,(214,226,240)),(52,(250,214,196)),(78,(255,190,150)),(84,(255,236,190)),(86,(150,160,180)),(128,(90,112,140))]
for y in range(128):
    for (a,ca),(b,cb) in zip(stops,stops[1:]):
        if a<=y<=b:t=(y-a)/max(1,b-a);d.line([(0,y),(64,y)],fill=tuple(int(ca[k]+(cb[k]-ca[k])*t) for k in range(3)));break
s.save(f'{OUT}/sky.webp',quality=92)
print('ok',sorted(os.listdir(OUT)))
