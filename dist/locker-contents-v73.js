import * as T from './vendor/three.module.min.js';
import {addBox,addTube,addPlane,worldUV} from './bath-v61-materials.js?v=61';
import {receptionMaterials73} from './reception-materials-v73.js';
function croppedLabel(root,mat,x,y,z,w,h,minV,maxV,ry=0){const o=addPlane(root,mat,x,y,z,w,h,ry,0,'Generated mid-century VELORA soap wrapper');const uv=o.geometry.attributes.uv;for(let i=0;i<uv.count;i++)uv.setY(i,minV+uv.getY(i)*(maxV-minV));return o;}
export function addLockerContents73(root,old,kind){const m=receptionMaterials73();
 if(kind==='soap'){
  const wrapper=new T.Group();wrapper.position.set(.07,1.031,.074);wrapper.rotation.y=-.18;wrapper.name='Mid-century wrapped VELORA bath soap';root.add(wrapper);
  addBox(wrapper,old.basket,0,.029,0,.094,.056,.034,'Real folded soap carton',.004);
  croppedLabel(wrapper,m['soap-label'],0,.029,.018,.091,.053,.437001595,1);
  croppedLabel(wrapper,m['soap-label'],0,.029,-.018,.091,.053,0,.437001595,Math.PI);
  for(const x of[-.046,.046])addTube(wrapper,old.basket,[[x,.005,-.015],[x,.015,0],[x,.005,.015]],.0007,'Triangular tucked paper seam',4);
  return;
 }
 addTube(root,old.chrome,[[-.182,1.862,-.090],[.182,1.862,-.090]],.006,'Interior hanger rod seated into locker sides',4);
 addTube(root,old.chrome,[[0,1.846,-.096],[.011,1.881,-.092],[-.020,1.884,-.082],[-.031,1.858,-.078],[0,1.822,-.081],[0,1.795,-.081]],.0035,'Hook around the real hanger rail',12);
 addTube(root,m.walnut,[[0,1.796,-.08],[-.143,1.713,-.08],[.143,1.713,-.08],[0,1.796,-.08]],.008,'Wooden triangular clothes hanger',14);
 // A shirt folded inward to fit the 37 cm locker; full-size fabric is draped
 // over a compact hanger, rather than a miniature human-shaped costume.
 const rows=28,columns=28,pos=[],uv=[],idx=[];
 for(let j=0;j<=rows;j++){const v=j/rows,y=1.729-v*.586,width=.137+.006*Math.sin(v*7)+.009*v;for(let i=0;i<=columns;i++){const u=i/columns,x=(u-.5)*width*2,fold=.014*Math.sin(u*37+v*2)+.006*Math.sin(u*59-v*5);pos.push(x,y,-.052+fold+.019*Math.sin(v*Math.PI));uv.push(u*1.1,v*2.4);}}
 for(let j=0;j<rows;j++)for(let i=0;i<columns;i++){const a=j*(columns+1)+i,b=a+columns+1;idx.push(a,b,a+1,a+1,b,b+1);}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setAttribute('uv1',geo.attributes.uv.clone());geo.setIndex(idx);geo.computeVertexNormals();const shirt=new T.Mesh(geo,m.fabric);shirt.material.side=T.DoubleSide;shirt.castShadow=shirt.receiveShadow=true;shirt.name='Folded hanging striped cotton shirt with real vertical pleats';root.add(shirt);
 for(const side of[-1,1]){
  const sleeve=new T.Mesh(new T.CylinderGeometry(.041,.033,.439,12,10,true),m.fabric);const p=sleeve.geometry.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i),a=Math.atan2(p.getZ(i),p.getX(i));p.setX(i,p.getX(i)+.008*Math.sin(y*52+a*3));p.setZ(i,p.getZ(i)+.005*Math.sin(y*37));}sleeve.geometry.computeVertexNormals();sleeve.position.set(side*.102,1.473,-.005);sleeve.rotation.z=side*.105;sleeve.castShadow=true;sleeve.name='Sleeve folded down inside hanging shirt';root.add(sleeve);
  const collar=new T.Mesh(new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute([side*.008,1.762,-.005,side*.056,1.733,-.002,side*.027,1.692,.028],3)).setAttribute('uv',new T.Float32BufferAttribute([0,0,1,0,.5,1],2)),m.fabric);collar.geometry.computeVertexNormals();collar.name='Turned cotton shirt collar';root.add(collar);
 }
 addTube(root,m.fabric,[[0,1.704,-.026],[.001,1.481,-.018],[-.004,1.161,-.032]],.008,'Folded shirt front placket',12);
 for(let i=0;i<5;i++){const b=new T.Mesh(new T.SphereGeometry(.004,8,4),old.basket);b.scale.z=.3;b.position.set(0,1.671-i*.104,-.010);root.add(b);}
 const watch=new T.Group();watch.position.set(-.056,1.033,.104);watch.rotation.y=.53;watch.name='Discarded chipped-steel digital watch';root.add(watch);
 const worn=old.steel.clone();worn.name='Generated worn plated watch bracelet';worn.color.set(0xb4bbb1);worn.metalness=1;worn.roughness=.46;
 addBox(watch,worn,0,.013,0,.041,.021,.046,'Beveled rectangular electronic watch case',.006);
 const face=addPlane(watch,m['watch-face'],0,.024,0,.035,.041,0,-Math.PI/2,'Generated MERIDIAN QUARTZ LCD face');
 for(const side of[-1,1]){for(let i=0;i<6;i++){const z=side*(.026+i*.0085),y=.004+Math.pow(i/5,2)*.012;const link=addBox(watch,worn,0,y,z,.029,.005,.0074,'Individual chipped metal bracelet link',.0014);link.rotation.x=-side*i*.049;for(const x of[-.009,.009])addBox(watch,old.chrome,x,y+.003,z,.0018,.0008,.006,'Polished bracelet link reveal',.0003);}
  addBox(watch,old.chrome,side*.023,.014,.006,.006,.007,.012,'Physical metal watch push button',.001);}
}
