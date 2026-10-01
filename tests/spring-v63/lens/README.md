# V63 lens contour diagnostic

The broad runoff heads were rasterized into a 256-pixel field, with normals derived from already quantized 8-bit heights. Nearly binary coverage and the half-resolution composite amplified the stepped edges. V63 retains the original simulation grid and reconstructs the optical field at 1024 pixels on its long axis, using floating-point height gradients and antialiased coverage. Wet optics use the full internal resolution; native presentation uses linear enlargement.

## Reproduce

Run from the repository root. Requires Node, Python with NumPy/Pillow, and native EGL/GLES libraries. The renderer reuses `tests/water-v28/native/gl_native.py` with bytecode writing disabled.

```sh
node tests/spring-v63/lens/export.mjs /tmp/level10-lens-v63
python -B tests/spring-v63/lens/render.py /tmp/level10-lens-v63
python -B tests/spring-v63/lens/silhouette.py /tmp/level10-lens-v63
```

Generated texture buffers and shader fixtures remain in `/tmp/level10-lens-v63`; they are not committed. The three baseline lens modules are read from Git commit `77f1c2c96b975812162316f52c2f755937e94b7f`, so that commit must be available locally. Other module dependencies resolve relative to the current repository's `dist/` directory. The after case uses the current production modules, not copied replacements.

## Retained evidence

- `physics-checks.json`: exact equality at every one of 480 steps of 1/60 s for droplet records, film cells, total mass, wet weight, and wash weight after deterministic shower contact. Sparse optical film reconstruction matches a dense bilinear reference over seven aspect ratios, with maximum height error `1.06e-7`. Source hashes identify the tested modules.
- `results.json`: actual before/after fused and resolve GLSL compile, link, and render in native Mesa GLES. The wet fields are 256 × 128 and 1024 × 512; the composite passes are 720 × 360 and 1440 × 720. Output pixels are finite, and GL calls complete without errors.
- `silhouette-error.json`: 100 sampled rows of the broad head's left contour, compared with its analytical circular footprint. RMS horizontal error decreases from 1.536 to 0.079 internal pixels; maximum error decreases from 4.409 to 0.179 pixels. The after limits asserted by the script are 0.15 RMS and 0.30 maximum pixels.
- `lens-before-after-native-gles.png`: enlarged crops of those native GLES renders against a synthetic grid. The before crop uses nearest enlargement and the after crop uses linear enlargement to illustrate presentation behavior.

## Limits

This is a native software GLES diagnostic, not a browser or live-site screenshot. It uses a synthetic color/depth fixture with inactive scene water, depth of field, steam, and wash curtain. It verifies the actual fused/resolve shader code and lens field reconstruction, but does not execute the complete Three.js frame or the final GPU display-filter pass. The contour measurements concern this deterministic head fixture, not every possible overlapping drop. No hardware performance, browser compatibility, or gameplay FPS claim is made.
