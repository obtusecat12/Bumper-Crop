# Spa NPC assets v69

Two authored adult spa characters in meters, +Y up and +Z forward. Geometry is angular and deliberately low-poly; no subdivision or smoothing is applied. Runtime GLBs embed their textures and have real 20-joint skins with one skinned mesh and three material primitives each. Each diffuse PNG is 256×256, unlit with nearest filtering.

| Asset | Triangles | Character |
|---|---:|---|
| `spa-man-a.glb` | 2,330 | Elder approximately 75, receding white hair, full short white beard, eyes permanently closed. Seated resting pose, narrower chest and arms, soft abdomen, muted aged skin. |
| `spa-man-b.glb` | 2,190 | Younger V68 face/body/towel retained, asymmetrical standing pose, supported basin hand and subtle ongoing idle motion. |

## Changes from v68

V68 had no real blinking or finger morph geometry: all three reserved target deltas and every animation weight were zero. Both clavicles were world-pinned, suppressing shoulder and arm motion. B's head amplitude had been reduced from V67's approximately 0.05 rad to 0.01 rad.

V69 restores actual movement without replacing V68's anatomy and contact layout:

- Chest expands 1.5% (about 3 mm per side at its widest part), with approximately 3 mm shoulder rise over each six-second breath. Clavicles follow the chest. Neck inverse scale preserves head size.
- B has a slow 5 mm pelvis weight shift and delayed head turn of about 2.5–3 degrees. A's head remains restful, with only 0.0025 rad rotation.
- A wrists make 1.5 mm fore/aft micro movements and no more than 0.5 mm vertical lift from their resting contact. B's left palm remains fixed at `[-0.370, 0.737, 0.190]`. Both models keep their sole surfaces fixed on y=0.
- Both finger morphs have real nonzero distal geometry deltas while leaving the supported palm regions unchanged. B's free hand has a somewhat larger small curl.
- B fully closes both eyes for five held samples (250 ms) around 2.4, 6.8 and 10.4 seconds. Blink intervals across the loop are 4.4, 3.6 and 4.0 seconds. The eyelid mesh has 564 actually moving exported vertices. These are clipped from the exact underlying head triangles; closed skin rests 0.32 mm above the original face surface and the crease 0.43 mm above it. Open lids are hidden 1.5 mm under the surface. There are no floating lid cards or zero-delta blink tricks.
- A's full white beard follows six existing jaw/cheek rings, continuously samples the generated facial diffuse, adds at most 7 mm of close beard volume, and joins the mandible/cheek outline. It is not a detached card.

The V69 elder face and body are newly generated. The younger face/body and shared towel are preserved from V68. A's body material is a subtle neutral skin atlas without the former painted six-pack. Source generation records are supplied separately by the elder texture task.

## Rig and animation contract

Bone names preserve the existing schema: `root`, `pelvis`, `spine`, `chest`, `neck`, `head`, then `clavicle.L`, `upper_arm.L`, `forearm.L`, `hand.L`, corresponding `.R` bones, and `thigh.L`, `shin.L`, `foot.L`, corresponding `.R` bones. Three.js may sanitize periods when importing. Use SkeletonUtils.clone for independent instances.

Each clip lasts 12 seconds, has 241 samples at exactly 20 Hz, and uses STEP interpolation for translation, rotation, scale and morph-weight tracks. The first and last samples match. Scale tracks are required for chest breathing and exact distal support cancellation.

`verify_assets.py` independently parses the exported GLB bytes, reconstructs every exported TRS hierarchy frame, applies inverse bind matrices, actual skin weights, and actual morph deltas, then verifies movement and fixed supports. It does not rely on cached authoring-world transforms. The final report verifies all texture dimensions/materials, 20 joints, true skinned nodes, STEP timing, nonzero blink/fingers, and movement of skinned body vertices.

Measured exported support error is below 0.00000011 m for B's rigid palm patch and below 0.00000006 m for the soles. A's wrist movement is intentional and measured at about 1.53 mm. B's actual palm surface meets its target within 2e-13 m in the authored base pose.

## Actual mesh evidence and rebuild

`model-contact-sheet.png` and individual front, three-quarter, profile and head images are actual triangle-rasterized textured model views. The preview renderer uses a restrained directional multiplier to reveal facets; exported materials remain unlit. `b-eyes-open-closed.png` holds pose, camera, and textures constant and changes only the real lid morph.

`npc-v69-motion.webm` is a 12-second actual mesh render at 20 fps. Every frame evaluates the real bones, skinning and morph targets; it is not image-generated footage, a static thumbnail or motion-amplified evidence. The views show both complete figures, B's face and B's hands at natural motion amplitude.

```sh
python build_npcs.py --textures runtime --out final
python verify_assets.py
python render_motion.py
ffmpeg -framerate 20 -i final/motion-frames/%04d.png -c:v libvpx-vp9 -b:v 0 -crf 30 -pix_fmt yuv420p final/npc-v69-motion.webm
```

The `--draft` option creates placeholder maps only for explicit diagnostics. Final builds use generated and preserved production diffuse maps, with `draft: false`.
