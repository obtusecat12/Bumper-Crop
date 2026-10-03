import {clinicToWorld,CLINIC_ANGLE} from './reference-scenes.js?v=60';
import {EXIT_CITY_Y} from './exit-route.js?v=60';
export const TIKI_FACADE=Object.freeze({parcelSeed:54401,width:24.8,height:4.16,doorX:4.15,doorWidth:1.66,doorHeight:2.40,angle:CLINIC_ANGLE-Math.PI/2,origin:clinicToWorld(88,24.5),y:EXIT_CITY_Y+.15});
export function tikiPoint(x,z){const p=TIKI_FACADE,c=Math.cos(p.angle),s=Math.sin(p.angle);return{x:p.origin.x+c*x+s*z,z:p.origin.z-s*x+c*z};}
export function tikiLocal(wx,wz){const p=TIKI_FACADE,c=Math.cos(p.angle),s=Math.sin(p.angle),x=wx-p.origin.x,z=wz-p.origin.z;return{x:c*x-s*z,z:s*x+c*z};}
export const TIKI_WAYPOINT={...tikiPoint(4.15,3.1),yaw:TIKI_FACADE.angle,pitch:.05,label:'Level 11 · Lantern Reef 餐厅酒吧'};
export function nearTikiDoor(wx,wz){const p=tikiLocal(wx,wz);return Math.abs(p.x-TIKI_FACADE.doorX)<1.02&&p.z>.38&&p.z<1.83;}
export const TIKI_ROOM={width:13.6,depth:13.2,ceiling:3.36,entryZ:6.12};
export const TIKI_ARRIVAL={x:0,z:5.45,yaw:0,pitch:-.02};
export function atTikiExit(x,z){return Math.abs(x)<1.02&&z>5.3;}
export const TIKI_SOLIDS=[
 {kind:'obb',x:4.85,z:-.45,w:2.85,d:9.15,ry:0},
 ...[-3.55,-.15,3.25].flatMap(z=>[{kind:'obb',x:-4.95,z,w:2.72,d:1.28,ry:0},{kind:'obb',x:-4.95,z:z-.98,w:2.68,d:.63,ry:0},{kind:'obb',x:-4.95,z:z+.98,w:2.68,d:.63,ry:0}]),
 ...[-3.7,-2.1,-.5,1.1,2.7].map(z=>({kind:'circle',x:2.78,z,r:.34})),
 {kind:'obb',x:-.45,z:-5.62,w:2.8,d:1.1,ry:0}
];
export function resolveTiki(old,next){let x=Math.max(-6.47,Math.min(6.47,next.x)),z=Math.max(-6.2,Math.min(6.12,next.z));const blocked=(x,z)=>TIKI_SOLIDS.some(q=>q.kind==='circle'?Math.hypot(x-q.x,z-q.z)<q.r+.24:Math.abs(x-q.x)<q.w/2+.24&&Math.abs(z-q.z)<q.d/2+.24);if(blocked(x,z)){if(!blocked(old.x,z))x=old.x;else if(!blocked(x,old.z))z=old.z;else{x=old.x;z=old.z;}}return{x,z};}
