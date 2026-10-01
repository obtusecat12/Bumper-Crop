// Deterministic broadband jets, granular tile impacts and a short tiled-room tail.
export function createShowerAudio(heads){
 let context=null,master=null,voices=[],sources=[],room=null,roomGain=null;
 let seed=62213;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 function attach(ctx,output){if(context===ctx)return;dispose();context=ctx;master=output;
  const buffer=ctx.createBuffer(1,ctx.sampleRate*6,ctx.sampleRate),a=buffer.getChannelData(0);let pink=0,impact=0;
  for(let i=0;i<a.length;i++){const n=random()*2-1;pink=pink*.91+n*.09;if(random()<.0008)impact=.10+random()*.18;impact*=.995;
   const phase=i/ctx.sampleRate;const envelope=.82+.12*Math.sin(phase*7.1)+.06*Math.sin(phase*19.7);a[i]=(n*.18+pink*.35)*envelope+impact*(random()*2-1);}
  // Fade the loop seam rather than emit a regular click.
  const seam=512;for(let i=0;i<seam;i++){const u=i/seam;const v=a[i]*u+a[a.length-seam+i]*(1-u);a[i]=a[a.length-seam+i]=v;}
  room=ctx.createConvolver();const ir=ctx.createBuffer(2,Math.floor(ctx.sampleRate*.42),ctx.sampleRate);
  for(let c=0;c<2;c++){const d=ir.getChannelData(c);for(let i=0;i<d.length;i++)d[i]=(random()*2-1)*Math.exp(-i/ctx.sampleRate*15)*.085;for(const delay of[.018,.041,.067,.112])d[Math.floor((delay+c*.003)*ctx.sampleRate)]+=.19*Math.exp(-delay*9);}
  room.buffer=ir;roomGain=ctx.createGain();roomGain.gain.value=.20;room.connect(roomGain);roomGain.connect(master);
  voices=heads.map((_,i)=>{const source=ctx.createBufferSource(),hp=ctx.createBiquadFilter(),lp=ctx.createBiquadFilter(),pan=ctx.createStereoPanner(),gain=ctx.createGain();source.buffer=buffer;source.loop=true;source.playbackRate.value=.97+i*.021;hp.type='highpass';hp.frequency.value=145;lp.type='lowpass';lp.frequency.value=6200;gain.gain.value=0;
   source.connect(hp);hp.connect(lp);lp.connect(pan);pan.connect(gain);gain.connect(master);gain.connect(room);source.start(0,i*.67);sources.push(source);return{gain,pan,lp,hp};});
 }
 function update(presets,player,yaw,enabled){if(!context)return;const now=context.currentTime;
  voices.forEach((v,i)=>{const h=heads[i],dx=h.x-player.x,dz=h.z-player.z,d=Math.hypot(dx,dz),side=dx*Math.cos(yaw)-dz*Math.sin(yaw);
   const strength=enabled&&presets[i]>0?(.36/(1+d*d*.40))*(presets[i]===2?1.08:1):0;
   v.gain.gain.setTargetAtTime(strength,now,.075);v.pan.pan.setTargetAtTime(Math.max(-.85,Math.min(.85,side/Math.max(1,d))),now,.12);v.lp.frequency.setTargetAtTime(6500/(1+d*.12),now,.2);
  });
 }
 function mute(){if(context)voices.forEach(v=>v.gain.gain.setTargetAtTime(0,context.currentTime,.045));}
 function dispose(){sources.forEach(s=>{try{s.stop();}catch{}s.disconnect();});voices.forEach(v=>{v.hp.disconnect();v.lp.disconnect();v.pan.disconnect();v.gain.disconnect();});room?.disconnect();roomGain?.disconnect();sources=[];voices=[];context=null;master=null;}
 return{attach,update,mute,dispose};
}
