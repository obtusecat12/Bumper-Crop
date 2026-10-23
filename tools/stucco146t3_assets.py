# V146 T3 trees: run from the project root after stucco146_assets.py. Sources art-v146/m146_*.png, each generated large on its own.
#  pbark146(-n,-r) London plane camouflage bark      lbark146(-n,-r) common lime bark (ridged, moss)
#  pleaf146(-n) / lleaf146(-n) RGBA leaf-cluster cards (alpha from the keyed source, hard 1-bit edge, colour bled under
#  the cut so mip/lowres never shows a key fringe); aspect kept, printed for the card ratio in stucco146-t3.js
import numpy as np, sys
sys.path.insert(0,'bc/tools')
from stucco146_assets import save,load,rs,blur,lum,normal,xfade,flatten,maps,OUT,SRC
from PIL import Image, ImageFilter
for src,name,t,mix in(('m146_planebark.png','pbark146',(112,110,94),.5),('m146_limebark.png','lbark146',(70,66,58),.3)):
    a=flatten(load(src),50);H,W=a.shape[:2];c=a[:,(W-H)//2:(W-H)//2+H+96];c=xfade(c,96,96)
    mean=c.reshape(-1,3).mean(0);c=c+(np.array(t)-mean)*mix;maps(c,name,256,3.5,.9,-.5);print(name,c.shape)
for src,name in(('m146_planeleaf.png','pleaf146'),('m146_limeleaf.png','lleaf146')):
    a=np.asarray(Image.open(SRC+src).convert('RGBA'),dtype=np.float32);al=a[...,3]
    ys,xs=np.where(al>60);c=a[ys.min():ys.max()+1,xs.min():xs.max()+1];H,W=c.shape[:2];w=512;h=int(round(w*H/W/8))*8
    rgb=c[...,:3];m=c[...,3:]>110;mean=(rgb*m).reshape(-1,3).sum(0)/m.sum()
    rgb=np.where(m,rgb,mean);rgb=(rgb-mean)*.85+mean*np.array((.86,.95,.82))   # overcast: a touch darker / less yellow
    A=Image.fromarray((m[...,0]*255).astype(np.uint8)).resize((w,h),Image.LANCZOS);al2=(np.asarray(A,dtype=np.float32)>118)*255.
    col=rs(rgb,w,h);save_im=np.dstack([col,al2]);Image.fromarray(np.clip(save_im,0,255).astype(np.uint8)).save(OUT+name+'.webp',quality=92,method=6)
    hp=lum(col)-blur(lum(col),2);save(normal(hp/255,3.0),name+'-n');print(name,'card',w,h,'aspect h/w',round(h/w,3),'cover',round(al2.mean()/255,3))
# tree-pit soil (procedural, 1024 -> 256): dark damp loam, grit, a few fallen leaves (plane/lime tints)
rng=np.random.default_rng(146);S=1024
n=sum(blur(rng.normal(128,40,(S//k,S//k,3)).repeat(k,0).repeat(k,1),k/2)[...,0]*w for k,w in((64,.3),(16,.4),(4,.3)))
base=np.dstack([n*.34+18,n*.27+14,n*.21+10]);grit=rng.random((S,S))>.985;base[grit]=base[grit]*.4+np.array((120,112,100))*.6
yy,xx=np.mgrid[0:S,0:S]
for i in range(70):
    cx,cy,r,a=rng.random()*S,rng.random()*S,8+rng.random()*14,rng.random()*np.pi;dx,dy=xx-cx,yy-cy;u=dx*np.cos(a)+dy*np.sin(a);v=-dx*np.sin(a)+dy*np.cos(a)
    m=(u/r)**2+(v/(r*.55))**2<1;base[m]=np.array([(72,70,40),(96,82,44),(58,62,36)][i%3])*(.8+.4*rng.random())
maps(base,'soil146',256,3,.95,-.4)
print('soil ok')
