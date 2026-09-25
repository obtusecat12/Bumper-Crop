import fs from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const require=createRequire(import.meta.url),{createCanvas}=require('/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
globalThis.document={createElement:()=>createCanvas(1,1)};
const root=process.argv[2]||process.cwd()+'/dist',B=pathToFileURL(root+'/').href,v=fs.readFileSync(root+'/models.js','utf8').match(/world\.js\?v=(\d+)/)[1];
const T=await import(B+'vendor/three.module.min.js'),W=await import(B+'world.js?v='+v),M=await import(B+'models.js?v='+v),D=await import(B+'dense-wheat.js?v='+v);
const seed=W.stringSeed('CHLORINE / ABUNDANCE / 10'),results=[],chunks=new Map();
for(const [x,z,level] of [[0,0,0],[10,0,0],[2,2,1],[3,3,2]]){
 const start=performance.now(),f=W.field(BigInt(x),BigInt(z),seed),task=M.createChunkTask(f,level,'balanced',new Set()),stages={};let previous=performance.now(),step;
 do{step=task.next();const now=performance.now();if(!step.done)stages[step.value]=Math.round(now-previous);previous=now;}while(!step.done);
 const c=step.value;c.group.position.set(x*64,0,z*64);chunks.set(f.key,c);
 let meshes=0,triangles=0,instances=0,cerealInstances=0,geometryBytes=0;const resources=new Set();
 c.group.traverse(o=>{if(!o.isMesh)return;meshes++;const n=o.isInstancedMesh?o.count:1;instances+=o.isInstancedMesh?n:0;if(/dense-.*cards|harvested-stubble/.test(o.name))cerealInstances+=n;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3*n;for(const a of [...Object.values(o.geometry.attributes),o.geometry.index,o.instanceMatrix,o.instanceColor].filter(Boolean)){if(!resources.has(a)){resources.add(a);geometryBytes+=a.array.byteLength;}}});
 const detailStart=performance.now();if(level===0)c.detailPatches=D.prepareWheatDetail(f,'balanced');
 results.push({tile:f.key,level,generateMs:Math.round(detailStart-start),detailMs:Math.round(performance.now()-detailStart),detailStems:c.detailPatches?.count||0,detailBytes:c.detailPatches?.byteLength||0,stages,meshes,triangles,instances,cerealInstances,geometryBytes});console.error('finished',f.key);
}
const layer=D.createWheatDetailLayer(M.wind),start=performance.now();layer.update(chunks,new T.Vector3(.6,1.77,52),'balanced','0,0');let detailDraws=0,detailTriangles=0;layer.object.traverse(o=>{if(o.isMesh&&o.visible&&o.count){detailDraws++;detailTriangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3*o.count;}});
console.log(JSON.stringify({version:v,chunks:results,nearSpawn:{detailDraws,detailTriangles,updateMs:performance.now()-start,...layer.object.userData.wheat}},null,2));
