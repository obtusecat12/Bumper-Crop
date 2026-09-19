# V20: one complete signal

V19 mixed unwarped high-resolution luminance detail with spatially shifted640×480 ntsc-rs output. Matching the capture time did not fix the incompatible edge positions. V20 removes that reconstruction completely.

The pipeline is now: scene → retained UI canvas → GPU byte-exact saturation / vertical flip → asynchronous PBO readback → official, unmodified ntsc-rs WASM at1440×1080 → direct presentation. No sharp layer is added after processing. The default remains contained4:3 with square pixels. PS1 uses320 lines and RGB555+dither after the same UI composition.

The official [web app worker pool](https://github.com/ntsc-rs/ntsc-rs-web/blob/main/src/util/effect-worker-pool.ts) also distributes complete frames. This implementation has1/2/3 slots according to available logical cores, one job per slot, at most one GL readback, a30 Hz capture ceiling and monotonically presented sequence numbers. Old epochs and out-of-order results are discarded. Switching away terminates the pool. The GPU grading pass avoids a per-pixel JavaScript loop while retaining the existing1.16 saturation including its two floating-point tie cases.

UI controls remain DOM elements for layout, input, focus and accessibility, with only their source opacity removed. The retained painter mirrors their layout and caches text positions. Instrument parts and live map canvases have explicit painters/revision tracking. Custom in-picture listboxes replace native select popups so settings also enter the signal. Texture dimensions are tracked and reallocated when resolution changes; uploads are initialized before scene rendering. Full map mode renders only the map/UI while3D updates remain paused.

Validation: native GLES grading/flip matches CPU bytes; fast WASM path matches legacy core byte-for-byte at full1080 lines; final presentation matches the official complete output exactly. Instrument/signal composites were inspected using native Canvas and GLES. This is not a browser or device FPS measurement. A scratch benchmark on8 effective CPU cores measured approximately17.8 /35–36 /51–52 full1080 frames/sec with1/2/3 WASM workers, excluding game rendering/readback/UI work.

Relevant primary guidance: [WebGL upload and pipeline costs](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices), [Canvas caching](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas).
