export {farmViewTarget} from './farm-layout.js?v=34';
// A long lens only needs a narrow corridor, not a giant surrounding square.
// Whole-tile conservative bounds include foliage and the fog concealment margin.
export function photoCorridorTiles(state,view){
 const dx=view.focusX-view.x,dz=view.focusZ-view.z,len=Math.hypot(dx,dz),ux=dx/len,uz=dz/len;
 const tangent=Math.tan(view.fov*Math.PI/360)*1.5+.035;
 const n=Math.ceil((view.range+48)/64),items=[];
 for(let z=-n;z<=n;z++)for(let x=-n;x<=n;x++){
  const px=x*64+32-state.x,pz=z*64+32-state.z,along=px*ux+pz*uz,across=Math.abs(px*uz-pz*ux);
  if(along< -50||along>view.range+50||across>50+Math.max(0,along)*tangent)continue;
  const cx=state.cx+BigInt(x),cz=state.cz+BigInt(z);items.push({cx,cz,key:`${cx},${cz}`,level:2,d:x*x+z*z+10});
 }
 return items;
}
