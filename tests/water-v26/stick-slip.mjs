import fs from 'node:fs';
import assert from 'node:assert/strict';
import {LensDropletPhysics} from '../../dist/lens-physics.js?v=26';
function random(seed=4421){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
function representative(radius,rain=0){
 const p=new LensDropletPhysics(64,random(4421)),d=p.add(.44,.03,radius,0,.06),uid=d.uid;
 const trace=[];let wasMoving=true,startPause=null,pauses=[],exitTime=null,surges=0,peakSpeed=0;
 for(let frame=0;frame<900;frame++){
  p.step(1/30,{rain,humidity:.80,yaw:0,pitch:0});
  const t=(frame+1)/30;
  if(d.active&&d.uid===uid){
   const speed=Math.hypot(d.vx,d.vy);peakSpeed=Math.max(peakSpeed,speed);
   if(wasMoving&&!d.moving){startPause=t;}
   if(!wasMoving&&d.moving&&startPause!==null){pauses.push({start:+startPause.toFixed(3),duration:+(t-startPause).toFixed(3)});surges++;startPause=null;}
   if(frame%3===0)trace.push({t:+t.toFixed(3),x:+d.x.toFixed(5),y:+d.y.toFixed(5),r:+d.r.toFixed(3),speed:+speed.toFixed(5),moving:d.moving});
   wasMoving=d.moving;
  }else if(exitTime===null)exitTime=t;
 }
 if(startPause!==null)pauses.push({start:+startPause.toFixed(3),duration:+((exitTime??30)-startPause).toFixed(3),censored:true});
 const stats={radius,rain,trackedUID:uid,headExitOrMergeSeconds:exitTime,pauses,repeatSurges:surges,peakSpeed:+peakSpeed.toFixed(4),poolStickEvents:p.stickEvents,poolSlipEvents:p.slipEvents};
 return{stats,trace};
}
const output=[representative(1.2),representative(1.6),representative(1.2,.65),representative(1.6,.65)];
for(const row of output){assert(row.stats.repeatSurges>=2,'representative head must pause and surge repeatedly');assert(row.stats.poolStickEvents>=2);for(const pause of row.stats.pauses.filter(p=>!p.censored)){assert(pause.duration>=.075);}}
fs.writeFileSync(process.argv[2]||new URL('stick-slip-current.json',import.meta.url),JSON.stringify(output,null,2));
console.log(JSON.stringify(output.map(x=>x.stats),null,2));
