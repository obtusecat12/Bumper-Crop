// Roof profiles match kephart-models.js, including overhangs and porches.
import {FARM,FARM_PLACEMENTS} from './farm-layout.js?v=57';

const farmRoofTransforms=Object.entries(FARM_PLACEMENTS).map(([kind,p])=>({
 kind,x:p.x,z:p.z,y:p.y||0,c:Math.cos(p.angle||0),s:Math.sin(p.angle||0),
 sx:p.scale||p.scaleX||1,sy:p.scale||p.scaleY||1,sz:p.scale||p.scaleZ||1
}));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

// Inputs are farm-local metres: px + f.farm.x, pz + f.farm.z.
// Output is world Y. Model heights include a small guard above roof sheets,
// raised seams and ridge caps; no generic tall volume above low buildings.
export function farmRainRoof(farmX,farmZ,pad=0){
 let result=-1000;
 for(const p of farmRoofTransforms){
  const dx=farmX-p.x,dz=farmZ-p.z;
  const x=(p.c*dx-p.s*dz)/p.sx,z=(p.s*dx+p.c*dz)/p.sz;
  const px=pad/p.sx,pz=pad/p.sz,ax=Math.abs(x),az=Math.abs(z);
  let h=-1000;
  if(p.kind==='barn'){
   if(ax<=7.38+px&&az<=11.86+pz){const a=Math.min(Math.max(0,ax-px),7.38);h=(a<=4.65?12.15-a*1.69/4.65:10.46-(a-4.65)*4.11/2.35)+.16;}
   // Small door hoods extend slightly beyond the main gable's end overhang.
   for(const side of [-1,1]){const width=side>0?5.3:4.45,doorH=side>0?4.82:4.28,cz=side*11.74;
    if(Math.abs(x+.35)<=(width+.47)/2+px&&Math.abs(z-cz)<=.2521+pz)
     h=Math.max(h,doorH+.57+.0335/Math.cos(.1)-side*Math.tan(.1)*clamp(z-cz-side*pz,-.2521,.2521)+.015);
   }
  }else if(p.kind==='annex'){
   if(ax<=4.30+px&&az<=6.99+pz)h=8.10-.6875*Math.min(Math.max(0,ax-px),4.30)+.13;
   // Model porch: center (4.925,-4.2), rz=-.15, roof center y=3.11.
   if(Math.abs(x-4.925)<=1.071+px&&Math.abs(z+4.2)<=2.575+pz)
    h=Math.max(h,3.11+.05/Math.cos(.15)-Math.tan(.15)*clamp(x-4.925-px,-1.071,1.071)+.02);
  }else if(p.kind==='cottage'){
   if(ax<=12.56+px&&az<=4.16+pz){const a=Math.min(Math.max(0,ax-px),12.56),b=Math.min(Math.max(0,az-pz),4.16);
    h=4.5-1.55*Math.max(b/4.16,Math.max(0,a-8.95)/3.61)+.10;
   }
   // Front porch center z=4.67; +X rotation gives a negative Z slope.
   if(ax<=4.09+px&&Math.abs(z-4.67)<=1.042+pz)
    h=Math.max(h,2.89-Math.tan(.1)*clamp(z-4.67-pz,-1.042,1.042));
  }else if(p.kind==='shed'){
   if(ax<=4.78+px&&az<=8.30+pz)h=4.20-Math.min(Math.max(0,ax-px),4.78)/4.5+.13;
   if(ax<=1.835+px&&Math.abs(z+8.24)<=.2521+pz)
    h=Math.max(h,3.20+.0335/Math.cos(.1)+Math.tan(.1)*clamp(z+8.24+pz,-.2521,.2521)+.015);
  }
  if(h>-999)result=Math.max(result,FARM.y+p.y+p.sy*h);
 }
 return result;
}
