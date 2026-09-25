import fs from 'node:fs';import {createRequire} from 'node:module';import {pathToFileURL} from 'node:url';
const {createCanvas}=createRequire(import.meta.url)('/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');globalThis.document={createElement:()=>createCanvas(1,1)};
const root=process.argv[2]||process.cwd()+'/dist',out=process.argv[3]||'/tmp/v38-view.json',B=pathToFileURL(root+'/').href,v=fs.readFileSync(root+'/models.js','utf8').match(/world\.js\?v=(\d+)/)[1];
const T=await import(B+'vendor/three.module.min.js'),W=await import(B+'world.js?v='+v),M=await import(B+'models.js?v='+v),D=await import(B+'dense-wheat.js?v='+v);
const batched=fs.existsSync(root+'/scene-batches.js'),batch=batched?(await import(B+'scene-batches.js?v='+v)).createSceneBatches():null;
const scene=new T.Scene(),chunks=new Map(),seed=W.stringSeed('CHLORINE / ABUNDANCE / 10'),start=performance.now();let n=0;
for(let dz=-3;dz<=3;dz++)for(let dx=-3;dx<=3;dx++){
 const level=Math.max(Math.abs(dx),Math.abs(dz))<=1?0:Math.max(Math.abs(dx),Math.abs(dz))<=2?1:2;
 const f=W.field(BigInt(dx),BigInt(dz),seed),chunk=M.makeChunk(f,level,'balanced',new Set());chunk.group.position.set(dx*64,0,dz*64);chunk.group.updateMatrixWorld(true);chunks.set(f.key,chunk);scene.add(chunk.group);if(level===0)chunk.detailPatches=D.prepareWheatDetail(f,'balanced');batch?.register(chunk);
 if(++n%7===0)console.error('tiles',n,'ms',Math.round(performance.now()-start));
}
const generatedMs=performance.now()-start,buildStart=performance.now();if(batch){batch.update('0,0');scene.add(batch.object);}const batchMs=performance.now()-buildStart;
const detail=D.createWheatDetailLayer(M.wind);scene.add(detail.object);const camera=new T.PerspectiveCamera(72,4/3,batched?.08:.01,480);camera.rotation.order='YXZ';camera.position.set(.6,1.77,52);camera.rotation.set(-.025,-.37,0);
const poses=[],frustum=new T.Frustum(),vp=new T.Matrix4(),updates=[];
for(let frame=0;frame<30;frame++){const t=performance.now();detail.update(chunks,new T.Vector3(.6+frame*.04,1.77,52),'balanced','0,0');updates.push(performance.now()-t);}
for(const yaw of [-.37,.9,2.1,3.4]){
 camera.rotation.y=yaw;camera.updateMatrixWorld(true);batch?.updateView(camera);detail.update(chunks,camera.position,'balanced','0,0');scene.updateMatrixWorld(true);frustum.setFromProjectionMatrix(vp.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
 let draws=0,triangles=0;const names={};scene.traverseVisible(o=>{if((!o.isMesh&&!o.isLine)||!o.geometry?.attributes.position||o.isInstancedMesh&&!o.count)return;if(o.frustumCulled&&!frustum.intersectsObject(o))return;const calls=Array.isArray(o.material)?o.geometry.groups.length:1;draws+=calls;const count=(o.geometry.index?.count||o.geometry.attributes.position.count)*(o.isInstancedMesh?o.count:1);if(o.isMesh)triangles+=count/3;const key=o.name||o.material.name||o.type;names[key]=(names[key]||0)+calls;});poses.push({yaw,draws,triangles,names});
}
updates.sort((a,b)=>a-b);const result={version:v,batched,generatedMs,batchMs,camera:camera.position.toArray(),poses,batch:batch?.stats,detail:detail.object.userData.wheat,detailUpdateMedianMs:updates[15],detailUpdateP95Ms:updates[28]};fs.writeFileSync(out,JSON.stringify(result,null,2));console.log(JSON.stringify({...result,poses:poses.map(({names,...a})=>a)},null,2));
