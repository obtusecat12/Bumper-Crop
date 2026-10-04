# Milling return and reserved-block infill

Base: latest V82, commit d622eaa, after reconciling V81 indoor Tiki garden and V82 Level 10 lake connection.

## Implemented

- 76 obstacle-filtered infill buildings across eight reserved central parcels, with shared map plans, front walks and street furniture. Existing reference buildings retain their geometry.
- Fixed 4.5 m service mouth, 560 m curved return route, physical brick/steel buildings, fire escapes, HVAC, shutters/loading platforms, pallets, printed flour sacks, drainage and fencing.
- Eight generated diffuse originals; fourteen derived normal/roughness maps. Existing generated glass, rural ground and recorded footsteps are reused. Derived maps are approximations, not measured PBR scans.
- One ground mesh blends asphalt, flour, wet slurry, clay and double ruts. Urban upper stories compress and become steel-clad before fading into fog. Wheat stores 50,004 3D stems across nine cells; alpha tufts provide fine photographic details.
- Progressive footstep mix, street ambience attenuation, camera walking motion, player wheat bending. Native Level 10 terrain/cereals prepare before a fog-hidden handoff.

## Actual browser evidence

Local Chrome uses real WebGL2 via SwiftShader and serves exact checkout files through an in-process Playwright asset route. Hooks are injected by QA only and are absent from dist.

- before-empty-block.png → after-infill.png: same player position, restored occupied street frontage.
- city-mouth.png, game-return-28.png, game-return-245.png, game-return-476.png: actual game pipeline and HUD.
- returned-level10.png: movement crosses the 560 m endpoint, native Level 10 active and neighborhood loaded.
- game-errors.json: no page/console errors in the completed merged-source flow.
- capture.mjs samples actual scene collision resolution every 0.5 m: maximum centerline deflection 0, no blocked stations.
- walk.mjs exercised game movement through the entry gate (s=26.08, active=true, no runtime errors). An earlier screenshot request timed out while the software GPU was continually rendering; capture now briefly pauses RAF through a QA-only hook before readback.

These are real software browser renders. Hardware frame rate and all arbitrary off-road navigation are not certified. The final low-fog bank intentionally conceals the native scene handoff; this is not one globally Euclidean world mesh.

## Setting

Wikidot Level 10 explicitly permits a secluded/back road from Level 11 to Level 10. The flour mill, exact dimensions and staged material change are original art direction requested by the user, rather than dimensions specified by the wiki.
