# Level 0 V94

This is an authored interpretation of the user's eleven supplied screenshots, not a pixel-identical reconstruction or a claim of award-winning quality.

## Scene changes

- Native generated yellow Berber loop carpet, mineral-fibre ceiling, sand linen, smoked velour, honey wood and olive vinyl. Originals and exact prompts are adjacent. Estimated micro-normal/roughness derivation is reproducible with `scripts/prepare-level0-v94.py`; these maps are not measured scans.
- Existing chevron wallpaper remains the dominant ordinary wall finish (84% partition selection). Manila assets and authored room remain unchanged.
- Continuous metric room grammar: long spines, unequal suites, thick rounded/canted/squared openings, low partitions, high beams, alkoves and mahogany rails. Chunk boundaries remain storage boundaries only.
- Rare ±0.36/0.40m gently sloped floor plates with easing near protected districts; the authored gallery descends 0.42m. Floors, walking height, openings and object placement share the same authority.
- Wider 1.06×0.96m column masses at 4.8m spacing, no waist rail around pillars, dim but readable blackout walls and a warmer acoustic ceiling. Pit faces darken with depth.
- Eleven additional furniture silhouettes/material combinations, retaining V93 joinery and tufted leather.

## Furniture physics

`scripts/level0-stack-physics94.mjs` is a separate deterministic Cannon-es compound-body packer. Collision proxies represent actual seats, backs, legs, shelf slabs and carcass panels. Volume-weighted centres of mass avoid applying gravity around a model's foot origin. Friction, restitution, sleeping and 120Hz stepping determine contact poses. There is a real floor and a backing wall; the runtime places matching walls at each stored pile.

The runtime loads 10 mixed and 10 chair solutions plus a 34-object hero pile. It transforms their stored rigid poses and AABBs; it does not simulate them in every animation frame. These are approximate box compounds, not deformable upholstery. Deliberate floating, half-buried, wall-clipped, interlocked and stretched furniture is a separate user-requested anomaly system, not a physics defect to correct.

## Lighting and cost

Four bounded area lights and two cached spot-shadow lights illuminate the nearest actual fluorescent fixtures. Dim reflected illumination preserves blackout readability. One 16-tap depth-reusing occlusion pass supplies contact depth, with restrained bright-source halation. This is raster lighting/SSAO, not hardware path tracing. Manila bypasses the new post pass and retains its original illumination branch.

Static chunk draw plans cache geometry and instance matrices; sloped tile geometry merges per chunk. Shadows refresh on light-cell/chunk changes. Level0 opts into up to 4x MSAA in the shared opaque target; other indoor scenes retain their previous setting. The gameplay camera remains full-rate.

## Review

`tests/level0-v94/results` contains actual local Chrome / SwiftShader WebGL2 captures of blackout, columns, pits, mixed/chair piles, the enfilade and the ramp. The separate game capture uses the actual UI and rendering pipeline; it checks only the new doorway passage and original-level return. Software captures and triangle counts are not hardware FPS measurements. Image review prompted multiple lighting, material, gravity-centre and backing-wall revisions.

F2 destinations 0–12 retain their indices. Appended destinations 13–15 are the enfilade, ramp and chair pile.
