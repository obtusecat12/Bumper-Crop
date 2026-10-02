# V70 local vending rigid-body world

`vending-physics-v70.js` imports one local ESM vendor: `vendor/cannon-es.min.js` (cannon-es 0.20.0). Copy both into the equivalent `dist` locations, with `vendor/cannon-es-LICENSE.txt` and provenance. No network/CDN or WASM initialization occurs in gameplay.

## Coordinates and meshes

Use the vending machine's local coordinate frame: +Y up, +Z front, ground at local y0. Add drink groups under that frame. The physical world never receives the game's large absolute coordinates and never needs origin rebasing.

```js
const physics = createVendingPhysics({
  THREE: T,
  profiles: {pet: petProfile, can: canProfile, soy: soyProfile},
  layout: {
    width: .46, floorY: .37, spawn: [0, .66, -.04],
    deliveryPusher: true,
    groundPatch: {size: [1.18, .012, .78], center: [0, .006, .62]},
    maxCpuMs: 3, maxSolverSteps: 8
  }
});
const record = physics.spawn('pet');
// Record output already converts COM back to the product's bottom pivot.
product.position.fromArray(record.position);
product.quaternion.fromArray(record.quaternion);

physics.step(rawDt, {active: playing && visibleOutdoorCourtyard});
for (const record of physics.bodyTransforms) {
  const product = meshes.get(record.id);
  product.position.fromArray(record.position);
  product.quaternion.fromArray(record.quaternion);
}

// Physical tongue is centered, not bottom-pivoted.
tongue.position.fromArray(physics.pusherTransform.position);
tongue.quaternion.fromArray(physics.pusherTransform.quaternion);
```

The default floor is .64m wide, .25m deep, centerZ .04m, top center y .48m. Its actual rotation is **positive 2.5 degrees about X**, so +Z goes downward. Side walls are .035m thick/.15m high; rear wall is .17m high. A real rounded .014m front stop allows a bottle to climb and leave under the next drink's contact pressure. The authored reference unit overrides width .46m, floorY .37m and spawn y .66m. Keep its collection opening x[-.255,.255], y[.34,.64] free above the tray. The ground patch has genuine 12mm thickness.

The optional delivery tongue has width `min(.38,width-.055)`, height .07m, depth .010m. It only actuates if **two old drinks remain in the tray**. It advances above the tray, folds forward to almost horizontal, retracts flat, then stands behind the backplate. A straight upright reverse stroke was rejected because it mechanically trapped new bottles against the back wall. Use `pusherTransform` for the visible metal tongue. It never manually translates a drink and never explicitly wakes ground drinks.

## Interaction and inventory

- Call `spawn(type)` after the dispensing animation starts; types are `pet`, `can`, `soy`. A roughly **1.1-second dispensing cooldown** fits the motor cycle. `null` means 32 objects already exist or the insertion column is physically obstructed above maxSpawnY 1.42m. Show a short waiting prompt and retry later; do not create an overlapping body.
- `records` is a `Map<id,record>`; every record includes `type`, `position`, `quaternion`, `body`, `profile`, `sleeping`, `grounded` and `inTray`.
- `remove(id)` permanently removes the body, for collecting into the shared inventory.
- `take(id)` returns a COM pose/velocity snapshot and removes the body, for temporary inspection.
- `restore(snapshot)` restores that COM pose with zero velocities by default; optional velocity/ angularVelocity overrides are supported. This is for a temporary return/drop. Do not restore a consumed drink.
- `setPaused(true)` and `step(dt,{active:false})` discard substep debt. Indoor scenes and hidden pages do not advance outdoor objects.

`main.js` existing minimum integration points (line numbers as inspected V69):

1. `scanInteraction()` around line529, after active inspection handling and before rural pickup scanning: query nearby dynamic drinks and machine interaction from the authored courtyard, using the current local origin. Prefer a drink hit in view over the machine behind it.
2. `use()` around line450: handle machine dispensing and drink collection before rural `bottle`; remove the body/mesh and begin the inspection with the **actual vending product model**.
3. `animate()` around line590: outdoor branch only, `physics.step(rawDt,{active:playing&&state.level===11&&courtyardVisible})`. Never step this world in Level27 or inside the bathhouse. Sync only changed/awake records if desired; no body simulation is necessary for sleeping records.
4. Inventory/R/Q handlers around lines448/471: route vending variants through `createVendingDrink` so PET/can/soy remain their own meshes/labels. Existing `createAlmondInspection().begin()` currently only constructs `makeAlmondBottle`, and should accept a custom item/model factory or delegate based on variant source. Do not silently inspect vending products as thermos/glass bottles.

## Solver and cost boundaries

- A constant120Hz timeline with gravity, full angular inertia, friction, restitution and genuine convex contact resolution. Fast impacts use up to3 subdivisions, with a **maximum8 actual solver calls per RAF** and a default3ms budget checked between calls. One solver call can overshoot the budget; record it instead of claiming a hard browser-time ceiling.
- Budget exhaustion discards catch-up debt and is recorded in `budgetDroppedTime`/`budgetOverruns`. Under an exceptionally dense32-body pile, simulation can slow while camera/input/rendering stay independent.
- Bottles use two12-sided convex frusta: cylindrical continuous body and tapered upper shoulder/neck. Small heel beads and label relief remain only in render geometry. This is a deliberate collision approximation; cans use one12-sided cylinder. Supplied `colliderSegments` can provide a tighter profile when needed, but large profile arrays should not become dozens of coincident collider caps.
- Rolling resistance is a real opposing torque while supported, additional to contact sliding friction. No object follows a predefined rolling path.
- Sleep uses supported surface motion rather than treating tiny discrete gravity taps as renewed rolling. It does not freeze a ground contact while penetrating more than1mm. Fresh collision impulses wake old objects normally.
- `stats.maxPenetration` uses **pre-integration** contact geometry. Old contact points paired with a newly rotated pose would falsely report severe overlaps. `tests/physics.mjs` additionally regenerates the narrowphase at the final frozen poses and checks actual <2mm settled overlaps.

## Reproducible checks

```sh
node tests/physics.mjs
node tests/benchmark.mjs
```

The behavior test uses full simulation budget so its geometry results are deterministic; a separate production-budget benchmark reports real bounded runtime. Reports are Node CPU diagnostics, never browser gameplay FPS. The test covers 12mixed drinks, displacement of older items, rotation/rolling, settling, ground support, the authored .46m tray, actual12mm rubber mat support, positive slope direction, pause/no catch-up, pick-up/restore and32-object capacity.

Primary documentation inspected:

- https://pmndrs.github.io/cannon-es/docs/classes/World.html
- https://pmndrs.github.io/cannon-es/docs/classes/Cylinder.html
- https://github.com/pmndrs/cannon-es/blob/master/getting-started.md
- https://rapier.rs/docs/user_guides/javascript/rigid_bodies/ (alternative surveyed; not added)

The project had no existing rigid-body physics dependency. This pure ESM implementation was approved by the root agent as the necessary dependency for the user's requested physical vending interactions.
