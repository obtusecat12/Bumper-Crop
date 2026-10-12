import * as T from './vendor/three.module.min.js';
import {nextPaint} from './bath-loading-v72.js';
export const preparationSamples74=[];
export function preparationStep74(name,fn){const start=performance.now();try{return fn();}finally{preparationSamples74.push({name,ms:+(performance.now()-start).toFixed(2)});}}

// Reflection probes use the actual static geometry and generated diffuse art.
// A lightweight capture material avoids compiling the whole PBR scene six times
// before its final environment exists. This never replaces visible geometry.
export async function prepareStaticProbe74(scene,renderer,position,receivers,report=()=>{}){
 const proxy=new T.Scene();proxy.background=new T.Color(0x202824);
 const materials=new Map(),objects=[];scene.updateMatrixWorld(true);
 function captureMaterial(m){
  if(materials.has(m))return materials.get(m);
  const map=m.map&&!m.map.isRenderTargetTexture?m.map:m.emissiveMap&&!m.emissiveMap.isRenderTargetTexture?m.emissiveMap:null;
  const color=(m.color||new T.Color(0x697775)).clone().multiplyScalar(.64);
  if(m.emissive)color.add(m.emissive.clone().multiplyScalar(Math.min(2.5,m.emissiveIntensity||0)));
  const copy=new T.MeshBasicMaterial({map,color,side:m.side,alphaTest:m.alphaTest||0,transparent:m.transparent,opacity:m.opacity,depthWrite:m.depthWrite,vertexColors:m.vertexColors,toneMapped:false});copy.forceSinglePass=true;materials.set(m,copy);return copy;
 }
 scene.traverse(o=>{if(!o.isMesh||o.isSkinnedMesh||!o.layers.isEnabled(0)||!o.material)return;
  const src=Array.isArray(o.material)?o.material:[o.material];if(src.some(m=>m.isShaderMaterial))return;
  const mats=src.map(captureMaterial),copy=o.isInstancedMesh?new T.InstancedMesh(o.geometry,Array.isArray(o.material)?mats:mats[0],o.count):new T.Mesh(o.geometry,Array.isArray(o.material)?mats:mats[0]);
  if(o.isInstancedMesh){copy.instanceMatrix=o.instanceMatrix;copy.instanceColor=o.instanceColor;}
  copy.matrix.copy(o.matrixWorld);copy.matrixAutoUpdate=false;copy.frustumCulled=o.frustumCulled;proxy.add(copy);objects.push(copy);
 });
 const cubeTarget=new T.WebGLCubeRenderTarget(128,{type:renderer.extensions.has('EXT_color_buffer_float')?T.HalfFloatType:T.UnsignedByteType,generateMipmaps:false,minFilter:T.LinearFilter});
 const cube=new T.CubeCamera(.08,32,cubeTarget);cube.position.fromArray(position);cube.coordinateSystem=renderer.coordinateSystem;cube.updateCoordinateSystem();cube.updateMatrixWorld(true);
 const saved=renderer.getRenderTarget(),face=renderer.getActiveCubeFace(),mip=renderer.getActiveMipmapLevel(),auto=renderer.shadowMap.autoUpdate,needs=renderer.shadowMap.needsUpdate,xr=renderer.xr.enabled;
 let pmrem,result;
 try{
  renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=false;renderer.xr.enabled=false;
  renderer.initRenderTarget(cubeTarget);await nextPaint();
  for(let i=0;i<6;i++){renderer.setRenderTarget(cubeTarget,i);preparationStep74(`probe face ${i+1}`,()=>renderer.render(proxy,cube.children[i]));report((i+1)/8);await nextPaint();}
  pmrem=new T.PMREMGenerator(renderer);preparationStep74('probe convolution shader',()=>pmrem.compileCubemapShader());report(7/8);await nextPaint();
  result=preparationStep74('probe convolution',()=>pmrem.fromCubemap(cubeTarget.texture));
  for(const mat of new Set(receivers)){mat.envMap=result.texture;mat.envMapIntensity=.76;mat.needsUpdate=true;}
  report(1);await nextPaint();return result;
 }catch(e){result?.dispose();throw e;}
 finally{renderer.setRenderTarget(saved,face,mip);renderer.shadowMap.autoUpdate=auto;renderer.shadowMap.needsUpdate=needs;renderer.xr.enabled=xr;pmrem?.dispose();cubeTarget.dispose();materials.forEach(m=>m.dispose());proxy.clear();}
}

// V121-bath: compile one representative per program signature, all at once when
// KHR_parallel_shader_compile exists (the driver links them on its own threads),
// otherwise one signature per paint. Then upload every object's buffers in
// time-budgeted batches instead of one object per frame (189 frames in the bath).
function programSignature121(o){const g=o.geometry||{},a=g.attributes||{},ms=Array.isArray(o.material)?o.material:[o.material];return ms.map(m=>m?.uuid).join(',')+'|'+[o.isInstancedMesh,!!o.instanceColor,o.isSkinnedMesh,o.isBatchedMesh,o.isPoints,o.isLine,!!(g.morphAttributes&&Object.keys(g.morphAttributes).length),!!a.color,!!a.tangent,!!a.uv1,!!a.uv2,o.receiveShadow,o.castShadow].map(Number).join('');}
export async function compileBathBatches74(scene,renderer,camera,report=()=>{}){
 const unique=new Map();scene.traverse(o=>{if(!o.isMesh&&!o.isPoints&&!o.isLine)return;if(!unique.has(o.uuid))unique.set(o.uuid,o);});
 const objects=[...unique.values()],groups=new Map();for(const o of objects){const k=programSignature121(o);if(!groups.has(k))groups.set(k,o);}
 const reps=[...groups.values()],parallel=!!renderer.extensions.get('KHR_parallel_shader_compile');
 const subset=new T.Scene(),lights=[];scene.traverseVisible(o=>{if(o.isLight)lights.push(o);});subset.environment=scene.environment;subset.fog=scene.fog;
 const savedMask=camera.layers.mask;camera.layers.enable(3);scene.updateMatrixWorld(true);const total=reps.length+objects.length;let done=0;
 const draw=list=>{const saved=list.map(o=>[o.visible,o.frustumCulled]);for(const o of list){o.visible=true;o.frustumCulled=false;}subset.children=[...lights,...list];try{renderer.render(subset,camera);}finally{list.forEach((o,i)=>{o.visible=saved[i][0];o.frustumCulled=saved[i][1];});}};
 try{
  if(parallel){
   subset.children=reps;let ready=0;const pending=preparationStep74('material compile submission',()=>renderer.compile(subset,camera,scene));const n0=pending.size;
   const props=m=>renderer.properties.get(m);
   while(pending.size){for(const m of pending)if(!props(m).currentProgram||props(m).currentProgram.isReady())pending.delete(m);ready=n0-pending.size;report((ready/Math.max(1,n0))*reps.length/total,ready,n0);if(pending.size)await nextPaint();}
   done=reps.length;
  }else{
   for(const o of reps){subset.children=[o];preparationStep74('material compile submission',()=>renderer.compile(subset,camera,scene));preparationStep74('material upload and first draw',()=>draw([o]));report(++done/total,done,total);await nextPaint();}
  }
  // Buffer uploads + first draws, ~10 ms of work per paint.
  let k=8;for(let i=0;i<objects.length;){const batch=objects.slice(i,i+k),t=performance.now();preparationStep74('material upload and first draw',()=>draw(batch));const ms=performance.now()-t;i+=batch.length;done+=batch.length;k=ms<5?Math.min(64,k*2):ms>14?Math.max(1,k>>1):k;report(done/total,done,total);await nextPaint();}
 }finally{camera.layers.mask=savedMask;}
 subset.children=[];return reps.length;
}
