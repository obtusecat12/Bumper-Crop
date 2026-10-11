// V117 · shared inventory (all levels): Minecraft-style 9-slot hotbar + 27-slot backpack, always Backrooms yellow.
// A stack holds an array of per-unit meta objects (e.g. an almond-water variant), so pickups keep their identity.
// Keys: 1–9 / mouse wheel select the hotbar slot, I opens the backpack; in the backpack drag & drop to move / swap /
// merge, Shift+click quick-moves between hotbar and backpack, right-drag... (kept simple: right click splits half).
export const ITEMS={
 almond:{name:'杏仁水',max:4,drink:true,desc:'恢复水分、体力与理智。'},
 drink:{name:'饮料',max:6,drink:true,desc:'售货机饮料。'},
 can:{name:'罐头',max:16,desc:'密封的罐头食品。'},
 battery:{name:'电池',max:8,desc:'1.5 V 电池，手电筒用。'},
 flashlight:{name:'手电筒',max:1,desc:'点击开关；装电池延长续航。'},
 note:{name:'纸条',max:32,desc:'别人留下的字条。'},
};
const HOT=9,BAG=27;
const TAU=Math.PI*2;
// ---------- procedural icons (32×32 design px, drawn at 2× then pixelated by CSS) ----------
function icon(id,meta){const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');g.scale(2,2);g.imageSmoothingEnabled=false;
 const R=(x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(x,y,w,h);};
 if(id==='almond'){R(12,4,8,3,'#d9d2b0');R(13,7,6,3,'#c8c0a0');R(9,10,14,19,'#e9f2f4');R(9,10,2,19,'#ffffff');R(21,10,2,19,'#b9c8cc');R(10,15,12,8,'#e2b04a');R(11,16,10,1,'#f6d27a');R(12,18,8,3,'#7a4e1c');R(10,27,12,2,'#c9d6da');}
 else if(id==='drink'){const col=['#d8302a','#2a6ad8','#3aa64a','#e0a020'][(meta?.type|0)%4];R(10,5,12,24,col);R(10,5,12,3,'#d8dde0');R(10,26,12,3,'#a8b0b4');R(11,8,3,18,'#ffffff55');R(14,13,6,6,'#ffffffcc');}
 else if(id==='can'){R(8,8,16,18,'#b8bcc0');R(8,8,16,3,'#e0e4e8');R(8,23,16,3,'#8a8e92');R(8,12,16,10,'#c4402a');R(11,14,10,6,'#f2e2b0');R(9,11,2,14,'#ffffff40');}
 else if(id==='battery'){R(12,4,8,3,'#c8ccd0');R(9,7,14,22,'#1d1d1d');R(9,7,14,9,'#d4a017');R(10,8,3,20,'#ffffff30');R(14,19,4,1,'#ddd');R(15,18,2,3,'#ddd');}
 else if(id==='flashlight'){g.save();g.translate(16,16);g.rotate(-.78);R(-4,-14,8,7,'#3a3d40');R(-5,-15,10,2,'#9aa0a6');R(-3,-7,6,19,'#2b2e31');for(let i=-5;i<10;i+=3)R(-3,i,6,1,'#45494d');R(-1,-4,2,3,'#c8302a');R(-4,-15,8,1,'#fff6c8');g.restore();}
 else if(id==='note'){R(8,6,16,20,'#efe8cf');R(8,6,16,2,'#d8cfae');for(let y=11;y<24;y+=3)R(10,y,12,1,'#8a8270');R(13,4,6,3,'#d8c46a80');}
 else{R(8,8,16,16,'#888');}
 return c.toDataURL();}
const iconCache=new Map();const iconUrl=(id,meta)=>{const k=id+':'+(id==='drink'?(meta?.type|0)%4:0);if(!iconCache.has(k))iconCache.set(k,icon(id,meta));return iconCache.get(k);};

export function createInventory117({onChange=()=>{},toast=()=>{}}={}){
 const slots=Array.from({length:HOT+BAG},()=>null);let sel=0,open=false,drag=null,root=null,bar=null,bag=null,ghost=null;
 const max=id=>ITEMS[id]?.max??64;
 function add(id,meta=null,n=1){let left=n;
  for(let pass=0;pass<2&&left>0;pass++)for(let i=0;i<slots.length&&left>0;i++){const s=slots[i];
   if(pass===0&&s&&s.id===id&&s.items.length<max(id)){while(left>0&&s.items.length<max(id)){s.items.push(meta);left--;}}
   if(pass===1&&!s){slots[i]={id,items:[]};const t=slots[i];while(left>0&&t.items.length<max(id)){t.items.push(meta);left--;}}}
  render();onChange();return left;}
 const count=pred=>slots.reduce((a,s)=>a+(s&&pred(s.id)?s.items.length:0),0);
 function take(i){const s=slots[i];if(!s)return null;const m=s.items.pop();if(!s.items.length)slots[i]=null;render();onChange();return{id:s.id,meta:m};}
 // drink: the selected slot first when it holds a drink, otherwise the last drink stack found
 function takeDrink(){if(slots[sel]&&ITEMS[slots[sel].id]?.drink)return take(sel)?.meta;for(let i=slots.length-1;i>=0;i--)if(slots[i]&&ITEMS[slots[i].id]?.drink)return take(i)?.meta;return undefined;}
 function peekDrink(){const f=i=>slots[i]&&ITEMS[slots[i].id]?.drink?slots[i].items.at(-1):undefined;if(f(sel)!==undefined)return f(sel);for(let i=slots.length-1;i>=0;i--){const v=f(i);if(v!==undefined)return v;}return undefined;}
 const drinks=()=>count(id=>!!ITEMS[id]?.drink);
 const selected=()=>slots[sel]?.id||null;
 function select(i){sel=((i%HOT)+HOT)%HOT;render();onChange();}
 // ---------- DOM ----------
 function cell(i){const s=slots[i],d=document.createElement('div');d.className='inv-slot'+(i===sel&&i<HOT?' sel':'');d.dataset.i=i;
  if(s){d.innerHTML=`<img src="${iconUrl(s.id,s.items[0])}" alt="" draggable="false">${s.items.length>1?`<b>${s.items.length}</b>`:''}`;d.title=ITEMS[s.id]?.name+' · '+s.items.length+'/'+max(s.id);}
  return d;}
 function ensure(){if(root&&root.isConnected)return;root=document.createElement('div');root.className='inv117';root.innerHTML='<div class="inv-bag" hidden><div class="inv-panel"><div class="inv-title">背包 <small>I 关闭 · 拖拽移动 · Shift+点击 快速移动 · 右键拆半</small></div><div class="inv-grid inv-main"></div><div class="inv-sep"></div><div class="inv-grid inv-hot2"></div><div class="inv-info"></div></div></div><div class="inv-bar"></div><div class="inv-name"></div>';
  (document.getElementById('game')||document.body).append(root);bar=root.querySelector('.inv-bar');bag=root.querySelector('.inv-bag');
  bag.addEventListener('pointerdown',down);bag.addEventListener('contextmenu',e=>e.preventDefault());addEventListener('pointermove',move);addEventListener('pointerup',up);}
 let nameT=0;
 function render(){ensure();bar.replaceChildren(...Array.from({length:HOT},(_,i)=>cell(i)));
  if(open){root.querySelector('.inv-main').replaceChildren(...Array.from({length:BAG},(_,k)=>cell(HOT+k)));root.querySelector('.inv-hot2').replaceChildren(...Array.from({length:HOT},(_,i)=>cell(i)));}
  const n=root.querySelector('.inv-name'),s=slots[sel];n.textContent=s?ITEMS[s.id]?.name+(s.items.length>1?' ×'+s.items.length:''):'';n.classList.remove('show');void n.offsetWidth;if(s){n.classList.add('show');clearTimeout(nameT);nameT=setTimeout(()=>n.classList.remove('show'),1600);}}
 function setOpen(v){ensure();open=v;bag.hidden=!v;root.classList.toggle('open',v);if(v)render();else cancelDrag();}
 function slotAt(e){const t=document.elementFromPoint(e.clientX,e.clientY)?.closest?.('.inv-slot');return t&&bag.contains(t)?Number(t.dataset.i):-1;}
 function down(e){const i=slotAt(e);if(i<0||!slots[i])return;e.preventDefault();
  if(e.shiftKey&&e.button===0){quick(i);return;}
  const s=slots[i];let items;if(e.button===2&&s.items.length>1){items=s.items.splice(0,Math.ceil(s.items.length/2));}else{items=s.items;slots[i]=null;}
  drag={id:s.id,items,from:i};ghost=document.createElement('div');ghost.className='inv-ghost';ghost.innerHTML=`<img src="${iconUrl(s.id,items[0])}">${items.length>1?`<b>${items.length}</b>`:''}`;root.append(ghost);move(e);render();}
 function move(e){if(!ghost)return;ghost.style.transform=`translate(${e.clientX-24}px,${e.clientY-24}px)`;}
 function drop(i){const t=slots[i];if(!t){slots[i]={id:drag.id,items:drag.items};}
  else if(t.id===drag.id){while(drag.items.length&&t.items.length<max(t.id))t.items.push(drag.items.pop());if(drag.items.length)return false;}
  else{if(slots[drag.from])return false;slots[drag.from]=t;slots[i]={id:drag.id,items:drag.items};}
  return true;}
 function up(e){if(!drag)return;const i=slotAt(e);let done=false;if(i>=0)done=drop(i);if(!done)back();drag=null;ghost?.remove();ghost=null;render();onChange();}
 function back(){const f=slots[drag.from];if(!f)slots[drag.from]={id:drag.id,items:drag.items};else if(f.id===drag.id)f.items.push(...drag.items);else add(drag.id,drag.items[0],drag.items.length);}
 function cancelDrag(){if(drag){back();drag=null;ghost?.remove();ghost=null;}}
 function quick(i){const s=slots[i];slots[i]=null;const range=i<HOT?[HOT,HOT+BAG]:[0,HOT];let items=s.items;
  for(let pass=0;pass<2&&items.length;pass++)for(let k=range[0];k<range[1]&&items.length;k++){const t=slots[k];if(pass===0&&t&&t.id===s.id)while(items.length&&t.items.length<max(s.id))t.items.push(items.pop());if(pass===1&&!t){slots[k]={id:s.id,items};items=[];}}
  if(items.length)slots[i]={id:s.id,items};render();onChange();}
 // ---------- input ----------
 function key(e){if(e.repeat)return false;const ae=document.activeElement;if(ae&&/INPUT|SELECT|TEXTAREA/.test(ae.tagName))return false;
  if(e.code==='KeyI'){setOpen(!open);return true;}
  if(open&&e.code==='Escape'){setOpen(false);return true;}
  const m=/^Digit([1-9])$/.exec(e.code);if(m){select(Number(m[1])-1);return true;}return false;}
 function wheel(dy){select(sel+(dy>0?1:-1));}
 function serialize(){return slots.map(s=>s&&{id:s.id,items:s.items});}
 function load(a){if(!Array.isArray(a))return;for(let i=0;i<slots.length;i++)slots[i]=a[i]&&ITEMS[a[i].id]?{id:a[i].id,items:a[i].items.slice(0,max(a[i].id))}:null;render();onChange();}
 function show(v){ensure();root.classList.toggle('inv-hidden',!v);}
 return{slots,add,take,takeDrink,peekDrink,drinks,count,selected,select,key,wheel,setOpen,get open(){return open;},get sel(){return sel;},render,serialize,load,show};
}
