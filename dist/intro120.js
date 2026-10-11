// V120 · first-run intro, redone after the 15:07 / 15:11 review ("quality poor, too fast, unlike the found-footage clip").
// Beats (≈16 s, paced on the Kane Pixels "Found Footage" noclip: ~15 s from the glitch to the first "Hello?"):
//  0.0–1.1  tape glitch, black → you are hanging in a dark void, far above an endless drop ceiling
//  1.1–7.6  free fall from ~150 m with real gravity + air drag (v' = g − k·v², terminal ≈ 34 m/s): the camera looks out
//           over a vast grid of ceiling tiles with fluorescent panels glowing through it all the way to the horizon,
//           wind rising with v², camcorder shake rising with speed, the grid swells as you near it, the view tips
//           straight down, the fluorescent buzz grows, and you pass through the missing tile into the lit room
//  7.6      impact: hard jolt, tape dropout + tracking tear, white-out, blur, tinnitus
//  7.6–11.2 lying on your side on the carpet: exposure breathing, two slow blinks, breaths, the hum
//  11.2–13.2 roll over onto hands and knees, staring at the carpet
//  13.2–16.0 slow, unsteady handheld rise to the spawn view; the camcorder overlay fades and the game takes over
// Camcorder look: DOM overlay (grain canvas, rolling tracking band, REC / timecode OSD, vignette) + CSS filter on the
// game canvas (exposure pumping, slight motion blur, desaturation). Space / Enter / Esc / click skips.
// The fall is drawn in the intro's own scene (exposed as .scene while active); main.js swaps it in for the frame.
export function createIntro120(T){
 let act=null;
 const ease=t=>t<=0?0:t>=1?1:t*t*(3-2*t),easeO=t=>1-Math.pow(1-Math.max(0,Math.min(1,t)),3),lerp=(a,b,t)=>a+(b-a)*t,cl=(v,a,b)=>Math.max(a,Math.min(b,v));
 const G=9.8,VT=34,K=G/(VT*VT),PY=2.72,Y0=.24;
 const TG=1.1,TFALL=6.5,TI=TG+TFALL,TLIE=11.2,TKNEE=13.2,TEND=16.0,TOUT=16.4;
 // drop height that the drag-limited fall covers in TFALL seconds
 const FALL_H=VT*VT/G*Math.log(Math.cosh(G*TFALL/VT));
 // ---------- the endless drop ceiling seen from above (one shader plane, filtered so it stays clean at 150 m) ----------
 function ceilingMaterial(hole){return new T.ShaderMaterial({fog:false,toneMapped:true,
  uniforms:{uHole:{value:new T.Vector2(hole.x,hole.z)},uTime:{value:0},uCam:{value:new T.Vector3()},uNear:{value:0}},
  vertexShader:`varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
  fragmentShader:`uniform vec2 uHole;uniform float uTime;uniform vec3 uCam;uniform float uNear;varying vec3 vW;
   float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
   float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+1.),f.x),f.y);}
   // box coverage of [-hw,hw] filtered over a pixel footprint w (analytic box-filter of a box)
   float boxAA(float x,float hw,float w){w=max(w,1e-4);return clamp((min(x+w*.5,hw)-max(x-w*.5,-hw))/w,0.,1.);}
   void main(){vec2 p=vW.xz-uHole;vec2 fw=fwidth(vW.xz);float pf=max(fw.x,fw.y);
    // 0.6 m tiles; troffers 1.2 x 0.6 on a 4.8 x 2.4 m lattice (some dead, a few flickering), the hole tile at the origin
    vec2 tile=fract(p/.6+.5)-.5;float grid=1.-boxAA(tile.x,.5-.03/.6,fw.x/.6)*boxAA(tile.y,.5-.03/.6,fw.y/.6);
    float gridFar=smoothstep(.03,.12,pf);grid=mix(grid,.1,gridFar);
    vec2 cell=vec2(4.8,2.4);vec2 pl=p-vec2(0.,.9);vec2 ci=floor(pl/cell+.5);vec2 lc=pl-ci*cell;float id=h21(ci+7.1);
    float near=1.-smoothstep(50.,90.,length(p));float dead=(1.-step(.03,id))*near;float alive=(1.-dead)*(id<.06&&near>.5?.5+.5*step(.5,fract(uTime*7.+id*31.)):1.);
    float lampCov=boxAA(lc.x,.6,fw.x)*boxAA(lc.y,.3,fw.y);float lampMean=1.2*.6/(cell.x*cell.y);
    float far=smoothstep(.2,.95,pf);float lamp=mix(lampCov,lampMean*1.3,far)*alive;
    // housing rim + light bleeding round it onto the tile backs (wider, softer with height so it reads from far away)
    float d=length(max(abs(lc)-vec2(.6,.3),0.));float halo=exp(-d*d/(.18+min(pf*pf*6.,.5)))*alive*(1.-lampCov)*(1.-far*.75);
    float rim=(boxAA(lc.x,.68,fw.x)*boxAA(lc.y,.36,fw.y)-lampCov)*alive;
    // dusty, water-stained tile backs
    float n=vn(p*1.7)*.5+vn(p*.31+3.)*.35+vn(p*.07-9.)*.15;float stain=smoothstep(.62,.8,vn(p*.45+17.));
    vec3 tileC=mix(vec3(.018,.016,.012),vec3(.04,.036,.027),n)*(1.-stain*.35)*(1.-grid*.45);
    vec3 col=tileC+vec3(1.,.9,.6)*halo*.17;col=mix(col,vec3(.03,.03,.028),clamp(rim,0.,1.)*.8*(1.-far));
    col+=vec3(1.,.94,.74)*lamp*mix(4.,2.6,far);col+=vec3(.05,.05,.045)*lampCov*dead;
    // the missing tile: an opening onto the lit room below
    float hole=boxAA(p.x,.6,fw.x)*boxAA(p.y,.3,fw.y);col=mix(col,vec3(2.6,2.3,1.4),hole);
    // haze towards the horizon: the light of a billion panels hanging in the dust
    float dist=length(vW-uCam);float haze=1.-exp(-dist*.0028);col=mix(col,vec3(.06,.05,.03),haze*.9);
    gl_FragColor=vec4(col,1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
   }`});}
 function skyMaterial(){return new T.ShaderMaterial({side:T.BackSide,depthWrite:false,fog:false,uniforms:{},
  vertexShader:`varying vec3 vD;void main(){vD=normalize(position);vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=p.xyww;}`,
  fragmentShader:`varying vec3 vD;void main(){float h=clamp(vD.y,-1.,1.);vec3 c=mix(vec3(.075,.062,.036),vec3(.004,.0035,.003),smoothstep(-.01,.16,h));gl_FragColor=vec4(c,1.);
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
  }`});}
 function build(hole){const sc=new T.Scene();sc.background=new T.Color(0x030302);
  const mat=ceilingMaterial(hole);const plane=new T.Mesh(new T.PlaneGeometry(9000,9000).rotateX(-Math.PI/2),mat);plane.position.set(hole.x,PY,hole.z);plane.frustumCulled=false;sc.add(plane);
  const sky=new T.Mesh(new T.SphereGeometry(1,24,12),skyMaterial());sky.frustumCulled=false;sky.renderOrder=-1;sc.add(sky);
  // near the end some real geometry gives parallax: ducts, cable runs and hanger wires lying on the tile backs
  const ductM=new T.MeshBasicMaterial({color:0x4a4a46}),cabM=new T.MeshBasicMaterial({color:0x151412}),hangM=new T.MeshBasicMaterial({color:0x6c6a62});
  const props=new T.Group();let s=11;const rnd=()=>{s=(s*16807)%2147483647;return s/2147483647;};
  for(let i=0;i<14;i++){const L=8+rnd()*30,r=.14+rnd()*.14,d=new T.Mesh(new T.CylinderGeometry(r,r,L,10).rotateZ(Math.PI/2),ductM);d.position.set(hole.x+(rnd()-.5)*60,PY+r+.02,hole.z+(rnd()-.5)*60);d.rotation.y=rnd()<.5?0:Math.PI/2;if(Math.hypot(d.position.x-hole.x,d.position.z-hole.z)<2.5)continue;props.add(d);}
  for(let i=0;i<24;i++){const L=6+rnd()*18,c=new T.Mesh(new T.CylinderGeometry(.012,.012,L,4).rotateZ(Math.PI/2),cabM);c.position.set(hole.x+(rnd()-.5)*30,PY+.02,hole.z+(rnd()-.5)*30);c.rotation.y=rnd()*Math.PI;props.add(c);}
  for(let i=0;i<40;i++){const w=new T.Mesh(new T.CylinderGeometry(.004,.004,6,3),hangM);w.position.set(hole.x+(rnd()-.5)*24,PY+3,hole.z+(rnd()-.5)*24);props.add(w);}
  sc.add(props);return{sc,mat,sky,plane};}
 function shard(scene,hole){const mat=new T.MeshStandardMaterial({color:0xd8d2bc,roughness:.95});const s=new T.Mesh(new T.BoxGeometry(.25+Math.random()*.3,.016,.18+Math.random()*.2),mat);
  s.position.set(hole.x+(Math.random()-.5)*.8,2.68,hole.z+(Math.random()-.5)*.4);scene.add(s);return{m:s,v:new T.Vector3((Math.random()-.5)*1.4,-6-Math.random()*3,(Math.random()-.5)*1.4),w:new T.Vector3(Math.random()*9,Math.random()*4,Math.random()*9),rest:false};}
 // ---------- audio ----------
 let ac=null,nodes=[],bus=null;
 function audio(){try{ac=ac||new (globalThis.AudioContext||globalThis.webkitAudioContext)();if(ac.state==='suspended')ac.resume();return ac;}catch{return null;}}
 function noiseBuf(a,len,brown=.04){const b=a.createBuffer(1,Math.round(a.sampleRate*len),a.sampleRate),d=b.getChannelData(0);let p=0;for(let i=0;i<d.length;i++){p+=(Math.random()*2-1-p)*brown;d[i]=brown>=1?Math.random()*2-1:p*3;}return b;}
 function loop(a,buf,dest){const s=a.createBufferSource();s.buffer=buf;s.loop=true;s.connect(dest);s.start();nodes.push({stop:()=>{try{s.stop();}catch{}}});return s;}
 function gain(a,v,dest){const g=a.createGain();g.gain.value=v;g.connect(dest||bus);return g;}
 function startAudio(){const a=audio();if(!a)return null;bus=a.createGain();bus.gain.value=1;bus.connect(a.destination);
  // wind: brown-ish noise, band + low pass opened with speed
  const wg=gain(a,0),wf=a.createBiquadFilter();wf.type='bandpass';wf.Q.value=.6;wf.frequency.value=250;wf.connect(wg);const wl=a.createBiquadFilter();wl.type='lowpass';wl.frequency.value=700;wl.connect(wf);loop(a,noiseBuf(a,4),wl);
  const rg=gain(a,0),rl=a.createBiquadFilter();rl.type='lowpass';rl.frequency.value=90;rl.connect(rg);loop(a,noiseBuf(a,4,.02),rl);// rumble
  // fluorescent buzz: 120 Hz sawtooth + harmonics through a resonant band, slight 60 Hz beat
  const hg=gain(a,0),hb=a.createBiquadFilter();hb.type='bandpass';hb.frequency.value=1150;hb.Q.value=1.4;hb.connect(hg);const hl=a.createGain();hl.gain.value=.5;hl.connect(hg);
  for(const [f,v,type] of [[120,.5,'sawtooth'],[240,.25,'square'],[60,.6,'sine'],[360.4,.12,'sawtooth']]){const o=a.createOscillator();o.type=type;o.frequency.value=f;const og=a.createGain();og.gain.value=v;o.connect(og);og.connect(type==='sine'?hl:hb);o.start();nodes.push({stop:()=>{try{o.stop();}catch{}}});}
  // tape hiss
  const tg=gain(a,.012),tf=a.createBiquadFilter();tf.type='highpass';tf.frequency.value=3500;tf.connect(tg);loop(a,noiseBuf(a,2,1),tf);
  return{wind:wg,windF:wf,windL:wl,rumble:rg,hum:hg,hiss:tg};}
 function sfx(kind){const a=ac;if(!a||!bus)return;const now=a.currentTime,out=gain(a,1);
  const burst=(len,type,freq,v,dec,q=.7)=>{const s=a.createBufferSource();s.buffer=noiseBuf(a,len,type==='white'?1:.06);const f=a.createBiquadFilter();f.type=type==='white'?'highpass':type;f.frequency.value=freq;f.Q.value=q;const g=a.createGain();s.connect(f);f.connect(g);g.connect(out);g.gain.setValueAtTime(v,now);g.gain.exponentialRampToValueAtTime(.0005,now+dec);s.start(now);s.stop(now+len);};
  if(kind==='glitch'){for(let i=0;i<5;i++){const s=a.createBufferSource();s.buffer=noiseBuf(a,.12,1);const g=a.createGain();s.connect(g);g.connect(out);const t=now+i*.11+Math.random()*.05;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.22,t+.01);g.gain.linearRampToValueAtTime(0,t+.09);s.start(t);}
   const o=a.createOscillator();o.type='square';o.frequency.setValueAtTime(1800,now);o.frequency.exponentialRampToValueAtTime(70,now+.7);const og=a.createGain();og.gain.setValueAtTime(.05,now);og.gain.exponentialRampToValueAtTime(.0005,now+.75);o.connect(og);og.connect(out);o.start(now);o.stop(now+.8);}
  if(kind==='crack'){burst(.35,'white',1200,.55,.28);burst(.5,'lowpass',400,.4,.4);}
  if(kind==='impact'){const o=a.createOscillator();o.frequency.setValueAtTime(85,now);o.frequency.exponentialRampToValueAtTime(28,now+.45);const og=a.createGain();og.gain.setValueAtTime(1,now);og.gain.exponentialRampToValueAtTime(.001,now+.6);o.connect(og);og.connect(out);o.start(now);o.stop(now+.65);
   burst(.5,'lowpass',520,.8,.45);burst(.25,'white',2500,.25,.18);
   const t=a.createOscillator(),tg=a.createGain();t.type='sine';t.frequency.value=5400;t.connect(tg);tg.connect(out);tg.gain.setValueAtTime(0,now);tg.gain.linearRampToValueAtTime(.04,now+.3);tg.gain.setValueAtTime(.04,now+1.6);tg.gain.exponentialRampToValueAtTime(.0004,now+7);t.start(now);t.stop(now+7.2);}
  if(kind==='breath'){const s=a.createBufferSource();s.buffer=noiseBuf(a,1.6,.5);const f=a.createBiquadFilter();f.type='bandpass';f.frequency.value=650;f.Q.value=.8;const g=a.createGain();s.connect(f);f.connect(g);g.connect(out);g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(.13,now+.55);g.gain.linearRampToValueAtTime(.02,now+.8);g.gain.linearRampToValueAtTime(.09,now+1.1);g.gain.linearRampToValueAtTime(0,now+1.55);s.start(now);}
  if(kind==='rustle'){for(let i=0;i<4;i++){const s=a.createBufferSource();s.buffer=noiseBuf(a,.3,.3);const f=a.createBiquadFilter();f.type='bandpass';f.frequency.value=1600+Math.random()*900;const g=a.createGain();s.connect(f);f.connect(g);g.connect(out);const t=now+i*.22+Math.random()*.1;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.07,t+.05);g.gain.linearRampToValueAtTime(0,t+.25);s.start(t);}}}
 // ---------- camcorder overlay ----------
 function overlay(parent){const o=document.createElement('div');o.className='intro120';
  o.innerHTML='<canvas class="i-grain" width="320" height="180"></canvas><i class="i-vig"></i><i class="i-black"></i><i class="i-white"></i><i class="i-lid t"></i><i class="i-lid b"></i>'+
   '<span class="i-osd tl"><b class="i-rec">●</b> REC</span><span class="i-osd tr">SP <i class="i-bat"></i></span><span class="i-osd bl i-tc">00:00:00</span><span class="i-osd br i-date"></span><span class="i-skip">空格 / 点击 跳过</span>';
  const st=document.createElement('style');st.textContent=`.intro120{position:absolute;inset:0;z-index:60;pointer-events:none;overflow:hidden}.intro120>i{position:absolute;left:0;right:0}
   .intro120 .i-grain{position:absolute;inset:0;width:100%;height:100%;image-rendering:pixelated;mix-blend-mode:screen;opacity:.16}
   .intro120 .i-vig{inset:0;background:radial-gradient(ellipse at 50% 50%,transparent 52%,rgba(0,0,0,.55) 100%)}
   .intro120 .i-black{inset:0;background:#000}.intro120 .i-white{inset:0;background:#fff8dc;opacity:0}
   .intro120 .i-lid{height:52%;background:#040302}.intro120 .i-lid.t{top:0;transform:translateY(-100%)}.intro120 .i-lid.b{bottom:0;transform:translateY(100%)}
   .intro120 .i-osd{position:absolute;font:400 22px Vonwaon16,monospace;color:#f2f0e6;text-shadow:2px 2px 0 rgba(0,0,0,.6);letter-spacing:.08em;opacity:.9}
   .intro120 .tl{left:5.5%;top:6%}.intro120 .tr{right:5.5%;top:6%}.intro120 .bl{left:5.5%;bottom:7%}.intro120 .br{right:5.5%;bottom:7%}
   .intro120 .i-rec{color:#e3241b;font-weight:400}.intro120 .i-bat{display:inline-block;width:30px;height:13px;border:2px solid #f2f0e6;margin-left:8px;vertical-align:-1px;background:linear-gradient(90deg,#f2f0e6 0 34%,transparent 34%)}
   .intro120 .i-skip{position:absolute;right:22px;bottom:14px;font:400 12px Vonwaon12,monospace;color:#d8d2b8;opacity:.55;letter-spacing:.06em}
   :root.intro120-on body *{visibility:hidden!important}:root.intro120-on canvas.intro120-world,:root.intro120-on .intro120,:root.intro120-on .intro120 *{visibility:visible!important}`;
  o.append(st);parent.append(o);const d=new Date(),M=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  o.querySelector('.i-date').textContent=`${M[d.getMonth()]}. ${String(d.getDate()).padStart(2,'0')} 1996`;return o;}
 // grain + tracking: drawn at 320x180 and blown up nearest-neighbour
 function drawGrain(a,amt,track){const c=a.grainC,g=a.grainG,img=a.grainImg,d=img.data;for(let i=0;i<d.length;i+=4){const v=Math.random()*255*amt;d[i]=v;d[i+1]=v*.96;d[i+2]=v*.9;d[i+3]=255;}
  // a rolling band of tracking noise + a few dropout streaks
  const by=(a.t*37)%220-20;for(let y=Math.max(0,Math.floor(by));y<Math.min(180,by+6+track*22);y++)for(let x=0;x<320;x++){const k=(y*320+x)*4,v=(Math.random()<.5?150:20)*(.2+track);d[k]=Math.min(255,d[k]+v);d[k+1]=Math.min(255,d[k+1]+v);d[k+2]=Math.min(255,d[k+2]+v);}
  const streaks=Math.floor(track*14+Math.random()*1.4);for(let s=0;s<streaks;s++){const y=Math.floor(Math.random()*180),x0=Math.floor(Math.random()*300),len=10+Math.random()*140;for(let x=x0;x<Math.min(320,x0+len);x++){const k=(y*320+x)*4;d[k]=d[k+1]=d[k+2]=235;}}
  g.putImageData(img,0,0);}
 function start({scene,camera,spawn,hole,parent,canvas,onDone}){if(act)return;
  const root=overlay(parent||document.body);canvas?.classList.add('intro120-world');document.documentElement.classList.add('intro120-on');
  const W=build(hole);const grainC=root.querySelector('.i-grain'),grainG=grainC.getContext('2d');
  // the Level 0 plenum void cap (3.6 m) would hide the opening during the short room glimpse
  const voids=new Set();scene.traverse(o=>{const m=o.material;if(o.isMesh&&m&&!Array.isArray(m)&&m.isMeshBasicMaterial&&m.color&&m.color.getHex()===0x090908&&m.visible)voids.add(m);});for(const m of voids)m.visible=false;
  // approach: start offset from the hole and drift onto it as the height runs out
  const ang=Math.random()*Math.PI*2;
  act={t:0,scene,camera,spawn,hole,root,W,canvas,onDone,shards:[],flags:{},blur:0,shake:0,voids,grainC,grainG,grainImg:grainG.createImageData(320,180),
   off:{x:Math.cos(ang)*9,z:Math.sin(ang)*9},yaw0:spawn.yaw+2.2,far0:camera.far,fov0:camera.fov,au:startAudio(),prev:null,elab:root.querySelector('.i-tc')};
  const skip=e=>{if(!act)return;if(e.type==='keydown'&&!['Space','Enter','Escape'].includes(e.code))return;e.preventDefault?.();if(act.t<TEND-.3)act.t=TEND-.3;};act.skip=skip;
  addEventListener('keydown',skip,true);addEventListener('mousedown',skip,true);sfx('glitch');}
 function finish(){if(!act)return;const a=act;act=null;removeEventListener('keydown',a.skip,true);removeEventListener('mousedown',a.skip,true);
  a.W.sc.traverse(o=>{o.geometry?.dispose();o.material?.dispose?.();});a.root.remove();
  for(const sh of a.shards){if(!sh.rest){sh.m.position.y=.012;sh.m.rotation.set(0,sh.m.rotation.y,0);sh.rest=true;}}
  for(const m of a.voids||[])m.visible=true;a.camera.far=a.far0;a.camera.fov=a.fov0;a.camera.updateProjectionMatrix();
  a.canvas?.classList.remove('intro120-world');document.documentElement.classList.remove('intro120-on');if(a.canvas)a.canvas.style.filter='';
  if(ac&&bus){const now=ac.currentTime;bus.gain.cancelScheduledValues(now);bus.gain.setValueAtTime(bus.gain.value,now);bus.gain.linearRampToValueAtTime(0,now+.4);const ns=nodes;setTimeout(()=>{for(const n of ns)n.stop?.();},600);}nodes=[];bus=null;a.onDone?.();}
 const E=new T.Euler(0,0,0,'YXZ');
 // smooth handheld noise (sum of sines with incommensurate rates)
 const hand=(t,s)=>Math.sin(t*1.7+s)*.5+Math.sin(t*2.9+s*2.3)*.3+Math.sin(t*5.3+s*.7)*.2;
 function apply(camera,dt){if(!act)return false;const a=act;dt=Math.min(dt,.05);a.t+=a.below&&a.t<TI?dt*.22:dt;/* the 2.5 m through the lit room plays at camcorder slow motion */const t=a.t,S=a.spawn,H=a.hole,el=a.root,au=a.au;
  let x=H.x,y,z=H.z,yaw,pitch,roll=0,blackA=0,whiteA=0,lid=0,speed=0,track=0,inFall=false;
  if(t<TI){inFall=true;const ft=Math.max(0,t-TG),v=VT*Math.tanh(G*ft/VT),fallen=VT*VT/G*Math.log(Math.cosh(G*ft/VT));speed=v;
   y=Y0+FALL_H-fallen;const hf=cl((y-PY)/(FALL_H-PY+Y0),0,1);
   // drift onto the hole: lateral offset shrinks with height (quadratic so the last 20 m are almost vertical)
   const k=hf*hf;x=H.x+a.off.x*k;z=H.z+a.off.z*k;
   // view: out over the expanse at first, tipping straight down as the grid fills the frame
   const down=ease((1-hf-.45)/.5);pitch=lerp(-.52,-1.5,down);yaw=a.yaw0+t*.07+Math.sin(t*.4)*.12;roll=Math.sin(t*.55)*.16+Math.sin(t*.23+1)*.1;
   const sh=(v/VT);pitch+=hand(t*3,1)*.012*(1+sh*3);yaw+=hand(t*3,4)*.012*(1+sh*3);roll+=hand(t*4,7)*.02*(1+sh*2);
   // buffeting at speed: fast jitter
   x+=(Math.random()-.5)*.015*sh*sh;z+=(Math.random()-.5)*.015*sh*sh;pitch+=(Math.random()-.5)*.012*sh*sh;
   if(t<TG){blackA=1-ease((t-.35)/.75);track=1-t/TG*.6;y=Y0+FALL_H+Math.sin(t*2)*.04;}else track=.12+sh*.25;
   if(y<PY+.6&&!a.flags.crack){a.flags.crack=1;sfx('crack');for(let i=0;i<5;i++)a.shards.push(shard(a.scene,H));}
   whiteA=Math.max(0,1-(y-PY)/3)*.3;if(y<PY)whiteA=.12;
   if(au&&ac){const n=ac.currentTime,w=sh*sh;au.wind.gain.setTargetAtTime(.02+w*.75,n,.08);au.windF.frequency.setTargetAtTime(220+sh*1500,n,.1);au.windL.frequency.setTargetAtTime(500+sh*3500,n,.1);au.rumble.gain.setTargetAtTime(w*.6,n,.1);
    au.hum.gain.setTargetAtTime(.002+.06*Math.pow(1-hf,3),n,.15);}
   // the ceiling grid swells: tiny FOV push while falling (the camcorder auto-zoom hunting)
   camera.fov=a.fov0*(1-.08*Math.sin(Math.PI*cl(ft/TFALL,0,1)));camera.far=5000;
   // just below the ceiling: the real room
   if(y<PY){camera.far=a.far0;}}
  else{// on the floor
   if(!a.flags.hit){a.flags.hit=1;sfx('impact');a.shake=1;a.blur=7;camera.far=a.far0;camera.fov=a.fov0;if(au&&ac){const n=ac.currentTime;au.wind.gain.setTargetAtTime(0,n,.04);au.rumble.gain.setTargetAtTime(0,n,.05);au.hum.gain.setTargetAtTime(.05,n,1.5);}}
   const lieYaw=S.yaw+1.05,it=t-TI;track=Math.max(0,.9-it*1.6)+.05;
   if(t<TLIE){y=.24;roll=1.38;pitch=-.1;yaw=lieYaw;const br=Math.sin(it*1.9);y+=br*.008;pitch+=br*.012+hand(t,2)*.006;roll+=hand(t,5)*.008;
    if(!a.flags.b1&&it>1.2){a.flags.b1=1;sfx('breath');}if(!a.flags.b1b&&it>2.8){a.flags.b1b=1;sfx('breath');}
    const bl=(k,w)=>Math.max(0,1-Math.abs(t-k)/w);lid=Math.max(bl(TI+.6,.6)*.85,bl(TI+1.9,.42),bl(TI+3.0,.36)*.9);blackA=Math.max(0,1-it/.25)*.0;}
   else if(t<TKNEE){const k=easeO((t-TLIE)/(TKNEE-TLIE));roll=lerp(1.38,.06,k);y=lerp(.24,.72,ease((t-TLIE-.5)/1.4));pitch=lerp(-.1,-.95,ease((t-TLIE)/1.2))+hand(t*2,3)*.03;yaw=lerp(lieYaw,S.yaw+.3,k);
    x=lerp(H.x,S.x,k*.35);z=lerp(H.z,S.z,k*.35);if(!a.flags.r1){a.flags.r1=1;sfx('rustle');sfx('breath');}}
   else if(t<TEND){const k=ease((t-TKNEE)/(TEND-TKNEE)),w=(1-k);y=lerp(.72,S.eye,easeO((t-TKNEE)/(TEND-TKNEE-.3)))+hand(t*2,6)*.025*w;pitch=lerp(-.95,S.pitch,k)+hand(t*1.6,8)*.05*w;roll=.06*w+hand(t*1.3,9)*.06*w;yaw=lerp(S.yaw+.3,S.yaw,k)+hand(t,1)*.03*w;
    x=lerp(lerp(H.x,S.x,.35),S.x,k);z=lerp(lerp(H.z,S.z,.35),S.z,k);if(!a.flags.r2&&t>TKNEE+.4){a.flags.r2=1;sfx('rustle');}if(!a.flags.b3&&t>TKNEE+1.4){a.flags.b3=1;sfx('breath');}}
   else{y=S.eye;pitch=S.pitch;yaw=S.yaw;x=S.x;z=S.z;}
   whiteA=Math.max(0,1-it/.3)*.95;if(it<.12)blackA=Math.max(0,.8-it*6)*(Math.random()<.5?1:.2);}
  if(a.shake>0){a.shake=Math.max(0,a.shake-dt*1.6);const s=a.shake*a.shake;x+=(Math.random()-.5)*.07*s;y+=(Math.random()-.5)*.06*s;roll+=(Math.random()-.5)*.3*s;pitch+=(Math.random()-.5)*.15*s;}
  // motion blur from camera angular + linear speed, exposure breathing (auto-iris hunting), slight desaturation
  const q=[pitch,yaw,roll],pv=a.prev;let ang=0;if(pv)ang=Math.hypot(q[0]-pv[0],q[1]-pv[1],q[2]-pv[2])/Math.max(dt,.001);a.prev=q;
  a.blur=Math.max(0,a.blur-dt*(t<TLIE?1.3:2.6));const mb=Math.min(1.6,ang*.25+speed/VT*.7);const blur=a.blur+mb;
  const fade=1-ease((t-TEND+.2)/(TOUT-TEND+.2));const iris=1+(.07*Math.sin(t*1.3)+.04*Math.sin(t*3.1+1))*(inFall?1:.8)-(inFall?0:Math.max(0,.35-(t-TI)*.25));
  if(a.canvas)a.canvas.style.filter=fade>.01?`blur(${(blur*fade).toFixed(2)}px) brightness(${lerp(1,iris,fade).toFixed(3)}) saturate(${lerp(1,.78,fade).toFixed(2)}) contrast(${lerp(1,1.08,fade).toFixed(2)})`:'';
  // the plane follows the camera so the expanse never ends
  if(inFall){const W=a.W;W.plane.position.set(x,PY,z);W.mat.uniforms.uHole.value.set(H.x,H.z);W.mat.uniforms.uCam.value.set(x,y,z);W.mat.uniforms.uTime.value=t;W.sky.position.set(x,y,z);W.sky.scale.setScalar(4000);}
  for(const s of a.shards){if(s.rest)continue;s.v.y-=9.8*dt;s.m.position.addScaledVector(s.v,dt);s.m.rotation.x+=s.w.x*dt;s.m.rotation.z+=s.w.z*dt;if(s.m.position.y<=.012){s.m.position.y=.012;s.m.rotation.set(0,s.m.rotation.y,0);s.rest=true;}}
  a.frame=(a.frame||0)+1;if(a.frame%2===0)drawGrain(a,.45,track);
  el.querySelector('.i-grain').style.opacity=(.15*fade+.02).toFixed(3);el.querySelector('.i-vig').style.opacity=fade.toFixed(3);
  for(const o of el.querySelectorAll('.i-osd'))o.style.opacity=(.9*fade).toFixed(3);el.querySelector('.i-rec').style.visibility=(Math.floor(t*1.6)%2)?'hidden':'visible';
  const sec=Math.floor(t+3*60+12);a.elab.textContent=`00:${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`;
  el.querySelector('.i-black').style.opacity=blackA.toFixed(3);el.querySelector('.i-white').style.opacity=whiteA.toFixed(3);
  el.querySelector('.i-lid.t').style.transform=`translateY(${(-100+lid*100).toFixed(1)}%)`;el.querySelector('.i-lid.b').style.transform=`translateY(${(100-lid*100).toFixed(1)}%)`;
  camera.position.set(x,y,z);E.set(pitch,yaw,roll,'YXZ');camera.quaternion.setFromEuler(E);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
  a.inFall=inFall&&y>=PY;a.below=inFall&&y<PY;
  if(t>=TOUT)finish();return true;}
 return{start,apply,finish,get active(){return !!act;},get scene(){return act&&act.inFall?act.W.sc:null;},skipTo(v){if(act)act.t=v;},get t(){return act?.t;},duration:TOUT,fallHeight:FALL_H};
}
