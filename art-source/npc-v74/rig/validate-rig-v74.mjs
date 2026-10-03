import fs from 'node:fs/promises';
import * as THREE from '../../level10/dist/vendor/three.module.min.js';
import {createRetroActor74,RETRO_ROLES74} from './retro-cast-v74.js';

function texture(){const data=new Uint8Array(128*128*4);data.fill(255);return new THREE.DataTexture(data,128,128);}
const shared={face:texture(),faceBlink:texture(),body:texture(),newspaper:texture()};
const report={threeRevision:THREE.REVISION,kind:'Node geometry and true skeleton evaluation; not a browser or FPS measurement',actors:[],frames:{}};
const eps=1e-6;
for(const role of RETRO_ROLES74){
  const actor=createRetroActor74(THREE,role,shared,{phase:0,seatHeight:role==='plaid'?.42347:.557});
  const g=actor.mesh.geometry;let worstWeightError=0;const weights=g.getAttribute('skinWeight'),ind=g.getAttribute('skinIndex');
  for(let i=0;i<weights.count;i++){
    let s=0;for(let j=0;j<4;j++){s+=weights.array[i*4+j];if(ind.array[i*4+j]>=19)throw Error('Out of range bone');}
    worstWeightError=Math.max(worstWeightError,Math.abs(s-1));
  }
  if(worstWeightError>eps)throw Error(role+' invalid weights');
  if(!actor.mesh.isSkinnedMesh||actor.mesh.skeleton.bones.length!==19)throw Error(role+' invalid rig');
  if(actor.diagnostics.triangles<500||actor.diagnostics.triangles>1500)throw Error(role+' total triangle budget');
  if(actor.diagnostics.drawCalls>6)throw Error(role+' draw budget');
  if(actor.clip.tracks.some(t=>t.getInterpolation()!==THREE.InterpolateDiscrete))throw Error(role+' non-discrete track');
  if(actor.materials.some(m=>!m.isMeshLambertMaterial||!m.flatShading))throw Error(role+' wrong material');
  const frames=[0,.2,1,3,6,6+1/15,6.7,7.6].map(t=>actor.samplePose(t));report.frames[role]=frames;
  // Five roles blink independently, without uploading their shared textures again.
  const versions=Array.from(new Set(Object.values(shared))).map(t=>t.version), seen=new Set();
  for(let n=0;n<900;n++){actor.update(n/30,1/30);seen.add(actor.diagnostics.eyeClosed);}
  if(role==='homeless'?(seen.size!==1||!seen.has(true)):seen.size!==2)throw Error(role+' blink state missing');
  if(Array.from(new Set(Object.values(shared))).some((t,i)=>t.version!==versions[i]))throw Error('Texture reupload in update');
  const before=actor.diagnostics.updates;actor.update(40,10);if(actor.diagnostics.updates!==before+1)throw Error('Large dt caught up multiple times');
  const pose=actor.samplePose(0),row={...actor.diagnostics,worstWeightError,skinVertices:g.getAttribute('position').count,feet:{left:pose.bones.footL.position,right:pose.bones.footR.position},hands:{left:pose.bones.handL.position,right:pose.bones.handR.position},poseZeroBounds:pose.bounds,blinkStates:[...seen]};
  report.actors.push(row);actor.dispose();actor.dispose();
}
for(const t of Object.values(shared))t.dispose();
await fs.writeFile(new URL('./rig-validation-v74.json',import.meta.url),JSON.stringify(report,null,2));
await fs.writeFile(new URL('./pose-frames-v74.json',import.meta.url),JSON.stringify(report.frames,null,2));
console.log(JSON.stringify(report.actors.map(a=>({role:a.role,triangles:a.triangles,draws:a.drawCalls,bones:a.bones,feet:a.feet,hands:a.hands,bounds:a.poseZeroBounds,blinkStates:a.blinkStates})),null,2));
