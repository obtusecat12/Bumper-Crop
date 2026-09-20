# V24 — weather timing and rain visibility repair

The user reported that manual weather appeared to fail or took too long.

Two reproducible defects were found in V23:

1. Weather age inherited the movement step capped at 35 ms. At 10 FPS it advanced at 35% wall-clock speed: dusk began after about 46 real seconds instead of 16, and the 42-second event lasted about 120 seconds. The rain/fog ramps were also too long for direct developer testing.
2. Rain used the same random component for horizontal position and density rejection. Light rain occupied only a narrow horizontal band, which could fall outside the view. Multiplying both density and opacity by rain strength further hid its onset.

Weather now advances from active requestAnimationFrame timestamps through WeatherDirector.tick. Movement keeps its original bounded timestep. Pause, hidden tabs, map and teleport suspend the weather clock and reset its timestamp origin on resume. Atmosphere, wet-ground motion, rain and flare use the weather clock too. This follows the timestamp-based animation guidance in [MDN requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame).

Manual rain begins at 45% and reaches full intensity in 1.2 seconds; fog begins at 35% and reaches full intensity in 1.8 seconds. Natural events retain a gradual five-/seven-second onset. Clear-to-dusk reaches clear sky in 1.2 seconds when manually triggered, starts transitioning at 4 seconds, reaches dusk at 9 seconds and returns to normal at 18 seconds. Natural probabilities are unchanged.

Rain now uses a fourth independent random component for density. Opacity is no longer attenuated twice, and its base opacity was modestly raised so lines survive the existing output filter. Particle count, surface-impact pool, draw-call count, water textures and world generation remain unchanged. Dense fog now targets the same 58-m far limit at both terrain-quality settings, avoiding the previous low-quality 7-m wall of fog.

A pointer-lock ownership guard also prevents unrelated delayed unlock notifications from re-pausing resumed gameplay. This was a code-level ordering risk, not a reproduced browser root cause. F2 displays actual rain/fog strength and the current sky phase; unchanged text no longer invalidates its UI raster every frame.

Validation is in v24-validation.json. Timing tests include 60, 20, 10 and 5 FPS; native GLES renders check immediate and one-second weather states. They are not device FPS measurements or a full browser playthrough.
