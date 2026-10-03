from pathlib import Path
from PIL import Image
import numpy as np
import hashlib, json

BASE = Path(__file__).resolve().parent
SOURCE_NEWSPAPER = Path('/workspace/scratch/85111d38430a/level10/dist/textures/changing-v72/newspaper.webp')

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

label = Image.open(BASE / 'old-pier-label-original.png').convert('RGB')
label.resize((128,128), Image.Resampling.BOX).save(BASE / 'old-pier-label-128.png')

# Downsample the generated alpha in premultiplied space, preserving faint streaks.
stream = Image.open(BASE / 'ochre-water-streaks-original.png').convert('RGBA')
small = stream.convert('RGBa').resize((128,128), Image.Resampling.BOX).convert('RGBA')
rgba = np.asarray(small).astype(np.float64) / 255.0
alpha = rgba[:,:,3:4]
premul = np.concatenate([rgba[:,:,:3] * alpha, alpha], axis=2)

# Join only the 8-row wrap margins; all visible motifs remain generated pixels.
original = premul.copy()
for i in range(8):
    amount = (1.0 - i/8.0) ** 2
    mid = (original[i] + original[-1-i]) * 0.5
    premul[i] = original[i] * (1-amount) + mid * amount
    premul[-1-i] = original[-1-i] * (1-amount) + mid * amount

alpha = premul[:,:,3:4]
rgb = np.divide(premul[:,:,:3], alpha, out=np.zeros_like(premul[:,:,:3]), where=alpha>0)
result = np.round(np.clip(np.concatenate([rgb, alpha],axis=2),0,1)*255).astype(np.uint8)
# The original is already sparse; discard only invisible <1/255 edge residue.
result[result[:,:,3]==0,:3] = 0
Image.fromarray(result,'RGBA').save(BASE / 'ochre-water-streaks-128.png')

newspaper = Image.open(SOURCE_NEWSPAPER).convert('RGB')
side = min(newspaper.size)
newspaper_crop = [0,0,side,side]
newspaper.crop(tuple(newspaper_crop)).resize((128,128),Image.Resampling.BOX).save(BASE / 'reader-newspaper-128.png')

assets=[]
for file in ['old-pier-label-128.png','ochre-water-streaks-128.png','reader-newspaper-128.png']:
    path=BASE/file
    im=Image.open(path)
    item={'file':file,'size':list(im.size),'mode':im.mode,'sha256':sha(path)}
    if im.mode=='RGBA':
        pixels=np.asarray(im)
        item['alphaRange']=[int(pixels[:,:,3].min()),int(pixels[:,:,3].max())]
        item['meanAlpha']=round(float(pixels[:,:,3].mean()),4)
        item['fullyTransparentFraction']=round(float((pixels[:,:,3]==0).mean()),4)
        item['verticalEdgePixelMismatch']=int(np.abs(pixels[0].astype(int)-pixels[-1].astype(int)).max())
    assets.append(item)

manifest={
    'id':'npc-v74-props', 'version':74,
    'seed':None, 'seedNote':'Built-in generation does not expose a seed.',
    'generationTool':'image_gen.imagegen',
    'source':{
        'old-pier-label':{'status':'generated','original':'old-pier-label-original.png','originalSha256':sha(BASE/'old-pier-label-original.png'),'originalSize':list(label.size),'prompt':'label-prompt.txt','guide':'prompt-guide-before-label.md','crop':[0,0,label.width,label.height]},
        'ochre-water-streaks':{'status':'generated','original':'ochre-water-streaks-original.png','originalSha256':sha(BASE/'ochre-water-streaks-original.png'),'originalSize':list(stream.size),'prompt':'stream-prompt.txt','guide':'prompt-guide-before-stream.md','crop':[0,0,stream.width,stream.height],'postprocess':'Premultiplied BOX resize; symmetric blend of 8 edge rows for exact Y repeat. No new marks drawn.'},
        'reader-newspaper':{'status':'reused-existing-generated-art','path':str(SOURCE_NEWSPAPER),'sha256':sha(SOURCE_NEWSPAPER),'sourceSize':list(newspaper.size),'crop':newspaper_crop,'originalGenerationArt':'/workspace/scratch/85111d38430a/level10/art-source/bath-v72/materials/newspaper.png','originalPrompt':'/workspace/scratch/85111d38430a/level10/art-source/bath-v72/materials/newspaper-prompt.txt'}
    },
    'textures':assets,
    'atlasRects':None,'rigType':None,'blinkMode':None,'animations':[],'bounds':None,
    'runtimeNotes':{'label':'sRGB color, nearest magnification, opaque','stream':'sRGB color, transparent alpha, RepeatWrapping Y, offset Y animation, depthWrite false; source mean alpha is already low; tune material opacity to scene','newspaper':'sRGB color, nearest magnification, opaque'},
    'validation':{'allRuntimeTexturesExactly128Square':all(x['size']==[128,128] for x in assets),'streamHasRealAlpha':True,'streamYSeamExact':assets[1]['verticalEdgePixelMismatch']==0,'runtimeInScene':'Not tested by asset-only worker'},
    'guideProvenance':{'requestedURL':'https://raw.githubusercontent.com/UzenUPozitiv4ik/gpt-image-2-skill/main/gpt_image_2_prompt_skill.md','rawFetchResult':'Blocked: web DisabledError; shell browser-proxy unavailable. These failures occurred before generation; no new raw download claimed.','liveReadableFallback':'https://github.com/UzenUPozitiv4ik/gpt-image-2-skill/blob/main/gpt_image_2_prompt_skill.md','fallbackRead':'Live rendered guide read separately before each image call. Fixed prefix, relevant fields and aspect ratio applied.','savedSnapshotSource':'/workspace/scratch/85111d38430a/level10/art-source/bath-v72/materials/gpt_image_2_prompt_skill-call01.md','savedSnapshotRead':'Cached raw guide copied and read before each image call; its relevant content matches the live rendered document.'}
}
(BASE/'asset-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')

# Review sheet only; runtime assets above are exact 128x128 files.
canvas=Image.new('RGB',(1152,384),(56,54,48))
for i,name in enumerate(['old-pier-label-128.png','reader-newspaper-128.png','ochre-water-streaks-128.png']):
    tile=Image.open(BASE/name).convert('RGBA').resize((384,384),Image.Resampling.NEAREST)
    background=Image.new('RGBA',(384,384),(56,54,48,255))
    canvas.paste(Image.alpha_composite(background,tile).convert('RGB'),(i*384,0))
canvas.save(BASE/'props-review.png')
print(json.dumps(manifest['textures'],indent=2))
