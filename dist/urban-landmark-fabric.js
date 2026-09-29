import * as T from './vendor/three.module.min.js';
import {UrbanBatch} from './urban-batch.js?v=57';
import {URBAN_TILE_SIZE} from './urban-materials.js?v=57';
import {addStreetwallBuilding} from './urban-streetwall.js?v=57';
import {EXIT_CITY_Y,exitPoint} from './exit-route.js?v=57';
import {CITY_ORIGIN,CITY_ANGLE,cityToWorld} from './urban-layout.js?v=57';
import {CLINIC_ORIGIN,clinicToWorld} from './reference-scenes.js?v=57';
import {subtractConvex,TRANSITION_TERRAIN_QUADS,APPROACH_GROUND_QUADS} from './urban-ground-ownership.js?v=57';
import * as P from './urban-props.js?v=57';
import * as S from './urban-smallprops.js?v=57';
const PI=Math.PI,Y=EXIT_CITY_Y,cp=exitPoint(282),CLINIC_ANGLE=Math.atan2(cp.nx,cp.nz);
const frames={city:{...CITY_ORIGIN,ry:CITY_ANGLE,toWorld:cityToWorld},clinic:{...CLINIC_ORIGIN,ry:CLINIC_ANGLE,toWorld:clinicToWorld}};
export const LANDMARK_FABRIC_PARCELS=[
 ['city',-100,-80.5,-181,-145,'east',2,54001],['city',-100,-80.5,-139,-103,'east',3,54021],['city',-100,-80.5,-97,-61,'east',3,54041],['city',-100,-80.5,-55,-20,'east',4,54061],
 ['city',-63.5,-50.5,-181,-154,'west',2,54081],['city',-63.5,-46,-146,-112,'west',3,54101],['city',-63.5,-46,-106,-72,'west',3,54121],['city',-63.5,-46,-66,-20,'west',4,54141],
 ['city',44,64,-78,-56,'north',2,54201],['city',80,100,-78,-56,'north',3,54221],['city',44,64,-39,-17,'south',4,54241],['city',80,100,-39,-17,'south',5,54261],
 ['clinic',-21.76,1.9,50,72,'south',2,54301],['clinic',1.9,25.6,50,72,'south',2,54321],
 ['clinic',88,109,12,37,'west',2,54401],['clinic',88,109,43,72,'west',3,54421],['clinic',115,131,12,37,'east',2,54441],['clinic',115,131,43,68,'east',3,54461]
].map(([frame,x0,x1,z0,z1,front,floors,seed])=>({frame,x0,x1,z0,z1,front,floors,seed,retailBack:frame==='city'&&z0===-78}));
// Existing reserved-block asphalt owns these roads, except the rear clinic road:
// that rectangle replaces removed cobble and therefore supplies its own surface.
export const LANDMARK_ROAD_RECTS=[
 {frame:'city',x0:-77,x1:-67,z0:-193,z1:-12.5,name:'western local street'},
 {frame:'city',x0:-77,x1:-18,z0:-194.2,z1:-184.2,name:'approach crosslink'},
 {frame:'city',x0:39,x1:112,z0:-51.5,z1:-42.5,name:'northeast cross street'},
 {frame:'city',x0:67,x1:77,z0:-80,z1:-12.5,name:'northeast local street'},
 {frame:'clinic',x0:-21.76,x1:21.76,z0:38.3,z1:46.3,name:'clinic rear street',ownsAsphalt:true},
 {frame:'clinic',x0:76,x1:84,z0:-29,z1:98,name:'plaza street'},
 {frame:'clinic',x0:110.5,x1:113.5,z0:12,z1:72,name:'shared loading lane'}
];
const rect=(x0,x1,z0,z1,y=0)=>[[x0,y,z0],[x1,y,z0],[x1,y,z1],[x0,y,z1]];
const area=q=>Math.abs(q.reduce((n,p,i)=>{const a=q[(i+1)%q.length];return n+p[0]*a[2]-a[0]*p[2];},0))*.5;
const worldPolygon=(frame,x0,x1,z0,z1,y=0)=>rect(x0,x1,z0,z1,Y+y).map(([x,h,z])=>{const p=frames[frame].toWorld(x,z);return[p.x,h,p.z];});
export const LANDMARK_ROAD_POLYGONS=LANDMARK_ROAD_RECTS.map(q=>({...q,polygon:worldPolygon(q.frame,q.x0,q.x1,q.z0,q.z1).map(p=>[p[0],p[2]])}));
const place=(b,x,y,z,ry,fn,args={})=>{b.push(x,y,z,ry);fn(b,args);b.pop();};
function emitSlab(b,key,poly,bottom=Y-.04){
 if(poly.length<3||area(poly)<1e-7)return;const p=poly.slice(),signed=p.reduce((n,v,i)=>{const q=p[(i+1)%p.length];return n+v[0]*q[2]-q[0]*v[2];},0);if(signed>0)p.reverse();const v=[],uv=[],tile=URBAN_TILE_SIZE[key]||3.2;
 const add=(a,c,d)=>{const ac=c.map((n,i)=>n-a[i]),ad=d.map((n,i)=>n-a[i]),nx=ac[1]*ad[2]-ac[2]*ad[1],ny=ac[2]*ad[0]-ac[0]*ad[2],nz=ac[0]*ad[1]-ac[1]*ad[0],horizontal=Math.abs(ny)>Math.max(Math.abs(nx),Math.abs(nz));for(const q of[a,c,d]){v.push(...q);uv.push((horizontal?q[0]:Math.abs(nx)>Math.abs(nz)?q[2]:q[0])/tile,(horizontal?q[2]:q[1])/tile);}};
 for(let i=1;i<p.length-1;i++)add(p[0],p[i],p[i+1]);
 for(let i=0;i<p.length;i++){const a=p[i],c=p[(i+1)%p.length],d=[a[0],bottom,a[2]],e=[c[0],bottom,c[2]];add(a,d,c);add(c,d,e);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();b.add(g,key,0,0,0);g.dispose();
}
export function createLandmarkFabric(mats){
 const b=new UrbanBatch(mats),pavings=[],ramps=[],records=[],parcels=[],accepted=[];
 const slab=(frame,key,x0,x1,z0,z1,top=.15)=>{if(x1>x0&&z1>z0)pavings.push({key,poly:worldPolygon(frame,x0,x1,z0,z1,top),top:Y+top});};
 const withFrame=(name,fn)=>{const f=frames[name];b.push(f.x,Y,f.z,f.ry);fn();b.pop();};
 function ramp(frame,x0,x1,z0,z1,left,right){const f=frames[frame],poly=worldPolygon(frame,x0,x1,z0,z1);poly[0][1]=poly[3][1]=Y+left;poly[1][1]=poly[2][1]=Y+right;ramps.push({key:'sidewalk',poly});withFrame(frame,()=>b.walk((x0+x1)/2,(z0+z1)/2,x1-x0,z1-z0,(left+right)/2,(right-left)/(x1-x0)));}
 // Register sloping curb cuts before clipping flat paving; no duplicate top lies below them.
 for(const z of[30,61]){ramp('clinic',73.8,76,z-1.5,z+1.5,.15,0);ramp('clinic',84,86.2,z-1.5,z+1.5,0,.15);}
 for(const parcel of LANDMARK_FABRIC_PARCELS){
  const {frame,x0,x1,z0,z1,front,floors,seed,retailBack}=parcel,alongX=front==='north'||front==='south',w=alongX?x1-x0:z1-z0,d=alongX?z1-z0:x1-x0,ry={north:0,south:PI,east:PI/2,west:-PI/2}[front],n=Math.max(2,Math.min(4,Math.round(w/13))),step=w/n,key=frame==='clinic'?'photoGranite':'sidewalk',back=retailBack?3.5:1;
  const ext={x0,x1,z0,z1};if(front==='north'){ext.z0-=back;ext.z1+=3.5;}if(front==='south'){ext.z0-=3.5;ext.z1+=back;}if(front==='east'){ext.x0-=back;ext.x1+=3.5;}if(front==='west'){ext.x0-=3.5;ext.x1+=back;}
  slab(frame,key,ext.x0,ext.x1,ext.z0,ext.z1);const footprint=worldPolygon(frame,x0,x1,z0,z1).map(p=>[p[0],p[2]]);parcels.push({...parcel,footprint,buildings:n});
  withFrame(frame,()=>{b.push((x0+x1)/2,.15,(z0+z1)/2,ry);
   for(let i=0;i<n;i++){const u=-w/2+(i+.5)*step,type=['two_story_shops','corner_market','photo_studio','bank_branch','brick_walkup','laundromat'][(seed+i)%6],heroWall=frame==='clinic'&&seed===54421&&i===1,storeys=heroWall?14:floors+Number(i%3===1);b.push(u,0,0);addStreetwallBuilding(b,{type:heroWall?'brutalist_slab':type,w:step-.018,d,floors:storeys,seed:seed+137*i,lod:1,retailBack,heroWall});const p=b.point(0,0,0);records.push({type,x:p.x,z:p.z,w:step-.018,d,ry:b.frame.ry,floors:storeys,frame,parcel:parcels.length-1,retailBack});b.pop();}
   // Two-storey frontage can still have generous footways: trunks and poles use the curb strip.
   for(let u=-w/2+6.5;u<w/2-3;u+=13)place(b,u,0,d/2+2.65,0,P.addStreetTree,{seed:seed+Math.round(u*3),scale:.62});
   place(b,-w/2+2.2,0,d/2+2.7,0,P.addHydrant);place(b,w/2-2.0,0,d/2+2.6,PI/2,P.addStreetLight,{height:7.6,arm:1.8});if(seed%3===0)place(b,w/2-4.1,0,d/2+2.5,0,P.addTrashBin);
   if(retailBack){place(b,-w/2+2.2,0,-d/2-2.45,PI,P.addStreetTree,{seed:seed+511,scale:.61});place(b,w/2-2.0,0,-d/2-2.5,-PI/2,P.addStreetLight,{height:7.6,arm:1.65});}
   b.pop();
  });
 }
 // Real cross sections replace the blanket reservation: 3–3.5 m walks beside 8–10 m streets.
 slab('city','sidewalk',-80,-77,-193,-12.5);slab('city','sidewalk',-67,-64,-193,-12.5);
 slab('city','sidewalk',-80,-18,-197.7,-194.2);slab('city','sidewalk',-77,-18,-184.2,-180.7);
 slab('city','sidewalk',39,112,-55,-51.5);slab('city','sidewalk',39,112,-42.5,-39);
 slab('city','sidewalk',64,67,-80,-12.5);slab('city','sidewalk',77,80,-80,-12.5);
 slab('clinic','photoGranite',-21.76,25.6,34.8,38.3);slab('clinic','photoGranite',-21.76,25.6,46.3,50);
 slab('clinic','photoGranite',71.5,76,-29,98);slab('clinic','photoGranite',84,88,9,75.5);slab('clinic','district:pavers',70,71.5,18.4,77,.12);
 // All flat pieces are unioned geometrically, including differently oriented parcel boundaries.
 // Claim road footprints and curb ramps first, then subtract every earlier pavement owner.
 const corridorHoles=[...TRANSITION_TERRAIN_QUADS,...APPROACH_GROUND_QUADS].map(poly=>poly.map(([x,z])=>{const p=cityToWorld(x,z);return[p.x,p.z];}));
 const holes=[...LANDMARK_ROAD_POLYGONS.map(q=>q.polygon),...corridorHoles],rampHoles=ramps.map(q=>q.poly.map(p=>[p[0],p[2]]));
 for(const q of ramps){emitSlab(b,q.key,q.poly);accepted.push(q.poly.map(p=>[p[0],p[2]]));}
 for(const q of pavings){let pieces=[q.poly];for(const h of [...holes,...rampHoles,...accepted])pieces=pieces.flatMap(p=>subtractConvex(p,h)).filter(p=>area(p)>1e-7);for(const p of pieces){emitSlab(b,q.key,p);const polygon=p.map(v=>[v[0],v[2]]);accepted.push(polygon);b.walks.push({polygon,y:q.top});}}
 // The replaced part of the old cobble court has exactly one asphalt owner.
 for(const q of LANDMARK_ROAD_RECTS.filter(q=>q.ownsAsphalt)){const poly=worldPolygon(q.frame,q.x0,q.x1,q.z0,q.z1);emitSlab(b,'asphalt',poly,Y-.07);b.walks.push({polygon:poly.map(v=>[v[0],v[2]]),y:Y});}
 withFrame('city',()=>{
  for(let z=-179;z<-19;z+=9){if(z>-54&&z<-39)continue;for(const x of[-72.16,-71.84])b.box('yellow',x,.008,z,.09,.008,4,0,.71);if(Math.round(z)%3===0)place(b,-68.1,.003,z,0,P.addStormDrain);}
  for(let x=43;x<109;x+=8){if(x>64&&x<80)continue;b.box('white',x,.008,-47,3.2,.008,.095,0,.69);}
  for(let z=-72;z<-17;z+=9){if(z>-56&&z<-38)continue;b.box('white',72,.008,z,.095,.008,3.2,0,.69);}
  for(const [x,z] of[[-72,-158],[-72,-111],[-72,-43],[93,-47],[72,-24]])place(b,x,.004,z,0,P.addManhole);
  for(const[x,z]of[[-68,-191],[-76,-99],[78,-52],[66,-41]])place(b,x,.004,z,0,P.addStormDrain);
  place(b,-65.3,.15,-187.7,PI/2,P.addStreetSign,{kind:'speed'});place(b,65.6,.15,-53,0,P.addStreetSign,{kind:'oneway'});
 });
 withFrame('clinic',()=>{
  for(let z=-20;z<92;z+=9){if(Math.abs(z-30)<4||Math.abs(z-61)<4)continue;b.box('white',80,.008,z,.09,.008,3.3,0,.66);}
  for(const z of[30,61])for(let x=76.5;x<83.6;x+=1.0)b.box('white',x,.009,z,.49,.009,2.65,0,.73);
  for(const z of[-7,47,86])place(b,79,.004,z,0,P.addManhole);for(const z of[14,42,74])place(b,75.63,.004,z,PI/2,P.addStormDrain);
  for(const x of[-17,-4,10])b.box('white',x,.009,42.3,3.7,.009,.09,0,.64);place(b,14.5,.004,42.3,0,P.addManhole);place(b,-10,.004,38.62,0,P.addStormDrain);
  for(const [x,z]of[[74.8,16],[85.1,70.5]])place(b,x,.15,z,PI/2,P.addStreetSign,{kind:'pedestrian'});
  place(b,111.95,0,22,0,S.addDumpster);place(b,111.95,0,53,PI,S.addDumpster);place(b,85.8,.15,11.7,PI/2,S.addNewspaperBox,{color:'yellow',seed:54});
 });
 const object=b.finish('Landmark fabric / connected neighborhood blocks');object.userData.parcels=parcels.length;object.userData.pavingPieces=accepted.length;return{object,walks:b.walks,colliders:b.colliders,records,parcels,buildings:records.length,pavingPolygons:accepted,roads:LANDMARK_ROAD_POLYGONS};
}
