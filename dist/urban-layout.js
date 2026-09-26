import {exitPoint} from './exit-route.js?v=49';
import {urbanHash,urbanRandom} from './urban-batch.js?v=49';
export const CITY_BLOCK=112,CITY_ROAD_HALF=11,CITY_SIDEWALK=6;
export const CITY_ORIGIN=exitPoint(420),CITY_ANGLE=Math.atan2(CITY_ORIGIN.tx,CITY_ORIGIN.tz);
const ca=Math.cos(CITY_ANGLE),sa=Math.sin(CITY_ANGLE);
export function cityToWorld(x,z,out={}){out.x=CITY_ORIGIN.x+ca*x+sa*z;out.z=CITY_ORIGIN.z-sa*x+ca*z;return out;}
export function worldToCity(x,z,out={}){const dx=x-CITY_ORIGIN.x,dz=z-CITY_ORIGIN.z;out.x=ca*dx-sa*dz;out.z=sa*dx+ca*dz;return out;}
export function cityDistrict(x,z){const entry=1-Math.min(1,Math.max(0,z)/350);if(z<155&&Math.abs(x)<240)return 'commercial';const noise=urbanHash(Math.floor(x/448),Math.floor(z/448),119)/4294967296;return entry>.42?'mixed':noise<.15?'civic':noise<.30?'warehouse':'core';}
export function cityBlockPlan(ix,iz,types){
 const seed=urbanHash(ix,iz,0x114900),r=urbanRandom(seed),x=ix*CITY_BLOCK,z=iz*CITY_BLOCK,district=cityDistrict(x+56,z+56),result={ix,iz,seed,x,z,district,buildings:[],reserved:false};
 // The authored approach occupies these two parcels. It survives the threshold
 // without replacing objects in front of the player.
 if((ix===-1||ix===0)&&iz>=-3&&iz<0){result.reserved=true;return result;}
 const low=types.slice(0,18),high=types.slice(18),core=district==='core'||district==='civic';
 const count=core?4:district==='warehouse'?2:4;
 for(let i=0;i<count;i++){
  const col=i%2,row=Math.floor(i/2),outward=col?1:-1,px=x+(col?76:36),pz=z+(row?77:35);
  const list=core?high:district==='mixed'&&r()>.38?high:low;
  const type=list[(urbanHash(ix*4+i,iz,2903)%list.length)],floors=core?8+Math.floor(r()*23):list===high?8+Math.floor(r()*7):1+Number(r()>.67);
  result.buildings.push({type,x:px,z:pz,ry:outward<0?-Math.PI/2:Math.PI/2,w:29+r()*6,d:27+r()*7,floors,seed:urbanHash(ix,iz,i+73),lot:district});
 }
 if(iz===4&&(ix===0||ix===-1)){
  const names=ix===0?['black_glass_setback','international_tower','office_podium','terraced_office']:['brutalist_slab','parking_garage','precast_tower','postmodern_crown'];
  result.district='core';result.buildings.forEach((b,i)=>{b.type=names[i];b.floors=[23,12,18,27][i];});
 }
 if(ix===1&&iz===6){result.district='civic';result.buildings[0].type='civic_steps';result.buildings[0].floors=10;result.buildings[1].type='civic_hall';}
 return result;
}
export function cityWaypoint(name){const p=name==='city-core'?cityToWorld(0,450):name==='city-plaza'?cityToWorld(112,706):cityToWorld(0,30);return{...p,label:name==='city-core'?'Level 11 · 金融街峡谷':name==='city-plaza'?'Level 11 · 公共广场':'Level 11 · 商业边缘区',yaw:name==='city-plaza'?CITY_ANGLE-Math.PI/2:Math.atan2(-CITY_ORIGIN.tx,-CITY_ORIGIN.tz)};}
