# V50 — two authored photographic street landmarks

The two user-supplied images are preserved as `reference-1.png` and `reference-2.png`. Photo 1 defines the Hope Street canyon at the end of the Level 10 exit path. Photo 2 defines the clinical and bakery courtyard beside the earlier commercial transition. Neither scene uses the reference photograph as a screen-filling background.

## Implemented

- Fixed, traversable building groups with stable positions: Hope Street at path distance 382 m and the commercial court at 282 m. Procedural parcels are reserved around the authored sites, with later city blocks continuing beyond them.
- Hope Street: concrete office fins, recessed shop arcade, beige PEGASUS tower and banner, glass corporate podium, outdoor staircase, small inset windows with curtains, red signals, Hope street plate, ficus tree rows, parked cars, hydrants, meters and bins.
- Clinic court: stepped white parapets, stone return wall, three individual commercial signboards, green laboratory windows, continuous sloping blue canopy, frosted clinic storefront, bakery frontage, switchback ramps and paired rails, parking wheel stops, rooftop mesh dish, tank, chimney and antenna.
- Thirteen newly generated runtime WebP textures: six separately tiled surface maps, three commercial signboards, one laboratory window and three transparent ficus assets. Tiled maps use metre-scaled UVs and RepeatWrapping, never mirrored wrapping. Generated source PNGs and prompts are retained under `art-source/reference-v50` and this directory.
- Position-dependent lighting and sky: pale overcast green-grey downtown, clear blue commercial court, with independent sun direction and exposure. Influence is bounded along the exit path so it does not recolor remote Level 10 terrain.
- F2 has two photo comparison positions. They use the reference aspect ratio, calibrated perspective and clear rendering while stationary; movement or looking around restores normal exploration rendering and saved filter preferences.
- Authored collision footprints and walk surfaces are included in the city map and navigation. The original commercial-edge shortcut now lands at the actual commercial court.

## Verification and limits

`tests/reference-v50/verify.mjs` decodes all 13 textures, checks sampler modes and finite geometry, samples 690 points across the Hope Street carriageway, checks photo and commercial spawns, walk surfaces, and rural weather isolation. `lifecycle.mjs` checks 481 exit-path points and the Level 10 → 11 → F2 → 10 lifecycle. `teleport.mjs` exercises all five city destinations using the actual main event handler.

All browser modules parse. Native software GLES links 83 material programs through the production fog, finish, shadow and irradiance hooks. The production sky and four related postprocessing programs also compile. The attached inspection images are **software GLES diagnostic renders**, not browser screenshots: their lighting uses a diagnostic shadow projection and ambient approximation. They are useful for geometry, texture and overlap inspection but cannot establish final browser appearance, frame rate or device compatibility. Browser QA was unavailable in this managed environment.

This is an explorable reconstruction from single views. Proportions, unobserved sides, small lettering, glass reflections, foliage silhouettes and shadow details remain approximations. It is not pixel-identical to either photograph and has not been validated to an AAA production standard. The image generation, model reconstruction and source tests do not remove those limitations.

## Reproduce

```sh
node scripts/pack-reference-textures.mjs
node scripts/check.mjs
node tests/reference-v50/verify.mjs
node tests/reference-v50/teleport.mjs
node tests/reference-v50/lifecycle.mjs
node tests/reference-v50/full-chain.mjs /tmp/reference-shaders.json
python tests/water-v28/native/gl_native.py /tmp/reference-shaders.json
node tests/reference-v50/native-fullscene.mjs /tmp/reference-inspection
python tests/reference-v50/native-render.py /tmp/reference-inspection/photo-hope
python tests/reference-v50/native-render.py /tmp/reference-inspection/photo-clinic
```

The image and diagnostic scripts require the runtime canvas module and software GLES dependencies available in the authoring environment.
