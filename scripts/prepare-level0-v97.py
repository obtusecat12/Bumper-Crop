from pathlib import Path
from PIL import Image,ImageFilter
import numpy as np,json
root=Path(__file__).resolve().parents[1];src=root/'art-source/level0-v97';out=root/'dist/assets/level0-v97'
items={'fiberglass-porous':('fiberglass-porous',.97,.95),'red-gingham':('red-gingham-plastic',.49,.19),'mattress-ticking':('mattress-ticking',.97,.40),'wood-cut':('timber-cut-grain',.94,.52)}
for name,(stem,rough,gain) in items.items():
 im=Image.open(src/'textures'/(stem+'.png')).convert('RGB').resize((512,512),Image.Resampling.LANCZOS);im.save(out/(name+'.webp'),quality=82,method=4)
 gray=np.asarray(im.convert('L'),dtype=float)/255;lo=np.asarray(im.convert('L').filter(ImageFilter.GaussianBlur(2)),dtype=float)/255
 height=(gray-lo)*gain+gray*(.15 if name=='fiberglass-porous' else .03)
 dx=np.roll(height,-1,1)-np.roll(height,1,1);dy=np.roll(height,-1,0)-np.roll(height,1,0);n=np.stack((-dx*2.1,dy*2.1,np.ones_like(dx)),axis=-1);n/=np.linalg.norm(n,axis=2)[...,None]
 Image.fromarray(np.uint8(np.clip(n*.5+.5,0,1)*255)).save(out/(name+'-normal.webp'),lossless=True,method=4)
 Image.fromarray(np.uint8(np.clip(rough+(gray-lo)*.10,0,1)*255)).resize((256,256),Image.Resampling.LANCZOS).save(out/(name+'-roughness.webp'),lossless=True,method=4)
assert all(p.stat().st_size>0 for p in out.glob('*.webp'))
manifest={'nativeTextureImages':4,'runtimeMaps':12,'runtimeBytes':sum(p.stat().st_size for p in out.iterdir()),'note':'Independent generated diffuse sources. Estimated luminance-derived normal and roughness maps, not measured scans. 512px color and normal; 256px roughness; reference enlargements never loaded by game.'}
(src/'derivation.json').write_text(json.dumps(manifest,indent=2));print(manifest)
