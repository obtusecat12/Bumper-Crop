import {addPlazaMemory} from './plaza-memory.js?v=59';
import * as T from './vendor/three.module.min.js';
import {UrbanBatch} from './urban-batch.js?v=59';
import * as P from './urban-props.js?v=59';
import * as S from './urban-smallprops.js?v=59';
import {adFor,adFace} from './advertising-assets.js?v=59';
import {posterStand,monumentSign,poleSign,googieSign} from './advertising-structures.js?v=59';
const PI=Math.PI;
const place=(b,x,y,z,ry,fn,args={})=>{b.push(x,y,z,ry);fn(b,args);b.pop();};
function mesh(b,key,p,uv,ix){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p.flat(),3));g.setAttribute('uv',new T.Float32BufferAttribute(uv.flat(),2));g.setIndex(ix);g.computeVertexNormals();b.add(g,key,0,0,0);g.dispose();}
export const PATIO_RECT=[34,44,32,61];
export const PATIO_TABLES=[[37,35.3,.07,true],[40.3,42,-.12,true],[36.8,49.2,.09,true],[37,55.6,-.18,false]];
function chair(b){
 for(const x of[-.235,.235]){for(const z of[-.21,.22])b.rod('photoSteel',[x*1.12,0,z*1.1],[x,.49,z],.018);b.rod('photoSteel',[x,.48,-.21],[x,.94,-.29],.021);b.rod('photoSteel',[x,.69,-.26],[x,.69,.24],.017);b.rod('photoSteel',[x,.69,.24],[x,.47,.21],.017);}
 b.box('district:wicker',0,.48,0,.47,.055,.45);b.box('district:wicker',0,.75,-.253,.46,.35,.055,0,.92);b.rod('photoSteel',[-.25,.95,-.29],[.25,.95,-.29],.022);b.solid(0,0,.55,.60);
}
function tablecloth(b,w,d){
 const nx=8,nz=6,p=[],uv=[],ix=[];
 for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){const x=(i/nx-.5)*w,z=(j/nz-.5)*d;p.push([x,.798+Math.sin(i*2.2+j)*.004,z]);uv.push([i/nx*w/1.4,j/nz*d/1.4]);}
 for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i;ix.push(a,a+nx+1,a+1,a+1,a+nx+1,a+nx+2);}mesh(b,'district:yellowLinen',p,uv,ix);
 // A continuous hanging skirt shares the exact top edge and has small gravity folds.
 for(let edge=0;edge<4;edge++){const pp=[],uu=[],ii=[],along=edge%2?d:w;
  for(let i=0;i<=12;i++){const t=i/12,v=(t-.5)*along,wave=Math.sin(t*PI*8)*.019,drop=.26+.027*Math.sin(t*PI*3+edge);let x=edge===0?v:edge===1?w/2:edge===2?-v:-w/2,z=edge===0?-d/2:edge===1?v:edge===2?d/2:-v;pp.push([x,.80,z],[x+(edge%2?Math.sign(x)*wave:0),.80-drop,z+(edge%2?0:Math.sign(z)*wave)]);uu.push([t*along/1.4,0],[t*along/1.4,drop/1.4]);if(i<12){const a=i*2;ii.push(a,a+1,a+2,a+1,a+3,a+2);}}
  mesh(b,'district:yellowLinen',pp,uu,ii);
 }
}
function umbrella(b,r=1.96){
 b.cylinder('photoSteel',0,.07,0,.33,.39,.14,16);b.rod('photoBronze',[0,.12,0],[0,3.21,0],.036);
 const p=[],uv=[],ix=[],n=16;
 for(let i=0;i<=n;i++){const a=i*PI*2/n;for(let k=0;k<4;k++){const rr=[0,.25,.77,1][k]*r,y=[3.18,3.09,2.77,2.61][k]+(k===3&&i%2?.035:0);p.push([Math.cos(a)*rr,y,Math.sin(a)*rr]);uv.push([.5+Math.cos(a)*rr/(r*2),.5+Math.sin(a)*rr/(r*2)]);}if(i<n)for(let k=0;k<3;k++){const a=i*4+k;ix.push(a,a+4,a+1,a+1,a+4,a+5);}}
 mesh(b,'district:burgundyCanvas',p,uv,ix);b.sphere('photoBronze',0,3.22,0,.08,.045,.08);
 for(let i=0;i<8;i++){const a=i*PI/4;for(const[r0,r1,y0,y1]of[[0,.5,2.99,3.02],[.5,1.51,3.02,2.75],[1.51,1.96,2.75,2.59]])b.rod('photoSteel',[Math.cos(a)*r0,y0,Math.sin(a)*r0],[Math.cos(a)*r1,y1,Math.sin(a)*r1],.014);b.rod('photoSteel',[0,2.37,0],[Math.cos(a)*.82,2.96,Math.sin(a)*.82],.013);}
}
function patioTable(b,shade){
 b.box('district:benchWood',0,.75,0,1.68,.075,1.04);for(const x of[-.65,.65])for(const z of[-.34,.34])b.rod('photoSteel',[x,.03,z],[x,.74,z],.025);tablecloth(b,1.90,1.25);
 for(const[x,z,ry]of[[-.5,-.92,0],[.49,-.91,0],[-.52,.91,PI],[.51,.95,PI]])place(b,x,0,z,ry,chair);
 if(shade)umbrella(b);b.solid(0,0,1.82,1.20);
 // One set table has been left ready for a customer who never arrives.
 b.cylinder('white',.55,.83,.05,.12,.12,.055,12);b.cylinder('white',.55,.881,.05,.059,.050,.088,12);b.cylinder('dark',.55,.927,.05,.046,.046,.006,12);b.box('white',-.50,.822,-.20,.28,.015,.19,0,.92);
}
function terraceLamp(b){b.box('district:paintMetal',0,.72,0,.07,1.44,.07);b.box('photoBronze',0,1.48,0,.34,.08,.34);b.sphere('lamp',0,1.67,0,.14,.19,.14);for(const x of[-.13,.13])for(const z of[-.13,.13])b.rod('photoBronze',[x,1.49,z],[x,1.85,z],.011);b.cylinder('photoBronze',0,1.9,0,0,.26,.12,8);b.circle(0,0,.16);}
function bicycle(b){const rims=[];for(const z of[-.57,.57]){const g=new T.TorusGeometry(.32,.024,5,20);g.rotateY(PI/2);b.add(g,'rubber',0,.34,z);g.dispose();for(let k=0;k<12;k++){const a=k*PI/6;b.rod('photoSteel',[0,.34,z],[0,.34+Math.sin(a)*.29,z+Math.cos(a)*.29],.004);}rims.push([0,.34,z]);}const pedal=[0,.34,-.06],seat=[0,.84,-.23],head=[0,.86,.34];for(const[a,c]of[[rims[0],pedal],[rims[0],seat],[seat,pedal],[pedal,head],[seat,head],[head,rims[1]]])b.rod('green',a,c,.019);b.box('rubber',0,.88,-.26,.16,.045,.27);b.rod('metal',head,[0,1.02,.35],.016);b.rod('metal',[-.28,1.02,.35],[.28,1.02,.35],.016);b.solid(0,0,.56,1.8);}
// Assemble then rotate the entire object about its centre of mass. All rods,
// labels and wheels share the same pose; the paving itself occludes buried parts.
export const CART_POSE={x:45.6,y:-.27,z:55,rx:.61,ry:.55,rz:-.27};
export const EMBEDDED_PACKAGES=[
 {key:'cereal',x:45.10,y:.13,z:54.03,w:.23,h:.35,d:.075,rx:.58,ry:.44,rz:-.51},
 {key:'crackers',x:46.34,y:.16,z:54.61,w:.16,h:.27,d:.07,rx:-.43,ry:-.52,rz:.72},
 {key:'juice',x:45.04,y:.13,z:55.91,w:.11,h:.24,d:.105,rx:.39,ry:1.14,rz:-.27},
 {key:'chips',x:46.33,y:.09,z:55.44,w:.19,h:.25,d:.06,rx:1.02,ry:-.20,rz:.43},
 {key:'crackers',x:44.75,y:.095,z:54.62,w:.16,h:.27,d:.07,rx:-.73,ry:1.65,rz:-.82}
];
function assembled(b,fn,p){const local=new UrbanBatch(b.mats);fn(local);for(const[key,parts]of local.parts)for(const g of parts){b.add(g,key,p.x,p.y,p.z,1,1,1,p.ry||0,p.rx||0,p.rz||0);g.dispose();}}
function cartMesh(b){
 const ring=height=>{const t=(height-.46)/.54,w=.46+.19*t,d=.61+.28*t;return[[-w/2,height,-d/2],[w/2,height,-d/2],[w/2,height,d/2],[-w/2,height,d/2]];};
 for(let k=0;k<=6;k++){const p=ring(.46+k*.09);for(let i=0;i<4;i++)b.rod('photoSteel',p[i],p[(i+1)%4],k===6?.014:.0065);}
 const a=ring(.46),c=ring(1);for(let edge=0;edge<4;edge++)for(let i=0;i<9;i++){const t=i/8,p=a[edge].map((v,j)=>v+(a[(edge+1)%4][j]-v)*t),q=c[edge].map((v,j)=>v+(c[(edge+1)%4][j]-v)*t);b.rod('photoSteel',p,q,.0065);}
 for(const x of[-.28,.28]){b.rod('photoSteel',[x,.12,-.57],[x,.92,-.50],.02);b.rod('photoSteel',[x,.12,-.57],[x,.12,.43],.02);b.rod('photoSteel',[x,.92,-.50],[x,1.08,-.57],.02);for(const z of[-.50,.39])b.cylinder('rubber',x,.09,z,.078,.078,.05,10,0,PI/2);}
 b.rod('blue',[-.29,1.08,-.57],[.29,1.08,-.57],.029);b.box('red',0,.81,-.445,.38,.12,.018); 
}

function carton(b,q){
 b.box(q.key==='juice'?'green':'photoCream',0,0,0,q.w,q.h,q.d);
 // The image belongs to the outer face; never intersects the supporting carton.
 b.plane('district:'+q.key,0,0,q.d/2+.0012,q.w*.98,q.h*.98);
 b.plane('district:'+q.key,0,0,-q.d/2-.0012,q.w*.98,q.h*.98,PI);
 if(q.key==='juice'){b.box('white',0,q.h/2+.008,0,q.w,.016,q.d);b.box('white',0,q.h/2+.024,0,.01,.022,q.d*.75);}
}
export function sunkenCart(b){assembled(b,cartMesh,CART_POSE);b.solid(CART_POSE.x,CART_POSE.z,1.13,1.46,CART_POSE.ry);
 for(const p of EMBEDDED_PACKAGES)assembled(b,bb=>carton(bb,p),p);
}
function drinkingFountain(b){
 b.box('district:terrazzo',0,.40,0,.42,.80,.44);b.box('district:paintMetal',0,.85,0,.58,.10,.58);
 b.cylinder('photoSteel',0,.911,0,.22,.20,.026,20);b.cylinder('dark',0,.927,.10,.038,.038,.009,12);
 b.rod('photoSteel',[-.17,.914,-.15],[-.17,1.01,-.15],.025);b.rod('photoSteel',[-.17,1.01,-.15],[-.11,1.01,-.15],.025);
 b.cylinder('photoSteel',.213,.71,.08,.033,.033,.025,12,0,PI/2);b.solid(0,0,.62,.62);
}
function plazaTable(b){
 b.cylinder('district:terrazzo',0,.42,0,.25,.39,.84,16);b.cylinder('district:terrazzo',0,.87,0,.86,.84,.09,32);
 // Stationary chessboard inset into a real slab, with no duplicate table surface.
 const g=new T.PlaneGeometry(.49,.49);g.rotateX(-PI/2);b.add(g,'photoCream',0,.920,0);g.dispose();
 for(let z=0;z<8;z++)for(let x=0;x<8;x++)if((x+z)%2===0)b.box('dark',(x-3.5)*.060,.922,(z-3.5)*.060,.060,.004,.060);
 for(const x of[-1.13,1.13]){b.cylinder('district:terrazzo',x,.24,0,.23,.28,.48,16);b.cylinder('district:benchWood',x,.52,0,.35,.34,.075,24);b.circle(x,0,.40);}
 b.circle(0,0,.87);
}
function lowPlanter(b){b.box('district:terrazzo',0,.30,0,1.14,.60,1.14);b.box('bark',0,.61,0,.95,.025,.95);b.solid(0,0,1.15,1.15);for(const[x,z]of[[-.2,-.2],[.2,.2],[0,-.12]])b.sphere('foliage',x,.83,z,.33,.30,.33);}
function serviceTrolley(b){
 for(const x of[-.32,.32])for(const z of[-.43,.43]){b.cylinder('rubber',x,.09,z,.085,.085,.045,10,0,PI/2);b.rod('district:paintMetal',[x,.09,z],[x,.78,z],.027);}
 for(const y of[.24,.77]){b.box('district:paintMetal',0,y,0,.70,.04,.95);for(const x of[-.34,.34])b.box('district:paintMetal',x,y+.06,0,.028,.12,.95);}
 for(const x of[-.32,.32])b.rod('district:paintMetal',[x,.78,-.43],[x,1.02,-.43],.027);b.rod('district:paintMetal',[-.32,1.02,-.43],[.32,1.02,-.43],.028);
 b.cylinder('blue',0,.45,.08,.15,.12,.35,14);b.rod('district:benchWood',[.20,.25,.20],[.25,1.40,.16],.019);b.solid(0,0,.85,1.06);
}
function plazaDetails(b){
 // Furniture forms occupied edges, leaving fountain access and the axis open.
 for(const[x,z,ry]of[[63.0,42,0],[62.2,58.9,.18],[33.1,53.5,PI/2]])place(b,x,.12,z,ry,plazaTable);
 for(const[x,z,ry]of[[63.3,39.7,-PI/2],[61.8,60,-PI/2]])place(b,x,.12,z,ry,drinkingFountain);
 for(const[x,z]of[[58.8,30.9],[63.0,53.4],[33.0,38.9]])place(b,x,.12,z,0,lowPlanter);
 place(b,68.75,.12,54.9,-.09,serviceTrolley);
 place(b,67.4,.12,30.9,PI/2,S.addBikeRack);
 place(b,61.7,.12,31.9,PI,S.addNewspaperBox,{color:'district:paintMetal',seed:571});
 // A forgotten takeaway cup on a bench, and folded stock on the service trolley.
 b.cylinder('white',56.4,.68,55,.043,.034,.11,12);b.cylinder('white',56.4,.741,55,.048,.048,.014,12);
 assembled(b,bb=>carton(bb,{key:'cereal',w:.23,h:.35,d:.075}),{x:68.62,y:1.075,z:55.09,ry:.14,rx:0,rz:0});
}
export function addClinicStreetlife(b,{potted}){
 // Occupied café terrace stays west of the fountain and the clear axial path.
 for(const[x,z,ry,shade]of PATIO_TABLES)place(b,x,.12,z,ry,bb=>patioTable(bb,shade));
 for(const[x,z,h]of[[34.8,32.9,2.3],[43.0,36.2,2.0],[34.8,43.2,2.45],[43.1,51.6,2.1],[35.2,58.5,1.9]])potted(b,x,z,h);
 for(const[x,z]of[[34.4,39.1],[43.2,58.8]])place(b,x,.12,z,0,terraceLamp);
 b.box('district:benchWood',35.6,.68,60.4,2.25,1.1,.84);b.box('photoGranite',35.6,1.26,60.4,2.35,.09,.95);b.solid(35.6,60.4,2.35,.95);adFace(b,adFor(8,'poster'),35.6,.75,59.972,1.80,.75,PI);
 place(b,43.9,.12,33.8,-PI/2,bb=>posterStand(bb,adFor(0,'poster'),0,0,1.2));
 sunkenCart(b);plazaDetails(b);addPlazaMemory(b);
 // Rear service strip: everything fits between the real wall and public footway.
 place(b,-13.7,.02,32.0,PI,S.addDumpster);place(b,-11.4,.02,32.0,PI,S.addDumpster);
 place(b,7.0,.02,32.0,PI,P.addBench);place(b,-7.9,.02,32.1,PI/2,bicycle);
 for(const[x,z,n]of[[4.7,31.7,3],[-16.7,31.8,2]]){b.box('district:benchWood',x,.08,z,1.18,.12,.84);for(let k=0;k<n;k++){b.box('district:benchWood',x+(k%2)*.14,.33+k*.40,z,.88,.40,.68);for(const sx of[-1,1])b.box('metal',x+(k%2)*.14+sx*.34,.33+k*.40,z+.348,.022,.38,.014);}b.solid(x,z,1.3,.9);}
 for(const x of[-3.7,-2.75]){b.box('district:paintMetal',x,1.65,30.83,.65,1.03,.23);b.rod('photoSteel',[x,.05,30.89],[x,5.7,30.89],.026);b.rod('photoSteel',[x,5.7,30.89],[x+.75,5.7,30.69],.026);b.cylinder('photoSteel',x,1.80,30.961,.16,.16,.06,12,PI/2);}
 b.box('photoSteel',1.22,4.43,31.12,3.0,.11,1.05);for(const x of[.1,2.3])b.rod('photoSteel',[x,4.43,31.62],[x,5.02,30.69],.023);b.box('lamp',1.22,3.39,30.86,.45,.09,.16);
 // A faded graphic belongs on the blank pharmacy return, not across workroom windows.
 adFace(b,adFor(21,'ghost'),22.4,4.82,31.512,5.2,5.2);
 for(const[x,z]of[[-18.4,33.1],[12.3,33.2],[24.0,33.3]])potted(b,x,z,1.3);
 place(b,14.8,.02,33.0,0,S.addNewspaperBox,{color:'blue',seed:155});place(b,17,.02,33.0,0,P.addTrashBin);
 b.box('photoSteel',10.25,1.7,30.36,.84,1.20,.12);adFace(b,adFor(7,'poster'),10.25,1.70,30.432,.76,1.09);
 for(let i=0;i<5;i++)b.box('rubber',-17.3+i*.37,.025,33.7+(i%2)*.08,.24,.007,.012,.2,.63);
 // Different support systems at entrances and beside service streets.
 place(b,69.2,0,-10.5,PI/2,bb=>poleSign(bb,adFor(1,'pylon'),0,0,3.1,6.15));
 place(b,69.1,.02,8.5,PI/2,bb=>monumentSign(bb,adFor(2,'monument'),0,0,3.0));
 place(b,71.8,.15,88.0,-PI/2,bb=>googieSign(bb,adFor(0,'googie'),0,0,3.0));
}
