// V132-bake: offline GI vertex-light baker for L27 (self-written; Blender has no linux-arm64 build for this sandbox).
// Rebuilds the same static geometry the runtime builds (shell, masonry stair, flowstone curtains, spikes, platform floor),
// path-traces direct spot light with soft shadows + 2 diffuse bounces + AO-weighted fill, writes dist/level27-bake132.js.
// Run: NODE_PATH=/workspace/.cache/bake132/node_modules node tools/bake132_l27.mjs   (deps: three-mesh-bvh MIT, three MIT)
// Values use the same units as level27-light131 bakeAt (shader: emissive = albedo * bake * 2).
import {Worker,isMainThread,parentPort,workerData} from 'node:worker_threads';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire('/workspace/.cache/bake132/');
const D='/workspace/projects/536c6175-2b91-4d1e-8d3d-28210d8dbdd7/bc/dist/';
// ---- bake config (edit + re-run to re-bake) ----
export const CFG={
 spotGain:{hero:2.3,pale:2.1,cascade:1.5,stair:1.3,annex:2.0}, // flowstone spots brighter (user: flowstone not bright enough)
 lightRadius:.10,shadowSamples:8,giSamples:40,bounces:2,giGain:1.5,
 aoDist:.6,warm:[.085,.060,.040],cool:[.040,.075,.125],
 albedo:{rock:[.15,.105,.068],calc:[.62,.57,.48],stone:[.32,.27,.21],flow:[.70,.65,.56],floor:[.24,.20,.16]},
 quantBits:6
};
const THREE=require('three'),{MeshBVH}=require('three-mesh-bvh');
async function buildScene(){
 const T=await import(D+'vendor/three.module.min.js');
 const {mergeGeometries}=await import(D+'vendor/BufferGeometryUtils.js');
 const {SPRING_SHELL:S}=await import(D+'level27-shell-data.js?v=131');
 const C=await import(D+'level27-cliff131.js?v=131');
 const L=await import(D+'level27-layout.js?v=131');
 const unpack=(s,K)=>{const b=Buffer.from(s,'base64');return new K(b.buffer,b.byteOffset,b.byteLength/K.BYTES_PER_ELEMENT);};
 const q=unpack(S.vertices,Int16Array),p=new Float32Array(q.length);for(let i=0;i<q.length;i++)p[i]=q[i]/S.scale;
 const shell=new T.BufferGeometry();shell.setAttribute('position',new T.BufferAttribute(p,3));shell.setIndex(new T.BufferAttribute(new Uint32Array(unpack(S.indices,Uint32Array)),1));
 const qn=unpack(S.normals,Int16Array);shell.setAttribute('normal',new T.Float32BufferAttribute(Array.from(qn,v=>v/16000),3));
 C.prepareShell131(shell,unpack(S.bake,Uint8Array));
 const stair=mergeGeometries(C.buildStair131());if(!stair.attributes.normal)stair.computeVertexNormals();
 const f=C.buildFlowstone131(),uv0=g=>{g.deleteAttribute('uv');g.setAttribute('uv',new T.BufferAttribute(new Float32Array(g.attributes.position.count*2),2));return g;};
 const curtains=mergeGeometries(f.curtains.map(uv0)),spikes=mergeGeometries(f.spikes.map(uv0));
 // platform floor: same construction as level27-scene.js
 const {poolFloor,radialLimit,inAnnex}=L,inPoolGrid=(x,z)=>Math.hypot(x,z)<=radialLimit(x,z)+.065;
 function geoGrid(cols,rows,point,skip){const p=[],uv=[],idx=[];for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){const q=point(i/cols,j/rows);p.push(...q.slice(0,3));uv.push(...q.slice(3,5));}for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){if(skip((i+.5)/cols,(j+.5)/rows))continue;const a=j*(cols+1)+i,b=a+cols+1;idx.push(a,b,a+1,a+1,b,b+1);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;}
 const floor=geoGrid(120,84,(u,v)=>{const x=1.6+u*5.6,z=-2.6+v*5.9;return[x,poolFloor(x||.0001,z||.0001)+.004,z,x*.67,z*.67];},(u,v)=>{const x=1.6+u*5.6,z=-2.6+v*5.9;return inPoolGrid(x,z)||!inAnnex(x,z,-.08);}).toNonIndexed();
 const calcOf=g=>g.attributes.calc;
 const A=CFG.albedo,mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
 return [
  {name:'shell',g:shell,boost:1,alb:i=>mix(A.rock,A.calc,calcOf(shell).getX(i))},
  {name:'stair',g:stair,boost:1.1,alb:()=>A.stone},
  {name:'curtains',g:curtains,boost:.9,alb:()=>A.flow},
  {name:'spikes',g:spikes,boost:1.0,alb:()=>mix(A.rock,A.calc,.55)},
  {name:'floor',g:floor,boost:1.15,alb:()=>A.floor}
 ];
}
function combine(meshes){
 let nv=0,ni=0;for(const m of meshes){m.v0=nv;nv+=m.g.attributes.position.count;ni+=m.g.index?m.g.index.count:m.g.attributes.position.count;}
 const P=new Float32Array(nv*3),N=new Float32Array(nv*3),AL=new Float32Array(nv*3),I=new Uint32Array(ni);let k=0;
 for(const m of meshes){const p=m.g.attributes.position,n=m.g.attributes.normal,c=p.count;
  for(let i=0;i<c;i++){const j=(m.v0+i)*3;P[j]=p.getX(i);P[j+1]=p.getY(i);P[j+2]=p.getZ(i);let x=n.getX(i),y=n.getY(i),z=n.getZ(i),l=Math.hypot(x,y,z)||1;N[j]=x/l;N[j+1]=y/l;N[j+2]=z/l;const a=m.alb(i);AL[j]=a[0];AL[j+1]=a[1];AL[j+2]=a[2];}
  if(m.g.index)for(let i=0;i<m.g.index.count;i++)I[k++]=m.v0+m.g.index.getX(i);else for(let i=0;i<c;i++)I[k++]=m.v0+i;}
 return {P,N,AL,I,nv};
}
function makeBVH(P,I){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(P,3));g.setIndex(new THREE.BufferAttribute(I,1));return new MeshBVH(g,{maxLeafTris:6});}
// ---- worker kernels ----
function hash(n){n=(n^61)^(n>>>16);n=Math.imul(n,9);n^=n>>>4;n=Math.imul(n,0x27d4eb2d);n^=n>>>15;return (n>>>0)/4294967296;}
function basis(n){const s=n[2]>=0?1:-1,a=-1/(s+n[2]),b=n[0]*n[1]*a;return [[1+s*n[0]*n[0]*a,s*b,-s*n[0]],[b,s+n[1]*n[1]*a,-n[1]]];}
const sst=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
function kernel(){
 const {P,N,AL,I,spots,mode,E,lo,hi}=workerData;const bvh=makeBVH(P,I),ray=new THREE.Ray(),o=new THREE.Vector3(),d=new THREE.Vector3(),tri=new THREE.Triangle(),bc=new THREE.Vector3();
 const out=new Float32Array((hi-lo)*(mode==='direct'?4:3));
 for(let v=lo;v<hi;v++){const j=v*3,n=[N[j],N[j+1],N[j+2]],px=P[j]+n[0]*.012,py=P[j+1]+n[1]*.012,pz=P[j+2]+n[2]*.012,r=(v-lo)*(mode==='direct'?4:3);
  if(mode==='direct'){let R=0,G=0,B=0;
   for(const s of spots){const lx=s.p[0]-px,ly=s.p[1]-py,lz=s.p[2]-pz,dd=Math.hypot(lx,ly,lz)||1e-4,ux=lx/dd,uy=ly/dd,uz=lz/dd;
    // two-sided: thin double-sided meshes (curtains) take light on either face
    let ndl=n[0]*ux+n[1]*uy+n[2]*uz;if(ndl<0)continue;
    const ax=s.t[0]-s.p[0],ay=s.t[1]-s.p[1],az=s.t[2]-s.p[2],al=Math.hypot(ax,ay,az),cone=sst(s.cos0,s.cos1,-(ux*ax+uy*ay+uz*az)/al);if(cone<=0)continue;
    const k=ndl*cone*s.power/(1+dd*dd*1.1)*(1-sst(s.range*.6,s.range,dd));if(k<1e-4)continue;
    let vis=0;for(let q=0;q<CFG.shadowSamples;q++){const h1=hash(v*97+q*13+1),h2=hash(v*31+q*7+2),h3=hash(v*17+q*5+3);
     const tx=s.p[0]+(h1-.5)*2*CFG.lightRadius,ty=s.p[1]+(h2-.5)*2*CFG.lightRadius,tz=s.p[2]+(h3-.5)*2*CFG.lightRadius;
     o.set(px,py,pz);d.set(tx-px,ty-py,tz-pz);const len=d.length();d.multiplyScalar(1/len);ray.set(o,d);const hit=bvh.raycastFirst(ray,2,0,len-.02);if(!hit)vis++;}
    const kk=k*vis/CFG.shadowSamples;R+=s.c[0]*kk;G+=s.c[1]*kk;B+=s.c[2]*kk;}
   // ambient occlusion (for the fill terms)
   const [t1,t2]=basis(n);let occ=0;const NA=16;
   for(let q=0;q<NA;q++){const u1=(q+hash(v*3+q))/NA,u2=hash(v*7+q*11),rr=Math.sqrt(u1),ph=6.2831853*u2,x=rr*Math.cos(ph),y=rr*Math.sin(ph),zz=Math.sqrt(Math.max(0,1-u1));
    d.set(t1[0]*x+t2[0]*y+n[0]*zz,t1[1]*x+t2[1]*y+n[1]*zz,t1[2]*x+t2[2]*y+n[2]*zz);o.set(px,py,pz);ray.set(o,d);if(bvh.raycastFirst(ray,2,0,CFG.aoDist))occ++;}
   out[r]=R;out[r+1]=G;out[r+2]=B;out[r+3]=occ/NA;
  }else{let R=0,G=0,B=0;const [t1,t2]=basis(n),NS=CFG.giSamples;
   for(let q=0;q<NS;q++){const u1=(q+hash(v*5+q*3+9))/NS,u2=hash(v*13+q*29+4),rr=Math.sqrt(u1),ph=6.2831853*u2,x=rr*Math.cos(ph),y=rr*Math.sin(ph),zz=Math.sqrt(Math.max(0,1-u1));
    d.set(t1[0]*x+t2[0]*y+n[0]*zz,t1[1]*x+t2[1]*y+n[1]*zz,t1[2]*x+t2[2]*y+n[2]*zz);o.set(px,py,pz);ray.set(o,d);const h=bvh.raycastFirst(ray,2,0,30);if(!h)continue;
    const a=h.face.a,b=h.face.b,c=h.face.c;tri.a.fromArray(P,a*3);tri.b.fromArray(P,b*3);tri.c.fromArray(P,c*3);tri.getBarycoord(h.point,bc);
    for(let ch=0;ch<3;ch++){const L=AL[a*3+ch]*E[a*3+ch]*bc.x+AL[b*3+ch]*E[b*3+ch]*bc.y+AL[c*3+ch]*E[c*3+ch]*bc.z;if(ch===0)R+=L;else if(ch===1)G+=L;else B+=L;}}
   out[r]=R/NS;out[r+1]=G/NS;out[r+2]=B/NS;}
 }
 parentPort.postMessage(out,[out.buffer]);
}
async function runPass(sc,spots,mode,E){
 const W=2,step=Math.ceil(sc.nv/W);const parts=await Promise.all(Array.from({length:W},(_,w)=>new Promise((res,rej)=>{const lo=w*step,hi=Math.min(sc.nv,lo+step);
  const wk=new Worker(new URL(import.meta.url),{workerData:{P:sc.P,N:sc.N,AL:sc.AL,I:sc.I,spots,mode,E,lo,hi}});wk.on('message',res);wk.on('error',rej);})));
 const st=mode==='direct'?4:3,out=new Float32Array(sc.nv*st);let k=0;for(const p of parts){out.set(p,k);k+=p.length;}return out;
}
async function main(){
 const t0=Date.now();const meshes=await buildScene(),sc=combine(meshes);
 const {BAKE_SPOTS}=await import(D+'level27-light131.js?v=131');
 const spots=BAKE_SPOTS.map(s=>({...s,power:s.power*(CFG.spotGain[s.id]??1)}));
 console.log('verts',sc.nv,'tris',sc.I.length/3,'meshes',meshes.map(m=>m.name+':'+m.g.attributes.position.count).join(' '));
 const dir=await runPass(sc,spots,'direct',null);console.log('direct',((Date.now()-t0)/1e3).toFixed(1)+'s');
 const Dl=new Float32Array(sc.nv*3),AO=new Float32Array(sc.nv);for(let v=0;v<sc.nv;v++){Dl.set(dir.subarray(v*4,v*4+3),v*3);AO[v]=dir[v*4+3];}
 let E=Dl;for(let b=0;b<CFG.bounces;b++){const g=await runPass(sc,spots,'gi',E);const En=new Float32Array(sc.nv*3);for(let i=0;i<En.length;i++)En[i]=Dl[i]+g[i]*CFG.giGain;E=En;console.log('bounce',b+1,((Date.now()-t0)/1e3).toFixed(1)+'s');}
 // fill: warm base on open up-facing faces, cool only in occluded cracks (photo: blue in the folds)
 for(let v=0;v<sc.nv;v++){const up=.55+.45*sc.N[v*3+1],ao=AO[v];for(let c=0;c<3;c++)E[v*3+c]+=CFG.warm[c]*up*(1-ao*.7)+CFG.cool[c]*sst(.25,.85,ao);}
 // light smoothing on indexed shell (one neighbour-average pass at 30 %), then PS1 quantize
 const sh=meshes[0],idx=sh.g.index.array,cnt=sh.g.attributes.position.count,acc=new Float32Array(cnt*3),nb=new Float32Array(cnt);
 for(let i=0;i<idx.length;i+=3)for(let e=0;e<3;e++){const a=idx[i+e];for(let f=1;f<3;f++){const b=idx[i+(e+f)%3];for(let c=0;c<3;c++)acc[a*3+c]+=E[b*3+c];nb[a]++;}}
 for(let v=0;v<cnt;v++)if(nb[v])for(let c=0;c<3;c++)E[v*3+c]=E[v*3+c]*.7+acc[v*3+c]/nb[v]*.3;
 const q=1<<(8-CFG.quantBits),res={};let stats=[];
 for(const m of meshes){const c=m.g.attributes.position.count,u=new Uint8Array(c*3);let s=0;
  for(let i=0;i<c*3;i++){const val=E[(m.v0)*3+i]/m.boost/2*255;s+=E[m.v0*3+i];u[i]=Math.min(255,Math.round(Math.max(0,val)/q)*q);}
  res[m.name]={count:c,bake:Buffer.from(u).toString('base64')};stats.push(m.name+' mean '+(s/c/3).toFixed(3));}
 console.log(stats.join(' | '));
 fs.writeFileSync(D+'level27-bake132.js',`// Generated by tools/bake132_l27.mjs (V132-bake): offline GI vertex light (direct soft shadows + ${CFG.bounces} bounces + AO fill), ${CFG.quantBits}-bit quantised.\n// Per mesh: u8 RGB, same encoding as bakeGeometry131 (value = byte/255, shader x2). Off with ?bake=0.\nexport const BAKE132=${JSON.stringify(res)};\n`);
 console.log('wrote',((Date.now()-t0)/1e3).toFixed(1)+'s');
}
if(isMainThread)main();else kernel();
