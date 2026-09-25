import assert from 'node:assert/strict';
import fs from 'node:fs';
import {field,stringSeed,roadProfile,surfaceHeight,wheatAllowed,compoundAt,compoundPlanner} from '../../dist/world.js?v=36';
import {field as oldField} from '../../dist/world-legacy.js?v=36';
import {createMapTarget,findNearestLandmark} from '../../dist/developer-tools.js?v=36';
import {makeCompoundChunk,compoundRainRoof} from '../../dist/compound-models.js?v=36';
import {createPacker,createUnpacker} from '../../dist/scene-packets.js?v=36';
import * as T from '../../dist/vendor/three.module.min.js';
const seed=stringSeed('CHLORINE / ABUNDANCE / 10'),cache=new Map(),get=(x,z)=>{const key=x+','+z;if(!cache.has(key))cache.set(key,field(x,z,seed));return cache.get(key)},report={seed};
let spawn=0,overlap=0,seams=0,maxSeam=0;
for(const [cx,cz] of [[-1n,0n],[0n,0n],[-1n,1n],[0n,1n]]){
 const f=get(cx,cz),old=oldField(cx,cz,seed),inside=p=>Math.hypot(Number(cx)*64+p.x-.6,Number(cz)*64+p.z-52)<20;
 assert.deepEqual(f.trees.filter(inside),old.trees.filter(inside),'Protected trees moved');assert.deepEqual(f.shrubs.filter(inside),old.shrubs.filter(inside),'Protected shrubs moved');
 for(let z=0;z<=64;z+=.5)for(let x=0;x<=64;x+=.5){if(!inside({x,z}))continue;spawn++;const r=roadProfile(x,z,f,{});if(r.rut>.10&&wheatAllowed(x,z,f))overlap++;assert.equal(compoundAt(x,z,f,{}).yard,0,'New yard enters protected circle');}
}
assert.equal(overlap,0);
for(const cx of [-1n,0n,1n,2n,10n,11n])for(const cz of [0n,1n,3n]){
 const a=get(cx,cz),b=get(cx+1n,cz);
 for(let z=0;z<=64;z+=.5){const ah=surfaceHeight(64,z,a),bh=surfaceHeight(0,z,b);maxSeam=Math.max(maxSeam,Math.abs(ah-bh));seams++;assert(Math.abs(ah-bh)<1e-7,'Terrain seam '+cx+','+cz+':'+z);const ar=roadProfile(64,z,a,{}),br=roadProfile(0,z,b,{});assert(Math.abs(ar.yard-br.yard)<1e-8,'Yard seam');}
}
const f=get(0n,0n),target=createMapTarget({cx:0n,cz:0n,x:34,z:13},seed);assert.equal(target.mapMode,'building');assert(compoundAt(target.x,target.z,target.field,{}).footprint>.65);
const job=findNearestLandmark({cx:0n,cz:0n,x:.6,z:52},seed,'building',3);let next;do{next=job.next()}while(!next.done);assert(next.value?.component?.kind==='barn');
const model=makeCompoundChunk(f,0);let vertices=0;model.group.traverse(o=>{if(o.isMesh){vertices+=o.geometry.attributes.position.count;assert([...o.geometry.attributes.position.array].every(Number.isFinite));}});assert(vertices>0);assert(model.colliders.length>0);assert(compoundRainRoof(34,13,model.rainRoofs)>7);
const pack=createPacker({T}).packChunk({group:model.group,field:f,colliders:model.colliders,pickups:model.pickups,softVolumes:[]});const unpack=createUnpacker({T});const transferred=unpack.unpackChunk(structuredClone(pack.packet,{transfer:pack.transfer}));assert.equal(transferred.field.compounds.length,f.compounds.length);assert.equal(transferred.colliders.length,model.colliders.length);
Object.assign(report,{pass:true,protectedSamples:spawn,overlappingWheatSamples:overlap,seamSamples:seams,maxSeam,arrivalVertices:vertices,arrivalColliders:model.colliders.length,packetRoundtrip:true,mapLanding:true,nearestBuilding:true});
fs.mkdirSync('docs/compounds-v36',{recursive:true});fs.writeFileSync('docs/compounds-v36/checks.json',JSON.stringify(report,null,2));console.log(report);
