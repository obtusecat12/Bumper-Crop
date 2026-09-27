import * as T from './vendor/three.module.min.js';
import {makeAlmondBottle,releaseAlmondBottle,almondName,heroRotation,bindAlmondGlass,GLASS_LAYER} from './almond-water-assets.js?v=56';
import {almondProfile,profileRadius,liquidVolume} from './almond-water-profiles.js?v=56';
import {almondFillTables as fillTables} from './almond-water-fill-tables.js?v=56';
export {liquidVolume};
const clamp=T.MathUtils.clamp;
export const liquidRadius=profileRadius;
// The circular-segment area below y + sx*x + sz*z = h. A tiny immutable
// one-dimensional lookup conserves volume as water moves into the shoulder.
// Immutable build-time tables; runtime only performs one scalar lookup.
export function conservedFill(slope,kind='glass'){const table=fillTables[kind]||fillTables.glass,x=clamp(slope,0,1)*64,i=Math.floor(x);return T.MathUtils.lerp(table[i],table[Math.min(64,i+1)],x-i);}
export class AlmondSlosh {
 constructor(kind='glass'){this.kind=kind;this.x=0;this.z=0;this.vx=0;this.vz=0;this.time=0;this.motion=0;this.fill=almondProfile(kind).fill;}
 impulse(x,z){this.vx=clamp(this.vx+x,-4,4);this.vz=clamp(this.vz+z,-4,4);}
 update(dt,targetX,targetZ){dt=clamp(dt,0,1/15);if(!dt)return this;const steps=Math.ceil(dt/(1/120)),h=dt/steps;
  for(let i=0;i<steps;i++){this.vx+=(clamp(targetX,-.70,.70)-this.x)*90*h-this.vx*5.1*h;this.vz+=(clamp(targetZ,-.70,.70)-this.z)*90*h-this.vz*5.1*h;this.x=clamp(this.x+this.vx*h,-.70,.70);this.z=clamp(this.z+this.vz*h,-.70,.70);}
  this.time+=dt;this.motion=clamp(Math.hypot(this.vx,this.vz)*.42,0,1);this.fill=conservedFill(Math.hypot(this.x,this.z),this.kind);return this;
 }
}
export function createAlmondInspection(){
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(50,4/3,.025,20),pose=new T.Group();scene.add(pose);scene.add(new T.HemisphereLight('#cdd7d8','#756340',1.65));const key=new T.DirectionalLight('#e4e7df',1.55);key.position.set(-.6,.85,.9);scene.add(key);const fill=new T.DirectionalLight('#98a7b0',.40);fill.position.set(.8,.1,-.3);scene.add(fill);
 const start=new T.Vector3(),destination=new T.Vector3(0,0,-.58),ndc=new T.Vector3(),inverse=new T.Quaternion(),up=new T.Vector3(),slosh=new AlmondSlosh();
 let item=null,variant=null,phase='idle',age=0,clock=0,yaw=0,pitch=-.055,targetYaw=0,targetPitch=-.055,oldX=0,oldY=0,oldZ=0,oldVx=0,oldVz=0;
 const stats={activeUpdates:0,inactiveUpdates:0,opaqueDraws:0,glassDraws:0,worldGeometryReplays:0};
 function clear(){releaseAlmondBottle(item,{hero:true});item=null;variant=null;phase='idle';pose.clear();}
 function begin(v,worldPosition,worldCamera){clear();variant={...v};item=makeAlmondBottle(v,{hero:true});item.position.y=-item.userData.almondHeight*.5;pose.add(item);camera.aspect=worldCamera.aspect;camera.updateProjectionMatrix();worldCamera.updateMatrixWorld();
  destination.z=-.58;
  if(worldPosition){ndc.copy(worldPosition);ndc.y+=item.userData.almondHeight*.5;ndc.project(worldCamera);start.copy(worldPosition).applyMatrix4(worldCamera.matrixWorldInverse);start.z=clamp(start.z,-3,-.35);start.x=ndc.x*(-start.z)/camera.projectionMatrix.elements[0];start.y=ndc.y*(-start.z)/camera.projectionMatrix.elements[5];}
  else start.set(.22,-.32,-.85);
  pose.position.copy(start);yaw=targetYaw=0;pitch=targetPitch=-.055;age=clock=0;phase='arriving';oldX=start.x;oldY=start.y;oldZ=start.z;oldVx=oldVz=0;Object.assign(slosh,{kind:v.kind,x:0,z:0,vx:.9,vz:-.5,time:0,motion:0,fill:almondProfile(v.kind).fill});pose.rotation.set(pitch,yaw,-.035);
 }
 function rotate(dx,dy){if(phase==='idle'||phase==='stowing')return;targetYaw+=dx*.0065;targetPitch=clamp(targetPitch+dy*.0045,-.52,.52);slosh.impulse(clamp(dx*.013,-.25,.25),clamp(dy*.012,-.25,.25));}
 function stow(){if(phase==='idle'||phase==='stowing')return;phase='stowing';age=0;start.copy(pose.position);}
 function update(dt,worldCamera,active){if(!item||!active||dt<=0)return;stats.activeUpdates++;dt=Math.min(dt,1/15);age+=dt;clock+=dt;
  if(camera.aspect!==worldCamera.aspect){camera.aspect=worldCamera.aspect;camera.updateProjectionMatrix();}
  heroRotation.value.setFromMatrix4(worldCamera.matrixWorld);
  if(phase==='arriving'){const t=clamp(age/.60,0,1),e=t*t*(3-2*t);pose.position.lerpVectors(start,destination,e);if(t===1){phase='holding';age=0;}}
  else if(phase==='stowing'){const t=clamp(age/.28,0,1);pose.position.copy(start);pose.position.y-=.56*t*t;pose.position.z+=.16*t*t;if(t===1){clear();return;}}
  else pose.position.set(0,Math.sin(clock*1.7)*.0014,T.MathUtils.lerp(pose.position.z,destination.z,1-Math.exp(-dt*14)));
  const follow=1-Math.exp(-dt*14);yaw+=(targetYaw-yaw)*follow;pitch+=(targetPitch-pitch)*follow;pose.rotation.set(pitch,yaw,-.035+Math.sin(clock*.9)*.007);
  // Acceleration and gravity are evaluated for ONE held item. Static pickups
  // never upload instance matrices, simulate liquid or allocate frame arrays.
  const vx=(pose.position.x-oldX)/dt,vz=(pose.position.z-oldZ)/dt;inverse.copy(pose.quaternion).invert();up.set(0,1,0).applyQuaternion(inverse);slosh.impulse(clamp((vx-oldVx)*-.018,-.10,.10),clamp((vz-oldVz)*-.014,-.10,.10));slosh.update(dt,up.x/Math.max(.4,up.y),up.z/Math.max(.4,up.y));oldX=pose.position.x;oldY=pose.position.y;oldZ=pose.position.z;oldVx=vx;oldVz=vz;
  const glass=item.userData.glass;if(glass){const u=glass.material.uniforms;u.liquidTilt.value.set(slosh.x,slosh.z);u.fillHeight.value=slosh.fill;u.liquidTime.value=slosh.time;u.liquidMotion.value=slosh.motion;
   if(variant.kind==='ramune'){const x=clamp(-slosh.x*.006,-.004,.004),z=clamp(-slosh.z*.006,-.004,.004);u.marbleCenter.value.set(x,.161+Math.hypot(x,z)*.35,z);}
  }
 }
 function opaque(renderer,target){if(!item)return;camera.layers.set(0);renderer.setRenderTarget(target);renderer.clearDepth();renderer.render(scene,camera);stats.opaqueDraws++;}
 function glass(renderer,target,source,w,h){if(!item?.userData.glass)return;const u=item.userData.glass.material.uniforms;u.sceneColor.value=source;u.resolution.value.set(w,h);u.projectionScale.value.set(camera.projectionMatrix.elements[0]*.5,camera.projectionMatrix.elements[5]*.5);camera.layers.set(GLASS_LAYER);renderer.setRenderTarget(target);renderer.render(scene,camera);stats.glassDraws++;}
 async function warmup(renderer){const temporary=[];try{for(const kind of ['thermos','glass']){const g=makeAlmondBottle({kind,finish:0,label:0,closure:0,paint:0,seed:0},{hero:true});g.position.z=-1;temporary.push(g);scene.add(g);}camera.layers.enable(GLASS_LAYER);await renderer.compileAsync(scene,camera);}finally{camera.layers.set(0);for(const g of temporary)releaseAlmondBottle(g,{hero:true});}}
 return {scene,camera,pose,slosh,stats,begin,rotate,stow,update,opaque,glass,clear,warmup,zoom(delta){destination.z=clamp(destination.z*Math.exp(clamp(delta,-200,200)*.001),-.82,-.39);},dispose:clear,get active(){return !!item;},get hasGlass(){return !!item?.userData.glass;},get phase(){return phase;},get variant(){return variant;},get name(){return variant?almondName(variant):'';}};
}
export function createAlmondWorldVisibility(){const meshes=new Set(),frustum=new T.Frustum(),matrix=new T.Matrix4(),sphere=new T.Sphere();
 return {attach(chunk){for(const p of chunk.pickups){const m=p.mesh?.userData.glass;if(m)meshes.add(m);}},detach(chunk){for(const p of chunk.pickups){const m=p.mesh?.userData.glass;if(m)meshes.delete(m);}},remove(group){if(group?.userData.glass)meshes.delete(group.userData.glass);},any(camera){frustum.setFromProjectionMatrix(matrix.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));for(const m of meshes){if(!m.parent||!m.visible)continue;sphere.copy(m.boundingSphere||m.geometry.boundingSphere).applyMatrix4(m.matrixWorld);if(frustum.intersectsSphere(sphere))return true;}return false;},bind:bindAlmondGlass,clear(){meshes.clear();}};
}
