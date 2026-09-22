// CPU-side checks using the current rig and its real Three module.
// Usage: node verify-motion.mjs [absolute-site-dist-directory]
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';

const dist=process.argv[2]??fileURLToPath(new URL('../../dist/',import.meta.url));
const {HandheldCameraRig,DampedSpring,angleDelta,PerlinNoise,sampleGait}=await import(pathToFileURL(path.join(dist,'handheld-camera.js')));
const {PerspectiveCamera}=await import(pathToFileURL(path.join(dist,'vendor/three.module.min.js')));
const outDir=fileURLToPath(new URL('../../docs/handheld-v27/',import.meta.url));
const report={source:'dist/handheld-camera.js',sha256:createHash('sha256').update(await readFile(path.join(dist,'handheld-camera.js'))).digest('hex'),tests:[],measurements:{},notes:[]};
const base={x:0,z:0,yaw:0,pitch:0,eyeY:1.77};
const fpsList=[30,60,120,144];
function make(input={}){const camera=new PerspectiveCamera();const rig=new HandheldCameraRig(camera);rig.reset({...base,...input});return {camera,rig};}
function near(a,b,epsilon=1e-10){assert.ok(Math.abs(a-b)<=epsilon,`${a} differs from ${b} by ${Math.abs(a-b)} (limit ${epsilon})`);}
function test(name,body){try{body();report.tests.push({name,status:'pass'});}catch(e){report.tests.push({name,status:'fail',error:e.message});}}
function components(camera){return [...camera.position.toArray(),camera.rotation.x,camera.rotation.y,camera.rotation.z];}
function finite(rig){assert.ok([...components(rig.camera),...rig.velocity.toArray(),rig.phase,rig.clock].every(Number.isFinite));}

test('Analytic damped spring is equal at 30, 60, 120, 144 Hz for constant targets',()=>{
 const rows=[];
 for(const zeta of [.64,.86,.88,.9,1])for(const t of [.5,1,2]){
  const direct=new DampedSpring(-.4);direct.velocity=.8;direct.advance(t,1.2,26,zeta);
  for(const fps of fpsList){const s=new DampedSpring(-.4);s.velocity=.8;for(let i=0;i<t*fps;i++)s.advance(1/fps,1.2,26,zeta);near(s.position,direct.position,2e-14);near(s.velocity,direct.velocity,2e-13);rows.push({zeta,t,fps,position:s.position,velocity:s.velocity});}
 }
 report.measurements.springSettle=rows.filter(row=>row.zeta===.88&&row.t===.5);
});
test('Zero and negative dt leave spring state unchanged',()=>{const s=new DampedSpring(.7);s.velocity=.4;s.advance(0,10);s.advance(-1,10);near(s.position,.7);near(s.velocity,.4);});
test('A dropped-frame spring interval remains finite and settles',()=>{const s=new DampedSpring();s.velocity=100;s.advance(100,1,28,.88);near(s.position,1);near(s.velocity,0);});
test('Look spring takes shortest path through ±π yaw seam',()=>{
 const from=179.8*Math.PI/180,to=-179.8*Math.PI/180,{rig}=make({yaw:from});let max=0;
 for(let i=0;i<144;i++){rig.update(1/144,{...base,yaw:to});max=Math.max(max,Math.abs(rig.yaw.position-from));finite(rig);}
 assert.ok(max<.41*Math.PI/180);near(angleDelta(rig.yaw.position,to),0,1e-10);report.measurements.yawSeamMaxDegrees=max*180/Math.PI;
});
test('Pitch stops retain hard bounds and cancel outward spring velocity',()=>{
 const {rig}=make();for(let i=0;i<600;i++){rig.update(1/60,{...base,pitch:i<300?20:-20});finite(rig);assert.ok(Math.abs(rig.pitch.position)<=1.4);assert.ok(Math.abs(rig.camera.rotation.x)<=1.415);}
});

const gaitRows=[];
for(const mode of [{name:'walk',speed:3,stride:1.34},{name:'aligned-walk',speed:2.68,stride:1.34},{name:'run',speed:5.4,stride:1.72,running:true},{name:'crouch',speed:1.35,stride:.76,crouch:true}]){
 for(const fps of fpsList){const {rig}=make();const seconds=20;let contacts=0,last=-100,nearDuplicates=0;const moved=mode.speed/fps;
  for(let i=0;i<seconds*fps;i++){const r=rig.update(1/fps,{...base,x:moved*(i+1),dx:moved,moved,...mode});if(r.contacts){if(i-last===1)nearDuplicates++;last=i;}contacts+=r.contacts;}
  const expected=Math.floor(mode.speed*seconds/mode.stride+1e-9);gaitRows.push({mode:mode.name,fps,contacts,expected,nearDuplicates,phase:rig.phase,heelY:rig.heelY.position,heelYVelocity:rig.heelY.velocity});
 }
}
report.measurements.gaitAcrossFps=gaitRows;
test('Gait emits exactly one contact per travelled stride across frame rates',()=>{for(const row of gaitRows)assert.equal(row.contacts,row.expected,JSON.stringify(row));});
test('Gait does not duplicate contacts on adjacent frames',()=>{for(const row of gaitRows)assert.equal(row.nearDuplicates,0,JSON.stringify(row));});
test('Event-timed heel response matches across FPS after the same constant-speed distance',()=>{
 for(const mode of ['walk','aligned-walk','run','crouch']){const rows=gaitRows.filter(r=>r.mode===mode);for(const row of rows.slice(1)){near(row.heelY,rows[0].heelY,2e-11);near(row.heelYVelocity,rows[0].heelYVelocity,2e-10);}}
});
test('Blocked movement emits no contacts and does not advance phase',()=>{
 const {rig}=make();for(let i=0;i<1440;i++){const result=rig.update(1/144,{...base,moved:0,dx:0,dz:0,running:true});assert.equal(result.contacts,0);near(result.phase,0);finite(rig);}
});
test('Airborne traversal freezes gait and reports one landing event',()=>{
 const {rig}=make();rig.update(1/60,{...base,moved:.5,dx:.5});const phase=rig.phase;let landingCount=0;
 for(let i=0;i<60;i++){const r=rig.update(1/60,{...base,x:.5+(i+1)*.05,moved:.05,dx:.05,jump:Math.sin(Math.PI*(i+1)/60),grounded:false});assert.equal(r.contacts,0);near(r.phase,phase);landingCount+=r.landing?1:0;}
 const landed=rig.update(1/60,{...base,landingSpeed:4,grounded:true});landingCount+=landed.landing?1:0;assert.equal(landed.contacts,0);near(landed.phase,0);assert.ok(rig.heelY.position<0);assert.equal(landingCount,1);
 for(let i=0;i<300;i++){const r=rig.update(1/60,base);assert.equal(r.landing,false);finite(rig);}assert.ok(Math.abs(rig.heelY.position)<1e-12);
});
test('Disabled motion gives exact input heading and zero camera noise or gait offsets',()=>{
 const {rig,camera}=make();for(let i=0;i<600;i++){const input={...base,x:(i+1)*.05,z:.2,yaw:Math.sin(i*.13),pitch:Math.cos(i*.11),moved:.05,dx:.05,enabled:false};rig.update(1/60,input);near(camera.position.x,input.x);near(camera.position.y,input.eyeY);near(camera.position.z,input.z);near(camera.rotation.y,input.yaw);near(camera.rotation.x,input.pitch);near(camera.rotation.z,0);}
});
test('Photo lock gives exact reference pose, zero velocity, no contacts, and frozen clock',()=>{
 const {rig,camera}=make();rig.update(1/60,{...base,moved:.1,dx:.1,yaw:.2});const clock=rig.clock;
 for(let i=0;i<60;i++){const input={...base,x:4,z:-3,yaw:.71,pitch:-.2,eyeY:1.3,jump:.2,locked:true,moved:.1,dx:.1};const r=rig.update(1/60,input);near(camera.position.x,4);near(camera.position.y,1.5);near(camera.position.z,-3);near(camera.rotation.y,.71);near(camera.rotation.x,-.2);near(camera.rotation.z,0);near(rig.velocity.length(),0);assert.equal(r.contacts,0);near(rig.phase,0);near(rig.clock,clock);}
});
test('64m x/z rebasing at huge BigInt coordinates preserves the physical camera velocity',()=>{
 const a=make({x:63.9,z:63.9}),b=make({x:63.9,z:63.9});let cx=10n**90n,cz=-(10n**90n);let localX=63.9,localZ=63.9;const startCx=cx,startCz=cz;
 for(let i=0;i<1000;i++){const dx=.047,dz=.025;localX+=dx;localZ+=dz;if(localX>=64){localX-=64;cx++;}if(localZ>=64){localZ-=64;cz++;}const input={...base,dx,dz,moved:Math.hypot(dx,dz),yaw:.4};a.rig.update(1/60,{...input,x:63.9+(i+1)*dx,z:63.9+(i+1)*dz});b.rig.update(1/60,{...input,x:localX,z:localZ});for(let axis=0;axis<3;axis++)near(a.rig.velocity.getComponent(axis),b.rig.velocity.getComponent(axis),1e-12);finite(b.rig);}
 assert.equal(cx,startCx+1n);assert.equal(cz,startCz+1n);report.measurements.rebaseVelocity=b.rig.velocity.toArray();
});
test('Resume clears velocity and look spring derivative while retaining frozen pose',()=>{const {rig}=make();rig.update(1/60,{...base,x:.1,dx:.1,moved:.1,yaw:1});const before=components(rig.camera);rig.resume();assert.deepEqual(components(rig.camera),before);near(rig.velocity.length(),0);near(rig.yaw.velocity,0);near(rig.pitch.velocity,0);});
test('Gait path closes continuously at full stride',()=>{const a=new Float64Array(2),b=new Float64Array(2);sampleGait(0,a);sampleGait(2*Math.PI,b);near(a[0],b[0]);near(a[1],b[1]);sampleGait(2*Math.PI-1e-7,b);near(a[0],b[0],1e-6);near(a[1],b[1],1e-6);});
test('Perlin seed is deterministic and independent coordinate bands remain bounded',()=>{const a=new PerlinNoise(),b=new PerlinNoise();let max=0;for(let i=0;i<10000;i++){const v=a.sample(i*.0723,i*.1017,i*.13);near(v,b.sample(i*.0723,i*.1017,i*.13),0);max=Math.max(max,Math.abs(v));assert.ok(Math.abs(v)<1.01);}report.measurements.maxPerlinSample=max;});
test('Ten minutes of locomotion keep offsets, rotations, springs and velocity finite and bounded',()=>{
 const {rig,camera}=make();const frames=600*144;let maxTranslation=0,maxRotation=0,maxVelocity=0,maxHeel=0;
 for(let i=0;i<frames;i++){const dt=1/144,speed=i%1440<720?3:5.4,dx=speed*dt,x=(i*dx)%64,input={...base,x,moved:dx,dx,running:speed===5.4,stamina:0};rig.update(dt,input);finite(rig);maxTranslation=Math.max(maxTranslation,Math.hypot(camera.position.x-x,camera.position.y-base.eyeY,camera.position.z));maxRotation=Math.max(maxRotation,...[camera.rotation.x,camera.rotation.y,camera.rotation.z].map(Math.abs));maxVelocity=Math.max(maxVelocity,rig.velocity.length());maxHeel=Math.max(maxHeel,Math.abs(rig.heelY.position));}
 report.measurements.tenMinuteBounds={maxTranslationMetres:maxTranslation,maxRotationDegrees:maxRotation*180/Math.PI,maxVelocityMetresPerSecond:maxVelocity,maxHeelMetres:maxHeel};assert.ok(maxTranslation<.06);assert.ok(maxRotation<.04);assert.ok(maxVelocity<7);assert.ok(maxHeel<.03);
});
test('Long-clock samples stay finite and bounded without accumulated positional drift',()=>{const {rig,camera}=make();let max=0;for(const time of [3600,86400,604800,31536000,1e9]){rig.clock=time;for(let i=0;i<144;i++){rig.update(1/144,base);finite(rig);max=Math.max(max,Math.abs(camera.rotation.y),Math.abs(camera.rotation.x),Math.abs(camera.rotation.z));assert.ok(Math.abs(camera.position.y-1.77)<1e-9);}}report.measurements.longClockMaxRotationDegrees=max*180/Math.PI;assert.ok(max<.04);});

// CPU-only throughput: a useful regression number, not a browser/render benchmark.
const {rig:perf}=make();const perfInput={...base,moved:.025,dx:.025};for(let i=0;i<10000;i++)perf.update(1/120,perfInput);const times=[];
for(let batch=0;batch<5;batch++){const start=performance.now();for(let i=0;i<30000;i++)perf.update(1/120,perfInput);times.push((performance.now()-start)/30000);}
times.sort((a,b)=>a-b);report.measurements.cpuMillisecondsPerUpdate={median:times[2],batches:times,node:process.version,includes:'Rig math and real Three camera updateMatrixWorld; excludes renderer, UI, GPU, and game simulation'};
report.notes.push('DampedSpring tested for underdamped and critically damped parameters used by the product; implementation is not a generic overdamped solver for zeta > 1.');
report.notes.push('Position and rotation bounds are tuning observations under constant heading, not clinical comfort guarantees. Dynamic input is discretized per frame; only constant-target spring integration is mathematically exact.');
const failed=report.tests.filter(t=>t.status==='fail');report.summary={passed:report.tests.length-failed.length,failed:failed.length};
await writeFile(path.join(outDir,'motion-report.json'),JSON.stringify(report,null,2)+'\n');
const lines=['# Camera rig numeric verification','',`Source SHA-256: \`${report.sha256}\``,`${report.summary.passed} passed; ${report.summary.failed} failed.`,'',...report.tests.map(t=>`- ${t.status.toUpperCase()}: ${t.name}${t.error?' — '+t.error:''}`),'','## Frame-rate gait measurements','','| Mode | FPS | Contacts | Expected | Adjacent-frame duplicates |','|---|---:|---:|---:|---:|',...gaitRows.map(r=>`| ${r.mode} | ${r.fps} | ${r.contacts} | ${r.expected} | ${r.nearDuplicates} |`),'','## Measured bounds and cost','',...Object.entries(report.measurements.tenMinuteBounds??{}).map(([k,v])=>`- ${k}: ${v}`),`- Median CPU cost: ${times[2].toFixed(6)} ms/update (${process.version}).`,'',...report.notes.map(n=>`- ${n}`),''];
await writeFile(path.join(outDir,'motion-report.md'),lines.join('\n'));
console.log(JSON.stringify({summary:report.summary,failed,measurements:{gaitAcrossFps:gaitRows,tenMinuteBounds:report.measurements.tenMinuteBounds,cpuMillisecondsPerUpdate:report.measurements.cpuMillisecondsPerUpdate}},null,2));
process.exitCode=failed.length?1:0;
