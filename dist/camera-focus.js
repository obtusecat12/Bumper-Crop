import * as T from './vendor/three.module.min.js';
import {DampedSpring} from './handheld-camera.js?v=28';
import {surfaceHeight,pondShoreDistance} from './world.js?v=28';
// Reused center ray, vectors, interval slab and critically bounded cadence.
// Uses existing collision proxies plus authoritative terrain, not allocation-
// heavy Mesh.raycast() intersection arrays across the entire wheat field.
export function createCameraFocus(){
 const spring=new DampedSpring(18),ray=new T.Ray(),point=new T.Vector3(),local=new T.Ray(),box=new T.Box3(),chunks=[];
 let delay=0,target=18,baseFov=72;const result={distance:18,target:18,breathing:0};
 function attach(c){if(!chunks.includes(c))chunks.push(c);}
 function detach(c){const i=chunks.indexOf(c);if(i>=0){for(let j=i;j<chunks.length-1;j++)chunks[j]=chunks[j+1];chunks.pop();}}
 function trace(camera){ray.origin.copy(camera.position);camera.getWorldDirection(ray.direction);let best=120;
  for(let j=0;j<chunks.length;j++){const c=chunks[j],ox=c.group.position.x,oz=c.group.position.z,f=c.field;
   if(Math.hypot(ox+32-camera.position.x,oz+32-camera.position.z)>180)continue;
   const colliders=c.colliders||[];
   for(let i=0;i<colliders.length;i++){const b=colliders[i],co=Math.cos(b.angle||0),si=Math.sin(b.angle||0),px=camera.position.x-ox-(b.x||0),pz=camera.position.z-oz-(b.z||0);
    local.origin.set(px*co-pz*si,camera.position.y,px*si+pz*co);local.direction.set(ray.direction.x*co-ray.direction.z*si,ray.direction.y,ray.direction.x*si+ray.direction.z*co);
    const y=surfaceHeight(b.x||0,b.z||0,f),hx=b.hx??b.r??Math.abs((b.x2??1)-(b.x1??0))*.5,hz=b.hz??b.r??Math.abs((b.z2??1)-(b.z1??0))*.5;
    if(b.kind==='box'){local.origin.x=camera.position.x-ox;local.origin.z=camera.position.z-oz;local.direction.copy(ray.direction);box.min.set(b.x1,y,b.z1);box.max.set(b.x2,y+(f.type==='building'?5:2.8),b.z2);}
    else {box.min.set(-hx,y,-hz);box.max.set(hx,y+(f.type==='building'?5:b.kind==='circle'?5:2.8),hz);}
    if(local.intersectBox(box,point)){const d=point.distanceTo(local.origin);if(d>.24&&d<best)best=d;}
   }
  }
  for(let t=.3;t<best;t+=Math.max(.22,t*.055)){ray.at(t,point);for(let j=0;j<chunks.length;j++){const c=chunks[j],x=point.x-c.group.position.x,z=point.z-c.group.position.z;if(x<0||x>=64||z<0||z>=64)continue;
    const f=c.field;let y=surfaceHeight(x,z,f);if(f.type==='pond'&&pondShoreDistance(x,z,f)<0&&camera.position.y>f.lakeY)y=f.lakeY;
    if(point.y<=y){best=t;break;}break;}}
  return Math.max(.25,best);
 }
 function update(dt,camera,active=true,locked=false){if(!active||locked)return result;delay-=dt;if(delay<=0){target=trace(camera);delay=1/12;}
  const d=spring.advance(Math.min(.1,dt),target,8.79645943,.55);spring.position=Math.max(.25,Math.min(180,d));
  result.distance=spring.position;result.target=target;result.breathing=T.MathUtils.clamp((target-d)*.012,-.35,.35);
  const fov=baseFov+result.breathing;if(Math.abs(camera.fov-fov)>.0001){camera.fov=fov;camera.updateProjectionMatrix();}return result;
 }
 return {attach,detach,update,trace,result,spring,setBaseFov(v){baseFov=v;},reset(camera){target=18;spring.reset(18);delay=0;result.distance=18;result.breathing=0;if(camera){camera.fov=baseFov;camera.updateProjectionMatrix();}}};
}
