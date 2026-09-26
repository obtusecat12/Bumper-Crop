import {weatherTextures} from './weather-textures.js?v=51';
import {fogVolumePars} from './fog-volume.js?v=51';
import {createAdvancingFog} from './advancing-fog.js?v=51';
import * as T from './vendor/three.module.min.js';

// World-ray projected cellular decks; optical column depth gives dark cores
// and thin scattering edges. A shared periodic 3D noise volume also serves fog.
const PERIOD = 65536;
export const CLOUD_LAYERS=Object.freeze([
 {name:'altostratus',altitude:3000,bottom:2800,top:3200,wind:[2.56,1.024]},
 {name:'stratocumulus',altitude:1500,bottom:1080,top:1800,wind:[5.6,-1.8]},
 {name:'scud',altitude:400,bottom:340,top:460,wind:[10.24,2.56]}
]);
const QUALITY_STEPS={low:6,balanced:8,high:10};
const SKY_PERIOD=80000;
function skyOrigin(value){return typeof value==='bigint'?Number((value%1250n+1250n)%1250n)*64:((Number(value)||0)%SKY_PERIOD+SKY_PERIOD)%SKY_PERIOD;}
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
uniform vec2 uSkyOrigin;
uniform vec3 uCloudFogColor;
uniform float uCloudTime;
uniform float uCloudMist;
uniform float uCloudRain;
uniform int uCloudSteps;
uniform vec4 uSkyEvent;
uniform sampler2D uSkyWallpaper;
uniform bool uCloudCached;
uniform sampler2D uCloudScreen;
uniform vec2 uCloudViewport;

uniform vec3 uStageEvent;
uniform vec4 uReferenceSky;
uniform float uReferenceClinic;
${fogVolumePars}

// 1,250 m cellular period, 64 periodic cells = 80 km; each world rebase
// is an exact integer-cell translation. No azimuth/polar UVs in normal weather.
vec2 cloudHash(vec2 p){
 p=mod(p,64.);
 vec3 q=fract(vec3(p.xyx)*vec3(.1031,.1030,.0973));
 q+=dot(q,q.yzx+33.33);
 return fract((q.xx+q.yz)*q.zy);
}
float worley(vec2 p){
 vec2 cell=floor(p),f=fract(p);float nearest=4.;
 for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){
  vec2 o=vec2(float(x),float(y));
  vec2 d=o+.16+.68*cloudHash(cell+o)-f;
  nearest=min(nearest,dot(d,d));
 }
 return clamp(sqrt(nearest),0.,1.);
}
float cloudNoise2(vec2 p){return textureLod(uCloudNoise,vec3(p.x*.125,.3125,p.y*.125),0.).g;}
float cloudFBM4(vec2 p){
 // Four actual octaves, from kilometre-wide bellies down to torn rims.
 float sum=0.,weight=.5333333;
 for(int i=0;i<4;i++){sum+=weight*cloudNoise2(p);p=p*2.+vec2(17.,11.);weight*=.5;}
 return sum;
}
vec2 cloudPlane(vec3 ro,vec3 rd,float H){
 return ro.xz+rd.xz*((H-ro.y)/max(rd.y,.04));
}
vec2 cellularColumn(vec2 projected,float H){
 vec2 p=projected*.0008+vec2(5.6,-1.8)*uCloudTime*.0008;
 // Isotropic world X/Z sampling; two small domain warps, no horizontal stretch.
 vec2 w=vec2(cloudNoise2(p*2.),cloudNoise2(p*2.+vec2(5.2,1.3)))-.5;
 p+=.70*w;
 p+=.14*(vec2(cloudNoise2(p*4.+9.),cloudNoise2(p*4.-13.))-.5);
 float cells=1.-worley(p),f=0.,weight=.5333333;
 vec3 volumeP=vec3(p.x*2.,(H-1050.)*.003,p.y*2.);
 for(int octave=0;octave<4;octave++){f+=weight*textureLod(uCloudNoise,volumeP*.125,0.).g;volumeP=volumeP*2.+vec3(17.,5.,11.);weight*=.5;}
 float billows=textureLod(uCloudNoise,vec3(p.x,(H-900.)*.0018,p.y)*.125,0.).a;
 float evolve=.018*sin(uCloudTime*.013+f*6.);
 float body=f*.60+cells*.20+billows*.20;
 float density=clamp((body-.29+evolve+uCloudRain*.035)*2.2,0.,1.);
 return vec2(density,cells);
}
vec3 projectedOvercast(vec3 background,vec3 ro,vec3 rd){
 // Always overcast: continuous high altostratus, broad main cloud columns,
 // and disconnected quicker scud 1,100 m below them.
 vec2 highP=cloudPlane(ro,rd,3000.)*.0004+vec2(2.56,1.024)*uCloudTime*.0004;
 float high=cloudFBM4(highP);
 vec3 veil=mix(vec3(.32,.345,.38),vec3(.43,.455,.49),high);
 // The 1500 m intersection anchors the column. Six to ten bounded samples
 // through its finite thickness reveal rounded, lower-hanging cloud bellies.
 vec2 anchor=cloudPlane(ro,rd,1500.);
 vec3 core=vec3(.0835,.0946,.1065),edge=vec3(.3801,.4064,.4480);
 float ds=720./float(uCloudSteps)/max(rd.y,.04),Tview=1.;vec3 light=vec3(0.);
 for(int i=0;i<10;i++){
  if(i>=uCloudSteps||Tview<.002)break;
  float H=1080.+(float(i)+.5)*720./float(uCloudSteps);
  vec2 column=cellularColumn(anchor+rd.xz*((H-1500.)/max(rd.y,.04)),H);
  float bottom=1110.+230.*(1.-column.y),top=1690.+column.x*130.;
  float profile=smoothstep(bottom,bottom+135.,H)*(1.-smoothstep(top-170.,top,H));
  float D=column.x*profile;
  float tau=column.x*max(0.,top-H)*.012;
  float beer=exp(-tau),powder=1.-exp(-2.*D);
  float transmission=clamp(beer*(1.+powder*.65)+.065*(1.-beer),0.,1.);
  vec3 body=mix(core,edge,transmission);
  float opacity=1.-exp(-D*ds*.019);
  light+=Tview*opacity*body;Tview*=1.-opacity;
 }
 vec3 color=light+veil*Tview;
 vec2 scudP=cloudPlane(ro,rd,400.)*.0016+vec2(10.24,2.56)*uCloudTime*.0016;
 float scud=cloudFBM4(scudP);
 float scraps=smoothstep(.56,.76,scud)*(1.-smoothstep(.30,.62,cloudNoise2(scudP*.5+4.)));
 color=mix(color,core*.83,scraps*.50);
 return color*(1.-uCloudRain*.12);
}

void main() {
  if(uCloudCached){
   vec3 cached=texture2D(uCloudScreen,gl_FragCoord.xy/uCloudViewport).rgb;
   if(uFogVolumeAmount>.001){vec4 v=fogVolumeAt(48.);float trans=pow(v.a,3.);cached=cached*trans+v.rgb/max(1.-v.a,.0001)*(1.-trans);}
   gl_FragColor=vec4(cached,1.);
   #include <colorspace_fragment>
   return;
  }
  vec3 rd = normalize(vCloudDirection);
  vec3 ro = uCloudCamera;
  ro.xz=mod(ro.xz+uSkyOrigin,80000.);
  float elevation = max(rd.y, 0.0);
  vec3 upperSky = vec3(.445, .473, .484) - uCloudRain * .055;
  vec3 skyColor = mix(uCloudFogColor, upperSky, smoothstep(.01, .62, elevation));
  if(rd.y>.012 && uSkyEvent.x<.995 && uSkyEvent.y<.995 && uSkyEvent.z<.995 && uCloudMist<.95){
   // Composite distant -> close. The high deck never opens onto blue sky.
   vec3 layers=projectedOvercast(skyColor,ro,rd);
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
  float refElevation=smoothstep(0.,.85,max(rd.y,0.));
  vec3 refClear=mix(uReferenceSky.rgb*1.65+vec3(.035,.023,.012),uReferenceSky.rgb*.76,refElevation);
  float refVeil=cloudNoise2(rd.xz*1.3+vec2(1.9,3.2))*.006;
  vec3 refSky=mix(uReferenceSky.rgb*mix(1.055,.965,refElevation),refClear+refVeil,uReferenceClinic);
  skyColor=mix(skyColor,refSky,uReferenceSky.a);
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
  const volume=createAdvancingFog(renderer,texture);
  // Dense weather is composited once after opaque + water, before optics.
  // Keep legacy material fog disabled; the ordinary distant haze is unchanged.
  const volumeUniforms={uFogVolume:{value:null},uFogViewport:{value:new T.Vector2(1,1)},uFogTileSize:{value:new T.Vector2(1,1)},uFogVolumeAmount:{value:0}};
  const fogController = installLayeredFog({scene,noiseTexture:texture,volumeUniforms});
  const uniforms = {
    ...volumeUniforms,
    uStageEvent:{value:new T.Vector3()},uReferenceSky:{value:new T.Vector4()},uReferenceClinic:{value:0},
    uSkyEvent: {value:new T.Vector4()},
    uSkyWallpaper: {value:weatherTextures['cloud-wallpaper']},
    uCloudCached:{value:false},uCloudScreen:{value:null},uCloudViewport:{value:new T.Vector2(1,1)},
    uCloudNoise: {value: texture},
    uCloudCamera: {value: new T.Vector3()},
    uCloudOrigin: {value: new T.Vector2()},
    uSkyOrigin: {value: new T.Vector2()},
    uCloudFogColor: {value: fog?.color?.clone() || new T.Color('#acb6b1')},
    uCloudTime: {value: 0},
    uCloudMist: {value: 0},
    uCloudRain: {value: 0},
    uCloudSteps: {value: QUALITY_STEPS[quality] || QUALITY_STEPS.balanced}
  };
  // Three r180 converts ShaderMaterial to GLSL ES 3 automatically. Keeping its
  // normal prefix preserves gl_FragColor and output color-space handling.
  const material = new T.ShaderMaterial({
    name: 'ray-projected-cellular-overcast-v43',
    side: T.BackSide, depthWrite: false, depthTest: true, fog: false,
    toneMapped: false, uniforms, vertexShader: cloudVertex, fragmentShader: cloudFragment
  });
  const sky = new T.Mesh(new T.SphereGeometry(420, 24, 16), material);
  sky.name = 'three-layer-dynamic-overcast';
  // Draw after opaque scenery so the depth buffer rejects hidden sky pixels.
  sky.renderOrder = 1000;
  sky.frustumCulled = false;
  // Smooth weather density is evaluated at half width/height (capped at 640px
  // wide), then composited only on sky fragments after opaque depth testing.
  // Recompute from the current camera every frame: no stale rotational cache.
  const cloudTarget=new T.WebGLRenderTarget(1,1,{depthBuffer:false,type:renderer.extensions.has('EXT_color_buffer_float')?T.HalfFloatType:T.UnsignedByteType,minFilter:T.LinearFilter,magFilter:T.LinearFilter,generateMipmaps:false});
  cloudTarget.texture.colorSpace=T.NoColorSpace;
  const cloudPassMaterial=new T.ShaderMaterial({depthTest:false,depthWrite:false,toneMapped:false,uniforms:{...uniforms,uCloudCached:{value:false},uCloudScreen:{value:null},uFogVolumeAmount:{value:0},uCloudInverseProjection:{value:new T.Matrix4()},uCloudWorldMatrix:{value:new T.Matrix4()}},fragmentShader:cloudFragment,vertexShader:`
   varying vec3 vCloudDirection;uniform mat4 uCloudInverseProjection,uCloudWorldMatrix;
   void main(){vec4 p=uCloudInverseProjection*vec4(position.xy,1.,1.);vCloudDirection=mat3(uCloudWorldMatrix)*p.xyz;gl_Position=vec4(position.xy,0.,1.);}`});
  const cloudGeometry=new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute([-1,-1,0,3,-1,0,-1,3,0],3));
  const cloudScene=new T.Scene(),cloudCamera=new T.Camera(),cloudQuad=new T.Mesh(cloudGeometry,cloudPassMaterial);cloudQuad.frustumCulled=false;cloudScene.add(cloudQuad);
  sky.userData.renderClouds=(camera,width,height)=>{
   // Rare sharp sky events retain their original resolution.
   const event=uniforms.uSkyEvent.value;uniforms.uCloudCached.value=false;
   if(event.x+event.y+event.z+uniforms.uStageEvent.value.y>.001)return;
   const w=Math.max(1,Math.ceil(Math.min(width*.5,640))),h=Math.max(1,Math.ceil(w*height/width));
   if(cloudTarget.width!==w||cloudTarget.height!==h)cloudTarget.setSize(w,h);
   camera.updateMatrixWorld(true);cloudPassMaterial.uniforms.uCloudInverseProjection.value.copy(camera.projectionMatrixInverse);cloudPassMaterial.uniforms.uCloudWorldMatrix.value.copy(camera.matrixWorld);
   const previous=renderer.getRenderTarget(),auto=renderer.autoClear;
   try{renderer.autoClear=true;renderer.setRenderTarget(cloudTarget);renderer.render(cloudScene,cloudCamera);}finally{renderer.setRenderTarget(previous);renderer.autoClear=auto;}
   uniforms.uCloudScreen.value=cloudTarget.texture;uniforms.uCloudViewport.value.set(width,height);uniforms.uCloudCached.value=true;
  };
  function update(options = {}) {
    const {time = 0, quality: q, camera, originX = 0, originZ = 0, mist = 0, rain = 0, event={}} = options;
    const reference=options.reference;if(reference)uniforms.uReferenceSky.value.set(reference.sky.r,reference.sky.g,reference.sky.b,reference.amount);else uniforms.uReferenceSky.value.w=0;uniforms.uReferenceClinic.value=reference?.clinic||0;
    uniforms.uStageEvent.value.set(event.stageAge||0,event.stageReveal||0,event.stageRestore||0);
    uniforms.uSkyEvent.value.set(event.blackout||0,event.wallpaper||0,event.clear||0,event.dusk||0);
    uniforms.uCloudTime.value = Number(time) || 0;
    // The arriving bank obscures the sky along its world-space ray; changing
    // the whole sky's density here would reveal fog before its front arrives.
    uniforms.uCloudMist.value = 0;
    uniforms.uCloudRain.value = clamp01(rain);
    uniforms.uCloudOrigin.value.set(worldOrigin(originX), worldOrigin(originZ));
    uniforms.uSkyOrigin.value.set(skyOrigin(originX),skyOrigin(originZ));
    if (q){uniforms.uCloudSteps.value = QUALITY_STEPS[q] || QUALITY_STEPS.balanced;}
    if (camera) {sky.position.copy(camera.position); uniforms.uCloudCamera.value.copy(camera.position);}
    const currentFog = scene?.fog || fog;
    if (currentFog?.color) uniforms.uCloudFogColor.value.copy(currentFog.color);
    fogController.update(options);
    volume.update({...options,color:currentFog?.color});
  }
  return {
    sky, update, volume, attachFog: fogController.attach, fog: fogController,
    dispose() {volume.dispose();fogController.dispose();cloudTarget.dispose();cloudGeometry.dispose();cloudPassMaterial.dispose(); sky.geometry.dispose(); material.dispose(); texture.dispose();}
  };
}
