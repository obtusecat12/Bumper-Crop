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

// compileAsync still blocks in browsers without KHR_parallel_shader_compile.
// Compile one material/object feature combination between paints, with the
// ORIGINAL scene providing lights/fog/environment and the real HDR target set.
export async function compileBathBatches74(scene,renderer,camera,report=()=>{}){
 const unique=new Map();scene.traverse(o=>{if(!o.isMesh&&!o.isPoints&&!o.isLine)return;const ms=Array.isArray(o.material)?o.material:[o.material];const key=o.uuid;if(!unique.has(key))unique.set(key,o);});
 const subset=new T.Scene(),lights=[];scene.traverseVisible(o=>{if(o.isLight)lights.push(o);});subset.environment=scene.environment;subset.fog=scene.fog;let done=0;
 const savedMask=camera.layers.mask;camera.layers.enable(3);scene.updateMatrixWorld(true);
 try{for(const o of unique.values()){
  subset.children=[o];await preparationStep74('material compile submission',()=>renderer.compileAsync(subset,camera,scene));
  // Upload each shared vertex/index buffer now, not in a single first draw.
  subset.children=[...lights,o];const visible=o.visible,culled=o.frustumCulled;o.visible=true;o.frustumCulled=false;
  try{preparationStep74('material upload and first draw',()=>renderer.render(subset,camera));}finally{o.visible=visible;o.frustumCulled=culled;}
  report(++done/unique.size,done,unique.size);await nextPaint();
 }}finally{camera.layers.mask=savedMask;}
 subset.children=[];return unique.size;
}
