import {REFERENCE_BARN,barnLandscape} from './reference-barn-layout.js?v=31';
import {meadowSample,meadowEnvironment} from './meadow-layout.js?v=31';
import {field,buildingSize,BUILDING_NAMES,laneOffset,pondPoint,pondBankPoint,pondDistance,roadProfile} from './world.js?v=31';
import {FARM_FOOTPRINTS,FARM_TREES,farmRoadWeight} from './farm-layout.js?v=31';
import {pondShoreWidth} from './lake-shape.js?v=31';

// A geography-only view of the existing world. Never imports Three, terrain,
// textures, vegetation geometry, or the streamed chunk manager.
// X increases right, Z increases down; all absolute cell indices remain BigInt.
const SIZE=64,TAU=Math.PI*2;
export const MAP_COLORS={wheat:'#b8a46c',grass:'#74845a',yard:'#a28f70',rut:'#8c7658',water:'#649298',shore:'#a3a17c',tree:'#4d6849',hedge:'#61774d',building:'#a46e59'};
const COLORS=MAP_COLORS;
const TREE_RADII=[5.1,4.3,6.0,3.8,3.0,3.0];
const FARM_NAMES=['红色谷仓','农舍附屋','农舍附屋','旧农舍','旧农舍','农具棚'];
const NEIGHBOURS=[[0,0],[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]];
const clock=()=>globalThis.performance?.now?.()??Date.now();
const keyOf=(x,z)=>`${x},${z}`;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

function coordinates(value){
 if(typeof value==='bigint')return value;
 if(typeof value==='string'&&/^-?\d+$/.test(value))return BigInt(value);
 if(Number.isSafeInteger(value))return BigInt(value);
 throw new TypeError('Map cell must be a BigInt, decimal integer string, or safe integer.');
}
function remember(cache,key,value,limit){
 cache.delete(key);cache.set(key,value);
 while(cache.size>limit)cache.delete(cache.keys().next().value);
 return value;
}
function touch(cache,key){const value=cache.get(key);if(value!==undefined){cache.delete(key);cache.set(key,value)}return value}
function makeCanvas(width){
 const canvas=typeof document!=='undefined'?document.createElement('canvas'):new OffscreenCanvas(width,width);
 canvas.width=canvas.height=width;return canvas;
}
function path(ctx,points){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.z):ctx.moveTo(p.x,p.z));ctx.closePath()}
function corners(x,z,hx,hz,angle){const c=Math.cos(angle),s=Math.sin(angle);return [[-hx,-hz],[hx,-hz],[hx,hz],[-hx,hz]].map(([a,b])=>({x:x+c*a+s*b,z:z-s*a+c*b}))}
function footprint(f,x,z,hx,hz,angle,label,kind='building'){
 return {kind,label,cx:f.x,cz:f.z,x,z,hx,hz,angle,corners:corners(x,z,hx,hz,angle)};
}
function overlaps(points,margin=0){return points.some(p=>p.x>=-margin&&p.x<=SIZE+margin&&p.z>=-margin&&p.z<=SIZE+margin)||!(Math.max(...points.map(p=>p.x))<0||Math.min(...points.map(p=>p.x))>SIZE||Math.max(...points.map(p=>p.z))<0||Math.min(...points.map(p=>p.z))>SIZE)}
export function mapFootprints(f){
 const result=[];
 if(f.type==='building'){const [w,d]=buildingSize(f);result.push(footprint(f,f.cx,f.cz,w/2,d/2,f.buildingAngle||0,BUILDING_NAMES[f.variant%8]))}
 if(f.farm)FARM_FOOTPRINTS.forEach((p,i)=>{
  const q=footprint(f,p.x-f.farm.x,p.z-f.farm.z,p.hx,p.hz,p.angle,`Kephart 农场 · ${FARM_NAMES[i]||'农舍'}`,'farm-building');
  if(overlaps(q.corners,4))result.push(q);
 });
 if(f.barn){const p=footprint(f,-f.barn.x,-f.barn.z,12,5.8,0,'砖砌谷仓','reference-barn');if(overlaps(p.corners,4))result.push(p);}
 return result;
}
function metadata(f){
 return {cx:f.x,cz:f.z,type:f.type,label:f.type==='pond'?'湖泊':f.type==='building'?BUILDING_NAMES[f.variant%8]:'麦田',vegetationMode:f.vegetationMode,footprints:mapFootprints(f),roads:f.roads,driveway:f.driveway||null,lake:f.type==='pond'?{id:f.lakeId,x:f.cx,z:f.cz,outline:Array.from({length:160},(_,i)=>pondPoint(f,i*TAU/160))}:null,trees:f.trees.map(t=>({x:t.x,z:t.z,r:TREE_RADII[t.variant%6]*t.scale,variant:t.variant})),shrubs:f.shrubs.map(s=>({x:s.x,z:s.z,r:s.width*s.scale*.50})),farm:f.farm?{x:f.farm.x,z:f.farm.z}:null,meadow:f.meadow?{size:f.meadow.size,step:f.meadow.step,grid:f.meadow.grid}:null};
}

function drawMeadow(ctx,f){
 if(!f.meadow)return;
 const n=128,layer=makeCanvas(n),g=layer.getContext('2d'),pixels=g.createImageData(n,n),env={};
 for(let z=0;z<n;z++)for(let x=0;x<n;x++){
  meadowEnvironment((x+.5)*64/n,(z+.5)*64/n,f.meadow,env);
  const c=env.cover;if(c<=.001)continue;const i=(z*n+x)*4,wet=env.moisture,d=env.patchDensity;
  pixels.data[i]=Math.round(122-wet*15+d*8);pixels.data[i+1]=Math.round(133+wet*7+d*7);pixels.data[i+2]=Math.round(78+wet*10+d*6);pixels.data[i+3]=Math.round(Math.min(1,c*1.25)*255);
 }
 g.putImageData(pixels,0,0);ctx.drawImage(layer,0,0,64,64);
}

function line(ctx,points,color,width){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.z):ctx.moveTo(p.x,p.z));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke()}
function drawLane(ctx,f,l){
 const points=[];for(let t=0;t<=64;t+=2){const shift=l.edge+laneOffset(l,t);points.push(l.axis==='x'?{x:shift,z:t,t}:{x:t,z:shift,t})}
 // Away from the fixed farm a whole path is one stroke. Its shoulders and
 // grassy median follow the exact same centre curve as roadProfile().
 if(!f.farm&&!f.barn){
  line(ctx,points,COLORS.grass,4.1);
  for(const sign of [-1,1])line(ctx,points.map(p=>{const phase=p.t*Math.PI/32,offset=sign*(.77+.020*Math.sin(phase*5)+.012*Math.sin(phase*11));return{x:p.x+(l.axis==='x'?offset:0),z:p.z+(l.axis==='z'?offset:0)}}),COLORS.rut,.47);
  return;
 }
 // The photographic clearing suppresses procedural roads with a gradual
 // authoritative farmRoadWeight, including each side of a tile boundary.
 for(let i=1;i<points.length;i++){
  const a=points[i-1],b=points[i],weight=farmRoadWeight((a.x+b.x)/2,(a.z+b.z)/2,f);if(weight<=.005)continue;
  ctx.globalAlpha=weight;line(ctx,[a,b],COLORS.grass,4.1);
  for(const sign of [-1,1])line(ctx,[a,b].map(p=>{const phase=p.t*Math.PI/32,offset=sign*(.77+.020*Math.sin(phase*5)+.012*Math.sin(phase*11));return{x:p.x+(l.axis==='x'?offset:0),z:p.z+(l.axis==='z'?offset:0)}}),COLORS.rut,.47);
 }
 ctx.globalAlpha=1;
}
function drawDrive(ctx,d){
 if(!d)return;
 const dx=d.x2-d.x1,dz=d.z2-d.z1,len=Math.hypot(dx,dz);if(len<.01)return;
 const ux=dx/len,uz=dz/len;
 const points=[{x:d.x1-ux*2.2,z:d.z1-uz*2.2},{x:d.x2,z:d.z2}];
 line(ctx,points,COLORS.grass,4.1);
 for(const sign of [-1,1])line(ctx,points.map(p=>({x:p.x-uz*.77*sign,z:p.z+ux*.77*sign})),COLORS.rut,.47);
}
function drawBank(ctx,f,fraction,color){
 const points=[];for(let i=0;i<160;i++){const a=i*TAU/160;points.push(pondBankPoint(f,a,pondShoreWidth(f,a)*fraction))}
 path(ctx,points);ctx.fillStyle=color;ctx.fill();
}
function drawPond(ctx,f){
 const points=[];for(let i=0;i<160;i++)points.push(pondPoint(f,i*TAU/160));path(ctx,points);ctx.fillStyle=COLORS.water;ctx.fill();
 ctx.strokeStyle='#527f86';ctx.lineWidth=.30;ctx.stroke();
}
function drawBuilding(ctx,p,variant=0){
 ctx.save();ctx.translate(p.x,p.z);ctx.rotate(-p.angle);
 const shade=p.kind==='farm-building'?'#9b7968':['#857761','#8c8371','#a46e59','#916d59','#8b7364','#817663','#8c7d67','#8f806a'][variant%8];
 ctx.fillStyle=shade;ctx.fillRect(-p.hx,-p.hz,p.hx*2,p.hz*2);
 ctx.fillStyle='rgba(40,34,28,.16)';ctx.fillRect(0,-p.hz,p.hx,p.hz*2);
 ctx.strokeStyle='#5e5847';ctx.lineWidth=.35;ctx.strokeRect(-p.hx,-p.hz,p.hx*2,p.hz*2);
 line(ctx,[{x:0,z:-p.hz},{x:0,z:p.hz}],'#c0a58a',.30);ctx.restore();
}
function drawYard(ctx,p){path(ctx,corners(p.x,p.z,p.hx+3.4,p.hz+4.3,p.angle));ctx.fillStyle=COLORS.yard;ctx.fill()}
function drawTree(ctx,t,dx=0,dz=0,isPhoto=false){
 const x=t.x+dx,z=t.z+dz,r=isPhoto?t.crownWidth*.50:TREE_RADII[t.variant%6]*t.scale;if(x+r<0||z+r<0||x-r>64||z-r>64)return;
 const phase=(t.seed??0)%997/997*TAU;
 const burgundy=isPhoto&&t.kind==='burgundy',conifer=isPhoto?t.kind==='evergreen':t.variant===5;
 const color=burgundy?'#785b54':conifer?'#416352':COLORS.tree;
 const points=[];for(let i=0;i<12;i++){const a=i*TAU/12,rad=r*(.89+.10*Math.sin(i*2.1+phase));points.push({x:x+Math.cos(a)*rad,z:z+Math.sin(a)*rad})}
 path(ctx,points);ctx.fillStyle=color;ctx.fill();ctx.strokeStyle='rgba(39,65,40,.28)';ctx.lineWidth=.22;ctx.stroke();
 ctx.beginPath();ctx.arc(x-r*.20,z-r*.20,r*.44,0,TAU);ctx.fillStyle=burgundy?'rgba(188,130,108,.14)':'rgba(166,191,112,.16)';ctx.fill();
}
function drawShrub(ctx,s,dx,dz){
 const x=s.x+dx,z=s.z+dz,r=s.width*s.scale*.50;if(x+r<0||z+r<0||x-r>64||z-r>64)return;
 ctx.beginPath();ctx.ellipse(x,z,r,r*.77,-(s.rotation||0),0,TAU);ctx.fillStyle=COLORS.hedge;ctx.fill();
}

/**
 * request(cx,cz,priority): queue data; lower priority renders first.
 * pump(ms,maxCompleted): synchronous incremental work, called once per frame.
 * get(): ready canvas only. Never triggers geography or rasterization.
 * getMetadata()/hitTest(): cached geography only. Never instantiate a chunk.
 * cancelPending(): call after a major pan/zoom; completed LRU tiles survive.
 */
export function createMapTiles({seed,maxTiles=192,tilePixels=128,maxPending=maxTiles*2,canvasFactory=makeCanvas}={}){
 maxTiles=clamp(Math.floor(maxTiles)||192,8,1024);tilePixels=clamp(Math.floor(tilePixels)||128,32,256);maxPending=clamp(Math.floor(maxPending)||maxTiles*2,8,2048);
 const tiles=new Map(),fields=new Map(),pending=new Map();
 const maxFields=maxTiles*2+24;let active=null,disposed=false,sequence=0,revision=0;
 const counters={completed:0,evicted:0,fieldQueries:0,dropped:0,pumps:0,maxPumpMs:0,lastPumpMs:0};
 function source(cx,cz){
  const key=keyOf(cx,cz),old=touch(fields,key);if(old)return old;
  const f=field(cx,cz,seed,true);counters.fieldQueries++;
  // Spatial collision buckets serve wheat placement, not this map. Retain only
  // lightweight geography and placements in this separate bounded cache.
  f.cover=null;
  return remember(fields,key,f,maxFields);
 }
 function* render(job){
  const f=source(job.cx,job.cz);yield;
  const canvas=canvasFactory(tilePixels);canvas.width=canvas.height=tilePixels;
  const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)throw new Error('Canvas2D is required for the map.');
  ctx.setTransform(tilePixels/64,0,0,tilePixels/64,0,0);ctx.lineJoin='round';ctx.lineCap='butt';
  const tone=Math.round((f.tint-.5)*10);ctx.fillStyle=`rgb(${184+tone} ${164+tone} ${108+tone})`;ctx.fillRect(0,0,64,64);drawMeadow(ctx,f);yield;
  for(const lane of f.roads){if(lane.enabled)drawLane(ctx,f,lane);yield}
  drawDrive(ctx,f.driveway);yield;
  if(f.type==='pond'){
   drawBank(ctx,f,1.2,COLORS.grass);yield;
   drawBank(ctx,f,.36,COLORS.shore);yield;
   drawPond(ctx,f);yield;
  }
  const meta=metadata(f);for(const p of meta.footprints)drawYard(ctx,p);yield;
  for(const p of meta.footprints)drawBuilding(ctx,p,f.variant);yield;
  const neighbours=[];
  for(const [dx,dz]of NEIGHBOURS){neighbours.push({f:source(f.x+BigInt(dx),f.z+BigInt(dz)),dx:dx*64,dz:dz*64});yield}
  // Neighbour crowns are projected into this tile, so a tree never ends at the
  // artificial 64 m map edge. Canonical owner order gives matching seam pixels.
  neighbours.sort((a,b)=>a.dz-b.dz||a.dx-b.dx);
  let batch=0;
  for(const n of neighbours)for(const s of n.f.shrubs){drawShrub(ctx,s,n.dx,n.dz);if(++batch%12===0)yield}
  for(const n of neighbours)for(const t of n.f.trees){drawTree(ctx,t,n.dx,n.dz);if(++batch%8===0)yield}
  if(f.barn){const layout=barnLandscape(f);for(const s of layout.shrubs)drawShrub(ctx,s,0,0);for(const t of layout.trees)drawTree(ctx,t);yield;}
  if(f.farm)for(const t of FARM_TREES){drawTree(ctx,t,-f.farm.x,-f.farm.z,true);yield}
  ctx.setTransform(1,0,0,1,0,0);
  return {canvas,metadata:meta};
 }
 function nextJob(){
  let choice=null;for(const job of pending.values())if(!choice||job.priority<choice.priority||job.priority===choice.priority&&job.order<choice.order)choice=job;
  if(choice){pending.delete(choice.key);choice.iterator=render(choice)}return choice;
 }
 function request(cx,cz,priority=0){
  if(disposed)return null;cx=coordinates(cx);cz=coordinates(cz);const key=keyOf(cx,cz),cached=touch(tiles,key);if(cached)return cached.canvas;
  priority=Number.isFinite(priority)?priority:0;
  if(active?.key===key)return null;
  const existing=pending.get(key);if(existing){existing.priority=priority;return null}
  if(pending.size>=maxPending){
   let worst=null;for(const job of pending.values())if(!worst||job.priority>worst.priority||job.priority===worst.priority&&job.order<worst.order)worst=job;
   if(worst&&worst.priority<priority){counters.dropped++;return null}if(worst)pending.delete(worst.key);counters.dropped++;
  }
  pending.set(key,{key,cx,cz,priority,order:sequence++});return null;
 }
 function pump(budgetMs=3,maxCompleted=2){
  if(disposed||budgetMs<=0||maxCompleted<=0)return 0;
  const start=clock(),deadline=start+Math.min(12,budgetMs);let count=0,steps=0;
  while(count<maxCompleted&&(steps===0||clock()<deadline)){
   if(!active)active=nextJob();if(!active)break;
   const step=active.iterator.next();steps++;
   if(step.done){
    if(tiles.size>=maxTiles&&!tiles.has(active.key))counters.evicted++;
    remember(tiles,active.key,step.value,maxTiles);active=null;revision++;counters.completed++;count++;
   }
  }
  counters.lastPumpMs=clock()-start;counters.maxPumpMs=Math.max(counters.maxPumpMs,counters.lastPumpMs);counters.pumps++;return count;
 }
 function get(cx,cz){if(disposed)return null;return touch(tiles,keyOf(coordinates(cx),coordinates(cz)))?.canvas||null}
 function getMetadata(cx,cz){if(disposed)return null;return touch(tiles,keyOf(coordinates(cx),coordinates(cz)))?.metadata||null}
 function hitTest(cx,cz,x,z){
  cx=coordinates(cx);cz=coordinates(cz);const key=keyOf(cx,cz),tile=touch(tiles,key);if(!tile)return null;
  for(const p of tile.metadata.footprints){const dx=x-p.x,dz=z-p.z,c=Math.cos(p.angle),s=Math.sin(p.angle);if(Math.abs(c*dx-s*dz)<=p.hx&&Math.abs(s*dx+c*dz)<=p.hz)return {...p}}
  const f=touch(fields,key);if(!f){if(meadowSample(x,z,tile.metadata.meadow)>.32)return {kind:'grass',label:'田间草地',cx,cz,x,z};return {kind:tile.metadata.type,label:tile.metadata.label,cx,cz,x,z};}
  if(f.type==='pond'&&pondDistance(x,z,f)<=1)return {kind:'water',label:'湖泊',cx,cz,x,z,lakeId:f.lakeId};
  if(f.barn){const layout=barnLandscape(f);for(const t of layout.trees)if(Math.hypot(x-t.x,z-t.z)<TREE_RADII[t.variant%6]*t.scale)return{kind:'tree',label:'谷仓后的树林',cx,cz,x,z};for(const s of layout.shrubs)if(Math.hypot(x-s.x,z-s.z)<s.width*s.scale*.5)return{kind:'hedge',label:'谷仓树篱',cx,cz,x,z};}
  if(f.farm)for(const t of FARM_TREES)if(Math.hypot(x+f.farm.x-t.x,z+f.farm.z-t.z)<t.crownWidth*.5)return {kind:'tree',label:'Kephart 农场 · 树木',cx,cz,x,z};
  for(const t of tile.metadata.trees)if(Math.hypot(x-t.x,z-t.z)<t.r)return {kind:'tree',label:f.vegetationMode==='grove'?'小树林':f.vegetationMode==='windbreak'?'防风林':'树木',cx,cz,x,z};
  for(const s of tile.metadata.shrubs)if(Math.hypot(x-s.x,z-s.z)<s.r)return {kind:'hedge',label:'田边树篱',cx,cz,x,z};
  const road=roadProfile(x,z,f,{});
  if(road.rut>.1)return {kind:'path',label:'田间双辙路',cx,cz,x,z};
  if(road.distance<2.05)return {kind:'grass',label:'路边草地',cx,cz,x,z};
  if(meadowSample(x,z,f.meadow)>.32)return {kind:'grass',label:'田间草地',cx,cz,x,z};
  return {kind:'field',label:'麦田',cx,cz,x,z};
 }
 function cancelPending(){pending.clear();active=null}
 function clear(){cancelPending();tiles.clear();fields.clear();revision++}
 function dispose(){clear();disposed=true}
 function stats(){return {...counters,revision,tiles:tiles.size,pending:pending.size+(active?1:0),fields:fields.size,maxTiles,maxFields,maxPending,tilePixels,bytes:tiles.size*tilePixels*tilePixels*4,disposed}}
 return {get,request,pump,getMetadata,hitTest,cancelPending,clear,dispose,stats};
}
