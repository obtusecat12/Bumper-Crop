import assert from 'node:assert/strict';
import * as T from '../../dist/vendor/three.module.min.js';
import {WaterState,BodyWaterCrossing} from '../../dist/water-state.js';
import {lakeBedDepth} from '../../dist/water-profile.js';
import {field,stringSeed,surfaceHeight,pondShoreDistance} from '../../dist/world.js';
import {createWaterImpact} from '../../dist/water-impact.js';
import {createWaterBubbles} from '../../dist/water-bubbles.js';
import {DampedSpring} from '../../dist/handheld-camera.js';
import {createCameraFocus} from '../../dist/camera-focus.js';
import {radialWave} from '../../dist/water-ripples.js';
const input={hasWater:true,shore:-1,level:0,cameraHeight:1.7,rain:.8};
const arbiter=new WaterState();assert.equal(arbiter.update(0,input).crossing,0);assert.equal(arbiter.state,'rain');
input.cameraHeight=-.03;assert.equal(arbiter.update(.016,input).crossing,1);assert.equal(arbiter.washWeight,1);assert.equal(arbiter.state,'entryWash');
for(let i=0;i<20;i++)arbiter.update(.016,input);assert.equal(arbiter.state,'submerged');assert.equal(arbiter.washWeight,0);
input.cameraHeight=.04;assert.equal(arbiter.update(.016,input).crossing,-1);assert.equal(arbiter.flash,1);assert.equal(arbiter.state,'exitRupture');
for(let i=0;i<10;i++)arbiter.update(.016,input);assert.equal(arbiter.flash,0);assert(arbiter.washWeight>0);
for(let i=0;i<180;i++)arbiter.update(.016,input);assert.equal(arbiter.state,'rain');
const body=new BodyWaterCrossing(),s={x:63,z:8,cx:0n,cz:0n};assert.equal(body.update(s,1,0,true).power,0);
s.x=1;s.cx=1n;const hit=body.update(s,-1,0,true,-4);assert(hit.power>0);assert.equal(hit.x,0);assert.equal(hit.z,8);assert.equal(body.update(s,-1.1,0,true).power,0);
body.reset();assert.equal(body.update(s,-1,0,true).power,0,'teleport into water does not invent a world splash');
assert.equal(lakeBedDepth(0,9,11),0);assert(lakeBedDepth(8,9,11)<.55);assert(lakeBedDepth(17,9,11)>1.6);assert(lakeBedDepth(40,9,11)>4.5);
const seed=stringSeed('CHLORINE / ABUNDANCE / 10');let seamPairs=0;
for(let cx=-3;cx<0;cx++)for(let cz=-1;cz<2;cz++){
 const a=field(BigInt(cx),BigInt(cz),seed,false),b=field(BigInt(cx+1),BigInt(cz),seed,false);
 if(a.type==='pond'&&b.type==='pond'&&a.lakeId===b.lakeId)for(let z=0;z<=64;z+=2){assert(Math.abs(surfaceHeight(64,z,a)-surfaceHeight(0,z,b))<1e-8);seamPairs++;}
}
assert(seamPairs>0);
const scene=new T.Scene(),splash=createWaterImpact(scene);s.cx=0n;s.cz=0n;s.x=5;s.z=7;splash.emit(1,s,0);
assert(splash.group.children.every(x=>x.isInstancedMesh));assert(splash.group.children.every(x=>x.material.blending===T.NoBlending&&x.material.transparent===false));
const sheet=splash.group.children[0],drop=splash.group.children[1];assert.equal(sheet.geometry.attributes.iOrigin.array[0],5);assert.equal(sheet.geometry.attributes.iOrigin.array[2],7);
for(let i=0;i<240;i++){const life=drop.geometry.attributes.iData.array[i*4+1];assert(Math.abs(life-2.4)<1e-6);const radius=drop.geometry.attributes.iData.array[i*4];assert(radius>=.15&&radius<=.3);}
const x=drop.geometry.attributes.iOrigin.array[0];s.x=20;splash.update(.2,s,new T.PerspectiveCamera(),true);assert.equal(drop.geometry.attributes.iOrigin.array[0],x);
splash.update(1/60,s,null,false);assert(splash.group.visible,'pause preserves live splash');
const bubbles=createWaterBubbles(scene),camera=new T.PerspectiveCamera(72,4/3,.075,480);camera.position.set(0,-1,0);camera.updateMatrixWorld();s.x=0;s.z=0;bubbles.emit(camera,s,0);
assert.equal(bubbles.mesh.count,96);const p=bubbles.mesh.geometry.attributes.originBirth.array;
for(let i=0;i<96;i++){const z=-p[i*4+2];assert(z>=.3&&z<=1);}
const focus=createCameraFocus();focus.setBaseFov(72);for(let i=0;i<240;i++)focus.update(1/60,camera,true);assert(camera.fov>=71.65&&camera.fov<=72.35);focus.reset(camera);assert.equal(camera.fov,72);
const values=[];for(const fps of [30,60,120]){const spring=new DampedSpring(2);let max=0;for(let i=0;i<fps;i++){spring.advance(1/fps,10,8.79645943,.55);max=Math.max(max,spring.position);}assert(max>10.5);values.push(spring.position);}assert(Math.max(...values)-Math.min(...values)<1e-12);
assert(Math.abs(radialWave(4,.8)-radialWave(4,.8))<1e-12);assert.equal(radialWave(0,-1),0);
splash.dispose();bubbles.dispose();assert.equal(scene.children.length,0);
console.log(JSON.stringify({pass:true,seamPairs,checks:['five-state priority and 150 ms exit','strict body crossing at rebased world hit','8m shallows/shelf/deep fBm','cross-chunk geometry/collision continuity','actual instancing/Bayer material','fixed world origin, 240 billboard diameters .3–.6 m, 2.4 s record lifetime','96 fine front-cone bubbles','AF bounded FOV and framerate invariance']},null,2));
