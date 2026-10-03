import * as T from './vendor/three.module.min.js';
import {createBathLoading,nextPaint} from './bath-loading-v72.js';
import {compileBathBatches74} from './bath-preparation-v74.js';
export const SPRING_SLIDES75=Array.from({length:10},(_,i)=>new URL(`./textures/spring-loading-v75/spring-${String(i+1).padStart(2,'0')}.webp`,import.meta.url).href);
export const createSpringLoading75=(host=document.body)=>createBathLoading(host,{slides:SPRING_SLIDES75,title:'LEVEL 27 / ROCK SPRINGS',opening:'正在进入岩体泉',alt:'无人岩间温泉的旧数码照片',returnText:'返回淋浴间'});
export async function warmSpring75(spring,renderer,camera,report,renderFrame){
 if(spring.warmed75){report(1,'岩体泉已准备');return;}
 const textures=new Set();spring.scene.traverse(o=>{for(const m of Array.isArray(o.material)?o.material:[o.material])if(m){for(const t of Object.values(m))if(t?.isTexture&&!t.isRenderTargetTexture)textures.add(t);for(const u of Object.values(m.uniforms||{}))if(u?.value?.isTexture&&!u.value.isRenderTargetTexture)textures.add(u.value);}});
 let n=0,budget=performance.now();for(const t of textures){renderer.initTexture(t);report(.16*++n/textures.size,'正在准备岩壁与泉水贴图');if(performance.now()-budget>4){await nextPaint();budget=performance.now();}}
 const saved=renderer.getRenderTarget(),face=renderer.getActiveCubeFace(),mip=renderer.getActiveMipmapLevel(),planes=renderer.clippingPlanes,auto=renderer.shadowMap.autoUpdate,needs=renderer.shadowMap.needsUpdate;
 const rt=new T.WebGLRenderTarget(128,96,{type:T.HalfFloatType,depthBuffer:true}),c=camera.clone();
 try{
  renderer.initRenderTarget(rt);renderer.setRenderTarget(rt);renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=false;
  await compileBathBatches74(spring.scene,renderer,c,(p,n,total)=>report(.16+p*.42,`正在准备岩体泉材质 ${n}/${total}`));
  // Existing spring mirror uses one clipping plane: warm its actual variant
  // separately under the album instead of blocking at the first water view.
  renderer.clippingPlanes=[new T.Plane(new T.Vector3(0,1,0),.018)];
  await compileBathBatches74(spring.scene,renderer,c,(p,n,total)=>report(.58+p*.27,`正在准备泉水倒影 ${n}/${total}`));
  renderer.clippingPlanes=planes;
  const lights=[];spring.scene.traverse(o=>{if(o.isLight&&o.castShadow){lights.push(o);o.shadow.autoUpdate=false;o.shadow.needsUpdate=false;}});
  for(let i=0;i<lights.length;i++){lights[i].shadow.needsUpdate=true;renderer.shadowMap.needsUpdate=true;renderer.setRenderTarget(rt);renderer.render(spring.scene,c);report(.85+.06*(i+1)/lights.length,'正在准备洞穴灯光');await nextPaint();}
  const views=[{p:[1.3,1.42,2.20],look:[-.35,.08,.1]},{p:camera.position.toArray(),look:camera.position.clone().add(camera.getWorldDirection(new T.Vector3())).toArray()}];
  for(let i=0;i<views.length;i++){c.position.fromArray(views[i].p);c.lookAt(...views[i].look);c.updateMatrixWorld();spring.update(i*.12,{x:c.position.x,z:c.position.z,wet:false,moved:0});await renderFrame(c);report(.91+.09*(i+1)/views.length,'正在准备蒸汽与瀑布');await nextPaint();}
  spring.warmed75=true;
 }finally{renderer.clippingPlanes=planes;renderer.setRenderTarget(saved,face,mip);renderer.shadowMap.autoUpdate=auto;renderer.shadowMap.needsUpdate=spring.warmed75?false:needs;rt.dispose();}
}
