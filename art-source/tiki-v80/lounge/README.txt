Lounge generated assets, version 80

All visual base color sources were made with built-in image_gen. Four prompts are preserved beside their generated originals. No repository or implementation files were edited by the asset worker.

Recommended runtime base colors:
painting-basecolor.webp: 768x1024 exact 3:4 artwork, no frame or mat; aged oil painting of teal tropical water with graceful dark palms.
upholstery-basecolor.webp: 1024 square dusky green, gray green leaves and muted brown flowers on dark woven cloth.
rattan-basecolor.webp: 1024 square continuous worn golden rattan skin, vertical fibers, no baked pole boundaries.
walnut-basecolor.webp: 1024 square deep brown vertical walnut grain.
bamboo-pole-basecolor.webp: 128x1024 single-stalk interior skin with a node band, for actual modeled wall poles.
bamboo-basecolor.webp: 1024 square original bamboo panel quarter, if a wider wall surface is needed.
tiki-left-basecolor.webp and tiki-right-basecolor.webp: each 512x1536 exact 1:3 square-on carved dark wood front, ready for front UVs.

For each material except painting, normal.png, roughness.png and microheight.png are derived from the generated base color. Normals describe fine surface detail only; use actual modeled geometry for mask protrusions, eye sockets, nose and mouth. These maps are approximate rather than measured scanned material channels. Suggested normalScale 0.15-0.3 for wood, 0.25-0.4 for fabric. Use base colors in sRGB and the channel maps in linear color space.

material-atlas-original.png keeps the exact generated 2x2 image. material-atlas-final.png replaces only the top-right quarter with the separately generated flat rattan skin. Exact source crop pixel bounds and normalized mask feature positions are in crop-manifest.json. derive_assets.py reproduces the crops, WebP files and detail maps.

Mask features inspected: the left front has a long pointed crest, stacked brow ridges, rounded eyes, long thin nose and tapering chin. The right front has a broad arched forehead, rounded eyes, fuller nose, deep open lip grooves and broad chin. Raised rub wear is warm brown; cavities are very dark. The surfaces fill their columns, so the geometry can establish the outside silhouette.
