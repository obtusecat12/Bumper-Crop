# V69 — distinct elder, restored microanimation, input and streaming repair

## What was actually missing

V68's three reserved morph targets had zero vertex deltas and zero animation weights. It therefore could not blink or flex fingers. Its clavicles were world-pinned, suppressing shoulder breathing, and the head-turn amplitudes had been reduced. Both faces used the same young-adult visual identity.

V69's seated actor has a separately generated elderly face and skin atlas, closed eyes, receding white hair, a short full white beard with attached jaw relief, narrower arms/chest and a softer abdomen. The standing actor keeps the younger V68 identity. Every diffuse texture embedded in the actual GLBs is 256×256 and nearest-filtered. Faces remain UV textures, not procedural eyes.

| Requested behavior | Implemented and checked |
|---|---|
| Faceted PS1/early-PS2 anatomy | Explicit angular ring meshes; A 2,330 and B 2,190 triangles; no subdivision |
| Lightweight imported animated characters | GLTFLoader, 20-joint SkinnedMeshes, unlit materials with five-band half-Lambert shading; no NPC PBR |
| Slow breathing and shifting | Chest expansion, live clavicles, shoulder rise, B pelvis shift and delayed head turn |
| Hands and water contact | Real distal finger morphs; A wrists move 1.5 mm around resting supports; B basin palm and both soles stay pinned |
| Resting expression / occasional blink | A always closed; B's fitted lids really cover the face, three 250 ms closes in a 12 s loop |
| Held retro motion without slow camera | AnimationMixer STEP tracks sampled at 20 Hz; camera and main rendering keep RAF cadence |
| Correct submerged body | Opaque layer 0 participates in the existing scene depth/refraction; no separate duplicate water capture |

The optional PS1 vertex jitter/affine route is deliberately not added: the requested alternative, simplified half-Lambert with quantized bands, is implemented. Environment bevel/normal-map standards remain unchanged.

## Input defect and repair

Previously every mousemove directly changed camera yaw/pitch, with no stale-event rejection, lock-warp handling or pause epoch. A large queued burst after a blocking task could all reach the camera. The non-locked fallback also used movementX rather than client-coordinate differences.

`look-input-v69.js` consumes validated mouse, touch and item-inspection motion once per RAF. It rejects stale/nonfinite/warp reports, resets on lifecycle and pose changes, drops queued motion after a >180 ms frame gap and resets camera/lens velocity history. Valid events sum before the final per-frame safety bound; +800/-800 reports cancel rather than creating reverse drift. Normal 1.5–1.8 rad fast flicks are preserved. No smoothing delay or motion backlog is introduced.

`input-check.mjs` exercises 15 cases including high polling, a 600 ms synthetic stall and stale burst, lock acquisition, epoch timestamps, touch/drag baselines, inspection units, finite-value checks and fast opposing movement.

## Measured blocking work

Normal city streaming had a nominal 3 ms budget checked only after an entire generator phase. Road generation, a whole building and all-material mesh merging were uninterruptible. They now yield between street stations, floors and material groups. Cancellation releases pending and already merged geometry.

On the actual 25-block city-core workload, isolated Node CPU traces had a previous worst update of **217.20 ms** (27 updates >50 ms); the final incremental trace's worst update was **37.18 ms** (0 >50 ms). An earlier prototype trace had an 82.5 ms outlier that was not reproduced; no cause was assumed. These numbers are CPU diagnostics, not browser FPS or a promise that all stalls are gone.

The original versus new street-block geometry attribute bytes plus collision/walking/facade data have the identical SHA256 `282fdf16318cf92bb605e41fdc7610713df96424efeb09ed742119379875265f`. The 25-block totals are also unchanged. `city-check.mjs` checks this baseline and cancellation disposal against the integrated production modules.

Actual NPC mixer CPU and spring focus rays did not reproduce a long task (measured maxima about 1.10 ms and 0.27 ms). No evidence justified removing NPC animation or water/steam detail. Conditional worker-failure rural/map fallbacks still contain expensive synchronous geography/raster work; this is recorded as an unresolved compatibility-path risk, not claimed fixed or established as the reported event's cause.

## Verification and limits

- `runtime-check.mjs`: real GLTFLoader + AnimationMixer over a complete loop; real nonzero eyelid morph geometry; exactly three blink transitions and 15 fully closed samples; measured chest/head/finger motion; permanent A closed eyes; contacts, support pinning, 18.58 m² pool, no feedback and bounded mirror/volume work.
- `../spring-v63/entry-return.mjs`: unchanged bath → independent spring → exact original BigInt pose return.
- `../../art-source/npc-v69/verify_assets.py`: independently decodes exported GLB buffers and checks every TRS/skin/morph frame, material and texture contract.
- `../../art-source/npc-v69/npc-v69-motion.webm`: actual textured mesh animation, natural amplitude, 12 s / 240 frames / 20 fps. Not image-generated footage or browser recording.
- `results/actual-spring-npc-*-steam.png`: actual integrated geometry/materials rendered through software GLES with production water and steam; all 36 scene and 4 volume programs linked, zero GL errors. They are **not live-browser screenshots**.
- Managed Chrome preview currently reports GL_VENDOR/GL_RENDERER Disabled and cannot create WebGL2. Browser gameplay FPS and a physical mouse/driver stall cannot be verified here. The reports distinguish this limitation from synthetic input replay and software render checks.

## Primary references consulted

- Three.js Animation system: https://threejs.org/manual/pages/animation-system.html
- AnimationMixer: https://threejs.org/docs/pages/AnimationMixer.html
- SkinnedMesh: https://threejs.org/docs/pages/SkinnedMesh.html
- MDN Pointer Lock: https://developer.mozilla.org/en-US/docs/Web/API/Pointer_Lock_API
- MDN movementX (device/unit differences): https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/movementX
- Chrome input event alignment: https://developer.chrome.com/blog/aligning-input-events
- Chrome long animation frames: https://developer.chrome.com/docs/web-platform/long-animation-frames

Generated artwork originals, prompts, user-requested prompt-format skill, registration and provenance are in `art-source/npc-v69/generated`. The first body-map generation produced no asset; the recorded safe retry succeeded. The younger face/body and towel are explicitly retained V68 assets.
