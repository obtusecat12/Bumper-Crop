# Original-photo inventory

Geometry authority: original 350 × 320 photo. Bounds use top-left normalized coordinates `[x0,y0,x1,y1]` and are visually approximate (±3 px; occluded flowers ±5 px). The enhanced image is not a measurement source.

| Object | Normalized bounds | Confidence | Observation |
|---|---|---|---|
| canoe-visible-hull | `0.0914, 0.1375, 1.0000, 1.0000` | high | Visible hull outline and long diagonal axis. Near bow extends into image boundary; exact hidden length is not recoverable. |
| far-tray | `0.1200, 0.1500, 0.4029, 0.2844` | high | First of exactly three visible rectangular metal serving trays; basin is recessed below the surrounding timber rim. |
| middle-tray | `0.1714, 0.2562, 0.5543, 0.4375` | high | Second tray, separated by narrow transverse wood partition. |
| near-tray | `0.2429, 0.3906, 0.7886, 0.6781` | high | Third and largest projected tray, ending immediately behind fruit compartment. |
| far-coconut-bowl | `0.2086, 0.1844, 0.2829, 0.2469` | high | Brown half-coconut ladle cup/opening in far tray; black interior is a shadowed cavity, not a black fruit. |
| middle-coconut-bowl | `0.2743, 0.2969, 0.3686, 0.3844` | high | Brown half-coconut cup with opening facing toward the near camera. |
| near-coconut-bowl | `0.4314, 0.4531, 0.5514, 0.5625` | high | Brown coconut cup/opening in the near tray, centered slightly left of tray center. |
| far-curved-handle | `0.1200, 0.2219, 0.2829, 0.3031` | high | Pale wooden curved handle drapes toward the left outer edge of far tray. |
| middle-curved-handle | `0.2114, 0.3594, 0.3771, 0.4875` | high | Pale curved wooden handle crosses front-left corner and drops outboard. |
| near-curved-handle | `0.3400, 0.5375, 0.5486, 0.8219` | high | Long pale wooden handle arcs diagonally from near coconut to tip well outside left rim; lowest tip near [123,259]. |
| near-purple-orchid | `0.3514, 0.4688, 0.4371, 0.5437` | high | Loose magenta/purple orchid on near-tray ice, left of coconut. |
| near-small-white-purple-orchid | `0.5429, 0.4469, 0.6086, 0.4938` | medium | Small pale orchid with purple center behind/right of near coconut. Petal count cannot be read. |
| middle-purple-orchid | `0.2629, 0.2781, 0.3171, 0.3250` | medium | Small purple bloom toward left/back of middle tray. |
| middle-white-orchid | `0.4143, 0.3312, 0.4829, 0.4000` | medium | Small white bloom toward right/front of middle tray. |
| far-purple-orchid | `0.1771, 0.1812, 0.2143, 0.2188` | medium | Small purple bloom behind-left of far coconut. |
| far-white-orchid | `0.2914, 0.1906, 0.3571, 0.2437` | medium | Pale bloom/ice detail to right of far coconut; exact petals uncertain. |
| whole-pale-netted-melon | `0.6914, 0.7375, 0.8800, 0.9406` | high | Large whole pale cream/sage melon at front-right of near fruit compartment; vertical green grooves, fine netting. No cut face. |
| whole-yellow-papaya | `0.5200, 0.7031, 0.6800, 0.8531` | high | Whole elongated/pear-shaped ripe yellow papaya at front-left, angled along canoe; subtle green mottling. No exposed flesh. |
| whole-green-papaya | `0.6457, 0.6281, 0.8000, 0.7688` | high | Whole smooth round/pear green papaya above/between the yellow papaya and melon; partly obscures doll bodies behind. |
| near-pineapple-body | `0.8029, 0.6750, 0.9714, 0.8844` | low | Pineapple fruit body is largely obscured by crown, right doll and melon. Do not invent a prominent black foreground pineapple body. |
| near-pineapple-leaf-crown | `0.7829, 0.4844, 1.0000, 0.8156` | high | Fresh dense long green/silver-green pointed leaves rise behind fruit pile at back-right and extend through right image boundary. |
| white-flower-souvenir-head | `0.5457, 0.5375, 0.6629, 0.6687` | medium | Left tiny brown ceramic souvenir head/white orchid headdress behind yellow papaya and left of green papaya; face roughly [197,185,221,212]. |
| white-flower-souvenir-visible-body | `0.5286, 0.6562, 0.6600, 0.7344` | medium | Small brown ceramic shoulders/body with pale lei partly hidden by yellow papaya. Tiny souvenir, not a large foreground statue. |
| right-souvenir-head | `0.7800, 0.6156, 0.8600, 0.7063` | high | Right tiny smiling brown ceramic head behind melon, in front of pineapple leaves; dark short hair. Exact floral headdress hue indistinct. |
| right-souvenir-visible-body | `0.7886, 0.7000, 0.8714, 0.7750` | medium | Small brown ceramic torso and pale lei partly hidden by melon/pineapple; pink floral texture is a plausible reconstruction, not resolved source evidence. |
| near-brown-oval-coconut | `0.4714, 0.6813, 0.5800, 0.7500` | medium | Low brown oval object in near fruit compartment left of white-flower doll, plausibly whole coconut; retain modest size. |
| far-fruit-and-crown | `0.1114, 0.0000, 0.3314, 0.1812` | high | Far-end fruit decor: yellow-green whole fruit and pineapple/crown. Individual fruit shapes are partly occluded. |
| far-small-brown-ornament | `0.1657, 0.0781, 0.2171, 0.1719` | low | Brown vertical form with small yellow/pale detail at far fruit group; might be a small souvenir, but identity and count are unresolved. Do not use the restored extra far doll as proof. |

## Modeling plan

s=0 far bow, s=1 near bow; transverse q negative toward visible left/near outer rail, positive toward wall/right rail; normalized vertical y=0 top gunwale. W denotes real central canoe width. Absolute dimensions are reconstruction estimates, not measured from a single photo.

Near melon front-right; yellow papaya front-left; green papaya higher between/behind those two; pineapple body and leaf crown back-right; both small dolls behind fruit plane, visible as small heads and partial torsos. Keep overlapping silhouettes.

Original near melon visible width ≈66 px. Green papaya ≈54 px, yellow papaya ≈56 px, each tiny doll bare face ≈20–26 px; headdress can be wider. The doll face should be about one-third of melon diameter in projection; avoid full doll bodies exposed in front of fruit.

Three similar real rectangular trays, perspective makes near tray appear larger. Basin and metal lip below wood rail, no raised square blocks or flat display tables. Real crushed ice geometry stays inside each recessed basin.

| Surface | Height relative to gunwale, in central canoe width W |
|---|---|
| gunwale/top wood rail | [0, 0] |
| metal tray lip | [-0.045, -0.015] |
| drink/low ice surface | [-0.12, -0.06] |
| ice peak range | [-0.065, -0.01] |
| tray basin bottom | [-0.3, -0.22] |
| coconut cup lowest bowl | [-0.12, -0.08] |
| coconut cup rim crest | [0.1, 0.15] |
| handle outboard low tip | [-0.25, -0.17] |
| fruit-compartment support | [-0.22, -0.14] |

## Enhancement guesses

- The generated restoration is 1312×1199; 4K was requested but not actually delivered. No resolution-only retry was made.
- The restoration broadens or clarifies parts of the bow, sharpens tray corners, increases white flower size/count, adds prominent whole coconuts, decorated carving and a far-end doll. These are enhanced guesses.
- Exact pineapple surface diamonds, fine melon netting, toy facial painting and right-doll flower color are plausible texture reconstructions because original pixels do not resolve them.
- New albedo atlas is material reconstruction guided by original colors; it does not assert measured anatomy or object geometry.
