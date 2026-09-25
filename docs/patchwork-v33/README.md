# V33 — Rustic field parcels

The 64 m streaming grid is retained for loading only. Agricultural ownership now comes from a separate 216 m jittered Voronoi lattice with correlated row/column displacement, occasional independent corner clipping, and two weak noise bands. Signed BigInt site keys preserve deterministic identity at negative and distant world coordinates. Distances use all neighboring bisectors rather than F2−F1 or only the second nearest site.

Each whole parcel has one crop and one 0°, 45° or 90° tillage direction. The baseline crop weights are 50% ripe wheat, 30% brown barley, and 20% harvested stubble. The two parcels containing the authored landmarks remain wheat; reference camera sightlines do not cut crop-shaped wedges into neighboring parcels. Fixed buildings, rotations, sizes, elevations and interiors are unchanged. This changes the agricultural landscape deterministically, not the world seed.

Barley uses three new narrow-grain, long-awn, nodding ear geometries and a shared procedurally drawn atlas. Stubble uses three new cut-stalk/fallen-straw meshes in the near-detail cache; distant clusters use six-triangle alpha-tested silhouettes with an exposed-soil/straw ground shader. Distant stubble does not retain an opaque tall cereal canopy. Rows and mesh orientations read the same parcel descriptor as the map. No generated photographic images were used for these assets.

Road widths are stable unordered-edge hashes in 3.5–4.5 m. The road SDF is intersected with a 30 m physical shoreline exclusion using max(dRoad, 30 − dLake), with a further 5 m fade in relief. Nearby lakes are sampled even when a streaming tile is not itself a pond. Roads terminate before shore; this version does not add contour-following detours. Existing short building driveways retain their authored direction and fade at ownership boundaries.

Roads, crop clearing, terrain relief, map, and indirect ground albedo use the same CPU sampler. A worker-generated 256² RGBA data atlas carries distance/ruts/crop/junction data to the ground shader. Continuous channels interpolate; categorical crop/direction fetches snap to texel centers. Each 256 KiB atlas is owned by one chunk and disposed with it. Cache sizes are bounded. The worker transfers shared lake atlases alongside road halo information. Terrain refines near ruts and uses quarter-metre shared boundary vertices and sampled normals to avoid cracks.

## Verification

- `node tests/patchwork-v33/check.mjs`: 6,600 shared-edge samples including huge signed coordinates; zero mesh height/normal mismatches; 8,140 lake exclusion samples; three crop/direction groups; instance geometry data and owned texture transfer/disposal.
- Independent Astra review: 265 fixed/procedural building descriptors unchanged from V32 across three seeds.
- Existing V32 lake shape, terrain/water junction, atlas transfer and safe teleport regression passed (`lake-regression.json`).
- `node scripts/check.mjs`: all browser modules parse.
- Actual ground/water GLSL compiled and rendered in native GLES for three diagnostic poses with zero GL errors (`export-scene.mjs`, `render-scene.py`). These images exclude vegetation/UI and use controlled diagnostic lighting; they are not gameplay screenshots.
- Browser Canvas2D checked the actual map generator and all three material atlases. `map-browser.jpg` and `crop-atlases-browser.jpg` are browser captures of these inspection pages.
- The managed browser lacks WebGL2, so full 3D browser gameplay and device FPS remain unmeasured. No 60 FPS claim is made.

## References

- Red Blob Games, jittered grids and alternatives: https://www.redblobgames.com/x/1830-jittered-grid/
- University of Minnesota Extension, spring barley development: https://extension.umn.edu/agriculture/crop-production/small-grains/spring-barley-growth-and-development-guide
- AHDB, straw distribution and cultivation: https://ahdb.org.uk/trash-distribution-and-cultivation-depth-in-minimal-tillage-and-direct-establishment-systems-for-winter-wheat
