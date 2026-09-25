# V43 — road clearance, intact props, distant canopy and cellular overcast

## Corrections

- Fence posts, rails and braces now sample the full span against the shared road/driveway distance field. A 2.85 m normalized road clearance opens a real passage in both geometry and collision. The arrival fence at x=54 previously intersected the road around z=0; the native fence image shows that opening. Stable random draws keep all other damaged spans deterministic across chunk ownership and LOD.
- V42's static LOD dropped triangles whose quantized vertices coincided but left neighbouring vertices at their original positions. That opened holes in closed sacks and boxes. V43 welds identical complete vertex records, then builds actual coherent vertex-cluster geometry and immutable index ranges. Adjacent faces meet at identical cluster positions. Full authored geometry is retained within 32 m of the world-space mesh bounds, including under budget pressure. UV and material seams remain independent. Medium/far ranges share one representation rather than duplicating almost-identical buffers. Shadows use a separate closed coarse range. Worker packet round trips retain these ranges.
- Budget accounting no longer charges cached shadow geometry on frames without a shadow refresh. Near meshes are not degraded to meet a budget; an overage is reported rather than silently breaking props.
- The far crop material reaches full canopy coverage between 15 and 25 m, before physical cards fade at 25–27 m. Previously it only completed at 33 m, exposing a brown annulus. Filtered seed-head flecks, gold/ochre maturity patches, and waves replace distant bare soil only on standing-crop parcels. Roads, shores, grasslands, yards and harvested stubble retain their masks. This is a terrain shading fallback, not distant 3D stalk geometry or a raised canopy mesh.
- Dense V41 crop placement is retained: about 95% multi-ear tufts, unchanged maturity/tilt/height variation, static GPU buffers, true physical 35 m cap. The regression sweep observed maximum card extent 34.977 m and 57,212 cereal triangles. There are no per-frame instance-matrix writes.
- Generated terrain/model caches and every ESM dependency use V43, preventing stale V40 mesh packets from surviving the release.

## Clouds and cost

The world ray is intersected with the **1500 m** plane using `max(direction.y, .04)` and the actual camera position. No polar/spherical UVs are used for normal overcast. Explicit inverted 2D Worley at 0.0008 world scale constrains the kilometre-sized cells; four actual 3D value-noise octaves, two domain warps and the shared 3D Worley volume break up the interiors. A bounded 1080–1800 m thickness profile gives lower-hanging rounded bellies. Six/eight/ten view samples integrate Beer–Lambert extinction, vertical optical depth and a powder/multiple-scattering approximation. The requested dark and light RGB endpoints are converted to linear light. A continuous 3000 m deck and faster 400 m scud retain separate winds and parallax. This remains an efficient procedural cloud approximation, not a meteorological simulation.

The cloud density pass runs at half width and height, capped at 640 pixels wide. A full-resolution depth-tested sky composite retains foreground silhouettes and applies the original volumetric fog at the correct viewport. The current projection/camera are used every frame, including zoom; there is no lagging temporal sky cache. The water cube environment evaluates the raw world-space sky. Sharp anomalous sky events bypass the reduced-resolution pass. Render targets and shader resources are disposed, and feedback-loop tests cover repeated draws and reflections.

`cloud-budget.json` compares full and half-resolution rendering of the same shader in Mesa llvmpipe: average channel error is approximately 0.28/255, with software timings of approximately 141 ms and 41 ms. These timings measure the diagnostic sky/resolve workload, **not the user's GPU, browser frame rate, or complete game**. The full scene still contains terrain, props, shadows, MSAA, water, foliage overdraw and postprocessing; no 60 FPS guarantee is made.

## Validation and limitations

- `visibility-checks.json`: ten closed geometry ranges, unchanged near vertices, near geometry under forced budget pressure, packet roundtrip, fifteen fence/LOD cases, 4,344 collision samples and 4,968 rendered vertices clear of roads.
- `cereal-checks.json`: eight camera/origin cases, zero matrix/color/texture uploads, deterministic rebasing, crop density/height/lean preserved.
- `cloud-cache-checks.json`: resolution cap, zoom/current-view propagation, raw sky reflections, no framebuffer feedback, event bypass and disposal.
- `render-checks.json`: native GLES renders without errors; wide-angle distant image stays sharp; telephoto remains functional; origin wrapping changes no cloud structure.
- Actual game geometry is rendered in the attached images. The fence/yard captures show the fixed passage and complete crate, sack and straw bale. Ground lighting is diagnostic, without the game's complete browser CSM/GI state. The yard capture is a reframe of the exported near farm geometry.
- `lod-benchmark.json` records the tradeoff on one detailed farm batch: persistent geometry storage is lower than V42, but coherent LOD baking takes longer in the worker than the invalid triangle-deletion shortcut. It is a one-time generation cost, not frame-loop work. No shorter initial load time is claimed.
- `scene-budget.json` audits a 49-tile scene at four headings. Main and shadow counts are separate; weather, sky, water and postpasses add their own small budgets. This is a sampled audit, not a proof of a universal whole-world 250k hard cap.
- Browser WebGL is unavailable in this execution environment; evidence uses native GLES 3.2 / Mesa llvmpipe. Hardware FPS and an interactive browser walking test remain unmeasured.

## Reproduce

```sh
node scripts/check.mjs
node tests/visibility-cloud-v43/check.mjs
node tests/visibility-cloud-v43/static-contracts.mjs
node tests/visibility-cloud-v43/cloud-cache.mjs
node tests/visibility-cloud-v43/full-chain.mjs /tmp/v43-fullchain.json
python3 tests/water-v28/native/gl_native.py /tmp/v43-fullchain.json
node tests/visibility-cloud-v43/export.mjs /tmp/v43-sky
python3 tests/visibility-cloud-v43/render.py /tmp/v43-sky
node tests/visibility-cloud-v43/scene-audit.mjs "$PWD/dist" /tmp/v43-budget.json
node tests/visibility-cloud-v43/native-export.mjs /tmp/v43-fixes
python3 tests/visibility-cloud-v43/scene-render.py /tmp/v43-fixes/fence-gate /tmp/v43-sky
```
