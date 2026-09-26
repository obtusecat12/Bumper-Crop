# V53 — clinic infill, palm fountain square, and ground ownership

The user’s clinic-side and entry-road views revealed areas missed by the V52 front-camera review. This revision fills those specific voids using supplied references 3 and 5. The original clinic and Hope building geometry, storefront positions, collisions and reference cameras remain unchanged. Separate storefront attachments dress the clinic’s blank side wall; additions meet its physical footprint.

## Built

- Side infill: two-storey stucco/mosaic frontage with Óptica Visión Total and Farmacia San José upper fascia, Lavandería and Estética lower fronts, an adjoining glazed upper landing and shaded optician frontage.
- Far-edge strip: Librería El Estudiante, TecnoMóvil and Viajes Sol y Mundo, in that order from the courtyard. Physical aluminium mullions/handles, blue sloped canvas, gooseneck fascia lights, parapet coping, water tank, HVAC, antennas, drains and potted palms. Two quieter adjoining premises complete the street wall.
- A 41 × 33 m pedestrian square with eight mature palms, raised tree wells, planted seat walls, eight benches, bins, bicycle rack, newspaper box, bollards, lamps, ramp openings and a 10.44 m fountain basin. The basin has tile lining, coping, upper bowl, parabolic streams and time-driven water shading. It is collision protected.
- Two parked period cars occupy a small bounded service court outside the existing substation. A continuous walking route leads from the clinic courtyard through the gap between the substation and new infill, into the square and around the fountain.
- F2’s public-square destination now lands at the actual palm fountain plaza.

## Ground repair

The main Hope slab and transverse road now partition the surface into three disjoint rectangles. Reserved procedural block surfaces are clipped against fixed Hope, clinic, approach and new district coverage. Approach triangles are clipped at the exact city Z=-32 boundary and against the clinic apron. The former phantom approach sidewalk height ends at that boundary. The approach widens to the existing Hope curb line and its aggregate blends into the same world-aligned reference asphalt.

Rural terrain is discarded only under permanent Hope/new district paving while still in Level 10. Ordinary half-road strips no longer overlap their corner patches; service-court and alley slabs are partitioned. The obsolete clinic-side curb separating the expanded court was removed. These repairs change surface ownership, not the camera depth bias.

## Asset provenance

Seven independent built-in ImageGen outputs: three shop interiors, plaza pavers, fountain tile, palm bark and a true-alpha palm frond. Seven deterministic, separately designed sign textures reproduce the supplied lettering and simple logos. Source images, exact prompts, fetched prompt guidance, sign generator and provenance are under `asset-source/`. `assets.json` records the fourteen shipped runtime files and their SHA-256 hashes; runtime payload is approximately 1.7 MiB. Existing 100-window / 72-sign library remains available.

Source references are user-provided. Beauty-sign portrait is a native vector profile rather than an exact photographic portrait; storefront interiors are newly generated interpretations, not copied reference pixels. This is an interactive PS1-style reconstruction and is not certified as pixel-identical or AAA fidelity.

## Verification and limits

- `ground-and-district.mjs`: 313 ray-sampled road points have exactly one effective road surface; visible and walking heights checked where no raised reference landing overrides the road. 458 route samples are collision free. 1,847,898 district attribute values are finite. All 14 textures decode at their intended dimensions. Protected reference building source spans are unchanged. Fountain collision and plaza climate continuity pass.
- `full-chain.mjs` + native GLES linker: 107 actual material/fog/finish/shadow/GI shader programs link.
- Lifecycle regression: 481 corridor samples, Level 10 → 11 → F2 → 10 resource transitions, and all five existing city/photo destinations pass.
- Browser modules parse and `git diff --check` passes.
- Software GLES renders inspect the side infill, plaza entrance, shop close-up, fountain close-up and Hope entry join. These are actual scene meshes/materials with diagnostic lighting, labeled as such. They are not browser or deployed-site screenshots. The managed static-site preview cannot run browser QA here; real-device frame rate and temporal GPU output are not measured.

The new district adds 55,996 triangles in 49 merged material draws. Far city streaming remains the existing system. The sunny clinic environment extends over the new square and blends back toward the core outside its perimeter; the authored Hope and clinic photo camera environments are preserved.
