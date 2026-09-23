import fs from 'node:fs';import {performance} from 'node:perf_hooks';
import {createVhsCore} from '../../dist/vhs-core.js';
const bytes=fs.readFileSync(new URL('../../dist/vendor/ntsc-rs/ntsc_rs_web_wrapper_bg.wasm',import.meta.url));
const core=await createVhsCore(bytes),report={node:process.version,kind:'CPU-only official ntsc-rs; excludes GL/readback/presentation',sizes:[]};
for(const [width,height]of [[960,720],[1440,1080]]){
 const pixels=new Uint8Array(width*height*4);for(let i=0;i<pixels.length;i+=4){pixels[i]=130+(i%79);pixels[i+1]=116+(i%71);pixels[i+2]=70+(i%101);pixels[i+3]=255;}
 for(let i=0;i<3;i++)core.process(pixels.buffer,width,height,i,{pregradedTopDown:true});
 const samples=[];for(let i=0;i<12;i++){const start=performance.now();core.process(pixels.buffer,width,height,i+3,{pregradedTopDown:true});samples.push(performance.now()-start);}
 samples.sort((a,b)=>a-b);report.sizes.push({width,height,bytesPerFrame:pixels.byteLength,medianMs:samples[6],p95Ms:samples[11]});
}core.dispose();fs.writeFileSync(new URL('../../docs/water-v28/ntsc-benchmark.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
