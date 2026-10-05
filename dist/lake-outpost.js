import {createCampLife98} from './camp-life98.js';
import * as T from './vendor/three.module.min.js';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
import {createCampStructures} from './lake-outpost-structures.js';
import {createCampUtilities} from './lake-outpost-utilities.js';
import {createCampInteriors} from './lake-outpost-interiors.js';
import {createCampEffects} from './lake-outpost-effects.js';
import {outpostMaterials} from './lake-outpost-materials.js';
import {createOutpostPuddles} from './lake-outpost-water.js';
import {OUTPOST,CAMP_PLACEMENT as P,outpostDistance} from './lake-outpost-layout.js';
import {resolveSolid,field,surfaceHeight} from './world.js?v=60';

function batch(root,excluded){
 root.updateMatrixWorld(true);const inverse=root.matrixWorld.clone().invert(),buckets=new Map(),remove=[];
 root.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||Array.isArray(o.material)||o.material.isShaderMaterial)return;for(let p=o;p;p=p.parent){if(excluded.has(p))return;if(p===root)break;}const m=o.material;if(m.onBeforeCompile!==T.Material.prototype.onBeforeCompile)return;
 const key=[m.type,m.map?.uuid,m.bumpMap?.uuid,m.bumpScale,m.roughness,m.metalness,m.transparent,m.opacity,m.side,m.emissive?.getHex(),m.emissiveIntensity].join('|');
 if(!buckets.has(key)){const material=m.clone();material.color?.setHex(0xffffff);material.vertexColors=true;buckets.set(key,{material,parts:[]});}
 const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(new T.Matrix4().multiplyMatrices(inverse,o.matrixWorld));const n=g.attributes.position.count;
 for(const k of Object.keys(g.attributes))if(!['position','normal','uv'].includes(k))g.deleteAttribute(k);
 if(!g.attributes.uv)g.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(n*2),2));if(!g.attributes.normal)g.computeVertexNormals();const color=new Float32Array(n*3);for(let i=0;i<n;i++)color.set([m.color?.r??1,m.color?.g??1,m.color?.b??1],i*3);g.setAttribute('color',new T.Float32BufferAttribute(color,3));buckets.get(key).parts.push(g);remove.push(o);
 });
 for(const {material,parts}of buckets.values()){const g=mergeGeometries(parts,false);parts.forEach(p=>p.dispose());g.computeBoundingSphere();const m=new T.Mesh(g,material);m.name='Batched outpost surfaces';m.castShadow=!material.transparent;m.receiveShadow=true;root.add(m);}remove.forEach(o=>o.removeFromParent());
}
export function createLakeOutpost(renderer){
 const object=new T.Group();object.name='M.E.G. northwest lakeshore field station';const m=outpostMaterials(),a=createCampStructures(T,m),u=createCampUtilities(T,m),i=createCampInteriors(T,m),fx=createCampEffects(T,renderer),wet=createOutpostPuddles(P.water);
 const colliders=[],lamps=[],gateHit=[],tapHit=[],roots=[],excluded=new Set([...a.dynamicRoots,...u.dynamicRoots,...i.dynamicRoots]);
 const up=new T.Vector3(0,1,0);
 function box(root,w,h,d,mat,x,y,z,rz=0){const geo=new T.BoxGeometry(w,h,d),uv=geo.attributes.uv,n=geo.attributes.normal;for(let k=0;k<uv.count;k++){const nx=Math.abs(n.getX(k)),ny=Math.abs(n.getY(k));uv.setXY(k,uv.getX(k)*(nx>.5?d:w)/1.6,uv.getY(k)*(ny>.5?d:h)/1.6);}const b=new T.Mesh(geo,mat);b.position.set(x,y,z);b.rotation.z=rz;b.castShadow=b.receiveShadow=true;root.add(b);return b;}
 function rod(root,from,to,r,mat,r2=r){const start=new T.Vector3(...from),end=new T.Vector3(...to),delta=end.clone().sub(start);const mesh=new T.Mesh(new T.CylinderGeometry(r2,r,delta.length(),7),mat);mesh.position.copy(start).add(end).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(up,delta.normalize());mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);return mesh;}
 function cable(root,points,r=.018,mat=m.rubber){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));const mesh=new T.Mesh(new T.TubeGeometry(curve,Math.max(12,points.length*8),r,5,false),mat);root.add(mesh);return mesh;}
 function at(p,x=0,y=0,z=0){const c=Math.cos(p[2]||0),sn=Math.sin(p[2]||0);return[p[0]+c*x+sn*z,y,p[1]-sn*x+c*z];}
 function place(root,p){root.position.set(p[0],0,p[1]);root.rotation.y=p[2]||0;object.add(root);roots.push(root);return root;}
 const office=place(a.largeTents[0],P.office),kitchen=place(a.largeTents[1],P.kitchen),container=place(a.container,P.container);office.add(i.office);kitchen.add(i.kitchen);
 a.smallTents.forEach((g,n)=>{place(g,P.dorms[n]);g.add(i.dorms[n]);});
 place(a.restShelter,P.rest).add(i.restProps);place(u.tower,P.tower);place(u.generator,P.generator);place(u.water,P.water);place(u.laundry,P.laundry);place(u.pump,P.pump);const pumpWX=OUTPOST.x+P.pump[0],pumpWZ=OUTPOST.z+P.pump[1],pcx=Math.floor(pumpWX/64),pcz=Math.floor(pumpWZ/64);u.pump.position.y=surfaceHeight(pumpWX-pcx*64,pumpWZ-pcz*64,field(BigInt(pcx),BigInt(pcz),OUTPOST.seed,false))-OUTPOST.y;
 const decor=new T.Group();object.add(decor);roots.push(decor);
 for(const root of [office,kitchen]){for(let n=0;n<20;n++)for(let row=0;row<4;row++)box(root,.34,.035,2.20,m.wood,-3.45+n*.363,.034,-3.34+row*2.225);}
 if(i.containerBeds){i.containerBeds.position.y=.25;container.add(i.containerBeds);}
 function supplyCrate(x,z,w=.9,h=.65){for(let k=0;k<4;k++)box(decor,w,.13,.025,m.wood,x,.12+k*.15,z+.36);for(let k=0;k<4;k++)box(decor,w,.13,.025,m.wood,x,.12+k*.15,z-.36);for(const sign of [-1,1]){box(decor,.035,h,.72,m.wood,x+sign*w/2,h/2,z);box(decor,.07,h+.04,.07,m.wood,x+sign*(w/2-.05),h/2,z+.37);}for(let k=0;k<5;k++)box(decor,w/5*.96,.035,.74,m.wood,x+(k/5-.4)*w,h,z);}
 supplyCrate(-19,-11);supplyCrate(-19.6,-10);supplyCrate(-18.7,-9.7);supplyCrate(18,-4.5);supplyCrate(18.8,-3.8);supplyCrate(-19,16.5);supplyCrate(-18,17);
 function solidBox(x,z,hx,hz,angle=0){colliders.push({kind:'obb',x,z,hx,hz,angle});}
 function localSolid(p,x,z,hx,hz,angle=0){const q=at(p,x,0,z);solidBox(q[0],q[2],hx,hz,(p[2]||0)+angle);}
 function buildingWalls(p,w,d,door,rearDoor=false){localSolid(p,-w/2,0,.08,d/2);localSolid(p,w/2,0,.08,d/2);const span=(w-door)/2;for(const end of [-1,1]){if(end===-1&&!rearDoor)localSolid(p,0,-d/2,w/2,.08);else for(const side of [-1,1])localSolid(p,side*(door+span)/2,end*d/2,span/2,.08);}}
 buildingWalls(P.office,8,10,2,a.largeTents[0].userData.rearDoor);buildingWalls(P.kitchen,8,10,2,a.largeTents[1].userData.rearDoor);P.dorms.forEach((p,n)=>buildingWalls(p,3.8,4.8,1.3,a.smallTents[n].userData.rearDoor));
 // Door remains in the container's rightmost front bay.
 localSolid(P.container,-3.5,0,.08,1.6);localSolid(P.container,3.5,0,.08,1.6);localSolid(P.container,0,-1.6,3.5,.08);localSolid(P.container,-1.3,1.6,2.2,.08);localSolid(P.container,3.22,1.6,.28,.08);
 for(const c of i.containerBeds?.userData.collisionBoxes||[])localSolid(P.container,c.x,c.z,c.hx,c.hz,c.angle||0);
 localSolid(P.water,2.5,0,1.55,1.55);localSolid(P.water,-3.05,.4,2.9,.65);localSolid(P.generator,0,0,1.55,.95);
 localSolid(P.office,.58,-.26,.43,.43);localSolid(P.office,-1.7,-2.35,1.13,.51);localSolid(P.office,-1.7,-3.29,.25,.26);localSolid(P.office,-2.25,.78,.5,.8);
 localSolid(P.kitchen,-1.43,1.51,.44,1.58);localSolid(P.kitchen,1.48,1.51,.44,1.58);
 for(const p of P.dorms)for(const dx of [-.99,.99])localSolid(p,dx,-.4,.44,1.05);
 // Wheat stacks are only textured crossing cards, with no modeled straw core.
 for(const [x,z,w,h,yaw]of[[-18.4,1.0,1.9,1.9,.2],[-16.8,1.8,1.7,1.65,-.35],[-19.1,2.8,1.8,1.8,.8],[.1,-19.1,1.9,1.85,.1]]){
  const g=new T.Group();g.position.set(x,0,z);decor.add(g);g.name='photographic wheat-stack cards';for(const angle of [0,Math.PI/2]){const card=new T.Mesh(new T.PlaneGeometry(w,h),m.hay);card.position.y=h/2;card.rotation.y=angle+yaw;card.castShadow=card.receiveShadow=true;g.add(card);}solidBox(x,z,w*.27,w*.27);
 }
 // Loosely salvaged palisade: gaps, unequal crowns, bowing strips and repairs.
 let rng=93;const random=()=>{rng=(Math.imul(rng,1664525)+1013904223)>>>0;return rng/4294967296;};
 function fence(from,to,gateCenter=null){const dx=to[0]-from[0],dz=to[1]-from[1],length=Math.hypot(dx,dz),angle=Math.atan2(dx,dz),count=Math.ceil(length/2.05),span=length/count;
 for(let n=0;n<count;n++){const t=(n+.5)/count,x=from[0]+dx*t,z=from[1]+dz*t;if(gateCenter&&Math.hypot(x-gateCenter[0],z-gateCenter[1])<3.5)continue;const g=new T.Group();g.position.set(x,0,z);g.rotation.y=angle+Math.PI/2;decor.add(g);const h=1.76+random()*.56;
 rod(g,[-span/2,0,0],[-span/2+.03,h+.12,0],.07,m.wood,.055);box(g,span+.06,.09,.085,m.wood,0,.47,0);box(g,span+.06,.085,.085,m.wood,0,1.47,0);
 if(random()<.39){const geo=new T.PlaneGeometry(span+.12,h,18,2),p=geo.attributes.position;for(let k=0;k<p.count;k++)p.setZ(k,Math.sin(p.getX(k)*39)*.035);geo.computeVertexNormals();const mesh=new T.Mesh(geo,m.rust);mesh.position.set(0,h/2,.05);mesh.rotation.z=(random()-.5)*.07;g.add(mesh);}
 else for(let k=0;k<6;k++){const bh=h+random()*.21;box(g,span/6*.94,bh,.045,m.wood,(k/6-.417)*span,bh/2,.07,(random()-.5)*.06);}
 if(random()<.45)rod(g,[-span/2,.28,.14],[span/2,h-.15,.14],.035,m.wood);
 solidBox(x,z,.11,span/2,angle);
 }}
 const hx=OUTPOST.hx,hz=OUTPOST.hz,gx=P.gates[0][0],gz=P.gates[1][1];fence([-hx,-hz],[hx,-hz]);fence([-hx,-hz],[-hx,hz]);fence([-hx,hz],[gx-2.5,hz]);fence([gx+2.5,hz],[hx,hz]);fence([hx,-hz],[hx,gz-2.5]);fence([hx,gz+2.5],[hx,hz]);
 a.gates.forEach((g,n)=>{place(g,P.gates[n]);gateHit.push({root:g,x:P.gates[n][0],z:P.gates[n][1],n});});
 // A few leaning spare planks and useful stock, never evenly scattered.
 for(let k=0;k<7;k++){const b=box(decor,.19,2.3+random()*.5,.055,m.wood,20+k*.20,1.3,-10.6);b.rotation.z=-.18-random()*.08;b.rotation.x=.12;}
 for(let k=0;k<5;k++){box(decor,.9,.20,.8,m.wood,-19+k*.37,.1+k*.18,18.8);}
 // Every practical has a physical socket and a connected electrical branch.
 const lightMat=new T.MeshStandardMaterial({color:0xffe0a2,emissive:0xffb64c,emissiveIntensity:3.1,roughness:.34});
 const hub=[-1,5.3,0],poleA=[9,5.25,-18],gatePole=[P.gates[0][0],4.7,18];
 for(const p of [hub,poleA,gatePole]){rod(decor,[p[0],-.1,p[2]],p,.105,m.wood,.075);rod(decor,[p[0]-.5,p[1],p[2]],[p[0]+.5,p[1],p[2]],.045,m.wood);}
 function sag(a,b,amount=.6){return cable(decor,[a,[(a[0]+b[0])*.5,Math.min(a[1],b[1])-amount,(a[2]+b[2])*.5],b]);}
 const generatorOut=at(P.generator,u.anchors.powerOut.x,u.anchors.powerOut.y,u.anchors.powerOut.z);cable(decor,[generatorOut,[P.generator[0]+1.6,.19,P.generator[1]+1.2],[poleA[0],.12,poleA[2]],[poleA[0],4.9,poleA[2]],poleA],.025);sag(poleA,hub,.65);
 function bulb(position,intensity=5,reach=7,feed=hub){const [x,y,z]=position;const socket=[x,y+.17,z];if(feed!==hub)sag(hub,feed,.25);sag(feed,[x,y+.54,z],Math.min(.45,Math.abs(feed[1]-y)*.12));cable(decor,[[x,y+.54,z],socket],.012);box(decor,.10,.16,.10,m.rubber,x,y+.20,z);const b=new T.Mesh(new T.SphereGeometry(.067,10,7),lightMat);b.scale.y=1.4;b.position.set(x,y+.05,z);decor.add(b);const filament=new T.Mesh(new T.TorusGeometry(.019,.003,4,8),lightMat);filament.position.set(x,y+.055,z);decor.add(filament);const light=new T.Object3D();light.intensity=intensity;light.distance=reach;light.position.set(x,y,z);lamps.push(light);return light;}
 bulb(at(P.office,0,2.85,1),6,7);bulb(at(P.office,0,2.2,5.15),2.5,5,at(P.office,0,3.7,0));bulb(at(P.kitchen,0,2.9,.7),6,8);bulb(at(P.kitchen,0,2.15,5.2),2.5,4,at(P.kitchen,0,3.7,0));bulb(at(P.container,.5,2.55,.3),3,5);bulb(at(P.container,0,2.5,2.1),2,4,at(P.container,0,3.1,0));
 for(const p of P.dorms)bulb(at(p,0,2.1,0),1.1,3.8);
 bulb(at(P.rest,0,2.8,0),1.8,5);bulb(at(P.water,-3.1,2.43,-.08),3,6);bulb(at(P.tower,.55,7.22,0),2,6);bulb(at(P.gates[0],0,3.85,0),3,7,gatePole);sag(hub,gatePole,.55);
 // Feeder follows the kitchen rotation and meets its real appliance socket.
 const cooker=i.kitchen.userData.electricalAppliances?.[0];if(cooker){kitchen.updateMatrixWorld(true);const socket=new T.Vector3(...cooker.userData.powerSocketLocal);cooker.localToWorld(socket);cable(decor,[hub,at(P.kitchen,0,4.2,-4.8),at(P.kitchen,3.4,2.2,-4.8),at(P.kitchen,3.4,.13,-4.8),socket.toArray()],.023);}
 // Lakeside intake and tank hose physically meet modeled pump flanges.
 const pumpBase=P.pump,port=p=>[pumpBase[0]+p.x,p.y+u.pump.position.y,pumpBase[1]+p.z];
 cable(decor,[[43,-.74,31],[39,-.65,31],[33,-.28,31],port(u.hosePorts.intake)],.09);
 const tankPort=[P.water[0]+u.anchors.tankInlet.x,u.anchors.tankInlet.y,P.water[1]+u.anchors.tankInlet.z];cable(decor,[port(u.hosePorts.outlet),[24,.16,26],[23,.12,19],[23,.18,14],[23,2.85,13.7],[21,3.08,13.2],tankPort],.085);
 // Dark hose enters real shallow lake water at world (-247,-250).
 const intakeCage=new T.Mesh(new T.CylinderGeometry(.16,.16,.40,8),m.metal);intakeCage.rotation.z=Math.PI/2;intakeCage.position.set(43,-.73,31);decor.add(intakeCage);
 u.generator.add(fx.smoke);fx.smoke.position.copy(u.anchors.exhaust);fx.setWind(.55,.18);fx.setSmokeOpacity(.072);
 if(i.steamPoints[0])i.steamPoints[0].add(fx.steam);fx.steam.scale.setScalar(.65);
 // Replace the simple authoring flame meshes with the shared layered shader.
 for(const root of i.dynamicRoots){if(root.name==='moving flame cluster'){root.visible=false;const flame=fx.createFire({scale:root.parent.parent===i.restProps?.42:.34,intensity:1.1,lightDistance:3,embers:false});flame.position.copy(root.position);root.parent.add(flame);excluded.add(flame);}}
 const barrelFire=fx.createFire({scale:.62,intensity:2.4,lightDistance:5});barrelFire.position.set(0,.80,0);i.restProps.add(barrelFire);excluded.add(barrelFire);
 object.add(wet.group);excluded.add(wet.group);excluded.add(fx.smoke);excluded.add(fx.steam);
 const groundAt=(x,z)=>{const wx=OUTPOST.x+x,wz=OUTPOST.z+z,cx=Math.floor(wx/64),cz=Math.floor(wz/64);return surfaceHeight(wx-cx*64,wz-cz*64,field(BigInt(cx),BigInt(cz),OUTPOST.seed,false))-OUTPOST.y;};
 const life=createCampLife98({object,interiors:i,renderer,lamps,colliders,excluded,roots,groundAt});
 object.updateMatrixWorld(true);
 for(const root of roots)batch(root,excluded);
 for(const g of a.dynamicRoots)batch(g,new Set());
 // Interaction anchors remain independent of batched display meshes.
 u.taps.forEach((tap,n)=>{const marker=new T.Object3D();tap.handle.add(marker);tapHit.push({marker,n});});
 const practicalPool=Array.from({length:6},()=>{const l=new T.PointLight(0xffce82,0,7,2);object.add(l);return l;});
 const probe=new T.Vector3(),local={x:0,z:0};let active=false,lastOrigin='';
 function update(time,dt,state){const wx=Number(state.cx)*64+state.x,wz=Number(state.cz)*64+state.z;active=state.level===10&&Math.hypot(wx-OUTPOST.x,wz-OUTPOST.z)<235;object.visible=active;wet.active=active&&Math.hypot(wx-(OUTPOST.x+P.water[0]-3),wz-(OUTPOST.z+P.water[1]+1))<85;if(!active)return;const origin=state.cx+','+state.cz;if(origin!==lastOrigin){object.position.set(OUTPOST.x-Number(state.cx)*64,OUTPOST.y,OUTPOST.z-Number(state.cz)*64);object.updateMatrixWorld(true);lastOrigin=origin;}life.update(time,dt);const closest=lamps.map(l=>({l,d:(l.position.x-wx+OUTPOST.x)**2+(l.position.z-wz+OUTPOST.z)**2})).sort((a,b)=>a.d-b.d);practicalPool.forEach((l,n)=>{const p=closest[n]?.l;if(p){l.position.copy(p.position);l.intensity=p.intensity;l.distance=p.distance;}});a.update(time,dt);u.update(time,dt);i.update(time,dt);fx.update(time,dt);wet.update(time);object.updateMatrixWorld(true);}
 function query(camera){if(!active)return null;for(const t of tapHit){t.marker.getWorldPosition(probe);if(probe.distanceTo(camera.position)<2.1)return{kind:'outpost-tap',n:t.n,label:'E '+(u.taps[t.n].on?'关闭':'开启')+'黄铜水龙头'};}const px=camera.position.x-object.position.x,pz=camera.position.z-object.position.z;for(const g of gateHit)if(Math.hypot(px-g.x,pz-g.z)<3.4)return{kind:'outpost-gate',n:g.n,label:'E 开合拼木大门'};return null;}
 function use(hit){if(hit.kind==='outpost-tap')return u.toggleTap(hit.n)?'水龙头已开启。':'水龙头已关闭。';a.toggleGate(hit.n);return '推开 / 合上拼木大门。';}
 function resolve(position,state){if(state.level!==10)return;const ox=OUTPOST.x-Number(state.cx)*64,oz=OUTPOST.z-Number(state.cz)*64;local.x=position.x-ox;local.z=position.z-oz;if(Math.abs(local.x)>OUTPOST.hx+6||Math.abs(local.z)>OUTPOST.hz+16)return;resolveSolid(local,.26,colliders);for(let n=0;n<2;n++){if(!a.gates[n].userData.isOpen){const p=P.gates[n];resolveSolid(local,.26,[{kind:'obb',x:p[0],z:p[1],hx:2.4,hz:.09,angle:p[2]}]);}}position.x=local.x+ox;position.z=local.z+oz;}
 function floor(wx,wz,base){const shore=life.floor(wx-OUTPOST.x,wz-OUTPOST.z,base-OUTPOST.y)+OUTPOST.y;if(shore>base+.001)return shore;const x=wx-OUTPOST.x-P.container[0],z=wz-OUTPOST.z-P.container[1];if(x> -3.42&&x<3.42&&z> -1.52&&z<1.9)return OUTPOST.y+.25;return base;}
 object.position.set(OUTPOST.x,OUTPOST.y,OUTPOST.z);object.updateMatrixWorld(true);
 return {object,wet,life,update,query,use,resolve,floor,materials:m,structures:a,utilities:u,interiors:i,effects:fx,colliders,lamps,contains:(x,z)=>outpostDistance(x,z)<0};
}
