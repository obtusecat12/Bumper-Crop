import * as T from './vendor/three.module.min.js';
import {DampedSpring} from './handheld-camera.js?v=60';
import {focalLengthForFov,hyperfocal} from './lens-optics.js?v=60';
import {surfaceHeight,pondShoreDistance,wheatAllowed,cropSample} from './world.js?v=60';
// Reused center ray, vectors, interval slab and critically bounded cadence.
// Uses existing collision proxies plus authoritative terrain, not allocation-
// heavy Mesh.raycast() intersection arrays across the entire wheat field.
export function createCameraFocus(){
 const groundCache=new WeakMap();const spring=new DampedSpring(2.58),ray=new T.Ray(),point=new T.Vector3(),local=new T.Ray(),box=new T.Box3(),chunks=[];
 let delay=0,target=2.58,baseFov=72,zoomGoal=1,zoom=1,closeAge=0,mist=0,sceneQuery=null;const crop={};
 const result={distance:2.58,target:2.58,breathing:0,zoom:1,focalLength:focalLengthForFov(72),mode:'wide',traces:0};
 function attach(c){if(!chunks.includes(c)){chunks.push(c);groundCache.set(c,(c.colliders||[]).map(b=>surfaceHeight(b.x||0,b.z||0,c.field)));}}
 function detach(c){const i=chunks.indexOf(c);if(i>=0){for(let j=i;j<chunks.length-1;j++)chunks[j]=chunks[j+1];chunks.pop();}}
 function trace(camera,maxDistance=120){result.traces++;if(sceneQuery)return Math.max(.25,sceneQuery(camera,maxDistance));ray.origin.copy(camera.position);camera.getWorldDirection(ray.direction);let best=maxDistance;
  for(let j=0;j<chunks.length;j++){const c=chunks[j],ox=c.group.position.x,oz=c.group.position.z,f=c.field;
   if(Math.hypot(ox+32-camera.position.x,oz+32-camera.position.z)>maxDistance+46)continue;
   const colliders=c.colliders||[];
   for(let i=0;i<colliders.length;i++){const b=colliders[i],co=Math.cos(b.angle||0),si=Math.sin(b.angle||0),px=camera.position.x-ox-(b.x||0),pz=camera.position.z-oz-(b.z||0);
    local.origin.set(px*co-pz*si,camera.position.y,px*si+pz*co);local.direction.set(ray.direction.x*co-ray.direction.z*si,ray.direction.y,ray.direction.x*si+ray.direction.z*co);
    const y=groundCache.get(c)[i],hx=b.hx??b.r??Math.abs((b.x2??1)-(b.x1??0))*.5,hz=b.hz??b.r??Math.abs((b.z2??1)-(b.z1??0))*.5;
    if(b.kind==='box'){local.origin.x=camera.position.x-ox;local.origin.z=camera.position.z-oz;local.direction.copy(ray.direction);box.min.set(b.x1,y,b.z1);box.max.set(b.x2,y+(f.type==='building'?5:2.8),b.z2);}
    else {box.min.set(-hx,y,-hz);box.max.set(hx,y+(f.type==='building'?5:b.kind==='circle'?5:2.8),hz);}
    if(local.intersectBox(box,point)){const d=point.distanceTo(local.origin);if(d>.24&&d<best)best=d;}
   }
  }
  for(let t=.3;t<best;t+=Math.max(.22,t*.055)){ray.at(t,point);for(let j=0;j<chunks.length;j++){const c=chunks[j],x=point.x-c.group.position.x,z=point.z-c.group.position.z;if(x<0||x>=64||z<0||z>=64)continue;
    const f=c.field;let y=surfaceHeight(x,z,f);if(f.type==='pond'&&pondShoreDistance(x,z,f)<0&&camera.position.y>f.lakeY)y=f.lakeY;
    if(point.y<=y){best=t;break;}
    // Six-Hz crop-envelope query, never iterate individual stalks.
    if(t<Math.min(35,maxDistance)&&ray.direction.y<-.03&&point.y<y+1.32&&wheatAllowed(x,z,f)&&cropSample(x,z,f,crop).crop!==2){best=t;break;}break;}}
  return Math.max(.25,best);
 }
 function update(dt,camera,active=true,locked=false,speed=0){
  if(locked||!active)return result;
  dt=Math.min(.1,dt);zoom+=(zoomGoal-zoom)*(1-Math.exp(-dt*5));if(Math.abs(zoom-zoomGoal)<.0001)zoom=zoomGoal;
  const zoomFov=2*Math.atan(Math.tan(baseFov*Math.PI/360)/zoom)*180/Math.PI;
  const f=focalLengthForFov(zoomFov),wide=zoom<1.12;
  delay-=dt;if(delay<=0){
   const hit=trace(camera,wide?.85:120/(1+5*mist));delay=wide?1/6:1/8;
   closeAge=hit<.78&&speed<.5?closeAge+delay:0;
   // Walking wide-angle stays at the hyperfocal range. Macro must be deliberate
   // and stable; a single stalk crossing the centre cannot pump the whole image.
   const macro=wide&&closeAge>.45;
   target=wide&&!macro?Math.max(2.58,hyperfocal(f)):Math.min(120,Math.max(.25,hit));
   result.mode=macro?'macro':wide?'wide':'tele';
  }
  const d=spring.advance(dt,target,7.2,1-.24*mist);spring.position=Math.max(.25,Math.min(180,d));
  result.distance=spring.position;result.target=target;result.zoom=zoom;result.focalLength=f;
  result.breathing=wide?0:T.MathUtils.clamp((target-d)*.0015,-.045,.045);
  const fov=zoomFov+result.breathing;if(Math.abs(camera.fov-fov)>.0001){camera.fov=fov;camera.updateProjectionMatrix();}return result;
 }
 return {attach,detach,update,trace,result,spring,setSceneQuery(query){sceneQuery=query;delay=0;},setMist(v){mist=T.MathUtils.clamp(v,0,1);},setZoom(v){zoomGoal=T.MathUtils.clamp(v,1,4.5);},setBaseFov(v){baseFov=v;},reset(camera){target=2.58;spring.reset(target);zoom=zoomGoal=1;closeAge=0;delay=0;Object.assign(result,{distance:target,target,zoom:1,mode:'wide',focalLength:focalLengthForFov(baseFov),breathing:0});if(camera){camera.fov=baseFov;camera.updateProjectionMatrix();}}};
}
