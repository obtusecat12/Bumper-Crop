# V73 reception and changing-room assets

13 independent image-generation calls produced six six-channel material atlases plus seven standalone art textures. The atlases provide base color, tangent normal, roughness, metallic, ambient occlusion and height. All channels were generated; none were reconstructed from diffuse images. Runtime extraction is a mechanical 512-pixel crop and WebP encoding. Sculpture, room geometry and furniture are real meshes; no room-background images replace them.

- surfaces/: dark green patinated leather, complete Persian rug, worn walnut.
- lamps/: aged brass, Tiffany amber/green glass, transparent drooping Boston fern.
- locker-props/: striped cotton, VELORA mid-century soap front/back, MERIDIAN digital watch face.
- paper-props/: two distinct 1994/1997 magazine covers, open handwritten guest register, transparent ashtray contents.

Each subdirectory retains original outputs, prompt text, source/output metadata, generation guide downloads and SHA-256 manifests. Runtime output lives in dist/textures/reception-v73 (43 WebP maps). soap-wrapper.webp was renamed soap-label.webp on integration; the front UV crop is v=.437001595…1 with Three.js flipY enabled, the back is v=0….437001595.

Generated wood/brass/fabric/glass maps are shared across the corresponding modeled physical components. Original V61–V72 tile, chrome, plastic, ceramic and cloth maps remain in use for unchanged objects and reused substrates. Functional locker numerals are still code-rendered glyphs.

No Tripo or paid external modeling service was used.
