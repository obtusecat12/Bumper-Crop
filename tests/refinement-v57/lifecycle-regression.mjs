import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import {createRequire} from 'node:module';
const {createCanvas}=createRequire(import.meta.url)('/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');globalThis.document={createElement:()=>createCanvas(1,1)};
const R=await import('../../dist/exit-route.js?v=57'),W=await import('../../dist/world.js?v=57'),M=await import('../../dist/models.js?v=57'),E=await import('../../dist/exit-scene.js?v=57'),D=await import('../../dist/developer-tools.js?v=57');
const seed=W.stringSeed('CHLORINE / ABUNDANCE / 10'),scene=E.createExitScene();scene.object.visible=true;const fields=new Map(),records=[];
assert(Math.hypot(R.EXIT_START.x-.6,R.EXIT_START.z-52)>=400&&Math.hypot(R.EXIT_START.x-.6,R.EXIT_START.z-52)<=600);
let total=0,previous=R.exitPoint(0);for(let s=0;s<=360;s+=.75){const p=R.exitPoint(s),q=R.exitSample(p.x,p.z,{});assert(Math.abs(q.s-s)<.015);total+=Math.hypot(p.x-previous.x,p.z-previous.z);previous=p;
 const cx=BigInt(Math.floor(p.x/64)),cz=BigInt(Math.floor(p.z/64)),key=`${cx},${cz}`;if(!fields.has(key)){const f=W.field(cx,cz,seed),ch=M.makeChunk(f,0,'balanced',new Set());fields.set(key,ch);}
 const ch=fields.get(key),x=p.x-Number(cx)*64,z=p.z-Number(cz)*64;assert(W.lakeRoadClearance(x,z,ch.field)>20);
 for(const side of [-.9,0,.9]){let v={x:p.x+p.nx*side,z:p.z+p.nz*side},before={...v};scene.resolve(v,{cx:0n,cz:0n});assert(Math.hypot(v.x-before.x,v.z-before.z)<.02,`authored road obstruction at ${s}`);const local={x:v.x-Number(cx)*64,z:v.z-Number(cz)*64};W.resolveSolid(local,.26,ch.colliders);assert(Math.hypot(local.x-(before.x-Number(cx)*64),local.z-(before.z-Number(cz)*64))<.02,`rural obstruction at ${s}`);}
 if(s%30===0)records.push({s,density:R.exitCropFactor(q),height:W.surfaceHeight(x,z,ch.field)});
}
assert(total/3>=90&&total/3<=150);assert(R.exitCropFactor(R.exitSample(...Object.values(R.exitPoint(300)).slice(0,2),{}))<.04);
const target=R.exitTeleport(W.field,seed),land=D.findSafeLanding(target,[]);assert(land);assert(Math.hypot(land.x-target.x,land.z-target.z)<.01);assert(Math.abs(land.yaw-target.yaw)<.001);
assert(!R.exitForField(30,30,{x:7n+1024n,z:6n},{}).active,'exit must not repeat in periodic coordinates');
for(const ch of fields.values())M.disposeChunk(ch);scene.dispose();
// Exercise actual scene lifecycle functions with instrumented ownership seams.
const source=fs.readFileSync(new URL('../../dist/main.js',import.meta.url),'utf8'),body=source.slice(source.indexOf('function retireOldFields('),source.indexOf('const fieldJournal='));
// Starting/cancelling a landmark search must leave the city's map alive until
// a valid destination reaches beginTeleport(). Exercise the actual click handler.
const searchContext={state:{level:11},developerSearch:null,teleportJob:null,streamFailed:false,seed,
 audio:{start(){}},developerBusy(){},findNearestLandmark(){return {return(){}};},$(){return {textContent:''};},
 restoreRural(){throw Error('Searching must not unload the city');},
 document:{querySelectorAll(){return [{dataset:{teleport:'pond'},addEventListener(event,fn){searchContext.click=fn;}}];}}};
vm.createContext(searchContext);vm.runInContext(source.slice(source.indexOf("document.querySelectorAll('[data-teleport]').forEach(button=>button.addEventListener"),source.indexOf('\nfunction drink()')),searchContext);
searchContext.click();assert.equal(searchContext.state.level,11);assert(searchContext.developerSearch);searchContext.developerSearch.return();searchContext.developerSearch=null;assert.equal(searchContext.state.level,11);
const calls=[],el={innerHTML:'',hidden:false,setAttribute(){}};let clock=0;
const makeLayer=()=>({stats:{},object:{removeFromParent(){},userData:{wheat:{activeStems:90}},children:[]},dispose(){calls.push('layer-dispose')}});
const mkStream=()=>({stop(){calls.push('worker-stop')},cancel(){calls.push('worker-cancel')},dispose(){calls.push('shared-dispose')}});
const makeGI=()=>({uniforms:{uProbeReady:{value:1}},values:{},pause(){calls.push('GI-pause')},dispose(){calls.push('GI-dispose')}});
const context={state:{level:10},exitArmed:true,transitionProgress:{value:.99},queue:[1,2],activeBuild:{task:{return(){calls.push('task-stop')}},job:{},compiling:true,chunk:{}},chunkStream:mkStream(),retiredStream:null,retiredGI:null,retiring:[],irradiance:makeGI(),pendingCompiles:1,ruralActive:true,
 chunks:new Map(Array.from({length:9},(_,i)=>[i,{group:{removeFromParent(){calls.push('detach')}}}])),wheatDetail:makeLayer(),powerNetwork:makeLayer(),exitScene:{setCity(c){calls.push('city:'+c)}},navigationMap:{setLevel(l){calls.push('map:'+l)}},uiThemes:{applyLevel(l){calls.push('ui:'+l)}},weatherDirector:{start(){},update(){return{}}},weatherState:{},rainAmount:1,renderer:{domElement:el},interaction:{},scene:{fog:{},add(){}},naturalShadows:{invalidate(){},detach(){}},releaseCerealGPU(){},resumeCerealGPU(){},performance:{now(){return clock+=1;}},$:()=>el,cityJournal:'city',fieldJournal:'field',releaseChunk(){calls.push('release')},extraBudgetRoots:[1,2],createIrradianceField:makeGI,createChunkStream:mkStream,createWheatDetailLayer:makeLayer,createRuralPowerNetwork:makeLayer,wind:{},wheatView:{},atmosphere:{},materialFinish:{},ruralActive:true,
 rainEffects:{clear(){}},waterImpact:{clear(){}},waterRipples:{reset(){}},lensWater:{reset(){}},waterBubbles:{clear(){}},};
vm.createContext(context);vm.runInContext(body,context);vm.runInContext('enterCity();',context);
assert.equal(context.state.level,11);assert.equal(context.queue.length,0);assert.equal(context.chunks.size,0);assert.equal(context.activeBuild,null);assert(calls.includes('worker-stop'));assert(calls.includes('map:11'));assert.equal(context.ruralActive,false);assert.equal(context.transitionProgress.value,1);
vm.runInContext('retireOldFields(true);',context);assert(!calls.includes('shared-dispose'),'do not release shared packets while compilation is in flight');context.pendingCompiles=0;vm.runInContext('retireOldFields(true);restoreRural();',context);assert(calls.includes('shared-dispose'));assert(calls.includes('GI-dispose'));assert.equal(context.state.level,10);assert.equal(context.ruralActive,true);assert(calls.includes('map:10'));
// Automatic Level 10 weather stops, but the shared clock continues for zoom,
// handheld bottle inspection, sky motion and lens animation in Level 11.
const {WeatherDirector}=await import('../../dist/weather-state.js?v=57');const weather=new WeatherDirector({rng:()=>0});weather.automatic=false;weather.tick(0,true);weather.tick(1000,true);assert.equal(weather.delta,1);weather.tick(1e6,true);assert.equal(weather.kind,'normal');
console.log(JSON.stringify({distanceFromSpawn:Math.hypot(R.EXIT_START.x-.6,R.EXIT_START.z-52),walkingSeconds:total/3,routeSamples:481,collisionFree:true,lifecycle:'10 → 11 → F2 → 10; deferred resource release verified',records},null,2));
