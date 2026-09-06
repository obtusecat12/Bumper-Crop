import * as T from './vendor/three.module.min.js';
import {CHUNK,field,height,surfaceHeight,buildingSize,buildingLocal,BUILDING_NAMES,pondDistance,roadDistance,vegetationDrag,resolveSolid,rebase,stringSeed} from './world.js';
import {createChunkTask,disposeChunk,makeSky,wind,waterTime} from './models.js';
import {createWheatDetailLayer} from './dense-wheat.js';

const $=s=>document.querySelector(s),game=$('#game');
game.innerHTML=`
<main class="screen" id="menu">
 <header class="topline"><span>THE BACKROOMS</span></header>
 <div class="hero"><p class="eyebrow" id="eyebrow">EXPLORATION</p><h1 class="level">LEVEL 10</h1><h2 class="cn-title">丰裕</h2><div class="subtitle">ABUNDANCE</div><div class="short-rule"></div>
 <nav class="menu" aria-label="主菜单"><button class="menu-button primary selected" id="start" disabled><span>正在进入麦田</span><small>…</small></button><button class="menu-button" id="open-settings"><span>游戏设置</span></button><button class="menu-button" id="open-journal"><span>层级档案</span></button><button class="menu-button" id="open-controls"><span>操作说明</span></button></nav></div>

 <div class="loading" id="loading">LOADING <span id="load-number">0%</span><div class="loading-track"><i id="load-bar"></i></div></div>
 <footer class="bottomline"><span class="desktop-hint">↑ ↓ 选择　 ENTER 确定</span><span class="mobile-hint">轻触选项进入</span><span>ESC 返回</span></footer>
</main>
<div class="hud" id="hud" hidden><div class="hud-top"><div><div class="hud-title">LEVEL 10 <span style="opacity:.5">/</span> 丰裕</div><div class="hud-sub" id="location">泥土小径</div></div><div class="compass"><div>· &nbsp; · &nbsp; ▾ &nbsp; · &nbsp; ·</div><b id="bearing">N &nbsp; 000°</b></div><div class="hud-right"><button id="pause-button" aria-label="暂停游戏">ESC 暂停</button><div class="hud-sub" id="weather-label">阴天 · 风速 2.4 m/s</div><span id="fps" class="fps" hidden></span></div></div>
 <div class="crosshair"></div><div class="interact" id="interact" hidden></div><div class="toast" id="toast" role="status"></div>
 <div class="hud-bottom"><div class="stats"><div><div class="stat-label">体力</div><div class="stat-line"><div class="bar"><i id="stamina" style="width:100%"></i></div></div></div><div><div class="stat-label">水分</div><div class="stat-line"><div class="bar"><i id="hydration" style="width:100%"></i></div></div></div><div><div class="stat-label">杏仁水</div><div class="stat-line inventory"><span class="bottle-icon"></span><span id="bottle-count">00</span></div></div></div><div class="key-hints">E 拾取　 Q 饮用　 J 档案</div></div></div>
<div class="touch-ui" id="touch" hidden><div class="joystick" id="joystick"><div class="stick" id="stick"></div></div><div class="touch-actions"><button id="touch-run" aria-label="奔跑">跑</button><button id="touch-jump" aria-label="跳跃">跃</button><button id="touch-use" aria-label="拾取">E</button><button id="touch-drink" aria-label="饮水">Q</button></div></div>
<div class="modal" id="settings" role="dialog" aria-modal="true" aria-labelledby="settings-title" hidden><div class="panel"><div class="panel-header"><h2 id="settings-title">画面与声音</h2><button class="close" data-close aria-label="关闭">×</button></div>
 <label class="setting"><span>画面质量<small>控制麦田细节与远景密度</small></span><select id="quality"><option value="high">精细</option><option value="balanced">均衡 · 推荐</option><option value="low">流畅</option></select></label>
 <label class="setting"><span>像素渲染<small>低分辨率与清晰锯齿边缘</small></span><input id="retro" type="checkbox" checked></label>
 <label class="setting"><span>视野 <b id="fov-value">72°</b></span><input id="fov" type="range" min="55" max="95" step="1" value="72"></label>
 <label class="setting"><span>鼠标灵敏度</span><input id="sensitivity" type="range" min="20" max="180" value="75"></label>
 <label class="setting"><span>环境音量</span><input id="volume" type="range" min="0" max="100" value="65"></label>
 <label class="setting"><span>行走镜头晃动</span><input id="bob" type="checkbox" checked></label>
 <label class="setting"><span>显示帧率</span><input id="showfps" type="checkbox"></label>
 <div class="panel-note">画面会根据运行速度自动调整分辨率。所有画质均保留碰撞与无限地图。设置保存在当前浏览器。</div>
</div></div>
<div class="modal" id="journal" role="dialog" aria-modal="true" aria-labelledby="journal-title" hidden><div class="panel"><div class="panel-header"><h2 id="journal-title">层级档案 / 010</h2><button class="close" data-close aria-label="关闭">×</button></div><div class="journal-meta">M.E.G. FIELD NOTES · 丰裕</div><div class="journal-body"><p><strong>你正站在一片没有尽头的麦田。</strong><br>树木与高度近似的灌木将麦田分割成小块。天空始终阴沉，偶有短暂细雨与雾气，白昼从未结束。</p><p>沿着两条轮胎碾痕前行。中间的草仍在生长，但车辙里的种子永远不会发芽。这里没有被发现过的车辆。</p><p>低地的湖水清澈，带有泥土的气味。靠近湖岸时，可按 <strong>E</strong> 饮水。</p><p>谷仓、马厩和木棚大多空无一人。里面偶尔能找到木料、钉子和遗落的杏仁水。拾起杏仁水后，按 <strong>Q</strong> 饮用。</p><p>麦丛会拖慢脚步。回到小径可以更快前进。没有任务期限，沿着风走下去。</p></div><div class="panel-note" id="expedition">尚未开始探索。</div></div></div>
<div class="modal" id="controls" role="dialog" aria-modal="true" aria-labelledby="controls-title" hidden><div class="panel"><div class="panel-header"><h2 id="controls-title">操作指南</h2><button class="close" data-close aria-label="关闭">×</button></div><div class="controls-list"><div><span class="key">W A S D</span>移动</div><div><span class="key">鼠标</span>环顾四周</div><div><span class="key">SHIFT</span>按住奔跑</div><div><span class="key">SPACE</span>跳跃</div><div><span class="key">C</span>按住蹲下</div><div><span class="key">E</span>拾取 / 湖边饮水</div><div><span class="key">Q</span>饮用杏仁水</div><div><span class="key">J</span>层级档案</div><div><span class="key">ESC</span>暂停 / 释放鼠标</div><div><span class="key">F</span>切换全屏</div></div><div class="panel-note">点击「进入麦田」后即可用鼠标观察。若浏览器不允许锁定鼠标，按住鼠标拖动也可以环顾。触屏设备使用左侧摇杆移动、右侧滑动观察。</div></div></div>`;

const touchDevice=matchMedia('(pointer:coarse)').matches;
document.body.classList.toggle('touch-mode',touchDevice);
let settings={quality:touchDevice?'low':'balanced',retro:true,fov:72,sensitivity:75,volume:65,bob:!matchMedia('(prefers-reduced-motion:reduce)').matches,showfps:false};
try{const saved=JSON.parse(localStorage.getItem('level10.preferences.v1')||'null');if(saved&&typeof saved==='object')settings={...settings,...saved}}catch{}
if(!['high','balanced','low'].includes(settings.quality))settings.quality='balanced';
let renderer;
try{renderer=new T.WebGLRenderer({antialias:false,powerPreference:'high-performance',alpha:false});renderer.setPixelRatio(1);renderer.domElement.className='scene';renderer.domElement.setAttribute('aria-label','Level 10 三维麦田');game.prepend(renderer.domElement)}catch(e){e.userTitle='无法启动 3D 画面';e.userMessage='当前浏览器无法创建 3D 画面。请确认已启用硬件加速，并使用支持 WebGL 2 的浏览器。';throw e}
renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.23;
const scene=new T.Scene();scene.background=new T.Color('#acb6b1');scene.fog=new T.Fog('#acb6b1',60,225);
scene.add(new T.HemisphereLight('#c9d2d4','#6b6042',2.0));const sun=new T.DirectionalLight('#ddd8c4',1.5);sun.position.set(-60,100,25);scene.add(sun);
const sky=makeSky();scene.add(sky);
const wheatDetail=createWheatDetailLayer(wind);scene.add(wheatDetail.object);
const camera=new T.PerspectiveCamera(settings.fov,innerWidth/innerHeight,.075,480);camera.rotation.order='YXZ';
const state={cx:0n,cz:0n,x:.6,z:52,y:0,yaw:-.37,pitch:-.025,velocity:new T.Vector3(),jump:0,vy:0,grounded:true,stamina:100,hydration:100,bottles:0,distance:0,elapsed:0};
const seed=stringSeed('CHLORINE / ABUNDANCE / 10'),chunks=new Map(),collected=new Set();
let queue=[],activeBuild=null,playing=false,started=false,ready=false,lastFrame=performance.now(),time=0,uiTick=0,step=0,footTimer=0,toastTimer,activeModal=null,lastFocus=null,hadMovement=false,lastWeather='',qualityTimer=0,frameCount=0,frameTime=0,fps=60,autoScale=1,contextLost=false,streamFailed=false;
let interaction=null;const keys=new Set(),joy={x:0,z:0};let touchRun=false,mouseDragging=false;
const radius=()=>settings.quality==='low'?2:3;
function chunkLevel(dx,dz){const d=Math.max(Math.abs(dx),Math.abs(dz));return d<=1?0:d<=2?1:2}
function updateQueue(){
 const wanted=new Set(),n=radius(),next=[];
 if(activeBuild){activeBuild.task.return();activeBuild=null}
 for(let dz=-n;dz<=n;dz++)for(let dx=-n;dx<=n;dx++){
  const cx=state.cx+BigInt(dx),cz=state.cz+BigInt(dz),key=`${cx},${cz}`,level=chunkLevel(dx,dz);wanted.add(key);const c=chunks.get(key);
  if(c){c.group.position.set(dx*CHUNK,0,dz*CHUNK);if(c.level!==level||c.quality!==settings.quality)next.push({cx,cz,key,level,d:dx*dx+dz*dz+10})}else next.push({cx,cz,key,level,d:dx*dx+dz*dz});
 }
 for(const[k,c]of chunks)if(!wanted.has(k)){scene.remove(c.group);disposeChunk(c);chunks.delete(k)}
 queue=next.sort((a,b)=>a.d-b.d);
}
function streamOne(){
 if(!activeBuild){const item=queue.shift();if(!item)return;const f=field(item.cx,item.cz,seed);activeBuild={item,task:createChunkTask(f,item.level,settings.quality,collected)}}
 const step=activeBuild.task.next();if(!step.done)return;
 const item=activeBuild.item,c=step.value,old=chunks.get(item.key);activeBuild=null;
 c.group.position.set(Number(item.cx-state.cx)*CHUNK,0,Number(item.cz-state.cz)*CHUNK);
 if(old){scene.remove(old.group);disposeChunk(old)}chunks.set(item.key,c);scene.add(c.group);
}
function resize(){const scale=(settings.retro?settings.quality==='high'?.75:settings.quality==='low'?.48:.62:1)*autoScale;const maxWidth=settings.quality==='low'?1100:settings.quality==='high'?1920:1600;let w=Math.min(innerWidth*scale,maxWidth),h=w*innerHeight/innerWidth;renderer.setSize(Math.max(320,Math.floor(w)),Math.max(200,Math.floor(h)),false);camera.aspect=innerWidth/innerHeight;camera.fov=Number(settings.fov);camera.updateProjectionMatrix();document.body.classList.toggle('native-resolution',!settings.retro)}
addEventListener('resize',resize);resize();updateQueue();

class Ambience{
 constructor(){this.ctx=null;this.master=null;this.motion=null;this.rain=null;this.last=0}
 start(){try{if(!this.ctx){const A=window.AudioContext||window.webkitAudioContext;this.ctx=new A();this.master=this.ctx.createGain();this.master.connect(this.ctx.destination);const count=this.ctx.sampleRate*4,buffer=this.ctx.createBuffer(1,count,this.ctx.sampleRate),d=buffer.getChannelData(0);let brown=0;for(let i=0;i<count;i++){brown=(brown+(Math.random()*2-1)*.035)/1.015;d[i]=brown*3}const source=this.ctx.createBufferSource();source.buffer=buffer;source.loop=true;const filter=this.ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=900;this.motion=this.ctx.createGain();this.motion.gain.value=.19;source.connect(filter);filter.connect(this.motion);this.motion.connect(this.master);source.start();const hiss=this.ctx.createBuffer(1,count,this.ctx.sampleRate),hd=hiss.getChannelData(0);for(let i=0;i<count;i++)hd[i]=(Math.random()*2-1)*.12;const rainSource=this.ctx.createBufferSource();rainSource.buffer=hiss;rainSource.loop=true;const hp=this.ctx.createBiquadFilter();hp.type='highpass';hp.frequency.value=1800;this.rain=this.ctx.createGain();this.rain.gain.value=0;rainSource.connect(hp);hp.connect(this.rain);this.rain.connect(this.master);rainSource.start()}this.ctx.resume().catch(()=>{});this.setVolume()}catch{}}
 setVolume(){if(this.master)this.master.gain.setTargetAtTime((Number(settings.volume)/100)*.6,this.ctx.currentTime,.1)}
 update(moving,wheat,rain){if(!this.ctx)return;this.motion.gain.setTargetAtTime(.15+.035*Math.sin(time*.23)+(moving&&wheat?.15:0),this.ctx.currentTime,.2);this.rain.gain.setTargetAtTime(rain*.6,this.ctx.currentTime,.3)}
 footstep(wheat,wet){if(!this.ctx||Number(settings.volume)===0)return;const len=.12,buffer=this.ctx.createBuffer(1,this.ctx.sampleRate*len,this.ctx.sampleRate),d=buffer.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.exp(-i/d.length*5);const src=this.ctx.createBufferSource();src.buffer=buffer;const filter=this.ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=wet?400:wheat?2100:700;const gain=this.ctx.createGain();gain.gain.value=wet?.13:wheat?.09:.15;src.connect(filter);filter.connect(gain);gain.connect(this.master);src.start();src.onended=()=>{src.disconnect();filter.disconnect();gain.disconnect()}}
 chime(){if(!this.ctx)return;const osc=this.ctx.createOscillator(),g=this.ctx.createGain();osc.type='sine';osc.frequency.setValueAtTime(690,this.ctx.currentTime);osc.frequency.exponentialRampToValueAtTime(980,this.ctx.currentTime+.08);g.gain.setValueAtTime(.07,this.ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,this.ctx.currentTime+.2);osc.connect(g);g.connect(this.master);osc.start();osc.stop(this.ctx.currentTime+.22);osc.onended=()=>{osc.disconnect();g.disconnect()}}
}
const audio=new Ambience();
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),3600)}
function setPlay(value){playing=value;$('#menu').hidden=value;$('#hud').hidden=!value;$('#touch').hidden=!value||!touchDevice;if(value){audio.start();if(!started){started=true;toast('沿着小径前行。地上的瓶子可以按 E 拾取。')}$('#start').innerHTML='<span>继续探索</span><small>ENTER ↵</small>';$('#eyebrow').textContent='PAUSED';}else{keys.clear();joy.x=joy.z=0;touchRun=false;$('#stick').style.transform='';if(document.pointerLockElement)document.exitPointerLock();}}
function start(){if(!ready)return;setPlay(true);if(!touchDevice){try{const p=renderer.domElement.requestPointerLock?.();if(p&&p.catch)p.catch(()=>toast('按住鼠标拖动环顾，W A S D 移动。'))}catch{toast('按住鼠标拖动环顾，W A S D 移动。')}}}
$('#start').onclick=start;$('#pause-button').onclick=()=>setPlay(false);
document.addEventListener('pointerlockchange',()=>{if(!document.pointerLockElement&&playing&&!touchDevice&&!activeModal){setPlay(false)}});
document.addEventListener('pointerlockerror',()=>{if(playing)toast('按住鼠标拖动环顾，W A S D 移动。')});
function openModal(id){lastFocus=document.activeElement;if(playing)setPlay(false);activeModal=$('#'+id);activeModal.hidden=false;if(id==='journal')$('#expedition').textContent=started?`已探索 ${Math.round(state.distance)} 米 · ${Math.floor(state.elapsed/60)} 分钟 · 杏仁水 ${state.bottles} 瓶`:'尚未开始探索。';activeModal.querySelector('button,select,input')?.focus()}
function closeModal(){if(!activeModal)return;activeModal.hidden=true;activeModal=null;lastFocus?.focus()}
$('#open-settings').onclick=()=>openModal('settings');$('#open-journal').onclick=()=>openModal('journal');$('#open-controls').onclick=()=>openModal('controls');document.querySelectorAll('[data-close]').forEach(b=>b.onclick=closeModal);document.querySelectorAll('.modal').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)closeModal()}));
for(const key of Object.keys(settings)){const el=$('#'+key);if(!el)continue;if(el.type==='checkbox')el.checked=Boolean(settings[key]);else el.value=settings[key];el.addEventListener('input',()=>{settings[key]=el.type==='checkbox'?el.checked:el.type==='range'?Number(el.value):el.value;try{localStorage.setItem('level10.preferences.v1',JSON.stringify(settings))}catch{}if(key==='quality'){autoScale=1;updateQueue()}if(['quality','retro','fov'].includes(key))resize();if(key==='volume')audio.setVolume();$('#fov-value').textContent=settings.fov+'°';$('#fps').hidden=!settings.showfps;})}$('#fov-value').textContent=settings.fov+'°';$('#fps').hidden=!settings.showfps;

function drink(){if(state.bottles<1){toast('没有杏仁水。可以在路边或建筑内寻找。');return}state.bottles--;state.hydration=Math.min(100,state.hydration+45);state.stamina=Math.min(100,state.stamina+35);audio.chime();toast('饮用了杏仁水。杏仁的气味让人安心。');updateHUD()}
function use(){if(!interaction)return;if(interaction.kind==='bottle'){const {p,chunk}=interaction;if(collected.has(p.id))return;collected.add(p.id);state.bottles++;chunk.group.remove(p.mesh);p.mesh.traverse(o=>{if(o.geometry)o.geometry.dispose()});p.mesh=null;audio.chime();toast('拾取了杏仁水 · 按 Q 饮用');interaction=null}else{state.hydration=100;toast('喝了一口清水。有一点泥土的味道。');audio.footstep(false,true)}updateHUD()}
function jump(){if(state.grounded&&state.stamina>5){state.vy=4.8;state.grounded=false;state.stamina-=4}}
async function fullscreen(){try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen();else await document.exitFullscreen()}catch{toast('此浏览器暂不支持全屏。')}}
document.addEventListener('keydown',e=>{if(activeModal){if(e.code==='Escape'){e.preventDefault();closeModal()}if(e.code==='Tab'){const items=[...activeModal.querySelectorAll('button,input,select')];if(e.shiftKey&&document.activeElement===items[0]){e.preventDefault();items.at(-1).focus()}else if(!e.shiftKey&&document.activeElement===items.at(-1)){e.preventDefault();items[0].focus()}}return}if(!playing){
 const buttons=[...document.querySelectorAll('.menu-button')].filter(button=>!button.disabled);
 if(e.code==='ArrowDown'||e.code==='ArrowUp'){
  e.preventDefault();
  let index=buttons.indexOf(document.activeElement);
  index=(index+(e.code==='ArrowDown'?1:-1)+buttons.length)%buttons.length;
  if(buttons[index]){document.querySelectorAll('.menu-button').forEach(button=>button.classList.remove('selected'));buttons[index].classList.add('selected');buttons[index].focus();}
 }else if(e.code==='Enter'){
  e.preventDefault();
  const selected=buttons.includes(document.activeElement)?document.activeElement:$('#start');
  if(selected&&!selected.disabled)selected.click();
 }
 return;
} if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();keys.add(e.code);if(e.repeat)return;if(e.code==='Escape')setPlay(false);if(e.code==='KeyE')use();if(e.code==='KeyQ')drink();if(e.code==='Space')jump();if(e.code==='KeyJ')openModal('journal');if(e.code==='KeyF')fullscreen()});
document.addEventListener('keyup',e=>keys.delete(e.code));
addEventListener('blur',()=>{keys.clear();mouseDragging=false;if(playing)setPlay(false)});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing)setPlay(false)});
document.addEventListener('mousemove',e=>{if(!playing||touchDevice||(!document.pointerLockElement&&!mouseDragging))return;const sens=Number(settings.sensitivity)*.000025;state.yaw-=e.movementX*sens;state.pitch-=e.movementY*sens;state.pitch=T.MathUtils.clamp(state.pitch,-1.4,1.4)});
renderer.domElement.addEventListener('mousedown',()=>{if(playing)mouseDragging=true});addEventListener('mouseup',()=>mouseDragging=false);renderer.domElement.addEventListener('contextmenu',e=>e.preventDefault());
let joyPointer=null,lookPointer=null,lastTouch={x:0,y:0};
$('#joystick').addEventListener('pointerdown',e=>{joyPointer=e.pointerId;$('#joystick').setPointerCapture(e.pointerId);moveJoy(e)});
function moveJoy(e){if(e.pointerId!==joyPointer)return;const r=$('#joystick').getBoundingClientRect();let x=(e.clientX-r.left-r.width/2)/40,z=(e.clientY-r.top-r.height/2)/40,l=Math.hypot(x,z);if(l>1){x/=l;z/=l}joy.x=x;joy.z=z;$('#stick').style.transform=`translate(${x*33}px,${z*33}px)`}
$('#joystick').addEventListener('pointermove',moveJoy);for(const event of['pointerup','pointercancel'])$('#joystick').addEventListener(event,()=>{joyPointer=null;joy.x=joy.z=0;$('#stick').style.transform=''})
renderer.domElement.addEventListener('pointerdown',e=>{if(!playing||e.pointerType==='mouse')return;lookPointer=e.pointerId;lastTouch={x:e.clientX,y:e.clientY};renderer.domElement.setPointerCapture(e.pointerId)});
renderer.domElement.addEventListener('pointermove',e=>{if(e.pointerId!==lookPointer||!playing)return;state.yaw-=(e.clientX-lastTouch.x)*.004;state.pitch=T.MathUtils.clamp(state.pitch-(e.clientY-lastTouch.y)*.004,-1.4,1.4);lastTouch={x:e.clientX,y:e.clientY}});
for(const event of['pointerup','pointercancel'])renderer.domElement.addEventListener(event,()=>lookPointer=null);
$('#touch-run').addEventListener('pointerdown',e=>{touchRun=true;e.currentTarget.setPointerCapture(e.pointerId)});for(const event of['pointerup','pointercancel'])$('#touch-run').addEventListener(event,()=>touchRun=false);$('#touch-use').onclick=use;$('#touch-drink').onclick=drink;$('#touch-jump').onclick=jump;

function currentChunk(){return chunks.get(`${state.cx},${state.cz}`)}
function cameraFloor(){const f=currentChunk()?.field;const floor=f?surfaceHeight(state.x,state.z,f):height(state.x,state.z,state.cx,state.cz);return f?.type==='pond'?Math.max(floor,f.lakeY-.62):floor}
function contactWheat(chunk,x,z){if(!chunk)return 0;let contact=0,bx=Math.floor(x/2),bz=Math.floor(z/2);for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){const stems=chunk.wheatBuckets.get(`${bx+dx},${bz+dz}`);if(!stems)continue;for(const w of stems){const vx=x-w.x,vz=z-w.z,dist=Math.hypot(vx,vz);if(dist<.33)contact+=1-dist/.33;}}return Math.min(1,contact)}
function move(dt){const c=currentChunk(),inWheat=contactWheat(c,state.x,state.z),f=c?.field;let sx=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0)+joy.x,sz=(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-(keys.has('KeyW')||keys.has('ArrowUp')?1:0)+joy.z;
 const l=Math.hypot(sx,sz);if(l>1){sx/=l;sz/=l}const moving=l>.09,crouch=keys.has('KeyC'),running=(keys.has('ShiftLeft')||keys.has('ShiftRight')||touchRun)&&state.stamina>1&&moving&&!crouch;
 const water=f?.type==='pond'&&pondDistance(state.x,state.z,f)<1;const brushDrag=vegetationDrag(state,c?.softVolumes);let speed=(crouch?1.35:running?5.4:3.0)*(1-inWheat*.48)*(1-brushDrag)*(water?.55:1)*(state.hydration<10?.8:1);
 const tx=(Math.cos(state.yaw)*sx+Math.sin(state.yaw)*sz)*speed,tz=(-Math.sin(state.yaw)*sx+Math.cos(state.yaw)*sz)*speed,lerp=1-Math.exp(-dt*11);state.velocity.x=T.MathUtils.lerp(state.velocity.x,tx,lerp);state.velocity.z=T.MathUtils.lerp(state.velocity.z,tz,lerp);
 const oldX=state.x,oldZ=state.z;const next={x:state.x+state.velocity.x*dt,z:state.z+state.velocity.z*dt};
 // Solid volumes are resolved locally; flexible stems use small capsules and drag.
 for(const ch of chunks.values()){if(Math.abs(Number(ch.field.x-state.cx))>1||Math.abs(Number(ch.field.z-state.cz))>1)continue;const ox=ch.group.position.x,oz=ch.group.position.z,local={x:next.x-ox,z:next.z-oz};resolveSolid(local,.26,ch.colliders);next.x=local.x+ox;next.z=local.z+oz;}
 if(c&&state.jump<.85){let bx=Math.floor(next.x/2),bz=Math.floor(next.z/2);for(let iz=-1;iz<=1;iz++)for(let ix=-1;ix<=1;ix++){for(const w of c.wheatBuckets.get(`${bx+ix},${bz+iz}`)||[]){let dx=next.x-w.x,dz=next.z-w.z,d=Math.hypot(dx,dz);if(d<.105&&d>.0001){const push=Math.min(.012,(.105-d)*.25);next.x+=dx/d*push;next.z+=dz/d*push}}}}
 // Never enter an unstreamed field; it will be ready before the next normal step.
 const ncx=state.cx+BigInt(Math.floor(next.x/CHUNK)),ncz=state.cz+BigInt(Math.floor(next.z/CHUNK));if(chunks.has(`${ncx},${ncz}`)){state.x=next.x;state.z=next.z}
 const moved=Math.hypot(state.x-oldX,state.z-oldZ);state.distance+=moved;const shift=rebase(state);if(shift.dx||shift.dz)updateQueue();
 if(!state.grounded){state.vy-=12.2*dt;state.jump+=state.vy*dt;if(state.jump<=0){state.jump=0;state.vy=0;state.grounded=true;audio.footstep(!!inWheat,water)}}
 state.stamina=T.MathUtils.clamp(state.stamina+(running?-17:12)*dt,0,100);state.hydration=Math.max(0,state.hydration-dt*(moving?.029:.009));state.elapsed+=dt;
 const floor=cameraFloor();let camH=crouch?1.06:1.77;state.y=T.MathUtils.lerp(state.y||floor+camH,floor+camH,1-Math.exp(-dt*12));step+=moved*2.8;const bob=settings.bob&&moving&&state.grounded?Math.sin(step*2)*.021*(running?1.5:1):0;camera.position.set(state.x,state.y+state.jump+bob,state.z);camera.rotation.set(state.pitch,state.yaw,settings.bob&&moving?Math.cos(step)*.003:0);wind.player.value.set(state.x,state.y,state.z);
 if(moved>.002&&state.grounded){footTimer+=moved;if(footTimer>(running?1.5:1.4)){audio.footstep(!!inWheat,water);footTimer=0}}audio.update(moving,inWheat,rainAmount);hadMovement=moving;
}
function scanInteraction(){
 interaction=null;
 let nearest=2.25;
 for(const chunk of chunks.values()){
  if(Math.abs(Number(chunk.field.x-state.cx))>1||Math.abs(Number(chunk.field.z-state.cz))>1)continue;
  for(const pickup of chunk.pickups){
   if(!pickup.mesh)continue;
   const dx=pickup.x+chunk.group.position.x-state.x;
   const dz=pickup.z+chunk.group.position.z-state.z;
   const distance=Math.hypot(dx,dz);
   if(distance<nearest){nearest=distance;interaction={kind:'bottle',p:pickup,chunk};}
  }
 }
 if(!interaction){
  const chunk=currentChunk();
  if(chunk?.field.type==='pond'&&pondDistance(state.x,state.z,chunk.field)<1.16){
   interaction={kind:'water'};
  }
 }
 const prompt=$('#interact');
 prompt.hidden=!interaction;
 if(interaction)prompt.innerHTML=interaction.kind==='bottle'?'<kbd>E</kbd> 拾取杏仁水':'<kbd>E</kbd> 饮用湖水';
}
function updateHUD(){const degrees=((Math.round(-state.yaw*180/Math.PI)%360)+360)%360,dir=['N','NE','E','SE','S','SW','W','NW'][Math.round(degrees/45)%8];$('#bearing').textContent=`${dir}  ${String(degrees).padStart(3,'0')}°`;$('#stamina').style.width=state.stamina+'%';$('#hydration').style.width=state.hydration+'%';$('#bottle-count').textContent=String(state.bottles).padStart(2,'0');const c=currentChunk();let location=c&&roadDistance(state.x,state.z,c.field)>2.2?'田间草地':'泥土小径';if(c){const f=c.field;if(f.type==='pond'&&pondDistance(state.x,state.z,f)<1.24)location='湖泊 · 未开垦的低地';else if(f.type==='building'){const[w,d]=buildingSize(f);const bp=buildingLocal(state.x,state.z,f);if(Math.abs(bp.x)<w/2&&Math.abs(bp.z)<d/2)location=BUILDING_NAMES[f.variant];else if(contactWheat(c,state.x,state.z)>.1)location='麦田 · 作物齐腰'}else if(contactWheat(c,state.x,state.z)>.1)location='麦田 · 作物齐腰'}$('#location').textContent=`${location}  /  ${Math.round(state.distance)} m`;$('#fps').textContent=`${Math.round(fps)} FPS · ${chunks.size} 区块`;}

const rainCount=900,rainPositions=new Float32Array(rainCount*6);for(let i=0;i<rainCount;i++){const x=(Math.random()-.5)*38,y=Math.random()*20,z=(Math.random()-.5)*38;rainPositions.set([x,y,z,x-.10,y-.60,z],i*6)}const rainGeo=new T.BufferGeometry();rainGeo.setAttribute('position',new T.BufferAttribute(rainPositions,3));const rainMat=new T.LineBasicMaterial({color:'#c9d3ce',transparent:true,opacity:0,depthWrite:false});const rain=new T.LineSegments(rainGeo,rainMat);rain.frustumCulled=false;scene.add(rain);let rainAmount=0;
function weather(dt){const cycle=state.elapsed%390;const target=cycle>180&&cycle<211?Math.min(1,(cycle-180)/7,(211-cycle)/6):0;rainAmount=T.MathUtils.lerp(rainAmount,target,Math.min(1,dt*.5));const mist=cycle>276&&cycle<323?Math.min(1,(cycle-276)/12,(323-cycle)/12):0;scene.fog.near=T.MathUtils.lerp(scene.fog.near,60-mist*42-rainAmount*12,dt*.1);scene.fog.far=T.MathUtils.lerp(scene.fog.far,(settings.quality==='low'?165:225)-mist*95-rainAmount*30,dt*.1);rain.visible=rainAmount>.01;if(rain.visible){rainMat.opacity=rainAmount*.27;const a=rainGeo.attributes.position;for(let i=0;i<rainCount;i++){let y=a.getY(i*2)-dt*14;if(y<-2)y=20;a.setY(i*2,y);a.setY(i*2+1,y-.60)}a.needsUpdate=true;rain.position.copy(camera.position)}wind.strength.value=.60+Math.sin(time*.15)*.23+rainAmount*.4;const label=mist>.25?'薄雾 · 能见度降低':rainAmount>.2?'短暂细雨 · 2.8 m/s':'阴天 · 风速 2.4 m/s';if(label!==lastWeather){$('#weather-label').textContent=label;lastWeather=label}}

renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();contextLost=true;if(playing)setPlay(false);$('#start').disabled=true;$('#start').innerHTML='<span>画面正在恢复</span><small>…</small>'});
renderer.domElement.addEventListener('webglcontextrestored',()=>{contextLost=false;$('#start').disabled=false;$('#start').innerHTML='<span>继续探索</span><small>ENTER ↵</small>';resize()});
function animate(now){requestAnimationFrame(animate);const rawDt=(now-lastFrame)/1000,last=lastFrame;lastFrame=now;const dt=Math.min(.035,Math.max(.001,rawDt));if(document.hidden||contextLost)return;time+=dt;wind.time.value=time;waterTime.value=time;
 if((queue.length||activeBuild)&&!streamFailed&&(!playing||frameCount%3===0)){try{streamOne()}catch(e){streamFailed=true;console.error('World streaming failed',e);$('#start').disabled=true;$('#start').innerHTML='<span>场景加载失败 · 请刷新</span><small>↻</small>';return}const total=(radius()*2+1)**2,progress=Math.round(chunks.size/total*100);$('#load-number').textContent=progress+'%';$('#load-bar').style.width=progress+'%';if(!ready&&chunks.size>=9){ready=true;$('#start').disabled=false;$('#start').innerHTML='<span>进入麦田</span><small>ENTER ↵</small>'}if(!queue.length&&!activeBuild)$('#loading').hidden=true;}
 if(playing)move(dt);else{camera.position.set(state.x,(cameraFloor()+1.94)+Math.sin(time*.23)*.009,state.z);camera.rotation.set(state.pitch,state.yaw+(started?0:Math.sin(time*.07)*.015),0);wind.player.value.set(10000,0,10000)}
 wheatDetail.update(chunks,camera.position,settings.quality,`${state.cx},${state.cz}`);
 sky.position.copy(camera.position);weather(dt);uiTick+=dt;if(uiTick>.12){uiTick=0;if(playing)scanInteraction();updateHUD()}
 renderer.render(scene,camera);document.documentElement.dataset.bootState="ready";frameCount++;frameTime+=rawDt;
 if(frameTime>=1.5){fps=frameCount/frameTime;frameCount=0;frameTime=0;if(playing&&!queue.length&&!activeBuild){qualityTimer+=1.5;if(qualityTimer>4.5){let next=autoScale;if(fps<35)next=Math.max(.6,autoScale-.08);else if(fps>57)next=Math.min(1,autoScale+.025);if(next!==autoScale){autoScale=next;resize()}qualityTimer=0}}}
}
requestAnimationFrame(animate);
