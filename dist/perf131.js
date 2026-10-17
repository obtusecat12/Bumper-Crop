// V131 · ?perf=1 performance overlay (also localStorage bumpercrop.perf=1). Off by default: when off every hook is a
// plain pass-through and nothing is drawn. Shows the real frame interval (rAF) as a graph, mean / p95 / max, stutter
// spikes (> 2× median and > 50 ms), per-section CPU time (EMA, ms), and renderer.info (draw calls, triangles, programs,
// geometries, textures). globalThis.__bcPerf.report() returns a JSON summary you can copy into a bug report.
export function createPerf131(renderer){
 let on=false;try{const q=new URLSearchParams(location.search);on=q.get('perf')==='1'||localStorage.getItem('bumpercrop.perf')==='1';if(q.get('perf')==='0')on=false;}catch{}
 const N=240,dts=new Float32Array(N),cpu=new Float32Array(N);let head=0,count=0,last=0,frameStart=0,spikes=0,spikes50=0,frames=0;
 const sec=new Map();// label -> {ema,max,acc}
 const open=new Map();
 function begin(l){if(!on)return;open.set(l,performance.now());}
 function end(l){if(!on)return;const t=open.get(l);if(t===undefined)return;open.delete(l);add(l,performance.now()-t);}
 function add(l,ms){let s=sec.get(l);if(!s){s={ema:ms,max:ms,acc:0};sec.set(l,s);}s.acc+=ms;}
 // wrap obj[name] so each call is timed under label (accumulates within a frame)
 function wrap(obj,name,label){if(!obj||typeof obj[name]!=='function'||obj[name].__perf131)return;const o=obj[name];
  const w=function(...a){if(!on)return o.apply(this,a);const t=performance.now();try{return o.apply(this,a);}finally{add(label,performance.now()-t);}};w.__perf131=true;obj[name]=w;}
 let cv=null,g=null,info={};
 function mount(){if(cv||!on)return;cv=document.createElement('canvas');cv.width=350;cv.height=196;cv.id='perf131';
  Object.assign(cv.style,{position:'fixed',right:'8px',bottom:'8px',width:'350px',height:'196px',zIndex:99999,pointerEvents:'none',imageRendering:'pixelated'});document.body.appendChild(cv);g=cv.getContext('2d');}
 const sorted=new Float32Array(N);
 function q(p){const n=count;for(let i=0;i<n;i++)sorted[i]=dts[i];const a=sorted.subarray(0,n).sort();return a[Math.min(n-1,Math.floor(p*(n-1)))]||0;}
 let drawT=0;const lazy=[];
 function lazyWrap(get,name,label){lazy.push({get,name,label});}
 function frameBegin(now){if(!on)return;for(const z of lazy){if(z.done)continue;let o=null;try{o=z.get();}catch{}if(o&&typeof o[z.name]==='function'){wrap(o,z.name,z.label);z.done=true;}}const dt=last?now-last:16.7;last=now;frameStart=performance.now();
  if(frames>30){const med=q(.5);if(dt>Math.max(2*med,med+12))spikes++;if(dt>50)spikes50++;}
  dts[head]=dt;head=(head+1)%N;count=Math.min(N,count+1);frames++;}
 function frameEnd(){if(!on)return;const ms=performance.now()-frameStart;cpu[(head+N-1)%N]=ms;
  for(const s of sec.values()){s.ema=s.ema*.9+s.acc*.1;s.max=Math.max(s.max*.995,s.acc);s.acc=0;}
  const r=renderer.info;info={calls:r.render.calls,tris:r.render.triangles,prog:r.programs?.length||0,geo:r.memory.geometries,tex:r.memory.textures};
  const t=performance.now();if(t-drawT>250){drawT=t;mount();draw();}}
 function stats(){let s=0;for(let i=0;i<count;i++)s+=dts[i];const mean=count?s/count:0;let c=0;for(let i=0;i<count;i++)c+=cpu[i];
  return{fps:mean?1000/mean:0,mean,p50:q(.5),p95:q(.95),max:q(1),cpuMean:count?c/count:0,spikes,spikes50,frames,info:{...info},sections:Object.fromEntries([...sec].map(([k,v])=>[k,+v.ema.toFixed(2)]))};}
 function draw(){if(!g)return;const S=stats(),W=cv.width;g.fillStyle='rgba(8,10,12,.82)';g.fillRect(0,0,W,cv.height);
  // graph: 0..66 ms, guide lines at 16.7 / 33.3 ms
  const gh=56,gy=4;g.strokeStyle='#2c3a2c';g.beginPath();for(const m of [16.7,33.3]){const y=gy+gh-gh*m/66;g.moveTo(0,y+.5);g.lineTo(W,y+.5);}g.stroke();
  for(let i=0;i<count;i++){const k=(head-count+i+N)%N,v=dts[k],h=Math.min(gh,gh*v/66),c=cpu[k],hc=Math.min(gh,gh*c/66);const x=Math.floor(i*W/N);
   g.fillStyle=v>50?'#ff4a3a':v>33.4?'#ffb23a':'#4ad46a';g.fillRect(x,gy+gh-h,Math.max(1,Math.ceil(W/N)),h);g.fillStyle='rgba(120,170,255,.75)';g.fillRect(x,gy+gh-hc,Math.max(1,Math.ceil(W/N)),1);}
  g.font='11px monospace';g.fillStyle='#e8f0e8';let y=gy+gh+13;const L=(s,c='#e8f0e8')=>{g.fillStyle=c;g.fillText(s,6,y);y+=12;};
  L(`${S.fps.toFixed(0)} fps  frame ${S.mean.toFixed(1)} / p95 ${S.p95.toFixed(1)} / max ${S.max.toFixed(0)} ms`);
  L(`JS ${S.cpuMean.toFixed(1)} ms  spikes ${S.spikes} (>50ms ${S.spikes50})`,'#9cc0ff');
  L(`calls ${info.calls}  tris ${(info.tris/1000).toFixed(0)}k  prog ${info.prog}  geo ${info.geo}  tex ${info.tex}`,'#d8d0a0');
  const secs=[...sec].sort((a,b)=>b[1].ema-a[1].ema).slice(0,6);for(let i=0;i<secs.length;i+=2){L(secs.slice(i,i+2).map(([k,v])=>`${k} ${v.ema.toFixed(2)}`).join('   '),'#c8c8c8');}
  L('?perf=0 关闭 · __bcPerf.report()','#7a8a7a');}
 const api={get on(){return on;},set on(v){on=!!v;if(!on&&cv){cv.remove();cv=null;g=null;}},begin,end,wrap,lazyWrap,frameBegin,frameEnd,stats,report:()=>JSON.stringify({ua:navigator.userAgent,level:globalThis.__bcDebug?.state?.level,...stats()}),reset(){spikes=spikes50=0;frames=0;count=0;head=0;for(const s of sec.values()){s.max=0;}}};
 globalThis.__bcPerf=api;return api;
}
