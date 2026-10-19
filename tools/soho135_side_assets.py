# V135-capital ③-3 SoHo corner side returns: one generated elevation per corner building (art-v135side/side_<lot>.png,
# made with the lot's own front elevation as reference, wrap-around bay on the image's LEFT = street edge) ->
# one atlas of 8 cells 256x512 (order = SOHO135_SIDES in dist/soho135-layout.js) + normal map. Run from project root.
import json,os,numpy as np
from PIL import Image,ImageFilter
SRC='art-v135side';OUT='bc/dist/assets/l11-v135s'
ORDER=['a3','a4','b0','b3','c4','c2','d1','d3']
EXTRA={'c4':(.06,0,0,.045),'b3':(.045,0,.035,0),'b0':(.015,0,.015,0),'a4':(0,.055,0,0)}  # extra crop (l,t,r,b): sky/neighbour slivers
def crop(im,k):
    a=np.asarray(im.convert('RGB')).astype(np.float32);L=a.mean(2);H,W=L.shape
    t=0
    while t<H*.08 and (L[t]>200).mean()>.5 and L[t].std()<28: t+=1
    t+=2;b=H-int(H*.01)
    while b>H*.85 and L[b-1].std()<16: b-=1
    l,r=int(W*.01),W-int(W*.01)
    e=EXTRA.get(k,(0,0,0,0));l+=int(W*e[0]);t+=int(H*e[1]);r-=int(W*e[2]);b-=int(H*e[3])
    return im.crop((l,t,r,b))
at=Image.new('RGB',(256*len(ORDER),512));asp={}
for i,k in enumerate(ORDER):
    im=crop(Image.open(f'{SRC}/side_{k}.png'),k);asp[k]=round(im.height/im.width,3)
    c=im.resize((256,512),Image.LANCZOS).filter(ImageFilter.GaussianBlur(.35))
    at.paste(Image.fromarray((np.asarray(c)//8*8+4).astype(np.uint8)),(i*256,0))
at.save(f'{OUT}/side.webp',quality=88)
g=np.asarray(at.convert('L').filter(ImageFilter.GaussianBlur(1))).astype(np.float32)/255
dx=np.zeros_like(g);dy=np.zeros_like(g);dx[:,1:-1]=g[:,2:]-g[:,:-2];dy[1:-1]=g[2:]-g[:-2]
n=np.dstack([-dx*2.2,dy*2.2,np.ones_like(g)]);n/=np.linalg.norm(n,axis=2,keepdims=True)
Image.fromarray(((n*.5+.5)*255).astype(np.uint8)).save(f'{OUT}/side-n.webp',quality=90)
print(json.dumps(asp))
