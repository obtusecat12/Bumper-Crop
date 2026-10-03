import * as T from './vendor/three.module.min.js';
import {TikiKit,coloredBulbs,disposeTiki} from './tiki-geometry-v76.js';
import {initializeTiki77,tiki77Materials} from './tiki-materials-v77.js';
import {cocktailCounter,idolCorner,shelfBottles,blackPendant,liquorBottle} from './tiki-props-v77.js';
import {canoeBuffet} from './tiki-buffet-v77.js';
import {moaiPond,pondSpray} from './tiki-pond-v77.js';
import {createTikiOptics} from './tiki-optics-v77.js';
import {createTikiEffects} from './tiki-effects-v77.js';
import {applyBatchLayers,card} from './tiki-mesh-v77.js';
import {RectAreaLightUniformsLib} from './vendor/RectAreaLightUniformsLib.js';
import {TIKI_BOOTH_ROWS,TIKI_DETAILS} from './tiki-plan-v77.js';

import {nextPaint} from './bath-loading-v72.js';
import {compileBathBatches74,prepareStaticProbe74} from './bath-preparation-v74.js';
const atlas=[[0,.5,.5,.5],[.5,.5,.5,.5],[0,0,.5,.5],[.5,0,.5,.5]];
function atlasGeometry(g,index){const uv=g.attributes.uv,r=atlas[index];for(let i=0;i<uv.count;i++)uv.setXY(i,r[0]+.015+uv.getX(i)*.47,r[1]+.015+uv.getY(i)*.47);return g;}
function bottle(k,x,y,z,index=0,scale=1){liquorBottle(k,x,y,z,index,scale,0,false);}
function mug(k,x,y,z,rotation=0){k.add(atlasGeometry(new T.CylinderGeometry(.071,.060,.19,10,1,true),2),'tabletop',x,y+.095,z);k.cyl('dark',x,y+.176,z,.059,.059,.011,12);k.tube('bamboo',[[x+.06,y+.155,z],[x+.12,y+.145,z],[x+.12,y+.065,z],[x+.06,y+.055,z]],.013,16);k.plane('tabletop',x,y+.002,z,.23,.23,[-Math.PI/2,0,rotation],atlas[3]);}
function lamp(k,x,y,z,size=.34){blackPendant(k,x,y-.21,z,size);}
function roomShell(k){
 k.box('floor',0,-.095,0,13.65,.19,13.25,.03);k.box('mat',0,3.42,0,13.65,.18,13.25);
 for(const x of[-6.8,6.8]){k.box('mat',x,1.68,0,.18,3.36,13.2);k.box('rock',x+(x<0?.12:-.12),.49,0,.19,.98,13.2);}
 k.box('mat',0,1.68,-6.6,13.6,3.36,.18);k.box('rock',0,.49,-6.47,13.6,.98,.18);
 for(const side of[-1,1]){k.box('mat',side*3.95,1.68,6.6,5.7,3.36,.18);k.box('rock',side*3.95,.49,6.47,5.7,.98,.18);}k.box('mat',0,3.02,6.6,2.24,.68,.18);
 for(let z=-6.2;z<6.4;z+=.25){for(const side of[-1,1])k.cyl('bamboo',side*6.65,.59,z,.038,.047,1.17,7);}
 for(let z=-5.7;z<6.4;z+=2.4){k.beam('wood',[-6.6,3.21,z],[6.6,3.21,z],.095,10);for(const side of[-1,1]){k.beam('wood',[side*6.6,.02,z],[side*6.6,3.31,z],.105,10);k.beam('wood',[side*6.6,2.74,z],[side*6.03,3.23,z],.07,8);}}
 for(const z of[-6.4,6.4])k.beam('bamboo',[-6.6,1.06,z],[6.6,1.06,z],.06);for(const x of[-6.55,6.55])k.beam('bamboo',[x,1.06,-6.4],[x,1.06,6.4],.06);
 // Door leaf, hardware and readable exit: a physical return portal.
 k.box('wood',0,1.28,6.45,2.10,2.56,.23,.04);k.box('bamboo',0,1.25,6.30,1.81,2.34,.12);for(const side of[-1,1])k.box('wood',side*.86,1.25,6.21,.11,2.35,.1);k.box('wood',0,1.28,6.19,1.8,.11,.11);k.tube('brass',[[.63,.96,6.16],[.63,.99,6.08],[.63,1.3,6.08],[.63,1.33,6.16]],.019,16);
 k.box('wood',0,2.92,6.24,1.3,.32,.1);k.plane('sign',0,2.92,6.18,1.21,.40,[0,Math.PI,0]);
}
function booths(k){for(const z of TIKI_BOOTH_ROWS){
 for(const side of[-1,1]){const zz=z+side*.98;k.box('wood',-4.95,.21,zz,2.66,.40,.63,.055);k.box('vinyl',-4.95,.46,zz,2.65,.17,.68,.07);k.box('wood',-4.95,.91,zz+side*.28,2.73,.95,.13);k.box('vinyl',-4.95,.91,zz+side*.185,2.63,.84,.15,.06);for(let x=-6.08;x<-3.7;x+=.31)k.box('vinyl',x,.91,zz+side*.095,.024,.70,.032,.01);k.box('wood',-4.95,1.42,zz+side*.24,2.82,.1,.28,.04);}
 k.box('counter',-4.95,.765,z,2.65,.095,1.25,.065);for(const x of[-5.7,-4.2]){k.cyl('dark',x,.38,z,.065,.075,.73,10);k.box('dark',x,.045,z,.65,.07,.7,.035);}
 k.plane('menu',-4.65,.82,z+.15,.28,.34,[-Math.PI/2,0,.13]);mug(k,-5.75,.818,z-.28);mug(k,-4.05,.818,z+.30,.5);bottle(k,-4.35,.82,z-.37,0);
 for(const x of[-5.35,-4.68]){k.cyl('paper',x,.829,z,.20,.17,.023,24);k.cyl('paper',x,.842,z,.14,.14,.008,24);k.box('paper',x+.27,.83,z,.13,.023,.20,.015,-.16);k.box('brass',x-.26,.83,z,.013,.009,.25,.003);}
 // Tightly tied bamboo wall panel creates each recessed booth, no huge blank plane.
 for(const zz of[z-1.43,z+1.43]){k.box('mat',-5.06,1.06,zz,3.04,2.08,.08);k.beam('bamboo',[-6.55,2.13,zz],[-3.55,2.13,zz],.055);for(let xx=-6.45;xx<-3.5;xx+=.19)k.cyl('bamboo',xx,1.07,zz,.028,.032,2.09,7);}
 lamp(k,-4.93,2.45,z,.39);
}}
function bar(k){
 k.box('rock',4.75,.47,-.45,2.36,.94,9.15,.05);k.box('counter',4.73,1.06,-.45,2.87,.16,9.30,.065);k.box('wood',3.48,.54,-.45,.20,.96,9.13);
 for(let z=-4.85;z<4.01;z+=.16)k.cyl('bamboo',3.345,.50,z,.046,.043,.91,8);k.beam('brass',[3.08,.23,-4.89],[3.08,.23,4.01],.043,10);for(const z of[-4.5,-1.8,1.1,3.7])k.beam('brass',[3.47,.2,z],[3.08,.23,z],.038);
 for(const z of[-3.7,-2.1,-.5,1.1,2.7]){k.cyl('vinyl',2.78,.76,z,.31,.31,.12,16);for(let i=0;i<4;i++){const a=i*Math.PI/2+.785;k.beam('wood',[2.78+Math.cos(a)*.22,.02,z+Math.sin(a)*.22],[2.78+Math.cos(a)*.17,.70,z+Math.sin(a)*.17],.040);}k.add(new T.TorusGeometry(.23,.019,6,16),'brass',2.78,.28,z,[Math.PI/2,0,0]);}
 for(const y of[1.48,2.05,2.62]){k.box('wood',6.40,y,-.5,.49,.085,8.7,.025);for(const z of[-4.7,-2.5,-.2,2.1,3.7])k.box('wood',6.45,y-.18,z,.32,.30,.1);}
 for(const z of[-4.6,-1.8,1.1,3.7]){mug(k,3.7,1.145,z===3.7?3.05:z,.1);bottle(k,z===3.7?5.0:4.15,1.145,z===3.7?2.95:z+.3,1);k.plane('menu',3.77,1.146,z+.45,.34,.34,[-Math.PI/2,0,Math.PI/2]);}
 for(const z of[-3.7,-.5,2.7])lamp(k,4.07,2.42,z,.34);
 shelfBottles(k);
}
function practicalLighting(scene){
 // No AmbientLight. A tiny hemisphere term prevents numeric black only;
 // all readable light is tied to a visible pendant, sign, lantern or LED.
 scene.add(new T.HemisphereLight(0x747d7a,0x2a170e,.095));
 const spots=[],points=[];
 const spot=(x,y,z,tx,ty,tz,intensity,angle,shadow=false)=>{const l=new T.SpotLight(0xffb45d,intensity,5.6,angle,.65,2);l.position.set(x,y,z);l.target.position.set(tx,ty,tz);l.castShadow=shadow;if(shadow){l.shadow.mapSize.set(768,768);l.shadow.camera.near=.05;l.shadow.camera.far=5.6;l.shadow.bias=-.00016;l.shadow.normalBias=.018;l.shadow.autoUpdate=false;l.shadow.needsUpdate=true;}scene.add(l,l.target);spots.push(l);return l;};
 for(const [i,z]of TIKI_BOOTH_ROWS.entries())spot(-4.93,2.29,z,-4.93,.77,z,23,.53,i===1);
 for(const [i,z]of[-3.7,-.5,2.7].entries())spot(4.07,2.27,z,3.93,1.15,z,21,.40,i===1);
 for(const x of[3.25,5.11])spot(x,2.52,-5.53,x,1.15,-5.56,10,.51,false);
 for(const z of[-4.45,-2.35])spot(-.25,2.63,z,-.25,1.0,z,20,.49,z===-2.35);
 const practical=(x,y,z,color,power,distance)=>{const l=new T.PointLight(color,power,distance,2);l.position.set(x,y,z);scene.add(l);points.push(l);return l;};
 practical(4.77,1.39,3.65,0xff3212,.80,2.4);practical(5.82,1.54,-5.97,0xffca69,.65,2.0);
 practical(6.0,2.43,-3.3,0x73ba84,1.65,2.7);practical(6.0,2.49,.35,0xf67f37,1.8,2.8);practical(6.05,2.55,3.31,0x678bd6,1.15,2.2);practical(2.63,2.68,-6.05,0xdd6339,1.55,2.4);
 practical(-5.55,.33,-5.12,0x91ff3b,.48,2.4);practical(-4.25,.34,-5.65,0xffc64c,.44,2.3);
 // A grazing reflected pool glow reads the wet Moai face without illuminating
 // the whole ceiling. It is located at the actual green/yellow water basin.
 spot(-4.55,.50,-4.67,-4.93,1.8,-5.50,5.4,.44,false).color.setHex(0xcac778);
 RectAreaLightUniformsLib.init();const bounced=[];for(const [p,target,power,w,h]of[[[4.12,1.88,-4.67],[4.12,1.54,-5.55],4.8,3.35,.45],[[-.35,1.83,-1.03],[-.25,1.30,-3.1],4.0,1.6,.6],[[4.25,2.1,4.9],[5.0,1.3,3.8],4.0,1.6,.8],[[-4.20,1.48,-3.8],[-4.93,1.75,-5.75],2.1,1.15,.70]]){const light=new T.RectAreaLight(0xffd7a9,power,w,h);light.position.fromArray(p);light.lookAt(...target);scene.add(light);bounced.push(light);}
 return{spots,points,bounced};
}
function strings(k){
 // Existing five-colour palette remains batched; dozens of visible lamps use
 // eight regional light sources, never one costly PointLight per bulb.
 const colors=[0xed9342,0x69b99b,0xd04935,0xe2cb72,0x609dc0];for(let i=0;i<5;i++){k.m['bulb'+i]=k.m.bulb.clone();k.m['bulb'+i].vertexColors=false;k.m['bulb'+i].color.setHex(colors[i]);k.m['bulb'+i].emissive.setHex(colors[i]);k.m['bulb'+i].emissiveIntensity=1.65;}const back=Array.from({length:24},(_,i)=>[-6.32+i*.547,3.05-.14*Math.sin(i*.58),-6.14]);k.tube('dark',back,.008,72);back.forEach(([x,y,z],i)=>{k.cyl('blackMetal',x,y-.018,z,.018,.020,.035,7);k.sphere('bulb'+i%5,x,y-.063,z,.025,.034,.025);});
 const line=[];for(let i=0;i<27;i++)line.push([6.10,2.91-.09*Math.sin(i*.66),-5.93+i*.39]);k.tube('dark',line,.008,72);line.forEach(([x,y,z],i)=>{k.cyl('blackMetal',x,y-.026,z,.021,.023,.047,7);k.sphere('bulb'+i%5,x,y-.077,z,.029,.039,.029);});
}
export async function prepareTikiRoom(report=()=>{}){
 await initializeTiki77(p=>report(.27*p,'正在读取逐件生成的酒吧贴图'));await nextPaint();const {m,tex}=tiki77Materials(),optics=createTikiOptics(m,tex),k=new TikiKit(m);
 strings(k);roomShell(k);report(.34,'正在铺设暗色竹木墙面');await nextPaint();booths(k);report(.42,'正在安放原有卡座与黑色吊灯');await nextPaint();bar(k);report(.52,'正在排列十二种瓶身和金属酒嘴');await nextPaint();cocktailCounter(k);report(.64,'正在摆放酒杯、薄荷、花环与冲浪板');await nextPaint();moaiPond(k);report(.75,'正在连接摩艾瀑布与室内水池');await nextPaint();canoeBuffet(k);report(.87,'正在嵌入三只冰盘与水果独木舟');await nextPaint();idolCorner(k);
 for(const x of[3.25,5.11])blackPendant(k,x,2.47,-5.53,.28);for(const z of[-4.45,-2.35])blackPendant(k,-.25,2.58,z,.30);
 // Keep the name at the back, moved above the central approach; it does not
 // overlap the surfboard, stone wall, or the floating fruit presentation.
 k.box('wood',-.13,2.90,-6.49,3.36,.94,.12,.035);k.plane('sign',-.13,2.90,-6.417,3.22,1.07);
 k.plane('decor',-6.674,2.60,1.35,.66,.82,[0,Math.PI/2,0],[0,.5,.5,.5]);k.plane('decor',6.679,2.17,-5.03,.53,.63,[0,-Math.PI/2,0],[.5,.5,.5,.5]);
 for(const [x,y,z,r]of[[-2.5,2.72,3.0,.19],[-2.6,2.8,-.3,.25],[1.6,2.67,1.9,.22],[.5,2.78,-3.8,.17]]){k.sphere('greenGlass',x,y,z,r);k.beam('rope',[x,3.33,z],[x,y+r,z],.012,6);for(let i=0;i<4;i++){const a=i*Math.PI/4;k.add(new T.TorusGeometry(r*1.01,.008,5,20),'rope',x,y,z,[0,a,0]);}k.add(new T.TorusGeometry(r,.008,5,20),'rope',x,y,z,[Math.PI/2,0,0]);}
 const object=k.finish('Lantern Reef V77 / reference reconstruction');applyBatchLayers(object);const scene=new T.Scene();scene.name='Level 11 / Lantern Reef, after dark';scene.background=new T.Color(0x080907);scene.fog=new T.FogExp2(0x100c07,.014);scene.userData.noAtmosphere=true;scene.add(object);const lights=practicalLighting(scene),effects=createTikiEffects(tex),spray=pondSpray(scene);scene.userData.showerWater=optics;scene.userData.springVolume=effects;
 const fan=new T.Group();fan.position.set(0,3.04,.4);scene.add(fan);for(let i=0;i<4;i++){const o=new T.Mesh(new T.BoxGeometry(.14,.025,.62),m.counter);o.position.set(Math.sin(i*Math.PI/2)*.34,0,Math.cos(i*Math.PI/2)*.34);o.rotation.y=i*Math.PI/2;fan.add(o);}fan.add(new T.Mesh(new T.CylinderGeometry(.10,.12,.13,12),m.bronze));const rod=new T.Mesh(new T.CylinderGeometry(.025,.025,.28,8),m.blackMetal);rod.position.y=.17;fan.add(rod);
 scene.updateMatrixWorld(true);report(1,'酒吧模型已就绪');const stats={...object.userData.cityStats,spotLights:lights.spots.length,pointLights:lights.points.length,areaBounces:lights.bounced.length,shadowMaps:lights.spots.filter(l=>l.castShadow).length,generatedMaterials:Object.keys(m).length,effects:effects.stats};
 return{scene,object,mats:m,optics,effects,lights,warmed:false,probe:null,stats,details:TIKI_DETAILS,update(t){fan.rotation.y=t*.13;optics.update(t);effects.setTime(t);spray.update(t);lights.points[0].intensity=0.80*(.985+.015*Math.sin(t*2.7));},dispose(){disposeTiki(object,m);fan.traverse(o=>o.geometry?.dispose());effects.dispose();spray.dispose();this.probe?.dispose();lights.spots.forEach(l=>l.shadow?.dispose());}};
}
export async function warmTikiRoom(room,renderer,camera,report,renderFrame){if(room.warmed)return;const textures=new Set();room.scene.traverse(o=>{for(const m of Array.isArray(o.material)?o.material:[o.material])if(m){for(const v of Object.values(m))if(v?.isTexture)textures.add(v);for(const u of Object.values(m.uniforms||{}))if(u.value?.isTexture)textures.add(u.value);}});let i=0;for(const t of textures){renderer.initTexture(t);report(.20*++i/textures.size,'正在上传物件贴图');await nextPaint();}
 const receivers=Object.values(room.mats).filter(m=>m.isMeshStandardMaterial);room.probe=await prepareStaticProbe74(room.scene,renderer,[2.8,1.6,-.7],receivers,p=>report(.20+p*.15,'正在记录玻璃、木器与金属的室内反光'));receivers.forEach(m=>{m.envMapIntensity=m===room.mats.blackMetal?.12:m===room.mats.moai?.32:.28;});
 const target=new T.WebGLRenderTarget(128,96,{type:T.HalfFloatType}),previous=renderer.getRenderTarget();try{renderer.setRenderTarget(target);await compileBathBatches74(room.scene,renderer,camera,p=>report(.35+p*.55,'正在分批预热酒吧灯光与折射材质'));renderer.shadowMap.needsUpdate=true;renderer.render(room.scene,camera);await nextPaint();renderer.setRenderTarget(previous);if(renderFrame)renderFrame();await nextPaint();report(1,'正在推开竹木门');room.warmed=true;}finally{renderer.setRenderTarget(previous);target.dispose();}}
