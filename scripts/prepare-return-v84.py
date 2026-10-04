from PIL import Image,ImageFilter
import numpy as np
from pathlib import Path
import shutil,json
root=Path(__file__).resolve().parents[1]
src=root/'art-source/return-v84';out=root/'dist/textures/return-alley';album=root/'dist/textures/transit-v84';album.mkdir(parents=True,exist_ok=True)
if not src.exists():shutil.copytree(root.parent/'v84-art',src)
for name,source in {'backdrop-a':'backdrops/concrete-elevators-left.png','backdrop-b':'backdrops/grain-bins-water-tower-right.png','warning-no':'portal/no-trespassing.png','warning-staff':'portal/employees-only.png','warning-vehicles':'portal/authorized-vehicles-only.png','green':'portal/municipal-green-steel.png','yellow':'portal/road-safety-yellow-concrete.png'}.items():
    im=Image.open(src/source).convert('RGBA' if name.startswith('backdrop') else 'RGB');im.thumbnail((1536,512) if name.startswith('backdrop') else (768,512) if name.startswith('warning') else (512,512),Image.Resampling.LANCZOS);im.save(out/(name+'.webp'),quality=90,method=6)
    if name not in ['green','yellow']:continue
    h=np.asarray(im.convert('L').filter(ImageFilter.GaussianBlur(.7)),dtype=np.float32)/255
    gx=(np.roll(h,-1,axis=1)-np.roll(h,1,axis=1))*1.6;gy=(np.roll(h,-1,axis=0)-np.roll(h,1,axis=0))*1.6
    n=np.dstack((-gx,gy,np.ones_like(h)));n/=np.linalg.norm(n,axis=2,keepdims=True);Image.fromarray(np.uint8(np.clip(n*.5+.5,0,1)*255)).save(out/(name+'-normal.webp'),quality=94)
    Image.fromarray(np.uint8(np.clip(.65+h*.25,0,1)*255)).save(out/(name+'-rough.webp'),quality=90)
manifest=[]
for kind in ['city','rural']:
    files=sorted((src/(kind+'-a')).glob('*.png'))+sorted((src/(kind+'-b')).glob('*.png'))
    assert len(files)==10,(kind,len(files))
    for i,p in enumerate(files,1):
        im=Image.open(p).convert('RGB');im.thumbnail((1440,1080),Image.Resampling.LANCZOS);name=f'{kind}-{i:02}.webp';im.save(album/name,quality=87,method=6);manifest.append({'file':name,'source':str(p.relative_to(root)),'size':im.size})
(album/'provenance.json').write_text(json.dumps({'method':'20 independently image-generated original photographs; resized and WebP encoded only. Full prompts retained in art-source/return-v84.','images':manifest},ensure_ascii=False,indent=2))
print('20 independent album images; 7 generated portal and horizon images; 4 derived data maps.')
