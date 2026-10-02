# NPC diffuse textures v67

Five independently generated diffuse textures. The runtime maps are nearest-sampled exports of accepted imagegen artwork with mechanical UV coordinate resampling and atlas packing only. No model or animation is included in this asset task.

| Asset | Runtime file | Size | Main palette |
|---|---|---|---|
| Younger face | `runtime/face-a.png` | 256×256 | light olive ochre `#a76d4b`, dark hair `#271c16` |
| Older face | `runtime/face-b.png` | 256×256 | warm tan `#af6c43`, grey brown hair `#44362d` |
| Younger torso/limbs | `runtime/body-a.png` | 256×256 | `#a06b48`, `#af7953`, shadow `#533524` |
| Older torso/limbs | `runtime/body-b.png` | 256×256 | `#aa6943`, `#b97850`, shadow `#472616` |
| Towel terry | `runtime/towel.png` | 128×128 | dusty seafoam `#85ab98`, `#648e7b`, `#b0cfbd` |

Identical runtime copies also exist directly in this directory for model import. Source originals remain at 1254×1254 in `originals/`. Every prompt is retained in `prompts/` and begins with the exact requested prompt prefix. `generation-records.json` records all generation requests, refinements, and rejected output attempts. `provenance.json` records hashes, palettes, runtime settings, and complete source-to-runtime mapping. `export_runtime.py` reproduces the exports from saved originals.

## UV coordinates

All coordinates below use top-left image origin. Runtime texture `image_v` increases downwards. Convert according to the consuming renderer's image/UV convention.

### Heads

Front face center U=0.50, with front face region U=.25–.75 and rear seam at U=0/1. Hair and side/back skin continue to the edges.

| Landmark | Younger face | Older face |
|---|---|---|
| Eye centers (U, image_v) | (.3995,.39), (.6021,.39) | (.3860,.39), (.6164,.39) |
| Nose center | (.50,.55) | (.50,.55) |
| Mouth center | (.50,.70) | (.50,.70) |
| Chin | (.50,.88) | (.50,.88) |

Eye U positions reflect the generated artwork; the horizontal coordinate was preserved. Adapt mesh UVs and eyelid UVs to these centers. Vertical rows were resampled piecewise with nearest source pixels: younger source eye y=.421431→.39; older source eye y=.415728→.39. Nose, mouth and chin mapping are recorded exactly in `provenance.json`. Forehead sampling around V=.32–.34 is clear skin, above the eyebrows.

### Torso and limbs

| Region | Runtime pixel bounds | Normalized UV bounds |
|---|---|---|
| Front torso | [0,0,128,160] | [0,0,.5,.625] |
| Back torso | [128,0,256,160] | [.5,0,1,.625] |
| Arm strip | [0,160,64,256] | [0,.625,.25,1] |
| Leg strip | [64,160,128,256] | [.25,.625,.5,1] |
| Palm/foot patches | [128,160,256,256] | [.5,.625,1,1] |

The generated torso/limb split was at source row 627 of 1254. Runtime export repacks torso artwork into 160 rows and limb artwork into 96 rows. Body B's generated towel fringe was excluded from the skin atlas by retaining source torso rows 0–539; the separate towel map supplies cloth. Limb regions contain paired painted views and internal dark baked shadows. For simple low-poly limb meshes, sample an interior view rather than traversing the dark separator between the paired views. Hand/foot regions contain their own small islands.

## Runtime and diagnostics

Use sRGB diffuse color, nearest minification and magnification, and disable mipmaps. Use ClampToEdge on body maps; Repeat U and ClampToEdge V for the rear-seamed head maps; Repeat on both axes for the towel. No normal, roughness or specular maps are supplied. The artwork includes painted diffuse shading and restrained damp highlights.

`diagnostics/{face-a,face-b,body-a,body-b,towel}-uv.png` are labeled diagnostic images only. Never use them as runtime textures. Each runtime PNG and every accepted original was visually inspected. The generation and runtime files are separate; no generative contact sheet was used.
