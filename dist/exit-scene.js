import {createMillingMouth} from './milling-return-scene.js';
import {returnWaypoint,worldToReturn,returnSample,returnFloor} from './milling-return-layout.js';
import {setInfillObstacles} from './urban-infill-return.js';
import {attachTikiPaving80} from './tiki-paving-v80.js';
import {createTikiFacade} from './tiki-facade-v80.js';
import {createSpringEntrance} from './level27-entry.js?v=75';
import {createBackcourt} from './backcourt-scene-v70.js';
import {createCornerResidue} from './backcourt-residue-v71.js';
import {attachCornerGround} from './backcourt-ground-v71.js';
import {createLandmarkGround} from './landmark-ground.js?v=60';
import {createLandmarkFabric} from './urban-landmark-fabric.js?v=76';
import {addDistrictMaterials,fountainClock,fountainCenter} from './clinic-district-materials.js?v=60';
import {plaza133} from './palm133-plaza.js?v=133p';
import {CAPITAL135_GEO} from './capital135/geo/index.js?v=135g'; // V135 ②c-2b-2 cooked batch roots (shell + stream)
import {geo135Enabled,shell135,loadCapitalGeo135} from './capital135-geo.js?v=135h';
import {soho135BuildingTask} from './soho135-street.js?v=135v'; // V135-capital ③ SoHo street frontage
import {soho135FairTask} from './soho135-fair.js?v=135t'; // V135-capital ③-2 SoHo street fair (closed road x=-224)
import {spire135Task} from './soho135-spire.js?v=135v'; // ③-3b SoHo focal spire tower
import {sohoBake135} from './soho135-bake.js?v=135w'; // ③-3c per-block Blender bake of the streamed SoHo blocks
import {CAPITAL135_LAZY} from './capital135/geo/lazy.js?v=135h'; // V135 ②c-2b-2b deferred roots (photo landmarks, milling mouth)
import {ubox132} from './street132-props.js?v=132';
import {createClinicDistrict} from './clinic-district.js?v=60';
import {clipPolygon,subtractConvex,cityGroundPoint,approachRoadHalf,approachRoadTop,addApproachGroundMaterial} from './urban-ground-ownership.js?v=60';
import * as T from './vendor/three.module.min.js';
import {exitPoint,exitSample,exitSurface,ease,EXIT_CITY_Y} from './exit-route.js?v=60';
import {height} from './world.js?v=60';
import {createUrbanMaterials} from './urban-materials.js?v=60';
import {UrbanBatch,urbanRandom,resolveUrban,urbanWalkHeight} from './urban-batch.js?v=69';
import {BUILDING_TYPES,addBuilding} from './urban-buildings.js?v=132st';
import * as P from './urban-props.js?v=132st';
import {shrub131} from './shrub131.js?v=131';   // V131 cross-card shrubs
import * as S from './urban-smallprops.js?v=132st';
import {addStreetwallBuilding,addStreetwallBuildingTask} from './urban-streetwall.js?v=140d';
import {addBlockStreetsTask,pavement,curb,roadHeight} from './urban-streets.js?v=135t';
import {addReferenceMaterials} from './reference-materials.js?v=60';
import {createReferenceScenes,referenceWaypoint,clinicToWorld} from './reference-scenes.js?v=60';
import {canalBlock,CANAL} from './canal128-layout.js?v=128';
import {subwayBlockTask,subwayFloor,subwayState} from './subway128.js?v=128';
import {subwayStairs} from './subway128-layout.js?v=128';
import {createTraffic132} from './traffic132.js?v=135t';
import {createCrowd135} from './crowd135.js?v=139j'; // V135-capital ④-1/④-2/④-2b SoHo fair pedestrians
import {bakeFixed133} from './city-bake133.js?v=135g'; // V133-bake-city
import {CITY_BLOCK,CITY_ANGLE,CITY_ORIGIN,worldToCity,cityToWorld,cityBlockPlan,cityDistrict,cityWaypoint} from './urban-layout.js?v=138a';
const B=CITY_BLOCK,Y=EXIT_CITY_Y;
const fashionEye=clinicToWorld(69,50),fashionAim=clinicToWorld(88,64.75),fashionWaypoint={...fashionEye,label:'Level 11 · ECHO 服装广告',yaw:Math.atan2(fashionEye.x-fashionAim.x,fashionEye.z-fashionAim.z),pitch:.62};
const ground=(x,z)=>exitSurface(exitSample(x,z,{}),height(x,z));
function along(s,d=0){const p=exitPoint(s);return{x:p.x+p.nx*d,z:p.z+p.nz*d,ry:Math.atan2(p.tx,p.tz)};}
const roadHalf=approachRoadHalf;
const place=(b,x,y,z,ry,fn,args)=>{b.push(x,y,z,ry);fn(b,args||{});b.pop();};
function shrub(b,x,y,z,r=.8){shrub131(b,x,y,z,{kinds:['boxwood','laurel','euonymus','juniper','hydrangea','grass'],seed:(x*7+z*13)|0,w:r*1.9});}   // V131: cross cards, was 7 icospheres
function planter(b,x,y,z,w=3,d=1.6){b.box('concrete',x,y+.34,z,w,.68,d);b.box('bark',x,y+.685,z,w-.24,.04,d-.24);for(let u=-w/2+.6;u<w/2;u+=1.25)shrub(b,x+u,y+.73,z,.7);b.solid(x,z,w,d);}
function serviceYard(b,w,d,seed){
 const r=urbanRandom(seed);b.box('asphalt',0,-.025,0,w,.05,d);
 for(let x=-w/2+1;x<w/2-1;x+=5.5){b.box('white',x,.012,0,.095,.016,5.2,0,.85);place(b,x+2.5,.03,-2.1,0,P.addWheelStop);}
 place(b,w/2-1,.02,-d/2+1,0,P.addUtilityCabinet,{variant:1});
 for(let k=0;k<3;k++)planter(b,-w/2+1,.04,-d/2+2+k*3.7,1.2,2.2);
 for(let k=0;k<2;k++)place(b,w/2-2,.03,d/2-2-k*3,0,P.addBollard);
 for(let k=0;k<4;k++)b.box('rubber',(r()-.5)*(w-4),.009,(r()-.5)*(d-4),.018,.008,1+r()*2,r()*2,.8);
}
function ribbon(b,key,s0,s1,offset,width,dy=0){
 const rows=[],steps=Math.ceil((s1-s0)/2);
 for(let i=0;i<=steps;i++){const s=s0+(s1-s0)*i/steps,p=exitPoint(s),off=typeof offset==='function'?offset(s):offset,w=typeof width==='function'?width(s):width,row=[];for(const k of[-1,1]){const d=off+k*w/2,x=p.x+p.nx*d,z=p.z+p.nz*d;const join=ease(336,350,s),top=key==='approachAsphalt'?dy*(1-join):key==='sidewalk'?dy+join*(d>0?.01:-.02):dy;row.push([x,(s>235?Y:ground(x,z))+top,z,d/3.8,s/3.8]);}rows.push(row);}
 const clinic=[[-21.76,-24],[21.76,-24],[21.76,52],[-21.76,52]].map(([x,z])=>{const p=clinicToWorld(x,z);return[p.x,p.z];}),pos=[],uv=[];
 for(let i=0;i<steps;i++)for(const tri of[[rows[i][0],rows[i+1][0],rows[i][1]],[rows[i][1],rows[i+1][0],rows[i+1][1]]]){let poly=clipPolygon(tri,p=>-32-cityGroundPoint(p[0],p[2])[1]);if(poly.length<3)continue;const pieces=key==='approachAsphalt'?subtractConvex(poly,clinic):[poly];for(const q of pieces)for(let k=1;k<q.length-1;k++)for(const v of[q[0],q[k],q[k+1]]){pos.push(...v.slice(0,3));uv.push(...v.slice(3));}}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeVertexNormals();b.add(g,key,0,0,0);g.dispose();
}
function makeApproach(mats){
 const b=new UrbanBatch(mats),early=new UrbanBatch(mats),records=[];
 for(let s=105;s<218;s+=17)for(const side of[-1,1]){const p=along(s,side*(6+ease(130,210,s)*4)),y=ground(p.x,p.z);early.cylinder('concrete',p.x,y+.28,p.z,.11,.13,.55,6);if(s>135)shrub(early,p.x+side*1.8,y,p.z,.8);}
 const facilities=[[155,-1,'cinder_warehouse',22,17,1,12],[178,1,'steel_prefab',19,12,1,13],[210,-1,'auto_shop',25,18,1,9],[233,1,'substation',24,19,1,11]];
 for(let i=0;i<facilities.length;i++){
  const[s,side,type,w,d,floors,offset]=facilities[i],p=along(s,side*(offset+d/2)),base=s>218?Y:ground(p.x,p.z),ry=p.ry-side*Math.PI/2;
  b.push(p.x,base+.17,p.z,ry);b.box('asphalt',0,-.15,0,w+1,.04,d+3);pavement(b,0,d/2+1.1,w+1,2.2,.12);addBuilding(b,{type,w,d,floors,seed:1009+i*19,lod:0});b.pop();records.push({type,x:p.x,z:p.z,w,d,floors});
  const rear=along(s,side*(offset+d+2.5));b.push(rear.x,base+.02,rear.z,ry);b.box('asphalt',0,0,0,w+1,.035,5);place(b,-w*.3,.025,0,0,S.addDumpster);place(b,w*.3,.025,0,0,P.addUtilityCabinet,{variant:i%2});b.pop();
 }
 // A continuous commercial frontage replaces the former broad empty forecourts.
 for(const side of[-1,1]){
  const centers=side<0?[239,257,275,293,311,329,347]:[318,336,354];
  for(let i=0;i<centers.length;i++){const s=centers[i],w=17.97,d=19+(i%3)*1.5,offset=roadHalf(s)+4.7,p=along(s,side*(offset+d/2)),ry=p.ry-side*Math.PI/2,type=['two_story_shops','bakery','clinic','photo_studio','brick_walkup','travel_agency','corner_market'][i%7],floors=type==='brick_walkup'?4:1+Number(i%3===0);
   b.push(p.x,Y+.17,p.z,ry);addStreetwallBuilding(b,{type,w,d,floors,seed:15201+i*771+(side+1)*33,lod:0});b.pop();records.push({type,x:p.x,z:p.z,w,d,floors});
   const q=along(s,side*(offset+d+2.5));b.push(q.x,Y+.02,q.z,ry);b.box('asphalt',0,0,0,18,.035,5);if(i%2===0)place(b,4,.025,0,0,S.addDumpster);b.pop();
  }
 }
 ribbon(b,'approachAsphalt',218,362,0,s=>roadHalf(s)*2,.028);
 for(const side of[-1,1]){
  const ranges=side===1?[[216,260],[306,364]]:[[216,364]];
  for(const[a,c]of ranges){ribbon(b,'sidewalk',a,c,s=>side*(roadHalf(s)+2.35),4.7,.17);ribbon(b,'concrete',a,c,s=>side*(roadHalf(s)+.12),.24,.18);ribbon(b,'concrete',a,c,s=>side*(roadHalf(s)-.16),.32,.037);}
  for(let s=226;s<347;s+=9){if(side>0&&s>257&&s<308)continue;const p=along(s,side*(roadHalf(s)+1.05)),n=Math.round((s-226)/9);if(n%2===0)place(b,p.x,Y+.17,p.z,p.ry,P.addStreetTree,{seed:9081+n+side*17,scale:.76+(n%3)*.055});else place(b,p.x,Y+.17,p.z,p.ry,P[n%4===1?'addParkingMeter':'addHydrant']);if(n%4===0){const q=along(s+3,side*(roadHalf(s)+.7));place(b,q.x,Y+.17,q.z,p.ry+(side>0?Math.PI:0),P.addStreetLight,{height:8.1,arm:2.2});}if(n%3===1){const q=along(s+2.2,side*(roadHalf(s)+1.2));place(b,q.x,Y+.17,q.z,p.ry,S.addNewspaperBox,{seed:n,color:n%2?'yellow':'blue'});}}
 }
 for(let s=275;s<347;s+=4){const p=along(s),len=Math.min(3.95,362-s);for(const side of[-1,1]){const q=along(s,side*.18);b.box('yellow',q.x,Y+.042,q.z,.11,.009,len,p.ry,.82);}if(s>340&&Math.floor(s/4)%2)for(const side of[-1,1]){const q=along(s,side*3.5);b.box('white',q.x,Y+.044,q.z,.11,.009,3,p.ry,.77);}}
 for(let s=300;s<346;s+=27){const q=along(s,-2.6);place(b,q.x,Y+.036,q.z,0,P.addManhole);for(const side of[-1,1]){const p=along(s+5,side*(roadHalf(s)-.35));place(b,p.x,Y+.04,p.z,p.ry,P.addStormDrain);}}
 return{object:b.finish('Urban approach / continuous commercial streetwall'),early:early.finish('Urban approach / rural verge'),colliders:b.colliders,walks:b.walks,records};
}
function pavementWithVoids(b,x0,x1,z0,z1,top,holes){const xs=[x0,x1],zs=[z0,z1];for(const h of holes){for(const x of[h[0],h[1]])if(x>x0&&x<x1)xs.push(x);for(const z of[h[2],h[3]])if(z>z0&&z<z1)zs.push(z);}xs.sort((a,b)=>a-b);zs.sort((a,b)=>a-b);for(let i=0;i<xs.length-1;i++)for(let j=0;j<zs.length-1;j++){const a=xs[i],c=xs[i+1],u=zs[j],v=zs[j+1],x=(a+c)/2,z=(u+v)/2;if(holes.some(h=>x>h[0]&&x<h[1]&&z>h[2]&&z<h[3]))continue;pavement(b,x,z,c-a,v-u,top);}}
function referenceGround(mats){
 const b=new UrbanBatch(mats);b.push(CITY_ORIGIN.x,Y,CITY_ORIGIN.z,CITY_ANGLE);
 // Complete the two foreground sidewalks without altering the authored landmarks.
 // These slabs support the existing trees, hydrant, bollards and stair foot.
 const leftVoids=[[14.5,45.5,8,70],[20.5,29.5,6.37,7.14]];pavementWithVoids(b,11,17,-32,-12.6,.18,leftVoids);pavementWithVoids(b,11,17,3.6,10,.18,leftVoids);pavement(b,13.8,-10.9,3.2,3.4,.18);pavementWithVoids(b,17,46.5,3.6,10,.18,leftVoids);
 curb(b,14,-32,6,0,.18);curb(b,31.75,3.60,29.5,0,.18);for(const[a,c]of[[-32,-12.6],[3.6,6.21],[7.39,10]])curb(b,11,(a+c)/2,c-a,Math.PI/2,.18);
 const rightVoids=[[-69.7,-30.3,2.77,63],[-31.05,-15.085,2.5,15.5]];pavementWithVoids(b,-17,-11,-32,-12.6,.15,rightVoids);pavementWithVoids(b,-17,-11,-1.5,10,.15,rightVoids);pavementWithVoids(b,-70,-17,-1.5,2.95,.15,rightVoids);
 curb(b,-43.5,-1.50,53,0,.15);curb(b,-14,-32,6,0,.15);for(const[a,c]of[[-32,-12.6],[-1.5,6.21],[7.39,10]])curb(b,-11,(a+c)/2,c-a,-Math.PI/2,.15);
 curb(b,14,-12.6,6,Math.PI,.18);curb(b,-14,-12.6,6,Math.PI,.15);curb(b,13.8,-9.2,3.2,Math.PI,.18);curb(b,12.2,-10.9,3.4,Math.PI/2,.18);curb(b,15.4,-10.9,3.4,-Math.PI/2,.18);curb(b,14,3.6,6,0,.18);curb(b,-14,-1.5,6,0,.15);
 // Existing curb drains and street furniture sit on this physical return pavement.
 for(const side of[-1,1])for(let z=-28;z<-12.6;z+=3.8)b.box('concrete',side*14,side>0?.182:.152,z,5.8,.004,.015,0,.7);
 for(let x=18;x<46;x+=3.6){b.box('concrete',x,.182,4.95,.013,.004,2.7,0,.7);if(x<20.5||x>29.5)b.box('concrete',x,.182,7.1,.013,.004,1.5,0,.7);}
 for(let x=-66;x<-18;x+=3.8)b.box('concrete',x,.152,.6,.013,.004,4.0,0,.7);
 // Respect the existing stepped far-end footprints: the sidewalk follows the
 // actual building line instead of continuing through their lower floors.
 const edges={1:[[340,16],[353.5,16],[368,11],[411.5,11],[428,6],[469.5,6],[484,12]],'-1':[[340,17],[346,6],[382.5,6],[397,16],[440.5,16],[452,12],[484,12]]};
 for(const side of[-1,1]){const knots=edges[side];for(let k=0;k<knots.length-1;k++){const[a,ea]=knots[k],[c,ec]=knots[k+1],steps=Math.ceil((c-a)/2);for(let i=0;i<steps;i++){const z0=a+(c-a)*i/steps,z1=a+(c-a)*(i+1)/steps,e0=ea+(ec-ea)*i/steps,e1=ea+(ec-ea)*(i+1)/steps,w=3.5,y=.18-.03*ease(450,484,(z0+z1)/2),points=[[side*(e0-w),y,z0],[side*(e1-w),y,z1],[side*e1,y,z1],[side*e0,y,z0]],g=new T.BufferGeometry(),pos=[];for(const n of(side>0?[0,1,2,0,2,3]:[0,2,1,0,3,2]))pos.push(...points[n]);g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.computeVertexNormals();b.add(g,'sidewalk',0,0,0);g.dispose();const dz=z1-z0,dx=side*(e1-e0),len=Math.hypot(dx,dz),ry=Math.atan2(dx,dz);b.walk(side*((e0+e1)/2-w/2),(z0+z1)/2,w,dz,y,0,0,dx/dz);curb(b,side*((e0+e1)/2-w),(z0+z1)/2,len,ry+(side>0?Math.PI/2:-Math.PI/2),y);}}}
 // Add missing physical collision to the seven unchanged distant reference masses.
 for(let i=0;i<7;i++){const side=i%2?1:-1;b.solid(-side*(19+i%3*5),283+i*29,26,25);}

 b.pop();return{object:b.finish('Landmark sidewalk returns / shared street ground'),colliders:b.colliders,walks:b.walks};
}
function* buildBlock(mats,plan,lod){
 const b=new UrbanBatch(mats);try{b.push(CITY_ORIGIN.x,0,CITY_ORIGIN.z,CITY_ANGLE);yield* addBlockStreetsTask(b,plan,lod);
 if(plan.soho135==='a'||plan.soho135==='b'){b.push(plan.x,Y,plan.z);yield* soho135FairTask(b,plan,lod);b.pop();}
 for(const spec of plan.buildings){b.push(spec.x,Y+.15,spec.z,spec.ry);if(spec.soho135)yield* soho135BuildingTask(b,spec,lod);else if(spec.spire135)yield* spire135Task(b,spec,lod);else yield* addStreetwallBuildingTask(b,{...spec,lod});if(spec.infill){b.box('sidewalk',0,-.075,spec.d/2+1.8,spec.w,.15,3.6);b.walk(0,spec.d/2+1.8,spec.w,3.6,0);b.push(0,-.15,0);curb(b,0,spec.d/2+3.6,spec.w,Math.PI,.15);b.pop();if(spec.seed%3===0)place(b,0,0,spec.d/2+2.85,0,P.addStreetTree,{seed:spec.seed,scale:.68});else if(spec.seed%3===1)place(b,0,0,spec.d/2+2.85,0,P.addHydrant);else place(b,0,0,spec.d/2+2.85,0,P.addStreetLight,{height:7.4,arm:1.5});}b.pop();yield;}

 b.pop();const object=yield* b.finishTask('Level 11 block '+plan.ix+','+plan.iz+' / '+plan.district);const sub=plan.reserved?null:yield* subwayBlockTask(mats,plan,lod);return{object,colliders:b.colliders,walks:b.walks,plan,lod,sub,stairWalks:b.stairWalks||[],stairSolids:b.stairSolids||[],signals132:b.signals132||[]};}finally{b.discard();}
}
export function createExitScene({onAdd=()=>{},onRemove=()=>{}}={}){
 // V135-capital ②c-2b-2 "shell + stream": the six fixed batch roots are empty shells at boot (their colliders/walks/records come
 // from capital135/geo/index.js); geometry packs load on the first L10/L11 update, setCity(true) or prepareAt. ?stream=0 / ?cook135=0 = eager builders.
 const G=CAPITAL135_GEO,COOK=geo135Enabled(G),shells={},lazy={},lazyStub=(k,build,extra={})=>{const r=CAPITAL135_LAZY[k],o={object:shell135(r.head),colliders:r.colliders,walks:r.walks,...extra};lazy[k]={o,build};return o;},buildLazy=()=>{for(const L of Object.values(lazy)){if(L.real)continue;const real=L.real=L.build();L.o.object.add(...real.object.children);for(const[f,v]of Object.entries(real))if(!(f in L.o))L.o[f]=v;}},stub=k=>{const r=G.roots[k];shells[k]=shell135(r.head);const o={object:shells[k]};for(const[f,v]of Object.entries(r))if(f!=='f'&&f!=='head')o[f]=v;return o;};
 if(COOK){const q=G.state;fountainCenter.value.fromArray(q.fc);plaza133.center.value.fromArray(q.pc);plaza133.rot.value=q.pr;plaza133.lamp.value.fromArray(q.pl);}
 const mats=addApproachGroundMaterial(addDistrictMaterials(addReferenceMaterials(createUrbanMaterials()))),district=COOK?stub('district'):createClinicDistrict(mats),approach=COOK?Object.assign(stub('approach'),{early:stub('early').object}):makeApproach(mats),references=COOK?lazyStub('references',()=>createReferenceScenes(mats)):createReferenceScenes(mats),joinedGround=COOK?stub('joinedGround'):referenceGround(mats),fabric=COOK?stub('fabric'):createLandmarkFabric(mats),fabricGround=COOK?stub('fabricGround'):createLandmarkGround(mats),bath=createSpringEntrance(mats),tiki=createTikiFacade(),backcourt=createBackcourt(),root=new T.Group(),blocks=new Map();root.name='Level 10 to Level 11 / urban fabric';root.add(tiki.object,bath.object,approach.object,approach.early,references.object,joinedGround.object,district.object,fabric.object,fabricGround.object,backcourt.object);root.visible=false;
 setInfillObstacles([...tiki.colliders,...bath.colliders,...approach.colliders,...references.colliders,...joinedGround.colliders,...district.colliders,...fabric.colliders,...backcourt.colliders],{...CITY_ORIGIN,angle:CITY_ANGLE});
 const milling=COOK?lazyStub('milling',()=>createMillingMouth(),{dispose:()=>lazy.milling.real?.dispose()}):createMillingMouth();root.add(milling.object);
 const traffic=createTraffic132({blocks:()=>blocks});root.add(traffic.object); // V132-traffic
 const crowd=createCrowd135({blocks:()=>blocks});root.add(crowd.object); // V135 ④-1
 const tikiPaving=attachTikiPaving80(mats.photoGranite);const residue=createCornerResidue(),cornerGround=attachCornerGround(mats.photoCobble);root.add(residue.object);
 const bake133=bakeFixed133([[tiki.object,5],[bath.object,5],[approach.object,5],[approach.early,5],[references.object,8],[joinedGround.object,5],[district.object,5],[fabric.object,5],[fabricGround.object,5],[backcourt.object,5],[milling.object,5],[residue.object,5]],{data:'./city-bake133-data.js?v=133c',exportName:'CITY_BAKE133',hold:COOK,stream:{index:['./capital135/index.js?v=135d','CAPITAL135_INDEX'],base:new URL('./capital135/',import.meta.url).href,worldToCity}}); // V133-bake-city: fixed L11 fabric only, ?bake=0 off
 // V135-capital ②c-2: once the bake keying is done, split the fixed fabric per 112 m cell and swap far cells to their Blender HLOD (1 draw each). ?hlod135=0 / ?stream=0 off.
 const lodRoots135=[tiki.object,bath.object,approach.object,approach.early,references.object,joinedGround.object,district.object,fabric.object,fabricGround.object,backcourt.object,milling.object,residue.object];let lod135=null,lod135L=false;
 function lodTick135(wx,wz){if(lod135){lod135.tick(wx,wz);return;}if(lod135L||!bake133?.tick||/[?&](hlod135|stream)=0\b/.test(globalThis.location?.search||''))return;lod135L=true;
  Promise.all([import('./capital135-lod.js?v=135f'),import('./capital135/hlod/index.js?v=135e')]).then(([m,h])=>{lod135=m.createCapitalLOD(bake133,{roots:lodRoots135,index:h.CAPITAL135_HLOD,base:new URL('./capital135/hlod/',import.meta.url).href,worldToCity,parent:root,onChange:c=>{if(c.hlod)onAdd(c.hlod);}});bake133.lod=lod135;}).catch(e=>console.warn('[capital135] lod off',e));}
 let geoP=null,geoStats=null;
 function loadGeo(){if(!COOK)return Promise.resolve(null);if(geoP)return geoP;
  const done=st=>{if(disposed)return st;const objs=[...Object.values(shells),...Object.values(lazy).map(L=>L.o.object)];root.updateMatrixWorld(true);bake133?.addLate?.(objs);for(const o of objs)onAdd(o);geoStats=st;recount();return st;};
  // fallback if a pack fails: run the original builders once and move their children into the shells (same transforms)
  const eager=()=>{const a=makeApproach(mats),real={district:createClinicDistrict(mats).object,approach:a.object,early:a.early,joinedGround:referenceGround(mats).object,fabric:createLandmarkFabric(mats).object,fabricGround:createLandmarkGround(mats).object};
   for(const[k,o]of Object.entries(real))shells[k].add(...o.children);return{eager:true};};
  return geoP=loadCapitalGeo135(G,{base:new URL('./capital135/geo/',import.meta.url).href,mats,shells,isDisposed:()=>disposed,pre:buildLazy,warm:()=>{const b=new UrbanBatch(mats);try{curb(b,0,0,1);for(let v=0;v<4;v++)ubox132(b,{variant:v});}finally{b.discard();}}}).catch(e=>{console.error('[capital135] geo packs failed, building eagerly',e);for(const o of Object.values(shells))o.clear();buildLazy();return eager();}).then(done);}
 const groundPos={value:new T.Vector2()};const groundGeometry=new T.PlaneGeometry(B*16,B*16);groundGeometry.rotateX(-Math.PI/2);groundGeometry.setAttribute('color',new T.Float32BufferAttribute(new Float32Array(groundGeometry.attributes.position.count*3).fill(1),3));const groundUV=groundGeometry.attributes.uv;for(let i=0;i<groundUV.count;i++)groundUV.setXY(i,groundUV.getX(i)*B*16/3.8,groundUV.getY(i)*B*16/3.8);const canalRects=Array.from({length:40},()=>new T.Vector4(0,0,0,0)),groundMat=mats.asphalt.clone();groundMat.onBeforeCompile=sh=>{sh.uniforms.uCanal={value:canalRects};sh.uniforms.uCO={value:new T.Vector3(CITY_ORIGIN.x,CITY_ORIGIN.z,CITY_ANGLE)};sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec2 vGP;').replace('#include <project_vertex>','#include <project_vertex>\nvGP=position.xz+uGP;');sh.vertexShader=sh.vertexShader.replace('varying vec2 vGP;','varying vec2 vGP;uniform vec2 uGP;');sh.uniforms.uGP=groundPos;sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec2 vGP;uniform vec4 uCanal[40];uniform vec3 uCO;').replace('void main() {','void main() {\n{vec2 d=vGP-uCO.xy;float ca=cos(uCO.z),sa=sin(uCO.z);vec2 c=vec2(ca*d.x-sa*d.y,sa*d.x+ca*d.y);for(int i=0;i<40;i++){vec4 r=uCanal[i];if(r.z>r.x&&c.x>r.x&&c.x<r.z&&c.y>r.y&&c.y<r.w)discard;}}');};groundMat.customProgramCacheKey=()=>'v128-canal-ground';
 const cityGround=new T.Mesh(groundGeometry,groundMat);cityGround.name='Continuous city ground / no exposed sky beneath reserved parcels';cityGround.position.set(CITY_ORIGIN.x,Y-.065,CITY_ORIGIN.z);cityGround.receiveShadow=true;cityGround.castShadow=false;cityGround.visible=false;root.add(cityGround);
 const stats={mode:'10',blocks:0,buildings:approach.records.length+district.buildings+fabric.buildings,typologies:BUILDING_TYPES.length,triangles:0,draws:0,pending:0,district:'transition'};
 let city=false,origin='',wantedKey='',queue=[],job=null,disposed=false;
 function recount(){stats.blocks=blocks.size;stats.buildings=approach.records.length+district.buildings+fabric.buildings;stats.triangles=2;stats.draws=1;for(const g of[tiki.object,bath.object,approach.object,approach.early,references.object,joinedGround.object,district.object,fabric.object,fabricGround.object,backcourt.object,residue.object,...Array.from(blocks.values(),v=>v.object)]){const q=g.userData.cityStats||{triangles:0,draws:0};stats.triangles+=q.triangles;stats.draws+=q.draws;}for(const v of blocks.values())stats.buildings+=v.plan.buildings.length;stats.pending=queue.length+Number(!!job);}
 function commitBlock(v,key){blocks.set(key,v);root.add(v.object);onAdd(v.object);sohoBake135(v,key,bake133);if(v.sub){root.add(v.sub.object);v.sub.object.updateMatrix();v.sub.object.matrixAutoUpdate=false;v.sub.object.updateMatrixWorld(true);}v.object.updateMatrix();v.object.matrixAutoUpdate=false;v.object.updateMatrixWorld(true);recount();}
 function removeBlock(key){const v=blocks.get(key);if(!v)return;if(v.sub){v.sub.object.removeFromParent();v.sub.object.traverse(m=>m.geometry?.dispose());}onRemove(v.object);v.object.removeFromParent();v.object.traverse(m=>m.geometry?.dispose());blocks.delete(key);}
 function requestAround(wx,wz,force=false){
  const p=worldToCity(wx,wz),ix=Math.floor(p.x/B),iz=Math.floor(p.z/B),key=ix+','+iz+','+city;if(key===wantedKey&&!force)return;wantedKey=key;const gp=cityToWorld((ix+.5)*B,(iz+.5)*B);cityGround.position.set(gp.x,Y-.065,gp.z);cityGround.updateMatrix();groundPos.value.set(gp.x,gp.z);{let n=0;for(let dz=-2;dz<=2;dz++)for(let dx=-2;dx<=2;dx++){const c=canalBlock(ix+dx,iz+dz);if(c&&n<40)canalRects[n++].set((ix+dx)*B,(iz+dz)*B+CANAL.z0,(ix+dx+1)*B,(iz+dz)*B+CANAL.z1);for(const q of subwayStairs(ix+dx,iz+dz))if(n<40)canalRects[n++].set((ix+dx)*B+q.x0,(iz+dz)*B+q.z0,(ix+dx)*B+q.x1,(iz+dz)*B+q.z1);}for(;n<40;n++)canalRects[n].set(0,0,0,0);}
  const wanted=new Set(),next=[];
  for(let dz=-2;dz<=2;dz++)for(let dx=-2;dx<=2;dx++){const ax=ix+dx,az=iz+dz;if(!city&&az<0)continue;const k=ax+','+az;wanted.add(k);if(!blocks.has(k)&&job?.key!==k)next.push({key:k,ix:ax,iz:az,d:dx*dx+dz*dz,lod:Math.max(Math.abs(dx),Math.abs(dz))>1?1:0});}
  next.sort((a,b)=>a.d-b.d);queue=next;for(const[k,v]of blocks){if(!wanted.has(k))removeBlock(k);else if(v.lod===1&&Math.abs(v.plan.ix-ix)<=1&&Math.abs(v.plan.iz-iz)<=1&&job?.key!==k)queue.push({key:k,ix:v.plan.ix,iz:v.plan.iz,d:0,lod:0});}
  if(job&&!wanted.has(job.key)){job.generator.return();job=null;}stats.district=cityDistrict(p.x,p.z);recount();
 }
 function advance(all=false){const start=performance.now();let step=0;do{if(!job){const q=queue.shift();if(!q)break;job={...q,generator:buildBlock(mats,cityBlockPlan(q.ix,q.iz,BUILDING_TYPES),q.lod)};}const result=job.generator.next();step++;if(result.done){const key=job.key;if(blocks.has(key))removeBlock(key);commitBlock(result.value,key);job=null;}}while((all||performance.now()-start<3)&&step<(all?10000:64));stats.pending=queue.length+Number(!!job);}
 function update(state){
  if(COOK&&!geoP)loadGeo(); // V135 ②c-2b-2: first L10/L11 frame starts the capital packs
  fountainClock.value=performance.now()*.001;tiki.update(fountainClock.value);
  const near=state.cx>=4n&&state.cx<=13n&&state.cz>=-1n&&state.cz<=17n;root.visible=city||near;if(!root.visible||disposed)return;
  const key=`${state.cx},${state.cz}`;if(key!==origin){origin=key;root.position.set(-Number(state.cx)*64,0,-Number(state.cz)*64);cornerGround.rebase(state.cx,state.cz);tikiPaving.rebase(state.cx,state.cz);root.updateMatrix();root.updateMatrixWorld(true);}
  const wx=Number(state.cx)*64+(state.x||0),wz=Number(state.cz)*64+(state.z||0);const cp=worldToCity(wx,wz),fx=((cp.x%B)+B)%B,fz=((cp.z%B)+B)%B;stats.coverage=2*B+Math.min(fx,fz,B-fx,B-fz)-12;if(city||exitSample(wx,wz,{}).s>190){requestAround(wx,wz);advance();}bake133?.tick?.(wx,wz); // V135-capital ②c: stream the capital's per-cell bake
  lodTick135(wx,wz); // V135-capital ②c-2: per-cell geometry split + far-cell HLOD proxies
  traffic.update(wx,wz,city&&!subwayState.under);crowd.update(wx,wz,city&&!subwayState.under,cp);{const px=Math.floor(cp.x/B),pz=Math.floor(cp.z/B);for(const v of blocks.values()){v.object.visible=city||v.plan.iz>=0;if(v.sub)v.sub.object.visible=city&&(subwayState.under||Math.max(Math.abs(v.plan.ix-px),Math.abs(v.plan.iz-pz))<=1);}}
 }
 async function prepareAt(wx,wz,report=()=>{}){await loadGeo();subwayState.under=false;requestAround(wx,wz,true);const total=Math.max(1,queue.length+Number(!!job));while(queue.length||job){if(disposed)throw Error("City disposed");advance();report(1-(queue.length+Number(!!job))/total);await new Promise(done=>setTimeout(done,0));}report(1);}
 function setCity(value){if(value)loadGeo();city=value;subwayState.under=false;cityGround.visible=value;stats.mode=value?'11':'10';approach.early.visible=!value;wantedKey='';if(!value){queue=[];if(job){job.generator.return();job=null;}for(const k of blocks.keys())removeBlock(k);}recount();}
 function resolve(position,state){if(!city&&!root.visible)return position;const wx=Number(state.cx)*64,wz=Number(state.cz)*64;position.x+=wx;position.z+=wz;if(subwayState.under){const p=worldToCity(position.x,position.z),ix=Math.floor(p.x/B),iz=Math.floor(p.z/B);for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){const v=blocks.get((ix+dx)+','+(iz+dz));if(v){if(v.sub)resolveUrban(position,v.sub.colliders);resolveUrban(position,v.stairSolids);}}position.x-=wx;position.z-=wz;return position;}resolveUrban(position,milling.colliders);resolveUrban(position,tiki.colliders);resolveUrban(position,bath.colliders);resolveUrban(position,approach.colliders);resolveUrban(position,references.colliders);resolveUrban(position,joinedGround.colliders);resolveUrban(position,district.colliders);resolveUrban(position,fabric.colliders);resolveUrban(position,backcourt.colliders);resolveUrban(position,residue.colliders);const p=worldToCity(position.x,position.z),ix=Math.floor(p.x/B),iz=Math.floor(p.z/B);for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){const v=blocks.get((ix+dx)+','+(iz+dz));if(v)resolveUrban(position,v.colliders);}if(city){resolveUrban(position,traffic.solids);resolveUrban(position,crowd.solids);}position.x-=wx;position.z-=wz;return position;}
 function floorAt(wx,wz){const mp=worldToReturn(wx,wz),mq=returnSample(mp.x,mp.z,{});if(mq.s>=-4&&mq.s<=49&&mq.distance<2.25)return returnFloor(mp.x,mp.z);if(city){const p=worldToCity(wx,wz),ix=Math.floor(p.x/B),iz=Math.floor(p.z/B),near=[];for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){const v=blocks.get((ix+dx)+','+(iz+dz));if(v)near.push(v);}const sy=subwayFloor(wx,wz,near,Y);if(sy!==null)return sy;}let y=urbanWalkHeight(wx,wz,joinedGround.walks,urbanWalkHeight(wx,wz,references.walks,urbanWalkHeight(wx,wz,approach.walks,Y)));y=urbanWalkHeight(wx,wz,district.walks,y);y=urbanWalkHeight(wx,wz,fabric.walks,y);y=urbanWalkHeight(wx,wz,bath.walks,y);y=urbanWalkHeight(wx,wz,milling.walks||[],y);const p=worldToCity(wx,wz),ix=Math.floor(p.x/B),iz=Math.floor(p.z/B);if(!((ix===-1||ix===0)&&iz>=-3&&iz<4))y=Math.max(y,Y+roadHeight(p.x,p.z));for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){const v=blocks.get((ix+dx)+','+(iz+dz));if(v)y=urbanWalkHeight(wx,wz,v.walks,y);}if(p.z<-32&&p.z>-205&&Math.abs(p.x)<40){const q=exitSample(wx,wz,{}),s=q.s,d=Math.abs(q.signed);if(s>=218&&d<=roadHalf(s))y=Math.max(y,Y+approachRoadTop(s));if(s>=216&&d>roadHalf(s)&&d<roadHalf(s)+4.7&&!(q.signed>0&&s>260&&s<306))y=Math.max(y,Y+.17+ease(336,350,s)*(q.signed>0?.01:-.02));}return y;}
 function dispose(){disposed=true;traffic.dispose();crowd.dispose();if(job)job.generator.return();for(const key of blocks.keys())removeBlock(key);milling.dispose();backcourt.dispose();residue.dispose();bath.dispose();tiki.dispose();root.traverse(m=>m.geometry?.dispose());for(const[key,m]of Object.entries(mats)){if(key.startsWith('sign:')||['photoBanner','photoFamima','photoHope','photoDermica','photoFamimaRound','photoBus','photoParking','photoWalkHand'].includes(key))m.map?.dispose();m.dispose();}root.removeFromParent();}
 recount();return{object:root,mats,approach,crowd,get bake133(){return bake133;},loadGeo,get geo(){return{cook:COOK,stats:geoStats,loading:!!geoP&&!geoStats};},update,setCity,resolve,floorAt,stats,dispose,prepareAt,waypoint:name=>name==='city-return'?returnWaypoint():name==='city-tiki'?tiki.waypoint:name==='city-vending'?backcourt.waypoint:name==='city-bath'?bath.waypoint:name==='city-ad'?fashionWaypoint:name==='city-plaza'?district.waypoint:name.startsWith('photo-')?referenceWaypoint(name):cityWaypoint(name),references,joinedGround,district,fabric,fabricGround,bath,tiki,milling,backcourt,residue,cornerGround,colliders:[...milling.colliders,...tiki.colliders,...bath.colliders,...approach.colliders,...references.colliders,...joinedGround.colliders,...district.colliders,...fabric.colliders,...backcourt.colliders,...residue.colliders],get cityColliders(){return[...milling.colliders,...tiki.colliders,...bath.colliders,...approach.colliders,...references.colliders,...joinedGround.colliders,...district.colliders,...fabric.colliders,...backcourt.colliders,...residue.colliders,...Array.from(blocks.values()).flatMap(v=>v.colliders)];},get blocks(){return blocks;},buildingTypes:BUILDING_TYPES};
}
