import * as T from './vendor/three.module.min.js';
// Conservative whole-surface test. No per-vertex/plant loop, no allocations in
// the frame loop. Parent visibility and origin-rebased world matrices count.
export function createWaterVisibility(){
 const frustum=new T.Frustum(),matrix=new T.Matrix4(),sphere=new T.Sphere();
 function any(meshes,camera){
  camera.updateMatrixWorld(true);frustum.setFromProjectionMatrix(matrix.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
  for(const m of meshes){
   let visible=true;for(let p=m;p;p=p.parent){if(!p.visible){visible=false;break;}}
   if(!visible)continue;if(m.frustumCulled===false)return true;
   m.updateWorldMatrix(true,false);const g=m.geometry;if(!g.boundingSphere)g.computeBoundingSphere();
   if(!g.boundingSphere)return true;sphere.copy(g.boundingSphere).applyMatrix4(m.matrixWorld);sphere.radius+=.5;
   if(frustum.intersectsSphere(sphere))return true;
  }
  return false;
 }
 return {any};
}
