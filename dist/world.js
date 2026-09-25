import {patchworkContext as legacyPatchContext} from './patchwork-legacy.js?v=38';
import {createLakeRoadRouter} from './lake-routing.js?v=38';
import {createCompoundPlanner,compoundSample} from './road-compounds.js?v=38';
import {ARRIVAL_COMPONENTS,arrivalCompound} from './arrival-compound.js?v=38';
import {farmAccessContext,farmAccessSample} from './farm-access.js?v=38';
import {field as frozenArrivalField,roadProfile as legacyRoadProfile,cropSample as legacyCropSample} from './world-legacy.js?v=38';
import {macroPlan,patchworkContext,parcelSample,configurePatchwork} from './patchwork.js?v=38';
import {pondTerrainHeight,pondBounds} from './lake-shape.js?v=38';
import {REFERENCE_BARN,barnContext,barnEntrance,barnFootprintDistance,barnGroundHeight} from './reference-barn-layout.js?v=38';
import {meadowForTile,meadowSample,meadowEnvironment,meadowFloorDiv} from './meadow-layout.js?v=38';
import {FARM,FARM_FOOTPRINTS,farmFootprintDistance,farmContext,farmMask,farmRoadWeight,farmGroundHeight,farmClearing,farmExcludesLake} from './farm-layout.js?v=38';
import {createSettlementPlanner} from './rural-settlements.js?v=38';
import {pondRadius,pondPoint,pondDistance,pondMetrics,pondBankPoint,pondShoreDistance} from './lake-shape.js?v=38';
export {pondRadius,pondPoint,pondDistance,pondMetrics,pondBankPoint,pondShoreDistance};
// Infinite signed BigInt cells with deterministic seed-based generation.
export const CHUNK=64;
export const mod=(n,m)=>((n%m)+m)%m;
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a),0,1);return t*t*(3-2*t)};
export function stringSeed(value){let h=2166136261;for(const c of String(value))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0}
export function chunkSeed(x,z,seed){return stringSeed(`${seed}:${x}:${z}`)}
export function random(seed){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
const settlements=createSettlementPlanner({chunkSeed,random,stringSeed});
export function periodOrigin(index){return Number(mod(index,1024n))*CHUNK}
export function height(x,z,cx=0n,cz=0n){const a=x+periodOrigin(cx),b=z+periodOrigin(cz),p=Math.PI*2/65536;return Math.sin(a*p*256)*.22+Math.cos(b*p*128)*.20+Math.sin((a+b)*p*64)*.27}
const SIZES=[[7,9,3],[2.8,3.2,2.7],[12,17,4.9],[13,19,5.1],[11,15,4.3],[13,9,3.7],[13,18,3.8],[8,11,3.2]];
export const BUILDING_NAMES=['风化木棚','旧外屋','红色谷仓','折线顶谷仓','砖砌谷仓','农具棚','空马厩','斜顶仓房'];
export function buildingSize(f){return (f.buildingDimensions||SIZES[f.variant%8]).map(v=>v*(f.buildingScale||1))}
export function buildingLocal(x,z,f){const a=f.buildingAngle||0,dx=x-f.cx,dz=z-f.cz;return {x:Math.cos(a)*dx-Math.sin(a)*dz,z:Math.sin(a)*dx+Math.cos(a)*dz}}
function landmark(x,z,seed){if(x===0n&&z===0n)return {type:'building',rank:0};if(x===-1n&&z===0n)return {type:'pond',rank:0};const r=random(chunkSeed(x,z,seed)^0x88aa72),v=r();return {type:v<.075?'pond':v<.13?'building':'wheat',rank:r()}}
function hasBuilding(x,z,seed,rank){if(x===0n&&z===0n)return true;for(let dz=-2;dz<=2;dz++)for(let dx=-2;dx<=2;dx++){if(!dx&&!dz)continue;const other=landmark(x+BigInt(dx),z+BigInt(dz),seed);if(other.type==='building'&&other.rank<=rank)return false}return true}
function lane(axis,index,segment,seed,edge){const line=random(stringSeed(`${seed}:lane:${axis}:${index}`)),enabled=index===0n||line()<(axis==='x'?.76:.41),r=random(stringSeed(`${seed}:curve:${axis}:${index}:${segment}`));return {axis,edge,enabled,amplitude:(r()-.5)*1.1,harmonic:(r()-.5)*.32}}
export function laneOffset(l,t){return l.amplitude*Math.sin(Math.PI*t/64)+l.harmonic*Math.sin(Math.PI*t/32)}
// Unified lane sampling for wheel geometry, clearing and collision.
// Uses the existing laneOffset, smooth and building helpers. No per-query allocations.
// The terrain shader in ground.js mirrors these constants and equations.
const roadState={distance:0,rut:0,junction:0,crown:0,relief:0};
function collectRoad(out,d,t,weight=1){
 if(weight<=0)return;
 const clearance=d+(1-weight)*2.6;if(clearance<out.distance){out.distance=clearance;out.along=t}
 if(d>2.65)return;
 const phase=t*Math.PI/32;
 const offset=.77+.020*Math.sin(phase*5)+.012*Math.sin(phase*11);
 const width=.235+.022*Math.sin(phase*3)+.012*Math.sin(phase*7);
 const rut=(1-smooth(width*.42,width+.075,Math.abs(d-offset)))*weight;
 const depth=.070+.011*Math.sin(phase*2)+.007*Math.sin(phase*5);
 out.rut=Math.max(out.rut,rut);
 out.cut=Math.max(out.cut,rut*depth);
 out.crown=Math.max(out.crown,(1-smooth(.06,.49,d))*.014*weight);
 const cover=(1-smooth(.86,1.80,d))*weight;
 if(cover>out.first){out.second=out.first;out.first=cover}else out.second=Math.max(out.second,cover);
}
const parcelRoad={},cropScratch={},legacyFields=new WeakMap();
function legacyField(f){let old=legacyFields.get(f);if(!old){old={...f,patch:legacyPatchContext(f.x,f.z,f.worldSeed)};legacyFields.set(f,old)}return old;}
const landmarkCropParcels=new Map();
function reservedCrops(seed){let ids=landmarkCropParcels.get(seed);if(ids)return ids;ids=new Set();
 for(const landmark of [FARM,REFERENCE_BARN]){const x=BigInt(Math.floor(landmark.x/64)),z=BigInt(Math.floor(landmark.z/64));ids.add(parcelSample(landmark.x-Number(x)*64,landmark.z-Number(z)*64,{x,z,worldSeed:seed},{}).id);}
 landmarkCropParcels.set(seed,ids);if(landmarkCropParcels.size>16)landmarkCropParcels.delete(landmarkCropParcels.keys().next().value);return ids;
}
export function cropSample(x,z,f,out={}){
 if(arrivalRoadWeight(x,z,f)===1)return legacyCropSample(x,z,legacyField(f),out);
 parcelSample(x,z,f,out);
 // Reserve complete parcels around authored landmarks, never a camera-shaped mask.
 if(reservedCrops(f.worldSeed).has(out.id))out.crop=0;
 return out;
}
export function lakeRoadClearance(x,z,f){let d=1e4;for(const lake of f.roadLakes||[])d=Math.min(d,pondShoreDistance(x,z,lake));return d;}
// Restore the authored arrival walk and the nearby barns inside a local window.
// Only this small neighborhood uses the former lanes; the infinite farm parcels stay.
export function arrivalRoadWeight(x,z,f){
 if(f.x< -4n||f.x>4n||f.z< -4n||f.z>4n)return 0;
 const wx=Number(f.x)*64+x,wz=Number(f.z)*64+z;
 return 1-smooth(0,72,Math.max(-40-wx,wx-128,-144-wz,wz-128));
}
function baseRoadProfile(x,z,f,out=roadState,includeDrive=true){
 out.mud=0;
 if(arrivalRoadWeight(x,z,f)===1){
  legacyRoadProfile(x,z,legacyField(f),out,includeDrive);
  const lakeD=lakeRoadClearance(x,z,f),end=smooth(30,35,lakeD);
  for(const l of f.roads){if(!l.enabled)continue;const t=l.axis==='x'?z:x,d=Math.abs((l.axis==='x'?x:z)-l.edge-laneOffset(l,t)),w=farmRoadWeight(x,z,f)*end;out.distance=Math.min(out.distance,d+(1-smooth(0,.10,w))*16);}
  if(includeDrive&&f.driveway){const a=f.driveway,vx=a.x2-a.x1,vz=a.z2-a.z1,len=Math.hypot(vx,vz);if(len>.01){const dx=x-a.x1,dz=z-a.z1,t=(dx*vx+dz*vz)/len,across=Math.abs(dx*vz-dz*vx)/len,w=smooth(-4.6,-2.2,t)*(1-smooth(len-.04,len+.72,t))*end*smooth(0,.26,Math.min(x,z,64-x,64-z))*smooth(-1.6,3.4,t);out.distance=Math.min(out.distance,across+(1-smooth(0,.10,w))*16);}}
  out.distance=Math.max(out.distance,32.1-lakeD);return out;
 }
 out.distance=1e4;out.along=z;out.rut=0;out.cut=0;out.crown=0;out.first=0;out.second=0;out.mud=0;
 const p=parcelSample(x,z,f,parcelRoad),lakeD=lakeRoadClearance(x,z,f),arrival=arrivalRoadWeight(x,z,f);
 let weight=(1-arrival)*smooth(3,10,farmFootprintDistance(x,z,f))*smooth(3,9,barnFootprintDistance(x,z,f));
 if(f.type==='building'){const b=buildingLocal(x,z,f),size=buildingSize(f);weight*=smooth(1,3,Math.max(Math.abs(b.x)-size[0]/2,Math.abs(b.z)-size[1]/2));}
 // Negative inside the road. max intersects road and the dry 30m lake buffer.
 const signed=Math.max(p.distance-p.width*.5,(p.noRelief?0:22)-lakeD),endWeight=p.noRelief?1:smooth(21,24,lakeD);
 const d=p.distance*4/p.width,d2=p.second*4/p.width2;
 collectRoad(out,d,p.roadAlong,weight*endWeight*p.endWeight);
 collectRoad(out,d2,p.roadAlong2,weight*endWeight*p.endWeight2);
 out.distance=Math.max(signed+2.1,p.distance*4/p.width+(1-smooth(0,.10,weight*endWeight*p.endWeight))*16);
 if(arrival>0)for(const l of f.roads){
  if(!l.enabled)continue;const t=l.axis==='x'?z:x,d=Math.abs((l.axis==='x'?x:z)-l.edge-laneOffset(l,t)),w=arrival*farmRoadWeight(x,z,f)*endWeight,previous=out.distance;
  collectRoad(out,d,t,w);out.distance=Math.min(previous,d+(1-smooth(0,.10,w))*16);
 }
 if(includeDrive&&f?.driveway){
  const a=f.driveway,vx=a.x2-a.x1,vz=a.z2-a.z1,len=Math.hypot(vx,vz);
  if(len>.01){const dx=x-a.x1,dz=z-a.z1,t=(dx*vx+dz*vz)/len,across=Math.abs(dx*vz-dz*vx)/len;
   const boundary=smooth(0,.26,Math.min(x,z,64-x,64-z));
   const corridor=smooth(-4.6,-2.2,t)*(1-smooth(len-.04,len+.72,t)),visibility=endWeight*boundary*(1-arrival+arrival*smooth(-1.6,3.4,t)),previous=out.distance;
   collectRoad(out,across,t,corridor*visibility);
   out.distance=Math.min(previous,across+(1-smooth(0,.10,corridor*visibility))*16);
  }
 }
 if(!p.noRelief)out.distance=Math.max(out.distance,24.1-lakeD);
 if(lakeD<22&&!p.noRelief){out.rut=0;out.cut=0;out.crown=0;out.second=0;out.first=0;}
 if(p.turnaround>0){out.distance=Math.min(out.distance,(1-p.turnaround)*4);out.rut=Math.max(out.rut,p.turnaround*.82);out.second=Math.max(out.second,p.turnaround*.80);}
 out.mud=Math.max(p.turnaround,p.noRelief?out.rut*.60:0)*(1-arrival);
 out.junction=out.second;out.relief=(-out.cut-.018*out.junction+out.crown*(1-out.rut)*(1-out.junction))*smooth(30,35,lakeD)*(p.noRelief?0:1)*(1-p.turnaround);
 return out;
}
const accessScratch={},compoundScratch={};
export function compoundAt(x,z,f,out={}){return compoundSample(x,z,f.compounds,out);}
export function roadProfile(x,z,f,out=roadState,includeDrive=true){
 baseRoadProfile(x,z,f,out,includeDrive);out.yard=0;
 if(includeDrive&&f.compounds?.length){const c=compoundSample(x,z,f.compounds,compoundScratch);out.yard=c.yard;const d=(c.driveway+c.drivewayWidth*.5)*4/c.drivewayWidth;if(d<3.2){const old=out.distance;collectRoad(out,d,c.drivewayAlong,1);out.distance=Math.min(old,d);out.junction=out.second;out.relief=-out.cut-.018*out.junction+out.crown*(1-out.rut)*(1-out.junction);}}
 if(includeDrive&&f.farmAccess){
  const a=farmAccessSample(x,z,f.farmAccess,accessScratch);
  if(a.distance<3.2){const old=out.distance;collectRoad(out,a.distance*4/3.5,a.along,1);out.distance=Math.min(old,a.distance*4/3.5);out.junction=out.second;out.relief=-out.cut-.018*out.junction+out.crown*(1-out.rut)*(1-out.junction);}
  out.yard=Math.max(out.yard,a.yard);
 }
 return out;
}
export function roadDistance(x,z,f){return roadProfile(x,z,f,roadState).distance;}
export function roadSample(x,z,f,includeDrive=true){
 const out=roadProfile(x,z,f,{},includeDrive);
 return {distance:out.distance,along:out.along};
}
export function roadRelief(x,z,f,includeDrive=true){return roadProfile(x,z,f,roadState,includeDrive).relief}

const heightMetrics={};
export function surfaceHeight(x,z,f,includeDrive=true){let y=height(x,z,f.x,f.z);if(f.type==='pond'){const m=pondMetrics(x,z,f,heightMetrics);if(m.rawMetres<28)return pondTerrainHeight(x,z,f,y)+roadRelief(x,z,f,includeDrive)*smooth(.75,1.05,m.bank)}
 if(f.type==='building'){const angle=f.buildingAngle||0,dx=x-f.cx,dz=z-f.cz,px=Math.cos(angle)*dx-Math.sin(angle)*dz,pz=Math.sin(angle)*dx+Math.cos(angle)*dz,size=SIZES[f.variant%8],scale=f.buildingScale||1,edge=Math.max(Math.abs(px)-size[0]*scale/2,Math.abs(pz)-size[1]*scale/2),a=smooth(.2,3.3,edge);y=(f.buildingY-.04)*(1-a)+y*a}y=barnGroundHeight(x,z,f,farmGroundHeight(x,z,f,y));if(f.compounds?.length){const c=compoundSample(x,z,f.compounds,compoundScratch);if(c.footprint<3.3&&Number.isFinite(c.groundY))y+=(c.groundY-.04-y)*(1-smooth(.2,3.3,c.footprint));}return y+roadRelief(x,z,f,includeDrive);}
export function inClearing(x,z,f){if(f.compounds?.length&&compoundSample(x,z,f.compounds,compoundScratch).clearing)return true;if(f.farmAccess&&farmAccessSample(x,z,f.farmAccess,accessScratch).yard>.05)return true;if(barnEntrance(x,z,f)||barnFootprintDistance(x,z,f)<.7)return true;if(farmClearing(x,z,f))return true;if(f.type==='pond'){const m=pondMetrics(x,z,f);return m.metres<m.width+1.5;}if(f.type==='building'){const p=buildingLocal(x,z,f),[w,d]=buildingSize(f);return Math.abs(p.x)<w/2+3.4&&Math.abs(p.z)<d/2+4.3}return false}
function vegetationCover(f){const buckets=new Map();for(const t of [...f.trees.map(t=>({x:t.x,z:t.z,r:1.15*t.scale})),...f.shrubs.map(s=>({x:s.x,z:s.z,r:s.width*s.scale*.46}))]){for(let z=Math.floor((t.z-t.r)/4);z<=Math.floor((t.z+t.r)/4);z++)for(let x=Math.floor((t.x-t.r)/4);x<=Math.floor((t.x+t.r)/4);x++){const key=z*17+x;if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(t)}}f.cover=buckets}
function addVegetation(f,r){const valid=(x,z,margin=0)=>x>2.5&&x<61.5&&z>2.5&&z<61.5&&roadDistance(x,z,f)>2.7+margin&&!inClearing(x,z,f),addTree=(x,z,v,scale)=>{if(!valid(x,z))return;f.trees.push({x,z,variant:v,scale,rotation:r()*Math.PI*2,seed:Math.floor(r()*4294967296)})};const mode=r();f.vegetationMode=mode<.021?'windbreak':mode<.080?'grove':'scattered';
 if(f.vegetationMode==='windbreak'){const side=r()<.5,offset=6+r()*5,v=r()<.7?5:1;for(let i=0;i<10;i++)for(let row=0;row<(r()<.23?2:1);row++){const t=9+i*4.4+(r()-.5)*.9;addTree(side?offset+row*3.4:t,side?t:offset+row*3.4,v,.75+r()*.35)}}
 else if(f.vegetationMode==='grove'){const gx=12+r()*39,gz=12+r()*39,n=7+Math.floor(r()*5),v=Math.floor(r()*5);for(let i=0;i<n;i++){const a=i*2.399+r()*.6,rad=2+Math.sqrt(r())*6;addTree(gx+Math.cos(a)*rad,gz+Math.sin(a)*rad,r()<.72?v:Math.floor(r()*6),.62+r()*.55)}}
 else{const n=r()<.36?0:1+Math.floor(r()*3);for(let i=0;i<n;i++){const side=r()<.5;addTree(side?4+r()*5:8+r()*48,side?8+r()*48:4+r()*5,Math.floor(r()*6),.67+r()*.65)}}
 // Sparse irregular thickets are owned by 128 m cells, not field-edge rows.
 // Parent/offspring coordinates are shared on both sides of tile boundaries.
 const mx=meadowFloorDiv(f.x,2n),mz=meadowFloorDiv(f.z,2n);
 for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){
  const ax=mx+BigInt(dx),az=mz+BigInt(dz),q=random(chunkSeed(ax,az,f.worldSeed)^0x532f901);
  if(q()>.49)continue;
  const cx=Number(ax*2n-f.x)*64+q()*128,cz=Number(az*2n-f.z)*64+q()*128;
  const radius=3+q()*7,stretch=.5+q()*.8,turn=q()*6.283,n=3+Math.floor(q()*8),dominant=Math.floor(q()*4);
  for(let j=0;j<n;j++){
   const a=q()*6.283,rad=Math.sqrt(q())*radius,u=Math.cos(a)*rad,v=Math.sin(a)*rad*stretch;
   const x=cx+Math.cos(turn)*u-Math.sin(turn)*v,z=cz+Math.sin(turn)*u+Math.cos(turn)*v;
   const width=.8+q()*1.65,scale=.58+q()*.66,rotation=q()*6.283,variant=q()<.65?dominant:Math.floor(q()*4),seed=Math.floor(q()*4294967296);
   if(x<0||z<0||x>64||z>64||roadDistance(x,z,f)<2.6||inClearing(x,z,f))continue;
   if(f.shrubs.some(p=>Math.hypot(x-p.x,z-p.z)<.5+(width*scale+p.width*p.scale)*.18))continue;
   f.shrubs.push({x,z,width,scale,rotation,variant,seed,thicket:true});
  }
 }
 vegetationCover(f);
}
// Independent succession stream: old tree/border and landmark random draws remain intact.
function addMeadowShrubs(f){
 if(!f.meadow)return;
 const r=random(f.seed^0x37ae182),env={},parents=[];
 for(let i=0;i<90&&parents.length<4;i++){
  const x=3+r()*58,z=3+r()*58;meadowEnvironment(x,z,f.meadow,env);
  if(env.cover<.16||env.cover>.91||env.patchDensity<.35||roadDistance(x,z,f)<3.5||inClearing(x,z,f)||f.farm&&farmMask(x+f.farm.x,z+f.farm.z)>.2)continue;
  if(parents.some(p=>Math.hypot(p.x-x,p.z-z)<9))continue;
  parents.push({x,z,variant:env.moisture>.55?2:r()<.7?1:3});
 }
 let added=0;
 for(const parent of parents)for(let i=0,n=2+Math.floor(r()*4);i<n&&added<12;i++){
  const a=r()*6.283,rad=Math.sqrt(r())*4.8,x=parent.x+Math.cos(a)*rad,z=parent.z+Math.sin(a)*rad;
  const cover=meadowSample(x,z,f.meadow);
  if(x<1||z<1||x>63||z>63||cover<.18||roadDistance(x,z,f)<3||inClearing(x,z,f)||f.farm&&farmMask(x+f.farm.x,z+f.farm.z)>.2)continue;
  if(f.shrubs.some(p=>Math.hypot(p.x-x,p.z-z)<(p.width*p.scale*.42+.65)))continue;
  f.shrubs.push({x,z,width:1.2+r()*1.35,scale:.66+r()*.42,rotation:r()*6.283,variant:r()<.80?parent.variant:Math.floor(r()*4),seed:Math.floor(r()*4294967296),meadow:true});added++;
 }
 if(added)vegetationCover(f);
}
const lakeMacros=new Map();
const floorBig=(x,n)=>x>=0n?x/n:(x-n+1n)/n;
function macroLake(mx,mz,seed){
 const key=`${seed}:${mx}:${mz}`;if(lakeMacros.has(key))return lakeMacros.get(key);
 const r=random(stringSeed('large-lake:'+key)),forced=mx===-1n&&mz===0n;
 let lake=null;
 if(forced||(!(mx===0n&&mz===0n)&&r()<.64)){
  const wx=forced?409:166+r()*180,wz=forced?32:166+r()*180;
  const ax=mx*8n+BigInt(Math.floor(wx/64)),az=mz*8n+BigInt(Math.floor(wz/64)),lx=wx%64,lz=wz%64;
  lake={lakeId:key,lakeSeed:stringSeed('shore:'+key),lakeOwnerX:ax,lakeOwnerZ:az,lakeLocalX:lx,lakeLocalZ:lz,rx:forced?66:44+r()*46,rz:forced?49:33+r()*36,angle:forced?-.14:(r()-.5)*Math.PI,shorePhase:forced?.73:r()*6.283,shoreAmplitude:forced?.28:.24+r()*.12,hill:forced?.63:r(),depth:1.8+r()*1.6};
  lake.lakeY=height(lx,lz,ax,az)-.48;
  lake.bounds=pondBounds(lake);
  // Water must sit below the surrounding undisturbed terrain on every side.
  let rim=lake.lakeY+.48;for(let z=lake.bounds[2];z<=lake.bounds[3];z+=12)for(let x=lake.bounds[0];x<=lake.bounds[1];x+=12)rim=Math.min(rim,height(lx+x,lz+z,ax,az));
  lake.lakeY=Math.min(lake.lakeY,rim-.18);
 }
 lakeMacros.set(key,lake);if(lakeMacros.size>128)lakeMacros.delete(lakeMacros.keys().next().value);
 return lake;
}
function lakeForTile(x,z,seed){
 const mx=floorBig(x,8n),mz=floorBig(z,8n);
 for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){
  const lake=macroLake(mx+BigInt(dx),mz+BigInt(dz),seed);if(!lake||farmExcludesLake(lake))continue;
  const cx=Number(lake.lakeOwnerX-x)*64+lake.lakeLocalX,cz=Number(lake.lakeOwnerZ-z)*64+lake.lakeLocalZ;
  if(cx+lake.bounds[1]<0||cx+lake.bounds[0]>64||cz+lake.bounds[3]<0||cz+lake.bounds[2]>64)continue;
  return {...lake,cx,cz};
 }
 return null;
}
function nearbyRoadLakes(x,z,seed){const result=[],mx=floorBig(x,8n),mz=floorBig(z,8n);
 for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){const l=macroLake(mx+BigInt(dx),mz+BigInt(dz),seed);if(!l||farmExcludesLake(l))continue;
 const cx=Number(l.lakeOwnerX-x)*64+l.lakeLocalX,cz=Number(l.lakeOwnerZ-z)*64+l.lakeLocalZ;
 if(cx+l.bounds[1]+70<0||cx+l.bounds[0]-70>64||cz+l.bounds[3]+70<0||cz+l.bounds[2]-70>64)continue;result.push({...l,cx,cz,type:'pond'});}
 return result;
}
export function field(x,z,seed,withVegetation=true){const cs=chunkSeed(x,z,seed),r=random(cs^0x127abab),candidate=landmark(x,z,seed);let type=candidate.type;if(type==='building'&&!hasBuilding(x,z,seed,candidate.rank))type='wheat';const settlementAddition=type==='wheat'&&settlements.additionalBuilding(x,z,seed);if(settlementAddition)type='building';const small=r()<.56,variant=small?[0,1,7][Math.floor(r()*3)]:[2,3,4,5,6][Math.floor(r()*5)],f={key:`${x},${z}`,x,z,type,variant,cx:18+r()*28,cz:18+r()*28,rx:7+r()**.65*13,rz:5+r()**.75*10,seed:cs,worldSeed:seed,tint:r(),trees:[],shrubs:[],angle:(r()-.5)*Math.PI,shorePhase:r()*6.283,shoreAmplitude:.045+r()*.065,hill:r(),depth:1+r()*1.7,buildingScale:.85+r()*.29};
 if(type==='building'&&!(x===0n&&z===0n))type=f.type='wheat';
 f.roads=[lane('x',x,z,seed,0),lane('x',x+1n,z,seed,64),lane('z',z,x,seed,0),lane('z',z+1n,x,seed,64)];
 const lake=lakeForTile(x,z,seed);if(lake){Object.assign(f,lake);type=f.type='pond';}else if(type==='pond'){type=f.type='wheat';}

 f.farm=farmContext(x,z);f.barn=barnContext(x,z);f.patch=patchworkContext(x,z,seed);f.roadLakes=nearbyRoadLakes(x,z,seed);f.farmAccess=farmAccessContext(x,z);f.compounds=[...compoundPlanner.context(x,z,seed).plans];const extension=arrivalCompound(x,z,height);if(extension)f.compounds.push(extension);
 if(f.barn&&type==='building'&&barnFootprintDistance(f.cx,f.cz,f)<18)type=f.type='wheat';
 if(f.farm&&type==='building'&&farmMask(f.cx+f.farm.x,f.cz+f.farm.z)>.4)type=f.type='wheat';
 if(type==='building'){if(x===0n&&z===0n){f.variant=2;f.cx=32;f.cz=27;f.buildingScale=.96}const endpoints=f.roads.filter(l=>l.enabled).map(l=>l.axis==='x'?{x:clamp(l.edge+laneOffset(l,f.cz),0,64),z:f.cz}:{x:f.cx,z:clamp(l.edge+laneOffset(l,f.cx),0,64)}).sort((a,b)=>Math.hypot(a.x-f.cx,a.z-f.cz)-Math.hypot(b.x-f.cx,b.z-f.cz));
 const target=x===0n&&z===0n?{x:0,z:29}:(endpoints[0]||{x:Math.max(4,f.cx-11),z:Math.min(60,f.cz+14)});const angleRandom=settlementAddition?random(settlements.hashBigInt(x,z,seed,'angle'))():r();f.buildingAngle=Math.atan2(target.x-f.cx,target.z-f.cz)+(angleRandom-.5)*.45;if(x===0n&&z===0n)f.buildingAngle=-Math.PI*.45;const [w,d]=buildingSize(f),dist=d/2+3.1;f.buildingY=height(f.cx,f.cz,x,z)+.04;f.driveway={x1:f.cx+Math.sin(f.buildingAngle)*dist,z1:f.cz+Math.cos(f.buildingAngle)*dist,x2:target.x,z2:target.z}}
 f.meadow=meadowForTile(x,z,seed);
 if(withVegetation){addVegetation(f,r);if(f.farm){f.trees=f.trees.filter(t=>farmMask(t.x+f.farm.x,t.z+f.farm.z)<.25);f.shrubs=f.shrubs.filter(t=>farmMask(t.x+f.farm.x,t.z+f.farm.z)<.25);vegetationCover(f)}addMeadowShrubs(f);preserveArrivalVegetation(f);addCompoundTrees(f);}return f;
}
export function wheatAllowed(x,z,f){const road=roadProfile(x,z,f,roadState);if(road.rut>.10||road.yard>.05)return false;if(shoreGrassCover(x,z,f)>.23)return false;if(meadowSample(x,z,f.meadow)>.32)return false;if(x<0||z<0||x>64||z>64||road.distance<2.05||inClearing(x,z,f))return false;for(const p of f.cover?.get(Math.floor(z/4)*17+Math.floor(x/4))||[])if(Math.hypot(x-p.x,z-p.z)<p.r)return false;return true}
export function wheatCandidates(f,count=10800){const r=random(f.seed^0x734821),items=[];for(let i=0;i<count;i++){const x=.6+r()*62.8,z=.6+r()*62.8,s=.78+r()*.37,a=r()*6.283,t=r();if(wheatAllowed(x,z,f)&&cropSample(x,z,f,cropScratch).crop!==2)items.push({x,z,s,a,t,i})}return items}
function resolveBox(position,radius,c){const nx=clamp(position.x,c.x1,c.x2),nz=clamp(position.z,c.z1,c.z2),dx=position.x-nx,dz=position.z-nz,d=Math.hypot(dx,dz);if(d>0&&d<radius){position.x=nx+dx/d*radius;position.z=nz+dz/d*radius}else if(d===0){const options=[{d:position.x-c.x1,axis:'x',v:c.x1-radius},{d:c.x2-position.x,axis:'x',v:c.x2+radius},{d:position.z-c.z1,axis:'z',v:c.z1-radius},{d:c.z2-position.z,axis:'z',v:c.z2+radius}];options.sort((a,b)=>a.d-b.d);position[options[0].axis]=options[0].v}}
export function resolveSolid(position,radius,colliders){for(const c of colliders){if(c.kind==='circle'){let dx=position.x-c.x,dz=position.z-c.z,dist=Math.hypot(dx,dz),min=radius+c.r;if(dist<min){if(dist<.00001){dx=1;dz=0;dist=1}position.x=c.x+dx/dist*min;position.z=c.z+dz/dist*min}}
 else if(c.kind==='obb'){const co=Math.cos(c.angle),si=Math.sin(c.angle),dx=position.x-c.x,dz=position.z-c.z,p={x:co*dx-si*dz,z:si*dx+co*dz};resolveBox(p,radius,{x1:-c.hx,x2:c.hx,z1:-c.hz,z2:c.hz});position.x=c.x+co*p.x+si*p.z;position.z=c.z-si*p.x+co*p.z}else if(c.kind==='box')resolveBox(position,radius,c)}return position}
export function vegetationDrag(position,volumes){let drag=0;for(const v of volumes||[]){const d=Math.hypot(position.x-v.x,position.z-v.z);if(d<v.r)drag=Math.max(drag,(v.drag||.2)*(1-d/v.r))}return drag}
export function rebase(state){let dx=0,dz=0;while(state.x<0){state.x+=CHUNK;dx--}while(state.x>=CHUNK){state.x-=CHUNK;dx++}while(state.z<0){state.z+=CHUNK;dz--}while(state.z>=CHUNK){state.z-=CHUNK;dz++}state.cx+=BigInt(dx);state.cz+=BigInt(dz);return {dx,dz}}

// Immutable lakes provide spatial constraints, never terrain edits.
export function agriculturalFeatures(ox,oz,seed){
 const lakes=[],buildings=[],mx=floorBig(ox,512n),mz=floorBig(oz,512n);
 for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){
  const l=macroLake(mx+BigInt(i),mz+BigInt(j),seed);if(!l||farmExcludesLake(l))continue;
  const cx=Number(l.lakeOwnerX*64n-ox)+l.lakeLocalX,cz=Number(l.lakeOwnerZ*64n-oz)+l.lakeLocalZ;
  if(cx+l.bounds[1]<-190||cx+l.bounds[0]>590||cz+l.bounds[3]<-190||cz+l.bounds[2]>590)continue;
  lakes.push({...l,cx,cz,type:'pond'});
 }
 const ax=floorBig(ox,64n),az=floorBig(oz,64n);
 for(let j=-1;j<=7;j++)for(let i=-1;i<=7;i++){
  const x=ax+BigInt(i),z=az+BigInt(j),candidate=landmark(x,z,seed);
  if(!(candidate.type==='building'&&hasBuilding(x,z,seed,candidate.rank))&&!settlements.additionalBuilding(x,z,seed))continue;
  const r=random(chunkSeed(x,z,seed)^0x127abab),small=r()<.56,variant=small?[0,1,7][Math.floor(r()*3)]:[2,3,4,5,6][Math.floor(r()*5)],px=18+r()*28,pz=18+r()*28;
  if(small)continue;
  const bx=Number(x*64n-ox)+px,bz=Number(z*64n-oz)+pz;
  if(lakes.some(l=>bx>l.cx+l.bounds[0]&&bx<l.cx+l.bounds[1]&&bz>l.cz+l.bounds[2]&&bz<l.cz+l.bounds[3]))continue;
  buildings.push({x:bx,z:bz,variant});
 }
 return{lakes,buildings};
}
const shoreCoverMetrics={};
export function shoreGrassCover(x,z,f){
 const protect=arrivalRoadWeight(x,z,f);if(protect===1||!f.roadLakes?.length)return 0;
 let cover=0;const wx=x+periodOrigin(f.x),wz=z+periodOrigin(f.z);
 const phase=Math.PI*2/65536,broad=.5+.26*Math.sin((wx*386+wz*219)*phase)+.17*Math.sin((wx*930-wz*449)*phase),patch=.5+.5*Math.sin(wx*1982*phase+Math.sin(wz*1252*phase)*2.1);
 for(const lake of f.roadLakes){const m=pondMetrics(x,z,lake,shoreCoverMetrics),outer=m.metres-m.width;
  // Only beyond the original bank: no new turf or shader recolor on mudflats.
  const start=smooth(1.5,3.5,outer),end=1-smooth(7+broad*7,20+broad*12,outer);
  cover=Math.max(cover,start*end*(.64+.36*patch));
 }
 return cover*(1-protect);
}
configurePatchwork(agriculturalFeatures,createLakeRoadRouter({shoreDistance:pondShoreDistance,bankPoint:pondBankPoint}).routeRoadPolyline);

// The road planner consumes frozen topology interests above. Visible compounds
// are strictly downstream, so streaming order cannot feed back into roads.
function fixedObstacles(ox,oz){
 if(ox< -800n||ox>800n||oz< -800n||oz>800n)return [];
 const x=Number(ox),z=Number(oz),parts=FARM_FOOTPRINTS.map(p=>({...p,x:FARM.x+p.x-x,z:FARM.z+p.z-z}));
 parts.push({x:REFERENCE_BARN.x-x,z:REFERENCE_BARN.z-z,hx:14,hz:8,angle:0},{x:32-x,z:27-z,hx:6.6,hz:9,angle:-Math.PI*.45});
 parts.push({x:80-x,z:112-z,hx:81,hz:3.3,angle:0});
 for(const p of ARRIVAL_COMPONENTS)parts.push({...p,x:p.x-x,z:p.z-z});
 return parts;
}
function proceduralRoadVisible(x,z,ox,oz){
 if(ox< -800n||ox>800n||oz< -800n||oz>800n)return true;
 const wx=Number(ox)+x,wz=Number(oz)+z;
 return smooth(0,72,Math.max(-40-wx,wx-128,-144-wz,wz-128))>.48;
}
export const compoundPlanner=createCompoundPlanner({macroPlan,shoreDistance:pondShoreDistance,heightAt:height,getObstacles:fixedObstacles,roadVisible:proceduralRoadVisible});
function addCompoundTrees(f){
 for(const plan of f.compounds)for(const p of plan.components){if(p.kind!=='tree'||!p.belongs)continue;
  f.trees=f.trees.filter(t=>Math.hypot(t.x-p.x,t.z-p.z)>4);
  f.trees.push({x:p.x,z:p.z,variant:p.variant??5,scale:p.height/10,rotation:p.angle||0,seed:p.seed,compoundTree:true});
 }
 vegetationCover(f);
}

function preserveArrivalVegetation(f){
 if(f.x< -1n||f.x>0n||f.z<0n||f.z>1n)return;
 const old=frozenArrivalField(f.x,f.z,f.worldSeed,true),dx=Number(f.x)*64-.6,dz=Number(f.z)*64-52;
 const protectedPlant=p=>Math.hypot(p.x+dx,p.z+dz)<24;
 f.trees=[...f.trees.filter(p=>!protectedPlant(p)),...old.trees.filter(protectedPlant)];
 f.shrubs=[...f.shrubs.filter(p=>!protectedPlant(p)),...old.shrubs.filter(protectedPlant)];
 vegetationCover(f);
}
