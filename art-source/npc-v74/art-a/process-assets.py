from pathlib import Path
from PIL import Image, ImageDraw
import hashlib, json

ROOT = Path(__file__).resolve().parent
SIZE = (128, 128)
EYE_RECTS = [(27, 47, 57, 62), (72, 47, 103, 62)]
for role in ['homeless', 'wallman']:
    for asset in ['face', 'body']:
        im = Image.open(ROOT / role / f'{asset}-original.png').convert('RGB')
        im.resize(SIZE, Image.Resampling.BOX).save(ROOT / role / f'{asset}.png')

base = Image.open(ROOT / 'wallman/face.png').convert('RGB')
blink_generated = Image.open(ROOT / 'wallman/face-blink-original.png').convert('RGB').resize(SIZE, Image.Resampling.BOX)
mask = Image.new('L', SIZE, 0)
for x0, y0, x1, y1 in EYE_RECTS:
    for y in range(y0, y1):
        for x in range(x0, x1):
            distance = min(x-x0, x1-1-x, y-y0, y1-1-y)
            mask.putpixel((x,y), min(255, int(255 * (distance+1) / 3)))
blink = Image.composite(blink_generated, base, mask)
blink.save(ROOT / 'wallman/face-blink.png')
mask.save(ROOT / 'wallman/eye-composite-mask.png')
changed = 0
outside_changed = 0
for y in range(128):
    for x in range(128):
        if base.getpixel((x,y)) != blink.getpixel((x,y)):
            changed += 1
            if not any(x0 <= x < x1 and y0 <= y < y1 for x0,y0,x1,y1 in EYE_RECTS):
                outside_changed += 1
assert outside_changed == 0

files = [('homeless', 'face'), ('wallman', 'face'), ('wallman', 'face-blink'), ('homeless', 'body'), ('wallman', 'body')]
sheet = Image.new('RGB', (5*384, 420), '#222222')
d = ImageDraw.Draw(sheet)
for i,(role, asset) in enumerate(files):
    im = Image.open(ROOT / role / f'{asset}.png')
    sheet.paste(im.resize((384,384), Image.Resampling.NEAREST), (i*384,30))
    d.text((i*384+10, 8), f'{role} / {asset} / 128 x 128', fill='white')
sheet.save(ROOT / 'contact-sheet-3x.png')

manifest = {
    'version': 'npc-v74-art-a',
    'scope': 'generated texture assets only; no Site repository modifications',
    'tool': 'builtin image_gen__imagegen',
    'reference': '/workspace/scratch/85111d38430a/attachments/250e2ccc-5cd9-4c54-b010-0f85762aae25/image.png',
    'promptGuide': {'url': 'https://raw.githubusercontent.com/UzenUPozitiv4ik/gpt-image-2-skill/main/gpt_image_2_prompt_skill.md', 'beforeEveryImageCall': True, 'savedCopies': sorted(str(p.relative_to(ROOT)) for p in (ROOT/'guides').glob('*.md'))},
    'uv': {'coordinateConvention': 'image pixel coordinates from top left, rectangles right/bottom exclusive', 'faceAtlasRect': [0,0,128,128], 'bodyAtlasRect': [0,0,128,128], 'faceMapping': 'central front facial surface only; do not extend across side/back cranium; use separate side/back material', 'webglUV': 'for conventional flipY=true Three.TextureLoader, pixel (x,y) -> (x/128,1-y/128)', 'wrap': 'clamp to edge', 'magFilter': 'NearestFilter', 'colorSpace': 'SRGBColorSpace'},
    'processing': {'sourceSize': [1254,1254], 'sourceCrop': [0,0,1254,1254], 'outputSize': [128,128], 'resampler': 'Pillow BOX area mean', 'paletteReduction': False, 'sharpening': False},
    'blinkValidation': {'role':'wallman','eyeRects':EYE_RECTS,'composition':'generated closed-eyelid patches only, edge feather 3 pixels inside the two bounded rectangles','changedPixelCount':changed,'changedPixelsOutsideEyeRects':outside_changed},
    'roles': [],
    'validation': {'finalTexturesExact128':True, 'photographicFaces':True, 'bodiesContainNoFaces':True, 'visualQA':'nearest-neighbor 3x contact sheet inspected', 'inSceneTest':'not within texture-asset scope'},
}
for role in ['homeless', 'wallman']:
    entry = {'id':role,'seed':None,'source':'generated with builtin image tool; prompt saved beside each mother image','rigType':'not supplied; texture-only task','blinkMode':'permanently-closed-static' if role=='homeless' else 'independent-open-closed-eye-texture','animations':['static closed eyes'] if role=='homeless' else ['eye patch blink'], 'bounds':None, 'atlasRects':{'face':[0,0,128,128],'body':[0,0,128,128]}, 'textures':{}}
    names = ['face','body'] if role=='homeless' else ['face','face-blink','body']
    for name in names:
        path=ROOT/role/f'{name}.png'
        im=Image.open(path)
        assert im.size == SIZE
        entry['textures'][name]={'file':str(path.relative_to(ROOT)),'size':list(im.size),'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'original':f'{role}/{name}-original.png','prompt':f'{role}/{name}-prompt.txt','sourceCrop':[0,0,1254,1254],'status':'edited original + bounded eye compositing' if name=='face-blink' else 'generated and area-downsampled'}
    manifest['roles'].append(entry)
(ROOT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps({'files':[str(ROOT/r/f'{a}.png') for r,a in files], 'blinkChangedPixelCount':changed, 'blinkOutsideEyesChanged':outside_changed},indent=2))
