# V57 / environmental and spring reconstruction

12 independently generated images: four cave/water images, three plaza material surfaces, four product package faces and one replacement ECHO fashion banner. Original images and exact prompt provenance are retained in assets/level27-originals-v57, assets/plaza-v57 and assets/advertising-v57. Only image generation was delegated; integration, geometry, shaders and QA were authored by the primary agent.

The ECHO wall uses the replacement 1994 denim campaign with repeated rectangular eye/brow strips. The original horror-style image is no longer requested by the runtime. The cart is rotated 35° in pitch and −15.5° in roll; five packets/cartons penetrate the actual plaza paving in distinct poses. Three textured concrete chess tables, two drinking fountains, three planters, a maintenance trolley, newspaper box and bicycle parking furnish perimeter zones. The axial paths remain open.

## Level 27

The cave and inflow tunnel now share one closed implicit limestone surface. There are no separate intersecting flowstone lathe columns or overlapping arch shells. World-space material projection blends bedded limestone with scalloped calcite. A sampled signed distance field produces geometry; the game does not display a reference-photo billboard. Model generator: scripts/build-spring-shell-v57.mjs. Geometry source: dist/level27-layout.js. Changes to the geology require regenerating dist/level27-shell-data.js and rerunning the topology/headroom checks.

The waterline survey polygon is 18.58 m², excluding the separate access tunnel. Natural basin shelves and the stair footprint occupy part of that surveyed area. Exactly two sources feed the water. The waterfall imagery has moving longitudinal strands, a curved sheet and surface-contact foam; the pool retains depth refraction, planar reflection and mineral-green caustic detail. No vegetation, creatures or new exterior level were added. The fixed street bath, maximum-heat/closed-eyes entry and exact return pose remain functional.

Read in full: Chinese and English Level 27 descriptions, entry/exit sections, hidden expedition narrative and licensing. The narrative's wider exterior is not part of this requested spring implementation.

Sources:
- https://backrooms-wiki-cn.wikidot.com/level-27 — Kitty Rika / XD42, CC BY-SA 3.0.
- https://backrooms-wiki.wikidot.com/level-27 — Kitty Rika, CC BY-SA 3.0.
- https://www.flickr.com/photos/50711561@N00/14440932785 — Cave Lake (Cooler), Jacob Norlund, CC BY 2.0. The user-supplied copy is used in the technical comparison sheet.
- https://guides.justwatch.com/es/backrooms-entidades-still-life-explicadas — inspected movie Still Life image to study duplicated facial features; the film image is not used in the game.
- User attachment IMG_4023.png — water visual reference only. Its scenery and phone UI are not included in generated materials.

## Verification

- Actual exported Three.js scene, geometry and material shaders rendered using software OpenGL ES 3.2; all 11 spring shader programs link, GL errors 0.
- Four spring views: reference study, stair/waterfall connection, inflow-tunnel arrival, low pool view. City views: cart/packages, billboard, furnished plaza.
- Closed rock topology: 0 boundary edges, 0 non-manifold edges. The final rock shell has 205,988 triangles; the complete cave has 215,186 exported triangles / 13 mesh draws, plus spray sprites.
- Stair headroom: minimum 2.019 m along the checked route; physical tread heights match movement.
- 1,625 walking samples through the tunnel, stairs, pool and return; 13 tread raycasts; 106 sidewalk-to-shower clearance samples.
- 981 plaza pedestrian samples clear; 125 road samples retain one owner; 8 visible paving samples match walking height.
- Existing facade occupancy: 216 generated facades checked; 185 AC units and 96 projecting signs remain clear.
- Level 10→11 transition: 204 original path, 42 shoulder and 325 urban-paving exclusion samples; 481 lifecycle route samples; 7 city/photo/bath developer teleports.
- 152 browser modules parse and 443 local imports resolve.

These are actual-scene offscreen diagnostic captures, not browser or live-site screenshots. They omit UI/VHS/point-sprite droplets; shadows use equivalent radial-depth cubemaps rather than Three.js's packed shadow atlas. The required browser-control skill is unavailable and this plain static project has no compatible managed preview server, so browser pointer-lock/touch performance was not verified. The reconstruction is materially improved but is not pixel-identical to the single cave photograph. Reference comparison is deliberately supplied without retouching to expose that difference.
