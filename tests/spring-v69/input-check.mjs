import assert from 'node:assert/strict';
import fs from 'node:fs';
import {LookInput} from '../../dist/look-input-v69.js';
const input=new LookInput(1000),events=[];
const push=(dx,dy,t,extra={})=>input.push(dx,dy,{now:t,stamp:t,scale:.001875,...extra});
// A high-poll-rate mouse is integrated once, independent of event count.
for(let i=0;i<16;i++)push(3,-1,1000+i);
let frame={...input.frame(1016)};assert(Math.abs(frame.x-.09)<1e-10);assert(Math.abs(frame.y+.03)<1e-10);events.push({case:'16 mouse reports, one render frame',frame});
assert.equal(input.frame(1032).x,0,'Motion cannot be replayed next frame');
// Normal fast flick remains responsive; huge coordinate warps are discarded.
push(480,100,1034);assert(Math.abs(input.frame(1048).x-.9)<1e-10);push(65535,0,1049);assert.equal(input.frame(1064).x,0);
push(NaN,4,1066);push(Infinity,0,1067);assert.equal(input.frame(1080).x,0);
// Simulate a 600 ms main-thread stall followed by the browser's old queue.
for(let i=0;i<80;i++)push(12,0,1680,{stamp:1090+i});
frame={...input.frame(1680)};assert(frame.recovered);assert.equal(frame.x,0);events.push({case:'600 ms stall + stale input burst',frame});
push(10,0,1684);assert.equal(input.frame(1696).x,.01875);
// Older pre-pause events and the first relative lock event must not move view.
input.reset(1800,{locked:true});push(900,0,1802,{stamp:1795,locked:true});push(300,0,1804,{locked:true});assert.equal(input.frame(1816).x,0);
push(8,0,1818,{locked:true});assert.equal(input.frame(1832).x,.015);
// DOMHighResTimeStamp and the legacy epoch clock both work.
input.reset(2000);push(8,0,2004,{stamp:1700000002004,origin:1700000000000});assert.equal(input.frame(2016).x,.015);
// Unlocked drag uses CSS client coordinates, never ambiguous movementX units.
input.beginDrag(200,100);input.drag(224,96,{now:2020,stamp:2020,scale:.004});frame={...input.frame(2032)};assert.equal(frame.x,.096);assert.equal(frame.y,-.016);
input.endDrag();input.drag(1000,1000,{now:2034,scale:.004});assert.equal(input.frame(2048).x,0);
// Touch/drag after a stall re-establishes a baseline instead of jumping.
input.beginDrag(20,20);input.frame(2400);input.drag(900,900,{now:2404,scale:.004});assert.equal(input.frame(2416).x,0);
input.drag(905,900,{now:2420,scale:.004});assert.equal(input.frame(2432).x,.02);
// Inspection and camera packets are never interpreted in each other's units.
push(8,0,2435);push(15,4,2437,{mode:'inspection',scale:1});frame={...input.frame(2448)};assert.equal(frame.mode,'inspection');assert.equal(frame.x,15);
// Bounded output has no residual catch-up on following frames.
for(let i=0;i<1000;i++)push(40,20,2450);
frame={...input.frame(2464)};assert.equal(frame.x,Math.PI);assert.equal(input.frame(2480).x,0);
input.reset(2600);push(800,0,2604);push(-800,0,2608);assert.equal(input.frame(2616).x,0,'Fast opposite mouse reports must cancel');
push(800,0,2620);assert.equal(input.frame(2632).x,1.5);push(400,0,2636,{scale:.0045});assert(Math.abs(input.frame(2648).x-1.8)<1e-10);
const main=fs.readFileSync(new URL('../../dist/main.js',import.meta.url),'utf8');
assert(main.includes('const look=lookInput.frame(now)'));assert(!main.includes('state.yaw-=e.movementX'));
assert(main.includes('resetLookInput(held)'));assert(main.includes('function setPlay(value){resetLookInput()'));
assert(main.includes('cameraRig.resume();wetPoseFresh=true;'));
const result={passed:true,checks:15,events,stats:input.stats,scope:'Production input accumulator + entrypoint wiring. Synthetic stall replay; not measured browser FPS.'};
fs.writeFileSync(new URL('./results/input-check.json',import.meta.url),JSON.stringify(result,null,2));console.log(result);
