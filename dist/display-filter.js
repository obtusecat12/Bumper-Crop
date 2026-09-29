import * as T from './vendor/three.module.min.js';
import {createFrameReadback} from './frame-readback.js?v=58';

export const VHS_SIGNAL_SIZE=Object.freeze({width:960,height:720});
export const VHS_OUTPUT_SIZE=Object.freeze({width:1440,height:1080});
export const FILTERS = Object.freeze(['vhs', 'pixel', 'ps1', 'native']);
export function displayFrame(filter,width,height){
  const w=filter==='vhs'?Math.min(width,height*4/3):width,h=filter==='vhs'?w*3/4:height;
  return {width:w,height:h,left:(width-w)/2,top:(height-h)/2,aspect:w/Math.max(1,h)};
}
export function displaySize(filter, quality, width, height, autoScale = 1) {
  // Output canvas only. Scene, fused optics and official NTSC run at <=720 lines.
  if(filter==='vhs')return {width:1440,height:1080};
  const aspect = Math.max(.2, width / Math.max(1, height));
  if (filter === 'ps1') {
    const h = Math.max(2, Math.min(320, Math.floor(1920 / aspect)));
    return {width: Math.max(2, Math.round(h * aspect / 2) * 2), height: h};
  }
  const scale = (filter === 'pixel' ? quality === 'high' ? .75 : quality === 'low' ? .48 : .62 : 1) * autoScale;
  const maxWidth = quality === 'low' ? 1100 : quality === 'high' ? 1920 : 1600;
  const w = Math.min(width * scale, maxWidth);
  return {width: Math.max(320, Math.floor(w)), height: Math.max(200, Math.floor(w / aspect))};
}

export const DISPLAY_VERTEX = `precision highp float;
in vec3 position;out vec2 vUv;
void main(){vUv=position.xy*.5+.5;gl_Position=vec4(position,1.0);}`;
export const DISPLAY_FRAGMENT = `precision highp float;
precision highp int;
uniform sampler2D picture;uniform int filterMode;uniform float frameHeight;
in vec2 vUv;out vec4 outColor;
const int dither[16]=int[16](-4,0,-3,1,2,-2,3,-1,-3,1,-4,0,3,-1,2,-2);
void main(){
 vec2 uv=(filterMode==0||filterMode==2)?vec2(vUv.x,1.0-vUv.y):vUv;
 // All processing is internal 720p or below; output enlargement is nearest.
 // The scene and HUD share one source frame; no sharp layer is added afterward.
 vec3 c=texture(picture,uv).rgb;

 if(filterMode==2){
  // Exact byte-domain equivalent of the established 1.16 input saturation.
  // Flip here too: asynchronous bottom-up GL readback is now top-down.
  ivec3 rgb=ivec3(floor(c*255.0+.5));
  int l=299*rgb.r+587*rgb.g+114*rgb.b;
  ivec3 graded=(clamp(29000*rgb-ivec3(4*l),ivec3(0),ivec3(6375000))+12500)/25000;
  // Preserve JS double rounding at its only two half-way exceptions.
  if(all(equal(rgb,ivec3(5,74,153))))graded.b=167;
  if(all(equal(rgb,ivec3(99,20,156))))graded.b=171;
  c=vec3(graded)/255.0;
 }else if(filterMode==1){
  int x=int(gl_FragCoord.x)&3,y=int(frameHeight-gl_FragCoord.y)&3;
  c=clamp(floor((floor(c*255.0+.5)+float(dither[y*4+x]))/8.0),0.0,31.0)/31.0;
 }
 // Mode 0 is ONLY the official ntsc-rs output. No crisp residual or overlay.
 outColor=vec4(c,1.0);
}`;
export function createDisplayFilter(renderer,{onError=()=>{}}={}){
 const readback=createFrameReadback(renderer.getContext());
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute([-1,-1,0,3,-1,0,-1,3,0],3));
 const material=new T.RawShaderMaterial({glslVersion:T.GLSL3,vertexShader:DISPLAY_VERTEX,fragmentShader:DISPLAY_FRAGMENT,
  uniforms:{picture:{value:null},filterMode:{value:0},frameHeight:{value:1080}},depthTest:false,depthWrite:false,toneMapped:false,blending:T.NoBlending});
 const screen=new T.Scene(),camera=new T.Camera(),quad=new T.Mesh(geometry,material);quad.frustumCulled=false;screen.add(quad);
 const uiMaterial=new T.RawShaderMaterial({glslVersion:T.GLSL3,vertexShader:DISPLAY_VERTEX,fragmentShader:`precision highp float;uniform sampler2D picture;in vec2 vUv;out vec4 outColor;void main(){outColor=texture(picture,vUv);}`,
  uniforms:{picture:{value:null}},transparent:true,premultipliedAlpha:false,depthTest:false,depthWrite:false,toneMapped:false});
 const uiScene=new T.Scene(),uiQuad=new T.Mesh(geometry,uiMaterial);uiQuad.frustumCulled=false;uiScene.add(uiQuad);
 renderer.info.autoReset=false;
 let mode='native',width=0,height=0,epoch=0,disposed=false,failed=false,readJob=null;
 let scenePipeline=null,internal=null,outputWidth=0,outputHeight=0;
 let source=null,texture=null,spare=null,lastCapture=-Infinity,lastOutput=0,sequence=0,displayed=-1,compositor=null,lensEffect=null,uiTexture=null,uiWidth=0,uiHeight=0;
 const workers=[],cores=globalThis.navigator?.hardwareConcurrency||2,poolSize=cores>=8?3:cores>=4?2:1;
 const values={ms:null,latency:null,fps:0,workers:poolSize};
 const smooth=(a,b)=>a===null?b:a*.85+b*.15;
 function stopWorkers(){for(const slot of workers){clearTimeout(slot.timer);slot.worker.terminate();}workers.length=0;}
 function fail(error){if(failed||disposed)return;failed=true;epoch++;readback.cancel();readJob=null;stopWorkers();console.error('VHS filter failed',error);onError(error);}
 function startWorkers(){if(workers.length||failed||disposed)return;
  for(let i=0;i<poolSize;i++)try{
   const worker=new Worker(new URL('./vhs-worker.js?v=58',import.meta.url),{type:'module',name:'ntsc-rs-'+i});
   const slot={worker,ready:false,busy:false,timer:setTimeout(()=>fail(new Error('VHS initialization timed out')),20000)};workers.push(slot);
   worker.onerror=e=>{e.preventDefault?.();if(!workers.includes(slot))return;fail(new Error(e.message||'VHS worker failed'));};worker.onmessageerror=()=>{if(workers.includes(slot))fail(new Error('VHS transfer failed'));};
   worker.onmessage=({data})=>{
    if(!workers.includes(slot))return;
    if(data.type==='error'){fail(new Error(data.message));return;}
    if(data.type==='ready'){clearTimeout(slot.timer);slot.ready=true;return;}
    if(data.type!=='frame')return;
    clearTimeout(slot.timer);slot.busy=false;
    if(disposed||mode!=='vhs'||data.epoch!==epoch)return;
    if(data.width!==width||data.height!==height||!(data.buffer instanceof ArrayBuffer)||data.buffer.byteLength!==width*height*4){fail(new Error('VHS frame size mismatch'));return;}
    // Each job is a complete scene + UI frame. Never let a slower worker rewind it.
    if(data.sequence<=displayed){if(!spare)spare=new Uint8Array(data.buffer);return;}
    displayed=data.sequence;const now=performance.now();values.ms=smooth(values.ms,data.ms);values.latency=smooth(values.latency,now-data.capturedAt);
    if(lastOutput&&now-lastOutput<1000)values.fps=values.fps?values.fps*.85+1000/(now-lastOutput)*.15:1000/(now-lastOutput);lastOutput=now;
    if(!texture){texture=new T.DataTexture(new Uint8Array(data.buffer),width,height,T.RGBAFormat);texture.colorSpace=T.NoColorSpace;texture.minFilter=texture.magFilter=T.NearestFilter;texture.generateMipmaps=false;}
    else{spare=texture.image.data;texture.image.data=new Uint8Array(data.buffer);}texture.needsUpdate=true;
   };
  }catch(error){fail(error);break;}
 }
 function configure(next,w,h){if(disposed||(mode===next&&outputWidth===w&&outputHeight===h))return;
  epoch++;readback.cancel();if(readJob){readJob.slot.busy=false;readJob=null;}
  mode=next;if(mode!=='vhs')stopWorkers();outputWidth=w;outputHeight=h;const scale=Math.min(1,720/h);width=Math.max(2,Math.round(w*scale/2)*2);height=Math.max(2,Math.round(h*scale/2)*2);lastCapture=-Infinity;lastOutput=0;displayed=-1;
  source?.dispose();texture?.dispose();internal?.dispose();source=texture=null;
  internal=new T.WebGLRenderTarget(width,height,{depthBuffer:false,minFilter:T.NearestFilter,magFilter:T.NearestFilter});internal.texture.colorSpace=T.NoColorSpace;
  spare=null;values.ms=values.latency=null;values.fps=0;
  if(mode==='vhs'){failed=false;startWorkers();}
 }
 function setLensEffect(next){lensEffect=next;}
 function setScenePipeline(next){scenePipeline=next;}
 function setCompositor(next){compositor=next;uiTexture?.dispose();uiTexture=new T.CanvasTexture(next.canvas);uiWidth=next.canvas.width;uiHeight=next.canvas.height;uiTexture.flipY=true;uiTexture.colorSpace=T.NoColorSpace;uiTexture.minFilter=uiTexture.magFilter=T.LinearFilter;uiTexture.generateMipmaps=false;uiMaterial.uniforms.picture.value=uiTexture;}
 function compose(scene,view,beforeScene,skipScene){
  // Upload changed UI before 3D draw submission, not in the middle of it.
  if(compositor){const changed=compositor.paint(width,height);if(uiWidth!==compositor.canvas.width||uiHeight!==compositor.canvas.height)setCompositor(compositor);else if(changed)uiTexture.needsUpdate=true;renderer.initTexture(uiTexture);}
  renderer.setRenderTarget(internal);
  if(scenePipeline){if(skipScene)scenePipeline.renderUI(width,height,internal,uiTexture,mode==='vhs'?2:0);else scenePipeline.render(scene,view,beforeScene,width,height,internal,uiTexture,mode==='vhs'?2:0);return;}
  if(skipScene)renderer.clear();else{beforeScene?.();renderer.render(scene,view);lensEffect?.render(width,height);}
  renderer.setRenderTarget(internal);
  if(uiTexture){const old=renderer.autoClear;renderer.autoClear=false;renderer.render(uiScene,camera);renderer.autoClear=old;}
 }
 function present(picture,kind){material.uniforms.picture.value=picture;material.uniforms.filterMode.value=kind;material.uniforms.frameHeight.value=height;renderer.render(screen,camera);}
 function render(scene,view,now,beforeScene,skipScene=false){
  renderer.info.reset();
  if(mode==='native'||mode==='pixel'||failed){compose(scene,view,beforeScene,skipScene);renderer.setRenderTarget(null);present(internal.texture,3);return;}
  if(mode==='ps1'){compose(scene,view,beforeScene,skipScene);renderer.setRenderTarget(null);present(internal.texture,1);return;}
  const slot=workers.find(s=>s.ready&&!s.busy);
  if(slot&&!readJob&&now-lastCapture>=1000/60-.25){
   compose(scene,view,beforeScene,skipScene);renderer.setRenderTarget(internal);
   const pixels=spare?.byteLength===width*height*4?spare:new Uint8Array(width*height*4);spare=null;
   const job={slot,epoch,width,height,capturedAt:now,sequence:++sequence};readJob=job;slot.busy=true;lastCapture=now;
   readback.capture(width,height,pixels).then(bytes=>{
    if(readJob!==job||job.epoch!==epoch||disposed)return;readJob=null;
    slot.timer=setTimeout(()=>fail(new Error('VHS processing timed out')),10000);
    slot.worker.postMessage({type:'frame',buffer:bytes.buffer,width:job.width,height:job.height,epoch:job.epoch,capturedAt:job.capturedAt,sequence:job.sequence,
      frame:Math.floor(job.capturedAt*60/1001),pregradedTopDown:true},[bytes.buffer]);
   }).catch(error=>{if(readJob===job){readJob=null;slot.busy=false;}if(error.name!=='AbortError')fail(error);});
   renderer.setRenderTarget(null);if(!texture)renderer.clear();
  }else if(!texture){renderer.setRenderTarget(null);renderer.clear();}
  renderer.setRenderTarget(null);if(texture)present(texture,0);
 }
 function contextLost(){scenePipeline?.contextLost();lensEffect?.contextLost();epoch++;readback.cancel(true);if(readJob){readJob.slot.busy=false;readJob=null;}width=height=outputWidth=outputHeight=0;compositor?.invalidate();}
 function dispose(){scenePipeline?.dispose();lensEffect?.dispose();disposed=true;epoch++;readback.cancel(renderer.getContext().isContextLost());stopWorkers();source?.dispose();texture?.dispose();internal?.dispose();uiTexture?.dispose();geometry.dispose();material.dispose();uiMaterial.dispose();compositor?.dispose();}
 return{configure,render,contextLost,dispose,setCompositor,setLensEffect,setScenePipeline,values};
}
