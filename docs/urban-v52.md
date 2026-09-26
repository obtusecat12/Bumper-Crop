# Level 11 street fabric, V52

This change addresses three linked problems: oversized open road space, unreadable black windows, and isolated buildings with no continuous street edge.

The ordinary city uses 112 m blocks, 15 m roads and 4.5 m sidewalks. The 15 m section includes four travel lanes with curbside clearance. Buildings occupy continuous perimeter lots with 35 mm party-wall joints; two 6 m portals reach an interior service court. The neighborhood seed selects 24 building categories, 36 facade profiles and 1–30 storeys by district. Office arcades are physically recessed and collision allows walking beneath their columns.

The two authored reference buildings remain unchanged. An external pavement layer completes the missing corner returns, preserves their steps and drain openings, and follows the distant reference footprints. The first ordinary block adjoining the landmark reserves an existing building's footprint. Pedestrian walk surfaces share the rendered heights, including ramp slopes and skewed transition paths.

Windows use view-dependent sky reflection plus analytic interior depth and half-raised blinds. Street-level rooms use 100 independently generated photographs; 72 code-designed commercial graphics include 40 fascias, 12 verticals, 12 plaques/decals and 8 billboards/roof signs. Business categories match fascia selection. The compressed source library is approximately 9.7 MiB; arrays share two materials rather than making a draw call per image. Full provenance and sign-generator source are in scripts/urban-v52.

Street amenities include tree grates and static photographic ficus crowns, hydrants, meters, drain grates, manholes, curb ramps, U-racks, colored newspaper boxes, utility labels/conduits, hinged dumpsters, wheel stops and a small number of period sedans. Roof equipment, wall AC brackets, downpipes, escape stairs, canopies and banners belong to the building that supports them.

Sources for dimensional judgment: the user-specified 14–16 m / 3.5–5 m range controls this scene. NACTO's urban street guide supplies a cross-check for travel lanes and separate sidewalk walking/furniture zones: https://nacto.org/publication/urban-street-design-guide/street-design-elements/lane-width/ and https://nacto.org/publication/urban-street-design-guide/street-design-elements/sidewalks/sidewalk-zones/ .

Validation uses geometric intersection and floor sampling, the existing 10→11→F2→10 lifecycle regressions, actual composed Three.js shaders compiled in software GLES, and offscreen rendered camera views. These are diagnostics, not browser screenshots or measured browser FPS. The static project's managed preview limitation prevents full browser interaction validation in this environment.
