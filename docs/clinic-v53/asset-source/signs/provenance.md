# V53 exact shop fascia assets

Created 2026-09-26. Seven sign identities were reconstructed as editable, deterministic native lettering and vector artwork after visually inspecting these supplied scene references:

- `/workspace/scratch/91e9848e2f36/upload/image(20260926-115016).png`: upper optical and pharmacy fascias; lower laundry and beauty fascias.
- `/workspace/scratch/91e9848e2f36/upload/image(20260926-115756).png`: bookshop, mobile repair, and travel fascias.

`generate-signs.mjs` is the complete reproducible source. It extends the same native typography/vector approach used by the existing `level10/scripts/urban-v52/sign-generator.mjs` without changing that file. All paths and layout are authored for this collection. No reference-image pixels are copied. No photographic imagery or ImageGen output is used. The salon portrait is an original native vector profile/hair silhouette.

The signs use URW Base35 system fonts: Nimbus Sans, Nimbus Sans Narrow, Nimbus Roman, and Z003 Medium Italic. Fonts are resolved from `/usr/share/fonts/opentype/urw-base35/`; font binaries are not redistributed. Lettering preserves the exact requested spelling, accents, and middle-dot separators. The faces use light cream-white coating, very mild seeded grain, small mounting screws, and a shallow perimeter seam. The scene should supply fascia depth and directional shading.

Every asset has a 1536 × 384 opaque PNG source and an sRGB WebP encoded at quality 94 with smart chroma subsampling. `manifest.json` records names, exact text, scene placement, dimensions, byte counts, and SHA-256 checksums. `contact-sheet.png` places the seven signs vertically for quick visual review.

Rebuild from any working directory:

```bash
node /workspace/scratch/91e9848e2f36/v53-assets/signs/generate-signs.mjs
```

Dependencies are the existing runtime packages `@napi-rs/canvas` and `sharp`, resolved from `CODEX_PRIMARY_RUNTIME_NODE_MODULES`.

Visual review completed on the contact sheet: no clipped lettering, no overlap between icons and words, all seven exact text sets readable. PNG and WebP dimensions verified as 1536 × 384 for all records.
