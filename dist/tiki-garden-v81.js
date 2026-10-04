import * as T from './vendor/three.module.min.js';
import {RectAreaLightUniformsLib} from './vendor/RectAreaLightUniformsLib.js';
import {preloadGarden81,gardenMaterials81} from './tiki-garden-materials-v81.js';
import {createGardenArchitecture81,createSandal81,GARDEN_FIXTURES81} from './tiki-garden-mesh-v81.js';
import {createGardenWater81} from './tiki-garden-water-v81.js';
import {createGardenEffects81} from './tiki-garden-effects-v81.js';
import {GARDEN81} from './tiki-garden-plan-v81.js';
import {compileBathBatches74,prepareStaticProbe74} from './bath-preparation-v74.js';
import {nextPaint} from './bath-loading-v72.js';
function lighting(scene){RectAreaLightUniformsLib.init();const points=[],areas=[];
 scene.add(new T.HemisphereLight(0xcbdcde,0x5a5445,.44));
 for(const [i,[x,z]]of GARDEN_FIXTURES81.entries()){const l=new T.RectAreaLight(i%3===0?0xd8e4dc:0xd3e6ed,i%3===1?1.75:3.0,1.14,.525);l.position.set(x,GARDEN81.ceiling-.035,z);l.lookAt(x,0,z);scene.add(l);areas.push(l);}
 // Indirect office-light bounce gives the white ceiling a readable surface;
 // it is localized above the back gravel aisle, leaving the pond dark.
 const ceilingBounce=new T.RectAreaLight(0xbcc6bf,.82,10,6);ceilingBounce.position.set(1.1,.7,-5.3);ceilingBounce.lookAt(1.1,3.08,-5.3);scene.add(ceilingBounce);areas.push(ceilingBounce);
 for(const p of GARDEN81.globes){const l=new T.PointLight(p.color,1.65,2.8,2);l.position.set(p.x,p.y,p.z);scene.add(l);points.push(l);}
 for(const p of GARDEN81.parasols){const l=new T.PointLight(0xffcd83,1.45,2.7,2);l.position.set(p.x,p.h-.32,p.z);scene.add(l);points.push(l);}
 const pondBounce=new T.RectAreaLight(0xc1af8b,1.3,3.5,2.2);pondBounce.position.set(-3.1,2.85,2.8);pondBounce.lookAt(-2.2,.4,-2.5);scene.add(pondBounce);areas.push(pondBounce);
 const f=GARDEN81.fountain,cyan=new T.PointLight(0x13bcff,7.6,4.8,2);cyan.position.set(f.x,-.02,f.z);scene.add(cyan);points.push(cyan);
 const spill=new T.PointLight(0x52d4ff,1.65,3.0,2);spill.position.set(f.x,.8,f.z);scene.add(spill);points.push(spill);
 const main=new T.SpotLight(0xdde8e5,21,8,.72,.86,2);main.position.set(5.36,3.0,5.1);main.target.position.set(4.7,0,1.4);main.castShadow=true;main.shadow.mapSize.set(768,768);main.shadow.camera.near=.12;main.shadow.camera.far=8;main.shadow.bias=-.0002;main.shadow.normalBias=.035;main.shadow.autoUpdate=false;main.shadow.needsUpdate=true;scene.add(main,main.target);
 return{points,areas,shadow:main};
}
export async function prepareGarden81(report=()=>{}){
 await preloadGarden81(p=>report(.57*p,'正在读取岩石、吊顶与植物贴图'));await nextPaint();
 const {m,texture,textures}=gardenMaterials81(),scene=new T.Scene();scene.name='Lantern Reef / Indoor Tide Garden';scene.background=new T.Color(0x101819);scene.fog=new T.FogExp2(0x222b2b,.008);scene.userData.noAtmosphere=true;
 const object=createGardenArchitecture81(m);scene.add(object);report(.76,'正在围砌两个独立水池与低矮吊顶');await nextPaint();
 const sandal=createSandal81(m);scene.add(sandal);const lights=lighting(scene),optics=createGardenWater81(scene,texture('surfaces','boulder','roughness'),texture('props','splash')),effects=createGardenEffects81();
 scene.userData.prepareMainVfx=camera=>optics.setCamera(camera);scene.userData.showerWater=optics;scene.userData.springVolume=effects;scene.updateMatrixWorld(true);report(1,'室内水景已就绪');
 const room={scene,object,sandal,mats:m,optics,effects,lights,textures,warmed:false,probe:null,stats:{...object.userData.cityStats,sourceImages:13,runtimeTextureFiles:37,...effects.stats},
  update(t){const p=sandal.userData.base;sandal.position.set(p.x+Math.sin(t*.105)*.065,p.y+Math.sin(t*.37)*.003,p.z+Math.sin(t*.083)*.052);sandal.rotation.set(Math.sin(t*.31)*.018,-.55+Math.sin(t*.07)*.07,Math.cos(t*.29)*.018);optics.update(t);effects.setTime(t);},
  dispose(){optics.dispose();effects.dispose();object.traverse(o=>o.geometry?.dispose());sandal.traverse(o=>o.geometry?.dispose());for(const mat of new Set(Object.values(m)))mat.dispose();room.probe?.dispose();lights.shadow.shadow?.dispose();scene.clear();}
 };return room;
}
export async function warmGarden81(room,renderer,camera,report=()=>{},renderFrame){if(room.warmed)return;let i=0;
 for(const t of room.textures){renderer.initTexture(t);report(.24*++i/room.textures.length,'正在上传水景贴图');await nextPaint();}
 const receivers=Object.values(room.mats).filter(m=>m.isMeshStandardMaterial);room.probe=await prepareStaticProbe74(room.scene,renderer,[0,1.55,4.8],receivers,p=>report(.24+p*.15,'正在准备湿岩与灯具反光'));receivers.forEach(m=>m.envMapIntensity=m===room.mats.boulder?.26:m===room.mats.ceiling?.15:.23);
 const rt=new T.WebGLRenderTarget(96,64,{type:T.HalfFloatType}),previous=renderer.getRenderTarget();try{renderer.setRenderTarget(rt);await compileBathBatches74(room.scene,renderer,camera,p=>report(.39+p*.48,'正在逐批预热水景材质'));room.scene.updateMatrixWorld(true);renderer.shadowMap.needsUpdate=true;renderer.render(room.scene,camera);await nextPaint();renderer.setRenderTarget(previous);
  room.optics.setCamera(camera);room.optics.prepare(renderer);report(.93,'正在映出球灯与稻草伞');await nextPaint();renderFrame?.();await nextPaint();room.warmed=true;report(1,'正在打开水景室的门');
 }finally{renderer.setRenderTarget(previous);rt.dispose();}
}
