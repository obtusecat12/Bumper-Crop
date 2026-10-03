from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageChops
import hashlib
import json

ROOT = Path(__file__).resolve().parent
SOURCE_GUIDE = 'https://raw.githubusercontent.com/UzenUPozitiv4ik/gpt-image-2-skill/main/gpt_image_2_prompt_skill.md'
PROVENANCE = {
    'reader': {
        'seed': None,
        'definition': 'Adult man 35–40; pale elongated oval face, clean-shaven, dark side-part hair; charcoal suit, white shirt, black tie.',
        'source_files': {
            'face': 'exec-4827c229-b93c-4dd5-b0a0-ab540afa2d3d.png',
            'blink': 'exec-c128d225-00c0-41a9-ba94-34c678f87a80.png',
            'body': 'exec-dc25e23f-423f-402b-9fb6-8aca338baefe.png',
        },
        'eye_rects': [[23, 42, 55, 57], [73, 42, 105, 57]],
    },
    'plaid': {
        'seed': None,
        'definition': 'Adult man around 55; stocky round ruddy/tanned face, broad nose, chevron moustache, receding brown-gray hair; tan/rust/blue plaid shirt.',
        'source_files': {
            'face': 'exec-2ce821d6-4835-4146-8684-53ab315b46a6.png',
            'blink': 'exec-1581654e-1e1b-46c3-8633-d7cbfdf9665e.png',
            'body': 'exec-051e7693-7dbd-48f6-9ad6-711c5378744d.png',
        },
        'eye_rects': [[23, 43, 57, 57], [72, 43, 104, 57]],
    },
}

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

manifest = {
    'version': 'npc-v74-art-b',
    'generator': 'Built-in image_gen.imagegen; independent face generations and reference-image eyelid edits',
    'promptGuide': SOURCE_GUIDE,
    'promptGuideReadBeforeEachImagegen': True,
    'styleReference': '/workspace/scratch/85111d38430a/attachments/250e2ccc-5cd9-4c54-b010-0f85762aae25/image.png',
    'colorSpace': 'sRGB',
    'runtimeDimensions': [128, 128],
    'resize': 'Pillow Resampling.BOX area downsample, no sharpening or palette quantization',
    'coordinates': 'Image pixel origin is top-left. Rectangles are [left, top, right, bottom], right/bottom exclusive.',
    'characters': [],
}
for char, spec in PROVENANCE.items():
    folder = ROOT / char
    originals = folder / 'originals'
    mother = Image.open(originals / 'face-mother.png').convert('RGB')
    edit = Image.open(originals / 'face-blink-edit.png').convert('RGB')
    body = Image.open(originals / 'body-mother.png').convert('RGB')
    assert mother.size == edit.size
    face128 = mother.resize((128, 128), Image.Resampling.BOX)
    edit128 = edit.resize((128, 128), Image.Resampling.BOX)
    body128 = body.resize((128, 128), Image.Resampling.BOX)

    # Mechanical compositing of generated eyelids, no facial drawing.
    # The slight feather is confined to each recorded eye rectangle.
    mask = Image.new('L', (128, 128), 0)
    for x0, y0, x1, y1 in spec['eye_rects']:
        patch = Image.new('L', (x1-x0, y1-y0), 0)
        d = ImageDraw.Draw(patch)
        d.rounded_rectangle((1, 1, patch.width-2, patch.height-2), radius=3, fill=255)
        patch = patch.filter(ImageFilter.GaussianBlur(0.6))
        mask.paste(patch, (x0, y0))
    blink128 = Image.composite(edit128, face128, mask)
    face128.save(folder / 'face.png')
    blink128.save(folder / 'face-blink.png')
    body128.save(folder / 'body.png')
    mask.save(originals / 'eye-composite-mask-128.png')
    diff = ImageChops.difference(face128, blink128)
    diff.save(originals / 'blink-difference-128.png')

    outside_changes = 0
    changed = 0
    for y in range(128):
        for x in range(128):
            if face128.getpixel((x,y)) != blink128.getpixel((x,y)):
                changed += 1
                if not any(x0 <= x < x1 and y0 <= y < y1 for x0,y0,x1,y1 in spec['eye_rects']):
                    outside_changes += 1
    assert outside_changes == 0
    assert changed > 100
    textures = {}
    for filename in ['face.png', 'face-blink.png', 'body.png']:
        path = folder / filename
        im = Image.open(path)
        assert im.size == (128, 128)
        textures[filename] = {'path':str(path), 'relativePath':str(path.relative_to(ROOT)), 'dimensions':list(im.size), 'sha256':sha(path)}
    originals_data = {}
    for filename in ['face-mother.png', 'face-blink-edit.png', 'body-mother.png']:
        path = originals / filename
        originals_data[filename] = {'path':str(path), 'dimensions':list(Image.open(path).size), 'sha256':sha(path)}
    entry = {
        'id': char,
        'seed': spec['seed'],
        'seedNote':'Built-in tool did not expose seed.',
        'definition':spec['definition'],
        'source':spec['source_files'],
        'status': {'face':'generated independent identity', 'face-blink':'generated eyelid edit, composited only within eye rectangles', 'body':'generated clothing-only torso'},
        'textures':textures,
        'originals':originals_data,
        'cropBox':{'face':[0,0,*mother.size], 'body':[0,0,*body.size]},
        'eyeRegions':spec['eye_rects'],
        'atlasRects':{'face':[0,0,128,128], 'face-blink':[0,0,128,128], 'body':[0,0,128,128]},
        'rigType':None,
        'blinkMode':'two full-square face maps; changes confined to two eyelid regions',
        'animations':['open/closed texture states'],
        'bounds':None,
        'statistics':{'changedBlinkPixels':changed, 'changedPixelsOutsideEyeRegions':outside_changes},
        'verification':{'dimensions':'passed', 'blinkPixelInvariance':'passed', 'visualLowResolution':'pending', 'inSceneUV':'not in asset-only scope'},
        'prompts':{'face':str(folder/'prompts'/'face.txt'), 'blink':str(folder/'prompts'/'blink.txt'), 'body':str(folder/'prompts'/'body.txt')},
    }
    manifest['characters'].append(entry)
    (folder/'manifest.json').write_text(json.dumps(entry, indent=2)+'\n')

# Nearest-neighbor sheet shows actual runtime maps, not an upscaled source.
sheet = Image.new('RGB', (3*384, 2*412), (35,35,35))
d = ImageDraw.Draw(sheet)
for row, char in enumerate(PROVENANCE):
    for col, filename in enumerate(['face.png', 'face-blink.png', 'body.png']):
        im = Image.open(ROOT/char/filename).resize((384,384), Image.Resampling.NEAREST)
        sheet.paste(im, (col*384, row*412+28))
        d.text((col*384+8,row*412+8), f'{char} / {filename} / 128x128', fill=(230,230,230))
sheet.save(ROOT/'inspection-128-nearest.png')
(ROOT/'manifest.json').write_text(json.dumps(manifest, indent=2)+'\n')
print(json.dumps({c['id']:c['statistics'] for c in manifest['characters']}, indent=2))
