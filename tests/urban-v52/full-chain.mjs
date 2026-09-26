// Compile the real packet -> fog -> finish -> CSM -> GI -> batching shader chain.
import fs from 'node:fs';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
const {createCanvas}=createRequire(import.meta.url)('/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
globalThis.document={createElement:()=>createCanvas(1,1)};globalThis.Worker=class{postMessage(){}terminate(){}};
const B=new URL('../../dist/',import.meta.url).href,imp=n=>import(B+n+'?v=52'),T=await import(B+'vendor/three.module.min.js');
T.TextureLoader.prototype.load=function(url,ok){const t=new T.DataTexture(new Uint8Array([128,128,255,255]),1,1);queueMicrotask(()=>ok?.(t));return t;};
const [W,M,C,S,A,F,H,I,D]=await Promise.all(['world.js','models.js','scene-packets.js','scene-batches.js','atmosphere.js','material-finish.js','rural-shadows.js','irradiance-field.js','dense-wheat.js'].map(imp));
const scene=new T.Scene(),camera=new T.PerspectiveCamera(72,4/3,.08,480),fog=A.installLayeredFog({scene,noiseTexture:new T.Data3DTexture(new Uint8Array(4),1,1,1)}),finish=F.createMaterialFinish(),shadow=H.createRuralShadows({renderer:{shadowMap:{}},scene,camera}),gi=I.createIrradianceField();
const decorate=root=>{fog.attach(root);finish.attach(root);shadow.attach(root);gi.attach(root);};
await D.initializeCerealTextures(async()=>new Uint8Array(1024*1024*4).fill(255));
const chunk=M.makeChunk(W.field(7n,6n,W.stringSeed('CHLORINE / ABUNDANCE / 10')),0,'balanced',new Set());

const packer=C.createPacker({T,isSharedResource:M.isSharedModelResource,wind:M.wind}),unpacker=C.createUnpacker({T,wind:M.wind,viewUniform:{value:new T.Vector3()}}),p=packer.packChunk(chunk),c=unpacker.unpackChunk(structuredClone(p.packet,{transfer:p.transfer}));
const A47=await import('../../dist/almond-water-assets.js?v=52');A47.hydrateAlmondPickups(c);const probe=A47.makeAlmondBottle({kind:'glass',finish:0,label:0,closure:1,paint:0,seed:1});c.group.add(probe);scene.add(c.group);c.group.updateMatrixWorld(true);const batch=S.createSceneBatches({onMesh:decorate,onRemove:shadow.detach});batch.capture(c.group);decorate(c.group);batch.register(c);batch.update('0,0');scene.add(batch.object);
const detail=D.createWheatDetailLayer(M.wind,{onMesh:decorate});const L=await import('../../dist/cereal-layout.js?v=52');detail.accept(L.generateCerealCell(0n,1n,W.stringSeed('CHLORINE / ABUNDANCE / 10')));scene.add(detail.object);detail.update(new Map([['0,0',c]]),new T.Vector3(.6,1.77,52),'balanced','0,0');
const {createRuralPowerNetwork}=await import('../../dist/rural-power-render.js?v=52');const power=createRuralPowerNetwork(M.wind,{onMesh:decorate,onRemove:shadow.detach});power.register(c);power.update(0n,0n);scene.add(power.object);
const defs='\n#define NUM_DIR_LIGHTS 2\n#define NUM_POINT_LIGHTS 0\n#define NUM_SPOT_LIGHTS 0\n#define NUM_RECT_AREA_LIGHTS 0\n#define NUM_HEMI_LIGHTS 0\n#define NUM_DIR_LIGHT_SHADOWS 2\n#define NUM_POINT_LIGHT_SHADOWS 0\n#define NUM_SPOT_LIGHT_SHADOWS 0\n#define NUM_SPOT_LIGHT_MAPS 0\n#define NUM_SPOT_LIGHT_COORDS 0\n#define NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS 0\n#define NUM_CLIPPING_PLANES 0\n#define UNION_CLIPPING_PLANES 0\n';
const vp='#version 300 es\nprecision highp float;precision highp int;\n#define attribute in\n#define varying out\nuniform mat4 modelMatrix,viewMatrix,modelViewMatrix,projectionMatrix;uniform mat3 normalMatrix;uniform vec3 cameraPosition;uniform bool isOrthographic;in vec3 position;in vec2 uv;in vec3 normal;\n';
const fp='#version 300 es\nprecision highp float;precision highp int;\n#define varying in\n#define texture2D texture\n#define textureCube texture\nout vec4 pc_fragColor;\n#define gl_FragColor pc_fragColor\nuniform vec3 cameraPosition;uniform mat4 viewMatrix;uniform bool isOrthographic;\nvec4 linearToOutputTexel(vec4 c){return c;}\n';
function expand(x){return x.replace(/#include <([^>]+)>/g,(_,k)=>expand(T.ShaderChunk[k]));}
function done(x){x=expand(x).replace(/NUM_DIR_LIGHT_SHADOWS|NUM_DIR_LIGHTS/g,'2').replace(/NUM_POINT_LIGHTS|NUM_SPOT_LIGHTS|NUM_RECT_AREA_LIGHTS|NUM_HEMI_LIGHTS|NUM_POINT_LIGHT_SHADOWS|NUM_SPOT_LIGHT_SHADOWS|NUM_SPOT_LIGHT_MAPS|NUM_SPOT_LIGHT_COORDS|NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,'0');return x.replace(/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s*#pragma unroll_loop_end/g,(_,a,b,body)=>Array.from({length:+b-a},(_,j)=>body.replace(/\[\s*i\s*\]/g,'['+(+a+j)+']').replace(/UNROLLED_LOOP_INDEX/g,String(+a+j))).join(''));}
const ES=await import('../../dist/exit-scene.js?v=52');const ex=ES.createExitScene();ex.object.visible=true;ex.setCity(true);scene.add(ex.object);fog.attach(ex.object);finish.attach(ex.object);shadow.attach(ex.object);const output={},seen=new Set();let meshes=0;
// A carried bottle uses shared materials after Level 11 -> F2 -> Level 10.
// Compile the actual restored material chain, not only fresh chunk materials.
const restoredGI=I.createIrradianceField();restoredGI.attach(probe);
function emit(mesh,mat,depth=false){
 const key=mat.uuid+':'+!!mesh.isInstancedMesh;if(seen.has(key))return;seen.add(key);
 const lib=T.ShaderLib[depth?'depth':mat.isMeshStandardMaterial?'standard':mat.isMeshLambertMaterial?'lambert':'basic'],s=mat.isShaderMaterial?{vertexShader:mat.vertexShader,fragmentShader:mat.fragmentShader,uniforms:mat.uniforms}:{...lib,uniforms:T.UniformsUtils.clone(lib.uniforms)};mat.onBeforeCompile(s,{});
 let d=defs+(mesh.isInstancedMesh?'#define USE_INSTANCING\n':'')+(mesh.instanceColor?'#define USE_INSTANCING_COLOR\n':'')+(mat.vertexColors?'#define USE_COLOR\n':'')+(mat.side===T.DoubleSide?'#define DOUBLE_SIDED\n':'')+(mat.map?'#define USE_MAP\n#define MAP_UV uv\n':'')+(mat.alphaTest?'#define USE_ALPHATEST\n':'');
 if(mat.emissiveMap)d+='#define USE_EMISSIVEMAP\n#define EMISSIVEMAP_UV uv\n';
 if(mat.alphaToCoverage)d+='#define ALPHA_TO_COVERAGE\n';
 for(const[k,v]of Object.entries(mat.defines||{}))d+='#define '+k+' '+v+'\n';
 if(depth)d+='#define DEPTH_PACKING 3201\n';else if(mat.fog)d+='#define USE_FOG\n#define FOG_EXP2\n';
 if(!depth&&mat.isMeshStandardMaterial)d+='#define USE_SHADOWMAP\n#define SHADOWMAP_TYPE_PCF\n';
 const vin=(mesh.isInstancedMesh?'in mat4 instanceMatrix;\n':'')+(mesh.instanceColor?'in vec3 instanceColor;\n':'')+(mat.vertexColors?'in vec3 color;\n':'');
 assert((s.vertexShader.match(/varying vec3 vIrradianceWorld;/g)||[]).length<=1,'map restore must not duplicate irradiance shader declarations');
 const name=String(Object.keys(output).length)+' '+(depth?'depth ':'')+(mesh.name||mat.name||'unnamed');output[name]={vertex:vp+d+vin+done(s.vertexShader),fragment:fp+d+(mesh.instanceColor&&!mat.vertexColors?'#define USE_COLOR\n':'')+done(s.fragmentShader)};
}
const sky=A.createAtmosphere({scene,renderer:{extensions:{has:()=>false}},fog:new T.Fog(0,1,2)});scene.add(sky.sky);
batch.updateView(camera);scene.traverseVisible(o=>{if(!o.isMesh&&!o.isLine)return;meshes++;emit(o,o.material);if(o.customDepthMaterial)emit(o,o.customDepthMaterial,true);});
assert(Object.values(output).some(s=>s.vertex.includes('uStaticRoots')));assert(Object.values(output).some(s=>s.fragment.includes('uExitAsphalt')));assert(scene.getObjectByName('Level 10 to Level 11 / urban fabric')); 
fs.writeFileSync(process.argv[2]||'/tmp/v41-full-chain.json',JSON.stringify(output));console.log({meshes,programs:Object.keys(output).length,batch:batch.stats,detail:detail.object.userData.wheat});
restoredGI.dispose();gi.dispose();shadow.dispose();
