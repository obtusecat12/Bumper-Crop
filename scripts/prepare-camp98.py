from pathlib import Path
from PIL import Image,ImageFilter,ImageDraw
import json,shutil,hashlib
root=Path(__file__).resolve().parents[1];src=root.parent/'camp98-art';dest=root/'dist/textures/camp-v98';archive=root/'art-source/camp-v98';dest.mkdir(exist_ok=True,parents=True)
manifest={'source':'independently generated built-in image_gen originals; same-image closed-eyelid edits','filter':'NearestFilter, no mipmaps','actors':{},'props':{}}
aMeta={v['id']:v for v in json.loads((src/'actors-a/manifest.json').read_text())['actors']}
for group in ['actors-a','actors-b']:
 for folder in (src/group).iterdir():
  if not folder.is_dir() or not (folder/'shirt.png').exists():continue
  name=folder.name;out=dest/name;out.mkdir(exist_ok=True);target=archive/group/name;target.mkdir(exist_ok=True,parents=True)
  for f in folder.iterdir():
   if f.is_file() and f.suffix in ['.png','.json','.txt'] and not 'preview' in f.name:shutil.copy2(f,target/f.name)
  face=Image.open(folder/'face.png').convert('RGB');closed=Image.open(folder/'face-closed.png').convert('RGB').resize(face.size)
  if group=='actors-a':
   exact=face.copy()
   for rect in aMeta[name]['eyes']:
    mask=Image.new('L',face.size);ImageDraw.Draw(mask).rectangle(rect,fill=255);mask=mask.filter(ImageFilter.GaussianBlur(2));exact.paste(closed,(0,0),mask)
   closed=exact
  w,h=face.size
  # Preserve full native face coordinates for landmark-based geometric UV mapping.
  face.resize((128,128),Image.Resampling.LANCZOS).save(out/'face.webp',lossless=True,method=6)
  closed.resize((128,128),Image.Resampling.LANCZOS).save(out/'face-closed.webp',lossless=True,method=6)
  face.crop((int(w*.263),int(h*.560),int(w*.325),int(h*.635))).resize((64,64),Image.Resampling.LANCZOS).save(out/'skin.webp',lossless=True,method=6)
  face.crop((int(w*.39),int(h*.066),int(w*.60),int(h*.12))).resize((64,64),Image.Resampling.LANCZOS).save(out/'hair.webp',lossless=True,method=6)
  shirt=Image.open(folder/'shirt.png').convert('RGB');sw,sh=shirt.size
  crop=aMeta[name]['shirt_crop'] if group=='actors-a' else (int(sw*.25),int(sh*.06),int(sw*.76),int(sh*.94))
  shirt.crop(crop).resize((256,256),Image.Resampling.LANCZOS).save(out/'shirt.webp',quality=88,method=6)
  patch=aMeta[name]['fabric_patch'] if group=='actors-a' else (int(sw*.18),int(sh*.67),int(sw*.40),int(sh*.87))
  shirt.crop(patch).resize((128,128),Image.Resampling.LANCZOS).save(out/'fabric.webp',quality=88,method=6)
  manifest['actors'][name]={'face':[128,128],'shirt':[256,256],'shirt_crop':crop,'face_crop':'full source / geometry-aligned UV','closed':'eye regions composited into original identity'}
 for f in (src/group).glob('*.json'):shutil.copy2(f,archive/(group+'-'+f.name))
props={'radio-front':'radio-front','cigarettes-turquoise':'cigarettes-turquoise','cigarettes-red':'cigarettes-red','can-vanilla':'can-vanilla','can-budlight':'can-budlight-v2','can-modelo':'can-modelo','cooler-panel':'cooler-red','weathered-boards':'timber-damp','rusty-tin':'tin-rust','dirty-concrete':'concrete-latrine','peas':'peas-dense'}
for name,source in props.items():
 f=src/'props'/(source+'.png')
 if not f.exists():print('PENDING',f);continue
 (archive/'props').mkdir(exist_ok=True);shutil.copy2(f,archive/'props'/f.name)
 im=Image.open(f).convert('RGB');w,h=im.size;target=(512,max(128,round(h/w*512))) if name in ['radio-front','can-vanilla','can-budlight','can-modelo'] else (256,384) if 'cigarettes' in name else (512,512)
 im.resize(target,Image.Resampling.LANCZOS).save(dest/(name+'.webp'),quality=87,method=6)
 manifest['props'][name]={'source':str(f),'native':im.size,'runtime':target,'sha256':hashlib.sha256(f.read_bytes()).hexdigest()}
if (src/'props/prompts').exists():shutil.copytree(src/'props/prompts',archive/'props/prompts',dirs_exist_ok=True)
(archive/'manifest.json').write_text(json.dumps(manifest,indent=2));print('Actors',len(manifest['actors']),'props',len(manifest['props']))
