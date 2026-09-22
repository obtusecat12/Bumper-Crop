import * as T from './vendor/three.module.min.js';
import {LensDropletPhysics,WaterEntryTracker,CameraWaterTracker} from './lens-physics.js?v=27';
export {LensDropletPhysics,WaterEntryTracker,CameraWaterTracker};

// Thin convex water lenses, a 0.5x optical field, and local close-focus blur.
// All water happens inside the existing scene -> lens -> UI -> VHS chain.
export const lensVertex=`precision highp float;
in vec3 position;out vec2 screenUV;
void main(){screenUV=position.xy*.5+.5;gl_Position=vec4(position.xy,0.,1.);}`;

// CPU height is bounded at <=256x256. Surface derivatives are evaluated once
// into a REAL half-resolution target, never in a full-resolution droplet loop.
export const opticalFragment=`precision highp float;
uniform sampler2D heightMap;uniform vec2 fieldSize;uniform float aspect;
in vec2 screenUV;out vec4 outColor;
float heightAt(vec2 p){return (texture(heightMap,clamp(p,.5/fieldSize,1.-.5/fieldSize)).r*255.-128.)/31.75;}
void main(){
 vec2 p=vec2(screenUV.x,1.-screenUV.y),d=1./fieldSize;
 vec4 h=texture(heightMap,clamp(p,d*.5,1.-d*.5));
 vec2 gradient=vec2((heightAt(p+vec2(d.x,0))-heightAt(p-vec2(d.x,0)))*(.5*fieldSize.x)/aspect,
                   (heightAt(p-vec2(0,d.y))-heightAt(p+vec2(0,d.y)))*(.5*fieldSize.y))*.0135;
 vec3 n=normalize(vec3(-gradient,1.));
 // Exact zero is byte128. Signed normal channels need no sRGB conversion.
 outColor=vec4((n.xy*127.+128.)/255.,h.b,h.g);
}`;

const colorFunctions=`
vec3 decodeSRGB(vec3 c){return mix(c/12.92,pow((c+.055)/1.055,vec3(2.4)),step(vec3(.04045),c));}
vec3 encodeSRGB(vec3 c){c=max(c,vec3(0));return mix(c*12.92,1.055*pow(c,vec3(1./2.4))-.055,step(vec3(.0031308),c));}
`;
// Separable Gaussian with bilinear tap pairing: 5 fetches = 9-tap kernel.
export const blurFragment=`precision highp float;
uniform sampler2D picture;uniform vec2 direction;uniform vec2 sourceSize;uniform float decodeInput;
in vec2 screenUV;out vec4 outColor;
${colorFunctions}
vec3 samplePicture(vec2 uv){vec3 c=texture(picture,clamp(uv,.5/sourceSize,1.-.5/sourceSize)).rgb;return mix(c,decodeSRGB(c),decodeInput);}
void main(){
 vec3 c=samplePicture(screenUV)*.227027027;
 c+=(samplePicture(screenUV+direction*1.384615385)+samplePicture(screenUV-direction*1.384615385))*.316216216;
 c+=(samplePicture(screenUV+direction*3.230769231)+samplePicture(screenUV-direction*3.230769231))*.070270270;
 outColor=vec4(c,1.);
}`;

export const lensFragment=`precision highp float;
uniform sampler2D background;uniform sampler2D water;uniform sampler2D blurredBackground;
uniform vec2 resolution;uniform vec3 lightDirection;uniform vec3 lightColor;
uniform float blueTransient;uniform float submerged;uniform float encodedSource;uniform float rainMoisture;
in vec2 screenUV;out vec4 outColor;
${colorFunctions}
vec2 safeUV(vec2 uv){return clamp(uv,1.5/resolution,1.-1.5/resolution);}
vec3 sceneAt(vec2 uv){vec3 c=texture(background,safeUV(uv)).rgb;return mix(c,decodeSRGB(c),encodedSource);}
void main(){
 vec4 field=texture(water,screenUV);float coverage=smoothstep(.025,.92,field.a);
 vec3 original=texture(background,screenUV).rgb;
 if(coverage<.002){outColor=vec4(original,1.);return;}
 vec2 nxy=(field.rg*255.-vec2(128.))/127.;
 float n2=dot(nxy,nxy);if(n2>.999)nxy*=sqrt(.999/n2);
 vec3 normal=vec3(nxy,sqrt(max(.001,1.-dot(nxy,nxy))));
 float thickness=field.b*3.;
 // Convex front interface followed by the flat rear interface. Tracing the
 // transmitted ray air -> water -> air avoids treating unobservable steep
 // back-traced rays as an opaque TIR annulus in this screen-space lens model.
 vec3 incident=vec3(0.,0.,-1.);
 vec3 inWater=refract(incident,normal,1./1.333);
 vec3 refracted=refract(inWater,vec3(0.,0.,1.),1.333);
 vec2 refractSlope=refracted.xy/max(.35,-refracted.z);
 // Lower physical slopes, longer transfer distance: retain the paraxial
 // magnification/inversion instead of fading the droplet into transparency.
 float travel=.100+.032*sqrt(clamp(thickness,0.,2.));
 vec2 offset=clamp(refractSlope*travel,vec2(-.085),vec2(.085));
 offset.x*=resolution.y/resolution.x;
 // Water's visible dispersion is small. This separates the refracted sample,
 // not a uniform colored overlay and not the later VHS chroma processing.
 vec2 redUV=safeUV(screenUV+offset*.989),greenUV=safeUV(screenUV+offset),blueUV=safeUV(screenUV+offset*1.014);
 vec3 sharp=vec3(sceneAt(redUV).r,sceneAt(greenUV).g,sceneAt(blueUV).b);
 vec3 soft=texture(blurredBackground,safeUV(screenUV+offset)).rgb;
 float closeFocus=clamp(.12+.59*smoothstep(.04,1.35,thickness)+.15*length(nxy),.12,.82);
 closeFocus=mix(closeFocus,.18,submerged*.7);
 vec3 through=mix(sharp,soft,closeFocus);
 float fresnel=.02037+.97963*pow(1.-normal.z,5.);
 vec3 view=vec3(0.,0.,1.),light=normalize(lightDirection),halfVector=normalize(view+light);
 float directional=pow(max(0.,dot(normal,halfVector)),70.);
 float edge=smoothstep(.52,.88,length(nxy));
 float darkEdge=edge*max(0.,-dot(nxy,normalize(light.xy+vec2(.0001))))*.18;
 // Reflect the actual scene, not a flat dim color. Reflection is strongest
 // only at the narrow grazing rim and keeps the local environment visible.
 vec3 reflectedRay=reflect(incident,normal);
 vec2 reflectionOffset=reflectedRay.xy*(.014+.023*edge);
 reflectionOffset.x*=resolution.y/resolution.x;
 vec3 reflected=texture(blurredBackground,safeUV(screenUV+reflectionOffset)).rgb;
 vec3 c=mix(through*(1.-darkEdge),reflected,clamp(fresnel*(.45+.25*edge),0.,.30));
 c+=lightColor*directional*(.10+.18*edge)*max(.10,fresnel*3.);
 // A small humid-rain halo comes only from bright locally blurred scene light.
 c+=max(soft-vec3(.42),vec3(0.))*(.022*rainMoisture)*(.35+.65*edge);
 // Only a brief entry/exit cue; sustained underwater water remains transparent.
 c=mix(c,c*vec3(.91,.975,1.035)+vec3(.0,.002,.004),clamp(blueTransient+submerged*.045,0.,.12));
 vec3 linearOriginal=mix(original,decodeSRGB(original),encodedSource);
 c=mix(linearOriginal,c,coverage);
 outColor=vec4(mix(c,encodeSRGB(c),encodedSource),1.);
}`;

export function createLensWater(renderer,{limit=64}={}){
 const physics=new LensDropletPhysics(limit),entry=new WaterEntryTracker(),cameraEntry=new CameraWaterTracker();
 const scene=new T.Scene(),camera=new T.Camera(),geometry=new T.BufferGeometry();
 geometry.setAttribute('position',new T.Float32BufferAttribute([-1,-1,0,3,-1,0,-1,3,0],3));
 const makeMaterial=(fragmentShader,uniforms)=>new T.RawShaderMaterial({glslVersion:T.GLSL3,vertexShader:lensVertex,fragmentShader,uniforms,depthTest:false,depthWrite:false,toneMapped:false,blending:T.NoBlending});
 const opticsMaterial=makeMaterial(opticalFragment,{heightMap:{value:null},fieldSize:{value:new T.Vector2(256,192)},aspect:{value:4/3}});
 const blurMaterial=makeMaterial(blurFragment,{picture:{value:null},direction:{value:new T.Vector2()},sourceSize:{value:new T.Vector2(1,1)},decodeInput:{value:1}});
 const material=makeMaterial(lensFragment,{background:{value:null},water:{value:null},blurredBackground:{value:null},resolution:{value:new T.Vector2(1,1)},lightDirection:{value:new T.Vector3(-.42,.67,.83).normalize()},lightColor:{value:new T.Color(.84,.91,1)},blueTransient:{value:0},submerged:{value:0},encodedSource:{value:1},rainMoisture:{value:0}});
 const quad=new T.Mesh(geometry,material);quad.frustumCulled=false;scene.add(quad);
 let capture=null,heightTexture=null,wetOpticsRT=null,blurA=null,blurB=null;
 let width=0,height=0,fieldWidth=0,fieldHeight=0,uploadedVersion=-1,bakedVersion=-1,enabled=true,disposed=false;
 const savedViewport=new T.Vector4(),savedScissor=new T.Vector4();
 const diagnostics={halfWidth:0,halfHeight:0,blurWidth:0,blurHeight:0,wetPasses:0,copies:0,renderedFrames:0};
 function disposeTargets(){capture?.dispose();wetOpticsRT?.dispose();blurA?.dispose();blurB?.dispose();capture=wetOpticsRT=blurA=blurB=null;width=height=0;bakedVersion=-1;}
 function target(w,h){
  const rt=new T.WebGLRenderTarget(w,h,{depthBuffer:false,stencilBuffer:false,type:T.UnsignedByteType,format:T.RGBAFormat,minFilter:T.LinearFilter,magFilter:T.LinearFilter,generateMipmaps:false});
  rt.texture.colorSpace=T.NoColorSpace;rt.texture.wrapS=rt.texture.wrapT=T.ClampToEdgeWrapping;return rt;
 }
 function allocate(w,h){
  if(capture&&w===width&&h===height)return;
  disposeTargets();width=w;height=h;
  capture=new T.FramebufferTexture(w,h);capture.colorSpace=T.NoColorSpace;capture.minFilter=capture.magFilter=T.LinearFilter;capture.generateMipmaps=false;
  capture.wrapS=capture.wrapT=T.ClampToEdgeWrapping;
  const hw=Math.max(1,Math.ceil(w*.5)),hh=Math.max(1,Math.ceil(h*.5)),bw=Math.max(1,Math.ceil(w*.25)),bh=Math.max(1,Math.ceil(h*.25));
  wetOpticsRT=target(hw,hh);wetOpticsRT.texture.name='lens-water-half-resolution-optical-normal';
  blurA=target(bw,bh);blurB=target(bw,bh);
  material.uniforms.background.value=capture;material.uniforms.water.value=wetOpticsRT.texture;material.uniforms.blurredBackground.value=blurB.texture;material.uniforms.resolution.value.set(w,h);
  Object.assign(diagnostics,{halfWidth:hw,halfHeight:hh,blurWidth:bw,blurHeight:bh});
 }
 function reset(){physics.clear();entry.reset();cameraEntry.reset();uploadedVersion=bakedVersion=-1;}
 function update(dt,state={}){
  if(disposed)return 0;enabled=state.enabled!==false;
  if(!enabled){entry.reset();cameraEntry.reset();physics.accumulator=physics.rainBudget=0;return 0;}
  physics.setAspect(state.aspect||physics.aspect);
  const crossed=cameraEntry.update(state);physics.setCameraWet(crossed.submerged,crossed.crossing);
  const burst=entry.update(state);
  if(burst>.2&&!crossed.submerged)physics.splash(burst);
  else if(burst>0&&!crossed.submerged){for(let i=0;i<2;i++)physics.add(.24+physics.rng()*.52,.60+physics.rng()*.27,.70+physics.rng()*.7,0,-.055);}
  physics.step(dt,state);
  material.uniforms.rainMoisture.value=Math.max(0,Math.min(1,state.rain||0))*(.55+.45*physics.humidity);
  const screenLight=state.lightScreenDirection;
  if(screenLight)material.uniforms.lightDirection.value.set(screenLight.x,screenLight.y,screenLight.z??.8).normalize();
  else if(state.lightDirection){
   const l=state.lightDirection,yaw=state.yaw||0,pitch=state.pitch||0,cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
   material.uniforms.lightDirection.value.set(l.x*cy-l.z*sy,l.x*sy*sp+l.y*cp+l.z*cy*sp,Math.max(.16,l.x*sy*cp-l.y*sp+l.z*cy*cp)).normalize();
  }
  if(state.lightColor){const l=state.lightColor;material.uniforms.lightColor.value.setRGB(l.r??l.x??.84,l.g??l.y??.91,l.b??l.z??1);}
  return burst;
 }
 function pass(mat,rt){quad.material=mat;renderer.setRenderTarget(rt);renderer.render(scene,camera);}
 function render(w,h){
  diagnostics.wetPasses=0;
  if(disposed||!enabled||!physics.wet||!Number.isFinite(w+h)||w<1||h<1)return false;
  w=Math.max(1,Math.floor(w));h=Math.max(1,Math.floor(h));allocate(w,h);
  if(!heightTexture||fieldWidth!==physics.fieldWidth||fieldHeight!==physics.fieldHeight){
   heightTexture?.dispose();fieldWidth=physics.fieldWidth;fieldHeight=physics.fieldHeight;
   heightTexture=new T.DataTexture(physics.pixels,fieldWidth,fieldHeight,T.RGBAFormat,T.UnsignedByteType);
   heightTexture.colorSpace=T.NoColorSpace;heightTexture.minFilter=heightTexture.magFilter=T.LinearFilter;heightTexture.generateMipmaps=false;heightTexture.flipY=false;
   heightTexture.wrapS=heightTexture.wrapT=T.ClampToEdgeWrapping;
   opticsMaterial.uniforms.heightMap.value=heightTexture;opticsMaterial.uniforms.fieldSize.value.set(fieldWidth,fieldHeight);uploadedVersion=bakedVersion=-1;
  }
  physics.buildTexture();
  if(uploadedVersion!==physics.version){heightTexture.image.data=physics.pixels;heightTexture.needsUpdate=true;uploadedVersion=physics.version;}
  opticsMaterial.uniforms.aspect.value=physics.aspect;
  material.uniforms.blueTransient.value=physics.blueTransient;
  material.uniforms.submerged.value=physics.sheet.submerged?1:0;
  const oldTarget=renderer.getRenderTarget(),oldCube=renderer.getActiveCubeFace?.()||0,oldMip=renderer.getActiveMipmapLevel?.()||0;
  const oldAutoClear=renderer.autoClear,oldXR=renderer.xr.enabled,oldScissorTest=renderer.getScissorTest();
  renderer.getViewport(savedViewport);renderer.getScissor(savedScissor);
  const sourceEncoded=oldTarget?oldTarget.texture.colorSpace===T.SRGBColorSpace:renderer.outputColorSpace===T.SRGBColorSpace;
  material.uniforms.encodedSource.value=sourceEncoded?1:0;
  try{
   // Capture the CURRENT source before any target switch. This is the already
   // rendered scene; no fabricated background and no read/write feedback loop.
   renderer.copyFramebufferToTexture(capture);diagnostics.copies++;
   renderer.autoClear=false;renderer.xr.enabled=false;renderer.setScissorTest(false);
   if(bakedVersion!==physics.version){pass(opticsMaterial,wetOpticsRT);bakedVersion=physics.version;diagnostics.wetPasses++;}
   blurMaterial.uniforms.picture.value=capture;blurMaterial.uniforms.sourceSize.value.set(w,h);
   blurMaterial.uniforms.direction.value.set(1/blurA.width,0);blurMaterial.uniforms.decodeInput.value=sourceEncoded?1:0;
   pass(blurMaterial,blurA);diagnostics.wetPasses++;
   blurMaterial.uniforms.picture.value=blurA.texture;blurMaterial.uniforms.sourceSize.value.set(blurA.width,blurA.height);
   blurMaterial.uniforms.direction.value.set(0,1/blurA.height);blurMaterial.uniforms.decodeInput.value=0;
   pass(blurMaterial,blurB);diagnostics.wetPasses++;
   renderer.setRenderTarget(oldTarget,oldCube,oldMip);renderer.setViewport(savedViewport);renderer.setScissor(savedScissor);renderer.setScissorTest(oldScissorTest);
   quad.material=material;renderer.render(scene,camera);diagnostics.wetPasses++;diagnostics.renderedFrames++;
  }finally{
   renderer.setRenderTarget(oldTarget,oldCube,oldMip);renderer.setViewport(savedViewport);renderer.setScissor(savedScissor);renderer.setScissorTest(oldScissorTest);
   renderer.autoClear=oldAutoClear;renderer.xr.enabled=oldXR;quad.material=material;
  }
  return true;
 }
 function contextLost(){disposeTargets();heightTexture?.dispose();heightTexture=null;fieldWidth=fieldHeight=0;uploadedVersion=bakedVersion=-1;reset();}
 function dispose(){if(disposed)return;disposed=true;disposeTargets();heightTexture?.dispose();geometry.dispose();material.dispose();opticsMaterial.dispose();blurMaterial.dispose();physics.clear();}
 return{physics,entry,cameraEntry,diagnostics,update,render,reset,contextLost,dispose,get wetOpticsRT(){return wetOpticsRT;}};
}
