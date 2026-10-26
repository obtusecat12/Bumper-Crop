// Metres / seconds. Keep special bathing, seated and transition movement in main.
export const MOVEMENT150=Object.freeze({
 indoorWalk:2.5, indoorRun:5.6, outdoorWalk:3, outdoorRun:6.4,
 crouchSpeed:1.1, sneakSpeed:.9, eye:1.77, crouchEye:1.05, sneakEye:1.42,
 gravity:12.2, jumpHeight:.70, coyote:.10, buffer:.12, jumpCost:4
});

// Input is queued once on key-down, aged in simulation time, consumed once.
// Ground detection remains with each world's real slabs/collision authority.
export class JumpController150 {
 constructor(){this.reset();}
 reset(){this.buffer=0;this.coyote=0;}
 request(){this.buffer=MOVEMENT150.buffer;}
 advance(dt,grounded){
  this.buffer=Math.max(0,this.buffer-dt);
  this.coyote=grounded?MOVEMENT150.coyote:Math.max(0,this.coyote-dt);
 }
 consume(state,allowed=true){
  if(!allowed){this.buffer=0;return false;}
  if(this.buffer<=0||(!state.grounded&&this.coyote<=0)||state.stamina<=5)return false;
  this.reset();state.vy=Math.sqrt(2*MOVEMENT150.gravity*MOVEMENT150.jumpHeight);
  state.grounded=false;state.stamina=Math.max(0,state.stamina-MOVEMENT150.jumpCost);
  return true;
 }
}

export function movementStance150(keys,state,touchRun=false,outdoor=false){
 const crouch=keys.has('KeyC'),sneak=keys.has('ControlLeft');
 const running=!crouch&&!sneak&&(keys.has('ShiftLeft')||keys.has('ShiftRight')||touchRun)&&state.stamina>4;
 return {crouch,sneak,running,
  speed:sneak?MOVEMENT150.sneakSpeed:crouch?MOVEMENT150.crouchSpeed:running?(outdoor?MOVEMENT150.outdoorRun:MOVEMENT150.indoorRun):(outdoor?MOVEMENT150.outdoorWalk:MOVEMENT150.indoorWalk),
  eye:crouch?MOVEMENT150.crouchEye:sneak?MOVEMENT150.sneakEye:MOVEMENT150.eye,
  noise:sneak?.18:crouch?.35:running?1.1:1};
}
