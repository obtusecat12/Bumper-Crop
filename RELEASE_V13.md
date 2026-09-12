# Continuous meadow sward and refined ferns

The previous sparse small plants spent up to 2.1 million triangles per near meadow tile. Mid/far LOD removed 48%/82% of roots. Legacy shrubs still formed almost uniformly spaced rows on both tile boundaries. This update replaces those mechanisms.

## Changes

- One generated four-variant alpha atlas supplies overlapping bent grass strips across meadow interiors. A minimum sward is retained at every LOD. Coherent density changes height/spread, with sparse geometric tall grasses, seed grasses and flowers above it.
- Sixteen-metre render batches enable finer frustum rejection. Baked diffuse grass lighting avoids per-fragment PBR and crossed-plane brightness artifacts. Cutout pixels write depth. The existing sector-order controller now handles grass strips and swaps their per-instance atlas/tint records together with matrices.
- Root placements, terrain heights, patch bins and sort permutations are cached across LOD rebuilds with bounded lifetime. Arrays sent to workers are copied from immutable cache records before transfer.
- Refined fern geometry adds connected rachises, 20-pair dissected hay-scented fronds and four-frond arching woodfern crowns. Individual rhizome fronds occur in overlapping local colonies. Near fern geometry is 1,335/1,756 triangles, used at low aggregate density; lower LODs retain morphology.
- Removes the old equally spaced field-edge shrub loop. Sparse 128 m macrocell-owned thickets have asymmetric extents, size variation, clusters and outliers. Adjacent cells query the same exact BigInt-owned parents. Fixed world seed, meadow boundaries, roads, lakes and buildings remain.

## Verification

Native Three.js/material GLES renders inspected at near, overview and distant views. Real world-worker repeated near/far/near transport passed, including texture alpha, shared material/geometry lifecycle and finite instanced attributes. Eight camera sectors retain the exact atlas/tint-to-root mapping. Same-root sward count is retained for all three LODs. Existing JavaScript modules parse and diff whitespace checks pass.

Three measured near meadow tiles changed from 919,632 / 1,875,452 / 2,113,190 triangles to 217,610 / 334,357 / 259,549 (76.3% / 82.2% / 87.7% reductions). These are mesh statistics, not end-user FPS measurements. In a 289-tile sample shrubs decreased from 11,033 to 274; their field-edge share decreased from 99.15% to 8.76%, with maximum 15 per sampled tile. The drop is the removal of the unwanted repetitive hedge grid, not a change to fixed landmarks.

Browser/full-game and user-device FPS have not been measured. New sward increases covered pixels and some distant triangle counts while sharply reducing close geometry; alpha-tested overdraw is controlled by subpatch culling and cached front-to-back sectors. Native worker generation timings include initial shared-asset warmup and should not be reported as frame rate.

## References

- NVIDIA GPU Gems, Rendering Countless Blades of Waving Grass: https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-7-rendering-countless-blades-waving-grass
- AMD GPUOpen procedural grass: https://gpuopen.com/learn/mesh_shaders/mesh_shaders-procedural_grass_rendering/
- NC State hay-scented fern: https://plants.ces.ncsu.edu/plants/dennstaedtia-punctilobula/
- NC State evergreen woodfern: https://plants.ces.ncsu.edu/plants/dryopteris-intermedia/
- Penn State fern understory competition: https://extension.psu.edu/controlling-understory-fern-competition-for-regeneration-success
- MDN WebGL best practices: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices

Grass atlas was generated after reading the user's requested gpt-image-2 prompt guide. The exact prompt is retained in TEXTURE_PROMPT_V13.txt.
