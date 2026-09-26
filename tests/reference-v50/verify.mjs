import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {createCanvas,loadImage}=createRequire(import.meta.url)(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas');
globalThis.document={createElement:()=>createCanvas(1,1)};
const T=await import('../../dist/vendor/three.module.min.js');
const R=await import('../../dist/reference-materials.js?v=50');
const S=await import('../../dist/reference-scenes.js?v=50');
const U=await import('../../dist/urban-layout.js?v=50');
const B=await import('../../dist/urban-batch.js?v=50');
const E=await import('../../dist/exit-scene.js?v=50');
const route=await import('../../dist/exit-route.js?v=50');
let decoded=0;
await R.initializeReferenceTextures(async(url,w,h)=>{const im=await loadImage(url.pathname);assert.equal(im.width,w);assert.equal(im.height,h);const c=createCanvas(w,h);c.getContext('2d').drawImage(im,0,0);decoded++;return{data:new Uint8Array(c.getContext('2d').getImageData(0,0,w,h).data),width:w,height:h};});
assert.equal(decoded,13);
for(const [key,[,,repeat]]of Object.entries(R.REFERENCE_TEXTURES)){const t=R.referenceTextures[key];assert.equal(t.wrapS,repeat?T.RepeatWrapping:T.ClampToEdgeWrapping);assert.equal(t.wrapT,t.wrapS);assert(t.image.data.length===t.image.width*t.image.height*4);}
const scene=E.createExitScene();
for(let z=-22;z<438;z+=2)for(const x of[-3,0,3]){const p=U.cityToWorld(x,z),before={...p};B.resolveUrban(p,scene.references.colliders);assert(Math.hypot(p.x-before.x,p.z-before.z)<.001,`Hope street blocked ${x},${z}`);}
for(const name of['photo-clinic','photo-hope','city-edge']){const p=scene.waypoint(name),q={...p};B.resolveUrban(q,scene.references.colliders);assert(Math.hypot(q.x-p.x,q.z-p.z)<.001,`${name} spawn obstructed`);const env=S.referenceEnvironment(p.x,p.z,11);assert(env&&env.amount===1&&env.far>400);assert(Number.isFinite(env.sun.length()));}
const hope=S.referenceWaypoint('photo-hope'),clinic=S.referenceWaypoint('photo-clinic');assert(S.referenceEnvironment(clinic.x,clinic.z,11).clinic>.95);assert(S.referenceEnvironment(hope.x,hope.z,11).clinic<.01);
assert.equal(S.referenceEnvironment(3200,3200,10),null,'city weather must not leak into distant fields');
const p=route.exitPoint(20);assert.equal(S.referenceEnvironment(p.x,p.z,10),null,'rural path entrance retains its weather');
let vertices=0;scene.references.object.traverse(m=>{if(!m.isMesh)return;for(const a of Object.values(m.geometry.attributes))for(const x of a.array)assert(Number.isFinite(x));vertices+=m.geometry.attributes.position.count;});
for(const q of scene.references.walks)assert(Number.isFinite(B.urbanWalkHeight(q.x,q.z,scene.references.walks,route.EXIT_CITY_Y)));
scene.dispose();console.log(JSON.stringify({decodedTextures:decoded,referenceVertices:vertices,hopePathSamples:690,photoSpawns:'clear',weatherIsolation:'passed',walkSurfaces:'finite'},null,2));
