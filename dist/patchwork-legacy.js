// Stable agricultural parcels are independent of the 64m streaming grid.
// Correlated jitter keeps rectangles; occasional independent jitter clips corners.
const SIZE=216,sites=new Map(),contexts=new Map();
const floor=(x,n)=>x>=0n?x/n:(x-n+1n)/n;
const mod=(x,n)=>(x%n+n)%n;
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}h^=h>>>16;h=Math.imul(h,0x7feb352d);h^=h>>>15;return h>>>0}
function site(i,j,seed){const key=`${seed}:${i}:${j}`;let s=sites.get(key);if(s)return s;
 const h=hash('parcel:'+key),a=hash(`${seed}:column:${i}`)/4294967296,b=hash(`${seed}:row:${j}`)/4294967296;
 const independent=(h&7)<3?24:0;
 s={key,hash:h,dx:(a-.5)*25+(((h>>>8)&255)/255-.5)*independent,dz:(b-.5)*25+(((h>>>16)&255)/255-.5)*independent,
  crop:h%10<5?0:h%10<8?1:2,angleIndex:(h>>>5)%3,tone:.92+((h>>>20)&255)/255*.13};
 sites.set(key,s);if(sites.size>2048)sites.delete(sites.keys().next().value);return s;
}
function nh(x,z,seed){let n=Math.imul(x&255,374761393)^Math.imul(z&255,668265263)^seed;n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967296*2-1}
function noise(x,z,seed){let i=Math.floor(x),j=Math.floor(z),u=x-i,v=z-j;u=u*u*(3-2*u);v=v*v*(3-2*v);return(1-v)*((1-u)*nh(i,j,seed)+u*nh(i+1,j,seed))+v*((1-u)*nh(i,j+1,seed)+u*nh(i+1,j+1,seed))}
export function patchworkContext(cx,cz,seed){const k=`${seed}:${cx}:${cz}`;let c=contexts.get(k);if(c)return c;
 const wx=cx*64n,wz=cz*64n,ix=floor(wx+32n,216n),iz=floor(wz+32n,216n),points=[];
 for(let j=-2;j<=2;j++)for(let i=-2;i<=2;i++){const a=ix+BigInt(i),b=iz+BigInt(j),s=site(a,b,seed);points.push({...s,x:Number(a*216n-wx)+108+s.dx,z:Number(b*216n-wz)+108+s.dz,edges:[]})}
 for(const a of points)for(const b of points){const dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz);if(a===b||len>SIZE*1.65)continue;const nx=dx/len,nz=dz/len,h=hash(a.key<b.key?a.key+'/'+b.key:b.key+'/'+a.key);a.edges.push({nx,nz,c:(a.x+b.x)*.5*nx+(a.z+b.z)*.5*nz,width:3.5+(h%1001)/1000,mx:(a.x+b.x)*.5,mz:(a.z+b.z)*.5,sign:a.key<b.key?1:-1})}
 c={points,seed,nx:Number(mod(wx,55296n)),nz:Number(mod(wz,55296n))};contexts.set(k,c);if(contexts.size>192)contexts.delete(contexts.keys().next().value);return c;
}
export function parcelSample(x,z,f,out={}){const c=f.patch||patchworkContext(f.x,f.z,f.worldSeed),px=(x+c.nx)/216,pz=(z+c.nz)/216;
 const qx=x+2.6*(noise(px,pz,c.seed)+.5*noise(px*2+13,pz*2-7,c.seed)),qz=z+2.6*(noise(px+51,pz-19,c.seed)+.5*noise(px*2-5,pz*2+31,c.seed));
 let a=null,best=Infinity;for(const s of c.points){const d=(qx-s.x)**2+(qz-s.z)**2;if(d<best){best=d;a=s}}
 let d=Infinity,d2=Infinity,w=4,w2=4,nx=1,nz=0,nx2=0,nz2=1,t=0,t2=0;
 for(const e of a.edges){const v=e.c-qx*e.nx-qz*e.nz;if(v<d){d2=d;w2=w;nx2=nx;nz2=nz;t2=t;d=v;w=e.width;nx=e.nx;nz=e.nz;t=(-(qx-e.mx)*nz+(qz-e.mz)*nx)*e.sign}else if(v<d2){d2=v;w2=e.width;nx2=e.nx;nz2=e.nz;t2=(-(qx-e.mx)*nz2+(qz-e.mz)*nx2)*e.sign}}
 out.centerX=a.x;out.centerZ=a.z;out.id=a.key;out.crop=a.crop;out.angleIndex=a.angleIndex;out.angle=a.angleIndex*Math.PI/4;out.tone=a.tone;out.distance=Math.max(0,d);out.second=Math.max(0,d2);out.width=w;out.width2=w2;out.nx=nx;out.nz=nz;out.nx2=nx2;out.nz2=nz2;
 const co=Math.cos(out.angle),si=Math.sin(out.angle);out.row=(x-a.x)*co+(z-a.z)*si;out.along=-(x-a.x)*si+(z-a.z)*co;out.roadAlong=t;out.roadAlong2=t2;return out;
}
export const PARCEL_SIZE=SIZE;
