// Authored northwest bank of the V82 joined lake, inside the marked field.
export const OUTPOST={x:-290,z:-281,y:-.22,hx:30,hz:27,seed:4244718517};
export const CAMP_PLACEMENT={office:[-17,-13,0],kitchen:[14,-11,0],container:[-2,-13,0],tower:[-25,-23,0],generator:[24,-23,0],water:[22,13,0],pump:[26,31,0],rest:[-24,9,0],laundry:[15,23,0],dorms:[[-14,6,Math.PI/2],[-14,18,Math.PI/2],[6,7,-Math.PI/2],[6,19,-Math.PI/2]],gates:[[-4,27,0],[30,1,Math.PI/2]]};
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
export function outpostDistance(x,z){const a=Math.abs(x-OUTPOST.x)-26,b=Math.abs(z-OUTPOST.z)-23;return Math.hypot(Math.max(a,0),Math.max(b,0))+Math.min(Math.max(a,b),0)-4;}
export function outpostLocal(x,z,f){if(f.worldSeed!==OUTPOST.seed||f.x< -6n||f.x> -3n||f.z< -6n||f.z> -3n)return Infinity;return outpostDistance(Number(f.x)*64+x,Number(f.z)*64+z);}
export function outpostClearing(x,z,f){return outpostLocal(x,z,f)<2.2;}
export function outpostGround(x,z,f,original){const d=outpostLocal(x,z,f);if(d>=5)return original;const wx=Number(f.x)*64+x-OUTPOST.x,wz=Number(f.z)*64+z-OUTPOST.z;const worn=.018*Math.sin(wx*1.3)*Math.sin(wz*.8);return original+(OUTPOST.y+worn-original)*(1-smooth(-.5,5,d));}
export function outpostTeleport(field,seed){const x=OUTPOST.x-4,z=OUTPOST.z+31,cx=BigInt(Math.floor(x/64)),cz=BigInt(Math.floor(z/64));return{field:field(cx,cz,seed),cx,cz,x:x-Number(cx)*64,z:z-Number(cz)*64,yaw:0,pitch:0,kind:'outpost',label:'M.E.G. 湖岸前哨站'};}
