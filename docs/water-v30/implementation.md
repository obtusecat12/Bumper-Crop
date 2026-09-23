# V30 — lake underside, sediment, and impact-crown repair

The user's underwater screenshot shows two real V29 defects. The water's underside reflected the vertically inverted screen color when a screen-space ray missed the lakebed, projecting large dark sky patches across the ceiling. The lakebed ground shader then replaced its existing soil image with a nearly uniform silt color. V29's published native frames showed both defects, and the 2-second, opaque dithered impact sheet looked like a white bowl.

## Changes

- Water-to-air rays inside Snell's window now sample the cached sky by their **refracted world direction** while preserving rendered above-surface geometry from the immutable scene capture. Total internal reflection points downward to the bed. A single projected geometry probe samples the real rendered bed when available; the shared world-anchored soil texture is the off-screen fallback. The inverted-screen sky fallback and the 10-step reflection march have been removed.
- Far-plane `depth=1` is classified as sky, not 180 metres of sediment. The full-screen absorption retains the existing Beer–Lambert coefficients, caps background water path, and has a world-anchored silt fallback only when a genuinely downward underwater ray is missing geometry. Normal rendered ground and actual depth remain authoritative.
- The existing 512×512 brown soil albedo and computed grain are retained on the lakebed. The shoreline blends and bottom height field are unchanged. The terrain's existing clods/specks add gravel contrast without more ground samplers or noise passes. The indirect-light CPU mean uses the same base albedo.
- A raised, irregular, mostly optically empty crown forms and breaks in 0.64 seconds. A central jet follows; 200/240 instanced GPU-ballistic fragments and existing ripples complete the event. Most fragments have bead-sized visible silhouettes within the required .3–.6 m quads; a few are stretched ligaments. GPU droplets disappear once they re-enter water, so they no longer hang as bright streaks beneath the lake. Bayer coverage stays, with per-fragment phase to soften regular checker patterns after VHS processing.
- The existing half-resolution fused lens/volume/DOF stage, 720p internal render, ntsc-rs VHS stage, world seed, lake shape, shore collision and pass order remain intact. Existing soil data is reused on the water underside rather than uploaded as a second texture.

## Verification

- `node scripts/check.mjs` and `node tests/water-v30/run.mjs` validate module loading, body/water contact, 240 GPU instances, 2-second event buffer, weather/lens priorities, old world placement and camera integration. The old V28 ground-file hash changes intentionally because the lakebed had to retain its textured albedo.
- `V28_FIXTURE_DIR=/tmp/level10-v30 node tests/water-v29/export-fixtures.mjs && python tests/water-v30/native/render_views.py` compiles/renders the current lake/splash/sky/fused programs in Mesa GLES3 and writes source color plus color/depth after water at shallow, deep, upward, split-level and time-separated splash poses. Central deep view contains real geometry at about 10 m; upward sky view has no opaque terrain until the water surface. The stage frames make that distinction inspectable.
- `node tests/water-v30/native/render_vhs.mjs` passes the native final diagnostic frames through the site's actual ntsc-rs WASM. Inspect [underwater upward](under-window-vhs.png), [deep bed](under-bed-vhs.png), [splash at 0.16 s](splash-above-0.16-vhs.png), and [splash at 0.40 s](splash-above-0.4-vhs.png). The old inverted dark clouds and the stationary white crown bowl are absent. Individual Bayer droplets are still stylized and not equivalent to filmed fluid.

This is a native-rendered controlled terrain fixture with real lake/sky/water/splash shaders and genuine ntsc-rs processing. It is **not** an end-to-end Safari run with full vegetation, UI, actual handheld motion and weather. FPS and final appearance on the user's iPhone are unmeasured.

## References

- [MIT high-speed water impact photographs and mechanics](https://meche.mit.edu/news-media/high-speed-videos-show-what-happens-when-droplet-splashes-pool)
- [Ikelite Snell-window underwater photographs](https://ikelite.smugmug.com/Underwater-Techniques/Snells-Window)
- [PBRT volume transmittance](https://pbr-book.org/4ed/Volume_Scattering/Transmittance)
- [NVIDIA GPU Gems — filtered dynamic normals and depth-dependent water appearance](https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-1-effective-water-simulation-physical-models)
