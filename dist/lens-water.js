import * as T from './vendor/three.module.min.js';
// Small beads pin through capillary retention; weight scales with volume while
// retention scales with contact radius. This bounded visual model is not CFD.
export class LensDropletPhysics{
 constructor(limit=36,rng=Math.random){this.limit=limit;this.rng=rng;this.drops=[];this.aspect=4/3;}
 clear(){this.drops.length=0;}
 add(x,y,r,vx=0,vy=0){if(this.drops.length>=this.limit)return null;const d={x,y,r,volume:r*r*r,vx,vy,stretch:1,stretchV:0,age:0,life:18+this.rng()*12,angle:0,trail:0};this.drops.push(d);return d;}
 splash(power=1){const count=Math.min(this.limit-this.drops.length,Math.round(9+power*9));for(let i=0;i<count;i++){const a=this.rng()*Math.PI*2,spread=.13+this.rng()*.43;this.add(.5+Math.cos(a)*spread/this.aspect,.54+Math.sin(a)*spread,.48+this.rng()**1.8*2.0,(this.rng()-.5)*.20*power,-(.02+this.rng()*.18)*power);}}
 merge(){for(let i=0;i<this.drops.length;i++)for(let j=i+1;j<this.drops.length;j++){const a=this.drops[i],b=this.drops[j],dx=(a.x-b.x)*this.aspect,dy=a.y-b.y;if(Math.hypot(dx,dy)>(a.r+b.r)*.0054)continue;const v=a.volume+b.volume;a.x=(a.x*a.volume+b.x*b.volume)/v;a.y=(a.y*a.volume+b.y*b.volume)/v;a.vx=(a.vx*a.volume+b.vx*b.volume)/v;a.vy=(a.vy*a.volume+b.vy*b.volume)/v;a.life=Math.max(a.life,b.life);a.age=Math.min(a.age,b.age);a.volume=v;a.r=Math.cbrt(v);a.stretchV+=.5;this.drops.splice(j--,1);}}
 step(dt,{pitch=0,roll=0,accelX=0,accelY=0}={}){dt=Math.max(0,Math.min(dt,.12));const n=Math.max(1,Math.ceil(dt/.025)),h=dt/n;
  for(let k=0;k<n;k++){for(const d of this.drops){d.age+=h;const gx=Math.sin(roll)*.12-Math.max(-1,Math.min(1,accelX))*.10,gy=Math.cos(roll)*Math.max(.12,Math.cos(pitch))*.13+Math.max(-1,Math.min(1,accelY))*.035;const drive=Math.hypot(gx,gy),retention=.13/(d.r*d.r),slip=Math.max(0,drive-retention)/Math.max(.0001,drive);const drag=Math.exp(-h*(3.2+1/d.r));d.vx=(d.vx+gx*slip*h)*drag;d.vy=(d.vy+gy*slip*h)*drag;d.x+=d.vx*h/this.aspect;d.y+=d.vy*h;const speed=Math.hypot(d.vx,d.vy),target=1+Math.min(1.8,speed*16);d.stretchV+=(target-d.stretch)*32*h-d.stretchV*9*h;d.stretch+=d.stretchV*h;if(speed>.003)d.angle=Math.atan2(d.vx,d.vy);
   d.trail+=speed*h;if(d.trail>.04&&d.r>1.4&&this.drops.length<this.limit){d.trail=0;const bead=.24,v=bead**3;this.add(d.x-d.vx*.14/this.aspect,d.y-d.vy*.14,bead);d.volume-=v;d.r=Math.cbrt(d.volume);}
   // Evaporation shrinks the cap, retaining its refractive body until nearly dry.
   if(d.age>6){d.volume=Math.max(0,d.volume-h*.013*d.r);d.r=Math.cbrt(d.volume);}
  }this.merge();this.drops=this.drops.filter(d=>d.y<1.12&&d.x>-.12&&d.x<1.12&&d.age<d.life&&d.r>.18);}
 }
}
export class WaterEntryTracker{
 constructor(){this.wet=null;this.distance=0;this.lastGrounded=true;}
 reset(){this.wet=null;this.distance=0;this.lastGrounded=true;}
 update({shore=Infinity,feet=Infinity,level=0,moved=0,speed=0,grounded=true,fallSpeed=0}){const wet=this.wet?shore<.10&&feet<level+.04:shore<-.04&&feet<level-.015;let burst=0;if(this.wet!==null){if(wet&&!this.wet)burst=.5+Math.min(1.2,speed*.22);else if(wet&&grounded&&!this.lastGrounded)burst=.8+Math.min(1,Math.abs(fallSpeed)*.12);if(wet&&grounded){this.distance+=moved;if(this.distance>2.0){this.distance=0;if(speed>1.8)burst=Math.max(burst,.12);}}else this.distance=0;}this.wet=wet;this.lastGrounded=grounded;return burst;}
}
export const lensVertex=`precision highp float;
in vec3 position;in vec4 drop;in vec2 shape;uniform vec2 resolution;
out vec2 localP;out vec2 screenUV;out vec2 axis;out float capRadius;out float alphaScale;
void main(){localP=position.xy;float c=cos(shape.x),s=sin(shape.x);vec2 p=vec2(position.x,position.y*drop.w);p=mat2(c,-s,s,c)*p;vec2 delta=p*drop.z;vec2 uv=drop.xy+vec2(delta.x*resolution.y/resolution.x,delta.y);screenUV=vec2(uv.x,1.-uv.y);axis=vec2(c,s);capRadius=drop.z;alphaScale=shape.y;gl_Position=vec4(uv.x*2.-1.,1.-uv.y*2.,0.,1.);}`;
export const lensFragment=`precision highp float;
uniform sampler2D background;uniform vec2 resolution;
in vec2 localP;in vec2 screenUV;in vec2 axis;in float capRadius;in float alphaScale;out vec4 outColor;
void main(){float r2=dot(localP,localP);if(r2>1.)discard;float dome=sqrt(max(.0001,1.-r2));vec2 bend=mat2(axis.x,-axis.y,axis.y,axis.x)*localP;vec2 offset=vec2(bend.x*resolution.y/resolution.x,-bend.y)*capRadius*(.22+.36*dome);vec3 scene=texture(background,clamp(screenUV-offset,vec2(.001),vec2(.999))).rgb;float rim=pow(1.-dome,4.);float highlight=pow(max(0.,dot(normalize(vec3(bend.x,-bend.y,dome*1.5)),normalize(vec3(-.45,.6,.9)))),30.);vec3 water=scene*(1.-rim*.085)+vec3(.10,.115,.12)*rim+highlight*.19;float edge=1.-smoothstep(.87,1.,r2);outColor=vec4(water,edge*alphaScale);}`;
export function createLensWater(renderer,{limit=36}={}){
 const physics=new LensDropletPhysics(limit),entry=new WaterEntryTracker(),scene=new T.Scene(),camera=new T.Camera();let capture=null,width=0,height=0,enabled=true,disposed=false;
 const g=new T.InstancedBufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([-1,-1,0,1,-1,0,1,1,0,-1,1,0],3));g.setIndex([0,2,1,0,3,2]);g.setAttribute('drop',new T.InstancedBufferAttribute(new Float32Array(limit*4),4).setUsage(T.DynamicDrawUsage));g.setAttribute('shape',new T.InstancedBufferAttribute(new Float32Array(limit*2),2).setUsage(T.DynamicDrawUsage));g.instanceCount=0;
 const material=new T.RawShaderMaterial({glslVersion:T.GLSL3,vertexShader:lensVertex,fragmentShader:lensFragment,uniforms:{background:{value:null},resolution:{value:new T.Vector2(1,1)}},transparent:true,depthTest:false,depthWrite:false,toneMapped:false});const mesh=new T.Mesh(g,material);mesh.frustumCulled=false;scene.add(mesh);
 function reset(){physics.clear();entry.reset();g.instanceCount=0;}
 function update(dt,state){enabled=!!state.enabled;if(!enabled){entry.reset();return;}physics.aspect=state.aspect||4/3;const burst=entry.update(state);if(burst>.2)physics.splash(burst);else if(burst>0)for(let i=0;i<2;i++)physics.add(.24+physics.rng()*.52,.6+physics.rng()*.27,.4+physics.rng()*.6,0,-.015);physics.step(dt,state);}
 function render(w,h){if(disposed||!enabled||!physics.drops.length)return false;if(w!==width||h!==height||!capture){capture?.dispose();width=w;height=h;capture=new T.FramebufferTexture(w,h);capture.colorSpace=T.NoColorSpace;capture.minFilter=capture.magFilter=T.LinearFilter;capture.generateMipmaps=false;material.uniforms.background.value=capture;material.uniforms.resolution.value.set(w,h);}const da=g.attributes.drop,sa=g.attributes.shape;physics.drops.forEach((d,i)=>{da.setXYZW(i,d.x,d.y,d.r*.0065,d.stretch);sa.setXY(i,d.angle,Math.min(1,(d.life-d.age)*2));});g.instanceCount=physics.drops.length;da.needsUpdate=sa.needsUpdate=true;renderer.copyFramebufferToTexture(capture);const old=renderer.autoClear;renderer.autoClear=false;renderer.render(scene,camera);renderer.autoClear=old;return true;}
 function contextLost(){capture?.dispose();capture=null;width=height=0;reset();}
 function dispose(){if(disposed)return;disposed=true;capture?.dispose();g.dispose();material.dispose();physics.clear();}
 return{physics,entry,update,render,reset,contextLost,dispose};
}
