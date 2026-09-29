// A camera body, separate from the player's collision body and input heading.
// Improved Perlin gradient noise; analytic damped oscillator (not frame lerp).
// See docs/handheld-v27/implementation.md for units, sources and tuning.
import {Vector3} from './vendor/three.module.min.js';

const TAU=Math.PI*2,DEG=Math.PI/180;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const angleDelta=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
const fade=t=>t*t*t*(t*(t*6-15)+10);
const mix=(a,b,t)=>a+(b-a)*t;
function gradient(h,x,y,z){h&=15;const u=h<8?x:y,v=h<4?y:h===12||h===14?x:z;return(h&1?-u:u)+(h&2?-v:v);}

export class PerlinNoise {
 constructor(seed=0x199407){
  const p=new Uint16Array(256);for(let i=0;i<256;i++)p[i]=i;
  let s=seed>>>0;for(let i=255;i>0;i--){s=(Math.imul(s,1664525)+1013904223)>>>0;const j=s%(i+1),v=p[i];p[i]=p[j];p[j]=v;}
  this.p=new Uint16Array(512);for(let i=0;i<512;i++)this.p[i]=p[i&255];
 }
 sample(x,y,z){
  const fx=Math.floor(x),fy=Math.floor(y),fz=Math.floor(z),X=fx&255,Y=fy&255,Z=fz&255,p=this.p;
  x-=fx;y-=fy;z-=fz;const u=fade(x),v=fade(y),w=fade(z);
  const A=p[X]+Y,B=p[X+1]+Y,AA=p[A]+Z,AB=p[A+1]+Z,BA=p[B]+Z,BB=p[B+1]+Z;
  return mix(mix(mix(gradient(p[AA],x,y,z),gradient(p[BA],x-1,y,z),u),mix(gradient(p[AB],x,y-1,z),gradient(p[BB],x-1,y-1,z),u),v),mix(mix(gradient(p[AA+1],x,y,z-1),gradient(p[BA+1],x-1,y,z-1),u),mix(gradient(p[AB+1],x,y-1,z-1),gradient(p[BB+1],x-1,y-1,z-1),u),v),w);
 }
 fbm(t,frequency,axis,octaves){
  let a=1,sum=0,weight=0;for(let i=0;i<octaves;i++){sum+=a*this.sample(t*frequency+axis*31.713+i*17.19,axis*13.37+7.83,i*9.17+3.27);weight+=a;a*=.46;frequency*=1.97;}
  return sum/weight;
 }
}

export class DampedSpring {
 constructor(position=0){this.position=position;this.velocity=0;}
 reset(position=0){this.position=position;this.velocity=0;}
 advance(dt,target,omega=26,zeta=.86){
  // x'' = omega²(target-x) - 2*zeta*omega*x'. Analytic solution for
  // constant target over this interval: stable even across a dropped frame.
  if(!(dt>0))return this.position;
  const x=this.position-target,a=zeta*omega,E=Math.exp(-a*dt);
  const d=omega*Math.sqrt(Math.max(0,1-zeta*zeta));
  const C=d>1e-5?Math.cos(d*dt):1,S=d>1e-5?Math.sin(d*dt)/d:dt;
  const v=this.velocity;
  this.position=target+E*((C+a*S)*x+S*v);
  this.velocity=E*(-omega*omega*S*x+(C-a*S)*v);
  return this.position;
 }
}

// One full left/right stride, authored as two unequal loops. Hermite segments
// have a short compression side and longer recovery side, with no sine bob.
// At 0 and .5 the camera passes the central cusp and a heel contacts the floor.
const GAIT=[
 [0,0,-.62],[.10,-.40,-.35],[.25,-1,.65],[.40,-.53,.26],
 [.50,0,-.72],[.61,.35,-.28],[.77,.86,.72],[.91,.38,.24],[1,0,-.62]
];
const GAIT_BEFORE=[-.09,.38,.24],GAIT_AFTER=[1.10,-.40,-.35];
export function sampleGait(phase,out){
 const t=((phase/TAU)%1+1)%1;let i=0;while(i<GAIT.length-2&&t>GAIT[i+1][0])i++;
 const a=GAIT[i],b=GAIT[i+1],prev=i?GAIT[i-1]:GAIT_BEFORE,next=i<7?GAIT[i+2]:GAIT_AFTER;
 const width=b[0]-a[0],u=(t-a[0])/width,u2=u*u,u3=u2*u;
 for(let j=1;j<=2;j++){
  const m0=(b[j]-prev[j])/(b[0]-prev[0])*width,m1=(next[j]-a[j])/(next[0]-a[0])*width;
  out[j-1]=(2*u3-3*u2+1)*a[j]+(u3-2*u2+u)*m0+(-2*u3+3*u2)*b[j]+(u3-u2)*m1;
 }
 return out;
}

export class HandheldCameraRig {
 constructor(camera){
  this.camera=camera;this.noise=new PerlinNoise();this.clock=0;this.phase=0;this.initialized=false;
  this.yaw=new DampedSpring();this.pitch=new DampedSpring();this.height=new DampedSpring();
  this.gain=new DampedSpring();this.motionBlend=new DampedSpring();this.heelY=new DampedSpring();this.heelPitch=new DampedSpring();this.heelRoll=new DampedSpring();this.bank=new DampedSpring();
  this.path=new Float64Array(2);this.velocity=new Vector3();this.previousOffset=new Vector3();
  this.output={contacts:0,phase:0,eyeHeight:0,velocity:this.velocity,landing:false};
 }
 reset({x,z,yaw,pitch,eyeY,jump=0}){
  this.yaw.reset(yaw);this.pitch.reset(pitch);this.height.reset(eyeY);
  for(const s of [this.gain,this.motionBlend,this.heelY,this.heelPitch,this.heelRoll,this.bank])s.reset();
  this.phase=0;this.velocity.set(0,0,0);this.previousOffset.set(0,0,0);
  this.camera.position.set(x,eyeY+jump,z);this.camera.rotation.set(pitch,yaw,0,'YXZ');this.camera.updateMatrixWorld();
  this.lastY=this.camera.position.y;this.initialized=true;
  this.output.contacts=0;this.output.eyeHeight=eyeY;this.output.phase=0;this.output.landing=false;
 }
 resume(){
  // Pause freezes the final pose; no catch-up noise, steps or derivative spike.
  this.velocity.set(0,0,0);this.lastY=this.camera.position.y;
  this.yaw.velocity=this.pitch.velocity=0;
 }
 advanceImpacts(dt){this.heelY.advance(dt,0,27,.64);this.heelPitch.advance(dt,0,25,.68);this.heelRoll.advance(dt,0,22,.68);}
 strike(side,strength){
  // Instant velocity changes are the time integral of a brief acceleration
  // spike. Do NOT multiply by frame dt: that would weaken it at high FPS.
  this.heelY.velocity-=.24*strength;
  this.heelPitch.velocity+=.048*strength;
  this.heelRoll.velocity+=side*.16*strength;
 }
 update(dt,input){
  const {x,z,yaw,pitch,eyeY,jump=0,moved=0,dx=0,dz=0,grounded=true,running=false,crouch=false,stamina=100,landingSpeed=0,enabled=true,locked=false}=input;
  if(!this.initialized)this.reset({x,z,yaw,pitch,eyeY,jump});
  dt=clamp(dt,0,.1);const result=this.output;result.contacts=0;result.landing=landingSpeed>0;
  if(locked){this.reset({x,z,yaw,pitch,eyeY,jump});return result;}
  if(!(dt>0))return result;
  this.clock+=dt;
  const targetYaw=this.yaw.position+angleDelta(yaw,this.yaw.position);
  if(enabled){this.yaw.advance(dt,targetYaw,28,.88);this.pitch.advance(dt,clamp(pitch,-1.4,1.4),30,.90);}
  else{this.yaw.reset(yaw);this.pitch.reset(pitch);}
  this.pitch.position=clamp(this.pitch.position,-1.4,1.4);
  if(Math.abs(this.pitch.position)>=1.4&&this.pitch.position*this.pitch.velocity>0)this.pitch.velocity=0;
  const eye=this.height.advance(dt,eyeY,24,1);
  const speed=moved/dt,walking=grounded&&speed>.08&&!landingSpeed;
  const activity=walking?clamp(speed/2.6,0,1)*(crouch?.52:running?1.32:1):0;
  const gain=clamp(this.gain.advance(dt,enabled?activity:0,18,1),0,1.4);
  const strideLength=crouch?.76:running?1.72:1.34;
  const oldPhase=this.phase,advance=walking?Math.PI*moved/strideLength:0;
  if(landingSpeed){
   this.phase=0;
   if(enabled)this.strike(0,clamp(landingSpeed*.30,.55,1.8));
  }
  // Integrate exactly to each heel strike, then from strike to frame end.
  // This preserves impact size/timing at 30, 60 and 144 Hz.
  let remaining=dt;
  if(advance>0){
   let end=oldPhase+advance,boundary=(Math.floor(oldPhase/Math.PI)+1)*Math.PI,lastFraction=0;
   while(boundary<=end+1e-10){
    // If roundoff put this contact just beyond the endpoint, snap the phase
    // too. Otherwise the same heel would be counted again on the next frame.
    if(end<boundary)end=boundary;
    const fraction=clamp((boundary-oldPhase)/advance,0,1),duration=(fraction-lastFraction)*dt;
    this.advanceImpacts(duration);remaining-=duration;lastFraction=fraction;
    result.contacts++;if(enabled)this.strike((Math.round(boundary/Math.PI)&1)?-1:1,(running?1.32:1)*(crouch?.55:1)*clamp(speed/1.5,.2,1));
    boundary+=Math.PI;
   }
   this.phase=end%TAU;
  }
  this.advanceImpacts(Math.max(0,remaining));
  const bank=this.bank.advance(dt,enabled?clamp(-this.yaw.velocity*.0022,-.011,.011):0,19,.9);
  sampleGait(this.phase,this.path);
  const fatigue=1+clamp((65-stamina)/65,0,1)*.65;
  // Independent axes and frequency bands, all comfortably below the VHS
  // sampling Nyquist limit. Higher octaves lose amplitude rather than alias.
  if(!enabled)this.motionBlend.reset();
  const blend=enabled?this.motionBlend.advance(dt,1,14,1):0;
  const drift=blend*fatigue*DEG,wrist=blend*(1+activity*.45)*DEG;
  const yawNoise=enabled?drift*.72*this.noise.fbm(this.clock,.16,1,3)+wrist*.13*this.noise.fbm(this.clock,1.35,4,2):0;
  const pitchNoise=enabled?drift*.58*this.noise.fbm(this.clock,.21,2,3)+wrist*.15*this.noise.fbm(this.clock,1.63,5,2):0;
  const rollNoise=enabled?drift*.46*this.noise.fbm(this.clock,.13,3,3)+wrist*.10*this.noise.fbm(this.clock,1.17,6,2):0;
  // V58: visible shoulder transfer and heel compression, driven by resolved
  // distance; look controls, photo locks and reduced-motion opt-out stay exact.
  const lateral=enabled?this.path[0]*.037*gain:0;
  const vertical=enabled?this.path[1]*.048*gain+this.heelY.position:0;
  const forward=enabled?this.path[1]*.013*gain:0;
  const viewYaw=this.yaw.position+yawNoise,c=Math.cos(viewYaw),s=Math.sin(viewYaw);
  const ox=c*lateral+s*forward,oz=-s*lateral+c*forward;
  this.camera.position.set(x+ox,eye+jump+vertical,z+oz);
  this.camera.rotation.set(clamp(this.pitch.position+pitchNoise+(enabled?this.heelPitch.position-this.path[1]*.0055*gain:0),-1.415,1.415),viewYaw,rollNoise+(enabled?this.path[0]*.009*gain+this.heelRoll.position+bank:0),'YXZ');
  this.camera.updateMatrixWorld();
  // dx/dz are the resolved movement BEFORE 64 m chunk rebasing. Derivatives
  // remain physical even at huge BigInt world coordinates or a chunk border.
  this.velocity.set((dx+ox-this.previousOffset.x)/dt,(this.camera.position.y-this.lastY)/dt,(dz+oz-this.previousOffset.z)/dt);
  this.previousOffset.set(ox,vertical,oz);this.lastY=this.camera.position.y;
  result.phase=this.phase;result.eyeHeight=eye;return result;
 }
}
