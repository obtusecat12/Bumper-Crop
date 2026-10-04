# Northwest lakeshore outpost

Authored at world (-290, -281), 60 × 54 m, within the supplied northwest shoreline marking. Intake is at (-247, -250). The lake layout, urban scenes, V84 return route and V85 tide garden are retained.

All eleven new surface images in `dist/textures/lake-outpost/` were generated with the prompts stored here. `props-trim` is an intentional four-region UV sheet for rations, flour sacks, striped fabric and MEG insignia. Other surfaces are individual repeating maps. Roughness and metalness are authored values; bump uses the generated surface images.

The authored modules cover architecture, furnished interiors, utilities, physical lamp wiring, 32 × 32 GPU smoke simulation, steam, flame, wind-deformed laundry, switchable taps, double gates, terrain clearing and selective puddle SSR. Puddles reuse the existing opaque color/depth pass.

Local browser screenshots are in `tests/lake-outpost/results`. The isolated authoring preview is for detail inspection; `game-inside.png` and `game-water.png` use the full game renderer after streamed terrain is ready. Final captures show no browser or shader errors. SwiftShader captures are visual evidence, not a hardware frame-rate benchmark.
