// V144 A1 layout (pure, no three.js): capital block (-2,-1)'s north-facing front row (four procedural lots, block-local x 12..100)
// becomes one lot for the brick apartment slab (brick144.js); block-local x 76..100 stays open for the A2 road works. ?brick144=0 off.
import {urbanHash} from './urban-batch.js?v=60';
export const BRICK144_ON=!/[?&]brick144=0\b/.test(globalThis.location?.search||'');
export const BRICK144={block:[-2,-1],x0:14,x1:76,w:62,depth:16};
export function brick144Filter(result){
 if(!BRICK144_ON||result.ix!==BRICK144.block[0]||result.iz!==BRICK144.block[1])return result;const x=result.x,z=result.z;
 result.buildings=result.buildings.filter(q=>q.ry!==0);
 result.buildings.push({type:'brick144',brick144:true,skipStorefront:true,x:x+(BRICK144.x0+BRICK144.x1)/2,z:z+100-12,ry:0,w:BRICK144.w,d:24,floors:6,seed:urbanHash(result.ix,result.iz,0x144b),lot:result.district,streetwall:true});
 return result;}
// V144 A2: city-coordinate rectangles [x0,x1,z0,z1] where urban-streets' stock frontage furniture (trees, meters, lights, signs,
// newspaper boxes, the parked sedan) is skipped so brick144-street.js can lay out the photo's street (sidewalk, then parking lane).
export const BRICK144_CLEAR=BRICK144_ON?[[-207,-124.5,-12.3,-7.6],[-212,-124.5,-6.9,-3.4]]:[];
