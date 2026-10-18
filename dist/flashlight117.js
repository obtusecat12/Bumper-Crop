// V117 · first-person flashlight: a right hand wrapped round a 2-cell aluminium torch, carried in front of the camera.
// Procedural geometry (no external model): knurled barrel, bezel + reflector + lens, rubber tail cap, a thumb that
// presses the tail-side switch. A real SpotLight (soft penumbra, inverse-square decay, projected ring cookie) plus an
// additive volumetric cone with drifting dust lights the world. The light lives in whichever scene is being rendered
// (prepare(scene) is called right before each render), and is never removed — only its intensity changes, so toggling
// never triggers a shader recompile. Shadows are off (the cost of a moving shadow map was not worth it here).
import {GLTFLoader} from './vendor/GLTFLoader.js';
// V117b: the hand is now the CC0 "PSX First Person Arms" by Drillimpact (assets/fp-arms-v117/CREDITS.txt). Its knife_idle
// fist is baked once on the CPU into a static mesh (no skinning at runtime: cheaper, and SwiftShader loses the context on
// skinned draws), the left arm is dropped, and the torch is parented to the hand.R bone frame so the fingers wrap it.
// Pivot pose (GR, GP) was tuned by eye in /workspace/work/fl/bake.html: an overhand grip, beam forward, forearm from below right.
const GRIP_ROLL=4.3,GRIP_POS=[.16,-.16,-.38],GRIP_EDITS={thumb02R:[-.7,0,0],thumb03R:[-.5,0,0],handR:[0,0,-.5]};let btnRest=null;
export function createFlashlight117(T){
 const rig=new T.Group();rig.name='flashlight117';rig.visible=false;
 const hand=new T.Group();rig.add(hand);
 const cv=(w,h,f)=>{const c=document.createElement('canvas');c.width=w;c.height=h;f(c.getContext('2d'),w,h);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;return t;};
 // skin: warm base, pores, a faint vein tone, knuckle creases are geometry
 const skinTex=cv(128,128,(g,w,h)=>{g.fillStyle='#c48d6c';g.fillRect(0,0,w,h);const d=g.getImageData(0,0,w,h);for(let i=0;i<d.data.length;i+=4){const n=(Math.random()-.5)*18;d.data[i]+=n;d.data[i+1]+=n*.8;d.data[i+2]+=n*.7;}g.putImageData(d,0,0);
  g.globalAlpha=.08;g.strokeStyle='#6a4a8a';for(let k=0;k<6;k++){g.beginPath();g.moveTo(Math.random()*w,0);g.bezierCurveTo(Math.random()*w,h*.3,Math.random()*w,h*.6,Math.random()*w,h);g.stroke();}});
 const knurl=cv(64,64,(g,w,h)=>{g.fillStyle='#2a2d31';g.fillRect(0,0,w,h);g.strokeStyle='#4a4f55';g.lineWidth=1;for(let i=-64;i<128;i+=4){g.beginPath();g.moveTo(i,0);g.lineTo(i+64,64);g.stroke();g.beginPath();g.moveTo(i+64,0);g.lineTo(i,64);g.stroke();}});
 knurl.repeat.set(6,3);
 const skin=new T.MeshStandardMaterial({map:skinTex,roughness:.62,metalness:0,color:0xffffff});
 const sleeve=new T.MeshStandardMaterial({color:0x2c3138,roughness:.95});
 const alu=new T.MeshStandardMaterial({color:0x6a7078,roughness:.42,metalness:.35,emissive:0x15171a});
 const body=new T.MeshStandardMaterial({map:knurl,color:0xc8ccd2,roughness:.55,metalness:.3,emissive:0x101214});
 const rubber=new T.MeshStandardMaterial({color:0x26282b,roughness:.9,emissive:0x08090a});
 const chrome=new T.MeshStandardMaterial({color:0xe8ecef,roughness:.12,metalness:1});
 const lensMat=new T.MeshBasicMaterial({color:0xfff2d0,toneMapped:false});
 const M=(geo,mat,parent=torch)=>{const m=new T.Mesh(geo,mat);parent.add(m);return m;};
 // ---- torch, local axis +Z forward (lens at +z) ----
 const torch=new T.Group();hand.add(torch);
 const cyl=(r0,r1,l,s=20)=>new T.CylinderGeometry(r1,r0,l,s,1).rotateX(Math.PI/2);
 M(cyl(.0165,.0165,.16),body).position.z=-.01;
 M(cyl(.0172,.0172,.012),alu).position.z=.074;M(cyl(.0172,.0172,.012),alu).position.z=-.092;
 M(cyl(.0175,.026,.045),alu).position.z=.1;           // head flare
 M(cyl(.027,.027,.014),alu).position.z=.128;          // bezel ring
 const refl=M(cyl(.024,.008,.012,24),chrome);refl.position.z=.128;
 const lens=M(new T.CircleGeometry(.0235,24),lensMat);lens.position.z=.1355;
 M(cyl(.017,.017,.022),rubber).position.z=-.1;        // tail cap
 const btn=M(new T.BoxGeometry(.012,.006,.016),rubber);btn.position.set(0,.017,-.055);
 // ---- hand (right): palm wraps the barrel from below/right; fingers curl over the far side ----
 const seg=(r,l)=>new T.CapsuleGeometry(r,l,4,8);
 const palm=new T.Mesh(new T.SphereGeometry(1,20,14),skin);palm.scale.set(.026,.042,.05);palm.position.set(.024,-.012,-.04);palm.rotation.set(0,.08,.5);hand.add(palm);
 // back of the hand with four knuckle bumps (what the player mostly sees)
 const back=new T.Mesh(new T.SphereGeometry(1,20,12),skin);back.scale.set(.02,.036,.046);back.position.set(.03,.014,-.045);back.rotation.set(0,.1,-.35);hand.add(back);
 for(let k=0;k<4;k++){const kn=new T.Mesh(new T.SphereGeometry(.0092,10,8),skin);kn.position.set(.022,.026,-.012-k*.0205);hand.add(kn);}
 const wrist=new T.Mesh(new T.CylinderGeometry(.026,.031,.12,16).rotateX(Math.PI/2),skin);wrist.position.set(.035,-.005,-.12);wrist.rotation.y=-.18;hand.add(wrist);
 const cuff=new T.Mesh(new T.CylinderGeometry(.045,.05,.16,14,1,true).rotateX(Math.PI/2),sleeve);cuff.position.set(.04,-.008,-.235);cuff.rotation.y=-.18;hand.add(cuff);
 // four fingers: three phalanges each, curling round the barrel (centre 0,0) at radius ~.027
 const fingers=[];for(let k=0;k<4;k++){const z=-.005-k*.0205,f=new T.Group();f.position.set(.03,-.004,z);hand.add(f);let parent=f;const L=[.024,.019,.016].map(v=>v*(k===3?.82:1));
  for(let j=0;j<3;j++){const g=new T.Group();g.rotation.z=j===0?1.95:1.25;parent.add(g);const m=new T.Mesh(seg(.0085-j*.0008,L[j]),skin);m.rotation.z=Math.PI/2;m.position.x=-L[j]/2;g.add(m);const nx=new T.Group();nx.position.x=-L[j];g.add(nx);parent=nx;}
  fingers.push(f);}
 // thumb rests on the switch
 const thumb=new T.Group();thumb.position.set(.028,.01,-.03);hand.add(thumb);const t1=new T.Group();t1.rotation.set(0,.5,-.25);thumb.add(t1);
 {const m=new T.Mesh(seg(.0095,.026),skin);m.rotation.x=Math.PI/2;m.position.z=-.016;t1.add(m);}
 const t2=new T.Group();t2.position.z=-.032;t2.rotation.set(0,-.95,0);t1.add(t2);{const m=new T.Mesh(seg(.0085,.02),skin);m.rotation.x=Math.PI/2;m.position.z=-.012;t2.add(m);}
 const nail=new T.Mesh(new T.BoxGeometry(.011,.002,.012),new T.MeshStandardMaterial({color:0xe6b8a2,roughness:.35}));nail.position.set(0,.007,-.018);t2.add(nail);
 hand.position.set(.2,-.21,-.4);hand.rotation.set(-.04,Math.PI+.08,0);
 // V132-flashlight: the barrel/head/caps/reflector/bulb/switch/lens now come from a Maglite-style CC-BY model ("Flashlight" by
 // Jarlan Perez, poly.pizza/m/1UrYBPWN1U_, assets/fp-torch-v132/CREDITS.txt), re-UV'd and repainted PS1-style by
 // tools/torch132_assets.py into this same torch frame (+Z forward, lens at LENS_Z, switch on +Y). lens/btn stay the same
 // objects (beam origin + thumb press keep working); only their geometry is swapped. ?torch=117 keeps the procedural torch.
 const torch132=!/[?&]torch=117\b/.test(globalThis.location?.search||'');
 if(torch132)new GLTFLoader().load('./assets/fp-torch-v132/torch.glb?v=132',g=>{try{
  const tex=new T.TextureLoader().load('./assets/fp-torch-v132/atlas.png?v=132');tex.colorSpace=T.SRGBColorSpace;tex.flipY=false;tex.magFilter=T.NearestFilter;tex.minFilter=T.NearestMipmapLinearFilter;
  const X=g.parser.json.extras||{},get=n=>g.scene.getObjectByName(n),bodyM=get('body'),sw=get('switch'),lz=get('lens');
  for(const o of [...torch.children])if(o!==lens&&o!==btn){torch.remove(o);o.geometry?.dispose();}
  bodyM.material=new T.MeshStandardMaterial({map:tex,roughness:.45,metalness:.35,emissive:0x0e1013});bodyM.position.set(0,0,0);torch.add(bodyM);
  btn.geometry.dispose();btn.geometry=sw.geometry;btn.material=new T.MeshStandardMaterial({map:tex,roughness:.85,metalness:0});
  lens.geometry.dispose();lens.geometry=lz.geometry;lens.position.z=X.LENS_Z??lens.position.z;lensMat.map=tex;lensMat.transparent=true;lensMat.needsUpdate=true;
  torch.traverse(o=>{if(o.isMesh){o.frustumCulled=false;o.castShadow=o.receiveShadow=false;}});
 }catch(e){console.warn('torch132 failed, keeping procedural torch',e);}},undefined,e=>console.warn('torch132 load failed',e));
 const armRoot=new T.Group();armRoot.visible=false;rig.add(armRoot);let armsReady=false;const btnN=new T.Vector3(0,1,0);
 // V119 grip (user 14:43: no overhand fist with the torch poking out of the top): the barrel now runs THROUGH the
 // curled fingers (axis = normal of the middle/ring finger curl plane), lens out of the index side, thumb straightened
 // along the top of the barrel onto the switch, beam converging on the view axis ~10 m ahead, forearm leaving the
 // frame to the lower right. Tuned in /workspace/work/fl/grip.html (solve()).
 new GLTFLoader().load('./assets/fp-arms-v117/arms.glb?v=117',g=>{try{const mixer=new T.AnimationMixer(g.scene),cl=g.animations.find(a=>a.name==='knife_idle');mixer.clipAction(cl).play();mixer.setTime(0);
  for(const[n,e]of Object.entries(GRIP_EDITS)){const bn=g.scene.getObjectByName(n);bn.quaternion.multiply(new T.Quaternion().setFromEuler(new T.Euler(...e)));}
  g.scene.updateMatrixWorld(true);
  let sk=null;g.scene.traverse(o=>{if(o.isSkinnedMesh)sk=o;});sk.skeleton.update();const src=sk.geometry,P=src.attributes.position,J=src.attributes.skinIndex,W=src.attributes.skinWeight,n=P.count,bones=sk.skeleton.bones;
  const camN=g.scene.getObjectByName('camera');const C=new T.Matrix4().makeTranslation(new T.Vector3().setFromMatrixPosition(camN.matrixWorld)).multiply(new T.Matrix4().makeRotationY(Math.PI)),inv=C.clone().invert();
  const bp=nm=>new T.Vector3().setFromMatrixPosition(g.scene.getObjectByName(nm).matrixWorld).applyMatrix4(inv);
  // grip frame of the fist: z = barrel axis (towards the index finger), y = towards the knuckles, origin = ring centre
  const ax=new T.Vector3();for(const f of['middle','ring']){const u1=bp('f_'+f+'02R').sub(bp('f_'+f+'01R')),u2=bp('f_'+f+'03R').sub(bp('f_'+f+'02R'));ax.add(u1.cross(u2).normalize());}ax.normalize();if(ax.dot(bp('f_index01R').sub(bp('f_pinky01R')))<0)ax.negate();
  const ctr=new T.Vector3();for(const f of['index','middle','ring','pinky'])for(const j of['01','02','03'])ctr.add(bp('f_'+f+j+'R'));ctr.multiplyScalar(1/12);
  const kn=bp('f_middle01R').add(bp('f_ring01R')).multiplyScalar(.5).sub(ctr);kn.addScaledVector(ax,-kn.dot(ax)).normalize();
  const F=new T.Matrix4().makeBasis(new T.Vector3().crossVectors(kn,ax),kn,ax).setPosition(ctr).invert();
  const P0=new T.Vector3(...GRIP_POS),fwd=new T.Vector3(0,0,-10).sub(P0).normalize(),up=new T.Vector3(Math.cos(GRIP_ROLL),Math.sin(GRIP_ROLL),0);up.addScaledVector(fwd,-up.dot(fwd)).normalize();
  const Tm=new T.Matrix4().makeBasis(new T.Vector3().crossVectors(up,fwd),up,fwd).setPosition(P0),M=Tm.clone().multiply(F).multiply(inv);
  const pos=new Float32Array(n*3),v=new T.Vector3(),isL=new Uint8Array(n);
  for(let i=0;i<n;i++){v.fromBufferAttribute(P,i);sk.applyBoneTransform(i,v);v.applyMatrix4(sk.matrixWorld).applyMatrix4(M);pos[i*3]=v.x;pos[i*3+1]=v.y;pos[i*3+2]=v.z;let best=0,bi=0;for(let k=0;k<4;k++){const w=W.getComponent(i,k);if(w>best){best=w;bi=J.getComponent(i,k);}}isL[i]=/L$/.test(bones[bi].name)?1:0;}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(pos,3));geo.setAttribute('uv',src.attributes.uv.clone());const idx=src.index.array,keep=[];for(let i=0;i<idx.length;i+=3)if(!(isL[idx[i]]||isL[idx[i+1]]||isL[idx[i+2]]))keep.push(idx[i],idx[i+1],idx[i+2]);geo.setIndex(keep);geo.computeVertexNormals();
  const map=sk.material.map;if(map){map.colorSpace=T.SRGBColorSpace;map.magFilter=T.NearestFilter;}
  const mat=new T.MeshStandardMaterial({map,color:0xd9cdc6,roughness:.7,metalness:0,side:T.DoubleSide});// V119 tint: the PSX arm texture reads orange under warm light
  const arm=new T.Mesh(geo,mat);arm.frustumCulled=false;
  // torch in the grip frame: barrel centred in the fist, tail just past the little finger, switch under the thumb pad
  const tg=new T.Group();Tm.decompose(tg.position,tg.quaternion,tg.scale);
  const th=new T.Vector3().setFromMatrixPosition(g.scene.getObjectByName('thumb03R').matrixWorld).applyMatrix4(M);tg.updateMatrixWorld(true);tg.worldToLocal(th);
  torch.removeFromParent();torch.position.set(0,0,.055);torch.rotation.set(0,0,0);tg.add(torch);
  const ang=Math.atan2(th.y,th.x);btn.position.set(Math.cos(ang)*.0175,Math.sin(ang)*.0175,th.z-.055-.004);btn.rotation.set(0,0,ang-Math.PI/2);btnRest=btn.position.clone();btnN.set(Math.cos(ang),Math.sin(ang),0);
  armRoot.add(arm,tg);torch.traverse(o=>{if(o.isMesh)o.frustumCulled=false;});
  hand.visible=false;armRoot.visible=true;armsReady=true;mixer.stopAllAction();}catch(e){console.warn('fp arms bake failed, keeping procedural hand',e);}},undefined,e=>console.warn('fp arms load failed',e));
 rig.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false;o.frustumCulled=false;}});

 // ---- light ----
 const cookie=(()=>{const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');const R=128;
  const gr=g.createRadialGradient(R,R,0,R,R,R);for(const [o,v] of [[0,1],[.12,.98],[.2,.78],[.26,.9],[.34,.55],[.5,.42],[.62,.3],[.7,.36],[.82,.12],[1,0]])gr.addColorStop(o,`rgba(255,255,255,${v})`);
  g.fillStyle='#000';g.fillRect(0,0,256,256);g.fillStyle=gr;g.fillRect(0,0,256,256);
  const d=g.getImageData(0,0,256,256);for(let i=0;i<d.data.length;i+=4){const n=(Math.random()-.5)*10;d.data[i]+=n;d.data[i+1]+=n;d.data[i+2]+=n;}g.putImageData(d,0,0);
  const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;})();
 const spot=new T.SpotLight(0xfff0d6,0,34,.42,.55,2);spot.map=cookie;spot.castShadow=false;const target=new T.Object3D();spot.target=target;
 // volumetric cone: additive, fades with distance from the lens and towards the cone edge, slow dust noise
 const coneLen=7,coneGeo=new T.ConeGeometry(Math.tan(.46)*coneLen,coneLen,32,1,true);coneGeo.translate(0,-coneLen/2,0);coneGeo.rotateX(-Math.PI/2);
 const coneMat=new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide,uniforms:{uI:{value:0},uT:{value:0}},
  vertexShader:`varying vec3 vP;varying vec3 vN;varying vec3 vV;void main(){vP=position;vec4 mv=modelViewMatrix*vec4(position,1.);vV=normalize(-mv.xyz);vN=normalize(normalMatrix*normal);gl_Position=projectionMatrix*mv;}`,
  fragmentShader:`uniform float uI,uT;varying vec3 vP;varying vec3 vN;varying vec3 vV;
   float h(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,45.164)))*43758.5453);}
   float n3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z);}
   void main(){float d=clamp(vP.z/${coneLen.toFixed(1)},0.,1.);float edge=pow(abs(dot(normalize(vN),normalize(vV))),1.6);
    float dust=.55+.45*n3(vP*vec3(6.,6.,2.)+vec3(0.,uT*.25,uT*.1))*n3(vP*2.3-vec3(uT*.07));
    float a=uI*edge*(1.-d)*(1.-d)*smoothstep(0.,.05,d)*dust*.22;gl_FragColor=vec4(vec3(1.,.93,.78)*a,a);}`});
 const cone=new T.Mesh(coneGeo,coneMat);cone.frustumCulled=false;cone.renderOrder=6;
 const lightRig=new T.Group();lightRig.add(spot,target,cone);target.position.set(0,0,10);
 let scene=null,on=false,equipped=false,level=0,flick=0,press=0,t=0,bob={x:0,y:0,vx:0,vy:0},sway={x:0,y:0},lastYaw=null,lastPitch=null,raise=0;
 let ac=null;function click(up){try{ac=ac||new (globalThis.AudioContext||globalThis.webkitAudioContext)();if(ac.state==='suspended')ac.resume();const sr=ac.sampleRate,b=ac.createBuffer(1,Math.round(sr*.06),sr),d=b.getChannelData(0);let p=0;
  for(let i=0;i<d.length;i++){const tt=i/sr;p+=(Math.random()*2-1-p)*.5;d[i]=(Math.sin(tt*6.283*(up?2600:2100))*.5+p*.6)*Math.exp(-tt*(up?700:450))+Math.sin(tt*6.283*(up?700:520))*.35*Math.exp(-tt*120);}
  const s=ac.createBufferSource(),g=ac.createGain();s.buffer=b;g.gain.value=.22;s.connect(g);g.connect(ac.destination);s.start();}catch{}}
 // V119 viewmodel pass: the hand + torch live in their own scene, drawn after the world into the same frame with a
 // fresh depth buffer and a camera with a 1 cm near plane, so they never sink into walls. Lighting is a per-level
 // ambient matched to each level's look. The world light (spot + cone) starts on the eye→lens ray at 40 % of the lens
 // distance: on screen it still leaves the lens, but it can never poke through a wall the player is touching.
 // V133-arms: the viewmodel is a pure screen layer. Its camera has a FIXED 72° FOV (the game default) and never follows the
// world camera's FOV: zoom (Z / right mouse, up to 4.5x), focus breathing near walls and the noclip FOV kick used to scale
// the hand/torch every frame, which read as the arm flying about whenever the player touched something. ?vmfov=world = old.
const VM_FOV=72,VM_FOLLOW=new URLSearchParams(globalThis.location?.search||'').get('vmfov')==='world';
const vmScene=new T.Scene();vmScene.add(rig);const vmCam=new T.PerspectiveCamera(VM_FOV,1,.01,6);
 const hemi=new T.HemisphereLight(0xfff2c8,0x5a4c2a,1.6),key=new T.DirectionalLight(0xfff4dc,.9);key.position.set(-.4,1,.6);vmScene.add(hemi,key);
 // V119b: the world pipeline leaves the frame display-encoded, so the viewmodel is encoded too (it was composited linear → dark red-orange skin); ambient retuned for that
 const LOOK={0:[0xfff6e0,0x8a7c58,1.5,.85],1:[0xdfe4e6,0x5a5e60,.9,.5],10:[0xfff8ec,0x8a8070,1.3,.8],11:[0xf2f4f8,0x6a6e74,1.2,.7]};
 torch.traverse(o=>{if(o.isMesh&&o.material.metalness>.05&&o.material!==chrome){o.material.metalness=.05;o.material.roughness=Math.max(.45,o.material.roughness);}});
 let vmTarget=null;const quadMat=new T.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,uniforms:{map:{value:null}},vertexShader:'varying vec2 vU;void main(){vU=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:'uniform sampler2D map;varying vec2 vU;void main(){vec4 c=texture2D(map,vU);if(c.a<.5)discard;gl_FragColor=sRGBTransferOETF(vec4(c.rgb,1.));}'});
 const quad=new T.Mesh(new T.PlaneGeometry(2,2),quadMat);quad.frustumCulled=false;const quadScene=new T.Scene();quadScene.add(quad);const quadCam=new T.OrthographicCamera(-1,1,1,-1,0,1);
 function overlay(renderer,target,view,w,h){if(!rig.visible||!view)return;
  if(!vmTarget||vmTarget.width!==w||vmTarget.height!==h){vmTarget?.dispose();vmTarget=new T.WebGLRenderTarget(w,h,{depthBuffer:true,minFilter:T.NearestFilter,magFilter:T.NearestFilter});vmTarget.texture.colorSpace=target?.texture?.colorSpace??T.NoColorSpace;quadMat.uniforms.map.value=vmTarget.texture;}
  vmCam.fov=VM_FOLLOW?(view.fov||70):VM_FOV;vmCam.aspect=w/h;vmCam.updateProjectionMatrix();
  const L=LOOK[level]||LOOK[0];hemi.color.setHex(L[0]);hemi.groundColor.setHex(L[1]);hemi.intensity=L[2];key.intensity=L[3];
  const old=renderer.getRenderTarget(),oc=renderer.getClearColor(new T.Color()),oa=renderer.getClearAlpha(),ab=renderer.autoClear;
  renderer.setRenderTarget(vmTarget);renderer.setClearColor(0x000000,0);renderer.clear(true,true,false);renderer.autoClear=false;renderer.render(vmScene,vmCam);
  renderer.setRenderTarget(target);renderer.render(quadScene,quadCam);renderer.autoClear=ab;renderer.setClearColor(oc,oa);renderer.setRenderTarget(old===vmTarget?target:old);}
 const lensP=new T.Vector3(),tq=new T.Quaternion();
 // V131: real eye speed (camera travel per second, low-passed) drives the walk bob. The game's velocity keeps its full value
 // while the body is blocked by a wall/crate/column, so the hand used to bob in place against solid props (read as a twitch).
 // V133-arms: speed is net travel over a 0.25 s window, so collision push-back jitter (in/out against a wall or crate)
// cancels out instead of kicking the bob; jumps > 20 m/s (teleport, level change, noclip push) reset the history.
const eyeHist=[];let eyeSpeed=0,eyeT=-1;
 function prepare(sc,camera){{const now=performance.now(),e=camera.getWorldPosition(lensP),ddt=eyeT<0?0:Math.max(1e-3,(now-eyeT)/1000);eyeT=now;const last=eyeHist[eyeHist.length-1];
  if(last&&Math.hypot(e.x-last.x,e.z-last.z)/ddt>20)eyeHist.length=0;eyeHist.push({x:e.x,z:e.z,t:now});while(eyeHist.length>2&&now-eyeHist[1].t>250)eyeHist.shift();
  const o=eyeHist[0],span=(now-o.t)/1000,d=span>.05?Math.min(8,Math.hypot(e.x-o.x,e.z-o.z)/span):0;eyeSpeed+=(d-eyeSpeed)*Math.min(1,ddt*6);}if(sc!==scene){lightRig.parent?.remove(lightRig);scene=sc;if(sc)sc.add(lightRig);}
  rig.position.set(0,0,0);rig.quaternion.identity();rig.updateMatrixWorld(true);
  lens.getWorldPosition(lensP).multiplyScalar(.4);torch.getWorldQuaternion(tq);
  camera.updateMatrixWorld();lightRig.position.copy(lensP).applyMatrix4(camera.matrixWorld);if(sc)sc.worldToLocal(lightRig.position);
  lightRig.quaternion.copy(camera.getWorldQuaternion(new T.Quaternion())).multiply(tq);lightRig.updateMatrixWorld(true);fdir.set(0,0,1).applyQuaternion(lightRig.quaternion);}
 const fdir=new T.Vector3(0,0,1);
 function update(dt,{moving=0,running=false,yaw=0,pitch=0,step=0}={}){t+=dt;coneMat.uniforms.uT.value=t;
  // V131: never pop out — while the L0→L1 noclip plays the hand is lowered out of frame with the same ease as unequipping
  const eq=equipped&&!globalThis.__bcNoclip?.active;raise+=((eq?1:0)-raise)*Math.min(1,dt*7);rig.visible=raise>.02;
  moving=Math.min(moving,eyeSpeed/2);
  // walk bob (figure-eight), turn sway lags the view, switch press, flicker on power-up
  const k=moving*(running?1.6:1),ph=step*Math.PI*2;const tx=Math.sin(ph*.5)*.012*k,ty=-Math.abs(Math.cos(ph*.5))*.01*k;
  bob.vx+=((tx-bob.x)*140-bob.vx*18)*dt;bob.x+=bob.vx*dt;bob.vy+=((ty-bob.y)*140-bob.vy*18)*dt;bob.y+=bob.vy*dt;
  if(lastYaw!==null){let dy=yaw-lastYaw;dy=Math.atan2(Math.sin(dy),Math.cos(dy));if(Math.abs(dy)>.5||Math.abs(pitch-lastPitch)>.5){dy=0;lastPitch=pitch;}/* V133: snap turns (respawn, level load) don't fling the arm */sway.x+=(dy*.35-sway.x)*Math.min(1,dt*8);sway.y+=((pitch-lastPitch)*.35-sway.y)*Math.min(1,dt*8);}lastYaw=yaw;lastPitch=pitch;
  sway.x*=Math.exp(-dt*6);sway.y*=Math.exp(-dt*6);sway.x=T.MathUtils.clamp(sway.x,-.06,.06);sway.y=T.MathUtils.clamp(sway.y,-.05,.05);bob.x=T.MathUtils.clamp(bob.x,-.02,.02);bob.y=T.MathUtils.clamp(bob.y,-.02,.01);press=Math.max(0,press-dt*5);
  const breathe=Math.sin(t*1.7)*.0025;
  hand.position.set(.2+bob.x+sway.x*.4,-.21+bob.y+breathe-(1-raise)*.3-press*.004,-.4);hand.rotation.set(-.04-sway.y*.6-press*.05,Math.PI+.08+sway.x*.8,-bob.x*1.4);armRoot.position.set(bob.x+sway.x*.4,bob.y+breathe-(1-raise)*.3-press*.004,0);armRoot.rotation.set(-sway.y*.6-press*.05,sway.x*.8,-bob.x*1.4);
  thumb.children[0].rotation.x=-press*.25;if(btnRest)btn.position.copy(btnRest).addScaledVector(btnN,-press*.002);else btn.position.y=.017-press*.002;
  let I=on&&equipped?1:0;if(flick>0){flick-=dt;I*=flick>.12?(Math.sin(flick*90)>0?.3:1):1;}
  const lv=level;spot.intensity=I*(lv===10||lv===11?28:46);spot.decay=2;coneMat.uniforms.uI.value=I;cone.visible=I>0;lensMat.color.setScalar(I?1.6:(torch132?.8:.12));lensMat.opacity=torch132&&!I?.35:1;}
 function toggle(){if(!equipped)return;on=!on;press=1;click(on);if(on)flick=.22;}
 function setEquipped(v){if(v===equipped)return;equipped=v;}
 return{rig,prepare,overlay,update,toggle,setEquipped,setLevel(v){level=v;},get on(){return on&&equipped;},get beam(){return{p:lightRig.position,d:fdir,i:coneMat.uniforms.uI.value,cos:Math.cos(.46)};},get equipped(){return equipped;},spot,cone,armRoot,torch};
}
