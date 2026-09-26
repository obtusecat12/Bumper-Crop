# V46 — Object 1 containers and first-person inspection

Replaces the old eight-sided pickup bottle at every collectible anchor: roads,
the welcome pickup, standalone buildings and farm compounds. Item IDs and
collection state are preserved. Empty decorative farm jars/jugs are not supplies.

## References and artistic interpretation

- [Object 1 — Almond Water, The Backrooms Wikidot](https://backrooms-wiki.wikidot.com/object-1): canonical metal thermos, approximately one foot tall, clear liquid, small dents and paint scratches. Original by 1000dumplings; rewritten by Natedagreat563 and Poliacci. CC BY-SA 3.0. Attribution is also in the game's journal.
- User-provided canonical blue/silver bottles and the Level 10 steel thermos photograph: silhouette, seams, dark stopper, handle proportions. The photographs are reference only and are not packaged as texture maps.
- [Thermos history](https://thermos.com/pages/history): period vacuum-container construction.
- [Smithsonian vacuum bottle collection](https://americanhistory.si.edu/collections/object/nmah_2620): historical steel-cased vessel construction.
- [SHA Historic Bottle Identification — soda/mineral water](https://secure-sha.org/bottle/soda.htm): narrow-neck beverage profiles, mould embossing, ribbing and closures.
- Visual reference searches covered 1970s Aladdin/Stanley vessels with separate cup/stopper; 1960s ribbed Double Cola/Fanta returnable bottles; green embossed returnable bottles; period printed soda labels. These serve as shape/production references, not borrowed commercial artwork or verified dating of each resale listing.
- [Three.js physical material documentation](https://threejs.org/docs/pages/MeshPhysicalMaterial.html): distinction between opacity and optical transmission, IOR, roughness and absorption.

The 1960s–1980s American-labelled glass version is the requested art variant;
it is not presented as the canonical thermos photograph. Liquid is clear water,
not opaque almond milk. Four original generated labels use fictional almond-water
branding. Generated finish maps cover enamel, brushed steel, aged nickel and cork.

## Construction and rendering

- Thermos: 30.7 cm vessel with formed base, checked/dented outer shell, screw
  neck, nested cup lid, seams and optional strap handle. Enamel, steel and nickel
  use a bounded 0.45–0.65 body roughness, scratch normals and variable roughness.
- Glass: narrow-neck 26–27 cm returnable shape, ribbed heel/shoulder, thick base,
  mould-letter normal map, four aged paper labels, 21-flute crown, knurled screw
  closure or cork. The glass uses IOR 1.52, roughness 0.15 and transmission 0.97.
- Clear liquid: two-interface Fresnel, Beer–Lambert absorption, refracted scene
  colour and a ray/free-surface intersection contained by the shoulder profile.
  A damped inertial tilt responds to pickup acceleration and inspection rotation.
  A circular-segment volume lookup compensates surface height as the bottle tilts.
  This is a bounded real-time free-surface approximation, not a Navier–Stokes solve.
- The glass shares the already rendered scene buffer and sky cube. No Three.js
  per-material full-world transmission render, separate ray tracing, or scene
  replay is requested. Inspection ping-pongs existing opaque/water/glass targets;
  there are no dedicated full-screen inspection buffers.
- Shared merged static templates: 1 draw per world thermos, 2 per world glass
  bottle. Only one held bottle has changing pose and liquid uniforms. World
  instance matrices remain frozen; textures are loaded once in the render thread.
- Low geometry for world pickups, finer shared geometry only for the inspection
  asset. Detailed cap/cup/handle components remain merged into one opaque draw.

## Controls

E picks up the bottle and flies it from its world position to the centre of view.
Mouse movement or touch dragging rotates it. The wheel brings it closer. E stows
it, Q drinks it, and R inspects the most recently stored bottle again. Pause freezes
the inspection and liquid. The item retains its appearance in the inventory.
Inspection remains inside the existing linear render / tone-map / VHS pipeline.

## Validation

- `node tests/almond-water-v46/check.mjs`: all geometry/material variants, static
  matrix versions, worker anchor transfer/hydration, actual pickup/drink functions,
  inventory accounting, centre-flight, pause/stow and liquid volume/settling.
- `node tests/almond-water-v46/pipeline.mjs`: actual render-pipeline control flow;
  no read/write framebuffer feedback, correct glass layer, one opaque-world render,
  no idle inspection draws, renderer state restored.
- `node tests/almond-water-v46/full-chain.mjs /tmp/almond-v46/full-chain.json`
  followed by `python tests/water-v28/native/gl_native.py ...`: 14 actual production
  shader programs linked, including worker → fog → finish → CSM → GI → bottle.
- Export and native rendering inspect all three thermos finishes, all three glass
  closures and all four labels. `materials.webp` is the actual production asset
  rendered in software GLES; its background is a prior V45 scene capture used as
  a diagnostic backplate. It is not a browser screenshot or hardware benchmark.
- Current managed Sites preview does not provide a supported browser path for this
  static build. Native tests run GLES 3.2 on Mesa llvmpipe. User-device WebGL2/FPS
  remains unmeasured. No claim of hardware performance is made from these tests.

The generated labels/materials and new canonical-object artwork are made available
under CC BY-SA 3.0 alongside the attributed Object 1 adaptation. No reference
photograph or real beverage trademark is embedded in the new assets.
