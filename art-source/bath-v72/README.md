# Bath reception, changing room and loading album — V72

The update enlarges the reception to 9.6 × 7.2 m and inserts an 8.2 × 6.24 m changing room. The existing counter is turned against the right side with a service aisle; its dispenser, telephone, books and connected power lead remain. Four existing street-corner chairs and a physical three-pocket newspaper stand sit on the left. The left reception door leads through the changing room to the forward-right opening into the protected original empty pool. The basin, stairs, murals, showers and Venetian spa remain.

## Generated images and provenance

- `photos-a/`: five independent generated photographs, `manifest.json`, prompts, fresh prompt-guide downloads and original images.
- `photos-b/`: five further independent photographs, `provenance.json`, prompts, fresh prompt-guide downloads and original images.
- `materials/`: seven independently generated six-panel PBR atlases, an independently generated 2006 newspaper, prompts and `manifest.json` including SHA-256 hashes. Each atlas contains BaseColor, tangent normal, roughness, metallic, AO and height. Cropping/encoding only; maps were generated as images, not derived from diffuse.
- Runtime: ten 1280 × 960 WebP photos in `dist/textures/bath-loading-v72` and 42 512² maps plus newspaper in `dist/textures/changing-v72`.
- Every photo prompt includes the exact requested wording: `2000-2010年代照片，展示各种各样的不同的浴池，没有人，如同随手拍摄的数码相机画面，美国，构图不太好`.
- Every image call used the requested unchanged-prompt prefix, after downloading and reading the user's external prompt guide afresh. Relative manifest filenames resolve inside their own provenance folder; original absolute generator paths are historical provenance.

## Geometry and rendering

Thirteen double lockers provide 26 doors with real punched openings, formed louver hoods, recessed number frames, physical locks/hinges/pulls, dents and unequal reveals. Two rounded five-slat benches have pipe trestles, flanges, bolts and continuous draped cloth meshes. The vanity has two actual holes, lathed recessed bowls, goosenecks, cross valves and connected P-traps. Two curled mats, two open laundry baskets, a separate slow fan rotor, vent louvers and caged twin-tube lamps complete the room.

One tile texture repeat equals 0.4 m. The generated height field lowers ceramic roughness in the grout and patchy damp areas; there is no added puddle plane. Condensation uses the generated normal/roughness maps and a projected scene reflection, with the wiped center clearer than the edge. Four area lights use official Three.js r180 LTC tables. Point shadows are PCFSoft and frozen between visibility changes. One lamp varies subtly through coherent noise, with a soft 60/120 Hz hum attenuated by distance and muted on pause/exit.

The shared opaque color/depth feeds a 12-tap screen-space AO pass and eight spatial samples of shallow doorway steam. Bloom reuses the existing selective Gaussian mip-chain implementation rather than introducing a second postprocessing framework. The 320 × 180 planar mirror updates at most 6.25 Hz in its room. Static surfaces are material-batched; moving parts and the hideable mirror remain separate. This implementation does not add full-room screen-space reflections or pretend a static reflection cube is SSR.

## Loading and checks

The DOM album covers the game before reading the new materials or constructing the room. Ninety generator yields spread construction work; parallel shader compilation is used where the browser supports it. Input is cleared/locked through loading. Real preparation phases drive the monotonic progress bar; the slideshow changes every 3.8 seconds and loads one photo ahead. It does not hold the player until all ten photos have played. Re-entry reuses the scene. Texture or shader failure restores the saved street pose and offers a return button.

Checks are in `tests/bath-v72/results`:

- `layout.json`: 1,136 sampled walk-path positions, including both doors, service aisle, shower and spa routes; furniture collisions checked.
- `model.json`: all 43 new image assets decoded, finite model positions, 90 construction yields, independent mirror and four area lights; 136 meshes and approximately 566k triangles across the complete bath plus existing spa. Node construction timing is not gameplay FPS.
- `entry.json`: actual production entry/exit functions checked with a stubbed renderer: paint-before-build, duplicate entry, cached re-entry, exact BigInt pose/shadow restoration and safe failure recovery.
- `lobby.png`, `waiting.png`, `lockers.png`, `vanity.png`, `locker-detail.png`, `empty-pool.png`, `loading.png`: real Chrome 154 browser captures through the preview-only harness, with SwiftShader software WebGL2. The harness uses production geometry, materials, lights, reflection, AO, steam and bloom; it does not include the full game HUD/display filter. Loading capture holds the production overlay at 42% for inspection.
- Full browser-module syntax validation and the existing spa runtime regression check passed. Browser console has no shader/JavaScript errors; software Chrome reports the unavailable parallel-compile extension and takes its fallback.

The preview-only harness is served by `scripts/preview.mjs`; it is not in the public static build. Hardware frame rates and end-to-end loading duration vary with the client and were not measured here. Existing large construction chunks can still briefly block JS, while the loading image remains displayed.

## Primary implementation references

- [RectAreaLight](https://threejs.org/docs/pages/RectAreaLight.html) and [RectAreaLightUniformsLib](https://threejs.org/docs/pages/RectAreaLightUniformsLib.html).
- [WebGLRenderer and compileAsync](https://threejs.org/docs/pages/WebGLRenderer.html).
- [Screen-space ambient occlusion reference](https://threejs.org/docs/pages/SSAOPass.html).
- Vendored LTC modules are from the official [Three.js r180 examples](https://github.com/mrdoob/three.js/tree/r180/examples/jsm/lights), with imports adapted to the existing local Three module. Existing `dist/licenses` Three.js MIT notice applies.
