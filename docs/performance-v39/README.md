# V39 — static cereal chunks and photographic verge plants

## What changed

- Wheat and barley use distinct 256 × 512 alpha textures on two crossed quads: **4 triangles per clump**. Cut stubble retains short broken stems on the same four-triangle geometry.
- Per-clump yaw (0–360°), height (signed 5–15%), lean (3–8°), and small colour changes are baked once. Upward, rounded normals and a 52% root darkening gradient soften card lighting. Wind runs in the vertex shader.
- Roadside and bank plants share a six-species atlas: tufted grass, tall grass, dry grass, foxtail, fern and mixed grass. Their original road/shore exclusion masks are retained.
- A dedicated worker builds 40 m cereal chunks. Nine neighboring chunks are considered; at most 25 are cached. Immutable root and index textures store precomputed 4 m observer-cell selections. Runtime changes only the selected index offset, instance count and chunk visibility/position. No per-frame plant scan, matrix rewrite, buffer repacking or instance upload remains.
- A 3 × 3 set of 40 m chunks alone does **not** enforce a 35 m circle. Conservative precomputed selections account for observer-cell corners, card width, lean and wind. Distance alpha fading is only a visual transition; physical submission is independently bounded.
- Four triangles × 30,000–50,000 instances would be 120,000–200,000 triangles. Therefore the requested 100,000 cereal-triangle ceiling requires at most **25,000 crossed clumps**. Current density stays substantially below that ceiling; each photographic clump depicts several ears.
- Far crops use the existing terrain crop masks with animated colour/noise waves. Terrain tessellation now uses 0.5 / 1 / 2 m road detail and shared 0.5 m tile seams, retaining the authoritative height and rut functions.
- Tree/shrub leaves, wood and architecture use immutable geometry/index LODs. Shadows have separate precomputed detail ranges. Objects beyond fully opaque fog are culled.
- A render-batch budget counts main and both shadow passes, targets 235,000 triangles, and reserves 15,000 for other effects. It lowers existing distant LOD ranges when needed. It is not a device FPS guarantee or proof for every possible infinite-world view.
- Buildings, compounds, field partitioning, roads, lake boundaries and the spawn location were not regenerated with new spatial rules.

## Verification

Seed: `CHLORINE / ABUNDANCE / 10`. Baseline: `c6427f14b5a8052fc3e8bc1dd0bfcd52ef6974e3` (V38). Balanced quality, 49 loaded world tiles, camera `(0.6, 1.77, 52)`, 72° vertical FOV, 4:3 aspect. V38 uses its original 480 m far plane; V39 uses the 228 m fog-limited far plane.

| View yaw | V38 main triangles | V39 main triangles | V39 main + refreshed shadows | V39 main draws |
| --- | ---: | ---: | ---: | ---: |
| -0.37 | 3,034,491 | 172,668 | 233,915 | 102 |
| 0.90 | 3,219,491 | 141,790 | 199,679 | 72 |
| 2.10 | 2,611,272 | 118,287 | 163,754 | 69 |
| 3.40 | 2,259,032 | 145,113 | 191,078 | 65 |

These are counts from actual scene geometries, draw ranges, instance counts and camera/shadow frustums. They exclude the post-processing, sky and transient effect reserve. Main draws are **not below 60**; retaining spatial culling increases batch count compared with the former world-wide merged meshes. Shadow refresh frames contain additional draws.

Static contract checks traverse eight poses including 40 m boundaries, negative coordinates and 64 m origin rebasing:

- Maximum conservative submitted cereal radius: **34.9585 m**.
- Maximum submitted cereal triangles in those poses: **46,284**.
- Matrix and colour array hashes and buffer versions remain identical.
- Root/index texture versions remain identical.
- Absolute world positions match across rebasing.
- Height, crop and road exclusion samples in four fields match the V38 hashes.

Node CPU microbenchmarks on this host:

- Cereal selection update: median **0.0028 ms**, p95 **0.0418 ms**, versus V38 **2.17 / 6.52 ms**.
- Render-batch budget check: median **0.217 ms**, p95 **0.332 ms**.
- Cold construction of 49 terrain/prop tiles: **39.5 s** versus **70.0 s**; this is not browser loading time.

These timings are individual functions, not full-frame CPU timing. The in-game performance display now separates simulation from submission time so device testing can identify remaining costs.

## Rendering checks and limits

The provided browser disables WebGL. Real game shaders and geometry were instead compiled/drawn in Mesa GLES 3.2 llvmpipe:

- All 11 shader variants in the actual worker-packet → fog → material finish → CSM → GI chain linked successfully.
- Spawn, close wheat, barley and lakeside scene exports rendered without GL errors.
- Included images use diagnostic lighting, without the game's full sky, water or post-processing pipeline. They are geometry/texture checks, not exact production screenshots.

**Hardware GPU time, full game CPU < 3 ms and stable 60 FPS remain unverified.** Draw call < 60 is not achieved by this version. No numeric claim here should be interpreted as meeting those targets.

## Reproduction

The scripts use the same installed Node canvas and native GLES helpers as earlier project audits.

```sh
node scripts/check.mjs
node tests/performance-v39/static-contracts.mjs
node tests/performance-v39/scene-audit.mjs "$PWD/dist" /tmp/v39-view.json
node tests/performance-v39/full-chain.mjs /tmp/v39-full-chain.json
node tests/performance-v39/native-export.mjs /tmp/v39-native
python tests/performance-v39/native-render.py /tmp/v39-native/wheat-close
```

`baseline-audit.mjs` must be run against an untouched V38 `dist` directory. The small `v38-world-hashes.json` fixture allows the placement-mask regression check without that checkout. Full temporary scene exports are not part of the deployment.
