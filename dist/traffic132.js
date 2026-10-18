// V132-traffic: renders traffic132-core near the player in L11 and drives the signal lamps.
// Lamps: every addTrafficSignal head records its three lens centres (UrbanBatch.signals132, returned per block by
// exit-scene buildBlock); an instanced disc layer covers the baked lenses with lit/unlit colours from signal132().
// Collision: each car is an OBB solid fed to exit-scene resolve(). Off with ?traffic=0.
import * as T from './vendor/three.module.min.js';
import {cityToWorld,worldToCity,CITY_ANGLE} from './urban-layout.js?v=return-1';
import {roadHeight} from './urban-streets.js?v=69';
import {EXIT_CITY_Y as Y} from './exit-route.js?v=60';
import {car132Mesh,pickCar132} from './cars132.js?v=133c';
import {T132,step132,trySpawn132,cull132,signal132,hash132} from './traffic132-core.js?v=132t';
const OFF=typeof location!=='undefined'&&/[?&]traffic=0\b/.test(location.search);
const LIT={r:new T.Color(1,.025,.012),y:new T.Color(1,.42,.02),g:new T.Color(.03,1,.32)},DIM=[new T.Color(.045,.012,.01),new T.Color(.045,.032,.008),new T.Color(.008,.035,.02)];
export function createTraffic132({blocks}){
 const object=new T.Group();object.name='V132 traffic';const solids=[];let cars=[],last=0,seedN=1,lampAt=0;
 const rand=()=>hash132(seedN++,991,77);
 const MAXL=1200,disc=new T.CircleGeometry(.12,14);disc.translate(0,0,.008);
 const lamps=new T.InstancedMesh(disc,new T.MeshBasicMaterial({toneMapped:false}),MAXL);lamps.name='V132 signal lamps';lamps.count=0;lamps.frustumCulled=false;
 lamps.instanceColor=new T.InstancedBufferAttribute(new Float32Array(MAXL*3),3);object.add(lamps);
 const meshes=new Map(),o3=new T.Object3D(),w={};
 function pickModel(seed){const p=pickCar132(seed);return{id:p.id,paint:p.paint,L:p.car.L,W:p.car.W};}
 function lampsUpdate(t){let n=0;for(const v of blocks().values()){const S=v.signals132;if(!S)continue;for(const s of S){if(s.k===undefined){const c=worldToCity(s.wx,s.wz),f=s.ry-CITY_ANGLE;s.k=Math.round(c.x/T132.B);s.j=Math.round(c.z/T132.B);s.axis=Math.abs(Math.cos(f))>Math.abs(Math.sin(f))?'z':'x';}
   const st=signal132(s.k,s.j,s.axis,t);for(let i=0;i<3;i++){if(n>=MAXL)break;const p=s.p[i];o3.position.set(p[0],p[1],p[2]);o3.rotation.set(0,s.ry,0);o3.updateMatrix();lamps.setMatrixAt(n,o3.matrix);
    lamps.instanceColor.setXYZ(n,...((i===0&&st==='r')||(i===1&&st==='y')||(i===2&&st==='g')?LIT[st].toArray():DIM[i].toArray()));n++;}}}
  lamps.count=n;lamps.instanceMatrix.needsUpdate=true;lamps.instanceColor.needsUpdate=true;}
 function update(wx,wz,active){object.visible=active&&!OFF;if(!object.visible){solids.length=0;return;}
  const now=performance.now()*.001,dt=Math.min(.1,last?now-last:0);last=now;const pc=worldToCity(wx,wz),player={x:pc.x,z:pc.z};
  if(now>lampAt){lampAt=now+.2;lampsUpdate(now);}
  cars=cull132(cars,player);if(cars.length<T132.COUNT){const c=trySpawn132(cars,player,rand,pickModel);if(c)cars.push(c);}
  step132(cars,player,now,dt);
  const keep=new Set();solids.length=0;
  for(const c of cars){keep.add(c.id);let m=meshes.get(c.id);if(!m){m=car132Mesh(c.model,c.paint);meshes.set(c.id,m);object.add(m);}
   cityToWorld(c.x,c.z,w);const ry=CITY_ANGLE+Math.atan2(c.hx,c.hz);m.position.set(w.x,Y+roadHeight(c.x,c.z)+.005,w.z);m.rotation.set(0,ry,0);
   solids.push({kind:'obb',x:w.x,z:w.z,w:c.W*.9,d:c.L*.96,ry});}
  for(const[id,m]of meshes)if(!keep.has(id)){m.removeFromParent();meshes.delete(id);}
 }
 function dispose(){for(const m of meshes.values())m.removeFromParent();meshes.clear();disc.dispose();lamps.dispose();object.removeFromParent();}
 return{object,update,solids,dispose,get cars(){return cars;}};
}
