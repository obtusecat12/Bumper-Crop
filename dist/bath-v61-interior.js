import * as T from './vendor/three.module.min.js';
import {createStallKit} from './bath-v62-stall-kit.js?v=62';
import {showerMaterials} from './bath-v62-materials.js?v=62';
import {createHybridShower} from './bath-v62-water.js?v=62';
import {bathRefitMaterials,bathRefitTextures,addBox,addPlane,addTube,rock,worldUV} from './bath-v61-materials.js?v=61';
import {makeDispenser,makeTelephone,makePlasticChair,makeTowel,makeRockPlanter} from './bath-v61-props.js?v=61';
import {wetFloorMaterial,createBathReflection} from './bath-v61-wet.js?v=61';
import {SHOWER_HEADS} from './bathhouse-layout.js?v=65';
export function buildBathRefit(scene,root,oldWood){
 const m=bathRefitMaterials(),tex=bathRefitTextures(),clock={value:0},presets=[0,0,0,0],streams=[],nozzles=[];
 oldWood=m.wood;
 const box=(mat,x,y,z,w,h,d,n='',r=.018)=>addBox(root,mat,x,y,z,w,h,d,n,r),plane=(mat,x,y,z,w,h,ry=0,rx=0,n='')=>addPlane(root,mat,x,y,z,w,h,ry,rx,n);
 const pipe=(pts,r=.022,mat=m.metal,n='Attached plumbing')=>addTube(root,mat,pts,r,n);
 const put=(model,x,y,z,ry=0,scale=1)=>{model.position.set(x,y,z);model.rotation.y=ry;model.scale.setScalar(scale);root.add(model);return model;};
 const lobbyFloor=wetFloorMaterial(m.floor,{baseWet:.18}),showerFloor=wetFloorMaterial(m.floor,{heads:SHOWER_HEADS,baseWet:.48});
 box(lobbyFloor,0,-.095,2.1,5.2,.18,4.2,'Reception terrazzo tile floor');
 for(const x of[-2.60,2.60]){
  box(m.plaster,x,1.48,2.185,.18,2.96,4.03,'Mineral-stained lobby plaster',.02);
  box(m.jade,x-Math.sign(x)*.11,.56,2.185,.036,1.12,3.97,'Glazed green dado',.004);
  const p=plane(m.border,x-Math.sign(x)*.132,1.17,2.185,3.97,.18,x<0?Math.PI/2:-Math.PI/2);p.geometry.attributes.uv.array.forEach((v,i,a)=>{if(i%2===0)a[i]*=3.1;});
  box(m.stone,x-Math.sign(x)*.12,.055,2.175,.07,.11,4.00,'Coved stone skirting');
 }
 box(m.plaster,0,2.97,2.1,5.35,.14,4.4,'Closed reception ceiling');
 for(const x of[-1.70,1.70])box(m.plaster,x,1.48,4.23,1.72,2.96,.18,'Entrance return wall');box(m.plaster,0,2.66,4.23,1.68,.60,.18);
 for(const x of[-.82,.82])box(m.plastic,x,1.21,4.13,.085,2.42,.14,'Thick entrance door jamb');box(m.plastic,0,2.43,4.13,1.73,.085,.14,'Header');
 box(m.dark,0,.042,4.13,1.66,.07,.25,'Door threshold');
 const door=new T.Group();root.add(door);door.position.set(.76,0,4.13);door.rotation.y=-.13;
 for(const x of[-1.49,0])addBox(door,m.plastic,x,1.18,0,.085,2.32,.075,'Glazed leaf stile');for(const y of[.07,.56,2.30])addBox(door,m.plastic,-.745,y,0,1.49,.10,.075,'Door rail');
 addPlane(door,m.glass,-.745,1.43,-.004,1.4,1.62,0,0,'Diamond embossed door glass');addBox(door,m.jade,-.745,.31,0,1.4,.39,.072,'Lower kick panel');
 addTube(door,m.metal,[[-1.25,.9,-.07],[-1.25,.92,-.12],[-1.25,1.32,-.12],[-1.25,1.34,-.07]],.015,'Door pull handle');
 // Reception counter: cabinet, inset wood panels, continuous supporting plinth.
 box(oldWood,1.20,.51,1.18,2.10,1.02,.77,'Oak reception cabinet',.034);box(m.dark,1.20,.052,1.18,2.05,.105,.72,'Counter plinth');
 for(const x of[.29,.88,1.48,2.08])box(oldWood,x,.56,1.576,.04,.80,.035,'Raised cabinet stile',.009);
 box(m.stone,1.20,1.055,1.18,2.20,.08,.88,'Worn mineral-flecked counter slab',.025);
 put(makeDispenser(T,m),1.84,1.095,1.315,0,.91);
 put(makeTelephone(T,m),.99,1.095,1.16,-.16,.91);
 for(let i=0;i<3;i++){const cover=m.towel.clone();cover.color.set([0x78674b,0x3d6058,0x92765b][i]);box(cover,.39,1.12+i*.045,1.27,.27,.043,.34,'Worn ledger book');box(m.plaster,.39,1.12+i*.045,1.30,.25,.031,.29,'Book pages',.002);}
 put(makePlasticChair(T,m),-2.02,0,.86,Math.PI/2,.90);
 put(makeRockPlanter(T,m),-2.0,0,2.85,0,.83);
 const sign=plane(m.sign,2.495,2.02,1.27,1.48,.493,-Math.PI/2,0,'Generated reception signage');
 box(oldWood,2.46,1.66,2.74,.10,.80,.86,'Recessed key cabinet');
 for(let i=0;i<12;i++){const z=2.42+(i%4)*.20,y=1.92-Math.floor(i/4)*.23;pipe([[2.38,y,z],[2.34,y-.035,z],[2.34,y-.07,z]],.009,m.metal,'Brass key hook');const key=new T.Mesh(new T.TorusGeometry(.024,.005,5,10),m.metal);key.position.set(2.34,y-.09,z);key.rotation.y=Math.PI/2;root.add(key);box(m.plastic,2.34,y-.15,z,.013,.065,.045,'Numbered key tag',.004);}
 box(m.plaster,0,2.84,.235,5.1,.29,.16,'Lobby soffit closing above the unchanged pool partition');
 // Diffuser is physically enclosed, with aged lamp cover and seated endcaps.
 box(m.plastic,0,2.868,2.15,1.39,.13,.34,'Fluorescent casing');box(m.lamp,0,2.790,2.15,1.22,.035,.24,'Opal ceiling diffuser');
 // All new rock remains on shower side of the original pool-room opening.
 const archShape=new T.Shape();archShape.moveTo(-1.0,0);archShape.lineTo(-1.03,1.5);
 for(let i=0;i<=18;i++){const a=Math.PI-Math.PI*i/18;archShape.lineTo(Math.cos(a)*(1.02+.035*Math.sin(i*2.7)),1.5+Math.sin(a)*(1.15+.028*Math.cos(i*3.4)));}
 archShape.lineTo(1.0,0);archShape.lineTo(.59,0);archShape.lineTo(.59,1.57);
 for(let i=0;i<=18;i++){const a=Math.PI*i/18;archShape.lineTo(Math.cos(a)*.59,1.57+Math.sin(a)*.66);}
 archShape.lineTo(-.59,0);archShape.closePath();
 const archGeo=new T.ExtrudeGeometry(archShape,{depth:.36,steps:1,bevelEnabled:true,bevelSegments:2,bevelSize:.035,bevelThickness:.045,curveSegments:4});archGeo.rotateY(Math.PI/2);worldUV(archGeo,.91);
 const arch=new T.Mesh(archGeo,m.stone);arch.position.set(-4.65,0,-1.47);arch.name='Continuous carved limestone arch grown into wet-room wall';arch.castShadow=arch.receiveShadow=true;root.add(arch);
 for(const [z,y,w,h]of[[-2.30,1.92,.41,.49],[-.67,1.77,.34,.51],[-1.49,2.54,.67,.28]])rock(root,m.stone,-4.61,y,z,.18,h,w,y*7);
 // Four-stall wet room, sealed sidewall behind towels, capped tile dividers.
 box(showerFloor,-6.24,-.085,-3.74,4.28,.16,6.30,'Shower floor with integrated wetness');
 box(m.ivory,-8.38,1.48,-3.74,.18,2.96,6.30,'Wet ceramic west wall');
 for(const z of[-6.89,-.59])box(m.ivory,-6.24,1.48,z,4.3,2.96,.18,'Wet ceramic end wall');
 box(m.ivory,-4.29,1.48,-4.66,.12,2.96,4.40,'Shower east tile backing');
 box(m.plaster,-6.24,2.98,-3.74,4.42,.17,6.50,'Steam-stained shower ceiling');box(m.floor,-4.395,-.045,-1.47,.58,.08,1.15,'Flush stone-to-pool linking threshold');
 box(m.jade,-8.26,.084,-3.78,.052,.17,5.96,'Coved wet room skirting');
 box(m.jade,-4.37,.084,-4.655,.052,.17,4.21,'Skirting ending at stone arch pier');
 // The old pool wall and the wet-room backing share one solid reveal. No exposed inset seam.
 box(m.plaster,-4.255,1.145,-2.30,.17,2.29,.23,'Joined pool-to-shower jamb return',.016);
 box(m.plaster,-4.255,1.145,-.665,.17,2.29,.12,'Joined upper doorway jamb return',.016);
 const border=plane(m.border,-8.276,2.39,-3.72,6.1,.19,Math.PI/2,0,'Green geometric shower border');for(let i=0;i<border.geometry.attributes.uv.count;i++)border.geometry.attributes.uv.setX(i,border.geometry.attributes.uv.getX(i)*4.5);
 for(const z of[-6.79,-.687]){const p=plane(m.border,-6.27,2.39,z,4.04,.19,z< -3?0:Math.PI);for(let i=0;i<p.geometry.attributes.uv.count;i++)p.geometry.attributes.uv.setX(i,p.geometry.attributes.uv.getX(i)*3);}
 // Heavy rough stone bench, two broad supports contact the floor.
 for(const z of[-4.96,-3.73])rock(root,m.stone,-5.38,.23,z,.52,.46,.46,7+z);rock(root,m.stone,-5.38,.53,-4.34,.79,.23,2.1,17);
 // Hanging cloth has actual folded surface and rod contact.
 for(const [z,s] of[[-3.0,1],[-5.55,.87]]){
  put(makeTowel(T,m),-4.35-.113*s,.90,z,-Math.PI/2,s);
 }
 put(makeRockPlanter(T,m),-4.79,0,-.98,0,.57);
 const kitMaterials=showerMaterials(m);
 SHOWER_HEADS.forEach((p,i)=>{
  const kit=createStallKit(T,kitMaterials,i);kit.group.position.set(-8.275,0,p.z);kit.group.rotation.y=Math.PI/2;root.add(kit.group);kit.group.updateMatrixWorld(true);
  for(const n of kit.nozzles){const pos=new T.Vector3(...n.position).applyMatrix4(kit.group.matrixWorld),dir=new T.Vector3(...n.direction).transformDirection(kit.group.matrixWorld);nozzles.push({position:pos.toArray(),direction:dir.toArray()});}
  box(m.dark,p.x,.004,p.z,.22,.012,.22,'Inset drain');for(let k=0;k<6;k++)box(m.metal,p.x-.094+k*.037,.011,p.z,.011,.007,.208,'Drain grate',.002);
  if(i<3){box(m.ivory,-7.46,.85,p.z-.725,1.66,1.7,.115,'Beveled tile cubicle divider',.025);box(m.jade,-7.46,1.716,p.z-.725,1.70,.04,.15,'Rounded divider cap',.013);box(m.jade,-6.62,.86,p.z-.725,.045,1.70,.145,'Capped outer divider edge');}
 });
 const showerWater=createHybridShower(scene,presets,nozzles);
 // Spare bottles beside the bench sit on their sides on the tile.
 for(let i=0;i<2;i++){const bottle=new T.Mesh(new T.CylinderGeometry(.035,.039,.17,10),m.plastic);bottle.rotation.z=Math.PI/2; bottle.rotation.y=.5+i; bottle.position.set(-5.95+i*.22,.042,-5.98);root.add(bottle);}
 for(const z of[-2.08,-5.25]){box(m.plastic,-6.30,2.85,z,1.28,.12,.30,'Fluorescent sealed casing');box(m.lamp,-6.30,2.774,z,1.12,.033,.20,'Soft diffuser');}
 const reflector=createBathReflection(scene,[showerFloor]);
 let environment=null,environmentReady=false;
 function beforeRender(renderer,camera){
  if(!environmentReady){environmentReady=true;environment=new T.WebGLCubeRenderTarget(128,{type:renderer.extensions.has('EXT_color_buffer_float')?T.HalfFloatType:T.UnsignedByteType,generateMipmaps:true,minFilter:T.LinearMipmapLinearFilter});
   const cube=new T.CubeCamera(.08,15,environment);cube.position.set(-7.0,1.73,-3.0);const old=renderer.shadowMap.autoUpdate,needs=renderer.shadowMap.needsUpdate;
   try{renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=false;cube.update(renderer,scene);const metals=new Set();scene.traverse(o=>{if(o.material?.metalness>=.9)metals.add(o.material);});for(const material of metals){material.envMap=environment.texture;material.envMapIntensity=.8;material.needsUpdate=true;}}
   finally{renderer.shadowMap.autoUpdate=old;renderer.shadowMap.needsUpdate=needs;}}
  reflector.render(renderer,camera);
 }
 return {clock,presets,streams,materials:m,wetMaterials:[lobbyFloor,showerFloor],beforeRender,update(t){clock.value=t;showerWater.update(t);for(const mat of[lobbyFloor,showerFloor]){mat.userData.wetUniforms.bTime.value=t;mat.userData.wetUniforms.bFlow.value.fromArray(presets.map(v=>v>0?1:0));}},dispose(){reflector.dispose();showerWater.dispose();environment?.dispose();}};
}
