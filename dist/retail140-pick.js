// V140 P6 pickable store goods. Store fixtures (merged into the L11 block batch) record pick spots with pick140(b,…) in
// absolute world coords; exit-scene registers each block's spots (register140) and drops them on block removal. Near the
// player the spots get real loose models from the L1 loot set (makeLootModel: tvdinner / beer / cola / cigarettes /
// lighter / peacetin, same meshes, names and inventory items as Level 1). E picks one up into the inventory117 backpack;
// taken spots stay empty for the session (key = id + position, survives LOD rebuilds). ?pick140=0 = none.
import {makeLootModel} from './l1loot124-items.js?v=132b';
import {ITEMS} from './inventory117.js?v=132b';
import {itemTitle} from './l1loot130-items.js?v=130';
import * as T from './vendor/three.module.min.js';

export const PICK140=!(typeof location!=='undefined'&&/[?&]pick140=0/.test(location.search));
/** record a pick spot in the batch's current frame (y = surface the item stands on) */
export function pick140(b,id,x,y,z,ry=0,v=0){if(!PICK140)return;const p=b.point(x,y,z);(b.picks140||(b.picks140=[])).push({id,x:p.x,y:p.y,z:p.z,ry:ry+b.frame.ry,v:v>>>0});}
const taken=new Set(),reg=new Map(),glow=new Map(),SPAWN=16,FREE=22,REACH=1.75;
const keyOf=p=>p.id+':'+Math.round(p.x*100)+','+Math.round(p.y*100)+','+Math.round(p.z*100);
export function register140(bk,object,picks){unregister140(bk);if(!PICK140||!picks?.length)return;reg.set(bk,{object,picks:picks.map(p=>({...p,k:keyOf(p),o:null}))});}
export function unregister140(bk){const e=reg.get(bk);if(!e)return;for(const p of e.picks)drop(p);reg.delete(bk);}
function drop(p){if(!p.o)return;p.o.removeFromParent();p.o.traverse(m=>m.geometry?.dispose());p.o=null;}
// store cavities are lit by their own baked albedo glow, not real lamps: give the loose goods the same self-glow
function lit(m){if(!m||!m.isMeshStandardMaterial||!m.visible)return m;let c=glow.get(m);if(!c){c=m.clone();c.emissive=new T.Color(0xffffff);c.emissiveMap=m.map||null;if(!m.map)c.emissive.copy(m.color);c.emissiveIntensity=.32;glow.set(m,c);}return c;}
function spawn(e,p){const o=makeLootModel(p.id,{v:p.v});o.traverse(m=>{if(m.isMesh)m.material=Array.isArray(m.material)?m.material.map(lit):lit(m.material);});
 o.position.set(p.x,p.y,p.z);o.rotation.y=p.ry;o.userData.pick140=p;e.object.add(o);p.o=o;}
const v3=new T.Vector3();
/** ax/az = player absolute world x/z, eye = absolute eye position, dir = camera forward. Returns the aimed spot or null. */
export function update140(ax,az,eye,dir){let best=null,bs=-1;
 for(const[bk,e]of reg){if(e.seen&&!e.object.parent){unregister140(bk);continue;}if(e.object.parent)e.seen=true;
  for(const p of e.picks){const dx=p.x-ax,dz=p.z-az,d2=dx*dx+dz*dz,gone=taken.has(p.k);
   if(!p.o&&!gone&&d2<SPAWN*SPAWN&&e.object.parent)spawn(e,p);else if(p.o&&(gone||d2>FREE*FREE))drop(p);
   if(!p.o||d2>9)continue;v3.set(p.x-eye.x,p.y+.04-eye.y,p.z-eye.z);const d=v3.length();if(d>REACH)continue;v3.multiplyScalar(1/d);
   const s=v3.dot(dir)-d*.015;if(v3.dot(dir)>.955&&s>bs){bs=s;best=p;}}}
 return best;}
export function name140(p){return itemTitle(p.id,{v:p.v})||ITEMS[p.id]?.name||p.id;}
/** prompt line: name + what left click does (keymap V131) */
export function hint140(p){const d=(ITEMS[p.id]?.desc||'').split('：')[0];return 'E 拾取 '+name140(p)+(d.startsWith('左键')?' · '+d:'');}
export function take140(p){taken.add(p.k);const wp=p.o?p.o.getWorldPosition(new T.Vector3()):null;drop(p);return wp;}
export function stats140(){let n=0,live=0;for(const e of reg.values())for(const p of e.picks){n++;if(p.o)live++;}return{blocks:reg.size,spots:n,live,taken:taken.size};}
