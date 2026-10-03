from PIL import Image
from pathlib import Path
import json, hashlib, math
import numpy as np

root=Path(__file__).resolve().parent
outsize=(128,128)
characters={
  'receptionist': {
    'eyeRects':[(23,42,57,61),(71,42,105,61)],
    'skinCrop':(200,700,400,900),
    'identity':'Elderly woman about 70, light olive skin, age lines and nasolabial folds, small nose, gray permed hair, no baked glasses.',
  },
  'poolman': {
    'eyeRects':[(24,44,57,61),(72,44,104,61)],
    'skinCrop':(240,600,400,750),
    'identity':'Adult man 30–40, warm dark brown skin, broad nose, black crop and full short black beard.',
  },
}
manifest={
 'version':'v74',
 'assetType':'generated photographic diffuse texture set',
 'generator':'builtin image_gen.imagegen',
 'promptFormatSource':'https://raw.githubusercontent.com/UzenUPozitiv4ik/gpt-image-2-skill/main/gpt_image_2_prompt_skill.md',
 'promptFormatDownloadedAndReadBeforeEveryGeneration':True,
 'pixelCoordinates':'top-left origin, right and bottom exclusive',
 'runtimeSize':[128,128],
 'processing':'Pillow full-frame BOX downsample, generated eyelid patches composited with 1px internal edge feather. All non-eye pixels remain original face bytes. Optional skin maps are mechanical cheek crops.',
 'characters':{},
}
for name,cfg in characters.items():
    dest=root/name
    dest.mkdir(exist_ok=True)
    files={}
    sources={}
    face=Image.open(root/'originals'/f'{name}-face.png').convert('RGB')
    edited=Image.open(root/'originals'/f'{name}-blink-edit.png').convert('RGB')
    body=Image.open(root/'originals'/f'{name}-body.png').convert('RGB')
    originalSize=face.size
    face128=face.resize(outsize, Image.Resampling.BOX)
    edit128=edited.resize(outsize, Image.Resampling.BOX)
    body128=body.resize(outsize, Image.Resampling.BOX)
    a=np.array(face128)
    b=np.array(edit128)
    closed=a.copy()
    mask=np.zeros((128,128),np.uint8)
    for x0,y0,x1,y1 in cfg['eyeRects']:
        for y in range(y0,y1):
            for x in range(x0,x1):
                edge=min(x-x0,y-y0,x1-1-x,y1-1-y)
                blend=min(1.0,(edge+1)/2.0)
                closed[y,x]=np.round(a[y,x]*(1-blend)+b[y,x]*blend).astype(np.uint8)
                mask[y,x]=255
    Image.fromarray(closed).save(dest/'face-blink.png')
    face128.save(dest/'face.png')
    body128.save(dest/'body.png')
    face.crop(cfg['skinCrop']).resize(outsize,Image.Resampling.BOX).save(dest/'skin.png')
    Image.fromarray(mask).save(dest/'blink-region-mask.png')
    outside_changed=int(np.count_nonzero(np.any(a!=closed,axis=2)&(mask==0)))
    changed=int(np.count_nonzero(np.any(a!=closed,axis=2)))
    assert outside_changed==0
    assert changed>50
    for kind in ['face','face-blink','body','skin']:
        p=dest/f'{kind}.png'
        im=Image.open(p)
        assert im.size==(128,128)
        files[kind]={'file':str(p.relative_to(root)), 'size':[128,128], 'mode':im.mode,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
    for kind in ['face','blink-edit','body']:
        p=root/'originals'/f'{name}-{kind}.png'
        sources[kind]={'file':str(p.relative_to(root)), 'size':list(Image.open(p).size),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
    manifest['characters'][name]={
      'identity':cfg['identity'],
      'source':sources,
      'textures':files,
      'faceCrop':[0,0,*originalSize],
      'bodyCrop':[0,0,*body.size],
      'skinCropOriginalPixels':list(cfg['skinCrop']),
      'eyeRectsRuntimePixels':cfg['eyeRects'],
      'eyeRectsNormalized':[[round(v/128,6) for v in r] for r in cfg['eyeRects']],
      'atlasRects':{k:[0,0,128,128] for k in ['face','face-blink','body','skin']},
      'blinkMode':'Open/closed generated face textures; eyelid-region composite preserves other pixels.',
      'blinkOutsideEyeChangedPixels':outside_changed,
      'blinkChangedPixels':changed,
      'rigType':'not part of texture task',
      'animations':[],
      'seed':None,
      'bounds':None,
      'validation':'128x128 RGB verified; non-eye open/closed equality verified. Rendered 3D integration not in this task.'
    }
    preview=Image.new('RGB',(128*4,128))
    for i,kind in enumerate(['face','face-blink','body','skin']):
        preview.paste(Image.open(dest/f'{kind}.png'),(128*i,0))
    preview.resize((1024,256),Image.Resampling.NEAREST).save(root/f'{name}-128-preview.png')
(root/'crop-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps({k:{'runtime':v['textures'],'blinkOutsideEyeChangedPixels':v['blinkOutsideEyeChangedPixels'],'blinkChangedPixels':v['blinkChangedPixels']} for k,v in manifest['characters'].items()},indent=2))
