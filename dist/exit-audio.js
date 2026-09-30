import {ease} from './exit-route.js?v=60';
// Footstep PCM is decoded once. A step only creates one short source and gain;
// no per-step noise buffer synthesis, convolution or CPU reverb loop.
export class ExitAudio{
 constructor(){this.ctx=null;this.progress=0;this.city=false;this.buffers={};this.ready=null;this.lastTime=0;}
 attach(ctx,master){if(this.ctx)return;this.ctx=ctx;this.master=master;
  this.return=ctx.createGain();this.return.gain.value=0;this.return.connect(master);
  this.echo=ctx.createGain();for(const [delay,level] of [[.067,.19],[.127,.10],[.181,.055]]){const d=ctx.createDelay(.25),g=ctx.createGain(),f=ctx.createBiquadFilter();d.delayTime.value=delay;g.gain.value=level;f.type='lowpass';f.frequency.value=1700;this.echo.connect(d);d.connect(f);f.connect(g);g.connect(this.return);}
  this.hum=ctx.createGain();this.hum.gain.value=0;this.hum.connect(master);
  for(const [hz,gain]of [[53,.16],[106,.05],[157,.025]]){const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.value=hz;g.gain.value=gain;o.connect(g);g.connect(this.hum);o.start();}
  this.alarm=ctx.createOscillator();this.alarm.type='sine';this.alarm.frequency.value=610;this.alarmGain=ctx.createGain();this.alarmGain.gain.value=0;const f=ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=850;this.alarm.connect(f);f.connect(this.alarmGain);this.alarmGain.connect(master);this.alarm.start();
  this.ready=Promise.all(['dirt','gravel','asphalt'].map(async kind=>{const r=await fetch(new URL('./audio/'+kind+'_step.wav',import.meta.url));if(!r.ok)throw Error('Footstep '+r.status);this.buffers[kind]=await ctx.decodeAudioData(await r.arrayBuffer());})).catch(e=>console.warn('Exit footsteps could not load',e));
 }
 update(progress,city,time){this.progress=progress;this.city=city;this.lastTime=time;if(!this.ctx)return;const t=this.ctx.currentTime,urban=city?1:ease(.58,.98,progress);this.hum.gain.setTargetAtTime(urban*.18,t,.6);this.return.gain.setTargetAtTime(urban,t,.3);const phrase=Math.sin(time*.032)> .982?1:0;this.alarm.frequency.setTargetAtTime(525+Math.sin(time*.6)*65,t,.5);this.alarmGain.gain.setTargetAtTime(urban*phrase*.006,t,2);}
 step(){if(!this.ctx||!this.buffers.dirt)return false;const t=this.ctx.currentTime,p=this.city?1:this.progress,asphalt=ease(.37,.70,p),gravel=ease(.14,.40,p)*(1-asphalt),dirt=1-Math.max(asphalt,gravel),pitch=.95+Math.random()*.10;
  for(const [kind,level]of [['dirt',dirt],['gravel',gravel],['asphalt',asphalt]]){if(level<.015)continue;const src=this.ctx.createBufferSource(),g=this.ctx.createGain();src.buffer=this.buffers[kind];src.playbackRate.value=pitch;g.gain.value=.31*level;src.connect(g);g.connect(this.master);g.connect(this.echo);src.start(t);src.onended=()=>{src.disconnect();g.disconnect();};}return true;
 }
}
