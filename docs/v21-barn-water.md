# Reference brick barn and low-poly water

The fixed barn is at world X84,Z−80. The supplied map was registered against the origin road intersection, fixed pond and Kephart Farm. Reopening uses the same world seed and location. The supplied photo constrains the visible left gable, long facade, offset blue-grey entrance dormer and asymmetric roof. Hidden walls/interior and physical dimensions are inferred, not measured or guaranteed pixel-identical.

F2 adds a door approach and calibrated reference camera. E opens/closes lower double doors; upper boards retain the photo silhouette. Wall segments, moving door OBBs, stove collider, low straw bedding and folded quilt are real geometry. Floor materials, threshold, rafters, planks, ironwork, enamel rim/handles/lid, flour surface, simmer and vapour are separate parts. Small blue burner flames require no extra light or shadow pass. Authored harvested ground locally replaces the old procedural path under the reference scene using the same mask in terrain, map, vegetation, power lines and indirect-light albedo. The rest of the fixed world remains unchanged. Authored trees/hedges are deterministic and assigned to their true owner tiles, with map positions shared from layout data.

The pot is a plausible 1980s American speckled enamel steel stew pot, not a claimed exact vintage product SKU. Manufacturer history documents US Graniteware production through General Housewares ownership1968–1998:
- https://www.columbianhp.com/about/
- https://www.cinsa.com/usa/ing/graniteware/p/enameled-steel-stew-pot-7-5-qt-with-enamel-coating-black-pots-and-pans

Three generated source sheets produce nine shared256px PS1/PS2 materials, about132KiB total WebP payload. Original source and prompts are retained in art-source/v21. Downsampled, restrained color/detail; near magnification uses nearest filtering, distance uses mipmaps. The game/UI compositor and existing1080-line ntsc-rs WASM processing remain intact.

## Water and lens design

All navigable lakes now use animated actual triangle vertices: three gravity-wave bands, tapering to zero at shore, with two independently moving samples of the generated water texture. Radius-adaptive ring sampling avoids centre sliver overdraw while retaining the existing320-point outer shoreline. Wave phase is lake-relative and survives origin rebasing. Tile clipping uses a canonical whole-lake mesh. Opaque water depth-writing is retained. Face normals follow displaced positions; displacement bounds are expanded.

A bounded36-bead lens simulation uses radius-dependent capillary pinning, gravity projected to the lens, damped motion/deformation, volume-conserving merges, tiny residual beads, evaporation, screen exit and finite lifetime. This is a physically informed real-time approximation, not a Navier–Stokes liquid solver. Entry/landing/wading triggers use actual clamped player feet after movement/rebase, hysteresis and teleport reset. Acceleration is projected onto camera right and normalized by dt.

Render order: scene → wet lens → UI → existing VHS/PS1 filter. A wet frame costs one scene framebuffer copy and one instanced-quad draw. Dry frames do neither. No fullscreen per-droplet loop, extra scene camera or reflection pass. Captured colors remain in their existing display color space and orientation. Resize/context restoration/disposal release/rebuild the wet capture correctly.

Primary implementation references:
- NVIDIA GPU Gems, Effective Water Simulation from Physical Models: https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-1-effective-water-simulation-physical-models
- Fournier/Habibi/Poulin, Simulating the Flow of Liquid Droplets: https://graphicsinterface.org/proceedings/gi1998/gi1998-17/
- Nakata et al., Animation of Water Droplets on a Hydrophobic Windshield: https://www.researchgate.net/profile/Nobuyuki-Nakata/publication/268438621_Animation_of_Water_Droplets_on_a_Hydrophobic_Windshield/links/556d6a5508aefcb861d7f4b9/Animation-of-Water-Droplets-on-a-Hydrophobic-Windshield.pdf
- Three.js FramebufferTexture / renderer: https://threejs.org/docs/pages/FramebufferTexture.html and https://threejs.org/docs/pages/WebGLRenderer.html

## Verification and limits

Module parsing; finite geometry; dynamic door collision/clearance; LOD invariant collider placement; map/F2 safe landing; terrain continuity; matching animated lake edge vertices and upward winding; worker serialization; water/paste/vapour shader compilation; cap pinning/sliding/merging/lifetime/count; wet/dry renderer lifecycle; no pixel changes beyond droplet bounds; correct back-face culling and upright refraction. Native GLES renders used actual geometry, materials, CSM and probe GI. Native imagery uses a plain sky backdrop and omits the live browser cloud/VHS stage. It verifies geometry and shaders, not browser frame pacing or the user's device FPS. No claim of performance measurement on that device.
