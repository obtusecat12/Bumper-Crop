NPC v74 generated texture assets: reader and plaid

Each character directory contains face.png, face-blink.png, body.png.
All six runtime files are RGB PNG, exactly 128 x 128 pixels, sRGB diffuse colors.
Each face uses the full square as a single continuous front texture. No atlas cells.
Body maps are front torso surfaces without faces.

The two face mother images were generated independently with built-in imagegen.
Each blink source was edited from its own exact mother image with imagegen.
Runtime blink compositing retains every original pixel outside the recorded eye
regions. Validation: reader 861 changed pixels, plaid 768, and 0 changes outside
the respective eye regions for either character.

Generated originals, prompts, and the downloaded required prompt guide for each
of the six image calls are retained inside each character folder.
manifest.json records exact paths, source IDs, checksums, dimensions, crop boxes,
eye rectangles, and scope-limited verification. No seed was exposed by the tool.
prepare_textures.py reproduces the mechanical area downsample and eye composite.
inspection-128-nearest.png shows all six runtime maps enlarged using nearest
neighbor. The final maps were visually inspected after processing.

No Site repo changes or scene integration were performed in this asset subtask.
Three.js geometry, UV placement, blink timing and in-scene appearance still need
verification by the integrating task.
