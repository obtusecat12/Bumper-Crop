import {createManilaRoom} from './manila-room.js';
import {MANILA,manilaRegionsNear,manilaAt} from './manila-plan.js';

// One preserved photograph room, one reusable streamed copy; the sparse field is unbounded.
export function createManilaField96(T,renderer,scene){
 const original=createManilaRoom(T,renderer,scene),copy=createManilaRoom(T,renderer,scene);
 copy.root.name='Manila · streamed sparse field';copy.root.visible=false;copy.lights.forEach(l=>l.visible=false);
 let active=null;const doorStates=new Map();
 function prepare(x,z){
  const r=manilaRegionsNear(x,z,85).find(r=>r.id!=='manila-fixed'&&Math.abs(x-r.x)<85&&Math.abs(z-r.z)<85);
  if(r?.id===active?.id)return;
  if(active)doorStates.set(active.id,copy.doors.map(d=>[d.current,d.target]));
  active=r||null;copy.root.visible=!!active;
  if(active){copy.relocate(r.x,r.z);const states=doorStates.get(r.id);copy.doors.forEach((d,i)=>{d.current=states?.[i][0]??d.angle;d.target=states?.[i][1]??d.angle;d.pivot.rotation.y=d.current;});}
 }
 function owner(x,z){const r=manilaAt(x,z,3);if(!r)return null;if(r.id==='manila-fixed')return original;prepare(x,z);return copy;}
 return {root:original.root,original,copy,ready:Promise.all([original.ready,copy.ready]),prepare,
  blocked(x,z,r){return owner(x,z)?.blocked(x,z,r)||false;},
  nearest(x,z,yaw){const room=owner(x,z),door=room?.nearest(x,z,yaw);if(door)door.room96=room;return door;},
  toggle(d){return d.room96.toggle(d);},
  invalidate(){original.invalidate();copy.invalidate();},
  update(dt,x,z){prepare(x,z);original.update(dt,x,z);copy.update(dt,active?x:1e8,active?z:1e8);},
  map(ctx,px,pz,cx,cy,scale){original.map(ctx,px,pz,cx,cy,scale);if(active)copy.map(ctx,px,pz,cx,cy,scale);
   for(const r of manilaRegionsNear(px,pz,1400)){if(r.id==='manila-fixed'||r.id===active?.id)continue;ctx.save();ctx.fillStyle='#967653';ctx.fillRect(cx+(r.x-4-px)*scale,cy+(r.z-4-pz)*scale,8*scale,8*scale);ctx.strokeStyle='#65594b';ctx.lineWidth=Math.max(1,scale);ctx.strokeRect(cx+(r.x-4.5-px)*scale,cy+(r.z-4.5-pz)*scale,9*scale,9*scale);ctx.restore();}}
 };
}
