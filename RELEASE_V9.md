# V9 — regional farmsteads and rural material detail

## World continuity

The existing `CHLORINE / ABUNDANCE / 10` seed is unchanged. The settlement layer is additive: no previous building is removed, moved or re-rolled. Smooth multi-scale regional weights add sparse local farmstead concentrations with at least 128 m between added/existing centres. Hashing uses complete signed BigInt coordinates; bounded caches affect speed only. Existing lake and fixed-photo-farm exclusions remain authoritative.

Actual integrated comparison across 16,384 cells: 453 old buildings retained, 175 added (628 total); all 1,804 lake cells and all road descriptors unchanged. All 16,209 cells without a new building compare identically. Broader pre-exclusion planner samples averaged +27.47% across three 512² areas, including ±10³⁰ origins. Repeat visits and fresh loads remain deterministic.

## Yard props

Three seeded arrangements distribute two or three purposeful workstations. Original mesh details include slatted/nail-fastened crates, woven baskets, seamed gathered sacks, bottles and lidded jars, stoneware jugs, curved sickles/scythes, shovels/forks and tied straw bales. No labels, brands, stills or new consumable interactions. Large stacks have OBB collisions; small tools and vessels are decorative. Prop footprints reject door aisles, walls, porches, other props and tile edges. Ground contact uses the actual terrain's local tangent plane.

112 rotated/scaled seeded layouts and 48 tile-edge cases passed. Maximum tested yard cost: 7,696 triangles and eight shared-material draws, no per-frame update. LOD changes do not rearrange or remove the large props. Fixed photo-reconstruction buildings keep their established exterior composition.

## Generated materials

Seven independent built-in ImageGen originals supply soil, fine-gravel path, short turf, oak/elm bark, birch/aspen bark, broadleaf and fine-leaf detail. Exact prompts and runtime asset names are in `TEXTURE_PROMPTS_V9.json`. The 1254² originals are converted to 512² lossless WebP runtime textures (~2.8 MiB total download). They decode once per execution context into packet-compatible shared DataTextures; mipmaps and anisotropic filtering handle minification. Mirror wrapping guarantees continuous edge values without extra shader texture samples. This is mirrored repeat, not a claim that unprocessed opposite image edges match pixel-for-pixel.

Ground uses three albedo samples blended by existing wheel/yard/shore masks. Real road relief and terrain collision remain unchanged. Bark/foliage detail preserves geometry, foliage alpha silhouettes, wind and tints. Near material relief uses filtered derivatives, not extra terrain meshes. All seven textures are preloaded before chunk creation; failed loading shows a retryable startup message.

## Shrub connections

Attached shoots include a continuous central rachis and petioles sharing leaf-base vertices. The wind root is pinned, the previous downward spray-origin offset is removed, and supporting endpoint branches survive far LOD. Shrub LODs use position-identical subsets instead of shifting leaves. Pass-through soft volumes and solid collision definitions are unchanged. 192 cases, 3,696 anchored spray origins and 3,456 wind-joint checks passed; non-shrub tree geometry is unchanged.

## Verification scope

- All app modules parse; import/worker/style cache tags are V9.
- 63 actual expanded Three shader pairs compile and link under native Mesa GLES 3.2.
- Actual Node worker startup, cancellation, reuse and disposal pass with real decoded generated images.
- Packet roundtrips preserve exact geometry/instance/texture bytes, shader source and live wind bindings.
- Six native yard renders inspected with actual soil/path/turf pixels, mirrored wrapping, PBR and glass blending. These are native material/geometry checks, not browser or device FPS measurements.

## Form and material references

- [The Henry Ford — cradle scythe](https://www.thehenryford.org/collections/explore/artifact/8821): wood/steel construction, shaped handles and curved blades; adapted as repaired older tools surviving in a late-20th-century setting.
- [California State Archives — produce crates](https://www.sos.ca.gov/archives/trademarks/crates): slatted utilitarian containers, without copying labels or trademarks.
- [History Colorado — burlap flour sack](https://www.historycolorado.org/burlap-flour-sack): gathered necks and sack material/proportions.
- [Smithsonian Folklife — Ozark white-oak basketry](https://festival.si.edu/blog/white-oak-basketry-ozarks): woven splints, ribs, rims and handles.
- [National Park Service — Blue Blazes exhibit](https://www.nps.gov/cato/learn/historyculture/blue-blazes-whiskey-still-exhibit.htm): rural moonshine context, represented only by generic closed vessels.
- [Cornell Cooperative Extension — small square bales](https://swnydlfc.cce.cornell.edu/submission.php?crumb=livestock%7C10&id=2034): compressed string-bound bale form; small temporary yard-handling clusters.
