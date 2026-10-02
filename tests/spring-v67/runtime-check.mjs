import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import * as T from '../../dist/vendor/three.module.min.js';
import {loadNPC} from './load-npcs.mjs';
import {initializeSpringNPCs} from '../../dist/level27-npcs-v67.js';
import {initializeSpringTextures} from '../../dist/level27-materials.js?v=63';
import {createLevel27} from '../../dist/level27-scene.js?v=67';
import {poolFloor,springAllowed,polygonArea,CAVE_PLAN} from '../../dist/level27-layout.js?v=67';
const {createCanvas,loadImage}=createRequire(import.meta.url)(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas');
globalThis.document={createElement:()=>createCanvas(1,1)};
async function decode(url,w,h){const im=await loadImage(url.pathname),c=createCanvas(w,h);c.getContext('2d').drawImage(im,0,0,w,h);return{data:new Uint8Array(c.getContext('2d').getImageData(0,0,w,h).data),width:w,height:h};}
await Promise.all([initializeSpringTextures(decode),initializeSpringNPCs(loadNPC)]);
const spring=createLevel27(),camera=new T.PerspectiveCamera(72,16/9,.08,40),scene=spring.scene,actors=spring.npcs.actors;
assert.equal(actors.length,2);assert.deepEqual(spring.npcs.diagnostics.bones,[20,20]);assert(spring.npcs.diagnostics.triangles<4000);
let transmission=0,triangles=0,draws=0,skinned=0;const imageSizes=[];
scene.traverse(o=>{if(!o.isMesh)return;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;draws+=Array.isArray(o.material)?o.geometry.groups.length:1;if(o.isSkinnedMesh)skinned++;
 for(const m of(Array.isArray(o.material)?o.material:[o.material])){if(m.transmission>0)transmission++;if(o.isSkinnedMesh){assert(m.isMeshBasicMaterial);assert.equal(m.map.minFilter,T.NearestFilter);assert.equal(m.map.magFilter,T.NearestFilter);assert(!m.map.generateMipmaps);imageSizes.push([m.map.image.width,m.map.image.height]);}}
});assert.equal(transmission,0);assert.equal(skinned,6);assert(Math.abs(polygonArea(CAVE_PLAN)-18.58)<1e-10);
for(const a of actors)assert(!springAllowed(a.plan.x,a.plan.z),'Bathers need physical occupancy');
const contacts=[];
for(const a of actors){const footStats=[];for(const name of['footL','footR']){const bone=a.root.getObjectByName(name),p=bone.getWorldPosition(new T.Vector3());footStats.push({bone:name,world:p.toArray(),floor:poolFloor(p.x,p.z)});}contacts.push({id:a.plan.id,feet:footStats,root:a.root.position.toArray()});}
let soleError=0,soleSamples=0;for(const a of actors)a.root.traverse(o=>{if(!o.isSkinnedMesh)return;const pos=o.geometry.attributes.position;for(let i=0;i<pos.count;i++)if(pos.getY(i)<.006){const v=o.getVertexPosition(i,new T.Vector3()).applyMatrix4(o.matrixWorld);soleError=Math.max(soleError,Math.abs(v.y-poolFloor(v.x,v.z)));soleSamples++;}});assert(soleError<.025,'Unseated foot sole '+soleError);
const standing=actors[1],palm=standing.root.localToWorld(new T.Vector3(-.37,.737,.19)),ray=new T.Raycaster(new T.Vector3(palm.x,2,palm.z),new T.Vector3(0,-1,0));
const rim=ray.intersectObject(spring.wash.basin)[0];assert(rim,'Standing hand must be over the real carved rim');
const palmGap=palm.y-rim.point.y;assert(Math.abs(palmGap)<.003,'Basin hand contact mismatch '+palmGap);
const supportNames=['footL','footR','handL'],before=new Map(supportNames.map(n=>[n,standing.root.getObjectByName(n).getWorldPosition(new T.Vector3())]));
const output=new T.WebGLRenderTarget(1280,720);let target=output,totalPasses=0;
const renderer={extensions:{has:()=>true},xr:{enabled:true},autoClear:false,clippingPlanes:[],shadowMap:{autoUpdate:false,needsUpdate:false},getRenderTarget:()=>target,setRenderTarget(t){target=t;},render(s,c){
 totalPasses++;const attached=new Set([target?.texture,target?.depthTexture,...(target?.textures||[])]);attached.delete(undefined);
 s.traverseVisible(o=>{if(!o.layers.test(c.layers))return;for(const m of(Array.isArray(o.material)?o.material:[o.material]))for(const u of Object.values(m?.uniforms||{}))assert(!attached.has(u.value),'Texture feedback in '+o.name);});
}};
const color=new T.DataTexture(new Uint8Array(16),2,2),depth=new T.DepthTexture(2,2);
function view(p,to){camera.position.fromArray(p);camera.lookAt(...to);camera.updateMatrixWorld();scene.userData.prepareMainVfx(camera);}
view([.12,.94,.5],[.55,.65,-1.54]);let maxDrift=0;
for(let i=0;i<120;i++){
 spring.update(i/60);spring.capture(renderer,camera);scene.userData.showerWater.prepare(renderer);scene.userData.showerWater.bind(color,depth,1280,720,camera);scene.userData.springVolume.compose(renderer,color,depth,camera,1280,720);
 assert.equal(target,output);assert.equal(renderer.autoClear,false);assert.equal(renderer.xr.enabled,true);assert.equal(renderer.shadowMap.autoUpdate,false);
 for(const n of supportNames)maxDrift=Math.max(maxDrift,standing.root.getObjectByName(n).getWorldPosition(new T.Vector3()).distanceTo(before.get(n)));
 assert.equal(spring.wash.water.material.uniforms.refraction.value,color);
}
assert(maxDrift<1e-5);assert(spring.npcs.diagnostics.updates<=40);assert(spring.npcs.diagnostics.updates>=39);
const stats=scene.userData.renderStats;assert(stats.mirrorCaptures<=20);assert(stats.volume.raySteps===20);assert.equal(stats.volume.resolutionScale,.25);assert(stats.volume.lightCachePasses<=16);
const mirrors=stats.mirrorCaptures;view([3.65,3.5,-6],[3.65,3.5,-9]);spring.update(3);spring.capture(renderer,camera);assert.equal(stats.mirrorCaptures,mirrors);
view([5.2,1.9,.2],[6.1,3.8,.8]);spring.update(4);spring.capture(renderer,camera);assert.equal(stats.mirrorCaptures,mirrors,'No mirror work when pool is out of view');
const report={method:'Production GLTFLoader + AnimationMixer and render-pass instrumentation; not browser FPS',skinnedMeshes:skinned,npcs:spring.npcs.diagnostics,generatedDiffuseSizes:imageSizes,contacts,soleSamples,maxFootSoleTerrainDifference:soleError,handToStoneRimMetres:palmGap,pinnedSupportMaxDriftMetres:maxDrift,physicalTransmissionMaterials:transmission,sceneTriangles:triangles,sceneDraws:draws,measuredPasses:totalPasses,stats,waterArea:polygonArea(CAVE_PLAN),noAttachmentFeedback:true,renderStateRestored:true};
fs.writeFileSync(new URL('./results/runtime-check.json',import.meta.url),JSON.stringify(report,null,2));console.log({passed:true,skinnedMeshes:skinned,triangles,draws,palmGap,maxDrift,npcUpdates:report.npcs.updates,mirrorCaptures:mirrors});spring.dispose();output.dispose();color.dispose();depth.dispose();
