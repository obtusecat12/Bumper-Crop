import {OUTPOST,CAMP_PLACEMENT as CAMP} from './lake-outpost-layout.js';
import * as T from './vendor/three.module.min.js';
import * as L from './level27-layout.js?v=64';
import {createCreekAuthority} from './level27-creek.js?v=65';
const mapCreek=createCreekAuthority(T,L),streamPath=()=>mapCreek.spine.map(p=>[p.x,p.y,p.z]);
import {CAVE_PLAN,ANNEX,STAIRS,stairCenter,stairBoundary} from './level27-layout.js?v=64';
import {exitPoint} from './exit-route.js?v=60';
import {CITY_BLOCK,cityToWorld,worldToCity,cityBlockPlan} from './urban-layout.js?v=return-1';
import {BUILDING_TYPES} from './urban-buildings.js?v=60';
import {paintCompass} from './retro-instruments.js?v=60';
import {createMapAtlas} from './map-atlas.js?v=99';
import {gmCityPaint,gmDrawPin,paintSafariCompass,mountGmapsChrome,mountGmapsVitals} from './gmaps-ui.js?v=102';
import {paintWin98Compass,blueprintize,cadUCS,cadCursor,cadPlayer,mountCadChrome,mountTaskManager} from './win98-ui.js?v=102b';

const CELL=64,MINI=288,MINI_SCALE=.78;
export function mapPoint(center,dx,dz){
 const x=center.x+dx,z=center.z+dz,sx=Math.floor(x/CELL),sz=Math.floor(z/CELL);
 return{cx:center.cx+BigInt(sx),cz:center.cz+BigInt(sz),x:x-sx*CELL,z:z-sz*CELL};
}
export function mapOffset(point,center){
 const dx=point.cx-center.cx,dz=point.cz-center.cz;
 if(dx>100000n||dx< -100000n||dz>100000n||dz< -100000n)return null;
 return{x:Number(dx)*CELL+point.x-center.x,z:Number(dz)*CELL+point.z-center.z};
}
function coordinate(cell,local){return(cell*64n+BigInt(Math.floor(local))).toString();}
function pointText(p){return `X ${coordinate(p.cx,p.x)} · Z ${coordinate(p.cz,p.z)}`;}


// V99 · USGS quadrangle recolour for the full Level 10 map. Each finished tile is
// remapped once (nearest source colour -> survey ink), cached per tile image.
const USGS_PAIRS=[['#b8a46c','#f3ecd3'],['#998061','#ece2bf'],['#81705b','#e4d9b6'],['#74845a','#dde7c2'],['#a28f70','#e9dfc3'],['#8c7658','#a33c25'],['#649298','#a9d3e6'],['#a3a17c','#4a86b4'],['#4d6849','#b6da9b'],['#61774d','#9fcc85'],
 ['#a46e59','#1c1a14'],['#995f4e','#1c1a14'],['#9c8a60','#1c1a14'],['#b7b7a5','#1c1a14'],['#655c4d','#1c1a14'],['#9b7968','#1c1a14'],['#857761','#1c1a14'],['#8c8371','#1c1a14'],['#9ca197','#1c1a14'],['#27302a','#f1ead2']].map(([a,b])=>[parseInt(a.slice(1),16),parseInt(b.slice(1),16)]);
const usgsCache=new WeakMap();
function usgsTile(image){
 let out=usgsCache.get(image);if(out)return out;
 const w=image.width,h=image.height;out=document.createElement('canvas');out.width=w;out.height=h;const c=out.getContext('2d',{willReadFrequently:true});c.drawImage(image,0,0);
 const d=c.getImageData(0,0,w,h),a=d.data,memo=new Map();
 for(let i=0;i<a.length;i+=4){const key=(a[i]<<16)|(a[i+1]<<8)|a[i+2];let t=memo.get(key);
  if(t===undefined){let best=1e9;for(const [src,dst] of USGS_PAIRS){const dr=a[i]-(src>>16),dg=a[i+1]-(src>>8&255),db=a[i+2]-(src&255),e=dr*dr*2+dg*dg*4+db*db*3;if(e<best){best=e;t=dst;}}memo.set(key,t);}
  a[i]=t>>16;a[i+1]=t>>8&255;a[i+2]=t&255;a[i+3]=255;}
 // V100: field tracks are only 1-2 px in the source tile and broke up after
 // recolouring/downscaling. Mark track-like pixels (also anti-aliased edges
 // closer to the track colour than to paper), then thicken them by one pixel.
 const RED=0xa33c25,mask=new Uint8Array(w*h);
 for(let p=0,i=0;p<mask.length;p++,i+=4)if(((a[i]<<16)|(a[i+1]<<8)|a[i+2])===RED)mask[p]=1;
 const grow=new Uint8Array(mask);for(let y=0;y<h;y++)for(let x=0;x<w;x++){if(mask[y*w+x])continue;let n=0;for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){const xx=x+ox,yy=y+oy;if(xx>=0&&yy>=0&&xx<w&&yy<h&&mask[yy*w+xx])n++;}if(n>=1)grow[y*w+x]=1;}
 for(let p=0,i=0;p<grow.length;p++,i+=4)if(grow[p]&&!mask[p]){const v=((a[i]<<16)|(a[i+1]<<8)|a[i+2]);if(v!==0x1c1a14&&v!==0x4a86b4){a[i]=0xa3;a[i+1]=0x3c;a[i+2]=0x25;}}
 c.putImageData(d,0,0);usgsCache.set(image,out);return out;
}
function usgsOverlay(context,c,w,h,scale){
 // Red section lines every 256 m with section numbers, black UTM-style ticks every 64 m.
 const ox=Number(c.cx)*64+c.x,oz=Number(c.cz)*64+c.z,X=v=>Math.round(w/2+(v-ox)*scale)+.5,Z=v=>Math.round(h/2+(v-oz)*scale)+.5;
 const S=256,x0=Math.floor((ox-w/2/scale)/S)*S,z0=Math.floor((oz-h/2/scale)/S)*S;
 context.save();context.strokeStyle='#c2412a';context.lineWidth=1;context.setLineDash([]);context.beginPath();
 for(let x=x0;x<=ox+w/2/scale;x+=S){context.moveTo(X(x),0);context.lineTo(X(x),h);}for(let z=z0;z<=oz+h/2/scale;z+=S){context.moveTo(0,Z(z));context.lineTo(w,Z(z));}context.stroke();
 context.fillStyle='#c2412a';context.font='16px Vonwaon16, monospace';context.textAlign='center';context.textBaseline='middle';
 for(let x=x0;x<=ox+w/2/scale;x+=S)for(let z=z0;z<=oz+h/2/scale;z+=S){const n=((Math.floor(z/S)%6+6)%6)*6+(((Math.floor(z/S)%2)?5-((Math.floor(x/S)%6+6)%6):((Math.floor(x/S)%6+6)%6)))+1;const px=X(x+S/2),pz=Z(z+S/2);if(px>-20&&pz>-20&&px<w+20&&pz<h+20&&S*scale>90)context.fillText(String(n),px,pz);}
 context.restore();
}
// One cached geographic layer; the rotating minimap uses a CSS transform.
// Full-map repaint is event/revision-driven. No secondary WebGL scene/camera.
export function createNavigationMap({host,seed,onOpen,onClose,onTeleport,parts}){
 let zeroWorld=null;
 let level=10,tiles=createMapAtlas({seed,maxTiles:384,tilePixels:128,maxPending:512});
 host.insertAdjacentHTML('beforeend',`<div class="map-mini" id="map-mini" data-ui-part="navigation" hidden><button class="map-mini-button" aria-label="打开地图，快捷键 F" aria-haspopup="dialog" aria-controls="world-map"><span class="map-mini-viewport"><canvas width="288" height="288" aria-hidden="true"></canvas><span class="map-mini-player" aria-hidden="true">▲</span><span class="map-mini-glass" aria-hidden="true"></span></span><canvas class="map-mini-art" width="179" height="204" aria-hidden="true"></canvas><span class="instrument-label"><span>FIELD / NAV</span><span data-ui-copy="number">010</span></span><span class="map-cardinal" data-direction="0">N</span><span class="map-cardinal" data-direction="1">E</span><span class="map-cardinal" data-direction="2">S</span><span class="map-cardinal" data-direction="3">W</span><span class="map-mini-caption"><span class="map-mini-bearing">N 000°</span><span>F 地图</span></span></button></div>
 <div class="modal map-modal" id="world-map" data-ui-part="map" role="dialog" aria-modal="true" aria-labelledby="map-title" hidden><section class="map-panel"><header class="map-header"><div><h2 id="map-title"><span data-ui-copy="code">LEVEL 10</span> / 区域地图</h2><p>拖动浏览 · 滚轮缩放 · 点击地面传送</p></div><button class="map-close" aria-label="关闭地图">F / 返回</button></header><div class="usgs-title"><div class="agency">UNITED STATES<b>M.E.G. FIELD SURVEY</b>BACKROOMS DEPARTMENT OF THE INTERIOR</div><div class="seal" aria-hidden="true"></div><div class="quad">LEVEL 10 QUADRANGLE · 丰裕<b>ABUNDANCE</b>7.5-MINUTE SERIES (TOPOGRAPHIC)</div><div class="actions"><button class="usgs-close" aria-label="关闭地图">F / 返回</button></div></div><div class="map-tools"><button data-map-action="out" aria-label="缩小地图">−</button><span class="map-zoom">100%</span><button data-map-action="in" aria-label="放大地图">＋</button><button data-map-action="center">回到当前位置</button><span class="map-north">↑ 北</span></div><div class="map-surface"><canvas class="map-canvas" tabindex="0" aria-label="世界地图，拖动或方向键浏览，点击或 Enter 传送，加减号缩放"></canvas><div class="map-scale"><i></i><span>100 m</span></div><div class="map-loading" role="status"></div></div><footer class="map-footer"><div class="map-legend"><span><i class="map-swatch wheat"></i>小麦</span><span><i class="map-swatch" style="background:#998061"></i>大麦</span><span><i class="map-swatch" style="background:#81705b"></i>麦茬</span><span><i class="map-swatch grass"></i>草地</span><span><i class="map-swatch water"></i>湖泊</span><span><i class="map-swatch trees"></i>树木 / 灌木</span><span><i class="map-swatch building"></i>建筑</span><span><i class="map-swatch road"></i>小径</span></div><div class="map-readout" aria-live="polite">点击地图可传送；湖泊会落在岸边。</div></footer><div class="usgs-foot"><div>Mapped, edited, and published by the M.E.G. Field Survey<br>Control by aerial triangulation · Field checked 1997<br>Polyconic projection · 64-metre grid ticks</div><div class="bar"><i></i><span><b>0</b><b>100</b><b>200 METRES</b></span><span style="justify-content:center">SCALE 1:24 000 · CONTOUR INTERVAL 10 FEET</span></div><div class="right decl"><div>LEVEL 10, N.D.<br>1997<br>AMS 0010 IV NE—SERIES V877</div><svg viewBox="0 0 14 22" aria-hidden="true"><path d="M7 0L7 22M5 2L7 0L9 2M10 3L11 2L12 3L11 4Z" stroke="#1c1a14" fill="none" stroke-width="1"/><path d="M7 22L11 4" stroke="#1c1a14" stroke-width="1"/><text x="0" y="8" font-size="4" fill="#1c1a14">★</text></svg></div></div></section></div>`);
 let domCompassRev='',domCompassAt=0;const mini=host.querySelector('#map-mini'),miniButton=mini.querySelector('button'),miniCanvas=mini.querySelector('.map-mini-viewport canvas'),miniCtx=miniCanvas.getContext('2d',{alpha:false});const domArt=document.createElement('canvas');domArt.className='map-mini-dom';domArt.setAttribute('aria-hidden','true');mini.querySelector('button').append(domArt);const domArtCtx=domArt.getContext('2d');
 const modal=host.querySelector('#world-map'),canvas=modal.querySelector('.map-canvas'),ctx=canvas.getContext('2d',{alpha:false}),surface=modal.querySelector('.map-surface');
 const label=modal.querySelector('.map-readout'),loading=modal.querySelector('.map-loading'),cardinals=[...mini.querySelectorAll('.map-cardinal')];
 let center=null,player=null,zoom=1.5,open=false,busy=false,dirty=true,lastMini=0,miniCenter=null,lastRevision=-1,lastMapRevision=-1,lastYaw=NaN,pointer=null,hover=null,keyboardTarget=false,disposed=false;
 let counts={minimapPaints:0,mapPaints:0};
 let uiTokens={};
 let uiPalette={mapBackground:'#f1ead2',mapGrid:'#364037',mapPlayer:'#fff3c4',mapOutline:'#121b18',mapCursor:'#fff2c1'};
 function setUITheme(tokens){
  uiTokens={...tokens};
  const next={...uiPalette};let changed=false;
  for(const key of Object.keys(next))if(typeof tokens[key]==='string'&&tokens[key]!==next[key]){next[key]=tokens[key];changed=true;}
  if(!changed)return;
  uiPalette=next;dirty=true;miniCenter=null;lastRevision=-1;lastMapRevision=-1;
 }
 function setStatus(text){label.textContent=text;}
 function resize(){if(!open)return;const r=surface.getBoundingClientRect(),w=Math.max(1,Math.min(1280,Math.round(r.width))),h=Math.max(1,Math.min(860,Math.round(r.height)));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;dirty=true;}}
 const observer=new ResizeObserver(resize);observer.observe(surface);
 function relative(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*canvas.width/r.width,z:(e.clientY-r.top)*canvas.height/r.height};}
 function cursorPoint(p){return mapPoint(center,(p.x-canvas.width/2)/zoom,(p.z-canvas.height/2)/zoom);}
 function describe(p){if(level===0)return 'Level 0 · '+pointText(p); const hit=tiles.hitTest?.(p.cx,p.cz,p.x,p.z);return `${hit?.label||'地面'} · ${pointText(p)}`;}
 function changeZoom(factor,anchor=null){if(busy)return;const old=zoom,next=Math.max(level===27?12:1,Math.min(level===27?80:8,zoom*factor));if(next===old)return;
  if(anchor){center=mapPoint(center,(anchor.x-canvas.width/2)*(1/old-1/next),(anchor.z-canvas.height/2)*(1/old-1/next));}
  zoom=next;dirty=true;modal.querySelector('.map-zoom').textContent=Math.round(zoom/1.5*100)+'%';tiles.cancelPending();
 }
 function teleport(p){if(busy)return;if(level===27){setStatus('Level 27 · 沿溪流旁原石踏步返回入口');return;}setStatus(`正在准备落点 · ${pointText(p)}`);onTeleport({...p,yaw:player?.yaw||0});}
 miniButton.addEventListener('click',onOpen);modal.querySelector('.map-close').addEventListener('click',onClose);modal.querySelector('.usgs-close').addEventListener('click',onClose);
 modal.querySelector('[data-map-action="out"]').onclick=()=>changeZoom(1/1.35);
 modal.querySelector('[data-map-action="in"]').onclick=()=>changeZoom(1.35);
 modal.querySelector('[data-map-action="center"]').onclick=()=>{if(player&&!busy){center={...player};hover=null;keyboardTarget=false;tiles.cancelPending();dirty=true;}};
 canvas.addEventListener('pointerdown',e=>{if(busy||e.button!==0)return;e.preventDefault();canvas.focus();const p=relative(e);pointer={id:e.pointerId,start:p,last:p,moved:false};canvas.setPointerCapture(e.pointerId);});
 canvas.addEventListener('pointermove',e=>{if(busy)return;const p=relative(e);hover=p;keyboardTarget=false;
  if(pointer?.id===e.pointerId){if(Math.hypot(p.x-pointer.start.x,p.z-pointer.start.z)>6)pointer.moved=true;if(pointer.moved){center=mapPoint(center,(pointer.last.x-p.x)/zoom,(pointer.last.z-p.z)/zoom);dirty=true;}pointer.last=p;}
  setStatus(describe(cursorPoint(p)));dirty=true;
 });
 canvas.addEventListener('pointerup',e=>{if(pointer?.id!==e.pointerId)return;const click=!pointer.moved,p=relative(e);pointer=null;if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);if(click)teleport(cursorPoint(p));});
 canvas.addEventListener('pointercancel',()=>pointer=null);
 canvas.addEventListener('lostpointercapture',()=>pointer=null);
 canvas.addEventListener('pointerleave',()=>{if(!pointer){hover=null;dirty=true;}});
 canvas.addEventListener('wheel',e=>{e.preventDefault();changeZoom(e.deltaY<0?1.18:1/1.18,relative(e));},{passive:false});
 canvas.addEventListener('keydown',e=>{
  if(busy)return;const direction={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.code];
  if(direction){e.preventDefault();center=mapPoint(center,direction[0]*48/zoom,direction[1]*48/zoom);hover=null;keyboardTarget=true;dirty=true;setStatus(describe(center));}
  else if(e.code==='Equal'||e.code==='NumpadAdd'){e.preventDefault();changeZoom(1.35);}
  else if(e.code==='Minus'||e.code==='NumpadSubtract'){e.preventDefault();changeZoom(1/1.35);}
  else if(e.code==='Enter'){e.preventDefault();teleport(center);}
 });
 function visibleTiles(c,w,h,scale){
  const minX=Math.floor((c.x-w/2/scale)/64),maxX=Math.floor((c.x+w/2/scale)/64),minZ=Math.floor((c.z-h/2/scale)/64),maxZ=Math.floor((c.z+h/2/scale)/64),list=[];
  for(let dz=minZ;dz<=maxZ;dz++)for(let dx=minX;dx<=maxX;dx++)list.push({cx:c.cx+BigInt(dx),cz:c.cz+BigInt(dz),x:w/2+(dx*64-c.x)*scale,z:h/2+(dz*64-c.z)*scale,d:(dx*64+32-c.x)**2+(dz*64+32-c.z)**2});
  return list;
 }
 let urbanReferenceShapes=[];const GMAPS_CITY=true;const gmUpdate=mountGmapsChrome(modal,{invalidate:()=>{dirty=true;}});mountGmapsVitals();const cadUpdate=mountCadChrome(modal,{onClose});mountTaskManager();
 function setUrbanReferenceShapes(shapes){urbanReferenceShapes=shapes.filter(q=>q.kind==='obb'&&q.w>4&&q.d>4);dirty=true;miniCenter=null;}
 function cityPaint(context,c,w,h,scale){
  // V101: Level 11 uses the classic-maps palette (gmaps-ui.js); legacy painter kept below.
  if(GMAPS_CITY)return gmCityPaint(context,c,w,h,scale,urbanReferenceShapes,{labels:context===ctx});
  context.fillStyle='#555a57';context.fillRect(0,0,w,h);
  const ox=Number(c.cx)*64+c.x,oz=Number(c.cz)*64+c.z;
  const xy=p=>[w/2+(p.x-ox)*scale,h/2+(p.z-oz)*scale];
  const center=worldToCity(ox,oz),bx=Math.floor(center.x/CITY_BLOCK),bz=Math.floor(center.z/CITY_BLOCK),r=Math.ceil(Math.max(w,h)/scale/CITY_BLOCK*.72)+1;
  context.strokeStyle='#303735';context.lineWidth=22*scale;
  for(let i=-r;i<=r;i++){for(const axis of[0,1]){const a=xy(cityToWorld(axis?(bx-r)*CITY_BLOCK:(bx+i)*CITY_BLOCK,axis?(bz+i)*CITY_BLOCK:(bz-r)*CITY_BLOCK)),b=xy(cityToWorld(axis?(bx+r+1)*CITY_BLOCK:(bx+i)*CITY_BLOCK,axis?(bz+i)*CITY_BLOCK:(bz+r+1)*CITY_BLOCK));context.beginPath();context.moveTo(...a);context.lineTo(...b);context.stroke();}}
  context.fillStyle='#555a57';context.beginPath();for(const [i,p]of [[-110,-32],[110,-32],[110,448],[-110,448]].map((p,i)=>[i,xy(cityToWorld(...p))])){if(!i)context.moveTo(...p);else context.lineTo(...p);}context.closePath();context.fill();context.lineWidth=22*scale;for(const segment of[[0,-32,0,448],[-160,0,160,0]]){context.beginPath();context.moveTo(...xy(cityToWorld(segment[0],segment[1])));context.lineTo(...xy(cityToWorld(segment[2],segment[3])));context.stroke();}
  for(const q of urbanReferenceShapes){context.fillStyle='#a0a39a';context.beginPath();for(let k=0;k<4;k++){const u=(k===0||k===3?-1:1)*q.w/2,v=(k<2?-1:1)*q.d/2,p=xy({x:q.x+Math.cos(q.ry)*u+Math.sin(q.ry)*v,z:q.z-Math.sin(q.ry)*u+Math.cos(q.ry)*v});if(!k)context.moveTo(...p);else context.lineTo(...p);}context.closePath();context.fill();}
  for(let iz=bz-r;iz<=bz+r;iz++)for(let ix=bx-r;ix<=bx+r;ix++)for(const b of cityBlockPlan(ix,iz,BUILDING_TYPES).buildings){context.fillStyle=b.floors>7?'#a0a39a':'#878b80';context.beginPath();for(let k=0;k<4;k++){const u=(k===0||k===3?-1:1)*b.w/2,v=(k<2?-1:1)*b.d/2,p=xy(cityToWorld(b.x+Math.cos(b.ry)*u+Math.sin(b.ry)*v,b.z-Math.sin(b.ry)*u+Math.cos(b.ry)*v));if(k===0)context.moveTo(...p);else context.lineTo(...p);}context.closePath();context.fill();}
  context.strokeStyle='#303735';context.lineWidth=13*scale;context.beginPath();for(let s=110;s<=430;s+=8){const p=xy(exitPoint(s));if(s===110)context.moveTo(...p);else context.lineTo(...p);}context.stroke();
  return 0;
 }
 function springPaint(context,c,w,h,scale){context.fillStyle='#18211d';context.fillRect(0,0,w,h);const x=p=>w/2+(p[0]-c.x)*scale,z=p=>h/2+(p[1]-c.z)*scale;context.fillStyle='#656956';context.beginPath();context.ellipse(x([ANNEX.x,0]),z([0,ANNEX.z]),ANNEX.rx*scale,ANNEX.rz*scale,0,0,Math.PI*2);context.fill();context.fillRect(x([1.1,0]),z([0,-10.4]),3.8*scale,7.4*scale);context.fillStyle='#276b60';context.beginPath();CAVE_PLAN.forEach((p,i)=>i?context.lineTo(x(p),z(p)):context.moveTo(x(p),z(p)));context.closePath();context.fill();context.strokeStyle='#9dc4ad';context.lineWidth=1.3;context.stroke();context.strokeStyle='#638d87';context.lineWidth=.60*scale;context.beginPath();streamPath().forEach((p,i)=>i?context.lineTo(x([p[0],0]),z([0,p[2]])):context.moveTo(x([p[0],0]),z([0,p[2]])));context.stroke();context.strokeStyle='#c0b494';context.lineWidth=1.2;for(let i=0;i<STAIRS.count;i++){const zz=STAIRS.start+(i+.5)*STAIRS.tread,xx=stairCenter(zz);context.beginPath();for(let j=0;j<=12;j++){const px=xx+(j/12-.5)*1.06,pz=stairBoundary(i+1,px);if(j)context.lineTo(x([px,0]),z([0,pz]));else context.moveTo(x([px,0]),z([0,pz]));}context.stroke();}return 0;}
 function setLevel(value){if(level===value)return;level=value;zoom=level===27?28:level===0?6:1.5;modal.querySelector('.map-zoom').textContent=Math.round(zoom/1.5*100)+'%';tiles.dispose();if(level===10)tiles=createMapAtlas({seed,maxTiles:384,tilePixels:128,maxPending:512});dirty=true;miniCenter=null;lastRevision=lastMapRevision=-1;modal.querySelector('.map-legend').hidden=level!==10;modal.querySelector('.map-header p').textContent=level===27?'岩体泉 · 泉池、石滩与返回通道':'拖动浏览 · 滚轮缩放 · 点击地面传送';setStatus(level===0?'Level 0 · 点击传送至安全地毯；黑色区域为深坑':level===27?'Level 27 · 独立岩洞 · 沿溪流旁原石踏步返回':level===11?'Level 11 · 连续城市街网 · F2 前往金融街或广场':'点击地图可传送；湖泊会落在岸边。');}
 function terrainPaint(context,c,w,h,scale,usgs=false){
  if(level===0&&zeroWorld){const ox=Number(c.cx)*64+c.x,oz=Number(c.cz)*64+c.z;context.fillStyle='#252216';context.fillRect(0,0,w,h);zeroWorld.map(context,ox,oz,w/2,h/2,scale,Math.max(w,h)/scale/2+22);
   // V102b: AutoCAD R14 blueprint (win98-ui.js) for both minimap and full map.
   blueprintize(context,w,h,ox,oz,scale,{grid:true});if(context===ctx)cadUCS(context,w,h);return 0;}
  if(level===27)return springPaint(context,c,w,h,scale);
  if(level===11)return cityPaint(context,c,w,h,scale);
  context.fillStyle=uiPalette.mapBackground;context.fillRect(0,0,w,h);context.imageSmoothingEnabled=false;const list=visibleTiles(c,w,h,scale);let missing=0;
  if(usgs){context.fillStyle='#f1ead2';context.fillRect(0,0,w,h);}
  for(const tile of list){const image=tiles.request(tile.cx,tile.cz,tile.d);if(image){context.drawImage(image,Math.round(tile.x),Math.round(tile.z),Math.ceil(64*scale)+1,Math.ceil(64*scale)+1);}else{missing++;context.strokeStyle=uiPalette.mapGrid;context.strokeRect(tile.x,tile.z,64*scale,64*scale);}}
  const px=w/2+(OUTPOST.x-Number(c.cx)*64-c.x)*scale,pz=h/2+(OUTPOST.z-Number(c.cz)*64-c.z)*scale;
  if(px>-40&&pz>-40&&px<w+40&&pz<h+40){context.save();context.translate(px,pz);context.fillStyle='#e9dfc3';context.strokeStyle='#1c1a14';context.lineWidth=1;context.fillRect(-OUTPOST.hx*scale,-OUTPOST.hz*scale,OUTPOST.hx*2*scale,OUTPOST.hz*2*scale);context.strokeRect(-OUTPOST.hx*scale,-OUTPOST.hz*scale,OUTPOST.hx*2*scale,OUTPOST.hz*2*scale);const draw=(p,width,depth,color)=>{context.save();context.translate(p[0]*scale,p[1]*scale);context.rotate(-p[2]);context.fillStyle=color;context.fillRect(-width/2*scale,-depth/2*scale,width*scale,depth*scale);context.restore();};for(const p of [CAMP.office,CAMP.kitchen])draw(p,8,10,'#1c1a14');for(const p of CAMP.dorms)draw(p,3.8,4.8,'#1c1a14');draw(CAMP.container,7,3.2,'#777d6b');if(scale>.65){context.fillStyle='#eee1ac';context.font='bold 10px sans-serif';context.fillText('M.E.G.',-14,4);}context.restore();}
  if(usgs)usgsOverlay(context,c,w,h,scale);
  return missing;
 }
 function drawPlayer(context,c,w,h,scale){const p=mapOffset(player,c);if(!p)return;const x=w/2+p.x*scale,z=h/2+p.z*scale;if(x< -20||z< -20||x>w+20||z>h+20)return;
  if(level===11&&context===ctx){gmDrawPin(context,x,z,player.yaw);return;}
  if(level===0){cadPlayer(context,x,z,player.yaw);return;}
  context.save();context.translate(x,z);context.rotate(-player.yaw);context.beginPath();context.moveTo(0,-9);context.lineTo(6,7);context.lineTo(0,4);context.lineTo(-6,7);context.closePath();const u=level===10&&context===ctx;context.fillStyle=u?'#c2412a':uiPalette.mapPlayer;context.strokeStyle=u?'#1c1a14':uiPalette.mapOutline;context.lineWidth=3;context.stroke();context.fill();context.restore();
 }
 function paintMap(){const missing=terrainPaint(ctx,center,canvas.width,canvas.height,zoom,level===10);ctx.imageSmoothingEnabled=false;drawPlayer(ctx,center,canvas.width,canvas.height,zoom);
  const p=hover||keyboardTarget&&{x:canvas.width/2,z:canvas.height/2};if(p&&level===0)cadCursor(ctx,p,canvas.width,canvas.height);else if(p){ctx.strokeStyle=level===10?'#1c1a14':uiPalette.mapCursor;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(p.x-8,p.z);ctx.lineTo(p.x+8,p.z);ctx.moveTo(p.x,p.z-8);ctx.lineTo(p.x,p.z+8);ctx.stroke();}
  const metres=level===27?2:zoom>4?10:zoom>2?25:50;modal.querySelector('.map-scale i').style.width=(metres*zoom/canvas.width*surface.clientWidth)+'px';modal.querySelector('.map-scale span').textContent=metres+' m';if(level===11)gmUpdate(zoom,player?.yaw||0);if(level===0)cadUpdate(zoom);loading.textContent=busy?'正在准备目的地…':missing?'正在绘制周边…':'';counts.mapPaints++;dirty=false;
 }
 function update(state,now,visible,allowWork=true){if(disposed)return;player={cx:state.cx,cz:state.cz,x:state.x,z:state.z,yaw:state.yaw};if(mini.hidden!==(!visible||open))mini.hidden=!visible||open;
  if(!visible&&!open)return;
  if(open){resize();const revision=tiles.stats().revision;if(revision!==lastMapRevision)dirty=true;if(dirty){paintMap();lastMapRevision=revision;}}
  else{
   const yaw=((state.yaw%(Math.PI*2))+Math.PI*2)%(Math.PI*2);
   if(yaw!==lastYaw){miniCanvas.style.transform=`translate(-50%,-50%) rotate(${yaw}rad)`;const bearing=(Math.round(-yaw*180/Math.PI)+360)%360;mini.querySelector('.map-mini-bearing').textContent=`${['N','NE','E','SE','S','SW','W','NW'][Math.round(bearing/45)%8]} ${String(bearing).padStart(3,'0')}°`;
    cardinals.forEach((el,i)=>{const a=yaw+i*Math.PI/2;el.style.left=`${(128+Math.sin(a)*92)/256*100}%`;el.style.top=`${(140-Math.cos(a)*92)/292*100}%`;});lastYaw=yaw;}
   const offset=miniCenter&&mapOffset(player,miniCenter),revision=tiles.stats().revision;
   if(now-lastMini>=100&&(!offset||Math.hypot(offset.x,offset.z)>.35||revision!==lastRevision)){terrainPaint(miniCtx,player,MINI,MINI,level===27?21:level===0?4.8:MINI_SCALE);miniCenter={...player};lastMini=now;lastRevision=revision;counts.minimapPaints++;}
  }
  // V100: with the UI raster off (DOM UI) nothing painted the compass dial;
  // draw the same instrument into its own canvas whenever it changes.
  if(!open&&!mini.classList.contains('raster-source')){const rev=counts.minimapPaints+','+lastYaw;if(rev!==domCompassRev||now-domCompassAt>1000){const r=mini.getBoundingClientRect(),dpr=Math.min(2,devicePixelRatio||1),w=Math.round(r.width*dpr),h=Math.round(r.height*dpr);if(w>0&&h>0){if(domArt.width!==w||domArt.height!==h){domArt.width=w;domArt.height=h;}domArtCtx.setTransform(1,0,0,1,0,0);domArtCtx.clearRect(0,0,w,h);api.paint(domArtCtx,{left:0,top:0,width:w,height:h});domCompassRev=rev;domCompassAt=now;}}}
  if(allowWork&&level===10){const before=tiles.stats().revision;tiles.pump(open?2.5:.7,open?3:1);if(tiles.stats().revision!==before)dirty=true;}
 }
 function show(state){center={cx:state.cx,cz:state.cz,x:state.x,z:state.z};player={...center,yaw:state.yaw};open=true;modal.hidden=false;hover=null;keyboardTarget=false;dirty=true;tiles.cancelPending();resize();setStatus(level===0?'Level 0 · 点击传送至安全地毯；黑色区域为深坑':level===27?'Level 27 · 独立岩洞 · 沿溪流旁原石踏步返回':level===11?'Level 11 入口街区 · F2 返回麦田':'点击地图可传送；湖泊会落在岸边。');}
 function hide(){open=false;modal.hidden=true;pointer=null;tiles.cancelPending();miniCenter=null;}
 function setBusy(value,text){busy=value;modal.setAttribute('aria-busy',String(value));modal.querySelectorAll('button').forEach(b=>b.disabled=value);if(text)setStatus(text);dirty=true;}
 function dispose(){disposed=true;observer.disconnect();tiles.dispose();mini.remove();modal.remove();}
 const api={root:mini,paint(c,r){c.save();c.translate(r.left,r.top);if(level===0){const k=Math.min(r.width/256,r.height/296);c.translate((r.width-256*k)/2,(r.height-296*k)/2);c.scale(k,k);paintWin98Compass(c,miniCanvas,player?.yaw||0,mini.querySelector('.map-mini-bearing').textContent);c.restore();return;}if(level===11){const k=Math.min(r.width/256,r.height/296);c.translate((r.width-256*k)/2,(r.height-296*k)/2);c.scale(k,k);paintSafariCompass(c,miniCanvas,player?.yaw||0,mini.querySelector('.map-mini-bearing').textContent);c.restore();return;}c.scale(r.width/256,r.height/296);paintCompass(c,parts,miniCanvas,player?.yaw||0,mini.querySelector('.map-mini-bearing').textContent,{...uiTokens,pixelMode:document.body.dataset.filter==='ps1'});c.restore();},get revision(){return counts.minimapPaints+','+counts.mapPaints+','+lastYaw;},setLevel0World(world){zeroWorld=world;dirty=true;miniCenter=null;},invalidate(){dirty=true;miniCenter=null;},update,show,hide,setLevel,setUrbanReferenceShapes,setBusy,setStatus,setUITheme,dispose,modal,stats:()=>({...counts,...tiles.stats()}),get isOpen(){return open;}};return api;
}
