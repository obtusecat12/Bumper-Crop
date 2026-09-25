# V38 performance changes and verification

V37 baseline: `bbbaa75b632b00176747a6d923099f080aa00e4a`. Same seed, procedural layout, quality and near-field geometry. No subagents used for V38.

## Changes

- Real cereal instances are copied into camera-local pools only within 45 m. Whole distant tiles generate zero cereal geometry. The existing close grain radii remain 8/11/14 m; the original transforms and colours are preserved. Far crop colour and a small animated normal perturbation now live on the ground, respecting roads, yards, grass and shore masks.
- Similar leaf templates share instanced pools, with their exact original vertices, wind phases and colours fetched by variant. Trunks, branches and stems are merged. Grass, gravel, bottles, wires and architecture share resident batches. Main-view instance culling retains off-screen shadow casters using the same visible-prefix/full-buffer layout.
- `BufferGeometryUtils.mergeGeometries` merges opaque architecture with per-face material attributes and native-resolution texture arrays. No material groups or one-draw-per-colour split. Water, glass, animated doors and interactive metadata remain separate where needed. Doors are consolidated within their moving hinges; bottle pickup refreshes its batch.
- Immutable lake keys and field contexts are reused. Shore-distance-only queries avoid unrelated habitat samples. Terrain vertex road queries are shared. Best-effort IndexedDB caches deterministic field, ground and grain data; 64 entries maximum, isolated by release. Storage failure falls back to generation.
- Existing worker-based irradiance probes have a 24,000-ray credit cap per animation frame and a 2 ms soft scheduling slice. Ray counts include refinement, secondary visibility and relocation. Probe sampling and cached lighting results stay unchanged. The slice is checked between probes, not a hard CPU/GPU deadline.
- Roads remain part of the actual sculpted terrain surface, avoiding a second coplanar road overlay. The raised crop canopy is removed. Camera near plane is 0.08 m instead of 0.01 m to improve depth precision.

## Measurements

Node CPU generation tests and actual Three.js frustum/instance submissions, not browser FPS. 49 resident tiles, balanced quality, camera `(0.6, 1.77, 52)`, FOV 72°, aspect 4:3. Values include terrain and all visible scene objects, but exclude shadow, water and post-processing passes. They do **not** establish a universal full-frame <60 draw-call guarantee.

| Camera yaw | V37 scene draws | V38 scene draws | V37 submitted triangles | V38 submitted triangles |
|---|---:|---:|---:|---:|
| -0.37 | 362 | 53 | 3,525,942 | 3,034,491 |
| 0.90 | 272 | 58 | 3,402,241 | 3,219,491 |
| 2.10 | 222 | 53 | 2,678,532 | 2,611,272 |
| 3.40 | 213 | 43 | 2,603,749 | 2,259,032 |

Cold spawn tile CPU generation: 15,450 → 10,217 ms; ground stage 6,629 → 3,377 ms. These exclude network, browser shader compilation and later stream readiness. The 49-tile CPU audit took about 116 → 70 seconds; runtime variance and template warm-up apply. Returning visits can reuse persisted data; no end-to-end browser warm-load time is claimed.

At the audited spawn view: 7,469 local cereal cards, 2,377 detailed stems, four cereal draws; farthest submitted root 44.9982 m. Walking-update CPU median 1.78 ms, P95 3.32 ms in this harness. Resident batching reduced 389 source submissions to 35 pools before view culling. Padded foliage variants contain degenerate triangles; submitted triangle counts include them.

## Checks and limits

- 9,600 terrain/road/shore/crop samples against V37: heights identical; road and shore differences only floating-point roundoff below 1e-14. Tree, shrub and compound descriptors identical. All 24,345 spawn-tile detailed wheat transforms and colours identical.
- Cached/restored terrain attributes and index arrays identical. Worker packet roundtrip retains all architecture texture arrays and per-face material data.
- Actual browser IndexedDB: read/write, 64-entry eviction and BigInt/Float32Array persistence after page reload passed.
- Batch lifecycle: visible instance selection, off-screen shadows, floating-origin rebase, bottle pickup and chunk unload passed.
- Actual GI worker pause/resume and cache test: all 2,527 empty-scene probe outputs exactly match V37. Repeat volume reused all probes with zero rays. Measured peak 7,072 rays; worst-case reservation test remains below 24,000. This is not an occluded-scene quality benchmark.
- Native GLES 3.2 Mesa llvmpipe: 14 complete fog/finish/CSM/GI/batching/depth shader programs linked. Separate generated-scene render linked 15 programs and completed with zero GL errors. Included PNGs show the actual generated location with diagnostic lighting, not production lighting or a browser capture.
- The managed browser could not create a WebGL2 context. Physical-GPU frame time, 60 FPS, the requested 3.5 ms GI ceiling, full-frame draw count and interactive road-flicker inspection are **not verified**. The on-screen performance meter still reports real renderer totals, including extra passes; it was not changed to hide them.

## Reproduction

Extract the baseline `dist/` from the commit above into a temporary directory. Canvas-dependent harnesses use the installed `@napi-rs/canvas` runtime.

```sh
node scripts/check.mjs
node tests/performance-v38/benchmark.mjs /absolute/path/to/dist
node tests/performance-v38/view-audit.mjs /absolute/path/to/dist /tmp/view.json
node tests/performance-v38/regression.mjs /tmp/v38-baseline/dist /tmp/regression.json
node tests/performance-v38/batch-lifecycle.mjs
node tests/performance-v38/probe-worker.mjs /tmp/v38-baseline/dist
node tests/performance-v38/full-chain.mjs /tmp/full-chain.json
python tests/water-v28/native/gl_native.py /tmp/full-chain.json
node tests/performance-v38/native-export.mjs /tmp/v38-native /absolute/path/to/dist
python tests/performance-v38/native-render.py /tmp/v38-native/single
```

`cache-check.html` is a temporary preview-only fixture; copy it to the preview root, run its visible button, reload and run again, then remove it before publishing.

## Primary references

- [Three.js InstancedMesh](https://threejs.org/docs/pages/InstancedMesh.html)
- [Three.js BufferGeometryUtils](https://threejs.org/docs/pages/BufferGeometryUtils.html), vendored from the matching r180 release.
- [Three.js BufferAttribute update ranges](https://threejs.org/docs/pages/BufferAttribute.html)
- [NVIDIA: Dynamic Diffuse Global Illumination with Ray-Traced Irradiance Fields](https://research.nvidia.com/publication/2019-05_dynamic-diffuse-global-illumination-ray-traced-irradiance-fields)

The screenshot's screen-space quarter-resolution checkerboard pipeline is not the architecture used here. Adding it would change lighting and add render targets/passes. This update budgets the existing world-space irradiance cache instead.
