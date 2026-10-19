# V135-capital ③-2 SoHo street fair: generated stall signs (art-v135stall/stall_NN.png, one image per stall) -> one 4x4 atlas of
# 256x128 cells (assets/l11-v135s/stalls.webp) + the police sawhorse board (barrier.webp, drawn here). Prints the sign aspect
# (height/width of the cropped sign) per stall for dist/soho135-fair.js. Run from the project root (needs numpy).
import glob,json,os,numpy as np
from PIL import Image,ImageFilter,ImageDraw,ImageFont
SRC='art-v135stall';OUT='bc/dist/assets/l11-v135s';os.makedirs(OUT,exist_ok=True)
def crop(im):
    a=np.asarray(im.convert('RGB')).astype(np.float32);H,W,_=a.shape
    bg=np.median(np.concatenate([a[:6].reshape(-1,3),a[-6:].reshape(-1,3),a[:,:6].reshape(-1,3),a[:,-6:].reshape(-1,3)]),0)
    d=np.abs(a-bg).max(2)>34
    rows=np.where(d.mean(1)>.35)[0];cols=np.where(d.mean(0)>.35)[0]
    t,b,l,r=rows[0],rows[-1],cols[0],cols[-1];p=2
    return im.crop((l+p,t+p,r-p,b-p))
fs=sorted(glob.glob(f'{SRC}/stall_[0-9][0-9].png'));CW,CH=256,128;at=Image.new('RGB',(CW*4,CH*4));asp=[]
for i,f in enumerate(fs):
    im=crop(Image.open(f).convert('RGB'));asp.append(round(im.height/im.width,4))
    c=im.resize((CW*2,CH*2),Image.LANCZOS).resize((CW,CH),Image.LANCZOS).filter(ImageFilter.GaussianBlur(.3))
    c=Image.fromarray((np.asarray(c)//8*8+4).astype(np.uint8));at.paste(c,((i%4)*CW,(i//4)*CH))
at.save(f'{OUT}/stalls.webp',quality=88)
# police sawhorse board: drawn large, worn, then reduced
B=Image.new('RGB',(1024,128),(28,58,142));g=ImageDraw.Draw(B)
try:F=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',70)
except Exception:F=ImageFont.load_default()
txt='POLICE LINE  DO NOT CROSS';w=g.textlength(txt,font=F);g.text(((1024-w)/2,22),txt,fill=(236,236,230),font=F)
rng=np.random.default_rng(135);a=np.asarray(B).astype(np.float32)
a+=rng.normal(0,7,a.shape[:2])[...,None];
for _ in range(60):
    x,y,r=rng.integers(0,1024),rng.integers(0,128),rng.integers(2,10);yy,xx=np.ogrid[:128,:1024];m=(xx-x)**2+(yy-y)**2<r*r;a[m]=a[m]*.55+np.array([120,110,90])*.45
a[:6]*=.6;a[-6:]*=.6
B=Image.fromarray(np.clip(a,0,255).astype(np.uint8)).resize((256,32),Image.LANCZOS)
Image.fromarray((np.asarray(B)//8*8+4).astype(np.uint8)).save(f'{OUT}/barrier.webp',quality=90)
print(json.dumps(asp))
