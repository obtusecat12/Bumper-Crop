// V116 (master redo of V114) · Level 1 宜居地带 — 2007–2009 skeuomorphic garage HUD, scoped to :root[data-ui-level="1"].
// Navigation: a US parking-garage acrylic directory sign (north-up minimap, YOU ARE HERE) beside an
// iPhone OS 3 brushed-aluminium compass housing a car-dashboard liquid ball compass. The ball is driven
// by a fixed-step spring–damper (frame-rate independent): it lags the view, overshoots a little and sloshes.
// Vitals: a Vista/Win7 "CPU Meter"-style twin speedometer gadget (stamina + walking speed), an iPhone OS 1
// glossy battery (health: liquid ebbs away leaving a wet film, red rim flash on damage), a green radar +
// embossed 5-bar signal widget (sanity / threat), a glass test tube (hydration) and an iOS 1 almond-water icon.
// The widgets slide in Dashboard-style on an under-damped spring with glassy "boop" + click cues (Web Audio).
// Bitmaps (assets/ui-v114, sources art-l1ui/) are only the brushed/chrome rings, the icon and the standoffs;
// everything that moves or carries text is painted here so the text stays crisp.
import {blockTextPx as blockText,L1_BLOCK_PAL} from './l1-block.js?v=116';
const U=n=>new URL('./assets/'+n,import.meta.url).href;
const isL1=()=>document.documentElement.dataset.uiLevel==='1';
const IMG={};let imgGen=0,imgStarted=false;
const SRC={'compass-ring':'ui-v114/compass-ring.webp','gauge-ring':'ui-v114/gauge-ring.webp','almond-icon':'ui-v114/almond-icon.webp',standoff:'ui-v114/standoff.webp',
 leather:'ui-v116/leather.jpg',brushed:'ui-v116/brushed.jpg',dust:'ui-v116/dust.jpg',screw:'ui-v116/screw.webp'};
function loadImages(){if(imgStarted)return;imgStarted=true;try{for(const f of ['16px Vonwaon16','12px Vonwaon12'])document.fonts.load(f,'理A').then(()=>{imgGen++;});document.fonts.addEventListener('loadingdone',()=>{imgGen++;});}catch{}
 for(const [k,n] of Object.entries(SRC)){const im=new Image();im.decoding='async';im.onload=()=>{imgGen++;};im.src=U(n);IMG[k]=im;}}
const ok=im=>im&&im.complete&&im.naturalWidth>0;
const TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),wrap=a=>((a+Math.PI)%TAU+TAU)%TAU-Math.PI;
const PX16="Vonwaon16,Vonwaon12,'Microsoft YaHei',monospace",PX12="Vonwaon12,Vonwaon16,'Microsoft YaHei',monospace";
let FK=1;const f12=()=>`${(12*FK).toFixed(2)}px ${PX12}`,f16=()=>`${(16*FK).toFixed(2)}px ${PX16}`;
const LOW_PAL={face:['#ffd2c4','#ff9a82','#f0604a','#d23a26','#a8221a','#7a140e'],line:'#7a2a20'};
const SANS="'Segoe UI','Lucida Grande','Helvetica Neue',Helvetica,Arial,'Microsoft YaHei','PingFang SC','DejaVu Sans',Vonwaon16,sans-serif";
const SIGN="'Helvetica Neue',Helvetica,Arial,'Microsoft YaHei','PingFang SC','DejaVu Sans',Vonwaon16,sans-serif";
function rrp(c,x,y,w,h,r){c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}
function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}
// Vonwaon bitmap text with a stepped extrusion in the block-title's shadow ink + a cream→grey face ramp
function text3d(c,s,x,y,font,{align='center',line='#8b958f',top='#fbf7ea',bot='#a5aca8',depth=3,ink='#000000b0'}={}){c.save();c.font=font;c.textAlign=align;c.textBaseline='middle';const m=c.getTransform(),u=1/(Math.hypot(m.a,m.b)||1);
 c.fillStyle=ink;c.fillText(s,x+(depth+1)*u*.6,y+(depth+1)*u);c.fillStyle=line;for(let i=depth;i>=1;i--)c.fillText(s,x+i*u*.6,y+i*u);
 const fs=parseFloat(font)||12;c.fillStyle=lg(c,0,y-fs*.5,0,y+fs*.5,[[0,top],[1,bot]]);c.fillText(s,x,y);c.restore();}
function lg(c,x0,y0,x1,y1,stops){const g=c.createLinearGradient(x0,y0,x1,y1);for(const [o,col] of stops)g.addColorStop(o,col);return g;}
function rg(c,x0,y0,r0,x1,y1,r1,stops){const g=c.createRadialGradient(x0,y0,r0,x1,y1,r1);for(const [o,col] of stops)g.addColorStop(o,col);return g;}
function text(c,s,x,y,font,fill,shadow='#000000c0',align='center',sy=1){c.font=font;c.textAlign=align;c.textBaseline='middle';if(shadow){c.fillStyle=shadow;c.fillText(s,x,y+sy);}c.fillStyle=fill;c.fillText(s,x,y);}

// ---------- map palette: the printed directory (light) ----------
export const L1_MAP_PAL=Object.freeze({bg:'#e9ebe6',floor:'#d9ddd8',sec:['','#efe1a1','#e6c4bb','#cbe0c2','#ecd0a6'],wall:'#30353b',low:'#a3a9ad',door:'#13994a',thr:'#e2741c',cluBg:'#e4dccb',cluRoom:'#f1eadb',cluWall:'#5a4938'});
export const L1_LEGEND=[['#d9ddd8','天鹰段 停车层'],['#efe1a1','跃金段'],['#e6c4bb','哥特段'],['#cbe0c2','衔尾段'],['#ecd0a6','传说段'],['#e4dccb','小径'],['#13994a','出口门'],['#e2741c','阈界 → Level 2']];

// ---------- audio: one context, one bus, pre-rendered buffers ----------
let AC=null,bus=null,BUF={};
function volume(){try{const v=JSON.parse(localStorage.getItem('level10.preferences.v1')||'{}').volume;return clamp((v??65)/100,0,1);}catch{return .65;}}
function audio(){if(AC)return AC.state==='running'?AC:null;try{AC=new (globalThis.AudioContext||globalThis.webkitAudioContext)();}catch{return null;}
 bus=AC.createGain();bus.gain.value=.2;const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=9000;bus.connect(lp);lp.connect(AC.destination);const sr=AC.sampleRate;
 // glass water-drop "boop": a sine whose pitch leaps up then settles, with a faint inharmonic glass partial
 const boop=(f0,f1,len)=>{const b=AC.createBuffer(1,Math.round(sr*len),sr),d=b.getChannelData(0);let ph=0,ph2=0;for(let i=0;i<d.length;i++){const t=i/sr,f=f1+(f0-f1)*Math.exp(-t*55)+(t<.012?-(f1-f0)*.4*(1-t/.012):0);ph+=TAU*f/sr;ph2+=TAU*f*2.76/sr;const env=Math.min(1,t/.003)*Math.exp(-t*16);d[i]=(Math.sin(ph)*.8+Math.sin(ph2)*.12*Math.exp(-t*40))*env;}return b;};
 BUF.boop=boop(420,1180,.32);BUF.boopHi=boop(560,1480,.28);
 // precise mechanical click: a short bright tick + a lower body knock
 {const b=AC.createBuffer(1,Math.round(sr*.05),sr),d=b.getChannelData(0);let p=0;for(let i=0;i<d.length;i++){const t=i/sr;p+=(Math.random()*2-1-p)*.6;d[i]=(Math.sin(t*TAU*3400)*.55+p*.5)*Math.exp(-t*520)+Math.sin(t*TAU*820)*.45*Math.exp(-t*160);}BUF.click=b;}
 // low "battery hit" thunk
 {const b=AC.createBuffer(1,Math.round(sr*.18),sr),d=b.getChannelData(0);for(let i=0;i<d.length;i++){const t=i/sr;d[i]=Math.sin(TAU*(180*t-90*t*t*3))*Math.exp(-t*22)*.7;}BUF.thunk=b;}
 return AC.state==='running'?AC:null;}
function play(name,gain=1,rate=1,when=0){const ac=audio();const buf=BUF[name];if(!ac||!buf)return;const v=volume();if(v<=0)return;const s=ac.createBufferSource();s.buffer=buf;s.playbackRate.value=rate;const g=ac.createGain();g.gain.value=gain*v;s.connect(g);g.connect(bus);s.start(ac.currentTime+when);}
const wake=()=>{audio();if(AC&&AC.state==='suspended')AC.resume();};addEventListener('pointerdown',wake,{passive:true});addEventListener('keydown',wake,{passive:true});

// =====================================================================================================
// NAVIGATION CLUSTER (minimap acrylic sign + liquid ball compass), painted by map-ui into .map-mini-dom
// V116: a real 3/8" cast-acrylic directory plate: back-printed sheet seen through the clear border,
// polished green-glowing edges with visible thickness, stainless standoff barrels seen through the plate,
// shadow of the opaque print and of the clear plate on the wall, fluorescent-tube reflections that slide
// with the view (parallax against the print), and dust / fingerprints in the reflections.
// =====================================================================================================
export const NAV_W=400,NAV_H=214;
const SG={x:8,y:8,w:244,h:192,r:10,t:5};
const CC={x:326,y:94,R:72};
const WIN=CC.R*130/192;
let navCache=null;
const ball={h:null,v:0,tilt:0,tv:0,roll:0,rv:0,acc:0,t:0,vx:0,vz:0,ax:0,az:0};
function stepBall(target){const now=performance.now()/1000,st=globalThis.__bcHudState;let dt=ball.t?now-ball.t:0;ball.t=now;dt=Math.min(dt,.25);if(ball.h==null){ball.h=target;return;}
 const vx=st?.velocity?.x||0,vz=st?.velocity?.z||0;if(dt>0){const ax=(vx-ball.vx)/dt,az=(vz-ball.vz)/dt;const k=1-Math.exp(-dt*10);ball.ax+=(clamp(ax,-30,30)-ball.ax)*k;ball.az+=(clamp(az,-30,30)-ball.az)*k;}ball.vx=vx;ball.vz=vz;
 const yaw=-target,fwd=-(ball.ax*Math.sin(yaw)+ball.az*Math.cos(yaw)),side=ball.ax*Math.cos(yaw)-ball.az*Math.sin(yaw);
 ball.acc+=dt;const H=1/240;let n=0;
 while(ball.acc>=H&&n<120){ball.acc-=H;n++;
  // heading: heavy fluid → slow (ω 2.4 rad/s), slightly under-damped (ζ .52): lags, overshoots ~13 %, settles
  const e=wrap(target-ball.h),w=2.4,z=.52,a=w*w*e-2*z*w*ball.v;ball.v+=a*H;ball.h=wrap(ball.h+ball.v*H);
  const wt=6.2,zt=.16;ball.tv+=(-wt*wt*ball.tilt-2*zt*wt*ball.tv+fwd*.02-a*.004)*H;ball.tilt=clamp(ball.tilt+ball.tv*H,-.32,.32);
  const wr=5.4,zr=.15;ball.rv+=(-wr*wr*ball.roll-2*zr*wr*ball.rv+side*.016-a*.012)*H;ball.roll=clamp(ball.roll+ball.rv*H,-.3,.3);}
 if(n>=120)ball.acc=0;}
const STAND=()=>{const {x,y,w,h}=SG;return[[x+11,y+11],[x+w-11,y+11],[x+11,y+h-11],[x+w-11,y+h-11]];};
// stainless standoff barrel running back to the wall (seen through the clear acrylic), offset toward the shadow
function barrel(c,sx,sy,r,len){const dx=len*.55,dy=len;c.save();
 c.fillStyle=lg(c,sx-r,0,sx+r,0,[[0,'#5d6266'],[.25,'#e9ecee'],[.45,'#9aa0a5'],[.7,'#4a4f53'],[1,'#7d8387']]);
 c.beginPath();c.moveTo(sx-r,sy);c.lineTo(sx-r+dx,sy+dy);c.arc(sx+dx,sy+dy,r,Math.PI,0,true);c.lineTo(sx+r,sy);c.closePath();c.fill();c.restore();}
function cap(c,sx,sy,r){c.save();c.shadowColor='#000000a0';c.shadowBlur=r*.7;c.shadowOffsetX=r*.25;c.shadowOffsetY=r*.45;
 c.fillStyle='#8a9095';c.beginPath();c.arc(sx,sy,r,0,TAU);c.fill();c.restore();
 if(ok(IMG.standoff))c.drawImage(IMG.standoff,sx-r*1.08,sy-r*1.08,r*2.16,r*2.16);
 else{c.fillStyle=rg(c,sx-r*.3,sy-r*.3,1,sx,sy,r,[[0,'#fff'],[1,'#777']]);c.beginPath();c.arc(sx,sy,r,0,TAU);c.fill();}
 c.strokeStyle='#00000040';c.lineWidth=.8;c.beginPath();c.arc(sx,sy,r+.6,0,TAU);c.stroke();
 c.fillStyle='#ffffffe0';c.beginPath();c.ellipse(sx-r*.45,sy-r*.5,r*.22,r*.1,-.7,0,TAU);c.fill();}
function navStatic(w,h,k){
 const back=document.createElement('canvas'),front=document.createElement('canvas');back.width=front.width=w;back.height=front.height=h;
 const b=back.getContext('2d'),f=front.getContext('2d');for(const c of [b,f])c.setTransform(k,0,0,k,0,0);
 FK=1/k;const {x,y,w:W,h:Hh,r,t}=SG,ins=17,px=x+ins,py=y+ins,pw=W-ins*2,ph=Hh-ins*2;
 // 1 · shadows: the clear plate throws a pale, wide shadow; the opaque back print a darker, sharper one
 b.save();b.shadowColor='#00000066';b.shadowBlur=16;b.shadowOffsetX=7;b.shadowOffsetY=11;rr(b,x,y,W,Hh,r);b.fillStyle='#0000001c';b.fill();b.restore();
 b.save();b.shadowColor='#000000a8';b.shadowBlur=9;b.shadowOffsetX=6;b.shadowOffsetY=9;b.fillStyle='#00000030';b.fillRect(px+2,py+2,pw-4,ph-4);b.restore();
 // 2 · standoff barrels behind the plate
 for(const [sx,sy] of STAND())barrel(b,sx,sy,5.2,9);
 // 3 · edge thickness: polished side faces, deep bottle-green where you look into the cut edge
 rr(b,x+t*.7,y+t,W,Hh,r);b.fillStyle=lg(b,x,y+Hh,x+W,y,[[0,'#1d5a49'],[.5,'#3d8a73'],[1,'#2b6f5c']]);b.fill();
 rr(b,x+t*.35,y+t*.5,W,Hh,r);b.fillStyle='#6fb8a2c0';b.fill();
 // 4 · clear acrylic body
 rr(b,x,y,W,Hh,r);b.fillStyle=lg(b,x,y,x+W,y+Hh,[[0,'#eaf6f2d8'],[.5,'#cfe6dfc8'],[1,'#b4d6cbd0']]);b.fill();
 b.save();rr(b,x,y,W,Hh,r);b.clip();b.globalAlpha=.55;for(const [sx,sy] of STAND())barrel(b,sx+1,sy+1,5,8);b.restore();
 // 5 · back-printed sheet
 b.save();b.shadowColor='#1f4a3f70';b.shadowBlur=2.5;b.shadowOffsetX=1;b.shadowOffsetY=1.5;b.fillStyle='#f6f6f1';b.fillRect(px,py,pw,ph);b.restore();
 const hb=32;b.fillStyle=lg(b,0,py,0,py+hb,[[0,'#237f49'],[1,'#165c34']]);b.fillRect(px,py,pw,hb);b.fillStyle='#e8c04a';b.fillRect(px,py+hb,pw,2.5);
 b.fillStyle='#ffffff';b.beginPath();b.arc(px+16,py+hb/2,11.5,0,TAU);b.fill();text(b,'P1',px+16,py+hb/2+1,f16(),'#165c34',null);
 blockText(b,'LEVEL 1',px+32,py+5,12,{shadow:'#0b2e1a'});
 text(b,'宜居地带',px+32,py+25.5,f12(),'#d8f0de',null,'left');
 text(b,'PARKING',px+pw-6,py+10,f12(),'#ffffff',null,'right');text(b,'DIRECTORY',px+pw-6,py+22,f12(),'#bfe3c9',null,'right');
 const fy=py+ph-17;b.fillStyle='#eeefea';b.fillRect(px,fy,pw,17);b.fillStyle='#cfd3cd';b.fillRect(px,fy,pw,1);
 b.fillStyle='#d7261e';b.beginPath();b.arc(px+10,fy+8.5,4.2,0,TAU);b.fill();b.strokeStyle='#fff';b.lineWidth=1.2;b.stroke();
 text(b,'YOU ARE HERE',px+19,fy+9,f12(),'#c3201a',null,'left');text(b,'F 全图',px+pw-6,fy+9,f12(),'#30353b',null,'right');
 // ---- front: the acrylic face ----
 f.save();rr(f,x,y,W,Hh,r);f.clip();
 f.strokeStyle='#2f7e6a55';f.lineWidth=1.6;f.strokeRect(px-.8,py-.8,pw+1.6,ph+1.6);f.strokeStyle='#ffffff50';f.lineWidth=.8;f.strokeRect(px+.6,py+.6,pw-1.2,ph-1.2);
 const eg=6;for(const [g,X,Y,WW,HH] of [[lg(f,0,y,0,y+eg,[[0,'#7fd6bb90'],[1,'#7fd6bb00']]),x,y,W,eg],[lg(f,0,y+Hh,0,y+Hh-eg,[[0,'#2f8f7290'],[1,'#2f8f7200']]),x,y+Hh-eg,W,eg],[lg(f,x,0,x+eg,0,[[0,'#7fd6bb80'],[1,'#7fd6bb00']]),x,y,eg,Hh],[lg(f,x+W,0,x+W-eg,0,[[0,'#2f8f7290'],[1,'#2f8f7200']]),x+W-eg,y,eg,Hh]]){f.fillStyle=g;f.fillRect(X,Y,WW,HH);}
 if(ok(IMG.dust)){f.globalCompositeOperation='screen';f.globalAlpha=.3;f.drawImage(IMG.dust,x-20,y-8,W+40,(W+40)*IMG.dust.naturalHeight/IMG.dust.naturalWidth);f.globalAlpha=1;f.globalCompositeOperation='source-over';}
 f.restore();
 rr(f,x+.6,y+.6,W-1.2,Hh-1.2,r);f.strokeStyle=lg(f,x,y,x+W,y+Hh,[[0,'#ffffff'],[.45,'#e6f7f0c0'],[.55,'#9fd1c180'],[1,'#1f6b56']]);f.lineWidth=1.3;f.stroke();
 rr(f,x+2.2,y+2.2,W-4.4,Hh-4.4,r-1.5);f.strokeStyle=lg(f,x,y,x+W,y+Hh,[[0,'#ffffff70'],[1,'#3a8f7650']]);f.lineWidth=.7;f.stroke();
 for(const [sx,sy] of STAND())cap(f,sx,sy,6.4);
 return{back,front,map:{x:px,y:py+hb+2.5,w:pw,h:ph-hb-2.5-17}};
}
// fluorescent-tube reflections on the face slide with the view yaw (parallax against the back print)
function reflections(c,yaw){const {x,y,w:W,h:Hh,r}=SG;c.save();rr(c,x,y,W,Hh,r);c.clip();
 const o=((yaw/TAU)%1+1)%1,span=W*2.6;
 for(const [ph,wd,a] of [[0,7,.30],[.07,3,.22],[.5,9,.22],[.56,3,.16]]){const cx0=x-W*.3+((o+ph)%1)*span-span*.35;
  c.save();c.translate(cx0,y);c.transform(1,0,-.55,1,0,0);c.fillStyle=lg(c,0,0,wd,0,[[0,'#ffffff00'],[.5,`rgba(255,255,255,${a})`],[1,'#ffffff00']]);c.fillRect(0,0,wd,Hh);c.restore();}
 c.fillStyle=lg(c,x,y,x+W*.7,y+Hh,[[0,'#ffffff3a'],[.3,'#ffffff10'],[.31,'#ffffff00'],[1,'#ffffff00']]);c.fillRect(x,y,W,Hh);c.restore();}
function drawBall(c,cx,cy){
 const Rb=WIN*.98,hd=ball.h||0;
 c.save();c.beginPath();c.arc(cx,cy,WIN,0,TAU);c.clip();
 // fluid behind the ball
 c.fillStyle=rg(c,cx,cy-WIN*.3,2,cx,cy,WIN,[[0,'#24302c'],[1,'#030605']]);c.fillRect(cx-WIN,cy-WIN,WIN*2,WIN*2);
 c.save();c.translate(cx,cy+2);c.rotate(ball.roll);
 // the sphere
 c.fillStyle=rg(c,-Rb*.35,-Rb*.45,Rb*.05,0,0,Rb,[[0,'#ffffff'],[.45,'#f0ece0'],[.8,'#c9c2ae'],[1,'#7d776a']]);c.beginPath();c.arc(0,0,Rb,0,TAU);c.fill();
 const ta=ball.tilt-.12,ca=Math.cos(ta),sa=Math.sin(ta);
 const P=(th,ph)=>{const X=Math.cos(ph)*Math.sin(th),Y=Math.sin(ph),Z=Math.cos(ph)*Math.cos(th);return[X*Rb,-(Y*ca-Z*sa)*Rb,Y*sa+Z*ca];};
 // printed band lines
 for(const [ph,col,lw] of [[.05,'#3a3a36',1],[-.07,'#3a3a36',.8]]){c.beginPath();let on=false;for(let a=-90;a<=90;a+=5){const p=P(a*Math.PI/180,ph);if(p[2]<0){on=false;continue;}if(!on){c.moveTo(p[0],p[1]);on=true;}else c.lineTo(p[0],p[1]);}c.strokeStyle=col;c.lineWidth=lw;c.stroke();}
 // ticks every 5°, long every 10°
 c.strokeStyle='#222';for(let d=0;d<360;d+=5){const th=wrap(d*Math.PI/180-hd);if(Math.abs(th)>1.5)continue;const a=P(th,-.07),b=P(th,d%10?-.15:-.21);if(a[2]<.05)continue;c.globalAlpha=clamp(a[2]*1.6,0,1);c.lineWidth=d%30?.8:1.4;c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);c.stroke();}
 // numbers every 30° and letters at the cardinals/intercardinals
 const L={0:'N',45:'NE',90:'E',135:'SE',180:'S',225:'SW',270:'W',315:'NW'};
 for(let d=0;d<360;d+=15){const th=wrap(d*Math.PI/180-hd);if(Math.abs(th)>1.45)continue;const big=L[d];if(!big&&d%30)continue;
  const p=P(th,big?.25:-.33);if(p[2]<.08)continue;c.save();c.globalAlpha=clamp(p[2]*1.8,0,1);c.translate(p[0],p[1]);c.scale(Math.max(.05,Math.cos(th)),1);
  if(big){const card=big.length===1;c.font=`bold ${card?19:11}px ${SIGN}`;c.textAlign='center';c.textBaseline='middle';c.fillStyle=big==='N'?'#c8231b':'#1d1d1b';c.fillText(big,0,0);}
  else{c.font=`bold 9px ${SIGN}`;c.textAlign='center';c.textBaseline='middle';c.fillStyle='#2a2a28';c.fillText(String(d/10|0),0,0);}c.restore();}
 c.globalAlpha=1;
 // spherical shading over the print
 c.fillStyle=rg(c,-Rb*.25,-Rb*.3,Rb*.2,0,0,Rb,[[0,'#ffffff00'],[.62,'#00000000'],[.88,'#0000004a'],[1,'#000000b0']]);c.beginPath();c.arc(0,0,Rb,0,TAU);c.fill();
 c.restore();
 // floating bubble in the fluid (drifts against the slosh)
 const bx=cx-ball.roll*WIN*1.4+ball.rv*1.2,by=cy-WIN*.78+Math.abs(ball.roll)*6;c.fillStyle=rg(c,bx-1.5,by-1.5,.5,bx,by,5,[[0,'#ffffffd0'],[.6,'#d8f0e840'],[1,'#ffffff00']]);c.beginPath();c.ellipse(bx,by,6,3.2,0,0,TAU);c.fill();c.strokeStyle='#ffffff60';c.lineWidth=.6;c.stroke();
 // fixed lubber line on the inner glass
 c.save();c.shadowColor='#0009';c.shadowBlur=2;c.shadowOffsetX=1;c.fillStyle='#ff5a1ec8';c.fillRect(cx-.7,cy-WIN*.62,1.4,WIN*1.25);c.beginPath();c.moveTo(cx,cy-WIN*.62+6);c.lineTo(cx-4,cy-WIN*.62-1);c.lineTo(cx+4,cy-WIN*.62-1);c.closePath();c.fill();c.restore();
 // fluid tint + glass dome reflections
 c.fillStyle='#1f6b5a14';c.fillRect(cx-WIN,cy-WIN,WIN*2,WIN*2);
 c.fillStyle=rg(c,cx,cy,WIN*.7,cx,cy,WIN,[[0,'#00000000'],[1,'#000000a0']]);c.fillRect(cx-WIN,cy-WIN,WIN*2,WIN*2);
 c.fillStyle=lg(c,0,cy-WIN,0,cy-WIN*.05,[[0,'#ffffffb8'],[.55,'#ffffff30'],[1,'#ffffff00']]);c.beginPath();c.ellipse(cx,cy-WIN*.46,WIN*.84,WIN*.5,0,0,TAU);c.fill();
 c.fillStyle=lg(c,0,cy+WIN*.55,0,cy+WIN,[[0,'#ffffff00'],[1,'#bff5e440']]);c.beginPath();c.ellipse(cx,cy+WIN*.82,WIN*.7,WIN*.22,0,0,TAU);c.fill();
 c.restore();
}
export function paintL1Nav(c,rect,map,yaw,bearing){loadImages();
 const w=Math.round(rect.width),h=Math.round(rect.height),k=Math.min(w/NAV_W,h/NAV_H),ox=rect.left+(w-NAV_W*k)/2,oy=rect.top+(h-NAV_H*k)/2;
 const key=w+'x'+h+'/'+imgGen;if(!navCache||navCache.key!==key)navCache={...navStatic(Math.ceil(NAV_W*k),Math.ceil(NAV_H*k),k),key};
 const hdg=wrap(-yaw);stepBall(hdg);FK=1/k;
 c.save();c.setTransform(1,0,0,1,0,0);c.drawImage(navCache.back,ox,oy);c.translate(ox,oy);c.scale(k,k);
 // ---- back-printed minimap (north-up, centred on you) ----
 const M=navCache.map;c.save();c.beginPath();c.rect(M.x,M.y,M.w,M.h);c.clip();
 if(map&&map.width){const f=1.12,sw=M.w*f,sh=M.h*f;c.imageSmoothingEnabled=true;c.drawImage(map,(map.width-sw)/2,(map.height-sh)/2,sw,sh,M.x,M.y,M.w,M.h);
  c.fillStyle=rg(c,M.x+M.w/2,M.y+M.h/2,M.h*.4,M.x+M.w/2,M.y+M.h/2,M.w*.66,[[0,'#00000000'],[1,'#1e4a3f22']]);c.fillRect(M.x,M.y,M.w,M.h);}
 const mx=M.x+M.w/2,my=M.y+M.h/2;
 c.fillStyle='#d7261e33';c.beginPath();c.arc(mx,my,10,0,TAU);c.fill();
 c.save();c.translate(mx,my);c.rotate(-yaw);c.fillStyle='#d7261e';c.strokeStyle='#ffffff';c.lineWidth=1.4;c.beginPath();c.moveTo(0,-10);c.lineTo(5,1);c.lineTo(-5,1);c.closePath();c.fill();c.restore();
 c.fillStyle='#d7261e';c.beginPath();c.arc(mx,my,4.6,0,TAU);c.fill();c.strokeStyle='#fff';c.lineWidth=1.5;c.stroke();
 c.save();c.translate(M.x+M.w-13,M.y+15);c.fillStyle='#ffffffd0';c.beginPath();c.arc(0,0,9,0,TAU);c.fill();c.fillStyle='#30353b';c.beginPath();c.moveTo(0,-7);c.lineTo(4,4);c.lineTo(0,2);c.lineTo(-4,4);c.closePath();c.fill();c.restore();
 c.restore();
 reflections(c,yaw);
 c.setTransform(1,0,0,1,0,0);c.drawImage(navCache.front,ox,oy);c.translate(ox,oy);c.scale(k,k);
 // ---- liquid ball compass in its brushed-aluminium housing, carried on a stainless arm from the plate ----
 c.save();c.shadowColor='#00000080';c.shadowBlur=6;c.shadowOffsetX=3;c.shadowOffsetY=5;
 c.fillStyle=lg(c,0,CC.y-7,0,CC.y+7,[[0,'#f4f6f7'],[.35,'#a9afb4'],[.6,'#6b7176'],[1,'#c9ced2']]);rr(c,SG.x+SG.w-4,CC.y-7,CC.x-CC.R-(SG.x+SG.w)+12,14,3);c.fill();c.restore();
 c.save();c.shadowColor='#000000b0';c.shadowBlur=14;c.shadowOffsetX=4;c.shadowOffsetY=8;c.fillStyle='#111';c.beginPath();c.arc(CC.x,CC.y,CC.R-2,0,TAU);c.fill();c.restore();
 drawBall(c,CC.x,CC.y);
 if(ok(IMG['compass-ring']))c.drawImage(IMG['compass-ring'],CC.x-CC.R,CC.y-CC.R,CC.R*2,CC.R*2);
 else{c.strokeStyle='#ccc';c.lineWidth=CC.R-WIN;c.beginPath();c.arc(CC.x,CC.y,(CC.R+WIN)/2,0,TAU);c.stroke();}
 // heading plate under the compass: 3D block numerals
 const deg=Math.round(((hdg*180/Math.PI)%360+360)%360)%360,dir=['N','NE','E','SE','S','SW','W','NW'][Math.round(deg/45)%8];
 const py=CC.y+CC.R+5,pw=112,ph2=32,px=CC.x-pw/2;c.save();c.shadowColor='#00000090';c.shadowBlur=5;c.shadowOffsetY=3;rr(c,px,py,pw,ph2,6);c.fillStyle='#16191b';c.fill();c.restore();
 rr(c,px,py,pw,ph2,6);c.fillStyle=lg(c,0,py,0,py+ph2,[[0,'#2a2f33'],[1,'#0b0d0e']]);c.fill();rr(c,px+.5,py+.5,pw-1,ph2-1,5.5);c.strokeStyle=lg(c,0,py,0,py+ph2,[[0,'#ffffff55'],[1,'#ffffff10']]);c.lineWidth=1;c.stroke();
 text3d(c,String(deg).padStart(3,'0')+'°',CC.x-6,py+ph2/2,`${(16*FK*1.0).toFixed(2)}px ${PX16}`,{align:'right'});text3d(c,dir,CC.x+8,py+ph2/2,f16(),{align:'left',top:'#ffe58a',bot:'#d9a52c',line:'#6b5418'});
 c.fillStyle=lg(c,0,py,0,py+12,[[0,'#ffffff26'],[1,'#ffffff00']]);rr(c,px+2,py+1.5,pw-4,11,5);c.fill();
 c.restore();
 return Math.abs(ball.v)>.004||Math.abs(wrap(hdg-ball.h))>.003||Math.abs(ball.tv)>.004||Math.abs(ball.rv)>.004||Math.abs(ball.tilt)>.002||Math.abs(ball.roll)>.002;
}
// full-map "YOU ARE HERE" marker
export function l1MapPlayer(c,x,z,yaw,big){const s=big?1.5:1;c.save();c.translate(x,z);
 c.fillStyle='#d7261e30';c.beginPath();c.arc(0,0,16*s,0,TAU);c.fill();
 c.save();c.rotate(-yaw);c.fillStyle='#d7261e';c.strokeStyle='#fff';c.lineWidth=2;c.beginPath();c.moveTo(0,-17*s);c.lineTo(7*s,0);c.lineTo(-7*s,0);c.closePath();c.fill();c.stroke();c.restore();
 c.fillStyle='#d7261e';c.beginPath();c.arc(0,0,7*s,0,TAU);c.fill();c.strokeStyle='#fff';c.lineWidth=2.5;c.stroke();
 if(big){c.font=`bold 13px ${SIGN}`;c.textBaseline='middle';const t='YOU ARE HERE',tw=c.measureText(t).width;c.fillStyle='#d7261e';rr(c,14*s,-10,tw+14,20,10);c.fill();c.fillStyle='#fff';c.textAlign='left';c.fillText(t,14*s+7,.5);}
 c.restore();}

// =====================================================================================================
// DASHBOARD (vitals) — V116: ONE integrated instrument cluster, like a 2009 car binnacle.
// A stitched black leather hood wraps a brushed-aluminium fascia; every instrument is sunk into it:
// chrome-ringed speedometer (stamina) with its m/s sub-dial, a black-glass multi-information display
// holding the iPhone OS 1 battery (health), a green CRT radar + embossed 5-bar signal (sanity), the glass
// hydration tube clamped into a slot and the almond-water app icon in its own pocket. One smoked lens
// with one reflection covers the lot. Static layers are cached; only needles / liquids / sweep repaint.
// =====================================================================================================
const DW=760,DH=316;
const HO={cx:144,cy:180,R:138,top:66,x0:6,x1:754,y1:308,rc:40};   // housing geometry
const GA={x:144,y:180,R:114},SUB={x:304,y:150,R:44},MID={x:354,y:88,w:212,h:100,r:12},
 RAD={x:622,y:190,R:52},SIG={x:352,y:206,w:118,h:60},ICO={x:486,y:204,s:58},TUB={x:704,y:92,w:26,h:172},BADGE={x:574,y:84,w:114,h:34};
function housePath(c,ins){const R=HO.R-ins,cx=HO.cx,cy=HO.cy,top=HO.top+ins,x0=HO.x0+ins,x1=HO.x1-ins,y1=HO.y1-ins,rc=Math.max(4,HO.rc-ins);
 const dx=Math.sqrt(Math.max(0,R*R-(cy-top)**2)),ae=Math.atan2(top-cy,dx);
 c.beginPath();c.moveTo(x0,cy);c.arc(cx,cy,R,Math.PI,TAU+ae,false);c.lineTo(x1-rc,top);c.arcTo(x1,top,x1,top+rc,rc);c.lineTo(x1,y1-rc);c.arcTo(x1,y1,x1-rc,y1,rc);
 c.lineTo(x0+rc,y1);c.arcTo(x0,y1,x0,y1-rc,rc);c.closePath();}
// silk-screened white legend with a hairline of dark under it, as printed on a real cluster fascia
function engrave(c,s,x,y,font,align='center',ink='#eef1f3',hi='#000000b0'){text(c,s,x+.4,y+1,font,hi,null,align);text(c,s,x,y,font,ink,null,align);}
function screw(c,x,y,r,rot=0){c.save();c.shadowColor='#000000a0';c.shadowBlur=r*.6;c.shadowOffsetY=r*.3;c.fillStyle='#55595d';c.beginPath();c.arc(x,y,r,0,TAU);c.fill();c.restore();
 // countersink ring in the aluminium
 c.strokeStyle='#00000055';c.lineWidth=1;c.beginPath();c.arc(x,y,r+1.2,0,TAU);c.stroke();c.strokeStyle='#ffffff70';c.lineWidth=.8;c.beginPath();c.arc(x,y+.6,r+1.9,.1*Math.PI,.9*Math.PI);c.stroke();
 if(ok(IMG.screw)){c.save();c.translate(x,y);c.rotate(rot);c.drawImage(IMG.screw,-r,-r,r*2,r*2);c.restore();}}
// a deep cylindrical well cut into the fascia: dark walls, lit lip at the bottom, inner shadow from the top
function well(c,x,y,R){c.save();c.beginPath();c.arc(x,y,R,0,TAU);c.clip();
 c.fillStyle=lg(c,0,y-R,0,y+R,[[0,'#000'],[.55,'#0b0c0d'],[1,'#2a2d30']]);c.fillRect(x-R,y-R,R*2,R*2);
 c.shadowColor='#000';c.shadowBlur=R*.22;c.shadowOffsetY=R*.12;c.lineWidth=R*.4;c.strokeStyle='#000';c.beginPath();c.arc(x,y,R+R*.2,0,TAU);c.stroke();c.restore();
 // machined lip
 c.lineWidth=1.4;c.strokeStyle=lg(c,0,y-R,0,y+R,[[0,'#00000090'],[.5,'#00000020'],[1,'#ffffffb0']]);c.beginPath();c.arc(x,y,R+.7,0,TAU);c.stroke();}
function rwell(c,x,y,w,h,r){c.save();rr(c,x,y,w,h,r);c.clip();c.fillStyle=lg(c,0,y,0,y+h,[[0,'#000'],[1,'#202326']]);c.fillRect(x,y,w,h);
 c.shadowColor='#000';c.shadowBlur=9;c.shadowOffsetY=5;c.lineWidth=14;c.strokeStyle='#000';rr(c,x-7,y-7,w+14,h+14,r+6);c.stroke();c.restore();
 rr(c,x-.6,y-.6,w+1.2,h+1.2,r+.6);c.lineWidth=1.3;c.strokeStyle=lg(c,0,y,0,y+h,[[0,'#00000090'],[.6,'#00000010'],[1,'#ffffffb8']]);c.stroke();}
// polished chrome trim ring (for rectangular windows)
function chromeRect(c,x,y,w,h,r,t=4){c.save();rr(c,x-t,y-t,w+t*2,h+t*2,r+t);rrp(c,x,y,w,h,r);c.fillStyle=lg(c,0,y-t,0,y+h+t,[[0,'#ffffff'],[.18,'#c9ced3'],[.45,'#5e646a'],[.55,'#f2f4f6'],[.8,'#8b9196'],[1,'#dfe3e6']]);c.fill('evenodd');c.restore();
 rr(c,x-t+.5,y-t+.5,w+t*2-1,h+t*2-1,r+t-.5);c.strokeStyle='#00000060';c.lineWidth=1;c.stroke();}
function chromeRing(c,x,y,R,t){c.save();c.beginPath();c.arc(x,y,R+t,0,TAU);c.arc(x,y,R,0,TAU,true);
 c.fillStyle=c.createConicGradient?(()=>{const g=c.createConicGradient(-Math.PI/2,x,y);for(const [o,col] of [[0,'#f6f8f9'],[.12,'#8d9398'],[.25,'#e8ebee'],[.38,'#4f555a'],[.5,'#c4c9cd'],[.62,'#f7f9fa'],[.75,'#6a7075'],[.88,'#d9dde0'],[1,'#f6f8f9']])g.addColorStop(o,col);return g;})():'#ccc';c.fill();c.restore();
 c.strokeStyle='#00000070';c.lineWidth=.8;c.beginPath();c.arc(x,y,R+t,0,TAU);c.stroke();c.beginPath();c.arc(x,y,R,0,TAU);c.stroke();}
let dashMounted=null;
export function mountL1Dash(){if(dashMounted)return dashMounted;
 let host=null,cvs=null,ctx=null,size='',raf=0,lastT=0,acc=0,visible=false,wasL1=false,stat=null,front=null,statKey='';
 const S={shown:[100,100,100,100],t:0,k:1,dpr:1,needle:{a:1,v:0},sub:{a:0,v:0},sweep:0,
  bat:{lvl:1,ghost:1,flash:0,wave:0,wv:0,last:100},tube:{lvl:1,tilt:0,tv:0},radar:{a:0,blips:[]},bottles:0,
  spr:{y:0,v:0,on:true,settled:true,delay:0}};
 function ensure(){const stats=document.querySelector('.stats');if(!stats)return false;if(host&&host.isConnected)return true;
  stats.insertAdjacentHTML('beforeend',`<div class="l1-dash" aria-hidden="true"><canvas class="l1-cluster"></canvas></div>`);
  host=stats.querySelector('.l1-dash');cvs=host.querySelector('canvas');ctx=cvs.getContext('2d');size='';return true;}
 function resize(){const r=host.getBoundingClientRect();if(r.width<4)return false;const dpr=Math.min(2,devicePixelRatio||1),k=r.width/DW,key=r.width.toFixed(1)+'/'+dpr;if(key===size)return true;size=key;S.k=k;S.dpr=dpr;
  cvs.width=Math.round(DW*k*dpr);cvs.height=Math.round(DH*k*dpr);statKey='';return true;}
 function readVals(){const st=globalThis.__bcHudState,get=id=>Number(document.getElementById(id)?.getAttribute('aria-valuenow'));
  const v=st?[st.stamina,st.hydration,st.health,st.sanity??get('sanity-meter')]:[get('stamina-meter'),get('hydration-meter'),get('health-meter'),get('sanity-meter')];return v.map(x=>Number.isFinite(Number(x))?Number(x):100);}
 // ---- Dashboard entrance: the whole cluster rises on an under-damped spring, then the needles sweep ----
 function show(sound=true){visible=true;host?.classList.remove('l1-off');const s=S.spr;s.y=DH+40;s.v=0;s.on=true;s.settled=false;s.boop=sound;s.delay=.02;S.sweep=0;S.sweepOn=true;}
 function hide(){visible=false;S.spr.on=false;S.spr.settled=false;play('click',.6,1.1);}
 function stepSpring(dt){const s=S.spr,H=1/240;S.sacc=(S.sacc||0)+dt;let n=0;
  while(S.sacc>=H&&n<120){S.sacc-=H;n++;if(s.delay>0){s.delay-=H;if(s.delay<=0&&s.on&&s.boop){play('boop',.55,1);play('boopHi',.32,1.06,.09);s.boop=false;}continue;}
   const target=s.on?0:DH+60,w=s.on?13:20,z=s.on?.34:.95,a=-w*w*(s.y-target)-2*z*w*s.v;s.v+=a*H;s.y+=s.v*H;
   if(s.on&&!s.settled&&Math.abs(s.y)<.6&&Math.abs(s.v)<6){s.settled=true;play('click',.45);}}
  if(n>=120)S.sacc=0;
  // Dashboard "squash": the cluster stretches a touch while it flies and squashes on the bounce
  const sq=clamp(-s.v*.00035,-.05,.05);cvs.style.transform=`translate3d(0,${(s.y*S.k).toFixed(2)}px,0) scale(${(1-sq*.5).toFixed(4)},${(1+sq).toFixed(4)})`;
  cvs.style.visibility=(!s.on&&s.y>DH+50)?'hidden':'visible';return Math.abs(s.y-(s.on?0:DH+60))>.05||Math.abs(s.v)>.05;}
 function onKey(e){if(!isL1()||e.code!=='Tab'||e.repeat)return;if(document.querySelector('.modal:not([hidden]),dialog[open]'))return;const ae=document.activeElement;if(ae&&/INPUT|SELECT|TEXTAREA/.test(ae.tagName))return;e.preventDefault();if(visible)hide();else show();}
 addEventListener('keydown',onKey);
 function frame(now){raf=requestAnimationFrame(frame);const l1=isL1();if(l1&&!wasL1)S.pending=true;wasL1=l1;if(!l1||document.hidden)return;if(!ensure())return;
  const dt=Math.min(.5,(now-(lastT||now))/1000);lastT=now;if(!host.getClientRects().length)return;if(!resize())return;
  if(S.pending){S.pending=false;show(true);}
  stepSpring(dt);acc+=Math.min(dt,.1);if(acc<1/30)return;const step=Math.min(.1,acc);acc=0;simulate(step);draw();}
 // ---------------------------------------------------------------- simulation
 function simulate(dt){S.t+=dt;const v=readVals(),st=globalThis.__bcHudState;
  for(let i=0;i<4;i++){const t=clamp(v[i],0,100);S.shown[i]+=(t-S.shown[i])*(1-Math.exp(-dt*(i===2?2.2:6)));}
  const speed=Math.hypot(st?.velocity?.x||0,st?.velocity?.z||0);
  // ignition sweep: needles run to full scale and back once the cluster has landed
  let sw=null;if(S.sweepOn&&S.spr.settled){S.sweep+=dt;const p=S.sweep/1.3;if(p>=1)S.sweepOn=false;else sw=Math.sin(Math.min(1,p)*Math.PI);}
  for(const [n,tgt,w,z] of [[S.needle,sw!=null?Math.max(S.shown[0]/100,sw):S.shown[0]/100,16,.33],[S.sub,sw!=null?Math.max(clamp(speed/8,0,1),sw):clamp(speed/8,0,1),11,.45]]){const H=1/120;let t=dt;while(t>0){const h=Math.min(H,t);t-=h;const a=w*w*(tgt-n.a)-2*z*w*n.v;n.v+=a*h;n.a+=n.v*h;}}
  const b=S.bat,hp=v[2];if(b.last-hp>.4){b.flash=1;b.wv+=.9;if(S.t-(b.lastHit||0)>.35){play('thunk',.5,1);b.lastHit=S.t;}}b.last=hp;
  b.lvl+=(S.shown[2]/100-b.lvl)*(1-Math.exp(-dt*2.4));if(b.ghost<b.lvl)b.ghost=b.lvl;else b.ghost+=(b.lvl-b.ghost)*(1-Math.exp(-dt*.7));
  b.flash=Math.max(0,b.flash-dt*.8);b.wv+=(-90*b.wave-3*b.wv)*dt;b.wave+=b.wv*dt;b.wv+=(Math.random()-.5)*speed*.04;
  const tb=S.tube;tb.lvl+=(S.shown[1]/100-tb.lvl)*(1-Math.exp(-dt*4));const want=clamp((st?.velocity?.x||0)*.012+Math.sin(S.t*7)*speed*.004,-.12,.12);tb.tv+=((want-tb.tilt)*60-tb.tv*4.5)*dt;tb.tilt+=tb.tv*dt;
  const r=S.radar,threat=1-S.shown[3]/100,prev=r.a;r.a=(r.a+dt*TAU/(2.6-threat*1.2))%TAU;
  const want2=Math.round(1+threat*9);if(r.blips.length<want2&&Math.random()<dt*2)r.blips.push({a:Math.random()*TAU,d:.25+Math.random()*(.75-threat*.35),life:0});if(r.blips.length>want2)r.blips.shift();
  for(const p of r.blips){const crossed=(prev<=p.a&&r.a>=p.a)||(prev>r.a&&(p.a>=prev||p.a<=r.a));if(crossed){p.life=1;p.a+=(Math.random()-.5)*.25*threat;p.d=clamp(p.d+(Math.random()-.55)*.08,.12,.95);}p.life=Math.max(0,p.life-dt*.45);}
  S.bottles=Number(document.getElementById('bottle-count')?.textContent)||0;}
 // ---------------------------------------------------------------- static layers
 function layer(){const c=document.createElement('canvas');c.width=cvs.width;c.height=cvs.height;const g=c.getContext('2d');const s=S.k*S.dpr;g.setTransform(s,0,0,s,0,0);return[c,g];}
 function buildStatic(){FK=1/S.k;const [bc,c]=layer(),[fc,f]=layer();
  // shadows on the scene: wide ambient + tight contact
  c.save();c.shadowColor='#000000a0';c.shadowBlur=22;c.shadowOffsetY=10;housePath(c,0);c.fillStyle='#000';c.fill();c.restore();
  c.save();c.shadowColor='#000000c0';c.shadowBlur=4;c.shadowOffsetY=2;housePath(c,0);c.fillStyle='#000';c.fill();c.restore();
  // leather hood
  c.save();housePath(c,0);c.clip();c.fillStyle=ok(IMG.leather)?c.createPattern(IMG.leather,'repeat'):'#1b1b1c';c.fillRect(0,0,DW,DH);
  c.fillStyle=lg(c,0,HO.cy-HO.R,0,HO.y1,[[0,'#ffffff1e'],[.25,'#ffffff08'],[.6,'#00000000'],[1,'#00000070']]);c.fillRect(0,0,DW,DH);
  // crown specular of the hood leather + rolled edge: highlight on the upper rim, darkness under the lower rim
  c.save();c.globalCompositeOperation='screen';c.strokeStyle=lg(c,HO.cx-HO.R,0,HO.x1,0,[[0,'#ffffff00'],[.12,'#ffffff30'],[.3,'#ffffff12'],[.6,'#ffffff0a'],[1,'#ffffff00']]);c.lineWidth=5;housePath(c,4);c.stroke();c.restore();
  c.lineWidth=7;housePath(c,1.5);c.strokeStyle=lg(c,0,HO.cy-HO.R,0,HO.y1,[[0,'#ffffff30'],[.45,'#ffffff0c'],[1,'#00000080']]);c.stroke();
  // scuffs on the leather rim
  c.strokeStyle='#ffffff14';c.lineWidth=.7;for(const [x,y,l,a] of [[40,90,14,.4],[230,52,10,-.3],[690,110,12,.2],[30,250,9,1.2],[600,286,16,0],[420,90,8,.1]]){c.beginPath();c.moveTo(x,y);c.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l);c.stroke();}
  c.restore();
  // stitching: a pressed groove + a row of slanted, shaded stitches
  c.save();housePath(c,7.5);c.lineWidth=1.6;c.strokeStyle='#00000090';c.stroke();housePath(c,8.6);c.lineWidth=.6;c.strokeStyle='#ffffff18';c.stroke();
  c.setLineDash([4.2,2.6]);c.lineCap='round';housePath(c,7.2);c.lineWidth=1.5;c.strokeStyle='#00000099';c.stroke();housePath(c,6.6);c.lineWidth=1.35;c.strokeStyle='#bdb5a3';c.stroke();
  c.setLineDash([1.6,5.2]);housePath(c,6.4);c.lineWidth=.6;c.strokeStyle='#efe9da';c.stroke();c.restore();
  // brushed-aluminium fascia set into the hood, with a chamfered edge
  const IN=15;c.save();c.shadowColor='#000000d0';c.shadowBlur=6;c.shadowOffsetY=-1;housePath(c,IN);c.fillStyle='#777';c.fill();c.restore();
  c.save();housePath(c,IN);c.clip();
  if(ok(IMG.brushed))c.drawImage(IMG.brushed,0,0,DW,DW*IMG.brushed.naturalHeight/IMG.brushed.naturalWidth);else{c.fillStyle='#9a9ea3';c.fillRect(0,0,DW,DH);}
  // the fascia is lit from above-left; the hood throws a soft shadow down onto its top
  // titanium tone + light from above-left; the hood throws a soft shadow down onto the top of the plate
  c.fillStyle='#2a303833';c.fillRect(0,0,DW,DH);
  c.fillStyle=lg(c,0,HO.top,0,HO.y1,[[0,'#000000a0'],[.1,'#00000040'],[.28,'#ffffff08'],[.7,'#00000020'],[1,'#00000070']]);c.fillRect(0,0,DW,DH);
  c.fillStyle=lg(c,0,0,DW,0,[[0,'#ffffff18'],[.5,'#00000000'],[1,'#00000030']]);c.fillRect(0,0,DW,DH);
  // anisotropic sheen of the brushing: a soft horizontal streak of light across the plate
  c.fillStyle=lg(c,0,150,0,250,[[0,'#ffffff00'],[.45,'#ffffff26'],[.55,'#ffffff2c'],[1,'#ffffff00']]);c.fillRect(0,150,DW,100);
  c.restore();
  housePath(c,IN+.6);c.lineWidth=1.2;c.strokeStyle=lg(c,0,HO.top,0,HO.y1,[[0,'#00000080'],[.6,'#ffffff30'],[1,'#ffffffa0']]);c.stroke();
  // wells
  well(c,GA.x,GA.y,GA.R);well(c,SUB.x,SUB.y,SUB.R+2);well(c,RAD.x,RAD.y,RAD.R+3);
  rwell(c,MID.x,MID.y,MID.w,MID.h,MID.r);rwell(c,SIG.x,SIG.y,SIG.w,SIG.h,9);rwell(c,ICO.x-6,ICO.y-6,ICO.s+12,ICO.s+12,16);rwell(c,TUB.x-7,TUB.y-8,TUB.w+14,TUB.h+16,10);
  // printed scale beside the tube
  for(let i=0;i<=10;i++){const yy=TUB.y+TUB.h-(TUB.h-12)*i/10;c.fillStyle='#ffffff70';c.fillRect(TUB.x+TUB.w+9,yy+.7,i%5?5:9,1);c.fillStyle='#202326';c.fillRect(TUB.x+TUB.w+9,yy,i%5?5:9,1);}
  engrave(c,'水分',TUB.x+TUB.w/2,TUB.y+TUB.h+17,f12());
  // engraved labels on the fascia
  engrave(c,'SANITY 理智',SIG.x+SIG.w/2,SIG.y+SIG.h+15,f12());engrave(c,'杏仁水',ICO.x+ICO.s/2,ICO.y+ICO.s+17,f12());
  engrave(c,'THREAT SCAN',RAD.x,RAD.y+RAD.R+16,f12());
  // name badge: chrome-framed black plate with the 3D block LEVEL 1
  chromeRect(c,BADGE.x,BADGE.y,BADGE.w,BADGE.h,5,2.5);rr(c,BADGE.x,BADGE.y,BADGE.w,BADGE.h,5);c.fillStyle=lg(c,0,BADGE.y,0,BADGE.y+BADGE.h,[[0,'#1d2124'],[1,'#07090a']]);c.fill();
  blockText(c,'LEVEL 1',BADGE.x+BADGE.w/2,BADGE.y+8,18,{align:'center',shadow:'#000'});
  // screws
  screw(c,338,96,6,.4);screw(c,338,284,6,1.1);screw(c,600,284,6,.9);screw(c,672,128,6,.2);
  // ---- front layer: chrome rings, glass, the one lens over everything ----
  chromeRing(f,GA.x,GA.y,GA.R-4,6);
  if(ok(IMG['gauge-ring'])){f.drawImage(IMG['gauge-ring'],SUB.x-SUB.R*1.13,SUB.y-SUB.R*1.13,SUB.R*2.26,SUB.R*2.26);f.drawImage(IMG['gauge-ring'],RAD.x-RAD.R*1.13,RAD.y-RAD.R*1.13,RAD.R*2.26,RAD.R*2.26);}
  else{chromeRing(f,SUB.x,SUB.y,SUB.R,5);chromeRing(f,RAD.x,RAD.y,RAD.R,5);}
  chromeRect(f,MID.x,MID.y,MID.w,MID.h,MID.r,3);chromeRect(f,SIG.x,SIG.y,SIG.w,SIG.h,9,2.5);
  // tube clamps
  for(const cy of [TUB.y+6,TUB.y+TUB.h-22]){f.save();f.shadowColor='#000000a0';f.shadowBlur=4;f.shadowOffsetY=2;rr(f,TUB.x-9,cy,TUB.w+18,12,3);f.fillStyle=lg(f,0,cy,0,cy+12,[[0,'#f6f8f9'],[.4,'#9ba1a6'],[.55,'#5b6166'],[1,'#d6dadd']]);f.fill();f.restore();
   screw(f,TUB.x-4,cy+6,3.2,cy*.1);screw(f,TUB.x+TUB.w+4,cy+6,3.2,cy*.07);}
  // smoked lens: one broad reflection across the whole cluster (ties every instrument together), plus dust
  f.save();housePath(f,IN);f.clip();
  f.fillStyle=lg(f,0,HO.top,DW*.35,DH,[[0,'#ffffff2a'],[.34,'#ffffff12'],[.345,'#ffffff00'],[1,'#ffffff00']]);f.fillRect(0,0,DW,DH);
  // the lens is curved: one long arc-shaped highlight runs over all the instruments
  f.fillStyle=lg(f,0,HO.top,0,HO.top+70,[[0,'#ffffff00'],[.5,'#ffffff1a'],[1,'#ffffff00']]);f.beginPath();f.moveTo(20,HO.top+70);f.quadraticCurveTo(DW*.45,HO.top-30,DW-20,HO.top+40);f.lineTo(DW-20,HO.top+60);f.quadraticCurveTo(DW*.45,HO.top-2,20,HO.top+92);f.closePath();f.fill();
  f.save();f.translate(470,0);f.transform(1,0,-.8,1,0,0);f.fillStyle=lg(f,0,0,40,0,[[0,'#ffffff00'],[.5,'#ffffff12'],[1,'#ffffff00']]);f.fillRect(0,HO.top,40,DH);f.restore();
  if(ok(IMG.dust)){f.globalCompositeOperation='screen';f.globalAlpha=.16;f.drawImage(IMG.dust,0,HO.top-20,DW,DW*IMG.dust.naturalHeight/IMG.dust.naturalWidth);f.globalAlpha=1;f.globalCompositeOperation='source-over';}
  f.restore();
  // the hood's lip overhangs the lens: a thin dark line and the highlight on its roll
  housePath(f,IN-1);f.lineWidth=2;f.strokeStyle='#00000070';f.stroke();
  stat=bc;front=fc;statKey=size+'/'+imgGen;}
 // ---------------------------------------------------------------- dynamic drawing
 function face(c,x,y,F,val,{max=100,step=20,minor=5,label='',label2='',red=null,big=true}){
  c.fillStyle=rg(c,x,y-F*.25,F*.05,x,y,F,[[0,'#2e3236'],[.6,'#121416'],[1,'#030404']]);c.beginPath();c.arc(x,y,F,0,TAU);c.fill();
  // turned (concentric) finish on the dial
  c.strokeStyle='#ffffff07';c.lineWidth=.6;for(let r=F*.2;r<F;r+=F*.035){c.beginPath();c.arc(x,y,r,0,TAU);c.stroke();}
  const a0=Math.PI*.75,a1=Math.PI*2.25,ang=t=>a0+(a1-a0)*t,v=clamp(val,0,1);
  c.lineCap='butt';c.lineWidth=F*.06;c.strokeStyle='#ffffff0d';c.beginPath();c.arc(x,y,F*.9,a0,a1);c.stroke();
  if(v>.002){const g=c.createConicGradient?c.createConicGradient(a0,x,y):null;if(g){g.addColorStop(0,'#ff3b2a');g.addColorStop(.16,'#ffb62a');g.addColorStop(.4,'#b8f04a');g.addColorStop(.75,'#3fe0ff');g.addColorStop(1,'#3fe0ff');}
   c.save();c.shadowColor=v<.2?'#ff4020':'#5ff0ff';c.shadowBlur=F*.14;c.strokeStyle=g||'#5ff0ff';c.beginPath();c.arc(x,y,F*.9,a0,ang(v));c.stroke();c.restore();}
  if(red!=null){c.strokeStyle='#d8261c';c.lineWidth=F*.045;c.beginPath();c.arc(x,y,F*.79,a0,ang(red));c.stroke();}
  for(let t=0;t<=max+1e-6;t+=minor){const a=ang(t/max),major=Math.abs(t%step)<1e-6,r0=F*(major?.7:.75),r1=F*.83;c.strokeStyle=major?'#f4f4f4':'#8f969c';c.lineWidth=major?F*.024:F*.012;c.beginPath();c.moveTo(x+Math.cos(a)*r0,y+Math.sin(a)*r0);c.lineTo(x+Math.cos(a)*r1,y+Math.sin(a)*r1);c.stroke();
   if(major){c.save();c.shadowColor='#bff6ff';c.shadowBlur=F*.05;text(c,String(t),x+Math.cos(a)*F*.56,y+Math.sin(a)*F*.56,`${big?16:12}px ${big?PX16:PX12}`,'#f6fbff',null);c.restore();}}
  if(label)text(c,label,x,y-F*.34,f12(),'#aeb8c2',null);if(label2)text(c,label2,x,y-F*.2,f12(),'#7d8790',null);
  return{ang};}
 function needle(c,x,y,F,ang,t,col='#ff4b1f'){const a=ang(clamp(t,-.02,1.02));c.save();c.translate(x,y);c.rotate(a);
  c.save();c.shadowColor='#000000d0';c.shadowBlur=F*.05;c.shadowOffsetX=F*.03;c.shadowOffsetY=F*.05;c.fillStyle='#000';c.beginPath();c.moveTo(-F*.18,-F*.03);c.lineTo(F*.84,-F*.006);c.lineTo(F*.84,F*.006);c.lineTo(-F*.18,F*.03);c.closePath();c.fill();c.restore();
  c.save();c.shadowColor=col;c.shadowBlur=F*.08;c.fillStyle=lg(c,0,-F*.03,0,F*.03,[[0,'#ffb08a'],[.5,col],[1,'#8a1a08']]);c.beginPath();c.moveTo(-F*.18,-F*.03);c.lineTo(F*.84,-F*.006);c.lineTo(F*.84,F*.006);c.lineTo(-F*.18,F*.03);c.closePath();c.fill();c.restore();c.restore();
  // chrome hub cap
  c.save();c.shadowColor='#000000b0';c.shadowBlur=F*.06;c.shadowOffsetY=F*.03;c.fillStyle=rg(c,x-F*.04,y-F*.05,F*.01,x,y,F*.13,[[0,'#ffffff'],[.35,'#c3c8cd'],[.7,'#4b5056'],[1,'#1a1c1f']]);c.beginPath();c.arc(x,y,F*.12,0,TAU);c.fill();c.restore();
  c.fillStyle='#ffffffc0';c.beginPath();c.ellipse(x-F*.035,y-F*.05,F*.04,F*.02,-.5,0,TAU);c.fill();}
 function dome(c,x,y,R){c.save();c.beginPath();c.arc(x,y,R,0,TAU);c.clip();c.fillStyle=lg(c,0,y-R,0,y+R*.1,[[0,'#ffffff55'],[.55,'#ffffff12'],[1,'#ffffff00']]);c.beginPath();c.ellipse(x-R*.08,y-R*.5,R*.9,R*.55,-.12,0,TAU);c.fill();
  c.fillStyle=rg(c,x,y,R*.75,x,y,R,[[0,'#00000000'],[1,'#00000090']]);c.fillRect(x-R,y-R,R*2,R*2);c.restore();}
 function draw(){if(statKey!==size+'/'+imgGen)buildStatic();FK=1/S.k;const c=ctx,s=S.k*S.dpr;c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,cvs.width,cvs.height);c.drawImage(stat,0,0);c.setTransform(s,0,0,s,0,0);
  // ---- speedometer (stamina) ----
  const F=GA.R-12,m=face(c,GA.x,GA.y,F,S.needle.a,{label:'STAMINA',label2:'体力 %',red:.2});
  const pct=Math.round(S.shown[0]),lw=106,lh=54,lx=GA.x-lw/2,ly=GA.y+F*.3;rr(c,lx,ly,lw,lh,5);c.fillStyle=lg(c,0,ly,0,ly+lh,[[0,'#050607'],[1,'#1c2124']]);c.fill();rr(c,lx+.5,ly+.5,lw-1,lh-1,4.5);c.strokeStyle='#ffffff26';c.lineWidth=1;c.stroke();
  blockText(c,String(pct),GA.x,ly+6,lh-12,{align:'center',shadow:'#000',glow:pct<20?'#ff5030':'#9fe8ff70',pal:pct<20?LOW_PAL:undefined});
  needle(c,GA.x,GA.y,F,m.ang,S.needle.a);dome(c,GA.x,GA.y,F+2);
  // ---- sub dial: walking speed ----
  const sF=SUB.R-2,sm=face(c,SUB.x,SUB.y,sF,S.sub.a,{max:8,step:2,minor:1,big:false});text(c,'m/s',SUB.x,SUB.y+sF*.62,f12(),'#aeb8c2',null);needle(c,SUB.x,SUB.y,sF,sm.ang,S.sub.a,'#ff7a1f');dome(c,SUB.x,SUB.y,sF+1);
  drawMID(c);drawSignal(c);drawRadar(c);drawTube(c);drawIcon(c);
  c.setTransform(1,0,0,1,0,0);c.drawImage(front,0,0);}
 function drawMID(c){const {x,y,w,h,r}=MID;c.save();rr(c,x,y,w,h,r);c.clip();
  // black glass display with a faint blue backlight bloom
  c.fillStyle=rg(c,x+w*.4,y+h*.55,4,x+w*.4,y+h*.55,w*.7,[[0,'#13202a'],[1,'#030506']]);c.fillRect(x,y,w,h);
  const b=S.bat,bx=x+10,by=y+28,bw=84,bh=46,br=10,fl=b.flash>0?Math.pow(Math.abs(Math.sin((1-b.flash)*Math.PI*4.5)),.7)*b.flash:0;
  text(c,'HEALTH 生命',x+14,y+11,f12(),'#9fb6c4',null,'left');
  // iPhone OS 1 battery: glossy silver shell
  rr(c,bx,by,bw,bh,br);c.fillStyle=lg(c,0,by,0,by+bh,[[0,'#ffffff'],[.45,'#d8dce0'],[.55,'#a9b0b7'],[1,'#e9ecef']]);c.fill();
  c.fillStyle=lg(c,0,by+bh*.3,0,by+bh*.7,[[0,'#f4f6f8'],[.5,'#a2a9b0'],[1,'#e2e5e8']]);rr(c,bx+bw-1,by+bh*.3,9,bh*.4,3);c.fill();
  const ix=bx+5,iy=by+5,iw=bw-10,ih=bh-10,ir=br-4;rr(c,ix,iy,iw,ih,ir);c.fillStyle=lg(c,0,iy,0,iy+ih,[[0,'#16181b'],[.5,'#2b2f33'],[1,'#3a3e43']]);c.fill();
  c.save();rr(c,ix,iy,iw,ih,ir);c.clip();
  const low=b.lvl<.22,top=low?'#ff8a7a':'#a6f56a',mid=low?'#e0261a':'#4fd12a',bot=low?'#8a0f08':'#1f8a14';
  if(b.ghost>b.lvl+.004){const gx=ix+iw*b.ghost;c.fillStyle=low?'#e0261a40':'#62d83a42';c.fillRect(ix,iy,gx-ix,ih);for(let i=0;i<5;i++){const dx=ix+iw*(b.lvl+(b.ghost-b.lvl)*(i+.5)/5);c.fillStyle=low?'#ff6a5050':'#8cf06055';c.fillRect(dx-1,iy+ih*.55,2,ih*.45*(.5+.5*Math.sin(i*2.3+S.t)));}}
  const fx=ix+iw*clamp(b.lvl,0,1),wv=b.wave*6;c.beginPath();c.moveTo(ix-2,iy-2);
  for(let i=0;i<=12;i++){const yy=iy-2+(ih+4)*i/12,bulge=Math.sin(i/12*Math.PI)*3,sl=Math.sin(i/12*Math.PI*2+S.t*3)*wv;c.lineTo(fx+bulge+sl,yy);}c.lineTo(ix-2,iy+ih+2);c.closePath();
  c.fillStyle=lg(c,0,iy,0,iy+ih,[[0,top],[.48,mid],[1,bot]]);c.fill();
  c.save();c.clip();c.fillStyle=lg(c,0,iy,0,iy+ih*.5,[[0,'#ffffffd0'],[1,'#ffffff20']]);rr(c,ix+3,iy+2,Math.max(0,fx-ix-4),ih*.46,ir-2);c.fill();
  c.fillStyle=lg(c,0,iy+ih*.6,0,iy+ih,[[0,'#ffffff00'],[1,low?'#ffb0a060':'#d6ff9a70']]);c.fillRect(ix,iy+ih*.6,fx-ix,ih*.4);c.restore();c.restore();
  c.fillStyle=lg(c,0,iy,0,iy+ih*.45,[[0,'#ffffff55'],[1,'#ffffff00']]);rr(c,ix+2,iy+1,iw-4,ih*.42,ir-1);c.fill();rr(c,ix,iy,iw,ih,ir);c.strokeStyle='#00000080';c.lineWidth=1.2;c.stroke();
  if(fl>.01){c.save();c.shadowColor='#ff1a0a';c.shadowBlur=14*fl;rr(c,bx-1,by-1,bw+2,bh+2,br+1);c.strokeStyle=`rgba(255,40,24,${.95*fl})`;c.lineWidth=3;c.stroke();rr(c,bx+bw-1,by+bh*.3,9,bh*.4,3);c.stroke();c.restore();}
  // health readout in 3D block numerals (reflection of the battery on the glass below it)
  const hp=Math.round(S.shown[2]);blockText(c,String(hp),x+w-8,y+30,48,{align:'right',shadow:'#000',glow:low?'#ff4020':'#bfffb070',pal:low?LOW_PAL:undefined});
  // screen glass: top gloss band
  c.fillStyle=lg(c,0,y,0,y+h*.5,[[0,'#ffffff24'],[1,'#ffffff00']]);c.beginPath();c.moveTo(x,y);c.lineTo(x+w,y);c.lineTo(x+w,y+h*.28);c.quadraticCurveTo(x+w*.5,y+h*.5,x,y+h*.42);c.closePath();c.fill();
  c.restore();}
 function drawSignal(c){const {x,y,w,h}=SIG,san=S.shown[3],lit=Math.ceil(san/20-.001),col=san>60?['#c8ff8a','#46d21e','#1c7a0a']:san>30?['#ffe08a','#f0a81e','#8a5a08']:['#ffa08a','#e8321e','#7a1208'];
  c.save();rr(c,x,y,w,h,9);c.clip();c.fillStyle=lg(c,0,y,0,y+h,[[0,'#0c0e0f'],[1,'#1d2124']]);c.fillRect(x,y,w,h);
  const bx=x+10,by=y+h-8;for(let i=0;i<5;i++){const bw=10,bh=10+i*9.5,X=bx+i*13,Y=by-bh;
   rr(c,X-1,Y-1,bw+2,bh+2,2.5);c.fillStyle='#000';c.fill();rr(c,X,Y+1,bw,bh,2);c.fillStyle='#ffffff14';c.fill();
   rr(c,X,Y,bw,bh,2);c.fillStyle=i<lit?lg(c,X,0,X+bw,0,[[0,col[0]],[.5,col[1]],[1,col[2]]]):lg(c,0,Y,0,Y+bh,[[0,'#2a2e31'],[1,'#17191b']]);c.fill();
   if(i<lit){c.fillStyle='#ffffff70';rr(c,X+1,Y+1,bw*.45,bh-2,1.5);c.fill();c.save();c.shadowColor=col[1];c.shadowBlur=6;c.fillStyle=col[1]+'40';c.fillRect(X,Y,bw,bh);c.restore();}}
  text(c,'3G',x+w-14,y+12,f12(),col[1],null);text3d(c,String(Math.round(san)),x+w-10,y+h-20,f16(),{align:'right',...(san<=30?{top:'#ffd2c4',bot:'#d23a26',line:'#7a2a20'}:{})});
  c.fillStyle=lg(c,0,y,0,y+h*.45,[[0,'#ffffff1c'],[1,'#ffffff00']]);c.fillRect(x,y,w,h*.45);c.restore();}
 function drawRadar(c){const {x:cx0,y:cy0,R}=RAD,r=S.radar;
  c.fillStyle=rg(c,cx0,cy0,2,cx0,cy0,R,[[0,'#125a22'],[.7,'#062a0e'],[1,'#010c03']]);c.beginPath();c.arc(cx0,cy0,R,0,TAU);c.fill();
  c.save();c.beginPath();c.arc(cx0,cy0,R,0,TAU);c.clip();
  c.strokeStyle='#3cff6a40';c.lineWidth=1;for(const f of [.33,.66,1]){c.beginPath();c.arc(cx0,cy0,R*f-1,0,TAU);c.stroke();}c.beginPath();c.moveTo(cx0-R,cy0);c.lineTo(cx0+R,cy0);c.moveTo(cx0,cy0-R);c.lineTo(cx0,cy0+R);c.stroke();
  if(c.createConicGradient){const sg=c.createConicGradient(r.a-1.6,cx0,cy0);sg.addColorStop(0,'#00ff5000');sg.addColorStop(.25,'#2cff6a70');sg.addColorStop(.2551,'#00ff5000');sg.addColorStop(1,'#00ff5000');c.fillStyle=sg;c.fillRect(cx0-R,cy0-R,R*2,R*2);}
  c.strokeStyle='#9dffb0';c.lineWidth=1.5;c.shadowColor='#3cff6a';c.shadowBlur=6;c.beginPath();c.moveTo(cx0,cy0);c.lineTo(cx0+Math.cos(r.a-1.6+TAU*.25)*R,cy0+Math.sin(r.a-1.6+TAU*.25)*R);c.stroke();
  for(const p of r.blips){if(p.life<=0)continue;const px=cx0+Math.cos(p.a-1.6+TAU*.25)*R*p.d,py=cy0+Math.sin(p.a-1.6+TAU*.25)*R*p.d,red=S.shown[3]<35;c.fillStyle=red?`rgba(255,120,80,${p.life})`:`rgba(170,255,180,${p.life})`;c.shadowColor=red?'#ff5030':'#3cff6a';c.shadowBlur=8;c.beginPath();c.arc(px,py,2.4,0,TAU);c.fill();}
  c.shadowBlur=0;c.restore();dome(c,cx0,cy0,R);}
 function drawTube(c){const t=S.tube,{x,y,w,h}=TUB,cxm=x+w/2;
  const shape=()=>{c.beginPath();c.moveTo(x,y);c.lineTo(x,y+h-w/2);c.arc(cxm,y+h-w/2,w/2,Math.PI,0,true);c.lineTo(x+w,y);c.closePath();};
  c.save();shape();c.clip();c.fillStyle=lg(c,x,0,x+w,0,[[0,'#16222bd0'],[.5,'#25333d90'],[1,'#121c24d0']]);c.fillRect(x,y,w,h);
  const top=y+12,bot=y+h,lvl=bot-(bot-top)*clamp(t.lvl,0,1),dy=t.tilt*w*1.4;
  c.beginPath();c.moveTo(x-1,lvl+dy);c.quadraticCurveTo(cxm,lvl-dy*.2+2,x+w+1,lvl-dy);c.lineTo(x+w+1,bot+2);c.lineTo(x-1,bot+2);c.closePath();
  c.fillStyle=lg(c,x,0,x+w,0,[[0,'#0f4fa8'],[.35,'#4db3ff'],[.6,'#2a8ff0'],[1,'#0a3c86']]);c.fill();
  c.fillStyle='#bfe8ff';c.globalAlpha=.8;c.beginPath();c.ellipse(cxm,lvl+1.5,w/2,2.6,-t.tilt*1.2,0,TAU);c.fill();c.globalAlpha=1;
  for(let i=0;i<4;i++){const by=bot-20-((S.t*14+i*37)%Math.max(8,bot-lvl-24));if(by>lvl+4){c.fillStyle='#d8f2ff70';c.beginPath();c.arc(x+6+i*5%(w-10),by,1.1+i%2*.6,0,TAU);c.fill();}}
  c.restore();
  shape();c.strokeStyle='#e9f5ffa0';c.lineWidth=1.3;c.stroke();
  c.fillStyle=lg(c,x,0,x+w,0,[[0,'#ffffff00'],[.18,'#ffffffb0'],[.32,'#ffffff20'],[.8,'#ffffff00'],[.9,'#ffffff50'],[1,'#ffffff00']]);c.fillRect(x+1,y+4,w-2,h-w/2);
  text3d(c,String(Math.round(S.shown[1])),cxm,y+h-52,f16(),{line:'#0b3a6a',depth:2});}
 function drawIcon(c){const {x,y,s}=ICO;
  if(ok(IMG['almond-icon']))c.drawImage(IMG['almond-icon'],x,y,s,s*IMG['almond-icon'].naturalHeight/IMG['almond-icon'].naturalWidth);else{rr(c,x,y,s,s,12);c.fillStyle='#6cb8e8';c.fill();}
  const n=S.bottles;if(n>0){const bx=x+s-2,by=y+3,t=String(n),bw=Math.max(22,10+t.length*9);c.save();c.shadowColor='#0009';c.shadowBlur=4;c.shadowOffsetY=2;rr(c,bx-bw/2,by-11,bw,22,11);c.fillStyle='#fff';c.fill();c.restore();
   rr(c,bx-bw/2+2,by-9,bw-4,18,9);c.fillStyle=lg(c,0,by-9,0,by+9,[[0,'#ff6a5a'],[.5,'#e3170a'],[1,'#b80c02']]);c.fill();c.fillStyle='#ffffff50';rr(c,bx-bw/2+3,by-8,bw-6,8,4);c.fill();text(c,t,bx,by+1,f16(),'#fff',null);}}
 raf=requestAnimationFrame(frame);
 dashMounted={show,hide,get visible(){return visible;},dispose(){cancelAnimationFrame(raf);removeEventListener('keydown',onKey);host?.remove();dashMounted=null;}};loadImages();return dashMounted;
}
