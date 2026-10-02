# Spa NPC assets v67

Custom authored, faceted adult male characters in meters, +Y up, +Z facing forward.

- `spa-man-a.glb`: seated bather, pelvis at y=0.50; head top 1.383 m; relaxed asymmetric hands near/below water y=0.86. 1,674 triangles.
- `spa-man-b.glb`: standing bather leaning toward a low basin, head top 1.635 m, left-palm contact `[-0.37, 0.737, 0.19]`. Nearest actual palm surface is 1.66 mm from that target. 1,642 triangles.

Each export has 20 skin joints, normalized four-component skin weights, explicit flat normals, three material primitives and three morph targets (blink, left finger curl, right finger curl). Materials are `KHR_materials_unlit` with embedded PNG diffuse maps and nearest sampling. No subdivision, smoothing, external textures, normal maps, metalness maps or specular materials are used. Positions meet at shared shoulder branch boundaries; flat shading duplicates render vertices solely for per-face normals.

Each GLB includes a 12-second idle clip sampled at 20 Hz with STEP interpolation. It combines a tiny pelvis shift, breathing, a slow head glance, finger curl and three short eye blinks. Both feet are pinned. The standing left arm is pinned independently of torso movement to preserve the bowl contact. Root/runtime can also quantize `AnimationMixer.setTime` to 20 Hz.

Three.js GLTFLoader sanitizes periods in bone names: `hand.L` becomes `handL`, `foot.L` becomes `footL`, etc. Use `SkeletonUtils.clone` for independent character instances.

## Build and verification

```sh
python art-source/npc-v67/build_npcs.py --textures art-source/npc-v67/runtime --out dist/models/spring-v67
```

`--draft` explicitly uses separate draft textures for preview only. Final files here were built without that option from the generated runtime PNGs.

`model-contact-sheet.png` is an actual triangle-rasterized rendering of these authored surfaces and final maps, with front, three-quarter, profile and face views. `a-blink.png` and `b-blink.png` show closed lids. The rasterizer uses a restrained half-Lambert preview multiplier; exported materials remain unlit.

`validation.json` contains bind bounds, all-frame animation bounds, support/contact measurements, bone origins, weight checks and triangle counts. `loader-validation.json` records successful import with the project's official Three.js r180 GLTFLoader, actual PNG decoding, live skin and morph checks, held interpolation and a full sampled clip support sweep (maximum floating-point support drift under 0.000000043 m).

Generated diffuse provenance is maintained by the texture task in `provenance.json`. Geometry and build source are newly authored for this task. No Site files were modified by this asset task.
