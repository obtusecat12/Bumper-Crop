# Cached hybrid lighting

V15 adds actual triangle-ray one-bounce diffuse illumination and cached cascaded soft sun shadows. It preserves the deterministic world layout, geometry density, clouds, map and V14 ntsc-rs display pipeline.

## Why this architecture

The renderer is Three.js r180 WebGL2. A single slowly changing sun and a mostly static infinite world benefit from amortized diffuse probes and cached shadow maps. A full screen path tracer would need additional geometry/material conversions, large acceleration structures and temporal reconstruction on every frame. ReSTIR is primarily useful for sampling many lights; it adds unnecessary reservoirs for this scene. SVGF is appropriate for noisy per-pixel signals, but this low-frequency static cache has no screen-history reprojection requirement.

References used in the design:

- [DDGI integration guide](https://developer.nvidia.com/blog/an-engineers-guide-to-integrating-ddgi/) and [production probe GI](https://jcgt.org/published/0010/02/01/paper-lowres.pdf): irradiance caching, visibility moments and relocation.
- [PBRT BVH chapter](https://pbr-book.org/4ed/Primitives_and_Intersection_Acceleration/Bounding_Volume_Hierarchies): acceleration and bounded ray traversal.
- [Spherical harmonic irradiance](https://graphics.stanford.edu/papers/envmap/): compact directional diffuse lighting.
- [Three CSM](https://threejs.org/docs/pages/CSM.html) and [LightShadow](https://threejs.org/docs/pages/LightShadow.html): cascaded directional shadow maps and explicit update control.
- [NVIDIA PCSS integration](https://developer.download.nvidia.com/assets/gamedev/docs/PCSS_Integration.pdf): blocker search and contact-dependent penumbrae.
- [ReSTIR](https://benedikt-bitterli.me/restir/) and [SVGF](https://research.nvidia.com/labs/rtr/publication/schied2017spatiotemporal/): considered alternatives, not implemented.

The probe solver, terrain albedo counterpart and filtering code are original implementations. The three CSM files are the official r180 MIT code with local import paths; their license is included.

## Runtime

- Export actual LOD0/LOD1 ground, walls, props, branches and leaves in the generation worker. Alpha-cut leaf UVs and masks survive transfer; solid walls remain solid even when rendered double-sided. Fine wheat and grass do not cast shadows or occlude the low-frequency ray cache.
- Build immutable per-chunk stackless triangle BVHs in a separate worker. Trace 32 deterministic spherical directions per probe with next-event sun visibility and one secondary sky visibility sample per diffuse hit. Ground bounce uses the real brown/green albedo, averaged below probe resolution. Solid backfaces contribute no radiance.
- Keep a rolling 19×7×19 probe grid, spaced 4×2×4 metres, and an LRU of at most 10,000 probes. Absolute integer keys survive world rebasing. Changed tiles invalidate only their finite primary-plus-secondary ray influence range.
- Work in roughly 6 ms slices followed by 12 ms yields. Pause during the map, hidden page and context loss; replace superseded requests. Exchange completed volumes atomically; no continuing ray work is scheduled for an unchanged volume.
- Store directional E/PI coefficients and six visibility moment lobes in seven half-float 3D textures (~138 KiB). Open areas use hardware SH interpolation; obstructed areas use four visibility-aware tetrahedral samples. An immutable one-cell status dilation prevents the fast path crossing nearby invalid or obstructed probes.
- Use two PCSS-style sun cascades with four blocker and eight filter samples, matching the cloud sun direction. Shadow resolution follows the existing quality setting. Dynamic light-space bounds include the cascade fade intervals and photo viewpoints.
- Cache texture and shadow matrices together. Ordinary motion targets at most 10 Hz; leaf wind uses 5 Hz; empty static scenes retain maps. Coverage checks, streaming, teleports and rebases can require an immediate refresh. VHS cached-display frames perform no new scene/shadow draw.
- Natural sky/ground bounce replaces the previous strong uniform hemisphere fill. Grass receives lighting with upward canopy normals on both card faces. Leaf shadow materials use the same wind displacement as their visible geometry.
- Local cached illumination meters a slow, bounded camera exposure adjustment inside dark buildings. It requires no extra framebuffer readback. Outdoor exposure retains the previous baseline.

## Verification on the development host

- All application modules parse. 33 distinct material shader pairs compile/link under Mesa GLES 3.2, including CSM+GI, sward, wheat, water, ordinary leaf depth and alpha farm leaf depth/distance after the worker codec.
- Native rendered comparisons use actual building/tree/yard/ground generators, two 1536² depth maps and real worker probes. Exterior shadows attach to the geometry; indoor occlusion and exposure retain visible structural detail. No GL errors. These scoped renders omit the full browser, sky and VHS stage.
- 400 actual CSM combinations covering orientation, portrait/wide aspect ratios and photo lenses had zero receiver XY/depth clipping. Ten-second simulations: static one refresh, leaf wind 5 Hz, walking about 4 Hz, running/turning 10 Hz. Skipped frames keep identical matrices. Material detach/reattach restores compiled CSM state.
- BVH checks cover nearest hits against Three raycasting, alpha transparency, thin/backface handling, analytic sky integration, enclosed solids, relocation and chunk offsets.
- A real 5×5 neighborhood (9 LOD0 + 16 LOD1) exported 558,815 ray triangles. BVH storage was about 56 MiB plus alpha masks. Initial 2,527-probe tracing used 155,674 rays and about 1.99 seconds of background elapsed time including yields. This is not per-frame time.
- In the cache lifecycle fixture, moving eight metres reused 2,261/2,527 probes; a pure coordinate rebase reused all probes with byte-identical lighting and zero additional rays. Pause, latest-request replacement and chunk invalidation passed.

## Limits

This is hybrid raster/direct-shadow rendering with real ray-traced single-bounce diffuse GI, not hardware RTX or a complete multi-bounce/specular path tracer. It has finite loaded-scene/ray/probe coverage, rest-pose foliage in the diffuse cache, coarse directional visibility and low-order SH. Thin occluder leakage and lost high-frequency indirect lighting remain possible. Near grass/wheat shadow casting is deliberately omitted to keep the previous dense geometry affordable. Camera metering is a local illumination approximation, not a full image histogram. Existing quality controls still apply.

No end-to-end browser/device FPS or power measurement was made. Host CPU timings and native validation do not establish performance on the user's device. F2 reports the existing CPU/GPU measurements and the new probe-cache state; an unavailable GI worker falls back to natural sky lighting and the soft shadow maps.
