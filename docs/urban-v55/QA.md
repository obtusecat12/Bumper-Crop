# V55 inspection and change record

## Transition regression

The V54 permanent neighborhood asphalt rectangle reached back into the evolving rural route. Its terrain-discard footprint removed the original ground while the added slab covered the remaining rut blend. V55 uses the same tapered corridor polygons for terrain preservation, urban asphalt subtraction and raised sidewalk subtraction, through route station 218 m. The original terrain shader and relief progression are preserved. A second render exposed a crosslink sidewalk entering the path; that sidewalk is now clipped with the same corridor.

Disjoint polygon subtraction now exits early, preserving unrelated paving without subdivision slivers. Visible street surfaces and walking surfaces share the clipped polygons.

## Art and street life

120 individually generated period advertisements cover 1960s–2000s commercial styles. Four additional generated PS2 photographic materials cover parasol canvas, linen, wicker and terracotta paving. All originals and prompt provenance are committed. New ad arrays are batched by aspect family; the ECHO fashion wallscape uses a dedicated higher resolution texture. The superseded ordinary sign array is reduced to 128 px to offset memory growth; authored photo landmark signs are unaffected.

Added four café tables, sixteen woven chairs, three parasols, five potted palms, two terrace lamps, counter and menu signage. The fourth table was moved after visual inspection to clear an existing tree well. Terracotta paving preserves the existing tree openings. The deliberately sunken shopping cart is by the fountain terrace. Rear clinic service details include bins, bike, meter boxes, conduits, bench, stacked crates, a supported door canopy and wall graphics.

Ordinary facade openings, headers, canopy roots, blade signs and AC units share an occupancy plan. Roof bulletin supports reserve the front roof strip; HVAC stays behind it. The fixed ECHO wallscape occupies a blank face on an ordinary 14-floor infill tower east of the plaza; F2 includes a clear viewing destination. Protected Hope Street and clinic geometry/weather are preserved.

## Verification

- 120 unique original ad SHA-256 values; 119 ordinary images reachable by deterministic placement and one fixed ECHO hero.
- 216 representative ordinary facade configurations; 185 accepted AC fixtures and 96 projecting signs clear other reserved facade regions.
- 204 rural road, 42 soil shoulder and 325 raised-pavement exclusion samples preserve the route.
- 125 single-owner road samples, eight visible/walking-height samples and 981 pedestrian-route samples pass; 18 infill parcels avoid protected masses.
- Six F2 destinations verified, including ECHO. Level 10 → 11 → F2 → 10 lifecycle and 481 route samples pass.
- 124 real shader-chain programs compile/link in software GLES; native views report no GL errors.
- Browser-module syntax checks pass.

## Render scope

Files in `diagnostics/` are software GLES renders of the actual exported Three.js scene geometry, textures and material shader hooks, with diagnostic lighting/shadows. They are not browser or live-site screenshots; this environment did not provide a supported preview path for the existing buildless site. Native inspection was used for visual geometry, texture orientation and junction checks. The unchanged deployment thumbnail is preserved.
