import * as T from './vendor/three.module.min.js';
import {UrbanBatch} from './urban-batch.js?v=58';
import {clinicToWorld,CLINIC_ANGLE} from './reference-scenes.js?v=58';
import {EXIT_CITY_Y} from './exit-route.js?v=58';
const center=clinicToWorld(91.4,40),angle=CLINIC_ANGLE-Math.PI/2,Y=EXIT_CITY_Y+.15;
export const BATH_ADDRESS={x:center.x,z:center.z,angle};
export function bathLocal(wx,wz){const c=Math.cos(angle),s=Math.sin(angle),x=wx-center.x,z=wz-center.z;return{x:c*x-s*z,z:s*x+c*z};}
export function underShower(wx,wz){const p=bathLocal(wx,wz);return Math.abs(p.x)<.63&&p.z< -1.7&&p.z> -3.0;}
export function nearShower(wx,wz){const p=bathLocal(wx,wz);return Math.abs(p.x)<1.0&&p.z<-.88&&p.z>-3.1;}
export function bathPoint(x,z){const c=Math.cos(angle),s=Math.sin(angle);return{x:center.x+c*x+s*z,z:center.z-s*x+c*z};}
export const BATH_WAYPOINT={...bathPoint(0,6.15),yaw:angle,pitch:.15,label:'Level 27 入口 · 临街热水浴室'};
function label(lines,bg='#d5d6c4',fg='#244943'){const c=document.createElement('canvas');c.width=768;c.height=256;const g=c.getContext('2d');g.fillStyle=bg;g.fillRect(0,0,768,256);g.strokeStyle=fg;g.lineWidth=5;g.strokeRect(13,13,742,230);g.textAlign='center';g.fillStyle=fg;for(let i=0;i<lines.length;i++){g.font=(i?'28':'bold 70')+'px sans-serif';g.fillText(lines[i],384,105+i*56,706);}const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return new T.MeshStandardMaterial({map:t,roughness:.6,emissive:0xb5c1a0,emissiveMap:t,emissiveIntensity:.19,vertexColors:true});}
export function createSpringEntrance(mats){
 mats.bathSign=label(['BAÑOS · SHOWERS','AGUA CALIENTE  /  24 HORAS']);
 mats.bathGuide=label(['M.E.G. 27','MAX HOT → CLOSE YOUR EYES']);
 mats.bathControl=label(['HOT / MAX','I   WARM     II   HOT'], '#dfd4b4','#744939');
 mats.bathTile=new T.MeshStandardMaterial({map:mats.stucco.map,color:0xb4c5bd,roughness:.64,emissive:0x9fac91,emissiveIntensity:.07,vertexColors:true});
 mats.bathGrout=new T.MeshStandardMaterial({color:0x6f8179,roughness:.94,vertexColors:true});
 const b=new UrbanBatch(mats);b.push(center.x,Y,center.z,angle);
 // Infill footprint stays wholly behind the existing sidewalk edge, between
 // the neighboring parcels. No blanket terrain or replacement pavement.
 b.box('concrete',0,-.09,0,5.6,.18,6.8);b.walk(0,0,5.6,6.8,0);
 for(const x of[-2.7,2.7]){b.box('stucco',x,1.86,0,.20,3.72,6.8);b.solid(x,0,.20,6.8);b.plane('bathTile',x-Math.sign(x)*.106,1.37,0,6.58,2.74,-Math.sign(x)*Math.PI/2);}
 b.box('stucco',0,1.86,-3.30,5.6,3.72,.2);b.solid(0,-3.3,5.6,.20);b.plane('bathTile',0,1.35,-3.188,5.35,2.7);
 b.box('stucco',0,3.64,0,5.6,.20,6.8);b.box('concrete',0,3.86,-3.29,5.6,.32,.2);
 for(const side of[-1,1]){b.box('stucco',side*1.78,1.6,3.30,2.04,3.2,.20);b.solid(side*1.78,3.30,2.04,.20);b.box('metal',side*.755,1.25,3.4,.055,2.5,.065);}
 b.box('stucco',0,3.21,3.3,5.6,.8,.22);b.box('metal',0,2.52,3.40,1.56,.07,.065);
 b.box('bathGrout',0,.006,0,5.35,.01,6.55);
 for(let x=-2.55;x<2.7;x+=.30)for(let z=-3.13;z<3.2;z+=.30)b.box('bathTile',x,.018,z,.292,.018,.292,0,.90+.05*Math.sin(x*13+z*6));
 b.walk(0,0,5.35,6.55,.027);
 for(let h=.30;h<2.8;h+=.30)b.box('bathGrout',0,h,-3.177,5.36,.012,.01);
 for(let x=-2.4;x<2.7;x+=.30)b.box('bathGrout',x,1.35,-3.177,.012,2.7,.01);
 b.box('metal',0,3.10,3.45,4.86,.78,.10);
 b.plane('bathSign',0,3.10,3.52,4.8,.72);
 b.plane('bathGuide',1.75,1.95,-3.165,1.08,.42);
 // Bench, hooks, folded towels, shower tray and a real open approach to valve.
 b.box('metal',-1.78,.25,-.2,.88,.04,2.25);for(const z of[-1.2,.78])for(const x of[-2.1,-1.47])b.rod('metal',[x,.03,z],[x,.46,z],.023);
 b.box('bark',-1.78,.48,-.2,.9,.08,2.3);for(let i=0;i<3;i++)b.box('white',-1.8,.55+i*.048,-.85,.46,.042,.55,0,.90-i*.03);
 b.solid(-1.78,-.2,.90,2.30);
 for(let z=-1.8;z<2.5;z+=1.1){b.rod('metal',[-2.57,1.75,z],[-2.44,1.75,z],.017);b.rod('metal',[-2.44,1.75,z],[-2.44,1.83,z],.017);}
 b.box('white',0,.049,-2.38,1.30,.04,1.48);b.walk(0,-2.38,1.3,1.48,.069);
 b.rod('metal',[0,1.03,-3.12],[0,2.30,-3.12],.025);b.rod('metal',[0,2.30,-3.12],[0,2.36,-2.40],.025);
 b.cylinder('metal',0,2.35,-2.40,.12,.14,.05,16);b.box('dark',0,.074,-2.39,.15,.008,.15);
 for(let i=0;i<5;i++)b.box('metal',0,.08,-2.445+i*.027,.14,.008,.009);
 b.box('metal',0,1.06,-3.10,.38,.12,.08);b.cylinder('red',.13,1.06,-3.037,.045,.045,.045,12,Math.PI/2);b.cylinder('blue',-.13,1.06,-3.037,.045,.045,.045,12,Math.PI/2);
 b.plane('bathControl',0,1.51,-3.165,.65,.24);
 b.box('metal',.61,1.25,-3.03,.25,.03,.2);b.box('white',.61,1.284,-3.02,.11,.037,.07);
 b.box('white',0,3.49,-.5,1.9,.07,.20);b.box('lamp',0,3.44,-.5,1.6,.035,.14);
 b.box('metal',2.61,2.86,-1.93,.12,.45,.45);for(let i=0;i<6;i++)b.box('dark',2.54,2.70+i*.057,-1.93,.006,.022,.36);
 b.pop();const object=b.finish('Fixed street bath / Level 27 entrance');
 const jets=new T.Group();jets.name='Functional shower / hottest preset';jets.position.set(center.x,Y,center.z);jets.rotation.y=angle;const jetMaterial=new T.MeshBasicMaterial({color:0xc6dfd7,transparent:true,opacity:.20,depthWrite:false});
 for(let i=0;i<17;i++){const a=i*2.399,r=.02+Math.sqrt(i/17)*.075;const jet=new T.Mesh(new T.CylinderGeometry(.003,.006,2.24,3),jetMaterial);jet.position.set(Math.cos(a)*r,1.20,-2.4+Math.sin(a)*r);jets.add(jet);}jets.visible=false;object.add(jets);
 return{object,colliders:b.colliders,walks:b.walks,waypoint:BATH_WAYPOINT,update(time,preset){jets.visible=preset>0;jetMaterial.opacity=.16+Math.sin(time*12)*.055;}};
}
