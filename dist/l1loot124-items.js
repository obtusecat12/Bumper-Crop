// V124-L1 loot · item models. Every item is real low-poly geometry with its own individually generated, then
// down-sampled texture (assets/l1-loot-v124, sources art-l1loot124/, tools/l1loot124_assets.py). Box-like items use a
// six-face unwrap atlas (3×2 cells, three.js BoxGeometry face order). Named re-uses: canned food (Level 10 pantry tins),
// almond water + Lucky Soy Milk (Level 10/11 vending models), fruit (Lantern Reef canoe buffet geometry + textures).
import * as T from './vendor/three.module.min.js';
import {makeFloorCans,initializeCanTextures} from './canned-food.js?v=60';
import {makeAlmondBottle,almondVariant} from './almond-water-assets.js?v=60';
import {createVendingDrink} from './vending-drinks-v70.js';
import {vendingDrinkTextures} from './vending-materials-v70.js';

const A='./assets/l1-loot-v124/';
const loader=new T.TextureLoader(),texCache=new Map();
function tex(name,{rep=false,nearest=true}={}){if(texCache.has(name))return texCache.get(name);const t=loader.load(new URL(A+name+'.webp?v=124',import.meta.url).href);
 t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=rep?T.RepeatWrapping:T.ClampToEdgeWrapping;t.magFilter=nearest?T.NearestFilter:T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.anisotropy=2;texCache.set(name,t);return t;}
const fruitTex=(n)=>{const k='fruit:'+n;if(texCache.has(k))return texCache.get(k);const t=loader.load(new URL('./textures/tiki-v77/fruit/'+n+'.webp',import.meta.url).href);t.colorSpace=/normal/.test(n)?T.NoColorSpace:T.SRGBColorSpace;t.anisotropy=2;texCache.set(k,t);return t;};
const matCache=new Map();
function M(key,make){if(!matCache.has(key))matCache.set(key,make());return matCache.get(key);}
const std=(map,o={})=>new T.MeshStandardMaterial({map,roughness:.78,metalness:0,...o});
// ---- geometry helpers ----
function boxAtlas(w,h,d){const g=new T.BoxGeometry(w,h,d),uv=g.attributes.uv;for(let f=0;f<6;f++){const cx=(f%3)/3,cy=1-(Math.floor(f/3)+1)/2;for(let i=0;i<4;i++){const k=f*4+i;uv.setXY(k,cx+uv.getX(k)/3,cy+uv.getY(k)/2);}}return g;}
function bumpy(g,amp,seed){const p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),n=1+amp*(Math.sin(x*41+seed)*Math.sin(y*37+seed*2)+Math.sin(z*29+seed*3)*.6);p.setXYZ(i,x*n,y*n,z*n);}g.computeVertexNormals();return g;}
const mesh=(g,m,x=0,y=0,z=0,rx=0,ry=0,rz=0)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);o.rotation.set(rx,ry,rz);return o;};
const grp=(...c)=>{const g=new T.Group();if(c.length)g.add(...c);return g;};

// ---- item definitions (shared with the yellow inventory: inventory117 ITEMS mirror these ids) ----
export const LOOT_ITEMS={
 can:{name:'罐头',size:.12},almond:{name:'杏仁水',size:.2},soy:{name:'幸运豆奶',size:.23},
 bandage:{name:'医用纱布',size:.1},battery:{name:'电池',size:.05},soap:{name:'茉莉香皂',size:.09},sanitizer:{name:'免洗洗手液',size:.17},
 charger:{name:'手机充电器',size:.11},matches:{name:'火柴',size:.06},lighter:{name:'打火机',size:.08},knife:{name:'猎刀',size:.24},axe:{name:'手斧',size:.38},
 watch:{name:'旧手表',size:.1},yarn:{name:'毛线团',size:.1},junk:{name:'垃圾',size:.12},foam:{name:'一把泡沫颗粒',size:.08},peas:{name:'一把干豌豆',size:.06},
 pineapple:{name:'菠萝',size:.3},melon:{name:'哈密瓜',size:.2},papaya:{name:'木瓜',size:.22},
 fuyou:{name:'福友玉',size:.09},squirt:{name:'滋水枪',size:.36},berries:{name:'迁跃浆果',size:.12},
 chemical:{name:'化学制剂',size:.18},dynamite:{name:'炸药',size:.2},nitrogen:{name:'固态氮块',size:.12},glass:{name:'碎玻璃',size:.15},
};

// ---- models: build(meta) -> Object3D, origin at its resting bottom centre ----
const B={
 can(m){const kinds=['soup','peas','tuna','peaches'],k=kinds[(m?.v|0)%4],tuna=k==='tuna';return makeFloorCans([{kind:k,x:0,z:0,radius:tuna?.054:.047,height:tuna?.044:k==='peaches'?.145:.113,side:!!m?.side,yaw:0}]);},
 almond(m){const g=makeAlmondBottle(almondVariant(m?.id||'l1loot'));return g;},
 soy(){return createVendingDrink(T,'soy',{textures:vendingDrinkTextures()}).group;},
 bandage(){return grp(mesh(boxAtlas(.1,.045,.072),M('gauzeBox',()=>std(tex('box_gauze'))),0,.0225,0),
  mesh(new T.CylinderGeometry(.028,.028,.06,10),M('gauze',()=>std(tex('gauze',{rep:true}),{roughness:.95})),.075,.028,.01,Math.PI/2,0,0));},
 battery(){const g=new T.CylinderGeometry(.007,.007,.05,10);const lab=M('batt',()=>[std(tex('battery'),{metalness:.2,roughness:.5}),std(null,{color:0x888c90,metalness:.7,roughness:.35}),std(null,{color:0x55585a,metalness:.7,roughness:.4})]);
  const o=grp(mesh(g,lab,0,.007,0,0,0,Math.PI/2),mesh(new T.CylinderGeometry(.0026,.0026,.002,6),lab[1],.026,.007,0,0,0,Math.PI/2));return o;},
 soap(){return grp(mesh(boxAtlas(.09,.032,.058),M('soapBox',()=>std(tex('box_soap'))),0,.016,0));},
 sanitizer(){const pts=[[0,0],[.028,0],[.03,.006],[.03,.1],[.024,.118],[.011,.124],[.011,.13]].map(([x,y])=>new T.Vector2(x,y));const body=new T.LatheGeometry(pts,14);
  return grp(mesh(body,M('sani',()=>std(tex('sanitizer'),{roughness:.25,transparent:true,opacity:.92})),0,0,0),mesh(new T.CylinderGeometry(.009,.011,.022,8),M('pump',()=>std(null,{color:0xf2f2ee,roughness:.4})),0,.141,0),
   mesh(new T.BoxGeometry(.034,.007,.009),M('pump',()=>std(null,{color:0xf2f2ee,roughness:.4})),.012,.15,0));},
 charger(){return grp(mesh(boxAtlas(.065,.1,.04),M('chgBox',()=>std(tex('box_charger'))),0,.02,0,-Math.PI/2,0,0));},
 matches(){return grp(mesh(boxAtlas(.036,.016,.054),M('match',()=>std(tex('box_match'))),0,.008,0));},
 lighter(){const body=new T.BoxGeometry(.024,.06,.011);return grp(mesh(body,M('lighter',()=>std(tex('lighter'),{roughness:.3,transparent:true,opacity:.95})),0,.006,0,-Math.PI/2,0,0),
  mesh(new T.BoxGeometry(.024,.013,.012),M('hood',()=>std(null,{color:0xb8bcc0,metalness:.8,roughness:.3})),0,.006,-.036,-Math.PI/2,0,0));},
 knife(){// cut-out card (blade + handle silhouette) doubled for thickness
  const m=M('knife',()=>std(tex('knife'),{alphaTest:.5,side:T.DoubleSide,metalness:.35,roughness:.45}));const g=new T.PlaneGeometry(.26,.13);
  return grp(mesh(g,m,0,.003,0,-Math.PI/2,0,0),mesh(g,m,0,.009,0,-Math.PI/2,0,0));},
 axe(){const head=M('axeHead',()=>std(tex('axehead'),{alphaTest:.5,side:T.DoubleSide,metalness:.4,roughness:.5})),wood=M('hickory',()=>std(tex('hickory',{rep:true}),{roughness:.7}));
  const hg=new T.PlaneGeometry(.15,.15);return grp(mesh(new T.BoxGeometry(.38,.028,.022),wood,0,.014,0),mesh(hg,head,.17,.016,-.03,-Math.PI/2,0,0),mesh(hg,head,.17,.03,-.03,-Math.PI/2,0,0));},
 watch(){const strap=M('strap',()=>std(tex('strap'),{roughness:.85})),dial=M('dial',()=>std(tex('watchdial'),{alphaTest:.5,roughness:.3})),steel=M('steel',()=>std(null,{color:0xb4b0a6,metalness:.8,roughness:.3}));
  return grp(mesh(new T.BoxGeometry(.018,.004,.2),strap,0,.002,0),mesh(new T.CylinderGeometry(.019,.019,.008,16),steel,0,.006,0),mesh(new T.CircleGeometry(.017,16),dial,0,.0102,0,-Math.PI/2,0,0));},
 yarn(m){const v=(m?.v|0)%2;const g=bumpy(new T.IcosahedronGeometry(.05,2),.04,v*3+1);return grp(mesh(g,M('yarn'+v,()=>std(tex(v?'yarn_b':'yarn_a',{rep:true}),{roughness:1})),0,.048,0));},
 junk(m){const v=(m?.v|0)%3;if(v===0)return grp(mesh(bumpy(new T.IcosahedronGeometry(.045,1),.22,2),M('jpaper',()=>std(tex('junk_paper'),{roughness:.9})),0,.04,0));
  if(v===1){const g=new T.PlaneGeometry(.2,.16,5,4),p=g.attributes.position;for(let i=0;i<p.count;i++)p.setZ(i,Math.sin(p.getX(i)*40)*.012+Math.cos(p.getY(i)*47)*.01);g.computeVertexNormals();return grp(mesh(g,M('jbag',()=>std(tex('junk_bag'),{side:T.DoubleSide,roughness:.6})),0,.015,0,-Math.PI/2,0,.4));}
  const g=bumpy(new T.CylinderGeometry(.038,.04,.06,9,2),.18,5);g.scale(1,.45,1);return grp(mesh(g,M('jtin',()=>std(tex('junk_tin'),{metalness:.4,roughness:.6})),0,.015,0,.2,0,.3));},
 foam(){return grp(mesh(bumpy(new T.IcosahedronGeometry(.04,1),.25,7),M('foamLump',()=>std(tex('foam',{rep:true}),{roughness:1})),0,.03,0));},
 peas(){return grp(mesh(bumpy(new T.SphereGeometry(.035,8,5,0,Math.PI*2,0,Math.PI/2),.2,4),M('peaLump',()=>std(tex('peas',{rep:true}))),0,0,0));},
 // Lantern Reef canoe buffet fruit: same sphere parameterisation, deformers and generated PBR textures
 pineapple(){const g=new T.SphereGeometry(1,16,12),p=g.attributes.position;for(let i=0;i<p.count;i++){const a=p.getX(i),b=p.getY(i),c=p.getZ(i),f=1+.012*Math.sin(Math.atan2(a,c)*14)*Math.sin(b*21);p.setXYZ(i,a*f,b,c*f);}g.computeVertexNormals();
  const body=mesh(g,M('pine',()=>std(fruitTex('pineapple-basecolor'),{normalMap:fruitTex('pineapple-normal'),roughness:.8})),0,.215*.62,0);body.scale.set(.145*.62,.215*.62,.145*.62);
  const crown=M('crown',()=>std(fruitTex('pineapple-crown'),{alphaTest:.35,side:T.DoubleSide,roughness:.72}));const cg=new T.PlaneGeometry(.51*.55,.47*.55);
  return grp(body,mesh(cg,crown,0,.215*.62*2+.08,0,0,.25,0),mesh(cg,crown,0,.215*.62*2+.08,0,0,Math.PI/2+.25,0));},
 melon(){const g=new T.SphereGeometry(1,16,12),p=g.attributes.position;for(let i=0;i<p.count;i++){const a=p.getX(i),b=p.getY(i),c=p.getZ(i),f=1-.014*Math.cos(Math.atan2(a,c)*10);p.setXYZ(i,a*f,b,c*f);}g.computeVertexNormals();
  const o=mesh(g,M('melon',()=>std(fruitTex('cantaloupe-basecolor'),{normalMap:fruitTex('cantaloupe-normal'),roughness:.85})),0,.168*.62,0);o.scale.set(.196*.62,.168*.62,.187*.62);return grp(o);},
 papaya(m){const g=new T.SphereGeometry(1,14,10),p=g.attributes.position;for(let i=0;i<p.count;i++){const v=p.getY(i),f=.86+.14*Math.sin((v+1)*1.6);p.setX(i,p.getX(i)*f);p.setZ(i,p.getZ(i)*f);}g.computeVertexNormals();
  const k=(m?.v|0)%2?'green':'yellow';const o=mesh(g,M('papaya'+k,()=>new T.MeshPhysicalMaterial({map:fruitTex('papaya-'+k+'-basecolor'),normalMap:fruitTex('papaya-'+k+'-normal'),roughness:.48,clearcoat:.55,clearcoatRoughness:.22})),0,.06,0,0,0,Math.PI/2);o.scale.set(.106*.62,.221*.62,.098*.62);return grp(o);},
 fuyou(){const g=bumpy(new T.IcosahedronGeometry(.045,1),.18,9);g.scale(1.25,.8,1);const m=new T.MeshStandardMaterial({map:tex('jade',{rep:true}),roughness:.35,emissive:new T.Color(.15,.55,.25),emissiveIntensity:.15});
  const o=grp(mesh(g,m,0,.036,0));o.userData.glow=m;return o;},
 squirt(){const body=M('squirt',()=>std(tex('squirt'),{roughness:.45})),tank=M('tank',()=>std(tex('tank'),{roughness:.3,transparent:true,opacity:.85})),orange=M('orangeP',()=>std(null,{color:0xf07a18,roughness:.45}));
  return grp(mesh(new T.BoxGeometry(.3,.07,.035),body,0,.035,0),mesh(new T.CylinderGeometry(.009,.009,.1,8),orange,.19,.05,0,0,0,Math.PI/2),mesh(new T.BoxGeometry(.035,.09,.03),body,-.09,-.0,0,0,0,-.35),
   mesh(new T.CylinderGeometry(.05,.05,.16,12),tank,-.02,.05,-.09,0,0,Math.PI/2),mesh(new T.TorusGeometry(.06,.004,4,12,Math.PI),orange,-.02,.07,-.05,0,Math.PI/2,0));},
 berries(){const pun=M('punnet',()=>std(tex('punnet'),{transparent:true,opacity:.55,roughness:.2})),bm=M('berry',()=>std(tex('berry',{rep:true}),{roughness:.25}));const o=grp(mesh(new T.BoxGeometry(.11,.05,.08),pun,0,.025,0));
  const bg=new T.IcosahedronGeometry(.011,1);for(let i=0;i<14;i++)o.add(mesh(bg,bm,-.042+(i%5)*.021,.012+Math.floor(i/10)*.016,-.026+(Math.floor(i/5)%2)*.026+((i*7)%3)*.006));return o;},
 chemical(m){if((m?.v|0)%2===0){const pts=[[0,0],[.032,0],[.034,.004],[.034,.1],[.022,.122],[.012,.128],[.012,.14]].map(([x,y])=>new T.Vector2(x,y));
   return grp(mesh(new T.LatheGeometry(pts,12),M('chemB',()=>std(tex('chem_label'),{color:0xb89070,roughness:.15,metalness:.1})),0,0,0),mesh(new T.CylinderGeometry(.014,.014,.018,10),M('cap',()=>std(null,{color:0x161616,roughness:.6})),0,.148,0));}
  const j=M('chemJ',()=>std(tex('chem_jug'),{roughness:.6}));return grp(mesh(new T.BoxGeometry(.16,.22,.1),j,0,.11,0),mesh(new T.CylinderGeometry(.018,.018,.03,8),M('cap',()=>std(null,{color:0x161616,roughness:.6})),.05,.235,0),mesh(new T.BoxGeometry(.06,.025,.025),j,-.03,.235,0));},
 dynamite(){const w=M('dyn',()=>std(tex('dynamite'),{roughness:.6})),g=new T.CylinderGeometry(.014,.014,.2,10);const o=grp();for(let i=0;i<3;i++)o.add(mesh(g,w,0,.014+(i===2?.024:0),(i-1)*.029+(i===2?0:0)-(i===2?.029:0),0,0,Math.PI/2));
  o.add(mesh(new T.CylinderGeometry(.002,.002,.06,4),M('fuse',()=>std(null,{color:0x707070})),.12,.03,0,0,0,Math.PI/2));o.add(mesh(new T.BoxGeometry(.03,.05,.07),M('tape',()=>std(null,{color:0x101010,roughness:.4})),0,.024,-.014));return o;},
 nitrogen(m){const g=bumpy(new T.BoxGeometry(.11,.07,.09,2,2,2),.06,(m?.v|0)+11);const mm=M('n2',()=>new T.MeshStandardMaterial({map:tex('nitrogen',{rep:true}),roughness:.2,transparent:true,opacity:.88,emissive:new T.Color(.25,.32,.4),emissiveIntensity:.35}));return grp(mesh(g,mm,0,.035,0,0,(m?.v|0)*.7,0));},
 glass(m){const mm=M('glass',()=>new T.MeshStandardMaterial({map:tex('glass',{rep:true}),roughness:.05,metalness:.2,transparent:true,opacity:.42,side:T.DoubleSide,depthWrite:false}));const o=grp();
  for(let i=0;i<5;i++){const g=new T.BufferGeometry(),a=i*1.7+(m?.v|0),r=.06+(i%3)*.03;g.setAttribute('position',new T.Float32BufferAttribute([0,0,0,Math.cos(a)*r,0,Math.sin(a)*r,Math.cos(a+.7)*r*.7,0,Math.sin(a+.7)*r*.7],3));
   g.setAttribute('uv',new T.Float32BufferAttribute([0,0,1,0,.5,1],2));g.computeVertexNormals();o.add(mesh(g,mm,(i%3-1)*.05,.004+i*.006,((i*2)%3-1)*.04,.1*i,0,.15*(i%2)));}return o;},
};
export function makeLootModel(id,meta){const f=B[id];const o=f?f(meta):grp(mesh(new T.BoxGeometry(.08,.08,.08),M('fallback',()=>std(null,{color:0x888888}))));o.userData.lootId=id;return o;}
export async function prepareLootItems(){await initializeCanTextures().catch(()=>{});}
// ---- fill surfaces: seamless texture on an undulating low-poly bed (foam peanuts / peas / straw / shards) ----
export function makeFill(kind,w,d,seed){const nx=7,nz=6,g=new T.PlaneGeometry(w,d,nx,nz);g.rotateX(-Math.PI/2);const p=g.attributes.position,uv=g.attributes.uv;
 for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),edge=Math.min(w/2-Math.abs(x),d/2-Math.abs(z));const h=(Math.sin(x*17+seed)*Math.cos(z*13+seed*1.7)+Math.sin((x+z)*23+seed*.3)*.5)*.018*Math.min(1,edge/.06)+(edge<.02?.012:0);p.setY(i,h);
  const rp=kind==='peas'?3.2:kind==='foam'?2.2:1.6;uv.setXY(i,(x+w/2)*rp,(z+d/2)*rp);}
 g.computeVertexNormals();const m=M('fill'+kind,()=>std(tex(kind,{rep:true}),{roughness:kind==='foam'?1:.9}));return new T.Mesh(g,m);}
