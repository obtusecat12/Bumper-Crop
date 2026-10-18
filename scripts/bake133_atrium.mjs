// V133-bake-L0atrium: offline light bake for the Level 0 bottomless atrium (level0-atrium96.js). Same CPU path tracer family
// as bake132_l27.mjs / bake133_l0pit.mjs / bake133_venue.mjs (node + three-mesh-bvh); geometry = browser dump
// (dumpBake133 in dist/venue133-bake.js, keyed by keySky133 exactly as the game does; /workspace/work/v133a/dump.js).
// Light model (absolute, three.js irradiance units):
//  - the lit Level 0 room above the opening: cosine rays that leave the dump going UP see radiance ROOM (= the realtime
//    hemisphere level 1.42 inside the atrium); rays that leave going down fall into the bottomless void (0). So the shaft
//    walls darken with depth by pure geometry (shrinking view of the opening).
//  - troffer lamps of tiers 1-6 (ATRIUM_LEVELS97 lamps): 1.09 x .46 m downward area emitters, LAMP luminance, soft shadows
//    (area samples); plus the few warm PointLights inside the atrium root.
//  - 2 diffuse bounces (albedo per mesh from the dump), contact AO folded in implicitly (shadow + bounce rays).
// Output per welded vertex: f = E / E_ref (E_ref = median E of the open top rim floor), rgb = sqrt(f / SCALE)*255, a = 0.
// Runtime (prepareSky133 with keep=1): hemisphere/ambient term *= max(floor, f).
// Run: NODE_PATH=/workspace/.cache/bake132/node_modules node --max-old-space-size=5000 tools/bake133_atrium.mjs DUMP.json OUT.js
import {Worker,isMainThread,parentPort,workerData} from 'node:worker_threads';
import fs from 'node:fs';import os from 'node:os';
import {createRequire} from 'node:module';
const require=createRequire('/workspace/.cache/bake132/');
const THREE=require('three'),{MeshBVH}=require('three-mesh-bvh');
export const CFG={SCALE:2.0,ROOM:1.42,LAMP:5.5,lampGain:.75,lampW:1.09,lampD:.46,lampRange:7,lampSamples:4,pointRadius:.08,minDist:.5,
 skySamples:24,skyDist:120,giSamples:16,giDist:40,bounces:2,maxAlbedo:.8,occAlbedo:[.35,.35,.35],fMin:.0,fMax:2.0,smooth:2,refK:Number(process.env.REFK||.5),fade:2.2};
function hash(n){n=(n^61)^(n>>>16);n=Math.imul(n,9);n^=n>>>4;n=Math.imul(n,0x27d4eb2d);n^=n>>>15;return (n>>>0)/4294967296;}
function basis(n){const s=n[2]>=0?1:-1,a=-1/(s+n[2]),b=n[0]*n[1]*a;return [[1+s*n[0]*n[0]*a,s*b,-s*n[0]],[b,s+n[1]*n[1]*a,-n[1]]];}
function makeBVH(P,I){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(P,3));g.setIndex(new THREE.BufferAttribute(I,1));return new MeshBVH(g,{maxLeafTris:6,maxDepth:60});}
function kernel(){
 const {P,N,AL,I,lamps,points,mode,E,lo,hi}=workerData;const bvh=makeBVH(P,new Uint32Array(I)),ray=new THREE.Ray(),o=new THREE.Vector3(),d=new THREE.Vector3(),tri=new THREE.Triangle(),bc=new THREE.Vector3();
 const out=new Float32Array((hi-lo)*3);
 const vis=(px,py,pz,tx,ty,tz)=>{o.set(px,py,pz);d.set(tx-px,ty-py,tz-pz);const len=d.length();if(len<.03)return 1;d.multiplyScalar(1/len);ray.set(o,d);return bvh.raycastFirst(ray,2,0,len-.03)?0:1;};
 for(let v=lo;v<hi;v++){const j=v*3,n=[N[j],N[j+1],N[j+2]],r=(v-lo)*3;if(n[0]===0&&n[1]===0&&n[2]===0)continue;
  const px=P[j]+n[0]*.012,py=P[j+1]+n[1]*.012,pz=P[j+2]+n[2]*.012;const [t1,t2]=basis(n);
  const dirq=(q,NS,s1,s2)=>{const u1=(q+hash(v*s1+q*3+9))/NS,u2=hash(v*s2+q*29+4),rr=Math.sqrt(u1),ph=6.2831853*u2,x=rr*Math.cos(ph),y=rr*Math.sin(ph),zz=Math.sqrt(Math.max(0,1-u1));
   d.set(t1[0]*x+t2[0]*y+n[0]*zz,t1[1]*x+t2[1]*y+n[1]*zz,t1[2]*x+t2[2]*y+n[2]*zz);o.set(px,py,pz);ray.set(o,d);};
  if(mode==='direct'){
   // room above the opening (sky-like), void below
   let sky=0;for(let q=0;q<CFG.skySamples;q++){dirq(q,CFG.skySamples,11,17);if(d.y<=0)continue;if(!bvh.raycastFirst(ray,2,0,CFG.skyDist))sky+=Math.min(1,d.y*3);}
   let e=CFG.ROOM*sky/CFG.skySamples,R=e,G=e,B=e;
   for(const L of lamps){const lx=L[0]-px,ly=L[1]-.1-py,lz=L[2]-pz;if(ly<=.02||ly>6||lx*lx+lz*lz>CFG.lampRange*CFG.lampRange)continue;let a=0;
    for(let q=0;q<CFG.lampSamples;q++){const sx=L[0]+((q+hash(v*7+q*3+1))/CFG.lampSamples-.5)*CFG.lampW,sz=L[2]+(hash(v*13+q*5+2)-.5)*CFG.lampD,dx=sx-px,dy=L[1]-.1-py,dz=sz-pz,dd=Math.hypot(dx,dy,dz);
     const ns=(n[0]*dx+n[1]*dy+n[2]*dz)/dd;if(ns<=0)continue;const k=ns*(dy/dd)/Math.max(dd*dd,CFG.minDist*CFG.minDist);if(vis(px,py,pz,sx,L[1]-.1,sz))a+=k;}
    const k=CFG.LAMP*CFG.lampW*CFG.lampD*CFG.lampGain*a/CFG.lampSamples;R+=k;G+=k*.985;B+=k*.92;}
   for(const L of points){const lx=L.p[0]-px,ly=L.p[1]-py,lz=L.p[2]-pz,dd=Math.hypot(lx,ly,lz)||1e-4;if(L.d>0&&dd>=L.d)continue;const ndl=(n[0]*lx+n[1]*ly+n[2]*lz)/dd;if(ndl<=0)continue;
    let f=1/Math.max(dd*dd,CFG.minDist*CFG.minDist);if(L.d>0){const q=1-Math.pow(dd/L.d,4);f*=q*q;}const tx=L.p[0]+(hash(v*5+1)-.5)*2*CFG.pointRadius,ty=L.p[1]+(hash(v*9+2)-.5)*2*CFG.pointRadius,tz=L.p[2]+(hash(v*3+7)-.5)*2*CFG.pointRadius;
    const k=L.i*f*ndl*vis(px,py,pz,tx,ty,tz);R+=L.c[0]*k;G+=L.c[1]*k;B+=L.c[2]*k;}
   out[r]=R;out[r+1]=G;out[r+2]=B;
  }else{let R=0,G=0,B=0;const NS=CFG.giSamples;
   for(let q=0;q<NS;q++){dirq(q,NS,5,13);const h=bvh.raycastFirst(ray,2,0,CFG.giDist);if(!h)continue;
    const a=h.face.a,b=h.face.b,c=h.face.c;if((N[a*3]+N[b*3]+N[c*3])*d.x+(N[a*3+1]+N[b*3+1]+N[c*3+1])*d.y+(N[a*3+2]+N[b*3+2]+N[c*3+2])*d.z>0)continue;tri.a.fromArray(P,a*3);tri.b.fromArray(P,b*3);tri.c.fromArray(P,c*3);if(!tri.getBarycoord(h.point,bc)||!(bc.x>=-1e-3&&bc.y>=-1e-3&&bc.z>=-1e-3))continue;
    R+=AL[a*3]*E[a*3]*bc.x+AL[b*3]*E[b*3]*bc.y+AL[c*3]*E[c*3]*bc.z;G+=AL[a*3+1]*E[a*3+1]*bc.x+AL[b*3+1]*E[b*3+1]*bc.y+AL[c*3+1]*E[c*3+1]*bc.z;B+=AL[a*3+2]*E[a*3+2]*bc.x+AL[b*3+2]*E[b*3+2]*bc.y+AL[c*3+2]*E[c*3+2]*bc.z;}
   out[r]=R/NS;out[r+1]=G/NS;out[r+2]=B/NS;}
 }
 parentPort.postMessage(out,[out.buffer]);
}
async function runPass(sc,mode,E){const W=Math.max(1,os.cpus().length),step=Math.ceil(sc.nv/W);
 const parts=await Promise.all(Array.from({length:W},(_,w)=>new Promise((res,rej)=>{const lo=w*step,hi=Math.min(sc.nv,lo+step);
  const wk=new Worker(new URL(import.meta.url),{workerData:{P:sc.P,N:sc.N,AL:sc.AL,I:sc.I,lamps:sc.lamps,points:sc.points,mode,E,lo,hi}});wk.on('message',res);wk.on('error',rej);})));
 const out=new Float32Array(sc.nv*3);let k=0;for(const p of parts){out.set(p,k);k+=p.length;}return out;}
const dec=(s,K)=>{const b=Buffer.from(s,'base64');return new K(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));};
const FMT=Number(process.env.FMT||2); // 2 = luminance f + a=0 (half the size), 4 = rgb
async function main(){
 const [dumpPath,outPath]=process.argv.slice(2);const t0=Date.now(),D=JSON.parse(fs.readFileSync(dumpPath,'utf8'));
 const parts=[...D.meshes.map(m=>({...m,bake:true})),...D.occ.filter(o=>!/glass|halo|glow|beam|emit/i.test(o.name||'')).map(o=>({...o,albedo:CFG.occAlbedo}))];
 let nv=0,ni=0;for(const m of parts){m.Pf=dec(m.P,Float32Array);m.Nf=dec(m.N,Float32Array);m.If=dec(m.I,Uint32Array);m.v0=nv;nv+=m.count;ni+=m.If.length;delete m.P;delete m.N;delete m.I;}
 const P=new Float32Array(nv*3),N=new Float32Array(nv*3),AL=new Float32Array(nv*3),I=new Uint32Array(ni);let k=0;
 for(const m of parts){P.set(m.Pf,m.v0*3);N.set(m.Nf,m.v0*3);const a=m.albedo.map(x=>Math.min(CFG.maxAlbedo,Math.max(0,x)));for(let i=0;i<m.count;i++)AL.set(a,(m.v0+i)*3);for(let i=0;i<m.If.length;i++)I[k++]=m.v0+m.If[i];}
 const lamps=D.lamps.filter(l=>l[3]>=1&&l[3]<=6),points=D.lights.filter(l=>l.type==='PointLight');
 const sc={P,N,AL,I,nv,lamps,points};console.log('verts',nv,'tris',ni/3,'parts',parts.length,'lamps',lamps.length,'points',points.length);
 const cache=process.env.ECACHE||'/workspace/work/v133a/E.bin';let E;
 if(process.env.POST&&fs.existsSync(cache)){E=new Float32Array(fs.readFileSync(cache).buffer.slice(0));console.log('E from cache');}else{
 const Dl=await runPass(sc,'direct',null);console.log('direct',((Date.now()-t0)/1e3).toFixed(1)+'s');
 E=Dl;for(let b=0;b<CFG.bounces;b++){const g=await runPass(sc,'gi',E),En=new Float32Array(nv*3);for(let i=0;i<En.length;i++)En[i]=Dl[i]+(Number.isFinite(g[i])?g[i]:0);E=En;console.log('bounce',b+1,((Date.now()-t0)/1e3).toFixed(1)+'s');}
 for(let pass=0;pass<CFG.smooth;pass++){const acc=new Float32Array(nv*3),nb=new Float32Array(nv);for(let i=0;i<I.length;i+=3)for(let e=0;e<3;e++){const a=I[i+e];for(let f=1;f<3;f++){const b=I[i+(e+f)%3];for(let c=0;c<3;c++)acc[a*3+c]+=E[b*3+c];nb[a]++;}}
  for(let v=0;v<nv;v++)if(nb[v])for(let c=0;c<3;c++)E[v*3+c]=E[v*3+c]*.6+acc[v*3+c]/nb[v]*.4;}
 fs.writeFileSync(cache,Buffer.from(E.buffer));}
 // reference: an open up-facing point that sees the whole lit room above (= the realtime hemisphere level). The walking
 // plane (rim, y >= 0) stays neutral (lit by the Level 0 light field), fading into the bake over CFG.fade m below it.
 {const tiers=new Map();for(let v=0;v<nv;v++){const y=P[v*3+1],t=Math.round(-y/3.36);const key=(N[v*3+1]>.9?'floor':Math.abs(N[v*3+1])<.2?'wall':'ceil')+t;if(t>12)continue;let a=tiers.get(key);if(!a)tiers.set(key,a=[]);if(v%7===0)a.push(E[v*3+1]);}
  const med=a=>{a.sort((x,y)=>x-y);return a.length?a[a.length>>1].toFixed(3):'-';};console.log('median E by tier',[...tiers.entries()].sort().map(([k,a])=>k+':'+med(a)).join(' '));}
 const Eref=CFG.ROOM*CFG.refK;console.log('Eref',Eref.toFixed(3));
 const fz=v=>{const y=P[v*3+1],t=Math.max(0,Math.min(1,-y/CFG.fade));return t*t*(3-2*t);};
 const res={},hist=new Array(10).fill(0);let cnt=0;
 for(const m of parts){if(!m.bake)continue;const u=new Uint8Array(m.count*4);
  for(let i=0;i<m.count;i++){const v=m.v0+i;for(let c=0;c<3;c++){const w=fz(v),f=Math.min(CFG.fMax,Math.max(CFG.fMin,1+(E[v*3+c]/Eref-1)*w));u[i*4+c]=Math.min(255,Math.round(Math.sqrt(f/CFG.SCALE)*255));if(c===1){hist[Math.min(9,Math.floor(f*5))]++;cnt++;}}u[i*4+3]=0;}
  if(FMT===2){const u2=new Uint8Array(m.count*2);for(let i=0;i<m.count;i++){const v=m.v0+i,w=fz(v),l=Math.min(CFG.fMax,Math.max(CFG.fMin,1+((.2126*E[v*3]+.7152*E[v*3+1]+.0722*E[v*3+2])/Eref-1)*w));u2[i*2]=Math.min(255,Math.round(Math.sqrt(l/CFG.SCALE)*255));u2[i*2+1]=0;}res[m.key]=Buffer.from(u2).toString('base64');continue;}
  res[m.key]=Buffer.from(u).toString('base64');}
 console.log('f histogram (0.2 bins)',hist.map(h=>(h/cnt*100).toFixed(1)).join(' '));
 fs.writeFileSync(outPath,`// Generated by tools/bake133_atrium.mjs (V133-bake-L0atrium): bottomless-atrium light bake (room above + tier lamps with soft shadows, ${CFG.bounces} bounces).\n// Key = keySky133 key; value = base64 u8 rgba per weld133 vertex: FMT2 (default): 2 bytes (sqrt(f/2), 0); FMT4: rgb = sqrt(f/2), a = 0 (f = E / open rim floor). Applied by level0-atrium-bake133.js; off with ?bake=0.\nexport const ATRIUM_BAKE133=${JSON.stringify(res)};\n`);
 console.log('wrote',outPath,(fs.statSync(outPath).size/1e6).toFixed(2)+'MB',((Date.now()-t0)/1e3).toFixed(1)+'s');
}
if(isMainThread)main();else kernel();
