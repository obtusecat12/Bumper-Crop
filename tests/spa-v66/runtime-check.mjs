import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import * as T from '../../dist/vendor/three.module.min.js';
import {SPA,SPA_SPILL} from '../../dist/spa-layout-v66.js';
import {createSpaAudio} from '../../dist/spa-audio-v66.js';
const {createCanvas,loadImage}=createRequire(import.meta.url)(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas');
globalThis.document={createElement:()=>createCanvas(1,1)};
async function decode(url,w,h){const im=await loadImage(url.pathname),c=createCanvas(w,h);c.getContext('2d').drawImage(im,0,0,w,h);return{data:new Uint8Array(c.getContext('2d').getImageData(0,0,w,h).data),width:w,height:h};}
const {initializeSpaTextures}=await import('../../dist/spa-materials-v66.js');
const {initializeSpringTextures}=await import('../../dist/level27-materials.js?v=63');
const {initializeBathRefitTextures}=await import('../../dist/bath-v61-materials.js?v=61');
await Promise.all([initializeSpaTextures(decode),initializeSpringTextures(decode),initializeBathRefitTextures(decode)]);
const {createSpa}=await import('../../dist/spa-scene-v66.js');
const scene=new T.Scene(),old=new T.Group();old.name='Bathhouse architecture and furniture';scene.add(old);
const spa=createSpa(scene),camera=new T.PerspectiveCamera(78,16/9,.08,24);
function view(p,to){camera.position.fromArray(p);camera.lookAt(...to);camera.updateMatrixWorld();return spa.setView(camera);}
for(const x of[0,2.9,3.14,3.16,4.18,5]){assert(view([x,1.65,-1.57],[7,1.25,-2.48]));assert(spa.group.visible);assert(spa.water.group.visible);}
assert(!view([0,1.65,-1.57],[-5,1.65,-1.57]));assert(spa.group.visible,'Opaque spa must exist before entering');assert(old.visible);
assert(view([9.8,1.65,-3.7],[12.35,1.18,-1.4]));assert(!old.visible,'Hidden old rooms should not consume interior draws');
assert(view([7,1.65,-1.6],[3,1.65,-1.6]));assert(old.visible,'Return view must expose the original room');
assert.equal(SPA_SPILL.outlet[0],SPA_SPILL.impact[0]);assert.equal(SPA_SPILL.outlet[2],SPA_SPILL.impact[2]);
assert.equal(spa.water.fall.children.length,2);
const b=new T.Box3().setFromObject(spa.water.fall);assert(Math.abs(b.max.y-SPA_SPILL.outlet[1])<.001);assert(Math.abs(b.min.y-SPA.waterY)<.001);
const output=new T.WebGLRenderTarget(1280,720);let target=output,draws=0;
const renderer={extensions:{has:()=>true},xr:{enabled:true},autoClear:false,shadowMap:{autoUpdate:false},getRenderTarget:()=>target,setRenderTarget(t){target=t;},render(s,c){
 draws++;const attached=new Set([target?.texture,target?.depthTexture,...(target?.textures||[])]);attached.delete(undefined);
 s.traverseVisible(o=>{if(c&&!o.layers.test(c.layers))return;for(const mat of(Array.isArray(o.material)?o.material:[o.material]))for(const u of Object.values(mat?.uniforms||{}))assert(!attached.has(u.value),'Sampled attachment feedback: '+o.name);});
}};
const color=new T.DataTexture(new Uint8Array(16),2,2),depth=new T.DepthTexture(2,2);
view([10.4,1.48,-.35],[8.62,1.05,-4.73]);
for(let i=0;i<60;i++){
 spa.update(i/60);spa.prepare(renderer,camera);spa.water.bind(color,depth,1280,720,camera);
 assert.notEqual(spa.compose(renderer,color,depth,camera,1280,720),color);
 assert.equal(target,output);assert.equal(renderer.autoClear,false);assert.equal(renderer.xr.enabled,true);assert.equal(renderer.shadowMap.autoUpdate,false);
 assert.deepEqual(spa.water.uniforms.resolution.value.toArray(),[1280,720]);assert.equal(spa.bloom.stats.passesLastCompose,8);
}
assert(spa.stats.staticDraws<40);assert.equal(spa.water.stats.computePasses,60);assert.equal(spa.reflections.stats.sceneCaptures,0);
assert(spa.steam.diagnostics.simulationPasses<=21);assert(spa.steam.diagnostics.lightCachePasses<=9);
assert.deepEqual([spa.steam.diagnostics.halfWidth,spa.steam.diagnostics.halfHeight],[320,180]);
view([0,1.65,-1.57],[-5,1.65,-1.57]);const before=draws;spa.update(2);spa.prepare(renderer,camera);assert.equal(spa.compose(renderer,color,depth,camera,1280,720),color);assert.equal(draws,before);
spa.update(3,{x:SPA.cx,z:SPA.cz,yaw:0});spa.update(4,{x:10.6,z:.18,yaw:.1});spa.update(5,{x:10.6,z:.8,yaw:.1});
assert.equal(spa.materials.marks.value.filter(p=>p.z>=3).length,2,'Wet feet leave staggered marks in the floor shader');
const marks=spa.materials.marks.value.map(p=>p.toArray());spa.update(40,{x:10.6,z:1.7,yaw:.1});assert.deepEqual(spa.materials.marks.value.map(p=>p.toArray()),marks,'Dry feet stop depositing marks');
const buffers=[],gains=[],sources=[],filters=[],pans=[];const parameter=()=>({value:0,setTargetAtTime(v){assert(Number.isFinite(v));this.value=v;}}),node=()=>({connect(){},disconnect(){this.disconnected=true;}});
const ctx={sampleRate:12000,currentTime:1,createBuffer(ch,n,sr){const data=Array.from({length:ch},()=>new Float32Array(n)),b={data,getChannelData:i=>data[i],length:n,sampleRate:sr};buffers.push(b);return b;},createGain(){const q={...node(),gain:parameter()};gains.push(q);return q;},createStereoPanner(){const q={...node(),pan:parameter()};pans.push(q);return q;},createBiquadFilter(){const q={...node(),frequency:parameter()};filters.push(q);return q;},createBufferSource(){const q={...node(),start(){this.started=true;},stop(){this.stopped=true;}};sources.push(q);return q;},createOscillator(){const q={...node(),frequency:parameter(),start(){this.started=true;},stop(){this.stopped=true;}};sources.push(q);return q;},createConvolver:node};
const audio=createSpaAudio();audio.update(ctx,node(),{x:7.57,z:-3.5,yaw:0},true);const near=gains[0].gain.value;assert(near>0);assert(sources.every(s=>s.started));assert(buffers.every(b=>b.data.every(a=>a.every(Number.isFinite))));
audio.update(ctx,node(),{x:0,z:1,yaw:0},true);assert(gains[0].gain.value<near);assert.equal(filters[0].frequency.value,1150);
audio.update(ctx,node(),{x:8,z:-2,yaw:0},false);assert.equal(gains[0].gain.value,0);audio.update(ctx,node(),{x:8,z:-2,yaw:0},true);audio.mute();assert.equal(gains[0].gain.value,0);audio.dispose();assert(sources.every(s=>s.stopped&&s.disconnected));
const report={method:'Production scene/visibility/VFX/audio on instrumented render and audio contexts. Not browser FPS.',portalViews:6,staticDraws:spa.stats.staticDraws,frames:60,draws,waterComputePasses:spa.water.stats.computePasses,volume:spa.steam.diagnostics,ssr:spa.reflections.stats,wetFootprints:2,audio:'finite PCM, near/far occlusion, pause, exit and teardown passed',attachmentFeedback:false,restoredRenderState:true};
fs.writeFileSync(new URL('./results/runtime-check.json',import.meta.url),JSON.stringify(report,null,2));spa.dispose();output.dispose();color.dispose();depth.dispose();console.log({passed:true,staticDraws:report.staticDraws,frames:60,draws,portalViews:6});
