import * as T from './vendor/three.module.min.js';
import {UrbanBatch} from './urban-batch.js?v=59';
import {clinicToWorld,CLINIC_ANGLE} from './reference-scenes.js?v=59';
import {EXIT_CITY_Y} from './exit-route.js?v=59';
import {bathTextures} from './bath-textures.js?v=59';
const center=clinicToWorld(91.4,40),angle=CLINIC_ANGLE-Math.PI/2,Y=EXIT_CITY_Y+.15;
export const BATH_ADDRESS={x:center.x,z:center.z,angle};
export function bathLocal(wx,wz){const c=Math.cos(angle),s=Math.sin(angle),x=wx-center.x,z=wz-center.z;return{x:c*x-s*z,z:s*x+c*z};}
export function nearBathEntrance(wx,wz){const p=bathLocal(wx,wz);return Math.abs(p.x)<1.04&&p.z<1.0&&p.z>-.55;}
export function underShower(){return false;}
export function nearShower(){return false;}
export function bathPoint(x,z){const c=Math.cos(angle),s=Math.sin(angle);return{x:center.x+c*x+s*z,z:center.z-s*x+c*z};}
export const BATH_WAYPOINT={...bathPoint(0,6.15),yaw:angle,pitch:.06,label:'Level 27 入口 · 巷内热水浴室'};
function label(lines,bg='#d5d6c4',fg='#244943'){const c=document.createElement('canvas');c.width=768;c.height=256;const g=c.getContext('2d');g.fillStyle=bg;g.fillRect(0,0,768,256);g.strokeStyle=fg;g.lineWidth=5;g.strokeRect(13,13,742,230);g.textAlign='center';g.fillStyle=fg;for(let i=0;i<lines.length;i++){g.font=(i?'28':'bold 70')+'px sans-serif';g.fillText(lines[i],384,105+i*56,706);}const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return new T.MeshStandardMaterial({map:t,roughness:.6,emissive:0xb5c1a0,emissiveMap:t,emissiveIntensity:.12,vertexColors:true});}
export function createSpringEntrance(mats){
 const tex=bathTextures();mats.bathSign=label(['BAÑOS · SHOWERS','AGUA CALIENTE  /  24 HORAS']);mats.bathDoor=label(['ABIERTO','RECEPCIÓN  •  ENTRADA']);
 mats.bathTile=new T.MeshStandardMaterial({name:'Bath alley tile',map:tex['ceramic-tile'],color:0xb1beb6,roughness:.65,vertexColors:true});mats.bathGlass=new T.MeshStandardMaterial({color:0xb8d6d1,roughness:.21,metalness:.30,transparent:true,opacity:.30,vertexColors:true});
 const b=new UrbanBatch(mats);b.push(center.x,Y,center.z,angle);
 // Existing 5.6 × 6.8m parcel: the setback creates a service alley. The expanded
 // bathhouse is an indoor scene reached through this real glazed threshold.
 b.box('concrete',0,-.075,0,5.6,.15,6.8);b.walk(0,0,5.6,6.8,0);
 for(const x of[-2.70,2.70]){b.box('stucco',x,1.95,0,.20,3.90,6.80);b.solid(x,0,.2,6.8);b.box('bathTile',x-Math.sign(x)*.11,.48,.9,.035,.96,4.8);}
 b.box('stucco',0,1.85,-3.3,5.6,3.7,.20);b.solid(0,-3.3,5.6,.20);b.box('stucco',0,3.63,-1.9,5.6,.20,3.0);
 for(const side of[-1,1]){b.box('bathTile',side*1.75,1.45,-.65,2.1,2.90,.20);b.solid(side*1.75,-.65,2.1,.20);b.box('metal',side*.70,1.19,-.52,.055,2.38,.065);}
 b.solid(0,-.66,1.4,.08);b.box('stucco',0,3.17,-.65,5.6,.52,.20);b.box('metal',0,2.41,-.52,1.46,.05,.065);
 b.box('metal',0,2.94,-.43,4.84,.68,.13);b.plane('bathSign',0,2.94,-.354,4.70,.56);
 b.plane('bathGlass',0,1.20,-.50,1.36,2.35);b.rod('metal',[.53,.91,-.445],[.53,1.39,-.445],.018);b.plane('bathDoor',0,1.53,-.486,.62,.205);
 b.box('bark',1.15,.46,-2.15,1.85,.92,.65);b.box('white',1.15,.94,-2.15,1.94,.055,.74);
 b.box('lamp',0,3.45,-1.70,1.6,.04,.16);
 // A quiet utility alley: drain, pipe, meter, caged lamp and service shutter.
 for(const x of[-2.44,2.44])b.rod('metal',[x,.05,2.9],[x,3.70,2.9],.035);
 b.box('dark',-1.90,.004,1.6,.17,.008,3.2);for(let z=.06;z<3.16;z+=.08)b.box('metal',-1.90,.012,z,.165,.014,.012);
 b.box('metal',2.575,1.3,1.82,.10,.46,.28);b.box('dark',2.512,1.36,1.82,.008,.12,.18);
 b.box('metal',-2.565,1.1,1.0,.06,2.1,1.12);for(let y=.15;y<2.14;y+=.115)b.box('dark',-2.526,y,1.0,.01,.017,1.07);
 b.box('lamp',2.46,2.55,.15,.09,.18,.11);b.box('metal',2.52,2.71,.15,.23,.035,.22);
 b.pop();const object=b.finish('Setback alley bathhouse / glazed entrance');return{object,colliders:b.colliders,walks:b.walks,waypoint:BATH_WAYPOINT,update(){}};
}
