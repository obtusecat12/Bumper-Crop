import * as T from './vendor/three.module.min.js';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
import {createRetroActor75,RETRO_ROLES75} from './retro-cast-v75.js';

const assets=new Map();let pending=null;
export const INDOOR_OCCUPANTS75=[
 {role:'reader',x:-3.965,y:0,z:10.053,yaw:Math.PI/2,seatHeight:.557,groundHeight:.012,seed:7503},
 {role:'plaid',x:-4.106,y:0,z:11.70,yaw:Math.PI/2,seatHeight:.42347,groundHeight:.012,seed:7504},
 {role:'receptionist',x:3.87,y:0,z:9.64,yaw:-Math.PI/2,seed:7505},
 {role:'poolman',x:.50,y:-.99,z:-4.72,yaw:.21,seed:7506}
];
export const ALLEY_OCCUPANTS75=[
 {role:'homeless',x:1.28,y:.010,z:3.885,yaw:0,seed:7501},
 {role:'wallman',x:-2.025,y:.006,z:-14.34,yaw:-Math.PI/2,seed:7502}
];
export function initializeRetroTextures75(decode=null){
 if(pending)return pending;const loader=new T.TextureLoader();
 const load=async key=>{const url=new URL(`./textures/npc-v75/${key}.png`,import.meta.url);let t;if(decode){const im=await decode(url,128,128);t=new T.DataTexture(im.data,128,128);t.flipY=true;t.needsUpdate=true;}else t=await loader.loadAsync(url.href);t.colorSpace=T.SRGBColorSpace;t.minFilter=t.magFilter=T.NearestFilter;t.generateMipmaps=false;t.anisotropy=1;assets.set(key,t);return t;};
 pending=Promise.all([...RETRO_ROLES75.flatMap(r=>[`${r}/face`,`${r}/body`,`${r}/hair`,...(r==='homeless'?[]:[`${r}/face-blink`])]),'old-pier-label-128','ochre-water-streaks-128','reader-newspaper-128','rubber-mat-128'].map(load));return pending;
}
function textures(role){return{hair:assets.get(`${role}/hair`),face:assets.get(`${role}/face`),faceBlink:assets.get(`${role}/face-blink`),body:assets.get(`${role}/body`),newspaper:assets.get('reader-newspaper-128')};}
function actorAt(p){const actor=createRetroActor75(T,p.role,textures(p.role),p);actor.group.position.set(p.x,p.y,p.z);actor.group.rotation.y=p.yaw;return actor;}
export function createIndoorOccupants75(scene){
 const group=new T.Group();group.name='Six residents V75 / four indoor actors';scene.add(group);
 const actors=INDOOR_OCCUPANTS75.map(p=>{const a=actorAt(p);group.add(a.group);a.group.traverse(o=>o.layers.enable(5));return a;});
 let last=-1;
 return{group,actors,textures:[...assets.values()],update(t,player){if(t===last)return;last=t;for(let i=0;i<actors.length;i++){const a=actors[i],p=INDOOR_OCCUPANTS75[i];a.group.visible=!player||Math.hypot(player.x-p.x,player.z-p.z)<23;if(a.group.visible)a.update(t,0);}},dispose(){actors.forEach(a=>a.dispose());group.removeFromParent();}};
}
// Character collision follows the same world anchors as their geometry.
export function blockedByOccupant75(x,z){return Math.hypot(x-.5,z+4.72)<.75||Math.hypot(x-3.87,z-9.64)<.41||x>-4.3&&x<-3.12&&z>11.14&&z<12.24;}

function patch(parent,points,material,name){const shape=new T.Shape(points.map(p=>new T.Vector2(p[0],-p[1]))),g=new T.ShapeGeometry(shape);g.rotateX(-Math.PI/2);const mesh=new T.Mesh(g,material);mesh.name=name;parent.add(mesh);return mesh;}
function bottles(root){
 const parent=new T.Group();parent.position.set(1.90,.009,4.44);parent.name='Four full-size discarded glass bottles';root.add(parent);
 const glass=new T.MeshLambertMaterial({color:0x415a36,flatShading:true}),amber=new T.MeshLambertMaterial({color:0x66502f,flatShading:true}),label=new T.MeshLambertMaterial({map:assets.get('old-pier-label-128'),flatShading:true});
 const profile=[[.033,0],[.044,.012],[.045,.190],[.042,.225],[.025,.255],[.014,.280],[.014,.343],[.017,.348],[.017,.360],[.012,.361]].map(p=>new T.Vector2(...p));
 const bodyGeo=new T.LatheGeometry(profile,8),labelGeo=new T.CylinderGeometry(.046,.046,.113,8,1,true),rimGeo=new T.TorusGeometry(.015,.003,3,8);
 for(let i=0;i<4;i++){
  const g=new T.Group();g.position.set(i%2*.145,0,Math.floor(i/2)*.195);g.rotation.y=.24+i*.51;parent.add(g);
  const m=i%2?amber:glass,body=new T.Mesh(bodyGeo,m);g.add(body);
  const paper=new T.Mesh(labelGeo,label);paper.position.y=.133;g.add(paper);
  const rim=new T.Mesh(rimGeo,m);rim.rotation.x=Math.PI/2;rim.position.y=.358;g.add(rim);
  if(i===3){g.rotation.set(0,0,Math.PI/2);g.position.set(.29,.047,.16);}
 }
 parent.updateMatrixWorld(true);const inv=parent.matrixWorld.clone().invert(),batches=new Map();
 parent.traverse(o=>{if(!o.isMesh)return;const geo=(o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone());geo.applyMatrix4(inv.clone().multiply(o.matrixWorld));if(!batches.has(o.material))batches.set(o.material,[]);batches.get(o.material).push(geo);});
 parent.clear();for(const [mat,parts]of batches){const g=mergeGeometries(parts);parts.forEach(p=>p.dispose());parent.add(new T.Mesh(g,mat));}
 bodyGeo.dispose();labelGeo.dispose();rimGeo.dispose();
 const spill=patch(parent,[[-.065,.15],[-.16,.08],[-.29,.18],[-.43,.13],[-.52,.27],[-.46,.40],[-.23,.37],[-.12,.25]],new T.MeshLambertMaterial({color:0x303529,transparent:true,opacity:.76,flatShading:true,depthWrite:false}),'Dark drink spill connected to bottle mouth');spill.position.y=.002;
 const paperMaterial=new T.MeshLambertMaterial({map:assets.get('reader-newspaper-128'),side:T.DoubleSide,flatShading:true});
 const papers=new T.Group();papers.name='Old folded newspapers under sleeping man';papers.position.set(1.28,.009,4.22);root.add(papers);
 for(let i=0;i<3;i++){const g=new T.PlaneGeometry(.57,.76,2,3);g.rotateX(-Math.PI/2);const a=g.attributes.position;for(let j=0;j<a.count;j++)a.setY(j,.001+i*.0016+(j%4===0?.003:0));g.computeVertexNormals();const m=new T.Mesh(g,paperMaterial);m.position.set((i-1)*.19,0,(i%2)*.10);m.rotation.y=(i-1)*.18;papers.add(m);}
 let triangles=0;parent.traverse(o=>{if(o.geometry)triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;});papers.traverse(o=>{if(o.geometry)triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;});
 return{group:parent,papers,triangles,dispose(){parent.traverse(o=>o.geometry?.dispose());papers.traverse(o=>o.geometry?.dispose());parent.removeFromParent();papers.removeFromParent();glass.dispose();amber.dispose();label.dispose();spill.material.dispose();paperMaterial.dispose();}};
}
function stream(actor,root){
 const ribbon=new T.PlaneGeometry(.019,1,1,8),p=ribbon.attributes.position,uv=ribbon.attributes.uv;
 for(let i=0;i<p.count;i++){const f=1-uv.getY(i),x=p.getX(i);p.setXYZ(i,x,.893*(1-f),.125+.39*f-.11*f*f);}
 const cross=ribbon.clone(),cp=cross.attributes.position;for(let i=0;i<cp.count;i++){const width=cp.getX(i);cp.setXYZ(i,0,cp.getY(i),cp.getZ(i)+width);}ribbon.computeVertexNormals();cross.computeVertexNormals();const g=mergeGeometries([ribbon,cross]);ribbon.dispose();cross.dispose();const map=assets.get('ochre-water-streaks-128').clone();map.wrapT=T.RepeatWrapping;map.repeat.y=2;map.needsUpdate=true;
 const m=new T.MeshBasicMaterial({map,transparent:true,opacity:.78,side:T.DoubleSide,depthWrite:false});const mesh=new T.Mesh(g,m);mesh.name='Eight-segment scrolling pixel stream / no particles';actor.group.add(mesh);
 const wet=patch(root,[[-2.24,-14.47],[-2.50,-14.53],[-2.565,-14.46],[-2.562,-14.19],[-2.37,-14.17],[-2.20,-14.30]],new T.MeshLambertMaterial({color:0x222e22,transparent:true,opacity:.75,flatShading:true,depthWrite:false}),'Ground-contact corner wet patch');wet.position.y=.007;
 return{update(t){map.offset.y=-(t*.54)%1;},dispose(){g.dispose();m.dispose();map.dispose();wet.geometry.dispose();wet.material.dispose();},triangles:36};
}
export function createAlleyOccupants75(root){
 const mat=new T.Mesh(new T.BoxGeometry(.69,.009,.87),new T.MeshLambertMaterial({map:assets.get('rubber-mat-128'),color:0x4c514a,flatShading:true}));mat.name='Worn antislip mat beside sleeping resident';mat.position.set(-.035,.0045,4.35);root.add(mat);
 const actors=ALLEY_OCCUPANTS75.map(p=>{const a=actorAt(p);root.add(a.group);return a;});const props=bottles(root),flow=stream(actors[1],root);let elapsed=0,lastTick=-1;
 return{actors,props,flow,stats:{triangles:actors.reduce((n,a)=>n+a.diagnostics.triangles,props.triangles+flow.triangles+12),draws:19},update(dt,player,active){if(!active)return;const near=!player||Math.hypot(player.x,player.z+6)<35;if(!near)return;elapsed+=Math.max(0,Math.min(.05,dt||0));const tick=Math.floor(elapsed*24);if(tick===lastTick)return;lastTick=tick;for(const a of actors)a.update(elapsed,dt);flow.update(tick/24);},dispose(){actors.forEach(a=>a.dispose());props.dispose();flow.dispose();mat.geometry.dispose();mat.material.dispose();mat.removeFromParent();}};
}
