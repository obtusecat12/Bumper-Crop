// Probabilities apply once per eligible weather round, never per rendered frame.
export const WEATHER_CHANCES=Object.freeze({rain:.10,fog:.10,blackout:.01,wallpaper:.01,sunbreak:.01});
export const WEATHER_LABELS=Object.freeze({normal:'阴天',rain:'阵雨',fog:'浓雾',blackout:'天空断电',wallpaper:'重复的蓝天',sunbreak:'晴空与黄昏'});
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
export function chooseWeather(value){let total=0;for(const [kind,chance] of Object.entries(WEATHER_CHANCES)){total+=chance;if(value<total)return kind;}return 'normal';}
export function weatherEnvelope(kind,t,duration,{manual=false}={}){
 const v={kind,rain:0,mist:0,fogProgress:0,blackout:0,wallpaper:0,clear:0,dusk:0,flare:0,stageAge:0,stageReveal:0,stageRestore:0};
 if(kind==='rain')v.rain=(manual ? .45+.55*smooth(t/1.2):smooth(t/5))*smooth((duration-t)/8);
 // Manual and natural fog share the same 90-second spatial arrival. Density
 // is not a whole-screen fade-in. Allow a long hold before a 24-second retreat.
 if(kind==='fog'){v.fogProgress=clamp(t/90);v.mist=smooth((duration-t)/24);}
 if(kind==='blackout'){
  // Reveal the lighting rig in haze, then drop lamp banks. Ground illumination
  // is not part of this anomaly. One false-start during restoration, no strobe.
  v.stageAge=t;v.stageReveal=smooth(t/.42)*smooth((duration-t)/.65);
  v.stageRestore=Math.max(0,t-duration+1.3);
  v.blackout=t<duration-1.3?smooth((t-1.50)/.50):t<duration-.96?.22:t<duration-.72?.90:1-smooth((t-duration+.72)/.72);
 }
 if(kind==='wallpaper')v.wallpaper=smooth(t/.8)*smooth((duration-t)/1.7);
 if(kind==='sunbreak'){
  v.clear=(manual ? .35+.65*smooth(t/1.2):smooth(t/2))*smooth((duration-t)/4);
  v.dusk=smooth((t-4)/5)*smooth((duration-t)/4);
  v.flare=v.clear*(1-v.dusk*.92)*smooth((duration-t)/4);
 }
 return v;
}
export class WeatherDirector{
 constructor({rng=Math.random,onCue=()=>{}}={}){this.rng=rng;this.onCue=onCue;this.kind='normal';this.age=0;this.duration=0;this.wait=80+rng()*70;this.wetness=0;this.restoreCued=false;this.cutCued=false;this.rounds=0;this.manual=false;this.elapsed=0;this.delta=0;this.lastTimestamp=null;this.clockActive=false;this.value=weatherEnvelope('normal',0,1);}
 start(kind,{manual=false}={}){if(!Object.hasOwn(WEATHER_LABELS,kind))return false;
  this.serial=(this.serial||0)+1;this.kind=kind;this.age=0;this.restoreCued=false;this.cutCued=false;this.manual=manual;
  this.duration=kind==='rain'?95+this.rng()*55:kind==='fog'?210+this.rng()*60:kind==='blackout'?14+this.rng()*6:kind==='wallpaper'?22+this.rng()*14:kind==='sunbreak'?18:0;
  this.wait=100+this.rng()*70;return true;
 }
 // Weather follows active wall time. Movement keeps its separate bounded step.
 resetClock(){this.lastTimestamp=null;this.clockActive=false;this.delta=0;}
 tick(timestamp,active=true){this.delta=active&&this.clockActive&&this.lastTimestamp!==null?Math.max(0,(timestamp-this.lastTimestamp)/1000):0;this.lastTimestamp=timestamp;this.clockActive=active;return this.update(this.delta,active);}
 update(dt,active=true){if(!active)return this.value;dt=Number.isFinite(dt)?Math.max(0,dt):0;this.elapsed+=dt;
  if(this.kind==='normal'){if(this.automatic!==false)this.wait-=dt;if(this.automatic!==false&&this.wait<=0){this.rounds++;this.start(chooseWeather(this.rng()));}}
  else{this.age+=dt;if(this.kind==='blackout'&&!this.cutCued&&this.age>=1.5){this.cutCued=true;this.onCue('power-off');}if(this.kind==='blackout'&&!this.restoreCued&&this.age>=this.duration-1.3){this.restoreCued=true;this.onCue('power-on');}if(this.age>=this.duration)this.start('normal');}
  this.value=weatherEnvelope(this.kind,this.age,this.duration,{manual:this.manual});
  this.value.serial=this.serial||0;
  const target=this.value.rain>.03?this.value.rain:0;
  this.wetness+=(target-this.wetness)*(1-Math.exp(-dt/(target>this.wetness?24:80)));
  this.value.wetness=this.wetness;return this.value;
 }
}
