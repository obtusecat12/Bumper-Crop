// Level 1 v3 props: textured crates (15+ looks) and leftovers (chairs, buckets, signs, AC units, boards,
// bikes, ladders, cables, tyres, cones, debris). Pure, hash-driven; everything goes through the world's
// merged-geometry put(), so props cost no draw calls of their own.
import {l1Hash} from './level1-layout.js?v=113';
export function makeL1Props(T,{P,C,box,cyl,vcyl,solid}){
 const torus=new T.TorusGeometry(1,.18,5,14),wheel=new T.TorusGeometry(1,.05,4,16),cone=new T.CylinderGeometry(.03,.5,1,10,1,false),disc=new T.CylinderGeometry(1,1,1,14,1,false);
 // place a part in a prop's local frame (lx,lz) rotated by ry about (px,pz); rx/rz tilt the part itself
 const R=(g,c,px,pz,ry,lx,y,lz,w,h,d,rr=0,rx=0,rz=0)=>{const cs=Math.cos(ry),sn=Math.sin(ry);P(g,c,px+lx*cs+lz*sn,y,pz-lx*sn+lz*cs,w,h,d,ry+rr,rx,rz);};
 const SOL=(px,pz,ry,w,d)=>{const a=Math.abs(Math.cos(ry)),b=Math.abs(Math.sin(ry));solid(px,pz,w*a+d*b+.05,w*b+d*a+.05);};
 // crate looks: material + size range
 const LOOK=[['crate1',.8,.8,.8],['crate2',1.0,.62,.7],['crate4',.9,.7,.9],['crate5',.72,.72,.72],['carton',.6,.45,.45],['carton2',.5,.4,.4],['carton3',.42,.3,.32],
  ['tote',.6,.32,.4],['tote2',.6,.32,.4],['tote3',.6,.32,.4],['tote4',.6,.32,.4],['locker',.95,.42,.48],['locker2',.95,.42,.48],['rustbox',.55,.5,.5]];
 function crate(px,pz,ry,y,k,s=1){const[m,w,h,d]=LOOK[k%LOOK.length];R(box,C[m],px,pz,ry,0,y+h*s/2,0,w*s,h*s,d*s);return h*s;}
 const r=(a,b,s)=>l1Hash(a,b,s);
 // ---- leftovers ----
 function openCrate(px,pz,ry){const w=.8,h=.6,t=.03,c=C.crate1;R(box,C.osbD,px,pz,ry,0,.03,0,w,.04,w);for(const[a,b,ww,dd]of[[0,w/2,w,t],[0,-w/2,w,t],[w/2,0,t,w],[-w/2,0,t,w]])R(box,c,px,pz,ry,a,h/2,b,ww,h,dd);
  R(box,C.straw,px,pz,ry,0,h*.55,0,w-.08,.05,w-.08);R(box,c,px,pz,ry,.25,.42,w/2+.1,w,.03,w,.4,-1.15);SOL(px,pz,ry,w,w);}
 function broken(px,pz,ry,k){R(box,C.crate2,px,pz,ry,0,.34,0,.95,.6,.7,0,0,.12);for(let i=0;i<4;i++)R(box,C.osb,px,pz,ry,-.3+i*.32,.02+i*.012,.7+(i%2)*.1,.9,.025,.11,.6+i*.7);SOL(px,pz,ry,1,.8);}
 function stack(px,pz,ry,k){let y=0;const n=2+Math.floor(r(k,7,1)*2);for(let i=0;i<n;i++){const kk=Math.floor(r(k,i,2)*LOOK.length);y+=crate(px+(r(k,i,3)-.5)*.08,pz+(r(k,i,4)-.5)*.08,ry+(r(k,i,5)-.5)*.3,y,kk,i?.85:1);}SOL(px,pz,ry,.9,.8);}
 function pallet(px,pz,ry,k){R(box,C.osb,px,pz,ry,0,.07,0,1.2,.14,1.0);for(let i=0;i<4;i++){const kk=4+Math.floor(r(k,i,6)*3);crate(px+((i&1)-.5)*.55*Math.cos(ry),pz-((i&1)-.5)*.55*Math.sin(ry)+((i>>1)-.5)*.48,ry,.14,kk,.95);}
  if(r(k,9,7)>.4)crate(px,pz,ry+.3,.14+.45,4,.9);R(box,C.foil,px,pz,ry,0,.5,0,1.22,.9,1.02);SOL(px,pz,ry,1.25,1.05);}
 function barber(px,pz,ry){R(disc,C.chrome,px,pz,ry,0,.03,0,.32,.05,.32);R(vcyl,C.chrome,px,pz,ry,0,.28,0,.08,.45,.08);R(box,C.leather,px,pz,ry,0,.56,0,.6,.16,.56);R(box,C.leather,px,pz,ry,0,.95,-.27,.56,.66,.14,0,-.12);
  R(box,C.leather,px,pz,ry,0,1.36,-.33,.28,.18,.12,0,-.12);for(const s of [-1,1])R(box,C.leather,px,pz,ry,s*.33,.74,0,.1,.12,.52);R(box,C.chrome,px,pz,ry,0,.25,.35,.42,.03,.12,0,.5);SOL(px,pz,ry,.75,.75);}
 function chair(px,pz,ry,tip){const c=C.steelP,rx=tip?1.45:0;R(box,c,px,pz,ry,0,tip?.24:.45,0,.42,.03,.4,0,rx);if(!tip){R(box,c,px,pz,ry,0,.72,-.2,.42,.3,.03);for(const a of[-.19,.19])for(const b of[-.18,.18])R(box,c,px,pz,ry,a,.22,b,.025,.45,.025);R(box,c,px,pz,ry,-.19,.6,-.2,.025,.3,.025);R(box,c,px,pz,ry,.19,.6,-.2,.025,.3,.025);}
  else{R(box,c,px,pz,ry,0,.2,.28,.42,.4,.03,0,.4);}SOL(px,pz,ry,.5,.5);}
 function bucket(px,pz,ry,k){const n=1+Math.floor(r(k,1,8)*3);for(let i=0;i<n;i++){const a=i*1.9+k,o=i?.36:0,x=px+Math.cos(a)*o,z=pz+Math.sin(a)*o;R(vcyl,C.bucket,x,z,ry+a,0,.19,0,.15,.38,.15);R(disc,C.steelP,x,z,0,0,.385,0,.152,.012,.152);if(i===2)R(vcyl,C.bucket,x,z,ry,0,.15,.25,.15,.38,.15,0,1.57);}SOL(px,pz,0,.5,.5);}
 function wetsign(px,pz,ry){for(const s of[-1,1])R(box,C.wetsign,px,pz,ry,0,.33,s*.1,.3,.64,.012,0,s*.16);}
 function acUnit(px,pz,ry){R(box,C.ac,px,pz,ry,0,.33,0,.8,.62,.3);R(box,C.steelP,px,pz,ry,0,.02,0,.7,.04,.32);R(cyl,C.pipeW,px,pz,ry,.5,.5,-.1,.4,.02,.02);SOL(px,pz,ry,.85,.35);}
 function boards(px,pz,ry,k){const n=2+Math.floor(r(k,2,9)*3);for(let i=0;i<n;i++){const w=.6+r(k,i,10)*.6,h=1.6+r(k,i,11)*.8,m=r(k,i,12)>.5?C.osb:C.plyW;R(box,m,px,pz,ry,(i-n/2)*.25,h/2*Math.cos(.2),.1+i*.035+h/2*Math.sin(.2),w,h,.02,0,-.2-(i%2)*.04);}SOL(px,pz,ry,1.1,.5);}
 function ladder(px,pz,ry){const h=2.4,t=-.22;for(const s of[-.21,.21])R(box,C.alu,px,pz,ry,s,h/2*Math.cos(t),-h/2*Math.sin(t),.05,h,.025,0,t);for(let i=0;i<8;i++){const y=.25+i*.28;R(box,C.alu,px,pz,ry,0,y*Math.cos(t),-y*Math.sin(t),.4,.025,.04,0,t);}SOL(px,pz,ry,.5,.4);}
 function bike(px,pz,ry){for(const s of[-.52,.52]){R(wheel,C.rubber,px,pz,ry,s,.34,0,.31,.31,.6);R(wheel,C.chrome,px,pz,ry,s,.34,0,.27,.27,.2);}const f=C.bikeF;R(box,f,px,pz,ry,0,.52,0,.62,.03,.03,0,0,.0);R(box,f,px,pz,ry,-.18,.5,0,.03,.4,.03,0,0,.35);R(box,f,px,pz,ry,.3,.55,0,.03,.45,.03,0,0,-.3);
  R(box,C.leather,px,pz,ry,-.24,.74,0,.2,.04,.08);R(box,f,px,pz,ry,.36,.84,0,.03,.03,.46);SOL(px,pz,ry,1.4,.4);}
 function bikeDown(px,pz,ry){for(const s of[-.52,.52])R(wheel,C.rubber,px,pz,ry,s,.03,0,.31,.31,.6,0,Math.PI/2);R(box,C.bikeF,px,pz,ry,0,.08,0,1.0,.03,.03);R(box,C.bikeF,px,pz,ry,.36,.1,.3,.03,.03,.46);SOL(px,pz,ry,1.4,.8);}
 function cable(px,pz,ry,k){R(torus,C.cable,px,pz,ry,0,.05,0,.32,.32,.6,0,Math.PI/2);R(torus,C.cable,px,pz,ry,.05,.1,.03,.29,.29,.6,0,Math.PI/2);R(box,C.cable,px,pz,ry,.6,.012,.2,1.1,.02,.02,.4);R(box,C.cable,px,pz,ry,1.3,.012,.6,.8,.02,.02,-.2);}
 function tyres(px,pz,ry,k){const n=1+Math.floor(r(k,3,13)*3);for(let i=0;i<n;i++)R(torus,C.rubber,px+(i===n-1&&n>1?.0:0),pz,ry,0,.11+i*.2,0,.3,.3,.55,0,Math.PI/2);if(r(k,4,14)>.5)R(torus,C.rubber,px,pz,ry,.75,.32,0,.3,.3,.55,.3);SOL(px,pz,ry,.8,.7);}
 function cones(px,pz,ry,k){const n=1+Math.floor(r(k,5,15)*3);for(let i=0;i<n;i++){const x=px+i*.6*Math.cos(ry),z=pz-i*.6*Math.sin(ry);if(i===1&&r(k,6,16)>.5){R(cone,C.cone,x,z,0,0,.12,0,.16,.68,.16,0,1.5);continue;}R(cone,C.cone,x,z,0,0,.36,0,.16,.68,.16);R(box,C.rubber,x,z,ry,0,.02,0,.4,.03,.4);}}
 function debris(px,pz,ry,k){const n=4+Math.floor(r(k,8,17)*6);for(let i=0;i<n;i++){const a=r(k,i,18)*6.28,d=r(k,i,19)*.9,x=px+Math.cos(a)*d,z=pz+Math.sin(a)*d,t=r(k,i,20);
   if(t<.35)R(box,i%2?C.osb:C.plyW,x,z,a,0,.02+i*.01,0,.6+t*1.6,.025,.1+t*.1);else if(t<.6)R(box,C.paper,x,z,a,0,.006,0,.2,.004,.28);else if(t<.8)R(box,C.cartontop,x,z,a,0,.01,0,.5,.01,.4);else R(box,C.rust,x,z,a,0,.03,0,.5,.05,.06);}}
 // renovation (衔尾) and timber-room (传说) leftovers
 function grilleLean(px,pz,ry){R(box,C.grille,px,pz,ry,0,1.0,.18,1.25,2.05,.04,0,-.12);if(l1Hash(px*7|0,pz*7|0,24)>.5)R(box,C.grille,px,pz,ry,.35,.95,.3,1.25,1.95,.04,0,-.16);SOL(px,pz,ry,1.4,.5);}
 function doorLean(px,pz,ry,k){const m=r(k,3,25)>.4?C.dooryel:C.doorwood;R(box,m,px,pz,ry,0,1.02,.22,.9,2.05,.045,.08,-.2);if(r(k,4,26)>.5)R(box,C.frame,px,pz,ry,.5,1.05,.3,.07,2.2,.05,0,-.15);SOL(px,pz,ry,1.1,.5);}
 function sawhorse(px,pz,ry,k){for(const a of[-.55,.55])for(const b of[-.16,.16])R(box,C.osb,px,pz,ry,a,.36,b,.05,.74,.05,0,b>0?.2:-.2);R(box,C.osb,px,pz,ry,0,.72,0,1.3,.06,.1);
  if(r(k,5,27)>.4)R(box,C.plyW,px,pz,ry,.1,.77,0,2.0,.03,.6,.12);if(r(k,6,28)>.5)R(vcyl,C.bucket,px,pz,ry,.9,.19,.3,.15,.38,.15);SOL(px,pz,ry,1.5,.7);}
 function rubble(px,pz,ry,k){debris(px,pz,ry,k);for(let i=0;i<3;i++){const a=r(k,i,29)*6.28,d=.2+r(k,i,30)*.5;R(box,C.paper,px+Math.cos(a)*d,pz+Math.sin(a)*d,a,0,.1,0,.55,.18,.36,0,.0,(r(k,i,31)-.5)*.3);}
  R(box,C.conc||C.low,px,pz,ry,.5,.12,-.3,.5,.24,.4,.4);R(box,C.low,px,pz,ry,-.4,.08,.4,.35,.16,.3,1.1);SOL(px,pz,ry,1.2,1.0);}
 function desk(px,pz,ry,k){R(box,C.desk,px,pz,ry,0,.74,0,1.3,.05,.7);for(const a of[-.6,.6])for(const b of[-.3,.3])R(box,C.desk,px,pz,ry,a,.36,b,.05,.72,.05);R(box,C.desk,px,pz,ry,.4,.5,0,.4,.42,.62);
  if(r(k,7,32)>.4)R(box,C.paper,px,pz,ry,-.2,.77,.05,.3,.01,.22,.3);if(r(k,8,33)>.3)chair(px+.1*Math.cos(ry)+.6*Math.sin(ry),pz-.1*Math.sin(ry)+.6*Math.cos(ry),ry+Math.PI+(r(k,9,34)-.5),r(k,10,35)>.8);SOL(px,pz,ry,1.35,.75);}
 function cabinet(px,pz,ry,k){R(box,C.desk,px,pz,ry,0,.9,0,.9,1.8,.42);for(let i=0;i<3;i++)R(box,C.wainsP||C.desk,px,pz,ry,0,.35+i*.55,.215,.8,.45,.01);SOL(px,pz,ry,.95,.5);}
 function note(px,pz,ry){R(box,C.paper,px,pz,ry,0,.004,0,.21,.004,.29,.3);}
 // ---- clusters: a few hand-composed vignettes; picked per bay by hash, dressed against a wall when there is one ----
 const KINDS=[
  (x,z,ry,k)=>stack(x,z,ry,k),(x,z,ry,k)=>crate(x,z,ry,0,Math.floor(r(k,0,21)*LOOK.length)),(x,z,ry,k)=>openCrate(x,z,ry),(x,z,ry,k)=>broken(x,z,ry,k),(x,z,ry,k)=>pallet(x,z,ry,k),
  (x,z,ry,k)=>barber(x,z,ry),(x,z,ry,k)=>chair(x,z,ry,r(k,1,22)>.6),(x,z,ry,k)=>bucket(x,z,ry,k),(x,z,ry,k)=>wetsign(x,z,ry),(x,z,ry,k)=>acUnit(x,z,ry),
  (x,z,ry,k)=>boards(x,z,ry,k),(x,z,ry,k)=>ladder(x,z,ry),(x,z,ry,k)=>r(k,2,23)>.5?bike(x,z,ry):bikeDown(x,z,ry),(x,z,ry,k)=>cable(x,z,ry,k),(x,z,ry,k)=>tyres(x,z,ry,k),(x,z,ry,k)=>cones(x,z,ry,k),(x,z,ry,k)=>debris(x,z,ry,k),
  (x,z,ry,k)=>grilleLean(x,z,ry),(x,z,ry,k)=>doorLean(x,z,ry,k),(x,z,ry,k)=>sawhorse(x,z,ry,k),(x,z,ry,k)=>rubble(x,z,ry,k),(x,z,ry,k)=>desk(x,z,ry,k),(x,z,ry,k)=>cabinet(x,z,ry,k)];
 // wall-hugging kinds (backs to a wall): boards, ladder, ac, bike, stack, pallet, barber, chair
 const WALL=[10,11,9,12,0,4,5,6,1,7],FREE=[1,2,3,7,8,13,14,15,16,0,6,12],GARAGE=[14,15,8,16,7,13,1,3],STORE=[0,1,2,3,4,1,0],ROOM=[5,6,7,8,9,10,16],RENO=[17,18,19,20,20,16,11,7,13,10,15,8],FABLE=[21,22,6,18,1,10,21,2];
 function place(kind,x,z,ry,k){KINDS[kind](x,z,ry,k);}
 return{place,KINDS,WALL,FREE,GARAGE,STORE,ROOM,RENO,FABLE,crate,LOOK,note,debris};
}
