# V28 numerical water textures

Files:

- `water-normal-a.png`: RGB8, 256 × 256, slope RMS 0.255.
- `water-normal-b.png`: RGB8, 256 × 256, independent seed and spectrum, slope RMS 0.215.
- `water-caustics-atlas.png`: RGB8 with identical channels, 1024 × 1024, 16 frames in a 4 × 4 grid; each tile is exactly 256 × 256.
- `caustic-frames/caustic-00.png` through `caustic-15.png`: individual grayscale frames.
- `water-data-contactsheet.png`: normal previews, 2 × 2 tiling checks and every caustic frame.
- `water-caustics-loop.webp`: lossless animated preview, 2-second loop.
- `water-data-metadata.json`: parameters and numeric checks.
- `generate_water_data.py`: self-contained deterministic generator using NumPy, SciPy and Pillow. Run `python generate_water_data.py`.

## Normal construction

A seeded white-noise FFT is multiplied by an isotropic radial amplitude spectrum:

`A(k) = (k² + low²)^(-2.1/2) · (1 - exp(-(k/low)^4)) · exp(-(k/high)^4)`.

All spatial frequencies are integer 2D torus modes. No dominant direction or hand-added wave band exists. The derivative is evaluated spectrally using `i 2π k`, then its RMS amplitude is set globally. RGB stores `(normal + 1)/2`, where `normal = normalize(-dh/dx, +dh/dy, 1)` for PNG coordinates whose y axis points down. This is the conventional positive-green OpenGL tangent normal when loaded with `flipY=true`. If the loader keeps `flipY=false`, invert the green component to preserve the height-field convention.

The two normal maps have independent random seeds and slightly different radial frequency distributions. Both contain a broad frequency continuum with a smooth high-frequency rolloff, so scrolling them independently supplies fine moving detail without directional sine stripes.

## Caustic optics

The water height is a sum of two independent radially filtered periodic fields, each translated along a different closed circular path. Path phases are functions of `2πt`; therefore height and every derivative at `t=1` equal those at `t=0`. The 16 frames sample `t = frame/16` and do not duplicate the last frame.

At each of 1,536 × 1,536 stratified surface positions, an incident ray `I = (0,0,-1)` enters the surface with upward normal `N = normalize(-hx,-hy,1)`. With `η = 1/1.333` and `c = -dot(I,N)`, exact vector Snell refraction is

`T = η I + (η c - sqrt(1 - η²(1 - c²))) N`.

The photon hits the receiving plane at

`q.xy = p.xy + (depth + height(p))/(-T.z) · T.xy`.

The receiving depth is 0.30 tile units. Photon energy is bilinearly splatted into a periodic 512 × 512 raster. A 0.60-pixel wrapped Gaussian provides a reconstruction footprint. This estimates the inverse Jacobian area concentration of the surface-to-floor mapping, including overlapping fold contributions. Thin bright folds/cusps emerge from photon focusing rather than painted cell edges.

A fixed exposure maps focused flux to the output: `intensity = 1 - exp(-max(energy - 0.85, 0)/2.5)`. The broad unfocused background is removed so the texture serves as an additive caustic term. Every frame shares that exposure, preventing automatic brightness pumping. Periodically padded Lanczos reduction yields the final 256 × 256 tile without introducing edge seams. This is an optical mask, not calibrated radiometry; it intentionally omits absorption, finite sun disk integration and wave self-occlusion.

Physical reference: Juan Guardado and Daniel Sánchez-Crespo, [GPU Gems, Chapter 2: Rendering Water Caustics](https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-2-rendering-water-caustics). The chapter explains Snell refraction and forward photon accumulation. This generator implements forward accumulation rather than copying the chapter's later aesthetic backward approximation.

## Rendering contract

All three textures are **linear data**. Set `texture.colorSpace = THREE.NoColorSpace`; never apply sRGB decoding. The PNGs contain no sRGB, gamma or ICC profile tags.

Normal maps can use RepeatWrapping, bilinear/trilinear filtering and mipmaps. Decode RGB to `[-1,1]`, scale only the XY slope contribution, then renormalize. Blend normal layers through reorientation or normalized slope combination rather than an unnormalized RGB sum.

Caustic atlas frame order in the PNG is top-left row-major: `column = frame % 4`, `row = floor(frame/4)`. If the texture uses `flipY=true`, frame-row zero appears at the top of UV space, so its atlas UV row origin is `3 - row`. A `flipY=false` atlas gives the simpler `row` addressing. Keep the choice consistent with shader UV construction.

Set caustic atlas mipmaps **off** to avoid adjacent-frame contamination. For exact seamless filtering, implement bilinear filtering with four texel-center lookups and wrap each integer texel index inside its own 256-pixel tile. For a cheaper approximation, use `fract(localUV)` with half-texel inset inside the selected tile; this avoids frame bleed but slightly compresses sampling near each tile edge. Do not rely on whole-atlas RepeatWrapping to repeat a single frame.

Interpolate frame `f = floor(phase*16)` with `(f+1)%16` using `fract(phase*16)`. A 2–4 second cycle is a reasonable starting point. The mathematical surface closes exactly and the frame-15-to-0 interval has the same duration as every other interval.
