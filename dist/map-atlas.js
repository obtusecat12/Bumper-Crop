import {meadowSample} from './meadow-layout.js?v=54';
import {FARM_TREES,farmRoadWeight} from './farm-layout.js?v=54';

// The interactive map never generates procedural fields on the main thread
// unless Canvas fallback is required. Normal requests remain worker-batched.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const clock=()=>globalThis.performance?.now?.()??Date.now();
function coordinate(v){if(typeof v==='bigint')return v;if(typeof v==='string'&&/^-?\d+$/.test(v))return BigInt(v);if(Number.isSafeInteger(v))return BigInt(v);throw new TypeError('Map cell must be a BigInt, decimal integer string, or safe integer.')}
const keyOf=(x,z)=>`${x},${z}`;
const close=bitmap=>{try{bitmap?.close?.()}catch{}};
function inside(x,z,points){let yes=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a.z>z)!==(b.z>z)&&x<(b.x-a.x)*(z-a.z)/(b.z-a.z)+a.x)yes=!yes}return yes}

export function createMapAtlas({seed,maxTiles=192,tilePixels=128,maxPending=maxTiles*2,workerFactory,fallbackLoader,canvasFactory}={}){
 maxTiles=clamp(Math.floor(maxTiles)||192,8,1024);tilePixels=clamp(Math.floor(tilePixels)||128,32,256);maxPending=clamp(Math.floor(maxPending)||maxTiles*2,8,2048);
 const maxInFlight=Math.min(32,maxPending),tiles=new Map(),pending=new Map(),inFlight=new Map();
 let worker=null,fallback=null,mode='starting',disposed=false,epoch=0,order=0,serial=0,revision=0,startupTimer=null,workerStats={};
 const counters={completed:0,evicted:0,dropped:0,pumps:0,lastPumpMs:0,maxPumpMs:0,batches:0,discarded:0,failures:0};
 const options={seed,maxTiles,tilePixels,maxPending,...(canvasFactory?{canvasFactory}:{})};
 function cached(key){const t=tiles.get(key);if(t){tiles.delete(key);tiles.set(key,t)}return t}
 function releaseTiles(){for(const t of tiles.values())close(t.bitmap);tiles.clear()}
 function stopWorker(){clearTimeout(startupTimer);startupTimer=null;if(worker){try{worker.terminate()}catch{}worker=null}}
 function useFallback(reason){
  if(disposed||mode==='fallback'||mode==='loading-fallback'||mode==='failed')return;
  mode='loading-fallback';if(reason)counters.failures++;stopWorker();
  // Requeue only the current view. Old epochs never leak back into the map.
  for(const j of inFlight.values())if(j.epoch===epoch&&!pending.has(j.key))pending.set(j.key,j);
  inFlight.clear();releaseTiles();revision++;
  Promise.resolve().then(()=>fallbackLoader?fallbackLoader():import('./map-tiles.js?v=54')).then(module=>{
   if(disposed)return;fallback=module.createMapTiles(options);mode='fallback';
   for(const j of pending.values())fallback.request(j.cx,j.cz,j.priority);pending.clear();revision++;
  }).catch(error=>{if(disposed)return;mode='failed';pending.clear();counters.failures++;workerStats.error=String(error?.message||error)});
 }
 function send(message){if(!worker)return false;try{worker.postMessage(message);return true}catch(error){useFallback(error);return false}}
 function receive(event){
  const data=event.data||{},packets=Array.isArray(data.tiles)?data.tiles:[];
  if(disposed||mode==='fallback'||mode==='loading-fallback'||mode==='failed'){for(const p of packets)close(p.bitmap);return}
  if(data.type==='ready'){clearTimeout(startupTimer);startupTimer=null;mode='worker';revision++;return}
  if(data.type==='error'){for(const p of packets)close(p.bitmap);useFallback(data.message||'Map worker failed');return}
  if(data.type==='cancelled'){
   for(const [id,j]of inFlight)if(j.epoch<data.epoch)inFlight.delete(id);return;
  }
  if(data.type!=='tiles')return;
  if(data.stats)workerStats=data.stats;
  for(const p of packets){
   const j=inFlight.get(p.id);if(j)inFlight.delete(p.id);
   if(!j||p.epoch!==epoch||j.epoch!==epoch||p.key!==j.key||!p.bitmap){close(p.bitmap);counters.discarded++;continue}
   // Even a duplicate completion must close its transferred surface.
   if(tiles.has(j.key)){close(p.bitmap);counters.discarded++;continue}
   tiles.set(j.key,{bitmap:p.bitmap,metadata:p.metadata});counters.completed++;revision++;
   while(tiles.size>maxTiles){const key=tiles.keys().next().value;close(tiles.get(key).bitmap);tiles.delete(key);counters.evicted++}
  }
 }
 function request(cx,cz,priority=0){
  if(disposed||mode==='failed')return null;cx=coordinate(cx);cz=coordinate(cz);
  if(fallback)return fallback.request(cx,cz,priority);
  const key=keyOf(cx,cz),t=cached(key);if(t)return t.bitmap;
  priority=Number.isFinite(priority)?priority:0;
  const existing=pending.get(key);if(existing){existing.priority=priority;return null}
  for(const job of inFlight.values())if(job.epoch===epoch&&job.key===key)return null;
  let currentFlight=0;for(const job of inFlight.values())if(job.epoch===epoch)currentFlight++;
  if(pending.size+currentFlight>=maxPending){
   let worst=null;for(const job of pending.values())if(!worst||job.priority>worst.priority||job.priority===worst.priority&&job.order<worst.order)worst=job;
   if(!worst||worst.priority<priority){counters.dropped++;return null}pending.delete(worst.key);counters.dropped++;
  }
  pending.set(key,{key,cx,cz,priority,order:order++,epoch});return null;
 }
 function pump(budgetMs=3,maxCompleted=2){
  if(disposed||budgetMs<=0||maxCompleted<=0)return 0;
  if(fallback)return fallback.pump(budgetMs,maxCompleted);
  const start=clock();counters.pumps++;
  if(mode==='worker'&&pending.size&&inFlight.size<maxInFlight){
   const batch=[...pending.values()].sort((a,b)=>a.priority-b.priority||a.order-b.order).slice(0,maxInFlight-inFlight.size);
   for(const j of batch){pending.delete(j.key);j.id=++serial;inFlight.set(j.id,j)}
   if(batch.length){counters.batches++;send({type:'request',epoch,jobs:batch})}
  }
  counters.lastPumpMs=clock()-start;counters.maxPumpMs=Math.max(counters.maxPumpMs,counters.lastPumpMs);return 0;
 }
 function get(cx,cz){if(disposed)return null;if(fallback)return fallback.get(cx,cz);return cached(keyOf(coordinate(cx),coordinate(cz)))?.bitmap||null}
 function getMetadata(cx,cz){if(disposed)return null;if(fallback)return fallback.getMetadata(cx,cz);return cached(keyOf(coordinate(cx),coordinate(cz)))?.metadata||null}
 function hitTest(cx,cz,x,z){
  if(disposed)return null;if(fallback)return fallback.hitTest(cx,cz,x,z);cx=coordinate(cx);cz=coordinate(cz);const m=getMetadata(cx,cz);if(!m)return null;
  for(const p of m.footprints||[]){const dx=x-p.x,dz=z-p.z,c=Math.cos(p.angle),s=Math.sin(p.angle);if(Math.abs(c*dx-s*dz)<=p.hx&&Math.abs(s*dx+c*dz)<=p.hz)return{...p}}
  const result=(kind,label,extra={})=>({kind,label,cx,cz,x,z,...extra});
  if(m.lake&&(m.lake.outlines||[m.lake.outline]).reduce((odd,loop)=>inside(x,z,loop)?!odd:odd,false))return result('water','湖泊',{lakeId:m.lake.id});
  if(m.farm){
   const px=x+m.farm.x,pz=z+m.farm.z;
   for(const t of FARM_TREES)if(Math.hypot(px-t.x,pz-t.z)<t.crownWidth*.5)return result('tree','Kephart 农场 · 树木');
  }
  for(const t of m.trees||[])if(Math.hypot(x-t.x,z-t.z)<t.r)return result('tree',m.vegetationMode==='grove'?'小树林':m.vegetationMode==='windbreak'?'防风林':'树木');
  for(const s of m.shrubs||[])if(Math.hypot(x-s.x,z-s.z)<s.r)return result('hedge','田边树篱');
  const surf=m.surface,k=surf?surf.classes[Math.min(surf.size-1,Math.max(0,Math.floor(z/64*surf.size)))*surf.size+Math.min(surf.size-1,Math.max(0,Math.floor(x/64*surf.size)))]:0;
  if(k===3)return result('path','田间双辙路');if(k===4)return result('grass','路边草带');
  if(meadowSample(x,z,m.meadow)>.32)return result('grass','田间草地');
  return result('field',['成熟小麦','枯褐大麦','收割麦茬'][k]||'麦田');
 }
 function cancelPending(){
  if(disposed)return;epoch++;pending.clear();if(fallback){fallback.cancelPending();return}
  // Keep old flights counted until the worker acknowledges cancellation. This
  // also bounds transferable surfaces while rapid pans cross several epochs.
  if(worker)send({type:'cancel',epoch});else inFlight.clear();
 }
 function clear(){if(disposed)return;cancelPending();releaseTiles();if(fallback)fallback.clear();else if(worker)send({type:'clear',epoch});revision++}
 function dispose(){if(disposed)return;disposed=true;epoch++;pending.clear();inFlight.clear();releaseTiles();fallback?.dispose();stopWorker();revision++}
 function stats(){
  if(fallback){const s=fallback.stats();return{...s,revision:revision+s.revision,mode:'fallback',failures:counters.failures,disposed}}
  let currentFlight=0;for(const j of inFlight.values())if(j.epoch===epoch)currentFlight++;
  return{...counters,revision,mode,tiles:tiles.size,pending:pending.size+currentFlight,inFlight:inFlight.size,maxInFlight,fields:0,fieldQueries:0,maxFields:0,maxTiles,maxPending,tilePixels,bytes:tiles.size*tilePixels*tilePixels*4,worker:workerStats,disposed};
 }
 try{
  if(workerFactory||typeof Worker!=='undefined'&&typeof OffscreenCanvas!=='undefined'&&typeof createImageBitmap==='function'){
   worker=workerFactory?workerFactory(new URL('./map-worker.js?v=54',import.meta.url)):new Worker(new URL('./map-worker.js?v=54',import.meta.url),{type:'module',name:'geography-map'});
   worker.onmessage=receive;worker.onerror=event=>{event.preventDefault?.();useFallback(event.message||'Map worker failed')};worker.onmessageerror=()=>useFallback('Map worker message could not be read');
   startupTimer=setTimeout(()=>useFallback('Map worker initialization timed out'),8000);startupTimer?.unref?.();
   send({type:'init',options:{seed,maxTiles:Math.min(48,maxTiles),tilePixels,maxPending:maxInFlight}});
  }else useFallback();
 }catch(error){useFallback(error)}
 return{request,pump,get,getMetadata,hitTest,cancelPending,clear,dispose,stats};
}
