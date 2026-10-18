// V133-bake-bath: offline GI for fixed interiors (bath / changing room / spa, tiki bar).
// The bake is per-vertex (no texture samplers: many bath programs already sit at the 16-unit limit on Edge/D3D11).
// collectBake133(scene) picks the static opaque meshes and subdivides long triangles (deterministic, so the
// browser dump that feeds tools/bake133_venue.mjs and the runtime see the same vertices).
// applyBake133(list,data) adds a vec4 u8 attribute (rgb = sqrt(indirect irradiance / SCALE), a = ambient occlusion)
// and patches cloned materials: the flat ambient term becomes the baked bounce light, env light is occluded.
// Direct light stays realtime. Off with ?bake=0.
import * as T from './vendor/three.module.min.js';
export const BAKE133_SCALE=4.0;
export function bake133Enabled(){try{return !/[?&]bake=0\b/.test(location.search);}catch(e){return true;}}
const KINDS=new Set(['MeshStandardMaterial','MeshPhysicalMaterial','MeshLambertMaterial','MeshPhongMaterial']);
function bakeable(o){
 if(!o.isMesh||o.isSkinnedMesh||o.isInstancedMesh||o.userData.noBake133)return false;
 const m=o.material;if(!m||Array.isArray(m)||!KINDS.has(m.type))return false;
 if(m.transparent&&m.opacity<.95)return false;if(m.transmission>0||m.userData?.dynamic)return false;
 const g=o.geometry;if(!g?.attributes?.position||!g.attributes.normal||g.morphAttributes?.position)return false;
 if(g.groups&&g.groups.length>1)return false;return true;
}
// split every triangle whose world-space longest edge exceeds L (midpoint of the longest edge, recursive)
export function subdivide133(geo,matrixWorld,L){
 const p=geo.attributes.position,ix=geo.index,nt=(ix?ix.count:p.count)/3,v=new T.Vector3(),w=[new T.Vector3(),new T.Vector3(),new T.Vector3()];
 const vid=(t,k)=>ix?ix.getX(t*3+k):t*3+k;let need=false;
 for(let t=0;t<nt&&!need;t++){for(let k=0;k<3;k++)w[k].fromBufferAttribute(p,vid(t,k)).applyMatrix4(matrixWorld);if(Math.max(w[0].distanceTo(w[1]),w[1].distanceTo(w[2]),w[2].distanceTo(w[0]))>L)need=true;}
 if(!need)return geo;
 const names=Object.keys(geo.attributes),src=names.map(n=>geo.attributes[n]),out=names.map(()=>[]);
 const read=(a,i)=>{const r=[];for(let c=0;c<a.itemSize;c++)r.push(a.getComponent?a.getComponent(i,c):a.array[i*a.itemSize+c]);return r;};
 const posW=i=>new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(matrixWorld);
 function emit(tri){for(const q of tri)for(let a=0;a<src.length;a++)out[a].push(...q.v[a]);}
 function split(tri,depth){
  const d=[tri[0].w.distanceTo(tri[1].w),tri[1].w.distanceTo(tri[2].w),tri[2].w.distanceTo(tri[0].w)];let e=0;if(d[1]>d[e])e=1;if(d[2]>d[e])e=2;
  if(d[e]<=L||depth>14){emit(tri);return;}
  const A=tri[e],B=tri[(e+1)%3],C=tri[(e+2)%3],M={w:A.w.clone().lerp(B.w,.5),v:A.v.map((x,a)=>x.map((y,c)=>(y+B.v[a][c])/2))};
  split([A,M,C],depth+1);split([M,B,C],depth+1);
 }
 for(let t=0;t<nt;t++){const tri=[0,1,2].map(k=>{const i=vid(t,k);return {w:posW(i),v:src.map(a=>read(a,i))};});split(tri,0);}
 const g=new T.BufferGeometry();names.forEach((n,a)=>{const s=src[a];const arr=new Float32Array(out[a]);const at=new T.BufferAttribute(arr,s.itemSize,false);g.setAttribute(n,at);});
 const ni=names.indexOf('normal');if(ni>=0){const nn=g.attributes.normal;for(let i=0;i<nn.count;i++){v.fromBufferAttribute(nn,i).normalize();nn.setXYZ(i,v.x,v.y,v.z);}}
 g.name=geo.name;g.userData=geo.userData;return g;
}
export function collectBake133(scene,{L=.42,filter=null}={}){
 scene.updateMatrixWorld(true);const list=[],seen=new Map();
 scene.traverse(o=>{if(!bakeable(o)||(filter&&!filter(o)))return;
  const g2=subdivide133(o.geometry,o.matrixWorld,L);if(g2!==o.geometry){o.geometry.dispose?.();o.geometry=g2;}
  const base=(o.name||o.parent?.name||'mesh')+'|'+o.geometry.attributes.position.count,k=seen.get(base)||0;seen.set(base,k+1);
  list.push({mesh:o,key:base+'|'+k});});
 return list;
}
// weld key: position 2 mm + normal 1/8 — same in the dump and at runtime, so the data stores unique vertices only
export function weld133(geo){
 const p=geo.attributes.position,n=geo.attributes.normal,c=p.count,remap=new Uint32Array(c);let cap=1;while(cap<c*2)cap<<=1;
 const tab=new Int32Array(cap).fill(-1),keys=new Int32Array(c*6);let u=0;const k=new Int32Array(6);
 for(let i=0;i<c;i++){k[0]=Math.round(p.getX(i)*500);k[1]=Math.round(p.getY(i)*500);k[2]=Math.round(p.getZ(i)*500);k[3]=Math.round(n.getX(i)*8);k[4]=Math.round(n.getY(i)*8);k[5]=Math.round(n.getZ(i)*8);
  let h=2166136261;for(let j=0;j<6;j++){h=Math.imul(h^k[j],16777619);}h=(h>>>0)&(cap-1);
  for(;;){const e=tab[h];if(e<0){tab[h]=u;keys.set(k,u*6);remap[i]=u++;break;}let eq=true;for(let j=0;j<6;j++)if(keys[e*6+j]!==k[j]){eq=false;break;}if(eq){remap[i]=e;break;}h=(h+1)&(cap-1);}}
 return {remap,count:u};
}
function patch(src,U){
 const m=src.clone();m.name=src.name+' / bake133';const prev=src.onBeforeCompile,prevKey=src.customProgramCacheKey;
 m.onBeforeCompile=(sh,r)=>{if(prev!==T.Material.prototype.onBeforeCompile)prev.call(m,sh,r);
  sh.uniforms.bake133Gain=U.gain;sh.uniforms.bake133Keep=U.keep;
  sh.vertexShader='attribute vec4 bake133;\nvarying vec4 vBake133;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n\tvBake133 = bake133;');
  sh.fragmentShader='varying vec4 vBake133;\nuniform float bake133Gain;\nuniform float bake133Keep;\n'+sh.fragmentShader.replace('#include <lights_fragment_maps>',`#include <lights_fragment_maps>
	{ float bkAO = vBake133.a; vec3 bkE = vBake133.rgb * vBake133.rgb * ${BAKE133_SCALE.toFixed(2)};
	#if defined( RE_IndirectDiffuse )
		irradiance = irradiance * bkAO * bake133Keep + bkE * bake133Gain;
		#if defined( STANDARD )
		iblIrradiance *= bkAO;
		#endif
	#endif
	#if defined( RE_IndirectSpecular )
		radiance *= mix( 1.0, bkAO, 0.85 );
	#endif
	}`);};
 m.customProgramCacheKey=()=>'bake133|'+(prevKey!==T.Material.prototype.customProgramCacheKey?prevKey.call(src):'');
 return m;
}
// data: {key: base64 of count*4 u8}
export function applyBake133(list,data,{gain=1,keep=.25}={}){
 const U={gain:{value:gain},keep:{value:keep}},mats=new Map();let hit=0,miss=0,verts=0;
 for(const {mesh,key} of list){const b=data[key];if(!b){miss++;continue;}
  const bin=atob(b),n=mesh.geometry.attributes.position.count,{remap,count}=weld133(mesh.geometry);if(bin.length!==count*4){miss++;continue;}
  const u=new Uint8Array(n*4);for(let i=0;i<n;i++){const j=remap[i]*4;u[i*4]=bin.charCodeAt(j);u[i*4+1]=bin.charCodeAt(j+1);u[i*4+2]=bin.charCodeAt(j+2);u[i*4+3]=bin.charCodeAt(j+3);}
  mesh.geometry.setAttribute('bake133',new T.BufferAttribute(u,4,true));
  let m=mats.get(mesh.material);if(!m){m=patch(mesh.material,U);mats.set(mesh.material,m);}mesh.material=m;hit++;verts+=n;}
 return {hit,miss,verts,materials:mats.size,uniforms:U};
}
// dump for the node baker (browser side): world-space geometry + albedo + lights
export async function dumpBake133(scene,list,{extraOccluders=true}={}){
 const lin=c=>c.clone();const avg=new Map();
 function texAvg(t){if(!t||!t.image)return null;if(avg.has(t))return avg.get(t);let r=null;try{const c=document.createElement('canvas');c.width=c.height=16;const g=c.getContext('2d');g.drawImage(t.image,0,0,16,16);const d=g.getImageData(0,0,16,16).data;let s=[0,0,0];for(let i=0;i<d.length;i+=4)for(let k=0;k<3;k++)s[k]+=d[i+k];r=s.map(x=>{const v=x/256/255;return t.colorSpace===T.SRGBColorSpace?Math.pow(v,2.2):v;});}catch(e){r=null;}avg.set(t,r);return r;}
 const meshes=[],occ=[];const inList=new Set(list.map(e=>e.mesh));
 function geoOut(o,weld=false){const g=o.geometry,p=g.attributes.position,n=g.attributes.normal,ix=g.index;
  const W=weld?weld133(g):{remap:Uint32Array.from({length:p.count},(_,i)=>i),count:p.count},P=new Float32Array(W.count*3),N=new Float32Array(W.count*3),v=new T.Vector3(),nm=new T.Matrix3().getNormalMatrix(o.matrixWorld);
  for(let i=0;i<p.count;i++){const j=W.remap[i];v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);P.set([v.x,v.y,v.z],j*3);if(n){v.fromBufferAttribute(n,i).applyMatrix3(nm).normalize();N.set([v.x,v.y,v.z],j*3);}}
  const nt=ix?ix.count:p.count,I=new Uint32Array(nt);for(let t=0;t<nt;t++)I[t]=W.remap[ix?ix.getX(t):t];const b64=a=>{const u=new Uint8Array(a.buffer,a.byteOffset,a.byteLength);let s='';for(let i=0;i<u.length;i+=32768)s+=String.fromCharCode.apply(null,u.subarray(i,i+32768));return btoa(s);};
  return {P:b64(P),N:b64(N),I:b64(I),count:W.count};}
 for(const {mesh:o,key} of list){const m=o.material,c=m.color?m.color.toArray():[.5,.5,.5],ta=texAvg(m.map)||[1,1,1];const col=o.geometry.attributes.color&&m.vertexColors;
  let vc=[1,1,1];if(col){const ca=o.geometry.attributes.color,s=[0,0,0],st=Math.max(1,Math.floor(ca.count/512));let k=0;for(let i=0;i<ca.count;i+=st){s[0]+=ca.getX(i);s[1]+=ca.getY(i);s[2]+=ca.getZ(i);k++;}vc=s.map(x=>x/k);} // V133-bake-city: batched meshes keep their colour per vertex
  meshes.push({key,albedo:c.map((x,i)=>x*ta[i]*vc[i]),side:m.side,...geoOut(o,true)});}
 scene.traverse(o=>{if(!o.isMesh||inList.has(o)||o.isSkinnedMesh||!o.visible)return;const m=Array.isArray(o.material)?o.material[0]:o.material;if(!m||m.transparent&&m.opacity<.95)return;if(o.isInstancedMesh)return;if(!o.geometry?.attributes?.position)return;let vis=true;o.traverseAncestors(a=>{if(!a.visible)vis=false;});if(!vis)return;occ.push({name:o.name,...geoOut(o)});});
 const lights=[];scene.traverse(o=>{if(o.isPointLight||o.isSpotLight){const p=new T.Vector3();o.getWorldPosition(p);const L={type:o.type,name:o.name,p:p.toArray(),c:o.color.toArray(),i:o.intensity,d:o.distance,decay:o.decay};if(o.isSpotLight){const t=new T.Vector3();o.target.getWorldPosition(t);Object.assign(L,{t:t.toArray(),angle:o.angle,pen:o.penumbra});}lights.push(L);}
  if(o.isAmbientLight||o.isHemisphereLight)lights.push({type:o.type,c:o.color.toArray(),i:o.intensity});
  if(o.isRectAreaLight){const p=new T.Vector3();o.getWorldPosition(p);const d=new T.Vector3(0,0,-1).applyQuaternion(o.getWorldQuaternion(new T.Quaternion()));lights.push({type:o.type,name:o.name,p:p.toArray(),n:d.toArray(),c:o.color.toArray(),i:o.intensity,w:o.width,h:o.height});}});
 return {meshes,occ,lights};
}

// ---- V133-bake-city: fixed OUTDOOR scenes (L10 lake outpost, L11 fixed city fabric) ----
// Outdoor patch: weather owns sky and sun, so the bake only scales the realtime ambient/hemisphere/IBL term:
// f = max(floor, AO*keep + B*gain), B = relative bounce (tools/bake133_sky.mjs). Direct sun/lamps stay realtime.
// Build time (sync, cheap): pick meshes, clone+patch materials, add a NEUTRAL attribute (rgb 0, a 1 → f = keep = 1),
// so the level's fog/shadow/finish passes register the patched materials as usual. Later (async, time-sliced):
// subdivide, key, fetch data, fill. Swapping geometry never touches material registration.
export const BAKE133_SKY_SCALE=2.0;
function patchSky(src,U){
 const m=src.clone();m.name=src.name+' / bake133s';const prev=src.onBeforeCompile,prevKey=src.customProgramCacheKey;
 m.onBeforeCompile=(sh,r)=>{if(prev!==T.Material.prototype.onBeforeCompile)prev.call(m,sh,r);
  sh.uniforms.bake133Gain=U.gain;sh.uniforms.bake133Keep=U.keep;sh.uniforms.bake133Floor=U.floor;
  sh.vertexShader='attribute vec4 bake133;\nvarying vec4 vBake133;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n\tvBake133 = bake133;');
  sh.fragmentShader='varying vec4 vBake133;\nuniform float bake133Gain;\nuniform float bake133Keep;\nuniform float bake133Floor;\n'+sh.fragmentShader.replace('#include <lights_fragment_maps>',`#include <lights_fragment_maps>
	{ float bkAO = vBake133.a; vec3 bkF = max( vec3( bake133Floor ), vec3( bkAO * bake133Keep ) + vBake133.rgb * vBake133.rgb * ${BAKE133_SKY_SCALE.toFixed(2)} * bake133Gain );
	#if defined( RE_IndirectDiffuse )
		irradiance *= bkF;
		#if defined( STANDARD )
		iblIrradiance *= bkF;
		#endif
	#endif
	#if defined( RE_IndirectSpecular )
		radiance *= mix( 1.0, bkAO, 0.6 );
	#endif
	}`);};
 m.customProgramCacheKey=()=>'bake133s|'+(prevKey!==T.Material.prototype.customProgramCacheKey?prevKey.call(src):'');
 return m;
}
function neutral(g){const n=g.attributes.position.count,u=new Uint8Array(n*4);for(let i=3;i<u.length;i+=4)u[i]=255;g.setAttribute('bake133',new T.BufferAttribute(u,4,true));}
// roots: [[object3D, L], ...] (L = subdivision edge length in m for that root)
export function prepareSky133(roots,{filter=null,gain=.6,keep=1,floor=.22}={}){
 const U={gain:{value:gain},keep:{value:keep},floor:{value:floor}},mats=new Map(),list=[];
 for(const [r,L] of roots){if(!r)continue;r.traverse(o=>{if(!bakeable(o)||(filter&&!filter(o)))return;neutral(o.geometry);
  let m=mats.get(o.material);if(!m){m=patchSky(o.material,U);mats.set(o.material,m);}o.material=m;list.push({mesh:o,L,key:null});});}
 return {list,uniforms:U,materials:mats.size,hit:0,miss:0,verts:0,keyed:false,filled:false};
}
const slice=async(t,budget)=>{if(performance.now()-t.v>budget){await new Promise(r=>setTimeout(r,0));t.v=performance.now();}};
// subdivide + key (identical in the dump page and in game: same list order, same code)
export async function keySky133(prep,{budget=8}={}){
 const seen=new Map(),t={v:performance.now()};
 for(const e of prep.list){const o=e.mesh;o.updateMatrixWorld(true);const g=o.geometry;g.deleteAttribute('bake133');const g2=subdivide133(g,o.matrixWorld,e.L);if(g2!==g){o.geometry=g2;g.dispose();}neutral(o.geometry);
  const base=(o.name||o.parent?.name||'mesh')+'|'+o.geometry.attributes.position.count,k=seen.get(base)||0;seen.set(base,k+1);e.key=base+'|'+k;await slice(t,budget);}
 prep.keyed=true;return prep;
}
// data value: base64 of u8 per welded vertex, 4 bytes (rgb bounce, a AO) or 2 bytes (bounce luminance, AO)
export async function fillBake133(prep,data,{budget=6}={}){
 const t={v:performance.now()};
 for(const {mesh,key} of prep.list){const b=data[key],a=mesh.geometry.attributes.bake133;if(!b||!a){prep.miss++;continue;}
  const n=a.count,{remap,count}=weld133(mesh.geometry),bin=atob(b),S=bin.length===count*2?2:bin.length===count*4?4:0;if(!S){prep.miss++;continue;}
  const u=a.array;for(let i=0;i<n;i++){const j=remap[i]*S;if(S===4){u[i*4]=bin.charCodeAt(j);u[i*4+1]=bin.charCodeAt(j+1);u[i*4+2]=bin.charCodeAt(j+2);u[i*4+3]=bin.charCodeAt(j+3);}else{const e=bin.charCodeAt(j);u[i*4]=u[i*4+1]=u[i*4+2]=e;u[i*4+3]=bin.charCodeAt(j+1);}}
  a.needsUpdate=true;prep.hit++;prep.verts+=n;await slice(t,budget);}
 prep.filled=true;return prep;
}
