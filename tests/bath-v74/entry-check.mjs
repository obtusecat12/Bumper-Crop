import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import * as T from '../../dist/vendor/three.module.min.js';
import {BATH_V72_ARRIVAL} from '../../dist/bathhouse-plan-v72.js';

// Exercise the production transition functions, including failure after the
// street pose has been saved. The renderer is stubbed: this is a state/async
// integration check, not a GPU performance or visual test.
const main=fs.readFileSync(new URL('../../dist/main.js',import.meta.url),'utf8');
const source=main.slice(main.indexOf('async function enterBath(){'),main.indexOf('function animateBath('));
function fixture(failAt=''){
 const events=[];let releaseShow,returnFromFailure;
 const state={level:11,cx:98765432123456789n,cz:-87654321234567890n,x:12.37,z:-6.81,yaw:1.34,pitch:-.24,velocity:new T.Vector3(),jump:0,vy:0};
 const original=Object.fromEntries(['level','cx','cz','x','z','yaw','pitch'].map(k=>[k,state[k]]));
 const reset={reset(){},clear(){},mute(){},update(){}};
 const room={scene:{background:0},active:false,presets:[0,0,0,0],focusDistance(){},beforeRender(){events.push('reflection');},update(){},spa:{muteAudio(){}},changing:{mute(){}}};
 const context={T,state,keys:new Set(['KeyW']),joy:{x:1,z:1},lookInput:{reset(){events.push('input-reset');}},performance,document:{pointerLockElement:null},
  bathhouse:{active:false},bathLoading:false,bathOrigin:null,bathShadowType:0,bathTime:0,referenceView:{},interaction:{},springOpen:0,eyelids:{style:{}},lastFrame:0,time:1,springSession:{closing:0},BATH_ARRIVAL:BATH_V72_ARRIVAL,
  bathTransition:{async show(){events.push('show');await new Promise(r=>releaseShow=r);events.push('painted');},progress(p){events.push(p);},async finish(){events.push('finish');},fail(cb){events.push('failure-screen');returnFromFailure=cb;}},
  async initializeChangingTextures(_,progress){events.push('textures');if(failAt==='textures')throw Error('simulated texture failure');progress(1);},
  async initializeReceptionTextures73(_,progress){events.push('reception-textures');progress(1);},async warmBath74(_,__,___,progress){events.push('warm');if(failAt==='compile')throw Error('simulated compile failure');progress(1);},
  async prepareBathhouse(progress){events.push('geometry');progress(1,'built');return room;},async nextPaint(){events.push('yield');},
  renderer:{shadowMap:{type:T.PCFShadowMap,autoUpdate:true},domElement:{setAttribute(){}},async compileAsync(){events.push('compile');if(failAt==='compile')throw Error('simulated compile failure');}},
  camera:new T.PerspectiveCamera(70,1,.08,480),lensWater:reset,waterState:reset,bodyWater:reset,rainEffects:reset,waterImpact:reset,waterRipples:reset,weatherFlare:reset,exitAudio:reset,showerAudio:reset,
  waterPipeline:{focus:{setSceneQuery(){}},reset(){},setBathSteam(){},update(){}},displayFilter:{render(){events.push('render');}},resetCameraRig(){},toast(){},exitScene:{update(){}},naturalShadows:{invalidate(){}},console:{error(){events.push('error');}}};
 vm.createContext(context);vm.runInContext(source,context);
 return {context,events,original,release(){releaseShow();},return(){returnFromFailure();}};
}
function streetRestored(f){for(const[k,v]of Object.entries(f.original))assert.equal(f.context.state[k],v,k);assert.equal(f.context.renderer.shadowMap.type,T.PCFShadowMap);assert.equal(f.context.bathhouse.active,false);}
const ok=fixture(),loading=ok.context.enterBath();
assert.equal(ok.context.bathLoading,true);assert.equal(ok.context.keys.size,0);assert.equal(ok.context.joy.x,0);
await ok.context.enterBath();assert.equal(ok.events.filter(e=>e==='show').length,1,'duplicate entry ignored');
assert(!ok.events.includes('geometry'),'overlay must paint before room construction');ok.release();await loading;
assert.equal(ok.context.bathLoading,false);assert.equal(ok.context.bathhouse.active,true);assert.equal(ok.context.state.cx,0n);assert.equal(ok.context.state.z,BATH_V72_ARRIVAL.z);
assert(ok.events.indexOf('painted')<ok.events.indexOf('textures'));assert(ok.events.indexOf('render')<ok.events.indexOf('finish'));
assert(ok.events.includes('warm'));assert(ok.events.indexOf('warm')<ok.events.indexOf('render'));
const phases=ok.events.filter(e=>typeof e==='number');assert(phases.every((p,i)=>!i||p>=phases[i-1]));
ok.context.leaveBath(false);streetRestored(ok);
const repeat=ok.context.enterBath();ok.release();await repeat;assert.equal(ok.events.filter(e=>e==='geometry').length,1,'re-entry reuses scene');ok.context.leaveBath(false);streetRestored(ok);
for(const failure of ['textures','compile']){const f=fixture(failure),p=f.context.enterBath();f.release();await p;streetRestored(f);assert.equal(f.context.bathLoading,true,'error remains masked until return');assert(f.events.includes('failure-screen'));f.return();assert.equal(f.context.bathLoading,false);}
const result={passed:true,checks:['overlay paints before construction','duplicate entry ignored','progress phases monotonic','first frame precedes unmask','cached re-entry','exact BigInt street-pose return','original shadow mode restored','texture and shader failures return safely'],renderer:'stubbed; browser images verify real WebGL separately'};
fs.writeFileSync(new URL('./results/entry.json',import.meta.url),JSON.stringify(result,null,2));console.log(result);
