// Probabilities apply once per eligible weather round, never per rendered frame.
export const WEATHER_CHANCES=Object.freeze({rain:.10,fog:.10,blackout:.01,wallpaper:.01,sunbreak:.01});
export const WEATHER_LABELS=Object.freeze({normal:'阴天',rain:'阵雨',fog:'浓雾',blackout:'天空断电',wallpaper:'重复的蓝天',sunbreak:'晴空与黄昏'});
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
export function chooseWeather(value){let total=0;for(const [kind,chance] of Object.entries(WEATHER_CHANCES)){total+=chance;if(value<total)return kind;}return 'normal';}
export function weatherEnvelope(kind,t,duration){
 const v={kind,rain:0,mist:0,blackout:0,wallpaper:0,clear:0,dusk:0,flare:0};
 if(kind==='rain')v.rain=smooth(t/12)*smooth((duration-t)/16);
 if(kind==='fog')v.mist=smooth(t/20)*smooth((duration-t)/22);
 if(kind==='blackout'){
  // The contactor drops once; restoration has a brief false start, not a strobe.
  v.blackout=t<duration-1.3?smooth(t/.22):t<duration-.96?.22:t<duration-.72?.90:1-smooth((t-duration+.72)/.72);
 }
 if(kind==='wallpaper')v.wallpaper=smooth(t/.8)*smooth((duration-t)/1.7);
 if(kind==='sunbreak'){
  v.clear=smooth(t/4)*smooth((duration-t)/10);
  v.dusk=smooth((t-16)/10)*smooth((duration-t)/9);
  v.flare=v.clear*(1-v.dusk*.92)*smooth((duration-t)/10);
 }
 return v;
}
export class WeatherDirector{
 constructor({rng=Math.random,onCue=()=>{}}={}){this.rng=rng;this.onCue=onCue;this.kind='normal';this.age=0;this.duration=0;this.wait=80+rng()*70;this.wetness=0;this.restoreCued=false;this.rounds=0;this.value=weatherEnvelope('normal',0,1);}
 start(kind){if(!Object.hasOwn(WEATHER_LABELS,kind))return false;
  this.kind=kind;this.age=0;this.restoreCued=false;
  this.duration=kind==='rain'?95+this.rng()*55:kind==='fog'?90+this.rng()*55:kind==='blackout'?14+this.rng()*6:kind==='wallpaper'?22+this.rng()*14:kind==='sunbreak'?42:0;
  this.wait=100+this.rng()*70;if(kind==='blackout')this.onCue('power-off');return true;
 }
 update(dt,active=true){if(!active)return this.value;dt=Math.max(0,Math.min(.25,dt));
  if(this.kind==='normal'){this.wait-=dt;if(this.wait<=0){this.rounds++;this.start(chooseWeather(this.rng()));}}
  else{this.age+=dt;if(this.kind==='blackout'&&!this.restoreCued&&this.age>=this.duration-1.3){this.restoreCued=true;this.onCue('power-on');}if(this.age>=this.duration)this.start('normal');}
  this.value=weatherEnvelope(this.kind,this.age,this.duration);
  const target=this.value.rain>.03?this.value.rain:0;
  this.wetness+=(target-this.wetness)*(1-Math.exp(-dt/(target>this.wetness?24:80)));
  this.value.wetness=this.wetness;return this.value;
 }
}
