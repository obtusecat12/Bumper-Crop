import assert from 'node:assert/strict';import * as T from '../../dist/vendor/three.module.min.js';
import {createWaterEnvironment} from '../../dist/water-environment.js';
import {createWaterPipeline} from '../../dist/water-pipeline.js';import {WaterState} from '../../dist/water-state.js';
import {createWaterRipples} from '../../dist/water-ripples.js';import {createLensWater} from '../../dist/lens-water.js';
T.TextureLoader.prototype.load=function(url,onLoad){const t=new T.Texture();t.name=url;queueMicrotask(()=>onLoad?.(t));return t;};
let target=null,draws=[];
const renderer={autoClear:true,extensions:{has:()=>false},toneMappingExposure:1.23,
 getRenderTarget(){return target;},setRenderTarget(t){target=t;},render(scene,camera){
  const material=scene.children[0]?.material;draws.push({target,width:target?.width,height:target?.height,fragment:material?.fragmentShader,layer:camera.layers.mask});
  for(const v of Object.values(material?.uniforms||{})){if(v.value?.isTexture)assert(v.value!==target?.texture&&v.value!==target?.depthTexture,'No framebuffer feedback');}
 }};
const ripples=createWaterRipples(renderer),lens=createLensWater(renderer),waterState=new WaterState(),pipe=createWaterPipeline(renderer,{ripples,lens,waterState});await pipe.surface.ready;
const world=new T.Scene(),camera=new T.PerspectiveCamera(72,4/3,.01,480);camera.position.set(1,2,3);camera.updateMatrixWorld();const group=new T.Group();world.add(group);
const original=new T.MeshBasicMaterial({name:'PS1 low-poly detailed ripple water'}),mesh=new T.Mesh(new T.PlaneGeometry(20,20),original);group.add(mesh);const chunk={group,field:{type:'pond',cx:3,cz:4,lakeY:0},colliders:[]};pipe.attach(chunk);
const output=new T.WebGLRenderTarget(960,720,{depthBuffer:false}),s={x:1,z:3,cx:0n,cz:0n};waterState.update(0,{hasWater:true,shore:-1,level:0,cameraHeight:2,rain:0});
pipe.update(1/60,camera,s,true,false,new T.Color(.4,.5,.6),new T.Vector3(0,1,0),0,0);pipe.render(world,camera,null,960,720,output,null,2);
assert.equal(draws.length,5,'opaque draw, immutable-depth copy, water-only draw, fused half, fused output');
assert.deepEqual(draws.map(d=>[d.width,d.height]),[[960,720],[960,720],[960,720],[480,360],[960,720]]);
assert.equal(draws[2].layer,4);assert.equal(camera.layers.mask,1);assert.equal(target,null);assert.equal(pipe.stats.fusedPasses,1);
assert.equal(lens.diagnostics.wetPasses,0);assert.equal(lens.diagnostics.copies,0);
const tex=lens.prepareField();for(let i=0;i<100;i++)assert.equal(lens.prepareField(),tex,'data texture retained, dry skipping');
const before=mesh.material;pipe.detach(chunk);assert.equal(mesh.material,original);assert.notEqual(before,original);
// Query origin is committed together with the new normal texture, never ahead.
ripples.emit({x:1,z:3,cx:0n,cz:0n,strength:.05});ripples.update(.04,{state:s,active:true});ripples.render();const published=ripples.binding.uImpactOrigin.value.x;
s.x=2;ripples.update(.005,{state:s,active:true});assert.equal(ripples.render(),false);assert.equal(ripples.binding.uImpactOrigin.value.x,published);
ripples.update(.04,{state:s,active:true});ripples.render();assert.equal(ripples.binding.uImpactOrigin.value.x,-10);
// Actual sky material is shared by reference, screen-space fog is excluded.
const sky=new T.Mesh(new T.SphereGeometry(420),new T.ShaderMaterial({uniforms:{uFogVolumeAmount:{value:1}}}));
const environment=createWaterEnvironment(renderer,sky);draws=[];
for(let i=0;i<6;i++)environment.update(i/60,camera);
assert.equal(environment.ready,true);assert.equal(draws.length,6);assert(draws.every(d=>d.width===64&&d.height===64));
environment.update(.11,camera);assert.equal(draws.length,6,'cached sky does not redraw every frame');
environment.update(.6,camera);assert.equal(draws.length,7,'one refreshed face, not six');
environment.dispose();sky.geometry.dispose();sky.material.dispose();
pipe.dispose();lens.dispose();ripples.dispose();output.dispose();mesh.geometry.dispose();original.dispose();
console.log(JSON.stringify({pass:true,internal:[960,720],fused:[480,360],heavyPostprocessDraws:1,cheapOutputDraws:1,feedback:false,legacyWetPasses:0,retainedTextures:true}));
