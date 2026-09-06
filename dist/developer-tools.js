import {CHUNK,field,buildingSize,buildingLocal,BUILDING_NAMES,pondPoint,pondDistance,surfaceHeight,resolveSolid} from './world.js';

const titles={pond:'湖泊',building:'建筑',grove:'树林'};
function marker(f,kind){
 if(kind==='grove'){
  if(!['grove','windbreak'].includes(f.vegetationMode)||f.trees.length<4)return null;
  return {x:f.trees.reduce((s,t)=>s+t.x,0)/f.trees.length,z:f.trees.reduce((s,t)=>s+t.z,0)/f.trees.length,label:f.vegetationMode==='windbreak'?'防风林':'树丛'};
 }
 if(f.type!==kind)return null;
 return {x:f.cx,z:f.cz,label:kind==='building'?BUILDING_NAMES[f.variant]:'湖泊'};
}

// Search whole rings, yielding every eight cells. The distance to the outside of
// the searched square proves that the chosen marker is the nearest one.
// BigInt cell coordinates never become large floating-point world coordinates.
export function* findNearestLandmark(position,seed,kind,maxRadius=32){
 if(!titles[kind])throw new Error('Unknown landmark');
 let best=null,examined=0;
 for(let radius=0;radius<=maxRadius;radius++){
  for(let dz=-radius;dz<=radius;dz++)for(let dx=-radius;dx<=radius;dx++){
   if(radius&&Math.max(Math.abs(dx),Math.abs(dz))!==radius)continue;
   const f=field(position.cx+BigInt(dx),position.cz+BigInt(dz),seed),m=marker(f,kind);
   if(m){const distance=Math.hypot(dx*CHUNK+m.x-position.x,dz*CHUNK+m.z-position.z);
    if(!best||distance<best.distance)best={...m,cx:f.x,cz:f.z,field:f,kind,distance};}
   examined++;
   if(examined%8===0)yield {examined,radius};
  }
  const outside=Math.min(position.x+radius*CHUNK,(radius+1)*CHUNK-position.x,position.z+radius*CHUNK,(radius+1)*CHUNK-position.z);
  if(best&&best.distance<=outside)return {...best,exact:true,examined};
 }
 // A bounded search cannot truthfully claim a nearest landmark without the bound.
 return null;
}

function worldPoint(f,x,z){const c=Math.cos(f.buildingAngle||0),s=Math.sin(f.buildingAngle||0);return {x:f.cx+c*x+s*z,z:f.cz-s*x+c*z}}
export function findSafeLanding(target,colliders){
 const f=target.field,points=[];
 if(target.kind==='start'){
  points.push({x:.6,z:52});
 }else if(target.kind==='pond'){
  for(const scale of [1.18,1.27,1.36])for(let i=0;i<48;i++)points.push(pondPoint(f,i*Math.PI/24,scale));
 }else if(target.kind==='building'){
  const [,d]=buildingSize(f),door=f.variant===0?-1.15:f.variant===7?-.55:0;
  for(const extra of [2.2,3.2,4.5,6])for(const lateral of [0,-1,1,-2,2])points.push(worldPoint(f,door*(f.buildingScale||1)+lateral,d/2+extra));
 }else{
  for(const radius of [8,11,14,18,5])for(let i=0;i<32;i++)points.push({x:target.x+Math.cos(i*Math.PI/16)*radius,z:target.z+Math.sin(i*Math.PI/16)*radius});
 }
 // Last-resort dry clearings, still checked against every actual solid collider.
 for(let z=4;z<=60;z+=4)for(let x=4;x<=60;x+=4)points.push({x,z});
 for(const p of points){
  if(p.x<.35||p.z<.35||p.x>63.65||p.z>63.65)continue;
  if(f.type==='pond'&&pondDistance(p.x,p.z,f)<1.10)continue;
  if(f.type==='building'){const q=buildingLocal(p.x,p.z,f),[w,d]=buildingSize(f);if(Math.abs(q.x)<w/2+.65&&Math.abs(q.z)<d/2+.65)continue;}
  const resolved=resolveSolid({...p},.38,colliders);
  if(Math.hypot(resolved.x-p.x,resolved.z-p.z)>.002)continue;
  const ground=surfaceHeight(p.x,p.z,f);
  if(f.type==='pond'&&ground<f.lakeY+.035)continue;
  if([[.4,0],[-.4,0],[0,.4],[0,-.4]].some(([dx,dz])=>Math.abs(surfaceHeight(p.x+dx,p.z+dz,f)-ground)>.32))continue;
  return {cx:f.x,cz:f.z,x:p.x,z:p.z,y:ground+1.77,yaw:target.kind==='start'?-.37:Math.atan2(p.x-target.x,p.z-target.z),pitch:-.045};
 }
 return null;
}

export function applyTeleport(state,landing){
 for(const key of ['cx','cz','x','z','y','yaw','pitch'])state[key]=landing[key];
 state.velocity.set(0,0,0);state.jump=0;state.vy=0;state.grounded=true;
}
