// V131-keys · one keymap for every level (AAA / survival-horror FPS conventions), rebindable, saved in localStorage.
// main.js reads it through globalThis.__bcKeys131 (installed below) so other modules need no import.
// Mouse: left = use the item in hand, right = inspect it (empty hand: hold to zoom). 1–9 / wheel = hotbar. Esc = pause.
const STORE='bumpercrop.keys131',SEEN='bumpercrop.keys131.seen';
export const ACTIONS=[
 {id:'forward',name:'前进',def:['KeyW','ArrowUp'],hold:'KeyW'},
 {id:'back',name:'后退',def:['KeyS','ArrowDown'],hold:'KeyS'},
 {id:'left',name:'左移',def:['KeyA','ArrowLeft'],hold:'KeyA'},
 {id:'right',name:'右移',def:['KeyD','ArrowRight'],hold:'KeyD'},
 {id:'sprint',name:'冲刺（按住）',def:['ShiftLeft','ShiftRight'],hold:'ShiftLeft'},
 {id:'crouch',name:'蹲下（按住）',def:['KeyC',''],hold:'KeyC'},
 {id:'jump',name:'跳跃',def:['Space','']},
 {id:'interact',name:'交互 / 拾取 / 开箱（长按整扎拿）',def:['KeyE','']},
 {id:'flashlight',name:'手电筒 开 / 关',def:['KeyF','']},
 {id:'inventory',name:'背包',def:['Tab','KeyI']},
 {id:'map',name:'地图',def:['KeyM','']},
 {id:'journal',name:'层级档案',def:['KeyJ','']},
 {id:'drop',name:'丢弃手中物品',def:['KeyG','']},
 {id:'zoom',name:'拉近镜头（按住）',def:['KeyZ',''],hold:'KeyZ'},
 {id:'hud',name:'隐藏仪表（Level 1）',def:['KeyH','']},
 {id:'help',name:'按键说明',def:['F1','']},
 {id:'fullscreen',name:'全屏',def:['F10','']},
];
const FIXED=[['鼠标','环顾'],['左键','使用手中物品（喝 / 吃 / 点火 / 扔）'],['右键','检视手中物品 · 空手时按住拉近'],['1 – 9 / 滚轮','切换快捷栏'],['Esc','暂停菜单 · 收起检视 / 背包'],['检视中','移动鼠标旋转 · 滚轮远近 · E / 右键 收起']];
const RESERVED=new Set(['Escape','F2','F5','F11','F12','Digit1','Digit2','Digit3','Digit4','Digit5','Digit6','Digit7','Digit8','Digit9','MetaLeft','MetaRight']);
const byId=Object.fromEntries(ACTIONS.map(a=>[a.id,a]));
let map=load();
function load(){const m={};for(const a of ACTIONS)m[a.id]=a.def.slice();try{const s=JSON.parse(localStorage.getItem(STORE)||'null');if(s)for(const a of ACTIONS)if(Array.isArray(s[a.id]))m[a.id]=[String(s[a.id][0]||''),String(s[a.id][1]||'')];}catch{}return m;}
function save(){try{localStorage.setItem(STORE,JSON.stringify(map));}catch{}rebuild();refreshAll();}
let canonMap=new Map();
function rebuild(){canonMap=new Map();for(const a of ACTIONS){if(!a.hold)continue;for(const d of a.def)if(d)canonMap.set(d,'X131-'+d);}
 for(const a of ACTIONS){if(!a.hold)continue;for(const c of map[a.id])if(c)canonMap.set(c,a.hold);}}
rebuild();
const NAMES={Space:'空格',Tab:'Tab',Escape:'Esc',Enter:'Enter',Backspace:'Backspace',ShiftLeft:'Shift',ShiftRight:'右 Shift',ControlLeft:'Ctrl',ControlRight:'右 Ctrl',AltLeft:'Alt',AltRight:'右 Alt',CapsLock:'Caps',ArrowUp:'↑',ArrowDown:'↓',ArrowLeft:'←',ArrowRight:'→',Backquote:'`',Minus:'-',Equal:'=',BracketLeft:'[',BracketRight:']',Backslash:'\\',Semicolon:';',Quote:"'",Comma:',',Period:'.',Slash:'/'};
export function keyName(code){if(!code)return '—';if(NAMES[code])return NAMES[code];let m=/^Key([A-Z])$/.exec(code);if(m)return m[1];m=/^Digit(\d)$/.exec(code);if(m)return m[1];m=/^Numpad(.+)$/.exec(code);if(m)return '小键盘 '+m[1];return code;}
export function is(e,id){const b=map[id];return !!b&&!!e.code&&(b[0]===e.code||b[1]===e.code);}
export function label(id){const b=map[id];if(!b)return '';return keyName(b[0]||b[1]);}
/** keyboard code → the code main.js polls for held actions (movement/sprint/crouch/zoom); unbound defaults become inert */
export function canon(code){return canonMap.get(code)||code;}
function changed(){return ACTIONS.filter(a=>(map[a.id][0]||'')!==a.def[0]);}
/** rewrite default key letters in hint text when the player rebound them (no-op on the default layout) */
export function fmt(text){const ch=changed();if(!ch.length||!text)return text;let t=text;
 for(const a of ch){const from=keyName(a.def[0]),to=label(a.id);if(!from||from===to)continue;const esc=from.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  t=t.replace(new RegExp('(^|[\\s·（(，。、：/「])'+esc+'(?=[\\s/、，。·）)」]|$)','g'),'$1\u2063'+to);}
 return t.replace(/\u2063/g,'');}
// ---- live hint rewriting (prompts / toasts from any module) ----
let observing=false;function watch(){if(observing||typeof MutationObserver==='undefined')return;observing=true;
 const fix=el=>{if(!el||!changed().length)return;const t=el.textContent,n=fmt(t);if(n!==t)el.textContent=n;};
 const mo=new MutationObserver(recs=>{for(const r of recs){const el=r.target.nodeType===3?r.target.parentElement:r.target;const host=el?.closest?.('#toast,#interact');if(host)fix(host);}});
 const attach=()=>{for(const id of ['toast','interact']){const el=document.getElementById(id);if(el&&!el.__k131){el.__k131=1;mo.observe(el,{childList:true,characterData:true,subtree:true});}}};attach();setInterval(attach,2000);}
function refreshAll(root=document){for(const el of root.querySelectorAll?.('[data-k131]')||[])el.textContent=label(el.dataset.k131);}
// ---- Esc menu page: 按键说明 (rebinding) ----
let waiting=null;
function css(){if(document.getElementById('k131-css'))return;const s=document.createElement('style');s.id='k131-css';s.textContent=`
.controls-list.k131{display:block!important;columns:auto!important;grid-template-columns:none!important}
.k131{font-family:Vonwaon16,Vonwaon12,monospace;font-size:16px;line-height:1.35;max-height:min(64vh,620px);overflow:auto;padding-right:4px}
.k131 h3{font:inherit;font-size:16px;margin:10px 0 4px;opacity:.75}
.k131-row{display:grid;grid-template-columns:1fr 92px 92px;gap:6px;align-items:center;padding:3px 0;border-bottom:1px dashed rgba(127,127,127,.35)}
.k131-row.fixed{grid-template-columns:150px 1fr}
.k131 button.k131-b{font:inherit;font-size:15px;min-height:26px;padding:1px 6px;cursor:pointer}
.k131 button.k131-b.wait{outline:2px solid #e2b04a;animation:k131b .6s steps(2) infinite}
@keyframes k131b{50%{opacity:.45}}
.k131-kv{display:inline-block;min-width:22px;padding:0 5px;border:1px solid currentColor;border-radius:2px;text-align:center}
.k131-foot{display:flex;gap:8px;justify-content:space-between;align-items:center;margin-top:8px}
.k131-msg{opacity:.8;font-size:14px}
#k131-note{position:fixed;left:50%;top:14%;transform:translateX(-50%);z-index:60;max-width:min(92vw,620px);background:#141210;color:#f2e6c4;border:2px solid #e2b04a;padding:12px 16px;font-family:Vonwaon16,Vonwaon12,monospace;font-size:16px;line-height:1.5;box-shadow:0 6px 0 rgba(0,0,0,.5);pointer-events:auto}
#k131-note b{color:#e2b04a;font-weight:normal}
#k131-note .k131-x{float:right;margin-left:12px;font:inherit;cursor:pointer;background:#e2b04a;color:#141210;border:0;padding:0 8px}
`;document.head.append(s);}
export function mountControls(modal){if(!modal)return;css();const list=modal.querySelector('.controls-list')||modal.querySelector('.panel');if(!list)return;
 const note=modal.querySelector('.panel-note');if(note)note.textContent='点击右侧按键可改键（Esc 取消），设置自动保存。触屏：左侧摇杆移动，右侧滑动观察。';
 const h2=modal.querySelector('h2');if(h2)h2.textContent='按键说明';
 const render=msg=>{list.className='controls-list k131';list.innerHTML='<h3>键盘（可改键）</h3>'+ACTIONS.map(a=>`<div class="k131-row"><span>${a.name}</span>${[0,1].map(k=>`<button type="button" class="k131-b" data-a="${a.id}" data-k="${k}">${keyName(map[a.id][k])}</button>`).join('')}</div>`).join('')+
  '<h3>鼠标与固定按键</h3>'+FIXED.map(([k,v])=>`<div class="k131-row fixed"><span class="k131-kv">${k}</span><span>${v}</span></div>`).join('')+
  `<div class="k131-foot"><span class="k131-msg">${msg||''}</span><button type="button" class="k131-b" data-reset>恢复默认</button></div>`;};
 render();
 list.onclick=e=>{const b=e.target.closest('button.k131-b');if(!b)return;e.stopPropagation();if(b.hasAttribute('data-reset')){for(const a of ACTIONS)map[a.id]=a.def.slice();save();render('已恢复默认按键。');return;}
  waiting={a:b.dataset.a,k:Number(b.dataset.k),render};list.querySelectorAll('.k131-b').forEach(x=>x.classList.remove('wait'));b.classList.add('wait');b.textContent='按下新键…';};
 if(!modal.__k131){modal.__k131=1;addEventListener('keydown',e=>{if(!waiting)return;e.preventDefault();e.stopImmediatePropagation();const w=waiting;waiting=null;
  if(e.code==='Escape'){w.render('已取消。');return;}
  if(e.code==='Backspace'||e.code==='Delete'){map[w.a][w.k]='';save();w.render('已清除。');return;}
  if(RESERVED.has(e.code)){w.render(keyName(e.code)+' 是保留键，不能绑定。');return;}
  const old=map[w.a][w.k];let msg='已设为 '+keyName(e.code)+'。';
  for(const a of ACTIONS)for(const k of [0,1])if(map[a.id][k]===e.code&&!(a.id===w.a&&k===w.k)){map[a.id][k]=old;msg+=' 原先的「'+a.name+'」改为 '+keyName(old)+'。';}
  map[w.a][w.k]=e.code;save();w.render(msg);},true);}
}
// ---- one-time notice of the new layout ----
export function onboard(){try{if(localStorage.getItem(SEEN))return;localStorage.setItem(SEEN,'1');}catch{return;}css();
 const d=document.createElement('div');d.id='k131-note';
 d.innerHTML='<button class="k131-x" type="button">知道了</button>按键已统一调整：<br><b>E</b> 交互 / 拾取（长按整扎拿走） · <b>F</b> 手电筒 · <b>M</b> 地图 · <b>Tab</b> 背包<br><b>左键</b> 使用手中物品 · <b>右键</b> 检视 · <b>G</b> 丢弃 · <b>H</b> 隐藏仪表<br>旧的 Q / R / L 不再使用。完整列表与改键：<b>F1</b> 或 Esc 菜单「按键说明」。';
 const close=()=>{d.remove();removeEventListener('keydown',k,true);};const k=e=>{if(is(e,'help'))close();};
 d.querySelector('.k131-x').onclick=close;addEventListener('keydown',k,true);(document.getElementById('game')||document.body).append(d);setTimeout(close,25000);}
export const keys131={ACTIONS,is,label,canon,fmt,keyName,mountControls,onboard,refresh:refreshAll,get map(){return map;}};
globalThis.__bcKeys131=keys131;
if(typeof document!=='undefined'){if(document.readyState==='loading')addEventListener('DOMContentLoaded',watch);else watch();}
