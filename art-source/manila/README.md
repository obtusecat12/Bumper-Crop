# Manila Room reconstruction

The two 640×480 user reference renders show the same square room, photographed from its east doorway and from inside looking south. `dist/manila-plan.js` owns the room, doors, props and two F2 camera poses. The published room has an 8×8 m clear interior, thick envelope, four offset doors and a fixed surrounding yellow corridor. Unseen faces, exact wall thickness and furniture sections are inferred, not measured.

Sources: https://backrooms-wiki-cn.wikidot.com/manila-room and https://backrooms-wiki.wikidot.com/manila-room . Text by BrMiller/neptunium153, CC BY-SA 3.0. User reference renders by PixelPurple, CC BY-SA 3.0. Diagram by BrMiller based on RobertGoerman, CC BY 3.0. Relevant rendered adaptations retain CC BY-SA 3.0. No Level 1 transition or historical story NPC is asserted as implemented.

`surfaces/` and `fittings/` preserve seven original generated PNGs and exact prompts; the first wallpaper candidate is archived, not used. Runtime encoding and approximate micro-normal/roughness derivation is in `scripts/pack-manila.py`. Generated maps are estimated material detail, not measured PBR scans. Original files remain unchanged.

The wallpaper macro-pattern directly samples the unchanged interior-reference.jpeg (runtime wallpaper-photo-source.jpg). Wall shaders repeat the 53×53 source-pixel region bounded by x=250..303, y=80..133. UV derivatives avoid mip bleed. A quadratic exposure correction removes photographed lighting variation across the patch; generated wallpaper normal/roughness supplies paper detail. This does not recover missing high-resolution pattern detail from the small source patch.

Four real ceiling apertures hold unshadowed emitters. Four cached spot shadows and the existing key use PCF Soft Shadow Map. Static subassemblies merge by finish; doors rotate around connected physical hinges. The shared plan drives collision and map. Two camera poses use native 4:3 framing, and walking/looking returns to the player's normal camera preferences. Level 0's original almond-water system remains, with no incidental supplies generated inside this reference room.

Quality limits: real browser screenshots do not establish pixel identity or award-level quality. Furniture silhouettes, hidden construction, indirect light and grain still differ. Pixel comparison is raw absolute RGB error, not a similarity percentage. QA is limited to requested local screenshots and the necessary F2/map/door/origin entry checks. No unrelated levels were retested.
