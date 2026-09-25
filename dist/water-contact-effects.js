import {BodyWaterCrossing} from './water-state.js?v=36';
// The long shallow bank separates foot contact from head immersion. Both are
// physical displacements; every impact is owned by the world event, not camera.
export class WaterContactEffects {
 constructor(impact){this.impact=impact;this.body=new BodyWaterCrossing();this.reset();}
 reset(){this.body.reset();this.stride=0;this.cooldown=0;}
 update(dt,state,input,crossing){
  this.cooldown=Math.max(0,this.cooldown-dt);
  const valid=input.hasWater&&input.shore<=0;
  const hit=this.body.update(state,input.feet,input.level,valid,input.fallSpeed);
  if(crossing===1){this.impact.emit(1.05+Math.min(.45,Math.abs(input.cameraVelocity?.y||0)*.12),state,input.level);this.cooldown=.42;this.stride=0;return 'head';}
  if(hit.power>0&&this.cooldown===0){this.impact.emit(hit.power,hit,input.level);this.cooldown=.35;this.stride=0;return 'feet';}
  // Step wakes keep ankle/waist wading alive while the head is still in air.
  const depth=input.level-input.feet;
  if(valid&&depth>.03&&depth<1.65&&input.grounded){this.stride+=input.moved;
   if(this.stride>1.35&&this.cooldown===0){this.stride=0;this.impact.emit(.20,state,input.level);this.cooldown=.60;return 'stride';}
  }else this.stride=0;
  return null;
 }
}
