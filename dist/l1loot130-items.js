// V130-B L1 loot+ · new item models + the lighter / sanitizer rebuild.
// Every printed surface is its own individually generated image (art-l1loot130/, one per face or label), reduced to a
// PS1-scale texture by tools/l1loot130_assets.py -> assets/l1-loot-v130. Box items carry a different picture on each
// printed face (BoxGeometry material groups: 0 +x, 1 -x, 2 +y, 3 -y, 4 +z, 5 -z); plain faces are the material colour.
// Re-used models: vending almond water PET + can (Level 11 back-court machine, createVendingDrink), beer / cola cans
// (Level 10 camp can() geometry + its camp-v98 can wraps), cigarette pack (Level 10 camp pack() proportions + its
// camp-v98 fronts). Brands are fictional and multilingual (EN / JA / RU / ES), except the user-requested 和平 Peace tin.
import * as T from './vendor/three.module.min.js';
import {createVendingDrink} from './vending-drinks-v70.js';
import {vendingDrinkTextures,initializeVendingTextures} from './vending-materials-v70.js';

const A='./assets/l1-loot-v130/';
const loader=new T.TextureLoader(),texC=new Map(),matC=new Map();
function tx(path,{rep=false,flip=false}={}){const k=path+(rep?':r':'')+(flip?':f':'');if(texC.has(k))return texC.get(k);
 const t=loader.load(new URL(path.includes('/')?path:A+path+'.webp?v=130',import.meta.url).href);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=rep?T.RepeatWrapping:T.ClampToEdgeWrapping;
 if(flip){t.wrapS=T.RepeatWrapping;t.repeat.x=-1;}t.magFilter=T.NearestFilter;t.minFilter=T.LinearMipmapLinearFilter;t.anisotropy=2;texC.set(k,t);return t;}
const M=(k,f)=>{if(!matC.has(k))matC.set(k,f());return matC.get(k);};
const std=(map,o={})=>new T.MeshStandardMaterial({map,roughness:.7,metalness:0,...o});
const col=(c,o={})=>M('c'+c+JSON.stringify(o),()=>std(null,{color:c,...o}));
const mesh=(g,m,x=0,y=0,z=0,rx=0,ry=0,rz=0)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);o.rotation.set(rx,ry,rz);return o;};
const grp=(...c)=>{const g=new T.Group();if(c.length)g.add(...c);return g;};
const lathe=(pts,n=14)=>new T.LatheGeometry(pts.map(([x,y])=>new T.Vector2(x,y)),n);
const pick=(m,n)=>((m?.v|0)%n+n)%n;

// ---- names (brand per variant), shown in pickup toasts and the inspector ----
export const LOOT130={
 drink:{name:'售货机杏仁水',size:.22},beer:{name:'啤酒',size:.17},cola:{name:'可乐',size:.13},cigarettes:{name:'香烟',size:.09},peacetin:{name:'罐装和平香烟',size:.09},
 tvdinner:{name:'电视晚餐（预制菜）',size:.26},tumbler:{name:'玻璃杯',size:.1},duck:{name:'橡皮鸭',size:.09},cassette:{name:'录音磁带',size:.1},floppy:{name:'软盘',size:.09},
 motelkey:{name:'汽车旅馆钥匙',size:.12},snowglobe:{name:'雪花水晶球',size:.1},teeth:{name:'发条假牙',size:.07},pager:{name:'寻呼机',size:.07},polaroid:{name:'拍立得照片',size:.11},
};
const BRAND={
 lighter:['FLINTWELL 打火机（美式）','ヒノトリ 打火机（日本）','ИСКРА 打火机（俄罗斯）','FUEGO LOCO 打火机（墨西哥）'],
 sanitizer:['PURE HANDS 免洗洗手液','さらさらハンド 免洗洗手液','ЧИСТЫЕ РУКИ 免洗洗手液','MANOS SANAS 免洗洗手液'],
 beer:['淡啤酒（蓝罐）','墨西哥啤酒（金罐）','МЕДВЕДЬ 熊牌啤酒','北星ビール KITABOSHI'],
 cola:['香草可乐（红罐）','COLA DEL SOL 太阳可乐','КОЛА ВОСТОК 东方可乐'],
 cigarettes:['红白软盒香烟','蓝绿复古香烟','ПОЛЮС 极地牌香烟','山鳩 YAMABATO 香烟'],
 drink:{pet:'杏仁水 · 500 mL 塑料瓶',can:'杏仁水 · 330 mL 易拉罐'},
 tumbler:['直身玻璃杯','苏联多棱玻璃杯（гранёный стакан）'],
};
export const drinkType=m=>m?.type||(pick(m,2)?'can':'pet');
export function itemTitle(id,m){const b=BRAND[id];if(!b)return null;if(id==='drink')return b[drinkType(m)];return b[pick(m,b.length)];}

// ---- shared bits ----
function box6(w,h,d,mats){return new T.Mesh(new T.BoxGeometry(w,h,d),mats);}
// three.js CylinderGeometry: theta 0 = +z, u grows with theta (left->right seen from outside) -> a label band centred on a direction
function band(r,h,center,width,mat,y){const g=new T.CylinderGeometry(r,r,h,18,1,true,center-width/2,width);return mesh(g,mat,0,y,0);}
// Level 10 camp can (camp-life-props98.js can()): rolled rims, wrap, pull tab; sealed (no drinking hole) as found in a crate
function campCan(wrap,tall=false){const g=new T.Group(),r=.034,h=tall?.169:.123,metal=col(0xb6b7ac,{roughness:.45,metalness:.6});
 g.add(mesh(lathe([[0,0],[r*.86,0],[r,.008],[r,h-.013],[r*.86,h-.003],[r*.86,h],[0,h]],14),metal));
 g.add(mesh(new T.CylinderGeometry(r+.0004,r+.0004,h-.026,16,1,true),wrap,0,h*.49,0));
 const tab=mesh(new T.TorusGeometry(.008,.0025,3,8),metal,0,h+.002,-.007,Math.PI/2);g.add(tab);
 g.add(mesh(new T.CircleGeometry(.007,8),col(0x8d8f88,{metalness:.6,roughness:.4}),0,h+.0008,.009,-Math.PI/2));
 for(const yy of[.006,h])g.add(mesh(lathe([[r*.83,yy],[r*.9,yy-.003],[r*.92,yy],[r*.86,yy+.002]],14),metal));return g;}
const campWrap=k=>M('cw'+k,()=>std(tx('./textures/camp-v98/'+k+'.webp'),{roughness:.4,metalness:.35}));
const wrap130=k=>M('w'+k,()=>std(tx(k),{roughness:.4,metalness:.35}));

const LIGHTER=[{c:0xd8b21c,op:1},{c:0x2a48c8,op:.82},{c:0xb8241c,op:1},{c:0x86c43a,op:1}];
const SANI=[{gel:0x9cc8f0,pump:0xf2f2ee},{gel:0xf4c6d6,pump:0xf6e8ee},{gel:0xb8e0a8,pump:0x2e7a38},{gel:0xbfeee8,pump:0xf09030}];
const CIG=[{front:'./textures/camp-v98/cigarettes-red.webp',b:'Red',c:0xece8e0,top:0xc8261e},{front:'./textures/camp-v98/cigarettes-turquoise.webp',b:'Teal',c:0x2fa2a8,top:0x2fa2a8},{front:'cigPolus_front',b:'Polus',c:0x1c2a58,top:0x1c2a58},{front:'cigYama_front',b:'Yama',c:0xeee6d0,top:0xeee6d0}];

export const B130={
 // V130 fix: real six-face lighter. Body upright: front / back each its own printed decal, narrow sides + top in the
 // body plastic, bottom its own molded-base image; chrome hood (own image), knurled spark wheel, fork button.
 lighter(m){const v=pick(m,4),L=LIGHTER[v],tr=L.op<1,body=M('lb'+v,()=>col(L.c,{roughness:.3,transparent:tr,opacity:L.op}));
  const fr=M('lf'+v,()=>std(tx('lighter'+'ABCD'[v]+'_front'),{roughness:.3,transparent:tr,opacity:L.op})),bk=M('lk'+v,()=>std(tx('lighter'+'ABCD'[v]+'_back'),{roughness:.3,transparent:tr,opacity:L.op}));
  const bot=M('lbot',()=>std(tx('lighter_bottom'),{roughness:.5})),hood=M('lhood',()=>std(tx('lighter_hood'),{metalness:.25,roughness:.4,color:0xe0e0e0})),dark=col(0x2a2a2a,{roughness:.6});
  const g=grp(box6(.025,.062,.012,[body,body,body,bot,fr,bk]));g.children[0].position.y=.031;
  if(tr){const fuel=mesh(new T.BoxGeometry(.021,.034,.008),M('fuel',()=>new T.MeshStandardMaterial({color:0xb8d8ff,transparent:true,opacity:.35,roughness:.05})),0,.018,0);g.add(fuel);}
  g.add(mesh(new T.BoxGeometry(.0255,.013,.0125),[hood,hood,dark,hood,hood,hood],.0,.0675,0));
  g.add(mesh(new T.CylinderGeometry(.0048,.0048,.0075,10),col(0x6e6c68,{metalness:.7,roughness:.45}),-.003,.0745,-.0005,0,0,Math.PI/2));
  g.add(mesh(new T.BoxGeometry(.011,.004,.009),dark,.006,.0635,0));return g;},
 // V130 fix: translucent gel bottle (body = tinted gel, never a printed picture); front + back labels are separate
 // cylinder bands, each its own generated label; pump head per brand.
 sanitizer(m){const v=pick(m,4),S=SANI[v],k='ABCD'[v];
  const body=M('sg'+v,()=>new T.MeshStandardMaterial({color:S.gel,roughness:.12,metalness:0,transparent:true,opacity:.72}));
  const g=grp(mesh(lathe([[0,0],[.028,0],[.03,.006],[.03,.1],[.024,.118],[.011,.124],[.011,.13]],18),body));
  g.add(band(.0303,.07,0,2.35,M('sf'+v,()=>std(tx('sani'+k+'_front'),{roughness:.45})),.052));
  g.add(band(.0303,.066,Math.PI,2.0,M('sb'+v,()=>std(tx('sani'+k+'_back'),{roughness:.45})),.052));
  const pm=col(S.pump,{roughness:.4});g.add(mesh(new T.CylinderGeometry(.009,.011,.022,10),pm,0,.141,0),mesh(new T.BoxGeometry(.034,.007,.009),pm,.012,.15,0),mesh(new T.CylinderGeometry(.0025,.0025,.012,6),pm,.028,.15,0,0,0,Math.PI/2));return g;},
 drink(m){const t=drinkType(m);return createVendingDrink(T,t,{textures:vendingDrinkTextures()}).group;},
 beer(m){const v=pick(m,4);return campCan(v===0?campWrap('can-budlight'):v===1?campWrap('can-modelo'):wrap130(v===2?'beer_ru':'beer_jp'),v<2);},
 cola(m){const v=pick(m,3);return campCan(v===0?campWrap('can-vanilla'):wrap130(v===1?'cola_es':'cola_ru'));},
 // camp pack proportions (55 x 85 x 22 mm), stood upright; front / back / one side printed (own images), the other side,
 // lid and base in the pack colour; cellophane over it with a red tear strip
 cigarettes(m){const v=pick(m,4),C=CIG[v];const front=M('cf'+v,()=>std(tx(C.front),{roughness:.55})),back=M('cb'+v,()=>std(tx('cig'+C.b+'_back'),{roughness:.55})),side=M('cs'+v,()=>std(tx('cig'+C.b+'_side'),{roughness:.55}));
  const plain=col(C.c,{roughness:.55}),top=col(C.top,{roughness:.55});const g=grp(box6(.055,.085,.022,[side,plain,top,plain,front,back]));g.children[0].position.y=.0425;
  g.add(mesh(new T.BoxGeometry(.0556,.0856,.0226),M('cello',()=>new T.MeshStandardMaterial({color:0xffffff,transparent:true,opacity:.12,roughness:.05,depthWrite:false})),0,.0425,0));
  g.add(mesh(new T.BoxGeometry(.0562,.0025,.0232),col(0xd42a1e,{roughness:.4}),0,.071,0));
  g.add(mesh(new T.BoxGeometry(.0555,.0008,.0225),col(0x101010),0,.0655,0));return g;},// lid seam
 // round 50-cigarette 和平 Peace tin: printed side wrap, printed lid, gold lid rim, tin base
 peacetin(){const r=.038,h=.074,side=M('pside',()=>std(tx('peace_side'),{metalness:.1,roughness:.35})),lid=M('plid',()=>std(tx('peace_lid'),{metalness:.1,roughness:.35})),gold=col(0xd8b860,{metalness:.35,roughness:.35}),tin=col(0xa8a8a4,{metalness:.3,roughness:.45});
  const g=grp(mesh(new T.CylinderGeometry(r,r,h-.004,24,1,true),side,0,(h-.004)/2,0,0,-1.3,0),mesh(new T.CircleGeometry(r,24),tin,0,.0005,0,Math.PI/2));
  g.add(mesh(new T.CylinderGeometry(r+.0012,r+.0012,.011,24,1,true),gold,0,h-.0055,0),mesh(new T.CircleGeometry(r+.0012,24),lid,0,h,0,-Math.PI/2,0,0));
  g.add(mesh(new T.TorusGeometry(r+.0008,.0012,4,24),gold,0,h,0,Math.PI/2));return g;},
 // Swanson-style TV dinner: carton with six different printed faces, opened at one end (flap hanging) with the
 // aluminium tray (embossed alu walls, crimped foil lid with its own print) slid half out.
 tvdinner(){const w=.25,h=.036,d=.17,cf=n=>M('tv'+n,()=>std(tx('tv_'+n),{roughness:.85}));const kraft=M('tvin',()=>std(null,{color:0x8a7a62,roughness:1,side:T.BackSide})),open=M('tvopen',()=>{const m=new T.MeshBasicMaterial();m.visible=false;return m;});
  const g=new T.Group(),carton=box6(w,h,d,[open,cf('endB'),cf('front'),cf('back'),cf('sideA'),cf('sideB')]);carton.position.y=h/2;g.add(carton);
  const inner=new T.Mesh(new T.BoxGeometry(w-.002,h-.002,d-.002),[open,kraft,kraft,kraft,kraft,kraft]);inner.position.y=h/2;g.add(inner);
  // the opened end flap: printed outside (+x before folding) faces down once folded out, kraft inside faces up
  const flap=new T.Mesh(new T.BoxGeometry(.0008,h,d),[cf('endA'),M('tvflap',()=>std(null,{color:0x9a8a70,roughness:1})),kraft,kraft,kraft,kraft]);flap.position.y=h/2;
  const hinge=new T.Group();hinge.position.set(w/2,.0004,0);hinge.rotation.z=-1.48;hinge.add(flap);g.add(hinge);
  const alu=M('alu',()=>std(tx('tv_alu',{rep:true}),{metalness:.25,roughness:.35,color:0xf0f0f0})),foil=M('foil',()=>std(tx('tv_foil'),{metalness:.15,roughness:.4}));
  const tg=new T.BoxGeometry(.23,.026,.155,1,1,1),p=tg.attributes.position;for(let i=0;i<p.count;i++)if(p.getY(i)<0){p.setX(i,p.getX(i)*.93);p.setZ(i,p.getZ(i)*.92);}tg.computeVertexNormals();
  const tray=new T.Group();tray.add(mesh(tg,[alu,alu,foil,alu,alu,alu],0,.013,0));for(const[x,z,w2,d2]of[[0,.0785,.236,.006],[0,-.0785,.236,.006],[.115,0,.006,.161],[-.115,0,.006,.161]])tray.add(mesh(new T.BoxGeometry(w2,.002,d2),alu,x,.026,z));tray.position.set(.07,.0045,0);g.add(tray);return g;},
 // drinking glass: straight tumbler or the faceted Soviet гранёный стакан (16 flats + smooth rim band)
 tumbler(m){const v=pick(m,2),gl=M('tum',()=>new T.MeshStandardMaterial({color:0xe6f0ee,transparent:true,opacity:.32,roughness:.04,metalness:.15,side:T.DoubleSide,depthWrite:false}));
  const g=new T.Group();if(v){const fac=new T.CylinderGeometry(.036,.031,.072,16,1,true);fac.computeVertexNormals();const f=mesh(fac,M('tumF',()=>new T.MeshStandardMaterial({color:0xe6f0ee,transparent:true,opacity:.32,roughness:.04,metalness:.15,side:T.DoubleSide,depthWrite:false,flatShading:true})),0,.044,0);g.add(f,mesh(new T.CylinderGeometry(.0375,.0365,.022,24,1,true),gl,0,.091,0));}
  else g.add(mesh(lathe([[0,0],[.033,0],[.035,.004],[.038,.1],[.0365,.1],[.0335,.008],[0,.008]],22),gl));
  g.add(mesh(new T.CylinderGeometry(v?.031:.033,v?.031:.033,.008,v?16:22),M('tumB',()=>new T.MeshStandardMaterial({color:0xd8e8e4,transparent:true,opacity:.55,roughness:.05,metalness:.1})),0,.004,0));return g;},
 // ---- odd small things ----
 duck(){const y=col(0xf2c81c,{roughness:.55}),o=col(0xe86a10,{roughness:.5}),k=col(0x101010,{roughness:.3});const b=new T.SphereGeometry(.034,14,10);b.scale(1.25,.8,1);
  const g=grp(mesh(b,y,0,.028,0),mesh(new T.SphereGeometry(.022,12,9),y,.026,.062,0));const beak=new T.SphereGeometry(.011,8,6);beak.scale(1.4,.45,1);g.add(mesh(beak,o,.048,.058,0));
  for(const s of[-1,1])g.add(mesh(new T.SphereGeometry(.0032,6,5),k,.04,.068,s*.0135));const tail=new T.ConeGeometry(.012,.022,8);g.add(mesh(tail,y,-.044,.044,0,0,0,.9));return g;},
 cassette(){const sh=col(0x55575a,{roughness:.35,transparent:true,opacity:.95}),a=M('casA',()=>std(tx('cassette_a'),{roughness:.4})),b=M('casB',()=>std(tx('cassette_b'),{roughness:.4}));
  const o=box6(.1,.0125,.064,[sh,sh,a,b,sh,sh]);o.position.y=.00625;const g=grp(o);g.add(mesh(new T.BoxGeometry(.058,.0128,.006),col(0x3a3b3d),0,.00625,.034));return g;},
 floppy(){const e=col(0x161616,{roughness:.45}),a=M('flA',()=>std(tx('floppy_a'),{roughness:.45})),b=M('flB',()=>std(tx('floppy_b'),{roughness:.45}));const o=box6(.09,.0033,.094,[e,e,a,b,e,e]);o.position.y=.00165;return grp(o);},
 // motel key: diamond fob (cut-out, same print both sides as the real hot-stamped fob), brass ring + key
 motelkey(){const fob=M('fob',()=>std(tx('fob'),{alphaTest:.5,side:T.DoubleSide,roughness:.4})),brass=col(0xc0a050,{metalness:.8,roughness:.35});
  const s=new T.Shape([[0,.5],[.5,1],[1,.5],[.5,0]].map(([u,v])=>new T.Vector2(u,v)));const fg=new T.ExtrudeGeometry(s,{depth:1,bevelEnabled:false});const uv=fg.attributes.uv,p=fg.attributes.position;for(let i=0;i<p.count;i++)uv.setXY(i,p.getX(i),p.getY(i));
  fg.translate(-.5,-.5,-.5);fg.scale(.05,.066,.005);const fobM=mesh(fg,[fob,col(0xd86a2a,{roughness:.5})],0,.0025,0,-Math.PI/2,0,0);
  const g=grp(fobM,mesh(new T.TorusGeometry(.011,.0016,5,14),brass,0,.002,-.042,Math.PI/2));
  const key=new T.Group();key.add(mesh(new T.CylinderGeometry(.011,.011,.0022,10),brass,0,0,0),mesh(new T.BoxGeometry(.0065,.0022,.04),brass,0,0,-.03));for(let i=0;i<4;i++)key.add(mesh(new T.BoxGeometry(.003,.0022,.0045),brass,.004,0,-.02-i*.007));
  key.position.set(.01,.0016,-.064);key.rotation.y=.4;g.add(key);return g;},
 // souvenir snow globe: printed band on a black base, glass dome, a tiny Level 1 pillar + crate inside, snow flecks
 snowglobe(){const base=M('gbase',()=>std(tx('globe_band',{rep:true}),{roughness:.35})),blk=col(0x111111,{roughness:.3});
  const g=grp(mesh(new T.CylinderGeometry(.036,.042,.028,20,1,true),base,0,.014,0),mesh(new T.CircleGeometry(.036,20),blk,0,.028,0,-Math.PI/2));
  g.add(mesh(new T.BoxGeometry(.012,.04,.012),col(0xb8b08a,{roughness:.9}),-.006,.048,0),mesh(new T.BoxGeometry(.014,.01,.012),col(0x8a6a3a),.013,.033,.006),mesh(new T.CircleGeometry(.033,16),col(0xe8e8e0),0,.0285,0,-Math.PI/2));
  const sn=new T.BufferGeometry(),a=[];for(let i=0;i<40;i++){const r=.03*Math.cbrt((i*.618)%1),t=i*2.4,ph=i*1.7;a.push(Math.cos(t)*r*Math.sin(ph),.06+Math.cos(ph)*r*.9,Math.sin(t)*r*Math.sin(ph));}sn.setAttribute('position',new T.Float32BufferAttribute(a,3));
  g.add(new T.Points(sn,M('snow',()=>new T.PointsMaterial({color:0xffffff,size:.003}))));
  g.add(mesh(new T.SphereGeometry(.036,18,12,0,Math.PI*2,0,Math.PI*.82),M('dome',()=>new T.MeshStandardMaterial({color:0xeef6ff,transparent:true,opacity:.22,roughness:.03,metalness:.1,depthWrite:false})),0,.058,0));return g;},
 // wind-up chattering teeth: gums, two rows of teeth, orange feet, wind key
 teeth(){const gum=col(0xd8606a,{roughness:.5}),tooth=col(0xf4f0e2,{roughness:.3}),foot=col(0xf08a1c,{roughness:.5});const g=new T.Group();
  const jaw=(y,flip)=>{const j=new T.Group();const sh=new T.CylinderGeometry(.03,.03,.012,14,1,false,-Math.PI/2,Math.PI);sh.scale(1,1,.9);j.add(mesh(sh,gum,0,0,0));
   for(let i=0;i<8;i++){const a=-Math.PI/2+(i+.5)/8*Math.PI;j.add(mesh(new T.BoxGeometry(.008,.009,.005),tooth,Math.sin(a)*.026,flip*.009,Math.cos(a)*.024,0,a,0));}j.position.y=y;return j;};
  const lower=jaw(.018,1),upper=jaw(.04,-1);upper.rotation.x=-.25;upper.position.z=-.004;g.add(lower,upper);
  for(const s of[-1,1])g.add(mesh(new T.BoxGeometry(.014,.008,.026),foot,s*.017,.004,.004));g.add(mesh(new T.BoxGeometry(.002,.012,.012),col(0xc8c8c8,{metalness:.7,roughness:.3}),0,.03,-.032));return g;},
 pager(){const pl=col(0x1c1c1e,{roughness:.6}),fr=M('pgr',()=>std(tx('pager'),{roughness:.5}));const o=box6(.064,.032,.018,[pl,pl,pl,pl,fr,pl]);o.position.y=.016;
  const g=grp(o,mesh(new T.BoxGeometry(.03,.026,.003),pl,0,.016,-.0105));return g;},
 polaroid(){const back=col(0x2a2a2c,{roughness:.8}),f=M('pol',()=>std(tx('polaroid'),{roughness:.6})),e=col(0xeeeae0,{roughness:.8});const o=box6(.088,.0012,.107,[e,e,f,back,e,e]);o.position.y=.0006;return grp(o);},
};
export async function prepare130(){try{if(!vendingDrinkTextures()?.petLabel)await initializeVendingTextures();}catch(e){}}
