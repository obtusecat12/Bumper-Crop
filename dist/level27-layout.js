// All dimensions are metres. The cave footprint, render mesh and walking
// surface share this authority; the access tunnel is outside the 18.58 m² room.
export const CAVE_AREA=18.58, WATER_Y=0, TUNNEL_Y=1.46;
export const STAIRS={x:1.23,width:.90,start:-1.82,tread:.24,count:13,rise:.15,base:-.49};
const raw=Array.from({length:96},(_,i)=>{const a=i/96*Math.PI*2,r=1+.043*Math.sin(a*3+.7)+.028*Math.cos(a*7);return[Math.cos(a)*2.43*r,Math.sin(a)*2.5*r];});
export function polygonArea(p){return Math.abs(p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a[0]*b[1]-b[0]*a[1];},0))/2;}
const scale=Math.sqrt(CAVE_AREA/polygonArea(raw));
export const CAVE_PLAN=raw.map(([x,z])=>[x*scale,z*scale]);
export const ARRIVAL={x:1.23,z:-5.2,yaw:Math.PI,pitch:-.13};
export const CALCITE_OUTCROPS=[[-1.16,-1.86,-.52,1.68,.36],[-.75,-2.08,-.48,2.53,.38],[-.30,-2.04,-.55,1.67,.39],[.06,-2.05,-.39,1.92,.30]];
export function radialLimit(x,z){const a=(Math.atan2(z,x)+Math.PI*2)%(Math.PI*2),i=a/(Math.PI*2)*CAVE_PLAN.length,k=Math.floor(i),t=i-k,p=CAVE_PLAN[k],q=CAVE_PLAN[(k+1)%CAVE_PLAN.length];return Math.hypot(p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t);}
export function inTunnel(x,z,margin=0){return x>.43+margin&&x<2.02-margin&&z>=-8.6+margin&&z<-1.60;}
export function stairHeight(z){const step=Math.max(0,Math.min(STAIRS.count-1,Math.floor((z-STAIRS.start)/STAIRS.tread)));return STAIRS.base+(STAIRS.count-step)*STAIRS.rise;}
export function poolFloor(x,z){const f=Math.hypot(x,z)/radialLimit(x,z);return -.81+.075*Math.sin(x*2)*Math.sin(z*2)+Math.max(0,(f-.56)/.44)*.85;}
export function springFloor(x,z){if(inTunnel(x,z)&&z<STAIRS.start)return TUNNEL_Y;if(Math.abs(x-STAIRS.x)<STAIRS.width/2+.05&&z>=STAIRS.start&&z<STAIRS.start+STAIRS.count*STAIRS.tread)return stairHeight(z);return poolFloor(x,z);}
export function springAllowed(x,z){
 if(inTunnel(x,z,.22)&&x>1.02&&x<1.64)return true;
 if(Math.abs(x-STAIRS.x)<.24&&z>=STAIRS.start&&z<STAIRS.start+STAIRS.count*STAIRS.tread)return true;
 const a=(Math.atan2(z,x)+Math.PI*2)%(Math.PI*2),floor=poolFloor(x,z),r=Math.hypot(x,z);
 for(const h of[.20,1.0,1.75]){const p=wallPoint(a,floor+h);if(r>Math.hypot(p[0],p[2])-.23)return false;}
 for(const [cx,cz,,h,rad]of CALCITE_OUTCROPS)if(Math.hypot(x-cx,z-cz)<rad+.19)return false;
 return true;
}
export function resolveSpring(previous,next){const valid=p=>springAllowed(p.x,p.z)&&Math.abs(springFloor(p.x,p.z)-springFloor(previous.x,previous.z))<.245;if(valid(next))return next;const a={x:next.x,z:previous.z},b={x:previous.x,z:next.z};return valid(a)?a:valid(b)?b:{x:previous.x,z:previous.z};}
export function springCanExit(x,z){return inTunnel(x,z)&&z< -7.55;}
export function inPool(x,z){return !inTunnel(x,z)&&springFloor(x,z)<-.30;}
export class SpringSession{
 constructor(){this.preset=0;this.closing=0;this.origin=null;this.bathSeconds=0;this.sitting=false;}
 heat(){this.preset=Math.min(2,this.preset+1);return this.preset;}
 beginClose(underShower){if(!underShower||this.preset!==2)return false;this.closing=.001;return true;}
 tickClose(dt,underShower){if(!this.closing)return false;if(!underShower){this.closing=0;return false;}this.closing+=dt;return this.closing>=2.15;}
 enter(pose){this.origin={level:pose.level,cx:pose.cx,cz:pose.cz,x:pose.x,z:pose.z,yaw:pose.yaw,pitch:pose.pitch};this.closing=0;this.bathSeconds=0;this.sitting=false;return {...ARRIVAL};}
 leave(){const p=this.origin;this.origin=null;this.sitting=false;return p;}
}

export function wallPoint(angle,y){const N=CAVE_PLAN.length,k=((angle/(Math.PI*2)*N)%N+N)%N,i=Math.floor(k),u=k-i,p=CAVE_PLAN[i],q=CAVE_PLAN[(i+1)%N];let x=p[0]+(q[0]-p[0])*u,z=p[1]+(q[1]-p[1])*u;
  const pale=angle>4.10&&angle<5.23;
  const shelf=.105*Math.pow(.5+.5*Math.sin(y*8.2+angle*.8+.35*Math.sin(angle*7)),4)+.025*Math.sin(y*26+angle*1.2);
  const fold=.025*Math.cos(angle*36+.4*Math.sin(y*2.3))+.018*Math.sin(y*7+angle*7);
  const mass=.095*Math.sin(y*1.9+angle*4.3)+.07*Math.sin(y*4.1-angle*3);
  // Deposits grow from the wall as broad overlapping calcite lobes. Each lobe
  // has its own height, breadth and trailing apron; none is a free-standing tube.
  let deposit=0;
  for(const [a,h,w,t,r] of [[4.16,.20,.19,.58,.34],[4.30,1.34,.14,.59,.45],[4.47,.91,.17,.50,.38],[4.58,1.92,.12,.59,.44],[4.76,1.51,.16,.45,.34],[4.96,.63,.20,.53,.28],[4.88,2.52,.16,.44,.23]]){
   const ga=Math.exp(-Math.pow((angle-a)/w,2));deposit+=ga*r*(Math.exp(-Math.pow((y-h)/t,2))+.20*Math.exp(-Math.pow((y-h+.65)/1.05,2)));
  }
  const ledge=.33*Math.exp(-Math.pow((angle-3.01)/.46,2))*Math.exp(-Math.pow((y-.34)/.74,2));
  const inset=.13+mass+(pale?fold:shelf)+deposit+ledge+Math.max(0,y-2.4)*.10,rad=Math.hypot(x,z);x*=1-inset/rad;z*=1-inset/rad;return[x,y,z];
 }
