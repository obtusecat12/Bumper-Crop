import {createVialMotion} from './vial-motion.js?v=44';
import {GAUGES,gaugePath,liquidPath,paintVitals,paintVial,PART_URL} from './retro-instruments.js?v=44';
const keys=['stamina','hydration','health'],percent=v=>Math.max(0,Math.min(100,Number(v)||0));
export function survivalMarkup(){return `<div class="stats" data-ui-part="vitals" role="group" aria-label="生命状态与补给">
 <div class="sanity-vial" id="sanity-meter" role="meter" aria-label="精神值" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100"><img class="tube-back" src="${PART_URL('back_glass')}" alt=""><svg viewBox="0 0 256 780" aria-hidden="true"><defs><clipPath id="liquid-clip"><path d="M67 111 L174 111 L174 648 Q174 703 121 704 Q67 703 67 648 Z"/></clipPath><linearGradient id="liquid-color"><stop stop-color="#655d3d"/><stop offset=".5" stop-color="#c3b47c"/><stop offset="1" stop-color="#655d3d"/></linearGradient></defs><path class="liquid-path" clip-path="url(#liquid-clip)" fill="url(#liquid-color)" d="${liquidPath(100)}"/></svg><img class="tube-front" src="${PART_URL('front_glass')}" alt=""><img class="tube-cork" src="${PART_URL('cork')}" alt=""></div>
 <canvas class="vitals-art" width="640" height="320" aria-hidden="true"></canvas>
 <svg class="vitals-gauges" viewBox="0 0 640 320" aria-hidden="true"><defs>${GAUGES.map((g,i)=>`<linearGradient id="gauge-${i}" x1="0" y1="1" x2="0" y2="0"><stop stop-color="${g.colors[0]}"/><stop offset=".58" stop-color="${g.colors[1]}"/><stop offset="1" stop-color="${g.colors[2]}"/></linearGradient>`).join('')}</defs>${keys.map((k,i)=>`<path id="${k}-path" fill="url(#gauge-${i})" d="${gaugePath(i)}"/>`).join('')}</svg>
 ${keys.map((k,i)=>`<span class="sr-only" id="${k}-meter" role="meter" aria-label="${GAUGES[i].label}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100"></span>`).join('')}<span id="bottle-count" class="sr-only" aria-label="杏仁水 0 瓶">00</span></div>`;}
export function createSurvivalDisplay(host,parts){
 const root=host.querySelector('.stats'),shell=root.querySelector('canvas'),meters=keys.map(k=>root.querySelector('#'+k+'-meter')),paths=keys.map(k=>root.querySelector('#'+k+'-path')),liquid=root.querySelector('.liquid-path'),count=root.querySelector('#bottle-count'),sanity=root.querySelector('#sanity-meter');
 const motion=createVialMotion(),reduced=globalThis.matchMedia?.('(prefers-reduced-motion:reduce)');let tokens={},target=[100,100,100,100],shown=[...target],bottles=0,clock=0,slope=0,ripple=0,revision=0,key='';
 function updatePaths(){const next=shown.map(v=>v.toFixed(2)).join(',')+','+slope.toFixed(3)+','+ripple.toFixed(3)+','+bottles;if(next===key)return;key=next;revision++;
  paths.forEach((el,i)=>el.setAttribute('d',gaugePath(i,shown[i])));liquid.setAttribute('d',liquidPath(shown[3],slope,ripple));}
 function shellPaint(){const c=shell.getContext('2d');c.clearRect(0,0,640,320);paintVitals(c,parts,[0,0,0],bottles,tokens);revision++;}
 shellPaint();updatePaths();
 return{root,get revision(){return revision;},
  paint(c,r){c.save();c.translate(r.left,r.top);c.scale(r.width/640,r.height/320);paintVial(c,parts,shown[3],slope,ripple,tokens);paintVitals(c,parts,shown,bottles,{...tokens,pixelMode:document.body.dataset.filter==='ps1'});c.restore();},
  update(stamina,hydration,n,health=100,spirit=100){target=[stamina,hydration,health,spirit].map(percent);target.forEach((v,i)=>(meters[i]||sanity).setAttribute('aria-valuenow',String(Math.round(v))));
   n=Math.max(0,Math.floor(Number(n)||0));if(n!==bottles){bottles=n;count.textContent=String(n).padStart(2,'0');count.setAttribute('aria-label',`杏仁水 ${n} 瓶`);shellPaint();}updatePaths();},
  animate(dt,state,phase){clock+=dt;if(clock<1/30)return;const elapsed=Math.min(.1,clock);clock=0;const ease=reduced?.matches?1:-Math.expm1(-elapsed*13);shown=shown.map((v,i)=>Math.abs(v-target[i])<.015?target[i]:v+(target[i]-v)*ease);
   const result=motion.step({dt:elapsed,yaw:state.yaw,vx:state.velocity.x,vz:state.velocity.z,vy:state.vy,grounded:state.grounded,phase,reduced:reduced?.matches});slope=result.slope;ripple=result.ripple;updatePaths();},
  resetMotion(){motion.reset();slope=ripple=clock=0;updatePaths();},setUITheme(t){tokens={...t};shellPaint();key='';updatePaths();}
 };
}
