// V132-flashlight2 · extra flashlights: AcchiHaven "PSX Style FlashLights" (https://acchihaven.itch.io/psx-style-flashlights,
// credits assets/fp-torch-v132b/CREDITS.txt). The three GLBs and both texture variations ship untouched (the pack is already
// PSX low poly: no decimation, no texture crushing). This module only re-orients each model into the torch frame used by
// flashlight117 (+Z forward, lens centre at (lx,ly,lz)), so the beam origin, the viewmodel grip and the loot copies share it.
// Item meta: {fl:1..3, v:1|2} (v = texture variation). fl 0 / missing = the original Jarlan Perez torch.
import * as T from './vendor/three.module.min.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
const A=new URL('./assets/fp-torch-v132b/',import.meta.url).href,VQ='?v=132b';
// (the torch frame's -Y is screen-up in the grip, hence roll π)
// per model: rotation (Euler XYZ) taking the lens direction to +Z, and where the lens centre sits in the torch frame
// 1 = classic metal torch (lens +X), 2 = angle-head torch (lens -Z, head +Y), 3 = box lantern (lens +X, upright)
export const FL2={
 1:{name:['金属手电','银色金属手电'],rot:[0,-Math.PI/2,0],lens:[0,0,.165],roll:Math.PI},
 2:{name:['弯头手电','军绿弯头手电'],rot:[0,Math.PI,0],lens:[0,-.07,.09],roll:Math.PI},
 3:{name:['方形提灯','棕色方形提灯'],rot:[0,-Math.PI/2,0],lens:[0,-.078,.065],roll:Math.PI},
};
export const fl2Of=meta=>{const n=meta?.fl|0;return FL2[n]?n:0;};
export const fl2Var=meta=>(meta?.v|0)===2?2:1;
export const fl2Name=meta=>{const n=fl2Of(meta);return n?FL2[n].name[fl2Var(meta)-1]:null;};
const cache=new Map(),texC=new Map(),loader=new GLTFLoader(),tl=new T.TextureLoader();
function texFor(n,v,embedded){const k=n+':'+v;if(texC.has(k))return texC.get(k);let t;
 t=tl.load(A+'FlashLight_'+n+'_v'+v+'.png'+VQ);t.flipY=false;// the pack's own Variation1/2 PNGs (v1 = the one embedded in the GLB)
 t.colorSpace=T.SRGBColorSpace;t.magFilter=T.NearestFilter;t.minFilter=T.NearestMipmapLinearFilter;texC.set(k,t);return t;}
// geometry in the torch frame; resolves {geo, lensR, embedded}
export function loadFL2(n){if(!FL2[n])return Promise.reject(new Error('no fl2 '+n));if(cache.has(n))return cache.get(n).p;
 const rec={ready:null};rec.p=new Promise((res,rej)=>loader.load(A+'FlashLight_00'+n+'.glb'+VQ,g=>{try{
  let src=null;g.scene.updateMatrixWorld(true);g.scene.traverse(o=>{if(o.isMesh&&!src)src=o;});
  const geo=src.geometry.clone().applyMatrix4(src.matrixWorld);const D=FL2[n];
  geo.applyMatrix4(new T.Matrix4().makeRotationFromEuler(new T.Euler(...D.rot)));
  // lens centre = centroid of the verts within 6 mm of the front face; radius = their spread
  const p=geo.attributes.position;let zmax=-1e9;for(let i=0;i<p.count;i++)zmax=Math.max(zmax,p.getZ(i));
  let cx=0,cy=0,c=0;for(let i=0;i<p.count;i++)if(p.getZ(i)>zmax-.006){cx+=p.getX(i);cy+=p.getY(i);c++;}cx/=c;cy/=c;
  let r=0;for(let i=0;i<p.count;i++)if(p.getZ(i)>zmax-.006)r=Math.max(r,Math.hypot(p.getX(i)-cx,p.getY(i)-cy));
  geo.applyMatrix4(new T.Matrix4().makeRotationZ(D.roll));const cr=new T.Vector3(cx,cy,0).applyAxisAngle(new T.Vector3(0,0,1),D.roll);
  geo.translate(D.lens[0]-cr.x,D.lens[1]-cr.y,D.lens[2]-zmax);geo.computeBoundingBox();
  const embedded=src.material?.map||null;rec.ready={geo,lensR:r*.8,embedded};res(rec.ready);}catch(e){rej(e);}},undefined,rej));
 cache.set(n,rec);return rec.p;}
export const readyFL2=n=>cache.get(n)?.ready||null;
export const prepareFL2=()=>Promise.all([1,2,3].map(n=>loadFL2(n).catch(e=>console.warn('fl2 load failed',n,e))));
const matC=new Map();
export function fl2Material(n,v,emissive=0x1a1a1a){const k=n+':'+v+':'+emissive;if(matC.has(k))return matC.get(k);const r=readyFL2(n);const map=texFor(n,v,r?.embedded);
 // the pack's own material is fully self-lit (emissive = base colour x0.8); here it is lit by the scene, with a faint
 // emissive from the same map so the held torch stays readable in the dark levels
 const m=new T.MeshStandardMaterial({map,emissiveMap:map,emissive,roughness:.7,metalness:0,side:T.DoubleSide});matC.set(k,m);return m;}
// mesh in the torch frame (fills in when the GLB arrives)
export function fl2Mesh(n,v,emissive){const g=new T.Group();const put=r=>{const m=new T.Mesh(r.geo,fl2Material(n,v,emissive));m.frustumCulled=false;m.castShadow=m.receiveShadow=false;g.add(m);};
 const r=readyFL2(n);if(r)put(r);else loadFL2(n).then(put).catch(()=>{});return g;}
// loot copy: lying on its side, origin at the resting bottom centre (needs prepareFL2() first for exact bounds)
export function fl2Loot(meta){const n=fl2Of(meta)||1,v=fl2Var(meta),o=new T.Group(),r=readyFL2(n);
 const inner=fl2Mesh(n,v,0x000000);inner.children.forEach(m=>{m.castShadow=m.receiveShadow=true;});
 if(n===3){inner.rotation.set(0,0,0);}else{inner.rotation.set(0,0,Math.PI/2);}// box lantern stands upright, the torches lie on their side
 o.add(inner);if(r){inner.updateMatrixWorld(true);const b=r.geo.boundingBox.clone().applyMatrix4(inner.matrix);const c=b.getCenter(new T.Vector3());inner.position.set(-c.x,-b.min.y,-c.z);}
 return o;}
