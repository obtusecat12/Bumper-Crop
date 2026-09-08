# Level 10 — restored field boundaries and navigation maps

## Problem and changes

The fixed reference farm used its broad search bounds as an exclusion mask. That removed roads, trees, hedges and an otherwise valid building across nearby fields, creating the reported expanse of bare wheat around a few hundred metres from spawn. Scene packets were not dropping those objects: the generator had already excluded them.

The exclusion now follows the actual farm grounds and the two reference-photo sightlines. JavaScript terrain generation and the ground shader share the same mask parameters. The world seed, far-field generation, authored farm placement and reference cameras are unchanged. Revisiting a coordinate still reproduces the same terrain.

A circular minimap sits in the upper right and rotates with the player's heading. F opens/closes a north-up map with buildings, lakes, grass, wheat, tree cover and twin-rut tracks. Drag to pan, scroll or use +/- to zoom, click to teleport. Keyboard arrows pan and Enter selects the map centre. Fullscreen moves to F10; F2 retains the existing developer landmarks.

Map destinations use the normal world-loading transaction. Lake clicks search the actual irregular shore for dry ground; building clicks select an exterior entrance. Final landings check terrain and the actual colliders in the surrounding 3-by-3 cells. Failed landings restore the previous position. Cell addresses remain BigInt throughout navigation.

## Rendering cost

- The map reads the same deterministic geography as the 3D world. It does not instantiate a second 3D scene or generate mesh detail.
- A dedicated worker rasterizes 128px terrain tiles with OffscreenCanvas. Jobs are batched, prioritized and cancelled when obsolete; at most 32 requests are in flight.
- Main image cache is bounded at 384 tiles (24 MiB of RGBA pixels); worker cache is bounded at 48 tiles with bounded geography metadata. Evicted and stale ImageBitmaps are closed.
- Minimap terrain paints at most 10 times per second; turning reuses the cached pixels through a CSS transform. Full-map paints follow input or tile revisions. Opening the opaque map suspends background 3D rendering while preserving destination loading.
- Browsers without worker Canvas support use a lazily loaded, time-sliced Canvas fallback. Its synchronous terrain stages may exceed the requested time slice; no hardware-independent FPS guarantee is made.

## Verification

- In 54 fields affected by the old farm mask, procedural trees increase from 0 to 84 and shrubs from 5 to 1,626; empty fields decrease from 49 to 5. One previously excluded building returns. 256 far fields compare equal, and 4,446 samples along the original photo rays retain their exclusion strength.
- 110,536 samples agree between the JavaScript mask and emitted scalar shader math. All 59 actual game GLSL programs compile and link in native GLES.
- Final world-worker transport checks restored cells (4,4) and (2,4), including far LOD: geography and generated geometry remain present and valid. Safe map landings pass real surrounding colliders for the restored building, a lake interior, and a coordinate beyond Number integer precision.
- The real map worker matches native Canvas image bytes and metadata. Bounded queues/LRU, duplicate requests, cancellation during bitmap creation, bitmap release, unsupported-worker fallback and worker-error fallback pass.
- Native map event checks cover cached rotation, progressive painting, drag/click distinction, cursor-anchored zoom, busy guards, keyboard targets, callbacks, disposal and huge-coordinate round trips.
- Worker hover labels respect the authored farm road mask, meadow and trees; 3,196 far-field hover samples remain unchanged.

These are native Node worker, Canvas and GLES checks plus source review. They do not establish browser layout, pointer-lock permission behaviour or device FPS.

## Implementation references

- https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas
- https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas
- https://web.dev/articles/offscreen-canvas

The navigation UI is an original implementation inspired by the requested minimap interaction; no Xaero code or assets are copied.
