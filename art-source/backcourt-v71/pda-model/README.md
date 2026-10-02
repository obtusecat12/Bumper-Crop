# 2009 PDA relic model

`pda-relics-v71.js` is a pure synchronous builder. It loads no textures, makes no materials, touches no scene state and allocates no animation loop. Copy it beside the existing `vendor/BufferGeometryUtils.js` module.

```js
const {object, charger, craft, stats} = createPdaRelics(T, {materials});
object.rotation.set(-Math.PI / 2, 0, -.38);
object.updateMatrixWorld(true);
object.position.y -= new T.Box3().setFromObject(object).min.y;
scene.add(object);
charger.position.set(x, groundY, z);
scene.add(charger);
```

The body axes are X width, Y length, +Z front. The body shell is 75 × 135 × 21 mm, centred at the origin. Physical buttons and camera extend beyond that shell. The camera lens and two lower moulded pads share rear Z = −13.7 mm, so the laid model has three rear contact points. The displaced stylus is part of the handset group, beside the casing and at the same support plane. The charger has normal world Y-up axes and bottom Y = 0.

The display is 48 × 64 mm inside a 56 × 68 mm frame. This keeps the generated UI's exact 3:4 portrait ratio within the specified thick PDA silhouette. Its texture plane, raised metal lip, and clear thin cover are separate geometric layers. All 26 letter keycaps, five bottom keys including a wide spacebar, two modifiers, four navigation keys, and the protruding trackball are physical solids. The resulting handset has 37 keys. A generated legend atlas is sampled on separate inset cards, with the adjusted crop UVs embedded from `keyboard-legend-lookup.json`.

The main casing is an authored rounded skin, not a generic box. The mini-USB port and long empty stylus channel remove real side-wall triangles. The USB cavity includes an inset housing, metal lip, tongue and five contacts. The casing also includes the side rocker, upper power switch, metal earpiece grille with twelve dark pinholes, camera lens and flash, rear battery hatch/release, moulded grips and four slotted screws. The separate stylus has a narrow shaft, gripped tail, tapered nib and metal clip. The nearby charger has a parting seam, two AC blades, recessed USB output, cable strain relief and an exposed mini-USB plug. The power lead is clamped to its radius above its Y-up ground.

The owner supplies `pdaBlack`, `rubber`, `steel`, `dark`, `screen`, `glass`, and `keyboard`. When supplied, `keyLegends` is used for the atlas cards; `keyboard` can remain the dark keycap material. Otherwise `keyboard` itself is treated as the generated legend atlas. Materials retain the owner's basecolour, normal, roughness, AO, environment and metalness mapping. Display UVs are 0…1; casing and solid accessory UVs use local metre-scaled projections. The code does not synthesize or paint any image.

Total geometry: **8,716 triangles, 10 material-group draws, 191 modelled components**. PDA: 7,072 triangles / 6 draws. Charger: 1,644 triangles / 4 draws. Tiny contact strips and seam solids use 12-triangle boxes; keycap corners and main chassis receive the curve geometry.

Run `node check-pda-model.mjs` for finite geometry, unit normals, UVs, supplied PBR material identity, all 26 letters, atlas bounds, real port/channel ray probes, triangle/draw budgets and grounded cable/laid-body checks. Results are saved in `geometry-checks.json`. Visual verification in the owner's courtyard remains part of the scene integration; this isolated module's checks do not claim to judge the final lighting or camera composition.
