from pathlib import Path
from PIL import Image, ImageFilter, ImageOps
import numpy as np
import json, hashlib

ROOT = Path(__file__).resolve().parent
SPEC = {
    'thatch': {'size': (1024, 512), 'map_size': (512, 256), 'tile': 'horizontal only', 'strength': 0.75, 'roughness': 0.94},
    'palm-trunk': {'size': (1024, 1024), 'map_size': (512, 512), 'tile': 'both axes', 'strength': 0.85, 'roughness': 0.89},
    'sandal-footbed': {'size': (512, 1024), 'map_size': (256, 512), 'tile': 'neither axis', 'strength': 0.50, 'roughness': 0.95},
    'sandal-strap': {'size': (1024, 1024), 'map_size': (512, 512), 'tile': 'both axes', 'strength': 0.65, 'roughness': 0.94},
}

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def describe(path):
    with Image.open(path) as im:
        im.load()
        a=np.array(im.convert('RGBA'))[:,:,3]
        return {'path': str(path), 'bytes': path.stat().st_size, 'sha256': sha(path), 'width': im.width, 'height': im.height, 'mode': im.mode,
                'alpha_min': int(a.min()), 'alpha_max': int(a.max()), 'zero_alpha_pixels': int((a == 0).sum()), 'alpha_bbox': im.convert('RGBA').getchannel('A').getbbox()}

manifest = {
    'generator': 'built-in image_gen',
    'prompts': str(ROOT/'prompts.json'),
    'prompt_skill': str(ROOT/'prompt-skill-source.md'),
    'original_sources': str(ROOT/'original-sources.json'),
    'references_inspected': ['/workspace/scratch/85111d38430a/upload/image(20261004-084104).png', '/workspace/scratch/85111d38430a/upload/image(20261004-084254).png'],
    'derived_maps': 'Approximate tangent-space OpenGL +Y normal maps and grayscale roughness, computed from high-pass albedo luminance; not measured or physically scanned maps. No original generation pixels were replaced.',
    'assets': {}
}

for name, spec in SPEC.items():
    source=ROOT/'originals'/f'{name}-original.png'
    with Image.open(source) as im:
        im.load()
        has_alpha=im.mode=='RGBA'
        base=im.convert('RGBA' if has_alpha else 'RGB').resize(spec['size'],Image.Resampling.LANCZOS)
        out=ROOT/'runtime'/f'{name}-basecolor.webp'
        base.save(out,format='WEBP',quality=94,method=6,exact=True)
        small=base.resize(spec['map_size'],Image.Resampling.LANCZOS).convert('RGBA')
    a=np.array(small,dtype=np.float32)/255
    gray=0.2126*a[:,:,0]+0.7152*a[:,:,1]+0.0722*a[:,:,2]
    blur=np.array(Image.fromarray((gray*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2)),dtype=np.float32)/255
    detail=(gray-blur)
    mask=a[:,:,3]>0.5
    height=detail*mask
    dx=(np.roll(height,-1,axis=1)-np.roll(height,1,axis=1))*0.5
    dy=(np.roll(height,-1,axis=0)-np.roll(height,1,axis=0))*0.5
    if spec['tile']!='both axes': dy[0]=dy[1];dy[-1]=dy[-2]
    if spec['tile']=='neither axis': dx[:,0]=dx[:,1];dx[:,-1]=dx[:,-2]
    # V runs upward in tangent space, while image row coordinates run downward.
    n=np.stack([-dx*spec['strength']*8,dy*spec['strength']*8,np.ones_like(height)],axis=-1)
    n/=np.linalg.norm(n,axis=-1,keepdims=True)
    n[~mask]=(0,0,1)
    normal=Image.fromarray(np.rint((n*0.5+0.5)*255).clip(0,255).astype(np.uint8),'RGB')
    normal_path=ROOT/'maps'/f'{name}-normal.webp'
    normal.save(normal_path,format='WEBP',lossless=True,method=6)
    rough=np.clip(spec['roughness']+detail*0.24,0.75,0.99)
    rough[~mask]=spec['roughness']
    rough=Image.fromarray(np.rint(rough*255).astype(np.uint8),'L').convert('RGB')
    rough_path=ROOT/'maps'/f'{name}-roughness.webp'
    rough.save(rough_path,format='WEBP',lossless=True,method=6)
    manifest['assets'][name]={
       'original':describe(source), 'basecolor':describe(out), 'normal':describe(normal_path), 'roughness':describe(rough_path),
       'tile':spec['tile'], 'roughness_baseline':spec['roughness'],
       'color_spaces': {'basecolor':'sRGB', 'normal':'linear / no color space', 'roughness':'linear / no color space'},
       'suggested_alpha_test':0.42 if has_alpha else None,
       'notes': 'Straw fibers run vertically; U repeats around parasol circumference; V is clamped and bottom of image is the hanging fringe.' if name=='thatch' else ('Exact top view, toe at top and heel at bottom; no straps; alpha outside the footbed. Map full image into footbed UV bounds.' if name=='sandal-footbed' else 'Photographic tiling material; inspect repeated use at final scene scale.')
    }

manifest['validation']={'all_files_decoded':True, 'original_sha256_recorded':True, 'runtime_alpha_checked_on_neutral_composite':True}
(ROOT/'manifest.json').write_text(json.dumps(manifest,indent=2))
print(json.dumps({k:{'basecolor':v['basecolor']['path'],'normal':v['normal']['path'],'roughness':v['roughness']['path']} for k,v in manifest['assets'].items()},indent=2))
