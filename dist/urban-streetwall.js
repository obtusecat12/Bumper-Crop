import * as T from './vendor/three.module.min.js';
import {urbanRandom} from './urban-batch.js?v=60';
import {WINDOW_COUNT} from './urban-assets.js?v=60';
import {addRoofEquipment,addFireEscape,addRoofLetters} from './urban-buildings.js?v=60';
import {FacadeLayout} from './facade-layout.js?v=60';
import {adFor,adFace,AD_CATALOG} from './advertising-assets.js?v=60';
import {lightbox,bladeSign,buildingRoofAd,wallBanner} from './advertising-structures.js?v=60';
const PI=Math.PI;
function window(b,x,y,z,w,h,material='glass',tone=1){b.box('metal',x,y,z-.028,w+.08,h+.09,.12,0,.8);b.plane(material,x,y,z+.04,w,h,0,0,tone);b.box('metal',x,y,z+.065,.042,h,.07);b.box('concrete',x,y-h/2-.045,z+.08,w+.15,.075,.16);}
function canopy(b,x,y,z,w,style){const fabric=style%3===0?'blue':style%3===1?'green':'yellow';if(style%4===0){b.box('metal',x,y,z+.60,w,.07,1.2);b.plane('glassLight',x,y+.039,z+.60,w-.1,1.1,0,-PI/2);}else{const g=new T.PlaneGeometry(w,1.32),p=g.attributes.position;for(let i=0;i<p.count;i++){const t=(p.getY(i)+.66)/1.32;p.setXYZ(i,p.getX(i),-.31*t,t*1.32);}const ix=g.index;for(let i=0;i<ix.count;i+=3){const a=ix.getX(i+1);ix.setX(i+1,ix.getX(i+2));ix.setX(i+2,a);}g.computeVertexNormals();b.add(g,fabric,x,y,z);g.dispose();b.box(fabric,x,y-.395,z+1.32,w,.17,.035);for(const side of[-1,1])b.rod('metal',[x+side*w*.46,y-.64,z],[x+side*w*.46,y-.32,z+1.29],.026);}}
function shopBay(b,x,z,w,seed,style,layout){
 const h=2.75,y=1.76,index=(seed>>>0)%WINDOW_COUNT;
 b.box('metal',x,y,z-.09,w,h+.12,.17,0,.71);b.panel('shopWindow',index,x,y,z+.012,w-.12,h);
 for(const dx of[-w/2,0,w/2])b.box('metal',x+dx,y,z+.055,.055,h+.13,.11);
 for(const yy of[y-h/2,y+h/2])b.box('metal',x,yy,z+.06,w,.05,.13);
 b.box('concrete',x,.17,z+.10,w+.06,.34,.38);for(const dx of[-.11,.11])b.rod('metal',[x+dx,1.07,z+.13],[x+dx,1.43,z+.13],.017);
 layout?.reserve('shop-opening',x,1.76,w+.10,2.88,.025);
 const sw=Math.min(w-.28,3.12),sh=sw/6;lightbox(b,adFor(seed+21,'fascia'),x,3.70,z+.10,sw,sh);layout?.reserve('fascia',x,3.70,sw+.10,sh+.10,.018);
 // Canopy anchors are above the glazing transom and below the allocated fascia.
 if(style%3!==2){canopy(b,x,3.27,z+.17,w-.16,style);layout?.reserve('canopy-anchor',x,3.275,w-.10,.08,.025);}
}
function airConditioner(b,x,y,z){b.box('metal',x,y,z+.38,.82,.52,.58);for(let k=0;k<6;k++)b.box('dark',x-.31+k*.124,y,z+.682,.042,.35,.009);for(const dx of[-.28,.28]){b.rod('metal',[x+dx,y-.30,z],[x+dx,y-.30,z+.69],.026);b.rod('metal',[x+dx,y-.30,z+.60],[x+dx,y-.56,z],.022);}b.rod('white',[x+.37,y-.24,z+.37],[x+.37,y-.62,z+.06],.017);}
/** Full-footprint party-wall building. Openings and fixtures share one elevation plan. */
export function addStreetwallBuilding(b,spec){
 const{w,d,seed=1,lod=0}=spec,r=urbanRandom(seed),style=(seed>>>0)%36,low=spec.floors<4,n=Math.max(1,spec.floors|0),walkup=spec.type==='brick_walkup',parking=spec.type==='parking_garage',glassTower=/international|glass|postmodern|tower/.test(spec.type)&&!walkup,fh=walkup?3.05:low?3.5:3.42,ground=4.30,h=ground+Math.max(0,n-1)*fh,z=d/2;
 const front=new FacadeLayout(w,h),hero=!!spec.heroWall,hasEscape=!lod&&(walkup||(!low&&style%6===0)),rearBanner=n>=7&&!hasEscape&&style%4===0,arcade=!low&&(style%5===0||spec.type==='office_podium');
 const wall=walkup?(style%2?'brickRed':'brickOchre'):low?['stucco','travertine','brickOchre','cinder','sandstone','brickRed'][style%6]:['concrete','ribbed','travertine','sandstone','stucco'][style%5],trim=style%3?'concrete':'travertine';
 if(arcade){b.box(wall,0,(h+ground)/2,0,w,h-ground,d);b.box(wall,0,ground/2,-.85,w,ground,d-1.70);b.solid(0,-.83,w,d-1.66);b.box('sidewalk',0,.075,z-.76,w,.15,1.62);b.walk(0,z-.76,w,1.62,.15);}else{b.box(wall,0,h/2,0,w,h,d);b.solid(0,0,w,d);b.box(trim,0,.13,z,w,.26,.34);}b.box(trim,0,ground-.12,z+.08,w,.24,.26);
 front.reserve('floor-beam',0,ground-.12,w,.24,.02);
 const bays=Math.max(2,Math.round(w/(4+(style%4)*.48))),bay=w/bays;
 for(let i=0;i<bays;i++){const x=-w/2+bay*(i+.5);shopBay(b,x,z+.02-(arcade?1.7:0),bay-.24,seed*31+i*17,style+i,front);b.box(wall,x-bay/2+.1,1.98,z+.07,arcade?.42:.2,3.95,arcade?.55:.38);if(arcade)b.solid(x-bay/2+.1,z+.07,.42,.55);}
 b.box(wall,w/2-.1,1.98,z+.07,.2,3.95,.38);
 const upperWindows=[];
 if(hero){const ww=Math.min(w-1.7,(h-7)/3),hh=ww*3;wallBanner(b,AD_CATALOG[119],0,5.5+hh/2,z+.08,ww,hh);front.reserve('hero-wallscape',0,5.5+hh/2,ww+.6,hh+.5);}
 else if(parking){for(let f=1;f<n;f++){const y=ground+(f-.5)*fh;b.plane('glass',0,y,z+.03,w-.8,fh-.75);b.box(trim,0,ground+f*fh,z+.25,w,.44,.65);for(let i=0;i<=bays;i++)b.box(trim,-w/2+i*bay,y,z+.24,.32,fh,.57);for(let k=0;k<3;k++)b.box('concrete',0,y-fh*.24+k*.19,z+.28,w,.11,.20);front.reserve('parking-opening',0,y,w,fh-.4);}}
 else if(glassTower){if(n>1){b.plane('glass',0,(ground+h)/2,z+.04,w-.30,h-ground-.10);for(let i=0;i<=bays*2;i++)b.box(style%2?'metal':'travertine',-w/2+i*w/(bays*2),(ground+h)/2,z+.11,.085,h-ground,.22);for(let f=1;f<n;f++)b.box('metal',0,ground+f*fh,z+.12,w,.065,.20);front.reserve('curtain-wall',0,(ground+h)/2,w,h-ground);}}
 else for(let f=1;f<n;f++){const yy=ground+(f-.5)*fh,ww=Math.min(bay*.65,walkup?1.55:2.8),wh=walkup?2.04:fh*(style%4===0?.72:.61);for(let i=0;i<bays;i++){const x=-w/2+(i+.5)*bay;window(b,x,yy,z+.035,ww,wh,style%3?'glass':'glassLight',.88+(i%3)*.07);front.reserve('window',x,yy,ww+.16,wh+.18,.035);upperWindows.push({x,y:yy,w:ww,h:wh,f});}if(!low&&(style%4===0||/brutalist|precast/.test(spec.type))){for(let i=0;i<=bays;i++){const x=-w/2+i*bay;b.box('ribbed',x,yy,z+.26,.32,fh,.66);front.reserve('structural-rib',x,yy,.32,fh,.025);}b.box(trim,0,ground+f*fh,z+.23,w,.24,.58);front.reserve('floor-beam',0,ground+f*fh,w,.24,.025);}}
 // Side glazing belongs to its own plane; rear banners replace a solid wall panel.
 for(const side of[-1,1]){b.push(side*w/2,0,-.18,side*PI/2);for(let f=1;f<n;f++){const yy=ground+(f-.5)*fh;b.plane('glass',0,yy,.02,d-.9,fh*.60);for(let i=0;i<=Math.round(d/3.3);i++)b.box(wall,-d/2+i*d/Math.round(d/3.3),yy,.07,.48,fh,.22);}b.pop();}
 b.push(0,0,-d/2-.01,PI);
 if(!rearBanner)for(let f=1;f<n;f++){const yy=ground+(f-.5)*fh;b.plane('glassLight',0,yy,0,w-.9,fh*.53);for(let i=0;i<=bays;i++)b.box(wall,-w/2+i*bay,yy,.10,.65,fh,.23);}
 if(spec.retailBack){for(let i=0;i<bays;i++)shopBay(b,-w/2+(i+.5)*bay,.04,bay-.26,seed*43+i*29,style+i+2);}
 else{b.box('metal',w*.25,1.37,.04,2.3,2.7,.16);b.plane('shutter',w*.25,1.37,.13,2.2,2.6);}
 if(rearBanner){const bh=Math.min(33,h-7),bw=Math.min(w-1.4,bh/3);wallBanner(b,adFor(seed+715,'wallscape'),0,5+bw*1.5,.14,bw,bw*3);}
 if(hasEscape){b.push(-w*.25,ground-fh-.15,.78);addFireEscape(b,0,0,Math.min(6,n),fh,0);b.pop();}
 // Ghost graphics occupy the windowless ground-level service wall, clear of the door.
 if(!spec.retailBack&&style%4===2){const gw=Math.min(3.8,w*.35);adFace(b,adFor(seed+431,'ghost'),-w*.25,1.76,.015,gw,2.5);}
 b.pop();
 for(const side of[-1,1]){b.box(trim,0,h+.22,side*(d/2-.13),w,.44,.26);b.box(trim,side*(w/2-.13),h+.22,0,.26,.44,d);}b.box('asphalt',0,h+.02,0,w-.55,.06,d-.55);
 if(low&&style%3===0){b.box(wall,w*.1,h+.54,z-.14,w*.48,.62,.42);b.box(trim,w*.1,h+.88,z-.16,w*.5,.10,.47);}
 const crown=glassTower&&style%2===0;
 if(crown)for(let k=0;k<3;k++){const ww=w-2.4-k*1.8,dd=d-2-k*1.6,yy=h+.6+k*1.5;b.box('glass',0,yy,0,ww,1.6,dd);b.box(trim,0,yy+.84,0,ww+.12,.14,dd+.12);}
 const roofBoard=!lod&&style%5===1&&!hero&&!crown,plantTop=crown?h+4.44:h+.05;
 // Reserve the front 2.7 m for bulletin legs and their diagonal bracing.
 b.push(0,0,roofBoard?-Math.min(2,d*.15):0);addRoofEquipment(b,w*.72,d*.64,plantTop,r,lod);b.pop();
 if(!lod&&w>21&&!crown){b.push(-w*.20,0,-d*.24);addRoofEquipment(b,w*.35,d*.26,h+.05,urbanRandom(seed+47),1,.58);b.pop();}
 if(!lod){
  if(low||walkup)for(const q of upperWindows.filter(q=>q.f<5&&((Math.round(q.x/bay)+q.f+style)%2===0))){const place=front.find('air-conditioner',[[q.x,q.y-q.h/2-.49],[q.x+bay*.5,q.y]],.86,.74,.055);if(place)airConditioner(b,place.x,place.y+.08,z+.055);}
  b.rod('metal',[-w/2+.13,h+.1,z+.1],[-w/2+.13,.17,z+.1],.032);
  // Projecting signs have a dedicated corner strip above all canopy arms.
  const blade=front.find('blade-sign',[[-w/2+.63,5.30],[w/2-.63,5.30]],.31,1.8,.07);if(blade&&n>1&&!hero)bladeSign(b,adFor(seed+440,'blade'),blade.x,blade.y,z+.18,.60,1.8);
  if(roofBoard)buildingRoofAd(b,seed+929,w,d,h+.05);
  if(!low&&style%7===0&&!hero&&style%5!==1)addRoofLetters(b,style%2?'TOWER':'PARKING',0,h+.75,z-.4,w*.75,1.1,0);
 }
 const report={seed,w,d,height:h,hero,front:front.regions};(b.facades||(b.facades=[])).push(report);
 return{height:h+5,type:spec.type,style,facade:report};
}
