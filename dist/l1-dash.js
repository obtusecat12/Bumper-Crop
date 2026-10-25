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
const __bcT=s=>{const b=globalThis.BCi18n;return b&&typeof s==='string'?b.t(s):s;};
const U=n=>new URL('./assets/'+n,import.meta.url).href;
const isL1=()=>document.documentElement.dataset.uiLevel==='1';
const IMG={};let imgGen=0,imgStarted=false;try{addEventListener('bc-lang',()=>{imgGen++;});}catch{}
const SRC={'compass-ring':'ui-v114/compass-ring.webp','gauge-ring':'ui-v114/gauge-ring.webp','almond-icon':'ui-v114/almond-icon.webp',standoff:'ui-v114/standoff.webp',
 leather:'ui-v116/leather.jpg',brushed:'ui-v116/brushed.jpg',dust:'ui-v116/dust.jpg',screw:'ui-v116/screw.webp',chromeDash:'ui-v142/chrome-dash.jpg',chromeNav:'ui-v142/chrome-nav.jpg',shellDash:'ui-v142/shell-dash.webp',shellNav:'ui-v142/shell-nav.webp'};
function loadImages(){if(imgStarted)return;imgStarted=true;try{for(const f of ['16px Vonwaon16','12px Vonwaon12'])document.fonts.load(f,'理A').then(()=>{imgGen++;});document.fonts.addEventListener('loadingdone',()=>{imgGen++;});}catch{}
 for(const [k,n] of Object.entries(SRC)){const im=new Image();im.decoding='async';im.onload=()=>{
  // V130-C: keep a CPU-resident copy so drawing it into the era pass's CPU canvases never waits on the GPU process
  if(globalThis.__l1Era?.on&&globalThis.__l1Era.cpu){try{const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;c.getContext('2d',{willReadFrequently:true}).drawImage(im,0,0);c.naturalWidth=c.width;c.naturalHeight=c.height;c.complete=true;IMG[k]=c;}catch{}}imgGen++;};im.src=U(n);IMG[k]=im;}}
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
function text3d(c,s,x,y,font,{align='center',line='#8b958f',top='#fbf7ea',bot='#a5aca8',depth=3,ink='#000000b0'}={}){if(globalThis.__l1Era?.on&&(parseFloat(font)||12)*(Math.hypot(c.getTransform().a,c.getTransform().b))<22)depth=Math.min(depth,1);c.save();c.font=font;c.textAlign=align;c.textBaseline='middle';const m=c.getTransform(),u=1/(Math.hypot(m.a,m.b)||1);
 c.fillStyle=ink;c.fillText(__bcT(s),x+(depth+1)*u*.6,y+(depth+1)*u);c.fillStyle=line;for(let i=depth;i>=1;i--)c.fillText(__bcT(s),x+i*u*.6,y+i*u);
 const fs=parseFloat(font)||12;c.fillStyle=lg(c,0,y-fs*.5,0,y+fs*.5,[[0,top],[1,bot]]);c.fillText(__bcT(s),x,y);c.restore();}
function lg(c,x0,y0,x1,y1,stops){const g=c.createLinearGradient(x0,y0,x1,y1);for(const [o,col] of stops)g.addColorStop(o,col);return g;}
function rg(c,x0,y0,r0,x1,y1,r1,stops){const g=c.createRadialGradient(x0,y0,r0,x1,y1,r1);for(const [o,col] of stops)g.addColorStop(o,col);return g;}
function text(c,s,x,y,font,fill,shadow='#000000c0',align='center',sy=1){c.font=font;c.textAlign=align;c.textBaseline='middle';if(shadow){c.fillStyle=shadow;c.fillText(__bcT(s),x,y+sy);}c.fillStyle=fill;c.fillText(__bcT(s),x,y);}

// ---------- map palette: the printed directory (light) ----------
export const L1_MAP_PAL=Object.freeze({bg:'#e9ebe6',floor:'#d9ddd8',sec:['','#efe1a1','#e6c4bb','#cbe0c2','#ecd0a6'],wall:'#30353b',low:'#a3a9ad',door:'#13994a',thr:'#e2741c',cluBg:'#e4dccb',cluRoom:'#f1eadb',cluWall:'#5a4938'});
export const L1_LEGEND=[['#d9ddd8','天鹰段 停车层'],['#efe1a1','跃金段'],['#e6c4bb','哥特段'],['#cbe0c2','衔尾段'],['#ecd0a6','传说段'],['#e4dccb','小径'],['#13994a','出口门'],['#e2741c','阈界 → Level 2']];

// ---------- audio: one context, one bus; V130-C: the approved CC0 sample set (dist/audio/ui-l1, PR #2) ----------
// Files are fetched once at mount (≈ 90 KB), decoded once into AudioBuffers and reused for every cue. The old
// synthesized cues (boop / boopHi / click / thunk) stay only as a fallback while a sample is still loading or failed.
let AC=null,bus=null,BUF={};
const SFX={pop:'l1_pop_drop',popLow:'l1_pop_drop_low',chime:'l1_pop_chime',whoosh:'l1_slide_whoosh',spring:'l1_overshoot_spring',settle:'l1_settle_click',
 land:'l1_widget_land_glass',land2:'l1_widget_land_glass_alt',tabIn:'l1_tab_expand',tabOut:'l1_tab_collapse',key:'l1_key_click',keyUp:'l1_key_release',
 tick:'l1_needle_tick',hit:'l1_hit_thunk',clank:'l1_hit_clank'};
const SYNTH={pop:'boop',popLow:'boopHi',settle:'click',tabOut:'click',tabIn:'click',key:'click',hit:'thunk',clank:'thunk'};
const RAW={},SFXV={};let sfxStarted=false;
function preloadSfx(){if(sfxStarted)return;sfxStarted=true;let ext='mp3';try{if(new Audio().canPlayType('audio/ogg; codecs="vorbis"'))ext='ogg';}catch{}
 for(const [k,f] of Object.entries(SFX))fetch(new URL('./audio/ui-l1/'+f+'.'+ext,import.meta.url)).then(r=>r.ok?r.arrayBuffer():Promise.reject(r.status)).then(ab=>{RAW[k]=ab;decodeSfx();}).catch(e=>{SFXV[k]='fail '+e;});}
function decodeSfx(){if(!AC)return;for(const k of Object.keys(RAW)){const ab=RAW[k];delete RAW[k];AC.decodeAudioData(ab).then(b=>{BUF['s_'+k]=b;SFXV[k]='ok';},e=>{SFXV[k]='decode '+e;});}}
globalThis.__l1Sfx={get state(){return{...SFXV,ctx:AC?.state||'none'};}};
function volume(){try{const v=JSON.parse(localStorage.getItem('level10.preferences.v1')||'{}').volume;return clamp((v??65)/100,0,1);}catch{return .65;}}
function audio(){if(AC)return AC.state==='running'?AC:null;try{AC=new (globalThis.AudioContext||globalThis.webkitAudioContext)();}catch{return null;}
 bus=AC.createGain();bus.gain.value=.22;const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=9000;bus.connect(lp);lp.connect(AC.destination);const sr=AC.sampleRate;
 // fallback synth: glass water-drop "boop" (sine pitch leap + faint inharmonic partial), mechanical click, low thunk
 const boop=(f0,f1,len)=>{const b=AC.createBuffer(1,Math.round(sr*len),sr),d=b.getChannelData(0);let ph=0,ph2=0;for(let i=0;i<d.length;i++){const t=i/sr,f=f1+(f0-f1)*Math.exp(-t*55)+(t<.012?-(f1-f0)*.4*(1-t/.012):0);ph+=TAU*f/sr;ph2+=TAU*f*2.76/sr;const env=Math.min(1,t/.003)*Math.exp(-t*16);d[i]=(Math.sin(ph)*.8+Math.sin(ph2)*.12*Math.exp(-t*40))*env;}return b;};
 BUF.boop=boop(420,1180,.32);BUF.boopHi=boop(560,1480,.28);
 {const b=AC.createBuffer(1,Math.round(sr*.05),sr),d=b.getChannelData(0);let p=0;for(let i=0;i<d.length;i++){const t=i/sr;p+=(Math.random()*2-1-p)*.6;d[i]=(Math.sin(t*TAU*3400)*.55+p*.5)*Math.exp(-t*520)+Math.sin(t*TAU*820)*.45*Math.exp(-t*160);}BUF.click=b;}
 {const b=AC.createBuffer(1,Math.round(sr*.18),sr),d=b.getChannelData(0);for(let i=0;i<d.length;i++){const t=i/sr;d[i]=Math.sin(TAU*(180*t-90*t*t*3))*Math.exp(-t*22)*.7;}BUF.thunk=b;}
 decodeSfx();return AC.state==='running'?AC:null;}
// play(cue): the sample if decoded, else its synth stand-in; gains are per cue (samples are peak-normalised to -1 dBFS)
const GAIN={pop:.55,popLow:.32,chime:.34,whoosh:.3,spring:.26,settle:.5,land:.22,land2:.2,tabIn:.42,tabOut:.42,key:.34,keyUp:.24,tick:.14,hit:.6,clank:.42};
const LOG=globalThis.__l1SfxLog=[];
function play(name,gain=1,rate=1,when=0){const ac=audio();const buf=BUF['s_'+name]||BUF[SYNTH[name]]||BUF[name];if(LOG.length<200)LOG.push([name,+(performance.now()/1000).toFixed(2),BUF['s_'+name]?'sample':buf?'synth':'none',!!ac]);if(!ac||!buf)return;const v=volume();if(v<=0)return;
 const s=ac.createBufferSource();s.buffer=buf;s.playbackRate.value=rate;const g=ac.createGain();g.gain.value=gain*(GAIN[name]??.5)*v*(BUF['s_'+name]?1:1.1);s.connect(g);g.connect(bus);s.start(ac.currentTime+when);}
const wake=()=>{audio();if(AC&&AC.state==='suspended')AC.resume();};addEventListener('pointerdown',wake,{passive:true});addEventListener('keydown',wake,{passive:true});


// =====================================================================================================
// V130-C · ERA ARTIFACTS — the look of a 2009 Win7 desktop / iPhone OS 3 screenshot re-saved on a forum.
// Every Level 1 instrument is rendered SMALL (≈ .78 of its CSS size) into a CPU canvas, then:
//  · a TN-LCD tone curve (lifted black, washed mids, slightly cool white),
//  · RGB565 quantisation with a 4×4 Bayer dither (16-bit banding on every gloss gradient),
//  · a short horizontal chroma smear (analogue 4:2:2 bleed),
//  · a JPEG round trip: native encoder (4:2:0 → 8×8 blocking, mosquito ringing round text, chroma bleed) for the
//    dashboard, a JS 8×8 DCT quantiser for the minimap/compass and the F map (synchronous, so no flicker),
//  · and a bilinear upscale back to device pixels — the soft "screenshot shown at the wrong size" blur.
// ?era=0 disables it (A/B); performance numbers land in globalThis.__l1Era.
// =====================================================================================================
// V142: one notch cleaner (was f .86 / q 45 / smear .42)
const ERA={on:true,cpu:false,f:1,q:70,smear:.3,stat:{}};try{const p=new URLSearchParams(location.search);if(p.get('era')==='0'||localStorage.getItem('bumpercrop.l1era')==='0')ERA.on=false;if(p.get('eraf'))ERA.f=+p.get('eraf');if(p.get('eraq'))ERA.q=+p.get('eraq');if(p.get('eracpu'))ERA.cpu=p.get('eracpu')==='1';}catch{}
globalThis.__l1Era=ERA;
const gpu=(w,h)=>{const c=document.createElement('canvas');c.width=Math.max(1,w);c.height=Math.max(1,h);return[c,c.getContext('2d')];};
const rcv=(w,h)=>ERA.cpu?cpu(w,h):gpu(w,h);
const cpu=(w,h)=>{const c=document.createElement('canvas');c.width=Math.max(1,w);c.height=Math.max(1,h);return[c,c.getContext('2d',{willReadFrequently:true})];};
const BAYER=new Float32Array([0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5].map(v=>(v/16-.47)*.62));
// TN panel tone curve: black floor ≈ 9/255, gamma .93 (mids washed out), white a touch blue
const LUTsrc=()=>{const L=[new Uint8Array(256),new Uint8Array(256),new Uint8Array(256)];for(let i=0;i<256;i++){const v=Math.pow(i/255,.95)*.97+.024;
 L[0][i]=Math.min(255,Math.round(v*251));L[1][i]=Math.min(255,Math.round(v*255));L[2][i]=Math.min(255,Math.round(v*255+3));}return L;};const LUT=LUTsrc();
const X5=new Uint8Array(32).map((_,i)=>(i<<3)|(i>>2)),X6=new Uint8Array(64).map((_,i)=>(i<<2)|(i>>4));
// tone curve + chroma smear + RGB565 dither, in place on straight RGBA (alpha untouched; transparent → black)
function eraPixels(d,w,h,smear=.3){const [LR,LG,LB]=LUT;
 for(let y=0;y<h;y++){let pcb=0,pcr=0,fresh=true;const row=(y&3)<<2;
  for(let x=0;x<w;x++){const i=(y*w+x)<<2;if(d[i+3]===0){d[i]=d[i+1]=d[i+2]=0;fresh=true;continue;}
   let r=LR[d[i]],g=LG[d[i+1]],b=LB[d[i+2]];const Y=.299*r+.587*g+.114*b;let cb=b-Y,cr=r-Y;
   if(!fresh){cb+=(pcb-cb)*smear;cr+=(pcr-cr)*smear;}pcb=cb;pcr=cr;fresh=false;
   r=Y+cr;b=Y+cb;g=(Y-.299*r-.114*b)/.587;const t=BAYER[row|(x&3)];
   d[i]=X5[Math.max(0,Math.min(31,Math.round(r/8.2258+t)))];d[i+1]=X6[Math.max(0,Math.min(63,Math.round(g/4.0476+t)))];d[i+2]=X5[Math.max(0,Math.min(31,Math.round(b/8.2258+t)))];}}}
// ---- JS baseline-JPEG quantiser (8×8 DCT, libjpeg tables, 4:2:0 chroma) ----
const DCTsrc=()=>{const c=new Float32Array(64);for(let u=0;u<8;u++)for(let x=0;x<8;x++)c[u*8+x]=(u?Math.sqrt(.25):Math.sqrt(.125))*Math.cos((2*x+1)*u*Math.PI/16);return c;};const DCT=DCTsrc();
const QL0=[16,11,10,16,24,40,51,61,12,12,14,19,26,58,60,55,14,13,16,24,40,57,69,56,14,17,22,29,51,87,80,62,18,22,37,56,68,109,103,77,24,35,55,64,81,104,113,92,49,64,78,87,103,121,120,101,72,92,95,98,112,100,103,99];
const QC0=[17,18,24,47,99,99,99,99,18,21,26,66,99,99,99,99,24,26,56,99,99,99,99,99,47,66,99,99,99,99,99,99].concat(new Array(32).fill(99));
const QT={};function qtab(q){if(QT[q])return QT[q];const s=q<50?5000/q:200-2*q,f=b=>Float32Array.from(b,v=>Math.max(1,Math.min(255,Math.floor((v*s+50)/100))));return QT[q]={L:f(QL0),C:f(QC0)};}
const _b=new Float32Array(64),_t=new Float32Array(64);
function dctPlane(p,W,H,Q){const b=_b,t=_t,C=DCT;
 for(let by=0;by<H;by+=8)for(let bx=0;bx<W;bx+=8){let mn=1e9,mx=-1e9;
  for(let y=0;y<8;y++){const o=(by+y)*W+bx;for(let x=0;x<8;x++){const v=p[o+x];b[y*8+x]=v;if(v<mn)mn=v;if(v>mx)mx=v;}}
  if(mx-mn<.5)continue;   // flat block: only DC, already exact enough
  for(let y=0;y<8;y++)for(let u=0;u<8;u++){let s=0;const cu=u*8,ry=y*8;for(let x=0;x<8;x++)s+=C[cu+x]*b[ry+x];t[ry+u]=s;}
  for(let v=0;v<8;v++)for(let u=0;u<8;u++){let s=0;const cv=v*8;for(let y=0;y<8;y++)s+=C[cv+y]*t[y*8+u];const q=Q[cv+u];b[cv+u]=Math.round(s/q)*q;}
  for(let y=0;y<8;y++)for(let u=0;u<8;u++){let s=0;for(let v=0;v<8;v++)s+=C[v*8+y]*b[v*8+u];t[y*8+u]=s;}
  for(let y=0;y<8;y++){const o=(by+y)*W+bx,ry=y*8;for(let x=0;x<8;x++){let s=0;for(let u=0;u<8;u++)s+=C[u*8+x]*t[ry+u];p[o+x]=s;}}}}
const PL={};const plane=(k,n)=>(PL[k]&&PL[k].length>=n)?PL[k]:(PL[k]=new Float32Array(n));
function jpegish(d,w,h,q=ERA.q){const W=(w+7)&~7,H=(h+7)&~7,cw=(w+1)>>1,ch=(h+1)>>1,CW=(cw+7)&~7,CH=(ch+7)&~7,T=qtab(q);
 const Yp=plane('y',W*H),Cb=plane('cb',CW*CH),Cr=plane('cr',CW*CH);
 for(let y=0;y<H;y++){const sy=Math.min(y,h-1);for(let x=0;x<W;x++){const i=(sy*w+Math.min(x,w-1))<<2;Yp[y*W+x]=.299*d[i]+.587*d[i+1]+.114*d[i+2]-128;}}
 for(let y=0;y<CH;y++)for(let x=0;x<CW;x++){let cb=0,cr=0;for(let j=0;j<2;j++)for(let k=0;k<2;k++){const sx=Math.min(x*2+k,w-1),sy=Math.min(y*2+j,h-1),i=(sy*w+sx)<<2,r=d[i],g=d[i+1],b=d[i+2];cb+=-.1687*r-.3313*g+.5*b;cr+=.5*r-.4187*g-.0813*b;}Cb[y*CW+x]=cb/4;Cr[y*CW+x]=cr/4;}
 dctPlane(Yp,W,H,T.L);dctPlane(Cb,CW,CH,T.C);dctPlane(Cr,CW,CH,T.C);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)<<2;if(d[i+3]===0)continue;const Y=Yp[y*W+x]+128,ci=(y>>1)*CW+(x>>1),cb=Cb[ci],cr=Cr[ci];
  d[i]=Y+1.402*cr;d[i+1]=Y-.34414*cb-.71414*cr;d[i+2]=Y+1.772*cb;}}
const tick=(k,t0)=>{const s=ERA.stat[k]||(ERA.stat[k]={n:0,ms:0,max:0});const dt=performance.now()-t0;s.n++;s.ms+=(dt-s.ms)*(s.n<10?1/s.n:.1);s.max=Math.max(s.max,dt);};
// ---- the pass runs in a Worker (inline Blob) so the 8×8 DCT never costs the game's main thread; main thread only does
// one small getImageData + putImageData per frame. Falls back to the same code on the main thread if Workers are refused.
let WK=null,WKid=0;const WKcb=new Map();
function worker(){if(WK!==null)return WK;try{
 const code=`const ERA={q:${ERA.q}};const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const BAYER=new Float32Array([0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5].map(v=>(v/16-.47)*.62));
const LUT=(${LUTsrc})();const X5=new Uint8Array(32).map((_,i)=>(i<<3)|(i>>2)),X6=new Uint8Array(64).map((_,i)=>(i<<2)|(i>>4));
${eraPixels.toString()}
const DCT=(${DCTsrc})();const QL0=${JSON.stringify(QL0)},QC0=${JSON.stringify(QC0)};const QT={};${qtab.toString()}
const _b=new Float32Array(64),_t=new Float32Array(64);${dctPlane.toString()}
const PL={};const plane=(k,n)=>(PL[k]&&PL[k].length>=n)?PL[k]:(PL[k]=new Float32Array(n));
${jpegish.toString()}
onmessage=e=>{const {id,buf,w,h,q,smear}=e.data,d=new Uint8ClampedArray(buf),t0=performance.now();eraPixels(d,w,h,smear);jpegish(d,w,h,q);postMessage({id,buf,ms:performance.now()-t0},[buf]);};`;
 const u=URL.createObjectURL(new Blob([code],{type:'text/javascript'}));WK=new Worker(u);
 WK.onmessage=e=>{const cb=WKcb.get(e.data.id);WKcb.delete(e.data.id);ERA.wms=e.data.ms;cb&&cb(e.data.buf);};WK.onerror=()=>{WK=false;for(const cb of WKcb.values())cb(null);WKcb.clear();};}catch{WK=false;}return WK;}
// one client per instrument: at most one frame in flight, newest pending frame replaces older ones; out = last processed frame
function eraClient(key,onFrame,q){const C={busy:false,pend:null,out:null,ox:null,tag:null,seq:0};
 const land=(d,w,h,tag)=>{if(!C.out||C.out.width!==w||C.out.height!==h){C.out=document.createElement('canvas');C.out.width=w;C.out.height=h;C.ox=C.out.getContext('2d');}
  C.ox.putImageData(new ImageData(d,w,h),0,0);C.tag=tag;C.seq++;onFrame&&onFrame(C.out,tag);};
 C.submit=(src,tag)=>{if(C.busy){C.pend=[src,tag];return;}const t0=performance.now(),w=src.width,h=src.height,id=src.getContext('2d',{willReadFrequently:true}).getImageData(0,0,w,h);tick(key+'.main',t0);
  const wk=worker();if(!wk){eraPixels(id.data,w,h);jpegish(id.data,w,h,q??ERA.q);land(id.data,w,h,tag);tick(key+'.sync',t0);return;}
  C.busy=true;const n=++WKid,t1=performance.now();WKcb.set(n,buf=>{C.busy=false;if(buf){land(new Uint8ClampedArray(buf),w,h,tag);tick(key+'.rt',t1);}
   if(C.pend){const [s,t]=C.pend;C.pend=null;C.submit(s,t);}});wk.postMessage({id:n,buf:id.data.buffer,w,h,q:q??ERA.q,smear:ERA.smear},[id.data.buffer]);};
 return C;}
const eraEvery=k=>Math.max(66,Math.min(400,(ERA.stat[k+'.main']?.ms||0)*8));
function upscale(c,img,x,y,w,h){c.save();c.imageSmoothingEnabled=true;c.imageSmoothingQuality='low';c.drawImage(img,x,y,w,h);c.restore();}
// F-map chrome (header / tools / legend are DOM): an SVG filter does the same look on the GPU — .45 px soft upscale blur,
// red/blue fringes 0.9 px apart (chroma bleed), and 5-6-5 discrete steps through the same TN tone curve (banding).
function mountEraSvg(){if(document.getElementById('l1-era-svg'))return;const st=(n)=>Array.from({length:n},(_,i)=>(Math.pow(i/(n-1),.95)*.97+.024).toFixed(4)).join(' ');
 const svg=`<svg id="l1-era-svg" width="0" height="0" style="position:absolute;width:0;height:0" aria-hidden="true"><filter id="l1-era" x="-4%" y="-25%" width="108%" height="150%" color-interpolation-filters="sRGB">
<feGaussianBlur stdDeviation="0.45" result="b"/><feColorMatrix in="b" type="matrix" values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" result="r"/><feOffset in="r" dx="0.9" result="r2"/>
<feColorMatrix in="b" type="matrix" values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0" result="g"/><feColorMatrix in="b" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0" result="bl"/><feOffset in="bl" dx="-0.5" result="b2"/>
<feBlend in="r2" in2="g" mode="screen" result="rg"/><feBlend in="rg" in2="b2" mode="screen" result="m"/>
<feComponentTransfer in="m"><feFuncR type="discrete" tableValues="${st(32)}"/><feFuncG type="discrete" tableValues="${st(64)}"/><feFuncB type="discrete" tableValues="${st(32)}"/></feComponentTransfer></filter></svg>`;
 if(ERA.on)document.body.insertAdjacentHTML('beforeend',svg);else document.documentElement.classList.add('l1-era-off');}
// =====================================================================================================
// V142-U2 · SHELL GEOMETRY (single source for the runtime AND the Blender bake)
// The castings are modelled as height fields in Blender (bc/scripts/ui142/bake_shell142.py) from the masks these
// functions draw, rendered in Cycles with a studio HDRI as polished chrome, and composited as one image per shell.
// pieces = the casting outline · cuts = recesses machined into it (wells, lens sockets, slots) · each cut gets a
// raised bezel lip in the bake. Coordinates are the shells' own user units (dash 760×316, nav 400×214).
// =====================================================================================================
// a tapered tentacle / prong: from a fat root to a sharp tip along a quadratic curve, ends in a small bead
function prong142(g,x0,y0,cx,cy,x1,y1,w0,w1=1.6,bead=0){const N=28,L=[],Rt=[];
 for(let i=0;i<=N;i++){const t=i/N,u=1-t,x=u*u*x0+2*u*t*cx+t*t*x1,y=u*u*y0+2*u*t*cy+t*t*y1,dx=2*u*(cx-x0)+2*t*(x1-cx),dy=2*u*(cy-y0)+2*t*(y1-cy),l=Math.hypot(dx,dy)||1,
  w=(w0*(1-Math.pow(t,.8))+w1*Math.pow(t,.8))/2,nx=-dy/l*w,ny=dx/l*w;L.push([x+nx,y+ny]);Rt.push([x-nx,y-ny]);}
 g.beginPath();g.moveTo(...L[0]);for(const p of L)g.lineTo(...p);for(let i=Rt.length-1;i>=0;i--)g.lineTo(...Rt[i]);g.closePath();g.fill();
 if(bead){g.beginPath();g.arc(x1,y1,bead,0,TAU);g.fill();}}
const SH142={
 dash:{W:760,H:316,edges:'lb',
  GA:{x:126,y:188,R:110},SUB:{x:262,y:72,R:40},RAD:{x:610,y:172,R:48},TUB:{x:708,y:74,w:24,h:196},
  BAT:{x:311,y:133,w:98,h:48,r:16},NUM:{x:418,y:128,w:110,h:58,r:22},SIGP:{x:388,y:190,w:46,h:42,r:13},ALM:{x:476,y:211,R:23},
  bars:i=>{const bh=8+i*8.2,X=318+i*13,Y=229-bh;return{x:X-2,y:Y-2,w:14,h:bh+4,r:4};},
  pieces(g){const F=()=>g.fill(),d=SH142.dash,{GA,SUB,RAD}=d;
   g.beginPath();g.arc(GA.x,GA.y,GA.R+20,0,TAU);F();                       // speedometer pod
   g.beginPath();g.arc(SUB.x,SUB.y,SUB.R+11,0,TAU);F();                    // m/s sub-pod
   g.beginPath();g.moveTo(150,74);g.bezierCurveTo(190,40,230,60,232,96);g.bezierCurveTo(250,110,262,130,240,160);g.lineTo(180,160);g.closePath();F();
   rr(g,226,98,466,190,58);F();                                            // visor spine
   g.beginPath();g.arc(RAD.x,RAD.y,RAD.R+18,0,TAU);F();                    // radar pod
   rr(g,688,50,64,280,32);F();                                             // hydration capsule pod
   g.beginPath();g.moveTo(-40,232);g.lineTo(700,232);g.lineTo(700,d.H+40);g.lineTo(-40,d.H+40);g.closePath();F();
   g.beginPath();g.moveTo(-40,120);g.lineTo(40,120);g.lineTo(40,d.H+40);g.lineTo(-40,d.H+40);g.closePath();F();
   g.beginPath();g.moveTo(740,236);g.bezierCurveTo(756,262,760,296,d.W+40,d.H+40);g.lineTo(720,d.H+40);g.closePath();F();
   // U2 ①: tentacle supports (after the reference's leaf-pod prongs) and a streamlined fin over the water tube
   prong142(g,300,92,350,58,452,46,30,2.2,4);                              // sub-pod prong sweeping right over the spine
   prong142(g,262,40,232,14,176,10,20,1.8,3.2);                            // sub-pod antenna, back over the gauge
   prong142(g,560,112,600,76,676,58,26,2,3.5);                             // radar-pod prong toward the tube fin
   g.beginPath();g.moveTo(690,96);g.bezierCurveTo(690,40,700,20,742,6);g.bezierCurveTo(726,30,752,40,752,96);g.closePath();F();   // tube fin
   prong142(g,64,96,50,40,18,10,26,2,3.4);                                 // gauge antenna up the left edge
  },
  cuts(g){const F=()=>g.fill(),d=SH142.dash;
   for(const c of [d.GA,d.SUB,d.RAD]){g.beginPath();g.arc(c.x,c.y,c===d.GA?c.R:c.R+(c===d.SUB?1:3),0,TAU);F();}
   for(const b of [d.BAT,d.NUM,d.SIGP]){rr(g,b.x,b.y,b.w,b.h,b.r);F();}
   for(let i=0;i<5;i++){const b=d.bars(i);rr(g,b.x,b.y,b.w,b.h,b.r);F();}
   g.beginPath();g.arc(d.ALM.x,d.ALM.y,d.ALM.R,0,TAU);F();
   const T=d.TUB;rr(g,T.x-8,T.y-8,T.w+16,T.h+16,(T.w+16)/2);F();},
  // domes the bake adds on top of the rolled profile: [x,y,R,height]  (ellipses: [x,y,rx,ry,height])
  domes:[[126,188,130,34],[262,72,51,18],[610,172,66,22],[720,190,32,150,14],[454,190,250,96,10],[300,300,420,60,6]]},
 nav:{W:400,H:250,edges:'tr',
  MAPL:{x:18,y:22,w:222,h:170,r:34},CC:{x:318,y:94,R:70},
  pieces(g){const F=()=>g.fill(),{W,CC}=SH142.nav;
   g.beginPath();g.moveTo(-4,-40);g.lineTo(W+40,-40);g.lineTo(W+40,30);g.lineTo(96,30);g.bezierCurveTo(46,30,18,20,-4,-4);g.closePath();F();
   rr(g,4,-40,258,244,48);F();
   g.beginPath();g.arc(CC.x,CC.y,CC.R+12,0,TAU);F();
   g.beginPath();g.rect(CC.x,-40,W-CC.x+40,CC.y+40);F();
   g.beginPath();g.rect(CC.x,CC.y-4,W-CC.x+40,40);F();
   rr(g,CC.x-58,CC.y+CC.R-6,116,40,20);F();
   g.beginPath();g.moveTo(250,30);g.bezierCurveTo(268,70,266,130,250,182);g.lineTo(CC.x-44,CC.y+CC.R+12);g.bezierCurveTo(CC.x-74,150,CC.x-84,70,CC.x-62,24);g.closePath();F();
   // U2 ①: the compass pod grows two prongs, like the reference's leaf pod
   prong142(g,CC.x-46,CC.y+62,CC.x-70,CC.y+130,CC.x-128,244,22,1.8,3.4);
   prong142(g,CC.x+56,CC.y+56,CC.x+80,CC.y+100,CC.x+72,246,20,1.8,3);
  },
  cuts(g){const F=()=>g.fill(),{MAPL:m,CC}=SH142.nav;rr(g,m.x,m.y,m.w,m.h,m.r);F();g.beginPath();g.arc(CC.x,CC.y,CC.R+1,0,TAU);F();rr(g,CC.x-48,CC.y+CC.R+3,96,26,13);F();},
  domes:[[318,94,82,14],[132,96,150,110,12],[200,8,220,22,5]]}};
// =====================================================================================================
// V142 · BRUSHED-CHROME STREAMLINED SHELLS (after the user's "世纪重塑电子系统" reference, minus the green)
// A shell is the union of rounded pieces (pods, capsules, tails) filled into one mask, so every instrument sits in
// ONE continuous casting instead of a box in a box. The casting runs off the screen edge it is anchored to.
// Body = generated brushed-steel plate (ui-v142) · chrome horizon bands · pillow shading per pod · anisotropic
// glints along the brushing · a rolled bevel made from the mask shifted against itself (sharp + soft, light and dark).
// Lenses are cut INTO the body as recesses (inner shadow + machined lip) and get one polished bezel in front.
// =====================================================================================================
function mask142(w,h,s,pieces){const [m,g]=gpu(w,h);g.setTransform(s,0,0,s,0,0);g.fillStyle='#fff';pieces(g);return m;}
function edge142(dst,m,dx,dy,col,blur,alpha,s){const w=m.width,h=m.height,[e,g]=gpu(w,h);g.drawImage(m,0,0);g.globalCompositeOperation='destination-out';g.drawImage(m,dx*s,dy*s);
 g.globalCompositeOperation='source-in';g.fillStyle=col;g.fillRect(0,0,w,h);dst.save();dst.setTransform(1,0,0,1,0,0);dst.globalAlpha=alpha;if(blur)dst.filter=`blur(${(blur*s).toFixed(2)}px)`;dst.drawImage(e,0,0);dst.restore();}
// draws the casting onto c (whose transform is user units × s); returns the mask for later clipping
function shell142(c,W,s,pieces,{tex,baked,y0=0,y1=300,pods=[],glints=[],shadow=[0,6,16]}={}){
 const w=c.canvas.width,h=c.canvas.height;
 // V142-U2: the casting is a Cycles render of the real 3D shell (bc/scripts/ui142) — drawn whole, shadow from its alpha
 if(ok(baked)){const Hh=W*baked.naturalHeight/baked.naturalWidth;c.save();c.setTransform(1,0,0,1,0,0);c.globalAlpha=1;
  if(shadow){c.save();c.shadowColor='#000000c0';c.shadowOffsetX=shadow[0]*s;c.shadowOffsetY=shadow[1]*s;c.shadowBlur=shadow[2]*s;c.drawImage(baked,0,0,W*s,Hh*s);c.restore();}
  c.drawImage(baked,0,0,W*s,Hh*s);c.restore();return null;}
 const m=mask142(w,h,s,pieces);
 const [b,g]=gpu(w,h);g.setTransform(s,0,0,s,0,0);const Hh=h/s;
 if(ok(tex)){const th=W*tex.naturalHeight/tex.naturalWidth;for(let y=-2;y<Hh+th;y+=th-1)g.drawImage(tex,0,y,W,th);}else{g.fillStyle='#959ca3';g.fillRect(0,0,W,Hh);}
 // cool steel tone (multiply), then the chrome horizon as an overlay: sky on the crown, a deep dark band, a bright
 // floor reflection, a dark foot — the high-contrast banding that reads as polished chrome rather than grey plastic
 g.globalCompositeOperation='multiply';g.fillStyle='#8c97a3';g.fillRect(0,0,W,Hh);
 g.globalCompositeOperation='overlay';
 g.fillStyle=lg(g,0,y0,0,y1,[[0,'#ffffff'],[.08,'#f0f4f8'],[.2,'#9aa4ad'],[.34,'#2a3138'],[.44,'#1a1f24'],[.52,'#c8d0d8'],[.6,'#ffffff'],[.7,'#8e98a2'],[.85,'#4a525a'],[1,'#1e2328']]);g.fillRect(0,0,W,Hh);
 // each pod is a pillow: lit up-left, rolling into shadow at its rim; collars get a turned conic sheen
 g.globalCompositeOperation='overlay';
 for(const p of pods){const {x,y,R}=p;g.fillStyle=rg(g,x-R*.3,y-R*.45,R*.04,x,y,R,[[0,'#ffffffd0'],[.4,'#ffffff40'],[.7,'#80808000'],[.88,'#00000070'],[1,'#000000c0']]);g.beginPath();g.arc(x,y,R,0,TAU);g.fill();
  if(p.conic&&g.createConicGradient){const cg=g.createConicGradient(-Math.PI/2,x,y);for(const [o,col] of [[0,'#ffffffb0'],[.13,'#00000090'],[.25,'#ffffffa0'],[.4,'#000000a0'],[.52,'#ffffff80'],[.64,'#ffffffc0'],[.77,'#00000090'],[.9,'#ffffff70'],[1,'#ffffffb0']])cg.addColorStop(o,col);
   g.fillStyle=cg;g.beginPath();g.arc(x,y,R,0,TAU);g.arc(x,y,p.conic,0,TAU,true);g.fill('evenodd');}}
 // anisotropic glints: long thin streaks of light running along the brushing
 g.globalCompositeOperation='screen';
 for(const [x,y,len,th,a] of glints){g.save();g.translate(x,y);g.scale(len/th,1);g.fillStyle=rg(g,0,0,0,0,0,th,[[0,`rgba(255,255,255,${a})`],[.35,`rgba(220,236,255,${a*.45})`],[1,'#00000000']]);g.beginPath();g.arc(0,0,th,0,TAU);g.fill();g.restore();}
 g.globalCompositeOperation='destination-in';g.setTransform(1,0,0,1,0,0);g.drawImage(m,0,0);g.globalCompositeOperation='source-atop';
 // rolled bevel: sharp + soft rim light (up-left), sharp + soft core shadow (down-right)
 edge142(g,m,3,4,'#ffffff',.9,.95,s);edge142(g,m,9,11,'#f4f8ff',5,.42,s);edge142(g,m,-3,-4,'#0a0d10',.9,.75,s);edge142(g,m,-10,-12,'#000000',6,.45,s);
 c.save();c.setTransform(1,0,0,1,0,0);
 if(shadow){c.save();c.shadowColor='#000000b8';c.shadowOffsetX=shadow[0]*s;c.shadowOffsetY=shadow[1]*s;c.shadowBlur=shadow[2]*s;c.drawImage(m,0,0);c.restore();
  c.save();c.shadowColor='#000000d0';c.shadowBlur=2.5*s;c.shadowOffsetY=1*s;c.drawImage(m,0,0);c.restore();}
 c.drawImage(b,0,0);c.restore();return m;}
// a lens/slot sunk into the casting: dark well, inner shadow from the upper lip, bright lower lip
function socket142(c,path,y0,y1,{deep='#030506',mid='#0d1217',bot='#1d252c',blur=10}={}){
 c.save();path(c);c.clip();c.fillStyle=lg(c,0,y0,0,y1,[[0,deep],[.55,mid],[1,bot]]);c.fillRect(-9999,-9999,19999,19999);
 c.shadowColor='#000';c.shadowBlur=blur;c.shadowOffsetY=blur*.5;c.lineWidth=blur*1.6;c.strokeStyle='#000';path(c);c.stroke();c.restore();
 c.save();path(c);c.lineWidth=2.2;c.strokeStyle=lg(c,0,y0,0,y1,[[0,'#00000000'],[.4,'#00000000'],[.75,'#ffffff40'],[1,'#ffffffd0']]);c.stroke();
 path(c);c.lineWidth=1.2;c.strokeStyle=lg(c,0,y0,0,y1,[[0,'#000000d0'],[.5,'#00000030'],[1,'#00000000']]);c.stroke();c.restore();}
// one polished bezel line round a lens (front layer), plus a soft glass gloss inside it
function bezel142(c,path,y0,y1,t=3.2){c.save();path(c);c.lineWidth=t;c.strokeStyle=lg(c,0,y0-t,0,y1+t,[[0,'#ffffff'],[.12,'#cfd6dc'],[.42,'#5d666e'],[.52,'#f4f7f9'],[.8,'#7e868d'],[1,'#e6eaee']]);c.stroke();
 path(c);c.lineWidth=.8;c.strokeStyle='#00000080';c.stroke();c.restore();}
function gloss142(c,path,x0,y0,x1,y1,a=.26){c.save();path(c);c.clip();
 c.fillStyle=lg(c,0,y0,0,y0+(y1-y0)*.55,[[0,`rgba(255,255,255,${a})`],[1,'#ffffff00']]);c.beginPath();c.ellipse((x0+x1)/2,y0+(y1-y0)*.08,(x1-x0)*.62,(y1-y0)*.42,0,0,TAU);c.fill();
 c.fillStyle=lg(c,0,y1-(y1-y0)*.25,0,y1,[[0,'#ffffff00'],[1,`rgba(170,215,255,${a*.35})`]]);c.fillRect(x0,y1-(y1-y0)*.25,x1-x0,(y1-y0)*.25);c.restore();}
// small chrome rivet / dome screw head
function rivet142(c,x,y,r){c.save();c.shadowColor='#000000a0';c.shadowBlur=r*.9;c.shadowOffsetX=r*.2;c.shadowOffsetY=r*.45;c.fillStyle=rg(c,x-r*.35,y-r*.4,r*.1,x,y,r,[[0,'#ffffff'],[.4,'#c4cbd1'],[.8,'#5a636b'],[1,'#2b3136']]);c.beginPath();c.arc(x,y,r,0,TAU);c.fill();c.restore();
 c.strokeStyle='#00000055';c.lineWidth=.7;c.beginPath();c.arc(x,y,r+.8,0,TAU);c.stroke();}
// indicator lamp in a chrome cup: amber or ice blue, lit or dim
function lamp142(c,x,y,r,col,on=1){rivet142(c,x,y,r+1.6);c.save();c.fillStyle=rg(c,x-r*.3,y-r*.35,r*.05,x,y,r,[[0,'#ffffff'],[.3,col],[1,'#05080a']]);c.globalAlpha=.35+.65*on;c.shadowColor=col;c.shadowBlur=on*r*2.4;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();c.restore();
 c.fillStyle='#ffffffd0';c.beginPath();c.ellipse(x-r*.35,y-r*.42,r*.32,r*.16,-.6,0,TAU);c.fill();}
// machined vent grille: a row of capsule slots
function grille142(c,x,y,n,gap,w,h){for(let i=0;i<n;i++){const X=x+i*gap;c.save();rr(c,X,y,w,h,w/2);c.fillStyle=lg(c,0,y,0,y+h,[[0,'#020304'],[1,'#1b2228']]);c.fill();c.restore();
 rr(c,X-.5,y-.5,w+1,h+1,w/2+.5);c.lineWidth=1;c.strokeStyle=lg(c,0,y,0,y+h,[[0,'#00000090'],[.6,'#00000000'],[1,'#ffffffc0']]);c.stroke();}}
// engraved into light metal: dark cut with a light lower lip
function etch142(c,s,x,y,font,align='center'){text(c,s,x,y-1,font,'#000000c8',null,align);text(c,s,x+.5,y+1,font,'#00000070',null,align);text(c,s,x,y,font,'#eef3f7',null,align);}
// =====================================================================================================
// NAVIGATION CLUSTER (minimap acrylic sign + liquid ball compass), painted by map-ui into .map-mini-dom
// V116: a real 3/8" cast-acrylic directory plate: back-printed sheet seen through the clear border,
// polished green-glowing edges with visible thickness, stainless standoff barrels seen through the plate,
// shadow of the opaque print and of the clear plate on the wall, fluorescent-tube reflections that slide
// with the view (parallax against the print), and dust / fingerprints in the reflections.
// =====================================================================================================
export const NAV_W=400,NAV_H=250;   // V142-U2: +36 below for the compass pod's prongs
const MAPL=SH142.nav.MAPL;
const CC={x:318,y:94,R:70};
const WIN=CC.R*130/192;
let navCache=null,NAVFK=1;
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
// V142: the minimap and compass live in ONE chrome casting hung from the top edge and running off the right edge:
// a tapered top rail, a rounded visor pod holding the map lens, the compass pod, and a pill for the heading readout.
// The old acrylic plate (standoffs, green edges, "P1 LEVEL 1 · PARKING DIRECTORY" header strip) is gone.
const LENS=(c)=>rr(c,MAPL.x,MAPL.y,MAPL.w,MAPL.h,MAPL.r);
const navPieces=g=>SH142.nav.pieces(g);   // V142-U2: outline lives in shape142.js (shared with the bake)
function navStatic(w,h,k){
 const [back]=rcv(1,1),[front]=rcv(1,1);back.width=front.width=w;back.height=front.height=h;
 const b=back.getContext('2d'),f=front.getContext('2d');for(const c of [b,f])c.setTransform(k,0,0,k,0,0);
 FK=NAVFK/k;const {x,y,w:W,h:H,r}=MAPL,fh=17;
 shell142(b,NAV_W,k,navPieces,{baked:IMG.shellNav,tex:IMG.chromeNav,y0:-10,y1:208,pods:[{x:CC.x,y:CC.y,R:CC.R+12,conic:CC.R+1},{x:132,y:96,R:150}],
  glints:[[150,8,120,2.2,.55],[300,12,80,1.6,.4],[40,196,46,1.4,.35],[CC.x+26,CC.y+CC.R+14,40,1.3,.4]],shadow:[-3,7,16]});
 // the map lens, cut into the visor
 socket142(b,LENS,y,y+H,{blur:8});
 b.save();LENS(b);b.clip();b.fillStyle='#f3f4f0';b.fillRect(x+3,y+3,W-6,H-6);
 // YOU ARE HERE strip printed along the bottom of the sheet (kept; only the header strip went)
 const fy=y+H-fh-3;b.fillStyle='#e6e8e3';b.fillRect(x,fy,W,fh+4);b.fillStyle='#c9cdc7';b.fillRect(x,fy,W,1);
 b.fillStyle='#d7261e';b.beginPath();b.arc(x+30,fy+8.5,4.2,0,TAU);b.fill();b.strokeStyle='#fff';b.lineWidth=1.2;b.stroke();
 text(b,'YOU ARE HERE',x+39,fy+9,f12(),'#c3201a',null,'left');text(b,'M 全图',x+W-26,fy+9,f12(),'#30353b',null,'right');
 b.restore();
 // compass seat and the heading pill window
 b.save();b.beginPath();b.arc(CC.x,CC.y,CC.R+1,0,TAU);b.fillStyle='#0a0c0e';b.fill();b.restore();
 socket142(b,c=>rr(c,CC.x-48,CC.y+CC.R+3,96,26,13),CC.y+CC.R+3,CC.y+CC.R+29,{blur:5});
 // rail details: lamps, a vent grille, an etched maker's mark
 lamp142(b,176,13,2.4,'#ffb838',1);lamp142(b,189,13,2.4,'#6fc8ff',.85);lamp142(b,202,13,2.4,'#6fc8ff',.3);
 grille142(b,64,6,7,6.5,3,12);
 // ---- front: glass over the map, one polished bezel, rivets ----
 gloss142(f,LENS,x,y,x+W,y+H,.3);
 if(ok(IMG.dust)){f.save();LENS(f);f.clip();f.globalCompositeOperation='screen';f.globalAlpha=.18;f.drawImage(IMG.dust,x-20,y-8,W+40,(W+40)*IMG.dust.naturalHeight/IMG.dust.naturalWidth);f.restore();}
 if(!ok(IMG.shellNav))bezel142(f,LENS,y,y+H,3.4);
 for(const [rx,ry] of [[10,182],[256,150],[CC.x+CC.R+4,CC.y+56]])rivet142(f,rx,ry,3.2);
 return{back,front,map:{x:x+3,y:y+3,w:W-6,h:H-fh-9,r:r-3}};
}
// fluorescent-tube reflections on the map glass slide with the view yaw (parallax against the print)
function reflections(c,yaw){const {x,y,w:W,h:Hh}=MAPL;c.save();LENS(c);c.clip();
 const o=((yaw/TAU)%1+1)%1,span=W*2.6;
 for(const [ph,wd,a] of [[0,7,.24],[.07,3,.18],[.5,9,.18],[.56,3,.12]]){const cx0=x-W*.3+((o+ph)%1)*span-span*.35;
  c.save();c.translate(cx0,y);c.transform(1,0,-.55,1,0,0);c.fillStyle=lg(c,0,0,wd,0,[[0,'#ffffff00'],[.5,`rgba(255,255,255,${a})`],[1,'#ffffff00']]);c.fillRect(0,0,wd,Hh);c.restore();}
 c.restore();}
function drawBall(c,cx,cy){
 const Rb=WIN*.98,hd=ball.h||0;
 c.save();c.beginPath();c.arc(cx,cy,WIN,0,TAU);c.clip();
 // fluid behind the ball
 c.fillStyle=rg(c,cx,cy-WIN*.3,2,cx,cy,WIN,[[0,'#232b33'],[1,'#030507']]);c.fillRect(cx-WIN,cy-WIN,WIN*2,WIN*2);
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
  if(big){const card=big.length===1;c.font=`bold ${card?19:11}px ${SIGN}`;c.textAlign='center';c.textBaseline='middle';c.fillStyle=big==='N'?'#c8231b':'#1d1d1b';c.fillText(__bcT(big),0,0);}
  else{c.font=`bold 9px ${SIGN}`;c.textAlign='center';c.textBaseline='middle';c.fillStyle='#2a2a28';c.fillText(__bcT(String(d/10|0)),0,0);}c.restore();}
 c.globalAlpha=1;
 // spherical shading over the print
 c.fillStyle=rg(c,-Rb*.25,-Rb*.3,Rb*.2,0,0,Rb,[[0,'#ffffff00'],[.62,'#00000000'],[.88,'#0000004a'],[1,'#000000b0']]);c.beginPath();c.arc(0,0,Rb,0,TAU);c.fill();
 c.restore();
 // floating bubble in the fluid (drifts against the slosh)
 const bx=cx-ball.roll*WIN*1.4+ball.rv*1.2,by=cy-WIN*.78+Math.abs(ball.roll)*6;c.fillStyle=rg(c,bx-1.5,by-1.5,.5,bx,by,5,[[0,'#ffffffd0'],[.6,'#d8f0e840'],[1,'#ffffff00']]);c.beginPath();c.ellipse(bx,by,6,3.2,0,0,TAU);c.fill();c.strokeStyle='#ffffff60';c.lineWidth=.6;c.stroke();
 // fixed lubber line on the inner glass
 c.save();c.shadowColor='#0009';c.shadowBlur=2;c.shadowOffsetX=1;c.fillStyle='#ff5a1ec8';c.fillRect(cx-.7,cy-WIN*.62,1.4,WIN*1.25);c.beginPath();c.moveTo(cx,cy-WIN*.62+6);c.lineTo(cx-4,cy-WIN*.62-1);c.lineTo(cx+4,cy-WIN*.62-1);c.closePath();c.fill();c.restore();
 // fluid tint + glass dome reflections
 c.fillStyle='#1f4a6b14';c.fillRect(cx-WIN,cy-WIN,WIN*2,WIN*2);
 c.fillStyle=rg(c,cx,cy,WIN*.7,cx,cy,WIN,[[0,'#00000000'],[1,'#000000a0']]);c.fillRect(cx-WIN,cy-WIN,WIN*2,WIN*2);
 c.fillStyle=lg(c,0,cy-WIN,0,cy-WIN*.05,[[0,'#ffffffb8'],[.55,'#ffffff30'],[1,'#ffffff00']]);c.beginPath();c.ellipse(cx,cy-WIN*.46,WIN*.84,WIN*.5,0,0,TAU);c.fill();
 c.fillStyle=lg(c,0,cy+WIN*.55,0,cy+WIN,[[0,'#ffffff00'],[1,'#bfe0f540']]);c.beginPath();c.ellipse(cx,cy+WIN*.82,WIN*.7,WIN*.22,0,0,TAU);c.fill();
 c.restore();
}
function paintNavRaw(c,rect,map,yaw,bearing){loadImages();
 const w=Math.round(rect.width),h=Math.round(rect.height),k=Math.min(w/NAV_W,h/NAV_H),ox=rect.left+(w-NAV_W*k)/2,oy=rect.top+(h-NAV_H*k)/2;
 const key=w+'x'+h+'/'+imgGen;if(!navCache||navCache.key!==key)navCache={...navStatic(Math.ceil(NAV_W*k),Math.ceil(NAV_H*k),k),key};
 const hdg=wrap(-yaw);stepBall(hdg);FK=NAVFK/k;
 c.save();c.setTransform(1,0,0,1,0,0);c.drawImage(navCache.back,ox,oy);c.translate(ox,oy);c.scale(k,k);
 // ---- back-printed minimap (north-up, centred on you) ----
 const M=navCache.map;c.save();LENS(c);c.clip();c.beginPath();c.rect(M.x,M.y,M.w,M.h);c.clip();
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
 // V142: the stainless arm is gone; the compass sits in its pod of the shared casting
 c.save();c.shadowColor='#000000b0';c.shadowBlur=14;c.shadowOffsetX=4;c.shadowOffsetY=8;c.fillStyle='#111';c.beginPath();c.arc(CC.x,CC.y,CC.R-2,0,TAU);c.fill();c.restore();
 drawBall(c,CC.x,CC.y);
 if(ok(IMG['compass-ring']))c.drawImage(IMG['compass-ring'],CC.x-CC.R,CC.y-CC.R,CC.R*2,CC.R*2);
 else{c.strokeStyle='#ccc';c.lineWidth=CC.R-WIN;c.beginPath();c.arc(CC.x,CC.y,(CC.R+WIN)/2,0,TAU);c.stroke();}
 // heading plate under the compass: 3D block numerals
 const deg=Math.round(((hdg*180/Math.PI)%360+360)%360)%360,dir=['N','NE','E','SE','S','SW','W','NW'][Math.round(deg/45)%8];
 const py=CC.y+CC.R+3,ph2=26;
 text3d(c,String(deg).padStart(3,'0')+'°',CC.x-6,py+ph2/2,`${(16*FK).toFixed(2)}px ${PX16}`,{align:'right',top:'#eaf6ff',bot:'#8fb8d8',line:'#28445c'});text3d(c,dir,CC.x+8,py+ph2/2,f16(),{align:'left',top:'#ffe58a',bot:'#d9a52c',line:'#6b5418'});
 c.fillStyle=lg(c,0,py,0,py+10,[[0,'#ffffff30'],[1,'#ffffff00']]);rr(c,CC.x-46,py+1.5,92,9,5);c.fill();
 c.restore();
 return Math.abs(ball.v)>.004||Math.abs(wrap(hdg-ball.h))>.003||Math.abs(ball.tv)>.004||Math.abs(ball.rv)>.004||Math.abs(ball.tilt)>.002||Math.abs(ball.roll)>.002;
}
// V130-C: the nav cluster is painted small into a CPU canvas and sent through the era pass (worker). map-ui's canvas shows
// the newest processed frame; when a newer one lands it is drawn straight into that canvas (only while Level 1 still owns it).
let navLo=null,navLx=null,navT=null;
const navEra=eraClient('nav',out=>{const t=navT;if(!t||!isL1()||performance.now()-t.at>1500)return;const cv=t.c.canvas;if(cv.width!==t.cw||cv.height!==t.ch)return;
 t.c.save();t.c.setTransform(1,0,0,1,0,0);t.c.clearRect(t.r.left,t.r.top,t.r.width,t.r.height);upscale(t.c,out,t.r.left,t.r.top,t.r.width,t.r.height);t.c.restore();},56);
let navAt=0;
export function paintL1Nav(c,rect,map,yaw,bearing){if(!ERA.on)return paintNavRaw(c,rect,map,yaw,bearing);
 const now=performance.now();if(navEra.out&&now-navAt<Math.max(100,eraEvery('nav'))){c.save();c.setTransform(1,0,0,1,0,0);upscale(c,navEra.out,rect.left,rect.top,rect.width,rect.height);c.restore();return true;}navAt=now;
 const dpr=Math.min(2,devicePixelRatio||1),f=Math.min(1,ERA.f*1.1)/dpr,w=Math.max(8,Math.round(rect.width*f)),h=Math.max(8,Math.round(rect.height*f));
 if(!navLo||navLo.width!==w||navLo.height!==h){[navLo,navLx]=rcv(w,h);navCache=null;}
 navLx.setTransform(1,0,0,1,0,0);navLx.clearRect(0,0,w,h);NAVFK=f;const anim=paintNavRaw(navLx,{left:0,top:0,width:w,height:h},map,yaw,bearing);NAVFK=1;
 navT={c,r:{...rect},cw:c.canvas.width,ch:c.canvas.height,at:performance.now()};navEra.submit(navLo);
 const src=navEra.out&&navEra.out.width===w&&navEra.out.height===h?navEra.out:navLo;c.save();c.setTransform(1,0,0,1,0,0);upscale(c,src,rect.left,rect.top,rect.width,rect.height);c.restore();return anim;}
// V130-C: the F map is re-shot through the same pass after map-ui paints it (this marker is the last map content it draws).
// If the map underneath is unchanged (only the hover cross moved) the last processed shot is reused at once; otherwise the
// clean paint shows for a frame or two until the worker's shot lands.
let fmLo=null,fmLx=null,fmTiny=null,fmTx=null,fmKey='',fmJob='',fmCv=null;
const fmEra=eraClient('fmap',(out,tag)=>{const cv=fmCv;if(!cv||!cv.isConnected||!isL1()||tag!==fmJob||cv.width!==tag.split('/')[0]*1)return;const c=cv.getContext('2d');
 c.save();c.setTransform(1,0,0,1,0,0);c.globalCompositeOperation='copy';upscale(c,out,0,0,cv.width,cv.height);c.restore();});
function eraFullMap(c){const cv=c.canvas,W=cv.width,H=cv.height;if(W<16||H<16)return;const w=Math.round(W*.74),h=Math.round(H*.74);
 if(!fmTiny)[fmTiny,fmTx]=cpu(40,28);fmTx.globalCompositeOperation='copy';fmTx.drawImage(cv,0,0,40,28);const td=fmTx.getImageData(0,0,40,28).data;let hs=2166136261;for(let i=0;i<td.length;i+=2)hs=Math.imul(hs^td[i],16777619);
 const key=W+'/'+H+'/'+(hs>>>0);fmCv=cv;
 if(key===fmKey&&fmEra.out&&fmEra.tag===key){c.save();c.setTransform(1,0,0,1,0,0);c.globalCompositeOperation='copy';upscale(c,fmEra.out,0,0,W,H);c.restore();return;}
 if(!fmLo||fmLo.width!==w||fmLo.height!==h)[fmLo,fmLx]=cpu(w,h);
 fmLx.setTransform(1,0,0,1,0,0);fmLx.imageSmoothingEnabled=true;fmLx.imageSmoothingQuality='medium';fmLx.globalCompositeOperation='copy';fmLx.drawImage(cv,0,0,w,h);fmLx.globalCompositeOperation='source-over';
 fmKey=key;fmJob=key;fmEra.submit(fmLo,key);}
// full-map "YOU ARE HERE" marker
export function l1MapPlayer(c,x,z,yaw,big){l1MapPlayerRaw(c,x,z,yaw,big);if(big&&ERA.on)eraFullMap(c);}
function l1MapPlayerRaw(c,x,z,yaw,big){const s=big?1.5:1;c.save();c.translate(x,z);
 c.fillStyle='#d7261e30';c.beginPath();c.arc(0,0,16*s,0,TAU);c.fill();
 c.save();c.rotate(-yaw);c.fillStyle='#d7261e';c.strokeStyle='#fff';c.lineWidth=2;c.beginPath();c.moveTo(0,-17*s);c.lineTo(7*s,0);c.lineTo(-7*s,0);c.closePath();c.fill();c.stroke();c.restore();
 c.fillStyle='#d7261e';c.beginPath();c.arc(0,0,7*s,0,TAU);c.fill();c.strokeStyle='#fff';c.lineWidth=2.5;c.stroke();
 if(big){c.font=`bold 13px ${SIGN}`;c.textBaseline='middle';const t='YOU ARE HERE',tw=c.measureText(__bcT(t)).width;c.fillStyle='#d7261e';rr(c,14*s,-10,tw+14,20,10);c.fill();c.fillStyle='#fff';c.textAlign='left';c.fillText(__bcT(t),14*s+7,.5);}
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
// V149: the cluster's type is iPhone OS 1–3 system type — Helvetica (Arimo, metric-compatible, OFL) + STHeiti-style
// 黑体 (Noto Sans SC subset, OFL); smooth anti-aliased, no bitmap font, no stepped extrusion. Sizes are in cluster
// units, floored at a legible on-screen size when the cluster is scaled down.
const IOS149="BC149Sans,BC149Hei,'Helvetica Neue',Helvetica,Arial,'PingFang SC','Microsoft YaHei',sans-serif";
let K149=1;const fI=(u,w=700,min=9)=>`${w} ${Math.max(u,min/K149).toFixed(2)}px ${IOS149}`;
// iPhone-OS-style label: vertical sheen fill, 1px dark drop under it (engraved on chrome / printed on glass)
function ios149(c,s,x,y,font,{align='center',top='#ffffff',bot='#cfd8df',shadow='#000000b0',sy=1,glow=null}={}){c.save();c.font=font;c.textAlign=align;c.textBaseline='middle';
 const fs=parseFloat(font.split(' ')[1])||12;if(shadow){c.fillStyle=shadow;c.fillText(__bcT(s),x,y+sy);}
 if(glow){c.shadowColor=glow;c.shadowBlur=fs*.35;}c.fillStyle=lg(c,0,y-fs*.5,0,y+fs*.5,[[0,top],[1,bot]]);c.fillText(__bcT(s),x,y);c.restore();}
const etch149=(c,s,x,y,u,align='center')=>ios149(c,s,x,y,fI(u),{align,top:'#ffffff',bot:'#e6ecf1',shadow:'#000000c8'});
const HO={cx:144,cy:180,R:96,top:96,x0:48,x1:716,y1:302,rc:30};   // V117: housing inset — gauges overhang its edge   // housing geometry
// V142 geometry: the casting is anchored to the bottom-left screen corner (canvas x=0 / y=DH are the screen edges)
const GA={x:126,y:188,R:110},SUB={x:262,y:72,R:40},VIS={x:288,y:120,w:252,h:118,r:40},MID={x:312,y:124,w:208,h:56,r:6},
 RAD={x:610,y:172,R:48},SIG={x:314,y:186,w:112,h:46},ICO={x:456,y:191,s:40},TUB={x:708,y:74,w:24,h:196};
const D142=SH142.dash,inset=(b,i)=>c=>rr(c,b.x+i,b.y+i,b.w-2*i,b.h-2*i,Math.max(2,b.r-i));
const visor=c=>rr(c,VIS.x,VIS.y,VIS.w,VIS.h,VIS.r),tubeSlot=c=>rr(c,TUB.x-8,TUB.y-8,TUB.w+16,TUB.h+16,(TUB.w+16)/2);
const dashPieces=g=>SH142.dash.pieces(g);   // V142-U2: outline lives in shape142.js (shared with the bake)
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
const DERA149=(()=>{try{return new URLSearchParams(location.search).get('dashera')==='1';}catch{return false;}})();   // V149: era JPEG/565 pass off for the cluster (?dashera=1 = old)
export function mountL1Dash(){if(dashMounted)return dashMounted;
 let host=null,cvs=null,ctx=null,R=null,rx=null,size='',raf=0,lastT=0,acc=0,visible=false,wasL1=false,stat=null,front=null,statKey='';
 const S={shown:[100,100,100,100],t:0,k:1,dpr:1,needle:{a:1,v:0},sub:{a:0,v:0},sweep:0,
  bat:{lvl:1,ghost:1,flash:0,wave:0,wv:0,last:100},tube:{lvl:1,tilt:0,tv:0},radar:{a:0,blips:[]},bottles:0,
  spr:{y:0,v:0,on:true,settled:true,delay:0}};
 const pipe=eraClient('dash',out=>{if(!cvs||!ctx)return;ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,cvs.width,cvs.height);upscale(ctx,out,0,0,cvs.width,cvs.height);});
 preloadSfx();mountEraSvg();try{for(const f of ['700 12px BC149Sans','400 12px BC149Sans','700 12px BC149Hei'])document.fonts.load(f,'理A').then(()=>{imgGen++;});}catch{}
 function ensure(){const stats=document.querySelector('.stats');if(!stats)return false;if(host&&host.isConnected)return true;
  stats.insertAdjacentHTML('beforeend',`<div class="l1-dash" aria-hidden="true"><canvas class="l1-cluster"></canvas></div>`);
  host=stats.querySelector('.l1-dash');cvs=host.querySelector('canvas');ctx=cvs.getContext('2d');size='';return true;}
 function resize(){const r=host.getBoundingClientRect();if(r.width<4)return false;const dpr=Math.min(3,Math.max(1,devicePixelRatio||1)),k=r.width/DW,key=r.width.toFixed(1)+'/'+dpr;if(key===size)return true;size=key;S.k=k;S.dpr=dpr;
  cvs.width=Math.round(DW*k*dpr);cvs.height=Math.round(DH*k*dpr);
  // V130-C: draw small (≈ .78 of CSS size) on a CPU canvas; the era pipe JPEGs it and upscales it into cvs
  if(DERA149){S.rs=ERA.f;[R,rx]=rcv(Math.round(DW*k*S.rs),Math.round(DH*k*S.rs));}else{S.rs=dpr;R=cvs;rx=ctx;}statKey='';return true;}
 function readVals(){const st=globalThis.__bcHudState,get=id=>Number(document.getElementById(id)?.getAttribute('aria-valuenow'));
  const v=st?[st.stamina,st.hydration,st.health,st.sanity??get('sanity-meter')]:[get('stamina-meter'),get('hydration-meter'),get('health-meter'),get('sanity-meter')];return v.map(x=>Number.isFinite(Number(x))?Number(x):100);}
 // ---- Dashboard entrance: the whole cluster rises on an under-damped spring, then the needles sweep ----
 function show(sound=true,why='tab'){visible=true;host?.classList.remove('l1-off');const s=S.spr;s.y=DH+40;s.v=0;s.on=true;s.settled=false;s.boop=sound;s.why=why;s.sprung=false;s.delay=.02;if(sound&&why==='tab')play('tabIn');S.sweep=0;S.sweepOn=true;}
 function hide(){visible=false;S.spr.on=false;S.spr.settled=false;play('tabOut');}
 function stepSpring(dt){const s=S.spr,H=1/240;S.sacc=(S.sacc||0)+dt;let n=0;
  while(S.sacc>=H&&n<120){S.sacc-=H;n++;if(s.delay>0){s.delay-=H;if(s.delay<=0&&s.on&&s.boop){play('whoosh');play('pop');play('popLow',1,1.04,.09);}continue;}
   const target=s.on?0:DH+60,w=s.on?13:20,z=s.on?.34:.95,a=-w*w*(s.y-target)-2*z*w*s.v;s.v+=a*H;s.y+=s.v*H;
   // overshoot: the first time the cluster flies past its rest line the spring twangs
   if(s.on&&s.boop&&!s.sprung&&s.y<-1.5&&s.v<0){s.sprung=true;play('spring',1,1.05);}
   if(s.on&&!s.settled&&Math.abs(s.y)<.6&&Math.abs(s.v)<6){s.settled=true;if(s.boop){play('settle');
    // each instrument then "lands" in its pocket: staggered small glass taps (two alternating takes, varied pitch)
    for(let i=0;i<5;i++)play(i%2?'land2':'land',1,.92+((i*37)%11)*.018,.08+i*.07);if(s.why==='enter')play('chime',1,1,.55);s.boop=false;}}}
  if(n>=120)S.sacc=0;
  // Dashboard "squash": the cluster stretches a touch while it flies and squashes on the bounce
  const sq=clamp(-s.v*.00035,-.05,.05);cvs.style.transform=`translate3d(0,${(s.y*S.k).toFixed(2)}px,0) scale(${(1-sq*.5).toFixed(4)},${(1+sq).toFixed(4)})`;
  cvs.style.visibility=(!s.on&&s.y>DH+50)?'hidden':'visible';return Math.abs(s.y-(s.on?0:DH+60))>.05||Math.abs(s.v)>.05;}
 // V149 fit: the cluster sits in the bottom-left corner (CSS: fixed, left 0 bottom 0) at ~42 % of the screen width
 // (≤ 44 % of its height); the hotbar slides right only as far as the key hints allow, then the cluster shrinks so
 // the two never overlap. Writes --l1d-w / --l1-inv-x on <html>; l1-ui.css reads them only on data-ui-level=1.
 function fit149(){const de=document.documentElement,vw=innerWidth,vh=innerHeight,inv=document.querySelector('.inv117 .inv-bar');
  let W0=Math.min(1140,Math.max(300,vw*.42),vh*.44*DW/DH);
  if(inv&&inv.offsetWidth){const hb=inv.offsetWidth,cl=vw/2-hb/2,kh=document.querySelector('.hud .key-hints'),kr=kh&&kh.getClientRects().length?kh.getBoundingClientRect():null,lim=kr&&kr.width>4?kr.left-14:vw-24,mx=Math.max(cl,lim-hb),x=Math.min(Math.max(W0+10,cl),mx);W0=Math.min(W0,x-10);
   const v=x>cl+.5?x.toFixed(1)+'px':'';if(de.style.getPropertyValue('--l1-inv-x')!==v){if(v)de.style.setProperty('--l1-inv-x',v);else de.style.removeProperty('--l1-inv-x');}}
  const w=Math.max(200,W0).toFixed(1)+'px';if(de.style.getPropertyValue('--l1d-w')!==w)de.style.setProperty('--l1d-w',w);}
 const typing=()=>{const ae=document.activeElement;return ae&&/INPUT|SELECT|TEXTAREA/.test(ae.tagName);};
 function onKey(e){if(!isL1()||e.repeat||typing())return;const K=globalThis.__bcKeys131;if(K?K.is(e,'map'):e.code==='KeyM'){play('key',1,.96);return;}if(!(K?K.is(e,'hud'):e.code==='KeyH'))return;if(document.querySelector('.modal:not([hidden]),dialog[open]'))return;e.preventDefault();play('key');if(visible)hide();else show();}
 function onKeyUp(e){if(!isL1()||typing())return;const K=globalThis.__bcKeys131,mp=K?K.is(e,'map'):e.code==='KeyM';if(mp||(K?K.is(e,'hud'):e.code==='KeyH'))play('keyUp',1,mp?.96:1);}
 addEventListener('keydown',onKey);addEventListener('keyup',onKeyUp);
 function frame(now){raf=requestAnimationFrame(frame);if(isL1()&&now-(S.fitT||0)>250){S.fitT=now;fit149();}const l1=isL1();if(l1&&!wasL1)S.pending=true;wasL1=l1;if(!l1||document.hidden)return;if(!ensure())return;
  const dt=Math.min(.5,(now-(lastT||now))/1000);lastT=now;if(!host.getClientRects().length)return;if(!resize())return;
  if(S.pending){S.pending=false;show(true,'enter');}
  stepSpring(dt);acc+=Math.min(dt,.1);if(acc<1/30)return;const step=Math.min(.1,acc);acc=0;simulate(step);
  // V130-C: with the era pass on, repaint at ~15 fps (2009 gadgets were never smooth); slower if the readback is costly
  if(!DERA149||now-(S.lastDraw||0)>=eraEvery('dash')){S.lastDraw=now;const t0=performance.now();draw();tick('dash.draw',t0);}}
 // ---------------------------------------------------------------- simulation
 function simulate(dt){S.t+=dt;const v=readVals(),st=globalThis.__bcHudState;
  for(let i=0;i<4;i++){const t=clamp(v[i],0,100);S.shown[i]+=(t-S.shown[i])*(1-Math.exp(-dt*(i===2?2.2:6)));}
  const speed=Math.hypot(st?.velocity?.x||0,st?.velocity?.z||0);
  // ignition sweep: needles run to full scale and back once the cluster has landed
  let sw=null;if(S.sweepOn&&S.spr.settled){S.sweep+=dt;const p=S.sweep/1.3;if(p>=1)S.sweepOn=false;else sw=Math.sin(Math.min(1,p)*Math.PI);}
  for(const [n,tgt,w,z] of [[S.needle,sw!=null?Math.max(S.shown[0]/100,sw):S.shown[0]/100,16,.33],[S.sub,sw!=null?Math.max(clamp(speed/8,0,1),sw):clamp(speed/8,0,1),11,.45]]){const H=1/120;let t=dt;while(t>0){const h=Math.min(H,t);t-=h;const a=w*w*(tgt-n.a)-2*z*w*n.v;n.v+=a*h;n.a+=n.v*h;}}
  if(sw!=null){const a=S.needle.a,p=S.lastNeedle??a;for(let k=1;k<=5;k++){const th=k*.2;if((p<th)!==(a<th))play('tick',1,1+k*.05);}}S.lastNeedle=S.needle.a;
  const b=S.bat,hp=v[2];if(b.last-hp>.4){b.flash=1;b.wv+=.9;if(S.t-(b.lastHit||0)>.35){const big=b.last-hp>=8;play('hit',1,big?.9:1);if(big)play('clank',1,1,.02);b.lastHit=S.t;}}b.last=hp;
  b.lvl+=(S.shown[2]/100-b.lvl)*(1-Math.exp(-dt*2.4));if(b.ghost<b.lvl)b.ghost=b.lvl;else b.ghost+=(b.lvl-b.ghost)*(1-Math.exp(-dt*.7));
  b.flash=Math.max(0,b.flash-dt*.8);b.wv+=(-90*b.wave-3*b.wv)*dt;b.wave+=b.wv*dt;b.wv+=(Math.random()-.5)*speed*.04;
  const tb=S.tube;tb.lvl+=(S.shown[1]/100-tb.lvl)*(1-Math.exp(-dt*4));const want=clamp((st?.velocity?.x||0)*.012+Math.sin(S.t*7)*speed*.004,-.12,.12);tb.tv+=((want-tb.tilt)*60-tb.tv*4.5)*dt;tb.tilt+=tb.tv*dt;
  const r=S.radar,threat=1-S.shown[3]/100,prev=r.a;r.a=(r.a+dt*TAU/(2.6-threat*1.2))%TAU;
  const want2=Math.round(1+threat*9);if(r.blips.length<want2&&Math.random()<dt*2)r.blips.push({a:Math.random()*TAU,d:.25+Math.random()*(.75-threat*.35),life:0});if(r.blips.length>want2)r.blips.shift();
  for(const p of r.blips){const crossed=(prev<=p.a&&r.a>=p.a)||(prev>r.a&&(p.a>=prev||p.a<=r.a));if(crossed){p.life=1;p.a+=(Math.random()-.5)*.25*threat;p.d=clamp(p.d+(Math.random()-.55)*.08,.12,.95);}p.life=Math.max(0,p.life-dt*.45);}
  S.bottles=Number(document.getElementById('bottle-count')?.textContent)||0;}
 // ---------------------------------------------------------------- static layers
 function layer(){const [c,g]=DERA149?rcv(R.width,R.height):(()=>{const c=document.createElement('canvas');c.width=R.width;c.height=R.height;return[c,c.getContext('2d')];})();const s=S.k*S.rs;g.setTransform(s,0,0,s,0,0);return[c,g];}
 function buildStatic(){FK=1/S.k;K149=S.k;const [bc,c]=layer(),[fc,f]=layer(),s=S.k*S.rs;
  // V142: ONE brushed-chrome casting rising off the bottom-left screen corner: the speedometer pod, its m/s
  // sub-pod on a short web, a long visor spine (health · sanity · almond water behind one black glass), the radar
  // lens pod and the hydration capsule, all on a base band that runs off the bottom edge and ends in a teardrop tail.
  shell142(c,DW,s,D142.pieces,{baked:IMG.shellDash,tex:IMG.chromeDash,y0:40,y1:316,
   pods:[{x:GA.x,y:GA.y,R:GA.R+20,conic:GA.R+2},{x:SUB.x,y:SUB.y,R:SUB.R+11,conic:SUB.R+1},{x:RAD.x,y:RAD.y,R:RAD.R+18,conic:RAD.R+3},{x:VIS.x+VIS.w/2,y:VIS.y+40,R:200}],
   glints:[[GA.x-10,GA.y-GA.R-12,60,1.8,.6],[VIS.x+VIS.w/2,VIS.y-10,150,2,.55],[VIS.x+VIS.w/2+20,250,170,1.6,.4],[TUB.x+TUB.w/2,TUB.y-8,16,1.4,.5],[RAD.x-6,RAD.y-RAD.R-12,40,1.4,.45],[560,300,170,1.4,.3]],shadow:[5,-2,18]});
  // wells for the round instruments, sockets for the visor glass and the tube
  well(c,GA.x,GA.y,GA.R);well(c,SUB.x,SUB.y,SUB.R+1);well(c,RAD.x,RAD.y,RAD.R+3);
  // V142-U2 ②: every readout sits in its OWN pocket machined into the casting (battery capsule, numeral lens,
  // stepped signal slots + readout pill, round almond-water lens) — the baked shell carries their raised lips
  const glassS={deep:'#010203',mid:'#071017',bot:'#0e1c26',blur:7};
  for(const b of [D142.BAT,D142.NUM,D142.SIGP])socket142(c,inset(b,2.5),b.y,b.y+b.h,glassS);
  for(let i=0;i<5;i++){const b=D142.bars(i);socket142(c,inset(b,1.6),b.y,b.y+b.h,{blur:3});}
  {const A=D142.ALM;socket142(c,g=>{g.beginPath();g.arc(A.x,A.y,A.R-2.5,0,TAU);},A.y-A.R,A.y+A.R,glassS);}
  socket142(c,inset({x:TUB.x-8,y:TUB.y-8,w:TUB.w+16,h:TUB.h+16,r:(TUB.w+16)/2},2.5),TUB.y-8,TUB.y+TUB.h+8,{blur:7});
  ios149(c,'HEALTH 生命',D142.BAT.x+46,D142.BAT.y-8,fI(11),{top:'#2a3036',bot:'#11161a',shadow:'#ffffffb0',sy:1});   // dark engraving: it sits on the bright lip
  // printed scale on the tube glass
  for(let i=0;i<=10;i++){const yy=TUB.y+TUB.h-(TUB.h-14)*i/10;c.fillStyle='#ffffff60';c.fillRect(TUB.x+TUB.w-(i%5?6:10),yy,i%5?6:10,1);}
  // engraved legends cut into the chrome
  etch149(c,'SANITY 理智',SIG.x+SIG.w/2,VIS.y+VIS.h+15,12);etch149(c,'杏仁水',D142.ALM.x,VIS.y+VIS.h+15,12);
  etch149(c,'THREAT SCAN',RAD.x,RAD.y+RAD.R+30,12);etch149(c,'水分',TUB.x+TUB.w/2,TUB.y+TUB.h+24,12);
  // V149: the LEVEL 1 block lettering on the base band is removed (user 10-25)
  // ridge details: indicator lamps and a vent grille on the spine crown, rivets on the pods' collars
  grille142(c,VIS.x+118,VIS.y-17,9,7,3.2,12);
  lamp142(c,VIS.x+62,VIS.y-11,2.8,'#ffb838',1);lamp142(c,VIS.x+77,VIS.y-11,2.8,'#6fc8ff',.9);lamp142(c,VIS.x+92,VIS.y-11,2.8,'#6fc8ff',.35);
  for(const a of [-2.35,-.6,.3]){rivet142(c,GA.x+Math.cos(a)*(GA.R+11),GA.y+Math.sin(a)*(GA.R+11),3.4);}
  for(const a of [-1.2,2.2])rivet142(c,RAD.x+Math.cos(a)*(RAD.R+11),RAD.y+Math.sin(a)*(RAD.R+11),3);
  // ---- front layer: the radar's chrome ring, the visor glass + bezel, the tube's chrome caps ----
  if(ok(IMG['gauge-ring'])){f.drawImage(IMG['gauge-ring'],RAD.x-RAD.R*1.13,RAD.y-RAD.R*1.13,RAD.R*2.26,RAD.R*2.26);}else{chromeRing(f,RAD.x,RAD.y,RAD.R,5);}
  for(const b of [D142.BAT,D142.NUM,D142.SIGP])gloss142(f,inset(b,2.5),b.x,b.y,b.x+b.w,b.y+b.h,.22);
  {const A=D142.ALM;gloss142(f,g=>{g.beginPath();g.arc(A.x,A.y,A.R-2.5,0,TAU);},A.x-A.R,A.y-A.R,A.x+A.R,A.y+A.R,.34);}
  if(!ok(IMG.shellDash)){gloss142(f,visor,VIS.x,VIS.y,VIS.x+VIS.w,VIS.y+VIS.h,.24);bezel142(f,visor,VIS.y,VIS.y+VIS.h,3.6);bezel142(f,tubeSlot,TUB.y-8,TUB.y+TUB.h+8,2.6);}
  for(const cy of [TUB.y-2,TUB.y+TUB.h-14]){f.save();f.shadowColor='#000000a0';f.shadowBlur=4;f.shadowOffsetY=2;rr(f,TUB.x-7,cy,TUB.w+14,10,5);f.fillStyle=lg(f,0,cy,0,cy+10,[[0,'#f6f8f9'],[.4,'#9ba1a6'],[.55,'#5b6166'],[1,'#d6dadd']]);f.fill();f.restore();}
  stat=bc;front=fc;statKey=size+'/'+imgGen;}
 // ---------------------------------------------------------------- dynamic drawing
 function face(c,x,y,F,val,{max=100,step=20,minor=5,label='',label2='',red=null,big=true}){
  c.fillStyle=rg(c,x,y-F*.25,F*.05,x,y,F,[[0,'#2e3236'],[.6,'#121416'],[1,'#030404']]);c.beginPath();c.arc(x,y,F,0,TAU);c.fill();
  // turned (concentric) finish on the dial
  c.strokeStyle='#ffffff07';c.lineWidth=.6;for(let r=F*.2;r<F;r+=F*.035){c.beginPath();c.arc(x,y,r,0,TAU);c.stroke();}
  const a0=Math.PI*.75,a1=Math.PI*2.25,ang=t=>a0+(a1-a0)*t,v=clamp(val,0,1);
  c.lineCap='butt';c.lineWidth=F*.06;c.strokeStyle='#ffffff0d';c.beginPath();c.arc(x,y,F*.9,a0,a1);c.stroke();
  if(v>.002){const g=c.createConicGradient?c.createConicGradient(a0,x,y):null;if(g){g.addColorStop(0,'#ff3b2a');g.addColorStop(.16,'#ffb62a');g.addColorStop(.4,'#f2f6ff');g.addColorStop(.75,'#3fe0ff');g.addColorStop(1,'#3fe0ff');}
   c.save();c.shadowColor=v<.2?'#ff4020':'#5ff0ff';c.shadowBlur=F*.14;c.strokeStyle=g||'#5ff0ff';c.beginPath();c.arc(x,y,F*.9,a0,ang(v));c.stroke();c.restore();}
  if(red!=null){c.strokeStyle='#d8261c';c.lineWidth=F*.045;c.beginPath();c.arc(x,y,F*.79,a0,ang(red));c.stroke();}
  for(let t=0;t<=max+1e-6;t+=minor){const a=ang(t/max),major=Math.abs(t%step)<1e-6,r0=F*(major?.7:.75),r1=F*.83;c.strokeStyle=major?'#f4f4f4':'#8f969c';c.lineWidth=major?F*.024:F*.012;c.beginPath();c.moveTo(x+Math.cos(a)*r0,y+Math.sin(a)*r0);c.lineTo(x+Math.cos(a)*r1,y+Math.sin(a)*r1);c.stroke();
   if(major){c.save();c.shadowColor='#bff6ff';c.shadowBlur=F*.05;text(c,String(t),x+Math.cos(a)*F*.56,y+Math.sin(a)*F*.56,fI(big?15:11,700,big?8:7),'#f6fbff',null);c.restore();}}
  if(label)text(c,label,x,y+F*.74,fI(12),'#c3ccd4',null);if(label2)text(c,label2,x,y+F*.25+13,fI(11),'#7d8790',null);
  return{ang};}
 function needle(c,x,y,F,ang,t,col='#ff4b1f'){const a=ang(clamp(t,-.02,1.02));c.save();c.translate(x,y);c.rotate(a);
  c.save();c.shadowColor='#000000d0';c.shadowBlur=F*.05;c.shadowOffsetX=F*.03;c.shadowOffsetY=F*.05;c.fillStyle='#000';c.beginPath();c.moveTo(-F*.18,-F*.03);c.lineTo(F*.84,-F*.006);c.lineTo(F*.84,F*.006);c.lineTo(-F*.18,F*.03);c.closePath();c.fill();c.restore();
  c.save();c.shadowColor=col;c.shadowBlur=F*.08;c.fillStyle=lg(c,0,-F*.03,0,F*.03,[[0,'#ffb08a'],[.5,col],[1,'#8a1a08']]);c.beginPath();c.moveTo(-F*.18,-F*.03);c.lineTo(F*.84,-F*.006);c.lineTo(F*.84,F*.006);c.lineTo(-F*.18,F*.03);c.closePath();c.fill();c.restore();c.restore();
  // chrome hub cap
  c.save();c.shadowColor='#000000b0';c.shadowBlur=F*.06;c.shadowOffsetY=F*.03;c.fillStyle=rg(c,x-F*.04,y-F*.05,F*.01,x,y,F*.13,[[0,'#ffffff'],[.35,'#c3c8cd'],[.7,'#4b5056'],[1,'#1a1c1f']]);c.beginPath();c.arc(x,y,F*.12,0,TAU);c.fill();c.restore();
  c.fillStyle='#ffffffc0';c.beginPath();c.ellipse(x-F*.035,y-F*.05,F*.04,F*.02,-.5,0,TAU);c.fill();}
 function dome(c,x,y,R){c.save();c.beginPath();c.arc(x,y,R,0,TAU);c.clip();c.fillStyle=lg(c,0,y-R,0,y+R*.1,[[0,'#ffffff55'],[.55,'#ffffff12'],[1,'#ffffff00']]);c.beginPath();c.ellipse(x-R*.08,y-R*.5,R*.9,R*.55,-.12,0,TAU);c.fill();
  c.fillStyle=rg(c,x,y,R*.75,x,y,R,[[0,'#00000000'],[1,'#00000090']]);c.fillRect(x-R,y-R,R*2,R*2);c.restore();}
 function draw(){if(statKey!==size+'/'+imgGen)buildStatic();FK=1/S.k;K149=S.k;const c=rx,s=S.k*S.rs;c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,R.width,R.height);c.drawImage(stat,0,0);c.setTransform(s,0,0,s,0,0);
  // ---- speedometer (stamina) ----
  const F=GA.R-12,m=face(c,GA.x,GA.y,F,S.needle.a,{label:'STAMINA 体力',red:.2});
  const pct=Math.round(S.shown[0]),lw=50,lh=24,lx=GA.x-lw/2,ly=GA.y+F*.27;rr(c,lx,ly,lw,lh,5);c.fillStyle=lg(c,0,ly,0,ly+lh,[[0,'#050607'],[1,'#1c2124']]);c.fill();rr(c,lx+.5,ly+.5,lw-1,lh-1,4.5);c.strokeStyle='#ffffff26';c.lineWidth=1;c.stroke();
  ios149(c,pct+'%',GA.x,ly+lh/2+1,fI(14,700,9),pct<20?{top:'#ffd2c4',bot:'#ff4a30',glow:'#ff3a2080'}:{top:'#ffffff',bot:'#c9e9ff',glow:'#7fd4ff60'});
  needle(c,GA.x,GA.y,F,m.ang,S.needle.a);dome(c,GA.x,GA.y,F+2);chromeRing(c,GA.x,GA.y,GA.R-4,6);
  // ---- sub dial: walking speed ----
  const sF=SUB.R-2,sm=face(c,SUB.x,SUB.y,sF,S.sub.a,{max:8,step:2,minor:1,big:false});text(c,'m/s',SUB.x,SUB.y+sF*.62,fI(10,700,7),'#c3ccd4',null);needle(c,SUB.x,SUB.y,sF,sm.ang,S.sub.a,'#ff7a1f');dome(c,SUB.x,SUB.y,sF+1);
  if(ok(IMG['gauge-ring']))c.drawImage(IMG['gauge-ring'],SUB.x-SUB.R*1.13,SUB.y-SUB.R*1.13,SUB.R*2.26,SUB.R*2.26);else chromeRing(c,SUB.x,SUB.y,SUB.R,5);
  drawMID(c);drawSignal(c);drawRadar(c);drawTube(c);drawIcon(c);
  c.setTransform(1,0,0,1,0,0);c.drawImage(front,0,0);if(R!==cvs){pipe.submit(R);if(!pipe.out){ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,cvs.width,cvs.height);upscale(ctx,R,0,0,cvs.width,cvs.height);}}}
 function drawMID(c){const {x,y,w,h,r}=MID;c.save();rr(c,x-6,y-4,w+12,h+8,r);c.clip();
  const b=S.bat,bx=x+4,by=y+14,bw=80,bh=38,br=9,fl=b.flash>0?Math.pow(Math.abs(Math.sin((1-b.flash)*Math.PI*4.5)),.7)*b.flash:0;
  // iPhone OS 1 battery: glossy silver shell
  rr(c,bx,by,bw,bh,br);c.fillStyle=lg(c,0,by,0,by+bh,[[0,'#ffffff'],[.45,'#d8dce0'],[.55,'#a9b0b7'],[1,'#e9ecef']]);c.fill();
  c.fillStyle=lg(c,0,by+bh*.3,0,by+bh*.7,[[0,'#f4f6f8'],[.5,'#a2a9b0'],[1,'#e2e5e8']]);rr(c,bx+bw-1,by+bh*.3,9,bh*.4,3);c.fill();
  const ix=bx+5,iy=by+5,iw=bw-10,ih=bh-10,ir=br-4;rr(c,ix,iy,iw,ih,ir);c.fillStyle=lg(c,0,iy,0,iy+ih,[[0,'#16181b'],[.5,'#2b2f33'],[1,'#3a3e43']]);c.fill();
  c.save();rr(c,ix,iy,iw,ih,ir);c.clip();
  const low=b.lvl<.22,top=low?'#ff8a7a':'#c4f0ff',mid=low?'#e0261a':'#3fb2ee',bot=low?'#8a0f08':'#135f90';
  if(b.ghost>b.lvl+.004){const gx=ix+iw*b.ghost;c.fillStyle=low?'#e0261a40':'#3fb2ee42';c.fillRect(ix,iy,gx-ix,ih);for(let i=0;i<5;i++){const dx=ix+iw*(b.lvl+(b.ghost-b.lvl)*(i+.5)/5);c.fillStyle=low?'#ff6a5050':'#8cd8ff55';c.fillRect(dx-1,iy+ih*.55,2,ih*.45*(.5+.5*Math.sin(i*2.3+S.t)));}}
  const fx=ix+iw*clamp(b.lvl,0,1),wv=b.wave*6;c.beginPath();c.moveTo(ix-2,iy-2);
  for(let i=0;i<=12;i++){const yy=iy-2+(ih+4)*i/12,bulge=Math.sin(i/12*Math.PI)*3,sl=Math.sin(i/12*Math.PI*2+S.t*3)*wv;c.lineTo(fx+bulge+sl,yy);}c.lineTo(ix-2,iy+ih+2);c.closePath();
  c.fillStyle=lg(c,0,iy,0,iy+ih,[[0,top],[.48,mid],[1,bot]]);c.fill();
  c.save();c.clip();c.fillStyle=lg(c,0,iy,0,iy+ih*.5,[[0,'#ffffffd0'],[1,'#ffffff20']]);rr(c,ix+3,iy+2,Math.max(0,fx-ix-4),ih*.46,ir-2);c.fill();
  c.fillStyle=lg(c,0,iy+ih*.6,0,iy+ih,[[0,'#ffffff00'],[1,low?'#ffb0a060':'#d0f2ff70']]);c.fillRect(ix,iy+ih*.6,fx-ix,ih*.4);c.restore();c.restore();
  c.fillStyle=lg(c,0,iy,0,iy+ih*.45,[[0,'#ffffff55'],[1,'#ffffff00']]);rr(c,ix+2,iy+1,iw-4,ih*.42,ir-1);c.fill();rr(c,ix,iy,iw,ih,ir);c.strokeStyle='#00000080';c.lineWidth=1.2;c.stroke();
  if(fl>.01){c.save();c.shadowColor='#ff1a0a';c.shadowBlur=14*fl;rr(c,bx-1,by-1,bw+2,bh+2,br+1);c.strokeStyle=`rgba(255,40,24,${.95*fl})`;c.lineWidth=3;c.stroke();rr(c,bx+bw-1,by+bh*.3,9,bh*.4,3);c.stroke();c.restore();}
  // health readout in 3D block numerals (reflection of the battery on the glass below it)
  const hp=Math.round(S.shown[2]);ios149(c,String(hp),x+w-8,y+33,fI(34,700,14),low?{align:'right',top:'#ffd2c4',bot:'#ff4a30',glow:'#ff3a2090'}:{align:'right',top:'#ffffff',bot:'#8fd0f5',glow:'#4fbaff80'});
  c.restore();}
 function drawSignal(c){const {x,y,w,h}=SIG,san=S.shown[3],lit=Math.ceil(san/20-.001),col=san>60?['#c4f0ff','#3fb2ee','#135f90']:san>30?['#ffe08a','#f0a81e','#8a5a08']:['#ffa08a','#e8321e','#7a1208'];
  c.save();
  const bx=x+4,by=y+h-3;for(let i=0;i<5;i++){const bw=10,bh=8+i*8.2,X=bx+i*13,Y=by-bh;
   rr(c,X-1,Y-1,bw+2,bh+2,2.5);c.fillStyle='#000';c.fill();rr(c,X,Y+1,bw,bh,2);c.fillStyle='#ffffff14';c.fill();
   rr(c,X,Y,bw,bh,2);c.fillStyle=i<lit?lg(c,X,0,X+bw,0,[[0,col[0]],[.5,col[1]],[1,col[2]]]):lg(c,0,Y,0,Y+bh,[[0,'#2a2e31'],[1,'#17191b']]);c.fill();
   if(i<lit){c.fillStyle='#ffffff70';rr(c,X+1,Y+1,bw*.45,bh-2,1.5);c.fill();c.save();c.shadowColor=col[1];c.shadowBlur=6;c.fillStyle=col[1]+'40';c.fillRect(X,Y,bw,bh);c.restore();}}
  text(c,'3G',x+w-12,y+8,fI(10,700,7),col[1],null);ios149(c,String(Math.round(san)),x+w-6,y+h-13,fI(16,700,9),{align:'right',...(san<=30?{top:'#ffd2c4',bot:'#ff4a30'}:{top:'#ffffff',bot:'#c9e9ff'})});
  c.restore();}
 function drawRadar(c){const {x:cx0,y:cy0,R}=RAD,r=S.radar;
  c.fillStyle=rg(c,cx0,cy0,2,cx0,cy0,R,[[0,'#0f3a58'],[.7,'#061b2c'],[1,'#01060c']]);c.beginPath();c.arc(cx0,cy0,R,0,TAU);c.fill();
  c.save();c.beginPath();c.arc(cx0,cy0,R,0,TAU);c.clip();
  c.strokeStyle='#6fcaff40';c.lineWidth=1;for(const f of [.33,.66,1]){c.beginPath();c.arc(cx0,cy0,R*f-1,0,TAU);c.stroke();}c.beginPath();c.moveTo(cx0-R,cy0);c.lineTo(cx0+R,cy0);c.moveTo(cx0,cy0-R);c.lineTo(cx0,cy0+R);c.stroke();
  if(c.createConicGradient){const sg=c.createConicGradient(r.a-1.6,cx0,cy0);sg.addColorStop(0,'#2aa8ff00');sg.addColorStop(.25,'#5cc4ff70');sg.addColorStop(.2551,'#2aa8ff00');sg.addColorStop(1,'#2aa8ff00');c.fillStyle=sg;c.fillRect(cx0-R,cy0-R,R*2,R*2);}
  c.strokeStyle='#c8ecff';c.lineWidth=1.5;c.shadowColor='#4fbaff';c.shadowBlur=6;c.beginPath();c.moveTo(cx0,cy0);c.lineTo(cx0+Math.cos(r.a-1.6+TAU*.25)*R,cy0+Math.sin(r.a-1.6+TAU*.25)*R);c.stroke();
  for(const p of r.blips){if(p.life<=0)continue;const px=cx0+Math.cos(p.a-1.6+TAU*.25)*R*p.d,py=cy0+Math.sin(p.a-1.6+TAU*.25)*R*p.d,red=S.shown[3]<35;c.fillStyle=red?`rgba(255,120,80,${p.life})`:`rgba(200,236,255,${p.life})`;c.shadowColor=red?'#ff5030':'#4fbaff';c.shadowBlur=8;c.beginPath();c.arc(px,py,2.4,0,TAU);c.fill();}
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
  ios149(c,String(Math.round(S.shown[1])),cxm,y+h-52,fI(13,700,8),{top:'#ffffff',bot:'#dff2ff',shadow:'#0b3a6ad0'});}
 function drawIcon(c){const {x,y,s}=ICO;
  {const A=D142.ALM;c.save();c.beginPath();c.arc(A.x,A.y,A.R-2.5,0,TAU);c.clip();if(ok(IMG['almond-icon']))c.drawImage(IMG['almond-icon'],A.x-A.R-1,A.y-A.R-1,(A.R+1)*2,(A.R+1)*2*IMG['almond-icon'].naturalHeight/IMG['almond-icon'].naturalWidth);else{c.fillStyle='#6cb8e8';c.fillRect(A.x-A.R,A.y-A.R,A.R*2,A.R*2);}c.restore();}
  const n=S.bottles;if(n>0){const bx=x+s-2,by=y+3,t=String(n),bw=Math.max(22,10+t.length*9);c.save();c.shadowColor='#0009';c.shadowBlur=4;c.shadowOffsetY=2;rr(c,bx-bw/2,by-11,bw,22,11);c.fillStyle='#fff';c.fill();c.restore();
   rr(c,bx-bw/2+2,by-9,bw-4,18,9);c.fillStyle=lg(c,0,by-9,0,by+9,[[0,'#ff6a5a'],[.5,'#e3170a'],[1,'#b80c02']]);c.fill();c.fillStyle='#ffffff50';rr(c,bx-bw/2+3,by-8,bw-6,8,4);c.fill();text(c,t,bx,by+1,fI(14,700,8),'#fff',null);}}
 raf=requestAnimationFrame(frame);
 dashMounted={show,hide,get visible(){return visible;},dispose(){cancelAnimationFrame(raf);removeEventListener('keydown',onKey);removeEventListener('keyup',onKeyUp);host?.remove();dashMounted=null;}};loadImages();return dashMounted;
}
