# NPC A elder texture source

The generated face belongs to a peaceful 75–80-year-old man with receding white hair, white eyebrows, fully closed resting eyelids, a broad nose, narrow aged cheeks and a close full white beard and moustache. The standing NPC B is unchanged.

`originals/face-a.png` is the untouched built-in ImageGen output (1254 × 1254). `runtime256/face-a.png` contains the same artwork registered to the mesh's vertical facial landmarks and sampled to 256 × 256 with nearest-neighbor only. There was no recoloring, painted overlay or additional face variant. `register_textures.py` reproduces the mechanical registration.

UV coordinates in `provenance/manifest.json` use a top-left image origin. Both closed eyelid lines are at V=0.39; nose tip V=0.55; mouth V=0.70. Mesh eyelids must stay permanently shut. White chin-beard geometry can sample U=0.23–0.78, V=0.77–0.97.

The user-supplied prompt-writing skill was read before generation and copied to `provenance/gpt_image_2_prompt_skill.md`. Both prompts use its exact starting prefix, labeled fields and 1:1 aspect ratio. The two V68 screenshot references and current B face texture were visually inspected as style/contrast references; they were not edited or recolored to make A. No reference image was passed into the generator.

The face request succeeded on its only call. The first benign body UV atlas request failed at the image service's output moderation stage, with no image returned. The exact prompt and error record are retained in `prompts/body-a.prompt.txt` and `provenance/body-a-generation-error.json`.

The parent agent then authorized one materially safer retry for the necessary body asset: only beige skin-material swatches and gradients, subtle age speckles, and no anatomical drawing. This retry succeeded. Its prompt is `prompts/body-a-safe-retry.prompt.txt`, untouched output is `originals/body-a.png`, and nearest-neighbor 256 × 256 texture is `runtime256/body-a.png`. There is exactly one successful image for each required asset, and no variants. The new low-contrast body material replaces the V68 orange skin and painted six-pack.

The body atlas keeps front `[0,0,128,160]`, back `[128,0,256,160]`, arm `[0,160,64,256]`, leg `[64,160,128,256]`, and neck/hand patch `[128,160,256,256]` in top-left pixel coordinates. Geometry supplies the body form; the material intentionally avoids painted muscles.
