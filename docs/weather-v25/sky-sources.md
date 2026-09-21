# Sky asset sources and decisions

The requested prompt guide was downloaded and read before generation:
https://github.com/UzenUPozitiv4ik/gpt-image-2-skill/blob/main/gpt_image_2_prompt_skill.md
Local copy: gpt_image_2_prompt_skill.md

Built-in imagegen skill was read. The prompt uses the guide's exact opening phrase and structured fields without unrelated photographic embellishments. One built-in image generation call is authorized; no variants or retries.

Actual game references downloaded from the publishers' public Steam store screenshot lists and visually inspected:

- Half-Life (1998), Steam app 70, screenshot 1: https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/70/0000002343.1920x1080.jpg?t=1745368462
  Local file: ref-70-1.jpg. Main reference: soft photographic white cloud streaks against blue sky, continuous low-resolution imagery, no pixel-art blocks.
- Grand Theft Auto III (2001), Steam app 12100, screenshot 3: https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/12100/0000003294.1920x1080.jpg?t=1634144440
  Local file: ref-12100-3.jpg. Secondary reference: restrained blue field and diffuse white cloud bank with soft old-game sampling.
- Quake III Arena (1999), Steam app 2200, screenshots 0–4, inspected in reference-contact-sheet.jpg. Useful as era context; its brown/red sky palettes are not copied.

Source metadata is saved in steam-70-source.json, steam-12100-source.json, and steam-2200-source.json. Other downloaded screenshots were viewed in reference-contact-sheet.jpg. Only sky texture qualities are referenced. No screenshot or proprietary texture is incorporated into the generated asset.

Image search returned persistent 429 rate limits; generic text search returned unrelated results. Public Valve Developer Wiki was protected by a bot challenge; no challenge was bypassed. Public Steam store metadata and image files supplied the inspectable original-game references instead.

The requested deliverable is a square sky-only tile, not a full game scene. It will deliberately repeat across the scene. Runtime resizing can be performed by the integrating agent, retaining the generated original.
