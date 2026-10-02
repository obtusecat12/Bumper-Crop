import {createVendingPhysics} from '../../dist/vending-physics-v70.js';
import {writeFile} from 'node:fs/promises';
function summary(samples){samples.sort((a,b)=>a-b);return{medianMs:samples[samples.length>>1],p95Ms:samples[Math.floor(samples.length*.95)]};}
const scenarios=[];
for(const count of [12,32]){
  const s=createVendingPhysics({seed:170,layout:{deliveryPusher:true,width:.46,floorY:.37,spawn:[0,.66,-.04],
    groundPatch:{size:[1.18,.012,.78],center:[0,.006,.62]}}});
  for(let i=0;i<count;i++){s.spawn(['pet','can','soy'][i%3]);for(let n=0;n<51;n++)s.step(1/60);}
  const samples=[];for(let n=0;n<60;n++){const t=performance.now();s.step(1/60);samples.push(performance.now()-t);}
  scenarios.push({name:'successive real dispenses',bodies:s.size,awake:[...s.records.values()].filter(r=>!r.sleeping).length,...summary(samples)});
  for(let n=0;n<960;n++)s.step(1/60);const settled=[];for(let n=0;n<120;n++){const t=performance.now();s.step(1/60);settled.push(performance.now()-t);}
  scenarios.push({name:'after settling',bodies:s.size,awake:[...s.records.values()].filter(r=>!r.sleeping).length,...summary(settled)});s.dispose();
}
for(const sleeping of [false,true]){
  const s=createVendingPhysics();for(let i=0;i<32;i++){const b=s.spawn(['pet','can','soy'][i%3],
    {position:[(i%8)*.28-1,sleeping?.05:1+Math.floor(i/8)*.3,.6+Math.floor(i/8)*.35],velocity:[0,0,0]});if(sleeping)b.body.sleep();}
  const samples=[];for(let n=0;n<20;n++){const t=performance.now();s.step(1/60);samples.push(performance.now()-t);}
  scenarios.push({name:sleeping?'32 sleeping':'32 simultaneously falling',bodies:s.size,awake:[...s.records.values()].filter(r=>!r.sleeping).length,...summary(samples)});s.dispose();
}
const report={nodeCPUOnly:true,notBrowserFPS:true,scenarios};
await writeFile(new URL('./results/physics-cpu-report.json',import.meta.url),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
