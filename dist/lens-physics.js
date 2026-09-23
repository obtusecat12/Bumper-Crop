
// A bounded, physically inspired lens-water model: retained beads, mobile heads,
// volume-conserving coalescence, deposited film and short draining sheets. Not CFD.
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const STEP=1/30, RADIUS=.016, MIN_VOLUME=.012;
function record(){return{x:0,y:0,r:0,volume:0,vx:0,vy:0,age:0,life:0,stretch:1,angle:0,moving:false,seed:0,pin:1,uid:0,active:false,tailX:0,tailY:0,neck:1,stress:0,pinAge:0,adhesionCell:-1,barrierStatic:0,barrierRadius:1,barrierYield:1.8};}

export class LensDropletPhysics{
 constructor(limit=64,rng=Math.random){
  this.limit=clamp(Math.floor(limit)||64,1,64);this.rng=rng;this.aspect=4/3;
  this.drops=[];this.beads=[];this.beadLimit=128;
  this._heads=Array.from({length:this.limit},record);this._beads=Array.from({length:this.beadLimit},record);
  this._freeHeads=this._heads.slice();this._freeBeads=this._beads.slice();
  this.sheets=Array.from({length:2},()=>({active:false,age:0,life:1,volume:0,total:0,seed:0,x:.5,lean:0,targets:new Array(7).fill(null),ids:new Int32Array(7)}));
  this.time=0;this.accumulator=0;this.rainBudget=0;this.serial=0;this.version=0;this.textureVersion=-1;
  this.injected=0;this.evaporated=0;this.runoff=0;this.filmTotal=0;
  this.rings=Array.from({length:16},()=>({active:false,age:0,life:.5,x:0,y:0,r:1,volume:0}));
  this.sheet={active:false,submerged:false,age:0,life:.5,seed:0,volume:0,total:0,spawned:false};
  this.humidity=.45;this.blueTransient=0;this.pinches=0;this.stickEvents=0;this.slipEvents=0;
  this._allocateField(256,192);this.wet=false;
 }
 _allocateField(w,h){
  this.fieldWidth=w;this.fieldHeight=h;const n=w*h;
  this.film=new Float32Array(n);this.filmLife=new Float32Array(n);
  this.heightField=new Float32Array(n);this.coverageField=new Float32Array(n);this.pixels=new Uint8Array(n*4);
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
  this.drops.length=this.beads.length=0;this._freeHeads.length=this._freeBeads.length=0;for(let i=0;i<this._heads.length;i++)this._freeHeads.push(this._heads[i]);for(let i=0;i<this._beads.length;i++)this._freeBeads.push(this._beads[i]);
  for(const s of this.sheets){s.active=false;s.volume=0;s.targets.fill(null);}
  this.film.fill(0);this.filmLife.fill(0);this.heightField.fill(0);this.pixels.fill(0);
  this.time=this.accumulator=this.rainBudget=this.filmTotal=this.injected=this.evaporated=this.runoff=0;
  for(const r of this.rings){r.active=false;r.volume=0;}
  Object.assign(this.sheet,{active:false,submerged:false,age:0,volume:0,total:0,spawned:false});
  this.blueTransient=this.pinches=this.stickEvents=this.slipEvents=0;
  this.wet=false;this.version++;
 }
 _init(d,x,y,r,vx,vy){
  d.x=x;d.y=y;d.r=r;d.volume=r*r*r;d.vx=vx;d.vy=vy;d.age=0;
  d.life=60+this.rng()*35;d.stretch=1;d.angle=0;d.moving=Math.hypot(vx,vy)>.025;
  d.tailX=x;d.tailY=y;d.neck=1;d.stress=0;d.pinAge=0;d.adhesionCell=-1;d.barrierStatic=0;d.barrierRadius=r;d.barrierYield=1.8;d.seed=this.rng()*Math.PI*2;d.pin=.78+this.rng()*.44;d.uid=++this.serial;d.active=true;
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
  const d=list[index];d.active=false;for(let j=index;j<list.length-1;j++)list[j]=list[j+1];list.pop();(isBead?this._freeBeads:this._freeHeads).push(d);
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
 // Foot-entry spray remains independent of the actual camera-water crossing.
 splash(power=1){
  power=clamp(Number.isFinite(power)?power:1,.1,2);
  for(let i=0;i<Math.ceil(3+power*3);i++){
   const x=.12+this.rng()*.76,y=.50+this.rng()*.42,r=.7+this.rng()*.8+power*.22;
   this.add(x,y,r,(this.rng()-.5)*.11,-.06-this.rng()*.09);
  }
  this.wet=true;this.version++;
 }
 setCameraWet(submerged,crossing=0){
  const s=this.sheet;let changed=false;
  if(submerged){
   if(!s.submerged){
    if(s.volume>0)this.deposit(.5,.5,.4,s.volume,7);
    s.active=s.submerged=true;s.age=0;s.life=.3+this.rng()*.4;s.seed=this.rng()*6.28;s.volume=s.total=24;s.spawned=false;
    this.injected+=24;this.blueTransient=.07;changed=true;
   }
   s.active=true;
  }else if(s.submerged||crossing===-1){
   s.submerged=false;s.active=true;s.age=0;s.life=.68;s.spawned=false;
   this.blueTransient=Math.max(this.blueTransient,.045);changed=true;
  }
  if(s.active){this.wet=true;if(changed)this.version++;}
 }
 impact(x,y,r=1){
  let ring=this.rings.find(r=>!r.active);
  if(!ring)ring=this.rings.reduce((a,b)=>a.age/a.life>b.age/b.life?a:b);
  if(ring.active&&ring.volume>0)this.deposit(ring.x,ring.y,ring.r*RADIUS*.7,ring.volume,4);
  ring.active=true;ring.x=x;ring.y=y;ring.r=r;ring.age=0;ring.life=.3+this.rng()*.5;ring.volume=r*r*r;
  this.injected+=ring.volume;this.wet=true;this.version++;return ring;
 }
 _transferredBead(x,y,volume){
  if(volume<=0)return;
  const before=this.injected,b=this._addBead(x,y,Math.cbrt(volume));this.injected=before;
  if(b){b.moving=false;b.pin=1.9+this.rng()*.7;b.life=120;}
 }
 _drainSheets(dt){
  this.blueTransient*=Math.exp(-dt*7);
  const s=this.sheet;
  if(s.active){
   s.age+=dt;
   if(!s.submerged){
    // A continuous field opens holes; their uneven rims leave patches and heads.
    const portion=Math.min(s.volume,s.total*dt/s.life);s.volume-=portion;
    const count=7;
    for(let i=0;i<count;i++){
     const x=.06+(i+.5)*.88/count+.023*Math.sin(s.seed+i*4.1),y=.025+Math.min(.9,s.age/s.life)*.83;
     this.deposit(x,y,.036,portion/count,5);
    }
    if(!s.spawned&&s.age>s.life*.36){
     s.spawned=true;const mass=Math.min(s.volume,s.total*.38);s.volume-=mass;
     for(let i=0;i<7;i++){
      const x=.10+(i+.5)*.8/7+.024*Math.sin(s.seed+i),y=.08+s.age/s.life*.53;
      const before=this.injected,d=this.add(x,y,Math.cbrt(mass/7),(this.rng()-.5)*.045,.06+this.rng()*.12);this.injected=before;
      if(!d)this.deposit(x,y,.03,mass/7,4);
     }
    }
    if(s.age>=s.life){this.deposit(.5,.76,.2,s.volume,4);s.volume=0;s.active=false;}
   }
  }
  for(const ring of this.rings){
   if(!ring.active)continue;ring.age+=dt;
   if(ring.age>=ring.life){
    const v=ring.volume,before=this.injected;
    if(ring.r>.92){const d=this.add(ring.x,ring.y,Math.cbrt(v),0,.015);if(!d)this.deposit(ring.x,ring.y,.02,v,4);}
    else this._addBead(ring.x,ring.y,Math.cbrt(v));
    this.injected=before;ring.volume=0;ring.active=false;
   }
  }
 }
 _rain(dt,state){
  const intensity=clamp(state.rain||0,0,1);if(state.sheltered||intensity<=0||this.sheet.submerged){this.rainBudget=0;return;}
  const wind=state.wind||0,windX=Number.isFinite(state.windX)?state.windX:typeof wind==='number'?wind:wind.x||0;
  const windZ=Number.isFinite(state.windZ)?state.windZ:typeof wind==='number'?0:wind.z||0;
  const velocity=state.cameraVelocity||state.velocity||{};
  const speed=Number.isFinite(state.cameraSpeed)?state.cameraSpeed:Math.hypot(velocity.x||0,velocity.y||0,velocity.z||0)||state.speed||0;
  const pitch=state.pitch||0,yaw=state.yaw||0,cp=Math.cos(pitch);
  const forwardX=-Math.sin(yaw)*cp,forwardY=Math.sin(pitch),forwardZ=-Math.cos(yaw)*cp;
  const hasVelocity=Number.isFinite(velocity.x)&&Number.isFinite(velocity.z);
  const vx=hasVelocity?velocity.x:forwardX*speed,vy=velocity.y||0,vz=hasVelocity?velocity.z:forwardZ*speed;
  // Relative incoming rain velocity dotted into the lens-facing normal.
  const relativeDot=(windX*.8-vx)*forwardX+(-8-vy)*forwardY+(windZ*.8-vz)*forwardZ;
  const flux=clamp(.15+Math.max(0,-relativeDot)/8,.10,1.9);
  const rate=intensity*(3.5+12.5*flux)*(1+.10*Math.sin(this.time*.83));
  this.rainBudget=Math.min(3,this.rainBudget+dt*rate);
  while(this.rainBudget>=1){
   this.rainBudget--;const x=.025+this.rng()*.95,y=.025+this.rng()*.93;
   this.impact(x,y,this.rng()<.52?.30+this.rng()*.52:1.04+this.rng()*.98);
  }
 }
 _filmSample(x,y){
  const xx=clamp(Math.floor(x*this.fieldWidth),0,this.fieldWidth-1),yy=clamp(Math.floor(y*this.fieldHeight),0,this.fieldHeight-1);
  return this.film[yy*this.fieldWidth+xx];
 }
 _tick(dt,state){
  this.time+=dt;this.humidity=clamp(Number.isFinite(state.humidity)?state.humidity:(.42+(state.rain||0)*.43+(state.moisture||0)*.10),0,.99);
  this._rain(dt,state);this._drainSheets(dt);
  const dry=clamp((1-this.humidity)/.58,.05,1.72);
  const pitch=Number.isFinite(state.pitch)?state.pitch:0,roll=Number.isFinite(state.roll)?state.roll:0;
  const gx=Math.sin(roll)*.82-clamp(state.accelX||0,-2,2)*.12;
  const gy=Math.cos(roll)*Math.max(.05,Math.cos(pitch))*.92+clamp(state.accelY||0,-2,2)*.10;
  const force=Math.max(.001,Math.hypot(gx,gy));
  for(let i=0;i<this.drops.length;i++){
   const d=this.drops[i];d.age+=dt;const oldX=d.x,oldY=d.y;
   const disorder=1+.28*Math.sin(d.x*63+d.seed)+.26*Math.sin(d.y*91-d.seed*.7);
   const ordinaryStatic=.73*d.pin*disorder/Math.max(.08,d.r*d.r);
   // Fixed heterogeneous glass sites, not a temporal oscillation. A larger
   // leading head can meet a strong local contact-line obstacle, stop, and
   // release after its retained meniscus strains or coalescence adds volume.
   const cellX=Math.floor(d.x*this.aspect/.067),cellY=Math.floor(d.y/.061);
   const cellId=(cellY+16)*256+cellX+16;
   const noise=Math.sin(cellX*127.1+cellY*311.7+19.19)*43758.5453;
   const siteStrength=noise-Math.floor(noise);
   if(cellId!==d.adhesionCell){
    if(d.adhesionCell!==-1&&d.moving&&d.r>.72&&d.barrierStatic===0&&siteStrength>.43){
     d.barrierStatic=force*(1.45+.85*siteStrength);d.barrierRadius=d.r;d.stress=0;
     const yieldNoise=Math.sin(cellX*73.7-cellY*269.5+7.1)*25645.564;
     d.barrierYield=1.4+3.2*(yieldNoise-Math.floor(yieldNoise));
    }
    d.adhesionCell=cellId;
   }
   const barrier=d.barrierStatic>0;
   const localStatic=barrier?d.barrierStatic*d.barrierRadius*d.barrierRadius/Math.max(.08,d.r*d.r):0;
   const staticThreshold=Math.max(ordinaryStatic,localStatic);
   const dynamicThreshold=barrier?localStatic*.77:ordinaryStatic*.50;
   if(!d.moving){
    d.pinAge+=dt;
    const strainRate=barrier?force*d.barrierYield:force*.14;
    d.stress=Math.min(barrier?Math.max(2.8*force,localStatic*1.3):.40,d.stress+strainRate*dt);
    if(force+d.stress>staticThreshold&&d.pinAge>.075){
     d.moving=true;d.pinAge=0;d.stress=0;d.barrierStatic=0;this.slipEvents++;
    }
   }else if(force<dynamicThreshold&&Math.hypot(d.vx,d.vy)<.038){
    d.moving=false;d.pinAge=0;d.stress=0;d.vx=d.vy=0;this.stickEvents++;
   }
   const activeRetention=d.barrierStatic>0?dynamicThreshold:ordinaryStatic*.50;
   const slip=d.moving?Math.max(0,force-activeRetention)/force:0;
   const dragRate=!d.moving?22:d.barrierStatic>0?18:2.3+.6/Math.max(.4,d.r);
   const drag=Math.exp(-dt*dragRate);
   const lateral=d.moving?Math.sin(d.seed+d.y*36+this.time*.39)*(.047+.02*d.r):0;
   const delta=.010/this.aspect,wetSteer=clamp((this._filmSample(d.x+delta,d.y+.025)-this._filmSample(d.x-delta,d.y+.025))*7,-.032,.032);
   d.vx=d.moving?(d.vx+(gx*slip+lateral+wetSteer)*dt)*drag:0;d.vy=d.moving?(d.vy+gy*slip*dt)*drag:0;
   let speed=Math.hypot(d.vx,d.vy);const maxSpeed=.15+Math.min(.26,d.r*.075);
   if(speed>maxSpeed){d.vx*=maxSpeed/speed;d.vy*=maxSpeed/speed;speed=maxSpeed;}
   d.x+=d.vx*dt/this.aspect;d.y+=d.vy*dt;
   d.stretch+=(1+Math.min(.5,speed*1.6)-d.stretch)*(1-Math.exp(-dt*8));
   if(speed>.003)d.angle=Math.atan2(d.vx,d.vy);
   const tailLength=Math.hypot((d.x-d.tailX)*this.aspect,d.y-d.tailY),radius=d.r*RADIUS;
   // The contact line holds the rear while the head advances: capillary neck thins.
   const tension=tailLength/Math.max(.003,radius);
   d.neck=clamp(d.neck-dt*Math.max(0,tension-1.35)*(.9+speed*3),.04,1);
   if(d.moving&&tension>2.25&&d.neck<.18&&d.volume>.11){
    const beadMass=Math.min(d.volume*.095,.38),bx=d.tailX,by=d.tailY;
    d.volume-=beadMass;this._transferredBead(bx,by,beadMass);
    // Break the bridge, retain its far bead, and let the compact head accelerate.
    d.tailX=d.x-Math.sin(d.angle)*radius*.45/this.aspect;
    d.tailY=d.y-Math.cos(d.angle)*radius*.45;d.neck=1;d.vx*=1.12;d.vy*=1.12;this.pinches++;
   }else if(tailLength>radius*4.6){d.tailX+=(d.x-d.tailX)*.12;d.tailY+=(d.y-d.tailY)*.12;}
   if(speed>.008){
    const volume=Math.min(Math.max(0,d.volume-MIN_VOLUME),d.volume*(.09+speed*.40)*dt);
    d.volume-=volume;this._trail(oldX,oldY,d.x,d.y,d,volume);
   }
   const loss=Math.min(d.volume,.009*dry*Math.max(.12,d.r)*dt);d.volume-=loss;this.evaporated+=loss;d.r=Math.cbrt(Math.max(0,d.volume));
   if(d.x<-.08||d.x>1.08||d.y<-.10||d.y>1.09){this.runoff+=d.volume;this._release(this.drops,i--);}
   else if(d.volume<MIN_VOLUME){this.evaporated+=d.volume;this._release(this.drops,i--);}
  }
  for(let i=0;i<this.beads.length;i++){
   const b=this.beads[i];b.age+=dt;const loss=Math.min(b.volume,.0038*dry*Math.max(.1,b.r)*dt);b.volume-=loss;this.evaporated+=loss;b.r=Math.cbrt(b.volume);
   if(b.volume<MIN_VOLUME){this.evaporated+=b.volume;this._release(this.beads,i--,true);}
  }
  this.merge();
  // Fixed footprints erode from their thin edges as mass drops below optical coverage.
  const decay=Math.exp(-dt*.30*dry);let total=0;
  for(let i=0;i<this.film.length;i++){
   const m=this.film[i];if(m<=0)continue;this.filmLife[i]-=dt*dry;
   let next=m*decay;if(this.filmLife[i]<0)next*=Math.exp(-dt*.8*dry);
   if(next<.000004)next=0;this.evaporated+=m-next;this.film[i]=next;total+=next;
  }
  this.filmTotal=total;
  this.wet=this.drops.length>0||this.beads.length>0||total>.0001||this.sheet.active||this.rings.some(r=>r.active);
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
  const w=this.fieldWidth,h=this.fieldHeight,r=d.r*RADIUS,stretch=clamp(d.stretch,1,1.5);
  const ax=Math.sin(d.angle),ay=Math.cos(d.angle),extent=r*stretch;
  const x0=Math.max(0,Math.floor((d.x-extent/this.aspect)*w)),x1=Math.min(w-1,Math.ceil((d.x+extent/this.aspect)*w));
  const y0=Math.max(0,Math.floor((d.y-extent)*h)),y1=Math.min(h-1,Math.ceil((d.y+extent)*h));
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
   const dx=((x+.5)/w-d.x)*this.aspect,dy=(y+.5)/h-d.y;
   const along=dx*ax+dy*ay,cross=dx*ay-dy*ax;
   const q=(cross/r)**2+(along/(r*stretch))**2;if(q>=1)continue;
   this.heightField[y*w+x]+=d.r*.68*Math.sqrt(1-q);
  }
  if(d.moving)this._tailCap(d);
 }
 _tailCap(d){
  const dx=(d.x-d.tailX)*this.aspect,dy=d.y-d.tailY,len=Math.hypot(dx,dy);if(len<.005)return;
  const w=this.fieldWidth,h=this.fieldHeight,r=d.r*RADIUS,margin=r*.55;
  const x0=clamp(Math.floor((Math.min(d.x,d.tailX)-margin/this.aspect)*w),0,w-1),x1=clamp(Math.ceil((Math.max(d.x,d.tailX)+margin/this.aspect)*w),0,w-1);
  const y0=clamp(Math.floor((Math.min(d.y,d.tailY)-margin)*h),0,h-1),y1=clamp(Math.ceil((Math.max(d.y,d.tailY)+margin)*h),0,h-1);
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
   const px=((x+.5)/w-d.tailX)*this.aspect,py=(y+.5)/h-d.tailY,t=(px*dx+py*dy)/(len*len);
   if(t<0||t>1)continue;
   const bend=Math.sin(t*3.14159265)*Math.sin(d.seed+d.age*1.3)*r*.23;
   const cross=(px*dy-py*dx)/len-bend;
   const neck=1-(1-d.neck)*Math.exp(-(((t-.30)/.16)**2));
   const radius=r*(.075+.49*t*t)*neck,q=(cross/Math.max(radius,.0005))**2;
   if(q<1)this.heightField[y*w+x]+=d.r*.30*(.10+.9*t)*Math.sqrt(1-q)*neck;
  }
 }
 buildTexture(includeSheet=true){
  if(this.textureVersion===this.version)return false;
  const w=this.fieldWidth,h=this.fieldHeight,H=this.heightField,C=this.coverageField,out=this.pixels,filmScale=1/(this.cellArea*520);
  C.fill(0);
  for(let i=0;i<H.length;i++)H[i]=Math.max(0,Math.min(1.6,this.film[i]*filmScale)-.011);
  for(const b of this.beads)this._cap(b);for(const d of this.drops)this._cap(d);
  const sheet=this.sheet;
  if(sheet.active&&includeSheet){
   const progress=sheet.submerged?0:clamp(sheet.age/sheet.life,0,1),threshold=-.18+progress*1.5;
   for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const u=(x+.5)/w,v=(y+.5)/h,seed=sheet.seed;
    const pattern=.49+.22*Math.sin(u*13+Math.sin(v*8+seed)*1.9+seed)+.17*Math.cos(v*17-u*6+seed)+.10*Math.sin(u*31+v*23-seed);
    const patch=clamp((pattern-threshold)*9,0,1),wave=.57+.085*Math.sin(u*15+v*9-this.time*3)+.055*Math.cos(v*24-u*8+this.time*2);
    const edge=4*patch*(1-patch);
    const i=y*w+x;H[i]+=(wave*patch+edge*.17)*(1-progress*.55);C[i]=Math.max(C[i],patch);
   }
  }
  for(const ring of this.rings){
   if(!ring.active)continue;const t=clamp(ring.age/ring.life,0,1),r=RADIUS*ring.r*(.55+1.05*t),strength=Math.pow(Math.sin(Math.PI*t),.65)*(1-t*.5);
   const x0=clamp(Math.floor((ring.x-r*1.6/this.aspect)*w),0,w-1),x1=clamp(Math.ceil((ring.x+r*1.6/this.aspect)*w),0,w-1);
   const y0=clamp(Math.floor((ring.y-r*1.6)*h),0,h-1),y1=clamp(Math.ceil((ring.y+r*1.6)*h),0,h-1);
   for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
    const q=Math.hypot(((x+.5)/w-ring.x)*this.aspect,(y+.5)/h-ring.y)/Math.max(r,.002);
    if(q>1.6)continue;const i=y*w+x;
    const rim=Math.exp(-(((q-.88)/.19)**2)),bowl=Math.exp(-q*q*3.0);
    H[i]+=(rim*.53-bowl*.27)*strength*ring.r;
    C[i]=Math.max(C[i],clamp((1.52-q)*5,0,1)*(1-t*.78));
   }
  }
  for(let i=0;i<H.length;i++){
   const j=i*4,value=clamp(H[i],-3.9,3.9);
   // R is signed height (128 is zero), G coverage, B thickness; all non-color data.
   out[j]=clamp(Math.round(128+value*31.75),0,255);
   out[j+1]=Math.round(clamp(Math.max(C[i],Math.max(0,value)/.043),0,1)*255);
   out[j+2]=Math.round(clamp(Math.abs(value)/3,0,1)*255);out[j+3]=255;
  }
  this.textureVersion=this.version;return true;
 }
 mass(){let v=this.filmTotal;for(const d of this.drops)v+=d.volume;for(const b of this.beads)v+=b.volume;if(this.sheet.active)v+=this.sheet.volume;for(const r of this.rings)if(r.active)v+=r.volume;return v;}
}

// API and crossing/stride semantics are preserved for main.js and water-impact.js.
export class WaterEntryTracker{
 constructor(){this.wet=null;this.distance=0;this.lastGrounded=true;}
 reset(){this.wet=null;this.distance=0;this.lastGrounded=true;}
 update({shore=Infinity,feet=Infinity,level=0,moved=0,speed=0,grounded=true,fallSpeed=0}){const wet=this.wet?shore<.10&&feet<level+.04:shore<-.04&&feet<level-.015;let burst=0;if(this.wet!==null){if(wet&&!this.wet)burst=.5+Math.min(1.2,speed*.22);else if(wet&&grounded&&!this.lastGrounded)burst=.8+Math.min(1,Math.abs(fallSpeed)*.12);if(wet&&grounded){this.distance+=moved;if(this.distance>1.0){this.distance=0;if(speed>.7)burst=Math.max(burst,.18);}}else this.distance=0;}this.wet=wet;this.lastGrounded=grounded;return burst;}
}


// Camera height, never foot height, drives the continuous lens-water film.
export class CameraWaterTracker{
 constructor(){this.wet=null;this.result={submerged:false,crossing:0};}
 reset(){this.wet=null;}
 update({cameraHeight=Infinity,level=0,hasWater=false,shore=-Infinity}={}){
  const valid=hasWater&&Number.isFinite(cameraHeight)&&Number.isFinite(level)&&shore<.10;
  const next=valid&&(this.wet?cameraHeight<level+.028:cameraHeight<level-.018);
  const crossing=this.wet===null?0:next!==this.wet?(next?1:-1):0;
  this.wet=next;this.result.submerged=next;this.result.crossing=crossing;return this.result;
 }
}
