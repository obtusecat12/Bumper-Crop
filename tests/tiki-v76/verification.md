# V76 / Lantern Reef and Level 11 transit

Scope: replace only parcel 54401 ground-floor storefronts, preserve both building masses, upper-floor windows, adjacent bathhouse, street furniture and all existing NPCs.

Generated assets: 10 independent 1024×768 WebP period photographs, 8 individually generated PBR atlas sets split into 48 512×512 channel maps, plus sign, menu, transparent thatch fringe and tabletop label/ceramic atlas. Source images and exact image prompts are retained under art-source/tiki-v76. Generated channel maps are visual approximations, not measured scans.

Geometry: exterior 61,166 triangles / 15 static material batches; dining room 62,506 triangles / 21 static material batches plus one five-mesh slow fan. Physical carved eye cavities, mouth recesses, brow/nose/lip relief; six overlapping displaced roof layers per pitch; alpha-cut eaves; rounded timber frames; colliding entrance columns. Interior has three booth bays, bar counter, five stools, food pass, bottle shelves, mugs/menus/place settings, knotted fishing floats, ceiling rafters and one cached shadow map. Both exterior and interior bloom use the existing bounded three-mip bloom implementation; exterior bloom runs only within 27 m of the entrance.

Transit: remove two Level 11 map guards. F2 and city map share a transactional destination preparation and rotated-box/circle safe landing search. Inputs pause while preparing; state commit follows geometry/collision preparation; error handling restores the original pose and clears busy states. Tiki entry lazily builds/caches its independent interior and precompiles material batches behind the photographic overlay. Exit restores the exact saved chunk coordinates, pose, camera range and shadow configuration.

Validation:
- `npm run check`: all browser modules parsed.
- `node tests/tiki-v76/run.mjs`: negative/large world coordinates, precision bounds, rotated/circular safe landing, no-safe-result case, room circulation, scoped storefront guard, 10 runtime photos.
- Actual game F2 Lantern Reef: completed in Level 11 at chunks 9,5, local 1.3331747029584449,46.2239364636219.
- Actual city map keyboard selection and Enter: successfully moved 32 m in X within Level 11.
- Actual Tiki cold entry: completed, all photos cycled while preparing; no page errors or shader compile errors.
- Actual E exit: returned to the exact saved exterior pose above; loading and active flags reset.
- Browser warnings: software renderer lacks KHR_parallel_shader_compile; sequential material preparation is used. Tests used headless Chromium + SwiftShader, not hardware GPU FPS measurements.
- Real game screenshots in results/: loading.png, interior-game.png, facade-game.png. First-pass inspection screenshots retained to document the roof rotation and rear-sign overlap corrected before delivery.
