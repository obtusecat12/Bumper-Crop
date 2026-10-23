// V146 首都街角灰泥联排楼 — T1 main corner building (ref files/ref-1023-stucco-terrace.webp, spec notes/spec-1023-stucco-terrace.md).
// Regency / late-Georgian London corner terrace: dark sooty stock brick, white rusticated stucco ground storey, a giant order of
// white stucco pilasters with Corinthian capitals over floors 1-2, entablature + main cornice, brick attic storey with pilaster
// strips, top cornice + stucco parapet, slate roof, brick chimney stacks with orange pots, a lead/glass roof light. Six-over-six
// sash windows (real glazing bars) with one of three generated interiors; on the short (north) front the first-floor windows
// carry aedicules (architrave, frieze, triangular / segmental pediment) and the entrance porch has a balustraded balcony; along
// the long (east) front a continuous black cast-iron balcony runs at first-floor level.
// Site: block (-2,-2) north-east corner (corner = block-local (100,100) = city (-124,-124)); the photo camera stands across
// the intersection (city ~ (-104,-104)) looking south-west: the short north front is on screen left, the long east front
// recedes to the right down the x = -112 avenue. Local frame: corner at (0,0), north face z = 0 (x -10.5..0), east face x = 0
// (z 0..-40). Textures bc/tools/stucco146_assets.py -> assets/l11-v146. Off: ?stucco146=0.
import * as T from './vendor/three.module.min.js';
import {urbanHash} from './urban-batch.js?v=60';
import {Soup,face,fq,fbox,wall,reveal,TILE,addMats} from './maltose145-bldg.js?v=145c';
import {stucco146T2Task} from './stucco146-t2.js?v=146d';
import {stucco146T3Task} from './stucco146-t3.js?v=146d'; // T3 lush plane + lime trees // T2 left terrace, areas + railings, street furniture, cars
const A=new URL('./assets/l11-v146/',import.meta.url).href,PI=Math.PI;
function tex(n,srgb=true,rep=true){const t=new T.TextureLoader().load(A+n+'.webp?v=146b');if(srgb)t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;t.magFilter=T.NearestFilter;if(rep)t.wrapS=t.wrapT=T.RepeatWrapping;return t;}
let M=null;
export function addMats146(m){addMats(m);if(m.s146br)return;if(!M){const S=(o)=>new T.MeshStandardMaterial({metalness:0,roughness:1,vertexColors:true,...o});
 const W=(n,o={})=>S({map:tex(n),normalMap:tex(n+'-n',false),roughnessMap:tex(n+'-r',false),...o});
 M={s146br:W('sbrick146'),s146ru:W('srust146'),s146st:W('sstuc146'),s146sl:W('slate146'),s146tc:W('terra146'),
  s146ir:W('iron146',{metalness:.35}),s146ca:S({map:tex('scap146',true,false),normalMap:tex('scap146-n',false),roughness:.8}),
  s146dr:S({map:tex('door146',true,false),normalMap:tex('door146-n',false),roughness:.3,metalness:.1}),
  s146gl:S({map:tex('win146',true,false),roughness:.1,metalness:.3}),
  s146rl:S({map:tex('rail146',true,true),alphaTest:.5,side:T.DoubleSide,roughness:.45,metalness:.35}),
  s146sk:S({color:0x9aa6ac,roughness:.08,metalness:.5,transparent:true,opacity:.55})};
 for(const[k,v]of Object.entries(M))v.name='V146 '+k;}Object.assign(m,M);}
Object.assign(TILE,{s146br:[1.35,1.65],s146ru:[2.15,2.0],s146st:[2.4,2.4],s146sl:[2.6,2.6],s146tc:[.8,.8],s146ir:[.8,.8],s146rl:[1,1]});
export const STUCCO146_ON=!/[?&]stucco146=0\b/.test(globalThis.location?.search||'');
// ---------------------------------------------------------------- storey heights (pavement = 0)
const G=5.0,F1=8.4,F2=11.4,CAP0=11.15,CAP1=11.75,ENT=12.9,ATT=15.2,PAR=15.6,PTOP=16.3;
const NL=10.5,EL=40;   // north front length (x -10.5..0), east front length (z 0..-40)
// ---------------------------------------------------------------- helpers
function lathe(S,k,P,prof,n=6,ry=0){for(let j=0;j<prof.length-1;j++){const[r0,y0]=prof[j],[r1,y1]=prof[j+1];
 for(let i=0;i<n;i++){const a0=ry+i/n*2*PI,a1=ry+(i+1)/n*2*PI,p=(r,y,a)=>[P[0]+Math.cos(a)*r,P[1]+y,P[2]+Math.sin(a)*r];
  S.q(k,p(r0,y0,a1),p(r0,y0,a0),p(r1,y1,a0),p(r1,y1,a1),[[(i+1)/n,y0],[i/n,y0],[i/n,y1],[(i+1)/n,y1]]);}}}
// six-over-six (rows x 3) sash: glass + frame + meeting rail + glazing bars, recessed D
function sash146(S,F,H,R,lod,rows=2){const D=.12,a=H.a,b=H.b,s=H.s,h=H.h,cell=R()*3|0,mir=R()<.5,ft=.055,fk='m145wp';
 const uvG=(x,y)=>{let t=(x-a)/(b-a);if(mir)t=1-t;return[(cell+t)/3,(y-s)/(h-s)];};
 S.q('s146gl',F.P(a,s,-D),F.P(b,s,-D),F.P(b,h,-D),F.P(a,h,-D),[uvG(a,s),uvG(b,s),uvG(b,h),uvG(a,h)]);
 if(lod)return;
 fbox(S,fk,F,a,a+ft,s,h,-D-.02,-D+.05,false,'b');fbox(S,fk,F,b-ft,b,s,h,-D-.02,-D+.05,false,'b');
 fbox(S,fk,F,a,b,h-ft,h,-D-.02,-D+.05,false,'b');fbox(S,fk,F,a,b,s,s+ft*1.5,-D-.02,-D+.07,false,'b');
 const m=s+(h-s)*.5;fbox(S,fk,F,a+ft,b-ft,m-.035,m+.035,-D-.01,-D+.07,false,'b');
 // glazing bars: 2 verticals per sash (3 panes wide), rows-1 horizontals per sash (upper sash a touch proud of the lower)
 for(const[y0,y1,w]of[[s+ft*1.5,m-.035,-D+.035],[m+.035,h-ft,-D+.01]]){for(const t of[1/3,2/3]){const u=a+ft+(b-a-2*ft)*t;fbox(S,fk,F,u-.014,u+.014,y0,y1,-D,w,false,'b');}
  for(let r=1;r<rows;r++){const y=y0+(y1-y0)*r/rows;fbox(S,fk,F,a+ft,b-ft,y-.014,y+.014,-D,w,false,'b');}}}
// window in a wall: reveal + sash + sill (+ stucco architrave)
function win(S,F,H,R,lod,o={}){const k=o.wall||'s146br';if(!lod)reveal(S,k,F,H,.3);sash146(S,F,H,R,lod,o.rows||2);if(lod)return;
 fbox(S,'s146st',F,H.a-.08,H.b+.08,H.s-.1,H.s,-.02,.08,false,'b');   // stone/stucco sill
 if(o.arch){const t=.13;fbox(S,'s146st',F,H.a-t,H.a,H.s,H.h,-.02,.05,false,'b');fbox(S,'s146st',F,H.b,H.b+t,H.s,H.h,-.02,.05,false,'b');fbox(S,'s146st',F,H.a-t,H.b+t,H.h,H.h+t,-.02,.05,false,'b');}}
// aedicule hood over a window: frieze + cornice + pediment (tri | seg), consoles
function aedicule(S,F,H,kind){const a=H.a-.2,b=H.b+.2,y=H.h+.13,c=(a+b)/2;
 fbox(S,'s146st',F,a+.05,b-.05,y,y+.3,-.02,.07,false,'b');fbox(S,'s146st',F,a-.06,b+.06,y+.3,y+.42,-.02,.2,false,'b');
 for(const u of[a,b-.14])fbox(S,'s146st',F,u,u+.14,y-.42,y+.3,-.02,.16,false,'b');   // consoles
 const w0=.0,w1=.18,yb=y+.42;
 if(kind==='tri'){const ht=.45,L=[a-.06,yb],R2=[b+.06,yb],Tp=[c,yb+ht];
  S.q('s146st',F.P(L[0],L[1],w1),F.P(R2[0],R2[1],w1),F.P(c,Tp[1],w1),F.P(c,Tp[1],w1),[[0,0],[1,0],[.5,.4],[.5,.4]]);
  for(const[p,q]of[[L,Tp],[Tp,R2]]){S.q('s146st',F.P(p[0],p[1],w1),F.P(q[0],q[1],w1),F.P(q[0],q[1]+.12,w1+.04),F.P(p[0],p[1]+.12,w1+.04),[[0,0],[1,0],[1,.1],[0,.1]]);
   S.q('s146st',F.P(p[0],p[1]+.12,w1+.04),F.P(q[0],q[1]+.12,w1+.04),F.P(q[0],q[1]+.12,w0),F.P(p[0],p[1]+.12,w0),[[0,0],[1,0],[1,.1],[0,.1]]);}}
 else{const N=8,r=(b-a)/2+.06,ht=.32;let pp=null;for(let i=0;i<=N;i++){const t=PI-i/N*PI,p=[c+Math.cos(t)*r,yb+Math.sin(t)*ht];
  if(pp){S.q('s146st',F.P(pp[0],yb,w1),F.P(p[0],yb,w1),F.P(p[0],p[1],w1),F.P(pp[0],pp[1],w1),[[0,0],[.1,0],[.1,.3],[0,.3]]);
   S.q('s146st',F.P(pp[0],pp[1],w1),F.P(p[0],p[1],w1),F.P(p[0],p[1]+.1,w1+.04),F.P(pp[0],pp[1]+.1,w1+.04),[[0,0],[.1,0],[.1,.1],[0,.1]]);
   S.q('s146st',F.P(pp[0],pp[1]+.1,w1+.04),F.P(p[0],p[1]+.1,w1+.04),F.P(p[0],p[1]+.1,w0),F.P(pp[0],pp[1]+.1,w0),[[0,0],[.1,0],[.1,.1],[0,.1]]);}pp=p;}}}
// giant-order pilaster: base, shaft, Corinthian capital (textured front + abacus)
function pilaster(S,F,u0,u1,lod,p=.12){fbox(S,'s146st',F,u0-.05,u1+.05,G,G+.4,-.02,p+.05,false,'b');fbox(S,'s146st',F,u0,u1,G+.4,CAP0,-.02,p,false,'b');
 fbox(S,'s146st',F,u0-.04,u1+.04,CAP0,CAP0+.06,-.02,p+.04,false,'b');
 fbox(S,'s146st',F,u0-.03,u1+.03,CAP0+.06,CAP1-.08,-.02,p+.06,false,'bf');fq(S,'s146ca',F,u0-.03,u1+.03,CAP0+.06,CAP1-.08,p+.06,[[0,0],[1,0],[1,1],[0,1]]);
 fbox(S,'s146st',F,u0-.1,u1+.1,CAP1-.08,CAP1,-.02,p+.12,false,'b');
 if(!lod)for(const u of[u0-.03,u1+.03]){const y=CAP1-.18;S.tube('s146st',F.P(u,y,p+.02),F.P(u,y,p+.1),.06,6);}}   // corner volutes
// entablature + main cornice over the giant order (architrave, frieze, bed, modillions, corona, cyma)
function entab(S,F,u0,u1,lod,e=[1,1]){fbox(S,'s146st',F,u0-.12*e[0],u1+.12*e[1],CAP1,CAP1+.28,0,.2,false,'b');fbox(S,'s146st',F,u0-.12*e[0],u1+.12*e[1],CAP1+.28,ENT-.62,0,.16,false,'b');
 fbox(S,'s146st',F,u0-.3*e[0],u1+.3*e[1],ENT-.62,ENT-.48,0,.3,false,'b');   // T4: bed mould reaches the other face's bed (no corner notch)
 if(!lod){const N=Math.floor((u1-u0)/.5);for(let i=0;i<=N;i++){const u=u0+.08+i*(u1-u0-.16)/N;fbox(S,'s146st',F,u-.05,u+.05,ENT-.48,ENT-.3,.25,.62,false,'b');}
  // T4: diagonal corner modillion + a soffit backing strip over the modillion zone so the corner reads closed from the street
  if(e[0])fbox(S,'s146st',F,u0-.62,u0-.25,ENT-.48,ENT-.3,.25,.62,false,'b');if(e[1])fbox(S,'s146st',F,u1+.25,u1+.62,ENT-.48,ENT-.3,.25,.62,false,'b');}
 fbox(S,'s146st',F,u0-.3*e[0],u1+.3*e[1],ENT-.48,ENT-.3,0,.25,false,'b');
 fbox(S,'s146st',F,u0-.66*e[0],u1+.66*e[1],ENT-.3,ENT-.08,0,.68,false,'b');fbox(S,'s146st',F,u0-.7*e[0],u1+.7*e[1],ENT-.08,ENT,0,.72,false,'b');}
// cast-iron balcony: stucco slab on consoles, alpha-tested pattern panel, top/bottom rails, standards
function balcony(S,F,u0,u1,y,dep,lod){fbox(S,'s146st',F,u0,u1,y-.14,y,0,dep,false,'b');
 if(!lod){const n=Math.floor((u1-u0)/1.5);for(let i=0;i<=n;i++){const u=u0+.1+i*(u1-u0-.2)/n;fbox(S,'s146st',F,u-.07,u+.07,y-.45,y-.14,0,dep*.7,false,'b');}}
 const w=dep-.06,h=.95;fq(S,'s146rl',F,u0+.04,u1-.04,y,y+h-.05,w,[[0,0],[(u1-u0)/.5,0],[(u1-u0)/.5,1],[0,1]]);
 S.tube('s146ir',F.P(u0+.03,y+h,w),F.P(u1-.03,y+h,w),.03,4);S.tube('s146ir',F.P(u0+.03,y+.06,w),F.P(u1-.03,y+.06,w),.018,4);
 for(const u of[u0+.04,u1-.04]){S.tube('s146ir',F.P(u,y,w),F.P(u,y+h,w),.02,4);S.q('s146rl',F.P(u,y,0),F.P(u,y,w),F.P(u,y+h-.05,w),F.P(u,y+h-.05,0),[[0,0],[dep/.5,0],[dep/.5,1],[0,1]]);S.tube('s146ir',F.P(u,y+h,w),F.P(u,y+h,0),.025,4);}
 if(!lod){const n=Math.floor((u1-u0)/1.0);for(let i=1;i<n;i++){const u=u0+i*(u1-u0)/n;S.tube('s146ir',F.P(u,y,w),F.P(u,y+h,w),.016,4);}}}
// stucco balustrade (porch top): plinth, lathe balusters, coping
function balustrade(S,F,u0,u1,y,w,lod){fbox(S,'s146st',F,u0,u1,y,y+.12,w-.16,w,false,'b');fbox(S,'s146st',F,u0-.04,u1+.04,y+.72,y+.84,w-.2,w+.04,false,'b');
 for(const u of[u0+.1,u1-.1])fbox(S,'s146st',F,u-.1,u+.1,y+.12,y+.72,w-.18,w,false,'b');
 const n=Math.floor((u1-u0-.4)/.2);for(let i=0;i<n;i++){const u=u0+.3+i*(u1-u0-.6)/(n-1),P=F.P(u,y+.12,w-.08);
  if(lod)fbox(S,'s146st',F,u-.035,u+.035,y+.12,y+.72,w-.12,w-.04,true,'bt');
  else lathe(S,'s146st',P,[[.045,0],[.045,.06],[.03,.1],[.065,.3],[.03,.48],[.04,.54],[.05,.6]],6);}}
// chimney stack with pots
function chimney(S,cx,cz,w,d,y0,y1,pots,lod){const F=face([cx,cz+d/2],[0,1]);fbox(S,'s146br',F,-w/2,w/2,y0,y1,-d,0,false,'d');
 fbox(S,'s146st',F,-w/2-.06,w/2+.06,y1,y1+.16,-d-.06,.06,false,'d');fbox(S,'s146br',F,-w/2+.04,w/2-.04,y1+.16,y1+.32,-d+.04,-.04,false,'d');
 for(let i=0;i<pots;i++){const x=cx-w/2+(i+.5)*w/pots;lathe(S,'s146tc',[x,y1+.32,cz],[[.15,0],[.15,.08],[.12,.12],[.115,.55],[.14,.62],[.14,.7],[.11,.72]],lod?5:8);}}
// ================================================================= main building
function mainBuilding(S,b,lod,R){const FN=face([0,0],[0,1]),FE=face([0,0],[1,0]);
 // ---- floor bands per face: ground (rusticated stucco) 0..G, brick G..ENT (pilasters + entablature over), attic ENT..ATT
 // north front bays (u -13..0): A centre -2.6 (aedicule tri), B -5.82 (narrow, plain), C -9.5 (aedicule seg, porch below)
 const nB=[{c:-2.5,w:1.12,ped:'tri'},{c:-4.75,w:.9},{c:-7.9,w:1.1,ped:'seg'}],nP=[[-3.95,-3.4],[-6.1,-5.55]];
 const eB=[];for(let i=0;i<13;i++)eB.push({c:1.1+1.375+i*2.75,w:1.05});const ePil=[1,2,3,4,6,7,9,10,12,13].map(i=>[1.1+i*2.75-.26,1.1+i*2.75+.26]).filter(p=>p[1]<EL-1.2);
 const fl=(B,s,h)=>B.map(q=>({a:q.c-q.w/2,b:q.c+q.w/2,s,h,q}));
 for(const[F,B,u0,u1,isN]of[[FN,nB,-NL,0,true],[FE,eB,0,EL,false]]){
  // ground storey: rusticated stucco, ground windows (north: porch door under C instead of a window)
  const gw=fl(B,1.4,3.9).filter(H=>!(isN&&H.q.c<-7)),door=isN?{a:-8.55,b:-7.25,s:0,h:3.6}:{a:eB[9].c-.6,b:eB[9].c+.6,s:0,h:3.6};
  const gwh=isN?gw:gw.filter(H=>Math.abs(H.q.c-eB[9].c)>.1);
  wall(S,'s146ru',F,u0,u1,.35,G,[...gwh.map(H=>({...H,s:Math.max(H.s,.35)})),{...door,s:.35}]);fq(S,'s146st',F,u0,u1,0,.35,.04);
  fbox(S,'s146st',F,u0,u1,0,.35,0,.06,false,'b');   // plinth
  for(const H of gwh)win(S,F,H,R,lod,{wall:'s146ru'});
  reveal(S,'s146ru',F,{...door,s:.35},.45);fq(S,'s146dr',F,door.a,door.b,.35,door.h-.55,-.45,[[0,0],[1,0],[1,1],[0,1]]);
  // fanlight over the door (semicircle-ish glass + iron spokes)
  {const c=(door.a+door.b)/2,r=(door.b-door.a)/2;fq(S,'s146gl',F,door.a,door.b,door.h-.55,door.h,-.44,[[.05,.6],[.28,.6],[.28,.9],[.05,.9]]);
   if(!lod)for(let i=0;i<=6;i++){const t=i/6*PI;S.tube('s146ir',F.P(c,door.h-.55,-.42),F.P(c+Math.cos(t)*r,door.h-.55+Math.sin(t)*.5,-.42),.012,3);}
   fbox(S,'s146st',F,door.a-.04,door.b+.04,door.h-.6,door.h-.53,-.45,-.38,false,'b');}
  // band at first floor
  fbox(S,'s146st',F,u0,u1,G-.32,G,0,.16,false,'b');
  // brick piano nobile + second floor
  const h1=fl(B,isN?5.75:5.18,isN?7.85:7.75),h2=fl(B,8.95,10.7);
  wall(S,'s146br',F,u0,u1,G,ENT-.62,[...h1,...h2]);
  for(const H of h1){win(S,F,H,R,lod,{rows:isN?2:3,arch:isN});if(isN&&H.q.ped&&!lod)aedicule(S,F,H,H.q.ped);}
  for(const H of h2)win(S,F,H,R,lod,{arch:isN});
  // pilasters (north: two + corner pier; east: rhythm from the photo)
  for(const[a,c]of(isN?nP:ePil))pilaster(S,F,a,c,lod);
  entab(S,F,u0,u1,lod,[1,1]);
  // attic: brick between pilaster strips, small sashes, top cornice + parapet
  const h3=fl(B.map(q=>({...q,w:Math.min(q.w,1.0)})),13.35,14.75);wall(S,'s146br',F,u0,u1,ENT,ATT,h3);for(const H of h3)win(S,F,H,R,lod,{});
  for(const[a,c]of(isN?nP:ePil))fbox(S,'s146st',F,a,c,ENT,ATT,0,.08,false,'b');
  fbox(S,'s146st',F,u0-.3,u1+.3,ATT,ATT+.14,0,.3,false,'b');fbox(S,'s146st',F,u0-.36,u1+.36,ATT+.14,PAR,0,.36,false,'b');
  fq(S,'s146st',F,u0,u1,PAR,PTOP,0);fbox(S,'s146st',F,u0,u1,PTOP,PTOP+.1,-.3,.05,false,'b');}
 // ---- the corner: a broad stucco pier wrapping both faces (rusticated quoins on the ground storey are the wall itself)
 fbox(S,'s146st',FN,-1.1,.12,G,CAP0,-.02,.12,false,'b');pilaster(S,FN,-1.0,-.1,lod,.14);pilaster(S,FE,.1,1.0,lod,.14);
 fbox(S,'s146st',FN,-1.1,.12,ENT,ATT,0,.12,false,'b');fbox(S,'s146st',FE,-.12,1.1,ENT,ATT,0,.12,false,'b');
 // west-end quoin of the north front + south-end pier of the east front
 fbox(S,'s146st',FN,-NL,-NL+.55,G,ATT,0,.1,false,'b');fbox(S,'s146st',FE,EL-.55,EL,G,ATT,0,.1,false,'b');
 // ---- balconies: continuous cast iron along the east front (past the corner pier); porch balustrade on the north front
 balcony(S,FE,1.25,EL-.7,G,.62,lod);
 // porch: projecting stucco block (two piers, entablature, balustraded top) in front of the door
 {const a=-9.6,c=-6.2,dp=1.7;fbox(S,'s146ru',FN,a,a+.5,0,4.3,0,dp,false,'b');fbox(S,'s146ru',FN,c-.5,c,0,4.3,0,dp,false,'b');
  fbox(S,'s146st',FN,a-.08,c+.08,4.3,4.85,0,dp+.08,false,'d');fbox(S,'s146st',FN,a-.14,c+.14,4.85,5.0,0,dp+.14,false,'b');
  S.q('s146st',FN.P(a+.5,4.3,dp),FN.P(c-.5,4.3,dp),FN.P(c-.5,4.3,0),FN.P(a+.5,4.3,0),[[0,0],[1,0],[1,1],[0,1]]);   // soffit
  balustrade(S,FN,a-.08,c+.08,5.0,dp+.06,lod);
  // side balustrade returns
  const FS=face([a-.08,0],[-1,0]),FS2=face([c+.08,0],[1,0]);if(!lod){balustrade(S,FS,-dp-.06,-.1,5.0,0,lod);balustrade(S,FS2,.1,dp+.06,5.0,0,lod);}
  // steps up to the door (T2 adds the area railings around)
  for(let i=0;i<3;i++)fbox(S,'s146st',FN,a+.5,c-.5,i*.12,(i+1)*.12,0,dp-i*.32,false,'b');
  b.solid((a+c)/2,dp/2,c-a,dp);}
 // ---- rear / party faces (west x = -13, south z = -40): plain brick, sashes, lod
 const RW=face([-NL,-EL/2],[-1,0]),RS=face([-NL/2,-EL],[0,-1]);
 for(const[F,u0,u1]of[[RW,-EL/2,EL/2],[RS,-NL/2,NL/2]]){const n=Math.floor((u1-u0)/3.1),bs=[];for(let i=0;i<n;i++)bs.push({c:u0+(i+.5)*(u1-u0)/n,w:1.05});
  const hs=[];for(const[s,h]of[[1.4,3.8],[5.4,7.6],[8.95,10.7],[13.35,14.75]])for(const q of bs)hs.push({a:q.c-q.w/2,b:q.c+q.w/2,s,h});
  wall(S,'s146br',F,u0,u1,0,PTOP,hs);for(const H of hs)sash146(S,F,H,R,true);}
 // ---- roof: slate hip set inside the parapet, ridge along the east wing; roof light + stair hatch; chimney stacks
 {const x0=-NL+.35,x1=-.35,z0=-.35,z1=-EL+.35,y0=PAR-.1,y1=PAR+2.6,rx0=-NL/2-1.2,rx1=-NL/2+1.2,rz0=-4.2,rz1=-EL+4.2,uv=(x,z)=>[x/2.6,z/2.6];
  const q=(a,b2,c,d)=>S.q('s146sl',a,b2,c,d,[uv(a[0]+a[1]*.0,a[2]),uv(b2[0],b2[2]),uv(c[0],c[2]+c[1]),uv(d[0],d[2]+d[1])]);
  q([x0,y0,z0],[x1,y0,z0],[rx1,y1,rz0],[rx0,y1,rz0]);q([x1,y0,z1],[x0,y0,z1],[rx0,y1,rz1],[rx1,y1,rz1]);
  q([x1,y0,z0],[x1,y0,z1],[rx1,y1,rz1],[rx1,y1,rz0]);q([x0,y0,z1],[x0,y0,z0],[rx0,y1,rz0],[rx0,y1,rz1]);
  S.q('s146sl',[rx0,y1,rz0],[rx1,y1,rz0],[rx1,y1,rz1],[rx0,y1,rz1],[[0,0],[1,0],[1,10],[0,10]]);
  // gutter floor between parapet and roof foot (lead)
  S.q('s146ir',[-NL,PAR-.1,0],[0,PAR-.1,0],[0,PAR-.1,-EL],[-NL,PAR-.1,-EL],[[0,0],[5,0],[5,15],[0,15]]);
  // roof light near the corner (lead box + glass hip), as on the photo's roof line
  const RF=face([-4.2,-3],[0,1]);fbox(S,'s146ir',RF,-1.6,1.6,PAR,PAR+1.1,-2.6,0,false,'d');
  S.q('s146sk',RF.P(-1.5,PAR+1.1,-.1),RF.P(1.5,PAR+1.1,-.1),RF.P(1.2,PAR+1.7,-1.3),RF.P(-1.2,PAR+1.7,-1.3),[[0,0],[1,0],[1,1],[0,1]]);
  S.q('s146sk',RF.P(1.5,PAR+1.1,-2.5),RF.P(-1.5,PAR+1.1,-2.5),RF.P(-1.2,PAR+1.7,-1.3),RF.P(1.2,PAR+1.7,-1.3),[[0,0],[1,0],[1,1],[0,1]]);
  if(!lod){fbox(S,'s146ir',RF,-1.75,1.75,PAR+1.1,PAR+1.16,-2.7,.1,false,'d');for(let i=0;i<7;i++){const u=-1.5+i*.5;S.tube('s146ir',RF.P(u,PAR+1.1,-.1),RF.P(u*.8,PAR+1.7,-1.3),.015,3);}}
  // chimney stacks: on the party wall behind the north front, and two on the ridge of the east wing (photo x ~ 715 / 845)
  chimney(S,-NL+1.2,-6.5,1.0,2.6,PAR-.2,PAR+3.4,4,lod);chimney(S,rx0+1.2,-14,2.4,.9,y1-.3,y1+1.8,4,lod);chimney(S,rx0+1.2,-27,2.4,.9,y1-.3,y1+1.8,5,lod);
  chimney(S,-NL+1.0,-EL+1.5,.9,2.2,PAR-.2,PAR+2.6,3,lod);}
 b.solid(-NL/2,-EL/2,NL,EL);}
// rail pattern texture (procedural RGBA, 0.5 m panel): uprights, a circle + spear-head anthemion, top/bottom bars
let railTexDone=false;
function makeRailTex(){if(railTexDone)return;railTexDone=true;}
export function* stucco146Task(b,spec,lod){addMats146(b.mats);makeRailTex();const S=new Soup();let s=urbanHash(spec.seed|0,146,0x146a)>>>0;const R=()=>((s=(s*1664525+1013904223)>>>0)/4294967296);
 mainBuilding(S,b,lod,R);yield;S.flush(b);yield;yield* stucco146T2Task(b,lod,R);yield* stucco146T3Task(b,lod);}
export {sash146,win as win146,aedicule as aedicule146,balcony as balcony146,chimney as chimney146,lathe as lathe146};
