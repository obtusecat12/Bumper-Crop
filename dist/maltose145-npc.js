// V145 M6 Maltose Market (麦芽糖市场) — the few people of the reference photo (files/ref-1023-maltose-market.webp).
// Built from the capital-crowd pipeline, nothing hand-made: bodies = crowd135.bin from bc/scripts/crowd137/bodies137.py
// + crowd135.bin's BC145=1 sibling crowd145.bin (long-sleeved 'jacket' bodies for man/woman/heavy + a 6-frame
// 'sit' clip; extendCrowd145), clothing = garments135.png from
// bc/scripts/crowd137/garments137.py (V145 adds two winter garments: 'puffer' quilted down jacket, 'wrap' maroon wool wrap
// coat with scarf + tie belt, cells 33..38), heads = the V139 whole heads (tools/crowd139_head.py nets from the
// faces135.py fronts) with crowd137 hair, hats = the bin's cap / beanie props, blink = blink135. Tier A CPU frame copy only
// (createPerson135), so the shared tier B / sprite bake is untouched.
// Cast (positions solved from the photo with /workspace/work/v145/m5/inv.py, photo camera city (190,1.7,-50) yaw 12° pitch 4.6°):
//  two seated vendors (camp chair by the right tables: navy beanie, black puffer, grey trousers; folding chair behind the
//  right white table: navy puffer, cap); customers: maroon wrap-coat woman with a white knit beanie at the near-left table,
//  young man in a white cap behind her, red-jacket woman (beige beanie) and a hooded man behind the brass table, a woman in
//  a light trench at the right tables, and two slow walkers (black leather jacket on the left aisle, long dark coat on the
//  right aisle) that stroll, stop at a table, and turn back. Block-local metres of block (1,-1), slab top y .15.
// Active only while the market block is loaded at full detail and the player is within 80 m. ?malt145npc=0 off.
import * as T from './vendor/three.module.min.js';
import {loadCrowd135,extendCrowd145,createPerson135,look135,blink135} from './crowd135.js?v=145f';
import {cityToWorld,CITY_ANGLE,CITY_BLOCK} from './urban-layout.js?v=return-1';
import {EXIT_CITY_Y as Y} from './exit-route.js?v=60';
import {MALTOSE145,MALTOSE145_ON} from './maltose145-layout.js?v=145c';
const PI=Math.PI,OFF=!MALTOSE145_ON||/[?&]malt145npc=0\b/.test(globalThis.location?.search||'');
const BX=MALTOSE145.block[0]*CITY_BLOCK,BZ=MALTOSE145.block[1]*CITY_BLOCK,KEY=MALTOSE145.block.join(','),Y0=.15;
// t = garment tint (multiply, may lift), hat = prop tint, s = height scale (M7: the near pair reads ~6 % taller in the photo)
const CAST=[
 {seed:0x14561,type:'man',sil:'jacket',face:'m6',top:'puffer',t:[1.45,1.45,1.55],bot:'greytrousers',props:['beanie'],hat:0x5a6a98,sit:[84.95,55.35,-PI/2-.3]},
 {seed:0x14562,type:'heavy',sil:'jacket',face:'m7',top:'puffer',t:[2.1,2.4,3.7],bot:'blackjeans',props:['cap'],hat:0x3b3b40,sit:[86.7,51.7,-PI/2+.2]},
 {seed:0x14563,type:'woman',sil:'coat',face:'f3',top:'wrap',bot:'blackjeans',props:['beanie'],hat:0xe8e6e2,stand:[76.76,58.88,PI/2+.4],s:1.05},
 {seed:0x14564,type:'man',sil:'jacket',face:'m8',top:'hoodie',t:[1.25,1.25,1.27],bot:'jeans',props:['cap'],hat:0xf4f4f2,stand:[76.5,58.1,.2],s:1.07},
 {seed:0x14565,type:'woman',sil:'jacket',face:'f2',top:'hoodie',t:[1.75,.42,.4],bot:'blackjeans',props:['beanie'],hat:0xd9c9a8,stand:[77.2,52.66,.4]},
 {seed:0x14566,type:'man',sil:'jacket',face:'m4',top:'hoodie',t:[.62,.62,.66],bot:'greytrousers',props:[],stand:[77.89,55.15,.05]},
 {seed:0x14567,type:'woman',sil:'coat',face:'f4',top:'trench',t:[1.12,1.12,1.1],bot:'jeans',props:[],stand:[85.76,53.46,PI/2-.2]},
 // walkers: path along z at x, from z0 to z1 and back; pause = seconds at each end (facing the side table at h)
 {seed:0x14568,type:'man',sil:'jacket',face:'m1',top:'leather',bot:'blackjeans',props:['beanie'],hat:0x2a2a2e,walk:{x:75.25,z0:55.7,z1:51.3,pause:4.5,face:-PI/2,speed:.72,ph:2}},
 {seed:0x14569,type:'man',sil:'coat',face:'m9',top:'wool',bot:'greytrousers',props:[],walk:{x:85.1,z0:48.9,z1:53.3,pause:3.5,face:PI/2,speed:.76,ph:9}}];
const RATE=v=>v/1.22;
// the bin's cap / beanie were sized for the pre-V139 heads and sit inside the V139 whole heads (+ hair shell): refit each
// hat's bind-space geometry to the person's own head box (uniform scale from the width, back + crown aligned, 1.2 cm clear)
const hatM=new Map(),hatMat=m=>{let q=hatM.get(m);if(!q){q=m.clone();q.side=T.DoubleSide;q.name='V145 hat';   // bin hat faces are wound inward (FrontSide showed nothing); the props135 knit is tan,
  // so the hat keeps only its luminance (knit / stitching detail) and takes the person's hat colour
  q.onBeforeCompile=sh=>{sh.fragmentShader=sh.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\n diffuseColor.rgb=vec3(min(1.,dot(texture2D(map,vMapUv).rgb,vec3(.299,.587,.114))*2.2))*diffuse;');};q.customProgramCacheKey=()=>'v145hat';hatM.set(m,q);}return q;};
const box=g=>{g.computeBoundingBox();return g.boundingBox;},hatG={};
function fitHat(lib,L,n,geo){const k=L.type+'/'+L.fk+'/'+n;if(hatG[k])return hatG[k];
 const H=lib.head(L.type,L.fk),hb=box(H.front).clone();if(L.hairIx>=0){const hg=lib.hairOf(L.type,L.fk,L.hairIx);if(hg)hb.union(box(hg));}
 const pb=box(geo),cx=(hb.min.x+hb.max.x)/2,kx=(hb.max.x-hb.min.x+.024)/(pb.max.x-pb.min.x),sc=Math.max(1,kx),g=geo.clone(),P=g.attributes.position;
 const px=(pb.min.x+pb.max.x)/2;
 for(let i=0;i<P.count;i++)P.setXYZ(i,cx+(P.getX(i)-px)*sc,hb.max.y+.012+(P.getY(i)-pb.max.y)*sc,hb.min.z-.012+(P.getZ(i)-pb.min.z)*sc);
 P.needsUpdate=true;g.computeBoundingSphere();return hatG[k]=g;}   // walk clip stride ~1.22 m per cycle at rate 1
// walker state at time t: [lx, lz, heading, moving]
function walkAt(W,t){const L=Math.abs(W.z1-W.z0),tw=L/W.speed,per=2*(tw+W.pause),u=((t+W.ph)%per+per)%per,dir=Math.sign(W.z1-W.z0);
 if(u<tw)return[W.x,W.z0+dir*u*W.speed,dir>0?0:PI,1];
 if(u<tw+W.pause)return[W.x,W.z1,W.face,0];
 if(u<2*tw+W.pause)return[W.x,W.z1-dir*(u-tw-W.pause)*W.speed,dir>0?PI:0,1];
 return[W.x,W.z0,W.face,0];}
export function createMaltose145Npc({blocks}){
 const object=new T.Group();object.name='V145 Maltose Market people';const solids=[],w={};let lib=null,loading=false,people=null;
 const stats={n:0,tris:0};
 function spawn(){people=CAST.map(c=>{const L=look135(lib,c.seed,{type:c.type,sil:c.sil,face:c.face,top:c.top,bot:c.bot,props:c.props});
   if(c.t)L.rT={...L.rT,t:c.t,h:0,v:1};else L.rT={...L.rT,h:0,v:1};L.rB={...L.rB,h:L.rB.h*.3,v:1};
   const hat=c.hat??0xffffff;L.propTint=n=>n==='cap'||n==='beanie'?hat:0xffffff;
   const p=createPerson135(lib,c.seed,{look:L});
   p.object.traverse(o=>{const m=/^crowd135 (cap|beanie)$/.exec(o.name);if(m&&o.geometry){o.geometry=fitHat(lib,L,m[1],o.geometry);o.material=hatMat(o.material);}});p.object.name='V145 '+(c.sit?'vendor ':'customer ')+c.face+' '+L.props.join('+')+' hair:'+L.hairStyle;object.add(p.object);return{c,p};});
  stats.tris=people.reduce((a,e)=>a+e.p.tris,0);}
 function update(wx,wz,active,cp){const v=blocks().get(KEY),near=cp&&Math.hypot(cp.x-(BX+80),cp.z-(BZ+44))<80;
  object.visible=!OFF&&active&&!!v&&(v.lod===0||v.lod===undefined)&&near;solids.length=0;if(!object.visible)return;
  if(!lib){if(!loading){loading=true;loadCrowd135().then(extendCrowd145).then(l=>{lib=l;}).catch(e=>console.warn('[maltose145-npc]',e));}return;}
  if(!people)spawn();const t=performance.now()*.001;stats.n=people.length;
  for(const{c,p}of people){let x,z,h,clip='idle',rate=1;
   if(c.sit){const[sx,sz,r]=c.sit;x=sx-Math.sin(r)*.16;z=sz-Math.cos(r)*.16;h=r;clip='sit';rate=.25;}
   else if(c.stand){[x,z,h]=c.stand;rate=.8;}
   else{const s=walkAt(c.walk,t);[x,z,h]=s;if(s[3]){clip='walk';rate=RATE(c.walk.speed);}}
   cityToWorld(BX+x,BZ+z,w);const o=p.object;o.position.set(w.x,Y+Y0+.004,w.z);o.rotation.set(0,CITY_ANGLE+h,0);o.scale.setScalar(c.s||1);
   p.update(t+(c.seed&7),clip,rate);p.setBlink(blink135(c.seed,t));
   if(!c.sit)solids.push({kind:'obb',x:w.x,z:w.z,w:.5,d:.4,ry:CITY_ANGLE+h});}}
 function dispose(){if(people)for(const{p}of people){p.object.removeFromParent();p.dispose();}people=null;object.removeFromParent();}
 return{object,update,solids,stats,dispose};
}
