# Wooden tiki texture assets

Generated with the built-in `image_gen.imagegen` tool on 2026-10-04. No external generator or API was used. All native selected images are copied without modification from the tool output.

## Selected generated originals

| Asset | Native file | Original generated file | Prompt |
|---|---|---|---|
| Bar tiki | `tiki_bar_front-native.png` | `/workspace/scratch/85111d38430a/generated_images/exec-837a9e8a-d141-46ee-8b4f-8b50c1a10a50.png` | `tiki_bar_front.prompt.txt` |
| Tall squared mural tiki | `tiki_mural_front-native.png` | `/workspace/scratch/85111d38430a/generated_images/exec-e6da343b-4269-4793-b61c-f7cb1fe3757f.png` | `tiki_mural_front_final.prompt.txt` |
| Weathered carved wood | `carved_weathered_wood-native.png` | `/workspace/scratch/85111d38430a/generated_images/exec-b82b12a8-3d28-492a-92ad-f755512dd9f1.png` | `carved_weathered_wood_final.prompt.txt` |

Both selected tiki originals are 1024×1536 RGBA and contain genuine transparency; their background alpha reaches zero. The wood original is 1254×1254 RGB.

The bar reference was `/workspace/scratch/85111d38430a/upload/QQ20261004-202218(1).png`. The tall tiki reference was `/workspace/scratch/85111d38430a/upload/QQ20261004-210209.png`. Both were visually inspected before generating. Generation requests used `transparent_background=true` for totems and `false` for wood.

## Refinement history

The first tall variant had a slight oblique facial read. Its original is retained as `tiki_mural_front-v1-native.png` (generated file `exec-97d1fbbf-f09c-4e0a-b568-b5b78a6ec786.png`). A single edit corrected the viewing angle to a centered symmetrical front elevation while preserving the shape and brown wood. The first wood tile looked like flaking bark; the selected refinement explicitly uses carved exposed interior wood without bark. Its earlier prompt is retained in `carved_weathered_wood.prompt.txt`; earlier generated file was `exec-025f45ff-d7b7-4d8e-8ba0-b08151b16126.png`.

## Runtime conversion

`derive_surface_maps.py` performs only crop, resize, alpha-preserving format conversion, and derived numerical surface-map estimation. Native image contents are untouched.

Per the final runtime instruction, each front is cropped to the body alpha>16 bounding box, padded by 2% in each direction, and resized proportionally to a maximum dimension of 1024. This produces `tiki_bar_front1024.png` (260×1024) and `tiki_mural_front1024.png` (191×1024), with only narrow transparent margins. `carved_weathered_wood1024.png` is 1024×1024.

Each selected asset has `*_normal512.png`, `*_roughness512.png`, and `*_height512.png` numerical maps, all 512×512. These share the normalized UV domain of the cropped front, including padding; square map dimensions do not alter UV alignment. Normals use the OpenGL tangent-space convention (+Y green). Height is an estimated grayscale relief derived from diffuse luminance, with dark grooves treated as depressions and pale worn edges as raised details. These maps support carved surface detail; they are not measured geometry and should not replace the sculpted mesh. Roughness spans 0.82–0.95.

## Mesh guidance

`sculpture_asset_metadata.json` records exact native and runtime body bounding boxes, aspect ratios, visually estimated facial/body landmark y positions, and feature y ranges. Image y increases downward; normalized mesh y upward is `1-y`. The bar body width/height is 385/1517; the tall corrected body width/height is 279/1503. Keep real carved geometry for brows, eye recesses, nose, mouth rims/teeth, hands and belly rather than displaying these fronts as flat billboards.
