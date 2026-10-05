import {STACK94} from './level0-stack-data94.js';
// Rigid transforms preserve the solved contacts. Collision/map bounds follow identical poses.
export function placeStack94(template,x,z,rotation=0,y=0){
 const c=Math.cos(rotation),s=Math.sin(rotation),sy=Math.sin(rotation/2),cy=Math.cos(rotation/2);
 return template.map(p=>{const[a,b,d,w]=p.quaternion,q=[cy*a+sy*d,cy*b+sy*w,cy*d-sy*a,cy*w-sy*b],pos=p.position,bounds=p.bounds;
  let xmin=Infinity,xmax=-Infinity,zmin=Infinity,zmax=-Infinity;for(const xx of[bounds[0],bounds[3]])for(const zz of[bounds[2],bounds[5]]){const u=c*xx+s*zz+x,v=-s*xx+c*zz+z;xmin=Math.min(xmin,u);xmax=Math.max(xmax,u);zmin=Math.min(zmin,v);zmax=Math.max(zmax,v);}
  const footprint={x:(xmin+xmax)/2,z:(zmin+zmax)/2,w:xmax-xmin,d:zmax-zmin};
  return{kind:p.kind,x:x+c*pos[0]+s*pos[2],y:y+pos[1],z:z-s*pos[0]+c*pos[2],quaternion:q,w:footprint.w,d:footprint.d,rotation,collider:bounds[1]+y<1.8&&bounds[4]+y>.2?footprint:null,mapFootprint:footprint,note:'offline compound-body equilibrium'};
 });
}
export const stackTemplate94=(seed,chairs=false)=>(chairs?STACK94.chairs:STACK94.mixed)[Math.abs(seed|0)%STACK94.mixed.length];
export const HERO94=placeStack94(STACK94.hero,162.4,3.25,0);
export const CHAIRS94=placeStack94(STACK94.chairs[3],150.8,3.25,0);
