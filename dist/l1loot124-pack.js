// V124c-L1 packing · bundles (shrink-wrapped six-packs, can trays, blister cards, tied bundles) and a crate packer.
// Two packing modes per crate: 'tidy' (rows/columns flush to the walls, stacked layers on level tops) and 'messy'
// (tumbled at random angles, some lying on their side, dropped onto a height field so they rest on the floor / bed or
// on each other). Collision is a conservative height field over each item's rotated bounding box, so nothing
// interpenetrates. Packaging art: art-l1loot124c/ (each generated alone) -> tools/l1loot124c_assets.py -> assets/l1-loot-v124/pk.
import * as T from './vendor/three.module.min.js';
import {makeLootModel} from './l1loot124-items.js?v=132b';

const A='./assets/l1-loot-v124/pk/';const loader=new T.TextureLoader(),texC=new Map(),matC=new Map();
function tex(n,rep=false){if(texC.has(n))return texC.get(n);const t=loader.load(new URL(A+n+'.webp?v=124c',import.meta.url).href);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=rep?T.RepeatWrapping:T.ClampToEdgeWrapping;t.magFilter=T.NearestFilter;t.anisotropy=2;texC.set(n,t);return t;}
const M=(k,f)=>{if(!matC.has(k))matC.set(k,f());return matC.get(k);};
const std=(map,o={})=>new T.MeshStandardMaterial({map,roughness:.85,metalness:0,...o});
const HIDE=M('hide',()=>{const m=new T.MeshBasicMaterial();m.visible=false;return m;});
const kraft=()=>M('kraft',()=>std(null,{color:0x9a7650,roughness:.95}));
const film=()=>M('film',()=>new T.MeshStandardMaterial({map:tex('film',true),transparent:true,opacity:.55,roughness:.08,metalness:.05,depthWrite:false,side:T.DoubleSide,color:0xf4f6f8}));
const twine=()=>M('twine',()=>std(tex('twine',true),{roughness:1}));
function faceUV(g,f,u0,v0,u1,v1){const uv=g.attributes.uv;for(let i=f*4;i<f*4+4;i++)uv.setXY(i,u0+(u1-u0)*uv.getX(i),v0+(v1-v0)*uv.getY(i));return g;}
const box=(w,h,d,m,x=0,y=0,z=0)=>{const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);return o;};
const bb=new T.Box3();
export function dims(o){o.updateMatrixWorld(true);bb.makeEmpty();o.traverse(c=>{if(c.isMesh&&c.material!==HIDE&&c.visible){c.geometry.computeBoundingBox?.();const b=c.geometry.boundingBox.clone().applyMatrix4(c.matrixWorld);bb.union(b);}});return bb.clone();}

// A rectangular loop (twine / paper band) round a bundle: a box with its two open faces hidden.
// axis 'x': the loop wraps round the x axis (visible faces +y,-y,+z,-z); each face samples its own part of the strip.
function loop(w,h,d,mat,axis){const g=new T.BoxGeometry(w,h,d);// face order +x,-x,+y,-y,+z,-z
 const parts=axis==='x'?[[2,0,.4],[4,.4,.55],[3,.55,.95],[5,.95,1]]:[[2,0,.4],[0,.4,.55],[3,.55,.95],[1,.95,1]];
 for(const[f,a,b]of parts)faceUV(g,f,a,0,b,1);const ms=axis==='x'?[HIDE,HIDE,mat,mat,mat,mat]:[mat,mat,mat,mat,HIDE,HIDE];return new T.Mesh(g,ms);}

// Low tray (base + four walls, each wall its own print). faces: [long a, long b, short a, short b, bottom]
function tray(w,d,h,faces,inner=kraft()){const g=new T.Group(),t=.004;
 const base=new T.Mesh(new T.BoxGeometry(w,t,d),[inner,inner,inner,faces[4],inner,inner]);base.position.y=t/2;g.add(base);
 const wall=(L,mat,x,z,ry)=>{const m=new T.Mesh(new T.BoxGeometry(L,h,t),[inner,inner,inner,inner,mat,inner]);m.position.set(x,h/2,z);m.rotation.y=ry;g.add(m);};
 wall(w,faces[0],0,d/2-t/2,0);wall(w,faces[1],0,-d/2+t/2,Math.PI);wall(d,faces[2],w/2-t/2,0,Math.PI/2);wall(d,faces[3],-w/2+t/2,0,-Math.PI/2);return g;}

export const PACKS={
 six:{id:'almond',n:6,name:'杏仁水 · 六瓶一扎',desc:'整扎拿走会按数量拆进背包。'},
 cantray:{id:'can',n:6,name:'罐头 · 一托六罐',desc:'整扎拿走会按数量拆进背包。'},
 blister:{id:'battery',n:4,name:'电池 · 四节吸塑卡',desc:'整扎拿走会按数量拆进背包。'},
 matchbundle:{id:'matches',n:4,name:'火柴 · 一捆四盒',desc:'整扎拿走会按数量拆进背包。'},
 gauze:{id:'bandage',n:4,name:'医用纱布 · 一捆四卷',desc:'整扎拿走会按数量拆进背包。'},
 yarnbundle:{id:'yarn',n:3,name:'毛线团 · 一捆三团',desc:'整扎拿走会按数量拆进背包。'},
 // V130-B
 beer6:{id:'beer',n:6,name:'啤酒 · 六罐一扎',desc:'整扎拿走会按数量拆进背包。'},
 cola6:{id:'cola',n:6,name:'可乐 · 六罐一扎',desc:'整扎拿走会按数量拆进背包。'},
 cigstack:{id:'cigarettes',n:10,name:'香烟 · 一条十包',desc:'整扎拿走会按数量拆进背包。'},
};
// V130-B six-pack ring yoke: one ring per can top, joined by small webs (clear-ish LDPE)
function yoke(dw,y){const g=new T.Group(),m=M('yoke',()=>new T.MeshStandardMaterial({color:0xe8ece8,transparent:true,opacity:.6,roughness:.25,side:T.DoubleSide,depthWrite:false}));
 for(let k=0;k<6;k++){const r=new T.Mesh(new T.RingGeometry(.026,.0335,14),m);r.rotation.x=-Math.PI/2;r.position.set((k%3-1)*dw,y,(Math.floor(k/3)-.5)*dw);g.add(r);}
 for(let k=0;k<2;k++){const b=new T.Mesh(new T.PlaneGeometry(dw*2,.008),m);b.rotation.x=-Math.PI/2;b.position.set(0,y,(k-.5)*dw);g.add(b);}
 const c=new T.Mesh(new T.PlaneGeometry(.008,dw),m);c.rotation.x=-Math.PI/2;c.position.set(0,y,0);g.add(c);return g;}
// Build a bundle. members: [{i,id,meta}] (only the ones still in the crate). full: original count -> wraps intact.
export function makeBundle(kind,members,full=true){const g=new T.Group(),objs=new Map(),wraps=[];g.userData.pack=kind;
 const put=(m,o,x,y,z,ry=0)=>{o.position.set(x,y,z);o.rotation.y=ry;g.add(o);if(m)objs.set(m.i,o);return o;};
 const slot=(k)=>members.find(m=>m.k===k);// member at grid slot k (members carry k = position inside the full pack)
 if(kind==='six'||kind==='cantray'){
  const sample=makeLootModel(kind==='six'?'almond':'can',members[0]?.meta||{});const b=dims(sample);const dw=Math.max(b.max.x-b.min.x,b.max.z-b.min.z)+.004,H=b.max.y-b.min.y;
  const w=dw*3+.008,d=dw*2+.008,th=kind==='six'?Math.min(.06,H*.3):.032;
  const faces=kind==='six'?[M('tla',()=>std(tex('tray_long_a'))),M('tlb',()=>std(tex('tray_long_b'))),M('tsa',()=>std(tex('tray_short_a'))),M('tsb',()=>std(tex('tray_short_b'))),M('tbt',()=>std(tex('tray_bottom')))]
   :[M('cta',()=>std(tex('cantray_a'))),M('ctb',()=>std(tex('cantray_b'))),M('cts',()=>std(null,{color:0xb08a62,roughness:.95})),M('cts2',()=>std(null,{color:0xa98560,roughness:.95})),M('tbt',()=>std(tex('tray_bottom')))];
  g.add(tray(w,d,th,faces));
  for(let k=0;k<6;k++){const m=slot(k);if(!m)continue;const o=k===0?sample:makeLootModel(m.id,m.meta);put(m,o,(k%3-1)*dw,.004,(Math.floor(k/3)-.5)*dw,(k*1.3)%6.28);}
  if(full){const fh=kind==='six'?H*.62:H+.01,f=box(w+.006,fh,d+.006,film(),0,fh/2+.002,0);wraps.push(f);g.add(f);
   if(kind==='six'){const top=box(w*.92,.002,d*.25,film(),0,H+.006,0);wraps.push(top);g.add(top);}}// carry strip over the caps
 }else if(kind==='beer6'||kind==='cola6'){// V130-B: six cans held only by the ring yoke over their tops
  const id=PACKS[kind].id,sample=makeLootModel(id,members[0]?.meta||{});const b=dims(sample),dw=b.max.x-b.min.x+.002,H=b.max.y-b.min.y;
  for(let k=0;k<6;k++){const m=slot(k);if(!m)continue;const o=k===members[0].k?sample:makeLootModel(id,m.meta);put(m,o,(k%3-1)*dw,0,(Math.floor(k/3)-.5)*dw,(k*1.9)%6.28);}
  if(full){const y=yoke(dw,H-.012);g.add(y);wraps.push(y);}
 }else if(kind==='cigstack'){// V130-B: ten packs lying face up, 5 x 2 layers, a printed paper band round the middle
  const pw=.055,pt=.022;for(let k=0;k<10;k++){const m=slot(k);if(!m)continue;const o=makeLootModel('cigarettes',m.meta);o.rotation.x=-Math.PI/2;const w=new T.Group();w.add(o);o.position.set(0,.011,.0425);w.userData.lootId='cigarettes';put(m,w,(k%5-2)*(pw+.001),Math.floor(k/5)*pt,0);}
  if(full){const bnd=loop(5*(pw+.001)+.004,2*pt+.004,.034,M('cigband',()=>std(new T.TextureLoader().load(new URL('./assets/l1-loot-v130/cig_band.webp?v=130',import.meta.url).href,t=>{t.colorSpace=T.SRGBColorSpace;t.magFilter=T.NearestFilter;}),{roughness:.8})),'z');bnd.position.y=pt;g.add(bnd);wraps.push(bnd);}
 }else if(kind==='blister'){
  const card=new T.Mesh(new T.BoxGeometry(.064,.0025,.096),[kraft(),kraft(),M('blf',()=>std(tex('blister_front'),{roughness:.6})),M('blb',()=>std(tex('blister_back'),{roughness:.7})),kraft(),kraft()]);card.position.y=.00125;g.add(card);
  for(let k=0;k<4;k++){const m=slot(k);if(!m)continue;const o=makeLootModel('battery',m.meta);put(m,o,(k-1.5)*.0145,.0025,-.004,Math.PI/2);}
  const dome=box(.06,.016,.056,M('blDome',()=>new T.MeshStandardMaterial({color:0xeef3f6,transparent:true,opacity:.3,roughness:.1,depthWrite:false})),0,.0025+.008,-.004);g.add(dome);
 }else if(kind==='matchbundle'){
  for(let k=0;k<4;k++){const m=slot(k);if(!m)continue;const o=makeLootModel('matches',m.meta);put(m,o,(k%2-.5)*.037,Math.floor(k/2)*.0165,0,0);}
  if(full){const l1=loop(.077,.035,.006,twine(),'z');l1.position.set(0,.0165,0);g.add(l1);wraps.push(l1);
   const l2=loop(.006,.035,.057,twine(),'x');l2.position.set(0,.0165,0);g.add(l2);wraps.push(l2);}
 }else if(kind==='gauze'){
  const rm=M('gauzeRoll',()=>std(new T.TextureLoader().load(new URL('./assets/l1-loot-v124/gauze.webp?v=124',import.meta.url).href,t=>{t.colorSpace=T.SRGBColorSpace;}),{roughness:.95}));
  for(let k=0;k<4;k++){const m=slot(k);if(!m)continue;const o=new T.Group();const c=new T.Mesh(new T.CylinderGeometry(.028,.028,.06,10),rm);c.rotation.x=Math.PI/2;c.position.y=.028;o.add(c);o.userData.lootId='bandage';put(m,o,(k%2-.5)*.057,Math.floor(k/2)*.056,0);}
  if(full){const b=loop(.118,.116,.03,M('band',()=>std(tex('band_gauze'),{roughness:.8})),'z');b.position.set(0,.056,0);g.add(b);wraps.push(b);}
 }else if(kind==='yarnbundle'){
  for(let k=0;k<3;k++){const m=slot(k);if(!m)continue;const o=makeLootModel('yarn',m.meta);put(m,o,(k-1)*.098,0,0);}
  if(full){const b1=loop(.296,.098,.006,twine(),'z');b1.position.y=.049;g.add(b1);wraps.push(b1);}
 }
 g.userData.objs=objs;g.userData.wraps=wraps.filter(Boolean);return g;}

// Orientation choices for a unit in messy mode
const ROLLY=new Set(['almond','soy','can','sanitizer','chemical','battery','dynamite','yarn','melon','papaya','pineapple','drink','beer','cola','peacetin','tumbler','duck']);
const BOXY=new Set(['bandage','soap','charger','matches','lighter','berries','nitrogen','cigarettes','pager','teeth','snowglobe']);
// Pack units into a crate interior (meters, centred at origin). units: [{obj, id}] (obj origin = resting bottom centre).
// opts: {w,d,floor,wall,mode:'tidy'|'messy',R}
export function packCrate(units,{w,d,floor,wall,mode,R}){const c=.015,nx=Math.max(2,Math.floor(w/c)),nz=Math.max(2,Math.floor(d/c)),H=new Float32Array(nx*nz).fill(floor),x0=-nx*c/2,z0=-nz*c/2;
 const span=(lo,hi,n,o)=>[Math.max(0,Math.floor((lo-o)/c)),Math.min(n-1,Math.ceil((hi-o)/c)-1)];
 const rest=(i0,i1,j0,j1)=>{let mx=-1e9,mn=1e9;for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const h=H[j*nx+i];if(h>mx)mx=h;if(h<mn)mn=h;}return[mx,mn];};
 const order=mode==='tidy'?units.slice().sort((a,b)=>(b.area||0)-(a.area||0)):units;
 for(const u of units){u.obj.position.set(0,0,0);const b=dims(u.obj);u.area=(b.max.x-b.min.x)*(b.max.z-b.min.z);}
 if(mode==='tidy')order.sort((a,b)=>b.area-a.area||String(a.id).localeCompare(String(b.id)));
 for(const u of order){let best=null;const o=u.obj;
  for(let shrink=0;shrink<4&&!best;shrink++){if(shrink)o.scale.multiplyScalar(.85);
   const tries=mode==='tidy'?[[0,0,0],[0,Math.PI/2,0]]:Array.from({length:5},()=>{const side=ROLLY.has(u.id)&&!u.pack&&R()<.55,tip=BOXY.has(u.id)&&!u.pack&&R()<.35;return[side?Math.PI/2:tip?Math.PI/2:(R()-.5)*.22,R()*6.283,side?0:(R()-.5)*.22];});
   for(const[rx,ry,rz]of tries){o.rotation.set(0,0,0);o.rotation.order='YXZ';o.rotation.set(rx,ry,rz);o.position.set(0,0,0);const b=dims(o),bw=b.max.x-b.min.x,bd=b.max.z-b.min.z;if(bw>nx*c||bd>nz*c)continue;
    const fi=Math.ceil(bw/c),fj=Math.ceil(bd/c);
    const cand=mode==='tidy'?null:[0,1,2,3].map(()=>[Math.floor(R()*(nx-fi+1)),Math.floor(R()*(nz-fj+1))]);
    const test=(i,j)=>{const[mx,mn]=rest(i,i+fi-1,j,j+fj-1);if(mode==='tidy'&&mx-mn>.012)return;const top=mx+(b.max.y-b.min.y);if(top>wall+.12&&mode==='tidy')return;
     const score=mode==='tidy'?Math.round(mx*200)*1e6+j*1000+i:mx+R()*.02;if(!best||score<best.score)best={score,i,j,mx,rx,ry,rz,b,fi,fj};};
    if(cand)for(const[i,j]of cand)test(i,j);else for(let j=0;j+fj<=nz;j++)for(let i=0;i+fi<=nx;i++)test(i,j);}
  }
  if(!best){o.visible=false;continue;}// could not fit at all (never seen with the current tables)
  o.rotation.set(best.rx,best.ry,best.rz);const b=best.b;o.position.set(x0+best.i*c-b.min.x,best.mx-b.min.y+.0005,z0+best.j*c-b.min.z);
  const top=best.mx+(b.max.y-b.min.y);for(let j=best.j;j<best.j+best.fj;j++)for(let i=best.i;i<best.i+best.fi;i++)H[j*nx+i]=top;}
 return units;}
