import * as T from './vendor/three.module.min.js';
import {urbanRandom} from './urban-batch.js?v=52';
import {signIndex,signAspect,storefrontSign,WINDOW_COUNT} from './urban-assets.js?v=52';
import {addRoofEquipment,addFireEscape,addRoofLetters} from './urban-buildings.js?v=52';
const PI=Math.PI;
function sign(b,seed,kind,x,y,z,maxW,maxH,ry=0,explicit){const id=explicit??signIndex(seed,kind),aspect=signAspect(id),w=Math.min(maxW,maxH*aspect),h=w/aspect;b.box('metal',x,y,z,w+.075,h+.075,.13,ry,.83);b.panel('citySign',id,x+Math.sin(ry)*.075,y,z+Math.cos(ry)*.075,w,h,ry);return{w,h};}
function window(b,x,y,z,w,h,material='glass',tone=1){b.box('metal',x,y,z-.028,w+.08,h+.09,.12,0,.8);b.plane(material,x,y,z+.04,w,h,0,0,tone);b.box('metal',x,y,z+.065,.042,h,.07);b.box('concrete',x,y-h/2-.045,z+.08,w+.15,.075,.16);}
function canopy(b,x,y,z,w,style){const blue=style%3===0?'blue':style%3===1?'green':'yellow';if(style%4===0){b.box('metal',x,y,z+.6,w,.08,1.25);b.plane('glassLight',x,y+.047,z+.6,w-.1,1.15,0,-PI/2);}else{const g=new T.PlaneGeometry(w,1.45),p=g.attributes.position;for(let i=0;i<p.count;i++){const v=p.getY(i)+.725;p.setXYZ(i,p.getX(i),-.34*(v/1.45),v);}const ix=g.index;for(let i=0;i<ix.count;i+=3){const a=ix.getX(i+1);ix.setX(i+1,ix.getX(i+2));ix.setX(i+2,a);}g.computeVertexNormals();b.add(g,blue,x,y,z);g.dispose();b.box(blue,x,y-.43,z+1.45,w,.19,.035);for(const side of[-1,1])b.rod('metal',[x+side*w*.46,y-.65,z],[x+side*w*.46,y-.35,z+1.42],.026);}}
function shopBay(b,x,z,w,seed,style){
 const h=2.75,y=1.76,index=(seed>>>0)%WINDOW_COUNT;
 b.box('metal',x,y,z-.09,w,h+.12,.17,0,.71);b.panel('shopWindow',index,x,y,z+.012,w-.12,h);
 for(const dx of[-w/2,0,w/2])b.box('metal',x+dx,y,z+.055,.055,h+.13,.11);
 for(const yy of[y-h/2,y+h/2])b.box('metal',x,yy,z+.06,w,.05,.13);
 b.box('concrete',x,.17,z+.10,w+.06,.34,.38);for(const dx of[-.11,.11])b.rod('metal',[x+dx,1.07,z+.13],[x+dx,1.43,z+.13],.017);
 sign(b,seed+21,'fascia',x,3.55,z+.02,w-.12,1.06,0,storefrontSign(index,seed));
 if(style%3!==2)canopy(b,x,3.02,z+.17,w-.08,style);
 if(seed%3===0){const id=signIndex(seed+331,'small');b.panel('citySign',id,x+w*.28,1.12,z+.033,.30,.38);}
}
/** Full-footprint party-wall building. +Z is its street face. */
export function addStreetwallBuilding(b,spec){
 const{w,d,seed=1,lod=0}=spec,r=urbanRandom(seed),style=(seed>>>0)%36,low=spec.floors<4,n=Math.max(1,spec.floors|0),walkup=spec.type==='brick_walkup',parking=spec.type==='parking_garage',glassTower=/international|glass|postmodern|tower/.test(spec.type)&&!walkup,fh=walkup?3.05:low?3.5:3.42,ground=4.15,h=ground+Math.max(0,n-1)*fh,z=d/2;
 const arcade=!low&&(style%5===0||spec.type==='office_podium');
 const wall=walkup?(style%2?'brickRed':'brickOchre'):low?['stucco','travertine','brickOchre','cinder','sandstone','brickRed'][style%6]:['concrete','ribbed','travertine','sandstone','stucco'][style%5],trim=style%3?'concrete':'travertine';
 // Shared lot boundaries close the street wall; different heights expose honest party walls.
 if(arcade){b.box(wall,0,(h+ground)/2,-.21,w,h-ground,d-.42);b.box(wall,0,ground/2,-.97,w,ground,d-1.94);b.solid(0,-.83,w,d-1.66);b.box('sidewalk',0,.075,z-.76,w,.15,1.62);b.walk(0,z-.76,w,1.62,.15);}else{b.box(wall,0,h/2,-.21,w,h,d-.42);b.solid(0,0,w,d);b.box(trim,0,.13,z,w,.26,.34);}b.box(trim,0,ground-.12,z+.08,w,.24,.26);
 const bays=Math.max(2,Math.round(w/(4.0+(style%4)*.48))),bay=w/bays;
 for(let i=0;i<bays;i++){const x=-w/2+bay*(i+.5);shopBay(b,x,z+.02-(arcade?1.7:0),bay-.24,seed*31+i*17,style+i);b.box(wall,x-bay/2+.1,1.98,z+.07,arcade?.42:.2,3.95,arcade?.55:.38);if(arcade)b.solid(x-bay/2+.1,z+.07,.42,.55);}
 b.box(wall,w/2-.1,1.98,z+.07,.2,3.95,.38);
 if(parking){for(let f=1;f<n;f++){const y=ground+(f-.5)*fh;b.plane('glass',0,y,z+.03,w-.8,fh-.75);b.box(trim,0,ground+f*fh,z+.25,w,.44,.65);for(let i=0;i<=bays;i++)b.box(trim,-w/2+i*bay,y,z+.24,.32,fh,.57);for(let k=0;k<3;k++)b.box('concrete',0,y-fh*.24+k*.19,z+.28,w,.11,.20);}}
 else if(glassTower){
  if(n>1){b.plane('glass',0,(ground+h)/2,z+.04,w-.30,h-ground-.10);for(let i=0;i<=bays*2;i++)b.box(style%2?'metal':'travertine',-w/2+i*w/(bays*2),(ground+h)/2,z+.11,.085,h-ground,.22);for(let f=1;f<n;f++)b.box('metal',0,ground+f*fh,z+.12,w,.065,.20);}
 }else{
  for(let f=1;f<n;f++){const yy=ground+(f-.5)*fh,ww=Math.min(bay*.65,walkup?1.55:2.8),wh=walkup?2.04:fh*(style%4===0?.72:.61);for(let i=0;i<bays;i++)window(b,-w/2+(i+.5)*bay,yy,z+.035,ww,wh,style%3?'glass':'glassLight',.88+(i%3)*.07);if(!low&&(style%4===0||/brutalist|precast/.test(spec.type))){for(let i=0;i<=bays;i++)b.box('ribbed',-w/2+i*bay,yy,z+.26,.32,fh,.66);b.box(trim,0,ground+f*fh,z+.23,w,.24,.58);}}
 }
 // Side and rear elevation windows remain behind the same lot edge.
 for(const side of[-1,1]){b.push(side*w/2,0,-.18,side*PI/2);for(let f=1;f<n;f++){const yy=ground+(f-.5)*fh;b.plane('glass',0,yy,.02,d-.9,fh*.60);for(let i=0;i<=Math.round(d/3.3);i++)b.box(wall,-d/2+i*d/Math.round(d/3.3),yy,.07,.48,fh,.22);}b.pop();}
 b.push(0,0,-d/2-.01,PI);for(let f=1;f<n;f++){const yy=ground+(f-.5)*fh;b.plane('glassLight',0,yy,0,w-.9,fh*.53);for(let i=0;i<=bays;i++)b.box(wall,-w/2+i*bay,yy,.10,.65,fh,.23);}b.box('metal',w*.25,1.37,.04,2.3,2.7,.16);b.plane('shutter',w*.25,1.37,.13,2.2,2.6);b.pop();
 for(const side of[-1,1]){b.box(trim,0,h+.22,side*(d/2-.13),w,.44,.26);b.box(trim,side*(w/2-.13),h+.22,0,.26,.44,d);}
 b.box('asphalt',0,h+.02,0,w-.55,.06,d-.55);
 if(low&&style%3===0){b.box(wall,w*.1,h+.54,z-.14,w*.48,.62,.42);b.box(trim,w*.1,h+.88,z-.16,w*.5,.10,.47);}
 if(glassTower&&style%2===0){for(let k=0;k<3;k++){const ww=w-2.4-k*1.8,dd=d-2-k*1.6,yy=h+.6+k*1.5;b.box('glass',0,yy,0,ww,1.6,dd);b.box(trim,0,yy+.84,0,ww+.12,.14,dd+.12);}}
 if(walkup||(!low&&style%6===0))addFireEscape(b,w*.27,z+.72,Math.min(6,n),fh,lod);
 addRoofEquipment(b,w*.8,d*.8,h+.25,r,lod);if(!lod&&w>21){b.push(-w*.20,0,-d*.24);addRoofEquipment(b,w*.4,d*.35,h+.25,urbanRandom(seed+47),1,.65);b.pop();}
 if(!lod){
  // Exterior AC cases have coil louvers, wall brackets and a connected condensate line.
  if(low||walkup)for(let f=1;f<Math.min(n,5);f++)for(const sx of[-.28,.28]){const x=w*sx,y=ground+(f-.38)*fh;b.box('metal',x,y,z+.39,.85,.55,.62);for(let k=0;k<6;k++)b.box('dark',x-.32+k*.13,y,z+.712,.045,.38,.01);b.rod('white',[x+.38,y,z+.4],[x+.38,.4,z+.13],.019);for(const dx of[-.3,.3])b.rod('metal',[x+dx,y-.30,z+.01],[x+dx,y-.30,z+.69],.028);}
  b.rod('metal',[-w/2+.18,h+.1,z+.1],[-w/2+.18,.17,z+.1],.039);
  if(style%3===0){const yy=Math.min(h*.56,17),hh=Math.min(11,h-5);if(hh>3)sign(b,seed+715,'banner',w*.34,yy,z+.24,2.5,hh);}
  if(style%5===1){const yy=low?h+2.2:h*.7;sign(b,seed+929,'billboard',0,yy,z+.26,Math.min(10,w*.72),3.4);for(const x of[-w*.28,w*.28])b.rod('metal',[x,yy-1.6,z],[x,yy+1.6,z+.25],.05);}
  const sx=-w*.34;b.rod('metal',[sx,3.85,z],[sx,3.85,z+1.1],.045);sign(b,seed+440,'small',sx,3.72,z+.99,.76,.90,PI/2);
  if(!low&&style%7===0)addRoofLetters(b,style%2?'TOWER':'PARKING',0,h+.75,z-.4,w*.75,1.1,lod);
 }
 return{height:h+5,type:spec.type,style};
}
