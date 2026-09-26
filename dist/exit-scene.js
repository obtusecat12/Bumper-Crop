import * as T from './vendor/three.module.min.js';
import {exitPoint,exitSample,exitSurface,ease,EXIT_CITY_Y} from './exit-route.js?v=50';
import {height} from './world.js?v=50';
import {createUrbanMaterials} from './urban-materials.js?v=50';
import {UrbanBatch,urbanRandom,resolveUrban,urbanWalkHeight} from './urban-batch.js?v=50';
import {BUILDING_TYPES,addBuilding} from './urban-buildings.js?v=50';
import * as P from './urban-props.js?v=50';
import {addReferenceMaterials} from './reference-materials.js?v=50';
import {createReferenceScenes,referenceWaypoint} from './reference-scenes.js?v=50';
import {CITY_BLOCK,CITY_ANGLE,CITY_ORIGIN,worldToCity,cityBlockPlan,cityDistrict,cityWaypoint} from './urban-layout.js?v=50';
const B=CITY_BLOCK,Y=EXIT_CITY_Y;
const ground=(x,z)=>exitSurface(exitSample(x,z,{}),height(x,z));
function along(s,d=0){const p=exitPoint(s);return{x:p.x+p.nx*d,z:p.z+p.nz*d,ry:Math.atan2(p.tx,p.tz)};}
const roadHalf=s=>2.05+ease(80,265,s)*2.05+ease(290,420,s)*6.9;
const place=(b,x,y,z,ry,fn,args)=>{b.push(x,y,z,ry);fn(b,args||{});b.pop();};
function shrub(b,x,y,z,r=.8){b.cylinder('bark',x,y+.22,z,.055,.08,.45,5);for(let k=0;k<7;k++){const a=k*2.4;b.sphere('foliage',x+Math.cos(a)*r*.45,y+.52+(k%2)*.18,z+Math.sin(a)*r*.45,r*.56,.5+r*.20,r*.54,.76+k*.035);}}
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
 const pos=[],uv=[],idx=[],steps=Math.ceil((s1-s0)/2);
 for(let i=0;i<=steps;i++){const s=s0+(s1-s0)*i/steps,p=exitPoint(s),off=typeof offset==='function'?offset(s):offset,w=typeof width==='function'?width(s):width;for(const k of[-1,1]){const d=off+k*w/2,x=p.x+p.nx*d,z=p.z+p.nz*d;pos.push(x,(s>235?Y:ground(x,z))+dy,z);uv.push(d/3.8,s/3.8);}}
 for(let i=0;i<steps;i++){const n=i*2;idx.push(n,n+2,n+1,n+1,n+2,n+3);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();b.add(g,key,0,0,0);g.dispose();
}
function makeApproach(mats){
 const b=new UrbanBatch(mats),early=new UrbanBatch(mats),records=[];
 for(let s=105;s<220;s+=17)for(const side of[-1,1]){const p=along(s,side*(6+ease(130,210,s)*4)),y=ground(p.x,p.z);early.cylinder('concrete',p.x,y+.28,p.z,.11,.13,.55,6);if(s>135)shrub(early,p.x+side*1.8,y,p.z,.8);}
 const facilities=[[155,-1,'cinder_warehouse',22,17,1,26],[176,1,'steel_prefab',19,12,1,31],[207,-1,'auto_shop',29,18,1,25],[233,1,'substation',25,23,1,29],[252,-1,'clinic',29,20,1,23],[301,-1,'research_lab',29,21,2,21],[350,-1,'two_story_shops',31,23,2,23]];
 for(let i=0;i<facilities.length;i++){
  const[s,side,type,w,d,floors,offset]=facilities[i],p=along(s,side*(offset+d/2)),base=s>218?Y:ground(p.x,p.z),ry=p.ry-side*Math.PI/2;
  b.push(p.x,base+.17,p.z,ry);const apron=offset-roadHalf(s)-1;b.box('asphalt',0,-.12,apron/2,w+4,.05,d+apron+4);b.box('sidewalk',0,-.055,d/2+1.3,w+1,.11,2.6);addBuilding(b,{type,w,d,floors,seed:1009+i*19,lod:0});b.pop();records.push({type,x:p.x,z:p.z,w,d,floors});
  const yard=along(s,side*(roadHalf(s)+7.4));b.push(yard.x,(s>218?Y:ground(yard.x,yard.z))+.04,yard.z,ry);serviceYard(b,w+2,12,71+i);b.pop();
  const rear=along(s,side*(offset+d+3));b.push(rear.x,base+.035,rear.z,ry);b.box('asphalt',0,0,0,w+4,.06,6);place(b,-w*.32,.06,0,0,P.addTrashBin);place(b,w*.32,.06,0,0,P.addUtilityCabinet,{variant:i%2});b.pop();
  const t=along(s-w*.42,side*(roadHalf(s)+3.7));place(b,t.x,(s>218?Y:ground(t.x,t.z))+.15,t.z,0,P.addStreetTree,{seed:i*291+17,scale:.80+(i%3)*.12});
 }
 for(let i=0;i<4;i++){const s=265+i*23,side=i%2?1:-1,p=along(s,side*(65+(i%3)*13));b.push(p.x,Y+.17,p.z,p.ry-side*Math.PI/2);addBuilding(b,{type:['cinder_warehouse','courtyard_motel','two_story_shops','precast_tower'][i%4],w:29,d:24,floors:i%4===3?8:2,seed:509+i,lod:1});b.pop();}
 ribbon(b,'asphalt',225,354,0,s=>roadHalf(s)*2,.028);
 for(const side of[-1,1]){
  ribbon(b,'sidewalk',216,350,s=>side*(roadHalf(s)+2.35),4.7,.17);ribbon(b,'concrete',190,350,s=>side*(roadHalf(s)+.12),.24,.20);
  for(let s=241;s<350;s+=30){const p=along(s,side*(roadHalf(s)+.8));place(b,p.x,Y+.17,p.z,p.ry+side*Math.PI/2,P.addStreetLight,{height:8.6,arm:2.3});if(s>280){const q=along(s+9,side*(roadHalf(s)+1));place(b,q.x,Y+.17,q.z,p.ry,P.addParkingMeter);}}
 }
 for(let s=275;s<350;s+=4){const p=along(s),len=Math.min(3.95,350-s);for(const side of[-1,1]){const q=along(s,side*.18);b.box('yellow',q.x,Y+.042,q.z,.11,.009,len,p.ry,.94);}if(s>340&&Math.floor(s/4)%2)for(const side of[-1,1]){const q=along(s,side*3.5);b.box('white',q.x,Y+.044,q.z,.11,.009,3,p.ry,.89);}}
 for(let s=300;s<354;s+=36){const q=along(s,-2.6);place(b,q.x,Y+.05,q.z,0,P.addManhole);for(const side of[-1,1]){const p=along(s+8,side*(roadHalf(s)-.35));place(b,p.x,Y+.045,p.z,p.ry,P.addStormDrain);}}
 return{object:b.finish('Urban approach / occupied lots and low commerce'),early:early.finish('Urban approach / rural verge'),colliders:b.colliders,walks:b.walks,records};
}
function roadAndFurniture(b,plan,lod){
 if(plan.reserved)return;
 const{x,z,ix,iz,seed}=plan;b.push(x,Y,z,0);b.box(plan.reserved?'sidewalk':'asphalt',56,-.03,56,112,.06,112);
 if(!plan.reserved){
  b.box('sidewalk',56,.075,56,90,.15,82);b.walk(56,56,90,82,.15);for(const cz of[13,99]){b.box('sidewalk',56,.075,cz,82,.15,4);b.walk(56,cz,82,4,.15);}
  for(const cx of[13,99])for(const cz of[13,99]){const sx=cx===13?1:-1,sz=cz===13?1:-1,g=new T.PlaneGeometry(4,4,1,1);g.rotateX(-Math.PI/2);const a=g.attributes.position;for(let n=0;n<a.count;n++)a.setY(n,.075+(a.getX(n)*sx+a.getZ(n)*sz)*.01875);g.computeVertexNormals();b.add(g,'sidewalk',cx,0,cz);g.dispose();b.walk(cx,cz,4,4,.075,sx*.01875,sz*.01875);}
  for(const e of[11.13,100.87]){b.box('concrete',56,.086,e,83,.172,.26);b.box('concrete',e,.086,56,.26,.172,83);}
  for(const a of[13,99])for(const c of[13,99])for(let k=-2;k<=2;k++)b.box('yellow',a+k*.23,.157,c,.05,.008,1.05,0,.67);
  for(const edge of[0,112])for(const d of[-.19,.19]){b.box('yellow',edge+d,.008,56,.11,.013,82,0,.91);b.box('yellow',56,.008,edge+d,82,.013,.11,0,.91);}
  for(const edge of[0,112])for(const lane of[-6.7,-3.35,3.35,6.7])for(let k=22;k<94;k+=8){b.box('white',edge+lane,.009,k,.10,.013,3,0,.83);b.box('white',k,.009,edge+lane,3,.013,.10,0,.83);}
  for(let k=-4;k<=4;k++){const u=k*2.;for(const e of[0,112])for(const q of[14,98]){b.box('white',e+u,.01,q,.87,.014,3.3,0,.85);b.box('white',q,.01,e+u,3.3,.014,.87,0,.85);}}
  for(const e of[0,112]){b.box('white',e,.011,17,19,.014,.32);b.box('white',17,.011,e,.32,.014,19);}
  for(const edge of[13.6,98.4])for(let k=28;k<97;k+=24){place(b,edge,.16,k,0,P.addStreetTree,{seed:seed+k+edge,scale:.88+((ix+iz)%3+3)%3*.08});place(b,k,.16,edge,0,P.addStreetTree,{seed:seed+k+71,scale:.87});}
  for(const p of[[12.8,46,Math.PI/2],[99.2,69,-Math.PI/2],[69,12.8,Math.PI],[46,99.2,0]])place(b,p[0],.16,p[1],p[2],P.addStreetLight,{height:9.5,arm:3.3});
  place(b,13,.16,17,-Math.PI/2,P.addTrafficSignal,{arm:17,street:iz%3?'olive':'hope'});place(b,96,.16,99,Math.PI/2,P.addTrafficSignal,{arm:17,street:ix%2?'grand':'hope'});
  place(b,13.8,.16,80,0,P.addHydrant);place(b,83,.16,98.6,0,P.addHydrant);for(const p of[[14,23],[96,91]])place(b,p[0],.16,p[1],0,P.addTrashBin);
  if(lod===0){for(let k=37;k<87;k+=15)for(const e of[12.7,99.3])place(b,e,.16,k,0,P.addParkingMeter);place(b,15,.16,61,Math.PI/2,P.addBench);place(b,83,.16,97,0,P.addBench);place(b,14.8,.16,91,0,P.addUtilityCabinet,{variant:seed%2});place(b,99,.16,24,0,P.addStreetSign,{kind:'restrict'});place(b,20,.16,13,0,P.addStreetSign,{kind:'oneway'});place(b,14,.16,55,0,P.addStreetSign,{kind:'speed'});}
  for(const p of[[3.4,36],[76,108]])place(b,p[0],.016,p[1],0,P.addManhole);for(const p of[[10.4,22,0],[101.6,90,0],[23,10.4,Math.PI/2]])place(b,p[0],.02,p[1],p[2],P.addStormDrain);
  const r=urbanRandom(seed+70);for(let k=0;k<7;k++){let prev=[r()*8,.013,21+r()*70];for(let j=0;j<4;j++){const next=[prev[0]+(r()-.5)*.6,.013,prev[2]+.4+r()*.6];b.rod('rubber',prev,next,.015);prev=next;}}
 }
 b.pop();
}
function* buildBlock(mats,plan,lod){
 const b=new UrbanBatch(mats);b.push(CITY_ORIGIN.x,0,CITY_ORIGIN.z,CITY_ANGLE);roadAndFurniture(b,plan,lod);yield;
 for(const spec of plan.buildings){b.push(spec.x,Y+.15,spec.z,spec.ry);addBuilding(b,{...spec,lod});b.pop();yield;}
 if(!plan.reserved){b.box('asphalt',plan.x+56,Y+.158,plan.z+56,6,.016,77);for(const dz of[30,82]){place(b,plan.x+56,Y+.17,plan.z+dz,0,P.addUtilityCabinet,{variant:dz%2});if(lod===0)place(b,plan.x+53,Y+.17,plan.z+dz+3,0,P.addTrashBin);}}
 b.pop();return{object:b.finish('Level 11 block '+plan.ix+','+plan.iz+' / '+plan.district),colliders:b.colliders,walks:b.walks,plan,lod};
}
export function createExitScene({onAdd=()=>{},onRemove=()=>{}}={}){
 const mats=addReferenceMaterials(createUrbanMaterials()),approach=makeApproach(mats),references=createReferenceScenes(mats),root=new T.Group(),blocks=new Map();root.name='Level 10 to Level 11 / urban fabric';root.add(approach.object,approach.early,references.object);root.visible=false;
 const stats={mode:'10',blocks:0,buildings:approach.records.length,typologies:BUILDING_TYPES.length,triangles:0,draws:0,pending:0,district:'transition'};
 let city=false,origin='',wantedKey='',queue=[],job=null,disposed=false;
 function recount(){stats.blocks=blocks.size;stats.buildings=approach.records.length;stats.triangles=0;stats.draws=0;for(const g of[approach.object,approach.early,references.object,...Array.from(blocks.values(),v=>v.object)]){const q=g.userData.cityStats;stats.triangles+=q.triangles;stats.draws+=q.draws;}for(const v of blocks.values())stats.buildings+=v.plan.buildings.length;stats.pending=queue.length+Number(!!job);}
 function commitBlock(v,key){blocks.set(key,v);root.add(v.object);onAdd(v.object);v.object.updateMatrix();v.object.matrixAutoUpdate=false;v.object.updateMatrixWorld(true);recount();}
 function removeBlock(key){const v=blocks.get(key);if(!v)return;onRemove(v.object);v.object.removeFromParent();v.object.traverse(m=>m.geometry?.dispose());blocks.delete(key);}
 function requestAround(wx,wz,force=false){
  const p=worldToCity(wx,wz),ix=Math.floor(p.x/B),iz=Math.floor(p.z/B),key=ix+','+iz+','+city;if(key===wantedKey&&!force)return;wantedKey=key;
  const wanted=new Set(),next=[];
  for(let dz=-2;dz<=2;dz++)for(let dx=-2;dx<=2;dx++){const ax=ix+dx,az=iz+dz;if(!city&&az<0)continue;const k=ax+','+az;wanted.add(k);if(!blocks.has(k)&&job?.key!==k)next.push({key:k,ix:ax,iz:az,d:dx*dx+dz*dz,lod:Math.max(Math.abs(dx),Math.abs(dz))>1?1:0});}
  next.sort((a,b)=>a.d-b.d);queue=next;for(const[k,v]of blocks){if(!wanted.has(k))removeBlock(k);else if(v.lod===1&&Math.abs(v.plan.ix-ix)<=1&&Math.abs(v.plan.iz-iz)<=1&&job?.key!==k)queue.push({key:k,ix:v.plan.ix,iz:v.plan.iz,d:0,lod:0});}
  if(job&&!wanted.has(job.key)){job.generator.return();job=null;}stats.district=cityDistrict(p.x,p.z);recount();
 }
 function advance(all=false){const start=performance.now();let step=0;do{if(!job){const q=queue.shift();if(!q)break;job={...q,generator:buildBlock(mats,cityBlockPlan(q.ix,q.iz,BUILDING_TYPES),q.lod)};}const result=job.generator.next();step++;if(result.done){const key=job.key;if(blocks.has(key))removeBlock(key);commitBlock(result.value,key);job=null;}}while((all||performance.now()-start<3)&&step<(all?10000:3));stats.pending=queue.length+Number(!!job);}
 function update(state){
  const near=state.cx>=4n&&state.cx<=13n&&state.cz>=-1n&&state.cz<=17n;root.visible=city||near;if(!root.visible||disposed)return;
  const key=`${state.cx},${state.cz}`;if(key!==origin){origin=key;root.position.set(-Number(state.cx)*64,0,-Number(state.cz)*64);root.updateMatrix();root.updateMatrixWorld(true);}
  const wx=Number(state.cx)*64+(state.x||0),wz=Number(state.cz)*64+(state.z||0);const cp=worldToCity(wx,wz),fx=((cp.x%B)+B)%B,fz=((cp.z%B)+B)%B;stats.coverage=2*B+Math.min(fx,fz,B-fx,B-fz)-12;if(city||exitSample(wx,wz,{}).s>190){requestAround(wx,wz);advance();}for(const v of blocks.values())v.object.visible=city||v.plan.iz>=0;
 }
 async function prepareAt(wx,wz){requestAround(wx,wz,true);while(queue.length||job){advance();await new Promise(done=>setTimeout(done,0));}}
 function setCity(value){city=value;stats.mode=value?'11':'10';approach.early.visible=!value;wantedKey='';if(!value){queue=[];if(job){job.generator.return();job=null;}for(const k of blocks.keys())removeBlock(k);}recount();}
 function resolve(position,state){if(!city&&!root.visible)return position;const wx=Number(state.cx)*64,wz=Number(state.cz)*64;position.x+=wx;position.z+=wz;resolveUrban(position,approach.colliders);resolveUrban(position,references.colliders);const p=worldToCity(position.x,position.z),ix=Math.floor(p.x/B),iz=Math.floor(p.z/B);for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){const v=blocks.get((ix+dx)+','+(iz+dz));if(v)resolveUrban(position,v.colliders);}position.x-=wx;position.z-=wz;return position;}
 function floorAt(wx,wz){let y=urbanWalkHeight(wx,wz,references.walks,urbanWalkHeight(wx,wz,approach.walks,Y));const p=worldToCity(wx,wz),ix=Math.floor(p.x/B),iz=Math.floor(p.z/B);for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){const v=blocks.get((ix+dx)+','+(iz+dz));if(v)y=urbanWalkHeight(wx,wz,v.walks,y);}if(p.z<-12&&p.z>-205&&Math.abs(p.x)<40){const s=p.z+382,d=Math.abs(p.x);if(d>roadHalf(s)&&d<roadHalf(s)+4.7)y=Math.max(y,Y+.17);}return y;}
 function dispose(){disposed=true;if(job)job.generator.return();for(const key of blocks.keys())removeBlock(key);root.traverse(m=>m.geometry?.dispose());for(const[key,m]of Object.entries(mats)){if(key.startsWith('sign:')||['photoBanner','photoFamima','photoHope','photoDermica'].includes(key))m.map?.dispose();m.dispose();}root.removeFromParent();}
 recount();return{object:root,update,setCity,resolve,floorAt,stats,dispose,prepareAt,waypoint:name=>name.startsWith('photo-')?referenceWaypoint(name):cityWaypoint(name),references,colliders:[...approach.colliders,...references.colliders],get cityColliders(){return[...approach.colliders,...references.colliders,...Array.from(blocks.values()).flatMap(v=>v.colliders)];},get blocks(){return blocks;},buildingTypes:BUILDING_TYPES};
}
