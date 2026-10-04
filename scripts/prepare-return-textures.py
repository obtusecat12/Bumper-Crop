from PIL import Image,ImageFilter
import numpy as np
from pathlib import Path
root=Path(__file__).resolve().parents[1]
src=root/'art-source/return-alley';out=root/'dist/textures/return-alley'
items={'asphalt':'ground/asphalt-flour-source.png','clay':'ground/clay-gravel-flour-source.png','brick':'ground/aged-dark-red-brick-source.png','burlap':'sacks/burlap-flour-print.png','kraft':'sacks/kraft-flour-print.png','wood':'sacks/rain-dark-pallet-planks.png','steel':'sacks/rusty-corrugated-siding.png','plants':'ground/wheat-dry-grass-alpha-atlas.png'}
for name,path in items.items():
 im=Image.open(src/path).convert('RGBA' if name=='plants' else 'RGB');size=(1024,682) if name=='plants' else (512,768) if name in ['burlap','kraft'] else (512,512);im=im.resize(size,Image.Resampling.LANCZOS);im.save(out/(name+'.webp'),quality=91)
 if name=='plants':continue
 h=np.asarray(im.convert('L').filter(ImageFilter.GaussianBlur(.65)),dtype=np.float32)/255
 gx=(np.roll(h,-1,axis=1)-np.roll(h,1,axis=1))*2;gy=(np.roll(h,-1,axis=0)-np.roll(h,1,axis=0))*2
 n=np.dstack((-gx,gy,np.ones_like(h)));n/=np.linalg.norm(n,axis=2,keepdims=True);Image.fromarray(np.uint8(np.clip(n*.5+.5,0,1)*255)).save(out/(name+'-normal.webp'),quality=95)
 rough=np.clip(.76+h*.20 if name!='steel' else .40+h*.30,0,1);Image.fromarray(np.uint8(rough*255)).save(out/(name+'-rough.webp'),quality=90)
print('8 generated diffuse assets and 14 derived normal/roughness maps prepared')
