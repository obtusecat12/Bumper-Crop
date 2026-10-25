import {openPage,root} from './browser.mjs';
import fs from 'node:fs/promises';
const{browser,page,errors}=await openPage('game.html?intro=0&bake=0',{width:960,height:720});
try{
 await page.waitForFunction(()=>window.qa149&&document.documentElement.dataset.bootState==='ready',null,{timeout:180000});
 await page.evaluate(()=>qa149.enterZero(3));
 const start=await page.evaluate(()=>{const q=qa149,w=q.world,h=w.getChunk(-3,0).holes.find(h=>h.z>20)||w.getChunk(-3,0).holes[0];q.place(h.x,h.z+h.d/2+.65);q.state.pitch=-.65;q.setPlay(true);const draw=q.displayFilter.render;q.displayFilter.render=()=>{};for(let i=0;i<8;i++)q.animateZero(performance.now(),.035,.035);q.keys.add('KeyW');let n=0;while(!q.pitDeath.active&&n++<160)q.animateZero(performance.now(),.035,.035);q.displayFilter.render=draw;return{hole:h,mode:q.pitDeath.mode,steps:n,anchor:q.pitDeath.snapshot.anchor,feet:q.feet};});
 await page.screenshot({path:root+'/tests/level0-pit-cycles/results/game-death.png',timeout:120000});
 await page.waitForTimeout(400);await page.evaluate(()=>{const p=qa149.pitDeath,fn=p.frame,stop=performance.now()+1100;p.frame=now=>fn(Math.min(now,stop));qa149.unfreeze=()=>p.frame=fn;});await page.keyboard.press('Enter');await page.waitForTimeout(1300);
 const mid=await page.evaluate(()=>({mode:qa149.pitDeath.mode,feet:qa149.feet}));await page.screenshot({path:root+'/tests/level0-pit-cycles/results/game-rewind.png',timeout:120000});
 await page.evaluate(()=>qa149.unfreeze());await page.waitForFunction(()=>qa149.pitDeath.mode==='idle',null,{timeout:20000});
 const end=await page.evaluate(()=>({mode:qa149.pitDeath.mode,x:qa149.state.x,z:qa149.state.z,feet:qa149.feet,health:qa149.state.health,grounded:qa149.state.grounded,falling:qa149.state.vy}));
 await page.screenshot({path:root+'/tests/level0-pit-cycles/results/game-restored.png',timeout:120000});
 if(start.mode!=='dead'||mid.mode!=='rewinding'||end.health<=0||!end.grounded||Math.abs(end.x-start.anchor.x)>.02||Math.abs(end.z-start.anchor.z)>.02||Math.abs(end.feet-start.anchor.feet)>.02||errors.length)throw Error('Fall/rewind failed: '+errors.join(';'));
 const report={start,mid,end,errors,renderer:'Actual game, local Chromium / SwiftShader; deterministic native movement steps'};console.log(JSON.stringify(report));await fs.writeFile(root+'/tests/level0-pit-cycles/results/flow.json',JSON.stringify(report,null,2));
}finally{await browser.close();}
