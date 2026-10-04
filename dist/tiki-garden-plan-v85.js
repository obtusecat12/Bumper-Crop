import {GARDEN_DECOR85} from './tiki-garden-dressing-v85.js';
// The garden is its own interior. Nothing in this survey changes Level 10,
// city parcels, the original Moai pond or the canoe buffet.
export const GARDEN81=Object.freeze({
 bounds:{minX:-8.4,maxX:8.4,minZ:-10,maxZ:8.2},ceiling:6.93,
 pool:{x:-2.0,z:-.65,rx:2.78,rz:4.92,water:-.17,bed:-1.22},
 fountain:{x:4.75,z:1.40,r:1.83,water:.06,bed:-.37},
 entry:{x:0,z:7.15,yaw:0,pitch:-.055},
 restaurantDoor:{x:1.48,z:-6.48,w:1.42,h:2.48},
 palms:[{x:1.38,z:-.78,r:.205},{x:-5.93,z:-1.13,r:.19},{x:-4.73,z:-7.72,r:.17},{x:5.90,z:-5.65,r:.19}],
 parasols:[{x:1.05,z:-3.24,r:1.34,h:2.48},{x:-3.36,z:-6.83,r:.98,h:2.39}],
 globes:[{x:-4.63,z:3.05,y:.47,r:.205,color:0xffdf8b},{x:-4.64,z:-4.02,y:.76,r:.21,color:0xffc286},{x:.56,z:-.15,y:.66,r:.22,color:0xf3a9b6},{x:.58,z:2.5,y:.40,r:.17,color:0xc7eda7},{x:-1.64,z:-5.58,y:.65,r:.16,color:0xffce8f}],
 shots:{arrival:{p:[.25,1.77,7.10],look:[-1.6,.75,-1.7]},pool:{p:[-1.05,1.52,5.60],look:[-2.12,.66,-2.93]},fountain:{p:[2.12,1.70,5.21],look:[4.72,.80,1.03]},ceiling:{p:[6.71,1.73,-6.82],look:[-2.45,1.12,-.1]},return:{p:[1.91,1.73,4.90],look:[0,1.35,8.0]}}
});
export function poolEdge81(a,scale=1){const p=GARDEN81.pool;
 const n=1+.048*Math.sin(a*3+.7)+.044*Math.sin(a*5-1.1)+.020*Math.cos(a*9);
 return[p.x+Math.cos(a)*p.rx*n*scale,p.z+Math.sin(a)*p.rz*n*scale];
}
export const POOL_POLYGON81=Object.freeze(Array.from({length:96},(_,i)=>poolEdge81(i/96*Math.PI*2)));
export function inGardenPool81(x,z,pad=0){const p=GARDEN81.pool,a=Math.atan2((z-p.z)/p.rz,(x-p.x)/p.rx),q=poolEdge81(a);return Math.hypot((x-p.x)/(q[0]-p.x||1e-8)*Math.cos(a),(z-p.z)/(q[1]-p.z||1e-8)*Math.sin(a))<1+pad/3.1;}
// Exact polygon distance owns walkable rock clearances, not an unrelated box.
export function poolDistance81(x,z){let inside=false,d=Infinity;const q=POOL_POLYGON81;
 for(let i=0,j=q.length-1;i<q.length;j=i++){
  const a=q[j],b=q[i],vx=b[0]-a[0],vz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*vx+(z-a[1])*vz)/(vx*vx+vz*vz)));
  d=Math.min(d,Math.hypot(x-a[0]-vx*t,z-a[1]-vz*t));
  if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])inside=!inside;
 }return inside?-d:d;
}
export function gardenBlocked81(x,z,pad=.23){const b=GARDEN81.bounds,f=GARDEN81.fountain;
 if(x<b.minX+pad||x>b.maxX-pad||z<b.minZ+pad||z>b.maxZ-pad)return true;
 const d=GARDEN_DECOR85;if(Math.hypot(x-d.table.x,z-d.table.z)<.83+pad||Math.hypot(x-d.botanist.x,z-d.botanist.z)<.27+pad||Math.hypot(x-d.footbath.x,z-d.footbath.z)<.38+pad)return true;
 if(Math.abs(x-d.machine.x)<.89+pad&&Math.abs(z-d.machine.z)<.84+pad)return true;
 if(Math.abs(x)>7.10-pad&&z> -7.42&&z<3.78)return true;
 if(z>6.73&&Math.abs(x)> .88&&Math.abs(x)<1.70+pad)return true;
 if(poolDistance81(x,z)<.42+pad||Math.hypot(x-f.x,z-f.z)<f.r+.28+pad)return true;
 if(GARDEN81.palms.some(p=>Math.hypot(x-p.x,z-p.z)<p.r+.12+pad))return true;
 return GARDEN81.parasols.some(p=>Math.hypot(x-p.x,z-p.z)<p.r*.92+pad);
}
export function resolveGarden81(old,next){let{x,z}=next;if(gardenBlocked81(x,z)){if(!gardenBlocked81(old.x,z))x=old.x;else if(!gardenBlocked81(x,old.z))z=old.z;else{x=old.x;z=old.z;}}return{x,z};}
export function nearGardenDoor81(x,z){const d=GARDEN81.restaurantDoor;return Math.abs(x-d.x)<.88&&z<d.z+1.10;}
export function atGardenReturn81(x,z){return Math.abs(x)<1.05&&z>6.88;}
