# VHS and PS1 display filters

The default display now runs the **unmodified official ntsc-rs web WASM core**.
Its wasm-bindgen glue and both standard/relaxed SIMD binaries are vendored in
`dist/vendor/ntsc-rs/`. SHA-256 hashes, upstream download URLs and full license
notices are kept alongside them. Nothing is fetched from a third party at run
time. The map, world seed, geometry, controls and gameplay generation are unchanged.

## Fixed look

The single filter selector offers VHS (default), original pixel rendering,
PS1 320P and clear rendering. Old checkbox preferences migrate to VHS; a new
explicit filter choice persists. The DOM interface and navigation maps remain
unfiltered.

V16 VHS uses a 640×480 square-pixel signal and a matching 4:3 camera projection.
The canvas fits inside the window with black bars, without stretching or cropping
the processed frame. The HUD/minimap follow this picture; menus and the full map
retain the available window area. Photo lenses use the actual camera aspect.
The selected preset
is in `dist/vhs-preset.js`: SP tape speed, Butterworth filters, full chroma
low-pass, luma smear 0.4, preemphasis 0.65, no added sharpening/ringing, restrained
noise, slight edge wave and a small bottom-edge head-switch disturbance.
Input saturation is raised to 1.16 before the actual ntsc-rs process. Eight
variants were compared against a native render of the game's meadow; stronger
preemphasis made grass overly fluorescent, and Constant-K LP lost too much detail.

`use_field:3` processes all rows. Noise/carrier phase follows a 59.94 Hz field
clock independently of asynchronous completion. Horizontal bandwidth scaling
is 1, as recommended upstream for 480-row inputs. No arbitrary scanline/grid,
vignette or timestamp overlay is added. Native signal-filter border transients
are retained. V16 only reduces luma smear from 0.5 to 0.4: edges are slightly
clearer while the soft chroma, noise and 1.16 saturation remain unchanged.

PS1 is a **display-style simulation**, with 320 vertical pixels, nearest
upscaling, the GPU's signed 4×4 dither matrix and RGB555 quantization. It does
not claim to emulate PS1 geometry, affine texture mapping or hardware video modes.

## Color and scheduling

The original scene renders to the default framebuffer using its existing ACES
tone mapping and sRGB encoding. A WebGL2 PBO captures those exact display bytes
before the previous processed image is presented. A fence is polled with a
zero timeout; there is no synchronous CPU `readPixels`, `gl.finish` or busy wait.

One frame at most is in readback or WASM processing. Saturation and the bottom-up
to top-down conversion are done together in a dedicated worker. The original
ArrayBuffer is transferred back and recycled. The returned data texture uses
NoColorSpace and a RawShaderMaterial to avoid a second gamma/tone-map pass.
Scene captures only happen when the worker can accept a frame; intervening
animation frames present the cached output. Input, simulation and UI continue
on the normal animation clock. There is no queue of increasingly old frames.

The official relaxed SIMD binary is compiled first where supported, with a
standard SIMD fallback. Changing filter/size and context loss invalidate old
results by epoch. Timeouts/errors restore the original pixel view with a visible
message. Page exit releases the worker, buffers and textures. GPU timing is
sampled on real scene captures, while F2 reports VHS throughput, worker time and
capture-to-result latency separately.

## Verification and precision boundary

Verified on 2026-09-12:

- Browser-module syntax and local module/asset paths.
- Independent official-core byte comparisons at 640×480, 720×480 and 854×480,
  including size transitions: no mismatched bytes for identical graded input,
  fixed preset, frame number and SIMD variant.
- Actual worker transfer and both relaxed SIMD / standard fallback: no mismatched
  output bytes; deterministic same-frame noise, changing noise on frame advance,
  opaque alpha, correct orientation and exact frame sizes.
- Native GLES 3 shader compile/link and render: VHS display reproduces processed
  bytes exactly, PS1 matches integer RGB555+dither reference exactly. A normalized
  texture rounding issue was caught and fixed before release.
- Scheduling/lifecycle checks: no queued frames, stale result rejection,
  cancelled readback, mode/size changes, context recovery, disposal and capture-only
  GPU timing.

Native CPU samples for the chosen full 720×480 processing path, including grade
and row conversion, were approximately 25 ms (relaxed SIMD) and 27 ms (standard)
median on this executor. These are **not browser or user-device FPS measurements**.
The filter has a real processing cost even though its work is off the main thread.

The V16 4:3 input has 25.06% fewer pixels than V15's 854×480 input on a 16:9
window. A separate 35-sample warmed core comparison measured medians of 18.08 ms
at 854×480 and 13.65 ms at 640×480 with the new preset. This is a scoped host CPU
comparison, not a game FPS or power-consumption claim. The clarity adjustment
does not add a filter pass.

Pixel equality is scoped to the pinned **official web core**, the same input,
preset, frame and SIMD variant. A desktop build, different noise frame, SIMD
implementation, input image or display rescaling need not be byte-identical.

## Primary references

- [ntsc-rs](https://ntsc.rs/) and [web-app documentation](https://ntsc.rs/docs/web-app/)
- [Signal-processing source](https://github.com/ntsc-rs/ntsc-rs)
- [Official web wrapper](https://github.com/ntsc-rs/ntsc-rs-web/tree/main/ntsc-rs-web-wrapper)
- [MDN WebGL best practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices)
- [PSX GPU dithering specification](https://psx-spx.consoledev.net/graphicsprocessingunitgpu/#24bit-rgb-to-15bit-rgb-dithering-enabled-in-texpage-attribute)
