import {buildReception72} from './bath-reception-v72.js';
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
 const reception=buildReception72(root,m),lobbyFloor=reception.floor,showerFloor=wetFloorMaterial(m.floor,{heads:SHOWER_HEADS,baseWet:.48});
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
