# V68 — rebuilt retro bathers

The rejected long necks, shallow torsos and hovering arm poses were rebuilt from anatomical cross sections and connected shoulder branches. The supplied references guided head/body scale, substantial arm volumes, coarse facial shading and faceted silhouettes; their clothing was not copied. The seated adult remains peacefully closed-eyed with both palms supported on the towel. The standing adult rests one hand on the existing carved bowl.

Four new image-generated originals supply two distinct faces, a shared body atlas and ivory terry cloth. All six embedded actor textures are 256×256, nearest filtered and unlit with the existing inexpensive half-Lambert treatment. Generated originals, exact prompts, UV registration, builder and reference images are in `art-source/npc-v68`.

## Verified

- Actual production GLTFLoader and AnimationMixer load six SkinnedMeshes, 20 joints per actor and held 20 Hz animation. The main renderer is not frame capped. Seated eye morphs never reopen the painted closed eyes.
- Both seated palm contact points raycast onto the actual towel surface, within 0.000000007 m. The standing palm agrees with the existing bowl rim to 0.483 mm; animated support drift is below 0.000000004 m. Flat soles differ from the rough geological walking surface by at most 16.83 mm.
- A has 2,162 triangles and B has 2,002. Complete unculled spring submissions remain 61; scene geometry changes from 376,344 to 377,192 triangles (+848). This is an inventory comparison, not measured FPS.
- Existing water-area, reflection-cache, depth-capture and render-feedback checks pass. The full shower → spring → same shower → exact BigInt street-pose return test passes.
- Production skinning, water and steam shaders compiled in Mesa GLES 3.2. Final seated and standing scene renders report zero GL errors. Source syntax and whitespace checks pass.

The cloud preview still cannot create WebGL 2 (`GL_VENDOR = Disabled`). Saved images are explicitly labeled **SOFTWARE GLES**; they are not browser screenshots or hardware gameplay benchmarks. No real-device frame-rate claim is made.

## Reproduce

```sh
node tests/spring-v68/runtime-check.mjs
node tests/spring-v63/entry-return.mjs
VIEW=spring-npc-seated,spring-npc-standing node tests/spring-v68/native-scene.mjs /tmp/spring-v68
node tests/spring-v68/export-volume.mjs /tmp/spring-v68/spring-npc-seated
QA_VERSION=V68 python tests/spring-v68/render-volume.py /tmp/spring-v68/spring-npc-seated
```

Repeat the last two commands with `spring-npc-standing` for the second view. The original cave shell, water artwork, waterfalls, bathhouse and spa architecture are unchanged.
