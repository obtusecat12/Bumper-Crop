// V133-bake-city: per-vertex sky occlusion + bounce for the FIXED outdoor scenes (not the infinite parts):
// L10 lake outpost (lake-outpost.js) and the L11 fixed city fabric built once in createExitScene (approach,
// reference scenes, clinic district, landmark fabric + ground, tiki facade, bath entrance, backcourt, mill mouth...).
// Hash-generated L11 blocks and L10 farm chunks are streamed and are NOT baked.
// Sync at build: patch materials + neutral attribute (looks exactly like before until filled). Then, off the boot
// path: subdivide/key (time-sliced), fetch the data module (offline: tools/bake133_sky.mjs), fill.
// Off with ?bake=0 (nothing touched).
import {bake133Enabled,prepareSky133,keySky133,fillBake133} from './venue133-bake.js?v=133c';
const MOVING=/water|glass|flame|fire|smoke|steam|spray|flag|cloth|garment|laundry|rain|fountain|jet|door|gate|leaf|leaves|foliage|blade|wheel|fan|traffic|signal|glow|halo|beam/i;
export function bakeFixed133(roots,{data,exportName,skip=null,delay=2500,gain=.8,keep=1,floor=.38}={}){
 if(!bake133Enabled())return null;
 const filter=o=>{if(MOVING.test(o.name||'')||MOVING.test(o.material?.name||''))return false;for(let p=o;p;p=p.parent){if(p.userData?.campDynamic||p.userData?.noBake133)return false;if(skip&&skip.has(p))return false;}return true;};
 const prep=prepareSky133(roots,{filter,gain,keep,floor});prep.name=exportName;
 prep.ready=new Promise(r=>setTimeout(r,delay)).then(async()=>{const t0=performance.now();await keySky133(prep);prep.keyMs=performance.now()-t0;
  if(globalThis.__bake133NoData)return prep;const m=await import(data);await fillBake133(prep,m[exportName]);
  console.info('[bake133]',exportName,prep.hit,'baked',prep.miss,'missed',Math.round(prep.keyMs)+' ms keying');return prep;})
  .catch(e=>{console.warn('[bake133] '+exportName+' not applied',e);return prep;});
 return prep;
}
