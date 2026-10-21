// V138-retail-interiors R5: per-store light bake for the hash-generated walk-in stores.
// The stores are generated per lot as the city streams (infinite, hash-distributed), so an offline Blender pass cannot see
// them; instead each store is baked once when its block is built, on the CPU, from its own geometry:
//  · emitters = every part drawn in a lamp / LED / tube / neon / cooler-glow material (troffers, bare tubes, cooler header
//    strips and door LEDs, liquor-wall LEDs, neon signs coloured by their atlas cell, POS screens, scanners), split into
//    samples along their long axis and clustered;
//  · occluders = a 10 cm height field of everything standing on the floor (shelves, coolers, counters, stacks) plus the
//    store walls; shadows are ray-marched through it from each vertex to each emitter sample (hard per sample, soft overall);
//  · ambient = bounce constant × horizon AO from the same height field (dark corners, under-shelf contact shadow);
//  · the floor / walls / ceiling are tessellated by the shell (30–50 cm) so shadows and coloured neon pools land on them.
// Result goes into a per-vertex `bake138` attribute (rgb, linear). r138 materials are patched so that inside the store their
// emitted light = albedo × bake138 × K (K follows the material's old glow); parts outside the store (storefront, sign,
// awning) carry bake138 = −1 and keep their own look. ?r138bake=0 → flat default bake (R4 look); ?r138bake=dbg → bake only.
import * as T from './vendor/three.module.min.js';
const Q=typeof location!=='undefined'?location.search:'';
export const R138_BAKE=!/[?&]r138bake=0\b/.test(Q);
const DBG=/[?&]r138bake=dbg\b/.test(Q);
const DEFAULT=.78;
// emitter materials: [r,g,b] linear colour, strength (per m² of face or per m of strip), kind
const EM={r138lamp:[[1,.97,.9],6,'a'],r138lampFlk:[[1,.97,.9],3.6,'a'],r138laneLight:[[1,1,.95],6,'a'],r138ledW:[[.9,.96,1],1.1,'l'],r138ledA:[[1,.66,.3],1.0,'l'],
 r138tubeP:[[1,.16,.55],3.8,'l'],r138tubeB:[[.16,.6,1],3.8,'l'],r138tubeG:[[.3,1,.36],3.4,'l'],r138neon:[null,12.0,'a'],
 r138scan:[[1,.12,.06],2,'a'],r138screen:[[.25,.5,1],3,'a'],r138coolIn:[[.7,.86,1],1.8,'a']};
// neon atlas 2×4 cells (retail138-bodega NEON138): open, coldBeer, lotto, cerveza, atm, cigars, vape, 24hrs
const NEONC=[[1,.18,.12],[.15,.55,1],[.3,1,.3],[1,.5,.12],[.25,1,.45],[1,.62,.2],[.75,.25,1],[1,.2,.3]];
const CLEAR=/^r138(glass|coolGlass|lexan|glassTop|fog|basket|wire|g140[a-z]*)$/;
export function isR138Emitter(key){return key in EM;}
// ---- material patch: inside the store, emitted light = albedo × bake138 × K ----
const patched=new WeakSet();
export function patchR138Material(m){
 if(!m||patched.has(m))return;patched.add(m);
 const glow=m.emissiveMap?m.emissiveIntensity:0,K=(DBG?1:.9+.8*Math.min(.6,glow)).toFixed(3),prev=m.onBeforeCompile;
 m.onBeforeCompile=(s,r)=>{prev?.call(m,s,r);
  s.vertexShader='attribute vec3 bake138;\nvarying vec3 vBake138;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvBake138=bake138;');
  s.fragmentShader='varying vec3 vBake138;\n'+s.fragmentShader.replace('#include <emissivemap_fragment>',
   '#include <emissivemap_fragment>\nif(vBake138.r>=0.){totalEmissiveRadiance=diffuseColor.rgb*vBake138*'+K+';'+(DBG?'diffuseColor.rgb=vec3(0.);':'diffuseColor.rgb*=.12;')+'}');};
 m.customProgramCacheKey=()=>'r138bake'+K+(prev?'p':'');m.needsUpdate=true;
}
/** call at the start of retail138Task: remembers which parts exist already + the building frame */
export function retail138BakeMark(b){const n=new Map();for(const[k,p]of b.parts)n.set(k,p.length);return{n,f:{...b.frame}};}
function newParts(b,mark){const out=[];for(const[k,p]of b.parts){const s=mark.n.get(k)||0;for(let i=s;i<p.length;i++)out.push({key:k,g:p[i]});}return out;}
/** gives every new r138 part a bake138 attribute (interior default / −1 outside) and patches its material. Always called. */
export function retail138BakeDefaults(b,mark,P,{d}){
 const zf=d/2,f=mark.f,c=Math.cos(f.ry),s=Math.sin(f.ry);
 for(const{key,g}of newParts(b,mark)){if(!key.startsWith('r138')||g.attributes.bake138)continue;
  const p=g.attributes.position,n=p.count,a=new Float32Array(n*3),em=key in EM;
  for(let i=0;i<n;i++){const dx=p.getX(i)-f.x,dz=p.getZ(i)-f.z,lz=s*dx+c*dz,v=em||lz>zf-.075?-1:DEFAULT;a[i*3]=a[i*3+1]=a[i*3+2]=v;}
  g.setAttribute('bake138',new T.BufferAttribute(a,3));if(!em&&!key.startsWith('r138g140'))patchR138Material(b.mats[key]);} // V140 P2: physical door glass keeps its own lighting
}
// ---- the bake ----
export function* retail138Bake(b,mark,P,{d}){
 if(!R138_BAKE)return null;
 const t0=performance.now();let tick=performance.now();
 const zf=d/2,zb=zf-P.sd,{x0,x1,C}=P,f=mark.f,c=Math.cos(f.ry),s=Math.sin(f.ry);
 const parts=newParts(b,mark).filter(q=>q.key.startsWith('r138')&&q.g.attributes.bake138);
 const toL=(X,Y,Z,o)=>{const dx=X-f.x,dz=Z-f.z;o[0]=c*dx-s*dz;o[1]=Y-f.y;o[2]=s*dx+c*dz;return o;};
 const nL=(X,Y,Z,o)=>{o[0]=c*X-s*Z;o[1]=Y;o[2]=s*X+c*Z;return o;};
 // height field
 const G=.1,NX=Math.ceil((x1-x0)/G),NZ=Math.ceil((zf-zb)/G),H=new Float32Array(NX*NZ);
 const v=[0,0,0];
 const emit=[];
 // shelf decks: thin horizontal parts (≤4 cm) the height field cannot see; up to SLN per 10 cm cell (R5b)
 const SLN=6,SY=new Float32Array(NX*NZ*SLN),SC=new Uint8Array(NX*NZ);let slabs=0;
 for(const{key,g}of parts){
  const p=g.attributes.position,n=p.count;let a0=1e9,a1=-1e9,b0=1e9,b1=-1e9,y0=1e9,y1=-1e9;
  for(let i=0;i<n;i++){toL(p.getX(i),p.getY(i),p.getZ(i),v);if(v[0]<a0)a0=v[0];if(v[0]>a1)a1=v[0];if(v[1]<y0)y0=v[1];if(v[1]>y1)y1=v[1];if(v[2]<b0)b0=v[2];if(v[2]>b1)b1=v[2];}
  if(b0>zf-.06)continue; // storefront exterior
  const E=EM[key];
  if(E){let col=E[0];if(!col){const uv=g.attributes.uv;let u=0,w=0;for(let i=0;i<n;i++){u+=uv.getX(i);w+=uv.getY(i);}u/=n;w/=n;col=NEONC[Math.min(7,Math.floor(u*2)+2*Math.min(3,Math.floor((1-w)*4)))];}
   // facing: mean normal (zero for closed boxes = omni); thin lamp panels near the ceiling face down
   const nr=g.attributes.normal;let fx=0,fy=0,fz=0;if(nr){for(let i=0;i<n;i++){fx+=nr.getX(i);fy+=nr.getY(i);fz+=nr.getZ(i);}const q=nL(fx/n,fy/n,fz/n,[0,0,0]);fx=q[0];fy=q[1];fz=q[2];}
   const ex=a1-a0,ey=y1-y0,ez=b1-b0,dims=[ex,ey,ez].sort((p,q)=>q-p),len=Math.max(.05,dims[0]);
   if((key==='r138lamp'||key==='r138lampFlk')&&y1>C-.12&&ey<.06){fx=0;fy=-1;fz=0;}
   const fl=Math.hypot(fx,fy,fz);if(fl<.3){fx=fy=fz=0;}else{fx/=fl;fy/=fl;fz/=fl;}
   let amount=E[2]==='l'?len:Math.max(.0025,dims[0]*dims[1])*E[1];if(E[2]==='l')amount*=E[1];
   if(key==='r138lamp'&&dims[1]<.07)amount=len*(y1>C-.15?2.8:.6); // bare ceiling tubes vs cooler header / door LED strips
   const k=Math.max(1,Math.round(len/.7));
   for(let j=0;j<k;j++){const t=(j+.5)/k;const px=ex>=ez&&ex>=ey?a0+ex*t:(a0+a1)/2,py=ey>ex&&ey>=ez?y0+ey*t:(y0+y1)/2,pz=ez>ex&&ez>ey?b0+ez*t:(b0+b1)/2;
    emit.push({x:px+fx*.03,y:py+fy*.03,z:pz+fz*.03,fx,fy,fz,r:col[0],g:col[1],b:col[2],I:amount/k});}
   continue;}
  if(CLEAR.test(key))continue;
  if(y1-y0<.04){if(Math.min(a1-a0,b1-b0)>.12&&y0>.1&&y1<C-.25){slabs++;const ym=(y0+y1)/2,i0=Math.max(0,Math.floor((a0-x0)/G+.25)),i1=Math.min(NX-1,Math.floor((a1-x0)/G-.25)),j0=Math.max(0,Math.floor((b0-zb)/G+.25)),j1=Math.min(NZ-1,Math.floor((b1-zb)/G-.25));
    for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const o=j*NX+i;if(SC[o]<SLN)SY[o*SLN+SC[o]++]=ym;}}continue;}
  if(y0>.9)continue;
  // rasterise the part's footprint into the height field (top = max)
  const i0=Math.max(0,Math.floor((a0-x0)/G+.25)),i1=Math.min(NX-1,Math.floor((a1-x0)/G-.25)),j0=Math.max(0,Math.floor((b0-zb)/G+.25)),j1=Math.min(NZ-1,Math.floor((b1-zb)/G-.25));
  if(a1-a0>(x1-x0)*.9&&b1-b0>(zf-zb)*.9)continue; // floor / ceiling slabs
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const o=j*NX+i;if(y1>H[o])H[o]=y1;}
 }
 // cluster emitters on a 0.45 m grid (keeps the count bounded in neon-heavy bodegas)
 const cl=new Map();for(const e of emit){const k=Math.round(e.x/.45)+','+Math.round(e.y/.45)+','+Math.round(e.z/.45)+','+Math.round(e.fy*2)+','+Math.round(e.fx*2)+','+Math.round(e.fz*2);const q=cl.get(k);
  if(!q){cl.set(k,{...e,w:e.I,r:e.r*e.I,g:e.g*e.I,b:e.b*e.I});}else{q.x=(q.x*q.w+e.x*e.I)/(q.w+e.I);q.y=(q.y*q.w+e.y*e.I)/(q.w+e.I);q.z=(q.z*q.w+e.z*e.I)/(q.w+e.I);q.w+=e.I;q.r+=e.r*e.I;q.g+=e.g*e.I;q.b+=e.b*e.I;}}
 const L=[...cl.values()].map(q=>({x:q.x,y:q.y,z:q.z,fx:q.fx,fy:q.fy,fz:q.fz,r:q.r,g:q.g,b:q.b,R2:Math.min(42,12*q.w+1.5)}));
 const halo=L.filter(e=>e.fy<-.9&&e.y>C-.2&&e.r+e.g+e.b>1.5);
 const cIdx=(x,z)=>{const i=Math.floor((x-x0)/G),j=Math.floor((z-zb)/G);return i<0||j<0||i>=NX||j>=NZ?-1:j*NX+i;};
 // does the segment cross a shelf deck? only the first 0.8 m (horizontal) matters: beyond it the height field already blocks
 const slabHit=(px,py,pz,dx,dy,dz,hd)=>{if(!slabs)return false;const tm=Math.min(1,.8/Math.max(hd,.01)),n=Math.max(2,Math.ceil(Math.hypot(hd*tm,dy*tm)/.05));let yp=py;
  for(let k=1;k<=n;k++){const t=tm*k/n,y=py+dy*t,o=cIdx(px+dx*t,pz+dz*t);if(o>=0&&SC[o]){const lo=Math.min(yp,y),hi=Math.max(yp,y);for(let q=0;q<SC[o];q++){const sy=SY[o*SLN+q];if(sy>lo&&sy<hi)return true;}}yp=y;}return false;};
 // decks above a point (looked up slightly inside the fixture) → ambient occlusion inside shelving
 const deckOcc=(px,py,pz,nx,nz)=>{const o=cIdx(px-nx*.08,pz-nz*.08);if(o<0||!SC[o])return 1;let m=1;for(let q=0;q<SC[o];q++){const h=SY[o*SLN+q]-py;if(h>.005&&h<.7)m=Math.min(m,.38+.62*h/.7);}return m;};
 const hAt=(x,z)=>{const i=Math.floor((x-x0)/G),j=Math.floor((z-zb)/G);if(i<0||j<0||i>=NX||j>=NZ)return C+1;return H[j*NX+i];};
 const vis=(px,py,pz,e)=>{const dx=e.x-px,dz=e.z-pz,dy=e.y-py,hd=Math.hypot(dx,dz);if(slabHit(px,py,pz,dx,dy,dz,hd))return 0;if(hd<.7)return 1;
  const st=.09/hd;for(let t=Math.min(.5,.28/hd);t<1-.4/hd;t+=st){const y=py+dy*t;if(y>C-.05)break;if(hAt(px+dx*t,pz+dz*t)>y+.015)return 0;}return 1;};
 const DIR=[[1,0],[.707,.707],[0,1],[-.707,.707],[-1,0],[-.707,-.707],[0,-1],[.707,-.707]],RD=[.18,.45,1.0];
 const ao=(px,py,pz,nx,nz)=>{let o=0,w=0;for(const[dx,dz]of DIR){const fw=nx*dx+nz*dz;if(fw<-.35)continue;const ww=.6+.4*Math.max(0,fw);for(const r of RD){const hh=hAt(px+dx*r,pz+dz*r)-py;o+=ww*Math.max(0,Math.min(1,hh/(r*1.4)));w+=ww;}}return w?Math.max(.12,1-1.05*o/w):1;};
 const cache=new Map();let nv=0,hit=0;const pv=[0,0,0],nv3=[0,0,0];
 for(const{key,g}of parts){
  if(key in EM)continue;const qz=key.startsWith('r138p140')?12.5:25;/* V140 goods: 8 cm cache cells */const p=g.attributes.position,nr=g.attributes.normal,A=g.attributes.bake138.array,n=p.count;
  for(let i=0;i<n;i++){if(A[i*3]<0)continue;nv++;
   toL(p.getX(i),p.getY(i),p.getZ(i),pv);if(nr)nL(nr.getX(i),nr.getY(i),nr.getZ(i),nv3);else{nv3[0]=0;nv3[1]=1;nv3[2]=0;}
   const ck=((Math.round(pv[0]*qz)+2048)*4096+(Math.round(pv[1]*qz)+2048))*4096*125+((Math.round(pv[2]*qz)+2048)*125+(Math.round(nv3[0]*2)+2)*25+(Math.round(nv3[1]*2)+2)*5+Math.round(nv3[2]*2)+2)+(qz<20?1e15:0);
   let r=cache.get(ck);
   if(!r){const px=pv[0]+nv3[0]*.03,py=pv[1]+nv3[1]*.03,pz=pv[2]+nv3[2]*.03;
    const ceil=pv[1]>C-.1&&nv3[1]<-.7,dk=deckOcc(px,py,pz,nv3[0],nv3[2]),a=ao(px,py,pz,nv3[0],nv3[2])*dk,up=.5+.5*nv3[1];
    let R=(.07+.03*up+(ceil?.1:.2*dk)*Math.max(0,-nv3[1]))*a,Gc=R*1.0,B=R*1.02;
    // ceiling glow around each lamp (light escaping the diffuser + first bounce), the 'halo' a flat ceiling lacks
    if(ceil)for(const e of halo){const dx=e.x-px,dz=e.z-pz,d2=dx*dx+dz*dz;if(d2>4)continue;const k=.16*Math.exp(-d2/.55);R+=e.r*k;Gc+=e.g*k;B+=e.b*k;}
    for(const e of L){const dx=e.x-px,dy=e.y-py,dz=e.z-pz,d2=dx*dx+dy*dy+dz*dz;if(d2>e.R2)continue;const dl=Math.sqrt(d2),lx=dx/dl,ly=dy/dl,lz=dz/dl;
     const nd=nv3[0]*lx+nv3[1]*ly+nv3[2]*lz;if(nd<=0)continue;const ce=(e.fx||e.fy||e.fz)?Math.max(0,-(e.fx*lx+e.fy*ly+e.fz*lz)):1;if(ce<=0)continue;
     if(!vis(px,py,pz,e))continue;const fall=Math.max(0,1-d2/e.R2);const k=nd*ce*fall/(d2+.35);R+=e.r*k;Gc+=e.g*k;B+=e.b*k;}
    // filmic-ish shoulder so pools under troffers do not clip
    const EXP=P.market?.64:.72,ca=.25+.75*a*a,sh=x=>{x*=EXP*ca;return 1.5*x/(x+.8);};r=[sh(R),sh(Gc),sh(B)];cache.set(ck,r);}else hit++;
   A[i*3]=r[0];A[i*3+1]=r[1];A[i*3+2]=r[2];
   if((nv&255)===0&&performance.now()-tick>6){yield;tick=performance.now();}}
 }
 const st={kind:P.kind,h:P.h,emit:emit.length,lights:L.length,verts:nv,uniq:cache.size,slabs,ms:Math.round(performance.now()-t0)};
 if(typeof window!=='undefined')(window.__r138bake||(window.__r138bake=[])).push(st);
 return st;
}
/** tessellated quad for floor / walls / ceiling (so shadows have somewhere to land); PlaneGeometry faces +z */
export function r138GridPlane(b,key,tile,x,y,z,w,h,ry,rx,step){
 const g=new T.PlaneGeometry(w,h,Math.max(1,Math.round(w/step)),Math.max(1,Math.round(h/step))),uv=g.attributes.uv;
 if(tile)for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*w/tile,uv.getY(i)*h/tile);
 b.add(g,key,x,y,z,1,1,1,ry,rx,0,1);g.dispose();
}
