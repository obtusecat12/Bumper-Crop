# V41 — restore dense V39 wheat tufts with natural variation

This correction restores the V39 multi-ear wheat/barley photographs as **95% of crop instances**. The V40 individual ears are only sparse accents. The existing cutout edge treatment, flat atlas-slot interpolation, root shading, backlighting and static chunk system remain.

- Roots use 92 × 92 stratified positions per 40 m cell: 5.29 candidates/m², versus V39's 4/m². Jitter spans 96% of each stratum. Broad 0.80–1.04 m tuft cards overlap naturally and contain several stalks; density is not obtained by creating high-poly stalks.
- Nominal crop heights return to 1.52 m wheat / 1.35 m barley. Smoothly bounded fertility variation and individual perturbations produce uneven tops without hard-clipped height plateaus.
- Full random yaw and mirroring remain. Nearby lodged tufts lean along a shared, slowly varying direction; regular tufts lean gently. Lodging can reach approximately 56°, so the physical culling allowance increases to 2.2 m. The visual fade ends at 27 m, inside the guaranteed static selection footprint at every observer-cell position.
- Immature olive, ripe gold and dry ochre tints follow a continuous maturity field, with small per-tuft variation.
- No new image generation was required. Existing V39 tuft images and V40 ear images are assembled into the existing atlas layout at startup. There is no per-frame matrix or colour rewrite.
- Beyond module cache-version references, only `cereal-layout.js` and `dense-wheat.js` changed. Roads, road grass, structures, lakes and field partitions retain V40 behavior. The valid V40 terrain cache is reused.

## Checks

Eight boundary/rebasing poses, including negative coordinates, passed the static contracts. Results in `contracts.json`:

| Measure | Result |
| --- | ---: |
| Maximum submitted cereal triangles | 57,212 |
| Conservative maximum geometry radius | 34.9771 m |
| Multi-ear tuft fraction | 95.01% |
| Cereal height, 5th–95th percentile | 1.304–1.666 m |
| Maximum sampled lean | 55.56° |
| Maximum sampled horizontal extent, including wind allowance | 1.662 m |

Matrix, colour and static texture versions/hashes remain unchanged through movement, and positions remain invariant across world-origin rebasing. All 11 complete packet/fog/finish/CSM/GI shader variants compile in GLES.

Diagnostic views cover the spawn path, close wheat, a downward view, three small camera movements and barley. They use actual geometry/materials with HDR 4× alpha-to-coverage. The environment previously reported WebGL disabled; native Mesa rendering verifies the visual geometry and shaders, not the full browser presentation or hardware frame rate. Diagnostic images omit the complete game sky, water and post-processing.

```sh
node tests/vegetation-v41/static-contracts.mjs
node tests/vegetation-v41/full-chain.mjs /tmp/v41-shaders.json
python tests/water-v28/native/gl_native.py /tmp/v41-shaders.json
node tests/vegetation-v41/native-export.mjs /tmp/v41-native
python tests/vegetation-v41/native-render.py /tmp/v41-native/wheat-down
node scripts/check.mjs
```
