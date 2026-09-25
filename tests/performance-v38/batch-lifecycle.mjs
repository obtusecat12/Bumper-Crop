import assert from 'node:assert/strict';import {createRequire} from 'node:module';
const {createCanvas}=createRequire(import.meta.url)('/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');globalThis.document={createElement:()=>createCanvas(1,1)};
const B=new URL('../../dist/',import.meta.url).href,T=await import(B+'vendor/three.module.min.js'),{createSceneBatches}=await import(B+'scene-batches.js?v=38'),{makeBottle}=await import(B+'models.js?v=38');
const scene=new T.Scene(),batch=createSceneBatches(),geo=new T.BoxGeometry(),mat=new T.MeshStandardMaterial(),chunk={group:new T.Group()},camera=new T.PerspectiveCamera(70,1,.08,100),matrix=new T.Matrix4();scene.add(chunk.group,batch.object);
const near=new T.InstancedMesh(geo,mat,1),behind=new T.InstancedMesh(geo,mat,1);near.setMatrixAt(0,new T.Matrix4().makeTranslation(0,0,-10));behind.setMatrixAt(0,new T.Matrix4().makeTranslation(0,0,10));near.castShadow=behind.castShadow=true;near.computeBoundingSphere();behind.computeBoundingSphere();chunk.group.add(near,behind);
const bottle=makeBottle(1,0,-4);chunk.group.add(bottle);batch.register(chunk);batch.update('0,0');scene.updateMatrixWorld(true);batch.updateView(camera);
let mesh=batch.object.children.find(m=>m.castShadow);assert.equal(mesh.count,1);mesh.getMatrixAt(0,matrix);assert.equal(matrix.elements[14],-10);
mesh.onBeforeShadow();assert.equal(mesh.count,2);mesh.onAfterShadow();assert.equal(mesh.count,1);
// A rebase changes coordinates, never absolute placement or shadow coverage.
chunk.group.position.x=-64;camera.position.x=-64;batch.update('1,0');scene.updateMatrixWorld(true);batch.updateView(camera);assert.equal(mesh.count,1);mesh.getMatrixAt(0,matrix);assert.equal(matrix.elements[12]+batch.object.position.x,-64);
// All instances can be outside the main view and still cast shadows.
camera.position.x=1000;batch.updateView(camera);assert.equal(mesh.count,0);assert.equal(mesh.visible,true);mesh.onBeforeShadow();assert.equal(mesh.count,2);mesh.onAfterShadow();assert.equal(mesh.count,0);
// A collected bottle disappears from both glass and opaque pools after refresh.
assert.equal(batch.object.children.filter(m=>m.name.includes('pickup-bottle')).length,2);chunk.group.remove(bottle);batch.refresh(chunk);batch.update('1,0');assert.equal(batch.object.children.filter(m=>m.name.includes('pickup-bottle')).length,0);
batch.remove(chunk);batch.update('1,0');assert.equal(batch.object.children.length,0);batch.dispose();console.log('PASS: visibility, off-screen shadows, rebase, pickup refresh, unload');
