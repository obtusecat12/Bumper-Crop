import * as T from './vendor/three.module.min.js';
import {SPRING_SHELL} from './level27-shell-data.js?v=60';
import {mergeGeometries,mergeVertices} from './vendor/BufferGeometryUtils.js';
import {CAVE_PLAN,CALCITE_OUTCROPS,STAIRS,TUNNEL_Y,poolFloor,wallPoint,roofHeight,roofPoint,cascadePath,STREAM_X,WASH_BASIN,radialLimit,inAnnex,ANNEX,streamPath} from './level27-layout.js?v=60';
import {springMaterials,springTextures} from './level27-materials.js?v=60';

import {createSpringDynamics} from './spring-dynamics.js?v=60';
import {bathTextures} from './bath-textures.js?v=62';
import {addWashStation} from './bathing-props.js?v=60';
const UP=new T.Vector3(0,1,0);
export const SPRING_LIGHTS=[
 {p:[-.8,2.9,.3],color:0xabc9d5,power:5.6,range:8},
 {p:[5.10,2.48,.55],color:0xffd5a4,power:8.8,range:7},
 {p:[-.85,2.8,-1.65],color:0xadc5c8,power:4.8,range:6},
 {p:[4.65,3.08,-5.9],color:0xffddb3,power:8.4,range:8}
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
    vec3 rockAlbedo=mix(stone,calcite,flow*cap);float wetWall=(1.-smoothstep(2.15,2.65,vCaveWorld.y))*smoothstep(2.85,3.3,a)*(1.-smoothstep(3.9,4.3,a));rockAlbedo*=mix(1.,.34,wetWall);diffuseColor.rgb*=rockAlbedo;`);
   if(mat!==mats.bed)s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_maps>',`float rockHeight=dot(rockAlbedo,vec3(.2126,.7152,.0722));normal=perturbNormalArb(-vViewPosition,normal,vec2(dFdx(rockHeight),dFdy(rockHeight))*.026,faceDirection);`);
   s.fragmentShader=s.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(.39,roughnessFactor,smoothstep(-.1,.28,vCaveWorld.y));');
   s.fragmentShader=s.fragmentShader.replace('#include <opaque_fragment>',`float damp=1.-smoothstep(-.32,.23,vCaveWorld.y);float r1=texture2D(caveRipple,vCaveWorld.xz*.87+vec2(caveTime*.017,-caveTime*.011)).r;float r2=texture2D(caveRipple,vCaveWorld.xz*.91+vec2(-caveTime*.014,caveTime*.018)).r;outgoingLight+=vec3(.048,.070,.050)*pow(min(r1,r2),1.6)*damp;
    #include <opaque_fragment>`);
  };
  mat.customProgramCacheKey=()=>mat===mats.bed?'spring-bed-v57':'spring-geological-v60';
 }
 function mesh(g,m,name){const o=new T.Mesh(g,m);o.name=name;o.castShadow=o.receiveShadow=true;rockRoot.add(o);return o;}
 // A single implicit air/rock boundary joins the cave and tunnel. It has no
 // overlapping arch pieces, cracks to the outside, or layered coplanar surfaces.
 const unpack=(s,C)=>{const bytes=Uint8Array.from(atob(s),c=>c.charCodeAt(0));return new C(bytes.buffer);};
 const q=unpack(SPRING_SHELL.vertices,Int16Array),p=new Float32Array(q.length),uv=new Float32Array(q.length/3*2);
 for(let i=0;i<q.length;i++){p[i]=q[i]/SPRING_SHELL.scale;if(i%3===0){uv[i/3*2]=p[i]*.67;uv[i/3*2+1]=q[i+1]/SPRING_SHELL.scale*.67;}}
 const shell=new T.BufferGeometry();shell.setAttribute('position',new T.BufferAttribute(p,3));shell.setAttribute('uv',new T.BufferAttribute(uv,2));shell.setIndex(new T.BufferAttribute(unpack(SPRING_SHELL.indices,Uint32Array),1));const qn=unpack(SPRING_SHELL.normals,Int16Array);shell.setAttribute('normal',new T.Float32BufferAttribute(Array.from(qn,v=>v/16000),3));
 const shellMesh=mesh(shell,mats.rock,'Unified limestone / pool, enlarged dry annex, broad stream tunnel');shellMesh.userData.keepIndexed=true;
 // Surveyed continuous dry annex and pool bottom; no overlapping floor plates.
 mesh(geoGrid(112,88,(u,v)=>{const x=-2.7+u*8.35,z=-2.7+v*5.5;return[x,poolFloor(x||.0001,z||.0001),z,x*.67,z*.67];},(u,v)=>{const x=-2.7+u*8.35,z=-2.7+v*5.5;return Math.hypot(x,z)>radialLimit(x,z)+.02&&!inAnnex(x,z);}),mats.bed,'Spring bottom and separate dry rock annex');
 mesh(geoGrid(8,48,(u,v)=>{const z=-10.43+v*7.33,x=2.87+u*1.9;return[x,TUNNEL_Y,z,x,z];}),mats.concrete,'Full-width dry tunnel path beside creek');
 // The creek has a genuine concave rock bed, physically joined to its curved outlet.
 const wholeStream=streamPath(),channelCurve=new T.CatmullRomCurve3(wholeStream.slice(0,6).map(p=>new T.Vector3(...p)),false,'centripetal');
 mesh(geoGrid(16,64,(u,v)=>{const c=channelCurve.getPoint(v),t=channelCurve.getTangent(v),side=new T.Vector3(-t.z,0,t.x).normalize(),off=(u-.5)*1.34;c.addScaledVector(side,off);return[c.x,c.y-.13+.23*Math.pow(Math.abs(u-.5)*2,4),c.z,u,v*5];}),mats.rock,'Continuous 1.1m natural inflow creek bed and rock banks');
 box(rockRoot,mats.black,3.0,3.10,-10.50,3.9,3.0,.14,'Dark continuation of return tunnel');
 for(let i=0;i<STAIRS.count;i++){const z=STAIRS.start+(i+.5)*STAIRS.tread,top=STAIRS.base+(STAIRS.count-i)*STAIRS.rise;box(rockRoot,mats.concrete,STAIRS.x,(top-.03)/2,z,STAIRS.width,top+.03,STAIRS.tread,'Dry-bank stone tread '+(i+1));}
 for(const x of[STAIRS.x-.55,STAIRS.x+.55]){rod(rockRoot,mats.metal,[x,TUNNEL_Y+.94,STAIRS.start],[x,1.23,-.08],.025);for(let i=0;i<5;i++){const z=STAIRS.start+.1+i*.70,y=STAIRS.base+Math.max(0,STAIRS.count-Math.floor((z-STAIRS.start)/STAIRS.tread))*.16;rod(rockRoot,mats.metal,[x,y,z],[x,y+.93,z],.023);box(rockRoot,mats.metal,x,y+.014,z,.13,.028,.13);}}
 const plate=box(rockRoot,plaque('M.E.G. / 27','RETURN  ←  ALONG THE STREAM'),4.76,2.60,-6.45,.025,.31,.88,'Wall-fixed return marker');plate.material.side=T.DoubleSide;const signRay=new T.Raycaster(new T.Vector3(3.7,2.60,-6.45),new T.Vector3(1,0,0));plate.position.x=(signRay.intersectObject(shellMesh)[0]?.point.x??4.9)-.002;
 addWashStation(rockRoot,mats,bathTextures(),{x:WASH_BASIN.x,y:.28,z:WASH_BASIN.z});
 const practicals=[];
 for(let i=0;i<SPRING_LIGHTS.length;i++){const l=SPRING_LIGHTS[i],light=new T.PointLight(l.color,l.power,l.range,2);light.position.fromArray(l.p);light.castShadow=i===1;light.shadow.mapSize.set(512,512);light.shadow.bias=-.001;light.shadow.normalBias=.025;light.shadow.camera.near=.10;light.shadow.camera.far=l.range;scene.add(light);
 if(i===1||i===3){const anchorRay=new T.Raycaster(new T.Vector3(...l.p),new T.Vector3(1,0,0)),wallX=(anchorRay.intersectObject(shellMesh)[0]?.point.x??(i===1?5.44:4.90))+.012;box(rockRoot,mats.metal,wallX,l.p[1],l.p[2],.06,.35,.25,'Wall-mounted bulkhead backplate');rod(rockRoot,mats.metal,[wallX,l.p[1],l.p[2]],[l.p[0],l.p[1],l.p[2]],.038);box(rockRoot,mats.black,l.p[0]+.07,l.p[1]+.13,l.p[2],.19,.05,.26,'Shielded lamp hood');const bulb=new T.Mesh(new T.SphereGeometry(.069,10,8),mats.lamp);bulb.scale.set(.7,1,1);bulb.position.fromArray(l.p);scene.add(bulb);practicals.push({light,power:l.power,bulb});}}
 scene.add(new T.AmbientLight(0xadc5cc,.34));
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
   vec3 trans=texture2D(refraction,refrUV).rgb*exp(-vec3(.53,.22,.24)*depth)+vec3(.027,.082,.067)*(1.-exp(-depth));
   vec2 ru=clamp(mirrorP.xy/mirrorP.w+n*.028,.003,.997);vec3 reflected=texture2D(reflection,ru).rgb;
   float cells=texture2D(caustics,p*.86+vec2(clock*.011,-clock*.009)+n*.065).r;float shimmer=texture2D(caustics,p*.91+vec2(-clock*.015,clock*.013)).r;
   trans+=vec3(.047,.094,.080)*pow(min(cells,shimmer)*1.28,1.5)*exp(-depth*.5)*clamp(1./(1.+(dyn.a-.5)*4.),.65,1.8);
   vec3 c=mix(trans,reflected,min(.84,fresnel));c=mix(vec3(.016,.033,.028),c,ready);
   vec3 L=normalize(vec3(-1.56,.4,-.96)-wp);float glint=pow(max(dot(reflect(-L,N),V),0.),160.);c+=vec3(.42,.26,.09)*glint;
   gl_FragColor=vec4(c,1.);
  }`});
 const wg=geoGrid(80,80,(u,v)=>{const x=(u-.5)*5.2,z=(v-.5)*5.2;return[x,0,z,u,v];},(u,v)=>{const x=(u-.5)*5.2,z=(v-.5)*5.2;return Math.hypot(x,z)>radialLimit(x,z)-.035||poolFloor(x,z)>=-.018;});
 const water=new T.Mesh(wg,waterMat);water.name='Clear warm spring water / bounded to basin';water.renderOrder=2;scene.add(water);
 // The flow texture follows gravity, wrapping around a shallow curved volume.
 // Each of the two sources includes its continuous sheet and grounded impact foam.
 const fallMaterial=new T.ShaderMaterial({name:'PS2 photographic waterfall / longitudinal mineral-water streaks',uniforms:{clock,flow:{value:tex['waterfall-flow']}},transparent:true,depthWrite:false,side:T.DoubleSide,
 vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
 fragmentShader:`precision highp float;uniform float clock;uniform sampler2D flow;varying vec2 vUv;void main(){vec2 uv=vec2(vUv.x,vUv.y*1.25-clock*.52);vec3 sampleA=texture2D(flow,uv).rgb;float streak=dot(sampleA,vec3(.25,.50,.25));float second=texture2D(flow,vec2(vUv.x*1.53+.17,vUv.y*1.69-clock*.68)).g;float edge=smoothstep(0.,.09,vUv.x)*smoothstep(0.,.09,1.-vUv.x);float foam=smoothstep(.76,1.,vUv.y);float strand=smoothstep(.17,.63,streak);float alpha=edge*(.016+strand*.21+second*.04+foam*.035);gl_FragColor=vec4(mix(vec3(.07,.12,.12),vec3(.36,.44,.42),clamp(streak*.92+second*.20+foam*.12,0.,1.)),alpha);}`});
 const impactMaterial=new T.ShaderMaterial({name:'Spring cascade impact foam / surface contact',uniforms:{clock,foam:{value:bathTextures()['foam-ripple']}},transparent:true,depthWrite:false,side:T.DoubleSide,
 vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
 fragmentShader:`precision highp float;uniform float clock;uniform sampler2D foam;varying vec2 vUv;void main(){vec2 p=(vUv-.5)*(1.+.025*sin(clock*3.));vec4 q=texture2D(foam,p+.5);float a=q.a*.36*(1.-smoothstep(.3,.7,length(p)));gl_FragColor=vec4(q.rgb*vec3(.70,.82,.77),a);}`});
 const falls=new T.Group();falls.name='Exactly two wall-fed waterfalls';scene.add(falls);
 const freefall=wholeStream.slice(5),routes=[freefall,[]],impacts=[[.55,.012,-1.54]];
 const sprays=[];
 const sprayMaterial=new T.MeshBasicMaterial({name:'Low fine impact spray',map:bathTextures()['impact-spray'],transparent:true,opacity:.30,depthWrite:false,side:T.DoubleSide});
 // Broad wet rock waterfall, with independent rivulets staying in contact with
 // the same geological surface. Short free drops occur only over real ledges.
 for(let k=0;k<2;k++){const group=new T.Group();group.name=k?'West rock-hugging cascade / staggered mineral ledges':'Creek outlet waterfall, separate from stairs';
  const paths=[];
  for(let n=0;n<(k?13:9);n++){const pts=[],off=(n-((k?13:9)-1)/2)*(k?.074:.069);let accumulatedRadius=Infinity;
   for(let j=0;j<=52;j++){const v=j/52;if(k){const y=2.10*(1-v)+.015,a=3.57+off/2.1+.010*Math.sin(v*11+n),p=wallPoint(a,y),r=Math.min(accumulatedRadius,Math.hypot(p[0],p[2])-.025);accumulatedRadius=r;pts.push(new T.Vector3(Math.cos(a)*r,y,Math.sin(a)*r));}else{const curve=new T.CatmullRomCurve3(freefall.map(p=>new T.Vector3(...p)));const p=curve.getPoint(v);p.x+=off*(1+v*.28);pts.push(p);}}
   paths.push(pts);const curve=new T.CatmullRomCurve3(pts),r=.005+(n%5)*.0015;const jg=new T.TubeGeometry(curve,52,r,5,false),ju=jg.attributes.uv;for(let u=0;u<ju.count;u++){const a=ju.getX(u),b=ju.getY(u);ju.setXY(u,b,a+n*.037);}const jet=new T.Mesh(jg,fallMaterial);jet.renderOrder=3;group.add(jet);
  }
  // Thin translucent film joins some channels while preserving visible dark rock.
  const g=geoGrid(24,52,(u,v)=>{const j=Math.min(51,Math.floor(v*52)),t=v*52-j,c=u*(paths.length-1),n=Math.min(paths.length-2,Math.floor(c)),f=c-n,p=paths[n][j].clone().lerp(paths[n][j+1],t).lerp(paths[n+1][j].clone().lerp(paths[n+1][j+1],t),f);return[...p.toArray(),u,v*1.6];});
  const filmMat=fallMaterial.clone();filmMat.uniforms=fallMaterial.uniforms;filmMat.fragmentShader=fallMaterial.fragmentShader.replace('alpha);','alpha*.50);');const sheet=new T.Mesh(g,filmMat);sheet.renderOrder=3;group.add(sheet);
  const end=paths[Math.floor(paths.length/2)].at(-1);if(k)impacts.push([end.x,.012,end.z]);
  const impact=new T.Mesh(new T.PlaneGeometry(k?1.28:1.05,.86),impactMaterial);impact.rotation.x=-Math.PI/2;impact.position.set(end.x,.014,end.z);impact.renderOrder=4;group.add(impact);
  const spray=new T.Mesh(new T.PlaneGeometry(.96,.26),sprayMaterial);spray.position.set(end.x,.13,end.z);spray.renderOrder=5;group.add(spray);sprays.push(spray);falls.add(group);
 }
 const streamNormal=tex['spring-ripples'].clone();streamNormal.repeat.set(.7,5.5);streamNormal.needsUpdate=true;const streamMaterial=new T.MeshStandardMaterial({name:'Moving shallow creek',color:0x839a97,roughness:.23,metalness:.12,bumpMap:streamNormal,bumpScale:.025,transparent:true,opacity:.58,depthWrite:false,side:T.DoubleSide});
 const stream=new T.Mesh(geoGrid(12,64,(u,v)=>{const c=channelCurve.getPoint(v),t=channelCurve.getTangent(v),side=new T.Vector3(-t.z,0,t.x).normalize();c.addScaledVector(side,(u-.5)*1.02);return[c.x,c.y,c.z,u,v*5];}),streamMaterial);stream.name='One metre creek, continuously connected to waterfall lip';scene.add(stream);
 const drainWater=new T.Mesh(geoGrid(6,40,(u,v)=>{const z=1.48+v*1.16;return[-.85-.48*v+(u-.5)*.195,-.004-v*.012,z,u,v*3];}),streamMaterial);drainWater.name='Small natural corner drain / nonexplorable';drainWater.renderOrder=3;scene.add(drainWater);
 const splashGeo=new T.BufferGeometry(),splash=new Float32Array(160*3);splashGeo.setAttribute('position',new T.BufferAttribute(splash,3));const sprayMat=new T.PointsMaterial({color:0xb5d5c9,size:.019,transparent:true,opacity:.30,depthWrite:false});const droplets=new T.Points(splashGeo,sprayMat);droplets.name='Waterfall contact droplets';scene.add(droplets);
 const reflection=new T.WebGLRenderTarget(512,512,{type:T.HalfFloatType,depthBuffer:true}),refraction=new T.WebGLRenderTarget(640,480,{type:T.HalfFloatType,depthBuffer:true});refraction.depthTexture=new T.DepthTexture(640,480,T.UnsignedIntType);const mirrorCamera=new T.PerspectiveCamera(),target=new T.Vector3(),direction=new T.Vector3(),bias=new T.Matrix4().set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1);let frames=0;
 uniforms.reflection.value=reflection.texture;uniforms.refraction.value=refraction.texture;uniforms.sceneDepth.value=refraction.depthTexture;
 let stepTravel=0,stepIndex=0,lastTime=0;
 function update(t,player){const dt=Math.max(0,Math.min(.06,t-lastTime));lastTime=t;clock.value=t;streamNormal.offset.y=-t*.09;streamNormal.updateMatrix();if(player?.wet){stepTravel+=player.moved;if(stepTravel>.20){stepTravel=0;footRings[stepIndex++%4].set(player.x,player.z,t,1);dynamics.drop(player.x,player.z,.16,.012);}}dynamics.update(dt,impacts.map(p=>[p[0],p[2]]));
  for(const p of practicals){p.light.intensity=p.power;}
  for(let i=0;i<160;i++){const origin=impacts[i%2],life=(t*.96+i*.618)%1,a=i*2.399,r=.07+life*.27;splash[i*3]=origin[0]+Math.cos(a)*r*life;splash[i*3+1]=.011+Math.sin(life*Math.PI)*(.11+(i%7)*.025);splash[i*3+2]=origin[2]+Math.sin(a)*r*life;}splashGeo.attributes.position.needsUpdate=true;}
 function capture(renderer,camera){
  for(const s of sprays)s.rotation.y=Math.atan2(camera.position.x-s.position.x,camera.position.z-s.position.z);
  uniforms.eye.value.copy(camera.position);uniforms.nearFar.value.set(camera.near,camera.far);frames++;if(frames%2===0&&uniforms.ready.value)return;
  const saved=renderer.getRenderTarget(),planes=renderer.clippingPlanes,auto=renderer.autoClear,shadowAuto=renderer.shadowMap.autoUpdate;
  const w=Math.min(576,Math.max(320,Math.round(360*camera.aspect))),h=360;if(refraction.width!==w||refraction.height!==h)refraction.setSize(w,h);
  water.visible=false;renderer.autoClear=true;
  try{renderer.setRenderTarget(refraction);renderer.render(scene,camera);renderer.shadowMap.autoUpdate=false;mirrorCamera.copy(camera);mirrorCamera.position.copy(camera.position);mirrorCamera.position.y=-camera.position.y;camera.getWorldDirection(direction);target.copy(camera.position).add(direction);target.y=-target.y;mirrorCamera.up.set(0,-1,0);mirrorCamera.lookAt(target);mirrorCamera.updateMatrixWorld(true);uniforms.reflectMatrix.value.copy(bias).multiply(mirrorCamera.projectionMatrix).multiply(mirrorCamera.matrixWorldInverse);renderer.clippingPlanes=[new T.Plane(UP,.018)];renderer.setRenderTarget(reflection);renderer.render(scene,mirrorCamera);uniforms.ready.value=1;}
  finally{renderer.clippingPlanes=planes;renderer.shadowMap.autoUpdate=shadowAuto;renderer.autoClear=auto;renderer.setRenderTarget(saved);water.visible=true;}
 }
 let sound=null;
 function audio(ctx,master,active,position,yaw){if(!ctx)return;if(!sound){const out=ctx.createGain();out.gain.value=0;out.connect(master);const count=ctx.sampleRate*4,buffer=ctx.createBuffer(1,count,ctx.sampleRate),d=buffer.getChannelData(0);let low=0;for(let i=0;i<count;i++){low=(low+(Math.random()*2-1)*.03)/1.04;d[i]=low*2+(Math.random()*2-1)*.07;}const src=ctx.createBufferSource(),filter=ctx.createBiquadFilter();src.buffer=buffer;src.loop=true;filter.type='lowpass';filter.frequency.value=1650;src.connect(filter);filter.connect(out);const delay=ctx.createDelay(.5),feedback=ctx.createGain();delay.delayTime.value=.145;feedback.gain.value=.29;filter.connect(delay);delay.connect(feedback);feedback.connect(delay);feedback.connect(out);src.start();sound={out,src,filter,delay,feedback};}sound.out.gain.setTargetAtTime(active?.72:0,ctx.currentTime,.35);}
 function dispose(){scene.traverse(o=>{o.geometry?.dispose();});for(const m of new Set([...Object.values(mats),fallMaterial,impactMaterial,waterMat,sprayMat,streamMaterial,plate.material]))m.dispose();reflection.dispose();refraction.dispose();streamNormal.dispose();dynamics.dispose();sprayMaterial.dispose();sound?.src.stop();Object.values(sound||{}).forEach(n=>n.disconnect?.());}
 // Static stone and hardware share material batches. Point-light shadow maps
 // are rebuilt on entry, then reused for the two water capture views.
 rockRoot.updateMatrixWorld(true);const groups=new Map();
 for(const o of [...rockRoot.children]){if(!o.isMesh||o.userData.keepIndexed)continue;const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrix);if(!groups.has(o.material))groups.set(o.material,[]);groups.get(o.material).push(g);o.geometry.dispose();rockRoot.remove(o);}
 for(const [material,parts]of groups){let g=mergeGeometries(parts);parts.forEach(p=>p.dispose());mesh(g,material,'Batched limestone, dry bank and M.E.G. fittings / '+material.name);}
 // Layout proxy avoids raycasting a geological triangle soup at 8Hz.
 function focusDistance(camera,max){const d=new T.Vector3();camera.getWorldDirection(d);const p=camera.position;for(let t=.25;t<max;t+=.18){const x=p.x+d.x*t,y=p.y+d.y*t,z=p.z+d.z*t;const inside=Math.hypot(x,z)<radialLimit(x,z)||inAnnex(x,z)||(x>1.15&&x<4.85&&z<-1&&z>-10.5);if(!inside||y<poolFloor(x,z)||y>4.1)return t;}return max;}
 scene.updateMatrixWorld(true);return{scene,water,falls,materials:mats,uniforms,dynamics,update,capture,audio,dispose,focusDistance};
}
