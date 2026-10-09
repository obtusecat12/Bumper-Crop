// V105 · Level 10 skeuomorphic field instruments, second pass (scoped to :root[data-ui-level="10"]).
// The look is carried by rendered bitmaps (assets/ui-v105, sources in art-l10v2/): a small tooled
// leather pad with a loose cluster of separate instruments on and around it: a brass stopwatch
// (stamina) nested in the three gradient arcs, a paper-drum recorder (health), an aneroid
// barometer (sanity), a corked test tube (hydration) and an almond-water bottle, with wheat
// woven behind and in front. Canvas only paints moving parts: hands, ink, liquid, arc fills.
let cCache=null;
const A='./assets/ui-v105/',U=n=>new URL(A+n,import.meta.url).href;
const isL10=()=>document.documentElement.dataset.uiLevel==='10';
const IMG={};let imgReady=null,imgGen=0;
const NAMES=['leather','stopwatch','drum','barometer','tube','bottle','plaque','wheat','compass','brass'];
function loadImages(){return imgReady||=Promise.all(NAMES.map(n=>new Promise(r=>{const im=new Image();im.onload=()=>{imgGen++;r();};im.onerror=()=>r();im.src=U(n+(n==='brass'?'.jpg':'.webp'));IMG[n]=im;})));}
const ok=im=>im&&im.complete&&im.naturalWidth>0;
const TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),D=Math.PI/180;
const CN="Vonwaon16,Vonwaon12,'Songti SC',SimSun,serif";
// ---------- layout: logical 640 × 400 frame; every sprite placed by (x,y)=where its anchor lands ----------
const W=640,H=400;
// sprite-space facts measured on the renders
const SP={stopwatch:{ax:150,ay:238,dial:104,crownY:96},barometer:{ax:120,ay:118,dial:82},drum:{ax:0,ay:0,paper:{x:58,y:24,w:284,h:146},pen:{x:306,y:44}},
 tube:{ax:42,ay:0,in0:11,in1:73,top:70,bot:276},compass:{ax:200,ay:271,disc:150}};
const L={
 leather:{x:322,y:276,s:.62,r:-3*D,ax:320,ay:201},
 wheatBack:{x:232,y:332,s:.62,r:-50*D,ax:395,ay:228,flip:1},
 wheatFront:{x:420,y:372,s:.46,r:-6*D,ax:395,ay:228},
 stopwatch:{x:150,y:290,s:.6,r:30*D},
 drum:{x:300,y:72,s:.52,r:-2.5*D},
 barometer:{x:346,y:296,s:.66,r:9*D},
 tube:{x:462,y:214,s:.58,r:5*D},
 bottle:{x:540,y:292,s:.62,r:-4*D,ax:30,ay:0},
 plaqueBottle:{x:558,y:370,s:.5,r:-3*D,ax:90,ay:36},
 plaqueHealth:{x:476,y:206,s:.4,r:-2.5*D,ax:90,ay:36},
 plaqueSanity:{x:336,y:378,s:.42,r:4*D,ax:90,ay:36},
 plaqueWater:{x:478,y:372,s:.36,r:5*D,ax:90,ay:36},
};
const O={x:150,y:290}; // arc centre = stopwatch centre
const ARCS=[{r0:131,r1:144,c:['#5d7b35','#ad993e','#b65a34']},{r0:116,r1:127,c:['#3a7a6e','#4d7484','#5a6d8c']},{r0:102,r1:112,c:['#933a35','#bb6658','#dca37f']}];
const A0=Math.PI,A1=Math.PI*1.585;
let GP=null;function grainPat(c){if(GP)return GP;const g=document.createElement('canvas');g.width=g.height=64;const x=g.getContext('2d'),d=x.createImageData(64,64);for(let i=0;i<d.data.length;i+=4){const v=200+Math.random()*55|0;d.data[i]=v;d.data[i+1]=v*.97|0;d.data[i+2]=v*.9|0;d.data[i+3]=255;}x.putImageData(d,0,0);GP=c.createPattern(g,'repeat');return GP;}
function at(c,t,ax=t.ax||0,ay=t.ay||0){c.translate(t.x,t.y);c.rotate(t.r||0);c.scale((t.flip?-1:1)*t.s,t.s);c.translate(-ax,-ay);}
function sprite(c,name,t,shadow=[3,5,7,'#000000a0']){const im=IMG[name];if(!ok(im))return;const sp=SP[name]||{};c.save();at(c,t,t.ax??sp.ax??0,t.ay??sp.ay??0);
 if(shadow){c.shadowColor=shadow[3];c.shadowBlur=shadow[2]/t.s;const cs=Math.cos(-(t.r||0)),sn=Math.sin(-(t.r||0));c.shadowOffsetX=(shadow[0]*cs-shadow[1]*sn);c.shadowOffsetY=(shadow[0]*sn+shadow[1]*cs);}
 c.drawImage(im,0,0);c.restore();}
// canvas shadowOffset is in device space; keep it simple: offsets are applied unscaled
function label(c,t,text,size,color='#2a1808'){c.save();at(c,t,t.ax,t.ay);c.font=`${size}px ${CN}`;c.textAlign='center';c.textBaseline='middle';c.fillStyle='#f8e2a070';c.fillText(text,91,38.5);c.fillStyle=color;c.fillText(text,90,37);c.restore();}
function arcPlate(c){
 // brass quadrant plate the arcs are set into, cut from the photographic brass texture
 const rIn=97,rOut=150;c.save();c.beginPath();c.arc(O.x,O.y,rOut,A0-.05,A1+.06);c.arc(O.x,O.y,rIn,A1+.06,A0-.05,true);c.closePath();
 c.shadowColor='#000000b0';c.shadowBlur=8;c.shadowOffsetX=3;c.shadowOffsetY=5;c.fillStyle='#6b5326';c.fill();c.shadowColor='transparent';
 if(ok(IMG.brass)){c.save();c.clip();c.globalAlpha=1;c.drawImage(IMG.brass,O.x-rOut,O.y-rOut,rOut*2,rOut*2);c.globalAlpha=1;
  const g=c.createLinearGradient(O.x-rOut,O.y-rOut,O.x,O.y);g.addColorStop(0,'#fff2c040');g.addColorStop(.5,'#00000000');g.addColorStop(1,'#1e100440');c.fillStyle=g;c.fillRect(O.x-rOut,O.y-rOut,rOut*2,rOut*2);
  // grime pooled toward the inner edge, worn bright toward the outer lip
  const rg=c.createRadialGradient(O.x,O.y,rIn,O.x,O.y,rOut);rg.addColorStop(0,'#1a0e0490');rg.addColorStop(.12,'#2a180840');rg.addColorStop(.85,'#00000000');rg.addColorStop(.95,'#ffe9a838');rg.addColorStop(1,'#1a0e04a0');c.fillStyle=rg;c.fillRect(O.x-rOut,O.y-rOut,rOut*2,rOut*2);c.restore();}
 c.lineWidth=1.4;c.strokeStyle='#1e1206';c.stroke();c.restore();
 // engraved grooves (dark recess + lit lower lip)
 for(const a of ARCS){c.beginPath();c.arc(O.x,O.y,a.r1+1.5,A0,A1);c.arc(O.x,O.y,a.r0-1.5,A1,A0,true);c.closePath();c.fillStyle='#120a04';c.fill();
  c.strokeStyle='#f2d99060';c.lineWidth=.9;c.beginPath();c.arc(O.x,O.y,a.r1+2.2,A0,A1);c.stroke();c.strokeStyle='#00000080';c.beginPath();c.arc(O.x,O.y,a.r0-2.2,A0,A1);c.stroke();}
 // engraved scale ticks on the outer lip
 c.strokeStyle='#2a1a0898';c.lineWidth=.8;for(let i=0;i<=20;i++){const a=A0+(A1-A0)*i/20,r=i%5?3:6;c.beginPath();c.moveTo(O.x+Math.cos(a)*147,O.y+Math.sin(a)*147);c.lineTo(O.x+Math.cos(a)*(147-r),O.y+Math.sin(a)*(147-r));c.stroke();}
 // screws at both ends
 for(const a of [A0+.04,A1-.02])for(const r of [104,140]){screw(c,O.x+Math.cos(a)*(r===104?99.5:148)+0,O.y+Math.sin(a)*(r===104?99.5:148));}
}
function screw(c,x,y,r=3.4){if(ok(IMG.plaque)){/* reuse a real screw head cut from the plaque render */c.save();c.shadowColor='#000a';c.shadowBlur=2;c.shadowOffsetX=.8;c.shadowOffsetY=1.2;c.beginPath();c.arc(x,y,r,0,TAU);c.clip();c.drawImage(IMG.plaque,8,22,30,30,x-r*1.6,y-r*1.6,r*3.2,r*3.2);c.restore();}}
function paintBack(c){
 sprite(c,'wheat',L.wheatBack,[2,4,5,'#00000070']);
 sprite(c,'leather',L.leather,[4,7,10,'#000000b0']);
 arcPlate(c);
 sprite(c,'drum',L.drum);
 label(c,L.plaqueHealth,'',0);sprite(c,'plaque',L.plaqueHealth,[1,2,3,'#000a']);label(c,L.plaqueHealth,'血量',44);
 sprite(c,'barometer',L.barometer);
sprite(c,'wheat',L.wheatFront,[2,4,5,'#00000080']);
 sprite(c,'plaque',L.plaqueSanity,[1,2,3,'#000a']);label(c,L.plaqueSanity,'理智',44);
 // stopwatch body without its bow+crown (the crown is drawn live so it can be pushed)
 const sw=IMG.stopwatch;if(ok(sw)){const t=L.stopwatch,sp=SP.stopwatch;c.save();at(c,t,sp.ax,sp.ay);c.shadowColor='#000000a0';c.shadowBlur=9;c.shadowOffsetX=4;c.shadowOffsetY=5;c.drawImage(sw,0,sp.crownY,sw.width,sw.height-sp.crownY,0,sp.crownY,sw.width,sw.height-sp.crownY);c.shadowColor='transparent';
  // dial lettering: big, bold, Chinese only
  c.font=`30px ${CN}`;c.textAlign='center';c.textBaseline='middle';c.fillStyle='#5a1a10e0';c.fillText('体力',sp.ax,sp.ay-40);c.restore();}
 sprite(c,'bottle',L.bottle,[2,3,4,'#000a']);
 sprite(c,'plaque',L.plaqueBottle,[1,2,3,'#000a']);
 // tube: glass drawn once behind the liquid; highlights re-applied in front with 'screen'
 sprite(c,'tube',L.tube,[3,4,5,'#00000080']);
 sprite(c,'plaque',L.plaqueWater,[1,2,3,'#000a']);label(c,L.plaqueWater,'水分',46);
}
function paintFront(c){
 const im=IMG.tube;if(ok(im)){c.save();at(c,L.tube,SP.tube.ax,0);c.globalCompositeOperation='screen';c.globalAlpha=.85;c.drawImage(im,0,0);c.globalAlpha=1;c.globalCompositeOperation='source-over';
  // the cork and the clamp sit in front of the water too
  c.drawImage(im,0,0,im.width,SP.tube.top-4,0,0,im.width,SP.tube.top-4);c.drawImage(im,70,130,26,50,70,130,26,50);c.restore();}
 // soft glass glints over the two dials (hands sit under the crystal)
 glint(c,L.stopwatch,SP.stopwatch.ax,SP.stopwatch.ay,SP.stopwatch.dial,.55);glint(c,L.barometer,SP.barometer.ax,SP.barometer.ay,SP.barometer.dial,.7);
}
function glint(c,t,x,y,r,s){c.save();c.translate(t.x,t.y);c.scale(t.s,t.s);c.beginPath();c.arc(0,0,r,0,TAU);c.clip();
 const g=c.createLinearGradient(-r,-r,r*.2,r*.2);g.addColorStop(0,`rgba(255,250,230,${.28*s})`);g.addColorStop(.35,`rgba(255,250,230,${.08*s})`);g.addColorStop(.36,'rgba(255,255,255,0)');c.fillStyle=g;c.beginPath();c.ellipse(-r*.18,-r*.3,r*.85,r*.55,-.6,0,TAU);c.fill();
 c.strokeStyle=`rgba(255,248,220,${.35*s})`;c.lineWidth=r*.04;c.beginPath();c.arc(0,0,r*.9,Math.PI*1.08,Math.PI*1.42);c.stroke();c.restore();}
// ---------- audio (lazy, shared nodes, pre-rendered buffers) ----------
let AC=null,bus=null,tickBuf=null,creakBuf=null,lastTick=0,lastCreak=0;
function volume(){try{const v=JSON.parse(localStorage.getItem('level10.preferences.v1')||'{}').volume;return clamp((v??65)/100,0,1);}catch{return .65;}}
function audio(){if(AC)return AC.state==='running'?AC:null;try{AC=new (globalThis.AudioContext||globalThis.webkitAudioContext)();}catch{return null;}
 bus=AC.createGain();bus.gain.value=.16;bus.connect(AC.destination);const sr=AC.sampleRate;
 tickBuf=AC.createBuffer(1,Math.round(sr*.022),sr);{const d=tickBuf.getChannelData(0);let p=0;for(let i=0;i<d.length;i++){const t=i/sr,env=Math.exp(-t*420);p+=(Math.random()*2-1-p)*.55;d[i]=(Math.sin(t*TAU*3900)*.6+p*.8)*env+(i<sr*.0016?Math.sin(t*TAU*1700)*.5:0)*Math.exp(-t*900);}}
 creakBuf=AC.createBuffer(1,Math.round(sr*.75),sr);{const d=creakBuf.getChannelData(0);let ph=0,lp=0;for(let i=0;i<d.length;i++){const t=i/sr,f=95+40*Math.sin(t*9)+t*60;ph+=f/sr;// stick-slip friction pulses
  const pulse=Math.pow(Math.max(0,Math.sin(ph*TAU)),14),grit=(Math.random()*2-1);lp+=(grit-lp)*.25;const env=Math.min(1,t*30)*Math.exp(-t*2.6)*(t>.62?Math.max(0,1-(t-.62)/.13):1);
  d[i]=(pulse*.9*(.6+.4*Math.sin(t*TAU*2300))+lp*.25*pulse+Math.sin(t*TAU*(1800+300*Math.sin(t*5)))*.08)*env;}
  // final "spring snaps tight" clank
  for(let i=Math.round(sr*.6);i<d.length;i++){const t=(i/sr-.6);d[i]+=Math.sin(t*TAU*620)*Math.exp(-t*60)*.5;}}
 return AC.state==='running'?AC:null;}
function play(buf,gain=1,rate=1){const ac=audio();if(!ac||!buf)return;const v=volume();if(v<=0)return;const s=ac.createBufferSource();s.buffer=buf;s.playbackRate.value=rate;const g=ac.createGain();g.gain.value=gain*v;s.connect(g);g.connect(bus);s.start();}
addEventListener('pointerdown',()=>{audio();if(AC&&AC.state==='suspended')AC.resume();},{passive:true});addEventListener('keydown',()=>{audio();if(AC&&AC.state==='suspended')AC.resume();},{passive:true});
// ---------- live dashboard ----------
let mounted=null,shiftHeld=false,fontGen=0;
document.fonts?.addEventListener?.('loadingdone',()=>{fontGen++;cCache=null;});
addEventListener('keydown',e=>{if(e.key==='Shift')shiftHeld=true;},{passive:true});addEventListener('keyup',e=>{if(e.key==='Shift')shiftHeld=false;},{passive:true});addEventListener('blur',()=>{shiftHeld=false;});
const PAPER=SP.drum.paper;
export function mountL10Dash(){if(mounted)return mounted;loadImages();
 let host=null,back,live,front,bctx,lctx,fctx,size='',raf=0,lastT=0,acc=0;
 const S={shown:[100,100,100,100],sw:{angle:0,running:false,press:0,ticks:0,minutes:0,jam:0},ink:null,ictx:null,iw:0,head:0,penY:0,penV:0,burst:0,lastHealth:100,t:0,k:1,
  baro:{a:1,v:0,set:1},tube:{tilt:0,tv:0,wave:0,wv:0,phase:0,lastVx:0,lastVz:0,lastYaw:null,step:0}};
 function ensure(){const stats=document.querySelector('.stats');if(!stats)return false;if(host&&host.isConnected)return true;
  stats.insertAdjacentHTML('beforeend',`<div class="l10-dash" aria-hidden="true"><canvas class="l10-back"></canvas><canvas class="l10-live"></canvas><canvas class="l10-front"></canvas></div>`);
  host=stats.querySelector('.l10-dash');[back,live,front]=host.querySelectorAll('canvas');bctx=back.getContext('2d');lctx=live.getContext('2d');fctx=front.getContext('2d');size='';return true;}
 function resize(){const r=host.getBoundingClientRect();if(r.width<4)return false;
  // render a little under device resolution: the bitmaps should read soft, like old game textures
  const dpr=Math.min(1.5,devicePixelRatio||1),w=Math.round(r.width*dpr),h=Math.round(r.height*dpr),key=w+'x'+h+'/'+imgGen+'/'+fontGen;if(key===size)return true;size=key;
  for(const cv of [back,live,front]){cv.width=w;cv.height=h;}const k=w/W;S.k=k;
  for(const c of [bctx,fctx]){c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,w,h);c.setTransform(k,0,0,k,0,0);c.imageSmoothingQuality='medium';}paintBack(bctx);paintFront(fctx);
  // ink ring buffer, in drum-sprite pixels × device scale
  const ds=k*L.drum.s;S.ds=ds;S.iw=Math.round(PAPER.w*ds);S.ink=document.createElement('canvas');S.ink.width=S.iw;S.ink.height=Math.round(PAPER.h*ds);S.ictx=S.ink.getContext('2d');S.head=0;return true;}
 function readVals(){const st=globalThis.__bcHudState,get=id=>Number(document.getElementById(id)?.getAttribute('aria-valuenow'));
  return st?[st.stamina,st.hydration,st.health,st.sanity??get('sanity-meter')]:[get('stamina-meter'),get('hydration-meter'),get('health-meter'),get('sanity-meter')].map(v=>Number.isFinite(v)?v:100);}
 function frame(now){raf=requestAnimationFrame(frame);if(!isL10()||document.hidden)return;if(!ensure())return;const dt=Math.min(.1,(now-(lastT||now))/1000);lastT=now;acc+=dt;if(acc<1/30)return;const step=Math.min(.1,acc);acc=0;
  if(!host.getClientRects().length)return;
  if(!resize())return;simulate(step);draw();}
 function simulate(dt){S.t+=dt;const v=readVals(),st=globalThis.__bcHudState;for(let i=0;i<4;i++){const t=clamp(Number(v[i])||0,0,100);S.shown[i]+=(t-S.shown[i])*(1-Math.exp(-dt*8));}
  const vx=st?.velocity?.x||0,vz=st?.velocity?.z||0,speed=Math.hypot(vx,vz),moving=speed>.4;
  // --- stopwatch: sprint presses the crown, the seconds hand races in 1/10 s jumps ---
  const sw=S.sw,wantRun=speed>4.2;
  if(wantRun&&!sw.running){sw.running=true;sw.press=1;sw.jam=0;}
  if(!wantRun&&sw.running){sw.running=false;sw.press=1;}
  if(!sw.running&&sw.angle!==0&&v[0]>=99.5&&sw.press<=0){sw.angle=0;sw.ticks=0;sw.press=1;play(tickBuf,.7,.7);} // flyback reset
  sw.press=Math.max(0,sw.press-dt*7);
  if(sw.running){sw.tickAcc=(sw.tickAcc||0)+dt*10;while(sw.tickAcc>=1){sw.tickAcc--;sw.angle+=TAU/30;sw.ticks++;if(sw.ticks%30===0)sw.minutes=(sw.minutes+1)%30;if(S.t-lastTick>.05){play(tickBuf,.55+Math.random()*.1,1+Math.random()*.08);lastTick=S.t;}}}
  const drained=v[0]<=1.5&&(S.prevStam??100)>1.5;S.prevStam=v[0];if(drained){sw.jam=1.2;if(S.t-lastCreak>1.2){play(creakBuf,1.1);lastCreak=S.t;}}
  if(v[0]<=1.5&&shiftHeld&&S.t-lastCreak>2.4&&moving){sw.jam=1.2;play(creakBuf,.8,.94+Math.random()*.1);lastCreak=S.t;}
  sw.jam=Math.max(0,sw.jam-dt);
  // --- drum recorder: dense dark-red ink, bleeding into the paper ---
  const hp=S.shown[2],dh=(S.lastHealth-v[2]);if(dh>.3)S.burst=Math.min(1.6,S.burst+dh*.12+.35);S.lastHealth=v[2];S.burst*=Math.exp(-dt*1.6);
  const ds=S.ds,adv=24*ds*dt;S.pAcc=(S.pAcc||0)+adv;const cols=Math.floor(S.pAcc);S.pAcc-=cols;
  const c=S.ictx,h=S.ink.height,penX=Math.round((SP.drum.pen.x-PAPER.x)*ds),weak=1-hp/100,amp=h*.36;
  for(let i=0;i<cols;i++){S.head=(S.head+1)%S.iw;const x0=(S.head+penX-1+S.iw)%S.iw;c.clearRect((x0+2)%S.iw,0,1,h);
   const sub=4;let y=S.penY,pts=[[x0+.5,h/2+y*amp]];
   for(let s=1;s<=sub;s++){S.ph=(S.ph||0)+1;const t=S.t+(i*sub+s)/(cols*sub+1)*dt,beat=Math.pow(Math.max(0,Math.sin(t*TAU*(1.1+weak*1.4))),18)*(.35+weak*.4),
     trem=(Math.random()*2-1)*(.05+weak*.22+S.burst*.55),hf=Math.sin(S.ph*2.7)*(.04+weak*.06+S.burst*.3);
     const target=clamp(-beat+trem+hf+Math.sin(t*1.7)*.05*weak,-1,1);S.penV+=(target-y)*.6;S.penV*=.55;y+=S.penV;y=clamp(y,-1,1);pts.push([x0+s/sub,h/2+y*amp]);}
   for(const [lw,col] of [[2.6*ds,'rgba(120,20,22,.10)'],[Math.max(.7,.9*ds),`rgba(${70+weak*40|0},8,12,.85)`]]){c.strokeStyle=col;c.lineWidth=lw;c.beginPath();c.moveTo(...pts[0]);for(const p of pts)c.lineTo(...p);c.stroke();}
   if(Math.random()<.02+S.burst*.05){c.fillStyle='rgba(90,10,14,.25)';c.beginPath();c.arc(x0,h/2+y*amp,(1+Math.random()*1.6)*ds,0,TAU);c.fill();} // ink blot
   S.penY=y;}
  // --- barometer ---
  const b=S.baro,target=clamp(S.shown[3]/100,0,1)+(S.shown[3]<35?(Math.sin(S.t*23)*.006+(Math.random()-.5)*.01):0);b.v+=(target-b.a)*dt*60;b.v*=Math.exp(-dt*9);b.a+=b.v*dt;b.set+=(b.a-b.set)*(1-Math.exp(-dt*.25));
  // --- test tube: spring–damper surface tilt + step wave ---
  const tu=S.tube,yaw=st?.yaw||0;let ax=0;if(st){const fx=Math.cos(yaw),fz=-Math.sin(yaw);
   const dvx=(vx-tu.lastVx)/dt,dvz=(vz-tu.lastVz)/dt;ax=(dvx*fx+dvz*fz);tu.lastVx=vx;tu.lastVz=vz;let dyaw=tu.lastYaw==null?0:((yaw-tu.lastYaw+Math.PI*3)%TAU)-Math.PI;tu.lastYaw=yaw;ax+=dyaw/dt*1.4;}
  ax=clamp(ax,-30,30);tu.tv+=(-60*tu.tilt-3.2*tu.tv-ax*.022)*dt;tu.tilt=clamp(tu.tilt+tu.tv*dt,-.5,.5);
  if(moving){tu.step+=dt*speed*.62;if(tu.step>1){tu.step-=1;tu.wv+=(speed>4.2?1.6:.9)*(Math.random()*.4+.8);}}
  tu.wv+=(-140*tu.wave-4*tu.wv)*dt;tu.wave+=tu.wv*dt;tu.phase+=dt*9;
 }
 function draw(){const c=lctx,k=S.k;c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,live.width,live.height);c.setTransform(k,0,0,k,0,0);
  // arcs: matte vintage gradients running along the arc length (bottom → top)
  ARCS.forEach((a,i)=>{const val=S.shown[i===0?0:i===1?1:2]/100;if(val<=.002)return;const end=A0+(A1-A0)*val,mid=(a.r0+a.r1)/2;
   const g=c.createConicGradient?c.createConicGradient(A0,O.x,O.y):null;if(g){g.addColorStop(0,a.c[0]);g.addColorStop((A1-A0)/TAU*.5,a.c[1]);g.addColorStop((A1-A0)/TAU,a.c[2]);g.addColorStop(1,a.c[2]);}
   c.beginPath();c.arc(O.x,O.y,a.r1,A0,end);c.arc(O.x,O.y,a.r0,end,A0,true);c.closePath();c.fillStyle=g||a.c[1];c.fill();
   const hl=c.createRadialGradient(O.x,O.y,a.r0,O.x,O.y,a.r1);hl.addColorStop(0,'#00000048');hl.addColorStop(.4,'#ffffff22');hl.addColorStop(.6,'#ffffff10');hl.addColorStop(1,'#00000058');c.fillStyle=hl;c.fill();
   if(grainPat(c)){c.save();c.globalCompositeOperation='multiply';c.globalAlpha=.55;c.fillStyle=grainPat(c);c.fill();c.restore();}
   c.strokeStyle='#d8b46a90';c.lineWidth=.8;c.stroke();
   if(val<.25){c.fillStyle=`rgba(255,240,200,${.12+.12*Math.sin(S.t*6)})`;c.fill();}});
  // stopwatch crown + bow (pushed in when sprinting), then hands
  const sw=S.sw,T=L.stopwatch,sp=SP.stopwatch,im=IMG.stopwatch;c.save();at(c,T,sp.ax,sp.ay);
  if(ok(im)){const push=(sw.press>0?Math.sin(sw.press*Math.PI)*6:0)+(sw.jam>0?3:0);c.shadowColor='#0009';c.shadowBlur=5;c.shadowOffsetX=3;c.shadowOffsetY=3;c.drawImage(im,0,0,im.width,sp.crownY+6,0,push,im.width,sp.crownY+6);c.shadowColor='transparent';}
  c.translate(sp.ax,sp.ay);const R=sp.dial-14;
  c.save();c.translate(0,R*.52);c.rotate(sw.minutes/30*TAU+sw.ticks/900*TAU);c.fillStyle='#14100c';c.fillRect(-1.6,-R*.24,3.2,R*.3);c.restore();
  const jitter=sw.jam>0?(Math.random()-.5)*.05*sw.jam:0;c.save();c.rotate(sw.angle+jitter);
  c.shadowColor='#0007';c.shadowBlur=3;c.shadowOffsetX=2.5;c.shadowOffsetY=3;c.fillStyle='#16110b';c.beginPath();c.moveTo(-2,22);c.lineTo(-1,-R);c.lineTo(1,-R);c.lineTo(2,22);c.closePath();c.fill();c.beginPath();c.arc(0,16,5,0,TAU);c.fill();c.shadowColor='transparent';c.restore();
  c.fillStyle='#2a1c0a';c.beginPath();c.arc(0,0,6,0,TAU);c.fill();c.fillStyle='#d8b468';c.beginPath();c.arc(-1,-1,3,0,TAU);c.fill();c.restore();
  // drum: ink ring buffer wrapped on the cylinder, pen arm
  const DRm=L.drum;c.save();at(c,DRm,0,0);c.beginPath();c.rect(PAPER.x,PAPER.y,PAPER.w,PAPER.h);c.clip();
  const iw=S.iw,ih=S.ink.height,sx=S.head,first=iw-sx,ds=S.ds;c.globalCompositeOperation='multiply';
  c.drawImage(S.ink,sx,0,first,ih,PAPER.x,PAPER.y,first/ds,PAPER.h);if(sx>0)c.drawImage(S.ink,0,0,sx,ih,PAPER.x+first/ds,PAPER.y,sx/ds,PAPER.h);c.globalCompositeOperation='source-over';
  const cg=c.createLinearGradient(0,PAPER.y,0,PAPER.y+PAPER.h);cg.addColorStop(0,'#3a240c50');cg.addColorStop(.25,'#00000000');cg.addColorStop(.8,'#00000000');cg.addColorStop(1,'#3a240c60');c.fillStyle=cg;c.fillRect(PAPER.x,PAPER.y,PAPER.w,PAPER.h);c.restore();
  c.save();at(c,DRm,0,0);const pen=SP.drum.pen,tipX=pen.x,tipY=PAPER.y+PAPER.h/2+S.penY*PAPER.h*.36;
  c.shadowColor='#000a';c.shadowBlur=3;c.shadowOffsetX=3;c.shadowOffsetY=4;c.strokeStyle='#2a1a08';c.lineWidth=5;c.beginPath();c.moveTo(pen.x+40,pen.y);c.quadraticCurveTo(tipX+30,tipY-30,tipX+3,tipY-6);c.stroke();c.shadowColor='transparent';c.strokeStyle='#caa257';c.lineWidth=2.4;c.stroke();
  c.fillStyle='#1e0507';c.beginPath();c.moveTo(tipX,tipY);c.lineTo(tipX+7,tipY-9);c.lineTo(tipX+2,tipY-11);c.closePath();c.fill();c.fillStyle='#6a1216';c.beginPath();c.arc(tipX+5,tipY-12,4,0,TAU);c.fill();c.restore();
  // barometer needle + brass set hand
  const b=S.baro,BT=L.barometer,bs=SP.barometer,s0=Math.PI*.75,s1=Math.PI*2.25,br=bs.dial-8;c.save();c.translate(BT.x,BT.y);c.rotate(BT.r);c.scale(BT.s,BT.s);
  c.save();c.rotate(s0+(s1-s0)*b.set+Math.PI/2);c.strokeStyle='#b8893c';c.lineWidth=2.4;c.beginPath();c.moveTo(0,0);c.lineTo(0,-br+8);c.stroke();c.restore();
  c.save();c.rotate(s0+(s1-s0)*clamp(b.a,0,1)+Math.PI/2);c.shadowColor='#0008';c.shadowBlur=3;c.shadowOffsetX=2.5;c.shadowOffsetY=3.5;c.fillStyle='#1b2130';c.beginPath();c.moveTo(-2.6,18);c.lineTo(-.8,-br+10);c.lineTo(0,-br+2);c.lineTo(.8,-br+10);c.lineTo(2.6,18);c.closePath();c.fill();
  c.beginPath();c.arc(0,20,6.5,0,TAU);c.fill();c.shadowColor='transparent';c.restore();c.fillStyle='#c9a258';c.beginPath();c.arc(0,0,6,0,TAU);c.fill();c.fillStyle='#4a3010';c.beginPath();c.arc(0,0,2.2,0,TAU);c.fill();
  // sanity zones written on the dial, big
  c.font=`22px ${CN}`;c.textAlign='center';c.textBaseline='middle';[['狂','#7a1c16'],['乱','#4a2a1a'],['静','#2a2a1a'],['明','#1a2a4a']].forEach(([w,col],i)=>{const a=s0+(s1-s0)*(i+.5)/4;c.fillStyle=col+'d0';c.fillText(w,Math.cos(a)*(br-16),Math.sin(a)*(br-16));});c.restore();
  // tube liquid (cool almond-water blue), sloshing
  const TT=L.tube,ts=SP.tube,lvl=clamp(S.shown[1]/100,0,1),x0=ts.in0,x1=ts.in1,rad=(x1-x0)/2,cx=(x0+x1)/2,yTop=ts.top+6,yBot=ts.bot,yS=yBot-(yBot-yTop)*lvl;
  if(lvl>.003){c.save();at(c,TT,ts.ax,0);c.beginPath();c.moveTo(x0,ts.top);c.lineTo(x0,yBot-rad);c.arc(cx,yBot-rad,rad,Math.PI,0,true);c.lineTo(x1,ts.top);c.closePath();c.clip();
   const tilt=Math.tan(tu().tilt-TT.r)*rad,amp=tu().wave*5;c.beginPath();c.moveTo(x0-2,yS+tilt);for(let i=1;i<=10;i++){const u=i/10,x=x0+u*(x1-x0);c.lineTo(x,yS+tilt*(1-2*u)+Math.sin(u*Math.PI*2+tu().phase)*amp*.6+Math.sin(u*Math.PI)*amp*.4);}c.lineTo(x1+2,yBot+2);c.lineTo(x0-2,yBot+2);c.closePath();
   const g=c.createLinearGradient(x0,0,x1,0);g.addColorStop(0,'#3d6a80d8');g.addColorStop(.35,'#86b4c8c0');g.addColorStop(.65,'#a9cfdcb0');g.addColorStop(1,'#33607ae0');c.fillStyle=g;c.fill();
   const dg=c.createLinearGradient(0,yS,0,yBot);dg.addColorStop(0,'#ffffff00');dg.addColorStop(1,'#0a2a4070');c.fillStyle=dg;c.fill();
   c.strokeStyle='#eef8ffd8';c.lineWidth=2.4;c.beginPath();c.moveTo(x0,yS+tilt-1.5);c.quadraticCurveTo(cx,yS+amp*.5+2,x1,yS-tilt-1.5);c.stroke();
   for(let i=0;i<3;i++){const u=((S.t*.12+i*.37)%1),by=yBot-10-u*(yBot-10-yS),bx=cx-12+i*12+Math.sin(S.t*2+i)*3;if(by>yS+5){c.strokeStyle='#e6f6ff90';c.lineWidth=1.2;c.beginPath();c.arc(bx,by,2+i*.6,0,TAU);c.stroke();}}
   c.restore();}
  // almond water count, stamped on its plaque
  const p=L.plaqueBottle,n=parseInt(document.getElementById('bottle-count')?.textContent||'0',10)||0;c.save();at(c,p,p.ax,p.ay);c.font=`48px ${CN}`;c.textAlign='center';c.textBaseline='middle';c.fillStyle='#f8e2a080';c.fillText('×'+String(n).padStart(2,'0'),92,39.5);c.fillStyle='#24140a';c.fillText('×'+String(n).padStart(2,'0'),90,37);c.restore();
 }
 const tu=()=>S.tube;
 raf=requestAnimationFrame(frame);
 mounted={stop(){cancelAnimationFrame(raf);}};return mounted;
}
// ---------- brass pocket compass (top-right). 256 × 316 logical frame, no lid ----------
const CW=256,CH=330,CS=.6,CC={x:128,y:8+SP.compass.ay*CS,R:SP.compass.disc*CS};
const needle={a:null,v:0};
function compassStatic(w,h,k){const back=document.createElement('canvas'),front=document.createElement('canvas'),ring=document.createElement('canvas');for(const cv of [back,front]){cv.width=w;cv.height=h;}
 const b=back.getContext('2d'),f=front.getContext('2d');b.scale(k,k);f.scale(k,k);
 const im=IMG.compass;if(ok(im)){b.save();b.shadowColor='#000000a8';b.shadowBlur=9;b.shadowOffsetX=3;b.shadowOffsetY=5;b.drawImage(im,CC.x-SP.compass.ax*CS,CC.y-SP.compass.ay*CS,im.width*CS,im.height*CS);b.restore();}
 // bearing plaque hanging over the lower rim
 const pq=IMG.plaque,pw=118,ph=pw*73/180,px=CC.x-pw/2,py=CC.y+CC.R+16;if(ok(pq)){f.save();f.shadowColor='#000a';f.shadowBlur=4;f.shadowOffsetX=2;f.shadowOffsetY=3;f.drawImage(pq,px,py,pw,ph);f.restore();}
 // printed rotating compass card (aged paper is the render's own, this adds the rose)
 const rr=CC.R-2,rs=Math.ceil(rr*2*k);ring.width=ring.height=rs;const r=ring.getContext('2d');r.scale(k,k);r.translate(rr,rr);
 r.strokeStyle='#2a1e14d0';for(let i=0;i<72;i++){if(i%18===0)continue;const a=i/72*TAU-Math.PI/2,big=i%9===0,mid=i%3===0;r.lineWidth=big?1.6:.8;r.beginPath();r.moveTo(Math.cos(a)*(rr-2),Math.sin(a)*(rr-2));r.lineTo(Math.cos(a)*(rr-(big?9:mid?6:4)),Math.sin(a)*(rr-(big?9:mid?6:4)));r.stroke();}
 
 r.textAlign='center';r.textBaseline='middle';[['北','#9a2018'],['东','#1b130c'],['南','#1b130c'],['西','#1b130c']].forEach(([t,col],i)=>{r.save();r.rotate(i*Math.PI/2);r.font=`16px ${CN}`;r.fillStyle=col;r.fillText(t,0,-(rr-20.5));r.restore();});
 return{back,front,ring,rr,k,w,h,plaque:{x:CC.x,y:py+ph/2}};}
export function paintBrassCompass(c,rect,map,yaw,bearing){
 const w=Math.round(rect.width),h=Math.round(rect.height),k=Math.min(w/CW,h/CH),ox=rect.left+(w-CW*k)/2,oy=rect.top+(h-CH*k)/2;
 loadImages();if(!cCache||cCache.w!==w||cCache.h!==h||cCache.gen!==imgGen+'/'+fontGen){cCache={...compassStatic(w,h,k),gen:imgGen+'/'+fontGen};}
 c.save();c.setTransform(1,0,0,1,0,0);c.drawImage(cCache.back,ox,oy);c.translate(ox,oy);c.scale(k,k);
 const mr=cCache.rr-31;
 // rotating map, toned into the paper under the crystal
 c.save();c.beginPath();c.arc(CC.x,CC.y,mr,0,TAU);c.clip();c.translate(CC.x,CC.y);c.rotate(yaw);const m=mr*2*310/190;c.globalAlpha=.9;c.drawImage(map,-m/2,-m/2,m,m);c.globalAlpha=1;c.rotate(-yaw);
 c.globalCompositeOperation='multiply';c.fillStyle='#e6cf9c';c.fillRect(-mr,-mr,mr*2,mr*2);c.globalCompositeOperation='source-over';
 const vg=c.createRadialGradient(0,0,mr*.5,0,0,mr);vg.addColorStop(0,'#00000000');vg.addColorStop(1,'#3a200a60');c.fillStyle=vg;c.fillRect(-mr,-mr,mr*2,mr*2);c.restore();
 c.strokeStyle='#2a1a0ab0';c.lineWidth=1.4;c.beginPath();c.arc(CC.x,CC.y,mr,0,TAU);c.stroke();
 c.save();c.translate(CC.x,CC.y);c.rotate(yaw);c.drawImage(cCache.ring,-cCache.rr,-cCache.rr,cCache.rr*2,cCache.rr*2);c.restore();
 // fixed lubber mark
 c.fillStyle='#8a1a12';c.beginPath();c.moveTo(CC.x,CC.y-CC.R+9);c.lineTo(CC.x-5,CC.y-CC.R-3);c.lineTo(CC.x+5,CC.y-CC.R-3);c.closePath();c.fill();
 // magnetic needle: underdamped spring toward north (= yaw in screen space); blued steel + red north
 const now=performance.now()/1000,dt=Math.min(.1,needle.t?now-needle.t:0);needle.t=now;if(needle.a==null)needle.a=yaw;let diff=((yaw-needle.a+Math.PI*3)%TAU)-Math.PI;needle.v+=diff*dt*38;needle.v*=Math.exp(-dt*3.2);needle.a+=needle.v*dt;
 c.save();c.translate(CC.x,CC.y);c.rotate(needle.a);c.shadowColor='#0009';c.shadowBlur=4;c.shadowOffsetX=3;c.shadowOffsetY=4;const nl=mr-4;
 c.fillStyle='#9e2a1e';c.beginPath();c.moveTo(0,-nl);c.lineTo(7,0);c.lineTo(-7,0);c.closePath();c.fill();c.fillStyle='#27303c';c.beginPath();c.moveTo(0,nl-6);c.lineTo(7,0);c.lineTo(-7,0);c.closePath();c.fill();c.shadowColor='transparent';
 c.fillStyle='#ffffff38';c.beginPath();c.moveTo(0,-nl);c.lineTo(0,0);c.lineTo(-7,0);c.closePath();c.fill();c.fillStyle='#ffffff1a';c.beginPath();c.moveTo(0,nl-6);c.lineTo(0,0);c.lineTo(-7,0);c.closePath();c.fill();
 const pg=c.createRadialGradient(-2,-2,.5,0,0,7);pg.addColorStop(0,'#fff0b8');pg.addColorStop(.5,'#c9a258');pg.addColorStop(1,'#3a2610');c.fillStyle=pg;c.beginPath();c.arc(0,0,6.5,0,TAU);c.fill();c.restore();
 // crystal: one broad window reflection + rim refraction shadow
 c.save();c.beginPath();c.arc(CC.x,CC.y,CC.R,0,TAU);c.clip();const rg=c.createRadialGradient(CC.x,CC.y,CC.R*.78,CC.x,CC.y,CC.R);rg.addColorStop(0,'#00000000');rg.addColorStop(1,'#1a0e0460');c.fillStyle=rg;c.fillRect(CC.x-CC.R,CC.y-CC.R,CC.R*2,CC.R*2);
 const gg=c.createLinearGradient(CC.x-CC.R,CC.y-CC.R,CC.x,CC.y);gg.addColorStop(0,'#fff8e048');gg.addColorStop(.6,'#fff8e010');gg.addColorStop(.61,'#fff8e000');c.fillStyle=gg;c.beginPath();c.ellipse(CC.x-CC.R*.2,CC.y-CC.R*.34,CC.R*.8,CC.R*.46,-.62,0,TAU);c.fill();c.restore();
 c.setTransform(1,0,0,1,0,0);c.drawImage(cCache.front,ox,oy);c.translate(ox,oy);c.scale(k,k);
 c.font=`22px ${CN}`;c.textAlign='center';c.textBaseline='middle';const q=cCache.plaque;c.fillStyle='#f6dfa080';c.fillText(bearing||'',q.x+1,q.y+1.5);c.fillStyle='#24160a';c.fillText(bearing||'',q.x,q.y);
 c.restore();
 return Math.abs(needle.v)>.002||Math.abs(diff)>.002;
}
