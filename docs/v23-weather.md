# V23 — detailed water and rare weather

## Visual direction

The user's IMG_4023 / IMG_4024 references establish low-poly shapes carrying detailed, continuous water texture, rather than pixel-art color blocks. Both uploaded images were inspected. The 64-pixel quantized ripple palette was replaced by a shared 512² soft-filtered ripple texture. Existing coarse lake topology, shoreline and vertex motion remain. Two slow differently scaled UV flows add interference. Mirrored repeat avoids an edge jump in the generated water image. The deliberately artificial cloud wallpaper uses ordinary repeat so its repeated image is obvious.

The generated assets are `dist/textures/v23/ripples.webp` and `cloud-wallpaper.webp`. Each was generated once, inspected, and mechanically resized/encoded for runtime. Generation prompts are retained in `v23-texture-prompts.txt`. Neither asset is a generated UI or complete gameplay frame.

## Weather behavior

One mutually exclusive roll occurs after a normal-weather wait of 100–170 active seconds (first wait 80–150 seconds): rain 10%, fog 10%, sky power failure 1%, repeated wallpaper sky 1%, clear-to-dusk 1%, otherwise normal 77%. These are probabilities per eligible round, not per frame or lifetime time fractions. Rain lasts 95–150 seconds, fog 90–145, power failure 14–20, wallpaper 22–36, clear-to-dusk 42. Envelopes fade in/out; another normal interval follows. World generation and the world seed are unchanged.

F2 places six weather actions first: rain, fog, power failure, wallpaper sky, clear-to-dusk, restore normal. Manual actions bypass the random roll and resume gameplay at the event's beginning. Reset clears transient rain/lens/flare effects and wetness. Pause, map and hidden-tab time do not advance event clocks. Weather buttons do not act during teleport preparation.

Rain uses 1,100 GPU line segments in a 48-m moving volume, a cached 32² support-height texture, and a bounded pool of 40 surface rings. Actual roof profiles cover procedural buildings, porches and farm roofs. Lens rain adds small pinned beads and larger mobile drops to the existing 24-drop pool; volume, retention, drag, coalescence and six-point trails approximate motion. Existing beads continue sliding under cover, but new rain stops. This is a bounded visual simulation, not fluid dynamics.

Puddles use wet-ground shader masks on low road ruts with gradual drying. Dense fog adds three samples of the shared 3D cloud-density texture along the view ray, with anisotropic coordinates and low-altitude falloff. No new full-screen volumetric render target is required. The fog branch is inactive in normal weather.

Power failure changes only the sky and plays a synthesized breaker transient/recovery hum. Normal lighting is retained. The wallpaper event repeats a saturated photograph-like cloud tile conspicuously. Clear-to-dusk changes sky, sun direction/color and cached indirect-light tint; a bounded analytic flare checks roof/terrain cover. It does not retrace the world for every color transition. The sun direction is explicitly restored at the event end.

All lens effects still compose before UI and the existing VHS/PS1 output filter. UI remains in that same filtered frame.

## Sources inspected

- User water-style screenshots IMG_4023 and IMG_4024 (not asserted to be original PS1 game captures).
- [John Deere, Sunny Outlook / wet field](https://www.deere.ca/fr/publications/le-sillon/2024/septembre-2024/des-perspectives-ensoleill%C3%A9es/): actual wet field photograph inspected; irregular puddles, darker soil, dull sky reflections.
- [Store norske leksikon, pond](https://snl.no/dam_-_liten_vannforekomst): foggy pond photograph inspected; low fog obscures distant trees while nearby surface detail remains.
- [Codrops, Rain & Water Effect Experiments](https://tympanus.net/codrops/2015/11/04/rain-water-effect-experiments/) and [original code](https://github.com/codrops/RainEffect): bead refraction and compositing reference; current implementation is custom WebGL geometry.
- [Sébastien Lagarde, Dynamic rain and its effects](https://seblagarde.wordpress.com/2012/12/27/water-drop-2a-dynamic-rain-and-its-effects/): separate falling rain, impacts and persistent wet surfaces.
- [Bart Wronski, Volumetric Fog, SIGGRAPH 2014](https://bartwronski.com/wp-content/uploads/2014/08/bwronski_volumetric_fog_siggraph2014.pdf): spatial density/height variation and rendering cost tradeoffs.
- [PBRT, Transmittance](https://pbr-book.org/4ed/Volume_Scattering/Transmittance): integrating optical depth through a medium.

## Verification and limits

See `v23-validation.json` for evidence. JavaScript parse checks, probability and pause lifecycle tests, actual F2 callback dispatch, roof geometry comparisons and packet round trips passed. Representative native Mesa GLES frames verified sky variants, fog, water, rain, wet tracks and flare. Blackout near-ground pixels matched normal exactly. These checks do not measure browser FPS or the user's device performance. Rain overhead is bounded and new event-only draw calls are skipped outside their events.
