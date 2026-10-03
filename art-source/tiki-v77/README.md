# Lantern Reef V77 asset provenance

36 selected image-generation requests, in six asset-only groups, were based on the five user-uploaded references. Two image-layout/color refinements and one blocked-attempt record are retained with their group. Every selected generation, original output, exact prompt, crop rectangle and intended UV placement is recorded in the group manifests. No external image was substituted for a requested generated texture.

The root agent alone authored the scene code. Material channels are generated artistic approximations, not measured scans. Runtime assets are mechanically cropped/resized and base-color images encoded as WebP quality 93; scalar/vector maps remain PNG. The 80 runtime assets total approximately 28 MB. This count includes channels and atlases, not 80 independent image-generation requests. Full sources and individual crops remain here.

Material treatment: photographic PS2-style diffuse; generated tangent normals, roughness/AO where supplied; geometric cup lips, hollows, front relief, mouth opening, canoe hull, joints and physical supporting parts. Fine flowers, foliage, print, bottle labels, and toy paint remain generated texture detail.

References supplied by user: image(20261003-104506).png, image(20261003-104640).png, image(20261003-104716).png, image(20261003-104821).png, image(20261003-104910).png. User-requested prompting guidance is retained in prompt-skill.md.

Technical primary sources consulted:
- https://threejs.org/docs/pages/SpotLight.html
- https://threejs.org/docs/pages/MeshPhysicalMaterial.html
- https://threejs.org/docs/pages/UnrealBloomPass.html
- https://threejs.org/docs/pages/SSAOPass.html

Official r180 UnrealBloomPass is vendored with unchanged algorithm and local import paths; license/provenance is in dist/licenses. SSAO and volume integration reuse existing scene depth at half resolution. Glass and water share the existing game's screen-color/depth refraction pass; they are optical approximations and are not a multi-bounce ray tracer.
