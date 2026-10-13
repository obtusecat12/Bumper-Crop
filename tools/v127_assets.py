# V127: art-v127/*.png (generated large, one per asset) -> bc/dist/assets/v127/*.webp low-fi.
import os,io,sys
from PIL import Image,ImageFilter,ImageEnhance
SRC=os.path.join(os.path.dirname(__file__),'../../art-v127');DST=os.path.join(os.path.dirname(__file__),'../dist/assets/v127')
os.makedirs(DST,exist_ok=True)
def jpeg(im,q):
    b=io.BytesIO();im.save(b,'JPEG',quality=q);b.seek(0);return Image.open(b).convert('RGB')
for f in sorted(os.listdir(SRC)):
    if not f.endswith('.png'):continue
    name=f[5:-4];im=Image.open(os.path.join(SRC,f)).convert('RGB')
    if name=='l27_compass':
        im=im.resize((256,256),Image.LANCZOS);im=ImageEnhance.Brightness(im).enhance(1.12);im=ImageEnhance.Contrast(im).enhance(1.08)
        im=im.resize((160,160),Image.BILINEAR).resize((256,256),Image.BILINEAR);im=jpeg(im,28)
    elif name.endswith('sv'):
        w,h=im.size;im=im.crop((0,int(h*.12),w,int(h*.88))) if h>=w else im
        im=im.resize((256,192),Image.LANCZOS).filter(ImageFilter.GaussianBlur(.6));im=jpeg(im,30)
    else:
        w,h=im.size;tw=h*4//3
        if w>tw:im=im.crop(((w-tw)//2,0,(w-tw)//2+tw,h))
        elif w<tw:th=w*3//4;im=im.crop((0,(h-th)//2,w,(h-th)//2+th))
        im=im.resize((400,300),Image.LANCZOS);im=jpeg(im,38)
    im.save(os.path.join(DST,name+'.webp'),'WEBP',quality=72,method=6)
    print(name,im.size,os.path.getsize(os.path.join(DST,name+'.webp')))
