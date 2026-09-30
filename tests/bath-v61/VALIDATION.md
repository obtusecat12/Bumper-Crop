# Bathhouse and alley refit V61

- Rebuilt the existing Level 11 service parcel as a 5.6 × 19.4 m alley; both neighboring landmark footprints stay unchanged.
- Generated 13 independent image assets. Original generated PNGs and exact prompts retained under art-source/bath-v61; runtime textures include derivative normal/roughness maps and a deterministic wetness field. Existing generated wood was reused, with new derivative maps.
- Preserved the empty pool construction block and original BATH_LIGHTS definitions byte-for-byte against source de3bdf33d07fe34380fe735bb6e1c1a7dad32e83. No edits to its textures, pool polygon, waterless basin or murals.
- Added continuous beveled limestone arch, modeled dispenser and physical red/blue levers, chair, telephone, cloth towel thickness, stone planters and bench. Static material batching retained.
- Wet shower patches use the floor material (metalness=0), wetness-driven roughness/darkening, animated ripple normals and 384×256 reflected-camera render target refreshed every third nearby frame. No separate puddle plane.
- Existing dynamic lens height-field/refraction/blur pipeline now receives shower spray without resetting a full-lens water sheet. Steam is ray integrated only inside the shower bounds against scene depth.

## Verification

- 651 exterior route samples reached the rear door; maximum rendered floor difference 9.60 mm before final bounded 5.2 mm paving relief.
- 4,980 indoor/spring route samples passed, including passing the bench, all showers, pool stairs and return paths. Minimum spring headroom 2.3038 m.
- Production interaction functions passed: door → shower presets → close eyes → Level 27 → same shower → exact prior BigInt street pose; F2 unwind and inventory preserved.
- Native GLES compiled 68 indoor programs and 65–73 exterior programs without GL errors, with actual generated maps, normal/roughness channels and geometry light shadows.
- Inspected reception, shower room, limestone arch, dispenser, alley, rear entrance, and lens-spray/steam frames. Corrected blocked planter route, exposed rear-wall slit, lever occlusion, towel support and cable footprint.
- All 35 runtime texture maps decoded successfully. All browser modules passed syntax checking; final modified modules were rechecked.

## Limits

Cloud browser preview could not create WebGL 2 (GL_RENDERER Disabled). Full browser play and device performance could not be measured. Native GLES images are diagnostics of production geometry/shaders, not a browser gameplay capture. Reflection is low-resolution and periodically refreshed, not SSR or ray tracing. Normal maps are derived height estimates from generated albedo, supplemented by real bevel/cloth/rock geometry.
