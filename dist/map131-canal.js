// V131m · Level 11 canals + subway entrances on the maps (user 2026-10-17: "level11的运河没有出现在三种地图上").
// Three maps: the HUD minimap and the F full map in "Map" mode (gmCityPaint, 2009 Google-Maps palette: #a5bfdd water, italic
// blue water names, white bridges = the roads drawn over the water), Hybrid (photo + labels) and Satellite (gmaps-satellite.js
// raster: dark green-grey water with ripple streaks, wall shadow, light coping, paved promenades, bridge girders, lock gates).
// Same pure layout as the 3D world (canal128-layout.js: every 8th block row, open/buried hashed per block, infinite) and the
// stair openings of subway128-layout.js, so every hashed reach far from spawn shows up too.
import {canalOpen,canalBlock,canalRow,CANAL} from './canal128-layout.js?v=128';
import {subwayStairs,subwayBlock} from './subway128-layout.js?v=128';
import {CITY_BLOCK as B} from './urban-layout.js?v=return-1';
const __bcT=s=>{const b=globalThis.BCi18n;return b&&typeof s==='string'?b.t(s):s;};
const NAMES=['Hope Canal','Канал Бесконечный','Canal du Nulle-Part','Grachtsingel Eindeloos',"Naviglio dell'Eco",'不归渠 Bùguī Canal','Kanał Ciszy','Kanal der leeren Stunde','Canal Saint-Perpétuel','鏡川運河 Kagami Canal','Canale delle Sale Vuote','Tyst Kanal'];
export const canalName=iz=>{const k=Math.round((iz-CANAL.row)/CANAL.period);return NAMES[((k%NAMES.length)+NAMES.length)%NAMES.length];};
// open reach of a block in city coords (x range incl. the road halves the water passes under, z = water)
function reach(ix,iz){const c=canalBlock(ix,iz);if(!c)return null;const x=ix*B,z=iz*B;
 return{x0:x+(c.noRoadW?-7.5:7.5),x1:x+B+(c.noRoadE?7.5:-7.5),z0:z+CANAL.z0,z1:z+CANAL.z1,p0:z+CANAL.p0,p1:z+CANAL.p1,c,x,z,
  portalW:c.portalW,portalE:c.portalE};}
// rows of canal visible in a block window
function rows(bz,r){const o=[];for(let iz=bz-r;iz<=bz+r;iz++)if(canalRow(iz))o.push(iz);return o;}

// ---------- Map / Hybrid painter (called by gmCityPaint). xy: city->world->screen via the caller's toS(cityX,cityZ)
export function paintCanalMap(g,toS,{bx,bz,r,scale,P,photo,stage}){
 const R=rows(bz,r);if(!R.length&&stage!=='icons')return;
 const poly=(pts,fill)=>{g.beginPath();pts.forEach((p,k)=>k?g.lineTo(...p):g.moveTo(...p));g.closePath();g.fillStyle=fill;g.fill();};
 const rect=(x0,z0,x1,z1,fill)=>poly([toS(x0,z0),toS(x1,z0),toS(x1,z1),toS(x0,z1)],fill);
 if(stage==='water'&&!photo){
  for(const iz of R)for(let ix=bx-r;ix<=bx+r;ix++){const q=reach(ix,iz);
   if(!q){ // buried reach: faint dashed culvert line once zoomed in (classic Maps draws underground water as a dashed line)
    if(scale>.45&&!(ix===1&&iz===2)){g.save();g.strokeStyle='#8eaad0';g.lineWidth=1.2;g.setLineDash([4,4]);g.beginPath();g.moveTo(...toS(ix*B,iz*B+CANAL.mid));g.lineTo(...toS(ix*B+B,iz*B+CANAL.mid));g.stroke();g.restore();}continue;}
   // promenades a shade darker than the land (paved), then the water across the whole reach incl. under the bridges
   rect(q.x+7.5,q.p0,q.x+B-7.5,q.z0,'#e6e1d6');rect(q.x+7.5,q.z1,q.x+B-7.5,q.p1,'#e6e1d6');
   rect(q.x+(q.portalW?7.5:-7.5),q.z0,q.x+B+(q.portalE?-7.5:7.5),q.z1,P.water);
   // embankment edge lines
   g.save();g.strokeStyle='#8fa9c9';g.lineWidth=1;for(const zz of[q.z0,q.z1]){g.beginPath();g.moveTo(...toS(q.x+(q.portalW?7.5:-7.5),zz));g.lineTo(...toS(q.x+B+(q.portalE?-7.5:7.5),zz));g.stroke();}g.restore();
  }
 }
 if(stage==='over'){
  // the hero reach (1,5)+(2,5) has no N-S road between: paint the water back over that road line
  for(const iz of R)for(let ix=bx-r;ix<=bx+r;ix++){const q=reach(ix,iz);if(!q)continue;
   if(q.c.noRoadE&&!photo){rect(q.x+B-8.5,iz*B+8.5,q.x+B+8.5,iz*B+B-8.5,photo?'#5b5d55':P.land);rect(q.x+B-8.5,q.p0,q.x+B+8.5,q.z0,photo?'#7d7a70':'#e6e1d6');rect(q.x+B-8.5,q.z1,q.x+B+8.5,q.p1,photo?'#7d7a70':'#e6e1d6');rect(q.x+B-8.5,q.z0,q.x+B+8.5,q.z1,photo?'#2c4048':P.water);}
   // lock gate 30 m before a tunnel portal: two dark lines across the water + the portal headwall
   if(scale>.3&&!photo){g.save();g.strokeStyle='#5f7fa8';g.lineWidth=Math.max(1,1.6*scale);
    const gate=x=>{g.beginPath();g.moveTo(...toS(x,q.z0));g.lineTo(...toS(x,q.z1));g.stroke();};
    if(q.portalW){gate(q.x+7.5+30);gate(q.x+7.5+34);g.lineWidth=Math.max(2,3*scale);g.strokeStyle='#9a958a';gate(q.x+7.5);}
    if(q.portalE){g.strokeStyle='#5f7fa8';g.lineWidth=Math.max(1,1.6*scale);gate(q.x+B-7.5-30);gate(q.x+B-7.5-34);g.lineWidth=Math.max(2,3*scale);g.strokeStyle='#9a958a';gate(q.x+B-7.5);}g.restore();}
  }
 }
 if(stage==='labels'){
  // one italic blue name per visible row, on the open reach nearest the view centre, written along the water
  g.save();g.font=`italic 11px Arial, Helvetica, sans-serif`;g.textAlign='center';g.textBaseline='middle';g.lineJoin='round';
  for(const iz of R){let best=null,bd=1e9;for(let ix=bx-r;ix<=bx+r;ix++){const q=reach(ix,iz);if(!q)continue;const d=Math.abs(ix+.5-bx-.5);if(d<bd){bd=d;best=q;}}
   if(!best)continue;const a=toS(best.x+20,(best.z0+best.z1)/2),c=toS(best.x+B-20,(best.z0+best.z1)/2),m=[(a[0]+c[0])/2,(a[1]+c[1])/2];
   let ang=Math.atan2(c[1]-a[1],c[0]-a[0]);if(ang>Math.PI/2)ang-=Math.PI;if(ang<-Math.PI/2)ang+=Math.PI;
   g.save();g.translate(...m);g.rotate(ang);g.strokeStyle=photo?'#000000':'#a5bfdd';g.lineWidth=3;const t=canalName(iz);g.strokeText(__bcT(t),0,0);g.fillStyle=photo?'#bcd3f2':'#2f5d9e';g.fillText(__bcT(t),0,0);g.restore();}
  g.restore();
 }
 if(stage==='icons'&&scale>.5){
  // subway entrances: classic transit marker (white rounded square, dark-blue border, "M")
  const s=Math.round(Math.min(14,Math.max(9,scale*14)));g.save();g.font=`bold ${s-4}px Arial, Helvetica, sans-serif`;g.textAlign='center';g.textBaseline='middle';
  for(let iz=bz-r;iz<=bz+r;iz++)for(let ix=bx-r;ix<=bx+r;ix++)for(const st of subwayStairs(ix,iz)){const p=st.axis==='z'?toS(ix*B+(st.x0+st.x1)/2,iz*B+st.z0+1.5):toS(ix*B+st.x0+1.5,iz*B+(st.z0+st.z1)/2);
   const x=p[0]-s/2,y=p[1]-s/2;g.fillStyle='#ffffff';g.strokeStyle='#28468c';g.lineWidth=1.5;g.beginPath();g.roundRect?g.roundRect(x,y,s,s,2):g.rect(x,y,s,s);g.fill();g.stroke();g.fillStyle='#28468c';g.fillText(__bcT('M'),p[0],p[1]+.5);}
  g.restore();
 }
}

// ---------- Satellite raster (gmaps-satellite.js render(), context already in city coords via setM(g,M))
const H=(a,b,s)=>{let h=Math.imul(a|0,374761393)^Math.imul(b|0,668265263)^Math.imul(s|0,1274126177);h=Math.imul(h^h>>>13,1103515245);h^=h>>>16;return(h>>>0)/4294967296;};
export function canalSatBlock(ix,iz){return reach(ix,iz);}
export function paintCanalSat(g,ix,iz,fine){const q=reach(ix,iz);if(!q)return false;const{x,z}=q;
 // promenades (granite setts, light) + planting strips
 g.fillStyle='#9d988c';g.fillRect(x+7.5,q.p0,B-15,q.z0-q.p0);g.fillRect(x+7.5,q.z1,B-15,q.p1-q.z1);
 g.fillStyle='#8e897e';for(let k=x+10;k<x+B-8;k+=3.2){g.fillRect(k,q.p0,.12,q.z0-q.p0);g.fillRect(k,q.z1,.12,q.p1-q.z1);}
 // water: under the bridges too (road halves) unless a portal closes that end
 const wx0=x+(q.portalW?7.5:-7.5),wx1=x+B+(q.portalE?-7.5:7.5);
 const gr=g.createLinearGradient(0,q.z0,0,q.z1);gr.addColorStop(0,'#1d2a2c');gr.addColorStop(.12,'#2a3d40');gr.addColorStop(.5,'#31474a');gr.addColorStop(.88,'#2b3f42');gr.addColorStop(1,'#223234');
 g.fillStyle=gr;g.fillRect(wx0,q.z0,wx1-wx0,q.z1-q.z0);
 // wind ripples + sky glints (streaks along the canal), a little floating debris
 for(let k=0;k<70;k++){const u=H(ix*7+k,iz,11),v=H(ix,iz*5+k,12),L=2+H(k,ix,13)*7;g.fillStyle=k%4?'rgba(120,150,150,.18)':'rgba(205,220,215,.22)';g.fillRect(wx0+u*(wx1-wx0-L),q.z0+1.2+v*(q.z1-q.z0-2.4),L,.25+H(k,iz,14)*.3);}
 // wall shadow on the south side (sun from the north-west in the raster) + light coping lines
 g.fillStyle='rgba(0,0,0,.35)';g.fillRect(wx0,q.z0,wx1-wx0,1.6);
 g.fillStyle='#c9c5b8';g.fillRect(x+7.5,q.z0-.5,B-15,.5);g.fillRect(x+7.5,q.z1,B-15,.5);
 // railing posts as a dotted dark line
 if(fine){g.fillStyle='#2b2c2a';for(let k=x+8;k<x+B-8;k+=1.6){g.fillRect(k,q.z0-.8,.2,.2);g.fillRect(k,q.z1+.6,.2,.2);}}
 // bridges = the road decks over the water: green plate-girder parapets on both sides, deck shadow on the water
 for(const[e,on]of[[x,!q.portalW&&!q.c.noRoadW],[x+B,!q.portalE&&!q.c.noRoadE]]){if(!on)continue;g.fillStyle='#4b4c4a';g.fillRect(e-7.5,q.z0,15,q.z1-q.z0);
  g.fillStyle='rgba(0,0,0,.35)';g.fillRect(e+7.5,q.z0,1.8,q.z1-q.z0);g.fillStyle='#4e6b4c';g.fillRect(e-7.6,q.z0-.6,.6,q.z1-q.z0+1.2);g.fillRect(e+7,q.z0-.6,.6,q.z1-q.z0+1.2);
  g.fillStyle='#d8d6cc';for(let k=q.z0;k<q.z1;k+=6)g.fillRect(e-.1,k,.2,3);}
 // lock gates 30 m before a portal + the portal headwall
 g.fillStyle='#6b665c';const gate=e=>{g.fillRect(e-.4,q.z0,.8,q.z1-q.z0);};
 if(q.portalW){gate(x+7.5+30);gate(x+7.5+34);g.fillStyle='#4e5b5b';g.fillRect(x+7.5+30.4,q.z0,3.2,q.z1-q.z0);g.fillStyle='#8a857a';g.fillRect(x+6,q.z0,2,q.z1-q.z0);}
 if(q.portalE){g.fillStyle='#6b665c';gate(x+B-7.5-30);gate(x+B-7.5-34);g.fillStyle='#4e5b5b';g.fillRect(x+B-7.5-33.6,q.z0,3.2,q.z1-q.z0);g.fillStyle='#8a857a';g.fillRect(x+B-8,q.z0,2,q.z1-q.z0);}
 // a moored boat or two
 for(let k=0;k<2;k++)if(H(ix,iz,30+k)<.6){const bxp=x+20+H(ix,iz,40+k)*70,bz0=k?q.z1-3.6:q.z0+1.2;g.fillStyle=k?'#d9d6cc':'#8a3b2c';g.fillRect(bxp,bz0,9,2.4);g.fillStyle='rgba(0,0,0,.25)';g.fillRect(bxp+3,bz0+.6,3,1.2);}
 return true;}
// stair openings for the raster (dark slot + light rails), city coords
export function paintSubwaySat(g,ix,iz){for(const st of subwayStairs(ix,iz)){const x0=ix*B+st.x0,z0=iz*B+st.z0,w=st.x1-st.x0,d=st.z1-st.z0,open=6.3;
 const ow=st.axis==='z'?w:open,od=st.axis==='z'?open:d;g.fillStyle='#1c1d1c';g.fillRect(x0,z0,ow,od);g.fillStyle='#b9b6ac';g.fillRect(x0-.3,z0,.3,od);g.fillRect(x0+ow,z0,.3,od);if(st.axis==='z')g.fillRect(x0-.3,z0+od,ow+.6,.3);else g.fillRect(x0+ow,z0-.3,.3,od+.6);}}
export function inCanalWater(cx,cz){const ix=Math.floor(cx/B),iz=Math.floor(cz/B),q=reach(ix,iz);return!!q&&cz>q.p0-1&&cz<q.p1+1&&cx>q.x+7&&cx<q.x+B-7;}
