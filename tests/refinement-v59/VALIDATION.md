# V59 — spring hydrology and painted bathhouse

Observed the five supplied local reference images. Built-in ImageGen produced nine original texture assets (two wall murals, ceiling mural, ceramic tiles, two towel fabrics, two transparent splash textures, honed granite). Original images and exact prompts are under art-source/bath-v59; runtime WebP conversions are under dist/textures/bath-v59. No procedural image substitutes.

The Level 27 chamber retains an 18.58 m² gross waterline survey footprint. Eight stone treads end on a raised dry bank; the natural stream occupies a separate lane to the side and joins the northern waterfall. The western waterfall follows three geological ledges, with a continuous gravity envelope, curved sheet and volumetric edge rivulets. A 23 cm × 18 cm natural corner aperture drains the basin. A 1.24m-wide granite pedestal basin, ladle, bucket and textured towels sit on the dry bank.

The exterior bath occupies the existing 5.6 × 6.8m parcel. A glass-door interaction enters a separate indoor scene: reception, empty blue-tiled pool with real white columns/balustrades and painted sea/cloud textures, left passage and four independently operable showers. Contact with running shower water invokes the existing lens runoff / water-film system. Highest preset and closed eyes remain required to enter Level 27.

Clearwater inspected through GitHub: Aureliengmz/clearwater, index.html blob b2cda8603004875cedd29d00505808e5ef94edab, README fb040884358e0e30ac0e2e3baf3a058177e58dad, license 2a5322d83ec3cb6905bc1138a968ec78049e8ba4. Adapted the damped wave equation and exact dielectric Fresnel calculation, preserving Copyright (c) 2026 Lumaris and MIT notice. This is an adaptation to the existing Three.js planar reflection/depth-refraction system, not an import of Clearwater's entire ocean/FFT renderer. Cave ripple simulation has a fixed timestep and byte-packed slope texture, so it does not require an additional float-render-target capability.

Verification:
- Browser-module syntax checks pass across dist; git diff --check passes.
- 1,157 cave-route samples and 3,303 bathhouse-route samples pass, including entry/exit steps and all shower aisles.
- All eight rendered stone tread heights match the movement authority.
- Minimum measured tunnel/stair headroom: 1.976m.
- Geological shell: 225,164 triangles, zero boundary and nonmanifold edges.
- 104 sidewalk-to-door samples pass; max visible/walking floor disagreement under 0.000001m.
- Production E controls and enter/leave functions executed in VM: street → bathhouse → hot shower → spring → same shower → exact original BigInt street pose. F2 unwind preserves inventory and returns correctly.
- Actual Three.js geometry, generated textures and material shaders rendered in software GLES, including four point-light shadow cubemaps and planar water reflection/refraction. Inspected pool room, reception, operating shower, cave overview, cascade, dry bank, tunnel, corner drainage and alley entrance. GLSL programs link and render without GL errors.
- Visual iterations fixed inward-facing pool drainage grilles, pool-bottom triangulation at the outlet, waterfall/rock clearance, missing granite appearance and dry-bank movement clearance.

Limits: these are offscreen GLES diagnostics, not browser or live-site screenshots. Browser QA is unavailable under the current Sites managed-preview capability. No claim of pixel-identical reconstruction; geometry and generated mural interpretation were compared visually to the two supplied pool photographs. Runtime full-screen VHS/lens optics are existing game systems; shower contact integration was checked in code and control flow, not captured in a live browser.
