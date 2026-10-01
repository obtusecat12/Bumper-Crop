# V66 spa nook: design and verification

The former isolated pool in a large rectangular room is now a continuous set of spaces: original pool doorway → compressed vestibule → circular bathing nook → shallow resting arches → lounge arcade → glass-block screen → warm changing-room dogleg. The original empty basin remains unchanged. `spa-layout-v66.js` owns the visible pool, six steps, clearances and all walking constraints. Level 27 remains a separate scene.

## Liminal-space research applied

- Jared Pike's [Dream Pools](https://www.jaredpike.art/projects/dream-pools/) describes unsettling nostalgia and dreamlike endless indoor pools. This scene uses familiar period fixtures, artificial daylight from the Venice lightbox and water running in an otherwise unoccupied room.
- [The Architecture of Liminal Spaces](https://www.archdaily.com/958016/the-architecture-of-liminal-spaces) discusses transitional spaces and the unease of familiar collective spaces without their occupants. Here, repeated arches, a compressed entry, an arcade and a partly concealed changing-room destination provide that spatial experience.
- These are design interpretations, not evidence that a particular viewer must feel unease. The room retains credible use, human dimensions, material wear and connected routes. No flicker or jump effects were added.

## Changes

- Replaced the old `camera.x > 3.15` room visibility gate with persistent opaque architecture and a portal-frustum test for expensive water/post effects. The old bath room is hidden only when its portal is outside the current spa view.
- A watertight, connected 48,974-triangle cliff meets the rear and west envelope. Both existing marble figures rest on dedicated rock seats. The arched Venice lightbox has thick beveled stonework, a reveal and a downward glare hood.
- Three arched tiled resting niches have curved blue mosaic seats, physical framed sun reliefs, brass hooks and thick folded towels. The lounge has two modeled strap loungers, grounded white planters, a wet mat and a pressed-glass block screen with real mortar webs.
- A rounded continuous soffit replaces the two floating ceiling boxes. Concealed cool cove light, three narrow warm niche lights, submerged lamps and restrained caustics replace high global fill.
- Eight independently generated photographic source textures supply 32 runtime maps: albedo/alpha, normal, roughness and AO. Existing generated mosaic, marble, sandstone, Venice artwork and original water-caustics artwork are retained. Rock uses triplanar albedo/normal sampling and height/contact wetness.
- The cyan outlet meets a vertical two-film waterfall using rolling normals, alpha erosion and scene refraction. Local impact spray uses a 1,024-droplet GPU MRT simulation. The pool retains depth absorption, Jacuzzi foam, concentric impact ripples and caustics.
- The floor uses a wetness channel and drying footprints, plus selective 24-step half-resolution SSR. True 3D steam uses 32³ density/heat advection, 64³ fBm/Worley noise, a light cache and 20-step quarter-resolution ray marching. Compact HDR bloom follows it. These passes reuse the existing main scene capture.
- Water/pump sound has distance attenuation, a muffled response from the old room and a 1.6-second tiled-room impulse response. Pause and exits mute it.

## Verified

Run from the repository root:

```sh
node tests/spa-v66/layout-check.mjs
node tests/spa-v66/runtime-check.mjs
node tests/bath-v62/contact-audio.mjs
node tests/spring-v63/entry-return.mjs
node tests/spring-v63/render-state.mjs
node tests/spa-v65/render-budget.mjs
node scripts/check.mjs
```

- The walking test covers 4,342 motion samples from reception through the original pool, new entrance, six shared submerged steps, lounge and changing-room return. Maximum step height is 0.165 m; the original basin retains all 63 outline vertices.
- Six approaching doorway views verify that the annex exists before entering. Reverse views restore the old room; looking away from the portal skips the spa effects.
- The production factory batches the new static architecture/furniture into 29 material draws. A state-checking renderer executes 60 frames, checks separate sampled/written attachments, restored render state and the 1280 × 720 water viewport. It records 20 steam-advection and 8 light-cache updates during that second, with zero extra main scene captures for SSR.
- Sound checks cover finite PCM, attenuation, pause, exit and teardown. The legacy V62 contact test now inspects the actual 1024-pixel optical texture returned by V63 `prepareField`, rather than the obsolete simulation pixel buffer; lens production code and timing are unchanged.
- The existing spring entry/return and GPU state checks preserve the shower → Level 27 → same shower → exact BigInt street pose flow.

## Render evidence and limitations

`native-scene.mjs` exports production geometry, maps, custom PBR shaders, water shaders and post shaders to an external fixture directory. `native-render.py` and `render-post.py` render them with software Mesa GLES 3.2. The retained `results/*-inspection.png` images cover the pool/reference angle, niches, lounge and original doorway. Actual shader compile/link/render and GL error checks passed; all four views have zero GL errors. These images are explicitly labelled **SOFTWARE GLES**.

The browser preview could not create WebGL2 in this environment (`GL_VENDOR/GL_RENDERER = Disabled`). Therefore there is no measured browser/gameplay FPS claim. Native diagnostics omit the runtime cubemap/physical clearcoat and full display/lens pipeline, so chrome and glass differ from a complete browser render. Geometry draw counts and mocked pass budgets are not frame-rate measurements. SSR is screen-space and retains base PBR where there is no visible hit; steam is single scattering with a density-light cache, not full multiple scattering or geometry-shadowed volumetrics.

To regenerate the four views (fixtures are intentionally outside the checkout):

```sh
MODE=bath VIEW=spa-reference,spa-niches,spa-lounge,spa-portal node tests/spa-v66/native-scene.mjs /tmp/spa-v66
python -B tests/spa-v66/render-post.py /tmp/spa-v66/spa-reference
python -B tests/spa-v66/render-post.py /tmp/spa-v66/spa-niches
python -B tests/spa-v66/render-post.py /tmp/spa-v66/spa-lounge
python -B tests/spa-v66/render-post.py /tmp/spa-v66/spa-portal
```
