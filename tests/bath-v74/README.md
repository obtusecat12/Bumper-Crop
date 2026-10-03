# V74 resident and bath loading verification

The four indoor portraits and lounge screenshots render production bath geometry/materials in Chrome WebGL2 with SwiftShader. `full-game-*.png` use the actual game, its existing F2 teleport UI, original ground, weather and post-processing. `homeless.png`, `wallman.png` and `wall-contact.png` are isolated production alley-model contact inspections with neutral lighting, not full-game captures. Software results are not hardware gameplay FPS.

- `entry-check.mjs`: actual entry/exit functions under async/failure stubs, exact BigInt street-pose restoration, cached room and monotonic progress.
- `rig-check.mjs`: all six real SkinnedMeshes, budgets, weights, discrete clips, independent blinks, 30 seconds of animation evaluation, no per-tick texture uploads, long-delta guard and disposal.
- `model-check.mjs`: complete bath build, generated texture channels, mirror separation, preserved four area lights and new actor budgets.
- `browser-actors-check.js`: real 30-second six-actor GPU run, memory/program stability, sampler budget and disposal; executes in the local bath preview.
- `mirror-browser-check.js`: actual oblique mirror consecutive-frame camera/image change, off-screen culling, no global clipping, no new first-doorway shaders.

The load repair removes the two initial screen-target full-scene compiles, prepares final static PMREM probes before PBR compilation, compiles/uploads original renderables under a small HDR target between paints, staggers existing shadows and warms each real pipeline. Static reflection probes preserve source geometry and diffuse art but use approximate capture lighting; visible scene lighting/materials remain unchanged.
