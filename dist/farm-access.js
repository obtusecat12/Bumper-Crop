// Authored Kephart access: one canonical curve, sampled identically on both
// sides of streamed tiles. Buildings, lake beds and the arrival path stay put.
const smooth=(a,b,v)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t)};
const curves=[[[0,106],[0,113],[10,112],[22,112]],[[22,112],[70,112],[116,111],[151,112]],[[151,112],[157,112],[159.7,110],[159.7,107.5]]];
const segments=[];let along=0;
for(const curve of curves){let prev=curve[0];for(let i=1;i<=32;i++){const t=i/32,s=1-t,p=[s*s*s*curve[0][0]+3*s*s*t*curve[1][0]+3*s*t*t*curve[2][0]+t*t*t*curve[3][0],s*s*s*curve[0][1]+3*s*s*t*curve[1][1]+3*s*t*t*curve[2][1]+t*t*t*curve[3][1]],len=Math.hypot(p[0]-prev[0],p[1]-prev[1]);segments.push({a:prev,b:p,len,along});along+=len;prev=p;}}
export function farmAccessContext(cx,cz){if(cx< -1n||cx>3n||cz<1n||cz>2n)return null;return {x:Number(cx)*64,z:Number(cz)*64};}
export function farmAccessSample(x,z,context,out={}){
 out.distance=1e4;out.along=0;out.yard=0;if(!context)return out;
 x+=context.x;z+=context.z;
 if(x< -4||x>181||z<98||z>121)return out;
 for(const s of segments){const vx=s.b[0]-s.a[0],vz=s.b[1]-s.a[1],u=Math.max(0,Math.min(1,((x-s.a[0])*vx+(z-s.a[1])*vz)/(s.len*s.len))),d=Math.hypot(x-s.a[0]-vx*u,z-s.a[1]-vz*u);if(d<out.distance){out.distance=d;out.along=s.along+u*s.len;}}
 const ax=Math.abs(x-150)-13,az=Math.abs(z-112)-2.4,edge=Math.hypot(Math.max(ax,0),Math.max(az,0))+Math.min(Math.max(ax,az),0)-1.6;
 out.yard=1-smooth(-.25,1.2,edge);return out;
}
export const KEPHART_ACCESS_SEGMENTS=segments;
