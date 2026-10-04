from pathlib import Path
import json
import os
import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent
LANCZOS = Image.Resampling.LANCZOS
manifest = {
    'generation_tool': 'built-in image_gen',
    'reference': '/workspace/scratch/85111d38430a/upload/image(20261004-072854).png',
    'coordinate_convention': 'Pillow crop bounds [left,top,right,bottom], right and bottom excluded',
    'regions': [],
    'map_note': 'All base colors are image-generated artwork or surfaces. Normal, roughness and microheight maps are deterministic approximations derived from base color, not measured scanned PBR maps. Fine normal maps intentionally omit broad carved relief because geometry supplies it.',
}

def atomic_save(image, name, **options):
    destination = ROOT / name
    temporary = ROOT / (destination.stem + '.writing' + destination.suffix)
    image.save(temporary, **options)
    with Image.open(temporary) as check:
        check.load()
    os.replace(temporary, destination)

def record(name, source, box, size, note=''):
    image = Image.open(ROOT / source).convert('RGB').crop(box).resize(size, LANCZOS)
    atomic_save(image, f'{name}-basecolor.png')
    atomic_save(image, f'{name}-basecolor.webp', quality=94, method=6)
    manifest['regions'].append({'asset': name, 'source': source, 'crop_pixels': list(box), 'output_size': list(size), 'note': note})
    return image

def maps(name, base, rough_center, rough_range, normal_gain=4):
    gray = np.asarray(base.convert('L'), dtype=np.float32) / 255.0
    blur = np.asarray(base.convert('L').filter(ImageFilter.GaussianBlur(2.0)), dtype=np.float32) / 255.0
    fine = gray - blur
    height = np.clip(.5 + fine * 1.2, 0, 1)
    gy, gx = np.gradient(height)
    normal = np.dstack((-gx * normal_gain, -gy * normal_gain, np.ones_like(gray)))
    normal /= np.linalg.norm(normal, axis=2, keepdims=True)
    atomic_save(Image.fromarray(np.uint8(np.clip((normal * .5 + .5) * 255, 0, 255)), 'RGB'), f'{name}-normal.png')
    atomic_save(Image.fromarray(np.uint8(height * 255), 'L'), f'{name}-microheight.png')
    rough = np.clip(rough_center + (.5 - blur) * rough_range, .05, 1)
    atomic_save(Image.fromarray(np.uint8(rough * 255), 'L'), f'{name}-roughness.png')

painting = record('painting', 'painting-original.png', (0, 0, 1086, 1448), (768, 1024), 'Exact 3:4 aspect; no frame or mat, full canvas composition.')
fabric = record('upholstery', 'material-atlas-original.png', (0, 0, 627, 627), (1024, 1024), 'TL exact quarter: worn floral tropical cloth.')
original_cane = record('rattan-atlas-cell', 'material-atlas-original.png', (627, 0, 1254, 627), (1024, 1024), 'TR exact quarter retained for provenance; rendered cane pattern. Use separate rattan-basecolor for modeled tubes.')
walnut = record('walnut', 'material-atlas-original.png', (0, 627, 627, 1254), (1024, 1024), 'BL exact quarter: dark wood grain runs vertically.')
bamboo = record('bamboo', 'material-atlas-original.png', (627, 627, 1254, 1254), (1024, 1024), 'BR exact quarter: bamboo stalk texture, grain vertical and horizontal nodes.')
bamboo_pole = record('bamboo-pole', 'material-atlas-original.png', (778, 627, 827, 1254), (128, 1024), 'Interior strip of a single bamboo stalk, avoiding the atlas multiple-pole layout; suitable for wrapping modeled bamboo tubes. One natural node is retained.')
rattan_source = Image.open(ROOT / 'rattan-skin-original.png')
rattan = record('rattan', 'rattan-skin-original.png', (0, 0, rattan_source.width, rattan_source.height), (1024, 1024), 'Corrected continuous flat rattan skin with fine vertical fibers and no pole edges or node bands.')
left = record('tiki-left', 'tiki-mask-atlas-original.png', (0, 0, 512, 1536), (512, 1536), 'Exact left half, 1:3 front texture; long crest and narrow nose.')
right = record('tiki-right', 'tiki-mask-atlas-original.png', (512, 0, 1024, 1536), (512, 1536), 'Exact right half, 1:3 front texture; broad forehead, mouth and chin.')

for name, image, center, spread, gain in [
    ('upholstery',fabric,.93,.13,6),
    ('walnut',walnut,.83,.18,4),
    ('bamboo',bamboo,.77,.16,4),
    ('bamboo-pole',bamboo_pole,.77,.16,4),
    ('rattan',rattan,.74,.16,4),
    ('tiki-left',left,.84,.14,3),
    ('tiki-right',right,.84,.14,3),
]:
    maps(name, image, center, spread, gain)

atlas = Image.open(ROOT / 'material-atlas-original.png').convert('RGB')
atlas.paste(rattan.resize((627,627),LANCZOS),(627,0))
atomic_save(atlas, 'material-atlas-final.png')
atomic_save(atlas, 'material-atlas-final.webp', quality=94, method=6)
manifest['corrected_atlas'] = 'material-atlas-final.png replaces only the exact TR quarter with the separately generated rattan-skin-original.png resized to 627×627; other quarters are untouched.'
manifest['mask_geometry_landmarks'] = {
    'units': 'fractions of each texture width and height, origin upper left',
    'tiki-left': {'eye_centers':[[.30,.345],[.72,.345]], 'nose_tip':[.51,.493], 'mouth_center':[.51,.631], 'chin':[.51,.844]},
    'tiki-right': {'eye_centers':[[.28,.365],[.74,.365]], 'nose_tip':[.51,.527], 'mouth_center':[.50,.683], 'chin':[.50,.912]},
}
(ROOT / 'crop-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
print(json.dumps({'assets':len(manifest['regions']), 'files':len(list(ROOT.iterdir())), 'directory':str(ROOT)}))
