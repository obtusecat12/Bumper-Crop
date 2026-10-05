# Level 0 atrium V96 art sources

All ten images were created with the built-in `image_gen` tool. Exact submitted prompts and source references are in `prompts.json`; generated original paths and selected project paths are in `outputs.json`. User-requested prompt prefix and explicit aspect ratios are preserved. The image generation prompt skill was read in full from `gpt_image_2_prompt_skill.md` before generation.

The four generated enlargements are interpretation aids, not evidence of details missing from the originals and not runtime screenshots. The tool did not honor an exact 2048px request: references 4–6 are 1254px square, reference 7 is 1641×958. The original reference 6 was near-square; the enlargement is square. Do not use it to recover exact camera geometry. The visible stairs were preserved for reference inspection only; the user's explicit requirement forbids building upward stairs.

## Runtime surface guide

| Original | Source size | Intended use | Suggested runtime dimensions |
| --- | --- | --- | --- |
| 01-russet-traditional-rug.png | 1536×1024 | Full rug face with complete patterned border | 512×342 albedo, weak fiber normal |
| 02-paneled-door-pair.png | 1254×1254 | Left brown / right white door leaf faces | Two 256×512 crops |
| 03-pink-fiberglass.png | 1254×1254 | Pink porous insulation on actual ragged mesh | 512² albedo and porous normal |
| 04-blue-pool-tiles.png | 1254×1254 | 16×16 blue ceramic tile field | 512² albedo and subtle grout normal |
| 05-pale-beige-plaster.png | 1254×1254 | Continuous bland pale wall surface | 512² albedo, weak normal |
| 06-exposed-joist-wood.png | 1774×887 | Raw structural wood, horizontal grain | 512×256 albedo and weak normal |

Door crops are exact: brown `[0,0,627,1254]`, white `[627,0,1254,1254]`. Pre-cropped PNGs are supplied as `brown-door.png` and `white-door.png`. The brown lower grille occupies approximately u=.30–.71 and image-v=.75–.89 within the brown crop. Handles and hinges are intentionally absent in texture and should be 3D geometry. Use the full panel texture only on the leaf front/back; do not map the complete door onto each trim stick. 3D panel bevels, grille louvers and hardware remain necessary at close range.

Re-use V95 originals `01-insulation-batt.png` for yellow fiberglass and `02-galvanized-hvac.png` for galvanized ducts; there is no reason to duplicate equivalent runtime textures. Fiberglass normal maps may be estimated from high frequency image luminance, but such derivatives are approximations rather than measured scans. Pool grout is bright in the albedo, so a generic luminance-as-height conversion would invert grout; derive grout depressions separately or use a very weak detail normal.

## Structural observations from the originals

- Ref 4: continuous low white square ceiling light grid; thin floor finish above deeper open construction cavities; gray metal steel members intermixed with raw timber joists, not a solid stripe.
- Ref 4: narrow top left wall ledge with tall brown paneled door and large white lower vent; opposite top lip has solitary wood chair. Stairs are explicitly excluded from modeling by the user's override.
- Ref 4: large exposed wall-back frame below the left upper ledge: vertical studs, short horizontal blocking, white plaster backing and brown upper timber cap. Small round wood stool sits beside it.
- Ref 4: large silver flexible U-shaped duct below this frame, ending in a short branch; several sagging black cables and a long hanging loop reach toward the floor below. Not all services are confined to the slab.
- Ref 4: upper-middle projecting lounge has a red/brown patterned rectangular rug, tiny wood table with warm white lampshade, slender wood chair and half-open ivory door. Existing image resolution cannot establish every small hardware detail.
- Ref 4: a displaced vertical partition has exposed stud-like edges and open space behind it. Keep nonuniform room widths, floor projections and interrupted walls; equal cubicle cells would lose the original composition.
- Ref 4: loose gray square panels overlap on a floor, pink crumpled material lies farther in, and black scattered chips cluster near a slab edge. Some walls carry narrow pale baseboards.
- Ref 4: deep right room contains a white black-fronted appliance; user interpretation takes priority (printer/mini-fridge), so no need to insist it is an oven.
- Ref 5: square white ceiling panels remain evenly spaced and brighter than surrounding acoustic squares. Top chair is small against the long bare wall. Reference stairs/hatch are not an implementation mandate.
- Ref 6: repeated rectilinear tier edges converge strongly with depth, with upper tiers retaining light and detail while the bottom falls into near-black. No need for micro-props in the deepest tiers.
- Ref 7: top ledge is narrow, unobstructed and unguarded. Lower opposite rooms alternate visible columns, raw slab cuts and large blank beige wall planes; one floor has several overlapping loose gray panels.

Low-fi runtime resizing should happen once from the selected originals. Keep these generated originals and prompt records in art-source provenance, outside the deployed runtime directory.
