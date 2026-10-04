import * as T from './vendor/three.module.min.js';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
import {bevelBox,worldUV} from './bath-v61-materials.js?v=61';
import {VENDING_TRAY as TRAY} from './backcourt-layout-v70.js';
import {GARDEN_DECOR85} from './tiki-garden-dressing-v85.js';
import {gardenDrinkTexture85} from './tiki-garden-drinks-v85.js';
const at=GARDEN_DECOR85.machine,P={origin:{x:at.x,z:at.z},angle:at.ry,groundY:0,machine:[0,0],wallZ:-.87,lamp:[0,2.50,-.78]};
const backcourtWorld=(x,z)=>({x:P.origin.x+Math.cos(P.angle)*x+Math.sin(P.angle)*z,z:P.origin.z-Math.sin(P.angle)*x+Math.cos(P.angle)*z});
const backcourtWaypoint=()=>P.origin;
import {createVendingMaterials,vendingDrinkTextures} from './vending-materials-v70.js';
import {createVendingDrink,VENDING_DRINK_PROFILES,vendingDrinkName,releaseVendingDrink} from './tiki-garden-drinks-v85.js';
import {createVendingPhysics} from './vending-physics-v70.js';
import {almondEnvironment} from './almond-water-assets.js?v=60';

// One architectural batch per material; only the delivery paddle and the
// bounded drink instance buffers move. Everything is in metres.
export function createGardenVending85({seed=0x7011}={}){
 const object=new T.Group();object.name='Garden tropical vending alcove';
 object.position.set(P.origin.x,P.groundY,P.origin.z);object.rotation.y=P.angle;
 const mats=createVendingMaterials(),parts=new Map(),colliders=[],craft=[],cables=[];
 // Reuse the already resident neutral reflection cube, captured once here.
 // Assigning the animated sky cube every frame would rebuild StandardMaterial
 // PMREM data and reintroduce a stall during every weather refresh.
 mats.waterfall.map=gardenDrinkTexture85("coast-lightbox-basecolor");mats.waterfall.emissiveMap=mats.waterfall.map;mats.waterfall.emissiveIntensity=.42;
 const fixedEnvironment=almondEnvironment.value;
 for(const m of Object.values(mats)){m.envMap=fixedEnvironment;m.envMapIntensity=.65;}
 const pose=new T.Object3D(),up=new T.Vector3(0,1,0);let triangleCount=0,partCount=0;
 function add(g,key,x,y,z,rx=0,ry=0,rz=0){
  let copy=g.index?g.toNonIndexed():g.clone();pose.position.set(x,y,z);pose.rotation.set(rx,ry,rz);pose.scale.set(1,1,1);pose.updateMatrix();copy.applyMatrix4(pose.matrix);
  if(!copy.attributes.uv)worldUV(copy,.35);
  if(!parts.has(key))parts.set(key,[]);parts.get(key).push(copy);triangleCount+=copy.attributes.position.count/3;partCount++;g.dispose();
 }
 function box(key,x,y,z,w,h,d,r=.008,rx=0,ry=0,rz=0){add(worldUV(bevelBox(w,h,d,r),.40),key,x,y,z,rx,ry,rz);}
 function cylinder(key,x,y,z,r,h,rx=0,rz=0,n=16){add(new T.CylinderGeometry(r,r,h,n,1),key,x,y,z,rx,0,rz);}
 function rod(key,a,b,r=.008,n=10){const va=new T.Vector3(...a),vb=new T.Vector3(...b),v=vb.clone().sub(va),g=new T.CylinderGeometry(r,r,v.length(),n);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(up,v.normalize()));const mid=va.add(vb).multiplyScalar(.5);add(g,key,mid.x,mid.y,mid.z);}
 function tube(key,points,r=.007,segments=24){const source=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));const curve=new T.Curve();curve.getPoint=(t,target=new T.Vector3())=>{source.getPoint(t,target);target.y=Math.max(r,target.y);return target;};add(new T.TubeGeometry(curve,segments,r,7,false),key,0,0,0);return curve;}
 function plane(key,x,y,z,w,h,rx=0,uv=[0,0,1,1]){const g=new T.PlaneGeometry(w,h),u=g.attributes.uv;for(let i=0;i<u.count;i++)u.setXY(i,uv[0]+u.getX(i)*(uv[2]-uv[0]),uv[1]+u.getY(i)*(uv[3]-uv[1]));add(g,key,x,y,z,rx);}
 function solid(x,z,w,d){const p=backcourtWorld(x,z);colliders.push({kind:'obb',x:p.x,z:p.z,w,d,ry:P.angle});}
 const [mx,mz]=P.machine;
 const bx=(key,x,y,z,w,h,d,r=.008,rx=0)=>box(key,mx+x,y,mz+z,w,h,d,r,rx);
 const cy=(key,x,y,z,r,h,rx=0,rz=0,n=16)=>cylinder(key,mx+x,y,mz+z,r,h,rx,rz,n);
 // Genuine empty delivery opening. The waterfall UVs stay continuous around
 // the opening; a front box would hide the falling and rolling rigid bodies.
 bx('black',.045,1.02,-.703,1.12,1.88,.055,.024);
 bx('black',-.50,1.02,-.286,.052,1.88,.83,.015);
 bx('black',.596,1.02,-.286,.054,1.88,.83,.015);
 bx('black',.045,1.955,-.29,1.12,.072,.88,.018);
 bx('black',.045,.09,-.29,1.12,.055,.88,.012);
 for(const x of[-.43,.52])for(const z of[-.64,.075]){cy('dark',x,.041,z,.035,.082);cy('steel',x,.032,z,.027,.035);}
 const gx0=-.461,gx1=.409,gy0=.116,gy1=1.894;
 function curvedAd(x0,x1,y0,y1){const steps=Math.max(1,Math.ceil((x1-x0)*28)),pos=[],uv=[],index=[];
  for(let row=0;row<2;row++)for(let i=0;i<=steps;i++){const x=x0+(x1-x0)*i/steps,y=row?y1:y0,u=(x-gx0)/(gx1-gx0),v=(y-gy0)/(gy1-gy0);pos.push(mx+x,y,mz+.119+.029*Math.sin(u*Math.PI));uv.push(u,v);}
  for(let i=0;i<steps;i++){const a=i,b=i+1,c=steps+1+i,d=c+1;index.push(a,b,c,b,d,c);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(index);g.computeVertexNormals();add(g,'waterfall',0,0,0);
 }
 curvedAd(gx0,gx1,.64,gy1);curvedAd(gx0,gx1,gy0,.34);curvedAd(gx0,-.255,.34,.64);curvedAd(.255,gx1,.34,.64);
 for(const x of[gx0-.018,gx1+.018])bx('steel',x,1.006,.122,.022,1.82,.025,.004);
 for(const y of[gy0-.015,gy1+.015])bx('steel',(gx0+gx1)/2,y,.126,gx1-gx0+.05,.023,.029,.004);
 bx('dark',0,.505,-.138,.53,.285,.05,.008);
 const front=TRAY.centerZ+TRAY.depth/2,back=TRAY.centerZ-TRAY.depth/2;
 bx('steel',0,TRAY.floorY-TRAY.floorThickness/2,TRAY.centerZ,TRAY.width,TRAY.floorThickness,TRAY.depth,.003,TRAY.slope);
 for(const side of[-1,1])bx('steel',side*(TRAY.width+TRAY.sideThickness)/2,TRAY.floorY+TRAY.sideHeight/2,TRAY.centerZ,TRAY.sideThickness,TRAY.sideHeight,TRAY.depth+TRAY.sideThickness,.004);
 bx('steel',0,TRAY.floorY+TRAY.backHeight/2,back-TRAY.sideThickness/2,TRAY.width+TRAY.sideThickness*2,TRAY.backHeight,TRAY.sideThickness,.004);
 cy('chrome',0,TRAY.floorY-(front-TRAY.centerZ)*Math.tan(TRAY.slope)+TRAY.lipHeight/2,front-TRAY.lipThickness/2,TRAY.lipHeight/2,TRAY.width,0,Math.PI/2,12);
 for(const x of[-.268,.268])bx('black',x,.49,.142,.029,.335,.07,.007);
 bx('black',0,.654,.142,.562,.036,.072,.009);
 bx('black',0,.329,.128,.562,.030,.046,.006);
 // Ventilation, service lock, hinge barrels, rear drain and power inlet.
 for(let i=0;i<9;i++)bx('dark',-.40+i*.10,.185,.151,.059,.008,.006,.002);
 for(const y of[.41,1.49]){cy('steel',-.484,y,.097,.010,.10);cy('dark',.606,y,-.68,.009,.085);}
 cy('chrome',.402,.33,.148,.010,.009,Math.PI/2);bx('dark',.402,.33,.155,.011,.0018,.002,.0005);
 bx('dark',.26,.17,-.741,.115,.115,.018,.005);for(let i=0;i<4;i++)bx('steel',.26,.14+i*.021,-.753,.079,.008,.01,.002);
 cy('dark',.26,.17,-.753,.012,.024,Math.PI/2);
 // The control columns are separately generated print and real raised metal
 // keys, return doors, card/bill slots and recessed LCD frames.
 bx('black',.514,1.016,.102,.190,1.827,.065,.012);
 plane('right',mx+.514,1.016,mz+.137,.17,1.82);
 const ry=pixel=>.106+(1-pixel/2172)*1.82;
 function bezel(x,y,w,h,z=.156){bx('steel',x,y,z,w+.013,h+.013,.018,.004);bx('dark',x,y,z+.011,w,h,.004,.002);}
 bx('black',.514,ry(384),.154,.151,.215,.034,.008);plane('right',mx+.514,ry(384),mz+.174,.145,.206,0,[(268-252)/221,1-507/2172,(458-252)/221,1-261/2172]);
 bezel(.514,ry(320),.092,.043,.182);plane('right',mx+.514,ry(320),mz+.196,.086,.034,0,[(304-252)/221,1-341/2172,(421-252)/221,1-297/2172]);
 bezel(.514,ry(868),.123,.046);bx('dark',.514,ry(873),.177,.105,.012,.006,.002);
 const coinX=.514-.085+((301-252)/221)*.17,returnX=.514-.085+((360-252)/221)*.17;
 cy('chrome',coinX,ry(1013),.166,.019,.016,Math.PI/2);bx('dark',coinX,ry(1013),.177,.003,.030,.004,.001);
 bezel(returnX,ry(1013),.018,.037);bx('steel',returnX,ry(1025),.181,.013,.009,.017,.002);
 for(let i=0;i<10;i++){const y=ry(1169+77*i),x=.514-.085+((430-252)/221)*.17;cy('steel',x,y,.160,.0135,.018,Math.PI/2);cy('cream',x,y,.174,.0102,.009,Math.PI/2);}
 cy('dark',.537265,ry(995),.168,.0075,.012,Math.PI/2); // unlit physical SOLD OUT lens
 const coffeeX=-.701;
 bx('black',coffeeX,1.021,-.292,.294,1.891,.84,.017);
 bx('stainedSteel',coffeeX,1.017,.134,.272,1.817,.034,.015);
 plane('left',mx+coffeeX,1.017,mz+.155,.251,1.786);
 for(const x of[coffeeX-.132,coffeeX+.132])bx('chrome',x,1.02,.154,.014,1.83,.018,.003);
 const ly=pixel=>.124+(1-pixel/2172)*1.786;
 bezel(coffeeX,ly(769),.128,.045);plane('left',mx+coffeeX,ly(769),mz+.178,.12,.032,0,[(303-212)/300,1-799/2172,(447-212)/300,1-740/2172]);
 for(let row=0;row<4;row++)for(let col=0;col<3;col++){
  const sourceX=321+54*col,sourceY=905+[0,57,113,169][row],x=coffeeX-.1255+(sourceX-212)/300*.251;
  cy('chrome',x,ly(sourceY),.172,.015,.022,Math.PI/2);plane('left',mx+x,ly(sourceY),mz+.189,.027,.027,0,[(sourceX-17-212)/300,1-(sourceY+17)/2172,(sourceX+17-212)/300,1-(sourceY-17)/2172]);
 }
 const portraitRim=new T.TorusGeometry(.101,.005,7,40);portraitRim.scale(.91,1.31,1);add(portraitRim,'chrome',mx+coffeeX,ly(250),mz+.174);
 plane('glass',mx+coffeeX,ly(242),mz+.174,.143,.204);
 bezel(coffeeX,ly(1225),.108,.024);bx('dark',coffeeX,ly(1225),.179,.093,.009,.012,.002);
 bx('steel',coffeeX,ly(1718),.176,.174,.018,.082,.005);
 for(let i=0;i<6;i++)bx('dark',coffeeX-.071+i*.028,ly(1718)+.010,.183,.012,.004,.059,.001);
 bezel(coffeeX,ly(1956),.171,.060);bx('steel',coffeeX,ly(1968),.184,.149,.015,.026,.004);
 for(const x of[coffeeX-.1,coffeeX+.1])for(const z of[-.60,.055])cy('dark',x,.036,z,.026,.072);
 bx('dark',-.76,.14,-.718,.064,.060,.020,.008);cy('dark',-.76,.14,-.728,.011,.026,Math.PI/2);
 solid(mx-.095,mz-.30,1.42,.91);
 craft.push({kind:'vending',opening:{x:[-.255,.255],y:[.34,.64]},front:front,tray:{...TRAY}});
 // Two inserted Type B plugs. Every cord starts at an actual machine inlet,
 // rests on the paving, then rises to the outlet, all behind the cabinet.
 const ox=mx+.87,oz=P.wallZ+.043,oy=.345;
 box('stainedSteel',ox,oy,P.wallZ+.017,.145,.226,.036,.008);
 box('cream',ox,oy,oz,.139,.220,.026,.009);
 for(const dy of[-.052,.052]){
  box('cream',ox,oy+dy,oz+.021,.090,.076,.024,.013);
  for(const dx of[-.022,.022])box('dark',ox+dx,oy+dy+.010,oz+.035,.006,.022,.004,.001);
  cylinder('dark',ox,oy+dy-.016,oz+.036,.0048,.006,Math.PI/2);
  for(const dx of[-.022,.022])box('steel',ox+dx,oy+dy+.010,oz+.036,.005,.018,.018,.001);
  cylinder('steel',ox,oy+dy-.016,oz+.036,.0038,.018,Math.PI/2);
  box('dark',ox,oy+dy,oz+.056,.068,.060,.027,.010);
  cylinder('dark',ox,oy+dy-.035,oz+.058,.009,.024);
 }
 for(const dy of[-.094,.094]){cylinder('steel',ox,oy+dy,oz+.016,.005,.004,Math.PI/2);box('dark',ox,oy+dy,oz+.020,.006,.0012,.002,.0005);}
 const routes=[[[mx+.26,.17,mz-.759],[mx+.29,.053,mz-.75],[mx+.50,.006,mz-.77],[ox-.15,.006,oz+.23],[ox,.032,oz+.058],[ox,oy-.052-.047,oz+.058]],[[mx-.76,.14,mz-.737],[mx-.79,.037,mz-.73],[mx-.78,.006,mz-.79],[mx+.30,.006,mz-.83],[ox-.12,.010,oz+.16],[ox,oy+.052-.047,oz+.058]]];
 for(const points of routes){const curve=tube('dark',points,.006,42);let min=Infinity;for(let i=0;i<=168;i++)min=Math.min(min,curve.getPointAt(i/168).y-.006);cables.push({points,minimumY:min});}
 craft.push({kind:'outlet',wallGap:oz-.013-P.wallZ,plugs:2,cables});
 // Grounded wet entrance mat: runtime rigid-body collider uses this exact box.
 const patch=TRAY.groundPatch;box('rubber',mx+patch.center[0],patch.center[1],mz+patch.center[2],...patch.size,.004);
 craft.push({kind:'mat',topY:patch.center[1]+patch.size[1]/2,physicsPatch:patch});
 // Restrained wall-mounted opal fixture creates a small, inhabited service nook
 // without a new shadow map or a full-screen lighting pass.
 const [lx,lyy,lz]=P.lamp;
 box('stainedSteel',lx,lyy,P.wallZ+.034,.17,.31,.069,.018);
 box('stainedSteel',lx,lyy,lz+.072,.47,.25,.168,.026);
 box('opal',lx,lyy-.028,lz+.164,.404,.154,.065,.031);
 for(const dx of[-.211,.211])box('chrome',lx+dx,lyy-.022,lz+.17,.014,.193,.018,.003);
 // Real architectural batches are fixed forever after this merge.
 for(const[key,list]of parts){const g=mergeGeometries(list,false);list.forEach(x=>x.dispose());g.computeBoundingBox();g.computeBoundingSphere();const mesh=new T.Mesh(g,mats[key]);mesh.name='V70 backcourt / '+key;mesh.receiveShadow=true;mesh.castShadow=!['glass','opal','right','left','notice','dial','waterfall'].includes(key);mesh.userData.exitStatic=true;mesh.updateMatrix();mesh.matrixAutoUpdate=false;object.add(mesh);}parts.clear();
 const moving=new T.Group();moving.name='Machine-local drink physics';moving.position.set(mx,0,mz);object.add(moving);
 const prototypes={},instances={},lists={pet:[],can:[],soy:[]},dirty=new Set(['pet','can','soy']),lastPose=new Map();
 for(const type of['pet','can','soy']){
  const asset=createVendingDrink(T,type,{textures:vendingDrinkTextures()});prototypes[type]=asset;
  asset.group.updateMatrixWorld(true);instances[type]=[];
  asset.group.traverse(part=>{if(!part.isMesh)return;part.material.envMap=fixedEnvironment;part.material.envMapIntensity=.70;const im=new T.InstancedMesh(part.geometry,part.material,TRAY.maxBodies);im.name='V70 '+type+' / '+part.name;im.instanceMatrix.setUsage(T.DynamicDrawUsage);im.count=0;im.renderOrder=part.renderOrder;im.receiveShadow=true;im.castShadow=part.castShadow;im.frustumCulled=true;im.boundingSphere=new T.Sphere(new T.Vector3(0,.7,.6),8);im.userData.localPartMatrix=part.matrixWorld.clone();moving.add(im);instances[type].push(im);});
 }
 const paddle=new T.Mesh(worldUV(bevelBox(.38,.07,.010,.003),.12),mats.steel);paddle.name='Mechanical delivery paddle / rigid-body contact';moving.add(paddle);
 const profiles=Object.fromEntries(Object.entries(VENDING_DRINK_PROFILES).map(([key,p])=>[key,{...p,restitution:key==='can'?.09:.06}]));
 const physics=createVendingPhysics({THREE:T,layout:TRAY,profiles,seed});
 const center=new T.Vector3(),q=new T.Quaternion(),position=new T.Vector3(),one=new T.Vector3(1,1,1),transform=new T.Matrix4(),localMatrix=new T.Matrix4();
 const ray=new T.Ray(),inverse=new T.Matrix4(),origin=new T.Vector3(),direction=new T.Vector3(),hit=new T.Vector3(),worldPosition=new T.Vector3();
 const machineBox=new T.Box3(new T.Vector3(-.847,.035,-.755),new T.Vector3(.625,1.991,.190));
 let cooldown=0,disposed=false,version=0;
 function sync(){
  for(const a of Object.values(lists))a.length=0;
  for(const r of physics.records.values()){
   lists[r.type].push(r);let old=lastPose.get(r.id);if(!old){old=new Float32Array(7);old.fill(Infinity);lastPose.set(r.id,old);dirty.add(r.type);}
   for(let i=0;i<7;i++){const value=i<3?r.position[i]:r.quaternion[i-3];if(old[i]!==value){old[i]=value;dirty.add(r.type);}}
  }
  for(const type of dirty){for(const im of instances[type]){const a=lists[type];for(let i=0;i<a.length;i++){position.fromArray(a[i].position);q.fromArray(a[i].quaternion);transform.compose(position,q,one);localMatrix.multiplyMatrices(transform,im.userData.localPartMatrix);im.setMatrixAt(i,localMatrix);}im.count=a.length;im.instanceMatrix.needsUpdate=true;}version++;}dirty.clear();
  if(physics.pusherTransform){paddle.position.fromArray(physics.pusherTransform.position);paddle.quaternion.fromArray(physics.pusherTransform.quaternion);}else paddle.position.set(0,TRAY.floorY+.046,back-.027);
 }
 function dispense(){
  if(disposed)return{ok:false,reason:'unavailable'};if(cooldown>0)return{ok:false,reason:'busy'};
  if(physics.size>=TRAY.maxBodies)return{ok:false,reason:'full'};
  const type=['pet','can','soy'][Math.floor(Math.random()*3)],record=physics.spawn(type);if(!record)return{ok:false,reason:'busy'};
  dirty.add(type);cooldown=.84;sync();return{ok:true,id:record.id,type,name:vendingDrinkName(type)};
 }
 function tick(dt,state,playing,camera){
  if(disposed)return;let active=!!playing;
  if(state?.mapOpen)active=false;
  if(camera){moving.updateWorldMatrix(true,false);worldPosition.set(0,0,0).applyMatrix4(moving.matrixWorld);active=active&&camera.position.distanceToSquared(worldPosition)<18*18;}
  physics.step(dt,{active,interpolate:true});if(active)cooldown=Math.max(0,cooldown-Math.min(dt,.067));sync();
 }
 function query(camera){
  if(disposed)return null;moving.updateWorldMatrix(true,false);inverse.copy(moving.matrixWorld).invert();origin.copy(camera.position).applyMatrix4(inverse);camera.getWorldDirection(direction);direction.transformDirection(inverse);ray.set(origin,direction);
  let best=null,bestT=2.1;
  for(const r of physics.records.values()){
   q.fromArray(r.quaternion);center.set(0,r.profile.height*.5,0).applyQuaternion(q).add(position.fromArray(r.position));
   const t=center.clone().sub(origin).dot(direction);if(t<.01||t>bestT)continue;
   const radius=Math.max(.075,r.profile.height*.39),d2=ray.distanceSqToPoint(center);if(d2>radius*radius)continue;
   best={kind:'vending-drink',id:r.id,name:vendingDrinkName(r.type),type:r.type};bestT=t;
  }
  if(best)return best;
  if(origin.z>.17&&ray.intersectBox(machineBox,hit)&&hit.distanceTo(origin)<2.3)return{kind:'vending-machine',name:'Tropical Almond Water',cooldown};
  return null;
 }
 function pickup(id){const r=physics.get(id);if(!r)return null;moving.updateWorldMatrix(true,false);q.fromArray(r.quaternion);worldPosition.set(0,r.profile.height*.5,0).applyQuaternion(q).add(position.fromArray(r.position)).applyMatrix4(moving.matrixWorld);physics.remove(id);dirty.add(r.type);lastPose.delete(id);sync();return{variant:{kind:'garden-vending',type:r.type,id},worldPosition:worldPosition.clone()};}
 function dispose(){disposed=true;physics.dispose();for(const a of Object.values(prototypes))releaseVendingDrink(a.group);for(const m of Object.values(mats))m.dispose();}
 object.userData.cityStats={triangles:triangleCount,draws:object.children.length-1,parts:partCount};
 object.userData.backcourtCraft=craft;object.userData.vendingPhysics=physics;
 sync();object.updateMatrixWorld(true);
 return{object,colliders,waypoint:backcourtWaypoint(),physics,prototypes,instances,mats,craft,cables,dispense,tick,query,pickup,dispose,sync,get version(){return version;},get cooldown(){return cooldown;}};
}
