// V102b · Level 0 "Windows 98, but yellow" UI.
// UI-only (no world/renderer state): the Date/Time-applet style compass that frames the
// minimap, the AutoCAD R14 blueprint recolour + window chrome for the full map (F), and a
// Windows Task Manager (Performance tab) vitals window. CSS lives in win98-ui.css and the
// generated vendor/98css/98-level0.css, all scoped to :root[data-ui-level="0"].
// References: Win98 Date/Time Properties clock (dotted ring, cyan hour squares, bevelled
// hands), Windows NT/2000 Task Manager Performance tab (green LED meters + history grid),
// AutoCAD Release 14 (title/menu/Standard + Object Properties toolbars, docked Draw toolbar,
// UCS icon, 3-line command window, SNAP GRID ORTHO OSNAP MODEL TILE status bar).
export const W98={face:'#d6c47c',light:'#ebdfa6',hi:'#fffbe8',shadow:'#857337',dark:'#1a1606',title1:'#5e4708',title2:'#d1a536',field:'#fffbe8',text:'#1a1606',cyan:'#00a8a8'};
const SM="Vonwaon12, 'MS Sans Serif', SimSun, monospace",MD="Vonwaon16, Vonwaon12, 'MS Sans Serif', SimSun, monospace";
const img=src=>{if(typeof Image==='undefined')return null;const i=new Image();i.src=src;return i;};
const ICON={globe:img('./assets/ui-v102/globe-icon-16.png'),globe32:img('./assets/ui-v102/globe-icon-32.png'),bos:img('./assets/ui-v102/backos-icon-16.png')};
const isL0=()=>document.documentElement.dataset.uiLevel==='0';

// ---------- canvas Win98 primitives ----------
function px(c,x,y,w,h,col){c.fillStyle=col;c.fillRect(x,y,w,h);}
function bevel(c,x,y,w,h,raised=true,win=false){
 // 98.css: button = outer(TL #fff, BR #0a0a0a) inner(TL #dfdfdf, BR grey); window swaps outer/inner TL.
 const P=W98,oTL=raised?(win?P.light:P.hi):P.shadow,oBR=raised?P.dark:P.hi,iTL=raised?(win?P.hi:P.light):P.dark,iBR=raised?P.shadow:P.light;
 px(c,x,y,w,1,oTL);px(c,x,y,1,h,oTL);px(c,x,y+h-1,w,1,oBR);px(c,x+w-1,y,1,h,oBR);
 px(c,x+1,y+1,w-2,1,iTL);px(c,x+1,y+1,1,h-2,iTL);px(c,x+1,y+h-2,w-2,1,iBR);px(c,x+w-2,y+1,1,h-2,iBR);
}
function button(c,x,y,w,h,label,font=SM){px(c,x,y,w,h,W98.face);bevel(c,x,y,w,h,true);if(label){c.fillStyle=W98.text;c.font=`12px ${font}`;c.textAlign='center';c.textBaseline='middle';c.fillText(label,x+w/2,y+h/2+1);}}
function titleBar(c,x,y,w,title,icon,{help=true}={}){
 const g=c.createLinearGradient(x,0,x+w,0);g.addColorStop(0,W98.title1);g.addColorStop(1,W98.title2);c.fillStyle=g;c.fillRect(x,y,w,18);
 if(icon?.complete&&icon.naturalWidth)c.drawImage(icon,x+2,y+1,16,16);
 c.fillStyle='#fffbe8';c.font=`12px ${SM}`;c.textAlign='left';c.textBaseline='middle';c.fillText(title,x+21,y+10);
 const bx=x+w-18;button(c,bx,y+2,16,14);c.fillStyle=W98.text;c.fillRect(bx+4,y+5,2,1);c.fillRect(bx+10,y+5,2,1);for(let k=0;k<6;k++){c.fillRect(bx+4+k,y+5+k,2,1);c.fillRect(bx+10-k,y+5+k,2,1);} // ×
 if(help){const hx=bx-18;button(c,hx,y+2,16,14);c.font=`bold 11px ${SM}`;c.textAlign='center';c.fillText('?',hx+8,y+10);}
}
function etched(c,x,y,w,h,label){
 c.strokeStyle=W98.shadow;c.lineWidth=1;c.strokeRect(x+.5,y+.5,w-2,h-2);c.strokeStyle=W98.hi;c.strokeRect(x+1.5,y+1.5,w-2,h-2);
 if(label){c.font=`12px ${SM}`;const tw=c.measureText(label).width;px(c,x+7,y-6,tw+6,13,W98.face);c.fillStyle=W98.text;c.textAlign='left';c.textBaseline='middle';c.fillText(label,x+10,y+1);}
}
function sunken(c,x,y,w,h,fill=W98.field){px(c,x,y,w,h,fill);bevel(c,x,y,w,h,false);}

// ---------- compass: Win98 Date/Time "Time" clock face around a blueprint minimap ----------
// Same 256x296 design space as paintCompass()/paintSafariCompass().
export function paintWin98Compass(c,map,yaw,bearing){
 const W=256,H=296,X=128,Y=140,RM=76,RR=97;
 c.save();c.imageSmoothingEnabled=false;
 px(c,0,0,W,H,W98.face);bevel(c,0,0,W,H,true,true);
 titleBar(c,3,3,W-6,'罗盘 Compass',ICON.globe);
 etched(c,8,32,W-16,212,'方位(B)');
 // blueprint map window
 c.save();c.beginPath();c.arc(X,Y,RM,0,Math.PI*2);c.fillStyle=BP.void;c.fill();c.clip();c.translate(X,Y);c.rotate(yaw);if(map)c.drawImage(map,-144,-144,288,288);c.restore();
 // sunken round bevel (two rings, light from top-left)
 const ring=(r,a,b)=>{c.lineWidth=1;c.strokeStyle=a;c.beginPath();c.arc(X,Y,r,Math.PI*.75,Math.PI*1.75);c.stroke();c.strokeStyle=b;c.beginPath();c.arc(X,Y,r,Math.PI*1.75,Math.PI*2.75);c.stroke();};
 ring(RM+.5,W98.dark,W98.light);ring(RM+1.5,W98.shadow,W98.hi);
 // dotted ring, bevelled cyan hour squares, cardinal letters (rotate with the map)
 for(let i=0;i<60;i++){const a=yaw+i*Math.PI/30,x=Math.round(X+Math.sin(a)*RR),y=Math.round(Y-Math.cos(a)*RR);
  if(i%5===0){const s=i%15===0?7:5,h=s>>1;px(c,x-h,y-h,s,s,i===0?'#c8281e':W98.cyan);px(c,x-h,y-h,s,1,i===0?'#ff9a8c':'#7ffcfc');px(c,x-h,y-h,1,s,i===0?'#ff9a8c':'#7ffcfc');px(c,x-h,y+h,s,1,i===0?'#5e0d06':'#004848');px(c,x+h,y-h,1,s,i===0?'#5e0d06':'#004848');}
  else{px(c,x-1,y-1,2,2,'#5e4f1e');px(c,x,y,1,1,W98.hi);}}
 c.font=`12px ${SM}`;c.textAlign='center';c.textBaseline='middle';
 for(let i=0;i<4;i++){const a=yaw+i*Math.PI/2,x=X+Math.sin(a)*(RR-10.5),y=Y-Math.cos(a)*(RR-10.5);c.fillStyle=W98.hi;c.fillText('NESW'[i],x+1,y+1);c.fillStyle=i?W98.text:'#a01a10';c.fillText('NESW'[i],x,y);}
 // north "minute hand" in the annulus, bevelled like the Win98 clock hands
 c.save();c.translate(X,Y);c.rotate(yaw);c.beginPath();c.moveTo(0,-RR+16);c.lineTo(5,-RM+3);c.lineTo(-5,-RM+3);c.closePath();c.fillStyle=W98.cyan;c.fill();c.strokeStyle='#004848';c.lineWidth=1;c.stroke();c.beginPath();c.moveTo(0,-RR+17);c.lineTo(-4,-RM+4);c.strokeStyle='#7ffcfc';c.stroke();c.restore();
 // fixed heading index at 12 o'clock
 c.fillStyle=W98.dark;c.beginPath();c.moveTo(X,Y-RR+6);c.lineTo(X+5,Y-RR-2);c.lineTo(X-5,Y-RR-2);c.closePath();c.fill();
 // player = Win98 "up arrow" cursor (IDC_UPARROW), white with black outline
 c.save();c.translate(X,Y);c.beginPath();c.moveTo(0,-11);c.lineTo(7,-3);c.lineTo(3,-3);c.lineTo(3,9);c.lineTo(-3,9);c.lineTo(-3,-3);c.lineTo(-7,-3);c.closePath();c.fillStyle='#ffffff';c.fill();c.strokeStyle='#000';c.lineWidth=1.4;c.stroke();c.restore();
 // spinner field with the bearing (like the "18:10:18" time box) + Map button
 sunken(c,8,250,150,24);c.fillStyle=W98.text;c.font=`16px ${MD}`;c.textAlign='left';c.textBaseline='middle';c.fillText(bearing||'N 000°',14,263);
 const sx=140;button(c,sx,252,16,10);button(c,sx,262,16,10);c.fillStyle=W98.text;for(let k=0;k<3;k++){c.fillRect(sx+8-k,255+k,1+k*2,1);c.fillRect(sx+8-k,268-k,1+k*2,1);}
 button(c,166,250,82,24,'地图(F)',MD);c.strokeStyle=W98.text;c.setLineDash([1,1]);c.strokeRect(170.5,254.5,73,15);c.setLineDash([]);
 // status bar
 sunken(c,4,279,180,14,W98.face);sunken(c,186,279,66,14,W98.face);c.fillStyle=W98.text;c.font=`12px ${SM}`;c.textAlign='left';c.fillText('LEVEL0.DWG · 1:500',8,287);c.fillText('MODEL',200,287);
 c.restore();
}

// ---------- AutoCAD-on-Win98 blueprint recolour of the Level 0 map ----------
export const BP={void:'#0a2456',floor:'#12408a',red:'#2e2c7a',black:'#0d2a60',hole:'#030e2a',line:'#e8f7ff',edge:'#7fd8ff',hatch:'#58b8f0',grid:'#3d7fd0'};
const hex=s=>parseInt(s.slice(1),16);
// level0-world.js map colours -> classes. 1 floor 2 red 3 blackout 4 wall 5 hole 0 void
const SRC=[[0x252216,0],[0xb1a374,1],[0x774432,2],[0x342f23,3],[0x564d32,4],[0x16150e,5]];
const OUT=[BP.void,BP.floor,BP.red,BP.black,BP.line,BP.hole].map(hex),EDGE=hex(BP.edge),HATCH=hex(BP.hatch),LINE=hex(BP.line);
const classMemo=new Map();
function classify(r,g,b){const key=(r<<16)|(g<<8)|b;let k=classMemo.get(key);if(k!==undefined)return k;let best=1e9;k=0;for(const [s,id] of SRC){const dr=r-(s>>16),dg=g-(s>>8&255),db=b-(s&255),e=dr*dr*2+dg*dg*4+db*db*3;if(e<best){best=e;k=id;}}if(classMemo.size<65536)classMemo.set(key,k);return k;}
let scratch=null;
export function blueprintize(ctx,w,h,ox,oz,scale,{grid=true}={}){
 const d=ctx.getImageData(0,0,w,h),a=d.data,n=w*h;if(!scratch||scratch.length<n)scratch=new Uint8Array(n);const cls=scratch;
 for(let p=0,i=0;p<n;p++,i+=4)cls[p]=classify(a[i],a[i+1],a[i+2]);
 const put=(i,v)=>{a[i]=v>>16;a[i+1]=v>>8&255;a[i+2]=v&255;a[i+3]=255;};
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const p=y*w+x,k=cls[p],i=p*4;
  const l=x?cls[p-1]:k,r=x<w-1?cls[p+1]:k,u=y?cls[p-w]:k,dn=y<h-1?cls[p+w]:k;
  if(k===4){ // walls: crisp white outline, ANSI31 poché hatch inside thick walls
   if(l!==4||r!==4||u!==4||dn!==4)put(i,LINE);else put(i,((x+y)&3)===0?HATCH:OUT[1]);continue;}
  if(k===5){put(i,(l!==5||r!==5||u!==5||dn!==5)?EDGE:(((x+y)%6===0||(x-y+6000)%6===0)?0x2f8fd8:OUT[5]));continue;} // pits: cross hatch
  if(k!==0&&(l===0||r===0||u===0||dn===0)){put(i,EDGE);continue;} // floor plate outline against void
  if(k===3&&(x%4===0&&y%4===0)){put(i,0x5d8fd8);continue;} // blackout: dot screen
  put(i,OUT[k]);
 }
 ctx.putImageData(d,0,0);
 if(grid){ // AutoCAD GRID: minor + major lines in world metres
  const step=[1,2,5,10,20,50].find(s=>s*scale>=14)||50,major=step*5;
  const x0=Math.floor((ox-w/2/scale)/step)*step,z0=Math.floor((oz-h/2/scale)/step)*step;
  ctx.save();ctx.lineWidth=1;
  for(const [m,al] of [[step,.16],[major,.38]]){ctx.globalAlpha=al;ctx.strokeStyle=BP.grid;ctx.beginPath();
   for(let x=Math.floor(x0/m)*m;x<=ox+w/2/scale;x+=m){const sx=Math.round(w/2+(x-ox)*scale)+.5;ctx.moveTo(sx,0);ctx.lineTo(sx,h);}
   for(let z=Math.floor(z0/m)*m;z<=oz+h/2/scale;z+=m){const sz=Math.round(h/2+(z-oz)*scale)+.5;ctx.moveTo(0,sz);ctx.lineTo(w,sz);}ctx.stroke();}
  ctx.restore();
 }
}
// UCS icon (R14 WCS "W" L-arrows) bottom-left of the full drawing.
export function cadUCS(ctx,w,h){const x=18,y=h-18;ctx.save();ctx.strokeStyle='#ffffff';ctx.fillStyle='#ffffff';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+.5,y-46);ctx.lineTo(x+.5,y+.5);ctx.lineTo(x+46,y+.5);ctx.stroke();
 ctx.beginPath();ctx.moveTo(x+.5,y-50);ctx.lineTo(x-3.5,y-40);ctx.lineTo(x+4.5,y-40);ctx.closePath();ctx.stroke();ctx.beginPath();ctx.moveTo(x+50,y+.5);ctx.lineTo(x+40,y-3.5);ctx.lineTo(x+40,y+4.5);ctx.closePath();ctx.stroke();
 ctx.strokeRect(x+.5,y-11.5,12,12);ctx.font=`12px ${SM}`;ctx.textBaseline='middle';ctx.textAlign='center';ctx.fillText('W',x+7,y-5);ctx.fillText('X',x+46,y-10);ctx.fillText('Y',x+12,y-46);ctx.restore();}
// AutoCAD crosshair + pickbox at the hover point.
export function cadCursor(ctx,p,w,h){ctx.save();ctx.strokeStyle='#ffffff';ctx.lineWidth=1;const x=Math.round(p.x)+.5,z=Math.round(p.z)+.5,L=Math.max(w,h)*.05;ctx.beginPath();ctx.moveTo(x-L,z);ctx.lineTo(x-4,z);ctx.moveTo(x+4,z);ctx.lineTo(x+L,z);ctx.moveTo(x,z-L);ctx.lineTo(x,z-4);ctx.moveTo(x,z+4);ctx.lineTo(x,z+L);ctx.stroke();ctx.strokeRect(x-3,z-3,6,6);ctx.restore();}
// Player as an AutoCAD block in layer colour 2 (yellow): circle + direction arrow.
export function cadPlayer(ctx,x,z,yaw){ctx.save();ctx.translate(x,z);ctx.strokeStyle='#ffff00';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,8,0,Math.PI*2);ctx.stroke();ctx.rotate(-yaw);ctx.beginPath();ctx.moveTo(0,-15);ctx.lineTo(5,-4);ctx.lineTo(-5,-4);ctx.closePath();ctx.fillStyle='#ffff00';ctx.fill();ctx.beginPath();ctx.moveTo(0,-4);ctx.lineTo(0,6);ctx.stroke();ctx.restore();}

// ---------- AutoCAD R14 window chrome for the full map ----------
const TB=(name,d,tip)=>`<button type="button" class="cad-tool" data-cad="${name}" title="${tip}" aria-label="${tip}"><svg viewBox="0 0 16 16" aria-hidden="true">${d}</svg></button>`;
const P_=(d,f='none',s='#000')=>`<path d="${d}" fill="${f}" stroke="${s}" stroke-width="1" shape-rendering="crispEdges"/>`;
const STD=[
 ['new',P_('M3.5 1.5h6l3 3v10h-9z','#fff')+P_('M9.5 1.5v3h3'),'New'],['open',P_('M1.5 4.5h4l1 1h6v8h-11z','#e8c840')+P_('M3.5 7.5h11l-2 6h-11z','#ffe680'),'Open'],['save',P_('M2.5 2.5h11v11h-11z','#5a6a9a')+P_('M4.5 2.5h7v4h-7z','#fff')+P_('M4.5 9.5h7v4h-7z','#c0c0c0'),'Save'],
 ['sep'],['print',P_('M4.5 1.5h7v4h-7z','#fff')+P_('M1.5 5.5h13v6h-13z','#c0c0c0')+P_('M4.5 9.5h7v5h-7z','#fff'),'Print'],['preview',P_('M3.5 1.5h7v13h-7z','#fff')+'<circle cx="10" cy="9" r="3" fill="#cfe8ff" stroke="#000"/>'+P_('M12 11l3 3'),'Print Preview'],
 ['sep'],['cut',P_('M5 1.5l6 9M11 1.5l-6 9')+'<circle cx="4.5" cy="12.5" r="2" fill="none" stroke="#000"/><circle cx="11.5" cy="12.5" r="2" fill="none" stroke="#000"/>','Cut'],['copy',P_('M2.5 1.5h6v9h-6z','#fff')+P_('M6.5 5.5h7v9h-7z','#fff'),'Copy'],['paste',P_('M2.5 2.5h9v12h-9z','#a07030')+P_('M6.5 6.5h7v8h-7z','#fff'),'Paste'],['match',P_('M2 13l7-7 2 2-7 7z','#e0b040')+P_('M9 4l3-3 3 3-3 3z','#e8e8e8'),'Match Properties'],
 ['sep'],['undo',P_('M4 6.5h6a3.5 3.5 0 0 1 0 7H6')+P_('M6.5 3.5l-3 3 3 3','#000'),'Undo'],['redo',P_('M12 6.5H6a3.5 3.5 0 0 0 0 7h4')+P_('M9.5 3.5l3 3-3 3','#000'),'Redo'],
 ['sep'],['pan',P_('M8 1.5v13M1.5 8h13')+P_('M8 1l-2 3h4zM8 15l-2-3h4zM1 8l3-2v4zM15 8l-3-2v4z','#000'),'Pan Realtime'],['in',`<circle cx="6.5" cy="6.5" r="4.5" fill="#fff" stroke="#000"/>`+P_('M10 10l4.5 4.5M4.5 6.5h4M6.5 4.5v4'),'Zoom In'],['out',`<circle cx="6.5" cy="6.5" r="4.5" fill="#fff" stroke="#000"/>`+P_('M10 10l4.5 4.5M4.5 6.5h4'),'Zoom Out'],['center',`<circle cx="6.5" cy="6.5" r="4.5" fill="#fff" stroke="#000"/>`+P_('M10 10l4.5 4.5')+P_('M5.5 5.5h2v2h-2z','#f00','#f00'),'Zoom Extents (centre on you)'],
 ['sep'],['help',P_('M5.5 5a2.5 2.5 0 1 1 3 2.4V10M8.5 12v2'),'Help']];
const DRAW=[['line',P_('M2 14L14 2'),'Line'],['xline',P_('M1 12L15 4')+P_('M7 7.5h2v2H7z','#fff'),'Construction Line'],['pline',P_('M2 13l4-9 4 6 4-8'),'Polyline'],['polygon',P_('M8 2l6 4-2 7H4L2 6z'),'Polygon'],['rect',P_('M2.5 4.5h11v8h-11z'),'Rectangle'],['arc','<path d="M2 12A7 7 0 0 1 14 12" fill="none" stroke="#000"/>','Arc'],['circle','<circle cx="8" cy="8" r="5.5" fill="none" stroke="#000"/>','Circle'],['spline','<path d="M1 11C4 1 8 15 15 4" fill="none" stroke="#000"/>','Spline'],['ellipse','<ellipse cx="8" cy="8" rx="6.5" ry="4" fill="none" stroke="#000"/>','Ellipse'],['block',P_('M2.5 5.5l5-3 6 3v6l-6 3-5-3z','#e8d890'),'Make Block'],['point','<circle cx="8" cy="8" r="1.5" fill="#000"/>','Point'],['hatch',P_('M2.5 2.5h11v11h-11z')+P_('M2.5 8.5l6-6M2.5 13.5l11-11M7.5 13.5l6-6'),'Hatch'],['text',P_('M3 3.5h10M8 3.5v10M6 13.5h4'),'Multiline Text']];
export function mountCadChrome(modal,{onClose}={}){
 const panel=modal.querySelector('.map-panel'),surface=modal.querySelector('.map-surface'),canvas=modal.querySelector('.map-canvas'),readout=modal.querySelector('.map-readout');
 const tools=STD.map(t=>t[0]==='sep'?'<i class="cad-sep"></i>':TB(...t)).join('');
 panel.insertAdjacentHTML('afterbegin',`<div class="cad-title w98"><img src="./assets/ui-v102/backos-icon-16.png" alt="" width="16" height="16"><span>AutoCAD - [C:\\BACKROOMS\\LEVEL0.DWG]</span><b class="cad-ctl"><button type="button" class="cad-c" aria-hidden="true" tabindex="-1">_</button><button type="button" class="cad-c" aria-hidden="true" tabindex="-1">□</button><button type="button" class="cad-c cad-x" aria-label="关闭地图 (F)">×</button></b></div>
 <div class="cad-menu w98"><span><u>F</u>ile</span><span><u>E</u>dit</span><span><u>V</u>iew</span><span><u>I</u>nsert</span><span>F<u>o</u>rmat</span><span><u>T</u>ools</span><span><u>D</u>raw</span><span>Dime<u>n</u>sion</span><span><u>M</u>odify</span><span><u>H</u>elp</span><em>F 返回游戏</em></div>
 <div class="cad-bars w98"><div class="cad-tb"><i class="cad-grip"></i>${tools}</div><div class="cad-tb cad-props"><i class="cad-grip"></i>${TB('layers',P_('M1.5 9.5l6.5-3 6.5 3-6.5 3z','#fff')+P_('M1.5 6.5l6.5-3 6.5 3-6.5 3z','#ffe680'),'Layers')}<span class="cad-combo cad-layer"><i class="cad-bulb"></i><i class="cad-sun"></i><i class="cad-sw" style="background:#fff"></i>0</span>${TB('ltype',P_('M1 5h14M1 8h3m2 0h3m2 0h3M1 11h1m2 0h1m2 0h1m2 0h1'),'Linetype')}<span class="cad-combo">■ ByLayer</span><span class="cad-combo cad-wide">——— ByLayer</span></div></div>
 <div class="cad-draw w98" aria-hidden="true"><i class="cad-grip h"></i>${DRAW.map(t=>TB(...t)).join('')}</div>
 <div class="cad-cmd w98"><div class="cad-cmd-log" aria-hidden="true"><div>Regenerating drawing.</div><div>Command: _zoom</div></div><div class="cad-cmd-line">Command: <span class="cad-cmd-echo"></span><i class="cad-caret"></i></div></div>
 <div class="cad-status w98"><span class="cad-xy">0.0000, 0.0000, 0.0000</span><span class="cad-mode on">SNAP</span><span class="cad-mode on">GRID</span><span class="cad-mode">ORTHO</span><span class="cad-mode on">OSNAP</span><span class="cad-mode on">MODEL</span><span class="cad-mode on">TILE</span></div>`);
 const q=s=>modal.querySelector(s),press=a=>q(`[data-map-action="${a}"]`)?.click();
 q('.cad-x').addEventListener('click',()=>{if(onClose)onClose();else q('.map-close')?.click();});
 for(const a of ['in','out','center'])q(`[data-cad="${a}"]`).addEventListener('click',()=>{if(isL0())press(a);});
 const echo=q('.cad-cmd-echo'),xy=q('.cad-xy'),log=q('.cad-cmd-log');
 // Mirror map-ui's status text into the command line, and its "X … · Z …" into the coordinate pane.
 const sync=()=>{if(!isL0())return;const t=readout.textContent||'';echo.textContent=t;const m=t.match(/X\s*(-?\d+)\s*·\s*Z\s*(-?\d+)/);if(m)xy.textContent=`${Number(m[1]).toFixed(4)}, ${(-Number(m[2])).toFixed(4)}, 0.0000`;};
 new MutationObserver(sync).observe(readout,{childList:true,characterData:true,subtree:true});
 let lastZoom='';
 return function update(zoom){if(!isL0())return;const z=(zoom/6).toFixed(4);if(z===lastZoom)return;const first=!lastZoom;lastZoom=z;if(first)return;log.lastElementChild.textContent=`Command: _zoom  Scale factor: ${z}X`;};
}

// ---------- Vitals as Windows Task Manager (Performance tab) ----------
let tmTimer=0;
const VITALS=[['stamina','体力','#00ff00'],['hydration','水分','#00ffff'],['health','血量','#ff3030'],['sanity','精神','#ffff00']];
function paintLED(cv,v,col){const c=cv.getContext('2d'),w=cv.width,h=cv.height;c.fillStyle='#000';c.fillRect(0,0,w,h);const rows=Math.floor((h-18)/3),lit=Math.round(rows*v/100);
 for(let r=0;r<rows;r++){const y=h-18-(r+1)*3+1,on=r<lit;c.fillStyle=on?col:'#007a00';if(!on&&col!=='#00ff00')c.fillStyle='#145014';c.fillRect(7,y,w/2-9,2);c.fillRect(w/2+2,y,w/2-9,2);}
 c.fillStyle=col;c.font=`12px ${SM}`;c.textAlign='center';c.textBaseline='middle';c.fillText(v+'%',w/2,h-8);}
function paintHistory(cv,hist,offset){const c=cv.getContext('2d'),w=cv.width,h=cv.height;c.fillStyle='#000';c.fillRect(0,0,w,h);c.strokeStyle='#008040';c.lineWidth=1;c.beginPath();for(let x=w-1-((offset*2)%12);x>=0;x-=12){c.moveTo(x+.5,0);c.lineTo(x+.5,h);}for(let y=h-1;y>=0;y-=12){c.moveTo(0,y+.5);c.lineTo(w,y+.5);}c.stroke();
 VITALS.forEach((v,k)=>{c.strokeStyle=v[2];c.beginPath();hist.forEach((s,i)=>{const x=w-1-(hist.length-1-i)*2,y=1+(h-3)*(1-s[k]/100);i?c.lineTo(x,y):c.moveTo(x,y);});c.stroke();});}
// Win98 combo boxes: mirror the custom dropdown's label without its text arrow (CSS draws the button).
function combos(){for(const b of document.querySelectorAll('.retro-select-value')){if(b.textContent.includes('▾'))b.textContent=b.textContent.replace(/\s*▾\s*$/,'');}}
export function mountTaskManager(){
 if(tmTimer)return;let win=null,last='',hist=[],tick=0,t0=performance.now();
 function mount(){const stats=document.querySelector('.stats');if(!stats)return null;
  stats.insertAdjacentHTML('beforeend',`<div class="w98-tm w98" aria-hidden="true"><div class="w98-tbar"><img src="./assets/ui-v102/backos-icon-16.png" alt="" width="16" height="16"><span>Windows 任务管理器</span><b><i>_</i><i>□</i><i class="x">×</i></b></div><div class="w98-menu"><span><u>F</u>ile 文件</span><span><u>O</u>ptions</span><span><u>V</u>iew</span><span><u>H</u>elp</span></div>
  <div class="w98-tabs"><span>应用程序</span><span>进程</span><span class="on">性能</span></div>
  <div class="w98-pane"><div class="tm-leds">${VITALS.map(v=>`<div class="tm-box" data-k="${v[0]}"><span class="tm-lg">${v[1]}</span><div class="tm-led"><canvas width="48" height="58"></canvas></div></div>`).join('')}</div>
  <div class="tm-box tm-hist"><span class="tm-lg">生命体征使用记录 Usage History</span><div class="tm-led"><canvas width="236" height="52"></canvas></div></div>
  <div class="tm-totals"><div class="tm-box"><span class="tm-lg">补给 Totals</span><dl><dt>杏仁水 (瓶)</dt><dd class="tm-water">0</dd><dt>运行时间</dt><dd class="tm-up">0:00</dd></dl></div><div class="tm-box"><span class="tm-lg">状态</span><dl><dt>进程</dt><dd>4</dd><dt>警报</dt><dd class="tm-alert">无</dd></dl></div></div></div>
  <div class="w98-sbar"><span>进程: 4</span><span class="tm-s1">血量: 100%</span><span class="tm-s2">精神: 100%</span></div></div>`);
  return stats.querySelector('.w98-tm');}
 const val=id=>Math.round(Number(document.getElementById(id)?.getAttribute('aria-valuenow'))||0);
 tmTimer=setInterval(()=>{
  if(!isL0())return;combos();win||=mount();if(!win)return;
  const v=VITALS.map(r=>val(r[0]+'-meter')),bottles=parseInt(document.getElementById('bottle-count')?.textContent||'0',10)||0;
  if(++tick%4===0){hist.push(v);if(hist.length>119)hist.shift();paintHistory(win.querySelector('.tm-hist canvas'),hist,tick/4);
   const s=Math.floor((performance.now()-t0)/1000);win.querySelector('.tm-up').textContent=`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;}
  const key=v.join(',')+'|'+bottles;if(key===last)return;last=key;
  VITALS.forEach((r,i)=>{paintLED(win.querySelector(`[data-k="${r[0]}"] canvas`),v[i],r[2]);});
  win.querySelector('.tm-water').textContent=bottles;win.querySelector('.tm-s1').textContent=`血量: ${v[2]}%`;win.querySelector('.tm-s2').textContent=`精神: ${v[3]}%`;
  const low=VITALS.filter((r,i)=>v[i]<25).map(r=>r[1]);win.querySelector('.tm-alert').textContent=low.length?low.join('/')+' 过低':'无';win.classList.toggle('low',low.length>0);
 },250);
}
