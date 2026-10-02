# V70: Palm Court refreshment alcove

`node tests/backcourt-v70/scene-check.mjs` loads all 33 actual runtime textures, checks their color spaces and dimensions, tests the real open retrieval cavity, both grounded cables, real camera interaction, paused/distant physics, instance compaction and BigInt-origin rebase.

`node tests/backcourt-v70/integration-check.mjs` exercises the production inspection lifecycle and the actual main event functions: dispensing does not add inventory, picking up adds one item, repeat pickup cannot duplicate it, PET/can/soy names and consumption remain distinct, and the older thermos/refractive glass stay compatible.

`node tests/backcourt-v70/physics-check.mjs` checks real Cannon-es rolling/angular velocity, old/new drink contact impulses, actual support on the 12mm mat, slope direction, sleeping, capacity and current geometric contact penetration. The authored tray is 460mm wide with a 370mm floor. Its shared layout controls both visible geometry and collision shapes.

The previews in `results/` are actual geometry and StandardMaterial shaders rendered in **software GLES**, with real generated textures and rigid-body poses. They are **not browser screenshots, production screenshots or measured hardware FPS**. Their diagnostic lighting omits the shared environment cube used by the game, so reflective bare metals are darker here. Texture detail and geometry can be reviewed; actual browser performance cannot be inferred from these images.

`physics-cpu-report.json` is a Node-only solver benchmark, not a browser FPS result. Production physics is capped at 32 drinks, near the vending machine only, with at most eight solver calls and a 3ms cooperative budget; an exceptional packed pile can slow its own simulation while camera input stays independent. Sleeping bodies retain actual colliders and can be woken by contact. The paddle is a real kinematic body, with a folding return path; no drink is teleported to imitate pushing.

The protected clinic → substation → plaza paths and both new approaches are audited using the actual ExitScene collision and walking-height APIs. V69 mouse-stall and staged-city-generation checks, plus the complete bath → spring → street return check, also pass.

Generated-source images, references, prompts and all derived material-map provenance live in `art-source/backcourt-v70/`. Cannon-es 0.20.0 is MIT licensed; its license is included in `dist/licenses/cannon-es-MIT.txt`.
