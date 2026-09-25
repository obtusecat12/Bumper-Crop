# V44 · advancing ground fog and image-preserving pipeline optimization

## Rendering changes

- Water surfaces outside the view frustum skip the full-resolution HDR/depth copy and water-only draw. Tests include parent visibility and rebased transforms. Visible surfaces retain their original shading, reflections and geometry. The small sky cubemap remains warm to avoid stale reflections on turning back toward water.
- Lens gathers branch once per foreground/background channel. Dry pixels bypass irrelevant water depth/absorption work. The 16-disc samples, chromatic aberration, CoC model, exposure, resolution and MSAA stay unchanged. The previous committed shader and new shader produced **identical RGB output** in wide, telephoto, macro and near-focus native GLES fixtures.
- Remove the eight independently integrated fog knots and per-material fog-volume sampling. Dense weather integrates once to actual scene depth, then composites before the existing physical lens and VHS display. Normal weather performs **zero new fog passes**.
- The smooth optical-depth field uses one-third width/height (320×240 at 960×720). Four depth-weighted taps reconstruct it; thin silhouettes with no compatible tap get an exact depth-limited ray instead. Steps adapt to occupied ray length (4–32), and terminate once transmission is below 0.01%. No lower-resolution scenery, reduced plant counts, new per-instance matrix updates or ray tracing were introduced.

## Weather

`u_fogProgress` advances linearly from 0 to 1 over **90 seconds of active play**, for both manual and natural fog. A 210–270 second event includes the approach, a substantial hold and 24-second dissipation. Pause/map/teleport staging do not consume weather time.

The signed front uses `(-0.8,-0.6)`, 0.003-scale macro fBm and 120 m displacement, with MaxDist 640 m. An explicit 160 m interior margin places the starting bank beyond the normal horizon and places the activation area fully inside fog at the end. The anchor remains in world space through cell rebases; walking does not drag the front. Retriggering establishes a new anchor.

Density follows `exp(-0.25*heightAboveGround)`. Ground height follows the terrain's periodic analytic surface and a local correction for lake/building ground. The noise potential has an analytic gradient; its perpendicular gradient drives the requested curl offset. Elongated broad folds and finer advected fibres modulate extinction. Air segments are clipped against water locally, avoiding underwater air fog.

The scattering base is the requested sRGB **(0.72, 0.75, 0.76)**, converted to linear before the existing tone mapping. Beer–Lambert attenuation uses the integral along each ray, not just the density at the visible endpoint. At 1.77 m eye height, the test gives transmission 0.73 at 2 m, 0.066 at 15 m and 0.040 at 18 m: approximately 17 m visibility at the 5% contrast convention. At 10 m height and 15 m range transmission rises to 0.66. Noise and local terrain make this a range, not a hard clipping plane.

As the bank reaches the camera, humidity and the existing focus spring respond locally. The spring becomes mildly underdamped only in fog; wide-angle hyperfocal behaviour remains intact. V43 world-projected Worley cloud decks at 3000/1500/400 m are retained.

## Verification and limits

- `check.mjs`: 90-second progression, pause/resume, origin rebase, retrigger, huge signed origins, water bounds, zero dry fog passes, resource recreation and framebuffer feedback.
- `pipeline.mjs`: actual opaque → optional water → fog → CoC → optics → resolve ordering and target restoration.
- Native GLES: production cloud/optics/fog programs and 15 complete material-chain programs linked. Actual terrain, plant and prop geometry (162,790 main triangles in the fixture) rendered at 0/30/55/72/90 seconds, with no GL errors. These images use diagnostic ground lighting, not browser CSM/GI or the final VHS worker.
- Crop regression: eight camera poses preserve matrices, colours, textures, the 35 m geometric cutoff and matching rut profile. No plant layout changes.
- Software timings are attached as **workload comparisons only**. In the depth fixture, the selected one-third fog field plus composite measured 32.6 ms versus 46.4 ms for the previous eight-knot pass, excluding the old extra per-material sampling. The mean linear-channel difference from the half-resolution candidate was 0.000124. Optics measurements are in their separate JSON.
- This runtime uses Mesa **llvmpipe**, not a hardware GPU. No 60 FPS or device-GPU-ms claim is made. The cloud browser's internal GPU diagnostic URL was blocked by browser policy; the exact current WebGL2 failure cause could not be verified. Static Sites previews have no compatible browser development server in this environment. Existing GPU timer HUD remains available on the user's device, and its developer section now identifies skipped water/fog passes.

## Research

- NVIDIA, GPU Gems 3 ch. 23, depth downsampling/edge artifacts and mixed-resolution reconstruction: https://developer.nvidia.com/gpugems/gpugems3/part-iv-image-effects/chapter-23-high-speed-screen-particles
- NVIDIA GDC 2016, Beer–Lambert volume integration and bilateral reconstruction: https://developer.download.nvidia.com/gameworks/events/GDC2016/Fast%20Flexible%20Physically-Based%20Volumetric%20Light%20Scattering%20-%20Notes.pdf
- Chrome Developers, headless graphics support, ANGLE/driver configuration and hardware versus software acceleration: https://developer.chrome.com/blog/supercharge-web-ai-testing
