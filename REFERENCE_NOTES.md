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
