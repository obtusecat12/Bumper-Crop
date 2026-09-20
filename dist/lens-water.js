import * as T from './vendor/three.module.min.js';
// Small beads pin through capillary retention; weight scales with volume while
// retention scales with contact radius. This bounded visual model is not CFD.
export class LensDropletPhysics{
 constructor(limit=24,rng=Math.random){this.limit=limit;this.rng=rng;this.drops=[];this.aspect=4/3;}
 clear(){this.drops.length=0;}
 add(x,y,r,vx=0,vy=0){if(this.drops.length>=this.limit)return null;const d={x,y,r,volume:r*r*r,vx,vy,stretch:1,stretchV:0,age:0,life:5+this.rng()*5,angle:0,trail:0,history:[],historyClock:0};this.drops.push(d);return d;}
 splash(power=1){const wanted=Math.min(this.limit,Math.round(9+power*6));if(this.drops.length+wanted>this.limit){this.drops.sort((a,b)=>b.r-a.r||a.age-b.age);this.drops.length=Math.max(0,this.limit-wanted);}const count=wanted;for(let i=0;i<count;i++){const a=this.rng()*Math.PI*2,spread=.13+this.rng()*.43;this.add(.5+Math.cos(a)*spread/this.aspect,.54+Math.sin(a)*spread,.9+this.rng()**1.2*2.4,(this.rng()-.5)*.36*power,-(.10+this.rng()*.25)*power);}}
 merge(){for(let i=0;i<this.drops.length;i++)for(let j=i+1;j<this.drops.length;j++){const a=this.drops[i],b=this.drops[j],dx=(a.x-b.x)*this.aspect,dy=a.y-b.y;const distance=Math.hypot(dx,dy),nx=dx/Math.max(distance,.000001),ny=dy/Math.max(distance,.000001),radius=d=>{const major=nx*Math.sin(d.angle)+ny*Math.cos(d.angle),minor=nx*Math.cos(d.angle)-ny*Math.sin(d.angle);return d.r*.015/Math.sqrt(Math.max(.01,minor*minor+major*major/(d.stretch*d.stretch)));};if(distance>radius(a)+radius(b))continue;const v=a.volume+b.volume;a.x=(a.x*a.volume+b.x*b.volume)/v;a.y=(a.y*a.volume+b.y*b.volume)/v;a.vx=(a.vx*a.volume+b.vx*b.volume)/v;a.vy=(a.vy*a.volume+b.vy*b.volume)/v;a.life=Math.max(a.life,b.life);a.age=Math.min(a.age,b.age);a.volume=v;a.r=Math.cbrt(v);a.stretchV+=.5;this.drops.splice(j--,1);}}
 step(dt,{pitch=0,roll=0,accelX=0,accelY=0}={}){dt=Math.max(0,Math.min(dt,.12));const n=Math.max(1,Math.ceil(dt/.025)),h=dt/n;
  for(let k=0;k<n;k++){for(const d of this.drops){d.age+=h;const gx=Math.sin(roll)*.7-Math.max(-1,Math.min(1,accelX))*.10,gy=Math.cos(roll)*Math.max(0,Math.cos(pitch))*.86+Math.max(-1,Math.min(1,accelY))*.14;const drive=Math.hypot(gx,gy),retention=.60/(d.r*d.r),slip=Math.max(0,drive-retention)/Math.max(.0001,drive);const drag=Math.exp(-h*(1.8+1/d.r));d.vx=(d.vx+gx*slip*h)*drag;d.vy=(d.vy+gy*slip*h)*drag;d.x+=d.vx*h/this.aspect;d.y+=d.vy*h;
   d.historyClock+=h;if(d.historyClock>.035){d.historyClock=0;d.history.unshift({x:d.x,y:d.y,age:d.age});if(d.history.length>6)d.history.length=6;}const speed=Math.hypot(d.vx,d.vy),target=1+Math.min(1.5,speed*5);d.stretchV+=(target-d.stretch)*32*h-d.stretchV*9*h;d.stretch+=d.stretchV*h;if(speed>.003)d.angle=Math.atan2(d.vx,d.vy);
   d.trail+=speed*h;if(d.trail>.09&&d.r>1.4&&this.drops.length<this.limit){d.trail=0;const bead=.40,v=bead**3;const child=this.add(d.x-d.vx*.14/this.aspect,d.y-d.vy*.14,bead);if(child){child.age=d.age;child.life=d.life;}d.volume-=v;d.r=Math.cbrt(d.volume);}
   // Evaporation shrinks the cap, retaining its refractive body until nearly dry.
   if(d.age>2.5){d.volume=Math.max(0,d.volume-h*.08*d.r);d.r=Math.cbrt(d.volume);}
  }this.merge();this.drops=this.drops.filter(d=>d.y<1.12&&d.x>-.12&&d.x<1.12&&d.age<d.life&&d.r>.18);}
 }
}
export class WaterEntryTracker{
 constructor(){this.wet=null;this.distance=0;this.lastGrounded=true;}
 reset(){this.wet=null;this.distance=0;this.lastGrounded=true;}
 update({shore=Infinity,feet=Infinity,level=0,moved=0,speed=0,grounded=true,fallSpeed=0}){const wet=this.wet?shore<.10&&feet<level+.04:shore<-.04&&feet<level-.015;let burst=0;if(this.wet!==null){if(wet&&!this.wet)burst=.5+Math.min(1.2,speed*.22);else if(wet&&grounded&&!this.lastGrounded)burst=.8+Math.min(1,Math.abs(fallSpeed)*.12);if(wet&&grounded){this.distance+=moved;if(this.distance>1.0){this.distance=0;if(speed>.7)burst=Math.max(burst,.18);}}else this.distance=0;}this.wet=wet;this.lastGrounded=grounded;return burst;}
}
export const lensVertex=`precision highp float;
in vec3 position;in vec4 drop;in vec2 shape;uniform vec2 resolution;
out vec2 localP;out vec2 screenUV;out vec2 axis;out float capRadius;out float alphaScale;
void main(){localP=position.xy;float c=cos(shape.x),s=sin(shape.x);vec2 p=vec2(position.x,position.y*drop.w);p=mat2(c,-s,s,c)*p;vec2 delta=p*drop.z;vec2 uv=drop.xy+vec2(delta.x*resolution.y/resolution.x,delta.y);screenUV=vec2(uv.x,1.-uv.y);axis=vec2(c,s);capRadius=drop.z;alphaScale=shape.y;gl_Position=vec4(uv.x*2.-1.,1.-uv.y*2.,0.,1.);}`;
export const lensFragment=`precision highp float;
uniform sampler2D background;uniform vec2 resolution;
in vec2 localP;in vec2 screenUV;in vec2 axis;in float capRadius;in float alphaScale;out vec4 outColor;
void main(){float r2=dot(localP,localP);if(r2>1.)discard;float dome=sqrt(max(.0001,1.-r2));vec2 bend=mat2(axis.x,-axis.y,axis.y,axis.x)*localP;vec2 offset=vec2(bend.x*resolution.y/resolution.x,-bend.y)*capRadius*(.40+.48*dome);vec3 scene=texture(background,clamp(screenUV-offset,vec2(.001),vec2(.999))).rgb;float rim=pow(1.-dome,4.);float highlight=pow(max(0.,dot(normalize(vec3(bend.x,-bend.y,dome*1.5)),normalize(vec3(-.45,.6,.9)))),30.);vec3 water=scene*(1.-rim*.36)+vec3(.09,.12,.13)*rim+highlight*.58;float edge=1.-smoothstep(.87,1.,r2);outColor=vec4(water,edge*alphaScale);}`;
export function createLensWater(renderer,{limit=24}={}){
 const physics=new LensDropletPhysics(limit),entry=new WaterEntryTracker(),scene=new T.Scene(),camera=new T.Camera();let capture=null,width=0,height=0,enabled=true,disposed=false,rainBudget=0;const capacity=limit*6;
 const g=new T.InstancedBufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([-1,-1,0,1,-1,0,1,1,0,-1,1,0],3));g.setIndex([0,2,1,0,3,2]);g.setAttribute('drop',new T.InstancedBufferAttribute(new Float32Array(capacity*4),4).setUsage(T.DynamicDrawUsage));g.setAttribute('shape',new T.InstancedBufferAttribute(new Float32Array(capacity*2),2).setUsage(T.DynamicDrawUsage));g.instanceCount=0;
 const material=new T.RawShaderMaterial({glslVersion:T.GLSL3,vertexShader:lensVertex,fragmentShader:lensFragment,uniforms:{background:{value:null},resolution:{value:new T.Vector2(1,1)}},transparent:true,depthTest:false,depthWrite:false,toneMapped:false});const mesh=new T.Mesh(g,material);mesh.frustumCulled=false;scene.add(mesh);
 function reset(){physics.clear();entry.reset();rainBudget=0;g.instanceCount=0;}
 function update(dt,state){enabled=!!state.enabled;if(!enabled){entry.reset();rainBudget=0;return 0;}physics.aspect=state.aspect||4/3;const burst=entry.update(state);if(burst>.2)physics.splash(burst);else if(burst>0)for(let i=0;i<2;i++)physics.add(.24+physics.rng()*.52,.6+physics.rng()*.27,.65+physics.rng()*.75,0,-.07);const rain=Math.max(0,Math.min(1,state.rain||0))*(state.sheltered?0:1);
  rainBudget=Math.min(3,rainBudget+dt*rain*(2.2+Math.max(0,-(state.pitch||0))*1.5));
  while(rainBudget>=1){rainBudget--;if(physics.drops.length>=limit)break;const moving=physics.rng()<.27,r=moving?1.1+physics.rng()*.8:.30+physics.rng()*.7;physics.add(.04+physics.rng()*.92,.05+physics.rng()*.78,r,(physics.rng()-.5)*.035,moving?.025:0);}
  physics.step(dt,state);return burst;}
 function render(w,h){if(disposed||!enabled||!physics.drops.length)return false;if(w!==width||h!==height||!capture){capture?.dispose();width=w;height=h;capture=new T.FramebufferTexture(w,h);capture.colorSpace=T.NoColorSpace;capture.minFilter=capture.magFilter=T.LinearFilter;capture.generateMipmaps=false;material.uniforms.background.value=capture;material.uniforms.resolution.value.set(w,h);}const da=g.attributes.drop,sa=g.attributes.shape;let n=0;
  for(const d of physics.drops){if(Math.hypot(d.vx,d.vy)<.035)continue;for(let j=1;j<d.history.length&&n<capacity-limit;j++){const a=d.history[j-1],b=d.history[j],dx=(a.x-b.x)*physics.aspect,dy=a.y-b.y,len=Math.hypot(dx,dy);if(len<.001)continue;const radius=Math.max(.0012,Math.min(.0032,d.r*.0015));da.setXYZW(n,(a.x+b.x)/2,(a.y+b.y)/2,radius,Math.max(1,len/(radius*2)+.3));sa.setXY(n,Math.atan2(dx,dy),.25*(1-j/7));n++;}}
  for(const d of physics.drops){da.setXYZW(n,d.x,d.y,d.r*.017,d.stretch);sa.setXY(n,d.angle,Math.min(1,(d.life-d.age)*2));n++;}g.instanceCount=n;da.needsUpdate=sa.needsUpdate=true;renderer.copyFramebufferToTexture(capture);const old=renderer.autoClear;renderer.autoClear=false;renderer.render(scene,camera);renderer.autoClear=old;return true;}
 function contextLost(){capture?.dispose();capture=null;width=height=0;reset();}
 function dispose(){if(disposed)return;disposed=true;capture?.dispose();g.dispose();material.dispose();physics.clear();}
 return{physics,entry,update,render,reset,contextLost,dispose};
}
