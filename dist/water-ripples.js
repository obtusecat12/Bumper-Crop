import * as T from './vendor/three.module.min.js';
export const RIPPLE_SIZE=256,RIPPLE_SPAN=24,RIPPLE_DT=1/30,RIPPLE_SPEED=2.2;
const COUNT=24;
export function radialWave(r,t,A=.045){return t<0?0:A*Math.exp(-5*(t-r/RIPPLE_SPEED)**2)*Math.cos(9*r-12*t)*Math.exp(-t*.7);}
export const RIPPLE_NORMAL_FRAGMENT=`precision highp float;
 uniform float uTime;uniform vec2 uOrigin;uniform vec4 uEvents[24];varying vec2 vUv;
 void main(){vec2 p=uOrigin+vUv*24.;vec2 gradient=vec2(0.);
 for(int i=0;i<24;i++){vec4 e=uEvents[i];float t=uTime-e.z;if(e.w==0.||t<0.||t>4.)continue;
 vec2 d=p-e.xy;float r=max(.015,length(d)),q=t-r/2.2,phase=9.*r-12.*t;
 float envelope=e.w*exp(-5.*q*q)*exp(-t*.7);
 float derivative=envelope*((10.*q/2.2)*cos(phase)-9.*sin(phase));gradient+=d/r*derivative;}
 vec3 n=normalize(vec3(-gradient.x,1.,-gradient.y));gl_FragColor=vec4(n.xz*.5+.5,n.y,1.);}`;
export function createWaterRipples(renderer){
 const normalTarget=new T.WebGLRenderTarget(256,256,{depthBuffer:false,minFilter:T.LinearFilter,magFilter:T.LinearFilter});normalTarget.texture.colorSpace=T.NoColorSpace;
 const events=Array.from({length:COUNT},()=>new T.Vector4(0,0,-99,0));
 const u={uTime:{value:0},uOrigin:{value:new T.Vector2()},uEvents:{value:events}};
 const material=new T.ShaderMaterial({vertexShader:'varying vec2 vUv;void main(){vUv=position.xy*.5+.5;gl_Position=vec4(position,1.);}',fragmentShader:RIPPLE_NORMAL_FRAGMENT,uniforms:u,depthTest:false,depthWrite:false,blending:T.NoBlending,toneMapped:false});
 const geometry=new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute([-1,-1,0,3,-1,0,-1,3,0],3));
 const scene=new T.Scene(),camera=new T.Camera(),quad=new T.Mesh(geometry,material);quad.frustumCulled=false;scene.add(quad);
 const binding={uImpactNormals:{value:normalTarget.texture},uImpactOrigin:{value:new T.Vector2()},uImpactActive:{value:0},uImpactSun:{value:new T.Vector3(-.45,.84,-.30)}};
 const stats={resolution:256,span:24,simHz:30,normalPasses:0,active:false};
 let cx=0n,cz=0n,known=false,clock=0,last=-1,index=0,active=true;
 function emit(e){if(!e||!Number.isFinite(e.x+e.z))return;if(!known){cx=e.cx??0n;cz=e.cz??0n;known=true;}
  const x=e.x+Number((e.cx??cx)-cx)*64,z=e.z+Number((e.cz??cz)-cz)*64;
  events[index].set(x,z,clock,Math.max(-.09,Math.min(.09,e.strength??.045)));index=(index+1)%COUNT;last=-1;
 }
 function update(dt,options){const s=options.state;active=options.active!==false;if(!s)return;
  if(!known){cx=s.cx;cz=s.cz;known=true;}
  const dx=Number(s.cx-cx)*64,dz=Number(s.cz-cz)*64;if(dx||dz){for(let i=0;i<COUNT;i++){events[i].x-=dx;events[i].y-=dz;}binding.uImpactOrigin.value.x-=dx;binding.uImpactOrigin.value.y-=dz;cx=s.cx;cz=s.cz;last=-1;}
  if(active)clock+=Math.max(0,Math.min(.1,dt));u.uTime.value=clock;u.uOrigin.value.set(s.x-12,s.z-12);
  let count=0;for(let i=0;i<COUNT;i++)if(events[i].w&&clock-events[i].z<4)count++;
  binding.uImpactActive.value=active&&count?1:0;stats.active=!!binding.uImpactActive.value;
 }
 function render(){if(!active||!binding.uImpactActive.value||clock-last<RIPPLE_DT)return false;
  const old=renderer.getRenderTarget();renderer.setRenderTarget(normalTarget);renderer.render(scene,camera);binding.uImpactOrigin.value.copy(u.uOrigin.value);renderer.setRenderTarget(old);last=clock;stats.normalPasses++;return true;}
 function reset(){for(let i=0;i<COUNT;i++)events[i].set(0,0,-99,0);known=false;clock=0;last=-1;binding.uImpactActive.value=0;}
 return {emit,update,render,reset,contextLost:reset,attach(){},binding,stats,normalTarget,material,
 dispose(){normalTarget.dispose();material.dispose();geometry.dispose();}};
}
