// V124-L1 loot · openable crates in Level 1 + what is inside them.
// Crate sites come from the pure hashed layout (level1-world.js lootAt → chunk.loot, infinite, no bounds). Closed and
// open crates are drawn as InstancedMeshes in the world's own lit shader (one per crate look and lid part, ~26 draw calls
// however many crates are near). Contents are rolled deterministically from the crate id when it is opened, and only
// open crates near the player get item meshes. Opened / taken state persists in localStorage.
import * as T from './vendor/three.module.min.js';
import {l1Hash} from './level1-layout.js?v=113';
import {LOOT_ITEMS,makeLootModel,makeFill,prepareLootItems} from './l1loot124-items.js?v=124';
import {almondVariant} from './almond-water-assets.js?v=60';
const CSS=`.l1loot-fx{position:absolute;inset:0;pointer-events:none;z-index:30}.l1loot-fx i{position:absolute;inset:0;opacity:0;transition:opacity .15s}
.l1loot-fx .fx-red{background:radial-gradient(ellipse at center,transparent 45%,rgba(150,0,0,.85) 100%)}.l1loot-fx .fx-cold{background:radial-gradient(ellipse at center,transparent 40%,rgba(200,230,255,.9) 100%);backdrop-filter:saturate(.4)}
.l1loot-fx .fx-gas{background:radial-gradient(ellipse at center,rgba(170,200,60,.25) 0%,rgba(120,150,20,.75) 100%)}.l1loot-fx .fx-flash{background:#fff3d0;transition:none}
.l1loot-fx.fuyou:after{content:'';position:absolute;left:50%;bottom:64px;width:120px;height:60px;margin-left:-60px;background:radial-gradient(ellipse at center,rgba(90,230,120,calc(var(--fy)*.8)) 0%,transparent 70%);filter:blur(4px)}`;

const KEY='bumpercrop.l1loot.v124';
const LOOKN=['crate1','crate2','crate4','crate5','carton','carton2','carton3','tote','tote2','tote3','tote4','locker','locker2','rustbox'];
const WOOD=new Set([0,1,2,3]),CARTON=new Set([4,5,6]),TOTE=new Set([7,8,9,10]),RUST=13;
function rng(id){let h=2166136261;for(const c of String(id))h=Math.imul(h^c.charCodeAt(0),16777619);return()=>{h+=0x6D2B79F5;let t=h;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
// themes: item rolls [id,min,max]; fill bed; hazard
const TH={
 supplies:{items:[['almond',1,2],['can',1,3],['soy',0,2],['bandage',0,2],['battery',0,2]],fill:'straw'},
 pantry:{items:[['can',2,5],['soy',0,2],['peas',0,2]],fill:'straw'},
 produce:{items:[['pineapple',0,1],['melon',0,2],['papaya',1,3]],fill:'straw'},
 household:{items:[['soap',0,2],['sanitizer',0,1],['charger',0,1],['matches',0,2],['lighter',0,1],['watch',0,1],['yarn',0,2],['junk',0,1]],fill:'straw',min:2},
 tools:{items:[['knife',0,1],['axe',0,1],['matches',0,1],['battery',0,2],['yarn',0,1]],fill:'straw',need:['knife','axe']},
 junk:{items:[['junk',2,5],['foam',0,1]],fill:'straw'},
 foam:{items:[['foam',3,3],['junk',0,1],['watch',0,1],['battery',0,1]],fill:'foam',full:true},
 peas:{items:[['peas',4,5]],fill:'peas',full:true},
 odd:{items:[['fuyou',0,1],['squirt',0,1],['berries',0,2]],fill:'straw',need:['fuyou','squirt','berries']},
 chem:{items:[['chemical',1,3]],fill:'straw',hazard:'chem'},
 boom:{items:[['dynamite',1,2]],fill:'straw',hazard:'boom'},
 glass:{items:[['bandage',0,1],['can',0,2],['battery',0,1],['knife',0,1]],fill:'glass',hazard:'glass',min:1},
 nitro:{items:[['nitrogen',2,4]],fill:'straw',hazard:'nitro'},
};
const W0={supplies:10,pantry:8,produce:4,household:12,tools:6,junk:12,foam:7,peas:5,odd:4,chem:5,boom:3,glass:5,nitro:3};
const WS={1:{pantry:14,supplies:12,foam:10,peas:8,produce:6},2:{odd:8,junk:14},3:{tools:14,chem:10,glass:10,boom:6,household:6},4:{produce:10,odd:8,household:10}};
const HAZ_TXT={chem:'化学制剂',boom:'易爆物',glass:'碎玻璃',nitro:'固态氮'};
export function rollCrate(l,force){const R=rng(l.id);let theme='supplies';
 if(force)theme=force;else if(l.kb!==-1){const w={...W0,...(WS[l.kb]||{})};let t=R()*Object.values(w).reduce((a,b)=>a+b,0);for(const k in w){t-=w[k];if(t<=0){theme=k;break;}}}
 else if(R()<.12)theme='odd';
 const th=TH[theme],items=[];for(const[id,a,b]of th.items){const n=a+Math.floor(R()*(b-a+1));for(let i=0;i<n;i++)items.push({id,meta:{v:Math.floor(R()*4),id:l.id+':'+items.length}});}
 if(th.need&&!items.some(i=>th.need.includes(i.id)))items.push({id:th.need[Math.floor(R()*th.need.length)],meta:{v:0,id:l.id+':n'}});
 while(items.length<(th.min||1)){const[id]=th.items[Math.floor(R()*th.items.length)];items.push({id,meta:{v:Math.floor(R()*4),id:l.id+':m'+items.length}});}
 let lock=0;if(l.kb!==-1){if(WOOD.has(l.look)&&l1Hash(l.x*17|0,l.z*17|0,411)<.55)lock=1;else if(l.look===RUST)lock=2;}
 return{theme,items,fill:th.fill,full:!!th.full,hazard:th.hazard||null,lock};}

export function createL1Loot124({T:TT=T,world,inventory,state,camera,toast,audio,updateHUD=()=>{},enterOne,resetCameraRig=()=>{}}){
 const W=()=>world();let saved={};try{saved=JSON.parse(localStorage.getItem(KEY)||'{}');}catch{}
 const save=()=>{try{const k=Object.keys(saved);if(k.length>800)for(const x of k.slice(0,k.length-800))delete saved[x];localStorage.setItem(KEY,JSON.stringify(saved));}catch{}};
 const ready=prepareLootItems();
 // ---- instanced crate kit (built lazily once the world exists) ----
 let kit=null,scene=null,anchor={x:0,z:0},near=[],nearKey='',checkT=0;const live=new Map();// id -> runtime crate
 let fill=null;function buildKit(){const wd=W();scene=wd.hallsScene;fill=new T.AmbientLight(0xfff4e0,.5);fill.name='l1loot fill (standard-material props only)';scene.add(fill);const LOOK=[['crate1',.8,.8,.8],['crate2',1.0,.62,.7],['crate4',.9,.7,.9],['crate5',.72,.72,.72],['carton',.6,.45,.45],['carton2',.5,.4,.4],['carton3',.42,.3,.32],
   ['tote',.6,.32,.4],['tote2',.6,.32,.4],['tote3',.6,.32,.4],['tote4',.6,.32,.4],['locker',.95,.42,.48],['locker2',.95,.42,.48],['rustbox',.55,.5,.5]];
  kit=LOOK.map(([name,w,h,d],li)=>{const t=WOOD.has(li)?.028:CARTON.has(li)?.008:.014,lt=CARTON.has(li)?.006:t,inner=WOOD.has(li)?'osb':CARTON.has(li)?'cartontop':li===RUST?'rust':'steelP',wh=h-lt;
   const body=wd.kitGeo((P,C,{box})=>{const c=C[name]||C.crate1,ci=C[inner]||C.osbD;P(box,c,0,t/2,0,w,t,d);P(box,c,0,wh/2,d/2-t/2,w,wh,t);P(box,c,0,wh/2,-d/2+t/2,w,wh,t);P(box,c,w/2-t/2,wh/2,0,t,wh,d-2*t);P(box,c,-w/2+t/2,wh/2,0,t,wh,d-2*t);
    const e=.0015;P(box,ci,0,wh/2+t/2,d/2-t-e,w-2*t,wh-t,.002);P(box,ci,0,wh/2+t/2,-d/2+t+e,w-2*t,wh-t,.002);P(box,ci,w/2-t-e,wh/2+t/2,0,.002,wh-t,d-2*t);P(box,ci,-w/2+t+e,wh/2+t/2,0,.002,wh-t,d-2*t);P(box,ci,0,t+e,0,w-2*t,.002,d-2*t);
    if(WOOD.has(li))for(const s of[-1,1])P(box,C.osb,0,wh*.5,s*(d/2+.006),w*.96,.08,.012);});
   const parts=CARTON.has(li)?[{geo:wd.kitGeo((P,C,{box})=>P(box,C[name],w/4,lt/2,0,w/2,lt,d)),piv:[-w/2,wh,0],ax:'z',sg:1,max:2.2},{geo:wd.kitGeo((P,C,{box})=>P(box,C[name],-w/4,lt/2,0,w/2,lt,d)),piv:[w/2,wh,0],ax:'z',sg:-1,max:2.15}]
    :[{geo:wd.kitGeo((P,C,{box})=>{P(box,C[name],0,lt/2,d/2,w,lt,d);if(WOOD.has(li))for(const s of[-.3,.3])P(box,C.osb,s*w,lt+.006,d/2,.09,.012,d*.96);}),piv:[0,wh,-d/2],ax:'x',sg:-1,max:WOOD.has(li)?1.75:1.95}];
   const mk=g=>{const m=new T.InstancedMesh(g,wd.lootMat,48);m.count=0;m.frustumCulled=false;m.visible=false;m.instanceMatrix.setUsage(T.DynamicDrawUsage);scene.add(m);return m;};
   return{name,w,h,d,t,wh,body:mk(body),parts:parts.map(p=>({...p,im:mk(p.geo)}))};});}
 const tmp=new T.Matrix4(),tmp2=new T.Matrix4(),q=new T.Quaternion(),e=new T.Euler(),v=new T.Vector3(),sc=new T.Vector3();
 function crateMatrix(l,out){q.setFromEuler(e.set(0,l.ry,0));v.set(l.x-anchor.x,0,l.z-anchor.z);sc.set(l.s,l.s,l.s);return out.compose(v,q,sc);}
 function writeInstances(){if(!kit)return;const per=kit.map(()=>[]);for(const l of near)per[l.look].push(l);
  per.forEach((list,li)=>{const k=kit[li];k.body.count=list.length;k.body.visible=list.length>0;k.parts.forEach(p=>{p.im.count=list.length;p.im.visible=list.length>0;});
   list.forEach((l,i)=>{crateMatrix(l,tmp);const c=live.get(l.id),a=c?c.lidA:0;k.body.setMatrixAt(i,c?.blown?tmp.clone().scale(new T.Vector3(0,0,0)):tmp);
    k.parts.forEach(p=>{tmp2.makeTranslation(p.piv[0],p.piv[1],p.piv[2]);const r=new T.Matrix4();if(p.ax==='x')r.makeRotationX(p.sg*a*p.max);else r.makeRotationZ(p.sg*a*p.max);
     const m=tmp.clone().multiply(tmp2).multiply(r);if(c?.blown){m.multiply(new T.Matrix4().makeTranslation(0,-5,0));}p.im.setMatrixAt(i,m);});});
   k.body.instanceMatrix.needsUpdate=true;k.parts.forEach(p=>p.im.instanceMatrix.needsUpdate=true);});
  for(const k of kit){k.body.position.set(anchor.x,0,anchor.z);k.parts.forEach(p=>p.im.position.set(anchor.x,0,anchor.z));}}
 // ---- runtime crate state ----
 function rt(l){let c=live.get(l.id);if(c)return c;const r=rollCrate(l),s=saved[l.id];c={l,roll:r,open:!!s,lidA:s?1:0,anim:0,taken:new Set(s?.t||[]),blown:!!s?.b,group:null,items:[],lockDone:!!s};live.set(l.id,c);return c;}
 function persist(c){saved[c.l.id]={t:[...c.taken],b:c.blown?1:0};save();}
 async function spawnContents(c){if(c.group||!scene)return;await ready;if(c.group)return;const l=c.l,k=kit[l.look],g=new T.Group();g.position.set(l.x,0,l.z);g.rotation.y=l.ry;g.scale.setScalar(l.s);
  let fill=c.roll.fill;if(fill==='straw')fill=TOTE.has(l.look)||l.look===RUST?null:CARTON.has(l.look)?'shred':'straw';
  const iw=k.w-2*k.t-.01,id=k.d-2*k.t-.01,full=c.roll.full,fy=full?k.wh*.9:fill?k.wh*.6:k.t+.004;
  if(fill&&fill!=='glass'){const f=makeFill(fill,iw,id,(l.x*3+l.z)%7);f.position.y=fy;g.add(f);}
  if(fill==='glass'){const f=makeFill(WOOD.has(l.look)?'straw':'shred',iw,id,2);f.position.y=k.wh*.5;g.add(f);}
  if(fill==='glass'){const sh=makeLootModel('glass',{v:1});sh.position.y=fy;g.add(sh);const sh2=makeLootModel('glass',{v:3});sh2.position.set(iw*.2,fy+.01,-id*.2);g.add(sh2);}
  // item layout: a loose grid over the bed, biggest first, hashed jitter
  const R=rng(l.id+':lay'),list=c.roll.items.map((it,i)=>({...it,i})).filter(it=>!c.taken.has(it.i)).sort((a,b)=>LOOT_ITEMS[b.id].size-LOOT_ITEMS[a.id].size);
  const n=Math.max(1,list.length),cols=Math.max(1,Math.round(Math.sqrt(n*iw/id))),rows=Math.ceil(n/cols);
  c.items=list.map((it,j)=>{const o=makeLootModel(it.id,{...it.meta});const sz=LOOT_ITEMS[it.id].size,fit=Math.min(1,Math.min(iw/cols,id/rows)*1.25/sz);o.scale.multiplyScalar(fit/l.s);
   const cx=-iw/2+(j%cols+.5)*iw/cols+(R()-.5)*.03,cz=-id/2+(Math.floor(j/cols)+.5)*id/rows+(R()-.5)*.03;o.position.set(cx,fy+(full?.0:.004),cz);o.rotation.y=R()*6.28;g.add(o);return{...it,obj:o};});
  scene.add(g);c.group=g;}
 function wreck(c){if(c.wreck||!kit)return;const l=c.l,k=kit[l.look];k.plank??=W().kitGeo((P,C,{box})=>P(box,C[k.name]||C.crate1,0,.012,0,k.w*.85,.024,.11));const g=new T.Group(),R=rng(l.id+':w');
  for(let i=0;i<7;i++){const m=new T.Mesh(k.plank,W().lootMat);const a=R()*6.28,d=.3+R()*1.4;m.position.set(l.x+Math.cos(a)*d,i*.01,l.z+Math.sin(a)*d);m.rotation.set(0,R()*6.28,(R()-.5)*.3);m.scale.set(.5+R()*.6,1,1);g.add(m);}scene.add(g);c.wreck=g;}
 function dropContents(c){if(c.wreck&&!near.includes(c.l)){scene?.remove(c.wreck);c.wreck=null;}if(!c.group)return;scene?.remove(c.group);c.group=null;c.items=[];}
 // ---- effects ----
 const fx={clouds:[],fuses:[],bleed:0,cold:0,toxic:0,match:0,matchMax:1,shake:0,flash:0,yarn:null,lastHurt:0};
 let overlay=null;function ov(){if(overlay?.isConnected)return overlay;if(!document.getElementById('l1loot-css')){const st=document.createElement('style');st.id='l1loot-css';st.textContent=CSS;document.head.append(st);}overlay=document.createElement('div');overlay.className='l1loot-fx';overlay.innerHTML='<i class="fx-red"></i><i class="fx-cold"></i><i class="fx-gas"></i><i class="fx-flash"></i>';(document.getElementById('game')||document.body).append(overlay);return overlay;}
 const cloudTex=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),r=g.createRadialGradient(32,32,2,32,32,31);r.addColorStop(0,'rgba(255,255,255,.9)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,64,64);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;})();
 function puff(x,z,color,n,r,y=.6){const grp=new T.Group();for(let i=0;i<n;i++){const s=new T.Sprite(new T.SpriteMaterial({map:cloudTex,color,transparent:true,opacity:.0,depthWrite:false}));const a=i*2.4,d=r*Math.sqrt((i+.5)/n);s.position.set(x+Math.cos(a)*d,y+(i%3)*.35,z+Math.sin(a)*d);s.scale.setScalar(1.4+(i%4)*.4);grp.add(s);}scene?.add(grp);return grp;}
 function spark(x,y,z){const s=new T.Sprite(new T.SpriteMaterial({map:cloudTex,color:0xffa030,transparent:true,blending:T.AdditiveBlending,depthWrite:false}));s.position.set(x,y,z);s.scale.setScalar(.35);scene?.add(s);return s;}
 function sfx(kind){const ctx=audio?.ctx;if(!ctx||!audio.master)return;const t=ctx.currentTime,len=kind==='boom'?1.6:kind==='hiss'?.25:kind==='creak'?.5:.18,buf=ctx.createBuffer(1,Math.floor(ctx.sampleRate*len),ctx.sampleRate),d=buf.getChannelData(0);
  for(let i=0;i<d.length;i++){const u=i/d.length;d[i]=(Math.random()*2-1)*(kind==='boom'?Math.exp(-u*5):kind==='creak'?Math.sin(i*.011*(1+u))*.6*(1-u):kind==='hiss'?.4:Math.exp(-u*14));}
  const s=ctx.createBufferSource(),gn=ctx.createGain(),f=ctx.createBiquadFilter();f.type=kind==='boom'?'lowpass':kind==='hiss'?'highpass':'bandpass';f.frequency.value=kind==='boom'?220:kind==='hiss'?3000:kind==='creak'?600:1400;
  gn.gain.value=kind==='boom'?1.1:kind==='hiss'?.06:.25;s.buffer=buf;s.connect(f);f.connect(gn);gn.connect(audio.master);s.onended=()=>{s.disconnect();f.disconnect();gn.disconnect();};s.start(t);}
 function hurt(n,why){state.health=Math.max(0,state.health-n);fx.lastHurt=.5;if(state.health<=0){state.health=35;fx.bleed=0;fx.toxic=0;const w=W();const L=w.landmarks?.[0]||{x:4,z:4},p=w.safe(L.x,L.z);Object.assign(state,{x:p.x,z:p.z});w.ensure(p.x,p.z);resetCameraRig();toast('你眼前一黑……醒来时躺在天鹰段的入口附近。（'+why+'）');}updateHUD();}
 function explode(x,z,src){sfx('boom');fx.flash=1;fx.shake=.6;const d=Math.hypot(state.x-x,state.z-z);if(d<5)hurt(Math.round(70*Math.max(0,1-d/5)),'爆炸');
  const p=puff(x,z,0x6a6460,10,1.6,.8);fx.clouds.push({x,z,r:2.4,t:5,grp:p,kind:'smoke'});
  for(const l of near){const c=rt(l);if(Math.hypot(l.x-x,l.z-z)<2.6&&l.id!==src?.l.id&&!c.open){c.lockDone=true;openCrate(c,true);}}
  if(src){src.blown=true;src.items=[];src.taken=new Set(src.roll.items.map((_,i)=>i));dropContents(src);persist(src);wreck(src);W().unsolid(src.l.x,src.l.z);writeInstances();}
  toast(d<2.5?'轰——！冲击波把你掀了个踉跄。':d<5?'爆炸的气浪推了你一把，耳朵嗡嗡作响。':'远处一声闷响，灰尘从天花板簌簌落下。');}
 function openCrate(c,forced=false){c.open=true;if(forced)c.lidA=1;writeInstances();persist(c);sfx(CARTON.has(c.l.look)?'tick':'creak');spawnContents(c);
  const hz=c.roll.hazard;if(!hz||forced&&hz==='boom')return;
  if(hz==='chem'){fx.clouds.push({x:c.l.x,z:c.l.z,r:2.3,t:14,grp:puff(c.l.x,c.l.z,0xb8d84a,9,1.1),kind:'chem'});toast('瓶子在箱里碎了——一股刺鼻的黄绿色气体冒了出来！快离开！');}
  else if(hz==='boom'){fx.fuses.push({c,t:3.6,x:c.l.x,z:c.l.z,spark:spark(c.l.x,c.l.h+.05,c.l.z)});sfx('hiss');toast('嘶——箱盖下的引信被拉燃了！快跑，或者用水浇灭它！');}
  else if(hz==='glass'){toast('满箱都是碎玻璃……伸手拿东西要小心。');}
  else if(hz==='nitro'){fx.cold=10;state.stamina=0;hurt(5,'冻伤');fx.clouds.push({x:c.l.x,z:c.l.z,r:1.6,t:6,grp:puff(c.l.x,c.l.z,0xdfefff,7,.7,.3),kind:'cold'});toast('一股白色寒雾涌了出来——是固态氮！手指一下子冻僵了。');}}
 // ---- targeting ----
 const fwd=new T.Vector3();
 function target(){if(!kit)return null;camera.getWorldDirection(fwd);let best=null,bs=1e9;
  for(const l of near){const c=rt(l);if(c.blown)continue;const dx=l.x-state.x,dz=l.z-state.z,dist=Math.hypot(dx,dz)-Math.max(l.w,l.d)/2;if(dist>1.5)continue;const dot=(dx*fwd.x+dz*fwd.z)/Math.max(.01,Math.hypot(dx,dz))/Math.max(.01,Math.hypot(fwd.x,fwd.z));if(dot<.35&&dist>.25)continue;const sc2=dist*.5-dot*2;if(sc2<bs){bs=sc2;best=c;}}return best;}
 function targetItem(c){if(!c.items.length)return null;camera.getWorldPosition(v);camera.getWorldDirection(fwd);let best=c.items[0],ba=-2;const w=new T.Vector3();
  for(const it of c.items){it.obj.getWorldPosition(w);w.sub(v).normalize();const a=w.dot(fwd);if(a>ba){ba=a;best=it;}}return best;}
 const has=id=>inventory.count(x=>x===id)>0;
 function lockInfo(c){if(c.open||c.lockDone||!c.roll.lock)return null;if(c.roll.lock===1)return has('knife')?{ok:true,txt:'E 用猎刀撬开钉死的木箱'}:has('axe')?{ok:true,txt:'E 用手斧撬开钉死的木箱'}:{ok:false,txt:'木箱被钉死了 · 需要小刀或斧头'};
  return has('axe')?{ok:true,txt:'E 用手斧砸开挂锁'}:{ok:false,txt:'铁皮箱上着挂锁 · 需要斧头'};}
 function prompt(){if(!kit||state.level!==1||W().mode!=='halls')return null;const c=target();if(!c)return null;let s;
  if(!c.open){const L=lockInfo(c);s=L?L.txt:CARTON.has(c.l.look)?'E 撕开纸箱胶带':TOTE.has(c.l.look)?'E 掀开塑料箱盖':'E 打开板条箱';
   if(c.roll.hazard&&inventory.selected()==='fuyou')s+=' · 福友玉在发烫（'+HAZ_TXT[c.roll.hazard]+'？）';}
  else{const it=targetItem(c);s=it?'E 拿取 '+LOOT_ITEMS[it.id].name+(c.items.length>1?'（箱里还有 '+c.items.length+' 件）':''):'空箱子';}
  return s;}
 function use(){if(!kit||state.level!==1||W().mode!=='halls')return false;const c=target();if(!c)return false;
  if(!c.open){const L=lockInfo(c);if(L&&!L.ok){toast(L.txt+'。');sfx('tick');return true;}if(L)c.lockDone=true;openCrate(c);return true;}
  const it=targetItem(c);if(!it){toast('箱子已经空了。');return true;}
  if(c.roll.hazard==='glass'&&rng(c.l.id+':cut'+c.taken.size)()<.45){hurt(9,'碎玻璃');fx.bleed=Math.max(fx.bleed,22);toast('被碎玻璃划破了手——在流血！用纱布包扎。');}
  const meta={...it.meta};if(it.id==='berries')Object.assign(meta,{lv:1,x:c.l.x+Math.sin(c.l.ry)*.9,z:c.l.z+Math.cos(c.l.ry)*.9});if(it.id==='nitrogen')meta.born=Date.now();if(it.id==='squirt')meta.ammo=6;if(it.id==='lighter')meta.fuel=100;if(it.id==='matches')meta.left=12;if(it.id==='yarn')meta.len=60;if(it.id==='sanitizer')meta.uses=4;
  if(it.id==='soy')Object.assign(meta,{kind:'vending',type:'soy'});
  const left=inventory.add(it.id,it.id==='almond'?almondVariant(it.meta.id):meta,1);if(left){toast('背包满了，放不下 '+LOOT_ITEMS[it.id].name+'。');return true;}
  c.taken.add(it.i);c.items=c.items.filter(x=>x!==it);it.obj.parent?.remove(it.obj);persist(c);audio?.chime?.();toast('拿到了 '+LOOT_ITEMS[it.id].name+(it.id==='nitrogen'?'——它在冒白气，会慢慢升华掉。':''));updateHUD();return true;}
 // ---- using the selected item (Q) ----
 function useSelected(){const id=inventory.selected();if(!id)return false;const i=inventory.sel,s=inventory.slots[i],meta=s.items.at(-1)||{};
  const eat=(txt,o)=>{inventory.take(i);for(const k in o)state[k]=Math.max(0,Math.min(100,state[k]+o[k]));audio?.chime?.();toast(txt);updateHUD();return true;};
  switch(id){
   case 'can':return eat(has('knife')?'用猎刀撬开罐头，囫囵吃完了。':'没有开罐器，你用牙和指甲硬撬开了它……',{stamina:30,health:has('knife')?8:5,sanity:3});
   case 'peas':return eat('嚼了一把干豌豆。硬，但能顶饿。',{stamina:8});
   case 'pineapple':return eat('掰开菠萝，汁水顺着手腕流下来。',{hydration:18,health:6,sanity:6});
   case 'melon':return eat('哈密瓜很甜，像是刚从酒吧小舟上拿下来的。',{hydration:20,health:5,sanity:5});
   case 'papaya':return eat('木瓜软糯，有点过熟。',{hydration:14,health:5});
   case 'bandage':fx.bleed=0;return eat('用纱布包扎好伤口。',{health:25});
   case 'soap':fx.toxic=0;return eat('用肥皂把手和脸洗干净了，化学品的刺痛感消退了。',{sanity:4});
   case 'sanitizer':{fx.toxic=0;meta.uses=(meta.uses??4)-1;if(meta.uses<=0)inventory.take(i);toast('挤了点免洗洗手液。'+(meta.uses>0?'（还能用 '+meta.uses+' 次）':'（用完了）'));state.sanity=Math.min(100,state.sanity+2);updateHUD();return true;}
   case 'watch':{const t=Math.floor(state.elapsed||0),h=String(Math.floor(t/3600)).padStart(2,'0'),m=String(Math.floor(t/60)%60).padStart(2,'0'),sec=String(t%60).padStart(2,'0');toast('手表：你在后室已经待了 '+h+':'+m+':'+sec+'。表盘上的指针却始终停在 3:17。');return true;}
   case 'charger':toast('没有手机，墙上的插座也是死的。先留着吧。');return true;
   case 'battery':toast('手电筒的电量还够。备用电池先收着。');return true;
   case 'knife':toast('猎刀：靠近钉死的木箱按 E 撬开。');return true;
   case 'axe':toast('手斧：能撬开钉死的木箱，也能砸开铁皮箱的挂锁。');return true;
   case 'junk':case 'foam':inventory.take(i);toast('扔掉了'+LOOT_ITEMS[id].name+'。');return true;
   case 'chemical':toast('你不打算喝这东西。标签上画着骷髅。');return true;
   case 'glass':inventory.take(i);toast('把碎玻璃扔掉了。');return true;
   case 'nitrogen':inventory.take(i);fx.clouds.push({x:state.x,z:state.z,r:1,t:4,grp:puff(state.x,state.z,0xdfefff,5,.4,.2),kind:'cold-soft'});toast('把氮块丢在地上，它嘶嘶地冒着白雾升华掉了。');return true;
   case 'matches':case 'lighter':{if(id==='matches'){meta.left=(meta.left??12)-1;if(meta.left<=0)inventory.take(i);}else{meta.fuel=(meta.fuel??100)-12;if(meta.fuel<=0){inventory.take(i);toast('打火机没气了。');return true;}}
    fx.match=id==='matches'?14:40;fx.matchMax=fx.match;sfx('tick');toast(id==='matches'?'划着了一根火柴。'+(meta.left>0?'（盒里还剩 '+meta.left+' 根）':'（最后一根）'):'咔哒——打火机的火苗跳了起来。');return true;}
   case 'dynamite':{if(!has('matches')&&!has('lighter')){toast('需要火柴或打火机才能点燃炸药。');return true;}inventory.take(i);camera.getWorldDirection(fwd);const fl=Math.hypot(fwd.x,fwd.z)||1,x=state.x+fwd.x/fl*3,z=state.z+fwd.z/fl*3;
    const o=makeLootModel('dynamite',{});o.position.set(x,0,z);scene?.add(o);fx.fuses.push({c:null,obj:o,t:3,x,z,spark:spark(x,.08,z)});sfx('hiss');toast('点燃引信，扔了出去——快躲开！');return true;}
   case 'squirt':return squirt(i,meta);
   case 'berries':{inventory.take(i);const lv=meta.lv??1;if(lv!==1){toast('浆果的味道变了——什么也没发生。');return true;}fx.flash=.8;
    if(state.level!==1){toast('你吞下迁跃浆果，眼前的一切被抽离——');enterOne?.(0,{x:meta.x,z:meta.z});return true;}
    const w=W(),p=w.safe(meta.x??state.x,meta.z??state.z);Object.assign(state,{x:p.x,z:p.z});w.ensure(p.x,p.z);resetCameraRig();toast('迁跃浆果：眼前一花——你回到了第一次发现它们的地方。');return true;}
   case 'fuyou':{const hz=near.map(rt).filter(c=>c.roll.hazard&&!c.open&&!c.blown).map(c=>Math.hypot(c.l.x-state.x,c.l.z-state.z)).sort((a,b)=>a-b)[0];
    toast(hz===undefined||hz>10?'福友玉保持着平静的苔绿色。附近没有察觉到危险。':'福友玉的光越来越亮——大约 '+Math.round(hz)+' 米内有危险的东西。');return true;}
   case 'yarn':{if(fx.yarn){fx.yarn=null;toast('剪断了毛线。线还留在地上，可以顺着它走回去。');return true;}fx.yarn={meta,last:{x:state.x,z:state.z},pts:[new T.Vector3(state.x,.02,state.z)],line:null};toast('把毛线头系在这里，开始边走边放线（再按 Q 剪断）。还剩 '+Math.round(meta.len??60)+' 米。');return true;}
  }
  return false;}
 function squirt(i,meta){if(!(meta.ammo>0)){const a=inventory.slots.findIndex(s=>s?.id==='almond');if(a<0){toast('滋水枪是空的。背包里有杏仁水时会自动灌满。');return true;}inventory.take(a);meta.ammo=8;toast('把一瓶杏仁水灌进了储罐（8 发）。');return true;}
  meta.ammo--;camera.getWorldDirection(fwd);sfx('hiss');
  if(fwd.y>.82){state.hydration=Math.min(100,state.hydration+10);state.sanity=Math.min(100,state.sanity+3);toast('朝嘴里滋了一口杏仁水。滋水枪只对使用者本人网开一面。');updateHUD();return true;}
  const fl=Math.hypot(fwd.x,fwd.z)||1;let hit=false;for(const f of fx.fuses){const dx=f.x-state.x,dz=f.z-state.z,d=Math.hypot(dx,dz);if(d<5&&(dx*fwd.x+dz*fwd.z)/fl/d>.8){f.dead=true;hit=true;toast('嗤——引信被杏仁水浇灭了。');}}
  for(const c of fx.clouds){const dx=c.x-state.x,dz=c.z-state.z,d=Math.hypot(dx,dz);if(c.kind==='chem'&&d<5){c.t=Math.min(c.t,2.5);hit=true;toast('水雾压住了化学气体。');}}
  if(!hit)toast('滋——杏仁水喷了出去。（储罐还剩 '+meta.ammo+' 发）');
  const pts=new T.BufferGeometry(),n=60,arr=new Float32Array(n*3);for(let k=0;k<n;k++){const s=.4+k/n*4,j=(k%3-1)*.03;arr.set([state.x+fwd.x/fl*s+j,1.35+fwd.y*s-s*s*.06+j,state.z+fwd.z/fl*s-j],k*3);}pts.setAttribute('position',new T.BufferAttribute(arr,3));
  const p=new T.Points(pts,new T.PointsMaterial({color:0xd8eef6,size:.09,transparent:true,opacity:.85}));scene?.add(p);fx.clouds.push({x:0,z:0,r:0,t:.7,grp:p,kind:'spray'});return true;}
 // ---- per frame ----
 let n2T=0;
 function update(dt){const inL1=state.level===1&&W()?.mode==='halls';
  if(!kit&&inL1&&W())buildKit();if(!kit)return;
  for(const k of kit){const v=inL1;k.body.visible=v&&k.body.count>0;k.parts.forEach(p=>p.im.visible=v&&p.im.count>0);}
  if(!inL1){for(const c of live.values())dropContents(c);fx.match=0;W()?.setHandLight?.(0);if(overlay)for(const i of overlay.children)i.style.opacity='0';return;}
  if(fill)fill.intensity=.12+.45*(W().power??1);
  checkT-=dt;if(checkT<=0){checkT=.4;const list=W().lootNear(state.x,state.z,26);const key=list.map(l=>l.id).join('|');
   if(key!==nearKey||Math.hypot(anchor.x-state.x,anchor.z-state.z)>400){nearKey=key;near=list;anchor={x:Math.round(state.x),z:Math.round(state.z)};
    const ids=new Set(list.map(l=>l.id));for(const[id,c]of live)if(!ids.has(id)){dropContents(c);live.delete(id);}for(const l of list){const c=rt(l);if(c.open&&!c.blown)spawnContents(c);if(c.blown){wreck(c);W().unsolid(l.x,l.z);}}writeInstances();}}
  let anim=false;for(const l of near){const c=live.get(l.id);if(c&&c.open&&c.lidA<1){c.lidA=Math.min(1,c.lidA+dt*1.8);anim=true;}}if(anim)writeInstances();
  // hazards
  const o=ov();for(const c of fx.clouds){c.t-=dt;c.age=(c.age||0)+dt;const fade=c.kind==='spray'?Math.min(1,c.t*3):Math.min(1,c.t/1.5)*Math.min(1,c.age/.6);c.grp.traverse(s=>{if(s.material)s.material.opacity=(c.kind==='spray'?.8:c.kind==='chem'?.38:.5)*Math.max(0,fade);});c.grp.position.y=c.kind==='spray'?0:(c.age||0)*.05;
   if(c.kind==='chem'&&Math.hypot(state.x-c.x,state.z-c.z)<c.r&&c.t>0){state.health=Math.max(1,state.health-dt*4.5);state.sanity=Math.max(0,state.sanity-dt*2);fx.toxic=Math.max(fx.toxic,20);fx.gasIn=.4;}}
  fx.clouds=fx.clouds.filter(c=>{if(c.t>0)return true;scene?.remove(c.grp);c.grp.traverse(s=>{s.geometry?.dispose?.();s.material?.dispose?.();});return false;});
  for(const f of fx.fuses){if(f.spark){f.spark.scale.setScalar(.2+Math.random()*.35);f.spark.material.opacity=f.dead?0:1;if(f.dead){scene?.remove(f.spark);f.spark=null;}}if(f.dead)continue;f.t-=dt;if(Math.random()<dt*14)sfx('hiss');if(f.t<=0){f.dead=true;f.obj&&scene?.remove(f.obj);explode(f.x,f.z,f.c);}}fx.fuses=fx.fuses.filter(f=>{if(!f.dead)return true;if(f.spark)scene?.remove(f.spark);if(f.obj)scene?.remove(f.obj);return false;});
  if(fx.bleed>0){fx.bleed-=dt;state.health=Math.max(1,state.health-dt*.55);}
  if(fx.toxic>0){fx.toxic-=dt;state.sanity=Math.max(0,state.sanity-dt*.25);}
  if(fx.cold>0){fx.cold-=dt;state.stamina=Math.min(state.stamina,8);}
  fx.gasIn=Math.max(0,(fx.gasIn||0)-dt);fx.flash=Math.max(0,fx.flash-dt*1.6);fx.lastHurt=Math.max(0,fx.lastHurt-dt);
  o.querySelector('.fx-red').style.opacity=String(Math.min(.85,(fx.bleed>0?.25+.2*Math.sin(performance.now()/260):0)+fx.lastHurt));o.querySelector('.fx-cold').style.opacity=String(Math.min(.6,fx.cold/8));
  o.querySelector('.fx-gas').style.opacity=String(Math.min(.7,fx.gasIn*1.6+(fx.toxic>0?.08:0)));o.querySelector('.fx-flash').style.opacity=String(fx.flash);
  // match / lighter: a small warm omni light from the hand (rides the world's flashlight uniform)
  if(fx.match>0){fx.match-=dt;camera.getWorldPosition(v);camera.getWorldDirection(fwd);const fl=.9+.25*Math.sin(performance.now()/47)+.12*Math.sin(performance.now()/13);W().setHandLight(Math.min(1,fx.match/2)*fl*6,v.clone().addScaledVector(fwd,.35).add(new T.Vector3(0,-.15,0)),fwd);}else W().setHandLight(0);
  // 福友玉 glow while held, brighter near unopened hazards
  if(inventory.selected()==='fuyou'){const hz=near.map(rt).filter(c=>c.roll.hazard&&!c.open&&!c.blown).map(c=>Math.hypot(c.l.x-state.x,c.l.z-state.z)).sort((a,b)=>a-b)[0];o.classList.toggle('fuyou',true);o.style.setProperty('--fy',String(hz===undefined?.15:Math.max(.15,1-hz/9)));}else o.classList.remove('fuyou');
  // yarn trail
  if(fx.yarn){const y=fx.yarn,d=Math.hypot(state.x-y.last.x,state.z-y.last.z);if(d>1.2){y.meta.len=(y.meta.len??60)-d;y.last={x:state.x,z:state.z};y.pts.push(new T.Vector3(state.x,.02,state.z));if(y.line){scene.remove(y.line);y.line.geometry.dispose();}
    y.line=new T.Line(new T.BufferGeometry().setFromPoints(y.pts),new T.LineBasicMaterial({color:(y.meta.v|0)%2?0x2a8a90:0xd8a420}));scene.add(y.line);trails.push(y.line);
    if(y.meta.len<=0){const k=inventory.slots.findIndex(s=>s?.id==='yarn');if(k>=0)inventory.take(k);fx.yarn=null;toast('一团毛线放完了。');}}}
  // solid nitrogen sublimates in the bag
  n2T-=dt;if(n2T<=0){n2T=2;for(let k=0;k<inventory.slots.length;k++){const s=inventory.slots[k];if(s?.id!=='nitrogen')continue;const m=s.items[0];if(m?.born&&Date.now()-m.born>150000){inventory.take(k);toast('一块固态氮在背包里升华光了。');break;}}}
 }
 const trails=[];
 function stats(){return{near:near.length,live:live.size,open:[...live.values()].filter(c=>c.open).length,drawCalls:kit?kit.reduce((a,k)=>a+(k.body.visible?1:0)+k.parts.filter(p=>p.im.visible).length,0):0};}
 async function prewarm(renderer){if(!kit&&W())buildKit();if(!kit)return;await ready;}
 return{reset:(l)=>{const c=live.get(l.id);if(c)dropContents(c);live.delete(l.id);delete saved[l.id];nearKey='';},force:(l,th)=>{const c=rt(l);c.roll=rollCrate(l,th);return c.roll;},update,prompt,use,useSelected,stats,prewarm,rollCrate,get near(){return near;},live,fx,target,openCrate:(c,f)=>openCrate(c,f),spawnContents,rt};
}
