// Rewind recorded player poses, not a teleport concealed by a transition.
export function createPitRewind({capture,apply,safe,suspend,resume,render,filter,onRewind=()=>{},parent=document.body}){
 const style=document.createElement('style');style.textContent=`@font-face{font-family:PitVGA;src:url('./assets/fonts/ibm-vga8.ttf')} .pit-fault149{position:fixed;inset:0;z-index:2147483600;background:#8c791b;display:grid;place-items:center;cursor:pointer}.pit-fault149[hidden]{display:none}.pit-fault149 canvas{width:min(100vw,133.333vh);height:min(75vw,100vh);image-rendering:pixelated}.pit-rew149{position:fixed;inset:0;z-index:2147483599;pointer-events:none;display:none}.pit-rew149 canvas{width:100%;height:100%;image-rendering:pixelated}body.pit-dead149 #game > :not(canvas):not(.pit-fault149):not(.pit-rew149){opacity:0!important;pointer-events:none!important}body.pit-dead149 #k131-note,body.pit-dead149 #menu,body.pit-dead149 #hud,body.pit-dead149 #touch,body.pit-dead149 .inventory117,body.pit-dead149 #inventory117{visibility:hidden!important}`;document.head.append(style);
 const panel=document.createElement('div');panel.className='pit-fault149';panel.hidden=true;panel.tabIndex=0;panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','坠落。按任意键或点击倒带复活，返回坠落前的位置。');
 const screen=document.createElement('canvas');screen.width=640;screen.height=400;panel.append(screen);parent.append(panel);const g=screen.getContext('2d');
 const osd=document.createElement('div');osd.className='pit-rew149';const tape=document.createElement('canvas');tape.width=640;tape.height=480;osd.append(tape);parent.append(osd);const tg=tape.getContext('2d');
 let mode='idle',clock=0,lastSample=-1,frames=[],anchor=null,sequence=[],started=0,duration=0,finishedPose=null;
 const fontReady=document.fonts.load('16px PitVGA').then(paint);
 function paint(){g.fillStyle='#8c791b';g.fillRect(0,0,640,400);g.font='16px PitVGA,monospace';g.textBaseline='top';g.imageSmoothingEnabled=false;
  const text=(x,y,t)=>g.fillText(t,x*8,y*16);g.fillStyle='#fff2be';g.fillRect(35*8,3*16,9*8,16);g.fillStyle='#8c791b';text(35,3,' Windows ');g.fillStyle='#fff2be';
  text(3,6,'A fatal exception 0E has occurred at 0028:C0000000 in VXD');
  text(3,7,'LEVEL0(01) + 00000000. The current application will be terminated.');
  text(3,10,'* Press any key to attempt to continue.');
  text(3,12,'* The last recorded position can be restored.');
  text(5,13,'The tape will rewind to the moment before the fall.');
  text(23,17,'Press any key to continue _');
 }
 function reset(){mode='idle';frames=[];sequence=[];anchor=null;lastSample=-1;clock=0;panel.hidden=true;osd.style.display='none';document.body.classList.remove('pit-dead149');filter.setRewind?.(0,0);}
 function record(dt){if(mode!=='idle')return;clock+=dt;if(clock-lastSample<1/30)return;lastSample=clock;const p={...capture(),t:clock};frames.push(p);if(frames.length>600)frames.shift();if(p.grounded&&safe(p))anchor=p;}
 function die(){if(mode!=='idle')return;const p={...capture(),t:clock+.001};frames.push(p);finishedPose=anchor||frames.find(f=>f.grounded)||{...p,feet:0};sequence=frames.filter(f=>f.t>=finishedPose.t);if(sequence.length<2)sequence=[finishedPose,p];mode='dead';started=performance.now();suspend();document.body.classList.add('pit-dead149');paint();panel.hidden=false;panel.focus({preventScroll:true});}
 function rewind(){if(mode!=='dead'||performance.now()-started<350)return;mode='rewinding';started=performance.now();duration=Math.min(5200,Math.max(2200,(sequence.at(-1).t-sequence[0].t)*650));panel.hidden=true;osd.style.display='block';onRewind();}
 function poseAt(t){let i=sequence.length-1;while(i>0&&sequence[i-1].t>t)i--;const a=sequence[Math.max(0,i-1)],b=sequence[i],f=Math.max(0,Math.min(1,(t-a.t)/Math.max(.001,b.t-a.t))),p={...a};for(const k of['x','z','feet','eye','pitch'])p[k]=a[k]+(b[k]-a[k])*f;let dy=(b.yaw-a.yaw+Math.PI)%(Math.PI*2);if(dy<0)dy+=Math.PI*2;p.yaw=a.yaw+(dy-Math.PI)*f;return p;}
 function frame(now){if(mode==='dead')return true;if(mode!=='rewinding')return false;const t=Math.min(1,(now-started)/duration),e=t*t*(3-2*t),last=sequence.at(-1),first=sequence[0];apply(poseAt(last.t+(first.t-last.t)*e));filter.setRewind?.(Math.sin(Math.PI*t)*.65+.25,now/1000);render(now);
  tg.clearRect(0,0,640,480);tg.font='16px PitVGA,monospace';tg.textBaseline='top';tg.fillStyle='#eee8ce';tg.fillText('REW <<',30,28);tg.fillText('-00:00:'+String(Math.ceil((last.t-first.t)*(1-e))).padStart(2,'0'),480,28);
  if(t>=1){const p=finishedPose;apply(p);reset();resume(p);}return true;
 }
 const key=e=>{if(mode==='idle')return;e.preventDefault();e.stopImmediatePropagation();if(mode==='dead'&&!e.repeat&&!['ControlLeft','ControlRight','AltLeft','AltRight','ShiftLeft','ShiftRight','MetaLeft','MetaRight'].includes(e.code))rewind();};
 document.addEventListener('keydown',key,true);panel.addEventListener('pointerdown',e=>{e.preventDefault();rewind();});
 return{record,die,rewind,frame,reset,fontReady,get active(){return mode!=='idle'},get mode(){return mode},get snapshot(){return{mode,frames:frames.length,anchor:anchor&&{...anchor},sequence:sequence.length}},dispose(){reset();document.removeEventListener('keydown',key,true);style.remove();panel.remove();osd.remove();}};
}
