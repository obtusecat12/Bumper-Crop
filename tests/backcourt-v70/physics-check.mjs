import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {createVendingPhysics,DEFAULT_DRINK_PROFILES} from '../../dist/vending-physics-v70.js';
const sim=createVendingPhysics({diagnostics:true,seed:170,layout:{deliveryPusher:true,maxCpuMs:Infinity,maxSolverSteps:24}});
const frames=[];let minimumY=Infinity,maxAngular=0;
function advance(seconds){for(let n=0;n<Math.ceil(seconds*60);n++){
  sim.step(1/60,{interpolate:false});
  for(const r of sim.records.values()){
    r.body.updateAABB();minimumY=Math.min(minimumY,r.body.aabb.lowerBound.y);
    maxAngular=Math.max(maxAngular,r.body.angularVelocity.length());
  }
}}
const types=['pet','can','soy'];let idFirst;
for(let i=0;i<12;i++){
  const r=sim.spawn(types[i%3]);if(!i)idFirst=r.id;
  advance(.85);
  frames.push({afterDrop:i+1,drinks:[...sim.records.values()].map(r=>({id:r.id,type:r.type,
    center:[r.body.position.x,r.body.position.y,r.body.position.z],grounded:r.grounded,inTray:r.inTray,sleeping:r.sleeping}))});
}
advance(16);
const all=[...sim.records.values()],fallen=all.filter(r=>r.grounded),settled=all.filter(r=>r.sleeping);
function exactCurrentOverlap(sim){
  const states=[...sim.records.values()].map(r=>[r.body,r.body.sleepState]);
  for(const [b]of states){b.sleepState=0;b.updateAABB();}
  const a=[],b=[],contacts=[],frictions=[];
  sim.world.broadphase.collisionPairs(sim.world,a,b);
  sim.world.narrowphase.getContacts(a,b,sim.world,contacts,[],frictions,[]);
  let max=0;for(const c of contacts){const d=(c.bi.position.x+c.ri.x-c.bj.position.x-c.rj.x)*c.ni.x+(c.bi.position.y+c.ri.y-c.bj.position.y-c.rj.y)*c.ni.y+(c.bi.position.z+c.ri.z-c.bj.position.z-c.rj.z)*c.ni.z;max=Math.max(max,d);}
  for(const [body,state]of states)body.sleepState=state;return max;
}
const stableOverlap=exactCurrentOverlap(sim);
assert.equal(all.length,12);assert.ok(fallen.length>=3,'repeated drinks should push drinks out of the tray');
assert.ok(fallen.some(r=>Number(r.id.slice(5))<6),'earlier drinks should be physically displaced onto ground');
assert.ok(sim.stats.dynamicImpacts>10,'real inter-drink contact impulses required');
assert.ok(maxAngular>3,'rolling and tumbling must have nonzero angular motion');
assert.ok(minimumY>-.009,'colliders must not cross through the ground');
assert.ok(sim.stats.maxPenetration<.018,'contacts must stay shallow under multi-body loads');
assert.ok(settled.length>=8,'most bodies must sleep after settling');
assert.ok(stableOverlap<.002,'current settled shapes must have less than 2mm of geometric contact overlap');
const frozen=all.map(r=>[...r.position,...r.quaternion]);const stepCount=sim.stats.steps;
sim.step(30,{active:false});assert.equal(sim.stats.steps,stepCount);
all.forEach((r,i)=>assert.deepEqual([...r.position,...r.quaternion],frozen[i]));
sim.setPaused(true);sim.step(1);assert.equal(sim.stats.steps,stepCount);sim.setPaused(false);
const pick=sim.take(idFirst);assert.equal(sim.size,11);assert.ok(pick);const restored=sim.restore(pick);assert.equal(sim.size,12);assert.equal(restored.id,idFirst);
advance(2);
const hugeSteps=sim.step(4);assert.ok(hugeSteps<=8);assert.ok(sim.stats.droppedTime>3.9);
for(let i=0;i<20;i++)assert.ok(sim.spawn(types[i%3],{position:[2+(i%5)*.35,.25,.50+Math.floor(i/5)*.35]}));assert.equal(sim.size,32);assert.equal(sim.spawn('pet'),null);
const report={passed:true,physics:'cannon-es 0.20.0, real convex contacts',
  bodyCountBeforeCapacity:12,groundedAfter12Drops:fallen.length,sleepingAfterSettling:settled.length,
  earlierDrinkOnGround:fallen.some(r=>Number(r.id.slice(5))<6),minimumGroundVertexY:minimumY,
  maxAngularVelocity:maxAngular,maximumContactPenetration:sim.stats.maxPenetration,
  fixedTimeStep:sim.fixedTimeStep,maximumFrameSubsteps:sim.maxSubsteps,
  pauseInvariant:true,heldItemRemovedAndRestored:true,capacityInvariant:true,stats:{...sim.stats},frames};
report.settledCurrentGeometryOverlap=stableOverlap;
sim.dispose();

// The mat has real thickness, independently of the courtyard ground plane.
const matSim=createVendingPhysics({layout:{groundPatch:{size:[1.18,.012,.78],center:[0,.006,.62]}},seed:88});
const matDrink=matSim.spawn('can',{position:[0,.3,.62],velocity:[0,0,0],angularVelocity:[0,0,0],quaternion:[0,0,Math.SQRT1_2,Math.SQRT1_2]});
for(let n=0;n<1440;n++)matSim.step(1/120,{interpolate:false});matDrink.body.updateAABB();
assert.ok(Math.abs(matDrink.body.aabb.lowerBound.y-.012)<.002,'drink must rest on top of the 12mm mat, not intersect it');
assert.ok(matDrink.grounded);assert.ok(matDrink.sleeping);matSim.dispose();

// Confirm the actual rotated floor falls toward the mouth in +Z.
const slopeSim=createVendingPhysics();const trayFloor=slopeSim.staticBodies.find(b=>b.name==='tray floor');
const rear=trayFloor.quaternion.vmult({x:0,y:slopeSim.layout.floorThickness*.5,z:-slopeSim.layout.depth*.5});
const front=trayFloor.quaternion.vmult({x:0,y:slopeSim.layout.floorThickness*.5,z:slopeSim.layout.depth*.5});
assert.ok(front.y<rear.y);slopeSim.dispose();
console.log('rubber mat support and frontward slope: passed');

// The authored vending unit's smaller reference-photo retrieval opening.
const authored=createVendingPhysics({diagnostics:true,seed:170,layout:{deliveryPusher:true,width:.46,floorY:.37,spawn:[0,.66,-.04],
  groundPatch:{size:[1.18,.012,.78],center:[0,.006,.62]},maxCpuMs:Infinity,maxSolverSteps:24}});
let authoredMinY=Infinity;
for(let i=0;i<12;i++){authored.spawn(types[i%3]);for(let n=0;n<51;n++){authored.step(1/60,{interpolate:false});for(const r of authored.records.values())authoredMinY=Math.min(authoredMinY,r.body.aabb.lowerBound.y);}}
for(let n=0;n<960;n++)authored.step(1/60,{interpolate:false});
const authoredOverlap=exactCurrentOverlap(authored),authoredFallen=[...authored.records.values()].filter(r=>r.grounded),authoredSleep=[...authored.records.values()].filter(r=>r.sleeping);
assert.ok(authoredFallen.length>=3);assert.ok(authoredSleep.length>=8);assert.ok(authoredOverlap<.002);assert.ok(authoredMinY>-.009);
assert.ok(Math.abs(authored.pusherTransform.size[0]-.38)<.000001);
report.authoredLayout={passed:true,width:.46,floorY:.37,spawn:[0,.66,-.04],grounded:authoredFallen.length,sleeping:authoredSleep.length,
  minimumGroundVertexY:authoredMinY,settledCurrentGeometryOverlap:authoredOverlap,stats:{...authored.stats}};
authored.dispose();
Object.assign(report,{rubberMatSupport:true,frontwardSlope:true,settledContactPenetration:report.stats.lastContactPenetration,spawnClearance:true});
await writeFile(new URL('./results/physics-report.json',import.meta.url),JSON.stringify(report,null,2));
console.log(JSON.stringify({...report,frames:undefined},null,2));
