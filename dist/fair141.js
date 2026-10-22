// V141 F5a: SoHo street-fair stall goods, modelled in their real shapes (user 10-21 22:43: 慢慢做、认真打磨; PROP RULE 10-21 22:30).
// Replaces the coloured boxes of the six food kinds in soho135-fair.js (grill, steam, crepe, fry, drinks, fruit) and the box
// "tables" with: a charcoal grill trough (walls, glowing ember bed, round-bar grate) with skewers of chunked meat and
// sausages, a propane cylinder, squeeze bottles and tongs; bamboo steamer stacks on a stock pot with an open basket of
// pleated bao; two round crêpe griddles with a crêpe, a folded stack, batter jug and spreader; a deep fryer with wire baskets
// and paper cones of fries; a galvanised ice tub of cans, a row of labelled bottles and a drink dispenser; tilted orchard
// crates of modelled fruit (retail140-produce models, outdoor material) with stamped crates stacked under the table;
// moulded coolers under the tables; and folding tables under draped oilcloth / canvas skirts with folds.
// Every item wears its own cell of one generated atlas (bc/tools/fair141_assets.py -> assets/l11-v141f/fair141*.webp:
// baseColor + roughness/metal + normal + emission for the embers). ?fair141=0 = the V135 boxes.
import * as T from './vendor/three.module.min.js';
import {FAIRUV141} from './fair141-uv.js?v=141i';
import {pile140} from './retail140-produce.js?v=140b';
const A=new URL('./assets/l11-v141f/',import.meta.url).href,V='141i',PI=Math.PI;
export const fair141On=()=>!/[?&]fair141=0\b/.test(globalThis.location?.search||'');
function tex(name,srgb,rep){const t=new T.TextureLoader().load(A+name+'.webp?v='+V);if(srgb)t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;t.magFilter=T.NearestFilter;
 if(rep)t.wrapS=t.wrapT=T.RepeatWrapping;return t;}
let CANVAS=null;
/** tiling canvas weave for the tent / banner materials of soho135-fair (tinted by each material's colour) */
export function canvas141(){CANVAS??={map:tex('canvas141',true,true),normalMap:tex('canvas141-n',false,true)};return CANVAS;}
export function addFair141Materials(m){
 if(m.fairProp141)return m;
 const map=tex('fair141',true),orm=tex('fair141_r',false),nrm=tex('fair141_n',false),emi=tex('fair141_e',true);
 m.fairProp141=new T.MeshStandardMaterial({map,roughnessMap:orm,metalnessMap:orm,roughness:1,metalness:1,normalMap:nrm,normalScale:new T.Vector2(.8,.8),
  emissive:0xffffff,emissiveMap:emi,emissiveIntensity:1.4,vertexColors:true});
 for(const[k,f]of[['fairGing141','ging141'],['fairGingB141','ging141b']])m[k]=new T.MeshStandardMaterial({map:tex(f,true,true),normalMap:tex('ging141-n',false,true),
  normalScale:new T.Vector2(.6,.6),roughness:.5,vertexColors:true,side:T.DoubleSide});
 // the fruit uses the supermarket produce models + skins, but outdoors (no store-light emissive trick)
 const pm=new T.TextureLoader();const P=new URL('./assets/l11-v140/',import.meta.url).href;
 const pt=(n,s)=>{const t=pm.load(P+n+'.webp?v=140b');if(s)t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;t.magFilter=T.NearestFilter;return t;};
 m.fairFruit141=new T.MeshStandardMaterial({map:pt('produce140',true),roughnessMap:pt('produce140_r'),roughness:1,normalMap:pt('produce140_n'),normalScale:new T.Vector2(.8,.8),vertexColors:true});
 return m;
}
const R=k=>FAIRUV141[k];
// sub-rect of a cell: s,t in 0..1 of the cell (t up)
const sub=(r,s0,t0,s1,t1)=>[r[0]+(r[2]-r[0])*s0,r[1]+(r[3]-r[1])*t0,r[0]+(r[2]-r[0])*s1,r[1]+(r[3]-r[1])*t1];
function remap(g,r){const u=g.attributes.uv;for(let i=0;i<u.count;i++)u.setXY(i,r[0]+(r[2]-r[0])*Math.min(1,Math.max(0,u.getX(i))),r[1]+(r[3]-r[1])*Math.min(1,Math.max(0,u.getY(i))));return g;}
// top-down planar uv (x,z over size s centred) into rect r
function planar(g,r,s){const p=g.attributes.position,u=g.attributes.uv||new T.BufferAttribute(new Float32Array(p.count*2),2);
 for(let i=0;i<p.count;i++)u.setXY(i,r[0]+(r[2]-r[0])*(.5+p.getX(i)/s),r[1]+(r[3]-r[1])*(.5-p.getZ(i)/s));g.setAttribute('uv',u);return g;}
const lathe=(pts,seg,r)=>remap(new T.LatheGeometry(pts.map(([x,y])=>new T.Vector2(x,y)),seg),r);
const cache=new Map();const tpl=(k,f)=>{if(!cache.has(k))cache.set(k,f());return cache.get(k);};
const P='fairProp141';
// box whose every face shows rect r (optionally a different rect per face: [+x,-x,+y,-y,+z,-z])
function boxG(r,faces){const g=new T.BoxGeometry(1,1,1),u=g.attributes.uv;for(let f=0;f<6;f++){const q=faces?faces[f]:r;for(let i=f*4;i<f*4+4;i++)u.setXY(i,q[0]+(q[2]-q[0])*u.getX(i),q[1]+(q[3]-q[1])*u.getY(i));}return g;}
const H=(a,b=0)=>{let h=Math.imul(a|0,0x27d4eb2d)^Math.imul(b|0,0x165667b1);h^=h>>>15;h=Math.imul(h,0x85ebca6b);h^=h>>>13;return(h>>>0)/4294967296;};
const box=(b,r,x,y,z,w,h,d,ry=0,faces)=>b.add(tpl('box'+r.join()+(faces?faces.flat().join():''),()=>boxG(r,faces)),P,x,y,z,w,h,d,ry);
const STEEL=()=>R('steel'),WOOD=()=>sub(R('misc'),0,.5,.5,1),PROPANE=()=>sub(R('misc'),.5,.5,1,1),KETCH=()=>sub(R('misc'),0,0,.5,.5),MUST=()=>sub(R('misc'),.5,0,1,.5);
const BLACK=()=>sub(R('plastic'),.05,.05,.45,.95),WHITE=()=>sub(R('plastic'),.55,.05,.95,.95);

// ---------- templates ----------
const squeeze=c=>tpl('sq'+c,()=>{const g=lathe([[0,0],[.028,0],[.032,.02],[.032,.15],[.024,.17]],10,c==='k'?KETCH():MUST());return g;});
const squeezeCap=()=>tpl('sqc',()=>lathe([[.024,0],[.024,.012],[.012,.03],[.004,.06],[0,.062]],8,BLACK()));
function bottleSq(b,x,y,z,k){b.add(squeeze(k),P,x,y,z);b.add(squeezeCap(),P,x,y+.17,z);}
const propane=()=>tpl('pro',()=>lathe([[0,0],[.13,0],[.15,.04],[.15,.4],[.12,.47],[.05,.5],[.04,.56],[0,.56]],12,PROPANE()));
const collar=()=>tpl('col',()=>lathe([[.065,.5],[.07,.5],[.07,.6],[.065,.6]],10,STEEL()));
function tank(b,x,z){b.add(propane(),P,x,0,z);b.add(collar(),P,x,0,z);}
// cooler: moulded body (blue) + off-white lid with a handle
function cooler(b,x,y,z,ry,s=1){const body=sub(R('cooler'),0,0,.5,1),lid=sub(R('cooler'),.5,0,1,1),w=.62*s,d=.38*s,h=.36*s;
 b.push(x,y,z,ry);box(b,body,0,h/2,0,w,h,d);box(b,lid,0,h+.03,0,w+.02,.06,d+.02);box(b,lid,0,h+.08,0,w*.5,.03,.05);for(const sx of[-1,1])box(b,lid,sx*w*.25,h+.065,0,.03,.04,.05);b.pop();}
function tongs(b,x,y,z,ry){b.push(x,y,z,ry);for(const s of[-1,1])box(b,STEEL(),0,.008,s*.012,.3,.006,.012,s*.05);box(b,BLACK(),-.12,.012,0,.08,.02,.035);b.pop();}

// grill: trough of steel walls, ember bed, round-bar grate, skewers + sausages
function grill(b,w,z,top,seed){const gw=Math.min(1.3,w*.42),gd=.42,gx=-w*.2,h=.16,y=top;
 box(b,STEEL(),gx,y+.01,z,gw,.02,gd);for(const s of[-1,1]){box(b,STEEL(),gx,y+h/2,z+s*gd/2,gw,h,.015);box(b,STEEL(),gx+s*gw/2,y+h/2,z,.015,h,gd);}
 b.add(tpl('coal'+gw,()=>planar(new T.PlaneGeometry(gw-.03,gd-.03).rotateX(-PI/2),R('coals'),Math.max(gw,gd))),P,gx,y+.06,z);
 const bar=tpl('bar',()=>remap(new T.CylinderGeometry(.004,.004,1,5,1,true),STEEL()).rotateX(PI/2));
 for(let i=0;i<=Math.floor(gw/.05);i++)b.add(bar,P,gx-gw/2+.02+i*.05,y+h,z,1,1,gd);
 const stick=tpl('stk',()=>remap(new T.CylinderGeometry(.004,.004,1,4,1),WOOD()).rotateX(PI/2));
 const chunk=tpl('chk',()=>{const g=new T.IcosahedronGeometry(.022,0);const p=g.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,p.getY(i)*.8);g.computeVertexNormals();
  const u=new Float32Array(p.count*2),r=R('meat');for(let i=0;i<p.count;i++){const a=Math.atan2(p.getZ(i),p.getX(i))/(2*PI)+.5,t=p.getY(i)/.04+.5;u[i*2]=r[0]+(r[2]-r[0])*a;u[i*2+1]=r[1]+(r[3]-r[1])*t;}
  g.setAttribute('uv',new T.BufferAttribute(u,2));return g;});
 const ns=Math.floor((gw*.6)/.07);for(let i=0;i<ns;i++){const sx=gx-gw/2+.08+i*.07,ry=(H(seed,i)-.5)*.08;b.add(stick,P,sx,y+h+.025,z+.02,1,1,gd+.16,ry);
  for(let k=0;k<4;k++)b.add(chunk,P,sx+(H(seed,i*9+k)-.5)*.006,y+h+.026,z-.08+k*.055,1,1,1,H(seed,i*7+k)*6);}
 const saus=tpl('sau',()=>{const g=new T.CapsuleGeometry(.017,.15,3,8);remap(g,R('sausage'));return g.rotateZ(PI/2);});
 for(let i=0;i<4;i++)b.add(saus,P,gx+gw*.2+(i%2)*.02,y+h+.02,z-.15+i*.075,1,1,1,(H(seed,i+40)-.5)*.2);
 for(const[k,dx]of[['k',.2],['m',.27]])bottleSq(b,w*.5-dx-.15,top,z+.22,k);tongs(b,gx+gw/2+.2,top,z+.12,.3);
 tank(b,-w*.36,z-1.0);}

// steam: stock pot + bamboo steamer stacks + an open basket of bao
function steam(b,w,z,top,seed){
 const pot=tpl('pot',()=>lathe([[0,0],[.26,0],[.27,.02],[.27,.2],[.285,.21],[.285,.22],[.25,.22]],14,STEEL()));
 const wall=tpl('bw',()=>lathe([[.24,0],[.25,0],[.25,.1],[.24,.1],[.235,.09],[.235,.01]],14,R('bamboo')));
 const floor=tpl('bf',()=>planar(new T.CircleGeometry(.236,14).rotateX(-PI/2),sub(R('bamboo'),.1,.1,.9,.9),.48));
 const lid=tpl('bl',()=>lathe([[.25,0],[.24,.03],[.18,.07],[.06,.09],[.03,.1],[0,.1]],14,R('bamboo')));
 const bao=tpl('bao',()=>{const g=new T.SphereGeometry(.05,10,6,0,2*PI,0,PI/2);const p=g.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,p.getY(i)*.72);g.computeVertexNormals();return planar(g,R('bao'),.1);});
 for(const[k,sx]of[[0,-w*.3],[1,w*.0]]){const n=k?2:3;let y=top;if(!k){b.add(pot,P,sx,y,z);y+=.22;}
  for(let i=0;i<n;i++){b.add(wall,P,sx,y+i*.1,z,1,1,1,i);b.add(floor,P,sx,y+i*.1+.012,z);}
  if(k){const yy=y+(n-1)*.1+.012;for(let j=0;j<6;j++){const a=j/6*2*PI+.3;b.add(bao,P,sx+Math.cos(a)*.14,yy,z+Math.sin(a)*.14,1,1,1,a);}b.add(bao,P,sx,yy,z);
   b.add(lid,P,sx+.33,top,z+.12,1,1,1,0,1.25);}   // lid leaning on the stack
  else b.add(lid,P,sx,y+n*.1,z);}
 const board=sub(R('misc'),0,.5,.5,1);box(b,board,w*.3,top+.012,z+.05,.42,.024,.3);bottleSq(b,w*.3+.12,top+.024,z-.05,'k');
 cooler(b,w*.28,0,z-1.05,.2);}

// crêpe: two round griddles, crêpe, folded stack, batter jug, spreader
function crepe(b,w,z,top,seed){
 const plate=tpl('grd',()=>lathe([[0,0],[.17,0],[.205,.06],[.2,.07],[0,.07]],16,STEEL()));
 const cdisk=tpl('cd',()=>planar(new T.CircleGeometry(.19,16).rotateX(-PI/2),R('crepe'),.4));
 for(const s of[-1,1]){b.add(plate,P,s*w*.2,top,z-.03);}b.add(cdisk,P,-w*.2,top+.073,z-.03);
 const fold=tpl('cf',()=>{const g=new T.CylinderGeometry(.11,.11,.012,3,1,false,0,2*PI);return planar(g,R('crepe'),.24);});
 for(let i=0;i<5;i++)b.add(fold,P,w*.36,top+.006+i*.013,z+.16,1,1,1,i*.4+H(seed,i));
 const jug=tpl('jug',()=>lathe([[0,0],[.06,0],[.065,.1],[.055,.16],[.06,.18]],10,WHITE()));b.add(jug,P,w*.2+.27,top,z-.15);
 const t=tpl('spr',()=>remap(new T.CylinderGeometry(.005,.005,.16,5),WOOD()).rotateZ(PI/2));b.add(t,P,w*.2,top+.08,z+.12,1,1,1,.6);b.add(tpl('sprh',()=>remap(new T.CylinderGeometry(.006,.006,.12,5),WOOD()).rotateX(PI/2)),P,w*.2+.05,top+.08,z+.09,1,1,1,.6);
 bottleSq(b,-w*.42,top,z+.2,'m');bottleSq(b,-w*.42+.07,top,z+.2,'k');cooler(b,-w*.3,0,z-1.05,-.15);}

// fryer: steel body, oil, two wire baskets, paper cones of fries
function fry(b,w,z,top,seed){const fx=-w*.15,fw=.5,fd=.45,fh=.3;
 box(b,STEEL(),fx,top+fh/2,z-.03,fw,fh,fd);box(b,BLACK(),fx,top+fh-.015,z-.03,fw-.06,.01,fd-.06);
 for(const s of[-1,1]){const bx=fx+s*.12;for(const[x,zz,ww,dd]of[[0,.14,.2,.006],[0,-.14,.2,.006],[.1,0,.006,.28],[-.1,0,.006,.28]])box(b,STEEL(),bx+x,top+fh+.02,z-.03+zz,ww,.08,dd);
  b.add(tpl('fh',()=>remap(new T.CylinderGeometry(.008,.008,.3,5),BLACK()).rotateX(PI/2)),P,bx,top+fh+.07,z+.25,1,1,1,0,-.5);}
 const cone=tpl('cone',()=>lathe([[.0,0],[.045,.13],[.05,.135]],10,R('cone')));
 const fr=tpl('fr',()=>boxG(R('fries')));
 for(let i=0;i<5;i++){const cx=w*.12+i*.11,cz=z+.12+(i%2)*.08;b.add(cone,P,cx,top,cz);for(let k=0;k<6;k++)b.add(fr,P,cx+(H(seed,i*11+k)-.5)*.05,top+.15,cz+(H(seed,i*13+k)-.5)*.05,.009,.08,.009,H(seed,k+i)*3,(H(seed,i+k*3)-.5)*.5);}
 bottleSq(b,w*.42,top,z-.1,'k');bottleSq(b,w*.42-.07,top,z-.1,'m');tank(b,w*.3,z-1.05);}

// drinks: galvanised ice tub of cans, labelled bottles, dispenser
function drinks(b,w,z,top,seed){
 const tub=tpl('tub',()=>lathe([[0,0],[.2,0],[.24,.2],[.25,.21],[.24,.215],[.2,.02],[0,.02]],14,STEEL()));b.add(tub,P,-w*.25,top,z-.02);
 const can=k=>tpl('can'+k,()=>{const r=sub(R('cans'),0,(3-k)/4,1,(4-k)/4);return lathe([[0,0],[.028,0],[.033,.012],[.033,.11],[.028,.122],[.0,.122]],10,r);});
 for(let i=0;i<9;i++){const a=i*2.4,rr=.06+(i%3)*.05;b.add(can(i%4),P,-w*.25+Math.cos(a)*rr,top+.07,z-.02+Math.sin(a)*rr,1,1,1,a,(H(seed,i)-.5)*.6,(H(seed,i+9)-.5)*.6);}
 const bot=k=>tpl('bt'+k,()=>{const r=sub(R('bottles'),0,(3-k)/4,1,(4-k)/4);return lathe([[0,0],[.033,0],[.034,.15],[.022,.19],[.013,.21],[.013,.235],[0,.235]],10,r);});
 for(let i=0;i<8;i++)b.add(bot(i%4),P,w*.02+i*.075,top,z+.18,1,1,1,(H(seed,i)-.5)*.6);
 const disp=tpl('dsp',()=>lathe([[0,0],[.15,0],[.15,.42],[.13,.45],[0,.46]],14,STEEL()));b.add(disp,P,w*.32,top,z-.12);
 box(b,BLACK(),w*.32,top+.08,z+.04,.04,.04,.06);cooler(b,-w*.25,0,z-1.05,.1);cooler(b,-w*.25,.42,z-1.05,.15,.85);}

// fruit: tilted orchard crates filled with modelled fruit; stamped crates stacked under the table
const KINDS=[['apple','orange'],['lemon','banana'],['apple','lemon'],['orange','banana']];
function crate(b,x,y,z,w,d,h,tilt,ry=0){b.push(x,y,z,ry);const sl=R('slat'),st=R('crate');
 const g=tpl('cr'+w+d+h,()=>{const parts=[];const add=(px,py,pz,sx,sy,sz,r)=>{const q=boxG(r);q.scale(sx,sy,sz);q.translate(px,py,pz);parts.push(q);};
  add(0,.006,0,w,.012,d,sl);for(const s of[-1,1]){add(0,h*.3,s*(d/2-.006),w,h*.4,.012,st);add(0,h*.82,s*(d/2-.006),w,h*.3,.012,sl);add(s*(w/2-.006),h/2,0,.012,h,d-.024,sl);}
  return mergeLite(parts);});
 b.add(g,P,0,0,0,1,1,1,0,tilt);b.pop();}
function mergeLite(parts){const n=parts.reduce((a,g)=>a+g.index.count,0),p=new Float32Array(n*3),nr=new Float32Array(n*3),u=new Float32Array(n*2);let o=0;
 for(const g0 of parts){const g=g0.toNonIndexed(),P_=g.attributes.position,N=g.attributes.normal,U=g.attributes.uv;p.set(P_.array,o*3);nr.set(N.array,o*3);u.set(U.array,o*2);o+=P_.count;g.dispose();g0.dispose();}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(p,3));g.setAttribute('normal',new T.BufferAttribute(nr,3));g.setAttribute('uv',new T.BufferAttribute(u,2));return g;}
function fruit(b,w,z,top,seed){const n=Math.max(2,Math.floor(w/1.05)),cw=Math.min(.6,(w-.4)/n-.06),cd=.4,h=.16,tilt=.32;
 const proxy={mats:{r138p140f:1},add:(g,k,...a)=>b.add(g,'fairFruit141',...a)};
 for(let i=0;i<n;i++){const cx=-w/2+.25+cw/2+i*(cw+.06),kinds=KINDS[(seed+i)%4];
  const c=Math.cos(tilt),s=Math.sin(tilt),y0=top+cd/2*s+.004;crate(b,cx,y0,z,cw,cd,h,tilt);
  box(b,R('slat'),cx,top+(cd/2*s)/1.2,z-cd*.3,cw*.9,cd*s/.6*.5,.08);   // wooden riser under the back
  // the crate floor runs from its front edge up to the back, tilted by `tilt` (front down toward the walking strip)
  const zF=z+cd/2*c-.02,yF=y0+.012-cd/2*s+.012,zB=z-cd/2*c+.02,yB=y0+.012+cd/2*s+.012;
  pile140(proxy,()=>H(seed*31+i,proxy.k=(proxy.k|0)+1),kinds,cx-cw/2+.015,cx+cw/2-.015,zF,yF,zB,yB,{sections:2,shuffle:false});
  b.add(tpl('tag',()=>boxG(WHITE())),P,cx,top+.02+h+.08,z+cd/2+.02,.12,.07,.006,0,-.3);}
 for(let i=0;i<3;i++)crate(b,-w*.3+(i%2)*.62,(i>>1)*.2,z-1.05,.56,.38,.2,0,(H(seed,i)-.5)*.1);}

const FOOD={grill,steam,crepe,fry,drinks,fruit};
export const isFood141=k=>k in FOOD;
/** goods on the counter/table top (stall frame: front +z, table centre z) */
export function goods141(b,kind,w,z,seed,top=.78){addFair141Materials(b.mats);FOOD[kind](b,w,z,top,seed);}

/** folding table under a draped cloth: top + four skirt panels with soft folds, plastic top edge, steel legs hidden */
export function table141(b,w,z,seed,cloth){addFair141Materials(b.mats);const tw=w-.3,td=.76,ty=.78,drop=.62,TILE=.42;
 const key=cloth||'fairGing141',pos=[],uv=[],nr=[];
 const v=(x,y,zz,u,t,n)=>{pos.push(x,y,zz);uv.push(u,t);nr.push(...n);};
 // top
 const tq=[[-tw/2,ty,td/2],[tw/2,ty,td/2],[tw/2,ty,-td/2],[-tw/2,ty,-td/2]];for(const i of[0,1,2,0,2,3])v(tq[i][0],ty,tq[i][2],tq[i][0]/TILE,tq[i][2]/TILE,[0,1,0]);
 // skirt: per side, strips every ~6 cm, fold depth grows toward the hem
 const sides=[[[-tw/2,td/2],[tw/2,td/2],[0,0,1]],[[tw/2,-td/2],[-tw/2,-td/2],[0,0,-1]],[[tw/2,td/2],[tw/2,-td/2],[1,0,0]],[[-tw/2,-td/2],[-tw/2,td/2],[-1,0,0]]];
 let s0=0;for(const[[ax,az],[cx,cz],n]of sides){const L=Math.hypot(cx-ax,cz-az),m=Math.max(4,Math.round(L/.06));
  const f=(t,k)=>{const fold=Math.sin(t*L/.16*PI+H(seed,k)*6)*.018*k+.01*k;return[ax+(cx-ax)*t+n[0]*fold,az+(cz-az)*t+n[2]*fold];};
  for(let i=0;i<m;i++){const t0=i/m,t1=(i+1)/m;const r=[[f(t0,0),ty],[f(t1,0),ty],[f(t1,1),ty-drop],[f(t0,1),ty-drop]];
   const U=[s0+t0*L,s0+t1*L,s0+t1*L,s0+t0*L].map(q=>q/TILE),Vv=[0,0,drop/TILE,drop/TILE];
   for(const j of[0,2,1,0,3,2])v(r[j][0][0],r[j][1],r[j][0][1],U[j],-Vv[j],n);}
  s0+=L;}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('normal',new T.Float32BufferAttribute(nr,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
 g.computeVertexNormals();b.add(g,key,0,0,z);g.dispose();}
