# V65 verification

- `node tests/spa-v65/layout-check.mjs`:2148 movement samples from reception to the spa, six visible/collision-shared165mm steps, pool bottom and return. Original empty basin remains63 survey vertices.
- `node tests/spa-v65/render-budget.mjs`:120 production updates on a state-checking renderer;0 duplicate main opaque scene captures,19 cached mirrors,60 volume simulations and24 lamp-field updates.134 static meshes are35 material/signature batches. No attachment feedback or viewport/state leaks. This is a render-budget check, not measured hardware FPS.
- `node tests/spring-v63/entry-return.mjs`:actual E/eyes-closed entry and exact BigInt two-stage return.
- `node tests/spring-v64/geometry-check.mjs`: original18.58m² water, ten eroded treads, complete cave return path.
- Native diagnostic PNGs rasterize actual geometry/textures/shaders with Mesa GLES. They are not browser screenshots. Native harness approximates MeshPhysicalMaterial, omits the real browser cube environment and final bloom/DOF; chrome is therefore darker than the actual environment-mapped material.
-6 independent image-generated albedos plus derived normal/roughness/AO maps; full prompts and reference provenance are in `dist/textures/spa-v65/generation-provenance.json`.
- Full SPA shaders and the sculpt MeshPhysicalMaterial callbacks compile in native GLES. The new waterfall uses2 flowing films,1024 GPU splash drops and source-depth refraction, while circular water includes absorption, caustics and central jet foam. Bloom is a compact3-mip Gaussian/highpass adapter of the UnrealBloomPass family, not the imported class. Sculpture backscatter is a warm diffusion approximation, not a volumetric SSS solver.
