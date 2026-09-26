import{createMapTiles}from'./map-tiles.js?v=54';

// Runs exclusively in a dedicated module worker. No Three, textures, streamed
// chunks, or DOM are initialized here. Cached canvases survive bitmap exports.
let atlas=null,epoch=0,timer=null,running=false,failed=false;
const jobs=new Map();
const close=bitmap=>{try{bitmap?.close?.()}catch{}};
function schedule(){if(!failed&&atlas&&jobs.size&&!running&&timer===null)timer=setTimeout(runSlice,0)}
function fail(error){failed=true;if(timer!==null)clearTimeout(timer);timer=null;jobs.clear();atlas?.dispose();self.postMessage({type:'error',message:String(error?.message||error)})}
async function runSlice(){
 timer=null;if(failed||!atlas||!jobs.size)return;running=true;const packets=[];
 try{
  // A cached canvas may have been evicted by a preceding slice before export.
  // Re-requesting here keeps those jobs live without any main-thread messages.
  for(const job of jobs.values())atlas.request(job.cx,job.cz,job.priority);
  atlas.pump(3,2);
  // At most four transferable bitmaps are created per slice. Main-thread
  // flight credits bound every queued or delivered-but-unhandled bitmap.
  for(const job of [...jobs.values()].sort((a,b)=>a.priority-b.priority||a.order-b.order)){
   if(packets.length>=4)break;
   if(job.epoch!==epoch||failed)break;
   const canvas=atlas.get(job.cx,job.cz);if(!canvas)continue;
   const metadata=atlas.getMetadata(job.cx,job.cz),bitmap=await createImageBitmap(canvas);
   if(failed||job.epoch!==epoch||jobs.get(job.key)!==job){close(bitmap);continue}
   jobs.delete(job.key);packets.push({id:job.id,key:job.key,epoch:job.epoch,bitmap,metadata});
  }
  // Cancellation can arrive while createImageBitmap is awaiting another tile.
  const current=[];for(const p of packets)if(p.epoch===epoch&&!failed)current.push(p);else close(p.bitmap);
  if(current.length)self.postMessage({type:'tiles',tiles:current,stats:atlas.stats()},current.map(p=>p.bitmap));
 }catch(error){for(const p of packets)close(p.bitmap);fail(error)}
 finally{running=false;schedule()}
}
self.onmessage=event=>{
 if(failed)return;const data=event.data||{};
 try{
  if(data.type==='init'){
   if(typeof OffscreenCanvas==='undefined'||typeof createImageBitmap!=='function')throw new Error('OffscreenCanvas and ImageBitmap are required');
   atlas?.dispose();jobs.clear();epoch=0;atlas=createMapTiles({...data.options,canvasFactory:n=>new OffscreenCanvas(n,n)});self.postMessage({type:'ready'});return;
  }
  if(!atlas)return;
  if(data.type==='cancel'||data.type==='clear'){
   if(data.epoch<epoch)return;epoch=data.epoch;jobs.clear();atlas.cancelPending();if(data.type==='clear')atlas.clear();
   if(timer!==null)clearTimeout(timer);timer=null;self.postMessage({type:'cancelled',epoch});return;
  }
  if(data.type==='request'){
   if(data.epoch!==epoch)return;
   for(const j of data.jobs||[]){
    if(j.epoch!==epoch||jobs.has(j.key))continue;
    if(jobs.size>=atlas.stats().maxPending)break;
    const job={...j,cx:BigInt(j.cx),cz:BigInt(j.cz)};jobs.set(job.key,job);atlas.request(job.cx,job.cz,job.priority);
   }
   schedule();
  }
 }catch(error){fail(error)}
};
