// V102 · Level 11 "Satellite" / "Hybrid" raster: a fake low-resolution aerial photo.
// The city is painted procedurally at low resolution (0.6 m/px at best, coarser when
// zoomed out) with roof variety, rooftop plant, cars, trees and sun shadows, then put
// through an optics blur, colour grade, sensor grain, imagery-mosaic mottling and a
// real 8x8 DCT JPEG round trip (4:2:0 chroma). The raster is anchored to a world grid
// so the block artifacts do not swim while panning, cached, and bilinearly upscaled.
import {CITY_BLOCK,cityToWorld,worldToCity,cityBlockPlan,cityDistrict} from './urban-layout.js?v=return-1';
import {BUILDING_TYPES} from './urban-buildings.js?v=60';
import {exitPoint} from './exit-route.js?v=60';

const O=cityToWorld(0,0),E=cityToWorld(1,0),CA=E.x-O.x,SA=O.z-E.z;
const SUN=[-.6,-.8],LEAN=[.18,-.98],SHADOW_K=.55,LEAN_K=.045;
const hash=(a,b,s=0)=>{let h=Math.imul(a|0,374761393)^Math.imul(b|0,668265263)^Math.imul(s|0,1274126177);h=Math.imul(h^h>>>13,1103515245);h^=h>>>16;return(h>>>0)/4294967296;};
const pick=(arr,u)=>arr[Math.min(arr.length-1,Math.floor(u*arr.length))];
const shade=(hex,k)=>{const n=parseInt(hex.slice(1),16),f=v=>Math.max(0,Math.min(255,Math.round(v*k)));return`rgb(${f(n>>16)},${f(n>>8&255)},${f(n&255)})`;};
const mul=(M,N)=>[M[0]*N[0]+M[2]*N[1],M[1]*N[0]+M[3]*N[1],M[0]*N[2]+M[2]*N[3],M[1]*N[2]+M[3]*N[3],M[0]*N[4]+M[2]*N[5]+M[4],M[1]*N[4]+M[3]*N[5]+M[5]];
const ap=(K,u,v)=>[K[0]*u+K[2]*v+K[4],K[1]*u+K[3]*v+K[5]];
function hull(p){p.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]),lo=[],up=[];for(const q of p){while(lo.length>1&&cr(lo[lo.length-2],lo[lo.length-1],q)<=0)lo.pop();lo.push(q);}for(let i=p.length-1;i>=0;i--){const q=p[i];while(up.length>1&&cr(up[up.length-2],up[up.length-1],q)<=0)up.pop();up.push(q);}return lo.slice(0,-1).concat(up.slice(0,-1));}
const poly=(g,pts)=>{g.beginPath();pts.forEach((q,k)=>k?g.lineTo(q[0],q[1]):g.moveTo(q[0],q[1]));g.closePath();g.fill();};

const ROOF={gravel:['#8f8b82','#9b978d','#827f78','#a19c90'],white:['#c6c5bf','#bbbcb7','#d2d0c8'],tar:['#4f4c47','#5b5751','#46443f'],tan:['#a89b82','#9d9079','#b0a58d'],red:['#8e5545','#7e4b3d','#9a6350'],copper:['#5f7c6c','#6a8574'],glass:['#3a4048','#444b53','#353b42'],metal:['#a7abac','#9aa0a2','#b3b5b2']};
const CARS=['#e8e8e4','#e8e8e4','#d9dadb','#b9bcbe','#a2a5a8','#2a2b2e','#1d1e21','#3b3e44','#7a2320','#9c2a22','#24406e','#2d4f80','#6d6a5e','#3d5a3a','#c9b48a'];
const LOW=new Set(['strip_mall','two_story_shops','clinic','bakery','travel_agency','photo_studio','corner_market','laundromat','bank_branch','auto_shop','steel_prefab','research_lab']);

function roofStyle(b,u){
 const t=b.type||'';
 if(t==='parking_garage')return{kind:'garage',col:'#5d5d58',fac:'#7a7871'};
 if(t==='black_glass_setback')return{kind:'setback',col:pick(ROOF.glass,u),fac:'#2b333c'};
 if(t==='international_tower'||t==='international_slab')return{kind:'tower',col:pick(u<.5?ROOF.white:ROOF.gravel,u*2%1),fac:'#39424b'};
 if(t==='brutalist_slab'||t==='precast_tower')return{kind:'tower',col:pick(ROOF.gravel,u),fac:'#807d75'};
 if(t==='postmodern_crown')return{kind:'crown',col:pick(u<.5?ROOF.red:ROOF.copper,u*2%1),fac:'#8a7f70'};
 if(t==='art_deco_tower')return{kind:'deco',col:pick(ROOF.tan,u),fac:'#8f8572'};
 if(t==='terraced_office'||t==='stepped_hotel')return{kind:'terrace',col:pick(ROOF.white,u),fac:'#7d7b74'};
 if(t==='office_podium')return{kind:'podium',col:pick(ROOF.gravel,u),fac:'#6f747a'};
 if(t==='brick_walkup')return{kind:'walkup',col:pick(u<.65?ROOF.tar:ROOF.gravel,u*1.5%1),fac:'#6b4a3c'};
 if(t==='steel_prefab'||t==='auto_shop')return{kind:'metal',col:pick(ROOF.metal,u),fac:'#8e9192'};
 if(t==='strip_mall'||t==='research_lab'||t==='clinic')return{kind:'flat',col:pick(u<.6?ROOF.white:ROOF.gravel,u*1.7%1),fac:'#8b877d'};
 const fam=u<.3?ROOF.gravel:u<.5?ROOF.tan:u<.66?ROOF.tar:u<.8?ROOF.red:ROOF.white;
 return{kind:fam===ROOF.red&&u>.72?'pitched':'flat',col:pick(fam,u*7%1),fac:'#86796a'};
}

let cache={key:'',cv:null},shadowCv=null;
export function paintSatellite(target,ox,oz,w,h,scale,shapes=[]){
 const ds=Math.max(2.5,.6*scale),pm=ds/scale,S=32*pm,left=ox-w/2/scale,top=oz-h/2/scale;
 const X0=Math.floor(left/S)*S-S,Z0=Math.floor(top/S)*S-S,LW=Math.ceil((w/ds+96)/16)*16,LH=Math.ceil((h/ds+96)/16)*16;
 const key=[Math.round(X0/pm),Math.round(Z0/pm),pm.toFixed(5),LW,LH,shapes.length].join('|');
 if(cache.key!==key){
  const cv=cache.cv||document.createElement('canvas');if(cv.width!==LW||cv.height!==LH){cv.width=LW;cv.height=LH;}
  const t0=performance.now();render(cv.getContext('2d',{willReadFrequently:true}),X0,Z0,pm,LW,LH,shapes);cache={key,cv,ms:performance.now()-t0};
  if(typeof window!=='undefined')window.__gmSatMs=cache.ms;
 }
 target.save();target.imageSmoothingEnabled=true;target.imageSmoothingQuality='low';
 target.drawImage(cache.cv,(X0-left)*scale,(Z0-top)*scale,LW*ds,LH*ds);target.restore();
}

function render(g,X0,Z0,pm,LW,LH,shapes){
 const M=[CA/pm,-SA/pm,SA/pm,CA/pm,(O.x-X0)/pm,(O.z-Z0)/pm],W=[1/pm,0,0,1/pm,-X0/pm,-Z0/pm];
 const setM=(ctx,K,dx=0,dy=0)=>ctx.setTransform(K[0],K[1],K[2],K[3],K[4]+dx,K[5]+dy);
 const fine=pm<1.25,mid=pm<2.2;
 g.setTransform(1,0,0,1,0,0);g.fillStyle='#4b4c4a';g.fillRect(0,0,LW,LH);
 // visible city blocks
 let a=1e9,b=-1e9,c=1e9,d=-1e9;for(const[x,z]of[[X0,Z0],[X0+LW*pm,Z0],[X0,Z0+LH*pm],[X0+LW*pm,Z0+LH*pm]]){const p=worldToCity(x,z);a=Math.min(a,p.x);b=Math.max(b,p.x);c=Math.min(c,p.z);d=Math.max(d,p.z);}
 const ix0=Math.floor(a/CITY_BLOCK)-1,ix1=Math.floor(b/CITY_BLOCK)+1,iz0=Math.floor(c/CITY_BLOCK)-1,iz1=Math.floor(d/CITY_BLOCK)+1;
 const trees=[],cars=[],builds=[];
 setM(g,M);
 for(let iz=iz0;iz<=iz1;iz++)for(let ix=ix0;ix<=ix1;ix++){
  const x=ix*CITY_BLOCK,z=iz*CITY_BLOCK,dist=cityDistrict(x+56,z+56),u=hash(ix,iz,7);
  // roads owned by this block: top edge (along x) and left edge (along z)
  for(let k=0;k<3;k++){const r=hash(ix,iz,40+k);if(r<.5){g.fillStyle=r<.25?'#434442':'#525350';const along=hash(ix,iz,50+k)*70+16,len=4+r*14;if(k&1)g.fillRect(x-7+hash(ix,iz,60+k)*8,z+along,3+r*4,len);else g.fillRect(x+along,z-7+hash(ix,iz,60+k)*8,len,3+r*4);}}
  // sidewalk ring + lot
  g.fillStyle='#a5a297';g.fillRect(x+7.5,z+7.5,97,97);
  g.fillStyle='#8f8d86';g.fillRect(x+7.5,z+7.5,97,.5);g.fillRect(x+7.5,z+7.5,.5,97);g.fillRect(x+7.5,z+104,97,.5);g.fillRect(x+104,z+7.5,.5,97);
  const lot={commercial:'#8d897c',mixed:'#878476',core:'#8a877f',warehouse:'#9a978d',civic:'#5c6b40'}[dist]||'#878476';
  g.fillStyle=lot;g.fillRect(x+12,z+12,88,88);
  // interior courtyard (34..78 × 36..76)
  const yard=dist==='civic'?'park':dist==='warehouse'?'trucks':u<(dist==='core'?.42:.7)?'parking':u<.86?'plaza':'garden';
  if(yard==='park'){
   g.fillStyle='#667845';g.fillRect(x+30,z+32,52,48);g.fillStyle='#55663a';for(let k=0;k<6;k++){const r=hash(ix,iz,90+k);g.beginPath();g.ellipse(x+34+r*44,z+36+hash(ix,iz,99+k)*40,4+r*7,3+r*5,r*3,0,7);g.fill();}
   g.strokeStyle='#b6aa8c';g.lineWidth=1.6;g.beginPath();g.moveTo(x+30,z+56);g.quadraticCurveTo(x+56,z+46+u*20,x+82,z+56);g.moveTo(x+56,z+32);g.lineTo(x+56,z+80);g.stroke();
   if(u>.55){g.fillStyle='#3c5a63';g.beginPath();g.ellipse(x+56,z+56,6,4.5,0,0,7);g.fill();g.fillStyle='#b9b4a6';g.beginPath();g.arc(x+56,z+56,1.4,0,7);g.fill();}
   for(let k=0;k<22;k++){const r=hash(ix,iz,200+k),tx=x+33+r*46,tz=z+35+hash(ix,iz,240+k)*42;if(Math.abs(tx-x-56)<3||Math.abs(tz-z-56)<7&&u>.55)continue;trees.push([tx,tz,2.2+hash(ix,iz,280+k)*2.2]);}
  }else if(yard==='parking'){
   g.fillStyle='#585955';g.fillRect(x+34,z+36,44,40);
   g.fillStyle='#d9d7cc';const rows=[37,47.4,52.6,63];
   for(const r0 of rows){for(let s=0;s<=16;s++)g.fillRect(x+35+s*2.6,z+r0,.14,5.2);for(let s=0;s<16;s++)if(hash(ix*31+s,iz,r0*10|0)<.62)cars.push([x+36.3+s*2.6,z+r0+2.6,1.85,4.4,hash(ix*17+s,iz*13,r0|0)]);}
   if(fine){g.fillStyle='#f2efe2';g.fillRect(x+56,z+43.5,.2,3);g.fillRect(x+56,z+59.5,.2,3);}
  }else if(yard==='trucks'){
   g.fillStyle='#a19e93';g.fillRect(x+34,z+36,44,40);g.fillStyle='#8e8b81';for(let s=0;s<8;s++)g.fillRect(x+36+s*5,z+38,.2,14);
   for(let s=0;s<7;s++)if(hash(ix,iz,300+s)<.55){cars.push([x+38.5+s*5,z+44,2.5,12,.0001+hash(ix,iz,310+s)*.08,'trailer']);}
   for(let s=0;s<3;s++)if(hash(ix,iz,320+s)<.6)cars.push([x+40+s*12,z+66,1.9,4.6,hash(ix,iz,330+s)]);
  }else if(yard==='plaza'){
   g.fillStyle='#b3ada0';g.fillRect(x+34,z+36,44,40);g.fillStyle='#a39d90';for(let s=0;s<11;s++)g.fillRect(x+34+s*4,z+36,.25,40);for(let s=0;s<10;s++)g.fillRect(x+34,z+36+s*4,44,.25);
   g.fillStyle='#7d8b57';for(const[px,pz]of[[40,42],[72,42],[40,70],[72,70]]){g.fillRect(x+px-3,z+pz-3,6,6);trees.push([x+px,z+pz,2.6+hash(ix+px,iz,pz)*1.4]);}
   if(u>.78){g.fillStyle='#e5e3d8';g.beginPath();g.arc(x+56,z+56,3,0,7);g.fill();g.fillStyle='#6d8f9a';g.beginPath();g.arc(x+56,z+56,2.1,0,7);g.fill();}
  }else{
   g.fillStyle='#6b7a47';g.fillRect(x+34,z+36,44,40);g.fillStyle='#8d846d';g.fillRect(x+34,z+54,44,3);
   for(let k=0;k<9;k++)trees.push([x+37+hash(ix,iz,400+k)*38,z+39+hash(ix,iz,410+k)*34,2+hash(ix,iz,420+k)*2]);
  }
  // road markings, crosswalks, traffic and curbside parking
  const tp={core:.35,mixed:.5,civic:.85,commercial:.28,warehouse:.08}[dist]??.4;
  for(const axis of[0,1]){
   const P=(along,off)=>axis?[x+off,z+along]:[x+along,z+off],R=(along,off,la,lo)=>{const[p,q]=P(along,off);axis?g.fillRect(p-lo/2,q-la/2,lo,la):g.fillRect(p-la/2,q-lo/2,la,lo);};
   g.fillStyle='#b8a65a';for(let s=14;s<98;s+=6)R(s+1.5,-.2,3,.22),R(s+1.5,.2,3,.22);
   g.fillStyle='#dcdad0';for(const e of[8,100.5])for(let k=-6.5;k<=6.5;k+=1.3)R(e+1.75,k,3.5,.5);
   g.fillStyle='#d0cec3';R(13.2,-3.6,.35,7.2);R(98.8,3.6,.35,7.2);
   for(let s=0;s<6;s++){const r=hash(ix*5+axis,iz*7,500+s);if(r<.55)cars.push([...P(18+s*13+hash(ix,iz,510+s+axis*9)*6,r<.27?-3.4:3.4),...(axis?[1.85,4.5]:[4.5,1.85]),hash(ix,iz,520+s+axis*9)]);}
   if(dist!=='warehouse')for(let s=0;s<14;s++){const r=hash(ix*3+axis,iz*11,600+s);if(r<.45)cars.push([...P(16+s*5.9,r<.22?-6.3:6.3),...(axis?[1.8,4.3]:[4.3,1.8]),hash(ix,iz,620+s+axis*17)]);}
   for(let s=16;s<98;s+=8.5){if(hash(ix*7+axis,iz*3,s*10|0)<tp)trees.push([...P(s,9.8),1.9+hash(ix,iz,s|0)*1.3]);if(hash(ix*7+axis,iz*3,s*10+5|0)<tp)trees.push([...P(s+3,-9.8+CITY_BLOCK*0),1.9]);}
  }
  for(const q of cityBlockPlan(ix,iz,BUILDING_TYPES).buildings)builds.push({b:q,K:mul(M,[Math.cos(q.ry),-Math.sin(q.ry),Math.sin(q.ry),Math.cos(q.ry),q.x,q.z]),hgt:(q.floors||2)*3.4+1});
 }
 // the street trees at offset -9.8 were placed in the road's other half: drop those that sit on asphalt
 for(let i=trees.length-1;i>=0;i--){const[tx,tz]=trees[i],fx=((tx%CITY_BLOCK)+CITY_BLOCK)%CITY_BLOCK,fz=((tz%CITY_BLOCK)+CITY_BLOCK)%CITY_BLOCK;if(Math.min(fx,CITY_BLOCK-fx)<7.6||Math.min(fz,CITY_BLOCK-fz)<7.6)trees.splice(i,1);}
 for(const q of shapes)builds.push({b:{...q,type:'',seed:Math.round(q.x*7+q.z*13)},K:mul(W,[Math.cos(q.ry),-Math.sin(q.ry),Math.sin(q.ry),Math.cos(q.ry),q.x,q.z]),hgt:q.h||12});
 // exit route (world coordinates) as a wide asphalt boulevard
 setM(g,W);g.lineJoin='round';g.lineCap='round';const route=[];for(let s=110;s<=430;s+=6){const p=exitPoint(s);route.push([p.x,p.z]);}
 const stroke=(lw,col,dash=[])=>{g.strokeStyle=col;g.lineWidth=lw;g.setLineDash(dash);g.beginPath();route.forEach((p,k)=>k?g.lineTo(...p):g.moveTo(...p));g.stroke();};
 stroke(20,'#9c998f');stroke(17,'#484947');stroke(.3,'#d8d6cc',[3,6]);g.setLineDash([]);

 // ---- shadows: one opaque layer composited once, so overlaps never double up
 const sh=shadowCv||(shadowCv=document.createElement('canvas'));if(sh.width!==LW||sh.height!==LH){sh.width=LW;sh.height=LH;}
 const s=sh.getContext('2d');s.setTransform(1,0,0,1,0,0);s.clearRect(0,0,LW,LH);s.fillStyle='#000';
 for(const o of builds){const{b,K}=o,L=o.hgt*SHADOW_K/pm,sx=SUN[0]*L,sy=SUN[1]*L,pts=[];for(const[u,v]of[[-1,-1],[1,-1],[1,1],[-1,1]]){const p=ap(K,u*b.w/2,v*b.d/2);pts.push(p,[p[0]+sx,p[1]+sy]);}poly(s,hull(pts));}
 const shiftM=(ctx,h)=>setM(ctx,M,SUN[0]*h*SHADOW_K/pm,SUN[1]*h*SHADOW_K/pm);
 shiftM(s,7);for(const t of trees){s.beginPath();s.arc(t[0],t[1],t[2]*.9,0,7);s.fill();}
 shiftM(s,1.5);for(const q of cars)s.fillRect(q[0]-q[2]/2,q[1]-q[3]/2,q[2],q[3]);
 g.setTransform(1,0,0,1,0,0);g.globalAlpha=.55;g.drawImage(sh,0,0);g.globalAlpha=1;
 // ---- cars
 setM(g,M);
 for(const q of cars){const[cx,cz,cw,cl,u,kind]=q;g.fillStyle=kind==='trailer'?(u<.04?'#d8d8d4':'#c9cbc8'):pick(CARS,u);g.fillRect(cx-cw/2,cz-cl/2,cw,cl);
  if(fine&&!kind){g.fillStyle='rgba(20,24,30,.75)';const vert=cl>cw;if(vert){const f=u<.5?-1:1;g.fillRect(cx-cw/2+.25,cz+f*cl*.12-.55,cw-.5,1.1);}else{const f=u<.5?-1:1;g.fillRect(cx+f*cl*.12-.55,cz-cw/2+.25,1.1,cw-.5);}}}
 // ---- buildings, low to high so tall facades lean over their neighbours
 builds.sort((p,q)=>p.hgt-q.hgt);
 for(const o of builds){
  const{b,K}=o,u=hash(b.seed|0,7,3),st=roofStyle(b,u),L=o.hgt*LEAN_K/pm,lx=LEAN[0]*L,ly=LEAN[1]*L,hw=b.w/2,hd=b.d/2;
  if(L>.35){const pts=[];for(const[uu,vv]of[[-1,-1],[1,-1],[1,1],[-1,1]]){const p=ap(K,uu*hw,vv*hd);pts.push(p,[p[0]+lx,p[1]+ly]);}g.setTransform(1,0,0,1,0,0);g.fillStyle=st.fac;poly(g,hull(pts));
   if(fine&&o.hgt>20){g.strokeStyle='rgba(15,18,22,.35)';g.lineWidth=.5;const n=Math.min(40,Math.floor(o.hgt/3.4));for(let f=1;f<n;f+=2){const t=f/n;g.beginPath();const A=ap(K,-hw,hd),B=ap(K,hw,hd);g.moveTo(A[0]+lx*t,A[1]+ly*t);g.lineTo(B[0]+lx*t,B[1]+ly*t);g.stroke();}}}
  setM(g,K,lx,ly);
  const kb=.92+hash(b.seed|0,11,5)*.16;g.fillStyle=shade(st.col.startsWith('#')?st.col:'#888888',kb);g.fillRect(-hw,-hd,b.w,b.d);
  // parapet: lit edge toward the sun, dark edge away
  if(mid){g.fillStyle='rgba(255,255,255,.18)';g.fillRect(-hw,hd-.6,b.w,.6);g.fillRect(hw-.6,-hd,.6,b.d);g.fillStyle='rgba(0,0,0,.22)';g.fillRect(-hw,-hd,b.w,.6);g.fillRect(-hw,-hd,.6,b.d);}
  const inv=(()=>{const T=g.getTransform(),det=T.a*T.d-T.b*T.c;return(vx,vy)=>[(T.d*vx-T.c*vy)/det,(-T.b*vx+T.a*vy)/det];})();
  const box=(x,z,bw,bd,h,col)=>{const sv=inv(SUN[0]*h*SHADOW_K/pm,SUN[1]*h*SHADOW_K/pm);g.fillStyle='rgba(0,0,0,.32)';g.fillRect(x-bw/2+sv[0],z-bd/2+sv[1],bw,bd);g.fillStyle=col;g.fillRect(x-bw/2,z-bd/2,bw,bd);};
  const r=k=>hash(b.seed|0,k,9);
  if(st.kind==='garage'){g.fillStyle='#e4e2d6';for(let k=-hw+1;k<hw-1;k+=2.6){g.fillRect(k,-hd+1,.12,5);g.fillRect(k,hd-6,.12,5);}for(let k=0;k*2.6<b.w-3;k++){if(r(k)<.55)g.fillStyle=pick(CARS,r(k+50)),g.fillRect(-hw+1.4+k*2.6,-hd+1.5,1.8,4.2);if(r(k+20)<.45)g.fillStyle=pick(CARS,r(k+70)),g.fillRect(-hw+1.4+k*2.6,hd-5.7,1.8,4.2);}box(hw-4,0,3,4,3,'#8a8780');}
  else if(st.kind==='tower'||st.kind==='setback'||st.kind==='podium'){
   if(st.kind==='setback'){g.fillStyle=shade(st.col,1.25);g.fillRect(-hw*.72,-hd*.72,b.w*.72,b.d*.72);g.fillStyle=shade(st.col,1.5);g.fillRect(-hw*.45,-hd*.45,b.w*.45,b.d*.45);}
   if(st.kind==='podium'){g.fillStyle='#5e7040';g.fillRect(-hw+2,-hd+2,b.w*.45,b.d-4);g.fillStyle='#4a5a34';for(let k=0;k<4;k++){g.beginPath();g.arc(-hw+4+r(k)*b.w*.38,-hd+3+r(k+9)*(b.d-6),1.3,0,7);g.fill();}}
   box(b.w*.12,0,Math.min(9,b.w*.34),Math.min(8,b.d*.32),4,shade(st.col,1.18));
   if(mid)for(let k=0;k<3+r(1)*5;k++)box(-hw+2.5+r(k+2)*(b.w-5),-hd+2+r(k+12)*(b.d-4),1.6,1.2,1,'#c8c6bd');
   if(fine&&r(30)<.3&&b.w>16&&b.d>16){g.strokeStyle='#e8e6da';g.lineWidth=.5;g.beginPath();g.arc(-hw*.45,0,3.6,0,7);g.stroke();g.fillStyle='#e8e6da';g.fillRect(-hw*.45-1.2,-1.5,.45,3);g.fillRect(-hw*.45+.75,-1.5,.45,3);g.fillRect(-hw*.45-1.2,-.2,2.4,.4);}
   if(fine&&r(31)<.45){g.fillStyle='#d4d2c8';for(let k=0;k<3;k++){g.beginPath();g.arc(hw-2.5,-hd+2.5+k*2.2,.7,0,7);g.fill();}}
  }else if(st.kind==='crown'||st.kind==='deco'){
   const n=st.kind==='deco'?3:1;for(let k=1;k<=n;k++){const f=1-k*.22;g.fillStyle=shade(st.col,1+k*.12);g.fillRect(-hw*f,-hd*f,b.w*f,b.d*f);}
   const f=st.kind==='deco'?.34:1,ax=hw*f,az=hd*f,tri=(p,col)=>{g.fillStyle=col;g.beginPath();g.moveTo(...p[0]);g.lineTo(...p[1]);g.lineTo(0,0);g.closePath();g.fill();};
   const sl=inv(-SUN[0],-SUN[1]),lit=(nx,nz)=>nx*sl[0]+nz*sl[1]>0;
   tri([[-ax,-az],[ax,-az]],shade(st.col,lit(0,-1)?1.3:.72));tri([[ax,-az],[ax,az]],shade(st.col,lit(1,0)?1.3:.72));tri([[ax,az],[-ax,az]],shade(st.col,lit(0,1)?1.3:.72));tri([[-ax,az],[-ax,-az]],shade(st.col,lit(-1,0)?1.3:.72));
  }else if(st.kind==='terrace'){
   for(let k=1;k<=3;k++){const f=1-k*.2;g.fillStyle=k===2&&u<.5?'#68794a':shade(st.col,1+k*.07);g.fillRect(-hw*f,-hd,b.w*f,b.d*f+hd*(1-f));}
   if(mid)box(0,-hd*.5,3,3,3,'#bdbbb2');
  }else if(st.kind==='walkup'){
   if(mid){const tx=-hw*.4+r(3)*hw*.8,tz=-hd*.3+r(4)*hd*.6,sv=inv(SUN[0]*6/pm,SUN[1]*6/pm);g.fillStyle='rgba(0,0,0,.35)';g.beginPath();g.arc(tx+sv[0],tz+sv[1],1.6,0,7);g.fill();g.fillStyle='#7a5e43';g.beginPath();g.arc(tx,tz,1.6,0,7);g.fill();g.fillStyle='#5e4632';g.beginPath();g.arc(tx,tz,.7,0,7);g.fill();}
   box(hw*.6,hd*.55,1.6,1.6,1.5,'#857f74');if(fine){box(-hw*.7,-hd*.6,.9,.9,2,'#7a3f30');box(-hw*.7+1.3,-hd*.6,.9,.9,2,'#7a3f30');}
  }else if(st.kind==='metal'){
   g.fillStyle='rgba(0,0,0,.12)';for(let k=-hw;k<hw;k+=1.1)g.fillRect(k,-hd,.35,b.d);g.fillStyle='rgba(255,255,255,.25)';g.fillRect(-hw,-.25,b.w,.5);
   if(mid)for(let k=0;k<3;k++)g.fillStyle='rgba(205,220,225,.75)',g.fillRect(-hw+3+k*(b.w-6)/3,-hd*.6,1.4,hd*1.2);
  }else if(st.kind==='pitched'){
   g.fillStyle=shade(st.col,.78);g.fillRect(-hw,-hd,b.w,hd);g.fillStyle='rgba(255,255,255,.2)';g.fillRect(-hw,-.2,b.w,.4);
   if(fine){g.fillStyle='rgba(0,0,0,.1)';for(let k=-hd;k<hd;k+=.8)g.fillRect(-hw,k,b.w,.18);}
  }else{
   if(r(40)<.2&&mid){g.fillStyle='#22324e';const cols=Math.max(1,Math.floor((b.w-4)/2.4)),rows2=Math.max(1,Math.floor((b.d-4)/4));for(let i=0;i<cols;i++)for(let j=0;j<rows2;j++){g.fillRect(-hw+2+i*2.4,-hd+2+j*4,2.1,3.4);}if(fine){g.fillStyle='rgba(160,180,210,.35)';for(let i=0;i<cols;i++)g.fillRect(-hw+2+i*2.4,-hd+2,.15,rows2*4);}}
   else if(mid){const n=Math.max(1,Math.round(b.w*b.d/140));for(let k=0;k<n;k++)box(-hw+2+r(k+2)*(b.w-4),-hd+2+r(k+22)*(b.d-4),1.6+r(k+40),1.2+r(k+41),1.2,r(k+60)<.7?'#cfcdc5':'#7d7b75');
    if(r(41)<.35){g.fillStyle='rgba(190,215,225,.8)';for(let k=0;k<3;k++)g.fillRect(-hw*.5+k*hw*.45,-.8,1.4,1.6);}}
   if(fine&&r(42)<.25){g.fillStyle='#e0ded6';g.beginPath();g.arc(hw-1.6,hd-1.6,.6,0,7);g.fill();}
   if(fine&&r(43)<.12){g.fillStyle='#4f6a3a';g.fillRect(-hw+1.5,-hd+1.5,b.w*.35,b.d*.35);}
  }
 }
 // ---- tree canopies
 setM(g,M);
 for(const t of trees){const[x,z,rr]=t,k=hash(x*10|0,z*10|0,1);g.fillStyle=k<.3?'#3b4d2c':k<.7?'#425433':'#4d5b35';g.beginPath();g.arc(x,z,rr,0,7);g.fill();if(mid){g.fillStyle=k<.5?'#56683d':'#5f7044';g.beginPath();g.arc(x-SUN[0]*rr*.3,z-SUN[1]*rr*.3,rr*.55,0,7);g.fill();}}
 g.setTransform(1,0,0,1,0,0);
 const t1=performance.now();post(g,LW,LH,Math.round(X0/pm),Math.round(Z0/pm));if(typeof window!=='undefined')window.__gmSatPost=performance.now()-t1;
}

// ---------- optics + grade + grain + JPEG (8x8 DCT, 4:2:0) ----------
const QY0=[16,11,10,16,24,40,51,61,12,12,14,19,26,58,60,55,14,13,16,24,40,57,69,56,14,17,22,29,51,87,80,62,18,22,37,56,68,109,103,77,24,35,55,64,81,104,113,92,49,64,78,87,103,121,120,101,72,92,95,98,112,100,103,99];
const QC0=[17,18,24,47,99,99,99,99,18,21,26,66,99,99,99,99,24,26,56,99,99,99,99,99,47,66,99,99,99,99,99,99].concat(Array(32).fill(99));
const qtab=(T,q)=>{const s=q<50?5000/q:200-2*q;return Float32Array.from(T,v=>Math.max(1,Math.min(255,Math.floor((v*s+50)/100))));};
const QY=qtab(QY0,30),QC=qtab(QC0,26);
const COS=new Float32Array(64);for(let u=0;u<8;u++)for(let x=0;x<8;x++)COS[u*8+x]=(u?1:Math.SQRT1_2)*Math.cos((2*x+1)*u*Math.PI/16)/2;
const GR=new Float32Array(16384);for(let i=0;i<16384;i++)GR[i]=hash(i&127,i>>7,9);
const tA=new Float32Array(64),tB=new Float32Array(64);
function jpegPlane(P,W,H,Q){
 for(let by=0;by<H;by+=8)for(let bx=0;bx<W;bx+=8){
  for(let y=0;y<8;y++)for(let x=0;x<8;x++)tA[y*8+x]=P[(by+y)*W+bx+x]-128;
  for(let y=0;y<8;y++)for(let u=0;u<8;u++){let s=0;for(let x=0;x<8;x++)s+=COS[u*8+x]*tA[y*8+x];tB[y*8+u]=s;}
  for(let v=0;v<8;v++)for(let u=0;u<8;u++){let s=0;for(let y=0;y<8;y++)s+=COS[v*8+y]*tB[y*8+u];const q=Q[v*8+u];tA[v*8+u]=Math.round(s/q)*q;}
  for(let y=0;y<8;y++)for(let u=0;u<8;u++){let s=0;for(let v=0;v<8;v++)s+=COS[v*8+y]*tA[v*8+u];tB[y*8+u]=s;}
  for(let y=0;y<8;y++)for(let x=0;x<8;x++){let s=0;for(let u=0;u<8;u++)s+=COS[u*8+x]*tB[y*8+u];P[(by+y)*W+bx+x]=s+128;}
 }
}
function post(g,W,H,gx,gy){
 const img=g.getImageData(0,0,W,H),D=img.data,N=W*H,Y=new Float32Array(N),C1=new Float32Array(N),C2=new Float32Array(N);
 // optics: separable [1 2 1] blur into Y/C1/C2 scratch as RGB first
 const R=new Float32Array(N),G=new Float32Array(N),B=new Float32Array(N);
 for(let i=0,j=0;i<N;i++,j+=4){R[i]=D[j];G[i]=D[j+1];B[i]=D[j+2];}
 for(const ch of[R,G,B]){for(let y=0;y<H;y++){const o=y*W;let p=ch[o];for(let x=0;x<W;x++){const c=ch[o+x],n=x<W-1?ch[o+x+1]:c;ch[o+x]=(p+2*c+n)/4;p=c;}}for(let x=0;x<W;x++){let p=ch[x];for(let y=0;y<H;y++){const i=y*W+x,c=ch[i],n=y<H-1?ch[i+W]:c;ch[i]=(p+2*c+n)/4;p=c;}}}
 // mosaic mottling: imagery strips captured on different days (low-frequency tint)
 const cell=96,mot=(x,y,k)=>{const fx=(x+gx)/cell,fy=(y+gy)/cell,ix=Math.floor(fx),iy=Math.floor(fy),tx=fx-ix,ty=fy-iy,sm=t=>t*t*(3-2*t),a=hash(ix,iy,k),b=hash(ix+1,iy,k),c=hash(ix,iy+1,k),d=hash(ix+1,iy+1,k),u=sm(tx),v=sm(ty);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v-.5;};
 const bw=W>>3,bh=H>>3,MB=new Float32Array(bw*bh),MW=new Float32Array(bw*bh);for(let y=0;y<bh;y++)for(let x=0;x<bw;x++){MB[y*bw+x]=1+mot(x*8+4,y*8+4,3)*.12;MW[y*bw+x]=mot(x*8+4,y*8+4,5)*14;}
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,bk=(y>>3)*bw+(x>>3);
  let r=R[i],gg=G[i],b=B[i];const l=.3*r+.59*gg+.11*b;r=l+(r-l)*.8;gg=l+(gg-l)*.8;b=l+(b-l)*.8;
  r=(r-112)*1.12+112;gg=(gg-112)*1.12+112;b=(b-112)*1.12+112;r=r*.9+100*.1;gg=gg*.9+108*.1;b=b*.9+120*.1;
  const bri=MB[bk],warm=MW[bk];r=r*bri+warm;gg=gg*bri+warm*.35;b=b*bri-warm*.6;
  const n=(GR[((y+gy)&127)*128+((x+gx)&127)]-.5)*9;r+=n;gg+=n;b+=n;
  Y[i]=.299*r+.587*gg+.114*b;C1[i]=128-.168736*r-.331264*gg+.5*b;C2[i]=128+.5*r-.418688*gg-.081312*b;}
 // 4:2:0 chroma subsampling
 const w2=W>>1,h2=H>>1,CB=new Float32Array(w2*h2),CR=new Float32Array(w2*h2);
 for(let y=0;y<h2;y++)for(let x=0;x<w2;x++){const i=y*2*W+x*2;CB[y*w2+x]=(C1[i]+C1[i+1]+C1[i+W]+C1[i+W+1])/4;CR[y*w2+x]=(C2[i]+C2[i+1]+C2[i+W]+C2[i+W+1])/4;}
 jpegPlane(Y,W,H,QY);jpegPlane(CB,w2,h2,QC);jpegPlane(CR,w2,h2,QC);
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x,k=(y>>1)*w2+(x>>1),yy=Y[i],cb=CB[k]-128,cr=CR[k]-128,j=i*4;
  D[j]=yy+1.402*cr;D[j+1]=yy-.344136*cb-.714136*cr;D[j+2]=yy+1.772*cb;D[j+3]=255;}
 g.putImageData(img,0,0);
}
