# V40 — slender crops, stable cutouts and broken-earth tracks

The V39 static-chunk performance system remains in use. This revision rebuilds plant appearance and road micro-relief without changing field partitioning, building placement or lake shapes.

## Vegetation

- Separate 1024 × 1024 wheat and barley atlases each contain upright, drooping, curved and lodged forms. Mature ears occupy about the upper third of a full-height plant; thin, jointed stems and dry leaves remain visible below.
- Crossed cards remain four triangles. Standing plants use 0.18 m width and a nominal 0.95 m height, with bounded 0.8–1.2 height scaling; most are near 0.85–1.05 m. The deliberately lodged variant is shorter. Coherent fertility/lodging fields accompany per-plant yaw, ±4° lean, mirroring and ±6% hue drift. These values are baked once.
- Root colour falls to approximately one third of the upper colour. Outward/upward normals compensate for nonuniform instance scale. A small view/light dependent transmission term warms backlit ears; it is an inexpensive approximation, not ray-traced subsurface scattering.
- The atlas variant is a **flat varying**. Interpolating its integer value produced floating-point values on either side of a slot boundary, causing neighboring pixels to sample unrelated plant forms. Native renders caught this failure and verified the corrected silhouettes.
- Cutouts use per-slot RGB edge dilation, alpha-weighted colour mipmaps, derivative-based alpha coverage and trilinear/anisotropic filtering. Edge-on card coverage fades while the perpendicular card retains the silhouette. The opaque HDR scene target now uses up to 4× MSAA with depth resolve; alpha-to-coverage works in that actual target rather than only in the screen framebuffer. No alpha hash or CPU transparency sorting is added.
- Tree source RGB receives the same edge dilation. Three r180's DataArrayTexture uploads only its base level, so unified tree foliage deliberately uses supported GPU-generated mips rather than unuploaded custom array mips.
- Roadside cards use four separate forms: pointed grass, tall foxtail/dry stalks, low plantain and a small dry tuft. Matte lighting replaces the former rounded, pale clumps.

## Roads

- Road soil and the median share the existing dry soil/gravel textures. A matched CPU/GLSL two-scale Simplex field, `smoothstep(.45,.55,.7*N1+.3*N2)`, breaks vegetation into irregular patches. Wheel slots exclude plant roots.
- The shared road-height function places wheels at ±0.9 m, depresses the slots by 8.4–11.6 cm and adds up to 4 cm berms. Terrain, player height and placement use that function. Existing terrain tessellation is retained; shader normal detail supplies the smaller features rather than adding meshes.
- A compact road-coordinate texture supplies accurate across/along coordinates. Fractured rut edges, shallow 60° chevron treads, darker compacted soil and roughness 0.415 replace pale flat strips. The shader compensates for already-displaced terrain height to avoid doubling the rut normal.
- Rut details share the terrain material. No coplanar overlay is introduced.

## Verification

`tests/performance-v40/static-contracts.mjs` checked eight camera/origin cases:

- maximum submitted cereal triangles: **72,380**;
- conservative maximum radius, including wind/tilt padding: **34.9914 m**;
- frozen matrix, colour and root/index texture contents/versions unchanged;
- absolute positions invariant across origin rebasing;
- wheel depth/berm bounds and alpha-weighted mip colour checks passed.

The 49-tile balanced-quality audit used the existing seed and four view directions. Main scene plus refreshed shadow triangles were **226,837 / 219,336 / 181,890 / 206,988**. The existing 235k budget left its 15k effects reserve intact in those views. Main draws were **104 / 74 / 71 / 67**; this revision does not claim a sub-60 draw count. The geometry numbers are sampled views, not a proof for every infinite-world position.

On this host, cereal-selection updates measured median **0.0017 ms**, p95 **0.0311 ms**; budget checks median **0.1132 ms**, p95 **0.1994 ms**. These are individual Node functions, not total game CPU time or GPU time.

The browser environment disables WebGL (`GL_RENDERER = Disabled`). Validation therefore used Mesa GLES 3.2 software rendering with actual exported geometry, atlas textures, shader code, 4× alpha-to-coverage and HDR colour/depth resolve. Spawn, close wheat, barley and lakeside views plus three small camera movements rendered without GL errors. All 11 worker-packet → fog → finish → CSM → GI shader variants linked. Browser module syntax checks passed.

The included images are **diagnostic renders**, without the game's complete sky, water and post-processing presentation. Device GPU time, full browser loading time and 60 FPS remain unverified.

## Reproduction

```sh
node scripts/check.mjs
node tests/performance-v40/static-contracts.mjs
node tests/performance-v40/scene-audit.mjs "$PWD/dist" /tmp/v40-view.json
node tests/performance-v40/full-chain.mjs /tmp/v40-full-chain.json
python tests/water-v28/native/gl_native.py /tmp/v40-full-chain.json
node tests/performance-v40/native-export.mjs /tmp/v40-native
python tests/performance-v40/native-render.py /tmp/v40-native/wheat-close
```

`assets.json` records the actual generation prompts and the requested prompt skill. Original generated pixels are preserved in `source/`; `scripts/pack-plant-atlas.mjs` only extracts connected silhouettes and packs them into exact atlas slots. The deployed atlases and all runtime mip preparation are independent of those source files.
