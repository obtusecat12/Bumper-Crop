# Level 10 → Level 11 urban release (v49)

This release replaces the finite, repeating city entrance with an authored commercial transition and a deterministic, streamed city grid. The visual target is maintained late-twentieth-century North/Latin American commercial fabric, interpreted with low-polygon PS1 geometry, subdued materials, static trees and empty streets.

## Scene and navigation

- The existing rural exit and its approximately two-minute approach remain in place. Eleven staged foreground lots introduce storage, light industry, workshops, utilities, clinics, bakery and small shops before the first urban intersection.
- The city grid has 112 m blocks, six-lane main roads and approximately 6 m sidewalks. Commercial, mixed, civic, industrial and high-rise districts use 36 distinct building types, including structural parking decks, arcades, setbacks and monumental stairs.
- F2 adds Commercial Edge, Financial Canyon and Public Plaza destinations. The handler awaits nearby geometry before resuming movement, clears reference-view state and resets the camera rig.
- The former hard stop and narrow city corridor are removed. The grid continues as the player moves. At most 25 city blocks are resident; near blocks retain more detail and retired block geometry is disposed.
- Streets and selected entry ramps/stairs are traversable. This release does not implement complete interiors or access to every upper parking/tower floor.

## Materials and objects

Twelve independently generated, seamless source images are retained unchanged in `art-source/urban-v49/`. The runtime WebP copies in `dist/textures/urban-v49/` use 384 px square images; source prompts and the generation rules are retained beside this file. There are no texture collages. City textures use ordinary repeat wrapping and metre-based UVs; the previous mirrored wall pattern is removed.

The material library covers travertine, sandstone, off-white stucco, ribbed concrete, two split-face bricks, cinder block, tinted glass, corrugated metal, asphalt, sidewalk concrete and shutters. Narrow geometric runoff sits below selected sills. Material choices and roof equipment follow each building's form.

Signs use separate, legible canvas artwork. Fixtures include bilingual shop signs, portrait PEGASUS banners, rooftop channel letters, blue street-name signs, slope/barrel/glass canopies, HVAC fans, ducts, tanks, lattice antennas, mesh dishes, fire escapes, rails, parking stops, tree grates, drains, manholes, wheel-chair curb cuts, hydrants, signals, curved lamps, utility cabinets, bins, parking meters, benches and bollards.

## Verification completed

- Browser-module syntax check: all distribution JavaScript parsed.
- `tests/urban-v49/lifecycle.mjs`: 481 route samples, unblocked approach, Level 10 → 11 → F2 → 10 restoration, paused weather and deferred-resource cancellation.
- `tests/urban-v49/verify.mjs`: 12 decoded texture maps, 36 reachable deterministic typologies, 754 unblocked city-road samples, 95 streamed blocks, maximum 25 resident blocks, balanced disposal, finite geometry and ground-level walk surfaces. Results are in `validation.json`.
- `tests/urban-v49/teleport.mjs`: the actual asynchronous F2 handler reaches all three city destinations with coordinate rebasing, awaited geometry and camera reset.
- `tests/urban-v49/full-chain.mjs`: 47 shader programs from the rural/approach material, fog, finish, shadow and irradiance chain linked in software GLES without errors.
- Five pedestrian-height views exported the actual scene geometry and materials and rendered in Mesa GLES with zero GL errors. Images in `inspection/` are explicitly diagnostic renders, with diagnostic lighting rather than the browser's complete postprocessing pipeline. Visible geometry ranged from about 191k to 590k triangles in these views.

An interactive browser session and hardware frame-rate measurement were unavailable in this environment. These diagnostic images and shader checks are not browser screenshots or measured gameplay FPS.

## Files

`urban-layout.js` owns district/plot choices and coordinate transforms; `urban-buildings.js` owns architectural forms; `urban-props.js` owns fixtures; `urban-materials.js` owns material/text/sign construction; `urban-batch.js` owns geometry batching, collision and walk regions. `exit-scene.js` assembles the transition and streams blocks. The main loop, terrain/crop masking, city map and module cache version are integrated with the existing game.

Architectural reference evidence and clearly identified procedural design dimensions are in `reference-typologies.json`. These are vocabulary references, not measured replicas. The Level 11 atmosphere reference is https://backrooms-wiki-cn.wikidot.com/level-11 .
