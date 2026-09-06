import {CHUNK,field,buildingSize,buildingLocal,BUILDING_NAMES,pondBankPoint,pondMetrics,surfaceHeight,resolveSolid} from './world.js?v=6';

const titles={pond:'湖泊',building:'建筑',grove:'树林'};
function marker(f,kind){
 if(kind==='grove'){
  if(!['grove','windbreak'].includes(f.vegetationMode)||f.trees.length<4)return null;
  return {x:f.trees.reduce((s,t)=>s+t.x,0)/f.trees.length,z:f.trees.reduce((s,t)=>s+t.z,0)/f.trees.length,label:f.vegetationMode==='windbreak'?'防风林':'树丛'};
 }
 if(f.type!==kind)return null;
 return {x:f.cx,z:f.cz,label:kind==='building'?BUILDING_NAMES[f.variant]:'湖泊'};
}

function inLandingTile(p,margin=.35){return p.x>=margin&&p.z>=margin&&p.x<=CHUNK-margin&&p.z<=CHUNK-margin}
function pondDryPoint(p,f,lake=f){
 if(!inLandingTile(p,.65)||pondMetrics(p.x,p.z,lake).metres<1.25)return false;
 const ground=surfaceHeight(p.x,p.z,f);
 if(ground<lake.lakeY+.045)return false;
 for(const [dx,dz] of [[.4,0],[-.4,0],[0,.4],[0,-.4]]){
  if(pondMetrics(p.x+dx,p.z+dz,lake).metres<.50)return false;
  if(Math.abs(surfaceHeight(p.x+dx,p.z+dz,f)-ground)>.32)return false;
 }
 return true;
}
function* shoreAngles(a){
 yield a;
 for(let i=1;i<=32;i++){
  const offset=i*Math.PI/32;yield a+offset;
  if(i<32)yield a-offset;
 }
}
// Return a dry bank seed in its actual cell before main.beginTeleport starts
// loading colliders. Keep the center independently for nearestness and facing.
function pondLandingTarget(target,position,seed){
 const source=target.field;
 const px=position.x+Number(position.cx-source.x)*CHUNK;
 const pz=position.z+Number(position.cz-source.z)*CHUNK;
 const approach=pondMetrics(px,pz,source).angle;
 for(const metres of [1.8,2.6,3.6,5.2])for(const angle of shoreAngles(approach)){
  const q=pondBankPoint(source,angle,metres);
  const dx=Math.floor(q.x/CHUNK),dz=Math.floor(q.z/CHUNK);
  const cx=source.x+BigInt(dx),cz=source.z+BigInt(dz);
  const p={x:q.x-dx*CHUNK,z:q.z-dz*CHUNK};
  if(!inLandingTile(p,.65))continue;
  const f=field(cx,cz,seed);
  // The owner-defined conservative lake bounds include every physical bank.
  // Reject a different feature rather than borrowing mismatched terrain math.
  if(source.lakeId&&f.lakeId!==source.lakeId)continue;
  const lake={...source,x:cx,z:cz,cx:source.cx-dx*CHUNK,cz:source.cz-dz*CHUNK};
  if(!pondDryPoint(p,f,lake))continue;
  return {...target,cx,cz,x:p.x,z:p.z,field:f,lakeField:lake,
   focusX:lake.cx,focusZ:lake.cz,shoreAngle:angle};
 }
 return null;
}

// Search whole rings, yielding every eight cells. The distance to the outside of
// the searched square proves that the chosen marker is the nearest one.
// BigInt cell coordinates never become large floating-point world coordinates.
export function* findNearestLandmark(position,seed,kind,maxRadius=32){
 if(!titles[kind])throw new Error('Unknown landmark');
 let best=null,examined=0;
 const seenLakes=new Set();
 for(let radius=0;radius<=maxRadius;radius++){
  for(let dz=-radius;dz<=radius;dz++)for(let dx=-radius;dx<=radius;dx++){
   if(radius&&Math.max(Math.abs(dx),Math.abs(dz))!==radius)continue;
   const f=field(position.cx+BigInt(dx),position.cz+BigInt(dz),seed),m=marker(f,kind);
   if(m&&!(kind==='pond'&&f.lakeId&&seenLakes.has(f.lakeId))){
    if(kind==='pond'&&f.lakeId)seenLakes.add(f.lakeId);
    const distance=Math.hypot(dx*CHUNK+m.x-position.x,dz*CHUNK+m.z-position.z);
    if(!best||distance<best.distance)best={...m,cx:f.x,cz:f.z,field:f,kind,distance};}
   examined++;
   if(examined%8===0)yield {examined,radius};
  }
  const outside=Math.min(position.x+radius*CHUNK,(radius+1)*CHUNK-position.x,position.z+radius*CHUNK,(radius+1)*CHUNK-position.z);
  // Every undiscovered center lies outside the searched square: a lake's own
  // center cell also carries its shared descriptor. Early discovery from a
  // shore tile is fine, but never use distance to that tile or bank as proof.
  if(best&&best.distance<=outside){
   const target={...best,exact:true,examined};
   return kind==='pond'?pondLandingTarget(target,position,seed):target;
  }
 }
 // A bounded search cannot truthfully claim a nearest landmark without the bound.
 return null;
}

function worldPoint(f,x,z){const c=Math.cos(f.buildingAngle||0),s=Math.sin(f.buildingAngle||0);return {x:f.cx+c*x+s*z,z:f.cz-s*x+c*z}}
export function findSafeLanding(target,colliders){
 const f=target.field,lake=target.lakeField||f,points=[];
 if(target.kind==='start'){
  points.push({x:.6,z:52});
 }else if(target.kind==='pond'){
  points.push({x:target.x,z:target.z});
  const approach=target.shoreAngle??pondMetrics(target.x,target.z,lake).angle;
  for(const metres of [1.8,2.6,3.6,5.2,7.0])for(const angle of shoreAngles(approach))points.push(pondBankPoint(lake,angle,metres));
 }else if(target.kind==='building'){
  const [,d]=buildingSize(f),door=f.variant===0?-1.15:f.variant===7?-.55:0;
  for(const extra of [2.2,3.2,4.5,6])for(const lateral of [0,-1,1,-2,2])points.push(worldPoint(f,door*(f.buildingScale||1)+lateral,d/2+extra));
 }else{
  for(const radius of [8,11,14,18,5])for(let i=0;i<32;i++)points.push({x:target.x+Math.cos(i*Math.PI/16)*radius,z:target.z+Math.sin(i*Math.PI/16)*radius});
 }
 // Last-resort dry clearings, still checked against every actual solid collider.
 for(let z=4;z<=60;z+=4)for(let x=4;x<=60;x+=4)points.push({x,z});
 for(const p of points){
  if(!inLandingTile(p))continue;
  if(target.kind==='pond'&&!pondDryPoint(p,f,lake))continue;
  if(f.type==='pond'&&target.kind!=='pond'&&!pondDryPoint(p,f))continue;
  if(f.type==='building'){const q=buildingLocal(p.x,p.z,f),[w,d]=buildingSize(f);if(Math.abs(q.x)<w/2+.65&&Math.abs(q.z)<d/2+.65)continue;}
  const resolved=resolveSolid({...p},.38,colliders);
  if(Math.hypot(resolved.x-p.x,resolved.z-p.z)>.002)continue;
  const ground=surfaceHeight(p.x,p.z,f);
  if(f.type==='pond'&&ground<f.lakeY+.035)continue;
  if([[.4,0],[-.4,0],[0,.4],[0,-.4]].some(([dx,dz])=>Math.abs(surfaceHeight(p.x+dx,p.z+dz,f)-ground)>.32))continue;
  return {cx:f.x,cz:f.z,x:p.x,z:p.z,y:ground+1.77,yaw:target.kind==='start'?-.37:Math.atan2(p.x-(target.focusX??target.x),p.z-(target.focusZ??target.z)),pitch:-.045};
 }
 return null;
}

export function applyTeleport(state,landing){
 for(const key of ['cx','cz','x','z','y','yaw','pitch'])state[key]=landing[key];
 state.velocity.set(0,0,0);state.jump=0;state.vy=0;state.grounded=true;
}
