# Level 10 rural environment, revision 4

Procedural models were rebuilt from the user's rural pond and barn photographs
and the primary references below. Reference photographs are not redistributed
in the site. All runtime textures are procedural and all dependencies are local.

- USDA Forest Service, white oak silvics: https://research.fs.usda.gov/silvics/white-oak
- NC State Extension, eastern cottonwood: https://plants.ces.ncsu.edu/plants/populus-deltoides/
- NC State Extension, American elm: https://plants.ces.ncsu.edu/plants/ulmus-americana/
- University of Minnesota, red maple: https://trees.umn.edu/red-maple-acer-rubrum
- University of Minnesota, paper birch: https://trees.umn.edu/paper-birch-betula-papyrifera
- University of Minnesota, eastern redcedar: https://campustrees.umn.edu/eastern-red-cedar
- NC State Extension, hawthorn: https://plants.ces.ncsu.edu/plants/crataegus-phaenopyrum/
- NC State Extension, bramble: https://plants.ces.ncsu.edu/plants/rubus-allegheniensis/
- NC State Extension, elder: https://plants.ces.ncsu.edu/plants/sambucus-canadensis/
- NC State Extension, hazel: https://plants.ces.ncsu.edu/plants/corylus-americana/
- USDA National Agroforestry Center, windbreaks: https://www.fs.usda.gov/nac/practices/windbreaks.php
- NPS Preservation Brief 20, historic barns: https://www.nps.gov/orgs/1739/upload/preservation-brief-20-barns.pdf
- NPS Sandburg woodshed: https://www.nps.gov/places/woodshed.htm
- NPS freshwater pond: https://www.nps.gov/places/freshwater-pond.htm
- Oklahoma State Extension, pond shore examples: https://extension.okstate.edu/fact-sheets/pond-management-for-livestock-fish-and-wildlife
- USDA farm pond guide: https://efotg.sc.egov.usda.gov/references/public/SC/Farm_Pond_Ecosystems.pdf
- NRCS access-road terrain and drainage guidance: https://www.nrcs.usda.gov/sites/default/files/2022-08/Access_Road_560_CPS_9_2020.pdf

Six tree architectures, four shrubs, and eight building forms have seeded
size/shape/material variation. Building local-priority spacing and the rare
windbreak probability are artistic generation choices, not factual measurements.
The 3,600-field seed sample contained 114 buildings, 72 windbreak fields, and
286 ponds. Building orientation/footprint matches its oriented colliders;
bramble and elder have drag volumes, not solid hedge walls.

Ground height, wheel-rut displacement, lake outline, bank elevation, collision
and first-person camera height use the same deterministic world functions.
Chunk construction is staged across frames; shared geometry/materials survive
unloading, and partial construction can be cancelled cleanly on rebasing.

Validation: native Mesa GLES compiled/linked 11 material programs; actual
geometry was rendered offline, including Three shaders for terrain and water.
Numeric checks covered cell seams, 8 entrances at 3 rotations, BigInt coordinates,
resource disposal, and staged construction. Offline renders are isolated model
checks; they are not browser gameplay screenshots or device FPS measurements.

## V5 · wheat, trackside detail, atmosphere and developer travel

The two new user references informed the ripe-gold palette, nodding heads,
small overlapping blades, and removal of repeated tire-tread stripes. They are
visual targets rather than a claim of literal photographic reconstruction.

- [UMN Extension: spring wheat development](https://extension.umn.edu/agriculture/crop-production/small-grains/spring-wheat-growth-and-development-guide) informed grain/spikelet separation and mature straw colors. Near wheat uses upright, arched and nodding ears with volumetric kernels and fine awns; farther clumps use an original procedural atlas. No external asset fetches are needed at runtime.
- [UMN Extension: soil compaction](https://extension.umn.edu/natural-resources/conservation/agricultural-soil-and-water/soil-compaction) and [Missouri Extension: field borders](https://extension.missouri.edu/publications/g9421) informed worn wheel strips and mixed grassy boundaries. The ruts are shallow displaced soil, with variable depth/width and broken material edges. Oblique driveways receive additional terrain samples.
- [NC State: southern lady fern](https://plants.ces.ncsu.edu/plants/athyrium-asplenioides/) and [SDSU Extension: ferns](https://extension.sdstate.edu/ferns-classic-shade-garden-plant) informed moist-bank and shaded-foot placement. Fine fern pinnae and pinnules use shared geometry; middle/far detail levels reduce their cost.
- [NC State: Bellis perennis](https://plants.ces.ncsu.edu/plants/bellis-perennis/) informed small basal rosettes, leafless stems, white rays and yellow flower centers. Small daisies occur sparingly on grassy verges.
- [Guerrilla: real-time volumetric cloudscapes](https://www.guerrilla-games.com/read/the-real-time-volumetric-cloudscapes-of-horizon-zero-dawn), [Hillaire: sky/cloud rendering](https://media.contentapi.ea.com/content/dam/eacom/frostbite/files/s2016-pbs-frostbite-sky-clouds-new.pdf) and [author publications](https://sebh.github.io/publications/) informed bounded integration of a moving 3D density field and approximate extinction/self-lighting. This game's implementation is original and substantially simpler.

Developer mode opens from the pause menu or F2. Nearest-landmark search yields
between batches, checks complete cell rings and proves the nearest center by a
lower distance bound. Landing uses actual solid colliders and terrain height,
then resets movement without changing inventory or exploration records. The
whole destination neighborhood finishes loading before exploration resumes.
A failed landing restores the previous location.

Distance fog uses a radial cutoff within the fully loaded terrain's inscribed
circle, plus separate low and raised drifting density layers. Material hooks
retain each asset's wind and surface shaders. There is no CRT/scanline overlay.

V5 checks include nine nearest searches against brute-force results (including
huge signed BigInt coordinates), 34 dry collision-free landings, all eight
building entrances at three angles, deterministic field generation and shared
edge heights over 3,600 fields, cancelled streaming tasks and resource ownership.
All 37 native GLES shader pairs compile and link using actual Three.js shader chunks. Transfer-state checks also confirm that loss of focus preserves pause and streaming failure cancels landmark searches. Native model and terrain
renders are diagnostic assets, not browser screenshots. Browser frame rate has
not been measured; quality tiers and adaptive resolution remain available.


## V6 · preserve the scene, remove repeated work

The requested road and lake changes are separate from the performance work.
Wheat density, ear shapes/awn geometry, atlas resolution, cloud integration
samples, pixel resolution settings, weather and collisions have not been reduced.

- A persistent module worker constructs terrain, vegetation, buildings, water,
  collision buckets and nearby ear patches. ArrayBuffers transfer their storage
  to the renderer; shared geometry, textures and materials register once.
- The packet codec preserves complete typed geometry attributes, local matrices,
  instance matrices/colors, shader source and live wind/view uniform bindings.
  Its resource registry accepts stale jobs before discarding their owned data.
  Canvas atlas RGBA bytes are retained, along with color space and flipY.
- Nearby ears are prepared once in 6 m patches. Ordinary movement reuses uploaded
  instance buffers. Frustum bounds include wind and player deformation. Rebasing
  reproduces the original Float32(raw root + cell offset) translations.
- Exact indexing merges only byte-identical vertices across every attribute;
  it does not approximate positions, recompute normals or simplify triangles.
- Static object matrices stay frozen until a rebase. New chunk materials compile
  asynchronously against the same scene lights/fog before installation. Fully
  opaque fog and zero-contribution micro-detail skip invisible noise calculations.
  Existing late sky drawing and all cloud sample counts remain unchanged.

Primary implementation references:
[MDN transferable objects](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects),
[Three WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html),
[Three BufferGeometry](https://threejs.org/docs/pages/BufferGeometry.html),
[Three InstancedMesh](https://threejs.org/docs/pages/InstancedMesh.html),
[Three DataTexture](https://threejs.org/docs/pages/DataTexture.html).

Lakes now span multiple 64 m cells, with a shared seed, asymmetric bays, broad
lobes and projecting banks. The initial basin covers about 0.96 ha across nine
cells. Other basins vary in size and shape. Banks use physical metre widths,
clustered grass/straw/rush colonies, uneven gaps, silt patches and small pebbles.
The water boundary, terrain, plant habitat and collision use the same shape.
Developer travel normalizes a dry bank point into its actual cell before loading;
nearestness still compares true lake-center distance. Drinking range is 1.8 m
from the waterline instead of a fraction of an enlarged lake radius.

Each road contributes a complete pair of recessed wheel cuts at intersections;
junction wear uses both corridors. Driveways fade lengthwise into the yard,
without circular caps. A low, dense grass sward occupies median and shoulders,
with coherent worn gaps and no roots in the wheel cuts.

Landscape references reviewed by the asset agent:
[ScotWays Coronation Road](https://scotways.com/heritage-path/HP293/),
[Wildlife Trusts lowland meadow and pasture](https://www.wildlifetrusts.org/habitats/grassland/lowland-meadow-and-pasture).
The supplied lake and road screenshots are the main visual targets.

Validation scope: native worker/transfer and real Canvas2D checks, exact ear
matrix/color comparisons across three qualities and origin rebases, cancelled
worker packet handling, asynchronous install/fallback checks, and shader compile
and isolated terrain/water renders under Mesa GLES. The current default-view
near-ear submission falls from 896,500 to 545,600 triangles (39.1%) through
frustum culling; every visible sampled stem is preserved. Balanced cached update
median was about 0.028 ms in Node. These are CPU/geometry measurements, not
browser FPS. Shared-edge heights match within 3.4e-14 m over 66,048 samples,
including 6,450 pond edge samples. Large signed-coordinate nearest searches and
dry landings pass. No browser frame-rate result is claimed.

## V7 · preserve generated content, reduce hidden work

The performance pass retains the V6 seed, complete field descriptors, road and
lake shapes, all plant counts/transforms/colors, quality tiers, texture sizes,
cloud sample counts and pixel-resolution rules. Building weathering and repaired
power connections are the requested visual changes. No CRT overlay is added.

- Near-ear vertices outside their original detail radius exit before normals,
  wind and projection. Fully covered 6 m patches use an otherwise identical
  opaque shader; fringe patches retain their original stochastic coverage.
- Completely fogged opaque fragments keep their original depth and alpha-test
  silhouettes, but skip surface/PBR shading whose final color is already the
  fog color. Transparent water/glass/rain and the cloud shader retain their
  original paths. Soil derivatives and fog-boundary alpha coverage were checked.
- Optional F2 / frame-rate diagnostics expose local CPU submission time, GPU
  elapsed time when the browser offers it, draws and triangle counts. Only one
  asynchronous timer query may be pending; it is sampled once per 60 frames,
  read only when available, and discarded after disjoint/context-loss events.
  Diagnostics never change quality or send measurements anywhere.

The cable graph now requires two real, dry-land support poles. Each endpoint
uses its own pole's road offset and insulator height. Missing lake-bank poles
terminate the line at the last actual support. Every traversed tile owns its
clipped part of a span, with identical shared endpoints, so visible mid-span
geometry no longer depends on a remote source tile. Three wires share one draw
per tile. Field descriptors retain the original chunk seed and additionally
carry the world seed for correct neighbor queries. The initial loading view now
also keeps its fog cutoff inside the loaded footprint.

Rural buildings gain weathered fibers and grain checks, dusty floor variation,
localized lower-wall staining, interrupted foundation courses, flush worn
thresholds, repair straps and flat fasteners. The surrounding soil has an
irregular worn yard and broken roof-drip dampness. Existing variants, optional
props, positions, entrances, pickups and collision layouts remain intact.
Details use existing material batches and shared maps.

Primary references reviewed for the V7 implementation:

- [ARM: Early-Z](https://support.arm.com/documentation/102224/0200/Early-Z)
- [ARM: alpha-test rendering](https://developer.arm.com/documentation/102471/latest/Profile-and-compare-transparency-implementations/Alpha-test)
- [NVIDIA GPU Gems: countless blades of waving grass](https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-7-rendering-countless-blades-waving-grass)
- [NVIDIA GPU Gems 2: virtual botany](https://developer.nvidia.com/gpugems/gpugems2/part-i-geometric-complexity/chapter-1-toward-photorealism-virtual-botany)
- [AMD GPUOpen: procedural grass](https://gpuopen.com/learn/mesh_shaders/mesh_shaders-procedural_grass_rendering/) (algorithm context; WebGL 2 does not expose these mesh shaders)
- [MDN: WebGL best practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices)
- [Khronos: asynchronous WebGL 2 GPU timers](https://registry.khronos.org/webgl/extensions/EXT_disjoint_timer_query_webgl2/)
- [Three: InstancedMesh](https://threejs.org/docs/pages/InstancedMesh.html)
- [NPS Preservation Brief 20: historic barns](https://www.nps.gov/orgs/1739/upload/preservation-brief-20-barns.pdf)
- [Pennsylvania Historical and Museum Commission: barn types](https://www.pa.gov/agencies/phmc/historic-preservation/education-outreach/pennsylvania-agricultural-history-project/field-guide-agricultural-resources/barn-types)
- [NPS Preservation Brief 47: historic building exteriors](https://www.nps.gov/orgs/1739/upload/preservation-brief-47-exteriors-small-medium-buildings.pdf)

Validation is native model/worker/Canvas2D/GLES verification, not a browser FPS
benchmark. 2,601 field descriptors match V6 exactly after excluding the new
worldSeed metadata. Across three qualities and huge coordinates, 337,110 ear
stems in 3,957 patches preserve all matrix/color/root/bounds bytes. Three native
ear views compare 2,880,000 pixels with zero differences. Power-line tests pass
28,577 assertions over four seeds, huge signed coordinates, 398 real connected
spans, 142 missing-edge cases and 13 lake-removed poles. Worker transfer checks
preserve every geometry attribute, instanced record, hierarchy, shader source,
wind uniform binding and actual Canvas atlas pixel, including the new lines.

V7 final integration adds cached eight-direction ordering inside each wheat-card
InstancedMesh. The generation phase prepares eight small integer permutations;
packing transfers their storage once. The render thread swaps whole matrix/color
records, keeps original bounds/counts/materials, uses 7.5-degree hysteresis and a
1 MiB per-frame upload budget. Stable-heading movement performs no order uploads.
An explicit generation phase also supports the original staged fallback.

Two 800x450 native card comparisons match all pixels. Successful alpha/depth
samples fall from 308,330 to 87,412 in the initial view and 152,981 to 67,755 in
the side view. These are overdraw opportunities, not total fragment invocations
or a 56–72% FPS claim. Some mobile GPUs already have an order-independent
[fragment prepass](https://developer.arm.com/community/arm-community-blogs/b/mobile-graphics-and-gaming-blog/posts/immortalis-g925-the-fragment-prepass);
therefore no extra whole-scene depth prepass was added. Permutation checks cover
240,000 paired records, camera-sector changes, bounded uploads and disposal.

The fog shortcut passes nine native color/depth/coverage comparisons totaling
2,160,000 pixels with no differences, including minified trilinear alpha textures
and soil derivatives at fogFar. Actual integrated wire endpoints coincide with
insulator mesh vertices, and LineSegments survive worker transport unchanged.
Final building checks cover 96 seeded layouts: collisions, pickups, footprints
and material draw counts are unchanged. Added model triangles range from 8 to
638 for the sampled variants. Dusty floor grids replace the slab's hidden top;
existing 30 cm floor seams move into the mipmapped map to avoid distant moire.
Stable wing-wall gaps are closed, and brick-barn doors now use timber surfaces.
Native exterior, interior, threshold and yard views use actual shared sRGB maps,
trilinear mipmaps and anisotropy. Mild inherited raised-roof-seam aliasing remains
consistent with the non-antialiased retro renderer. No browser FPS is claimed.

Final integrated gates: all 19 application modules parse with consistent V7
entry/worker imports; all 34 complete Three.js shader pairs compile and link.
An actual generated-card packet test preserves transferred permutation-array
identity and 46,024 paired records across eight headings, with zero stable-heading
uploads and disposal cleanup. Resident worker, cancellation, shared-resource
registration, fallback and compile-before-install checks pass.


## V8 — layered cloud evolution and fixed Kephart Farm

The user supplied two Edmund Garman photographs of Kephart Farm. Exact original references: [Kephart Farm](https://www.flickr.com/photos/3cl/3718833796), [Kephart Farm 2](https://www.flickr.com/photos/3cl/3719218226), and an [additional view](https://www.flickr.com/photos/3cl/3718401333). Photographer: Edmund Garman, 13 July 2009, Shannon Road east of Salem, Oregon. The originals specify [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/); attribution and modification notice are included in the in-game journal. No source photograph, vehicles, or aerial imagery is embedded as a game texture.

- Fixed farm anchor: world (160, 96), approximately 166 m from the original spawn. Four separately modeled buildings: gambrel barn, perpendicular gabled sign annex, low hipped-roof cottage, and separate shed. Detailed lap/vertical siding, roof seams, white trims, closed doors, window muntins, porch rails, gutters, foundation and actual upright two-line KEPHART FARM sign. All ground clearing footprints derive from the same scaled placement table used by the building models.
- Two coherent views use one world: A vertical FOV 16.1 degrees, B 7.3 degrees, based on original Nikon D40 EXIF 55/122 mm focal lengths. Camera positions and dimensions are reconstruction estimates, not a survey. A uses a 2.05 m viewing height above local ground to keep unchanged tall foreground wheat below the building silhouettes; ordinary player height remains 1.77 m. Both visible annex ends are modeled, including the opposite diamond/transom panels. To reconcile occlusion and differing apparent tree heights, the reconstruction uses a foreground tree visible in A and a separate smaller annex tree visible in B. This is an explicit hypothesis, not established historical site geometry. Tiny A horizon trees are young 3/4 m conifers placed at 320 m, a depth approximation. Hidden structures/details cannot be guaranteed identical from two photographs.
- Developer F2 adds two farm camera destinations. Movement, crouching, jumping or camera rotation returns to normal exploration FOV/fog. Photo views retain the original scene and stream a conservative narrow camera corridor (A 9 extra tiles; B 23, beyond the normal 49 on balanced). They use temporary distant light haze so the original long-lens arrangement remains visible. Ordinary gameplay keeps its existing fog, view distance, density and resolution rules. The sky sphere and projection far plane expand together only in photo view.
- Static farm triangles are clipped to their owning 64 m tiles, with interpolated normals/UV/colors. Foliage instances are partitioned by half-open center ownership and retain conservative wind bounds. Raw model/texture resources are shared; owned output geometry is disposed through the existing worker/packet lifecycle. This avoids an entire farm disappearing when one owner tile unloads. Visible photo-tree wind uniforms reconnect to main-thread live uniforms after transfer. No shadow map was added.
- Broad, burgundy, orchard and weeping tree crowns have low/middle/top overlapping branches and interior foliage, at the same two-draw budget and per-template instance counts. Alpha-tested twig textures contain edge RGB suitable for mip filtering. Distant evergreen positions were fitted jointly to the two reference frames.
- Cloud density uses separately evolving lower rounded lobes and an upper moving deck, with different drift directions, vertical shear and shape warp. Original 16/32/48 ray budgets, two noise fetches per density evaluation, early transmittance exit, shading and rendering scale remain. Native time-series confirms internal evolution after compensating for overall drift. This native validation does not establish browser FPS.
- Wheat RGB chroma is increased six percent once in its generated atlas/detail colors/canopy palette. Canvas alpha, wheat candidate streams, card geometry, UVs and instance matrices remain identical. Actual opaque atlas pixels measured approximately 6.22 percent greater average RGB chroma after rounding.

Validation: 54 actual expanded Three r180 GLSL programs compile/link on Mesa GLES 3.2; 30,960 neighboring height samples across the farm have maximum seam difference 3.34e-14 m; 1,395 fields outside the reserved neighborhood (including +/-10^30 BigInt coordinates) retain V7 generated descriptors; original spawn lake retained. Both photo camera landing points and every sampled cone-edge tile are covered. Existing compile-before-install, worker fallback, cancellation and focus-safe teleport behavior passes. Worker packets preserve all geometry/index/instance/color arrays, material shader code, texture bytes and live tree wind bindings across transfer/disposal/rebuild. Native material renders are checks of geometry/shaders, not browser screenshots or measured end-user frame rate.
