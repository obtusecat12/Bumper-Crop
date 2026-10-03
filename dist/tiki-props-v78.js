import * as T from './vendor/three.module.min.js';
import {ATLAS,uvRect,lathe,torus,gridSurface,card,sphereUV,photoBox} from './tiki-mesh-v77.js';
import {TIKI_DETAILS} from './tiki-plan-v78.js';
const bottleProfiles=[[[.041,0],[.053,.025],[.053,.24],[.048,.27],[.022,.30],[.021,.40]],[[.037,0],[.061,.06],[.060,.21],[.042,.28],[.02,.32],[.02,.41]],[[.048,0],[.051,.02],[.051,.29],[.026,.32],[.023,.40]],[[.055,0],[.057,.02],[.057,.21],[.039,.24],[.025,.27],[.023,.36]],[[.035,0],[.05,.02],[.053,.21],[.045,.25],[.027,.28],[.022,.45]],[[.043,0],[.061,.04],[.067,.16],[.051,.23],[.025,.28],[.023,.34]],[[.059,0],[.066,.012],[.066,.215],[.042,.245],[.027,.26],[.024,.38]],[[.030,0],[.055,.03],[.053,.19],[.032,.26],[.018,.32],[.017,.46]]];
const labelCell=index=>[index%4/4,1-(Math.floor(index/4)%4+1)/4,.25,.25];
export const BOTTLE_CATALOG=Array.from({length:64},(_,id)=>({id,profile:id%8,glass:['brownGlass','greenGlass','amberGlass','clearGlass','brownGlass','greenGlass','blueGlass','amberGlass'][Math.floor(id/3)%8],width:.90+((id*7)%11)*.025,height:.84+((id*11)%13)*.022,labelMaterial:'bottleLabels'+Math.floor(id/16),uv:labelCell(id)}));
export function liquorBottle(k,x,y,z,index=0,scale=1,yaw=0,pourer=true){
 const item=BOTTLE_CATALOG[((index%64)+64)%64],profile=bottleProfiles[item.profile],h=profile.at(-1)[1]*scale*item.height;
 const square=item.profile===3||item.profile===6;
 const radius=yy=>{for(let i=1;i<profile.length;i++){if(yy<=profile[i][1]){const t=(yy-profile[i-1][1])/(profile[i][1]-profile[i-1][1]);return T.MathUtils.lerp(profile[i-1][0],profile[i][0],t)*scale*item.width;}}return profile.at(-1)[0]*scale*item.width;};
 const cross=(a,r)=>{const si=Math.sin(a),co=Math.cos(a),pow=square?.38:1;return[Math.sign(si)*Math.pow(Math.abs(si),pow)*r,Math.sign(co)*Math.pow(Math.abs(co),pow)*r];};
 const body=gridSurface((u,v)=>{const f=v*(profile.length-1),lo=Math.floor(f),hi=Math.min(lo+1,profile.length-1),yy=T.MathUtils.lerp(profile[lo][1],profile[hi][1],f-lo),r=radius(yy),[xx,zz]=cross(u*Math.PI*2,r);return[xx,yy*scale*item.height,zz];},24,profile.length-1);k.add(body,item.glass,x,y,z,[0,yaw,0]);
 k.cyl(item.glass,x,y+.008,z,radius(.018),radius(.008),.016,20);
 const rect=item.uv,bodyRect=[rect[0]+.015625,rect[1]+.015,.21875,.18];
 const low=.047,high=Math.min(.222,profile[2][1]-.008),label=gridSurface((u,v)=>{const yy=low+(high-low)*v,a=(u-.5)*2.6;const [xx,zz]=cross(a,radius(yy)+.0014);return[xx,yy*scale*item.height,zz];},16,2);uvRect(label,bodyRect,0);k.add(label,item.labelMaterial,x,y,z,[0,yaw,0]);
 const neckY=h-.042*scale,neckR=radius(profile.at(-1)[1])+.0014;const neck=uvRect(new T.CylinderGeometry(neckR,neckR,.031*scale,16,1,true,-1.4,2.8),[rect[0]+.03125,rect[1]+.210,.1875,.025],0);k.add(neck,item.labelMaterial,x,y+neckY,z,[0,yaw,0]);
 torus(k,'steel',x,y+h-.005,z,neckR,.0025,[Math.PI/2,0,0],16);
 if(pourer){k.cyl('blackMetal',x,y+h+.012,z,.020*scale,.021*scale,.023,10);k.cyl('steel',x,y+h+.040,z,.007,.010,.038,10);k.tube('steel',[[x,y+h+.055,z],[x,y+h+.082,z],[x+.021*Math.sin(yaw),y+h+.092,z+.021*Math.cos(yaw)]],.004,7);}else k.cyl(index%3?'bronze':'blackMetal',x,y+h+.012,z,neckR*1.10,neckR*1.10,.029,12);
}
export function glass(k,x,y,z,r=.067,h=.29,thin=false,key='clearGlass'){lathe(k,key,x,y,z,[[0,0],[r*.87,0],[r,.018],[r*(thin?.88:1.05),h],[r*.90,h+.003],[r*.87,h-.008],[r*.79,.038],[0,.038]],{segments:28});torus(k,key,x,y+h,z,r*.97,.003);}
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
 const parent=k;k=Object.create(parent);k.add=(g,key,px=0,py=0,pz=0,rot=null,scl=null)=>{g.scale(1,.80,1);return parent.add(g,key,px,y+(py-y)*.80,pz,rot,scl);};
 const mat='oliveAsh';sphereUV(k,mat,x,y+.14,z,.070,.095,.061,{uv:ATLAS[2]});sphereUV(k,mat,x,y+.268,z-.008,.070,.070,.053,{uv:[0,.29,.5,.21]});
 const face=gridSurface((u,v)=>[(u-.5)*.09,.226+v*.093,.040+.017*Math.sin(u*Math.PI)*Math.sin(v*Math.PI)],12,12);uvRect(face,[.175,.750,.15,.226],0);k.add(face,mat,x,y,z);
 for(const s of[-1,1]){k.tube(mat,[[x+s*.045,y+.20,z],[x+s*.102,y+.14,z+.012],[x+s*.075,y+.10,z+.10]],.022,12);sphereUV(k,mat,x+s*.079,y+.052,z+.045,.048,.045,.069,{uv:ATLAS[2]});}
 lathe(k,mat,x,y+.015,z+.108,[[.03,0],[.10,.015],[.116,.045],[.107,.055],[.093,.046],[.06,.018]],{segments:24,uv:ATLAS[1]});k.plane(mat,x,y+.037,z+.112,.147,.12,[-Math.PI/2,0,.16],ATLAS[3]);
 for(let i=0;i<3;i++)k.beam('ivory',[x-.054+i*.038,y+.056,z+.135],[x-.02+i*.026,y+.058,z+.181],.005,7);
}
function mosaicTumbler(k,x,y,z,id){const r=.082,h=.235;
 // The printed wrap uses full height, independent of the profile's point indices.
 const outer=gridSurface((u,v)=>{const a=u*Math.PI*2,rr=.065+(r-.065)*v;return[Math.sin(a)*rr,v*h,Math.cos(a)*rr];},32,3);uvRect(outer,ATLAS[id%2],0);k.add(outer,'mosaicCups',x,y,z);
 lathe(k,'mosaicCups',x,y,z,[[r,h],[r-.007,h],[.058,.022],[0,.022]],{segments:28,uv:ATLAS[2]});torus(k,'ivory',x,y+h,z,r-.003,.0035);k.cyl('coffee',x,y+h-.030,z,.070,.070,.004,24);
}
function goblet(k,x,y,z){lathe(k,'greenGlass',x,y,z,[[0,0],[.072,0],[.078,.008],[.050,.020],[.012,.047],[.010,.13],[.045,.16],[.081,.21],[.091,.30],[.088,.34],[.082,.342],[.078,.30],[.069,.22],[.037,.174],[0,.17]],{segments:32});}
function shortGoblet(k,x,y,z){lathe(k,'clearGlass',x,y,z,[[0,0],[.051,0],[.057,.011],[.015,.036],[.012,.075],[.053,.102],[.070,.155],[.074,.235],[.067,.236],[.062,.155],[.045,.114],[0,.108]],{segments:28});k.cyl('liquid',x,y+.151,z,.062,.050,.072,24);}
export const COCKTAIL_INVENTORY=[
 ['lime highball',2.77,-4.60],['short clear goblet',3.08,-4.59],['three nested bowls',3.45,-4.57],['tall green highball',3.85,-4.61],['olive ashtray',4.49,-4.53],['mosaic left',4.23,-4.75],['mosaic right',4.72,-4.73],['wahine mug',5.10,-4.65],['brown pineapple tiki',5.56,-4.69],['large leaf bowl',6.04,-4.64],['blue umbrella mug',2.99,-5.17],['large green goblet',3.63,-5.09],['beer bottle',3.90,-5.10]];
export function cocktailCounter(k){const parent=k;k=Object.create(parent);
 // Tighten reference placements, preserving each vessel's actual diameter.
 // Tubes/inverted dispensers carry authored positions inside their vertices;
 // move their centres without squashing their cross sections or label artwork.
 k.add=(g,key,x=0,y=0,z=0,rot=null,scl=null)=>{let localCentre=0;if(x===0){g.computeBoundingBox();const c=(g.boundingBox.min.x+g.boundingBox.max.x)*.5;if(Math.abs(c)>1){localCentre=c;g.translate(-c,0,0);}}return parent.add(g,key,3.50+(x+localCentre-4.36)*.68,y,z,rot,scl);};
 const q={...TIKI_DETAILS.cocktail,x:4.36},y=q.top;
 k.box('wood',q.x,.54,q.z,q.w-.13,1.06,q.d-.10,.05);k.box('counter',q.x,y-.075,q.z,q.w,.15,q.d,.065);
 for(let x=q.x-q.w/(2*.68)+.12;x<q.x+q.w/(2*.68);x+=.20)k.cyl('bamboo',x,.52,q.z+q.d/2-.04,.039,.044,.98,8);
 // The photographed bamboo pillars are on both planes, not all flattened into the rear wall.
 for(const [x,z]of[[2.57,-4.97],[2.96,-6.30],[4.14,-6.32],[6.23,-6.30]]){k.cyl('bamboo',x,1.70,z,.074,.095,3.32,10);for(const yy of[.45,.94,1.55,2.12,2.78,3.1]){k.cyl('wood',x,yy,z,.092,.092,.035,10);torus(k,'rope',x,yy+.019,z,.095,.009);}}
 for(const [x,z,yy,w,h]of[[2.65,-4.92,2.65,.63,1.01],[3.12,-6.20,2.63,.62,1.01],[5.58,-6.22,2.48,.65,.95]])card(k,'lei',x,yy,z,w,h,-.06,[0,0,1,1],.06);
 k.box('bamboo',4.62,1.77,-6.43,2.36,2.99,.035,.009); // Deep, unlit hatch under the photographed thatched edge, framed by the existing bamboo.
 k.box('dark',2.29,1.96,-6.40,.88,1.55,.035,.015);
 k.box('wood',1.61,1.96,-6.32,.09,1.63,.13,.018);k.box('bamboo',2.96,1.96,-6.32,.10,1.63,.13,.017);
 k.box('wood',2.29,1.16,-6.27,1.05,.10,.24,.025);
 k.plane('fringe',2.30,2.80,-6.28,.98,.50,[0,0,0]);

 // Rear work surface ends 0.52 m behind the front counter, visibly independent.
 k.box('counter',4.66,.96,-6.18,2.05,.10,.54,.025);k.box('wood',4.66,.46,-6.21,1.99,.89,.39,.024);
 k.box('shelfBack',5.05,1.70,-6.43,1.78,1.52,.04,.012);k.box('wood',5.10,1.91,-6.22,1.73,.058,.43,.015);
 for(const xx of[3.82,6.35])k.box('bamboo',xx,1.7,-6.30,.11,1.6,.16,.020);
 for(const x of[4.54,5.08])k.beam('ivory',[x,1.76,-6.08],[x,2.28,-6.08],.012,8);
 const board=new T.Shape();board.moveTo(-.16,0);board.quadraticCurveTo(-.30,.58,-.18,1.58);board.quadraticCurveTo(-.08,1.95,0,2.06);board.quadraticCurveTo(.20,1.79,.23,1.28);board.quadraticCurveTo(.29,.4,.18,0);board.closePath();const bg=new T.ExtrudeGeometry(board,{depth:.04,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.017,bevelThickness:.015,curveSegments:20});k.add(bg,'blueMug',3.69,.69,-5.95,[0,-.05,-.07]);const front=new T.ShapeGeometry(board,20),fuv=front.attributes.uv,fp=front.attributes.position;for(let i=0;i<fuv.count;i++)fuv.setXY(i,(fp.getX(i)+.30)/.60,fp.getY(i)/2.06);uvRect(front,[.21547,.004604,.56906,.98757],0);k.add(front,'surfboard',3.69,.69,-5.888,[0,-.05,-.07]);
 // Low half-dome beside the board, giving its photographed broad yellow local glow.
 k.cyl('bronze',3.27,1.01,-6.03,.12,.14,.034,20);k.cyl('bronze',3.27,1.16,-6.03,.025,.032,.28,12);k.add(new T.SphereGeometry(.19,24,12,0,Math.PI*2,0,Math.PI/2),'warmShade',3.27,1.35,-6.03);torus(k,'bronze',3.27,1.35,-6.03,.19,.008);
 glass(k,2.77,y,-4.60,.071,.28);k.cyl('liquid',2.77,y+.12,-4.60,.060,.059,.18,22);iceCubes(k,2.77,y+.21,-4.60,7,.05,.022);card(k,'garnish',2.75,y+.21,-4.54,.13,.13,-.1,ATLAS[0],.01);card(k,'garnish',2.79,y+.29,-4.60,.13,.13,-.45,ATLAS[1],.018);
 shortGoblet(k,3.08,y,-4.59);
 bowl(k,3.44,y,-4.57,2,.128);bowl(k,3.45,y+.036,-4.57,1,.129);bowl(k,3.46,y+.071,-4.57,0,.132);k.tube('purple',[[3.44,y+.096,-4.57],[3.52,y+.25,-4.63],[3.57,y+.31,-4.67]],.0045,10);
 glass(k,3.85,y,-4.61,.048,.315,true,'greenGlass');k.cyl('liquid',3.85,y+.12,-4.61,.038,.038,.15,20);k.tube('purple',[[3.84,y+.06,-4.60],[3.85,y+.34,-4.63],[3.80,y+.38,-4.60]],.004,8);
 ashtray(k,4.49,y,-4.53);mosaicTumbler(k,4.23,y,-4.75,0);mosaicTumbler(k,4.72,y,-4.73,1);
 ceramicMug(k,'wahine',5.10,y,-4.68,.34,.088,-.12);ceramicMug(k,'brownMug',5.56,y,-4.71,.34,.084,-.12);
 for(const [x,z]of[[5.10,-4.68],[5.56,-4.71]]){card(k,'garnish',x+.008,y+.48,z,.21,.33,-.10,ATLAS[2],.018);card(k,'garnish',x+.008,y+.48,z,.21,.33,Math.PI/2,ATLAS[2],.018);}
 bowl(k,6.04,y,-4.64,1,.185);k.beam('steel',[6.03,y+.04,-4.64],[6.17,y+.18,-4.70],.012,8);
 ceramicMug(k,'blueMug',2.99,y,-5.17,.275,.084,-.14);umbrella(k,2.99,y+.40,-5.17,.116);goblet(k,3.63,y,-5.09);liquorBottle(k,3.90,y,-5.10,58,.88,0,false);
 k.box('blackMetal',3.20,y+.016,-4.92,.21,.030,.11,.015,.10);k.box('steel',3.20,y+.032,-4.92,.15,.007,.076,.008,.10);
 // Ten independent standing bottles, four inverted bottles and two empty dispenser rods behind the bar.
 for(let i=0;i<10;i++)liquorBottle(k,4.06+i*.228,1.012,-6.15+(i%2)*.08,48+i,.93+(i%3)*.08,.04*(i%3-1),true);
 k.box('steel',5.14,1.70,-6.04,1.37,.055,.09,.014);k.box('greenCeramic',5.14,1.73,-6.01,1.48,.085,.09,.012);
 for(let i=0;i<4;i++){const x=4.29+i*.557;k.beam('steel',[x,1.62,-6.25],[x,2.31,-6.25],.009,8);k.box('steel',x,2.32,-6.17,.14,.045,.20,.011);
  const tmp={m:k.m,add(g,key,a=0,b=0,c=0,rot=null,scl=null){const mat=new T.Matrix4().compose(new T.Vector3(a,b,c),new T.Quaternion().setFromEuler(new T.Euler(...(rot||[0,0,0]))),new T.Vector3(...(scl||[1,1,1])));g.applyMatrix4(mat);g.rotateZ(Math.PI);g.translate(x,2.30,-6.10);return k.add(g,key);}};
  // helper methods route into a temporary kit so every cap and label inverts together
  for(const method of['cyl','tube'])tmp[method]=(...args)=>{const target=Object.create(k);target.add=tmp.add.bind(tmp);return target[method](...args);};liquorBottle(tmp,0,0,0,59+i,.87,0,false);
  lathe(k,'clearGlass',x,1.82,-6.1,[[.017,0],[.041,.035],[.048,.105],[.024,.135]],{segments:20});k.cyl('steel',x,1.785,-6.10,.018,.018,.07,12);k.beam('steel',[x,1.805,-6.07],[x,1.805,-5.99],.006,7);
 }
}
export function shelfBottles(k){for(const [row,y]of[.91,1.52,2.15,2.77].entries())for(let i=0;i<12;i++){const index=i+row*12,z=.48+i*.280+(i%3===1?.035:0);liquorBottle(k,6.20+(i%4===0?.05:0),y+.034,z,index,.97+(i%4)*.035,-Math.PI/2+(i%5-2)*.033,i%3!==0);}}
function largeIdol(k){const q=TIKI_DETAILS.idol;
 k.add(new T.CylinderGeometry(q.r*.95,q.r*1.03,q.h,32,20,false,Math.PI/2,Math.PI), 'idolWood',q.x,q.h/2,q.z,[0,q.yaw,0]);
 const g=gridSurface((u,v)=>{const x=(u-.5)*.85,y=v*q.h;let depth=.29+Math.sqrt(Math.max(0,1-((u-.5)*1.9)**2))*.14;const ga=(a,b)=>Math.exp(-Math.pow(a/b,2));depth+=.085*ga(x,.12)*ga(v-.52,.10);depth+=.075*ga(Math.abs(x)-.19,.11)*ga(v-.65,.045);depth-=.08*ga(Math.abs(x)-.18,.105)*ga(v-.59,.045);depth-=.115*ga(x,.28)*ga(v-.30,.09);depth+=.027*Math.sin(v*80.)*ga(v-.80,.1);return[x,y,depth];},56,90);k.add(g,'idolFace',q.x,0,q.z,[0,q.yaw,0]);for(const side of[-1,1]){const sideG=gridSurface((u,v)=>[side*(.42-.018*(1-u)),v*q.h,u*.334],2,24);k.add(sideG,'idolWood',q.x,0,q.z,[0,q.yaw,0]);}
 torus(k,'idolWood',q.x,.045,q.z,.44,.028);k.cyl('idolWood',q.x,3.31,q.z,.45,.44,.06,32);
}
function lantern(k,x,y,z){
 lathe(k,'bronze',x,y,z,[[0,0],[.13,0],[.135,.023],[.115,.054],[.085,.080],[.078,.14]],{segments:28});
 lathe(k,'clearGlass',x,y,z,[[.072,.09],[.109,.15],[.104,.31],[.07,.38],[.063,.40]],{segments:28});
 lathe(k,'bronze',x,y,z,[[.12,.38],[.116,.402],[.083,.42],[.072,.45],[.073,.475],[.035,.48]],{segments:24});k.cyl('lanternGlow',x,y+.24,z,.075,.078,.19,24);
 for(const s of[-1,1])k.tube('bronze',[[x+s*.115,y+.036,z],[x+s*.16,y+.15,z],[x+s*.15,y+.39,z],[x+s*.07,y+.46,z]],.014,20);
 k.tube('bronze',[[x-.12,y+.36,z],[x-.11,y+.47,z],[x,y+.515,z],[x+.11,y+.47,z],[x+.12,y+.36,z]],.009,24);
 torus(k,'bronze',x,y+.23,z,.116,.007,[Math.PI/2,0,0]);for(const yy of[.145,.315])torus(k,'bronze',x,y+yy,z,.111,.008,[Math.PI/2,0,0]);
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
 glass(k,3.75,q.y,3.43,.069,.20);for(let i=0;i<37;i++){const a=i*2.39996,r=.047*Math.sqrt((i+.5)/37),x=3.75+Math.cos(a)*r,z=3.43+Math.sin(a)*r;k.beam('ivory',[x,q.y+.024,z],[x+Math.cos(a)*.025,q.y+.35+(i%3)*.018,z+Math.sin(a)*.025],.0035,5);}
 toyVan(k,3.62,q.y,3.91);k.box('bronze',6.625,1.86,4.95,.032,.60,.75,.013);k.plane('beerSign',6.602,1.86,4.95,.73,.58,[0,-Math.PI/2,0]);
 const rx=4.94,rz=4.80;k.cyl('bronze',rx,.065,rz,.13,.17,.08,18);k.beam('steel',[rx,.08,rz],[rx,1.91,rz],.011,8);
 for(let j=0;j<4;j++){const yy=.90+j*.22;torus(k,'steel',rx,yy,rz,.135,.0045,[Math.PI/2,0,0],20);for(const side of[-1,1]){k.beam('steel',[rx,yy,rz],[rx+side*.15,yy+.06,rz],.004,6);card(k,'barAccents',rx+side*.12,yy+.09,rz+.02,.14,.18,side*.16,ATLAS[1],.004);}}
 card(k,'lily',rx,1.22,rz+.15,.24,.30,.2,ATLAS[3],.035);
 for(const zz of[4.64,5.26])for(const yy of[1.62,2.10])k.sphere('steel',6.592,yy,zz,.006,.006,.006);
}
export function blackPendant(k,x,y,z,r=.32){k.beam('blackMetal',[x,3.34,z],[x,y+.24,z],.012,8);lathe(k,'blackMetal',x,y,z,[[r,0],[r+.008,.012],[.07,.39],[.045,.41],[.04,.445]],{segments:32});lathe(k,'ivory',x,y+.004,z,[[r-.012,0],[.062,.366]],{segments:24});k.sphere('bulb3',x,y+.09,z,.032,.051,.032);k.cyl('blackMetal',x,3.32,z,.07,.07,.036,16);torus(k,'blackMetal',x,y,z,r,.007);}
