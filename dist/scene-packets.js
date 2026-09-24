import {packCardOrderUserData,unpackCardOrderUserData} from './instance-order.js?v=31';
// Scene packet codec for procedural Three.js chunks. No DOM or Worker globals.
// Supply the same Three.js revision on both sides. Pack before attachFog().
const VERSION=1;
const materialSkip=new Set(['id','uuid','version','type','_listeners','uniforms','vertexShader','fragmentShader','onBeforeCompile','customProgramCacheKey']);
const textureProps=['name','mapping','channel','wrapS','wrapT','wrapR','magFilter','minFilter','anisotropy','format','internalFormat','type','colorSpace','flipY','generateMipmaps','premultiplyAlpha','unpackAlignment','rotation','matrixAutoUpdate'];
const nodeProps=['name','visible','castShadow','receiveShadow','frustumCulled','renderOrder','matrixAutoUpdate','matrixWorldAutoUpdate'];
const uniformAliases={uPhotoTreeTime:'time',uPhotoTreeWind:'strength',uTime:'time',uNatureTime:'time',uLakeTime:'time',uWind:'strength',uNatureWind:'strength',uLakeWind:'strength',uPlayer:'player',uWheatView:'view'};
const plain=value=>typeof structuredClone==='function'?structuredClone(value):value;
function shaderLib(T,m){
 if(m.isShaderMaterial)return {vertexShader:m.vertexShader,fragmentShader:m.fragmentShader,uniforms:m.uniforms};
 const name=m.isMeshDepthMaterial?'depth':m.isMeshDistanceMaterial?'distanceRGBA':m.isMeshPhysicalMaterial?'physical':m.isMeshStandardMaterial?'standard':m.isMeshLambertMaterial?'lambert':m.isMeshPhongMaterial?'phong':m.isMeshLambertMaterial?'lambert':m.isMeshNormalMaterial?'normal':m.isPointsMaterial?'points':m.isLineDashedMaterial?'dashed':'basic';
 return T.ShaderLib[name];
}
function shaderHash(value){let n=2166136261;for(let i=0;i<value.length;i++)n=Math.imul(n^value.charCodeAt(i),16777619);return (n>>>0).toString(36)}
function vecRecord(v){
 if(v?.isColor)return {$type:'Color',value:[v.r,v.g,v.b]};
 for(const name of ['Vector2','Vector3','Vector4','Matrix3','Matrix4','Quaternion'])if(v?.['is'+name])return {$type:name,value:v.toArray()};
 if(v?.isPlane)return {$type:'Plane',normal:v.normal.toArray(),constant:v.constant};
 return null;
}
function sphereRecord(s){return s?{center:s.center.toArray(),radius:s.radius}:null}
function boxRecord(b){return b?{min:b.min.toArray(),max:b.max.toArray()}:null}

export function createPacker({T,isSharedResource=()=>false,wind={},viewUniform}={}){
 if(!T)throw Error('createPacker requires T');
 const sharedIds=new WeakMap();let serial=0;
 function packChunk(chunk){
  const packet={version:VERSION,shared:{textures:[],geometries:[],materials:[]},owned:{textures:[],geometries:[],materials:[]},nodes:[],chunk:null};
  const transfer=[],buffers=new Set(),ownedIds=new WeakMap(),newShared=[],nodeIds=new Map();let ownedSerial=0;
  function typed(a,copy){
   const value=copy?a.slice():a;
   if(!(value.buffer instanceof ArrayBuffer))throw Error('SharedArrayBuffer is not supported by this transfer codec');
   if(!buffers.has(value.buffer)){buffers.add(value.buffer);transfer.push(value.buffer)}
   return value;
  }
  function resource(r,kind,forceShared=false){
   if(!r)return null;
   const shared=forceShared||isSharedResource(r),map=shared?sharedIds:ownedIds;
   if(map.has(r))return map.get(r);
   const id=shared?'s'+(++serial):'o'+(++ownedSerial);map.set(r,id);if(shared)newShared.push(r);
   const record=kind==='textures'?texture(r,shared):kind==='geometries'?geometry(r,shared):material(r,shared);
   record.id=id;packet[shared?'shared':'owned'][kind].push(record);return id;
  }
  function value(v,copy=false){
   if(v===undefined)return {$type:'Undefined'};
   if(v===null||typeof v!=='object')return v;
   // All image resources in this game's modules are fixed procedural templates.
   // Register them once, even for legacy materials outside isSharedResource().
   if(v.isTexture)return {$type:'Texture',id:resource(v,'textures',true)};
   const record=vecRecord(v);if(record)return record;
   if(ArrayBuffer.isView(v))return {$type:'TypedArray',value:typed(v,copy)};
   if(Array.isArray(v))return v.map(x=>value(x,copy));
   const out={};for(const[k,x]of Object.entries(v)){if(typeof x!=='function')out[k]=value(x,copy)}return out;
  }
  function attribute(a,copy){
   if(a.isInterleavedBufferAttribute)throw Error('Interleaved geometry must be deinterleaved before packing');
   return {array:typed(a.array,copy),itemSize:a.itemSize,normalized:a.normalized,usage:a.usage,gpuType:a.gpuType,name:a.name,instanced:!!a.isInstancedBufferAttribute,meshPerAttribute:a.meshPerAttribute};
  }
  function geometry(g,copy){
   const attributes={},morphAttributes={};for(const[k,a]of Object.entries(g.attributes))attributes[k]=attribute(a,copy);
   for(const[k,list]of Object.entries(g.morphAttributes))morphAttributes[k]=list.map(a=>attribute(a,copy));
   return {name:g.name,attributes,index:g.index?attribute(g.index,copy):null,morphAttributes,morphTargetsRelative:g.morphTargetsRelative,groups:plain(g.groups),drawRange:{...g.drawRange},boundingBox:boxRecord(g.boundingBox),boundingSphere:sphereRecord(g.boundingSphere),userData:plain(g.userData)};
  }
  function texture(t,copy){
   const image=t.image;let data,width=image?.width,height=image?.height,depth=image?.depth;
   if(ArrayBuffer.isView(image?.data))data=typed(image.data,true);
   else if(image?.getContext){const ctx=image.getContext('2d');if(!ctx?.getImageData)throw Error('Canvas texture requires readable Canvas2D');data=typed(new Uint8Array(ctx.getImageData(0,0,width,height).data),false)}
   else throw Error('Unsupported texture source: '+t.name);
   const props={};for(const key of textureProps)if(t[key]!==undefined)props[key]=t[key];
   for(const key of ['offset','repeat','center','matrix'])if(t[key])props[key]=value(t[key]);
   return {kind:t.isData3DTexture?'Data3DTexture':t.isDataArrayTexture?'DataArrayTexture':'DataTexture',width,height,depth,data,props,mipmaps:(t.mipmaps||[]).map(m=>({width:m.width,height:m.height,depth:m.depth,data:typed(m.data,true)})),userData:plain(t.userData)};
  }
  function binding(name,uniform){
   if(uniform===wind.time)return 'time';if(uniform===wind.strength)return 'strength';if(uniform===wind.player)return 'player';
   if(viewUniform&&uniform===viewUniform)return 'view';return uniformAliases[name]||null;
  }
  function material(m,copy){
   const props={};for(const[k,v]of Object.entries(m)){
    if(materialSkip.has(k)||k.startsWith('is')||typeof v==='function')continue;
    props[k]=value(v,copy);
   }
   const lib=shaderLib(T,m),shader={vertexShader:lib.vertexShader,fragmentShader:lib.fragmentShader,uniforms:T.UniformsUtils.clone(lib.uniforms)};
   const baseline=new Map(Object.entries(shader.uniforms).map(([k,u])=>[k,{ref:u,json:JSON.stringify(value(u.value,true))}]));
   m.onBeforeCompile(shader,null);
   const uniforms={};for(const[name,u]of Object.entries(shader.uniforms)){
    const ref=binding(name,u),old=baseline.get(name);
    if(ref)uniforms[name]={binding:ref,value:value(u.value,copy)};
    else if(m.isShaderMaterial||!old||old.ref!==u||old.json!==JSON.stringify(value(u.value,true)))uniforms[name]={value:value(u.value,copy)};
   }
   return {type:m.type,props,vertexShader:shader.vertexShader,fragmentShader:shader.fragmentShader,uniforms,cacheKey:m.customProgramCacheKey()+'|packet-v1:'+shaderHash(shader.vertexShader+shader.fragmentShader)};
  }
  function node(o){
   if(o.isSkinnedMesh||o.isBatchedMesh)throw Error('Skinned/BatchedMesh is outside the procedural chunk codec');
   const id=packet.nodes.length;nodeIds.set(o,id);const r={id,type:o.type,props:{},matrix:null,geometry:null,material:null,children:[],userData:packCardOrderUserData(o.userData,plain,buffer=>{if(!buffers.has(buffer)){buffers.add(buffer);transfer.push(buffer)}}),layers:o.layers.mask};packet.nodes.push(r);
   if(o.matrixAutoUpdate)o.updateMatrix();r.matrix=o.matrix.toArray();r.position=o.position.toArray();r.quaternion=o.quaternion.toArray();r.scale=o.scale.toArray();
   for(const key of nodeProps)r.props[key]=o[key];
   if(o.geometry)r.geometry=resource(o.geometry,'geometries');
   if(o.material)r.material=Array.isArray(o.material)?o.material.map(m=>resource(m,'materials')):resource(o.material,'materials');
   for(const key of ['customDepthMaterial','customDistanceMaterial'])if(o[key])r[key]=resource(o[key],'materials');
   if(o.isInstancedMesh){r.count=o.count;r.instanceMatrix=attribute(o.instanceMatrix,false);r.instanceColor=o.instanceColor?attribute(o.instanceColor,false):null;r.boundingBox=boxRecord(o.boundingBox);r.boundingSphere=sphereRecord(o.boundingSphere)}
   if(o.morphTargetInfluences)r.morphTargetInfluences=o.morphTargetInfluences.slice();
   if(o.morphTargetDictionary)r.morphTargetDictionary={...o.morphTargetDictionary};
   r.children=o.children.map(node);return id;
  }
  try{
   const root=node(chunk.group),metadata={};for(const[k,v]of Object.entries(chunk))if(k!=='group'&&k!=='pickups')metadata[k]=(k==='detailPatches'||k==='rayGeometry')?v:plain(v);
   packet.chunk={root,...metadata,pickups:(chunk.pickups||[]).map(p=>{const q={};for(const[k,v]of Object.entries(p))if(k!=='mesh')q[k]=plain(v);q.meshNode=p.mesh?nodeIds.get(p.mesh):null;if(p.mesh&&q.meshNode===undefined)throw Error('Pickup mesh is outside chunk hierarchy');return q})};
   for(const patch of chunk.detailPatches?.patches||[])for(const v of Object.values(patch))if(ArrayBuffer.isView(v)&&!buffers.has(v.buffer)){buffers.add(v.buffer);transfer.push(v.buffer)}
   if(chunk.rayGeometry){const g=chunk.rayGeometry;for(const a of [g.positions,g.colors,g.uvs,g.textureIds,g.thin,g.ground,...g.alphaTextures.map(t=>t.data)])if(!buffers.has(a.buffer)){buffers.add(a.buffer);transfer.push(a.buffer)}}
   return {packet,transfer};
  }catch(error){for(const r of newShared)sharedIds.delete(r);throw error}
 }
 return {packChunk};
}

export function createUnpacker({T,wind={},viewUniform,uniformBindings={}}={}){
 if(!T)throw Error('createUnpacker requires T');
 const shared=new Map(),chunkResources=new WeakMap();
 function decode(v,lookup){
  if(v===null||typeof v!=='object')return v;
  if(Array.isArray(v))return v.map(x=>decode(x,lookup));
  if(v.$type==='Undefined')return undefined;
  if(v.$type==='Texture')return lookup(v.id);
  if(v.$type==='TypedArray')return v.value;
  if(v.$type==='Color')return new T.Color().setRGB(...v.value);
  if(v.$type==='Plane')return new T.Plane(new T.Vector3().fromArray(v.normal),v.constant);
  if(v.$type&&T[v.$type])return new T[v.$type]().fromArray(v.value);
  const out={};for(const[k,x]of Object.entries(v))out[k]=decode(x,lookup);return out;
 }
 function attribute(r){const a=r.instanced?new T.InstancedBufferAttribute(r.array,r.itemSize,r.normalized,r.meshPerAttribute):new T.BufferAttribute(r.array,r.itemSize,r.normalized);a.name=r.name;a.setUsage(r.usage);if(r.gpuType!==undefined)a.gpuType=r.gpuType;return a}
 const sphere=r=>r?new T.Sphere(new T.Vector3().fromArray(r.center),r.radius):null;
 const box=r=>r?new T.Box3(new T.Vector3().fromArray(r.min),new T.Vector3().fromArray(r.max)):null;
 function makeGeometry(r){
  const g=new T.BufferGeometry();g.name=r.name;for(const[k,a]of Object.entries(r.attributes))g.setAttribute(k,attribute(a));if(r.index)g.setIndex(attribute(r.index));
  for(const[k,list]of Object.entries(r.morphAttributes||{}))g.morphAttributes[k]=list.map(attribute);g.morphTargetsRelative=r.morphTargetsRelative;
  g.groups=plain(r.groups);g.drawRange={...r.drawRange};g.boundingBox=box(r.boundingBox);g.boundingSphere=sphere(r.boundingSphere);g.userData=plain(r.userData);return g;
 }
 function makeTexture(r,lookup){
  const t=r.kind==='Data3DTexture'?new T.Data3DTexture(r.data,r.width,r.height,r.depth):r.kind==='DataArrayTexture'?new T.DataArrayTexture(r.data,r.width,r.height,r.depth):new T.DataTexture(r.data,r.width,r.height);
  for(const[k,v]of Object.entries(r.props))t[k]=decode(v,lookup);t.mipmaps=r.mipmaps||[];t.userData=plain(r.userData);t.needsUpdate=true;return t;
 }
 function makeMaterial(r,lookup){
  if(!T[r.type])throw Error('Unsupported material type '+r.type);const m=new T[r.type]();for(const[k,v]of Object.entries(r.props))m[k]=decode(v,lookup);
  const bindings={time:wind.time,strength:wind.strength,player:wind.player,view:viewUniform,...uniformBindings},uniforms={};
  for(const[k,u]of Object.entries(r.uniforms)){uniforms[k]=u.binding?(bindings[u.binding]||{value:decode(u.value,lookup)}):{value:decode(u.value,lookup)}}
  if(m.isShaderMaterial){m.vertexShader=r.vertexShader;m.fragmentShader=r.fragmentShader;m.uniforms=uniforms}
  m.onBeforeCompile=shader=>{shader.vertexShader=r.vertexShader;shader.fragmentShader=r.fragmentShader;Object.assign(shader.uniforms,uniforms)};
  m.customProgramCacheKey=()=>r.cacheKey;return m;
 }
 function load(records,target,lookup){
  for(const r of records.textures||[])if(!target.has(r.id))target.set(r.id,makeTexture(r,lookup));
  for(const r of records.geometries||[])if(!target.has(r.id))target.set(r.id,makeGeometry(r));
  for(const r of records.materials||[])if(!target.has(r.id))target.set(r.id,makeMaterial(r,lookup));
 }
 function acceptShared(packet){
  if(packet.version!==VERSION)throw Error('Scene packet version mismatch');
  load(packet.shared,shared,id=>{if(!shared.has(id))throw Error('Missing shared resource '+id);return shared.get(id)});
 }
 function unpackChunk(packet){
  acceptShared(packet);const owned=new Map(),lookup=id=>{const r=id.startsWith('s')?shared.get(id):owned.get(id);if(!r)throw Error('Missing packet resource '+id);return r};
  load(packet.owned,owned,lookup);const nodes=[];
  for(const r of packet.nodes){
   const g=r.geometry?lookup(r.geometry):undefined,m=Array.isArray(r.material)?r.material.map(lookup):r.material?lookup(r.material):undefined;
   let o;if(r.instanceMatrix)o=new T.InstancedMesh(g,m,r.instanceMatrix.array.length/16);
   else if(r.type==='Mesh')o=new T.Mesh(g,m);else if(r.type==='LineSegments')o=new T.LineSegments(g,m);else if(r.type==='LineLoop')o=new T.LineLoop(g,m);else if(r.type==='Line')o=new T.Line(g,m);else if(r.type==='Points')o=new T.Points(g,m);else if(r.type==='Group')o=new T.Group();else if(r.type==='Object3D')o=new T.Object3D();else throw Error('Unsupported object type '+r.type);
   for(const key of ['customDepthMaterial','customDistanceMaterial'])if(r[key])o[key]=lookup(r[key]);
   Object.assign(o,r.props);o.matrix.fromArray(r.matrix);o.position.fromArray(r.position);o.quaternion.fromArray(r.quaternion);o.scale.fromArray(r.scale);o.matrixWorldNeedsUpdate=true;o.layers.mask=r.layers;o.userData=unpackCardOrderUserData(r.userData,plain);
   if(r.instanceMatrix){o.instanceMatrix=attribute(r.instanceMatrix);o.instanceColor=r.instanceColor?attribute(r.instanceColor):null;o.count=r.count;o.boundingBox=box(r.boundingBox);o.boundingSphere=sphere(r.boundingSphere)}
   if(r.morphTargetInfluences)o.morphTargetInfluences=r.morphTargetInfluences.slice();if(r.morphTargetDictionary)o.morphTargetDictionary={...r.morphTargetDictionary};nodes[r.id]=o;
  }
  for(const r of packet.nodes)for(const child of r.children)nodes[r.id].add(nodes[child]);
  const {root,pickups,...metadata}=packet.chunk,chunk={...metadata,group:nodes[root],pickups:pickups.map(p=>{const {meshNode,...rest}=p;return meshNode===null?rest:{...rest,mesh:nodes[meshNode]}})};
  chunkResources.set(chunk,{owned,instances:nodes.filter(o=>o.isInstancedMesh)});return chunk;
 }
 function dispose(chunk){const record=chunkResources.get(chunk);if(!record)return;for(const mesh of record.instances)mesh.dispose();for(const r of record.owned.values())r.dispose?.();chunkResources.delete(chunk)}
 function disposeShared(){for(const r of shared.values())r.dispose?.();shared.clear()}
 return {unpackChunk,acceptShared,dispose,disposeChunk:dispose,disposeShared,get sharedResourceCount(){return shared.size}};
}
