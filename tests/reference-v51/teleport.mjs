import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {cityWaypoint} from '../../dist/urban-layout.js?v=51';
import {referenceWaypoint} from '../../dist/reference-scenes.js?v=51';
const waypoint=n=>n.startsWith('photo-')?referenceWaypoint(n):cityWaypoint(n);
const source=fs.readFileSync('dist/main.js','utf8'),start=source.indexOf("document.querySelectorAll('[data-teleport]').forEach(button=>button.addEventListener"),end=source.indexOf('\nfunction drink()',start),button={dataset:{teleport:'city-core'},addEventListener(e,fn){context.click=fn;}},element={textContent:''};
let prepared=null,reset=0;
const context={developerSearch:null,teleportJob:null,streamFailed:false,state:{level:10,velocity:{set(){}}},referenceView:{range:100},ready:false,audio:{start(){}},developerBusy(){},resize(){},enterCity(){context.state.level=11;},exitScene:{waypoint,async prepareAt(x,z){prepared={x,z};},update(){}},resetCameraRig(){reset++;},closeModal(){},setPlay(){},toast(){},$:()=>element,document:{querySelectorAll(){return[button];}}};
vm.createContext(context);vm.runInContext(source.slice(start,end),context);
for(const kind of['city-edge','city-core','city-plaza','photo-hope','photo-clinic']){button.dataset.teleport=kind;await context.click();const p=waypoint(kind);assert.equal(context.state.level,11);if(p.urbanPhoto)assert.equal(context.referenceView.label,p.label);else assert.equal(context.referenceView,null);assert(Math.abs(Number(context.state.cx)*64+context.state.x-p.x)<1e-8);assert(Math.abs(Number(context.state.cz)*64+context.state.z-p.z)<1e-8);assert.equal(prepared.x,p.x);assert.equal(prepared.z,p.z);assert.equal(context.state.yaw,p.yaw);}
assert.equal(reset,5);console.log('Five F2 city/photo destinations preserve rebased coordinates, await geometry and reset the camera.');
