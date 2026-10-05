# Level 0 furniture and texture budget — V93

Based on V92 / fd3e306c5f843d9a464f45c9897c7c529f4f44ce. Root authored all modeling, integration, compression and capture code. Image agents only supplied eight independent generated originals.

## Art and geometry

- Mahogany, bookmatched walnut and ebonized wood have independent generated grain maps, estimated micro normals and roughness. Joinery includes real inset frame panels, raised centres, cornice steps, shaped plinths, drawer gaps, hinges, key escutcheons and brass bail pulls. Ebony tall cases have an eight-drawer lower structure.
- Oxblood Chesterfield sofa: closed back shell, separately indented diamond tuft surface, physical buttons, shaped scroll arms, welted front caps, nailhead trim, three piped cushions, rail and turned feet. Tobacco leather club chairs and a carved blackwood damask settee add distinct silhouettes and finishes.
- Wood UV direction follows rails versus stiles; upholstery uses metre-scale mapping. Carved molding is a generated relief strip on actual trim thickness. Fine wear is texture data, not thousands of separate meshes.
- Furniture mountain now has a measurable load path: two 1.12m cabinets -> 46mm board -> sofa feet. CRT stands on a real side table. Loose chair lies on its side. Authored abnormal-width/height and wall-embedded props remain intentional; ordinary furniture is grounded.
- Existing random placement seed/reservations are preserved, with four additional finish/silhouette choices. Manila geometry/materials/cameras, all maps, breakers, F2 destinations and other levels are preserved.

## Runtime budget

Runtime directory, before ZIP packaging: **254.085 MiB -> 219.323 MiB**, including new art and models. Existing texture encodings saved **36.480 MiB**; replaced furniture maps removed another **1.626 MiB**; the 24 new runtime maps total **3.337 MiB**. Full original images/prompts stay outside the runtime folder.

`art-source/texture-optimization-v93` records every changed file, original hash, size and method. Large ordinary diffuse textures are conservatively resampled/re-encoded; text atlases, labels and small nearest-filter faces retain dimensions. Manila and the two shared Manila wood maps retain decoded pixels. Data maps in the first pass are lossless. Verified Tiki Standard/Physical data consumers then use lossless channel repacking: roughness G, metallic B, AO/height R, normals RGB. Every consumed decoded sample is asserted equal, without dimensional or normal quantization changes. V77 loader and V78 manifest point to the lossless WebP files. Replaced sofa maps are not preloaded or generated any more.

File compression is not proof of reduced simultaneous VRAM or faster hardware FPS. The manifest's all-library mip estimate is explicitly not a resident VRAM measurement.

## Focused local visual review

Actual Chrome 154 / SwiftShader WebGL2 loads checkout files using the local asset route. No broad test suite was run. Captures include sofa close-up, cabinet joinery, settee, complete furniture cluster, stable pile, cabinet aisle, protected Manila interior and Tiki pouring scene after texture repack. No missing texture/shader/page errors in these captures. Furniture views use at most six active samplers. Pile camera is 206 draws / approximately 1.75M triangles including the entire streamed architecture, compared with 188 / 1.65M before; this is not a hardware FPS measurement.

First review revealed obscured upper tufting, stretched cloth UVs, missing settee rear posts and a poorly supported overturned chair. All four were corrected and re-captured. No scene-wide lighting change was used to hide model defects.

## Research sources

- https://threejs.org/manual/pages/textures.html — file dimensions and GPU memory.
- https://threejs.org/docs/pages/KTX2Loader.html — assessed compressed GPU texture path; avoided an unneeded game-wide loader migration.
- Baker Tribute Chesterfield and Ming Cabinet product photographs — rolled-arm silhouette, short feet, real framed cabinet joinery. Generated originals are new materials, not extracted product photographs.
- `art-source/level0-furniture93/*/provenance.json` and prompt files record generated art. Normal/roughness derivatives are estimates, not measured scans.
