import assert from 'node:assert/strict';
import fs from 'node:fs';
import {BATH_ARRIVAL,BATH_POOL,bathFloor,bathAllowed,resolveBath} from '../../dist/bathhouse-layout.js?v=66';
import {SPA,SPA_ENTRY,spaStepLocal} from '../../dist/spa-layout-v66.js';
const c=Math.cos(SPA_ENTRY.angle),s=Math.sin(SPA_ENTRY.angle),radial=r=>[SPA.cx+c*r,SPA.cz+s*r];
const points=[[0,2.7],[0,-.45],[3.05,-.50],[3.68,-1.58],[4.80,-1.58],[5.70,-.70],[6.82,-.30],[8.15,.20],[10.35,.20],radial(2.84),...Array.from({length:38},(_,i)=>radial(2.84-i*.05)),[SPA.cx,SPA.cz]];
let pose={...BATH_ARRIVAL},samples=0,maxStep=0;
function walk(target){for(let i=0;i<500;i++){const dx=target[0]-pose.x,dz=target[1]-pose.z,d=Math.hypot(dx,dz);if(d<.014)return;const f=Math.min(1,.018/d),next=resolveBath(pose,{x:pose.x+dx*f,z:pose.z+dz*f});assert(bathAllowed(next.x,next.z));maxStep=Math.max(maxStep,Math.abs(bathFloor(next.x,next.z)-bathFloor(pose.x,pose.z)));assert(Math.hypot(next.x-pose.x,next.z-pose.z)>.00001,JSON.stringify({stalled:pose,target}));pose=next;samples++;}assert.fail('Route did not converge');}
for(const p of points)walk(p);assert.equal(bathFloor(pose.x,pose.z),SPA.bottomY);for(const p of points.slice(0,-1).reverse())walk(p);walk([BATH_ARRIVAL.x,BATH_ARRIVAL.z]);
for(let i=0;i<6;i++){const p=radial(SPA_ENTRY.start-(i+.5)*SPA_ENTRY.tread);assert(Math.abs(bathFloor(...p)+(i+1)*SPA_ENTRY.rise)<1e-8);assert(Math.abs(spaStepLocal(...p).across)<1e-8);}
for(const p of[[0,2.7],[0,-.45],[3.05,-.50],[3.68,-1.58],[4.80,-1.58],[5.70,-.70],[6.82,-.30],[8.15,.20],[10.35,.20],[10.40,2.9],[10.32,3.86],[11.65,3.86],[10.32,3.86],[10.40,2.9],[10.35,.20],[8.15,.20],[6.82,-.30],[5.70,-.70],[4.80,-1.58],[3.68,-1.58],[3.05,-.50],[0,-.45],[BATH_ARRIVAL.x,BATH_ARRIVAL.z]])walk(p);
assert.equal(BATH_POOL.length,63); // Original rounded basin stays unchanged.
const report={samples,maxStep,emptyBasinVertices:BATH_POOL.length,route:'Reception → original empty deck → east portal → spa deck → six shared steps → water → loungers → glass screen → changing room → exact return',floorAtArrival:bathFloor(BATH_ARRIVAL.x,BATH_ARRIVAL.z),waterBottom:SPA.bottomY};fs.writeFileSync(new URL('./results/layout-check.json',import.meta.url),JSON.stringify(report,null,2));console.log(report);
