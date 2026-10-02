import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {createCanvas,loadImage}=createRequire(import.meta.url)(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas');
globalThis.document={createElement:()=>createCanvas(1,1)};
const base=new URL('../../dist/',import.meta.url).href,T=await import(base+'vendor/three.module.min.js');
const M=await import(base+'backcourt-materials-v71.js'),V=await import(base+'vending-materials-v70.js');
async function decode(url,w,h){const im=await loadImage(url.pathname);assert.equal(im.width,w);assert.equal(im.height,h);const c=createCanvas(w,h);c.getContext('2d').drawImage(im,0,0);return {data:new Uint8Array(c.getContext('2d').getImageData(0,0,w,h).data),width:w,height:h};}
await Promise.all([M.initializeCornerTextures(decode),V.initializeVendingTextures(decode)]);
const maps=M.cornerTextures();assert.equal(Object.keys(maps).length,36);
for(const[n,t]of Object.entries(maps))assert.equal(t.colorSpace,/-(normal|roughness|metallic|ao|height)$/.test(n)?T.NoColorSpace:T.SRGBColorSpace);
const {createCornerResidue,CORNER_PLAN}=await import(base+'backcourt-residue-v71.js');
const c=createCornerResidue();assert(c.object.userData.cityStats.draws<=16);assert(c.object.userData.cityStats.triangles<30000);
const report={stats:c.object.userData.cityStats,materials:[],clipping:c.object.userData.intentionalClipping,colliders:c.colliders,plan:CORNER_PLAN};
c.object.traverse(o=>{if(!o.isMesh)return;for(const n of ['position','normal','uv','uv1']){const a=o.geometry.attributes[n];assert(a,n);for(const x of a.array)assert(Number.isFinite(x));}assert(!Array.isArray(o.material));const m=o.material;if(!m.transparent&&m!==c.materials.screen&&m!==c.materials.crtScreen){for(const key of ['map','normalMap','roughnessMap'])assert(m[key],m.name+' missing '+key);}report.materials.push({name:m.name,map:m.map?.name,normal:m.normalMap?.name,roughness:m.roughnessMap?.name,metal:m.metalnessMap?.name,ao:m.aoMap?.name});});
assert.equal(c.lights.length,2);for(const l of c.lights){assert.equal(l.decay,2);assert.equal(l.castShadow,false);}assert.equal(c.materials.screen.map,c.materials.screen.emissiveMap);
const R=await import(base+'reference-scenes.js'),B=await import(base+'urban-batch.js');
const {createExitScene}=await import(base+'exit-scene.js');const ex=createExitScene();ex.setCity(true);
const routes={vendor:[[48,26],[38,24],[34.5,22.6],[34.5,20.32]],seat:[[38,24],[38,20.22]],service:[[26.8,26],[48,26],[73,26]]};report.routes={};
for(const[name,path]of Object.entries(routes)){let samples=0,max=0;for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])*8);for(let j=0;j<=n;j++){const t=j/n,p=R.clinicToWorld(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t),q={...p};B.resolveUrban(q,c.colliders);max=Math.max(max,Math.hypot(q.x-p.x,q.z-p.z));samples++;}}assert(max<1e-7,name);report.routes[name]={samples,maxDisplacement:max};}
const oldStats=ex.backcourt.object.userData.cityStats;assert.equal(oldStats.triangles,11427);assert.equal(ex.backcourt.cables.length,2);for(const cord of ex.backcourt.cables)assert(cord.minimumY>=-1e-8);
const shader={vertexShader:T.ShaderLib.standard.vertexShader,fragmentShader:T.ShaderLib.standard.fragmentShader,uniforms:{}};// Shader extracted from the actual material shared by ground meshes.
let groundMaterial;ex.references.object.traverse(o=>{if(o.material?.userData.cornerGround)groundMaterial=o.material;});assert(groundMaterial);
const {createMaterialFinish}=await import(base+'material-finish.js');createMaterialFinish().attach(ex.object);
groundMaterial.onBeforeCompile(shader,{});assert(shader.fragmentShader.includes('cornerWetness'));assert(shader.vertexShader.includes('vCornerUp'));assert(shader.fragmentShader.includes('if(cornerPatch<=.001)roughnessFactor=clamp'),'generic dry wear must not erase the authored wetness');
const corner=ex.cornerGround,p=R.clinicToWorld(35.25,20.30);
function local(world,frame){const x=world.x-frame.x,z=world.z-frame.y;return [frame.z*x-frame.w*z,frame.w*x+frame.z*z];}
ex.update({cx:0n,cz:0n,...p});const local0=local(p,corner.frame);ex.update({cx:7n,cz:3n,x:p.x-448,z:p.z-192});const local1=local({x:p.x-448,z:p.z-192},corner.frame);assert(Math.hypot(local0[0]-35.25,local0[1]-20.30)<1e-8);assert(Math.hypot(local1[0]-35.25,local1[1]-20.30)<1e-8);report.rebase={before:local0,after:local1};
for(const q of [[30.2,19.10],[35.25,20.3],[40.2,18.8]]){const p=R.clinicToWorld(...q);assert(Math.abs(ex.floorAt(p.x,p.z)-.30)<.005);}
report.oldVending=oldStats;report.source='Actual authored geometry and decoded textures; no hardware FPS measurement';
fs.mkdirSync(new URL('./results/',import.meta.url),{recursive:true});fs.writeFileSync(new URL('./results/corner-check.json',import.meta.url),JSON.stringify(report,null,2));
console.log(JSON.stringify({pass:true,stats:report.stats,routes:report.routes,rebase:report.rebase,oldVending:report.oldVending}));ex.dispose();c.dispose();
