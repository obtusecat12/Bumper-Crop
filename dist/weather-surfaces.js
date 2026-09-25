import {surfaceHeight,buildingLocal,pondShoreDistance} from './world.js?v=32';
import {REFERENCE_BARN as B} from './reference-barn-layout.js?v=32';
import {farmRainRoof} from './weather-farm-roofs.js?v=32';
const roofRecords=new WeakMap();
function roofs(chunk){if(roofRecords.has(chunk))return roofRecords.get(chunk);let found=[];chunk.group?.traverse(o=>{if(o.userData?.rainRoofs)found=o.userData.rainRoofs;});roofRecords.set(chunk,found);return found;}
// Queries only loaded, authoritative chunks. Missing terrain produces no impacts.
export function weatherSurface(x,z,state,chunks,pad=0){
 const dx=Math.floor(x/64),dz=Math.floor(z/64),chunk=chunks.get(`${state.cx+BigInt(dx)},${state.cz+BigInt(dz)}`),f=chunk?.field;
 if(!f)return null;const px=x-dx*64,pz=z-dz*64;
 let y=surfaceHeight(px,pz,f),roof=-1000,water=false;
 if(f.type==='pond'&&pondShoreDistance(px,pz,f)<0){y=Math.max(y,f.lakeY);water=true;}
 if(f.type==='building'){const p=buildingLocal(px,pz,f),scale=f.buildingScale||1,lx=p.x/scale,lz=p.z/scale;for(const r of roofs(chunk)){if(lx>=r.minX-pad/scale&&lx<=r.maxX+pad/scale&&lz>=r.minZ-pad/scale&&lz<=r.maxZ+pad/scale){const rx=Math.max(r.minX,Math.min(r.maxX,lx+Math.sign(r.yx)*pad/scale)),rz=Math.max(r.minZ,Math.min(r.maxZ,lz+Math.sign(r.yz)*pad/scale));roof=Math.max(roof,(f.buildingY??y)+.035+scale*(r.y0+r.yx*rx+r.yz*rz));}}}
 if(f.farm)roof=Math.max(roof,farmRainRoof(px+f.farm.x,pz+f.farm.z,pad));
 if(state.cx>=-1n&&state.cx<=3n&&state.cz>=-4n&&state.cz<=0n){
  const bx=x-(B.x-Number(state.cx)*64),bz=z-(B.z-Number(state.cz)*64);
  if(Math.abs(bx)<=12.32+pad&&bz>=-6.1-pad&&bz<=6.14+pad){
   const rz=Math.max(-6.1,Math.min(6.14,bz< -1.6?Math.min(-1.6,bz+pad):Math.max(-1.6,bz-pad)));
   roof=Math.max(roof,B.y+.07+(rz< -1.6?5.15+(rz+5.8)*4.10/4.2:9.25-(rz+1.6)*5.95/7.4));
  }
  const dormerHalf=B.doorWidth/2+.36;
  if(Math.abs(bx-B.doorX)<=dormerHalf+pad&&bz>=.98-pad&&bz<=6.32+pad)roof=Math.max(roof,B.y+8.12-Math.max(0,Math.abs(bx-B.doorX)-pad)*1.21/dormerHalf);
 }

 return {y,roof,water,f,px,pz};
}
