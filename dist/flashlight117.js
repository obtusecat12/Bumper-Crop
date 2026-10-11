// V117 · first-person flashlight: a right hand wrapped round a 2-cell aluminium torch, carried in front of the camera.
// Procedural geometry (no external model): knurled barrel, bezel + reflector + lens, rubber tail cap, a thumb that
// presses the tail-side switch. A real SpotLight (soft penumbra, inverse-square decay, projected ring cookie) plus an
// additive volumetric cone with drifting dust lights the world. The light lives in whichever scene is being rendered
// (prepare(scene) is called right before each render), and is never removed — only its intensity changes, so toggling
// never triggers a shader recompile. Shadows are off (the cost of a moving shadow map was not worth it here).
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
 const alu=new T.MeshStandardMaterial({color:0x3a3e44,roughness:.38,metalness:.85});
 const body=new T.MeshStandardMaterial({map:knurl,color:0xffffff,roughness:.55,metalness:.7});
 const rubber=new T.MeshStandardMaterial({color:0x111214,roughness:.9});
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
 function prepare(sc,camera){if(sc!==scene){rig.parent?.remove(rig);lightRig.parent?.remove(lightRig);scene=sc;if(sc){sc.add(rig);sc.add(lightRig);}}
  // follow the camera: the hand is a child of a camera-locked rig; the light rides the torch lens
  rig.position.copy(camera.position);rig.quaternion.copy(camera.quaternion);rig.updateMatrixWorld(true);
  lens.getWorldPosition(lightRig.position);if(sc)sc.worldToLocal(lightRig.position);torch.getWorldQuaternion(lightRig.quaternion);lightRig.updateMatrixWorld(true);fdir.set(0,0,1).applyQuaternion(lightRig.quaternion);}
 const fdir=new T.Vector3(0,0,1);
 function update(dt,{moving=0,running=false,yaw=0,pitch=0,step=0}={}){t+=dt;coneMat.uniforms.uT.value=t;
  raise+=((equipped?1:0)-raise)*Math.min(1,dt*7);rig.visible=raise>.02;
  // walk bob (figure-eight), turn sway lags the view, switch press, flicker on power-up
  const k=moving*(running?1.6:1),ph=step*Math.PI*2;const tx=Math.sin(ph*.5)*.012*k,ty=-Math.abs(Math.cos(ph*.5))*.01*k;
  bob.vx+=((tx-bob.x)*140-bob.vx*18)*dt;bob.x+=bob.vx*dt;bob.vy+=((ty-bob.y)*140-bob.vy*18)*dt;bob.y+=bob.vy*dt;
  if(lastYaw!==null){let dy=yaw-lastYaw;dy=Math.atan2(Math.sin(dy),Math.cos(dy));sway.x+=(dy*.35-sway.x)*Math.min(1,dt*8);sway.y+=((pitch-lastPitch)*.35-sway.y)*Math.min(1,dt*8);}lastYaw=yaw;lastPitch=pitch;
  sway.x*=Math.exp(-dt*6);sway.y*=Math.exp(-dt*6);press=Math.max(0,press-dt*5);
  const breathe=Math.sin(t*1.7)*.0025;
  hand.position.set(.2+bob.x+sway.x*.4,-.21+bob.y+breathe-(1-raise)*.3-press*.004,-.4);hand.rotation.set(-.04-sway.y*.6-press*.05,Math.PI+.08+sway.x*.8,-bob.x*1.4);
  thumb.children[0].rotation.x=-press*.25;btn.position.y=.017-press*.002;
  let I=on&&equipped?1:0;if(flick>0){flick-=dt;I*=flick>.12?(Math.sin(flick*90)>0?.3:1):1;}
  const lv=level;spot.intensity=I*(lv===10||lv===11?28:46);spot.decay=2;coneMat.uniforms.uI.value=I;cone.visible=I>0;lensMat.color.setScalar(I?1.6:.12);}
 function toggle(){if(!equipped)return;on=!on;press=1;click(on);if(on)flick=.22;}
 function setEquipped(v){if(v===equipped)return;equipped=v;}
 return{rig,prepare,update,toggle,setEquipped,setLevel(v){level=v;},get on(){return on&&equipped;},get beam(){return{p:lightRig.position,d:fdir,i:coneMat.uniforms.uI.value,cos:Math.cos(.46)};},get equipped(){return equipped;},spot};
}
