import assert from 'node:assert/strict';
import {createLensWater} from '../../dist/lens-water.js?v=27';
let target=null;const calls=[];
const state={autoClear:true,xr:{enabled:true},outputColorSpace:'srgb',viewport:{x:0,y:0,z:1440,w:1080},scissor:{x:4,y:5,z:1400,w:1000},scissorTest:true};
const renderer={...state,
 getRenderTarget:()=>target,getActiveCubeFace:()=>0,getActiveMipmapLevel:()=>0,
 getViewport:o=>o.set(...Object.values(state.viewport)),getScissor:o=>o.set(...Object.values(state.scissor)),getScissorTest:()=>state.scissorTest,
 setRenderTarget:t=>{target=t;calls.push(['target',t?.width||0,t?.height||0]);},
 setViewport:v=>{assert.equal(v.z,1440);},setScissor:v=>{assert.equal(v.x,4);},setScissorTest:v=>{state.scissorTest=v;},
 copyFramebufferToTexture:c=>{assert.equal(target,null);calls.push(['copy',c.image.width,c.image.height]);},
 render:()=>{calls.push(['render',target?.width||0,target?.height||0]);}
};
const lens=createLensWater(renderer);assert.equal(lens.render(1440,1080),false);
lens.physics.add(.5,.5,1.3);lens.physics.step(1/30,{});assert(lens.render(1440,1080));
assert.equal(lens.wetOpticsRT.width,720);assert.equal(lens.wetOpticsRT.height,540);
assert.equal(lens.diagnostics.wetPasses,4);assert.equal(lens.diagnostics.blurWidth,360);
assert.deepEqual(calls[0],['copy',1440,1080]);assert.equal(target,null);assert.equal(renderer.autoClear,true);assert.equal(renderer.xr.enabled,true);assert.equal(state.scissorTest,true);
lens.render(1440,1080);assert.equal(lens.diagnostics.wetPasses,3);
renderer.render=()=>{throw new Error('synthetic render failure');};
assert.throws(()=>lens.render(1440,1080),/synthetic/);assert.equal(target,null);assert.equal(renderer.autoClear,true);assert.equal(renderer.xr.enabled,true);assert.equal(state.scissorTest,true);
lens.contextLost();assert.equal(lens.wetOpticsRT,null);assert.equal(lens.physics.wet,false);lens.dispose();
console.log(JSON.stringify({drySkip:true,halfResolution:'720x540',quarterBlur:'360x270',normalUpdatePasses:4,cachedNormalPasses:3,stateRestoredOnThrow:true,contextReset:true}));
