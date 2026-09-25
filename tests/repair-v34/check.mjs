import assert from 'node:assert/strict';import fs from 'node:fs';
import {field,stringSeed,cropSample,roadProfile,surfaceHeight,lakeRoadClearance,arrivalRoadWeight} from '../../dist/world.js?v=34';
import {prepareWheatDetail}from '../../dist/dense-wheat.js?v=34';
import{prepareWheatDetail as before}from'/tmp/dense-wheat-v32-appearance.mjs';
import{field as oldField,roadProfile as oldRoad}from'/tmp/world-v32-arrival.mjs';
const seed=stringSeed('CHLORINE / ABUNDANCE / 10'),kinds=[];
for(let z=8;z<20&&kinds.filter(Boolean).length<3;z++)for(let x=8;x<20;x++){const f=field(BigInt(x),BigInt(z),seed,false),c=cropSample(32,32,f,{});if(c.distance>48&&f.type==='wheat'&&!f.meadow&&!kinds[c.crop])kinds[c.crop]=f;}
const a=prepareWheatDetail(kinds[0],'balanced'),b=before(kinds[0],'balanced');assert.equal(a.count,b.count);assert.equal(a.patches.length,b.patches.length);for(let i=0;i<a.patches.length;i++){assert.deepEqual(a.patches[i].roots,b.patches[i].roots);assert.deepEqual(a.patches[i].matrices,b.patches[i].matrices);assert.deepEqual(a.patches[i].colors,b.patches[i].colors);}
const barley=prepareWheatDetail(kinds[1],'balanced');assert(barley.count/a.count>1.50&&barley.count/a.count<1.62);let roadDiff=0,checks=0,buildings=0;
for(let z=-2;z<2;z++)for(let x=0;x<2;x++){const f=field(BigInt(x),BigInt(z),seed,false),old=oldField(f.x,f.z,seed,false);for(const key of ['type','variant','cx','cz','buildingAngle','buildingScale','buildingY'])assert.equal(f[key],old[key]);buildings++;
 for(let j=4;j<60;j+=4)for(let i=4;i<60;i+=4){if(arrivalRoadWeight(i,j,f)<1||lakeRoadClearance(i,j,f)<36)continue;const p=roadProfile(i,j,f,{}),q=oldRoad(i,j,old,{});roadDiff=Math.max(roadDiff,Math.abs(p.relief-q.relief));checks++;}}
assert(roadDiff<1e-10);const start=field(0n,0n,seed,false);assert(roadProfile(.6,52,start,{}).distance<2.05,'spawn on restored lane');let seam=0;
for(let z=-4;z<=4;z++)for(let x=-3;x<=4;x++){const a=field(BigInt(x),BigInt(z),seed,false),b=field(a.x+1n,a.z,seed,false);for(let t=0;t<=64;t+=2)seam=Math.max(seam,Math.abs(surfaceHeight(64,t,a)-surfaceHeight(0,t,b)));}assert(seam<1e-6);
const report={pass:true,wheatDetailInstancesExact:a.count,wheatMatricesAndColors:'byte identical to V32 appearance under current clearing masks',barleyDetail:barley.count,barleyRatio:barley.count/a.count,arrivalRoadChecks:checks,arrivalRoadReliefError:roadDiff,buildingDescriptors:buildings,seam};fs.writeFileSync(new URL('../../docs/repair-v34/checks.json',import.meta.url),JSON.stringify(report,null,2));console.log(report);
