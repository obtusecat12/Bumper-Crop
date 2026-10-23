// V146 首都街角灰泥联排楼 layout (pure, no three.js). Spec notes/spec-1023-stucco-terrace.md.
// Site: block (-2,-2) north-east corner = block-local (100,100) = city (-124,-124), at the z = -112 street x x = -112 avenue
// intersection (across the avenue: the reserved infill column ix -1; across the street: block (-2,-1)'s south row, not the
// V144 slab which is on (-2,-1)'s north row). The main building (stucco146.js) is block-local x 89.5..100, z 60..100: the north
// row's two east lots (lx 59..100, T2 puts the photo's smaller left terrace + stucco wall on lx 59..89.5) and the east side lot
// lz 57..76 go. The photo camera stands on the far corner (block (-1,-1) south-west sidewalk) looking south-west. ?stucco146=0 off.
export const STUCCO146_ON=!/[?&]stucco146=0\b/.test(globalThis.location?.search||'');
export const STUCCO146={block:[-2,-2],corner:[100,100]};
export function stucco146Filter(result){
 if(!STUCCO146_ON||result.ix!==STUCCO146.block[0]||result.iz!==STUCCO146.block[1])return result;const{x,z}=result;
 result.buildings=result.buildings.filter(q=>!(q.ry===0&&q.x-x>56)&&!(q.ry===Math.PI/2&&q.z-z>56));
 result.buildings.push({type:'stucco146_main',stucco146:'main',skipStorefront:true,x:x+100,z:z+100,ry:0,w:10.5,d:40,floors:5,seed:0x146a1,lot:result.district,streetwall:true});
 result.stucco146=true;return result;}
