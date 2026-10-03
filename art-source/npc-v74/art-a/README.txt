NPC V74 / ART A

Ready assets (all RGB PNG, exactly 128 x 128):
homeless/face.png -- long weathered older adult face, gray/brown beard, permanently peaceful closed eyes.
homeless/body.png -- filthy olive hoodie front torso cloth.
wallman/face.png -- pale ruddy square adult face, receding blond-gray hair/stubble, open eyes.
wallman/face-blink.png -- same wallman, eyelids closed; only the two listed eye rectangles differ.
wallman/body.png -- beige worn windbreaker front torso cloth.

All original images are 1254 x 1254. Full source square was used: [0,0,1254,1254].
Final atlas rectangle for each independent file: [0,0,128,128].
Coordinates are top-left pixels and exclusive right/bottom.
Map facial images only onto the central front face region. Side and rear cranium need separate colors/materials or controlled edge-derived sampling; never stretch the face around the head.
Image-to-UV for ordinary Three.js TextureLoader with flipY=true: u=x/128, v=1-y/128.
Recommended colorSpace=SRGBColorSpace, magFilter=NearestFilter and wrap=ClampToEdgeWrapping.

Wallman blink rectangles in final pixels: [27,47,57,62], [72,47,103,62].
The generated closed-eye image was area-downsampled and composited through these bounded masks, with 3-pixel feathering contained inside each rectangle.
906 changed pixels; zero changed pixels outside these rectangles.
Approximate eye centers: (43,52) and (86,52). Nose tip around (64,77), mouth center around (64,97).
Homeless approximate closed eye centers: (43,48) and (84,48), nose tip around (64,71), mouth around (64,94).

The full required prompt guide was separately downloaded and read immediately before every generation/edit call; five saved guide copies are in guides/.
Exact structured prompts with required fixed prefix are saved alongside each image.
process-assets.py reproduces all final files and eye compositing from generated originals.
manifest.json contains checksums, dimensions, crop boxes, source details and UV guidance.
contact-sheet-3x.png was inspected using nearest-neighbor enlargement: photographic adult faces remain plausible; all clothing assets contain only cloth; closed-eye variant is readable and holds identity.
No Site repository, /level10 files, meshes, or runtime controllers were modified. In-scene checks remain the integration task.
