# Tide Garden final refinement — 2026-10-04

## Reference and implementation

- `QQ20261004-202218(1).png`: closed bar with a physical black horizontal shutter, polished wood counter, woven Lauhala front, bamboo divisions, layered thatch, framed aged notice, carved left idol, lava base and ferns. `results/bar.png` is the matching local browser view.
- `image(20261004-130655).png`: previous flat entrance to replace. The new entrance extends from z=8.20 to z=11.57, with the return door at z=11.36; the former flat wall is genuinely open. `results/porch.png` and `porch-angle.png` show its depth and asymmetric foreground/midground idols.
- `QQ20261004-210209.png`: painted blue tropical lagoon scenery, bamboo skirting and carved idols. Four independently generated landscape panels are recessed behind projecting matte stone masonry; plants occupy physical beds below them.
- `QQ20261004-210225.png`: creamy acoustic panels, quiet thin grid and diffuse ceiling panels. The existing 6.93 m height and palms remain. See `results/ceiling-ref.png`.

Root authored all model, UV, layout, collision, shader, timing and integration code. Five image-only agents generated eighteen selected originals: four murals, four bar artworks, four alpha plant images, three sculpture/wood images and three surface images. Originals, exact prompts, refinement candidates and map provenance are retained in `art-source/tiki-garden-v86`. Runtime textures are WebP; normal/height/AO/roughness are derived estimates, not measured scans. Existing V85 thatch, water, loading album, NPCs, drinks and other approved assets are reused.

## Visual corrections made after captures

- Split bamboo trim around the actual doorway instead of letting a rail cross it.
- Fit continuous carved sculpture meshes to measured alpha silhouettes and face UV landmarks; reduced excessive nose/eye protrusion.
- Changed thatch to staggered short courses with no repeated full-length vertical texture wrap.
- Reduced left porch lamp intensity; retained cool foreground light, a dark recess and a small warm right lamp.
- Replaced regular rock courses with varied-height, irregular pier blocks.
- Gravel and irregular flagstone path have shared matching boundaries, with no overlapping broad floor sheets; pool openings remain untouched.
- Six independent sprinklers now have nine parabolic strands each, made from crossed scrolling textured ribbons. The original low-cost water-strip artwork is desaturated in the material; 54 visible strands and 36 soft mist sprites have no per-frame geometry upload. Burst clocks initialize relative to room entry and do not all fire after a long time outside. The face-directed burst still triggers the existing visitor reaction.

## Focused verification

`capture.mjs` loads the actual room modules/assets into local Chrome with WebGL2/SwiftShader, including the existing color/depth water and post-processing pipeline. Reviewed bar, porch front/oblique, ceiling, spray and overview renders. These are actual software browser renders, not generated scene mockups or hardware FPS measurements.

`game-entry.mjs` ran the complete game: actual E interaction entered the garden at [0, 1.77, 10.55]; the shared movement resolver allowed the 5 m walk out of the vestibule; E at the return door restored restaurant [1.48, -5.55]. No browser errors were recorded. Screenshots: `arrival-game.png`, `porch-walkout-game.png`, `restaurant-door-game.png`. A first capture attempt timed out while another software-rendering browser was running; the final sequential run completed successfully. QA hooks are confined to test interception and absent from dist.

Static architecture was reduced from the initial draft's 489,994 to 287,731 triangles by removing redundant bamboo, shutter and hidden-floor subdivisions. Final room uses 54 static material batches. New practical lights are bounded; two shadows are frozen. Existing water reflection/capture work is reused, not duplicated for new props. No hardware performance claim is made.

Changes are scoped to new garden modules/assets and two main.js import switches. Publication fetches and merges concurrent Level 10 work before a normal push; it never force-pushes.
