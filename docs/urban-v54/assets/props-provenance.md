# Urban prop texture provenance

Three distinct assets generated with the built-in ImageGen tool, with transparent_background=false and no reference image; each is a separate PNG, not an atlas.

- prop-terracotta-diffuse.png — warm reddish tan terracotta ceramic, subtle vertical variation and pores.
- prop-benchwood-diffuse.png — weathered gray olive paint over horizontal wood grain, no plank gaps.
- prop-municipalmetal-diffuse.png — dark muted olive green municipal metal with small dispersed chips and casting texture.

The user-supplied prompt skill was freshly downloaded and fully read before every individual generation from https://raw.githubusercontent.com/UzenUPozitiv4ik/gpt-image-2-skill/main/gpt_image_2_prompt_skill.md. Copies are prop-01-prompt-skill.md, prop-02-prompt-skill.md, and prop-03-prompt-skill.md.

Exact prompts are in prop-01-terracotta-prompt.txt, prop-02-benchwood-prompt.txt, and prop-03-municipalmetal-prompt.txt. Every prompt has the requested exact prefix, grouped fields, and aspect ratio 1:1.

All three outputs were visually inspected at generation. They are flat square surface textures with no scene, object silhouette, atlas, lettering, or frame. Illumination is visually even overall. Each surface has fine photographic material detail; PS2-scale softness can be achieved in the runtime texture sampling. Seamless tiling is requested but exact edge continuity is not mathematically guaranteed by generation.
