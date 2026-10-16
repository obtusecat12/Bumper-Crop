# Level 1 Dashboard UI sound effects (ui-l1)

Candidate SFX for the Level 1 OS X Dashboard-style spring-in panel (`dist/l1-dash.js`).
Not wired into the game yet; the current synthesized Web Audio cues (boop / boopHi / click / thunk) are unchanged.

Processing (ffmpeg): leading/trailing silence trimmed (-55 dB), mono, 44.1 kHz, peak-normalized to -1 dBFS
(clips are too short for a meaningful LUFS reading), 1 ms fade-in / 8 ms fade-out, exported as Ogg Vorbis (q6) + MP3 128k.
Every file is under 0.6 s.

| File (.ogg + .mp3) | Intended use | Original file | Source page | Author | License |
|---|---|---|---|---|---|
| l1_pop_drop | Main glass water-drop "boop" when the whole dashboard springs in (replaces/layers `boop`) | drop_001.ogg | https://kenney.nl/assets/interface-sounds | Kenney (kenney.nl) | CC0 1.0 |
| l1_pop_drop_low | Lower, rounder drop variant (pairs with pop_drop like `boopHi`, or for a smaller panel) | drop_004.ogg | https://kenney.nl/assets/interface-sounds | Kenney (kenney.nl) | CC0 1.0 |
| l1_pop_chime | Two-note glassy chime, optional first-open / Level 1 entry flourish | confirmation_002.ogg | https://kenney.nl/assets/interface-sounds | Kenney (kenney.nl) | CC0 1.0 |
| l1_slide_whoosh | Soft swell under the spring travel (rises into the arrival) | open_002.ogg | https://kenney.nl/assets/interface-sounds | Kenney (kenney.nl) | CC0 1.0 |
| l1_overshoot_spring | Metal spring twang on the overshoot / rebound | metal_spring_01.ogg | https://opengameart.org/content/100-cc0-metal-and-wood-sfx | rubberduck (OpenGameArt) | CC0 1.0 |
| l1_settle_click | Precise mechanical click when the spring settles (replaces `click` at settle) | switch7.ogg | https://kenney.nl/assets/ui-audio | Kenney (kenney.nl) | CC0 1.0 |
| l1_widget_land_glass | Small glass tick as each gauge/widget lands in place (staggered) | glass_002.ogg | https://kenney.nl/assets/interface-sounds | Kenney (kenney.nl) | CC0 1.0 |
| l1_widget_land_glass_alt | Alternate glass tap for widgets (use to avoid repetition) | impactGlass_light_001.ogg | https://kenney.nl/assets/impact-sounds | Kenney (kenney.nl) | CC0 1.0 |
| l1_tab_collapse | Tab / panel collapse (hide; replaces `click` on hide) | minimize_009.ogg | https://kenney.nl/assets/interface-sounds | Kenney (kenney.nl) | CC0 1.0 |
| l1_tab_expand | Tab expand / reopen a section | maximize_009.ogg | https://kenney.nl/assets/interface-sounds | Kenney (kenney.nl) | CC0 1.0 |
| l1_key_click | Metal key / button press | switch2.ogg | https://kenney.nl/assets/ui-audio | Kenney (kenney.nl) | CC0 1.0 |
| l1_key_release | Button release (pairs with key_click) | mouserelease1.ogg | https://kenney.nl/assets/ui-audio | Kenney (kenney.nl) | CC0 1.0 |
| l1_needle_tick | Very short tick, repeat during the gauge needle sweep | tick_002.ogg | https://kenney.nl/assets/interface-sounds | Kenney (kenney.nl) | CC0 1.0 |
| l1_hit_thunk | Low soft thump on health/battery damage (layers/replaces `thunk`) | impactSoft_medium_000.ogg | https://kenney.nl/assets/impact-sounds | Kenney (kenney.nl) | CC0 1.0 |
| l1_hit_clank | Metallic clank on a heavier hit (housing knock) | impactMetal_heavy_001.ogg | https://kenney.nl/assets/impact-sounds | Kenney (kenney.nl) | CC0 1.0 |

Pack downloads (no login required):
- Interface Sounds: https://kenney.nl/media/pages/assets/interface-sounds/fa43c1dd4d-1677589452/kenney_interface-sounds.zip
- UI Audio: https://kenney.nl/media/pages/assets/ui-audio/490d233f68-1677590494/kenney_ui-audio.zip
- Impact Sounds: https://kenney.nl/media/pages/assets/impact-sounds/87b4ddecda-1677589768/kenney_impact-sounds.zip
- 100 CC0 metal and wood SFX: https://opengameart.org/sites/default/files/100-CC0-wood-metal-SFX.zip
