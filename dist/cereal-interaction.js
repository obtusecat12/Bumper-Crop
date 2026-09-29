import * as T from './vendor/three.module.min.js';

// A short, metre-space wake shared by every immutable cereal cell. Moving a
// camera selection never rewrites roots or disconnects the interaction uniforms.
export const WHEAT_WAKE_COUNT=12;
export function createCerealInteraction(wind){
 const trail=Array.from({length:WHEAT_WAKE_COUNT},()=>new T.Vector4(0,0,-100,0));
 const uniforms={uCerealPlayer:wind.player||{value:new T.Vector3(10000,0,10000)},uCerealWake:{value:trail}};
 let origin=null,last=null,head=0;
 const clear=()=>{for(const p of trail)p.w=0;last=null;head=0;};
 function update(originKey){
  const next=originKey.split(',').map(BigInt),time=wind.time.value,p=uniforms.uCerealPlayer.value;
  if(origin){
   const dx=(origin[0]-next[0])*64n,dz=(origin[1]-next[1])*64n;
   if(dx>256n||dx< -256n||dz>256n||dz< -256n)clear();
   else if(dx||dz){for(const q of trail){q.x+=Number(dx);q.y+=Number(dz);}if(last){last.x+=Number(dx);last.z+=Number(dz);}}
  }
  origin=next;
  if(Math.abs(p.x)>512||Math.abs(p.z)>512)return;
  const distance=last?Math.hypot(p.x-last.x,p.z-last.z):Infinity;
  if(distance>6)clear();
  if(!last||distance>=.22){trail[head].set(p.x,p.z,time,1);head=(head+1)%trail.length;last={x:p.x,z:p.z};}
 }
 return {uniforms,trail,update,clear};
}

export const cerealInteractionDeclarations=`
uniform vec3 uCerealPlayer;
uniform vec4 uCerealWake[${WHEAT_WAKE_COUNT}];
vec3 cerealContact(vec3 root, vec2 foot, float weight, float radius){
 vec2 delta=root.xz-foot;float distance=length(delta);
 float force=(1.-smoothstep(.08,radius,distance))*weight;
 vec2 direction=distance>.015?delta/distance:vec2(.707,.707);
 return vec3(direction.x*force,force,direction.y*force);
}
`;
export const cerealInteractionVertex=`
 // Real body contact at standing crop height; roots stay in the soil. The
 // strongest recent bend wins, avoiding explosive sums where footsteps overlap.
 float reachable=1.-smoothstep(2.4,3.3,uCerealPlayer.y-vCerealWorld.y);
 vec3 push=cerealContact(vCerealWorld,uCerealPlayer.xz,reachable,.94);
 for(int i=0;i<${WHEAT_WAKE_COUNT};i++){
  vec4 foot=uCerealWake[i];float age=max(0.,uCerealTime-foot.z);
  float recovery=(1.-smoothstep(.16,2.85,age))*foot.w*.80;
  vec3 wake=cerealContact(vCerealWorld,foot.xy,recovery,.83);
  if(wake.y>push.y)push=wake;
 }
 float crown=uv.y*uv.y*(3.-2.*uv.y);
 float standing=1.-step(1.5,floor(vCerealKind/8.));
 vec3 worldBend=vec3(push.x*.76,-push.y*.34,push.z*.76)*crown*standing;
 // Instance yaw, lean, height and width differ. Project the displacement back
 // through the scaled orthogonal basis so each stalk bends AWAY in world space.
 mat3 cropBasis=mat3(modelMatrix*instanceMatrix);
 transformed+=vec3(dot(cropBasis[0],worldBend)/dot(cropBasis[0],cropBasis[0]),
                   dot(cropBasis[1],worldBend)/dot(cropBasis[1],cropBasis[1]),
                   dot(cropBasis[2],worldBend)/dot(cropBasis[2],cropBasis[2]));
`;
