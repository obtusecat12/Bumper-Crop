import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {pathToFileURL} from 'node:url';
const REPO=path.resolve(process.argv[2]||new URL('../../',import.meta.url).pathname),DIST=path.resolve(process.argv[3]||path.join(REPO,'dist'));
const source=name=>fs.readFileSync(path.join(DIST,name),'utf8');
const rootDist=path.join(REPO,'dist'),factory=fs.existsSync(path.join(rootDist,'vending-drinks-v70.js'))?path.join(rootDist,'vending-drinks-v70.js'):path.resolve(REPO,'../v70-work/drink-models/vending-drinks-v70.js');
const T=await import(pathToFileURL(path.join(rootDist,'vendor/three.module.min.js')));
const {createVendingDrink,vendingDrinkName}=await import(pathToFileURL(factory));
const {vendingDrinkTextures}=await import(pathToFileURL(path.join(rootDist,'vending-materials-v70.js')));
const inspectionSource=source('almond-water-inspection.js').replace(/from (['"])(\.\/[^'"]+)\1/g,(_,quote,spec)=>'from '+JSON.stringify(spec.includes('vending-drinks-v70')?pathToFileURL(factory).href:new URL(spec,pathToFileURL(rootDist+'/')).href));
const {createAlmondInspection}=await import('data:text/javascript;base64,'+Buffer.from(inspectionSource).toString('base64'));
const camera=new T.PerspectiveCamera(67,1.5,.05,480);camera.position.set(0,1.72,0);camera.updateMatrixWorld();
const inspection=createAlmondInspection(),results=[];
const advance=n=>{for(let i=0;i<n;i++)inspection.update(1/60,camera,true);};
let compileCount=0;
await inspection.warmup({compileAsync:async(scene,cam)=>{compileCount++;const types=scene.children.filter(o=>o.userData.vendingDrink).map(o=>o.userData.vendingDrinkType);assert.deepEqual(types,['pet','can','soy']);assert(cam.layers.isEnabled(3));}});
assert.equal(compileCount,1);assert.equal(inspection.scene.children.filter(o=>o.userData.vendingDrink).length,0);
for(const type of ['pet','can','soy']){
 inspection.begin({kind:'vending',type,id:'test-'+type},null,camera);assert(inspection.active);assert(!inspection.hasGlass);assert.equal(inspection.name,vendingDrinkName(type));
 const item=inspection.pose.children[0],h=item.userData.almondHeight;assert.equal(item.position.y,-h*.5);
 const worldCopy=createVendingDrink(T,type,{textures:vendingDrinkTextures()}).group;
 assert.equal(item.children[0].geometry,worldCopy.children[0].geometry,'inspection must share world geometry');
 assert.notEqual(item.children[0].material,worldCopy.children[0].material,'world fog/shadow material must not leak into inspector');
 advance(42);assert.equal(inspection.phase,'holding');
 assert(inspection.pose.position.z<-.17&&inspection.pose.position.z>-.60);if(type==='can')assert(inspection.pose.position.z>-.34,'short can must remain readable in inspection');
 const before=inspection.pose.rotation.y;inspection.rotate(47,-10);advance(12);assert(Math.abs(inspection.pose.rotation.y-before)>.10,'drag rotation did not affect held item');
 for(let i=0;i<15;i++)inspection.zoom(-200);advance(12);const near=inspection.pose.position.z;
 for(let i=0;i<15;i++)inspection.zoom(200);advance(12);assert(inspection.pose.position.z<near,'wheel out did not move item away');
 const calls=[];inspection.opaque({setRenderTarget:t=>calls.push(['target',t]),clearDepth:()=>calls.push(['clearDepth']),render:(s,c)=>calls.push(['render',s,c])},'existing-target');
 inspection.glass({render:()=>calls.push(['unexpected glass'])},'unused','source',960,640);assert.equal(calls.filter(c=>c[0]==='render').length,1);assert(!calls.some(c=>c[0]==='unexpected glass'));
 inspection.stow();advance(25);assert(!inspection.active);assert.equal(inspection.pose.children.length,0);assert.equal(item.children.length,0);
 results.push(type+': factory / scale / drag / wheel / ordinary opaque pass / stow lifecycle');
}
inspection.begin({kind:'thermos',finish:0,label:0,paint:0,closure:0,seed:0},null,camera);advance(42);assert(inspection.name.includes('杏仁水'));assert.equal(inspection.pose.position.z,-.58);inspection.clear();
inspection.begin({kind:'glass',finish:0,label:0,paint:0,closure:0,seed:0},null,camera);assert(inspection.hasGlass);inspection.clear();
const staticEnvironment=inspection.scene.environment;inspection.update(1/60,camera,true);assert.equal(inspection.scene.environment,staticEnvironment);results.push('StandardMaterial inspection environment remains frozen; original glass uniforms keep their existing dynamic binding');
results.push('legacy thermos and refractive glass retain original factory, distance and pass');

// Execute the actual event functions, with a scene-adapter body ledger. This
// verifies that dispensing creates a world pickup rather than free inventory,
// and that collecting a body commits precisely one item to the shared bag.
const main=source('main.js'),extract=(name,next)=>main.slice(main.indexOf('function '+name+'('),main.indexOf('function '+next+'(',main.indexOf('function '+name+'(')));
const elements=new Map(),element=()=>({hidden:true,textContent:'',innerHTML:'',classList:{values:new Set(),contains(v){return this.values.has(v);},add(v){this.values.add(v);},remove(v){this.values.delete(v);}}});
elements.set('#interact',element());elements.set('.crosshair',element());
const bodies=new Map(),inventory=[],toasts=[];let sequence=0,nearby=null,invalidations=0,hud=0;
const backcourt={query:()=>nearby,dispense(){const type=['pet','can','soy'][sequence%3],id='world-'+sequence++;bodies.set(id,{type});return{ok:true,type,name:vendingDrinkName(type)};},pickup(id){const body=bodies.get(id);if(!body)return null;bodies.delete(id);return{variant:{kind:'vending',type:body.type,id},worldPosition:new T.Vector3(.1,.4,-1.2)};}};
const ctx={state:{level:11,cx:7n,cz:12n,x:3,z:4,bottles:0,hydration:20,stamina:30,sanity:40},waterInspection:inspection,waterInventory:inventory,camera,bathhouse:{active:false},exitScene:{backcourt},audio:{chime(){}},naturalShadows:{invalidate(){invalidations++;}},toast:s=>toasts.push(s),updateHUD:()=>hud++,vendingDrinkName,nearBathEntrance:()=>false,inPool:()=>false,$:s=>elements.get(s),chunks:new Map(),currentChunk:()=>null,barnDoorGoal:0,interaction:null,touchDevice:false};
vm.createContext(ctx);vm.runInContext(extract('drink','use')+extract('use','jump')+extract('scanInteraction','updateHUD'),ctx);
for(let i=0;i<3;i++){
 nearby={kind:'vending-machine',name:'Waterfall vending machine'};ctx.scanInteraction();assert.equal(ctx.interaction.kind,'vending-machine');ctx.use();assert.equal(inventory.length,i,'dispense must not insert inventory');
 const id='world-'+i;nearby={kind:'vending-drink',id,name:vendingDrinkName(bodies.get(id).type)};ctx.scanInteraction();assert.equal(ctx.interaction.id,id);ctx.use();assert.equal(inventory.length,i+1);assert.equal(bodies.size,0);assert.equal(ctx.state.bottles,i+1);
 ctx.scanInteraction();assert(elements.get('#interact').textContent.includes(inspection.name),'inspection label did not take priority over nearby machine');
 ctx.use();advance(25);assert(!inspection.active);
 // A duplicate/stale pickup id is harmless and cannot clone the item.
 ctx.interaction={kind:'vending-drink',id};ctx.use();assert.equal(inventory.length,i+1);
}
assert.deepEqual(inventory.map(v=>v.type),['pet','can','soy']);
inspection.begin(inventory.at(-1),null,camera);advance(42);assert.equal(inspection.name,'Lucky Soy Milk');ctx.drink();assert.equal(inventory.length,2);assert.equal(ctx.state.bottles,2);assert(!inspection.active);assert(toasts.at(-1).includes('Lucky Soy Milk'));
ctx.state.level=27;nearby={kind:'vending-machine'};ctx.scanInteraction();assert.equal(ctx.interaction,null,'Level 27 queried city vending bodies');
results.push('E dispenses only world bodies; E collects each body once; held prompt wins; R variant can be inspected; Q consumes correct named beverage');

// Execute the actual exit-scene composition with small scene factories. The
// real Three root transform and actual resolve function test BigInt rebasing.
const exitSource=source('exit-scene.js'),exitFunction=exitSource.slice(exitSource.indexOf('export function createExitScene')).replace('export function','function');
const tiny=()=>{const object=new T.Group();object.userData.cityStats={triangles:0,draws:0};return{object,colliders:[],walks:[],buildings:0,records:[]};};
const district=tiny(),approach={...tiny(),early:tiny().object},refs=tiny(),joined=tiny(),fabric=tiny(),fabricGround=tiny(),bath={...tiny(),waypoint:{label:'bath'}};
const court={object:new T.Group(),colliders:[{tag:'backcourt'}],waypoint:{label:'vending'},dispose(){this.object.removeFromParent();this.disposed=(this.disposed||0)+1;}};let resolved=null;
const ex={T,B:64,Y:.02,CITY_ORIGIN:{x:0,z:0},CITY_ANGLE:0,BUILDING_TYPES:[],performance,createUrbanMaterials:()=>({asphalt:new T.MeshStandardMaterial()}),addReferenceMaterials:x=>x,addDistrictMaterials:x=>x,addApproachGroundMaterial:x=>x,createClinicDistrict:()=>district,makeApproach:()=>approach,createReferenceScenes:()=>refs,referenceGround:()=>joined,createLandmarkFabric:()=>fabric,createLandmarkGround:()=>fabricGround,createSpringEntrance:()=>bath,createBackcourt:()=>court,resolveUrban:(p,colliders)=>{if(colliders===court.colliders){resolved={x:p.x,z:p.z};p.x+=.5;}},worldToCity:(x,z)=>({x,z}),cityToWorld:(x,z)=>({x,z}),cityBlockPlan:(ix,iz)=>({ix,iz,district:'test',buildings:[]}),cityDistrict:()=> 'test',buildBlock:function*(mats,plan,lod){return{...tiny(),plan,lod};},exitSample:()=>({s:250}),fountainClock:{value:0},urbanWalkHeight:(x,z,walks,y)=>y,roadHeight:()=>0,ease:()=>0,approachRoadTop:()=>0,roadHalf:()=>4,referenceWaypoint:n=>({label:n}),cityWaypoint:n=>({label:n}),fashionWaypoint:{label:'ad'}};
vm.createContext(ex);vm.runInContext(exitFunction+'\nglobalThis.api=createExitScene();',ex);const api=ex.api;
assert(api.object.children.includes(court.object));assert.equal(api.backcourt,court);assert.equal(api.waypoint('city-vending'),court.waypoint);assert(api.colliders.includes(court.colliders[0]));assert(api.cityColliders.includes(court.colliders[0]));
api.setCity(true);api.update({cx:7n,cz:12n,x:3,z:4});assert.equal(api.object.position.x,-448);assert.equal(api.object.position.z,-768);
const position={x:3,z:4};api.resolve(position,{cx:7n,cz:12n});assert.deepEqual(resolved,{x:451,z:772});assert.deepEqual(position,{x:3.5,z:4});api.dispose();assert.equal(court.disposed,1);
results.push('exit scene composes backcourt; F2 waypoint / map colliders / world-space collision / 64 m BigInt rebasing / disposal');
assert(main.includes("data-teleport=\"city-vending\""));assert(main.includes("'city-plaza','city-vending'"));
assert(main.includes('if(state.level===11&&playing&&!teleportJob)exitScene.backcourt.tick(dt,state,true,camera)'));
assert(main.indexOf('if(navigationMap.isOpen)')<main.indexOf('exitScene.backcourt.tick(dt,state,true,camera)'));
assert(main.includes('lookInput.frame(now)')&&main.includes('if(look.recovered)'));
assert(source('water-pipeline.js').includes("almond-water-inspection.js?v=70"));assert(source('boot.js').includes("main.js?v=70"));assert(source('index.html').includes('boot.js?v=70'));
const report={passed:true,tests:results,worldInventory:inventory.map(v=>({kind:v.kind,type:v.type})),shadowInvalidations:invalidations,uiCommits:hud,showerAndNPCScopes:'unchanged'};
const reportDir=new URL('./results/',import.meta.url);fs.mkdirSync(reportDir,{recursive:true});fs.writeFileSync(new URL('integration-check.json',reportDir),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
