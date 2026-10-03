import * as T from './vendor/three.module.min.js';
import {nextPaint} from './bath-loading-v72.js';
import {compileBathBatches74,preparationSamples74,preparationStep74} from './bath-preparation-v74.js';

export async function warmBath74(bath,renderer,originalCamera,report=()=>{},renderFrame=null){
 if(bath.warmed74)return;
 preparationSamples74.length=0;
 const stats=bath.warmupStats74={phases:[],maxTextureUploadMs:0,textures:0,materialBatches:0};
 const measured=async(name,fn)=>{const start=performance.now();await fn();stats.phases.push({name,ms:Math.round(performance.now()-start)});};
 const textures=new Set();bath.scene.traverse(o=>{for(const m of Array.isArray(o.material)?o.material:[o.material]){if(!m)continue;for(const t of Object.values(m))if(t?.isTexture&&!t.isRenderTargetTexture)textures.add(t);for(const u of Object.values(m.uniforms||m.userData.wetUniforms||{}))if(u?.value?.isTexture&&!u.value.isRenderTargetTexture)textures.add(u.value);}});
 // Open/closed NPC faces are both resident before the first blink.
 for(const t of bath.occupants?.textures||[])textures.add(t);
 await measured('texture upload',async()=>{let n=0,budgetStart=performance.now();for(const t of textures){const start=performance.now();preparationStep74('texture upload',()=>renderer.initTexture(t));stats.maxTextureUploadMs=Math.max(stats.maxTextureUploadMs,performance.now()-start);report(.14*++n/textures.size,'正在预载室内贴图');if(performance.now()-budgetStart>=4){await nextPaint();budgetStart=performance.now();}}stats.textures=n;await nextPaint();});
 await measured('reflection probes',()=>bath.prepareEnvironment(renderer,p=>report(.14+p*.20,'正在准备静态环境倒影')));
 const camera=originalCamera.clone(),rt=new T.WebGLRenderTarget(128,96,{type:T.HalfFloatType,depthBuffer:true}),saved=renderer.getRenderTarget(),face=renderer.getActiveCubeFace(),mip=renderer.getActiveMipmapLevel(),auto=renderer.shadowMap.autoUpdate,needs=renderer.shadowMap.needsUpdate;
 const shadows=[];bath.scene.traverse(o=>{if(o.isLight&&o.castShadow)shadows.push({light:o,auto:o.shadow.autoUpdate,needs:o.shadow.needsUpdate});});
 const views=[{p:[-2.2,1.70,6.85],look:[.58,1.76,.232],label:'更衣室镜面'},{p:[0,1.70,3.8],look:[-3.77,1.35,4.2],label:'更衣室柜门'},{p:[-6.2,1.70,-3.2],look:[-8,1.5,-3.2],label:'淋浴水流'},{p:[5.4,1.70,-1.4],look:[8.5,1.4,-4],label:'水疗池水汽'}];
 const presets=bath.presets.slice();
 try{
  renderer.initRenderTarget(rt);renderer.setRenderTarget(rt);renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=false;
  await measured('bounded HDR material compile',async()=>{stats.materialBatches=await compileBathBatches74(bath.scene,renderer,camera,(p,n,total)=>report(.34+p*.43,`正在准备室内材质 ${n}/${total}`));});
  await measured('shadow maps',async()=>{
   for(const {light} of shadows){light.shadow.autoUpdate=false;light.shadow.needsUpdate=false;}
   for(let i=0;i<shadows.length;i++){shadows[i].light.shadow.needsUpdate=true;renderer.shadowMap.needsUpdate=true;renderer.setRenderTarget(rt);preparationStep74('one light shadow map',()=>renderer.render(bath.scene,camera));report(.77+.10*(i+1)/shadows.length,'正在准备柔和阴影');await nextPaint();}
  });
  await measured('room pipelines',async()=>{for(let i=0;i<views.length;i++){
   const v=views[i];camera.position.fromArray(v.p);camera.lookAt(...v.look);camera.layers.set(0);camera.updateMatrixWorld();
   if(i===2)bath.presets[1]=2;else bath.presets.splice(0,4,...presets);
   bath.update(0,{x:camera.position.x,z:camera.position.z});renderer.shadowMap.needsUpdate=false;preparationStep74('transition reflections',()=>bath.beforeRender(renderer,camera));
   if(renderFrame)await preparationStep74('transition pipeline',()=>renderFrame(camera));else{renderer.setRenderTarget(rt);renderer.render(bath.scene,camera);}
   report(.87+.13*(i+1)/views.length,`正在准备${v.label}`);await nextPaint();
  }});
  bath.warmed74=true;stats.programs=renderer.info.programs.length;stats.steps=preparationSamples74.slice();stats.maxSynchronousStepMs=Math.max(...stats.steps.map(s=>s.ms));
 }finally{
  bath.presets.splice(0,4,...presets);bath.update(0,{x:originalCamera.position.x,z:originalCamera.position.z});bath.spa.setView(originalCamera);
  for(const s of shadows){s.light.shadow.autoUpdate=s.auto;s.light.shadow.needsUpdate=false;}
  renderer.setRenderTarget(saved,face,mip);renderer.shadowMap.autoUpdate=auto;renderer.shadowMap.needsUpdate=bath.warmed74?false:needs;rt.dispose();
 }
}
