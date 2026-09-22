import assert from 'node:assert/strict';
import {LensDropletPhysics,WaterEntryTracker,CameraWaterTracker} from '../../dist/lens-physics.js?v=27';
const rng=()=>{let x=44321;return()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};};
const results=[];
function massCheck(p,label){const error=Math.abs(p.injected-p.evaporated-p.runoff-p.mass());assert(error<.004,`${label} mass drift ${error}`);return error;}
const p=new LensDropletPhysics(64,rng());
for(let i=0;i<1200;i++){p.step(1/60,{rain:.85,pitch:.6,windX:2,humidity:.87});if(i%30===0){p.buildTexture();massCheck(p,'rain');}}
assert(p.drops.length<=64&&p.beads.length<=128);assert(p.rings.filter(x=>x.active).length<=16);
assert(p.pinches>0);assert(p.slipEvents>0);assert(p.pixels.length===p.fieldWidth*p.fieldHeight*4);
assert([...p.heightField].every(Number.isFinite));results.push({test:'20 seconds rain',heads:p.drops.length,beads:p.beads.length,pinches:p.pinches,slips:p.slipEvents,massError:massCheck(p,'rain')});
const dry=new LensDropletPhysics(8,rng()),humid=new LensDropletPhysics(8,rng());
for(const x of [dry,humid]){x._addBead(.5,.5,.8);x.deposit(.3,.3,.018,.6,3);}
for(let i=0;i<300;i++){dry.step(1/30,{humidity:.1});humid.step(1/30,{humidity:.94});}
assert(humid.mass()>dry.mass());results.push({test:'humidity slows water loss',dryMass:dry.mass(),humidMass:humid.mass()});
const camera=new CameraWaterTracker();assert.deepEqual(camera.update({hasWater:true,cameraHeight:2,level:0}),{submerged:false,crossing:0});
assert.equal(camera.update({hasWater:true,cameraHeight:-.03,level:0}).crossing,1);
assert.equal(camera.update({hasWater:true,cameraHeight:.01,level:0}).submerged,true);
assert.equal(camera.update({hasWater:true,cameraHeight:.04,level:0}).crossing,-1);
const f=new LensDropletPhysics(64,rng());f.setCameraWet(true,1);f.step(.1,{});f.buildTexture();
assert(f.sheet.submerged);const coverageBefore=f.pixels.filter((_,i)=>i%4===1).reduce((a,b)=>a+b,0)/f.heightField.length/255;
assert(coverageBefore>.98);f.setCameraWet(false,-1);const duration=f.sheet.life;assert(duration>=.3&&duration<=.7);
for(let i=0;i<30;i++)f.step(1/30,{humidity:.7});assert(!f.sheet.active);assert(f.drops.length>0);results.push({test:'camera sheet crossing',coverageBefore,ruptureSeconds:duration,headsAfter:f.drops.length,massError:massCheck(f,'sheet')});
const foot=new WaterEntryTracker();assert.equal(foot.update({shore:-1,feet:-.5,level:0}),0);assert.equal(foot.update({shore:1,feet:1,level:0}),0);assert(foot.update({shore:-1,feet:-.5,level:0,speed:2})>0);
const r=new LensDropletPhysics(4,rng());const ring=r.impact(.5,.5,1.4);assert(ring.life>=.3&&ring.life<=.8);r.step(.2,{});r.buildTexture();assert(Math.min(...r.heightField)<0);assert(Math.max(...r.heightField)>0);results.push({test:'impact ring',lifetime:ring.life,centerMin:Math.min(...r.heightField),rimMax:Math.max(...r.heightField)});
const aspectMass=p.mass();p.setAspect(.6);assert(Math.abs(p.mass()-aspectMass)<.0001);p.buildTexture();massCheck(p,'aspect');
console.log(JSON.stringify(results,null,2));
