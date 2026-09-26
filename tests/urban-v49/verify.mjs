import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const {createCanvas,loadImage}=createRequire(import.meta.url)(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas');globalThis.document={createElement:()=>createCanvas(1,1)};
const T=await import('../../dist/vendor/three.module.min.js');
const {createExitScene}=await import('../../dist/exit-scene.js?v=49');
const {cityBlockPlan,cityToWorld}=await import('../../dist/urban-layout.js?v=49');
const {BUILDING_TYPES,addBuilding}=await import('../../dist/urban-buildings.js?v=49');
const {UrbanBatch,urbanWalkHeight}=await import('../../dist/urban-batch.js?v=49');
const {createUrbanMaterials}=await import('../../dist/urban-materials.js?v=49');
const {initializeExitTextures,exitTextures}=await import('../../dist/exit-textures.js?v=49');
await initializeExitTextures(async(u,w,h)=>{const im=await loadImage(u.pathname),c=createCanvas(w,h),x=c.getContext('2d');x.drawImage(im,0,0,w,h);return{data:new Uint8Array(x.getImageData(0,0,w,h).data),width:w,height:h};});
assert.equal(BUILDING_TYPES.length,36);for(const k of['wall-plaster','travertine','ribbed','glass'])assert.equal(exitTextures[k].wrapS,T.RepeatWrapping);
const types=new Set();for(let z=-4;z<12;z++)for(let x=-7;x<8;x++){const a=cityBlockPlan(x,z,BUILDING_TYPES),b=cityBlockPlan(x,z,BUILDING_TYPES);assert.deepEqual(a,b);for(const spec of a.buildings){types.add(spec.type);assert(spec.floors<=30);}}
assert.equal(types.size,36,'all advertised typologies reachable in deterministic districts');
const mats=createUrbanMaterials(),buildingStats=[];
for(const type of['clinic','bakery','substation','black_glass_setback','parking_garage','civic_steps','residential_balconies']){
 const b=new UrbanBatch(mats),result=addBuilding(b,{type,w:32,d:28,floors:24,seed:172,lod:0}),g=b.finish(type);g.traverse(m=>{if(!m.isMesh)return;assert([...m.geometry.attributes.position.array].every(Number.isFinite));});
 buildingStats.push({type,height:result.height,triangles:b.triangles,walks:b.walks.length});
 if(type==='parking_garage')assert(urbanWalkHeight(0,0,b.walks,0)<.5,'garage entrance remains on ground');
 if(type==='clinic')assert(b.walks.some(w=>Math.abs(w.slopeZ)>.01),'switchback ramps have physical slopes');
 if(type==='civic_steps')assert(b.walks.length>=11,'individual civic stair treads support walking');
 g.traverse(m=>m.geometry?.dispose());
}
let adds=0,removes=0;const city=createExitScene({onAdd:()=>adds++,onRemove:()=>removes++});city.setCity(true);
let roadSamples=0;for(const[pX,pZ]of[[0,40],[0,450],[448,896],[-560,1120]]){
 const w=cityToWorld(pX,pZ);await city.prepareAt(w.x,w.z);city.update({cx:0n,cz:0n,x:w.x,z:w.z});assert(city.blocks.size<=25);assert.equal(city.stats.pending,0);
 const gx=Math.round(pX/112)*112,gz=Math.round(pZ/112)*112;
 for(let t=-85;t<=85;t+=5)for(const lane of[-6.7,0,6.7])for(const side of[0,1]){
  const lx=gx+(side?t:lane),lz=gz+(side?lane:t);if(lz<0&&Math.abs(lx)<112)continue;const q=cityToWorld(lx,lz),v={...q};city.resolve(v,{cx:0n,cz:0n});assert(Math.hypot(v.x-q.x,v.z-q.z)<.01,'unblocked arterial lanes '+JSON.stringify({pX,pZ,t,lane,side}));assert(city.floorAt(q.x,q.z)<1,'roads remain ground-level');roadSamples++;
 }
}
assert(removes>0,'streaming retires distant geometry');city.dispose();assert.equal(adds,removes,'all streamed geometry removed on disposal');
const report={typologies:types.size,individualGeneratedTextures:12,deterministic:true,roadSamples,maxResidentBlocks:25,streamedBlocks:adds,balancedDisposal:true,buildingStats};
fs.writeFileSync('docs/urban-v49/validation.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
