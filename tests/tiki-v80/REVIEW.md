# V80 visual and interaction review

Reference uploads reviewed at native resolution: image(20261004-072455).png, image(20261004-072510).png, image(20261004-072803).png and image(20261004-072854).png. No award-level or pixel-identical claim is made.

## Implemented
- Approved seven NPC models and texture sources retained. Bartending service plays twice per 18s clip; cutting stroke increases from 0.525Hz to 1.53Hz; waiter pen strokes quicken. Body/prop poses still share one plan; breath/blink/finger idle clocks unchanged.
- Entrance jukebox: 1.05m wide, 1.73m high, 60 separate paper strips, slanted transparent glass, red panel, mechanical keys/coin hardware, chrome surround, wooden cabinet, generated metal speaker weave and steady amber backlight; inlet/cable/outlet modeled. First screenshot showed excess grille washout; derived linear alpha mask and lower backlight corrected it.
- Exterior: two rattan armchairs with floral cushions, round pedestal table and red votive; bamboo/dark wood wall, matted tropical artwork and two relief masks; five planted pots. Original building/frontage retained. Full city view revealed the old street tree obscured the first grouping; moved the entire vignette 3.7m right to the next window, preserving the tree.
- Existing sidewalk gains generated albedo/normal/roughness in the facade-local region, preserving its walking height. No duplicate paving geometry.
- Three unoccupied bar stools and three empty booth benches have E sit/stand; occupied bench/stool destinations excluded.

## Verification
Local Chrome 154 with SwiftShader/WebGL2. The managed cloud browser had WebGL disabled, and the shell could not reach managed preview; an in-process Playwright asset route served this exact checkout without a replacement dev server.
- Actual room screenshots: jukebox.png; bar-seated.png; seats.png. Model/material facade inspection: terrace.png. Actual complete Level11 game with its native display setting: terrace-game.png.
- Actual main.js initialized and Tiki entry completed; real E keyboard events sat at bar-1 (2.78,1.10), stood at (1.97,1.10), sat at booth-3a (-4.18,3.52), stood at (-3.14,3.52). Scene exit cleared seat. No browser errors.
- All six stand anchors collision-free and selectable; all 43 runtime WebP maps decode; modified JavaScript syntax checked. No broad regression test suite was added or rerun.
- Render timestamps from this software renderer are not hardware FPS measurements.

## Generated asset provenance
Built-in image generation created the original jukebox title/material/band images, botanical upholstery/rattan/mask/painting originals, foliage atlas and sidewalk material. Exact prompts, original outputs, crop manifests, derived map instructions are in art-source/tiki-v80. Runtime imagery is under dist/textures/tiki-v80 (about 7MiB). Normals and roughness are derived approximations, not measured scans.
