import * as T from './vendor/three.module.min.js';
import {addBox,addPlane,addTube} from './bath-v61-materials.js?v=61';
import {makeDispenser,makeTelephone,makePlasticChair,makeRockPlanter} from './bath-v61-props.js?v=61';
import {wetFloorMaterial} from './bath-v61-wet.js?v=61';
import {changingMaterials} from './changing-materials-v72.js';
import {RECEPTION,LOBBY_DOOR,RECEPTION_COUNTER,WAITING_Z} from './bathhouse-plan-v72.js';
export function buildReception72(root,m){
 const c=changingMaterials(),floor=wetFloorMaterial(m.floor,{baseWet:.22});
 const box=(mat,x,y,z,w,h,d,n='',r=.02)=>addBox(root,mat,x,y,z,w,h,d,n,r),plane=(mat,x,y,z,w,h,ry=0,rx=0,n='')=>addPlane(root,mat,x,y,z,w,h,ry,rx,n);
 box(floor,0,-.09,10,9.6,.18,7.2,'Enlarged continuous reception floor');
 for(const x of[-4.8,4.8]){
  box(m.plaster,x,1.51,10,.18,3.02,7.2,'Reception plaster return');box(m.jade,x-Math.sign(x)*.107,.56,10,.036,1.12,7.14,'Continuous reception jade wainscot',.005);
  const p=plane(m.border,x-Math.sign(x)*.13,1.18,10,7.14,.18,x<0?Math.PI/2:-Math.PI/2);const uv=p.geometry.attributes.uv;for(let i=0;i<uv.count;i++)uv.setX(i,uv.getX(i)*5.55);
  box(m.stone,x-Math.sign(x)*.12,.055,10,.09,.11,7.16,'Rounded reception floor cove',.025);
 }
 function endWall(z,doorX,doorWidth,entrance=false){
  const intervals=[[-4.8,doorX-doorWidth/2],[doorX+doorWidth/2,4.8]];
  for(const[a,b]of intervals){const x=(a+b)/2,w=b-a;box(m.plaster,x,1.51,z,w,3.02,.18,'Unified plaster doorway wall');box(m.jade,x,.56,z+(entrance?-.106:.106),w,1.12,.036,'Doorway jade tile matched to sidewalls',.004);const p=plane(m.border,x,1.18,z+(entrance?-.132:.132),w,.18,entrance?Math.PI:0);const uv=p.geometry.attributes.uv;for(let i=0;i<uv.count;i++)uv.setX(i,uv.getX(i)*w/.95);box(m.stone,x,.055,z+(entrance?-.12:.12),w,.11,.07,'Doorway coved base');}
  box(m.plaster,doorX,2.735,z,doorWidth,.57,.18,'Beveled solid lintel');
  for(const x of[doorX-doorWidth/2,doorX+doorWidth/2])box(m.plastic,x,1.20,z,.075,2.40,.24,'Thick door jamb',.012);box(m.plastic,doorX,2.39,z,doorWidth+.075,.08,.24,'Door frame header',.012);
 }
 endWall(6.4,LOBBY_DOOR.x,LOBBY_DOOR.width);endWall(13.6,0,1.70,true);
 box(m.plaster,0,3.10,10,9.75,.16,7.4,'Reception continuous ceiling');
 for(const x of[-4.59,4.59])box(m.plaster,x,2.94,10,.29,.20,7.18,'Rounded perimeter soffit',.045);
 for(const z of[6.62,13.38])box(m.plaster,0,2.94,z,9.20,.20,.29,'Continuous soffit return',.045);
 const door=new T.Group();door.name='Original glazed entrance assembly moved to new wall';root.add(door);door.position.set(.76,0,13.51);door.rotation.y=-.13;
 for(const x of[-1.49,0])addBox(door,m.plastic,x,1.18,0,.085,2.32,.075,'Glazed leaf stile');for(const y of[.07,.56,2.30])addBox(door,m.plastic,-.745,y,0,1.49,.10,.075,'Door rail');addPlane(door,m.glass,-.745,1.43,-.004,1.4,1.62,0,0,'Diamond embossed entrance glass');addBox(door,m.jade,-.745,.31,0,1.4,.39,.072,'Door kick panel');addTube(door,m.metal,[[-1.25,.9,-.07],[-1.25,.92,-.12],[-1.25,1.32,-.12],[-1.25,1.34,-.07]],.015,'Door pull');
 box(m.dark,0,.023,13.51,1.66,.042,.22,'Flush exit threshold');
 const counter=new T.Group();counter.name='Rotated original counter with 1.3 metre service aisle';counter.position.set(RECEPTION_COUNTER.x,0,RECEPTION_COUNTER.z);counter.rotation.y=RECEPTION_COUNTER.yaw;root.add(counter);
 const cb=(mat,x,y,z,w,h,d,n,r=.02)=>addBox(counter,mat,x,y,z,w,h,d,n,r);
 cb(m.wood,0,.51,0,2.10,1.02,.77,'Oak reception cabinet',.034);cb(m.dark,0,.052,0,2.05,.105,.72,'Grounded counter plinth');
 for(const x of[-.91,-.32,.28,.88])cb(m.wood,x,.56,.396,.04,.80,.035,'Raised cabinet stile',.009);cb(m.stone,0,1.055,0,2.20,.08,.88,'Worn rounded counter slab',.025);
 const put=(p,x,y,z,ry=0,s=1)=>{p.position.set(x,y,z);p.rotation.y=ry;p.scale.setScalar(s);counter.add(p);};
 const dispenser=makeDispenser(T,m);const lead=dispenser.getObjectByName('Trailing_power_cord');if(lead){lead.removeFromParent();lead.geometry.dispose();}put(dispenser,.64,1.095,.135,0,.91);put(makeTelephone(T,m),-.21,1.095,-.02,-.16,.91);
 for(let i=0;i<3;i++){cb(c.wood,-.81,1.12+i*.045,.09,.27,.043,.34,'Ledger cover');cb(m.plaster,-.81,1.12+i*.045,.12,.25,.031,.29,'Ledger paper',.002);}
 // Actual connected outlet, cable and strain relief for the moved dispenser.
 addBox(root,m.plastic,4.666,.35,10.53,.075,.14,.095,'Wall outlet housing');addBox(root,m.dark,4.617,.35,10.53,.031,.061,.049,'Inserted mains plug');addTube(root,m.dark,[[4.59,.35,10.53],[4.51,.07,10.51],[4.13,.018,10.47],[3.47,.018,10.46],[3.24,.12,10.45],[3.13,.64,10.39],[3.11,1.105,10.43],[2.98,1.11,10.43],[2.84,1.137,10.467],[2.846,1.158,10.455]],.010,'Counter dispenser grounded power cable',30);
 for(const z of WAITING_Z){const chair=makePlasticChair(T,m);chair.position.set(-4.13,0,z);chair.rotation.y=Math.PI/2;chair.scale.setScalar(.94);root.add(chair);}
 const planter=makeRockPlanter(T,m);planter.position.set(-3.93,0,12.74);planter.scale.setScalar(.85);root.add(planter);
 plane(m.sign,4.688,2.06,9.35,1.65,.55,-Math.PI/2,0,'Existing generated BAÑOS sign');
 box(m.wood,4.62,1.67,11.11,.12,.87,1.01,'Original key cabinet');
 for(let i=0;i<12;i++){const z=10.74+(i%4)*.235,y=1.94-Math.floor(i/4)*.25;addTube(root,m.metal,[[4.54,y,z],[4.48,y-.035,z],[4.48,y-.07,z]],.008,'Brass key hook',8);const o=new T.Mesh(new T.TorusGeometry(.024,.005,5,10),m.metal);o.position.set(4.48,y-.09,z);o.rotation.y=Math.PI/2;root.add(o);box(m.plastic,4.48,y-.15,z,.013,.065,.045,'Key tag',.004);}
 // Folded broadsheets sit in three separate wire pockets on a heavy 2006 rack.
 const rack=new T.Group();rack.position.set(-3.7,0,7.4);rack.rotation.y=.40;root.add(rack);
 for(const x of[-.29,.29]){addTube(rack,c.steel,[[x,.015,.23],[x,1.21,-.10],[x,1.22,-.20],[x,.015,-.32]],.018,'Newspaper stand side frame',14);addBox(rack,c.rubber,x,.014,.20,.055,.027,.13,'Rubber stand foot');}
 for(let i=0;i<3;i++){const y=.26+i*.28;addBox(rack,c.steel,0,y,-.10,.59,.035,.23,'Newspaper shelf');addBox(rack,c.steel,0,y+.12,.014,.59,.018,.018,'Pocket retaining rail');for(const x of[-.28,0,.28])addTube(rack,c.steel,[[x,y+.01,.01],[x,y+.12,.014]],.007,'Pocket wire',4);
  for(let n=0;n<2;n++){const paper=addPlane(rack,c.paper,-.123+n*.246,y+.155,-.094,.232,.31,0,-.20,'Generated English 2006 broadsheet');paper.rotation.z=(n-.5)*.035;addBox(rack,m.plaster,-.123+n*.246,y+.155,-.103,.232,.009,.295,'Folded newspaper thickness',.002).rotation.x=Math.PI/2-.20;}}
 for(const z of[8.3,11.5]){box(c.steel,0,2.92,z,1.63,.12,.38,'Reception enclosed twin tube trough');for(const x of[-.095,.095]){const t=new T.Mesh(new T.CylinderGeometry(.025,.025,1.43,10),c.glow);t.rotation.z=Math.PI/2;t.position.set(0,2.842,z+x);root.add(t);}}
 return{floor,materials:c};
}
