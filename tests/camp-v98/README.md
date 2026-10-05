# Camp V98 verification

Actual local Chrome / SwiftShader browser renders use the existing outpost, terrain, light pool and original application assets. `game-capture.mjs` loads the complete game, clicks the real F2 lakeshore destination, and checks the new walking plane, expanded wall collision and shader errors. QA controls exist only in test-time request interception.

`animate.mjs` renders 30 seconds of actual scene animation with fixed substeps, samples independent blinking and breathing, and captures the flying pea, underwater descent and deletion/reset. The loop completed four airborne entries and four water entries; all six awake actors blinked independently, while the sleeper stayed closed-eyed. The toilet adult plus hollow jagged paper roll has652 triangles. Animation frames use480×300 internal resolution; static reference and complete-game views use full resolution. Static preview shadows are cached, matching the production intent; no hardware FPS claim is made.

Generated artwork is verified through its actual applied UVs in the screenshots. Source originals and precise prompts/crops remain in art-source/camp-v98. First-pass framing/material defects were corrected before final captures. `animation-proof.json` and `game-proof.json` contain the concise measured evidence.
