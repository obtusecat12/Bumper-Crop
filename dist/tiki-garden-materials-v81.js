import * as T from './vendor/three.module.min.js';
const ROOT=new URL('./textures/tiki-garden-v81/',import.meta.url),cache=new Map();
const surfaceNames=['gravel','boulder','ceiling','wall'];
const files=[...surfaceNames.flatMap(n=>['basecolor','normal','roughness','displacement','ao'].map(c=>`surfaces/${n}-${c}.webp`)),
 ...['fern','palm-crown','flowers','palm-frond'].map(n=>`foliage/${n}-basecolor.webp`),
 ...['thatch','palm-trunk','sandal-footbed','sandal-strap'].flatMap(n=>['basecolor','normal','roughness'].map(c=>`props/${n}-${c}.webp`)),'props/splash-basecolor.webp'];
export async function preloadGarden81(report=()=>{}){let cursor=0,done=0;const loader=new T.TextureLoader();
 await Promise.all(Array.from({length:4},async()=>{while(cursor<files.length){const name=files[cursor++];if(!cache.has(name)){const t=await loader.loadAsync(new URL(name,ROOT).href);t.colorSpace=name.endsWith('basecolor.webp')?T.SRGBColorSpace:T.NoColorSpace;t.wrapS=t.wrapT=name.startsWith('foliage/')?T.ClampToEdgeWrapping:T.RepeatWrapping;t.anisotropy=4;t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;cache.set(name,t);}report(++done/files.length);}}));
}
export function gardenMaterials81(){
 const tx=(group,n,c='basecolor')=>{const t=cache.get(`${group}/${n}-${c}.webp`);if(!t)throw Error(`Garden texture missing: ${group}/${n}-${c}`);return t;};
 const pbr=(n,group='surfaces',options={})=>new T.MeshStandardMaterial({name:`Garden81 / ${n}`,map:tx(group,n),normalMap:tx(group,n,'normal'),roughnessMap:tx(group,n,'roughness'),roughness:1,metalness:0,...options});
 const m={gravel:pbr('gravel','surfaces',{normalScale:new T.Vector2(1.7,1.7),displacementMap:tx('surfaces','gravel','displacement'),displacementScale:.055,displacementBias:-.014,aoMap:tx('surfaces','gravel','ao'),aoMapIntensity:.55}),
 pebble:pbr('gravel','surfaces',{normalScale:new T.Vector2(.7,.7),roughness:.86}),
 boulder:pbr('boulder','surfaces',{normalScale:new T.Vector2(1.4,1.4),aoMap:tx('surfaces','boulder','ao'),aoMapIntensity:.40,roughness:.85}),
 bed:pbr('boulder','surfaces',{color:0x4c6255,roughness:.45,normalScale:new T.Vector2(1.4,1.4)}),
 ceiling:pbr('ceiling','surfaces',{roughness:.94,normalScale:new T.Vector2(.48,.48)}),wall:pbr('wall','surfaces',{roughness:.89,normalScale:new T.Vector2(.7,.7)}),
 grid:pbr('ceiling','surfaces',{color:0x9a9b93,roughness:.5,metalness:.5,normalScale:new T.Vector2(.12,.12)}),
 trunk:pbr('palm-trunk','props',{roughness:.55,normalScale:new T.Vector2(1.0,1.0)}),thatch:pbr('thatch','props',{roughness:.98,alphaTest:.37,side:T.DoubleSide,normalScale:new T.Vector2(.8,.8)}),
 sandal:pbr('sandal-footbed','props',{roughness:.91,alphaTest:.25,normalScale:new T.Vector2(.85,.85)}),strap:pbr('sandal-strap','props',{roughness:.73,normalScale:new T.Vector2(.9,.9)}),
 rubber:pbr('sandal-strap','props',{color:0x37332c,roughness:.80}),wood:pbr('palm-trunk','props',{color:0xaaa188,roughness:.72}),
 dark:pbr('wall','surfaces',{color:0x161b17,roughness:.83}),rim:pbr('boulder','surfaces',{color:0x777977,roughness:.6}),
 fluorescent:new T.MeshBasicMaterial({name:'Recessed prismatic fluorescent diffuser',color:0xe4eeef,toneMapped:false}),
 tube:new T.MeshBasicMaterial({color:0xf0fff9,toneMapped:false}),mountain:pbr('wall','surfaces',{color:0x654139,roughness:.95}),
 door:pbr('wall','surfaces',{color:0x7a806c,roughness:.7}),brass:pbr('wall','surfaces',{color:0x9c926c,metalness:.84,roughness:.3,normalScale:new T.Vector2(.2,.2)})};
 for(const n of['fern','palm-crown','flowers','palm-frond']){m[n]=new T.MeshStandardMaterial({name:'Photographic plant / '+n,map:tx('foliage',n),alphaTest:.40,side:T.DoubleSide,roughness:n.startsWith('palm')?.51:.8,metalness:0});m[n].forceSinglePass=true;}
 // Wet granite changes continuously at the surveyed waterline. The actual
 // boulder surface and its normal map retain depth above the dark wet band.
 m.boulder.onBeforeCompile=s=>{
  s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 gardenWorld,gardenNormal;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\ngardenWorld=(modelMatrix*vec4(transformed,1.)).xyz;gardenNormal=normalize(mat3(modelMatrix)*objectNormal);');
  s.fragmentShader=s.fragmentShader.replace('#include <common>',`#include <common>
varying vec3 gardenWorld,gardenNormal;
vec3 gardenWeights(){vec3 w=pow(abs(normalize(gardenNormal)),vec3(4.));return w/max(dot(w,vec3(1.)),.00001);}
vec4 gardenTri(sampler2D tex){vec3 w=gardenWeights(),p=gardenWorld/1.12;return texture2D(tex,p.zy)*w.x+texture2D(tex,p.xz)*w.y+texture2D(tex,p.xy)*w.z;}
`)
   .replace('#include <map_fragment>','diffuseColor*=gardenTri(map);')
   .replace('#include <normal_fragment_maps>',`vec3 gw=gardenWeights(),gp=gardenWorld/1.12;
vec3 nx=texture2D(normalMap,gp.zy).xyz*2.-1.,ny=texture2D(normalMap,gp.xz).xyz*2.-1.,nz=texture2D(normalMap,gp.xy).xyz*2.-1.;
vec3 slopes=vec3(ny.x*gw.y+nz.x*gw.z,nx.y*gw.x+nz.y*gw.z,nx.x*gw.x+ny.y*gw.y)*.46;
normal=normalize(mat3(viewMatrix)*normalize(gardenNormal+slopes));`)
   .replace('#include <roughnessmap_fragment>',`float roughnessFactor=roughness*gardenTri(roughnessMap).g;
float gardenWet=1.-smoothstep(-.12,.26,gardenWorld.y);roughnessFactor=mix(roughnessFactor,.17,gardenWet*.86);diffuseColor.rgb*=mix(1.,.72,gardenWet);`)
   .replace('#include <aomap_fragment>','reflectedLight.indirectDiffuse*=mix(1.,gardenTri(aoMap).r,aoMapIntensity);');
 };m.boulder.customProgramCacheKey=()=> 'garden81-triplanar-wet-rock-v2';
 return{m,texture:(g,n,c)=>tx(g,n,c),textures:[...cache.values()]};
}
