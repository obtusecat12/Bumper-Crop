// V124-L1 loot · openable crates in Level 1 + what is inside them.
// Crate sites come from the pure hashed layout (level1-world.js lootAt → chunk.loot, infinite, no bounds). Closed and
// open crates are drawn as InstancedMeshes in the world's own lit shader (one per crate look and lid part, ~26 draw calls
// however many crates are near). Contents are rolled deterministically from the crate id when it is opened, and only
// open crates near the player get item meshes. Opened / taken state persists in localStorage.
import * as T from './vendor/three.module.min.js';
import {l1Hash} from './level1-layout.js?v=113';
import {LOOT_ITEMS,makeLootModel,makeFill,prepareLootItems,itemTitle} from './l1loot124-items.js?v=130';
import {almondVariant} from './almond-water-assets.js?v=60';
import {makeBundle,packCrate,PACKS} from './l1loot124-pack.js?v=130';import {ITEMS} from './inventory117.js?v=124';
const CSS=`.l1loot-fx{position:absolute;inset:0;pointer-events:none;z-index:30}.l1loot-fx i{position:absolute;inset:0;opacity:0;transition:opacity .15s}
.l1loot-fx .fx-red{background:radial-gradient(ellipse at center,transparent 45%,rgba(150,0,0,.85) 100%)}.l1loot-fx .fx-cold{background:radial-gradient(ellipse at center,transparent 40%,rgba(200,230,255,.9) 100%);backdrop-filter:saturate(.4)}
.l1loot-fx .fx-gas{background:radial-gradient(ellipse at center,rgba(170,200,60,.25) 0%,rgba(120,150,20,.75) 100%)}.l1loot-fx .fx-flash{background:#fff3d0;transition:none}.l1loot-fx .fx-match{background:radial-gradient(ellipse 55% 60% at 62% 100%,rgba(255,190,90,.55) 0%,rgba(255,150,60,.18) 45%,transparent 75%);mix-blend-mode:screen}
.l1loot-fx .fx-drunk{backdrop-filter:blur(1.2px) saturate(1.25);background:radial-gradient(ellipse at center,transparent 50%,rgba(120,70,20,.25) 100%)}.l1loot-fx .fx-smoke{background:radial-gradient(ellipse 70% 50% at 50% 80%,rgba(200,200,190,.45) 0%,transparent 80%)}
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
 // V130-B loot+
 bar:{items:[['beer',1,4],['cola',0,3],['cigarettes',0,3],['peacetin',0,1],['tumbler',0,2],['lighter',0,1]],fill:'straw',min:3},
 frozen:{items:[['tvdinner',2,4],['cola',0,2]],fill:'shred'},
 oddities:{items:[['duck',0,1],['cassette',0,2],['floppy',0,2],['motelkey',0,1],['snowglobe',0,1],['teeth',0,1],['pager',0,1],['polaroid',0,2],['tumbler',0,1]],fill:'shred',min:3},
};
// V130-B extras appended to the older themes (own rng, after the V124c packs, so V124 rolls keep their indices)
const EX130={supplies:[['drink',0,2],['cola',0,1]],pantry:[['tvdinner',0,1],['cola',0,1]],household:[['cigarettes',0,1],['tumbler',0,1],['duck',0,1],['polaroid',0,1]],junk:[['cassette',0,1],['floppy',0,1],['polaroid',0,1],['beer',0,1]],tools:[['pager',0,1],['motelkey',0,1]],foam:[['snowglobe',0,1],['teeth',0,1]],odd:[['teeth',0,1],['snowglobe',0,1]]};
const W0={supplies:10,pantry:8,produce:4,household:12,tools:6,junk:12,foam:7,peas:5,odd:4,chem:5,boom:3,glass:5,nitro:3},W130={bar:8,frozen:5,oddities:7};
const WS={1:{pantry:14,supplies:12,foam:10,peas:8,produce:6},2:{odd:8,junk:14},3:{tools:14,chem:10,glass:10,boom:6,household:6},4:{produce:10,odd:8,household:10},5:{supplies:16,tools:12,odd:9,pantry:10,household:10,junk:4,foam:3,chem:4,boom:3}};
const HAZ_TXT={chem:'化学制剂',boom:'易爆物',glass:'碎玻璃',nitro:'固态氮'};
export function rollCrate(l,force,legacy=false){const R=rng(l.id);let theme='supplies';
 if(force)theme=force;else if(l.kb!==-1){const w={...W0,...(legacy?{}:W130),...(WS[l.kb]||{})};let t=R()*Object.values(w).reduce((a,b)=>a+b,0);for(const k in w){t-=w[k];if(t<=0){theme=k;break;}}}
 else if(R()<.12)theme='odd';
 const th=TH[theme],items=[];for(const[id,a,b]of th.items){const n=a+Math.floor(R()*(b-a+1));for(let i=0;i<n;i++)items.push({id,meta:{v:Math.floor(R()*4),id:l.id+':'+items.length}});}
 if(th.need&&!items.some(i=>th.need.includes(i.id)))items.push({id:th.need[Math.floor(R()*th.need.length)],meta:{v:0,id:l.id+':n'}});
 while(items.length<(th.min||1)){const[id]=th.items[Math.floor(R()*th.items.length)];items.push({id,meta:{v:Math.floor(R()*4),id:l.id+':m'+items.length}});}
 let lock=0;if(l.kb!==-1&&l.kb!==5){if(WOOD.has(l.look)&&l1Hash(l.x*17|0,l.z*17|0,411)<.55)lock=1;else if(l.look===RUST)lock=2;}
 // V124c packing: real bundles appended after the base roll (own rng), and a packing mode per crate
 const P=rng(l.id+':pk'),packs=[],idx=id=>items.map((it,i)=>it.id===id?i:-1).filter(i=>i>=0);
 const grow=(id,n,kind,p)=>{const roll=P();let ix=idx(id);if(!ix.length||roll>=p)return;const v=items[ix[0]].meta.v;while(ix.length<n){items.push({id,meta:{v:Math.floor(P()*4),id:l.id+':p'+items.length}});ix=idx(id);}if(kind==='cantray')for(const i of ix)items[i].meta.v=v;if(kind==='six'){let sid=l.id+':six';for(let q=0;q<24;q++){const t=l.id+':six'+q;if(almondVariant(t).kind==='glass'){sid=t;break;}}for(const i of ix.slice(0,n))items[i].meta.id=sid;}packs.push({kind,idx:ix.slice(0,n)});};
 grow('almond',6,'six',theme==='supplies'||l.kb===-1?.6:.3);grow('can',6,'cantray',theme==='pantry'?.65:.35);grow('battery',4,'blister',.75);
 grow('matches',4,'matchbundle',.55);grow('bandage',4,'gauze',.5);grow('yarn',3,'yarnbundle',.45);
 if((theme==='junk'||theme==='household'||theme==='tools')&&P()<.4)items.push({id:'note',meta:{v:Math.floor(P()*2),id:l.id+':note'}});
 // V130-B: extras + new bundles (beer / cola six-pack rings, a tied stack of cigarette packs), only for crates first rolled by V130
 if(!legacy){const Q=rng(l.id+':v130');for(const[id,a,b]of(EX130[theme]||[])){const n=a+Math.floor(Q()*(b-a+1));for(let i=0;i<n;i++)items.push({id,meta:{v:Math.floor(Q()*4),id:l.id+':x'+items.length}});}
  const grow2=(id,n,kind,p)=>{let ix=idx(id);if(!ix.length||Q()>=p||ix.some(i=>packs.some(k=>k.idx.includes(i))))return;const v=items[ix[0]].meta.v;while(ix.length<n){items.push({id,meta:{v,id:l.id+':q'+items.length}});ix=idx(id);}for(const i of ix)items[i].meta.v=v;packs.push({kind,idx:ix.slice(0,n)});};
  grow2('beer',6,'beer6',theme==='bar'?.55:.25);grow2('cola',6,'cola6',.35);grow2('cigarettes',10,'cigstack',theme==='bar'?.4:.12);}
 const TIDY={supplies:.85,pantry:.9,produce:.55,household:.4,tools:.25,junk:.06,foam:.1,peas:.1,odd:.3,chem:.65,boom:.7,glass:.15,nitro:.5,bar:.5,frozen:.92,oddities:.12};
 const mode=P()<(TIDY[theme]??.4)?'tidy':'messy';
 return{theme,items,fill:th.fill,full:!!th.full,hazard:th.hazard||null,lock,packs,mode,legacy};}

export function createL1Loot124({T:TT=T,world,inventory,state,camera,toast,audio,updateHUD=()=>{},enterOne,resetCameraRig=()=>{},inspect=null}){
 let shiftDown=false;addEventListener('keydown',e=>{if(e.key==='Shift')shiftDown=true;});addEventListener('keyup',e=>{if(e.key==='Shift')shiftDown=false;});addEventListener('blur',()=>{shiftDown=false;});
 let FL=null;import('./flashlight117.js?v=119').then(m=>{FL=m;}).catch(()=>{});
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
 function rt(l){let c=live.get(l.id);if(c)return c;const s=saved[l.id],r=rollCrate(l,null,!!s&&!s.v130);c={l,roll:r,open:!!s,lidA:s?1:0,anim:0,taken:new Set(s?.t||[]),blown:!!s?.b,group:null,items:[],lockDone:!!s};live.set(l.id,c);return c;}
 function persist(c){saved[c.l.id]={t:[...c.taken],b:c.blown?1:0,...(c.roll.legacy?{}:{v130:1})};save();}
 async function spawnContents(c){if(c.group||!scene)return;await ready;if(c.group)return;const l=c.l,k=kit[l.look],g=new T.Group();g.position.set(l.x,0,l.z);g.rotation.y=l.ry;g.scale.setScalar(l.s);
  let fill=c.roll.fill;if(fill==='straw')fill=TOTE.has(l.look)||l.look===RUST?null:CARTON.has(l.look)?'shred':'straw';
  const iw=k.w-2*k.t-.01,id=k.d-2*k.t-.01,full=c.roll.full,mode=full?'messy':(c.roll.mode||'messy');
  // bed height: tidy crates are packed from the floor (straw only peeks between items), messy ones were tipped onto a bed
  const bed=full?k.wh*.9:!fill?k.t+.004:mode==='tidy'?k.t+.004:k.wh*.3;
  if(fill&&fill!=='glass'){const f=makeFill(fill,iw,id,(l.x*3+l.z)%7);f.position.y=mode==='tidy'&&!full?k.t-.012:bed;g.add(f);}
  if(fill==='glass'){const f=makeFill(WOOD.has(l.look)?'straw':'shred',iw,id,2);f.position.y=bed;g.add(f);const sh=makeLootModel('glass',{v:1});sh.position.y=bed+.012;g.add(sh);const sh2=makeLootModel('glass',{v:3});sh2.position.set(iw*.2,bed+.014,-id*.2);g.add(sh2);}
  const inner=new T.Group();inner.scale.setScalar(1/l.s);g.add(inner);
  const left=c.roll.items.map((it,i)=>({...it,i})).filter(it=>!c.taken.has(it.i)),inPack=new Map();(c.roll.packs||[]).forEach((p,pi)=>p.idx.forEach((i,k2)=>inPack.set(i,[pi,k2])));
  const units=[],packU=new Map();
  for(const it of left){const pk=inPack.get(it.i);if(pk){let u=packU.get(pk[0]);if(!u){u={pack:c.roll.packs[pk[0]],members:[],id:it.id};packU.set(pk[0],u);units.push(u);}u.members.push({...it,k:pk[1]});}else units.push({id:it.id,members:[it]});}
  for(const u of units){if(u.pack&&u.members.length>1){u.obj=makeBundle(u.pack.kind,u.members,u.members.length===u.pack.idx.length);}else{delete u.pack;u.obj=makeLootModel(u.id,{...u.members[0].meta});}}
  const S=l.s,glassBed=fill==='glass'?.02:0;packCrate(units,{w:iw*S-.006,d:id*S-.006,floor:(bed+glassBed+(full?0:.002))*S,wall:k.wh*S,mode,R:rng(l.id+':lay')});
  for(const u of units)inner.add(u.obj);c.mode=mode;
  c.items=units;scene.add(g);c.group=g;}
 function wreck(c){if(c.wreck||!kit)return;const l=c.l,k=kit[l.look];k.plank??=W().kitGeo((P,C,{box})=>P(box,C[k.name]||C.crate1,0,.012,0,k.w*.85,.024,.11));const g=new T.Group(),R=rng(l.id+':w');
  for(let i=0;i<7;i++){const m=new T.Mesh(k.plank,W().lootMat);const a=R()*6.28,d=.3+R()*1.4;m.position.set(l.x+Math.cos(a)*d,i*.01,l.z+Math.sin(a)*d);m.rotation.set(0,R()*6.28,(R()-.5)*.3);m.scale.set(.5+R()*.6,1,1);g.add(m);}scene.add(g);c.wreck=g;}
 function dropContents(c){if(c.wreck&&!near.includes(c.l)){scene?.remove(c.wreck);c.wreck=null;}if(!c.group)return;scene?.remove(c.group);c.group=null;c.items=[];}
 // ---- effects ----
 const fx={clouds:[],fuses:[],bleed:0,cold:0,toxic:0,match:0,matchMax:1,shake:0,flash:0,yarn:null,lastHurt:0};
 let overlay=null;function ov(){if(overlay?.isConnected)return overlay;if(!document.getElementById('l1loot-css')){const st=document.createElement('style');st.id='l1loot-css';st.textContent=CSS;document.head.append(st);}overlay=document.createElement('div');overlay.className='l1loot-fx';overlay.innerHTML='<i class="fx-red"></i><i class="fx-cold"></i><i class="fx-gas"></i><i class="fx-flash"></i><i class="fx-match"></i><i class="fx-drunk"></i><i class="fx-smoke"></i>';(document.getElementById('game')||document.body).append(overlay);return overlay;}
 const cloudTex=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),r=g.createRadialGradient(32,32,2,32,32,31);r.addColorStop(0,'rgba(255,255,255,.9)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,64,64);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;})();
 function puff(x,z,color,n,r,y=.6){const grp=new T.Group();for(let i=0;i<n;i++){const s=new T.Sprite(new T.SpriteMaterial({map:cloudTex,color,transparent:true,opacity:.0,depthWrite:false}));const a=i*2.4,d=r*Math.sqrt((i+.5)/n);s.position.set(x+Math.cos(a)*d,y+(i%3)*.35,z+Math.sin(a)*d);s.scale.setScalar(1.4+(i%4)*.4);grp.add(s);}scene?.add(grp);return grp;}
 function spark(x,y,z){const s=new T.Sprite(new T.SpriteMaterial({map:cloudTex,color:0xffa030,transparent:true,blending:T.AdditiveBlending,depthWrite:false}));s.position.set(x,y,z);s.scale.setScalar(.35);scene?.add(s);return s;}
 function sfx(kind){const ctx=audio?.ctx;if(!ctx||!audio.master)return;if(kind==='chop'||kind==='crack'){const t=ctx.currentTime,len=kind==='crack'?.7:.22,buf=ctx.createBuffer(1,Math.floor(ctx.sampleRate*len),ctx.sampleRate),d=buf.getChannelData(0);for(let i=0;i<d.length;i++){const u=i/d.length;d[i]=kind==='chop'?(Math.random()*2-1)*Math.exp(-u*22)+Math.sin(i*.045)*Math.exp(-u*10)*.8:(Math.random()*2-1)*Math.exp(-u*4)*(Math.random()<.08?1.6:.5);}const s=ctx.createBufferSource(),gn=ctx.createGain(),f=ctx.createBiquadFilter();f.type=kind==='chop'?'lowpass':'bandpass';f.frequency.value=kind==='chop'?900:1800;gn.gain.value=kind==='chop'?.9:.6;s.buffer=buf;s.connect(f);f.connect(gn);gn.connect(audio.master);s.onended=()=>{s.disconnect();f.disconnect();gn.disconnect();};s.start(t);return;}
 const t=ctx.currentTime,len=kind==='boom'?1.6:kind==='hiss'?.25:kind==='creak'?.5:.18,buf=ctx.createBuffer(1,Math.floor(ctx.sampleRate*len),ctx.sampleRate),d=buf.getChannelData(0);
  for(let i=0;i<d.length;i++){const u=i/d.length;d[i]=(Math.random()*2-1)*(kind==='boom'?Math.exp(-u*5):kind==='creak'?Math.sin(i*.011*(1+u))*.6*(1-u):kind==='hiss'?.4:Math.exp(-u*14));}
  const s=ctx.createBufferSource(),gn=ctx.createGain(),f=ctx.createBiquadFilter();f.type=kind==='boom'?'lowpass':kind==='hiss'?'highpass':'bandpass';f.frequency.value=kind==='boom'?220:kind==='hiss'?3000:kind==='creak'?600:1400;
  gn.gain.value=kind==='boom'?1.1:kind==='hiss'?.06:.25;s.buffer=buf;s.connect(f);f.connect(gn);gn.connect(audio.master);s.onended=()=>{s.disconnect();f.disconnect();gn.disconnect();};s.start(t);}
 function hurt(n,why){state.health=Math.max(0,state.health-n);fx.lastHurt=.5;if(state.health<=0){state.health=35;fx.bleed=0;fx.toxic=0;const w=W();const L=w.landmarks?.[0]||{x:4,z:4},p=w.safe(L.x,L.z);Object.assign(state,{x:p.x,z:p.z});w.ensure(p.x,p.z);resetCameraRig();toast('你眼前一黑……醒来时躺在天鹰段的入口附近。（'+why+'）');}updateHUD();}
 function explode(x,z,src){sfx('boom');fx.flash=1;fx.shake=.6;const d=Math.hypot(state.x-x,state.z-z);if(d<5)hurt(Math.round(70*Math.max(0,1-d/5)),'爆炸');
  const p=puff(x,z,0x6a6460,10,1.6,.8);fx.clouds.push({x,z,r:2.4,t:5,grp:p,kind:'smoke'});
  for(const l of near){const c=rt(l);if(Math.hypot(l.x-x,l.z-z)<2.6&&l.id!==src?.l.id&&!c.open){c.lockDone=true;openCrate(c,true);}}
  for(const d of nearDoors){const r=doorRt(d);if(!r.broken&&Math.hypot(d.x-x,d.z-z)<3.2){doorMesh(r);breakDoor(r,true);}}
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
  for(const l of near){const c=rt(l);if(c.blown||behindLocked(l))continue;const dx=l.x-state.x,dz=l.z-state.z,dist=Math.hypot(dx,dz)-Math.max(l.w,l.d)/2;if(dist>1.5)continue;const dot=(dx*fwd.x+dz*fwd.z)/Math.max(.01,Math.hypot(dx,dz))/Math.max(.01,Math.hypot(fwd.x,fwd.z));if(dot<.35&&dist>.25)continue;const sc2=dist*.5-dot*2;if(sc2<bs){bs=sc2;best=c;}}return best;}
 function targetItem(c){if(!c.items.length)return null;camera.getWorldPosition(v);camera.getWorldDirection(fwd);let best=c.items[0],ba=-2;const w=new T.Vector3();
  for(const it of c.items){it.obj.getWorldPosition(w);w.y+=.03;w.sub(v).normalize();const a=w.dot(fwd);if(a>ba){ba=a;best=it;}}return best;}
 const MW={beer6:['罐','扎'],cola6:['罐','扎'],cigstack:['包','条'],six:['瓶','扎'],cantray:['罐','托'],blister:['节','卡'],matchbundle:['盒','捆'],gauze:['卷','捆'],yarnbundle:['团','捆']};
 const QUSE={beer:'左键 喝',cola:'左键 喝',cigarettes:'左键 抽一支',peacetin:'左键 抽一支',tvdinner:'左键 吃',tumbler:'左键 倒杏仁水喝',duck:'左键 捏',cassette:'左键 看标签',floppy:'左键 看标签',motelkey:'左键 看钥匙牌',snowglobe:'左键 摇一摇',teeth:'左键 上发条',pager:'左键 看消息',polaroid:'左键 看照片',can:'左键 吃',peas:'左键 吃',pineapple:'左键 吃',melon:'左键 吃',papaya:'左键 吃',bandage:'左键 包扎',soap:'左键 洗手',sanitizer:'左键 洗手',watch:'左键 看时间',matches:'左键 划一根',lighter:'左键 点火',dynamite:'左键 点燃扔出',squirt:'左键 喷射',berries:'左键 吃下',fuyou:'左键 感知',yarn:'左键 放线',junk:'左键 扔掉',foam:'左键 扔掉',glass:'左键 扔掉',nitrogen:'左键 丢在地上',note:'左键 读'};
 const HAZI={chemical:{kind:'chem',txt:'⚠ 有毒，别拧开。'},dynamite:{kind:'boom',txt:'⚠ 引信很短，别靠近火源。'},glass:{kind:'glass',txt:'⚠ 边缘锋利，小心划手。'},nitrogen:{kind:'cold',txt:'⚠ 极冷，会慢慢升华。'},berries:{kind:'odd',txt:''}};
 const NOTES=['纸条：“别跟着灯管嗡嗡声走。箱子里有水，但别碰贴骷髅的。——K”','纸条：“别跟着灯管嗡嗡声走。箱子里有水，但别碰贴骷髅的。——K”'];
 function itemVariant(id,meta){if(id==='almond')return meta?.kind?meta:almondVariant(meta?.id||'l1loot');if(id==='drink')return meta?.kind?meta:{kind:'vending',type:(meta?.v|0)%2?'can':'pet'};if(id==='soy')return {kind:'vending',type:'soy'};
  const name=itemTitle(id,meta)||(LOOT_ITEMS[id]||ITEMS[id])?.name||id,h=HAZI[id];let desc=ITEMS[id]?.desc||'';if(id==='note')desc=NOTES[(meta?.v|0)%2];
  const build=id==='flashlight'?(()=>{if(!FL)return makeLootModel('battery',{});const t=FL.createFlashlight117(T).torch;t.parent?.remove(t);t.position.set(0,0,0);t.rotation.set(0,0,0);return t;}):()=>makeLootModel(id,{...(meta||{})});
  return {kind:'object',id,name,desc,use:QUSE[id]||'',hazard:h?.kind||null,warn:h?.txt||'',build};}
 function packVariant(kind,members){const P=PACKS[kind];const ms=members.map((m,k)=>({...m,k}));return {kind:'object',id:P.id,pack:kind,name:P.name+(members.length<P.n?'（剩 '+members.length+'）':''),desc:P.desc,use:'',hazard:null,warn:'',build:()=>makeBundle(kind,ms,true)};}
 const wp=new T.Vector3();
 const has=id=>inventory.count(x=>x===id)>0;
 function lockInfo(c){if(c.open||c.lockDone||!c.roll.lock)return null;if(c.roll.lock===1)return has('knife')?{ok:true,txt:'E 用猎刀撬开钉死的木箱'}:has('axe')?{ok:true,txt:'E 用手斧撬开钉死的木箱'}:{ok:false,txt:'木箱被钉死了 · 需要小刀或斧头'};
  return has('axe')?{ok:true,txt:'E 用手斧砸开挂锁'}:{ok:false,txt:'铁皮箱上着挂锁 · 需要斧头'};}
 function bundleTarget(){if(!kit||state.level!==1||W().mode!=='halls')return false;const c=target();if(!c||!c.open)return false;const it=targetItem(c);return !!(it&&it.members.length>1&&MW[it.pack?.kind]);}
 function prompt(){if(!kit||state.level!==1||W().mode!=='halls')return null;const c=target(),dr=targetDoor();
  if(dr&&(!c||dr.dist<Math.hypot(c.l.x-state.x,c.l.z-state.z)))return has('axe')?'E 用手斧劈开被铁链锁住的门':'门被铁链锁住 · 需要斧头';
  if(!c)return null;let s;
  if(!c.open){const L=lockInfo(c);s=L?L.txt:CARTON.has(c.l.look)?'E 撕开纸箱胶带':TOTE.has(c.l.look)?'E 掀开塑料箱盖':'E 打开板条箱';
   if(c.roll.hazard&&inventory.selected()==='fuyou')s+=' · 福友玉在发烫（'+HAZ_TXT[c.roll.hazard]+'？）';}
  else{const it=targetItem(c),tot=c.items.reduce((a,u)=>a+u.members.length,0);if(!it)s='空箱子';else{const n=it.members.length,w=MW[it.pack?.kind];
   s=n>1&&w?'E 拿一'+w[0]+LOOT_ITEMS[it.id].name+' · 长按 E 整'+w[1]+'拿走（'+n+' '+w[0]+'）':'E 拿取 '+LOOT_ITEMS[it.id].name;if(tot>n)s+='（箱里还有 '+tot+' 件）';}}
  return s;}
 function use(opts){if(!kit||state.level!==1||W().mode!=='halls')return false;const c=target(),dr=targetDoor();
  if(dr&&(!c||dr.dist<Math.hypot(c.l.x-state.x,c.l.z-state.z))){if(!has('axe')){toast('门被铁链锁住了，链子穿过两个把手。需要一把斧头。');sfx('tick');return true;}doorMesh(dr.r);breakDoor(dr.r);toast('你抡起手斧朝门板劈下去——');return true;}
  if(!c)return false;
  if(!c.open){const L=lockInfo(c);if(L&&!L.ok){toast(L.txt+'。');sfx('tick');return true;}if(L)c.lockDone=true;openCrate(c);return true;}
  const it=targetItem(c);if(!it){toast('箱子已经空了。');return true;}
  if(c.roll.hazard==='glass'&&rng(c.l.id+':cut'+c.taken.size)()<.45){hurt(9,'碎玻璃');fx.bleed=Math.max(fx.bleed,22);toast('被碎玻璃划破了手——在流血！用纱布包扎。');}
  const takeMeta=m=>{const meta={...m.meta};if(m.id==='berries')Object.assign(meta,{lv:1,x:c.l.x+Math.sin(c.l.ry)*.9,z:c.l.z+Math.cos(c.l.ry)*.9});if(m.id==='nitrogen')meta.born=Date.now();if(m.id==='squirt')meta.ammo=6;if(m.id==='lighter')meta.fuel=100;if(m.id==='matches')meta.left=12;if(m.id==='yarn')meta.len=60;if(m.id==='sanitizer')meta.uses=4;
   if(m.id==='soy')Object.assign(meta,{kind:'vending',type:'soy'});if(m.id==='drink')Object.assign(meta,{kind:'vending',type:meta.type||((meta.v|0)%2?'can':'pet')});if(m.id==='cigarettes')meta.left=20;if(m.id==='peacetin')meta.left=50;return m.id==='almond'?almondVariant(m.meta.id):meta;};
  // V124c/V131-keys: E takes one item (the top one of a bundle), hold E the whole bundle; the bag splits it by stack caps
  const whole=!!opts?.whole&&it.members.length>1,pick=whole?it.members.slice():[it.members.at(-1)],pv=whole?packVariant(it.pack.kind,pick):null;it.obj.getWorldPosition(wp);
  let got=0,last=null;for(const m of pick){const meta=takeMeta(m);if(inventory.add(m.id,meta,1))break;got++;last={m,meta};c.taken.add(m.i);const o=it.obj.userData.objs?.get(m.i);if(o&&o!==it.obj){o.getWorldPosition(wp);o.parent?.remove(o);}it.members=it.members.filter(x=>x!==m);}
  if(!got){toast('背包满了，放不下 '+LOOT_ITEMS[it.id].name+'。');return true;}
  for(const w of it.obj.userData.wraps||[])w.visible=false;
  if(!it.members.length){it.obj.parent?.remove(it.obj);c.items=c.items.filter(x=>x!==it);}
  persist(c);audio?.chime?.();const nm=(!whole&&last&&itemTitle(last.m.id,last.meta))||LOOT_ITEMS[it.id].name;
  toast(whole?(got<pick.length?'背包只装得下 '+got+' 件 '+nm+'，其余留在箱里。':'整'+MW[it.pack.kind][1]+'拿走：'+got+' 件 '+nm+'，已按堆叠上限放进背包。'):'拿到了 '+nm+(it.id==='nitrogen'?'（会慢慢升华）':'')+'。');updateHUD();
  if(inspect)inspect(whole?pv:itemVariant(last.m.id,last.meta),wp.clone());return true;}
 // ---- using the selected item (left click) ----
 function useSelected(slot){const i=slot??inventory.sel,s=inventory.slots[i],id=s?.id;if(!id)return false;const meta=s.items.at(-1)||{};
  const eat=(txt,o)=>{inventory.take(i);for(const k in o)state[k]=Math.max(0,Math.min(100,state[k]+o[k]));audio?.chime?.();toast(txt);updateHUD();return true;};
  switch(id){
   case 'can':return eat(has('knife')?'用猎刀开罐，吃完了罐头。':'没有刀，硬撬开罐头吃了（恢复较少）。',{stamina:30,health:has('knife')?8:5,sanity:3});
   case 'peas':return eat('吃了一把干豌豆。',{stamina:8});
   case 'pineapple':return eat('吃了菠萝。',{hydration:18,health:6,sanity:6});
   case 'melon':return eat('吃了哈密瓜。',{hydration:20,health:5,sanity:5});
   case 'papaya':return eat('吃了木瓜。',{hydration:14,health:5});
   case 'bandage':fx.bleed=0;return eat('用纱布包扎好伤口。',{health:25});
   case 'soap':fx.toxic=0;return eat('洗干净了，化学污染已清除。',{sanity:4});
   case 'sanitizer':{fx.toxic=0;meta.uses=(meta.uses??4)-1;if(meta.uses<=0)inventory.take(i);toast('用了免洗洗手液，化学污染已清除。'+(meta.uses>0?'（还能用 '+meta.uses+' 次）':'（用完了）'));state.sanity=Math.min(100,state.sanity+2);updateHUD();return true;}
   case 'watch':{const t=Math.floor(state.elapsed||0),h=String(Math.floor(t/3600)).padStart(2,'0'),m=String(Math.floor(t/60)%60).padStart(2,'0'),sec=String(t%60).padStart(2,'0');toast('已探索 '+h+':'+m+':'+sec+'。');return true;}
   case 'charger':toast('暂时没有用处。');return true;
   case 'battery':toast('备用电池，暂时用不上。');return true;
   case 'knife':toast('猎刀：靠近钉死的木箱按 E 撬开。');return true;
   case 'axe':toast('手斧：能撬开钉死的木箱，也能砸开铁皮箱的挂锁。');return true;
   case 'junk':case 'foam':inventory.take(i);toast('扔掉了'+LOOT_ITEMS[id].name+'。');return true;
   case 'chemical':toast('有毒，不能喝。');return true;
   case 'glass':inventory.take(i);toast('把碎玻璃扔掉了。');return true;
   case 'nitrogen':inventory.take(i);fx.clouds.push({x:state.x,z:state.z,r:1,t:4,grp:puff(state.x,state.z,0xdfefff,5,.4,.2),kind:'cold-soft'});toast('把氮块丢在地上，它很快升华掉了。');return true;
   case 'matches':case 'lighter':{if(id==='matches'){meta.left=(meta.left??12)-1;if(meta.left<=0)inventory.take(i);}else{meta.fuel=(meta.fuel??100)-12;if(meta.fuel<=0){inventory.take(i);toast('打火机没气了。');return true;}}
    fx.match=id==='matches'?14:40;fx.matchMax=fx.match;sfx('tick');toast(id==='matches'?'划着了一根火柴。'+(meta.left>0?'（盒里还剩 '+meta.left+' 根）':'（最后一根）'):'点着了打火机。');return true;}
   case 'dynamite':{if(state.level!==1||W()?.mode!=='halls'){toast('炸药只能在 Level 1 使用。');return true;}if(!has('matches')&&!has('lighter')){toast('需要火柴或打火机才能点燃炸药。');return true;}inventory.take(i);camera.getWorldDirection(fwd);const fl=Math.hypot(fwd.x,fwd.z)||1,x=state.x+fwd.x/fl*3,z=state.z+fwd.z/fl*3;
    const o=makeLootModel('dynamite',{});o.position.set(x,0,z);scene?.add(o);fx.fuses.push({c:null,obj:o,t:3,x,z,spark:spark(x,.08,z)});sfx('hiss');toast('点燃引信扔了出去，3 秒后爆炸。');return true;}
   case 'note':toast(NOTES[(meta.v|0)%2]);return true;
   // ---- V130-B loot+ ----
   case 'beer':fx.drunk=Math.min(60,(fx.drunk||0)+22);return eat('喝了啤酒，有点头晕。',{hydration:10,sanity:12,stamina:-6});
   case 'cola':return eat('喝了可乐。',{hydration:20,stamina:25,sanity:4});
   case 'cigarettes':case 'peacetin':{if(!has('matches')&&!has('lighter')){toast('需要火柴或打火机。');return true;}
    const fire=inventory.slots.findIndex(x=>x?.id==='lighter'),mi=inventory.slots.findIndex(x=>x?.id==='matches');if(fire>=0){const lm=inventory.slots[fire].items.at(-1)||{};lm.fuel=(lm.fuel??100)-3;}else if(mi>=0){const mm=inventory.slots[mi].items.at(-1)||{};mm.left=(mm.left??12)-1;if(mm.left<=0)inventory.take(mi);}
    meta.left=(meta.left??(id==='peacetin'?50:20))-1;if(meta.left<=0)inventory.take(i);fx.smoke=6;sfx('tick');
    for(const[k,d]of Object.entries({sanity:10,health:-2,stamina:-5}))state[k]=Math.max(0,Math.min(100,state[k]+d));updateHUD();
    toast('点了一支烟。（还剩 '+Math.max(0,meta.left)+' 支）');return true;}
   case 'tvdinner':return eat('吃了电视晚餐。',{stamina:45,health:12,sanity:8,hydration:-3});
   case 'tumbler':{const a=inventory.slots.findIndex(x=>x&&(x.id==='almond'||x.id==='drink'));if(a<0){toast('背包里没有杏仁水。');return true;}inventory.take(a);state.bottles=inventory.drinks();
    for(const[k,d]of Object.entries({hydration:45,stamina:35,sanity:28}))state[k]=Math.min(100,state[k]+d);audio?.chime?.();updateHUD();toast('倒了一杯杏仁水喝完。');return true;}
   case 'duck':sfx('tick');state.sanity=Math.min(100,state.sanity+2);updateHUD();toast('捏了一下橡皮鸭。');return true;
   case 'cassette':toast('没有录音机，无法播放。');return true;
   case 'floppy':toast('没有电脑，无法读取。');return true;
   case 'motelkey':toast('钥匙牌：MOTEL OASIS · ROOM 13。');return true;
   case 'snowglobe':state.sanity=Math.min(100,state.sanity+4);updateHUD();toast('摇了摇水晶球。');return true;
   case 'teeth':sfx('tick');toast('上了发条，假牙走了几步。');return true;
   case 'pager':{const msgs=['0-0-0-1','1-0-1-7','3-1-7','S.O.S','07734（倒过来看）'];toast('寻呼机：「'+msgs[Math.floor(Math.random()*msgs.length)]+'」');return true;}
   case 'polaroid':toast('照片上是一条空荡的停车场走廊。');return true;
   case 'squirt':return squirt(i,meta);
   case 'berries':{inventory.take(i);const lv=meta.lv??1;if(lv!==1){toast('浆果的味道变了——什么也没发生。');return true;}fx.flash=.8;
    if(state.level!==1){toast('吃下迁跃浆果，传送回 Level 1。');enterOne?.(0,{x:meta.x,z:meta.z});return true;}
    const w=W(),p=w.safe(meta.x??state.x,meta.z??state.z);Object.assign(state,{x:p.x,z:p.z});w.ensure(p.x,p.z);resetCameraRig();toast('传送回第一次发现浆果的地方。');return true;}
   case 'fuyou':{const hz=near.map(rt).filter(c=>c.roll.hazard&&!c.open&&!c.blown).map(c=>Math.hypot(c.l.x-state.x,c.l.z-state.z)).sort((a,b)=>a-b)[0];
    toast(hz===undefined||hz>10?'10 米内没有危险。':'大约 '+Math.round(hz)+' 米内有危险的箱子。');return true;}
   case 'yarn':{if(state.level!==1||W()?.mode!=='halls'){toast('毛线只能在 Level 1 使用。');return true;}if(fx.yarn){endYarn();toast('剪断了毛线，线留在地上。');return true;}fx.yarn={meta,last:{x:state.x,z:state.z},pts:[new T.Vector3(state.x,.02,state.z)],line:null};toast('开始放线（再按 左键 剪断）。还剩 '+Math.round(meta.len??60)+' 米。');return true;}
  }
  return false;}
 function squirt(i,meta){if(!(meta.ammo>0)){const a=inventory.slots.findIndex(s=>s?.id==='almond');if(a<0){toast('滋水枪是空的，背包里也没有杏仁水。');return true;}inventory.take(a);meta.ammo=8;toast('把一瓶杏仁水灌进了储罐（8 发）。');return true;}
  meta.ammo--;camera.getWorldDirection(fwd);sfx('hiss');
  if(fwd.y>.82){state.hydration=Math.min(100,state.hydration+10);state.sanity=Math.min(100,state.sanity+3);toast('喝了一口杏仁水。');updateHUD();return true;}
  const fl=Math.hypot(fwd.x,fwd.z)||1;let hit=false;for(const f of fx.fuses){const dx=f.x-state.x,dz=f.z-state.z,d=Math.hypot(dx,dz);if(d<5&&(dx*fwd.x+dz*fwd.z)/fl/d>.8){f.dead=true;hit=true;toast('引信被浇灭了。');}}
  for(const c of fx.clouds){const dx=c.x-state.x,dz=c.z-state.z,d=Math.hypot(dx,dz);if(c.kind==='chem'&&d<5){c.t=Math.min(c.t,2.5);hit=true;toast('水雾压住了化学气体。');}}
  if(!hit)toast('喷出杏仁水。（还剩 '+meta.ammo+' 发）');
  const pts=new T.BufferGeometry(),n=60,arr=new Float32Array(n*3);for(let k=0;k<n;k++){const s=.4+k/n*4,j=(k%3-1)*.03;arr.set([state.x+fwd.x/fl*s+j,1.35+fwd.y*s-s*s*.06+j,state.z+fwd.z/fl*s-j],k*3);}pts.setAttribute('position',new T.BufferAttribute(arr,3));
  const p=new T.Points(pts,new T.PointsMaterial({color:0xd8eef6,size:.09,transparent:true,opacity:.85}));scene?.add(p);fx.clouds.push({x:0,z:0,r:0,t:.7,grp:p,kind:'spray'});return true;}
 // ---- V124b chained store-room doors in the 小径 dead ends (sites: level1-clusters.js → world.lockDoorsNear) ----
 // A wooden double door in a partition, chained through its handles. With the hand axe E chops it open: three blows
 // (leaves jolt, chips fly), then the splintered inner strips fall and the outer halves swing in on their hinges.
 const doors=new Map();let nearDoors=[],doorKit=null;const YKEY='bumpercrop.l1yarn.v124b';
 const doorKey=id=>'d:'+id,doorBroken=id=>!!saved[doorKey(id)]||!!doors.get(id)?.broken;
 function buildDoorKit(){const wd=W();const leafO=s=>wd.kitGeo((P,C,{box})=>{P(box,C.doorwood,s*.25,1.075,0,.5,2.13,.045);P(box,C.plyD||C.osbD,s*.25,.62,.03,.46,.12,.018);P(box,C.plyD||C.osbD,s*.25,1.62,.03,.46,.12,.018);for(const y of[.35,1.05,1.75])P(box,C.chrome,s*.005,y,0,.03,.12,.06);});
  const leafI=s=>wd.kitGeo((P,C,{box})=>{P(box,C.doorwood,0,0,0,.3,2.13,.045);P(box,C.plyD||C.osbD,0,-.43,.03,.26,.12,.018);P(box,C.plyD||C.osbD,0,.57,.03,.26,.12,.018);P(box,C.steelP,s*.08,-.03,.05,.035,.26,.05);P(box,C.steelP,s*.08,-.03,-.05,.035,.26,.05);});
  const chain=wd.kitGeo((P,C,{box})=>{for(let i=0;i<9;i++){const x=-.2+i*.05,y=.06+((i%2)?.03:-.03)+(Math.abs(x)>.12?-.05:0);P(box,C.chrome,x,y,.085,.05,.018,.018,0,0,(i%2?.6:-.6));}for(let i=0;i<4;i++)P(box,C.chrome,-.02+(i%2)*.04,-.02-i*.03,.09,.018,.035,.012);P(box,C.steelP,0,-.14,.095,.07,.085,.03);P(box,C.chrome,0,-.08,.095,.045,.04,.008);});
  const chip=wd.kitGeo((P,C,{box})=>P(box,C.doorwood,0,.006,0,.05,.012,.16));
  doorKit={lo:[leafO(1),leafO(-1)],li:[leafI(1),leafI(-1)],chain,chip};}
 function doorRt(d){let r=doors.get(d.id);if(r)return r;r={d,broken:!!saved[doorKey(d.id)],t:-1,grp:null,parts:null,chips:[]};doors.set(d.id,r);return r;}
 function doorMesh(r){if(r.grp||!scene)return;if(!doorKit)buildDoorKit();const d=r.d,M=W().lootMat,g=new T.Group();g.position.set(d.x,0,d.z);g.rotation.y=d.ry;
  const mk=(geo)=>{const m=new T.Mesh(geo,M);m.frustumCulled=false;return m;};
  const leaves=[1,-1].map((s,i)=>{const h=new T.Group();h.position.set(-s*.8,0,0);const o=mk(doorKit.lo[i]),n=mk(doorKit.li[i]);n.position.set(s*.65,1.075,0);h.add(o,n);g.add(h);return{h,o,n,s};});
  const ch=mk(doorKit.chain);ch.position.set(0,1,0);g.add(ch);r.grp=g;r.parts={leaves,ch};scene.add(g);if(r.broken)doorPose(r,1,true);}
 // a = 0 closed … 1 fully broken (static pose); used for the reload pose and the end of the animation
 function doorPose(r,a,final){const{leaves,ch}=r.parts,R=rng(r.d.id+':b');leaves.forEach((L,i)=>{L.h.rotation.y=L.s*a*(i?1.95:1.7);
   if(final){if(L.n.parent!==r.grp){L.h.remove(L.n);r.grp.add(L.n);}L.n.position.set(-L.s*.25+(R()-.5)*.3,.03,-.5-R()*.45);L.n.rotation.set(-Math.PI/2,0,(R()-.5)*2.4);}});
  if(final){ch.position.set((R()-.5)*.2,.03,.3);ch.rotation.set(-Math.PI/2,0,R()-.5);}}
 function dropDoor(r){if(r.grp){scene?.remove(r.grp);r.grp=null;r.parts=null;}for(const c of r.chips)scene?.remove(c.m);r.chips=[];}
 function chips(r,n){const d=r.d,R=Math.random;for(let i=0;i<n;i++){const m=new T.Mesh(doorKit.chip,W().lootMat);m.position.set(d.x+(R()-.5)*.5,.9+R()*.5,d.z+(R()-.5)*.5);m.rotation.set(R()*6,R()*6,R()*6);scene.add(m);
   r.chips.push({m,v:new T.Vector3(d.nx*(1+R()*1.6)+(R()-.5)*1.4,1+R()*1.6,d.nz*(1+R()*1.6)+(R()-.5)*1.4),w:new T.Vector3(R()*9,R()*9,R()*9),rest:false});}}
 function breakDoor(r,blast=false){if(r.broken||r.t>=0)return;r.t=blast?1.25:0;r.blast=blast;r.hits=blast?3:0;if(!blast){sfx('chop');chips(r,4);}}
 function finishDoor(r){r.broken=true;saved[doorKey(r.d.id)]={b:1};save();W().unsolid(r.d.x,r.d.z);sfx('crack');}
 function tickDoors(dt){for(const r of doors.values()){if(r.chips.length)for(const c of r.chips){if(c.rest)continue;c.v.y-=9.8*dt;c.m.position.addScaledVector(c.v,dt);c.m.rotation.x+=c.w.x*dt;c.m.rotation.y+=c.w.y*dt;if(c.m.position.y<=.012){c.m.position.y=.012;c.m.rotation.set(0,c.m.rotation.y,0);c.rest=true;}}
   if(r.t<0||!r.parts)continue;r.t+=dt;const{leaves,ch}=r.parts;
   if(r.t<1.25){const hit=Math.floor(r.t/.42);if(hit>r.hits){r.hits=hit;sfx('chop');chips(r,5);fx.shake=Math.max(fx.shake,.12);}const ph=(r.t%.42)/.42,j=Math.exp(-ph*9)*.05*(1+r.hits*.4);leaves.forEach(L=>{L.h.rotation.y=L.s*j*(r.hits%2?1:-1);});ch.rotation.z=Math.sin(r.t*30)*j*2;continue;}
   if(!r.split){r.split=true;finishDoor(r);chips(r,8);leaves.forEach(L=>{L.h.updateMatrixWorld();const wp=new T.Vector3(),wq=new T.Quaternion();L.n.getWorldPosition(wp);L.n.getWorldQuaternion(wq);L.h.remove(L.n);scene.add(L.n);L.n.position.copy(wp);L.n.quaternion.copy(wq);L.fall={v:new T.Vector3(-r.d.nx*1.2+(Math.random()-.5),.6,-r.d.nz*1.2+(Math.random()-.5)),w:(Math.random()-.5)*6};});ch.userData.v=0;}
   const a=Math.min(1,(r.t-1.25)/.7),e2=1-Math.pow(1-a,3);leaves.forEach((L,i)=>{L.h.rotation.y=L.s*e2*(i?1.95:1.7);const f=L.fall;if(f&&!f.rest){f.v.y-=9.8*dt;L.n.position.addScaledVector(f.v,dt);L.n.rotation.z+=f.w*dt;L.n.rotation.x+=L.s*dt*3;if(L.n.position.y<.03){L.n.position.y=.03;f.rest=true;L.n.rotation.set(-Math.PI/2,0,L.n.rotation.z);}}});
   ch.userData.v+=9.8*dt;ch.position.y=Math.max(.03,ch.position.y-ch.userData.v*dt);ch.position.z=Math.min(.3,ch.position.z+dt*.5);if(ch.position.y<=.2)ch.rotation.x=Math.max(-Math.PI/2,ch.rotation.x-dt*8);
   if(a>=1){r.t=-1;leaves.forEach(L=>{r.grp.attach?.(L.n);});}}}
 function targetDoor(){camera.getWorldDirection(fwd);let best=null,bd=1e9;for(const d of nearDoors){const r=doorRt(d);if(r.broken||r.t>=0)continue;const dx=d.x-state.x,dz=d.z-state.z,side=-(dx*d.nx+dz*d.nz);if(side<.05)continue;const dist=Math.hypot(dx,dz);if(dist>1.7)continue;
   const dot=(dx*fwd.x+dz*fwd.z)/Math.max(.01,dist)/Math.max(.01,Math.hypot(fwd.x,fwd.z));if(dot<.3&&dist>.5)continue;if(dist<bd){bd=dist;best=r;}}return best?{r:best,dist:bd}:null;}
 // the crates behind a still-chained door can't be reached through it
 const behindLocked=l=>{if(!l.id.startsWith('l1c:s'))return false;const id='l1d:'+l.id.slice(5).replace(/:\d+$/,'');return!doorBroken(id);};
 // ---- yarn trails, kept across reloads, drawn on the F map / minimap via world.setMapOverlay ----
 let yarnTrails=[];try{yarnTrails=JSON.parse(localStorage.getItem(YKEY)||'[]');}catch{}
 const saveYarn=()=>{try{yarnTrails=yarnTrails.slice(-16);localStorage.setItem(YKEY,JSON.stringify(yarnTrails));}catch{}};
 const yarnCol=v=>(v|0)%2?'#3fb7bf':'#f0b42a';let yarnLines=[];
 function restoreYarn3D(){for(const t of yarnTrails){if(t.p.length<2)continue;const L=new T.Line(new T.BufferGeometry().setFromPoints(t.p.map(([x,z])=>new T.Vector3(x,.02,z))),new T.LineBasicMaterial({color:t.c}));scene.add(L);yarnLines.push(L);}}
 function mapOverlay(ctx,sx,sz,scale,ox,oz,radius){const w=Math.max(1.6,.22*scale);ctx.lineCap='round';ctx.lineJoin='round';
  const draw=(pts,col)=>{if(pts.length<2)return;ctx.strokeStyle='rgba(0,0,0,.55)';ctx.lineWidth=w+1.6;ctx.beginPath();pts.forEach(([x,z],i)=>i?ctx.lineTo(sx(x),sz(z)):ctx.moveTo(sx(x),sz(z)));ctx.stroke();ctx.strokeStyle=col;ctx.lineWidth=w;ctx.stroke();
   const[x0,z0]=pts[0];ctx.fillStyle=col;ctx.beginPath();ctx.arc(sx(x0),sz(z0),w*1.4+1,0,Math.PI*2);ctx.fill();};
  for(const t of yarnTrails)if(t.p.some(([x,z])=>Math.abs(x-ox)<radius&&Math.abs(z-oz)<radius))draw(t.p,t.c);
  if(fx.yarn)draw([...fx.yarn.pts.map(v=>[v.x,v.z]),[state.x,state.z]],yarnCol(fx.yarn.meta.v));
  for(const d of W().lockDoorsNear?.(ox,oz,radius)||[]){const br=doorBroken(d.id),ax=d.nx===0,L=1.6*scale,t=Math.max(2,.25*scale);ctx.fillStyle=br?'#8a6a44':'#c0392b';if(ax)ctx.fillRect(sx(d.x)-L/2,sz(d.z)-t/2,L,t);else ctx.fillRect(sx(d.x)-t/2,sz(d.z)-L/2,t,L);
   if(!br&&scale>2.5){ctx.fillStyle='#f3e3a0';ctx.fillRect(sx(d.x)-1.5,sz(d.z)-1.5,3,3);}}}
 // ---- per frame ----
 let n2T=0;
 function update(dt){const inL1=state.level===1&&W()?.mode==='halls';
  if(!kit&&inL1&&W())buildKit();
  if(kit)for(const k of kit){const v=inL1;k.body.visible=v&&k.body.count>0;k.parts.forEach(p=>p.im.visible=v&&p.im.count>0);}
  // V124b: away from Level 1 the crates/clouds/doors are dropped but bleeding, poison, cold, a burning match and subliming nitrogen keep their clocks
  if(!inL1){if(!away){away=true;leaveL1();}fxTick(dt,false);return;}away=false;if(!kit)return;
  if(!yarnUp){yarnUp=true;restoreYarn3D();W().setMapOverlay?.(mapOverlay);}
  if(fill)fill.intensity=.12+.45*(W().power??1);
  checkT-=dt;let doorScan=false;if(checkT<=0){checkT=.4;doorScan=true;const list=W().lootNear(state.x,state.z,26);const key=list.map(l=>l.id).join('|');
   if(key!==nearKey||Math.hypot(anchor.x-state.x,anchor.z-state.z)>400){nearKey=key;near=list;anchor={x:Math.round(state.x),z:Math.round(state.z)};
    const ids=new Set(list.map(l=>l.id));for(const[id,c]of live)if(!ids.has(id)){dropContents(c);live.delete(id);}for(const l of list){const c=rt(l);if(c.open&&!c.blown)spawnContents(c);if(c.blown){wreck(c);W().unsolid(l.x,l.z);}}writeInstances();}}
  if(doorScan){nearDoors=W().lockDoorsNear?.(state.x,state.z,26)||[];const ids=new Set(nearDoors.map(d=>d.id));for(const[id,r]of doors)if(!ids.has(id)&&r.t<0){dropDoor(r);doors.delete(id);}for(const d of nearDoors){const r=doorRt(d);doorMesh(r);if(r.broken&&!r.uns){r.uns=W().unsolid(d.x,d.z)||true;}}}
  tickDoors(dt);
  let anim=false;for(const l of near){const c=live.get(l.id);if(c&&c.open&&c.lidA<1){c.lidA=Math.min(1,c.lidA+dt*1.8);anim=true;}}if(anim)writeInstances();
  // hazards
  const o=ov();for(const c of fx.clouds){c.t-=dt;c.age=(c.age||0)+dt;const fade=c.kind==='spray'?Math.min(1,c.t*3):Math.min(1,c.t/1.5)*Math.min(1,c.age/.6);c.grp.traverse(s=>{if(s.material)s.material.opacity=(c.kind==='spray'?.8:c.kind==='chem'?.38:.5)*Math.max(0,fade);});c.grp.position.y=c.kind==='spray'?0:(c.age||0)*.05;
   if(c.kind==='chem'&&Math.hypot(state.x-c.x,state.z-c.z)<c.r&&c.t>0){state.health=Math.max(1,state.health-dt*4.5);state.sanity=Math.max(0,state.sanity-dt*2);fx.toxic=Math.max(fx.toxic,20);fx.gasIn=.4;}}
  fx.clouds=fx.clouds.filter(c=>{if(c.t>0)return true;scene?.remove(c.grp);c.grp.traverse(s=>{s.geometry?.dispose?.();s.material?.dispose?.();});return false;});
  for(const f of fx.fuses){if(f.spark){f.spark.scale.setScalar(.2+Math.random()*.35);f.spark.material.opacity=f.dead?0:1;if(f.dead){scene?.remove(f.spark);f.spark=null;}}if(f.dead)continue;f.t-=dt;if(Math.random()<dt*14)sfx('hiss');if(f.t<=0){f.dead=true;f.obj&&scene?.remove(f.obj);explode(f.x,f.z,f.c);}}fx.fuses=fx.fuses.filter(f=>{if(!f.dead)return true;if(f.spark)scene?.remove(f.spark);if(f.obj)scene?.remove(f.obj);return false;});
  // 福友玉 glow while held, brighter near unopened hazards
  if(inventory.selected()==='fuyou'){const hz=near.map(rt).filter(c=>c.roll.hazard&&!c.open&&!c.blown).map(c=>Math.hypot(c.l.x-state.x,c.l.z-state.z)).sort((a,b)=>a-b)[0];o.classList.toggle('fuyou',true);o.style.setProperty('--fy',String(hz===undefined?.15:Math.max(.15,1-hz/9)));}else o.classList.remove('fuyou');
  // yarn trail
  if(fx.yarn){const y=fx.yarn,d=Math.hypot(state.x-y.last.x,state.z-y.last.z);if(d>1.2){y.meta.len=(y.meta.len??60)-d;y.last={x:state.x,z:state.z};y.pts.push(new T.Vector3(state.x,.02,state.z));if(y.line){scene.remove(y.line);y.line.geometry.dispose();}
    y.line=new T.Line(new T.BufferGeometry().setFromPoints(y.pts),new T.LineBasicMaterial({color:(y.meta.v|0)%2?0x2a8a90:0xd8a420}));scene.add(y.line);
    if(y.meta.len<=0){const k=inventory.slots.findIndex(s=>s?.id==='yarn');if(k>=0)inventory.take(k);endYarn();toast('一团毛线放完了。');}}}
  fxTick(dt,true);
 }
 function fxTick(dt,inL1){const o=ov();
  if(fx.bleed>0){fx.bleed-=dt;state.health=Math.max(1,state.health-dt*.55);}
  if(fx.toxic>0){fx.toxic-=dt;state.sanity=Math.max(0,state.sanity-dt*.25);}
  if(fx.cold>0){fx.cold-=dt;state.stamina=Math.min(state.stamina,8);}
  fx.gasIn=Math.max(0,(fx.gasIn||0)-dt);fx.flash=Math.max(0,fx.flash-dt*1.6);fx.lastHurt=Math.max(0,fx.lastHurt-dt);
  o.querySelector('.fx-red').style.opacity=String(Math.min(.85,(fx.bleed>0?.25+.2*Math.sin(performance.now()/260):0)+fx.lastHurt));o.querySelector('.fx-cold').style.opacity=String(Math.min(.6,fx.cold/8));
  fx.drunk=Math.max(0,(fx.drunk||0)-dt);fx.smoke=Math.max(0,(fx.smoke||0)-dt);o.querySelector('.fx-drunk').style.opacity=String(Math.min(.9,fx.drunk/20)*(.75+.25*Math.sin(performance.now()/700)));o.querySelector('.fx-smoke').style.opacity=String(Math.min(.7,fx.smoke/6));
  o.querySelector('.fx-gas').style.opacity=String(Math.min(.7,fx.gasIn*1.6+(fx.toxic>0?.08:0)));o.querySelector('.fx-flash').style.opacity=String(fx.flash);
  if(inL1){if(fx.match>0){fx.match-=dt;camera.getWorldPosition(v);camera.getWorldDirection(fwd);const fl=.9+.25*Math.sin(performance.now()/47)+.12*Math.sin(performance.now()/13);W().setHandLight(Math.min(1,fx.match/2)*fl*6,v.clone().addScaledVector(fwd,.35).add(new T.Vector3(0,-.15,0)),fwd);}else W().setHandLight(0);}
  else{if(fx.match>0)fx.match-=dt;const fm=fx.match>0?Math.min(1,fx.match/2)*(.85+.15*Math.sin(performance.now()/47)):0;o.querySelector('.fx-match').style.opacity=String(fm);}
  if(inL1)o.querySelector('.fx-match').style.opacity='0';else o.classList.remove('fuyou');
  // solid nitrogen sublimates in the bag
  n2T-=dt;if(n2T<=0){n2T=2;for(let k=0;k<inventory.slots.length;k++){const s=inventory.slots[k];if(s?.id!=='nitrogen')continue;const m=s.items[0];if(m?.born&&Date.now()-m.born>150000){inventory.take(k);toast('一块固态氮在背包里升华光了。');break;}}}
 }
 let away=false,yarnUp=false;
 function endYarn(){const y=fx.yarn;if(!y)return;fx.yarn=null;if(y.line)yarnLines.push(y.line);if(y.pts.length>1){yarnTrails.push({c:yarnCol(y.meta.v),p:y.pts.map(v=>[Math.round(v.x*10)/10,Math.round(v.z*10)/10])});saveYarn();}}
 function leaveL1(){for(const c of live.values())dropContents(c);for(const c of fx.clouds){scene?.remove(c.grp);}fx.clouds=[];for(const f of fx.fuses){if(f.spark)scene?.remove(f.spark);if(f.obj)scene?.remove(f.obj);}fx.fuses=[];endYarn();
  for(const r of doors.values()){if(r.t>=0&&!r.broken)finishDoor(r);r.t=-1;dropDoor(r);}doors.clear();nearDoors=[];nearKey='';W()?.setHandLight?.(0);}
 function stats(){return{near:near.length,live:live.size,open:[...live.values()].filter(c=>c.open).length,drawCalls:kit?kit.reduce((a,k)=>a+(k.body.visible?1:0)+k.parts.filter(p=>p.im.visible).length,0):0};}
 async function prewarm(renderer){if(!kit&&W())buildKit();if(!kit)return;await ready;}
 function useInspected(v){if(!v||v.kind!=='object'||v.pack||!v.use)return false;let i=inventory.slots[inventory.sel]?.id===v.id?inventory.sel:inventory.slots.findIndex(x=>x?.id===v.id);if(i<0)return false;
  const before=inventory.count(x=>x===v.id);const r=useSelected(i);return r?{consumed:inventory.count(x=>x===v.id)<before}:false;}
 function inspectSelected(){if(!inspect)return false;const s=inventory.slots[inventory.sel];if(!s)return false;const v=itemVariant(s.id,s.items.at(-1));if(!v)return false;inspect(v,null);return true;}
 return{bundleTarget,useInspected,inspectSelected,itemVariant,packVariant,reset:(l)=>{const c=live.get(l.id);if(c)dropContents(c);live.delete(l.id);delete saved[l.id];nearKey='';},force:(l,th)=>{const c=rt(l);c.roll=rollCrate(l,th);return c.roll;},update,prompt,use,useSelected,stats,prewarm,rollCrate,get near(){return near;},live,fx,target,openCrate:(c,f)=>openCrate(c,f),spawnContents,rt,doors,get nearDoors(){return nearDoors;},targetDoor,doorRt,doorMesh,breakDoor,doorBroken,get yarnTrails(){return yarnTrails;},endYarn,mapOverlay,fxTick};
}
