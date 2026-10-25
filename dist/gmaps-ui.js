// V101 · Level 11 "Classic Maps" UI (Google Maps 2005–2012 homage, parody wordmark).
// Everything here is UI-only: a 2D canvas palette for the city map, the DOM chrome
// for the full map (F), the Aqua/Safari-style compass for the minimap and the
// info-window vitals card. All CSS lives in gmaps-ui.css under
// :root[data-ui-level="11"], so other levels never see any of it.
import {CITY_BLOCK,cityToWorld,worldToCity,cityBlockPlan,cityDistrict} from './urban-layout.js?v=return-1';
import {BUILDING_TYPES} from './urban-buildings.js?v=132st';
import {exitPoint} from './exit-route.js?v=60';
import {paintSatellite,setSatInvalidate148} from './gmaps-satellite.js?v=148a';
import {paintCanalMap} from './map131-canal.js?v=150c';
import {gmCtlHTML} from './gm-ctl132.js?v=132';
import {in148,paintFoot148,paintPoi148,sideHTML148,select148,onSelect148} from './map148-poi.js?v=150c'; // V148 E4
const __bcT=s=>{const b=globalThis.BCi18n;return b&&typeof s==='string'?b.t(s):s;};

const FONT='Arial, Helvetica, sans-serif',AQUA="'Lucida Grande', 'Helvetica Neue', Helvetica, Arial, sans-serif";
// Classic (pre-2013) tile palette. Satellite/Hybrid are a dark aerial look.
const PALETTES={
 map:{land:'#f2efe9',park:'#c8deb5',parkEdge:'#b5d29f',casing:'#c9c2b3',street:'#ffffff',artCase:'#e3b24a',art:'#ffe168',hwyCase:'#d48a2a',hwy:'#f9b235',bld:'#e8e4dc',bldTall:'#ddd8ce',bldEdge:'#cbc4b6',label:'#333333',halo:'#ffffff',water:'#a5bfdd'},
 satellite:{land:'#5b5d55',park:'#4a5e3a',parkEdge:'#43552f',casing:'#3a3c38',street:'#41433f',artCase:'#3a3c38',art:'#474944',hwyCase:'#363833',hwy:'#4a4b46',bld:'#8d8f87',bldTall:'#a7a89f',bldEdge:'#3b3d38',label:null,halo:null,water:'#2f4a5e'},
 hybrid:{land:'#5b5d55',park:'#4a5e3a',parkEdge:'#43552f',casing:'#00000038',street:'#ffffffa8',artCase:'#0000004a',art:'#ffe168c8',hwyCase:'#00000055',hwy:'#f9b235e0',bld:'#8d8f87',bldTall:'#a7a89f',bldEdge:'#3b3d38',label:'#ffffff',halo:'#000000',water:'#2f4a5e'}
};
let mode='map',invalidate=()=>{};
export const gmMode=()=>mode;
const ord=n=>{const a=Math.abs(n),s=a%100>10&&a%100<14?'th':['th','st','nd','rd'][a%10]||'th';return a+s;};
const avenueName=i=>i===0?'Main St':`${ord(i)} ${i<0?'W ':''}Ave`.replace(/^(\d+\w+) W /,'W $1 ');
const streetName=j=>j===0?'Exit Blvd':`${j<0?'S':'N'} ${ord(j)} St`;

// ---------- City map painter (full map + minimap) ----------
export function gmCityPaint(context,c,w,h,scale,shapes=[],opts={}){
 const m=opts.mode||mode,P=PALETTES[m]||PALETTES.map,labels=opts.labels&&P.label;
 const ox=Number(c.cx)*64+c.x,oz=Number(c.cz)*64+c.z;
 // V102: full-map Satellite/Hybrid is a fake low-res aerial photo (gmaps-satellite.js);
 // the minimap keeps the cheap flat palette because it repaints while walking.
 const photo=opts.labels&&(m==='satellite'||m==='hybrid');
 if(photo){paintSatellite(context,ox,oz,w,h,scale,shapes);if(m==='satellite'){const sxy=(x,z)=>{const p=cityToWorld(x,z);return[w/2+(p.x-ox)*scale,h/2+(p.z-oz)*scale];};paintFoot148(context,sxy,scale,P,true);paintPoi148(context,sxy,scale,w,h,true);return 0;}}
 const xy=p=>[w/2+(p.x-ox)*scale,h/2+(p.z-oz)*scale];
 const center=worldToCity(ox,oz),bx=Math.floor(center.x/CITY_BLOCK),bz=Math.floor(center.z/CITY_BLOCK),r=Math.ceil(Math.max(w,h)/scale/CITY_BLOCK*.72)+1;
 if(!photo){context.fillStyle=P.land;context.fillRect(0,0,w,h);}
 const quad=(pts,fill,stroke)=>{context.beginPath();pts.forEach((p,k)=>k?context.lineTo(...p):context.moveTo(...p));context.closePath();if(fill){context.fillStyle=fill;context.fill();}if(stroke){context.strokeStyle=stroke;context.lineWidth=1;context.stroke();}};
 // Civic blocks read as parks/campus green, like classic Maps' park polygons.
 if(!photo)for(let iz=bz-r;iz<=bz+r;iz++)for(let ix=bx-r;ix<=bx+r;ix++){const x=ix*CITY_BLOCK,z=iz*CITY_BLOCK;if(cityDistrict(x+56,z+56)!=='civic')continue;quad([[x+8,z+8],[x+104,z+8],[x+104,z+104],[x+8,z+104]].map(p=>xy(cityToWorld(p[0],p[1]))),P.park,P.parkEdge);}
 // V131m: canals (water under the roads = bridges), locks, names and subway entrances (map131-canal.js)
 const toS=(x,z)=>xy(cityToWorld(x,z)),cv={bx,bz,r,scale,P,photo};paintCanalMap(context,toS,{...cv,stage:'water'});
 const line=(a,b)=>{context.beginPath();context.moveTo(...a);context.lineTo(...b);context.stroke();};
 const roads=[];
 for(let i=-r;i<=r;i++)for(const axis of[0,1]){const k=axis?bz+i:bx+i,a=xy(cityToWorld(axis?(bx-r)*CITY_BLOCK:k*CITY_BLOCK,axis?k*CITY_BLOCK:(bz-r)*CITY_BLOCK)),b=xy(cityToWorld(axis?(bx+r+1)*CITY_BLOCK:k*CITY_BLOCK,axis?k*CITY_BLOCK:(bz+r+1)*CITY_BLOCK));roads.push({a,b,axis,k,cls:k%4===0?1:0});}
 context.lineCap='butt';
 const width=(cls)=>photo?Math.min(cls?5:3.5,Math.max(cls?3:2,(cls?18:15)*scale*.3)):Math.max(cls?3.5:2,(cls?18:15)*scale);
 // casings first, then fills (so intersections stay clean), arterials on top.
 for(const cls of[0,1]){context.strokeStyle=cls?P.artCase:P.casing;for(const q of roads)if(q.cls===cls){context.lineWidth=width(cls)+2;line(q.a,q.b);}context.strokeStyle=cls?P.art:P.street;for(const q of roads)if(q.cls===cls){context.lineWidth=width(cls);line(q.a,q.b);}}
 // Entry boulevard + exit route as the orange "highway" class.
 const hw=[[cityToWorld(0,-32),cityToWorld(0,448)],[cityToWorld(-160,0),cityToWorld(160,0)]].map(s=>s.map(xy));
 const route=[];for(let s=110;s<=430;s+=8)route.push(xy(exitPoint(s)));
 const hwy=(lw,col)=>{context.strokeStyle=col;context.lineWidth=lw;context.lineJoin='round';for(const s of hw)line(...s);context.beginPath();route.forEach((p,k)=>k?context.lineTo(...p):context.moveTo(...p));context.stroke();};
 const hwW=photo?6:Math.max(4,19*scale);hwy(hwW+2,P.hwyCase);hwy(hwW,P.hwy);
 paintCanalMap(context,toS,{...cv,stage:'over'});
 // Building footprints (light fill, darker 1px edge) once zoomed in.
 if(scale>.45&&!photo){
  const foot=(q,x,z,ry,bw,bd,toW,fill)=>{const pts=[];for(let k=0;k<4;k++){const u=(k===0||k===3?-1:1)*bw/2,v=(k<2?-1:1)*bd/2;pts.push(xy(toW(x+Math.cos(ry)*u+Math.sin(ry)*v,z-Math.sin(ry)*u+Math.cos(ry)*v)));}quad(pts,fill,scale>.6?P.bldEdge:null);};
  for(const q of shapes){const cc=worldToCity(q.x,q.z);if(!in148(cc.x,cc.z))foot(q,q.x,q.z,q.ry,q.w,q.d,(x,z)=>({x,z}),P.bld);}
  for(let iz=bz-r;iz<=bz+r;iz++)for(let ix=bx-r;ix<=bx+r;ix++)for(const b of cityBlockPlan(ix,iz,BUILDING_TYPES).buildings)if(!in148(b.x,b.z))foot(b,b.x,b.z,b.ry,b.w,b.d,cityToWorld,b.floors>7?P.bldTall:P.bld);
 }
 paintFoot148(context,toS,scale,P,photo); // V148 E4: real footprints of the capital region + place areas
 paintCanalMap(context,toS,{...cv,stage:'icons'});if(labels)paintCanalMap(context,toS,{...cv,stage:'labels'});
 if(labels){
  context.save();context.font=`bold 11px ${FONT}`;context.textAlign='center';context.textBaseline='middle';context.lineJoin='round';
  for(const q of roads){
   // Label each road once, at its point nearest the view centre (clamped on-screen).
   const dx=q.b[0]-q.a[0],dz=q.b[1]-q.a[1],L=Math.hypot(dx,dz);if(L<1)continue;let t=((w/2-q.a[0])*dx+(h/2-q.a[1])*dz)/(L*L);const off=((q.k*37)%5-2)*90/L;t=Math.max(.05,Math.min(.95,t+off));
   const x=q.a[0]+dx*t,z=q.a[1]+dz*t;if(x<30||z<20||x>w-30||z>h-20)continue;let ang=Math.atan2(dz,dx);if(ang>Math.PI/2)ang-=Math.PI;if(ang<-Math.PI/2)ang+=Math.PI;
   const name=q.axis?streetName(q.k):avenueName(q.k);context.save();context.translate(x,z);context.rotate(ang);context.strokeStyle=P.halo;context.lineWidth=3;context.strokeText(__bcT(name),0,0);context.fillStyle=P.label;context.fillText(__bcT(name),0,0);context.restore();
  }
  context.restore();
 }
 if(opts.labels)paintPoi148(context,toS,scale,w,h,photo); // V148 E4 markers + info window
 return 0;
}

// Red inverted-drop marker with soft shadow + classic info-window balloon.
export function gmDrawPin(context,x,y,yaw,title='You are here'){
 context.save();
 // shadow (skewed ellipse, like the 2006 marker shadow PNG)
 context.fillStyle='rgba(0,0,0,.28)';context.beginPath();context.ellipse(x+9,y-4,11,4.5,-.5,0,Math.PI*2);context.fill();
 context.translate(x,y);
 const g=context.createLinearGradient(-10,-34,10,-14);g.addColorStop(0,'#ff8a7a');g.addColorStop(.45,'#f23d2b');g.addColorStop(1,'#b0180c');
 context.beginPath();context.moveTo(0,0);context.bezierCurveTo(-3,-9,-10,-14,-10,-23);context.arc(0,-23,10,Math.PI,0);context.bezierCurveTo(10,-14,3,-9,0,0);context.closePath();context.fillStyle=g;context.fill();context.strokeStyle='#8e1308';context.lineWidth=1;context.stroke();
 context.fillStyle='#5e0d06';context.beginPath();context.arc(0,-23,3.2,0,Math.PI*2);context.fill();
 context.fillStyle='rgba(255,255,255,.55)';context.beginPath();context.ellipse(-3.5,-27,2.5,4,-.5,0,Math.PI*2);context.fill();
 // heading chevron at the pin's foot so direction is still readable
 context.save();context.rotate(-yaw);context.translate(0,-14);context.fillStyle='#2a6fdb';context.strokeStyle='#fff';context.lineWidth=1.5;context.beginPath();context.moveTo(0,-6);context.lineTo(6,4);context.lineTo(0,1);context.lineTo(-6,4);context.closePath();context.stroke();context.fill();context.restore();
 context.restore();
 // balloon
 context.save();context.font=`bold 13px ${FONT}`;const tw=Math.max(118,context.measureText(__bcT(title)).width+44),bh=46,bx=x-26,by=y-38-bh-18;
 context.shadowColor='rgba(0,0,0,.3)';context.shadowBlur=6;context.shadowOffsetX=4;context.shadowOffsetY=4;
 context.beginPath();const r=8;context.moveTo(bx+r,by);context.lineTo(bx+tw-r,by);context.arcTo(bx+tw,by,bx+tw,by+r,r);context.lineTo(bx+tw,by+bh-r);context.arcTo(bx+tw,by+bh,bx+tw-r,by+bh,r);context.lineTo(bx+46,by+bh);context.lineTo(x-2,y-40);context.lineTo(bx+26,by+bh);context.lineTo(bx+r,by+bh);context.arcTo(bx,by+bh,bx,by+bh-r,r);context.lineTo(bx,by+r);context.arcTo(bx,by,bx+r,by,r);context.closePath();
 context.fillStyle='#fff';context.fill();context.shadowColor='transparent';context.strokeStyle='#ababab';context.lineWidth=1;context.stroke();
 context.fillStyle='#000';context.textBaseline='top';context.fillText(__bcT(title),bx+10,by+8);context.font=`13px ${FONT}`;context.fillStyle='#0000cc';context.fillText(__bcT('Directions'),bx+10,by+26);
 // close box
 context.strokeStyle='#888';context.strokeRect(bx+tw-17.5,by+6.5,11,11);context.beginPath();context.moveTo(bx+tw-15,by+9);context.lineTo(bx+tw-9,by+15);context.moveTo(bx+tw-9,by+9);context.lineTo(bx+tw-15,by+15);context.stroke();
 context.restore();
}

// ---------- Aqua / Safari compass framing the round minimap ----------
// Drawn in the same 256x296 design space as paintCompass().
// V127: Level 27 reuses this compass; its window shows an upright ~2010 snapshot
// of a cave hot spring (assets/v127/l27_compass.webp) instead of the street map.
let springPhoto=null;
export function springCompassPhoto(){if(!springPhoto){springPhoto=new Image();springPhoto.decoding='async';springPhoto.src='./assets/v127/l27_compass.webp';}return springPhoto.complete&&springPhoto.naturalWidth?springPhoto:null;}
export function paintSafariCompass(c,map,yaw,bearing,opts={}){
 const X=128,Y=124,R=114;
 c.save();
 // drop shadow
 c.fillStyle='rgba(0,0,0,.35)';c.beginPath();c.ellipse(X+2,Y+6,R+1,R+1,0,0,Math.PI*2);c.fill();
 // brushed chrome outer ring
 let g=c.createLinearGradient(0,Y-R,0,Y+R);g.addColorStop(0,'#ffffff');g.addColorStop(.18,'#e6e9ec');g.addColorStop(.5,'#9aa1a8');g.addColorStop(.78,'#d9dde1');g.addColorStop(1,'#f7f8f9');
 c.fillStyle=g;c.beginPath();c.arc(X,Y,R,0,Math.PI*2);c.fill();c.strokeStyle='#6d747b';c.lineWidth=1.2;c.stroke();
 c.strokeStyle='rgba(255,255,255,.9)';c.lineWidth=1;c.beginPath();c.arc(X,Y,R-2,Math.PI*1.1,Math.PI*1.9);c.stroke();
 // blue dial
 const RB=103,RM=84;
 g=c.createRadialGradient(X-30,Y-40,10,X,Y,RB);g.addColorStop(0,'#7cc4ff');g.addColorStop(.55,'#1f7de6');g.addColorStop(1,'#0a3f9a');
 c.fillStyle=g;c.beginPath();c.arc(X,Y,RB,0,Math.PI*2);c.fill();c.strokeStyle='#08306f';c.lineWidth=1.5;c.stroke();
 // rotating ticks + cardinal letters
 c.save();c.translate(X,Y);c.rotate(yaw);
 for(let i=0;i<72;i++){const a=i*Math.PI/36,big=i%6===0,len=big?9:5;c.strokeStyle=big?'#ffffff':'rgba(255,255,255,.75)';c.lineWidth=big?2:1;c.beginPath();c.moveTo(Math.sin(a)*(RB-3),-Math.cos(a)*(RB-3));c.lineTo(Math.sin(a)*(RB-3-len),-Math.cos(a)*(RB-3-len));c.stroke();}
 c.font=`bold 13px ${AQUA}`;c.textAlign='center';c.textBaseline='middle';
 for(let i=0;i<4;i++){const a=i*Math.PI/2;c.save();c.translate(Math.sin(a)*(RM+9.5),-Math.cos(a)*(RM+9.5));c.rotate(a);c.fillStyle='rgba(0,20,70,.6)';c.fillText(__bcT('NESW'[i]),0,1);c.fillStyle=i===0?'#ffe4e1':'#ffffff';c.fillText(__bcT('NESW'[i]),0,0);c.restore();}
 c.restore();
 // map window
 c.save();c.beginPath();c.arc(X,Y,RM,0,Math.PI*2);c.fillStyle='#f2efe9';c.fill();c.clip();
 if(opts.photo){const im=springCompassPhoto();if(im){c.drawImage(im,X-RM,Y-RM,RM*2,RM*2);const v=c.createRadialGradient(X,Y,RM*.55,X,Y,RM);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.38)');c.fillStyle=v;c.fillRect(X-RM,Y-RM,RM*2,RM*2);}else{c.fillStyle='#2a3a3a';c.fillRect(X-RM,Y-RM,RM*2,RM*2);}c.restore();}
 else{c.translate(X,Y);c.rotate(yaw);if(map)c.drawImage(map,-142,-142,284,284);c.restore();}
 c.strokeStyle='#062a63';c.lineWidth=2;c.beginPath();c.arc(X,Y,RM,0,Math.PI*2);c.stroke();
 c.strokeStyle='rgba(0,0,0,.18)';c.lineWidth=6;c.beginPath();c.arc(X,Y,RM-3,0,Math.PI*2);c.stroke();
 // red/white needle pointing north
 c.save();c.translate(X,Y);c.rotate(yaw);c.globalAlpha=opts.photo?.55:.82;c.shadowColor='rgba(0,0,0,.35)';c.shadowBlur=3;c.shadowOffsetY=2;
 c.beginPath();c.moveTo(0,-74);c.lineTo(6,0);c.lineTo(-6,0);c.closePath();g=c.createLinearGradient(-6,0,6,0);g.addColorStop(0,'#ff5a4a');g.addColorStop(.5,'#e01a0e');g.addColorStop(.5,'#b80f06');g.addColorStop(1,'#d9261a');c.fillStyle=g;c.fill();
 c.beginPath();c.moveTo(0,74);c.lineTo(6,0);c.lineTo(-6,0);c.closePath();g=c.createLinearGradient(-6,0,6,0);g.addColorStop(0,'#ffffff');g.addColorStop(.5,'#f1f1f1');g.addColorStop(.5,'#c9ccd0');g.addColorStop(1,'#e8eaec');c.fillStyle=g;c.fill();
 c.restore();
 // player: classic blue "my location" arrow, heading up
 c.save();c.translate(X,Y);c.fillStyle='#ffffff';c.beginPath();c.arc(0,0,9,0,Math.PI*2);c.fill();
 c.fillStyle='#2a6fdb';c.strokeStyle='#0d3d8f';c.lineWidth=1;c.beginPath();c.moveTo(0,-8);c.lineTo(6,6);c.lineTo(0,3);c.lineTo(-6,6);c.closePath();c.fill();c.stroke();c.restore();
 // heading index at 12 o'clock
 c.fillStyle='#d01c10';c.strokeStyle='#fff';c.lineWidth=1;c.beginPath();c.moveTo(X,Y-RB+1);c.lineTo(X+6,Y-RB-9);c.lineTo(X-6,Y-RB-9);c.closePath();c.fill();c.stroke();
 // Aqua glass gloss over the window
 c.save();c.beginPath();c.ellipse(X,Y-RM*.42,RM*.8,RM*.52,0,0,Math.PI*2);c.clip();g=c.createLinearGradient(0,Y-RM,0,Y);g.addColorStop(0,'rgba(255,255,255,.62)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(X-RM,Y-RM,RM*2,RM);c.restore();
 // Aqua pill caption
 const py=250,pw=196,ph=26,px=X-pw/2;g=c.createLinearGradient(0,py,0,py+ph);g.addColorStop(0,'#ffffff');g.addColorStop(.5,'#e9ecef');g.addColorStop(.5,'#d8dde2');g.addColorStop(1,'#f4f6f8');
 c.beginPath();c.roundRect?c.roundRect(px,py,pw,ph,13):c.rect(px,py,pw,ph);c.fillStyle=g;c.fill();c.strokeStyle='#7d858c';c.lineWidth=1;c.stroke();
 c.font=`bold 13px ${AQUA}`;c.fillStyle='#1d1d1d';c.textBaseline='middle';c.textAlign='left';c.fillText(__bcT(bearing),px+14,py+ph/2+1);c.textAlign='right';c.font=`12px ${AQUA}`;c.fillStyle='#0b56c7';c.fillText(__bcT('M  Map'),px+pw-14,py+ph/2+1);
 c.restore();
}

// ---------- Full-map chrome ----------
const LOGO='<span class="gm-wordmark" aria-label="Goggle"><i style="color:#1c4fd6">G</i><i style="color:#d8291d">o</i><i style="color:#f1b51c">g</i><i style="color:#1c4fd6">g</i><i style="color:#16943a">l</i><i style="color:#d8291d">e</i></span>';
export function mountGmapsChrome(modal,{invalidate:inv}={}){
 if(inv)invalidate=inv;setSatInvalidate148(()=>invalidate());
 const panel=modal.querySelector('.map-panel'),surface=modal.querySelector('.map-surface'),canvas=modal.querySelector('.map-canvas');
 panel.insertAdjacentHTML('afterbegin',`<div class="gm-top"><nav><a>Web</a><a>Images</a><a>Videos</a><b>Maps</b><a>News</a><a>Shopping</a><a>Gmail</a><a>more ▾</a></nav><div class="gm-top-right"><a>Help</a> | <a class="gm-close" href="#" role="button">Close map (M)</a></div></div>
 <div class="gm-head"><div class="gm-brand">${LOGO}<span class="gm-maps">maps</span></div><div class="gm-search"><div class="gm-search-row"><input type="text" value="Level 11, The Endless City" aria-label="Search Maps" readonly><button type="button" class="gm-btn" data-gm="search">Search Maps</button><a class="gm-small-link">Show search options</a></div><small>Find businesses, addresses and places of interest.</small></div></div>
 <div class="gm-bar"><div class="gm-bar-side"><a>Get Directions</a><a>My Maps</a><span class="gm-collapse">«</span></div><div class="gm-bar-map"><a><i class="gm-ico gm-print"></i>Print</a><a><i class="gm-ico gm-send"></i>Send</a><a><i class="gm-ico gm-link"></i>Link</a></div></div>
 <aside class="gm-side"><div class="gm-result"><span class="gm-pin-a">A</span><div><a class="gm-res-title">Level 11 · The Endless City</a><div class="gm-addr">无垠城市 · Infinite street grid</div><div class="gm-green">level11.backrooms.meg - Heading <span class="gm-heading">N</span></div><div class="gm-links"><a>Directions</a> - <a>Search nearby</a> - <a>Save to…</a> - <a>more ▾</a></div></div></div>
 <div class="gm-hint"><b>Tips</b><br>Drag the map to pan · scroll to zoom<br>Click any street to travel there</div>
 <div class="gm-legend"><b>Legend</b><span><i style="background:#f9b235;border-color:#d48a2a"></i>Boulevard / exit route</span><span><i style="background:#ffe168;border-color:#e3b24a"></i>Arterial (every 4th street)</span><span><i style="background:#fff;border-color:#c9c2b3"></i>Street</span><span><i style="background:#c8deb5;border-color:#b5d29f"></i>Civic park / campus</span><span><i style="background:#e8e4dc;border-color:#cbc4b6"></i>Building</span></div>
 <div class="gm148-list">${sideHTML148()}</div><p class="gm-put">Put <a>your business on Goggle Maps</a></p></aside>`);
 surface.insertAdjacentHTML('beforeend',`${gmCtlHTML()}
 <div class="gm-types" role="group" aria-label="Map type"><button data-type="map" class="on">Map</button><button data-type="satellite">Satellite</button><button data-type="hybrid">Hybrid</button></div>
 <div class="gm-foot"><span class="gm-logo-small">${LOGO}</span><div class="gm-scale"><span class="gm-ft">200 ft</span><span class="gm-m">50 m</span><i class="gm-bar-ft"></i><i class="gm-bar-m"></i></div></div>
 <div class="gm-copy">©2009 Goggle - Map data ©2009 Tele Atlas, M.E.G. - <a>Terms of Use</a></div>`);
 const q=s=>modal.querySelector(s),press=a=>q(`[data-map-action="${a}"]`)?.click();
 modal.querySelectorAll('[data-poi]').forEach(el=>el.addEventListener('click',e=>{e.preventDefault();select148(el.dataset.poi);invalidate();}));
 onSelect148(p=>{modal.querySelectorAll('[data-poi]').forEach(el=>el.classList.toggle('on',!!p&&el.dataset.poi===p.id));if(p)modal.querySelector(`[data-poi="${p.id}"]`)?.scrollIntoView({block:'nearest'});});
 q('.gm-close').addEventListener('click',e=>{e.preventDefault();q('.map-close')?.click();});
 modal.querySelectorAll('[data-pan]').forEach(b=>b.addEventListener('click',()=>{for(let i=0;i<4;i++)canvas.dispatchEvent(new KeyboardEvent('keydown',{code:b.dataset.pan,bubbles:false}));}));
 q('[data-gm="center"]').addEventListener('click',()=>press('center'));
 q('[data-gm="search"]').addEventListener('click',()=>press('center'));
 q('[data-gm="in"]').addEventListener('click',()=>press('in'));
 q('[data-gm="out"]').addEventListener('click',()=>press('out'));
 const track=q('.gm-track'),STEPS=7;
 q('.gm-ticks').innerHTML='<i></i>'.repeat(STEPS+1);
 track.addEventListener('click',e=>{const r=track.getBoundingClientRect(),t=1-Math.max(0,Math.min(1,(e.clientY-r.top)/r.height)),target=Math.round(t*STEPS),now=Math.round(Math.log(currentZoom)/Math.log(1.35));for(let i=0;i<Math.abs(target-now);i++)press(target>now?'in':'out');});
 modal.querySelectorAll('[data-type]').forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.type;modal.querySelectorAll('[data-type]').forEach(x=>x.classList.toggle('on',x===b));modal.dataset.gmMode=mode;invalidate();}));
 let currentZoom=1,lastKey='';
 // Called from paintMap (level 11 only): slider thumb + dual scale bar.
 return function update(zoom,yaw=0){currentZoom=zoom;
  const key=zoom.toFixed(3)+'|'+Math.round(yaw*20);if(key===lastKey)return;lastKey=key;
  const t=Math.max(0,Math.min(1,Math.log(zoom)/Math.log(8)));q('.gm-thumb').style.top=`${(1-t)*100}%`;
  const pickM=[2,5,10,20,50,100,200,500].filter(m=>m*zoom<=110).pop()||2,pickF=[5,10,20,50,100,200,500,1000,2000].filter(f=>f*.3048*zoom<=110).pop()||5;
  q('.gm-bar-m').style.width=Math.round(pickM*zoom)+'px';q('.gm-bar-ft').style.width=Math.round(pickF*.3048*zoom)+'px';q('.gm-m').textContent=pickM+' m';q('.gm-ft').textContent=pickF+' ft';
  const b=(Math.round(-yaw*180/Math.PI)%360+360)%360;q('.gm-heading').textContent=`${['N','NE','E','SE','S','SW','W','NW'][Math.round(b/45)%8]} ${b}°`;
 };
}

// ---------- Vitals info-window card (bottom-left HUD) ----------
let vitalsTimer=0;
export function mountGmapsVitals(){
 if(vitalsTimer)return;
 let card=null,last='';
 const rows=[['stamina','Stamina','体力','#3366cc'],['hydration','Hydration','水分','#3399ff'],['health','Health','血量','#dc3912'],['sanity','Sanity','精神','#109618']];
 function mount(){const stats=document.querySelector('.stats');if(!stats)return null;stats.insertAdjacentHTML('beforeend',`<div class="gm-vitals" aria-hidden="true"><div class="gm-iw"><span class="gm-iw-x">×</span><div class="gm-iw-title"><span class="gm-pin-a small">A</span>You are here</div><div class="gm-iw-addr">Level 11 · The Endless City</div><table>${rows.map(r=>`<tr data-k="${r[0]}"><th>${r[1]} <small>${r[2]}</small></th><td><span class="gm-meter"><i style="background:${r[3]}"></i></span></td><td class="gm-pct">100%</td></tr>`).join('')}</table><div class="gm-iw-foot"><span class="gm-water">Almond water: <b>0</b> bottles</span><span class="gm-iw-links"><a>Directions</a> - <a>Search nearby</a></span></div></div><span class="gm-iw-tail"></span></div>`);return stats.querySelector('.gm-vitals');}
 const val=id=>Math.round(Number(document.getElementById(id)?.getAttribute('aria-valuenow'))||0);
 vitalsTimer=setInterval(()=>{
  const lv=document.documentElement.dataset.uiLevel;if(lv!=='11'&&lv!=='27')return;
  card||=mount();if(!card)return;
  const addr=lv==='27'?'Level 27 · The Bunker Springs':'Level 11 · The Endless City';if(card.dataset.lv!==lv){card.dataset.lv=lv;card.querySelector('.gm-iw-addr').textContent=addr;last='';}
  const v=[val('stamina-meter'),val('hydration-meter'),val('health-meter'),val('sanity-meter')],bottles=parseInt(document.getElementById('bottle-count')?.textContent||'0',10)||0,key=v.join(',')+'|'+bottles;
  if(key===last)return;last=key;
  rows.forEach((r,i)=>{const tr=card.querySelector(`[data-k="${r[0]}"]`);tr.querySelector('i').style.width=v[i]+'%';tr.querySelector('.gm-pct').textContent=v[i]+'%';tr.classList.toggle('low',v[i]<25);});
  card.querySelector('.gm-water b').textContent=bottles;
 },250);
}
