import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import * as T from '../../dist/vendor/three.module.min.js';
import {initializeVendingTextures,vendingTextures,vendingDrinkTextures,VENDING_TEXTURE_SPECS} from '../../dist/vending-materials-v70.js';
import {createBackcourt} from '../../dist/backcourt-scene-v70.js';
import {BACKCOURT_PLAN as P,VENDING_TRAY,backcourtWorld} from '../../dist/backcourt-layout-v70.js';
const {createCanvas,loadImage}=createRequire(import.meta.url)(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas');
await initializeVendingTextures(async(url,w,h)=>{const im=await loadImage(url.pathname);assert.equal(im.width,w,url.pathname);assert.equal(im.height,h,url.pathname);const canvas=createCanvas(w,h),ctx=canvas.getContext('2d');ctx.drawImage(im,0,0);return{width:w,height:h,data:new Uint8Array(ctx.getImageData(0,0,w,h).data)};});
const c=createBackcourt({seed:70}),scene=new T.Scene();scene.add(c.object);scene.updateMatrixWorld(true);
assert.equal(Object.keys(vendingTextures()).length,33);assert.equal(Object.keys(VENDING_TEXTURE_SPECS).length,16);
const textures=vendingTextures();for(const[name,t]of Object.entries(textures)){assert(t.image.data.length===t.image.width*t.image.height*4);assert(t.image.width>0);assert.equal(t.colorSpace,/-normal|-roughness/.test(name)?T.NoColorSpace:T.SRGBColorSpace);}
assert.equal(vendingDrinkTextures().soyBackNormal,textures['soy-back-normal']);
assert.equal(c.colliders.length,3);assert(c.cables.every(v=>v.minimumY>=-1e-7));
assert.equal(c.craft.find(v=>v.kind==='outlet').plugs,2);
assert.equal(c.craft.find(v=>v.kind==='mat').topY,VENDING_TRAY.groundPatch.size[1]);
assert.equal(Object.values(c.instances).flat().length,14);assert.equal(c.physics.size,0);
let geometryBytes=0;scene.traverse(o=>{if(!o.geometry)return;for(const[name,a]of Object.entries(o.geometry.attributes)){assert([...a.array].every(Number.isFinite),o.name+' '+name);geometryBytes+=a.array.byteLength;}assert(o.geometry.attributes.uv,o.name+' untextured geometry');});
const camera=new T.PerspectiveCamera(67,1.5,.05,480),eye=backcourtWorld(P.machine[0],P.machine[1]+1.6),aim=backcourtWorld(...P.machine);
camera.position.set(eye.x,P.groundY+1.62,eye.z);camera.lookAt(aim.x,P.groundY+1.14,aim.z);camera.updateMatrixWorld(true);
assert.equal(c.query(camera)?.kind,'vending-machine');
// Raycast the genuine opening: no opaque waterfall quad or cabinet box may
// occupy its front. The first real surface is recessed in the delivery cavity.
const localRay=new T.Vector3(P.machine[0],.54,P.machine[1]+.5).applyMatrix4(c.object.matrixWorld),dir=new T.Vector3(0,0,-1).transformDirection(c.object.matrixWorld);
const hits=new T.Raycaster(localRay,dir,0,2).intersectObject(c.object,true).filter(h=>!h.object.isInstancedMesh);
assert(hits.length);assert(hits[0].distance>.50,'front architecture blocks retrieval opening');
const result=c.dispense();assert(result.ok);assert.equal(c.physics.size,1);assert.equal(c.dispense().reason,'busy');
for(let i=0;i<240;i++)c.tick(1/60,{level:11},true,camera);
const r=c.physics.get(result.id);assert(r);assert(r.position.every(Number.isFinite));
const steps=c.physics.stats.steps,version=c.version;c.tick(.5,{level:27},true,camera);assert.equal(c.physics.stats.steps,steps);assert.equal(c.version,version);
c.tick(.5,{level:11},false,camera);assert.equal(c.physics.stats.steps,steps);
const far=camera.clone();far.position.x+=80;c.tick(.5,{level:11},true,far);assert.equal(c.physics.stats.steps,steps);
// Query and remove the actual resting body through the same camera-space API
// used by E; its world pose remains valid after a 64m origin rebase.
const center=new T.Vector3(0,r.profile.height*.5,0).applyQuaternion(new T.Quaternion(...r.quaternion)).add(new T.Vector3(...r.position));
const moving=c.object.children.find(o=>o.name==='Machine-local drink physics');moving.updateWorldMatrix(true,false);center.applyMatrix4(moving.matrixWorld);
camera.position.copy(center).add(new T.Vector3(0,.55,.8));camera.lookAt(center);camera.updateMatrixWorld(true);assert.equal(c.query(camera)?.id,r.id);
scene.position.set(-512,0,-384);scene.updateMatrixWorld(true);camera.position.x-=512;camera.position.z-=384;camera.lookAt(center.x-512,center.y,center.z-384);camera.updateMatrixWorld(true);assert.equal(c.query(camera)?.id,r.id);
const picked=c.pickup(r.id);assert(picked);assert.equal(picked.variant.kind,'vending');assert.equal(c.physics.size,0);assert.equal(c.pickup(r.id),null);assert(picked.worldPosition.distanceTo(center.add(new T.Vector3(-512,0,-384)))<1e-5);
assert(Object.values(c.instances).flat().every(im=>im.count===0));
const report={passed:true,scope:'Actual source geometry/materials, camera queries, tray opening, paused/distant physics, inventory handoff and 64m origin rebase. Not browser FPS.',runtimeTextures:33,generatedDiffuseAssets:16,static:c.object.userData.cityStats,drinkInstanceDraws:14,geometryBytes,cables:c.cables.map(v=>({minimumY:v.minimumY,start:v.points[0],end:v.points.at(-1)})),drinkType:result.type,physics:c.physics.stats};
fs.mkdirSync(new URL('./results/',import.meta.url),{recursive:true});fs.writeFileSync(new URL('./results/scene-check.json',import.meta.url),JSON.stringify(report,null,2));console.log({passed:true,static:report.static,geometryBytes,runtimeTextures:33,drinkInstanceDraws:14});c.dispose();
