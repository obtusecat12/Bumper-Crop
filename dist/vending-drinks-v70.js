// Metre-scale 2005–2010 vending drinks. No renderer captures, transmission
// materials, generated canvas labels, or per-container frame loop.
// All artwork is supplied as real image textures by the caller.
export const VENDING_DRINK_VERSION = 70;
const TAU = Math.PI * 2;
const EMPTY_TEXTURES = Object.freeze({});
const caches = new WeakMap();
const aliases = Object.freeze({pet:'pet','pet-almond':'pet','almond-pet':'pet',can:'can','canned-almond':'can','almond-can':'can',soy:'soy','lucky-soy':'soy','lucky-soy-milk':'soy'});
function frozenProfile(profile) {
  profile.centerOfMass = Object.freeze(profile.centerOfMass);
  profile.compoundSegments = Object.freeze(profile.compoundSegments.map(p => Object.freeze(p)));
  profile.segments = profile.compoundSegments;
  return Object.freeze(profile);
}
export const VENDING_DRINK_PROFILES = Object.freeze({
  pet: frozenProfile({type:'pet',height:.218,radius:.032,mass:.520,friction:.48,restitution:.19,rollingFriction:.008,centerOfMass:[0,.098,0],
    compoundSegments:[{y0:0,y1:.027,r0:.029,r1:.031},{y0:.027,y1:.145,r0:.031,r1:.031},{y0:.145,y1:.172,r0:.031,r1:.025},{y0:.172,y1:.190,r0:.025,r1:.0138},{y0:.190,y1:.218,r0:.0151,r1:.0151}]}),
  can: frozenProfile({type:'can',height:.115,radius:.033,mass:.348,friction:.39,restitution:.23,rollingFriction:.005,centerOfMass:[0,.056,0],
    compoundSegments:[{y0:0,y1:.011,r0:.0273,r1:.033},{y0:.011,y1:.100,r0:.033,r1:.033},{y0:.100,y1:.115,r0:.033,r1:.0288}]}),
  soy: frozenProfile({type:'soy',height:.225,radius:.037,mass:.540,friction:.53,restitution:.16,rollingFriction:.012,centerOfMass:[0,.095,0],
    compoundSegments:[{y0:0,y1:.022,r0:.0345,r1:.0369},{y0:.022,y1:.151,r0:.0369,r1:.0369},{y0:.151,y1:.187,r0:.0369,r1:.0230},{y0:.187,y1:.210,r0:.0230,r1:.0190},{y0:.210,y1:.225,r0:.0205,r1:.0205}]})
});
export function normalizeVendingDrinkType(type) { return aliases[type] || 'pet'; }
export function vendingDrinkName(type) { return normalizeVendingDrinkType(type)==='soy' ? 'Lucky Soy Milk' : normalizeVendingDrinkType(type)==='can' ? 'Almond Water · 330 mL Can' : 'Almond Water · 500 mL PET Bottle'; }

// A small static merger keeps the screw thread, fluted closure, seams and
// embossed ribs together by material rather than submitting one draw per rib.
function merge(T, list) {
  if (!list.length) return null;
  let count=0,indexCount=0;
  for(const g of list) {count+=g.attributes.position.count;indexCount+=g.index?g.index.count:g.attributes.position.count;}
  const position=new Float32Array(count*3),normal=new Float32Array(count*3),uv=new Float32Array(count*2);
  const indices=count>65535?new Uint32Array(indexCount):new Uint16Array(indexCount);
  let offset=0,indexOffset=0;
  for(const g of list) {
    if(!g.attributes.normal)g.computeVertexNormals();
    position.set(g.attributes.position.array,offset*3);normal.set(g.attributes.normal.array,offset*3);
    if(g.attributes.uv)uv.set(g.attributes.uv.array,offset*2);
    if(g.index)for(let i=0;i<g.index.count;i++)indices[indexOffset++]=offset+g.index.getX(i);
    else for(let i=0;i<g.attributes.position.count;i++)indices[indexOffset++]=offset+i;
    offset+=g.attributes.position.count;g.dispose();
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(position,3));g.setAttribute('normal',new T.BufferAttribute(normal,3));g.setAttribute('uv',new T.BufferAttribute(uv,2));g.setIndex(new T.BufferAttribute(indices,1));g.computeBoundingBox();g.computeBoundingSphere();return g;
}
function lathe(T, profile, segments=24) {
  const g=new T.LatheGeometry(profile.map(p=>new T.Vector2(...p)),segments);
  // Seam is on -Z; front artwork is centred at u=.5 on +Z.
  g.rotateY(Math.PI);return g;
}
function ring(T,r,y,tube,segments=24,tubeSegments=4) {
  const g=new T.TorusGeometry(r,tube,tubeSegments,segments);g.rotateX(Math.PI*.5);g.translate(0,y,0);return g;
}
function tube(T,points,r,radialSegments=4,pathSegments=32) {
  return new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),pathSegments,r,radialSegments,false);
}
function helix(T,r,y,height,turns=2.2,wire=.0004,n=60) {
  return tube(T,Array.from({length:n+1},(_,i)=>{const a=TAU*turns*i/n;return[Math.sin(a)*r,y+height*i/n,Math.cos(a)*r];}),wire,4,n);
}
function curvedLabel(T,r,y0,y1,{span=TAU,front=true,segments=24}={}) {
  const phiStart=span===TAU?Math.PI:(front?-span*.5:Math.PI-span*.5);
  return new T.LatheGeometry([new T.Vector2(r,y0),new T.Vector2(r,y1)],segments,phiStart,span);
}
function cappedDisk(T,r,y,segments=32) {
  const g=new T.CircleGeometry(r,segments);g.rotateX(-Math.PI*.5);g.translate(0,y,0);
  return planarTopUV(g,r);
}
function planarTopUV(g,r) {
  const p=g.attributes.position,a=g.attributes.uv;
  for(let i=0;i<p.count;i++)a.setXY(i,.5+p.getX(i)/(2*r),.5+p.getZ(i)/(2*r));return g;
}
function flutedClosure(T,profile,segments=32,count=32,relief=.00024) {
  const g=lathe(T,profile,segments),p=g.attributes.position;
  for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),r=Math.hypot(x,z),y=p.getY(i);if(r<.003)continue;
    const slope=1+relief/r*(.48+.52*Math.cos(Math.atan2(x,z)*count));p.setXYZ(i,x*slope,y,z*slope);}
  g.computeVertexNormals();return g;
}
function makePet(T) {
  const buckets={shell:[],liquid:[],label:[],closure:[],seam:[]},n=24;
  const profile=[[0,.011],[.010,.010],[.022,.006],[.028,0],[.0305,.0035],[.0316,.009],[.0316,.018],[.0312,.025],
    [.0312,.041],[.0317,.044],[.0312,.047],[.0312,.062],[.0312,.132],[.0316,.135],[.0312,.139],
    [.0310,.147],[.0304,.154],[.0284,.164],[.0250,.173],[.0200,.181],[.0153,.187],[.0133,.192],[.0133,.202],[.0120,.205],[0,.205]];
  const shell=lathe(T,profile,n),pos=shell.attributes.position;
  // The five feet and recessed push-up are a molded bottle base, not a disc.
  for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i),r=Math.hypot(x,z),y=pos.getY(i);if(r<.021||y>.025)continue;
    const a=Math.atan2(x,z),lift=.0048*(.5+.5*Math.cos(a*5))*Math.max(0,1-y/.028);
    pos.setXYZ(i,x*(1-.011*Math.cos(a*5)),y+lift,z*(1-.011*Math.cos(a*5)));}
  // Translate the lower contact locus exactly to y=0 after the 24-sector feet.
  shell.computeBoundingBox();const minimum=shell.boundingBox.min.y;shell.translate(0,-minimum,0);shell.computeVertexNormals();buckets.shell.push(shell);
  buckets.shell.push(ring(T,.0137,.196,.0008,n),ring(T,.0141,.202,.0007,n));
  // Neck thread is visible in the short gap below the fitted cap.
  buckets.shell.push(helix(T,.0137,.193,.010,2.15,.00038,48));
  // Fine injection seam sits ON the shell and is partially obscured by label.
  for(const a of [-.97,Math.PI-.97]){
    const pts=profile.filter(p=>p[0]>.014&&p[1]>.018&&p[1]<.186).map(([r,y])=>[Math.sin(a)*(r+.00008),y,Math.cos(a)*(r+.00008)]);
    buckets.seam.push(tube(T,pts,.000085,3,20));
  }
  const liquidProfile=[[0,.013],[.020,.013],[.0276,.016],[.0295,.025],[.0297,.141],[.0292,.150],[.027,.161],[.0258,.166],[0,.166]];
  buckets.liquid.push(lathe(T,liquidProfile,n));
  buckets.label.push(curvedLabel(T,.03152,.065,.132,{segments:n}));
  // Closure contains a rounded cap crown, genuine vertical grip ridges, lower
  // anti-tamper collar and short break-away connecting bridges.
  buckets.closure.push(flutedClosure(T,[[0,.218],[.0115,.218],[.0140,.2173],[.0148,.2155],[.0148,.2058],[.0143,.2048],[.0136,.2048]],32,16,.00023));
  buckets.closure.push(lathe(T,[[.0136,.2023],[.0148,.2023],[.0150,.2029],[.0150,.2044],[.0147,.2050],[.0136,.2050]],n));
  for(let i=0;i<8;i++){const a=i*TAU/8,g=new T.BoxGeometry(.00062,.0011,.00060);g.translate(Math.sin(a)*.0145,.2051,Math.cos(a)*.0145);buckets.closure.push(g);}
  return buckets;
}
function dentCan(g) {
  const p=g.attributes.position;
  for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),r=Math.hypot(x,z),y=p.getY(i);if(r<.032||y<.02||y>.095)continue;
    const a=Math.atan2(x,z),wrap=v=>Math.atan2(Math.sin(v),Math.cos(v));
    const depth=.00032*Math.exp(-(((y-.041)/.013)**2)- ((wrap(a-1.45)/.24)**2))+.00018*Math.exp(-(((y-.078)/.016)**2)-((wrap(a+2.2)/.32)**2));
    const scale=1-depth/r;p.setXYZ(i,x*scale,y,z*scale);}
  g.computeVertexNormals();return g;
}
function ellipseShape(T,rx,ry) {
  const shape=new T.Shape();shape.absellipse(0,0,rx,ry,0,TAU,false,0);return shape;
}
function makeCan(T) {
  const b={metal:[],label:[],lid:[],recess:[]},n=32;
  // Rolled bottom foot, concave push-up, wall, necking and seamed top shoulder.
  const profile=[[0,.0070],[.017,.0070],[.0235,.0050],[.0263,.0011],[.0273,0],[.0284,.0004],[.0295,.0022],[.0290,.0048],
    [.0293,.0065],[.0318,.0090],[.033,.0117],[.033,.031],[.033,.059],[.033,.087],[.033,.098],
    [.0325,.101],[.0304,.105],[.0283,.1081],[.0283,.1130],[.0275,.1130],[0,.1129]];
  b.metal.push(dentCan(lathe(T,profile,n)),ring(T,.0277,.0017,.0012,n),ring(T,.0283,.1140,.0010,n));
  b.label.push(dentCan(curvedLabel(T,.03306,.014,.0987,{segments:n})));
  // Separate recessed end panel uses the generated top-view photograph with
  // radial UVs; ring, rivet and recessed score remain independent real metal.
  b.lid.push(cappedDisk(T,.02755,.11291,n),planarTopUV(ring(T,.0259,.11295,.00038,n),.02755));
  // The physical tab follows the generated lid image: finger hole toward +Z,
  // rivet near the centre. Every raised face uses the SAME planar end-panel UV
  // as the lid below it, so the photograph cannot produce a second pull ring.
  const tab=ellipseShape(T,.00825,.0123),hole=new T.Path();hole.absellipse(0,.0063,.00515,.00410,0,TAU,true,0);tab.holes.push(hole);
  const tabGeom=new T.ExtrudeGeometry(tab,{steps:1,depth:.00048,bevelEnabled:true,bevelSize:.00022,bevelThickness:.00018,bevelSegments:1,curveSegments:10});
  tabGeom.rotateX(Math.PI*.5);tabGeom.translate(0,.11355,.00475);b.lid.push(planarTopUV(tabGeom,.02755));
  const rivet=new T.CylinderGeometry(.0019,.0021,.00072,12,1);rivet.translate(0,.11331,-.00050);b.lid.push(planarTopUV(rivet,.02755));
  // A subtle scored drink opening is cast into the end rather than a floating
  // opaque sticker. The can is sealed, so this recess does not become a hole.
  const score=[];for(let i=0;i<=32;i++){const a=TAU*i/32;score.push([Math.sin(a)*.0109,.11308,Math.cos(a)*.0105-.0122]);}
  b.recess.push(tube(T,score,.00013,3,32));
  return b;
}
function makeSoy(T) {
  const b={body:[],front:[],back:[],closure:[],seam:[]},n=28;
  const profile=[[0,.009],[.020,.009],[.031,.004],[.0338,0],[.0353,.0007],[.0364,.004],[.0369,.010],[.0369,.025],
    [.0366,.029],[.0366,.045],[.0367,.052],[.0367,.146],[.0369,.151],[.0361,.159],[.0338,.169],
    [.0302,.178],[.0258,.187],[.0212,.195],[.0187,.202],[.0187,.211],[.0180,.213],[0,.213]];
  b.body.push(lathe(T,profile,n));
  // A mild moulded base ring and thick neck lip belong to inexpensive HDPE.
  b.body.push(ring(T,.0360,.013,.00072,n),ring(T,.0194,.208,.00085,n),helix(T,.01915,.201,.010,1.65,.00040,40));
  b.front.push(curvedLabel(T,.03691,.059,.145,{span:1.91,front:true,segments:16}));
  b.back.push(curvedLabel(T,.03691,.063,.141,{span:1.62,front:false,segments:16}));
  for(const a of [Math.PI*.5,-Math.PI*.5]){
    const pts=profile.filter(p=>p[0]>.020&&p[1]>.022&&p[1]<.194).map(([r,y])=>[Math.sin(a)*(r+.00008),y,Math.cos(a)*(r+.00008)]);
    b.seam.push(tube(T,pts,.00014,3,20));
  }
  b.closure.push(flutedClosure(T,[[0,.225],[.0169,.225],[.0195,.2241],[.0202,.2227],[.0202,.2132],[.0197,.2118],[.0186,.2118]],32,16,.00020));
  b.closure.push(lathe(T,[[.0187,.2093],[.0202,.2093],[.0205,.2100],[.0205,.2114],[.0201,.2120],[.0187,.2120]],n));
  for(let i=0;i<10;i++){const a=i*TAU/10,g=new T.BoxGeometry(.0007,.0010,.0007);g.translate(Math.sin(a)*.01985,.2120,Math.cos(a)*.01985);b.closure.push(g);}
  return b;
}
function getCache(T) {
  let cache=caches.get(T);if(cache)return cache;
  cache={geometries:new Map(),materials:new WeakMap(),resources:new Set()};caches.set(T,cache);return cache;
}
function geometryTemplate(T,type,cache) {
  if(cache.geometries.has(type))return cache.geometries.get(type);
  const buckets=(type==='can'?makeCan:type==='soy'?makeSoy:makePet)(T),parts=[];
  for(const [slot,gs] of Object.entries(buckets)){const geometry=merge(T,gs);cache.resources.add(geometry);parts.push({slot,geometry});}
  cache.geometries.set(type,parts);return parts;
}
function findMap(textures,key) {return textures[key] || textures[key.replace(/[A-Z]/g,c=>'-'+c.toLowerCase())] || null;}
function materials(T,type,textures,cache) {
  let byType=cache.materials.get(textures);if(!byType){byType=new Map();cache.materials.set(textures,byType);}
  if(byType.has(type))return byType.get(type);
  const mat=(name,options)=>{const m=new T.MeshStandardMaterial({...options,name});m.userData.vendingDrinkShared=true;cache.resources.add(m);return m;};
  const normal=key=>findMap(textures,key),rough=key=>findMap(textures,key);
  const p={};
  if(type==='pet'){
    p.shell=mat('Thin molded PET plastic — no physical transmission',{color:'#d2e0ce',transparent:true,opacity:.22,roughness:.24,metalness:0,depthWrite:true,side:T.DoubleSide,forceSinglePass:true,normalMap:normal('petPlasticNormal'),roughnessMap:rough('petPlasticRoughness'),normalScale:new T.Vector2(.12,.12)});
    p.liquid=mat('Light amber almond water — single contained body',{color:'#c8b77b',transparent:true,opacity:.60,roughness:.15,metalness:0,depthWrite:false});
    p.label=mat('2010 Almond Water PET wrap artwork',{color:0xffffff,map:findMap(textures,'petLabel'),normalMap:normal('petNormal'),roughnessMap:rough('petRoughness'),roughness:.63,metalness:0,normalScale:new T.Vector2(.22,.22),side:T.DoubleSide});
    p.closure=mat('Injection molded blue PET screw closure',{color:'#a8c8dc',map:findMap(textures,'plasticBody'),roughness:.52,metalness:0,normalMap:normal('capNormal'),normalScale:new T.Vector2(.16,.16)});
    p.seam=mat('PET mould line',{color:'#dce6de',map:findMap(textures,'plasticBody'),transparent:true,opacity:.33,roughness:.32,depthWrite:false});
  } else if(type==='can'){
    p.metal=mat('Drawn aluminum can and physical pull ring',{color:'#c1c4c1',map:findMap(textures,'metal'),roughness:.33,metalness:1,normalMap:normal('canMetalNormal'),normalScale:new T.Vector2(.12,.12)});
    p.label=mat('2010 printed Almond Water aluminum can',{color:0xffffff,map:findMap(textures,'canLabel'),normalMap:normal('canNormal'),roughnessMap:rough('canRoughness'),metalness:.30,roughness:.45,normalScale:new T.Vector2(.18,.18)});
    p.lid=mat('Generated radial-UV aluminum end panel',{color:0xffffff,map:findMap(textures,'canTop'),normalMap:normal('canTopNormal'),roughnessMap:rough('canTopRoughness'),metalness:.94,roughness:.33,normalScale:new T.Vector2(.28,.28)});
    p.recess=mat('Embossed lid score and indentation',{color:'#626965',map:findMap(textures,'metal'),metalness:.82,roughness:.43});
  } else {
    p.body=mat('Thick warm white HDPE milk bottle',{color:'#e8e5d4',map:findMap(textures,'plasticBody'),roughness:.54,metalness:0,normalMap:normal('soyPlasticNormal'),roughnessMap:rough('soyPlasticRoughness'),normalScale:new T.Vector2(.15,.15)});
    p.front=mat('2005 Lucky Soy Milk front label',{color:0xffffff,map:findMap(textures,'soyFront'),normalMap:normal('soyNormal'),roughnessMap:rough('soyRoughness'),roughness:.73,metalness:0,normalScale:new T.Vector2(.18,.18)});
    p.back=mat('Lucky Soy Milk full English ingredient panel',{color:0xffffff,map:findMap(textures,'soyBack'),normalMap:normal('soyBackNormal')||normal('soyNormal'),roughnessMap:rough('soyBackRoughness')||rough('soyRoughness'),roughness:.74,metalness:0,normalScale:new T.Vector2(.18,.18)});
    p.closure=mat('Period pale green HDPE fluted milk-bottle lid',{color:'#a2b7a0',map:findMap(textures,'plasticBody'),roughness:.56,metalness:0,normalMap:normal('capNormal'),normalScale:new T.Vector2(.15,.15)});
    p.seam=mat('Milk bottle raised parting seam',{color:'#ece9d9',map:findMap(textures,'plasticBody'),roughness:.61,metalness:0});
  }
  byType.set(type,p);return p;
}

/**
 * createVendingDrink(T, 'pet'|'can'|'soy', {textures})
 * Returns a bottom-pivot group; labels face +Z; both group and model refer to
 * the same instance. Static geometry/materials are shared between instances.
 * A world body rotates this group around physicalProfile.centerOfMass. A held
 * inspection item can be centered with group.position.y=-height/2, exactly as
 * the existing almond inspection does. No glass-layer pass is required.
 */
export function createVendingDrink(T,type,{textures=EMPTY_TEXTURES}={}) {
  type=normalizeVendingDrinkType(type);const cache=getCache(T),parts=geometryTemplate(T,type,cache),mats=materials(T,type,textures,cache),group=new T.Group(),profile=VENDING_DRINK_PROFILES[type];
  group.name=vendingDrinkName(type);let triangles=0,vertices=0,bytes=0;
  for(const {slot,geometry} of parts){const mesh=new T.Mesh(geometry,mats[slot]);mesh.name=group.name+' / '+slot;mesh.castShadow=slot!=='shell'&&slot!=='liquid'&&slot!=='seam';mesh.receiveShadow=true;
    mesh.userData.vendingDrinkPart=slot;mesh.userData.vendingDrinkShared=true;
    // Render the contained liquid before the thin PET skin. Labels remain
    // opaque and use ordinary depth testing without a separate scene capture.
    if(slot==='liquid')mesh.renderOrder=2;if(slot==='shell'||slot==='seam')mesh.renderOrder=3;
    group.add(mesh);triangles+=(geometry.index?.count||geometry.attributes.position.count)/3;vertices+=geometry.attributes.position.count;
    bytes+=Object.values(geometry.attributes).reduce((sum,a)=>sum+a.array.byteLength,0)+(geometry.index?.array.byteLength||0);
  }
  const report={type,height:profile.height,radius:profile.radius,triangles,vertices,geometryBytes:bytes,drawCalls:parts.length,sharedGeometry:true,sharedMaterials:true,frontAxis:'+Z',pivot:'bottom',rendererCaptures:0};
  Object.assign(group.userData,{vendingDrink:true,vendingDrinkType:type,almondHeight:profile.height,vendingDrinkHeight:profile.height,physicalProfile:profile,report});
  return {group,model:group,physicalProfile:profile,report};
}
export function releaseVendingDrink(value) {
  const group=value?.group||value?.model||value;if(!group)return;group.removeFromParent();group.clear();
}
export function isSharedVendingDrinkResource(T,resource) {return caches.get(T)?.resources.has(resource)||false;}
