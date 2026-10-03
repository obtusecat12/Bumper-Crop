# V73 reception / mirror verification

## Implemented
- Original enlarged V72 room plan retained. Three chairs replaced with a green tufted Chesterfield and a complete Persian rug / walnut table grouping. One chair, newspaper rack, original counter, dispenser, telephone, books, planter and key cabinet retained.
- Four modeled brass/frosted-glass sconces, bounded 2450 K practical colors and decay 2; a physical Tiffany pendant with a closed supporting crown, warm point and broad area diffusion; banker lamp with a focused register light, real plug and cable.
- Magazine covers, generated ashtray contents, open guest ledger, service bell, grounded walnut pigeonhole cabinet and Roman urn / drooping fern.
- Two upper locker doors physically swung open. VELORA soap, striped hanging shirt on a hooked wooden hanger, and worn plated digital watch. Original fixture/bench/vanity/mirror details retained; changing-room illumination increased modestly.
- 13 image-generation calls; 43 new runtime maps/artwork. Source, prompts and extraction provenance are in art-source/bath-v73.

## Stutter and mirror findings
The V72 mirror refreshed at 6.25 Hz regardless of display camera updates. Its first capture was deferred until the player reached the changing-room doorway. That capture enabled global renderer.clippingPlanes and drew the entire bath, causing 33 additional shader programs in the measured first doorway frame. Many textures and the reflection target were not pre-uploaded for that first view.

V73 uses the official Three.js r180 Reflector virtual camera and oblique clip projection, retaining the hand-wiped condensation material. It does not alter global clipping planes. A 512 x 256 single-sample target updates every visible display frame; frustum/back-side gating stops unnecessary captures. Separate spatial/material batches restrict the reflection to lobby/changing-room geometry plus the moving fan. Every source castShadow flag survives batching, so frosted diffusers and paper/decal surfaces no longer become opaque shadow blockers. The sconce shadow near plane excludes its own approximate dual-bulb fixture, avoiding magnified near-source self-shadow silhouettes while retaining furniture shadows.

A sampled final shader audit identified 18 fragment samplers in the full mirror material, above the WebGL2 minimum of 16. The low-power pool approach fill and one additional sconce keep their illumination but no longer allocate independent shadow maps, reducing the maximum to 16 and removing two redundant cube-shadow calculations. Main reception, changing room, pool, shower, spa and banker-lamp shadows remain.

warmBath73 uploads material textures in yielded groups, compiles and renders changing-room, shower and spa viewpoints while the DOM photo transition is visible, and caches the completed warmup. It does not impose a gameplay frame-rate cap.

Primary references:
- https://threejs.org/docs/pages/Reflector.html
- https://threejs.org/docs/pages/WebGLRenderer.html
- https://threejs.org/docs/pages/PointLight.html
- Vendored r180 code provenance: dist/licenses/Reflector-PROVENANCE.json

## Verification
- layout-check.mjs: 1136 walk samples cover entry, changing room, original pool, shower route, spa route and counter service aisle; furniture collision and floor continuity asserted.
- entry-check.mjs: executes production entry/exit functions with state/GPU stubs. Checks overlay-first order, monotonic progress, GPU-warm-before-unmask, duplicate-entry guard, cached re-entry, exact BigInt street-pose restoration and safe texture/compile failure handling.
- model-check.mjs: production generator with decoded generated assets; validates finite geometry, all new Standard materials carry normals, 43 new + 43 changing-room maps, independent mirror, light rig and bounded mirror target. Build milliseconds are CPU model-generation diagnostics only.
- mirror-browser-check.js: actual software WebGL, first-doorway shader delta, two consecutive 16 ms camera poses with different reflection-target pixel hashes, and no capture when looking away. See results/mirror-performance.json.
- preview.html: actual production scene and indoor post effects, without the main game HUD / display filter. Manual view changes render controlled frames to avoid continuous software-GPU load. Screenshots are real Chrome / ANGLE SwiftShader WebGL2 captures, not generated render previews.

No hardware gameplay FPS was measured. The software browser lacks KHR_parallel_shader_compile and exercises the synchronous fallback under the loading album. No JavaScript or WebGL shader errors were observed.
