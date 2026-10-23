// V145 Maltose Market (麦芽糖市场) layout (pure, no three.js). Spec notes/spec-1023-maltose-market.md.
// Site: capital east edge, procedural block (1,-1) (city x 112..224, z -112..0), ~130 m east of the arrival road (x = 0)
// along the z = -112 street. The photo camera looks SOUTH (-z; +x is then on screen right). The schoolyard takes block-local
// x 60..100, z 12..76: the south row's east lots (x 59..100) and both east side lots are dropped. The south row's west lots
// (x 12..53) stay on screen left (the photo's near-left red brick building, rebuilt in M2). The yard fronts the z = -112 street
// (the photo's far street, across it block (1,-2)'s north row = beige building) and the x = 224 avenue (the gap with the twin
// towers; across it block (2,-2) = brown building, block (2,-1) south row = far-right red brick). ?malt145=0 off.
export const MALTOSE145_ON=!/[?&]malt145=0\b/.test(globalThis.location?.search||'');
export const MALTOSE145={block:[1,-1],X0:60,X1:100,Z0:12,Z1:76,gate:[61.2,64.8]};
export function maltose145Filter(result){
 if(!MALTOSE145_ON||result.ix!==MALTOSE145.block[0]||result.iz!==MALTOSE145.block[1])return result;const x=result.x;
 result.buildings=result.buildings.filter(q=>!(q.ry===Math.PI/2)&&!(q.ry===Math.PI&&q.x-x>56));
 result.maltose145=true;return result;}
