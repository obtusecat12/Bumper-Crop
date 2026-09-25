# V34 — wheat, arrival roads, shoreline ground repair

- Restored V32 wheat card candidate lattice and RNG consumption, unrestricted stem yaw, height/scaling/tint, card root elevation, near-ear transforms, and original canopy palette/undulation. The far canopy keeps complete 64 m coverage to avoid reintroducing streaming-grid bare seams. Crop parcel ownership remains deterministic, but wheat has no fixed parcel heading or row snapping. Map crop striping is retained only for harvested soil.
- Barley uses an independent denser stream: card spacing is 0.8 times the former spacing; near stems use .245 m rather than .305 m. Measured balanced sample: 56,513 barley stems vs 36,553 wheat stems, approximately 55% more. Barley card breadth increased 8%. Wheat RNG cannot be changed by barley population.
- Restored the former lane rules in the arrival neighborhood (world x −40…128 m, z −144…128 m), feathered into the larger agricultural parcels over 72 m. Lake exclusion remains active. Existing barn/building transforms are retained. Old farm sightline protection remains authoritative for those local legacy lanes.

## Transparency bug

V33's added parcel sampler raised full pond-ground fragment sampler usage to 17. WebGL2 devices may expose only 16 fragment texture units. The old diagnostic terrain renders lacked the full GI/fog/shadow/caustic material chain and did not catch this.

Five original albedo images now occupy a shared five-layer DataArrayTexture with one sampler: soil, path, turf, bedrock and silt. No albedo information was removed. The complete runtime chain after scene-packet transfer links with **13 active fragment samplers**. The shared array preserves sRGB, mirrored repetition, mipmaps and anisotropy; material-finish detection also recognizes the array-backed ground shader.

## Evidence

- `extract-baseline.mjs` reads the V32 git source and binds its appearance routines to current clearing masks; `check.mjs` verifies all roots, matrices and colors of 36,553 near wheat instances are byte-identical.
- 1,558 arrival road relief samples match V32 exactly outside the lake feather; eight local building descriptors match; cross-chunk height error < 4e−14 m.
- `shore-full-chain.mjs` creates actual terrain, packs/transfers/unpacks it, and attaches fog, material finish, CSM, GI, wet-ground and caustics. `shore-samplers.py` links its GLSL and asserts active sampler count <=16. Host limit is32, so a physical 16-unit device failure was not directly reproduced here.
- Five distinct 512² array layers survive transfer byte-for-byte (5,242,880 bytes); chunk disposal keeps the shared resource; shared disposal frees it once.
- Pond mesh diagnostic: 5,245 vertices, no reversed/degenerate triangles, complete 4,096 m² coverage. Actual ground and water shaders rendered at three diagnostic views with no GL errors. These exclude plants/UI and are not gameplay screenshots.
- Browser Canvas2D inspection confirmed the restored arrival road layout using the game's map module. Full WebGL2 browser gameplay/device FPS remains unmeasured because that runtime is unavailable in the managed browser.

Primary implementation reference: https://threejs.org/docs/pages/DataArrayTexture.html
WebGL2 specification: https://registry.khronos.org/webgl/specs/latest/2.0/
