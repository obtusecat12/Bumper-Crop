# Stage 1 dynamic flashlight checkpoint — 2026-10-25

Status: source draft; NOT integrated into `dist`. Stage 1 is not complete.

Base main: `14aa26e82bd54843a8155fa1fd9c9e20bd3aa3de`.
The patch is a minimal diff against that commit, not a replacement checkout. Preserve newer changes with a three-way merge.

Implemented draft:
- A single 1024², 34 m dynamic SpotLight shadow, refreshed only while the flashlight is on; no player light enters a static bake.
- Level 1 hall/floor/custom loot shader reads the same packed depth map with a 3×3 comparison filter. Opaque hall geometry, corridor walls/furniture and moving crate/door parts cast shadows.
- Softer hotspot and distance falloff; disable the old additive cone because it has no wall occlusion.
- Keep Level 1 flashlight coordinates logical before the existing floating-origin render hook; bind the depth map after the shadow pass.
- Honor existing scene shadow refresh requests. For a flashlight-only pass, temporarily freeze other automatic shadow maps, restore their flags after the render (including nested mirrors), and restore in a finally block if rendering throws. This avoids forcing the outdoor sun and cached indoor lights to redraw at the torch cadence; no other level source is modified.
- Level 1 head clearance follows sector/vault/cluster ceilings, the 2.29 m outline door frame and 2.16 m chained-door frame. Horizontal movement checks head clearance before entering a low doorway. L0/L1 collision uses the higher of current and target eye heights during crouch transitions.
- C+Ctrl keeps the slower sneak speed; dispatched movement key events cancel browser defaults while playing. Existing rebindable controls remain in place.

Validation so far: JavaScript syntax checks on the six changed files passed. No WebGL shader compile, movement sequence or in-game flashlight views have been observed. The unchanged baseline game cannot create WebGL 2 in this preview browser. `webgl2-blocked.jpg` is the failure page, NOT a game screenshot.

Next concrete action: in a WebGL 2-capable preview, reconcile latest main, then `git apply --3way art-source/alpha150/checkpoints/2026-10-25-stage1/dynamic-flashlight.patch` and perform only the affected checks. Check Level 0 wall/doorway and Level 1 column/wall with the torch on/off; include one Level 1 pose beyond its 1600 m origin boundary, and one corridor/crate occluder. Save two in-game views and a short sprint/jump/sneak operation record before marking stage 1 complete.

Pending acceptance: check standing/crouching jumps at doorway headers; release crouch under low geometry; hold C+Ctrl; confirm Ctrl movement remains usable in the target browser. Check that a moving torch refreshes its own depth while cached fixed-light shadows keep their existing refresh policy. Inspect L0 shader sampler/compile errors and L1 origin-boundary shadow alignment. These are unverified, not completed checks.

The patch contains `flashlight117.js`, `level1-world.js`, `level1-corridors.js`, `l1loot124-main.js`, `main.js`, and `player-movement150.js`. Original code/asset provenance is unchanged. The visible failure screenshot is 19,798 bytes. No generated texture or static bake is included.

Recovery commands (after reconciling latest main, in a clean isolated checkout):

```sh
git apply --3way art-source/alpha150/checkpoints/2026-10-25-stage1/dynamic-flashlight.patch
node --check dist/main.js
node --check dist/flashlight117.js
node --check dist/level1-world.js
node --check dist/level1-corridors.js
node --check dist/l1loot124-main.js
node --check dist/player-movement150.js
```

Resolve actual conflicts against latest main; never replace whole files from the old commit or force push. Syntax and patch checks do not prove WebGL compilation or gameplay. Keep this checkpoint out of runtime until the affected preview checks are possible.
