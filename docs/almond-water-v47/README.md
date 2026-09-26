# V47 — Three additional almond-water bottle families

Extends V46 without replacing its thermoses or vintage returnable bottles.
Existing pickup locations, item IDs, inventory accounting and world layout remain
unchanged. Deterministic selection is 30% thermos, 25% vintage glass, 18% marble
soda, 17% contour soda and 10% apothecary; the welcome thermos remains a thermos.

## Models and labels

- **Marble soda:** 24.6 cm Codd-inspired silhouette, pinched throat, expanded
  marble chamber with opposed dimples, cyan press collar and retained glass
  marble. The marble is an analytic ray/sphere optical object inside the glass,
  not an exterior opaque ball. One held bottle can move it within the chamber.
  Original cyan checker / ivory label: `ramune-label.webp`.
- **Contour soda:** 26.3 cm narrow-neck, concave waist and twelve longitudinal
  skirt/shoulder flutes, with a crimped crown cap. Its paper label follows the
  curved waist. Original oxblood red / cream label: `cola-label.webp`.
- **Dark apothecary:** 20.4–21.3 cm wide cylindrical body, short neck, rounded
  shoulders and thick amber glass. Ground-glass stopper, black knurled cap and
  cork variants. Original aged archival label: `reagent-label.webp`.

Every generated label reads **ALMOND WATER**. These are art variants of Object 1,
not a claim that the new bottle forms appear in its source text. The liquid
remains clear almond water. No commercial beverage name or reference photo is
used as an in-game label. The original images were generated with the built-in
image tool; exact prompts are in `image-prompts.txt`.

Production texture: `dist/textures/almond-water-v47/labels.webp`, a shared
1536 × 1536 atlas containing the three 3:1 label strips. Original generated
artwork is converted and packed for UV use; it is not a bottle mockup.

## Reference material

- [HATA KOSEN — Ramune history](https://www.hata-kosen.co.jp/en/pages/57/):
  glass bottle, marble stopper and gasket construction.
- [Coca-Cola — contour bottle history](https://www.coca-colacompany.com/about-us/history/the-history-of-the-coca-cola-contour-bottle):
  contour and fluted glass as silhouette reference only.
- [DWK — amber narrow-neck reagent bottle, ground-glass stopper](https://www.dwk.com/dwk-reagent-bottle-narrow-neck-glass-amber-with-standard-ground-glass-flat-headed-stopper-250-ml-231683604):
  amber glass, narrow neck and stopper reference.
- [Object 1 — The Backrooms Wikidot](https://backrooms-wiki.wikidot.com/object-1):
  canonical source and attribution are retained in V46 documentation and the
  in-game journal. These new adapted assets retain CC BY-SA 3.0 attribution.

## Optical and performance implementation

Each family has its own inner radial profile. A shared profile definition drives
both shader ray containment and numerical liquid volume. Free-surface lookup
tables are baked by `node scripts/bake-almond-fill.mjs`; numerical integration is
not run at game startup or in the frame loop. Static bottles use a frozen liquid
state and static instance matrices. Only the single inspected bottle animates.

The new bottles have two draws each: one merged opaque label/closure mesh and one
glass mesh sharing the existing refraction pass. No extra scene render, texture
allocation or independent simulation per world bottle. The existing two-draw
glass and one-draw thermos paths remain intact. Optical transmission is 0.97,
IOR 1.52 and glass roughness 0.15; the amber variants use stronger wavelength-
dependent Beer–Lambert absorption. The marble uses no extra draw or mesh.

## Verification and limits

- `node tests/almond-water-v47/check.mjs`: all five families, finite geometry,
  static matrices, transfer/hydration, actual pickup/drink actions, inventory,
  center inspection, pause/stow and volume conservation for all four glass forms.
  Detailed counts and maximum liquid-volume error are in `check.json`.
- `node tests/almond-water-v47/pipeline.mjs`: actual production pipeline for all
  families; no framebuffer feedback, one opaque-world render, correct layering
  and no inspection render while inactive.
- `full-chain.mjs` plus the native GLES compiler: 15 production shader programs
  linked, including world fog, shadow and lighting decoration.
- `export.mjs` / `render.py`: actual production geometry, generated textures and
  shaders rendered for nine close-up cases. `materials.webp` uses a prior V45
  scene capture as a diagnostic backplate. It is not a browser screenshot.

The available native renderer is Mesa llvmpipe software GLES 3.2. No user-device
GPU timing or browser FPS is inferred from this test. The managed preview has no
supported browser path for this static project.
