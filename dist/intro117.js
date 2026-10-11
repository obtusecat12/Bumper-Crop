// V117 · first-run intro: you noclip out of nothing, fall through the Level 0 drop ceiling and land at the spawn.
// Beats (Kane Pixels FF1 noclip fall + found-footage get-ups as reference): 0–0.9 s black, hanging over a faint grid;
// 0.9–2.0 s free fall (real gravity) with a slow tumble towards the dusty tile backs and the glowing troffer housings;
// 2.0 s burst through the missing tile (light flash, tile shards follow you); 2.15 s impact (hard shake, white-out,
// blur, tinnitus); lying on your side, breathing, two slow blinks; 4.8–6.4 s roll over onto hands and knees, look at
// the carpet; 6.4–8.9 s unsteady rise to standing at the spawn view. Space / Enter / Esc / click skips.
// The camera is driven only through apply(camera) right before rendering, so the game's own rig is untouched.
export function createIntro117(T){
 let act=null;
 const ease=t=>t<=0?0:t>=1?1:t*t*(3-2*t),easeO=t=>1-Math.pow(1-Math.max(0,Math.min(1,t)),3),lerp=(a,b,t)=>a+(b-a)*t,cl=(v,a,b)=>Math.max(a,Math.min(b,v));
 function plenumTex(){const c=document.createElement('canvas');c.width=512;c.height=256;const g=c.getContext('2d');g.fillStyle='#7d786a';g.fillRect(0,0,512,256);
  const d=g.getImageData(0,0,512,256);for(let i=0;i<d.data.length;i+=4){const n=(Math.random()-.5)*26;d.data[i]+=n;d.data[i+1]+=n;d.data[i+2]+=n*.8;}g.putImageData(d,0,0);
  g.globalAlpha=.18;for(let k=0;k<40;k++){g.fillStyle=k%3?'#5e5a50':'#9a9584';g.beginPath();g.ellipse(Math.random()*512,Math.random()*256,10+Math.random()*60,4+Math.random()*20,Math.random()*3,0,6.3);g.fill();}g.globalAlpha=1;
  g.fillStyle='#4e4c46';g.fillRect(0,0,512,6);g.fillRect(0,0,6,256);g.fillStyle='#a8a59a';g.fillRect(0,6,512,2);g.fillRect(6,0,2,256);
  const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.magFilter=T.NearestFilter;return t;}
 function build(scene,hole,lamps){const g=new T.Group();g.name='intro117';const N=26,tex=plenumTex(),PY=3.6;
  // the deck sits a little above the real 2.72 m ceiling so nothing of the streamed level pokes through it; a short dark
  // shaft joins the gap in the deck to the missing tile below
  const shaftM=new T.MeshBasicMaterial({color:0x2a2822,side:T.DoubleSide,fog:false});for(const [dx,dz,w,d] of [[.6,0,.02,.6],[-.6,0,.02,.6],[0,.3,1.2,.02],[0,-.3,1.2,.02]]){const b=new T.Mesh(new T.BoxGeometry(w,PY-2.72,d),shaftM);b.position.set(hole.x+dx,(PY+2.72)/2,hole.z+dz);g.add(b);}
  const tileMat=new T.MeshBasicMaterial({map:tex,color:0x6a675e,fog:false});
  // tile backs: one instanced quad per 1.2 × .6 tile, the fall tile left out
  const geo=new T.PlaneGeometry(1.2,.6).rotateX(-Math.PI/2);const pos=[];for(let a=-N/2;a<N/2;a++)for(let b=-N;b<N;b++){const x=hole.x+a*1.2,z=hole.z+b*.6;if(a===0&&b===0)continue;pos.push([x,z]);}
  const im=new T.InstancedMesh(geo,tileMat,pos.length);im.frustumCulled=false;const m=new T.Matrix4();pos.forEach(([x,z],i)=>{m.makeTranslation(x,PY,z);im.setMatrixAt(i,m);});g.add(im);
  // troffer housings: grey sheet-metal boxes; light bleeds out round their edges onto the tile backs
  const hous=new T.MeshBasicMaterial({color:0x55534d,fog:false}),glow=new T.MeshBasicMaterial({color:0xfff4d0,transparent:true,opacity:.55,blending:T.AdditiveBlending,depthWrite:false,fog:false,toneMapped:false});
  const ring=new T.PlaneGeometry(1.5,.9).rotateX(-Math.PI/2);for(const l of lamps){const b=new T.Mesh(new T.BoxGeometry(1.16,.13,.56),hous);b.position.set(l.x,PY+.07,l.z);g.add(b);const r=new T.Mesh(ring,glow);r.position.set(l.x,PY+.005,l.z);g.add(r);}
  // the hole itself glows from the lit room below
  const hg=new T.Mesh(new T.PlaneGeometry(1.6,1).rotateX(-Math.PI/2),glow.clone());hg.material.opacity=.35;hg.position.set(hole.x,PY+.01,hole.z);g.add(hg);
  // a duct and a few cables crossing the plenum
  const duct=new T.Mesh(new T.CylinderGeometry(.22,.22,18,14).rotateZ(Math.PI/2),new T.MeshBasicMaterial({color:0x8d9092,fog:false}));duct.position.set(hole.x+1.5,PY+.5,hole.z-2.4);g.add(duct);
  const cab=new T.MeshBasicMaterial({color:0x222,fog:false});for(let k=0;k<4;k++){const c=new T.Mesh(new T.CylinderGeometry(.012,.012,14,5).rotateX(Math.PI/2),cab);c.position.set(hole.x-2+k*1.3,PY+.04,hole.z+k*.4);c.rotation.y=k*.3-.4;g.add(c);}
  // darkness around everything above the ceiling
  const dark=new T.Mesh(new T.SphereGeometry(70,16,10),new T.MeshBasicMaterial({color:0x000000,side:T.BackSide,fog:false,depthWrite:false}));dark.position.set(hole.x,40,hole.z);dark.renderOrder=-10;g.add(dark);
  scene.add(g);return g;}
 function shard(scene,hole,i){const mat=new T.MeshStandardMaterial({color:0xd8d2bc,roughness:.95});const s=new T.Mesh(new T.BoxGeometry(.3+Math.random()*.3,.016,.2+Math.random()*.2),mat);
  s.position.set(hole.x+(Math.random()-.5)*.8,2.7,hole.z+(Math.random()-.5)*.4);scene.add(s);return{m:s,v:new T.Vector3((Math.random()-.5)*1.2,-1-Math.random()*2,(Math.random()-.5)*1.2),w:new T.Vector3(Math.random()*8,Math.random()*4,Math.random()*8),rest:false};}
 // ---- audio: rumble while falling, a dull body impact, then a tinnitus whine that fades ----
 let ac=null,nodes=[];function audio(){try{ac=ac||new (globalThis.AudioContext||globalThis.webkitAudioContext)();if(ac.state==='suspended')ac.resume();return ac;}catch{return null;}}
 function noise(a,len){const b=a.createBuffer(1,Math.round(a.sampleRate*len),a.sampleRate),d=b.getChannelData(0);let p=0;for(let i=0;i<d.length;i++){p+=(Math.random()*2-1-p)*.04;d[i]=p*3;}return b;}
 function sfx(kind){const a=audio();if(!a)return;const now=a.currentTime,out=a.createGain();out.connect(a.destination);nodes.push(out);
  if(kind==='wind'){const s=a.createBufferSource();s.buffer=noise(a,3);const f=a.createBiquadFilter();f.type='bandpass';f.frequency.setValueAtTime(200,now);f.frequency.linearRampToValueAtTime(900,now+1.2);s.connect(f);f.connect(out);out.gain.setValueAtTime(0,now);out.gain.linearRampToValueAtTime(.35,now+1.1);out.gain.linearRampToValueAtTime(0,now+1.35);s.start(now);s.stop(now+1.4);}
  if(kind==='crack'){const s=a.createBufferSource();s.buffer=noise(a,.3);const f=a.createBiquadFilter();f.type='highpass';f.frequency.value=900;s.connect(f);f.connect(out);out.gain.setValueAtTime(.5,now);out.gain.exponentialRampToValueAtTime(.001,now+.25);s.start(now);}
  if(kind==='impact'){const o=a.createOscillator();o.frequency.setValueAtTime(90,now);o.frequency.exponentialRampToValueAtTime(32,now+.35);o.connect(out);out.gain.setValueAtTime(.9,now);out.gain.exponentialRampToValueAtTime(.001,now+.5);o.start(now);o.stop(now+.55);
   const s=a.createBufferSource();s.buffer=noise(a,.4);const f=a.createBiquadFilter();f.type='lowpass';f.frequency.value=500;const g2=a.createGain();g2.gain.setValueAtTime(.6,now);g2.gain.exponentialRampToValueAtTime(.001,now+.35);s.connect(f);f.connect(g2);g2.connect(out);s.start(now);
   const t=a.createOscillator(),tg=a.createGain();t.type='sine';t.frequency.value=5200;t.connect(tg);tg.connect(a.destination);nodes.push(tg);tg.gain.setValueAtTime(0,now);tg.gain.linearRampToValueAtTime(.045,now+.25);tg.gain.setValueAtTime(.045,now+1.2);tg.gain.exponentialRampToValueAtTime(.0005,now+6);t.start(now);t.stop(now+6.2);}
  if(kind==='breath'){const s=a.createBufferSource();s.buffer=noise(a,1.2);const f=a.createBiquadFilter();f.type='bandpass';f.frequency.value=700;f.Q.value=.7;s.connect(f);f.connect(out);out.gain.setValueAtTime(0,now);out.gain.linearRampToValueAtTime(.12,now+.45);out.gain.linearRampToValueAtTime(0,now+1.1);s.start(now);}}
 // ---- overlay: black, white flash, blur, blink lids, skip hint ----
 function overlay(parent){const o=document.createElement('div');o.className='intro117';o.innerHTML='<i class="i-black"></i><i class="i-white"></i><i class="i-lid t"></i><i class="i-lid b"></i><span class="i-skip">空格 / 点击 跳过</span>';
  const st=document.createElement('style');st.textContent=`.intro117{position:absolute;inset:0;z-index:60;pointer-events:none}.intro117 i{position:absolute;left:0;right:0}.intro117 .i-black{inset:0;background:#000}.intro117 .i-white{inset:0;background:#fffbe8;opacity:0}
   .intro117 .i-lid{height:52%;background:#050403}.intro117 .i-lid.t{top:0;transform:translateY(-100%)}.intro117 .i-lid.b{bottom:0;transform:translateY(100%)}
   .intro117 .i-skip{position:absolute;right:22px;bottom:18px;font:400 12px Vonwaon12,monospace;color:#d8d2b8;opacity:.75;letter-spacing:.06em}
   :root.intro117-on body *{visibility:hidden!important}:root.intro117-on canvas.intro117-world,:root.intro117-on .intro117,:root.intro117-on .intro117 *{visibility:visible!important}`;o.append(st);parent.append(o);return o;}
 function start({scene,camera,spawn,hole,lamps,parent,canvas,onDone}){if(act)return;
  const root=overlay(parent||document.body);canvas?.classList.add('intro117-world');document.documentElement.classList.add('intro117-on');const group=build(scene,hole,lamps||[]);
  act={t:0,scene,spawn,hole,root,group,canvas,onDone,shards:[],flags:{},blur:0,shake:0,seed:Math.random()*10};
  const skip=e=>{if(!act)return;if(e.type==='keydown'&&!['Space','Enter','Escape'].includes(e.code))return;e.preventDefault?.();act.t=Math.max(act.t,8.9);};act.skip=skip;
  addEventListener('keydown',skip,true);addEventListener('mousedown',skip,true);sfx('wind');}
 function finish(){if(!act)return;const a=act;act=null;removeEventListener('keydown',a.skip,true);removeEventListener('mousedown',a.skip,true);a.scene.remove(a.group);a.group.traverse(o=>{o.geometry?.dispose();});
  a.root.remove();a.canvas?.classList.remove('intro117-world');document.documentElement.classList.remove('intro117-on');if(a.canvas)a.canvas.style.filter='';for(const n of nodes){try{n.gain.cancelScheduledValues(0);n.gain.value=0;}catch{}}nodes=[];a.onDone?.();}
 const E=new T.Euler(0,0,0,'YXZ');
 function apply(camera,dt){if(!act)return false;const a=act;a.t+=Math.min(dt,.05);const t=a.t,S=a.spawn,H=a.hole,el=a.root;
  const black=el.querySelector('.i-black'),white=el.querySelector('.i-white'),lt=el.querySelector('.i-lid.t'),lb=el.querySelector('.i-lid.b');
  let x=H.x,y,z=H.z,yaw=S.yaw+.6,pitch=-1.35,roll=0,blackA=0,whiteA=0,lid=0;
  const TF=.9,TC=1.99,TI=2.22,y0=9.6;
  if(t<TF){y=y0+Math.sin(t*2)*.03;roll=Math.sin(t*.8)*.08;blackA=1-ease(t/TF)*.9;}
  else if(t<TI){const ft=t-TF,v0=.6;y=y0-v0*ft-4.9*ft*ft;y=Math.max(y,.32);roll=(t-TF)*.9+Math.sin(t*5)*.03;yaw+=(t-TF)*.35;pitch=-1.35+ease((t-TC+.12)/.2)*.6;
   if(t>TC-.05&&!a.flags.crack){a.flags.crack=1;sfx('crack');for(let i=0;i<4;i++)a.shards.push(shard(a.scene,H,i));}
   whiteA=Math.max(0,1-Math.abs(t-TC)/.07)*.75;x+=Math.sin(t*3)*.05;}
  else{// on the floor
   if(!a.flags.hit){a.flags.hit=1;sfx('impact');a.shake=1;a.blur=9;}
   const lieYaw=S.yaw+.95;
   if(t<4.8){y=.3;roll=1.32;pitch=-.12;yaw=lieYaw;const br=Math.sin((t-TI)*2.4);y+=br*.006;if(!a.flags.b1&&t>3){a.flags.b1=1;sfx('breath');}
    const bl=k=>Math.max(0,1-Math.abs(t-k)/.28);lid=Math.max(bl(3.3),bl(4.2)*.9);}
   else if(t<6.4){const k=easeO((t-4.8)/1.6);roll=lerp(1.32,.05,k);y=lerp(.3,.78,ease((t-5.3)/1.1));pitch=lerp(-.12,-.85,ease((t-4.8)/1.0))+Math.sin(t*3)*.02;yaw=lerp(lieYaw,S.yaw+.25,k);x=lerp(H.x,S.x,k*.4);z=lerp(H.z,S.z,k*.4);if(!a.flags.b2){a.flags.b2=1;sfx('breath');}}
   else if(t<8.9){const k=ease((t-6.4)/2.5),w=Math.sin((t-6.4)*3.1)*(1-k);y=lerp(.78,S.eye,easeO((t-6.4)/2.2))+w*.03;pitch=lerp(-.85,S.pitch,k)+w*.04;roll=.05*(1-k)+w*.05;yaw=lerp(S.yaw+.25,S.yaw,k);x=lerp(lerp(H.x,S.x,.4),S.x,k);z=lerp(lerp(H.z,S.z,.4),S.z,k);if(!a.flags.b3&&t>7){a.flags.b3=1;sfx('breath');}}
   else{y=S.eye;pitch=S.pitch;yaw=S.yaw;x=S.x;z=S.z;blackA=Math.min(1,(t-8.9)/.25)*0;}
   whiteA=Math.max(0,1-(t-TI)/.35)*.9;}
  // impact shake: decaying noise on position + roll
  if(a.shake>0){a.shake=Math.max(0,a.shake-dt*2.2);const s=a.shake*a.shake;x+=(Math.random()-.5)*.06*s;y+=(Math.random()-.5)*.05*s;roll+=(Math.random()-.5)*.25*s;pitch+=(Math.random()-.5)*.12*s;}
  a.blur=Math.max(0,a.blur-dt*(t<5?1.4:3));if(a.canvas)a.canvas.style.filter=a.blur>.05?`blur(${a.blur.toFixed(2)}px) saturate(${(1-a.blur*.04).toFixed(2)})`:'';
  for(const s of a.shards){if(s.rest)continue;s.v.y-=9.8*Math.min(dt,.05);s.m.position.addScaledVector(s.v,Math.min(dt,.05));s.m.rotation.x+=s.w.x*dt;s.m.rotation.z+=s.w.z*dt;if(s.m.position.y<=.012){s.m.position.y=.012;s.m.rotation.set(0,s.m.rotation.y,0);s.rest=true;}}
  black.style.opacity=blackA.toFixed(3);white.style.opacity=whiteA.toFixed(3);lt.style.transform=`translateY(${(-100+lid*100).toFixed(1)}%)`;lb.style.transform=`translateY(${(100-lid*100).toFixed(1)}%)`;
  camera.position.set(x,y,z);E.set(pitch,yaw,roll,'YXZ');camera.quaternion.setFromEuler(E);camera.updateMatrixWorld(true);
  if(t>=9.15)finish();return true;}
 return{start,apply,get active(){return !!act;},finish,skipTo(v){if(act)act.t=v;},get t(){return act?.t;}};
}
