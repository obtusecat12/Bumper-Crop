# V48 — fixed Level 10 to Level 11 exit

The authored route starts at world (488, 173.8), 502.39 m from the spawn point.
F2 → “Level 11 出口小径” lands at the start. Follow it for 360 m, approximately
120 seconds at the normal 3 m/s walking speed. Progress belongs to the route's
world position: waiting cannot advance it; walking backwards reverses the local
environment. Leaving the route cancels the armed exit.

The four overlapping stages introduce sparse gravel and industrial remnants,
expose broken asphalt and buried curbs, thin the wheat into dry vegetation and
rubble, then frame the road with low Bauhaus-inspired buildings and street lamps.
The road uses the existing terrain rather than overlapping road meshes. Ground
level, wheel ruts, crop density, footsteps and atmosphere share the route state.

Eight textures were individually generated (prompts recorded alongside this
file). Square broken windows, horizontal band windows and tall shop windows have
separate images and matching mesh ratios. Wall, asphalt and pavement textures use
256-pixel source assets, repeating UVs, nearest magnification and mipmapped
minification. No four-panel generated sheet is used. Footstep PCM is decoded once.

Level 11 currently contains only the requested entry district. At the threshold,
Level 10 production stops, world/cereal/map workers stop, rural objects leave the
scene, and chunks retire within a frame budget. Shared camera, controls, inventory,
bottle inspection, UI and display filters continue. F2 can return to Level 10.
Shared material GI bindings survive re-entry without duplicate shader injection;
cancelling a landmark search in the city no longer switches to an empty rural map.

## Validation

- Browser modules parsed by `node scripts/check.mjs`.
- 481 route samples verified: 502.39 m spawn distance, 119.83 s normal walk,
  no road-centre building/fence/lake obstructions, exit does not repeat in the
  infinite coordinate system.
- Actual lifecycle functions exercised with instrumented worker/resource seams:
  10 → 11 → F2 → 10, including resources awaiting shader compilation.
- Actual landmark button handler checked for safe search cancellation in Level 11.
- Full material chain compiled using native software GLES: 22 programs, at most
  14 active samplers (WebGL2 minimum fragment limit: 16), including a carried
  bottle reattached to a replacement GI cache.
- Existing native renders reviewed at dirt, asphalt, silhouette, threshold and
  city views. Updated dirt/threshold/city images confirm the delayed asphalt and
  corrected band-window dimensions. Diagnostic rendering is not a browser
  screenshot and does not establish hardware GPU frame rate.
- This environment has no available supported cloud-browser setup skill;
  interactive browser/hardware FPS verification remains unperformed.

## References and assets

- [Level 11 — 无垠城市](https://backrooms-wiki-cn.wikidot.com/level-11): original
  u/Nerdykiddo4884, rewrite Stretchsterz, translation Kelf; CC BY-SA 3.0.
  Credits are also available in the in-game journal. The transition design and
  Bauhaus entry district are this project's artistic interpretation.
- [Stiftung Bauhaus Dessau — Bauhaus Building](https://bauhaus-dessau.de/en/venues/bauhaus-building/)
  informed the concrete/plaster, flat roofs, steel frames and glazing proportions.
- Visual reference pages informed newly authored geometry; no reference photo is
  embedded as a scene texture. Generated diffuse textures and authored audio are
  shipped in `dist/textures/level11-exit-v48` and `dist/audio`.
