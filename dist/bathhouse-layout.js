import {spaFloor,spaAllowed,inSpa,inSpaPortal} from './spa-layout-v65.js';
// One metre-scale authority for the empty pool, its deck and all indoor routes.
// Rounded inset basin: the left column island is a genuine convex tiled lobe.
const pool=[[-2.58,-1.58],[2.45,-1.58]];
function arc(cx,cz,r,a,b,n=12){for(let i=0;i<=n;i++){const q=a+(b-a)*i/n;pool.push([cx+Math.cos(q)*r,cz+Math.sin(q)*r]);}}
arc(2.45,-2.39,.81,Math.PI/2,0);pool.push([3.26,-5.84]);arc(2.53,-5.84,.73,0,-Math.PI/2);pool.push([-2.36,-6.57]);arc(-2.36,-5.78,.79,-Math.PI/2,-Math.PI);pool.push([-3.15,-3.57]);arc(-3.40,-2.72,.86,-1.28,1.08,18);
export const BATH_POOL=pool;
export const POOL_STAIR={x:-2,width:.95,start:-1.58,tread:.22,count:6,rise:.165};
export const BATH_ARRIVAL={x:0,z:3.05,yaw:0,pitch:-.035};
export const SHOWER_HEADS=[-1.65,-3.10,-4.55,-6.0].map(z=>({x:-7.25,z}));
export function insidePolygon(x,z,p){let inside=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
export function bathFloor(x,z){if(inSpa(x,z))return spaFloor(x,z);if(x>-2.48&&x<-1.53&&z<-1.58&&z>-2.92)return-Math.min(6,Math.ceil((-z-1.58)/.22))*.165;return insidePolygon(x,z,BATH_POOL)?-.99:0;}
export function bathShowerAt(x,z,r=.66){return SHOWER_HEADS.findIndex(p=>Math.hypot(p.x-x,p.z-z)<r);}
export function bathUnderShower(x,z){return bathShowerAt(x,z,.34)>=0;}
export function bathAllowed(x,z){
 if(inSpaPortal(x,z))return true;
 if(inSpa(x,z))return spaAllowed(x,z);
 const lobby=x>-2.32&&x<2.32&&z>-.16&&z<4.03;
 const poolroom=x>-3.83&&x<3.83&&z> -6.78&&z<.12;
 const showers=x>-8.02&&x< -4.25&&z> -6.63&&z<-.84;
 const link=x>-4.6&&x<-3.6&&z>-2.08&&z<-.87;
 if(!(lobby||poolroom||showers||link))return false;
 if(Math.abs(z)<.22&&Math.abs(x)>.82)return false;
 if(lobby&&x>.17&&x<2.34&&z>.57&&z<1.85)return false;
 if(lobby&&Math.hypot(x+2,z-2.85)<.48)return false;
 for(const h of SHOWER_HEADS.slice(0,3))if(x<-6.6&&Math.abs(z-(h.z-.725))<.27)return false;
 if(lobby&&Math.abs(x+2.02)<.44&&Math.abs(z-.86)<.44)return false;
 if(showers&&Math.abs(x+5.38)<.58&&z> -5.54&&z< -3.10)return false;
 if(showers&&Math.hypot(x+4.79,z+.98)<.35)return false;
 if(poolroom&&(x>3.40||z< -6.43||(x< -3.45&&z< -2.55)))return false;
 for(const p of [[-3.62,-2.30],[-3.62,-.48],[-3.64,-4.4],[-3.55,-6.65],[0,-6.74],[3.55,-6.65],[3.65,-3.30],[3.63,-.48]])if(Math.hypot(x-p[0],z-p[1])<.37)return false;
 return true;
}
export function resolveBath(previous,next){const valid=q=>bathAllowed(q.x,q.z)&&Math.abs(bathFloor(previous.x,previous.z)-bathFloor(q.x,q.z))<.19;if(valid(next))return next;const x={x:next.x,z:previous.z},z={x:previous.x,z:next.z};return valid(x)?x:valid(z)?z:{x:previous.x,z:previous.z};}
