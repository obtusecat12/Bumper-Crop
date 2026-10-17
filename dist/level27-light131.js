// V131-L27-cliff: baked cave lighting (reference: show-cave photo — hidden warm-white
// spots on cream flowstone, near-black umber rock, a little cold blue in the cracks).
// Pure maths, no THREE: shared by the offline shell mesher (adds SDF shadows) and the
// runtime props (stair stones, flowstone curtains, stalactites, floor), so they match.
// Colours are linear RGB multipliers applied to albedo as emitted light.
export const BAKE_SPOTS=Object.freeze([
 // Hero flowstone curtain on the far (+z) wall, seen when walking down the stair.
 {id:'hero',p:[1.05,3.05,-.55],t:[-.35,1.35,2.30],c:[1.00,.86,.62],power:7.0,cos0:.66,cos1:.92,range:6.5},
 // Pale deposit zone between the two waterfalls.
 {id:'pale',p:[1.30,2.95,.95],t:[-.60,1.20,-2.15],c:[1.00,.90,.70],power:6.0,cos0:.68,cos1:.93,range:6.0},
 // West cascade mouth and its water curtain.
 {id:'cascade',p:[.55,2.70,.10],t:[-2.05,1.55,-.95],c:[1.00,.82,.55],power:4.4,cos0:.74,cos1:.95,range:5.0},
 // Lamp tucked in a niche of the left cliff, washing a few stair treads (photo, lower left).
 {id:'stair',p:[4.80,2.62,-1.55],t:[4.25,.85,-1.10],c:[1.00,.74,.42],power:4.6,cos0:.45,cos1:.84,range:4.2},
 // Platform flowstone on the enlarged dry annex's far wall.
 {id:'annex',p:[3.80,2.95,-.10],t:[6.75,1.40,2.05],c:[1.00,.86,.64],power:5.6,cos0:.66,cos1:.92,range:6.0}
]);
// Real-time lights kept for wet highlights / bathers / reflections (2 hidden spots
// share the 2 shadow casters of the old pool lanterns). Point lanterns: tunnel + annex.
export const LIVE_SPOTS=Object.freeze([
 {p:[1.05,3.05,-.55],t:[-.35,1.35,2.30],color:0xffe2b8,power:9,angle:.62,penumbra:.65,range:6.5,shadow:true},
 {p:[1.30,2.95,.95],t:[-.60,1.20,-2.15],color:0xffe6c2,power:8,angle:.58,penumbra:.7,range:6.5,shadow:true}
]);
export const COOL_FILL=[.030,.060,.100];
// faint warm bounce so umber rock forms still read in the dark (photo: brown, not void)
export const WARM_BASE=[.050,.034,.022];
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const sstep=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
// position p, unit normal n, cavity 0..1 (1 = deep crack), shadow(spot,p)->0..1 optional.
export function bakeAt(p,n,cavity=0,shadow=null){
 let r=0,g=0,b=0;
 for(const s of BAKE_SPOTS){
  const lx=s.p[0]-p[0],ly=s.p[1]-p[1],lz=s.p[2]-p[2],d=Math.hypot(lx,ly,lz)||1e-4,ux=lx/d,uy=ly/d,uz=lz/d;
  const ndl=Math.max(0,n[0]*ux+n[1]*uy+n[2]*uz);if(ndl<=0)continue;
  const ax=s.t[0]-s.p[0],ay=s.t[1]-s.p[1],az=s.t[2]-s.p[2],al=Math.hypot(ax,ay,az);
  const cone=sstep(s.cos0,s.cos1,-(ux*ax+uy*ay+uz*az)/al);if(cone<=0)continue;
  const fall=s.power/(1+d*d*1.1)*(1-sstep(s.range*.6,s.range,d));
  let k=ndl*cone*fall;if(k<=1e-4)continue;if(shadow)k*=shadow(s,p);
  r+=s.c[0]*k;g+=s.c[1]*k;b+=s.c[2]*k;
 }
 // cold blue only lives in cracks and under eaves; open faces stay near-black.
 const up=.55+.45*n[1];r+=WARM_BASE[0]*up;g+=WARM_BASE[1]*up;b+=WARM_BASE[2]*up;
 const cav=clamp(cavity);r+=COOL_FILL[0]*cav;g+=COOL_FILL[1]*cav;b+=COOL_FILL[2]*cav;
 return [r,g,b];
}
// Flowstone curtains (main-room walls by wall angle a, or the platform wall by
// ellipse angle e). The mesher keeps the plain wall under them (no strata relief).
export const FLOWSTONES=Object.freeze([
 {id:'hero',a:1.72,half:.40,y0:.55,y1:2.95,depth:.30,folds:9,seed:1},
 {id:'pale',a:4.40,half:.30,y0:.42,y1:2.55,depth:.24,folds:7,seed:2},
 {id:'cascadeR',a:3.12,half:.17,y0:1.25,y1:2.70,depth:.16,folds:4,seed:3},
 {id:'west',a:2.45,half:.16,y0:1.30,y1:2.85,depth:.15,folds:4,seed:5},
 {id:'annex',e:.62,half:.30,y0:.62,y1:3.05,depth:.26,folds:8,seed:4}
]);
