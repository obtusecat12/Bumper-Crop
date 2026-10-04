from pathlib import Path
from datetime import datetime, timezone
import hashlib
import json
import shutil

import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter


ROOT = Path('/workspace/scratch/85111d38430a')
OUTPUT = ROOT / 'assets-garden-v86' / 'surfaces'
SOURCES = {
    'lava': 'exec-1d0c5df8-1ffb-492a-8a23-1a08ae6a153d.png',
    'flagstone': 'exec-0c5c181b-e735-4566-aa04-fc9aba307a0c.png',
    'ceiling': 'exec-3d5bab5b-015e-4ac3-aa15-7d2d58d45c56.png',
}
PARAMETERS = {
    'lava': dict(height_range=0.80, normal_strength=4.0, roughness=0.90, ao_strength=0.34),
    'flagstone': dict(height_range=0.48, normal_strength=3.2, roughness=0.88, ao_strength=0.25),
    'ceiling': dict(height_range=0.08, normal_strength=0.42, roughness=0.97, ao_strength=0.05),
}


def gray_png(array, path):
    Image.fromarray(np.rint(np.clip(array, 0, 1) * 255).astype(np.uint8), 'L').save(path)


manifest = {
    'created_at': datetime.now(timezone.utc).isoformat(),
    'generator': 'built-in image_gen.imagegen',
    'prompt_prefix': "Generate an image with the following prompt, dont change it(DO NOT CHANGE THIS PROMPT, IT'S ALREADY AN IMPROVED PROMPT) - ",
    'references_inspected': [str(ROOT / 'upload' / 'QQ20261004-210225.png'), str(ROOT / 'upload' / 'QQ20261004-210209.png')],
    'reference_usage': 'References visually inspected; independent new material generations with no edit targets.',
    'map_method': 'Estimated numerical derivatives of diffuse luminance. These are artistic relief estimates, not independently captured physical measurements. All filters and central differences use periodic wrap.',
    'runtime': {'diffuse': '1024x1024 RGB PNG, sRGB', 'auxiliary': '512x512 PNG, linear/non-color data', 'normal_convention': 'Tangent space OpenGL +Y; green channel is positive image-row derivative.'},
    'materials': {},
}

for name, source_file in SOURCES.items():
    source = ROOT / 'generated_images' / source_file
    native = OUTPUT / f'{name}_native_original.png'
    shutil.copy2(source, native)
    image = Image.open(native).convert('RGB')
    base = image.resize((1024, 1024), Image.Resampling.LANCZOS)
    base_path = OUTPUT / f'{name}_base_1024.png'
    base.save(base_path)
    rgb = np.asarray(base.resize((512, 512), Image.Resampling.LANCZOS), dtype=np.float32) / 255.0
    luminance = rgb[..., 0] * 0.2126 + rgb[..., 1] * 0.7152 + rgb[..., 2] * 0.0722
    smooth = gaussian_filter(luminance, 0.7, mode='wrap')
    low, high = np.percentile(smooth, (2, 98))
    normalized = np.clip((smooth - low) / max(high - low, 0.00001), 0, 1)
    p = PARAMETERS[name]
    height = 0.5 + (normalized - 0.5) * p['height_range']
    dx = (np.roll(height, -1, axis=1) - np.roll(height, 1, axis=1)) * 0.5
    dy = (np.roll(height, -1, axis=0) - np.roll(height, 1, axis=0)) * 0.5
    normal = np.stack((-dx * p['normal_strength'], dy * p['normal_strength'], np.ones_like(height)), axis=-1)
    normal /= np.linalg.norm(normal, axis=-1, keepdims=True)
    Image.fromarray(np.rint((normal * 0.5 + 0.5) * 255).astype(np.uint8), 'RGB').save(OUTPUT / f'{name}_normal_512.png')
    local_average = gaussian_filter(normalized, 5.0, mode='wrap')
    cavity = np.clip((local_average - normalized) * 2.0, 0, 1)
    ao = np.clip(1.0 - cavity * p['ao_strength'], 0, 1)
    local_variance = gaussian_filter((normalized - gaussian_filter(normalized, 1.2, mode='wrap')) ** 2, 2.0, mode='wrap')
    roughness = np.clip(p['roughness'] + np.sqrt(local_variance) * 0.2 + (0.5 - normalized) * 0.02, 0.80, 1.0)
    gray_png(height, OUTPUT / f'{name}_height_512.png')
    gray_png(ao, OUTPUT / f'{name}_ao_512.png')
    gray_png(roughness, OUTPUT / f'{name}_roughness_512.png')
    manifest['materials'][name] = {
        'native_original': native.name,
        'source_generated_file': str(source),
        'native_size': list(image.size),
        'sha256_native': hashlib.sha256(native.read_bytes()).hexdigest(),
        'prompt_file': f'{name}_prompt.txt',
        'prompt': (OUTPUT / f'{name}_prompt.txt').read_text(),
        'parameters': p,
        'maps': {map_name: f'{name}_{map_name}_{1024 if map_name == "base" else 512}.png' for map_name in ('base', 'normal', 'roughness', 'height', 'ao')},
        'tiling_verification': f'{name}_tiling_preview.jpg',
    }

(OUTPUT / 'provenance.json').write_text(json.dumps(manifest, indent=2) + '\n')
print(json.dumps({name: data['maps'] for name, data in manifest['materials'].items()}, indent=2))
