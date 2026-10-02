"""Pack image-generated atlases and transparent decals; never draw substitute art."""
from pathlib import Path
from PIL import Image
import json, hashlib

ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'art-source/backcourt-v71'
OUT=ROOT/'dist/textures/backcourt-v71'
OUT.mkdir(parents=True,exist_ok=True)
manifest=[]
def pack(source,name,size,linear=False):
    p=SRC/source
    im=Image.open(p).convert('RGBA' if Image.open(p).mode=='RGBA' else 'RGB')
    im=im.resize(size,Image.Resampling.LANCZOS)
    dest=OUT/(name+'.webp')
    im.save(dest,'WEBP',lossless=linear,quality=93,method=6)
    manifest.append({'texture':dest.relative_to(ROOT).as_posix(),'source':p.relative_to(ROOT).as_posix(),'size':list(size),'space':'linear-data' if linear else 'sRGB','sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'process':'resize and encode only; no invented texture content'})
channels=['basecolor','normal','roughness','metallic','ao','height']
for runtime,folder,stem in [('stone','corner/stone-paving','stone-paving'),('pda-black','pda','charcoal'),('steel','relic','steel'),('cream','relic','abs'),('rubber','relic','rubber')]:
    for channel in channels:
        exact={'basecolor':'BaseColor','normal':'Normal','roughness':'Roughness','metallic':'Metallic','ao':'AO','height':'Height'}[channel] if runtime=='stone' else channel
        pack(f'{folder}/{stem}-{exact}.png',runtime+'-'+channel,(512,512),channel!='basecolor')
for source,name,size in [
 ('pda/pda-ui.png','pda-ui',(768,1024)),('pda/crt-ui-final.png','crt-ui',(1024,768)),
 ('pda/keyboard-legend-atlas.png','keyboard',(768,1024)),
 ('corner/wall-foot-grime/wall-foot-grime-original.png','wall-foot',(1024,512)),
 ('corner/wall-corner-dust/wall-corner-dust-original.png','wall-dust',(512,1024)),
 ('corner/ground-water-stain/generated-rgba.png','water-stain',(512,512))]:pack(source,name,size)
(SRC/'runtime-manifest.json').write_text(json.dumps({'method':'Built-in imagegen sources, exact six-channel atlas crops, Pillow asset packing only','maps':manifest},indent=2)+'\n')
print(json.dumps({'textures':len(manifest),'bytes':sum(p.stat().st_size for p in OUT.glob('*.webp'))}))
