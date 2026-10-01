# V63 spring and lens validation

2026-10-01. This is the validation record for the Level 27 rebuild and shared lens sampling repair. The supervised Chromium preview loaded V63 but could not create a WebGL2 context. No browser gameplay, frame-rate, mobile performance, or real-device visual validation is claimed.

## Changes and evidence

- Lens motion and entry/exit timing remain the original lake simulation. Optical heads and trails are reconstructed independently at 1024 pixels on the long axis; floating-point height gradients, antialiased coverage and a full-resolution wet composite remove quantization and enlargement stair steps. `lens/` contains the native GLES comparison and numerical checks.
- The 96-vertex water survey is 18.58 m² (Float32 rendered polygon 18.5799999735 m²). Exact mesh/waterline intersection contains the entire survey. Added walkable land is excavated east of the original pool. No dry-bank mesh reduces the water footprint.
- The continuous shell has 184,267 vertices and 368,530 triangles. Route sampling traverses 2,389 movement steps, with minimum headroom 2.303 m. Ten eroded treads share the collision height function; final maximum sampled visual/collision mismatch is 0.7723 mm. All 144,720 surveyed floor samples remain submerged; the visible floor covers all 6,480 sampled edge positions.
- Eight independently generated source images and their prompts are in `art-source/spring-v63/`. Albedo, normal, roughness and AO maps are used at runtime; derived height maps are retained as source assets, not claimed to provide runtime displacement. Cave depth is real subdivided geometry; world/triplanar sampling prevents stretched wall and tread UVs. Original caustic and ripple images are retained.
- Two cascades use dynamic eroded sheets/rivulets, 4,096 GPU-simulated splash instances, local impact waves and foam. Native GLES compiled their actual four shader pairs and exercised 90 physics frames; all positions remained finite, with maximum integration error 2.39e-7 m. Creek flow follows the authored stream tangent map and stones.
- Steam uses 32³ advected GPU density/heat cells, a periodic 64³ noise volume, Beer–Lambert integration and approximate single scattering. The half-resolution raymarch is depth-aware and bilaterally composed, including the water reflection. This is an Eulerian density volume, not a full Navier–Stokes simulation or millions of independently raymarched particles. Light-cache self-shadowing describes density occlusion; it does not include complete scene-geometry occlusion in the volume.
- Point lights use inverse-square falloff; Level 27 selects PCFSoftShadowMap and restores the prior world shadow mode on exit. Brass cage lamps, a carved stone wash basin, wooden dipper and construction-time relaxed towel cloth replace the prior primitives.
- Level 27 has an independent pool/annex/stair/tunnel map. Cave map teleport is disabled. Actual entry/return functions preserve the same shower and exact BigInt street pose, including F2 exit and inventory.
- Main/reflection opaque captures and volume outputs are separate. The production render-state diagnostic exercised four frames and 32 draws without read/write attachment feedback, verified a 1280×720 final VFX viewport and state restoration.

## Reproduce bounded checks

Run from the repository root:

```sh
node scripts/check.mjs
node tests/spring-v63/entry-return.mjs
node tests/spring-v63/render-state.mjs
node tests/spring-v63/navigation.mjs
node tests/spring-v63/geometry-check.mjs
python3 tests/spring-v63/shell-waterline-check.py
```

Geometry checks require Node. The exact waterline check also requires NumPy and Matplotlib. The map and native scene exporter use the runtime's `@napi-rs/canvas` through `CODEX_PRIMARY_RUNTIME_NODE_MODULES`. Native shader checks use EGL/GLES3 and Python NumPy/Pillow. Generated shader fixtures and binary captures are intentionally regenerated in scratch, rather than versioned.

`native-scene.mjs` exports the current production scene to a supplied scratch directory (set `VIEW=spring-overview` or `VIEW=spring-stairs`). `native-render.py` renders those materials and geometry with a native GLES harness; `volume/` adds the actual production steam shaders. The harness approximates physical transmission and point shadows and omits UI/lens processing. Its labelled images are diagnostic renders, not browser screenshots. Real-device rendering and performance remain unverified.

## Technical references

- Three.js PointLight: https://threejs.org/docs/pages/PointLight.html
- Three.js volume cloud example: https://threejs.org/examples/webgl_volume_cloud.html
- PBRT transmittance: https://pbr-book.org/4ed/Volume_Scattering/Transmittance
