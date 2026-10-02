# V67: continuous cave access and retro bathers

Two detached roof components (82 vertices total) came from isolated solid islands at the cave/tunnel union. The offline mesher now retains the single connected geological shell. The access cut formerly descended to y=-0.12 starting at z=-3.60 while the first step started at z=-3.10. It now retains the tunnel landing and a continuous supporting ramp below the ten actual worn stone treads.

## Verification

- `geometry-check.mjs`: one connected shell, complete out-and-back route, no route obstruction, minimum headroom 2.303 m. Maximum tread/collision mismatch 1.265 mm. Actual visible top landing has no open drop; its worn surface differs from the walking plane by at most 31.8 mm.
- `runtime-check.mjs`: official r180 GLTFLoader imports six SkinnedMeshes across two actors, 20 joints per actor, embedded nearest-filtered diffuse maps, held 20 Hz mixer updates, collision occupancy, support pins and real bowl-rim contact. Palm target/rim discrepancy is 0.483 mm; authored palm surface is within 1.66 mm of that target. Across 112 foot-sole samples, natural terrain discrepancy is at most 17.1 mm.
- Two seconds of render-pass instrumentation found no read/write attachment feedback, no extra main-scene capture, intact render-state restoration, cached mirror captures and culling when the water is out of view. Animation support drift is under 0.000000033 m.
- `npm run check` passed. `tests/spring-v63/entry-return.mjs` passed the shower → Level 27 → same shower → original BigInt street pose flow.
- Production GPU skinning, generated diffuse textures, cave PBR shaders, water refraction and 3D steam shaders compiled and rendered with software Mesa GLES 3.2 without GL errors. Images in `results/` explicitly say **SOFTWARE GLES**. Morph positions were sampled at the current animation time before export; bone deformation ran in the GPU shader.

The live preview browser could not create WebGL 2 (`GL_VENDOR = Disabled`). These checks therefore do **not** establish hardware gameplay FPS, browser presentation fidelity or a guaranteed absence of stutter on the user's device.

## Measured inventory changes

| Production scene inventory | V66 | V67, including NPCs |
|---|---:|---:|
| Unculled per-view draw submissions | 92 | 61 |
| Triangles | 397,280 | 376,344 |
| Physical transmission materials | 5 | 0 |
| Main steam resolution scale | 1/3 | 1/4 |
| Main steam ray steps | 28 | 20 |
| Steam light-field updates/second | 12 | 8 |

This is 33.7% fewer draw submissions and 59.8% less main steam ray-sample budget, not an FPS claim. Four lamps share identical finishes before batching, the bowl's 23 adjacent strips become three material groups, and small frosted lamps no longer cause an implicit full-scene transmission capture. Clear bowl water instead samples the already available opaque colour/depth. Tread sidewall tessellation was reduced while the curved walking edges remain densely sampled.

## Reproduction

```sh
node scripts/build-spring-shell-v57.mjs
node tests/spring-v67/geometry-check.mjs
node tests/spring-v67/runtime-check.mjs
VIEW=spring-npc-seated,spring-npc-standing,spring-stair-join,spring-roof-join node tests/spring-v67/native-scene.mjs /tmp/spring-v67
node tests/spring-v67/export-volume.mjs /tmp/spring-v67/spring-npc-seated
QA_VERSION=V67 python tests/spring-v67/render-volume.py /tmp/spring-v67/spring-npc-seated
```

Asset source, all five independent generated originals, exact prompts, mechanical UV packing, runtime PNGs, mesh builder, model sheets and imported animation checks are retained in `art-source/npc-v67`. No third-party character mesh or texture was copied.

## Research used

- [Three.js GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html): official loader, embedded images and `KHR_materials_unlit`.
- [Three.js AnimationMixer](https://threejs.org/docs/pages/AnimationMixer.html): per-character mixers and sampled absolute animation time.
- [Three.js Texture](https://threejs.org/docs/pages/Texture.html): nearest minification/magnification and colour-space handling.
- [Khronos glTF 2.0](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html): skin bind matrices, normalized weights, STEP tracks and morph targets.
- [Naughty Dog / making Crash Bandicoot](https://www.naughtydog.com/blog/making_crash_bandicoot_by_andy_gavin_and_jason_rubin) and [Andy Gavin's development history](https://all-things-andy-gavin.com/tag/pt_crash_history/?order=ASC): original developers' accounts, used as historical visual/production context.

The chosen treatment is faceted organic anatomy with painted diffuse anatomy and five inexpensive half-Lambert light bands. Optional vertex jitter was omitted to keep distant silhouettes calm and prevent additional apparent water-edge aliasing.
