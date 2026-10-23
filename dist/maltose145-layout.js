// V145 Maltose Market (麦芽糖市场) layout (pure, no three.js). Spec notes/spec-1023-maltose-market.md.
// Site: capital east edge, procedural block (1,-1) (city x 112..224, z -112..0), ~130 m east of the arrival road (x = 0)
// along the z = -112 street. The photo camera looks SOUTH (-z; +x is then on screen right). The schoolyard takes block-local
// x 60..100, z 12..76: the south row's east lots (x 59..100) and both east side lots are dropped. The south row's west lots
// (x 12..53) stay on screen left (the photo's near-left red brick building, rebuilt in M2). The yard fronts the z = -112 street
// (the photo's far street, across it block (1,-2)'s north row = beige building) and the x = 224 avenue (the gap with the twin
// towers; across it block (2,-2) = brown building, block (2,-1) south row = far-right red brick). ?malt145=0 off.
export const MALTOSE145_ON=!/[?&]malt145=0\b/.test(globalThis.location?.search||'');
export const MALTOSE145_BLOCKS=['1,-2','2,-2'];
export const MALTOSE145={block:[1,-1],X0:60,X1:100,Z0:12,Z1:76,gate:[61.2,64.8]};
export function maltose145Filter(result){
 if(!MALTOSE145_ON||result.ix!==MALTOSE145.block[0]||result.iz!==MALTOSE145.block[1])return result;const x=result.x;
 result.buildings=result.buildings.filter(q=>!(q.ry===Math.PI/2)&&!(q.ry===Math.PI&&q.x-x>56));
 result.maltose145=true;return result;}
// V145 M2: the photo's three near buildings (maltose145-bldg.js). Block (1,-2)'s north row (across the z = -112 street) becomes
// RED (lx 12..61) + 3 m light-well + BEIGE (lx 64..100); block (2,-2)'s north-west corner (across the x = 224 avenue) becomes
// the BROWN corner L (north wing lx 12..53, west wing down to lz 40), replacing the north row west lots and the west side lots.
export function maltose145Filter2(result){
 if(!MALTOSE145_ON)return result;const{ix,iz,x,z}=result;
 if(ix===1&&iz===-2){result.buildings=result.buildings.filter(q=>q.ry!==0);
  result.buildings.push({type:'maltose145_red',malt145b:'red',skipStorefront:true,x:x+36.5,z:z+90,ry:0,w:49,d:20,floors:7,seed:0x145a1,lot:result.district,streetwall:true},
   {type:'maltose145_beige',malt145b:'beige',skipStorefront:true,x:x+82,z:z+91,ry:0,w:36,d:18,floors:6,seed:0x145a2,lot:result.district,streetwall:true});}
 if(ix===2&&iz===-2){result.buildings=result.buildings.filter(q=>!(q.ry===0&&q.x-x<56)&&q.ry!==-Math.PI/2);
  result.buildings.push({type:'maltose145_brown',malt145b:'brown',skipStorefront:true,x:x+12,z:z+100,ry:0,w:41,d:18,floors:7,seed:0x145a3,lot:result.district,streetwall:true});}
 return result;}
// V145 M3: the photo's far / side buildings (maltose145-far.js), deduced in the M2 photo camera:
//  (2,-1) south-west corner L = RR (right near red), replacing its south row west lots + west side lots;
//  (2,-2) courtyard = TB (tall brown), south row west lots = LG (light grey);  (1,-2) courtyard = TL (tall dark, its north-west
//  side lot goes), the rest of (1,-2) capped at 7 floors so nothing pokes over BEIGE;  (2,-3) north = SR (San Remo twin towers):
//  north row + the side lots north of lz 54 go.
export function maltose145Filter3(result){
 if(!MALTOSE145_ON)return result;const{ix,iz,x,z}=result,L=result.district,add=(o)=>result.buildings.push({skipStorefront:true,lot:L,streetwall:true,ry:0,...o});
 if(ix===2&&iz===-1){result.buildings=result.buildings.filter(q=>!(q.ry===Math.PI&&q.x-x<56)&&q.ry!==-Math.PI/2);
  add({type:'maltose145_rr',malt145f:'rr',x:x+12,z:z+12,ry:-Math.PI/2,w:41,d:64,floors:7,seed:0x145b1});}
 if(ix===2&&iz===-2){result.buildings=result.buildings.filter(q=>!(q.ry===Math.PI&&q.x-x<56));
  add({type:'maltose145_tb',malt145f:'tb',x:x+49,z:z+65,w:34,d:22,floors:14,seed:0x145b2});
  add({type:'maltose145_lg',malt145f:'lg',x:x+32.5,z:z+24,w:41,d:24,floors:5,seed:0x145b3});}
 if(ix===1&&iz===-2){result.buildings=result.buildings.filter(q=>!(q.ry===-Math.PI/2&&q.z-z>54));
  for(const q of result.buildings)if(!q.malt145b)q.floors=Math.min(q.floors,q.type==='brick_walkup'?6:7);
  add({type:'maltose145_tl',malt145f:'tl',x:x+42,z:z+62,w:28,d:24,floors:20,seed:0x145b4});}
 if(ix===2&&iz===-3){result.buildings=result.buildings.filter(q=>q.ry!==0&&!(Math.abs(q.ry)===Math.PI/2&&q.z-z>54));
  add({type:'maltose145_sr',malt145f:'sr',x:x+56.5,z:z+72,w:61,d:36,floors:27,seed:0x145b5});}
 return result;}
