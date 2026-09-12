# V17 field-instrument UI

The interface uses the established dark olive, muted olive, cream and pale-gold
palette. Raised equipment casings, reversed inset bevels, physical key states,
segmented gauges and restrained glass reflections replace the flat panels.
The menu, HUD, settings, journal, controls, developer dialog, map, touch controls
and boot/error display use the same material language.

The circular navigation screen has a chassis, concentric rim, recessed map,
cardinal marks and a static glass overlay. Only this clickable mini instrument
uses a slight CSS perspective. The full map stays axis-aligned so pointer-to-world
coordinates and teleport selection remain correct. The 4:3 scene, projection,
VHS signal processing and deterministic world are unchanged.

## Research and adaptation

These English primary/archival references informed the original UI, rather than
supplying assets copied into the game:

- [Capcom's Resident Evil English manual](https://www.videogamemanual.com/ps1/Resident%20Evil%20%28USA%29.pdf), printed page 13: recessed item display, substantial casing, separated status compartments and contextual description strip.
- [Konami's MGS1 Codec manual](https://metalgear.konami.net/manual/mc1/mgs1/pc/en/page05.html): monochrome instrument screens, prominent numerical readouts and restrained control labels.
- [Konami's MGS1 game-screen manual](https://metalgear.konami.net/manual/mc1/mgs1/pc/en/page08.html): upper-right radar, explicit player direction and a clear central play area. Its original radar is rectangular; this game's circular housing is an adaptation requested by the user.
- [Konami's original Silent Hill English manual](https://www.gamesdatabase.org/Media/SYSTEM/Sony_Playstation//Manual/formated/Silent_Hill_-_1999_-_Konami.pdf), printed page 15: cartographic hierarchy, annotated information and contextual map controls.
- [Polyphony Digital's official Gran Turismo 2 screenshots](https://www.gran-turismo.com/us/products/gt2/): compact headings, separated data regions, selection arrows and segmented meters.
- [Microsoft DrawEdge](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-drawedge): raised/sunken inner and outer borders. This is the documented rendering vocabulary, not a claim that its current documentation was published in 1995.

## Theme API

`dist/ui-themes.js` owns the registry. The game initializes it after both the main
and navigation DOM exist and exposes the frozen controller as `window.levelUI`.
Only the `field-recorder` theme and level `10` are installed by default. New
themes inherit a complete token set; missing overrides never retain a previous
theme's values. Unknown IDs/tokens and duplicate registrations throw before
the visible state changes.

```js
// Future level loader, after its own world/content has been prepared:
levelUI.registerTheme('concrete-recorder', {
  extends: 'field-recorder',
  tokens: {
    shell: '#343a34',
    shellTop: '#565e55',
    accent: '#d2d6b9',
    glass: '#b7c3b3',
    radius: '2px',
    mapPlayer: '#d2d6b9'
  }
});
levelUI.registerLevel('future-level', {
  theme: 'concrete-recorder',
  code: 'LEVEL X',
  name: '新层级',
  subtitle: 'NEW LEVEL',
  number: '00X'
});
levelUI.applyLevel('future-level');

// Optional presentation-only override for the current level:
levelUI.applyTheme('field-recorder');
// Restore Level 10's own metadata and theme:
levelUI.applyLevel('10');
const current = levelUI.getState();
```

Supported tokens are exported as `FIELD_THEME`. Colors cover ink, muted ink,
accent, line, shell/top/bottom, bevel light/dark, screen/deep screen/screen ink,
glass, button/active button/button ink/active ink, shadow, map background/grid/
player/outline/cursor. `font`, `radius` and `bezel` cover typography and common
frame geometry. A camelCase token becomes a `--ui-kebab-case` CSS variable.
Color values and the three geometry/type properties are checked with
`CSS.supports` where available.

Applying a theme sets `data-ui-theme` and `data-ui-level` on the document root.
It updates only nodes explicitly marked `data-ui-copy="code|name|subtitle|number"`.
Runtime location, loading, pause state, weather, inventory and performance text
remain owned by the game. Future level prose and world generation are separate
content responsibilities; this API does not generate or teleport to a new level.

For per-level layout rules, scope CSS to the root attribute and existing
`data-ui-part` hooks: `menu`, `hud`, `vitals`, `navigation`, `map`, `settings`,
`journal`, `controls`, `developer`, and `touch`. Preserve the action IDs,
ARIA relationships and native input/select nodes.

The document root dispatches `ui-themechange` with the immutable current state
as `event.detail`. Listen on `document.documentElement` (the event does not
bubble). The navigation module consumes the map UI colors and requests one
repaint when they actually change. Geographic tile colors still describe the
existing terrain and are intentionally outside this UI-only contract. No tile
cache invalidation or generation job is required for a UI color change.

## Rendering and validation

- Bevels, casing, dial markings and glass are static CSS layers. There is no
  additional WebGL scene/pass, DOM-to-VHS readback, backdrop blur, radar sweep,
  per-frame noise canvas, or new asset download. Glass layers ignore pointer input.
- The original 288×288 minimap and radius-80 cardinal positions remain. Heading
  continues to transform the cached canvas; map painting/worker limits remain.
- The HUD follows the existing 4:3 picture boundaries. Large-window menus also
  fit that picture; compact menus and full-map dialogs use available window
  space. Short menus allow scrolling and include a tighter 480-row layout so
  loading information remains reachable. Touch joystick geometry is unchanged.
- All original 54 UI IDs, 26 buttons, map hooks and ARIA label targets were
  checked against V16. Application modules parse and local asset/import paths
  resolve. Theme inheritance, level transitions, restoration, rejection without
  partial application, event frequency and dynamic-state isolation passed.
- Read-only responsive layout review caught and corrected the 640×480 loading
  overflow. No browser screenshot/end-to-end interaction or device FPS test was
  performed; static DOM/CSS checks are not a substitute for those measurements.
