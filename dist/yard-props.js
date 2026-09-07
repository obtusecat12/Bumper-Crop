import * as T from './vendor/three.module.min.js';
import {random,surfaceHeight,buildingSize} from './world.js?v=9';

// Sparse, reusable farm-yard workstations. Geometry is baked once, not animated,
// and every material is shared; only the returned merged geometries are owned.
// Props are decorative, including CLOSED moonshine vessels: no pickup records.
const shared=new Set(),TAU=Math.PI*2;
const box=new T.BoxGeometry(1,1,1).toNonIndexed();
const cyl=new T.CylinderGeometry(1,1,1,8,1).toNonIndexed();
const rodGeo=new T.CylinderGeometry(1,1,1,5,1,true).toNonIndexed();
shared.add(box);shared.add(cyl);shared.add(rodGeo);
function texture(kind){
 const n=64,data=new Uint8Array(n*n*4),r=random(kind==='wood'?0x432afe:0x941cb6);
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  const a=x/n*TAU,b=y/n*TAU;
  let v=.80+r()*.19;
  if(kind==='wood')v*=.82+.12*Math.sin(a*17+.55*Math.sin(b*2))**2+.06*Math.cos(a*2+b)**2;
  else v*=((x%4===0||y%4===0)?.80:.99)*(.94+.06*Math.cos(a*3-b*4));
  const i=(y*n+x)*4;data[i]=255*v;data[i+1]=253*v;data[i+2]=247*v;data[i+3]=255;
 }
 const t=new T.DataTexture(data,n,n);t.wrapS=t.wrapT=T.RepeatWrapping;t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.anisotropy=4;t.colorSpace=T.SRGBColorSpace;t.needsUpdate=true;shared.add(t);return t;
}
const woodMap=texture('wood'),clothMap=texture('cloth');
clothMap.repeat.set(5,5);
function material(name,color,options={}){const m=new T.MeshStandardMaterial({name,color,vertexColors:true,roughness:.95,...options});shared.add(m);return m;}
const M={
 wood:material('yard-weathered-pine','#aa9b7b',{map:woodMap}),
 iron:material('yard-aged-iron','#646d68',{roughness:.72,metalness:.28}),
 fiber:material('yard-canvas-and-willow','#c2b58f',{map:clothMap}),
 hay:material('yard-baled-straw','#b5a368',{map:woodMap}),
 glass:material('yard-empty-glass','#bbd4bd',{roughness:.17,metalness:.05,transparent:true,opacity:.46,depthWrite:false}),
 ceramic:material('yard-salt-glazed-stoneware','#b9ad8c',{roughness:.47}),
 flour:material('yard-flour-dust','#d7cfb3'),
 dark:material('yard-twine-and-recesses','#655d46',{map:clothMap})
};
export function isSharedYardPropResource(resource){return shared.has(resource);}
const object=new T.Object3D(),normalMatrix=new T.Matrix3(),point=new T.Vector3(),normal=new T.Vector3(),up=new T.Vector3(0,1,0);
class Batch{
 constructor(){this.parts=new Map();}
 add(g,m,x=0,y=0,z=0,sx=1,sy=1,sz=1,rx=0,ry=0,rz=0,tone=1){
  object.position.set(x,y,z);object.rotation.set(rx,ry,rz);object.scale.set(sx,sy,sz);object.updateMatrix();this.matrix(g,m,object.matrix,tone);
 }
 matrix(g,m,matrix,tone=1){
  if(!this.parts.has(m))this.parts.set(m,{p:[],n:[],u:[],c:[]});
  const out=this.parts.get(m),p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv,index=g.index;
  normalMatrix.getNormalMatrix(matrix);const count=index?index.count:p.count;
  const tint=Array.isArray(tone)?tone:[tone,tone,tone];
  for(let j=0;j<count;j++){
   const i=index?index.array[j]:j;point.fromBufferAttribute(p,i).applyMatrix4(matrix);normal.fromBufferAttribute(n,i).applyNormalMatrix(normalMatrix);
   out.p.push(point.x,point.y,point.z);out.n.push(normal.x,normal.y,normal.z);
   out.u.push(uv?uv.getX(i):point.x*2,uv?uv.getY(i):point.y*2);
   out.c.push(...tint);
  }
 }
 box(m,x,y,z,w,h,d,rx=0,ry=0,rz=0,tone=1){this.add(box,m,x,y,z,w,h,d,rx,ry,rz,tone);}
 rod(m,a,b,r=.025,tone=1){
  const aa=new T.Vector3(...a),bb=new T.Vector3(...b),delta=bb.clone().sub(aa);
  object.position.copy(aa).add(bb).multiplyScalar(.5);object.quaternion.setFromUnitVectors(up,delta.clone().normalize());object.scale.set(r,delta.length(),r);object.updateMatrix();this.matrix(rodGeo,m,object.matrix,tone);
 }
 face(m,pts,tone=1){
  const p=[];for(let i=1;i<pts.length-1;i++)p.push(...pts[0],...pts[i],...pts[i+1]);
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.computeVertexNormals();this.add(g,m,0,0,0,1,1,1,0,0,0,tone);g.dispose();
 }
 finish(group){
  let triangles=0,bytes=0;
  for(const [m,a]of this.parts){
   const g=new T.BufferGeometry();for(const [name,key,size]of[['position','p',3],['normal','n',3],['uv','u',2],['color','c',3]]){const attr=new T.Float32BufferAttribute(a[key],size);g.setAttribute(name,attr);bytes+=attr.array.byteLength;}
   g.computeBoundingBox();g.computeBoundingSphere();const mesh=new T.Mesh(g,m);mesh.name=m.name;mesh.castShadow=m!==M.glass;mesh.receiveShadow=true;mesh.userData.decorativeYardProp=true;if(m===M.glass)mesh.renderOrder=1;group.add(mesh);triangles+=a.p.length/9;
  }
  return{draws:group.children.length,triangles,geometryBytes:bytes};
 }
}
// Open lathed profiles use eight-sided bodies, thick lips and visible empty
// mouths. No cylinders accidentally seal the shoulders of an empty bottle.
function profile(b,m,rings,n=8,tone=1,x=0,z=0){
 const points=rings.map(([radius,y])=>new T.Vector2(radius,y));
 const g=new T.LatheGeometry(points,n);b.add(g,m,x,0,z,1,1,1,0,Math.PI/8,0,tone);g.dispose();
}
function tube(b,m,points,r=.014,tone=1){for(let i=0;i<points.length-1;i++)b.rod(m,points[i],points[i+1],r,tone);}
function ring(b,m,cx,y,cz,rx,rz,r=.012,n=12,tone=1){
 const pts=[];for(let i=0;i<=n;i++){const a=i/n*TAU;pts.push([cx+Math.cos(a)*rx,y,cz+Math.sin(a)*rz]);}tube(b,m,pts,r,tone);
}
function crate(b,r,{x=0,y=0,z=0,w=.91,h=.62,d=.66,lid=false}={}){
 for(let i=0;i<5;i++)b.box(M.wood,x-w/2+(i+.5)*w/5,y+.040,z,w/5-.012,.08,d,0,0,0,.77+r()*.18);
 for(const xx of[-w/2+.045,w/2-.045])for(const zz of[-d/2+.041,d/2-.041])b.box(M.wood,x+xx,y+h/2,z+zz,.075,h,.075,0,0,0,.69+r()*.16);
 for(let row=0;row<4;row++){
  const yy=y+.13+row*(h-.14)/4,hh=(h-.14)/4-.022;
  for(const zz of[-d/2,d/2])b.box(M.wood,x,yy,z+zz,w,hh,.036,0,0,0,.83+r()*.22);
  for(const xx of[-w/2,w/2]){
   if(row===3){for(const sign of[-1,1])b.box(M.wood,x+xx,yy,z+sign*d*.34,.034,hh,d*.32,0,0,0,.82+r()*.14);}
   else b.box(M.wood,x+xx,yy,z,.034,hh,d-.06,0,0,0,.83+r()*.17);
  }
 }
 for(const zz of[-d/2-.025,d/2+.025])for(const sign of[-1,1]){
  const xx=x+sign*(w/2-.12);b.box(M.wood,xx,y+h*.49,z+zz,.080,h-.04,.025,0,0,0,.62);
  for(const yy of[y+.11,y+h-.13])b.box(M.iron,xx,yy,z+zz+Math.sign(zz)*.017,.019,.019,.007,0,0,0,.48);
 }
 if(lid){for(let i=0;i<5;i++)b.box(M.wood,x-w/2+(i+.5)*w/5,y+h-.015,z,w/5-.009,.044,d+.026,0,0,0,.81+r()*.19);for(const xx of[-w*.31,w*.31])b.box(M.iron,x+xx,y+h+.010,z,.022,.013,d+.035,0,0,0,.58);}
}
function basket(b,r,x=0,y=0,z=0,s=1){
 const bottom=.22*s,top=.34*s,h=.42*s;
 // Independent horizontal splints weave over/under alternating vertical ribs.
 profile(b,M.dark,[[0,y+.026],[bottom,y+.026],[bottom*.99,y+.065]],12,.82,x,z);
 for(let row=0;row<8;row++){
  const yy=y+.055+row*h/8,rad=bottom+(top-bottom)*(yy-y)/h;
  for(let k=0;k<16;k++){
   const a=k/16*TAU,c=(k+1)/16*TAU,rr=rad+((row+k)%2?.008:-.008)*s;
   b.rod(M.fiber,[x+Math.cos(a)*rr,yy,z+Math.sin(a)*rr],[x+Math.cos(c)*rr,yy+.004*Math.sin(k),z+Math.sin(c)*rr],.013*s,.69+r()*.17);
  }
 }
 for(let k=0;k<12;k++){const a=k/12*TAU;const pts=[];for(let j=0;j<5;j++){const t=j/4,rad=bottom+(top-bottom)*t+.007*Math.sin(j*Math.PI);pts.push([x+Math.cos(a)*rad,y+.038+h*t,z+Math.sin(a)*rad]);}tube(b,M.fiber,pts,.009*s,.71);}
 ring(b,M.fiber,x,y+h+.042,z,top*1.01,top*1.01,.021*s,16,.78);
 for(const sign of[-1,1]){const pts=[];for(let j=0;j<=7;j++){const a=j/7*Math.PI;pts.push([x+sign*(top+.013),y+h+.025+Math.sin(a)*.115*s,z+Math.cos(a)*.13*s]);}tube(b,M.fiber,pts,.018*s,.75);}
}
function sack(b,r,x=0,y=0,z=0,scale=1,slump=0){
 const n=12,rings=[[.17,0],[.29,.055],[.32,.23],[.29,.46],[.215,.62],[.082,.69],[.10,.78]],rows=[];
 for(let j=0;j<rings.length;j++){
  const [rad,yy]=rings[j],row=[];
  for(let i=0;i<n;i++){const a=i/n*TAU,fold=1+.055*Math.sin(a*5+j*.8)+.035*Math.cos(a*3-j);row.push([x+scale*(Math.cos(a)*rad*fold+slump*yy),y+yy*scale,z+scale*Math.sin(a)*rad*.83*fold]);}rows.push(row);
 }
 for(let j=0;j<rows.length-1;j++)for(let i=0;i<n;i++)b.face(M.fiber,[rows[j][i],rows[j+1][i],rows[j+1][(i+1)%n],rows[j][(i+1)%n]],.87+r()*.12);
 b.face(M.fiber,[...rows.at(-1)].reverse(),.89);
 // Raised rolled seams and soft canvas creases follow the irregular shell.
 for(const k of[0,6])tube(b,M.fiber,rows.slice(1,5).map(row=>{const p=[...row[k]];p[0]+=(k===0?.008:-.008);return p;}),.008*scale,.71);
 ring(b,M.dark,x+scale*slump*.685,y+.685*scale,z,.088*scale,.077*scale,.012*scale,12,.74);
 tube(b,M.dark,[[x+.09*scale,y+.695*scale,z],[x+.15*scale,y+.66*scale,z+.03],[x+.13*scale,y+.61*scale,z+.06]],.008*scale,.79);
 for(const sign of[-1,1])b.face(M.fiber,[[x+sign*.17*scale,y+.095*scale,z+.228*scale],[x+sign*.14*scale,y+.19*scale,z+.257*scale],[x+sign*.12*scale,y+.13*scale,z+.252*scale]],.70);
}
function bottle(b,kind,x,y,z,r){
 const jar=kind==='jar',jug=kind==='jug',height=jug?.46:jar?.29:.35;
 if(jug){
  profile(b,M.ceramic,[[0,y],[.135,y],[.168,y+.035],[.176,y+.23],[.15,y+.31],[.060,y+.38],[.058,y+.45],[0,y+.45]],12,[.91,.89,.82],x,z);
  const pts=[];for(let i=0;i<=9;i++){const a=-1.25+i/9*4.6;pts.push([x+.142+Math.cos(a)*.102,y+.302+Math.sin(a)*.13,z]);}tube(b,M.ceramic,pts,.023,[.56,.47,.34]);
  profile(b,M.ceramic,[[.151,y+.303],[.066,y+.38],[.063,y+.45]],12,[.53,.42,.30],x,z);
  b.add(cyl,M.wood,x,y+.461,z,.049,.031,.049,0,r()*TAU,0,.68);
 }else{
  const wide=jar?.102:.071,neck=jar?.088:.025;
  const rings=jar?[[0,y+.011],[wide*.84,y+.011],[wide,y+.025],[wide,y+.219],[neck,y+.249],[neck,y+.269],[neck-.009,y+.269],[neck-.009,y+.246]]:[[0,y+.008],[wide*.85,y+.008],[wide,y+.022],[wide,y+.216],[.044,y+.260],[neck,y+.283],[neck,y+.340],[neck+.005,y+.344],[neck+.005,y+.352],[neck-.008,y+.352],[neck-.008,y+.306]];
  profile(b,M.glass,rings,8,jar?[.92,1,.95]:[.79,.92,.72],x,z);
  if(jar){b.add(cyl,M.iron,x,y+.284,z,.096,.026,.096,0,0,0,.87);ring(b,M.iron,x,y+.266,z,.092,.092,.008,8,.8);}
  else ring(b,M.glass,x,y+.348,z,.030,.030,.006,8,[.8,.96,.82]);
 }
 return height;
}
function hay(b,r,x=0,y=0,z=0,w=1.04,h=.57,d=.66){
 // Chamfered compressed rectangular bale: irregular silhouette, not a box.
 const cham=.055,shape=[[-w/2+cham,-d/2],[w/2-cham,-d/2],[w/2,-d/2+cham],[w/2,d/2-cham],[w/2-cham,d/2],[-w/2+cham,d/2],[-w/2,d/2-cham],[-w/2,-d/2+cham]];
 const rows=[];
 for(let j=0;j<4;j++){const yy=[.012,.08,h-.065,h][j],expand=j===1||j===2?1:.94;rows.push(shape.map(([xx,zz],i)=>[x+xx*expand,y+yy+(j===0?0:(r()-.5)*.016),z+zz*expand]));}
 for(let j=0;j<3;j++)for(let i=0;i<8;i++)b.face(M.hay,[rows[j][i],rows[j+1][i],rows[j+1][(i+1)%8],rows[j][(i+1)%8]],.85+r()*.15);
 b.face(M.hay,[...rows[3]].reverse(),.98);
 for(const xx of[-w*.28,w*.28])tube(b,M.dark,[[x+xx,y+.027,z-d*.475],[x+xx,y+h*.91,z-d*.485],[x+xx,y+h+.011,z-d*.41],[x+xx,y+h+.011,z+d*.41],[x+xx,y+h*.91,z+d*.485],[x+xx,y+.027,z+d*.475]],.009,.86);
 for(let i=0;i<24;i++){
  const xx=x+(r()-.5)*w*.84,zz=z+(r()-.5)*d*.83,len=.16+r()*.26;
  b.rod(M.hay,[xx-len/2,y+h+.012,zz],[xx+len/2,y+h+.014,zz+(r()-.5)*.04],.006,.78+r()*.28);
 }
 for(const side of[-1,1])for(let i=0;i<15;i++){
  const xx=x+(r()-.5)*w*.86,yy=y+.06+r()*(h-.13),len=.09+r()*.19;
  b.rod(M.hay,[xx-len/2,yy,z+side*(d/2+.003)],[xx+len/2,yy+.018,z+side*(d/2+.003)],.005,.7+r()*.28);
 }
}
function sickle(b,x,y,z,angle=0){
 const local=(xx,yy,zz)=>[x+Math.cos(angle)*xx+Math.sin(angle)*zz,y+yy,z-Math.sin(angle)*xx+Math.cos(angle)*zz];
 b.rod(M.wood,local(0,0,0),local(0,.29,0),.034,.67);b.rod(M.iron,local(0,.26,0),local(0,.35,0),.023,.76);
 // Steel crescent has tapered cutting edge, thickness and curved spine.
 const inner=[],outer=[],n=12;
 for(let i=0;i<=n;i++){const a=-.05+i/n*2.56,rad=.215,width=.044*(1-i/n)+.003;outer.push(local(-.19+Math.cos(a)*(rad+width),.365+Math.sin(a)*(rad+width),0));inner.push(local(-.19+Math.cos(a)*rad,.365+Math.sin(a)*rad,0));}
 for(let i=0;i<n;i++){
  const a=outer[i],q=outer[i+1],c=inner[i+1],d=inner[i];
  b.face(M.iron,[a,q,c,d].map(p=>[p[0],p[1],p[2]+.009]),.85);b.face(M.iron,[d,c,q,a].map(p=>[p[0],p[1],p[2]-.009]),.69);
  b.face(M.iron,[[a[0],a[1],a[2]-.009],[q[0],q[1],q[2]-.009],[q[0],q[1],q[2]+.009],[a[0],a[1],a[2]+.009]],.74);
 }
}
function tools(b,r,{scythe=true}={}){
 // Template is parallel to a side wall: wallward = negative local Z.
 const lean=.25;
 tube(b,M.wood,[[-.29,.025,.29],[-.27,.50,.22],[-.34,1.18,.11],[-.24,1.79,.025]],.026,.72);
 b.rod(M.iron,[-.31,.02,.29],[-.31,.22,.27],.031,.68);
 b.face(M.iron,[[-.45,.018,.36],[-.47,.15,.34],[-.43,.28,.30],[-.22,.29,.30],[-.16,.14,.34],[-.19,.015,.36]],.86);
 b.face(M.iron,[[-.19,.015,.354],[-.16,.14,.334],[-.22,.29,.294],[-.43,.28,.294],[-.47,.15,.334],[-.45,.018,.354]],.73);
 tube(b,M.wood,[[.17,.08,.29],[.17,1.60,.015]],.027,.81);
 b.rod(M.iron,[-.04,.12,.295],[.36,.12,.295],.017,.63);
 for(let i=0;i<4;i++)tube(b,M.iron,[[.01+i*.093,.16,.28],[.01+i*.093,.05,.39],[.01+i*.093,.025,.43]],.010,.71);
 if(scythe){
  tube(b,M.wood,[[.58,.022,.30],[.47,.45,.24],[.53,1.03,.16],[.45,1.78,.018]],.031,.69);
  for(const [xx,yy,zz]of[[.51,.63,.22],[.49,1.30,.105]])b.rod(M.wood,[xx,yy,zz],[xx-.20,yy+.04,zz+.06],.024,.77);
  for(let i=0;i<12;i++){
   const t=i/12,u=(i+1)/12,pt=q=>[.57-q*.82,.036+.015*q,.30+.26*Math.sin(q*1.65)],a=pt(t),c=pt(u),wide=.083*(1-t)+.006,wide2=.083*(1-u)+.006;
   b.face(M.iron,[a,c,[c[0],c[1],c[2]+wide2],[a[0],a[1],a[2]+wide]],.81);
   b.face(M.iron,[[a[0],a[1]-.008,a[2]+wide],[c[0],c[1]-.008,c[2]+wide2],[c[0],c[1]-.008,c[2]],[a[0],a[1]-.008,a[2]]],.74);
  }
 }
 // A small hanging sickle rests beside the long tools, not in an aisle.
 sickle(b,-.62,.06,.17,-.13);
}
function flour(b,r){
 const n=15,center=[0,.013,0];
 for(let i=0;i<n;i++){
  const a=i/n*TAU,c=(i+1)/n*TAU,ra=.32+r()*.10,rc=.32+r()*.10;
  b.face(M.flour,[center,[Math.cos(c)*rc,.010,Math.sin(c)*rc*.57],[Math.cos(a)*ra,.010,Math.sin(a)*ra*.57]],.91+r()*.08);
 }
 for(let i=0;i<11;i++){const a=r()*TAU,rad=.32+r()*.20,x=Math.cos(a)*rad,z=Math.sin(a)*rad*.60,s=.018+r()*.03;b.face(M.flour,[[x-s,.009,z],[x,.010,z+s*.7],[x+s,.009,z-s*.4]],.91);}
}
function propTemplate(kind,r){
 const b=new Batch();let solid=false;
 if(kind==='crates'){crate(b,r,{lid:true});crate(b,r,{x:.11,y:.632,z:-.04,w:.71,h:.46,d:.53});solid=true;}
 if(kind==='bottleCrate'){crate(b,r,{w:1.02,h:.69,d:.73,lid:true});bottle(b,'bottle',-.32,.713,.12,r);bottle(b,'bottle',-.17,.713,-.16,r);bottle(b,'jar',.08,.713,.12,r);bottle(b,'jug',.29,.713,-.09,r);solid=true;}
 if(kind==='crate'){crate(b,r);solid=true;}
 if(kind==='sacks'){sack(b,r,-.29,0,0,1,.11);sack(b,r,.32,0,.04,.84,-.07);solid=true;}
 if(kind==='sack'){sack(b,r,0,0,0,.93,.07);}
 if(kind==='basket'){basket(b,r);}
 if(kind==='baskets'){basket(b,r,-.34,0,0,.95);basket(b,r,.30,0,-.12,.72);}
 if(kind==='hay'){hay(b,r);solid=true;}
 if(kind==='hayStack'){hay(b,r,-.57,0,0);hay(b,r,.55,0,-.07);hay(b,r,-.06,.58,-.04,.98,.56,.62);solid=true;}
 if(kind==='tools')tools(b,r);
 if(kind==='smallTools')tools(b,r,{scythe:false});
 if(kind==='flour')flour(b,r);
 if(kind==='emptyBottles'){bottle(b,'bottle',-.12,0,0,r);bottle(b,'bottle',.11,0,.11,r);}
 if(kind==='moonshine'){bottle(b,'jug',-.14,0,0,r);bottle(b,'jar',.18,0,.04,r);}
 const bounds=new T.Box3();for(const a of b.parts.values())for(let i=0;i<a.p.length;i+=3)bounds.expandByPoint(new T.Vector3(a.p[i],a.p[i+1],a.p[i+2]));
 return{batch:b,bounds,solid};
}
function obbPoints(rect){
 const c=Math.cos(rect.a),s=Math.sin(rect.a);return[[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,z])=>({x:rect.x+c*x*rect.hx+s*z*rect.hz,z:rect.z-s*x*rect.hx+c*z*rect.hz}));
}
function overlaps(a,b,margin=0){
 const ap=obbPoints(a),bp=obbPoints(b);
 for(const angle of[a.a,b.a])for(const axis of[[Math.cos(angle),-Math.sin(angle)],[Math.sin(angle),Math.cos(angle)]]){
  const aa=ap.map(p=>p.x*axis[0]+p.z*axis[1]),bb=bp.map(p=>p.x*axis[0]+p.z*axis[1]);
  if(Math.max(...aa)+margin<=Math.min(...bb)||Math.max(...bb)+margin<=Math.min(...aa))return false;
 }
 return true;
}
export function makeYardProps(f,level=0){
 const group=new T.Group();group.name='weathered-yard-workstations';
 const colliders=[],stats={version:9,level,props:[],workstations:[],rejected:0,draws:0,triangles:0,geometryBytes:0};
 if(f.type!=='building')return{group,colliders,stats};
 const v=((f.variant||0)%8+8)%8,s=f.buildingScale||1,[w,d]=buildingSize({...f,variant:v}),hw=w/2,front=d/2,angle=f.buildingAngle||0,c=Math.cos(angle),sn=Math.sin(angle);
 const layout=random((f.seed||1)^0x5c192fd7),out=new Batch(),occupied=[];
 const startBarn=f.x===0n&&f.z===0n&&v===2,arrangement=startBarn?0:Math.floor(layout()*3);
 const mirror=[2,3,4,6].includes(v)&&arrangement===1?-1:1;
 const stationShift=startBarn?0:(layout()-.5)*.42;
 stats.arrangement=arrangement;
 group.position.set(f.cx,0,f.cz);group.rotation.y=angle;
 const toWorld=(x,z)=>({x:f.cx+c*x+sn*z,z:f.cz-sn*x+c*z});
 const wall={x:0,z:0,hx:hw+.19*s,hz:front+.23*s,a:0};
 const doorX=(v===0?-1.15:v===7?-.55:0)*s;
 const doorWidth=([1.55,1.12,4.4,4,3.6,13,3.4,3.6][v])*s;
 const reserved=[wall,{x:doorX,z:front+1.5,hx:doorWidth/2+.72,hz:1.95,a:0}];
 if(v===0)reserved.push({x:0,z:front+.88,hx:2.82*s,hz:1.02*s,a:0});
 if(v===6)reserved.push({x:0,z:-front-1.4,hx:doorWidth/2+.72,hz:1.8,a:0});
 // Reserve the optional covered bay even when its random variant omits it.
 if(v===7)reserved.push({x:hw+1.05*s,z:front-2.4*s,hx:1.22*s,hz:1.72*s,a:0});
 let index=0;
 function add(kind,x,z,yaw=0,station='storage'){
  x*=mirror;yaw*=mirror;
  const seed=((f.seed||1)^0x629eeaf3^Math.imul(++index,0x45d9f3b))>>>0;
  const p=propTemplate(kind,random(seed)),lo=p.bounds.min,hi=p.bounds.max,co=Math.cos(yaw),si=Math.sin(yaw),mx=(lo.x+hi.x)/2,mz=(lo.z+hi.z)/2;
  const rect={x:x+co*mx+si*mz,z:z-si*mx+co*mz,hx:(hi.x-lo.x)/2+.025,hz:(hi.z-lo.z)/2+.025,a:yaw};
  const corners=obbPoints(rect),worldCorners=corners.map(q=>toWorld(q.x,q.z));
  const invalid=corners.some(q=>Math.abs(q.x)>hw+3.0||Math.abs(q.z)>front+3.0)||worldCorners.some(q=>q.x<.10||q.z<.10||q.x>63.90||q.z>63.90)||reserved.some(q=>overlaps(rect,q,.045))||occupied.some(q=>overlaps(rect,q,.07));
  if(invalid){stats.rejected++;return false;}
  occupied.push(rect);
  // Rigid tangent-plane placement. Four bottom-corner terrain samples establish
  // a conservative contact height; all vertices receive the same plane shear,
  // so bottles, tools and stack tops stay coherent and feet never float.
  const origin=toWorld(x,z),eps=.10;
  const base=surfaceHeight(origin.x,origin.z,f),gx=(surfaceHeight(origin.x+eps,origin.z,f)-surfaceHeight(origin.x-eps,origin.z,f))/(2*eps),gz=(surfaceHeight(origin.x,origin.z+eps,f)-surfaceHeight(origin.x,origin.z-eps,f))/(2*eps);
  let contact=0;for(const q of worldCorners)contact=Math.max(contact,surfaceHeight(q.x,q.z,f)-(base+gx*(q.x-origin.x)+gz*(q.z-origin.z)));
  contact=Math.min(contact,.045);const baseY=base+contact+.003-lo.y;
  const yx=gx*c-gz*sn,yz=gx*sn+gz*c;
  // Affine transform: yaw followed by tangent-plane Y shear. Correct normals
  // use its inverse transpose, including the tiny terrain slope.
  const matrix=new T.Matrix4().set(co,0,si,x,yx*co-yz*si,1,yx*si+yz*co,baseY,-si,0,co,z,0,0,0,1);
  normalMatrix.getNormalMatrix(matrix);
  for(const [m,a]of p.batch.parts){
   if(!out.parts.has(m))out.parts.set(m,{p:[],n:[],u:[],c:[]});const dst=out.parts.get(m);
   for(let i=0;i<a.p.length;i+=3){point.set(a.p[i],a.p[i+1],a.p[i+2]).applyMatrix4(matrix);normal.set(a.n[i],a.n[i+1],a.n[i+2]).applyNormalMatrix(normalMatrix);dst.p.push(point.x,point.y,point.z);dst.n.push(normal.x,normal.y,normal.z);}
   dst.u.push(...a.u);dst.c.push(...a.c);
  }
  const center=toWorld(rect.x,rect.z);
  if(p.solid)colliders.push({kind:'obb',x:center.x,z:center.z,hx:rect.hx,hz:rect.hz,angle:angle+yaw});
  stats.props.push({kind,station,x,z,angle:yaw,solid:p.solid,rect:{...rect},worldX:center.x,worldZ:center.z,baseY,terrainContactCorrection:contact});
  if(!stats.workstations.includes(station))stats.workstations.push(station);
  return true;
 }
 const wobble=()=> (layout()-.5)*.11;
 // Three purposeful clusters occupy the front half of larger barns. Small
 // buildings use two side clusters; no uniform perimeter ring or front clutter.
 if(v===1){
  const side=arrangement===1?-1:1;
  add('crate',side*(hw+.78),.12+stationShift,wobble(),'utility');if(arrangement!==2)add('basket',side*(hw+1.88),.53+stationShift,.11,'utility');
  add('smallTools',-side*(hw+.30),-.36-stationShift,-side*Math.PI/2,'tools');
 }else if(v===0||v===5||v===7){
  const side=v===7?-1:arrangement===1?-1:1,zz=(v===5?front-1.3:front-.50)-arrangement*.50+stationShift;
  add(v===0&&arrangement!==2?'bottleCrate':arrangement===2?'crate':'crates',side*(hw+.84),zz,wobble(),'supplies');
  add(v===5?'sacks':'basket',side*(hw+(v===5?2.20:1.97)),zz+.16,wobble(),'supplies');
  if(v!==0)add('flour',side*(hw+1.91),zz+1.02,wobble(),'supplies');
  add('tools',-side*(hw+.30),front-(v===7?5.35:1.26)-arrangement*.45,-side*Math.PI/2,'tools');
  if(v===5){add(arrangement===2?'hay':'hayStack',-side*(hw+.83),front-3.8-arrangement*.30,side*Math.PI/2+wobble(),'hay');if(arrangement!==1)add('basket',-side*(hw+1.9),front-3.31-arrangement*.30,.10,'hay');}
  if(v===7&&arrangement!==1)add('moonshine',-hw-1.6,zz+1.25,.08,'supplies');
 }else{
  const right=hw-.88,left=-hw+1.20,zz=front+1.09+stationShift;
  add(v===6||arrangement===2?'crates':'bottleCrate',right,zz,wobble(),'supplies');
  add(v===6?'basket':'sacks',right,zz+1.04,wobble(),'supplies');
  if(v!==6)add('flour',right-1.28,zz+1.19,wobble(),'supplies');
  if((v===2||v===4)&&arrangement!==1)add('emptyBottles',right+.94,zz+.04,-.17,'supplies');
  add(v===4?'crates':arrangement===2?'hay':'hayStack',left,zz+.04,wobble(),'hay-storage');
  add('basket',left-1.80,zz+.12,-.12,'hay-storage');
  add('tools',hw+(v===4?.46:.30),front-1.40-arrangement*.82,Math.PI/2,'tools');
  if(v===2)add('sack',hw+1.20,front-2.47-arrangement*.82,wobble(),'tools');
  if(v===3&&layout()<.55)add('moonshine',right+1.02,zz+.09,.12,'supplies');
 }
 Object.assign(stats,out.finish(group));group.userData.yardProps={version:9,variant:v,decorativeOnly:true};
 return{group,colliders,stats};
}
