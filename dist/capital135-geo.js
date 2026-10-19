// V135-capital ②c-2b-2: "shell + stream" boot for the fixed capital batch roots.
// createExitScene no longer runs the six big batch builders (approach + rural verge, joined ground, clinic district / palm
// plaza, landmark fabric + ground ≈ 1 s CPU and ~0.9 M vertices) at module top level. Instead it gets empty shell groups plus
// the builders' small data (colliders, walks, waypoint, records…) from capital135/geo/index.js, and the geometry is fetched
// later (first L10/L11 update, setCity, prepareAt) from lossless gzip packs cooked offline by bc/scripts/bake135/cookgeo135.py.
// Attributes are zero-copy views on the decompressed buffer and bit-identical to the builder output, so bake keys, the per-cell
// bake stream and the HLOD split all behave exactly as before. ?stream=0 or ?cook135=0 = old eager builders.
import * as T from './vendor/three.module.min.js';
import {addShrub131Materials} from './shrub131.js?v=131';
const TA={f32:Float32Array,u16:Uint16Array,u32:Uint32Array,u8:Uint8Array,i16:Int16Array,i8:Int8Array};
export function geo135Enabled(G){return !!G&&typeof DecompressionStream!=='undefined'&&!/[?&](stream|cook135)=0\b/.test(globalThis.location?.search||'');}
function applyNode(o,n){o.name=n.n||'';if(n.p){o.position.fromArray(n.p);o.quaternion.fromArray(n.q);o.scale.fromArray(n.s);}if(n.mau===0){o.matrixAutoUpdate=false;o.matrix.fromArray(n.m);}else o.updateMatrix();
 if(n.v===0)o.visible=false;o.castShadow=!!n.cs;o.receiveShadow=!!n.rs;o.renderOrder=n.ro||0;if(n.fc===0)o.frustumCulled=false;if(n.ly!==undefined)o.layers.mask=n.ly;if(n.ud)o.userData=JSON.parse(JSON.stringify(n.ud));return o;}
// shell group for a cooked root (same name/matrix/userData as the builder's root, so recount + bake roots work before load)
export function shell135(head){return applyNode(new T.Group(),head);}
let glowTex=null;
function glow(){if(!glowTex){glowTex=new T.TextureLoader().load(new URL('./assets/l11-v133p/glow133.png',import.meta.url).href);glowTex.name='Plaza133 / glow (cook135)';glowTex.colorSpace=T.SRGBColorSpace;glowTex.wrapS=glowTex.wrapT=T.ClampToEdgeWrapping;glowTex.anisotropy=4;}return glowTex;}
function make(n,buf,base,mats,st){let o;
 if(n.t==='Mesh'){const g=new T.BufferGeometry();
  for(const[nm,[ty,size,norm,off,len]]of Object.entries(n.g.a))g.setAttribute(nm,new T.BufferAttribute(new TA[ty](buf,base+off,len),size,!!norm));
  if(n.g.i){const[ty,off,len]=n.g.i;g.setIndex(new T.BufferAttribute(new TA[ty](buf,base+off,len),1));}
  if(n.g.gr)for(const q of n.g.gr)g.addGroup(q.start,q.count,q.materialIndex);if(n.g.dr)g.setDrawRange(n.g.dr[0],n.g.dr[1]??Infinity);
  if(n.g.bb){const b=n.g.bb;g.boundingBox=new T.Box3(new T.Vector3(b[0],b[1],b[2]),new T.Vector3(b[3],b[4],b[5]));}
  if(n.g.bs){const s=n.g.bs;g.boundingSphere=new T.Sphere(new T.Vector3(s[0],s[1],s[2]),s[3]);}if(n.g.ud)g.userData=n.g.ud;
  const m=mats[n.mk];if(!m){st.missing.push(n.mk);}o=new T.Mesh(g,m||new T.MeshBasicMaterial({visible:false}));st.meshes++;st.verts+=g.attributes.position.count;}
 else if(n.L){o=new T.PointLight(n.L[0],n.L[1],n.L[2],n.L[3]);}
 else if(n.S){o=new T.Sprite(new T.SpriteMaterial({map:glow(),color:0xffa555,transparent:true,opacity:n.S[0],depthWrite:false,blending:T.AdditiveBlending,fog:true}));}
 else o=new T.Group();
 applyNode(o,n);if(n.c)for(const c of n.c)o.add(make(c,buf,base,mats,st));return o;}
async function fetchPack(url){const r=await fetch(url);if(!r.ok)throw Error('capital135 geo '+url+' '+r.status);
 return new Response(r.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();}
// G = CAPITAL135_GEO, shells = {name: Group}, returns Promise<stats>; meshes are attached to the shells, nothing else is touched.
export async function loadCapitalGeo135(G,{base,mats,shells,isDisposed=()=>false,warm=()=>{}}){
 const t0=performance.now(),st={meshes:0,verts:0,bytes:0,missing:[],ms:0,fetchMs:0};addShrub131Materials(mats);warm(); // lazily created shared materials (shrubs, kerb131, st132 boxes) must exist before meshes bind them
 const bufs=await Promise.all(G.order.map(k=>fetchPack(base+G.roots[k].f)));st.fetchMs=Math.round(performance.now()-t0);
 if(isDisposed())return st;
 G.order.forEach((k,i)=>{const buf=bufs[i],len=new DataView(buf).getUint32(0,true),tree=JSON.parse(new TextDecoder().decode(new Uint8Array(buf,4,len))),off=4+len+((4-(4+len)%4)%4);st.bytes+=buf.byteLength;
  const sh=shells[k];for(const c of tree.c||[])sh.add(make(c,buf,off,mats,st));sh.updateMatrixWorld(true);});
 st.ms=Math.round(performance.now()-t0);if(st.missing.length)console.warn('[capital135] geo missing materials',[...new Set(st.missing)]);
 console.info('[capital135] geo packs',st.meshes,'meshes',st.verts,'verts',(st.bytes/1048576).toFixed(1)+' MB in',st.ms,'ms (fetch '+st.fetchMs+')');return st;}
