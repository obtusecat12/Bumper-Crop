import * as T from './vendor/three.module.min.js';
import {createMeadowPlantAssets} from './meadow-plants.js?v=12';
import {meadowEnvironment} from './meadow-layout.js?v=12';
import {random,periodOrigin,roadProfile,inClearing,surfaceHeight,pondMetrics} from './world.js?v=12';
import {farmFootprintDistance} from './farm-layout.js?v=12';

const shared=new Set(),kinds=['shortgrass','tallgrass','seedgrass','fern','daisy'];
let assets,material;
const clamp=x=>Math.max(0,Math.min(1,x));
function hash(x,z){let h=Math.imul(x,374761393)^Math.imul(z,668265263);h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296}
function noise(x,z){const a=Math.floor(x),b=Math.floor(z);let u=x-a,v=z-b;u=u*u*(3-2*u);v=v*v*(3-2*v);return (hash(a,b)*(1-u)+hash(a+1,b)*u)*(1-v)+(hash(a,b+1)*(1-u)+hash(a+1,b+1)*u)*v}
function resources(wind){
 if(assets)return;
 assets=createMeadowPlantAssets({variants:2});for(const g of assets.geometries)shared.add(g);
 material=new T.MeshStandardMaterial({vertexColors:true,roughness:1,side:T.DoubleSide});shared.add(material);
 material.onBeforeCompile=s=>{
  s.uniforms.uTime=wind.time;s.uniforms.uWind=wind.strength;
  s.vertexShader='uniform float uTime; uniform float uWind; attribute float meadowFlex;\n'+s.vertexShader;
  s.vertexShader=s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   vec3 root=vec3(0.);
   #ifdef USE_INSTANCING
   root=instanceMatrix[3].xyz;
   #endif
   float wave=sin(uTime*1.31+root.x*.63+root.z*.41)+.38*sin(uTime*2.07+root.z*1.3);
   float attachedFlex=pow(clamp(position.y,0.,1.3),2.);
   transformed.x+=wave*uWind*.055*attachedFlex;
   transformed.z+=sin(uTime*.93+root.x*.72)*uWind*.024*attachedFlex;`);
 };
 material.customProgramCacheKey=()=> 'meadow-rooted-wind-v12';
}

// A density field creates colonies; jittered candidates only resolve the final
// small-scale spacing. Every LOD uses the same candidates and random draws.
export function meadowPlacements(f){
 const result=Object.fromEntries(kinds.map(k=>[k,[]]));if(!f.meadow)return result;
 const r=random(f.seed^0x718ab132),env={},road={},wx=periodOrigin(f.x),wz=periodOrigin(f.z);
 const shade=new Float32Array(17*17);
 for(let j=0;j<17;j++)for(let i=0;i<17;i++){
  let s=0;const x=i*4,z=j*4;
  for(const t of f.trees){const radius=(t.variant===5?2:4.8)*t.scale;s=Math.max(s,clamp(1-Math.hypot(x-t.x,z-t.z)/radius)*.94)}
  for(const t of f.shrubs){const radius=t.width*t.scale*.7+1.2;s=Math.max(s,clamp(1-Math.hypot(x-t.x,z-t.z)/radius)*.68)}
  shade[j*17+i]=s;
 }
 for(let j=0;j<160;j++)for(let i=0;i<160;i++){
  const x=(i+.08+r()*.84)*.4,z=(j+.08+r()*.84)*.4;
  const accept=r(),choose=r(),variant=Math.floor(r()*2),angle=r()*Math.PI*2,scale=.76+r()*.5,tint=.87+r()*.24,lod=r();
  meadowEnvironment(x,z,f.meadow,env);if(env.cover<.14)continue;
  if(inClearing(x,z,f)||farmFootprintDistance(x,z,f)<3.0)continue;
  if(f.type==='pond'&&pondMetrics(x,z,f).metres<1.3)continue;
  roadProfile(x,z,f,road);if(road.distance<2.25)continue;
  const px=x+wx,pz=z+wz,patch=noise(px*.22,pz*.22),colony=noise(px*.063+91,pz*.063-27);
  const density=clamp((env.patchDensity-.22)*2.3)*(.16+.84*clamp((patch-.24)*2.4));
  if(accept>env.cover*(.13+.82*density))continue;
  const ix=Math.min(15,Math.floor(x/4)),iz=Math.min(15,Math.floor(z/4)),u=x/4-ix,v=z/4-iz,q=iz*17+ix;
  const actualShade=(shade[q]*(1-u)+shade[q+1]*u)*(1-v)+(shade[q+17]*(1-u)+shade[q+18]*u)*v;
  const wet=clamp(env.moisture+actualShade*.24),low=env.shortness;
  const fern=(actualShade>.14?1:0)*clamp((wet-.40)*3.1+actualShade*.85)*clamp((colony-.32)*3.0)*(1-low)*.70;
  const seed=clamp((.69-wet)*1.6)*clamp((colony-.23)*2.2)*(1-low)*.40;
  const tall=(.13+clamp((patch-.35)*2)*.40)*(1-low*.90);
  const flower=colony>.57&&wet<.62?(1-low*.6)*.023:0;
  let kind=choose<fern?'fern':choose<fern+seed?'seedgrass':choose<fern+seed+tall?'tallgrass':choose>1-flower?'daisy':'shortgrass';
  // Pale dry tips, different heights and bends belong to plant geometry;
  // habitat tint stays subtle so colonies do not look painted in flat colors.
  result[kind].push({x,z,variant,angle,scale:scale*(kind==='shortgrass'?1.10:1),heightScale:(.68+patch*.64)*(1-low*(kind==='shortgrass'?.20:.52)),tint,lod});
  // Tall culms emerge through a lower sward rather than replacing it with
  // bare green ground. Reuse the same root, keeping terrain contact exact.
  if(kind!=='shortgrass'&&accept<env.cover*density*.62)
   result.shortgrass.push({x,z,variant:1-variant,angle:angle+1.8,scale:scale*.94,heightScale:.68+patch*.35,tint:tint*.97,lod});
 }
 return result;
}

export function makeMeadowVegetation(f,level,wind){
 const group=new T.Group();group.name='clustered-meadow-community';if(!f.meadow)return group;
 resources(wind);const points=meadowPlacements(f),lod=['near','mid','far'][Math.min(2,level)],dummy=new T.Object3D(),tone=new T.Color();
 const counts={};
 for(const kind of kinds)for(let variant=0;variant<2;variant++){
  const list=points[kind].filter(p=>p.variant===variant&&(level===0||p.lod<(level===1?.52:.18)));
  if(!list.length)continue;counts[kind]=(counts[kind]||0)+list.length;
  const mesh=new T.InstancedMesh(assets[kind][lod][variant],material,list.length);mesh.name=`meadow-${kind}-${variant}`;
  list.forEach((p,i)=>{dummy.position.set(p.x,surfaceHeight(p.x,p.z,f)-.008,p.z);dummy.rotation.set(0,p.angle,0);dummy.scale.set(p.scale,p.scale*p.heightScale,p.scale);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);tone.setRGB(p.tint,p.tint,p.tint);mesh.setColorAt(i,tone)});
  mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;mesh.computeBoundingBox();mesh.computeBoundingSphere();mesh.boundingSphere.radius+=.12;mesh.receiveShadow=true;group.add(mesh);
 }
 group.userData.plants=counts;group.userData.meadowStats={counts,draws:group.children.length,triangles:group.children.reduce((n,m)=>n+(m.geometry.index?.count||m.geometry.attributes.position.count)/3*m.count,0)};return group;
}
export const isSharedMeadowResource=r=>shared.has(r);
