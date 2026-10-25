# Level 0 atrium: Cycles irradiance

The game mesh, including the exposed slabs, beams, services and furnishings, is exported without changing its shape. Blender 4.3.2 bakes direct and indirect diffuse illumination to corner colour attributes: 48 samples, five diffuse bounces, black world, actual tier fluorescents and warm practicals. The player's flashlight is never exported.

```sh
node scripts/export-atrium-cycles.mjs
blender -b -t 8 --python scripts/bake-atrium-cycles.py
python scripts/filter-atrium-cycles.py
```

The exporter uses local Chromium; set `CHROME_PATH` if needed. It imports the game's scene and keys vertices with the same `keySky133` / `weld133` functions as runtime. The generated `scene.json`, editable `atrium.blend` (including baked colour attributes), and float `irradiance-source.npz` are reproducible intermediates. They are deliberately excluded from Git: the Blender file alone is about 64 MiB. The full model source remains in the repository; these commands recreate the project and bake.

Runtime reads `dist/assets/level0-atrium-cycles/irradiance.bin.gz` and its manifest. RGB is square-root encoded to unsigned bytes with a linear range of 0–4; no extra texture sampler or overlay geometry is added. Static ambient, local fill and practical lighting are replaced on these receivers, while the existing player spotlight stays dynamic. A restrained artistic depth attenuation below 3 m extends the dark abyss; it is not presented as a volumetric light simulation.

Light-source geometry and approximate average surface albedos drive the bake. Fine material maps remain in the game shader. This is a real Cycles bake, not a claim that the reference photograph has been matched pixel for pixel.

A coplanar spatial filter suppresses colour-attribute triangle artifacts without blending opposite sides of thin slabs. The floating-point source remains in the generated NPZ. Filtering is deterministic and does not change the room geometry.
