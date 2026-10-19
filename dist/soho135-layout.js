// V135-capital ③ SoHo street (notes/plan-v135-capital.md §1): city road x = -224 (block columns -3 | -2), z 0 -> 224.
// Pure layout (no three.js): the street-facing row of blocks (-2,0) (-2,1) [west faces] and (-3,0) (-3,1) [east faces] is
// replaced by hand-made cast-iron buildings, one generated elevation each (art-v135soho -> tools/soho135_assets.py ->
// assets/l11-v135s/facade_<side>.webp, 256 px per facade cell). cityBlockPlan drops the procedural lots on that frontage and
// pushes these lots (flag soho135) so the 2D maps and colliders see them; exit-scene buildBlock builds them via soho135-street.js.
// asp = cropped image height / width (printed by tools/soho135_assets.py), n = storeys painted on it.
export const SOHO135_FACADES={
 a:[{asp:1.8107,n:5},{asp:1.3379,n:5},{asp:1.752,n:7},{asp:1.8107,n:5},{asp:1.494,n:5}],
 b:[{asp:1.2329,n:5},{asp:1.506,n:5},{asp:1.4553,n:6},{asp:1.7773,n:8}],
 c:[{asp:1.8107,n:5},{asp:1.7813,n:5},{asp:1.8107,n:6},{asp:1.4964,n:7},{asp:1.8107,n:5}],
 d:[{asp:1.4758,n:5},{asp:1.8107,n:5},{asp:1.506,n:6},{asp:1.506,n:5},{asp:1.7853,n:6}]};
// facade order along the street (index into the side's list), south -> north (city z ascending)
const ORDER={a:[3,1,2,0,4],b:[0,2,1,3],c:[4,0,3,1,2],d:[1,2,0,4,3]};
const SIDES={'-2,0':{key:'a',face:'w'},'-2,1':{key:'b',face:'w'},'-3,0':{key:'c',face:'e'},'-3,1':{key:'d',face:'e'}};
export const SOHO135={x:-224,z0:0,z1:224,depth:17,ground:6.5,storey:5,cornice:1.2,gf:6.5};
const FRONT0=12,FRONT1=100;   // kerb ring of the block (road half 7.5 + sidewalk 4.5)
export function soho135Side(ix,iz){return SIDES[ix+','+iz]||null;}
// raw facade sizes: height from the storey count, width from the image aspect; then the run is scaled to fill 12..100 exactly
export function soho135Lots(ix,iz){
 const s=SIDES[ix+','+iz];if(!s)return null;const F=SOHO135_FACADES[s.key],ord=ORDER[s.key],B=112,x=ix*B,z=iz*B,D=SOHO135.depth;
 const raw=ord.map(i=>{const f=F[i],H=SOHO135.ground+SOHO135.storey*(f.n-1)+SOHO135.cornice;return{i,f,H,w:H/f.asp};});
 const k=(FRONT1-FRONT0)/raw.reduce((a,r)=>a+r.w,0);let at=z+FRONT0;const lots=[];
 for(const r of raw){const w=r.w*k,H=r.H*k,cz=at+w/2;at+=w;
  const px=s.face==='w'?x+FRONT0+D/2:x+FRONT1-D/2,ry=s.face==='w'?-Math.PI/2:Math.PI/2;
  // local +x runs along the street: city +z for the west face (ry -90 deg), city -z for the east face (ry +90 deg)
  lots.push({type:'soho135',soho135:{side:s.key,i:r.i,cells:F.length,H,n:r.f.n,scale:k,flip:s.face==='e'},x:px,z:cz,ry,w,d:D,floors:r.f.n,seed:(ix*7919+iz*104729+r.i*31)>>>0});}
 return{key:s.key,face:s.face,lots};}
// drop the procedural lots on the SoHo frontage (side lots facing the street + the corner lots of the front/back rows)
export function soho135Filter(result){
 const s=SIDES[result.ix+','+result.iz];if(!s)return result;const x=result.x;
 result.buildings=result.buildings.filter(q=>s.face==='w'?!(q.ry===-Math.PI/2||((q.ry===0||q.ry===Math.PI)&&q.x-q.w/2<x+FRONT0+.5)):!(q.ry===Math.PI/2||((q.ry===0||q.ry===Math.PI)&&q.x+q.w/2>x+FRONT1-.5)));
 result.buildings.push(...soho135Lots(result.ix,result.iz).lots);result.soho135=s.key;return result;}
// ③-3b focal spire tower closing the north end of the SoHo vista. The plan's spot (x -224, z ~620) is the road + the canal
// bridge, and in game it is never on screen from SoHo: L11 fog ends ~280 m out and blocks stream only +-2 rows (224 m). So the
// tower takes the nearest lot that terminates the street within that range: the west BACK-row lot of block (-2,2)
// (x -212..~-190, z 300..324, ~90-300 m from the fair), loaded (lod 1) whenever the player is anywhere in SoHo. Its two
// road-edge side lots in front (z 260..300) are capped to 6 storeys so the street sees the tower over them (cap, not remove).
// Built by soho135-spire.js (generated faces art-v135spire).
export function spire135Filter(result){
 if(result.ix!==-2||result.iz!==2)return result;const x=result.x;
 for(const q of result.buildings)if(q.ry===-Math.PI/2)q.floors=Math.min(q.floors,6);
 const i=result.buildings.findIndex(q=>q.ry===0&&q.x-q.w/2<x+12.5);
 if(i>=0){const q=result.buildings[i];result.buildings[i]={...q,type:'spire135',spire135:true,floors:30};}return result;}
