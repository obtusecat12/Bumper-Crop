import * as T from './vendor/three.module.min.js';
// Actual weather sky, cached separately from the view-dependent fog buffer.
// One 64² face per frame, only while a refresh is due; never six scene renders.
export function createWaterEnvironment(renderer,sky){
 if(!sky)return null;
 const target=new T.WebGLCubeRenderTarget(64,{type:renderer.extensions.has('EXT_color_buffer_float')?T.HalfFloatType:T.UnsignedByteType,minFilter:T.LinearMipmapLinearFilter,magFilter:T.LinearFilter,generateMipmaps:true});
 target.texture.colorSpace=T.NoColorSpace;
 const scene=new T.Scene(),material=sky.material.clone();
 material.uniforms={...sky.material.uniforms,uFogVolumeAmount:{value:0}};
 const dome=new T.Mesh(sky.geometry,material);dome.frustumCulled=false;scene.add(dome);
 const cameras=new T.CubeCamera(.1,600,target);cameras.coordinateSystem=T.WebGLCoordinateSystem;cameras.updateCoordinateSystem();
 let face=0,next=0,ready=false;const stats={faces:0,size:64};
 function update(time,camera){
  if(ready&&face===0&&time<next)return;
  const previous=renderer.getRenderTarget(),auto=renderer.autoClear;
  cameras.position.copy(camera.position);dome.position.copy(camera.position);cameras.updateMatrixWorld(true);
  renderer.autoClear=true;target.texture.generateMipmaps=face===5;
  renderer.setRenderTarget(target,face);renderer.render(scene,cameras.children[face]);
  renderer.setRenderTarget(previous);renderer.autoClear=auto;stats.faces++;
  face++;if(face===6){face=0;ready=true;next=time+.4;}
 }
 return {texture:target.texture,stats,update,get ready(){return ready;},reset(){face=0;next=0;ready=false;},dispose(){target.dispose();material.dispose();}};
}
