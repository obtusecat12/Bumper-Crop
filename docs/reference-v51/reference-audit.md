# Reference audit for v51

Read-only audit of the supplied photographs and browser defect captures. No site files were changed. The supplied browser screenshots are authoritative for appearance; source-derived projections below are diagnostic, not substitutes for browser verification.

## Scope and coordinate convention

Inspected `upload/image(20260926-094445).png` (Hope, 2048×1393), `image(20260926-095002).png` (clinic, 2048×1278), defects `image(9).png`, `image(20260926-094110).png`, and `image(20260926-094313).png`, plus the four detail crops ending 095616, 095628, 095647, and 095700. Read `reference-scenes.js`, `reference-materials.js`, `urban-batch.js`, and the reference-camera setup.

All geometry coordinates in recommendations refer to authored coordinates **before** `photoHandedness`. Final Hope local X is negative authored X. Clinic final local X is -0.64 times authored X. With the camera looking generally along final local +Z, increasing authored X is approximately screen-right. Sun vectors below refer to **final city/clinic local space**, before the rotation to world coordinates; they must not be reflected a second time.

Pixel anchors are hand-read with about ±10–20 px uncertainty. Ratios matter more than alleged survey dimensions. The clinic HD aspect is **1.6025**, while the waypoint still specifies **1.4993**. Hope's HD aspect 1.4702 is essentially the same as the waypoint's 1.4684.

## Priority 0: physically coherent Hope sunlight

The source Hope sun is final city-local `(-.85, 1.1, +.10)`. After reflection, the right corporate street-facing wall is the plane at final X ≈ -30.5 with normal **+X**. Its dot product with the existing light is negative. The rendered dark wall is therefore consistent with that light, rather than proof of a missing normal.

The HD photo and especially 095700 show the corporate street-facing panel wall as the **bright** large plane: pale gray-green panels, bright seams, paired fastening highlights, and a bright horizontal upper trim. In contrast, the left precast tower's inward-facing rib fronts are dark; narrow fin edges catch light. Together these favor a sun with final local **+X and -Z**, from camera-left/front, rather than the existing -X,+Z. The Pegasus front face, whose outward normal is -Z, also benefits from that sign of Z.

Do not infer a directed shadow vector from the foreground diagonal bands alone. Their image axis is clear: lower-left ↔ upper-right. The caster-to-tip ordering is not clear: none of the main bands can be unambiguously traced from a right-tree trunk to a tip, and several casters can be offscreen near/left of the camera. A sun `(+.75,1,-.45)` casts ground shadows toward final `(-.75,0,+.45)`, which projects toward screen-right and deeper into the road, **along the same visible diagonal axis**. Thus that candidate is physically coherent and does not require an arbitrary reversal of a proven shadow arrow.

Start in the range **(+0.55…+0.85, 1, -0.45…-0.90)**, normalized. This spans approximately 39–55° elevation. Face-lighting sign has medium-high confidence; exact ground azimuth and elevation have medium/low confidence. Use the panel face and fin-side illumination as the first discriminants, then tune the shadow angle in the actual browser.

The tree shadow decals are currently hardcoded to authored `x - height*.46, z - height*.19`, regardless of the environment sun. After Hope reflection that is final +X,-Z, approximately aligned with the **old** sun's ground shadow. Once the sun changes, these decals must be derived from the same sun vector or disabled; otherwise two contradictory shadow directions remain. An approximate canopy-center shadow is `center - sunXZ/sunY * canopyHeight`, with silhouette size separately adjusted for crown extent. Do not translate the shadow by full tree height if the alpha image represents the crown centered at about 0.64 of tree height.

The photo podium remains lighter than the current `photoPodium=0x7e8982`. A reasonable first material bracket is gray-green `#a5aaa0` to `#b9bbae` with moderate roughness, then exposure/fill judged against the road. Avoid raising all exposure until glazing loses its depth. The photograph has bright trim and reflections, but most treads and the lower storefront retain readable dark gray detail.

## Priority 0: corporate stairs must terminate at a real entrance

The 16.4 m podium cladding height is not intrinsically wrong: the photo contains a tall blank paneled wall above the entry. The error visible in defect 094110 is a blank wall behind an elevated staircase, with no door at its landing. Source stair top is 3.45 m; the wall can continue far above it.

Current source flight: 23 risers of .15 m, authored X from 15.3 toward 24.54, tread/run .42 m, width along Z of 13 m, center Z=9. The landing centered X=27 spans 24.5…29.5. The corporate inner face is X=30.5. Consequently the last landing ends **1.0 m before the wall**; close this gap with a landing reaching X=30.55 or farther into an entrance recess. Threshold must be exactly y=3.45 (within a few centimeters of stair top), not ground level.

Place the main glazed entrance in the actual inner face: authored X≈30.5, Y threshold3.45, Z within the landing span2.5…15.5. Use a 1.6–2.1 m wide double door, 2.3–2.6 m tall, with .25–.50 m physical recess. A wider fixed sidelight band can make the overall portal 2.8–3.6 m. Recessed dark reveal, a metal upper lintel, visible vertical pulls, and threshold matter more than extra glass subdivisions. A glass quad on top of an opaque wall is not a doorway: split/cut the podium frontage around the portal.

The detached glass strips at authored X=15, Y1.35, Z18…50 do not form the photographed entry: they are at street grade and 15.5 m away from the tower inner face. They should instead belong to a coherent lower frontage/parking opening or be replaced by the planter/louver composition described below.

### Stair arrangement resolved by crop 095647

- There is a **solid inclined granite cheek wall** on the visible side of the flight. Model it .30–.40 m thick and roughly .65–.90 m above the adjacent nosing line; its top slope must track the stair pitch. The current naked triangular step mass plus generic rail does not describe it.
- A **single grasp rail** follows the wall on the stair side, about .90–1.0 m above the nosings, .045–.055 m in diameter, and .06–.09 m clear of the wall. Give the lower end a .30–.45 m horizontal return and a short downward/returned end. A separate free-standing run marks another edge of the broad flight. The photographed lines are not two-bar safety fences at both edges.
- The generic `rail()` creates two horizontal bars at height and .52 m plus regularly spaced posts. Do not use this unchanged for the wall-mounted run. Wall brackets can be small and sparse; round items clearly visible lower on the granite wall are **stair lights**, not all rail brackets.
- Round recessed wall lights: diameter approximately .12–.16 m, 1.2–1.6 m spacing, roughly every3–4 treads, centers .20–.35 m below the handrail. Dark circular bezel with a subdued light face is sufficient.
- The crops show approximately20–23 visible tread edges but crop the far end; the existing23 risers/3.45 m total rise is plausible. Do not change count solely to match an incomplete crop. Runs .32–.42 m and rises .15–.17 m are the useful plausible interval. The photograph's edge/nosing should be a narrow .015–.025 m brighter strip, not a broad white stripe.
- Upper landing is compact. Keep it about1.4–2.0 m deep along the walking direction after the last riser, plus the actual door recess. Avoid the defect's expansive blank platform.

## Priority 0: clinic Dermica wing is structurally absent below its sign

The wing is in source only as an opaque cream box at `(-14,2.35,19)` of size10×4.7×5, a blue strip, and a sign. There is **no glazed lower frontage, no recessed doors, no lower mullion rhythm**, so the photo's small adjoining business cannot appear from normal walkable angles.

The HD photo's Dermica wing is not a roof ornament: it fills screen X≈.13… .35, with its own blue canopy below the Dermica sign and a lower row of warm bronze/frosted glazing. Its rightmost glazing terminates behind the higher main clinic frontage. The photo reads as two related frontage heights, not one sign pasted on a solid side block.

Use authored X≈-19…-9 as the starting wing footprint, but split the front wall at Z≈16.5. Provide5–6 lower glazed bays over a final physical width of roughly5.5–6.5 m (the current authored10m becomes6.4m after the global scale). Front glazing top about2.8–3.1 m, sill .25–.40 m; an opaque sign/fascia zone extends to4.4–4.7 m. Use warm gray-gold frames .04–.07 m wide, bays .9–1.2 m in final width, some vertical blinds, and a .20–.45 m glass recess behind the outer frame. Include one real door bay about.85–1.0 m wide.

The wing's blue canopy should have a physical projection .7–1.2 m and a .12–.20 m dropped edge, not merely the current .42 m-deep blue box. It is lower and darker than the main canopy. Keep a visible cream fascia band between that canopy and the Dermica lightbox. The wing returns back into the compound, so add a side/rear continuation and roof parapet rather than leaving its far side open when the viewer walks around the left wall.

## Priority 0: clinic left wall is framing architecture, not an isolated pylon

The photo left stone wall runs out of frame at X=0, has a visible right boundary at roughlyX=.145 near its top and .122 near ground, and spans Y≈.18… .79. It is broad framing architecture. Defect `image(9).png` exposes a tall standalone slab with visible side/back and empty ground beyond. Changing the sign alone cannot fix that absence of mass.

Current source slab is6.6×8.5×2.7 m at authored(-18.5,4.25,7). Its current photo-waypoint right upper edge projects at approximately **(.067,.244)**; the photo anchor is about **(.145,.223)**. This diagnostic is based on the source camera and is not a browser screenshot. The desired wall is roughly twice as wide on-screen and its right edge is farther into the image.

Prefer a continuous front wall with a .45–.80 m thickness, a return extending8–14 m back, and a hidden left continuation beyond the frame. A workable pre-mirror trial is a front extent near authored X=-25…-12 (rather than-21.8…-15.2), top8.6–9.0 m, with the right edge adjusted against the browser anchor. Keep the broad face at roughly the existing near Z=5.6. These bounds are a starting envelope, not a measured footprint. A separate near-face plus return lets the broad framing wall match the photo without retaining the implausible2.7 m solid thickness.

Stone pieces in the photo are irregular rectangular horizontal blocks, generally width/height≈1.5–2.5, with low-contrast joints. At the wall scale, individual stones are roughly.35–.65 m high and .5–1.0 m wide. The defect texture is too conspicuously checkerboard if every piece has a strong alternating value; reduce stone-to-stone luminance spread and reserve dark stains for a few blocks.

## Priority 1: facade proportions and depth

### Pegasus

The source `facade()` hard-caps every opaque-building window height at1.6 m. Pegasus floor pitch is `(95-5.2)/20 = 4.49 m`, so glazing occupies only35.6% of the floor pitch. The HD photo has window openings roughly **50–58% of the floor pitch**; the beige spandrel and the glazed opening are much closer in height. Target Pegasus opening height2.15–2.50 m at the current4.49 m pitch, or reduce floor pitch and overall tower scale while keeping the ratio. Do not globally widen every window to solve the vertical problem.

Front bay pitch is2.95 m and requested width2.1m is capped by `bw*.68` to2.006m. That68% horizontal fill is a sensible first match: photo glazing is roughly60–72% of its bay. Use width2.0–2.2 m, three/four narrow internal vertical panes/curtain folds, frame widths .035–.055 m, and physical recess .12–.22 m. The photograph has a few dark/open casements; keep these sparse (roughly10–15% of windows), not an alternating checkerboard.

Pegasus banner HD bounds are approximatelyX=.634… .664, Y=.179… .501. Source projection is aroundX=.609… .640 and Y=.205… .517; it wants to move a little screen-right/up relative to the present photo waypoint. Use the anchor, rather than widening the entire tower. The sign has a narrow patterned border at its top and bottom. Crop095628 confirms the telephone is arranged as vertical groups **866 / 997 / 9310**, separated by extra spaces, with **no printed hyphens**. Apartment Residences is dark and vertical alongside, while PEGASUS occupies the lower portion in pale capitals.

### Left ivory office and precast foreground tower

Do not reuse the Pegasus1.6 m cap for the ivory office. Its photograph has markedly tall rectangular openings: target height/width≈1.6–2.2 and glazed height60–72% of floor pitch. For the current3.67m pitch, opening height2.2–2.6m and width1.2–1.6m is a better starting range than2.4×1.6m. Its facade should read vertically punched, whereas Pegasus reads short horizontal window groups.

The nearest dark tower is governed by strong uninterrupted fins. The source fin module width62/34=1.82m, fin.40m, and window1.31m is reasonably close as a starting module. Keep strong vertical recession .45–.70m behind the frontmost fin face and suppress high-contrast full-width horizontal bars. Current horizontal rows3.35m apart are acceptable, but their .20m bars should not visually compete with the fins.

### Corporate upper glazing

Photo panes are tall narrow slots separated by bright light-colored verticals; the defect looks like an almost-square uniform black wire grid. Current pitch is2.85m horizontal and3.15m vertical, ratio1.11. Start with width1.9–2.3m and height3.4–3.9m (height/width1.5–1.9). Vertical members can be .10–.16m, horizontal .045–.075m. Do not solve the blackness by making the whole glazing pale: vary restrained blue/green/gray reflected values between a limited number of bands/panes and give the bright mullions actual sided geometry.

## Priority 1: storefronts need architectural depth

The generic `storefront()` is effectively a flat front: shade at local Z=.22 and glass at.09, with frames at-.035. That yields only about.1m of reveal, and every pane is on one plane. The photo Famima arcade has structural columns in front, a shaded entrance recess, door frames, a raised threshold, and a visible interior.

For Famima, set glass/doors .45–.90m behind the column front; keep major dark columns .45–.65m wide and .6–.9m deep. Add three or four shallow entrance steps at .12–.15m rise, total .40–.55m, with yellow nosing .025–.045m wide. The detail crop clearly shows paired door pulls .28–.38m high, handles at about1.05m above the threshold, and warm interior strips .6–1.2m behind the glazing. Use a few legible interior planes/shelves at1.5–3m depth to break the solid black rectangle.

The projecting Famima round signs are not circles pasted over the fascia: diameter .70–.95m, rim thickness .035–.055m, cylindrical depth .20–.35m, offset .25–.45m from the column face. Their face orientation must serve the sidewalk sightline. Crop095616 also shows a smaller Hope plate behind the left traffic signal, approximately.45–.6m wide, and a Metro20 stop plaque behind/right of the pole at about2.6–3.0m above grade.

For clinic/bakery, keep the main canvas projection near2.1–2.8m, but recess actual doors/glass .20–.45m behind frames. Bakery entrance center is an open dark recess with warmer depth, not an uninterrupted opaque black pane; use a1.4–1.8m double entrance and visible second-plane interior .8–1.8m back. Lab lower glass is noticeably green with horizontal bands; clinic glazing combines a dark top transom and pale frosted lower panes. These three storefronts must not share one uniform glass treatment.

## Priority 1: trees, sidewalk, and lower corporate frontage

Reference Hope nearest left tree crown spans aboutX=.15… .36, Y=.40… .64, with trunk extending toY≈.80. Trees have open, branching pale trunks and irregular continuous crowns. Defect094313 shows sparse elevated blobs and unbroken triangular black shadows. Keep primary crowns roughly7–9m wide at9–11m total height, but lower the foliage bottom to about3.6–4.5m and expose3–5 principal branches. Do not darken their whole silhouette to a uniform near-black cutout.

Crop095647 shows the corporate lower zone as a layered sequence: sidewalk, long low granite planter/trough .55–.8m high, higher planted terrace/retaining wall behind at roughly1.3–1.8m, black horizontal louvered vent behind trees, and a light rail/cable guard at the upper terrace. This replaces the current unexplained detached black glazing at street level. Planter edges .08–.12m thick, widths .6–1.0m, with small pale flowers/stone clusters and low grasses are sufficient. The louver pitch should be .08–.13m with narrow blade highlights; do not make one solid black block.

Sidewalk width in the Hope photo is approximately2.7–3.6m along the near blocks, widening around stairs; source6m is generous. At matched camera the tree trunk should sit about.6–1.1m inward from the curb, with clear pedestrian space behind it. Avoid uniformly oversized sidewalk slabs. Red curb has height .13–.18m and should follow the curb surface, not rise like the separate red barrier in defect094110. Add the actual rectangular drain opening at the corner with its black void below the curb lip.

## Photo anchors for browser comparison

| Photo feature | Normalized approximate anchor/bounds | What it constrains |
|---|---|---|
| Hope distant road convergence |(.485… .495, .67… .69)|Camera yaw/pitch before geometry tweaking|
| Hope left nearest crown top |Y .40, X .16… .34|Tree scale and canopy height|
| Hope Pegasus banner |X .634… .664, Y .179… .501|Banner location/aspect, tower depth|
| Hope right Hope plaque center |(.853,.548)|Signal pole/arm layout|
| Hope bottom visible stair left corner |about(.866,.773)|Flight origin and sidewalk width|
| Hope nearest left storefront fascia |roughlyY .59… .65|Ground-storey and arcade scale|
| Clinic left framing wall right edge |X .145 at top; .122 near ground|Broad wall extent/near placement|
| Clinic main canopy left lip |about(.319,.536)|Main block placement and canopy projection|
| Clinic canopy lip across lab/bakery |Y .54… .55|Roof edge should be nearly horizontal in frame|
| Clinic clinic/lab vertical division |X .550 around storefront|Relative module widths|
| Clinic lab/bakery vertical division |X .701 around storefront|Relative module widths|
| Clinic main frontage floor |Y .73 at clinic, .76… .79 at right|Camera range and plaza grade|
| Clinic wing glazing bounds |roughlyX .13… .35, Y .60… .75|Wing cannot be omitted/opaque|
| Clinic dish center |about(.26,.42)|Rooftop grouping, distinctly left of main sign|
| Clinic black tank center |about(.414,.35)|White rooftop box grouping|
| Clinic antenna mast |X≈.710; rises out top|Right rooftop asymmetry|

Under the current mathematical waypoint, the clinic source projects main lip left to(.323,.565), clinic/lab ground division to(.543,.703), lab/bakery ground division to(.698,.707), dish center to(.384,.450), and black tank to(.568,.444). Main module **horizontal** boundaries are close, while vertical scale/framing and rooftop placement are not. Fix the HD aspect and check an actual browser capture before moving every wall. In particular, the dish and black tank are far too far screen-right relative to their correct modules; they need independent rooftop positions, not a global horizontal mirror.

Global clinic X scaling also compresses circular features: dish/trunks/tank cross-sections become0.64 of their original width. Compensate these props or author final sizes after the layout transform. The photographed dish is a shallow tilted wire mesh bowl, about2.1–2.8m across as a plausible scale, with visible radial spokes and rim. A solid opaque dish sheet or visibly squashed cylinder will remain conspicuous.

## Suggested implementation/verification order

1. Correct Hope sun in final local space and make all shadow decals follow it; verify right podium bright/left rib fronts dark in the browser.
2. Build the actual corporate door/threshold/landing connection, granite cheek wall, single grasp rail runs, and low planter/louver layer.
3. Complete Dermica lower frontage and continuous left framing wall/return; ensure neither exposes an empty rear when walking.
4. Apply distinct window ratios to Pegasus, ivory office, and corporate glazing; retain correct fin rhythm on the dark foreground tower.
5. Correct HD clinic framing and rooftop grouping, then add storefront/traffic-sign details from the new crops.
6. Take the two reference waypoints and one close ground-level stair/wing view in the actual browser. The artifact screens should show the corrected walking geometry as well as the static photo composition.

Uncertainty: no geolocation, surveyed building dimensions, EXIF, or exact camera calibration was supplied. Absolute meters above are architectural working ranges derived from doors, railings, and the existing model; normalized anchors and source structural gaps are the firmer findings.
