// The unoccupied spa is audibly in use: falling water, low pump and a long
// tiled-room tail. No jump cues or flicker. Sound follows room, pause and exit.
export function createSpaAudio(){
 let ctx=null,source=null,pump=null,master=null,pan=null,lowpass=null,reverb=null,nodes=[];let seed=6671;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 function attach(context,output){if(ctx===context)return;dispose();ctx=context;
  const pcm=ctx.createBuffer(1,Math.floor(ctx.sampleRate*5),ctx.sampleRate),a=pcm.getChannelData(0);let pink=0,slow=0;
  for(let i=0;i<a.length;i++){const n=random()*2-1,t=i/ctx.sampleRate;pink=.95*pink+.05*n;slow=.997*slow+.003*n;a[i]=(n*.043+pink*.46+slow*.23)*(.88+.075*Math.sin(t*3.27)+.045*Math.sin(t*7.92));}
  for(let i=0;i<512;i++){const u=i/512,v=a[i]*u+a[a.length-512+i]*(1-u);a[i]=a[a.length-512+i]=v;}
  master=ctx.createGain();master.gain.value=0;master.connect(output);pan=ctx.createStereoPanner();pan.connect(master);
  lowpass=ctx.createBiquadFilter();lowpass.type='lowpass';lowpass.frequency.value=4200;lowpass.connect(pan);
  source=ctx.createBufferSource();source.buffer=pcm;source.loop=true;source.connect(lowpass);source.start();
  reverb=ctx.createConvolver();const ir=ctx.createBuffer(2,Math.floor(ctx.sampleRate*1.6),ctx.sampleRate);
  for(let channel=0;channel<2;channel++){const d=ir.getChannelData(channel);for(let i=0;i<d.length;i++)d[i]=(random()*2-1)*Math.exp(-i/ctx.sampleRate*4.6)*.044;for(const delay of[.036,.071,.118,.181,.274])d[Math.floor((delay+channel*.007)*ctx.sampleRate)]+=.10*Math.exp(-delay*4.4);}
  reverb.buffer=ir;const send=ctx.createGain();send.gain.value=.23;source.connect(reverb);reverb.connect(send);send.connect(master);
  pump=ctx.createOscillator();pump.type='sine';pump.frequency.value=60;const hum=ctx.createGain();hum.gain.value=.006;pump.connect(hum);hum.connect(master);pump.start();nodes=[master,pan,lowpass,reverb,send,hum];
 }
 function update(context,output,player,enabled){if(!context)return;attach(context,output);const dx=7.57-player.x,dz=-4.21-player.z,d=Math.hypot(dx,dz),inside=player.x>4.15;
  const gain=enabled?(inside?.74:.15)/(1+d*d*.065):0;master.gain.setTargetAtTime(gain,ctx.currentTime,.18);pan.pan.setTargetAtTime(Math.max(-.72,Math.min(.72,(dx*Math.cos(player.yaw||0)-dz*Math.sin(player.yaw||0))/Math.max(1,d))),ctx.currentTime,.2);lowpass.frequency.setTargetAtTime(inside?4400:1150,ctx.currentTime,.35);
 }
 function mute(){if(ctx)master.gain.setTargetAtTime(0,ctx.currentTime,.035);}
 function dispose(){for(const s of[source,pump])if(s){try{s.stop();}catch{}s.disconnect();}nodes.forEach(n=>n.disconnect());nodes=[];ctx=source=pump=master=pan=lowpass=reverb=null;}
 return{update,mute,dispose};
}
