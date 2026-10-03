# V75 character rebuild and spring transition

Root-authored implementation; the requested NPC skill was not used. Subagents only produced images. The reference is `upload/image(20261003-065521).png`: proportions, short integrated neck, photographic facial planes and independently shaped hair are the modeling targets, not its clothing.

## Runtime

- Six new 19-bone `SkinnedMesh` actors: 1080 / 1032 / 1112 / 1032 / 1188 / 1260 total triangles (including reader smoke and attached props).
- Landmark-aligned face grid has connected nose, cheek, jaw and temple surfaces; it replaces the old ellipsoid and detached nose. Each actor has a separate generated hair UV material. Generated face/body/hair textures are 128 square, nearest-filtered and mipmap-free.
- Adult standing crowns: wallman 1.828 m, receptionist 1.735 m, poolman 1.851 m. Seated actors use measured seat heights. Torso sleeve openings share positions and skin weights; hands have separate finger silhouettes with cached curl morphs. Lambert flat shading retains angular silhouettes and a small texture-colored baked-light floor preserves photographic details in unlit facets.
- Animation remains discrete, but 24 Hz replaces 15 Hz; plaid is 30 Hz at the user's request. Main RAF/camera are independent. Breathing, clavicle lift, pelvis shift, head turns and independent eye-map swaps remain. Homeless is closed-eyed with breathing only.
- Ground-seated homeless leans against the existing wall over three folded newspapers. Four 36 cm eight-sided glass bottles have shoulders, necks, lips and labels, with one fallen bottle/spill. Wallman stands 55 cm from the wall and uses two crossed narrow scrolling eight-segment flow strips in one mesh.
- Reader holds a three-by-three creased newspaper surface and has a cigarette with a 16-triangle, single-draw smoke ribbon. No particle simulation was added.
- Original Level 27 bathers and environment geometry are unchanged.

## Loading

The spring is now built on first entry after the DOM overlay paints. Ten independently generated spring photographs rotate under a black lower gradient and true phase progress. Uploads, original-material compilation, the existing spring reflection clipping variant, frozen shadows and actual water/steam pipelines are prepared while masked. The room is cached for re-entry. Input epochs reset during and after loading; exact entrance pose returns and error recovery are tested.

## Verification

`rig-check.mjs`: normalized 19-joint weights; 500–1500 triangle budget; flat Lambert/nearest 128px maps; discrete poses; 30 seconds of independent blinking without texture upload versions changing; bounded long-delta update; disposal.

`spring-entry-check.mjs`: overlay before build; duplicate guard; cached re-entry; exact BigInt origin restoration; failed shader preparation return.

`tests/bath-v74/entry-check.mjs`: existing bathroom entry/return regression.

Local-only preview routes are in `scripts/preview.mjs`; none are served from published `dist`. `studio.html` is a neutral geometry inspection, `alley.html` uses actual entrance models with stand-in exterior lighting/ground, `preview.html` uses actual bath scene materials/lighting, and the local game route runs the actual production loop. Screenshots from Chrome ANGLE SwiftShader are software WebGL2 checks, not hardware FPS evidence.

Generated original images, prompts and image-generation provenance are retained under `art-source/npc-v75` and `art-source/spring-loading-v75`.
