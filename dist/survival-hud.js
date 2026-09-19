import {createVialMotion} from './vial-motion.js?v=18';
import {drawVitalsCase,drawGauges,drawVial,INSTRUMENT_PALETTE} from './instrument-drawing.js?v=19';
const keys=['stamina','hydration','health'],labels=['体力','水分','血量'];
const percent=v=>Math.max(0,Math.min(100,Number(v)||0));
export function survivalMarkup(){return `<div class="stats" data-ui-part="vitals" role="group" aria-label="生命状态与补给">
 <div class="sanity-vial" role="meter" id="sanity-meter" aria-label="精神值" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100"><canvas class="vial-canvas" width="62" height="177" aria-hidden="true"></canvas><span class="sanity-label">精神</span></div>
 <canvas class="vitals-art" width="294" height="156" aria-hidden="true"></canvas><canvas class="vitals-gauges" width="294" height="156" aria-hidden="true"></canvas>
 ${keys.map((k,i)=>`<span class="vitals-label ${k}-label" id="${k}-meter" role="meter" aria-label="${labels[i]}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100">${labels[i]}</span>`).join('')}
 <span class="vitals-label supply-label">杏仁水</span><span id="bottle-count" class="vitals-count" aria-label="杏仁水 0 瓶">00</span></div>`;}
function context(canvas,w,h){const c=canvas.getContext('2d');c.setTransform(canvas.width/w,0,0,canvas.height/h,0,0);return c;}
export function createSurvivalDisplay(host){
 const shell=context(host.querySelector('.vitals-art'),420,222),gauges=context(host.querySelector('.vitals-gauges'),420,222),vial=context(host.querySelector('.vial-canvas'),88,252);
 const meters=keys.map(id=>host.querySelector('#'+id+'-meter')),count=host.querySelector('#bottle-count'),sanityMeter=host.querySelector('#sanity-meter');
 const motion=createVialMotion(),reduced=globalThis.matchMedia?.('(prefers-reduced-motion:reduce)');
 let palette={...INSTRUMENT_PALETTE},target=[100,100,100,100],shown=[...target],bottles=-1,clock=0,painted='',lastVial='',fresh=true,announced=[];
 function paint(slope=0,ripple=0,force=false){
  const key=shown.slice(0,3).map(x=>x.toFixed(2)).join(',');if(force||key!==painted){drawGauges(gauges,shown,palette);painted=key;}
  const vk=`${shown[3].toFixed(2)},${slope.toFixed(3)},${ripple.toFixed(3)}`;if(force||vk!==lastVial){drawVial(vial,shown[3],slope,ripple,palette);lastVial=vk;}
 }
 drawVitalsCase(shell,palette);paint();
 return{
  update(stamina,hydration,n,health=100,sanity=100){target=[stamina,hydration,health,sanity].map(percent);target.forEach((v,i)=>{const value=Math.round(v*10)/10;if(announced[i]!==value){(meters[i]||sanityMeter).setAttribute('aria-valuenow',String(value));announced[i]=value;}});
   n=Math.max(0,Math.floor(Number(n)||0));if(n!==bottles){count.textContent=String(n).padStart(2,'0');count.setAttribute('aria-label',`杏仁水 ${n} 瓶`);bottles=n;}
   if(fresh){shown=[...target];fresh=false;paint();}
  },
  animate(dt,state,phase){clock+=dt;if(clock<1/30)return;const elapsed=Math.min(.1,clock);clock=0;const ease=reduced?.matches?1:-Math.expm1(-elapsed*13);
   shown=shown.map((v,i)=>Math.abs(v-target[i])<.015?target[i]:v+(target[i]-v)*ease);
   const r=motion.step({dt:elapsed,yaw:state.yaw,vx:state.velocity.x,vz:state.velocity.z,vy:state.vy,grounded:state.grounded,phase,reduced:reduced?.matches});paint(r.slope,r.ripple);
  },resetMotion(){motion.reset();clock=0;paint();},
  setUITheme(t){palette={...palette,ink:t.ink,metal:t.shellTop,light:t.bevelLight,dark:t.shellBottom,face:t.screen,liquid:t.vialLiquid};drawVitalsCase(shell,palette);paint(0,0,true);}
 };
}
