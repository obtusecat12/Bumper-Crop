import * as T from './vendor/three.module.min.js';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
import {CAVE_PLAN,CALCITE_OUTCROPS,STAIRS,TUNNEL_Y,poolFloor,wallPoint} from './level27-layout.js?v=56';
import {springMaterials,springTextures} from './level27-materials.js?v=56';

const UP=new T.Vector3(0,1,0);
export const SPRING_LIGHTS=[
 {p:[-1.61,.48,-1.04],color:0xffd39a,power:2.8,range:6},
 {p:[-.38,1.00,-1.30],color:0xffe3b3,power:2.7,range:6},
 {p:[-.05,2.75,-1.12],color:0x6c94d0,power:1.85,range:6},
 {p:[1.88,2.72,-3.9],color:0xffdfad,power:4.2,range:7}
];
function geoGrid(cols,rows,point,skip=()=>false){const p=[],uv=[],idx=[];for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){const q=point(i/cols,j/rows);p.push(...q.slice(0,3));uv.push(...q.slice(3,5));}for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){if(skip((i+.5)/cols,(j+.5)/rows))continue;const a=j*(cols+1)+i,b=a+cols+1;idx.push(a,b,a+1,a+1,b,b+1);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;}
function box(root,mat,x,y,z,w,h,d,name=''){const geometry=new T.BoxGeometry(w,h,d);if(mat.map){const uv=geometry.attributes.uv;for(let i=0;i<uv.count;i++){const f=Math.floor(i/4);uv.setXY(i,uv.getX(i)*(f<2?d:w)*.72,uv.getY(i)*(f===2||f===3?d:h)*.72);}}const mesh=new T.Mesh(geometry,mat);mesh.position.set(x,y,z);mesh.name=name;mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);return mesh;}
function rod(root,mat,a,b,r=.024){const p=new T.Vector3(...a),q=new T.Vector3(...b),v=q.clone().sub(p),mesh=new T.Mesh(new T.CylinderGeometry(r,r,v.length(),8),mat);mesh.position.copy(p).add(q).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(UP,v.normalize());mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);return mesh;}
function plaque(text,sub){const c=document.createElement('canvas');c.width=512;c.height=192;const ctx=c.getContext('2d');ctx.fillStyle='#b4ad91';ctx.fillRect(0,0,512,192);ctx.strokeStyle='#38413a';ctx.lineWidth=6;ctx.strokeRect(11,11,490,170);ctx.fillStyle='#26392f';ctx.textAlign='center';ctx.font='bold 44px sans-serif';ctx.fillText(text,256,79);ctx.font='22px sans-serif';ctx.fillText(sub,256,126);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return new T.MeshStandardMaterial({map:t,roughness:.95,side:T.DoubleSide});}

export function createLevel27(){
 const scene=new T.Scene();scene.name='Level 27 / 岩体泉';scene.background=new T.Color(0x030504);scene.userData.noAtmosphere=true;
 const mats=springMaterials(),clock={value:0},rockRoot=new T.Group();rockRoot.name='Continuous eroded limestone shell';scene.add(rockRoot);
 // Damp stone carries a restrained moving light pattern below the waterline.
 // The upper calcite contact fades into bedrock rather than ending as a panel.
 for(const mat of [mats.rock,mats.calcite,mats.bed]){
  mat.onBeforeCompile=s=>{
   s.uniforms.caveTime=clock;s.uniforms.caveRipple={value:springTextures()['spring-ripples']};s.uniforms.caveStrata={value:springTextures()['limestone-strata']};
   s.vertexShader='varying vec3 vCaveWorld;\n'+s.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvCaveWorld=(modelMatrix*vec4(transformed,1.)).xyz;');
   s.fragmentShader='varying vec3 vCaveWorld;uniform float caveTime;uniform sampler2D caveRipple,caveStrata;\n'+s.fragmentShader;
   if(mat===mats.calcite)s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',`vec4 calciteTexel=texture2D(map,vMapUv);float a=atan(vCaveWorld.z,vCaveWorld.x);if(a<0.)a+=6.2831853;float edge=smoothstep(4.08,4.26,a)*(1.-smoothstep(5.02,5.25,a));float cap=1.-smoothstep(2.02,2.96,vCaveWorld.y+.17*sin(vCaveWorld.x*6.)+.13*cos(vCaveWorld.z*7.));diffuseColor*=vec4(mix(texture2D(caveStrata,vMapUv).rgb*.69,calciteTexel.rgb,edge*cap),1.);`);
   s.fragmentShader=s.fragmentShader.replace('#include <opaque_fragment>',`float damp=1.-smoothstep(-.08,.12,vCaveWorld.y);float r1=texture2D(caveRipple,vCaveWorld.xz*.7+vec2(caveTime*.016,-caveTime*.011)).r;float r2=texture2D(caveRipple,vCaveWorld.xz*.91+vec2(-caveTime*.012,caveTime*.018)).r;float caustic=pow(max(0.,1.-abs(r1-r2)*11.),10.);outgoingLight+=vec3(.028,.021,.009)*caustic*damp;\n#include <opaque_fragment>`);
  };
  mat.customProgramCacheKey=()=>mat===mats.calcite?'spring-calcite-contact-v56':'spring-caustics-v56';
 }
 function mesh(g,m,name){const o=new T.Mesh(g,m);o.name=name;o.castShadow=o.receiveShadow=true;rockRoot.add(o);return o;}
 // The wall is a continuous, horizontally bedded surface. The pale sector has
 // integrated vertical calcite folds, not a pile of independently placed rocks.
 const N=CAVE_PLAN.length;

 for(let i=0;i<N;i++){
  const a=i/N*Math.PI*2,calcite=a>4.10&&a<5.23;
  mesh(geoGrid(4,64,(u,v)=>{const ang=(i+u)/N*Math.PI*2,y=-1.04+v*4.30;return[...wallPoint(ang,y),(i+u)*.155,y*.62];},(u,v)=>{const ang=(i+u)/N*Math.PI*2,[x,y,z]=wallPoint(ang,-1.04+v*4.30);const tx=(x-1.225)/.86,arch=2.35+1.14*Math.sqrt(Math.max(0,1-tx*tx));return(Math.abs(tx)<1&&z<-1.3&&y>1.28&&y<arch)||(Math.pow((ang-3.87)/.067,2)+Math.pow((y-1.10)/.14,2)<1);}),calcite?mats.calcite:mats.rock,calcite?'Flowstone / attached calcite folds':'Bedded limestone wall');
 }
 // Short rounded flowstone toes grow out of the wall into the water. Their
 // broad coalescing bases, irregular shoulders and rounded tips follow the photo.
 for(let j=0;j<CALCITE_OUTCROPS.length;j++){const [cx,cz,bottom,height,radius]=CALCITE_OUTCROPS[j];
  mesh(geoGrid(36,36,(u,v)=>{const a=u*Math.PI*2,y=bottom+v*height,r=radius*(.70+.30*Math.sin(v*Math.PI))*Math.pow(1-v,.35)*(1+.09*Math.sin(y*8+j)+.07*Math.cos(y*13-j)),relief=1+.085*Math.cos(a*6+v*1.7)+.043*Math.sin(a*11-v*3);return[cx+Math.cos(a)*r*relief+.02*Math.sin(y*3),y,cz+Math.sin(a)*r*relief,u*radius*5.4,y*.72];}),mats.calcite,'Coalescing rounded flowstone toe');
 }
 mesh(geoGrid(96,18,(u,v)=>{const k=Math.min(95,Math.floor(u*96)),f=u*96-k,p=CAVE_PLAN[k],q=CAVE_PLAN[(k+1)%96],x=(p[0]+(q[0]-p[0])*f)*v,z=(p[1]+(q[1]-p[1])*f)*v;return[x,poolFloor(x||.0001,z||.0001),z,x*.67,z*.67];}),mats.bed,'Mineral basin / shared walking bed');
 mesh(geoGrid(96,20,(u,v)=>{const a=u*Math.PI*2,p=wallPoint(a,3.26);return[p[0]*v,3.26+.60*Math.sqrt(1-v*v)+.08*Math.sin(a*7)*v*(1-v),p[2]*v,u*7,v*2];}),mats.rock,'Enclosed low limestone vault');
 // Tunnel arch intersects the cut doorway, with its own dry bank and stream.
 mesh(geoGrid(28,42,(u,v)=>{const a=u*Math.PI,z=-8.7+v*7.13,r=.84+.035*Math.sin(z*4+u*9),x=1.225+Math.cos(a)*r;return[x,2.35+Math.sin(a)*1.13,z,u*2.2,-z*.6];}),mats.rock,'Stream tunnel / arched roof');
 for(const side of[-1,1])mesh(geoGrid(42,12,(u,v)=>{const z=-8.7+u*7.12;return[1.225+side*(.81+.025*Math.sin(z*5+v*4)),1.32+v*1.08,z,-z*.6,v];}),mats.rock,'Stream tunnel / limestone side');
 box(rockRoot,mats.concrete,1.41,1.40,-5.16,1.18,.12,7.06,'M.E.G. dry tunnel bank');
 box(rockRoot,mats.bed,.60,1.31,-5.16,.42,.10,7.06,'Inflow stream bed');
 box(rockRoot,mats.black,1.225,2.5,-8.72,1.75,2.5,.14,'Return threshold / dark continuation');
 mesh(geoGrid(32,8,(u,v)=>{const a=u*Math.PI,r=1+v*.32;return[1.225+Math.cos(a)*.84*r,2.35+Math.sin(a)*1.13*r,-1.90-.10*Math.sin(a)-v*.14,u*2.2,v*.48];}),mats.rock,'Natural limestone rim around inflow tunnel');
 // Thirteen anchored treads continue below the waterline. The bottom tread
 // meets the natural basin slope, so the return route never needs a jump.
 for(let i=0;i<STAIRS.count;i++){const z=STAIRS.start+(i+.5)*STAIRS.tread,top=STAIRS.base+(STAIRS.count-i)*STAIRS.rise;box(rockRoot,mats.concrete,STAIRS.x,(top-.94)/2,z,STAIRS.width,top+.94,STAIRS.tread,'M.E.G. stair tread '+(i+1));box(rockRoot,mats.metal,STAIRS.x,top+.003,z+.10,STAIRS.width-.06,.007,.032,'Non-slip tread nosing');}
 for(const x of[.74,1.72]){rod(rockRoot,mats.metal,[x,2.45,-1.92],[x,.66,1.27],.027);rod(rockRoot,mats.metal,[x,1.98,-1.92],[x,.19,1.27],.023);for(let i=0;i<5;i++){const z=-1.78+i*.73,y=1.46-i*.45;rod(rockRoot,mats.metal,[x,y-.07,z],[x,y+1.0,z],.028);box(rockRoot,mats.metal,x,y-.04,z,.12,.022,.15);}}
 const plate=box(rockRoot,plaque('M.E.G. / 27','RETURN  ←  ALONG THE STREAM'),1.975,2.34,-3.9,.02,.34,.9,'Fixed tunnel return marker');
 plate.material.side=T.DoubleSide;
 // The drainage opening is deliberately narrower than a human body.
 box(rockRoot,mats.black,-1.73,-.035,1.46,.22,.14,.42,'Tiny impassable drainage channel');
 for(const z of[1.27,1.35,1.43,1.51,1.59])rod(rockRoot,mats.metal,[-1.85,.04,z],[-1.61,.04,z],.009);
 for(const l of SPRING_LIGHTS){const light=new T.PointLight(l.color,l.power,l.range,2);light.position.fromArray(l.p);light.castShadow=true;light.shadow.mapSize.set(512,512);light.shadow.bias=-.001;light.shadow.normalBias=.025;light.shadow.camera.near=.05;light.shadow.camera.far=l.range;scene.add(light);if(l===SPRING_LIGHTS[3]){box(rockRoot,mats.black,l.p[0]+.09,l.p[1],l.p[2],.12,.22,.15,'Recessed lamp housing');const o=new T.Mesh(new T.SphereGeometry(.035,8,6),mats.lamp);o.position.fromArray(l.p);scene.add(o);}}
 scene.add(new T.AmbientLight(0xb3b7a5,.18));
 const tex=springTextures(),footRings=Array.from({length:4},()=>new T.Vector4(0,0,-100,0)),uniforms={clock,footRings:{value:footRings},ripple:{value:tex['spring-ripples']},reflection:{value:null},refraction:{value:null},sceneDepth:{value:null},eye:{value:new T.Vector3()},reflectMatrix:{value:new T.Matrix4()},nearFar:{value:new T.Vector2(.06,40)},ready:{value:0}};
 const waterMat=new T.ShaderMaterial({name:'Mineral spring / planar reflection and depth refraction',uniforms,side:T.DoubleSide,
  vertexShader:`varying vec3 wp;varying vec4 screenP,mirrorP;uniform mat4 reflectMatrix;void main(){vec4 p=modelMatrix*vec4(position,1.);wp=p.xyz;screenP=projectionMatrix*viewMatrix*p;mirrorP=reflectMatrix*p;gl_Position=screenP;}`,
  fragmentShader:`precision highp float;uniform float clock,ready;uniform sampler2D ripple,reflection,refraction,sceneDepth;uniform vec3 eye;uniform vec2 nearFar;uniform vec4 footRings[4];varying vec3 wp;varying vec4 screenP,mirrorP;
  float linearZ(float d){return nearFar.x*nearFar.y/(nearFar.y-d*(nearFar.y-nearFar.x));}
  float h(vec2 p){return texture2D(ripple,p*.56+vec2(clock*.012,-clock*.019)).r*.58+texture2D(ripple,p*.94+vec2(-clock*.016,clock*.006)).r*.42;}
  void main(){vec2 p=wp.xz;float e=.015;vec2 n=vec2(h(p+vec2(e,0.))-h(p-vec2(e,0.)),h(p+vec2(0.,e))-h(p-vec2(0.,e)))*1.65;
   for(int i=0;i<2;i++){vec2 s=i==0?vec2(.52,-1.70):vec2(-1.60,-.97);vec2 v=p-s;float d=length(v);n+=normalize(v+vec2(.001))*cos(d*29.-clock*6.)*.021*exp(-d*1.7);}
   for(int i=0;i<4;i++){vec2 v=p-footRings[i].xy;float d=length(v),age=clock-footRings[i].z;float band=d-age*.42;n+=normalize(v+vec2(.001))*sin(band*32.)*.018*exp(-band*band*20.)*exp(-age*1.35)*footRings[i].w;}
   vec3 N=normalize(vec3(-n.x,1.,-n.y)),V=normalize(eye-wp);float fresnel=.035+.965*pow(1.-max(dot(N,V),0.),5.);vec2 uv=screenP.xy/screenP.w*.5+.5;
   vec2 refrUV=clamp(uv+n*.019,.003,.997);float depth=clamp(linearZ(texture2D(sceneDepth,refrUV).r)-linearZ(gl_FragCoord.z),0.,3.);
   vec3 trans=texture2D(refraction,refrUV).rgb*exp(-vec3(.51,.31,.18)*depth)+vec3(.013,.024,.021)*(1.-exp(-depth));
   vec2 ru=clamp(mirrorP.xy/mirrorP.w+n*.028,.003,.997);vec3 reflected=texture2D(reflection,ru).rgb;
   vec3 c=mix(trans,reflected,min(.84,fresnel));c=mix(vec3(.016,.033,.028),c,ready);
   vec3 L=normalize(vec3(-1.56,.4,-.96)-wp);float glint=pow(max(dot(reflect(-L,N),V),0.),160.);c+=vec3(.42,.26,.09)*glint;
   gl_FragColor=vec4(c,1.);
  }`});
 const wg=geoGrid(96,1,(u,v)=>{const k=Math.min(95,Math.floor(u*96)),f=u*96-k,p=CAVE_PLAN[k],q=CAVE_PLAN[(k+1)%96];return[(p[0]+(q[0]-p[0])*f)*v*.975,.0,(p[1]+(q[1]-p[1])*f)*v*.975,u,v];});
 const water=new T.Mesh(wg,waterMat);water.name='Clear warm spring water / bounded to basin';water.renderOrder=2;scene.add(water);
 // Moving fall sheets break into transparent strands and land in ripple rings.
 const fallMaterial=new T.ShaderMaterial({name:'Two miniature continuous waterfall sheets',uniforms:{clock,ripple:{value:tex['spring-ripples']}},transparent:true,depthWrite:false,side:T.DoubleSide,vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`precision highp float;uniform float clock;uniform sampler2D ripple;varying vec2 vUv;void main(){float q=texture2D(ripple,vec2(vUv.x*1.7,vUv.y*1.3+clock*.57)).r;float s=smoothstep(.44,.67,texture2D(ripple,vec2(vUv.x*7.3+sin(vUv.y*9.+clock*2.)*.04,vUv.y*.8+clock*.82)).r);float edge=smoothstep(0.,.13,vUv.x)*smoothstep(0.,.13,1.-vUv.x);float a=edge*(.06+.18*q+.24*s)*(1.-vUv.y*.18);gl_FragColor=vec4(vec3(.27,.32,.27)+q*.22,a);}`});
 const falls=new T.Group();falls.name='Exactly two wall-fed waterfalls';scene.add(falls);
 const port=wallPoint(3.87,1.10),outward=new T.Vector3(port[0],0,port[2]).normalize();
 const bore=new T.Mesh(new T.CylinderGeometry(.133,.133,.38,16,1,true),mats.rock);bore.quaternion.setFromUnitVectors(UP,outward);bore.position.set(port[0]+outward.x*.11,1.10,port[2]+outward.z*.11);scene.add(bore);
 const inner=new T.Mesh(new T.CircleGeometry(.134,20),mats.black);inner.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),outward);inner.position.copy(bore.position).addScaledVector(outward,.18);scene.add(inner);
 const lip=new T.Mesh(geoGrid(28,3,(u,v)=>{const a=u*Math.PI*2,r=.135+v*(.075+.015*Math.sin(a*5)),w=.011*Math.sin(a*7);return[Math.cos(a)*r,Math.sin(a)*r,-.025+v*.026+w,u*.6,v*.16];}),mats.rock);lip.quaternion.copy(inner.quaternion);lip.position.set(...port);rockRoot.add(lip);
 const sources=[[.52,-1.80,1.47,.29,0,1],[port[0],port[2],1.10,.21,-outward.x,-outward.z]];
 for(const [x,z,top,w,nx,nz]of sources){const g=geoGrid(10,25,(u,v)=>{const d=.045+v*v*(nx===0?.16:.52);return[x+(u-.5)*w*(1.+v*.28)*nz+nx*d,top*(1-v),z-(u-.5)*w*(1.+v*.28)*nx+nz*d,u,v];});const f=new T.Mesh(g,fallMaterial);f.name='Wall opening / falling mineral water';falls.add(f);}
 const streamNormal=tex['spring-ripples'].clone();streamNormal.repeat.set(.35,4.8);streamNormal.needsUpdate=true;const streamMaterial=new T.MeshStandardMaterial({name:'Shallow inflow stream / rippled clear water',color:0x46594b,roughness:.19,metalness:.15,bumpMap:streamNormal,bumpScale:.018,transparent:true,opacity:.42,depthWrite:false,side:T.DoubleSide});
 const stream=new T.Mesh(new T.PlaneGeometry(.31,6.85),streamMaterial);stream.rotation.x=-Math.PI/2;stream.position.set(.60,1.405,-5.2);stream.name='Inflow stream beside return bank';stream.receiveShadow=true;scene.add(stream);
 const splashGeo=new T.BufferGeometry(),splash=new Float32Array(160*3);splashGeo.setAttribute('position',new T.BufferAttribute(splash,3));const sprayMat=new T.PointsMaterial({color:0xacb4a6,size:.015,transparent:true,opacity:.30,depthWrite:false});const droplets=new T.Points(splashGeo,sprayMat);droplets.name='Waterfall contact droplets';scene.add(droplets);
 const reflection=new T.WebGLRenderTarget(512,512,{type:T.HalfFloatType,depthBuffer:true}),refraction=new T.WebGLRenderTarget(640,480,{type:T.HalfFloatType,depthBuffer:true});refraction.depthTexture=new T.DepthTexture(640,480,T.UnsignedIntType);const mirrorCamera=new T.PerspectiveCamera(),target=new T.Vector3(),direction=new T.Vector3(),bias=new T.Matrix4().set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1);let frames=0;
 uniforms.reflection.value=reflection.texture;uniforms.refraction.value=refraction.texture;uniforms.sceneDepth.value=refraction.depthTexture;
 let stepTravel=0,stepIndex=0;
 function update(t,player){clock.value=t;streamNormal.offset.y=-t*.09;streamNormal.updateMatrix();if(player?.wet){stepTravel+=player.moved;if(stepTravel>.22){stepTravel=0;footRings[stepIndex++%4].set(player.x,player.z,t,1);}}for(let i=0;i<160;i++){const n=i%2,life=(t*.62+i*.618)%1,a=i*2.399,x=n?port[0]-outward.x*.2:.52,z=n?port[2]-outward.z*.2:-1.55,r=.09+life*.19;splash[i*3]=x+Math.cos(a)*r*life;splash[i*3+1]=.008+Math.sin(life*Math.PI)*(.09+(i%7)*.01);splash[i*3+2]=z+Math.sin(a)*r*life;}splashGeo.attributes.position.needsUpdate=true;}
 function capture(renderer,camera){
  uniforms.eye.value.copy(camera.position);uniforms.nearFar.value.set(camera.near,camera.far);frames++;
  const saved=renderer.getRenderTarget(),planes=renderer.clippingPlanes,auto=renderer.autoClear,shadowAuto=renderer.shadowMap.autoUpdate;
  const w=Math.min(720,Math.max(384,Math.round(512*camera.aspect))),h=512;if(refraction.width!==w||refraction.height!==h)refraction.setSize(w,h);
  water.visible=false;renderer.autoClear=true;
  try{renderer.setRenderTarget(refraction);renderer.render(scene,camera);renderer.shadowMap.autoUpdate=false;mirrorCamera.copy(camera);mirrorCamera.position.copy(camera.position);mirrorCamera.position.y=-camera.position.y;camera.getWorldDirection(direction);target.copy(camera.position).add(direction);target.y=-target.y;mirrorCamera.up.set(0,-1,0);mirrorCamera.lookAt(target);mirrorCamera.updateMatrixWorld(true);uniforms.reflectMatrix.value.copy(bias).multiply(mirrorCamera.projectionMatrix).multiply(mirrorCamera.matrixWorldInverse);renderer.clippingPlanes=[new T.Plane(UP,.018)];renderer.setRenderTarget(reflection);renderer.render(scene,mirrorCamera);uniforms.ready.value=1;}
  finally{renderer.clippingPlanes=planes;renderer.shadowMap.autoUpdate=shadowAuto;renderer.autoClear=auto;renderer.setRenderTarget(saved);water.visible=true;}
 }
 let sound=null;
 function audio(ctx,master,active,position,yaw){if(!ctx)return;if(!sound){const out=ctx.createGain();out.gain.value=0;out.connect(master);const count=ctx.sampleRate*4,buffer=ctx.createBuffer(1,count,ctx.sampleRate),d=buffer.getChannelData(0);let low=0;for(let i=0;i<count;i++){low=(low+(Math.random()*2-1)*.03)/1.04;d[i]=low*2+(Math.random()*2-1)*.07;}const src=ctx.createBufferSource(),filter=ctx.createBiquadFilter();src.buffer=buffer;src.loop=true;filter.type='lowpass';filter.frequency.value=1650;src.connect(filter);filter.connect(out);const delay=ctx.createDelay(.5),feedback=ctx.createGain();delay.delayTime.value=.145;feedback.gain.value=.29;filter.connect(delay);delay.connect(feedback);feedback.connect(delay);feedback.connect(out);src.start();sound={out,src,filter,delay,feedback};}sound.out.gain.setTargetAtTime(active?.72:0,ctx.currentTime,.35);}
 function dispose(){scene.traverse(o=>{o.geometry?.dispose();});for(const m of new Set([...Object.values(mats),fallMaterial,waterMat,sprayMat,streamMaterial,plate.material]))m.dispose();reflection.dispose();refraction.dispose();streamNormal.dispose();sound?.src.stop();Object.values(sound||{}).forEach(n=>n.disconnect?.());}
 // Static stone and hardware share material batches. Point-light shadow maps
 // are rebuilt on entry, then reused for the two water capture views.
 rockRoot.updateMatrixWorld(true);const groups=new Map();
 for(const o of [...rockRoot.children]){if(!o.isMesh)continue;const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrix);if(!groups.has(o.material))groups.set(o.material,[]);groups.get(o.material).push(g);o.geometry.dispose();rockRoot.remove(o);}
 for(const [material,parts]of groups){const g=mergeGeometries(parts);parts.forEach(p=>p.dispose());mesh(g,material,'Batched limestone, dry bank and M.E.G. fittings / '+material.name);}
 const focusRay=new T.Raycaster();function focusDistance(camera,max){focusRay.ray.origin.copy(camera.position);camera.getWorldDirection(focusRay.ray.direction);focusRay.far=max;return focusRay.intersectObjects(rockRoot.children,false)[0]?.distance??max;}
 scene.updateMatrixWorld(true);return{scene,water,falls,materials:mats,uniforms,update,capture,audio,dispose,focusDistance};
}
