// V114 · Level 1 宜居地带 — 2007–2009 skeuomorphic garage HUD, scoped to :root[data-ui-level="1"].
// Navigation: a US parking-garage acrylic directory sign (north-up minimap, YOU ARE HERE) beside an
// iPhone OS 3 brushed-aluminium compass housing a car-dashboard liquid ball compass. The ball is driven
// by a fixed-step spring–damper (frame-rate independent): it lags the view, overshoots a little and sloshes.
// Vitals: a Vista/Win7 "CPU Meter"-style twin speedometer gadget (stamina + walking speed), an iPhone OS 1
// glossy battery (health: liquid ebbs away leaving a wet film, red rim flash on damage), a green radar +
// embossed 5-bar signal widget (sanity / threat), a glass test tube (hydration) and an iOS 1 almond-water icon.
// The widgets slide in Dashboard-style on an under-damped spring with glassy "boop" + click cues (Web Audio).
// Bitmaps (assets/ui-v114, sources art-l1ui/) are only the brushed/chrome rings, the icon and the standoffs;
// everything that moves or carries text is painted here so the text stays crisp.
const A='./assets/ui-v114/',U=n=>new URL(A+n,import.meta.url).href;
const isL1=()=>document.documentElement.dataset.uiLevel==='1';
const IMG={};let imgGen=0,imgStarted=false;
function loadImages(){if(imgStarted)return;imgStarted=true;for(const n of ['compass-ring.webp','gauge-ring.webp','almond-icon.webp','standoff.webp']){const im=new Image();im.decoding='async';im.onload=()=>{imgGen++;};im.src=U(n);IMG[n.split('.')[0]]=im;}}
const ok=im=>im&&im.complete&&im.naturalWidth>0;
const TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),wrap=a=>((a+Math.PI)%TAU+TAU)%TAU-Math.PI;
const SANS="'Segoe UI','Lucida Grande','Helvetica Neue',Helvetica,Arial,'Microsoft YaHei','PingFang SC','DejaVu Sans',Vonwaon16,sans-serif";
const SIGN="'Helvetica Neue',Helvetica,Arial,'Microsoft YaHei','PingFang SC','DejaVu Sans',Vonwaon16,sans-serif";
function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}
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
// =====================================================================================================
export const NAV_W=400,NAV_H=210;
const SG={x:8,y:14,w:244,h:184};          // acrylic plate
const CC={x:324,y:92,R:74};               // compass outer radius (sprite r 192)
const WIN=CC.R*130/192;                   // ball window radius
let navCache=null;
const ball={h:null,v:0,tilt:0,tv:0,roll:0,rv:0,acc:0,t:0,vx:0,vz:0,ax:0,az:0};
function stepBall(target){const now=performance.now()/1000,st=globalThis.__bcHudState;let dt=ball.t?now-ball.t:0;ball.t=now;dt=Math.min(dt,.25);if(ball.h==null){ball.h=target;return;}
 // player acceleration (for the slosh), low-passed
 const vx=st?.velocity?.x||0,vz=st?.velocity?.z||0;if(dt>0){const ax=(vx-ball.vx)/dt,az=(vz-ball.vz)/dt;const k=1-Math.exp(-dt*10);ball.ax+=(clamp(ax,-30,30)-ball.ax)*k;ball.az+=(clamp(az,-30,30)-ball.az)*k;}ball.vx=vx;ball.vz=vz;
 const yaw=-target,fwd=-(ball.ax*Math.sin(yaw)+ball.az*Math.cos(yaw)),side=ball.ax*Math.cos(yaw)-ball.az*Math.sin(yaw);
 ball.acc+=dt;const H=1/240;let n=0;
 while(ball.acc>=H&&n<120){ball.acc-=H;n++;
  // heading: heavy fluid → slow (ω 2.4 rad/s), slightly under-damped (ζ .52): lags, overshoots ~13 %, settles
  const e=wrap(target-ball.h),w=2.4,z=.52,a=w*w*e-2*z*w*ball.v;ball.v+=a*H;ball.h=wrap(ball.h+ball.v*H);
  // card pitch & roll: light, lively pendulums excited by turning acceleration and by walking/stopping
  const wt=6.2,zt=.16;ball.tv+=(-wt*wt*ball.tilt-2*zt*wt*ball.tv+fwd*.02-a*.004)*H;ball.tilt=clamp(ball.tilt+ball.tv*H,-.32,.32);
  const wr=5.4,zr=.15;ball.rv+=(-wr*wr*ball.roll-2*zr*wr*ball.rv+side*.016-a*.012)*H;ball.roll=clamp(ball.roll+ball.rv*H,-.3,.3);}
 if(n>=120)ball.acc=0;}
function navStatic(w,h,k){
 const back=document.createElement('canvas'),front=document.createElement('canvas');back.width=front.width=w;back.height=front.height=h;
 const b=back.getContext('2d'),f=front.getContext('2d');for(const c of [b,f]){c.setTransform(k,0,0,k,0,0);}
 const {x,y,w:W,h:Hh}=SG,ins=7,px=x+ins,py=y+ins,pw=W-ins*2,ph=Hh-ins*2;
 // shadow of the plate on the (imagined) wall + clear acrylic body
 b.save();b.shadowColor='#000000a0';b.shadowBlur=12;b.shadowOffsetX=3;b.shadowOffsetY=6;rr(b,x,y,W,Hh,6);b.fillStyle='#c9dcd8';b.fill();b.restore();
 rr(b,x,y,W,Hh,6);b.fillStyle=lg(b,x,y,x+W,y+Hh,[[0,'#eef8f6'],[.5,'#cfe2de'],[1,'#a9c9c3']]);b.fill();
 // printed sheet (sub-surface print: very slightly inset, with its own soft shadow)
 b.save();b.shadowColor='#2a3a3880';b.shadowBlur=3;b.shadowOffsetY=1;b.fillStyle='#f8f8f5';b.fillRect(px,py,pw,ph);b.restore();
 // header band: Level 1 green, "P1" roundel, bold Helvetica
 const hb=30;b.fillStyle=lg(b,0,py,0,py+hb,[[0,'#1f7a43'],[1,'#155e33']]);b.fillRect(px,py,pw,hb);b.fillStyle='#e9c54a';b.fillRect(px,py+hb,pw,2.5);
 b.fillStyle='#ffffff';b.beginPath();b.arc(px+16,py+hb/2,11,0,TAU);b.fill();text(b,'P1',px+16,py+hb/2+.5,`bold 12px ${SIGN}`,'#155e33',null);
 text(b,'LEVEL 1',px+33,py+11,`bold 14px ${SIGN}`,'#ffffff',null,'left');text(b,'宜居地带 · HABITABLE ZONE',px+33,py+23,`bold 8.5px ${SIGN}`,'#d6efdc',null,'left');
 text(b,'PARKING',px+pw-8,py+11,`bold 10px ${SIGN}`,'#ffffff',null,'right');text(b,'DIRECTORY',px+pw-8,py+22,`8px ${SIGN}`,'#d6efdc',null,'right');
 // footer
 const fy=py+ph-17;b.fillStyle='#f1f2ee';b.fillRect(px,fy,pw,17);b.fillStyle='#d4d7d2';b.fillRect(px,fy,pw,1);
 b.fillStyle='#d7261e';b.beginPath();b.arc(px+10,fy+8.5,4.2,0,TAU);b.fill();b.strokeStyle='#fff';b.lineWidth=1.2;b.stroke();
 text(b,'YOU ARE HERE',px+18,fy+9,`bold 9px ${SIGN}`,'#c3201a',null,'left');b.font=`bold 9px ${SIGN}`;const yw=b.measureText('YOU ARE HERE').width;text(b,'您在这里',px+24+yw,fy+9,`bold 8.5px ${SIGN}`,'#5d6266',null,'left');
 text(b,'F  全图',px+pw-6,fy+9,`bold 9px ${SIGN}`,'#30353b',null,'right');
 // ---- front: acrylic face (glare, edges, standoffs) ----
 f.save();rr(f,x,y,W,Hh,6);f.clip();
 f.fillStyle=lg(f,x,y,x+W*.8,y+Hh,[[0,'#ffffff40'],[.28,'#ffffff14'],[.29,'#ffffff00'],[.62,'#ffffff00'],[.63,'#ffffff12'],[.72,'#ffffff00']]);f.fillRect(x,y,W,Hh);f.restore();
 rr(f,x+.5,y+.5,W-1,Hh-1,6);f.strokeStyle=lg(f,x,y,x+W,y+Hh,[[0,'#ffffffe0'],[.5,'#e8f6f2a0'],[1,'#6f9d95c0']]);f.lineWidth=1.4;f.stroke();
 rr(f,x+2.5,y+2.5,W-5,Hh-5,4.5);f.strokeStyle='#7fb5ab55';f.lineWidth=1.2;f.stroke();
 for(const [sx,sy] of [[x+11,y+11],[x+W-11,y+11],[x+11,y+Hh-11],[x+W-11,y+Hh-11]]){f.save();f.shadowColor='#0008';f.shadowBlur=3;f.shadowOffsetX=1;f.shadowOffsetY=2;
  if(ok(IMG.standoff))f.drawImage(IMG.standoff,sx-7,sy-7,14,14);else{f.fillStyle=rg(f,sx-2,sy-2,1,sx,sy,7,[[0,'#fff'],[1,'#777']]);f.beginPath();f.arc(sx,sy,7,0,TAU);f.fill();}f.restore();}
 return{back,front,map:{x:px,y:py+hb+2.5,w:pw,h:ph-hb-2.5-17}};
}
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
 const hdg=wrap(-yaw);stepBall(hdg);
 c.save();c.setTransform(1,0,0,1,0,0);c.drawImage(navCache.back,ox,oy);c.translate(ox,oy);c.scale(k,k);
 // ---- printed minimap (north-up, centred on you) ----
 const M=navCache.map;c.save();c.beginPath();c.rect(M.x,M.y,M.w,M.h);c.clip();
 if(map&&map.width){const f=1.12,sw=M.w*f,sh=M.h*f;c.imageSmoothingEnabled=true;c.drawImage(map,(map.width-sw)/2,(map.height-sh)/2,sw,sh,M.x,M.y,M.w,M.h);}
 // printed grid letters on the edges (bay rows)
 const mx=M.x+M.w/2,my=M.y+M.h/2;
 c.fillStyle='#d7261e33';c.beginPath();c.arc(mx,my,10,0,TAU);c.fill();
 c.save();c.translate(mx,my);c.rotate(-yaw);c.fillStyle='#d7261e';c.strokeStyle='#ffffff';c.lineWidth=1.4;c.beginPath();c.moveTo(0,-10);c.lineTo(5,1);c.lineTo(-5,1);c.closePath();c.fill();c.restore();
 c.fillStyle='#d7261e';c.beginPath();c.arc(mx,my,4.6,0,TAU);c.fill();c.strokeStyle='#fff';c.lineWidth=1.5;c.stroke();
 // north arrow printed in the corner
 c.save();c.translate(M.x+M.w-13,M.y+15);c.fillStyle='#ffffffd0';c.beginPath();c.arc(0,0,9,0,TAU);c.fill();c.fillStyle='#30353b';c.beginPath();c.moveTo(0,-7);c.lineTo(4,4);c.lineTo(0,2);c.lineTo(-4,4);c.closePath();c.fill();text(c,'N',0,-12.5,`bold 7px ${SIGN}`,'#30353b',null);c.restore();
 c.restore();
 c.setTransform(1,0,0,1,0,0);c.drawImage(navCache.front,ox,oy);c.translate(ox,oy);c.scale(k,k);
 // ---- liquid ball compass in the iPhone OS 3 brushed-aluminium housing ----
 c.save();c.shadowColor='#000000b0';c.shadowBlur=12;c.shadowOffsetY=5;c.fillStyle='#111';c.beginPath();c.arc(CC.x,CC.y,CC.R-2,0,TAU);c.fill();c.restore();
 drawBall(c,CC.x,CC.y);
 if(ok(IMG['compass-ring']))c.drawImage(IMG['compass-ring'],CC.x-CC.R,CC.y-CC.R,CC.R*2,CC.R*2);
 else{c.strokeStyle='#ccc';c.lineWidth=CC.R-WIN;c.beginPath();c.arc(CC.x,CC.y,(CC.R+WIN)/2,0,TAU);c.stroke();}
 // iPhone OS 3 style readout: "125° SE"
 const deg=Math.round(((hdg*180/Math.PI)%360+360)%360)%360,dir=['N','NE','E','SE','S','SW','W','NW'][Math.round(deg/45)%8];
 text(c,`${deg}° ${dir}`,CC.x,CC.y+CC.R+14,`bold 17px ${SIGN}`,'#ffffff','#000000d0','center',1.5);
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
// DASHBOARD (vitals) — separate widget canvases inside .stats, each sliding in on its own spring
// =====================================================================================================
const DW=640,DH=300;
const WG=[
 {id:'gauge',x:0,y:26,w:262,h:274},
 {id:'battery',x:270,y:58,w:214,h:96},
 {id:'radar',x:270,y:162,w:214,h:132},
 {id:'tube',x:494,y:34,w:52,h:262},
 {id:'icon',x:552,y:148,w:88,h:120},
];
let dashMounted=null;
export function mountL1Dash(){if(dashMounted)return dashMounted;
 let host=null,size='',raf=0,lastT=0,acc=0,visible=false,wasL1=false;const cv={},cx={};
 const S={shown:[100,100,100,100],t:0,k:1,dpr:1,
  needle:{a:1,v:0},sub:{a:0,v:0},
  bat:{lvl:1,ghost:1,flash:0,wave:0,wv:0,last:100,hits:0},
  tube:{lvl:1,tilt:0,tv:0,wave:0},
  radar:{a:0,blips:[]},bottles:0,
  spr:WG.map(()=>({x:0,v:0,delay:0,on:true,boop:false}))};
 function ensure(){const stats=document.querySelector('.stats');if(!stats)return false;if(host&&host.isConnected)return true;
  stats.insertAdjacentHTML('beforeend',`<div class="l1-dash" aria-hidden="true">${WG.map(g=>`<canvas class="l1-w l1-${g.id}"></canvas>`).join('')}</div>`);
  host=stats.querySelector('.l1-dash');for(const g of WG){cv[g.id]=host.querySelector('.l1-'+g.id);cx[g.id]=cv[g.id].getContext('2d');}size='';return true;}
 function resize(){const r=host.getBoundingClientRect();if(r.width<4)return false;const dpr=Math.min(2,devicePixelRatio||1),k=r.width/DW,key=r.width.toFixed(1)+'/'+dpr;if(key===size)return true;size=key;S.k=k;S.dpr=dpr;
  for(const g of WG){const el=cv[g.id];el.style.left=(g.x/DW*100)+'%';el.style.top=(g.y/DH*100)+'%';el.style.width=(g.w/DW*100)+'%';el.style.height=(g.h/DH*100)+'%';el.width=Math.round(g.w*k*dpr);el.height=Math.round(g.h*k*dpr);}return true;}
 function readVals(){const st=globalThis.__bcHudState,get=id=>Number(document.getElementById(id)?.getAttribute('aria-valuenow'));
  const v=st?[st.stamina,st.hydration,st.health,st.sanity??get('sanity-meter')]:[get('stamina-meter'),get('hydration-meter'),get('health-meter'),get('sanity-meter')];return v.map(x=>Number.isFinite(Number(x))?Number(x):100);}
 // ---- Dashboard entrance: each widget flies in from the left on an under-damped spring ----
 function show(sound=true){visible=true;host?.classList.remove('l1-off');S.spr.forEach((s,i)=>{const g=WG[i];s.x=-(g.x+g.w+40+i*14);s.v=0;s.delay=i*.075;s.on=true;s.boop=sound;s.settled=false;});}
 function hide(){visible=false;S.spr.forEach((s,i)=>{s.on=false;s.delay=(WG.length-1-i)*.03;});play('click',.6,1.1);}
 function stepSprings(dt){let moving=false;const H=1/240;S.sacc=(S.sacc||0)+dt;let n=0;
  while(S.sacc>=H&&n<120){S.sacc-=H;n++;
   S.spr.forEach((s,i)=>{if(s.delay>0){s.delay-=H;if(s.delay<=0&&s.on&&s.boop){play(i%2?'boopHi':'boop',.55,1+i*.035);s.boop=false;}return;}
    const target=s.on?0:-(WG[i].x+WG[i].w+60),w=s.on?15:22,z=s.on?.36:.9,a=-w*w*(s.x-target)-2*z*w*s.v;s.v+=a*H;s.x+=s.v*H;
    if(s.on&&!s.settled&&Math.abs(s.x)<.6&&Math.abs(s.v)<6){s.settled=true;if(i===WG.length-1)play('click',.45);}});}
  if(n>=120)S.sacc=0;
  S.spr.forEach((s,i)=>{const el=cv[WG[i].id];if(Math.abs(s.x)>.05||Math.abs(s.v)>.05)moving=true;
   // a little Dashboard "stretch": widgets lean while they fly
   el.style.transform=`translate3d(${(s.x*S.k).toFixed(2)}px,0,0) skewX(${clamp(-s.v*.012,-7,7).toFixed(2)}deg)`;el.style.visibility=(!s.on&&Math.abs(s.x-(-(WG[i].x+WG[i].w+60)))<2)?'hidden':'visible';});
  return moving;}
 function onKey(e){if(!isL1()||e.code!=='Tab'||e.repeat)return;if(document.querySelector('.modal:not([hidden]),dialog[open]'))return;const ae=document.activeElement;if(ae&&/INPUT|SELECT|TEXTAREA/.test(ae.tagName))return;e.preventDefault();if(visible)hide();else show();}
 addEventListener('keydown',onKey);
 function frame(now){raf=requestAnimationFrame(frame);const l1=isL1();if(l1&&!wasL1){S.pending=true;}wasL1=l1;if(!l1||document.hidden)return;if(!ensure())return;
  const dt=Math.min(.5,(now-(lastT||now))/1000);lastT=now;
  if(!host.getClientRects().length){return;}
  if(!resize())return;
  if(S.pending){S.pending=false;show(true);}
  stepSprings(dt);acc+=Math.min(dt,.1);if(acc<1/30)return;const step=Math.min(.1,acc);acc=0;simulate(step);draw();}
 // ---------------------------------------------------------------- simulation
 function simulate(dt){S.t+=dt;const v=readVals(),st=globalThis.__bcHudState;
  for(let i=0;i<4;i++){const t=clamp(v[i],0,100);S.shown[i]+=(t-S.shown[i])*(1-Math.exp(-dt*(i===2?2.2:6)));}
  const speed=Math.hypot(st?.velocity?.x||0,st?.velocity?.z||0);
  // speedometer needles: stiff springs with a visible bounce
  for(const [n,tgt,w,z] of [[S.needle,S.shown[0]/100,16,.33],[S.sub,clamp(speed/8,0,1),11,.45]]){const H=1/120;let t=dt;while(t>0){const h=Math.min(H,t);t-=h;const a=w*w*(tgt-n.a)-2*z*w*n.v;n.v+=a*h;n.a+=n.v*h;}}
  // battery: liquid level eases down slowly ("ebb"), a wet film lags further behind; red rim flashes on hits
  const b=S.bat,hp=v[2];if(b.last-hp>.4){b.flash=1;b.wv+=.9;if(S.t-(b.lastHit||0)>.35){play('thunk',.5,1);b.lastHit=S.t;}}b.last=hp;
  b.lvl+=(S.shown[2]/100-b.lvl)*(1-Math.exp(-dt*2.4));if(b.ghost<b.lvl)b.ghost=b.lvl;else b.ghost+=(b.lvl-b.ghost)*(1-Math.exp(-dt*.7));
  b.flash=Math.max(0,b.flash-dt*.8);b.wv+=(-90*b.wave-3*b.wv)*dt;b.wave+=b.wv*dt;b.wv+=(Math.random()-.5)*speed*.04;
  // tube slosh: tilt follows lateral motion
  const tb=S.tube;tb.lvl+=(S.shown[1]/100-tb.lvl)*(1-Math.exp(-dt*4));const want=clamp((st?.velocity?.x||0)*.012+Math.sin(S.t*7)*speed*.004,-.12,.12);tb.tv+=((want-tb.tilt)*60-tb.tv*4.5)*dt;tb.tilt+=tb.tv*dt;
  // radar sweep + blips (more and closer as sanity falls)
  const r=S.radar,threat=1-S.shown[3]/100,prev=r.a;r.a=(r.a+dt*TAU/(2.6-threat*1.2))%TAU;
  const want2=Math.round(1+threat*9);if(r.blips.length<want2&&Math.random()<dt*2)r.blips.push({a:Math.random()*TAU,d:.25+Math.random()*(.75-threat*.35),life:0});if(r.blips.length>want2)r.blips.shift();
  for(const p of r.blips){const crossed=(prev<=p.a&&r.a>=p.a)||(prev>r.a&&(p.a>=prev||p.a<=r.a));if(crossed){p.life=1;p.a+=(Math.random()-.5)*.25*threat;p.d=clamp(p.d+(Math.random()-.55)*.08,.12,.95);}p.life=Math.max(0,p.life-dt*.45);}
  S.bottles=Number(document.getElementById('bottle-count')?.textContent)||0;}
 // ---------------------------------------------------------------- drawing
 function begin(id){const c=cx[id],g=WG.find(q=>q.id===id),s=S.k*S.dpr;c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,cv[id].width,cv[id].height);c.setTransform(s,0,0,s,0,0);return[c,g];}
 function draw(){drawGauge();drawBattery();drawRadar();drawTube();drawIcon();}
 function dial(c,x,y,R,val,{max=100,step=20,minor=5,label='',unit='',red=null,big=true}){
  // body
  c.save();c.shadowColor='#000000c0';c.shadowBlur=R*.16;c.shadowOffsetY=R*.06;c.fillStyle='#000';c.beginPath();c.arc(x,y,R*.98,0,TAU);c.fill();c.restore();
  const F=R*.8;c.fillStyle=rg(c,x,y-F*.2,F*.05,x,y,F,[[0,'#3a3d40'],[.55,'#16181a'],[1,'#030303']]);c.beginPath();c.arc(x,y,F*1.02,0,TAU);c.fill();
  const a0=Math.PI*.75,a1=Math.PI*2.25,ang=t=>a0+(a1-a0)*t;
  // glowing colour band (CPU-meter style), lit up to the value
  const v=clamp(val,0,1);c.lineCap='butt';c.lineWidth=F*.075;c.strokeStyle='#ffffff10';c.beginPath();c.arc(x,y,F*.86,a0,a1);c.stroke();
  if(v>.002){const g=c.createConicGradient?c.createConicGradient(a0,x,y):null;if(g){g.addColorStop(0,'#ff3b2a');g.addColorStop(.18,'#ffb62a');g.addColorStop(.42,'#b8f04a');g.addColorStop(.75,'#3fe0ff');g.addColorStop(1,'#3fe0ff');}
   c.save();c.shadowColor=v<.2?'#ff4020':'#5ff0ff';c.shadowBlur=F*.12;c.strokeStyle=g||'#5ff0ff';c.beginPath();c.arc(x,y,F*.86,a0,ang(v));c.stroke();c.restore();}
  if(red!=null){c.strokeStyle='#d8261c';c.lineWidth=F*.05;c.beginPath();c.arc(x,y,F*.74,a0,ang(red));c.stroke();}
  // ticks + numerals
  for(let t=0;t<=max+1e-6;t+=minor){const a=ang(t/max),major=Math.abs(t%step)<1e-6,r0=F*(major?.66:.71),r1=F*.78;c.strokeStyle=major?'#f2f2f2':'#9aa0a6';c.lineWidth=major?F*.022:F*.011;c.beginPath();c.moveTo(x+Math.cos(a)*r0,y+Math.sin(a)*r0);c.lineTo(x+Math.cos(a)*r1,y+Math.sin(a)*r1);c.stroke();
   if(major){text(c,String(t),x+Math.cos(a)*F*.52,y+Math.sin(a)*F*.52,`${big?'600 ':''}${Math.round(F*(big?.13:.17))}px ${SANS}`,'#f4f4f4','#000');}}
  if(label)text(c,label,x,y-F*.31,`600 ${Math.max(8,Math.round(F*(big?.095:.14)))}px ${SANS}`,'#b8c0c8','#000');
  return{F,ang};}
 function needle(c,x,y,F,ang,t,col='#ff4b1f'){const a=ang(clamp(t,-.02,1.02));c.save();c.translate(x,y);c.rotate(a);c.shadowColor='#000000c0';c.shadowBlur=F*.06;c.shadowOffsetY=F*.03;
  c.fillStyle=lg(c,0,-F*.04,0,F*.04,[[0,'#ff9a6a'],[.5,col],[1,'#8a1a08']]);c.beginPath();c.moveTo(-F*.16,-F*.035);c.lineTo(F*.8,-F*.008);c.lineTo(F*.8,F*.008);c.lineTo(-F*.16,F*.035);c.closePath();c.fill();c.restore();
  c.fillStyle=rg(c,x-F*.04,y-F*.05,F*.01,x,y,F*.13,[[0,'#ffffff'],[.4,'#b9bec4'],[.75,'#4b5056'],[1,'#1a1c1f']]);c.beginPath();c.arc(x,y,F*.12,0,TAU);c.fill();}
 function glass(c,x,y,F){c.save();c.beginPath();c.arc(x,y,F*1.02,0,TAU);c.clip();c.fillStyle=lg(c,0,y-F,0,y+F*.1,[[0,'#ffffff70'],[.5,'#ffffff18'],[1,'#ffffff00']]);c.beginPath();c.ellipse(x,y-F*.48,F*.92,F*.6,0,0,TAU);c.fill();
  c.fillStyle=lg(c,0,y+F*.55,0,y+F,[[0,'#ffffff00'],[1,'#9fe8ff30']]);c.beginPath();c.ellipse(x,y+F*.8,F*.7,F*.25,0,0,TAU);c.fill();c.restore();}
 function ring(c,x,y,R){if(ok(IMG['gauge-ring']))c.drawImage(IMG['gauge-ring'],x-R,y-R,R*2,R*2);else{c.strokeStyle='#cfd3d8';c.lineWidth=R*.2;c.beginPath();c.arc(x,y,R*.9,0,TAU);c.stroke();}}
 function drawGauge(){const [c]=begin('gauge');
  // small sub-dial (walking speed) sits behind the main dial, CPU Meter style
  const sx=208,sy=64,sR=52,s=dial(c,sx,sy,sR,S.sub.a,{max:8,step:2,minor:1,label:'m/s',big:false});needle(c,sx,sy,s.F,s.ang,S.sub.a,'#ff6a1f');glass(c,sx,sy,s.F);ring(c,sx,sy,sR);
  const x=118,y=156,R=112,m=dial(c,x,y,R,S.needle.a,{max:100,step:20,minor:5,label:'STAMINA',red:.2});
  text(c,'体力',x,y-m.F*.2,`600 ${Math.round(m.F*.09)}px ${SANS}`,'#8f98a2','#000');
  // LCD readout window
  const pct=Math.round(S.shown[0]),lw=m.F*.5,lh=m.F*.2,lx=x-lw/2,ly=y+m.F*.42;c.fillStyle=lg(c,0,ly,0,ly+lh,[[0,'#0a0c0d'],[1,'#22272b']]);rr(c,lx,ly,lw,lh,lh*.3);c.fill();c.strokeStyle='#ffffff30';c.lineWidth=1;c.stroke();
  text(c,pct+'%',x,ly+lh/2+.5,`600 ${Math.round(lh*.78)}px ${SANS}`,pct<20?'#ff6a4a':'#e8fbff',null);
  needle(c,x,y,m.F,m.ang,S.needle.a);glass(c,x,y,m.F);ring(c,x,y,R);}
 function drawBattery(){const [c]=begin('battery');const b=S.bat,x=8,y=10,w=180,h=60,r=13;
  const fl=b.flash>0?Math.pow(Math.abs(Math.sin((1-b.flash)*Math.PI*4.5)),.7)*b.flash:0;
  // shadow + glossy white/silver shell (iPhone OS 1 charging battery)
  c.save();c.shadowColor='#000000a0';c.shadowBlur=10;c.shadowOffsetY=4;rr(c,x,y,w,h,r);c.fillStyle='#ccc';c.fill();c.restore();
  rr(c,x,y,w,h,r);c.fillStyle=lg(c,0,y,0,y+h,[[0,'#ffffff'],[.45,'#d8dce0'],[.55,'#b5bbc1'],[1,'#eef0f2']]);c.fill();
  c.fillStyle=lg(c,0,y+h*.3,0,y+h*.7,[[0,'#f4f6f8'],[.5,'#a9afb6'],[1,'#e2e5e8']]);rr(c,x+w-1,y+h*.3,13,h*.4,4);c.fill();
  // cavity: deep grey
  const ix=x+6,iy=y+6,iw=w-12,ih=h-12,ir=r-5;rr(c,ix,iy,iw,ih,ir);c.fillStyle=lg(c,0,iy,0,iy+ih,[[0,'#1b1d20'],[.5,'#2e3236'],[1,'#3a3e43']]);c.fill();
  c.save();rr(c,ix,iy,iw,ih,ir);c.clip();
  const low=b.lvl<.22,top=low?'#ff8a7a':'#a6f56a',mid=low?'#e0261a':'#4fd12a',bot=low?'#8a0f08':'#1f8a14';
  // wet film left behind while the level ebbs
  if(b.ghost>b.lvl+.004){const gx=ix+iw*b.ghost;c.fillStyle=low?'#e0261a40':'#62d83a42';c.fillRect(ix,iy,gx-ix,ih);for(let i=0;i<5;i++){const dx=ix+iw*(b.lvl+(b.ghost-b.lvl)*(i+.5)/5);c.fillStyle=low?'#ff6a5050':'#8cf06055';c.fillRect(dx-1,iy+ih*.55,2,ih*.45*(.5+.5*Math.sin(i*2.3+S.t)));}}
  // liquid body with a curved, sloshing front
  const fx=ix+iw*clamp(b.lvl,0,1),wv=b.wave*6;c.beginPath();c.moveTo(ix-2,iy-2);
  for(let i=0;i<=12;i++){const yy=iy-2+(ih+4)*i/12,bulge=Math.sin(i/12*Math.PI)*3.5,sl=Math.sin(i/12*Math.PI*2+S.t*3)*wv;c.lineTo(fx+bulge+sl,yy);}c.lineTo(ix-2,iy+ih+2);c.closePath();
  c.fillStyle=lg(c,0,iy,0,iy+ih,[[0,top],[.48,mid],[1,bot]]);c.fill();
  // aqua gloss: bright cap on the upper half, glow along the bottom
  c.save();c.clip();c.fillStyle=lg(c,0,iy,0,iy+ih*.5,[[0,'#ffffffd0'],[1,'#ffffff20']]);rr(c,ix+3,iy+2,Math.max(0,fx-ix-4),ih*.46,ir-2);c.fill();
  c.fillStyle=lg(c,0,iy+ih*.6,0,iy+ih,[[0,'#ffffff00'],[1,low?'#ffb0a060':'#d6ff9a70']]);c.fillRect(ix,iy+ih*.6,fx-ix,ih*.4);c.restore();
  c.restore();
  // glass over the cavity
  c.fillStyle=lg(c,0,iy,0,iy+ih*.45,[[0,'#ffffff55'],[1,'#ffffff00']]);rr(c,ix+2,iy+1,iw-4,ih*.42,ir-1);c.fill();
  rr(c,ix,iy,iw,ih,ir);c.strokeStyle='#00000080';c.lineWidth=1.2;c.stroke();
  // red rim flash
  if(fl>.01){c.save();c.shadowColor='#ff1a0a';c.shadowBlur=14*fl;rr(c,x-1,y-1,w+2,h+2,r+1);c.strokeStyle=`rgba(255,40,24,${.95*fl})`;c.lineWidth=3.2;c.stroke();rr(c,x+w-1,y+h*.3,13,h*.4,4);c.stroke();c.restore();}
  text(c,Math.round(S.shown[2])+'%',ix+iw-8,iy+ih/2+.5,`bold 17px ${SANS}`,'#ffffff','#000000b0','right',1.2);
  text(c,'HEALTH  生命',x+2,y+h+15,`600 11px ${SANS}`,'#f2f4f6','#000000d0','left',1);}
 function drawRadar(){const [c,g]=begin('radar');const W=g.w-6,Hh=g.h-6,x=3,y=1;
  // glossy black widget panel
  c.save();c.shadowColor='#000000b0';c.shadowBlur=10;c.shadowOffsetY=4;rr(c,x,y,W,Hh,16);c.fillStyle='#111';c.fill();c.restore();
  rr(c,x,y,W,Hh,16);c.fillStyle=lg(c,0,y,0,y+Hh,[[0,'#4a4f55'],[.08,'#24272b'],[1,'#0b0c0d']]);c.fill();rr(c,x+.5,y+.5,W-1,Hh-1,16);c.strokeStyle='#ffffff40';c.lineWidth=1;c.stroke();
  const cx0=x+64,cy0=y+Hh/2,R=56;
  c.fillStyle=lg(c,0,cy0-R-4,0,cy0+R+4,[[0,'#e8ecef'],[.5,'#8a9096'],[1,'#d5d9dd']]);c.beginPath();c.arc(cx0,cy0,R+4,0,TAU);c.fill();
  c.fillStyle=rg(c,cx0,cy0,2,cx0,cy0,R,[[0,'#0f4a1c'],[.7,'#062a0e'],[1,'#010c03']]);c.beginPath();c.arc(cx0,cy0,R,0,TAU);c.fill();
  c.save();c.beginPath();c.arc(cx0,cy0,R,0,TAU);c.clip();
  c.strokeStyle='#3cff6a40';c.lineWidth=1;for(const f of [.33,.66,1])c.beginPath(),c.arc(cx0,cy0,R*f-1,0,TAU),c.stroke();c.beginPath();c.moveTo(cx0-R,cy0);c.lineTo(cx0+R,cy0);c.moveTo(cx0,cy0-R);c.lineTo(cx0,cy0+R);c.stroke();
  const r=S.radar;if(c.createConicGradient){const sg=c.createConicGradient(r.a-1.6,cx0,cy0);sg.addColorStop(0,'#00ff5000');sg.addColorStop(.25,'#2cff6a70');sg.addColorStop(.2551,'#00ff5000');sg.addColorStop(1,'#00ff5000');c.fillStyle=sg;c.fillRect(cx0-R,cy0-R,R*2,R*2);}
  c.strokeStyle='#9dffb0';c.lineWidth=1.5;c.shadowColor='#3cff6a';c.shadowBlur=6;c.beginPath();c.moveTo(cx0,cy0);c.lineTo(cx0+Math.cos(r.a-1.6+TAU*.25)*R,cy0+Math.sin(r.a-1.6+TAU*.25)*R);c.stroke();
  for(const p of r.blips){if(p.life<=0)continue;const px=cx0+Math.cos(p.a-1.6+TAU*.25)*R*p.d,py=cy0+Math.sin(p.a-1.6+TAU*.25)*R*p.d,red=S.shown[3]<35;c.fillStyle=red?`rgba(255,120,80,${p.life})`:`rgba(170,255,180,${p.life})`;c.shadowColor=red?'#ff5030':'#3cff6a';c.shadowBlur=8;c.beginPath();c.arc(px,py,2.4,0,TAU);c.fill();}
  c.shadowBlur=0;c.restore();
  // dome gloss
  c.save();c.beginPath();c.arc(cx0,cy0,R,0,TAU);c.clip();c.fillStyle=lg(c,0,cy0-R,0,cy0,[[0,'#ffffff60'],[1,'#ffffff00']]);c.beginPath();c.ellipse(cx0,cy0-R*.45,R*.85,R*.55,0,0,TAU);c.fill();c.restore();
  // embossed 5-bar signal meter
  const san=S.shown[3],lit=Math.ceil(san/20-.001),col=san>60?['#c8ff8a','#46d21e','#1c7a0a']:san>30?['#ffe08a','#f0a81e','#8a5a08']:['#ffa08a','#e8321e','#7a1208'];
  const bx=x+136,by=y+86;for(let i=0;i<5;i++){const bw=9,bh=12+i*11,X=bx+i*12.5,Y=by-bh;
   rr(c,X-1,Y-1,bw+2,bh+2,2.5);c.fillStyle='#000';c.fill();rr(c,X,Y+1,bw,bh,2);c.fillStyle='#ffffff18';c.fill();
   rr(c,X,Y,bw,bh,2);c.fillStyle=i<lit?lg(c,X,0,X+bw,0,[[0,col[0]],[.5,col[1]],[1,col[2]]]):lg(c,0,Y,0,Y+bh,[[0,'#2a2e31'],[1,'#17191b']]);c.fill();
   if(i<lit){c.fillStyle='#ffffff70';rr(c,X+1,Y+1,bw*.45,bh-2,1.5);c.fill();c.save();c.shadowColor=col[1];c.shadowBlur=6;c.fillStyle=col[1]+'40';c.fillRect(X,Y,bw,bh);c.restore();}}
  text(c,'SANITY',bx+29,y+100,`600 11px ${SANS}`,'#e9eef2','#000','center');text(c,'理智 '+Math.round(san),bx+29,y+114,`600 10px ${SANS}`,'#9aa4ad','#000','center');}
 function drawTube(){const [c,g]=begin('tube');const t=S.tube,x=13,y=14,w=26,h=228,cxm=x+w/2;
  c.save();c.shadowColor='#00000090';c.shadowBlur=8;c.shadowOffsetX=2;c.shadowOffsetY=4;
  const shape=()=>{c.beginPath();c.moveTo(x,y);c.lineTo(x,y+h-w/2);c.arc(cxm,y+h-w/2,w/2,Math.PI,0,true);c.lineTo(x+w,y);c.closePath();};
  shape();c.fillStyle='#ffffff18';c.fill();c.restore();
  c.save();shape();c.clip();c.fillStyle=lg(c,x,0,x+w,0,[[0,'#2b3a46c0'],[.5,'#3d4f5d80'],[1,'#22303ac0']]);c.fillRect(x,y,w,h);
  const top=y+10,bot=y+h,lvl=bot-(bot-top)*clamp(t.lvl,0,1),dy=t.tilt*w*1.4;
  c.beginPath();c.moveTo(x-1,lvl+dy);c.quadraticCurveTo(cxm,lvl-dy*.2+2,x+w+1,lvl-dy);c.lineTo(x+w+1,bot+2);c.lineTo(x-1,bot+2);c.closePath();
  c.fillStyle=lg(c,x,0,x+w,0,[[0,'#0f4fa8'],[.35,'#4db3ff'],[.6,'#2a8ff0'],[1,'#0a3c86']]);c.fill();
  c.fillStyle='#bfe8ff';c.globalAlpha=.8;c.beginPath();c.ellipse(cxm,lvl+1.5,w/2,2.6,-t.tilt*1.2,0,TAU);c.fill();c.globalAlpha=1;
  c.restore();
  // graduations
  for(let i=1;i<10;i++){const yy=bot-(bot-top)*i/10;c.strokeStyle='#ffffffb0';c.lineWidth=i%5?.8:1.2;c.beginPath();c.moveTo(x+w-(i%5?6:10),yy);c.lineTo(x+w-1,yy);c.stroke();}
  text(c,'50',x+w-14,bot-(bot-top)*.5,`600 7.5px ${SANS}`,'#ffffffd0','#000a','right');
  // glass: rim, edge refraction, long highlight
  shape();c.strokeStyle='#e9f5ffa0';c.lineWidth=1.3;c.stroke();
  c.fillStyle=lg(c,x,0,x+w,0,[[0,'#ffffff00'],[.18,'#ffffffb0'],[.32,'#ffffff20'],[.8,'#ffffff00'],[.9,'#ffffff50'],[1,'#ffffff00']]);c.fillRect(x+1,y+4,w-2,h-w/2);
  c.fillStyle=lg(c,0,y-5,0,y+5,[[0,'#ffffff'],[1,'#9aa6b0']]);rr(c,x-4,y-5,w+8,8,4);c.fill();c.strokeStyle='#5d6a74';c.lineWidth=.8;c.stroke();
  text(c,'水分',cxm,y+h+12,`600 10px ${SANS}`,'#eef2f6','#000','center');
  text(c,Math.round(S.shown[1])+'',cxm,y+h-34,`bold 10px ${SANS}`,'#ffffff','#003a','center');}
 function drawIcon(){const [c]=begin('icon');const x=8,y=8,s=72;
  c.save();c.shadowColor='#000000a0';c.shadowBlur=8;c.shadowOffsetY=4;if(ok(IMG['almond-icon']))c.drawImage(IMG['almond-icon'],x,y,s,s*IMG['almond-icon'].naturalHeight/IMG['almond-icon'].naturalWidth);else{rr(c,x,y,s,s,14);c.fillStyle='#6cb8e8';c.fill();}c.restore();
  // iOS badge
  const n=S.bottles;if(n>0){const bx=x+s-4,by=y+4,t=String(n),bw=Math.max(22,10+t.length*9);c.save();c.shadowColor='#0009';c.shadowBlur=4;c.shadowOffsetY=2;rr(c,bx-bw/2,by-11,bw,22,11);c.fillStyle='#fff';c.fill();c.restore();
   rr(c,bx-bw/2+2,by-9,bw-4,18,9);c.fillStyle=lg(c,0,by-9,0,by+9,[[0,'#ff6a5a'],[.5,'#e3170a'],[1,'#b80c02']]);c.fill();c.fillStyle='#ffffff50';rr(c,bx-bw/2+3,by-8,bw-6,8,4);c.fill();text(c,t,bx,by+.5,`bold 13px ${SANS}`,'#fff',null);}
  text(c,'杏仁水',x+s/2,y+s+18,`600 11px ${SANS}`,'#ffffff','#000000e0','center',1.2);}
 raf=requestAnimationFrame(frame);
 dashMounted={show,hide,get visible(){return visible;},dispose(){cancelAnimationFrame(raf);removeEventListener('keydown',onKey);host?.remove();dashMounted=null;}};loadImages();return dashMounted;
}
