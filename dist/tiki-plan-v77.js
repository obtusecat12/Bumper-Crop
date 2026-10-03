export {TIKI_FACADE,TIKI_WAYPOINT,TIKI_ROOM,TIKI_ARRIVAL,nearTikiDoor,tikiPoint,tikiLocal,atTikiExit} from './tiki-plan-v76.js';
export const TIKI_BOOTH_ROWS=[-1.3,1.60,4.50];
export const TIKI_DETAILS={
 pond:{x:-4.93,z:-5.05,w:3.18,d:2.72,rim:.46,water:.345,back:-6.40,moaiY:2.77,lipY:1.06,lipZ:-5.18,impactZ:-4.93},
 canoe:{x:-.25,z:-3.45,w:1.18,d:3.74,top:.96,bowZ:-1.58},
 cocktail:{x:4.36,z:-5.78,w:3.82,d:1.23,top:1.14},
 idol:{x:5.84,z:4.78,h:3.34,r:.42,yaw:-1.11},
 lantern:{x:4.77,z:3.65,y:1.145},
 shots:{room:{p:[.65,1.74,5.38],look:[-.1,1.3,-2.4]},cocktail:{p:[2.10,1.72,-4.05],look:[4.18,1.48,-5.80]},pond:{p:[-4.63,1.52,-3.15],look:[-4.93,1.49,-5.60]},canoe:{p:[-1.52,1.65,-.55],look:[-.14,.95,-3.55]},corner:{p:[2.9,1.72,4.82],look:[5.48,1.78,3.89]}}
};
export const TIKI_SOLIDS=[{kind:'obb',x:4.73,z:-.45,w:2.87,d:9.30,ry:0},
 ...TIKI_BOOTH_ROWS.flatMap(z=>[{kind:'obb',x:-4.95,z,w:2.72,d:1.28,ry:0},{kind:'obb',x:-4.95,z:z-.98,w:2.68,d:.63,ry:0},{kind:'obb',x:-4.95,z:z+.98,w:2.68,d:.63,ry:0}]),
 ...TIKI_BOOTH_ROWS.flatMap(z=>[-1,1].map(side=>({kind:'obb',x:-5.06,z:z+side*1.43,w:3.04,d:.12,ry:0}))),
 ...[-3.7,-2.1,-.5,1.1,2.7].map(z=>({kind:'circle',x:2.78,z,r:.34})),
 {kind:'obb',...TIKI_DETAILS.pond,ry:0},{kind:'obb',...TIKI_DETAILS.canoe,ry:0},{kind:'obb',...TIKI_DETAILS.cocktail,ry:0},
 {kind:'circle',x:TIKI_DETAILS.idol.x,z:TIKI_DETAILS.idol.z,r:TIKI_DETAILS.idol.r}];
export function tikiBlocked(x,z,pad=.24){return TIKI_SOLIDS.some(q=>q.kind==='circle'?Math.hypot(x-q.x,z-q.z)<q.r+pad:Math.abs(x-q.x)<q.w/2+pad&&Math.abs(z-q.z)<q.d/2+pad);}
export function resolveTiki(old,next){let x=Math.max(-6.47,Math.min(6.47,next.x)),z=Math.max(-6.2,Math.min(6.12,next.z));if(tikiBlocked(x,z)){if(!tikiBlocked(old.x,z))x=old.x;else if(!tikiBlocked(x,old.z))z=old.z;else{x=old.x;z=old.z;}}return{x,z};}
