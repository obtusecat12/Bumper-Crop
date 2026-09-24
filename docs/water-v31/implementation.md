# Water V31 — entry visibility, bed light, and glass-bound microbubbles

## Findings and implementation

- The production caustic decorator was inserted at `color_fragment` before `ground.js` assigned its final terrain base, so the intended caustic light was overwritten. The new decorator adds light to `outgoingLight` immediately before `opaque_fragment`, after terrain, weather and lighting. Tested through the actual worker packet roundtrip. Existing soil texture and physical depth remain visible under Beer–Lambert extinction; no opaque underwater fill was added.
- Animated 16-frame, 256-pixel-per-frame caustic atlas now supplies a visible irregular light network. Its scale is about 4.2 m per atlas tile, with interpolated frames and depth falloff. Intensity is artistically stronger than physically expected in uniform overcast weather to follow the supplied game reference. This is projected real-time caustic shading, not photon transport.
- A foot contact occurs far before head immersion on the eight-metre shallow bank. `WaterContactEffects` handles initial body contact, modest step wakes and head entry separately. Every emitted event retains world coordinates independent of camera position and respects world-origin rebasing. Teleport resets it.
- Main crown expands from .28 m to 1.62 m, overturns and ruptures over 1.72 s. 240 impact droplets use GPU ballistic trajectories and 2.4 s bounded records; individual droplets retire when they physically reenter water. A substantial set remains airborne after 1.2 s. The brighter irregular rim is readable without a dense opaque wall from inside the crown. Ankle steps use a smaller crown. No claim that every droplet stays airborne for 2.4 s.
- 260 millimetre-scale apparent bubbles cluster on the lens glass in a cached 384×288 normal texture (aspect adjusted, 512 px width cap). They cling, then peel upward at different delays. They refract the scene with a dark/light rim, rather than overlaying white bubble sprites. 96 much smaller independent bubbles remain in the water to connect glass detachment with the environment.
- Entry optical wash lasts .38 s. Exit curtain ruptures and drains over 2.4 s; stick-slip heads and residual trails retire within 7.5 s. Rain continues to replenish its own existing model.
- 720p internal / half-size fused optics / ten Poisson positions / ntsc-rs retained. One lens normal and meniscus evaluation is shared across the blur taps, replacing repeated reconstruction per colour tap. No new fullscreen render pass. Above-water surface wave normals and transmission code unchanged.

## Checks

- `node scripts/check.mjs`: browser module syntax.
- `node tests/water-v31/run.mjs`: 9 suites, including real generated shoreline traversal, head entry after a long shallow approach, worker material roundtrip, world-fixed particles, rain, draining lens fields, unchanged world placement and handheld rig.
- Native GLES shader link: 11 actual shader programs.
- `node tests/water-v31/export-views.mjs && python tests/water-v31/native/render_views.py`: 26 controlled views, including first-person positions directly inside the splash above/below the waterline, 4 splash ages, entry bubbles and 6 exit ages.
- `node tests/water-v31/native/render_vhs.mjs`: native frames processed with the game's actual ntsc-rs WASM. These images are **native shader diagnostics, not screenshots of a running game**. Terrain lighting is a controlled fixture; production caustic insertion is additionally checked through the material-chain test.
- Actual complete game webpage opened through supervised preview in Chrome and retried once. Both attempts failed before render due to `THREE.WebGLRenderer: Error creating WebGL context`, with `GL_VENDOR = Disabled / GL_RENDERER = Disabled`. Real gameplay, mobile performance and in-browser appearance could therefore **not** be validated. No 60 FPS claim, pixel-exact screenshot claim or successful gameplay claim.

## References

- User's four attachments: present defect, transmission and perspective-waterline formulas, and bright moving caustic network art target.
- NVIDIA GPU Gems 2, Rendering Water Caustics: https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-2-rendering-water-caustics
- Tahoe Clarity, Shallow Ripples (photo): https://www.tahoeclarity.com/store/shallow-ripples
- Three.js RenderTarget / DepthTexture: https://threejs.org/docs/pages/RenderTarget.html and https://threejs.org/docs/pages/DepthTexture.html

## Limits

The splash remains a bounded, procedural retro effect (Bayer coverage, analytic particles), not a fluid solver. Glass microbubbles are a constrained adhesion approximation. Strong overcast caustics follow the requested aesthetic. The browser validation blocker remains unresolved in this execution environment.
