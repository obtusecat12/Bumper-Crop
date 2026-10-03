import * as T from './vendor/three.module.min.js';
import {TikiKit,tikiIdol,coloredBulbs,disposeTiki} from './tiki-geometry-v76.js';
import {tikiMaterials,initializeTikiTextures} from './tiki-materials-v76.js';
import {createSpaBloom} from './spa-bloom-v65.js';
import {nextPaint} from './bath-loading-v72.js';
import {compileBathBatches74} from './bath-preparation-v74.js';
const atlas=[[0,.5,.5,.5],[.5,.5,.5,.5],[0,0,.5,.5],[.5,0,.5,.5]];
function atlasGeometry(g,index){const uv=g.attributes.uv,r=atlas[index];for(let i=0;i<uv.count;i++)uv.setXY(i,r[0]+.015+uv.getX(i)*.47,r[1]+.015+uv.getY(i)*.47);return g;}
function bottle(k,x,y,z,index=0,scale=1){const pts=[[0,0],[.047,.008],[.05,.20],[.045,.23],[.022,.26],[.02,.35],[.024,.36]].map(([a,b])=>new T.Vector2(a*scale,b*scale));k.add(new T.LatheGeometry(pts,10),'glass',x,y,z);k.add(atlasGeometry(new T.CylinderGeometry(.0505*scale,.0505*scale,.115*scale,10,1,true),index),'tabletop',x,y+.127*scale,z);k.cyl('brass',x,y+.357*scale,z,.025*scale,.025*scale,.022*scale,10);}
function mug(k,x,y,z,rotation=0){k.add(atlasGeometry(new T.CylinderGeometry(.071,.060,.19,10,1,true),2),'tabletop',x,y+.095,z);k.cyl('dark',x,y+.176,z,.059,.059,.011,12);k.tube('bamboo',[[x+.06,y+.155,z],[x+.12,y+.145,z],[x+.12,y+.065,z],[x+.06,y+.055,z]],.013,16);k.plane('tabletop',x,y+.002,z,.23,.23,[-Math.PI/2,0,rotation],atlas[3]);}
function lamp(k,x,y,z,size=.40){k.beam('dark',[x,3.34,z],[x,y+.23,z],.013,6);k.cyl('wood',x,y+.24,z,size*.4,size*.5,.08,12);k.cyl('mat',x,y,z,size*.5,size,.43,16);k.cyl('bulb3',x,y-.195,z,size*.85,size*.85,.012,16);for(let i=0;i<8;i++){const a=i*Math.PI/4;k.beam('bamboo',[x+Math.cos(a)*size*.5,y+.215,z+Math.sin(a)*size*.5],[x+Math.cos(a)*size,y-.215,z+Math.sin(a)*size],.017,6);} }
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
function booths(k){for(const z of[-3.55,-.15,3.25]){
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
 for(const y of[1.48,2.05,2.62]){k.box('wood',6.40,y,-.5,.49,.085,8.7,.025);for(const z of[-4.7,-2.5,-.2,2.1,3.7])k.box('wood',6.45,y-.18,z,.32,.30,.1);for(let i=0;i<14;i++)bottle(k,6.22,y+.05,-4.58+i*.61,i%2,.87+(i%3)*.08);}
 for(const z of[-4.6,-1.8,1.1,3.7]){mug(k,3.7,1.145,z,.1);bottle(k,4.15,1.145,z+.3,1);k.plane('menu',3.77,1.146,z+.45,.34,.34,[-Math.PI/2,0,Math.PI/2]);}
 k.box('dark',4.8,1.20,-4.33,.49,.23,.45,.025);for(let x=4.59;x<4.98;x+=.055)k.box('paper',x,1.328,-4.21,.035,.023,.18,.004);k.box('brass',4.8,1.47,-4.48,.42,.22,.11,.015);
 for(const z of[-3.7,-.5,2.7])lamp(k,4.07,2.42,z,.34);
 // Service hatch and small food pass make the combined bar/restaurant legible.
 k.box('wood',4.4,1.78,-6.4,2.8,1.67,.18);k.box('dark',4.4,1.79,-6.285,2.48,1.40,.06);k.box('brass',4.4,2.37,-6.03,2.57,.23,.58,.045);k.box('counter',4.4,1.07,-6.03,2.86,.12,.76);for(let i=0;i<5;i++)k.cyl('paper',3.75,1.15+i*.022,-5.95,.19,.17,.024,20);
 k.plane('menu',1.90,2.1,-6.48,.82,.82);k.box('wood',1.9,2.10,-6.54,.97,.97,.07,.035);
}
export async function prepareTikiRoom(report=()=>{}){
 await initializeTikiTextures(true,p=>report(.20*p,'正在读取 Tiki 室内材质'));await nextPaint();const m=tikiMaterials(true),k=new TikiKit(m);
 // A shared five-color bulb palette, no material per bulb or per bottle.
 coloredBulbs(k,Array.from({length:18},(_,i)=>[-6.35+i*.745,2.97-.15*Math.sin(i*.63),-5.99]));roomShell(k);report(.35,'正在拼接竹木墙面与梁架');await nextPaint();booths(k);report(.55,'正在安装餐厅卡座');await nextPaint();bar(k);report(.75,'正在安装吧台与餐具');await nextPaint();
 k.box('wood',-.45,.62,-5.62,2.8,1.23,1.1,.055);k.box('counter',-.45,1.29,-5.62,2.93,.12,1.19,.055);k.plane('menu',-.7,1.36,-5.61,.48,.48,[-Math.PI/2,0,-.08]);k.plane('sign',-.4,2.57,-6.460,3.81,1.27);k.box('wood',-.4,2.57,-6.54,3.95,1.39,.13);
 tikiIdol(k,-2.48,-5.83,.78);tikiIdol(k,1.12,-5.92,.60);
 // Hanging glass fishing floats have visible knotted cord cages and ceiling fixings.
 for(const [x,y,z,r]of[[-2.5,2.72,3.0,.19],[-2.6,2.8,-.3,.25],[1.6,2.67,1.9,.22],[.5,2.78,-3.8,.17]]){k.sphere('glass',x,y,z,r);k.beam('rope',[x,3.33,z],[x,y+r,z],.014,6);for(let i=0;i<4;i++){const a=i*Math.PI/4;k.add(new T.TorusGeometry(r*1.01,.009,5,20),'rope',x,y,z,[0,a,0]);}k.add(new T.TorusGeometry(r,.009,5,20),'rope',x,y,z,[Math.PI/2,0,0]);}
 const object=k.finish('Lantern Reef / intimate dining room'),scene=new T.Scene();scene.name='Level 11 / Lantern Reef interior';scene.background=new T.Color(0x17160f);scene.fog=new T.FogExp2(0x30291b,.025);scene.userData.noAtmosphere=true;scene.add(object);
 scene.add(new T.HemisphereLight(0xa6bbbe,0x6e4230,.45));const lamps=[];for(const [x,y,z,intensity,color]of[[-4.95,2.24,-3.55,14,0xffc276],[-4.95,2.24,-.15,14,0xffc276],[-4.95,2.24,3.25,14,0xffc276],[4.0,2.18,-3.7,13,0xffb567],[4.0,2.18,-.5,13,0xffb567],[4.0,2.18,2.7,13,0xffb567],[0,2.6,4.9,9,0xd79b69],[0,2.8,-4.5,11,0xcc835b]]){const l=new T.PointLight(color,intensity,5.5,2);l.position.set(x,y,z);scene.add(l);lamps.push(l);}
 const key=new T.SpotLight(0xffcb8b,26,16,.98,.8,2);key.position.set(0,3.24,.0);key.target.position.set(0,0,-1);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.bias=-.0003;key.shadow.normalBias=.035;key.shadow.camera.near=.2;key.shadow.camera.far=16;scene.add(key,key.target);
 const bloom=createSpaBloom(T,{cameraMinX:-999,strength:.18,radius:.24,threshold:1.10,knee:.25});scene.userData.springVolume={compose:(renderer,color,depth,camera,w,h)=>bloom.compose(renderer,color,depth,camera,w,h,0)};
 // A small slow fan is the only moving solid, kept separate from static batches.
 const fan=new T.Group();fan.position.set(0,3.02,.4);scene.add(fan);for(let i=0;i<4;i++){const g=new T.BoxGeometry(.14,.025,.62),o=new T.Mesh(g,m.counter);o.position.set(Math.sin(i*Math.PI/2)*.34,0,Math.cos(i*Math.PI/2)*.34);o.rotation.y=i*Math.PI/2;fan.add(o);}const hub=new T.Mesh(new T.CylinderGeometry(.10,.12,.13,12),m.brass);fan.add(hub);const rod=new T.Mesh(new T.CylinderGeometry(.026,.026,.27,8),m.dark);rod.position.y=.16;fan.add(rod);
 scene.updateMatrixWorld(true);report(1,'室内空间已就绪');return{scene,object,mats:m,warmed:false,stats:object.userData.cityStats,update(t){fan.rotation.y=t*.17;},dispose(){disposeTiki(object,m);fan.traverse(o=>o.geometry?.dispose());bloom.dispose();key.shadow.dispose();}};
}
export async function warmTikiRoom(room,renderer,camera,report,renderFrame){if(room.warmed)return;const textures=new Set();room.scene.traverse(o=>{for(const m of Array.isArray(o.material)?o.material:[o.material])if(m)for(const v of Object.values(m))if(v?.isTexture)textures.add(v);});let i=0;for(const t of textures){renderer.initTexture(t);report(.20*++i/textures.size,'正在上传室内贴图');await nextPaint();}const target=new T.WebGLRenderTarget(128,96,{type:T.HalfFloatType}),previous=renderer.getRenderTarget();try{renderer.setRenderTarget(target);await compileBathBatches74(room.scene,renderer,camera,p=>report(.2+p*.68,'正在预编译 Tiki 灯光材质'));renderer.shadowMap.needsUpdate=true;renderer.render(room.scene,camera);await nextPaint();if(renderFrame)renderFrame();report(1,'正在推开竹木门');room.warmed=true;}finally{renderer.setRenderTarget(previous);target.dispose();}}
