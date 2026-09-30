import * as T from './vendor/three.module.min.js';
import {URBAN_TILE_SIZE} from './urban-materials.js?v=60';
import {UrbanBatch} from './urban-batch.js?v=60';
import {clinicToWorld,CLINIC_ANGLE} from './reference-scenes.js?v=60';
import {EXIT_CITY_Y} from './exit-route.js?v=60';
import {bathTextures} from './bath-textures.js?v=60';
const center=clinicToWorld(91.4,40),angle=CLINIC_ANGLE-Math.PI/2,Y=EXIT_CITY_Y+.15;
export const BATH_ADDRESS={x:center.x,z:center.z,angle};
export function bathLocal(wx,wz){const c=Math.cos(angle),s=Math.sin(angle),x=wx-center.x,z=wz-center.z;return{x:c*x-s*z,z:s*x+c*z};}
export function nearBathEntrance(wx,wz){const p=bathLocal(wx,wz);return Math.abs(p.x-1.23)<.83&&p.z< -1.65&&p.z> -2.87;}
export function underShower(){return false;}
export function nearShower(){return false;}
export function bathPoint(x,z){const c=Math.cos(angle),s=Math.sin(angle);return{x:center.x+c*x+s*z,z:center.z-s*x+c*z};}
export const BATH_WAYPOINT={...bathPoint(-1.40,6.15),yaw:angle,pitch:.06,label:'Level 27 入口 · 巷内热水浴室'};
function label(lines,bg='#d5d6c4',fg='#244943'){const c=document.createElement('canvas');c.width=768;c.height=256;const g=c.getContext('2d');g.fillStyle=bg;g.fillRect(0,0,768,256);g.strokeStyle=fg;g.lineWidth=5;g.strokeRect(13,13,742,230);g.textAlign='center';g.fillStyle=fg;for(let i=0;i<lines.length;i++){g.font=(i?'28':'bold 70')+'px sans-serif';g.fillText(lines[i],384,105+i*56,706);}const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return new T.MeshStandardMaterial({map:t,roughness:.6,emissive:0xb5c1a0,emissiveMap:t,emissiveIntensity:.12,vertexColors:true});}
export function createSpringEntrance(mats){
 URBAN_TILE_SIZE.bathTile=1.25;const tex=bathTextures();mats.bathSign=label(['BAÑOS · SHOWERS','AGUA CALIENTE  /  24 HORAS']);mats.bathDoor=label(['ABIERTO','RECEPCIÓN  •  ENTRADA']);
 mats.bathTile=new T.MeshStandardMaterial({name:'Bath alley tile',map:tex['ceramic-tile'],color:0xb1beb6,roughness:.65,vertexColors:true});mats.bathGlass=new T.MeshStandardMaterial({color:0xb8d6d1,roughness:.21,metalness:.30,transparent:true,opacity:.30,vertexColors:true});
 const b=new UrbanBatch(mats);b.push(center.x,Y,center.z,angle);
 // The bath is around a genuine L-shaped service alley, invisible from the street.
 // Stay in the existing infill parcel, preserving the protected neighboring landmarks.
 b.box('concrete',0,-.075,0,5.6,.15,6.8);b.walk(0,0,5.6,6.8,0);
 for(const x of[-2.70,2.70]){b.box('stucco',x,3.30,0,.20,6.60,6.80);b.solid(x,0,.20,6.8);b.box('bathTile',x-Math.sign(x)*.11,.47,0,.035,.94,6.6);}
 b.box('stucco',0,3.3,-3.30,5.6,6.6,.20);b.solid(0,-3.30,5.6,.20);
 // A complete narrow street building blocks the direct view: enter on its left,
 // walk 4.9 metres down the alley, turn right, then reach the rear glass door.
 b.box('stucco',1.38,3.3,1.14,2.46,6.60,4.52);b.solid(1.38,1.14,2.46,4.52);
 b.box('brickRed',1.38,.48,3.42,2.48,.96,.06);b.box('metal',1.38,1.63,3.43,1.65,1.30,.045);
 for(let y=1.04;y<2.24;y+=.085)b.box('dark',1.38,y,3.463,1.57,.012,.011);
 for(const y of[3.4,5.13])for(const x of[.85,1.9]){b.box('white',x,y,3.46,.69,1.15,.06);b.box('dark',x,y,3.50,.53,.99,.02);b.box('metal',x,y,3.523,.045,1.04,.035);}
 b.box('metal',-.06,2.55,3.42,.14,.82,.64);b.plane('bathSign',-.145,2.55,3.42,.72,.42,-Math.PI/2);
 // Rear entrance is reached only after turning the corner.
 for(const side of[-1,1]){b.box('bathTile',1.23+side*1.02,1.44,-2.94,.68,2.88,.18);b.solid(1.23+side*1.02,-2.94,.68,.18);b.box('metal',1.23+side*.67,1.18,-2.82,.048,2.36,.07);}
 b.solid(1.23,-2.92,1.36,.08);b.box('stucco',1.23,2.73,-2.94,2.72,.58,.18);b.box('metal',1.23,2.39,-2.82,1.39,.06,.08);
 b.box('metal',1.23,2.66,-2.75,2.17,.39,.09);b.plane('bathSign',1.23,2.66,-2.69,2.08,.32);
 b.box('dark',1.23,1.19,-3.18,1.32,2.36,.035);b.box('bark',1.56,.51,-3.12,.60,1.02,.05);b.box('white',1.56,1.04,-3.10,.64,.055,.06);b.box('lamp',1.23,2.24,-3.13,.52,.045,.05);
 b.plane('bathGlass',1.23,1.20,-2.795,1.30,2.34);b.rod('metal',[1.74,.91,-2.73],[1.74,1.38,-2.73],.018);b.plane('bathDoor',1.23,1.51,-2.77,.58,.20);
 b.box('lamp',1.23,2.42,-2.73,.76,.028,.10);b.box('metal',1.23,2.47,-2.79,.93,.055,.25);
 // Pipes, wall-fixed lamps, service meters and a continuous open gutter.
 for(const x of[-2.44,2.44])b.rod('metal',[x,.05,2.9],[x,6.3,2.9],.037);
 b.box('dark',-2.29,.004,.4,.13,.008,5.7);for(let z=-2.42;z<3.17;z+=.12)b.box('metal',-2.29,.010,z,.125,.010,.015);
 b.box('metal',-2.55,1.3,.82,.11,.46,.29);b.box('dark',-2.484,1.36,.82,.012,.12,.18);
 for(const z of[1.85,-1.7]){b.box('metal',-2.565,2.63,z,.11,.28,.21);b.box('lamp',-2.49,2.63,z,.055,.16,.12);b.box('metal',-2.49,2.79,z,.25,.04,.30);}
 b.box('metal',.06,2.50,.25,.11,.55,.82);b.rod('metal',[-.05,2.20,.58],[-.05,.09,.58],.018);
 b.pop();const object=b.finish('L-shaped service alley / concealed rear bathhouse entrance');return{object,colliders:b.colliders,walks:b.walks,waypoint:BATH_WAYPOINT,update(){}};
}
