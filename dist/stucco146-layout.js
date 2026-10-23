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
// V146 T2: basement areas (pits) in front of the north (u = building-local x) and east (u = -z) fronts, 1.35 m deep from the facade.
// urban-streets trims the sidewalk slabs + block asphalt there (stucco146AreaRF / stucco146AreaHoles); stucco146-t2.js builds them.
export const STUCCO146_AREA={d:1.35,n:[[-41,-33.42],[-31.92,-23.42],[-21.92,-16.65],[-15.15,-9.75],[-6.05,-4.2]],e:[[4.2,26.5],[27.95,39.8]]};
// road-frame x ranges of urban-streets frontageTask (side 2 = north: x_rf = 12 - u, side 3 = east: x_rf = 100 - u)
export function stucco146AreaRF(side){if(!STUCCO146_ON)return null;const r=side===2?STUCCO146_AREA.n.map(([a,c])=>[12-c,12-a]):side===3?STUCCO146_AREA.e.map(([a,c])=>[100-c,100-a]):null;return r&&r.sort((p,q)=>p[0]-q[0]);}
// block-local [x0,x1,z0,z1] holes in the block asphalt slab
export function stucco146AreaHoles(){if(!STUCCO146_ON)return[];const d=STUCCO146_AREA.d;return[...STUCCO146_AREA.n.map(([a,c])=>[100+a,100+c,100,100+d]),...STUCCO146_AREA.e.map(([a,c])=>[100,100+d,100-c,100-a])];}
// city-coordinate rectangles where the stock frontage furniture (trees, signals, meters, lights, signs, parked sedan) is skipped
export const STUCCO146_CLEAR=STUCCO146_ON?[[-172,-112,-125,-116],[-125,-116,-172,-112]]:[];
// V146 T3: frontage furniture also cleared where the photo's trees stand (any block: north sidewalk west of the terrace, the far
// sidewalks across the street and the avenue, the avenue sidewalk south of the main building); stucco146-t3.js plants there.
export const STUCCO146_CLEAR2=STUCCO146_ON?[[-200,-172,-125,-116],[-200,-90,-106,-98],[-106,-98,-160,-98],[-125,-116,-182,-170]]:[];
