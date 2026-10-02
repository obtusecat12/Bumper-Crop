// Metres. CAVE_PLAN is the WATER surface survey, exactly 18.58 m².
// The carved east bank and access tunnel are additional land outside this polygon.
import {SPRING_OCCUPANTS} from './level27-occupants-v67.js';
export const CAVE_AREA=18.58, WATER_Y=0, TUNNEL_Y=1.88;
export const STAIRS={x:3.65,width:1.16,start:-3.10,tread:.30,count:10,rise:.16,base:.28};
export const DRY_BANK_Y=.28;
export const DRAIN={x:-1.18,z:2.12,width:.23,height:.18};
export const WASH_BASIN={x:5.02,z:.76,radius:.65};
export const STREAM_X=2.10;
export const ANNEX={x:4.18,z:.18,rx:2.15,rz:2.62};
const raw=Array.from({length:96},(_,i)=>{const a=i/96*Math.PI*2,r=1+.043*Math.sin(a*3+.7)+.028*Math.cos(a*7);return[Math.cos(a)*2.43*r,Math.sin(a)*2.5*r];});
export function polygonArea(p){return Math.abs(p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a[0]*b[1]-b[0]*a[1];},0))/2;}
const scale=Math.sqrt(CAVE_AREA/polygonArea(raw));
export const CAVE_PLAN=raw.map(([x,z])=>[x*scale,z*scale]);
export const ARRIVAL={x:3.65,z:-7.4,yaw:Math.PI,pitch:-.10};
export const CALCITE_OUTCROPS=[];
export function radialLimit(x,z){const a=(Math.atan2(z,x)+Math.PI*2)%(Math.PI*2),k=a/(Math.PI*2)*CAVE_PLAN.length,i=Math.floor(k),p=CAVE_PLAN[i],q=CAVE_PLAN[(i+1)%CAVE_PLAN.length],dx=Math.cos(a),dz=Math.sin(a),ex=q[0]-p[0],ez=q[1]-p[1];return(p[0]*ez-p[1]*ex)/(dx*ez-dz*ex);}
export function inTunnel(x,z,margin=0){return x>1.08+margin&&x<4.96-margin&&z>=-10.4+margin&&z<STAIRS.start;}
export function inAnnex(x,z,margin=0){return Math.hypot((x-ANNEX.x)/(ANNEX.rx-margin),(z-ANNEX.z)/(ANNEX.rz-margin))<1;}
export function stairCenter(z){const t=Math.max(0,Math.min(1,(z-STAIRS.start)/(STAIRS.count*STAIRS.tread)));return 3.65-.57*t+.11*Math.sin(t*Math.PI*1.4);}
// Each eroded edge has its own curved plan, shared by visible rock and walking.
// End landings stay fixed; interior edges wander by centimetres across a tread.
export function stairBoundary(k,x){const z=STAIRS.start+k*STAIRS.tread;if(k<=0||k>=STAIRS.count)return z;const d=x-stairCenter(z);return z+.065*(Math.sin(d*4.9+k*.83)-Math.sin(k*.83))+.023*(Math.cos(d*10.1+k*1.71)-Math.cos(k*1.71));}
export function stairLocal(x,z){let i=0;while(i<STAIRS.count-1&&z>=stairBoundary(i+1,x))i++;const a=stairBoundary(i,x),b=stairBoundary(i+1,x);return {i,v:Math.max(0,Math.min(1,(z-a)/(b-a)))};}
export function treadHeight(i){return STAIRS.base+(STAIRS.count-i)*STAIRS.rise+(i?.022*Math.sin(i*1.9):0);}
export function stairHeight(z,x=stairCenter(z)){return treadHeight(stairLocal(x,z).i);}
export function treadRelief(x,z,local=stairLocal(x,z)){const {i,v}=local,d=x-stairCenter(z),u=Math.abs(d)/(STAIRS.width*.5),nose=Math.max(0,(v-.68)/.32),heel=Math.max(0,(.15-v)/.15),flank=Math.max(0,(u-.68)/.32);return .020*Math.sin(d*8+i*.71)*Math.sin(Math.PI*v)+.008*Math.sin(d*21-i*1.7)*Math.sin(Math.PI*v)-.021*u*u-.036*nose*nose-.012*heel*heel-.036*flank*flank*(.6+.4*Math.sin(i*1.2+v*7));}
export function poolFloor(x,z){const r=Math.hypot(x,z),lim=radialLimit(x||.000001,z||.000001),f=r/lim;
 if(f<=1){const apron=Math.max(0,(f-.70)/.30);return -.88+.025*Math.sin(x*3.2)*Math.cos(z*2.7)+.835*Math.pow(apron,2.4);}
 // A narrow eroded shoreline rises OUTSIDE the surveyed water footprint.
 const t=Math.min(1,(r-lim)/.30),q=t*t*(3-2*t);let y=-.025+.305*q;
 if(t>=1)y+=.012*Math.sin(x*3.1+z)*Math.cos(z*2.4);
 const d=Math.max(0,Math.min(1,(z-1.45)/1.1)),cx=-.85-.48*d;
 if(z>1.45&&z<2.65&&Math.abs(x-cx)<.13)y=Math.min(y,-.105-d*.045);
 return y;}
export function springFloor(x,z){if(inTunnel(x,z)&&z<STAIRS.start)return TUNNEL_Y;if(Math.abs(x-stairCenter(z))<STAIRS.width/2+.025&&z>=STAIRS.start&&z<STAIRS.start+STAIRS.count*STAIRS.tread)return stairHeight(z,x)+treadRelief(x,z);return poolFloor(x,z);}
export function springAllowed(x,z){
 if(SPRING_OCCUPANTS.some(p=>Math.hypot(x-p.x,z-p.z)<p.radius+.18))return false;
 if(Math.hypot(x-WASH_BASIN.x,z-WASH_BASIN.z)<WASH_BASIN.radius+.19)return false;
 if(Math.abs(x-(WASH_BASIN.x-.90))<.64&&Math.abs(z-(WASH_BASIN.z+.65))<.45)return false;
 if(inTunnel(x,z,.25)&&x>2.98&&x<4.57)return true;
 if(Math.abs(x-stairCenter(z))<STAIRS.width/2-.20&&z>=STAIRS.start&&z<STAIRS.start+STAIRS.count*STAIRS.tread)return true;
 if(inAnnex(x,z,.24)&&z>-.15&&x>2.5)return true;
 if(x>1.5&&Math.abs(z)<.72&&x<3.5)return true;
 const a=(Math.atan2(z,x)+Math.PI*2)%(Math.PI*2),floor=poolFloor(x,z),r=Math.hypot(x,z);
 for(const h of[.20,1.0,1.75]){const p=wallPoint(a,floor+h);if(r>Math.hypot(p[0],p[2])-.21)return false;}return true;
}
export function resolveSpring(previous,next){const valid=p=>springAllowed(p.x,p.z)&&Math.abs(springFloor(p.x,p.z)-springFloor(previous.x,previous.z))<.245;if(valid(next))return next;const a={x:next.x,z:previous.z},b={x:previous.x,z:next.z};return valid(a)?a:valid(b)?b:{x:previous.x,z:previous.z};}
export function springCanExit(x,z){return inTunnel(x,z)&&z< -9.55;}
export function inPool(x,z){return Math.hypot(x,z)<radialLimit(x,z)&&springFloor(x,z)<-.30;}
export function streamPath(){return [[2.10,1.815,-10.35],[1.93,1.815,-8.8],[2.15,1.815,-7.2],[1.94,1.815,-5.55],[2.13,1.815,-4.0],[2.02,1.815,-3.25],[1.88,1.80,-2.75],[1.26,1.76,-2.36],[.59,1.69,-2.03],[.52,1.50,-1.93],[.53,1.12,-1.79],[.55,.60,-1.64],[.55,.012,-1.54]];}
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
export function roofHeight(a){return 3.40+.19*Math.sin(a*3+.7)+.15*Math.cos(a*5-.4);}
export function wallPoint(angle,y){
 const a=(angle%(Math.PI*2)+Math.PI*2)%(Math.PI*2),rr=radialLimit(Math.cos(a),Math.sin(a));let x=Math.cos(a)*rr,z=Math.sin(a)*rr;
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
 const spillLip=gaussian(a,3.57,.32)*(.26/(1+Math.exp((y-1.78)/.07))+.30/(1+Math.exp((y-1.18)/.06))+.29/(1+Math.exp((y-.55)/.08)));
 const upper=.28*gaussian(y,2.69,.39)*(1+.3*Math.sin(a*6));
 let inset=depth*(.04+strata*(1-pale*.72)+crags*(1-pale*.45)+deposit+scallops+left+foreground+spillLip+upper);
 if(Math.abs(y)<.14)inset=Math.min(inset,-.032);
 const rad=Math.hypot(x,z);return[x*(1-inset/rad),y,z*(1-inset/rad)];
}
// The stepped cascade follows the actual limestone face, with a small water
// film clearance. Its ledges belong to the unified geological shell.
export function cascadePath(){return[1.59,1.48,1.37,1.18,1.02,.89,.68,.51,.36,.10,.015].map((y,i)=>{const a=3.57+Math.sin(i*.9)*.018,p=wallPoint(a,y),r=Math.hypot(p[0],p[2]);return[p[0]*(1-.065/r),y,p[2]*(1-.065/r)];});}
export function roofPoint(a,r){const edge=wallPoint(a,roofHeight(a)),x=edge[0]*r,z=edge[2]*r;
 // A shallow asymmetric broken ceiling, with a low rock eyebrow over the pool.
 const y=roofHeight(a)*r+3.54*(1-r)+Math.sin(Math.PI*r)*(.13*Math.sin(x*2.6-z*1.8)-.22*gaussian(z,-.72,.46))+.025*Math.sin(x*17+z*11)*Math.sin(Math.PI*r);
 return[x,y,z];
}
