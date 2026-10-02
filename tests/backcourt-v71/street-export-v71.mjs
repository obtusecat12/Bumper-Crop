import fs from 'node:fs';
import {createRequire} from 'node:module';
const {createCanvas,loadImage}=createRequire(import.meta.url)(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas');
globalThis.document={createElement:()=>createCanvas(1,1)};
const ROOT=process.argv[2],B=new URL('../../dist/',import.meta.url).href;let P,env;
const T=await import(B+'vendor/three.module.min.js');
async function decode(url,w,h){const im=await loadImage(url.pathname),c=createCanvas(w,h);c.getContext('2d').drawImage(im,0,0,w,h);return{data:new Uint8Array(c.getContext('2d').getImageData(0,0,w,h).data),width:w,height:h};}
const X=await import(B+'exit-textures.js?v=58'),R=await import(B+'reference-materials.js?v=58'),U=await import(B+'urban-materials.js?v=58'),E=await import(B+'reference-scenes.js?v=58');
const RT=await import(B+'rural-textures.js?v=58');const UA=await import(B+'urban-assets.js?v=58');await Promise.all([RT.initializeRuralTextures(url=>decode(url,512,512)),X.initializeExitTextures(decode),R.initializeReferenceTextures(decode),UA.initializeUrbanAssets(decode,async url=>JSON.parse(fs.readFileSync(url,'utf8')))]);
const D=await import(B+'clinic-district-materials.js?v=58');await D.initializeDistrictTextures(decode);
const Ads=await import(B+'advertising-assets.js?v=58');await Ads.initializeAdvertising(decode);
const V=await import(B+'vending-materials-v70.js');await V.initializeVendingTextures(decode);
const C=await import(B+'backcourt-materials-v71.js');await C.initializeCornerTextures(decode);
const A=await import(B+'exit-scene.js?v=71');const exit=A.createExitScene();const MF=await import(B+'material-finish.js');MF.createMaterialFinish().attach(exit.object);exit.setCity(true);
const BC=await import(B+'backcourt-scene-v70.js'),BL=await import(B+'backcourt-layout-v70.js');
const backcourt=exit.backcourt||BC.createBackcourt();if(!exit.backcourt)exit.object.add(backcourt.object);
let fogNear=210,fogFar=510;const viewFrustum=new T.Frustum();
const includes=s=>s.replace(/#include <([^>]+)>/g,(_,k)=>includes(T.ShaderChunk[k]));
const defs='\n#define USE_FOG\n#define NUM_DIR_LIGHTS 1\n#define NUM_POINT_LIGHTS 2\n#define NUM_SPOT_LIGHTS 0\n#define NUM_RECT_AREA_LIGHTS 0\n#define NUM_HEMI_LIGHTS 1\n#define NUM_DIR_LIGHT_SHADOWS 0\n#define NUM_POINT_LIGHT_SHADOWS 0\n#define NUM_SPOT_LIGHT_SHADOWS 0\n#define NUM_SPOT_LIGHT_MAPS 0\n#define NUM_SPOT_LIGHT_COORDS 0\n#define NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS 0\n#define NUM_CLIPPING_PLANES 0\n#define UNION_CLIPPING_PLANES 0\n';
const vp='#version 300 es\nprecision highp float;precision highp int;\n#define attribute in\n#define varying out\nuniform mat4 modelMatrix,viewMatrix,modelViewMatrix,projectionMatrix;uniform mat3 normalMatrix;uniform vec3 cameraPosition;uniform bool isOrthographic;in vec3 position;in vec2 uv;in vec3 normal;in vec2 uv1;\n';
const fp='#version 300 es\nprecision highp float;precision highp int;\n#define varying in\n#define texture2D texture\nout vec4 pc_fragColor;\n#define gl_FragColor pc_fragColor\nuniform vec3 cameraPosition;uniform mat4 viewMatrix;uniform bool isOrthographic;\nvec4 linearToOutputTexel(vec4 c){return c;}\n';
let diagnosticCamera;
let meshes=[],shaders={},textures=[],textureIds=new Map(),materialIds=new Map();
function bytes(file,a){fs.writeFileSync(P+'/'+file,Buffer.from(a.buffer,a.byteOffset,a.byteLength));return file;}
function texture(t){if(textureIds.has(t))return textureIds.get(t);const id=textures.length;textureIds.set(t,id);let a=t.image.data;if(!ArrayBuffer.isView(a))a=t.image.getContext('2d').getImageData(0,0,t.image.width,t.image.height).data;const mipmaps=(t.mipmaps||[]).map((m,i)=>({file:bytes('tex-'+id+'-mip-'+i+'.bin',m.data),width:m.width,height:m.height,depth:m.depth||t.image.depth||0}));textures.push({id,file:bytes('tex-'+id+'.bin',a),type:t.type,format:t.format,depth:t.image.depth||0,width:t.image.width,height:t.image.height,name:t.name,wrapS:t.wrapS,wrapT:t.wrapT,magFilter:t.magFilter,minFilter:t.minFilter,flipY:t.flipY,srgb:t.colorSpace===T.SRGBColorSpace,mip:t.generateMipmaps,mipmaps});return id;}
function exportMesh(m){if(Array.isArray(m.material)){for(const q of m.geometry.groups){const part=m.clone(false);part.material=m.material[q.materialIndex];part.geometry=m.geometry.clone();part.geometry.clearGroups();part.geometry.setDrawRange(q.start,q.count);part.matrixWorld.copy(m.matrixWorld);exportMesh(part);}return;}if(!m.isMesh||!m.visible||m.isInstancedMesh&&!m.count||m.frustumCulled&&!viewFrustum.intersectsObject(m))return;const mat=m.material,id=meshes.length;let key=materialIds.get(mat),shader;
 if(key===undefined){key='mat'+materialIds.size;materialIds.set(mat,key);let s=mat.isShaderMaterial?{vertexShader:mat.vertexShader,fragmentShader:mat.fragmentShader,uniforms:mat.uniforms}:{vertexShader:T.ShaderLib[mat.isMeshBasicMaterial?'basic':'standard'].vertexShader,fragmentShader:T.ShaderLib[mat.isMeshBasicMaterial?'basic':'standard'].fragmentShader,uniforms:T.UniformsUtils.clone(T.ShaderLib[mat.isMeshBasicMaterial?'basic':'standard'].uniforms)};mat.onBeforeCompile(s,{});
 let d=defs+(m.isInstancedMesh?'#define USE_INSTANCING\n':'')+(m.instanceColor?'#define USE_INSTANCING_COLOR\n':'')+(mat.vertexColors?'#define USE_COLOR\n':'')+(mat.side===T.DoubleSide?'#define DOUBLE_SIDED\n':'')+(mat.map?'#define USE_MAP\n#define MAP_UV uv\n':'')+(mat.alphaTest?'#define USE_ALPHATEST\n':'');
 if(mat.normalMap)d+='#define USE_NORMALMAP\n#define USE_NORMALMAP_TANGENTSPACE\n#define NORMALMAP_UV uv\n';
 if(mat.roughnessMap)d+='#define USE_ROUGHNESSMAP\n#define ROUGHNESSMAP_UV uv\n';
 if(mat.metalnessMap)d+='#define USE_METALNESSMAP\n#define METALNESSMAP_UV uv\n';
 if(mat.aoMap)d+='#define USE_AOMAP\n#define AOMAP_UV uv1\n';
 if(mat.bumpMap)d+='#define USE_BUMPMAP\n#define BUMPMAP_UV uv\n';
 if(mat.emissiveMap)d+='#define USE_EMISSIVEMAP\n#define EMISSIVEMAP_UV uv\n';
 if(mat.alphaToCoverage)d+='#define ALPHA_TO_COVERAGE\n';
 for(const [k,v]of Object.entries(mat.defines||{}))d+='#define '+k+' '+v+'\n';
 const vin=(m.isInstancedMesh?'in mat4 instanceMatrix;\n':'')+(m.instanceColor?'in vec3 instanceColor;\n':'')+(mat.vertexColors?'in vec3 color;\n':'');
 if(!mat.isMeshBasicMaterial){s.vertexShader='varying vec3 vPhotoPosition;\n'+s.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nvPhotoPosition=(modelMatrix*vec4(transformed,1.)).xyz;');s.fragmentShader=`varying vec3 vPhotoPosition;uniform highp sampler2D nativeShadow;uniform mat4 nativeShadowMatrix;float nativeVisibility(){vec4 p=nativeShadowMatrix*vec4(vPhotoPosition,1.);vec3 q=p.xyz/p.w*.5+.5;if(q.x<0.||q.x>1.||q.y<0.||q.y>1.||q.z<0.||q.z>1.)return 1.;float v=0.;for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++)v+=step(q.z-.0015,texture2D(nativeShadow,q.xy+vec2(float(x),float(y))/3072.).r);return v/9.;}\n`+s.fragmentShader;}
 const uniforms={};for(const [k,u]of Object.entries(s.uniforms)){const v=u.value;if(typeof v==='number'||typeof v==='boolean')uniforms[k]=v;else if(v?.toArray)uniforms[k]=v.toArray();else if(Array.isArray(v)&&v[0]?.toArray)uniforms[k]=v.map(x=>x.toArray());}
 for(let i=0;i<exit.residue.lights.length;i++){const l=exit.residue.lights[i];uniforms['pointLights['+i+'].position']=l.getWorldPosition(new T.Vector3()).applyMatrix4(diagnosticCamera.matrixWorldInverse).toArray();uniforms['pointLights['+i+'].color']=l.color.clone().multiplyScalar(l.intensity).toArray();uniforms['pointLights['+i+'].distance']=l.distance;uniforms['pointLights['+i+'].decay']=l.decay;}
 uniforms.fogColor=env.fog.toArray();uniforms.fogNear=fogNear;uniforms.fogFar=fogFar;uniforms.diffuse=mat.color?.toArray()||[1,1,1];uniforms.emissive=mat.emissive?.clone().multiplyScalar(mat.emissiveIntensity).toArray()||[0,0,0];uniforms.metalness=mat.metalness||0;uniforms.roughness=mat.roughness;uniforms.alphaTest=mat.alphaTest;uniforms.opacity=mat.opacity;if(mat.map)mat.map.updateMatrix();uniforms.mapTransform=mat.map?.matrix.toArray()||[1,0,0,0,1,0,0,0,1];uniforms.emissiveMapTransform=uniforms.mapTransform;uniforms.normalMapTransform=uniforms.mapTransform;uniforms.roughnessMapTransform=uniforms.mapTransform;uniforms.metalnessMapTransform=uniforms.mapTransform;uniforms.aoMapTransform=uniforms.mapTransform;uniforms.bumpMapTransform=uniforms.mapTransform;uniforms.normalScale=mat.normalScale?.toArray()||[1,1];uniforms.bumpScale=mat.bumpScale||0;uniforms.aoMapIntensity=mat.aoMapIntensity||1;
 shader=shaders[key]={vertex:vp+d+vin+includes(s.vertexShader),fragment:fp+d+(m.instanceColor&&!mat.vertexColors?'#define USE_COLOR\n':'')+includes(s.fragmentShader),uniforms,textures:{}};
 if(!mat.isMeshBasicMaterial)shader.fragment=shader.fragment.replace('getDirectionalLightInfo( directionalLight, directLight );','getDirectionalLightInfo( directionalLight, directLight ); directLight.color*=nativeVisibility();');
 if(mat.normalMap)shader.textures.normalMap=texture(mat.normalMap);if(mat.roughnessMap)shader.textures.roughnessMap=texture(mat.roughnessMap);if(mat.metalnessMap)shader.textures.metalnessMap=texture(mat.metalnessMap);if(mat.aoMap)shader.textures.aoMap=texture(mat.aoMap);if(mat.bumpMap)shader.textures.bumpMap=texture(mat.bumpMap);
 if(mat.map)shader.textures.map=texture(mat.map);if(mat.emissiveMap)shader.textures.emissiveMap=texture(mat.emissiveMap);for(const[k,u]of Object.entries(s.uniforms))if(u.value?.isTexture)shader.textures[k]=texture(u.value);
 }
 const attrs={};for(const[k,a]of Object.entries(m.geometry.attributes))attrs[k]={file:bytes('mesh-'+id+'-'+k+'.bin',new Float32Array(a.array)),size:a.itemSize,divisor:a.isInstancedBufferAttribute?1:0};
 if(m.instanceColor)attrs.instanceColor={file:bytes('mesh-'+id+'-instanceColor.bin',new Float32Array(m.instanceColor.array)),size:3,divisor:1};
 if(m.instanceMatrix)attrs.instanceMatrix={file:bytes('mesh-'+id+'-instanceMatrix.bin',new Float32Array(m.instanceMatrix.array)),size:16,divisor:1};
 const range=m.geometry.drawRange,ix=m.geometry.index?new Uint32Array(m.geometry.index.array.slice(range.start,range.start+range.count)):null;meshes.push({name:m.name,castShadow:m.castShadow,transparent:mat.transparent,polygonOffset:mat.polygonOffset,polygonOffsetFactor:mat.polygonOffsetFactor,polygonOffsetUnits:mat.polygonOffsetUnits,depthWrite:mat.depthWrite,alphaToCoverage:mat.alphaToCoverage,material:mat.name,model:m.matrixWorld.elements,shaderKey:key,attrs,index:ix?bytes('mesh-'+id+'-index.bin',ix):null,count:ix?ix.length:m.geometry.attributes.position.count,instances:m.isInstancedMesh?m.count:0});
}




const L=await import(B+'urban-layout.js?v=58');
const localView=(label,eye,look,fov=58,aspect=1.5)=>({label,...E.clinicToWorld(eye[0],eye[2]),look:{...E.clinicToWorld(look[0],look[2]),y:look[1]},eye:eye[1]-.28,fov,referenceAspect:aspect});
const snapshots=[
 {label:'backcourt-reference',...E.clinicToWorld(46.9,33.586),eye:2.232,fov:59.1,referenceAspect:1925/1173,yaw:E.CLINIC_ANGLE+.91847,pitch:-.04377},
 localView('corner-close',[35.3,1.6,24.5],[35.3,.99,18.7],60,1.7),
 localView('pda-close',[35.28,.57,20.55],[35.25,.327,20.30],55,1.35),
 localView('fountain-close',[30.5,1.3,20.3],[30.2,.72,19.1],50,1.35),
 localView('crt-close',[40.5,1.68,19.8],[40.2,1.58,18.56],46,1.35),
 localView('chair-close',[28.9,1.1,20.4],[28.6,.52,19.45],50,1.35),
].filter(s=>!process.env.VIEW||process.env.VIEW.split(',').includes(s.label));
for(const target of snapshots){
 const label=target.label;env=E.referenceEnvironment(target.x,target.z,11);
 const camera=new T.PerspectiveCamera(target.fov,target.referenceAspect,.08,550);camera.rotation.order='YXZ';camera.position.set(target.x,.28+target.eye,target.z);if(target.look)camera.lookAt(target.look.x,target.look.y,target.look.z);else camera.rotation.set(target.pitch,target.yaw,0);camera.updateMatrixWorld(true);viewFrustum.setFromProjectionMatrix(new T.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
 diagnosticCamera=camera;
 await exit.prepareAt(target.x,target.z);exit.update({cx:0n,cz:0n,x:target.x,z:target.z});const group=exit.object;
 if(target.label==='fronttray12'||target.label==='tray-side'){for(let i=backcourt.physics.size;i<12;i++){backcourt.physics.spawn(['pet','can','soy'][i%3]);for(let j=0;j<75;j++)backcourt.physics.step(1/60,{active:true,interpolate:true});}backcourt.sync();}
 group.updateMatrixWorld(true);
 P=ROOT+'/'+label;fs.mkdirSync(P,{recursive:true});meshes=[];shaders={};textures=[];textureIds=new Map();materialIds=new Map();group.traverseVisible(exportMesh);meshes.sort((a,b)=>Number(a.transparent)-Number(b.transparent));
 const sc=new T.OrthographicCamera(-150,150,170,-90,.1,350),dir=env.sun.clone();const targetLight=camera.position.clone().addScaledVector(new T.Vector3(0,0,-1).applyQuaternion(camera.quaternion),label==='photo-hope'?70:25);sc.position.copy(targetLight).addScaledVector(dir,180);sc.lookAt(targetLight);sc.updateMatrixWorld(true);
 const cameras=[{label,aspect:target.referenceAspect,inverseViewProjection:new T.Matrix4().multiplyMatrices(camera.matrixWorld,camera.projectionMatrixInverse).elements,eye:camera.position.toArray(),projection:camera.projectionMatrix.elements.slice(),view:camera.matrixWorldInverse.elements.slice()}];
 fs.writeFileSync(P+'/physics-records.json',JSON.stringify(Array.from(backcourt.physics.records.values()).map(r=>({id:r.id,type:r.type,position:r.position,quaternion:r.quaternion,profile:r.profile})),null,2));
 fs.writeFileSync(P+'/fullscene-shaders.json',JSON.stringify(shaders));fs.writeFileSync(P+'/fullscene.json',JSON.stringify({meshes,textures,cameras,lighting:{sun:env.sun.toArray(),color:env.sunColor.clone().multiplyScalar(env.sunPower).toArray(),fill:env.fill.clone().multiplyScalar(env.fillPower).toArray(),ground:env.ground.clone().multiplyScalar(env.fillPower).toArray(),clinic:env.clinic,sky:env.sky.toArray(),exposure:env.exposure,shadow:new T.Matrix4().multiplyMatrices(sc.projectionMatrix,sc.matrixWorldInverse).elements}}));console.log({label,draws:meshes.length,triangles:meshes.reduce((n,m)=>n+m.count/3,0)});
}
