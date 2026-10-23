import {infillPlan} from './urban-infill-return.js';
import {exitPoint} from './exit-route.js?v=60';
import {urbanHash,urbanRandom} from './urban-batch.js?v=60';
import {canalBlock,CANAL_HERO} from './canal128-layout.js?v=128';
import {soho135Filter,spire135Filter} from './soho135-layout.js?v=135v';
import {retail138Mark} from './retail138-layout.js?v=138a'; // V138 walk-in stores
import {brick144Filter} from './brick144-layout.js?v=144a'; // V144 A1 capital brick apartment slab
import {maltose145Filter,maltose145Filter2} from './maltose145-layout.js?v=145b'; // V145 Maltose Market schoolyard
export const CITY_BLOCK=112,CITY_ROAD_HALF=7.5,CITY_SIDEWALK=4.5;
export const CITY_ORIGIN=exitPoint(382),CITY_ANGLE=Math.atan2(CITY_ORIGIN.tx,CITY_ORIGIN.tz);
const ca=Math.cos(CITY_ANGLE),sa=Math.sin(CITY_ANGLE);
export function cityToWorld(x,z,out={}){out.x=CITY_ORIGIN.x+ca*x+sa*z;out.z=CITY_ORIGIN.z-sa*x+ca*z;return out;}
export function worldToCity(x,z,out={}){const dx=x-CITY_ORIGIN.x,dz=z-CITY_ORIGIN.z;out.x=ca*dx-sa*dz;out.z=sa*dx+ca*dz;return out;}
export function cityDistrict(x,z){if(z<155&&Math.abs(x)<240)return 'commercial';const noise=urbanHash(Math.floor(x/336),Math.floor(z/336),119)/4294967296;return z<350?'mixed':noise<.12?'civic':noise<.23?'warehouse':'core';}
export function cityBlockPlan(ix,iz,types){
 const seed=urbanHash(ix,iz,0x115200),r=urbanRandom(seed),x=ix*CITY_BLOCK,z=iz*CITY_BLOCK,district=cityDistrict(x+56,z+56),result={ix,iz,seed,x,z,district,buildings:[],reserved:false,streetwall:true};
 // V122-L11: block 1,2 is the authored Nick's Gaslight block (block122-scene.js); 2,0..2 give their west frontage to it.
 if(ix===1&&iz===2){result.reserved=true;result.authored=true;return result;}
 if((ix===-1||ix===0)&&iz>=-3&&iz<4){result.reserved=true;result.authored=iz>=0;result.buildings=infillPlan(ix,iz);return retail138Mark(result);}
 const low=['strip_mall','two_story_shops','clinic','bakery','travel_agency','photo_studio','corner_market','laundromat','bank_branch','auto_shop','steel_prefab','research_lab'],high=['brutalist_slab','precast_tower','international_tower','international_slab','black_glass_setback','postmodern_crown','terraced_office','parking_garage','office_podium','stepped_hotel','art_deco_tower','brick_walkup'];
 let ordinal=0;function add(a,c,front,side,depth){const width=c-a,m=(a+c)/2,k=ordinal++,id=urbanHash(ix*17+k,iz,912),u=urbanRandom(id),isLow=district==='commercial'||district==='warehouse'||district==='mixed'&&u()<.52,walkup=!isLow&&u()<.23,type=walkup?'brick_walkup':(isLow?low:high)[id%(isLow?low.length:high.length)],floors=walkup?4+id%3:isLow?1+Number(id%3===0):8+id%23;let px,pz,ry;if(side===0){px=m;pz=front+depth/2;ry=Math.PI;}if(side===1){px=m;pz=front-depth/2;ry=0;}if(side===2){px=front+depth/2;pz=m;ry=-Math.PI/2;}if(side===3){px=front-depth/2;pz=m;ry=Math.PI/2;}result.buildings.push({type,x:x+px,z:z+pz,ry,w:width-.035,d:depth,floors,seed:id,lot:district,streetwall:true});}
 // Front/back rows have a real six-metre service-alley portal, otherwise party walls touch.
 for(const side of[0,1])for(const[a,c]of[[12,53],[59,100]]){if(ix===0&&iz===4&&side===0&&a===12){add(33,53,12,0,24);continue;}const split=a+(c-a)*(.43+r()*.14);add(a,split,side?100:12,side,24);add(split,c,side?100:12,side,24);}
 for(const side of[2,3]){const split=54+r()*4;add(36,split,side===2?12:100,side,22);add(split,76,side===2?12:100,side,22);}
 if(ix===2&&iz>=0&&iz<=2)result.buildings=result.buildings.filter(q=>q.ry!==-Math.PI/2);
 // V123-L11: image-48 re-solve. Block 1,1 hosts the authored hotel/mid-rises/brick row (keep only its NW shop and the hidden east laundromat);
 // block 2,2 gives its NW corner to the red-brick loft; block 2,0 gives its west half to the yellow tower and the Gothic hall.
 if(ix===1&&iz===1)result.buildings=result.buildings.filter(q=>(q.ry===Math.PI&&q.x<x+40)||(q.ry===Math.PI/2&&q.z>z+60));
 if(ix===2&&iz===2)result.buildings=result.buildings.filter(q=>!(q.ry===Math.PI&&q.x<x+56));
 if(ix===2&&iz===0)result.buildings=result.buildings.filter(q=>q.x>=x+56||q.ry===Math.PI/2);
 // Down the avenue the photo's skyline stays low: cap (not remove) the west row of block 2,1 and the whole 2,-1..-4 run.
 if(ix===2&&iz===1)for(const q of result.buildings)if(q.ry===0&&q.x<x+56)q.floors=Math.min(q.floors,1);
 if(ix===2&&iz<=-1&&iz>=-4)for(const q of result.buildings)q.floors=Math.min(q.floors,q.type==='brick_walkup'?6:7);
 // V125-L11 weather: the photo's low sun comes from behind-left of the guideway camera and the lot/hotel base stay sunlit,
 // so block 1,3 (directly behind the camera) stays low-rise; its towers threw their shadows over the whole lot.
 if(ix===1&&iz===3)for(const q of result.buildings)q.floors=Math.min(q.floors,3);
 // V128-L11 canal: open canal blocks lose their mid-block side lots (the channel runs there), the south row is 22 m deep
 // (12..34) to leave the south promenade; the photo reach (1,5)+(2,5) is authored (canal128.js), (3,5) stays low,
 // (4,5) gives two lots to the photo's far towers.
 const cn=canalBlock(ix,iz);if(cn){result.canal=cn;result.buildings=result.buildings.filter(q=>q.ry===0||q.ry===Math.PI);for(const q of result.buildings){if(q.ry===Math.PI){q.d=22;q.z=z+23;}else if(q.ry===0){q.d=20;q.z=z+90;}}if(cn.hero)result.buildings=[];}
 if(iz===CANAL_HERO.row&&ix===3)for(const q of result.buildings)q.floors=Math.min(q.floors,q.ry===Math.PI?4:2);
 if(iz===CANAL_HERO.row&&ix===3){result.canalExtra=true;result.buildings=result.buildings.filter(q=>!(q.ry===0&&q.x>x+60)&&!(q.ry===Math.PI&&q.x<x+56));}
 if(iz===CANAL_HERO.row&&(ix===4||ix===5))for(const q of result.buildings)q.floors=Math.min(q.floors,Math.abs(q.ry)===Math.PI/2?3:ix===4?4:6);   // V129: beyond the far bridge the photo stays low
 if((ix===-2||ix===-3)&&(iz===0||iz===1))soho135Filter(result);   // V135-capital ③ SoHo street frontage (soho135-layout.js)
 if(ix===-2&&iz===2)spire135Filter(result);   // ③-3b focal spire tower (soho135-spire.js)
 if(ix===-2&&iz===-1)brick144Filter(result);   // V144 A1 brick apartment slab + A2 road works (brick144.js)
 if(ix===1&&iz===-1)maltose145Filter(result);   // V145 Maltose Market schoolyard (maltose145.js)
 if(iz===-2&&(ix===1||ix===2))maltose145Filter2(result);   // V145 M2 the photo's near buildings (maltose145-bldg.js)
 return retail138Mark(result);   // V138 walk-in stores
}
export function cityWaypoint(name){const edge=exitPoint(282),p=name==='city-core'?cityToWorld(112,478):name==='city-plaza'?cityToWorld(224,702):{x:edge.x+edge.nx*15,z:edge.z+edge.nz*15};return{...p,label:name==='city-core'?'Level 11 · 金融街峡谷':name==='city-plaza'?'Level 11 · 公共广场':'Level 11 · 商业边缘区',yaw:name==='city-plaza'?CITY_ANGLE-Math.PI/2:name==='city-edge'?Math.atan2(-edge.nx,-edge.nz):Math.atan2(-CITY_ORIGIN.tx,-CITY_ORIGIN.tz)};}
