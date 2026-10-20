// V138-retail-interiors R1: which procedural L11 lots get a walk-in store on their ground floor.
// Called at the end of cityBlockPlan (urban-layout.js) for every streamed block, so low-density rows, towers' ground floors
// and the old fake-background infill (reserved blocks −1/0, infillPlan) all take part. Hash-distributed per lot position
// (stable across revisits); kind 'm' = small supermarket (needs ≥14 m frontage), 'b' = liquor & smoke shop / bodega.
// Blocks carrying SoHo lots are skipped (their Blender bake is keyed to the existing geometry).
// URL: ?retail138=0 off · ?retail138=all every eligible lot · ?retail138=m / =b force the kind (testing).
import {urbanHash} from './urban-batch.js?v=60';
const Q=(globalThis.location?.search||'').match(/[?&]retail138=(\w+)/)?.[1]||'';
export const RETAIL138_RATE=7;   // % of eligible lots
export function retail138Mark(result){
 if(Q==='0')return result;
 const B=result.buildings;if(!B?.length||B.some(q=>q.soho135||q.spire135))return result;
 for(const q of B){
  if(q.retail138||q.type==='parking_garage'||q.heroWall||q.skipStorefront||q.w<8.5||q.d<15)continue;
  const h=urbanHash(Math.round(q.x*4),Math.round(q.z*4),0x138e7a);
  if(Q!=='all'&&Q!=='m'&&Q!=='b'&&h%100>=RETAIL138_RATE)continue;
  let kind=q.w>=14&&((h>>>9)%100)<(q.floors<4?62:42)?'m':'b';if(Q==='m'&&q.w>=14)kind='m';if(Q==='b')kind='b';
  q.retail138={kind,h};
 }
 return result;
}
