# Stage 3 / EX-01 radio room checkpoint — 2026-10-27

Not imported by the game. First authored equipment bay for exploration-01; room shell resizing, streaming ownership, collider integration and final material binding are still pending. Local metre coordinates, roughly 7 × 4 m scene.

Reference: https://backrooms-wiki-cn.wikidot.com/base-alpha , linked Capalaba receiving-station equipment-room photo:
https://brsandbox-pro.wdfiles.com/local--files/file-pale-chamber/US_Army_Radio_Receiving_Station,_Capalaba,_Equipment_Room_(2020).jpg
Photo viewed for composition; original photo is not redistributed. Five open racks, mixed installed/empty bays, analog clock/knobs, cream ledge/wood edge, drawers, chairs, dangling connected wires, conduits, vents and store doorway modeled separately. An interpretive reconstruction, not pixel-identical or measured from a survey. The scene is deliberately a small detailed equipment bay, not a claim that the whole large shell is furnished.

## Assets
- `rack-enamel-original.png`: independently generated with OpenAI image_gen. Exact original PNG bytes are preserved in original-parts/. Run python original-parts/restore.py to restore it. SHA-256 and byte lengths are in manifest.json. Split storage avoids large connector payloads; these parts are not runtime assets.
- `dist/assets/alpha150/rack-enamel.webp`: 512px photographic diffuse derived using Lanczos/quality82.
- `dist/assets/alpha150/rack-enamel-normal.webp`: estimated normal, central finite differences of diffuse luminance ×0.35; not a measured surface scan. Quality88.
- Exact generation prompt: "Use case: game texture. Create ONE square 1024x1024 photographic diffuse material texture for an early PS2 game: aged dark charcoal wrinkle-painted steel equipment rack front surface. Seamless tile, straight orthographic flat surface, matte fine pebbled enamel, restrained old grey scuffing and very subtle oily brown wear. Uniform neutral diffuse lighting, no cast shadows, no vignette, no perspective, NO instruments, NO screws, NO dials, NO text, NO border. This is a raw albedo material for a carefully modeled 1940s radio receiving station rack. Restrained natural photographic realism, not pixel art, not a rendered room."
- The image tool returned 1254×1254 despite the requested1024; runtime derivative is512. Tiling requested, boundary seamlessness not certified.
- https://animimostudios.itch.io/psx-silent-inventory-starter-pack-1 rechecked2026-10-27: CC0 stated; not downloaded/imported this increment.
- https://shayno.itch.io/ps1-retro-pccomputer-asset rechecked2026-10-27: no clear license displayed; not redistributed.

## Preview
Start managed project preview, visit `/__alpha-radio.html`. Front/rear use the actual Three.js geometry projected in Canvas2D. Screen-space faint enamel texture is an inspection aid, not final metre-scaled UV material; no baked lighting. Normal map is saved for runtime integration but not represented by this software view. Model hard edges have6mm bevels, circles12segments, cables6segments. Collision descriptors are prepared but not active. No gameplay or GPU claims. No site deployment.

Next: integrate a scaled EX-01 equipment room shell and these colliders/geometry into chunk ownership; bind diffuse/normal through shared material service; generate the six planned architectural textures separately; then official conference/storage/archive/lab references, one finished representative room at a time.
