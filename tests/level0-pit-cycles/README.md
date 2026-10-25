# Visual and fall-flow evidence

`capture.mjs` captures the native Level 0 world and native depth compositor. `flow.mjs` opens the actual game, walks through a real pit using the movement/landing code, captures death and rewind, and checks the restored safe position. Physics steps are deterministic; intermediate rendering is skipped during the initial fall, then restored. This is not a hardware benchmark.

The yellow fault screen uses VileR's IBM VGA8 font on an 80×25 cell canvas. Type, inverted heading and layout follow the Windows 9x fault screen, with game-specific recovery text. Rewind replays recorded camera and feet poses, then restores the last grounded pose with a clear footprint. Inventory and world objects are not rolled back.

Sources consulted:
- https://docs.blender.org/manual/en/latest/render/cycles/baking.html
- https://threejs.org/docs/pages/MeshStandardMaterial.html
- https://threejs.org/docs/pages/Material.html
- https://devblogs.microsoft.com/oldnewthing/20140910-00/?p=44113
- https://int10h.org/oldschool-pc-fonts/readme/

The supplied references guide darkness and shaft appearance. No claim of pixel identity is made. Only affected views and the actual fall/recovery flow are checked. The environment reset during upload; the pit EXR was recovered from the already-uploaded Git object, and the lost atrium was rebuilt and baked again from the unchanged game geometry.

The user requested stopping further verification before final publication. The recovered implementation was not subjected to another complete visual/fall pass. Scripts are retained for future local checks.
