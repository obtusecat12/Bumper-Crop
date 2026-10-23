// V146 T2 首都街角灰泥联排楼 — the photo's left terrace, stucco garden wall, basement areas + spear railings + steps, street
// furniture (black/white bollards, classic lamp posts, fictional street-name plates, blue number plates, parked bicycles),
// a white van + white saloon (GGBotNet car8/car5 repaints) and give-way markings. Runs inside stucco146Task's frame (corner of
// the main building at (0,0), y 0 = pavement top, north front z = 0 facing +z (x -41..0 here), east front x = 0 facing +x).
// Areas: STUCCO146_AREA (stucco146-layout.js) — urban-streets trims the sidewalk slabs there so the pits are real holes.
// Textures bc/tools/stucco146t2_assets.py -> assets/l11-v146 (abrick/flag/awall/lamp/boll/bike/rub/door2/sign/plaque/lant).
import * as T from './vendor/three.module.min.js';
import {Soup,face,fq,fbox,wall,reveal,TILE} from './maltose145-bldg.js?v=145c';
import {sash146,win146,aedicule146,balcony146,chimney146,lathe146} from './stucco146.js?v=146c';
import {STUCCO146_AREA} from './stucco146-layout.js?v=146b';
import {CAR132,car132Geometry,car132Material} from './cars132.js?v=133c';
const A=new URL('./assets/l11-v146/',import.meta.url).href,PI=Math.PI;
function tex(n,srgb=true,rep=true){const t=new T.TextureLoader().load(A+n+'.webp?v=146b');if(srgb)t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;t.magFilter=T.NearestFilter;if(rep)t.wrapS=t.wrapT=T.RepeatWrapping;return t;}
let M=null;
function mats(m){if(m.s146ab)return;if(!M){const S=(o)=>new T.MeshStandardMaterial({metalness:0,roughness:1,vertexColors:true,...o});
 const W=(n,o={})=>S({map:tex(n),normalMap:tex(n+'-n',false),roughnessMap:tex(n+'-r',false),...o});
 M={s146ab:W('abrick146'),s146fl:W('flag146'),s146aw:W('awall146'),s146lp:W('lamp146',{metalness:.3}),s146bo:W('boll146',{metalness:.2}),
  s146bk:W('bike146',{metalness:.4}),s146rb:W('rub146'),s146d2:S({map:tex('door2146',true,false),normalMap:tex('door2146-n',false),roughness:.3,metalness:.1}),
  s146sg:S({map:tex('sign146',true,false),roughness:.5,metalness:.15}),s146pq:S({map:tex('plaque146',true,false),roughness:.3,metalness:.2}),
  s146lt:S({map:tex('lant146',true,false),emissiveMap:tex('lant146',true,false),emissive:0xffffff,emissiveIntensity:.35,roughness:.15,side:T.DoubleSide})};
 for(const[k,v]of Object.entries(M))v.name='V146 '+k;}Object.assign(m,M);}
Object.assign(TILE,{s146ab:[1.3,1.4],s146fl:[2.2,2.2],s146aw:[2.4,2.4],s146lp:[.6,.6],s146bk:[.5,.5],s146rb:[.4,.4]});
const FN=face([0,0],[0,1]),FE=face([0,0],[1,0]);
const AD=1.2,PIT=-2.6;   // area clear width (facade to retaining wall face) and floor level
// ---------------------------------------------------------------- spear-headed area railing along a line (building-local xz)
function railLine(S,b,ax,az,bx,bz,lod){const L=Math.hypot(bx-ax,bz-az);if(L<.05)return;const dx=(bx-ax)/L,dz=(bz-az)/L,F=face([ax,az],[-dz,dx]);
 const y0=.12,y1=1.08,top=1.22;fbox(S,'s146ir',F,0,L,y0+.03,y0+.07,-.02,.02,false,'');fbox(S,'s146ir',F,0,L,y1-.06,y1-.02,-.02,.02,false,'');
 const step=lod?.36:.125,n=Math.max(1,Math.round(L/step));
 for(let i=0;i<=n;i++){const u=i*L/n,h=.011;fbox(S,'s146ir',F,u-h,u+h,y0,top-.08,-h,h,false,'td');
  // spear head: 4-sided point + collar
  const c=F.P(u,top,0),p=(du,dw)=>F.P(u+du,top-.08,dw);S.q('s146ir',p(-.024,.024),p(.024,.024),c,c,[[0,0],[1,0],[.5,1],[.5,1]]);
  S.q('s146ir',p(.024,-.024),p(-.024,-.024),c,c,[[0,0],[1,0],[.5,1],[.5,1]]);S.q('s146ir',p(.024,.024),p(.024,-.024),c,c,[[0,0],[1,0],[.5,1],[.5,1]]);
  S.q('s146ir',p(-.024,-.024),p(-.024,.024),c,c,[[0,0],[1,0],[.5,1],[.5,1]]);}
 // standards with ball finials every ~2.4 m
 const ns=Math.max(1,Math.round(L/2.4));for(let i=0;i<=ns;i++){const u=i*L/ns;fbox(S,'s146ir',F,u-.026,u+.026,0,top+.02,-.026,.026,false,'d');
  if(!lod)lathe146(S,'s146ir',F.P(u,top+.02,0),[[.03,0],[.045,.03],[.05,.06],[.035,.1],[.012,.13],[0,.14]],6);}
 b.solid((ax+bx)/2,(az+bz)/2,Math.abs(dx)*L+.12,Math.abs(dz)*L+.12);}
// ---------------------------------------------------------------- one basement area segment on face F, u0..u1
function areaSeg(S,b,F,u0,u1,bays,R,lod){
 fbox(S,'s146fl',F,u0,u1,PIT-.1,PIT,0,AD,false,'fbrld');                       // flagstone floor
 fbox(S,'s146aw',F,u0,u1,PIT,0,AD,AD+.3,false,'ftdlr');                         // retaining wall face (looks at the house)
 fbox(S,'s146aw',F,u0-.3,u0,PIT,0,0,AD,false,'fbtdl');fbox(S,'s146aw',F,u1,u1+.3,PIT,0,0,AD,false,'fbtdr');   // end walls
 fbox(S,'s146fl',F,u0-.12,u1+.12,0,.12,AD-.06,AD+.24,false,'d');               // coping stones on the pavement edge
 // basement front with a window under each ground-floor bay that fits
 const hs=[];for(const c of bays)if(c-.5>u0+.25&&c+.5<u1-.25)hs.push({a:c-.5,b:c+.5,s:PIT+.75,h:-.3});
 wall(S,'s146aw',F,u0,u1,PIT,0,hs);for(const H of hs){reveal(S,'s146aw',F,H,.25);sash146(S,F,H,R,lod,2);fbox(S,'s146fl',F,H.a-.06,H.b+.06,H.s-.08,H.s,-.02,.07,false,'b');}
 // railing on the coping + returns back to the facade
 const P0=F.P(u0,0,AD+.09),P1=F.P(u1,0,AD+.09),Q0=F.P(u0,0,0),Q1=F.P(u1,0,0);
 railLine(S,b,P0[0],P0[2],P1[0],P1[2],lod);railLine(S,b,Q0[0],Q0[2],P0[0],P0[2],lod);railLine(S,b,P1[0],P1[2],Q1[0],Q1[2],lod);}
// front steps up to a door sill at .35 over the solid bridge between two areas
function doorSteps(S,F,a,b){for(let i=0;i<3;i++)fbox(S,'s146fl',F,a,b,i*.117,(i+1)*.117,0,.95-i*.3,false,'b');}
// ---------------------------------------------------------------- left terrace house (front on z = 0, u = x)
function house(S,b,R,lod,u0,u1,o){const F=FN,w=u1-u0,bays=[1,3,5].map(k=>u0+w*k/6),G2=4.0,ENT2=o.ent,PAR2=o.ent+.9,dep=13;
 const H=(c,s,h,wd=1.05,arch=false)=>({a:c-wd/2,b:c+wd/2,s,h,arch});
 const door={a:bays[2]-.6,b:bays[2]+.6,s:.35,h:3.3},g=[H(bays[0],1.2,3.3),H(bays[1],1.2,3.3)];
 wall(S,'s146ru',F,u0,u1,.35,G2,[...g,door]);fbox(S,'s146st',F,u0,u1,0,.35,0,.06,false,'b');for(const q of g)win146(S,F,q,R,lod,{wall:'s146ru'});
 reveal(S,'s146ru',F,door,.4);fq(S,'s146d2',F,door.a,door.b,.35,door.h,-.4,[[0,0],[1,0],[1,1],[0,1]]);
 // doorcase: two thin pilasters + entablature + pediment (tri on house A, segmental on house B)
 for(const u of[door.a-.22,door.b])fbox(S,'s146st',F,u,u+.22,.35,door.h+.1,-.02,.1,false,'b');
 if(!lod)aedicule146(S,F,{a:door.a+.05,b:door.b-.05,h:door.h-.1},o.ped);
 doorSteps(S,F,door.a-.1,door.b+.1);
 fbox(S,'s146st',F,u0,u1,G2-.28,G2,0,.15,false,'b');
 const f1=[H(bays[0],4.6,7.0,1.05),H(bays[1],4.6,o.arch?7.35:7.0,1.15,o.arch),H(bays[2],4.6,7.0,1.05)],f2=bays.map(c=>H(c,8.1,9.9)),f3=bays.map(c=>H(c,10.9,12.0,.9));
 wall(S,'s146br',F,u0,u1,G2,ENT2,[...f1,...f2,...f3]);
 for(const q of f1){win146(S,F,q,R,lod,{rows:3,arch:!q.arch});if(q.arch&&!lod){const r=(q.b-q.a)/2,cx=q.a+r,sp=q.h-r,N=9;   // stucco archivolt + keystone
   for(let j=0;j<N;j++){const t=PI-(j+.5)/N*PI,x=cx+Math.cos(t)*(r+.08),y=sp+Math.sin(t)*(r+.08);fbox(S,'s146st',F,x-.08,x+.08,y-.08,y+.08,-.02,.06,false,'b');}
   fbox(S,'s146st',F,cx-.1,cx+.1,q.h-.02,q.h+.24,-.02,.09,false,'b');}}
 if(o.balc&&!lod)for(const q of f1)balcony146(S,F,q.a-.15,q.b+.15,4.6,.35,lod);
 for(const q of f2)win146(S,F,q,R,lod,{arch:true});for(const q of f3)win146(S,F,q,R,lod,{});
 // corner pilasters full height with plain caps, cornice, parapet
 for(const[a,c]of[[u0,u0+.7],[u1-.7,u1]]){fbox(S,'s146st',F,a,c,G2,ENT2-.5,-.02,.12,false,'b');fbox(S,'s146st',F,a-.05,c+.05,ENT2-.5,ENT2-.3,-.02,.17,false,'b');}
 fbox(S,'s146st',F,u0,u1,ENT2-.3,ENT2,0,.14,false,'b');fbox(S,'s146st',F,u0-.1,u1+.1,ENT2,ENT2+.2,0,.5,false,'b');
 fbox(S,'s146st',F,u0,u1,ENT2+.2,PAR2,0,.12,false,'b');fbox(S,'s146st',F,u0-.03,u1+.03,PAR2,PAR2+.1,-.2,.16,false,'b');
 // sides / back: brick, simple sashes (lod), flat lead roof behind the parapet, a chimney stack on the party wall
 const sides=[[face([u0,-dep/2],[-1,0]),-dep/2,dep/2,o.west],[face([u1,-dep/2],[1,0]),-dep/2,dep/2,o.east],[face([(u0+u1)/2,-dep],[0,-1]),-w/2,w/2,true]];
 for(const[Fs,a,c,show]of sides){if(!show)continue;const hs=[];const n=Math.max(1,Math.floor((c-a)/3.2));for(let i=0;i<n;i++){const m=a+(i+.5)*(c-a)/n;for(const[s,h]of[[1.2,3.3],[4.8,7.0],[8.1,9.9],[10.9,12.0]])hs.push({a:m-.5,b:m+.5,s,h});}
  wall(S,'s146br',Fs,a,c,0,PAR2+.1,hs);for(const q of hs)sash146(S,Fs,q,R,true);}
 S.q('s146ir',[u0,PAR2-.2,0],[u1,PAR2-.2,0],[u1,PAR2-.2,-dep],[u0,PAR2-.2,-dep],[[0,0],[w/2,0],[w/2,dep/2],[0,dep/2]]);
 chimney146(S,u1-.6,-6.5,1.0,2.4,PAR2-.2,PAR2+2.2,4,lod);
 b.solid((u0+u1)/2,-dep/2,w,dep);return bays;}
// rear annex (warm brown brick, flat roof) between house A and the main building, behind the stucco garden wall
function annex(S,b,R,lod){const x0=-21,x1=-10.5,z0=-5,z1=-20,top=12.6,F=face([0,z0],[0,1]),FW=face([x0,(z0+z1)/2],[-1,0]),FS=face([(x0+x1)/2,z1],[0,-1]);
 for(const[Fs,a,c]of[[F,x0,x1],[FW,-(z0-z1)/2,(z0-z1)/2],[FS,-(x1-x0)/2,(x1-x0)/2]]){const n=Math.max(1,Math.round((c-a)/3.2)),hs=[];
  for(let i=0;i<n;i++){const m=a+(i+.5)*(c-a)/n;for(const[s,h]of[[1.0,3.0],[4.1,6.1],[7.0,9.0],[9.9,11.6]])hs.push({a:m-.52,b:m+.52,s,h});}
  wall(S,'s146ab',Fs,a,c,0,top,hs);for(const q of hs)win146(S,Fs,q,R,lod||Fs!==F,{wall:'s146ab'});
  fbox(S,'s146st',Fs,a,c,top,top+.18,0,.1,false,'b');}
 S.q('s146ir',[x0,top-.05,z0],[x1,top-.05,z0],[x1,top-.05,z1],[x0,top-.05,z1],[[0,0],[0,4],[6,4],[6,0]]);
 fbox(S,'s146ir',face([-14,-12],[0,1]),-1.2,1.2,top,top+1.8,-2,0,false,'d');   // stair hatch / lift room
 b.solid((x0+x1)/2,(z0+z1)/2,x1-x0,z0-z1);}
// stucco garden wall + pedimented gateway between house A and the main building (z 0 .. -0.4)
function gardenWall(S,b,lod){const F=FN,a=-21,c=-10.5,h=3.4,ga=-16.55,gb=-15.25;
 wall(S,'s146st',F,a,c,0,h,[{a:ga,b:gb,s:0,h:2.7}]);fbox(S,'s146st',F,a,c,h,h+.14,-.45,.08,false,'b');fbox(S,'s146st',F,a,c,0,.3,0,.05,false,'b');
 for(const u of[a,c-.55,ga-.5,gb])fbox(S,'s146st',F,u,u+.5,0,h+.05,0,.12,false,'b');
 reveal(S,'s146st',F,{a:ga,b:gb,s:0,h:2.7},.4);fq(S,'s146dr',F,ga,gb,0,2.7,-.4,[[0,0],[1,0],[1,1],[0,1]]);
 if(!lod)aedicule146(S,F,{a:ga+.1,b:gb-.1,h:2.85},'tri');
 S.q('s146fl',[a,.01,-.45],[c,.01,-.45],[c,.01,-5],[a,.01,-5],[[0,0],[4.8,0],[4.8,2.1],[0,2.1]]);   // yard
 b.solid((a+c)/2,-.2,c-a,.4);}
// ---------------------------------------------------------------- street furniture
function lampPost(S,b,x,z,lod){const P=[x,0,z];lathe146(S,'s146lp',P,[[.2,0],[.2,.18],[.16,.24],[.16,.5],[.12,.58],[.09,.66],[.075,.9],[.07,3.0],[.09,3.06],[.09,3.12],[.06,3.2],[.05,3.45]],lod?6:10);
 if(!lod){S.tube('s146lp',[x-.32,3.08,z],[x+.32,3.08,z],.018,4);for(const s of[-1,1])lathe146(S,'s146lp',[x+s*.32,3.08,z],[[.03,-.02],[.03,.02],[0,.04]],5);}   // ladder bar
 // lantern: square tapered, glass panes, roof + finial
 const y0=3.45,y1=4.05,r0=.13,r1=.2,c=[[-1,-1],[1,-1],[1,1],[-1,1]];
 for(let i=0;i<4;i++){const p=c[i],q=c[(i+1)%4];S.q('s146lt',[x+p[0]*r0,y0,z+p[1]*r0],[x+q[0]*r0,y0,z+q[1]*r0],[x+q[0]*r1,y1,z+q[1]*r1],[x+p[0]*r1,y1,z+p[1]*r1],[[0,0],[1,0],[1,1],[0,1]]);
  S.tube('s146lp',[x+p[0]*r0,y0,z+p[1]*r0],[x+p[0]*r1,y1,z+p[1]*r1],.012,3);
  S.q('s146lp',[x+p[0]*(r1+.04),y1,z+p[1]*(r1+.04)],[x+q[0]*(r1+.04),y1,z+q[1]*(r1+.04)],[x,y1+.24,z],[x,y1+.24,z],[[0,0],[1,0],[.5,1],[.5,1]]);}
 fbox(S,'s146lp',face([x,z+r0],[0,1]),-r0,r0,y0-.04,y0,-2*r0,0,false,'');lathe146(S,'s146lp',[x,y1+.22,z],[[.035,0],[.04,.06],[.02,.12],[.006,.2]],6);
 b.solid(x,z,.4,.4);}
function bollard(S,b,x,z){lathe146(S,'s146bo',[x,0,z],[[.13,0],[.13,.06],[.115,.1],[.11,.78],[.125,.8],[.125,.86],[.1,.9],[.06,.95],[0,.97]],10);b.solid(x,z,.28,.28);}
// bicycle leaning on a railing: frame tubes, wheels (rim + tyre ring + spokes), bars, saddle. Local: x along, y up, z to the side.
function bicycle(S,b,x,z,ry,lean,lod){const ca=Math.cos(ry),sa=Math.sin(ry),cl=Math.cos(lean),sl=Math.sin(lean);
 const P=(u,y,w)=>{const yy=y*cl-w*sl,ww=y*sl+w*cl;return[x+u*ca-ww*sa,yy,z-u*sa-ww*ca];};
 const Rw=.34,wb=.52,hub=[[-wb,Rw],[wb,Rw]],bb=[-.04,.3],seat=[-.2,.82],head=[.36,.8];
 const tb=(p,q,r=.016,k='s146bk')=>S.tube(k,P(p[0],p[1],0),P(q[0],q[1],0),r,4);
 tb(bb,seat);tb(seat,head);tb(bb,[.38,.72]);tb(head,[.4,.68],.02);tb([.4,.68],hub[1],.013);tb(bb,hub[0],.011);tb(seat,hub[0],.011);tb(seat,[-.21,.96],.012,'s146lp');
 S.tube('s146lp',P(.34,.86,-.24),P(.34,.86,.24),.012,4);S.tube('s146lp',P(.36,.8,0),P(.34,.86,0),.012,4);
 fbox(S,'s146rb',{off:0,P:(u,y,w)=>P(u,y,w)},-.32,-.1,.96,1.0,-.065,.065,false,'');                                   // saddle
 for(const[hx,hy]of hub){const N=lod?8:14;for(let i=0;i<N;i++){const t0=i/N*2*PI,t1=(i+1)/N*2*PI,a=[hx+Math.cos(t0)*Rw,hy+Math.sin(t0)*Rw],c=[hx+Math.cos(t1)*Rw,hy+Math.sin(t1)*Rw];
   S.tube('s146rb',P(a[0],a[1],0),P(c[0],c[1],0),.022,4);
   if(!lod&&i%2===0)S.tube('s146lp',P(hx,hy,0),P(hx+Math.cos(t0)*(Rw-.03),hy+Math.sin(t0)*(Rw-.03),0),.003,3);}}
 b.solid(x,z,1.4*Math.abs(ca)+.4*Math.abs(sa),1.4*Math.abs(sa)+.4*Math.abs(ca),0);}
function plate(S,F,u0,u1,y0,y1,uv,k='s146sg'){fbox(S,'s146lp',F,u0-.02,u1+.02,y0-.02,y1+.02,0,.025,false,'b');fq(S,k,F,u0,u1,y0,y1,.027,uv);}
function car(b,id,paint,x,z,ry){const c=CAR132[id],key='car132:'+paint;if(!b.mats[key])b.mats[key]=car132Material(paint,true);
 b.push(x,-.15+.045*(1-(12-z)/7.5)+.015,z,ry);b.add(car132Geometry(id),key,0,0,0);b.solid(0,0,c.W*.9,c.L*.97);b.pop();}
// give-way double dashed line across a lane (building frame; road y from the urban-streets crown profile)
function giveWay(b,axis,at,w0,w1){const ry=v=>-.15+.045*(1-Math.abs(12-v)/7.5)+.017;for(const off of[0,.55])for(let s=w0;s<w1-.3;s+=.9){const m=s+.3;
  if(axis==='x')b.box('white',at-off,ry(m),m,.18,.008,.6,0,.84);else b.box('white',m,ry(m),-(at-off),.6,.008,.18,0,.84);}}
// ================================================================= T2 task
export function* stucco146T2Task(b,lod,R){mats(b.mats);const S=new Soup();
 const bA=house(S,b,R,lod,-31,-21,{ent:12.9,ped:'tri',arch:true,east:true,west:false});
 const bB=house(S,b,R,lod,-41,-31,{ent:12.4,ped:'seg',arch:false,balc:true,east:false,west:true});
 annex(S,b,R,lod);gardenWall(S,b,lod);yield;S.flush(b);yield;
 // areas: north (u = x) and east (u = -z) fronts, bays from the main building + houses
 const nBays=[-2.5,-4.75,-7.9,...bA,...bB],eBays=[];for(let i=0;i<13;i++)eBays.push(1.1+1.375+i*2.75);
 for(const[a,c]of STUCCO146_AREA.n)areaSeg(S,b,FN,a,c,nBays,R,lod);for(const[a,c]of STUCCO146_AREA.e)areaSeg(S,b,FE,a,c,eBays,R,lod);
 doorSteps(S,FE,eBays[9]-.7,eBays[9]+.7);
 yield;S.flush(b);yield;
 // street furniture (sidewalk north z 1.5..4.5, east x 1.5..4.5; kerb at 4.5)
 for(const[x,z]of[[3.85,-9.2],[3.85,-24],[3.85,-38.5]])lampPost(S,b,x,z,lod);for(const[x,z]of[[-14,3.85],[-29,3.85]])lampPost(S,b,x,z,lod);
 bollard(S,b,.9,3.95);bollard(S,b,3.95,.9);bollard(S,b,3.95,-17.5);
 plate(S,FN,-3.05,-2.15,4.05,4.32,[[0,.5],[1,.5],[1,1],[0,1]]);plate(S,FE,1.3,2.2,4.05,4.32,[[0,0],[1,0],[1,.5],[0,.5]]);   // street names
 const pq=i=>[[i/4,0],[(i+1)/4,0],[(i+1)/4,1],[i/4,1]];
 plate(S,FN,-5.4,-5.1,2.5,2.8,pq(0),'s146pq');plate(S,FN,-24.15,-23.85,2.4,2.7,pq(1),'s146pq');plate(S,FN,-34.15,-33.85,2.4,2.7,pq(2),'s146pq');
 plate(S,FE,eBays[9]+.85,eBays[9]+1.15,2.5,2.8,pq(2),'s146pq');
 {const F=face([AD+.13,0],[1,0]);plate(S,F,20.2,20.65,.55,.9,pq(3),'s146pq');}   // small notice plate on the east railing
 if(!lod){bicycle(S,b,-11.6,1.72,0,.2,lod);bicycle(S,b,-13.7,1.75,PI,-.2,lod);bicycle(S,b,1.75,-15.6,PI/2,.2,lod);}
 yield;S.flush(b);
 // cars: white van + white saloon in the north street's parking lane, give-way lines behind the stock crossings
 car(b,'van','car8_white',-34,5.75,PI/2);car(b,'sedan','car5_white',-41.6,5.7,PI/2);
 giveWay(b,'x',-5.6,5.0,11.6);giveWay(b,'z',5.6,5.0,11.6);yield;}
