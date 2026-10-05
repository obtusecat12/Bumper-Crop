from pathlib import Path
from PIL import Image,ImageFilter
import numpy as np
root=Path(__file__).resolve().parents[1];src=root/'art-source/level0-k92';out=root/'dist/assets/level0-k92';out.mkdir(exist_ok=True)
for name,sub in [('chair-wood','manila'),('cabinet-oak','kane'),('speaker-cloth','kane'),('chair-plastic','kane'),('beige-corduroy','kane')]:
 im=Image.open(src/sub/(name+'-native.png')).convert('RGB');im.resize((1024,1024),Image.Resampling.LANCZOS).save(out/(name+'.webp'),quality=86)
 h=np.asarray(im.resize((256,256),Image.Resampling.LANCZOS).convert('L').filter(ImageFilter.GaussianBlur(.5)),dtype=float)/255
 dx=(np.roll(h,-1,1)-np.roll(h,1,1))*1.8;dy=(np.roll(h,-1,0)-np.roll(h,1,0))*1.8;n=np.stack([-dx,dy,np.ones_like(h)],axis=2);n/=np.linalg.norm(n,axis=2,keepdims=True)
 Image.fromarray(np.uint8((n*.5+.5)*255)).save(out/(name+'-normal.webp'),quality=90)
 Image.fromarray(np.uint8(np.clip(.78+(h-.5)*.15,0,1)*255)).save(out/(name+'-roughness.webp'),quality=85)
 if name=='beige-corduroy':Image.fromarray(np.uint8(h*255)).save(out/(name+'-height.webp'),quality=88)
Image.open(src/'manila/field-notes-native.png').convert('RGB').resize((768,1086),Image.Resampling.LANCZOS).save(out/'field-notes.webp',quality=87)
print('Encoded 6 native artworks and estimated material-detail maps:',sum(p.stat().st_size for p in out.iterdir()),'bytes')
