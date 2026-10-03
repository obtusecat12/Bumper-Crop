import * as T from './vendor/three.module.min.js';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
import {createTikiActor79,TIKI_ROLES79} from './tiki-cast-v79.js';
import {posePlan79} from './tiki-pose-v79.js';
import {nextPaint} from './bath-loading-v72.js';
export const TIKI_PEOPLE79=Object.freeze([
 {role:'bartender',x:5.03,z:-.58,yaw:-Math.PI/2},
 {role:'sleeper',x:2.89,z:-2.1,yaw:Math.PI/2,seatHeight:.82},
 {role:'barwoman',x:2.78,z:-.5,yaw:Math.PI/2,seatHeight:.82},
 {role:'waiter',x:-3.10,z:-1.30,yaw:-Math.PI/2},
 {role:'orderer',x:-4.10,z:-.32,yaw:Math.PI,seatHeight:.545},
 {role:'elder',x:-4.58,z:.62,yaw:0,seatHeight:.545},
 {role:'asianwoman',x:-4.58,z:2.58,yaw:Math.PI,seatHeight:.545}
]);
const cache=new Map();let manifest=null,pending=null;
export async function initializeTikiPeople79(report=()=>{}){
 if(pending)return pending;
 pending=(async()=>{manifest=await(await fetch(new URL('./textures/npc-v79/manifest.json',import.meta.url))).json();const loader=new T.TextureLoader();
 const files=TIKI_ROLES79.flatMap(r=>['face','face-blink','body','hair',...(r==='elder'?['beard']:[]),...(r==='barwoman'?['dress-fabric']:[])].map(k=>`${r}/${k}`)).concat(['props/menu','props/order-pad','props/steak','props/rum-label','props/chrome']);
 let completed=0,index=0;await Promise.all(Array.from({length:3},async()=>{while(index<files.length){const key=files[index++],tex=await loader.loadAsync(new URL(`./textures/npc-v79/${key}.png`,import.meta.url).href);tex.colorSpace=T.SRGBColorSpace;tex.minFilter=tex.magFilter=T.NearestFilter;tex.generateMipmaps=false;tex.anisotropy=1;cache.set(key,tex);report(++completed/files.length);}}));})();return pending;
}
const material=(color,map=null,extra={})=>new T.MeshLambertMaterial({color,map,flatShading:true,emissive:map?0xffffff:0x000000,emissiveMap:map,emissiveIntensity:.17,...extra});
function mesh(parent,g,m,p=[0,0,0],e=[0,0,0],name=''){const o=new T.Mesh(g,m);o.position.fromArray(p);o.rotation.set(...e);o.name=name;parent.add(o);return o;}
function rod(parent,a,b,r,m,n=6){const d=new T.Vector3(...b).sub(new T.Vector3(...a)),o=mesh(parent,new T.CylinderGeometry(r,r,d.length(),n,1),m,new T.Vector3(...a).addScaledVector(d,.5).toArray());o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return o;}
function lathe(parent,rows,m,n=8,name=''){return mesh(parent,new T.LatheGeometry(rows.map(p=>new T.Vector2(...p)),n),m,[0,0,0],[0,0,0],name);}
function combine(root,name){const bins=new Map();root.updateMatrixWorld(true);root.traverse(o=>{if(o.isMesh){const g=o.geometry.clone().applyMatrix4(o.matrixWorld);if(!bins.has(o.material))bins.set(o.material,[]);bins.get(o.material).push(g);o.geometry.dispose();}});root.clear();for(const [m,gs]of bins){const g=mergeGeometries(gs,false);gs.forEach(g=>g.dispose());mesh(root,g,m,[0,0,0],[0,0,0],name);}return root;}
function bottle(m){const g=new T.Group();lathe(g,[[0,-.14],[.047,-.14],[.050,-.11],[.050,.055],[.041,.083],[.018,.12],[.018,.216],[.021,.223],[.020,.235],[.013,.235]],m.glass,8,'Faceted rum bottle with open neck');mesh(g,new T.CylinderGeometry(.0506,.0506,.098,8,1,true),m.label,[0,-.015,0]);lathe(g,[[.014,.209],[.023,.209],[.023,.231],[.014,.231]],m.metal,8);return combine(g,'Held rum bottle');}
function shaker(m){const g=new T.Group();lathe(g,[[0,-.15],[.049,-.15],[.058,.037],[.058,.071],[.039,.107],[.030,.12],[.030,.149],[0,.149]],m.metal,10,'Three piece metal cocktail shaker');return g;}
function cocktail(root,p,m){const g=new T.Group();root.add(g);g.position.fromArray(p);
 lathe(g,[[0,0],[.067,0],[.071,.009],[.022,.015],[.008,.028],[.008,.109],[.016,.115],[.096,.216],[.093,.221],[.086,.215],[.011,.119]],m.clear,10,'Green cocktail / thick open stem glass');
 lathe(g,[[0,.121],[.078,.202],[0,.202]],m.green,10,'Green cocktail liquid below rim');
 mesh(g,new T.TorusGeometry(.092,.003,3,10),m.clear,[0,.218,0],[Math.PI/2,0,0]);rod(g,[.04,.16,0],[.083,.282,0],.003,m.straw,5);
 return g;
}
function cutlery(kind,m){const g=new T.Group();rod(g,[0,.025,0],[0,-.09,0],.006,m,5);if(kind==='knife')mesh(g,new T.BoxGeometry(.018,.105,.003),m,[.005,-.131,0]);else{mesh(g,new T.BoxGeometry(.028,.030,.004),m,[0,-.10,0]);for(let i=0;i<4;i++)rod(g,[(i-1.5)*.008,-.106,0],[(i-1.5)*.008,-.152,0],.0018,m,3);}return combine(g,kind);}
function dress(actor,tex){
 // A second mesh: a fitted waist, gathered lap, draped knees and uneven free hem.
 // Seated drape is authored in the local posed space, not a conical standing skirt.
 const s=actor.group.scale.x,h=.82/s,rows=[[h+.14,0,.165,.128],[h+.035,.07,.190,.166],[h-.08,.22,.225,.237],[h-.21,.32,.224,.205],[h-.38,.34,.227,.195],[.293/s,.33,.248,.205]],n=12,ps=[],uv=[];
 const point=(r,j)=>{const [y,z,rx,rz]=rows[r],a=j/n*Math.PI*2;return[Math.sin(a)*rx,y+(r===5?.014*Math.sin(j*2.7):0),z+Math.cos(a)*rz];};
 for(let r=0;r<rows.length-1;r++)for(let j=0;j<n;j++){const ids=[[r,j],[r,j+1],[r+1,j+1],[r,j],[r+1,j+1],[r+1,j]];for(const [rr,jj]of ids){ps.push(...point(rr,jj));uv.push(jj/n,1-rr/(rows.length-1));}}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(ps,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.computeVertexNormals();const o=mesh(actor.group,geo,material(0xffffff,tex,{side:T.DoubleSide}),[0,0,0],[0,0,0],'Independent long floral dress, seated cloth drape');return o;
}
function foldedMenu(root,p,m){const g=new T.BufferGeometry(),a=.16,b=.205,positions=[-a,0,-b,0,.014,-b,-a,0,b,0,.014,-b,0,.014,b,-a,0,b,0,.014,-b,a,.004,-b,0,.014,b,a,.004,-b,a,.004,b,0,.014,b];g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute([0,1,.5,1,0,0,.5,1,.5,0,0,0,.5,1,1,1,.5,0,1,1,1,0,.5,0],2));g.computeVertexNormals();return mesh(root,g,m,p,[0,0,0],'Folded dinner menu / central paper crease');}
function plateAndSteak(root,p,m){const g=new T.Group();g.position.fromArray(p);root.add(g);lathe(g,[[0,0],[.13,0],[.168,.018],[.176,.030],[.169,.033],[.123,.009],[0,.009]],m.plate,16,'Dinner plate rim');
 const ring=Array.from({length:12},(_,i)=>{const a=i/12*Math.PI*2;return new T.Vector2(Math.cos(a)*(.095+.01*Math.sin(i*5)),Math.sin(a)*.065);}),geo=new T.ExtrudeGeometry(new T.Shape(ring),{depth:.016,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.005,bevelThickness:.004});geo.rotateX(-Math.PI/2);const uv=geo.attributes.uv,pos=geo.attributes.position;for(let i=0;i<uv.count;i++)uv.setXY(i,pos.getX(i)/.22+.5,pos.getZ(i)/.16+.5);mesh(g,geo,m.steak,[0,.024,0],[0,.2,0],'Seared steak with generated surface');for(let i=0;i<3;i++)mesh(g,new T.DodecahedronGeometry(.019,0),m.peas,[.07+i*.021,.026,-.086]);return g;
}
export async function createTikiPeople79(scene,report=()=>{}){
 const root=new T.Group();root.name='Seven individually authored Tiki patrons V79';scene.add(root);const actors=[];const propGroups=[],actions=[];
 const m={glass:material(0x766141,null,{transparent:true,opacity:.78}),clear:material(0xc4dddc,null,{transparent:true,opacity:.36,depthWrite:false}),metal:material(0xd4d7d7,cache.get('props/chrome')),label:material(0xffffff,cache.get('props/rum-label')),green:new T.MeshBasicMaterial({color:0x669e36}),straw:material(0xe0cdb7),menu:material(0xffffff,cache.get('props/menu'),{side:T.DoubleSide}),pad:material(0xffffff,cache.get('props/order-pad')),ink:material(0x383029),plate:material(0xc9c2ad),steak:material(0xffffff,cache.get('props/steak')),peas:material(0x537445)};
 for(let i=0;i<TIKI_PEOPLE79.length;i++){
  const p=TIKI_PEOPLE79[i],meta=manifest[p.role],textures=Object.fromEntries(['face','face-blink','body','hair','beard'].map(k=>[k==='face-blink'?'faceBlink':k,cache.get(`${p.role}/${k}`)]));
  const actor=createTikiActor79(T,p.role,textures,{...p,phase:0,skinUV:meta.skinUV,landmarks:meta.landmarks});actor.group.position.set(p.x,0,p.z);actor.group.rotation.y=p.yaw;root.add(actor.group);actors.push(actor);
  // Hand props inherit the exact posed wrist; service objects use the same pose plan.
  if(p.role==='bartender'){
   const b=bottle(m),s=shaker(m);actor.group.add(b,s);propGroups.push(b,s);
   const waterGeo=new T.CylinderGeometry(.0026,.0038,1,5,1),waterMat=material(0xe4c987,null,{transparent:true,opacity:.63,depthWrite:false}),flow=mesh(actor.group,waterGeo,waterMat);flow.name='Gravity pour from physical bottle mouth to customer glass';
   const target=posePlan79('bartender',5).props.glass,drink=cocktail(actor.group,target,m);drink.name='Woman’s green cocktail / shared bartender receiving target';actor.group.updateMatrixWorld(true);root.attach(drink);propGroups.push(drink);
   actions.push(t=>{const plan=posePlan79('bartender',t).props;b.position.fromArray(plan.bottle.p);b.rotation.set(...plan.bottle.r);b.visible=plan.bottle.visible;s.position.fromArray(plan.shaker.p);s.rotation.set(...plan.shaker.r);s.visible=plan.shaker.visible;flow.visible=plan.pour;if(flow.visible){const top=new T.Vector3(...plan.bottle.tip),bottom=new T.Vector3(top.x,target[1]+.202,top.z),d=top.clone().sub(bottom);flow.position.copy(top).add(bottom).multiplyScalar(.5);flow.scale.y=d.length();flow.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());}});
   actor.diagnostics.attachedPropTriangles=368;
  }
  if(p.role==='barwoman'){const cloth=dress(actor,cache.get('barwoman/dress-fabric'));propGroups.push(cloth);actor.diagnostics.attachedPropTriangles=120;}
  if(p.role==='waiter'){
   const pad=mesh(actor.group,new T.BoxGeometry(.19,.012,.24),m.pad,[.035,1.19,.31],[0,0,0],'Waiter order pad');const pen=rod(actor.group,[0,0,0],[0,.105,0],.0035,m.ink,5);actions.push(t=>{const p=posePlan79('waiter',t).props;const axis=new T.Vector3(-.25,.93,-.30).normalize();pen.position.fromArray(p.pen).addScaledVector(axis,.0525);pen.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),axis);});propGroups.push(pad,pen);actor.diagnostics.attachedPropTriangles=32;
  }
  if(p.role==='elder'){
   for(const [side,kind]of [['L','fork'],['R','knife']]){const tool=cutlery(kind,m.metal);tool.position.set(0,-.048,.025);actor.bones['hand'+side].add(tool);propGroups.push(tool);}actor.diagnostics.attachedPropTriangles=112;
  }
  report((i+1)/7,p.role);await nextPaint();
 }
 const sleepingGlass=new T.Group();root.add(sleepingGlass);const raw=new T.Group();lathe(raw,[[0,0],[.038,0],[.045,.127],[.041,.130],[.037,.017],[0,.012]],m.clear,8);combine(raw,'Dropped empty tumbler');sleepingGlass.add(raw);sleepingGlass.position.set(2.40,.046,-2.39);sleepingGlass.rotation.set(0,.48,Math.PI/2);propGroups.push(sleepingGlass);
 const spill=mesh(root,new T.CircleGeometry(.13,9),material(0x665333,null,{transparent:true,opacity:.44,depthWrite:false}),[2.35,.004,-2.42],[-Math.PI/2,0,.2],'Small spilled drink');spill.scale.y=.61;propGroups.push(spill);
 foldedMenu(root,[-4.10,.826,-.88],m.menu);plateAndSteak(root,[-4.58,.816,1.16],m);
 const second=plateAndSteak(root,[-4.58,.816,2.00],m);second.scale.set(.82,1,.82);second.name='Second diner’s plate';
 let last=-1;const update=t=>{const tick=Math.floor(t*30);if(tick===last)return;last=tick;for(const a of actors)a.update(t);for(const action of actions)action(tick/30);};update(0);
 for(const a of actors){a.diagnostics.totalTriangles=a.diagnostics.triangles+(a.diagnostics.attachedPropTriangles??0);if(a.diagnostics.totalTriangles>1500)throw new Error('NPC triangle budget exceeded: '+a.diagnostics.role);}
 const allTextures=[...cache.values()];return{root,actors,textures:allTextures,update,diagnostics:actors.map(a=>a.diagnostics),dispose(){const geometries=new Set();root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);});actors.forEach(a=>a.dispose());geometries.forEach(g=>g.dispose());const mats=new Set(Object.values(m));propGroups.forEach(g=>g.traverse?.(o=>{if(o.material)mats.add(o.material);}));mats.forEach(m=>m.dispose());root.removeFromParent();}};
}
