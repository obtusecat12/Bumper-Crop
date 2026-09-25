// Account for primary, visibility, portal and relocation rays before starting an
// indivisible probe. Credits are replaced, never accumulated, once per frame.
export const RAY_FRAME_BUDGET=24000;
export const RAY_SLICE_MS=2;
export function probeRayUpperBound(rays,bounceSkyRays=1,portals=0){return 2*(rays*(2+bounceSkyRays+4*portals)+16*portals);}
export class RayFrameBudget{
 constructor(){this.credits=0;this.spent=0;this.peak=0;this.frame=-1;this.waiter=null;}
 grant(frame){if(frame<=this.frame)return;this.frame=frame;this.credits=RAY_FRAME_BUDGET;this.spent=0;const resume=this.waiter;this.waiter=null;resume?.();}
 async reserve(upperBound){if(upperBound>RAY_FRAME_BUDGET)throw Error('Probe exceeds the per-frame ray cap');while(this.credits<upperBound)await new Promise(resolve=>this.waiter=resolve);this.credits-=upperBound;return upperBound;}
 settle(reserved,actual){if(actual>reserved)throw Error('Ray count exceeded reserved upper bound');this.credits+=reserved-actual;this.spent+=actual;this.peak=Math.max(this.peak,this.spent);}
 async yieldFrame(){this.credits=0;await new Promise(resolve=>this.waiter=resolve);}
}
