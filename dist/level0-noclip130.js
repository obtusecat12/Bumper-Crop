// V130-D · Level 0 → Level 1 noclip (Phenomenon 5 "切行").
// After wandering Level 0 for a while, one nearby wall starts to flicker (texture frame-skipping, jittering
// geometry, z-fighting tears). Walking into it plays an old-game "clipped into 4D space" sequence:
// tear → walls go glass-clear and the room turns inside out → fall through an absolutely black curtain →
// the world rushes past from every side like a slow-motion roller coaster → emerge in Level 1.
// Skippable (Space / Enter / click). Everything lives in this module; main.js only forwards a few calls.
const TEAR=1.5,GHOST=3.7,FALL=4.8,RUSH_MIN=10.2,FADE_OUT=.45,EMERGE=1.7;
const WANDER_MIN=70,WANDER_SPAN=70; // seconds of real wandering before a wall may flicker

const PATCH_VS=`uniform float uTime,uAmp,uSeed;varying vec2 vUv;varying vec3 vW;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7))+uSeed)*43758.5453);}
void main(){vUv=uv;vec3 p=position;float st=floor(uTime*14.);
 float n=h(vec2(floor(uv.y*18.),st)),m=h(uv*31.+st);
 float edge=smoothstep(0.,.18,min(min(uv.x,1.-uv.x),min(uv.y,1.-uv.y)));
 p.x+=(n-.5)*.22*uAmp*edge*step(.55,h(vec2(st,7.)));p.z+=(m-.5)*.10*uAmp*edge;p.y+=(h(vec2(st,floor(uv.x*9.)))-.5)*.05*uAmp*edge;
 vec4 w=modelMatrix*vec4(p,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`;
const PATCH_FS=`uniform sampler2D uMap;uniform float uTime,uAmp,uSeed,uScale;uniform vec3 uTint;uniform vec2 uSize;varying vec2 vUv;varying vec3 vW;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7))+uSeed)*43758.5453);}
void main(){float st=floor(uTime*11.),band=floor(vUv.y*24.+h(vec2(st,3.))*4.);
 float r=h(vec2(band,st)),r2=h(vec2(band*1.7,st+9.));
 vec2 wuv=vUv*uSize/uScale;wuv+=vec2(floor(h(vec2(st,1.))*4.)*.25,floor(h(vec2(st,2.))*3.)*.333)*step(.35,uAmp*h(vec2(st,5.)));
 wuv.x+=(r-.5)*.6*uAmp*step(.6,r2);
 vec3 c=texture2D(uMap,fract(wuv)).rgb*uTint;
 float tear=step(1.-.42*uAmp,r);           // bands that drop out -> the real wall z-fights through
 float hole=step(1.-.20*uAmp,r2)*step(.5,h(vec2(st,band+4.))); // bands that show the void behind
 float edge=min(min(vUv.x,1.-vUv.x),min(vUv.y,1.-vUv.y));
 if(edge<.06*h(vec2(floor(vUv.y*40.),st))*uAmp+.004)discard;
 if(tear>.5&&hole<.5)discard;
 vec3 voidc=vec3(.02,.02,.03)+vec3(.35,.33,.22)*step(.93,fract(vW.y*3.1+uTime*.4))*h(vec2(st,band));
 c=mix(c,voidc,hole);c*=.82+.5*uAmp*h(vec2(st,11.));
 c.r=mix(c.r,texture2D(uMap,fract(wuv+vec2(.012*uAmp,0.))).r*uTint.r,.6*uAmp);
 gl_FragColor=vec4(c,1.);}`;
// Ghost override: every wall becomes faint additive glass with bright seams.
const GHOST_VS=`varying vec3 vW;varying vec3 vN;void main(){vec4 p=vec4(position,1.);
#ifdef USE_INSTANCING
p=instanceMatrix*p;
#endif
vec4 w=modelMatrix*p;vW=w.xyz;vN=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*w;}`;
const GHOST_FS=`uniform sampler2D uMap;uniform float uAlpha,uTime,uRange;uniform vec3 uTint;varying vec3 vW;varying vec3 vN;
void main(){vec3 N=normalize(vN),n=abs(N);vec2 uv=n.y>.6?vW.xz:(n.x>n.z?vW.zy:vW.xy);vec3 V=vW-cameraPosition;float dist=length(V);
 float fall=exp(-dist/uRange),rim=1.-abs(dot(N,V/max(dist,1e-3)));
 vec3 t=texture2D(uMap,fract(uv/1.02)).rgb;vec2 g=abs(fract(uv/1.2+.5)-.5);float seam=1.-smoothstep(.0,.025,min(g.x,g.y));
 float scan=.7+.3*sin(vW.y*9.+uTime*3.);
 vec3 c=t*uTint*(.12+.55*rim*rim)*scan+seam*.45*vec3(.85,.92,1.)*(.3+.7*rim);
 gl_FragColor=vec4(c*uAlpha*fall,1.);}`;

import {createRush143} from './level0-noclip143.js?v=143';
const NC4D=!/[?&]nc4d=0\b/.test(globalThis.location?.search||''); // V143 4D space; ?nc4d=0 = V130-D rush
export function createNoclip130({T,renderer,camera,displayFilter,audio,toast,zero,one,state,feet,enterOne,keys}){
 let wander=0,threshold=WANDER_MIN+Math.random()*WANDER_SPAN,searchCool=0,patch=null,touch=0,hinted=false,forced=false;
 let active=false,t=0,last=0,pin=null,skipReq=false,loadP=null,loaded=false,failed=false,origRender=null,rushEnd=RUSH_MIN,emergeT=-1;
 let base=null,saved=null,curtain=null,rush=null,snd=null,buzz=null,rnd=Math.random;
 const tmpV=new T.Vector3(),tmpQ=new T.Quaternion(),tmpE=new T.Euler(0,0,0,'YXZ');
 const wallMat=()=>zero()?.materials?.wall?.[0];
 const wallMap=()=>wallMat()?.map||null;
 const ghostMat=new T.ShaderMaterial({uniforms:{uMap:{value:null},uAlpha:{value:.5},uRange:{value:9},uTime:{value:0},uTint:{value:new T.Color(1,.93,.6)}},vertexShader:GHOST_VS,fragmentShader:GHOST_FS,transparent:true,depthWrite:false,depthTest:false,blending:T.AdditiveBlending,side:T.DoubleSide});
 ghostMat.name='noclip130-ghost';

 // ---------- the flickering wall ----------
 const solid=(x,z,f)=>{const w=zero();return !!w&&w.blocked(x,z,.04,f,1.7);};
 function findWall(front){const w=zero();if(!w)return null;const f=feet(),x=state.x,z=state.z,yaw=state.yaw;let best=null;
  const angs=front?[0,.18,-.18,.36,-.36,.6,-.6]:[0,.3,-.3,.6,-.6,.9,-.9,1.3,-1.3,1.8,-1.8,2.4,-2.4,3.14];
  for(const a of angs){const dx=-Math.sin(yaw+a),dz=-Math.cos(yaw+a);let px=x,pz=z,hit=false;
   for(let d=.3;d<=(front?3.2:6.5);d+=.15){const qx=x+dx*d,qz=z+dz*d;if(solid(qx,qz,f)){hit=true;break;}px=qx;pz=qz;}
   if(!hit)continue;
   // which axis did we cross?
   const sx=px+dx*.16,sz=pz+dz*.16;let nx=0,nz=0;
   if(solid(sx,pz,f)&&!solid(px,sz,f))nx=-Math.sign(dx);else if(solid(px,sz,f)&&!solid(sx,pz,f))nz=-Math.sign(dz);else if(Math.abs(dx)>Math.abs(dz))nx=-Math.sign(dx);else nz=-Math.sign(dz);
   // binary-search the surface along the normal
   let lo=0,hi=.2;for(let i=0;i<8;i++){const m=(lo+hi)/2;solid(px-nx*m,pz-nz*m,f)?hi=m:lo=m;}
   const cx=px-nx*(hi+.04),cz=pz-nz*(hi+.04),tx=-nz,tz=nx; // +r of the probe: the real face
   // lateral extent (wall, not a chair) and full height (blocked up near the ceiling too)
   let left=0,right=0;for(let s=.15;s<=1.1;s+=.15){if(solid(cx+tx*s-nx*.05,cz+tz*s-nz*.05,f)&&!solid(cx+tx*s+nx*.12,cz+tz*s+nz*.12,f))right=s;else break;}
   for(let s=.15;s<=1.1;s+=.15){if(solid(cx-tx*s-nx*.05,cz-tz*s-nz*.05,f)&&!solid(cx-tx*s+nx*.12,cz-tz*s+nz*.12,f))left=s;else break;}
   const width=left+right;if(width<(front?.6:1.2))continue;
   if(!w.blocked(cx-nx*.05,cz-nz*.05,.04,f+1.75,.5))continue;
   const dist=Math.hypot(cx-x,cz-z),score=Math.abs(a)*1.5+Math.abs(dist-2.6)*.6-width*.4;
   if(!best||score<best.score)best={score,x:cx+tx*(right-left)/2,z:cz+tz*(right-left)/2,nx,nz,width:Math.min(width,1.8),floor:f};
  }return best;}
 function spawn(wall){remove();const w=zero(),map=wallMap();if(!w||!wall)return false;
  const H=2.62,geo=new T.PlaneGeometry(wall.width,H,14,20);
  const mat=new T.ShaderMaterial({uniforms:{uMap:{value:map},uTime:{value:0},uAmp:{value:.3},uSeed:{value:rnd()*90},uScale:{value:1.02},uTint:{value:new T.Color(.66,.63,.38)},uSize:{value:new T.Vector2(wall.width,H)}},vertexShader:PATCH_VS,fragmentShader:PATCH_FS});
  const m=new T.Mesh(geo,mat);m.name='noclip130-wall';m.position.set(wall.x+wall.nx*.0015,wall.floor+H/2+.02,wall.z+wall.nz*.0015);m.rotation.y=Math.atan2(wall.nx,wall.nz);m.renderOrder=2;m.frustumCulled=false;
  w.scene.add(m);patch={mesh:m,wall,age:0,burst:0,next:.4};touch=0;startBuzz();return true;}
 function remove(){if(!patch)return;patch.mesh.parent?.remove(patch.mesh);patch.mesh.geometry.dispose();patch.mesh.material.dispose();patch=null;stopBuzz();}
 // V131: pushing only counts against a real wall face right in front (>=1.2 m wide, full height, within .95 m): never a
 // column, a crate or furniture, and a push never makes some other wall flicker (user 10-17: touching solid props made the
 // view jitter and the hand vanish = this noclip firing unexpectedly).
 let pushT=-1,pushW=null;function pushWall(){const now=performance.now();if(now-pushT<250)return pushW;pushT=now;const wl=findWall(true);pushW=wl&&wl.width>=1.2&&Math.hypot(wl.x-state.x,wl.z-state.z)<Math.max(.95,wl.width/2+.6)&&Math.abs((state.x-wl.x)*wl.nx+(state.z-wl.z)*wl.nz)<.95?wl:null;return pushW;}
 function force(front=false,strict=false){if(strict){const wl=pushWall();if(wl&&spawn(wl)){forced=true;if(!hinted){hinted=true;toast('墙面开始闪烁……走进它。');}return true;}return false;}const wall=findWall(front)||findWall(!front);if(wall&&spawn(wall)){forced=true;if(!hinted){hinted=true;toast('墙面开始闪烁……走进它。');}return true;}if(front)toast('附近找不到能闪烁的墙。');return false;}

 // update() is called by animateZero while playing in Level 0. Returns true when the noclip began.
 function update(dt,{pushing=false,ok=true,moving=0}={}){if(active)return true;
  if(!ok){if(patch&&patch.age>2&&!forced)remove();return false;}
  wander+=dt*(moving>.4?1:.25);
  if(patch){const p=patch,w=p.wall;p.age+=dt;const dx=state.x-w.x,dz=state.z-w.z,along=dx*w.nx+dz*w.nz,lat=Math.abs(dx*-w.nz+dz*w.nx),dist=Math.hypot(dx,dz);
   if(dist>18){remove();wander=threshold*.6;return false;}
   p.next-=dt;if(p.next<=0){p.burst=.35+rnd()*.9;p.next=.6+rnd()*1.8;crackle(.15+.35*Math.min(1,3/Math.max(dist,.5)));}
   p.burst=Math.max(0,p.burst-dt);const prox=1-Math.min(1,Math.max(0,dist-1)/7);
   const amp=Math.min(1,.18+prox*.35+(p.burst>0?.45:0)+(pushing&&along<.7?.4:0));
   p.mesh.material.uniforms.uTime.value+=dt;p.mesh.material.uniforms.uAmp.value=amp;p.mesh.visible=!(p.burst>0&&rnd()<.12);
   setBuzz(amp*prox,Math.atan2(dx,dz)-state.yaw);
   if(along<.62&&lat<w.width/2+.15&&(pushing||along<.36)&&p.age>.8){touch+=dt;if(touch>.3){begin();return true;}}else touch=Math.max(0,touch-dt);
   return false;}
  searchCool-=dt;if(wander>threshold&&searchCool<=0){searchCool=1.5;const wall=findWall(false);if(wall&&Math.hypot(wall.x-state.x,wall.z-state.z)>1.2&&spawn(wall)){forced=false;if(!hinted){hinted=true;toast('附近有一面墙在闪烁。');}}}
  return false;}

 // ---------- the sequence ----------
 function css(){if(document.getElementById('noclip130-css'))return;const s=document.createElement('style');s.id='noclip130-css';
  s.textContent='body.noclip130 #loading{display:none!important}body.noclip130 #game>:not(.noclip130-view):not(#toast){opacity:0!important;pointer-events:none!important}#noclip130-curtain{position:fixed;inset:0;background:#000;opacity:0;pointer-events:none;z-index:40}#noclip130-skip{position:fixed;right:22px;bottom:18px;font:12px/1.2 "Vonwaon","Courier New",monospace;color:#9a9a84;letter-spacing:.08em;opacity:.0;z-index:41;pointer-events:none;transition:opacity .6s}body.noclip130 #noclip130-skip{opacity:.75}';document.head.appendChild(s);
  curtain=document.createElement('div');curtain.id='noclip130-curtain';document.body.appendChild(curtain);const k=document.createElement('div');k.id='noclip130-skip';k.textContent='空格 / 点击 跳过';document.body.appendChild(k);}
 const onKey=e=>{if(!active)return;if(e.code==='Space'||e.code==='Enter'||e.code==='NumpadEnter'){e.preventDefault();e.stopPropagation();skipReq=true;}};
 const onClick=()=>{if(active&&t>.4)skipReq=true;};
 function begin(){if(active||state.level!==0)return false;const w=zero();if(!w)return false;css();
  active=true;t=0;last=performance.now();skipReq=false;loaded=false;failed=false;loadP=null;rushEnd=RUSH_MIN;emergeT=-1;keys?.clear?.();
  if(!patch)force(true);
  const fwd=new T.Vector3(-Math.sin(state.yaw),0,-Math.cos(state.yaw));
  const into=patch?new T.Vector3(-patch.wall.nx,0,-patch.wall.nz):fwd;
  base={pos:camera.position.clone(),quat:camera.quaternion.clone(),fov:camera.fov,far:camera.far,into,yaw:state.yaw,pitch:state.pitch};
  saved={bg:w.scene.background,fog:w.scene.fog};
  renderer.domElement?.classList?.add('noclip130-view');document.body.classList.add('noclip130');window.addEventListener('keydown',onKey,true);window.addEventListener('pointerdown',onClick,true);
  seqSound();return true;}
 function restoreZero(){const w=zero();if(!w||!saved)return;w.scene.overrideMaterial=null;w.scene.background=saved.bg;w.scene.fog=saved.fog;w.scene.position.set(0,0,0);w.scene.scale.set(1,1,1);w.scene.updateMatrixWorld(true);camera.fov=base.fov;camera.far=base.far;camera.updateProjectionMatrix();saved=null;remove();}
 function jitter(k,now){const st=Math.floor(now*.012);const r=i=>{const s=Math.sin(st*12.9898+i*78.233)*43758.5453;return s-Math.floor(s)-.5;};return [r(1)*k,r(2)*k,r(3)*k,r(4)*k];}
 function zeroFrame(now,dt){const w=zero();const s=w.scene,u=t;let k=0;
  camera.position.copy(base.pos);camera.quaternion.copy(base.quat);camera.fov=base.fov;
  if(u<TEAR){const a=u/TEAR;k=.2+a*.8;camera.position.addScaledVector(base.into,a*a*.55);
   if(patch){patch.mesh.material.uniforms.uAmp.value=Math.min(1,.6+a);patch.mesh.material.uniforms.uTime.value+=dt;patch.mesh.scale.set(1+a*.6,1+a*.15,1);patch.mesh.visible=true;}
   // frame-hop tearing: some frames the whole room snaps to the ghost/backface version
   const hop=Math.sin(Math.floor(now*.02)*91.7)>(.75-a*.6);s.overrideMaterial=hop?ghostMat:null;ghostMat.uniforms.uAlpha.value=.55+a*.3;ghostMat.uniforms.uRange.value=7;ghostMat.side=T.BackSide;
  }else if(u<GHOST){const a=(u-TEAR)/(GHOST-TEAR);k=.35*(1-a)+.12;camera.position.addScaledVector(base.into,.55+a*1.9);
   s.overrideMaterial=ghostMat;ghostMat.side=T.DoubleSide;ghostMat.uniforms.uAlpha.value=.75-.15*a;ghostMat.uniforms.uRange.value=6+a*10;s.background=null;s.fog=null;camera.far=240;
   // inside-out: the room folds over the eye line, mirroring into itself
   const fold=a<.35?0:Math.min(1,(a-.35)/.65),sy=Math.cos(fold*Math.PI),eye=base.pos.y;s.scale.set(1,sy,1);s.position.set(0,eye*(1-sy),0);s.updateMatrixWorld(true);
   tmpE.set(0,0,fold*fold*2.2*(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?.3:1));tmpQ.setFromEuler(tmpE);camera.quaternion.multiply(tmpQ);camera.fov=base.fov+fold*22;
  }else{const a=(u-GHOST)/(FALL-GHOST);k=.08;camera.position.addScaledVector(base.into,2.45);camera.position.y-=a*a*5.5;
   s.overrideMaterial=ghostMat;ghostMat.side=T.DoubleSide;ghostMat.uniforms.uAlpha.value=.6*(1-a);s.scale.set(1,-1,1);s.position.set(0,base.pos.y*2,0);s.updateMatrixWorld(true);
   tmpE.set(-a*.9,0,2.2);tmpQ.setFromEuler(tmpE);camera.quaternion.multiply(tmpQ);camera.fov=base.fov+22+a*18;
   curtain.style.opacity=String(Math.min(1,a*1.25));}
  ghostMat.uniforms.uTime.value=u;ghostMat.uniforms.uMap.value=wallMap();
  const j=jitter(k,now);camera.position.x+=j[0]*.06;camera.position.y+=j[1]*.04;tmpE.set(j[2]*.05,j[3]*.05,j[0]*.08);tmpQ.setFromEuler(tmpE);camera.quaternion.multiply(tmpQ);
  if(Math.abs(j[2])>.42*k&&k>.3)camera.fov+=j[3]*30*k; // the occasional wrong-FOV frame
  camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
  displayFilter.render(s,camera,now);}

 // ---------- the 4D rush ----------
 function buildRush(){if(NC4D){const R=createRush143(T,{l0Map:wallMap(),l1Url:new URL('./assets/level1/wall.webp',import.meta.url).href});return{v143:true,R,objs:[],src:'v143'};}
  const scene=new T.Scene();scene.background=new T.Color(0);const cam=new T.PerspectiveCamera(70,camera.aspect||1.6,.05,400);
  const pts=[];for(let i=0;i<14;i++){const a=i/14*Math.PI*2;pts.push(new T.Vector3(Math.cos(a)*70+Math.sin(a*3)*18,Math.sin(a*2)*22+Math.cos(a*5)*8,Math.sin(a)*55+Math.cos(a*2)*20));}
  const path=new T.CatmullRomCurve3(pts,true,'catmullrom',.5);
  const map=wallMap(),zw=zero(),objs=[];
  // ghost copies of the real Level 0 batches, flung around the track
  const srcs=[];zw?.group?.traverse(o=>{if((o.isMesh||o.isInstancedMesh)&&o.geometry?.attributes?.position&&o.geometry.attributes.position.count>200)srcs.push(o);});
  srcs.sort((a,b)=>b.geometry.attributes.position.count-a.geometry.attributes.position.count);
  let budget=1500000;const picked=[];for(const o of srcs){const c=o.geometry.attributes.position.count*(o.isInstancedMesh?o.count:1);if(c>budget||picked.length>=5)continue;budget-=c;picked.push(o);}
  const tints=[[1,.93,.6],[.75,.82,1],[1,.8,.55],[.7,1,.85]];
  picked.forEach((o,i)=>{const mat=ghostMat.clone();mat.uniforms.uMap.value=map;mat.uniforms.uTint.value=new T.Color(...tints[i%4]);mat.uniforms.uAlpha.value=.5;mat.uniforms.uRange.value=14;
   const m=o.isInstancedMesh?new T.InstancedMesh(o.geometry,mat,o.count):new T.Mesh(o.geometry,mat);if(o.isInstancedMesh){m.instanceMatrix=o.instanceMatrix;}
   o.geometry.computeBoundingSphere?.();const c=o.geometry.boundingSphere?.center||new T.Vector3();
   const holder=new T.Group(),inner=new T.Group();inner.add(m);m.position.copy(c).multiplyScalar(-1);m.frustumCulled=false;holder.add(inner);
   inner.rotation.set(rnd()*6,rnd()*6,rnd()*6);
   holder.userData={spin:new T.Vector3((rnd()-.5)*.16,(rnd()-.5)*.16,(rnd()-.5)*.16),inner,off:new T.Vector3((rnd()-.5)*16,(rnd()-.5)*12,(rnd()-.5)*16),ph:rnd()*6.28};scene.add(holder);objs.push(holder);});
  // streaking wall panels / ceiling tiles / doors around the tube
  const N=260,pg=new T.PlaneGeometry(1.1,2.5),pm=new T.ShaderMaterial({uniforms:{uMap:{value:map},uTime:{value:0}},transparent:true,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide,
   vertexShader:`attribute vec3 tint;varying vec2 vUv;varying vec3 vT;varying float vF;void main(){vUv=uv;vT=tint;vec4 mv=modelViewMatrix*instanceMatrix*vec4(position,1.);vF=clamp(1.-(-mv.z)/90.,0.,1.);gl_Position=projectionMatrix*mv;}`,
   fragmentShader:`uniform sampler2D uMap;varying vec2 vUv;varying vec3 vT;varying float vF;void main(){vec3 t=texture2D(uMap,fract(vUv*vec2(1.08,2.45))).rgb;vec2 e=min(vUv,1.-vUv);float rim=1.-smoothstep(0.,.04,min(e.x,e.y));gl_FragColor=vec4((t*vT*.28+rim*.55*vT)*vF,1.);}`});
  const panels=new T.InstancedMesh(pg,pm,N),tint=new Float32Array(N*3),meta=[];const pal=[[1,.92,.55],[.95,.9,.75],[.6,.62,.66],[.8,.72,.5],[.55,.75,1]];
  for(let i=0;i<N;i++){const c=pal[i%5];tint.set(c,i*3);meta.push({u:-.02+rnd()*.1,r:2.5+rnd()*12,a:rnd()*6.28,va:(rnd()-.5)*.25,rot:new T.Euler(rnd()*6,rnd()*6,rnd()*6),vr:(rnd()-.5)*.5,du:rnd()*.004});}
  pg.setAttribute('tint',new T.InstancedBufferAttribute(tint,3));panels.frustumCulled=false;scene.add(panels);
  return{src:srcs.length+'/'+picked.length+'/'+(srcs[0]?srcs[0].geometry.attributes.position.count:0),scene,cam,path,objs,panels,meta,pm,u:0,m4:new T.Matrix4(),q:new T.Quaternion(),p:new T.Vector3(),s:new T.Vector3(1,1,1),up:new T.Vector3(0,1,0),fr:new T.Matrix4()};}
 function rushFrame(now,dt){if(rush.v143){const u=t-FALL;rush.R.update(u,dt,u/(RUSH_MIN-FALL),camera.aspect);rush.R.render(renderer);return;}
  const R=rush,u=t-FALL;R.cam.aspect=camera.aspect||R.cam.aspect;
  // slow motion: the track creeps, the world swings past — a little faster in the middle
  const speed=.0045+.0055*Math.sin(Math.min(1,u/6)*Math.PI);R.u=(R.u+dt*speed)%1;
  const p=R.path.getPointAt(R.u),q=R.path.getPointAt((R.u+.004)%1),tan=q.clone().sub(p).normalize(),p2=R.path.getPointAt((R.u+.012)%1).sub(q).normalize();
  const bank=T.MathUtils.clamp(tan.clone().cross(p2).y*28,-1.1,1.1);
  R.cam.position.copy(p);R.cam.up.copy(R.up);R.cam.lookAt(q);tmpE.set(0,0,bank+Math.sin(u*.37)*.25);tmpQ.setFromEuler(tmpE);R.cam.quaternion.multiply(tmpQ);
  R.cam.fov=72+Math.sin(u*.5)*6;R.cam.updateProjectionMatrix();
  for(const o of R.objs){const s=o.userData.spin,inn=o.userData.inner,of=o.userData.off,ph=o.userData.ph+u*.11;o.position.set(p.x+of.x*Math.cos(ph)-of.z*Math.sin(ph),p.y+of.y+Math.sin(ph*1.3)*3,p.z+of.x*Math.sin(ph)+of.z*Math.cos(ph));inn.rotation.x+=s.x*dt;inn.rotation.y+=s.y*dt;inn.rotation.z+=s.z*dt;}
  const fade=Math.min(1,u/1.2);R.objs.forEach(o=>o.userData.inner.children[0].material.uniforms.uAlpha.value=.5*fade);
  for(let i=0;i<R.meta.length;i++){const m=R.meta[i];m.u-=(.004+m.du*.5)*dt;if(m.u<-.025){m.u+=.1;m.a=rnd()*6.28;}m.a+=m.va*dt;m.rot.x+=m.vr*dt;m.rot.y+=m.vr*.7*dt;
   const c=R.path.getPointAt(((R.u+m.u)%1+1)%1);R.p.set(Math.cos(m.a)*m.r,Math.sin(m.a)*m.r,Math.sin(m.a*2)*m.r*.4).add(c);R.q.setFromEuler(m.rot);R.m4.compose(R.p,R.q,R.s);R.panels.setMatrixAt(i,R.m4);}
  R.panels.instanceMatrix.needsUpdate=true;R.pm.uniforms.uTime.value=u;
  origRender(R.scene,R.cam,now);}

 function emergeFrame(now){const o=one(),e=t-emergeT,a=Math.min(1,e/EMERGE);const s=o?.scene;if(!s){return;}
  if(!base.oneCam){base.oneCam={pos:camera.position.clone(),quat:camera.quaternion.clone(),fov:camera.fov};}
  camera.position.copy(base.oneCam.pos);camera.quaternion.copy(base.oneCam.quat);camera.fov=base.oneCam.fov;
  const k=(1-a)*(1-a);camera.position.y+=k*.9;const j=jitter(k*.8,now);camera.position.x+=j[0]*.05;tmpE.set(j[2]*.05,j[3]*.06,j[0]*.1+k*.5);tmpQ.setFromEuler(tmpE);camera.quaternion.multiply(tmpQ);camera.fov+=k*18;camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
  const hop=e<.9&&Math.sin(Math.floor(now*.02)*57.3)>.2+a;s.overrideMaterial=hop?ghostMat:null;ghostMat.side=T.DoubleSide;ghostMat.uniforms.uAlpha.value=.6;ghostMat.uniforms.uRange.value=8;ghostMat.uniforms.uTint.value.setRGB(.75,.82,1);
  curtain.style.opacity=String(Math.max(0,1-e/.55));
  origRender(s,camera,now);s.overrideMaterial=null;}

 function startLoad(){restoreZero();curtain.style.opacity='1';rush=buildRush();origRender=displayFilter.render;
  // while enterOne() warms Level 1 it renders into the canvas; paint the rush over each of those frames
  displayFilter.render=function(scene,view,now,before,skip){const r=origRender.call(displayFilter,scene,view,now,before,skip);if(active&&rush&&emergeT<0&&scene!==rush.scene){try{rushFrame(now,0);}catch{}}return r;};
  rushSound();loadP=Promise.resolve().then(()=>enterOne()).then(()=>{loaded=state.level===1;if(!loaded)failed=true;},err=>{console.error('noclip130 load',err);failed=true;});}
 function finish(ok=true){const o=one();if(o?.scene)o.scene.overrideMaterial=null;if(origRender){displayFilter.render=origRender;origRender=null;}
  if(rush?.v143){rush.R.dispose();rush=null;}
  if(rush){rush.panels.geometry.dispose();rush.pm.dispose();rush.objs.forEach(h=>h.userData.inner.children[0].material.dispose());rush=null;}
  if(base?.oneCam){camera.position.copy(base.oneCam.pos);camera.quaternion.copy(base.oneCam.quat);camera.fov=base.oneCam.fov;camera.updateProjectionMatrix();}
  ghostMat.uniforms.uTint.value.setRGB(1,.93,.6);if(saved)restoreZero();
  active=false;pin=null;curtain&&(curtain.style.opacity='0');document.body.classList.remove('noclip130');window.removeEventListener('keydown',onKey,true);window.removeEventListener('pointerdown',onClick,true);
  endSound();wander=0;threshold=WANDER_MIN+rnd()*WANDER_SPAN;forced=false;hinted=false;
  if(ok)toast('……你从黑暗里落了出来。Level 1 · 宜居地带。');else toast('切行失败——你仍在原地。');}
 function frame(now){if(!active)return;const dt=Math.min(.1,Math.max(0,(now-last)/1000));last=now;
  if(pin!==null)t=pin;else t+=dt;
  if(skipReq){skipReq=false;if(t<FALL)t=FALL-.001;rushEnd=Math.min(rushEnd,t+.6);}
  try{
   if(t<FALL){zeroFrame(now,dt);return;}
   if(!loadP)startLoad();
   if(failed){finish(false);return;}
   if(emergeT<0){const ready=loaded&&t>=rushEnd;if(ready&&pin===null){if(base.fadeAt==null)base.fadeAt=t;const f=(t-base.fadeAt)/FADE_OUT;curtain.style.opacity=String(Math.min(1,f));if(f>=1){emergeT=t;emergeSound();}}
    else curtain.style.opacity=String(Math.max(0,1-(t-FALL)/.7));
    rushFrame(now,dt);return;}
   emergeFrame(now);if(t-emergeT>=EMERGE&&pin===null)finish(true);
  }catch(e){console.error('noclip130',e);finish(false);}}

 // ---------- sound (Web Audio only) ----------
 let noiseBuf=null;
 const ctx=()=>{try{audio.start?.();}catch{}return audio.ctx;};
 function noise(c){if(noiseBuf)return noiseBuf;const n=c.sampleRate*2,b=c.createBuffer(1,n,c.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;return noiseBuf=b;}
 const out=()=>audio.master||audio.ctx.destination;
 function startBuzz(){const c=ctx();if(!c||buzz)return;try{const o=c.createOscillator(),f=c.createBiquadFilter(),g=c.createGain(),pan=c.createStereoPanner?.()||c.createGain();o.type='square';o.frequency.value=120;f.type='bandpass';f.frequency.value=1700;f.Q.value=3;g.gain.value=0;o.connect(f);f.connect(g);g.connect(pan);pan.connect(out());o.start();buzz={o,g,pan};}catch{}}
 function setBuzz(v,ang){if(!buzz)return;const c=audio.ctx;buzz.g.gain.setTargetAtTime(Math.min(.09,v*.08)*(Math.random()<.2?.2:1),c.currentTime,.03);if(buzz.pan.pan)buzz.pan.pan.setTargetAtTime(T.MathUtils.clamp(-Math.sin(ang),-1,1)*.8,c.currentTime,.1);}
 function stopBuzz(){if(!buzz)return;const b=buzz;buzz=null;try{b.g.gain.setTargetAtTime(0,audio.ctx.currentTime,.05);setTimeout(()=>{try{b.o.stop();b.o.disconnect();b.pan.disconnect();}catch{}},400);}catch{}}
 function crackle(v){const c=ctx();if(!c)return;try{const s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain(),t0=c.currentTime;s.buffer=noise(c);f.type='highpass';f.frequency.value=2400;g.gain.setValueAtTime(0,t0);for(let i=0;i<6;i++){const tt=t0+i*.03+Math.random()*.02;g.gain.setValueAtTime(v*(.3+Math.random()*.7)*.25,tt);g.gain.setValueAtTime(0,tt+.012);}s.connect(f);f.connect(g);g.connect(out());s.start(t0,Math.random());s.stop(t0+.3);}catch{}}
 function seqSound(){const c=ctx();if(!c)return;stopBuzz();try{const t0=c.currentTime,o=c.createOscillator(),o2=c.createOscillator(),g=c.createGain(),n=c.createBufferSource(),nf=c.createBiquadFilter(),ng=c.createGain();
  o.type='sawtooth';o.frequency.setValueAtTime(240,t0);o.frequency.exponentialRampToValueAtTime(32,t0+FALL);o2.type='square';o2.frequency.setValueAtTime(121,t0);o2.frequency.exponentialRampToValueAtTime(18,t0+FALL);
  g.gain.setValueAtTime(0,t0);g.gain.linearRampToValueAtTime(.07,t0+.25);g.gain.setValueAtTime(.07,t0+GHOST);g.gain.linearRampToValueAtTime(0,t0+FALL-.05);
  n.buffer=noise(c);n.loop=true;nf.type='lowpass';nf.frequency.setValueAtTime(5000,t0);nf.frequency.exponentialRampToValueAtTime(120,t0+FALL);ng.gain.setValueAtTime(.12,t0);ng.gain.linearRampToValueAtTime(.05,t0+TEAR);ng.gain.linearRampToValueAtTime(.16,t0+GHOST+.6);ng.gain.linearRampToValueAtTime(0,t0+FALL-.02);
  const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=900;o.connect(lp);o2.connect(lp);lp.connect(g);g.connect(out());n.connect(nf);nf.connect(ng);ng.connect(out());o.start(t0);o2.start(t0);n.start(t0);o.stop(t0+FALL+.1);o2.stop(t0+FALL+.1);n.stop(t0+FALL+.1);
  for(let i=0;i<5;i++)setTimeout(()=>crackle(.8),i*260+Math.random()*120);
  snd={stop:[o,o2,n]};}catch{}}
 function rushSound(){const c=ctx();if(!c)return;try{const t0=c.currentTime,n=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain(),lfo=c.createOscillator(),lg=c.createGain(),d1=c.createOscillator(),d2=c.createOscillator(),dg=c.createGain();
  n.buffer=noise(c);n.loop=true;n.playbackRate.value=.5;f.type='bandpass';f.frequency.value=420;f.Q.value=.8;lfo.frequency.value=.13;lg.gain.value=260;lfo.connect(lg);lg.connect(f.frequency);
  g.gain.setValueAtTime(0,t0);g.gain.linearRampToValueAtTime(.16,t0+1.4);n.connect(f);f.connect(g);g.connect(out());
  d1.type='sine';d2.type='sine';d1.frequency.value=55;d2.frequency.value=55.6;dg.gain.setValueAtTime(0,t0);dg.gain.linearRampToValueAtTime(.05,t0+2);d1.connect(dg);d2.connect(dg);dg.connect(out());
  n.start(t0);lfo.start(t0);d1.start(t0);d2.start(t0);
  const whoosh=()=>{if(!rush)return;try{const s=c.createBufferSource(),bf=c.createBiquadFilter(),wg=c.createGain(),p=c.createStereoPanner?.(),tt=c.currentTime,dur=.9+Math.random()*.9;s.buffer=noise(c);bf.type='bandpass';bf.Q.value=2.5;bf.frequency.setValueAtTime(300,tt);bf.frequency.exponentialRampToValueAtTime(1400+Math.random()*900,tt+dur*.5);bf.frequency.exponentialRampToValueAtTime(220,tt+dur);wg.gain.setValueAtTime(0,tt);wg.gain.linearRampToValueAtTime(.12,tt+dur*.5);wg.gain.linearRampToValueAtTime(0,tt+dur);s.connect(bf);bf.connect(wg);if(p){p.pan.setValueAtTime(Math.random()<.5?-1:1,tt);p.pan.linearRampToValueAtTime(0,tt+dur*.5);wg.connect(p);p.connect(out());}else wg.connect(out());s.start(tt,Math.random());s.stop(tt+dur+.05);}catch{}setTimeout(whoosh,500+Math.random()*900);};setTimeout(whoosh,900);
  snd={stop:[n,lfo,d1,d2],gains:[g,dg]};}catch{}}
 function emergeSound(){const c=ctx();if(!c)return;try{snd?.gains?.forEach(g=>g.gain.setTargetAtTime(0,c.currentTime,.25));const t0=c.currentTime,o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.setValueAtTime(90,t0);o.frequency.exponentialRampToValueAtTime(28,t0+.4);g.gain.setValueAtTime(.35,t0);g.gain.exponentialRampToValueAtTime(.001,t0+.6);o.connect(g);g.connect(out());o.start(t0);o.stop(t0+.7);}catch{}}
 function endSound(){const s=snd;snd=null;if(!s)return;try{s.gains?.forEach(g=>g.gain.setTargetAtTime(0,audio.ctx.currentTime,.2));setTimeout(()=>s.stop.forEach(n=>{try{n.stop();n.disconnect();}catch{}}),900);}catch{}}

 const api={update,frame,begin,force,remove,pushWall,get active(){return active},get flickering(){return !!patch},
  debug:{pin:v=>{pin=v;},get world(){return zero();},get patch(){return patch},get rush(){return rush},get t(){return t},get wander(){return wander},get threshold(){return threshold},set threshold(v){threshold=v},skip:()=>{skipReq=true;},state:()=>({active,t,loaded,failed,emergeT,patch:!!patch,wander,threshold,rushObjs:rush?rush.objs.length:-1,rushSrc:rush?rush.src:''})}};
 return api;}
