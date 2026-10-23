// V145 M3 Maltose Market (麦芽糖市场) — the far / side buildings of the reference photo, deduced and modelled for real so they
// hold up when walked to (ref files/ref-1023-maltose-market.webp, spec notes/spec-1023-maltose-market.md, placement solved in
// the M2 photo camera: city (190, 1.6, -50) yawed 12 deg right of south, f ~ 1000 px; /workspace/work/v145/m3/proj.py).
//  RR  right near red: block (2,-1) south-west corner L (corner city (236,-100)); 7-level orange-red common brick, stone
//      lintels, white sashes, window ACs, fire escape on the avenue face, deli on the corner (photo x 1300..1415).
//  TB  tall brown right: block (2,-2) courtyard (x 256..290, z -148..-170), 11 + 14 levels of chestnut brick with a roof
//      penthouse and a timber water tank on a steel stand (photo x 1115..1330 above the brown corner building).
//  TL  tall dark left: block (1,-2) courtyard behind RED (x 140..168, z -150..-174), 20 levels of umber Flemish-bond brick
//      (photo top-left above the red building, running out of frame).
//  LG  light grey: block (2,-2) south row west lots (x 236..277, z -212..-188), 5 levels of pale stone, cleaners + cafe
//      (photo gap between beige and brown, x 800..830).
//  SR  San Remo-style twin towers: block (2,-3) north (base x 250..311, z -282..-246; tower centres x 268 / 293, z -268):
//      limestone base slab with a balustraded terrace, two square shafts, setback stage with urns, round Corinthian tholos,
//      lantern, finial (photo x 795..985, spire tips y 130 / 145).
// Shares the M2 helpers (maltose145-bldg.js). Textures: bc/tools/maltose145_m3_assets.py -> assets/l11-v145. ?malt145=0 off.
import * as T from './vendor/three.module.min.js';
import {urbanHash} from './urban-batch.js?v=60';
import {Soup,face,fq,fbox,wall,reveal,sash,acUnit,fireEscape,cornice,band,facade,shops,TILE,addMats,tex} from './maltose145-bldg.js?v=145c';
const PI=Math.PI,TAU=PI*2;
let M=null;
function addFarMats(m){addMats(m);if(m.m145ob)return;if(!M){const S=(o)=>new T.MeshStandardMaterial({metalness:0,roughness:1,vertexColors:true,...o});
 const W=(n,o={})=>S({map:tex(n),normalMap:tex(n+'-n',false),roughnessMap:tex(n+'-r',false),...o});
 M={m145ob:W('obrick145'),m145tb:W('tbrick145'),m145db:W('dbrick145'),m145sl:W('srlime145'),m145gs:W('gstone145'),
  m145co:S({map:tex('corn145o'),normalMap:tex('corn145o-n',false),roughness:.6,metalness:.3}),
  m145ct:S({map:tex('corn145t'),normalMap:tex('corn145t-n',false),roughness:.6,metalness:.3}),
  m145tk:S({map:tex('tank145'),normalMap:tex('tank145-n',false),roughness:.9}),
  m145sd:S({map:tex('shopd145',true,false),roughness:.35,metalness:.2}),m145sc:S({map:tex('shopc145',true,false),roughness:.35,metalness:.2}),
  m145sf:S({map:tex('shopf145',true,false),roughness:.35,metalness:.2})};
 for(const[k,v]of Object.entries(M))v.name='V145 '+k;}Object.assign(m,M);}
Object.assign(TILE,{m145ob:[2.05,1.39],m145tb:[1.64,1.23],m145db:[1.8,1.23],m145sl:[2.4,2.4],m145gs:[2.6,2.6],m145co:[1.5,1.5],m145ct:[1.5,1.5],m145tk:[2,2]});
const mkFloors=(G,FH,NF,s,h)=>{const f=[];for(let i=0;i<NF;i++){const y=G+i*FH;f.push([y,y+FH,y+s,y+s+h]);}return f;};
const evenBays=(a,c,pitch,w,extra={})=>{const L=c-a,n=Math.max(1,Math.floor(L/pitch)),bs=[];for(let i=0;i<n;i++)bs.push({c:a+(i+.5)*L/n,w,...extra});return bs;};
// facade split: full detail on the lowest `nd` floors, light (glass + reveal-less) above — keeps towers affordable
function facadeSplit(S,F,cfg,nd){const {floors}=cfg;if(cfg.lod||nd>=floors.length){facade(S,F,cfg);return;}
 facade(S,F,{...cfg,floors:floors.slice(0,nd)});
 const re=B=>({...B,arch:B.arch?new Set([...B.arch].map(i=>i-nd)):null,skip:B.skip?new Set([...B.skip].map(i=>i-nd)):null,tri:B.tri?new Set([...B.tri].map(i=>i-nd)):null});
 facade(S,F,{...cfg,floors:floors.slice(nd),bays:cfg.bays.map(re),lod:true,ac:0});
 // light floors still get stone sills (one thin box per window) so the grid reads from the street
 for(const [y0,y1,s]of floors.slice(nd))for(const B of cfg.bays)fbox(S,cfg.sill||'m145li',F,B.c-B.w/2-.06,B.c+B.w/2+.06,s-.08,s,-.02,.06,false,'bl');}
// ground storey: shop spans [[u0,u1,key]] and plain wall (windows with iron guards every other bay, doors) elsewhere
function ground(S,F,a,c,G,k,R,det,frame,spans=[],doors=[],pitch=2.8,ww=1.1,pier=k){let u=a;const plain=(x0,x1)=>{if(x1-x0<.3)return;
  const hs=evenBays(x0,x1,pitch,ww).filter((B,i)=>i%2===0).map(B=>({a:B.c-B.w/2,b:B.c+B.w/2,s:1.2,h:G-.9})).filter(H=>!doors.some(d=>H.a<d+1.1&&H.b>d-1.1));
  for(const d of doors)if(d>x0+.9&&d<x1-.9)hs.push({a:d-.8,b:d+.8,s:0,h:G-.8});
  wall(S,k,F,x0,x1,0,G,hs);
  for(const H of hs){if(det)reveal(S,k,F,H,.25);if(H.s===0){fq(S,'m145ir',F,H.a,H.b,0,H.h,-.25,[[0,0],[1,0],[1,1],[0,1]]);if(det)fbox(S,'m145li',F,H.a-.15,H.b+.15,H.h,H.h+.25,-.05,.15,false,'b');}
   else{sash(S,F,H,R,frame,!det);if(det)for(let x=H.a+.12;x<H.b;x+=.16)S.tube('m145ir',F.P(x,H.s,.05),F.P(x,H.h,.05),.012,3);}}};
 for(const[s0,s1,key]of [...spans].sort((p,q)=>p[0]-q[0])){plain(u,s0);shops(S,F,s0,s1,G,key,pier,R,!det);u=s1;}plain(u,c);}
// four faces of a rectangle centred at (cx,cz): [front +z, right +x, back -z, left -x] with u centred on each face
function rectFaces(cx,cz,W,D){return[[face([cx,cz+D/2],[0,1]),W],[face([cx+W/2,cz],[1,0]),D],[face([cx,cz-D/2],[0,-1]),W],[face([cx-W/2,cz],[-1,0]),D]];}
// generic block: walls with windows on all faces, ground storey (shops / plain), bands, cornice, parapet, flat roof
function block(S,b,lod,R,c){const{cx=0,cz=0,W,D,G,floors,wall:k}=c,TOP=floors.at(-1)[1],fs=rectFaces(cx,cz,W,D);
 fs.forEach(([F,L],fi)=>{const det=!lod&&(c.det?c.det.includes(fi):true),bays=(c.bays&&c.bays(fi,L))||evenBays(-L/2,L/2,c.pitch||2.8,c.winW||1.1);
  facadeSplit(S,F,{u0:-L/2,u1:L/2,wall:k,floors,bays,R,lod:!det,frame:c.frame||'m145wp',ac:c.ac||0,lintel:c.lintel,key:c.key,voussoir:c.vous},c.nd??3);
  ground(S,F,-L/2,L/2,G,c.base||k,R,det,c.frame||'m145wp',(c.shops&&c.shops[fi])||[],(c.doors&&c.doors[fi])||[],c.pitch||2.8,c.winW||1.1,c.pier||c.base||k);
  if(c.bands)for(const[y,h,p]of c.bands)band(S,F,-L/2,L/2,y,h,p,c.bandK||'m145li');
  if(c.corn)cornice(S,F,-L/2,L/2,TOP,c.corn,c.cornP||.8,lod||!det);
  fbox(S,k,F,-L/2,L/2,TOP+(c.corn?.98:0),TOP+(c.corn?.98:0)+(c.par??.9),-.3,0,false,'b');});
 const y=TOP+.45;S.q('m145rf',[cx-W/2,y,cz+D/2],[cx+W/2,y,cz+D/2],[cx+W/2,y,cz-D/2],[cx-W/2,y,cz-D/2],[[0,0],[W/3,0],[W/3,D/3],[0,D/3]]);
 return TOP;}
// ---------------------------------------------------------------- L corner building (generalised M2 brown)
// corner at local (0,0); north face z = 0 (x 0..LN), west face x = 0 (z 0..-LW); wings DN / DW deep
function genL(S,b,lod,R,c){const{G,floors,LN,LW,DN,DW,wall:k}=c,TOP=floors.at(-1)[1];
 const FN=face([0,0],[0,1]),FW=face([0,0],[-1,0]);
 const mk=(L,st=0)=>evenBays(st,st+L,c.pitch||2.85,c.winW||1.1,c.arch?{arch:c.arch}:{});
 facadeSplit(S,FN,{u0:0,u1:LN,wall:k,floors,bays:mk(LN),R,lod,frame:c.frame,ac:c.ac,lintel:c.lintel,key:c.key,voussoir:c.vous},c.nd??4);
 facadeSplit(S,FW,{u0:-LW,u1:0,wall:k,floors,bays:mk(LW,-LW),R,lod,frame:c.frame,ac:c.ac,lintel:c.lintel,key:c.key,voussoir:c.vous},c.nd??4);
 for(const[Fx,a,cc,gk]of[[FN,0,LN,c.shopN],[FW,-LW,0,c.shopW]]){for(const[y,h,p]of c.bands||[])band(S,Fx,a,cc,y,h,p,c.bandK||'m145li');
  cornice(S,Fx,a,cc,TOP,c.corn,c.cornP||1,lod);ground(S,Fx,a,cc,G,k,R,!lod,c.frame,gk||[],Fx===FN?(c.doorN||[]):(c.doorW||[]),c.pitch||2.85,c.winW||1.1,c.pier||k);fbox(S,k,Fx,a,cc,TOP+.98,TOP+1.5,-.3,0,false,'b');}
 fbox(S,'m145li',FN,-.02,.55,G,TOP,0,.08);
 const lv=floors.map(q=>q[2]-(q[2]-q[0]));for(const[u0,u1]of c.feN||[])fireEscape(S,FN,u0,u1,lv,lod);for(const[u0,u1]of c.feW||[])fireEscape(S,FW,u0,u1,lv,lod);
 const sides=[[face([LN,-DN/2],[1,0]),-DN/2,DN/2],[face([0,-LW],[0,-1]),-DW,0],[face([DW+(LN-DW)/2,-DN],[0,-1]),-(LN-DW)/2,(LN-DW)/2],[face([DW,-DN-(LW-DN)/2],[1,0]),-(LW-DN)/2,(LW-DN)/2]];
 for(const[Fs,a,cc]of sides){if(cc-a<.5)continue;facade(S,Fs,{u0:a,u1:cc,wall:k,floors,bays:evenBays(a,cc,3.2,1.1),R,lod:true,frame:c.frame});fq(S,k,Fs,a,cc,0,G);fq(S,k,Fs,a,cc,TOP,TOP+1.5);}
 const y=TOP+.5;S.q('m145rf',[0,y,0],[LN,y,0],[LN,y,-DN],[0,y,-DN],[[0,0],[LN/3,0],[LN/3,-DN/3],[0,-DN/3]]);S.q('m145rf',[0,y,-DN],[DW,y,-DN],[DW,y,-LW],[0,y,-LW],[[0,0],[DW/3,0],[DW/3,-LW/3],[0,-LW/3]]);
 b.solid(LN/2,-DN/2,LN,DN);b.solid(DW/2,-LW/2,DW,LW);return TOP;}
// ---------------------------------------------------------------- round things (tholos, tank, finial)
function cyl(S,k,cx,cz,y0,y1,r0,r1,n,cap=false,uS=1){for(let i=0;i<n;i++){const a0=i/n*TAU,a1=(i+1)/n*TAU,P=(a,r,y)=>[cx+Math.cos(a)*r,y,cz+Math.sin(a)*r];
  const L=TAU*Math.max(r0,r1)/n*uS;S.q(k,P(a0,r0,y0),P(a0,r1,y1),P(a1,r1,y1),P(a1,r0,y0),[[i*L,0],[i*L,(y1-y0)*uS],[(i+1)*L,(y1-y0)*uS],[(i+1)*L,0]]);
  if(cap&&r1>.001)S.tri(k,[cx,y1,cz],P(a1,r1,y1),P(a0,r1,y1),[.5,.5],[.5+Math.cos(a1)*.5,.5+Math.sin(a1)*.5],[.5+Math.cos(a0)*.5,.5+Math.sin(a0)*.5]);}}
function waterTank(S,cx,cz,y,lod){// NYC timber tank: steel stand, stave barrel with hoops, conical roof + finial
 const r=2.1,h=4.2;for(const[dx,dz]of[[-1.4,-1.4],[1.4,-1.4],[1.4,1.4],[-1.4,1.4]])S.tube('m145ir',[cx+dx,y,cz+dz],[cx+dx*.9,y+2.6,cz+dz*.9],.09,4);
 if(!lod)for(const[a,c2]of[[[-1.4,-1.4],[1.4,1.4]],[[1.4,-1.4],[-1.4,1.4]]])S.tube('m145ir',[cx+a[0],y+.2,cz+a[1]],[cx+c2[0]*.9,y+2.5,cz+c2[1]*.9],.03,3);
 fbox(S,'m145ir',face([cx,cz+1.6],[0,1]),-1.6,1.6,y+2.6,y+2.85,-3.2,0,true);
 cyl(S,'m145tk',cx,cz,y+2.85,y+2.85+h,r,r*.97,lod?8:14,false,.5);
 if(!lod)for(let i=0;i<5;i++){const yy=y+3.1+i*h/5.2;cyl(S,'m145ir',cx,cz,yy,yy+.06,r+.03,r+.03,14);}
 cyl(S,'m145tk',cx,cz,y+2.85+h,y+2.85+h+1.5,r+.15,.12,lod?8:14,true,.5);S.tube('m145ir',[cx,y+h+4.2,cz],[cx,y+h+5,cz],.04,3);}
// ================================================================= the buildings
function rightRed(S,b,lod,R){// (2,-1) SW corner, spec ry = -PI/2: local north face = world west (avenue) face, local west = world south face
 const G=4.2,floors=mkFloors(G,3.2,6,.75,1.8);
 genL(S,b,lod,R,{G,floors,LN:64,LW:41,DN:22,DW:24,wall:'m145ob',frame:'m145wp',ac:.3,lintel:true,corn:'m145co',cornP:.95,pitch:2.6,winW:1.05,
  bands:[[G-.12,.32,.12],[G+5*3.2-.2,.18,.07]],shopN:[[0,6.4,'m145sd']],shopW:[[-6.4,0,'m145sd']],doorN:[31],doorW:[-24],pier:'m145li',feN:[[8.2,12.6],[40,44.4]],nd:7});
 const RF=face([0,-10],[0,1]);fbox(S,'m145ob',RF,20,25,23.4+.5,23.4+3.4,-5,0,false,'d');fbox(S,'m145co',RF,19.8,25.2,26.8,27,-5.2,.2,false,'d');}
function tallBrown(S,b,lod,R){// (2,-2) courtyard; local centre x = 273, z = -159 (ry 0, front +z faces the yard)
 const G=4,west={cx:-11,cz:0,W:12,D:22},main={cx:6,cz:0,W:22,D:22};
 const f1=mkFloors(G,3,10,.8,1.75),f2=mkFloors(G,3,15,.8,1.75);
 const com={G,wall:'m145tb',frame:'m145wp',ac:.28,lintel:true,pitch:2.5,winW:1.,bands:[[G-.1,.3,.1],[G+3-.15,.15,.06]],corn:'m145ct',cornP:.7,par:.6,nd:2};
 const t1=block(S,b,lod,R,{...com,...west,floors:f1,det:[0,3]});const t2=block(S,b,lod,R,{...com,...main,floors:f2,det:[0,1]});
 // penthouse + tank + flagpole (photo x 1295)
 const RF=face([6,4],[0,1]);fbox(S,'m145tb',RF,-4,6,t2+.45,t2+3.6,-9,0,false,'d');fbox(S,'m145ct',RF,-4.2,6.2,t2+3.6,t2+3.85,-9.2,.2,false,'d');
 waterTank(S,12,-4,t2+.45,lod);S.tube('m145ir',[16,t2+1,6],[16,t2+9,6],.05,4);
 b.solid(-11,0,12,22);b.solid(6,0,22,22);}
function tallDark(S,b,lod,R){// (1,-2) courtyard behind RED; local centre x = 154, z = -162
 const G=4.2,floors=mkFloors(G,3,19,.8,1.75);
 const T0=block(S,b,lod,R,{W:28,D:24,G,floors,wall:'m145db',frame:'m145ir',ac:.2,pitch:2.35,winW:1.,lintel:false,key:true,
  bands:[[G-.1,.35,.12],[G+3*3-.2,.25,.1],[G+16*3-.2,.25,.1]],corn:'m145ct',cornP:.6,par:1.4,det:[0,3],nd:2});
 // setback crown: two-storey brick penthouse + water tank
 fbox(S,'m145db',face([0,6],[0,1]),-9,9,T0+.45,T0+6.4,-12,0,false,'d');cornice(S,face([0,6],[0,1]),-9,9,T0+6.4,'m145ct',.4,true);
 waterTank(S,-6,-6,T0+.45,lod);b.solid(0,0,28,24);}
function lightGrey(S,b,lod,R){// (2,-2) south row west lots; local centre x = 256.5, z = -200 (west face fi 3 on the avenue)
 const G=4.4,floors=mkFloors(G,3.4,4,.85,2.0);
 block(S,b,lod,R,{W:41,D:24,G,floors,wall:'m145gs',frame:'m145ir',ac:.12,lintel:true,key:false,pitch:2.9,winW:1.15,
  bands:[[G-.1,.4,.16],[G+3.4*3+.2,.2,.08]],corn:'m145gs',cornP:.75,par:.8,shops:[[],[],[],[[-12,-6,'m145sc'],[-6,0,'m145sf']]],doors:[[0],[],[4,-9],[6]],pier:'m145gs',nd:2});
 b.solid(0,0,41,24);}
// San Remo-style twin towers. Local centre (280.5,-264), ry 0, front +z (north). Base 61 x 36 m, towers 17 m square at x -12.5 / +12.5
function sanRemo(S,b,lod,R){const G=5,FB=3.1,NB=10,base=mkFloors(G,FB,NB,.7,1.75),TB=G+NB*FB;   // 36 m
 const BW=61,BD=36;
 block(S,b,lod,R,{W:BW,D:BD,G,floors:base,wall:'m145sl',frame:'m145ir',ac:.06,pitch:2.45,winW:1.,lintel:true,key:false,sill:'m145sl',
  bands:[[G-.15,.45,.18],[G+2*FB-.15,.3,.12],[TB-FB-.2,.25,.1]],corn:'m145sl',cornP:.9,par:0,base:'m145sl',doors:[[0],[],[0],[]],nd:2});
 // terrace balustrade on the base roof
 for(const[F,L]of rectFaces(0,0,BW,BD)){fbox(S,'m145sl',F,-L/2,L/2,TB+.98,TB+1.1,-.35,0,false,'b');fbox(S,'m145sl',F,-L/2,L/2,TB+1.9,TB+2.05,-.4,.02,false,'b');
  if(!lod)for(let u=-L/2+.3;u<L/2;u+=.42)S.tube('m145sl',F.P(u,TB+1.1,-.18),F.P(u,TB+1.9,-.18),.06,4);}
 // grand entrance on the front: rusticated arch surround
 const FF=face([0,BD/2],[0,1]);fbox(S,'m145sl',FF,-2.4,2.4,0,G+1,0,.35,false,'b');fbox(S,'m145sl',FF,-3,3,G+1,G+1.5,0,.5,false,'b');
 for(const tx of[-12.5,12.5])tower(S,b,lod,R,tx,0,TB+1);
 b.solid(0,0,BW,BD);}
function tower(S,b,lod,R,cx,cz,y0){const TW=14,FT=3.1,NT=8,fl=mkFloors(0,FT,NT,.7,1.8).map(([a,c,s,h])=>[a+y0,c+y0,s+y0,h+y0]),T1=y0+NT*FT;   // ~61 m
 // shaft: windows in pairs, paired windows near the corners leave solid corner piers (the photo's strong edges)
 const bays=(fi,L)=>{const bs=[];for(const u of[-4.95,-3.8,-.6,.6,3.8,4.95])bs.push({c:u,w:.9});return bs;};
 for(const[F,L]of rectFaces(cx,cz,TW,TW)){facadeSplit(S,F,{u0:-L/2,u1:L/2,wall:'m145sl',floors:fl,bays:bays(),R,lod,frame:'m145ir',lintel:true,sill:'m145sl'},lod?0:1);
  // corner quoins / chamfer piers
  fbox(S,'m145sl',F,-L/2-.02,-L/2+.6,y0,T1,0,.22);fbox(S,'m145sl',F,L/2-.6,L/2+.02,y0,T1,0,.22);
  band(S,F,-L/2,L/2,y0+4*FT-.2,.3,.14,'m145sl');cornice(S,F,-L/2,L/2,T1,'m145sl',.7,lod);}
 // stage 2: setback 14 m, tall arched pairs, corner obelisk urns
 const S2=11.6,y2=T1+.98,T2=y2+8.2;
 for(const[F,L]of rectFaces(cx,cz,S2,S2)){const holes=[{a:-2.2,b:-1.1,s:y2+1.5,h:y2+6.4,arch:true},{a:1.1,b:2.2,s:y2+1.5,h:y2+6.4,arch:true},{a:-.5,b:.5,s:y2+2.2,h:y2+5.6}];
  wall(S,'m145sl',F,-L/2,L/2,y2,T2,holes);for(const H of holes){if(!lod)reveal(S,'m145sl',F,H,.35);sash(S,F,H,R,'m145ir',lod);}
  fbox(S,'m145sl',F,-L/2-.02,-L/2+.7,y2,T2,0,.3);fbox(S,'m145sl',F,L/2-.7,L/2+.02,y2,T2,0,.3);
  cornice(S,F,-L/2,L/2,T2,'m145sl',.55,lod);}
 for(const sx of[-1,1])for(const sz of[-1,1]){const ux=cx+sx*(TW/2-.75),uz=cz+sz*(TW/2-.75);fbox(S,'m145sl',face([ux,uz+.5],[0,1]),-.5,.5,y2,y2+1,-1,0,true);
  cyl(S,'m145sl',ux,uz,y2+1,y2+3.2,.38,.05,6,false,.5);}
 // podium + round Corinthian tholos (10 columns), inner drum, entablature, lantern, cupola, finial
 const y3=T2+.98,P0=5;fbox(S,'m145sl',face([cx,cz+P0],[0,1]),-P0,P0,y3,y3+1,-2*P0,0,false,'d');
 const yc=y3+1,HC=5.6,RC=4.2,NC=lod?8:10;cyl(S,'m145sl',cx,cz,yc,yc+.3,RC+.4,RC+.4,20,true);
 for(let i=0;i<NC;i++){const a=i/NC*TAU,x=cx+Math.cos(a)*RC,z=cz+Math.sin(a)*RC;cyl(S,'m145sl',x,z,yc+.3,yc+.3+HC-.6,.36,.3,lod?5:8);if(!lod)cyl(S,'m145sl',x,z,yc+HC-.3,yc+HC,.3,.48,8);}
 cyl(S,'m145sl',cx,cz,yc+.3,yc+HC,2.9,2.9,lod?8:16,false,.5);   // stone drum behind the colonnade, tall dark windows between columns
 for(let i=0;i<8;i++){const a=(i+.5)/8*TAU,x=cx+Math.cos(a)*2.92,z=cz+Math.sin(a)*2.92,F=face([x,z],[Math.cos(a),Math.sin(a)]);fq(S,'m145gl',F,-.45,.45,yc+1,yc+HC-.6,.01,[[i%3/3,0],[(i%3+1)/3,0],[(i%3+1)/3,.5],[i%3/3,.5]]);}
 const ye=yc+HC;cyl(S,'m145sl',cx,cz,ye,ye+.9,RC+.5,RC+.5,20);cyl(S,'m145sl',cx,cz,ye+.9,ye+1.2,RC+.5,RC-1.2,20,false);
 const yl=ye+1.2,HL=3,RL=2.1;cyl(S,'m145sl',cx,cz,yl,yl+HL,RL,RL*.95,12);
 if(!lod)for(let i=0;i<8;i++){const a=(i+.5)/8*TAU;cyl(S,'m145sl',cx+Math.cos(a)*(RL+.15),cz+Math.sin(a)*(RL+.15),yl,yl+HL,.13,.13,5);}
 for(let i=0;i<8;i++){const a=i/8*TAU,x=cx+Math.cos(a)*(RL+.01),z=cz+Math.sin(a)*(RL+.01),n=[Math.cos(a),Math.sin(a)],F=face([x,z],n);fq(S,'m145gl',F,-.35,.35,yl+.6,yl+2.4,.01,[[0,0],[1/3,0],[1/3,.5],[0,.5]]);}
 const yd=yl+HL;cyl(S,'m145sl',cx,cz,yd,yd+.35,RL+.3,RL+.3,12,false);cyl(S,'m145sl',cx,cz,yd+.35,yd+1.6,RL+.1,.9,12,false);
 cyl(S,'m145sl',cx,cz,yd+1.6,yd+4.6,.9,.04,10,false,.5);
 if(!lod)cyl(S,'m145ir',cx,cz,yd+4.6,yd+5.6,.05,.02,4);}
const BUILD={rr:rightRed,tb:tallBrown,tl:tallDark,lg:lightGrey,sr:sanRemo};
export function* maltose145FarTask(b,spec,lod){addFarMats(b.mats);const S=new Soup();let s=urbanHash(spec.seed|0,145,0x145f)>>>0;const R=()=>((s=(s*1664525+1013904223)>>>0)/4294967296);
 BUILD[spec.malt145f](S,b,lod,R);yield;S.flush(b);yield;}
