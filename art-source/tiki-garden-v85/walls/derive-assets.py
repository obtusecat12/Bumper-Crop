from pathlib import Path
import hashlib
import json
import shutil

import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, sobel

ROOT = Path(__file__).resolve().parent
inputs = json.loads((ROOT / 'generation-inputs.json').read_text())
outputs = []

def remember(path, role, source):
    with Image.open(path) as im:
        size = list(im.size)
    outputs.append({
        'file': path.relative_to(ROOT).as_posix(),
        'role': role,
        'source': source,
        'size': size,
        'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
    })

def save_gray(values, name, role):
    path = ROOT / name
    Image.fromarray(np.clip(values * 255.0, 0, 255).round().astype(np.uint8)).save(path, 'WEBP', lossless=True, method=6)
    remember(path, role, 'originals/lava-rock.png')

for asset in inputs:
    name = 'lava-rock' if asset['name'] == 'lava' else asset['name']
    original = ROOT / 'originals' / f'{name}.png'
    shutil.copy2(asset['generated_native_path'], original)
    remember(original, 'unmodified imagegen native original', asset['generated_native_path'])
    with Image.open(original) as im:
        if name == 'lava-rock':
            base = im.convert('RGB').resize((1024, 1024), Image.Resampling.LANCZOS)
            base.save(ROOT / 'lava-rock-basecolor.webp', 'WEBP', quality=93, method=6)
            remember(ROOT / 'lava-rock-basecolor.webp', 'sRGB basecolor, resize and encoding only', 'originals/lava-rock.png')
        else:
            im.convert('RGB').resize((1536, 512), Image.Resampling.LANCZOS).save(ROOT / f'{name}.webp', 'WEBP', quality=91, method=6)
            remember(ROOT / f'{name}.webp', 'sRGB scenic mural, entire native composition resampled with no cropping', f'originals/{name}.png')

# Derive approximate relief solely from the generated stone luminance.
# Original/basecolor pixels are never procedurally changed.
with Image.open(ROOT / 'originals/lava-rock.png') as im:
    rgb = np.asarray(im.convert('RGB').resize((512, 512), Image.Resampling.LANCZOS), dtype=np.float32) / 255.0
gray = rgb[..., 0] * 0.2126 + rgb[..., 1] * 0.7152 + rgb[..., 2] * 0.0722
smooth = gaussian_filter(gray, sigma=1.1, mode='wrap')
low, high = np.percentile(smooth, [3, 97])
relief = np.clip((smooth - low) / max(high - low, 0.001), 0.0, 1.0)
detail = gray - gaussian_filter(gray, sigma=2.0, mode='wrap')
height = np.clip(0.20 + relief * 0.65 + detail * 0.3, 0.0, 1.0)
save_gray(height, 'lava-rock-height.webp', 'linear luminance-derived approximate height')

dx = sobel(height, axis=1, mode='wrap') / 8.0
dy = sobel(height, axis=0, mode='wrap') / 8.0
# OpenGL normal convention: image rows point downward, tangent +Y points up.
normal = np.stack([-dx * 3.2, dy * 3.2, np.ones_like(dx)], axis=-1)
normal /= np.linalg.norm(normal, axis=-1, keepdims=True)
normal_path = ROOT / 'lava-rock-normal.webp'
Image.fromarray(np.clip((normal * 0.5 + 0.5) * 255.0, 0, 255).round().astype(np.uint8)).save(normal_path, 'WEBP', lossless=True, method=6)
remember(normal_path, 'linear OpenGL +Y tangent normal from approximate height', 'originals/lava-rock.png')

microdetail = np.abs(detail)
roughness = np.clip(0.87 + (0.5 - relief) * 0.08 + microdetail * 0.24, 0.84, 0.98)
save_gray(roughness, 'lava-rock-roughness.webp', 'linear matte high roughness with modest luminance-derived variation')
ao = np.clip(0.70 + relief * 0.30 - np.maximum(gaussian_filter(height, sigma=6.0, mode='wrap') - height, 0.0) * 0.35, 0.64, 1.0)
save_gray(ao, 'lava-rock-ao.webp', 'linear approximate ambient occlusion from luminance-derived recesses')

provenance = {
    'generator': 'built-in image_gen.imagegen',
    'generation_date': '2026-10-04',
    'calls': 'five independent calls: one lava rock tile plus four distinct complete rainforest panels; no collage crops',
    'user_prompt_skill': '../gpt_image_2_prompt_skill.md',
    'reference_inspected': '/workspace/scratch/85111d38430a/upload/QQ20261004-175736.png',
    'diffuse_processing': 'Only Lanczos resizing and WebP encoding; no procedural diffuse synthesis or editing',
    'pbr_note': 'Normal, height, roughness and AO are approximate derived maps; use modest normal scale (0.2 to 0.45) and no displacement unless geometry supports it.',
    'normal_convention': 'OpenGL +Y; linear color space',
    'mural_processing': 'Each full native generated image resampled to 1536x512; no panel slicing or cross-panel crop.',
    'source_generations': inputs,
    'outputs': outputs,
}
(ROOT / 'provenance.json').write_text(json.dumps(provenance, indent=2) + '\n')
print(json.dumps({'outputs': outputs}, indent=2))
