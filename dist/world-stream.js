import {lakeAtlasKeys,acceptLakeAtlas} from './lake-shape.js?v=36';
import * as T from './vendor/three.module.min.js';
import {createUnpacker} from './scene-packets.js?v=36';
// One resident worker and one in-flight chunk keep memory bounded. Cancellation
// is logical: stale shared registrations must still arrive in message order.
export function createChunkStream({wind,viewUniform}){
 const codec=createUnpacker({T,wind,viewUniform});let worker=null,pending=null,serial=0,ready=false,disabled=false;
 function fail(error){
  disabled=true;ready=false;worker?.terminate();worker=null;
  if(pending){pending.error=error;pending.done=true;pending=null}
  console.warn('Background generation unavailable; using staged generation.',error);
 }
 if(typeof Worker==='undefined'||typeof OffscreenCanvas==='undefined')disabled=true;
 else try{
  worker=new Worker(new URL('./world-worker.js?v=36',import.meta.url),{type:'module',name:'level10-world'});
  worker.onmessage=({data})=>{
   if(data.ready){ready=true;return}
   const job=pending;pending=null;
   try{
    if(data.packet)codec.acceptShared(data.packet);
    for(const a of data.lakeAtlases||[])acceptLakeAtlas(a);
    if(!job||job.id!==data.id)return;
    if(data.error){job.error=Error(data.error);job.done=true;fail(job.error);return}
    if(!job.cancelled){job.chunk=codec.unpackChunk(data.packet);const chunk=job.chunk;chunk.disposePacketResources=()=>codec.dispose(chunk);job.timing=data.timing}
    job.done=true;
   }catch(error){if(job){job.error=error;job.done=true}fail(error)}
  };
  worker.onerror=event=>{event.preventDefault?.();fail(Error(event.message||'Worker initialization failed'))};
 }catch(error){fail(error)}
 return {
  get available(){return ready&&!disabled},get starting(){return !ready&&!disabled},get busy(){return !!pending},get disabled(){return disabled},
  request(args){if(!ready||disabled||pending)return null;const job={id:++serial,done:false,cancelled:false};pending=job;worker.postMessage({id:job.id,...args,knownLakes:lakeAtlasKeys()});return job},
  cancel(job){if(!job)return;job.cancelled=true;if(job.chunk){codec.dispose(job.chunk);job.chunk=null}},
  dispose(){worker?.terminate();if(pending)pending.cancelled=true;codec.disposeShared()}
 };
}
