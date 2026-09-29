// All dimensions are metres. The cave footprint, render mesh and walking
// surface share this authority; the access tunnel is outside the 18.58 m² room.
export const CAVE_AREA=18.58, WATER_Y=0, TUNNEL_Y=1.46;
export const STAIRS={x:1.23,width:.90,start:-1.82,tread:.24,count:13,rise:.15,base:-.49};
const raw=Array.from({length:96},(_,i)=>{const a=i/96*Math.PI*2,r=1+.043*Math.sin(a*3+.7)+.028*Math.cos(a*7);return[Math.cos(a)*2.43*r,Math.sin(a)*2.5*r];});
export function polygonArea(p){return Math.abs(p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a[0]*b[1]-b[0]*a[1];},0))/2;}
const scale=Math.sqrt(CAVE_AREA/polygonArea(raw));
export const CAVE_PLAN=raw.map(([x,z])=>[x*scale,z*scale]);
export const ARRIVAL={x:1.23,z:-5.2,yaw:Math.PI,pitch:-.13};
export const CALCITE_OUTCROPS=[]; // V57 deposits are continuous with the shell, never intersecting lathe objects.
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

// Different scales of bedding, solution pockets and broad calcite aprons.
// The waterline is the survey polygon itself: its area is genuinely 18.58 m².
const gaussian=(v,c,w)=>Math.exp(-Math.pow((v-c)/w,2));
export function roofHeight(a){return 2.98+.19*Math.sin(a*3+.7)+.15*Math.cos(a*5-.4);}
export function wallPoint(angle,y){
 const a=(angle%(Math.PI*2)+Math.PI*2)%(Math.PI*2),N=CAVE_PLAN.length,k=a/(Math.PI*2)*N,i=Math.floor(k),u=k-i,p=CAVE_PLAN[i],q=CAVE_PLAN[(i+1)%N];let x=p[0]+(q[0]-p[0])*u,z=p[1]+(q[1]-p[1])*u;
 const pale=gaussian(a,4.39,.56),depth=1-Math.exp(-y*y/ .045);
 // Irregular ledges have tilted sedimentary bedding rather than ring-like ribs.
 const strataPhase=y*16.5+.82*Math.sin(a*3.7)+.35*Math.sin(a*9.1);
 const strata=.050*Math.tanh(3*Math.sin(strataPhase))+.023*Math.sin(y*39+a*6.2);
 const crags=.065*Math.sin(a*8+y*3.7)*Math.cos(a*13-y*6.2)+.018*Math.sin(a*63+y*27);
 let deposit=0;
 for(const [aa,yy,aw,yw,r]of [[4.08,.65,.21,.60,.38],[4.21,1.02,.22,.59,.62],[4.39,1.62,.27,.49,.53],[4.61,1.01,.23,.48,.49],[4.78,.57,.22,.40,.40],[4.31,2.15,.23,.44,.30]])deposit+=r*gaussian(a,aa,aw)*gaussian(y,yy,yw);
 // Rounded, scalloped shoulders fuse to the rear wall; no pointed tube tops.
 const scallops=pale*(.055*Math.sin(a*37+Math.sin(y*4.2))*Math.sin(y*9.5+a*3)+.025*Math.sin(a*77-y*17));
 const left=gaussian(a,2.93,.53)*(.40*gaussian(y,.44,.21)+.55*gaussian(y,1.45,.30)+.29*gaussian(y,2.42,.28));
 const foreground=gaussian(a,3.03,.27)*(.83*gaussian(y,.35,.30)+.25*gaussian(y,1.5,.38));
 const spillLip=.17*gaussian(a,3.87,.12)*gaussian(y,1.07,.14);
 const upper=.28*gaussian(y,2.69,.39)*(1+.3*Math.sin(a*6));
 const inset=depth*(.04+strata*(1-pale*.72)+crags*(1-pale*.45)+deposit+scallops+left+foreground+spillLip+upper);
 const rad=Math.hypot(x,z);return[x*(1-inset/rad),y,z*(1-inset/rad)];
}
export function roofPoint(a,r){const edge=wallPoint(a,roofHeight(a)),x=edge[0]*r,z=edge[2]*r;
 // A shallow asymmetric broken ceiling, with a low rock eyebrow over the pool.
 const y=roofHeight(a)*r+3.16*(1-r)+Math.sin(Math.PI*r)*(.13*Math.sin(x*2.6-z*1.8)-.22*gaussian(z,-.72,.46))+.025*Math.sin(x*17+z*11)*Math.sin(Math.PI*r);
 return[x,y,z];
}
