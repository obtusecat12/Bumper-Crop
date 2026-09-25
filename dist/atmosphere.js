import {weatherTextures} from './weather-textures.js?v=39';
import {createFogVolume,fogVolumePars} from './fog-volume.js?v=39';
import * as T from './vendor/three.module.min.js';

// One generated, periodic 3D texture, genuine bounded volume integration, and
// material fog. There is no screen-space noise, flat cloud layer or fog plane.
const PERIOD = 65536;
const QUALITY_STEPS = {low: 16, balanced: 32, high: 48};
const MARCH_STEPS=Object.fromEntries(Object.values(QUALITY_STEPS).map(count=>[count,Array.from({length:48},(_,i)=>{
  const a=(Math.min(i,count)/count)**1.55,b=(Math.min(i+1,count)/count)**1.55;
  return new T.Vector2(a,b-a);
})]));
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
  gl_Position.z=gl_Position.w*.999999;
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
uniform vec4 uSkyEvent;
uniform sampler2D uSkyWallpaper;
uniform vec2 uCloudMarch[48];
uniform vec3 uStageEvent;
${fogVolumePars}

// Integer-period spatial scales keep the BigInt origin wrap invisible.
// Two 3D fetches, as before: a rounded low deck and a faster upper field.
// Their relative advection and RGBA warp deform the volume continuously.
float cloudDensity(vec3 p, float footprint) {
  float h = (p.y - 92.0) / 124.0;
  if (h <= 0.0 || h >= 1.0) return 0.0;
  vec3 lower = p + vec3(uCloudTime * 1.35, uCloudTime * .065, uCloudTime * .46);
  lower.x += (p.y - 92.0) * .18;
  vec4 shape = textureLod(uCloudNoise, lower / 512.0, max(0.0, log2(footprint / 8.0)));
  // The upper layer slips across the lower billows. Slow vertical evolution
  // and the local warp prevent either erosion or highlights moving as a card.
  vec3 upper = p + vec3(uCloudTime * 2.75, -uCloudTime * .095, -uCloudTime * .38);
  upper.x += (p.y - 92.0) * .65;
  upper += (shape.gbr - .5) * vec3(20.0, 11.0, 20.0);
  vec4 detail = textureLod(uCloudNoise, upper / vec3(512.0, 128.0, 256.0) + vec3(.17, .31, .11), max(0.0, log2(footprint / 2.0)));
  // Broad cellular lobes carry the lower surface; independent detail is a
  // restrained edge erosion, preserving soft, rounded marshmallow volumes.
  float feather = .14 + min(.18, footprint * .003);
  float roundness = smoothstep(.12, .85, shape.a);
  float base = .025 + .31 * (1.0 - roundness) + .035 * (1.0 - shape.r);
  float lowProfile = smoothstep(base - feather * .5, base + feather, h)
    * (1.0 - smoothstep(.54, .83, h));
  float billows = shape.r * .40 + shape.a * .60;
  float erosion = (1.0 - detail.a) * .090 + (1.0 - detail.b) * .045;
  float lowerBody = max(0.0, billows - (.30 - uCloudRain * .025) - erosion);
  // A high, smoother overcast lid remains behind the lower rounded masses.
  // Separate density/altitude kernels make the two wind speeds perceptible.
  float highBase = .36 + .18 * (1.0 - detail.r);
  float highProfile = smoothstep(highBase - feather * .2, highBase + feather, h)
    * (1.0 - smoothstep(.78, 1.0, h));
  float upperBody = .06 + .23 * smoothstep(.23, .72, detail.r * .7 + detail.a * .3);
  return (lowerBody * lowProfile * 1.30 + upperBody * highProfile) * (1.0 + uCloudRain * .24);
}

void main() {
  vec3 rd = normalize(vCloudDirection);
  vec3 ro = uCloudCamera + vec3(uCloudOrigin.x, 0.0, uCloudOrigin.y);
  float elevation = max(rd.y, 0.0);
  vec3 upperSky = vec3(.445, .473, .484) - uCloudRain * .055;
  vec3 skyColor = mix(uCloudFogColor, upperSky, smoothstep(.01, .62, elevation));
  if (rd.y > .025 && uSkyEvent.x<.995 && uSkyEvent.y<.995 && uSkyEvent.z<.995 && uCloudMist<.88) {
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
        // Identical altitude distribution, computed once for each quality tier.
        // Avoid two repeated pow() operations in every cloud integration step.
        float start = rayLength * uCloudMarch[i].x;
        float stepSize = rayLength * uCloudMarch[i].y;
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
  vec3 sunDir=normalize(mix(vec3(-.45,.84,-.30),vec3(-.86,.065,-.45),uSkyEvent.w));
  float sunDot=max(0.,dot(rd,sunDir));
  float sunward=pow(max(0.,dot(normalize(rd.xz+vec2(.00001)),normalize(sunDir.xz))),5.);
  float horizon=exp(-elevation*7.5);
  // A bright, narrow warm horizon under a cooler upper dome. The opposite
  // horizon keeps its blue-grey earth shadow, rather than an orange overlay.
  vec3 clearSky=mix(vec3(.64,.76,.81),vec3(.065,.255,.51),smoothstep(0.,.80,elevation));
  vec3 duskTop=vec3(.115,.155,.225);
  vec3 duskHorizon=mix(vec3(.39,.36,.42),vec3(.88,.52,.29),sunward);
  vec3 sunset=mix(duskTop,duskHorizon,horizon);
  sunset+=vec3(.24,.095,.025)*sunward*exp(-elevation*19.);
  clearSky=mix(clearSky,sunset,uSkyEvent.w);
  float airMass=1./max(.09,sunDir.y+.07);
  vec3 solar=exp(-vec3(.022,.047,.087)*airMass)*vec3(1.,.98,.88);
  clearSky+=solar*(pow(sunDot,90.)*.18+pow(sunDot,900.)*.16+smoothstep(.99988,.99998,sunDot)*2.0);
  // Thin remnants of cloud catch the last light and retain spatial scale.
  if(rd.y>.03 && uSkyEvent.z>.01){
   vec3 cloudP=ro+rd*(165./max(rd.y,.06));
   vec4 veil=textureLod(uCloudNoise,(cloudP+vec3(uCloudTime*.7,0.,0.))/vec3(512.,128.,512.),1.);
   float veilAmount=smoothstep(.53,.72,veil.g)*.24*smoothstep(.035,.16,rd.y);
   vec3 veilColor=mix(vec3(.79,.82,.83),mix(vec3(.20,.22,.29),vec3(.88,.52,.34),sunward),uSkyEvent.w);
   clearSky=mix(clearSky,veilColor,veilAmount);
  }
  skyColor=mix(skyColor,clearSky,uSkyEvent.z);
  if(uSkyEvent.y>.001){
   vec2 wallpaperUV=vec2(atan(rd.z,rd.x)/6.2831853+.5,asin(clamp(rd.y,-1.,1.))/3.14159265+.5)*vec2(6.,3.);
   skyColor=mix(skyColor,texture2D(uSkyWallpaper,wallpaperUV).rgb,uSkyEvent.y);
  }
  // Stage lights are part of the anomalous sky only. Ground lights/shadows
  // remain unchanged while banks of lamps lose power in succession.
  if(uStageEvent.y>.001){
   float az=atan(rd.z,rd.x),el=asin(clamp(rd.y,-1.,1.));
   vec3 lamps=vec3(0.);float reveal=uStageEvent.y;
   for(int i=0;i<8;i++){
    float fi=float(i),la=fi*.78539816+.22,le=.58+.11*sin(fi*2.1);
    float dx=atan(sin(az-la),cos(az-la)),down=le-el;
    float cutoff=smoothstep(1.5+fi*.055,1.61+fi*.055,uStageEvent.x);
    float restored=smoothstep(fi*.075,fi*.075+.20,uStageEvent.z);
    float power=max(1.-cutoff,restored);
    float width=.010+max(down,0.)*.13;
    float axis=dx-sin(fi*1.7)*down*.16;
    float cone=exp(-axis*axis/(width*width))*smoothstep(-.015,.065,down)*(1.-smoothstep(.45,.75,down));
    float radial=sqrt(dx*dx+pow((el-le)*1.18,2.));
    float aperture=1.-smoothstep(.017,.023,radial);
    float rim=exp(-pow((radial-.028)/.005,2.));
    float haze=textureLod(uCloudNoise,rd*2.+vec3(uCloudTime*.008,0.,0.),1.).g;
    float filament=exp(-max(0.,uStageEvent.x-1.55-fi*.055)*9.);
    lamps+=vec3(.83,.89,1.)*(aperture*power*3.5+cone*power*(.20+.65*haze)+rim*power*.15);
    lamps+=vec3(.32,.075,.018)*aperture*filament;
   }
   skyColor*=1.-reveal*.75;
   skyColor=mix(skyColor,vec3(.0002,.0003,.0005),uSkyEvent.x);
   skyColor+=lamps*reveal;
  }
  if(uFogVolumeAmount>.001){
   vec4 v=fogVolumeAt(48.);float trans=pow(v.a,3.);
   skyColor=skyColor*trans+v.rgb/max(1.-v.a,.0001)*(1.-trans);
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
  ${fogVolumePars}
  precision highp sampler3D;
  uniform sampler3D uLayerFogNoise;
  uniform vec2 uLayerFogOrigin;
  uniform float uLayerFogTime;
  uniform float uLayerFogMist;
  uniform float uLayerFogRain;
  uniform float uLayerFogScale;
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
  if(baseFog>=1.){gl_FragColor.rgb=fogColor;}else{
  vec3 fogMidpoint = mix(cameraPosition, vLayerFogWorld, .58);
  vec2 fogMap = (fogMidpoint.xz + uLayerFogOrigin + vec2(uLayerFogTime * .30, uLayerFogTime * .11)) / 256.0;
  float patchA = layerFogNoise(fogMap);
  float patchB = layerFogNoise(fogMap * 2.0 + vec2(43.2, 7.7));
  // Three overlapping media: thin field air, low drifting banks, raised haze.
  float lowColumn = exp(-max(0.0, fogMidpoint.y - .4) * .37);
  float raisedColumn = exp(-abs(fogMidpoint.y - 4.2) * .13);
  float lowOptical = max(0.0, fogDistance - 25.0) * .0021 * lowColumn * (.30 + patchA * 1.8);
  float farOptical = max(0.0, fogDistance - 72.0) * .0036 * raisedColumn * (.22 + patchB * 1.2);
  float opticalDepth = (lowOptical + farOptical) * uLayerFogScale * (1.0 + uLayerFogRain * .5);
  // Analytic integral of exponentially decreasing rain haze along this ray.
  // Stable at horizontal views, inexpensive, and continuous down to the ground.
  float wetStart=max(0.,cameraPosition.y-.4),wetEnd=max(0.,vLayerFogWorld.y-.4);
  float wetDy=(wetEnd-wetStart)*.14;
  float wetColumn=exp(-wetStart*.14)*(abs(wetDy)<.001?1.-wetDy*.5:(1.-exp(-wetDy))/wetDy);
  opticalDepth+=fogDistance*.0042*uLayerFogRain*wetColumn;
  float layerFog = 1.0 - exp(-opticalDepth);
  // A subtle cooler bank color returns exactly to fogColor at the cutoff.
  vec3 layerColor = fogColor * vec3(.967, .992, 1.018);
  gl_FragColor.rgb = mix(gl_FragColor.rgb, layerColor, layerFog * (1.0 - baseFog));
  gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, baseFog);
  }
  gl_FragColor.rgb=volumeOverOutput(gl_FragColor.rgb,fogDistance);
#endif`;

// Fully fogged opaque fragments have the same final RGB regardless of their
// PBR/soil calculations. Keep their original depth and silhouette, but bypass
// that shading. Alpha-tested/dithered surfaces must run the original coverage
// tests first. Transparent/custom materials retain their entire original path.
const fullFogReturn = `
#if defined(USE_FOG) && !defined(FOG_EXP2)
  if (length(vLayerFogWorld - cameraPosition) >= fogFar) {
    gl_FragColor = vec4(volumeOverOutput(fogColor,length(vLayerFogWorld-cameraPosition)), 1.0);
    return;
  }
#endif`;

/** Install once, then call attach(newChunk.group) before rendering new chunks.
 * Existing onBeforeCompile and program cache keys are preserved. Supports
 * standard/basic/line materials and custom shaders using Three's fog chunks.
 * No global ShaderChunk mutation and no per-frame scene traversal.
 */
export function installLayeredFog({scene,noiseTexture=null,volumeUniforms={}} = {}) {
  const ownNoise=!noiseTexture;noiseTexture??=makeCloudNoise();
  const uniforms = {
    uFogVolume:{value:null},uFogViewport:{value:new T.Vector2(1,1)},uFogTileSize:{value:new T.Vector2(1,1)},uFogVolumeAmount:{value:0},
    ...volumeUniforms,
    uLayerFogNoise: {value:noiseTexture},
    uLayerFogScale: {value:1},
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
      if (!material.transparent && !material.isShaderMaterial && material.opacity === 1 &&
          !material.dithering && !material.alphaToCoverage && material.blending === T.NormalBlending) {
        const coverage = material.alphaTest > 0 || material.alphaHash || /\bdiscard\b/.test(shader.fragmentShader);
        const anchor = coverage ? '#include <alphahash_fragment>' : '#include <logdepthbuf_fragment>';
        // Both anchors follow clipping and logarithmic-depth writes. The later
        // one also follows map alpha, custom discard, alphaTest and alphaHash.
        shader.fragmentShader = shader.fragmentShader.replace(anchor, anchor + fullFogReturn);
      }
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = shader.vertexShader.replace('#include <fog_pars_vertex>', fogVertexPars).replace('#include <fog_vertex>', fogVertex);
      shader.fragmentShader = shader.fragmentShader.replace('#include <fog_pars_fragment>', fogFragmentPars).replace('#include <fog_fragment>', fogFragment);
    };
    // Capture the old key with the old compile callback still installed. Some
    // stock/custom keys derive themselves from onBeforeCompile.toString().
    const key = previousKey.call(material);
    material.onBeforeCompile = compile;
    material.customProgramCacheKey = function() {return key + '|cumulative-volume-fog-v25';};
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
  return {uniforms, attach, update, detach, dispose() {detach(scene);if(ownNoise)noiseTexture.dispose();}};
}

/**
 * createAtmosphere({scene, quality}) -> {sky, update, attachFog, dispose}
 * update({time,quality,camera,originX:state.cx,originZ:state.cz,mist,rain})
 * Quality: low=16 / balanced=32 / high=48 bounded samples, early termination.
 * Call attachFog(group) once for each completed streaming chunk/detail layer.
 * The original scene.fog near/far/color remain controlled by weather().
 */
export function createAtmosphere({scene,renderer, fog = scene?.fog, quality = 'balanced'} = {}) {
  const texture = makeCloudNoise();
  const volume=createFogVolume(renderer,texture);
  const fogController = installLayeredFog({scene,noiseTexture:texture,volumeUniforms:volume.uniforms});
  const uniforms = {
    ...volume.uniforms,
    uStageEvent:{value:new T.Vector3()},
    uSkyEvent: {value:new T.Vector4()},
    uSkyWallpaper: {value:weatherTextures['cloud-wallpaper']},
    uCloudNoise: {value: texture},
    uCloudCamera: {value: new T.Vector3()},
    uCloudOrigin: {value: new T.Vector2()},
    uCloudFogColor: {value: fog?.color?.clone() || new T.Color('#acb6b1')},
    uCloudTime: {value: 0},
    uCloudMist: {value: 0},
    uCloudRain: {value: 0},
    uCloudSteps: {value: QUALITY_STEPS[quality] || QUALITY_STEPS.balanced},
    uCloudMarch: {value:MARCH_STEPS[QUALITY_STEPS[quality] || QUALITY_STEPS.balanced]}
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
    const {time = 0, quality: q, camera, originX = 0, originZ = 0, mist = 0, rain = 0, event={}} = options;
    uniforms.uStageEvent.value.set(event.stageAge||0,event.stageReveal||0,event.stageRestore||0);
    uniforms.uSkyEvent.value.set(event.blackout||0,event.wallpaper||0,event.clear||0,event.dusk||0);
    uniforms.uCloudTime.value = Number(time) || 0;
    uniforms.uCloudMist.value = clamp01(mist);
    uniforms.uCloudRain.value = clamp01(rain);
    uniforms.uCloudOrigin.value.set(worldOrigin(originX), worldOrigin(originZ));
    if (q){uniforms.uCloudSteps.value = QUALITY_STEPS[q] || QUALITY_STEPS.balanced;uniforms.uCloudMarch.value=MARCH_STEPS[uniforms.uCloudSteps.value];}
    if (camera) {sky.position.copy(camera.position); uniforms.uCloudCamera.value.copy(camera.position);}
    const currentFog = scene?.fog || fog;
    if (currentFog?.color) uniforms.uCloudFogColor.value.copy(currentFog.color);
    fogController.update(options);
    volume.update({...options,color:currentFog?.color});
  }
  return {
    sky, update, volume, renderFog:volume.render, attachFog: fogController.attach, fog: fogController,
    dispose() {volume.dispose();fogController.dispose(); sky.geometry.dispose(); material.dispose(); texture.dispose();}
  };
}
