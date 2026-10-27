import assert from 'node:assert/strict';
import * as T from '../../dist/vendor/three.module.min.js';
import {ALPHA150,ALPHA_CHUNKS150,ALPHA_ROOMS150,alphaBlocked150,alphaHead150,describeChunk150,exteriorSafe150,inAlphaExterior150} from '../../dist/alpha150-plan.js';
import {createAlphaWorld150} from '../../dist/alpha150-world.js';
assert.equal(ALPHA_CHUNKS150.reduce((n,c)=>n+c.w*c.d,0),78000);
for(const c of ALPHA_CHUNKS150){assert(c.w<=24&&c.d<=24);const d=describeChunk150(c.id);assert(d.boxes.length);for(const b of d.boxes)assert(b.w>0&&b.h>0&&b.d>0);}
for(const r of ALPHA_ROOMS150){const x=r.x+r.w/2,z=r.z+r.d;assert(!alphaBlocked150(x,z,.25));assert.equal(alphaHead150(x,z),2.55);}
const q=exteriorSafe150(800,-500);assert(!inAlphaExterior150(q.x,q.z));
const w=createAlphaWorld150(T);const samples=[];
for(const p of [[4,185],[150,166],[286,230]]){const s=w.safe(...p);await w.ensure(s.x,s.z);w.update(0,s.x,s.z);assert(!w.blocked(s.x,s.z));samples.push(w.stats());assert(w.stats().resident<ALPHA_CHUNKS150.length);}
assert(samples[2].released>0);w.suspend();assert.equal(w.stats().resident,0);assert.equal(w.stats().materials,0);assert.equal(w.stats().rooms,0);
// Cancel pending asynchronous work before it attaches any groups.
const pending=w.ensure(4,185).catch(e=>e);w.suspend();assert(await pending instanceof Error);w.dispose();
console.log(JSON.stringify({rooms:ALPHA_ROOMS150.length,chunks:ALPHA_CHUNKS150.length,samples:samples.map(s=>({resident:s.resident,released:s.released,pending:s.pending})),releasedAll:true}));
