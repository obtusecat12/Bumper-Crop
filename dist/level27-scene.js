import * as T from './vendor/three.module.min.js';
import {SPRING_SHELL} from './level27-shell-data.js?v=57';
import {mergeGeometries,mergeVertices} from './vendor/BufferGeometryUtils.js';
import {CAVE_PLAN,CALCITE_OUTCROPS,STAIRS,TUNNEL_Y,poolFloor,wallPoint,roofHeight,roofPoint} from './level27-layout.js?v=57';
import {springMaterials,springTextures} from './level27-materials.js?v=57';

const UP=new T.Vector3(0,1,0);
export const SPRING_LIGHTS=[
 {p:[-1.47,.50,-.85],color:0xffdea1,power:.75,range:6},
 {p:[-.46,1.57,-1.06],color:0xffeac3,power:2.0,range:6},
 {p:[-.48,2.48,-1.33],color:0x7494c2,power:3.1,range:6},
 {p:[1.88,2.72,-3.9],color:0xffdfad,power:4.2,range:7}
];
function geoGrid(cols,rows,point,skip=()=>false){const p=[],uv=[],idx=[];for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){const q=point(i/cols,j/rows);p.push(...q.slice(0,3));uv.push(...q.slice(3,5));}for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){if(skip((i+.5)/cols,(j+.5)/rows))continue;const a=j*(cols+1)+i,b=a+cols+1;idx.push(a,b,a+1,a+1,b,b+1);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;}
function box(root,mat,x,y,z,w,h,d,name=''){const geometry=new T.BoxGeometry(w,h,d);if(mat.map){const uv=geometry.attributes.uv;for(let i=0;i<uv.count;i++){const f=Math.floor(i/4);uv.setXY(i,uv.getX(i)*(f<2?d:w)*.72,uv.getY(i)*(f===2||f===3?d:h)*.72);}}const mesh=new T.Mesh(geometry,mat);mesh.position.set(x,y,z);mesh.name=name;mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);return mesh;}
function rod(root,mat,a,b,r=.024){const p=new T.Vector3(...a),q=new T.Vector3(...b),v=q.clone().sub(p),mesh=new T.Mesh(new T.CylinderGeometry(r,r,v.length(),8),mat);mesh.position.copy(p).add(q).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(UP,v.normalize());mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);return mesh;}
function plaque(text,sub){const c=document.createElement('canvas');c.width=512;c.height=192;const ctx=c.getContext('2d');ctx.fillStyle='#b4ad91';ctx.fillRect(0,0,512,192);ctx.strokeStyle='#38413a';ctx.lineWidth=6;ctx.strokeRect(11,11,490,170);ctx.fillStyle='#26392f';ctx.textAlign='center';ctx.font='bold 44px sans-serif';ctx.fillText(text,256,79);ctx.font='22px sans-serif';ctx.fillText(sub,256,126);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return new T.MeshStandardMaterial({map:t,roughness:.95,side:T.DoubleSide});}

export function createLevel27(){
 const scene=new T.Scene();scene.name='Level 27 / 岩体泉';scene.background=new T.Color(0x030504);scene.userData.noAtmosphere=true;
 const mats=springMaterials(),clock={value:0},rockRoot=new T.Group();rockRoot.name='Continuous eroded limestone shell';scene.add(rockRoot);
 // World-space projection carries one continuous surface over folds and joins.
 // Generated diffuse textures supply the pore/bedding detail, geometry supplies form.
 for(const mat of [mats.rock,mats.calcite,mats.bed]){
  mat.onBeforeCompile=s=>{
   s.uniforms.caveTime=clock;s.uniforms.caveRipple={value:springTextures()['water-caustics']};s.uniforms.caveStrata={value:springTextures()['limestone-strata']};s.uniforms.caveCalcite={value:springTextures()['limestone-flowstone']};
   s.vertexShader='varying vec3 vCaveWorld,vCaveNormal;\n'+s.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvCaveWorld=(modelMatrix*vec4(transformed,1.)).xyz;vCaveNormal=normalize(mat3(modelMatrix)*normal);');
   s.fragmentShader=`varying vec3 vCaveWorld,vCaveNormal;uniform float caveTime;uniform sampler2D caveRipple,caveStrata,caveCalcite;
    vec3 rockTexture(sampler2D t,vec3 p,vec3 n){vec3 w=pow(abs(n),vec3(5.));w/=max(dot(w,vec3(1.)),.001);return texture2D(t,p.zy*.78).rgb*w.x+texture2D(t,p.xz*.78).rgb*w.y+texture2D(t,p.xy*.78).rgb*w.z;}
   `+s.fragmentShader;
   if(mat!==mats.bed)s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',`float a=atan(vCaveWorld.z,vCaveWorld.x);if(a<0.)a+=6.2831853;
    float flow=smoothstep(3.92,4.16,a)*(1.-smoothstep(4.85,5.16,a));float cap=1.-smoothstep(1.88,2.60,vCaveWorld.y+.15*sin(vCaveWorld.x*6.)+.11*cos(vCaveWorld.z*5.));
    vec3 stone=rockTexture(caveStrata,vCaveWorld,vCaveNormal);vec3 calcite=rockTexture(caveCalcite,vCaveWorld*.82,vCaveNormal);
    vec3 rockAlbedo=mix(stone,calcite,flow*cap);diffuseColor.rgb*=rockAlbedo;`);
   if(mat!==mats.bed)s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_maps>',`float rockHeight=dot(rockAlbedo,vec3(.2126,.7152,.0722));normal=perturbNormalArb(-vViewPosition,normal,vec2(dFdx(rockHeight),dFdy(rockHeight))*.026,faceDirection);`);
   s.fragmentShader=s.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(.39,roughnessFactor,smoothstep(-.1,.28,vCaveWorld.y));');
   s.fragmentShader=s.fragmentShader.replace('#include <opaque_fragment>',`float damp=1.-smoothstep(-.32,.23,vCaveWorld.y);float r1=texture2D(caveRipple,vCaveWorld.xz*.87+vec2(caveTime*.017,-caveTime*.011)).r;float r2=texture2D(caveRipple,vCaveWorld.xz*.91+vec2(-caveTime*.014,caveTime*.018)).r;outgoingLight+=vec3(.048,.070,.050)*pow(min(r1,r2),1.6)*damp;
    #include <opaque_fragment>`);
  };
  mat.customProgramCacheKey=()=>mat===mats.bed?'spring-bed-v57':'spring-geological-v57';
 }
 function mesh(g,m,name){const o=new T.Mesh(g,m);o.name=name;o.castShadow=o.receiveShadow=true;rockRoot.add(o);return o;}
 // A single implicit air/rock boundary joins the cave and tunnel. It has no
 // overlapping arch pieces, cracks to the outside, or layered coplanar surfaces.
 const unpack=(s,C)=>{const bytes=Uint8Array.from(atob(s),c=>c.charCodeAt(0));return new C(bytes.buffer);};
 const q=unpack(SPRING_SHELL.vertices,Int16Array),p=new Float32Array(q.length),uv=new Float32Array(q.length/3*2);
 for(let i=0;i<q.length;i++){p[i]=q[i]/SPRING_SHELL.scale;if(i%3===0){uv[i/3*2]=p[i]*.67;uv[i/3*2+1]=q[i+1]/SPRING_SHELL.scale*.67;}}
 const shell=new T.BufferGeometry();shell.setAttribute('position',new T.BufferAttribute(p,3));shell.setAttribute('uv',new T.BufferAttribute(uv,2));shell.setIndex(new T.BufferAttribute(unpack(SPRING_SHELL.indices,Uint32Array),1));const qn=unpack(SPRING_SHELL.normals,Int16Array);shell.setAttribute('normal',new T.Float32BufferAttribute(Array.from(qn,v=>v/16000),3));
 mesh(shell,mats.rock,'Unified limestone air boundary / cave and stream passage');
 mesh(geoGrid(96,24,(u,v)=>{const k=Math.min(95,Math.floor(u*96)),f=u*96-k,p=CAVE_PLAN[k],q=CAVE_PLAN[(k+1)%96],x=(p[0]+(q[0]-p[0])*f)*v,z=(p[1]+(q[1]-p[1])*f)*v;return[x,poolFloor(x||.0001,z||.0001),z,x*.67,z*.67];}),mats.bed,'Mineral basin / shared walking bed');
 box(rockRoot,mats.concrete,1.41,1.40,-5.16,1.18,.12,7.06,'M.E.G. dry tunnel bank');
 box(rockRoot,mats.bed,.60,1.31,-5.16,.42,.10,7.06,'Inflow stream bed');
 box(rockRoot,mats.black,1.225,2.5,-8.72,1.75,2.5,.14,'Return threshold / dark continuation');
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
 scene.add(new T.AmbientLight(0xadb4bb,.24));
 const tex=springTextures(),footRings=Array.from({length:4},()=>new T.Vector4(0,0,-100,0)),uniforms={clock,footRings:{value:footRings},ripple:{value:tex['spring-ripples']},caustics:{value:tex['water-caustics']},reflection:{value:null},refraction:{value:null},sceneDepth:{value:null},eye:{value:new T.Vector3()},reflectMatrix:{value:new T.Matrix4()},nearFar:{value:new T.Vector2(.06,40)},ready:{value:0}};
 const waterMat=new T.ShaderMaterial({name:'Mineral spring / planar reflection and depth refraction',uniforms,side:T.DoubleSide,
  vertexShader:`varying vec3 wp;varying vec4 screenP,mirrorP;uniform mat4 reflectMatrix;void main(){vec4 p=modelMatrix*vec4(position,1.);wp=p.xyz;screenP=projectionMatrix*viewMatrix*p;mirrorP=reflectMatrix*p;gl_Position=screenP;}`,
  fragmentShader:`precision highp float;uniform float clock,ready;uniform sampler2D ripple,caustics,reflection,refraction,sceneDepth;uniform vec3 eye;uniform vec2 nearFar;uniform vec4 footRings[4];varying vec3 wp;varying vec4 screenP,mirrorP;
  float linearZ(float d){return nearFar.x*nearFar.y/(nearFar.y-d*(nearFar.y-nearFar.x));}
  float h(vec2 p){return texture2D(ripple,p*.56+vec2(clock*.012,-clock*.019)).r*.58+texture2D(ripple,p*.94+vec2(-clock*.016,clock*.006)).r*.42;}
  void main(){vec2 p=wp.xz;float e=.015;vec2 n=vec2(h(p+vec2(e,0.))-h(p-vec2(e,0.)),h(p+vec2(0.,e))-h(p-vec2(0.,e)))*1.65;
   for(int i=0;i<2;i++){vec2 s=i==0?vec2(.52,-1.70):vec2(-1.60,-.97);vec2 v=p-s;float d=length(v);n+=normalize(v+vec2(.001))*cos(d*29.-clock*6.)*.021*exp(-d*1.7);}
   for(int i=0;i<4;i++){vec2 v=p-footRings[i].xy;float d=length(v),age=clock-footRings[i].z;float band=d-age*.42;n+=normalize(v+vec2(.001))*sin(band*32.)*.018*exp(-band*band*20.)*exp(-age*1.35)*footRings[i].w;}
   vec3 N=normalize(vec3(-n.x,1.,-n.y)),V=normalize(eye-wp);float fresnel=.035+.965*pow(1.-max(dot(N,V),0.),5.);vec2 uv=screenP.xy/screenP.w*.5+.5;
   vec2 refrUV=clamp(uv+n*.019,.003,.997);float depth=clamp(linearZ(texture2D(sceneDepth,refrUV).r)-linearZ(gl_FragCoord.z),0.,3.);
   vec3 trans=texture2D(refraction,refrUV).rgb*exp(-vec3(.53,.22,.24)*depth)+vec3(.027,.082,.067)*(1.-exp(-depth));
   vec2 ru=clamp(mirrorP.xy/mirrorP.w+n*.028,.003,.997);vec3 reflected=texture2D(reflection,ru).rgb;
   float cells=texture2D(caustics,p*.86+vec2(clock*.011,-clock*.009)+n*.065).r;float shimmer=texture2D(caustics,p*.91+vec2(-clock*.015,clock*.013)).r;
   trans+=vec3(.065,.14,.12)*pow(min(cells,shimmer)*1.28,1.5)*exp(-depth*.5);
   vec3 c=mix(trans,reflected,min(.84,fresnel));c=mix(vec3(.016,.033,.028),c,ready);
   vec3 L=normalize(vec3(-1.56,.4,-.96)-wp);float glint=pow(max(dot(reflect(-L,N),V),0.),160.);c+=vec3(.42,.26,.09)*glint;
   gl_FragColor=vec4(c,1.);
  }`});
 const wg=geoGrid(96,1,(u,v)=>{const k=Math.min(95,Math.floor(u*96)),f=u*96-k,p=CAVE_PLAN[k],q=CAVE_PLAN[(k+1)%96];return[(p[0]+(q[0]-p[0])*f)*v,.0,(p[1]+(q[1]-p[1])*f)*v,u,v];});
 const water=new T.Mesh(wg,waterMat);water.name='Clear warm spring water / bounded to basin';water.renderOrder=2;scene.add(water);
 // The flow texture follows gravity, wrapping around a shallow curved volume.
 // Each of the two sources includes its continuous sheet and grounded impact foam.
 const fallMaterial=new T.ShaderMaterial({name:'PS2 photographic waterfall / longitudinal mineral-water streaks',uniforms:{clock,flow:{value:tex['waterfall-flow']}},transparent:true,depthWrite:false,side:T.DoubleSide,
 vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
 fragmentShader:`precision highp float;uniform float clock;uniform sampler2D flow;varying vec2 vUv;void main(){vec2 uv=vec2(vUv.x,vUv.y*1.25-clock*.52);vec3 sampleA=texture2D(flow,uv).rgb;float streak=dot(sampleA,vec3(.25,.50,.25));float second=texture2D(flow,vec2(vUv.x*1.53+.17,vUv.y*1.69-clock*.68)).g;float edge=smoothstep(0.,.09,vUv.x)*smoothstep(0.,.09,1.-vUv.x);float foam=smoothstep(.76,1.,vUv.y);float alpha=edge*(.23+streak*.61+second*.13+foam*.12);gl_FragColor=vec4(mix(vec3(.10,.26,.25),vec3(.60,.81,.74),clamp(streak*.92+second*.20+foam*.12,0.,1.)),alpha);}`});
 const impactMaterial=new T.ShaderMaterial({name:'Spring cascade impact foam / surface contact',uniforms:{clock,foam:{value:tex['water-caustics']}},transparent:true,depthWrite:false,side:T.DoubleSide,
 vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
 fragmentShader:`precision highp float;uniform float clock;uniform sampler2D foam;varying vec2 vUv;void main(){vec2 p=vUv*2.-1.;float d=length(p);float q=texture2D(foam,vUv*1.4+vec2(clock*.035,-clock*.026)).r;float ring=pow(.5+.5*cos(d*29.-clock*4.6),5.)*.15;float a=(1.-smoothstep(.08,1.,d))*(.18+q*.48+ring);gl_FragColor=vec4(.63,.82,.74,a);}`});
 const falls=new T.Group();falls.name='Exactly two wall-fed waterfalls';scene.add(falls);
 const port=wallPoint(3.87,1.10),outward=new T.Vector3(port[0],0,port[2]).normalize();
 // The secondary source's recess is part of the same implicit mesh.
 const clearRad=Math.min(...Array.from({length:30},(_,i)=>{const p=wallPoint(3.87,1.1*i/29);return Math.hypot(p[0],p[2]);}))-.04;const sourceInset=Math.max(0,Math.hypot(port[0],port[2])-clearRad);
 const sources=[[.60,-1.61,1.405,.29,0,1],[port[0]-outward.x*sourceInset,port[2]-outward.z*sourceInset,1.10,.25,-outward.x,-outward.z]];
 for(const [x,z,top,w,nx,nz]of sources){const group=new T.Group();group.name='Wall opening / falling mineral water';
  const g=geoGrid(20,40,(u,v)=>{const d=.024+v*v*(nx===0?.16:.26),curve=Math.sin(u*Math.PI)*.025;return[x+(u-.5)*w*(1.+v*.22)*nz+nx*(d+curve),top*(1-v)+.007,z-(u-.5)*w*(1.+v*.22)*nx+nz*(d+curve),u,v];});group.add(new T.Mesh(g,fallMaterial));
  const impact=new T.Mesh(new T.PlaneGeometry(w*2.7,.70),impactMaterial);impact.rotation.x=-Math.PI/2;impact.position.set(x+nx*(nx===0?.16:.26),.009,z+nz*(nx===0?.16:.26));impact.renderOrder=4;group.add(impact);falls.add(group);
 }
 const streamNormal=tex['spring-ripples'].clone();streamNormal.repeat.set(.35,4.8);streamNormal.needsUpdate=true;const streamMaterial=new T.MeshStandardMaterial({name:'Shallow inflow stream / rippled clear water',color:0x46594b,roughness:.19,metalness:.15,bumpMap:streamNormal,bumpScale:.018,transparent:true,opacity:.42,depthWrite:false,side:T.DoubleSide});
 const stream=new T.Mesh(new T.PlaneGeometry(.31,7.20),streamMaterial);stream.rotation.x=-Math.PI/2;stream.position.set(.60,1.405,-5.2);stream.name='Inflow stream beside return bank';stream.receiveShadow=true;scene.add(stream);
 const splashGeo=new T.BufferGeometry(),splash=new Float32Array(160*3);splashGeo.setAttribute('position',new T.BufferAttribute(splash,3));const sprayMat=new T.PointsMaterial({color:0xb5d5c9,size:.019,transparent:true,opacity:.30,depthWrite:false});const droplets=new T.Points(splashGeo,sprayMat);droplets.name='Waterfall contact droplets';scene.add(droplets);
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
 function dispose(){scene.traverse(o=>{o.geometry?.dispose();});for(const m of new Set([...Object.values(mats),fallMaterial,impactMaterial,waterMat,sprayMat,streamMaterial,plate.material]))m.dispose();reflection.dispose();refraction.dispose();streamNormal.dispose();sound?.src.stop();Object.values(sound||{}).forEach(n=>n.disconnect?.());}
 // Static stone and hardware share material batches. Point-light shadow maps
 // are rebuilt on entry, then reused for the two water capture views.
 rockRoot.updateMatrixWorld(true);const groups=new Map();
 for(const o of [...rockRoot.children]){if(!o.isMesh)continue;const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrix);if(!groups.has(o.material))groups.set(o.material,[]);groups.get(o.material).push(g);o.geometry.dispose();rockRoot.remove(o);}
 for(const [material,parts]of groups){let g=mergeGeometries(parts);parts.forEach(p=>p.dispose());mesh(g,material,'Batched limestone, dry bank and M.E.G. fittings / '+material.name);}
 const focusRay=new T.Raycaster();function focusDistance(camera,max){focusRay.ray.origin.copy(camera.position);camera.getWorldDirection(focusRay.ray.direction);focusRay.far=max;return focusRay.intersectObjects(rockRoot.children,false)[0]?.distance??max;}
 scene.updateMatrixWorld(true);return{scene,water,falls,materials:mats,uniforms,update,capture,audio,dispose,focusDistance};
}
