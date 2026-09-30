import * as T from './vendor/three.module.min.js';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
import {UrbanBatch} from './urban-batch.js?v=60';
import {clinicToWorld,CLINIC_ANGLE} from './reference-scenes.js?v=60';
import {EXIT_CITY_Y} from './exit-route.js?v=60';
import {bathRefitMaterials,addBox,addPlane,addTube,worldUV} from './bath-v61-materials.js?v=61';
import {makePlasticChair,makeRockPlanter} from './bath-v61-props.js?v=61';
import {wetFloorMaterial} from './bath-v61-wet.js?v=61';
const center=clinicToWorld(91.4,40),angle=CLINIC_ANGLE-Math.PI/2,Y=EXIT_CITY_Y+.17;
export const BATH_ADDRESS={x:center.x,z:center.z,angle};
export function bathLocal(wx,wz){const c=Math.cos(angle),s=Math.sin(angle),x=wx-center.x,z=wz-center.z;return{x:c*x-s*z,z:s*x+c*z};}
export function nearBathEntrance(wx,wz){const p=bathLocal(wx,wz);return Math.abs(p.x-.83)<.83&&p.z< -14.35&&p.z> -15.82;}
export function underShower(){return false;}
export function nearShower(){return false;}
export function bathPoint(x,z){const c=Math.cos(angle),s=Math.sin(angle);return{x:center.x+c*x+s*z,z:center.z-s*x+c*z};}
export const BATH_WAYPOINT={...bathPoint(-1.40,5.30),yaw:angle,pitch:.025,label:'Level 27 入口 · 深巷热水浴室'};
export function createSpringEntrance(){
 const m=bathRefitMaterials(),root=new T.Group(),local=new T.Group();root.name='Deep service alley / 1980s bathhouse';local.position.set(center.x,Y,center.z);local.rotation.y=angle;root.add(local);
 const b=new UrbanBatch({});b.push(center.x,Y,center.z,angle);
 const box=(mat,x,y,z,w,h,d,n='',r=.018)=>addBox(local,mat,x,y,z,w,h,d,n,r),plane=(mat,x,y,z,w,h,ry=0,rx=0,n='')=>addPlane(local,mat,x,y,z,w,h,ry,rx,n),pipe=(pts,r=.026,mat=m.metal,n='Service pipe')=>addTube(local,mat,pts,r,n,32);
 const floor=wetFloorMaterial(m.paving,{baseWet:.68});box(floor,0,-.13,-6.3,5.60,.18,19.40,'Continuous support below alley paving');b.walk(0,-6.30,5.6,19.4,0);
 // Existing 6m-wide service parcel between the two landmark buildings; rear extension stays inside it.
 for(const x of[-2.72,2.72]){
  box(m.plaster,x,3.36,-6.30,.21,6.72,19.4,'Chamfered mineral-stained party wall',.036);b.solid(x,-6.3,.21,19.4);
  box(m.jade,x-Math.sign(x)*.122,.55,-6.30,.035,1.10,19.2,'Green tiled damp course',.005);
  const p=plane(m.border,x-Math.sign(x)*.143,1.16,-6.30,19.2,.18,x<0?Math.PI/2:-Math.PI/2);for(let i=0;i<p.geometry.attributes.uv.count;i++)p.geometry.attributes.uv.setX(i,p.geometry.attributes.uv.getX(i)*13);
  box(m.stone,x-Math.sign(x)*.125,.07,-6.3,.07,.14,19.2,'Continuous ground-contact coping');
  box(m.stone,x,6.74,-6.3,.30,.12,19.43,'Wall coping');
 }
 // A deep street-building shoulder hides the bath door until the second turn.
 box(m.plaster,1.42,3.36,-2.30,2.44,6.72,11.40,'Street building with a deep service return',.055);b.solid(1.42,-2.3,2.44,11.4);
 box(m.stone,1.42,.46,3.45,2.46,.91,.12,'Worn stone shop plinth');
 // Actual slatted louver: backed recess, thick frame and angled independent louvers.
 box(m.dark,1.42,1.69,3.484,1.77,1.49,.035,'Recess behind vintage louver');
 for(const x of[.52,2.32])box(m.plastic,x,1.69,3.55,.075,1.60,.12,'Louver frame');for(const y of[.90,2.48])box(m.plastic,1.42,y,3.55,1.86,.07,.12);
 for(let i=0;i<16;i++){const o=box(m.plastic,1.42,.974+i*.092,3.585,1.70,.075,.065,'Beige tilted louver blade',.009);o.rotation.x=-.34;}
 for(const y of[3.55,5.22])for(const x of[.86,1.97]){box(m.dark,x,y,3.488,.64,1.05,.055,'Window recess');for(const xx of[x-.355,x+.355])box(m.stone,xx,y,3.55,.074,1.23,.15,'Window reveal');for(const yy of[y-.59,y+.59])box(m.stone,x,yy,3.55,.78,.068,.15);plane(m.glass,x,y,3.525,.62,1.08);for(let k=0;k<7;k++)box(m.plastic,x,y-.4+k*.13,3.54,.60,.051,.035,'Physical window blind');}
 // Narrow transverse buttress adds a second layer of occlusion but leaves 2.7m passage.
 box(m.plaster,-1.45,1.8,-10.10,2.34,3.60,.35,'Inset service wall and turn',.04);b.solid(-1.45,-10.10,2.34,.35);box(m.jade,-1.45,.58,-9.904,2.30,1.15,.04);
 // End wall with a real 1.45m opening. Door and glazing are seated inside its jambs.
 for(const [x,w]of[[-1.25,2.70],[2.10,1.05]]){box(m.plaster,x,3.36,-16.1,w,6.72,.24,'Rear bath wall');b.solid(x,-16.1,w,.24);}
 box(m.plaster,.83,4.53,-16.1,1.48,4.38,.24,'Bath entrance lintel');b.solid(.83,-16.10,1.48,.16);
 for(const x of[-.10,1.76])box(m.jade,x,1.45,-15.90,.38,2.90,.23,'Green tile entrance reveal',.025);
 box(m.jade,.83,2.82,-15.90,2.23,.29,.23,'Tile portal header');
 for(const x of[.075,1.585])box(m.plastic,x,1.21,-15.745,.10,2.42,.15,'Thick bath door jamb');box(m.plastic,.83,2.44,-15.745,1.62,.09,.15);box(m.stone,.83,.036,-15.73,1.66,.07,.31,'Flush stone threshold');
 const door=new T.Group();door.position.set(.14,0,-15.80);door.rotation.y=-.12;local.add(door);
 for(const x of[0,1.37])addBox(door,m.plastic,x,1.17,0,.075,2.34,.078,'Glazed door stile');for(const y of[.06,.59,2.31])addBox(door,m.plastic,.685,y,0,1.37,.09,.078,'Glazed door rail');
 addBox(door,m.jade,.685,.33,0,1.30,.44,.071,'Tiled kick panel');addPlane(door,m.glass,.685,1.47,.005,1.30,1.64,0,0,'Diamond embossed frosted glass');
 addTube(door,m.metal,[[1.18,.91,.055],[1.18,.93,.125],[1.18,1.31,.125],[1.18,1.34,.055]],.017,'Chromed pull handle');
 box(m.plaster,.83,1.25,-16.22,1.42,2.43,.06,'Interior light behind frosted entrance');
 // Both lightboxes use the separately generated face image.
 box(m.dark,.83,2.88,-15.68,2.62,.96,.21,'Weathered lightbox housing',.035);plane(m.sign,.83,2.88,-15.562,2.46,.82,0,0,'BAÑOS - SHOWERS generated sign');
 const projecting=new T.Group();projecting.position.set(.13,2.85,3.18);projecting.rotation.y=-Math.PI/2;local.add(projecting);addBox(projecting,m.dark,0,0,0,1.44,.55,.12,'Projecting street sign');addPlane(projecting,m.sign,0,0,.068,1.35,.45);addPlane(projecting,m.sign,0,0,-.068,1.35,.45,Math.PI);
 pipe([[.20,2.99,3.15],[-.55,2.99,3.15]],.025,m.dark,'Street sign mounting');
 // Sewage drain has continuous support, individual covers, and a fall toward the back.
 box(m.dark,-2.34,-.002,-6.1,.17,.028,18.8,'Open drainage trough');for(let z=-15.3;z<3.2;z+=.18)box(m.metal,-2.34,.016,z,.16,.014,.023,'Drain grate',.003);
 for(const [x,z]of[[-2.50,2.85],[-2.50,-6.20],[2.50,-11.7]]){
  pipe([[x,.09,z],[x,.30,z],[x,5.95,z],[x-Math.sign(x)*.11,6.23,z]],.052,m.metal,'Downpipe seated in wall brackets');
  for(const y of[.47,2.4,4.5,5.9])box(m.dark,x+Math.sign(x)*.057,y,z,.12,.042,.15,'Pipe saddle clamp',.007);
 }
 pipe([[-2.55,.25,-4.3],[-2.55,1.33,-4.3],[-2.55,1.45,-4.5],[-2.55,1.45,-9],[-2.55,2.1,-9]],.018,m.dark,'Electrical service conduit');box(m.plastic,-2.54,1.60,-4.3,.15,.56,.40,'Seated electricity meter');plane(m.glass,-2.451,1.69,-4.3,.22,.22,Math.PI/2);
 pipe([[-2.58,5.20,-2],[0,4.88,-2.5],[2.58,5.16,-3]],.012,m.dark,'Sagging overhead cable');pipe([[-2.58,4.75,-12],[0,4.38,-11.6],[2.58,4.7,-12]],.011,m.dark,'Sagging rear service cable');
 // Ornamental iron lamps are complete brackets, hoods, cages, and opal glass.
 function wallLamp(x,z,side){const g=new T.Group();g.position.set(x,2.44,z);g.rotation.y=side===1?Math.PI/2:-Math.PI/2;local.add(g);addBox(g,m.dark,0,0,0,.12,.43,.045,'Lamp wall plate');addTube(g,m.dark,[[0,.10,.02],[0,.30,.12],[0,.34,.36],[0,.08,.42]],.022,'Curled iron lamp arm');addTube(g,m.dark,[[0,-.03,.04],[0,.12,.23],[0,.04,.34],[0,-.06,.22],[0,.04,.16]],.012,'Iron scroll brace');addBox(g,m.lamp,0,-.04,.41,.17,.26,.17,'Opal wall lamp');for(const xx of[-.108,.108])for(const zz of[.302,.518])addTube(g,m.dark,[[xx,-.20,zz],[xx,.12,zz]],.012,'Lantern cage');addBox(g,m.dark,0,.135,.41,.29,.055,.29,'Lantern rain hood');addBox(g,m.dark,0,-.215,.41,.25,.04,.25,'Lantern base');}
 for(const z of[1.5,-4.1,-12.3])wallLamp(-2.57,z,1);wallLamp(2.57,-14.1,-1);
 // Irregular attached vine clusters: sparse near ground, denser at damp drain runs.
 for(const [x,y,z,w,h,ry]of[[-2.586,2.20,-3.5,2.4,3.7,Math.PI/2],[-2.585,3.15,-7.6,2.6,4.4,Math.PI/2],[2.584,2.62,-11.0,2.25,3.8,-Math.PI/2],[-2.585,2.2,-14,1.8,3.0,Math.PI/2]])plane(m.foliage,x,y,z,w,h,ry,0,'Generated ivy against masonry');
 const chair=makePlasticChair(T,m);chair.position.set(-1.86,0,-13.2);chair.rotation.y=.47;local.add(chair);b.circle(-1.86,-13.2,.33);
 for(const [x,z,sc]of[[2.19,-14.96,.76],[-2.01,-15.18,.65],[-2.08,-8.6,.72]]){const p=makeRockPlanter(T,m);p.position.set(x,0,z);p.scale.setScalar(sc);local.add(p);b.circle(x,z,.31*sc);}
 // Subdivided ground supplies actual 6mm paving relief; wet patches stay inside its material.
 const pavingGeo=new T.PlaneGeometry(5.38,19.32,24,88);pavingGeo.rotateX(-Math.PI/2);const pavingP=pavingGeo.attributes.position;
 for(let i=0;i<pavingP.count;i++){const x=pavingP.getX(i),z=pavingP.getZ(i);pavingP.setY(i,-.002+.0037*Math.sin(x*6.4)*Math.sin(z*3.9)+.0015*Math.cos(z*10.3+x*4.1));}
 pavingGeo.computeVertexNormals();worldUV(pavingGeo,1.25);const pavingMesh=new T.Mesh(pavingGeo,floor);pavingMesh.position.z=-6.3;pavingMesh.receiveShadow=true;local.add(pavingMesh);
 // Batch static opaque architecture by material, retaining grounded details.
 local.updateMatrixWorld(true);const groups=new Map();local.traverse(o=>{if(!o.isMesh)return;const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrixWorld);if(!groups.has(o.material))groups.set(o.material,[]);groups.get(o.material).push(g);});root.clear();let triangles=0;for(const [mat,parts]of groups){const g=mergeGeometries(parts);parts.forEach(p=>p.dispose());g.computeBoundingBox();g.computeBoundingSphere();const mesh=new T.Mesh(g,mat);mesh.castShadow=!mat.transparent;mesh.receiveShadow=true;mesh.userData.exitStatic=true;mesh.name=mat.name;root.add(mesh);triangles+=g.attributes.position.count/3;}
 root.userData.cityStats={triangles,draws:root.children.length,parts:root.children.length};b.pop();return{object:root,colliders:b.colliders,walks:b.walks,waypoint:BATH_WAYPOINT,update(t){floor.userData.wetUniforms.bTime.value=t||0;}};
}
