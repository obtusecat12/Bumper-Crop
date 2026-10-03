import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import * as T from '../../dist/vendor/three.module.min.js';
import {SpringSession} from '../../dist/level27-layout.js';
const main=fs.readFileSync(new URL('../../dist/main.js',import.meta.url),'utf8');
const source=main.slice(main.indexOf('async function enterSpring(){'),main.indexOf('function animateSpring('));
function fixture(failure=false){
 const events=[];let release,back,now=0;
 const state={level:11,cx:123456789123456789n,cz:-98765432198765432n,x:-7.7,z:-3.2,yaw:1.2,pitch:.17,velocity:new T.Vector3(),jump:0,vy:0};
 const original={...state},reset={clear(){},reset(){},mute(){},update(){}};
 const room={scene:{background:new T.Color()},focusDistance(){},capture(){},update(){},audio(){}};
 const nodes=new Map(),$=sel=>{if(!nodes.has(sel))nodes.set(sel,{hidden:false,innerHTML:''});return nodes.get(sel);};
 const ctx={T,state,spring:null,springTime:0,springOpen:0,springSteps:0,bathLoading:false,bathhouse:{active:true,focusDistance(){},spa:{muteAudio(){}},changing:{mute(){}}},springSession:new SpringSession(),keys:new Set(['KeyW']),joy:{x:1,z:1},lookInput:{reset(){events.push('input');}},performance:{now(){now+=1100;return now;}},document:{pointerLockElement:null},setTimeout,console:{error(){events.push('error');}},
 springTransition:{async show(){events.push('show');await new Promise(r=>release=r);events.push('paint');},progress(p){events.push(p);},async finish(){events.push('finish');},fail(cb){back=cb;events.push('fail');}},
 createLevel27(){events.push('build');return room;},async nextPaint(){events.push('yield');},async warmSpring75(_,__,c,report,render){events.push('warm');if(failure)throw Error('simulated compile failure');report(1,'done');render(c);},
 waterPipeline:{setBathSteam(){},update(){},reset(){},focus:{setSceneQuery(){}}},renderer:{shadowMap:{type:T.PCFSoftShadowMap,autoUpdate:false},domElement:{setAttribute(){}}},navigationMap:{setLevel(){}},camera:new T.PerspectiveCamera(),referenceView:null,interaction:null,eyelids:{style:{}},waterInspection:reset,lensWater:reset,waterState:reset,bodyWater:reset,waterBubbles:reset,rainEffects:reset,waterImpact:reset,waterRipples:reset,weatherFlare:reset,exitAudio:reset,showerAudio:reset,time:0,lastFrame:0,audio:{},uiThemes:{applyLevel(){}},$: $,springJournal:'spring',cityJournal:'city',fieldJournal:'field',resetCameraRig(){},resize(){},toast(){},displayFilter:{render(){events.push('render');}},exitScene:{update(){}},naturalShadows:{invalidate(){}}};
 vm.createContext(ctx);vm.runInContext(source,ctx);return{ctx,events,original,release:()=>release(),back:()=>back()};
}
const f=fixture(),pending=f.ctx.enterSpring();assert(f.ctx.bathLoading);assert(!f.events.includes('build'));await f.ctx.enterSpring();assert.equal(f.events.filter(x=>x==='show').length,1);f.release();await pending;assert.equal(f.ctx.state.level,27);assert(!f.ctx.bathLoading);assert(f.events.indexOf('paint')<f.events.indexOf('build'));assert(f.events.indexOf('warm')<f.events.indexOf('finish'));
f.ctx.leaveSpring(false);for(const k of ['level','cx','cz','x','z','yaw','pitch'])assert.equal(f.ctx.state[k],f.original[k]);
const retry=f.ctx.enterSpring();f.release();await retry;assert.equal(f.events.filter(x=>x==='build').length,1,'reuse spring geometry');
const broken=fixture(true),work=broken.ctx.enterSpring();broken.release();await work;assert.equal(broken.ctx.state.level,11);assert(broken.ctx.bathLoading);broken.back();assert(!broken.ctx.bathLoading);for(const k of ['cx','cz','x','z','yaw','pitch'])assert.equal(broken.ctx.state[k],broken.original[k]);
console.log('PASS: spring overlay before work, duplicate guard, cached entry, exact origin restoration and failure recovery.');
