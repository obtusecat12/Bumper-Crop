# Level 10 lake camp V98

32 selected image-generation outputs: seven unique adult face mothers, seven same-face closed-eye edits, seven individual garments, eleven prop/environment images. The white/blue can uses the corrected `can-budlight-v2.png`; its earlier layout is not shipped. Exact generation prompts and original resolutions remain alongside the originals. The image-generation prompt guide was read before generation.

`../../scripts/prepare-camp98.py` produces 53 WebP runtime textures. Faces retain full-image coordinates for landmark-aligned geometry UVs, 128×128, lossless. Closed eyelids are composited only over the original eye regions before common downsampling. Garment fronts are cropped to 256²; side/back/limb cloth, skin and hair are source-image crops. Prop artwork is compressed to at most512px on the principal dimension. Normal/bump behavior comes from approximate diffuse-derived height, not measured material scans.

Geometry and animation are authored in Three.js. All people, eyes, paper roll, fork, pea, cigarette and smoke stay outside static material batching. The pea pile is a modeled low-resolution mass with photographic texture. No extra water capture or independent animation RAF is used. The static can rack contains504 tins without crates.

Runtime anatomy budget is counted recursively, including attachments; the toilet actor has652 triangles. Local software-WebGL screenshots validate geometry, references and motion; they are not hardware performance measurements.
