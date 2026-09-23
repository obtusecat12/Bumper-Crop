# V28 water, submersion and fused retro optics

The later performance instructions override the earlier separate-pass/1080p processing request. The public canvas remains 1440×1080 in the established 4:3 VHS mode; its core scene and official ntsc-rs input are 960×720. Half-resolution optical composition is 480×360. Only the final presentation uses nearest enlargement. PS1 320p mode remains available.

## Actual execution graph

1. Render opaque 3D, world-space splash/bubbles and animated bottom caustics into the internal linear color/depth target.
2. If a loaded lake exists, copy opaque color/depth into a separate water target, then draw only layer-2 water. The shader reads the immutable opaque target, never its own attachments. This is depth preparation for 3D water, not a postprocess ping-pong chain.
3. One half-resolution shader fuses water-column absorption, wet-front-glass optics and ten Poisson DOF taps. At EACH sample: derive wet normal, warp its UV, read matching scene color/depth, apply absorption on that ray, add lens optics, accumulate into DOF. Axial R/G/B tap radii differ by 5.5%; three channel positions mean 30 scene samples before the extra wet-reflection/depth reads, not ten total texture fetches.
4. One cheap internal-resolution resolve combines in-focus scene preservation, ACES/output transfer, retained UI and the existing input saturation/orientation conversion. UI remains under the final tape/PS1 filter. No separate full-screen lens, underwater, Gaussian blur or DOF pass remains.
5. The unmodified official ntsc-rs WASM processes the internal frame through the existing bounded worker pool. Latest completed sequence wins; readback has one PBO/fence in flight. The previous 30Hz new-frame cap is replaced by a maximum 60Hz dispatch cadence.
6. Nearest presentation enlarges the completed tape frame to the output canvas. There is no sharp scene or HUD overlaid afterward.

Only the final presentation touches 1080p. Both 3D render targets are capped at720 lines; the expensive optical shader is half that height. 960×720 has 44.44% of the pixels of1440×1080 (55.56% reduction). 480×360 has11.11% of the old full size. These are pixel-count comparisons, not an unsupported claim of80% total bandwidth savings.

## Specification coverage

| Requirement | Implementation |
|---|---|
| No parallel wind-wave sine/Gerstner field | Removed `WATER_WAVES`; fixed low-poly shared water geometry, two isotropic normal textures |
| Exact normal velocities/scales and merge | `(0.03,0.02),1.0`; `(-0.02,0.04),1.37`; whiteout `normalize(n1.xy+n2.xy,n1.z*n2.z)` in world-XZ/lake-origin coordinates |
| Dynamic radial wave | Analytic Gaussian envelope and cosine radial phase, differentiated into a single256² normal target at30Hz. No vertex impact displacement. Event positions stay fixed through chunk rebases; published sampling origin changes only with the texture |
| Snell window | DoubleSide; backfaces use `refract(V,-N,1.33)`, zero vector produces dark underwater reflection |
| Retro highlights | Exact `floor(spec*4)/4` quarter-step highlight quantization. This formula is not literally a16-bit framebuffer |
| Three-stage lake floor | 0–8m shallow shelf,8–17m descent,17–39m deep basin; four-octave fBm gated off at shore. Shared authoritative terrain/collision function. Fixed lake outlines/locations retained |
| Depth soft edge and foam | High-precision depth samplers, linear depth subtraction, clamp(thickness/.65); moving noise foam restricted to0<thickness<.3m |
| Independent world impact | Strict previous bottom>surface>=current bottom; interpolate the collision point. No head-entry/exit amplification of world splash. Crown, delayed Worthington jet, droplets and mist use fixed instanced pools |
| Ballistics/lifetime/Bayer | `P0+V*t+.5*(0,-9.81,0)*t*t`; droplets1.5–2.5s; true InstancedMesh, no transparent blending,4×4 Bayer discard, near fade and hard .25m vertex rejection |
| Five-state arbiter | Dry/rain/entryWash/submerged/exitRupture. Entry washWeight=1, rain channels hidden underwater. Body and head arbiters are separate |
| Underwater volume | Linear RGB Beer–Lambert sigma(.3,.08,.02), reconstructed ray length; upward rays stop at the water plane rather than absorbing the air/sky distance |
| Caustics | Sixteen256² frames in a1024² atlas. Snell-refracted photon splats, temporal interpolation15→0; linear data, no atlas mips |
| Bubbles |60 entry particles .3–1m ahead, camera-oriented billboard quads, +Y acceleration, high-frequency horizontal wobble, GPU shrink at surface and hard .25m proximity cull. World anchored after spawn |
| Emergence | Exactly .15s exposure/Bloom envelope, whole-film fisheye pull, spatial rupture and top-down curtain; retained mass drains into seven mobile heads and deposited streaks |
| Rain/front glass | Existing mass-conserving pooling, adhesion thresholds, stick-slip, trails, beads and impact rings retained; finite normals are cached into a small data texture only when physics changes. Dry optical branch skipped |
| DOF/AF | Exact requested CoC; ten half-res Poisson positions, RGB radius offset, matched warped depth, additional close-lens softening, foreground weighting.12Hz center ray against existing collision proxies/terrain; analytic underdamped spring, ±.35° breathing from a fixed base FOV |
| Camera | Existing V27 two-band fractal Perlin, second-order inertia, asymmetric figure-eight contacts and landing impulses retained. Movement and rig inputs are reused singleton records |
| Resource lifecycle | Bounded event pools, no per-drop CPU trajectory update, shared texture/material ownership, context loss reset, instance disposal, unchanged official NTSC core/preset |

Two signs from the supplied prose must be interpreted physically: an inward-positive distance deepens toward the lake interior, and the camera/focus spring restoring force is `k*(target-current)-c*v`. Applying the written negative sign to `(target-current)` would diverge.

## Validation and measured limits

- `npm run check`: all application modules parse.
- `npm run test:water`: state/crossing/lifetime/instancing checks,198 lake seam samples,256 fixed-world field comparisons, unchanged non-lake heights and non-water content hashes, feedback-free render graph, cached texture/origin behavior, existing water mass/rain tests and actual handheld integration.
- Native OpenGL ES3.2 compile/link for all ten new/changed programs. Separate native render fixtures show actual lake geometry with the real water shader and diagnostic ground lighting, and controlled optical comparisons. These are expressly not browser screenshots of the complete game.
- White at five metres absorbs to8-bit `(57,171,231)`, matching analytic `(56.898,170.932,230.734)` within quantization. Dry optics are an identity.
- Official ntsc-rs standalone Node benchmark:720p median28.59ms vs1080p62.86ms on this server. This is one CPU worker's effect processing only, not end-to-end browser FPS.
- llvmpipe software ES renderer fused-pass timing: dry10.52ms, rain18.83ms, underwater16.70ms at480×360. Software rasterizer timings cannot predict the user's GPU.
- 60FPS is a target, not a guarantee. The full game, driver, worker concurrency, UI, readback and target device must be measured together. The F2 panel continues reporting CPU/GPU time and actual completed VHS-frame FPS/latency.

No compatible managed browser preview exists for this static Sites checkout. Native shader/geometry rendering and module/integration tests were used; complete browser/device FPS remains unmeasured.

## References consulted

- [Three.js depth-texture example](https://threejs.org/examples/webgl_depth_texture.html) and [DepthTexture](https://threejs.org/docs/pages/DepthTexture.html): opaque-depth inputs and linearization.
- [Self Shadow: Blending in Detail](https://blog.selfshadow.com/publications/blending-in-detail/): whiteout normal composition.
- [Khronos GLSL4.60 specification](https://registry.khronos.org/OpenGL/specs/gl/GLSLangSpec.4.60.pdf): `refract`, total internal reflection, ordered smoothstep edges.
- [GPU Gems2: Rendering Water Caustics](https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-2-rendering-water-caustics): Snell refraction and photon accumulation. Original authored data texture generator is included alongside this document.
- [PBRT: Transmittance](https://www.pbr-book.org/4ed/Volume_Scattering/Transmittance): exponential absorption along the ray.
- [GPU Gems3: Practical Post-Process Depth of Field](https://developer.nvidia.com/gpugems/gpugems3/part-iv-image-effects/chapter-28-practical-post-process-depth-field): CoC and foreground limitations.
- [GPU Gems: Real-Time Glow](https://developer.nvidia.com/gpugems/gpugems/part-iv-image-processing/chapter-21-real-time-glow): bright-sample Bloom.
- [Ryan Juckett: Damped Springs](https://www.ryanjuckett.com/damped-springs/): stable analytic damped integration.
- [Perlin's improved noise](https://cs.nyu.edu/~perlin/noise/): existing handheld motion basis.
- [Edmund Optics: Chromatic and Monochromatic Aberrations](https://www.edmundoptics.com/knowledge-center/application-notes/optics/chromatic-and-monochromatic-optical-aberrations/): axial color behavior.
- [MDN WebGL best practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices): bounded targets, avoiding feedback and synchronization.
- [ntsc-rs](https://ntsc.rs/): original vendor WASM remains unchanged.
