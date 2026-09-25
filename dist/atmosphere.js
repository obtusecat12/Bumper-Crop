import {weatherTextures} from './weather-textures.js?v=42';
import {createFogVolume,fogVolumePars} from './fog-volume.js?v=42';
import * as T from './vendor/three.module.min.js';

// One generated, periodic 3D texture, genuine bounded volume integration, and
// material fog. There is no screen-space noise, flat cloud layer or fog plane.
const PERIOD = 65536;
export const CLOUD_LAYERS=Object.freeze([
 {name:'altostratus',altitude:3000,bottom:2800,top:3200,wind:[2.56,1.024]},
 {name:'stratocumulus',altitude:1200,bottom:1000,top:1500,wind:[5.6,-1.8]},
 {name:'scud',altitude:400,bottom:340,top:460,wind:[10.24,2.56]}
]);
const QUALITY_STEPS={low:6,balanced:8,high:10};
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
export function makeCloudNoise(size = 64) {
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

export const cloudVertex = `
varying vec3 vCloudDirection;
void main() {
  vCloudDirection = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position.z=gl_Position.w*.999999;
}`;

export const cloudFragment = `
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

uniform vec3 uStageEvent;
${fogVolumePars}

// Three real world-height slabs. All spatial periods divide 65536 m, so
// rebasing an arbitrarily large BigInt world coordinate never jumps the sky.
vec4 volumeNoise(vec3 p,vec3 scale,float lod){return textureLod(uCloudNoise,p/scale,lod);}
float cloudDensity(vec3 p,int layer,float lod){
 float bottom=layer==0?2800.:layer==1?1000.:340.;
 float top=layer==0?3200.:layer==1?1500.:460.;
 float h=clamp((p.y-bottom)/(top-bottom),0.,1.);
 vec3 scale=layer==0?vec3(8192.,2048.,8192.):layer==1?vec3(4096.,2048.,4096.):vec3(2048.,1024.,1024.);
 vec2 velocity=layer==0?vec2(2.56,1.024):layer==1?vec2(5.6,-1.8):vec2(10.24,2.56);
 p.xz+=velocity*uCloudTime;
 // Slow evolution in Y changes the density, not just a scrolling wallpaper.
 p.y+=sin(uCloudTime*.008+float(layer)*2.)*24.;
 vec4 warp1=volumeNoise(p,scale,1.);
 vec3 warped=p+(warp1.gbr-.5)*scale*.18;
 vec4 warp2=volumeNoise(warped+vec3(139.,47.,271.),scale*.5,1.);
 warped+=(warp2.brg-.5)*scale*.085;
 vec4 shape=volumeNoise(warped,scale,lod);
 if(layer==0)return (.20+.16*shape.r)*smoothstep(0.,.15,h)*(1.-smoothstep(.84,1.,h));
 vec4 detail=volumeNoise(warped+vec3(211.,-97.,401.),scale*.25,min(3.,lod+.5));
 // Worley erosion of fBm yields rounded cores and ragged, wind-sheared edges.
 float body=shape.r*.67+shape.a*.33-(1.-detail.a)*.14;
 float evolution=.018*sin(uCloudTime*.013+shape.g*5.);
 float threshold=layer==1?.26:.40;
 float density=max(0.,body-threshold+evolution+uCloudRain*.025);
 float base=layer==1?.015+.22*(1.-shape.a):.03;
 float profile=smoothstep(base,base+.17,h)*(1.-smoothstep(.62,1.,h));
 return density*profile*(layer==1?1.8:2.4);
}
vec3 integrateLayer(vec3 background,vec3 ro,vec3 rd,int layer){
 float bottom=layer==0?2800.:layer==1?1000.:340.;
 float top=layer==0?3200.:layer==1?1500.:460.;
 float entry=max(0.,(bottom-ro.y)/rd.y),finish=(top-ro.y)/rd.y;
 if(finish<=entry)return background;
 int count=layer==0?2:layer==1?uCloudSteps:(uCloudSteps/2);
 float ds=(finish-entry)/float(count),Tview=1.;vec3 L=vec3(0.);
 float lod=clamp(log2(max(1.,ds/95.)),0.,2.5);
 for(int i=0;i<10;i++){
  if(i>=count||Tview<.015)break;
  vec3 p=ro+rd*(entry+(float(i)+.5)*ds);float D=cloudDensity(p,layer,lod);
  float h=clamp((p.y-bottom)/(top-bottom),0.,1.);
  // Vertical optical thickness: diffuse light enters from the whole sky,
  // no sun-facing bright rim or directional hotspot in normal overcast.
  float tau=D*(1.-h)*12.;
  float beer=exp(-tau),powder=1.-exp(-2.*D);
  float multiple=.10*(1.-exp(-tau*.45));
  float diffuse=clamp(.09+.68*beer+.21*beer*powder+multiple,0.,1.);
  vec3 shade=mix(vec3(.045,.057,.069),vec3(.42,.455,.48),diffuse);
  if(layer==0)shade=mix(vec3(.35,.378,.398),vec3(.47,.49,.51),beer);
  if(layer==2)shade*=.78;
  shade*=1.-uCloudRain*.14;
  float extinction=layer==0?.018:layer==1?.018:.030;
  float opacity=1.-exp(-D*ds*extinction);
  L+=Tview*opacity*shade;Tview*=1.-opacity;
 }
 return L+Tview*background;
}

void main() {
  vec3 rd = normalize(vCloudDirection);
  vec3 ro = uCloudCamera + vec3(uCloudOrigin.x, 0.0, uCloudOrigin.y);
  float elevation = max(rd.y, 0.0);
  vec3 upperSky = vec3(.445, .473, .484) - uCloudRain * .055;
  vec3 skyColor = mix(uCloudFogColor, upperSky, smoothstep(.01, .62, elevation));
  if(rd.y>.012 && uSkyEvent.x<.995 && uSkyEvent.y<.995 && uSkyEvent.z<.995 && uCloudMist<.95){
   // Composite distant -> close. The high deck never opens onto blue sky.
   vec3 layers=integrateLayer(skyColor,ro,rd,0);
   layers=integrateLayer(layers,ro,rd,1);
   layers=integrateLayer(layers,ro,rd,2);
   float visibility=smoothstep(.012,.13,rd.y)*(1.-uCloudMist*.8);
   skyColor=mix(skyColor,layers,visibility);
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
   vec3 cloudP=ro+rd*((1200.-ro.y)/max(rd.y,.06));
   vec4 veil=textureLod(uCloudNoise,(cloudP+vec3(uCloudTime*5.6,0.,uCloudTime*-1.8))/vec3(4096.,2048.,4096.),1.);
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
 * Quality: low=11 / balanced=14 / high=17 total slab samples, early termination.
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
    uCloudSteps: {value: QUALITY_STEPS[quality] || QUALITY_STEPS.balanced}
  };
  // Three r180 converts ShaderMaterial to GLSL ES 3 automatically. Keeping its
  // normal prefix preserves gl_FragColor and output color-space handling.
  const material = new T.ShaderMaterial({
    name: 'three-altitude-overcast-v42',
    side: T.BackSide, depthWrite: false, depthTest: true, fog: false,
    toneMapped: false, uniforms, vertexShader: cloudVertex, fragmentShader: cloudFragment
  });
  const sky = new T.Mesh(new T.SphereGeometry(420, 24, 16), material);
  sky.name = 'three-layer-dynamic-overcast';
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
    if (q){uniforms.uCloudSteps.value = QUALITY_STEPS[q] || QUALITY_STEPS.balanced;}
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
