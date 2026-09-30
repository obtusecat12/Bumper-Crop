import {bindLeafShadowLOD,selectLeafLOD,setLeafLOD} from './static-leaf-lod.js?v=59';
import {bindStaticMeshLOD,selectMeshLOD,STATIC_LOD_NEAR} from './static-mesh-lod.js?v=59';
import * as T from './vendor/three.module.min.js';
import {selectStaticInstances} from './static-selection.js?v=59';
// Source geometry is already merged in the worker. Retain tile bounds instead
// of merging the entire resident world into uncullable, padded mega-meshes.
export function createSceneBatches(){
 const object=new T.Group(),sources=new Map(),renderMeshes=new Map(),stats={sourceDraws:0,draws:0,instances:0,matrixWrites:0,uploadBytes:0,selectionChanges:0,budgetTriangles:0,budgetExceeded:false};
 const frustum=new T.Frustum(),projection=new T.Matrix4(),sphere=new T.Sphere(),candidates=[],budgetRecords=new WeakMap();
 object.name='Frozen rural tile batches';let dirty=true,lastX=NaN,lastZ=NaN,lastOrigin='';
 const capture=()=>{};
 function register(chunk){const selected=[],meshes=[];chunk.group.traverse(m=>{
  if(!m.isMesh)return;stats.sourceDraws++;
  meshes.push(m);
  if(m.isInstancedMesh){m.instanceMatrix.setUsage(T.StaticDrawUsage);m.instanceColor?.setUsage(T.StaticDrawUsage);}
  if(m.userData.leafLOD){bindLeafShadowLOD(m);selected.push(m);}else if(m.geometry.userData.staticLOD){bindStaticMeshLOD(m);selected.push(m);}else if(m.userData.staticSelection)selected.push(m);
 });sources.set(chunk,selected);renderMeshes.set(chunk,meshes);dirty=true;}
 function remove(chunk){sources.delete(chunk);renderMeshes.delete(chunk);dirty=true;}
 function refresh(chunk){remove(chunk);register(chunk);}
 function update(origin){if(origin!==lastOrigin){lastOrigin=origin;dirty=true;}}
 function updateView(camera){
  const x=Math.floor(camera.position.x/4),z=Math.floor(camera.position.z/4);
  if(!dirty&&x===lastX&&z===lastZ)return;dirty=false;lastX=x;lastZ=z;
  let instances=0,draws=0;
  for(const [chunk,list]of sources){const px=camera.position.x-chunk.group.position.x,pz=camera.position.z-chunk.group.position.z;
   chunk.group.updateMatrixWorld(true);
   for(const m of list){
    if(m.userData.leafLOD){sphere.copy(m.boundingSphere).applyMatrix4(m.matrixWorld);selectLeafLOD(m,Math.hypot(camera.position.x-sphere.center.x,camera.position.z-sphere.center.z)-Math.min(12,sphere.radius));continue;}
    if(m.geometry.userData.staticLOD){
     sphere.copy(m.geometry.boundingSphere).applyMatrix4(m.matrixWorld);const distance=Math.hypot(camera.position.x-sphere.center.x,camera.position.z-sphere.center.z)-sphere.radius;
     selectMeshLOD(m,Math.max(0,distance));continue;
    }
    const n=selectStaticInstances(m,px,pz);instances+=n;if(n)draws++;
   }
  }
  Object.assign(stats,{instances,draws,selectionChanges:stats.selectionChanges+1});
 }
 // Budget work is per render batch, never per plant. Three also visits these
 // batches for submission. Read-only frustum tests; only immutable LOD ranges
 // may change. Reserve 15k triangles for sky, rain, water effects and post passes.
 function enforceBudget(camera,lights,extraRoot,limit=235000,shadowsUpdating=true){
  camera.updateMatrixWorld(true);frustum.setFromProjectionMatrix(projection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
  let total=0;candidates.length=0;
  function inspect(m){
   if(!m.visible||m.isInstancedMesh&&!m.count)return;for(let p=m.parent;p;p=p.parent)if(!p.visible)return;
   const g=m.geometry,leaf=m.userData.leafLOD,lod=g.userData.staticLOD;
   if(!g.boundingSphere)g.computeBoundingSphere();sphere.copy(m.boundingSphere||g.boundingSphere).applyMatrix4(m.matrixWorld);
   const main=!m.frustumCulled||frustum.intersectsSphere(sphere);let shadows=0;
   if(shadowsUpdating&&m.castShadow)for(const l of lights)if(!m.frustumCulled||l.shadow.getFrustum().intersectsSphere(sphere))shadows++;
   const unit=(g.index?.count||g.attributes.position.count)/3;
   const mainCount=leaf?unit*m.count:Math.min(g.drawRange.count,g.index?.count||g.attributes.position.count)/3*(m.isInstancedMesh?m.count:g.isInstancedBufferGeometry?g.instanceCount:1);
   const shadowCount=leaf?unit*leaf.ranges[Math.max(1,leaf.level)].count:lod?lod.at(-1).count/3:mainCount;
   total+=(main?mainCount:0)+shadows*shadowCount;
   if((leaf||lod)&&(main||shadows)){
    let record=budgetRecords.get(m);if(!record){record={m,main:false,shadows:0,unit:0,distance:0};budgetRecords.set(m,record);}
    record.main=main;record.shadows=shadows;record.unit=unit;record.distance=Math.max(0,Math.hypot(sphere.center.x-camera.position.x,sphere.center.z-camera.position.z)-sphere.radius);candidates.push(record);
   }
  }
  for(const meshes of renderMeshes.values())for(const m of meshes)inspect(m);
  if(extraRoot)for(const root of Array.isArray(extraRoot)?extraRoot:[extraRoot])root.traverse(m=>{if(m.isMesh)inspect(m);});
  if(total>limit){
   candidates.sort((a,b)=>b.distance-a.distance);
   for(const c of candidates){if(total<=limit)break;const {m,main,shadows,unit}=c,leaf=m.userData.leafLOD,g=m.geometry;
    if(leaf&&leaf.level<2){const before=(main?m.count:0)+shadows*leaf.ranges[Math.max(1,leaf.level)].count;setLeafLOD(m,2);const after=(main?m.count:0)+shadows*m.count;total-=(before-after)*unit;}
    else if(main&&g.userData.staticLOD&&c.distance>=STATIC_LOD_NEAR){const range=g.userData.staticLOD[c.distance>95?3:1];if(range.count<g.drawRange.count){total-=(g.drawRange.count-range.count)/3;g.setDrawRange(range.start,range.count);}}
   }
  }
  stats.budgetTriangles=total;stats.budgetExceeded=total>limit;return total;
 }
 return {object,stats,capture,register,remove,refresh,update,updateView,enforceBudget,dispose(){sources.clear();renderMeshes.clear();object.clear();}};
}
