import fs from 'node:fs';
import {createRequire} from 'node:module';
const {createCanvas,loadImage}=createRequire(import.meta.url)(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas');
globalThis.document={createElement:()=>createCanvas(1,1)};
const ROOT=process.argv[2],B=new URL('../../dist/',import.meta.url).href;let P;
const T=await import(B+'vendor/three.module.min.js');
async function decode(url,w,h){const im=await loadImage(url.pathname).catch(e=>{throw new Error(url.pathname+': '+e.message)}),c=createCanvas(w,h);c.getContext('2d').drawImage(im,0,0,w,h);return{data:new Uint8Array(c.getContext('2d').getImageData(0,0,w,h).data),width:w,height:h};}
const M=await import(B+'level27-materials.js?v=60');await M.initializeSpringTextures(decode);
const BT=await import(B+'bath-textures.js?v=62');await BT.initializeBathTextures(decode);const S=await import(B+'level27-scene.js?v=60'),BH=await import(B+'bathhouse-scene.js?v=62'),isBath=process.env.MODE==='bath',spring=isBath?BH.createBathhouse():S.createLevel27();if(isBath){spring.uniforms={reflectMatrix:{value:new T.Matrix4()},eye:{value:new T.Vector3()},nearFar:{value:new T.Vector2()},ready:{value:0}};spring.presets[1]=2;}for(let i=0;i<250;i++)spring.update(i/60);
let fogNear=10,fogFar=40;const viewFrustum=new T.Frustum();
const includes=s=>s.replace(/#include <([^>]+)>/g,(_,k)=>includes(T.ShaderChunk[k]));
const defs='\n#define NUM_DIR_LIGHTS 0\n#define NUM_POINT_LIGHTS 4\n#define NUM_SPOT_LIGHTS 0\n#define NUM_RECT_AREA_LIGHTS 0\n#define NUM_HEMI_LIGHTS 0\n#define NUM_DIR_LIGHT_SHADOWS 0\n#define NUM_POINT_LIGHT_SHADOWS 0\n#define NUM_SPOT_LIGHT_SHADOWS 0\n#define NUM_SPOT_LIGHT_MAPS 0\n#define NUM_SPOT_LIGHT_COORDS 0\n#define NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS 0\n#define NUM_CLIPPING_PLANES 0\n#define UNION_CLIPPING_PLANES 0\n';
const vp='#version 300 es\nprecision highp float;precision highp int;\n#define attribute in\n#define varying out\nuniform mat4 modelMatrix,viewMatrix,modelViewMatrix,projectionMatrix;uniform mat3 normalMatrix;uniform vec3 cameraPosition;uniform bool isOrthographic;in vec3 position;in vec2 uv;in vec3 normal;\n';
const fp='#version 300 es\nprecision highp float;precision highp int;\n#define varying in\n#define texture2D texture\nout vec4 pc_fragColor;\n#define gl_FragColor pc_fragColor\nuniform vec3 cameraPosition;uniform mat4 viewMatrix;uniform bool isOrthographic;\nvec4 linearToOutputTexel(vec4 c){return c;}\n';
let meshes=[],shaders={},textures=[],textureIds=new Map(),materialIds=new Map();
function bytes(file,a){fs.writeFileSync(P+'/'+file,Buffer.from(a.buffer,a.byteOffset,a.byteLength));return file;}
function texture(t){if(textureIds.has(t))return textureIds.get(t);const id=textures.length;textureIds.set(t,id);let a=t.image.data;if(!ArrayBuffer.isView(a))a=t.image.getContext('2d').getImageData(0,0,t.image.width,t.image.height).data;const mipmaps=(t.mipmaps||[]).map((m,i)=>({file:bytes('tex-'+id+'-mip-'+i+'.bin',m.data),width:m.width,height:m.height,depth:m.depth||t.image.depth||0}));textures.push({id,file:bytes('tex-'+id+'.bin',a),type:t.type,format:t.format,depth:t.image.depth||0,width:t.image.width,height:t.image.height,name:t.name,wrapS:t.wrapS,wrapT:t.wrapT,magFilter:t.magFilter,minFilter:t.minFilter,flipY:t.flipY,srgb:t.colorSpace===T.SRGBColorSpace,mip:t.generateMipmaps,mipmaps});return id;}
function exportMesh(m){if(!(m.layers.mask&1))return;if(!m.isMesh||!m.visible||m.isInstancedMesh&&!m.count||m.frustumCulled&&!viewFrustum.intersectsObject(m))return;const mat=m.material,id=meshes.length;let key=materialIds.get(mat),shader;
 if(key===undefined){key='mat'+materialIds.size;materialIds.set(mat,key);let s=mat.isShaderMaterial?{vertexShader:mat.vertexShader,fragmentShader:mat.fragmentShader,uniforms:mat.uniforms}:{vertexShader:T.ShaderLib[mat.isMeshBasicMaterial?'basic':'standard'].vertexShader,fragmentShader:T.ShaderLib[mat.isMeshBasicMaterial?'basic':'standard'].fragmentShader,uniforms:T.UniformsUtils.clone(T.ShaderLib[mat.isMeshBasicMaterial?'basic':'standard'].uniforms)};mat.onBeforeCompile(s,{});
 let d=defs+(m.isInstancedMesh?'#define USE_INSTANCING\n':'')+(m.instanceColor?'#define USE_INSTANCING_COLOR\n':'')+(mat.vertexColors?'#define USE_COLOR\n':'')+(mat.side===T.DoubleSide?'#define DOUBLE_SIDED\n':'')+(mat.map?'#define USE_MAP\n#define MAP_UV uv\n':'')+(mat.alphaTest?'#define USE_ALPHATEST\n':'');
 if(mat.normalMap)d+='#define USE_NORMALMAP\n#define USE_NORMALMAP_TANGENTSPACE\n#define NORMALMAP_UV uv\n';
 if(mat.roughnessMap)d+='#define USE_ROUGHNESSMAP\n#define ROUGHNESSMAP_UV uv\n';
 if(mat.bumpMap)d+='#define USE_BUMPMAP\n#define BUMPMAP_UV uv\n';
 if(mat.emissiveMap)d+='#define USE_EMISSIVEMAP\n#define EMISSIVEMAP_UV uv\n';
 if(mat.alphaToCoverage)d+='#define ALPHA_TO_COVERAGE\n';
 for(const [k,v]of Object.entries(mat.defines||{}))d+='#define '+k+' '+v+'\n';
 s.vertexShader='varying vec3 vNativePosition;\n'+s.vertexShader.replace(/void main\s*\(\s*\)\s*\{/,'void main(){vNativePosition=(modelMatrix*vec4(position,1.)).xyz;');
 s.fragmentShader='varying vec3 vNativePosition;uniform vec4 clipPlaneNative;\n'+s.fragmentShader.replace(/void main\s*\(\s*\)\s*\{/,'void main(){if(dot(clipPlaneNative,vec4(vNativePosition,1.))<0.)discard;');
 if(mat.isMeshStandardMaterial){s.fragmentShader=`uniform highp samplerCube shadowCube0,shadowCube1,shadowCube2,shadowCube3;uniform vec3 shadowLightPos[4];uniform float shadowLightFar[4];
 float pointVisibility(int i){${isBath?'':'if(i!=1)return 1.;'}vec3 v=vNativePosition-shadowLightPos[i];float d=length(v)/shadowLightFar[i]-.003;float a;if(i==0)a=texture(shadowCube0,v).r;else if(i==1)a=texture(shadowCube1,v).r;else if(i==2)a=texture(shadowCube2,v).r;else a=texture(shadowCube3,v).r;return mix(.08,1.,step(d,a));}
 `+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('varying vec3 vNativePosition;','');s.fragmentShader='varying vec3 vNativePosition;\n'+s.fragmentShader;s.fragmentShader=includes(s.fragmentShader).replace('getPointLightInfo( pointLight, geometryPosition, directLight );','getPointLightInfo( pointLight, geometryPosition, directLight );directLight.color*=pointVisibility(i);');}
 const vin=(m.isInstancedMesh?'in mat4 instanceMatrix;\n':'')+(m.instanceColor?'in vec3 instanceColor;\n':'')+(mat.vertexColors?'in vec3 color;\n':'');
 if(false){s.vertexShader='varying vec3 vPhotoPosition;\n'+s.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nvPhotoPosition=(modelMatrix*vec4(transformed,1.)).xyz;');s.fragmentShader=`varying vec3 vPhotoPosition;uniform highp sampler2D nativeShadow;uniform mat4 nativeShadowMatrix;float nativeVisibility(){vec4 p=nativeShadowMatrix*vec4(vPhotoPosition,1.);vec3 q=p.xyz/p.w*.5+.5;if(q.x<0.||q.x>1.||q.y<0.||q.y>1.||q.z<0.||q.z>1.)return 1.;float v=0.;for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++)v+=step(q.z-.0015,texture2D(nativeShadow,q.xy+vec2(float(x),float(y))/3072.).r);return v/9.;}\n`+s.fragmentShader;}
 const uniforms={};for(const [k,u]of Object.entries(s.uniforms)){const v=u.value;if(typeof v==='number'||typeof v==='boolean')uniforms[k]=v;else if(v?.toArray)uniforms[k]=v.toArray();else if(Array.isArray(v)&&v[0]?.toArray)uniforms[k]=v.map(x=>x.toArray());}
 uniforms.bumpScale=mat.bumpScale||0;uniforms.bumpMapTransform=mat.bumpMap?.matrix.toArray()||[1,0,0,0,1,0,0,0,1];uniforms.fogColor=[0,0,0];uniforms.fogNear=fogNear;uniforms.fogFar=fogFar;uniforms.diffuse=mat.color?.toArray()||[1,1,1];uniforms.emissive=mat.emissive?.clone().multiplyScalar(mat.emissiveIntensity).toArray()||[0,0,0];uniforms.metalness=mat.metalness||0;uniforms.roughness=mat.roughness;uniforms.alphaTest=mat.alphaTest;uniforms.opacity=mat.opacity;if(mat.map)mat.map.updateMatrix();uniforms.mapTransform=mat.map?.matrix.toArray()||[1,0,0,0,1,0,0,0,1];uniforms.emissiveMapTransform=uniforms.mapTransform;uniforms.normalMapTransform=uniforms.mapTransform;uniforms.roughnessMapTransform=uniforms.mapTransform;uniforms.normalScale=mat.normalScale?.toArray()||[1,1];
 shader=shaders[key]={vertex:vp+d+vin+includes(s.vertexShader),fragment:fp+d+(m.instanceColor&&!mat.vertexColors?'#define USE_COLOR\n':'')+includes(s.fragmentShader),uniforms,textures:{}};
 if(false)shader.fragment=shader.fragment.replace('getDirectionalLightInfo( directionalLight, directLight );','getDirectionalLightInfo( directionalLight, directLight ); directLight.color*=nativeVisibility();');
 if(mat.bumpMap)shader.textures.bumpMap=texture(mat.bumpMap);if(mat.map)shader.textures.map=texture(mat.map);if(mat.emissiveMap)shader.textures.emissiveMap=texture(mat.emissiveMap);for(const[k,u]of Object.entries(s.uniforms))if(u.value?.isTexture)shader.textures[k]=(u.value.isRenderTargetTexture||u.value.isDepthTexture)?{target:k}:texture(u.value);
 }
 const attrs={};for(const[k,a]of Object.entries(m.geometry.attributes))attrs[k]={file:bytes('mesh-'+id+'-'+k+'.bin',new Float32Array(a.array)),size:a.itemSize,divisor:a.isInstancedBufferAttribute?1:0};
 if(m.instanceColor)attrs.instanceColor={file:bytes('mesh-'+id+'-instanceColor.bin',new Float32Array(m.instanceColor.array)),size:3,divisor:1};
 if(m.instanceMatrix)attrs.instanceMatrix={file:bytes('mesh-'+id+'-instanceMatrix.bin',new Float32Array(m.instanceMatrix.array)),size:16,divisor:1};
 const range=m.geometry.drawRange,ix=m.geometry.index?new Uint32Array(m.geometry.index.array.slice(range.start,range.start+range.count)):null;meshes.push({name:m.name,castShadow:m.castShadow,transparent:mat.transparent,depthWrite:mat.depthWrite,alphaToCoverage:mat.alphaToCoverage,material:mat.name,model:m.matrixWorld.elements,shaderKey:key,attrs,index:ix?bytes('mesh-'+id+'-index.bin',ix):null,count:ix?ix.length:m.geometry.attributes.position.count,instances:m.isInstancedMesh?m.count:0});
}





const views=(isBath?[
 {label:'bath-shelf',p:[-7.15,1.72,-1.01],look:[-8.13,1.62,-1.45],aspect:1.3,fov:60},
 {label:'bath-jamb',p:[-3.08,1.62,-1.70],look:[-4.20,1.20,-1.47],aspect:1.1,fov:62},
 {label:'bath-pool',p:[1.85,1.48,-.43],look:[-.4,1.05,-4.65],aspect:1.5,fov:75},
 {label:'bath-pool-low',p:[.10,.83,-.73],look:[.2,.92,-5.3],aspect:1.333,fov:78},
 {label:'bath-reception',p:[-.2,1.60,3.57],look:[.45,1.24,.45],aspect:1.5,fov:75},
 {label:'bath-arch',p:[-5.85,1.58,-2.9],look:[-4.34,1.28,-1.43],aspect:1.5,fov:74},
 {label:'bath-water',p:[-7.25,1.55,-3.10],look:[-7.10,.14,-3.65],aspect:1.5,fov:73},
 {label:'bath-dispenser',p:[1.10,1.78,2.18],look:[1.82,1.60,1.28],aspect:1.3,fov:66},
 {label:'bath-showers',p:[-4.95,1.52,-1.35],look:[-7.3,1.1,-4.3],aspect:1.5,fov:78}
]:[
 {label:'spring-overview',p:[-.35,.97,1.30],look:[.40,1.04,-1.65],aspect:1.5,fov:80},
 {label:'spring-stairs',p:[2.6,1.97,1.35],look:[3.65,1.8,-2.2],aspect:1.5,fov:74},
 {label:'spring-cascade',p:[-.08,.75,.45],look:[-1.88,.85,-.86],aspect:1.2,fov:61},
 {label:'spring-arrival',p:[3.65,3.60,-4.3],look:[2.65,1.14,-.10],aspect:1.5,fov:73},
 {label:'spring-bank',p:[2.85,1.96,1.70],look:[4.27,1.03,.52],aspect:1.5,fov:75},
 {label:'spring-drain',p:[-.32,.72,1.02],look:[-1.09,.01,2.03],aspect:1.5,fov:62}
]).filter(v=>!process.env.VIEW||process.env.VIEW.split(',').includes(v.label));
const lights=(isBath?BH.BATH_LIGHTS:S.SPRING_LIGHTS).map(l=>({...l,c:new T.Color(l.color).multiplyScalar(l.power).toArray(),views:[[1,0,0,0,-1,0],[-1,0,0,0,-1,0],[0,1,0,0,0,1],[0,-1,0,0,0,-1],[0,0,1,0,-1,0],[0,0,-1,0,-1,0]].map(v=>{const c=new T.PerspectiveCamera(90,1,.04,l.range);c.position.fromArray(l.p);c.up.fromArray(v.slice(3));c.lookAt(c.position.clone().add(new T.Vector3(...v.slice(0,3))));c.updateMatrixWorld(true);return new T.Matrix4().multiplyMatrices(c.projectionMatrix,c.matrixWorldInverse).toArray();})}));
for(const target of views){
 const camera=new T.PerspectiveCamera(target.fov,target.aspect,.08,40);camera.position.fromArray(target.p);camera.lookAt(...target.look);camera.updateMatrixWorld(true);
 const mirror=camera.clone();mirror.position.y=-camera.position.y;mirror.up.set(0,-1,0);mirror.lookAt(target.look[0],-target.look[1],target.look[2]);mirror.updateMatrixWorld(true);
 const bias=new T.Matrix4().set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1);spring.uniforms.reflectMatrix.value.copy(bias).multiply(mirror.projectionMatrix).multiply(mirror.matrixWorldInverse);spring.uniforms.eye.value.copy(camera.position);spring.uniforms.nearFar.value.set(.08,40);spring.uniforms.ready.value=1;
 P=ROOT+'/'+target.label;fs.mkdirSync(P,{recursive:true});meshes=[];shaders={};textures=[];textureIds=new Map();materialIds=new Map();spring.scene.updateMatrixWorld(true);spring.scene.traverseVisible(o=>{o.frustumCulled=false;exportMesh(o);});
 const record=c=>({aspect:target.aspect,label:target.label,inverseViewProjection:new T.Matrix4().multiplyMatrices(c.matrixWorld,c.projectionMatrixInverse).elements,eye:c.position.toArray(),projection:c.projectionMatrix.elements.slice(),view:c.matrixWorldInverse.elements.slice()});
 fs.writeFileSync(P+'/fullscene-shaders.json',JSON.stringify(shaders));fs.writeFileSync(P+'/fullscene.json',JSON.stringify({meshes,textures,cameras:[record(camera)],mirror:record(mirror),pointLights:lights,lighting:{ambient:new T.Color(isBath?0xc1ced0:0xadb4bb).multiplyScalar(isBath?.84:.34).toArray(),sun:[0,1,0],color:[0,0,0],fill:[0,0,0],ground:[0,0,0],clinic:0,sky:[.0009,.0015,.0012],exposure:isBath?1:1.08,shadow:new T.Matrix4().elements}}));console.log({view:target.label,draws:meshes.length,triangles:meshes.reduce((n,m)=>n+m.count/3,0)});
}
