# V60 — independent rock spring and bathhouse reconstruction

## Scope
- Continued the existing public Site from v59 source commit c11c444fab30d4c0003984c0daa51c2a79b83573; preserved Level10/Level11 landmarks and existing return behavior.
- New east dry rock chamber is outside the spring water footprint; 10 stone stairs descend onto this land. Widened stream tunnel has a separate dry walkway, metre-wide continuous creek and physically connected waterfall outlet.
- Two separate cascades: inlet fall and 2.1m rock-following ledged cascade. Natural small corner drain remains nonexplorable. No vegetation added.
- Grounded wall lights use one-time shell raycasts for their mounting supports; removed light flicker. Basin geometry follows reference 5's 1.35 width:height proportion with open shallow bowl, gadroons, fluted stem and square plinth; towels, stool and bucket occupy dry land.
- Real L-shaped alley hides glass entrance behind street building, within the original parcel. Rounded empty pool, corrected open stair access, matte period materials, full painted ceiling. Wall-bracket handheld chrome shower heads, corrugated hose, diagonal independent jets and spreading wet-floor ripple planes.
- Existing independent Three Scenes and exact BigInt two-stage return are preserved. Indoor branches skip outdoor updates; outdoor water/bottle registries are excluded from indoor render passes.

## New image assets
Four separate imagegen materials: limestone, off-white ceramic, wooden staves and faintly veined pale marble. Runtime WebP sizes 256–512px. Generated originals under art-source/rebuild-v60. Existing generated murals, cotton textures and splash textures retained. No four-panel material sheets.

## Reference observations
Six supplied images visually inspected. Images 2–3 are two views of the same enclosed drained ornamental pool, not an open exterior. Image 4 is a handheld angled shower head, image 5 broad shallow classical marble bowl, image 6 dark wet rock cascades with thin unequal rivulets (no leaves used).
Research: https://www.nps.gov/neri/planyourvisit/waterfalls.htm ; https://home.nps.gov/yose/blogs/historical-account-danger-at-diamond-cascade.htm ; https://s-media.nyc.gov/agencies/lpc/lp/2435.pdf ; https://s-media.nyc.gov/agencies/lpc/lp/1287.pdf . Exterior is a period-inspired interpretation, not a claimed photograph-exact US address.

## Verification
- Browser-module syntax and git diff whitespace checks pass.
- 5,026 cave/bath path samples pass. Minimum sampled stair/tunnel standing headroom 2.304m.
- 312 sidewalk/L-alley/door samples pass, visible floor vs walking floor error below 0.000001m.
- Cave shell closed manifold: 170,152 triangles, zero boundary edges, zero nonmanifold edges.
- Production control-flow VM verifies door → individual hottest shower → eyes closed → Level27 → identical shower → exact original street BigInt pose, and F2 unwind/inventory preservation.
- Cave meshes total 226,682 triangles (v59 measurement 283,084), while dry chamber/tunnel are larger. Indexed shell retained. Refraction/reflection capture every other frame at bounded resolution, keeping matching reflection matrix.
- Layout-proxy autofocus median about 0.0044ms, p95 about 0.0087ms in Node diagnostic, compared with prior dense mesh raycast median about 15ms. These are CPU query timings, NOT browser FPS.
- Actual Three geometry, textures and material shaders exported to software GLES for overview, dry shore/basin, pool and shower views; linked/rendered without GL errors. Visual iterations corrected dry-floor edge spikes, overly granular white material, ceiling world-space scaling and lamp anchor gaps.

## Limits
Cloud browser WebGL2 context creation fails (GL_RENDERER Disabled) even on unchanged v59. The cloud browser also cannot access local preview. Therefore images are clearly labeled offscreen software GLES diagnostics, not gameplay screenshots, and end-to-end browser interaction/FPS is unverified. No pixel-identical reconstruction or hardware frame-rate guarantee is claimed. Runtime VHS/lens optics remain existing systems; geometry/control-flow tests do not establish the user's visual acceptance.
