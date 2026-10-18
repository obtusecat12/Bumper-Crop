// V132-bake L0: offline lightmap baker for the Level 0 spawn room (self-written CPU baker, same family as bake132_l27.mjs).
// The room is all axis-aligned boxes, so it gets a true lightmap: every face of every wall / floor / ceiling in the bake
// box is a rect surface with its own 12 cm texel grid; the spawn-region faces are shelf-packed into <=256² atlases.
// L0 is lit at runtime by an unshadowed light field + hemisphere, so the bake stores a MODULATION factor
// (occluded troffer light + 2 diffuse bounces + AO-weighted ambient) / (unoccluded troffer light + ambient),
// applied by dist/level0-bake132.js as a 2x-multiply overlay (byte 128 = neutral). Off with ?bake=0.
// Run: NODE_PATH=/workspace/.cache/bake132/node_modules node tools/bake132_l0.mjs   (deps: three-mesh-bvh MIT, three MIT)
import {Worker,isMainThread,parentPort,workerData} from 'node:worker_threads';
import fs from 'node:fs';import os from 'node:os';
import {createRequire} from 'node:module';
const require=createRequire('/workspace/.cache/bake132/');
const D='/workspace/projects/536c6175-2b91-4d1e-8d3d-28210d8dbdd7/bc/dist/';
export const CFG={
 texel:.12,margin:3.2,lampW:1.06,lampD:.46,lampRange:9,lampSamples:16,giSamples:64,bounces:2,giGain:1.0,
 aoDist:.55,aoSamples:16,ambient:.55,// ambient = this x mean unoccluded floor light
 albedo:{wall:[.60,.52,.30],floor:[.36,.30,.18],ceil:[.70,.67,.56]},
 tintMix:.55,contrast:{floorR:.85,ceilR:.6,wall:.85},clamp:[.42,1.55],fade:1.0,offset:.004,quantBits:6,atlas:256
};
const THREE=require('three'),{MeshBVH}=require('three-mesh-bvh');
async function buildScene(){
 const L=await import(D+'level0-layout.js?v=119'),S=await import(D+'level0-spawn117.js?v=119');
 const R=S.SPAWN_REGION,K=L.L0_CHUNK,H=L.L0_HEIGHT,M=CFG.margin,B={x0:R.x0-M,x1:R.x1+M,z0:R.z0-M,z1:R.z1+M};
 const walls=[],lamps=[],holes=[];
 for(let cz=Math.floor(B.z0/K);cz<=Math.floor(B.z1/K);cz++)for(let cx=Math.floor(B.x0/K);cx<=Math.floor(B.x1/K);cx++){const c=L.createL0Chunk(cx,cz);
  for(const w of [...c.walls,...c.pillars])if(w.x+w.w/2>B.x0-1&&w.x-w.w/2<B.x1+1&&w.z+w.d/2>B.z0-1&&w.z-w.d/2<B.z1+1&&w.mat!==5)walls.push(w);
  for(const l of c.lights)if(l.on&&l.x>B.x0-4&&l.x<B.x1+4&&l.z>B.z0-4&&l.z<B.z1+4)lamps.push(l);
  for(const t of c.damage.tiles)if(t.state==='missing')holes.push(t);}
 const surf=[],inR=(x0,x1,z0,z1)=>x1>R.x0&&x0<R.x1&&z1>R.z0&&z0<R.z1;
 // rect surface: origin o, axis a (len la), axis b (len lb), normal n
 const add=(o,a,la,b,lb,n,alb,out,kind)=>{const nu=Math.max(1,Math.ceil(la/CFG.texel)),nv=Math.max(1,Math.ceil(lb/CFG.texel));surf.push({o,a,la,b,lb,n,alb,out,kind,nu,nv});};
 add([B.x0,0,B.z0],[1,0,0],B.x1-B.x0,[0,0,1],B.z1-B.z0,[0,1,0],CFG.albedo.floor,false,'floor');
 add([B.x0,H,B.z0],[1,0,0],B.x1-B.x0,[0,0,1],B.z1-B.z0,[0,-1,0],CFG.albedo.ceil,false,'ceil');
 // output floor/ceiling = the spawn region only (its own surfaces, sampled at the same 12 cm)
 add([R.x0,0,R.z0],[1,0,0],R.x1-R.x0,[0,0,1],R.z1-R.z0,[0,1,0],CFG.albedo.floor,true,'floorR');
 add([R.x0,H,R.z0],[1,0,0],R.x1-R.x0,[0,0,1],R.z1-R.z0,[0,-1,0],CFG.albedo.ceil,true,'ceilR');
 for(const w of walls){if(w.ry&&Math.abs(Math.sin(w.ry*2))>1e-3)continue;// spawn walls are axis-aligned; skip rotated L0 walls
  const sw=Math.abs(Math.cos(w.ry||0))>.5,W=sw?w.w:w.d,Dd=sw?w.d:w.w,x0=w.x-W/2,x1=w.x+W/2,z0=w.z-Dd/2,z1=w.z+Dd/2,y0=w.y-w.h/2,y1=w.y+w.h/2;
  const out=String(w.id||'').startsWith('spawn-wall')||inR(x0,x1,z0,z1),al=CFG.albedo.wall;
  add([x0,y0,z1],[1,0,0],W,[0,1,0],w.h,[0,0,1],al,out,'wall');add([x1,y0,z0],[-1,0,0],W,[0,1,0],w.h,[0,0,-1],al,out,'wall');
  add([x1,y0,z1],[0,0,-1],Dd,[0,1,0],w.h,[1,0,0],al,out,'wall');add([x0,y0,z0],[0,0,1],Dd,[0,1,0],w.h,[-1,0,0],al,out,'wall');
  if(y1<H-.02)add([x0,y1,z0],[1,0,0],W,[0,0,1],Dd,[0,1,0],al,out,'wall');
  w._b={x0,x1,z0,z1,y0,y1};}
 return {R,B,H,walls:walls.filter(w=>w._b),lamps,holes,surf};
}
function geometry(sc){// triangles of every surface except the output duplicates (floorR/ceilR are covered by floor/ceil)
 const P=[],SID=[];sc.surf.forEach((s,i)=>{if(s.kind==='floorR'||s.kind==='ceilR')return;const c=(u,v)=>[0,1,2].map(k=>s.o[k]+s.a[k]*u+s.b[k]*v),p0=c(0,0),p1=c(s.la,0),p2=c(s.la,s.lb),p3=c(0,s.lb);
  const cr=[s.a[1]*s.b[2]-s.a[2]*s.b[1],s.a[2]*s.b[0]-s.a[0]*s.b[2],s.a[0]*s.b[1]-s.a[1]*s.b[0]],fl=cr[0]*s.n[0]+cr[1]*s.n[1]+cr[2]*s.n[2]<0;
  for(const t of fl?[[p0,p2,p1],[p0,p3,p2]]:[[p0,p1,p2],[p0,p2,p3]]){P.push(...t[0],...t[1],...t[2]);SID.push(i);}});
 return {P:new Float32Array(P),SID:new Int32Array(SID)};
}
function samples(sc){// texel centres; texels buried in a wall are flagged invalid (dilated later)
 const pts=[];let k=0;for(const s of sc.surf){s.k0=k;for(let j=0;j<s.nv;j++)for(let i=0;i<s.nu;i++){const u=(i+.5)/s.nu*s.la,v=(j+.5)/s.nv*s.lb,p=[0,1,2].map(q=>s.o[q]+s.a[q]*u+s.b[q]*v+s.n[q]*.01);
   const buried=sc.walls.some(w=>{const b=w._b;return p[0]>b.x0+.002&&p[0]<b.x1-.002&&p[2]>b.z0+.002&&p[2]<b.z1-.002&&p[1]>b.y0&&p[1]<b.y1+.005;});pts.push(p[0],p[1],p[2],buried?0:1);k++;}}
 return new Float32Array(pts);
}
function hash(n){n=(n^61)^(n>>>16);n=Math.imul(n,9);n^=n>>>4;n=Math.imul(n,0x27d4eb2d);n^=n>>>15;return (n>>>0)/4294967296;}
function basis(n){const s=n[2]>=0?1:-1,a=-1/(s+n[2]),b=n[0]*n[1]*a;return [[1+s*n[0]*n[0]*a,s*b,-s*n[0]],[b,s+n[1]*n[1]*a,-n[1]]];}
function kernel(){
 const {sc,G,PT,mode,E,lo,hi}=workerData;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(G.P,3));const bvh=new MeshBVH(g,{targetLeafSize:4});
 const ray=new THREE.Ray(),o=new THREE.Vector3(),d=new THREE.Vector3(),tsid=[];sc.surf.forEach((s,i)=>{for(let k=s.k0;k<s.k0+s.nu*s.nv;k++)tsid[k]=i;});
 const out=new Float32Array((hi-lo)*(mode==='direct'?7:3));
 const lookup=(si,p)=>{const s=sc.surf[si],rx=p.x-s.o[0],ry=p.y-s.o[1],rz=p.z-s.o[2],u=rx*s.a[0]+ry*s.a[1]+rz*s.a[2],v=rx*s.b[0]+ry*s.b[1]+rz*s.b[2];const i=Math.min(s.nu-1,Math.max(0,Math.floor(u/s.la*s.nu))),j=Math.min(s.nv-1,Math.max(0,Math.floor(v/s.lb*s.nv)));return s.k0+j*s.nu+i;};
 for(let t=lo;t<hi;t++){const si=tsid[t],s=sc.surf[si],n=s.n,px=PT[t*4],py=PT[t*4+1],pz=PT[t*4+2],r=(t-lo)*(mode==='direct'?7:3);if(!PT[t*4+3])continue;
  if(mode==='direct'){let occ=0,ref=0;
   for(const L of sc.lamps){const lx=L.x-px,lz=L.z-pz;if(lx*lx+lz*lz>CFG.lampRange*CFG.lampRange)continue;const ly=sc.H-.02-py;if(ly<=.01)continue;let a=0,b=0;
    for(let q=0;q<CFG.lampSamples;q++){const hx=(q+hash(t*7+q*3+1))/CFG.lampSamples-.5,hz=hash(t*13+q*5+2)-.5,sx=L.x+hx*CFG.lampW,sz=L.z+hz*CFG.lampD,dx=sx-px,dy=ly,dz=sz-pz,dd=Math.hypot(dx,dy,dz);
     const ns=(n[0]*dx+n[1]*dy+n[2]*dz)/dd;if(ns<=0)continue;const k=ns*(dy/dd)/(dd*dd+.05);b+=k;
     o.set(px,py,pz);d.set(dx/dd,dy/dd,dz/dd);ray.set(o,d);if(!bvh.raycastFirst(ray,2,0,dd-.03))a+=k;}
    occ+=a/CFG.lampSamples;ref+=b/CFG.lampSamples;}
   const [t1,t2]=basis(n);let ao=0;for(let q=0;q<CFG.aoSamples;q++){const u1=(q+hash(t*3+q))/CFG.aoSamples,u2=hash(t*11+q*7),rr=Math.sqrt(u1),ph=6.2831853*u2,x=rr*Math.cos(ph),y=rr*Math.sin(ph),zz=Math.sqrt(Math.max(0,1-u1));
    d.set(t1[0]*x+t2[0]*y+n[0]*zz,t1[1]*x+t2[1]*y+n[1]*zz,t1[2]*x+t2[2]*y+n[2]*zz);o.set(px,py,pz);ray.set(o,d);if(bvh.raycastFirst(ray,2,0,CFG.aoDist))ao++;}
   out[r]=occ;out[r+1]=ref;out[r+2]=ao/CFG.aoSamples;
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
 const st=mode==='direct'?7:3,out=new Float32Array(N*st);let k=0;for(const p of parts){out.set(p,k);k+=p.length;}return out;}
async function main(){const t0=Date.now(),sc=await buildScene(),G=geometry(sc),PT=samples(sc),N=PT.length/4;
 console.log('surfaces',sc.surf.length,'out',sc.surf.filter(s=>s.out).length,'texels',N,'lamps',sc.lamps.length,'walls',sc.walls.length,'tris',G.SID.length);
 const dir=await pass(sc,G,PT,'direct');console.log('direct',((Date.now()-t0)/1e3).toFixed(1)+'s');
 const fl=sc.surf[0];let m=0,c=0;for(let k=fl.k0;k<fl.k0+fl.nu*fl.nv;k++)if(PT[k*4+3]){m+=dir[k*7+1];c++;}const amb=CFG.ambient*m/c;
 const Dl=new Float32Array(N*3);for(let k=0;k<N;k++)for(let ch=0;ch<3;ch++)Dl[k*3+ch]=dir[k*7]+amb*(1-.8*dir[k*7+2]);
 let E=Dl;for(let b=0;b<CFG.bounces;b++){const g=await pass(sc,G,PT,'gi',E),En=new Float32Array(N*3);for(let i=0;i<En.length;i++)En[i]=Dl[i]+g[i]*CFG.giGain;E=En;console.log('bounce',b+1,((Date.now()-t0)/1e3).toFixed(1)+'s');}
 // reference = what the runtime light field gives: unoccluded troffers + flat ambient + an unshadowed bounce of the same mean
 const meanGI=(()=>{let s=0,c=0;for(let k=0;k<N;k++)if(PT[k*4+3]){s+=E[k*3+1]-Dl[k*3+1];c++;}return s/c;})();
 const F=new Float32Array(N*3),ok=new Uint8Array(N);
 for(let k=0;k<N;k++){if(!PT[k*4+3])continue;ok[k]=1;const ref=dir[k*7+1]+amb+meanGI,f=[0,1,2].map(ch=>E[k*3+ch]/ref),lu=.3*f[0]+.59*f[1]+.11*f[2];
  for(let ch=0;ch<3;ch++)F[k*3+ch]=Math.min(CFG.clamp[1],Math.max(CFG.clamp[0],lu+(f[ch]-lu)*CFG.tintMix));}
 // per surface class: normalise mean to 1 (the runtime already sets overall level; the bake adds only the light's shape) + contrast
 for(const kind of ['floorR','ceilR','wall']){let sum=0,c=0;sc.surf.forEach(s=>{if(!s.out||s.kind!==kind)return;for(let k=s.k0;k<s.k0+s.nu*s.nv;k++)if(ok[k]){sum+=F[k*3]*.3+F[k*3+1]*.59+F[k*3+2]*.11;c++;}});const mean=sum/c,g=CFG.contrast[kind];
  sc.surf.forEach(s=>{if(!s.out||s.kind!==kind)return;for(let k=s.k0;k<s.k0+s.nu*s.nv;k++)if(ok[k])for(let ch=0;ch<3;ch++)F[k*3+ch]=Math.min(CFG.clamp[1],Math.max(CFG.clamp[0],Math.pow(F[k*3+ch]/mean,g)));});console.log(kind,'mean',mean.toFixed(3));}
 // neutral on troffer diffusers + the missing intro tile; fade the region border to neutral
 const R=sc.R;sc.surf.forEach(s=>{if(!s.out)return;for(let j=0;j<s.nv;j++)for(let i=0;i<s.nu;i++){const k=s.k0+j*s.nu+i;if(!ok[k])continue;const x=PT[k*4],z=PT[k*4+2];let w=1;
  if(s.kind==='ceilR'&&(sc.lamps.some(l=>Math.abs(l.x-x)<.6&&Math.abs(l.z-z)<.3)||sc.holes.some(h=>Math.abs(h.x-x)<.6&&Math.abs(h.z-z)<.3)))w=0;
  if(s.kind!=='wall'){const e=Math.min(x-R.x0,R.x1-x,z-R.z0,R.z1-z);w*=Math.max(0,Math.min(1,e/CFG.fade));}
  for(let ch=0;ch<3;ch++)F[k*3+ch]=1+(F[k*3+ch]-1)*w;}});
 // output floorR/ceilR texels: copy from the full floor/ceil (same grid size) — they were sampled themselves, nothing to do
 // dilate invalid texels from valid neighbours (per surface), then pack
 const outS=sc.surf.filter(s=>s.out&&s.kind!=='floor'&&s.kind!=='ceil');
 for(const s of outS){for(let it=0;it<6;it++){let any=false;for(let j=0;j<s.nv;j++)for(let i=0;i<s.nu;i++){const k=s.k0+j*s.nu+i;if(ok[k])continue;let a=[0,0,0],c=0;for(const[di,dj]of[[1,0],[-1,0],[0,1],[0,-1]]){const ii=i+di,jj=j+dj;if(ii<0||jj<0||ii>=s.nu||jj>=s.nv)continue;const kk=s.k0+jj*s.nu+ii;if(ok[kk]===1){for(let ch=0;ch<3;ch++)a[ch]+=F[kk*3+ch];c++;}}
   if(c){for(let ch=0;ch<3;ch++)F[k*3+ch]=a[ch]/c;ok[k]=2;any=true;}}for(let k=s.k0;k<s.k0+s.nu*s.nv;k++)if(ok[k]===2)ok[k]=1;if(!any)break;}
  for(let k=s.k0;k<s.k0+s.nu*s.nv;k++)if(!ok[k])for(let ch=0;ch<3;ch++)F[k*3+ch]=1;}
 // shelf packing: floor + ceiling each own atlas; walls shelf-packed (1 px padding) into further <=256² atlases
 const A=CFG.atlas,atlases=[],quads=[],q=1<<(8-CFG.quantBits),enc=v=>Math.min(255,Math.round(Math.max(0,v/2*255)/q)*q);
 const newAtlas=(w,h)=>{const a={w,h,px:new Uint8Array(w*h*3),x:0,y:0,row:0};atlases.push(a);return a;};
 const blit=(a,s,X,Y)=>{for(let j=-1;j<=s.nv;j++)for(let i=-1;i<=s.nu;i++){const k=s.k0+Math.min(s.nv-1,Math.max(0,j))*s.nu+Math.min(s.nu-1,Math.max(0,i)),p=((Y+j+1)*a.w+(X+i+1))*3;for(let ch=0;ch<3;ch++)a.px[p+ch]=enc(F[k*3+ch]);}
  const o=s.o.map((v,c)=>v+s.n[c]*CFG.offset);quads.push({t:atlases.indexOf(a),o:o.map(v=>+v.toFixed(4)),a:s.a.map(v=>v*s.la).map(v=>+v.toFixed(4)),b:s.b.map(v=>v*s.lb).map(v=>+v.toFixed(4)),uv:[(X+1)/a.w,(Y+1)/a.h,(X+1+s.nu)/a.w,(Y+1+s.nv)/a.h].map(v=>+v.toFixed(6))});};
 for(const s of outS.filter(s=>s.kind!=='wall')){if(s.nu+2>A||s.nv+2>A)throw new Error('floor too big for atlas');blit(newAtlas(s.nu+2,s.nv+2),s,0,0);}
 let wa=null;for(const s of outS.filter(s=>s.kind==='wall').sort((x,y)=>y.nv-x.nv||y.nu-x.nu)){const w=s.nu+2,h=s.nv+2;if(!wa)wa=newAtlas(A,A);if(wa.x+w>A){wa.x=0;wa.y+=wa.row;wa.row=0;}if(wa.y+h>A){wa=newAtlas(A,A);}blit(wa,s,wa.x,wa.y);wa.x+=w;wa.row=Math.max(wa.row,h);}
 if(wa){const used=wa.y+wa.row,nh=1<<Math.ceil(Math.log2(used));if(nh<A){const px=wa.px.slice(0,A*nh*3);for(const qd of quads)if(qd.t===atlases.indexOf(wa)){qd.uv[1]*=A/nh;qd.uv[3]*=A/nh;}wa.h=nh;wa.px=px;}}
 let st=[];for(const s of outS){let sum=0;for(let k=s.k0;k<s.k0+s.nu*s.nv;k++)sum+=F[k*3+1];st.push(sum/(s.nu*s.nv));}
 console.log('atlases',atlases.map(a=>a.w+'x'+a.h).join(' '),'quads',quads.length,'factor mean',(st.reduce((a,b)=>a+b,0)/st.length).toFixed(3),'min',F.reduce((m,v,i)=>ok[Math.floor(i/3)]?Math.min(m,v):m,9).toFixed(2));
 const js=`// Generated by tools/bake132_l0.mjs (V132-bake L0): spawn-room lightmap, 12 cm texels, ${CFG.bounces} bounces, soft troffer shadows, ${CFG.quantBits}-bit.\n// Each atlas = u8 RGB modulation (byte/255*2, 128 = neutral); each quad = o + s*a + t*b, uv=[u0,v0,u1,v1]. Off with ?bake=0.\nexport const BAKE132_L0=${JSON.stringify({atlases:atlases.map(a=>({w:a.w,h:a.h,rgb:Buffer.from(a.px).toString('base64')})),quads})};\n`;
 fs.writeFileSync(D+'level0-bake132-data.js',js);
 // debug PNG-less dump (ppm) of the atlases for a look
 atlases.forEach((a,i)=>fs.writeFileSync(`/workspace/work/spawn/bake132_atlas${i}.ppm`,Buffer.concat([Buffer.from(`P6 ${a.w} ${a.h} 255\n`),Buffer.from(a.px)])));
 console.log('wrote',(js.length/1024).toFixed(0)+' KB',((Date.now()-t0)/1e3).toFixed(1)+'s');
}
if(isMainThread)main();else kernel();
