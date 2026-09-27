import {addClinicStreetlife,PATIO_RECT} from './clinic-streetlife.js?v=56';
import {addFountainLiquid,finishFountainLiquid} from './fountain-water-v54.js?v=56';
import {fountainCenter} from './clinic-district-materials.js?v=56';
import * as T from './vendor/three.module.min.js';
import {UrbanBatch,urbanRandom} from './urban-batch.js?v=56';
import {EXIT_CITY_Y,exitPoint} from './exit-route.js?v=56';
import {CLINIC_ORIGIN,clinicToWorld} from './reference-scenes.js?v=56';
import {subtractRectangles} from './urban-ground-ownership.js?v=56';
import {addRoofEquipment} from './urban-buildings.js?v=56';
import {windowCatalog} from './urban-assets.js?v=56';
import * as P from './urban-props.js?v=56';
import * as S from './urban-smallprops.js?v=56';
const cp=exitPoint(282),A=Math.atan2(cp.nx,cp.nz),Y=EXIT_CITY_Y,PI=Math.PI;
const place=(b,x,y,z,ry,fn,args={})=>{b.push(x,y,z,ry);fn(b,args);b.pop();};
function surface(b,key,x0,x1,z0,z1,y,holes=[]){for(const[a,c,u,v]of subtractRectangles(x0,x1,z0,z1,holes)){b.box(key,(a+c)/2,y-.06,(u+v)/2,c-a,.12,v-u);b.walk((a+c)/2,(u+v)/2,c-a,v-u,y);}}
function quad(b,key,points,uv=[0,0,0,1,1,1,1,0]){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(points.flat(),3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex([0,1,2,0,2,3]);g.computeVertexNormals();if(g.attributes.normal.getY(0)<-.01){g.setIndex([0,2,1,0,3,2]);g.computeVertexNormals();}b.add(g,key,0,0,0);g.dispose();}
function fascia(b,key,x,z,w,y=4.6,h=1.1){b.box('photoFrame',x,y,z,w+.10,h+.12,.15);b.plane('district:'+key,x,y,z-.086,w,h,PI);for(const sx of[-1,1]){b.rod('photoSteel',[x+sx*w*.36,y+h*.6,z+.03],[x+sx*w*.36,y+h*.7,z-.32],.023);b.box('photoSteel',x+sx*w*.36,y+h*.69,z-.32,.22,.085,.15);}}
function shopGlass(b,x,z,w,h,key,category){b.box('photoShade',x,.18+h/2,z+.04,w,h,.15);if(key)b.plane('district:'+key,x,.18+h/2,z-.044,w-.1,h-.08,PI);else{const list=windowCatalog.filter(v=>v.business===category);const index=list[0]?.index??(category==='beauty'?70:30);b.panel('shopWindow',index,x,.18+h/2,z-.044,w-.1,h-.08,PI);}for(const dx of[-w/2,-w/6,w/6,w/2])b.box('photoFrame',x+dx,.18+h/2,z-.10,.06,h,.10);for(const y of[.18,.18+h,.18+h-.52])b.box('photoFrame',x,y,z-.10,w,.05,.10);for(const dx of[-.17,.17])b.rod('photoSteel',[x+dx,.95,z-.18],[x+dx,1.45,z-.18],.021);b.box('photoGranite',x,.14,z-.15,w+.15,.10,.38);}
function awning(b,x,z,w,y=3.68){quad(b,'photoCanvas',[[x-w/2,y,z],[x+w/2,y,z],[x+w/2,y-.62,z-1.48],[x-w/2,y-.62,z-1.48]],[0,0,w/3,0,w/3,1,0,1]);b.box('photoBlue',x,y-.71,z-1.48,w,.19,.035);for(let q=-w/2;q<=w/2+.01;q+=w/4)b.rod('photoRail',[x+q,y,z],[x+q,y-.63,z-1.49],.016);for(const dx of[-w/2,w/2])b.rod('photoRail',[x+dx,y-1.1,z],[x+dx,y-.66,z-1.48],.022);}
function potted(b,x,z,h=1.25){b.cylinder('district:terracotta',x,.40,z,.37,.26,.62,12);b.cylinder('district:terracotta',x,.682,z,.385,.38,.07,16);b.cylinder('bark',x,.718,z,.32,.32,.025,12);palm(b,x,z,.72,h,12,.42,false);}
// Fronds have curved geometry in addition to the photographic alpha silhouette.
function palm(b,x,z,base,h,seed=1,span=1,well=true){const r=urbanRandom(seed),lean=(r()-.5)*.65,crown=h*.82,segments=10;let prev=[x,base,z];for(let i=1;i<=segments;i++){const t=i/segments,p=[x+lean*t*t,base+crown*t,z+.13*Math.sin(t*1.7)];b.rod('district:palmBark',prev,p,(.20-.10*t)*span);prev=p;}b.sphere('district:palmBark',prev[0],prev[1]-.09,prev[2],.31*span,.45*span,.31*span,.78);
 for(let j=0;j<24;j++){const angle=j*2.399+r()*.19,length=(2.7+r()*.6)*span,width=length/3,up=(j%3===0?1.8:j%3===1?.70:.16)*Math.min(1,h/8.1),down=(.6+r()*.85)*Math.min(1,h/8.1);const pos=[],uv=[],ix=[];for(let k=0;k<=8;k++){const t=k/8,dist=t*length,height=up*Math.sin(t*PI)-down*t*t;for(const side of[-1,1]){pos.push(prev[0]+Math.cos(angle)*dist+Math.sin(angle)*side*width*.5,prev[1]+height,prev[2]+Math.sin(angle)*dist-Math.cos(angle)*side*width*.5);uv.push(t,side<0?0:1);}}for(let k=0;k<8;k++){const q=k*2;ix.push(q,q+1,q+2,q+1,q+3,q+2);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();b.add(g,j%4===1?'district:palmFrondB':'district:palmFrond',0,0,0,1,1,1,0,0,0,.88+r()*.16);g.dispose();b.rod('foliage',prev,[prev[0]+Math.cos(angle)*length*.19,prev[1]+up*Math.sin(.19*PI)-down*.19*.19,prev[2]+Math.sin(angle)*length*.19],.018*span);}
 if(well){b.circle(x,z,1.01);b.box('bark',x,base-.025,z,1.45,.05,1.45);for(const side of[-1,1]){b.box('photoGranite',x+side*.88,base+.13,z,.26,.26,2.02);b.box('photoGranite',x,base+.13,z+side*.88,1.50,.26,.26);}}
}
function ring(b,key,x,z,y,inner,outer,h,n=64){const g=new T.CylinderGeometry(outer,outer,h,n,1,true),g2=new T.CylinderGeometry(inner,inner,h,n,1,true);g2.scale(-1,1,1);b.add(g,key,x,y+h/2,z);b.add(g2,key,x,y+h/2,z);g.dispose();g2.dispose();const top=new T.RingGeometry(inner,outer,n);top.rotateX(-PI/2);b.add(top,key,x,y+h,z);top.dispose();}
function fountain(b,x,z){b.circle(x,z,5.3);ring(b,'photoGranite',x,z,.12,4.62,5.22,.46);ring(b,'district:poolTile',x,z,.03,4.43,4.63,.43);b.cylinder('district:poolTile',x,.035,z,4.44,4.44,.05,64);b.cylinder('photoGranite',x,.60,z,.45,.75,1.15,20);b.cylinder('photoGranite',x,1.45,z,1.24,.33,.20,40);b.cylinder('district:poolTile',x,1.56,z,1.14,1.14,.04,40);b.cylinder('photoGranite',x,1.91,z,.19,.30,.7,16);b.sphere('photoBronze',x,2.36,z,.16,.14,.16);
 addFountainLiquid(b,x,z);
}
export function createClinicDistrict(mats){const center=clinicToWorld(49,46);fountainCenter.value.set(center.x,center.z);const b=new UrbanBatch(mats);b.push(CLINIC_ORIGIN.x,Y,CLINIC_ORIGIN.z,A);
 // Infill wraps the existing blank side wall. The original clinic masses are untouched.
 b.box('photoStucco',33.75,3.26,11.97,16.3,6.52,12.74);b.solid(33.75,11.97,16.3,12.74);b.box('photoStucco',33.75,6.87,13.3,16.3,.7,10.1);b.box('photoBronze',33.75,7.25,8.23,16.45,.09,.28);
 b.box('photoCream',24.35,3.28,5.39,9.9,6.56,.34);b.box('photoCream',24.35,4.34,5.10,10.1,.33,.70);
 shopGlass(b,13.56,5.47,9.45,2.98,null,'barber');fascia(b,'beauty',13.56,5.22,9.50,3.89,1.01);fascia(b,'pharmacy',13.56,5.23,9.50,5.66,1.45);
 shopGlass(b,24.0,5.14,8.72,2.98,null,'laundromat');fascia(b,'laundry',24,4.99,8.82,3.89,1.01);fascia(b,'optica',24,5.00,8.82,5.66,1.45);
 // Shaded upstairs landing and a second connected wing establish two storeys.
 b.box('photoCream',35.0,3.56,5.35,12,.30,.5);for(const x of[29.6,36,41.3])b.box('photoStucco',x,4.94,5.45,.32,2.51,.38);b.plane('photoGlass',35,4.75,5.60,10.9,2.2,PI);for(const x of[32.1,35.4,38.6])b.box('photoFrame',x,4.76,5.48,.06,2.15,.10);b.box('photoCream',35,6.19,5.29,12,.35,.65);
 shopGlass(b,35.4,5.45,10.8,2.97,null,'optician');awning(b,35.4,5.22,11.5,3.65);
 b.push(33.5,0,12.4);addRoofEquipment(b,13,8,7.22,urbanRandom(53531),0);b.pop();
 // One continuous three-bay strip from image five encloses the far edge.
 b.box('photoStucco',45,2.74,70.6,21.4,5.48,11.2);b.solid(45,70.6,21.4,11.2);b.box('photoStucco',45,5.76,70.7,21.6,.55,11.5);b.box('photoBronze',45,6.08,64.98,21.7,.08,.26);
 const shops=[['books','bookSign',52.1],['phones','phoneSign',45],['travel','travelSign',37.9]];
 for(const[texture,sign,x]of shops){shopGlass(b,x,64.91,6.75,3.0,texture);fascia(b,sign,x,64.75,6.8,4.68,1.18);awning(b,x,64.77,7.08,3.79);for(const q of[-3.48,3.48])b.box('photoStucco',x+q,1.76,64.80,.30,3.54,.42);potted(b,x-3.12,64.1,1.4);}
 b.push(44,0,70.7);addRoofEquipment(b,17,8,6.035,urbanRandom(53157),0);b.pop();b.box('photoGranite',37.4,6.2225,69.7,2.1,.375,2.1);b.cylinder('dark',37.4,7.19,69.7,.86,.91,1.56,16);b.cylinder('photoSteel',37.4,8.04,69.7,.35,.42,.22,12);for(const x of[35,55]){b.box('photoSteel',x,6.065,72,.32,.06,.32);b.rod('photoRail',[x,6.035,72],[x,9.7,72],.023);for(let k=0;k<4;k++)b.rod('photoSteel',[x-.8+k*.12,9.1-k*.22,71.6],[x+.8-k*.12,9.1-k*.22,72.4],.015);}
 for(const[x,cat]of[[30.94,'photo'],[59.06,'cafe']]){b.box('photoCream',x,2.3,70.6,6.68,4.6,11.2);b.solid(x,70.6,6.68,11.2);shopGlass(b,x,64.89,5.94,2.9,null,cat);awning(b,x,64.7,6.66,3.52);b.sign(x<40?'photo':'bakery',x,4.15,64.55,5.2,.75,PI);b.box('photoGranite',x,4.67,70.6,6.75,.16,11.4);}
 // Perimeter paving joins the existing cobble court at X=21.76 exactly.
 surface(b,'photoCobble',21.76,42,-18,3.82,.02);surface(b,'photoGranite',8.05,42,3.82,5.48,.16);surface(b,'photoGranite',40.25,42,5.48,18.4,.16);
 surface(b,'photoCobble',25.6,70,18.4,29,.02);surface(b,'photoCobble',42,54,3.82,18.4,.02);surface(b,'asphalt',54,70,3.82,18.4,.02);
 surface(b,'photoGranite',27.6,62.4,62.1,65,.16);surface(b,'photoCobble',62.4,70,62.1,77,.02);
 for(let x=11;x<40;x+=3.3)place(b,x,.025,3.1,0,P.addWheelStop);for(const x of[32,43,54,60])place(b,x,.025,61.5,0,P.addWheelStop);
 // A 41 × 33 m pedestrian square: fountain, shaded perimeter, two generous axial paths.
 const treePositions=[[31.5,34],[31.5,46],[31.5,58],[65.5,34],[65.5,46],[65.5,58],[40,58],[56,58]];
 const holes=[PATIO_RECT,[43.78,54.22,40.78,51.22],...treePositions.map(([x,z])=>[x-.78,x+.78,z-.78,z+.78])];
 surface(b,'district:pavers',29,70,29,62.1,.12,holes);surface(b,'district:terraceTile',...PATIO_RECT,.12,treePositions.map(([x,z])=>[x-.78,x+.78,z-.78,z+.78]));surface(b,'photoCobble',25.6,29,29,62.1,.02);
 // Trim follows the real outer perimeter, with 2.8 m ramp openings aligned to paths.
 for(const [a,c]of[[29,46.6],[49.4,70]]){b.box('photoGranite',(a+c)/2,.13,29,c-a,.10,.22);b.box('photoGranite',(a+c)/2,.13,62.1,c-a,.10,.22);}
 for(const z of[29,62.1]){const sign=z===29?1:-1;quad(b,'photoGranite',[[46.6,.02,z-sign*1.5],[49.4,.02,z-sign*1.5],[49.4,.12,z],[46.6,.12,z]]);b.walk(48,z-sign*.75,2.8,1.5,.07,0,sign*.10/1.5);}
 for(const x of[29,70])b.box('photoGranite',x,.10,45.55,.18,.16,33.1);
 for(let k=0;k<64;k++){const a=k*PI/32,c=(k+1)*PI/32,point=(t,r)=>[49+Math.cos(t)*r,.12,46+Math.sin(t)*r],edge=t=>5.22/Math.max(Math.abs(Math.cos(t)),Math.abs(Math.sin(t)));quad(b,'district:pavers',[point(a,5.22),point(c,5.22),point(c,edge(c)),point(a,edge(a))]);}fountain(b,49,46);
 for(let i=0;i<treePositions.length;i++){const[x,z]=treePositions[i];palm(b,x,z,.12,8.1+(i%3)*.75,901+i,1.2,true);}
 for(const[x,z,ry]of[[60.7,37,-PI/2],[60.7,49,-PI/2],[56,55,PI],[56,33,0]])place(b,x,.12,z,ry,P.addBench);
 for(const x of[28.4,70.6])for(const z of[34,56.5]){b.box('photoGranite',x,.32,z,1.35,.60,7.6);b.box('bark',x,.627,z,1.12,.04,7.32);b.solid(x,z,1.35,7.6);for(let k=0;k<9;k++){const q=z-3.2+k*.8;b.sphere('foliage',x,.96,q,.55,.48,.61,.82+(k%3)*.05);for(let j=0;j<2;j++)b.plane('photoLeaf',x,1.05,q,1.1,.80,j*PI/2,0,.92);}}
 for(const[x,z]of[[36,31.8],[62,55.8],[28,60]])place(b,x,x<29?.02:.12,z,0,P.addTrashBin);
 for(const[x,z]of[[29,25],[68,25],[68,61]])place(b,x,.02,z,PI,P.addStreetLight,{height:7.8,arm:1.6});
 for(const x of[44,52])place(b,x,.02,27.3,0,P.addBollard);place(b,28.1,.02,24,PI/2,S.addBikeRack);place(b,42.6,.02,20.5,0,S.addNewspaperBox,{color:'blue',seed:53});
 // Service edge and parking are bounded; no isolated acres of blank asphalt.
 for(let x=54.5;x<69;x+=3.1){b.box('white',x,.033,9.2,.08,.009,5.2);place(b,x+1.3,.025,11.7,0,P.addWheelStop);}for(const[x,seed]of[[58.8,176],[65.0,89]])place(b,x,.025,9.2,PI,S.addParkedSedan,{seed});
 for(const[x,z]of[[43.1,18.6],[66,19.1],[60,77.3]])place(b,x,.025,z,0,P.addStormDrain);
 place(b,62.8,.02,74.5,PI/2,S.addDumpster);place(b,39.8,.16,4.4,0,P.addHydrant);potted(b,29.2,4.1,1.7);potted(b,10.1,4.3,1.35);
 // Back service walk meets the neighboring generated block at city X≈112.
 surface(b,'asphalt',27.6,70,76.3,82.3,.005);surface(b,'photoGranite',27.6,62.4,76.3,77.7,.15);
 addClinicStreetlife(b,{potted});
 b.pop();const object=b.finish('Clinic infill / connected shops and palm fountain square');finishFountainLiquid(object);return{object,walks:b.walks,colliders:b.colliders,buildings:3,shops:8,waypoint:{...clinicToWorld(48,28),label:'Level 11 · 棕榈喷泉广场',yaw:A+PI,pitch:.03}};
}
