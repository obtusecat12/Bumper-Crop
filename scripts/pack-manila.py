"""Runtime encoding and approximate micro-normal/roughness derivation; originals stay unchanged."""
from pathlib import Path
from PIL import Image, ImageFilter
import numpy as np
import shutil
root=Path(__file__).resolve().parents[1]
src=root/'art-source/manila'; out=root/'dist/assets/manila';out.mkdir(parents=True,exist_ok=True)
items={'wallpaper':('surfaces/wallpaper-refined-native.png',(1024,1024)), 'floorboards':('surfaces/manila-floorboards-native.png',(1024,1024)), 'door':('fittings/manila-door.png',(512,1024)), 'cabinet':('fittings/manila-cabinet-panel.png',(512,768)), 'cane':('fittings/manila-chair-seat.png',(512,512)), 'breaker-enamel':('fittings/breaker-enamel.png',(512,512))}
for name,(file,size) in items.items():
    im=Image.open(src/file).convert('RGB');im.resize(size,Image.Resampling.LANCZOS).save(out/(name+'.webp'),quality=89)
    nsize=(256,round(256*size[1]/size[0]));small=im.resize(nsize,Image.Resampling.LANCZOS)
    h=np.asarray(small.convert('L').filter(ImageFilter.GaussianBlur(.55)),dtype=float)/255
    dx=(np.roll(h,-1,axis=1)-np.roll(h,1,axis=1))*1.6;dy=(np.roll(h,-1,axis=0)-np.roll(h,1,axis=0))*1.6
    n=np.stack([-dx,dy,np.ones_like(h)],axis=2);n/=np.linalg.norm(n,axis=2,keepdims=True)
    Image.fromarray(np.uint8((n*.5+.5)*255)).save(out/(name+'-normal.webp'),quality=91)
    Image.fromarray(np.uint8(np.clip(.80+(h-.5)*.12,0,1)*255)).save(out/(name+'-roughness.webp'),quality=88)
shutil.copyfile(src/'references/interior-reference.jpeg',out/'wallpaper-photo-source.jpg')
print('Encoded six material sets; copied original wallpaper source without alteration.')
