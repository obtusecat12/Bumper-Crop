# Handheld camera / V27

The collision body and input heading remain authoritative for movement. `HandheldCameraRig` composes the real Three.js camera once, before rain, wet-lens optics, shadows, compass and rendering. No extra draw call, render target, texture or shader pass is introduced.

## Motion model

- Independent improved Perlin gradient noise slices drive pitch, yaw and roll. Each axis combines three fatigue octaves (base 0.13–0.21 noise-domain units/s) and two wrist octaves (1.17–1.63 units/s), with persistence 0.46 and lacunarity 1.97. A local seeded permutation does not touch the world's deterministic RNG. Amplitudes rise modestly with fatigue and running. A critical-damped gain brings noise in after a hard reset/photo exit.
- Look uses analytic second-order damped oscillators. Acceleration is `ω²*(target-current)-2ζω*velocity`, the restoring sign that converges toward the requested heading. Yaw uses ω=28 rad/s, ζ=.88; pitch uses 30/.90. Angular velocity persists between updates, yaw takes the shortest wrapped route, pitch retains its limits. The exact update is frame independent for a held target; continuously sampled mouse/touch input still has refresh-rate sampling differences. The implementation supports underdamped and critical damping, the cases used here.
- Eye height uses a critical spring, replacing the previous exponential interpolation. Jump height remains authoritative player physics. Horizontal motion keeps the existing collision solver.
- Grounded **resolved travel**, measured before chunk rebasing, advances a closed cubic Hermite path with two unequal left/right lobes, short downward compression and longer recovery. Step lengths are 1.34 m walking, 1.72 m running and .76 m crouching, tuned for this game's movement scale. These are artistic starting values, not a biomechanical calibration.
- Heel boundaries inject downward velocity into a separate damped vertical spring plus small pitch and alternating roll impulses. Integration splits at the contact time, so each impulse has the same strength at 30/60/120/144 Hz. The velocity jump represents the time integral of a short acceleration spike. Landing emits one speed-scaled impact. Step sounds use these same contact events.
- The former fixed sine head bob and paused sine camera sway are removed. Tiny bank during turning follows the body's angular velocity through another second-order spring. Stopping fades gait energy while independent hand motion remains.

## Integration and lifecycle

`state.yaw/pitch` are controls, not presentation offsets. `state.y` remains the base eye height, excluding jump/bob. The final camera pose supplies compass/map bearing, lens yaw/pitch/roll, rain optics and water-plane crossing. Physical camera velocity combines resolved player dx/dz and changing camera offsets; 64 m local-origin shifts never appear as velocity spikes.

Pause/map/tab loss freezes the final pose and camera clock, including when crouching or jumping. Resume resets derivative histories without moving the image. Every teleport and failed-landing restoration resets springs, phase and wet-lens velocity history. Photographic reference views are exact and motionless; moving, looking or jumping exits them.

Existing `bob` preference is now labelled “手持摄像机运动”. Disabling it, or a current OS reduced-motion preference, removes procedural offsets and look lag. Crouch height still transitions through the critical spring. No extra tuning panel was added.

## Validation

`npm run test:camera` runs the actual module against real Three cameras, and executes the shipped `move()` function with real world rebasing. Reports cover spring response, ±π turns, pitch bounds, duplicate contact prevention, frame-rate contact/impulse agreement, stationary/airborne motion, landing, crouch, reference lock, pause, reduced motion and enormous world coordinates. The ten-minute stress case bounds motion and camera velocity. CPU microbenchmarks exclude game simulation, rendering, browser scheduling and GPU time; they are not an FPS claim.

`npm run test:water` checks the previous lens/splash/rain behavior and immutable generator/UI/VHS hashes (cache query strings normalized). World layout, materials, water implementation and filter settings are preserved. All application cache URLs advance together to V27.

The offline motion clip uses a previously exported static barn fixture with the actual new camera matrices; it reviews framing and motion only, not the full current browser game or VHS frame pacing. Browser/device FPS has not been measured.

## Primary references

- Ken Perlin, improved gradient noise reference and SIGGRAPH 2002 algorithm: https://cs.nyu.edu/~perlin/noise/
- PBRT authors, octave weighting and sampling considerations: https://www.pbr-book.org/3ed-2018/Texture/Noise
- Ryan Juckett, damped camera springs and analytic integration: https://www.ryanjuckett.com/damped-springs/
- Moore, Hirasaki, Raphan and Cohen, locomotion frequencies (vertical stepping versus lateral stride): https://scholars.mssm.edu/en/publications/the-human-vestibulo-ocular-reflex-during-linear-locomotion-2/

The asymmetric loop is a crafted Handycam motion profile, not an assertion that human heads follow an exact mathematical heart curve.
