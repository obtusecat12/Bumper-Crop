# V51 — reference frontage, material and lighting repair

Implemented against the supplied 2048-pixel Hope Street and clinic photographs, the defect screenshots, and four close detail crops. Three delegated agents handled independent storefront assets and reference auditing; source integration and publication were handled in the owning checkout.

## Changes

- Added six individually generated opaque storefront/door textures: convenience store, corporate lobby, travel shop, Dermica wing, bakery, and frosted clinic frontage. Every image uses its own clamped UV surface. Source PNGs and exact built-in image-generation prompts are retained in `art-source/reference-v51` and the prompt manifests here.
- Regenerated the clinic stone veneer with quieter rectangular stone courses; added a separate fine granite surface for stairs and corporate cladding. Both are repeatable textures with metre-scaled UVs. The scene now loads 20 photographic textures, eight newly generated or replaced in this revision.
- Completed the clinic left wing with glazing, canopy, supporting posts, parapet and returning building mass. Replaced the isolated stone pylon with a continuous thin wall and return. Adjusted dish/tank roof anchors, built a genuinely open rib-and-ring dish, and raised the main canopy slope to meet its sign band.
- Cut real entry apertures into the corporate podium, connected its landing to the doors, added sloped granite cheek wall, returned handrail, step lights, louvers, planted terraces, physical pulls, panel seams and fastening details.
- Reduced excessive facade-fin projection that hid glazing from the street. Differentiated punched-window proportions, corporate mullions and Pegasus window groups; corrected the banner lettering layout and added circular Famima signs, Metro and parking plaques, curb drains and lamp/pole details.
- Removed tilted shadow cards completely. Sun direction, neutral ground bounce, glazing reflection and horizon-to-zenith sky colour now come from the reference environment. Tree shadow shape is produced by the light and physical foliage caster geometry.
- Added continuous city ground beneath reserved parcels, a shallow clinic apron and curb opening, and surrounding infill. Removed the invisible walking-height curb across the clinic driveway. Generated interior windows are also available to procedural shops.

## Verification

- Decoded all 20 photographic textures; verified wrap modes and finite geometry.
- Sampled 690 Hope Street carriageway points, the photo spawns, and 57 downward rays across the clinic apron; checked visible ground against walk height.
- Passed the existing five-destination F2 handler test and 481-point exit-route / Level 10 → 11 → F2 → 10 resource-lifecycle test.
- Compiled and linked 93 actual material/sky/depth programs from the production fog, finish, CSM, GI and batching chain under GLES 3.2; maximum active fragment samplers 14, below the WebGL 2 minimum limit of 16.
- Inspected six software-rendered viewpoints, then repeated both reference views and close stair/wing views after geometry corrections. Diagnostic images are explicitly labelled and retained here. The diagnostic shadow pass is a single light-space map, not the browser's production cascaded-shadow renderer.

The Sites managed preview has no compatible dev-server profile for this plain static project, so no browser screenshots or measured browser frame rate are claimed. This remains a three-dimensional reconstruction, not a pixel-identical copy of the photographs; interior imagery and obscured architectural details are inferred. Actual browser lighting, shadow softness, foliage and performance require a supported browser review.

## Reproduce

```sh
node scripts/pack-reference-v51.mjs
node tests/reference-v51/verify.mjs
node tests/reference-v51/teleport.mjs
node tests/reference-v51/lifecycle.mjs
node tests/reference-v51/full-chain.mjs /tmp/reference-v51-shaders.json
python -B tests/level11-exit-v48/shader-check.py /tmp/reference-v51-shaders.json
node tests/reference-v51/native-fullscene.mjs /tmp/reference-v51-views
python -B tests/reference-v51/native-render.py /tmp/reference-v51-views/photo-hope
python -B tests/reference-v51/native-render.py /tmp/reference-v51-views/photo-clinic
```
