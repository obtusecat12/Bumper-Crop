// V133-bake-L0pit: offline lightmap for the Level 0 pit field ("深坑群", layout FIXED pits-fixed x -62..-27, z -9..29).
// Same CPU baker family as bake132_l0.mjs (three-mesh-bvh BVH, troffer area lights with soft shadows, AO, 2 diffuse bounces).
// Two outputs:
//  1) floor walkway / ceiling / edge walls: MODULATION factor = E(real scene with shafts) / E(same room with a solid floor),
//     i.e. exactly what the runtime light field (which ignores the pits) gets wrong: dark lips, ceiling starved of floor bounce.
//     Applied as a 2x-multiply overlay (byte 128 = neutral), floor quads follow the real floor pieces so nothing covers a hole.
//  2) shaft walls (top SH m of every pit): ABSOLUTE irradiance (mono, 8-bit, gamma .5) drawn opaque over the old unlit pit
//     shader, so the light of the troffer hanging above each pit pours down the shaft and dies out with depth.
// Run: NODE_PATH=/workspace/.cache/bake132/node_modules node tools/bake133_l0pit.mjs   (~1-2 min on 2 cores)
import {Worker,isMainThread,parentPort,workerData} from 'node:worker_threads';
import fs from 'node:fs';import os from 'node:os';
import {createRequire} from 'node:module';
const require=createRequire('/workspace/.cache/bake132/');
const D='/workspace/projects/536c6175-2b91-4d1e-8d3d-28210d8dbdd7/bc/dist/';
export const CFG={
 region:{x0:-62,x1:-27,z0:-9,z1:29},margin:3,
 texF:.16,texC:.2,texS:.195,texDeep:.8,SH:4.8,DEP:8,
 lampW:1.06,lampD:.46,lampRange:9,lampSamples:12,giSamples:48,bounces:2,
 aoDist:.55,aoSamples:12,ambient:.55,
 albedo:{wall:[.60,.52,.30],floor:[.36,.30,.18],ceil:[.70,.67,.56],shaft:[.50,.44,.27],bottom:[.03,.03,.03]},
 tintMix:.55,contrast:{floorR:.9,ceilR:.8,wall:.7},clamp:[.38,1.6],fade:1.2,offset:.004,quantBits:6,atlas:256,shaftAtlas:512
};
const THREE=require('three'),{MeshBVH}=require('three-mesh-bvh');
async function buildScene(solid){
 const L=await import(D+'level0-layout.js?v=119');
 const R=CFG.region,K=L.L0_CHUNK,H=L.L0_HEIGHT,M=CFG.margin,B={x0:R.x0-M,x1:R.x1+M,z0:R.z0-M,z1:R.z1+M};
 const walls=[],lamps=[],holes=[],floors=[];
 for(let cz=Math.floor(B.z0/K);cz<=Math.floor(B.z1/K);cz++)for(let cx=Math.floor(B.x0/K);cx<=Math.floor(B.x1/K);cx++){const c=L.createL0Chunk(cx,cz);
  for(const w of [...c.walls,...c.pillars])if(w.x+w.w/2>B.x0-1&&w.x-w.w/2<B.x1+1&&w.z+w.d/2>B.z0-1&&w.z-w.d/2<B.z1+1&&w.mat!==5)walls.push(w);
  for(const l of c.lights)if(l.on&&l.x>B.x0-4&&l.x<B.x1+4&&l.z>B.z0-4&&l.z<B.z1+4)lamps.push(l);
  for(const h of c.holes)if(h.x>B.x0-2&&h.x<B.x1+2&&h.z>B.z0-2&&h.z<B.z1+2)holes.push(h);
  for(const f of c.floors){const x0=Math.max(B.x0,f.x-f.w/2),x1=Math.min(B.x1,f.x+f.w/2),z0=Math.max(B.z0,f.z-f.d/2),z1=Math.min(B.z1,f.z+f.d/2);if(x1>x0+1e-4&&z1>z0+1e-4)floors.push({x0,x1,z0,z1});}}
 const surf=[],inR=(x0,x1,z0,z1)=>x1>R.x0&&x0<R.x1&&z1>R.z0&&z0<R.z1;
 const add=(o,a,la,b,lb,n,alb,out,kind,tex,extra)=>{const nu=Math.max(1,Math.ceil(la/tex)),nv=Math.max(1,Math.ceil(lb/tex));surf.push({o,a,la,b,lb,n,alb,out,kind,nu,nv,...extra});};
 // geometry floor: real pieces (solid scene: one slab), sampled coarse; the output floor is its own fine rect over R
 if(solid)add([B.x0,0,B.z0],[1,0,0],B.x1-B.x0,[0,0,1],B.z1-B.z0,[0,1,0],CFG.albedo.floor,false,'floor',.4);
 else for(const f of floors)add([f.x0,0,f.z0],[1,0,0],f.x1-f.x0,[0,0,1],f.z1-f.z0,[0,1,0],CFG.albedo.floor,false,'floor',.4);
 add([B.x0,H,B.z0],[1,0,0],B.x1-B.x0,[0,0,1],B.z1-B.z0,[0,-1,0],CFG.albedo.ceil,false,'ceil',.4);
 add([R.x0,0,R.z0],[1,0,0],R.x1-R.x0,[0,0,1],R.z1-R.z0,[0,1,0],CFG.albedo.floor,true,'floorR',CFG.texF);
 add([R.x0,H,R.z0],[1,0,0],R.x1-R.x0,[0,0,1],R.z1-R.z0,[0,-1,0],CFG.albedo.ceil,true,'ceilR',CFG.texC);
 for(const w of walls){if(w.ry&&Math.abs(Math.sin(w.ry*2))>1e-3)continue;
  const sw=Math.abs(Math.cos(w.ry||0))>.5,W=sw?w.w:w.d,Dd=sw?w.d:w.w,x0=w.x-W/2,x1=w.x+W/2,z0=w.z-Dd/2,z1=w.z+Dd/2,y0=w.y-w.h/2,y1=w.y+w.h/2;
  const out=inR(x0,x1,z0,z1),al=CFG.albedo.wall,t=CFG.texF;
  add([x0,y0,z1],[1,0,0],W,[0,1,0],w.h,[0,0,1],al,out,'wall',t);add([x1,y0,z0],[-1,0,0],W,[0,1,0],w.h,[0,0,-1],al,out,'wall',t);
  add([x1,y0,z1],[0,0,-1],Dd,[0,1,0],w.h,[1,0,0],al,out,'wall',t);add([x0,y0,z0],[0,0,1],Dd,[0,1,0],w.h,[-1,0,0],al,out,'wall',t);
  w._b={x0,x1,z0,z1,y0,y1};}
 if(!solid)for(const h of holes){const x0=h.x-h.w/2,x1=h.x+h.w/2,z0=h.z-h.d/2,z1=h.z+h.d/2,SH=CFG.SH,DE=CFG.DEP,al=CFG.albedo.shaft,out=inR(x0,x1,z0,z1);
  // inner faces, normal into the shaft; b axis = +y; upper part (output) and deep part (geometry only)
  const faces=[[[x0,0,z1],[0,0,-1],h.d,[1,0,0]],[[x1,0,z0],[0,0,1],h.d,[-1,0,0]],[[x0,0,z0],[1,0,0],h.w,[0,0,1]],[[x1,0,z1],[-1,0,0],h.w,[0,0,-1]]];
  for(const[o,a,la,n]of faces){add([o[0],-SH,o[2]],a,la,[0,1,0],SH,n,al,out,'shaft',CFG.texS);add([o[0],-DE,o[2]],a,la,[0,1,0],DE-SH,n,al,false,'deep',CFG.texDeep);}
  add([x0,-DE,z0],[1,0,0],h.w,[0,0,1],h.d,[0,1,0],CFG.albedo.bottom,false,'deep',CFG.texDeep);}
 return {R,B,H,walls:walls.filter(w=>w._b),lamps,holes,floors,surf};
}
function geometry(sc){
 const P=[],SID=[];sc.surf.forEach((s,i)=>{if(s.kind==='floorR'||s.kind==='ceilR')return;const c=(u,v)=>[0,1,2].map(k=>s.o[k]+s.a[k]*u+s.b[k]*v),p0=c(0,0),p1=c(s.la,0),p2=c(s.la,s.lb),p3=c(0,s.lb);
  const cr=[s.a[1]*s.b[2]-s.a[2]*s.b[1],s.a[2]*s.b[0]-s.a[0]*s.b[2],s.a[0]*s.b[1]-s.a[1]*s.b[0]],fl=cr[0]*s.n[0]+cr[1]*s.n[1]+cr[2]*s.n[2]<0;
  for(const t of fl?[[p0,p2,p1],[p0,p3,p2]]:[[p0,p1,p2],[p0,p2,p3]]){P.push(...t[0],...t[1],...t[2]);SID.push(i);}});
 return {P:new Float32Array(P),SID:new Int32Array(SID)};
}
function samples(sc,solid){
 const pts=[];let k=0;for(const s of sc.surf){s.k0=k;for(let j=0;j<s.nv;j++)for(let i=0;i<s.nu;i++){const u=(i+.5)/s.nu*s.la,v=(j+.5)/s.nv*s.lb,p=[0,1,2].map(q=>s.o[q]+s.a[q]*u+s.b[q]*v+s.n[q]*.01);
   let bad=sc.walls.some(w=>{const b=w._b;return p[0]>b.x0+.002&&p[0]<b.x1-.002&&p[2]>b.z0+.002&&p[2]<b.z1-.002&&p[1]>b.y0&&p[1]<b.y1+.005;});
   if(!solid&&s.kind==='floorR'&&sc.holes.some(h=>Math.abs(p[0]-h.x)<h.w/2&&Math.abs(p[2]-h.z)<h.d/2))bad=true;
   pts.push(p[0],p[1],p[2],bad?0:1);k++;}}
 return new Float32Array(pts);
}
function hash(n){n=(n^61)^(n>>>16);n=Math.imul(n,9);n^=n>>>4;n=Math.imul(n,0x27d4eb2d);n^=n>>>15;return (n>>>0)/4294967296;}
function basis(n){const s=n[2]>=0?1:-1,a=-1/(s+n[2]),b=n[0]*n[1]*a;return [[1+s*n[0]*n[0]*a,s*b,-s*n[0]],[b,s+n[1]*n[1]*a,-n[1]]];}
function kernel(){
 const {sc,G,PT,mode,E,lo,hi}=workerData;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(G.P,3));const bvh=new MeshBVH(g,{targetLeafSize:4});
 const ray=new THREE.Ray(),o=new THREE.Vector3(),d=new THREE.Vector3(),tsid=[];sc.surf.forEach((s,i)=>{for(let k=s.k0;k<s.k0+s.nu*s.nv;k++)tsid[k]=i;});
 const out=new Float32Array((hi-lo)*3);
 const lookup=(si,p)=>{const s=sc.surf[si],rx=p.x-s.o[0],ry=p.y-s.o[1],rz=p.z-s.o[2],u=rx*s.a[0]+ry*s.a[1]+rz*s.a[2],v=rx*s.b[0]+ry*s.b[1]+rz*s.b[2];const i=Math.min(s.nu-1,Math.max(0,Math.floor(u/s.la*s.nu))),j=Math.min(s.nv-1,Math.max(0,Math.floor(v/s.lb*s.nv)));return s.k0+j*s.nu+i;};
 for(let t=lo;t<hi;t++){const si=tsid[t],s=sc.surf[si],n=s.n,px=PT[t*4],py=PT[t*4+1],pz=PT[t*4+2],r=(t-lo)*3;if(!PT[t*4+3])continue;
  if(mode==='direct'){let occ=0;
   for(const L of sc.lamps){const lx=L.x-px,lz=L.z-pz;const ly=sc.H-.02-py;if(lx*lx+lz*lz>CFG.lampRange*CFG.lampRange+(py<0?ly*ly:0))continue;if(ly<=.01)continue;let a=0;
    for(let q=0;q<CFG.lampSamples;q++){const hx=(q+hash(t*7+q*3+1))/CFG.lampSamples-.5,hz=hash(t*13+q*5+2)-.5,sx=L.x+hx*CFG.lampW,sz=L.z+hz*CFG.lampD,dx=sx-px,dy=ly,dz=sz-pz,dd=Math.hypot(dx,dy,dz);
     const ns=(n[0]*dx+n[1]*dy+n[2]*dz)/dd;if(ns<=0)continue;const k=ns*(dy/dd)/(dd*dd+.05);
     o.set(px,py,pz);d.set(dx/dd,dy/dd,dz/dd);ray.set(o,d);if(!bvh.raycastFirst(ray,2,0,dd-.03))a+=k;}
    occ+=a/CFG.lampSamples;}
   const [t1,t2]=basis(n);let ao=0;for(let q=0;q<CFG.aoSamples;q++){const u1=(q+hash(t*3+q))/CFG.aoSamples,u2=hash(t*11+q*7),rr=Math.sqrt(u1),ph=6.2831853*u2,x=rr*Math.cos(ph),y=rr*Math.sin(ph),zz=Math.sqrt(Math.max(0,1-u1));
    d.set(t1[0]*x+t2[0]*y+n[0]*zz,t1[1]*x+t2[1]*y+n[1]*zz,t1[2]*x+t2[2]*y+n[2]*zz);o.set(px,py,pz);ray.set(o,d);if(bvh.raycastFirst(ray,2,0,CFG.aoDist))ao++;}
   out[r]=occ;out[r+1]=ao/CFG.aoSamples;
  }else{let R=0,Gg=0,Bb=0;const [t1,t2]=basis(n),NS=CFG.giSamples;
   for(let q=0;q<NS;q++){const u1=(q+hash(t*5+q*3+9))/NS,u2=hash(t*13+q*29+4),rr=Math.sqrt(u1),ph=6.2831853*u2,x=rr*Math.cos(ph),y=rr*Math.sin(ph),zz=Math.sqrt(Math.max(0,1-u1));
    d.set(t1[0]*x+t2[0]*y+n[0]*zz,t1[1]*x+t2[1]*y+n[1]*zz,t1[2]*x+t2[2]*y+n[2]*zz);o.set(px,py,pz);ray.set(o,d);const h=bvh.raycastFirst(ray,2,0,30);if(!h)continue;
    const hs=G.SID[Math.floor(h.face.a/3)],k=lookup(hs,h.point),al=sc.surf[hs].alb;R+=al[0]*E[k*3];Gg+=al[1]*E[k*3+1];Bb+=al[2]*E[k*3+2];}
   out[r]=R/NS;out[r+1]=Gg/NS;out[r+2]=Bb/NS;}
 }
 parentPort.postMessage(out,[out.buffer]);
}
async function pass(sc,G,PT,mode,E){const N=PT.length/4,W=Math.max(1,os.cpus().length),step=Math.ceil(N/W);
 const parts=await Promise.all(Array.from({length:W},(_,w)=>new Promise((res,rej)=>{const lo=w*step,hi=Math.min(N,lo+step);const wk=new Worker(new URL(import.meta.url),{workerData:{sc,G,PT,mode,E,lo,hi}});wk.on('message',res);wk.on('error',rej);})));
 const out=new Float32Array(N*3);let k=0;for(const p of parts){out.set(p,k);k+=p.length;}return out;}
// full GI solve; ambient is a FIXED absolute (same for both scenes) = CFG.ambient x mean unoccluded-ish floor light of the solid scene
async function solve(solid,amb){const t0=Date.now(),sc=await buildScene(solid),G=geometry(sc),PT=samples(sc,solid),N=PT.length/4;
 console.log(solid?'[solid]':'[pits]','surfaces',sc.surf.length,'texels',N,'lamps',sc.lamps.length,'holes',sc.holes.length,'tris',G.SID.length);
 const dir=await pass(sc,G,PT,'direct');
 if(amb==null){const fl=sc.surf.find(s=>s.kind==='floorR');let m=0,c=0;for(let k=fl.k0;k<fl.k0+fl.nu*fl.nv;k++)if(PT[k*4+3]){m+=dir[k*3];c++;}amb=CFG.ambient*m/c;}
 const Dl=new Float32Array(N*3);for(let k=0;k<N;k++){const above=PT[k*4+1]>=-.05?1:Math.exp(PT[k*4+1]*.9);for(let ch=0;ch<3;ch++)Dl[k*3+ch]=dir[k*3]+amb*above*(1-.8*dir[k*3+1]);}
 let E=Dl;for(let b=0;b<CFG.bounces;b++){const g=await pass(sc,G,PT,'gi',E),En=new Float32Array(N*3);for(let i=0;i<En.length;i++)En[i]=Dl[i]+g[i];E=En;}
 console.log('  done',((Date.now()-t0)/1e3).toFixed(1)+'s');return {sc,PT,E,amb};}
async function main(){const t0=Date.now();
 const S=await solve(true,null),P=await solve(false,S.amb);
 // map solid-scene texels by (kind, position) -> output kinds share grids in both scenes (floorR/ceilR/wall identical)
 const key=s=>s.kind+':'+s.o.join(',')+':'+s.n.join(',');const sm=new Map(S.sc.surf.map(s=>[key(s),s]));
 const sc=P.sc,PT=P.PT,E=P.E,N=PT.length/4,F=new Float32Array(N*3),ok=new Uint8Array(N);
 let floorMean=0,fc=0;
 for(const s of sc.surf){if(!s.out)continue;if(s.kind==='shaft')continue;const t=sm.get(key(s));if(!t)throw new Error('no solid twin '+key(s));
  for(let k=0;k<s.nu*s.nv;k++){const kp=s.k0+k,ks=t.k0+k;if(!PT[kp*4+3])continue;ok[kp]=1;const f=[0,1,2].map(ch=>E[kp*3+ch]/Math.max(1e-6,S.E[ks*3+ch])),lu=.3*f[0]+.59*f[1]+.11*f[2];
   if(s.kind==='floorR'){floorMean+=S.E[ks*3+1];fc++;}
   const g=CFG.contrast[s.kind];for(let ch=0;ch<3;ch++)F[kp*3+ch]=Math.min(CFG.clamp[1],Math.max(CFG.clamp[0],Math.pow(Math.max(1e-3,lu+(f[ch]-lu)*CFG.tintMix),g)));}}
 floorMean/=fc;
 // fade overlay to neutral at the region border (the field around it is lit by the normal runtime)
 const R=sc.R;for(const s of sc.surf){if(!s.out||s.kind==='shaft'||s.kind==='wall')continue;for(let k=s.k0;k<s.k0+s.nu*s.nv;k++){if(!ok[k])continue;const x=PT[k*4],z=PT[k*4+2],e=Math.min(x-R.x0,R.x1-x,z-R.z0,R.z1-z),w=Math.max(0,Math.min(1,e/CFG.fade));
  let ww=w;if(s.kind==='ceilR'&&sc.lamps.some(l=>Math.abs(l.x-x)<.62&&Math.abs(l.z-z)<.3))ww=0;for(let ch=0;ch<3;ch++)F[k*3+ch]=1+(F[k*3+ch]-1)*ww;}}
 // shafts: absolute, relative to the solid-scene mean floor irradiance (runtime floor level == 1.0 here)
 for(const s of sc.surf){if(s.kind!=='shaft'||!s.out)continue;for(let k=s.k0;k<s.k0+s.nu*s.nv;k++){ok[k]=1;const y=PT[k*4+1],fade=Math.min(1,(y+CFG.SH)/1.0);for(let ch=0;ch<3;ch++)F[k*3+ch]=E[k*3+ch]/floorMean*Math.max(0,fade);}}
 // dilate invalid texels (floor texels over holes, buried wall texels)
 const outS=sc.surf.filter(s=>s.out);
 for(const s of outS){for(let it=0;it<4;it++){let any=false;for(let j=0;j<s.nv;j++)for(let i=0;i<s.nu;i++){const k=s.k0+j*s.nu+i;if(ok[k])continue;let a=[0,0,0],c=0;for(const[di,dj]of[[1,0],[-1,0],[0,1],[0,-1]]){const ii=i+di,jj=j+dj;if(ii<0||jj<0||ii>=s.nu||jj>=s.nv)continue;const kk=s.k0+jj*s.nu+ii;if(ok[kk]===1){for(let ch=0;ch<3;ch++)a[ch]+=F[kk*3+ch];c++;}}
   if(c){for(let ch=0;ch<3;ch++)F[k*3+ch]=a[ch]/c;ok[k]=2;any=true;}}for(let k=s.k0;k<s.k0+s.nu*s.nv;k++)if(ok[k]===2)ok[k]=1;if(!any)break;}
  for(let k=s.k0;k<s.k0+s.nu*s.nv;k++)if(!ok[k])for(let ch=0;ch<3;ch++)F[k*3+ch]=1;}
 // denoise modulation surfaces (GI noise is amplified by the ratio): 2 passes of a 3x3 box over valid texels
 for(const s of outS){if(s.kind==='shaft')continue;const it=s.kind==='wall'?4:2;for(let r=0;r<it;r++){const T2=F.slice(s.k0*3,(s.k0+s.nu*s.nv)*3);for(let j=0;j<s.nv;j++)for(let i=0;i<s.nu;i++){let a=[0,0,0],c=0;for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){const ii=i+di,jj=j+dj;if(ii<0||jj<0||ii>=s.nu||jj>=s.nv)continue;const kk=jj*s.nu+ii;for(let ch=0;ch<3;ch++)a[ch]+=T2[kk*3+ch];c++;}const k=s.k0+j*s.nu+i;for(let ch=0;ch<3;ch++)F[k*3+ch]=a[ch]/c;}}}
 for(const s of outS){if(s.kind!=='shaft')continue;const T2=F.slice(s.k0*3,(s.k0+s.nu*s.nv)*3);for(let j=0;j<s.nv;j++)for(let i=0;i<s.nu;i++){let a=0,c=0;for(let di=-1;di<=1;di++){const ii=i+di;if(ii<0||ii>=s.nu)continue;a+=T2[(j*s.nu+ii)*3+1];c++;}const k=s.k0+j*s.nu+i;const v=a/c;for(let ch=0;ch<3;ch++)F[k*3+ch]=v;}}
 // pack. modulation atlases: RGB, byte = f/2*255 (6-bit). shaft atlas: mono luminance, byte = sqrt(E/2)*255
 const q=1<<(8-CFG.quantBits),encM=v=>Math.min(255,Math.round(Math.max(0,v/2*255)/q)*q),encS=v=>Math.min(255,Math.round(Math.sqrt(Math.max(0,v)/2)*255));
 const atlases=[],quads=[],shaftQuads=[];
 const newAtlas=(w,h,mono)=>{const a={w,h,mono,px:new Uint8Array(w*h*(mono?1:3)),x:0,y:0,row:0};atlases.push(a);return a;};
 const blit=(a,s,X,Y)=>{const st=a.mono?1:3;for(let j=-1;j<=s.nv;j++)for(let i=-1;i<=s.nu;i++){const k=s.k0+Math.min(s.nv-1,Math.max(0,j))*s.nu+Math.min(s.nu-1,Math.max(0,i)),p=((Y+j+1)*a.w+(X+i+1))*st;
   if(a.mono)a.px[p]=encS(.3*F[k*3]+.59*F[k*3+1]+.11*F[k*3+2]);else for(let ch=0;ch<3;ch++)a.px[p+ch]=encM(F[k*3+ch]);}
  return [(X+1)/a.w,(Y+1)/a.h,(X+1+s.nu)/a.w,(Y+1+s.nv)/a.h];};
 const r4=v=>+v.toFixed(4),r6=v=>+v.toFixed(6);
 for(const s of outS.filter(s=>s.kind==='floorR'||s.kind==='ceilR')){const a=newAtlas(s.nu+2,s.nv+2,false),uv=blit(a,s,0,0),t=atlases.indexOf(a);
  if(s.kind==='ceilR'){const o=s.o.map((v,c)=>v+s.n[c]*CFG.offset);quads.push({t,o:o.map(r4),a:s.a.map(v=>r4(v*s.la)),b:s.b.map(v=>r4(v*s.lb)),uv:uv.map(r6)});}
  else for(const f of sc.floors){// one quad per real floor piece inside R
   const x0=Math.max(R.x0,f.x0),x1=Math.min(R.x1,f.x1),z0=Math.max(R.z0,f.z0),z1=Math.min(R.z1,f.z1);if(x1<=x0+1e-4||z1<=z0+1e-4)continue;
   const U=x=>uv[0]+(x-R.x0)/(R.x1-R.x0)*(uv[2]-uv[0]),V=z=>uv[1]+(z-R.z0)/(R.z1-R.z0)*(uv[3]-uv[1]);
   quads.push({t,o:[r4(x0),CFG.offset,r4(z0)],a:[r4(x1-x0),0,0],b:[0,0,r4(z1-z0)],uv:[U(x0),V(z0),U(x1),V(z1)].map(r6)});}}
 let wa=null;for(const s of outS.filter(s=>s.kind==='wall').sort((x,y)=>y.nv-x.nv||y.nu-x.nu)){const w=s.nu+2,h=s.nv+2;if(!wa)wa=newAtlas(CFG.atlas,CFG.atlas,false);if(wa.x+w>wa.w){wa.x=0;wa.y+=wa.row;wa.row=0;}if(wa.y+h>wa.h)wa=newAtlas(CFG.atlas,CFG.atlas,false);
  const uv=blit(wa,s,wa.x,wa.y),o=s.o.map((v,c)=>v+s.n[c]*CFG.offset);quads.push({t:atlases.indexOf(wa),o:o.map(r4),a:s.a.map(v=>r4(v*s.la)),b:s.b.map(v=>r4(v*s.lb)),uv:uv.map(r6)});wa.x+=w;wa.row=Math.max(wa.row,h);}
 const trim=a=>{const used=a.y+a.row,nh=Math.max(1,1<<Math.ceil(Math.log2(used)));if(nh<a.h){const st=a.mono?1:3,ti=atlases.indexOf(a);for(const qd of [...quads,...shaftQuads])if(qd.t===ti){qd.uv[1]=r6(qd.uv[1]*a.h/nh);qd.uv[3]=r6(qd.uv[3]*a.h/nh);}a.px=a.px.slice(0,a.w*nh*st);a.h=nh;}};
 if(wa)trim(wa);
 let sa=null;for(const s of outS.filter(s=>s.kind==='shaft')){const w=s.nu+2,h=s.nv+2;if(!sa)sa=newAtlas(CFG.shaftAtlas,CFG.shaftAtlas,true);if(sa.x+w>sa.w){sa.x=0;sa.y+=sa.row;sa.row=0;}if(sa.y+h>sa.h)sa=newAtlas(CFG.shaftAtlas,CFG.shaftAtlas,true);
  const uv=blit(sa,s,sa.x,sa.y),o=s.o.map((v,c)=>v+s.n[c]*.003);shaftQuads.push({t:atlases.indexOf(sa),o:o.map(r4),a:s.a.map(v=>r4(v*s.la)),b:s.b.map(v=>r4(v*s.lb)),uv:uv.map(r6)});sa.x+=w;sa.row=Math.max(sa.row,h);}
 if(sa)trim(sa);
 const fm=[];for(const s of outS)if(s.kind!=='shaft'){let sum=0,c=0;for(let k=s.k0;k<s.k0+s.nu*s.nv;k++){sum+=F[k*3+1];c++;}fm.push(s.kind+' '+(sum/c).toFixed(3));}
 console.log('factor means',fm.slice(0,4).join(' | '),'atlases',atlases.map(a=>a.w+'x'+a.h+(a.mono?'m':'')).join(' '),'quads',quads.length,'shaftQuads',shaftQuads.length);
 const js=`// Generated by tools/bake133_l0pit.mjs (V133-bake-L0pit): pit-field lightmap. Modulation atlases (RGB, byte/255*2, 128 neutral) for floor pieces /\n// ceiling / edge walls; mono shaft atlases (irradiance = (byte/255)^2*2, relative to the lit floor). quad = o + s*a + t*b, uv=[u0,v0,u1,v1]. Off with ?bake=0.\nexport const BAKE133_PIT=${JSON.stringify({region:CFG.region,shaftH:CFG.SH,atlases:atlases.map(a=>({w:a.w,h:a.h,mono:a.mono,px:Buffer.from(a.px).toString('base64')})),quads,shaftQuads})};\n`;
 fs.writeFileSync(D+'level0-bake133-pit-data.js',js);
 fs.mkdirSync('/workspace/work/v133p/atl',{recursive:true});atlases.forEach((a,i)=>fs.writeFileSync(`/workspace/work/v133p/atl/a${i}.${a.mono?'pgm':'ppm'}`,Buffer.concat([Buffer.from(`${a.mono?'P5':'P6'} ${a.w} ${a.h} 255\n`),Buffer.from(a.px)])));
 console.log('wrote',(js.length/1024).toFixed(0)+' KB',((Date.now()-t0)/1e3).toFixed(1)+'s');
}
if(isMainThread)main();else kernel();
