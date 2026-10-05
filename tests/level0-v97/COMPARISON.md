# Level 0 V97 — reference and actual-render comparison

The seven user originals are retained under `art-source/level0-v97/reference-originals`. Ref 4 is only 79 × 129 pixels. Generated enlargements of refs 4–7 assist inspection; they are interpretive, not evidence of newly discovered details. No generated image is used as a purported game screenshot.

| Reference/request | Implemented structure | Evidence |
|---|---|---|
| Ref 1 | Real vertical stud bays, sill/header, exposed yellow fiberglass; torn edge notches and loose lower fibers | crossDoor, chase |
| Ref 2 | Open, dark recessed cavities; flat black-pore insulation, selected tilted projecting ends, steel I-beams, timber joists and silver supply ducts | cavity, atrReverse |
| Ref 3 | Twelve additional near-floor-length wires, six extra hanging loops, ground-directed loose ends, 24 additional overlapping fallen ceiling boards | crossDoor, atrReverse |
| Ref 4 | Full-height wooden service chase opened through both wall skins; two upright pipes, two cross connections and six bracket/collar positions | chase |
| Ref 5 | Near-edge transverse partition with actual doorway and brown leaf; exposed insulated wall end beside it | crossDoor |
| Ref 6 defect | Irregular near-side room widths, staggered cut depths, thin exposed timber/plaster ends; lower exterior corners closed | nearWall |
| Ref 7 | Bare cut bed, isolated chair, casework and a seven-sofa sequence; constant 0.85 m center spacing, scale ratio 0.30; largest deliberately intersects wall | sofas, atrReverse |
| Incomplete dining room | Half tabletop, severed leg sections and exposed board core; red plastic gingham on retained edges; exactly one chair, empty plate and dried artificial flowers | dining |
| Bare mattress | Diagonal 1.55 × 2.03 m mattress in room corner; rounded sagging shell, stained ticking, genuinely modeled helical springs above a recessed torn base | mattress |
| Native Level 0 finishes | Shared default carpet/ceiling shaders and textures, lower T-grid; original wall material, existing doors and square emitters retained | overview and room frames |
| Chaotic blocked corridor | Wider independent yaw/jitter distribution, applied through the same rotated footprint placement code | blockade |

## Actual iteration

Pass 1 exposed a mattress/partition overlap, a dining cut that faced away from the viewer and a service-chase backing hidden by intact plaster. These were corrected in the model and shared plan. Pass 2 showed the outer corner return-wall omission and partly buried mattress springs. Corner walls now close the lower envelope, and the torn mattress base has been lowered to expose spring volume. Vertical fiberglass gained larger silhouette notches. Final targeted frames cover these changes.

## Necessary gameplay verification

`game-preview.mjs` loads the actual app through a local asset route. It enters with the existing F2 control, activates the actual Space jump handler, and advances the real `animateZero` movement/gravity path. Intermediate simulation drawing is suppressed only in the QA hook; final screenshots use the real renderer. Hooks are injected only by the local runner and are absent from shipped files.

- First rim jump lands at **Y = −3.2 m**, grounded, health 100.
- Walking after that landing keeps **Y = −3.2 m**.
- Next lower ledge catches a fall at **Y = −6.72 m**, grounded, health 100.
- Top-level walls do not remain as invisible lower-tier obstacles.
- Jump under the ceiling returns to the same floor; map teleport resets feet, vertical velocity and grounded state.
- Leaving restores the original Level10 coordinates/BigInt origin exactly.
- Browser errors: none in the completed gameplay run.

The earlier second-drop probe was incorrectly placed on the first-tier slab; its correct landing on that slab revealed the probe-coordinate mistake. The probe was moved into the actual first-tier opening and the full relevant flow rerun. No app change was made to force that test result.

Source geometry defines 22 downward tiers, 418 disjoint support rectangles and 685 architectural wall segments; 15 newly authored furniture placements include the seven shrinking sofas. Deep tiers omit tiny props. There are no upward stairs. Four generated source textures yield 12 runtime maps, **1,638,216 bytes** total. Static merged geometry and the existing bounded lights/shadows are retained. Chrome/SwiftShader output is actual local software WebGL rendering, not a hardware frame-rate measurement, exact reference match or award certification.

Final runtime counters: **506 flat fiberglass batts, 2 torn vertical batts, 3 framed exposed stud/service bays**. These are static material-batched meshes across the detailed tiers; no per-frame geometry reconstruction is used. The final overview submits approximately 2.41 million triangles including the surrounding resident Level0 chunks; this is a submission count, not an FPS claim.
