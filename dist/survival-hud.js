import {GAUGE_LAYOUT} from './hud-layout.js?v=18';
import {createVialMotion} from './vial-motion.js?v=18';
export {GAUGE_LAYOUT};
const keys=['stamina','hydration','health'],labels=['体力','水分','血量'];
const percent=v=>Math.round(Math.max(0,Math.min(100,Number(v)||0))*10)/10;
// A continuous angular sweep clips the original colored material. The brass
// dividers and textured rails never move or receive a depletion overlay.
export function depletionPath(value){
 const a=Math.PI+percent(value)/100*Math.PI/2;
 const x=790+Math.cos(a)*1100,y=760+Math.sin(a)*1100;
 return `M790 760L${x.toFixed(2)} ${y.toFixed(2)}A1100 1100 0 0 1 790 -340Z`;
}
export function liquidPaths(value,slope=0,ripple=0){
 // Source coordinates of the real glass cavity. The +6 degree surface slope
 // compensates for the vial's fixed -6 degree mounting angle.
 const y=2040-percent(value)/100*1560,s=.105+slope;
 const left=y-s*112,right=y+s*112,crest=y-ripple*80;
 return{body:`M249 ${left.toFixed(2)}Q360 ${crest.toFixed(2)} 475 ${right.toFixed(2)}L475 2132H249Z`,surface:`M249 ${left.toFixed(2)}Q360 ${crest.toFixed(2)} 475 ${right.toFixed(2)}`};
}
export function survivalMarkup(){return `<div class="stats" data-ui-part="vitals" role="group" aria-label="生命状态与补给">
 <div class="sanity-vial" role="meter" id="sanity-meter" aria-label="精神值" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100">
  <svg class="vial-fluid" viewBox="0 0 724 2172" aria-hidden="true"><defs><clipPath id="vial-interior"><path d="M249 354H475V1992Q475 2112 362 2112Q249 2112 249 1992Z"/></clipPath><linearGradient id="vial-liquid-depth"><stop offset="0" style="stop-color:var(--ui-vial-shadow,#57410e)" stop-opacity=".85"/><stop offset=".18" style="stop-color:var(--ui-vial-liquid,#c5a853)" stop-opacity=".7"/><stop offset=".48" style="stop-color:var(--ui-vial-light,#e6ce79)" stop-opacity=".66"/><stop offset=".77" style="stop-color:var(--ui-vial-liquid,#b39842)" stop-opacity=".8"/><stop offset="1" style="stop-color:var(--ui-vial-shadow,#574513)" stop-opacity=".93"/></linearGradient></defs><g clip-path="url(#vial-interior)"><path id="sanity-liquid" fill="url(#vial-liquid-depth)"/><path id="sanity-meniscus" fill="none" style="stroke:var(--ui-vial-surface,#f3dda0)" stroke-opacity=".83" stroke-width="11"/></g></svg>
  <div class="vial-glass" aria-hidden="true"></div><span class="sanity-label">精神</span>
 </div>
 <div class="vitals-art" aria-hidden="true"></div>
 <svg class="vitals-gauges" viewBox="${GAUGE_LAYOUT.viewBox}" aria-hidden="true" focusable="false"><defs>${keys.map(k=>`<clipPath id="${k}-band"><path d="${GAUGE_LAYOUT[k].clip}"/></clipPath>`).join('')}</defs>${keys.map(k=>`<path clip-path="url(#${k}-band)" id="${k}" d="${depletionPath(100)}"/>`).join('')}</svg>
 ${keys.map((k,i)=>`<span class="vitals-label ${k}-label" id="${k}-meter" role="meter" aria-label="${labels[i]}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100">${labels[i]}</span>`).join('')}
 <span class="vitals-label supply-label">杏仁水</span><span id="bottle-count" class="vitals-count" aria-label="杏仁水 0 瓶">00</span>
 </div>`;}
export function createSurvivalDisplay(host){
 const paths=keys.map(id=>host.querySelector('#'+id)),meters=keys.map(id=>host.querySelector('#'+id+'-meter'));
 const count=host.querySelector('#bottle-count'),sanityMeter=host.querySelector('#sanity-meter'),liquid=host.querySelector('#sanity-liquid'),meniscus=host.querySelector('#sanity-meniscus');
 const motion=createVialMotion(),reduced=globalThis.matchMedia?.('(prefers-reduced-motion:reduce)');
 let previous=[NaN,NaN,NaN,NaN,NaN],sanity=100,motionTime=0,lastLiquid='';
 function paintLiquid(slope=0,ripple=0){const p=liquidPaths(sanity,slope,ripple);if(p.body===lastLiquid)return;lastLiquid=p.body;liquid.setAttribute('d',p.body);meniscus.setAttribute('d',p.surface);}
 return{update(stamina,hydration,bottles,health=100,mental=100){
  [stamina,hydration,health].map(percent).forEach((value,i)=>{if(previous[i]===value)return;paths[i].setAttribute('d',depletionPath(value));paths[i].style.visibility=value===100?'hidden':'visible';meters[i].setAttribute('aria-valuenow',String(value));previous[i]=value;});
  const n=Math.max(0,Math.floor(Number(bottles)||0));if(previous[3]!==n){count.textContent=String(n).padStart(2,'0');count.setAttribute('aria-label',`杏仁水 ${n} 瓶`);previous[3]=n;}
  const next=percent(mental);if(previous[4]!==next){sanity=next;sanityMeter.setAttribute('aria-valuenow',String(next));liquid.style.visibility=meniscus.style.visibility=next>0?'visible':'hidden';paintLiquid();previous[4]=next;}
 },animate(dt,state,phase){
  motionTime+=dt;if(motionTime<1/30)return;
  const r=motion.step({dt:Math.min(.05,motionTime),yaw:state.yaw,vx:state.velocity.x,vz:state.velocity.z,vy:state.vy,grounded:state.grounded,phase,reduced:reduced?.matches});motionTime=0;paintLiquid(r.slope,r.ripple);
 },resetMotion(){motion.reset();motionTime=0;paintLiquid();}};
}
