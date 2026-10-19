// V135-capital ③-3c: Blender Cycles per-vertex outdoor bake for the STREAMED SoHo blocks (city blocks ix -3..-2, iz 0..2).
// Unlike the fixed fabric, these blocks are hash-built by exit-scene buildBlock each time they stream in, so the bake is keyed
// PER BLOCK: when a SoHo block commits at lod 0, its batch meshes go through the same prepareSky133 -> keySky133 path as the
// fixed fabric (subdivide 5 m, key = name|count|n inside that block) and the block's own pack dist/capital135/soho/b<ix>_<iz>.<sha>.bin
// (offline: bc/scripts/bake135 dumpsoho -> bake135_city.py -> cooksoho135.py) is fetched and filled under a per-frame budget.
// Shares the capital prep's patched materials + uniforms (same look as the baked capital). lod-1 blocks stay neutral (= unbaked look).
// Off: ?bake=0 or ?bake135=0 or ?soho135bake=0.
import {prepareSky133,keySky133,weld133,bake133Enabled} from './venue133-bake.js?v=133c';
export const SOHO135_BAKE_BLOCKS=new Set(['-3,0','-3,1','-3,2','-2,0','-2,1','-2,2']);
export const SOHO135_L=5;
const MOVING=/water|glass|flame|fire|smoke|steam|spray|flag|cloth|garment|laundry|rain|fountain|jet|door|gate|leaf|leaves|foliage|blade|wheel|fan|traffic|signal|glow|halo|beam/i;
const filter=o=>!(MOVING.test(o.name||'')||MOVING.test(o.material?.name||''))&&!o.userData?.noBake133;
const BASE=new URL('./capital135/soho/',import.meta.url).href;
let idxP=null;
// same calls the offline dump uses -> identical list order + keys
export function prepSoho135(object,share=null){return prepareSky133([[object,SOHO135_L]],{filter,share,gain:.8,keep:1,floor:.38});}
export function soho135BakeOn(){const q=globalThis.location?.search||'';return bake133Enabled()&&!/[?&](bake135|soho135bake)=0\b/.test(q);}
export function sohoBake135(v,key,share,{force=false,budget=3}={}){
 if(!(force||soho135BakeOn())||v.lod!==0||!SOHO135_BAKE_BLOCKS.has(key)||v.bake135)return null;
 const prep=prepSoho135(v.object,share),alive=()=>!!v.object.parent||force;v.bake135=prep;
 prep.ready=(async()=>{
  const t0=performance.now();await keySky133(prep,{budget});prep.keyMs=Math.round(performance.now()-t0);if(!alive())return prep;
  idxP??=import('./capital135/soho/index.js?v=135w').then(m=>m.SOHO135_INDEX);const idx=await idxP,e=idx[key];if(!e)return prep;
  const r=await fetch(BASE+e.f);if(!r.ok)throw Error('soho135 pack '+r.status);const u8=new Uint8Array(await r.arrayBuffer());if(!alive())return prep;
  const byKey=new Map(prep.list.map(x=>[x.key,x]));let t=performance.now();
  for(const[k,off,len]of e.k){const x=byKey.get(k),a=x?.mesh.geometry.attributes.bake133;if(!a){prep.miss++;continue;}
   const{remap,count}=weld133(x.mesh.geometry);if(count*4!==len){prep.miss++;continue;}
   const u=a.array,n=a.count;for(let i=0;i<n;i++){const j=off+remap[i]*4,o=i*4;u[o]=u8[j];u[o+1]=u8[j+1];u[o+2]=u8[j+2];u[o+3]=u8[j+3];}
   a.needsUpdate=true;prep.hit++;prep.verts+=n;
   if(performance.now()-t>budget){await new Promise(r=>setTimeout(r,0));if(!alive())return prep;t=performance.now();}}
  prep.filled=true;return prep;})().catch(err=>{console.warn('[soho135] bake not applied',key,err);return prep;});
 return prep;
}
