import * as T from './vendor/three.module.min.js';

// One generated, periodic 3D texture, genuine bounded volume integration, and
// material fog. There is no screen-space noise, flat cloud layer or fog plane.
const PERIOD = 65536;
const QUALITY_STEPS = {low: 16, balanced: 32, high: 48};
const clamp01 = x => Math.min(1, Math.max(0, Number(x) || 0));
function worldOrigin(value) {
  // BigInt values are 64 m world-cell indices; numbers are offsets in metres.
  if (typeof value === 'bigint') return Number((value % 1024n + 1024n) % 1024n) * 64;
  return ((Number(value) || 0) % PERIOD + PERIOD) % PERIOD;
}
function hash3(x, y, z, seed = 0) {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 2147483647) ^ seed;
  h = Math.imul(h ^ h >>> 13, 1274126177);
  return ((h ^ h >>> 16) >>> 0) / 4294967295;
}
const smooth = x => x * x * (3 - 2 * x);
const mix = (a, b, t) => a + (b - a) * t;
function makeLattice(n, seed) {
  const values = new Float32Array(n * n * n);
  for (let z = 0; z < n; z++) for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    values[(z * n + y) * n + x] = hash3(x, y, z, seed);
  }
  return {n, values};
}
function latticeNoise(lattice, x, y, z) {
  const {n, values: a} = lattice;
  x *= n; y *= n; z *= n;
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  const fx = smooth(x - ix), fy = smooth(y - iy), fz = smooth(z - iz);
  const x0 = ix % n, x1 = (ix + 1) % n;
  const y0 = iy % n, y1 = (iy + 1) % n;
  const z0 = iz % n, z1 = (iz + 1) % n;
  const k00 = (z0 * n + y0) * n, k10 = (z0 * n + y1) * n;
  const k01 = (z1 * n + y0) * n, k11 = (z1 * n + y1) * n;
  return mix(mix(mix(a[k00 + x0], a[k00 + x1], fx), mix(a[k10 + x0], a[k10 + x1], fx), fy),
    mix(mix(a[k01 + x0], a[k01 + x1], fx), mix(a[k11 + x0], a[k11 + x1], fx), fy), fz);
}
function makeCellPoints(n) {
  const a = new Float32Array(n * n * n * 3);
  for (let z=0; z<n; z++) for (let y=0; y<n; y++) for (let x=0; x<n; x++) {
    const i=((z*n+y)*n+x)*3;
    a[i]=.15+.70*hash3(x,y,z,9281);a[i+1]=.15+.70*hash3(x,y,z,3197);a[i+2]=.15+.70*hash3(x,y,z,7143);
  }
  return {n,a};
}
function cellularNoise(points,x,y,z) {
  const {n,a}=points; x*=n;y*=n;z*=n;
  const ix=Math.floor(x),iy=Math.floor(y),iz=Math.floor(z),fx=x-ix,fy=y-iy,fz=z-iz;
  let nearest=3;
  for (let dz=-1;dz<=1;dz++) for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++) {
    const i=((((iz+dz+n)%n)*n+(iy+dy+n)%n)*n+(ix+dx+n)%n)*3;
    const px=dx+a[i]-fx,py=dy+a[i+1]-fy,pz=dz+a[i+2]-fz;
    nearest=Math.min(nearest,px*px+py*py+pz*pz);
  }
  return 1-Math.min(1,Math.sqrt(nearest)*.85);
}
function makeCloudNoise(size = 64) {
  const coarse = makeLattice(4, 912), fine = makeLattice(8, 1921), erosion = makeLattice(16, 8173);
  const data = new Uint8Array(size * size * size * 4);
  const cells = makeCellPoints(8);
  for (let z = 0; z < size; z++) for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const u = (x + .5) / size, v = (y + .5) / size, w = (z + .5) / size;
    const a = latticeNoise(coarse, u, v, w), b = latticeNoise(fine, u, v, w), c = latticeNoise(erosion, u, v, w);
    const i = ((z * size + y) * size + x) * 4;
    data[i] = Math.round(255 * (.72 * a + .21 * b + .07 * c));
    data[i + 1] = Math.round(255 * b);
    data[i + 2] = Math.round(255 * c);
    data[i + 3] = Math.round(255 * cellularNoise(cells, u, v, w));
  }
  const texture = new T.Data3DTexture(data, size, size, size);
  texture.name = 'procedural-cloud-volume-64';
  texture.format = T.RGBAFormat;
  texture.type = T.UnsignedByteType;
  texture.wrapS = texture.wrapT = texture.wrapR = T.RepeatWrapping;
  texture.minFilter = T.LinearMipmapLinearFilter;
  texture.magFilter = T.LinearFilter;
  texture.unpackAlignment = 1;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

const cloudVertex = `
varying vec3 vCloudDirection;
void main() {
  vCloudDirection = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const cloudFragment = `
precision highp sampler3D;
varying vec3 vCloudDirection;
uniform sampler3D uCloudNoise;
uniform vec3 uCloudCamera;
uniform vec2 uCloudOrigin;
uniform vec3 uCloudFogColor;
uniform float uCloudTime;
uniform float uCloudMist;
uniform float uCloudRain;
uniform int uCloudSteps;

// Integer-period spatial scales make the BigInt world-origin wrap invisible.
// The sheared 3D field advects in world space, independently of camera motion.
float cloudDensity(vec3 p, float footprint) {
  float h = (p.y - 92.0) / 124.0;
  if (h <= 0.0 || h >= 1.0) return 0.0;
  vec3 drift = vec3(uCloudTime * 1.65, 0.0, uCloudTime * .53);
  vec3 q = p + drift;
  q.x += (p.y - 92.0) * .30;
  // Mip-filter the density to the integration footprint. This prevents
  // distant thin layers from aliasing into stripes when steps become long.
  vec4 shape = textureLod(uCloudNoise, q / 512.0, max(0.0, log2(footprint / 8.0)));
  vec4 detail = textureLod(uCloudNoise, q / 128.0 + vec3(.17, .31, .11), max(0.0, log2(footprint / 2.0)));
  // A scalloped base and feathered upper boundary produce an actual slab.
  float base = .018 + .28 * (1.0-shape.a) + .06 * (1.0-detail.a);
  // Widen the altitude kernel with the ray footprint as well as mipmapping
  // its 3D noise. Distant sub-step slices must not form parallel terraces.
  float feather = .10 + min(.10, footprint * .0014);
  float profile = smoothstep(base - feather * .22, base + feather, h) * (1.0 - smoothstep(.70, 1.0, h));
  float billows = shape.r * .58 + shape.a * .42;
  float erosion = (1.0 - detail.a) * .17 + (1.0 - detail.b) * .075;
  float coverage = .285 - uCloudRain * .025;
  float body = max(0.0, billows - coverage - erosion * (1.0 - h * .45));
  // Tiny density at wispy edges, substantial optical depth inside each body.
  return body * profile * (1.18 + uCloudRain * .28);
}

void main() {
  vec3 rd = normalize(vCloudDirection);
  vec3 ro = uCloudCamera + vec3(uCloudOrigin.x, 0.0, uCloudOrigin.y);
  float elevation = max(rd.y, 0.0);
  vec3 upperSky = vec3(.445, .473, .484) - uCloudRain * .055;
  vec3 skyColor = mix(uCloudFogColor, upperSky, smoothstep(.01, .62, elevation));
  if (rd.y > .025) {
    float entry = max(0.0, (92.0 - ro.y) / rd.y);
    float finish = min(2600.0, (216.0 - ro.y) / rd.y);
    if (finish > entry) {
      float rayLength = finish - entry;
      // A coherent phase from the same WORLD-space field breaks up repeated
      // altitude samples. This adds no screen-space grain or temporal jitter.
      float phase = .25 + .5 * textureLod(uCloudNoise, (ro + rd * entry) / 128.0, 0.0).b;
      vec3 rayLight = vec3(0.0);
      float transmittance = 1.0;
      vec3 lightDirection = normalize(vec3(-.45, .84, -.30));
      for (int i = 0; i < 48; i++) {
        if (i >= uCloudSteps || transmittance < .004) break;
        float a = float(i) / float(uCloudSteps);
        float b = float(i + 1) / float(uCloudSteps);
        // More samples resolve the lower cloud surface visible from the field.
        float start = rayLength * pow(a, 1.55);
        float stepSize = rayLength * pow(b, 1.55) - start;
        float t = entry + start + phase * stepSize;
        vec3 p = ro + rd * t;
        float density = cloudDensity(p, max(1.0, stepSize * .65));
        if (density > .001) {
          float h = clamp((p.y - 92.0) / 124.0, 0.0, 1.0);
          // Low uses an analytic overhead extinction estimate; other tiers
          // take one forward density sample, never a nested light raymarch.
          float towardLight = uCloudSteps <= 16 ? density * (1.12 - h * .6) : cloudDensity(p + lightDirection * 18.0, max(1.0, stepSize * .80));
          float lightVisibility = exp(-towardLight * 16.0);
          float gradientLight = clamp((density - towardLight) * 2.2, -.14, .20);
          float diffuse = clamp(.14 + .26 * h + .64 * lightVisibility + gradientLight, 0.0, 1.0);
          float innerScatter = (1.0 - exp(-density * 12.0)) * .05;
          vec3 illumination = mix(vec3(.11, .139, .155), vec3(.57, .592, .596), diffuse + innerScatter);
          illumination *= 1.0 - uCloudRain * .12;
          float sampleOpacity = 1.0 - exp(-density * stepSize * .22);
          rayLight += transmittance * sampleOpacity * illumination;
          transmittance *= 1.0 - sampleOpacity;
        }
      }
      vec3 clouds = rayLight + transmittance * skyColor;
      // Atmospheric perspective erases the volume's finite range below the
      // visible horizon; the lower sky exactly meets Three's scene-fog color.
      float cloudVisibility = smoothstep(.025, .115, rd.y) * exp(-entry * (.00040 + uCloudMist * .00045));
      skyColor = mix(skyColor, clouds, cloudVisibility);
    }
  }
  gl_FragColor = vec4(skyColor, 1.0);
  #include <colorspace_fragment>
}`;

const fogVertexPars = `
#include <fog_pars_vertex>
#ifdef USE_FOG
  varying vec3 vLayerFogWorld;
  uniform mat4 uLayerFogCameraWorld;
#endif`;
const fogVertex = `
#include <fog_vertex>
#ifdef USE_FOG
  // mvPosition already includes skinning/batching/instancing and deformation.
  vLayerFogWorld = (uLayerFogCameraWorld * mvPosition).xyz;
#endif`;
const fogFragmentPars = `
#include <fog_pars_fragment>
#ifdef USE_FOG
  varying vec3 vLayerFogWorld;
  uniform vec2 uLayerFogOrigin;
  uniform float uLayerFogTime;
  uniform float uLayerFogMist;
  uniform float uLayerFogRain;
  float layerFogHash(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * .1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }
  float layerFogNoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    // 256-cell wrapping gives continuous 65536 m origin rebasing.
    return mix(mix(layerFogHash(mod(i, 256.0)), layerFogHash(mod(i + vec2(1.0, 0.0), 256.0)), f.x),
      mix(layerFogHash(mod(i + vec2(0.0, 1.0), 256.0)), layerFogHash(mod(i + 1.0, 256.0)), f.x), f.y);
  }
#endif`;
const fogFragment = `
#ifdef USE_FOG
  float fogDistance = length(vLayerFogWorld - cameraPosition);
  #ifdef FOG_EXP2
    float baseFog = 1.0 - exp(-fogDensity * fogDensity * fogDistance * fogDistance);
  #else
    // Never weaken Three's original concealment: fully opaque at fogFar.
    float baseFog = smoothstep(fogNear, fogFar, fogDistance);
  #endif
  vec3 fogMidpoint = mix(cameraPosition, vLayerFogWorld, .58);
  vec2 fogMap = (fogMidpoint.xz + uLayerFogOrigin + vec2(uLayerFogTime * .30, uLayerFogTime * .11)) / 256.0;
  float patchA = layerFogNoise(fogMap);
  float patchB = layerFogNoise(fogMap * 2.0 + vec2(43.2, 7.7));
  // Three overlapping media: thin field air, low drifting banks, raised haze.
  float lowColumn = exp(-max(0.0, fogMidpoint.y - .4) * .37);
  float raisedColumn = exp(-abs(fogMidpoint.y - 4.2) * .13);
  float lowOptical = max(0.0, fogDistance - 25.0) * .0021 * lowColumn * (.30 + patchA * 1.8);
  float farOptical = max(0.0, fogDistance - 72.0) * .0036 * raisedColumn * (.22 + patchB * 1.2);
  float opticalDepth = (lowOptical + farOptical) * (1.0 + uLayerFogMist * 3.6 + uLayerFogRain * .5);
  float layerFog = 1.0 - exp(-opticalDepth);
  // A subtle cooler bank color returns exactly to fogColor at the cutoff.
  vec3 layerColor = fogColor * vec3(.967, .992, 1.018);
  gl_FragColor.rgb = mix(gl_FragColor.rgb, layerColor, layerFog * (1.0 - baseFog));
  gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, baseFog);
#endif`;

/** Install once, then call attach(newChunk.group) before rendering new chunks.
 * Existing onBeforeCompile and program cache keys are preserved. Supports
 * standard/basic/line materials and custom shaders using Three's fog chunks.
 * No global ShaderChunk mutation and no per-frame scene traversal.
 */
export function installLayeredFog({scene} = {}) {
  const uniforms = {
    uLayerFogCameraWorld: {value: new T.Matrix4()},
    uLayerFogOrigin: {value: new T.Vector2()},
    uLayerFogTime: {value: 0},
    uLayerFogMist: {value: 0},
    uLayerFogRain: {value: 0}
  };
  const records = new WeakMap();
  function attachMaterial(material) {
    if (!material || material.fog === false || records.has(material)) return;
    const previous = material.onBeforeCompile;
    const previousKey = material.customProgramCacheKey;
    const compile = function(shader, renderer) {
      previous.call(this, shader, renderer);
      if (!shader.vertexShader.includes('#include <fog_vertex>') || !shader.fragmentShader.includes('#include <fog_fragment>')) return;
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = shader.vertexShader.replace('#include <fog_pars_vertex>', fogVertexPars).replace('#include <fog_vertex>', fogVertex);
      shader.fragmentShader = shader.fragmentShader.replace('#include <fog_pars_fragment>', fogFragmentPars).replace('#include <fog_fragment>', fogFragment);
    };
    // Capture the old key with the old compile callback still installed. Some
    // stock/custom keys derive themselves from onBeforeCompile.toString().
    const key = previousKey.call(material);
    material.onBeforeCompile = compile;
    material.customProgramCacheKey = function() {return key + '|layered-world-fog-v5';};
    records.set(material, {previous, previousKey, compile});
    material.needsUpdate = true;
  }
  function attach(root) {
    if (!root) return;
    if (root.isMaterial) {attachMaterial(root); return;}
    root.traverse(object => {
      if (Array.isArray(object.material)) object.material.forEach(attachMaterial);
      else attachMaterial(object.material);
    });
  }
  function update({time = 0, camera, originX = 0, originZ = 0, mist = 0, rain = 0} = {}) {
    uniforms.uLayerFogTime.value = Number(time) || 0;
    uniforms.uLayerFogOrigin.value.set(worldOrigin(originX), worldOrigin(originZ));
    uniforms.uLayerFogMist.value = clamp01(mist);
    uniforms.uLayerFogRain.value = clamp01(rain);
    if (camera) uniforms.uLayerFogCameraWorld.value = camera.matrixWorld;
  }
  function detach(root) {
    root?.traverse(object => {
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        const record = material && records.get(material);
        if (record && material.onBeforeCompile === record.compile) {
          material.onBeforeCompile = record.previous;
          material.customProgramCacheKey = record.previousKey;
          material.needsUpdate = true;
          records.delete(material);
        }
      }
    });
  }
  attach(scene);
  return {uniforms, attach, update, detach, dispose() {detach(scene);}};
}

/**
 * createAtmosphere({scene, quality}) -> {sky, update, attachFog, dispose}
 * update({time,quality,camera,originX:state.cx,originZ:state.cz,mist,rain})
 * Quality: low=16 / balanced=32 / high=48 bounded samples, early termination.
 * Call attachFog(group) once for each completed streaming chunk/detail layer.
 * The original scene.fog near/far/color remain controlled by weather().
 */
export function createAtmosphere({scene, fog = scene?.fog, quality = 'balanced'} = {}) {
  const texture = makeCloudNoise();
  const fogController = installLayeredFog({scene});
  const uniforms = {
    uCloudNoise: {value: texture},
    uCloudCamera: {value: new T.Vector3()},
    uCloudOrigin: {value: new T.Vector2()},
    uCloudFogColor: {value: fog?.color?.clone() || new T.Color('#acb6b1')},
    uCloudTime: {value: 0},
    uCloudMist: {value: 0},
    uCloudRain: {value: 0},
    uCloudSteps: {value: QUALITY_STEPS[quality] || QUALITY_STEPS.balanced}
  };
  // Three r180 converts ShaderMaterial to GLSL ES 3 automatically. Keeping its
  // normal prefix preserves gl_FragColor and output color-space handling.
  const material = new T.ShaderMaterial({
    name: 'bounded-overcast-volume',
    side: T.BackSide, depthWrite: false, depthTest: true, fog: false,
    toneMapped: false, uniforms, vertexShader: cloudVertex, fragmentShader: cloudFragment
  });
  const sky = new T.Mesh(new T.SphereGeometry(420, 24, 16), material);
  sky.name = 'moving-volumetric-overcast';
  // Draw after opaque scenery so the depth buffer rejects hidden sky pixels.
  sky.renderOrder = 1000;
  sky.frustumCulled = false;
  function update(options = {}) {
    const {time = 0, quality: q, camera, originX = 0, originZ = 0, mist = 0, rain = 0} = options;
    uniforms.uCloudTime.value = Number(time) || 0;
    uniforms.uCloudMist.value = clamp01(mist);
    uniforms.uCloudRain.value = clamp01(rain);
    uniforms.uCloudOrigin.value.set(worldOrigin(originX), worldOrigin(originZ));
    if (q) uniforms.uCloudSteps.value = QUALITY_STEPS[q] || QUALITY_STEPS.balanced;
    if (camera) {sky.position.copy(camera.position); uniforms.uCloudCamera.value.copy(camera.position);}
    const currentFog = scene?.fog || fog;
    if (currentFog?.color) uniforms.uCloudFogColor.value.copy(currentFog.color);
    fogController.update(options);
  }
  return {
    sky, update, attachFog: fogController.attach, fog: fogController,
    dispose() {fogController.dispose(); sky.geometry.dispose(); material.dispose(); texture.dispose();}
  };
}
