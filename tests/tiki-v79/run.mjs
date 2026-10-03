import assert from 'node:assert/strict';import{readFile,writeFile,mkdir,readdir}from'node:fs/promises';import{createHash}from'node:crypto';
import*as T from'../../dist/vendor/three.module.min.js';import{createTikiActor79,TIKI_ROLES79}from'../../dist/tiki-cast-v79.js';import{posePlan79}from'../../dist/tiki-pose-v79.js';import{TIKI_PEOPLE79}from'../../dist/tiki-occupants-v79.js';import{tikiBlocked}from'../../dist/tiki-plan-v79.js';
const meta=JSON.parse(await readFile(new URL('../../dist/textures/npc-v79/manifest.json',import.meta.url))),results=[],hashes={face:new Set,body:new Set};
const makeTex=()=>{const t=new T.DataTexture(new Uint8Array(128*128*4).fill(150),128,128);t.needsUpdate=true;return t;};
const held={bartender:368,sleeper:0,barwoman:120,waiter:32,orderer:0,elder:112,asianwoman:0};
for(const role of TIKI_ROLES79){
 for(const key of ['face','face-blink','body','hair',...(role==='elder'?['beard']:[]),...(role==='barwoman'?['dress-fabric']:[])]){const b=await readFile(new URL(`../../dist/textures/npc-v79/${role}/${key}.png`,import.meta.url));assert.equal(b.readUInt32BE(16),128);assert.equal(b.readUInt32BE(20),128);if(hashes[key])hashes[key].add(createHash('sha256').update(b).digest('hex'));}
 const tx={face:makeTex(),faceBlink:makeTex(),body:makeTex(),hair:makeTex(),beard:makeTex()},anchor=TIKI_PEOPLE79.find(p=>p.role===role),a=createTikiActor79(T,role,tx,{...anchor,...meta[role],phase:0}),scale=a.group.scale.x;
 assert.equal(a.bones.hips.isBone,true);assert.equal(a.mesh.skeleton.bones.length,19);assert(a.mesh.isSkinnedMesh);assert(a.diagnostics.triangles+held[role]<=1500);assert(a.diagnostics.triangles>=500);
 for(const track of a.clip.tracks)assert.equal(track.getInterpolation(),T.InterpolateDiscrete);
 for(const texture of Object.values(tx)){assert.equal(texture.minFilter,T.NearestFilter);assert.equal(texture.magFilter,T.NearestFilter);assert.equal(texture.generateMipmaps,false);}
 const versions=Object.values(tx).map(x=>x.version),feetFirst={},feetDrift={L:0,R:0};let maxHandError=0,headMotion=0,chestMotion=0;const first=a.samplePose(0),bone0=first.bones.head.quaternion;
 for(let f=0;f<a.clip.duration*30;f++){
  const t=f/30;a.update(t);const pose=a.samplePose(t),p=posePlan79(role,t,{seatHeight:(anchor.seatHeight??.545)/scale});
  for(const side of ['L','R']){const actual=new T.Vector3(...pose.bones['hand'+side].position).multiplyScalar(1/scale),desired=new T.Vector3(...p.hands[side]);maxHandError=Math.max(maxHandError,actual.distanceTo(desired));
   const foot=new T.Vector3(...pose.bones['foot'+side].position);feetFirst[side]??=foot.clone();feetDrift[side]=Math.max(feetDrift[side],foot.distanceTo(feetFirst[side]));}
  headMotion=Math.max(headMotion,new T.Quaternion(...bone0).angleTo(new T.Quaternion(...pose.bones.head.quaternion)));chestMotion=Math.max(chestMotion,Math.abs(pose.bones.chest.scale[2]-1));
 }
 assert(maxHandError<.004,`${role}: hand target drift ${maxHandError}`);assert(Math.max(...Object.values(feetDrift))<.006,role+' feet slide');assert(chestMotion>.002,role+' breathing absent');if(role!=='sleeper')assert(headMotion>.02,role+' head idle absent');
 a.forceBlink('closed');assert(a.diagnostics.eyeClosed);a.forceBlink('open');assert.equal(a.diagnostics.eyeClosed,role==='sleeper');assert.deepEqual(Object.values(tx).map(x=>x.version),versions,'animation reuploads textures');
 results.push({role,bodyTriangles:a.diagnostics.triangles,totalTriangles:a.diagnostics.triangles+held[role],maxHandTargetErrorMetres:maxHandError,feetDriftMetres:feetDrift,headMotionRadians:headMotion,chestScaleMotion:chestMotion,rigBones:19,poseHz:a.diagnostics.poseHz});a.dispose();
}
assert.equal(hashes.face.size,7,'repeated face');assert.equal(hashes.body.size,7,'repeated clothes');
let pourFrames=0,maxPourXZ=0;for(let f=0;f<18*30;f++){const p=posePlan79('bartender',f/30).props;assert(p.bottle.visible&&p.shaker.visible,'prop disappears');if(p.pour){pourFrames++;const d=Math.hypot(p.bottle.tip[0]-p.glass[0],p.bottle.tip[2]-p.glass[2]);maxPourXZ=Math.max(maxPourXZ,d);assert(d<.01,'pour misses glass');assert(p.bottle.tip[1]>p.glass[1]+.221,'bottle mouth below glass rim');}}
assert(pourFrames>70);
for(let i=0;i<360;i++){const p=posePlan79('waiter',i/30).props;assert(Math.abs(p.pen[0]-p.pad[0])<.095);assert(Math.abs(p.pen[2]-p.pad[2])<.12);assert(Math.abs(p.pen[1]-(p.pad[1]+.006))<.003,'pen nib not on pad');}
assert(tikiBlocked(-3.10,-1.3));assert(tikiBlocked(5.03,-.58));for(const [x,z]of[[0,5.8],[0,3],[0,1],[-2,1],[-2,-1],[-2.6,-2.7],[1,-1],[1,-3]])assert(!tikiBlocked(x,z),'main aisle blocked');
await mkdir(new URL('./results/',import.meta.url),{recursive:true});await writeFile(new URL('./results/model-audit.json',import.meta.url),JSON.stringify({roles:results,pourFrames,maxPourXZ,uniqueFaces:7,uniqueClothes:7},null,2));console.log(JSON.stringify({ok:true,roles:results,pourFrames,maxPourXZ},null,2));
