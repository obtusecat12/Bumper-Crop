# Persistent visual direction

User preference established in V20, applying to subsequent textures and UI:

- All generated textures should feel like old PS1 / PS2 game textures: restrained detail, limited native resolution, moderate contrast and saturation, no over-sharpening, baked gritty noise or photographic microdetail.
- The antique wheat-field UI uses dark leather, subdued brass, parchment and transparent glass. Preserve the reference silhouette, not a flat modern dashboard.
- Generate reusable small components. Never use a complete generated instrument, status bar, menu or screenshot as the operational UI. Keep text, readings, state fills and motion separate.
- Status bands use shared SVG geometry; their fill follows the arc. Glass, cork, liquid, compass housing and glass lid have independent layers. Empty meters must really empty.
- Compose scene and all UI into the same frame before VHS / PS1 filtering. No sharp HUD or detail residual may be overlaid after the filter.
- Instruments belong inside the actual picture. Letterbox bars stay empty. Compact HUD; no upper-left survey plaque or nested decorative panel frames.
- Keep all existing input, accessible state, safe map teleport and multi-level theme API behavior.

V20 components: `dist/assets/ui-v20/`. Source sheets generated as transparent parts, then mechanically cropped, reduced to 24–256 px and moderately desaturated. Glass alpha is preserved. UI is rasterized at up to720 lines before the final display filter; a320-line PS1 mode naturally rasterizes it at320 lines.
