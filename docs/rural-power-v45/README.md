# Level 10 V45 reconstruction

V44 source commit: `55b19600b3b63205cef8077a0c97cbb873c88a7a`. The earlier uncommitted V45 workspace was unavailable; this release reconstructs its requested changes on the preserved V44 source.

## Fog repair

The old directional front stopped advancing at a fixed world-space half-plane. During the last 28% of the 90-second arrival, the advecting front transitions into a spatially continuous fog wake. At completion all active-world positions use the same height/curl density field. The initial front remains anchored at the trigger location; floating-origin rebases do not drag it with the camera. Dry weather still skips both fog passes.

Actual production GLES fog shader checks at (16,68), (2000,2000), (-2000,-2000), and (1000000,-1000000) give 2.1–5.9% remaining contrast at 18 m. Height falloff remains active. These are shader measurements, not hardware FPS results.

## Electrical network

Road arc-length stationing, stable station IDs and spatial ownership prevent duplicated poles and mismatched attachments at streaming boundaries. Four 9–12 m main-pole families plus short service poles: tangent, double buckarm/dead-end, vertical and alley arm. Real building targets, including Kephart, request service branches. Poles, anchors and guys avoid road corridors and water.

Era-dependent generated timber/metal atlas, tapered poles, date plates, braces/bolts, glass/porcelain/polymer insulators, transformer tanks/fins/bushings, fuse cutouts/arresters, ground conductors/guards, guy guards/strain insulators, telecom splice cases and triplex eave drops are baked in the worker. Primary, secondary and telecom curves use different sag values. Curve endpoints are fixed; GPU sway vanishes at each endpoint.

The USDA Rural Utilities Service construction drawings inform visual assemblies:
https://www.rd.usda.gov/media/file/download/uep-bulletin-1728f-803.pdf
Actual engineering conductor clearances and sag depend on conductor, temperature and loading. The requested sag ranges here are artistic game parameters, not a construction compliance claim.

## Rendering and validation

Three hardware InstancedMesh batches and one instanced cable-ribbon batch. Shared attributes upload only on streaming changes; 10,000 unchanged-frame updates cause no instance-matrix or attribute uploads. Curves and wind use vertex shaders. Small distant hardware is physically omitted from uploaded counts, with full detail retained within 110 m. A 12-segment parabolic cable has a maximum centreline approximation error of sag/144 (under 1.4 cm for the largest 2 m sag).

Checks cover road/water exclusion, duplicate stations, shared endpoint transforms, huge BigInt origins, cable endpoint/sag math, fog lifecycle, worker-packet transfer and the complete fog/material/CSM/GI shader chain. Native EGL/GLES renders use actual Three.js geometry and production sky/optics, with diagnostic ground lighting. This environment uses Mesa llvmpipe software rendering; no user-hardware 60 FPS claim is made.

The V44 roads, wheat, farms, lakes, sky and camera optics remain unchanged apart from module cache versioning. All new source, generated texture and checks are committed through the Sites source workflow before publication.
