# V16 picture and material refinement

V16 keeps the deterministic world, geometry, object counts, diffuse ray worker
and shadow-cache architecture. VHS becomes a correctly projected 640×480 4:3
picture with centered black bars. Luma smear changes from 0.50 to 0.40; the
official ntsc-rs core, soft chroma and 1.16 saturation stay in use. See
[the filter notes](vhs-filter.md) for scheduling and signal details.

## Material response

The existing linear overcast sky now also supplies rough specular illumination.
A polynomial approximates the first directional moment of a GGX prefilter;
against numerical integration at 1,001 roughness values, its largest coefficient
error is approximately 0.000512. Three.js's roughness-dependent reflection
direction is retained. This introduces no cubemap, new texture sample or pass.
It represents low-frequency sky reflection, not reflections of nearby objects.

For Standard materials, irradiance and reflected sky enter before Three.js's
indirect-light accumulation. Its existing split-sum BRDF then balances diffuse,
single scattering and multiple scattering. The GI-to-sky luminance ratio adds
bounded empirical specular occlusion, with matching weather in the denominator.
Lambert materials retain their previous diffuse path.

Existing albedo and terrain values also drive modest roughness variation in
soil, damp ruts, bark, leaves and weathered surfaces. Bark/leaf microrelief uses
derivatives of already sampled albedo and fades with the UV footprint. No new
normal/roughness textures, geometry or draw calls are introduced. These settings
are appearance-calibrated approximations, not measured material scans.

Water is dielectric, with normal-incidence reflectance 0.0203732 (IOR 1.333).
The previous unshadowed emissive sky/glint overlay is removed. Direct lighting
now uses the existing sun/shadows; the new sky response provides broad reflection.
Wave geometry, animation, water color and terrain remain unchanged.

## Work reduction

- Fixed 640×480 VHS reduces processed pixels by about 25% versus the previous
  854×480 signal on a 16:9 window. The one-frame worker/readback limit remains.
- Cloud integration retains 16/32/48 samples at the same altitude distribution.
  CPU-side step tables replace two repeated `pow` operations per ray step.
  Only floating-point rounding differs; density and lighting are unchanged.
- Obstructed irradiance interpolation computes visibility weights before
  reading SH color. A probe is omitted only below 0.0001 of total normalized
  weight, bounding omitted weight below 0.0004. Relative thresholds avoid
  discarding all probes in dark interiors. This is a bounded approximation,
  not an assertion of byte-identical images or guaranteed GPU speedup.
- Existing background BVHs/probe caches, cached cascaded shadows, asynchronous
  shader compilation, visibility culling and paused map rendering remain active.

## Scoped verification

On 2026-09-12, 34 actual material shader pairs compiled and linked in GLES 3.2,
including worker-restored leaf depth materials and the full 48-entry cloud
uniform. Maximum active samplers: 12, below WebGL 2's guaranteed 16.

Eight native images compare V15/V16 building, tree, yard, interior and lake
views. All completed without GL errors. Geometry hashes, draw counts, texture
counts and texture bytes match between versions. The lake loses the old false
emissive glints, and building highlights remain restrained. These renders use
actual scene generators and ray probes, but omit the complete browser pipeline.

The official WASM clarity comparison retains soft color and shows a small
increase in roof/leaf edge definition. Module syntax and asset/import paths are
checked separately. No end-to-end browser, user-device FPS or power measurement
has been made. Native compile/render results and isolated CPU timings cannot
establish smoothness on every device.

## Primary references

- [ntsc-rs signal implementation](https://github.com/ntsc-rs/ntsc-rs/blob/main/crates/ntscrs/src/ntsc.rs)
- [Three.js perspective camera](https://threejs.org/docs/pages/PerspectiveCamera.html)
- [Filament image-based lighting](https://google.github.io/filament/main/filament.html#lighting/imagebasedlights)
- [Filament specular occlusion](https://google.github.io/filament/main/filament.html#lighting/occlusion/specularocclusion)
- [Three.js PMREM](https://threejs.org/docs/pages/PMREMGenerator.html), considered for richer environment maps but unnecessary for this low-frequency sky
- [MDN WebGL best practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices)
