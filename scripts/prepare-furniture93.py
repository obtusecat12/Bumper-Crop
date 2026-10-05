"""Generated color originals -> compact photographic maps and estimated PBR derivatives."""
from pathlib import Path
from PIL import Image,ImageFilter
import numpy as np,shutil,json,hashlib
root=Path(__file__).resolve().parents[1];src=root.parent/'level0-art-new';art=root/'art-source/level0-furniture93';out=root/'dist/assets/level0-furniture93'
art.mkdir(parents=True,exist_ok=True);out.mkdir(parents=True,exist_ok=True)
for folder in ['wood','upholstery','details']:shutil.copytree(src/folder,art/folder,dirs_exist_ok=True)
items={'mahogany':src/'wood/mahogany.png','walnut':src/'wood/walnut.png','ebony':src/'wood/ebonized.png','oxblood':src/'upholstery/oxblood-leather.original.png','tobacco':src/'upholstery/tobacco-leather.original.png','damask':src/'upholstery/olive-gold-damask.original.png','carved':src/'details/walnut-carved-molding-native.png','brass':src/'details/aged-satin-brass-native.png'}
records=[]
for name,file in items.items():
 im=Image.open(file).convert('RGB');im.thumbnail((1024,1024) if name=='carved' else (512,512),Image.Resampling.LANCZOS);im.save(out/(name+'.webp'),quality=93,method=6)
 small=im.copy();small.thumbnail((512,512),Image.Resampling.LANCZOS)
 gray=np.asarray(small.convert('L'),dtype=float)/255.;blur=np.asarray(small.convert('L').filter(ImageFilter.GaussianBlur(2)),dtype=float)/255.
 height=(gray-blur)*.65+(blur-.5)*(.65 if name=='carved' else .12)
 gy,gx=np.gradient(height);strength=5 if name=='carved' else 2.5
 n=np.dstack((-gx*strength,-gy*strength,np.ones_like(gray)));n/=np.linalg.norm(n,axis=2,keepdims=True)
 Image.fromarray(np.uint8(np.clip(n*.5+.5,0,1)*255)).save(out/(name+'-normal.webp'),lossless=True,method=6)
 base={'mahogany':.43,'walnut':.49,'ebony':.37,'oxblood':.47,'tobacco':.55,'damask':.9,'brass':.4,'carved':.55}[name]
 rough=np.clip(base+(gray-blur)*.35+(blur-.5)*.17,.20,.97)
 Image.fromarray(np.uint8(rough*255)).save(out/(name+'-roughness.webp'),lossless=True,method=6)
 records.append({'name':name,'generatedOriginal':str(file.relative_to(src)),'basePixels':im.size,'dataPixels':small.size,'derivedMaps':'Estimated luminance-frequency normal/roughness, not measured scans. Real tufting, bevels, seams and hardware are mesh geometry.'})
(art/'derivation.json').write_text(json.dumps(records,indent=2))
print('New runtime maps',len(list(out.glob('*'))),'bytes',sum(f.stat().st_size for f in out.glob('*')))
