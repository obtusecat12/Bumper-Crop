// V145 M5 Maltose Market (麦芽糖市场) — the goods on the M4 tables (ref files/ref-1023-maltose-market.webp).
// Frame: block-local metres of capital block (1,-1) (same as maltose145-stalls.js; tables come from its TB145 list).
// Every piece is modelled in its real shape (lathe / swept tube / ellipsoid / unwrapped box), each family with its own
// generated texture (bc/tools/maltose145_m5_assets.py -> assets/l11-v145, baseColor + normal + roughness):
//  near tables (photo): seated brass + bronze Buddhas, brass bells / incense tripods / vases / candlesticks / horse,
//  crystal balls on brass stands, red lacquer boxes + domed chest + yellow box (six-face unwraps), jewellery trays on a
//  clear plastic tub, cane + knife-sheath barrel, mounted buffalo horns, black dot-carved head, wooden trug, celadon
//  teapot on a red velvet box, bead-necklace spreads with hanging strands, tumbled stones in a clear box, glassware,
//  portfolio; ground: metal folding chair, camp chair, grey trash cans, wrought-iron plant stand.
//  far tables: clutter relief (height grid from each clutter photo, CLUTH) + a few hashed standalone pieces.
// ?malt145=0 off (with the yard).
import * as T from './vendor/three.module.min.js';
import {G,TB145} from './maltose145-stalls.js?v=145g';
const A=new URL('./assets/l11-v145/',import.meta.url).href,PI=Math.PI,Y0=.15,YT=Y0+.745,V='?v=145e';
function tex(n,srgb=true,rep=true){const t=new T.TextureLoader().load(A+n+'.webp'+V);if(srgb)t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;t.magFilter=T.NearestFilter;if(rep)t.wrapS=t.wrapT=T.RepeatWrapping;return t;}
// clutter relief height grids (32 x 16, rows from the far edge), printed by the asset script
const CLUTH=["8556665665665556455666776888888865788757766676677556678887887877778687456665566346777872536444455544579887656886557888756465533344333577666545655367666","78877777877777888777777888767777889788689777578877887767776667667876676676665766677776766766676677687766788776656566556555556667776766776677743445342463555577777887688857865636655955747766878778887888888868467647754467656657788756774686322663134225665477777777877854737735777467555565777778878779789576456784676576646877888777476677941456655456755666678877987986877435523574457456677778866866778764678646656675676777888778768858987788455557877777778886788687478766755755667667677777752553222343222134344433344447"];
let M=null;
function addMats(m){if(m.m145brass)return;if(!M){const S=(o)=>new T.MeshStandardMaterial({metalness:0,roughness:1,vertexColors:true,side:T.DoubleSide,...o});
 const tile=(n,o={})=>S({map:tex(n),normalMap:tex(n+'-n',false),roughnessMap:tex(n+'-r',false),...o});
 M={m145brass:tile('brass145',{metalness:.85}),m145bronze:tile('bronze145',{metalness:.7}),m145wood:tile('wood145'),m145horn:tile('horn145'),m145cane:tile('cane145'),
  m145velv:tile('velvet145'),m145cel:tile('celadon145'),m145leath:tile('leather145'),m145seat:tile('seat145'),m145porc:tile('porc145'),m145can:tile('can145'),
  m145goods:S({map:tex('goods145',true,false),normalMap:tex('goods145-n',false,false),roughnessMap:tex('goods145-r',false,false)}),
  m145beads:S({map:tex('beads145',true,false),normalMap:tex('beads145-n',false,false),roughnessMap:tex('beads145-r',false,false)}),
  m145clut:S({map:tex('clut145',true,false),normalMap:tex('clut145-n',false,false),roughness:.8}),
  m145tub:S({map:tex('tub145',true,false),roughnessMap:tex('tub145-r',false,false),transparent:true,opacity:.62,depthWrite:false}),
  m145glass:S({color:0xe4f0ec,roughnessMap:tex('glass145-r',false),transparent:true,opacity:.3,depthWrite:false})};
 for(const[k,v]of Object.entries(M))v.name='V145 '+k;}Object.assign(m,M);}
const hash=(i)=>{let x=Math.sin(i*127.1+311.7)*43758.5453;return x-Math.floor(x);};
// ---- placement: O(...) maps an item's local metres into the current table frame (g.at); O's compose with C()
const O=(ox,oy,oz,ry=0,sc=1)=>{const c=Math.cos(ry),s=Math.sin(ry);return v=>[ox+(v[0]*c+v[2]*s)*sc,oy+v[1]*sc,oz+(-v[0]*s+v[2]*c)*sc];};
const C=(a,b)=>v=>a(b(v));
const cell=(k,u,v)=>[((k&3)+u)/4,1-((k>>2)+1)/4+v/4];          // goods145 atlas cell (v = 1 at the cell's top)
let g=null;
const gr=(key,nu,nv,P,UV,o,tone=1)=>g.grid(key,nu,nv,(u,v)=>o(P(u,v)),UV,tone);
// lathe: profile [[r,y],...] bottom -> top; sx/sz squash; wob(a,y) radius multiplier; uv u around (m / tu), v arc length / tv
function lathe(key,o,prof,{n=12,tu=.15,tv=.15,sx=1,sz=1,wob=null,a0=0,a1=2*PI,UV=null,tone=1}={}){const N=prof.length-1,arc=[0];
 for(let i=1;i<=N;i++)arc.push(arc[i-1]+Math.hypot(prof[i][0]-prof[i-1][0],prof[i][1]-prof[i-1][1]));const rmax=Math.max(...prof.map(p=>p[0]));
 gr(key,n,N,(u,v)=>{const p=prof[Math.round(v*N)],a=-(a0+(a1-a0)*u),w=wob?wob(a,p[1]):1;return[p[0]*w*Math.cos(a)*sx,p[1],p[0]*w*Math.sin(a)*sz];},
  UV||((u,v)=>[u*(a1-a0)*rmax/tu,arc[Math.round(v*N)]/tv]),o,tone);}
function ell(key,o,c,rx,ry,rz,{n=10,m=6,tu=.12,UV=null,tone=1}={}){const P=[];for(let j=0;j<=m;j++){const f=j/m*PI;P.push([Math.sin(f),-Math.cos(f)]);}
 lathe(key,C(o,v=>[c[0]+v[0]*rx,c[1]+v[1]*ry,c[2]+v[2]*rz]),P,{n,tu:tu/Math.max(rx,.01),tv:tu/Math.max(ry,.01),UV,tone});}
// swept tube along a polyline with parallel-transport frames; r number or array per point
function sweep(key,o,path,r,{n=6,tu=.08,tv=.2,UV=null,tone=1,flat=1}={}){const P=path.map(p=>new T.Vector3(...p)),N=P.length-1,R=(i)=>Array.isArray(r)?r[i]:r;
 const t=P.map((p,i)=>P[Math.min(N,i+1)].clone().sub(P[Math.max(0,i-1)]).normalize());let nr=new T.Vector3(0,1,0);if(Math.abs(t[0].y)>.9)nr.set(1,0,0);nr=nr.sub(t[0].clone().multiplyScalar(nr.dot(t[0]))).normalize();
 const F=[nr.clone()];for(let i=1;i<=N;i++){const q=F[i-1].clone().sub(t[i].clone().multiplyScalar(F[i-1].dot(t[i]))).normalize();F.push(q);}
 const L=[0];for(let i=1;i<=N;i++)L.push(L[i-1]+P[i].distanceTo(P[i-1]));
 gr(key,n,N,(u,v)=>{const i=Math.round(v*N),a=-u*2*PI,b=new T.Vector3().crossVectors(t[i],F[i]);return P[i].clone().addScaledVector(F[i],Math.cos(a)*R(i)*flat).addScaledVector(b,Math.sin(a)*R(i)).toArray();},
  UV||((u,v)=>[u*2*PI*Math.max(R(0),.004)/tu,L[Math.round(v*N)]/tv]),o,tone);}
const arcPath=(c,r,a0,a1,k=8,plane='xy')=>{const p=[];for(let i=0;i<=k;i++){const a=a0+(a1-a0)*i/k,x=Math.cos(a)*r,y=Math.sin(a)*r;p.push(plane==='xy'?[c[0]+x,c[1]+y,c[2]]:[c[0]+x,c[1],c[2]+y]);}return p;};
// box: per-face UV fn(face,u,v) (faces 0 +z front, 1 -z back, 2 +x, 3 -x, 4 top, 5 bottom); u left->right seen from outside, v up
function box(key,o,c,w,h,d,F,tone=1){const[x,y,z]=c,X0=x-w/2,X1=x+w/2,Y1=y+h,Z0=z-d/2,Z1=z+d/2;
 const Q=(f,a,b,cc,dd,t=tone)=>gr(key,1,1,(u,v)=>{const L=(p,q,s)=>p.map((e,i)=>e+(q[i]-e)*s);return L(L(a,b,u),L(dd,cc,u),v);},(u,v)=>F(f,u,v),o,t);
 Q(0,[X0,y,Z1],[X1,y,Z1],[X1,Y1,Z1],[X0,Y1,Z1]);Q(1,[X1,y,Z0],[X0,y,Z0],[X0,Y1,Z0],[X1,Y1,Z0]);Q(2,[X1,y,Z1],[X1,y,Z0],[X1,Y1,Z0],[X1,Y1,Z1]);
 Q(3,[X0,y,Z0],[X0,y,Z1],[X0,Y1,Z1],[X0,Y1,Z0]);Q(4,[X0,Y1,Z1],[X1,Y1,Z1],[X1,Y1,Z0],[X0,Y1,Z0]);Q(5,[X0,y,Z0],[X1,y,Z0],[X1,y,Z1],[X0,y,Z1],tone*.7);}
const tileF=(w,h,d,t=.3)=>(f,u,v)=>{const a=f<2?w:f<4?d:w,b=f<4?h:d;return[u*a/t,v*b/t];};
const cellsF=(K,vr=[0,1])=>(f,u,v)=>cell(K[f],u,f<4?vr[0]+(vr[1]-vr[0])*v:v);   // K = [front,back,right,left,top,bottom]
// ======================================================================== near-table pieces
function buddha(o,s,key='m145brass',{mudra=0}={}){const q=C(o,v=>[v[0]*s,v[1]*s,v[2]*s]);
 lathe(key,q,[[0,0],[.3,0],[.31,.03],[.35,.07],[.33,.1],[.27,.13],[0,.135]],{n:16,tu:.15/s,tv:.15/s,wob:(a,y)=>y>.05?1+.06*Math.cos(a*14):1});   // lotus throne, petals
 ell(key,q,[0,.2,.03],.33,.085,.21,{n:12,m:5,tu:.12/s});                                                          // crossed legs
 lathe(key,q,[[0,.24],[.19,.25],[.215,.31],[.2,.43],[.17,.53],[.11,.59],[.06,.615],[0,.62]],{n:12,sz:.72,tu:.12/s,tv:.12/s});   // robed torso
 ell(key,q,[0,.7,0],.1,.12,.1,{n:10,m:6,tu:.1/s});ell(key,q,[0,.835,-.005],.05,.05,.05,{n:8,m:4,tu:.1/s});        // head + ushnisha
 for(const sx of[-1,1]){ell(key,q,[sx*.1,.69,0],.018,.05,.03,{n:6,m:4,tu:.1/s});
  const hand=mudra&&sx>0?[.15,.5,.12]:[sx*.06,.27,.15];sweep(key,q,[[sx*.16,.56,0],[sx*.215,.44,.03],[sx*.2,.33,.1],hand],[.05,.047,.042,.03],{n:6,tu:.1/s,tv:.15/s});}
 ell(key,q,[0,.285,.16],.075,.022,.045,{n:8,m:3,tu:.1/s});}                                                        // hands in the lap
function bell(o,s){lathe('m145brass',o,[[0,0],[.06*s,0],[.058*s,.012*s],[.05*s,.04*s],[.038*s,.075*s],[.03*s,.095*s],[.012*s,.1*s],[.012*s,.13*s],[.02*s,.14*s],[0,.15*s]],{n:12});}
function tripod(o,s){lathe('m145brass',o,[[0,.05*s],[.05*s,.05*s],[.075*s,.07*s],[.08*s,.1*s],[.074*s,.125*s],[.08*s,.13*s],[.07*s,.135*s],[.06*s,.12*s],[0,.11*s]],{n:14});
 for(let k=0;k<3;k++){const a=k*2*PI/3,c=Math.cos(a),sn=Math.sin(a);sweep('m145brass',o,[[c*.05*s,.065*s,sn*.05*s],[c*.06*s,.03*s,sn*.06*s],[c*.07*s,0,sn*.07*s]],[.012*s,.01*s,.012*s],{n:5});}
 for(const sx of[-1,1])sweep('m145brass',o,arcPath([sx*.06*s,.15*s,0],.022*s,0,PI,6),.005*s,{n:4});}
function vase(o,s,key='m145brass',sh=0){const P=sh?[[0,0],[.04,0],[.05,.02],[.075,.08],[.07,.14],[.035,.19],[.03,.23],[.045,.26],[0,.255]]:[[0,0],[.035,0],[.04,.03],[.055,.1],[.045,.16],[.025,.2],[.025,.25],[.04,.28],[0,.275]];
 lathe(key,o,P.map(([r,y])=>[r*s,y*s]),{n:14});}
function candle(o,s){lathe('m145brass',o,[[0,0],[.06,0],[.06,.008],[.04,.02],[.015,.04],[.02,.08],[.012,.12],[.018,.15],[.012,.2],[.025,.22],[.03,.235],[.015,.24],[0,.24]].map(([r,y])=>[r*s,y*s]),{n:12});}
function horse(o,s){const q=C(o,v=>[v[0]*s,v[1]*s,v[2]*s]);lathe('m145brass',q,[[0,0],[.09,0],[.09,.02],[0,.02]],{n:10,sx:1.4,sz:.6});
 ell('m145brass',q,[0,.15,0],.075,.04,.035,{n:8,m:5});sweep('m145brass',q,[[.06,.16,0],[.09,.21,0],[.11,.235,0]],[.025,.02,.016],{n:6});ell('m145brass',q,[.125,.235,0],.03,.015,.014,{n:6,m:4});
 for(const[x,z]of[[.05,.02],[.05,-.02],[-.05,.02],[-.05,-.02]])sweep('m145brass',q,[[x,.13,z],[x+(x>0?.01:-.01),.07,z],[x,.02,z]],[.011,.008,.007],{n:4});
 sweep('m145brass',q,[[-.07,.16,0],[-.1,.12,0],[-.105,.07,0]],[.012,.009,.006],{n:4});}
function crystal(o,s){lathe('m145brass',o,[[0,0],[.05,0],[.045,.015],[.025,.03],[.035,.045],[.03,.055],[0,.055]].map(([r,y])=>[r*s,y*s]),{n:12});ell('m145glass',o,[0,.1*s,0],.05*s,.05*s,.05*s,{n:12,m:8});}
// lacquer boxes: body + overhanging lid, faces from the atlas; dome = curved-lid chest
function lacq(o,w,h,d,{dome=false,yellow=false}={}){const K=yellow?[7,9,8,8,6,5]:[1,3,2,4,0,5],lh=dome?0:h*.24;
 box('m145goods',o,[0,0,0],w,h-lh,d,cellsF(K,[0,dome?1:.76]));
 if(!dome){box('m145goods',o,[0,h-lh,0],w+.008,lh,d+.008,(f,u,v)=>f===4?cell(K[4],u,v):f===5?cell(5,u,v):cell(K[f],u,.76+.24*v));}
 else{const R=d/2,N=8;gr('m145goods',N,1,(u,v)=>{const a=PI*u;return[(v-.5)*w,h+Math.sin(a)*R*.55,Math.cos(a)*R];},(u,v)=>cell(0,v,u),o);
  for(const sx of[-1,1])gr('m145goods',N,1,(u,v)=>{const a=PI*u;return[sx*w/2,h+Math.sin(a)*R*.55*v,Math.cos(a)*R*v];},(u,v)=>cell(K[2],.5+Math.cos(PI*u)*v*.5,.85+Math.sin(PI*u)*v*.15),o);
  for(const sx of[-1,1]){sweep('m145brass',o,arcPath([sx*w*.33,h,0],R*1.004,0,PI,8,'xy').map(p=>[p[0],h+(p[1]-h)*.55,0]).map((p,i,a)=>[p[0],p[1],Math.cos(PI*i/(a.length-1))*R*1.004]),.004,{n:4});}}
 box('m145brass',o,[0,h-(dome?.06:lh+.035)*1,d/2+.002],.05*Math.min(1,w/.3),.045,.006,tileF(.05,.045,.006,.1));}
function tray(o,w,d,K=14){const t=.018,hh=.035;box('m145goods',o,[0,0,0],w,.008,d,(f,u,v)=>f===4?cell(K,u,v):[u*.1,v*.1]);
 for(const[c,ww,dd]of[[[0,0,d/2-t/2],w,t],[[0,0,-d/2+t/2],w,t],[[w/2-t/2,0,0],t,d-2*t],[[-w/2+t/2,0,0],t,d-2*t]])box('m145wood',o,c,ww,hh,dd,tileF(ww,hh,dd,.25));}
function tub(o,w,h,d){const F=(f,u,v)=>f===0?[u*.5,v]:f===1?[.5-u*.5,v]:f<4?[.5+u*.5,v]:[u*.5,v*.3];
 const X0=-w/2,X1=w/2,Z0=-d/2,Z1=d/2,b=.025;   // slightly tapered open box (no top)
 const Q=(f,a,bb,cc,dd)=>gr('m145tub',1,1,(u,v)=>{const L=(p,q,s)=>p.map((e,i)=>e+(q[i]-e)*s);return L(L(a,bb,u),L(dd,cc,u),v);},(u,v)=>F(f,u,v),o);
 const lo=(x,z)=>[x*(1-b/w*2),0,z*(1-b/d*2)];Q(0,lo(X0,Z1),lo(X1,Z1),[X1,h,Z1],[X0,h,Z1]);Q(1,lo(X1,Z0),lo(X0,Z0),[X0,h,Z0],[X1,h,Z0]);
 Q(2,lo(X1,Z1),lo(X1,Z0),[X1,h,Z0],[X1,h,Z1]);Q(3,lo(X0,Z0),lo(X0,Z1),[X0,h,Z1],[X0,h,Z0]);Q(5,lo(X0,Z0),lo(X1,Z0),lo(X1,Z1),lo(X0,Z1));
 for(const[c,ww,dd]of[[[0,h-.015,Z1+.006],w+.012,.012],[[0,h-.015,Z0-.006],w+.012,.012],[[X1+.006,h-.015,0],.012,d],[[X0-.006,h-.015,0],.012,d]])box('m145tub',o,c,ww,.015,dd,(f,u,v)=>[.5+u*.1,.9+v*.1]);}
function canes(o){lathe('m145wood',o,[[0,0],[.13,0],[.14,.04],[.145,.2],[.14,.4],[.13,.44],[.12,.44],[.12,.05],[0,.05]],{n:14,tu:.25,tv:.25,wob:(a)=>1+.012*Math.cos(a*22)});
 for(const y of[.06,.38])lathe('m145brass',o,[[.142,y],[.148,y+.005],[.148,y+.025],[.142,y+.03]],{n:14});
 for(let k=0;k<11;k++){const a=k*2.4+hash(k)*.5,r=.07*Math.sqrt(hash(k+3)),bx=Math.cos(a)*r,bz=Math.sin(a)*r,lean=.05+.08*hash(k+9),L=.75+.3*hash(k+5);
  const tx=bx+Math.cos(a)*lean,tz=bz+Math.sin(a)*lean,top=[tx,.05+L,tz];
  const knife=k%4===3,key=knife?'m145leath':k%3?'m145cane':'m145wood';
  sweep(key,o,[[bx,.05,bz],[bx+(tx-bx)*.5,.05+L*.5,bz+(tz-bz)*.5],top],knife?[.018,.02,.014]:[.012,.013,.014],{n:6,tu:.06,tv:.3});
  if(knife){lathe('m145brass',C(o,v=>[top[0]+v[0],top[1]+v[1],top[2]+v[2]]),[[.016,0],[.02,.01],[.02,.04],[.014,.05],[.016,.12],[.022,.13],[0,.14]],{n:8});}
  else if(k%3===0)sweep('m145cane',o,[top,...arcPath([tx+.045,top[1]+.02,tz],.048,PI*.95,-.15,7)],.013,{n:6,tu:.06,tv:.2});
  else ell('m145brass',o,[tx,top[1]+.02,tz],.022,.028,.022,{n:8,m:5});}}
function horns(o,s,mount=true){const q=C(o,v=>[v[0]*s,v[1]*s,v[2]*s]);
 if(mount){ell('m145wood',q,[0,.07,0],.07,.06,.05,{n:10,m:6,tone:.55});box('m145wood',q,[0,0,0],.12,.02,.08,tileF(.12,.02,.08),.5);}
 for(const sx of[-1,1]){const P=[],R=[];for(let i=0;i<=10;i++){const t=i/10,a=t*PI*.62;P.push([sx*(.05+Math.sin(a)*.32+t*t*.06),.08+(1-Math.cos(a))*.17+t*t*.12,-t*.08]);R.push(.045*(1-t*.92)+.003);}
  sweep('m145horn',q,P,R,{n:8,tu:.15,tv:.25});}}
function head(o,s){const q=C(o,v=>[v[0]*s,v[1]*s,v[2]*s]);box('m145wood',q,[0,0,0],.16,.06,.14,tileF(.16,.06,.14,.2),.35);
 const P=[[.05,.06],[.055,.1],[.07,.12],[.092,.15],[.108,.2],[.116,.26],[.113,.31],[.1,.35],[.075,.38],[.04,.395],[0,.4]],N=P.length-1;
 const sh=(p,a)=>{const front=Math.cos(a);return[p[0]*Math.sin(a),p[1],p[0]*Math.cos(a)*(.95+.08*Math.max(0,front))];};
 const A=1.35;   // front window +-77 deg -> cell 12 (chin y .12 .. crown .4), the rest -> cell 13
 gr('m145goods',10,N,(u,v)=>sh(P[Math.round(v*N)],-A+2*A*u),(u,v)=>cell(12,u,Math.max(0,Math.min(1,(P[Math.round(v*N)][1]-.1)/.29))),q);
 gr('m145goods',12,N,(u,v)=>sh(P[Math.round(v*N)],A+(2*PI-2*A)*u),(u,v)=>cell(13,u,Math.max(0,Math.min(1,(P[Math.round(v*N)][1]-.06)/.34))),q);
 for(const sx of[-1,1])ell('m145goods',q,[sx*.115,.24,-.01],.012,.03,.022,{n:6,m:4,UV:(u,v)=>cell(13,u,v)});}
function trug(o,w,d,h){const t=.012,b=.75;
 const W=(x0,z0,x1,z1,x2,z2,x3,z3)=>gr('m145wood',2,1,(u,v)=>[x0+(x1-x0)*u+(x3-x0+(x2-x1-x3+x0)*u)*v,v*h,z0+(z1-z0)*u+(z3-z0+(z2-z1-z3+z0)*u)*v],(u,v)=>[u*w/.3,v*h/.3],o);
 const bw=w*b/2,bd=d*b/2;W(-bw,bd,bw,bd,w/2,d/2,-w/2,d/2);W(bw,-bd,-bw,-bd,-w/2,-d/2,w/2,-d/2);W(bw,bd,bw,-bd,w/2,-d/2,w/2,d/2);W(-bw,-bd,-bw,bd,-w/2,d/2,-w/2,-d/2);
 box('m145wood',o,[0,0,0],w*b,t,d*b,tileF(w*b,t,d*b,.3),.8);
 for(const sx of[-1,1])box('m145wood',o,[sx*w/2,h-.01,0],.02,.02,d*.9,tileF(.02,.02,d,.3),.8);}
function teapot(o,s){const q=C(o,v=>[v[0]*s,v[1]*s,v[2]*s]);lathe('m145cel',q,[[0,0],[.045,0],[.06,.012],[.075,.04],[.078,.065],[.068,.09],[.045,.105],[.038,.108],[0,.108]],{n:14,tu:.08/s,tv:.08/s});
 lathe('m145cel',q,[[.04,.108],[.042,.112],[.03,.12],[.012,.124],[.01,.13],[.015,.137],[0,.14]],{n:10,tu:.08/s,tv:.08/s});
 sweep('m145cel',q,[[.065,.04,0],[.1,.07,0],[.12,.1,0],[.13,.115,0]],[.016,.011,.008,.007],{n:6,tu:.05/s});
 sweep('m145cel',q,[[-.07,.085,0],[-.105,.09,0],[-.11,.055,0],[-.075,.03,0]],.008,{n:5,tu:.05/s});}
function beads(o,w,d,seed){const ph=hash(seed)*6;gr('m145beads',12,8,(u,v)=>[(u-.5)*w,.006+.008*Math.sin(u*17+ph)*Math.sin(v*13+ph),(v-.5)*d],(u,v)=>[u,v],o);
 // a few strands hanging over the front edge: bead chains (ellipsoids) on a drape curve
 for(let k=0;k<4;k++){const x=(hash(seed+k)-.5)*w*.8,n=10;for(let i=0;i<n;i++){const t=i/(n-1),y=.006-t*t*.1,z=d/2+t*.035;
  ell(i%3?'m145cel':'m145velv',o,[x+Math.sin(t*3+k)*.01,y,z],.008,.008,.008,{n:5,m:3});}}}
function stonesBox(o,w,d,h){const ph=1.7;box('m145goods',o,[0,0,0],w-.006,h*.7,d-.006,(f,u,v)=>f===4?cell(15,u,v):cell(15,u,v*.3));
 gr('m145goods',10,6,(u,v)=>[(u-.5)*(w-.008),h*.7+.006*Math.sin(u*31+ph)*Math.sin(v*23),(v-.5)*(d-.008)],(u,v)=>cell(15,u,v),o);
 box('m145glass',o,[0,0,0],w,h,d,(f,u,v)=>[u,v]);}
function wineGlass(o,s){lathe('m145glass',o,[[0,0],[.035,0],[.035,.003],[.006,.008],[.004,.08],[.02,.09],[.035,.11],[.038,.14],[.036,.17]].map(([r,y])=>[r*s,y*s]),{n:12});}
function decanter(o,s){lathe('m145glass',o,[[0,0],[.05,0],[.06,.02],[.065,.08],[.05,.13],[.02,.16],[.018,.2],[.025,.21],[0,.21]].map(([r,y])=>[r*s,y*s]),{n:12});
 ell('m145glass',o,[0,.225*s,0],.022*s,.02*s,.022*s,{n:8,m:5});}
function folio(o,w,d){box('m145goods',o,[0,0,0],w,.012,d,(f,u,v)=>f===4?cell(10,u,v):f===5?cell(11,u,v):cell(10,u,.02));}
// ======================================================================== ground pieces
function foldChair(o){const H=.45,sw=.2,sd=.2;   // metal folding chair, faces +z
 for(const sx of[-1,1]){sweep('m145dst',o,[[sx*sw,0,sd+.03],[sx*sw,H,sd*.6],[sx*sw*.95,.85,-sd-.03]],.011,{n:6});sweep('m145dst',o,[[sx*sw*.92,0,-sd-.06],[sx*sw*.92,H-.04,-sd*.2],[sx*sw*.9,H,sd*.4]],.01,{n:6});}
 sweep('m145dst',o,[[-sw,.12,sd+.02],[sw,.12,sd+.02]],.008,{n:4});sweep('m145dst',o,[[-sw*.92,.1,-sd-.04],[sw*.92,.1,-sd-.04]],.008,{n:4});
 gr('m145seat',4,4,(u,v)=>[(u-.5)*2*sw*.98,H+.012-.008*Math.sin(u*PI)*Math.sin(v*PI),(v-.5)*2*sd*.98],(u,v)=>[u*.4/.3,v*.4/.3],o);
 gr('m145seat',4,2,(u,v)=>[(u-.5)*2*sw*.96,.62+v*.2,-sd-.0+v*-.03+.02*Math.sin(u*PI)],(u,v)=>[u*.4/.3,v*.2/.3],o);}
function campChair(o){const H=.42,w=.27,d=.25;
 for(const sz of[-1,1])for(const sx of[-1,1])sweep('m145dst',o,[[sx*w,0,sz*d],[-sx*w,H,sz*d]],.009,{n:5});
 for(const sz of[-1,1])sweep('m145dst',o,[[-w,H,sz*d],[w,H,sz*d]],.01,{n:5});
 for(const sx of[-1,1])sweep('m145dst',o,[[sx*w,H,-d],[sx*w*1.05,.85,-d-.08]],.009,{n:5});
 gr('m145seat',6,4,(u,v)=>[(u-.5)*2*w,H-.06*Math.sin(u*PI)*.6-.05*Math.sin(v*PI),(v-.5)*2*d],(u,v)=>[u*.54/.3,v*.5/.3],o);
 gr('m145seat',6,3,(u,v)=>[(u-.5)*2*w*1.02,H+.02+v*.4,-d-.08*v+.03*Math.sin(u*PI)],(u,v)=>[u*.54/.3,v*.4/.3],o);
 for(const sx of[-1,1])gr('m145seat',2,1,(u,v)=>[sx*(w+.02),H+.12+v*.03,(u-.5)*2*d],(u,v)=>[u,v*.2],o,.8);}
function trashCan(o,s=1){lathe('m145can',o,[[0,0],[.24,0],[.25,.04],[.27,.5],[.29,.68],[.31,.71],[.31,.75],[.285,.75],[.265,.7],[.235,.05],[0,.05]].map(([r,y])=>[r*s,y*s]),{n:18,tu:.6,tv:.75,UV:(u,v)=>[u*3,v]});
 lathe('m145seat',o,[[.28*s,.66*s],[.305*s,.74*s],[.3*s,.77*s],[.26*s,.72*s]],{n:18,wob:(a)=>1+.025*Math.sin(a*7)});}   // black liner bag over the rim
function plantStand(o){for(let k=0;k<3;k++){const a=k*2*PI/3,c=Math.cos(a),s=Math.sin(a);sweep('m145dst',o,[[c*.16,0,s*.16],[c*.12,.15,s*.12],[c*.1,.42,s*.1],[c*.12,.5,s*.12]],.008,{n:4});
  sweep('m145dst',o,arcPath([c*.08,.3,s*.08],.04,0,PI*1.6,8,'xy').map(p=>[c*p[0],p[1],s*p[0]+p[2]]),.004,{n:3});}
 sweep('m145dst',o,arcPath([0,.5,0],.12,0,2*PI,12,'xz'),.006,{n:4});sweep('m145dst',o,arcPath([0,.2,0],.11,0,2*PI,12,'xz'),.005,{n:4});}
// ======================================================================== far-table relief + hashed pieces
function relief(o,w,d,seed){const k=seed&1,H=CLUTH[k],NX=31,NZ=15,ph=Math.floor(hash(seed)*8);
 const hAt=(u,v)=>{const i=Math.min(31,Math.round(u*NX)),j=Math.min(15,Math.round(v*NZ));const e=Math.min(u,1-u,v,1-v)*8;return(+H[(j*32+(i+ph)%32)])/9*.11*Math.min(1,e);};
 gr('m145clut',NX,NZ,(u,v)=>[(u-.5)*w,.004+hAt(u,v),(v-.5)*d],(u,v)=>[u,(k?0:.5)+(1-v)*.5],o);}
function farPieces(o,len,seed,lod){const n=lod?1:4+Math.floor(hash(seed*3)*4);
 for(let i=0;i<n;i++){const t=hash(seed*7+i),x=(hash(seed*11+i)-.5)*(len-.4),z=(hash(seed*13+i)-.5)*.4,q=C(o,O(x,0,z,t*6));
  switch(Math.floor(t*7)){case 0:vase(q,1.2,'m145porc',1);break;case 1:candle(q,1.1);break;case 2:vase(q,1,'m145cel',0);break;case 3:lacq(q,.26,.12,.18,{yellow:t>.5});break;
   case 4:if(!lod)buddha(q,.24,'m145bronze');break;case 5:for(const sx of[-1,1]){sweep('m145leath',q,[[sx*.06,.32,0],[sx*.06,.05,0],[sx*.06,.03,.1],[sx*.06,.02,.17]],[.05,.05,.04,.03],{n:6,flat:.8});}break;   // a pair of boots
   default:box('m145wood',q,[0,0,0],.32,.36,.03,tileF(.32,.36,.03,.25),.8);}}}
function brassFill(o,len,seed,keep){let k=0;for(let i=0;i<9;i++)for(let j=0;j<3;j++){const x=-len/2+.12+i*(len-.24)/8+(hash(seed+k)-.5)*.06,z=-.25+j*.24+(hash(seed+k+50)-.5)*.06,t=hash(seed*3+k++);
  if(keep.some(([a,b2,r])=>Math.hypot(x-a,z-b2)<r))continue;const q=C(o,O(x,0,z,t*6.3)),sc=.6+.6*hash(k+seed*5);
  switch(Math.floor(t*8)){case 0:bell(q,sc);break;case 1:candle(q,sc);break;case 2:vase(q,sc*.8,t>.1?'m145brass':'m145bronze',k&1);break;case 3:buddha(q,.12+.08*sc,k&1?'m145brass':'m145bronze');break;
   case 4:tripod(q,sc*.8);break;case 5:horse(q,sc*.6);break;case 6:crystal(q,sc*.8);break;default:lathe('m145brass',q,[[0,0],[.05*sc,0],[.07*sc,.03*sc],[.08*sc,.05*sc],[0,.04*sc]],{n:12});}}}   // last = offering bowl
// ======================================================================== layout
export function* maltose145GoodsTask(b,lod){if(!TB145.length)return;addMats(b.mats);g=new G();
 const at=(k,f)=>{const[x,z,r,l,c]=TB145[k];g.at(x,z,r);f(l,c);g.f=null;};
 if(!lod){
 // V145 M7: goods re-placed on the photo-solved tables (positions read off files/ref-1023-maltose-market.webp with inv.py, then
 // converted to each table's local frame). TB0 front lacquer table: tub + trays at the left end, lacquer boxes, the big red chest in front,
 // the red velvet box with the celadon teapot behind it.
 at(0,(l)=>{tub(O(-.36,YT,.2,.06),.32,.16,.26);tray(O(-.36,YT+.16,.2,.04),.3,.21);tray(O(-.35,YT+.182,.18,-.1),.27,.19);
  lacq(O(-.08,YT,.22,.02),.34,.12,.22);lacq(O(-.09,YT+.12,.2,-.06),.3,.09,.19);lacq(O(.34,YT,.22,.0),.45,.16,.26,{dome:true});
  box('m145velv',O(.3,YT,-.08,.1),[0,0,0],.22,.14,.2,tileF(.22,.14,.2,.15));teapot(O(.3,YT+.14,-.08,.4),.9);
  lacq(O(-.18,YT,-.16,.12),.26,.1,.17);lacq(O(.05,YT,-.2,-.08),.24,.09,.15,{yellow:true});
  box('m145velv',O(.1,YT,.02,.12),[0,0,0],.12,.06,.09,tileF(.12,.06,.09,.15));});
 // TB1 bare horn table (photo centre): water-buffalo horns on a block, the dotted carved head behind, the wooden trug at the right end,
 // grey portfolio, yellow + red lacquer boxes at the left, wrought-iron plant stand underneath
 at(1,(l)=>{horns(O(.24,YT-.005,-.0,.05),.7);head(O(.66,YT-.005,-.2,-.2),1.0);trug(O(.95,YT-.005,.06,-.04),.6,.3,.13);folio(O(-.12,YT-.005,.12,.08),.5,.36);
  lacq(O(-.12,YT-.005,-.2,.05),.26,.08,.18,{yellow:true});lacq(O(-.45,YT-.005,-.12,-.1),.3,.12,.2);lacq(O(-.44,YT+.115,-.12,.15),.22,.08,.15);lacq(O(-.85,YT-.005,0,.2),.34,.14,.22);lacq(O(-.95,YT-.005,-.25,-.1),.24,.1,.16,{yellow:true});
  plantStand(O(.45,Y0,.0));});
 // TB2 pink: tumbled stones in a clear box at the left end (photo: it sits over the horn table's right end), wooden tray, crystal ball, bell
 at(2,(l)=>{stonesBox(O(-.72,YT+.02,.1,.05),.34,.24,.08);tray(O(-.25,YT+.02,.05,-.05),.42,.3,14);crystal(O(.3,YT+.02,.1),1.1);bell(O(.6,YT+.02,-.1),1);vase(O(.8,YT+.02,.15),1,'m145porc',1);});
 // TB3 the long white brass table (Buddhas, bells, tripods, horse, crystal balls, candlesticks; most of it visible = its right half)
 at(3,(l)=>{buddha(O(.55,YT,-.1,.1),.36,'m145bronze');buddha(O(.92,YT,-.05,-.15),.3,'m145brass',{mudra:1});buddha(O(.2,YT,-.12,.2),.26,'m145brass');buddha(O(-.75,YT,-.08,-.1),.42,'m145brass');
  tripod(O(1.05,YT,.17),1.1);bell(O(.75,YT,.2),1.2);bell(O(-.45,YT,.15),.9);horse(O(.35,YT,.18,.6),.9);candle(O(-.05,YT,.0),1.2);candle(O(.02,YT,.12),.9);crystal(O(1.1,YT,-.15),1.2);crystal(O(-.5,YT,-.12),1);vase(O(-.25,YT,-.15),1.1);
  brassFill(O(0,YT,0),l,31,[[.55,-.1,.16],[.92,-.05,.14],[.2,-.12,.13],[-.75,-.08,.17],[1.05,.17,.1],[.75,.2,.08],[-.45,.15,.08],[.35,.18,.12],[-.05,.0,.08],[.02,.12,.07],[1.1,-.15,.08],[-.5,-.12,.08],[-.25,-.15,.08]]);
  // M7: the photo's brass table is about twice as full -> a second, half-step-offset fill of smaller pieces
  brassFill(O(.13,YT,.1),l-.3,77,[[.42,-.2,.16],[.79,-.15,.14],[.07,-.22,.13],[-.88,-.18,.17],[.92,.07,.1],[.62,.1,.08],[-.58,.05,.08],[.22,.08,.12],[-.18,-.1,.08],[-.11,.02,.07],[.97,-.25,.08],[-.63,-.22,.08],[-.38,-.25,.08]]);});
 // TB4 the red-cloth half under $5 EACH: bead spread with strands over the front edge, a brass vase
 at(4,(l)=>{beads(O(-.05,YT,.04),.95,.55,5);vase(O(.48,YT,-.2),1.2,'m145brass',1);});
 // right white table (3 FOR $10): glassware
 at(11,(l)=>{for(let k=0;k<5;k++)wineGlass(O(-.6+k*.13,YT-.005,.15-k%2*.08),1);decanter(O(.1,YT-.005,0),1);decanter(O(.3,YT-.005,.12),.8);ell('m145glass',O(.6,YT-.005,0),[0,.05,0],.08,.05,.08,{n:12,m:5});
  beads(O(.55,YT-.005,-.15),.4,.2,11);});
 // ground: chairs by the seated vendor, trash cans by the left row and the west fence
 g.f=null;campChair(O(84.95,Y0,55.35,-PI/2-.3));b.circle(84.95,55.35,.32);foldChair(O(86.7,Y0,51.7,-PI/2+.2));b.circle(86.7,51.7,.26);
 canes(O(77.2,Y0,58.58));b.circle(77.2,58.58,.16);
 trashCan(O(72.85,Y0,50.6));b.circle(72.85,50.6,.33);trashCan(O(61.2,Y0,58.0),.95);b.circle(61.2,58.0,.32);
 g.flush(b);yield;}
 // every other table: clutter relief + hashed standalone pieces (also the LOD shell keeps the relief)
 TB145.forEach(([x,z,r,l,c],k)=>{if(!lod&&(k<=4||k===11))return;g.at(x,z,r);relief(O(0,YT-(c?0:.005),0),l-.14,.62,k);farPieces(O(0,YT,0),l,k,lod);g.f=null;});
 g.flush(b);yield;}
