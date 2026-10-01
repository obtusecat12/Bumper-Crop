# Spring cascade GPU diagnostics

Run from the repository root:

```sh
node tests/spring-v63/cascades/cascade-gpu-extract.mjs
python tests/spring-v63/cascades/cascade-validate-gpu.py
```

The extractor imports the production `dist/spring-cascades-v63.js`, checks geometry and capture binding, and emits a concise summary. The validator invokes the extractor with `--json` through a pipe, then compiles and links its four actual GLSL pairs and executes 90 frames of two-attachment RGBA32F ping-pong simulation for 4,096 localized droplets. It checks finite state, gravity integration, lifetime/respawn behavior and the splash envelope. No shader fixtures, binary state dumps or images are written. Pass `--output /tmp/cascade-current-report.json` to save a fresh report separately.

Requirements: Node.js, Python with NumPy, EGL and an OpenGL ES 3 driver. The helper `tests/water-v28/native/gl_native.py` creates a surfaceless native GLES context. Mesa llvmpipe is sufficient. This is native software-GLES shader and simulation evidence; it is not a browser or live-site screenshot, a full Three.js render verification, or a hardware FPS measurement.

`cascade-gpu-results.json` preserves the original successful diagnostic. Its source SHA-256, `fcf7f836457e39484053b971e993ae12d40a365162c12d9ecb0af7320dc565e9`, identifies the standalone module before integration. The only subsequent module edit added diffuse, normal and roughness maps to the embedded creek-pebble material. The four verified custom GLSL pairs and particle simulation were unchanged. A fresh run records the current production source hash instead; the stored report is not silently overwritten.
