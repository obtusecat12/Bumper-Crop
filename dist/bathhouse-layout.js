// One metre-scale authority for the empty pool, its deck and all indoor routes.
export const BATH_POOL=[[-2.58,-1.58],[2.45,-1.58],[3.26,-2.20],[3.26,-6.0],[2.72,-6.57],[-2.62,-6.57],[-3.15,-6.05],[-3.15,-2.66],[-2.99,-2.08]];
export const BATH_ARRIVAL={x:0,z:3.05,yaw:0,pitch:-.035};
export const SHOWER_HEADS=[-1.65,-3.10,-4.55,-6.0].map(z=>({x:-7.33,z}));
export function insidePolygon(x,z,p){let inside=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
export function bathFloor(x,z){if(x>-2.48&&x<-1.53&&z<-1.58&&z>-2.92)return-Math.min(6,Math.ceil((-z-1.58)/.22))*.165;return insidePolygon(x,z,BATH_POOL)?-.99:0;}
export function bathShowerAt(x,z,r=.66){return SHOWER_HEADS.findIndex(p=>Math.hypot(p.x-x,p.z-z)<r);}
export function bathUnderShower(x,z){return bathShowerAt(x,z,.34)>=0;}
export function bathAllowed(x,z){
 const lobby=x>-2.32&&x<2.32&&z>-.16&&z<4.03;
 const poolroom=x>-3.83&&x<3.83&&z> -6.78&&z<.12;
 const showers=x>-8.02&&x< -4.25&&z> -6.63&&z<-.84;
 const link=x>-4.6&&x<-3.6&&z>-2.08&&z<-.87;
 if(!(lobby||poolroom||showers||link))return false;
 if(Math.abs(z)<.22&&Math.abs(x)>.82)return false;
 if(lobby&&x>.17&&x<2.34&&z>.57&&z<1.85)return false;
 if(lobby&&x<-1.5&&z>1.8&&z<3.4)return false;
 for(const h of SHOWER_HEADS.slice(0,3))if(x<-6.6&&Math.abs(z-(h.z-.725))<.27)return false;
 for(const p of [[-3.62,-2.30],[-3.62,-.48],[-3.64,-4.4],[-3.55,-6.65],[0,-6.74],[3.55,-6.65],[3.65,-3.30],[3.63,-.48]])if(Math.hypot(x-p[0],z-p[1])<.37)return false;
 return true;
}
export function resolveBath(previous,next){const valid=q=>bathAllowed(q.x,q.z)&&Math.abs(bathFloor(previous.x,previous.z)-bathFloor(q.x,q.z))<.19;if(valid(next))return next;const x={x:next.x,z:previous.z},z={x:previous.x,z:next.z};return valid(x)?x:valid(z)?z:{x:previous.x,z:previous.z};}
