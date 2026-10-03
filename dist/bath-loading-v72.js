// The photo album is independent of WebGL: GPU warmup cannot hide its progress.
export const BATH_SLIDES=Array.from({length:10},(_,i)=>new URL(`./textures/bath-loading-v72/pool-${String(i+1).padStart(2,'0')}.webp`,import.meta.url).href);
export const nextPaint=()=>new Promise(resolve=>requestAnimationFrame(()=>setTimeout(resolve,0)));
export function createBathLoading(host=document.body,options={}){
 const slides=options.slides||BATH_SLIDES,title=options.title||'BAÑOS / SHOWERS',opening=options.opening||'正在打开浴室';
 const panel=document.createElement('section');panel.className='bath-loading';panel.hidden=true;panel.setAttribute('role','status');panel.setAttribute('aria-label','正在进入浴室');
 panel.innerHTML='<div class="bath-loading-photos"><img alt="无人浴池的旧数码照片"><img alt="" aria-hidden="true"></div><div class="bath-loading-shade"></div><div class="bath-loading-caption"><p>BAÑOS / SHOWERS</p><div class="bath-loading-line"><span class="bath-loading-label">正在准备浴室</span><span class="bath-loading-percent">0%</span></div><div class="bath-loading-track" role="progressbar" aria-label="浴室准备进度" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i></i></div><button class="bath-loading-return" hidden>返回巷子</button></div>';
 host.append(panel);const images=[...panel.querySelectorAll('img')],label=panel.querySelector('.bath-loading-label'),percent=panel.querySelector('.bath-loading-percent'),bar=panel.querySelector('i'),track=panel.querySelector('[role="progressbar"]'),back=panel.querySelector('button');
 panel.querySelector('.bath-loading-caption p').textContent=title;images[0].alt=options.alt||'无人浴池的旧数码照片';back.textContent=options.returnText||'返回巷子';track.setAttribute('aria-label',title+' 准备进度');
 let timer=0,sequence=0,index=0,front=0,value=0,open=false;const cache=new Map();
 function preload(i){i%=slides.length;if(!cache.has(i)){const im=new Image();im.src=slides[i];cache.set(i,im.decode().then(()=>im).catch(()=>null));}return cache.get(i);}
 function progress(v,text){value=Math.max(value,Math.min(100,v));bar.style.transform=`scaleX(${value/100})`;percent.textContent=`${Math.floor(value)}%`;track.setAttribute('aria-valuenow',String(Math.floor(value)));if(text){panel.setAttribute('aria-label',text);label.textContent=value>=100?'READY':text;}}
 async function advance(token){const image=await preload((index+1)%10);if(!open||token!==sequence)return;if(image){index=(index+1)%10;front=1-front;images[front].src=image.src;images[front].classList.add('is-visible');images[1-front].classList.remove('is-visible');}preload((index+1)%10);}
 // One small first photo is warmed while outdoors. The other nine are decoded
 // one ahead, avoiding a ten-image decode burst when the door is touched.
 preload(0);
 return {element:panel,get active(){return open;},progress,
  async show(){const token=++sequence;open=true;value=0;front=0;panel.hidden=false;panel.classList.remove('is-fading');back.hidden=true;progress(0,opening);const im=await preload(index);if(token!==sequence)return;images[0].src=im?.src||slides[index];images[0].classList.add('is-visible');images[1].classList.remove('is-visible');preload((index+1)%10);clearInterval(timer);timer=setInterval(()=>advance(token),3800);await nextPaint();},
  async finish(){progress(100,'准备就绪');await nextPaint();panel.classList.add('is-fading');await new Promise(r=>setTimeout(r,360));open=false;clearInterval(timer);panel.hidden=true;index=(index+1)%10;},
  fail(onReturn){clearInterval(timer);label.textContent='PLEASE RETURN AND TRY AGAIN';percent.textContent='';back.hidden=false;back.onclick=()=>{open=false;sequence++;panel.hidden=true;onReturn();};},
  dispose(){clearInterval(timer);sequence++;panel.remove();cache.clear();}
 };
}
