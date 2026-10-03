import * as T from './vendor/three.module.min.js';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
import {createRetroActor74,RETRO_ROLES74} from './retro-cast-v74.js';

const assets=new Map();let pending=null;
export const INDOOR_OCCUPANTS74=[
 {role:'reader',x:-3.965,y:0,z:10.053,yaw:Math.PI/2,seatHeight:.557,groundHeight:.012,seed:7403},
 {role:'plaid',x:-4.106,y:0,z:11.70,yaw:Math.PI/2,seatHeight:.42347,groundHeight:.012,seed:7404},
 {role:'receptionist',x:3.87,y:0,z:9.64,yaw:-Math.PI/2,seed:7405},
 {role:'poolman',x:.50,y:-.99,z:-4.72,yaw:.21,seed:7406}
];
export const ALLEY_OCCUPANTS74=[
 {role:'homeless',x:1.37,y:-.012745,z:3.96,yaw:0,seed:7401},
 {role:'wallman',x:-2.1497,y:.006,z:-14.34,yaw:-Math.PI/2,seed:7402}
];
export function initializeRetroTextures74(decode=null){
 if(pending)return pending;const loader=new T.TextureLoader();
 const load=async key=>{const url=new URL(`./textures/npc-v74/${key}.png`,import.meta.url);let t;if(decode){const im=await decode(url,128,128);t=new T.DataTexture(im.data,128,128);t.flipY=true;t.needsUpdate=true;}else t=await loader.loadAsync(url.href);t.colorSpace=T.SRGBColorSpace;t.minFilter=t.magFilter=T.NearestFilter;t.generateMipmaps=false;t.anisotropy=1;assets.set(key,t);return t;};
 pending=Promise.all([...RETRO_ROLES74.flatMap(r=>[`${r}/face`,`${r}/body`,...(r==='homeless'?[]:[`${r}/face-blink`])]),'old-pier-label-128','ochre-water-streaks-128','reader-newspaper-128','rubber-mat-128'].map(load));return pending;
}
function textures(role){return{face:assets.get(`${role}/face`),faceBlink:assets.get(`${role}/face-blink`),body:assets.get(`${role}/body`),newspaper:assets.get('reader-newspaper-128')};}
function actorAt(p){const actor=createRetroActor74(T,p.role,textures(p.role),p);actor.group.position.set(p.x,p.y,p.z);actor.group.rotation.y=p.yaw;return actor;}
export function createIndoorOccupants74(scene){
 const group=new T.Group();group.name='Six residents V74 / four indoor actors';scene.add(group);
 const actors=INDOOR_OCCUPANTS74.map(p=>{const a=actorAt(p);group.add(a.group);a.group.traverse(o=>o.layers.enable(5));return a;});
 let last=-1;
 return{group,actors,textures:[...assets.values()],update(t,player){if(t===last)return;last=t;for(let i=0;i<actors.length;i++){const a=actors[i],p=INDOOR_OCCUPANTS74[i];a.group.visible=!player||Math.hypot(player.x-p.x,player.z-p.z)<23;if(a.group.visible)a.update(t,0);}},dispose(){actors.forEach(a=>a.dispose());group.removeFromParent();}};
}
// Character collision follows the same world anchors as their geometry.
export function blockedByOccupant74(x,z){return Math.hypot(x-.5,z+4.72)<.74||Math.hypot(x-3.87,z-9.64)<.41||x>-4.3&&x<-3.12&&z>11.14&&z<12.24;}

function patch(parent,points,material,name){const shape=new T.Shape(points.map(p=>new T.Vector2(p[0],-p[1]))),g=new T.ShapeGeometry(shape);g.rotateX(-Math.PI/2);const mesh=new T.Mesh(g,material);mesh.name=name;parent.add(mesh);return mesh;}
function bottles(root){
 const parent=new T.Group();parent.position.set(1.94,.006,4.56);parent.name='Four octahedral bottles and a spilled drink';root.add(parent);
 const glass=new T.MeshLambertMaterial({color:0x30442e,flatShading:true}),amber=new T.MeshLambertMaterial({color:0x58462b,flatShading:true}),label=new T.MeshBasicMaterial({map:assets.get('old-pier-label-128')});
 const oct=new T.OctahedronGeometry(1,0),labelGeo=oct.clone();labelGeo.clearGroups();
 const lp=labelGeo.attributes.position,lu=labelGeo.attributes.uv;for(let i=0;i<lp.count;i+=3){const front=(lp.getZ(i)+lp.getZ(i+1)+lp.getZ(i+2))>0;labelGeo.addGroup(i,3,front?1:0);if(front)for(let k=i;k<i+3;k++)lu.setXY(k,.5+lp.getX(k)*.5,.5+lp.getY(k)*.5);}
 // All bottle geometry, including its label-bearing body, consists of octahedra.
 for(let i=0;i<4;i++){
  const g=new T.Group();g.position.set((i%2)*.14,0,Math.floor(i/2)*.16);g.rotation.y=.31+i*.37;parent.add(g);
  const body=new T.Mesh(labelGeo,[i%2?amber:glass,label]);body.position.y=.12;body.scale.set(.045,.12,.045);g.add(body);
  const shoulder=new T.Mesh(oct,i%2?amber:glass);shoulder.position.y=.197;shoulder.scale.set(.038,.056,.038);g.add(shoulder);
  const neck=new T.Mesh(oct,i%2?amber:glass);neck.position.y=.254;neck.scale.set(.017,.057,.017);g.add(neck);
  const cap=new T.Mesh(oct,amber);cap.position.y=.306;cap.scale.set(.019,.009,.019);g.add(cap);
  if(i===3){g.rotation.set(0,0,Math.PI/2);g.position.set(.26,.045,.12);}
 }
 // Bottle fragments are static: batch by their three materials, not by piece.
 parent.updateMatrixWorld(true);const inverse=parent.matrixWorld.clone().invert(),batches=new Map();parent.traverse(o=>{if(!o.isMesh)return;const geo=o.geometry,groups=Array.isArray(o.material)?geo.groups:[{start:0,count:geo.attributes.position.count,materialIndex:0}];for(const part of groups){const mat=Array.isArray(o.material)?o.material[part.materialIndex]:o.material,g=new T.BufferGeometry();for(const [name,a]of Object.entries(geo.attributes))g.setAttribute(name,new T.BufferAttribute(a.array.slice(part.start*a.itemSize,(part.start+part.count)*a.itemSize),a.itemSize));g.applyMatrix4(inverse.clone().multiply(o.matrixWorld));if(!batches.has(mat))batches.set(mat,[]);batches.get(mat).push(g);}});parent.clear();for(const [mat,parts]of batches){const g=mergeGeometries(parts);parts.forEach(p=>p.dispose());const mesh=new T.Mesh(g,mat);mesh.name='Batched octahedral bottle surfaces';parent.add(mesh);}
 const spill=patch(parent,[[-.055,.113],[-.14,.05],[-.24,.14],[-.39,.12],[-.48,.22],[-.45,.36],[-.26,.33],[-.14,.21]],new T.MeshLambertMaterial({color:0x303529,transparent:true,opacity:.76,flatShading:true,depthWrite:false}),'Dark drink spill from fallen octahedral bottle');spill.position.y=.001;
 return{group:parent,triangles:128+6,dispose(){parent.traverse(o=>o.geometry?.dispose());parent.removeFromParent();oct.dispose();labelGeo.dispose();glass.dispose();amber.dispose();label.dispose();spill.material.dispose();}};
}
function stream(actor,root){
 const g=new T.PlaneGeometry(.014,1,1,8),p=g.attributes.position,uv=g.attributes.uv;
 for(let i=0;i<p.count;i++){const f=1-uv.getY(i),x=p.getX(i);p.setXYZ(i,x,.78*(1-f),.12+.36*f-.10*f*f);}
 g.computeVertexNormals();const map=assets.get('ochre-water-streaks-128').clone();map.wrapT=T.RepeatWrapping;map.repeat.y=2;map.needsUpdate=true;
 const m=new T.MeshBasicMaterial({map,transparent:true,opacity:.95,side:T.DoubleSide,depthWrite:false});const mesh=new T.Mesh(g,m);mesh.name='Eight-segment scrolling pixel stream / no particles';actor.group.add(mesh);
 const wet=patch(root,[[-2.24,-14.47],[-2.50,-14.53],[-2.565,-14.46],[-2.562,-14.19],[-2.37,-14.17],[-2.20,-14.30]],new T.MeshLambertMaterial({color:0x222e22,transparent:true,opacity:.74,flatShading:true,depthWrite:false}),'Ground-contact corner wet patch');wet.position.y=.007;
 return{update(t){map.offset.y=-(t*.54)%1;},dispose(){g.dispose();m.dispose();map.dispose();wet.geometry.dispose();wet.material.dispose();},triangles:20};
}
export function createAlleyOccupants74(root){
 const mat=new T.Mesh(new T.BoxGeometry(.69,.009,.87),new T.MeshLambertMaterial({map:assets.get('rubber-mat-128'),color:0x4c514a,flatShading:true}));mat.name='Worn antislip mat beside sleeping resident';mat.position.set(-.035,.0045,4.35);root.add(mat);
 const actors=ALLEY_OCCUPANTS74.map(p=>{const a=actorAt(p);root.add(a.group);return a;});const props=bottles(root),flow=stream(actors[1],root);let elapsed=0,lastTick=-1;
 return{actors,props,flow,stats:{triangles:actors.reduce((n,a)=>n+a.diagnostics.triangles,props.triangles+flow.triangles+12),draws:13},update(dt,player,active){if(!active)return;const near=!player||Math.hypot(player.x,player.z+6)<35;if(!near)return;elapsed+=Math.max(0,Math.min(.05,dt||0));const tick=Math.floor(elapsed*15);if(tick===lastTick)return;lastTick=tick;for(const a of actors)a.update(elapsed,dt);flow.update(tick/15);},dispose(){actors.forEach(a=>a.dispose());props.dispose();flow.dispose();mat.geometry.dispose();mat.material.dispose();mat.removeFromParent();}};
}
