# Spa NPC assets v68

Two newly authored adult male low-poly spa models, in meters, +Y up and +Z forward. Final assets are in `final/`; generated runtime maps are in `runtime/`.

| Asset | Triangles | Crown above local ground | Pose and support |
|---|---:|---:|---|
| `spa-man-a.glb` | 2,162 | 1.329 m | Seated, pelvis y=0.50, slightly reclined torso, permanently closed eyes, both palms resting on the towel-covered thighs |
| `spa-man-b.glb` | 2,002 | 1.730 m | Relaxed asymmetric standing stance, left palm resting at the basin target `[-0.37, 0.737, 0.19]` |

The new geometry replaces the rejected torso and limb construction. It uses a deep rib cage, broader adult arm mass, sloping trapezius, a short neck, eight-edge shared deltoid branch boundaries, angular jaw/cheek/nose planes and broad grouped-finger hands. Upper-arm bulk peaks below the shoulder, avoiding detached shoulder fins. Standing hidden upper-thigh faces are omitted to prevent cloth penetration; the waist fold fully encloses the torso. No subdivision, smoothing modifier, eye spheres, detached nose blocks or external mesh assets are used.

The anatomy is authored around a nominal 0.242 m head, a 0.176 m cranium breadth, a 0.398 x 0.252 m pectoral cross-section and a 0.322 m waist breadth. Exposed neck below the chin is about 0.058 m on A and 0.064 m on B. See each metadata file for exact posed measurements and bone origins.

Each GLB contains one skinned mesh with three material primitives (`body`, `face`, `towel`), a real 20-joint skin, normalized weights and three embedded 256 x 256 PNG diffuse textures. Materials use `KHR_materials_unlit`; samplers use nearest filtering. The two characters share the generated body and quiet ivory towel maps and use separately generated facial maps. Front/back torso UV islands and limb/neck islands split vertex UVs while retaining coincident geometric seam positions; no triangle interpolates across unrelated atlas islands.

A's eyes are closed in the diffuse texture. There are no opening eyelid plates or eye-opening animation keys. The three reserved morph targets are zero throughout. Each asset contains a 12-second AnimationMixer-compatible clip sampled at 20 Hz with STEP interpolation. Breathing is limited to 0.0015/0.002 radians at spine/chest; the seated head has only a 0.0025-radian motion. Both arm roots and both foot roots cancel parent motion, keeping supported hand and sole surfaces fixed. B's head motion is 0.01 radians.

A's lower-palm support targets are computed from vertical intersections with actual towel triangles, rather than estimated from wrist centers:

- Left palm: `[-0.200, 0.5305804410, 0.301]`.
- Right palm: `[0.214, 0.5177890390, 0.313]`.
- Standing left palm: `[-0.370, 0.737, 0.190]`.
- Both models: sole y=0.0. A's intended waterline is y=0.86.

The build report verifies zero degenerate triangles, normalized weights, 20 joints, held interpolation and pinned support joints. B's authored lower-palm surface is within 2e-13 m of its target. Root separately verified the assets with the production Three.js GLTFLoader, actual scene raycasts and a complete 20 Hz support sweep. See the integration runtime validation for those world-placement results.

Bone names preserve the existing schema: `root`, `pelvis`, `spine`, `chest`, `neck`, `head`, then `clavicle.L`, `upper_arm.L`, `forearm.L`, `hand.L`, corresponding `.R` bones, and `thigh.L`, `shin.L`, `foot.L`, corresponding `.R` bones. Three.js sanitizes periods on import, such as `hand.L` to `handL`. Use SkeletonUtils.clone for independent instances.

Rebuild from this directory:

```sh
python build_npcs.py --textures runtime --out final
```

`final/model-contact-sheet.png` and the individual front, three-quarter, profile and face views are actual textured triangle-rasterized mesh renders. The preview uses a restrained directional multiplier to reveal the faceted geometry; exported materials remain unlit. `--draft` is only for explicit placeholder-map diagnostics. The final files were built using the generated maps, with `draft: false`.

The final proportion review passed after the two bounded corrections to the deltoid contour and towel waistband. No further visual changes were made after that review.
