import * as T from './vendor/three.module.min.js';
const maps={};export const LOCKER_MAP_NAMES=['locker','tile','wood','rubber','towel','mirror','steel'];
export async function initializeChangingTextures(decode,onProgress=()=>{}){
 const jobs=LOCKER_MAP_NAMES.flatMap(n=>['basecolor','normal','roughness','metallic','ao','height'].map(c=>({key:n+'-'+c,w:512,h:512})));jobs.push({key:'newspaper',w:768,h:1024});
 let done=0,next=0;const loader=new T.TextureLoader();
 async function worker(){while(next<jobs.length){const job=jobs[next++];if(maps[job.key]){onProgress(++done/jobs.length);continue;}const url=new URL('./textures/changing-v72/'+job.key+'.webp',import.meta.url);let t;
  if(decode){const im=await decode(url,job.w,job.h);t=new T.DataTexture(im.data,im.width,im.height);t.flipY=true;t.needsUpdate=true;t.generateMipmaps=true;}else t=await loader.loadAsync(url.href);
  t.colorSpace=job.key.endsWith('basecolor')||job.key==='newspaper'?T.SRGBColorSpace:T.NoColorSpace;t.wrapS=t.wrapT=job.key==='newspaper'||job.key.startsWith('mirror')?T.ClampToEdgeWrapping:T.RepeatWrapping;t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;t.anisotropy=4;t.name='V72 generated '+job.key;maps[job.key]=t;onProgress(++done/jobs.length);
 }}await Promise.all([worker(),worker(),worker(),worker()]);
}
export const changingTextures=()=>maps;
export function changingMaterials(){
 const surface=(n,roughness,normal,metalness=1)=>new T.MeshStandardMaterial({name:'V72 '+n,map:maps[n+'-basecolor'],normalMap:maps[n+'-normal'],normalScale:new T.Vector2(normal,normal),roughnessMap:maps[n+'-roughness'],roughness,metalnessMap:maps[n+'-metallic'],metalness,aoMap:maps[n+'-ao'],aoMapIntensity:.55});
 const m={locker:surface('locker',.86,.27),tile:surface('tile',.83,.58,0),wood:surface('wood',.84,.39,0),rubber:surface('rubber',.92,.45,0),towel:surface('towel',.97,.48,0),mirror:surface('mirror',1,.18),steel:surface('steel',.65,.20)};
 m.dark=m.steel.clone();m.dark.color.set(0x26332e);m.dark.roughness=.89;m.chrome=m.steel.clone();m.chrome.color.set(0xd2dbd2);m.chrome.roughness=.19;m.chrome.metalness=1;
 m.basket=m.locker.clone();m.basket.color.set(0xd5c89b);m.basket.metalness=0;m.basket.roughness=.76;
 m.paper=new T.MeshStandardMaterial({name:'V72 generated 2006 newspaper',map:maps.newspaper,normalMap:maps['towel-normal'],normalScale:new T.Vector2(.025,.025),roughness:.94,side:T.DoubleSide});
 m.glow=m.tile.clone();m.glow.name='V72 old fluorescent phosphor';m.glow.color.set(0xd7dec2);m.glow.emissive.set(0xe5edbe);m.glow.emissiveIntensity=2.5;m.glow.roughness=.36;
 // Recessed tile grout collects water. The generated height field owns the
 // mask; this is part of the ceramic shader, never a second puddle plane.
 m.wet=m.tile.clone();m.wet.name='V72 wet ceramic grout';const clock={value:0};m.wet.userData.clock=clock;
 m.wet.onBeforeCompile=s=>{s.uniforms.groutHeight={value:maps['tile-height']};s.uniforms.wetClock=clock;s.vertexShader='varying vec3 changingWorld;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nchangingWorld=(modelMatrix*vec4(transformed,1.)).xyz;');
  s.fragmentShader='uniform sampler2D groutHeight;uniform float wetClock;varying vec3 changingWorld;float groutWet;\n'+s.fragmentShader;
  s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\nfloat recess=1.-smoothstep(.12,.47,texture2D(groutHeight,vMapUv).r);float wetPatch=.45+.55*sin(changingWorld.x*2.2+sin(changingWorld.z*1.7));groutWet=clamp(recess*.78+smoothstep(.7,.97,wetPatch)*.40,0.,.94);diffuseColor.rgb*=mix(1.,.77,groutWet);');
  s.fragmentShader=s.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(roughnessFactor,.10,groutWet);');
 };m.wet.customProgramCacheKey=()=> 'changing-generated-grout-wet-v72';
 m.towel.displacementMap=maps['towel-height'];m.towel.displacementScale=.002;m.towel.displacementBias=-.001;
 return m;
}
