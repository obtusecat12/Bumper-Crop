# Bottomless pit cells

`pits.blend` is the editable Blender 4.3.2 source. Four separated 3×3 shaft rooms provide four fluorescent-light arrangements. Every central cell has four real walls, a floor with a genuine opening, a ceiling and area emitters. Cycles bakes diffuse direct and indirect illumination with 64 samples and five bounces. No player light or floor/shaft overlay is included.

```sh
blender -b -t 4 --python scripts/bake-pits-cycles.py
python scripts/pack-pits-cycles.py
```

The EXR is the half-float source, compressed with DWAA. `atlas.json` describes the islands. The packing script filters each island separately and extrudes three texels of padding. The single 1024² WebP is about 17 KiB. NumPy, Pillow and SciPy are needed by the packer.

All generated pits select a light arrangement by distance to the real nearby fluorescents. Original floor pieces and collision remain authoritative. The old V133 modulation quads and duplicate shaft box skins are no longer instantiated. One inward surface owns each shaft wall. Floor influence fades out at cell boundaries. The deeper wall fade and dark albedo are artistic matching of the second supplied reference; this reusable-cell bake is not a full unique bake of the infinite world.

The fixed camera captures in `tests/level0-pit-cycles/results` are local Chromium / SwiftShader renders, not generated images or hardware-FPS measurements.

The editable source was reconstructed after an environment reset; the original completed Cycles EXR was recovered from GitHub. `--source-only` rebuilds the editable scene and extracts that preserved EXR without rerunning the bake.
