import {CITY_ANGLE,cityToWorld,worldToCity} from './urban-layout.js?v=return-1';
import {EXIT_CITY_Y,ease} from './exit-route.js?v=60';
export const RETURN_LENGTH=560,RETURN_WIDTH=4.5,RETURN_GATE=26;
export const returnProgress={value:0};
export const RETURN_MOUTH={...cityToWorld(100,194),angle:CITY_ANGLE-Math.PI/2,y:EXIT_CITY_Y+.15};
export function returnToWorld(x,z,out={}){const a=RETURN_MOUTH.angle,c=Math.cos(a),s=Math.sin(a);out.x=RETURN_MOUTH.x+c*x+s*z;out.z=RETURN_MOUTH.z-s*x+c*z;return out;}
export function worldToReturn(x,z,out={}){const a=RETURN_MOUTH.angle,c=Math.cos(a),s=Math.sin(a),dx=x-RETURN_MOUTH.x,dz=z-RETURN_MOUTH.z;out.x=c*dx-s*dz;out.z=s*dx+c*dz;return out;}
// Two shallow industrial doglegs conceal the non-Euclidean continuation.
const raw=t=>({x:9*ease(20,76,t)+13*ease(112,190,t)-18*ease(240,320,t)+13*ease(344,430,t),z:t});
const path=[{...raw(0),s:0}];let len=0;for(let i=1;i<=560;i++){const p=raw(i),a=path.at(-1);len+=Math.hypot(p.x-a.x,p.z-a.z);path.push({...p,s:len});}for(const p of path)p.s*=RETURN_LENGTH/len;
export function returnPoint(s,out={}){let i=Math.max(0,Math.min(559,Math.floor(s/RETURN_LENGTH*560)));while(i<559&&path[i+1].s<s)i++;while(i>0&&path[i].s>s)i--;const a=path[i],b=path[i+1],t=(s-a.s)/(b.s-a.s),dx=b.x-a.x,dz=b.z-a.z,l=Math.hypot(dx,dz);Object.assign(out,{x:a.x+dx*t,z:a.z+dz*t,s,tx:dx/l,tz:dz/l,nx:dz/l,nz:-dx/l});return out;}
export function returnSample(x,z,out={}){const guess=Math.max(0,Math.min(559,Math.floor(z)));let best=Infinity;for(let i=Math.max(0,guess-4);i<=Math.min(559,guess+4);i++){const a=path[i],b=path[i+1],dx=b.x-a.x,dz=b.z-a.z,ll=dx*dx+dz*dz,t=Math.max(i?0:-20,Math.min(i===559?2:1,((x-a.x)*dx+(z-a.z)*dz)/ll)),qx=x-a.x-dx*t,qz=z-a.z-dz*t,d=qx*qx+qz*qz;if(d<best){best=d;out.s=a.s+(b.s-a.s)*t;out.signed=(qx*dz-qz*dx)/Math.sqrt(ll);}}out.distance=Math.sqrt(best);out.progress=Math.max(0,Math.min(1,out.s/RETURN_LENGTH));return out;}
export function returnFloor(x,z){const q=returnSample(x,z,{}),t=q.progress,a=Math.abs(q.signed);const rut=Math.exp(-Math.pow((a-.87)/.30,4)),berm=Math.exp(-Math.pow((a-1.28)/.20,2));return RETURN_MOUTH.y-.15*(1-ease(-4,3,q.s))+(-.115*rut+.03*berm+.005*Math.sin(q.s*.047)*Math.sin(a*3))*ease(.34,.75,t);}
export function returnHalfWidth(s){return RETURN_WIDTH/2-ease(200,390,s)*.2;}
export function atReturnMouth(wx,wz){const p=worldToReturn(wx,wz),q=returnSample(p.x,p.z,{});return q.s>RETURN_GATE&&q.s<RETURN_GATE+12&&q.distance<1.95;}
export function returnWaypoint(){const p=returnToWorld(0,-7);return{...p,label:'Level 11 · 面粉厂后巷',yaw:RETURN_MOUTH.angle+Math.PI,pitch:-.035};}
