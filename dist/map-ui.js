import {paintCompass} from './retro-instruments.js?v=38';
import {createMapAtlas} from './map-atlas.js?v=38';

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

// One cached geographic layer; the rotating minimap uses a CSS transform.
// Full-map repaint is event/revision-driven. No secondary WebGL scene/camera.
export function createNavigationMap({host,seed,onOpen,onClose,onTeleport,parts}){
 const tiles=createMapAtlas({seed,maxTiles:384,tilePixels:128,maxPending:512});
 host.insertAdjacentHTML('beforeend',`<div class="map-mini" id="map-mini" data-ui-part="navigation" hidden><button class="map-mini-button" aria-label="打开地图，快捷键 F" aria-haspopup="dialog" aria-controls="world-map"><span class="map-mini-viewport"><canvas width="288" height="288" aria-hidden="true"></canvas><span class="map-mini-player" aria-hidden="true">▲</span><span class="map-mini-glass" aria-hidden="true"></span></span><canvas class="map-mini-art" width="179" height="204" aria-hidden="true"></canvas><span class="instrument-label"><span>FIELD / NAV</span><span data-ui-copy="number">010</span></span><span class="map-cardinal" data-direction="0">N</span><span class="map-cardinal" data-direction="1">E</span><span class="map-cardinal" data-direction="2">S</span><span class="map-cardinal" data-direction="3">W</span><span class="map-mini-caption"><span class="map-mini-bearing">N 000°</span><span>F 地图</span></span></button></div>
 <div class="modal map-modal" id="world-map" data-ui-part="map" role="dialog" aria-modal="true" aria-labelledby="map-title" hidden><section class="map-panel"><header class="map-header"><div><h2 id="map-title"><span data-ui-copy="code">LEVEL 10</span> / 区域地图</h2><p>拖动浏览 · 滚轮缩放 · 点击地面传送</p></div><button class="map-close" aria-label="关闭地图">F / 返回</button></header><div class="map-tools"><button data-map-action="out" aria-label="缩小地图">−</button><span class="map-zoom">100%</span><button data-map-action="in" aria-label="放大地图">＋</button><button data-map-action="center">回到当前位置</button><span class="map-north">↑ 北</span></div><div class="map-surface"><canvas class="map-canvas" tabindex="0" aria-label="世界地图，拖动或方向键浏览，点击或 Enter 传送，加减号缩放"></canvas><div class="map-scale"><i></i><span>100 m</span></div><div class="map-loading" role="status"></div></div><footer class="map-footer"><div class="map-legend"><span><i class="map-swatch wheat"></i>小麦</span><span><i class="map-swatch" style="background:#998061"></i>大麦</span><span><i class="map-swatch" style="background:#81705b"></i>麦茬</span><span><i class="map-swatch grass"></i>草地</span><span><i class="map-swatch water"></i>湖泊</span><span><i class="map-swatch trees"></i>树木 / 灌木</span><span><i class="map-swatch building"></i>建筑</span><span><i class="map-swatch road"></i>小径</span></div><div class="map-readout" aria-live="polite">点击地图可传送；湖泊会落在岸边。</div></footer></section></div>`);
 const mini=host.querySelector('#map-mini'),miniButton=mini.querySelector('button'),miniCanvas=mini.querySelector('.map-mini-viewport canvas'),miniCtx=miniCanvas.getContext('2d',{alpha:false});
 const modal=host.querySelector('#world-map'),canvas=modal.querySelector('.map-canvas'),ctx=canvas.getContext('2d',{alpha:false}),surface=modal.querySelector('.map-surface');
 const label=modal.querySelector('.map-readout'),loading=modal.querySelector('.map-loading'),cardinals=[...mini.querySelectorAll('.map-cardinal')];
 let center=null,player=null,zoom=1.5,open=false,busy=false,dirty=true,lastMini=0,miniCenter=null,lastRevision=-1,lastMapRevision=-1,lastYaw=NaN,pointer=null,hover=null,keyboardTarget=false,disposed=false;
 let counts={minimapPaints:0,mapPaints:0};
 let uiTokens={};
 let uiPalette={mapBackground:'#27302a',mapGrid:'#364037',mapPlayer:'#fff3c4',mapOutline:'#121b18',mapCursor:'#fff2c1'};
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
 function describe(p){const hit=tiles.hitTest?.(p.cx,p.cz,p.x,p.z);return `${hit?.label||'地面'} · ${pointText(p)}`;}
 function changeZoom(factor,anchor=null){if(busy)return;const old=zoom,next=Math.max(1,Math.min(8,zoom*factor));if(next===old)return;
  if(anchor){center=mapPoint(center,(anchor.x-canvas.width/2)*(1/old-1/next),(anchor.z-canvas.height/2)*(1/old-1/next));}
  zoom=next;dirty=true;modal.querySelector('.map-zoom').textContent=Math.round(zoom/1.5*100)+'%';tiles.cancelPending();
 }
 function teleport(p){if(busy)return;setStatus(`正在准备落点 · ${pointText(p)}`);onTeleport({...p,yaw:player?.yaw||0});}
 miniButton.addEventListener('click',onOpen);modal.querySelector('.map-close').addEventListener('click',onClose);
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
 function terrainPaint(context,c,w,h,scale){
  context.fillStyle=uiPalette.mapBackground;context.fillRect(0,0,w,h);context.imageSmoothingEnabled=false;const list=visibleTiles(c,w,h,scale);let missing=0;
  for(const tile of list){const image=tiles.request(tile.cx,tile.cz,tile.d);if(image){context.drawImage(image,tile.x,tile.z,64*scale+.5,64*scale+.5);}else{missing++;context.strokeStyle=uiPalette.mapGrid;context.strokeRect(tile.x,tile.z,64*scale,64*scale);}}
  return missing;
 }
 function drawPlayer(context,c,w,h,scale){const p=mapOffset(player,c);if(!p)return;const x=w/2+p.x*scale,z=h/2+p.z*scale;if(x< -20||z< -20||x>w+20||z>h+20)return;
  context.save();context.translate(x,z);context.rotate(-player.yaw);context.beginPath();context.moveTo(0,-9);context.lineTo(6,7);context.lineTo(0,4);context.lineTo(-6,7);context.closePath();context.fillStyle=uiPalette.mapPlayer;context.strokeStyle=uiPalette.mapOutline;context.lineWidth=3;context.stroke();context.fill();context.restore();
 }
 function paintMap(){const missing=terrainPaint(ctx,center,canvas.width,canvas.height,zoom);drawPlayer(ctx,center,canvas.width,canvas.height,zoom);
  const p=hover||keyboardTarget&&{x:canvas.width/2,z:canvas.height/2};if(p){ctx.strokeStyle=uiPalette.mapCursor;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(p.x-8,p.z);ctx.lineTo(p.x+8,p.z);ctx.moveTo(p.x,p.z-8);ctx.lineTo(p.x,p.z+8);ctx.stroke();}
  const metres=zoom>4?10:zoom>2?25:50;modal.querySelector('.map-scale i').style.width=(metres*zoom/canvas.width*surface.clientWidth)+'px';modal.querySelector('.map-scale span').textContent=metres+' m';loading.textContent=busy?'正在准备目的地…':missing?'正在绘制周边…':'';counts.mapPaints++;dirty=false;
 }
 function update(state,now,visible,allowWork=true){if(disposed)return;player={cx:state.cx,cz:state.cz,x:state.x,z:state.z,yaw:state.yaw};if(mini.hidden!==(!visible||open))mini.hidden=!visible||open;
  if(!visible&&!open)return;
  if(open){resize();const revision=tiles.stats().revision;if(revision!==lastMapRevision)dirty=true;if(dirty){paintMap();lastMapRevision=revision;}}
  else{
   const yaw=((state.yaw%(Math.PI*2))+Math.PI*2)%(Math.PI*2);
   if(yaw!==lastYaw){miniCanvas.style.transform=`translate(-50%,-50%) rotate(${yaw}rad)`;const bearing=(Math.round(-yaw*180/Math.PI)+360)%360;mini.querySelector('.map-mini-bearing').textContent=`${['N','NE','E','SE','S','SW','W','NW'][Math.round(bearing/45)%8]} ${String(bearing).padStart(3,'0')}°`;
    cardinals.forEach((el,i)=>{const a=yaw+i*Math.PI/2;el.style.left=`${(128+Math.sin(a)*92)/256*100}%`;el.style.top=`${(140-Math.cos(a)*92)/292*100}%`;});lastYaw=yaw;}
   const offset=miniCenter&&mapOffset(player,miniCenter),revision=tiles.stats().revision;
   if(now-lastMini>=100&&(!offset||Math.hypot(offset.x,offset.z)>.35||revision!==lastRevision)){terrainPaint(miniCtx,player,MINI,MINI,MINI_SCALE);miniCenter={...player};lastMini=now;lastRevision=revision;counts.minimapPaints++;}
  }
  if(allowWork){const before=tiles.stats().revision;tiles.pump(open?2.5:.7,open?3:1);if(tiles.stats().revision!==before)dirty=true;}
 }
 function show(state){center={cx:state.cx,cz:state.cz,x:state.x,z:state.z};player={...center,yaw:state.yaw};open=true;modal.hidden=false;hover=null;keyboardTarget=false;dirty=true;tiles.cancelPending();resize();setStatus('点击地图可传送；湖泊会落在岸边。');}
 function hide(){open=false;modal.hidden=true;pointer=null;tiles.cancelPending();miniCenter=null;}
 function setBusy(value,text){busy=value;modal.setAttribute('aria-busy',String(value));modal.querySelectorAll('button').forEach(b=>b.disabled=value);if(text)setStatus(text);dirty=true;}
 function dispose(){disposed=true;observer.disconnect();tiles.dispose();mini.remove();modal.remove();}
 return{root:mini,paint(c,r){c.save();c.translate(r.left,r.top);c.scale(r.width/256,r.height/296);paintCompass(c,parts,miniCanvas,player?.yaw||0,mini.querySelector('.map-mini-bearing').textContent,{...uiTokens,pixelMode:document.body.dataset.filter==='ps1'});c.restore();},get revision(){return counts.minimapPaints+','+counts.mapPaints+','+lastYaw;},update,show,hide,setBusy,setStatus,setUITheme,dispose,modal,stats:()=>({...counts,...tiles.stats()}),get isOpen(){return open;}};
}
