// Small damped surface model for the HUD vial. Only the two liquid paths move;
// the glass/cork artwork remains a cached image. Motion never changes a stat.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function createVialMotion(){
 let previous=null,slope=0,slopeSpeed=0,ripple=0,rippleSpeed=0;
 const result={slope:0,ripple:0};
 return{reset(){previous=null;slope=slopeSpeed=ripple=rippleSpeed=0;result.slope=result.ripple=0;},
 step({dt,yaw,vx=0,vz=0,vy=0,grounded=true,phase=0,reduced=false}){
  dt=clamp(Number(dt)||0,0,.05);
  if(reduced){previous=null;slope=slopeSpeed=ripple=rippleSpeed=0;result.slope=result.ripple=0;return result;}
  const side=Math.cos(yaw)*vx-Math.sin(yaw)*vz,speed=Math.hypot(vx,vz);
  let acceleration=0,turn=0,landing=0;
  if(previous&&dt>0){
   acceleration=clamp((side-previous.side)/dt,-18,18);
   turn=clamp(Math.atan2(Math.sin(yaw-previous.yaw),Math.cos(yaw-previous.yaw))/dt,-4,4);
   if(grounded&&!previous.grounded)landing=clamp(-previous.vy,0,8)*.6;
  }
  previous={side,yaw,vy,grounded};
  const stride=grounded?Math.sin(phase*2)*Math.min(speed/5.4,1):0;
  const target=clamp(-acceleration*.009-turn*.022+stride*.022,-.24,.24);
  // Substeps keep the critically damped/slightly underdamped response stable
  // after a slow frame. No accumulated time or simulation while paused.
  const steps=Math.max(1,Math.ceil(dt/.012)),h=dt/steps;
  rippleSpeed+=landing;
  for(let i=0;i<steps;i++){
   slopeSpeed+=((target-slope)*62-slopeSpeed*9)*h;slope+=slopeSpeed*h;
   rippleSpeed+=((Math.abs(target)*2+Math.abs(stride)*.04-ripple)*90-rippleSpeed*8)*h;ripple+=rippleSpeed*h;
  }
  if(Math.abs(slope)<.00005&&Math.abs(slopeSpeed)<.00005)slope=slopeSpeed=0;
  if(Math.abs(ripple)<.00005&&Math.abs(rippleSpeed)<.00005)ripple=rippleSpeed=0;
  result.slope=clamp(slope,-.28,.28);result.ripple=clamp(ripple,0,.35);return result;
 }};
}
