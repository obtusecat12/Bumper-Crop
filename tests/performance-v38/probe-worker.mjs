import assert from 'node:assert/strict';import {Worker} from 'node:worker_threads';import {pathToFileURL} from 'node:url';
const baseline=pathToFileURL((process.argv[2]||'/tmp/v38-baseline/dist')+'/irradiance-worker.js').href+'?v=37',current=new URL('../../dist/irradiance-worker.js?v=38',import.meta.url).href;
function trace(url){return new Promise((resolve,reject)=>{
 const worker=new Worker(`const {parentPort,workerData}=require('node:worker_threads');globalThis.self={postMessage:(m,t)=>parentPort.postMessage(m,t)};parentPort.on('message',data=>self.onmessage({data}));import(workerData).catch(e=>parentPort.postMessage({type:'error',message:e.stack}));`,{eval:true,workerData:url});
 let pump,frame=0,first;const timeout=setTimeout(()=>finish(Error('Probe worker timed out')),30000);
 function finish(error,value){clearTimeout(timeout);clearInterval(pump);worker.terminate();error?reject(error):resolve(value);}
 worker.on('error',finish);worker.on('message',m=>{
  if(m.type==='error')return finish(Error(m.message));
  if(m.type==='ready'){pump=setInterval(()=>worker.postMessage({type:'budget',frame:++frame}),16);worker.postMessage({type:'pause',value:true});worker.postMessage({type:'trace',id:1,cx:0n,cz:0n,baseX:0,baseY:0,baseZ:0});setTimeout(()=>worker.postMessage({type:'pause',value:false}),32);}
  if(m.type==='volume'){if(!first){first=m;worker.postMessage({type:'trace',id:2,cx:0n,cz:0n,baseX:0,baseY:0,baseZ:0});}else{assert.equal(m.stats.computed,0);finish(null,{first,cached:m.stats});}}
 });
 });}
const old=await trace(baseline),now=await trace(current);for(const k of ['sh','moments','positions'])assert.deepEqual(now.first[k],old.first[k]);assert(now.first.stats.peakFrameRays<=24000);console.log(JSON.stringify({exactVolumeMatch:true,pauseResume:true,current:now.first.stats,cached:now.cached},null,2));
