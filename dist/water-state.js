export const WATER_STATES=Object.freeze(['dry','rain','entryWash','submerged','exitRupture']);
// One authoritative head arbiter; the body crossing detector is independent.
export class WaterState {
 constructor(){this.result={submerged:false,crossing:0};this.reset();}
 reset(){this.state='dry';this.hasWater=false;this.wet=null;this.age=0;this.washWeight=0;this.exitAge=99;this.flash=0;this.result.submerged=false;this.result.crossing=0;}
 update(dt,s){
  const valid=s.hasWater&&s.shore<.1&&Number.isFinite(s.level+s.cameraHeight);
  this.hasWater=valid;
  const wet=valid&&(this.wet?s.cameraHeight<s.level+.028:s.cameraHeight<s.level-.018);
  const crossing=this.wet===null?0:wet!==this.wet?(wet?1:-1):0;
  this.wet=wet;this.result.submerged=wet;this.result.crossing=crossing;
  if(crossing===1){this.state='entryWash';this.age=0;this.washWeight=1;this.exitAge=99;}
  else if(crossing===-1){this.state='exitRupture';this.age=0;this.exitAge=0;this.washWeight=1;}
  else {this.age+=Math.max(0,dt);this.exitAge+=Math.max(0,dt);}
  if(wet){if(this.state!=='entryWash'||this.age>=.28)this.state='submerged';this.washWeight=this.state==='entryWash'?1:0;}
  else if(this.state==='exitRupture'&&this.age<.78)this.washWeight=Math.max(0,1-this.age/.78);
  else {this.state=s.rain>.005&&!s.sheltered?'rain':'dry';this.washWeight=0;}
  this.flash=this.exitAge<.15?Math.pow(1-this.exitAge/.15,2):0;
  return this.result;
 }
}
export class BodyWaterCrossing {
 constructor(){this.hit={x:0,z:0,cx:0n,cz:0n,waterDepth:0,power:0,yaw:0,velocity:null};this.reset();}
 reset(){this.known=false;this.y=Infinity;this.x=this.z=0;this.cx=this.cz=0n;}
 update(s,feet,level,valid,fallSpeed=0){
  this.hit.power=0;
  if(this.known&&valid&&this.y>level&&level>=feet){
   const t=Math.max(0,Math.min(1,(this.y-level)/(this.y-feet))),px=this.x+Number(this.cx-s.cx)*64,pz=this.z+Number(this.cz-s.cz)*64;
   this.hit.x=px+(s.x-px)*t;this.hit.z=pz+(s.z-pz)*t;this.hit.cx=s.cx;this.hit.cz=s.cz;
   this.hit.yaw=s.yaw||0;this.hit.velocity=s.velocity;this.hit.power=.65+Math.min(1.1,Math.abs(fallSpeed)*.14);
  }
  this.known=true;this.y=feet;this.x=s.x;this.z=s.z;this.cx=s.cx;this.cz=s.cz;return this.hit;
 }
}
