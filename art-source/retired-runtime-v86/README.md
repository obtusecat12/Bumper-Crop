# Retired runtime copies

These exact historical files were moved out of `dist` to keep the merged Site below its 256 MiB expanded archive limit. They are preserved byte-for-byte, with SHA-256 entries in manifest.json; no current scene model or image was removed or recompressed.

- V85 rainforest panels and banana/cordyline/philodendron cutouts were replaced by the new V86 painted murals and generated foliage. V86 continues to load the retained V85 stone base/normal/roughness/AO and croton/pineapple cutouts. The old unused stone height map is archived too.
- V67/V68 spring NPC GLBs were already superseded by V69. Both main.js and level27-scene.js load level27-npcs-v69.js, which uses the retained models/spring-v69 files. The active V68 layout/occupancy definitions remain unchanged.

`scripts/archive-retired-assets-v86.py` records the explicit list and is idempotent. Historical previews of those retired versions can restore their listed assets locally from here. Current scene previews require no restoration.
