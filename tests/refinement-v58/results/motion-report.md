# Camera rig numeric verification

Source SHA-256: `16762d150e2543c168bdf5a1bc8f7f89f84b29c00fb052b6a10b5a401e25cf42`
18 passed; 0 failed.

- PASS: Analytic damped spring is equal at 30, 60, 120, 144 Hz for constant targets
- PASS: Zero and negative dt leave spring state unchanged
- PASS: A dropped-frame spring interval remains finite and settles
- PASS: Look spring takes shortest path through ±π yaw seam
- PASS: Pitch stops retain hard bounds and cancel outward spring velocity
- PASS: Gait emits exactly one contact per travelled stride across frame rates
- PASS: Gait does not duplicate contacts on adjacent frames
- PASS: Event-timed heel response matches across FPS after the same constant-speed distance
- PASS: Blocked movement emits no contacts and does not advance phase
- PASS: Airborne traversal freezes gait and reports one landing event
- PASS: Disabled motion gives exact input heading and zero camera noise or gait offsets
- PASS: Photo lock gives exact reference pose, zero velocity, no contacts, and frozen clock
- PASS: 64m x/z rebasing at huge BigInt coordinates preserves the physical camera velocity
- PASS: Resume clears velocity and look spring derivative while retaining frozen pose
- PASS: Gait path closes continuously at full stride
- PASS: Perlin seed is deterministic and independent coordinate bands remain bounded
- PASS: Ten minutes of locomotion keep offsets, rotations, springs and velocity finite and bounded
- PASS: Long-clock samples stay finite and bounded without accumulated positional drift

## Frame-rate gait measurements

| Mode | FPS | Contacts | Expected | Adjacent-frame duplicates |
|---|---:|---:|---:|---:|
| walk | 30 | 44 | 44 | 0 |
| walk | 60 | 44 | 44 | 0 |
| walk | 120 | 44 | 44 | 0 |
| walk | 144 | 44 | 44 | 0 |
| aligned-walk | 30 | 40 | 40 | 0 |
| aligned-walk | 60 | 40 | 40 | 0 |
| aligned-walk | 120 | 40 | 40 | 0 |
| aligned-walk | 144 | 40 | 40 | 0 |
| run | 30 | 62 | 62 | 0 |
| run | 60 | 62 | 62 | 0 |
| run | 120 | 62 | 62 | 0 |
| run | 144 | 62 | 62 | 0 |
| crouch | 30 | 35 | 35 | 0 |
| crouch | 60 | 35 | 35 | 0 |
| crouch | 120 | 35 | 35 | 0 |
| crouch | 144 | 35 | 35 | 0 |

## Measured bounds and cost

- maxTranslationMetres: 0.06589103592360997
- maxRotationDegrees: 1.005496262114747
- maxVelocityMetresPerSecond: 5.999140560630966
- maxHeelMetres: 0.005683073240318013
- Median CPU cost: 0.001125 ms/update (v24.19.0).

- DampedSpring tested for underdamped and critically damped parameters used by the product; implementation is not a generic overdamped solver for zeta > 1.
- Position and rotation bounds are tuning observations under constant heading, not clinical comfort guarantees. Dynamic input is discretized per frame; only constant-target spring integration is mathematically exact.
