# V71 clipping relics

`clipping-relics-v71.js` is self-contained: copy it beside the scene module and import `createClippingRelics`. It has no loader, DOM, animation, or texture dependency.

```js
const relics = createClippingRelics(T, {materials});
const {fountain, monitor, chair, craft, stats} = relics;
fountain.position.set(30.2, -.45, 19.1);
fountain.rotation.y = -.12;
monitor.position.set(40.2, 1.06, 18.40);
monitor.rotation.y = -.15;
chair.position.set(28.6, -.35, 19.45);
chair.rotation.y = .21;
root.add(fountain, monitor, chair);
```

All roots use ground `y=0`, metre units, `+z` front. The owner applies these intentional clipping transforms. The CRT front faces the courtyard; its rear crosses the local `z=18.34` wall plane. Ground burial is the approved anomaly, not an unintentional support error.

| Prop | Normal root dimensions | Geometry / support | Intended transform |
| --- | --- | --- | --- |
| Fountain | Width .508 m, depth .408 m, height **.900 m**; nominal rim radii .250 × .200 m | Closed 139 mm deep concave oval basin; open central throat and six actual strainer slots; hollow pedestal; ground flange and four bolts; curved gooseneck with pipe wall and nozzle opening; supported riser; curved service plate; side push button | Root y −.450 gives rim y **.450** |
| CRT | Case/front .380 m wide, full model .340 m high; case depth .399 m; control and cable protrusions make total depth .435 m | Stepped tapered rounded rear shell; physical side vent openings with shell thickness and five louvers per side; rounded bezel aperture; curved .290 × .218 m screen, perimeter 26 mm recessed and center 15 mm recessed; button, LED, cable; swivel dish, tilt cradle and four floor contacts | x 40.2, y 1.06, z 18.40, yaw −.15; intentionally embeds rear into wall |
| Chair | .430 m wide × .476 m deep × .798 m high | Continuous curved molded seat/back, **16 mm normal thickness**; four curved rounded plastic legs; connecting cradle and rear gussets; all four flat foot caps touch y=0 | Root y −.350; yaw .21 radians (12°) |

Supply `steel`, `cream`, `rubber`, `dark`, `crtScreen`, `glass`, `led` materials. PBR maps remain owned by the scene. The CRT image uses standard 0–1 UVs, correct image orientation, and a convex front surface; `glass` is an optional extra highlight layer. No transmission shader is created. Omitted materials get cheap StandardMaterial fallbacks. Caller materials are never disposed by the factory.

Each prop is already merged per material while preserving independent transforms. With all seven supplied materials, the factory returns **10,900 triangles, 11 meshes/draws**: fountain 5,304/3, CRT 3,944/7, chair 1,652/1. The owner may merge the static props again per material after placing them. Geometry is tagged `userData.exitStatic` and roots carry `userData.intentionalClipping`.

Run `node v71-clipping-models/verify-relics.mjs` from the workspace. The check verifies finite attributes, budget, root bounds, upward/inward basin and outward bowl normals, an unobstructed physical strainer slot and drain throat, CRT screen depth and front normal, an actual unobstructed vent aperture, chair seat/back normals, burial and wall-plane crossing. Four chair feet, the fountain flange and CRT base physically meet their normal root plane. Shaft, cradle, gusset, riser and control joins overlap their supporting geometry. The `craft` and `stats` records are returned for integration/debugging.

Call `relics.dispose()` to release the module's merged geometries and any fallback materials. Do not call it after transferring those geometries into another batch unless that transfer has copied them.
