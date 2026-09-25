import fs from 'node:fs';
const base=new URL('../../dist/',import.meta.url).pathname;
const T=await import(base+'vendor/three.module.min.js');
const {field,stringSeed}=await import(base+'world.js');const {makeGround,terrainGeometry}=await import(base+'ground.js');
const {createPacker,createUnpacker}=await import(base+'scene-packets.js');
const {installLayeredFog}=await import(base+'atmosphere.js');const {createMaterialFinish}=await import(base+'material-finish.js');const {createRuralShadows}=await import(base+'rural-shadows.js');const {createIrradianceField}=await import(base+'irradiance-field.js');const {createWetGround}=await import(base+'wet-ground.js');const {createWaterSurface}=await import(base+'water-surface.js');
globalThis.Worker=class{terminate(){}};T.TextureLoader.prototype.load=function(url,ok){const t=new T.DataTexture(new Uint8Array([128,128,255,255]),1,1);queueMicrotask(()=>ok?.(t));return t;};
const scene=new T.Scene(),camera=new T.PerspectiveCamera(70,1,.1,480),fog=installLayeredFog({scene,noiseTexture:new T.Data3DTexture(new Uint8Array(4),1,1,1)}),shadow=createRuralShadows({renderer:{shadowMap:{}},scene,camera}),gi=createIrradianceField(),water=createWaterSurface({binding:{}});
const f=field(-2n,0n,stringSeed('CHLORINE / ABUNDANCE / 10'),false),group=new T.Group();group.add(makeGround(f,1));
const packed=createPacker({T}).packChunk({field:f,group,pickups:[]});const chunk=createUnpacker({T}).unpackChunk(structuredClone(packed.packet,{transfer:packed.transfer}));
fog.attach(chunk.group);createMaterialFinish().attach(chunk.group);shadow.attach(chunk.group);gi.attach(chunk.group);createWetGround().attach(chunk.group);water.attach(chunk);
const mesh=chunk.group.children[0],s={vertexShader:T.ShaderLib.standard.vertexShader,fragmentShader:T.ShaderLib.standard.fragmentShader,uniforms:T.UniformsUtils.clone(T.ShaderLib.standard.uniforms)};mesh.material.onBeforeCompile(s,{});
const fixture=JSON.parse(fs.readFileSync('/tmp/repair-v34/shaders.json'));let vp=fixture.pond.vertex.split('varying vec3 vTerrain;')[0],fp=fixture.pond.fragment.split('varying vec3 vTerrain;')[0];
const defines='\n#define USE_FOG\n#define FOG_EXP2\n#define USE_SHADOWMAP\n#define SHADOWMAP_TYPE_PCF\n#define USE_CSM\n#define CSM_CASCADES 2\n#define CSM_FADE\n';
vp=vp.replace('NUM_DIR_LIGHTS 1','NUM_DIR_LIGHTS 2').replace('NUM_DIR_LIGHT_SHADOWS 0','NUM_DIR_LIGHT_SHADOWS 2')+defines;
fp=fp.replace('NUM_DIR_LIGHTS 1','NUM_DIR_LIGHTS 2').replace('NUM_DIR_LIGHT_SHADOWS 0','NUM_DIR_LIGHT_SHADOWS 2')+defines;
function expand(x){return x.replace(/#include <([^>]+)>/g,(_,k)=>expand(T.ShaderChunk[k]));}
function unroll(x){return x.replace(/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s*#pragma unroll_loop_end/g,(_,a,b,body)=>Array.from({length:+b-a},(_,j)=>body.replace(/\[\s*i\s*\]/g,'['+(+a+j)+']').replace(/UNROLLED_LOOP_INDEX/g,String(+a+j))).join(''));}
function done(x){return unroll(expand(x).replace(/NUM_DIR_LIGHTS/g,'2').replace(/NUM_DIR_LIGHT_SHADOWS/g,'2').replace(/NUM_POINT_LIGHTS|NUM_SPOT_LIGHTS|NUM_RECT_AREA_LIGHTS|NUM_HEMI_LIGHTS|NUM_POINT_LIGHT_SHADOWS|NUM_SPOT_LIGHT_SHADOWS|NUM_SPOT_LIGHT_MAPS|NUM_SPOT_LIGHT_COORDS|NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,'0'));}
fs.writeFileSync('/tmp/shore-full-chain.json',JSON.stringify({pond:{vertex:vp+done(s.vertexShader),fragment:fp+done(s.fragmentShader)}}));
const p=mesh.geometry.attributes.position.array,ix=mesh.geometry.index.array;let down=0,degenerate=0,area=0;for(let i=0;i<ix.length;i+=3){const a=ix[i]*3,b=ix[i+1]*3,c=ix[i+2]*3,y=(p[b+2]-p[a+2])*(p[c]-p[a])-(p[b]-p[a])*(p[c+2]-p[a+2]);if(y<0)down++;if(y===0)degenerate++;area+=y/2;}console.log({type:f.type,vertices:p.length/3,indexType:ix.constructor.name,down,degenerate,area});
