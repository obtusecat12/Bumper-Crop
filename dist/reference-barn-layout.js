// Located from the supplied map's origin road, two lakes and Kephart Farm.
export const REFERENCE_BARN=Object.freeze({x:84,z:-80,y:.35,width:24,depth:11.6,frontEave:3.3,rearEave:5.15,ridge:9.25,ridgeZ:-1.6,doorX:3.1,doorWidth:3.8,doorHeight:3.0});
const smooth=(a,b,v)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t);};
export function barnContext(cx,cz){if(cx<0n||cx>2n||cz< -3n||cz>0n)return null;return{x:Number(cx)*64-REFERENCE_BARN.x,z:Number(cz)*64-REFERENCE_BARN.z};}
export function barnFootprintDistance(x,z,f){if(!f?.barn)return 1e4;x+=f.barn.x;z+=f.barn.z;const a=Math.abs(x)-12,b=Math.abs(z)-5.8;return Math.hypot(Math.max(a,0),Math.max(b,0))+Math.min(Math.max(a,b),0);}
// Only the building and its short doorway approach displace standing wheat.
export function barnHarvest(){return 0;}
export function barnEntrance(x,z,f){if(!f?.barn)return false;x+=f.barn.x;z+=f.barn.z;return Math.abs(x-3.1)<2.05&&z>5.5&&z<9.2;}
export function barnGroundHeight(x,z,f,y){const d=barnFootprintDistance(x,z,f);return y+(.32-y)*(1-smooth(.1,2.6,d));}
export function barnTarget(field,seed,photo=false,surfaceHeight=null){const wx=photo?38.313:REFERENCE_BARN.x+REFERENCE_BARN.doorX,wz=photo?-22.497:REFERENCE_BARN.z+11,cx=BigInt(Math.floor(wx/64)),cz=BigInt(Math.floor(wz/64)),x=wx-Number(cx)*64,z=wz-Number(cz)*64,f=field(cx,cz,seed);
 return{kind:photo?'photo':'reference-barn',label:photo?'砖砌谷仓 · 照片机位':'砖砌谷仓',cx,cz,x,z,eye:photo?4.138-(surfaceHeight?.(x,z,f)||0):1.77,focusX:REFERENCE_BARN.x+.32-Number(cx)*64,focusZ:REFERENCE_BARN.z+.79-Number(cz)*64,focusY:3.18,fov:24.278,referenceAspect:4/3,range:235,field:f};}

// Authored landscape is independent of chunk LOD and stubble sampling order.
export const BARN_TREES=Array.from({length:25},(_,i)=>({x:-58+i*4.7+Math.sin(i*2.31)*1.5,z:-69-Math.sin(i*1.72)*6,variant:i%3,scale:.63+(Math.sin(i*2.75)+1)*.17,rotation:i*2.31,seed:777+i}));
export const BARN_SHRUBS=Array.from({length:17},(_,i)=>({x:-34+i*3.4,z:-10-Math.sin(i*2.4)*2,variant:1,scale:.85+(Math.sin(i*3.1)+1)*.17,width:3.5+(Math.sin(i*2.1)+1)*.65,rotation:i*2.1}));
export function barnLandscape(f){if(!f.barn)return{trees:[],shrubs:[]};const local=t=>({...t,x:t.x-f.barn.x,z:t.z-f.barn.z});return{trees:BARN_TREES.map(local),shrubs:BARN_SHRUBS.map(local)};}

// Rear rooflight replacements are hidden from the supplied front photograph.
export const BARN_ROOFLIGHTS=Object.freeze([{x:-5.8,z:-3.9,width:1.36,depth:1.36},{x:5.5,z:-3.9,width:1.36,depth:1.36}]);
