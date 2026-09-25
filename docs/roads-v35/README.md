# V35 — hierarchical fields and farm roads

Agricultural parcels now use signed-BigInt-owned macro rectangles with shared jittered edges (nominal 400m; widths 310–490m), recursive unequal slanted binary splits and extra cross-splits near larger barns, lake edges and road junctions. Open land stops early. Proposed children smaller than 40×60m are rejected. Road membership is selected separately from parcel ownership; many small field boundaries are simply crop boundaries.

Primary roads are mostly straight, with sparse transverse connectors, 10–20m offset attachments, asymmetric T connections, oblique field-access branches and fading dead ends. Actual road centerlines are sampled into bounded per-chunk spatial buckets. Roads, clearance, terrain, map and indirect ground albedo use the same sampler. Every crop parcel is fixed by world seed; streaming order does not choose geometry.

Shared macro road nodes are projected onto dry land when a lake covers them, then all incident routes share that exact node. Partial shoreline detours use existing lake distance/contour functions and cubic transitions. Concave bays can require an outer-envelope route beyond the preferred 20–40m band; no lake geometry is altered. Lake-owned 15% access selection creates a spur only when it can connect to a real road and a shallow dry bank. Muddy oval turnarounds have 6–8m radius. Optional wet traces fade out landward of the old mudflat. These access surfaces have no terrain relief.

The original arrival core (world x −40…128m, z −144…128m) retains V34 roads, crops and wheat eligibility. Its 72m outer feather joins the new geography. Fixed building transforms and all lake-generation/shore-shape code remain unchanged. A continuous, periodic outer-bank vegetation mask sets cereals back beyond the old bank and adds irregular turf using an independent random stream. The ground shader reuses existing albedos with two extra vertex scalars, adding no fragment samplers.

## Evidence

- `node tests/roads-v35/check.mjs`: 648 exact birth samples; 2,176 shared-edge checks including negative/huge BigInts; 1,465 unchanged water/shore samples; max seam error 7.1e−15m. 25 macros span 343.5–449.3m, with 317 parcels, 213 small parcels and 19 large parcels. Two connected lake-access pads occur in that sample.
- Independent Astra ultra review checked additional birth, wrapped shore coordinates and the two former main-lane gaps; no critical blocker remained.
- Native GLES compiled the actual packed/unpacked full pond shader chain (fog, GI, shadows, wet ground, caustics), with 13 active fragment samplers. 25 real terrain meshes and actual water material rendered in three diagnostic poses, zero GL errors. Those images intentionally omit vegetation and UI and are not gameplay screenshots.
- `node tests/roads-v35/shore-array-packet.mjs`: all five 512×512 terrain texture layers survive worker packet transfer, retain texture settings and dispose exactly once. The V34 fixture was updated to use the V35 module URL after the cache-version bump.
- Managed browser rendered the actual game map module in three 1024×1024m areas. `map-browser.jpg` is that browser inspection.
- **Full 3D browser gameplay and frame rate were not verified:** the managed browser cannot create WebGL2, including on the unmodified V34 game. This release does not claim a complete first-person visual or performance pass.

Reference informing sparse purposeful access and contour-aware routing: USDA NRCS Access Road 560 (2020), https://www.nrcs.usda.gov/sites/default/files/2022-08/Access_Road_560_CPS_9_2020.pdf . Requested field dimensions and probabilities are art-direction targets, not universal agronomic standards.
