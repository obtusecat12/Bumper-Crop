# Tiki NPC V79 — authored models and browser review

Scope: seven additional adults in Lantern Reef. The V78 room, reference props, exterior, bath NPCs and Level 27 pair remain intact. Only the two occupied booth tables' existing mug/bottle positions move to clear the new menu and plates.

## Cast and construction

| Actor | Identity / dress | Performance | Body + held geometry triangles |
|---|---|---|---:|
| Bartender | Black man; short coiled hair, teal waistcoat / cream shirt | Lift rum bottle, pour from physical mouth into customer cocktail, place bottle down, grasp shaker in both hands, shake, return shaker | 1400 |
| Sleeping patron | Balding middle-aged man, ochre patterned shirt | Supported counter sleeping pose; eyes remain closed; small breathing | 1032 |
| Bar customer | Auburn bob, burgundy floral dress | Seated, independently modeled draped skirt, green cocktail; blink and idle | 1152 |
| Waiter | Dark slick hair, ivory jacket and black bow tie | Supports order pad; pencil nib writes on the paper | 1064 |
| Ordering customer | Broad tan face, rust-red patterned shirt | Seated, index finger traces folded menu | 1032 |
| Elder diner | White hair, dimensional long beard, physical glasses, brown cardigan | Knife/fork at steak; small cutting and lifting motion | 1348 |
| Young Asian diner | Dark ponytail, powder-blue blouse and navy trousers | Opposite elder; quiet resting hands, breathing and independent blink | 1068 |

Models use the V75 connected landmark face/jaw topology and nineteen-bone anatomy. The source NPC skill rejected by the user was not applied. Face UV landmark fractions are measured from each new generated face; hair and beard have their own geometry/maps. Each runtime image is 128×128, nearest filtered without mipmaps. Thirty-Hz discrete mixer sampling controls these articulated service gestures, while camera/RAF remains uncapped. A small keyframe sampling epsilon prevents Float32 key-time rounding from putting bone poses one frame behind held props.

Generated originals, exact prompts, crops and manifests are in `art-source/npc-v79/`. Four asset-only xhigh agents produced images. Root authored models, poses, integration and tests. The supplied `image(20261003-144739).png` was read directly as the visual reference. No synthetic QA rendering or fabricated reference image is used.

## Verified

`node tests/tiki-v79/run.mjs` samples every pose in all seven complete clips. It checks 19 bones, discrete interpolation, the 500–1500 triangle budget, unique face/outfit images, actual FK hand error against authored prop targets, pinned feet, breathing, independent blinking, and no animation texture version changes. Also checks the gravity pour enters the receiving glass, pencil nib stays on the notepad, and main aisle/exit clearance.

Measured maximum hand-target error across the clips: 2.73 mm. Pour horizontal center error: 0.66 mm. The separate skirt ends before the bar front: its world max X is 3.2829 m against the 3.30 m counter front. Its floor clearance is 0.280 m and the seated legs/feet remain within the stool/foot-rail area.

Real Chromium WebGL2 screenshots use the existing opaque/refraction/SSAO/volume/bloom room pipeline. The full game screenshot additionally includes the original VHS display pipeline and HUD. This environment uses SwiftShader software WebGL; it is not a hardware FPS benchmark.

Observed preview: seven-character CPU pose update median 0.10 ms, P95 0.30 ms over 120 samples. Forced blink render: shader programs 40 → 40, resident texture count 194 → 194. Full game after entry: 107 programs; visiting the bar after warmup added 0. No page errors observed. Cached re-entry reused the exact same room and seven actors in 398 ms, including the existing transition. Return restored the original test state (Level 10, cell 0/0, x 0.6, z 52); no portal logic changed.

The new collision circles cover the standing bartender and waiter. No additional light or shadow map, full-scene capture, particle simulation, animation-time texture upload, or global input listener was added.

Official Three.js technical reference consulted: https://threejs.org/docs/pages/KeyframeTrack.html (discrete keyframe interpolation / bone property tracks).
