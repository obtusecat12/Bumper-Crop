# Harvest instrument UI

The supplied screenshot is the visual reference for the brass pocket compass,
leather-and-wheat vital instrument, parchment keys, and serif lettering. The
upper-left survey plaque and nested menu/panel shells are removed. Menus use
individual parchment/brass controls on the dimmed scene. The world, lighting,
4:3 camera framing, VHS processing, and map tile generation remain unchanged.

## Assets and layout

Five generated assets were used: the initial two-band instrument (now only its
leather crop is used by the joystick), compass, key, requested three-band revision,
and requested clear corked tube. Exact prompts are retained in the accompanying
JSON documents. The user's prescribed prompt-writing reference was downloaded
and read before generation. The final instrument and tube are native RGBA PNGs;
their pixels and alpha are preserved. The compass/key SVG skins embed the
original generated RGB image bytes with fixed vector clipping to remove their
baked matte and open the compass display. No per-frame image processing occurs.
`dist/assets/ui/harvest-skins.json` records source hashes and dimensions.

The circular map opening is centered at (520.31, 618.10) in the 1254-square skin.
The map cache/canvas is retained behind it. Four cardinal plaques orbit that
center, without rotating or distorting the full-map coordinate system.
The vital artwork is 1774 × 887. Three clipped angular overlays darken spent
stamina, hydration, and health while preserving its original textured material.
`hud-layout.js` records the calibrated colored-band boundaries.

The glass tube is rotated -6 degrees and sits behind the upper rim. Its fluid
mask follows the actual cavity. A damped surface model responds to lateral
acceleration, turning, footsteps, and landing, then settles. Only the fill and
meniscus paths change, at most 30 times per second. Pause, map view, hidden page,
and reduced-motion handling avoid unnecessary movement. No WebGL pass or
full-screen blur is added. The surface's rest slope compensates for the tube's
mounting angle.

`state.health` and `state.sanity` are independent 0–100 values, initially 100.
They are displayed directly; this UI change introduces no enemies, arbitrary
damage, or automatic sanity drain. Almond water restores sanity as well as the
existing hydration/stamina effects. Future damage/stress systems can update
these same fields without changing the instrument. Animated liquid motion does
not mutate any survival value.

## Theme extension

The existing `window.levelUI` registry remains intact. In addition to inherited
palette, copy, and typography tokens, themes can override `vitalsSkin`,
`compassSkin`, `keySkin`, `vialSkin`, and `vialLiquid`, `vialShadow`, `vialLight`,
`vialSurface`. Equivalent replacement skins should retain the documented geometry;
a different instrument shape also needs corresponding calibrated masks.
The Chinese serif subset is derived from Noto Serif CJK SC Regular:
https://github.com/notofonts/noto-cjk/blob/main/Serif/OTF/SimplifiedChinese/NotoSerifCJKsc-Regular.otf
The SIL Open Font License is bundled beside the font. The source font's copyright
and license records are retained in the subset.

## Verification

- All application JavaScript parses successfully; 147 local references resolve.
- Existing DOM control hooks and dialog targets are preserved, IDs are unique,
  and obsolete survey/minimap shell wrappers are absent.
- Three independent gauges, 0/50/100 endpoints, clamping, bottle counts,
  unchanged-state update reuse, and sanity fill visibility were checked.
- Liquid response remains bounded, settles after movement, resets on pause,
  and honors reduced motion. Theme inheritance/restoration checks pass.
- Native librsvg/Cairo component renders were inspected at full, half, and empty
  values for clipping, alpha, gauge boundaries, text positions, and the glass
  cavity. These are component renders, not browser or full-scene screenshots.
- Browser preview was unavailable for this buildless static project's supported
  managed preview path. No browser FPS measurement is claimed.
