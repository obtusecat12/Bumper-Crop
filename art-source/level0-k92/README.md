# Level 0 / K furnishing district — 2026-10-05

This district is an independently modeled, fixed set of rooms inspired by Kane Pixels' Backrooms and the 2026 A24 film. It is not a claim of an exact replica of any complete official set. Repeated parallel cabinets, nonuniform object scale and intentional wall/floor intersections are the user's requested extrapolations.

References reviewed:
- Kane Pixels, Backrooms - Found Footage #3: https://www.youtube.com/watch?v=acdYs9tPLko (chair barricades, ordered book objects, domestic furnishings).
- Kane Pixels, Backrooms - Pitfalls: https://www.youtube.com/watch?v=0XwlWXtpaCM (blue commercial chairs and anomalous domestic space).
- Kane Pixels, Backrooms - Found Footage #2: https://www.youtube.com/watch?v=sA5PxGHqpTo (furniture/household area).
- A24 official film page: https://a24films.com/films/backrooms
- Film set photograph, A24 attribution in article: https://backroomsmovie.com/2026/05/new-backrooms-set-images/ . Reference copy: references/pile.jpg. We studied cabinet/open-shelf/sofa/CRT silhouettes and the tilted furniture cluster; no photograph is applied as an in-game prop texture.
- Corridor still: https://www.cinemablend.com/movies/the-backrooms-trailer-im-obsessed-its-take-found-footage-horror . Reference copy: references/corridor.jpg.
- Additional researched reference, not implemented: Static Dead End chair/mound, https://www.heyhaveyouseen.com/week-ending-4-10-26/ . Reference copy: references/static-dead-end.png.
- Secondary descriptive context: https://kanepixelsbackrooms.fandom.com/wiki/Dirty_Lobby ; /wiki/Living_Space_Room ; /wiki/Speaker_Room . These were treated as fan interpretation, not authoritative dimensions.

Art: six independent native image generations, archived unchanged in manila/ and kane/ alongside exact prompts. Each prompt was prepared after reading the required external image prompt skill. Chair wood, oak veneer, woven speaker cloth, blue polypropylene, beige corduroy and a typed field-note sheet are original generated art. Runtime images are WebP; material albedos are 1024 square and field notes 768×1086. Normal/roughness and fiber-height maps are mathematical approximations derived from generated imagery, not scanned PBR measurements. Derivation is recorded in scripts/pack-level0-k92.py.

The Manila changes are limited to casing at the door-leaf depth, wooden chair seats/back shape and generated A4 documents. Existing wallpaper, room plan, table, floor, lighting and two shared-scene photo cameras are retained.

Geometry is authored in metres, with beveled cabinet components, bent tubular chair frames, contoured polypropylene, rounded cushions with piping, speaker cones/grilles/corner protection and CRT glass/controls. Sofa cloth uses fiber displacement and sheen. Geometry merges by finish and static copies use InstancedMesh. The same YXZ placement and nonuniform scale inform plan footprints, player collision and both maps. Intentional embeddings are marked in level0-k-plan.js. New F2 indices are 10–12; old indices, infinite generator, supply inventory and level return remain intact.

Validation: actual local Chrome/SwiftShader WebGL2 screenshots only, saved in tests/level0-k92/results and tests/manila/results. These are software browser renders, not a hardware performance benchmark or evidence of pixel identity. No unrelated regression suite was run.
