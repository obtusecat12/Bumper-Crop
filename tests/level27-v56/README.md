# Level 27 / V56 verification

The street bath fills the existing gap at clinic-frame (91.4, 40), opposite the palm plaza. Existing landmark and transition geometry is unchanged. All dimensions are metres.

Entry: F2 → Level 27 入口 · 热水浴室 → walk into the shower → E for warm, E for the hottest preset, E under the shower to close eyes for 2.15 seconds. Stepping away cancels closing. E outside the tray can switch a hot shower off. In the pool, E sits / stands and Q drinks mineral water. Follow the dry bank back through the tunnel to restore the exact original city pose and inventory.

The four independently image-generated materials and exact prompts are in assets/level27-originals. Runtime versions are 512 px WebP textures totalling about 304 KB. The main cave boundary is 18.58 m². Two wall-fed falls supply the pool; a 22 cm drainage slot is impassable. No plants or entities are present. Lore attribution is in the in-game journal.

Automated checks:
- interaction-and-geometry.mjs: 1,625 bidirectional walking samples, 13 actual stair tread raycasts, 106 sidewalk-to-shower clearance and floor samples; heat and closed-eye prerequisites; production enter/leave controller preserves exact BigInt coordinates and view.
- transition-ownership-regression.mjs: 204 rural path samples, 42 soil-shoulder samples and 325 pavement-exclusion samples remain clear of urban ground.
- lifecycle-regression.mjs: Level 10 → Level 11 → Level 10 resource lifecycle, 481 route samples, deferred terrain disposal.
- teleport-regression.mjs: all seven authored city / photo / bath destinations.
- Local module URL audit and JavaScript syntax checks.

Visual verification uses the actual exported Three.js geometry, materials and shaders in a software OpenGL ES 3.2 harness, including point-light shadow cubemaps, planar water reflection, depth refraction and HDR resolve. Captures are explicitly labelled software GLES diagnostics. They are not browser or production screenshots. Native captures omit the game UI, VHS post-process and point-sprite droplets. Point shadows use an equivalent radial-depth cubemap rather than Three.js's packed shadow atlas. Browser QA was unavailable because this static project has no compatible managed development server and the mandated browser-control skill was unavailable.

Cave mesh: about 72,000 triangles and 14 exported mesh draws, plus droplets. Static shadow maps refresh on entry; camera-dependent reflection/refraction refresh for each rendered frame. Lighting follows the user's supplied limestone cave photograph, with localized warm light, a restrained cool upper fill and enclosed shadows. This is an original navigable PS2-style reconstruction, not a claim of pixel-identical photography.
