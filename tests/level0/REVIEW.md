# Level 0 verification — 2026-10-04

Root authored the Level 0 code and tests. Generated assets and provenance are in `art-source/level0`.

## Checks completed

- `node tests/level0/layout-check.mjs`: 121 deterministic chunks, aligned boundary openings, 16 raised arch windows in the authored arch chunk, and absent floor triangles at pits.
- `node tests/level0/game-flow.mjs`: actual game entry, populated upper-right minimap, F map and safe landing, original almond-water pickup/inspection/drinking, F2 arch transfer, and exact original Level 10 BigInt pose restoration. No browser page errors. QA hooks are injected only by the local test route.
- Actual linked GL programs in this flow use at most 7 active texture samplers. Level 0 has 25 resident chunks, 40 shared instance batches and 23,538 instances at the tested start pose. Batching replaces separate geometry submissions; this is not a measured comparison with a previously shipped Level 0 or a hardware FPS benchmark.
- Chrome/SwiftShader renders of classic rooms, raised arches, column hall, real pits, red room, blackout, ceiling details, cavity and wet carpet are saved under `results`. Ceiling visibility, arch proportions/supports and puddle shading were revised after inspecting those images.
- Walls/pillars and static furniture cast a bounded 2048px PCF soft directional shadow; transparent contact skirts ground architectural bases. Walls and ceiling use normal maps. All four vent variants, hanging cables, timber/T-bar cavities, pink/yellow insulation, flex duct and tilted tiles are instanced material batches.

## Limits

These are actual local software WebGL browser renders, not a live-site screenshot or hardware frame-rate measurement. The 95% target concerns reduction against one mesh per architectural element; no unsupported FPS improvement is claimed. The streaming world is procedurally extended within JavaScript numeric precision, with 5 × 5 chunks resident. Unseen layout changes exclude arch rooms. The existing project has no Level 1 implementation, so the wiki's Level 1 exit remains unconnected and is disclosed in the in-game journal. F2 and map travel are deliberate game navigation aids beyond the source lore.
