# Weather V25

This revision responds to flat fog, short lens-drop tails, flat splash cards, weak dusk and unconvincing anomalous skies. Existing world generation, HUD composition, 1080-line ntsc-rs preset and low-poly water surface are retained.

## Reference inspection before implementation

- [Misty lake, Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Misty_lake.jpg): clear near grass/rocks; the horizon and far shore vanish. [Field fog](https://commons.wikimedia.org/wiki/File:Fog_at_German_field_(15287860901).jpg) supplied depth layering, and [hazy sunset](https://commons.wikimedia.org/wiki/File:View_of_the_other_islands_of_Croatia_(During_sunset)_-_panoramio.jpg) supplied muted warm horizon/cool upper air.
- [LDI stage photograph](https://commons.wikimedia.org/wiki/File:A_Photo_of_the_LDI_2013_Conference_in_Las_Vegas,_NV.jpg): visible lamp apertures, coherent cones and dark gaps. The game's sky-only power outage remains intentionally anomalous; it does not change ground lighting.
- [Stuppacher and Supan, Rendering of Water Drops in Real-Time, 2007](https://old.cescg.org/CESCG-2007/papers/Hagenberg-Stuppacher-Ines/cescg_StuppacherInes.pdf): inspected actual mirror photographs in Figure 1, showing long tails, residual drops and curved refraction.
- [APS: On the edge, 2024](https://gfm.aps.org/meetings/dfd-2024/673e5f58d88f375e670eb524) and [APS: Jet Coronation, 2025](https://gfm.aps.org/meetings/dfd-2025/692e39e5a7f805227b16fe9e): inspected connected asymmetric sheets, scalloped rims, slender ligaments and detached droplets. These experiments inform visual morphology, not numerical walking-impact scale.
- Original Half-Life (1998) and GTA III (2001) publisher screenshots informed the soft continuous sky imagery. Exact image URLs and the generated asset prompt are recorded alongside this document. No publisher screenshot is shipped as a texture.

## Representation and limits

Fog follows path extinction and cumulative radiance, informed by [PBRT transmittance](https://www.pbr-book.org/4ed/Volume_Scattering/Transmittance) and [GPU Gems volume rendering](https://developer.nvidia.com/gpugems/gpugems/part-vi-beyond-triangles/chapter-39-volume-rendering-techniques). Eight radial-depth knots share nested sample intervals in one 4×2 atlas. Multiscale 3D noise shapes banks, vertically compressed ribbons and wind advection. Materials sample the two enclosing knots, interpolate optical depth and accumulated scattering, and share the same field with the sky. The atlas uses linear scattering; the existing output-space material-fog path converts its unpremultiplied source to the renderer output transfer function. This is an appearance-oriented atmospheric approximation, not spectrally calibrated multiple scattering. Nearby thin wisps retain structure; sufficiently distant fog converges to near-uniform opacity.

Balanced fog tiles are 192×144 at 4:3 (width follows aspect, capped at 320), low 144×108 and high 240×180. Sampling is bounded and ends when opaque; the pass runs only while fog is active and only for a newly rendered scene frame. Dense fog skips the hidden distant cloud march. No additional world generation or particle objects are created for fog.

Lens water uses 64 pooled moving heads, 128 pinned beads, volume-preserving merging and a persistent small film field (256×192 at 4:3). A drop transfers liquid into the path it traverses; that path thins over several seconds after the head has left. Entry creates a short irregular sheet that drains into mobile streams. Gravity, adhesion, camera acceleration and wet-path attraction govern movement. State updates run at 30 Hz; no more than eight steps are serviced after a stalled frame. This is a bounded physical heuristic, not a Navier–Stokes solver. Refractive normals and meniscus lighting are packed once per state update, then read in one full-screen draw after one framebuffer copy. Dry weather does no film-grid work. The entire result still passes through the existing final VHS/PS1 filter together with the UI.

Water-entry impacts use three pooled single-pass batches: connected 36×3 crown sheets with rim/ligaments, faceted ballistic spray, and fine alternating ripple crests. Event-relative analytical age preserves speed at low frame rates. BigInt chunk rebasing is retained.

Dusk lowers the sun to near the horizon and couples warmer direct light with cooler/dimmer sky fill; upper atmosphere remains cool and only the sunward horizon is strongly warm. The stage event first reveals eight sky lamps in haze, cuts their banks in sequence with the contactor sound, and restores power with one false start. Wallpaper clouds use one new 512² continuous soft image with mirrored repeat, deliberately exposing a repeated stock-sky pattern without hard texture seams.

Natural per-round probabilities remain rain 10%, fog 10%, each anomaly 1%. Manual F2 controls, active-wall-time weather scheduling, pause/resume and safe teleport remain intact.
