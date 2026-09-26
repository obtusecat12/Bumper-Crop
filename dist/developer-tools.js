import {barnFootprintDistance} from './reference-barn-layout.js?v=51';
import {compoundAt,CHUNK,field,buildingSize,buildingLocal,BUILDING_NAMES,pondBankPoint,pondMetrics,surfaceHeight,resolveSolid} from './world.js?v=51';
import {FARM_PLACEMENTS,FARM_FOOTPRINTS,farmFootprintDistance} from './farm-layout.js?v=51';

const titles={pond:'湖泊',building:'建筑',grove:'树林'};
const COMPOUND_BUILDINGS=new Set(['building','barn','shed','stable','cabin','outhouse']);
function marker(f,kind,position){
 if(kind==='building'&&f.type!=='building'){let best=null,bestD=Infinity;for(const plan of f.compounds||[])for(const c of plan.components){if(!c.belongs||!COMPOUND_BUILDINGS.has(c.kind))continue;const d=Math.hypot(c.x-position.x,c.z-position.z);if(d<bestD){bestD=d;best={x:c.x,z:c.z,label:BUILDING_NAMES[(c.variant??2)%8],component:c,compoundId:plan.id};}}return best;}
 if(kind==='grove'){
  if(!['grove','windbreak'].includes(f.vegetationMode)||f.trees.length<4)return null;
  return {x:f.trees.reduce((s,t)=>s+t.x,0)/f.trees.length,z:f.trees.reduce((s,t)=>s+t.z,0)/f.trees.length,label:f.vegetationMode==='windbreak'?'防风林':'树丛'};
 }
 if(f.type!==kind)return null;
 return {x:f.cx,z:f.cz,label:kind==='building'?BUILDING_NAMES[f.variant]:'湖泊'};
}

function inLandingTile(p,margin=.35){return p.x>=margin&&p.z>=margin&&p.x<=CHUNK-margin&&p.z<=CHUNK-margin}
function pondDryPoint(p,f,lake=f,margin=.65){
 if(!inLandingTile(p,margin)||pondMetrics(p.x,p.z,lake).metres<1.25)return false;
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
   const f=field(position.cx+BigInt(dx),position.cz+BigInt(dz),seed),m=marker(f,kind,{x:position.x-dx*CHUNK,z:position.z-dz*CHUNK});
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

// All arithmetic stays relative to a cell. In particular, a BigInt map address
// is never rounded through an absolute floating-point world position.
function mapCellPoint(origin,x,z){
 const dx=Math.floor(x/CHUNK),dz=Math.floor(z/CHUNK);
 return {cx:origin.cx+BigInt(dx),cz:origin.cz+BigInt(dz),x:x-dx*CHUNK,z:z-dz*CHUNK};
}
function mapTerrainClear(p,f){
 if(compoundAt(p.x,p.z,f,{}).footprint<.65)return false;
 if(f.type==='pond'&&!pondDryPoint(p,f,f,0))return false;
 if(f.type==='building'){
  const q=buildingLocal(p.x,p.z,f),[w,d]=buildingSize(f);
  if(Math.abs(q.x)<w/2+.65&&Math.abs(q.z)<d/2+.65)return false;
 }
 if(barnFootprintDistance(p.x,p.z,f)<.65)return false;
 if(farmFootprintDistance(p.x,p.z,f)<.65)return false;
 const ground=surfaceHeight(p.x,p.z,f);
 return [[.4,0],[-.4,0],[0,.4],[0,-.4]].every(([dx,dz])=>Math.abs(surfaceHeight(p.x+dx,p.z+dz,f)-ground)<=.32);
}
function* mapOffsets(p){
 yield {x:p.x,z:p.z};
 for(const radius of [.55,1,1.6,2.4,3.5,5,7,10,14])for(let i=0;i<32;i++){
  const a=i*Math.PI/16;yield {x:p.x+Math.cos(a)*radius,z:p.z+Math.sin(a)*radius};
 }
}
function farmEntrance(f,point){
 if(!f.farm||farmFootprintDistance(point.x,point.z,f)>=.65)return null;
 const x=point.x+f.farm.x,z=point.z+f.farm.z;
 let chosen=null,best=Infinity;
 for(const [name,p] of Object.entries(FARM_PLACEMENTS)){
  const footprint=FARM_FOOTPRINTS.find(q=>q.x===p.x&&q.z===p.z);
  if(!footprint)continue;
  const c=Math.cos(p.angle||0),s=Math.sin(p.angle||0),dx=x-p.x,dz=z-p.z;
  const distance=Math.hypot(Math.max(0,Math.abs(c*dx-s*dz)-footprint.hx),Math.max(0,Math.abs(s*dx+c*dz)-footprint.hz));
  if(distance<best){best=distance;chosen={name,p,footprint};}
 }
 if(!chosen)return null;
 const {name,p,footprint}=chosen,sx=p.scaleX||1;
 // Door facades match kephart-models.js: the annex and shed carriage doors
 // face -Z; the cottage's +Z entrance is beyond its shallow front porch.
 const direction=name==='annex'||name==='shed'?-1:1;
 const door=name==='barn'?-.35*sx:name==='cottage'?.05*sx:0;
 const facade=footprint.hz+(name==='cottage'?2.05:0);
 const transform=(x,z)=>worldPoint({cx:p.x-f.farm.x,cz:p.z-f.farm.z,buildingAngle:p.angle},x,z);
 const points=[];
 for(const extra of [2.2,3.2,4.5,6])for(const lateral of [0,-1,1,-2,2])points.push(transform(door+lateral,direction*(facade+extra)));
 return {points,label:'农场建筑门外'};
}

/** Prepare a map click for the normal terrain-loading teleport transaction.
 * The returned kind remains "map"; findSafeLanding performs the final checks
 * against the actual loaded solids before the player is allowed to move.
 */
export function createMapTarget(point,seed){
 if(typeof point?.cx!=='bigint'||typeof point?.cz!=='bigint')throw new TypeError('Map cells must be BigInt');
 if(!Number.isFinite(point.x)||!Number.isFinite(point.z)||point.x<0||point.x>CHUNK||point.z<0||point.z>CHUNK)throw new RangeError('Map local coordinates must be between 0 and 64');
 const clicked=mapCellPoint(point,point.x,point.z),source=field(clicked.cx,clicked.cz,seed),cache=new Map([[source.key,source]]);
 const getField=p=>{const key=`${p.cx},${p.cz}`;if(!cache.has(key))cache.set(key,field(p.cx,p.cz,seed));return cache.get(key)};
 let candidates=[],label='地图位置',mapMode='point';
 const farm=farmEntrance(source,clicked);
 if(source.barn&&barnFootprintDistance(clicked.x,clicked.z,source)<.65){for(const extra of[2.4,3.4,4.5])candidates.push({x:3.1-source.barn.x,z:5.8+extra-source.barn.z});label='砖砌谷仓门外';mapMode='building';
 }else if(farm){candidates=farm.points;label=farm.label;mapMode='building';
 }else if(compoundAt(clicked.x,clicked.z,source,{}).footprint<.65){
  const c=compoundAt(clicked.x,clicked.z,source,{}).component;
  if(c&&COMPOUND_BUILDINGS.has(c.kind)){for(const extra of [2.2,3.2,4.5,6])for(const lateral of [0,-1,1,-2,2])candidates.push(worldPoint({cx:c.x,cz:c.z,buildingAngle:c.angle},(c.variant===0?-1.15:c.variant===7?-.55:0)+lateral,c.depth/2+extra));label=BUILDING_NAMES[(c.variant??2)%8]+'门外';mapMode='building';}
 }else if(source.type==='building'){
  const q=buildingLocal(clicked.x,clicked.z,source),[w,d]=buildingSize(source);
  if(Math.abs(q.x)<w/2+.65&&Math.abs(q.z)<d/2+.65){
   const door=source.variant===0?-1.15:source.variant===7?-.55:0;
   for(const extra of [2.2,3.2,4.5,6])for(const lateral of [0,-1,1,-2,2])candidates.push(worldPoint(source,door*(source.buildingScale||1)+lateral,d/2+extra));
   label=`${BUILDING_NAMES[source.variant]}门外`;mapMode='building';
  }
 }
 if(source.type==='pond'&&!pondDryPoint(clicked,source,source,0)){
  // Search the entire irregular shore, not the radial line from lake center.
  // A lake spans cells, so resolve each candidate into its real terrain tile
  // before ranking dry, walkable banks by distance from the clicked position.
  for(let i=0;i<512;i++)for(const metres of [1.3,1.8,2.6,3.6,5.2,7]){
   const q=pondBankPoint(source,i*Math.PI/256,metres),p=mapCellPoint(clicked,q.x,q.z),f=getField(p);
   if(source.lakeId&&f.lakeId!==source.lakeId)continue;
   if(mapTerrainClear(p,f))candidates.push(q);
  }
  candidates.sort((a,b)=>(a.x-clicked.x)**2+(a.z-clicked.z)**2-((b.x-clicked.x)**2+(b.z-clicked.z)**2));
  label='湖岸';mapMode='shore';
 }
 if(!candidates.length&&mapMode==='shore')return null;
 if(!candidates.length)candidates=[{x:clicked.x,z:clicked.z}];
 const prepared=candidates.map(q=>{const p=mapCellPoint(clicked,q.x,q.z);return {...p,field:getField(p)}});
 const first=prepared.find(p=>mapTerrainClear(p,p.field))||prepared[0];
 const nearby=prepared.filter(p=>p.cx===first.cx&&p.cz===first.cz).map(({x,z})=>({x,z}));
 return {...first,kind:'map',label,mapMode,mapCandidates:nearby,mapClick:clicked,
  yaw:Number.isFinite(point.yaw)?point.yaw:0};
}

export function findSafeLanding(target,colliders){
 const f=target.field,lake=target.lakeField||f,points=[];
 if(target.kind==='map'){
  points.push({x:target.x,z:target.z});
  if(target.mapMode==='shore'||target.mapMode==='building')points.push(...(target.mapCandidates||[]));
  points.push(...mapOffsets(target));
 }else if(target.kind==='city-exit'){points.push({x:target.x,z:target.z});
 }else if(target.kind==='reference-barn'){points.push({x:target.x,z:target.z});
 }else if(target.kind==='photo'){points.push({x:target.x,z:target.z});
 }else if(target.kind==='start'){
  points.push({x:.6,z:52});
 }else if(target.kind==='pond'){
  points.push({x:target.x,z:target.z});
  const approach=target.shoreAngle??pondMetrics(target.x,target.z,lake).angle;
  for(const metres of [1.8,2.6,3.6,5.2,7.0])for(const angle of shoreAngles(approach))points.push(pondBankPoint(lake,angle,metres));
 }else if(target.kind==='building'&&target.component){
  const c=target.component;for(const extra of [2.2,3.2,4.5,6])for(const lateral of [0,-1,1,-2,2])points.push(worldPoint({cx:c.x,cz:c.z,buildingAngle:c.angle},(c.variant===0?-1.15:c.variant===7?-.55:0)+lateral,c.depth/2+extra));
 }else if(target.kind==='building'){
  const [,d]=buildingSize(f),door=f.variant===0?-1.15:f.variant===7?-.55:0;
  for(const extra of [2.2,3.2,4.5,6])for(const lateral of [0,-1,1,-2,2])points.push(worldPoint(f,door*(f.buildingScale||1)+lateral,d/2+extra));
 }else{
  for(const radius of [8,11,14,18,5])for(let i=0;i<32;i++)points.push({x:target.x+Math.cos(i*Math.PI/16)*radius,z:target.z+Math.sin(i*Math.PI/16)*radius});
 }
 // Last-resort dry clearings, still checked against every actual solid collider.
 for(let z=4;z<=60;z+=4)for(let x=4;x<=60;x+=4)points.push({x,z});
 for(const p of points){
  if(target.kind==='map'){
   if(!inLandingTile(p,0)||p.x>=CHUNK||p.z>=CHUNK||!mapTerrainClear(p,f))continue;
  }else if(!inLandingTile(p))continue;
  if(target.kind==='pond'&&!pondDryPoint(p,f,lake))continue;
  if(f.type==='pond'&&target.kind!=='pond'&&!pondDryPoint(p,f,f,target.kind==='map'?0:.65))continue;
  if(f.type==='building'){const q=buildingLocal(p.x,p.z,f),[w,d]=buildingSize(f);if(Math.abs(q.x)<w/2+.65&&Math.abs(q.z)<d/2+.65)continue;}
  if(compoundAt(p.x,p.z,f,{}).footprint<.45)continue;
  const resolved=resolveSolid({...p},.38,colliders);
  if(Math.hypot(resolved.x-p.x,resolved.z-p.z)>.002)continue;
  const ground=surfaceHeight(p.x,p.z,f);
  if(f.type==='pond'&&ground<f.lakeY+.035)continue;
  if([[.4,0],[-.4,0],[0,.4],[0,-.4]].some(([dx,dz])=>Math.abs(surfaceHeight(p.x+dx,p.z+dz,f)-ground)>.32))continue;
  return {cx:f.x,cz:f.z,x:p.x,z:p.z,y:ground+(target.eye??1.77),yaw:(target.kind==='map'||target.kind==='city-exit')?target.yaw:target.kind==='start'?-.37:Math.atan2(p.x-(target.focusX??target.x),p.z-(target.focusZ??target.z)),pitch:target.kind==='photo'?Math.atan2(target.focusY+.40-ground-target.eye,Math.hypot(p.x-target.focusX,p.z-target.focusZ)):-.045};
 }
 return null;
}

export function applyTeleport(state,landing){
 for(const key of ['cx','cz','x','z','y','yaw','pitch'])state[key]=landing[key];
 state.velocity.set(0,0,0);state.jump=0;state.vy=0;state.grounded=true;
}
