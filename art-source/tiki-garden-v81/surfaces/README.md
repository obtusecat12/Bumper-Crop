# Garden surface assets v81

Four separate photographic surface images generated with the built-in `image_gen.imagegen` tool after inspecting both supplied room references and reading the current local copy of the requested GPT image prompt guide. Every prompt uses its exact required prefix, grouped fields, and a 1:1 aspect ratio. The tool delivered native 1254 × 1254 RGB PNG images despite the prompt requesting 2k; these native originals are preserved without upscaling.

| Material | Basecolor | Normal / roughness / displacement / AO | Suggested initial normal scale |
|---|---:|---:|---:|
| gravel | 1024 × 1024 | 512 × 512 | 0.30 |
| boulder | 1024 × 1024 | 512 × 512 | 0.45 |
| ceiling | 512 × 512 | 512 × 512 | 0.12 |
| wall | 512 × 512 | 512 × 512 | 0.06 |

The `runtime/` directory contains these exact names for each material:

- `gravel-basecolor.webp`, `gravel-normal.webp`, `gravel-roughness.webp`, `gravel-displacement.webp`, `gravel-ao.webp`
- `boulder-basecolor.webp`, `boulder-normal.webp`, `boulder-roughness.webp`, `boulder-displacement.webp`, `boulder-ao.webp`
- `ceiling-basecolor.webp`, `ceiling-normal.webp`, `ceiling-roughness.webp`, `ceiling-displacement.webp`, `ceiling-ao.webp`
- `wall-basecolor.webp`, `wall-normal.webp`, `wall-roughness.webp`, `wall-displacement.webp`, `wall-ao.webp`

Basecolors are actual generated imagery, with only resizing and WebP encoding. The other maps are numerical luminance-based approximations produced by `derive_maps.py`; they are not measured PBR scans, photogrammetry, or physically recovered geometry. The displacement signal uses restrained material-specific ranges, the normal map uses its wrapped central differences, the roughness map uses a material baseline with slight luminance variation, and AO darkens approximate local depressions. Pigmentation can be interpreted as shape by these heuristics, so use restrained normal and displacement strengths.

Use sRGB for basecolors and linear / NoColorSpace for the data maps. Normal maps use the OpenGL +Y convention. Scalar WebP maps may decode to RGB, with identical channel values. All data maps are encoded losslessly. Runtime basecolors use WebP quality 90. All 24 source and runtime images were decoded successfully; the 20 runtime maps total 4,942,458 bytes.

The generator was asked for seamless edges. The `previews/` directory contains visually inspected 2 × 2 repeat previews. No conspicuous broad seam appears at that viewing scale, but opposite pixel edges are not guaranteed identical. Edge mismatch metrics are recorded honestly in `manifest.json`; the albedos were not painted, patched, or procedurally replaced to force edge equality.

The `originals/` directory preserves `gravel-generated.png`, `boulder-generated.png`, `ceiling-generated.png`, and `wall-generated.png` byte-for-byte. The `prompts/` directory preserves the four exact generation prompts. `prompt-guide-used.md` is the guide copy read for this generation. `manifest.json` records exact absolute paths, dimensions, SHA-256 hashes, provenance, settings and derivation details. `derive_maps.py` is reproducible from the preserved originals and requires Pillow, NumPy and SciPy.

This deliverable is asset-only; no project code or Site checkout was edited.
