// Inward-positive shoreline SDF. Shared by collision and rendered terrain.
const sat=x=>Math.max(0,Math.min(1,x));
const smooth=(a,b,x)=>{const t=sat((x-a)/(b-a));return t*t*(3-2*t);};
function hash(x,z){let n=Math.imul(x,374761393)^Math.imul(z,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/2147483647.5-1;}
function noise(x,z){const ix=Math.floor(x),iz=Math.floor(z),a=smooth(0,1,x-ix),b=smooth(0,1,z-iz);return (hash(ix,iz)*(1-a)+hash(ix+1,iz)*a)*(1-b)+(hash(ix,iz+1)*(1-a)+hash(ix+1,iz+1)*a)*b;}
export function lakeFBM(x,z){let h=0,a=.5;for(let i=0;i<4;i++){h+=a*noise(x,z);x=x*2.03+13.7;z=z*2.03-8.3;a*=.5;}return h;}
export function lakeBedDepth(inward,x,z,depth=2.5){
 const d=Math.max(0,inward),basin=Math.max(4.8,depth*2.05);
 // Eight metres of walkable shallows, a distinct but continuous shelf,
 // then a broad deep floor. fBm is suppressed completely at the shore.
 return .48*smooth(0,8,d)+1.32*smooth(8,17,d)+(basin-1.8)*smooth(17,39,d)
   +lakeFBM(x*.095,z*.095)*.24*smooth(6,24,d);
}
