import * as T from './vendor/three.module.min.js';
import {ruralTextures,initializeRuralTextures} from './rural-textures.js?v=60';
import {OUTPOST,CAMP_PLACEMENT as P} from './lake-outpost-layout.js';
let campGroundArray;const images=new Map(),ROOT=new URL('./textures/lake-outpost/',import.meta.url);
const names=['yellow-canvas','salvage-wood','rusted-metal','camp-mud','olive-canvas','dirty-tile','blue-plastic','painted-container','props-trim','brushed-steel','aged-brass','mahogany-desk','cooker-top','cooker-front','meg-emblem','wheat-stack'];
export async function initializeOutpostTextures(){const loader=new T.TextureLoader();let cursor=0;await Promise.all(Array.from({length:3},async()=>{while(cursor<names.length){const n=names[cursor++],t=await loader.loadAsync(new URL(n+'.webp',ROOT).href);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;images.set(n,t);}}));await initializeRuralTextures();const source=ruralTextures.groundArray.image,w=source.width,h=source.height,data=new Uint8Array(w*h*4*6);data.set(source.data);const c=document.createElement('canvas');c.width=w;c.height=h;const context=c.getContext('2d');context.drawImage(images.get('camp-mud').image,0,0,w,h);data.set(context.getImageData(0,0,w,h).data,w*h*4*5);campGroundArray=new T.DataArrayTexture(data,w,h,6);Object.assign(campGroundArray,{colorSpace:T.SRGBColorSpace,wrapS:T.RepeatWrapping,wrapT:T.RepeatWrapping,minFilter:T.LinearMipmapLinearFilter,magFilter:T.LinearFilter,generateMipmaps:true,anisotropy:4});campGroundArray.needsUpdate=true;}
function texture(name,repeat=1){const t=images.get(name).clone();t.repeat.setScalar(repeat);return t;}
export function outpostMaterials(){
 const make=(name,color,roughness,bump=.01,metalness=0)=>{const map=texture(name);return new T.MeshStandardMaterial({name:'Generated outpost '+name,map,color,roughness,metalness,bumpMap:map,bumpScale:bump,side:T.DoubleSide});};
 const wood=make('salvage-wood',0xb8b0a0,.97,.035),metal=make('brushed-steel',0xc5c9c4,.67,.007,.24);
 const m={wood,metal,rust:make('rusted-metal',0xe6d5c2,.89,.022,.22),canvas:make('yellow-canvas',0xcec2a6,.96,.014),olive:make('olive-canvas',0xb2b5a3,.96,.012),tile:make('dirty-tile',0xd8d5c3,.48,.015),blue:make('blue-plastic',0xc6ccd1,.43,.007),mud:make('camp-mud',0xaba397,.98,.04),container:make('painted-container',0xb8bcb6,.83,.012,.2)};
 m.brass=make('aged-brass',0xe4d9ae,.43,.004,.45);m.rubber=make('blue-plastic',0x242927,.91,.003);m.pvc=make('dirty-tile',0xd3d0b7,.73,.002);m.ceramic=make('dirty-tile',0xc5b79b,.44,.003);
 function atlas(x,y,color=0xffffff){const map=texture('props-trim');map.repeat.set(.5,.5);map.offset.set(x*.5,y*.5);map.wrapS=map.wrapT=T.ClampToEdgeWrapping;return new T.MeshStandardMaterial({map,color,roughness:.94,side:T.DoubleSide,bumpMap:map,bumpScale:.004});}
 m.paper=atlas(0,1);m.sack=atlas(1,1);m.fabric=atlas(0,0);m.mahogany=make('mahogany-desk',0xf1d5c4,.50,.009);m.cookerTop=make('cooker-top',0xffffff,.58,.004,.16);m.cookerFront=make('cooker-front',0xffffff,.61,.004,.16);
 for(const key of ['cookerTop','cookerFront']){m[key].map.wrapS=m[key].map.wrapT=T.ClampToEdgeWrapping;}
 const emblem=texture('meg-emblem');emblem.wrapS=emblem.wrapT=T.ClampToEdgeWrapping;m.insignia=new T.MeshStandardMaterial({map:emblem,color:0xffffff,roughness:.95,alphaTest:.35,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
 const hay=texture('wheat-stack');hay.wrapS=hay.wrapT=T.ClampToEdgeWrapping;m.hay=new T.MeshStandardMaterial({map:hay,color:0xc8c3a9,roughness:1,alphaTest:.38,side:T.DoubleSide});return m;
}
export function attachOutpostGround(mesh,f){
 if(!images.has('camp-mud')||mesh.material.userData.outpostGround)return;
 if(f.worldSeed!==OUTPOST.seed||f.x< -6n||f.x> -3n||f.z< -6n||f.z> -3n)return;
 mesh.material.userData.outpostGround=true;const m=mesh.material,old=m.onBeforeCompile,key=m.customProgramCacheKey();
 m.onBeforeCompile=function(s,r){old.call(this,s,r);s.uniforms.uGroundAlbedo={value:campGroundArray};s.uniforms.uCampOffset={value:new T.Vector2(Number(f.x)*64-OUTPOST.x,Number(f.z)*64-OUTPOST.z)};
 s.fragmentShader='uniform vec2 uCampOffset;\n'+s.fragmentShader;
 s.fragmentShader=s.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
 vec2 campP=vTerrain.xz+uCampOffset;vec2 campD=abs(campP)-vec2(${OUTPOST.hx-3}.,${OUTPOST.hz-3}.);float campEdge=length(max(campD,0.))+min(max(campD.x,campD.y),0.)-3.;float campMask=1.-smoothstep(-.5,2.2,campEdge+(noise2(campP*1.1)-.5)*1.4);
 vec3 campSoil=texture(uGroundAlbedo,vec3(campP*.22,5.)).rgb;float campPath=1.-smoothstep(1.2,2.7,min(abs(campP.x+1.),abs(campP.y-1.)));vec3 campSurface=campSoil*mix(.82,1.16,campPath);diffuseColor.rgb=mix(diffuseColor.rgb,campSurface,campMask);roughnessFactor=mix(roughnessFactor,.92,campMask);
 float campWet=(1.-smoothstep(.65,1.4,length((campP-vec2(${P.water[0]-3}.,${P.water[1]+1}))*vec2(.42,.90))))*campMask;
 roughnessFactor=mix(roughnessFactor,.065,campWet);diffuseColor.rgb*=1.-campWet*.29;
 `);
 s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
 float campHeight=dot(campSoil,vec3(.21,.72,.07))*.024*campMask*(1.-campWet);vec3 campDx=dFdx(-vViewPosition),campDy=dFdy(-vViewPosition);vec3 campRx=cross(campDy,normal),campRy=cross(normal,campDx);float campDet=dot(campDx,campRx);normal=normalize(abs(campDet)*normal-sign(campDet)*(dFdx(campHeight)*campRx+dFdy(campHeight)*campRy));
 `);
 };m.customProgramCacheKey=()=>key+'|lake-outpost-generated-mud-compact';m.needsUpdate=true;
}
