# Palm Court rear refreshment area: V70 texture sources

The 16 independent artworks were generated with built-in imagegen in separate calls, not a multi-view collage. There were 18 successful generation calls including two targeted soy capacity edits; the selected front/back labels both read 500 mL. Original generated PNGs, the corrected siblings, per-call structured prompts, downloaded prompt skills and original provenance remain in `sources/`.

Two uploaded source references remain in `references/`, and the physical-product research and spatial plan remain in `research/`. The control strip artwork is cropped to its measured core before resizing to 256 × 2048. The notice board is 1024 × 768, preserving its original 4:3 shape. `control-uv-rects.json` maps source label/button rectangles into the cropped runtime textures.

Runtime: 16 albedo maps, six surface normal maps, six surface roughness maps, and five label/can-top normal maps, totaling 33 WebP files. Albedo WebP quality is 92–94, with printed text at 94; derived data maps use lossless WebP. All texture sizes, original/runtime checksums and exact byte counts are in `runtime-manifest.json`.

No packaging art is programmatically redrawn. Data-map derivation uses high-pass detail and small gradients; these maps are material approximations, not captured physical scans. Repeating surface maps use periodic padding and wrapped gradients. Printed labels use clamped gradients so their edges do not wrap. Metalness remains a physical-material scalar instead of an unnecessary identical map.

The weighing dial has no painted pointer: its modeled needle overlays the image. The can top source includes the pull tab photograph for small-scale surface detail; its functional ring and lid rim are separately modeled. `checks/runtime-contact-sheet.jpg` is a verification montage only.

Regenerate with `python scripts/pack-backcourt-v70.py --repo /path/to/site-checkout`. The script can restore from the committed `art-source/backcourt-v70/sources` tree when scratch inputs are gone. Reported image-generation costs are unknown because the builtin tool exposes no bill; no credit or dollar amount is fabricated.
