from pathlib import Path
from PIL import Image,ImageFilter
import numpy as np,base64,shutil,json
root=Path(__file__).resolve().parents[1]
src=root/'art-source/level0-v94'; dst=root/'dist/assets/level0-v94';dst.mkdir(parents=True,exist_ok=True)
files={'berber':'exec-4dc05e98-54ae-481d-8b3c-80a3ee4b2b92.png','ceiling':'exec-c68a3a33-9b70-4af3-81ed-3e9c42416e79.png','maple':'exec-6339fcf1-0dec-4268-aec4-eaacb9e9c3c6.png','velvet':'exec-97914cff-730c-4b32-8ce2-8a2b5843f782.png','green-seat':'exec-5bc5dc5e-2489-452f-94e0-52a6b4f5c0e0.png'}
for name,file in files.items():
 p=src/(name+'.png')
 if not p.exists():shutil.copyfile(root.parent/'generated_images'/file,p)
if (src/'linen.b64').exists():
 (src/'linen.png').write_bytes(base64.b64decode((src/'linen.b64').read_text()));(src/'linen.b64').unlink()
for name in [*files,'linen']:
 im=Image.open(src/(name+'.png')).convert('RGB').resize((512,512),Image.Resampling.LANCZOS)
 im.save(dst/(name+'.webp'),quality=87,method=6)
 # Estimated microrelief, not a measured height scan. Wrap derivatives at tile seams.
 gray=np.asarray(im.convert('L'),dtype=float)/255
 low=np.asarray(im.convert('L').filter(ImageFilter.GaussianBlur(4)),dtype=float)/255
 height=(gray-low)*.65+gray*.20
 dx=(np.roll(height,-1,axis=1)-np.roll(height,1,axis=1))*1.7
 dy=(np.roll(height,-1,axis=0)-np.roll(height,1,axis=0))*1.7
 n=np.stack((-dx,dy,np.ones_like(dx)),axis=-1);n/=np.linalg.norm(n,axis=2)[...,None]
 Image.fromarray(np.uint8(np.clip(n*.5+.5,0,1)*255)).save(dst/(name+'-normal.webp'),lossless=True,method=6)
 rough={'berber':.96,'ceiling':.95,'maple':.55,'velvet':.94,'green-seat':.63,'linen':.93}[name]
 a=np.uint8(np.clip(rough+(gray-.5)*.10,0,1)*255)
 Image.fromarray(a).resize((256,256),Image.Resampling.LANCZOS).save(dst/(name+'-roughness.webp'),lossless=True,method=6)
(src/'provenance.json').write_text(json.dumps({'method':'Six independent native image generations; material normals and roughness estimated from multiscale luminance. Original art preserved. 512px albedo/normals, 256px roughness. Existing generated V93 joinery reused.','runtimeBytes':sum(p.stat().st_size for p in dst.iterdir())},indent=2))
print(sum(p.stat().st_size for p in dst.iterdir()),'runtime bytes')
