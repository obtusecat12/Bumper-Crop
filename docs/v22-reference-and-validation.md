# V22 — water and inhabited brick barn

## Inspected image references

- Spyro 2, Summer Forest screenshot: https://twitter.com/SpyroAesthetics/status/1442217412741455872 — broad animated color bands, simple surface polygons, limited palette.
- Spyro: Year of the Dragon, Spooky Swamp screenshot: https://levelup-spill.no/products/spyro-year-of-the-dragon-platinum-brukt-playstation-1-spill-ps1 — coarse water and opaque banks. Several Tomb Raider search results were rejected as remasters rather than treated as original PS1 references.
- Barn hay storage: https://agnetwest.com/agri-view-needle-hay-stack/ — stepped bale stack and clear working aisle.
- Straw bedding: https://www.camping-avenches.ch/de/P13334/la-magie-de-la-ferme — deep uneven straw, compressed sleeping position, pillow and blankets.
- Historic work floor: https://www.cultureelerfgoed.nl/actueel/weblogs/adviseurs/2022/monumentale-werkvloeren-oude-ambachten-in-hun-historische-omgeving — coherent wall storage, tools and barrow.
- Coleman 502, tank dated 1974: https://classiccampstoves.com/threads/coleman-502-1974.44531/ — green round tank, ventilated neck, pot support and valve silhouette.
- 1980s frame pack: https://auctionet.com/sv/2555614-ryggsack-och-regnskydd-3-delar-fjallraven-ornskoldsvik-1980-tal — soft olive bag, exposed frame and straps. Context references are not dimensional surveys of the user's barn.

## Technical reference

- NVIDIA RTX GI: https://developer.nvidia.com/blog/rtx-global-illumination-part-i/ — visibility-aware probe interpolation and light leak limitations.
- GPU Gems 3, screen particles: https://developer.nvidia.com/gpugems/gpugems3/part-iv-image-effects/chapter-23-high-speed-screen-particles — pooled screen effects and bounded work.

## Implemented

Normal standing wheat replaces the authored harvested rectangle, except the footprint, short approach and existing natural exclusions. Stable seed and fixed barn location remain. Interior has stepped straw storage, thick irregular sleeping straw, cloth bedding, bedside belongings, enamel cooking pot with animated paste, a period-style portable burner, prep bench, flour, bucket, feed rack, ladder, tools and barrow. Central entry remains passable. Two small actual rear rooflights add plausible daylight without altering the photographed front roof plane. Bale faces now share closed continuous corner displacement.

Opaque PS1-inspired lake surface uses coarse displaced triangles, five restrained colors, a shared 64-pixel repeating animated texture and 12 Hz motion steps. Shoreline topology remains authoritative across tiles. Water impacts have a bounded pool of 64 airborne pieces and 6 expanding rings. Lens beads grow large enough to remain visible after VHS, slide under gravity, elongate, merge with volume conservation and shed finite-life trails. This is a bounded visual physical approximation, not CFD.

GI keeps actual occluding wall/roof geometry. Door and rooflight importance sampling improve sparse indirect rays. Only same-room probes contribute inside the fixed shelter. An energy-derived floor at 22% of the measured valid interior probe mean approximates low-frequency higher diffuse bounces; it is not an additional fully traced transport path. It never creates light in a zero-energy room. Exposure adapts and is capped. Outdoor exposure remains unchanged. Indoor adaptive tracing is cached in a background worker; it is not repeated per frame.

Very subtle raster stepping blends 16% of a 1200 × 900 sample into the original complete source frame before official 1440 × 1080 ntsc-rs processing. Scene, water optics and UI share this frame. No sharp residual is added after VHS. The 320-line PS1 option remains.

## Verification and limits

Actual application geometry/materials were rendered through native GLES with real shadow maps, the worker BVH and probe data from six barn cameras, a lake impact camera and a lens-optics frame. Final PNGs were opened and inspected. These native scene views do not include the full streamed wheat/cloud scene. A separately composed scene/lens/UI frame passed through the actual display shader and official ntsc-rs WASM; final presentation was byte-identical to the complete official output, including orientation. The subtle raster step has a nonzero but small measured effect.

Checks cover 483 open entrance/aisle samples, 15 stable colliders across LOD, restored wheat candidates, map agreement, 56 cross-tile water boundary points, worker geometry/material transfer, bounded splash pools and rebasing, droplet travel/merging/expiration, dry zero-draw behavior and disposal. All application modules parse; modified render shaders compile under GLES. Native software-renderer timings do not establish browser FPS or the user's device performance.
