import * as T from './vendor/three.module.min.js';
import {weatherSurface} from './weather-surfaces.js?v=34';

// One immutable seed buffer drives the whole rain volume. Surface particles
// upload origin/launch data only on birth; all trajectories and billboard
// expansion run in the vertex shader. There are three bounded draw batches.
const GRID=32,SPAN=48,HEIGHT=28,RAIN_COUNT=2600,IMPACTS=96,DROPS_PER_HIT=6;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function quads(count){
 const source=new T.PlaneGeometry(1,1),g=new T.InstancedBufferGeometry();
 g.index=source.index;g.attributes=source.attributes;g.instanceCount=count;return g;
}
function attribute(g,name,count,size,dynamic=false){
 const a=new T.InstancedBufferAttribute(new Float32Array(count*size),size);
 if(dynamic)a.setUsage(T.DynamicDrawUsage);g.setAttribute(name,a);return a;
}
function written(a,start,count){a.addUpdateRange(start,count);a.needsUpdate=true;}
function patternedMist(){
 const n=64,pixels=new Uint8Array(n*n*4);
 // Periodic smooth optical-density detail, not an authored colour overlay.
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  const a=x/n*Math.PI*2,b=y/n*Math.PI*2;
  const k=clamp(.50+.15*Math.sin(a*3+b*2)+.13*Math.sin(a*7-b*5+.7)+.09*Math.cos(a*11+b*9+1.2)+.05*Math.sin(a*19-b*17),0,1);
  const j=(y*n+x)*4;pixels[j]=pixels[j+1]=pixels[j+2]=Math.round(k*255);pixels[j+3]=255;
 }
 const t=new T.DataTexture(pixels,n,n,T.RGBAFormat);t.wrapS=t.wrapT=T.RepeatWrapping;
 t.minFilter=t.magFilter=T.LinearFilter;t.generateMipmaps=false;t.needsUpdate=true;return t;
}

export function createRainRenderer(scene,{rng=Math.random,onRipple=null,surfaceQuery=weatherSurface}={}){
 const floorData=new Float32Array(GRID*GRID).fill(1000);
 const floor=new T.DataTexture(floorData,GRID,GRID,T.RedFormat,T.FloatType);
 floor.minFilter=floor.magFilter=T.NearestFilter;floor.generateMipmaps=false;floor.needsUpdate=true;
 const mistTexture=patternedMist();
 const u={
  uRainTime:{value:0},uRainStrength:{value:0},uRainBottom:{value:0},
  uRainMin:{value:new T.Vector2()},uRainOrigin:{value:new T.Vector2()},
  uRainFloor:{value:floor},uRainDrift:{value:new T.Vector2()},
  uRainWind:{value:new T.Vector2(.65,.22)},uRainCameraVelocity:{value:new T.Vector3()},
  uRainRight:{value:new T.Vector3(1,0,0)},uRainLight:{value:new T.Vector3(-.45,.84,-.30).normalize()},
  uRainRebase:{value:new T.Vector2()},uRainMist:{value:mistTexture}
 };
 const geometry=quads(RAIN_COUNT),seeds=attribute(geometry,'rainSeed',RAIN_COUNT,4);
 for(let i=0;i<RAIN_COUNT;i++)seeds.setXYZW(i,rng(),rng(),rng(),rng());
 const material=new T.MeshBasicMaterial({color:'#cedbdc',transparent:true,depthWrite:false,side:T.DoubleSide});
 material.forceSinglePass=true;material.defines={USE_UV:''};
 material.onBeforeCompile=s=>{
  Object.assign(s.uniforms,u);
  s.vertexShader=`attribute vec4 rainSeed;
uniform float uRainTime,uRainStrength,uRainBottom;
uniform vec2 uRainMin,uRainOrigin,uRainDrift,uRainWind;
uniform vec3 uRainCameraVelocity,uRainRight,uRainLight;
uniform sampler2D uRainFloor;
varying float vRainFade,vRainLight,vRainSeed;
`+s.vertexShader;
  s.vertexShader=s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   float speed=mix(15.5,22.0,rainSeed.x);
   vec2 xz=mod(rainSeed.xz*${SPAN.toFixed(1)}+uRainDrift-uRainOrigin-uRainMin,${SPAN.toFixed(1)})+uRainMin;
   float yy=uRainBottom+mod(rainSeed.y*${HEIGHT.toFixed(1)}-uRainTime*speed-uRainBottom,${HEIGHT.toFixed(1)});
   vec3 head=vec3(xz.x,yy,xz.y);
   vec3 toEye=normalize(cameraPosition-head);
   vec3 relativeVelocity=vec3(uRainWind.x,-speed,uRainWind.y)-uRainCameraVelocity;
   float exposure=mix(.020,.033,rainSeed.z);
   vec3 side=cross(relativeVelocity,toEye);
   side=length(side)>.001?normalize(side):uRainRight;
   float eyeDistance=length(cameraPosition-head);
   float width=max(mix(.006,.013,rainSeed.y),eyeDistance*.00065);
   // The older endpoint belongs to the camera's older exposure position.
   // Thus walking/looking across falling rain changes streak slant correctly.
   transformed=head-relativeVelocity*(position.y+.5)*exposure+side*position.x*width;
   vec2 edge=min(xz-uRainMin,uRainMin+${SPAN.toFixed(1)}-xz);
   float nearFade=smoothstep(.25,.85,eyeDistance);
   float support=texture2D(uRainFloor,(xz-uRainMin)/${SPAN.toFixed(1)}).r;
   vRainFade=smoothstep(0.,3.,min(edge.x,edge.y))*nearFade*(.75+.25*uRainStrength);
   float lightFacing=max(0.,dot(-toEye,normalize(uRainLight)));
   float roughness=mix(.22,.50,rainSeed.z);
   float lobe=pow(lightFacing,mix(18.,4.,roughness));
   vRainLight=.20+.90*lobe+.16*abs(uRainLight.y);
   vRainSeed=rainSeed.w;
   if(yy<support+.045||rainSeed.w>uRainStrength){transformed=vec3(10000.);vRainFade=0.;}
  `);
  s.fragmentShader='varying float vRainFade,vRainLight,vRainSeed;\n'+s.fragmentShader;
  s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   float transverse=exp(-pow((vUv.x-.5)*3.8,2.));
   float ends=smoothstep(0.,.13,vUv.y)*(1.-smoothstep(.60,1.,vUv.y));
   float longitudinal=.63+.24*sin(vUv.y*17.+vRainSeed*13.)+.13*cos(vUv.y*31.-vRainSeed*9.);
   diffuseColor.rgb*=.66+.70*vRainLight;
   diffuseColor.a=transverse*ends*longitudinal*vRainFade*min(.82,.19+vRainLight*.47);
   if(diffuseColor.a<.008)discard;
  `);
 };
 material.customProgramCacheKey=()=> 'gpu-rain-relative-motion-optics-v26';
 const rain=new T.Mesh(geometry,material);rain.name='rain / GPU motion-stretched optical streaks';rain.frustumCulled=false;rain.visible=false;scene.add(rain);

 const rings=new T.Group();rings.name='rain / GPU surface impacts and thin ground mist';rings.visible=false;scene.add(rings);
 const dropGeometry=quads(IMPACTS*DROPS_PER_HIT);
 const dropBirth=attribute(dropGeometry,'impactBirth',IMPACTS*DROPS_PER_HIT,4,true);
 const dropLaunch=attribute(dropGeometry,'impactLaunch',IMPACTS*DROPS_PER_HIT,4,true);
 const dropMeta=attribute(dropGeometry,'impactMeta',IMPACTS*DROPS_PER_HIT,2,true);
 const dropMaterial=new T.MeshBasicMaterial({color:'#dde6e4',transparent:true,depthWrite:false,side:T.DoubleSide});
 dropMaterial.forceSinglePass=true;dropMaterial.defines={USE_UV:''};
 dropMaterial.onBeforeCompile=s=>{
  Object.assign(s.uniforms,u);
  s.vertexShader=`attribute vec4 impactBirth,impactLaunch;attribute vec2 impactMeta;
uniform float uRainTime;uniform vec2 uRainRebase;uniform vec3 uRainRight,uRainLight;
varying float vImpactFade,vImpactLight;
`+s.vertexShader;
  s.vertexShader=s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   float age=max(0.,uRainTime-impactBirth.w),life=impactMeta.x;
   float drag=1.6,dragT=(1.-exp(-drag*age))/drag;
   vec3 shift=impactLaunch.xyz*dragT;
   shift.y+=9.81/drag*(dragT-age);
   vec3 center=impactBirth.xyz+vec3(uRainRebase.x,0.,uRainRebase.y)+shift;
   vec3 velocity=impactLaunch.xyz*exp(-drag*age);
   velocity.y-=9.81*dragT;
   vec3 toEye=normalize(cameraPosition-center);
   vec3 axis=length(velocity)>.01?normalize(velocity):vec3(0.,1.,0.);
   vec3 right=cross(axis,toEye);right=length(right)>.001?normalize(right):uRainRight;
   float diameter=impactLaunch.w*(1.+smoothstep(.0,.7,age/life)*.35);
   transformed=center+right*position.x*diameter+axis*position.y*diameter*(1.+length(velocity)*.42);
   vImpactFade=smoothstep(0.,.028,age)*pow(max(0.,1.-age/life),.65);
   vImpactLight=.27+.73*pow(max(0.,dot(-toEye,normalize(uRainLight))),4.);
   if(age>=life||shift.y<-.004||impactBirth.w<0.){transformed=vec3(10000.);vImpactFade=0.;}
  `);
  s.fragmentShader='varying float vImpactFade,vImpactLight;\n'+s.fragmentShader;
  s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   vec2 q=(vUv-.5)*2.;float r2=dot(q,q);if(r2>=1.)discard;
   vec3 n=vec3(q,sqrt(max(0.,1.-r2)));
   float fresnel=.02+.98*pow(1.-n.z,5.);
   float spec=pow(max(0.,dot(n,normalize(vec3(-.43,.67,.76)))),26.);
   float opposite=smoothstep(.05,.90,dot(n.xy,vec2(.55,-.83)));
   diffuseColor.rgb=mix(vec3(.12,.20,.22),vec3(.71,.81,.81),clamp(.23+fresnel*.60+spec*.83-opposite*.13,0.,1.));
   diffuseColor.a=(.15+fresnel*.65+spec*.56)*vImpactFade*(.55+.45*vImpactLight)*(1.-smoothstep(.78,1.,r2));
   if(diffuseColor.a<.009)discard;
  `);
 };
 dropMaterial.customProgramCacheKey=()=> 'gpu-rain-impact-ballistic-drops-v26';
 const drops=new T.Mesh(dropGeometry,dropMaterial);drops.name='rain / ballistic refractive microdroplets';drops.frustumCulled=false;rings.add(drops);

 const mistGeometry=quads(IMPACTS);
 const mistBirth=attribute(mistGeometry,'mistBirth',IMPACTS,4,true);
 const mistMeta=attribute(mistGeometry,'mistMeta',IMPACTS,4,true);
 const mistWind=attribute(mistGeometry,'mistWind',IMPACTS,2,true);
 const mistMaterial=new T.MeshBasicMaterial({color:'#bfcecc',transparent:true,depthWrite:false,side:T.DoubleSide});
 mistMaterial.forceSinglePass=true;mistMaterial.defines={USE_UV:''};
 mistMaterial.onBeforeCompile=s=>{
  Object.assign(s.uniforms,u);
  s.vertexShader=`attribute vec4 mistBirth,mistMeta;attribute vec2 mistWind;
uniform float uRainTime;uniform vec2 uRainRebase;uniform vec3 uRainRight,uRainLight;
varying float vMistAge,vMistSeed,vMistFade,vMistLight;
`+s.vertexShader;
  s.vertexShader=s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   float age=max(0.,uRainTime-mistBirth.w),progress=age/mistMeta.x;
   float width=mistMeta.y*(.22+progress*.95),height=mistMeta.y*(.16+progress*.23);
   vec3 center=mistBirth.xyz+vec3(uRainRebase.x,0.,uRainRebase.y);
   center.xz+=mistWind*age*.12;center.y+=height*.50+age*.025;
   vec3 right=normalize(vec3(uRainRight.x,0.,uRainRight.z)+vec3(.0001,0.,0.));
   transformed=center+right*position.x*width+vec3(0.,position.y*height,0.);
   vMistAge=progress;vMistSeed=mistMeta.z;
   vMistFade=smoothstep(0.,.14,progress)*pow(max(0.,1.-progress),1.5)*mistMeta.w;
   vec3 eye=normalize(cameraPosition-center);
   vMistLight=.30+.70*pow(max(0.,dot(-eye,normalize(uRainLight))),3.);
   if(age>=mistMeta.x||mistBirth.w<0.){transformed=vec3(10000.);vMistFade=0.;}
  `);
  s.fragmentShader='uniform sampler2D uRainMist;varying float vMistAge,vMistSeed,vMistFade,vMistLight;\n'+s.fragmentShader;
  s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   vec2 q=(vUv-.5)*2.;float radial=dot(q,q);
   float detail=texture2D(uRainMist,vUv*.85+vec2(vMistSeed*7.,-vMistAge*.12)).r;
   float curl=texture2D(uRainMist,vUv*1.7+vec2(vMistAge*.16,vMistSeed*3.)).r;
   float density=exp(-radial*2.8)*(.34+.66*detail)*(.57+.43*curl);
   diffuseColor.rgb*=.62+.38*vMistLight;
   diffuseColor.a=density*vMistFade*(.055+.095*vMistLight)*(1.-smoothstep(.72,1.,radial));
   if(diffuseColor.a<.003)discard;
  `);
 };
 mistMaterial.customProgramCacheKey=()=> 'gpu-rain-impact-low-thin-mist-v26';
 const mist=new T.Mesh(mistGeometry,mistMaterial);mist.name='rain / short-lived low spray haze';mist.frustumCulled=false;rings.add(mist);

 let clock=0,budget=0,cursor=0,visibleUntil=0,gridTimer=Infinity,lastGrid='',baseCX=null,baseCZ=null,lastY=null;
 const wind=new T.Vector2(.65,.22),velocity=new T.Vector3(),light=new T.Vector3();
 const statistics={births:0,waterHits:0,attributeUploads:0,gridUpdates:0,batches:3,seedCount:RAIN_COUNT,surfaceDropCapacity:IMPACTS*DROPS_PER_HIT,mistCapacity:IMPACTS};
 function invalidateBirths(){
  for(let i=0;i<IMPACTS*DROPS_PER_HIT;i++)dropBirth.setW(i,-10000);
  for(let i=0;i<IMPACTS;i++)mistBirth.setW(i,-10000);
  dropBirth.needsUpdate=mistBirth.needsUpdate=true;
 }
 invalidateBirths();
 function emitSurfaceHit(x,z,s,state){
  const slot=cursor++%IMPACTS,offsetX=Number(state.cx-baseCX)*64,offsetZ=Number(state.cz-baseCZ)*64;
  const wx=x+offsetX,wz=z+offsetZ,seed=rng(),life=.48+rng()*.32,size=.26+rng()*.35;
  mistBirth.setXYZW(slot,wx,s.y+.01,wz,clock);
  mistMeta.setXYZW(slot,life,size,seed,s.water?.63:1.);
  mistWind.setXY(slot,wind.x,wind.y);
  written(mistBirth,slot*4,4);written(mistMeta,slot*4,4);written(mistWind,slot*2,2);
  for(let j=0;j<DROPS_PER_HIT;j++){
   const index=slot*DROPS_PER_HIT+j,angle=j/DROPS_PER_HIT*Math.PI*2+(rng()-.5)*.65;
   const lateral=.45+rng()*.9,up=.60+rng()*1.25;
   dropBirth.setXYZW(index,wx,s.y+.013,wz,clock);
   dropLaunch.setXYZW(index,Math.cos(angle)*lateral+wind.x*.06,up,Math.sin(angle)*lateral+wind.y*.06,.008+rng()*.017);
   dropMeta.setXY(index,.21+rng()*.22,rng());
  }
  written(dropBirth,slot*DROPS_PER_HIT*4,DROPS_PER_HIT*4);
  written(dropLaunch,slot*DROPS_PER_HIT*4,DROPS_PER_HIT*4);
  written(dropMeta,slot*DROPS_PER_HIT*2,DROPS_PER_HIT*2);
  statistics.births++;statistics.attributeUploads+=6;visibleUntil=Math.max(visibleUntil,clock+life);
  if(s.water&&onRipple){
   onRipple({cx:state.cx,cz:state.cz,x,z,radius:.105+rng()*.080,strength:.003+rng()*.004});
   statistics.waterHits++;
  }
 }
 function update(dt,{state,camera,chunks,rain:amount=0,active=true,wind:windInput=null,cameraVelocity=null,lightDirection=null,submerged=false}){
  if(!active||submerged){rain.visible=rings.visible=false;lastY=null;return;}
  dt=Math.max(0,Number.isFinite(dt)?dt:0);amount=clamp(amount,0,1);clock+=dt;gridTimer+=dt;
  if(baseCX===null){baseCX=state.cx;baseCZ=state.cz;}
  let dx=baseCX-state.cx,dz=baseCZ-state.cz;
  if(dx< -4n||dx>4n||dz< -4n||dz>4n){invalidateBirths();baseCX=state.cx;baseCZ=state.cz;dx=dz=0n;visibleUntil=0;}
  u.uRainRebase.value.set(Number(dx)*64,Number(dz)*64);
  if(windInput){wind.set(Number(windInput.x)||0,Number(windInput.z??windInput.y)||0);}
  else wind.set(.65+Math.sin(clock*.31)*.17,.22+Math.sin(clock*.23+1.4)*.11);
  // Camera translation affects exposure streak direction, not world advection.
  if(cameraVelocity)velocity.set(cameraVelocity.x||0,cameraVelocity.y||0,cameraVelocity.z||0);
  else velocity.set(state.velocity?.x||0,lastY===null||dt===0?0:(camera.position.y-lastY)/dt,state.velocity?.z||0);
  velocity.clampLength(0,28);lastY=camera.position.y;
  if(lightDirection){light.set(lightDirection.x,lightDirection.y,lightDirection.z);if(light.lengthSq()>.001)u.uRainLight.value.copy(light).normalize();}
  u.uRainTime.value=clock;u.uRainStrength.value=amount;u.uRainBottom.value=camera.position.y-10;
  u.uRainCameraVelocity.value.copy(velocity);u.uRainWind.value.copy(wind);u.uRainDrift.value.addScaledVector(wind,dt);
  // Derive right from orientation (matrixWorld may not have been refreshed yet).
  u.uRainRight.value.set(1,0,0).applyQuaternion(camera.quaternion).normalize();
  rain.visible=amount>.005&&!submerged;
  const minX=Math.floor(state.x/4)*4-SPAN/2,minZ=Math.floor(state.z/4)*4-SPAN/2;
  const key=`${state.cx},${state.cz},${minX},${minZ}`;
  if(rain.visible&&(lastGrid!==key||gridTimer>.75)){
   lastGrid=key;gridTimer=0;u.uRainMin.value.set(minX,minZ);
   u.uRainOrigin.value.set(Number((state.cx*64n)%BigInt(SPAN)),Number((state.cz*64n)%BigInt(SPAN)));
   for(let z=0;z<GRID;z++)for(let x=0;x<GRID;x++){
    const s=surfaceQuery(minX+(x+.5)*SPAN/GRID,minZ+(z+.5)*SPAN/GRID,state,chunks,1.07);
    floorData[z*GRID+x]=s?Math.max(s.y,s.roof):1000;
   }
   floor.needsUpdate=true;statistics.gridUpdates++;
  }
  budget=Math.min(6,budget+dt*amount*44);
  while(budget>=1){
   budget--;
   const angle=rng()<.84?(state.yaw||0)+(rng()-.5)*Math.PI*1.12:rng()*Math.PI*2;
   // Most rain impulses stay inside the camera's 16 m water-normal window.
   // A smaller outer band preserves depth without spending the ripple budget
   // on distant disturbances too small to survive the final video filter.
   const radius=rng()<.78?.85+Math.sqrt(rng())*6.1:7.2+Math.sqrt(rng())*8.0;
   const x=state.x-Math.sin(angle)*radius,z=state.z-Math.cos(angle)*radius;
   const s=surfaceQuery(x,z,state,chunks);
   if(!s||s.roof>s.y+.12||(!s.water&&rng()>.72))continue;
   emitSurfaceHit(x,z,s,state);
  }
  rings.visible=clock<visibleUntil;
 }
 function clear(){
  budget=cursor=visibleUntil=clock=0;lastGrid='';gridTimer=Infinity;baseCX=baseCZ=null;lastY=null;
  u.uRainTime.value=u.uRainStrength.value=0;u.uRainDrift.value.set(0,0);
  rain.visible=rings.visible=false;invalidateBirths();
 }
 function dispose(){
  clear();scene.remove(rain,rings);geometry.dispose();material.dispose();dropGeometry.dispose();dropMaterial.dispose();mistGeometry.dispose();mistMaterial.dispose();floor.dispose();mistTexture.dispose();
 }
 return {rain,rings,update,clear,dispose,uniforms:u,statistics};
}
