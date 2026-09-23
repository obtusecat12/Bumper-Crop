# Water V29 — transmission, perspective crossing, visible world splash

## What changed

The previous shader added unweighted specular and a 16% reflection floor. It also applied volume absorption through a global underwater boolean. V29 removes that reflection floor and partitions the optical path into interface-to-bed (surface) and eye-to-first-rendered-surface (fused optics), avoiding repeated extinction.

- Water uses Schlick F0 = .02, perceptual roughness .22 (bounded .15–.25), mip-filtered metre-scale normals and distance/derivative suppression. Both reflected radiance and direct highlight carry Fresnel weighting. The requested four highlight levels remain, with restrained energy.
- The surface samples an immutable opaque scene/depth capture. Refracted depth is reconstructed at the **refracted** coordinate, rejecting foreground/above-water banks. Extinction is `exp(-(.4,.15,.05)*distance)`, plus dark green-cyan inscatter. Texture detail/caustics are never replaced with a solid underwater color.
- Actual game sky is captured into a 64² cubemap, one face per frame during refresh, then cached for .4 seconds. HDR half-float is used when supported. View-dependent screen fog is excluded from the sky capture. The underwater TIR fallback uses screen-space reflected geometry; off-screen rays use a dim retained scene approximation, not a constant blue fill.
- Camera near = .01, DoubleSide, transparent material, polygon offset. The surface manually resolves transmission and shore feathering, hence outputs alpha 1 while preserving interface depth. That interface depth is essential to avoid double absorption in the fused pass.
- Half-water classification derives from inverse-projected near-plane world points. Pitch, roll and FOV are intrinsic. The meniscus is 3% of screen **height**, including under roll, and has a narrow moving refractive/highlight edge. It is evaluated only within .4 m of the surface. The physical near-plane crossing itself is centimeter-scale; it is not stretched into an artificial .8 m-deep lens.
- World impacts create an expanding .2→1.5 m curled crown and 240 billboard water fragments (200 for weak impacts), .3–.6 m quads, for 2 seconds. Silhouettes are elongated torn droplets, not circular bubble rings. GPU ballistic motion and Bayer coverage remain. Crown/drop origins are fixed in world space. Near droplets use a continuous projected-area cap; the old blanket .25 m deletion remains only for fine mist/bubbles, not the requested large splash.
- The optical lens wets on exit, an analytically detected splash contact in the finite front-lens frustum, or ongoing exposed rain. Footstep/wading triggers no longer invent lens impacts. Exit/contact creates broad draining heads/trails, using the existing volume-conserving stick-slip simulation. Its optical envelope is fully retired after 3 seconds; ongoing rain replenishes independently.

## Pipeline and budget

Opaque world + caustics → immutable depth/color copy + water surface → one 480×360 fused extinction/lens/10-position Poisson DOF pass → 960×720 UI/tone resolve → unchanged official ntsc-rs processing → nearest final output. The 4:3 internal image is at most 720 pixels high. No 1080p optical passes were added. The cubemap captures only the sky, never six copies of world geometry per frame. Instance pools, normal fields, matrices and event records are reused.

The ten Poisson positions include separate RGB radii for axial chromatic aberration; they are not ten total texture reads. This change does not establish a 60 FPS guarantee on an unmeasured device.

## Verification and reproducibility

- `node tests/water-v29/run.mjs`: mass/rain/stick-slip, strict body crossing across world rebases, 240 billboard sizes/lifetimes, finite lens cleanup, retained rain, cached cubemap budget, no framebuffer feedback, fixed-world placement, camera motion integration.
- `node tests/water-v29/export-fixtures.mjs`: exports current actual lake geometry, sky shader/noise, GPU splash instance records and physical lens fields to `/tmp/level10-v29`.
- `python tests/water-v28/native/gl_native.py /tmp/level10-v29/shaders.json`: all 11 programs compile/link on GLES 3.2.
- `python tests/water-v29/native/render_views.py`: shallow/downward, grazing, pitched/rolled half-water, underside and time-separated splash views, with no GL errors. Actual lake/sky/water/splash shaders are used; terrain lighting is a diagnostic fixture, and vegetation/UI/NTSC are omitted. These images are **not complete game/browser screenshots**.
- `python tests/water-v29/native/render_optics.py`: actual finite-volume lens fields against an optical calibration grid; background refraction evolves at .04/.2/.5/1.1/1.8/2.5 seconds and is byte-identical to dry at 3.1 seconds. Five-metre extinction/inscatter output agrees with independent expected RGB within one byte.

The native renderer is Mesa llvmpipe software. Full browser FPS and final device appearance are not measured here. The static Site has no compatible supervised browser preview in this environment.

## References inspected

- [Crest underwater / lens meniscus](https://crest.readthedocs.io/en/stable/user/underwater.html)
- [Three.js Camera matrices](https://threejs.org/docs/pages/Camera.html) and [PerspectiveCamera](https://threejs.org/docs/pages/PerspectiveCamera.html)
- [NVIDIA GPU Gems 3: world reconstruction from depth](https://developer.nvidia.com/gpugems/gpugems3/part-iv-image-effects/chapter-27-motion-blur-post-processing-effect)
- [PBRT transmittance](https://pbr-book.org/4ed/Volume_Scattering/Transmittance)
- [Filament Fresnel and roughness](https://google.github.io/filament/main/filament.html)
- [Epic normal-map variance / specular aliasing](https://dev.epicgames.com/documentation/en-us/unreal-engine/composite-texture?application_version=4.27)
- [Tahoe Clarity split-level photographs](https://www.tahoeclarity.com/split), [underwater shallow ripples](https://www.tahoeclarity.com/store/shallow-ripples)
- [Calm water reference](https://unsplash.com/photos/time-lapse-photography-of-water-reaction-kKpTHqM2K-c), [clear lakebed reference](https://unsplash.com/id/foto/air-jernih-memperlihatkan-bebatuan-berwarna-warni-di-dasar-danau-puxKX70fNfY), [splash photograph source page](https://www.catholic365.com/article/15788/helping-others-helps-us-too.html)

Reference photographs were inspected for material/shape direction; they are not redistributed as game assets. Existing detailed PS1-style textures remain unchanged.
