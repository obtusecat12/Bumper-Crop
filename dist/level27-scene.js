import * as T from './vendor/three.module.min.js';
import {SPRING_SHELL} from './level27-shell-data.js?v=63';
import {mergeGeometries,mergeVertices} from './vendor/BufferGeometryUtils.js';
import {CAVE_PLAN,CALCITE_OUTCROPS,STAIRS,TUNNEL_Y,poolFloor,wallPoint,roofHeight,roofPoint,cascadePath,STREAM_X,WASH_BASIN,radialLimit,inAnnex,ANNEX,streamPath,stairCenter} from './level27-layout.js?v=63';
import {springMaterials,springTextures} from './level27-materials.js?v=63';

import {createSpringDynamics} from './spring-dynamics.js?v=63';
import {bathTextures} from './bath-textures.js?v=62';
import {createMineLamp,createPrimitiveWashStation} from './spring-props-v63.js';
import {paintGeology,configureGeology,naturalTreads,organicStone} from './spring-geology-v63.js';
import {createSpringVolume} from './spring-volume-v63.js';
import {createSpringCascades,createFlowStream} from './spring-cascades-v63.js';
const UP=new T.Vector3(0,1,0);
export const SPRING_LIGHTS=[
 {p:[-1.72,2.00,1.16],color:0xffc58f,power:5.8,range:7},
 {p:[5.82,2.18,.72],color:0xffc58f,power:7.8,range:8},
 {p:[-.70,2.77,-1.72],color:0xffc58f,power:4.6,range:7},
 {p:[4.63,3.08,-5.9],color:0xffc58f,power:7.3,range:8}
];
function geoGrid(cols,rows,point,skip=()=>false){const p=[],uv=[],idx=[];for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){const q=point(i/cols,j/rows);p.push(...q.slice(0,3));uv.push(...q.slice(3,5));}for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){if(skip((i+.5)/cols,(j+.5)/rows))continue;const a=j*(cols+1)+i,b=a+cols+1;idx.push(a,b,a+1,a+1,b,b+1);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;}
function box(root,mat,x,y,z,w,h,d,name=''){const geometry=new T.BoxGeometry(w,h,d);if(mat.map){const uv=geometry.attributes.uv;for(let i=0;i<uv.count;i++){const f=Math.floor(i/4);uv.setXY(i,uv.getX(i)*(f<2?d:w)*.72,uv.getY(i)*(f===2||f===3?d:h)*.72);}}const mesh=new T.Mesh(geometry,mat);mesh.position.set(x,y,z);mesh.name=name;mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);return mesh;}
function rod(root,mat,a,b,r=.024){const p=new T.Vector3(...a),q=new T.Vector3(...b),v=q.clone().sub(p),mesh=new T.Mesh(new T.CylinderGeometry(r,r,v.length(),8),mat);mesh.position.copy(p).add(q).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(UP,v.normalize());mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);return mesh;}
function plaque(text,sub){const c=document.createElement('canvas');c.width=512;c.height=192;const ctx=c.getContext('2d');ctx.fillStyle='#b4ad91';ctx.fillRect(0,0,512,192);ctx.strokeStyle='#38413a';ctx.lineWidth=6;ctx.strokeRect(11,11,490,170);ctx.fillStyle='#26392f';ctx.textAlign='center';ctx.font='bold 44px sans-serif';ctx.fillText(text,256,79);ctx.font='22px sans-serif';ctx.fillText(sub,256,126);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return new T.MeshStandardMaterial({map:t,roughness:.95,side:T.DoubleSide});}

export function createLevel27(){
 const scene=new T.Scene();scene.name='Level 27 / 岩体泉';scene.background=new T.Color(0x030504);scene.userData.noAtmosphere=true;
 const mats=springMaterials(),clock={value:0},rockRoot=new T.Group();rockRoot.name='Continuous eroded limestone shell';scene.add(rockRoot);
 for(const mat of [mats.rock,mats.bed,mats.step])configureGeology(mat,springTextures(),clock,{bed:mat===mats.bed,base:mat===mats.step?'tufa-step':null});
 function mesh(g,m,name){if(m.vertexColors)paintGeology(g);const o=new T.Mesh(g,m);o.name=name;o.castShadow=o.receiveShadow=true;rockRoot.add(o);return o;}
 // A single implicit air/rock boundary joins the cave and tunnel. It has no
 // overlapping arch pieces, cracks to the outside, or layered coplanar surfaces.
 const unpack=(s,C)=>{const bytes=Uint8Array.from(atob(s),c=>c.charCodeAt(0));return new C(bytes.buffer);};
 const q=unpack(SPRING_SHELL.vertices,Int16Array),p=new Float32Array(q.length),uv=new Float32Array(q.length/3*2);
 for(let i=0;i<q.length;i++){p[i]=q[i]/SPRING_SHELL.scale;if(i%3===0){uv[i/3*2]=p[i]*.67;uv[i/3*2+1]=q[i+1]/SPRING_SHELL.scale*.67;}}
 const shell=new T.BufferGeometry();shell.setAttribute('position',new T.BufferAttribute(p,3));shell.setAttribute('uv',new T.BufferAttribute(uv,2));shell.setIndex(new T.BufferAttribute(unpack(SPRING_SHELL.indices,Uint32Array),1));const qn=unpack(SPRING_SHELL.normals,Int16Array);shell.setAttribute('normal',new T.Float32BufferAttribute(Array.from(qn,v=>v/16000),3));
 const shellMesh=mesh(shell,mats.rock,'Unified limestone / pool, enlarged dry annex, broad stream tunnel');shellMesh.userData.keepIndexed=true;
 // Surveyed continuous dry annex and pool bottom; no overlapping floor plates.
 mesh(geoGrid(160,128,(u,v)=>{const x=-2.7+u*9.3,z=-2.7+v*5.5;return[x,poolFloor(x||.0001,z||.0001),z,x*.67,z*.67];},(u,v)=>{const x=-2.7+u*9.3,z=-2.7+v*5.5;return Math.hypot(x,z)>radialLimit(x,z)+.065&&!inAnnex(x,z);}),mats.bed,'Spring bottom and separate dry rock annex');
 mesh(geoGrid(8,48,(u,v)=>{const z=-10.43+v*7.33,x=2.87+u*1.9;return[x,TUNNEL_Y+.008*Math.sin(x*7+z*2),z,x,z];}),mats.concrete,'Full-width dry tunnel path beside creek');
 // The creek has a genuine concave rock bed, physically joined to its curved outlet.
 const wholeStream=streamPath(),channelCurve=new T.CatmullRomCurve3(wholeStream.slice(0,9).map(p=>new T.Vector3(...p)),false,'centripetal');
 mesh(geoGrid(16,64,(u,v)=>{const c=channelCurve.getPoint(v),t=channelCurve.getTangent(v),side=new T.Vector3(-t.z,0,t.x).normalize(),off=(u-.5)*(1.31+.06*Math.sin(v*31));c.addScaledVector(side,off);return[c.x,c.y-.15+.26*Math.pow(Math.abs(u-.5)*2,3)+.025*Math.sin(u*24+v*81)*Math.sin(v*31),c.z,c.x*.8,c.z*.8];}),mats.rock,'Continuous 1.1m natural inflow creek bed and rock banks');
 box(rockRoot,mats.black,3.0,3.10,-10.50,3.9,3.0,.14,'Dark continuation of return tunnel');
 rockRoot.add(naturalTreads(mats.step));
 // Rounded flanking fragments seat into the same bed, never cover the pool.
 for(let i=0;i<64;i++){const t=(i+.35)/64,c=channelCurve.getPoint(t),v=channelCurve.getTangent(t),side=new T.Vector3(-v.z,0,v.x).normalize(),sg=i%2?1:-1;c.addScaledVector(side,sg*(.46+.11*Math.sin(i*2.3)));const r=.055+.035*(.5+.5*Math.sin(i*3.7));const stone=organicStone(mats.wetRock,[c.x,c.y-.035,c.z],[r*1.4,r,r*1.7],i);stone.name='Water-rounded creek cobble';rockRoot.add(stone);}
 const plate=box(rockRoot,plaque('M.E.G. / 27','RETURN  ←  ALONG THE STREAM'),4.76,2.60,-6.45,.025,.31,.88,'Wall-fixed return marker');plate.material.side=T.DoubleSide;const signRay=new T.Raycaster(new T.Vector3(3.7,2.60,-6.45),new T.Vector3(1,0,0));plate.position.x=(signRay.intersectObject(shellMesh)[0]?.point.x??4.9)-.002;
 const wash=createPrimitiveWashStation(T,mats);wash.group.position.set(WASH_BASIN.x,poolFloor(WASH_BASIN.x,WASH_BASIN.z),WASH_BASIN.z);scene.add(wash.group);
 const practicals=[];scene.updateMatrixWorld(true);
 for(let i=0;i<SPRING_LIGHTS.length;i++){const l=SPRING_LIGHTS[i],d=i===1||i===3?new T.Vector3(1,0,0):new T.Vector3(l.p[0],0,l.p[2]).normalize(),ray=new T.Raycaster(new T.Vector3(...l.p),d),hit=ray.intersectObject(shellMesh)[0],anchor=hit?.point||new T.Vector3(...l.p).addScaledVector(d,.20),lamp=createMineLamp(T,mats);lamp.group.position.copy(anchor).addScaledVector(d,-.022);lamp.group.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),d.negate());scene.add(lamp.group);lamp.emitter.castShadow=false;lamp.light.color.set(l.color);lamp.light.intensity=l.power;lamp.light.distance=l.range;lamp.light.decay=2;lamp.light.castShadow=i===1||i===2;lamp.light.shadow.mapSize.set(512,512);lamp.light.shadow.normalBias=.015;lamp.light.shadow.bias=-.0008;lamp.light.shadow.radius=3;lamp.group.updateMatrixWorld(true);l.p=lamp.light.getWorldPosition(new T.Vector3()).toArray();practicals.push({light:lamp.light,power:l.power});}
 scene.add(new T.AmbientLight(0xaec8bd,.26));
 const dynamics=createSpringDynamics(),tex=springTextures(),footRings=Array.from({length:4},()=>new T.Vector4(0,0,-100,0)),uniforms={clock,dynamicSlope:{value:dynamics.texture},footRings:{value:footRings},ripple:{value:tex['spring-ripples']},caustics:{value:tex['water-caustics']},reflection:{value:null},refraction:{value:null},sceneDepth:{value:null},eye:{value:new T.Vector3()},reflectMatrix:{value:new T.Matrix4()},nearFar:{value:new T.Vector2(.06,40)},ready:{value:0}};
 const waterMat=new T.ShaderMaterial({name:'Mineral spring / planar reflection and depth refraction',uniforms,side:T.DoubleSide,
  vertexShader:`varying vec3 wp;varying vec4 screenP,mirrorP;uniform mat4 reflectMatrix;void main(){vec4 p=modelMatrix*vec4(position,1.);wp=p.xyz;screenP=projectionMatrix*viewMatrix*p;mirrorP=reflectMatrix*p;gl_Position=screenP;}`,
  fragmentShader:`precision highp float;uniform float clock,ready;uniform sampler2D ripple,caustics,reflection,refraction,sceneDepth,dynamicSlope;uniform vec3 eye;uniform vec2 nearFar;uniform vec4 footRings[4];varying vec3 wp;varying vec4 screenP,mirrorP;
  float linearZ(float d){return nearFar.x*nearFar.y/(nearFar.y-d*(nearFar.y-nearFar.x));}
  float h(vec2 p){return texture2D(ripple,p*.56+vec2(clock*.012,-clock*.019)).r*.58+texture2D(ripple,p*.94+vec2(-clock*.016,clock*.006)).r*.42;}
  // Exact dielectric Fresnel from Clearwater / Lumaris (MIT).
  float waterFresnel(float ci){ci=clamp(ci,0.,1.);float ct=sqrt(1.-(1.-ci*ci)/(1.3335*1.3335));float rs=(ci-1.3335*ct)/(ci+1.3335*ct),rp=(1.3335*ci-ct)/(1.3335*ci+ct);return .5*(rs*rs+rp*rp);}
  void main(){vec2 p=wp.xz;float e=.015;vec2 n=vec2(h(p+vec2(e,0.))-h(p-vec2(e,0.)),h(p+vec2(0.,e))-h(p-vec2(0.,e)))*1.65;
   vec4 dyn=texture2D(dynamicSlope,p/5.6+.5);n+=(dyn.rg-.5)*.5;
   vec3 N=normalize(vec3(-n.x,1.,-n.y)),V=normalize(eye-wp);float fresnel=waterFresnel(max(dot(N,V),0.));vec2 uv=screenP.xy/screenP.w*.5+.5;
   vec2 refrUV=clamp(uv+n*.019,.003,.997);float depth=clamp(linearZ(texture2D(sceneDepth,refrUV).r)-linearZ(gl_FragCoord.z),0.,3.);
   vec3 trans=texture2D(refraction,refrUV).rgb*exp(-vec3(.72,.19,.36)*depth)+vec3(.026,.142,.091)*(1.-exp(-depth));
   vec2 ru=clamp(mirrorP.xy/mirrorP.w+n*.028,.003,.997);vec3 reflected=texture2D(reflection,ru).rgb;
   float cells=texture2D(caustics,p*.86+vec2(clock*.011,-clock*.009)+n*.065).r;float shimmer=texture2D(caustics,p*.91+vec2(-clock*.015,clock*.013)).r;
   trans+=vec3(.047,.094,.080)*pow(min(cells,shimmer)*1.28,1.5)*exp(-depth*.5)*clamp(1./(1.+(dyn.a-.5)*4.),.65,1.8);
   vec3 c=mix(trans,reflected,min(.84,fresnel));c=mix(vec3(.016,.033,.028),c,ready);
   vec3 L=normalize(vec3(-1.56,.4,-.96)-wp);float glint=pow(max(dot(reflect(-L,N),V),0.),160.);c+=vec3(.42,.26,.09)*glint;
   gl_FragColor=vec4(c,1.);
  }`});
 // Exact triangulated surveyed polygon: no rectangular clipping and no land cutouts.
 const wp=[0,0,0],wu=[.5,.5],wi=[];for(const [x,z] of CAVE_PLAN){wp.push(x,0,z);wu.push(x/5.2+.5,z/5.2+.5);}for(let i=0;i<CAVE_PLAN.length;i++)wi.push(0,(i+1)%CAVE_PLAN.length+1,i+1);const wg=new T.BufferGeometry();wg.setAttribute('position',new T.Float32BufferAttribute(wp,3));wg.setAttribute('uv',new T.Float32BufferAttribute(wu,2));wg.setIndex(wi);wg.computeVertexNormals();
 const water=new T.Mesh(wg,waterMat);water.name='Clear warm spring water / bounded to basin';water.renderOrder=2;scene.add(water);
 const freefall=wholeStream.slice(8).map(p=>new T.Vector3(...p)),west=[];let minRadius=100;
 for(let i=0;i<=48;i++){const y=2.10*(1-i/48)+.014,a=3.57+.012*Math.sin(i*.8),p=wallPoint(a,y),r=Math.min(minRadius,Math.hypot(p[0],p[2])-.035);minRadius=r;west.push(new T.Vector3(Math.cos(a)*r,y,Math.sin(a)*r));}
 const cascade=createSpringCascades(T,{paths:[freefall,west],textures:tex,waterY:0});const falls=cascade.group;scene.add(falls);const impacts=cascade.impacts;
 const creek=createFlowStream(T,{points:wholeStream.slice(0,9).map(p=>new T.Vector3(...p)),width:1.02,textures:tex});scene.add(creek.group);
 const volume=createSpringVolume(T,{waterY:0,density:.85,lights:SPRING_LIGHTS,poolPlan:{points:CAVE_PLAN}});scene.userData.springVolume={compose:(renderer,color,depth,camera,w,h)=>volume.compose(renderer,color,depth,camera,w,h,clock.value)};
 const reflection=new T.WebGLRenderTarget(512,512,{type:T.HalfFloatType,depthBuffer:true}),refraction=new T.WebGLRenderTarget(640,480,{type:T.HalfFloatType,depthBuffer:true});refraction.depthTexture=new T.DepthTexture(640,480,T.UnsignedIntType);const mirrorCamera=new T.PerspectiveCamera(),target=new T.Vector3(),direction=new T.Vector3(),bias=new T.Matrix4().set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1);let frames=0;
 reflection.depthTexture=new T.DepthTexture(512,512,T.UnsignedIntType);uniforms.reflection.value=reflection.texture;uniforms.refraction.value=refraction.texture;uniforms.sceneDepth.value=refraction.depthTexture;
 let stepTravel=0,stepIndex=0,lastTime=0;
 function update(t,player){const dt=Math.max(0,Math.min(.06,t-lastTime));lastTime=t;clock.value=t;wash.timeUniform.value=t;cascade.update(t,dt);creek.update(t,dt);if(player?.wet){stepTravel+=player.moved;if(stepTravel>.20){stepTravel=0;footRings[stepIndex++%4].set(player.x,player.z,t,1);dynamics.drop(player.x,player.z,.16,.012);}}dynamics.update(dt,impacts.map(p=>[p.x??p[0],p.z??p[2]]));}
 const mirrorOpaque=new T.WebGLRenderTarget(512,512,{type:T.HalfFloatType,depthBuffer:true});mirrorOpaque.depthTexture=new T.DepthTexture(512,512,T.UnsignedIntType);
 scene.userData.prepareMainVfx=(camera,w,h)=>{cascade.bind(refraction.texture,refraction.depthTexture,w,h,camera);creek.bind(refraction.texture,refraction.depthTexture,w,h,camera);};
 function capture(renderer,camera){
  cascade.prepare(renderer);creek.prepare?.(renderer);uniforms.eye.value.copy(camera.position);uniforms.nearFar.value.set(camera.near,camera.far);frames++;
  const saved=renderer.getRenderTarget(),planes=renderer.clippingPlanes,auto=renderer.autoClear,shadowAuto=renderer.shadowMap.autoUpdate;
  const w=Math.min(768,Math.max(384,Math.round(432*camera.aspect))),h=432;if(refraction.width!==w||refraction.height!==h)refraction.setSize(w,h);
  water.visible=false;falls.visible=false;creek.group.visible=false;renderer.autoClear=true;
  try{
   renderer.setRenderTarget(refraction);renderer.render(scene,camera);renderer.shadowMap.autoUpdate=false;
   if(frames%2===1||!uniforms.ready.value){
    mirrorCamera.copy(camera);mirrorCamera.position.copy(camera.position);mirrorCamera.position.y=-camera.position.y;camera.getWorldDirection(direction);target.copy(camera.position).add(direction);target.y=-target.y;mirrorCamera.up.set(0,-1,0);mirrorCamera.lookAt(target);mirrorCamera.updateMatrixWorld(true);
    uniforms.reflectMatrix.value.copy(bias).multiply(mirrorCamera.projectionMatrix).multiply(mirrorCamera.matrixWorldInverse);renderer.clippingPlanes=[new T.Plane(UP,.018)];renderer.setRenderTarget(mirrorOpaque);renderer.render(scene,mirrorCamera);
    cascade.bind(mirrorOpaque.texture,mirrorOpaque.depthTexture,512,512,mirrorCamera);creek.bind(mirrorOpaque.texture,mirrorOpaque.depthTexture,512,512,mirrorCamera);falls.visible=true;creek.group.visible=true;
    renderer.setRenderTarget(reflection);renderer.render(scene,mirrorCamera);renderer.clippingPlanes=planes;
    uniforms.reflection.value=volume.composeReflection(renderer,reflection.texture,reflection.depthTexture,mirrorCamera,512,512,clock.value);uniforms.ready.value=1;
   }
  }finally{renderer.clippingPlanes=planes;renderer.shadowMap.autoUpdate=shadowAuto;renderer.autoClear=auto;renderer.setRenderTarget(saved);water.visible=true;falls.visible=true;creek.group.visible=true;}
 }
 let sound=null;
 function audio(ctx,master,active,position,yaw){if(!ctx)return;if(!sound){const out=ctx.createGain();out.gain.value=0;out.connect(master);const count=ctx.sampleRate*4,buffer=ctx.createBuffer(1,count,ctx.sampleRate),d=buffer.getChannelData(0);let low=0;for(let i=0;i<count;i++){low=(low+(Math.random()*2-1)*.03)/1.04;d[i]=low*2+(Math.random()*2-1)*.07;}const src=ctx.createBufferSource(),filter=ctx.createBiquadFilter();src.buffer=buffer;src.loop=true;filter.type='lowpass';filter.frequency.value=1650;src.connect(filter);filter.connect(out);const delay=ctx.createDelay(.5),feedback=ctx.createGain();delay.delayTime.value=.145;feedback.gain.value=.29;filter.connect(delay);delay.connect(feedback);feedback.connect(delay);feedback.connect(out);src.start();sound={out,src,filter,delay,feedback};}sound.out.gain.setTargetAtTime(active?.72:0,ctx.currentTime,.35);}
 function dispose(){scene.traverse(o=>{o.geometry?.dispose();});for(const m of new Set(Object.values(mats)))m.dispose();waterMat.dispose();reflection.dispose();refraction.dispose();mirrorOpaque.dispose();dynamics.dispose();cascade.dispose();creek.dispose();volume.dispose();sound?.src.stop();Object.values(sound||{}).forEach(n=>n.disconnect?.());}
 // Static stone and hardware share material batches. Point-light shadow maps
 // are rebuilt on entry, then reused for the two water capture views.
 rockRoot.updateMatrixWorld(true);const groups=new Map();
 for(const o of [...rockRoot.children]){if(!o.isMesh||o.userData.keepIndexed)continue;const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrix);if(!groups.has(o.material))groups.set(o.material,[]);groups.get(o.material).push(g);o.geometry.dispose();rockRoot.remove(o);}
 for(const [material,parts]of groups){let g=mergeGeometries(parts);parts.forEach(p=>p.dispose());mesh(g,material,'Batched limestone, dry bank and M.E.G. fittings / '+material.name);}
 // Layout proxy avoids raycasting a geological triangle soup at 8Hz.
 function focusDistance(camera,max){const d=new T.Vector3();camera.getWorldDirection(d);const p=camera.position;for(let t=.25;t<max;t+=.18){const x=p.x+d.x*t,y=p.y+d.y*t,z=p.z+d.z*t;const inside=Math.hypot(x,z)<radialLimit(x,z)||inAnnex(x,z)||(x>1.15&&x<4.85&&z<-1&&z>-10.5);if(!inside||y<poolFloor(x,z)||y>4.1)return t;}return max;}
 scene.updateMatrixWorld(true);return{scene,water,falls,materials:mats,uniforms,dynamics,update,capture,audio,dispose,focusDistance};
}
