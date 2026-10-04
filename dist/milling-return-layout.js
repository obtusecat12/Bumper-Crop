import {CITY_ANGLE,cityToWorld} from './urban-layout.js?v=return-1';
import {EXIT_CITY_Y,ease} from './exit-route.js?v=60';
export const RETURN_LENGTH=240,RETURN_WIDTH=4.5,RETURN_GATE=18;
export const returnProgress={value:0};
export const RETURN_MOUTH={...cityToWorld(100,194),angle:CITY_ANGLE-Math.PI/2,y:EXIT_CITY_Y+.15};
export function returnToWorld(x,z,out={}){const a=RETURN_MOUTH.angle,c=Math.cos(a),s=Math.sin(a);out.x=RETURN_MOUTH.x+c*x+s*z;out.z=RETURN_MOUTH.z-s*x+c*z;return out;}
export function worldToReturn(x,z,out={}){const a=RETURN_MOUTH.angle,c=Math.cos(a),s=Math.sin(a),dx=x-RETURN_MOUTH.x,dz=z-RETURN_MOUTH.z;out.x=c*dx-s*dz;out.z=s*dx+c*dz;return out;}
// Metres, not a scaled scene: preserve 4.5m clear width, human scale and an actual
// double loading-yard bend. At the scene boundary neither street can be seen.
const raw=z=>({x:7*ease(10,20,z)-5*ease(28,38,z)+3*ease(62,82,z)+3*ease(98,126,z)-7*ease(143,174,z)+7*ease(180,205,z),z});
const path=[{...raw(0),s:0}];for(let z=.5;path.at(-1).s<RETURN_LENGTH;z+=.5){const p=raw(z),a=path.at(-1),d=Math.hypot(p.x-a.x,p.z-a.z);if(a.s+d>RETURN_LENGTH){const t=(RETURN_LENGTH-a.s)/d;path.push({x:a.x+(p.x-a.x)*t,z:a.z+(p.z-a.z)*t,s:RETURN_LENGTH});break;}path.push({...p,s:a.s+d});}
const last=path.length-2;
export function returnPoint(s,out={}){let i=Math.max(0,Math.min(last,Math.floor(s*2)));while(i<last&&path[i+1].s<s)i++;while(i>0&&path[i].s>s)i--;const a=path[i],b=path[i+1],t=(s-a.s)/(b.s-a.s),dx=b.x-a.x,dz=b.z-a.z,l=Math.hypot(dx,dz);Object.assign(out,{x:a.x+dx*t,z:a.z+dz*t,s,tx:dx/l,tz:dz/l,nx:dz/l,nz:-dx/l});return out;}
export function returnSample(x,z,out={}){const guess=Math.max(0,Math.min(last,Math.floor(z*2)));let best=Infinity;for(let i=Math.max(0,guess-30);i<=Math.min(last,guess+30);i++){const a=path[i],b=path[i+1],dx=b.x-a.x,dz=b.z-a.z,ll=dx*dx+dz*dz,t=Math.max(i?0:-100,Math.min(i===last?100:1,((x-a.x)*dx+(z-a.z)*dz)/ll)),qx=x-a.x-dx*t,qz=z-a.z-dz*t,d=qx*qx+qz*qz;if(d<best){best=d;out.s=a.s+(b.s-a.s)*t;out.signed=(qx*dz-qz*dx)/Math.sqrt(ll);}}out.distance=Math.sqrt(best);out.progress=Math.max(0,Math.min(1,out.s/RETURN_LENGTH));return out;}
export function returnFloor(x,z){const q=returnSample(x,z,{}),t=q.progress,a=Math.abs(q.signed),rut=Math.exp(-Math.pow((a-.87)/.30,4)),berm=Math.exp(-Math.pow((a-1.28)/.20,2));return RETURN_MOUTH.y-.15*(1-ease(-4,3,q.s))+(-.115*rut+.03*berm+.005*Math.sin(q.s*.047)*Math.sin(a*3))*ease(.34,.75,t);}
export function returnHalfWidth(s){return RETURN_WIDTH/2-ease(.36,.70,s/RETURN_LENGTH)*.2;}
export function atReturnMouth(wx,wz){const p=worldToReturn(wx,wz),q=returnSample(p.x,p.z,{});return q.s>RETURN_GATE&&q.s<RETURN_GATE+12&&q.distance<1.95;}
export function returnWaypoint(){const p=returnToWorld(0,-7);return{...p,label:'Level 11 · 面粉厂后巷',yaw:RETURN_MOUTH.angle+Math.PI,pitch:-.035};}
