import * as T from './vendor/three.module.min.js';
import {ATLAS,uvRect,lathe,torus,gridSurface,card,sphereUV,photoBox} from './tiki-mesh-v77.js';
import {TIKI_DETAILS} from './tiki-plan-v77.js';
const bottleProfiles=[[[.041,0],[.053,.025],[.053,.24],[.048,.27],[.022,.30],[.021,.40]],[[.037,0],[.061,.06],[.060,.21],[.042,.28],[.02,.32],[.02,.41]],[[.048,0],[.051,.02],[.051,.29],[.026,.32],[.023,.40]],[[.055,0],[.057,.02],[.057,.21],[.039,.24],[.025,.27],[.023,.36]],[[.035,0],[.05,.02],[.053,.21],[.045,.25],[.027,.28],[.022,.45]],[[.043,0],[.061,.04],[.067,.16],[.051,.23],[.025,.28],[.023,.34]]];
export function liquorBottle(k,x,y,z,index=0,scale=1,yaw=0,pourer=true){
 const profile=bottleProfiles[index%6],h=profile.at(-1)[1]*scale,r=Math.max(...profile.map(p=>p[0]))*scale,glass=['amberGlass','greenGlass','clearGlass','blueGlass'][index%4];
 lathe(k,glass,x,y,z,[[0,.002],...profile,[profile.at(-1)[0]-.005,profile.at(-1)[1]],[.014,.045],[0,.045]],{segments:18,scale});
 const labelH=(index%3===0?.19:.155)*scale,labelY=y+(.115+(index%3)*.018)*scale;const g=uvRect(new T.CylinderGeometry(r+.0012,r+.0012,labelH,12,1,true,-.90,1.8),ATLAS[index%4],.023);k.add(g,'labels'+(1+Math.floor(index%12/4)),x,labelY,z,[0,yaw,0]);
 torus(k,'steel',x,y+h-.005,z,profile.at(-1)[0]*scale,.0025,[Math.PI/2,0,0],16);
 if(pourer){k.cyl('blackMetal',x,y+h+.012,z,.021*scale,.022*scale,.027,10);k.cyl('steel',x,y+h+.045,z,.008,.013,.043,10);k.tube('steel',[[x,y+h+.06,z],[x,y+h+.09,z],[x+.025*Math.sin(yaw),y+h+.104,z+.025*Math.cos(yaw)]],.005,7);k.cyl('dark',x,y+h+.11,z,.004,.004,.012,7);}else k.cyl('bronze',x,y+h+.01,z,.026*scale,.026*scale,.028,12);
}
export function glass(k,x,y,z,r=.067,h=.29,thin=false){lathe(k,'clearGlass',x,y,z,[[0,0],[r*.87,0],[r,.018],[r*(thin?.88:1.05),h],[r*.90,h+.003],[r*.87,h-.008],[r*.79,.038],[0,.038]],{segments:28});torus(k,'clearGlass',x,y+h,z,r*.97,.003);}
export function iceCubes(k,x,y,z,n=6,spread=.045,size=.018){for(let i=0;i<n;i++){const a=i*2.39996,rr=spread*Math.sqrt((i+.5)/n);const g=new T.IcosahedronGeometry(size,0);g.scale(1.1,.75,.9);k.add(g,'ice',x+Math.cos(a)*rr,y+.008*(i%3),z+Math.sin(a)*rr,[i*.3,i*.71,i*.1]);}}
export function ceramicMug(k,key,x,y,z,h=.27,r=.095,yaw=0){
 // A 48-segment relief wall, physically hollow with a rolled lip. The UV front
 // remains in the centre of the wrap rather than being stretched around a box.
 const g=gridSurface((u,v)=>{const a=u*Math.PI*2+Math.PI,front=Math.max(0,Math.cos(a)),xx=Math.sin(a);let radius=r*(.87+.13*Math.sin(v*Math.PI*.8));radius+=r*.11*front**8*(Math.exp(-Math.pow((v-.58)/.13,2))*Math.exp(-Math.pow(xx/.22,2))-.5*Math.exp(-Math.pow((v-.72)/.06,2)));return[Math.sin(a)*radius,v*h,Math.cos(a)*radius];},48,30);
 if(key==='greenCeramic'){const uv=g.attributes.uv;for(let i=0;i<uv.count;i++){const u=uv.getX(i),v=uv.getY(i);uv.setXY(i,u>=.25&&u<=.75?(u-.25):.5+(u<.25?u+.25:u-.75),.5+v*.5);}}k.add(g,key,x,y,z,[0,yaw,0]);lathe(k,'glazes',x,y,z,[[r*.9,h],[r*.78,h],[r*.73,.025],[0,.025]],{segments:24,uv:ATLAS[key==='blueMug'?0:key==='wahine'?1:2]});torus(k,'porcelain',x,y+h,z,r*.9,.005);
 k.cyl('coffee',x,y+h-.034,z,r*.73,r*.73,.003,24);k.plane('glazes',x,y+.001,z,.27,.27,[-Math.PI/2,0,yaw],ATLAS[3]);
}
function umbrella(k,x,y,z,r=.14){k.beam('bamboo',[x,y-.23,z],[x,y+.035,z],.003,6);const n=20,p=[0,.04,0],uv=[.5,.5],ix=[];for(let i=0;i<=n;i++){const a=i/n*Math.PI*2;p.push(Math.sin(a)*r,0,Math.cos(a)*r);uv.push(.5+Math.sin(a)*.48,.5+Math.cos(a)*.48);if(i<n)ix.push(0,i+1,i+2);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();k.add(g,'umbrella',x,y,z,[.15,0,-.12]);}
function bowl(k,x,y,z,index,r=.12){lathe(k,'glazes',x,y,z,[[.045,0],[.06,.006],[r,.065],[r,.073],[r-.011,.073],[.065,.018],[.025,.014]],{segments:24,uv:ATLAS[index]});}
function ashtray(k,x,y,z){
 const mat='greenCeramic';sphereUV(k,mat,x,y+.14,z,.070,.095,.061,{uv:ATLAS[2]});sphereUV(k,mat,x,y+.268,z-.008,.070,.070,.053,{uv:[0,.29,.5,.21]});
 for(const s of[-1,1]){k.tube(mat,[[x+s*.045,y+.20,z],[x+s*.102,y+.14,z+.012],[x+s*.075,y+.10,z+.10]],.022,12);sphereUV(k,mat,x+s*.079,y+.052,z+.045,.048,.045,.069,{uv:ATLAS[2]});}
 lathe(k,mat,x,y+.015,z+.108,[[.03,0],[.10,.015],[.116,.045],[.107,.055],[.093,.046],[.06,.018]],{segments:24,uv:ATLAS[1]});k.plane(mat,x,y+.037,z+.112,.147,.12,[-Math.PI/2,0,.16],ATLAS[3]);
 for(let i=0;i<3;i++)k.beam('ivory',[x-.054+i*.038,y+.056,z+.135],[x-.02+i*.026,y+.058,z+.181],.005,7);
}
export function cocktailCounter(k){const q=TIKI_DETAILS.cocktail,y=q.top;
 k.box('wood',q.x,.54,q.z,q.w-.13,1.06,q.d-.10,.05);k.box('counter',q.x,y-.075,q.z,q.w,.15,q.d,.065);k.box('counter',5.50,y-.06,-5.13,1.4,.12,.17,.03);
 for(let x=q.x-q.w/2+.12;x<q.x+q.w/2;x+=.14)k.cyl('bamboo',x,.52,-5.20,.039,.044,.98,8);
 // Thick jointed bamboo background, rope ties and draped generated leis.
 for(const x of[2.60,3.22,4.67,5.50,6.16]){k.cyl('bamboo',x,1.70,-6.40,.074,.095,3.32,10);for(const y of[.45,.94,1.55,2.12,2.78,3.1]){k.cyl('wood',x,y,-6.40,.092,.092,.035,10);torus(k,'rope',x,y+.019,-6.40,.095,.009);} }
 for(const [x,yy,w,h]of[[2.98,2.43,.70,1.13],[5.47,2.38,.67,1.04],[6.1,2.40,.59,.95]])card(k,'lei',x,yy,-6.22,w,h,-.06,[0,0,1,1],.06);
 // A rounded physical board core plus tightly cropped photographic face.
 const board=new T.Shape();board.moveTo(-.22,0);board.quadraticCurveTo(-.40,.58,-.24,1.39);board.quadraticCurveTo(-.12,1.81,0,1.89);board.quadraticCurveTo(.25,1.68,.29,1.15);board.quadraticCurveTo(.37,.4,.22,0);board.closePath();const bg=new T.ExtrudeGeometry(board,{depth:.046,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.021,bevelThickness:.019,curveSegments:20});k.add(bg,'blueMug',4.23,y,-6.31,[0,-.08,-.075]);
 card(k,'surfboard',4.20,y+.94,-6.23,.56,1.9,-.08,[.21547,.004604,.56906,.98757],.04);
 // Warm yellow half-dome lamp is seated on a brass stem and weighted foot.
 k.cyl('bronze',5.82,y+.022,-5.97,.15,.17,.044,20);k.cyl('bronze',5.82,y+.18,-5.97,.027,.035,.30,12);const dome=new T.SphereGeometry(.245,24,12,0,Math.PI*2,0,Math.PI/2);k.add(dome,'bulb3',5.82,y+.33,-5.97);torus(k,'bronze',5.82,y+.328,-5.97,.244,.009);
 // The clutter follows the photographed left-to-right order; every object has
 // its own foot/contact height, then rims, straws and garnish above that height.
 const z=-5.35;
 glass(k,2.87,y,z,.077,.325);k.cyl('liquid',2.87,y+.15,z,.065,.064,.24,22);iceCubes(k,2.87,y+.265,z,7,.055,.023);
 card(k,'garnish',2.87,y+.27,z+.016,.15,.15,-.2,ATLAS[0],.014);card(k,'garnish',2.83,y+.34,z,.13,.13,-.5,ATLAS[1],.018);card(k,'garnish',2.91,y+.15,z+.057,.11,.12,.3,ATLAS[0],.012);
 ceramicMug(k,'blueMug',3.24,y,z-.018,.28,.102,-.30);umbrella(k,3.21,y+.48,z-.048,.145);
 bowl(k,3.64,y,z+.10,0,.145);bowl(k,3.65,y+.04,z+.09,1,.13);bowl(k,3.68,y+.081,z+.10,2,.112);bowl(k,3.82,y,z-.09,1,.12);
 glass(k,4.05,y,z+.015,.049,.35,true);k.cyl('liquid',4.05,y+.14,z+.015,.039,.038,.22,18);k.tube('purple',[[4.035,y+.05,z],[4.06,y+.39,z],[4.025,y+.435,z+.045]],.0047,9);
 ashtray(k,4.44,y,z+.035);
 ceramicMug(k,'wahine',4.78,y,z-.16,.35,.09,-.22);ceramicMug(k,'brownMug',5.17,y,z+.012,.36,.103,-.38);ceramicMug(k,'greenCeramic',5.63,y,z+.055,.27,.105,-.38);
 for(const [x,h]of[[5.17,.36],[5.63,.27]]){card(k,'garnish',x+.02,y+h+.10,z,.26,.27,-.45,ATLAS[2],.023);card(k,'garnish',x-.026,y+h+.10,z-.012,.26,.27,.9,ATLAS[2],.023);k.tube('purple',[[x-.038,y+h-.07,z],[x-.05,y+h+.15,z],[x-.084,y+h+.17,z+.02]],.004,9);}
 for(let i=0;i<9;i++)liquorBottle(k,2.80+i*.35,y,-5.92,i,.94+(i%3)*.08,-.18,true);
 k.box('wood',3.25,2.12,-6.29,1.15,.055,.24,.017);for(let i=0;i<5;i++)liquorBottle(k,2.79+i*.225,2.15,-6.26,i+7,.69,-.05);
}
export function shelfBottles(k){for(const [row,y]of[1.48,2.05,2.62].entries())for(let i=0;i<20;i++){const index=(i+row*5)%12,z=-4.68+i*.429;liquorBottle(k,6.20,y+.047,z,index,.77+(i%4)*.055,-Math.PI/2,true);}}
function largeIdol(k){const q=TIKI_DETAILS.idol;
 k.add(new T.CylinderGeometry(q.r*.95,q.r*1.03,q.h,32,20,false,Math.PI/2,Math.PI), 'idolWood',q.x,q.h/2,q.z,[0,q.yaw,0]);
 const g=gridSurface((u,v)=>{const x=(u-.5)*.85,y=v*q.h;let depth=.29+Math.sqrt(Math.max(0,1-((u-.5)*1.9)**2))*.14;const ga=(a,b)=>Math.exp(-Math.pow(a/b,2));depth+=.085*ga(x,.12)*ga(v-.52,.10);depth+=.075*ga(Math.abs(x)-.19,.11)*ga(v-.65,.045);depth-=.08*ga(Math.abs(x)-.18,.105)*ga(v-.59,.045);depth-=.115*ga(x,.28)*ga(v-.30,.09);depth+=.027*Math.sin(v*80.)*ga(v-.80,.1);return[x,y,depth];},56,90);k.add(g,'idolFace',q.x,0,q.z,[0,q.yaw,0]);for(const side of[-1,1]){const sideG=gridSurface((u,v)=>[side*(.42-.018*(1-u)),v*q.h,u*.334],2,24);k.add(sideG,'idolWood',q.x,0,q.z,[0,q.yaw,0]);}
 torus(k,'idolWood',q.x,.045,q.z,.44,.028);k.cyl('idolWood',q.x,3.31,q.z,.45,.44,.06,32);
}
function lantern(k,x,y,z){
 lathe(k,'bronze',x,y,z,[[0,0],[.13,0],[.135,.023],[.115,.054],[.085,.080],[.078,.14]],{segments:28});
 lathe(k,'clearGlass',x,y,z,[[.072,.09],[.109,.15],[.104,.31],[.07,.38],[.063,.40]],{segments:28});
 lathe(k,'bronze',x,y,z,[[.12,.38],[.116,.402],[.083,.42],[.072,.45],[.073,.475],[.035,.48]],{segments:24});k.cyl('lanternGlow',x,y+.135,z,.027,.036,.08,12);sphereUV(k,'lanternGlow',x,y+.23,z,.028,.072,.028);
 for(const s of[-1,1])k.tube('bronze',[[x+s*.115,y+.036,z],[x+s*.16,y+.15,z],[x+s*.15,y+.39,z],[x+s*.07,y+.46,z]],.014,20);
 k.tube('bronze',[[x-.12,y+.36,z],[x-.15,y+.60,z],[x,y+.67,z],[x+.15,y+.60,z],[x+.12,y+.36,z]],.009,24);
 torus(k,'bronze',x,y+.23,z,.116,.007,[Math.PI/2,0,0]);k.beam('bronze',[x-.11,y+.105,z+.036],[x+.11,y+.35,z+.036],.005);k.beam('bronze',[x+.11,y+.105,z+.036],[x-.11,y+.35,z+.036],.005);
}
function toyVan(k,x,y,z){const w=.14,h=.16,d=.31;
 // Rounded die-cast body and raised roof, real axles/tyres/bumpers/lights. The
 // UVs crop the photographed body rather than printing blue margins as a box.
 k.box('toyBlue',x,y+.084,z,w,.104,d,.023);k.box('ivory',x,y+.147,z-.004,w*.94,.050,d*.93,.021);
 k.box('steel',x,y+.042,z-.155,.148,.015,.025,.005);k.box('steel',x,y+.042,z+.155,.148,.015,.025,.005);
 const front=gridSurface((u,v)=>[(u-.5)*w*(1-.05*Math.pow(v,5)),.045+v*.119,.158-.012*Math.pow(v,5)],10,10);uvRect(front,[.081,.585,.344,.344],.01);k.add(front,'toy',x,y,z);
 const rear=gridSurface((u,v)=>[(u-.5)*w*(1-.05*Math.pow(v,5)),.044+v*.12,-.158+.012*Math.pow(v,5)],10,10);uvRect(rear,[.588,.132,.322,.329],.01);k.add(rear,'toy',x,y,z);
 for(const side of[-1,1]){const g=gridSurface((u,v)=>[side*(w/2-.004*Math.pow(v,5)),.044+v*.117,(u-.5)*d*.995],12,9);uvRect(g,side<0?[.519,.640,.451,.235]:[.025,.165,.456,.225],.012);k.add(g,'toy',x,y,z);}
 for(const side of[-1,1])for(const zz of[-.095,.097]){const g=new T.CylinderGeometry(.026,.026,.016,14);k.add(g,'blackMetal',x+side*.069,y+.031,z+zz,[0,0,Math.PI/2]);const hub=new T.CylinderGeometry(.012,.012,.018,12);k.add(hub,'steel',x+side*.070,y+.031,z+zz,[0,0,Math.PI/2]);}
 for(const side of[-1,1]){k.sphere('ivory',x+side*.045,y+.077,z+.16,.008,.008,.003);k.beam('steel',[x+side*.059,y+.13,z+.095],[x+side*.081,y+.132,z+.102],.002,5);k.sphere('steel',x+side*.082,y+.134,z+.104,.006,.008,.003);}
}
export function idolCorner(k){largeIdol(k);const q=TIKI_DETAILS.lantern;lantern(k,q.x,q.y,q.z);
 glass(k,4.14,q.y,3.61,.055,.18);for(let i=0;i<11;i++){const a=i*2.39996,r=.037*Math.sqrt((i+.5)/11),x=4.14+Math.cos(a)*r,z=3.61+Math.sin(a)*r;k.beam('ivory',[x,q.y+.024,z],[x+Math.cos(a)*.025,q.y+.35+(i%3)*.018,z+Math.sin(a)*.025],.0035,5);}
 toyVan(k,3.72,q.y,3.71);k.box('bronze',6.625,2.39,3.28,.032,.78,1.18,.013);k.plane('beerSign',6.602,2.39,3.28,1.15,.76,[0,-Math.PI/2,0]);
 for(const zz of[2.77,3.79])for(const yy of[2.08,2.70])k.sphere('steel',6.592,yy,zz,.006,.006,.006);
}
export function blackPendant(k,x,y,z,r=.32){k.beam('blackMetal',[x,3.34,z],[x,y+.24,z],.012,8);lathe(k,'blackMetal',x,y,z,[[r,0],[r+.008,.012],[.07,.39],[.045,.41],[.04,.445]],{segments:32});lathe(k,'ivory',x,y+.004,z,[[r-.012,0],[.062,.366]],{segments:24});k.sphere('bulb3',x,y+.09,z,.032,.051,.032);k.cyl('blackMetal',x,3.32,z,.07,.07,.036,16);torus(k,'blackMetal',x,y,z,r,.007);}
