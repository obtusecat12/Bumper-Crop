# Fountain v54 integration

Copy `fountain-water-v54.js` into `dist/` (root owns checkout). Its vendor import is correct there. No generated water image is required. All existing tile imagery stays visible through the pool.

In `clinic-district-materials.js`, import `addFountainWaterMaterials`. Keep existing `fountainClock` / `fountainCenter` exports, and replace both old fountain-material definitions with:

```js
addFountainWaterMaterials(m,{clock:fountainClock,center:fountainCenter});
```

In `clinic-district.js`, import `addFountainLiquid,finishFountainLiquid`. Inside `fountain(b,x,z)`, retain the stone rim, tile bottom, granite stem, upper bowl, and bronze finial. Remove only the original `.31` water disk and both rod loops. After the finial add:

```js
addFountainLiquid(b,x,z);
```

After `b.finish(...)`, replace the old hard-coded two-material shadow traversal with `finishFountainLiquid(object)`. New materials identify themselves with `userData.fountainLiquid`. Keep fountainClock tick unchanged. `addFountainLiquid` derives center and orientation from the actual UrbanBatch frame and overwrites the center uniform with that exact center.

**Origin rebasing**: `vFountainAbsolute = position.xz` samples the local ripple field against the absolute fountain center; `vFountainWorld = modelMatrix * position` is used only for the rebased camera view vector. This avoids distant origin changes sliding the ripples. Normal directions depend only on viewMatrix rotation. Splash directions are rotated once with the UrbanBatch yaw convention.

**Physical placement**: 12 nozzles start at radius .21, Y=2.28 and impact radius 2.13, Y=.31. 20 rim overflows start at radius 1.24, Y=1.582 and end at radius 1.40, Y=.31. Original overflow rods started inside the solid granite bowl (R=1.13,Y=1.54), so this moves their origins to the real rim. A shallow upper bowl water disk is at Y=1.585. Ripple source constants derive from the same exported path values. AddFountainLiquid adds short bronze nozzles attached to the center finial.

**Work budget**: 7,856 triangles total including 12 nozzle tubes, with 3 water-material draws + bronze batched into the existing material. No per-frame allocations. 96 impact droplets animate through attributes and the shared clock. Jets are continuous connected tubes, 24/16 length segments, 6/5 cross-section sides, tapering and low-opacity end breakup. Sphere bounds get a .24 m motion margin. `renderOrder` 1/2/3 stabilizes pool→stream→drop transparency.

**Reflection**: native StandardMaterial lighting, neutral sky Fresnel response and approximate soft silhouettes of the two actual shop wings and eight palms. These local proxy reflections are deliberately cheap; they are not full scene reflections or ray tracing. The real tiled bottom is visible through alpha blending, not a fake bottom texture baked into the surface. Surface normals include capillary ripples and localized impact waves; their heights are not geometry-displaced.

**Validated**: Node syntax, creation and merge of all geometry attributes, all 32 path endpoints exactly on water Y=.31 / correct radii. All three actual modified StandardMaterial shader programs compiled and linked with Mesa OpenGL ES 3.2. Visual check in the root scene remains necessary; particularly inspect the pool from a shallow walking angle and above. The upper water disk should cover the existing upper tile cylinder without piercing the central stem.

**Optional texture finesse**: do not increase water metalness. If the pool is still too opaque at street eye height, reduce shader alpha base .19 to .15 before changing color. If streams vanish in VHS filtering, raise the base alpha .19 to .24 or base radius .016 to .018, leaving the end taper intact. Do not make streams opaque white.
