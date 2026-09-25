# V32 — natural shoreline reconstruction

Implemented after reading the four supplied formula images. Two Astra agents provided algorithm review and two generated material assets; integration, gameplay data changes and verification were done in the primary checkout.

## Generation

- Lake-relative seeded simplex, two cascaded bidirectional coordinate warps. Connected capsule basins and a subtractive land tongue create concave bays and capes without a polar-radius silhouette.
- Five fBm octaves (gain 0.5, lacunarity 2), nearshore 60/40 fractal/Worley F2−F1 roughness. Broad hardness patches expose fractured bedrock only along selected reaches.
- Shallows, shelf and deeper basin vary with bedrock hardness. A bounded meandering inlet joins the main basin. This is a deterministic erosion-informed landform model, not a time-stepped hydraulic/geological simulation.
- Separable Gaussian [1,4,6,4,1]/16 smoothing supplies positive concavity sediment infill, bounded to prevent submerged samples crossing the water level.
- Shore material weights use height above water and geometric slope, with upper/lower elevation bounds. Steep rock suppresses mud and wetland coverage; flat low reaches have wider variable sediment patches. No constant-width shore ring or separate flat mud disks.
- Two 512×512 generated WebP materials: muted photographic bedrock and damp silt/gravel, intended as old Source/PS1 surface textures, not pixel-art tiles. Shared mipmapped mirrored tiling; rock uses blended triplanar projection. Generation prompts retained alongside this document.

## Shared data and performance

One 1m height atlas per lake feeds contours, collision queries, map geography and habitat masks. Final terrain is streamed in existing world chunks. Water clips the exact ground triangles at the water level, including road-grid refinements. The atlas is bounded to six resident lakes. The world worker transfers copies of the seven arrays with a newly encountered lake; main-thread queries use that precomputed field.

Fixed world seed and lake candidate selection remain. Shapes and a few water elevations change intentionally: water is capped below the lowest surrounding land to prevent uncontained flooding. Existing wave, optical, splash, underwater and VHS implementations remain intact. Module cache keys advance together to V32.

## Verification

- `node tests/shore-v32/check.mjs`: contour/water level agreement, closed contours, cross-tile terrain continuity, world-space water geometry, flat rock summit regression, worker atlas transfer, cache eviction/rebuild determinism and safe lake teleport. Numeric results in `checks.json`.
- Existing V31 behavior and material-chain tests pass. The latter also checks transferred shore textures and habitat attributes.
- `node scripts/check.mjs`: all browser modules parse; `git diff --check` clean.
- Native GLES compilation and rendering of actual terrain material and water shaders passed with no GL errors at three viewpoints.
- Browser 2D map rendered 25 adjacent real game tiles. Screenshot: `map-browser.jpg`.

The cloud browser cannot create WebGL2 (GPU renderer disabled), so full 3D gameplay and device FPS were **not** verified here. `overview.png`, `rock-bank.png`, `bay.png` are actual exported mesh/material diagnostic renders with neutral lighting, without vegetation, HUD or VHS. `shoreline-plans.png` is a numerical height/habitat field visualization, not a game screenshot. These images are explicitly labelled to avoid misrepresenting their origin.

## References consulted

- NPS lakeshore landforms: https://www.nps.gov/articles/lakeshore-landforms.htm
- NPS rocky coasts, headlands and sheltered beaches: https://www.nps.gov/articles/rocky-coast-landforms.htm
- Stefan Gustavson simplex/cellular noise reference: https://stegu.github.io/webgl-noise/
- User-supplied domain warp, five-octave fBm, F2−F1 and slope/height weighting formula screenshots.

## Reproduce diagnostic views

```sh
node tests/shore-v32/export-plan.mjs
python tests/shore-v32/render-plan.py
node tests/shore-v32/export-scene.mjs
python tests/shore-v32/render-scene.py
```

The supervised development server exposes `/__shore-v32.html` for the 2D map check. That route is outside the published static directory.
