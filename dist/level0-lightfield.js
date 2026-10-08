// Level 0 light field (V104). A world-anchored 2D irradiance map baked from the ceiling lamp grid
// of the resident chunk window. Every Level 0 surface reads it, so distant rooms are lit exactly as
// they will be when the player arrives, switched-off circuits keep only the light that bleeds in,
// and the real-time light count never changes (no shader recompiles).
//  R: direct fluorescent pool   G: wide bounce   B: neutral mask (Manila/atrium author their own)
//  A: occupancy-based ambient occlusion (walls, columns, furniture footprints)
// V104: light spreads by diffusion over the open cells only, so full-height walls and columns stop
// it (no glow leaking through to the dark side of a wall) while corridors channel it. The bake runs
// in a worker; the main thread only packs lamp and occluder lists.
export const L0_FIELD_CELL=.6;
const DIRECT_SCALE=72,DIRECT_MAX=4,BOUNCE_SCALE=18,BOUNCE_MAX=2.2;
// Pure function: shared by the worker and the synchronous fallback.
function l0Bake(job){
 const {N,x0,z0,cell,lamps,occ,neutralRects,DS,DM,BS,BM}=job,H=N>>1,NN=N*N;
 const emit=new Float32Array(NN),block=new Uint8Array(NN),aoSrc=new Float32Array(NN),neutral=new Float32Array(NN);
 const clampI=(v,n)=>v<0?0:v>n-1?n-1:v;
 // Occluders: [x0,x1,z0,z1,kind] kind 1 = full-height blocker, else AO weight only.
 for(let o=0;o<occ.length;o+=5){let ax=occ[o],bx=occ[o+1],az=occ[o+2],bz=occ[o+3];const k=occ[o+4];
  {const cx=(ax+bx)/2,cz=(az+bz)/2,hx=Math.max((bx-ax)/2,cell*.5),hz=Math.max((bz-az)/2,cell*.5);ax=cx-hx;bx=cx+hx;az=cz-hz;bz=cz+hz;}
  const a0=Math.ceil((ax-x0)/cell-.5),a1=Math.floor((bx-x0)/cell-.5),b0=Math.ceil((az-z0)/cell-.5),b1=Math.floor((bz-z0)/cell-.5);
  for(let b=Math.max(0,b0);b<=Math.min(N-1,b1);b++)for(let a=Math.max(0,a0);a<=Math.min(N-1,a1);a++){const i=b*N+a;if(k===1){block[i]=1;aoSrc[i]=1;}else aoSrc[i]=Math.max(aoSrc[i],k);}
 }
 for(let l=0;l<lamps.length;l+=3){const p=lamps[l+2];if(p<=0)continue;const u=(lamps[l]-x0)/cell-.5,v=(lamps[l+1]-z0)/cell-.5,i=Math.floor(u),j=Math.floor(v),fu=u-i,fv=v-j;
  const ws=[(1-fu)*(1-fv),fu*(1-fv),(1-fu)*fv,fu*fv];for(let q=0;q<4;q++){const a=i+(q&1),b=j+(q>>1);if(a>=0&&b>=0&&a<N&&b<N)emit[b*N+a]+=ws[q]*p;}}
 for(const r of neutralRects){const a0=Math.max(0,Math.floor((r.x0-x0)/cell)),a1=Math.min(N-1,Math.ceil((r.x1-x0)/cell)),b0=Math.max(0,Math.floor((r.z0-z0)/cell)),b1=Math.min(N-1,Math.ceil((r.z1-z0)/cell));for(let b=b0;b<=b1;b++)for(let a=a0;a<=a1;a++){const i=b*N+a;neutral[i]=1;block[i]=0;}}
 // A lamp over a wall cell hands its light to the open neighbours.
 for(let i=0;i<NN;i++)if(block[i]&&emit[i]>0){const a=i%N,b=(i/N)|0,nb=[];if(a>0&&!block[i-1])nb.push(i-1);if(a<N-1&&!block[i+1])nb.push(i+1);if(b>0&&!block[i-N])nb.push(i-N);if(b<N-1&&!block[i+N])nb.push(i+N);for(const j of nb)emit[j]+=emit[i]/nb.length;emit[i]=0;}
 // Reflecting diffusion over open cells (5-point stencil, k=.2 -> variance .4 cell^2 per pass).
 function diffuse(src,blk,n,iters,tmp){let a=src,b=tmp;const k=.2;for(let it=0;it<iters;it++){for(let y=0;y<n;y++){const row=y*n;for(let x=0;x<n;x++){const i=row+x;if(blk[i]){b[i]=0;continue;}const c=a[i];let s=0;
    if(x>0&&!blk[i-1])s+=a[i-1]-c;if(x<n-1&&!blk[i+1])s+=a[i+1]-c;if(y>0&&!blk[i-n])s+=a[i-n]-c;if(y<n-1&&!blk[i+n])s+=a[i+n]-c;b[i]=c+k*s;}}const t=a;a=b;b=t;}return a;}
 const direct=diffuse(Float32Array.from(emit),block,N,30,new Float32Array(NN));
 const half=new Float32Array(H*H),hblock=new Uint8Array(H*H);
 for(let b=0;b<H;b++)for(let a=0;a<H;a++){const i=(b*2)*N+a*2;const nb=block[i]+block[i+1]+block[i+N]+block[i+N+1];hblock[b*H+a]=nb>=2?1:0;}
 // Emission goes to its half cell, or (when that is a wall) to the half cell on its own side.
 for(let b=0;b<N;b++)for(let a=0;a<N;a++){const e=emit[b*N+a];if(!(e>0))continue;const ha=Math.min(H-1,a>>1),hb=Math.min(H-1,b>>1);let h=hb*H+ha;
  if(hblock[h]){const c=[(a&1)?(ha<H-1?h+1:-1):(ha>0?h-1:-1),(b&1)?(hb<H-1?h+H:-1):(hb>0?h-H:-1)];h=-1;for(const q of c)if(q>=0&&!hblock[q]){h=q;break;}if(h<0)continue;}
  half[h]+=e;}
 const bounceH=diffuse(half,hblock,H,48,new Float32Array(H*H));
 // Fill blocked half cells from open neighbours so bilinear upsampling does not pull black in.
 for(let i=0;i<H*H;i++)if(hblock[i]){const a=i%H,b=(i/H)|0;let s=0,c=0;for(const j of[a>0?i-1:-1,a<H-1?i+1:-1,b>0?i-H:-1,b<H-1?i+H:-1])if(j>=0&&!hblock[j]){s+=bounceH[j];c++;}bounceH[i]=c?s/c*.8:0;}
 // AO: small blur of occupancy.
 const t1=new Float32Array(NN);for(let p=0;p<2;p++){for(let y=0;y<N;y++)for(let x=0;x<N;x++){const i=y*N+x;t1[i]=(aoSrc[y*N+clampI(x-1,N)]+aoSrc[i]+aoSrc[y*N+clampI(x+1,N)])/3;}for(let y=0;y<N;y++)for(let x=0;x<N;x++){const i=y*N+x;aoSrc[i]=(t1[clampI(y-1,N)*N+x]+t1[i]+t1[clampI(y+1,N)*N+x])/3;}}
 const out=new Uint8Array(NN*4);
 for(let b=0;b<N;b++){const hb=Math.min(H-1,Math.max(0,(b-.5)/2)),b0=Math.floor(hb),b1=Math.min(H-1,b0+1),fb=hb-b0;
  for(let a=0;a<N;a++){const i=b*N+a,ha=Math.min(H-1,Math.max(0,(a-.5)/2)),a0=Math.floor(ha),a1=Math.min(H-1,a0+1),fa=ha-a0;
   const bounce=((bounceH[b0*H+a0]*(1-fa)+bounceH[b0*H+a1]*fa)*(1-fb)+(bounceH[b1*H+a0]*(1-fa)+bounceH[b1*H+a1]*fa)*fb)*BS;
   let d=direct[i];if(block[i]){let s=0,c=0;for(const j of[a>0?i-1:-1,a<N-1?i+1:-1,b>0?i-N:-1,b<N-1?i+N:-1])if(j>=0&&!block[j]){s+=direct[j];c++;}d=c?s/c*.55:0;}
   d*=DS;
   out[i*4]=Math.round(Math.sqrt(Math.min(1,d/DM))*255);out[i*4+1]=Math.round(Math.sqrt(Math.min(1,bounce/BM))*255);out[i*4+2]=Math.round(Math.min(1,neutral[i])*255);out[i*4+3]=Math.round(Math.min(1,block[i]?1:aoSrc[i]*1.25)*(1-neutral[i])*255);}}
 return out;
}
let workerFailed=false;
function makeWorker(){if(workerFailed||typeof Worker==='undefined')return null;try{const src=l0Bake.toString()+'\nonmessage=e=>{const out=l0Bake(e.data);postMessage({id:e.data.id,out},[out.buffer]);};';const url=URL.createObjectURL(new Blob([src],{type:'text/javascript'}));const w=new Worker(url);return w;}catch(e){workerFailed=true;return null;}}
export function createLevel0LightField(T,size){
 const N=Math.round(size/L0_FIELD_CELL);
 const make=()=>{const d=new Uint8Array(N*N*4);for(let i=0;i<N*N;i++){d[i*4]=Math.round(Math.sqrt(1/DIRECT_MAX)*255);d[i*4+1]=Math.round(Math.sqrt(1/BOUNCE_MAX)*255);d[i*4+3]=0;}const t=new T.DataTexture(d,N,N,T.RGBAFormat,T.UnsignedByteType);t.magFilter=t.minFilter=T.LinearFilter;t.generateMipmaps=false;t.wrapS=t.wrapT=T.ClampToEdgeWrapping;t.colorSpace=T.NoColorSpace;t.needsUpdate=true;return t;};
 const texA=make(),texB=make();
 const uniforms={l0FieldA:{value:texA},l0FieldB:{value:texB},l0FieldMix:{value:1},l0FieldRect:{value:new T.Vector4(0,0,1/size,0)}};
 let front=texB,back=texA,fade=1,fadeRate=1,jobId=0,worker=makeWorker();const jobs=new Map();let latestApplied=0,lastX0=NaN,lastZ0=NaN;
 function apply(d,x0,z0,instant,seconds){back.image.data.set(d);back.needsUpdate=true;
  if(instant||!(fade>=1)){front.image.data.set(d);front.needsUpdate=true;fade=1;uniforms.l0FieldMix.value=1;uniforms.l0FieldA.value=front;uniforms.l0FieldB.value=back;}
  else{uniforms.l0FieldA.value=front;uniforms.l0FieldB.value=back;fade=0;fadeRate=1/Math.max(.05,seconds);uniforms.l0FieldMix.value=0;}
  const t=front;front=back;back=t;uniforms.l0FieldRect.value.set(x0,z0,1/size,0);}
 if(worker){worker.onmessage=e=>{const j=jobs.get(e.data.id);jobs.delete(e.data.id);if(!j||e.data.id<latestApplied)return;latestApplied=e.data.id;apply(e.data.out,j.x0,j.z0,j.instant,j.seconds);};worker.onerror=()=>{workerFailed=true;worker=null;for(const j of jobs.values())runSync(j);jobs.clear();};}
 function runSync(j){apply(l0Bake(j),j.x0,j.z0,j.instant,j.seconds);latestApplied=j.id;}
 // lamps: iterable of {x,z,power}; neutralRects: [{x0,x1,z0,z1}]; occ: Float32Array of [x0,x1,z0,z1,kind]
 function compute(x0,z0,lamps,neutralRects,{instant=false,seconds=.55,occ=new Float32Array(0),sync=false}={}){
  const la=new Float32Array(lamps.length*3);lamps.forEach((l,i)=>{la[i*3]=l.x;la[i*3+1]=l.z;la[i*3+2]=l.power;});
  const job={id:++jobId,N,x0,z0,cell:L0_FIELD_CELL,lamps:la,occ,neutralRects:neutralRects.map(r=>({x0:r.x0,x1:r.x1,z0:r.z0,z1:r.z1})),DS:DIRECT_SCALE,DM:DIRECT_MAX,BS:BOUNCE_SCALE,BM:BOUNCE_MAX,instant,seconds};
  const far=!(Math.abs(x0-lastX0)<=size*.3&&Math.abs(z0-lastZ0)<=size*.3);lastX0=x0;lastZ0=z0;
  if(!worker||sync||(instant&&far)){runSync(job);return;}
  jobs.set(job.id,job);worker.postMessage(job);
 }
 // Decode for CPU queries (player-local darkness for fog / exposure).
 function sample(x,z){const r=uniforms.l0FieldRect.value,u=(x-r.x)*r.z,v=(z-r.y)*r.z;if(!(u>0&&v>0&&u<1&&v<1))return{direct:1,bounce:1,neutral:0};const a=Math.min(N-1,Math.floor(u*N)),b=Math.min(N-1,Math.floor(v*N)),i=(b*N+a)*4,A=uniforms.l0FieldA.value.image.data,B=uniforms.l0FieldB.value.image.data,m=uniforms.l0FieldMix.value;const dec=(D,k,s)=>{const q=D[i+k]/255;return q*q*s;};
  return{direct:dec(A,0,DIRECT_MAX)*(1-m)+dec(B,0,DIRECT_MAX)*m,bounce:dec(A,1,BOUNCE_MAX)*(1-m)+dec(B,1,BOUNCE_MAX)*m,neutral:(A[i+2]*(1-m)+B[i+2]*m)/255,ao:(A[i+3]*(1-m)+B[i+3]*m)/255};}
 function update(dt){if(fade<1){fade=Math.min(1,fade+dt*fadeRate);const s=fade*fade*(3-2*fade);uniforms.l0FieldMix.value=s;}}
 return{uniforms,compute,update,sample,N,get fading(){return fade<1},get pending(){return jobs.size},debug:()=>({worker:!!worker,workerFailed,latestApplied,jobId,fade})};
}
// Shared GLSL: needs uniforms above. l0Field4 = vec4(direct, bounce, neutral, ao) in linear units.
export const L0_FIELD_GLSL=`uniform sampler2D l0FieldA,l0FieldB;uniform float l0FieldMix;uniform vec4 l0FieldRect;
vec4 l0Field4(vec2 xz){vec2 uv=(xz-l0FieldRect.xy)*l0FieldRect.z;vec4 f=mix(texture2D(l0FieldA,uv),texture2D(l0FieldB,uv),l0FieldMix);f.rg=f.rg*f.rg*vec2(${DIRECT_MAX.toFixed(2)},${BOUNCE_MAX.toFixed(2)});
 float e=smoothstep(0.,.07,min(min(uv.x,uv.y),min(1.-uv.x,1.-uv.y)));return mix(vec4(1.,1.,0.,0.),f,e);}
vec3 l0FieldAt(vec2 xz){return l0Field4(xz).rgb;}`;
