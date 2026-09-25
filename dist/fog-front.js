// The front is fixed to the place where weather starts, not the moving camera.
// BigInt cell differences keep it stable across floating-origin rebases.
export const FOG_FRONT_SECONDS=90,FOG_MAX_DIST=640;
export const FOG_WIND=Object.freeze([-.8,-.6]);
const clamp=x=>Math.max(0,Math.min(1,x));
const metres=(now,then)=>{const d=typeof now==='bigint'&&typeof then==='bigint'?Number(now-then)*64:Number(now)-Number(then);return Math.max(-1e7,Math.min(1e7,d));};
export class FogFront {
 constructor(){this.active=false;this.serial=-1;this.progress=0;this.amount=0;this.offsetX=0;this.offsetZ=0;}
 update({event={},mist=0,camera,originX=0n,originZ=0n}={}){
  const active=event.kind==='fog';
  if(active&&(!this.active||event.serial!==this.serial)){
   this.anchorX=camera?.position.x||0;this.anchorZ=camera?.position.z||0;
   this.originX=originX;this.originZ=originZ;this.serial=event.serial;
  }
  this.active=active;this.progress=active?clamp(event.fogProgress||0):0;
  this.amount=active?clamp(mist):0;
  if(active){this.offsetX=metres(originX,this.originX)-this.anchorX;this.offsetZ=metres(originZ,this.originZ)-this.anchorZ;}
  return this;
 }
}
