// V34: a single world-stable implicit basin, shared by collision, map and mesh.
// Coordinates stay relative to the lake owner, never to a camera or tile seed.
const sat=x=>Math.max(0,Math.min(1,x)),mix=(a,b,t)=>a+(b-a)*t;
const smooth=(a,b,x)=>{const t=sat((x-a)/(b-a));return t*t*(3-2*t)};
const TAU=Math.PI*2,STEP=1,cache=new Map(),configs=new Map();
function hash(x,z,s){let n=Math.imul(x,374761393)^Math.imul(z,668265263)^s;n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296;}
function random(s){return()=>{s=(s+0x6D2B79F5)|0;let t=Math.imul(s^s>>>15,s|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
const gx=[1,-1,1,-1,1,-1,0,0],gz=[1,1,-1,-1,0,0,1,-1];
function simplex(x,z,p){const f=(x+z)*.3660254037844386,i=Math.floor(x+f),j=Math.floor(z+f),g=(i+j)*.21132486540518713,x0=x-i+g,z0=z-j+g,ix=x0>z0?1:0,iz=1-ix;
 let sum=0;for(let k=0;k<3;k++){const a=k===0?0:k===1?ix:1,b=k===0?0:k===1?iz:1,dx=x0-a+k*.21132486540518713,dz=z0-b+k*.21132486540518713,t=.5-dx*dx-dz*dz;if(t>0){const h=p[((i+a)&255)+p[(j+b)&255]]&7;sum+=t*t*t*t*(gx[h]*dx+gz[h]*dz)}}return sum*70;}
function fbm(x,z,p){let v=0,a=1;for(let i=0;i<5;i++){v+=simplex(x,z,p)*a;x=x*2+3.17;z=z*2-1.93;a*=.5}return v/1.9375;}
function worley(x,z,s){const ix=Math.floor(x),iz=Math.floor(z);let a=100,b=100;for(let j=-2;j<=2;j++)for(let i=-2;i<=2;i++){const xx=ix+i,zz=iz+j,dx=xx+.15+hash(xx,zz,s)*.7-x,dz=zz+.15+hash(xx,zz,s^0x1911)*.7-z,d=dx*dx+dz*dz;if(d<a){b=a;a=d}else if(d<b)b=d}return Math.sqrt(b)-Math.sqrt(a)}
function union(a,b,k){const h=sat(.5+.5*(b-a)/k);return mix(b,a,h)-k*h*(1-h)}
function capsule(x,z,ax,az,bx,bz,r){const dx=bx-ax,dz=bz-az,t=sat(((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz));return Math.hypot(x-ax-dx*t,z-az-dz*t)-r}
const lakeKeys=new WeakMap();
function key(f){let k=lakeKeys.get(f);if(k===undefined){k=`${f.lakeSeed??f.seed}:${f.rx}:${f.rz}:${f.angle}`;lakeKeys.set(f,k);}return k;}
function config(f){const k=key(f);let c=configs.get(k);if(c)return c;
 const seed=(f.lakeSeed??f.seed)>>>0,r=random(seed^0x62a194),perm=new Uint16Array(512),v=Array.from({length:256},(_,i)=>i);for(let i=255;i>0;i--){const j=Math.floor(r()*(i+1));[v[i],v[j]]=[v[j],v[i]]}for(let i=0;i<512;i++)perm[i]=v[i&255];
 c={seed,perm,phase:r()*TAU,turn:r()*TAU,arm:.72+r()*.24,rockPhase:r()*31,ca:Math.cos(f.angle||0),sa:Math.sin(f.angle||0),rx:f.rx,rz:f.rz};
 const bx=f.rx*1.48+23,bz=f.rz*1.48+23;
 c.bx=Math.ceil(Math.abs(c.ca)*bx+Math.abs(c.sa)*bz);c.bz=Math.ceil(Math.abs(c.sa)*bx+Math.abs(c.ca)*bz);
 configs.set(k,c);if(configs.size>128)configs.delete(configs.keys().next().value);return c;
}
export function pondBounds(f){const c=config(f);if(c.bounds)return c.bounds;let minX=1e4,maxX=-1e4,minZ=1e4,maxZ=-1e4;const t={};for(let z=-c.bz;z<=c.bz;z+=4)for(let x=-c.bx;x<=c.bx;x+=4){raw(x,z,c,t);if(t.d<t.width+2){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minZ=Math.min(minZ,z);maxZ=Math.max(maxZ,z)}}return c.bounds=[minX-6,maxX+6,minZ-6,maxZ+6]}
function raw(x,z,c,out){const p=c.perm,ux=(c.ca*x-c.sa*z)/c.rx,uz=(c.sa*x+c.ca*z)/c.rz;
 // Two cascaded vector warps: the second samples q, not the original p.
 const qx=ux+.22*simplex(ux*1.65,uz*1.65,p),qz=uz+.22*simplex(ux*1.65+5.2,uz*1.65+1.3,p);
 const rx=qx+.095*simplex(qx*4.1+1.7,qz*4.1+9.2,p),rz=qz+.095*simplex(qx*4.1+8.3,qz*4.1+2.8,p);
 let d=Math.hypot(rx,rz)-.64;
 // Connected deposition basin and branching lobes; a subtractive tongue can
 // produce non-star-shaped bays. No polar radius is used anywhere in the field.
 for(let j=0;j<3;j++){const a=c.turn+j*2.13+(j===1?.32:0),ex=Math.cos(a)*c.arm,ez=Math.sin(a)*c.arm;d=union(d,capsule(rx,rz,ex*.25,ez*.25,ex,ez,.23+(j===1?.035:0)),.15)}
 const a=c.turn+.98,px=Math.cos(a)*1.08,pz=Math.sin(a)*1.08;
 d=Math.max(d,-capsule(rx,rz,px,pz,px*.52,pz*.52,.16));
 d*=Math.min(c.rx,c.rz);
 // One narrow, gently meandering runoff/inlet trough joining a sheltered bay.
 const along=rx*Math.cos(c.turn)+rz*Math.sin(c.turn),across=-rx*Math.sin(c.turn)+rz*Math.cos(c.turn);
 const stream=(Math.abs(across-.035*Math.sin(along*11+c.phase))-(.035+.035*(1-sat(along))))*Math.min(c.rx,c.rz);
 if(along>.35&&along<1.22)d=union(d,Math.max(stream,(along-1.16)*35),1.5);
 const near=1-smooth(8,24,Math.abs(d)),f=fbm(x*.046+3,z*.046-7,p);
 const w=near>0?worley(x*.22,z*.22,c.seed):.3;
 const fracture=.6*f+.4*(sat(w*2)-.45);d+=fracture*3.3*near;
 const hardness=smooth(-.04,.42,simplex(x*.025+c.rockPhase,z*.025-8,p));
 // Rock reaches are bounded, while most of the rural shoreline remains low.
 const rock=hardness*(1-smooth(9,19,Math.abs(d)));
 const width=mix(22,3.0,hardness),basin=5.5;
 let h;if(d<0){const inward=-d,shallow=.48*smooth(0,mix(11,1.8,hardness),inward),shelf=1.32*smooth(mix(11,1.8,hardness),mix(23,8,hardness),inward),deep=(basin-1.8)*smooth(22,43,inward);h=-shallow-shelf-deep+f*.16*smooth(7,22,inward);
 }else{h=.50*smooth(0,width,d)+rock*(.60+sat(w*2)*.60)*smooth(0,.9,d)*(1-smooth(3,12,d));}
 // F2-F1 is zero on fractures; carve cracks only where bedrock is exposed.
 h-=rock*(1-smooth(.018,.11,w))*.32*smooth(.15,1.6,Math.abs(d));
 h=d<0?Math.min(-.001,h):Math.max(.001,h);
 out.d=d;out.h=h;out.rock=rock;out.width=width;out.sed=0;return out;
}
function atlas(f){const k=key(f);let a=cache.get(k);if(a)return a;const c=config(f),bounds=pondBounds(f),nx=Math.ceil(bounds[1]-bounds[0])+1,nz=Math.ceil(bounds[3]-bounds[2])+1,n=nx*nz;
 a={nx,nz,ox:bounds[0],oz:bounds[2],d:new Float32Array(n),h:new Float32Array(n),rock:new Float32Array(n),width:new Float32Array(n),sed:new Float32Array(n),gx:new Float32Array(n),gz:new Float32Array(n),contours:null};const sample={};
 for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const n=j*nx+i;raw(i+a.ox,j+a.oz,c,sample);a.d[n]=sample.d;a.h[n]=sample.h;a.rock[n]=sample.rock;a.width[n]=sample.width;}
 // Separable Gaussian convolution (sigma~1 m), positive concavity filling only.
 // Full-lake ownership provides halos automatically across streaming tiles.
 const tmp=new Float32Array(n),weights=[1,4,6,4,1];for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){let h=0;for(let q=-2;q<=2;q++)h+=a.h[j*nx+Math.max(0,Math.min(nx-1,i+q))]*weights[q+2];tmp[j*nx+i]=h/16}
 for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const n=j*nx+i;let h=0;for(let q=-2;q<=2;q++)h+=tmp[Math.max(0,Math.min(nz-1,j+q))*nx+i]*weights[q+2];const dep=Math.min(.20,Math.max(0,h/16-a.h[n]))*(1-a.rock[n])*(1-smooth(5,18,Math.abs(a.d[n])));a.sed[n]=dep*5;a.h[n]+=a.d[n]<0?Math.min(dep,Math.max(0,-.002-a.h[n])):dep;}
 for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const n=j*nx+i;a.gx[n]=(a.h[j*nx+Math.min(nx-1,i+1)]-a.h[j*nx+Math.max(0,i-1)])*.5;a.gz[n]=(a.h[Math.min(nz-1,j+1)*nx+i]-a.h[Math.max(0,j-1)*nx+i])*.5;}
 cache.set(k,a);if(cache.size>6)cache.delete(cache.keys().next().value);return a;
}
function outside(a,x,z){return Math.hypot(Math.max(a.ox-x,0,x-(a.ox+a.nx-1)),Math.max(a.oz-z,0,z-(a.oz+a.nz-1)))}
function bilinear(a,data,x,z){const xx=x-a.ox,zz=z-a.oz,i=Math.max(0,Math.min(a.nx-2,Math.floor(xx))),j=Math.max(0,Math.min(a.nz-2,Math.floor(zz))),u=sat(xx-i),v=sat(zz-j),n=j*a.nx+i;
 // Same diagonal as contour extraction; despite legacy name this is triangular.
 return u+v<=1?data[n]+u*(data[n+1]-data[n])+v*(data[n+a.nx]-data[n]):data[n+a.nx+1]+(1-u)*(data[n+a.nx]-data[n+a.nx+1])+(1-v)*(data[n+1]-data[n+a.nx+1]);}

const temp={};
export function pondMetrics(x,z,f,out={}){const a=atlas(f),xx=x-f.cx,zz=z-f.cz,rawD=bilinear(a,a.d,xx,zz)+outside(a,xx,zz),width=bilinear(a,a.width,xx,zz),h=bilinear(a,a.h,xx,zz),slope=Math.hypot(bilinear(a,a.gx,xx,zz),bilinear(a,a.gz,xx,zz));
 const d=Math.sign(h)*mix(Math.min(Math.abs(h)/Math.max(.025,slope),Math.abs(rawD)+2),Math.abs(rawD),smooth(3,8,Math.abs(rawD)));
 out.rawMetres=rawD;out.angle=Math.atan2(zz,xx);out.distance=1+d/Math.min(f.rx,f.rz);out.metres=d;out.width=width;out.bank=d/width;out.rock=bilinear(a,a.rock,xx,zz);out.sediment=bilinear(a,a.sed,xx,zz);out.relativeHeight=h;out.slope=slope;return out;}
export function pondTerrainHeight(x,z,f,land){const m=pondMetrics(x,z,f,temp);return f.lakeY+m.relativeHeight+(land-f.lakeY-.5)*smooth(0,.5,Math.max(0,m.relativeHeight));}
export function pondDistance(x,z,f){return pondMetrics(x,z,f,temp).distance}
export function pondShoreDistance(x,z,f){
 const a=atlas(f),xx=x-f.cx,zz=z-f.cz,rawD=bilinear(a,a.d,xx,zz)+outside(a,xx,zz),h=bilinear(a,a.h,xx,zz);
 // Beyond the blend band, the full metric's other five samples cancel exactly.
 if(Math.abs(rawD)>=8)return Math.sign(h)*Math.abs(rawD);
 const slope=Math.hypot(bilinear(a,a.gx,xx,zz),bilinear(a,a.gz,xx,zz));
 return Math.sign(h)*mix(Math.min(Math.abs(h)/Math.max(.025,slope),Math.abs(rawD)+2),Math.abs(rawD),smooth(3,8,Math.abs(rawD)));
}
export function pondAngle(x,z,f){return Math.atan2(z-f.cz,x-f.cx)}
export function pondHabitat(x,z,f,out={}){pondMetrics(x,z,f,out);const worldX=x+(typeof f.x==='bigint'?Number((f.x%1024n+1024n)%1024n)*64:0),worldZ=z+(typeof f.z==='bigint'?Number((f.z%1024n+1024n)%1024n)*64:0),p=TAU/65536,land=Math.sin(worldX*p*256)*.22+Math.cos(worldZ*p*128)*.20+Math.sin((worldX+worldZ)*p*64)*.27;
 const h=out.relativeHeight+(land-f.lakeY-.5)*smooth(0,.5,Math.max(0,out.relativeHeight)),low=1-sat(out.slope*2.8),gate=1-smooth(12,25,Math.max(0,out.metres));out.wetland=smooth(-.16,.02,h)*(1-smooth(.14,.48,h))*low*gate;out.beach=smooth(-.20,.13,h)*(1-smooth(.34,.63,h))*low*gate;return out;}
function contourAtlas(a){if(a.contours)return a.contours;const segments=[],links=new Map(),node=(x,z)=>`${Math.round(x*1e5)},${Math.round(z*1e5)}`;
 const add=(v)=>{const k=node(v.x,v.z);if(!links.has(k))links.set(k,[]);return k};
 const tri=(p)=>{const hit=[];for(let i=0;i<3;i++){const v=p[i],w=p[(i+1)%3];if((v.d<0)!==(w.d<0)){const t=v.d/(v.d-w.d);hit.push({x:mix(v.x,w.x,t),z:mix(v.z,w.z,t)})}}if(hit.length===2){const id=segments.length,k=add(hit[0]),l=add(hit[1]);segments.push({p:hit,k,l,used:false});links.get(k).push(id);links.get(l).push(id)}};
 for(let j=0;j<a.nz-1;j++)for(let i=0;i<a.nx-1;i++){const n=j*a.nx+i,d=[a.h[n],a.h[n+1],a.h[n+a.nx],a.h[n+a.nx+1]];if(d.every(v=>v<0)||d.every(v=>v>=0))continue;const x=i+a.ox,z=j+a.oz,p=[{x,z,d:d[0]},{x:x+1,z,d:d[1]},{x,z:z+1,d:d[2]},{x:x+1,z:z+1,d:d[3]}];tri([p[0],p[2],p[1]]);tri([p[1],p[2],p[3]])}
 const loops=[];for(const seg of segments){if(seg.used)continue;seg.used=true;const points=[seg.p[0],seg.p[1]];let k=seg.l;while(k!==seg.k){const id=links.get(k)?.find(i=>!segments[i].used);if(id===undefined)break;const s=segments[id];s.used=true;const forward=s.k===k;points.push(s.p[forward?1:0]);k=forward?s.l:s.k;}if(points.length>3){let area=0,length=0;const lengths=[0];for(let i=1;i<points.length;i++){area+=points[i-1].x*points[i].z-points[i].x*points[i-1].z;length+=Math.hypot(points[i].x-points[i-1].x,points[i].z-points[i-1].z);lengths.push(length)}loops.push({points,lengths,length,area:Math.abs(area/2)})}}
 loops.sort((a,b)=>b.area-a.area);a.contours=loops;return loops;}
export function pondContours(f){return contourAtlas(atlas(f)).map(l=>l.points.map(p=>({x:p.x+f.cx,z:p.z+f.cz})));}
// Legacy a is now a PERIMETER parameter, not a polar radius. This reaches every
// concave bay and cape, including portions hidden by other shore along a ray.
export function pondPoint(f,a,scale=1){const loop=contourAtlas(atlas(f))[0],t=((a/TAU)%1+1)%1*loop.length;let lo=0,hi=loop.lengths.length-1;while(hi-lo>1){const m=(lo+hi)>>1;if(loop.lengths[m]<t)lo=m;else hi=m}const u=(t-loop.lengths[lo])/Math.max(1e-9,loop.lengths[hi]-loop.lengths[lo]),p=loop.points[lo],q=loop.points[hi];return{x:f.cx+mix(p.x,q.x,u)*scale,z:f.cz+mix(p.z,q.z,u)*scale};}
export function pondBankPoint(f,a,metres=0){const p=pondPoint(f,a);if(!metres)return p;const e=.5,gx=pondShoreDistance(p.x+e,p.z,f)-pondShoreDistance(p.x-e,p.z,f),gz=pondShoreDistance(p.x,p.z+e,f)-pondShoreDistance(p.x,p.z-e,f),len=Math.hypot(gx,gz)||1;return{x:p.x+gx/len*metres,z:p.z+gz/len*metres};}
export function pondShoreWidth(f,a){const p=pondPoint(f,a);return pondMetrics(p.x,p.z,f,temp).width}
export function pondRadius(f,a){const p=pondPoint(f,a);return Math.hypot((p.x-f.cx)/f.rx,(p.z-f.cz)/f.rz)}
export const pondShapeGLSL=''; // V34 material consumes shared sampled attributes.
export function lakeCacheStats(){let bytes=0;for(const a of cache.values())bytes+=a.d.byteLength*7;return{lakes:cache.size,bytes}}
// Stream the already-generated atlas alongside the first visible lake chunk.
// Physics never rebuilds a newly encountered lake on the render thread.
export function lakeAtlasKeys(){return [...cache.keys()]}
export function copyLakeAtlas(f,known=[]){if(f.type!=='pond'||known.includes(key(f)))return null;const a=atlas(f),copy={key:key(f),nx:a.nx,nz:a.nz,ox:a.ox,oz:a.oz};for(const n of ['d','h','rock','width','sed','gx','gz'])copy[n]=a[n].slice();return copy}
export function acceptLakeAtlas(a){if(!a)return;cache.delete(a.key);cache.set(a.key,{...a,contours:null});if(cache.size>6)cache.delete(cache.keys().next().value)}
