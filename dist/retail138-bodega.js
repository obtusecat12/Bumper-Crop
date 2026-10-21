// V138-retail-interiors R3: American liquor & smoke shop / bodega module library + a provisional fill (R4 = Layout A/B).
// Same conventions as retail138-market.js: every module builds in its own frame (b.push), back / wall at local z = 0,
// customers on +z, length along x, floor y = 0, colliders included.
// Real geometry: back-bar bottles are lathed (7 sides) and wear the Tiki bar's 64 generated labels (re-packed into
// assets/l11-v138/labels.webp), hookahs are lathed glass + brass, cooler doors / showcases / humidor / bullet-resistant
// cashier booth are framed boxes with see-through glazing. Fake goods (behind glass, out of reach): photo strips from
// tools/retail138_r3_assets.py — beer cave cases, cigarette power wall, vapes, glass pipes, rolling papers, cigar boxes,
// scratch-off dispenser, top-row liquor. Neon signs are emissive tube cells (neon.webp, 8 signs) + coloured tube strips.
import * as T from './vendor/three.module.min.js';
import {URBAN_TILE_SIZE} from './urban-materials.js?v=60';
import {addRetail138Market,gondola138,endcap138,impulse138,GOODS138} from './retail138-market.js?v=140e';
import {caveShelf140,caveFloor140,BEER140,cigWall140,lottoDisp140,vapeShelf140,pipes140,papers140,cigarShelves140,hookah140} from './retail140-bodega.js?v=140d'; // V140 P1c real-shape smoke-shop props
import {addGlass140,glassPane140,GLASS140} from './retail140-glass.js?v=140e'; // V140 P2 physical beer-cave glass
const R140=!(typeof location!=='undefined'&&/[?&]r140=0\b/.test(location.search));
const A=new URL('./assets/l11-v138/',import.meta.url).href,V='138c',PI=Math.PI;
function tex(name,rep=false){const t=new T.TextureLoader().load(A+name+'.webp?v='+V);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=rep?T.RepeatWrapping:T.ClampToEdgeWrapping;t.anisotropy=4;t.magFilter=T.NearestFilter;return t;}
function glowM(name,glow,o={}){const m=tex(name,o.rep);return new T.MeshStandardMaterial({map:m,emissive:0xffffff,emissiveMap:m,emissiveIntensity:glow,roughness:o.rough??.7,vertexColors:true,...(o.side?{side:o.side}:{})});}
const col=(c,o={})=>new T.MeshStandardMaterial({color:c,roughness:o.r??.6,metalness:o.m??0,vertexColors:true,...(o.e?{emissive:o.e,emissiveIntensity:o.ei??1}:{}),...(o.t?{transparent:true,opacity:o.t,depthWrite:false}:{})});
export const NEON138={open:0,coldBeer:1,lotto:2,cerveza:3,atm:4,cigars:5,vape:6,hrs24:7};
export function addRetail138Bodega(m){
 addRetail138Market(m);if(m.r138oak)return m;
 m.r138oak=glowM('oak',.14,{rep:true,rough:.55});m.r138beer=glowM('beer',.45);m.r138cig=glowM('cigwall',.32);m.r138vape=glowM('vape',.5);
 m.r138pipes=glowM('glass',.45,{rough:.2});m.r138papers=glowM('papers',.3);m.r138cigars=glowM('cigars',.38);m.r138lotto=glowM('lotto',.35);
 m.r138liquor=glowM('liquor',.34);m.r138labels=glowM('labels',.3,{rough:.5});
 m.r138neon=glowM('neon',2.2,{side:T.DoubleSide});m.r138neon.emissiveIntensity=2.2;
 const fog=tex('fog');m.r138fog=new T.MeshStandardMaterial({map:fog,color:0xe8eef0,transparent:true,depthWrite:false,roughness:.3,emissive:0x8fa6ae,emissiveIntensity:.25,vertexColors:true});
 m.r138lexan=col(0xc9d8d4,{r:.05,m:.2,t:.13});m.r138glassTop=col(0xb6cfc9,{r:.04,m:.3,t:.18});
 m.r138brass=col(0xb08a3e,{r:.35,m:.8});m.r138plate=col(0x8d9193,{r:.38,m:.75});m.r138bar=col(0x2c2f31,{r:.5,m:.6});
 m.r138amberG=col(0x7a3d0e,{r:.12,m:.3,e:0x2a1003,ei:.5});m.r138greenG=col(0x1f4a24,{r:.12,m:.3,e:0x061a08,ei:.5});
 m.r138clearG=col(0xc9d6d2,{r:.08,m:.35,e:0x3a4a48,ei:.4});m.r138blueG=col(0x1b3f72,{r:.1,m:.3,e:0x061430,ei:.5});
 m.r138purpleG=col(0x5b2a78,{r:.1,m:.3,e:0x200a2e,ei:.6});m.r138cap=col(0x1a1a1a,{r:.4,m:.4});m.r138capG=col(0xc9a24a,{r:.3,m:.8});
 m.r138ledW=col(0xffffff,{e:0xf6fbff,ei:1.6});m.r138ledA=col(0xffe2a8,{e:0xffc070,ei:1.3});
 m.r138tubeP=col(0xff3a9a,{e:0xff2a8c,ei:2.4});m.r138tubeB=col(0x40b8ff,{e:0x2aa0ff,ei:2.4});m.r138tubeG=col(0x52ff6a,{e:0x2aff4a,ei:2.2});
 m.r138speaker=col(0x111111,{r:.9});
 Object.assign(URBAN_TILE_SIZE,{r138oak:1.0});
 return m;
}
function rng(seed){let s=(seed>>>0)||1;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return((s>>>0)%100000)/100000;};}
function uvPlane(b,key,u0,v0,u1,v1,x,y,z,w,h,ry=0,rx=0){const g=new T.PlaneGeometry(w,h),uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,u0+(u1-u0)*uv.getX(i),v0+(v1-v0)*uv.getY(i));b.add(g,key,x,y,z,1,1,1,ry,rx);g.dispose();}
/** horizontal band k of n of a texture, random u window of width uw (fraction) */
function band(b,r,key,k,n,uw,x,y,z,w,h,ry=0,rx=0){const u0=r()*(1-Math.min(1,uw));uvPlane(b,key,u0,1-(k+1)/n+.002,u0+Math.min(1,uw),1-k/n-.002,x,y,z,w,h,ry,rx);}
// ---- bottles (lathe, 7 sides) wearing a Tiki label cell ----
const PROF=[[[.04,0],[.045,.01],[.045,.2],[.03,.24],[.015,.27],[.015,.32]],[[.035,0],[.04,.01],[.042,.22],[.02,.27],[.014,.3],[.014,.36]],
 [[.05,0],[.055,.01],[.055,.17],[.042,.2],[.017,.23],[.016,.28]],[[.055,0],[.058,.02],[.056,.12],[.045,.16],[.02,.2],[.018,.25]],
 [[.03,0],[.034,.01],[.034,.16],[.022,.19],[.012,.21],[.012,.25]],[[.042,0],[.05,.03],[.05,.24],[.04,.27],[.018,.3],[.016,.38]]];
const GLASS=['r138amberG','r138amberG','r138clearG','r138greenG','r138amberG','r138clearG','r138blueG','r138amberG'];
const latheCache=new Map();
function latheG(pi,s){const k=pi+':'+s.toFixed(2);if(!latheCache.has(k))latheCache.set(k,new T.LatheGeometry(PROF[pi].map(([x,y])=>new T.Vector2(x*s,y*s)),7));return latheCache.get(k);}
function bottle(b,r,x,y,z,s=1,face=0){
 const pi=(r()*PROF.length)|0,p=PROF[pi],g=latheG(pi,s),gl=GLASS[(r()*GLASS.length)|0],h=p.at(-1)[1]*s,cell=(r()*64)|0;
 b.add(g,gl,x,y,z,1,1,1,face);
 const lr=p[2][0]*s+.002,lh=Math.min(p[2][1]-p[1][1],.14)*s,ly=y+(p[1][1]*s)+lh*.55,lg=new T.CylinderGeometry(lr,lr,lh,7,1,true,-1.15,2.3),uv=lg.attributes.uv,cu=(cell%8)/8,cv=1-((cell>>3)+1)/8;
 for(let i=0;i<uv.count;i++)uv.setXY(i,cu+.012+uv.getX(i)*.101,cv+.015+uv.getY(i)*.095);
 b.add(lg,'r138labels',x,ly,z,1,1,1,face);lg.dispose();
 b.cylinder(r()<.6?'r138cap':'r138capG',x,y+h+.012,z,p.at(-1)[0]*s+.002,p.at(-1)[0]*s+.002,.025,6);
 return p[2][0]*s*2+.012;
}
// ---- 15. liquor wall: oak back-bar to the ceiling, backlit glass shelves; lower rows real bottles, top rows photo ----
export function liquorWall138(b,seed,{len,C=3.15,y0=1.05,depth=.34}){
 const r=rng(seed),bays=Math.max(1,Math.round(len/1.0)),bl=len/bays,top=C-.02;
 b.box('r138oak',0,top/2,.01,len,top,.02);// back panel (lit from behind the shelves)
 for(let i=0;i<=bays;i++)b.box('r138oak',-len/2+i*bl,top/2,depth/2,.05,top,depth);
 b.box('r138oak',0,top-.12,depth/2+.01,len+.05,.24,depth+.02);b.box('r138oak',0,y0/2,depth/2,len,y0,depth);// crown + base cabinet
 for(let i=0;i<bays;i++)b.box('r138dark',-len/2+(i+.5)*bl,y0/2,depth+.002,bl-.08,y0-.1,.004);// cabinet doors (dark inset)
 const rows=[],pitch=.42;for(let y=y0+.03;y<top-.5;y+=pitch)rows.push(y);
 rows.forEach((y,ri)=>{
  b.box('r138glassTop',0,y,depth/2,len-.04,.012,depth-.02);b.box('r138ledW',0,y-.012,depth-.03,len-.06,.008,.01);// glass shelf + LED nose strip
  b.box('r138ledA',0,y+pitch-.06,.03,len-.08,.01,.012);// backlight bar
  for(let i=0;i<bays;i++){const a=-len/2+i*bl+.04,c=a+bl-.08;
   if(ri<3){let x=a+.03;const s=.95+r()*.12;while(x<c-.04){if(r()<.08){x+=.08;continue;}const zz=depth*.55+(r()-.5)*.04;x+=bottle(b,r,x,y+.006,zz,s*(ri===0?1.08:1))/2;x+=.035+r()*.015;}}
   else if(R140){let x=a+.03;const s=1.1+r()*.15;while(x<c-.05){const zz=depth*.55+(r()-.5)*.04;x+=bottle(b,r,x,y+.006,zz,s)/2;x+=.03+r()*.015;}}// V140: real bottles to the top
   else band(b,r,'r138liquor',(ri+i)%2,2,(bl/len)*.5+.15,(a+c)/2,y+.17,depth*.55,c-a,.34);}
 });
 b.solid(0,depth/2,len,depth);
}
// ---- 16. beer cave: a wall of walk-in cooler doors with heated (fogged) glass, cases stacked behind ----
export function beerCave138(b,seed,{len,C=3.15,depth=1.0}){
 const r=rng(seed),dw=.76,n=Math.max(2,Math.floor((len-.1)/dw)),L=n*dw+.1,h=2.15,zf=depth;
 b.box('r138coolW',0,(C+h)/2,zf-.05,L,C-h,.1);// bulkhead over the doors
 b.plane('r138coolIn',0,h/2,.02,L-.1,h);b.box('r138coolW',-L/2+.03,h/2,zf/2,.06,h,zf);b.box('r138coolW',L/2-.03,h/2,zf/2,.06,h,zf);
 b.box('r138dark',0,.04,zf/2,L,.08,zf);b.box('r138coolIn',0,h-.01,zf/2,L,.02,zf);
 for(let i=0;i<n;i++){const cx=-L/2+.05+dw*(i+.5);
  // wire shelves: 4 rows of 12/24-pack cases (photo bands), floor stack of real case boxes
  for(let k=0;k<4;k++){const y=.42+k*.42;b.box('r138steel',cx,y-.012,zf*.45,dw-.04,.012,zf*.8);b.box('r138steel',cx,y+.03,zf*.85,dw-.04,.006,.006);
   if(R140)caveShelf140(b,r,BEER140[(k+i+(seed>>>4))%3],cx,y,dw-.06,zf*.85,zf*.78,.38);
   else{band(b,r,'r138beer',(k+i+(seed>>>4))%4,4,(dw/2.6),cx,y+.19,zf*.72,dw-.05,.36);b.box('r138goodsT',cx,y+.18,zf*.4,dw-.06,.34,zf*.6);}}
  if(R140)caveFloor140(b,r,cx,dw-.06,zf*.82);else for(let j=0;j<2;j++){const ww=dw*.46;b.box('r138kraft',cx+(j-.5)*ww,.2,zf*.6,ww-.02,.24,.4);band(b,r,'r138beer',(i+j)%4,4,.12,cx+(j-.5)*ww,.2,zf*.6+.201,ww-.03,.22);}
  // door: frame, heated glass + condensation, long pull handle, kick plate
  for(const s of[-1,1])b.box('r138alu',cx+s*(dw/2-.025),h/2,zf+.02,.05,h,.06);b.box('r138alu',cx,h-.03,zf+.02,dw,.06,.06);b.box('r138alu',cx,.06,zf+.02,dw,.12,.06);
  if(GLASS140)glassPane140(b,2,(seed>>>3)+i,cx,h/2+.03,zf+.02,dw-.06,h-.18);else{b.plane('r138coolGlass',cx,h/2+.03,zf+.015,dw-.06,h-.18);b.plane('r138fog',cx,h/2+.03,zf+.03,dw-.06,h-.18);}
  const hx=cx+(i%2?-1:1)*(dw/2-.09);b.box('r138steel',hx,1.1,zf+.09,.025,.9,.025);for(const yy of[.68,1.52])b.box('r138steel',hx,yy,zf+.065,.025,.025,.05);
  b.box('r138plate',cx,.2,zf+.052,dw-.08,.16,.004);}
 b.box('r138ledW',0,h-.05,zf-.08,L-.12,.02,.02);
 b.solid(0,zf/2,L,zf+.1);
 return L;
}
// ---- 17. smoke / vape glass showcase counter (faces +z), with papers rack + hookahs on top ----
function hookah(b,r,x,y,z,s=1){
 const gl=['r138blueG','r138greenG','r138purpleG','r138clearG'][(r()*4)|0];
 b.add(new T.LatheGeometry([[0,0],[.08,.005],[.1,.06],[.09,.14],[.045,.2],[.03,.22]].map(([a,c])=>new T.Vector2(a*s,c*s)),8),gl,x,y,z);
 b.cylinder('r138brass',x,y+.33*s,z,.012*s,.016*s,.22*s,6);b.cylinder('r138brass',x,y+.45*s,z,.035*s,.06*s,.02*s,8);
 b.cylinder('r138brass',x,y+.36*s,z,.06*s,.06*s,.006,8);b.add(new T.LatheGeometry([[0,0],[.035,.0],[.045,.05],[.03,.06]].map(([a,c])=>new T.Vector2(a*s,c*s)),8),'r138cap',x,y+.46*s,z);
 b.rod('r138cap',[x+.03*s,y+.24*s,z],[x+.12*s,y+.32*s,z+.03],.007);
}
export function smokeCounter138(b,seed,{len=1.8,h=1.0,D=.6}){
 const r=rng(seed),secs=Math.max(1,Math.round(len/.9)),sl=len/secs;
 b.box('r138oak',0,.08,D/2,len,.16,D);b.box('r138dark',0,.08,D+.002,len-.02,.12,.004);
 b.plane('r138coolIn',0,(h+.16)/2,.02,len-.04,h-.16);
 for(let i=0;i<=secs;i++)b.box('r138alu',-len/2+i*sl,(h+.16)/2,D-.02,.03,h-.16,.03);for(const z of[.02,D-.02])b.box('r138alu',0,h-.01,z,len,.03,.03);
 for(const s of[-1,1])b.box('r138alu',s*len/2,h-.01,D/2,.03,.03,D);
 // two shelves: vapes on the upper glass shelf, glass pipes on the floor of the case
 for(let i=0;i<secs;i++){const cx=-len/2+(i+.5)*sl;
  b.box('r138glassTop',cx,.56,D/2,sl-.04,.01,D-.06);
  if(R140){vapeShelf140(b,r,cx-(sl-.04)/2,cx+(sl-.04)/2,.565,D-.04,D-.08);pipes140(b,r,cx-sl/2+.02,cx+sl/2-.02,.16,D*.5);continue;}
  const u=r()*.62;uvPlane(b,'r138vape',u,0,u+.38,1,cx,.75,D*.45,sl-.06,.34,0,-.35);
  const u2=r()*.55;uvPlane(b,'r138pipes',u2,0,u2+.45,1,cx,.31,D*.45,sl-.06,.3,0,-.5);}
 b.box('r138ledW',0,h-.04,D/2,len-.08,.01,.02);
 b.plane('r138glassTop',0,h,D/2,len,D,0,-PI/2);b.plane('r138glassTop',0,(h+.16)/2,D,len,h-.16);
 b.plane('r138glassTop',-len/2,(h+.16)/2,D/2,D,h-.16,-PI/2);b.plane('r138glassTop',len/2,(h+.16)/2,D/2,D,h-.16,PI/2);
 // on top: rolling-paper / lighter / cigarillo rack at the back, a couple of hookahs
 if(R140){papers140(b,r,-len/2+.36,h+.005,.16);const pe=-len/2+.36+.41;for(let i=0;i<Math.min(3,Math.floor(len/.6));i++){const hx=len/2-.2-i*.3;if(hx-.14>pe)hookah140(b,r,hx,h,.2,1+(r()-.5)*.25);}}
 else{b.push(-len/2+.45,h,.14,0);b.box('r138dark',0,.15,0,.8,.3,.22);{const u=r()*.35;uvPlane(b,'r138papers',u,0,u+.6,1,0,.17,.112,.78,.3,0,-.2);}b.pop();
 for(let i=0;i<Math.min(3,Math.floor(len/.6));i++)hookah(b,r,len/2-.2-i*.3,h,.17,1+(r()-.5)*.3);}
 b.solid(0,D/2,len+.04,D);
}
// ---- 18. cigar humidor: walnut-oak cabinet with glazed doors, cedar shelves of boxes, hygrometer ----
export function humidor138(b,seed,{w=1.3,h=1.95,D=.55}){
 const r=rng(seed);b.box('r138oak',0,h/2,.02,w,h,.04);for(const s of[-1,1])b.box('r138oak',s*(w/2-.03),h/2,D/2,.06,h,D);
 b.box('r138oak',0,h-.06,D/2,w,.12,D);b.box('r138oak',0,.09,D/2,w,.18,D);b.box('r138oak',0,h+.03,D/2+.01,w+.06,.06,D+.04);
 // inside: four cedar shelves; the photo carries the boxes, the slats + glow sell the depth
 if(R140){b.plane('r138wood',0,(h+.18)/2-.05,.05,w-.12,h-.36);const sh=(h-.36)/4;cigarShelves140(b,r,w-.14,[0,1,2,3].map(k=>.18+k*sh+(k?.01:0)),D*.45);}
 else b.plane('r138cigars',0,(h+.18)/2-.05,.05,w-.12,h-.36);for(let k=1;k<4;k++)b.box('r138wood',0,.18+k*(h-.36)/4,D*.45,w-.12,.02,D*.8);
 b.box('r138ledA',0,h-.13,D*.7,w-.16,.01,.02);
 for(const s of[-1,1]){const dx=s*w/4;b.box('r138oak',dx+s*(w/4-.03),h/2,D-.01,.05,h-.3,.03);b.box('r138oak',dx-s*(w/4-.03),h/2,D-.01,.05,h-.3,.03);b.plane('r138lexan',dx,h/2,D,w/2-.08,h-.36);
  b.box('r138brass',dx-s*(w/4-.07),h/2,D+.02,.015,.18,.015);}
 b.cylinder('r138brass',0,h-.22,D+.01,.045,.045,.01,10,PI/2);b.cylinder('r138coolW',0,h-.22,D+.017,.036,.036,.004,10,PI/2);
 b.box('r138dark',0,h+.17,D/2,w*.6,.2,.02);
 b.solid(0,D/2,w+.04,D+.04);
}
// ---- 19. cashier booth: counter + bullet-resistant lexan (or steel bars) to the ceiling, lazy-susan pass-through ----
/** len along x; booth depth from the wall (z = 0) to the counter front (z = deep). Behind: cigarette power wall. */
export function cashier138(b,seed,{len=3.2,deep=1.7,C=3.15,bars=false,register=true}){
 const r=rng(seed),hh=1.02,cd=.6,zc=deep-cd/2;
 // customer counter: dark laminate front with a steel kick, worn top, diamond plate under the window
 b.box('r138oak',0,hh/2,zc,len,hh,cd);b.box('r138dark',0,.07,deep+.004,len,.14,.01);b.box('r138dark',0,hh+.015,zc,len+.04,.03,cd+.04);
 b.box('r138plate',0,hh/2+.1,deep+.006,.9,.5,.004);
 // the window wall
 const gy0=hh+.03,gTop=C-.02;
 if(!bars){b.plane('r138lexan',0,(gy0+gTop)/2,deep-.05,len,gTop-gy0);b.plane('r138lexan',0,(gy0+gTop)/2,deep-.07,len,gTop-gy0,PI);
  for(let x=-len/2;x<=len/2+1e-3;x+=len/Math.max(1,Math.round(len/1.1)))b.box('r138plate',x,(gy0+gTop)/2,deep-.06,.06,gTop-gy0,.06);
  b.box('r138plate',0,gy0+.02,deep-.06,len,.04,.08);b.box('r138plate',0,2.25,deep-.06,len,.05,.07);
  // lazy-susan pass-through + speaker grille + deal tray
  b.box('r138plate',.0,gy0+.18,deep-.06,.5,.34,.08);b.add(new T.CylinderGeometry(.2,.2,.32,10,1,true,0,PI),'r138lexan',0,gy0+.18,deep-.06,1,1,1,0);
  b.cylinder('r138plate',0,gy0+.01,deep-.06,.21,.21,.02,10);b.cylinder('r138speaker',.42,1.62,deep-.02,.06,.06,.01,10,PI/2);
  for(let k=-2;k<=2;k++)b.box('r138plate',.42+k*.022,1.62,deep-.012,.008,.08,.004);
  b.box('r138dark',-.5,gy0+.01,deep+.02,.36,.02,.22);}
 else{for(let x=-len/2+.06;x<len/2;x+=.12)b.box('r138bar',x,(gy0+gTop)/2,deep-.06,.018,gTop-gy0,.018);for(const y of[gy0+.04,1.6,2.3,gTop-.04])b.box('r138bar',0,y,deep-.06,len,.04,.04);
  b.box('r138bar',0,gy0+.14,deep-.06,.5,.26,.05);b.box('r138coolW',0,gy0+.14,deep-.035,.44,.2,.005);}
 for(const s of[-1,1])b.box('r138oak',s*(len/2+.03),C/2,deep/2,.06,C,deep);// booth end walls
 // clerk side: register, card reader, scale of lottery, a stool
 if(register){b.box('r138dark',-.6,hh+.07,deep-.4,.42,.14,.36);b.box('r138dark',-.6,hh+.25,deep-.48,.3,.22,.04,0);b.plane('r138screen',-.6,hh+.25,deep-.457,.26,.18);
  b.box('r138dark',.75,hh+.05,deep-.3,.1,.1,.16);b.cylinder('r138dark',-.1,.38,deep-.95,.025,.025,.76,6);b.cylinder('r138oak',-.1,.78,deep-.95,.18,.18,.05,8);}
 // power wall on the booth's back wall: cigarettes above a low back counter, lotto dispenser over it
 b.box('r138oak',0,.45,.25,len-.1,.9,.5);b.box('r138dark',0,.91,.25,len-.08,.02,.52);
 const pw=Math.min(len-.2,2.6);b.box('r138dark',0,1.68,.06,pw+.08,1.36,.12);
 if(R140){cigWall140(b,r,pw,1.03,2.33,.152);lottoDisp140(b,r,pw*.78,2.71,.205);}
 else{band(b,r,'r138cig',0,1,pw/2.4*.9,0,1.68,.125,pw,1.3);
 b.box('r138dark',0,2.55,.1,pw*.8,.32,.2);{const u=r()*.25;uvPlane(b,'r138lotto',u,0,u+.75,1,0,2.55,.205,pw*.78,.3);}}
 b.solid(0,deep/2,len+.12,deep);
}
// ---- 20. neon: one tube sign cell (NEON138) on a clear acrylic back with hang chains; and bare coloured tube runs ----
export function neonSign138(b,cell,{w=.9,chainTo=null}){
 const h=w/2,c=cell%2,rI=cell>>1;b.box('r138lexan',0,0,-.015,w+.04,h+.04,.01);
 uvPlane(b,'r138neon',c/2+.003,1-(rI+1)/4+.004,(c+1)/2-.003,1-rI/4-.004,0,0,0,w,h);
 if(chainTo!=null)for(const s of[-1,1])b.rod('r138steel',[s*w*.4,h/2,-.015],[s*w*.4,chainTo,-.015],.003);
}
export function neonTube138(b,key,a,c){b.rod(key,a,c,.012);}
// ---- provisional fill (R4 replaces it with Layout A/B) ----
/** P = retail138Plan result (bodega). Store floor x0..x1, z (d/2−sd)..d/2, street at +z; door near one side. */
export function* retail138BodegaFill(b,P,{d}){
 addRetail138Bodega(b.mats);
 const r=rng(P.h^0xb0d6),zf=d/2,zb=zf-P.sd,{x0,x1,C}=P,cx=(x0+x1)/2,sw=x1-x0,doorRight=P.doorX>cx;
 const wallC=doorRight?x0:x1,face=doorRight?1:-1,ryW=doorRight?PI/2:-PI/2; // counter wall = away from the door
 // back wall: beer cave from the staff door to the far wall
 const sdx=x0+1.2,cave0=sdx+.75,caveL=x1-.12-cave0;let caveEnd=x1;
 if(caveL>1.6){b.push(cave0+caveL/2,0,zb,0);const L=beerCave138(b,P.h^3,{len:caveL,C});b.pop();
  b.push(cave0+caveL/2,2.62,zb+1.02,0);neonSign138(b,(P.h>>>6)%2?NEON138.coldBeer:NEON138.cerveza,{w:1.0,chainTo:C-2.62});b.pop();
  neonTube138(b,'r138tubeB',[cave0+caveL/2-L/2,2.2,zb+1.0],[cave0+caveL/2+L/2,2.2,zb+1.0]);caveEnd=zb+1.05;}
 yield;
 // cashier booth on the counter wall, starting ~1.2 m inside the storefront; liquor wall behind it on the same wall further back
 const bLen=Math.min(3.6,Math.max(2.4,P.sd*.32)),bz=zf-1.3-bLen/2,deep=1.75,bars=(P.h>>>9)%4===0;
 b.push(wallC,0,bz,ryW);cashier138(b,P.h^5,{len:bLen,deep,C,bars});b.pop();
 const lz1=bz-bLen/2-.1,lz0=caveEnd+.25,lLen=lz1-lz0;
 if(lLen>1.2){b.push(wallC,0,(lz0+lz1)/2,ryW);liquorWall138(b,P.h^7,{len:lLen,C,y0:.45,depth:.4});b.pop();}
 // smoke / vape showcase continues the counter line toward the back, in front of the liquor wall's first bays
 const scL=Math.min(2.2,Math.max(0,lLen-.4));if(scL>.9){b.push(wallC+face*(deep-.6),0,lz1-scL/2-.05,ryW);smokeCounter138(b,P.h^11,{len:scL});b.pop();}
 // impulse racks against the counter front + lotto neon over the window
 b.push(wallC+face*(deep+.01),0,bz-bLen/2+.6,ryW);impulse138(b,P.h^13,{w:.8,h:1.0});b.pop();
 b.push(wallC+face*(deep-.04),2.55,bz+.3,ryW);neonSign138(b,(P.h>>>7)%2?NEON138.lotto:NEON138.atm,{w:.8,chainTo:C-2.55});b.pop();
 neonTube138(b,'r138tubeP',[wallC+face*(deep-.02),C-.05,bz-bLen/2],[wallC+face*(deep-.02),C-.05,bz+bLen/2]);
 yield;
 // door-side wall: humidor at the back, wall gondola of snacks in front of it
 const wallD=doorRight?x1:x0,ryD=doorRight?-PI/2:PI/2,hz=caveEnd+.85;b.push(wallD,0,hz,ryD);humidor138(b,P.h^17,{w:1.3});b.pop();
 b.push(wallD+(doorRight?-.65:.65),2.3,hz,ryD);neonSign138(b,NEON138.cigars,{w:.7,chainTo:C-2.3});b.pop();
 const gz0=hz+.75,gz1=zf-1.6,gl=Math.floor((gz1-gz0)/1.22)*1.22;
 if(gl>=1.22){b.push(wallD,0,gz0+gl/2,ryD);gondola138(b,P.h^19,{len:gl,double:false,h:1.8,cats:[GOODS138.candy.concat(GOODS138.dry.slice(8,14))]});b.pop();}
 yield;
 // one island gondola in the middle if the aisle widths allow (≥ 1.05 m each side)
 const ia=wallC+face*(deep+.95),ib=wallD-(doorRight?1:-1)*(.52+1.05),iw=Math.abs(ib-ia);
 if(iw>1.05){const ix=(ia+ib)/2,il=Math.max(1.22,Math.floor((zf-2.4-(caveEnd+1.2))/1.22)*1.22);const iz=caveEnd+1.2+il/2;b.push(ix,0,iz,PI/2);gondola138(b,P.h^23,{len:il,h:1.55,cats:[GOODS138.dry,GOODS138.candy]});b.pop();
  b.push(ix,0,iz+il/2,0);endcap138(b,P.h^29,{w:1.0,h:1.4,cat:GOODS138.candy});b.pop();b.push(ix,0,iz-il/2,PI);endcap138(b,P.h^31,{w:1.0,h:1.4});b.pop();}
 // window neon facing the street (reads mirrored from inside, like the real thing)
 const wx=doorRight?Math.max(x0+.8,P.doorX-1.7):Math.min(x1-.8,P.doorX+1.7);
 b.push(wx,1.85,zf-.22,0);neonSign138(b,(P.h>>>5)%3===0?NEON138.hrs24:NEON138.open,{w:.8,chainTo:C-1.85});b.pop();
 if(sw>7.5){b.push(cx+(doorRight?-1:1)*.4,2.25,zf-.24,0);neonSign138(b,NEON138.vape,{w:.7,chainTo:C-2.25});b.pop();}
}
