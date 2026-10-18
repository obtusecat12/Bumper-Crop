// V133-bake-L0atrium: offline light bake for the bottomless atrium ("无底天井", level0-atrium96.js, 22 room tiers).
// tools/bake133_atrium.mjs path-traces the whole static atrium (troffer area lamps of tiers 1-6 with soft shadows,
// the bright Level 0 room above the opening, 2 diffuse bounces, contact AO) and stores per vertex
// f = baked irradiance / irradiance of the open rim floor. At runtime the realtime hemisphere/ambient term of every
// atrium material is multiplied by f (venue133-bake.js patchSky133, a = 0 so keep*a drops out), so the shaft walls
// darken with depth, slab edges and room corners get contact shadows, lamp pools and warm/pink bounce show on far
// tiers that the 4 realtime area-light slots never reach. The near realtime lamps / flashlight are untouched.
// Build is sync (neutral attribute → identical look until data arrives); subdivide/key/fill are async and time-sliced.
// Off with ?bake=0. Debug global __bcAtrium133.
import {bake133Enabled,prepareSky133,keySky133,fillBake133} from './venue133-bake.js?v=133c';
export const ATRIUM133_L=1.6;
export function bakeAtrium133(root){
 if(!bake133Enabled())return null;
 const prep=prepareSky133([[root,ATRIUM133_L]],{gain:1,keep:1,floor:.08});
 prep.ready=(async()=>{const t0=performance.now();await keySky133(prep);prep.keyMs=performance.now()-t0;
  try{const {ATRIUM_BAKE133}=await import('./level0-atrium-bake133-data.js?v=133');await fillBake133(prep,ATRIUM_BAKE133);}catch(e){prep.error=String(e);}
  return prep;})();
 globalThis.__bcAtrium133=prep;return prep;
}
