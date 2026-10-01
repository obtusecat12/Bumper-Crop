# Spring V63 volume validation

These checks import the current production module, `dist/spring-volume-v63.js`.
The final spring scene uses **density 0.85** and extinction 2.55. The numerical
GPU check deliberately uses density 1.0 as a separate reference case.

The production effect uses a 64³ periodic fBm/Worley texture, 32,768 advected
density/heat cells, a 32³ lamp-transmittance cache, 48 ray steps at half
resolution, scene-depth clipping, and a bilateral composite. Main and reflected
views have separate output targets and share the simulated density and lighting.
These are Eulerian GPU cells, not thousands of independent particle sprites.

## Saved evidence

- `volume-native-check.json` and `.png`: native GPU simulation, scattering,
  foreground-depth occlusion, and before/after diagnostic image.
- `actual-spring-overview-steam.json` and `.png`: actual exported scene geometry,
  water, four scene lamps, main steam and reflected steam at density 0.85.
- `actual-spring-bank-steam.json` and `.png`: dry annex view. The pool is outside
  this view, so the volume correctly has zero coverage.
- `check-volume-api.mjs`: shared simulation/cache updates, isolated reflection
  output, resize isolation, no read/write attachment feedback, renderer-state
  restoration, HDR-safe unsupported-device bypass, and disposal checks.

The saved images are labelled **native GLES diagnostics**. They are not browser
screenshots, do not include the game's UI or final lens pass, and do not measure
runtime browser or device frame rate. Volume scattering is single scattering
with approximate ambient illumination and volume self-shadowing; it does not
include multiple scattering or geometry-based shadowing of the steam itself.

## Reproduce

Run from the repository root. Node.js, Python, NumPy, Pillow and a native
OpenGL ES 3 EGL implementation are required. Scene export also uses
`@napi-rs/canvas` from `CODEX_PRIMARY_RUNTIME_NODE_MODULES`.

```sh
node tests/spring-v63/volume/check-volume-api.mjs
node tests/spring-v63/volume/export-volume-shaders.mjs
python tests/spring-v63/volume/check-volume-native.py

VIEW=spring-overview,spring-bank node tests/spring-v63/native-scene.mjs /tmp/spring-v63-fixtures
node tests/spring-v63/volume/export-scene-volume.mjs /tmp/spring-v63-fixtures/spring-overview
python tests/spring-v63/volume/render-scene-volume.py /tmp/spring-v63-fixtures/spring-overview
python tests/spring-v63/volume/render-scene-volume.py /tmp/spring-v63-fixtures/spring-bank
```

The scene wrapper executes the setup and drawing functions from sibling
`../native-render.py` in the same GL context. It composes steam into the mirror
color buffer, renders the water with that reflection, then composes the main
volume from the actual HDR color and depth buffers before display conversion.
It simulates 121 frames at 1/60 s and renders the final density at time 2 s.

Exporters regenerate noise, masks, shaders and fixtures beside these scripts.
Generated `.bin` files and intermediate JSON fixtures are ignored rather than
stored in the repository. Renders and reports are intentionally retained.
