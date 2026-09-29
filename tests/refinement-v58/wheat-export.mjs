import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{createCanvas,loadImage}=require('/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
globalThis.document={createElement:()=>createCanvas(1,1)};
const ROOT=process.argv[2]||'/tmp/v41-native',SITE=(process.argv[3]||new URL('../../dist',import.meta.url).pathname)+'/',B='file://'+SITE;
const version=fs.readFileSync(SITE+'world.js','utf8').match(/road-compounds\.js\?v=(\d+)/)[1];let P;
const T=await import(B+'vendor/three.module.min.js');
const {field,stringSeed,surfaceHeight,height,compoundPlanner,compoundAt}=await import(B+'world.js?v='+version);
const {makeGround,makeVerge}=await import(B+'ground.js?v='+version),{makeCompoundChunk}=await import(B+'compound-models.js?v='+version);
const {buildDenseWheat}=await import(B+'dense-wheat.js?v='+version),{makeNature}=await import(B+'nature.js?v='+version);
const {initializeRuralTextures}=await import(B+'rural-textures.js?v='+version);
await initializeRuralTextures(async url=>{const im=await loadImage(SITE+'textures/'+url.pathname.split('/').at(-1)),cn=createCanvas(512,512),cx=cn.getContext('2d');cx.drawImage(im,0,0,512,512);return {data:new Uint8Array(cx.getImageData(0,0,512,512).data),width:512,height:512};});
const {initializeLandmarkTextures}=await import(B+'landmark-textures.js?v='+version);
await initializeLandmarkTextures(async url=>{const im=await loadImage(url.pathname),cn=createCanvas(256,256),cx=cn.getContext('2d');cx.drawImage(im,0,0,256,256);return {data:new Uint8Array(cx.getImageData(0,0,256,256).data),width:256,height:256};});
const seed=stringSeed('CHLORINE / ABUNDANCE / 10');const wind={time:{value:1.25},player:{value:new T.Vector3(-1000,-1000,-1000)},strength:{value:.32}};
const includes=s=>s.replace(/#include <([^>]+)>/g,(_,k)=>includes(T.ShaderChunk[k]));
const defs='\n#define NUM_DIR_LIGHTS 1\n#define NUM_POINT_LIGHTS 0\n#define NUM_SPOT_LIGHTS 0\n#define NUM_RECT_AREA_LIGHTS 0\n#define NUM_HEMI_LIGHTS 0\n#define NUM_DIR_LIGHT_SHADOWS 0\n#define NUM_POINT_LIGHT_SHADOWS 0\n#define NUM_SPOT_LIGHT_SHADOWS 0\n#define NUM_SPOT_LIGHT_MAPS 0\n#define NUM_SPOT_LIGHT_COORDS 0\n#define NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS 0\n#define NUM_CLIPPING_PLANES 0\n#define UNION_CLIPPING_PLANES 0\n';
const vp='#version 300 es\nprecision highp float;precision highp int;\n#define attribute in\n#define varying out\nuniform mat4 modelMatrix,viewMatrix,modelViewMatrix,projectionMatrix;uniform mat3 normalMatrix;uniform vec3 cameraPosition;uniform bool isOrthographic;in vec3 position;in vec2 uv;in vec3 normal;\n';
const fp='#version 300 es\nprecision highp float;precision highp int;\n#define varying in\n#define texture2D texture\nout vec4 pc_fragColor;\n#define gl_FragColor pc_fragColor\nuniform vec3 cameraPosition;uniform mat4 viewMatrix;uniform bool isOrthographic;\nvec4 linearToOutputTexel(vec4 c){return c;}\n';
let meshes=[],shaders={},textures=[],textureIds=new Map(),materialIds=new Map();
function bytes(file,a){fs.writeFileSync(P+'/'+file,Buffer.from(a.buffer,a.byteOffset,a.byteLength));return file;}
function texture(t){if(textureIds.has(t))return textureIds.get(t);const id=textures.length;textureIds.set(t,id);let a=t.image.data;if(!ArrayBuffer.isView(a))a=t.image.getContext('2d').getImageData(0,0,t.image.width,t.image.height).data;const mipmaps=(t.mipmaps||[]).map((m,i)=>({file:bytes('tex-'+id+'-mip-'+i+'.bin',m.data),width:m.width,height:m.height,depth:m.depth||t.image.depth||0}));textures.push({id,file:bytes('tex-'+id+'.bin',a),type:t.type,format:t.format,depth:t.image.depth||0,width:t.image.width,height:t.image.height,name:t.name,wrapS:t.wrapS,wrapT:t.wrapT,magFilter:t.magFilter,minFilter:t.minFilter,flipY:t.flipY,srgb:t.colorSpace===T.SRGBColorSpace,mip:t.generateMipmaps,mipmaps});return id;}
function exportMesh(m){if(!m.isMesh||!m.visible||m.isInstancedMesh&&!m.count||m.frustumCulled&&!viewFrustum.intersectsObject(m))return;const mat=m.material,id=meshes.length;let key=materialIds.get(mat),shader;
 if(key===undefined){key='mat'+materialIds.size;materialIds.set(mat,key);let s=mat.isShaderMaterial?{vertexShader:mat.vertexShader,fragmentShader:mat.fragmentShader,uniforms:mat.uniforms}:{vertexShader:T.ShaderLib.standard.vertexShader,fragmentShader:T.ShaderLib.standard.fragmentShader,uniforms:T.UniformsUtils.clone(T.ShaderLib.standard.uniforms)};mat.onBeforeCompile(s,{});
 let d=defs+(m.isInstancedMesh?'#define USE_INSTANCING\n':'')+(m.instanceColor?'#define USE_INSTANCING_COLOR\n':'')+(mat.vertexColors?'#define USE_COLOR\n':'')+(mat.side===T.DoubleSide?'#define DOUBLE_SIDED\n':'')+(mat.map?'#define USE_MAP\n#define MAP_UV uv\n':'')+(mat.alphaTest?'#define USE_ALPHATEST\n':'');
 if(mat.alphaToCoverage)d+='#define ALPHA_TO_COVERAGE\n';
 for(const [k,v]of Object.entries(mat.defines||{}))d+='#define '+k+' '+v+'\n';
 const vin=(m.isInstancedMesh?'in mat4 instanceMatrix;\n':'')+(m.instanceColor?'in vec3 instanceColor;\n':'')+(mat.vertexColors?'in vec3 color;\n':'');
 const uniforms={};for(const [k,u]of Object.entries(s.uniforms)){const v=u.value;if(typeof v==='number'||typeof v==='boolean')uniforms[k]=v;else if(v?.toArray)uniforms[k]=v.toArray();else if(Array.isArray(v)&&v[0]?.toArray)uniforms[k]=v.map(x=>x.toArray());}
 uniforms.diffuse=mat.color?.toArray()||[1,1,1];uniforms.metalness=mat.metalness||0;uniforms.roughness=mat.roughness;uniforms.alphaTest=mat.alphaTest;uniforms.opacity=mat.opacity;if(mat.map)mat.map.updateMatrix();uniforms.mapTransform=mat.map?.matrix.toArray()||[1,0,0,0,1,0,0,0,1];
 shader=shaders[key]={vertex:vp+d+vin+includes(s.vertexShader),fragment:fp+d+(m.instanceColor&&!mat.vertexColors?'#define USE_COLOR\n':'')+includes(s.fragmentShader),uniforms,textures:{}};
 if(mat.map)shader.textures.map=texture(mat.map);for(const[k,u]of Object.entries(s.uniforms))if(u.value?.isTexture)shader.textures[k]=texture(u.value);
 }
 const attrs={};for(const[k,a]of Object.entries(m.geometry.attributes))attrs[k]={file:bytes('mesh-'+id+'-'+k+'.bin',new Float32Array(a.array)),size:a.itemSize,divisor:a.isInstancedBufferAttribute?1:0};
 if(m.instanceColor)attrs.instanceColor={file:bytes('mesh-'+id+'-instanceColor.bin',new Float32Array(m.instanceColor.array)),size:3,divisor:1};
 if(m.instanceMatrix)attrs.instanceMatrix={file:bytes('mesh-'+id+'-instanceMatrix.bin',new Float32Array(m.instanceMatrix.array)),size:16,divisor:1};
 const range=m.geometry.drawRange,ix=m.geometry.index?new Uint32Array(m.geometry.index.array.slice(range.start,range.start+range.count)):null;meshes.push({name:m.name,transparent:mat.transparent,depthWrite:mat.depthWrite,alphaToCoverage:mat.alphaToCoverage,material:mat.name,model:m.matrixWorld.elements,shaderKey:key,attrs,index:ix?bytes('mesh-'+id+'-index.bin',ix):null,count:ix?ix.length:m.geometry.attributes.position.count,instances:m.isInstancedMesh?m.count:0});
}



const D=await import(B+'dense-wheat.js?v='+version),V=await import(B+'verge-cards.js?v='+version),M=await import(B+'models.js?v='+version),L=await import(B+'cereal-layout.js?v='+version),S=await import(B+'scene-batches.js?v='+version);
async function decode(url,w,h){const im=await loadImage(url.pathname),cn=createCanvas(w,h),cx=cn.getContext('2d');cx.drawImage(im,0,0,w,h);return {data:new Uint8Array(cx.getImageData(0,0,w,h).data),width:w,height:h};}
await D.initializeCerealTextures(async url=>(await decode(url,1024,1024)).data);await V.initializeVergeTextures(url=>decode(url,1024,1024));
const group=new T.Group(),batch=S.createSceneBatches(),chunks=new Map();
const F=field(0n,0n,seed);group.add(makeGround(F,0));
const wheat=D.createWheatDetailLayer(M.wind,{workerFactory:()=>null});group.add(wheat.object);
for(let z=0;z<=2;z++)for(let x=-1;x<=1;x++)wheat.accept(L.generateCerealCell(BigInt(x),BigInt(z),seed));
const camera=new T.PerspectiveCamera(72,4/3,.08,228);camera.rotation.order='YXZ';const viewFrustum=new T.Frustum(),projection=new T.Matrix4();
const x=13,z=43,y=surfaceHeight(x,z,F)+1.77;
camera.position.set(x,y,z);camera.rotation.set(-.60,-.7,0);camera.updateMatrixWorld(true);
const hash=()=>[...wheat.cells.values()].map(m=>m.instanceMatrix.version).join(',');const initial=hash();
for(const state of ['before','pushed','recovery']){
 M.wind.strength.value=0;M.wind.time.value=5;wheat.interaction.clear();M.wind.player.value.set(10000,0,10000);
 if(state!=='before'){
  for(let i=0;i<=12;i++){M.wind.time.value=3.8+i*.1;M.wind.player.value.set(x+i*.01,y,z+2.64-i*.22);wheat.interaction.update('0,0');}
 }
 if(state==='recovery'){M.wind.player.value.set(10000,0,10000);M.wind.time.value=9;}
 wheat.update(chunks,camera.position,'balanced','0,0');group.updateMatrixWorld(true);viewFrustum.setFromProjectionMatrix(projection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
 const label='wheat-'+state;P=ROOT+'/'+label;fs.mkdirSync(P,{recursive:true});meshes=[];shaders={};textures=[];textureIds=new Map();materialIds=new Map();group.traverseVisible(exportMesh);
 const cameras=[{label,eye:camera.position.toArray(),projection:camera.projectionMatrix.elements.slice(),view:camera.matrixWorldInverse.elements.slice()}];
 fs.writeFileSync(P+'/fullscene-shaders.json',JSON.stringify(shaders));fs.writeFileSync(P+'/fullscene.json',JSON.stringify({meshes,textures,cameras}));console.log({label,draws:meshes.length,triangles:meshes.reduce((n,m)=>n+m.count*(m.instances||1)/3,0),matrixVersionsUnchanged:hash()===initial});
}
