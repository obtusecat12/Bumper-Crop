import {preloadGardenPeople85,createGardenPeople85} from './tiki-garden-people-v85.js';
import {preloadGardenDrinks85,gardenDrinkTextures85} from './tiki-garden-drinks-v85.js';
import {createGardenVending85} from './tiki-garden-vending-v85.js';
import {createGardenCocktails85} from './tiki-garden-cocktails-v85.js';
import {createGardenSprinklers85} from './tiki-garden-sprinklers-v86.js';
import * as T from './vendor/three.module.min.js';
import {RectAreaLightUniformsLib} from './vendor/RectAreaLightUniformsLib.js';
import {preloadGarden81,gardenMaterials81} from './tiki-garden-materials-v86.js';
import {createGardenArchitecture81,createSandal81,GARDEN_FIXTURES81} from './tiki-garden-mesh-v86.js';
import {createGardenWater81} from './tiki-garden-water-v85.js';
import {createGardenEffects81} from './tiki-garden-effects-v86.js';
import {GARDEN81} from './tiki-garden-plan-v86.js';
import {compileBathBatches74,prepareStaticProbe74} from './bath-preparation-v74.js';
import {nextPaint} from './bath-loading-v72.js';
function lighting(scene){RectAreaLightUniformsLib.init();const points=[],areas=[];
 scene.add(new T.HemisphereLight(0xcbdcde,0x726b5a,.34));
 for(const [i,[x,z]]of GARDEN_FIXTURES81.entries()){const l=new T.RectAreaLight(i%3===0?0xd8e4dc:0xd3e6ed,i%3===1?14.0:19.0,1.14,.525);l.position.set(x,GARDEN81.ceiling-.035,z);l.lookAt(x,0,z);scene.add(l);areas.push(l);}
 // Indirect office-light bounce gives the white ceiling a readable surface;
 // it is localized above the back gravel aisle, leaving the pond dark.
 const ceilingBounce=new T.RectAreaLight(0xddd8c8,2.55,13,12);ceilingBounce.position.set(1.1,.7,-5.3);ceilingBounce.lookAt(1.1,GARDEN81.ceiling,-5.3);scene.add(ceilingBounce);areas.push(ceilingBounce);
 for(const p of GARDEN81.globes){const l=new T.PointLight(p.color,1.65,2.8,2);l.position.set(p.x,p.y,p.z);scene.add(l);points.push(l);}
 for(const p of GARDEN81.parasols){const l=new T.PointLight(0xffcd83,1.45,2.7,2);l.position.set(p.x,p.h-.32,p.z);scene.add(l);points.push(l);}
 const pondBounce=new T.RectAreaLight(0xdddbbc,3.1,6.5,4.2);pondBounce.position.set(-3.1,4.5,2.8);pondBounce.lookAt(-2.2,.4,-2.5);scene.add(pondBounce);areas.push(pondBounce);
 const f=GARDEN81.fountain,cyan=new T.PointLight(0x13bcff,7.6,4.8,2);cyan.position.set(f.x,-.02,f.z);scene.add(cyan);points.push(cyan);
 const spill=new T.PointLight(0x52d4ff,1.65,3.0,2);spill.position.set(f.x,.8,f.z);scene.add(spill);points.push(spill);
 const main=new T.SpotLight(0xdde8e5,65,13,.72,.86,2);main.position.set(5.36,6.80,5.1);main.target.position.set(4.7,0,1.4);main.castShadow=true;main.shadow.mapSize.set(768,768);main.shadow.camera.near=.12;main.shadow.camera.far=13;main.shadow.bias=-.0002;main.shadow.normalBias=.035;main.shadow.autoUpdate=false;main.shadow.needsUpdate=true;scene.add(main,main.target);
 const portal=new T.DirectionalLight(0xd5e6ee,1.65);portal.position.set(4.7,6.0,2.2);portal.target.position.set(.2,1.1,8.4);portal.castShadow=true;portal.shadow.mapSize.set(1024,1024);Object.assign(portal.shadow.camera,{left:-4.8,right:4.8,top:4.7,bottom:-4.1,near:.2,far:19});portal.shadow.bias=-.00020;portal.shadow.normalBias=.025;portal.shadow.autoUpdate=false;portal.shadow.needsUpdate=true;scene.add(portal,portal.target);
 const recess=new T.PointLight(0xffb261,3.5,2.7,2);recess.position.set(-1.08,2.04,9.97);scene.add(recess);points.push(recess);
 const hood=new T.PointLight(0xffb766,1.25,2.3,2);hood.position.set(2.05,3.03,7.02);scene.add(hood);points.push(hood);
 const barFill=new T.RectAreaLight(0xe9dbbd,2.1,3.3,1.7);barFill.position.set(-5.4,2.6,4.65);barFill.lookAt(-8.1,1.7,4.65);scene.add(barFill);areas.push(barFill);
 return{points,areas,shadow:main,portal};
}
export async function prepareGarden81(report=()=>{}){
 await preloadGarden81(p=>report(.35*p,'正在读取石墙、雨林和植物贴图'));await nextPaint();
 await preloadGardenPeople85(p=>report(.35+.10*p,'正在读取两位访客的独立 UV 贴图'));await preloadGardenDrinks85(p=>report(.45+.12*p,'正在读取热带饮品与售货机画面'));await nextPaint();
 const {m,texture,textures,streamTexture}=gardenMaterials81(),scene=new T.Scene();scene.name='Lantern Reef / Indoor Tide Garden';scene.background=new T.Color(0x101819);scene.fog=new T.FogExp2(0x222b2b,.004);scene.userData.noAtmosphere=true;
 const object=createGardenArchitecture81(m);scene.add(object);report(.76,'正在围砌两个独立水池与高挑网格吊顶');await nextPaint();
 const sandal=createSandal81(m);scene.add(sandal);const lights=lighting(scene),water=createGardenWater81(scene,texture('surfaces','boulder','roughness'),texture('props','splash')),effects=createGardenEffects81();
 const cocktail=createGardenCocktails85(scene,m,texture('surfaces','boulder','normal'),texture('props','splash'));const people=await createGardenPeople85(scene);const vending=createGardenVending85();scene.add(vending.object);const sprinklers=createGardenSprinklers85(scene,streamTexture,t=>people.react(t),texture('props','splash'));
 const optics={...water,bind(...args){water.bind(...args);cocktail.optics.bind(...args);},update(t){water.update(t);cocktail.optics.update(t);},dispose(){water.dispose();}};
 cocktail.materials.forEach((v,i)=>m['cocktail'+i]=v);Object.entries(vending.mats).forEach(([k,v])=>m['vending'+k]=v);
 for(const [type,a]of Object.entries(vending.prototypes))a.group.traverse(o=>{if(o.isMesh)m['drink'+type+o.id]=o.material;});
 const allTextures=[...new Set([...textures,...people.textures,...gardenDrinkTextures85(),...Object.values(m).flatMap(a=>[a.map,a.normalMap,a.roughnessMap,a.emissiveMap].filter(Boolean))])];
 scene.userData.prepareMainVfx=camera=>optics.setCamera(camera);scene.userData.showerWater=optics;scene.userData.springVolume=effects;scene.updateMatrixWorld(true);report(1,'室内水景已就绪');
 const room={scene,object,sandal,mats:m,optics,effects,lights,people,vending,sprinklers,cocktail,textures:allTextures,warmed:false,probe:null,stats:{...object.userData.cityStats,newSourceImages:18,runtimeTextureFiles:allTextures.length,...effects.stats},
  update(t,dt=0,playing=true,camera=null){people.update(t);sprinklers.update(t);vending.tick(dt,null,playing,camera);const p=sandal.userData.base;sandal.position.set(p.x+Math.sin(t*.105)*.065,p.y+Math.sin(t*.37)*.003,p.z+Math.sin(t*.083)*.052);sandal.rotation.set(Math.sin(t*.31)*.018,-.55+Math.sin(t*.07)*.07,Math.cos(t*.29)*.018);optics.update(t);effects.setTime(t);},
  dispose(){people.dispose();vending.dispose();sprinklers.dispose();cocktail.dispose();optics.dispose();effects.dispose();object.traverse(o=>o.geometry?.dispose());sandal.traverse(o=>o.geometry?.dispose());for(const mat of new Set(Object.values(m)))mat.dispose();room.probe?.dispose();lights.shadow.shadow?.dispose();lights.portal.shadow?.dispose();scene.clear();}
 };return room;
}
export async function warmGarden81(room,renderer,camera,report=()=>{},renderFrame){if(room.warmed)return;let i=0;
 for(const t of room.textures){renderer.initTexture(t);report(.24*++i/room.textures.length,'正在上传水景贴图');await nextPaint();}
 const receivers=Object.values(room.mats).filter(m=>m.isMeshStandardMaterial);room.probe=await prepareStaticProbe74(room.scene,renderer,[0,1.55,4.8],receivers,p=>report(.24+p*.15,'正在准备湿岩与灯具反光'));receivers.forEach(m=>m.envMapIntensity=m===room.mats.wall||m===room.mats.lava?.06:m===room.mats.boulder?.26:m===room.mats.ceiling?.12:.26);
 const rt=new T.WebGLRenderTarget(96,64,{type:T.HalfFloatType}),previous=renderer.getRenderTarget();try{renderer.setRenderTarget(rt);await compileBathBatches74(room.scene,renderer,camera,p=>report(.39+p*.48,'正在逐批预热水景材质'));room.scene.updateMatrixWorld(true);renderer.shadowMap.needsUpdate=true;renderer.render(room.scene,camera);await nextPaint();renderer.setRenderTarget(previous);
  room.optics.setCamera(camera);room.optics.prepare(renderer);report(.93,'正在映出球灯与稻草伞');await nextPaint();renderFrame?.();await nextPaint();room.warmed=true;report(1,'正在打开水景室的门');
 }finally{renderer.setRenderTarget(previous);rt.dispose();}
}
