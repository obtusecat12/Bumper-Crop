# V58 — Palm Court and restored rural contact

The plaza borrows specific spatial ideas from photographed shopping courts, documented in `assets/v58-provenance.json`: arched covered circulation, geometric planted seating and public utility islands. It does not claim a one-to-one recreation of any entire reference photograph. Four independently generated plaza textures and five generated pantry textures are preserved with their prompts. Runtime cans use 384×128 labels, 128×128 lids, nearest magnification and twelve-sided bodies.

The east arcade has 3.18m minimum clear headroom, real columns, gutters and downpipes. A phone island, vending machine, directory, stopped clock, closed film-processing kiosk and angular planting court add occupied edges. The existing main clinic/courtyard/fountain route remains open; the service cart was moved aside to open the arcade exit. Every new base rests on the existing paving; no new ground plane covers the rural transition.

Cereal contact was absent from the current immutable-instancing material. V58 connects player position and a 12-sample wake to its live vertex shader, converts world-space displacement through each scaled/rotated instance basis, preserves grounded roots and recovers within 2.85 seconds. Uniforms update even when camera-cell selection does not. Chunk rebasing translates the wake, while distant teleports clear it. Instance arrays remain immutable.

Camera shoulder transfer, vertical gait, fore-aft movement and heel impacts were increased. Actual resolved travel still drives gait; blocked movement, photo lock and reduced-motion settings retain their prior behavior. Floor tins use an independent deterministic seed, are excluded from privies, and avoid actual building/furniture OBBs. They are environmental props, not new inventory items.

## Verification

- 154 JavaScript modules passed syntax/path checks; the whole module graph uses release query 58.
- Camera: 18 checks passed across 30/60/120/144Hz, including stopping, landing, rebasing, reduced motion and photo lock. Ten-minute run maximum camera offset 6.59cm, maximum angular sway 1.01 degrees.
- Cereal renderer: 53,359 pixels changed under body contact in a fixed 960×720 view; full recovery exactly matched the baseline below the diagnostic caption. Instance buffers were unchanged. The full fog/finish/CSM/GI/batching shader chain linked all 12 programs, including food textures and cereal wake.
- Food: 32 building/rotation/scale cases, 70 tins, all four labels, 42 sideways poses; maximum floor-contact error 0.33mm. Worker serialization retains UVs, generated image pixels and nearest filtering.
- Streets: 1,094 clear pedestrian samples, 125 road samples with one ground owner, 31 complete district textures. Transition: 204 road, 42 shoulder and 325 pavement-exclusion samples preserve the original gradually changing ground. 481 route samples plus 10→11→10 lifecycle passed.
- Actual geometry rendered at entry, phones, arcade, kiosk, two indoor food viewpoints and three cereal interaction states; no GLES errors.

Images are **software GLES diagnostics, not browser or live-site screenshots**. The city captures use a diagnostic background and omit the browser sky/postprocessing pipeline. Existing scene weather was not changed. Browser runtime and device frame-time validation remain outstanding because the required managed-preview browser capability is unavailable.
