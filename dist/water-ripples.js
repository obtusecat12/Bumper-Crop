import * as T from './vendor/three.module.min.js';
import {CHUNK,pondShoreDistance} from './world.js?v=27';

// A moving, shore-masked 256² shallow-wave field. Impacts change the lake's
// normals only; the existing low-poly wind animation and world layout remain.
// Two RGBA8 targets hold signed 16-bit current/previous height, so this does
// not require renderable float textures on mobile WebGL2 implementations.
export const RIPPLE_SIZE=256, RIPPLE_SPAN=16, RIPPLE_DT=1/60, RIPPLE_SPEED=1.5;
const CELL=RIPPLE_SPAN/RIPPLE_SIZE, MAX_HEIGHT=.22, MAX_IMPULSES=8;
const VERT=`precision highp float;attribute vec3 position;varying vec2 vUv;void main(){vUv=position.xy*.5+.5;gl_Position=vec4(position,1.);}`;
const PACK=`
 float decodeH(vec2 v){return (dot(floor(v*255.+.5),vec2(256.,1.))-32768.)*(.22/32767.);}
 vec2 encodeH(float v){float q=floor(clamp(v/.22,-1.,1.)*32767.+32768.+.5);return vec2(floor(q/256.),mod(q,256.))/255.;}
`;
export const RIPPLE_STEP_FRAGMENT=`precision highp float;varying vec2 vUv;
 uniform sampler2D uState,uMask;uniform vec2 uShift;uniform int uCount;uniform vec4 uImpulse[8];
 ${PACK}
 float heightAt(vec2 p){if(any(lessThan(p,vec2(0.)))||any(greaterThan(p,vec2(1.))))return 0.;return decodeH(texture2D(uState,p).rg);}
 void main(){
  vec2 p=vUv+uShift;float h=heightAt(p),old=decodeH(texture2D(uState,clamp(p,0.,1.)).ba);
  if(any(lessThan(p,vec2(0.)))||any(greaterThan(p,vec2(1.))))old=0.;
  float e=1./256.;float lap=heightAt(p+vec2(e,0.))+heightAt(p-vec2(e,0.))+heightAt(p+vec2(0.,e))+heightAt(p-vec2(0.,e))-4.*h;
  float boundary=smoothstep(0.,.04,min(min(vUv.x,vUv.y),min(1.-vUv.x,1.-vUv.y)));
  float shore=texture2D(uMask,vUv).r,retention=.989*boundary*shore;
  float next=h+(h-old)*retention+.16*lap;
  for(int i=0;i<8;i++){if(i>=uCount)break;vec4 q=uImpulse[i];float r=length((vUv-q.xy)*16.)/max(.06,q.z);next+=q.w*exp(-r*r*2.);}
  next*=mix(.80,1.,boundary)*shore;
  gl_FragColor=vec4(encodeH(next),encodeH(h*shore));
 }`;
export const RIPPLE_NORMAL_FRAGMENT=`precision highp float;varying vec2 vUv;uniform sampler2D uState;${PACK}
 void main(){vec2 e=vec2(1./256.,0.);float h=decodeH(texture2D(uState,vUv).rg);
  float dx=(decodeH(texture2D(uState,vUv+e).rg)-decodeH(texture2D(uState,vUv-e).rg))*8.;
  float dz=(decodeH(texture2D(uState,vUv+e.yx).rg)-decodeH(texture2D(uState,vUv-e.yx).rg))*8.;
  vec3 n=normalize(vec3(-dx,1.,-dz));gl_FragColor=vec4(n.xz*.5+vec2(128./255.),h/.44+.5,1.);
 }`;

export function createWaterRipples(renderer){
 const options={minFilter:T.NearestFilter,magFilter:T.NearestFilter,depthBuffer:false,stencilBuffer:false,type:T.UnsignedByteType,format:T.RGBAFormat};
 const targets=[new T.WebGLRenderTarget(256,256,options),new T.WebGLRenderTarget(256,256,options)];
 const normalTarget=new T.WebGLRenderTarget(256,256,{...options,minFilter:T.LinearFilter,magFilter:T.LinearFilter});
 for(const t of [...targets,normalTarget]){t.texture.colorSpace=T.NoColorSpace;t.texture.generateMipmaps=false;}
 const maskBytes=new Uint8Array(64*64),mask=new T.DataTexture(maskBytes,64,64,T.RedFormat);mask.minFilter=mask.magFilter=T.LinearFilter;mask.generateMipmaps=false;mask.needsUpdate=true;
 const queue=[],impulses=Array.from({length:MAX_IMPULSES},()=>new T.Vector4());
 const uniforms={uState:{value:targets[0].texture},uMask:{value:mask},uShift:{value:new T.Vector2()},uCount:{value:0},uImpulse:{value:impulses}};
 const material=new T.RawShaderMaterial({uniforms,vertexShader:VERT,fragmentShader:RIPPLE_STEP_FRAGMENT,depthTest:false,depthWrite:false});
 const normalMaterial=new T.RawShaderMaterial({uniforms:{uState:uniforms.uState},vertexShader:VERT,fragmentShader:RIPPLE_NORMAL_FRAGMENT,depthTest:false,depthWrite:false});
 const geometry=new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute([-1,-1,0,3,-1,0,-1,3,0],3));
 const mesh=new T.Mesh(geometry,material),scene=new T.Scene(),camera=new T.Camera();mesh.frustumCulled=false;scene.add(mesh);
 const binding={uImpactNormals:{value:normalTarget.texture},uImpactOrigin:{value:new T.Vector2()},uImpactActive:{value:0},uImpactSun:{value:new T.Vector3(-.45,.84,-.30).normalize()}};
 const attached=new WeakSet(),viewport=new T.Vector4(),scissor=new T.Vector4(),clearColor=new T.Color();
 let cx=0n,cz=0n,centerX=0,centerZ=0,known=false,clearPending=true,maskDirty=true,maskChunks=-1,current=0,accumulator=0,remaining=0,enabled=false,shiftX=0,shiftZ=0,lastState=null,lastChunks=null;
 const stats={steps:0,normalPasses:0,active:false,queued:0,resolution:256,span:16,simHz:60,courant:RIPPLE_SPEED*RIPPLE_DT/CELL};
 function emit(event){
  if(!event||!Number.isFinite(event.x+event.z))return;
  const ex=event.cx??cx,ez=event.cz??cz;
  if(known&&(Math.abs(event.x+Number(ex-cx)*CHUNK-centerX)>8||Math.abs(event.z+Number(ez-cz)*CHUNK-centerZ)>8))return;
  queue.push({...event,cx:ex,cz:ez,radius:Math.max(.07,event.radius??.16),strength:T.MathUtils.clamp(event.strength??.012,-.08,.08)});if(queue.length>64)queue.shift();remaining=9;
 }
 function reset(){queue.length=0;remaining=accumulator=0;clearPending=true;known=false;maskDirty=true;binding.uImpactActive.value=0;stats.active=false;}
 function update(dt,{state,chunks,active=true,lightDirection}={}){
  enabled=active;lastState=state;lastChunks=chunks;if(!state)return;
  if(lightDirection)binding.uImpactSun.value.copy(lightDirection).normalize();
  if(!known){cx=state.cx;cz=state.cz;centerX=Math.round(state.x/CELL)*CELL;centerZ=Math.round(state.z/CELL)*CELL;known=true;maskDirty=true;}
  const bx=Number(state.cx-cx)*CHUNK,bz=Number(state.cz-cz)*CHUNK;
  if(bx||bz){centerX-=bx;centerZ-=bz;cx=state.cx;cz=state.cz;maskDirty=true;}
  if(Math.abs(centerX-state.x)>2||Math.abs(centerZ-state.z)>2){
   const nx=Math.round(state.x/CELL)*CELL,nz=Math.round(state.z/CELL)*CELL;
   shiftX+=(nx-centerX)/RIPPLE_SPAN;shiftZ+=(nz-centerZ)/RIPPLE_SPAN;centerX=nx;centerZ=nz;maskDirty=true;
  }
  binding.uImpactOrigin.value.set(centerX-RIPPLE_SPAN/2,centerZ-RIPPLE_SPAN/2);
  if(chunks?.size!==maskChunks){maskChunks=chunks?.size;maskDirty=true;}
  if(!active){binding.uImpactActive.value=0;return;}
  const elapsed=Math.min(.12,Math.max(0,dt));remaining=Math.max(0,remaining-elapsed);
  if(remaining>0||queue.length){accumulator=Math.min(.12,accumulator+elapsed);binding.uImpactActive.value=1;}else binding.uImpactActive.value=0;
  stats.active=binding.uImpactActive.value>0;stats.queued=queue.length;
 }
 function fillMask(){
  if(!lastChunks||!lastState)return;
  for(let j=0;j<64;j++)for(let i=0;i<64;i++){
   const x=centerX-8+(i+.5)*.25,z=centerZ-8+(j+.5)*.25,dx=Math.floor(x/CHUNK),dz=Math.floor(z/CHUNK);
   const f=lastChunks.get(`${cx+BigInt(dx)},${cz+BigInt(dz)}`)?.field;
   const shore=f?.type==='pond'?pondShoreDistance(x-dx*CHUNK,z-dz*CHUNK,f):1;
   maskBytes[j*64+i]=Math.round(T.MathUtils.clamp(-shore/.20,0,1)*255);
  }
  mask.needsUpdate=true;maskDirty=false;
 }
 function render(){
  if(!enabled||!known||(!binding.uImpactActive.value&&!clearPending))return false;
  const previous=renderer.getRenderTarget(),auto=renderer.autoClear,scissorTest=renderer.getScissorTest(),alpha=renderer.getClearAlpha();renderer.getViewport(viewport);renderer.getScissor(scissor);renderer.getClearColor(clearColor);
  renderer.autoClear=false;renderer.setScissorTest(false);
  try{
   if(clearPending){
    renderer.setClearColor(new T.Color().setRGB(128/255,0,128/255),0);
    for(const target of targets){renderer.setRenderTarget(target);renderer.clear(true,false,false);}
    renderer.setClearColor(new T.Color().setRGB(128/255,128/255,.5),1);renderer.setRenderTarget(normalTarget);renderer.clear(true,false,false);
    clearPending=false;shiftX=shiftZ=0;
   }
   if(!binding.uImpactActive.value)return false;
   if(maskDirty)fillMask();
   let steps=0;mesh.material=material;
   while((accumulator>=RIPPLE_DT||queue.length||shiftX!==0||shiftZ!==0)&&steps<6){
    uniforms.uState.value=targets[current].texture;uniforms.uShift.value.set(shiftX,shiftZ);shiftX=shiftZ=0;
    let n=0;while(queue.length&&n<MAX_IMPULSES){const q=queue.shift(),x=q.x+Number(q.cx-cx)*CHUNK-centerX+8,z=q.z+Number(q.cz-cz)*CHUNK-centerZ+8;if(x<0||x>16||z<0||z>16)continue;impulses[n++].set(x/16,z/16,q.radius,q.strength);}
    uniforms.uCount.value=n;renderer.setRenderTarget(targets[1-current]);renderer.render(scene,camera);current=1-current;accumulator=Math.max(0,accumulator-RIPPLE_DT);steps++;
   }
   if(steps){uniforms.uState.value=targets[current].texture;mesh.material=normalMaterial;renderer.setRenderTarget(normalTarget);renderer.render(scene,camera);stats.normalPasses++;stats.steps+=steps;}
   return steps>0;
  }finally{renderer.setRenderTarget(previous);renderer.setViewport(viewport);renderer.setScissor(scissor);renderer.setScissorTest(scissorTest);renderer.setClearColor(clearColor,alpha);renderer.autoClear=auto;}
 }
 function attach(root){root.traverse(o=>{for(const m of [].concat(o.material||[])){
  if(m.name!=='PS1 low-poly detailed ripple water'||attached.has(m))continue;attached.add(m);
  const compile=m.onBeforeCompile,key=m.customProgramCacheKey.bind(m);
  m.onBeforeCompile=(shader,r)=>{
   compile.call(m,shader,r);Object.assign(shader.uniforms,binding);
   shader.vertexShader='varying vec3 vImpactWorld;\n'+shader.vertexShader;
   shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nvImpactWorld=(modelMatrix*vec4(transformed,1.)).xyz;');
   shader.fragmentShader='uniform sampler2D uImpactNormals;uniform vec2 uImpactOrigin;uniform float uImpactActive;uniform vec3 uImpactSun;varying vec3 vImpactWorld;\n'+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`
    vec2 impactUv=(vImpactWorld.xz-uImpactOrigin)/16.;
    if(uImpactActive>.5&&all(greaterThan(impactUv,vec2(0.)))&&all(lessThan(impactUv,vec2(1.)))){
     vec2 slope=(texture2D(uImpactNormals,impactUv).rg-vec2(128./255.))*2.;
     float edge=smoothstep(0.,.035,min(min(impactUv.x,impactUv.y),min(1.-impactUv.x,1.-impactUv.y)));slope*=edge;
     vec3 N=normalize(vec3(slope.x,sqrt(max(.01,1.-dot(slope,slope))),slope.y));
     vec3 V=normalize(cameraPosition-vImpactWorld),H=normalize(V+uImpactSun);
     float fresnel=.0204+.9796*pow(1.-abs(dot(N,V)),5.);
     float spec=pow(max(0.,dot(N,H)),92.)*.6;
     float tilted=dot(N,uImpactSun)-uImpactSun.y;
     // The detailed reflected ripple image bends with the evolving normal;
     // do not paint a white circle above the lake or move its coarse vertices.
     vec3 bentReflection=texture2D(uLakeTexture,uv+slope*.24).rgb;
     vec3 straightReflection=texture2D(uLakeTexture,uv).rgb;
     outgoingLight+=(bentReflection-straightReflection)*.46*edge;
     outgoingLight*=clamp(1.+tilted*2.3,.56,1.44);
     outgoingLight+=vec3(.53,.62,.65)*(fresnel*.22+spec)*min(1.,length(slope)*7.);
    }
    #include <opaque_fragment>`);
  };m.customProgramCacheKey=()=>key()+'|impact-normal-wave-v26';m.needsUpdate=true;
 }});}
 return {emit,update,render,attach,reset,contextLost:reset,binding,stats,targets,normalTarget,material,normalMaterial,
  dispose(){for(const t of [...targets,normalTarget])t.dispose();mask.dispose();material.dispose();normalMaterial.dispose();geometry.dispose();queue.length=0;}};
}
