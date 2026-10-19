# V135-capital ③-3b SoHo focal spire tower: one generated elevation per face (art-v135spire/spire_<face>.png, tower drawn as a
# narrow strip on flat grey) -> auto-cropped to the facade -> atlas of 8 cells 128x512 (order ORDER, = SPIRE135_CELLS in
# dist/soho135-spire.js) + normal map, and the seamless copper roof 256x256. Prints each crop's aspect (height/width).
# Run from project root.
import json,numpy as np
from PIL import Image,ImageFilter
SRC='art-v135spire';OUT='bc/dist/assets/l11-v135s'
ORDER=['shaftS','shaftW','shaftN','shaftE','upperS','upperW','upperN','upperE']
def crop(im):
    a=np.asarray(im.convert('RGB')).astype(np.float32);H,W,_=a.shape
    bg=np.median(np.concatenate([a[:8,:8].reshape(-1,3),a[:8,-8:].reshape(-1,3)]),0)
    m=(np.abs(a-bg).max(2)>22)
    cols=np.where(m.mean(0)>.35)[0];rows=np.where(m[:,cols[0]:cols[-1]+1].mean(1)>.5)[0]
    l,r,t,b=cols[0],cols[-1]+1,rows[0],rows[-1]+1
    i=int((r-l)*.006)+1;return im.crop((l+i,t+1,r-i,b))
def q(c):return Image.fromarray((np.asarray(c)//8*8+4).astype(np.uint8))
at=Image.new('RGB',(128*len(ORDER),512));asp={}
for i,k in enumerate(ORDER):
    im=crop(Image.open(f'{SRC}/spire_{k}.png'));asp[k]=round(im.height/im.width,3)
    at.paste(q(im.convert('RGB').resize((128,512),Image.LANCZOS).filter(ImageFilter.GaussianBlur(.35))),(i*128,0))
at.save(f'{OUT}/spire.webp',quality=88)
g=np.asarray(at.convert('L').filter(ImageFilter.GaussianBlur(1))).astype(np.float32)/255
dx=np.zeros_like(g);dy=np.zeros_like(g);dx[:,1:-1]=g[:,2:]-g[:,:-2];dy[1:-1]=g[2:]-g[:-2]
n=np.dstack([-dx*2.2,dy*2.2,np.ones_like(g)]);n/=np.linalg.norm(n,axis=2,keepdims=True)
Image.fromarray(((n*.5+.5)*255).astype(np.uint8)).save(f'{OUT}/spire-n.webp',quality=90)
cu=Image.open(f'{SRC}/spire_copper.png').convert('RGB').resize((256,256),Image.LANCZOS).filter(ImageFilter.GaussianBlur(.4))
q(cu).save(f'{OUT}/spire-copper.webp',quality=88)
print(json.dumps(asp))
