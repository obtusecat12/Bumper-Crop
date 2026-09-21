import * as T from './vendor/three.module.min.js';

// A bounded, physically inspired lens-water model: retained beads, mobile heads,
// volume-conserving coalescence, deposited film and short draining sheets. Not CFD.
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const STEP=1/30, RADIUS=.016, MIN_VOLUME=.012;
function record(){return{x:0,y:0,r:0,volume:0,vx:0,vy:0,age:0,life:0,stretch:1,angle:0,moving:false,seed:0,pin:1,uid:0,active:false};}

export class LensDropletPhysics{
 constructor(limit=64,rng=Math.random){
  this.limit=clamp(Math.floor(limit)||64,1,64);this.rng=rng;this.aspect=4/3;
  this.drops=[];this.beads=[];this.beadLimit=128;
  this._heads=Array.from({length:this.limit},record);this._beads=Array.from({length:this.beadLimit},record);
  this._freeHeads=this._heads.slice();this._freeBeads=this._beads.slice();
  this.sheets=Array.from({length:2},()=>({active:false,age:0,life:1,volume:0,total:0,seed:0,x:.5,lean:0,targets:new Array(7).fill(null),ids:new Int32Array(7)}));
  this.time=0;this.accumulator=0;this.rainBudget=0;this.serial=0;this.version=0;this.textureVersion=-1;
  this.injected=0;this.evaporated=0;this.runoff=0;this.filmTotal=0;
  this._allocateField(256,192);this.wet=false;
 }
 _allocateField(w,h){
  this.fieldWidth=w;this.fieldHeight=h;const n=w*h;
  this.film=new Float32Array(n);this.filmLife=new Float32Array(n);
  this.heightField=new Float32Array(n);this.pixels=new Uint8Array(n*4);
  this.cellArea=this.aspect/(w*h);this.version++;
 }
 setAspect(aspect){
  aspect=Number.isFinite(aspect)?clamp(aspect,.4,4):4/3;
  if(Math.abs(aspect-this.aspect)<.0001)return;
  const old=this.film,oldLife=this.filmLife,ow=this.fieldWidth,oh=this.fieldHeight;
  this.aspect=aspect;
  const w=aspect>=1?256:Math.max(64,Math.round(256*aspect));
  const h=aspect>=1?Math.max(64,Math.round(256/aspect)):256;
  if(w===ow&&h===oh){this.cellArea=aspect/(w*h);this.version++;return;}
  this._allocateField(w,h);
  // Forward redistribution preserves film volume and keeps top-down screen UVs.
  for(let y=0;y<oh;y++)for(let x=0;x<ow;x++){
   const i=y*ow+x,m=old[i];if(m<=0)continue;
   const nx=Math.min(w-1,Math.floor((x+.5)*w/ow)),ny=Math.min(h-1,Math.floor((y+.5)*h/oh)),j=ny*w+nx;
   this.film[j]+=m;this.filmLife[j]=Math.max(this.filmLife[j],oldLife[i]);
  }
 }
 clear(){
  for(const d of this._heads)d.active=false;for(const d of this._beads)d.active=false;
  this.drops.length=this.beads.length=0;this._freeHeads=this._heads.slice();this._freeBeads=this._beads.slice();
  for(const s of this.sheets){s.active=false;s.volume=0;s.targets.fill(null);}
  this.film.fill(0);this.filmLife.fill(0);this.heightField.fill(0);this.pixels.fill(0);
  this.time=this.accumulator=this.rainBudget=this.filmTotal=this.injected=this.evaporated=this.runoff=0;
  this.wet=false;this.version++;
 }
 _init(d,x,y,r,vx,vy){
  d.x=x;d.y=y;d.r=r;d.volume=r*r*r;d.vx=vx;d.vy=vy;d.age=0;
  d.life=12+this.rng()*8;d.stretch=1;d.angle=0;d.moving=Math.hypot(vx,vy)>.025;
  d.seed=this.rng()*Math.PI*2;d.pin=.78+this.rng()*.44;d.uid=++this.serial;d.active=true;
  this.injected+=d.volume;this.wet=true;this.version++;return d;
 }
 add(x,y,r,vx=0,vy=0){
  if(!Number.isFinite(x+y+r+vx+vy)||r<=0||!this._freeHeads.length)return null;
  const d=this._init(this._freeHeads.pop(),x,y,clamp(r,.18,5),vx,vy);this.drops.push(d);return d;
 }
 _addBead(x,y,r){
  if(!this._freeBeads.length){
   // At capacity, incoming rain still becomes thin water at its impact location.
   const v=r*r*r;this.injected+=v;this.deposit(x,y,r*RADIUS*.65,v,2.5);return null;
  }
  const b=this._init(this._freeBeads.pop(),x,y,r,0,0);this.beads.push(b);return b;
 }
 _release(list,index,isBead=false){
  const d=list[index];d.active=false;list.splice(index,1);(isBead?this._freeBeads:this._freeHeads).push(d);
 }
 _combine(a,b){
  const av=a.volume,bv=b.volume,v=av+bv;if(v<=0)return;
  a.x=(a.x*av+b.x*bv)/v;a.y=(a.y*av+b.y*bv)/v;
  a.vx=(a.vx*av+b.vx*bv)/v;a.vy=(a.vy*av+b.vy*bv)/v;
  a.volume=v;a.r=Math.cbrt(v);a.age=Math.min(a.age,b.age);a.life=Math.max(a.life,b.life);
  a.moving=a.moving||b.moving;a.stretch=Math.max(a.stretch,b.stretch);this.version++;
 }
 _touch(a,b,multiplier=1){
  const dx=(a.x-b.x)*this.aspect,dy=a.y-b.y;
  const r=(a.r+b.r)*RADIUS*multiplier;return dx*dx+dy*dy<r*r;
 }
 merge(){
  for(let i=0;i<this.drops.length;i++)for(let j=i+1;j<this.drops.length;j++){
   if(this._touch(this.drops[i],this.drops[j])){this._combine(this.drops[i],this.drops[j]);this._release(this.drops,j--);}
  }
  for(const d of this.drops)for(let j=0;j<this.beads.length;j++){
   if(this._touch(d,this.beads[j],1.06)){this._combine(d,this.beads[j]);this._release(this.beads,j--,true);}
  }
  for(let i=0;i<this.beads.length;i++)for(let j=i+1;j<this.beads.length;j++){
   if(this._touch(this.beads[i],this.beads[j])){this._combine(this.beads[i],this.beads[j]);this._release(this.beads,j--,true);}
  }
  for(let i=0;i<this.beads.length;i++){
   const b=this.beads[i];if(b.r<.96||!this._freeHeads.length)continue;
   const d=this._freeHeads.pop();Object.assign(d,b);d.uid=++this.serial;d.active=true;d.moving=true;
   this.drops.push(d);this._release(this.beads,i--,true);
  }
 }
 // The normalized splat deposits exactly the requested volume (except Float32
 // roundoff). It stays after its moving head exits or merges into another head.
 deposit(x,y,r,volume,life=4){
  if(volume<=0)return;
  if(x<-.03||x>1.03||y<-.03||y>1.03){this.runoff+=volume;return;}
  const w=this.fieldWidth,h=this.fieldHeight,cx=x*w-.5,cy=y*h-.5;
  const rx=Math.max(.8,r*w/this.aspect),ry=Math.max(.8,r*h);
  const x0=Math.max(0,Math.floor(cx-rx)),x1=Math.min(w-1,Math.ceil(cx+rx));
  const y0=Math.max(0,Math.floor(cy-ry)),y1=Math.min(h-1,Math.ceil(cy+ry));
  let total=0;
  for(let yy=y0;yy<=y1;yy++)for(let xx=x0;xx<=x1;xx++){
   const q=((xx-cx)/rx)**2+((yy-cy)/ry)**2;if(q<1)total+=(1-q)*(1-q);
  }
  if(total<=0){this.runoff+=volume;return;}
  const gain=volume/total;
  for(let yy=y0;yy<=y1;yy++)for(let xx=x0;xx<=x1;xx++){
   const q=((xx-cx)/rx)**2+((yy-cy)/ry)**2;if(q>=1)continue;
   const i=yy*w+xx;this.film[i]+=(1-q)*(1-q)*gain;this.filmLife[i]=Math.max(this.filmLife[i],life);
  }
  this.filmTotal+=volume;this.wet=true;this.version++;
 }
 _trail(x0,y0,x1,y1,d,volume){
  const length=Math.hypot((x1-x0)*this.aspect,y1-y0);
  const radius=d.r*RADIUS*clamp(.27+length*2,.27,.45);
  const n=clamp(Math.ceil(length/Math.max(.002,radius*.55)),1,24);
  for(let i=0;i<n;i++){
   const t=(i+.5)/n,wobble=1+.14*Math.sin(d.seed+(d.age-STEP+t*STEP)*5.1);
   this.deposit(x0+(x1-x0)*t,y0+(y1-y0)*t,radius*wobble,volume/n,2.5+Math.min(3.5,d.r));
  }
 }
 splash(power=1){
  power=clamp(Number.isFinite(power)?power:1,.1,2);
  let s=this.sheets.find(s=>!s.active);
  if(!s){s=this.sheets[0].age>this.sheets[1].age?this.sheets[0]:this.sheets[1];this.deposit(s.x,.85,.11,s.volume,4);}
  s.active=true;s.age=0;s.life=.65+power*.18;s.seed=this.rng()*Math.PI*2;s.x=.40+this.rng()*.20;s.lean=(this.rng()-.5)*.25;
  s.total=s.volume=10+power*16;s.targets.fill(null);this.injected+=s.volume;
  for(let i=0;i<s.targets.length;i++){
   const x=.08+(i+.25+this.rng()*.5)*.84/s.targets.length,y=.08+this.rng()*.48;
   let d=this.add(x,y,1.35+this.rng()*1.00+power*.3,(this.rng()-.5)*.08,.16+this.rng()*.15);
   if(!d&&this.drops.length)d=this.drops[i%this.drops.length];
   s.targets[i]=d;s.ids[i]=d?.uid||0;
  }
  this.wet=true;this.version++;
 }
 _drainSheets(dt){
  for(const s of this.sheets){if(!s.active)continue;
   const before=s.age;s.age+=dt;
   // Delayed drainage leaves a continuous initial sheet, then seven uneven tongues.
   const f0=clamp((before-.05)/(s.life-.05),0,1),f1=clamp((s.age-.05)/(s.life-.05),0,1);
   const amount=Math.min(s.volume,s.total*(f1-f0));s.volume-=amount;
   let recipients=0;for(let i=0;i<s.targets.length;i++)if(s.targets[i]?.active&&s.targets[i].uid===s.ids[i])recipients++;
   if(recipients){for(let i=0;i<s.targets.length;i++){const d=s.targets[i];if(!d?.active||d.uid!==s.ids[i])continue;d.volume+=amount/recipients;d.r=Math.cbrt(d.volume);}}
   else this.deposit(s.x,.83,.12,amount,5);
   if(s.age>=s.life){if(s.volume>0)this.deposit(s.x,.87,.1,s.volume,4);s.volume=0;s.active=false;}
  }
 }
 _rain(dt,state){
  const intensity=clamp(state.rain||0,0,1);if(state.sheltered||intensity<=0){this.rainBudget=0;return;}
  const gaze=clamp(-(state.pitch||0),0,1.1);
  const modulation=1+.13*Math.sin(this.time*.83)+.07*Math.sin(this.time*2.17);
  const rate=intensity*(20+gaze*4)*modulation;
  this.rainBudget=Math.min(3,this.rainBudget+dt*rate);
  while(this.rainBudget>=1){
   this.rainBudget--;const x=.015+this.rng()*.97,y=.02+this.rng()*.91;
   if(this.rng()<.44){const r=1.30+this.rng()*1.0;const d=this.add(x,this.rng()<.25?-.015:y,r,(this.rng()-.5)*.03,.02+this.rng()*.025);if(!d){const v=r*r*r;this.injected+=v;this.deposit(x,y,.015,v,4);}}
   else this._addBead(x,y,.31+this.rng()*.51);
  }
 }
 _filmSample(x,y){
  const xx=clamp(Math.floor(x*this.fieldWidth),0,this.fieldWidth-1),yy=clamp(Math.floor(y*this.fieldHeight),0,this.fieldHeight-1);
  return this.film[yy*this.fieldWidth+xx];
 }
 _tick(dt,state){
  this.time+=dt;this._rain(dt,state);this._drainSheets(dt);
  const pitch=Number.isFinite(state.pitch)?state.pitch:0,roll=Number.isFinite(state.roll)?state.roll:0;
  const gx=Math.sin(roll)*.82-clamp(state.accelX||0,-1,1)*.085;
  const gy=Math.cos(roll)*Math.max(0,Math.cos(pitch))*.92+clamp(state.accelY||0,-1,1)*.10;
  const force=Math.hypot(gx,gy);
  for(let i=0;i<this.drops.length;i++){
   const d=this.drops[i];d.age+=dt;const oldX=d.x,oldY=d.y;
   const retention=.47*d.pin/Math.max(.08,d.r*d.r)*(d.moving?.65:1);
   const slip=Math.max(0,force-retention)/Math.max(.001,force);
   if(slip>.01)d.moving=true;
   const drag=Math.exp(-dt*(1.50+.85/Math.max(.4,d.r)));
   let lateral=0;
   if(d.moving){
    const delta=.012/this.aspect,down=d.y+.022;
    lateral=clamp((this._filmSample(d.x+delta,down)-this._filmSample(d.x-delta,down))*8,-.045,.045);
    lateral+=Math.sin(d.seed+d.y*19+this.time*.6)*.025;
   }
   d.vx=(d.vx+(gx*slip+lateral)*dt)*drag;d.vy=(d.vy+gy*slip*dt)*drag;
   const speed=Math.hypot(d.vx,d.vy),maxSpeed=.23+Math.min(.33,d.r*.095);
   if(speed>maxSpeed){d.vx*=maxSpeed/speed;d.vy*=maxSpeed/speed;}
   d.x+=d.vx*dt/this.aspect;d.y+=d.vy*dt;
   const actualSpeed=Math.hypot(d.vx,d.vy);
   d.stretch+=(1+Math.min(1.4,actualSpeed*3.2)-d.stretch)*(1-Math.exp(-dt*8));
   if(actualSpeed>.003)d.angle=Math.atan2(d.vx,d.vy);
   if(actualSpeed>.012){
    // Transfer (do not duplicate) liquid from the head into the lasting wet path.
    const volume=Math.min(Math.max(0,d.volume-MIN_VOLUME),d.volume*(.15+actualSpeed*.72)*dt);
    d.volume-=volume;this._trail(oldX,oldY,d.x,d.y,d,volume);
   }else if(actualSpeed<.003&&slip===0)d.moving=false;
   const loss=Math.min(d.volume,d.volume*(d.age>5?.030:.008)*dt);d.volume-=loss;this.evaporated+=loss;d.r=Math.cbrt(Math.max(0,d.volume));
   if(d.x<-.08||d.x>1.08||d.y<-.10||d.y>1.09){this.runoff+=d.volume;this._release(this.drops,i--);}
   else if(d.age>d.life||d.volume<MIN_VOLUME){this.evaporated+=d.volume;this._release(this.drops,i--);}
  }
  for(let i=0;i<this.beads.length;i++){
   const b=this.beads[i];b.age+=dt;const loss=b.volume*(b.age>6?.11:.014)*dt;b.volume-=loss;this.evaporated+=loss;b.r=Math.cbrt(b.volume);
   if(b.age>b.life||b.volume<MIN_VOLUME){this.evaporated+=b.volume;this._release(this.beads,i--,true);}
  }
  this.merge();
  // Deposited water thins in place; gravity is carried by mobile heads. Keeping
  // the film anchored prevents scrolling trails and avoids an expensive grid solver.
  const decay=Math.exp(-dt*.31);let total=0;
  for(let i=0;i<this.film.length;i++){
   const m=this.film[i];if(m<=0)continue;
   this.filmLife[i]-=dt;let next=this.filmLife[i]>0?m*decay:0;
   if(next<.000004)next=0;this.evaporated+=m-next;this.film[i]=next;total+=next;
  }
  this.filmTotal=total;
  this.wet=this.drops.length>0||this.beads.length>0||total>.0001||this.sheets.some(s=>s.active);
  this.version++;
 }
 step(dt,state={}){
  if(!Number.isFinite(dt)||dt<=0)return;
  if(!this.wet&&(!(state.rain>0)||state.sheltered)){this.accumulator=0;return;}
  // At most eight fixed updates after a slow frame. Pause/resume never catches
  // up hidden seconds; ordinary 30/60/120 Hz runs follow the same tick sequence.
  this.accumulator=Math.min(this.accumulator+Math.min(dt,.25),STEP*8);
  while(this.accumulator+1e-10>=STEP){this._tick(STEP,state);this.accumulator-=STEP;}
  if(this.accumulator<0)this.accumulator=0;
 }
 _cap(d){
  const w=this.fieldWidth,h=this.fieldHeight,r=d.r*RADIUS,stretch=clamp(d.stretch,1,2.4);
  const ax=Math.sin(d.angle),ay=Math.cos(d.angle);
  const extent=r*stretch,x0=Math.max(0,Math.floor((d.x-extent/this.aspect)*w)),x1=Math.min(w-1,Math.ceil((d.x+extent/this.aspect)*w));
  const y0=Math.max(0,Math.floor((d.y-extent)*h)),y1=Math.min(h-1,Math.ceil((d.y+extent)*h));
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
   const dx=((x+.5)/w-d.x)*this.aspect,dy=(y+.5)/h-d.y;
   const along=dx*ax+dy*ay,cross=dx*ay-dy*ax;
   const q=(cross/r)**2+(along/(r*stretch))**2;if(q>=1)continue;
   const dome=Math.sqrt(1-q),value=d.r*.68*dome;
   this.heightField[y*w+x]+=value;
  }
 }
 buildTexture(){
  if(this.textureVersion===this.version)return false;
  const w=this.fieldWidth,h=this.fieldHeight,H=this.heightField,out=this.pixels;
  // Optical height is art-directed: a thin deposited strand must survive the
  // low-resolution scene and subsequent VHS filtering. Mass stays separate.
  const filmScale=1/(this.cellArea*520);
  for(let i=0;i<H.length;i++)H[i]=Math.min(1.6,this.film[i]*filmScale);
  for(const b of this.beads)this._cap(b);for(const d of this.drops)this._cap(d);
  for(const s of this.sheets){if(!s.active)continue;
   const u=clamp(s.age/s.life,0,1),strength=.72*Math.pow(1-u,.65);
   const top=-.12+1.2*u*u,halfWidth=.51-.06*u;
   for(let y=0;y<h;y++){
    const v=(y+.5)/h;
    for(let x=0;x<w;x++){
     const a=(x+.5)/w,dx=a-s.x-s.lean*(v-.5);
     const edgeTop=top+.07*Math.sin(a*15+s.seed)+.035*Math.sin(a*31-s.seed*.7);
     const side=halfWidth-Math.abs(dx)+.024*Math.sin(v*19+s.seed);
     const below=v-edgeTop;if(side<=0||below<=0)continue;
     const edge=clamp(Math.min(side*52,below*58),0,1);
     const rib=.80+.20*Math.sin(a*21+v*9+s.seed)+.10*Math.sin(v*37-a*11+s.seed-s.age*17);
     // Asymmetric gaps grow behind the draining top edge; no rectangular wipe.
     const gap=u>.2?clamp((Math.sin(a*24+s.seed)+.35*Math.sin(a*43-s.seed)-.5)*u*1.2,0,.85):0;
     H[y*w+x]+=strength*edge*rib*(1-gap);
    }
   }
  }
  const sx=.027*w/(2*this.aspect),sy=.027*h/2;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const i=y*w+x,j=i*4,value=H[i];
   const left=H[y*w+Math.max(0,x-1)],right=H[y*w+Math.min(w-1,x+1)];
   const above=H[Math.max(0,y-1)*w+x],below=H[Math.min(h-1,y+1)*w+x];
   // RGB is optical data, not color. Y normals convert CPU top-down to GL up.
   out[j]=Math.round(127.5+clamp(-(right-left)*sx,-2.5,2.5)*51);
   out[j+1]=Math.round(127.5+clamp((below-above)*sy,-2.5,2.5)*51);
   out[j+2]=Math.round(clamp(value/3,0,1)*255);
   out[j+3]=Math.round(clamp(value/.034,0,1)*255);
  }
  this.textureVersion=this.version;return true;
 }
 mass(){let v=this.filmTotal;for(const d of this.drops)v+=d.volume;for(const b of this.beads)v+=b.volume;for(const s of this.sheets)if(s.active)v+=s.volume;return v;}
}

// API and crossing/stride semantics are preserved for main.js and water-impact.js.
export class WaterEntryTracker{
 constructor(){this.wet=null;this.distance=0;this.lastGrounded=true;}
 reset(){this.wet=null;this.distance=0;this.lastGrounded=true;}
 update({shore=Infinity,feet=Infinity,level=0,moved=0,speed=0,grounded=true,fallSpeed=0}){const wet=this.wet?shore<.10&&feet<level+.04:shore<-.04&&feet<level-.015;let burst=0;if(this.wet!==null){if(wet&&!this.wet)burst=.5+Math.min(1.2,speed*.22);else if(wet&&grounded&&!this.lastGrounded)burst=.8+Math.min(1,Math.abs(fallSpeed)*.12);if(wet&&grounded){this.distance+=moved;if(this.distance>1.0){this.distance=0;if(speed>.7)burst=Math.max(burst,.18);}}else this.distance=0;}this.wet=wet;this.lastGrounded=grounded;return burst;}
}

export const lensVertex=`precision highp float;
in vec3 position;out vec2 screenUV;
void main(){screenUV=position.xy*.5+.5;gl_Position=vec4(position.xy,0.,1.);}`;
export const lensFragment=`precision highp float;
uniform sampler2D background;uniform sampler2D water;uniform vec2 resolution;
in vec2 screenUV;out vec4 outColor;
void main(){
 vec4 field=texture(water,vec2(screenUV.x,1.-screenUV.y));
 float coverage=smoothstep(.025,.72,field.a);if(coverage<.002)discard;
 vec2 slope=(field.rg-vec2(.5))*5.;
 // Neutral slope quantization (127/128) must not tint or shift a flat wet sheet.
 slope=sign(slope)*max(abs(slope)-vec2(.011),vec2(0.));
 vec3 normal=normalize(vec3(slope,1.));float thickness=field.b*3.;
 float scale=clamp(resolution.y/480.,.45,1.6);
 vec2 offset=normal.xy*(2.2+13.*sqrt(clamp(thickness,0.,1.6)))*scale/resolution;
 vec2 margin=1.5/resolution;
 vec3 scene=texture(background,clamp(screenUV+offset,margin,1.-margin)).rgb;
 float edge=clamp(length(slope)*.90,0.,1.);
 float fresnel=.0204+.9796*pow(1.-normal.z,5.);
 float glint=pow(max(0.,dot(normal,normalize(vec3(-.48,.64,.88)))),28.)*edge;
 float darkEdge=edge*max(0.,dot(normal.xy,normalize(vec2(.45,-.65))))*.36;
 vec3 reflected=vec3(.40,.49,.51);
 vec3 waterColor=mix(scene*(1.-darkEdge),reflected,min(.22,fresnel*edge));
 waterColor+=glint*vec3(.36,.40,.39)+edge*max(0.,normal.y)*vec3(.050,.060,.061);
 outColor=vec4(waterColor,coverage*.97);
}`;

export function createLensWater(renderer,{limit=64}={}){
 const physics=new LensDropletPhysics(limit),entry=new WaterEntryTracker();
 const scene=new T.Scene(),camera=new T.Camera();
 let capture=null,waterTexture=null,width=0,height=0,enabled=true,disposed=false;
 let textureWidth=0,textureHeight=0,uploadedVersion=-1;
 const geometry=new T.BufferGeometry();
 geometry.setAttribute('position',new T.Float32BufferAttribute([-1,-1,0,3,-1,0,-1,3,0],3));
 const material=new T.RawShaderMaterial({glslVersion:T.GLSL3,vertexShader:lensVertex,fragmentShader:lensFragment,
  uniforms:{background:{value:null},water:{value:null},resolution:{value:new T.Vector2(1,1)}},
  transparent:true,depthTest:false,depthWrite:false,toneMapped:false});
 const mesh=new T.Mesh(geometry,material);mesh.frustumCulled=false;scene.add(mesh);
 function reset(){physics.clear();entry.reset();uploadedVersion=-1;}
 function update(dt,state={}){
  if(disposed)return 0;enabled=!!state.enabled;
  if(!enabled){entry.reset();physics.accumulator=0;physics.rainBudget=0;return 0;}
  physics.setAspect(state.aspect||physics.aspect);
  const burst=entry.update(state);
  if(burst>.2)physics.splash(burst);
  else if(burst>0){for(let i=0;i<2;i++)physics.add(.24+physics.rng()*.52,.60+physics.rng()*.27,.70+physics.rng()*.7,0,-.055);}
  physics.step(dt,state);return burst;
 }
 function render(w,h){
  if(disposed||!enabled||!physics.wet||!Number.isFinite(w+h)||w<1||h<1)return false;
  w=Math.max(1,Math.floor(w));h=Math.max(1,Math.floor(h));
  if(w!==width||h!==height||!capture){
   capture?.dispose();width=w;height=h;capture=new T.FramebufferTexture(w,h);
   capture.colorSpace=T.NoColorSpace;capture.minFilter=capture.magFilter=T.LinearFilter;capture.generateMipmaps=false;
   material.uniforms.background.value=capture;material.uniforms.resolution.value.set(w,h);
  }
  if(!waterTexture||textureWidth!==physics.fieldWidth||textureHeight!==physics.fieldHeight){
   waterTexture?.dispose();textureWidth=physics.fieldWidth;textureHeight=physics.fieldHeight;
   waterTexture=new T.DataTexture(physics.pixels,textureWidth,textureHeight,T.RGBAFormat,T.UnsignedByteType);
   waterTexture.colorSpace=T.NoColorSpace;waterTexture.minFilter=waterTexture.magFilter=T.LinearFilter;
   waterTexture.wrapS=waterTexture.wrapT=T.ClampToEdgeWrapping;waterTexture.generateMipmaps=false;waterTexture.flipY=false;
   material.uniforms.water.value=waterTexture;uploadedVersion=-1;
  }
  physics.buildTexture();
  if(uploadedVersion!==physics.version){waterTexture.image.data=physics.pixels;waterTexture.needsUpdate=true;uploadedVersion=physics.version;}
  // Exactly one background copy and one fullscreen triangle, only while wet.
  renderer.copyFramebufferToTexture(capture);
  const old=renderer.autoClear;renderer.autoClear=false;
  try{renderer.render(scene,camera);}finally{renderer.autoClear=old;}
  return true;
 }
 function contextLost(){
  capture?.dispose();waterTexture?.dispose();capture=waterTexture=null;
  width=height=textureWidth=textureHeight=0;uploadedVersion=-1;
  material.uniforms.background.value=material.uniforms.water.value=null;reset();
 }
 function dispose(){if(disposed)return;disposed=true;capture?.dispose();waterTexture?.dispose();geometry.dispose();material.dispose();physics.clear();}
 return{physics,entry,update,render,reset,contextLost,dispose};
}
