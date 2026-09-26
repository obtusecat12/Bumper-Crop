// One authored, bounded corridor. No timer, accumulated walking distance or
// modulo world coordinates: this exit cannot repeat across the infinite map.
export const EXIT_START={x:488,z:173.8};
export const EXIT_LENGTH=360,EXIT_CITY_Y=.28;
export const transitionProgress={value:0};
export const clamp01=v=>Math.max(0,Math.min(1,v));
export const ease=(a,b,v)=>{const t=clamp01((v-a)/(b-a));return t*t*(3-2*t);};
// A restrained bend hides the urban threshold without looking like a portal.
function rawPoint(t){return {x:EXIT_START.x+34*ease(0,1,t)+9*Math.sin(Math.PI*clamp01(t)),z:EXIT_START.z+357*t};}
const samples=[{...rawPoint(0),s:0}];let length=0;
for(let i=1;i<=120;i++){const p=rawPoint(i/120),a=samples[i-1];length+=Math.hypot(p.x-a.x,p.z-a.z);samples.push({...p,s:length});}
for(const p of samples)p.s*=EXIT_LENGTH/length;
export function exitPoint(s,out={}){
 const q=Math.max(0,Math.min(119,Math.floor(s/3))),a=samples[q],b=samples[q+1],t=(s-a.s)/(b.s-a.s),dx=b.x-a.x,dz=b.z-a.z,l=Math.hypot(dx,dz);
 out.x=a.x+dx*t;out.z=a.z+dz*t;out.tx=dx/l;out.tz=dz/l;out.nx=out.tz;out.nz=-out.tx;out.s=s;return out;
}
export function exitSample(wx,wz,out={}){
 out.active=false;out.progress=0;out.influence=0;out.distance=1e8;out.s=-1e8;out.signed=1e8;
 if(wx<350||wx>690||wz< -40||wz>900)return out;
 const guess=Math.max(0,Math.min(119,Math.floor((wz-EXIT_START.z)/357*120)));let best=Infinity;
 for(let i=Math.max(0,guess-2);i<=Math.min(119,guess+2);i++){
  const a=samples[i],b=samples[i+1],vx=b.x-a.x,vz=b.z-a.z,ll=vx*vx+vz*vz;
  let t=((wx-a.x)*vx+(wz-a.z)*vz)/ll;
  if(i!==0)t=Math.max(0,t);if(i!==119)t=Math.min(1,t);
  const dx=wx-a.x-vx*t,dz=wz-a.z-vz*t,d=dx*dx+dz*dz;
  if(d<best){best=d;out.s=a.s+(b.s-a.s)*t;out.signed=(dx*vz-dz*vx)/Math.sqrt(ll);}
 }
 out.distance=Math.sqrt(best);out.progress=clamp01(out.s/EXIT_LENGTH);
 const width=35+ease(.25,.85,out.progress)*70;
 out.influence=(1-ease(width-18,width,out.distance))*ease(-12,5,out.s)*(1-ease(525,560,out.s));
 out.active=out.influence>0;out.halfWidth=2.05+ease(.22,.86,out.progress)*2.05;
 return out;
}
export function exitForField(x,z,f,out={}){
 if(f.x<5n||f.x>10n||f.z<2n||f.z>12n){out.active=false;out.progress=out.influence=0;out.distance=1e8;out.s=-1e8;out.signed=1e8;return out;}
 return exitSample(Number(f.x)*64+x,Number(f.z)*64+z,out);
}
export function exitCropFactor(q){return 1-ease(.24,.76,q.progress)*q.influence;}
export function exitRoadRelief(q){const a=Math.abs(q.signed),rut=Math.exp(-Math.pow((a-.9)/.21,4)),berm=Math.exp(-Math.pow((a-1.16)/.11,2));return(-.095*rut+.035*berm)*(1-ease(.25,.63,q.progress));}
export function exitBaseHeight(q,natural){return natural+(EXIT_CITY_Y-natural)*ease(.60,.88,q.progress)*q.influence;}
export function exitSurface(q,natural){const base=exitBaseHeight(q,natural);return base+exitRoadRelief(q)*(1-ease(q.halfWidth,q.halfWidth+.8,q.distance))*ease(-12,4,q.s);}
// Shader mirrors the bounded projection; both material and plant generation
// use the same world position. u_transitionProgress never repaints other fields.
export const EXIT_GLSL=`
float exitEase(float a,float b,float v){float t=clamp((v-a)/(b-a),0.,1.);return t*t*(3.-2.*t);}
vec4 exitField(vec2 w){
 float t=clamp((w.y-173.8)/357.,0.,1.);
 float cx=488.+34.*exitEase(0.,1.,t)+9.*sin(3.14159265*t);
 float across=abs(w.x-cx),gate=exitEase(161.8,178.8,w.y)*(1.-exitEase(698.8,733.8,w.y));
 float width=35.+exitEase(.25,.85,t)*70.;
 float influence=(1.-exitEase(width-18.,width,across))*gate;
 return vec4(t,across,influence,2.05+exitEase(.22,.86,t)*2.05);
}`;
export function exitTeleport(field,seed){const p=exitPoint(3),cx=BigInt(Math.floor(p.x/64)),cz=BigInt(Math.floor(p.z/64));return {kind:'city-exit',label:'通往 Level 11 的小径 · 约 503 米',cx,cz,x:p.x-Number(cx)*64,z:p.z-Number(cz)*64,yaw:Math.atan2(-p.tx,-p.tz),field:field(cx,cz,seed)};}
