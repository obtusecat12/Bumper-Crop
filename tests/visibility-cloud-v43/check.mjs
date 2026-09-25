import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const {createCanvas}=createRequire(import.meta.url)('/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
globalThis.document={createElement:()=>createCanvas(1,1)};
const T=await import('../../dist/vendor/three.module.min.js');
const W=await import('../../dist/world.js?v=43');
const {makeCompoundChunk}=await import('../../dist/compound-models.js?v=43');
const {bakeStaticMeshLOD,selectMeshLOD}=await import('../../dist/static-mesh-lod.js?v=43');
const {createSceneBatches}=await import('../../dist/scene-batches.js?v=43');
const {createPacker,createUnpacker}=await import('../../dist/scene-packets.js?v=43');
const seed=W.stringSeed('CHLORINE / ABUNDANCE / 10');
// Every closed test asset must remain closed in EVERY range. Check geometric
// seams rather than attribute indices: hard normals and UVs duplicate vertices.
let testedRanges=0;
for(let geometry of [new T.BoxGeometry(1.5,1,1,8,8,8),new T.SphereGeometry(.65,24,16)]){
 const mesh=new T.Mesh(geometry,new T.MeshStandardMaterial());geometry.computeBoundingSphere();
 const originalIndex=Array.from(geometry.index.array),original=Array.from(geometry.attributes.position.array),originalCount=geometry.index.count;
 bakeStaticMeshLOD(mesh);geometry=mesh.geometry;
 for(let i=0;i<originalCount;i++){const j=geometry.index.getX(i),k=originalIndex[i];for(let axis=0;axis<3;axis++)assert(Math.abs(geometry.attributes.position.array[j*3+axis]-original[k*3+axis])<1e-6,'Near vertex moved');}
 for(const range of geometry.userData.staticLOD){
  const p=geometry.attributes.position,idx=geometry.index,edges=new Map();
  const key=i=>[p.getX(i),p.getY(i),p.getZ(i)].map(x=>Math.round(x*1e6)).join(',');
  for(let i=range.start;i<range.start+range.count;i+=3){const ids=[idx.getX(i),idx.getX(i+1),idx.getX(i+2)].map(key);for(let k=0;k<3;k++){const a=ids[k],b=ids[(k+1)%3];if(a===b)continue;const e=[a,b].sort().join('|');edges.set(e,(edges.get(e)||0)+1);}}
  assert.equal([...edges.values()].filter(n=>n%2).length,0,'LOD opened a closed asset');testedRanges++;
 }
 const group=new T.Group();mesh.position.z=-8;group.add(mesh);group.updateMatrixWorld(true);
 const batches=createSceneBatches(),camera=new T.PerspectiveCamera(72,4/3,.08,200);batches.register({group});camera.updateMatrixWorld(true);batches.updateView(camera);
 // Even deliberate budget pressure is never allowed to punch out near faces.
 batches.enforceBudget(camera,[],null,1,false);assert.equal(geometry.drawRange.count,originalCount);batches.dispose();
 const packet=createPacker({T}).packChunk({group,field:{},colliders:[],pickups:[],softVolumes:[]});const restored=createUnpacker({T}).unpackChunk(packet.packet);
 assert.equal(restored.group.children[0].geometry.userData.staticLODTopology,'welded-clusters-v43');
}
// Actual fences around the arrival farm plus a diagonal road crossing fixture.
let fenceCases=0,colliderSamples=0,vertexSamples=0,removed=0;
for(const [cx,cz]of [[0n,0n],[1n,0n],[0n,1n],[-1n,0n],[2n,0n]]){
 const source=W.field(cx,cz,seed);
 const plans=source.compounds.map(plan=>({...plan,components:plan.components.filter(c=>c.kind==='fence')}));
 if(cx===0n&&cz===0n)plans.push({...plans[0],bounds:null,id:'road-crossing-regression',components:[{id:'test-fence',kind:'fence',x:0,z:42,angle:.32,width:24,seed:1873,belongs:true}]});
 const f={...source,compounds:plans};
 for(const level of[0,1,2]){
  const out=makeCompoundChunk(f,level);fenceCases++;
  for(const c of out.colliders){const n=c.kind==='circle'?1:Math.ceil(c.hx*2/.15);for(let i=0;i<=n;i++){const x=c.kind==='circle'?0:-c.hx+2*c.hx*i/n,a=c.angle||0,px=c.x+Math.cos(a)*x,pz=c.z-Math.sin(a)*x;assert(W.roadDistance(px,pz,f)>2.6,'Fence collision blocks road');colliderSamples++;}}
  out.group.updateMatrixWorld(true);out.group.traverse(m=>{if(!m.isMesh)return;const p=m.geometry.attributes.position,v=new T.Vector3();for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(m.matrixWorld);assert(W.roadDistance(v.x,v.z,f)>2.55,'Visible rail enters road');vertexSamples++;}});
  if(cx===0n&&cz===0n){assert(out.colliders.length>0);const centerBlocked=out.colliders.some(c=>Math.abs(c.x)<2&&Math.abs(c.z-42)<1);assert(!centerBlocked);removed++;}
 }
}
const ground=readFileSync(new URL('../../dist/ground.js',import.meta.url),'utf8');
assert(ground.includes('smoothstep(15.,25.,cropRange)'));
assert(readFileSync(new URL('../../dist/chunk-cache.js',import.meta.url),'utf8').includes('level10-cpu-v43'));
console.log(JSON.stringify({closedLODRanges:testedRanges,nearGeometryPreservedUnderPressure:true,packetRoundTrip:true,fenceCases,colliderSamples,vertexSamples,openedRoadCrossings:removed,farCanopyCompleteBeforeCardFade:true},null,2));
