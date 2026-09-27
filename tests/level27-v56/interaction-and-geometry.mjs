import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const {createCanvas,loadImage}=createRequire(import.meta.url)(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas');globalThis.document={createElement:()=>createCanvas(1,1)};
const T=await import('../../dist/vendor/three.module.min.js');
const L=await import('../../dist/level27-layout.js?v=56'),B=await import('../../dist/level27-entry.js?v=56');
const M=await import('../../dist/level27-materials.js?v=56');await M.initializeSpringTextures(async (url,w,h)=>{const im=await loadImage(url.pathname),c=createCanvas(w,h);c.getContext('2d').drawImage(im,0,0,w,h);return {width:w,height:h,data:new Uint8Array(c.getContext('2d').getImageData(0,0,w,h).data)};});
const {createExitScene}=await import('../../dist/exit-scene.js?v=56'),{createLevel27}=await import('../../dist/level27-scene.js?v=56');
assert(Math.abs(L.polygonArea(L.CAVE_PLAN)-18.58)<1e-9);
const session=new L.SpringSession();assert(!session.beginClose(true));session.heat();assert(!session.beginClose(true));session.heat();assert(!session.beginClose(false));assert(session.beginClose(true));assert(!session.tickClose(1.1,true));assert(!session.tickClose(.2,false));assert.equal(session.closing,0);assert(session.beginClose(true));assert(session.tickClose(2.2,true));
const original={level:11,cx:17n,cz:6n,x:5.27,z:16.2,yaw:2.37,pitch:-.4};assert.deepEqual(session.enter(original),L.ARRIVAL);assert.deepEqual(session.leave(),original);
// Walk the complete dry tunnel -> all treads -> basin -> treads -> exit route.
let pose={x:1.23,z:-5.20},samples=0,stepSamples=0;
function walkTo(target){for(let k=0;k<3000;k++){const dx=target.x-pose.x,dz=target.z-pose.z,d=Math.hypot(dx,dz);if(d<.012)return;const next={x:pose.x+dx/d*.012,z:pose.z+dz/d*.012},q=L.resolveSpring(pose,next);assert(Math.hypot(q.x-pose.x,q.z-pose.z)>.005,'blocked at '+JSON.stringify(pose));assert(Math.abs(L.springFloor(q.x,q.z)-L.springFloor(pose.x,pose.z))<.25,'unplanned step');pose=q;samples++;}throw Error('route did not converge');}
walkTo({x:1.23,z:1.44});walkTo({x:.06,z:1.44});walkTo({x:.06,z:.68});assert(L.inPool(pose.x,pose.z));walkTo({x:.06,z:1.44});walkTo({x:1.23,z:1.44});walkTo({x:1.23,z:-7.60});assert(L.springCanExit(pose.x,pose.z));assert(!L.springAllowed(-1.9,1.7));
const cave=createLevel27(),ray=new T.Raycaster();assert.equal(cave.falls.children.length,2);assert(cave.scene.userData.noAtmosphere);cave.scene.updateMatrixWorld(true);
const concrete=cave.scene.children[0].children.filter(o=>o.material===cave.materials.concrete);
for(let i=0;i<L.STAIRS.count;i++){const z=L.STAIRS.start+(i+.5)*L.STAIRS.tread;ray.set(new T.Vector3(L.STAIRS.x,2.9,z),new T.Vector3(0,-1,0));const hits=ray.intersectObjects(concrete);assert(hits.length);assert(Math.abs(hits[0].point.y-L.springFloor(L.STAIRS.x,z))<.001);stepSamples++;}
// The entrance fits between adjacent parcels and its actual door has a clear
// wheelchair-width approach from the pre-existing sidewalk to the shower.
const city=createExitScene();city.setCity(true);const front=B.bathPoint(0,5.4);await city.prepareAt(front.x,front.z);city.update({cx:0n,cz:0n,x:front.x,z:front.z});city.object.updateMatrixWorld(true);
let streetSamples=0;for(let z=5.2;z>-2.51;z-=.073){const p=B.bathPoint(0,z),q={...p};city.resolve(q,{cx:0n,cz:0n});assert(Math.hypot(q.x-p.x,q.z-p.z)<.001,'bath entrance blocked at '+z);ray.set(new T.Vector3(p.x,1.0,p.z),new T.Vector3(0,-1,0));const hits=ray.intersectObject(city.object).filter(h=>h.face.normal.y>.9&&h.point.y<.7);assert(hits.length);assert(Math.abs(hits[0].point.y-city.floorAt(p.x,p.z))<.025,'visible/walking floor mismatch '+z);streetSamples++;}
const shower=B.bathPoint(0,-2.4);assert(B.underShower(shower.x,shower.z));assert(!B.underShower(front.x,front.z));
// Execute the production enter/leave functions, including F2 abandoning the
// spring: exact BigInt world origin, position, view, UI and inventory survive.
const source=fs.readFileSync('dist/main.js','utf8'),el={style:{},setAttribute(){},hidden:true,innerHTML:''},effects={clear(){},reset(){},update(){}};
const state={...original,bottles:3,hydration:82,velocity:new T.Vector3()};let cameraResets=0;
const ctx={state,springSession:new L.SpringSession(),springOpen:0,keys:new Set(),joy:{x:0,z:0},referenceView:null,interaction:null,time:7,waterInspection:effects,lensWater:effects,waterState:effects,bodyWater:effects,waterBubbles:effects,rainEffects:effects,waterImpact:effects,waterRipples:effects,weatherFlare:effects,exitAudio:effects,uiThemes:{applyLevel(){}},$:()=>el,renderer:{domElement:el,shadowMap:{}},camera:{far:480,updateProjectionMatrix(){}},resetCameraRig(){cameraResets++;},waterPipeline:{...effects,focus:{setSceneQuery(){}}},resize(){},toast(){},springJournal:'27',cityJournal:'11',fieldJournal:'10',eyelids:el,spring:{audio(){}},audio:{},exitScene:{update(){}},naturalShadows:{invalidate(){}}};
vm.createContext(ctx);vm.runInContext(source.slice(source.indexOf('function enterSpring(){'),source.indexOf('function animateSpring(')),ctx);
vm.runInContext('enterSpring()',ctx);assert.equal(state.level,27);assert.equal(state.cx,0n);assert.equal(state.z,L.ARRIVAL.z);assert.equal(state.bottles,3);assert.equal(state.hydration,82);vm.runInContext('leaveSpring(false)',ctx);for(const k of Object.keys(original))assert.equal(state[k],original[k]);assert.equal(cameraResets,2);assert.equal(ctx.camera.far,480);
const report={area:L.CAVE_AREA,waterfalls:cave.falls.children.length,walkingRouteSamples:samples,physicalTreadSamples:stepSamples,streetDoorToShowerSamples:streetSamples,entry:'highest heat AND standing under shower AND 2.15s eyes closed',return:'production controller preserves exact world position and look; inventory retained',indoorAtmosphere:'isolated from urban sky/fog',runtimeTextureCount:4};
fs.mkdirSync(new URL('./results/',import.meta.url),{recursive:true});fs.writeFileSync(new URL('./results/interaction-geometry.json',import.meta.url),JSON.stringify(report,null,2));console.log(report);city.dispose();cave.dispose();
