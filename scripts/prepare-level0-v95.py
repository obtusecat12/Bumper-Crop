from pathlib import Path
from PIL import Image,ImageFilter
import numpy as np,shutil,json
root=Path(__file__).resolve().parents[1];src=root.parent/'level0-v95-art';art=root/'art-source/level0-v95';out=root/'dist/assets/level0-v95'
art.mkdir(parents=True,exist_ok=True);out.mkdir(parents=True,exist_ok=True)
shutil.copytree(src,art,dirs_exist_ok=True)
items={'insulation':'01-insulation-batt','duct':'02-galvanized-hvac','crt-vents':'03-crt-beige-vents','screen':'04-crt-screen-off','stripe':'05-sofa-stripe-fabric','burl':'06-burled-walnut','mirror':'07-aged-mirror','cooler':'08-water-dispenser-front'}
for name,stem in items.items():
 im=Image.open(src/(stem+'.png')).convert('RGB');im.thumbnail((512,768) if name=='mirror' else (512,512),Image.Resampling.LANCZOS)
 im.save(out/(name+'.webp'),quality=86,method=6)
 gray=np.asarray(im.convert('L'),dtype=float)/255;lo=np.asarray(im.convert('L').filter(ImageFilter.GaussianBlur(2)),dtype=float)/255
 height=(gray-lo)*(.9 if name=='insulation' else .45)+gray*.08
 dx=np.roll(height,-1,1)-np.roll(height,1,1);dy=np.roll(height,-1,0)-np.roll(height,1,0)
 n=np.stack((-dx*2.2,dy*2.2,np.ones_like(dx)),axis=-1);n/=np.linalg.norm(n,axis=2)[...,None]
 Image.fromarray(np.uint8(np.clip(n*.5+.5,0,1)*255)).save(out/(name+'-normal.webp'),lossless=True,method=4)
 rough={'insulation':.94,'duct':.71,'crt-vents':.64,'screen':.22,'stripe':.95,'burl':.43,'mirror':.15,'cooler':.69}[name]
 Image.fromarray(np.uint8(np.clip(rough+(gray-lo)*.12,0,1)*255)).resize((256,384) if name=='mirror' else (256,256),Image.Resampling.LANCZOS).save(out/(name+'-roughness.webp'),lossless=True,method=6)
# Plain plastic is sampled from the vent sheet's unperforated margin; no vent print on the bezel.
im=Image.open(src/'03-crt-beige-vents.png').convert('RGB');im.crop((25,20,1225,130)).resize((256,128),Image.Resampling.LANCZOS).save(out/'plastic.webp',quality=86,method=6)
im=Image.open(src/'08-water-dispenser-front.png').convert('RGB');im.crop((1070,420,1230,790)).resize((128,256),Image.Resampling.LANCZOS).save(out/'cooler-white.webp',quality=85,method=6)
(art/'derivation.json').write_text(json.dumps({'runtimeBytes':sum(p.stat().st_size for p in out.iterdir()),'method':'Eight independent native generations. 512px diffuse and luminance-derived approximate normal maps, lossless normals and 256px single-channel roughness. Mirror 512x768. CRT unperforated margin crop is separate plastic surface. Originals and exact prompts retained. PBR maps are estimates, not measured scans.'},indent=2))
assert all(p.stat().st_size>0 for p in out.glob('*.webp')), 'Texture encoder produced empty file'
print('Runtime new texture bytes:',sum(p.stat().st_size for p in out.iterdir()))
