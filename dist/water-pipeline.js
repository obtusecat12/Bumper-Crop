import * as T from './vendor/three.module.min.js';
import {createWaterSurface} from './water-surface.js?v=54';
import {createWaterEnvironment} from './water-environment.js?v=54';
import {createWaterVisibility} from './water-visibility.js?v=54';
import {createCameraFocus} from './camera-focus.js?v=54';
import {cocFragment,dilateFragment,lensGLSL,discGLSL} from './dof-shaders.js?v=54';
import {createAlmondInspection,createAlmondWorldVisibility} from './almond-water-inspection.js?v=54';
import {almondEnvironment,GLASS_LAYER} from './almond-water-assets.js?v=54';
export const INTERNAL_HEIGHT=720,DOF_SCALE=.5,DOF_TAPS=16;
export const passVertex=`precision highp float;precision highp sampler2D;in vec3 position;out vec2 uv;void main(){uv=position.xy*.5+.5;gl_Position=vec4(position,1.);}`;
export const copyDepthFragment=`precision highp float;precision highp sampler2D;uniform sampler2D picture,depth;in vec2 uv;out vec4 outColor;void main(){outColor=texture(picture,uv);gl_FragDepth=texture(depth,uv).r;}`;
export const fusedFragment=`precision highp float;precision highp sampler2D;
 uniform sampler2D picture,depth,cocField,wetHeight,bubbleField,washNoise,bottomSoil;
 uniform vec2 fieldSize;uniform mat4 inverseProjection,cameraWorld;
 uniform float wet,bubbleWeight,waterActive,washWeight,washAge,exiting,time,level,exitFlash;
 uniform vec2 flareSun;uniform float flareStrength,flareAspect;uniform vec3 eye,screenLight;in vec2 uv;out vec4 outColor;
 ${lensGLSL}
 ${discGLSL}
 vec2 safe(vec2 p){return clamp(p,1./resolution,1.-1./resolution);}
 // Physical lens/near-plane intersection, not a UV-height threshold.
 vec3 nearPoint(vec2 q){vec4 p=inverseProjection*vec4(q*2.-1.,-1.,1.);return (cameraWorld*vec4(p.xyz/p.w,1.)).xyz;}
 float lensHeight(vec2 q){vec3 p=nearPoint(q);return p.y-level;}
 vec4 meniscusAt(vec2 q){
  if(waterActive<.5||abs(eye.y-level)>=.4)return vec4(0.);
  float h=lensHeight(q);vec2 pixel=vec2(1./resolution.y);
  vec2 gradient=vec2(lensHeight(q+vec2(pixel.x,0.))-h,lensHeight(q+vec2(0.,pixel.y))-h)*resolution.y;
  vec2 screenGradient=vec2(gradient.x*resolution.y/resolution.x,gradient.y);
  float magnitude=max(length(screenGradient),.000001);
  vec2 normalScreen=screenGradient/magnitude,tangent=vec2(-normalScreen.y,normalScreen.x);
  float wave=.004*sin(time*2.1+dot(q*vec2(resolution.x/resolution.y,1.),tangent)*18.);
  float distanceOnScreen=h/magnitude-wave;
  float band=1.-smoothstep(.011,.015,abs(distanceOnScreen));
  float edge=exp(-pow((distanceOnScreen-.004)/.0019,2.));
  float bend=.010*sin(clamp(distanceOnScreen/.03,-1.,1.)*3.14159265);
  return vec4(normalScreen*vec2(resolution.y/resolution.x,1.)*(-wave+bend),band,edge);
 }
 float waterPath(vec2 q){
  if(waterActive<.5||eye.y-level>.4)return 0.;
  vec4 p=inverseProjection*vec4(q*2.-1.,-1.,1.);vec3 v=normalize(p.xyz/p.w),ray=mat3(cameraWorld)*v;
  float rawDepth=texture(depth,q).r;
  // The far-plane depth value belongs to the background sky, not a lakebed
  // 480 m away. Sending it through 180 m of absorption made the entire lower
  // screen a featureless cyan slab whenever ground was clipped/missing.
  float distanceToScene=rawDepth>=.9998?18.:
   min(180.,linearZ(rawDepth)/max(.0001,-v.z));
  float a=eye.y-level,b=a+ray.y*distanceToScene;
  // Clip the optical ray segment against the water half-space. The surface
  // already owns interface -> bed; source depth ends at that interface.
  if(a<=0.&&b<=0.)return distanceToScene;
  if(a>=0.&&b>=0.)return 0.;
  float crossing=clamp(a/(a-b),0.,1.);
  return distanceToScene*(a<0.?crossing:1.-crossing);
 }
 // CPU finite derivatives are baked only on wet-field changes, no extra pass.
 // RG signed normals, B thickness, A coverage; linear data, sampled once.
 vec4 fieldAt(vec2 q){
  float air=waterActive>.5?smoothstep(-.0015,.0015,lensHeight(q)):1.;
  if(bubbleWeight>.001&&air<.5&&washWeight<.02){vec4 b=texture(bubbleField,vec2(q.x,1.-q.y));return vec4((b.rg*255.-128.)/127.,b.a*bubbleWeight,-1.);}
  if(wet<.001&&washWeight<.001)return vec4(0.);
  vec4 h=texture(wetHeight,vec2(q.x,1.-q.y));vec2 xy=(h.rg*255.-128.)/127.;
  vec3 rainN=normalize(vec3(xy,sqrt(max(.001,1.-dot(xy,xy)))));
  float coverage=smoothstep(.025,.92,h.a)*wet*air,thickness=h.b*3.*wet;
  if(washWeight<.001)return vec4(rainN.xy,coverage,thickness);
  vec3 wn=texture(washNoise,q*vec2(1.1,1.47)+vec2(time*.025,time*.19)).xyz*2.-1.;
  wn.xy*=1.35;vec3 washN=normalize(vec3(wn.xy,1.));
  // Fisheye sheet at crossing; holes open, then a curtain drains TOP -> bottom.
  float radial=max(0.,1.-washAge*3.);washN.xy+=(q-.5)*radial*.50;
  float front=1.-washAge/2.0,curtain=1.-smoothstep(front-.04,front+.16,q.y);
  float opening=texture(washNoise,q*2.7+vec2(0.,time*.11)).r;
  float rupture=1.-smoothstep(.45,2.1,washAge)*smoothstep(.46,.63,opening);
  float weight=washWeight*mix(1.,curtain*rupture,exiting)*mix(1.,air,exiting);
  vec3 n=normalize(mix(rainN,washN,weight));coverage=max(coverage,weight);thickness=mix(thickness,1.1,weight);
  return vec4(n.xy,coverage,thickness);
 }
 vec2 warp(vec2 q,vec4 field,float dispersion){
  if(field.w<0.)return safe(q+field.xy*field.z*.006*dispersion*vec2(resolution.y/resolution.x,1.));
  vec2 xy=field.xy;float l=dot(xy,xy);if(l>.999)xy*=sqrt(.999/l);
  vec3 n=vec3(xy,sqrt(max(.001,1.-dot(xy,xy))));
  vec3 r=refract(refract(vec3(0.,0.,-1.),n,1./1.333),vec3(0.,0.,1.),1.333);
  vec2 shift=clamp(r.xy/max(.35,-r.z)*(.10+.032*sqrt(clamp(field.w,0.,2.))),vec2(-.085),vec2(.085));
  shift.x*=resolution.y/resolution.x;return safe(q+shift*field.z*dispersion);
 }
 vec3 absorbAt(vec2 q){
  if(waterActive<.5)return texture(picture,q).rgb;
  float rawDepth=texture(depth,q).r;
  vec3 color=texture(picture,q).rgb;float d=waterPath(q);
  if(rawDepth>=.9998&&waterActive>.5&&eye.y<level+.02){
   vec3 ray=normalize(nearPoint(q)-eye);
   // A downward ray in a lake must meet lakebed, even if the streamed ground
   // tile missed this pixel for a frame. A world-anchored silt sample keeps
   // spatial detail rather than allowing sky color to become solid blue.
   if(ray.y<-.06){float bedDist=(level-3.1-eye.y)/ray.y;
    if(bedDist>0.&&bedDist<18.){
     vec2 bedXZ=eye.xz+ray.xz*bedDist;
     color=texture(bottomSoil,bedXZ*.25).rgb*vec3(1.08,1.58,2.10);
     d=bedDist;
    }
   }
  }
  vec3 transmission=exp(-vec3(.4,.15,.05)*d);
  return color*transmission+vec3(.024,.061,.054)*(1.-transmission);
 }
 vec3 opticalFlare(vec2 q){
 if(flareStrength<.001)return vec3(0.);vec2 aspect=vec2(flareAspect,1.),v=(q-flareSun)*aspect,axis=vec2(.5)-flareSun;
 float rr=dot(v,v);vec3 c=vec3(1.,.75,.38)*(exp(-rr/.011025)*.36+exp(-rr/.000784)*.70);
 for(int i=0;i<3;i++){float f=.55+float(i)*.62;vec2 g=(q-(flareSun+axis*f))*aspect;float r=.025+float(i)*.013;float ring=exp(-pow((length(g)-r)/.008,2.));c+=mix(vec3(.28,.42,.20),vec3(.36,.22,.42),float(i)*.5)*(exp(-dot(g,g)/(r*r))*.16+ring*.08);}
 c+=vec3(.30,.20,.10)*exp(-abs(v.y)*80.)*exp(-abs(v.x)*2.3)*.11;
 return c*flareStrength;
 }
 void main(){
  vec4 central=fieldAt(uv),meniscus=meniscusAt(uv);
  vec2 warped=safe(warp(uv,central,1.)+meniscus.xy*meniscus.z);
  float z=linearZ(texture(depth,warped).r);
  float coc=signedCoC(z);vec2 support=texture(cocField,warped).rg*12.;
  float wetBlur=central.z*(central.w<0.?.10:clamp(.18+central.w*.30,.18,.65));
  float waterRadius=max(wetBlur*4.,exitFlash*5.);
  float farRadius=max(max(coc,0.),waterRadius),nearRadius=support.r;
  float radius=max(farRadius,nearRadius);vec3 color=absorbAt(warped),bloom=vec3(0.);
  float farBlend=smoothstep(.55,1.55,farRadius),nearCoverage=0.;
  if(radius>.55){
   vec3 farSum=vec3(0.),nearSum=vec3(0.);float farWeight=0.,nearWeight=0.;
   if(farRadius>.55||exitFlash>0.){
   for(int i=0;i<16;i++){
    vec2 disk=disc(i);
    vec2 offset=disk*farRadius/resolution,q=safe(warped+offset);
    float sampleZ=linearZ(texture(depth,q).r),sc=signedCoC(sampleZ);
    // Reject foreground taps in the background gather, including all CA taps.
    float w=waterRadius>.1?1.:smoothstep(-.2,.2,sc)*min(1.,z/max(sampleZ,.01))*
      (1.-smoothstep(.02,.15,abs(sampleZ-z)/max(z,1.)));
    vec2 qr=safe(warped+offset*1.04),qb=safe(warped+offset*.96);
    float zr=linearZ(texture(depth,qr).r),zb=linearZ(texture(depth,qb).r);
    if(waterRadius<.1){if(abs(zr-sampleZ)>.12*max(sampleZ,1.))qr=q;if(abs(zb-sampleZ)>.12*max(sampleZ,1.))qb=q;}
    vec3 c=vec3(absorbAt(qr).r,absorbAt(q).g,absorbAt(qb).b);
    float ring=smoothstep(.68,.98,length(disk))*smoothstep(.8,2.5,max(c.r,max(c.g,c.b)))*.09;
    farSum+=c*w*(1.+ring);farWeight+=w;bloom+=max(c-vec3(.65),vec3(0.))/16.;
    }
   }
   if(nearRadius>.55){
   for(int i=0;i<16;i++){
    vec2 disk=disc(i);
    // A foreground source spreads only inside its OWN CoC disc. Never borrow
    // background colour for a blurred stalk or let far blur overwrite it.
    vec2 no=disk*nearRadius/resolution,nq=safe(warped+no);
    float nz=linearZ(texture(depth,nq).r),nc=-signedCoC(nz);
    float nw=smoothstep(.55,1.25,nc)*(1.-smoothstep(max(0.,nc-1.),nc+1.,length(disk)*nearRadius));
    nw*=1.-smoothstep(.03,.16,(nz-z)/max(z,1.));
    vec2 nr=safe(warped+no*.96),nb=safe(warped+no*1.04);
    if(abs(linearZ(texture(depth,nr).r)-nz)>.12*max(nz,1.))nr=nq;
    if(abs(linearZ(texture(depth,nb).r)-nz)>.12*max(nz,1.))nb=nq;
    vec3 ncolor=vec3(absorbAt(nr).r,absorbAt(nq).g,absorbAt(nb).b);
    nearSum+=ncolor*nw;nearWeight+=nw;
    }
   }
   if(farWeight>.001)color=mix(color,farSum/farWeight,farBlend);
   nearCoverage=clamp(nearWeight/16.,0.,1.);
   if(nearWeight>.001)color=mix(color,nearSum/nearWeight,nearCoverage);
  }
  color+=opticalFlare(uv);
  color*=1.-meniscus.z*.06;color+=vec3(.16,.19,.18)*meniscus.w;
  if(central.z>.002){
   vec3 n=normalize(vec3(central.xy,sqrt(max(.001,1.-dot(central.xy,central.xy)))));
   vec3 light=normalize(screenLight),halfV=normalize(vec3(0,0,1)+light);
   float edge=smoothstep(.36,.76,length(central.xy));
   float dark=max(0.,-dot(central.xy,normalize(light.xy+vec2(.0001))));
   color*=1.-dark*edge*.26*central.z;
   color+=vec3(.68,.79,.81)*pow(max(0.,dot(n,halfV)),48.)*central.z*.19;
  }
  color=color*(1.+exitFlash*.72)+bloom*.10*exitFlash*.62;
  float coverage=max(max(max(farBlend,nearCoverage),central.z),max(max(smoothstep(.0002,.005,waterPath(uv)),meniscus.z),exitFlash));
  coverage=max(coverage,clamp(flareStrength,0.,1.));
  vec3 sharpBase=texture(picture,uv).rgb;
  // Resolve applies coverage exactly once; packing an already mixed colour
  // would square foreground alpha and turn soft discs into faint sharp ghosts.
  outColor=coverage>.001?vec4((color-sharpBase*(1.-coverage))/coverage,coverage):vec4(sharpBase,0.);
 }`;
export const resolveFragment=`precision highp float;precision highp sampler2D;uniform sampler2D fused,sharp,uiPicture,depth,cocField;
 ${lensGLSL}
uniform float exposure;uniform int displayMode;uniform bool hasUI,uiOnly;in vec2 uv;out vec4 outColor;
 vec3 encode(vec3 x){return mix(x*12.92,1.055*pow(max(x,vec3(0.)),vec3(1./2.4))-.055,step(vec3(.0031308),x));}
 vec3 aces(vec3 c){mat3 inM=mat3(vec3(.59719,.07600,.02840),vec3(.35458,.90834,.13383),vec3(.04823,.01566,.83777));mat3 outM=mat3(vec3(1.60475,-.10208,-.00327),vec3(-.53108,1.10813,-.07276),vec3(-.07367,-.00605,1.07602));c=inM*(c*exposure/.6);c=(c*(c+.0245786)-.000090537)/(c*(.983729*c+.4329510)+.238081);return clamp(outM*c,0.,1.);}
 void main(){vec2 p=displayMode==2?vec2(uv.x,1.-uv.y):uv;vec3 c=vec3(0.);
 if(!uiOnly){vec4 f=texture(fused,p);float z=linearZ(texture(depth,p).r);
  vec2 halfSize=ceil(resolution*.5),centre=(floor(p*halfSize)+.5)/halfSize;
  float hz=linearZ(texture(depth,centre).r);
  float protect=1.-smoothstep(.025,.12,(hz-z)/max(z,.3));
  c=encode(aces(mix(texture(sharp,p).rgb,f.rgb,f.a*protect)));}
 if(hasUI){vec4 ui=texture(uiPicture,p);c=mix(c,ui.rgb,ui.a);}
 if(displayMode==2){ivec3 rgb=ivec3(floor(c*255.+.5));int l=299*rgb.r+587*rgb.g+114*rgb.b;
 ivec3 graded=(clamp(29000*rgb-ivec3(4*l),ivec3(0),ivec3(6375000))+12500)/25000;
 if(all(equal(rgb,ivec3(5,74,153))))graded.b=167;if(all(equal(rgb,ivec3(99,20,156))))graded.b=171;c=vec3(graded)/255.;}
 outColor=vec4(c,1.);
 }`;
export function createWaterPipeline(renderer,{ripples,lens,waterState,flare,sky,fog}){
 const surface=createWaterSurface(ripples),focus=createCameraFocus(),environment=createWaterEnvironment(renderer,sky);
 const inspection=createAlmondInspection(),bottleVisibility=createAlmondWorldVisibility();
 if(environment)surface.uniforms.environment.value=environment.texture;
 const geometry=new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute([-1,-1,0,3,-1,0,-1,3,0],3)),scene=new T.Scene(),screenCamera=new T.Camera();
 const mat=(f,u,depth=false)=>new T.RawShaderMaterial({glslVersion:T.GLSL3,vertexShader:passVertex,fragmentShader:f,uniforms:u,depthTest:depth,depthFunc:T.AlwaysDepth,depthWrite:depth,blending:T.NoBlending,toneMapped:false});
 const copy=mat(copyDepthFragment,{picture:{value:null},depth:{value:null}},true);
 const u={picture:{value:null},depth:{value:null},wetHeight:{value:null},bubbleField:{value:null},bubbleWeight:{value:0},washNoise:{value:surface.normalA},bottomSoil:{value:surface.bottomSoil},resolution:{value:new T.Vector2()},fieldSize:{value:new T.Vector2()},inverseProjection:{value:new T.Matrix4()},cameraWorld:{value:new T.Matrix4()},nearPlane:{value:.1},farPlane:{value:480},focusDist:{value:2.58},focalMM:{value:2.478},fNumber:{value:2.8},sensorHeight:{value:3.6},dofEnabled:{value:1},cocField:{value:null},wet:{value:0},waterActive:{value:0},washWeight:{value:0},washAge:{value:0},exiting:{value:0},time:{value:0},level:{value:0},exitFlash:{value:0},eye:{value:new T.Vector3()},screenLight:{value:new T.Vector3(-.42,.67,.83)},flareSun:flare?.uniforms.uSun||{value:new T.Vector2()},flareStrength:flare?.uniforms.uStrength||{value:0},flareAspect:flare?.uniforms.uAspect||{value:4/3}};
 const cocPass=mat(cocFragment,Object.fromEntries(['depth','focalMM','fNumber','sensorHeight','focusDist','nearPlane','farPlane','dofEnabled','resolution'].map(k=>[k,u[k]]))),dilateU={coc:{value:null},direction:{value:new T.Vector2()},resolution:u.resolution},dilatePass=mat(dilateFragment,dilateU);
 const fused=mat(fusedFragment,u),resolve=mat(resolveFragment,{...u,fused:{value:null},sharp:{value:null},exposure:{value:1.23},uiPicture:{value:null},hasUI:{value:false},uiOnly:{value:false},displayMode:{value:0}}),quad=new T.Mesh(geometry,copy);quad.frustumCulled=false;scene.add(quad);
 let opaque=null,water=null,half=null,cocA=null,cocB=null,bottleTarget=null,width=0,height=0,clock=0;const waterMeshes=new Set(),visibility=createWaterVisibility();
 // Keep the tiny sky cubemap warm even offscreen: returning to a lake must
 // not reveal stale reflections. Only full-screen water work is culled.
 const stats={internalWidth:0,internalHeight:0,compositeWidth:0,compositeHeight:0,fusedPasses:0,depthCopies:0,taps:16,cocPasses:0,waterVisible:false,waterSkips:0};
 function target(w,h,depth){const rt=new T.WebGLRenderTarget(w,h,{type:renderer.extensions.has('EXT_color_buffer_float')?T.HalfFloatType:T.UnsignedByteType,depthBuffer:depth,minFilter:T.LinearFilter,magFilter:T.LinearFilter,generateMipmaps:false});rt.texture.colorSpace=T.NoColorSpace;if(depth){rt.depthTexture=new T.DepthTexture(w,h,T.UnsignedIntType);rt.depthTexture.minFilter=rt.depthTexture.magFilter=T.NearestFilter;}return rt;}
 function allocate(w,h){if(width===w&&height===h&&opaque)return;disposeTargets();width=w;height=h;opaque=target(w,h,true);opaque.samples=Math.min(4,renderer.capabilities.maxSamples);opaque.resolveDepthBuffer=true;water=target(w,h,true);half=target(Math.max(1,Math.ceil(w*.5)),Math.max(1,Math.ceil(h*.5)),false);
  cocA=target(half.width,half.height,false);cocB=target(half.width,half.height,false);
  stats.internalWidth=w;stats.internalHeight=h;stats.compositeWidth=half.width;stats.compositeHeight=half.height;u.resolution.value.set(w,h);surface.uniforms.size.value.set(w,h);
 }
 function disposeTargets(){opaque?.dispose();water?.dispose();half?.dispose();cocA?.dispose();cocB?.dispose();bottleTarget?.dispose();opaque=water=half=cocA=cocB=bottleTarget=null;width=height=0;}
 function attach(chunk){bottleVisibility.attach(chunk);surface.attach(chunk);focus.attach(chunk);chunk.group.traverse(o=>{if(o.userData.waterSurface)waterMeshes.add(o);});}
 function detach(chunk){bottleVisibility.detach(chunk);focus.detach(chunk);chunk.group.traverse(o=>{if(o.userData.waterSurface){waterMeshes.delete(o);if(o.userData.originalWaterMaterial)o.material=o.userData.originalWaterMaterial;}});}
 function update(dt,camera,state,active,locked,color,sun,mist,level){if(active)clock+=dt;focus.update(dt,camera,active,locked,Math.hypot(state?.velocity?.x||0,state?.velocity?.z||0));camera.updateMatrixWorld();surface.update(clock,camera,color,sun,0);u.time.value=clock;u.level.value=level||0;u.focusDist.value=focus.result.distance;u.focalMM.value=focus.result.focalLength;u.dofEnabled.value=locked?0:1;u.nearPlane.value=camera.near;u.farPlane.value=camera.far;u.eye.value.copy(camera.position);u.inverseProjection.value.copy(camera.projectionMatrixInverse);u.cameraWorld.value.copy(camera.matrixWorld);
  u.waterActive.value=waterState.hasWater?1:0;u.washWeight.value=lens.washWeight;u.washAge.value=lens.washAge;u.exiting.value=lens.submerged?0:1;u.bubbleField.value=lens.microbubbles.texture;u.bubbleWeight.value=lens.microbubbles.weight;u.exitFlash.value=waterState.flash;
  if(sun){u.screenLight.value.copy(sun).transformDirection(camera.matrixWorldInverse);u.screenLight.value.z=Math.abs(u.screenLight.value.z)+.16;}
  inspection.update(dt,camera,active);if(inspection.active)u.dofEnabled.value=0;
 }
 function draw(m,target){quad.material=m;renderer.setRenderTarget(target);renderer.render(scene,screenCamera);}
 function render(world,camera,beforeScene,w,h,output,uiTexture=null,mode=0){allocate(w,h);const saved=renderer.getRenderTarget(),auto=renderer.autoClear,mask=camera.layers.mask,bg=world.background;
  try{resolve.uniforms.uiOnly.value=false;resolve.uniforms.uiPicture.value=uiTexture;resolve.uniforms.hasUI.value=!!uiTexture;resolve.uniforms.displayMode.value=mode;beforeScene?.();sky?.userData.renderClouds?.(camera,w,h);const visibleWater=visibility.any(waterMeshes,camera),visibleBottles=bottleVisibility.any(camera);stats.waterVisible=visibleWater;stats.bottleGlassVisible=visibleBottles;if(!visibleWater)stats.waterSkips++;if(environment&&(waterMeshes.size||visibleBottles||inspection.active)){environment.update(clock,camera);surface.uniforms.environmentReady.value=environment.ready?1:0;if(environment.ready)almondEnvironment.value=environment.texture;}renderer.autoClear=true;camera.layers.set(0);renderer.setRenderTarget(opaque);renderer.render(world,camera);let source=opaque;
   if(visibleWater){copy.uniforms.picture.value=opaque.texture;copy.uniforms.depth.value=opaque.depthTexture;draw(copy,water);stats.depthCopies++;
    surface.uniforms.sceneColor.value=opaque.texture;surface.uniforms.sceneDepth.value=opaque.depthTexture;
    renderer.autoClear=false;world.background=null;camera.layers.set(2);renderer.setRenderTarget(water);renderer.render(world,camera);source=water;}
   if(visibleBottles){if(!bottleTarget)bottleTarget=target(w,h,true);renderer.autoClear=true;copy.uniforms.picture.value=source.texture;copy.uniforms.depth.value=source.depthTexture;draw(copy,bottleTarget);bottleVisibility.bind(source.texture,w,h,camera);renderer.autoClear=false;world.background=null;camera.layers.set(GLASS_LAYER);renderer.setRenderTarget(bottleTarget);renderer.render(world,camera);source=bottleTarget;}
   world.background=bg;camera.layers.mask=mask;renderer.autoClear=true;
   let picture=fog?.compose(source,camera,{waterActive:waterState.hasWater,level:u.level.value})||source.texture;
   if(inspection.active){
    // Ping-pong the three existing world targets. Preserve source.depthTexture
    // for the lens and never allocate a pair of fullscreen inspection buffers.
    const inspectA=source===opaque?water:opaque;
    copy.uniforms.picture.value=picture;copy.uniforms.depth.value=source.depthTexture;draw(copy,inspectA);renderer.autoClear=false;inspection.opaque(renderer,inspectA);picture=inspectA.texture;
    if(inspection.hasGlass){
     if(!bottleTarget)bottleTarget=target(w,h,true);
     const inspectB=source===bottleTarget?water:bottleTarget;
     renderer.autoClear=true;copy.uniforms.picture.value=inspectA.texture;copy.uniforms.depth.value=inspectA.depthTexture;draw(copy,inspectB);renderer.autoClear=false;inspection.glass(renderer,inspectB,inspectA.texture,w,h);picture=inspectB.texture;
    }
    renderer.autoClear=true;
   }
   u.picture.value=picture;u.depth.value=source.depthTexture;if(!waterState.wet||waterState.washWeight>0||!u.wetHeight.value)u.wetHeight.value=lens.prepareField();u.fieldSize.value.set(lens.physics.fieldWidth,lens.physics.fieldHeight);u.wet.value=lens.wetWeight;
   draw(cocPass,cocA);dilateU.coc.value=cocA.texture;dilateU.direction.value.set(1,0);draw(dilatePass,cocB);
   dilateU.coc.value=cocB.texture;dilateU.direction.value.set(0,1);draw(dilatePass,cocA);u.cocField.value=cocA.texture;stats.cocPasses+=3;
   draw(fused,half);stats.fusedPasses++;
   resolve.uniforms.fused.value=half.texture;resolve.uniforms.sharp.value=picture;resolve.uniforms.exposure.value=renderer.toneMappingExposure;draw(resolve,output);
  }finally{world.background=bg;camera.layers.mask=mask;renderer.autoClear=auto;renderer.setRenderTarget(saved);}
 }
 function renderUI(w,h,output,texture,mode){allocate(w,h);resolve.uniforms.uiOnly.value=true;resolve.uniforms.hasUI.value=!!texture;resolve.uniforms.uiPicture.value=texture;resolve.uniforms.displayMode.value=mode;draw(resolve,output);}
 return {render,renderUI,attach,detach,update,focus,surface,environment,stats,inspection,removeBottle:group=>bottleVisibility.remove(group),reset(camera){inspection.clear();focus.reset(camera);environment?.reset();},contextLost(){disposeTargets();fog?.contextLost();environment?.reset();lens.contextLost();u.wetHeight.value=null;},dispose(){inspection.dispose();bottleVisibility.clear();disposeTargets();environment?.dispose();surface.dispose();geometry.dispose();copy.dispose();cocPass.dispose();dilatePass.dispose();fused.dispose();resolve.dispose();waterMeshes.clear();}};
}
