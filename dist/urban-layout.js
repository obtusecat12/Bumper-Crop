import {exitPoint} from './exit-route.js?v=56';
import {urbanHash,urbanRandom} from './urban-batch.js?v=56';
export const CITY_BLOCK=112,CITY_ROAD_HALF=7.5,CITY_SIDEWALK=4.5;
export const CITY_ORIGIN=exitPoint(382),CITY_ANGLE=Math.atan2(CITY_ORIGIN.tx,CITY_ORIGIN.tz);
const ca=Math.cos(CITY_ANGLE),sa=Math.sin(CITY_ANGLE);
export function cityToWorld(x,z,out={}){out.x=CITY_ORIGIN.x+ca*x+sa*z;out.z=CITY_ORIGIN.z-sa*x+ca*z;return out;}
export function worldToCity(x,z,out={}){const dx=x-CITY_ORIGIN.x,dz=z-CITY_ORIGIN.z;out.x=ca*dx-sa*dz;out.z=sa*dx+ca*dz;return out;}
export function cityDistrict(x,z){if(z<155&&Math.abs(x)<240)return 'commercial';const noise=urbanHash(Math.floor(x/336),Math.floor(z/336),119)/4294967296;return z<350?'mixed':noise<.12?'civic':noise<.23?'warehouse':'core';}
export function cityBlockPlan(ix,iz,types){
 const seed=urbanHash(ix,iz,0x115200),r=urbanRandom(seed),x=ix*CITY_BLOCK,z=iz*CITY_BLOCK,district=cityDistrict(x+56,z+56),result={ix,iz,seed,x,z,district,buildings:[],reserved:false,streetwall:true};
 if((ix===-1||ix===0)&&iz>=-3&&iz<4){result.reserved=true;result.authored=iz>=0;return result;}
 const low=['strip_mall','two_story_shops','clinic','bakery','travel_agency','photo_studio','corner_market','laundromat','bank_branch','auto_shop','steel_prefab','research_lab'],high=['brutalist_slab','precast_tower','international_tower','international_slab','black_glass_setback','postmodern_crown','terraced_office','parking_garage','office_podium','stepped_hotel','art_deco_tower','brick_walkup'];
 let ordinal=0;function add(a,c,front,side,depth){const width=c-a,m=(a+c)/2,k=ordinal++,id=urbanHash(ix*17+k,iz,912),u=urbanRandom(id),isLow=district==='commercial'||district==='warehouse'||district==='mixed'&&u()<.52,walkup=!isLow&&u()<.23,type=walkup?'brick_walkup':(isLow?low:high)[id%(isLow?low.length:high.length)],floors=walkup?4+id%3:isLow?1+Number(id%3===0):8+id%23;let px,pz,ry;if(side===0){px=m;pz=front+depth/2;ry=Math.PI;}if(side===1){px=m;pz=front-depth/2;ry=0;}if(side===2){px=front+depth/2;pz=m;ry=-Math.PI/2;}if(side===3){px=front-depth/2;pz=m;ry=Math.PI/2;}result.buildings.push({type,x:x+px,z:z+pz,ry,w:width-.035,d:depth,floors,seed:id,lot:district,streetwall:true});}
 // Front/back rows have a real six-metre service-alley portal, otherwise party walls touch.
 for(const side of[0,1])for(const[a,c]of[[12,53],[59,100]]){if(ix===0&&iz===4&&side===0&&a===12){add(33,53,12,0,24);continue;}const split=a+(c-a)*(.43+r()*.14);add(a,split,side?100:12,side,24);add(split,c,side?100:12,side,24);}
 for(const side of[2,3]){const split=54+r()*4;add(36,split,side===2?12:100,side,22);add(split,76,side===2?12:100,side,22);}
 return result;
}
export function cityWaypoint(name){const edge=exitPoint(282),p=name==='city-core'?cityToWorld(112,478):name==='city-plaza'?cityToWorld(224,702):{x:edge.x+edge.nx*15,z:edge.z+edge.nz*15};return{...p,label:name==='city-core'?'Level 11 · 金融街峡谷':name==='city-plaza'?'Level 11 · 公共广场':'Level 11 · 商业边缘区',yaw:name==='city-plaza'?CITY_ANGLE-Math.PI/2:name==='city-edge'?Math.atan2(-edge.nx,-edge.nz):Math.atan2(-CITY_ORIGIN.tx,-CITY_ORIGIN.tz)};}
