# V135-capital ③ SoHo street: generated facade elevations (art-v135soho/soho_<side><i>.png, one image per building) ->
# per-side atlases (4 cells of 256x512, cell = whole facade, content aspect kept by the mesh) + normal maps.
# Prints the crop aspect (height/width) per facade for dist/soho135-street.js.
import glob,json,os,numpy as np
from PIL import Image,ImageFilter
SRC='art-v135soho';OUT='bc/dist/assets/l11-v135s';os.makedirs(OUT,exist_ok=True)
def crop(im):
    a=np.asarray(im.convert('RGB')).astype(np.float32);L=a.mean(2);H,W=L.shape
    sat=a.max(2)-a.min(2)
    t=0
    while t<H*.08:
        r=L[t];s=sat[t]
        if (r>200).mean()>.5 and r.std()<28: t+=1
        else: break
    t+=2
    b=H-int(H*.012)
    # sidewalk strip: very uniform rows at the bottom
    while b>H*.9 and L[b-1].std()<14: b-=1
    l=int(W*.012);r=W-int(W*.012)
    return im.crop((l,t,r,b))
asp={}
for side in 'abcd':
    fs=sorted(glob.glob(f'{SRC}/soho_{side}[0-9].png'));at=Image.new('RGB',(256*len(fs),512))
    for i in range(len(fs)):
        im=crop(Image.open(f'{SRC}/soho_{side}{i}.png'))
        asp[f'{side}{i}']=round(im.height/im.width,4)
        # low-fi: downscale large -> cell, light blur, 5-bit quantize
        c=im.resize((256,512),Image.LANCZOS).filter(ImageFilter.GaussianBlur(.35))
        c=Image.fromarray((np.asarray(c)//8*8+4).astype(np.uint8))
        at.paste(c,(i*256,0))
    at.save(f'{OUT}/facade_{side}.webp',quality=88)
    g=np.asarray(at.convert('L').filter(ImageFilter.GaussianBlur(1))).astype(np.float32)/255
    dx=np.zeros_like(g);dy=np.zeros_like(g);dx[:,1:-1]=g[:,2:]-g[:,:-2];dy[1:-1]=g[2:]-g[:-2]
    k=2.2;n=np.dstack([-dx*k,dy*k,np.ones_like(g)]);n/=np.linalg.norm(n,axis=2,keepdims=True)
    Image.fromarray(((n*.5+.5)*255).astype(np.uint8)).save(f'{OUT}/facade_{side}-n.webp',quality=90)
print(json.dumps(asp))
