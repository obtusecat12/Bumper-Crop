// V145 M2 Maltose Market (麦芽糖市场) — the three near buildings the reference photo looks at across the z = -112 street
// (ref files/ref-1023-maltose-market.webp, spec notes/spec-1023-maltose-market.md). Placement solved from the photo
// (notes/version-history V145 M2): camera in the yard ~ city (190, 1.6, -50) yawed 12 deg right of south, f ~ 1000 px.
//  RED   block (1,-2) north row lx 12..61: 7-level red painted brick walk-up, white sash windows in pairs, fire escape on the
//        east bays, two arched windows on the 3rd floor east, bracketed cornice, black shopfronts with a white fascia.
//  BEIGE block (1,-2) north row lx 64..100: 6-level buff brick + banded rusticated base, two pavilions with tripartite
//        windows and arched pairs on the top floor, a central pier with single arches, two fire escapes, modillion cornice,
//        stucco roof penthouses. The 3 m gap to RED is the light-well the photo shows between them.
//  BROWN block (2,-2) north-west corner (corner = city (236,-124)): 7-level tawny Roman brick L (north wing along the street,
//        west wing 60 m down the avenue), arched windows on floors 2 and 6, stringcourses, deep cornice, fire escapes on both
//        faces, window AC units, green shopfronts.
// Everything is real geometry: walls with true openings (strip-cut, arch spandrels), reveals, recessed sash windows with one
// of six interiors, frames / meeting rails, stone sills / lintels / keystones, bands, cornices with modillions, fire escapes
// (grating platforms, railings with balusters, stair flights, drop ladders, brackets), AC boxes, shopfront bays, roof parapets,
// penthouses. Textures: bc/tools/maltose145_m2_assets.py -> assets/l11-v145. Off: ?malt145=0 (with the rest of V145).
import * as T from './vendor/three.module.min.js';
import {urbanHash} from './urban-batch.js?v=60';
const A=new URL('./assets/l11-v145/',import.meta.url).href,PI=Math.PI;
function tex(n,srgb=true,rep=true){const t=new T.TextureLoader().load(A+n+'.webp?v=145b');if(srgb)t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;t.magFilter=T.NearestFilter;if(rep)t.wrapS=t.wrapT=T.RepeatWrapping;return t;}
let M=null;
function addMats(m){if(m.m145rb)return;if(!M){const S=(o)=>new T.MeshStandardMaterial({metalness:0,roughness:1,vertexColors:true,...o});
 const W=(n,o={})=>S({map:tex(n),normalMap:tex(n+'-n',false),roughnessMap:tex(n+'-r',false),...o});
 M={m145rb:W('rbrick145'),m145bb:W('bbrick145'),m145bf:W('buff145'),m145ru:W('rustic145'),m145li:W('lime145'),
  m145ir:W('iron145',{metalness:.45}),m145gr:S({map:tex('grate145'),alphaTest:.5,side:T.DoubleSide,metalness:.45,roughness:.6}),
  m145wp:S({map:tex('wpaint145'),normalMap:tex('wpaint145-n',false),roughness:.5}),
  m145gl:S({map:tex('win145',true,false),roughness:.12,metalness:.3}),
  m145ac:S({map:tex('ac145',true,false),roughness:.6}),m145acs:S({color:0xb8b2a2,roughness:.7}),
  m145cr:S({map:tex('corn145r'),normalMap:tex('corn145r-n',false),roughness:.6,metalness:.3}),
  m145cb:S({map:tex('corn145b'),normalMap:tex('corn145b-n',false),roughness:.6,metalness:.3}),
  m145cy:S({map:tex('corn145y'),normalMap:tex('corn145y-n',false),roughness:.6,metalness:.3}),
  m145sb:S({map:tex('shopb145',true,false),roughness:.35,metalness:.2}),m145sg:S({map:tex('shopg145',true,false),roughness:.35,metalness:.2}),
  m145en:S({map:tex('entry145',true,false),roughness:.5}),m145st:S({map:tex('stucco145'),normalMap:tex('stucco145-n',false)}),
  m145rf:S({map:tex('roof145'),normalMap:tex('roof145-n',false)})};
 for(const[k,v]of Object.entries(M))v.name='V145 '+k;}Object.assign(m,M);}
// brick tile sizes in metres [u, v] (whole brick periods of each texture, see maltose145_m2_assets.py)
const TILE={m145rb:[2.84,1.61],m145bb:[1.9,1.08],m145bf:[1.83,1.07],m145ru:[2.9,1.2],m145li:[1.2,1.2],m145ir:[.8,.8],m145st:[2.4,2.4],m145rf:[3,3],m145wp:[.6,.6],m145cr:[1.5,1.5],m145cb:[1.5,1.5],m145cy:[1.5,1.5]};
// ---------------------------------------------------------------- soup with face frames
class Soup{constructor(){this.p={};}
 tri(k,a,b,c,ua,ub,uc){const s=this.p[k]||(this.p[k]={pos:[],uv:[]});s.pos.push(...a,...b,...c);s.uv.push(...ua,...ub,...uc);}
 q(k,a,b,c,d,uv){this.tri(k,a,b,c,uv[0],uv[1],uv[2]);this.tri(k,a,c,d,uv[0],uv[2],uv[3]);}
 tube(k,a,b,r,n=4){const A=new T.Vector3(...a),B=new T.Vector3(...b),d=B.clone().sub(A),L=d.length();if(L<1e-4)return;d.normalize();
  const ref=Math.abs(d.y)<.9?new T.Vector3(0,1,0):new T.Vector3(1,0,0),e1=new T.Vector3().crossVectors(d,ref).normalize(),e2=new T.Vector3().crossVectors(d,e1);
  const ring=(P,i)=>{const t=(i+.5)/n*2*PI;return P.clone().addScaledVector(e1,Math.cos(t)*r).addScaledVector(e2,Math.sin(t)*r).toArray();};
  for(let i=0;i<n;i++)this.q(k,ring(A,i),ring(A,i+1),ring(B,i+1),ring(B,i),[[i/n,0],[(i+1)/n,0],[(i+1)/n,L/.8],[i/n,L/.8]]);}
 flush(b){for(const[k,s]of Object.entries(this.p)){if(!s.pos.length)continue;const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(s.pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(s.uv,2));g.computeVertexNormals();b.add(g,k,0,0,0);g.dispose();}this.p={};}}
// face frame: origin o=[x,z], outward normal n=[nx,nz]; u runs along d = (nz, -nx), y up, w outward
function face(o,n,off=0){const d=[n[1],-n[0]];return{o,n,d,off,P:(u,y,w)=>[o[0]+u*d[0]+w*n[0],y,o[1]+u*d[1]+w*n[1]]};}
// planar quad on the face plane at w, tiled uv (texture metres)
function fq(S,k,F,u0,u1,y0,y1,w=0,uvm=null){const t=TILE[k]||[1,1],o=F.off;
 const uv=uvm||[[(u0+o)/t[0],y0/t[1]],[(u1+o)/t[0],y0/t[1]],[(u1+o)/t[0],y1/t[1]],[(u0+o)/t[0],y1/t[1]]];
 S.q(k,F.P(u0,y0,w),F.P(u1,y0,w),F.P(u1,y1,w),F.P(u0,y1,w),uv);}
// box in face space; uv tiled per face (or unit when unit=true)
function fbox(S,k,F,u0,u1,y0,y1,w0,w1,unit=false,skip=''){const t=TILE[k]||[1,1],P=(i,j,l)=>F.P(i?u1:u0,j?y1:y0,l?w1:w0);
 const U=(a,b,c,dd)=>unit?[[0,0],[1,0],[1,1],[0,1]]:[[a/t[0],c/t[1]],[b/t[0],c/t[1]],[b/t[0],dd/t[1]],[a/t[0],dd/t[1]]];
 const du=u1-u0,dy=y1-y0,dw=w1-w0;
 if(!skip.includes('f'))S.q(k,P(0,0,1),P(1,0,1),P(1,1,1),P(0,1,1),U(u0+F.off,u1+F.off,y0,y1));
 if(!skip.includes('b'))S.q(k,P(1,0,0),P(0,0,0),P(0,1,0),P(1,1,0),U(0,du,y0,y1));
 if(!skip.includes('r'))S.q(k,P(1,0,1),P(1,0,0),P(1,1,0),P(1,1,1),U(0,dw,y0,y1));
 if(!skip.includes('l'))S.q(k,P(0,0,0),P(0,0,1),P(0,1,1),P(0,1,0),U(0,dw,y0,y1));
 if(!skip.includes('t'))S.q(k,P(0,1,1),P(1,1,1),P(1,1,0),P(0,1,0),U(u0,u1,0,dw));
 if(!skip.includes('d'))S.q(k,P(0,0,0),P(1,0,0),P(1,0,1),P(0,0,1),U(u0,u1,0,dw));}
// ---------------------------------------------------------------- wall with true openings
// holes: {a,b,s,h,arch} (u range, sill, top; arch: semicircular head, spring = h - (b-a)/2)
function wall(S,k,F,u0,u1,y0,y1,holes){const ys=new Set([y0,y1]);for(const H of holes){ys.add(H.s);ys.add(H.arch?H.h-(H.b-H.a)/2:H.h);ys.add(H.h);}
 const Y=[...ys].filter(y=>y>=y0&&y<=y1).sort((a,b)=>a-b);const hs=[...holes].sort((p,q)=>p.a-q.a);
 for(let i=0;i<Y.length-1;i++){const ya=Y[i],yb=Y[i+1];if(yb-ya<1e-4)continue;let u=u0;
  for(const H of hs){const sp=H.arch?H.h-(H.b-H.a)/2:H.h;let st=null;if(H.s<=ya+1e-5&&yb<=sp+1e-5)st='hole';else if(H.arch&&sp<=ya+1e-5&&yb<=H.h+1e-5)st='arch';if(!st)continue;
   if(H.a>u)fq(S,k,F,u,H.a,ya,yb);
   if(st==='arch'){const r=(H.b-H.a)/2,cx=H.a+r,N=10;for(let j=0;j<N;j++){const t0=PI-j/N*PI,t1=PI-(j+1)/N*PI,x0=cx+Math.cos(t0)*r,x1=cx+Math.cos(t1)*r,a0=Math.min(yb,Math.max(ya,sp+Math.sin(t0)*r)),a1=Math.min(yb,Math.max(ya,sp+Math.sin(t1)*r));
     if(yb-Math.min(a0,a1)<1e-4)continue;const t=TILE[k];S.q(k,F.P(x0,a0,0),F.P(x1,a1,0),F.P(x1,yb,0),F.P(x0,yb,0),[[(x0+F.off)/t[0],a0/t[1]],[(x1+F.off)/t[0],a1/t[1]],[(x1+F.off)/t[0],yb/t[1]],[(x0+F.off)/t[0],yb/t[1]]]);}}
   u=H.b;}
  if(u<u1)fq(S,k,F,u,u1,ya,yb);}}
// reveals of one opening, depth D into the wall (key = wall material)
function reveal(S,k,F,H,D){const sp=H.arch?H.h-(H.b-H.a)/2:H.h,t=TILE[k];
 S.q(k,F.P(H.a,H.s,0),F.P(H.a,H.s,-D),F.P(H.a,sp,-D),F.P(H.a,sp,0),[[0,H.s/t[1]],[D/t[0],H.s/t[1]],[D/t[0],sp/t[1]],[0,sp/t[1]]]);
 S.q(k,F.P(H.b,H.s,-D),F.P(H.b,H.s,0),F.P(H.b,sp,0),F.P(H.b,sp,-D),[[0,H.s/t[1]],[D/t[0],H.s/t[1]],[D/t[0],sp/t[1]],[0,sp/t[1]]]);
 if(!H.arch)S.q(k,F.P(H.a,sp,0),F.P(H.a,sp,-D),F.P(H.b,sp,-D),F.P(H.b,sp,0),[[0,0],[D/t[0],0],[D/t[0],(H.b-H.a)/t[1]],[0,(H.b-H.a)/t[1]]]);
 else{const r=(H.b-H.a)/2,cx=H.a+r,N=10;for(let j=0;j<N;j++){const t0=PI-j/N*PI,t1=PI-(j+1)/N*PI,p0=[cx+Math.cos(t0)*r,sp+Math.sin(t0)*r],p1=[cx+Math.cos(t1)*r,sp+Math.sin(t1)*r];
  S.q(k,F.P(p0[0],p0[1],0),F.P(p0[0],p0[1],-D),F.P(p1[0],p1[1],-D),F.P(p1[0],p1[1],0),[[0,j*.1],[D,j*.1],[D,(j+1)*.1],[0,(j+1)*.1]]);}}
 // sill floor of the reveal
 S.q(k,F.P(H.a,H.s,0),F.P(H.b,H.s,0),F.P(H.b,H.s,-D),F.P(H.a,H.s,-D),[[0,0],[(H.b-H.a)/t[0],0],[(H.b-H.a)/t[0],D/t[1]],[0,D/t[1]]]);}
// sash window inside an opening: frame, two sashes (meeting rail), glass with one interior cell, optional blind/AC
function sash(S,F,H,R,fk,lod){const D=.14,sp=H.arch?H.h-(H.b-H.a)/2:H.h,a=H.a,b=H.b,ft=.06,cell=R()*6|0,mir=R()<.5;
 const cu=(cell%3)/3,cv=(cell/3|0)/2,uvG=(x,y)=>{let s=(x-a)/(b-a);if(mir)s=1-s;return[cu+s/3,cv+(y-H.s)/(H.h-H.s)/2];};
 // glass (rect part + arch fan)
 S.q('m145gl',F.P(a,H.s,-D),F.P(b,H.s,-D),F.P(b,sp,-D),F.P(a,sp,-D),[uvG(a,H.s),uvG(b,H.s),uvG(b,sp),uvG(a,sp)]);
 if(H.arch){const r=(b-a)/2,cx=a+r,N=10;for(let j=0;j<N;j++){const t0=j/N*PI,t1=(j+1)/N*PI,p0=[cx+Math.cos(t0)*r,sp+Math.sin(t0)*r],p1=[cx+Math.cos(t1)*r,sp+Math.sin(t1)*r];
  S.tri('m145gl',F.P(cx,sp,-D),F.P(p0[0],p0[1],-D),F.P(p1[0],p1[1],-D),uvG(cx,sp),uvG(...p0),uvG(...p1));
  if(!lod)S.tube(fk,F.P(p0[0],p0[1],-D+.02),F.P(p1[0],p1[1],-D+.02),.03,4);}}
 if(lod)return;
 // frame: jambs, head, sill rail (boxes proud of the glass), meeting rail at mid height of the rect part
 fbox(S,fk,F,a,a+ft,H.s,sp,-D-.02,-D+.05,false,'b');fbox(S,fk,F,b-ft,b,H.s,sp,-D-.02,-D+.05,false,'b');
 if(!H.arch)fbox(S,fk,F,a,b,sp-ft,sp,-D-.02,-D+.05,false,'b');
 fbox(S,fk,F,a,b,H.s,H.s+ft*1.4,-D-.02,-D+.06,false,'b');
 const mr=H.s+(sp-H.s)*(H.arch?.5:.52);fbox(S,fk,F,a+ft,b-ft,mr-.035,mr+.035,-D-.01,-D+.07,false,'b');
 // stiles of the lower sash (thin) -> double-hung read
 fbox(S,fk,F,a+ft,a+ft+.035,H.s,mr,-D,-D+.04,false,'b');fbox(S,fk,F,b-ft-.035,b-ft,H.s,mr,-D,-D+.04,false,'b');}
function acUnit(S,F,H){const c=(H.a+H.b)/2,w=Math.min(.66,(H.b-H.a)-.1),y=H.s+.02;
 fbox(S,'m145acs',F,c-w/2,c+w/2,y,y+.42,-.12,.32,false,'f');fq(S,'m145ac',F,c-w/2,c+w/2,y,y+.42,.32,[[0,0],[1,0],[1,1],[0,1]]);
 // accordion side panels
 fbox(S,'m145acs',F,H.a+.04,c-w/2,y+.05,y+.4,-.13,-.11,true);fbox(S,'m145acs',F,c+w/2,H.b-.04,y+.05,y+.4,-.13,-.11,true);
 // support bracket
 S.tube('m145ir',F.P(c-w/2+.05,y-.35,0),F.P(c-w/2+.05,y,.28),.012,4);S.tube('m145ir',F.P(c+w/2-.05,y-.35,0),F.P(c+w/2-.05,y,.28),.012,4);}
// ---------------------------------------------------------------- fire escape (one stack on a face)
// u0..u1 platform length, levels = platform floor heights (bottom first), depth .9 m; stairs alternate; drop ladder below
function fireEscape(S,F,u0,u1,levels,lod,wallW=0){const Dp=.92,w0=wallW+.02,w1=w0+Dp,rh=1.0,n=lod?4:4;
 levels.forEach((y,i)=>{
  // grating + perimeter angle
  S.q('m145gr',F.P(u0,y,w0),F.P(u1,y,w0),F.P(u1,y,w1),F.P(u0,y,w1),[[0,0],[(u1-u0)/.3,0],[(u1-u0)/.3,Dp/.3],[0,Dp/.3]]);
  fbox(S,'m145ir',F,u0,u1,y-.06,y,w1-.04,w1);fbox(S,'m145ir',F,u0,u0+.04,y-.06,y,w0,w1);fbox(S,'m145ir',F,u1-.04,u1,y-.06,y,w0,w1);
  // rail: top + mid, posts, balusters
  S.tube('m145ir',F.P(u0,y+rh,w1-.02),F.P(u1,y+rh,w1-.02),.028,n);S.tube('m145ir',F.P(u0,y+rh*.5,w1-.02),F.P(u1,y+rh*.5,w1-.02),.02,n);fbox(S,'m145ir',F,u0,u1,y,y+.12,w1-.03,w1);
  for(const u of[u0+.02,u1-.02]){S.tube('m145ir',F.P(u,y,w1-.02),F.P(u,y+rh,w1-.02),.018,n);S.tube('m145ir',F.P(u,y+rh,w1-.02),F.P(u,y+rh,w0+.02),.016,n);S.tube('m145ir',F.P(u,y,w0+.02),F.P(u,y+rh,w0+.02),.014,n);}
  if(!lod){const nb=Math.floor((u1-u0)/.13);for(let j=1;j<nb;j++){const u=u0+j*(u1-u0)/nb;S.tube('m145ir',F.P(u,y,w1-.02),F.P(u,y+rh,w1-.02),.009,3);}
   for(let j=1;j<6;j++){const w=w0+j*Dp/6;for(const u of[u0+.02,u1-.02])S.tube('m145ir',F.P(u,y,w),F.P(u,y+rh,w),.007,3);}}
  // brackets under the platform
  for(const u of[u0+.15,(u0+u1)/2,u1-.15])S.tube('m145ir',F.P(u,y-.7,wallW),F.P(u,y-.04,w1-.05),.016,n);
  // stair to the next level, inside the platform depth, alternating ends
  if(i<levels.length-1){const y2=levels[i+1],L=Math.min(2.6,(u1-u0)*.62),dir=i%2?-1:1,ua=dir>0?u0+.35:u1-.35,ub=ua+dir*L,wa=w0+.12,wb=w0+.62;
   for(const w of[wa,wb])S.tube('m145ir',F.P(ua,y+.02,w),F.P(ub,y2-.02,w),.035,n);
   const nt=Math.round((y2-y)/.24);for(let j=1;j<nt;j++){const t=j/nt,u=ua+(ub-ua)*t,yy=y+(y2-y)*t;fbox(S,'m145ir',F,Math.min(u,u+dir*.18),Math.max(u,u+dir*.18),yy-.025,yy,wa,wb,false,'b');}
   S.tube('m145ir',F.P(ua,y+.9,wb+.05),F.P(ub,y2+.9,wb+.05),.02,n);
   // hatch opening cut is implied: the upper platform grating keeps going (PS1 read)
  }});
 // drop ladder from the lowest platform
 const y=levels[0],ul=u1-.6;for(const du of[0,.42])S.tube('m145ir',F.P(ul+du,y-2.6,w1-.15),F.P(ul+du,y+1.1,w1-.15),.016,n);
 for(let j=0;j<14;j++){const yy=y-2.5+j*.28;S.tube('m145ir',F.P(ul,yy,w1-.15),F.P(ul+.42,yy,w1-.15),.009,3);}}
// ---------------------------------------------------------------- cornice: frieze, bed moulding, modillions, corona, crown
function cornice(S,F,u0,u1,y,k,proj,lod,ends=[true,true]){const e0=ends[0]?proj:0,e1=ends[1]?proj:0;
 fbox(S,k,F,u0-e0*.2,u1+e1*.2,y,y+.18,0,proj*.22,false,'b');
 fbox(S,k,F,u0-e0*.5,u1+e1*.5,y+.18,y+.36,0,proj*.45,false,'b');
 if(!lod){const N=Math.floor((u1-u0)/.55);for(let i=0;i<=N;i++){const u=u0+.1+i*(u1-u0-.2)/N;fbox(S,k,F,u-.06,u+.06,y+.36,y+.62,proj*.45,proj*.92,false,'b');}}
 fbox(S,k,F,u0-e0,u1+e1,y+.62,y+.86,0,proj,false,'b');
 fbox(S,k,F,u0-e0*1.05,u1+e1*1.05,y+.86,y+.98,0,proj*1.06,false,'b');}
// band (stringcourse)
function band(S,F,u0,u1,y,h,proj,k='m145li'){fbox(S,k,F,u0,u1,y,y+h,0,proj,false,'b');}
// ---------------------------------------------------------------- generic facade
// cfg: {u0,u1,wall,ground:{h,fn(S,F)},floors:[[y0,y1,sill,head]],bays:[{c,w,arch?:Set(floor idx),skip?:Set,tri?:Set}],frame,ac,R,lod,D}
function facade(S,F,cfg){const {u0,u1,wall:k,floors,bays,R,lod}=cfg,D=cfg.D||.32;
 floors.forEach(([y0,y1,s,h],fi)=>{const holes=[];
  for(const B of bays){if(B.skip&&B.skip.has(fi))continue;const arch=!!(B.arch&&B.arch.has(fi)),tri=!!(B.tri&&B.tri.has(fi));
   if(tri){const w=B.tw||2.6,g=.14,wc=(w-2*g)/3;for(let j=0;j<3;j++){const a=B.c-w/2+j*(wc+g);holes.push({a,b:a+wc,s,h:h-(arch?0:0),arch:false,tri:true});}}
   else{const hh=arch?h+(B.w/2)*.55:h;holes.push({a:B.c-B.w/2,b:B.c+B.w/2,s,h:hh,arch});}}
  wall(S,k,F,u0,u1,y0,y1,holes);
  for(const H of holes){if(!lod)reveal(S,k,F,H,D);sash(S,F,H,R,cfg.frame||'m145wp',lod);
   if(!lod){// sill stone + lintel/keystone
    fbox(S,'m145li',F,H.a-.07,H.b+.07,H.s-.09,H.s,-.02,.07,false,'b');
    if(cfg.lintel&&!H.arch)fbox(S,'m145li',F,H.a-.08,H.b+.08,H.h,H.h+.26,-.02,.035,false,'b');
    if(cfg.key&&!H.arch)fbox(S,'m145li',F,(H.a+H.b)/2-.09,(H.a+H.b)/2+.09,H.h-.02,H.h+.3,-.02,.06,false,'b');
    if(H.arch&&cfg.voussoir){const r=(H.b-H.a)/2,cx=H.a+r,sp=H.h-r,N=9;for(let j=0;j<N;j++){const t0=PI-j/N*PI,t1=PI-(j+1)/N*PI,q=(t,rr)=>[cx+Math.cos(t)*rr,sp+Math.sin(t)*rr];
      const p=[q(t0,r),q(t1,r),q(t1,r+.22),q(t0,r+.22)];S.q(cfg.voussoir,F.P(p[0][0],p[0][1],.03),F.P(p[1][0],p[1][1],.03),F.P(p[2][0],p[2][1],.03),F.P(p[3][0],p[3][1],.03),[[j*.1,0],[(j+1)*.1,0],[(j+1)*.1,.2],[j*.1,.2]]);}}
    if(cfg.ac&&!H.arch&&!H.tri&&R()<cfg.ac)acUnit(S,F,H);}}
 });}
// ---------------------------------------------------------------- ground floor shop bays (recessed shopfront panels between piers)
function shops(S,F,u0,u1,h,key,pier,R,lod,fascia=null){const n=Math.max(1,Math.round((u1-u0)/6.2)),w=(u1-u0)/n;
 for(let i=0;i<n;i++){const a=u0+i*w,b=a+w,m=R()<.5;
  fbox(S,pier,F,a,a+.45,0,h,-.02,.12);   // pier
  const kk=Array.isArray(key)?key[i%key.length]:key,sa=a+.45,sb=b-(i===n-1?.45:0);fq(S,kk,F,sa,sb,0,h-.15,-.2,m?[[1,0],[0,0],[0,1],[1,1]]:[[0,0],[1,0],[1,1],[0,1]]);
  if(!lod){fbox(S,pier,F,sa,sb,h-.15,h,-.2,0,false,'b');fbox(S,pier,F,sa,sa+.02,0,h,-.2,0,false,'b');}
  if(fascia)fbox(S,fascia,F,sa,sb,h-.75,h-.2,-.2,-.05,true);}
 fbox(S,pier,F,u1-.45,u1,0,h,-.02,.12);}
// ================================================================= the three buildings
function redBuilding(S,b,lod,R){// local: front z = +10 facing +z, x -24.5..24.5, back z = -10
 const W=49,Dd=20,X0=-24.5,X1=24.5,G=4.4,FH=3.6,NF=6,TOP=G+NF*FH,F=face([0,10],[0,1]);
 const floors=[];for(let i=0;i<NF;i++){const y=G+i*FH;floors.push([y,y+FH,y+.85,y+.85+2.0]);}
 // window pairs: module 6.2 m (pier 2.6, W 1.2, gap 1.2, W 1.2); east end module carries the fire escape and the arched pair
 const bays=[];const mod=6.1,n=8,u0=X0+(W-n*mod)/2;
 for(let i=0;i<n;i++){const m=u0+i*mod+mod/2;for(const dx of[-1.15,1.15])bays.push({c:m+dx,w:1.2,arch:i===n-1?new Set([2]):null});}
 facade(S,F,{u0:X0,u1:X1,wall:'m145rb',floors,bays,R,lod,frame:'m145wp',ac:.12,lintel:false});
 // sill bands under floor 1 and the top floor, cornice
 band(S,F,X0,X1,G-.05,.3,.12);band(S,F,X0,X1,G+5*FH+.6,.2,.08);
 cornice(S,F,X0,X1,TOP,'m145cr',.85,lod);
 shops(S,F,X0,X1,G,'m145sb','m145ir',R,lod,'m145wp');
 // fire escape on the two east bays (floors 1..6)
 const fe=u0+(n-1)*mod+mod/2;fireEscape(S,F,fe-2.1,fe+2.1,floors.map(f=>f[2]-.85),lod);
 // the other faces: east (toward the light-well), west, back — simpler windows, no shops
 const sides=[[face([X1,0],[1,0]),-Dd/2,Dd/2],[face([X0,0],[-1,0]),-Dd/2,Dd/2],[face([0,-Dd/2],[0,-1]),X0,X1]];
 for(const[Fs,a,c]of sides){const L=c-a,nb=Math.floor(L/3.2),bs=[];for(let i=0;i<nb;i++)bs.push({c:a+(i+.5)*L/nb,w:1.1});
  facade(S,Fs,{u0:a,u1:c,wall:'m145rb',floors,bays:bs,R,lod:true,frame:'m145wp'});fq(S,'m145rb',Fs,a,c,0,G);fq(S,'m145rb',Fs,a,c,TOP,TOP+1);}
 // parapet + roof + bulkhead
 fq(S,'m145rb',F,X0,X1,TOP,TOP+1.0);
 S.q('m145rf',[X0,TOP+.4,9.7],[X1,TOP+.4,9.7],[X1,TOP+.4,-9.7],[X0,TOP+.4,-9.7],[[X0/3,9.7/3],[X1/3,9.7/3],[X1/3,-9.7/3],[X0/3,-9.7/3]]);
 const RF=face([0,-3],[0,1]);fbox(S,'m145rb',RF,8,13,TOP,TOP+3.4,-4,0,false,'d');fbox(S,'m145cr',RF,7.8,13.2,TOP+3.4,TOP+3.6,-4.2,.2,false,'d');
 b.solid(0,0,W,Dd);}
function beigeBuilding(S,b,lod,R){// local: front z = +9 facing +z, x -18..18
 const W=36,Dd=18,X0=-18,X1=18,G=4.4,FH=3.85,NF=5,TOP=G+NF*FH,F=face([0,9],[0,1]);
 const floors=[];for(let i=0;i<NF;i++){const y=G+i*FH;floors.push([y,y+FH,y+.9,y+.9+2.15]);}
 // photo bay map (fractions of the width, left -> right): pair, pavilion L (tri + arched pair top), FE bays, central pier
 // (single arches top), FE bays, pavilion R, end bay
 const f=x=>X0+x*W,TOPF=new Set([4]),MID=new Set([1,2,3]);
 const bays=[{c:f(.05),w:1.15},{c:f(.115),w:1.15},
  {c:f(.235)-.72,w:1,arch:TOPF,skip:MID},{c:f(.235)+.72,w:1,arch:TOPF,skip:MID},{c:f(.235),w:1,tri:MID,tw:2.9,skip:new Set([0])},
  {c:f(.36),w:1.15},{c:f(.445),w:1.15},{c:f(.505),w:1.15,skip:new Set([4])},
  {c:f(.57),w:1.1,arch:TOPF},
  {c:f(.645),w:1.15},{c:f(.725),w:1.15},{c:f(.79),w:1.15,skip:new Set([4])},
  {c:f(.895)-.72,w:1,arch:TOPF,skip:MID},{c:f(.895)+.72,w:1,arch:TOPF,skip:MID},{c:f(.895),w:1,tri:MID,tw:2.9,skip:new Set([0])},
  {c:f(.975),w:.75}];
 // walls: banded rustication up to the floor-2 sill, buff brick above (split the facade by material at y = G + 2*FH)
 const RB=G+2*FH;const split=(fl,lo,hi)=>fl.map(([a,c,s,h])=>[Math.max(a,lo),Math.min(c,hi),s,h]).filter(q=>q[1]>q[0]);
 const fl0=floors.slice(0,2),fl1=floors.slice(2);
 facade(S,F,{u0:X0,u1:X1,wall:'m145ru',floors:fl0,bays,R,lod,frame:'m145ir',ac:.18,key:true});
 facade(S,F,{u0:X0,u1:X1,wall:'m145bf',floors:fl1.map(q=>q),bays:bays.map(B=>({...B,arch:B.arch?new Set([...B.arch].map(i=>i-2)):null,skip:B.skip?new Set([...B.skip].map(i=>i-2)):null,tri:B.tri?new Set([...B.tri].map(i=>i-2)):null})),R,lod,frame:'m145ir',ac:.22,lintel:true});
 // pavilion projections: shallow piers framing the two pavilions + quoins
 for(const p of[.235,.895]){const c=f(p);fbox(S,'m145li',F,c-1.75,c-1.5,G,TOP,0,.18);fbox(S,'m145li',F,c+1.5,c+1.75,G,TOP,0,.18);}
 band(S,F,X0,X1,G-.1,.4,.18);band(S,F,X0,X1,RB-.05,.25,.12);band(S,F,X0,X1,G+4*FH+.2,.18,.08);
 for(let i=2;i<NF;i++){const y=G+i*FH;band(S,F,X0,X1,y+.9-.2,.12,.05);band(S,F,X0,X1,y+.9+2.15+.28,.14,.05);}
 // base storey: rusticated wall + entrance + shop windows
 const gh=[{a:f(.03),b:f(.14),s:.6,h:3.2},{a:f(.32),b:f(.52),s:.6,h:3.2},{a:f(.64),b:f(.8),s:.6,h:3.2},{a:f(.92),b:f(.99),s:.6,h:3.2}];
 const door={a:f(.545),b:f(.6),s:0,h:3.4};wall(S,'m145ru',F,X0,X1,0,G-.1,[...gh,door]);
 for(const H of gh){reveal(S,'m145ru',F,H,.3);fq(S,'m145sb',F,H.a,H.b,H.s,H.h,-.3,[[.1,0],[.45,0],[.45,1],[.1,1]]);}
 reveal(S,'m145ru',F,door,.4);fq(S,'m145en',F,door.a,door.b,0,door.h,-.4,[[.14,.08],[.86,.08],[.86,.82],[.14,.82]]);
 cornice(S,F,X0,X1,TOP,'m145cy',.95,lod);fbox(S,'m145bf',F,X0,X1,TOP+.98,TOP+1.5,-.3,0,false,'b');
 if(!lod){const N=Math.floor(W/.3);for(let i=0;i<N;i++){const u=X0+.15+i*W/N;fbox(S,'m145cy',F,u-.05,u+.05,TOP-.2,TOP,0,.1,false,'b');}}   // dentils
 // two fire escapes on the recessed bays
 const lv=floors.map(q=>q[2]-.9);fireEscape(S,F,f(.33),f(.48),lv,lod);fireEscape(S,F,f(.62),f(.75),lv,lod);
 const sides=[[face([X1,0],[1,0]),-Dd/2,Dd/2],[face([X0,0],[-1,0]),-Dd/2,Dd/2],[face([0,-Dd/2],[0,-1]),X0,X1]];
 for(const[Fs,a,c]of sides){const L=c-a,nb=Math.floor(L/3.2),bs=[];for(let i=0;i<nb;i++)bs.push({c:a+(i+.5)*L/nb,w:1.1});
  facade(S,Fs,{u0:a,u1:c,wall:'m145bf',floors,bays:bs,R,lod:true,frame:'m145ir'});fq(S,'m145ru',Fs,a,c,0,G);fq(S,'m145bf',Fs,a,c,TOP,TOP+1.5);}
 S.q('m145rf',[X0,TOP+.5,8.7],[X1,TOP+.5,8.7],[X1,TOP+.5,-8.7],[X0,TOP+.5,-8.7],[[X0/3,3],[X1/3,3],[X1/3,-3],[X0/3,-3]]);
 // roof penthouses (stucco): the big one left of centre, a small stair bulkhead, louvres
 const RF=face([0,0],[0,1]);fbox(S,'m145st',RF,-15,1,TOP+.5,TOP+4.4,-3,6.6,false,'d');fbox(S,'m145cy',RF,-15.2,1.2,TOP+4.4,TOP+4.62,-3.2,6.8,false,'d');
 fbox(S,'m145st',RF,-9,-3,TOP+4.4,TOP+6.6,-1,4,false,'d');fbox(S,'m145cy',RF,-9.15,-2.85,TOP+6.6,TOP+6.78,-1.15,4.15,false,'d');
 fbox(S,'m145st',RF,5,9,TOP+.5,TOP+3.4,1,5.6,false,'d');fbox(S,'m145cy',RF,4.8,9.2,TOP+3.4,TOP+3.6,.8,5.8,false,'d');
 for(const[u0,u1,y0,y1]of[[-13,-11,TOP+1.6,TOP+3.4],[-1.5,.3,TOP+1.2,TOP+3.4],[-8,-6.4,TOP+5,TOP+6.2],[6,7.2,TOP+.5,TOP+2.6]])fq(S,'m145ir',face([0,u0>4?5.6:u0>-9&&y0>TOP+4?4:6.6],[0,1]),u0,u1,y0,y1,.01);
 b.solid(0,0,W,Dd);}
function brownBuilding(S,b,lod,R){// local: corner at (0,0); north face z = 0 (x 0..41), west face x = 0 (z 0..-60)
 const G=4.4,FH=3.6,NF=6,TOP=G+NF*FH,LN=41,LW=60,DN=18,DW=18;
 const floors=[];for(let i=0;i<NF;i++){const y=G+i*FH;floors.push([y,y+FH,y+.8,y+.8+1.95]);}
 const ARCH=new Set([0,4]);
 const mk=(L,st=0)=>{const nb=Math.floor(L/2.85),bs=[];for(let i=0;i<nb;i++)bs.push({c:st+(i+.5)*L/nb,w:1.1,arch:ARCH});return bs;};
 const FN=face([0,0],[0,1]),FW=face([0,0],[-1,0]);   // FW: u runs +z, so the west face spans u -60..0
 facade(S,FN,{u0:0,u1:LN,wall:'m145bb',floors,bays:mk(LN),R,lod,frame:'m145wp',ac:.25,voussoir:'m145bb'});
 facade(S,FW,{u0:-LW,u1:0,wall:'m145bb',floors,bays:mk(LW,-LW),R,lod,frame:'m145wp',ac:.25,voussoir:'m145bb'});
 for(const[Fx,a,c]of[[FN,0,LN],[FW,-LW,0]]){band(S,Fx,a,c,G-.1,.35,.14,'m145li');band(S,Fx,a,c,G+FH-.25,.22,.1,'m145li');band(S,Fx,a,c,G+4*FH-.25,.22,.1,'m145li');
  cornice(S,Fx,a,c,TOP,'m145cb',1.1,lod);
  shops(S,Fx,a,c,G,'m145sg','m145bb',R,lod);
  fbox(S,'m145bb',Fx,a,c,TOP+.98,TOP+1.6,-.3,0,false,'b');}
 // corner quoin pier
 fbox(S,'m145li',FN,-.02,.6,G,TOP,0,.08);
 // fire escapes: west face near the corner, north face middle
 const lv=floors.map(q=>q[2]-.8);fireEscape(S,FW,-10.5,-6,lv,lod);fireEscape(S,FN,17,21.5,lv,lod);fireEscape(S,FW,-38,-33.5,lv,lod);
 // inner faces of the L + ends
 const sides=[[face([LN,-DN/2],[1,0]),-DN/2,DN/2],[face([0,-LW],[0,-1]),-DW,0],[face([DW+(LN-DW)/2,-DN],[0,-1]),-(LN-DW)/2,(LN-DW)/2],[face([DW,-DN-(LW-DN)/2],[1,0]),-(LW-DN)/2,(LW-DN)/2]];
 for(const[Fs,a,c]of sides){const L=c-a,nb=Math.floor(L/3.2),bs=[];for(let i=0;i<nb;i++)bs.push({c:a+(i+.5)*L/nb,w:1.1});
  facade(S,Fs,{u0:a,u1:c,wall:'m145bb',floors,bays:bs,R,lod:true,frame:'m145wp'});fq(S,'m145bb',Fs,a,c,0,G);fq(S,'m145bb',Fs,a,c,TOP,TOP+1.6);}
 const y=TOP+.5;S.q('m145rf',[0,y,0],[LN,y,0],[LN,y,-DN],[0,y,-DN],[[0,0],[LN/3,0],[LN/3,-DN/3],[0,-DN/3]]);S.q('m145rf',[0,y,-DN],[DW,y,-DN],[DW,y,-LW],[0,y,-LW],[[0,0],[DW/3,0],[DW/3,-LW/3],[0,-LW/3]]);
 const RF=face([0,0],[0,1]);fbox(S,'m145bb',RF,4,9,TOP+.5,TOP+3.6,-12,-8,false,'d');fbox(S,'m145cb',RF,3.8,9.2,TOP+3.6,TOP+3.8,-12.2,-7.8,false,'d');
 b.solid(LN/2,-DN/2,LN,DN);b.solid(DW/2,-LW/2,DW,LW);}
const BUILD={red:redBuilding,beige:beigeBuilding,brown:brownBuilding};
export function* maltose145BldgTask(b,spec,lod){addMats(b.mats);const S=new Soup();let s=urbanHash(spec.seed|0,145,0x145b)>>>0;const R=()=>((s=(s*1664525+1013904223)>>>0)/4294967296);
 BUILD[spec.malt145b](S,b,lod,R);yield;S.flush(b);yield;}
// V145 M3: helpers shared with maltose145-far.js
export {Soup,face,fq,fbox,wall,reveal,sash,acUnit,fireEscape,cornice,band,facade,shops,TILE,addMats,tex};
