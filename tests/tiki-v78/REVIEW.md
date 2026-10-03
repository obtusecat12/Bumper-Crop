# V78 — Tiki interior correction and reference audit

Scope: only the cocktail return, backbar, idol/lantern corner, one Moai pond, canoe buffet and their indoor lighting. Existing facade, building, baths, NPCs, vending, outdoor lighting and the ten-image entrance remain unchanged.

## What the original photographs establish

| Reference | Source reading | Implemented correction |
|---|---|---|
| 1: cocktail photograph | Closely grouped mixed vessels; 3 nested bowls; 2 patterned tumblers; tan wahine and brown tiki mug; four inverted bottles and two empty dispenser rods; independent rear work surface | 13 vessel/prop groups placed tightly on a 2.66 m counter without shrinking the vessels, separately UV-mapped mosaic cups and olive ashtray, modeled garnishes, aligned blue/yellow surfboard, ten rear bottles, four labeled inverted bottles; 0.52 m gap behind front counter; the L junction is trimmed to one nonoverlapping top surface |
| 2: prior red-lantern screenshot | Excessive red glare; sparse/wrong shelf grouping | Steady 0.16-power bounded red practical; horizontal brass guards; much lower emissive/bloom; separate four-row cabinet |
| 3: original idol/cabinet photo | Dense cropped bottle rows; idol right, red lantern/stirrers/T1 lower-left; COLD BEER and small wire rack to right | 48 labeled cabinet bottles, separate service aisle of 1.48 m, 37 stirrers, existing T1 model, repositioned sign and grounded small display rack |
| 4–5: side and frontal pond photos | Two views of ONE pool; partial gray wall with red upper background, reddish-brown nonmetal Moai, one compact waterfall, yellow left and green right underwater light, disk filter and lily | Same single basin from both views; masonry backing closes block joints; generated shallow Moai normal/roughness/AO, aligned dual-layer gravity-shaped falling sheet and 144 local analytic GPU splashes; spatially aligned underwater light pools and irregular foam |
| 6: prior dark dining screenshot | Door, booth seats and room envelope lost in black | Broad fixture-positioned reflected fills preserve warm local pools and darker ceiling without hiding circulation or furniture |
| 7: canoe photograph | Open dugout, THREE recessed ceramic trays, retained ice, three coconut ladles, near-bow overlapping fruit and TWO tiny clay souvenirs | Rim 0.96 m; tray lip 0.8575 m (at least 10.25 cm below central rim), three distinct generated tray surfaces, 126 modeled ice facets, tilted coconut bowls, separately generated fruit/striped melon and two distinct souvenir faces |

Counts are visible-object interpretations, not recovered ground truth. The original low-resolution source cannot resolve every bottle brand or hidden object. Generated enlargements are interpretive and were not used to invent an exact census. The early bottle-agent draft counted six filled dispensers; the final implementation follows the original and detailed cocktail inventory: FOUR bottles plus TWO empty rods.

## Generated-art delivery

24 new runtime maps, 11,015,571 bytes including manifest at packaging time. Four 2048² atlases contain 64 independently different label cells; required bar groups use 63 identities (48 cabinet + 10 rear counter + 4 inverted + 1 foreground beer), with one spare. Eight bottle profiles, varied proportions, glass colors, neck bands and caps accompany the labels. Existing V77-generated blue/wahine/brown mugs, botanical cutouts, brass, masonry, canoe, rug and ceramic artwork remain in use.

New assets include two mosaic wraps, olive ashtray artwork, five Moai material maps, irregular native-alpha foam, four fruit wraps, four souvenir face/torso crops, three tray-content images and one small-object atlas. Artwork provenance, exact prompts, original outputs, crop bounds and actual dimensions are in `art-source/tiki-v78`.

All seven supplied images received image-model restoration/enlargement attempts with requested 3840-pixel long edge. The actual reference outputs were only 1254–1751 pixels on their long edge; this tool did NOT deliver native 4K. No resampled file is presented as recovered 4K evidence. The new melon wrap itself is 1774×887. Fine unreadable brand lettering is interpreted artwork rather than a factual transcription.

## Lighting and optics

No AmbientLight. A restrained hemisphere fill, ten bounded decay-2 spotlights, eight bounded point lights and seven broad area bounces preserve the photographed visibility. Only three cached shadow maps. SSAO weight, haze extinction and bloom were reduced from V77. Actual gameplay remains ACES exposure 1.05 with its existing VHS/PS2 output filter.

Glass, liquid, ice and waterfall reuse the existing opaque HDR/depth capture on layer 3. Glass front faces retain colored absorption and silhouette highlights. The falling-sheet shader now retains the face-oriented normal; the prior replacement with an unoriented normal caused an almost-black back-facing rectangle. Sheet opacity and flow erosion are reduced, with gravity-dependent narrowing and local ballistic splashes. This is an efficient flow approximation, not a Navier–Stokes simulation or hardware ray tracing.

Technical references checked: [Three.js color management](https://threejs.org/manual/pages/color-management.html), [RectAreaLight](https://threejs.org/docs/pages/RectAreaLight.html), [physical transmission and attenuation](https://threejs.org/docs/pages/MeshPhysicalMaterial.html). Area lights provide unshadowed PBR fill; cached spots provide contact shadows. Linear HDR is tone-mapped/encoded once by the existing final pipeline.

## Validation

- `node scripts/check.mjs`: all browser modules parse.
- `node tests/tiki-v78/run.mjs`: five walkable authored cameras, four continuous access routes, solid volumes, finite UV/geometry buffers, 24 assets and local-only QA pass.
- Corrected prop groups: 159,265 triangles, 76 material batches. Whole static room: 215,407 triangles, 90 material batches. Static batching and shared optical capture retained.
- Isolated actual-room WebGL2 inspection: 31 programs after warmup; no errors, no additional programs when changing inspection views. Red practical intensity remains 0.16 at different animation times.
- Complete game: map teleport succeeded; final entry completed; leaving restores the exact BigInt street coordinates and yaw/pitch, and re-entry reuses the same room object. 98 total programs after warmup in the final capture run (includes outdoor/UI/game systems), unchanged across inspected Tiki views.
- Normal-game screenshots retain the actual VHS filter/HUD. `*-inspection.png` are separately labeled sharp browser inspection renders using actual scene meshes, lights and effects, without VHS.
- Chrome uses SwiftShader software WebGL2 in this environment. These are actual browser renders, but neither the screenshots nor submitted render-call timings establish hardware gameplay FPS. The asynchronous VHS output needs time to catch up between inspection poses.

Remaining fidelity limits: no calibrated camera/lens information, unreadable source labels, and finite real-time geometry mean this is a reference-guided reconstruction, not pixel-identical reproduction. The comparison sheet deliberately includes the original photographs so these differences remain visible.
