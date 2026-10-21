// V138-retail-interiors R2: supermarket fixture module library + a provisional fill (the Layout A/B grid generator is R4).
// Every module builds in its own frame (b.push): back / spine at local z = 0, shoppers on +z, length along x, floor y = 0.
// Goods are fake: product "facings" are strips of assets/l11-v138/goods.webp (shelf-front photos cut by
// tools/retail138_r2_assets.py, 2 cols x 19 rows, one strip = 2.4 m x 0.30 m of shelf), chosen per section by hash and
// cropped to a random u-window so neighbouring sections never repeat the same run. Top views (chest freezer, fruit, veg)
// and promo standees are their own textures. Fixtures themselves are real geometry (decks, lips, uprights, doors,
// mullions, belts, wire carts, baskets) with colliders.
import * as T from './vendor/three.module.min.js';
import {URBAN_TILE_SIZE} from './urban-materials.js?v=60';
import {r138GridPlane} from './retail138-bake.js?v=140a';
import {goodsRun140,catKey140,product140,chestFill140} from './retail140-goods.js?v=140b';
import {pile140,PRODUCE140} from './retail140-produce.js?v=140b'; // V140 P1b real fruit & veg // V140 P1 real-shape goods
const R140=!(typeof location!=='undefined'&&/[?&]r140=0\b/.test(location.search));
const A=new URL('./assets/l11-v138/',import.meta.url).href,V='138b',PI=Math.PI;
export const GOODS138={dry:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19],cool:[20,21,22,23],dairy:[24,25,26,27],frozen:[28,29,30,31],candy:[32,33,34,35,36]};
const GROWS=19,GCOLS=2;
function tex(name,srgb=true,rep=false){const t=new T.TextureLoader().load(A+name+'.webp?v='+V);if(srgb)t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=rep?T.RepeatWrapping:T.ClampToEdgeWrapping;t.anisotropy=4;t.magFilter=T.NearestFilter;return t;}
function glowM(name,glow,o={}){const m=tex(name,true,o.rep);return new T.MeshStandardMaterial({map:m,emissive:0xffffff,emissiveMap:m,emissiveIntensity:glow,roughness:o.rough??.75,vertexColors:true,...(o.alpha?{alphaTest:.5,side:T.DoubleSide}:{})});}
const col=(c,o={})=>new T.MeshStandardMaterial({color:c,roughness:o.r??.6,metalness:o.m??0,vertexColors:true,...(o.e?{emissive:o.e,emissiveIntensity:o.ei??1}:{}),...(o.t?{transparent:true,opacity:o.t,depthWrite:false}:{})});
export function addRetail138Market(m){
 if(m.r138goods)return m;
 m.r138goods=glowM('goods',.24);m.r138goodsCold=glowM('goods',.42); // behind glass / in coolers: lit by the case lamps
 m.r138chest=glowM('chest',.36);m.r138fruit=glowM('fruit',.26);m.r138veg=glowM('veg',.3,{rough:.35});
 m.r138promo1=glowM('promo1',.22);m.r138promo2=glowM('promo2',.22);m.r138aisle=glowM('aisle',.4);m.r138case=glowM('case',.18);
 m.r138price=glowM('price',.3,{rep:true});m.r138belt=glowM('belt',.12,{rep:true,rough:.9});m.r138wood=glowM('wood',.16,{rep:true,rough:.85});
 m.r138basket=glowM('basket',.18,{alpha:true,rough:.5});m.r138wire=glowM('wire',.14,{alpha:true,rough:.4});
 m.r138gond=col(0xd8d8d0,{r:.5,m:.25});m.r138peg=col(0xc9c9c0,{r:.7,m:.15});m.r138goodsT=col(0x34312c,{r:.9});
 m.r138cool=col(0x1d1f22,{r:.55,m:.3});m.r138coolW=col(0xe6e8e4,{r:.45,m:.15});m.r138steel=col(0xb7bbbc,{r:.3,m:.7});
 m.r138coolIn=col(0xdfe4e6,{r:.6,e:0x9fb0b8,ei:.35});m.r138coolGlass=col(0xbcd7e0,{r:.05,m:.2,t:.16});
 m.r138red=col(0xb8201f,{r:.5});m.r138orangeF=col(0xe0801e,{r:.55});m.r138green=col(0x2f6b35,{r:.6});m.r138kraft=col(0xa77c4e,{r:.95});
 m.r138scan=col(0x330707,{r:.1,e:0xff2a1c,ei:.8});m.r138screen=col(0x0b1320,{r:.2,e:0x3d79c8,ei:.7});
 m.r138laneLight=col(0xf2f0e4,{e:0xffffff,ei:.9});m.r138rubber=col(0x151515,{r:.9});
 Object.assign(URBAN_TILE_SIZE,{r138belt:.5,r138wood:1.2});
 return m;
}
// ---- helpers ----
function rng(seed){let s=(seed>>>0)||1;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return((s>>>0)%100000)/100000;};}
/** plane facing +z showing goods strip `slot`, u-window [u0,u0+uw] of the strip (uw = width / 2.4 m). */
function facing(b,key,slot,u0,uw,x,y,z,w,h,ry=0,rx=0){
 const g=new T.PlaneGeometry(w,h),uv=g.attributes.uv,c=(slot/GROWS|0),r=slot%GROWS,eu=.5/1024,ev=.5/1216;
 const U0=(c+u0)/GCOLS+eu,U1=(c+Math.min(1,u0+uw))/GCOLS-eu,V0=1-(r+1)/GROWS+ev,V1=1-r/GROWS-ev;
 for(let i=0;i<uv.count;i++)uv.setXY(i,U0+(U1-U0)*uv.getX(i),V0+(V1-V0)*uv.getY(i));
 b.add(g,key,x,y,z,1,1,1,ry,rx);g.dispose();
}
/** plane facing +z with an explicit uv rectangle of a whole texture (top views, promo, case prints, aisle cells). */
function uvPlane(b,key,u0,v0,u1,v1,x,y,z,w,h,ry=0,rx=0){const g=new T.PlaneGeometry(w,h),uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,u0+(u1-u0)*uv.getX(i),v0+(v1-v0)*uv.getY(i));b.add(g,key,x,y,z,1,1,1,ry,rx);g.dispose();}
const pick=(r,a)=>a[(r()*a.length)|0];
/** a run of product on one deck: box body (dark top/sides) + photo face; sometimes a sold-out gap. */
function goodsRun(b,r,key,cat,x0,x1,y,zFront,depth,h){
 if(R140){goodsRun140(b,r,catKey140(cat,GOODS138),x0,x1,y,zFront,depth,h,{cold:key==='r138goodsCold'});return;}
 const runs=[];if(r()<.16&&x1-x0>.7){const g0=x0+(x1-x0)*(.2+r()*.5),gw=.14+r()*.22;runs.push([x0,g0],[g0+gw,x1]);}else runs.push([x0,x1]);
 const slot=pick(r,cat);
 for(const[a,c]of runs){const w=c-a;if(w<.06)continue;const hh=h*(.82+r()*.18),dz=r()*.035,uw=w/2.4,u0=r()*(1-Math.min(1,uw));
  b.box('r138goodsT',(a+c)/2,y+hh/2,zFront-dz-depth/2,w-.01,hh,depth-.02);
  facing(b,key,slot,u0,uw,(a+c)/2,y+hh/2,zFront-dz+.001,w-.012,hh);}
}
function priceLip(b,r,x0,x1,y,z){const w=x1-x0;uvPlane(b,'r138price',r()*4,0,r()*4+w/2.4,1,(x0+x1)/2,y,z,w,.045);b.box('r138gond',(x0+x1)/2,y-.035,z-.01,w,.025,.02);}
export function caseBox138(b,r,x,y,z,w,h,d,ry=0){caseBox(b,r,x,y,z,w,h,d,ry);}
function caseBox(b,r,x,y,z,w,h,d,ry=0){
 b.push(x,y,z,ry);b.box('r138kraft',0,h/2,0,w-.004,h,d-.004);
 const c=(r()*4)|0,v0=1-(c+1)/4,v1=1-c/4;uvPlane(b,'r138case',0,v0,1,v1,0,h/2,d/2,w,h);uvPlane(b,'r138case',0,v0,.6,v1,w/2,h/2,0,d,h,PI/2);b.pop();
}
// ---- 4. gondola (double-sided island or single wall run) ----
/** len along x, centred; double → products both faces. cats: [front cat list, back cat list]. */
export function gondola138(b,seed,{len,h=1.95,double=true,cats=[GOODS138.dry,GOODS138.dry],overstock=true}){
 const r=rng(seed),D=double?1.0:.52,sec=Math.max(1,Math.round(len/1.22)),sl=len/sec,levels=h>1.7?[.16,.56,.96,1.36,1.72]:[.16,.56,.96,1.32];
 b.box('r138peg',0,h/2+.02,double?0:.025,len,h-.04,.05);
 for(let i=0;i<=sec;i++){const x=-len/2+i*sl;b.box('r138gond',x,h/2,double?0:.03,.05,h,.07);}
 b.box('r138gond',0,h+.01,double?0:.025,len+.04,.03,.09);
 // end panels close the run ends (otherwise the dark goods bodies show end-on)
 for(const s of[-1,1]){b.box('r138gond',s*(len/2+.012),h/2-.02,double?0:D/2,.024,h-.04,D);b.box('r138dark',s*(len/2+.012),.075,double?0:D/2,.03,.15,D+.01);}
 // R5b: end-panel skin tessellated (20 cm) so the bake can grade it (floor AO, lamp falloff), plus a hanging clip strip of
 // snacks on island ends (real gondola heads carry them)
 for(const s of[-1,1]){const ex=s*(len/2+.026),zc=double?0:D/2;r138GridPlane(b,'r138gond',0,ex,h/2+.06,zc,D-.02,h-.2,s*PI/2,0,.2);
  if(double&&r()<.7){const cz=zc+(r()-.5)*.3,n=4+((r()*3)|0),cat=pick(r,[GOODS138.candy,GOODS138.dry.slice(0,8)]),top=1.55;
   b.box('r138steel',ex+s*.008,top-n*.11,cz,.006,n*.22+.04,.035);b.box('r138steel',ex+s*.012,top+.02,cz,.02,.03,.06);
   for(let k=0;k<n;k++){if(R140){product140(b,'candy',ex+s*(.012+k%2*.004),top-.13-k*.21,cz+(k%2?.01:-.01),s*PI/2);continue;}const slot=pick(r,cat);facing(b,'r138goods',slot,r()*.85,.06,ex+s*(.018+k%2*.004),top-.08-k*.21,cz+(k%2?.01:-.01),.13,.18,s*PI/2);}}}
 for(const side of double?[1,-1]:[1]){
  b.push(0,0,0,side>0?0:PI);const z0=.05,dep=D/2-.03;
  b.box('r138dark',0,.075,z0+dep-.01,len,.15,.02);b.box('r138gond',0,.15,z0+dep/2,len,.012,dep);
  for(let li=0;li<levels.length;li++){const y=levels[li],deep=li===0?dep:dep-.06,top=(levels[li+1]??h-.05)-.05;
   if(li>0){b.box('r138gond',0,y-.006,z0+deep/2,len,.012,deep);for(let i=0;i<=sec;i++){const x=-len/2+i*sl;b.box('r138gond',x+(i===sec?-.01:.01),y-.07,z0+deep*.45,.012,.12,deep*.9);}}
   for(let i=0;i<sec;i++){const a=-len/2+i*sl+.03,c=a+sl-.06;goodsRun(b,r,'r138goods',cats[side>0?0:1],a,c,y,z0+deep-.015,Math.min(deep-.04,.36),Math.max(.12,top-y));}
   priceLip(b,r,-len/2,len/2,y-.03,z0+deep+.012);}
  b.pop();}
 if(overstock)for(let i=0;i<sec;i++)if(r()<.45){const x=-len/2+(i+.2+r()*.6)*sl;caseBox(b,r,x,h+.025,(r()-.5)*.3,.45+r()*.2,.24+r()*.12,.32+r()*.08,(r()-.5)*.3);if(r()<.4)caseBox(b,r,x+(r()-.5)*.1,h+.3,(r()-.5)*.2,.4,.22,.3,(r()-.5)*.4);}
 b.solid(0,double?0:D/2,len+.06,D);
}
/** end cap facing +z (a short gondola head on the aisle end of an island), with a promo card on top. */
export function endcap138(b,seed,{w=1.0,h=1.6,cat=GOODS138.dry}){
 const r=rng(seed);b.box('r138peg',0,h/2,.02,w,h,.04);for(const s of[-1,1])b.box('r138gond',s*w/2,h/2,.2,.04,h,.4);
 for(const y of(h<1.5?[.16,.56,.96]:[.16,.56,.96,1.32])){b.box('r138gond',0,y-.006,.2,w,.012,.38);goodsRun(b,r,'r138goods',cat,-w/2+.03,w/2-.03,y,.37,.32,.34);priceLip(b,r,-w/2,w/2,y-.03,.405);}
 const k=r()<.5?'r138promo1':'r138promo2';b.box('r138kraft',0,h+.32,.05,w*.8,.64,.02);uvPlane(b,k,0,.55,1,1,0,h+.32,.061,w*.78,.6);
 b.solid(0,.2,w+.08,.42);
}
// ---- 5. reach-in cooler / freezer bank with glass doors (against a wall) ----
export function reachIn138(b,seed,{doors=4,h=2.25,cat=GOODS138.cool,frozen=false}){
 const r=rng(seed),dw=.78,len=doors*dw+.1,D=.86,zf=D;
 b.box('r138cool',-len/2+.025,h/2,D/2,.05,h,D);b.box('r138cool',len/2-.025,h/2,D/2,.05,h,D);
 b.box('r138cool',0,h-.08,D/2,len,.16,D);b.box('r138cool',0,.12,D/2,len,.24,D);b.box('r138dark',0,.06,zf-.01,len,.12,.02);
 b.box('r138lamp',0,h-.08,zf+.001,len-.1,.05,.004);// lit header strip
 b.plane('r138coolIn',0,h/2,.03,len-.1,h-.4);
 for(let i=0;i<doors;i++){const cx=-len/2+.05+dw*(i+.5);
  for(let k=0;k<4;k++){const y=.28+k*.44,ph=.38;b.box('r138coolW',cx,y-.01,zf*.5,dw-.02,.012,zf-.2);b.box('r138steel',cx,y+.005,zf-.12,dw-.02,.01,.01);
   if(R140){goodsRun(b,r,'r138goodsCold',cat,cx-dw/2+.03,cx+dw/2-.03,y,zf-.13,zf-.2,ph);continue;}
   const slot=pick(r,cat),uw=(dw-.04)/2.4;facing(b,'r138goodsCold',slot,r()*(1-uw),uw,cx,y+ph/2,zf-.14,dw-.04,ph);b.box('r138goodsT',cx,y+ph/2,zf*.45-.07,dw-.05,ph*.95,zf*.6);}
  // door: frame + heated glass + vertical bar handle
  for(const s of[-1,1])b.box('r138cool',cx+s*(dw/2-.02),h/2-.04,zf+.02,.04,h-.4,.04);
  b.box('r138cool',cx,.27,zf+.02,dw,.04,.04);b.box('r138cool',cx,h-.19,zf+.02,dw,.04,.04);
  b.plane('r138coolGlass',cx,h/2-.04,zf+.025,dw-.06,h-.48);
  const hx=cx+((i%2)?-1:1)*(dw/2-.09);b.box('r138steel',hx,1.12,zf+.08,.025,.95,.025);b.box('r138steel',hx,1.62,zf+.06,.02,.02,.05);b.box('r138steel',hx,.62,zf+.06,.02,.02,.05);
  b.box('r138lamp',cx-dw/2+.012,h/2,zf-.03,.012,h-.5,.012);}
 if(frozen)for(let i=0;i<doors;i++)if(r()<.5)b.plane('r138coolW',-len/2+.05+dw*(i+.5),.48,zf+.027,dw-.1,.06);// frost line on the glass base
 b.solid(0,D/2,len,D);
}
// ---- 6. open multideck (air-curtain dairy case, against a wall) ----
export function multideck138(b,seed,{len=2.5,h=2.0,cat=GOODS138.dairy}){
 const r=rng(seed),D=.95,mods=Math.max(1,Math.round(len/1.25)),ml=len/mods;
 b.box('r138coolW',-len/2+.03,h/2,D/2,.06,h,D);b.box('r138coolW',len/2-.03,h/2,D/2,.06,h,D);
 b.box('r138coolIn',0,h/2,.03,len,h,.06);b.box('r138coolW',0,h-.09,D*.32,len,.18,D*.64);b.box('r138lamp',0,h-.185,D*.55,len-.1,.012,.05);
 b.box('r138coolW',0,.25,D-.06,len,.5,.12);b.box('r138dark',0,.48,D-.002,len,.035,.01);b.box('r138steel',0,.53,D-.1,len,.06,.02);
 b.box('r138goodsT',0,.42,D*.5,len-.12,.12,D-.3);
 for(let k=0;k<4;k++){const y=.62+k*.33,zf=D-.16-k*.07,dep=zf-.12;
  b.box('r138coolW',0,y-.01,.12+dep/2,len-.12,.015,dep);priceLip(b,r,-len/2+.06,len/2-.06,y-.025,zf+.01);
  b.box('r138lamp',0,y+.28,zf-.04,len-.16,.01,.02);
  for(let i=0;i<mods;i++){const a=-len/2+.06+i*ml,c=a+ml-(i===mods-1?.12:0);goodsRun(b,r,'r138goodsCold',cat,a+.01,c-.01,y,zf-.01,Math.min(dep-.02,.4),.28);}}
 // bottom well: yogurt / cheese lying flat (top view of the dairy strip, tilted toward the shopper)
 for(let i=0;i<mods;i++){const a=-len/2+.06+i*ml,w=ml-.14,uw=w/2.4;if(R140){for(const zz of[D-.14,D-.42])goodsRun(b,r,'r138goodsCold',GOODS138.dairy,a+.02,a+ml-.1,.48,zz,.28,.16);continue;}facing(b,'r138goodsCold',pick(r,cat),r()*(1-uw),uw,a+ml/2-.03,.495,D*.55,w,D-.42,0,-PI/2+.35);}
 b.solid(0,D/2,len,D);
}
// ---- 14. chest freezer (island or Layout B centre run) ----
export function chest138(b,seed,{len=2.0,D=.92}){
 const r=rng(seed),h=.86,wt=.05,hw=h-.36;b.box('r138dark',0,.07,0,len+.01,.14,D+.01);
 // V140 P1b: hollow tub (base + four insulated walls + rim strips) so the well's contents show through the lids
 b.box('r138coolW',0,hw/2,0,len,hw,D);
 for(const s of[-1,1]){b.box('r138coolW',0,hw+(h-.04-hw)/2,s*(D/2-wt/2),len,h-.04-hw,wt);b.box('r138coolW',s*(len/2-wt/2),hw+(h-.04-hw)/2,0,wt,h-.04-hw,D-2*wt);
  b.box('r138steel',0,h-.02,s*(D/2-wt/2+.005),len+.02,.04,wt+.01);b.box('r138steel',s*(len/2-wt/2+.005),h-.02,0,wt+.01,.04,D-2*wt);}b.box('r138dark',0,.62,D/2+.006,len,.06,.01);b.box('r138dark',0,.62,-D/2-.006,len,.06,.01);
 // cavity contents: chest top view, random window so no two freezers match, then two sliding lids
 const uw=Math.min(1,len/2.6),u0=r()*(1-uw),vw=Math.min(1,D/1.9),v0=r()*(1-vw);
 if(R140)chestFill140(b,r,len-2*wt-.01,D-2*wt-.01,hw,h-.08);// real frozen packs in the well
 else uvPlane(b,'r138chest',u0,v0,u0+uw,v0+vw,0,h-.1,0,len-2*wt,D-2*wt,0,-PI/2);
 for(const s of[-1,1]){b.plane('r138coolGlass',s*len/4+s*.02,h+.005+(s>0?.012:0),0,len/2+.04,D-.08,0,-PI/2);b.box('r138steel',s*len/4,h+.012+(s>0?.012:0),0,len/2,.01,.03);}
 b.solid(0,0,len+.04,D+.04);
}
// ---- 7–10. checkout: belt, scanner, POS, bagging, impulse rack. Belt along +x (load end at −x), shopper on +z ----
export function checkout138(b,seed,{lane=1}){
 const r=rng(seed),hh=.86,dz=.62;
 b.box('r138coolW',-.6,hh/2-.03,0,2.2,hh-.06,dz);b.box('r138dark',-.6,.05,0,2.2,.1,dz+.01);// belt cabinet
 b.plane('r138belt',-.75,hh+.002,0,1.8,dz-.16,0,-PI/2);for(const s of[-1,1])b.box('r138steel',-.6,hh+.02,s*(dz/2-.04),2.2,.04,.05);
 b.box('r138steel',-1.66,hh,0,.08,.05,dz-.12);b.box('r138dark',-.3,hh+.035,.05,.4,.05,.05);// belt end roller, divider stick
 // scanner bed + tower
 b.box('r138steel',.75,hh/2-.03,0,.5,hh-.06,dz);b.box('r138dark',.75,hh+.005,0,.4,.01,.36);b.plane('r138scan',.75,hh+.012,0,.24,.22,0,-PI/2);
 b.box('r138dark',.75,hh+.16,-.2,.36,.3,.08);b.plane('r138scan',.75,hh+.16,-.159,.22,.12);
 // bagging + carousel post
 b.box('r138coolW',1.45,hh/2-.08,0,.9,hh-.16,dz);b.box('r138steel',1.45,hh-.15,0,.9,.02,dz);b.cylinder('r138steel',1.45,hh+.25,0,.02,.02,.5,6);
 b.box('r138steel',1.45,hh+.5,0,.6,.02,.02);
 // cashier side (−z): POS screen on a pole, keyboard, drawer, receipt printer; customer side (+z): pin pad + small display
 b.cylinder('r138dark',.35,hh+.18,-.45,.025,.025,.36,6);b.box('r138dark',.35,hh+.42,-.45,.34,.26,.05);b.plane('r138screen',.35,hh+.42,-.475,.3,.22,PI);
 b.box('r138dark',.35,hh-.02,-.48,.42,.05,.18);b.box('r138dark',.35,hh-.16,-.47,.44,.16,.42);b.box('r138steel',.35,hh-.16,-.69,.4,.12,.01);
 b.box('r138dark',-.05,hh+.08,-.42,.16,.12,.18);b.box('r138coolW',-.05,hh+.145,-.42,.1,.01,.12);
 b.cylinder('r138dark',.55,hh+.14,.36,.015,.015,.28,6);b.box('r138dark',.55,hh+.3,.36,.12,.18,.06,-.3);b.plane('r138screen',.55+.017,hh+.33,.392,.08,.06,-.3);
 // lane light pole at the load end
 b.cylinder('r138steel',-1.62,1.2,-.22,.03,.03,2.4,6);b.cylinder('r138laneLight',-1.62,2.46,-.22,.11,.11,.16,10);b.cylinder('r138red',-1.62,2.56,-.22,.115,.115,.04,10);
 // impulse rack bolted to the belt cabinet's shopper side, facing the queue lane
 b.push(-1.15,0,dz/2+.01,0);impulse138(b,seed^0x9e37,{w:.85,h:1.35});b.pop();
 // gum / mints counter rack on the scanner's shopper side
 b.push(.1,hh-.1,dz/2+.08,0);for(let k=0;k<2;k++){b.box('r138dark',0,.04+k*.16,0,.5,.01,.12);if(R140)goodsRun(b,r,'r138goods',GOODS138.candy,-.24,.24,.045+k*.16,.06,.1,.14);else facing(b,'r138goods',pick(r,GOODS138.candy),r()*.7,.21,0,.1+k*.16,.065,.48,.12);}b.pop();
 b.solid(-.2,0,3.6,dz+.04);b.solid(.35,-.5,.6,.4);
}
/** impulse candy rack: 5 tilted wire tiers of candy facings, faces +z. */
export function impulse138(b,seed,{w=.9,h=1.45}){
 const r=rng(seed);for(const s of[-1,1])b.box('r138dark',s*w/2,h/2,.15,.03,h,.3);b.box('r138dark',0,h-.02,.15,w,.04,.3);b.box('r138dark',0,.06,.15,w,.12,.32);
 for(let k=0;k<5;k++){const y=.2+k*.25,slot=GOODS138.candy[(k+(seed>>>3))%5],uw=w/2.4*1.6;
  b.box('r138dark',0,y,.16,w,.01,.28);if(R140)goodsRun(b,r,'r138goods',GOODS138.candy,-w/2+.02,w/2-.02,y+.005,.29,.26,.22);else facing(b,'r138goods',slot,r()*(1-uw),uw,0,y+.1,.27,w-.04,.2,0,-.25);b.box('r138dark',0,y+.03,.3,w,.012,.012);}
 b.solid(0,.15,w+.04,.32);
}
// ---- 11. cardboard promo display: standee + case pallet / dump bin, faces +z ----
export function promo138(b,seed,{}){
 const r=rng(seed),k=r()<.5?1:2,key='r138promo'+k,h=k===1?1.55:1.3,w=k===1?.84:.86;
 b.box('r138kraft',0,.11,0,1.0,.22,.8);b.box('r138wood',0,.06,0,1.05,.12,.85);// pallet + case tier
 for(let i=0;i<2;i++)for(let j=0;j<2;j++)caseBox(b,r,-.24+i*.48,.22,-.18+j*.36,.46,.3,.34,(r()-.5)*.08);
 caseBox(b,r,0,.52,0,.5,.28,.36,(r()-.5)*.3);
 b.box('r138kraft',0,.8+h/2,-.3,w,h,.015);uvPlane(b,key,0,0,1,1,0,.8+h/2,-.29,w-.02,h-.02);b.box('r138kraft',0,.8+.12,-.24,.3,.24,.1);
 b.solid(0,0,1.08,.88);
}
// ---- 12. shopping baskets (stack on a stand) and nested carts ----
export function baskets138(b,seed,{n=6}){
 const r=rng(seed),bw=.44,bd=.3,bh=.22;b.box('r138dark',0,.03,0,bw+.06,.06,bd+.06);
 for(let i=0;i<n;i++){const y=.06+i*.065,dx=(r()-.5)*.02,ry=(r()-.5)*.08;b.push(dx,y,0,ry);
  b.plane('r138basket',0,bh/2,bd/2,bw,bh);b.plane('r138basket',0,bh/2,-bd/2,bw,bh,PI);b.plane('r138basket',bw/2,bh/2,0,bd,bh,PI/2);b.plane('r138basket',-bw/2,bh/2,0,bd,bh,-PI/2);b.plane('r138basket',0,.004,0,bw,bd,0,-PI/2);
  if(i===n-1){b.rod('r138dark',[-.12,bh,0],[-.02,bh+.16,0],.008);b.rod('r138dark',[.12,bh,0],[.02,bh+.16,0],.008);b.rod('r138dark',[-.02,bh+.16,0],[.02,bh+.16,0],.012);}
  b.pop();}
 b.solid(0,0,bw+.08,bd+.08);
}
function cart(b){
 const L=.9,Wb=.52,Wf=.42,y0=.42,y1=.98;const P=(x,y,z)=>[x,y,z];
 const bb=[P(-L/2,y0,-Wb/2),P(L/2-.1,y0,-Wf/2),P(L/2-.1,y0,Wf/2),P(-L/2,y0,Wb/2)],tt=[P(-L/2-.05,y1,-Wb/2-.02),P(L/2,y1,-Wf/2-.02),P(L/2,y1,Wf/2+.02),P(-L/2-.05,y1,Wb/2+.02)];
 for(let i=0;i<4;i++){b.rod('r138steel',bb[i],bb[(i+1)%4],.008);b.rod('r138steel',tt[i],tt[(i+1)%4],.009);b.rod('r138steel',bb[i],tt[i],.008);}
 // mesh panels (alpha-tested wire grid)
 b.plane('r138wire',0,y0+.001,0,L-.1,Wb-.06,0,-PI/2);b.plane('r138wire',.02,(y0+y1)/2,Wb/2-.03,L,y1-y0,0,0);b.plane('r138wire',.02,(y0+y1)/2,-Wb/2+.03,L,y1-y0,PI,0);b.plane('r138wire',L/2-.05,(y0+y1)/2,0,Wf,y1-y0,PI/2);
 b.box('r138red',-L/2-.14,1.02,0,.04,.04,Wb+.06);for(const s of[-1,1])b.rod('r138steel',[-L/2-.05,y1,s*Wb/2],[-L/2-.14,1.02,s*Wb/2],.01);
 // chassis + lower tray + wheels
 for(const s of[-1,1]){b.rod('r138steel',[-L/2,y0,s*Wb/2],[-L/2+.05,.1,s*.24],.012);b.rod('r138steel',[L/2-.1,y0,s*Wf/2],[L/2-.12,.1,s*.2],.012);b.rod('r138steel',[-L/2+.05,.1,s*.24],[L/2-.12,.1,s*.2],.012);}
 b.plane('r138wire',-.02,.16,0,L-.2,.4,0,-PI/2);
 for(const[x,z]of[[-L/2+.05,-.24],[-L/2+.05,.24],[L/2-.12,-.2],[L/2-.12,.2]]){b.cylinder('r138rubber',x,.05,z,.05,.05,.03,8,PI/2);b.box('r138dark',x,.1,z,.03,.05,.04);}
}
export function carts138(b,seed,{n=3}){const r=rng(seed);for(let i=0;i<n;i++){b.push(i*.26,0,(r()-.5)*.03,(r()-.5)*.04);cart(b);b.pop();}b.solid((n-1)*.13,0,1.0+(n-1)*.26,.62);}
// ---- 13. produce: tilted wooden display bin (fruit) and misted veg rack against a wall ----
export function produceBin138(b,seed,{len=1.6,D=1.1}){
 const r=rng(seed),hf=.72,hb=1.0;b.box('r138wood',0,.36,0,len,.72,D*.8);
 for(const s of[-1,1]){b.box('r138wood',s*len/2,(hf+hb)/2-.05,0,.05,hb+.05,D);}
 b.box('r138wood',0,hf/2,D/2-.03,len,hf,.06);b.box('r138wood',0,hb/2,-D/2+.03,len,hb,.06);
 const tilt=Math.atan2(hb-hf,D),sl=Math.hypot(D,hb-hf)-.1,uw=Math.min(1,len/2.2),u0=r()*(1-uw),vw=Math.min(1,sl/1.5),v0=r()*(1-vw);
 if(R140){const yc=(hf+hb)/2+.02,ch=Math.cos(tilt)*sl/2,sh=Math.sin(tilt)*sl/2;b.plane('r138goodsT',0,yc,0,len-.08,sl,0,-PI/2+tilt);
  pile140(b,r,PRODUCE140.fruit,-len/2+.05,len/2-.05,ch,yc-sh,-ch,yc+sh,{sections:len>1.3?2:1});}
 else{uvPlane(b,'r138fruit',u0,v0,u0+uw,v0+vw,0,(hf+hb)/2+.04,0,len-.08,sl,0,-PI/2+tilt);
 // a few loose fruit on the front lip so the pile has a silhouette
 for(let i=0;i<9;i++){const x=-len/2+.12+r()*(len-.24);b.sphere(r()<.5?'r138red':'r138orangeF',x,hf+.07+r()*.03,D/2-.1-r()*.12,.045,.042,.045);}}
 b.box('r138dark',0,hf-.08,D/2+.004,len*.5,.12,.01);uvPlane(b,'r138price',r(),0,r()+.25,1,0,hf-.08,D/2+.011,len*.48,.1);
 b.solid(0,0,len+.06,D+.04);
}
export function vegRack138(b,seed,{len=2.4,h=2.1}){
 const r=rng(seed),D=1.0;b.box('r138green',-len/2+.03,h/2,D/2,.06,h,D);b.box('r138green',len/2-.03,h/2,D/2,.06,h,D);
 b.box('r138steel',0,h/2+.4,.03,len,h-.8,.04);b.box('r138green',0,h-.1,.25,len,.2,.5);b.box('r138lamp',0,h-.205,.35,len-.2,.01,.06);
 b.box('r138green',0,.3,D/2,len,.6,D-.1);
 const vk=PRODUCE140.veg.slice();for(let i=vk.length-1;i>0;i--){const j=(r()*(i+1))|0;[vk[i],vk[j]]=[vk[j],vk[i]];}// six kinds over three tiers, no repeats
 for(let k=0;k<3;k++){const y=.62+k*.3,z=D-.12-k*.28,dep=.42,uw=Math.min(1,len/2.6),u0=r()*(1-uw),v0=k/3;
  if(R140){const yc=y+.02,ch=Math.cos(.42)*dep/2,sh=Math.sin(.42)*dep/2,zc=z-dep/2;b.plane('r138green',0,yc,zc,len-.14,dep,0,-PI/2+.42);
   pile140(b,r,[vk[2*k],vk[2*k+1]],-len/2+.08,len/2-.08,zc+ch,yc-sh,zc-ch,yc+sh,{sections:2,shuffle:false});}
  else uvPlane(b,'r138veg',u0,v0,u0+uw,v0+.33,0,y+.06,z-dep/2,len-.14,dep,0,-PI/2+.42);b.box('r138green',0,y-.04,z-dep/2,len-.12,.04,dep);b.box('r138dark',0,y,z+.01,len-.12,.08,.02);}
 b.rod('r138steel',[-len/2+.08,1.48,.5],[len/2-.08,1.48,.5],.012);for(let i=0;i<8;i++)b.box('r138dark',-len/2+.2+i*(len-.4)/7,1.465,.5,.02,.03,.02);
 b.solid(0,D/2,len,D);
}
/** aisle sign hanging from the ceiling, two-sided; cell 0..7 of aisle.webp. */
export function aisleSign138(b,cell,C,ry=0){
 const v0=1-(cell+1)/8,v1=1-cell/8,y=C-.75,w=1.1,h=.55;b.push(0,0,0,ry);
 for(const s of[-1,1])b.rod('r138steel',[s*.45,y+h/2,0],[s*.45,C,0],.006);b.box('r138dark',0,y,0,w+.04,h+.04,.02);
 uvPlane(b,'r138aisle',0,v0,1,v1,0,y,.011,w,h);uvPlane(b,'r138aisle',0,v0,1,v1,0,y,-.011,w,h,PI);b.pop();
}
// ---- provisional fill for R2 previews (R4 replaces it with the Layout A/B grid generator) ----
/** P = retail138Plan result, d = building depth. Store floor x0..x1, z (d/2−sd)..d/2, street at +z. */
export function* retail138MarketFill(b,P,{d}){
 addRetail138Market(b.mats);
 const r=rng(P.h^0x51ed),zf=d/2,zb=zf-P.sd,{x0,x1,C}=P,sx=x1-1.6;
 // back wall: drinks + frozen reach-ins up to the staff door
 const bl=sx-.8-(x0+.15),nd=Math.max(2,Math.floor(bl/.78)),na=Math.ceil(nd/2);
 b.push(x0+.15+(na*.78+.1)/2,0,zb,0);reachIn138(b,P.h,{doors:na,cat:GOODS138.cool});b.pop();
 if(nd-na>0){b.push(x0+.15+na*.78+.1+((nd-na)*.78+.1)/2,0,zb,0);reachIn138(b,P.h^7,{doors:nd-na,cat:GOODS138.frozen,frozen:true});b.pop();}
 yield;
 // left wall: dairy multideck; right wall: veg rack near the front + wall gondola behind it
 const zA=zb+2.3,zQ=zf-4.6,mdl=Math.max(1.25,Math.floor((zQ-.4-zA)/1.25)*1.25);
 b.push(x0,0,zA+mdl/2,PI/2);multideck138(b,P.h^11,{len:mdl});b.pop();
 const veg=(P.h>>>5)%3!==0,vl=veg?2.4:0;
 if(veg){b.push(x1,0,zQ-.2-vl/2,-PI/2);vegRack138(b,P.h^13,{len:vl});b.pop();}
 const wl=Math.max(1.22,Math.floor((zQ-.4-vl-zA)/1.22)*1.22);b.push(x1,0,zA+wl/2,-PI/2);gondola138(b,P.h^17,{len:wl,double:false});b.pop();
 yield;
 // islands: double gondolas along z, aisles ≥ 1.5 m; leftover width → chest freezers
 const gx0=x0+.95+1.55,gx1=x1-.52-1.55,gl=Math.max(2.44,Math.floor((zQ-.6-zA-.5)/1.22)*1.22),gz=zA+.25+gl/2;
 const n=Math.max(0,Math.floor((gx1-gx0+1.55)/2.55)),used=n*2.55-1.55,off=(gx1-gx0-used)/2;
 for(let i=0;i<n;i++){const x=gx0+off+.5+i*2.55,s=P.h^(i*977);
  b.push(x,0,gz,PI/2);gondola138(b,s,{len:gl,cats:[GOODS138.dry,GOODS138.dry]});b.pop();
  b.push(x,0,gz+gl/2,0);endcap138(b,s^3,{});b.pop();b.push(x,0,gz-gl/2,PI);endcap138(b,s^5,{h:1.4});b.pop();
  b.push(x,0,gz,0);aisleSign138(b,(i+(P.h>>>9))%8,C,PI/2);b.pop();}
 if(n===0||off>1.4){const cx=n===0?(gx0+gx1)/2:gx0+off/2-.2;if(gx1-gx0>.9){b.push(cx,0,gz,PI/2);chest138(b,P.h^19,{len:Math.min(2.4,gl-.4)});b.pop();}}
 yield;
 // front: checkout lanes on the side away from the door, produce bin + promo + baskets/carts by the door
 const doorLeft=P.doorX<(x0+x1)/2,lanes=[];const span=doorLeft?[P.doorX+1.6,x1-.6]:[x0+.6,P.doorX-1.6];
 for(let x=span[1]-.55;x>span[0]+.3&&lanes.length<3;x-=2.3)lanes.push(doorLeft?x:span[0]+(span[1]-x));
 lanes.forEach((x,i)=>{b.push(x,0,zf-2.7,-PI/2);checkout138(b,P.h^(31+i),{lane:i+1});b.pop();});
 const fx=doorLeft?Math.max(x0+1.2,P.doorX-2.2):Math.min(x1-1.2,P.doorX+2.2);
 b.push(fx,0,zf-1.2,PI);carts138(b,P.h^37,{n:2+(P.h>>>11)%3});b.pop();
 b.push(P.doorX+(doorLeft?1.4:-1.4),0,zf-.7,0);baskets138(b,P.h^41,{n:5+(P.h>>>13)%4});b.pop();
 if(((P.h>>>14)&1)===0){b.push(fx,0,zQ+.2,0);produceBin138(b,P.h^43,{});b.pop();}
 else{b.push(fx,0,zQ+.3,0);promo138(b,P.h^47,{});b.pop();}
}
