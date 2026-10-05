// Authored northwest bank of the V82 joined lake, inside the marked field.
export const OUTPOST={x:-290,z:-281,y:-.22,hx:22,hz:21,seed:4244718517};
export const CAMP_PLACEMENT={office:[-12,-10,.16],kitchen:[11,-7,-Math.PI/2],container:[1,-15,0],tower:[17,-17,0],generator:[7,-19,0],water:[16,10.5,0],pump:[26,31,0],rest:[-16,11,0],laundry:[15,18,0],dorms:[[-7,4,.45],[-5,13,Math.PI/2],[4,4,-Math.PI/2],[6,14,-.25]],gates:[[-1,21,0],[22,0,Math.PI/2]]};
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
export function outpostDistance(x,z){const a=Math.abs(x-OUTPOST.x)-(OUTPOST.hx-3),b=Math.abs(z-OUTPOST.z)-(OUTPOST.hz-3);return Math.hypot(Math.max(a,0),Math.max(b,0))+Math.min(Math.max(a,b),0)-3;}
export function outpostLocal(x,z,f){if(f.worldSeed!==OUTPOST.seed||f.x< -6n||f.x> -3n||f.z< -6n||f.z> -3n)return Infinity;return outpostDistance(Number(f.x)*64+x,Number(f.z)*64+z);}
export function outpostClearing(x,z,f){if(outpostLocal(x,z,f)<2.2)return true;if(f.worldSeed!==OUTPOST.seed)return false;const wx=Number(f.x)*64+x-OUTPOST.x,wz=Number(f.z)*64+z-OUTPOST.z;return Math.abs(wx-4.0)<2.1&&Math.abs(wz-34)<1.35;}
export function outpostGround(x,z,f,original){const d=outpostLocal(x,z,f);if(d>=5)return original;const wx=Number(f.x)*64+x-OUTPOST.x,wz=Number(f.z)*64+z-OUTPOST.z;const worn=.018*Math.sin(wx*1.3)*Math.sin(wz*.8);return original+(OUTPOST.y+worn-original)*(1-smooth(-.5,5,d));}
export function outpostTeleport(field,seed){const x=OUTPOST.x+CAMP_PLACEMENT.gates[0][0],z=OUTPOST.z+CAMP_PLACEMENT.gates[0][1]+4,cx=BigInt(Math.floor(x/64)),cz=BigInt(Math.floor(z/64));return{field:field(cx,cz,seed),cx,cz,x:x-Number(cx)*64,z:z-Number(cz)*64,yaw:0,pitch:0,kind:'outpost',label:'M.E.G. 湖岸前哨站'};}
