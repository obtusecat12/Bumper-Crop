# Level 0 reference refinement · 2026-10-05

All 28 new base-color artworks were independently image-generated. Native outputs, exact prompts and the freshly read user-supplied prompt-writing skill are retained here. They are generated materials, not measured scans or photographs from the film. User attachments were downloaded directly from their authorized file IDs; they were not searched for in Library.

## Sources and interpretation

- User image 1: narrow upright arrow/chevron wallpaper; generated `hero/wallpaper-chevron.png` uses it as the direct reference.
- User image 2: pale carpet, low-contrast yellow walls, irregular partial partitions and diffuse recessed lights. The runtime material grading is in linear color space; new diffuse art remains preserved unmodified.
- User image 3: raised arch openings with a continuous overhead beam, upper ceiling gap, open burgundy bin and a small metal pail at the left wall. Both containers have real wall thickness, open interiors, rims and modeled handles.
- Official film page / A24 stills: https://a24films.com/films/backrooms
- Production designer interview: https://www.fastcompany.com/91549406/a24-backrooms-film-production-design-liminal-space
- Director interview and A24 stills: https://www.culturedmag.com/article/2026/05/28/film-kane-parsons-backrooms-horror-interview/
- Set decorator interview and furniture images: https://thesetset.com/articles/backrooms-set-decorator-trevor-johnston-interview
- Additional furniture research: Film and Furniture, Backrooms production-design coverage.
- Commercial ventilation reference: Titus TMS-AA square ceiling diffuser, manufacturer specifications.
- Electrical fixtures: Leviton duplex, GFCI and decorator/utility faceplate manufacturer references.

Film-derived object families are the cream floral rolled-arm sofa, teal upholstered armchair, camel velour recliner, honey-oak open bookcase, ladder-back dining chair, walnut bureau, spindle side table, thick CRT television, oval upholstered wood chair and tapered fabric-shade lamp. The set's isolated furniture islands informed rare placement. No claim is made that these procedural models reproduce a named manufactured product exactly. Crew equipment in production stills was not treated as film set dressing.

## Material inventory

- `panels-a` and `panels-b`: ten independently generated American lower-wall treatments: honey-oak beadboard, off-white beadboard, ivory colonial raised panels, walnut recessed panels, sage Shaker, beige board-and-batten, knotty pine, cherry picture frames, blue-gray double-stile and 1970s faux-wood grooves.
- `utility`: five outlet plates, breaker interior and transparent mold. Outlets also have modeled plates, screws, socket recesses, prong openings and GFCI buttons; the breaker has cabinet depth, an open door and a moving main lever.
- `furniture`: three fabrics plus oak and walnut.
- `hero`: two wallpapers, carpet, galvanized duct finish and two container surfaces.

Runtime WebP base colors use sRGB; derived normal/height maps remain linear. Normal maps are luminance-gradient approximations. Fabric displacement is derived from high-pass fiber detail (large printed flower shapes are excluded), with actual subdivided cushions, 6 mm displacement, cloth sheen and modeled seam piping. This is displacement mapping, not a normal-map substitute. Runtime manifest records image sizes. Retired first-pass wallpaper/carpet runtime files are retained under `retired-runtime` and removed from publication because no code still references them.

## Spatial and rendering implementation

An unbalanced metric BSP creates unequal rooms with independently offset wide openings. 21.6 m storage chunks do not add perimeter walls. Walls retain one canonical owner; neighboring collision queries include their full extent. Special regions cut ordinary walls away. The fixed column hall is 120 × 129.6 m; new large halls recur deterministically in the continuing world. Fixed landmarks preserve the old F2 indices and add a reachable breaker and furniture clearing.

The ceiling reserves services against luminaires; real tile cutouts and clipped T-grid rails surround vents and broken cavities. Insulation has irregular thickness and frayed ends. All ceiling fittings, ducts, lights and the furniture lamp have castShadow disabled. Walls, columns, arches and other furniture use the existing PCF soft directional shadow path and base AO skirts.

Global material/geometry InstancedMesh batches cover a 7 × 7 resident region and rebuild on storage-chunk crossings, not every frame. Circuit state persists independently of streamed chunks. Breaker E interactions update only lever matrices and uniform vectors; bounded local attenuation affects nearby lamps and surfaces, while distant lamps remain powered. No extra sampler is used for circuits.

## Verification

`tests/level0-v2` contains actual local Chrome / SwiftShader WebGL2 renders and functional evidence; these are software browser renders, not hardware FPS measurements. The layout test checks 361 deterministic chunks, 5,502 long-wall endpoint collision samples, all 10 panel and 5 outlet variants, 12 prop families, 1,125 ceiling reservations and eight safe F2 landmarks. The complete game flow verifies map teleport safety, original almond-water pickup/inspection/drinking, F2, breaker off/on and stream persistence, and exact origin-pose restoration. Actual linked shader inspection found a maximum of 8 active samplers, within the required 16. A capture helper briefly stops only the test harness RAF when taking screenshots to avoid a software GPU queue backlog; no gameplay frame cap or pause hook is shipped.

A 118-glyph Noto Serif CJK supplement fixes missing Chinese characters observed in the new interaction prompts; the original interface glyphs are unchanged. Its source, license and codepoints are recorded in font-supplement.json.

Latest remote source was fetched before publication. Changes are confined to Level 0 modules, their integration points, assets and source/test documentation; other levels retain their latest source.
