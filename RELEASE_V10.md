# Level 10 — soil, joined wood and individual yard objects

## Changes

- Exposed wheat-field earth now uses the resident brown granular soil albedo directly, at a four-metre repeat, with filtered millimetre-scale normal relief. The previous yellow base multiplied by texture luminance washed out the soil's colour. No additional terrain texture samples or new image downloads were added.
- Procedural and reference-farm wood now uses transported shared cross-sections through bends, closed ends and small embedded fork collars. Original branch centreline inputs, foliage transforms, random streams, colliders and wind hooks are preserved.
- Replaced three assembled yard kits with eleven individual object types, each with eight deterministic variants. Crates have beveled boards and nail heads; baskets have open woven splints; sacks have folds, seams and gathered cuffs; hay has irregular straw and twine; vessels have shaped necks and rims; tools have connected handles, sockets and shaped steel.
- Yard generation independently selects object inventory, geometry variant, count, wall position, lean and support preference. Irregular clusters, offset hay stacks, supplies on crate lids and nested baskets are possible. Buildings retain clear entrance reservations. Tools use actual wall-board surfaces and rigid ground contacts, with no affine shear.
- Larger metre-scale props remain static and are merged by shared material, with a 25,000-triangle yard ceiling. Seven active shared materials and bounded caches avoid per-object draw calls. Tree closure adds about 10–12% static tree triangles in the audited sample, with unchanged tree draw calls; this release makes no FPS improvement claim.

## Preserved world

The fixed world seed, field/settlement generator, lake shapes, roads, power lines, clouds, wheat placement, reference-farm layout and building models are byte-identical after import-version normalization. Only soil appearance, wood connectivity and yard decorations change. Reopening or revisiting a coordinate reproduces its yard arrangement. All module/worker/boot imports are stamped together as V10.

## Verification

- 111 tree/shrub/reference-tree builds: exact original centreline inputs, foliage data, colliders and random results. Audited 5,540 closed tubes with zero open edges, inconsistent winding or degenerate faces. Twelve native GLES comparison views have no GL errors.
- All 88 final object variants: finite mesh data, unit normals, actual bounds and wall contact vertices, resource sharing, ground-envelope correctness under rigid leans, and object triangle budgets. Seven native close-ups have no GL errors.
- Layout sweep: 192 scenes across eight building variants with different seeds, rotations and scales; 192 distinct spatial topologies and 190 distinct inventories. Sixteen repeated-generation comparisons match. Ground contacts and entrances pass; 96 upper tool contact points raycast against the actual building triangles with maximum error below one micrometre. Final object revisions received an eight-building contact/budget smoke check.
- Final integrated V10: browser-module syntax checks; 59 actual GLSL programs compile/link under native GLES; 11 worker-stream cases cover initialization, cancellation, disposal and rebuild; 14 scene-packet cases preserve geometry, matrices, colours, texture bytes, shader source and live wind bindings.

Validation uses native Node workers, Canvas2D and GLES geometry/material renders. It does not establish browser-specific behaviour or hardware FPS.

## Asset construction references

- https://www.lehmans.com/products/old-time-poplar-bushel-baskets — splint basket construction.
- https://www.bullytools.com/products/lawn-and-garden/shovels/14-gauge-round-point-shovel/ — round-point head, socket and handle connection.
- https://www.museum.state.il.us/exhibits/agriculture/htmls/technology/hand_tools/tech_hand.html — agricultural hand-tool and basket silhouettes.
- https://comlib.org/2022/farm-scythe/ — stored wood-and-iron farm scythe.

The scene objects are authored representative models, with sizes adjusted for the requested legibility; they are not exact museum reproductions. No reference imagery is redistributed.
