// V147 D3 Maltose Market densify — goods batch 2 (spec notes/spec-1024-maltose-dense.md), block (1,-1):
// hammered copper kettles + saucepans, enamelware (white/blue-rim mugs, blue graniteware coffee pots, basins), toys (mohair
// teddy bears, lithographed tin robots, wooden toy trucks, spinning tops), shoes + boots (lofted lasts, welted soles, shafts),
// handbags + tweed suitcases (bound edges, brass locks), mirrors (oval tilting vanity + big leaning wall mirror, foxed silvering),
// typewriters (sloped body, 40 keys on stems, platen + paper), small furniture (3-leg stools, painted side cabinets with
// drawer + door + turned legs), rug rolls (face-out Persian / kilim, spiral ends, unrolled tail), globes on stands, silver tea
// sets + candlesticks; and the far-table densify: real pieces on every far M4 table + the last D1 table + 3 bare blankets.
// One atlas goods147b (bc/tools/maltose147_d3_assets.py <- art-v147/m147c_*) = baseColor + normal + roughness/metalness (-m).
// Same block-local frame as maltose145*.js; imports at ?v=147a (TB145 / TB147 / G must be the very same module instances).
import * as T from './vendor/three.module.min.js';
import {G,TB145} from './maltose145-stalls.js?v=147a';
import {TB147} from './maltose147-stalls.js?v=147a';
const A=new URL('./assets/l11-v147/',import.meta.url).href,PI=Math.PI,Y0=.15,YT=Y0+.745,V='?v=147c';
function tex(n,srgb=true){const t=new T.TextureLoader().load(A+n+'.webp'+V);if(srgb)t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;t.magFilter=T.NearestFilter;return t;}
let M=null;
function addMats(m){if(m.m147goodsb)return;if(!M){const rm=tex('goods147b-m',false);
 M={m147goodsb:new T.MeshStandardMaterial({map:tex('goods147b'),normalMap:tex('goods147b-n',false),roughnessMap:rm,metalnessMap:rm,roughness:1,metalness:1,vertexColors:true,side:T.DoubleSide})};
 for(const[k,v]of Object.entries(M))v.name='V147 '+k;}Object.assign(m,M);}
const hash=(i)=>{let x=Math.sin(i*127.1+311.7)*43758.5453;return x-Math.floor(x);};
let g=null,MT=null;
const K='m147goodsb',e=.006;
// atlas: cell k (8 x 8), u/v in [0,1] (v = 1 at the cell top); w x h cells for the paintings
const cell=(k,u,v,w=1,h=1)=>[((k&7)+e+u*(w-2*e))/8,(8-(k>>3)-h+e+v*(h-2*e))/8];
const sub=(k,u0,u1,v0,v1)=>(u,v)=>cell(k,u0+(u1-u0)*u,v0+(v1-v0)*v);
const rad=(k,cu,cv,rr)=>(a,r)=>cell(k,cu+Math.cos(a)*r*rr,cv+Math.sin(a)*r*rr);   // radial: centre (cu,cv) in cell units, radius rr
// ---- transforms (item-local -> block-local); C composes right to left
const Tr=(x,y,z)=>v=>[v[0]+x,v[1]+y,v[2]+z];
const RY=a=>{const c=Math.cos(a),s=Math.sin(a);return v=>[v[0]*c+v[2]*s,v[1],-v[0]*s+v[2]*c];};
const RX=a=>{const c=Math.cos(a),s=Math.sin(a);return v=>[v[0],v[1]*c-v[2]*s,v[1]*s+v[2]*c];};
const RZ=a=>{const c=Math.cos(a),s=Math.sin(a);return v=>[v[0]*c-v[1]*s,v[0]*s+v[1]*c,v[2]];};
const C=(...f)=>v=>f.reduceRight((p,fn)=>fn(p),v);
const O=(x,y,z,ry=0)=>C(Tr(x,y,z),RY(ry));
const gr=(key,nu,nv,P,UV,o,tone=1)=>key&&g.grid(key,nu,nv,(u,v)=>o(P(u,v)),UV,tone);
const mk=(k)=>MT[k]?k:null;
// lathe about local y: prof [[r,y],..]; UV(u,i,r,y,arc) -> uv
function lathe(key,o,prof,UV,{n=14,wob=null,tone=1}={}){if(!key)return;const N=prof.length-1,arc=[0];for(let i=1;i<=N;i++)arc.push(arc[i-1]+Math.hypot(prof[i][0]-prof[i-1][0],prof[i][1]-prof[i-1][1]));
 gr(key,n,N,(u,v)=>{const i=Math.round(v*N),p=prof[i],a=-u*2*PI,w=wob?wob(a,p[1]):1;return[p[0]*w*Math.cos(a),p[1],p[0]*w*Math.sin(a)];},(u,v)=>{const i=Math.round(v*N);return UV(u,i,prof[i][0],prof[i][1],arc[i]/arc[N]);},o,tone);}
const latheT=(tu,tv)=>(u,i,r,y,s)=>[u*tu,s*tv];                 // tiling materials (brass / chrome / glass)
const latheC=(k,rep=1)=>(u,i,r,y,s)=>cell(k,(u*rep)%1.0001,s);   // wrap a cell around
const latheR=(k,R,cu=.5,cv=.5,rr=.5)=>(u,i,r)=>rad(k,cu,cv,rr)(-u*2*PI,Math.min(1,r/R));   // radial (top / front discs)
function sweep(key,o,path,r,{n=6,tu=.06,tv=.2,UV=null,tone=1}={}){if(!key)return;const P=path.map(p=>new T.Vector3(...p)),N=P.length-1,R=(i)=>Array.isArray(r)?r[i]:r;
 const t=P.map((p,i)=>P[Math.min(N,i+1)].clone().sub(P[Math.max(0,i-1)]).normalize());let nr=new T.Vector3(0,1,0);if(Math.abs(t[0].y)>.9)nr.set(1,0,0);nr=nr.sub(t[0].clone().multiplyScalar(nr.dot(t[0]))).normalize();
 const F=[nr.clone()];for(let i=1;i<=N;i++)F.push(F[i-1].clone().sub(t[i].clone().multiplyScalar(F[i-1].dot(t[i]))).normalize());
 const L=[0];for(let i=1;i<=N;i++)L.push(L[i-1]+P[i].distanceTo(P[i-1]));
 gr(key,n,N,(u,v)=>{const i=Math.round(v*N),a=-u*2*PI,b=new T.Vector3().crossVectors(t[i],F[i]);return P[i].clone().addScaledVector(F[i],Math.cos(a)*R(i)).addScaledVector(b,Math.sin(a)*R(i)).toArray();},
  UV||((u,v)=>[u*2*PI*R(0)/tu,L[Math.round(v*N)]/tv]),o,tone);}
const arc=(c,r,a0,a1,k=8,pl='xy')=>{const p=[];for(let i=0;i<=k;i++){const a=a0+(a1-a0)*i/k,x=Math.cos(a)*r,y=Math.sin(a)*r;p.push(pl==='xy'?[c[0]+x,c[1]+y,c[2]]:pl==='xz'?[c[0]+x,c[1],c[2]+y]:[c[0],c[1]+y,c[2]+x]);}return p;};
// box: bottom-centre c, faces 0 +z,1 -z,2 +x,3 -x,4 top,5 bottom; F(f,u,v)
function box(key,o,c,w,h,d,F,tone=1){const[x,y,z]=c,X0=x-w/2,X1=x+w/2,Y1=y+h,Z0=z-d/2,Z1=z+d/2,L=(p,q,s)=>p.map((e2,i)=>e2+(q[i]-e2)*s);
 const Q=(f,a,b,cc,dd,t=tone)=>gr(key,1,1,(u,v)=>L(L(a,b,u),L(dd,cc,u),v),(u,v)=>F(f,u,v),o,t);
 Q(0,[X0,y,Z1],[X1,y,Z1],[X1,Y1,Z1],[X0,Y1,Z1]);Q(1,[X1,y,Z0],[X0,y,Z0],[X0,Y1,Z0],[X1,Y1,Z0]);Q(2,[X1,y,Z1],[X1,y,Z0],[X1,Y1,Z0],[X1,Y1,Z1]);
 Q(3,[X0,y,Z0],[X0,y,Z1],[X0,Y1,Z1],[X0,Y1,Z0]);Q(4,[X0,Y1,Z1],[X1,Y1,Z1],[X1,Y1,Z0],[X0,Y1,Z0]);Q(5,[X0,y,Z0],[X1,y,Z0],[X1,y,Z1],[X0,y,Z1],tone*.7);}
const tileF=(w,h,d,t=.2)=>(f,u,v)=>{const a=f<2?w:f<4?d:w,b=f<4?h:d;return[u*a/t,v*b/t];};
// flat disc in the local xy plane facing +z (both sides), radial uv
function disc(o,c,r,UVr,{n=20,back=null}={}){gr(K,n,2,(u,v)=>[c[0]+Math.cos(u*2*PI)*r*v,c[1]+Math.sin(u*2*PI)*r*v,c[2]],(u,v)=>UVr(u*2*PI,v),o);
 if(back!==false)gr(K,n,2,(u,v)=>[c[0]+Math.cos(-u*2*PI)*r*v,c[1]+Math.sin(-u*2*PI)*r*v,c[2]-.0008],(u,v)=>(back||UVr)(-u*2*PI,v),o,.9);}
// extrude a star-shaped closed outline (xy, CCW) from z0 to z1; front/back fans from ctr, side wall along the outline
function extrude(key,o,pts,z0,z1,{ctr=[0,0],front,back,side,tone=1}){const n=pts.length,P=i=>pts[i%n];
 for(const[z,F,s]of[[z1,front,1],[z0,back||front,-1]])gr(key,n,1,(u,v)=>{const p=P(Math.round(u*n)),q=s>0?p:p;const x=ctr[0]+(q[0]-ctr[0])*v,y=ctr[1]+(q[1]-ctr[1])*v;return s>0?[x,y,z]:[x,y,z];},(u,v)=>{const p=P(Math.round(u*n));return F(ctr[0]+(p[0]-ctr[0])*v,ctr[1]+(p[1]-ctr[1])*v);},o,s>0?tone:tone*.85);
 const L=[0];for(let i=1;i<=n;i++)L.push(L[i-1]+Math.hypot(P(i)[0]-P(i-1)[0],P(i)[1]-P(i-1)[1]));
 gr(key,n,1,(u,v)=>{const p=P(Math.round(u*n));return[p[0],p[1],z0+(z1-z0)*v];},(u,v)=>side(L[Math.round(u*n)]/L[n],v),o,tone*.92);}
const rrect=(w,h,r,k=3,top=true,bot=true)=>{const p=[],cs=[[w/2-r,r,-PI/2,bot],[w/2-r,h-r,0,top],[-w/2+r,h-r,PI/2,top],[-w/2+r,r,PI,bot]];   // y 0..h, CCW
 for(const[cx,cy,a0,rd]of cs){if(!rd){p.push([Math.sign(cx)*w/2,cy>h/2?h:0]);continue;}for(let j=0;j<=k;j++){const a=a0+PI/2*j/k;p.push([cx+Math.cos(a)*r,cy+Math.sin(a)*r]);}}return p;};
const planar=(k,x0,x1,y0,y1)=>(x,y)=>cell(k,(x-x0)/(x1-x0),(y-y0)/(y1-y0));
const Sc=(a,b,c)=>v=>[v[0]*a,v[1]*b,v[2]*c];
const fur=(u,i,r,y,s)=>cell(10,u,s);
// ellipsoid (lathe of a half circle, scaled)
function ell(key,o,c,rx,ry,rz,UV,n=12){const P=[];for(let i=0;i<=8;i++){const t=i/8*PI;P.push([Math.sin(t),-Math.cos(t)]);}lathe(key,C(o,Tr(...c),Sc(rx,ry,rz)),P,UV,{n});}
// loft along x: secs [x, half-width (z), height, bottom y]; rounded-rectangle cross-section (superellipse p)
function loft(key,o,secs,UV,{n=12,p=2.6}={}){const N=secs.length-1,pw=2/p;
 gr(key,n,N,(u,v)=>{const s=secs[Math.round(v*N)],a=u*2*PI,ca=Math.cos(a),sa=Math.sin(a);return[s[0],s[3]+s[2]*(.5+.5*Math.sign(sa)*Math.abs(sa)**pw),s[1]*Math.sign(ca)*Math.abs(ca)**pw];},UV,o);}
// ======================================================================== copper + enamel + silver
function kettle(o,s=1){const q=C(o,Sc(s,s,s));
 lathe(K,q,[[0,0],[.07,0],[.085,.01],[.095,.04],[.092,.08],[.075,.11],[.05,.125],[.045,.13]],latheC(0),{n:18});
 lathe(K,q,[[.047,.128],[.05,.133],[.036,.146],[.013,.151],[.011,.163],[.017,.17],[0,.176]],latheC(0),{n:14});
 sweep(K,q,[[.075,.04,0],[.115,.06,0],[.145,.095,0],[.165,.125,0]],[.024,.018,.013,.009],{n:8,UV:(u,v)=>cell(0,u*.4,v*.5)});
 const H=arc([0,.13,0],.07,.15,PI-.15,10);sweep('m145brass',q,H,.0055,{n:5});sweep(K,q,H.slice(3,8),.012,{n:6,UV:(u,v)=>cell(17,u*.3,v)});}
function pan(o){lathe(K,o,[[0,0],[.08,0],[.085,.005],[.09,.07],[.094,.075]],latheC(0),{n:18});lathe(K,o,[[.088,.075],[.083,.008],[0,.006]],latheC(1),{n:18,tone:.85});
 sweep('m145brass',o,[[.09,.06,0],[.15,.07,0],[.27,.09,0]],[.008,.007,.009],{n:5});lathe('m145brass',C(o,Tr(.28,.09,0),RZ(-PI/2+.15)),[[.009,0],[.009,.005],[0,.007]],latheT(.04,.04),{n:6});}
function mug(o,kind){const c=kind?3:2;
 lathe(K,o,[[0,0],[.04,0],[.042,.004],[.042,.084],[.044,.09]],(u,i,r,y)=>cell(c,u,Math.min(.99,y/.09)),{n:14});
 lathe(K,o,[[.04,.09],[.039,.008],[0,.008]],(u,i,r,y,s)=>cell(4,u,.2+s*.6),{n:14,tone:.95});
 sweep(K,o,[[.042,.075,0],[.065,.072,0],[.07,.045,0],[.06,.02,0],[.042,.018,0]],.006,{n:5,UV:(u,v)=>cell(c,u*.2,.3+v*.3)});}
function coffeePot(o){lathe(K,o,[[0,0],[.075,0],[.078,.006],[.07,.1],[.055,.17],[.045,.19]],latheC(3,2),{n:16});
 lathe(K,o,[[.047,.19],[.05,.195],[.03,.215],[.01,.22],[.012,.234],[0,.24]],latheC(3),{n:12});
 sweep(K,o,[[.062,.06,0],[.095,.1,0],[.115,.15,0],[.13,.172,0]],[.02,.015,.011,.008],{n:8,UV:(u,v)=>cell(3,u*.3,v*.5)});
 sweep(K,o,[[-.05,.17,0],[-.1,.15,0],[-.105,.08,0],[-.072,.03,0]],.007,{n:5,UV:(u,v)=>cell(3,u*.2,v*.4)});}
function basin(o){lathe(K,o,[[0,0],[.08,0],[.12,.04],[.16,.07],[.165,.075]],(u,i,r,y)=>cell(2,(u*2)%1.0001,Math.min(.99,.3+y/.075*.69)),{n:20});
 lathe(K,o,[[.162,.075],[.118,.044],[.078,.006],[0,.006]],(u,i,r)=>rad(4,.5,.5,.5)(-u*2*PI,r/.17),{n:20,tone:.95});
 sweep(K,o,arc([0,.076,0],.166,0,2*PI,20,'xz'),.005,{n:4,UV:(u,v)=>cell(2,v,.97)});}
function teapot(o){lathe(K,o,[[0,0],[.04,0],[.045,.006],[.068,.04],[.07,.07],[.058,.1],[.042,.11]],latheC(26),{n:16});
 lathe(K,o,[[.044,.108],[.046,.112],[.032,.125],[.008,.13],[.012,.145],[0,.15]],latheC(26),{n:12});
 sweep(K,o,[[.06,.035,0],[.09,.05,0],[.11,.09,0],[.125,.115,0]],[.016,.012,.009,.006],{n:7,UV:(u,v)=>cell(26,u*.3,v)});
 sweep(K,o,[[-.06,.095,0],[-.1,.09,0],[-.11,.055,0],[-.085,.025,0],[-.065,.03,0]],.007,{n:5,UV:(u,v)=>cell(17,u*.3,v)});}
function teaSet(o){lathe(K,o,[[0,0],[.17,0],[.18,.008],[.19,.016],[.186,.017],[.176,.009],[0,.009]],latheR(26,.19),{n:22});
 teapot(C(o,Tr(-.04,.009,-.03)));const sb=C(o,Tr(.1,.009,.07));lathe(K,sb,[[0,0],[.028,0],[.042,.028],[.04,.048],[0,.044]],latheC(26),{n:12});
 for(const sx of[-1,1])sweep(K,sb,[[sx*.04,.04,0],[sx*.058,.036,0],[sx*.054,.018,0],[sx*.036,.016,0]],.003,{n:4,UV:(u,v)=>cell(26,u*.2,v*.2)});
 mug(C(o,Tr(.08,.009,-.09),RY(1)),0);}
function candlestick(o,h=1){lathe('m145brass',C(o,Sc(1,h,1)),[[0,0],[.05,0],[.052,.008],[.03,.016],[.012,.03],[.014,.06],[.009,.1],[.013,.14],[.009,.2],[.02,.21],[.022,.22],[.012,.222],[0,.222]],latheT(.08,.08),{n:12});
 lathe(K,o,[[.0095,.222*h],[.0095,.222*h+.1],[.007,.222*h+.105],[0,.222*h+.106]],(u,i,r,y,s)=>cell(4,u,s),{n:8});}
// ======================================================================== toys
function teddy(o,s=1){const q=C(o,Sc(s,s,s));ell(K,q,[0,.1,0],.072,.095,.062,fur,14);ell(K,q,[0,.235,.005],.062,.058,.058,fur,14);
 lathe(K,C(q,Tr(0,.222,.048),RX(PI/2)),[[.033,-.008],[.031,.01],[.021,.021],[0,.026]],latheR(11,.033),{n:12});
 for(const sx of[-1,1]){ell(K,q,[sx*.024,.252,.052],.0065,.0065,.005,()=>cell(18,.03,.04),6);ell(K,q,[sx*.046,.284,-.004],.022,.022,.009,fur,8);
  sweep(K,q,[[sx*.06,.165,0],[sx*.085,.115,.03],[sx*.09,.075,.06]],[.024,.022,.019],{n:8,UV:(u,v)=>cell(10,u,v)});
  sweep(K,q,[[sx*.04,.04,0],[sx*.05,.035,.07],[sx*.056,.034,.12]],[.032,.03,.028],{n:8,UV:(u,v)=>cell(10,u,v)});
  disc(C(q,Tr(sx*.056,.034,.121)),[0,0,0],.027,(a,r)=>cell(11,.12+.08*Math.cos(a)*r,.12+.08*Math.sin(a)*r),{back:false});}}
function robot(o,s=1){const q=C(o,Sc(s,s,s)),F13=(f,u,v)=>cell(13,u,v);
 for(const sx of[-1,1]){box(K,q,[sx*.022,.012,0],.03,.05,.04,F13);box(K,q,[sx*.022,0,.008],.036,.012,.055,(f,u,v)=>cell(13,u*.3,v*.3),.7);
  sweep(K,q,[[sx*.055,.155,0],[sx*.07,.12,.02],[sx*.072,.09,.035]],.012,{n:6,UV:(u,v)=>cell(13,u*.3,v*.5)});
  lathe('m145chr',C(q,Tr(sx*.017,.2,.0275),RX(PI/2)),[[.009,0],[.009,.004],[.006,.007],[0,.008]],latheT(.04,.04),{n:10});
  lathe('m145chr',C(q,Tr(sx*.035,.2,0),RZ(-sx*PI/2)),[[.012,0],[.008,.008],[0,.012]],latheT(.04,.04),{n:8});}
 box(K,q,[0,.06,0],.1,.11,.065,(f,u,v)=>f===0?cell(12,u,v):cell(13,u,v));box(K,q,[0,.17,0],.07,.06,.055,(f,u,v)=>f===0?cell(13,.1+u*.8,.1+v*.5):cell(13,u,v));
 sweep('m145chr',q,[[0,.23,0],[0,.27,0]],.002,{n:3});ell(K,q,[0,.272,0],.008,.008,.008,()=>cell(14,.5,.5),6);}
function truck(o){const F=(s)=>(f,u,v)=>cell(14,.05+f*.12+u*.25,.1+s*.2+v*.4);
 for(const x of[-.08,.08])for(const z of[-.055,.055]){lathe(K,C(o,Tr(x,.025,z),RX(PI/2)),[[0,-.012],[.025,-.012],[.025,.012],[0,.012]],(u,i,r)=>i===1||i===2?cell(7,u,.2):cell(7,.5+.3*Math.cos(u*6.28)*r/.025,.2+.15*Math.sin(u*6.28)*r/.025),{n:12});
  lathe('m145chr',C(o,Tr(x,.025,z+Math.sign(z)*.012),RX(Math.sign(z)*PI/2)),[[.012,0],[.008,.004],[0,.005]],latheT(.04,.04),{n:8});}
 box(K,o,[0,.03,0],.26,.02,.1,F(0));box(K,o,[.075,.05,0],.075,.075,.1,F(1));box(K,o,[.128,.05,0],.03,.04,.09,F(2));
 box(K,o,[-.04,.05,0],.16,.008,.1,F(.5));for(const sz of[-1,1])box(K,o,[-.04,.058,sz*.047],.16,.03,.006,F(1.5));box(K,o,[-.117,.058,0],.006,.03,.1,F(1.2));}
function spinTop(o){lathe(K,C(o,Tr(0,.048,0),RZ(PI/2-.28),Tr(0,-.046,0)),[[0,0],[.01,.005],[.04,.04],[.05,.055],[.045,.062],[.01,.066],[.006,.09],[0,.092]],(u,i,r,y)=>cell(15,u,Math.min(.99,y/.092)),{n:14});}
// ======================================================================== shoes, bags, suitcases
function shoe(o,{boot=false,key=5,L=.27}={}){const f=L/.27,q=C(o,Tr(-L/2,0,0));
 const S=[[0,.006,.012],[.012,.03,.04],[.035,.042,.055],[.08,.046,.064],[.13,.043,.074],[.18,.038,.086],[.225,.036,.09],[.255,.031,.084],[.27,.008,.06]].map(s=>[s[0]*f,s[1]*f,s[2]*f,.014]);
 loft(K,q,S,(u,v)=>cell(key,u,v),{n:12});
 const pts=[];for(const s of S)pts.push([s[0],-(s[1]+.003)]);for(let i=S.length-1;i>=0;i--)pts.push([S[i][0],S[i][1]+.003]);
 extrude(K,C(q,RX(PI/2)),pts,-.014,0,{ctr:[L*.5,0],front:(x,y)=>cell(7,.1+x/L*.8,.05+(y+.06)*3),side:(s,v)=>cell(7,s,.3+v*.4)});
 if(!boot){const P=[];for(let k=0;k<=12;k++){const a=k/12*2*PI;P.push([.19*f+Math.cos(a)*.05*f,.1*f+.012,Math.sin(a)*.03*f]);}sweep(K,q,P,.004,{n:4,UV:(u,v)=>cell(key,u*.1,v)});
  gr(K,12,1,(u,v)=>[.19*f+Math.cos(u*2*PI)*.05*f*v,.1*f+.01,Math.sin(u*2*PI)*.03*f*v],()=>cell(7,.5,.15),q);return;}
 const x0=.2*f;for(const[r,t]of[[1,1],[.92,.35]])gr(K,12,3,(u,v)=>{const a=u*2*PI;return[x0+v*.012+Math.cos(a)*(.05-.006*v)*f*r,.04+v*.27,Math.sin(a)*.044*f*r];},(u,v)=>cell(key,u,v),q,t);
 {const P=[];for(let k=0;k<=12;k++){const a=k/12*2*PI;P.push([x0+.012+Math.cos(a)*.044*f,.31,Math.sin(a)*.044*f]);}sweep(K,q,P,.005,{n:4,UV:(u,v)=>cell(key,u*.1,v)});}
 sweep(K,q,[[x0+.05*f,.27,0],[x0+.065*f,.3,0],[x0+.058*f,.33,0]],.004,{n:4,UV:(u,v)=>cell(key,u*.1,v*.3)});}
function shoePair(P,lx,lz,ry,opt){shoe(P(lx-.06,lz,ry+PI/2-.06),opt);shoe(C(P(lx+.065,lz+.02,ry+PI/2+.1)),opt);}
function handbag(o,{key=6,flap=true}={}){const pts=[[.13,0],[.135,.02],[.1,.17],[-.1,.17],[-.135,.02],[-.13,0]];
 extrude(K,o,pts,-.045,.045,{ctr:[0,.08],front:planar(key,-.14,.14,0,.18),side:(s,v)=>cell(key,s,v*.3)});
 if(flap)extrude(K,o,[[.1,.17],[-.1,.17],[-.104,.12],[-.06,.08],[0,.07],[.06,.08],[.104,.12]],.045,.052,{ctr:[0,.13],front:planar(9,-.11,.11,.06,.18),side:(s,v)=>cell(9,s,v*.2)});
 lathe('m145brass',C(o,Tr(0,flap?.085:.15,flap?.052:.046),RX(PI/2)),[[.009,0],[.009,.004],[.005,.008],[0,.009]],latheT(.04,.04),{n:8});
 sweep(K,o,arc([0,.17,0],.075,0,PI,10),.007,{n:5,UV:(u,v)=>cell(9,u*.3,v)});}
function suitcase(o,{W=.56,H=.38,D=.17}={}){const pts=rrect(W,H,.03,3);
 extrude(K,o,pts,-D/2,D/2,{ctr:[0,H/2],front:planar(8,-W/2,W/2,0,H),side:(s,v)=>cell(8,s,v)});
 for(const z of[-D/2,D/2])sweep(K,o,[...pts,pts[0]].map(p=>[p[0],p[1],z]),.006,{n:4,UV:(u,v)=>cell(9,u*.2,v)});
 for(const x of[-.15,.15])box(K,o,[x,-.004,0],.035,H+.008,D+.01,(f,u,v)=>cell(9,.3+u*.2,v));
 sweep(K,o,arc([0,H,0],.05,0,PI,6),.01,{n:5,UV:(u,v)=>cell(9,u*.3,v*.5)});for(const sx of[-1,1])box('m145brass',o,[sx*.07,H-.004,0],.02,.012,.02,tileF(.02,.012,.02,.05));
 for(const x of[-.15,.15])box('m145brass',o,[x,H-.07,D/2+.004],.03,.035,.01,tileF(.03,.035,.01,.05));}
// ======================================================================== mirrors
function vanity(o){extrude(K,o,rrect(.28,.03,.01,2),-.07,.07,{ctr:[0,.015],front:planar(17,-.14,.14,0,.2),side:(s,v)=>cell(17,s,v*.2)});
 for(const sx of[-1,1]){sweep(K,o,[[sx*.135,.03,0],[sx*.135,.13,0],[sx*.13,.2,0]],.007,{n:5,UV:(u,v)=>cell(17,u*.2,v)});lathe('m145brass',C(o,Tr(sx*.128,.2,0),RZ(sx*PI/2)),[[.01,0],[.01,.005],[0,.008]],latheT(.04,.04),{n:8});}
 const q=C(o,Tr(0,.2,0),RX(-.12)),E=(r,z)=>{const P=[];for(let k=0;k<=20;k++){const a=k/20*2*PI;P.push([Math.cos(a)*.11*r,Math.sin(a)*.15*r,z]);}return P;};
 gr(K,20,2,(u,v)=>[Math.cos(u*2*PI)*.11*v,Math.sin(u*2*PI)*.15*v,0],(u,v)=>cell(16,.5+.5*Math.cos(u*2*PI)*v,.5+.5*Math.sin(u*2*PI)*v),q);
 gr(K,20,1,(u,v)=>[Math.cos(-u*2*PI)*.12*v,Math.sin(-u*2*PI)*.16*v,-.007],(u,v)=>cell(17,.5+.4*Math.cos(u*6.28)*v,.5+.4*Math.sin(u*6.28)*v),q,.8);
 sweep(K,q,E(1.02,-.003),.011,{n:5,UV:(u,v)=>cell(17,u*.3,v)});}
function wallMirror(o,W=.55,H=.85,lean=.14){const q=C(o,RX(-lean)),mw=.06,prof=[[0,-.012],[0,.022],[.012,.03],[.025,.02],[.04,.028],[mw,.012],[mw,.003]],N=prof.length-1;
 for(let s=0;s<4;s++)gr(K,1,N,(u,v)=>{const i=Math.round(v*N),off=prof[i][0],hx=W/2-off,hy=H/2-off,CC=[[-hx,-hy],[hx,-hy],[hx,hy],[-hx,hy]],a=CC[s],b=CC[(s+1)%4];return[a[0]+(b[0]-a[0])*u,H/2+a[1]+(b[1]-a[1])*u,prof[i][1]];},(u,v)=>cell(17,u,v),q);
 const iw=W/2-mw+.006,ih=H/2-mw+.006;gr(K,1,1,(u,v)=>[-iw+2*iw*u,H/2-ih+2*ih*v,.004],(u,v)=>cell(16,u,v),q);gr(K,1,1,(u,v)=>[W/2-W*u,v*H,-.012],(u,v)=>cell(17,u*.6,v),q,.7);}
// ======================================================================== typewriter
function typewriter(o){const q=C(o,RY(-PI/2)),pts=[[.15,0],[.15,.025],[.06,.06],[-.06,.095],[-.12,.11],[-.15,.11],[-.15,0]];
 extrude(K,q,pts,-.16,.16,{ctr:[0,.05],front:(x,y)=>cell(18,.01+(x+.15)/.3*.09,.05+y*.5),side:(s,v)=>cell(18,.01+s*.09,.05+v*.1)});
 gr(K,1,1,(u,v)=>[-.1+.2*u,.003+.02*v,.1505],(u,v)=>cell(18,.1+.8*u,.3+.31*v),o);
 const ys=z=>z>.06?.025+(.15-z)/.09*.035:.06+(.06-z)/.12*.035;let n=0;
 for(let r=0;r<4;r++){const z=.12-r*.025;for(let j=0;j<10;j++){const x=-.118+j*.026+r*.007,y0=ys(z),yt=y0+.016+r*.005,l=n++%16;
  sweep('m145chr',o,[[x,y0,z],[x,yt,z]],.0016,{n:3});lathe(K,C(o,Tr(x,yt,z)),[[.0095,0],[.0095,.004],[0,.0045]],(u,i,rr)=>rad(19,((l&3)+.5)/4,1-((l>>2)+.5)/4,.125)(-u*2*PI,rr/.0095),{n:10});}}
 box('m145chr',o,[0,ys(.14)+.004,.142],.15,.008,.012,tileF(.15,.008,.012,.05));
 lathe(K,C(o,Tr(0,.135,-.11),RZ(PI/2)),[[0,-.2],[.026,-.195],[.026,-.175],[.022,-.17],[.022,.17],[.026,.175],[.026,.195],[0,.2]],(u,i,r,y)=>i>=2&&i<=5?cell(20,.1+.8*(y+.17)/.34,u):cell(20,.5,u),{n:14});
 box('m145chr',o,[0,.1,-.142],.36,.03,.016,tileF(.36,.03,.016,.1));
 gr(K,1,4,(u,v)=>[-.1+.2*u,.15+v*.19,-.118-v*.05-.03*v*v],(u,v)=>cell(30,u,v),o);
 sweep('m145chr',o,[[-.17,.15,-.1],[-.205,.17,-.04],[-.21,.17,.01]],.003,{n:4});}
// ======================================================================== small furniture
function stool(o,seed,h=.45){lathe(K,o,[[0,h],[.15,h],[.16,h-.008],[.16,h-.03],[.145,h-.038],[0,h-.038]],(u,i,r)=>rad(22,.5,.5,.5)(-u*2*PI,Math.min(1,r/.16)),{n:16});
 const L=[];for(let k=0;k<3;k++){const a=k*2*PI/3+seed;L.push([[Math.cos(a)*.1,h-.038,Math.sin(a)*.1],[Math.cos(a)*.17,0,Math.sin(a)*.17]]);sweep(K,o,L[k],.016,{n:6,UV:(u,v)=>cell(17,u*.2+k*.25,v)});}
 const at=(l,y)=>{const t=(h-.038-y)/(h-.038);return l[0].map((p,i)=>p+(l[1][i]-p)*t);};for(let k=0;k<3;k++)sweep(K,o,[at(L[k],.16),at(L[(k+1)%3],.16)],.009,{n:5,UV:(u,v)=>cell(17,.8+u*.1,v*.5)});}
function cabinet(o,seed){const w=.5,h=.66,d=.34,lg=.12,pi=[0],F=()=>{const p=pi[0]++;return(f,u,v)=>cell(21,hash(seed+f+p*7)*.5+u*.45,hash(seed+f*3+p*11)*.5+v*.45);};
 for(const sx of[-1,1])for(const sz of[-1,1])lathe(K,C(o,Tr(sx*(w/2-.03),0,sz*(d/2-.03))),[[0,0],[.016,0],[.018,.02],[.011,.05],[.02,.08],[.017,lg],[0,lg]],(u,i,r,y,s)=>cell(21,.2+u*.2,s),{n:8});
 for(const sx of[-1,1])box(K,o,[sx*(w/2-.0125),lg,0],.025,h-lg-.025,d,F());box(K,o,[0,lg,-d/2+.01],w-.05,h-lg-.025,.02,F(),.8);box(K,o,[0,lg,0],w-.05,.02,d-.02,F());
 box(K,o,[0,h-.025,.01],w+.04,.025,d+.03,F());box(K,o,[0,h-.17,d/2+.002],w-.06,.13,.022,F());
 const dh=h-.185-lg-.02;box(K,o,[0,lg+.02,d/2+.002],w-.06,dh,.022,F());box(K,o,[0,lg+.05,d/2+.012],w-.14,dh-.06,.01,F());
 for(const[x,y]of[[0,h-.105],[.17,lg+.02+dh/2]])lathe('m145brass',C(o,Tr(x,y,d/2+.013),RX(PI/2)),[[.006,0],[.005,.012],[.012,.018],[.009,.024],[0,.026]],latheT(.04,.04),{n:8});}
// ======================================================================== rug rolls + globe
function rugRoll(o,k,len,R,{up=false,tail=0,seed=0}={}){const q=up?C(o,RZ(PI/2),Tr(len/2,-R,0)):o,wb=a=>1+.04*Math.sin(a*3+seed)+.02*Math.sin(a*7+seed*2);
 gr(K,16,2,(u,v)=>{const a=u*2*PI;return[(v-.5)*len,R+Math.cos(a)*R*wb(a),Math.sin(a)*R*wb(a)];},(u,v)=>cell(k,.02+u*.96,v,2,2),q);
 for(const sx of[-1,1])disc(C(q,Tr(sx*len/2,R,0),RY(sx*PI/2)),[0,0,0],R*1.01,(a,r)=>rad(29,.5,.5,.5)(a,r),{back:false});
 if(tail&&!up)gr(K,1,3,(u,v)=>[(u-.5)*len,.004+.01*(1-v),.02+v*tail],(u,v)=>cell(k,v*tail/(2*PI*R)*.3,u,2,2),q);}
function globe(o,s=1){const q=C(o,Sc(s,s,s));lathe(K,q,[[0,0],[.08,0],[.085,.012],[.065,.024],[.02,.034],[.014,.06],[.018,.08],[.012,.1],[0,.1]],(u,i,r,y,ss)=>cell(17,u,ss),{n:14});
 const R=.1,N=10,P=[];for(let i=0;i<=N;i++){const t=i/N*PI;P.push([R*Math.sin(t),-R*Math.cos(t)]);}const g2=C(q,Tr(0,.215,0),RZ(.41));
 lathe(K,g2,P,(u,i)=>cell(24,1-u,i/N,2,1),{n:20});sweep(K,g2,arc([0,0,0],R+.008,-PI/2-.2,PI/2+.2,14,'xy'),.004,{n:4,UV:(u,v)=>cell(23,v,.6+u*.3)});
 sweep(K,q,[[0,.1,0],[0,.118,0]],.006,{n:5,UV:(u,v)=>cell(23,u,v)});}
// ======================================================================== layout
function at(TB,k,f,flip=false){const t=TB[k];if(!t)return;const[x,z,r0,l,c]=t,r=flip?r0+PI:r0;f(O(x,c?YT:YT-.005,z,r),l,(lx,lz,ry=0,ly=0)=>C(O(x,(c?YT:YT-.005)+ly,z,r),O(lx,0,lz,ry)));}
const BL=(x,z,ry)=>(lx,lz,r2=0)=>C(O(x,Y0+.024,z,ry),O(lx,0,lz,r2));
const FAR=[(P)=>kettle(P,.85),(P)=>mug(P,1),(P)=>coffeePot(P),(P)=>teapot(P),(P)=>robot(P,.9),(P)=>teddy(P,.8),(P)=>truck(P),(P)=>spinTop(P),(P)=>candlestick(P,.9),(P)=>globe(P,.8),(P)=>shoe(P,{key:5}),(P)=>handbag(P,{flap:false}),(P)=>pan(P),(P)=>vanity(P)];
export function* maltose147Goods2Task(b,lod){if(lod||!TB147.length)return;addMats(b.mats);MT=b.mats;g=new G();g.f=null;
 // --- last D1 table (rear red): typewriter, globe, silver tea set + candlesticks
 at(TB147,15,(o,l,P)=>{typewriter(P(-.55,.02,.15));globe(P(-.05,-.12,.4));teaSet(P(.45,.02,-.2));candlestick(P(.82,-.18));candlestick(P(.72,-.22,0),.85);});
 // --- blanket by the umbrella (moving blanket): boots, shoes, handbags; two suitcases on the ground beside it
 const B1=BL(69.4,40.1,.3);
 shoePair(B1,-.6,.2,.1,{boot:true,key:5,L:.29});shoePair(B1,-.25,.32,-.2,{key:6});shoePair(B1,.1,.3,.15,{boot:true,key:6,L:.28});shoePair(B1,-.55,-.3,.3,{key:5,L:.26});
 handbag(B1(.45,-.25,-.2));handbag(B1(.7,.15,.4),{flap:false,key:5});handbag(B1(.15,-.35,.3),{key:9});
 const SC=O(68.25,Y0,41.45,.3+.1);suitcase(C(SC,Tr(0,.085,0),RX(-PI/2),Tr(0,-.19,0)));suitcase(C(SC,Tr(.02,.17+.075,0),RY(.12),RX(-PI/2),Tr(0,-.16,0)),{W:.48,H:.32,D:.15});b.circle(68.25,41.45,.35);
 // --- plaid blanket in the rear yard: toys, a globe, a typewriter
 const B2=BL(77.9,70.6,PI+.05);
 teddy(B2(-.75,.1,.2));teddy(B2(-.5,-.4,-.3),.75);robot(B2(-.2,.25,.1));robot(B2(.0,.3,-.25),.85);truck(B2(.3,.4,.5));truck(B2(-.35,-.05,-.9));
 for(let i=0;i<3;i++)spinTop(B2(.1+i*.12,-.05+i*.08,i*1.7));globe(B2(.62,-.3,.2),.95);typewriter(B2(.65,.3,-.3));
 // --- moving blanket by the east fence: copper, enamel, silver, a vanity mirror; big mirror leaning behind it
 const B3=BL(91.8,46.6,-PI/2);
 kettle(B3(-.65,.25,.5));kettle(B3(-.35,-.3,2),.8);pan(B3(-.05,.3,-.5));coffeePot(B3(.25,-.25,.8));coffeePot(B3(.55,.2,2.5));basin(B3(-.1,-.25));
 for(let i=0;i<4;i++)mug(B3(.25+i*.12,.35-i*.05,i*1.3),i&1);teaSet(B3(.62,-.35,.3));vanity(B3(-.7,-.4,.2));candlestick(B3(.85,.25));candlestick(B3(.82,.4),.8);
 wallMirror(C(O(91.8,Y0,46.6,-PI/2),O(-.15,0,-.85)),.55,.85);
 // --- small furniture by the left aisle: painted side cabinet, 2 stools, a leaning mirror
 cabinet(O(71.35,Y0,48.4,PI/2),5);b.circle(71.35,48.4,.33);stool(O(71.55,Y0,49.65),.4);stool(O(70.85,Y0,50.35),1.3);b.circle(71.55,49.65,.2);b.circle(70.85,50.35,.2);
 wallMirror(O(71.3,Y0,47.6,PI/2),.45,.7,.16);
 // --- rug rolls: a pyramid of three lying + two standing, near the east fence
 const RR=O(93.8,Y0,51.4,PI/2);rugRoll(C(RR,Tr(0,0,-.13)),32,1.5,.12,{tail:.45,seed:1});rugRoll(C(RR,Tr(.05,0,.13)),34,1.3,.11,{seed:2});rugRoll(C(RR,Tr(-.04,.2,0),RY(.06)),34,1.4,.1,{seed:3});
 rugRoll(O(95.1,Y0,49.7,.4),32,1.25,.1,{up:true,seed:4});rugRoll(O(95.35,Y0,50.05,1.2),34,1.1,.09,{up:true,seed:5});b.circle(93.8,51.4,.8);b.circle(95.2,49.9,.3);
 g.flush(b);yield;
 // --- far-table densify: 3-4 real pieces along the front of every far M4 table
 TB145.forEach(([x,z,r,l,c],k)=>{if(k<=4||k===11)return;const o=O(x,(c?YT:YT-.005)+.004,z,r),n=3+(k&1);
  for(let i=0;i<n;i++){const lx=(-.5+(i+.5)/n)*(l-.35)+(hash(k*5+i)-.5)*.12,lz=.1+hash(k*7+i)*.1,P=C(o,O(lx,0,lz,(hash(k*3+i)-.5)*1.2));FAR[Math.floor(hash(k*13+i*31)*FAR.length)](P);}});
 g.flush(b);yield;}
