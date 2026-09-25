import {plantTexture,plantAlpha} from './plant-texture.js?v=43';
import * as T from './vendor/three.module.min.js';
import {wheatCandidates,random,stringSeed} from './world.js?v=43';
import {CEREAL_RADIUS,CEREAL_LIMIT,CEREAL_PADDING,floorDiv} from './cereal-layout.js?v=43';
import {bindStaticSelection,selectStaticInstances} from './static-selection.js?v=43';
export const WHEAT_GEOMETRY_RADIUS=CEREAL_RADIUS;
const shared=new Set();let atlas,loading,geometry;
function stubbleImage(){
 const c=document.createElement('canvas');c.width=256;c.height=512;const ctx=c.getContext('2d'),r=random(0x572bb3);
 for(let i=0;i<24;i++){
  const x=4+r()*248,top=115+r()*245,lean=(r()-.5)*22;
  ctx.strokeStyle='#705a3c';ctx.lineWidth=2+r()*1.5;ctx.beginPath();ctx.moveTo(x,512);ctx.lineTo(x+lean,top);ctx.stroke();
  ctx.strokeStyle='#bba172';ctx.lineWidth=.9;ctx.beginPath();ctx.moveTo(x-.7,510);ctx.lineTo(x+lean-.7,top);ctx.stroke();
  ctx.fillStyle='#d8bf8a';ctx.fillRect(x+lean-1,top,2,2);
  ctx.strokeStyle='#a18a5d';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(x,508);ctx.lineTo(x+(r()-.5)*90,465+r()*40);ctx.stroke();
 }return new Uint8Array(ctx.getImageData(0,0,256,512).data);
}
async function decode(url){
 const response=await fetch(url);if(!response.ok)throw Error('Cereal texture: '+response.status);
 const bitmap=await createImageBitmap(await response.blob()),c=document.createElement('canvas');c.width=c.height=1024;
 const ctx=c.getContext('2d');ctx.drawImage(bitmap,0,0,1024,1024);bitmap.close();return new Uint8Array(ctx.getImageData(0,0,1024,1024).data);
}
export function initializeCerealTextures(decodeImage=decode){
 if(!loading)loading=Promise.all(['wheat-cutout-v39','barley-cutout-v39','wheat-atlas-v40','barley-atlas-v40'].map(name=>decodeImage(new URL(`./textures/${name}.png`,import.meta.url)))).then(images=>{
  const data=new Uint8Array(1024*3072*4),straw=stubbleImage();
  for(let y=0;y<1024;y++)for(let k=0;k<2;k++){
   const row=(1023-y)*4096,target=((2-k)*1024+y)*4096;
   for(let x=0;x<256;x++){const from=row+x*16;data.set(images[k].subarray(from,from+4),target+x*4);}
   for(let slot=1;slot<4;slot++){const form=[0,0,2,1][slot],from=row+form*1024;data.set(images[k+2].subarray(from,from+1024),target+slot*1024);}
  }
  for(let y=0;y<1024;y++)for(let k=0;k<4;k++)data.set(straw.subarray((511-Math.floor(y/2))*1024,(512-Math.floor(y/2))*1024),(y*1024+k*256)*4);
  atlas=plantTexture(data,1024,3072,{columns:4,rows:3,name:'Dense V39 wheat/barley tufts with V40 ear accents / short cut straw'});shared.add(atlas);
 }).catch(e=>{loading=null;throw e;});return loading;
}
export function crossedCerealGeometry(){
 if(geometry)return geometry;
 const p=[],uv=[],n=[];for(let plane=0;plane<2;plane++){
  const dx=plane?0:.5,dz=plane?.5:0;
  for(const [side,y,u,v]of [[-1,0,0,0],[1,0,1,0],[1,1,1,1],[-1,1,0,1]]){
   p.push(dx*side,y,dz*side);uv.push(u,v);
   const normal=new T.Vector3(side*dx*1.64,.574,side*dz*1.64).normalize();n.push(...normal.toArray());
  }
 }
 geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(p,3));geometry.setAttribute('normal',new T.Float32BufferAttribute(n,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.setIndex([0,1,2,0,2,3,4,5,6,4,6,7]);geometry.computeBoundingSphere();shared.add(geometry);return geometry;
}
function cerealMaterial(wind){
 const m=new T.MeshStandardMaterial({name:'Photographic crossed cereals',map:atlas,alphaTest:.16,alphaToCoverage:true,side:T.DoubleSide,roughness:1});
 m.onBeforeCompile=s=>{
  s.uniforms.uCerealTime=wind.time;s.uniforms.uCerealWind=wind.strength;
  s.vertexShader='uniform float uCerealTime,uCerealWind;varying float vCerealHeight;flat varying float vCerealKind;varying vec3 vCerealWorld;\n'+s.vertexShader;
  s.vertexShader=s.vertexShader.replace('#include <beginnormal_vertex>','#include <beginnormal_vertex>\nobjectNormal*=vec3(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz),length(instanceMatrix[2].xyz));');
  s.vertexShader=s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   vCerealHeight=uv.y;vCerealKind=frozenExtra;vCerealWorld=(modelMatrix*instanceMatrix*vec4(0.,0.,0.,1.)).xyz;
   float phase=instanceMatrix[3].x*.71+instanceMatrix[3].z*.53;
   transformed.x+=sin(uCerealTime*1.42+phase)*.055*min(uCerealWind,1.5)*uv.y*uv.y;
   transformed.z+=sin(uCerealTime*.97+phase*.73)*.025*min(uCerealWind,1.5)*uv.y*uv.y;`);
  s.fragmentShader='varying float vCerealHeight;flat varying float vCerealKind;varying vec3 vCerealWorld;\n'+s.fragmentShader;
  s.fragmentShader=s.fragmentShader.replace('#include <alphatest_fragment>',plantAlpha);
  s.fragmentShader=s.fragmentShader.replace('#include <lights_physical_fragment>','#include <lights_physical_fragment>\nmaterial.specularColor=vec3(0.);material.specularF90=0.;');
  s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',`float cropType=floor(vCerealKind/8.),form=mod(floor(vCerealKind/2.),4.),mirror=mod(vCerealKind,2.);
   float leafU=mix(vMapUv.x,1.-vMapUv.x,mirror);
   vec2 cerealUV=vec2((clamp(leafU,.012,.988)+form)/4.,(clamp(vMapUv.y,.002,.998)+2.-cropType)/3.);
   diffuseColor*=texture2D(map,cerealUV);diffuseColor.a*=1.-smoothstep(25.,27.,length(vCerealWorld.xz-cameraPosition.xz));`);
  s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb*=mix(vec3(.32,.36,.25),vec3(1.),pow(clamp(vCerealHeight,0.,1.),1.4));');
  s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_begin>','#include <normal_fragment_begin>\n#ifdef DOUBLE_SIDED\nnormal*=faceDirection;\n#endif');
  s.fragmentShader=s.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
   #if NUM_DIR_LIGHTS > 0
    float backLight=pow(max(0.,dot(-normalize(directionalLights[0].direction),normalize(vViewPosition))),2.);
    float earLight=pow(clamp(vCerealHeight,0.,1.),2.)*backLight;
    totalEmissiveRadiance+=diffuseColor.rgb*vec3(1.0,.69,.27)*directionalLights[0].color*earLight*.16;
   #endif`);
 };m.customProgramCacheKey=()=> 'dense-varied-cereal-canopy-v41';return m;
}
export function createCerealMesh(cell,wind){
 const source=cerealMaterial(wind),mesh=new T.InstancedMesh(crossedCerealGeometry(),source,cell.matrices.length/16);
 mesh.instanceMatrix=new T.InstancedBufferAttribute(cell.matrices,16).setUsage(T.StaticDrawUsage);
 mesh.instanceColor=new T.InstancedBufferAttribute(cell.colors,3).setUsage(T.StaticDrawUsage);
 mesh.name='Frozen 40m cereal cell';mesh.receiveShadow=true;mesh.computeBoundingSphere();if(mesh.boundingSphere)mesh.boundingSphere.radius+=CEREAL_PADDING;
 bindStaticSelection(mesh,cell.baked);source.dispose();return mesh;
}
// Gameplay collision candidates are separate from render density and geometry.
export function buildDenseWheat(f,level){return {mesh:new T.Group(),candidates:level===0?wheatCandidates(f):[]};}
export function isSharedWheatResource(r){return shared.has(r);}
export function createWheatDetailLayer(wind,{onMesh,seed=stringSeed('CHLORINE / ABUNDANCE / 10'),workerFactory}={}){
 const object=new T.Group(),cells=new Map(),pending=new Map(),wanted=new Set();object.name='Static 40m cereal chunks';
 const stats=object.userData.wheat={geometryRadius:35,activeStems:0,triangles:0,draws:0,uploadBytes:0,matrixWrites:0,selectionChanges:0,pending:0};
 let id=0,originX=0n,originZ=0n,lastOrigin='',cellX=null,cellZ=null,observerX=null,observerZ=null,dirty=true,disposed=false;
 const worker=workerFactory?workerFactory():typeof Worker!=='undefined'?new Worker(new URL('./cereal-worker.js?v=43',import.meta.url),{type:'module'}):null;
 const discard=m=>{m.dispose();m.material.staticTextures?.forEach(t=>t.dispose());m.material.dispose();m.removeFromParent();};
 function accept(cell){if(disposed)return;const key=`${cell.cx},${cell.cz}`;pending.delete(key);
  const mesh=createCerealMesh(cell,wind);mesh.userData.cellX=cell.cx;mesh.userData.cellZ=cell.cz;mesh.matrixAutoUpdate=false;mesh.visible=false;
  cells.set(key,mesh);object.add(mesh);onMesh?.(mesh);dirty=true;stats.pending=pending.size;
  if(cells.size>25)for(const [k,m]of cells){if(!wanted.has(k)){discard(m);cells.delete(k);if(cells.size<=25)break;}}
 }
 if(worker)worker.onmessage=({data})=>{if(data.error){console.error('Cereal worker',data.error);for(const [k,v]of pending)if(v===data.id)pending.delete(k);stats.error=data.error;return;}accept(data.cell);};
 function update(chunks,player,quality,originKey){
  if(lastOrigin!==originKey){[originX,originZ]=originKey.split(',').map(BigInt);lastOrigin=originKey;dirty=true;}
  const ax=originX*64n+BigInt(Math.floor(player.x)),az=originZ*64n+BigInt(Math.floor(player.z)),cx=floorDiv(ax,40n),cz=floorDiv(az,40n),qx=floorDiv(ax,4n),qz=floorDiv(az,4n);
  if(cx!==cellX||cz!==cellZ){
   cellX=cx;cellZ=cz;for(const key of wanted){const m=cells.get(key);if(m)m.visible=false;}wanted.clear();
   for(let z=-1;z<=1;z++)for(let x=-1;x<=1;x++){
    const xx=cx+BigInt(x),zz=cz+BigInt(z),key=`${xx},${zz}`;wanted.add(key);
    if(!cells.has(key)&&!pending.has(key)&&worker){pending.set(key,++id);worker.postMessage({id,cx:xx,cz:zz,seed});}
   }dirty=true;stats.pending=pending.size;
  }
  if(!dirty&&qx===observerX&&qz===observerZ)return;
  observerX=qx;observerZ=qz;dirty=false;let count=0,draws=0;
  for(const key of wanted){const m=cells.get(key);if(!m)continue;
   const x=m.userData.cellX*40n,z=m.userData.cellZ*40n;
   m.position.set(Number(x-originX*64n),0,Number(z-originZ*64n));m.updateMatrix();
   const n=selectStaticInstances(m,Number(qx*4n-x)+2,Number(qz*4n-z)+2);count+=n;if(n)draws++;
  }
  // The dense tuft distribution stays below the 25k / 100k triangle ceiling.
  if(count>CEREAL_LIMIT)throw Error('Cereal geometry budget exceeded');
  // Budget/frustum checks run before Three's render traversal. Refresh only
  // on a cell selection/origin change, never rewrite an instance transform.
  object.updateMatrixWorld(true);
  object.count=count;Object.assign(stats,{activeStems:count,cards:count,triangles:count*4,draws,selectionChanges:stats.selectionChanges+1});
 }
 return {object,update,accept,cells,dispose(){disposed=true;worker?.terminate();for(const m of cells.values())discard(m);cells.clear();pending.clear();}};
}
