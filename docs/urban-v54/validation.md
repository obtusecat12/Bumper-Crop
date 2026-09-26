# Level 11 V54 validation

## Shipped changes

- Eighteen authored parcels now contain 44 buildings, connected footways, rear streets, shop windows and street furniture around the clinical plaza. Existing shop/sign libraries are reused with deterministic assignments.
- A permanent, clipped asphalt owner spans the reserved landmark area through the Level 10 to Level 11 transition. Road and paving ownership no longer depends on which city chunks have loaded.
- The pharmacy has a full building volume and a recessed entrance. The switchback ramp has solid supporting geometry, connected landings and rails. Roof equipment and the dish have connected supports.
- Two newly generated transparent palm-frond textures and three newly generated PS2-style decorative surfaces (terracotta, bench wood, municipal green metal) are packaged locally. Leaves use 512×256 textures; decorative surfaces use 256×256 textures. Generation prompts and provenance are retained in `assets/`.
- The fountain has 12 continuous nozzle jets, 20 rim overflow streams, 96 animated droplets and localized impact ripples. The transparent surface reveals the actual tiled basin. It adds three liquid material batches and 7,856 triangles, with shared time uniforms and no per-frame geometry allocation.

## Verification performed

- JavaScript source and module checks passed.
- Ground/structure checks: 125 road samples have a single ground owner; eight footway samples match the visible surface; 981 pedestrian samples pass along the courtyard, ramps, rear street and plaza connections. All 18 parcel footprints clear the protected existing building masses. Eighteen district texture files decode successfully. Exact results are in `../../tests/clinic-v54/results/geometry.json`.
- The Level 10 approach passed 481 route samples, Level 10 → Level 11 → F2 → Level 10 lifecycle checks and deferred resource release checks. All five F2 city/photo destinations preserve coordinate rebasing and reset the camera.
- All 116 actual material shader programs, including the fog, finish and shadow modifications and all three new liquid materials, compiled and linked under Mesa OpenGL ES 3.2.
- Nine views were rendered from the actual scene geometry, textures and modified material shaders and visually inspected. They cover the clinic front, pharmacy depth, roof dish support, ramp structure, bakery street connection, clinic rear, plaza outward view, plaza shops and fountain. Each renderer run reported zero GL errors. Images are retained in `inspection/`.

## Scope of the visual checks

The inspection images are software GLES diagnostic renders, not browser screenshots. The diagnostic renderer uses the authored light direction and a separate diagnostic shadow/sky pass; it does not prove that the complete browser presentation or input handling is identical. Browser preview was unavailable in this environment. No browser performance or frame-rate claim is made.

The water uses transparent blending, animated normals and inexpensive local palm/shop reflection proxies. It does not implement screen-space refraction or full scene reflections. Its time-dependent geometry and shading are separately checked at two timestamps before publication. Exact photographic or pixel-level equivalence is not claimed.
