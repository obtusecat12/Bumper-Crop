# V64 visual refinement

This continuation targets two remaining weaknesses visible in V63's native diagnostic renders: straight manufactured stair fronts and wire-like waterfall strands. It preserves the 18.58 m² water survey, shell, original caustics, generated textures, independent Level 27 navigation and same-shower/exact-street return behavior.

## Stone geometry and movement

Each of the ten fronts now has an independently curved plan with irregular rounded edge relief. The mesh and walking function share `stairBoundary`, `stairLocal`, `treadHeight` and `treadRelief`; the map draws those same fronts. Vertical weathering recesses inside the stone footprint. An early outward side perturbation produced a 119 mm mismatch near one edge; it was rejected and corrected. Final 270-point geometry check: maximum visible/collision difference 0.467 mm. The 2,389-sample round trip is unobstructed, with maximum sampled rise 177.92 mm. The submerged floor and 18.58 m² water polygon are unchanged. Step and bed shaders now sample their own roughness maps instead of using dry-wall roughness for every material.

## Lens audit

No additional lens source change was needed. V63's 1024-pixel optical raster, unquantized gradient, continuous coverage, linear sampling and full internal-resolution wet composite remain intact. The read-only audit checked desktop and mobile portrait/landscape dimensions. Pixel and PS1 modes intentionally retain their whole-frame nearest-neighbor/pixel presentation; this is separate from the corrected coarse optical silhouette. No device FPS claim is made.

## Validation scope

`geometry-check.mjs` writes the current bounded route/geometry report under `results/`. The existing V63 entry-return, render-state and navigation checks were rerun against V64. They passed same-shower/BigInt return, F2/inventory preservation, independent map rendering, no sampled-render-target feedback, 1280×720 VFX binding and renderer state restoration.

Native scene export/render scripts remain in `tests/spring-v63/`; set `QA_VERSION=V64` on Python render commands to label updated evidence correctly. Native diagnostics use actual geometry and shader source with a software GLES driver. They approximate physical transmission and point shadows and omit browser UI and final lens filtering. The supervised browser was already confirmed unable to create WebGL2; these images are not browser screenshots or hardware performance measurements.

## References consulted

- Three.js material transmission/reflection documentation: https://threejs.org/docs/pages/MeshPhysicalMaterial.html
- Cave terrace/step reference search: https://4travel.jp/travelogue/11770072
- Cave cascade reference search: https://www.swissactivities.com/en-ch/beatus-caves/

These are construction/shading references. Shipped texture artwork remains the eight original generated V63 assets and preserved earlier caustic maps.

## Final cascade treatment

The final falling-film geometry removes curtain-wide sinusoidal folds, center meander and full-height round rods. There are seven unequal shallow rivulets per fall. Every sheet, rivulet and creek vertex receives a finite time-of-flight/contact/speed profile; shader flow accelerates through drops and resets at ledge contact. Local foam marks ledges and the existing impact system owns the pool landing. Entrained microbubble scattering makes fast clear spans visible without the rejected continuous grey-white reflection bands. This is an authored gravity-informed profile, not a solved bulk-fluid simulation. Screen-space refraction uses the view-space normal and camera projection. Ambient reflection remains an explicit captured-illumination approximation.

The cascade/creek asset has 32 meshes and 50,406 triangles (previously 40 and 61,606). The 4,096 GPU impact particles, gravity compute and impact shaders are unchanged. Final scene shaders compile/link in the native GLES renderer; the near cascade, stair view and steam overview render without GL errors. The revised near view was inspected after rejecting the first candidate's remaining smoke-like bands. Scene outputs are in `results/` and clearly labelled V64/native GLES.
