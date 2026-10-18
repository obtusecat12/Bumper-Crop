// Metres. CAVE_PLAN is the WATER surface survey, exactly 18.58 m².
// The carved east bank and access tunnel are additional land outside this polygon.
import {SPRING_OCCUPANTS} from './level27-occupants-v68.js';
import {WALK133} from './level27-walk133.js?v=133';
import {TOWEL133} from './level27-light131.js?v=133';
// V133-L27-fix: walk mask baked from the shell's own rock field (every visible wall/overhang collides).
const W133=WALK133?(()=>{const b=typeof atob==='function'?Uint8Array.from(atob(WALK133.bits),c=>c.charCodeAt(0)):Uint8Array.from(Buffer.from(WALK133.bits,'base64'));return {...WALK133,b};})():null;
export function walkMask133(x,z){if(!W133)return true;const i=Math.round((x-W133.x0)/W133.h),k=Math.round((z-W133.z0)/W133.h);if(i<0||k<0||i>=W133.nx||k>=W133.nz)return false;const n=k*W133.nx+i;return (W133.b[n>>3]>>(n&7)&1)===1;}
export const CAVE_AREA=18.58, WATER_Y=0, TUNNEL_Y=1.88;
// V132-L27-redo: rock stair cut into the cliff. From the tunnel mouth it descends hugging the
// left (+x) cliff and curves RIGHT along a concave rock wall (arc about C=(cx,cz)); the inner side
// hangs over an excavated grotto, the outer side IS the cliff (shell). Angle t: 0 = tunnel mouth.
export const STAIRS={cx:2.13,cz:-3.10,R:2.25,width:1.00,sweep:1.333,count:10,rise:.16,base:.28,start:-3.10,x:4.38,tread:.30};
export const CLIFF_Z=-.35;
export function stairPolar(x,z){const dx=x-STAIRS.cx,dz=z-STAIRS.cz;return {r:Math.hypot(dx,dz),t:Math.atan2(dz,dx)};}
// cliff radius about C (the wall the stair is cut into)
export function stairWallR(t){const tt=Math.max(0,Math.min(STAIRS.sweep,t));return STAIRS.R+STAIRS.width/2+.06+.03*Math.sin(tt*7.3+.4)+.015*Math.sin(tt*17.1);}
// 2-D signed distance-ish: >0 inside the rock mass the stair is carved into (floor to roof).
const sst2=(a,b,v)=>{const q=Math.max(0,Math.min(1,(v-a)/(b-a)));return q*q*(3-2*q);};
export function stairRock(x,z){const {r,t}=stairPolar(x,z);const rr=z<STAIRS.cz?x-(STAIRS.cx+stairWallR(0)):r-stairWallR(t);
 const face=CLIFF_Z-.62*sst2(3.55,2.65,x)+.07*Math.sin(x*2.1+.3)+.035*Math.sin(x*5.3)-z,lim=(STAIRS.sweep+.06-t)*Math.max(r,1);return Math.min(rr,face,lim);}
export function cliffX(z){const dz=z-STAIRS.cz;if(dz<=0)return STAIRS.cx+stairWallR(0);const w=stairWallR(Math.asin(Math.min(1,dz/stairWallR(0))));return dz<w?STAIRS.cx+Math.sqrt(w*w-dz*dz):STAIRS.cx;}
// compat (map-ui / old geology import these): centre line x at z, tread edge z
export function stairCenter(z){const s=Math.max(-1,Math.min(1,(z-STAIRS.cz)/STAIRS.R));return STAIRS.cx+STAIRS.R*Math.cos(Math.asin(s));}
export function stairTB(k,r=STAIRS.R){const t=k*STAIRS.sweep/STAIRS.count;if(k<=0||k>=STAIRS.count)return t;const d=r-STAIRS.R;return t+(.016*(Math.sin(d*5.3+k*.83)-Math.sin(k*.83))+.007*(Math.cos(d*11.1+k*1.71)-Math.cos(k*1.71)))/STAIRS.R;}
export function stairBoundary(k,x){return STAIRS.cz+STAIRS.R*Math.sin(stairTB(k));}
export function onStairFootprint(x,z,pad=0){const {r,t}=stairPolar(x,z);return t>=-pad/STAIRS.R&&t<STAIRS.sweep+pad/STAIRS.R&&Math.abs(r-STAIRS.R)<STAIRS.width/2+pad;}
// under the cantilevered treads / inside the stair band: no platform walking there
export function underStair(x,z){const {r,t}=stairPolar(x,z);return z>STAIRS.cz-.05&&t<STAIRS.sweep&&r>STAIRS.R-STAIRS.width/2-.30&&r<stairWallR(t)+.05;}
// excavated grotto inside the arc + the open floor at the stair foot (shell carves the same region)
const CREEK_XZ=[[2.13,-4.0],[2.02,-3.25],[1.88,-2.75],[1.26,-2.36],[.59,-2.03],[.52,-1.93]];
export function creekDist(x,z){let d=1e9;for(let i=0;i<CREEK_XZ.length-1;i++){const [ax,az]=CREEK_XZ[i],[bx,bz]=CREEK_XZ[i+1],dx=bx-ax,dz=bz-az,u=Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz)));d=Math.min(d,Math.hypot(x-ax-dx*u,z-az-dz*u));}return d;}
export const STAIR_FOOT={x:2.45,z:-1.20,r:.80};
export function grottoAir(x,z){const {r,t}=stairPolar(x,z);const pit=Math.min(STAIRS.R-STAIRS.width/2-.02-r,(t-.06)*Math.max(r,.3));const foot=STAIR_FOOT.r-Math.hypot(x-STAIR_FOOT.x,z-STAIR_FOOT.z);return Math.min(Math.max(pit,foot),creekDist(x,z)-.62);}
export const DRY_BANK_Y=.28;
export const DRAIN={x:-1.18,z:2.12,width:.23,height:.18};
export const WASH_BASIN={x:5.70,z:1.05,radius:.65}; // V131: moved off the new stair foot (was 5.02,.76)
export const STREAM_X=2.10;
// V131: dry platform enlarged (old rx 2.15 rz 2.62 at 4.18,.18); its -z part is bounded by the stair cliff.
export const ANNEX={x:4.55,z:.50,rx:2.70,rz:2.85};
const raw=Array.from({length:96},(_,i)=>{const a=i/96*Math.PI*2,r=1+.043*Math.sin(a*3+.7)+.028*Math.cos(a*7);return[Math.cos(a)*2.43*r,Math.sin(a)*2.5*r];});
export function polygonArea(p){return Math.abs(p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a[0]*b[1]-b[0]*a[1];},0))/2;}
const scale=Math.sqrt(CAVE_AREA/polygonArea(raw));
export const CAVE_PLAN=raw.map(([x,z])=>[x*scale,z*scale]);
export const ARRIVAL={x:3.65,z:-7.4,yaw:Math.PI,pitch:-.10};
export const CALCITE_OUTCROPS=[];
export function radialLimit(x,z){const a=(Math.atan2(z,x)+Math.PI*2)%(Math.PI*2),k=a/(Math.PI*2)*CAVE_PLAN.length,i=Math.floor(k),p=CAVE_PLAN[i],q=CAVE_PLAN[(i+1)%CAVE_PLAN.length],dx=Math.cos(a),dz=Math.sin(a),ex=q[0]-p[0],ez=q[1]-p[1];return(p[0]*ez-p[1]*ex)/(dx*ez-dz*ex);}
export function inTunnel(x,z,margin=0){return x>1.08+margin&&x<4.96-margin&&z>=-10.4+margin&&z<STAIRS.start;}
export function inAnnex(x,z,margin=0){return Math.hypot((x-ANNEX.x)/(ANNEX.rx-margin),(z-ANNEX.z)/(ANNEX.rz-margin))<1&&stairRock(x,z)< -margin;}
export function stairLocal(x,z){const {r,t}=stairPolar(x,z);let i=0;while(i<STAIRS.count-1&&t>=stairTB(i+1,r))i++;const a=stairTB(i,r),b=stairTB(i+1,r);return {i,v:Math.max(0,Math.min(1,(t-a)/(b-a)))};}
export function treadHeight(i){return STAIRS.base+(STAIRS.count-i)*STAIRS.rise+(i?.008*Math.sin(i*1.9):0);}
export function stairHeight(z,x=stairCenter(z)){return treadHeight(stairLocal(x,z).i);}
export function treadRelief(x,z,local=stairLocal(x,z)){const {i,v}=local,d=stairPolar(x,z).r-STAIRS.R;return .004*Math.sin(d*9+i*.71)*Math.sin(Math.PI*v);}
export function poolFloor(x,z){const r=Math.hypot(x,z),lim=radialLimit(x||.000001,z||.000001),f=r/lim;
 if(f<=1){const apron=Math.max(0,(f-.70)/.30);return -.88+.025*Math.sin(x*3.2)*Math.cos(z*2.7)+.835*Math.pow(apron,2.4);}
 // A narrow eroded shoreline rises OUTSIDE the surveyed water footprint.
 const t=Math.min(1,(r-lim)/.30),q=t*t*(3-2*t);let y=-.025+.305*q;
 if(t>=1)y+=.012*Math.sin(x*3.1+z)*Math.cos(z*2.4);
 const d=Math.max(0,Math.min(1,(z-1.45)/1.1)),cx=-.85-.48*d;
 if(z>1.45&&z<2.65&&Math.abs(x-cx)<.13)y=Math.min(y,-.105-d*.045);
 return y;}
export function springFloor(x,z){if(inTunnel(x,z)&&z<STAIRS.start)return TUNNEL_Y;if(onStairFootprint(x,z,.025)&&z>=STAIRS.start){const l=stairLocal(x,z);return treadHeight(l.i)+treadRelief(x,z,l);}return poolFloor(x,z);}
export function springAllowed(x,z){
 if(!walkMask133(x,z))return false;
 if(Math.hypot(x-TOWEL133.x,z-TOWEL133.z)<.42)return false;
 if(SPRING_OCCUPANTS.some(p=>Math.hypot(x-p.x,z-p.z)<p.radius+.18))return false;
 if(Math.hypot(x-WASH_BASIN.x,z-WASH_BASIN.z)<WASH_BASIN.radius+.19)return false;
 if(Math.abs(x-(WASH_BASIN.x-.90))<.64&&Math.abs(z-(WASH_BASIN.z+.65))<.45)return false;
 if(inTunnel(x,z,.25)&&x>2.98&&x<4.57)return true;
 {const {r,t}=stairPolar(x,z);if(Math.abs(r-STAIRS.R)<STAIRS.width/2-.20&&t>=0&&t<STAIRS.sweep+.02&&z>=STAIRS.start)return true;}
 if(stairRock(x,z)> -.15||underStair(x,z))return false;
 {
  if(inAnnex(x,z,.24)&&x>2.3)return true;
  if(grottoAir(x,z)>.24&&poolFloor(x,z)>.05)return true;}
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
