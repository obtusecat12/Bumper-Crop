"""Mechanical resizing and UV registration only; all artwork is image-generated."""
from pathlib import Path
import hashlib
import json
import shutil
from PIL import Image

ROOT = Path(__file__).resolve().parent
GENERATED = ROOT.parent / 'generated_images'
ORIGINALS = ROOT / 'originals'
RUNTIME = ROOT / 'runtime256'
PREVIEW = ROOT / 'preview256'
for folder in (ORIGINALS, RUNTIME, PREVIEW):
    folder.mkdir(exist_ok=True)

ASSETS = {
    'faceA': ('exec-9026fef8-e988-4d2d-8b61-597e3e894436.png', 'npc-face-a-v68.png'),
    'faceB': ('exec-8fa478ca-0912-46b7-8bc9-1037fb4a0a2e.png', 'npc-face-b-v68.png'),
    'body': ('exec-fb1014bb-0bab-456f-9e59-7b641bc6549f.png', 'npc-body-v68.png'),
    'towel': ('exec-1b969b69-eb98-4314-bce6-622e19101afd.png', 'towel.png'),
}
LANDMARKS = {
    'labels': ['top','hairline','brows','eyes','nose_tip','mouth','chin','bottom'],
    'target_v_from_top': [0, .16, .33, .39, .55, .70, .88, 1],
    'faceA_source_v_from_top': [0, .195, .367, .440, .570, .675, .855, 1],
    'faceB_source_v_from_top': [0, .164, .352, .415, .585, .700, .880, 1],
    'faceA_eye_u': [.385,.615],
    'faceB_eye_u': [.380,.620],
    'measurement_note': 'Source feature positions visually measured; target registration exact at these control rows.',
}

records = {}
for key, (source_name, out_name) in ASSETS.items():
    source = GENERATED / source_name
    original = ORIGINALS / out_name
    if source.exists():
        shutil.copy2(source, original)
    else:
        source = original  # Restore runtime maps from committed generated originals.
    im = Image.open(original).convert('RGB')
    im.resize((256,256), Image.Resampling.BOX).save(PREVIEW/out_name)
    if key.startswith('face'):
        # Use a piecewise mesh to resample image rows to agreed landmark positions.
        width,height=im.size
        target=LANDMARKS['target_v_from_top']
        input_v=LANDMARKS[key+'_source_v_from_top']
        mesh=[]
        for (t0,t1,s0,s1) in zip(target[:-1],target[1:],input_v[:-1],input_v[1:]):
            y0,y1=round(t0*height),round(t1*height)
            mesh.append(((0,y0,width,y1),(0,s0*height,0,s1*height,width,s1*height,width,s0*height)))
        registered=im.transform(im.size,Image.Transform.MESH,mesh,Image.Resampling.BICUBIC)
        runtime=registered.resize((256,256),Image.Resampling.BOX)
        method='Built-in image_gen; piecewise vertical UV registration using recorded source/target rows, then BOX downsample. No procedural painting.'
    elif key == 'body':
        # The generated atlas has a y=702 division rather than y=784. Pack its
        # existing rectangles into the exact target layout without painting.
        width,height=im.size
        split=702
        runtime=Image.new('RGB',(256,256))
        for box,target_box in [
            ((0,0,width//2,split),(0,0,128,160)),
            ((width//2,0,width,split),(128,0,256,160)),
            ((0,split,width//4,height),(0,160,64,256)),
            ((width//4,split,width//2,height),(64,160,128,256)),
            ((width//2,split,width,height),(128,160,256,256)),
        ]:
            x0,y0,x1,y1=target_box
            runtime.paste(im.crop(box).resize((x1-x0,y1-y0),Image.Resampling.BOX),(x0,y0))
        method='Built-in image_gen; rectangular atlas repack from generated y=702 split into exact 256px layout. BOX resize only, no procedural painting.'
    else:
        runtime=im.resize((256,256),Image.Resampling.BOX)
        method='Built-in image_gen; BOX downsample only. Required new ivory towel replaces observed high-frequency turquoise cloth defect. No procedural painting.'
    runtime.save(RUNTIME/out_name)
    records[key]={'source':str(source),'original':str(original),'runtime256':str(RUNTIME/out_name),'unregistered256_preview':str(PREVIEW/out_name),'original_dimensions':im.size,'source_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'runtime_sha256':hashlib.sha256((RUNTIME/out_name).read_bytes()).hexdigest(),'method':method}

for source,aliases in {
    'npc-face-a-v68.png':['face-a.png'],
    'npc-face-b-v68.png':['face-b.png'],
    'npc-body-v68.png':['body-a.png','body-b.png'],
}.items():
    for alias in aliases:
        shutil.copy2(RUNTIME/source,RUNTIME/alias)

(ROOT/'uv-landmarks.json').write_text(json.dumps(LANDMARKS,indent=2)+'\n')
provenance={'generator':'built-in image_gen.imagegen','references':[str(ROOT/'references'/'01-IMG_4272.png'),str(ROOT/'references'/'02-IMG_4274.png')],'prompts':'prompts.json','successful_images':4,'generation_notes':'Exactly one successful generation per asset, no variants. Initial parallel body request returned no artifact; single sequential recovery generated body. Fourth distinct asset towel was expressly required after model inspection revealed inherited cloth defect; generated once without reference-image inputs.','assets':records,'uv_landmarks':'uv-landmarks.json','atlas_layout':{'front_torso':[0,0,128,160],'back_torso':[128,0,256,160],'arm':[0,160,64,256],'leg':[64,160,128,256],'hand_foot_neck':[128,160,256,256]}}
(ROOT/'provenance.json').write_text(json.dumps(provenance,indent=2)+'\n')
print(json.dumps({'runtime':str(RUNTIME),'assets':list(records),'uv_landmarks':LANDMARKS},indent=2))
