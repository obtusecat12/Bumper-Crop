# V42 — small-CCD optics and three-altitude overcast

## What changed

- A 4.8 × 3.6 mm virtual CCD and f/2.8 thin lens replace the arbitrary absolute-depth blur multiplier. World depths in metres are explicitly converted to millimetres. The focal length follows the actual vertical FOV: 72° is 2.4775 mm; a 6 mm lens would require about 33.4°. The reference's 6 mm / f2.8 / 0.005 mm combination gives a 2.5774 m hyperfocal distance, not 4.5 m. The normal exploration lens focuses at at least 2.58 m for stable wide-angle clarity.
- Wide-angle autofocus uses a bounded 6 Hz query and cannot chase the ground while walking. Macro focus requires a stable subject below 0.78 m and horizontal speed below 0.5 m/s. Telephoto AF uses at most 8 Hz. Existing collision proxies, authoritative terrain/water and a coarse crop envelope are queried, never individual wheat instances. The projection matrix changes only when the optical zoom/breathing actually changes.
- Hold Z or right mouse to zoom to at least 3×; release restores the wheel-selected setting. Wheel adjusts 1–4.5× continuously. Touch cycles 1× / 2× / 4.5×. Zoom is damped and look sensitivity follows magnification. Pausing clears held zoom; reference-camera mode remains protected until a zoom action exits it.
- Half-resolution near/far CoC reduction, two foreground-only dilation passes, then separate 16-position disc gathers. Background gathers reject foreground depths; foreground samples spread only within their own CoC. Red/blue radii vary ±4%; bright HDR samples gain a restrained ring. Full-resolution original colour is preserved where CoC is subpixel. The resolve prevents background half-resolution pixels bleeding across sharp foreground silhouettes. Optical coverage is applied once, avoiding double-alpha sharp ghosts.
- Existing rain-drop refraction, meniscus, water absorption, water environments, anomalies and display filters remain integrated. The near/far lens model is an efficient postprocess approximation, not full multi-element lens ray tracing.

## Clouds

| Layer | Nominal altitude | Volume slab | Horizontal wind, m/s |
|---|---:|---:|---|
| Altostratus | 3000 m | 2800–3200 m | (2.56, 1.024) |
| Stratocumulus | 1200 m | 1000–1500 m | (5.6, −1.8) |
| Fractus / scud | 400 m | 340–460 m | (10.24, 2.56) |

Three finite volume slabs are sampled through world-space view rays and composited far to near. The existing periodic 64³ four-channel fBm/Worley volume is reused. Two domain warps, differing wind vectors, altitude-dependent density profiles and slowly changing thresholds generate deformation, rather than rotating a sky wallpaper. View extinction uses Beer–Lambert; vertical optical thickness, a beer/powder term and a bounded multiple-scatter approximation shade dark cores and diffuse edges. Normal overcast has no solar disc or directional cloud highlight; existing explicitly triggered anomalous clear/dusk events remain.

The high deck closes the sky. Distance haze joins all layers to the existing horizon colour. Spatial scales divide the world origin period; reprojection uses actual camera position. The normal cloud pass integrates 14 samples (2 + 8 + 4), high 17, low 11, with early termination. It replaces the old 16/32/48-step cloud slab, adds no new scene geometry, and reuses the existing sky draw and water cube environment. Three extra cheap half-resolution CoC/dilation draws are added; the expensive disc gather exits on clear pixels. These are work budgets, not measured device millisecond guarantees.

## Evidence

- `contracts.json`: physical CoC values, bounded AF cadence, zoom/FOV, pause/reset, cloud altitude, half-resolution dimensions, render target lifecycle/context restoration and no active framebuffer feedback.
- Production sky, CoC, dilation, bokeh and resolve programs all link in GLES 3.2. The existing water/surface/rain/display shader programs also linked.
- `render-checks.json`: wide-angle far colour is pixel-identical to pinhole output in the diagnostic test; near-focused telephoto changes the defocused background; all native draws return no GL errors. Origin-wrap comparison differs by at most 2/255 on rare pixels from float precision (mean below 0.01/255), with no spatial discontinuity.
- Native images include sky at the horizon/overhead, 60-second evolution, rain and low quality; actual unchanged V41 spawn and wheat geometry rendered with the new sky and complete optical resolve (4× HDR MSAA). Ground lighting remains diagnostic; these are not browser captures.
- No changes to wheat generation, colour, density, static buffers, roads, buildings, lake geometry or terrain cache, beyond versioned module imports.
- This environment previously reports WebGL disabled in its browser. Validation uses native Mesa llvmpipe, so no hardware FPS, full browser UI or GPU timing claim is made.

## Technical references

- NVIDIA GPU Gems 3, chapter 28, Practical Post-Process Depth of Field: https://developer.nvidia.com/gpugems/gpugems3/part-iv-image-effects/chapter-28-practical-post-process-depth-field
- PBRT 4e, Projective Camera Models, thin-lens model and CoC: https://www.pbr-book.org/4ed/Cameras_and_Film/Projective_Camera_Models
- Guerrilla, The Real-Time Volumetric Cloudscapes of Horizon Zero Dawn: https://www.guerrilla-games.com/read/the-real-time-volumetric-cloudscapes-of-horizon-zero-dawn

## Reproduce

```sh
node tests/optics-cloud-v42/contracts.mjs
node tests/optics-cloud-v42/export.mjs /tmp/level10-v42
python3 tests/water-v28/native/gl_native.py /tmp/level10-v42/shaders.json
python3 tests/optics-cloud-v42/render.py /tmp/level10-v42
node tests/vegetation-v41/native-export.mjs /tmp/level10-geometry
python3 tests/optics-cloud-v42/scene-render.py /tmp/level10-geometry/spawn /tmp/level10-v42
node scripts/check.mjs
```
