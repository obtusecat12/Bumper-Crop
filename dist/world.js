// Coordinates use BigInt chunks and a small local floating point position.
// Every field is a deterministic function of its signed coordinates and seed.
export const CHUNK = 64;
export const mod = (n,m) => ((n%m)+m)%m;
export function stringSeed(value){let h=2166136261;for(const c of String(value)){h=Math.imul(h^c.charCodeAt(0),16777619)}return h>>>0}
export function chunkSeed(x,z,seed){return stringSeed(`${seed}:${x.toString()}:${z.toString()}`)}
export function random(seed){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
export function field(x,z,seed){
 const r=random(chunkSeed(x,z,seed));let type=r()<.13?'pond':r()<.20?'building':'wheat';
 let variant=Math.floor(r()*4);let cx=25+r()*15,cz=25+r()*15;let rx=12+r()*6,rz=9+r()*7;
 if(x===0n&&z===0n){type='building';variant=0;cx=31;cz=28;}
 if(x===-1n&&z===0n){type='pond';cx=42;cz=26;rx=16;rz=12;}
 const trees=[];const count=4+Math.floor(r()*5);
 for(let i=0;i<count;i++){const along=10+r()*46;trees.push({x:i%2?5.8+r()*1.8:along,z:i%2?along:5.8+r()*1.8,scale:.7+r()*.6,variant:Math.floor(r()*4),rotation:r()*Math.PI*2})}
 return {key:`${x},${z}`,x,z,type,variant,cx,cz,rx,rz,trees,seed:chunkSeed(x,z,seed),tint:r()};
}
export function periodOrigin(index){return Number(mod(index,1024n))*CHUNK}
export function height(x,z,cx=0n,cz=0n){
 const a=x+periodOrigin(cx),b=z+periodOrigin(cz),p=Math.PI*2/65536;
 return Math.sin(a*p*256)*.22+Math.cos(b*p*128)*.20+Math.sin((a+b)*p*64)*.27;
}
export function roadDistance(x,z){return Math.min(x,CHUNK-x,z,CHUNK-z)}
export function pondDistance(x,z,f){return Math.hypot((x-f.cx)/f.rx,(z-f.cz)/f.rz)}
export function buildingSize(f){return f.variant===0?[12,17,4.9]:f.variant===1?[13,19,4.5]:f.variant===2?[7,9,3.0]:[11,15,3.6]}
export function inClearing(x,z,f){if(f.type==='pond')return pondDistance(x,z,f)<1.24;if(f.type==='building'){const [w,d]=buildingSize(f);return Math.abs(x-f.cx)<w/2+3.5&&Math.abs(z-f.cz)<d/2+5;}return false}
export function wheatAllowed(x,z,f){return roadDistance(x,z)>7.3&&!inClearing(x,z,f)}
export function wheatCandidates(f,count=7600){const r=random(f.seed^0x734821);const items=[];for(let i=0;i<count;i++){const x=7.2+r()*49.5,z=7.2+r()*49.5,s=.78+r()*.37,a=r()*6.283,t=r();if(wheatAllowed(x,z,f))items.push({x,z,s,a,t,i})}return items}
export function resolveSolid(position,radius,colliders){
 for(const c of colliders){if(c.kind==='circle'){let dx=position.x-c.x,dz=position.z-c.z,dist=Math.hypot(dx,dz),min=radius+c.r;if(dist<min){if(dist<.00001){dx=1;dz=0;dist=1;}position.x=c.x+dx/dist*min;position.z=c.z+dz/dist*min}}
 else {const nx=Math.max(c.x1,Math.min(c.x2,position.x)),nz=Math.max(c.z1,Math.min(c.z2,position.z));let dx=position.x-nx,dz=position.z-nz,d=Math.hypot(dx,dz);if(d>0&&d<radius){position.x=nx+dx/d*radius;position.z=nz+dz/d*radius}else if(d===0){const options=[{d:position.x-c.x1,axis:'x',v:c.x1-radius},{d:c.x2-position.x,axis:'x',v:c.x2+radius},{d:position.z-c.z1,axis:'z',v:c.z1-radius},{d:c.z2-position.z,axis:'z',v:c.z2+radius}];options.sort((a,b)=>a.d-b.d);position[options[0].axis]=options[0].v}}}
 return position;
}
export function rebase(state){let dx=0,dz=0;while(state.x<0){state.x+=CHUNK;dx--}while(state.x>=CHUNK){state.x-=CHUNK;dx++}while(state.z<0){state.z+=CHUNK;dz--}while(state.z>=CHUNK){state.z-=CHUNK;dz++}state.cx+=BigInt(dx);state.cz+=BigInt(dz);return {dx,dz}}
