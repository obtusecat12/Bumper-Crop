/* V65 shared creek authority — scene and implicit terrain use this exact route.
 * The channel is carved into ONE geological support mass; no open bed sheet.
 * Factory shared by layout/mesher/scene: meters, y up. THREE is caller-owned.
 */
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
export const CREEK_KNOTS=[
 [2.040,1.822,-10.50,1.00],
 [2.025,1.818,-8.80,1.00],
 [2.065,1.814,-7.20,1.00],
 [2.025,1.810,-5.55,1.00],
 [2.085,1.805,-4.00,1.00],
 [2.055,1.800,-3.30,.98],
 [1.955,1.780,-2.88,.90],
 [1.610,1.750,-2.58,.74],
 [1.300,1.720,-2.36,.59],
 // Final point is replaced with the actual wall surface at the bed lip.
 [.935,1.700,-2.167,.46]
];

export function createCreekAuthority(T,L){
 const knots=CREEK_KNOTS.map(p=>p.slice()),lipY=1.700,lipDepth=.14,a=5.12;
 const wall=L.wallPoint(a,lipY-lipDepth),rr=Math.hypot(wall[0],wall[2]);
 // 14 mm air-side penetration avoids a floating gap at the carved rock mouth.
 knots[knots.length-1]=[wall[0]*(1-.014/rr),lipY,wall[2]*(1-.014/rr),.46];
 const points=knots.map(p=>new T.Vector3(p[0],p[1],p[2]));
 const curve=new T.CatmullRomCurve3(points,false,'centripetal'),N=192,spine=[];
 for(let i=0;i<=N;i++){const t=i/N,p=curve.getPoint(t),q=t*(knots.length-1),j=Math.min(knots.length-2,Math.floor(q)),f=q-j;spine.push({x:p.x,y:p.y,z:p.z,t,width:knots[j][3]*(1-f)+knots[j+1][3]*f});}
 const lip=spine.at(-1),previous=spine.at(-2),length=Math.hypot(lip.x-previous.x,lip.z-previous.z),out=[(lip.x-previous.x)/length,(lip.z-previous.z)/length];
 function section(x,z){let best=null,d2=Infinity;
  for(let i=0;i<N;i++){const a=spine[i],b=spine[i+1],dx=b.x-a.x,dz=b.z-a.z,len2=dx*dx+dz*dz,u=clamp(((x-a.x)*dx+(z-a.z)*dz)/len2),cx=a.x+dx*u,cz=a.z+dz*u,q=(x-cx)**2+(z-cz)**2;
   if(q<d2){d2=q;const len=Math.sqrt(len2);best={x:cx,z:cz,waterY:a.y+(b.y-a.y)*u,width:a.width+(b.width-a.width)*u,t:a.t+(b.t-a.t)*u,side:[-dz/len,dx/len],offset:((x-cx)*(-dz)+(z-cz)*dx)/len};}}
  best.distance=Math.sqrt(d2);best.front=(x-lip.x)*out[0]+(z-lip.z)*out[1];best.depth=.18-.04*smooth(.78,1,best.t);best.bankMargin=.18-.05*smooth(.78,1,best.t);return best;
 }
 function bedHeight(s){const half=s.width*.5,u=s.distance/half;
  // Visible water edge meets its carved stone shore exactly. The dry shoulder
  // is y=1.88 on the tunnel section and gently falls with the creek bend.
  const dryY=s.t<.56?1.88:s.waterY+.065;
  return u<=1?s.waterY-s.depth+s.depth*u*u*u:s.waterY+(dryY-s.waterY)*smooth(0,s.bankMargin,s.distance-half);
 }
 function tunnelFloor(x,z,s=section(x,z)){
  // Use this IN the tunnel SDF instead of its flat 1.58 m underside; remove
  // the separate y=1.88 rectangular floor mesh. Keep walking authority1.88.
  if(z<-3.10)return s.distance<=s.width*.5+s.bankMargin?bedHeight(s):1.88;
  return null;
 }
 function air(s,y){
  // Union this AIR field with room/tunnel/access. It replaces the four round
  // point-based creek carving volumes. At the mouth it opens onto cave air.
  return Math.min(s.width*.5+s.bankMargin-s.distance,3.45-y,y-bedHeight(s),.055-s.front);
 }
 function support(s,x,y,z){
  // Negative means solid rock. Subtract from the AIR field AFTER its unions:
  // d=Math.min(d,support(...)). This fills the missing mass under the bend.
  // It ends at the lip, roots in the geological floor outside the pool, and
  // always stays above y=.14 inside the surveyed water polygon.
  const limit=L.radialLimit(x||.000001,z||.000001),r=Math.hypot(x,z),inside=limit-r;
  // Keep a 120 mm horizontal air buffer outside the survey too, larger than
  // the .085 m mesher spacing; interpolation must not narrow the waterline.
  const bottom=inside>=0?.14+.65*smooth(0,.35,inside):.14-.28*smooth(.12,.27,-inside);
  const top=bedHeight(s),frontLimit=.018+.10*(y-top);
  return Math.max(s.distance-(s.width*.5+s.bankMargin+.12),y-top,bottom-y,s.front-frontLimit,-3.62-z);
 }
 function groundedCobble(t,side=1,radius=.07,phase=0){
  const c=curve.getPoint(clamp(t)),tan=curve.getTangent(clamp(t)),sideV=new T.Vector3(-tan.z,0,tan.x).normalize(),q=section(c.x,c.z),off=side*(q.width*.5+.035+.027*Math.sin(phase*1.73));
  const x=c.x+sideV.x*off,z=c.z+sideV.z*off,s=section(x,z),bed=bedHeight(s);
  // 35% of the vertical radius is embedded, including the geometry's 12%
  // perturbation allowance. Never use waterY minus a constant for stones.
  return {position:[x,bed+radius*.65,z],scale:[radius*1.35,radius,radius*1.65],bedY:bed,waterY:s.waterY,width:s.width};
 }
 const fall=[];for(let i=0;i<=24;i++){const u=i/24,y=lipY*(1-u)+.012*u,wp=L.wallPoint(a,y),wr=Math.hypot(wp[0],wp[2]);let r=Math.min(Math.hypot(lip.x,lip.z),wr-.035);if(i===0)r=Math.hypot(lip.x,lip.z);fall.push([Math.cos(a)*r,y,Math.sin(a)*r]);}
 // Prevent a waterfall from following an outward-curving lower wall upward
 // or back into its parent rock. It falls inward/down from the actual lip.
 for(let i=1;i<fall.length;i++){const prev=Math.hypot(fall[i-1][0],fall[i-1][2]),r=Math.min(prev,Math.hypot(fall[i][0],fall[i][2]));fall[i][0]=Math.cos(a)*r;fall[i][2]=Math.sin(a)*r;}
 return {knots,points,curve,spine,lip,fall,section,bedHeight,tunnelFloor,air,support,groundedCobble};
}

export const INTEGRATION_NOTES={
 remove:['Full-width dry tunnel path beside creek geoGrid','Continuous 1.1m natural inflow creek bed and rock banks geoGrid','64 cobbles placed at waterY−.035','Old streamPath four point-sized creek air bores'],
 mesher:['Construct authority once. Cache section(x,z) outside the y loop.','Replace tunnel y−1.58 with y−creek.tunnelFloor(x,z,section).','Union creek.air(section,y) with existing room/access air.','Then d=Math.min(d,creek.support(section,x,y,z)) for the bend; this supplies real rock thickness.','Keep poolFloor, CAVE_PLAN and water y=0 unchanged. Re-run exact waterline section QA after remesh.'],
 scene:['Use creek.points for the water path and use per-section width rather than constant1.02.','Do not emit a separate bed or tunnel floor surface; the unified shell owns these surfaces.','Attach wet/dry geology by creek distance and height, not a rectangular texture card.','Use groundedCobble on bank surface, with near-mouth cobbles t<.97.','Create the cascade from creek.fall; its first point is exactly the physical lip.'],
 validation:['Tunnel dry core remains y1.88, width x2.98–4.57.','Do not alter stairs or access air carve; new support is confined left of them.','Support bottom is at least y.14 everywhere inside the18.58m² pool, preserving y0.','For realism, blend rock support into shell with compatible normals/material; never add an unrooted boxed tray.']
};
