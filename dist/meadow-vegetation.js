import * as T from './vendor/three.module.min.js';
import {createMeadowPlantAssets} from './meadow-plants.js?v=24';
import {createFernGeometry} from './fern-geometry.js?v=24';
import {makeSward,isSharedSwardResource} from './meadow-sward.js?v=24';
import {meadowEnvironment} from './meadow-layout.js?v=24';
import {random,periodOrigin,roadProfile,inClearing,surfaceHeight} from './world.js?v=24';
import {farmFootprintDistance} from './farm-layout.js?v=24';

const shared=new Set(),kinds=['shortgrass','tallgrass','seedgrass','fern','daisy'];
let assets,material;const cache=new Map(),CACHE_LIMIT=10;
const clamp=x=>Math.max(0,Math.min(1,x));
function hash(x,z){let h=Math.imul(x,374761393)^Math.imul(z,668265263);h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296}
function noise(x,z){const a=Math.floor(x),b=Math.floor(z);let u=x-a,v=z-b;u=u*u*(3-2*u);v=v*v*(3-2*v);return (hash(a,b)*(1-u)+hash(a+1,b)*u)*(1-v)+(hash(a,b+1)*(1-u)+hash(a+1,b+1)*u)*v}
function resources(wind){
 if(assets)return;
 assets=createMeadowPlantAssets({variants:2});for(const g of assets.geometries)shared.add(g);
 for(const lod of ['near','mid','far'])assets.fern[lod]=Array.from({length:3},(_,i)=>{const g=createFernGeometry(lod,i,0x7381+i*431);shared.add(g);return g});
 material=new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide});shared.add(material);
 material.onBeforeCompile=s=>{
  s.uniforms.uTime=wind.time;s.uniforms.uWind=wind.strength;
  s.vertexShader='uniform float uTime; uniform float uWind; attribute float meadowFlex;\n'+s.vertexShader;
  s.vertexShader=s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   vec3 root=instanceMatrix[3].xyz;
   float wave=sin(uTime*1.18+root.x*.48+root.z*.33)+.34*sin(uTime*1.89+root.z*.91);
   transformed.x+=wave*uWind*.055*meadowFlex;
   transformed.z+=sin(uTime*.83+root.x*.39)*uWind*.024*meadowFlex;`);
 };
 material.customProgramCacheKey=()=> 'meadow-lambert-v13';
}
export function meadowPlacements(f){
 const key=`${f.worldSeed}:${f.x}:${f.z}`,previous=cache.get(key);
 if(previous){cache.delete(key);cache.set(key,previous);return previous}
 const result=Object.fromEntries([...kinds,'sward'].map(k=>[k,[]]));if(!f.meadow)return result;
 const r=random(f.seed^0x718ab133),env={},road={},fernParents=[],wx=periodOrigin(f.x),wz=periodOrigin(f.z),shade=new Float32Array(17*17);
 for(let j=0;j<17;j++)for(let i=0;i<17;i++){
  let s=0;const x=i*4,z=j*4;
  for(const t of f.trees)s=Math.max(s,clamp(1-Math.hypot(x-t.x,z-t.z)/((t.variant===5?2:4.8)*t.scale))*.94);
  for(const t of f.shrubs)s=Math.max(s,clamp(1-Math.hypot(x-t.x,z-t.z)/(t.width*t.scale*.7+1.2))*.68);
  shade[j*17+i]=s;
 }
 // Every interior cell receives overlapping sward. Variation changes plant
 // height, leaf content and spread; it no longer deletes most ground cover.
 for(let j=0;j<100;j++)for(let i=0;i<100;i++){
  const x=(i+.15+r()*.70)*.64,z=(j+.15+r()*.70)*.64;
  const accept=r(),pick=r(),angle=r()*Math.PI*2,variant=Math.floor(r()*4),scale=.86+r()*.29,tint=.91+r()*.16;
  meadowEnvironment(x,z,f.meadow,env);if(env.cover<.16||accept>Math.min(1,env.cover*2.5))continue;
  if(inClearing(x,z,f)||farmFootprintDistance(x,z,f)<3)continue;
  roadProfile(x,z,f,road);if(road.distance<2.3)continue;
  const px=x+wx,pz=z+wz,patch=noise(px*.16,pz*.16),colony=noise(px*.067+91,pz*.067-27);
  const ix=Math.min(15,Math.floor(x/4)),iz=Math.min(15,Math.floor(z/4)),u=x/4-ix,v=z/4-iz,q=iz*17+ix;
  const actualShade=(shade[q]*(1-u)+shade[q+1]*u)*(1-v)+(shade[q+17]*(1-u)+shade[q+18]*u)*v;
  const wet=clamp(env.moisture+actualShade*.24),low=env.shortness;
  const density=clamp(env.patchDensity*.65+patch*.50),height=(.22+density*density*.90)*(1-low*.30);
  const y=surfaceHeight(x,z,f),width=1.13+patch*.26;
  result.sward.push({x,z,y,angle,variant,width,height:height*scale,tint});
  const stem={x,z,y,angle,variant:variant%2,scale,heightScale:.82+density*.32,tint,lod:accept};
  // Small, cohesive fern colonies. Large dissected fronds are sparse enough
  // to keep their detail budget bounded while overlapping at leaf tips.
  const fernSuit=actualShade>.1&&wet>.4&&colony>.39;
  if(fernSuit&&pick<.028&&fernParents.length<8&&result.fern.length<140&&!fernParents.some(p=>Math.hypot(p.x-x,p.z-z)<2.3)){
   fernParents.push({x,z});const q=random(f.seed^((i+j*100)*73819)),wood=actualShade>.4,n=wood?4:12+Math.floor(q()*5);
   for(let k=0;k<n;k++){
    const a=q()*6.283,rad=Math.sqrt(q())*(wood?.76:.58),fx=x+Math.cos(a)*rad,fz=z+Math.sin(a)*rad;
    if(fx<.1||fz<.1||fx>63.9||fz>63.9||inClearing(fx,fz,f)||roadProfile(fx,fz,f,{}).distance<2.4)continue;
    result.fern.push({...stem,x:fx,z:fz,y:surfaceHeight(fx,fz,f),angle:q()*6.283,variant:wood?2:k%2,scale:.73+q()*.36,heightScale:.83+q()*.28});
   }
   continue;
  }
  if(pick<.026&&colony>.45&&wet<.6){result.seedgrass.push(stem);continue}
  if(pick<.065&&patch>.54){result.tallgrass.push(stem);continue}
  if(pick>.996&&colony>.53&&wet<.65){result.daisy.push(stem);continue}
  if(pick>.92&&patch>.36)result.shortgrass.push({...stem,scale:scale*1.25});
 }
 cache.set(key,result);if(cache.size>CACHE_LIMIT)cache.delete(cache.keys().next().value);return result;
}
export function makeMeadowVegetation(f,level,wind){
 const group=new T.Group();group.name='clustered-meadow-community';if(!f.meadow)return group;
 resources(wind);const points=meadowPlacements(f),lod=['near','mid','far'][Math.min(2,level)],dummy=new T.Object3D(),tone=new T.Color(),counts={};
 group.add(makeSward(f,points.sward,level,wind));counts.sward=points.sward.length;
 for(const kind of kinds)for(let variant=0;variant<(kind==='fern'?3:2);variant++){
  // The canopy always remains; only tiny interior geometric accents thin.
  const list=points[kind].filter(p=>p.variant===variant&&(level<2||kind==='fern'||kind==='seedgrass'));
  if(!list.length)continue;counts[kind]=(counts[kind]||0)+list.length;
  const mesh=new T.InstancedMesh(assets[kind][lod][variant],material,list.length);mesh.name=`meadow-${kind}-${variant}`;mesh.receiveShadow=true;
  list.forEach((p,i)=>{dummy.position.set(p.x,p.y-.009,p.z);dummy.rotation.set(0,p.angle,0);dummy.scale.set(p.scale,p.scale*p.heightScale,p.scale);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);tone.setRGB(p.tint,p.tint,p.tint);mesh.setColorAt(i,tone)});
  mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;mesh.computeBoundingBox();mesh.computeBoundingSphere();mesh.boundingSphere.radius+=.15;group.add(mesh);
 }
 let draws=0,triangles=0;group.traverse(m=>{if(m.geometry){draws++;triangles+=(m.geometry.index?.count||m.geometry.attributes.position.count)/3*(m.count||1)}});
 group.userData.plants=counts;group.userData.meadowStats={counts,draws,triangles};return group;
}
export const isSharedMeadowResource=r=>shared.has(r)||isSharedSwardResource(r);
export function meadowPlacementCacheStats(){return {entries:cache.size,limit:CACHE_LIMIT}}
