import {adFor} from './advertising-assets.js?v=60';
import {poleSign,monumentSign,posterStand,googieSign} from './advertising-structures.js?v=60';
import {TRANSITION_TERRAIN_QUADS,FABRIC_GROUND_POLYGON,HOPE_GROUND_RECTS,subtractRectangles,subtractConvex,APPROACH_GROUND_QUADS,CLINIC_GROUND_POLYGON,DISTRICT_GROUND_POLYGONS} from './urban-ground-ownership.js?v=60';
import * as T from './vendor/three.module.min.js';
import {urbanRandom} from './urban-batch.js?v=69';
import * as P from './urban-props.js?v=60';
import * as S from './urban-smallprops.js?v=60';
import {CITY_BLOCK as B,CITY_ROAD_HALF as R,CITY_SIDEWALK as W,worldToCity} from './urban-layout.js?v=60';
import {EXIT_CITY_Y as Y} from './exit-route.js?v=60';
import {canalBlockTask} from './canal128.js?v=128';
import {CANAL} from './canal128-layout.js?v=128';
import {subwayEntrances} from './subway128.js?v=128';
import {subwayStairs,SUB} from './subway128-layout.js?v=128';
const PI=Math.PI;
// V131m: street furniture never lands in or right in front of a subway opening (city rects incl. a 2 m apron, set per block)
let KEEP_CLEAR=[];
const place=(b,x,y,z,ry,fn,args)=>{const w=b.point(x,y,z),p=worldToCity(w.x,w.z);if(p.x>4.5&&p.x<33.5&&p.z>443&&p.z<471)return;if(KEEP_CLEAR.some(r=>p.x>r[0]&&p.x<r[1]&&p.z>r[2]&&p.z<r[3]))return;b.push(x,y,z,ry);fn(b,args||{});b.pop();};
function face(b,key,points){const g=new T.BufferGeometry(),p=[];for(const i of[0,1,2,0,2,3])p.push(...points[i]);g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.computeVertexNormals();if(g.attributes.normal.getY(0)<-.001){const a=g.attributes.position;for(let j=0;j<a.count;j+=3){const v=[a.getX(j+1),a.getY(j+1),a.getZ(j+1)];a.setXYZ(j+1,a.getX(j+2),a.getY(j+2),a.getZ(j+2));a.setXYZ(j+2,...v);}g.computeVertexNormals();}b.add(g,key,0,0,0);g.dispose();}
export function pavement(b,x,z,w,d,top=.15){b.box('sidewalk',x,top/2,z,w,top,d);b.walk(x,z,w,d,top);}
// The street side is -Z. A 4 cm bevel connects the vertical curb to its top.
// V131m: kerb = grey granite stones (0.725 m, joints aligned with the 1.45 m sidewalk slabs when `along0` is given), explicit
// UVs, top 3 mm proud of the pavement so the two never z-fight (the old kerb top was coplanar with the sidewalk box).
const K131=new URL('./assets/l11-v131m/',import.meta.url).href;
function kerbMats(m){if(m.kerb131)return;const ld=new T.TextureLoader(),tx=(n,s=true)=>{const t=ld.load(K131+n+'.webp?v=131');if(s)t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;return t;};
 m.kerb131=new T.MeshStandardMaterial({map:tx('kerb'),normalMap:tx('kerb-n',false),roughness:.85,vertexColors:true,side:T.DoubleSide});m.kerb131.name='V131 kerb granite';
 m.pave131=new T.MeshStandardMaterial({map:tx('pave_slab'),normalMap:tx('pave_slab-n',false),roughness:.93,vertexColors:true});m.pave131.name='V131 sidewalk slabs';}
export function curb(b,x,z,length,ry=0,height=.15,along0=null){kerbMats(b.mats);b.push(x,0,z,ry);const a=-length/2,c=length/2,h=height+.003,q=[[0,0],[0,h-.04],[.04,h],[.24,h],[.24,0]],K=.725,o=along0===null?a:along0-x,ua=(a-o)/K,uc=(c-o)/K;
 let acc=0;for(let i=0;i<4;i++){const d=Math.hypot(q[i+1][0]-q[i][0],q[i+1][1]-q[i][1]);const va=acc/.6,vc=(acc+d)/.6;acc+=d;
  const P=[[a,q[i][1],q[i][0]],[a,q[i+1][1],q[i+1][0]],[c,q[i+1][1],q[i+1][0]],[c,q[i][1],q[i][0]]],U=[[ua,va],[ua,vc],[uc,vc],[uc,va]];
  const g=new T.BufferGeometry(),p=[],u=[];for(const j of[0,1,2,0,2,3]){p.push(...P[j]);u.push(...U[j]);}g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(u,2));g.computeVertexNormals();
  if(g.attributes.normal.getY(0)<-.001){const A=g.attributes.position,B=g.attributes.uv;for(let j=0;j<A.count;j+=3){const v=[A.getX(j+1),A.getY(j+1),A.getZ(j+1)],w=[B.getX(j+1),B.getY(j+1)];A.setXYZ(j+1,A.getX(j+2),A.getY(j+2),A.getZ(j+2));B.setXY(j+1,B.getX(j+2),B.getY(j+2));A.setXYZ(j+2,...v);B.setXY(j+2,...w);}g.computeVertexNormals();}
  b.add(g,'kerb131',0,0,0);g.dispose();}
 b.pop();}
// V131m frontage sidewalk: slab grid 1.45 m along (joints at x = 14 + 1.45k, i.e. every old 2.9 m joint and one between) x
// (W-.24)/3 across, starting at the kerb back, so slab joints, kerb joints and the tree pits line up. Box below keeps the body.
function slabs(b,x0,x1,z0,z1,top=.15){kerbMats(b.mats);if(x1-x0<.01||z1-z0<.01)return;b.box('sidewalk',(x0+x1)/2,top/2-.006,(z0+z1)/2,x1-x0,top-.012,z1-z0);const SX=1.45,SZ=(W-.24)/3,ua=(x0-14)/SX,uc=(x1-14)/SX,va=(z0-R-.24)/SZ,vc=(z1-R-.24)/SZ;
 const g=new T.BufferGeometry(),P=[[x0,top,z0],[x0,top,z1],[x1,top,z1],[x1,top,z0]],U=[[ua,va],[ua,vc],[uc,vc],[uc,va]],p=[],u=[];for(const j of[0,1,2,0,2,3]){p.push(...P[j]);u.push(...U[j]);}
 g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(u,2));g.computeVertexNormals();if(g.attributes.normal.getY(0)<0){const A=g.attributes.position,B=g.attributes.uv;for(let j=0;j<A.count;j+=3){const v=[A.getX(j+1),A.getY(j+1),A.getZ(j+1)],w=[B.getX(j+1),B.getY(j+1)];A.setXYZ(j+1,A.getX(j+2),A.getY(j+2),A.getZ(j+2));B.setXY(j+1,B.getX(j+2),B.getY(j+2));A.setXYZ(j+2,...v);B.setXY(j+2,...w);}g.computeVertexNormals();}
 b.add(g,'pave131',0,0,0);g.dispose();const w0=Math.abs(z0-R-.24)<1e-6?R:z0;b.walk((x0+x1)/2,(w0+z1)/2,x1-x0,z1-w0,top);}
function ramp(b,x,z,w,d,ry){b.push(x,0,z,ry);face(b,'sidewalk',[[-w/2,0,-d/2],[-w/2,.15,d/2],[w/2,.15,d/2],[w/2,0,-d/2]]);b.walk(0,0,w,d,.075,0,.15/d);for(let j=0;j<4;j++)for(let i=0;i<8;i++)b.cylinder('yellow',-w*.40+i*w*.114,.034+j*.014,-d*.34+j*.4,.025,.025,.009,6);b.pop();}
export function roadHeight(x,z){const near=v=>Math.min(((v%B)+B)%B,B-((v%B)+B)%B),d=Math.min(near(x),near(z));return d<=R?.045*(1-d/R):0;}
function roadHalf(b,ry){b.push(0,0,0,ry);face(b,'asphalt',[[0,.045,R],[0,.045,B-R],[R,0,B-R],[R,0,R]]);b.pop();}
function roads(b,cn){
 // Each block owns four half-roads; adjoining halves share the crown exactly. V128: the canal photo reach drops one N-S road.
 if(!cn?.noRoadW)roadHalf(b,0);if(!cn?.noRoadE){b.push(B,0,B,PI);roadHalf(b,0);b.pop();}
 b.push(B,0,0,-PI/2);roadHalf(b,0);b.pop();b.push(0,0,B,PI/2);roadHalf(b,0);b.pop();
 // Intersections use the same height as both street axes, avoiding raised seams.
 for(const x of[0,B])for(const z of[0,B]){const sx=x===0?1:-1,sz=z===0?1:-1;face(b,'asphalt',[[x,.045,z],[x,.045,z+sz*R],[x+sx*R,0,z+sz*R],[x+sx*R,.045,z]]);}
}
function corner(b,x,z,ry){b.push(x,0,z,ry);face(b,'sidewalk',[[0,.15,W],[W,.15,0],[W,.15,W],[0,.15,W]]);b.walk(W*.70,W*.70,W*.60,W*.60,.15);curb(b,W/2,W/2,W*Math.SQRT2,PI/4);b.pop();}
function* frontageTask(b,seed,lod,ry,portal,exclude,canalSpan,hole){
 const inHole=x=>hole&&x>hole[0]-1.2&&x<hole[1]+1.2;
 b.push(56,0,56,ry);b.push(-56,0,-56);
 for(let[a,c]of(portal?[[12,14],[16,53],[59,96],[98,100]]:[[12,14],[16,96],[98,100]])){if(exclude){if(a>=exclude[0]&&c<=exclude[1])continue;if(a<exclude[0]&&c>exclude[0])c=exclude[0];else if(a<exclude[1]&&c>exclude[1])a=exclude[1];}if(hole&&a<hole[1]&&c>hole[0]){for(const[e,f]of[[a,Math.max(a,hole[0])],[Math.min(c,hole[1]),c]])if(f-e>.01)slabs(b,e,f,R+.24,R+W);const e=Math.max(a,hole[0]),f=Math.min(c,hole[1]);slabs(b,e,f,R+.24,SUB.stairX0);slabs(b,e,f,SUB.stairX1,R+W);}else slabs(b,a,c,R+.24,R+W);curb(b,(a+c)/2,R,c-a,0,.15,14);yield;}
 if(portal)ramp(b,56,R+W/2,6,W,0);yield;
 // (V131m) slab joints every 1.45 m along, three slabs across.
 // V131m: joints come from the slab texture (aligned to the kerb); the extra joint boxes and the gutter strip are gone.
 yield;
 const r=urbanRandom(seed),stations=[];for(let x=17;x<98;x+=9)stations.push(x);
 for(let i=0;i<stations.length;i++){
  const x=stations[i];if(portal&&x>51&&x<61)continue;if(canalSpan&&x>CANAL.p0-2&&x<CANAL.p1+2)continue;if(inHole(x))continue;const z=R+1.05;
  if(i===3&&!lod&&seed%3===0){const kind=['pylon','monument','poster','googie'][(seed>>>3)%4],fn={pylon:poleSign,monument:monumentSign,poster:posterStand,googie:googieSign}[kind];place(b,x,.15,z,PI,bb=>fn(bb,adFor(seed*13,kind),0,0,kind==='poster'?6.9:3.2));}
  else if(i%2===0){place(b,x,.15,z,0,P.addStreetTree,{seed:seed+i*771,scale:.88+(i%3)*.055});}
  else if(!lod){const k=(seed+i)%5;place(b,x,.15,z,PI,k===0?P.addHydrant:k===1?P.addParkingMeter:k===2?P.addTrashBin:k===3?S.addNewspaperBox:S.addBikeRack,{seed:seed+i,color:['blue','yellow','red'][i%3]});}
  yield;
 }
 if(!inHole(30))place(b,30,.15,R+.65,PI/2,P.addStreetLight,{height:8.5,arm:2.4});yield;if(!inHole(83))place(b,83,.15,R+.65,PI/2,P.addStreetLight,{height:8.5,arm:2.4});yield;
 if(canalSpan){b.pop();b.pop();return;}
 if(!lod){
  place(b,13.2,.15,10.5,PI,S.addNewspaperBox,{seed,color:'yellow'});place(b,14.0,.15,10.5,PI,S.addNewspaperBox,{seed:seed+1,color:'blue'});yield;
  place(b,96.5,.15,10,PI,P.addUtilityCabinet,{variant:seed%2});place(b,96.5,.15,10,PI,S.addUtilityDetails,{seed,...(seed%2?{width:.76,height:1.32,depth:.43}:{})});yield;
  if(seed%3!==0&&!inHole(44))place(b,44,.15,R+1.0,PI,P.addParkingMeter);if(!inHole(72))place(b,72,.15,R+1.0,PI,P.addParkingMeter);
  if(!inHole(23))place(b,23,.15,R+.58,PI,P.addStreetSign,{kind:seed%3?'restrict':'speed'});
  if(portal)for(const x of[52.5,59.5])place(b,x,.15,10.7,0,P.addBollard);
  if(seed%3===0)place(b,70,.05,5.85,PI/2,S.addParkedSedan,{seed});yield;
 }
 place(b,29,.022,R-.31,0,P.addStormDrain);place(b,92,.022,R-.31,0,P.addStormDrain);
 for(let k=0;k<5;k++){const x=20+r()*74,z=1+r()*5.7;let prev=[x,roadHeight(x,z)+.012,z];for(let j=0;j<5;j++){const next=[prev[0]+.3+r()*.55,roadHeight(prev[0],prev[2])+.012,prev[2]+(r()-.5)*.4];b.rod('rubber',prev,next,.015);prev=next;}}
 b.pop();b.pop();
}
export function* addBlockStreetsTask(b,plan,lod){
 b.push(plan.x,Y,plan.z);
 if(plan.reserved){for(const[a,c,u,v]of subtractRectangles(plan.x,plan.x+B,plan.z,plan.z+B,HOPE_GROUND_RECTS)){let pieces=[[[a,0,u],[a,0,v],[c,0,v],[c,0,u]]];if(plan.z<0)for(const shape of[FABRIC_GROUND_POLYGON,...TRANSITION_TERRAIN_QUADS,...APPROACH_GROUND_QUADS,CLINIC_GROUND_POLYGON,...DISTRICT_GROUND_POLYGONS]){const xs=shape.map(p=>p[0]),zs=shape.map(p=>p[1]);if(Math.max(...xs)<a||Math.min(...xs)>c||Math.max(...zs)<u||Math.min(...zs)>v)continue;pieces=pieces.flatMap(p=>subtractConvex(p,shape));}for(const poly of pieces){const g=new T.BufferGeometry(),pos=[];for(let k=1;k<poly.length-1;k++)for(const p of[poly[0],poly[k],poly[k+1]])pos.push(p[0]-plan.x,p[1],p[2]-plan.z);g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.computeVertexNormals();b.add(g,'asphalt',0,0,0);g.dispose();yield;}}b.pop();return;}
 const cn=plan.canal;
 const stairs=subwayStairs(plan.ix,plan.iz),holes=stairs.map(q=>[q.x0,q.x1,q.z0,q.z1]);KEEP_CLEAR=stairs.map(q=>q.axis==='z'?[plan.x+q.x0-1.2,plan.x+q.x1+1.2,plan.z+q.z0-3.2,plan.z+q.z1]:[plan.x+q.x0-3.2,plan.x+q.x1,plan.z+q.z0-1.2,plan.z+q.z1+1.2]);if(cn)holes.push([0,B,CANAL.z0,CANAL.z1]);
 {const xs=[0,B],zs=[0,B];for(const h of holes){xs.push(h[0],h[1]);zs.push(h[2],h[3]);}const ux=[...new Set(xs)].sort((a,b)=>a-b),uz=[...new Set(zs)].sort((a,b)=>a-b);
  for(let i=0;i<ux.length-1;i++)for(let j=0;j<uz.length-1;j++){const a=ux[i],c=ux[i+1],u=uz[j],v=uz[j+1],x=(a+c)/2,z=(u+v)/2;if(holes.some(h=>x>h[0]&&x<h[1]&&z>h[2]&&z<h[3]))continue;b.box('asphalt',x,-.035,z,c-a,.07,v-u);}}
 const holeFor=side=>{for(const q of stairs){if(side===1&&q.axis==='z')return[B-q.z1,B-q.z0];if(side===0&&q.axis==='x')return[q.x0,q.x1];}return null;};
 roads(b,cn);yield;
 // Sidewalk ring surrounds occupied lots, with six-metre rear-access portals.
 const joinsLandmark=plan.ix===0&&plan.iz===4;for(let side=0;side<4;side++){if(cn&&((side===1&&cn.noRoadW)||(side===3&&cn.noRoadE)))continue;yield* frontageTask(b,plan.seed+side*29,lod,side*PI/2,side%2===0,joinsLandmark?(side===0?[0,33]:side===1?[76,112]:null):null,cn&&side%2===1,holeFor(side));}
 for(const[x,z,ry]of[[R,R,0],[B-R,R,-PI/2],[B-R,B-R,PI],[R,B-R,PI/2]]){if(joinsLandmark&&x===R&&z===R)continue;if(cn&&((x===R&&cn.noRoadW)||(x===B-R&&cn.noRoadE)))continue;corner(b,x,z,ry);yield;}
 // Four lanes total: 3.15 m travel lanes with narrow parking/curb space.
 const xr=e=>!(cn&&((e===0&&cn.noRoadW)||(e===B&&cn.noRoadE)));
 for(const edge of[0,B])for(const offset of[-.14,.14]){if(xr(edge))b.box('yellow',edge+offset,.056,56,.10,.008,77,0,.87);b.box('yellow',56,.056,edge+offset,77,.008,.10,0,.87);}
 for(const edge of[0,B])for(const lane of[-3.2,3.2])for(let k=22;k<95;k+=8){const y=.045*(1-Math.abs(lane)/R)+.013;if(xr(edge))b.box('white',edge+lane,y,k,.09,.009,3,0,.81);b.box('white',k,y,edge+lane,3,.009,.09,0,.81);yield;}
 for(const edge of[0,B])for(const q of[15,97]){for(let k=-5;k<=5;k++){const u=k*1.25,y=.045*(1-Math.abs(u)/R)+.016;if(xr(edge))b.box('white',edge+u,y,q,.58,.009,2.5,0,.83);b.box('white',q,y,edge+u,2.5,.009,.58,0,.83);}if(xr(edge))b.box('white',edge,.056,q+(q<56?2:-2),14,.01,.25,0,.85);b.box('white',q+(q<56?2:-2),.056,edge,.25,.01,14,0,.85);yield;}
 // Curb cuts slope into the crossing, instead of sticking a white edge onto asphalt.
 for(const edge of[0,B])for(const q of[15,97]){if(joinsLandmark&&edge===0&&q===15)continue;const sign=edge===0?1:-1;if(!(cn&&((q===15&&cn.noRoadW)||(q===97&&cn.noRoadE))))ramp(b,q,edge+sign*(R+W/2),2.0,W,edge===0?0:PI);if(xr(edge))ramp(b,edge+sign*(R+W/2),q,2.0,W,edge===0?PI/2:-PI/2);yield;}
 if(xr(0))place(b,9.2,.15,16,PI,P.addTrafficSignal,{arm:10.8,street:plan.iz%3?'olive':'hope'});yield;if(xr(B))place(b,102.8,.15,96,0,P.addTrafficSignal,{arm:10.8,street:plan.ix%2?'grand':'hope'});yield;
 for(const[x,z]of[[3.6,42],[78,108.6]])if(x>12||xr(0))place(b,x,roadHeight(x,z)+.008,z,0,P.addManhole);
 subwayEntrances(b,plan,lod);yield;
 if(cn||plan.canalExtra){yield* canalBlockTask(b,plan,lod);if(cn){b.pop();return;}}
 // Real inner service court, bounded by the backs of continuous perimeter buildings.
 b.box('asphalt',56,.008,56,44,.016,40);for(const z of[24,88])b.box('asphalt',56,.008,z,6,.016,24);b.walk(56,56,6,88,.016);for(const front of[true,false]){b.push(56,0,front?13:99,front?0:PI);face(b,'sidewalk',[[-3,.15,-1],[-3,.016,1],[3,.016,1],[3,.15,-1]]);b.walk(0,0,6,2,.083,0,-.067);b.pop();}
 for(const z of[38.0,74.0]){place(b,44,.025,z,0,S.addDumpster);place(b,64,.025,z,0,P.addUtilityCabinet,{variant:1});yield;}
 if(!lod){for(const x of[39,43,47,65,69,73]){b.box('white',x,.028,56,.08,.009,5.0,0,.57);place(b,x+1.6,.02,58,0,P.addWheelStop);}if(plan.seed%2===0)place(b,70,.026,54,0,S.addParkedSedan,{seed:plan.seed+377});}
 b.pop();
}

export function addBlockStreets(...args){const task=addBlockStreetsTask(...args);let step;do{step=task.next();}while(!step.done);return step.value;}
