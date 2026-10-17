// V131-L11-shells C: empty lots left around the Nick's Gaslight replica. urban-layout.js (V122/V123) drops the procedural
// lots of blocks 1,1 / 2,0 / 2,2 that the photo (image-48) does not show; where the authored replica buildings do not cover
// the dropped lot, bare ground was left. These lots get low procedural streetwall buildings (same generator and textures as
// the rest of Level 11: urban-streetwall.js, 100-room hashed shop interiors), chosen so they stay out of the F2
// 'photo-block122' frame or sit fully behind an authored building in it (angles + heights in notes/version-history V131).
// Each lot is checked against the authored footprints and the block's kerb line before it is built (skipped + warned if not
// clear), and gets two LOD levels (full detail < 150 m, lod 1 beyond) so the far view costs little.
import * as T from './vendor/three.module.min.js';
import {UrbanBatch} from './urban-batch.js?v=69';
import {addStreetwallBuildingTask} from './urban-streetwall.js?v=76';
import {CITY_ORIGIN,CITY_ANGLE,CITY_BLOCK,cityToWorld,cityBlockPlan} from './urban-layout.js?v=60';
import {EXIT_CITY_Y} from './exit-route.js?v=60';
const PI=Math.PI,B=CITY_BLOCK;
// city coords (x east, z south), lot centre / facing / width along the front / depth, as cityBlockPlan would have placed them
export const FILL131=[
 {id:'1,1 north row east',type:'two_story_shops',x:202.92,z:136,ry:PI,w:18.13,d:24,floors:1,seed:3034560342},   // behind brick3 in the F2 frame (1 floor: 2 floors peeked over it)
 {id:'1,1 east side',type:'laundromat',x:201,z:157.85,ry:PI/2,w:19.67,d:22,floors:1,seed:1393971634},             // behind brick3 / Nick's (1 floor, same reason)
 {id:'1,1 north row west',type:'laundromat',x:150.95,z:136,ry:PI,w:14,d:24,floors:1,seed:1632757447},           // behind the hotel tower
 {id:'2,2 west side south',type:'brick_walkup',x:247,z:290.8,ry:-PI/2,w:18.37,d:22,floors:5,seed:2696445509},     // outside the frame (47 deg right)
 {id:'2,2 north row',type:'photo_studio',x:270.85,z:248,ry:PI,w:12.3,d:24,floors:3,seed:3150968057},              // outside the frame, east of the loft
 {id:'2,0 north row',type:'strip_mall',x:268.25,z:24,ry:PI,w:17.5,d:24,floors:2,seed:4036171439}];               // behind the yellow tower + wing
// authored footprints in city coords (procedural lots the plan keeps are checked too)
// city coords (block122-scene.js; block (1,2) frame x+112, z = 336 - v)
const R=(x0,x1,z0,z1)=>[[x0,z0],[x1,z0],[x1,z1],[x0,z1]];
export const AUTHORED131=[
 {id:'hotel',p:[[108.6,183.6],[152.8,211],[173.6,177.4],[129.4,150]]},{id:'midA',p:R(158.5,168.5,126,146)},{id:'midB',p:R(168.5,191.5,126,146)},
 {id:'brick3',p:R(198.5,209.5,190,210)},{id:'brown2',p:R(174,192,190,208)},{id:'loft',p:R(236,264,236,272)},{id:'yellow',p:R(250,269,80,100)},
 {id:'gothic site',p:R(235.5,258.5,12,36)},{id:'fence lot',p:R(238,264,112,122)},{id:'KQB billboard',p:R(234,245,176,180)}];
function corners(q){const c=Math.cos(q.ry),s=Math.sin(q.ry);return[[-1,-1],[1,-1],[1,1],[-1,1]].map(([a,b])=>[q.x+c*a*q.w/2+s*b*q.d/2,q.z-s*a*q.w/2+c*b*q.d/2]);}
function sat(A,Bp,pad=.5){for(const P of[A,Bp])for(let i=0;i<P.length;i++){const p=P[i],q=P[(i+1)%P.length],nx=q[1]-p[1],nz=p[0]-q[0];let a0=1e9,a1=-1e9,b0=1e9,b1=-1e9;
 for(const v of A){const d=v[0]*nx+v[1]*nz;a0=Math.min(a0,d);a1=Math.max(a1,d);}for(const v of Bp){const d=v[0]*nx+v[1]*nz;b0=Math.min(b0,d);b1=Math.max(b1,d);}const L=Math.hypot(nx,nz);if(a1+pad*L<b0||b1+pad*L<a0)return false;}return true;}
// placement check: inside the kerb ring of its block (road half 7.5 + sidewalk 4.5 = 12 m from the block edge), clear of every
// authored footprint and of the other fill lots
export function checkFill131(list=FILL131){const ok=[],bad=[];
 for(const q of list){const c=corners(q),ix=Math.floor(q.x/B),iz=Math.floor(q.z/B),x0=ix*B+12-.05,x1=ix*B+100+.05,z0=iz*B+12-.05,z1=iz*B+100+.05;
  const inBlock=c.every(([x,z])=>x>=x0&&x<=x1&&z>=z0&&z<=z1),hit=AUTHORED131.find(a=>sat(c,a.p))||cityBlockPlan(ix,iz,[]).buildings.map(k=>({id:'procedural '+k.type,p:corners(k)})).find(a=>sat(c,a.p,.01)),hit2=ok.find(o=>sat(c,corners(o),.01));
  (inBlock&&!hit&&!hit2?ok:bad).push(inBlock&&!hit&&!hit2?q:{...q,why:!inBlock?'outside kerb ring':hit?'overlaps '+hit.id:'overlaps '+hit2.id});}
 return{ok,bad};}
function build(mats,spec,lod){const b=new UrbanBatch(mats);b.push(CITY_ORIGIN.x,0,CITY_ORIGIN.z,CITY_ANGLE);b.push(spec.x,EXIT_CITY_Y+.15,spec.z,spec.ry);
 const g=addStreetwallBuildingTask(b,{...spec,lot:'commercial',streetwall:true,lod});let s;do{s=g.next();}while(!s.done);b.pop();b.pop();return b;}
export function createFill131(mats){
 const group=new T.Group();group.name='V131 fill lots around the Nick\'s Gaslight replica';const colliders=[],walks=[],{ok,bad}=checkFill131();
 for(const q of bad)console.warn('[fill131] skipped lot',q.id,q.why);
 for(const spec of ok){const b0=build(mats,spec,0),b1=build(mats,spec,1);colliders.push(...b0.colliders);walks.push(...b0.walks);
  const c=cityToWorld(spec.x,spec.z),lod=new T.LOD();lod.name='fill131 '+spec.id;lod.position.set(c.x,EXIT_CITY_Y,c.z);
  for(const[b,dist]of[[b0,0],[b1,150]]){const o=b.finish('fill131 '+spec.id+' lod'+(dist?1:0));o.position.set(-c.x,-EXIT_CITY_Y,-c.z);const w=new T.Group();w.add(o);lod.addLevel(w,dist);}
  group.add(lod);}
 group.userData.fill131={built:ok.map(q=>q.id),skipped:bad.map(q=>q.id+': '+q.why)};
 return{object:group,colliders,walks};}
