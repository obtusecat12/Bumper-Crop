import * as T from './vendor/three.module.min.js';
import {adFor,adFace} from './advertising-assets.js?v=58';
const PI=Math.PI;
const place=(b,x,y,z,ry,fn)=>{b.push(x,y,z,ry);fn(b);b.pop();};
function geometry(b,key,p,uv,ix){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();b.add(g,key,0,0,0);g.dispose();}

// A small open-air shopping arcade: columns sit on the paving, the crown has
// 3.18m clearance, and all machinery occupies its eastern service edge.
function arcade(b){
 const x0=65.95,x1=69.55,z0=38.75,z1=52.8;
 for(const x of[66.18,69.3])for(const z of[39.05,43.05,48.5,52.45]){
  b.box('district:terrazzo',x,.12,z,.48,.24,.48);
  b.box('district:mallMosaic',x,1.44,z,.31,2.42,.31);
  b.box('photoCream',x,2.91,z,.35,.52,.35);
  b.box('photoCream',x,3.16,z,.55,.10,.55);b.solid(x,z,.49,.49);
 }
 for(const x of[x0,x1]){b.box('district:paintMetal',x,3.22,(z0+z1)/2,.10,.17,z1-z0);b.box('photoCream',x,3.36,(z0+z1)/2,.13,.15,z1-z0);}
 const archX=t=>x0+(x1-x0)*t,archY=t=>3.3+.69*Math.sin(t*PI);
 for(let j=0;j<7;j++){
  const a=z0+j*(z1-z0)/7+.035,c=z0+(j+1)*(z1-z0)/7-.035,p=[],u=[],ix=[];
  for(let i=0;i<=16;i++){const t=i/16;p.push(archX(t),archY(t),a,archX(t),archY(t),c);u.push(t,0,t,1);if(i<16){const k=i*2;ix.push(k,k+2,k+1,k+1,k+2,k+3);}}
  geometry(b,'plazaRoof',p,u,ix);
 }
 for(let j=0;j<=7;j++){const z=z0+j*(z1-z0)/7;for(let i=0;i<16;i++)b.rod('photoCream',[archX(i/16),archY(i/16)-.015,z],[archX((i+1)/16),archY((i+1)/16)-.015,z],.032);}
 for(const t of[.25,.5,.75])b.rod('photoCream',[archX(t),archY(t)-.015,z0],[archX(t),archY(t)-.015,z1],.018);
 for(const z of[41,46,50.7]){b.box('photoFrame',67.73,3.75,z,.87,.06,.17);b.box('lamp',67.73,3.711,z,.73,.013,.105);}
 // Downpipes, collars and ground gullies give the shelter a construction logic.
 for(const z of[z0+.1,z1-.1]){b.rod('photoSteel',[69.52,.18,z],[69.52,3.31,z],.032);for(const y of[.3,1.6,2.9])b.box('photoSteel',69.45,y,z,.17,.045,.05);b.box('metal',69.52,.131,z,.28,.02,.28);}
}
function payphone(b){
 const hood=new T.SphereGeometry(.51,18,12,PI,PI,0,PI);hood.scale(1,1.18,.72);
 b.add(hood,'plazaShell',0,1.55,0);hood.dispose();
 b.box('district:mallMosaic',0,.52,-.10,.34,1.04,.32);
 b.box('photoSteel',0,1.41,.045,.375,.65,.14);b.plane('district:payphoneFace',0,1.41,.121,.356,.624);
 b.box('photoSteel',0,1.045,.20,.55,.045,.44);
 // Separate receiver, cradle, protruding coin-return flap, and hanging cord.
 b.rod('rubber',[-.143,1.25,.187],[-.143,1.60,.187],.032);
 for(const y of[1.25,1.60])b.sphere('rubber',-.143,y,.179,.062,.059,.058);
 b.box('photoSteel',-.143,1.61,.135,.068,.025,.083);
 for(let i=0;i<72;i++){
  const pt=t=>{const a=t*PI*24;return[-.13+.019*Math.cos(a),1.23-.55*t,.18+.018*Math.sin(a)];};
  b.rod('rubber',pt(i/72),pt((i+1)/72),.006);
 }
 b.rod('rubber',[-.13,.68,.18],[.10,.84,.12],.01);
 b.box('photoSteel',.113,1.14,.138,.066,.048,.014);
 b.circle(0,0,.55);
}
function phoneIsland(b){
 for(const x of[-.60,.60])place(b,x,0,0,0,payphone);
 b.box('district:terrazzo',0,.14,-.07,2.37,.28,.79);b.solid(0,0,2.4,.9);
 b.box('district:paintMetal',0,2.25,-.16,2.38,.25,.11);
 const header=new T.PlaneGeometry(2.12,.20),uv=header.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i),.87+uv.getY(i)*.13);b.add(header,'district:payphoneFace',0,2.25,-.096);header.dispose();
}
function vending(b){
 b.box('district:paintMetal',0,.98,0,.96,1.93,.79);b.box('rubber',0,.12,.419,.87,.16,.034);
 b.plane('district:colaMachine',0,1.045,.398,.89,1.77);
 for(const x of[-.41,.41])b.box('photoSteel',x,.07,0,.055,.14,.62);
 for(let i=0;i<8;i++)b.box('photoSteel',.394,1.45-i*.132,.404,.032,.054,.014,0,.82);
 b.box('dark',-.037,.385,.411,.424,.122,.018);b.box('photoSteel',-.037,.318,.43,.443,.018,.048);
 // The lower grille has real depth, away from the printed face and feet.
 for(let i=0;i<7;i++)b.box('photoSteel',-.29+i*.093,.16,.434,.057,.018,.02);
 b.solid(0,0,1.03,.87);
}
function directory(b){
 for(const x of[-.50,.50]){b.box('district:paintMetal',x,1.13,0,.085,2.26,.11);b.box('photoSteel',x,.038,0,.26,.07,.35);}
 b.box('district:paintMetal',0,1.43,0,1.17,1.61,.18);
 b.plane('district:mallDirectory',0,1.43,.095,1.04,1.48);b.plane('district:mallDirectory',0,1.43,-.095,1.04,1.48,PI);
 b.box('photoBronze',0,2.27,0,1.31,.07,.32);b.solid(0,0,1.35,.38);
}
function photoKiosk(b){
 b.box('district:mallMosaic',0,1.25,0,2.55,2.5,1.42);b.solid(0,0,2.58,1.45);
 b.box('photoFrame',0,1.45,.728,2.12,1.47,.05);
 for(let i=0;i<18;i++)b.box('photoSteel',0,.78+i*.074,.774,2.02,.063,.029,0,.83+(i%3)*.025);
 b.box('photoBronze',0,.722,.88,2.30,.08,.39);b.box('photoCream',0,2.53,0,2.88,.18,1.80);
 b.sign('photo',0,2.25,.766,2.05,.31);
 for(const x of[-1.04,1.04])b.box('photoFrame',x,1.37,.804,.041,1.31,.06);
 b.box('photoSteel',.55,1.36,.812,.16,.027,.048);
 b.box('lamp',0,2.398,.84,1.03,.025,.13);
 adFace(b,adFor(32,'poster'),1.285,1.56,0,.79,1.17,PI/2);
 b.rod('photoSteel',[-1.22,.10,-.63],[-1.22,2.59,-.63],.026);
}
function clock(b){
 b.cylinder('district:terrazzo',0,.13,0,.37,.43,.26,12);
 b.cylinder('district:paintMetal',0,1.92,0,.09,.16,3.60,12);
 b.cylinder('photoBronze',0,3.90,0,.58,.58,.25,32,PI/2);
 for(const sign of[-1,1]){
  const g=new T.CircleGeometry(.529,32);b.add(g,'photoCream',0,3.90,sign*.129,1,1,1,sign<0?PI:0);g.dispose();
  for(let i=0;i<12;i++){const a=i*PI/6;b.rod('district:paintMetal',[Math.sin(a)*.444,3.90+Math.cos(a)*.444,sign*.135],[Math.sin(a)*.49,3.90+Math.cos(a)*.49,sign*.135],.014);}
  // Stopped at 11:08. The furniture is maintained, but no time ever advances.
  b.rod('dark',[0,3.90,sign*.145],[-.12*sign,4.14,sign*.145],.023);
  b.rod('dark',[0,3.90,sign*.15],[.29*sign,4.16,sign*.15],.013);
  b.sphere('photoBronze',0,3.90,sign*.154,.042,.042,.018);
 }
 b.circle(0,0,.44);
}
function geometricPlanter(b){
 // Alternating inward/outward corners recall mid-century mall planting courts.
 const points=Array.from({length:16},(_,i)=>{const a=i*PI/8,r=i%2?1.10:1.58;return[Math.cos(a)*r,Math.sin(a)*r];});
 const p=[],u=[],ix=[];
 for(let i=0;i<16;i++){
  const a=points[i],c=points[(i+1)%16],dx=c[0]-a[0],dz=c[1]-a[1],len=Math.hypot(dx,dz),angle=Math.atan2(dx,dz);
  b.box('district:mallMosaic',(a[0]+c[0])/2,.29,(a[1]+c[1])/2,.16,.58,len+.055,angle);
  b.box('district:terrazzo',(a[0]+c[0])/2,.59,(a[1]+c[1])/2,.27,.07,len+.08,angle);
  if(i%4<2){const mx=(a[0]+c[0])/2,mz=(a[1]+c[1])/2,rr=Math.hypot(mx,mz);b.box('district:benchWood',mx+mx/rr*.28,.46,mz+mz/rr*.28,.44,.095,len+.1,angle);for(const t of[-.3,.3])b.box('district:terrazzo',mx+dx*t+mx/rr*.29,.23,mz+dz*t+mz/rr*.29,.18,.46,.18);}
  const n=p.length/3;p.push(0,.53,0,a[0],.53,a[1],c[0],.53,c[1]);u.push(.5,.5,a[0],a[1],c[0],c[1]);ix.push(n,n+2,n+1);
 }
 geometry(b,'bark',p,u,ix);b.circle(0,0,1.90);
 for(let i=0;i<10;i++){const a=i*2.4,r=.25+(i%3)*.20,x=Math.cos(a)*r,z=Math.sin(a)*r;for(let j=0;j<3;j++)b.plane('photoLeaf',x,.86+(i%3)*.07,z,.86,.62,j*PI/3,0,.82);}
}
function arcadeBench(b){
 b.box('district:mallMosaic',0,.30,0,.55,.60,2.08);b.box('district:terrazzo',-.11,.63,0,.77,.065,2.2);
 for(let i=0;i<5;i++)b.box('district:benchWood',-.12+i*.11,.69,0,.084,.075,2.02);
 b.box('district:paintMetal',.25,.91,0,.065,.39,2.04);b.solid(0,0,.83,2.22);
}
export const PLAZA_MEMORY_PLACEMENTS={arcade:[65.95,69.55,38.75,52.8],phone:[63.3,45.25],directory:[55.6,38.2],kiosk:[32.2,30.75],clock:[52.3,36.55],planter:[54,31.5]};
export function addPlazaMemory(b){
 b.push(0,.12,0);arcade(b);
 place(b,63.3,0,45.25,-PI/2,phoneIsland);
 place(b,68.82,0,44.25,-PI/2,vending);place(b,68.85,0,50.55,0,arcadeBench);
 place(b,55.6,0,38.2,-.20,directory);place(b,32.2,0,30.75,0,photoKiosk);
 place(b,52.3,0,36.55,.20,clock);place(b,54,0,31.5,0,geometricPlanter);
 // Ash urn, wall-mounted timetable and a maintenance hose kept out of the aisle.
 b.cylinder('district:terrazzo',68.8,.39,47.1,.20,.25,.78,12);b.cylinder('photoSteel',68.8,.802,47.1,.176,.176,.025,16);b.cylinder('dark',68.8,.817,47.1,.11,.11,.009,12);b.circle(68.8,47.1,.28);
 b.box('photoFrame',69.26,1.59,42.1,.10,1.13,.78);b.plane('district:mallDirectory',69.202,1.59,42.1,.71,1.06,-PI/2);
 b.box('district:paintMetal',69.27,.95,42.1,.07,1.9,.1);b.circle(69.27,42.1,.15);
 for(let i=0;i<4;i++){const g=new T.TorusGeometry(.31+i*.024,.012,5,28);g.rotateX(-PI/2);b.add(g,'rubber',69.03,.025,52.1);g.dispose();}
 b.pop();
}
