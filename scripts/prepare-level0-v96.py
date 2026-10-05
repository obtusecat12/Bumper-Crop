from pathlib import Path
from PIL import Image,ImageFilter
import numpy as np,json
root=Path(__file__).resolve().parents[1];src=root/'art-source/level0-v96';out=root/'dist/assets/level0-v96'
items={'rug':('01-russet-traditional-rug',(512,342),.98),'brown-door':('brown-door',(256,512),.78),'white-door':('white-door',(256,512),.88),'pink-insulation':('03-pink-fiberglass',(512,512),.97),'pool-tile':('04-blue-pool-tiles',(512,512),.56),'plaster':('05-pale-beige-plaster',(512,512),.98),'joist':('06-exposed-joist-wood',(512,256),.92)}
for name,(stem,size,rough) in items.items():
 im=Image.open(src/(stem+'.png')).convert('RGB').resize(size,Image.Resampling.LANCZOS);im.save(out/(name+'.webp'),quality=82,method=4)
 gray=np.asarray(im.convert('L'),dtype=float)/255;lo=np.asarray(im.convert('L').filter(ImageFilter.GaussianBlur(2)),dtype=float)/255
 if name=='pool-tile':
  rgb=np.asarray(im,dtype=float)/255;grout=np.clip((rgb.min(axis=2)-.58)*5,0,1);height=-grout*.12+(gray-lo)*.06
 else:height=(gray-lo)*(.90 if name=='pink-insulation' else .35)+gray*.035
 dx=np.roll(height,-1,1)-np.roll(height,1,1);dy=np.roll(height,-1,0)-np.roll(height,1,0);n=np.stack((-dx*2.1,dy*2.1,np.ones_like(dx)),axis=-1);n/=np.linalg.norm(n,axis=2)[...,None]
 Image.fromarray(np.uint8(np.clip(n*.5+.5,0,1)*255)).save(out/(name+'-normal.webp'),lossless=True,method=6)
 Image.fromarray(np.uint8(np.clip(rough+(gray-lo)*.12,0,1)*255)).resize((size[0]//2,size[1]//2),Image.Resampling.LANCZOS).save(out/(name+'-roughness.webp'),lossless=True,method=6)
assert all(p.stat().st_size>0 for p in out.glob('*.webp')), 'Empty encoded image'
manifest={'newNativeTextureImages':6,'runtimeSurfaces':7,'runtimeMaps':21,'runtimeBytes':sum(p.stat().st_size for p in out.iterdir()),'method':'Generated originals retained. Single low-fi resize; lossless approximate luminance micro-normals and single-channel roughness. Pool grout height inverted. No measured PBR scan claims. Four generated reference enlargements are analysis aids, not original references nor runtime evidence.'}
(src/'derivation.json').write_text(json.dumps(manifest,indent=2));print(manifest)
