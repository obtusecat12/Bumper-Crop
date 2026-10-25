# Stage 1 dynamic flashlight checkpoint — 2026-10-25

Status: source draft; NOT integrated into `dist`. Stage 1 is not complete.

Base main: `14aa26e82bd54843a8155fa1fd9c9e20bd3aa3de`.
The patch is a minimal diff against that commit, not a replacement checkout. Preserve newer changes with a three-way merge.

Implemented draft:
- A single 1024², 34 m dynamic SpotLight shadow, refreshed only while the flashlight is on; no player light enters a static bake.
- Level 1 hall/floor/custom loot shader reads the same packed depth map with a 3×3 comparison filter. Opaque hall geometry, corridor walls/furniture and moving crate/door parts cast shadows.
- Softer hotspot and distance falloff; disable the old additive cone because it has no wall occlusion.
- Keep Level 1 flashlight coordinates logical before the existing floating-origin render hook; bind the depth map after the shadow pass.

Validation so far: JavaScript syntax checks on the five changed files passed. No WebGL shader compile, movement sequence or in-game flashlight views have been observed. The unchanged baseline game cannot create WebGL 2 in this preview browser. `webgl2-blocked.jpg` is the failure page, NOT a game screenshot.

Next concrete action: in a WebGL 2-capable preview, reconcile latest main, then `git apply --3way art-source/alpha150/checkpoints/2026-10-25-stage1/dynamic-flashlight.patch` and perform only the affected checks. Check Level 0 wall/doorway and Level 1 column/wall with the torch on/off; include one Level 1 pose beyond its 1600 m origin boundary, and one corridor/crate occluder. Save two in-game views and a short sprint/jump/sneak operation record before marking stage 1 complete.

Remaining source review: actual Level 1 doorway/sector head clearance, browser Ctrl movement defaults, and combined C+Ctrl speed priority. Rendering acceptance remains mandatory; do not apply the patch blindly to public runtime.
