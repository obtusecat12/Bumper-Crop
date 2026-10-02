#!/usr/bin/env python3
"""Pack V70 generated art and derive small PBR data maps, without painting artwork.

Run with --repo /path/to/site-checkout to target another checkout. With no
arguments the script targets its own parent project (the packing workspace).
Source PNGs are copied unchanged, including the two superseded soy capacity
variants. A committed sources/ tree can recreate runtime files after scratch
generation files are unavailable. Pillow and NumPy are required.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import shutil

import numpy as np
from PIL import Image, ImageFilter, ImageDraw


ASSETS = {
    'waterfall-ad': ('vending/waterfall-ad.png', (768, 1536), None),
    'right-control': ('vending/right-control.png', (256, 2048), (252, 0, 473, 2172)),
    'left-control': ('vending/left-coffee-control.png', (256, 2048), (212, 0, 512, 2172)),
    'black-metal': ('vending/black-enamel.png', (512, 512), None),
    'brushed-metal': ('vending/brushed-steel.png', (512, 512), None),
    'seat-plastic': ('props/waiting-seat-plastic.png', (512, 512), None),
    'rubber-mat': ('props/rubber-mat-teal.png', (512, 512), None),
    'notice-board': ('props/palm-court-noticeboard.png', (1024, 768), None),
    'scale-dial': ('props/public-weight-dial.png', (512, 512), None),
    'stained-steel': ('props/public-fountain-stainless.png', (512, 512), None),
    'drink-plastic': ('drinks/bottle-plastic-shell.png', (512, 512), None),
    'pet-label': ('drinks/almond-pet-label.png', (1536, 512), None),
    'can-label': ('drinks/almond-can-label.png', (1024, 512), None),
    'can-top': ('drinks/almond-can-top.png', (512, 512), None),
    'soy-front': ('drinks/lucky-soy-front-corrected500ml.png', (768, 960), None),
    'soy-back': ('drinks/lucky-soy-back-corrected500ml.png', (768, 960), None),
}

# Data-map parameters are intentionally modest. NormalScale in Three.js
# attenuates these once again; printed ink is not treated as a raised label.
SURFACES = {
    'black-metal': {'normal_gain': 1.25, 'roughness_mean': .84, 'roughness_spread': .065},
    'brushed-metal': {'normal_gain': .90, 'roughness_mean': .70, 'roughness_spread': .080},
    'seat-plastic': {'normal_gain': 1.10, 'roughness_mean': .89, 'roughness_spread': .040},
    'rubber-mat': {'normal_gain': 2.50, 'roughness_mean': .95, 'roughness_spread': .035},
    'drink-plastic': {'normal_gain': .85, 'roughness_mean': .88, 'roughness_spread': .035},
    'stained-steel': {'normal_gain': .80, 'roughness_mean': .82, 'roughness_spread': .065},
}
LABEL_NORMALS = {'pet-label': .20, 'can-label': .20,
                 'can-top': 1.25, 'soy-front': .20, 'soy-back': .20}


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def gray(image: Image.Image) -> np.ndarray:
    rgb = np.asarray(image.convert('RGB'), dtype=np.float32) / 255.
    return rgb @ np.asarray([.2126, .7152, .0722], dtype=np.float32)


def blur(values: np.ndarray, radius: float, wrap: bool) -> np.ndarray:
    """Periodic source padding prevents seams in data-map filtering."""
    h, w = values.shape
    if wrap:
        margin = max(2, int(radius * 4 + 1))
        padded = np.pad(values, ((margin, margin), (margin, margin)), mode='wrap')
        filtered = Image.fromarray(np.uint8(np.clip(padded, 0, 1) * 255)).filter(ImageFilter.GaussianBlur(radius))
        return np.asarray(filtered, dtype=np.float32)[margin:margin+h, margin:margin+w] / 255.
    filtered = Image.fromarray(np.uint8(np.clip(values, 0, 1) * 255)).filter(ImageFilter.GaussianBlur(radius))
    return np.asarray(filtered, dtype=np.float32) / 255.


def normal_map(image: Image.Image, gain: float, wrap: bool) -> Image.Image:
    luminance = gray(image)
    # Remove broad illumination and printed color variation; retain fine grain.
    detail = luminance - blur(luminance, 2.2 if wrap else 1.4, wrap)
    detail = np.clip(detail, -.075, .075)
    if wrap:
        gx = (np.roll(detail, -1, axis=1) - np.roll(detail, 1, axis=1)) * .5
        gy = (np.roll(detail, -1, axis=0) - np.roll(detail, 1, axis=0)) * .5
    else:
        gy, gx = np.gradient(detail)
    # OpenGL tangent-space +Y is up; source images have a top-left origin.
    vectors = np.stack((-gx * gain, gy * gain, np.ones_like(detail)), axis=-1)
    vectors /= np.linalg.norm(vectors, axis=-1, keepdims=True)
    return Image.fromarray(np.uint8(np.clip(vectors * .5 + .5, 0, 1) * 255), 'RGB')


def roughness_map(image: Image.Image, mean: float, spread: float) -> Image.Image:
    luminance = gray(image)
    grain = np.clip((luminance - blur(luminance, 6., True)) * 3.5, -1, 1)
    roughness = np.clip(mean - grain * spread, .45, .99)
    # Replicated RGB data are read from green by MeshStandardMaterial.
    encoded = np.uint8(roughness * 255)
    return Image.fromarray(np.repeat(encoded[..., None], 3, axis=-1), 'RGB')


def copy_sources(input_root: Path, art_root: Path) -> Path:
    source_tree = art_root / 'sources'
    source_tree.mkdir(parents=True, exist_ok=True)
    if input_root.exists() and input_root.resolve() != source_tree.resolve():
        for folder in ('vending', 'drinks', 'props'):
            if (input_root / folder).exists():
                shutil.copytree(input_root / folder, source_tree / folder, dirs_exist_ok=True)
    missing = [relative for relative, _, _ in ASSETS.values() if not (source_tree / relative).exists()]
    if missing:
        raise FileNotFoundError('Missing original generated assets: ' + ', '.join(missing))
    return source_tree


def archive_references(art_root: Path, scratch_root: Path) -> None:
    references = art_root / 'references'
    research = art_root / 'research'
    references.mkdir(exist_ok=True)
    research.mkdir(exist_ok=True)
    for original, destination in [
        ('image(20261002-122628).png', 'vending-reference.png'),
        ('image(20261002-123017).png', 'backcourt-reference.png'),
    ]:
        source = scratch_root / 'upload' / original
        if source.exists():
            shutil.copy2(source, references / destination)
    for filename in ('backcourt-research.md', 'backcourt-plan.json'):
        source = scratch_root / 'v70-work' / 'layout' / filename
        if source.exists():
            shutil.copy2(source, research / filename)


def control_uvs(source_tree: Path) -> dict:
    original = json.loads((source_tree / 'vending' / 'uv-rects.json').read_text())
    result = {}
    for image_name, runtime_name in [('right-control.png', 'right-control'), ('left-coffee-control.png', 'left-control')]:
        _, dimensions, crop = ASSETS[runtime_name]
        cx0, cy0, cx1, cy1 = crop
        cw, ch = cx1-cx0, cy1-cy0
        regions = {}
        for key, region in original[image_name]['rectangles'].items():
            x0, y0, x1, y1 = region['pixels_top_left_xyxy']
            regions[key] = {
                'source_pixels_top_left_xyxy': [x0, y0, x1, y1],
                'runtime_pixels_top_left_xyxy': [(x0-cx0)/cw*dimensions[0], (y0-cy0)/ch*dimensions[1], (x1-cx0)/cw*dimensions[0], (y1-cy0)/ch*dimensions[1]],
                'threejs_texture_offset': [(x0-cx0)/cw, 1-(y1-cy0)/ch],
                'threejs_texture_repeat': [(x1-x0)/cw, (y1-y0)/ch],
            }
        result[runtime_name] = {'runtime': runtime_name+'.webp', 'size': dimensions, 'source_crop': crop, 'rectangles': regions}
    return result


def create_contact_sheet(images: dict, checks: Path) -> None:
    """Verification-only montage; every actual asset was generated separately."""
    cell_w, cell_h = 320, 350
    sheet = Image.new('RGB', (cell_w*4, cell_h*4), '#d4d7d3')
    draw = ImageDraw.Draw(sheet)
    for i, (name, image) in enumerate(images.items()):
        x, y = (i % 4)*cell_w, (i // 4)*cell_h
        preview = image.copy()
        preview.thumbnail((cell_w-16, cell_h-32), Image.Resampling.LANCZOS)
        sheet.paste(preview, (x+(cell_w-preview.width)//2, y+24+(cell_h-32-preview.height)//2))
        draw.text((x+8, y+7), name, fill='#17272b')
    sheet.save(checks / 'runtime-contact-sheet.jpg', quality=94)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repo', type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument('--source-root', type=Path, default=Path('/workspace/scratch/85111d38430a/v70-assets'))
    args = parser.parse_args()
    repo = args.repo.resolve()
    runtime = repo / 'dist' / 'textures' / 'vending-v70'
    art = repo / 'art-source' / 'backcourt-v70'
    checks = art / 'checks'
    for folder in (runtime, art, checks):
        folder.mkdir(parents=True, exist_ok=True)
    sources = copy_sources(args.source_root, art)
    archive_references(art, args.source_root.parent)
    records = []
    resized = {}
    for name, (relative, dimensions, crop) in ASSETS.items():
        source = sources / relative
        original = Image.open(source).convert('RGB')
        image = original.crop(crop) if crop else original
        image = image.resize(dimensions, Image.Resampling.LANCZOS)
        resized[name] = image
        path = runtime / (name+'.webp')
        quality = 94 if name not in SURFACES and name != 'waterfall-ad' else 92
        image.save(path, 'WEBP', quality=quality, method=6)
        records.append({'name': name, 'kind': 'generated-albedo', 'file': str(path.relative_to(repo)), 'size': list(dimensions), 'bytes': path.stat().st_size, 'sha256': digest(path), 'source': str(source.relative_to(repo)), 'source_size': list(original.size), 'source_sha256': digest(source), 'source_crop_xyxy': list(crop) if crop else None, 'resample': 'LANCZOS', 'webp_quality': quality})
    for name, parameters in SURFACES.items():
        for suffix, data in [
            ('normal', normal_map(resized[name], parameters['normal_gain'], True)),
            ('roughness', roughness_map(resized[name], parameters['roughness_mean'], parameters['roughness_spread'])),
        ]:
            path = runtime / f'{name}-{suffix}.webp'
            data.save(path, 'WEBP', lossless=True, method=6)
            records.append({'name': name+'-'+suffix, 'kind': 'derived-'+suffix, 'file': str(path.relative_to(repo)), 'size': list(data.size), 'bytes': path.stat().st_size, 'sha256': digest(path), 'source_albedo': name, 'sampling': 'periodic wrap', 'parameters': parameters, 'webp_lossless': True})
    for name, gain in LABEL_NORMALS.items():
        path = runtime / f'{name}-normal.webp'
        data = normal_map(resized[name], gain, False)
        data.save(path, 'WEBP', lossless=True, method=6)
        records.append({'name': name+'-normal', 'kind': 'derived-normal', 'file': str(path.relative_to(repo)), 'size': list(data.size), 'bytes': path.stat().st_size, 'sha256': digest(path), 'source_albedo': name, 'sampling': 'clamp', 'normal_gain': gain, 'webp_lossless': True})
    assert len(records) == 33
    expected = {r['name']+'.webp' for r in records}
    stale = sorted(p.name for p in runtime.glob('*.webp') if p.name not in expected)
    if stale:
        raise RuntimeError('Unexpected runtime assets (not deleted automatically): '+', '.join(stale))
    for record in records:
        with Image.open(repo / record['file']) as packed:
            assert list(packed.size) == record['size']
            packed.load()
    manifest = {
        'version': 70,
        'created_utc': datetime.now(timezone.utc).isoformat(),
        'generator': 'builtin image_gen.imagegen',
        'independently_generated_asset_count': 16,
        'successful_generation_call_count': 18,
        'generation_note': '16 independent assets; two additional imagegen edits corrected soy front/back capacity to 500 mL. All original and corrected PNGs retained.',
        'runtime_texture_count': len(records),
        'runtime_breakdown': {'albedo': 16, 'surface_normal': 6, 'surface_roughness': 6, 'label_and_can_top_normal': 5},
        'runtime_total_bytes': sum(r['bytes'] for r in records),
        'estimated_gpu_rgba8_with_mips_bytes': round(sum(r['size'][0]*r['size'][1]*4*4/3 for r in records)),
        'reported_image_generation_cost': None,
        'cost_note': 'Builtin image generation did not expose a monetary or credit bill; no value is invented. No Tripo or third-party paid 3D generation task was submitted.',
        'processing': 'Mechanical crops and LANCZOS resizing only for artwork. Micro-normal and roughness are restrained technical inferences from generated source detail, not independently generated painted artwork or measured height. Periodic padding and finite differences for repeating surface data maps; clamp sampling for printed-label data maps.',
        'runtime_color_space': 'albedo=sRGB; normal/roughness=NoColorSpace; normals use OpenGL tangent-space +Y convention',
        'reference_directory': 'references', 'research_directory': 'research',
        'source_directory': 'sources; per-asset prompts and original provenance preserved here',
        'assets': records,
    }
    (art / 'runtime-manifest.json').write_text(json.dumps(manifest, indent=2)+'\n')
    (art / 'control-uv-rects.json').write_text(json.dumps(control_uvs(sources), indent=2)+'\n')
    create_contact_sheet(resized, checks)
    (art / 'README.md').write_text(
        '# Palm Court rear refreshment area: V70 texture sources\n\n'
        'The 16 independent artworks were generated with built-in imagegen in separate calls, not a multi-view collage. There were 18 successful generation calls including two targeted soy capacity edits; the selected front/back labels both read 500 mL. Original generated PNGs, the corrected siblings, per-call structured prompts, downloaded prompt skills and original provenance remain in `sources/`.\n\n'
        'Two uploaded source references remain in `references/`, and the physical-product research and spatial plan remain in `research/`. The control strip artwork is cropped to its measured core before resizing to 256 × 2048. The notice board is 1024 × 768, preserving its original 4:3 shape. `control-uv-rects.json` maps source label/button rectangles into the cropped runtime textures.\n\n'
        'Runtime: 16 albedo maps, six surface normal maps, six surface roughness maps, and five label/can-top normal maps, totaling 33 WebP files. Albedo WebP quality is 92–94, with printed text at 94; derived data maps use lossless WebP. All texture sizes, original/runtime checksums and exact byte counts are in `runtime-manifest.json`.\n\n'
        'No packaging art is programmatically redrawn. Data-map derivation uses high-pass detail and small gradients; these maps are material approximations, not captured physical scans. Repeating surface maps use periodic padding and wrapped gradients. Printed labels use clamped gradients so their edges do not wrap. Metalness remains a physical-material scalar instead of an unnecessary identical map.\n\n'
        'The weighing dial has no painted pointer: its modeled needle overlays the image. The can top source includes the pull tab photograph for small-scale surface detail; its functional ring and lid rim are separately modeled. `checks/runtime-contact-sheet.jpg` is a verification montage only.\n\n'
        'Regenerate with `python scripts/pack-backcourt-v70.py --repo /path/to/site-checkout`. The script can restore from the committed `art-source/backcourt-v70/sources` tree when scratch inputs are gone. Reported image-generation costs are unknown because the builtin tool exposes no bill; no credit or dollar amount is fabricated.\n')
    print(json.dumps({k:manifest[k] for k in ('independently_generated_asset_count','successful_generation_call_count','runtime_texture_count','runtime_breakdown','runtime_total_bytes','estimated_gpu_rgba8_with_mips_bytes')}, indent=2))


if __name__ == '__main__':
    main()
