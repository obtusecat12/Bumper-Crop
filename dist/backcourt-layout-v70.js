import {CLINIC_ORIGIN,clinicToWorld} from './reference-scenes.js?v=60';
import {EXIT_CITY_Y,exitPoint} from './exit-route.js?v=60';
const route=exitPoint(282);
export const BACKCOURT_PLAN=Object.freeze({origin:CLINIC_ORIGIN,angle:Math.atan2(route.nx,route.nz),groundY:EXIT_CITY_Y+.02,wallZ:18.34,machine:[34.5,19.43],seats:[38,19.08],scale:[31.4,19.12],notice:[38,18.405],mat:[34.5,20.05],lamp:[34.5,2.58,18.46]});
export const VENDING_TRAY=Object.freeze({groundY:0,width:.46,depth:.25,centerZ:.04,floorY:.37,floorThickness:.024,slope:2.5*Math.PI/180,sideThickness:.035,sideHeight:.15,backHeight:.17,lipHeight:.014,lipThickness:.016,spawn:[0,.66,-.04],maxBodies:32,deliveryPusher:true,groundPatch:{size:[1.18,.012,.78],center:[0,.006,.62]}});
export function backcourtWorld(x,z){return clinicToWorld(x,z);}
export function backcourtWaypoint(){const eye=clinicToWorld(34.5,22.1),aim=clinicToWorld(34.5,19.43);return{...eye,label:'Level 11 · 瀑布售货机与候座',yaw:Math.atan2(eye.x-aim.x,eye.z-aim.z),pitch:.06};}
