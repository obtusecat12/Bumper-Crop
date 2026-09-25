import * as T from './vendor/three.module.min.js';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
import {makeFoliageInstances} from './foliage-instances.js?v=38';
// Only affected pools rebuild when a tile arrives. World rebasing translates the
// shared parent; it never repacks tens of thousands of immutable instances.
export function createSceneBatches({onMesh,onRemove}={}){
 const object=new T.Group(),sources=new Map(),pools=new Map(),bases=new WeakMap(),dirty=new Set(),matrix=new T.Matrix4(),instance=new T.Matrix4(),color=new T.Color();
 object.name='resident rural render batches';const stats={sourceDraws:0,draws:0,instances:0};let anchor,lastOrigin;const frustum=new T.Frustum(),projection=new T.Matrix4(),sphere=new T.Sphere();
 function capture(root){root.traverse(o=>{const m=o.material;if(!m||Array.isArray(m)||bases.has(m))return;const b=m.clone();b.onBeforeCompile=m.onBeforeCompile;const key=m.customProgramCacheKey();b.customProgramCacheKey=()=>key;bases.set(m,b);});}
 function register(chunk){
  capture(chunk.group);const list=[];chunk.group.traverse(m=>{
   if((!m.isMesh&&!m.isLineSegments)||Array.isArray(m.material)||(m.material.transparent&&!m.name.startsWith('pickup-bottle-'))||m.userData.dynamicDoor||m.material.isShaderMaterial)return;
   for(let p=m;p&&p!==chunk.group;p=p.parent)if(p.userData.dynamicDoor)return;
   if(['dense-wheat-cards','dense-barley-cards','harvested-stubble-and-straw'].includes(m.name))return;
   const instanced=m.isInstancedMesh&&!Object.values(m.geometry.attributes).some(a=>a.isInstancedBufferAttribute),wood=m.name==='Merged trunks, limbs and shrub stems',line=m.isLineSegments,foliage=instanced&&m.geometry.hasAttribute('natureFlex');
   if(!instanced&&!wood&&!line&&!m.material.userData.architectureBatch)return;
   const count=m.geometry.index?.count||m.geometry.attributes.position.count;
   const key=(foliage?'f:'+Math.ceil(count/144):instanced?'i:'+m.geometry.uuid:line?'l:'+m.material.color.getHex():'s:')+':'+(line?'line':m.material.uuid)+':'+m.castShadow;
   list.push({m,instanced,wood,line,foliage,key,wasVisible:m.visible});m.visible=false;dirty.add(key);
  });sources.set(chunk,list);
 }
 function refresh(chunk){const old=sources.get(chunk)||[];for(const r of old)r.m.visible=r.wasVisible;remove(chunk);register(chunk);}
 function remove(chunk){for(const r of sources.get(chunk)||[])dirty.add(r.key);sources.delete(chunk);}
 function discard(m){if(!m)return;onRemove?.(m);object.remove(m);if(m.isInstancedMesh)m.dispose();if(m.userData.disposeBatch)m.userData.disposeBatch();else if(!m.isInstancedMesh)m.geometry.dispose();}
 function update(originKey){
  const origin=originKey.split(',').map(BigInt);anchor||=origin;object.position.set(Number(anchor[0]-origin[0])*64,0,Number(anchor[1]-origin[1])*64);object.updateMatrix();
  if(lastOrigin!==originKey){for(const chunk of sources.keys())chunk.group.updateMatrixWorld(true);lastOrigin=originKey;}
  if(!dirty.size)return;
  const groups=new Map();let sourceDraws=0,instances=0;
  for(const [chunk,list]of sources){chunk.group.updateMatrixWorld(true);for(const r of list){if(!r.wasVisible)continue;sourceDraws++;if(r.instanced)instances+=r.m.count;if(!dirty.has(r.key))continue;if(!groups.has(r.key))groups.set(r.key,[]);groups.get(r.key).push(r);}}
  for(const key of dirty){discard(pools.get(key));pools.delete(key);const items=groups.get(key);if(!items?.length)continue;const source=items[0].m;let mesh;
   if(items[0].foliage)mesh=makeFoliageInstances(items,bases.get(source.material),object.position);
   else if(items[0].instanced){
    const count=items.reduce((n,{m})=>n+m.count,0);if(!count)continue;mesh=new T.InstancedMesh(source.geometry,source.material,count);let at=0;
    for(const {m}of items)for(let i=0;i<m.count;i++){m.getMatrixAt(i,instance);matrix.multiplyMatrices(m.matrixWorld,instance);matrix.elements[12]-=object.position.x;matrix.elements[14]-=object.position.z;mesh.setMatrixAt(at,matrix);if(m.instanceColor)m.getColorAt(i,color);else color.setRGB(1,1,1);mesh.setColorAt(at,color);at++;}
    mesh.computeBoundingSphere();mesh.boundingSphere.radius+=.5;mesh.customDepthMaterial=source.customDepthMaterial;
   }else{
    const parts=items.map(({m,wood})=>{const g=m.geometry.clone();if(wood)g.setAttribute('ruralLocal',g.attributes.position.clone());matrix.copy(m.matrixWorld);matrix.elements[12]-=object.position.x;matrix.elements[14]-=object.position.z;g.applyMatrix4(matrix);return g;});
    const geo=mergeGeometries(parts,false);for(const g of parts)g.dispose();if(!geo)throw Error('Incompatible resident batch');geo.computeBoundingSphere();const material=source.material;
    if(items[0].wood&&!material.userData.batchLocal){const previous=material.onBeforeCompile,key=material.customProgramCacheKey();material.onBeforeCompile=function(s,r){previous.call(this,s,r);s.vertexShader='attribute vec3 ruralLocal;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('vRuralLocal=position;','vRuralLocal=ruralLocal;');};material.customProgramCacheKey=()=>key+'|preserved-local-bark';material.userData.batchLocal=true;material.needsUpdate=true;}
    mesh=items[0].line?new T.LineSegments(geo,material):new T.Mesh(geo,material);
   }
   mesh.name='Batched '+source.name;mesh.castShadow=source.castShadow;mesh.receiveShadow=source.receiveShadow;mesh.renderOrder=source.renderOrder;mesh.matrixAutoUpdate=false;mesh.updateMatrix();
   if(mesh.isInstancedMesh){
    let offset=0;const slices=items.map(({m})=>{const a={source:m,start:offset,count:m.count};offset+=m.count;return a;});
    const attributes=[mesh.instanceMatrix,mesh.instanceColor,...Object.values(mesh.geometry.attributes).filter(a=>a.isInstancedBufferAttribute)].filter(Boolean).map(attribute=>{attribute.setUsage(T.DynamicDrawUsage);return {attribute,original:attribute.array.slice()};});
    const state=mesh.userData.drawSlices={slices,attributes,total:mesh.count,visible:mesh.count,signature:null};
    // Keep off-screen occluders: visible instances form a prefix, all remaining
    // instances follow it. Shadows use the whole buffer without re-uploading it.
    mesh.onBeforeShadow=()=>{mesh.count=state.total;};mesh.onAfterShadow=()=>{mesh.count=state.visible;};
   }
   object.add(mesh);pools.set(key,mesh);onMesh?.(mesh);
  }
  dirty.clear();Object.assign(stats,{sourceDraws,draws:pools.size,instances});object.userData.batchStats={...stats};
 }
 function updateView(camera){
  camera.updateMatrixWorld(true);frustum.setFromProjectionMatrix(projection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
  for(const m of pools.values()){
   const d=m.userData.drawSlices;if(!d)continue;
   const visible=[],hidden=[];for(const s of d.slices){const source=s.source;if(!source.boundingSphere)source.computeBoundingSphere();sphere.copy(source.boundingSphere).applyMatrix4(source.matrixWorld);sphere.radius+=.5;(frustum.intersectsSphere(sphere)?visible:hidden).push(s);}
   const signature=visible.map(s=>s.start).join(',');if(signature===d.signature)continue;d.signature=signature;
   d.visible=visible.reduce((n,s)=>n+s.count,0);const ordered=m.castShadow?[...visible,...hidden]:visible;let at=0;
   for(const s of ordered){for(const {attribute:a,original}of d.attributes)a.array.set(original.subarray(s.start*a.itemSize,(s.start+s.count)*a.itemSize),at*a.itemSize);at+=s.count;}
   m.count=d.visible;m.visible=m.castShadow||d.visible>0;for(const {attribute:a}of d.attributes){a.clearUpdateRanges();if(at)a.addUpdateRange(0,at*a.itemSize);a.needsUpdate=true;}
  }
 }
 return {object,stats,capture,register,remove,refresh,update,updateView,dispose(){for(const m of pools.values())discard(m);pools.clear();sources.clear();}};
}
