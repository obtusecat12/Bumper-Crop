#!/usr/bin/env python3
"""Convert actual image_gen albedos and derive approximate, unmeasured PBR maps.

No procedural albedo is produced. Sources are preserved byte-for-byte.
Derived maps use luminance heuristics, not measured material properties or
photogrammetry. Run with: python derive_maps.py
"""
from pathlib import Path
import hashlib
import json
import shutil
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter

ROOT = Path(__file__).resolve().parent
GEN = ROOT.parents[1] / 'generated_images'
SOURCES = {
    'gravel': 'exec-1c848124-0833-4c75-8c23-36f53bb06f31.png',
    'boulder': 'exec-286747c9-784c-4ee8-8c81-059c08bbd8ed.png',
    'ceiling': 'exec-781fb2b7-d6c4-4af4-a677-316586df2e08.png',
    'wall': 'exec-047e11d0-e1f6-4ce0-b906-1a8b946271d7.png',
}
CONFIG = {
    'gravel': dict(size=1024, height_range=(0.10, 0.90), normal_strength=12, roughness=0.94, roughness_variation=0.04, ao_strength=1.25, ao_min=0.65, normal_scale=0.30, displacement_scale_m=0.018),
    'boulder': dict(size=1024, height_range=(0.20, 0.80), normal_strength=16, roughness=0.87, roughness_variation=0.09, ao_strength=1.10, ao_min=0.72, normal_scale=0.45, displacement_scale_m=0.040),
    'ceiling': dict(size=512, height_range=(0.37, 0.63), normal_strength=8, roughness=0.96, roughness_variation=0.02, ao_strength=0.30, ao_min=0.93, normal_scale=0.12, displacement_scale_m=0.001),
    'wall': dict(size=512, height_range=(0.43, 0.57), normal_strength=8, roughness=0.90, roughness_variation=0.025, ao_strength=0.20, ao_min=0.97, normal_scale=0.06, displacement_scale_m=0.0003),
}

def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def record(path, semantic, source):
    with Image.open(path) as image:
        image.load()
        size, mode = image.size, image.mode
    return {'path': str(path), 'file': str(path.relative_to(ROOT)), 'semantic': semantic, 'source': source, 'dimensions': list(size), 'decoded_mode': mode, 'bytes': path.stat().st_size, 'sha256': sha256(path)}

def save_data(array, path):
    quantized = np.rint(np.clip(array, 0.0, 1.0) * 255).astype(np.uint8)
    temporary = path.with_name(path.stem + '.tmp.webp')
    Image.fromarray(quantized).save(temporary, 'WEBP', lossless=True, method=6)
    with Image.open(temporary) as image:
        image.load()
    temporary.replace(path)

def seam_metrics(array):
    array = array.astype(np.float32)
    horiz = float(np.abs(array[:, 0] - array[:, -1]).mean())
    vert = float(np.abs(array[0] - array[-1]).mean())
    interior_h = float(np.abs(np.diff(array, axis=1)).mean())
    interior_v = float(np.abs(np.diff(array, axis=0)).mean())
    return {'horizontal_edge_mean_abs_rgb_255': round(horiz, 3), 'vertical_edge_mean_abs_rgb_255': round(vert, 3), 'interior_horizontal_neighbor_mean_abs_rgb_255': round(interior_h, 3), 'interior_vertical_neighbor_mean_abs_rgb_255': round(interior_v, 3), 'comment': 'Generator requested seamless; edge values are not guaranteed to match exactly. Albedo is only resized and encoded, never patched or procedurally replaced.'}

def main():
    for directory in ['originals', 'runtime', 'previews']:
        (ROOT / directory).mkdir(exist_ok=True)
    manifest = {
        'schema': 1,
        'created_utc': '2026-10-04',
        'generator': 'built-in image_gen.imagegen',
        'prompt_guide_url': 'https://github.com/UzenUPozitiv4ik/gpt-image-2-skill/blob/main/gpt_image_2_prompt_skill.md',
        'prompt_guide_read': 'Current local copy supplied by root agent; exact required prefix, grouped fields, 1:1 aspect ratio used.',
        'native_resolution_note': 'Requested native 2k in prompt; built-in tool delivered native 1254×1254 PNG. No upscaling applied. Gravel/boulder basecolor 1024; ceiling/wall basecolor 512; all approximate data maps 512.',
        'reference_images': ['/workspace/scratch/85111d38430a/upload/image(20261004-084104).png', '/workspace/scratch/85111d38430a/upload/image(20261004-084254).png'],
        'derivation': {
            'albedo': 'Actual generated RGB surface image, preserved original; runtime conversion is LANCZOS resize and WebP quality 90. No procedural albedo replacement, seam cleanup, palette repaint, or synthetic detail.',
            'height': 'sRGB decoded to linear RGB, Rec.709 luminance; wrapped Gaussian smoothing at sigma 0.8 px, 20% broad luminance subtraction at sigma 16 px, robust 3–97 percentile normalization, then material-specific restrained height range.',
            'normal': 'Central differences of approximate height with periodic wrap; normalized tangent vectors encoded RGB, OpenGL +Y green convention. Image rows grow downward, so the encoded tangent Y uses positive image-row derivative.',
            'roughness': 'Material-specific scalar baseline with restrained luminance-driven variation; darker areas receive slightly lower roughness. Heuristic, not physically measured.',
            'ao': 'Wrapped local height depression relative to sigma 7 px smoothing, material-specific restrained darkening. Approximation, not baked mesh AO.',
            'displacement': 'Approximate height encoded 8-bit grayscale, not metric geometry. Suggested scales are artistic starting points in meters.',
            'data_encoding': 'Data maps are lossless 8-bit WebP; grayscale files may decode to RGB in WebP. Treat normal, roughness, displacement and AO as linear/NoColorSpace. Treat basecolor as sRGB.',
            'limitations': 'Luminance mixes material pigmentation and residual shading, so PBR data cannot recover true physical shape or roughness. No measured, authored, or scan-derived PBR claim is made.',
        },
        'materials': {},
        'decode_validation': {'all_outputs_loaded': True},
    }
    for name, source_name in SOURCES.items():
        cfg = CONFIG[name]
        original = ROOT / 'originals' / f'{name}-generated.png'
        if not original.exists():
            shutil.copy2(GEN / source_name, original)
        with Image.open(original) as source:
            source.load()
            rgb = source.convert('RGB').resize((cfg['size'], cfg['size']), Image.Resampling.LANCZOS)
        base_path = ROOT / 'runtime' / f'{name}-basecolor.webp'
        base_temp = base_path.with_name(base_path.stem + '.tmp.webp')
        rgb.save(base_temp, 'WEBP', quality=90, method=6)
        with Image.open(base_temp) as image:
            image.load()
        base_temp.replace(base_path)
        data_size = 512
        map_rgb = rgb.resize((data_size, data_size), Image.Resampling.LANCZOS)
        base = np.asarray(map_rgb, dtype=np.float32) / 255.0
        linear = np.where(base <= 0.04045, base / 12.92, ((base + 0.055) / 1.055) ** 2.4)
        luminance = np.sum(linear * np.array([0.2126, 0.7152, 0.0722]), axis=2)
        smooth = gaussian_filter(luminance, sigma=0.8, mode='wrap')
        broad = gaussian_filter(smooth, sigma=16, mode='wrap')
        signal = smooth - 0.2 * broad
        lo, hi = np.percentile(signal, [3, 97])
        normalized = np.clip((signal - lo) / max(hi - lo, 1e-6), 0, 1)
        hmin, hmax = cfg['height_range']
        height = hmin + (hmax - hmin) * normalized
        dx = (np.roll(height, -1, axis=1) - np.roll(height, 1, axis=1)) * 0.5
        dy = (np.roll(height, -1, axis=0) - np.roll(height, 1, axis=0)) * 0.5
        normal_strength = cfg['normal_strength'] * data_size / cfg['size']
        normal = np.stack([-dx * normal_strength, dy * normal_strength, np.ones_like(height)], axis=2)
        normal /= np.linalg.norm(normal, axis=2, keepdims=True)
        normal = normal * 0.5 + 0.5
        roughness = np.clip(cfg['roughness'] + (normalized - 0.5) * cfg['roughness_variation'] * 2, 0, 1)
        local_average = gaussian_filter(height, sigma=7, mode='wrap')
        ao = np.clip(1 - np.maximum(local_average - height, 0) * cfg['ao_strength'], cfg['ao_min'], 1)
        maps = {'normal': normal, 'roughness': roughness, 'displacement': height, 'ao': ao}
        for semantic, data in maps.items():
            save_data(data, ROOT / 'runtime' / f'{name}-{semantic}.webp')
        tiled = Image.new('RGB', (512, 512))
        tile = rgb.resize((256, 256), Image.Resampling.LANCZOS)
        for x, y in [(0,0), (256,0), (0,256), (256,256)]:
            tiled.paste(tile, (x,y))
        tiled.save(ROOT / 'previews' / f'{name}-repeat-2x2.jpg', quality=90)
        paths = [base_path] + [ROOT / 'runtime' / f'{name}-{key}.webp' for key in maps]
        manifest['materials'][name] = {
            'original': record(original, 'original_generated_albedo', 'image_gen.imagegen'),
            'prompt': str(ROOT / 'prompts' / f'{name}.txt'),
            'source_generation_file': str(GEN / source_name),
            'runtime_maps': [record(path, path.stem[len(name)+1:], f'originals/{name}-generated.png') for path in paths],
            'seam_metrics_before_webp': seam_metrics(np.asarray(rgb)),
            'parameters': cfg,
            'suggested_three_settings': {'basecolor_colorSpace': 'SRGBColorSpace', 'data_colorSpace': 'NoColorSpace', 'normalScale': cfg['normal_scale'], 'roughness_multiplier': 1.0, 'aoMapIntensity': 0.7, 'displacementScale_m': cfg['displacement_scale_m'], 'displacementBias_m': -cfg['displacement_scale_m']*0.5, 'repeat': 'Use RepeatWrapping; physical coverage of a gravel tile is approximately 0.5–0.75 m.'},
        }
    guide = ROOT.parents[1] / 'gpt_image_2_prompt_skill.md'
    if guide.exists():
        shutil.copy2(guide, ROOT / 'prompt-guide-used.md')
    (ROOT / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    print(json.dumps({'materials': list(manifest['materials']), 'original_dimensions': [v['original']['dimensions'] for v in manifest['materials'].values()], 'runtime_files': sum(len(v['runtime_maps']) for v in manifest['materials'].values()), 'total_runtime_bytes': sum(f['bytes'] for v in manifest['materials'].values() for f in v['runtime_maps']), 'manifest': str(ROOT / 'manifest.json'), 'seam_metrics': {k:v['seam_metrics_before_webp'] for k,v in manifest['materials'].items()}}, indent=2))

if __name__ == '__main__':
    main()
