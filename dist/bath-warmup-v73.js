import * as T from './vendor/three.module.min.js';
const nextPaint=()=>new Promise(r=>requestAnimationFrame(()=>setTimeout(r,0)));
export async function warmBath73(bath,renderer,originalCamera,report=()=>{}){
 if(bath.warmed73)return;
 const textures=new Set();bath.scene.traverse(o=>{const materials=Array.isArray(o.material)?o.material:[o.material];for(const m of materials){if(!m)continue;for(const t of Object.values(m))if(t?.isTexture&&!t.isRenderTargetTexture)textures.add(t);for(const u of Object.values(m.uniforms||m.userData.wetUniforms||{}))if(u?.value?.isTexture&&!u.value.isRenderTargetTexture)textures.add(u.value);}});
 let count=0;for(const t of textures){renderer.initTexture(t);if(++count%5===0){report(.40*count/textures.size,'正在预载室内贴图');await nextPaint();}}
 const camera=originalCamera.clone(),rt=new T.WebGLRenderTarget(128,96,{depthBuffer:true}),saved=renderer.getRenderTarget(),needs=renderer.shadowMap.needsUpdate,auto=renderer.shadowMap.autoUpdate;
 const views=[{p:[-2.2,1.70,6.85],look:[.58,1.76,.232]},{p:[0,1.70,3.8],look:[-3.77,1.35,4.2]},{p:[-6.2,1.70,-3.2],look:[-8,1.5,-3.2]},{p:[5.4,1.70,-1.4],look:[8.5,1.4,-4]}];
 try{renderer.initRenderTarget(rt);for(let i=0;i<views.length;i++){camera.position.fromArray(views[i].p);camera.lookAt(...views[i].look);camera.layers.set(0);camera.updateMatrixWorld();bath.update(0,{x:camera.position.x,z:camera.position.z});bath.beforeRender(renderer,camera);await renderer.compileAsync(bath.scene,camera);renderer.setRenderTarget(rt);renderer.shadowMap.needsUpdate=false;renderer.render(bath.scene,camera);report(.4+.6*(i+1)/views.length,'正在准备镜面与房间转场');await nextPaint();}bath.warmed73=true;}
 finally{renderer.setRenderTarget(saved);renderer.shadowMap.autoUpdate=auto;renderer.shadowMap.needsUpdate=needs;rt.dispose();bath.beforeRender(renderer,originalCamera);}
}
