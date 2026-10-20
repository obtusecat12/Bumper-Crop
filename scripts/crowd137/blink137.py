# V137 Q3: closed-eye ("blink") variants of the 24 crowd faces. face_<k>.png (128², faces135.py) -> face_<k>_blink.png:
# every pixel outside the two eye ellipses is copied unchanged; inside, the eye opening is painted over with lid skin
# (sampled above/below the eye), a soft lid shade and a dark lash line that curves down in the middle, 4x4 supersampled
# with a feathered edge. Eye centres/half-widths (128² px): opencv haarcascade_eye on the 512² crops, refined to the darkest
# 3x3 (iris) near the box centre, hand-fixed m7 left / f4 right (/workspace/work/v137d det.py, refine.py, chk.png).
import json,os,numpy as np
from PIL import Image
EYES=json.loads('{"c1":[[36,63,9],[91,63,7.0]],"c2":[[35,59,7.2],[87,59,7.5]],"f1":[[36,65,8.0],[90,64,7.9]],"f2":[[28,63,8.3],[89,62,7.9]],"f3":[[36,72,8.2],[91,72,7.6]],"m1":[[35,60,6.6],[92,60,6.5]],"m2":[[30,61,9],[98,62,9]],"m3":[[30,66,7.8],[91,65,7.8]],"m4":[[36,65,7.1],[90,64,7.3]],"m5":[[32,60,9],[94,59,8.4]],"m6":[[37,65,6.5],[88,64,6.8]],"m7":[[34,64,7.8],[94,64,8.2]],"m8":[[34,65,8.2],[94,65,8.3]],"m9":[[33,64,7.8],[93,64,7.8]],"f4":[[30,75,7.6],[91,75,7.4]],"f5":[[32,65,9],[90,64,6.5]],"f6":[[38,63,6.5],[91,63,6.5]],"f7":[[31,65,8.0],[96,64,8.6]],"f8":[[31,66,8.1],[98,63,7.7]],"f9":[[34,65,8.0],[91,64,8.2]],"c3":[[29,68,8.5],[98,68,8.6]],"c4":[[32,66,7.4],[96,66,7.7]],"c5":[[30,68,7.9],[97,68,8.9]],"c6":[[38,69,6.5],[95,68,7.3]]}')
A=os.path.dirname(os.path.abspath(__file__))+'/../../dist/assets/crowd135/'
SS=4
def skin(im,x0,x1,y0,y1):
  p=im[max(0,y0):y1,max(0,x0):x1].reshape(-1,3);l=p@[.299,.587,.114];return np.median(p[l>=np.median(l)],axis=0)
def blink(k):
  src=np.asarray(Image.open(A+f'face_{k}.png').convert('RGB')).astype(float);out=src.copy()
  for cx,cy,rx in EYES[k]:
    cx+=.5;cy+=1.0;ry=rx*.58;rx*=1.08
    cu=skin(src,int(cx-rx*.7),int(cx+rx*.7)+1,int(cy-ry-4),int(cy-ry-1))   # upper lid / brow-bone skin
    cl=skin(src,int(cx-rx*.7),int(cx+rx*.7)+1,int(cy+ry+1),int(cy+ry+4))   # lower lid skin
    patch=src[int(cy-ry):int(cy+ry)+1,int(cx-rx):int(cx+rx)+1].reshape(-1,3);dark=patch[np.argsort(patch@[.299,.587,.114])[:4]].mean(0)
    lash=dark*.55+cl*.45*.6
    for y in range(int(cy-ry-3),int(cy+ry+4)):
      for x in range(int(cx-rx-3),int(cx+rx+4)):
        acc=np.zeros(3);aa=0.
        for sy in range(SS):
          for sx in range(SS):
            px=x+(sx+.5)/SS;py=y+(sy+.5)/SS;u=(px-cx)/rx;v=(py-cy)/ry;e=u*u+v*v
            a=1. if e<1 else max(0.,1-(e**.5-1)/.45)
            if a<=0: continue
            ly=cy+ry*(.05+.30*max(0.,1-u*u))-.10*ry*u            # lash line: dips in the middle, outer corner a touch lower
            t=min(1.,max(0.,(py-(cy-ry))/(ly-(cy-ry)+1e-6)))
            lid=cu*.35+cl*.65;c=lid*(1-t)*1.0+lid*.9*t if py<ly else cl*.97                # convex lid: brow-bone tone, shading towards the lash line
            d=abs(py-ly)
            if d<.7 and abs(u)<.93: c=lash
            elif py<ly and d<1.6: c=c*.86                          # lid fold shadow just above the lashes
            acc+=c*a;aa+=a
        if aa: a=aa/(SS*SS);out[y,x]=out[y,x]*(1-a)+(acc/aa)*a
  o=np.clip(out+.5,0,255).astype(np.uint8);Image.fromarray(o).save(A+f'face_{k}_blink.png');return src.astype(np.uint8),o
if __name__=='__main__':
  for k in EYES:
    s,o=blink(k);m=(s!=o).any(2);ys,xs=np.nonzero(m);print(k,'changed px',int(m.sum()),'rows',ys.min(),ys.max())
