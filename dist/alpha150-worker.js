import {describeChunk150} from './alpha150-plan.js';
const cancelled=new Set();
self.onmessage=({data})=>{
 if(data.cancel){cancelled.add(data.cancel);if(cancelled.size>256)cancelled.delete(cancelled.values().next().value);return;}
 if(cancelled.delete(data.job))return;
 try{self.postMessage({job:data.job,desc:describeChunk150(data.id)});}catch(e){self.postMessage({job:data.job,error:String(e)});}
};
