// V135-capital ②c-2: per-cell geometry LOD for the fixed capital fabric (UE5 World Partition style).
// The fixed L11 fabric is built as big material batches that span up to 5 city cells (112 m). After the bake keying is done
// (capital135-stream.js), every baked mesh is split per cell by triangle centroid — the same partition the offline HLOD
// bake uses (bc/scripts/bake135/hlod135.py) — into child meshes that SHARE the parent's vertex attributes (so the per-cell
// bake fill, materials, fog/shadow patches all keep working) and own only an index subset. The parent draws nothing
// (drawRange 0) but stays the owner, so any system that hides/moves it still hides/moves its cell children.
// Cells far from the player switch to their HLOD proxy: 1 mesh, 1 Lambert material, 1 draw (Blender merge + Decimate +
// Cycles albedo×AO atlas, dist/capital135/hlod). Near ≤ NEAR m (rect distance) full detail; back to HLOD past FAR m (hysteresis).
// A cell is only switched to HLOD once its proxy is loaded, so nothing ever pops out. ?hlod135=0 = off (old behaviour).
// ②c-2b: switches cross-fade over FADE s with a 4×4 ordered dither on the HLOD proxy (drawn in front with polygon offset, so it
// covers the full detail while it dithers in/out; the full-detail side uses shared materials and stays opaque). Cells that sit
// in HLOD past UNLOAD m for HOLD s really free their full-detail GPU buffers (geometry.dispose — whole meshes, and split
// parents once every one of their cells is unloaded); CPU arrays stay, so coming back re-uploads, one cell per frame.
import * as T from './vendor/three.module.min.js';
const NEAR=150,FAR=190,UNLOAD=250,HOLD=2000,FADE=400,SLICE=3,GLASS=/glass|window|pane|glaze/i;
export function hlod135Enabled(){return !/[?&](hlod135|stream)=0\b/.test(globalThis.location?.search||'');}
export function createCapitalLOD(prep,{roots,index,base,worldToCity,B=112,onChange=()=>{},parent}){ // parent = the exit root (origin-rebased: positions here are root-local = absolute world)
 const cells=new Map();for(const[k,v]of Object.entries(index)){const[ix,iz]=k.split(',').map(Number);cells.set(k,{id:k,ix,iz,...v,mode:'full',parts:[],hlod:null,loading:false,f:0,t0:0,unl:false});}
 const st={split:false,splitting:false,meshes:0,children:0,whole:0,hlodShown:0,hlodLoaded:0,ms:0,switches:0,unloaded:0,freedMB:0,restores:0};const parents=new Map(),gref=new Map();
 const group=new T.Group();group.name='Capital HLOD135';group.userData.noBake133=true;parent.add(group);
 let job=null;const tmp=new T.Vector3(),cp={x:0,z:0},inv=new T.Matrix4(),ml=new T.Matrix4();
 const cellOf=(x,z)=>{worldToCity(x,z,cp);return Math.floor(cp.x/B)+','+Math.floor(cp.z/B);};
 function* splitter(){const t0=performance.now();let t=t0;const seen=new Set(prep.list.map(e=>e.mesh)),list=[...seen];
  for(const r of roots)r?.traverse(o=>{if(o.isMesh&&o.geometry)gref.set(o.geometry,(gref.get(o.geometry)||0)+1);});
  for(const r of roots)r?.traverse(o=>{if(o.isMesh&&!seen.has(o)&&!o.isInstancedMesh&&!o.isSkinnedMesh&&(GLASS.test(o.name||'')||GLASS.test(o.material?.name||''))){seen.add(o);list.push(o);}});
  for(const o of list){const g=o.geometry,p=g?.attributes?.position;if(!p||Array.isArray(o.material)||o.isInstancedMesh||o.isSkinnedMesh||o.userData.capital135)continue;
   o.updateMatrixWorld(true);parent.updateMatrixWorld(true);inv.copy(parent.matrixWorld).invert();ml.multiplyMatrices(inv,o.matrixWorld);const m=ml.elements,I=g.index?.array,nt=Math.floor((I?I.length:p.count)/3),arr=p.array,s=p.itemSize,off=p.offset||0,isI=p.isInterleavedBufferAttribute;
   if(!nt)continue;const by=new Map();
   for(let f=0;f<nt;f++){let x=0,z=0;for(let j=0;j<3;j++){const v=I?I[f*3+j]:f*3+j;let px,py,pz;if(isI){px=p.getX(v);py=p.getY(v);pz=p.getZ(v);}else{const q=v*s;px=arr[q];py=arr[q+1];pz=arr[q+2];}
     x+=m[0]*px+m[4]*py+m[8]*pz+m[12];z+=m[2]*px+m[6]*py+m[10]*pz+m[14];}
    const k=cellOf(x/3,z/3),c=cells.has(k)?k:'*';let a=by.get(c);if(!a)by.set(c,a=[]);a.push(f);
    if((f&2047)===2047&&performance.now()-t>SLICE){yield;t=performance.now();}}
   st.meshes++;o.userData.capital135=true;
   if(by.size===1){const k=[...by.keys()][0];if(k!=='*'){cells.get(k).parts.push({o,whole:true,mask:o.layers.mask});st.whole++;}continue;}
   const pr={o,kids:[],star:by.has('*'),mask:o.layers.mask,off:false};parents.set(o,pr);
   for(const[k,fs]of by){const n=fs.length*3,ix=new(p.count>65535?Uint32Array:Uint16Array)(n);
    for(let i=0;i<fs.length;i++){const f=fs[i];for(let j=0;j<3;j++)ix[i*3+j]=I?I[f*3+j]:f*3+j;}
    const gc=new T.BufferGeometry();for(const[nm,a]of Object.entries(g.attributes))gc.setAttribute(nm,a);for(const[nm,a]of Object.entries(g.morphAttributes))gc.morphAttributes[nm]=a;
    gc.setIndex(new T.BufferAttribute(ix,1));const bb=new T.Box3();for(let i=0;i<n;i++){tmp.fromBufferAttribute(p,ix[i]);bb.expandByPoint(tmp);}gc.boundingBox=bb;gc.boundingSphere=bb.getBoundingSphere(new T.Sphere());
    const ch=new T.Mesh(gc);Object.defineProperty(ch,'material',{get:()=>o.material,set:()=>{},configurable:true});
    ch.name=o.name+' #'+k;ch.castShadow=o.castShadow;ch.receiveShadow=o.receiveShadow;ch.renderOrder=o.renderOrder;ch.frustumCulled=o.frustumCulled;ch.layers.mask=o.layers.mask;ch.userData.capital135Part=true;ch.userData.noBake133=true;
    ch.onBeforeRender=o.onBeforeRender;ch.onAfterRender=o.onAfterRender;o.add(ch);st.children++;if(k!=='*'){cells.get(k).parts.push({o:ch,whole:false,pr});pr.kids.push({ch,c:cells.get(k)});}
    if(performance.now()-t>SLICE){yield;t=performance.now();}}
   g.setDrawRange(0,0);}
  st.split=true;st.ms=Math.round(performance.now()-t0);console.info('[capital135] lod split',st.meshes,'meshes →',st.children,'cell parts +',st.whole,'whole,',st.ms,'ms');}
 const bytes=g=>{let b=0;const seen=new Set();for(const a of[...Object.values(g.attributes),g.index])if(a){const arr=a.array||a.data?.array;if(arr&&!seen.has(arr)){seen.add(arr);b+=arr.byteLength;}}return b;};
 function setFull(c,on){for(const q of c.parts){if(q.whole)q.o.layers.mask=on?q.mask:0;else q.o.visible=on;}}
 function show(c,full,instant=false){ // full: start HLOD→full (fade the proxy out); !full: start full→HLOD (fade the proxy in)
  if(full&&c.unl)restore(c);
  setFull(c,true);if(full){c.mode=instant||!c.hlod?'full':'out';if(instant||!c.hlod)c.f=0;}else{c.mode=instant?'hlod':'in';if(instant){c.f=1;setFull(c,false);}}
  if(c.hlod){c.hlod.material.opacity=c.f;c.hlod.visible=c.f>0;}c.t0=performance.now();st.switches++;onChange(c);}
 function fadeStep(c,now,dt){if(c.mode!=='in'&&c.mode!=='out')return;c.f=Math.min(1,Math.max(0,c.f+(c.mode==='in'?1:-1)*dt/FADE));
  if(c.mode==='in'&&c.f>=1){c.mode='hlod';setFull(c,false);c.t0=now;}else if(c.mode==='out'&&c.f<=0){c.mode='full';}
  if(c.hlod){c.hlod.material.opacity=c.f;c.hlod.visible=c.f>0;}}
 const mb=()=>{st.freedMB=+(st.freedB/1048576).toFixed(2);};st.freedB=0;
 function unload(c){c.unl=true;st.unloaded++;c.wb=0;
  for(const q of c.parts){if(q.whole){if((gref.get(q.o.geometry)||0)<=1){c.wb+=bytes(q.o.geometry);q.o.geometry.dispose();}}
   else{const pr=q.pr;if(pr.off||pr.star)continue;if(pr.kids.every(k=>k.c.unl)){pr.off=true;pr.o.layers.mask=0;pr.b=bytes(pr.o.geometry);for(const k of pr.kids){pr.b+=k.ch.geometry.index.array.byteLength;k.ch.geometry.dispose();}pr.o.geometry.dispose();st.freedB+=pr.b;}}}
  st.freedB+=c.wb;mb();}
 function restore(c){c.unl=false;st.unloaded--;st.restores++;st.freedB-=c.wb||0;c.wb=0;
  for(const q of c.parts)if(!q.whole&&q.pr.off){q.pr.off=false;q.pr.o.layers.mask=q.pr.mask;st.freedB-=q.pr.b;}mb();}
 function load(c){c.loading=true;Promise.all([fetch(base+c.b).then(r=>{if(!r.ok)throw Error(r.status);return r.arrayBuffer();}),new Promise((res,rej)=>new T.TextureLoader().load(base+c.t,res,undefined,rej))]).then(([buf,tex])=>{
   const h=new Uint32Array(buf,0,2),nv=h[0],ni=h[1];const pos=new Float32Array(buf,8,nv*3),uv=new Uint16Array(buf,8+nv*12,nv*2),ix=nv<65536?new Uint16Array(buf,8+nv*16,ni):new Uint32Array(buf,8+nv*16,ni);
   const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(pos,3));g.setAttribute('uv',new T.BufferAttribute(uv,2,true));g.setIndex(new T.BufferAttribute(ix,1));g.computeBoundingSphere();
   tex.colorSpace=T.SRGBColorSpace;tex.flipY=false;tex.magFilter=T.NearestFilter;tex.generateMipmaps=true;tex.minFilter=T.LinearMipmapLinearFilter;tex.anisotropy=1;
   const mt=new T.MeshLambertMaterial({map:tex,flatShading:true,side:T.DoubleSide,name:'capital hlod135 '+c.id,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-2});ditherMat(mt);
   const mesh=new T.Mesh(g,mt);mesh.name='Capital HLOD135 '+c.id;mesh.visible=false;mesh.castShadow=true;mesh.receiveShadow=false;mesh.matrixAutoUpdate=false;mesh.userData.noBake133=true;
   group.add(mesh);c.hlod=mesh;st.hlodLoaded++;}).catch(e=>{console.warn('[capital135] hlod',c.id,e);c.retry=performance.now()+5000;}).finally(()=>c.loading=false);}
 function ditherMat(m){m.onBeforeCompile=sh=>{sh.fragmentShader=sh.fragmentShader.replace('#include <alphatest_fragment>','{ivec2 q135=ivec2(mod(gl_FragCoord.xy,4.));int i135=q135.x+q135.y*4;float b135=(float((i135==0)?0:(i135==1)?8:(i135==2)?2:(i135==3)?10:(i135==4)?12:(i135==5)?4:(i135==6)?14:(i135==7)?6:(i135==8)?3:(i135==9)?11:(i135==10)?1:(i135==11)?9:(i135==12)?15:(i135==13)?7:(i135==14)?13:5)+.5)/16.;if(opacity<1.&&opacity<=b135)discard;diffuseColor.a=1.;}');};m.customProgramCacheKey=()=>'hlod135dither';}
 let last=0;
 function tick(wx,wz){
  if(!prep.keyed)return;
  if(!st.split){if(!job)job=splitter();if(job.next().done)job=null;return;}
  const p=worldToCity(wx,wz,{}),now=performance.now(),dt=last?Math.min(100,now-last):16;last=now;let loads=0,ups=0;
  for(const c of cells.values()){if(c.loading)loads++;fadeStep(c,now,dt);}
  for(const c of cells.values()){const dx=Math.max(c.ix*B-p.x,0,p.x-(c.ix+1)*B),dz=Math.max(c.iz*B-p.z,0,p.z-(c.iz+1)*B),d=Math.hypot(dx,dz);
   if(d>NEAR-30&&!c.hlod&&!c.loading&&loads<2&&!(c.retry>now)){load(c);loads++;}
   if((c.mode==='full'||c.mode==='out')&&d>FAR&&c.hlod)show(c,false);
   else if((c.mode==='hlod'||c.mode==='in')&&d<NEAR){if(!c.unl||ups<1){if(c.unl)ups++;show(c,true);}}
   else if(c.mode==='hlod'&&!c.unl&&d>UNLOAD&&now-c.t0>HOLD)unload(c);}
  st.hlodShown=0;st.fading=0;for(const c of cells.values()){if(c.mode==='hlod')st.hlodShown++;else if(c.mode!=='full')st.fading++;}
 }
 return{tick,stats:st,cells,group,show,unload,restore};
}
