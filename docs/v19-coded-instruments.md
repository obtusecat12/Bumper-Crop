# V19 — code-drawn instruments and HD VHS presentation

The V18 whole-widget generated skins and stretched image-border menu controls
have been removed. The compass housing, three independent quarter-circle
channels, wheat relief, supply icon, cork and glass tube are Canvas 2D geometry.
They have modest internal raster sizes (294×156 vitals; 179×204 compass;
62×177 vial), bilinear enlargement, broad shading and restrained highlights.
There are no bitmap skins or procedural noise/grain textures in this HUD.

The menu uses a single left-aligned typographic column, quiet selection marker,
a scene scrim and no repeated rectangular buttons. Settings, notes, full map,
developer actions and touch controls share the muted material palette. The
existing level/theme registration API is preserved. Color changes invalidate
cached instrument surfaces; they do not regenerate terrain or change the filter.
Old image-skin token names remain accepted for API compatibility but are not used
by the default geometry-rendered instruments.

Resource channels interpolate to their target values at a capped 30 Hz and draw
actual colored arc lengths. The static housing is cached. Unchanged gauges,
fluid frames and accessibility values do not repaint. The larger spirit tube
has an inner cavity, separate wall highlights, mouth ellipses, a closed bottom
lens and a shaded oak stopper. Liquid height and meniscus are separate from the
glass, with damped acceleration/turn/landing response. This is economical 2D
shaded geometry, not physically ray-traced glass. Reduced-motion preference is
honored. Health/sanity state remains the existing state model; no new damage or
survival mechanics were introduced.

## 1080-line presentation

The camera and scene framebuffer are 1440×1080, square-pixel 4:3. The official,
unmodified ntsc-rs WASM still processes a 640×480 tape signal with the existing
curated preset and saturation lift. An inexpensive GPU area downsample creates
that signal. The final GPU pass restores a bounded, gently softened luminance
detail residual from the same captured HD scene; chroma and low-frequency tape
artifacts remain in the official signal. Two reusable texture pairs keep source,
unfiltered signal and completed tape output matched to one captured frame.

This is an HD hybrid VHS presentation, not a claim of pixel parity with running
the entire ntsc-rs chain directly at 1440×1080. It also is not only a 480-line
upscale: new high-frequency detail comes from the HD scene render. Direct
1080-line CPU processing measured roughly 76–80 ms per warmed frame in this
container. The retained 480-line signal measured 17.5 ms median / 19.2 ms p95 on
a representative frame. These are signal CPU timings, not browser/game FPS.

Only one frame is in flight. GPU readback remains asynchronous, buffers are
transferred/reused, and the 3D world is not redrawn while waiting for a tape
frame. Texture pairs are disposed on reconfiguration; stale epochs cannot
replace a newer mode. PS1 remains 320 lines. Pixel/native modes are unchanged.

## Verification and limits

- Native Canvas renders of the production instrument drawing functions reviewed.
- Native typography composition reviewed against the actual menu copy and style
  values; it is not a browser screenshot.
- Gauge endpoints, intermediate coverage, interpolation, idle stability,
  independent resource values and motion-driven fluid frames verified.
- Native GLES compiled and rendered the actual downsample/composite shader:
  1440×1080 output, opaque alpha, no GL errors. HD residual changed 233,229
  pixels in a representative frame, mean RGB difference 0.862/255 from the
  tape-only presentation.
- Frame lifecycle checked: bounded in-flight work, paired frame swapping, resize,
  mode switch, cancelled readback, context restore and disposal.
- 4:3 containment checked at desktop, ultrawide, portrait and landscape sizes.
- Theme inheritance and restoration checked; all application scripts parse and
  local module/stylesheet/asset references resolve.
- Managed browser preview is unavailable for this buildless static project.
  Browser composition, actual GPU frame time and device frame pacing have not
  been measured. Native rendering checks are not substitutes for those claims.

## References consulted

- Bethesda, original Morrowind PC manual (main menu/game screen):
  https://store.steampowered.com/manual/22320
- Diablo II original HUD example (research only; no image copied into the Site):
  https://github.com/bolrog/d2dx/blob/main/screenshots/d2dx2.png
- MDN, Canvas optimization (cached surfaces and static/dynamic layers):
  https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas
- MDN, image smoothing:
  https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/imageSmoothingEnabled
- Official ntsc-rs source and web wrapper (existing vendored implementation):
  https://github.com/ntsc-rs/ntsc-rs
  https://github.com/ntsc-rs/ntsc-rs-web
