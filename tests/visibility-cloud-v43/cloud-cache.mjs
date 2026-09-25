import assert from 'node:assert/strict';
import * as T from '../../dist/vendor/three.module.min.js';
import {createAtmosphere,CLOUD_LAYERS} from '../../dist/atmosphere.js?v=43';
import {createWaterEnvironment} from '../../dist/water-environment.js?v=43';
T.TextureLoader.prototype.load=function(_url,ok){const t=new T.Texture();queueMicrotask(()=>ok?.(t));return t;};
let target=null,draws=[];
const renderer={autoClear:false,extensions:{has:()=>true},getRenderTarget:()=>target,setRenderTarget(t){target=t;},render(scene,camera){
 for(const mesh of scene.children){if(!mesh.material)continue;const m=mesh.material;draws.push({target,material:m,camera});
  for(const [k,u]of Object.entries(m.uniforms||{}))if(u.value?.isTexture)assert(u.value!==target?.texture,'Framebuffer feedback '+k);
 }
}};
const scene=new T.Scene(),a=createAtmosphere({scene,renderer}),camera=new T.PerspectiveCamera(72,16/9,.08,480);
camera.position.set(.6,1.77,52);camera.updateMatrixWorld(true);a.update({camera,time:0});
a.sky.userData.renderClouds(camera,1920,1080);assert.equal(draws.at(-1).target.width,640);assert.equal(draws.at(-1).target.height,360);assert.equal(target,null);assert.equal(renderer.autoClear,false);assert.equal(a.sky.material.uniforms.uCloudCached.value,true);
const firstPass=draws.at(-1).material;assert.equal(firstPass.uniforms.uCloudCached.value,false);assert.equal(firstPass.uniforms.uCloudScreen.value,null);
const projection=firstPass.uniforms.uCloudInverseProjection.value.clone();camera.fov=26;camera.updateProjectionMatrix();camera.rotation.y=.5;camera.updateMatrixWorld(true);
a.sky.userData.renderClouds(camera,960,720);assert.equal(draws.at(-1).target.width,480);assert(!projection.equals(firstPass.uniforms.uCloudInverseProjection.value));
const environment=createWaterEnvironment(renderer,a.sky);environment.update(0,camera);assert.equal(draws.at(-1).material.uniforms.uCloudCached.value,false);assert.equal(draws.at(-1).material.uniforms.uFogVolumeAmount.value,0);
const before=draws.length;a.update({camera,event:{wallpaper:1}});a.sky.userData.renderClouds(camera,960,720);assert.equal(draws.length,before);assert.equal(a.sky.material.uniforms.uCloudCached.value,false);
let disposed=false;firstPass.addEventListener('dispose',()=>disposed=true);a.dispose();environment.dispose();assert(disposed);
assert.deepEqual(CLOUD_LAYERS.map(x=>x.altitude),[3000,1500,400]);
console.log(JSON.stringify({halfResolution:true,widthCap:640,currentViewAndZoom:true,noFramebufferFeedback:true,reflectionUsesRawWorldSky:true,sharpEventsBypass:true,resourcesDisposed:true},null,2));
