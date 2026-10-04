# Indoor Tide Garden / local visual review

The new doorway is right of the canoe buffet, at restaurant x 1.48 / z -6.48. Press E to enter; use the entrance door inside to return. The original restaurant pose is retained. No outdoor city or rural map generation changed.

## Reference-driven work

- Low 3.08 m acoustic drop ceiling with physical T-grid, recessed fluorescent diffusers, vents and squared palm openings; office walls with a muted burgundy leisure-center stripe.
- Excavated irregular calm pond, wet granite rim, two layered straw parasols, warm/pink frosted lights, generated fern/flower cards and one floating woven-strap sandal.
- A separately excavated cyan fountain, three changing water curtains, 704 GPU-animated droplets, generated splash clusters and radial basin turbulence.
- Dark gravel uses displacement, normal, roughness and AO. Boulder textures are world-space triplanar to remove the earlier stretched UV artifact.
- Thirteen generated originals produce 37 runtime maps. Originals/prompts/provenance are in art-source/tiki-garden-v81. Derived PBR channels are luminance approximations, not measured photogrammetric scans.

## Focused visual corrections

Local browser screenshots exposed and corrected boulder UV stretching, initially obscured fluorescent diffusers, a footbed hidden by its beveled sole, floating plant roots and excessive small-stone tessellation. First-frame VHS output was initially from the old scene; garden loading now invalidates that worker generation and waits for the correct processed frame before uncovering it.

The comparison captures are real local Chromium WebGL2 renders of this checkout using software ANGLE/SwiftShader. They are not image-generation mockups and do not measure hardware gameplay FPS.

- results/pool.png: calm-water composition, generated maps, reflection, parasols and sandal.
- results/fountain.png: separate cyan fountain, gravel contact, low office ceiling.
- results/arrival-game.png: actual main.js game, chosen VHS filter and HUD after E entry.
- results/restaurant-door-game.png: actual restaurant door position.

Game entry and E return ran without browser/GLSL errors; restored restaurant x/z was exactly 1.48 / -5.55. Targeted changed-module syntax and git whitespace checks passed. No broad regression suite was added.

Static garden geometry is approximately 179k triangles across 30 merged material draws; a representative full frame including its planar capture/post passes submits approximately 374k triangles. Water reuses the main HDR/depth texture with 96-step selective SSR and one 1024² planar capture. This preserves offscreen parasol/lamp reflections without separate captures per object. Image assets upload under the loading album, four concurrent texture decodes, no animation-time particle-buffer uploads. Actual performance still depends on hardware and selected image filter.

## Concurrent work

This task uses a separate checkout and uniquely prefixed garden modules/assets. Shared changes are limited to the entrance integration, first-frame filter handoff and cache URLs. Remote source was fetched before publishing; normal Git push remains the final concurrency check and must never be forced over another Level 11/Level 10 update.
