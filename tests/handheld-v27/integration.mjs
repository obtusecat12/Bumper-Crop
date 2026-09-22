import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as T from '../../dist/vendor/three.module.min.js';
import {HandheldCameraRig} from '../../dist/handheld-camera.js';
import * as W from '../../dist/world.js?v=27';
const main=fs.readFileSync(new URL('../../dist/main.js',import.meta.url),'utf8');
// Exercise the shipped movement/camera integration, not a rewritten mock move.
function extract(start,end){const a=main.indexOf(start),b=main.indexOf(end,a+start.length);assert(a>=0&&b>a);return main.slice(a,b);}
const camera=new T.PerspectiveCamera(72,4/3,.075,480),rig=new HandheldCameraRig(camera),seed=W.stringSeed('CHLORINE / ABUNDANCE / 10');
const state={cx:0n,cz:0n,x:1,z:60,y:0,yaw:0,pitch:0,velocity:new T.Vector3(),jump:0,vy:0,grounded:true,stamina:100,hydration:100,distance:0,elapsed:0};
const chunks=new Map();let footsteps=0,rebases=0,referenceLeaves=0;
const ctx=vm.createContext({T,...W,Math,state,camera,cameraRig:rig,chunks,keys:new Set(),joy:{x:0,z:0},touchRun:false,referenceView:null,settings:{bob:true},reduceCameraMotion:{matches:false},audio:{footstep(){footsteps++;},update(){}},wind:{player:{value:new T.Vector3()}},rainAmount:0,step:0,hadMovement:false,wetPoseFresh:false,
 updateQueue(){rebases++;for(const c of chunks.values())c.group.position.set(Number(c.field.x-state.cx)*64,0,Number(c.field.z-state.cz)*64);},
 leaveReferenceView(){referenceLeaves++;ctx.referenceView=null;}});
for(let z=-1;z<=2;z++)for(let x=-1;x<=1;x++){
 const field=W.field(BigInt(x),BigInt(z),seed),group=new T.Group();group.position.set(x*64,0,z*64);
 chunks.set(`${x},${z}`,{field,group,wheatBuckets:new Map(),colliders:[],softVolumes:[]});
}
vm.runInContext(extract('function currentChunk()','function scanInteraction()')+extract('function jump()','async function fullscreen()'),ctx);
ctx.resetCameraRig();ctx.keys.add('KeyS');
let maxVelocity=0,maxCameraBody=0;
for(let i=0;i<240;i++){
 ctx.move(1/60);maxVelocity=Math.max(maxVelocity,rig.velocity.length());maxCameraBody=Math.max(maxCameraBody,Math.hypot(camera.position.x-state.x,camera.position.z-state.z));
 assert(Number.isFinite(camera.position.y));assert.equal(state.y,rig.height.position);
}
assert(rebases>0&&state.cz===1n,'Actual world.rebase ran during walking');assert(maxVelocity<5,'No 64 m rebase velocity spike');assert(maxCameraBody<.04,'Camera stays inside body clearance');assert(footsteps>5,'Audio driven by contacts');
ctx.keys.clear();for(let i=0;i<90;i++)ctx.move(1/60);
const distance=state.distance,steps=footsteps;for(let i=0;i<120;i++)ctx.move(1/60);
assert(Math.abs(state.distance-distance)<1e-6);assert.equal(footsteps,steps,'No held-step events while stationary');
ctx.keys.add('KeyC');for(let i=0;i<60;i++)ctx.move(1/60);
const floor=ctx.cameraFloor();assert(Math.abs(state.y-floor-1.06)<1e-5,'Crouch settles to real target height');
ctx.keys.clear();ctx.referenceView={eye:2.4};ctx.move(1/60);
assert.equal(camera.position.y,ctx.cameraFloor()+2.4);assert.equal(camera.rotation.y,state.yaw);assert.equal(camera.rotation.z,0);
ctx.jump();assert.equal(ctx.referenceView,null);assert.equal(referenceLeaves,1,'Jump exits photo view immediately');
const beforeLanding=footsteps;let landings=0;
for(let i=0;i<90;i++){ctx.move(1/60);if(rig.output.landing)landings++;}
assert.equal(landings,1);assert.equal(footsteps-beforeLanding,1,'One landing, one audio event');
const beforePause=camera.matrixWorld.toArray(),clock=rig.clock;rig.resume();
assert.deepEqual(camera.matrixWorld.toArray(),beforePause);assert.equal(rig.clock,clock,'Pause/resume never advances rig time');
ctx.reduceCameraMotion.matches=true;state.yaw=1.7;state.pitch=.4;ctx.move(1/60);
assert.equal(camera.rotation.y,state.yaw);assert.equal(camera.rotation.x,state.pitch);assert.equal(camera.rotation.z,0);assert.equal(camera.position.x,state.x);
// Teleport itself belongs to developer-tools; exercise its reset contract below.
state.cx=99999999999999999999999n;state.cz=-state.cx;state.x=31;state.z=8;state.jump=0;ctx.resetCameraRig();
assert.equal(camera.position.x,31);assert.equal(camera.position.z,8);assert.equal(rig.velocity.length(),0);assert.equal(ctx.wetPoseFresh,true);
assert(!main.includes('const bob=')&&!main.includes('camera.rotation.set(')&&!main.includes('camera.position.set('));
assert(main.includes('pitch:camera.rotation.x,yaw:camera.rotation.y'));
assert(main.indexOf('navigationMap.update(mapPose(),now,playing')>main.indexOf('if(playing){move(dt)'));
assert(!main.includes('if(!playing||wetPoseFresh)'),'Fresh baseline cannot turn real resumed velocity into an acceleration spike');
console.log(JSON.stringify({pass:true,checks:['shipped move() with real world.rebase','camera body clearance','footstep audio synchrony','stop','crouch height','locked photo','jump exits photo','one landing','paused pose','reduced motion','huge coordinate reset','lens and compass visual pose'],maxVelocity,maxCameraBody,rebases,footsteps},null,2));
