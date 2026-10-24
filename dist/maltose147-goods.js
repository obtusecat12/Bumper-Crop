// V147 D2 Maltose Market densify — goods batch 1 on the D1 tables (TB147), blankets and gridwalls of block (1,-1):
// LP record crates (every sleeve a real thin box, 12 covers + band edges + track-list backs, vinyl discs pulled half out),
// books (separate cover boards, inset page block, rounded spine with its own title strip; lying stacks + upright rows with
// bookends), framed oil paintings (mitred moulding swept from a profile, canvas + stretcher back), Napoleon-hat mantel clock
// (extruded outline, brass bezel, domed glass), twin-bell alarm clocks, table lamps (lathe brass / ginger-jar base, pleated
// linen shade, harp), tube radios (rounded tabletop + cathedral arch, lathe knobs), rangefinder + SLR cameras (lathe lenses,
// dials, prism hump), porcelain (willow / chintz plates with foot rings, stacks, wire plate stands, cups + saucers, bowls, jugs).
// One atlas goods147 (bc/tools/maltose147_d2_assets.py <- art-v147/m147b_*) = baseColor + normal + roughness/metalness (-m).
// Same block-local frame as maltose145*.js; imports at ?v=147a (TB147 / G must be the very same module instances).
import * as T from './vendor/three.module.min.js';
import {G} from './maltose145-stalls.js?v=147a';
import {TB147} from './maltose147-stalls.js?v=147a';
const A=new URL('./assets/l11-v147/',import.meta.url).href,PI=Math.PI,Y0=.15,YT=Y0+.745,V='?v=147b';
function tex(n,srgb=true){const t=new T.TextureLoader().load(A+n+'.webp'+V);if(srgb)t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;t.magFilter=T.NearestFilter;return t;}
let M=null;
function addMats(m){if(m.m147goods)return;if(!M){const rm=tex('goods147-m',false);
 M={m147goods:new T.MeshStandardMaterial({map:tex('goods147'),normalMap:tex('goods147-n',false),roughnessMap:rm,metalnessMap:rm,roughness:1,metalness:1,vertexColors:true,side:T.DoubleSide})};
 for(const[k,v]of Object.entries(M))v.name='V147 '+k;}Object.assign(m,M);}
const hash=(i)=>{let x=Math.sin(i*127.1+311.7)*43758.5453;return x-Math.floor(x);};
let g=null,MT=null;
const K='m147goods',e=.006;
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
// ======================================================================== records
const band=(b)=>(u,v)=>cell(12,u,1-(b+.5)/16+(v-.5)*.8/16);
function sleeve(o,cov,b){const s=.315,t=.004;box(K,o,[0,0,0],s,s,t,(f,u,v)=>f===0?cell(cov,u,v):f===1?cell(13,u,v):band(b)(f<4?v:u,.5));}
function vinyl(o,c,k){disc(o,c,.148,(a,r)=>rad(k,.5,.5,.5)(a,r));}
// wooden record crate (outer .36 x .3 x .52 deep along z), front wall low; n sleeves flipping front-back
function recordCrate(o,seed,{n=20,disc=-1}={}){const W=.36,H=.3,D=.52,t=.014,wd='m147wood',U=(f,u,v)=>[u*.6+hash(seed+f),v*.5];
 for(const sx of[-1,1]){box(wd,o,[sx*(W/2-t/2),0,0],t,H,D,U,.95);box(wd,o,[sx*(W/2+.004),.2,0],.008,.04,.12,U,.8);}   // sides + hand-hold cleats
 box(wd,o,[0,0,-D/2+t/2],W-2*t,H*.92,t,U,.9);box(wd,o,[0,0,D/2-t/2],W-2*t,.12,t,U,.9);box(wd,o,[0,0,0],W-2*t,.012,D-2*t,U,.6);
 let s=seed;for(let i=0;i<n;i++){const z=-D/2+.04+i*(D-.09)/n,lean=i===n-1?.38:-.12+hash(s++)*.1,up=hash(s++)<.15?.03+hash(s)*.04:0,cov=Math.floor(hash(s++)*12),b=Math.floor(hash(s++)*16);
  sleeve(C(o,Tr((hash(s++)-.5)*.015,.012+up,z),RX(lean),RY((hash(s++)-.5)*.04),Tr(0,0,0)),cov===12?0:cov,b);
  if(i===disc)vinyl(C(o,Tr(0,.012+up+.13,z+.004),RX(lean)),[0,.05,0],14+(i&1));}}
// LP on a little wire easel: sleeve + disc pulled half out to the right
function lpStand(o,cov,dk){sweep('m145chr',o,[[-.08,0,.06],[-.08,0,-.02],[-.07,.2,-.08]],.003);sweep('m145chr',o,[[.08,0,.06],[.08,0,-.02],[.07,.2,-.08]],.003);sweep('m145chr',o,[[-.08,.01,.06],[.08,.01,.06]],.003);
 const q=C(o,Tr(0,.012,.02),RX(-.25));sleeve(q,cov,cov+3);vinyl(q,[.09,.165,-.003],dk);}
// ======================================================================== books
// local: spine at x=0 (normal -x), width w along +x, height h along y, thickness t along z
function book(o,w,h,t,cov,sp){const b=.003,ins=.004;
 for(const sz of[-1,1])box(K,o,[w/2+.001,0,sz*(t/2-b/2)],w+.002,h,b,(f,u,v)=>f===(sz>0?0:1)?cell(16+cov,sz>0?u:1-u,v):cell(16+cov,u*.05,v),1);
 box(K,o,[w/2+.001,ins,0],w-.006,h-2*ins,t-2*b,(f,u,v)=>f===2?cell(49,v,u):f===4||f===5?cell(48,u,v):cell(48,u,v),1);
 // rounded spine: half cylinder bulging to -x, title strip sp (cell 24 + sp>>2, row sp&3)
 const c=24+(sp>>2),r0=1-((sp&3)+1)/4;gr(K,6,1,(u,v)=>{const a=PI/2+u*PI;return[Math.cos(a)*t*.18,v*h,Math.sin(a)*t/2*-1];},(u,v)=>cell(c,v,r0+.02+u*.21),o);}
function bookStack(o,n,seed,{w0=.15,h0=.22}={}){let y=0;for(let i=0;i<n;i++){const w=w0+hash(seed+i)*.06,h=h0+hash(seed+i+20)*.08,t=.02+hash(seed+i+40)*.035;
  book(C(o,Tr(0,y,0),RY((hash(seed+i+60)-.5)*.5+(i&1?PI:0)),Tr(-w/2,0,h/2),RX(-PI/2),Tr(0,0,t/2)),w,h,t,(seed+i)&7,(seed*3+i*5)&31);y+=t;}}
function bookRow(o,len,seed,{ends=true}={}){let x=-len/2+.02,i=0;while(x<len/2-.03){const w=.14+hash(seed+i)*.06,h=.19+hash(seed+i+9)*.09,t=.022+hash(seed+i+19)*.03;if(x+t>len/2-.02)break;
  const lean=i===0?0:0;book(C(o,Tr(x+t/2,0,0),RY(PI/2),Tr(0,0,0),RZ(lean)),w,h,t,(seed+i*3)&7,(seed+i*7)&31);x+=t+.002;i++;}
 if(ends)for(const sx of[-1,1]){const xx=sx<0?-len/2:x+.004;box('m145brass',o,[xx,0,-.06],.006,.15,.12,tileF(.006,.15,.12,.1));box('m145brass',o,[xx-sx*.04,0,-.06],.08,.004,.12,tileF(.08,.004,.12,.1));}}
// ======================================================================== frames
const PAINT=[[32,1.80],[34,.76],[36,.76],[38,1.76]];   // atlas cell (2 x 2) + canvas aspect w/h
function frame(o,p,cw,{gilt=true,mw=.06}={}){const[k,asp]=PAINT[p],ch=cw/asp,W=cw+2*mw-.01,H=ch+2*mw-.01;
 const prof=gilt?[[0,-.012],[0,.02],[.008,.034],[.018,.03],[.026,.04],[.036,.026],[.046,.03],[mw,.016],[mw,.004]]:[[0,-.012],[0,.022],[.012,.026],[.03,.018],[.045,.022],[mw,.012],[mw,.004]];
 const kk=gilt?50:51,N=prof.length-1;
 for(let s=0;s<4;s++)gr(K,1,N,(u,v)=>{const i=Math.round(v*N),off=prof[i][0],hx=W/2-off,hy=H/2-off,CC=[[-hx,-hy],[hx,-hy],[hx,hy],[-hx,hy]],a=CC[s],b=CC[(s+1)%4];return[a[0]+(b[0]-a[0])*u,H/2+a[1]+(b[1]-a[1])*u,prof[i][1]];},
  (u,v)=>cell(kk,u,v),o);
 const iw=W/2-mw+.006,ih=H/2-mw+.006;
 gr(K,1,1,(u,v)=>[-iw+2*iw*u,H/2-ih+2*ih*v,.006],(u,v)=>cell(k,u,v,2,2),o);
 gr(K,1,1,(u,v)=>[W/2-W*u,v*H,-.012],(u,v)=>cell(52,u,v),o,.8);}
// ======================================================================== clocks
function mantelClock(o0){const o=C(o0,Tr(0,.014,0)),pts=[];const N=16;pts.push([.17,.035]);for(let i=0;i<=N;i++){const x=.17-.34*i/N,ax=Math.abs(x);pts.push([x,.12+.085*Math.exp(-((ax/.085)**2))+.012*Math.cos(ax/.17*PI)]);}pts.push([-.17,.035]);
 const wd=planar(54,-.18,.18,0,.22);extrude(K,o,pts,-.05,.05,{ctr:[0,.1],front:wd,side:(s,v)=>cell(54,s,v*.3)});
 extrude(K,o,rrect(.38,.035,.008,2),-.065,.065,{ctr:[0,.017],front:planar(54,-.19,.19,0,.2),side:(s,v)=>cell(54,s,.4+v*.2)});
 for(const sx of[-1,1])for(const sz of[-1,1])lathe('m145brass',C(o,Tr(sx*.16,-.012,sz*.05)),[[0,0],[.012,.002],[.014,.008],[.008,.012]],latheT(.05,.05),{n:8});
 const dc=[0,.14,.052];disc(o,dc,.06,(a,r)=>rad(53,.5,.5,.5)(a,r),{back:false});
 sweep('m145brass',o,arc(dc,.064,0,2*PI,18),.006,{n:5});
 lathe(mk('m145glass'),C(o,Tr(dc[0],dc[1],dc[2]),RX(PI/2)),[[.062,0],[.05,.008],[.03,.013],[0,.015]],latheT(.1,.1),{n:14});
 lathe('m145brass',C(o,Tr(0,.205,0)),[[0,0],[.01,0],[.006,.02],[.009,.03],[0,.04]],latheT(.05,.05),{n:8});}
function alarmClock(o){const q=C(o,Tr(0,.075,0),RX(PI/2));   // drum axis along +z
 lathe('m145chr',q,[[0,-.024],[.052,-.024],[.058,-.018],[.06,0],[.058,.018],[.054,.024],[.05,.024]],latheT(.08,.08),{n:16});
 disc(o,[0,.075,.0242],.05,(a,r)=>rad(59,.75,.75,.25)(a,r),{back:false});
 sweep('m145chr',o,arc([0,.075,.026],.051,0,2*PI,16),.003,{n:4});
 for(const sx of[-1,1]){const bq=C(o,Tr(sx*.035,.14,-.004),RZ(-sx*.5));lathe('m145brass',bq,[[0,.028],[.012,.027],[.022,.02],[.028,.008],[.03,0]],latheT(.06,.06),{n:12});
  sweep('m145chr',o,[[sx*.03,.0,-.01],[sx*.04,.03,-.012]],.004,{n:5});}
 sweep('m145chr',o,arc([0,.16,-.004],.025,0,PI,8),.003,{n:4});lathe('m145chr',C(o,Tr(0,.168,-.004)),[[0,0],[.004,0],[.004,.012],[0,.012]],latheT(.05,.05),{n:6});
 lathe('m145chr',C(o,Tr(0,.075,-.024),RX(-PI/2)),[[0,0],[.012,0],[.012,.006],[0,.008]],latheT(.05,.05),{n:8});}
// ======================================================================== lamps
function lamp(o,kind,seed){const brass=kind===0;
 if(brass)lathe('m145brass',o,[[0,0],[.075,0],[.078,.012],[.06,.022],[.03,.03],[.022,.06],[.05,.12],[.065,.17],[.05,.22],[.02,.26],[.016,.3],[0,.3]],latheT(.08,.08),{n:16});
 else lathe(K,o,[[0,0],[.055,0],[.06,.01],[.085,.06],[.095,.12],[.085,.19],[.05,.23],[.035,.25],[.04,.26],[0,.26]],latheC(61),{n:16});
 const y0=brass?.3:.26;g.tube('m145chr',o([0,y0,0]),o([0,y0+.17,0]),.006,6,.05,.2);
 lathe('m145brass',C(o,Tr(0,y0+.15,0)),[[0,0],[.016,0],[.018,.04],[.012,.05],[0,.05]],latheT(.05,.05),{n:8});   // socket
 for(const sx of[-1,1])sweep('m145chr',o,[[sx*.02,y0+.13,0],[sx*.1,y0+.2,0],[sx*.06,y0+.32,0],[0,y0+.35,0]],.003,{n:4});   // harp
 const ph=hash(seed)*6;lathe(K,C(o,Tr(0,y0+.12,0)),[[.17,0],[.165,.02],[.13,.17],[.125,.2]],(u,i,r,y,s)=>cell(62,(u*3)%1.0001,s),{n:28,wob:(a)=>1+.025*Math.abs(Math.sin(a*14+ph))});
 lathe('m145brass',C(o,Tr(0,y0+.35,0)),[[0,0],[.012,.005],[.008,.025],[0,.03]],latheT(.05,.05),{n:8});}
// ======================================================================== radios
function knob(o,c,r=.018){const q=C(o,Tr(...c),RX(PI/2));lathe(K,q,[[r*1.1,0],[r,.012],[r*.92,.02],[0,.022]],(u,i,rr,y,s)=>i===3||i===2?rad(59,.25,.25,.25)(-u*2*PI,rr/r):cell(59,.05+u*.4,.05+s*.4),{n:12});}
function radioTable(o){const W=.4,H=.24,D=.18,pts=rrect(W,H,.05,3,true,false);
 extrude(K,o,pts,-D/2,D/2,{ctr:[0,H/2],front:planar(55,-W/2,W/2,0,H),back:planar(56,-W/2,W/2,0,H),side:(s,v)=>cell(56,s,v)});
 for(const x of[.1,.16])knob(o,[x,.035,D/2],.017);knob(o,[-.15,.035,D/2],.015);
 for(const sx of[-1,1])box(K,o,[sx*.16,-.01,0],.03,.01,D*.8,(f,u,v)=>cell(56,u*.1,v*.1),.4);}
function radioCathedral(o){const W=.3,H=.4,D=.2,pts=[];pts.push([W/2,0]);for(let i=0;i<=14;i++){const a=i/14*PI;pts.push([Math.cos(a)*W/2,.22+Math.sin(a)*.18*(1-.25*Math.abs(Math.cos(a)))]);}pts.push([-W/2,0]);
 extrude(K,o,pts,-D/2,D/2,{ctr:[0,.18],front:planar(56,-W/2,W/2,0,H),side:(s,v)=>cell(56,s,v)});
 // raised grille arch panel (grille region of the radio front) + dial window + knobs
 const gp=[];for(let i=0;i<=12;i++){const a=i/12*PI;gp.push([Math.cos(a)*.1,.2+Math.sin(a)*.12]);}gp.push([-.1,.12]);gp.push([.1,.12]);
 extrude(K,o,gp,D/2,D/2+.008,{ctr:[0,.2],front:(x,y)=>cell(55,.08+(x+.1)/.2*.5,.2+(y-.12)/.2*.6),side:(s,v)=>cell(56,s,v)});
 gr(K,1,1,(u,v)=>[-.06+.12*u,.05+.04*v,D/2+.003],(u,v)=>cell(55,.72+u*.2,.38+v*.24),o);
 for(const x of[-.09,0,.09])knob(o,[x,.025,D/2],.016);}
// ======================================================================== cameras
function camera(o,slr){const W=.14,H=.08,D=.036,pts=rrect(W,H,.014,3);
 extrude(K,o,pts,-D/2,D/2,{ctr:[0,H/2],front:planar(57,-W/2,W/2,0,H*1.4),side:(s,v)=>cell(58,s,.1+v*.3)});
 const lz=D/2,lq=C(o,Tr(slr?0:-.02,.038,lz),RX(PI/2));
 lathe('m145chr',lq,[[.026,0],[.026,.012],[.023,.014],[.023,.03],[.025,.034],[.025,.05],[.021,.052]],latheT(.04,.04),{n:16});
 disc(o,[slr?0:-.02,.038,lz+.052],.021,(a,r)=>rad(59,.25,.75,.25)(a,r),{back:false});
 if(slr){const hp=[[.035,H],[.022,H+.035],[-.022,H+.035],[-.035,H]];extrude(K,o,hp,-.016,.016,{ctr:[0,H+.015],front:planar(58,-.04,.04,H-.01,H+.045),side:(s,v)=>cell(58,s,.6+v*.2)});
  lathe(K,C(o,Tr(.045,H,-.002)),[[.014,0],[.014,.01],[0,.011]],(u,i,r,y,s)=>i===2||i===1?rad(59,.75,.25,.25)(-u*2*PI,r/.014):cell(58,u,.9),{n:12});}
 else{for(const x of[-.05,.03])gr(mk('m145glass'),1,1,(u,v)=>[x+.016*u,.058+.012*v,D/2+.001],(u,v)=>[u,v],o);
  lathe(K,C(o,Tr(.045,H,0)),[[.013,0],[.013,.009],[0,.01]],(u,i,r,y,s)=>i===2||i===1?rad(59,.75,.25,.25)(-u*2*PI,r/.013):cell(58,u,.9),{n:12});
  lathe('m145chr',C(o,Tr(-.05,H,0)),[[.009,0],[.009,.012],[0,.013]],latheT(.04,.04),{n:8});}
 for(const sx of[-1,1])sweep('m145chr',o,arc([sx*(W/2+.002),.065,0],.004,0,2*PI,6,'zy'),.0012,{n:3});}
// ======================================================================== porcelain
const PT=[[0,.009],[.082,.009],[.1,.014],[.122,.023],[.13,.0245]],PB=[[.13,.0225],[.12,.019],[.09,.008],[.086,.0],[.078,0],[.075,.005],[0,.005]];
function plate(o,k,s=1){const sc=p=>p.map(([r,y])=>[r*s,y*s]);
 lathe(K,o,sc(PT),k===60?latheR(60,.13*s,.5,.5,.48):(u,i,r)=>rad(61,.5,.5,.5)(-u*2*PI,r/(.13*s)),{n:20});
 lathe(K,o,sc(PB),(u,i,r,y,ss)=>cell(63,u,.2+ss*.6),{n:20,tone:.92});
 lathe(K,o,[[.13*s,.0245*s],[.131*s,.0235*s],[.13*s,.0225*s]],(u)=>cell(63,u,.97),{n:20});}
function plateStack(o,n,k,s=1){for(let i=0;i<n;i++)plate(C(o,Tr((hash(i+k)-.5)*.006,i*.0165*s,0),RY(hash(i)*6)),i===n-1?k:(i&1?60:61),s);}
function plateStand(o,k,s=1){const a=-.28;sweep('m145chr',o,[[-.06,0,.04],[-.06,.005,-.03],[-.045,.15*s,-.07*s]],.0025);sweep('m145chr',o,[[.06,0,.04],[.06,.005,-.03],[.045,.15*s,-.07*s]],.0025);
 sweep('m145chr',o,[[-.06,0,.04],[-.06,.03,.05],[.06,.03,.05],[.06,0,.04]],.0025);
 plate(C(o,Tr(0,.13*s+.01,0),RX(PI/2+a),Tr(0,0,0)),k,s);}
function cup(o,seed){const OUT=[[0,0],[.022,0],[.025,.004],[.03,.01],[.04,.04],[.046,.06],[.047,.062]],IN=[[.044,.062],[.04,.045],[.028,.012],[0,.01]];
 lathe(K,o,OUT,(u,i,r,y,s)=>y>.056?cell(63,u,.97):cell(61,(u*2)%1.0001,s*.9),{n:16});lathe(K,o,IN,(u,i,r,y,s)=>cell(63,u,.3+s*.5),{n:16,tone:.95});
 sweep(K,o,[[.04,.05,0],[.06,.05,0],[.066,.03,0],[.052,.016,0],[.036,.016,0]],.0045,{n:5,UV:(u,v)=>cell(61,u*.2,v*.2)});
 lathe(K,C(o,Tr(0,-.012,0)),[[0,.0],[.04,.0],[.045,.004],[.06,.008],[.072,.013]],(u,i,r)=>rad(61,.5,.5,.5)(-u*2*PI,r/.075),{n:18});
 lathe(K,C(o,Tr(0,-.012,0)),[[.072,.012],[.06,.006],[.04,-.001],[0,-.001]],(u)=>cell(63,u,.5),{n:18,tone:.9});}
function bowl(o,s=1){const P=[[0,0],[.03,0],[.032,.006],[.055,.025],[.07,.05],[.074,.06]].map(([r,y])=>[r*s,y*s]),I=[[.071,.06],[.066,.048],[.05,.022],[0,.012]].map(([r,y])=>[r*s,y*s]);
 lathe(K,o,P,(u,i,r,y,ss)=>cell(61,(u*2)%1.0001,ss),{n:18});lathe(K,o,I,(u,i,r)=>rad(61,.5,.5,.5)(-u*2*PI,r/(.074*s)),{n:18,tone:.95});}
function jug(o){const P=[[0,0],[.04,0],[.05,.02],[.058,.07],[.05,.12],[.04,.15],[.045,.17],[.05,.18]];
 lathe(K,o,P,(u,i,r,y,s)=>y>.17?cell(63,u,.97):cell(61,u,s),{n:18,wob:(a,y)=>y>.16&&Math.cos(a)>.7?1+.25*(Math.cos(a)-.7)/.3*(y-.16)/.02:1});
 lathe(K,o,[[.046,.178],[.035,.15],[0,.14]],(u)=>cell(63,u,.5),{n:18,tone:.6});
 sweep(K,o,[[-.045,.16,0],[-.08,.15,0],[-.085,.09,0],[-.06,.05,0],[-.052,.045,0]],.006,{n:5,UV:(u,v)=>cell(61,u*.2,v*.2)});}
// ======================================================================== layout
function at(k,f,flip=false){const t=TB147[k];if(!t)return;const[x,z,r0,l,c]=t,r=flip?r0+PI:r0;f(O(x,c?YT:YT-.005,z,r),l,(lx,lz,ry=0,ly=0)=>C(O(x,(c?YT:YT-.005)+ly,z,r),O(lx,0,lz,ry)));}   // flip: goods face the table's other long side
const RF=-12*PI/180;
export function* maltose147GoodsTask(b,lod){if(lod||!TB147.length)return;addMats(b.mats);MT=b.mats;g=new G();g.f=null;
 // --- records under the blue tarp (RECORDS $3) + the right pink table
 at(5,(o,l,P)=>{recordCrate(P(-.8,.02,0),11,{disc:9});recordCrate(P(-.38,.02,.04),23);recordCrate(P(.06,.02,-.02),37,{disc:5});
  lpStand(P(.5,.18,-.1),0,14);lpStand(P(.82,.2,.25),3,15);sleeve(C(P(1.0,.1,.4),RX(-PI/2)),7,2);vinyl(C(P(.98,-.15,.3),RX(-PI/2)),[0,0,.003],14);});
 at(6,(o,l,P)=>{recordCrate(P(-.55,.0,.05),51);recordCrate(P(-.14,.02,-.03),63,{disc:12});radioTable(P(.45,-.05,-.3));lpStand(P(.6,.22,.2),1,15);});
 at(13,(o,l,P)=>{recordCrate(P(-.5,0,.1),71);recordCrate(P(-.1,.02,.08),83,{disc:3});
  for(let i=0;i<5;i++)sleeve(C(P(.35+i*.07,.15-i*.05,-i*.25-.2),RX(-PI/2)),(i*5+2)%12,i+4);vinyl(C(P(.62,-.1,-.6),RX(-PI/2)),[0,0,.006],15);});
 // crate of records on the ground in front of the tarp table
 recordCrate(O(68.25,Y0,45.3,PI/2+.15),97);b.circle(68.25,45.3,.3);
 // --- books: BOOKS 2 FOR $5 table, the red tent table, the rear-yard pink table
 at(10,(o,l,P)=>{bookStack(P(-.7,.12),6,3);bookStack(P(-.45,-.18),4,9);bookRow(P(-.05,-.2),.7,5);bookStack(P(.45,.1),7,17);bookStack(P(.7,-.15),3,25);
  for(let i=0;i<4;i++)book(C(P(.05+i*.09,.15,0,0),RY(-.1+i*.07),Tr(0,.004,0),RX(-PI/2),Tr(0,0,.012)),.16,.23,.024,(i*3)&7,(i*9+4)&31);});
 at(1,(o,l,P)=>{bookRow(P(-.35,-.15),.9,31);bookStack(P(.55,.05),5,41);bookStack(P(-.6,.15),3,47);frame(C(P(.2,-.26),RX(-.2)),0,.32,{gilt:false});});
 at(9,(o,l,P)=>{bookStack(P(-.6,0),5,53);bookStack(P(-.3,.12),4,59);bookRow(P(.25,-.2),.6,61);plateStack(P(.62,.15),5,61);});
 // --- clocks + lamps (pink tent), cameras + radios (white tent), mixed tarp-2 table, the red mid table
 at(2,(o,l,P)=>{mantelClock(P(-.55,-.12,.1));alarmClock(P(-.2,.12,-.2));alarmClock(P(-.08,.1,.3));lamp(P(.25,-.15),0,1);lamp(P(.65,-.12),1,2);
  mantelClock(P(.6,.22,-.15));alarmClock(P(.25,.22,.4));});
 at(3,(o,l,P)=>{radioCathedral(P(-.6,-.15,.05));radioTable(P(-.1,-.15,-.05));camera(P(.3,.12,.15),false);camera(P(.5,.15,-.2),true);camera(P(.7,.0,.3),false);
  camera(P(.42,-.1,0,.0),true);},true);
 at(7,(o,l,P)=>{radioTable(P(-.8,-.1,0));lamp(P(-.35,-.15),0,5);mantelClock(P(.05,-.12,0));camera(P(.4,.15,.3),true);alarmClock(P(.6,.15,-.3));bookStack(P(.95,0),4,73);});
 at(11,(o,l,P)=>{radioCathedral(P(-.55,-.12,0));lamp(P(-.1,-.12),1,7);camera(P(.25,.15,-.2),false);camera(P(.45,.12,.3),true);alarmClock(P(.7,0,-.4));});
 // --- porcelain: white tent table, umbrella table, west long table, rear red table
 at(0,(o,l,P)=>{plateStack(P(-.65,.1),7,60);plateStack(P(-.4,.12),5,61);plateStand(P(-.55,-.2),60);plateStand(P(-.2,-.2),61);
  for(let i=0;i<4;i++)cup(C(P(.05+i*.13,.14,.4*i),Tr(0,.012,0)),i);bowl(P(.15,-.12));bowl(P(.35,-.15),1.2);jug(P(.6,-.1));plateStand(P(.75,-.22),60,.85);});
 at(8,(o,l,P)=>{for(let i=0;i<3;i++)cup(C(P(-.4+i*.13,.12,i),Tr(0,.012,0)),i);jug(P(.05,-.05));plateStand(P(.35,-.2),61);bowl(P(.3,.15));});
 at(12,(o,l,P)=>{plateStack(P(-1.0,.1),6,61);plateStand(P(-.8,-.2),60);bowl(P(-.55,.1));bowl(P(-.4,-.12),.85);jug(P(-.2,0));lamp(P(.2,-.15),1,9);
  for(let i=0;i<3;i++)cup(C(P(.5+i*.13,.12,i*.7),Tr(0,.012,0)),i+3);mantelClock(P(.95,-.1,.05));});
 at(4,(o,l,P)=>{frame(C(P(-.5,-.28,0),RX(-.18)),1,.3);frame(C(P(.0,-.3,0),RX(-.2)),2,.28,{gilt:false});plateStack(P(.5,.1),4,60);cup(C(P(.7,.15),Tr(0,.012,0)),5);});
 at(14,(o,l,P)=>{frame(C(P(-.9,-.3,0),RX(-.15)),3,.5);bookRow(P(-.2,-.15),.7,91);plateStand(P(.4,-.2),61);alarmClock(P(.6,.15));lamp(P(.95,-.12),0,11);});
 // --- paintings leaning against table fronts on the ground + hung on two gridwalls
 const lean=(x,z,ry,p,cw,gilt,t=.2)=>frame(C(O(x,Y0,z,ry),Tr(0,0,0),RX(-t)),p,cw,{gilt});
 lean(75.0+.9,66.4-.45,PI,0,.6,true);lean(75.0-.3,66.4-.47,PI,1,.42,false,.16);lean(75.0-.85,66.4-.46,PI,2,.4,true,.22);
 lean(70.6+.6,68.0-.48,PI,3,.55,false);
 const hang=(x,z,ry,lx,ly,p,cw,gilt)=>frame(C(O(x,Y0,z,ry),Tr(lx,ly,.035)),p,cw,{gilt});
 hang(72.3,33.6,PI/2,-.28,1.05,1,.32,true);hang(72.3,33.6,PI/2,.27,1.15,2,.3,false);hang(72.3,33.6,PI/2,0,.42,0,.62,true);
 hang(91.9,26.6,-PI/2,-.4,1.1,3,.5,true);hang(91.9,26.6,-PI/2,.38,1.18,1,.28,false);hang(91.9,26.6,-PI/2,.0,.45,0,.75,false);hang(91.9,26.6,-PI/2,.45,.55,2,.26,true);
 // plates hung on the rear gridwall
 for(const[lx,ly,k]of[[-.35,1.4,60],[.0,1.45,61],[.35,1.4,60],[-.2,.95,61],[.2,.95,60]])plate(C(O(83.2,Y0,66.0,0),Tr(lx,ly,.03),RX(PI/2)),k,.9);
 // --- EVERYTHING ON BLANKET $1 (quilt) + the plaid blanket next to it
 const BQ=(lx,lz,ry=0)=>C(O(79.1,Y0+.022,43.0,RF),O(lx,0,lz,ry));
 bookStack(BQ(-.6,.3,.3),3,101);bookStack(BQ(-.3,-.35,-.4),2,107);plateStack(BQ(.1,.35),3,61,.9);bowl(BQ(.45,.3));cup(C(BQ(.7,.1),Tr(0,.012,0)),7);
 alarmClock(BQ(-.75,-.2,.4));lamp(BQ(.6,-.35),0,13);for(let i=0;i<3;i++)sleeve(C(BQ(-.1+i*.05,-.1+i*.04,.2*i),Tr(0,.005*i,0),RX(-PI/2)),(i*4+5)%12,i+9);
 camera(BQ(.25,-.1,.8),false);
 const BP=(lx,lz,ry=0)=>C(O(82.5,Y0+.024,42.3,RF+.1),O(lx,0,lz,ry));
 frame(C(BP(-.5,-.3),Tr(0,.012,0),RX(-PI/2)),3,.42,{gilt:true});frame(C(BP(.35,-.45),RX(-.25)),1,.34,{gilt:false});radioTable(BP(.45,.25,-.3));plateStand(BP(-.2,.4),60);bookStack(BP(.0,.1,.4),4,113);
 g.flush(b);yield;}
