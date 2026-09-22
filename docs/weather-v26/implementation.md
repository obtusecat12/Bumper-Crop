# V26: optical lens water, GPU splashes and rain

The previous CPU splash animation and floating ripple meshes are replaced. Water effects still feed the existing scene → lens → UI → official ntsc-rs VHS / PS1 chain. World generation, vegetation, buildings, UI, weather probabilities and the 1080-line VHS preset are unchanged apart from cache URLs.

| Requirement | Implementation |
| --- | --- |
| Transparent lens water | Height-derived normals baked to a real half-width, half-height RGBA8 optical target. Two-interface refraction distorts actual captured scenery, with local enlargement/inversion and subtle RGB dispersion. |
| Defocus and illumination | Two quarter-resolution separable Gaussian passes; local close-focus blur, dielectric Fresnel, directional highlights, narrow dark rims and scene-derived reflections. Humid highlights receive a restrained glow. |
| Flowing heads and trails | Bounded 30 Hz mass model; gravity, camera acceleration/roll, lateral drift and attraction toward existing wet paths. Separate static and dynamic adhesion thresholds. Fixed heterogeneous glass sites cause repeated stops and releases. |
| Tension and residual beads | Anchored rear contact, narrowing neck, pinch-off into pinned satellite beads, mass-conserving merging/deposition. Trail edges recede as water evaporates; humidity slows drying. |
| Camera entry and emergence | Actual camera-height hysteresis at −0.018 / +0.028 m around the surface. Continuous rippling film during immersion; 0.3–0.7 s rupture after emergence, patches and draining heads, brief blue shift. |
| Rain lens impacts | Directional relative rain flux with pitch, wind and camera velocity; up to 16 concave-center/raised-rim refractive impacts lasting 0.3–0.8 s, then beads or mobile heads. |
| Splash crown and column | Connected procedural instanced crown with curling lip, irregular rim and late rupture; delayed connected Worthington-style column with narrowing and delayed breakup droplets. Roughness changes across the sheet and rim. |
| Airborne drops and mist | 1536 faceted drop slots and 384 spray slots. Analytic gravity and linear air drag run in vertex shaders. Parameters upload at spawn/rebase only; inactive vertices exit early. Three effect draw batches. |
| Actual water ripples | 256×256 ping-pong shallow-wave field over a moving 16 m square. Signed 16-bit heights packed in RGBA8 avoid float-target requirements. 60 Hz, wave speed 1.5 m/s, Courant number 0.4. A 64² shoreline mask absorbs dry cells. |
| Normal-only wave response | Entry, collapse, representative droplet returns and rain impacts inject signed impulses. Normal/reflected-texture shading changes on the existing lake mesh; impact waves do not alter vertices. No floating ring mesh. |
| Spatial rain | 2600 immutable instanced billboard seeds in a camera-relative volume, motion-exposure stretch, wind, camera-relative velocity and directional light response. Conservative terrain/roof support texture clips rain. |
| Ground rain effects | GPU ballistic microdroplets and low thin spray mist. Most impacts are within 7 m; water hits feed the wave field. Rain adds analytically integrated exponential height haze. |
| Dry/idle optimization | Lens capture and all lens passes stop when dry. Half-resolution normals cache between physics ticks; Gaussian buffers use quarter dimensions. Rain/splash pools are bounded and hidden when inactive. Wave window and active-time bounds prevent an infinite-world simulation cost. |

The former 0.62 m pond-floor clamp prevented camera immersion. Movement now follows the existing lake bed, retaining water slowdown, collision and shore teleport rules. This is bottom-walking, not a new swimming system. Underwater strides no longer emit surface crowns; actual crossing and emergence coordinate the lens and surface effects. Lake faces render from below as well as above.

During validation, broad gray drop rims were traced to excessive normal slope and an inappropriate total-internal-reflection approximation. Correct central derivatives and a transmitted two-interface model remove those rims without hiding the water. A second audit found that initial release did not prove repeated stick-slip: fixed spatial adhesion sites now produce multiple measured pauses and releases for tracked heads.

## Verification

- `node tests/water-v26/run.mjs`: mass balance, humidity response, camera hysteresis, film rupture, signed impact rings, repeated stick-slip, renderer-state restoration, dry skipping, GPU attribute immutability, lifetimes, BigInt rebasing, shelter clipping, disposal and unchanged world/UI/VHS sources.
- Native GLES compiled and linked 14 distinct expanded shader program pairs with zero errors. Captures cover crown/column timing, camera-relative rain, water-wave propagation and worker-hydrated lake materials.
- At 1440×1080, lens normals are 720×540 and blur targets 360×270. Five actual frames were processed using the bundled official ntsc-rs WASM and the existing 1080-line preset. Transparent refraction and trails remain visible.
- A real reference-barn roof audit sampled 1800 interior roof points; no rain clipping gaps or sheltered impact leaks were found.

See `checks.json`, `render-validation.json`, `wave-numerics.json` and `rain-roof-check-report.json`. Native captures use representative geometry; the lens background is a previous native farm render with a diagnostic grid. This is not a full browser playthrough or a target-device FPS measurement. Splash/adhesion/film models are bounded real-time approximations, not a full 3D fluid solver or calibrated camera optics.

## Primary references and inspected photographs

- [NVIDIA Rain SDK white paper](https://developer.download.nvidia.com/SDK/10/direct3d/Source/rain/doc/RainSDKWhitePaper.pdf): GPU billboards, rain appearance and view/light dependence. Reference rain photographs inspected.
- [GPU Gems: Effective Water Simulation from Physical Models](https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-1-effective-water-simulation-physical-models): separate coarse surface motion and fine dynamic normals.
- [Gekle and Gordillo: Worthington jets after cavity collapse](https://arxiv.org/pdf/0907.5154): high-speed photographic sequences in Figures 5–6 inspected for delayed jet formation.
- [Peters et al.: crown breakup after disc impact](https://arxiv.org/pdf/1211.6641): photographs in Figures 1 and 4 inspected for connected sheets, rim fingers and detached drops. Experimental disc thresholds are not used as literal foot-impact thresholds.
- [Study of magnification and angular resolution of a water droplet](https://arxiv.org/pdf/2502.13237): photographs in Figures 3–4 inspected for nonlinear magnification and local focus.
- [PBRT: Specular Reflection and Transmission](https://www.pbr-book.org/4ed/Reflection_Models/Specular_Reflection_and_Transmission): dielectric refraction and Fresnel treatment.
- [Morphological transitions of sliding drops](https://arxiv.org/pdf/1607.05482): tails and pearling. Its smooth-substrate model does not supply the separate contact-angle hysteresis approximation used here.
- [Spinning twisted ribbons in a curved liquid film](https://arxiv.org/pdf/2411.10562): high-speed Figure 1 inspected for holes, thickening rims and remaining ligaments. The game's 0.3–0.7 s camera-film timing is an artistic parameter, not a fit to that experiment.
- [Finite Difference Computing with PDEs](https://hplgit.github.io/fdm-book/doc/pub/wave/html/._wave-solarized004.html): stability bound for the explicit 2D wave scheme.
- [Three.js InstancedBufferGeometry](https://threejs.org/docs/pages/InstancedBufferGeometry.html) and [WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html): instancing, framebuffer capture and target lifecycle.
