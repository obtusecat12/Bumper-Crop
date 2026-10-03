# V77 reference reconstruction — delivery verification

The four reference zones and atmospheric reconstruction are integrated into the actual Lantern Reef room. See checklist.md for the item-by-item inventory and results/reference-comparison.jpg for the user-reference/browser-scene comparison. These are actual Chrome WebGL renders, not image-generated mockups. The isolated scene screenshots omit the game's VHS processing for material inspection; game-entry-final.png uses the complete gameplay renderer and HUD.

## Content

- Existing bar and all three dining booths retained; booths shifted toward the entrance to make a walkable viewing strip in front of the new pond. Original exterior buildings/facade, bathroom, other levels, NPCs and 10-photo entrance remain intact.
- Back-left Moai pond: rounded continuous face, real square mouth cavity and stone lip, two flowing refractive sheets, GPU analytic spray, scrolling ripples/refraction/absorption and fine foam; gray masonry basin; submerged green/yellow lights, disc filter, lily, fern/palm/bird-of-paradise/vine cutouts.
- Cocktail L-return: bamboo joints/leis, rounded blue/yellow surfboard, half-dome lamp; hollow mojito/glass/mugs, mint/citrus/pineapple/umbrella, three stacked glazes, purple straw, seated green ashtray, tan figure mug; twelve unique label designs over multiple bottle profiles and pour spouts.
- Canoe buffet: continuous hollow outer/inner hull with tapered ends and supported timber base, red rug, exactly three white ceramic shallow trays, physical refractive crushed ice, pale liquid, raised orchid petals, coconut-shell bowls and curved wooden handles; four fruit types and two distinct UV-faced ceramic souvenirs.
- Front bar corner: full-height continuously carved/painted idol, hibiscus and two tooth rows; oxidized brass/red lantern, clear glass with eleven stirrers, rounded die-cast T1 body with real tyres/hubs/bumpers/headlights/mirrors and generated body UVs; COLD BEER sign. Previous mug and bottle moved to clear tabletop positions so the new toy/lantern do not overlap them.

## Measured checks

- All 80 runtime generated texture files decode completely. 36 selected original artworks; approximately 28 MB of runtime images after compression, with original outputs and prompts retained.
- Five inspection camera positions and four complete approach routes are collision-free. Solid pond/canoe/counter footprints reject entry. Finite geometry/UV checks pass.
- New props: 163,672 triangles in 61 material batches; complete room: 219,370 static triangles in 75 batches, plus the small fan and local analytic spray.
- 11 spotlights, eight bounded point practicals, four localized area bounces; only three frozen shadow maps. No AmbientLight. The tiny hemisphere term is 0.095 versus 0.45 in V76.
- Official r180 UnrealBloomPass, quarter-size first bloom level; half-resolution 12-tap SSAO and 12-step spatial haze. Refraction reuses existing opaque scene color/depth. No extra per-bottle scene capture.
- All five warmed reference views added zero shader programs. Maximum active material sampler count: 11, below the WebGL2 minimum limit of 16. No missing resources or shader errors; only the expected unsupported parallel-compile extension warning.
- Actual Level 11 teleport succeeded. Exit restored the exact level, BigInt origin coordinates, local position, yaw and pitch. Second entry reused the same scene UUID and added zero programs. Details are in results/game-transition-check.json.
- Tests: tests/tiki-v77/run.mjs, tests/tiki-v76/run.mjs and complete module parsing pass.

The browser uses SwiftShader software WebGL2. CPU submission timings and these screenshots do not establish hardware gameplay FPS. Material maps and screen-space optical effects are authored approximations, not measured scans or multi-bounce ray tracing.
