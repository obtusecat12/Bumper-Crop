import * as T from './vendor/three.module.min.js';

// Metre-scale, SINGLE rural yard objects. Eight finite variants per kind.
// Instances own their Group only; every geometry, material and texture is shared.
// No placement, ground sampling, world state, stacks, kits or per-frame work here.
const TAU=Math.PI*2,shared=new Set(),cache=new Map();
function random(seed){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
function texture(kind){
 const n=128,data=new Uint8Array(n*n*4),r=random(kind==='wood'?0x432afe:0x941cb6);
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  const a=x/n*TAU,b=y/n*TAU;let v=.86+r()*.13;
  if(kind==='wood'){
   const grain=Math.sin(a*23+.48*Math.sin(b*2)+.22*Math.sin(a*3+b));
   v*=.83+.11*grain*grain+.06*Math.cos(a*2+b)**2;
   if(grain<-.967&&Math.sin(b*5+a)>.15)v*=.68;
  }else if(kind==='straw'){
   const fibre=Math.sin(b*29+.8*Math.sin(a*2)+.45*Math.cos(a*5+b));
   v*=.85+.09*fibre*fibre+.06*Math.sin(a*2-b*7)**2;
   if(fibre<-.965&&Math.sin(a*3+b*2)>.2)v*=.69;
  }else v*=((x%4===0||y%4===0)?.87:1)*(.97+.03*Math.cos(a*3-b*4));
  const i=(y*n+x)*4;data[i]=255*v;data[i+1]=253*v;data[i+2]=247*v;data[i+3]=255;
 }
 const t=new T.DataTexture(data,n,n);t.wrapS=t.wrapT=T.RepeatWrapping;t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.anisotropy=4;t.colorSpace=T.SRGBColorSpace;t.needsUpdate=true;shared.add(t);return t;
}
const woodMap=texture('wood'),clothMap=texture('cloth'),strawMap=texture('straw');
function material(name,color,options={}){const m=new T.MeshStandardMaterial({name,color,vertexColors:true,roughness:.92,...options});shared.add(m);return m;}
// Eight materials across all 88 templates. Wear and quiet colour variation use
// vertex colours so the layout can merge the entire yard by material identity.
const M={
 wood:material('yard-weathered-pine','#a2977e',{map:woodMap}),
 iron:material('yard-aged-iron','#626b68',{roughness:.64,metalness:.36}),
 fiber:material('yard-canvas-and-willow','#c4b898',{map:clothMap}),
 hay:material('yard-baled-straw','#b8a669',{map:strawMap}),
 glass:material('yard-empty-glass','#aec7b6',{roughness:.16,metalness:.05,transparent:true,opacity:.43,depthWrite:false}),
 ceramic:material('yard-salt-glazed-stoneware','#c0b59c',{roughness:.42}),
 flour:material('yard-flour-dust','#dfd6bd'),
 dark:material('yard-twine-and-recesses','#655e48',{map:clothMap})
};
export function isSharedYardAssetResource(resource){return shared.has(resource);}
const obj=new T.Object3D(),nm=new T.Matrix3(),p3=new T.Vector3(),n3=new T.Vector3(),up=new T.Vector3(0,1,0);
const boxGeo=new T.BoxGeometry(1,1,1),rodGeo=new T.CylinderGeometry(1,1,1,8,1,false);shared.add(boxGeo);shared.add(rodGeo);
class Batch{
 constructor(){this.parts=new Map();}
 add(g,m,x=0,y=0,z=0,sx=1,sy=1,sz=1,rx=0,ry=0,rz=0,tone=1){obj.position.set(x,y,z);obj.rotation.set(rx,ry,rz);obj.scale.set(sx,sy,sz);obj.updateMatrix();this.matrix(g,m,obj.matrix,tone);}
 matrix(g,m,matrix,tone=1){
  if(!this.parts.has(m))this.parts.set(m,{p:[],n:[],u:[],c:[]});
  const o=this.parts.get(m),p=g.attributes.position,n=g.attributes.normal,u=g.attributes.uv,ix=g.index;nm.getNormalMatrix(matrix);const tint=Array.isArray(tone)?tone:[tone,tone,tone];
  for(let j=0;j<(ix?ix.count:p.count);j++){const i=ix?ix.array[j]:j;p3.fromBufferAttribute(p,i).applyMatrix4(matrix);n3.fromBufferAttribute(n,i).applyNormalMatrix(nm);o.p.push(p3.x,p3.y,p3.z);o.n.push(n3.x,n3.y,n3.z);o.u.push(u?u.getX(i):p3.x*2,u?u.getY(i):p3.y*2);o.c.push(...tint);}
 }
 face(m,pts,tone=1,uv=null){
  const p=[],u=[];for(let i=1;i<pts.length-1;i++)for(const j of[0,i,i+1]){p.push(...pts[j]);u.push(...(uv?uv[j]:[pts[j][0]*3,pts[j][1]*3+pts[j][2]*2]));}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(u,2));g.computeVertexNormals();this.add(g,m,0,0,0,1,1,1,0,0,0,tone);g.dispose();
 }
 box(m,x,y,z,w,h,d,tone=1){this.add(boxGeo,m,x,y,z,w,h,d,0,0,0,tone);}
 rod(m,a,b,r=.012,tone=1,r2=r){
  const aa=new T.Vector3(...a),bb=new T.Vector3(...b),delta=bb.clone().sub(aa);obj.position.copy(aa).add(bb).multiplyScalar(.5);obj.quaternion.setFromUnitVectors(up,delta.clone().normalize());obj.scale.set(r,delta.length(),r);obj.updateMatrix();
  if(r===r2)this.matrix(rodGeo,m,obj.matrix,tone);else{const g=new T.CylinderGeometry(r2/r,1,1,8,1,false);this.matrix(g,m,obj.matrix,tone);g.dispose();}
 }
 finish(){
  const group=new T.Group();let triangles=0,bytes=0;
  for(const [m,a]of this.parts){const g=new T.BufferGeometry();for(const [name,key,size]of[['position','p',3],['normal','n',3],['uv','u',2],['color','c',3]]){const attr=new T.Float32BufferAttribute(a[key],size);g.setAttribute(name,attr);bytes+=attr.array.byteLength;}g.computeBoundingBox();g.computeBoundingSphere();shared.add(g);const mesh=new T.Mesh(g,m);mesh.name=m.name;mesh.castShadow=m!==M.glass;mesh.receiveShadow=true;mesh.userData.decorativeYardProp=true;if(m===M.glass)mesh.renderOrder=1;group.add(mesh);triangles+=a.p.length/9;}
  return{group,stats:{triangles,materialCount:group.children.length,geometryBytes:bytes}};
 }
}
// 44 triangles with actual bevel faces. Each board's grain follows its longest
// dimension instead of stretching the same UV square over every face.
function plank(b,m,x,y,z,w,h,d,tone=1,e=.006){
 const a=[w/2,h/2,d/2],long=w>=h&&w>=d?0:h>=d?1:2;e=Math.min(e,...a.map(v=>v*.45));
 const pt=(v)=>[v[0]+x,v[1]+y,v[2]+z],face=vs=>{
  const uv=vs.map(v=>{const others=[0,1,2].filter(k=>k!==long),across=Math.abs(v[others[0]])===a[others[0]]?others[1]:others[0];return[v[across]*5,v[long]*1.1];});
  const c=new T.Vector3();for(const q of vs)c.add(new T.Vector3(...q));c.multiplyScalar(1/vs.length);const n=new T.Vector3().crossVectors(new T.Vector3(...vs[1]).sub(new T.Vector3(...vs[0])),new T.Vector3(...vs[2]).sub(new T.Vector3(...vs[0])));if(n.dot(c)<0){vs.reverse();uv.reverse();}b.face(m,vs.map(pt),tone,uv);
 };
 for(let axis=0;axis<3;axis++)for(const s of[-1,1]){const rest=[0,1,2].filter(k=>k!==axis);face([[-1,-1],[1,-1],[1,1],[-1,1]].map(([u,v])=>{const q=[0,0,0];q[axis]=s*a[axis];q[rest[0]]=u*(a[rest[0]]-e);q[rest[1]]=v*(a[rest[1]]-e);return q;}));}
 for(let free=0;free<3;free++){const ax=[0,1,2].filter(k=>k!==free);for(const s of[-1,1])for(const t of[-1,1]){const f=(end,side)=>{const q=[0,0,0];q[free]=end*(a[free]-e);q[ax[0]]=s*(a[ax[0]]-(side?e:0));q[ax[1]]=t*(a[ax[1]]-(side?0:e));return q;};face([f(-1,0),f(1,0),f(1,1),f(-1,1)]);}}
 for(const sx of[-1,1])for(const sy of[-1,1])for(const sz of[-1,1]){const s=[sx,sy,sz];face([0,1,2].map(axis=>a.map((v,k)=>s[k]*(v-(k===axis?0:e)))));}
}
// Smooth continuous tubes, including caps; eight radial sides for handles,
// four for fine fibres. Unlike independent cylinders, joints have no blobs.
function tube(b,m,points,r=.012,tone=1,sides=6,caps=true){
 const rows=[],p=[],u=[],idx=[];
 for(let i=0;i<points.length;i++){
  const c=new T.Vector3(...points[i]),before=new T.Vector3(...points[Math.max(0,i-1)]),after=new T.Vector3(...points[Math.min(points.length-1,i+1)]),t=after.sub(before).normalize(),ref=Math.abs(t.z)>.85?new T.Vector3(1,0,0):new T.Vector3(0,0,1),n=new T.Vector3().crossVectors(t,ref).normalize(),v=new T.Vector3().crossVectors(t,n).normalize(),rad=Array.isArray(r)?r[i]:r;
  rows.push([]);for(let k=0;k<sides;k++){const a=k/sides*TAU,q=c.clone().addScaledVector(n,Math.cos(a)*rad).addScaledVector(v,Math.sin(a)*rad);rows[i].push(q.toArray());p.push(...q.toArray());u.push(k/sides,i/(points.length-1)*2);}
 }
 for(let i=0;i<rows.length-1;i++)for(let k=0;k<sides;k++){const a=i*sides+k,d=i*sides+(k+1)%sides,c=d+sides,bb=a+sides;idx.push(a,d,bb,d,c,bb);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(u,2));g.setIndex(idx);g.computeVertexNormals();b.add(g,m,0,0,0,1,1,1,0,0,0,tone);g.dispose();if(caps){b.face(m,[...rows[0]].reverse(),tone);b.face(m,rows.at(-1),tone);}
}
function ring(b,m,y,rx,rz,r=.012,n=24,tone=1,cx=0,cz=0,sides=4){const pts=[];for(let i=0;i<=n;i++){const a=i/n*TAU;pts.push([cx+Math.cos(a)*rx,y,cz+Math.sin(a)*rz]);}tube(b,m,pts,r,tone,sides,false);}
function profile(b,m,rings,n=20,tone=1){const g=new T.LatheGeometry(rings.map(p=>new T.Vector2(...p)),n);b.add(g,m,0,0,0,1,1,1,0,Math.PI/n,0,tone);g.dispose();}
function crate(b,r,v){
 const w=1.08+r()*.10,h=.77+r()*.06,d=.74+r()*.10,lid=v%3!==1,rows=v%2?5:4;
 for(let i=0;i<6;i++)plank(b,M.wood,-w/2+(i+.5)*w/6,.048,0,w/6-.009,.066,d-.01,.83+r()*.14);
 for(const x of[-w/2+.057,w/2-.057])for(const z of[-d/2+.045,d/2-.045])plank(b,M.wood,x,h/2,z,.074,h,.072,.70+r()*.12);
 for(let j=0;j<rows;j++){
  const hh=(h-.085)/rows-.017,y=.088+j*(h-.085)/rows+hh/2;
  for(const z of[-d/2,d/2])plank(b,M.wood,0,y,z,w,hh,.045,.83+r()*.18);
  for(const x of[-w/2,w/2]){
   if(j===rows-1&&!lid){for(const s of[-1,1])plank(b,M.wood,x,y,s*d*.34,.041,hh,d*.31,.82+r()*.14);plank(b,M.wood,x,y+hh*.35,0,.041,hh*.28,d*.34,.91);}
   else plank(b,M.wood,x,y,0,.042,hh,d-.04,.84+r()*.15);
  }
 }
 for(const z of[-d/2-.034,d/2+.034])for(const s of[-1,1]){
  const x=s*(w/2-.102);plank(b,M.wood,x,h*.49,z,.071,h-.025,.026,.70+r()*.07,.003);
  for(let j=0;j<rows;j++){
   const y=.125+j*(h-.12)/rows,a=[x,y,z+Math.sign(z)*.015],q=[x,y,z+Math.sign(z)*.020];b.rod(M.iron,a,q,.008,.43+r()*.12);
  }
 }
 // Narrow, irregular checking in selected boards; restrained dusty pine palette.
 for(let i=0;i<5;i++){const x=(r()-.5)*w*.68,y=.14+r()*(h-.22),z=d/2+.024,len=.055+r()*.13;b.face(M.dark,[[x,y,z],[x+len,y+.003,z],[x+len*.8,y+.006,z]],.74);}
 if(lid){
  for(let i=0;i<6;i++)plank(b,M.wood,0,h+.008,-d/2+(i+.5)*d/6,w+.017,.048,d/6-.009,.84+r()*.15);
  for(const x of[-w*.32,w*.32])plank(b,M.wood,x,h+.023,0,.068,.018,d+.027,.71,.003);
 }
 return{...(lid?{supportPlane:{height:h+.032,halfX:w*.43,halfZ:d*.40}}:{nestPlane:{height:.081,halfX:w*.40,halfZ:d*.36}}),closed:lid};
}
function basket(b,r,v){
 const top=.326+r()*.025,bottom=top*.70,h=.47+r()*.065,oval=v%3===2?.88:1,rows=10,segments=24;
 // Thin willow/poplar splints cross at alternating relief. Both faces are
 // modeled, so the mouth remains genuinely open from every viewing direction.
 const at=(a,y,offset=0)=>{const t=(y-.035)/h,rad=bottom+(top-bottom)*t+.025*Math.sin(t*Math.PI)+offset;return[Math.cos(a)*rad,y,Math.sin(a)*rad*oval];};
 for(let j=0;j<rows;j++)for(let k=0;k<segments;k++){
  const a=k/segments*TAU,c=(k+1)/segments*TAU,y=.056+j*(h-.045)/rows,hh=(h-.045)/rows*.76,off=((j+k)%2?1:-1)*.0047;
  const outer=[at(a,y-hh/2,off),at(c,y-hh/2,-off),at(c,y+hh/2,-off),at(a,y+hh/2,off)],inner=[at(a,y-hh/2,off-.006),at(c,y-hh/2,-off-.006),at(c,y+hh/2,-off-.006),at(a,y+hh/2,off-.006)];
  b.face(M.fiber,outer.reverse(),.76+r()*.12);b.face(M.fiber,inner,.68+r()*.10);
 }
 for(let k=0;k<16;k++)for(let j=0;j<5;j++){
  const a=k/16*TAU,da=.026/top/2,y=.035+j*h/5,y2=.035+(j+1)*h/5,off=.0015;
  b.face(M.fiber,[at(a-da,y2,off),at(a+da,y2,off),at(a+da,y,off),at(a-da,y,off)],.70);
  b.face(M.fiber,[at(a-da,y,off-.006),at(a+da,y,off-.006),at(a+da,y2,off-.006),at(a-da,y2,off-.006)],.67);
 }
 // Crossed splints on the woven bottom, bounded to the circular foot.
 for(const turn of[0,1])for(let i=-3;i<=3;i++){const a=i*bottom/4,len=Math.sqrt(bottom*bottom-a*a)*2;b.box(M.fiber,turn?0:a,.021+turn*.008,turn?a:0,turn?len:.052,.009,turn?.052:len,.73);}
 ring(b,M.fiber,h+.023,top+.008,(top+.008)*oval,.019,24,.76);
 ring(b,M.fiber,.022,bottom,bottom*oval,.014,20,.69);
 for(const s of[-1,1]){
  const pts=[];for(let j=0;j<=7;j++){const a=j/7*Math.PI;pts.push([s*(top+.006)+s*.04*Math.sin(a),h+.017+.105*Math.sin(a),Math.cos(a)*.115*oval]);}
  tube(b,M.fiber,pts,.013,.72,4);for(const z of[-.115,.115])tube(b,M.dark,[[s*top,h-.043,z*oval],[s*top,h+.045,z*oval]],.006,.8,4);
 }
 return{nestPlane:{height:h*.47,halfX:top*.89,halfZ:top*oval*.89},open:true};
}
function sack(b,r,v){
 const H=.90+r()*.08,W=.66+r()*.075,depth=.78+r()*.06,slump=(r()-.5)*.13,phase=r()*TAU,N=28,levels=24;
 const knots=[[0,.56],[.025,.79],[.085,.94],[.19,1],[.37,.98],[.53,.88],[.68,.74],[.77,.46],[.815,.20],[.85,.18],[.91,.24],[.96,.31],[1,.28]];
 function radius(t){let i=0;while(i<knots.length-2&&t>knots[i+1][0])i++;const p0=knots[Math.max(0,i-1)],p1=knots[i],p2=knots[i+1],p4=knots[Math.min(knots.length-1,i+2)],u=(t-p1[0])/(p2[0]-p1[0]),m1=(p2[1]-p0[1])/(p2[0]-p0[0])*(p2[0]-p1[0]),m2=(p4[1]-p1[1])/(p4[0]-p1[0])*(p2[0]-p1[0]);return(2*u*u*u-3*u*u+1)*p1[1]+(u*u*u-2*u*u+u)*m1+(-2*u*u*u+3*u*u)*p2[1]+(u*u*u-u*u)*m2;}
 function point(t,a,extra=0){
  const body=radius(t)*W/2,nearNeck=Math.exp(-(((t-.79)/.16)**2)),atBase=Math.exp(-(((t-.07)/.1)**2)),cuff=Math.max(0,(t-.86)/.14),fold=.031*Math.sin(a*5+phase+t*4)+.021*Math.cos(a*8-phase-t*6)+nearNeck*.068*Math.cos(a*9+phase)+atBase*.045*Math.sin(a*7)+cuff*.18*Math.cos(a*6+phase),rad=body*(1+fold)+extra,c=Math.cos(a),s=Math.sin(a);
  return[Math.sign(c)*Math.abs(c)**.88*rad+slump*t*t,H*t+Math.sin(a*3+phase)*.01*Math.sin(t*Math.PI)+cuff*.018*Math.sin(a*6+phase),Math.sign(s)*Math.abs(s)**.88*rad*depth+.025*Math.sin(t*Math.PI)];
 }
 const p=[],uv=[],idx=[];
 for(let j=0;j<=levels;j++)for(let i=0;i<=N;i++){const t=j/levels,a=i/N*TAU;p.push(...point(t,a));uv.push(i/N*4,t*5);}
 for(let j=0;j<levels;j++)for(let i=0;i<N;i++){const a=j*(N+1)+i,c=a+N+1;idx.push(a,c,a+1,a+1,c,c+1);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();b.add(g,M.fiber,0,0,0,1,1,1,0,0,0,.94+r()*.055);g.dispose();
 b.face(M.fiber,Array.from({length:N},(_,i)=>point(0,i/N*TAU)),.82);
 // The short surplus cloth is a ruffled open cuff with a real inner return.
 for(let i=0;i<N;i++){const a=i/N*TAU,c=(i+1)/N*TAU;b.face(M.fiber,[point(1,a),point(1,c),point(1,c,-.005),point(1,a,-.005)],.9);b.face(M.fiber,[point(1,a,-.005),point(1,c,-.005),point(.86,c,-.005),point(.86,a,-.005)],.81);}
 // Rolled stitched side seams, belly puckers and tied gathered fabric neck.
 for(const a of[0,Math.PI]){const pts=[];for(let j=1;j<=14;j++)pts.push(point(j/17,a,.005));tube(b,M.fiber,pts,.0055,.79,4);}
 const neckT=.835,cx=slump*neckT*neckT,cz=.025*Math.sin(neckT*Math.PI),rr=radius(neckT)*W/2+.006;
 ring(b,M.dark,H*neckT,rr,rr*depth,.008,20,.91,cx,cz,4);
 tube(b,M.dark,[[cx+rr,H*neckT,cz],[cx+rr+.035,H*neckT-.02,cz+.035],[cx+rr+.04,H*neckT-.10,cz+.053]],.006,.88,4);
 tube(b,M.dark,[[cx+rr,H*neckT,cz],[cx+rr+.055,H*neckT+.014,cz+.028],[cx+rr+.038,H*neckT-.035,cz+.045],[cx+rr,H*neckT,cz]],.006,.88,4);
 // A faded paired mill stripe conforms to the fabric instead of a flat decal.
 for(const center of[1.35,1.80])for(let j=0;j<10;j++){const t=.18+j*.041,t2=t+.033;b.face(M.fiber,[point(t,center-.014,.002),point(t2,center-.014,.002),point(t2,center+.014,.002),point(t,center+.014,.002)],[.89,.72,.58]);}
 return{};
}
function hay(b,r,v){
 const w=1.17+r()*.08,h=.62+r()*.06,d=.73+r()*.05,ch=.065;
 const outline=[[-w/2+ch,-d/2],[w/2-ch,-d/2],[w/2,-d/2+ch],[w/2,d/2-ch],[w/2-ch,d/2],[-w/2+ch,d/2],[-w/2,d/2-ch],[-w/2,-d/2+ch]],rings=[];
 for(let j=0;j<7;j++){const t=j/6,bulge=j===0||j===6?.95:1+(r()-.5)*.024;rings.push(outline.map(([x,z],k)=>[x*bulge,h*t+(j===0||j===6?0:(r()-.5)*.025),z*bulge]));}
 for(let j=0;j<6;j++)for(let i=0;i<8;i++)b.face(M.hay,[rings[j][i],rings[j+1][i],rings[j+1][(i+1)%8],rings[j][(i+1)%8]],.80+r()*.19);
 b.face(M.hay,[...rings[6]].reverse(),.94);b.face(M.hay,rings[0],.79);
 // Compressed layered flakes run along the bale; short irregular stalks lie
 // against the faces with a few breakaway ends around the silhouette.
 for(const side of[-1,1])for(let strand=0;strand<33;strand++){
  const yy=.055+r()*(h-.12),z=side*(d/2+.006),len=w*(.11+r()*.21),xx=-w*.46+r()*(w*.91-len),slope=(r()-.5)*.17,pts=[];
  for(let k=0;k<3;k++)pts.push([xx+k*len/2,yy+slope*(k/2-.5)+(r()-.5)*.015,z+(r()-.5)*.018]);tube(b,M.hay,pts,.0036+r()*.002,.72+r()*.31,3);
 }
 for(let i=0;i<44;i++){
  const x=(r()-.5)*w*.91,z=(r()-.5)*d*.88,len=.12+r()*.33,yy=h+.003+r()*.006;tube(b,M.hay,[[Math.max(-w*.48,x-len/2),yy,z],[Math.min(w*.48,x+len/2),yy+(r()-.5)*.011,z+(r()-.5)*.035]],.0035+r()*.002,.82+r()*.22,3);
 }
 for(const side of[-1,1])for(let i=0;i<25;i++){
  const y=.055+r()*(h-.11),z=(r()-.5)*d*.91,len=.045+r()*.09,x=side*w*.503;tube(b,M.hay,[[x,y,z],[x+(r()-.5)*.02,y+len,z+(r()-.5)*.045]],.0045,.72+r()*.25,3);
 }
 for(const xx of[-w*.29,w*.29]){
  tube(b,M.dark,[[xx,.012,-d*.46],[xx,h*.10,-d*.502],[xx,h*.91,-d*.50],[xx,h+.015,-d*.43],[xx,h+.015,d*.43],[xx,h*.91,d*.50],[xx,h*.10,d*.502],[xx,.012,d*.46]],.009,.88,5);
  tube(b,M.dark,[[xx-.028,h+.018,.075],[xx+.022,h+.024,.095],[xx+.045,h+.02,.063]],.006,.9,4);
 }
 return{supportPlane:{height:h+.028,halfX:w*.43,halfZ:d*.38},closed:true};
}
function vessel(b,r,v,kind){
 if(kind==='jug'){
  const h=.40+r()*.045,wide=.145+r()*.013,k=h/.43;
  profile(b,M.ceramic,[[0,.011],[wide*.78,.011],[wide*.97,.022],[wide,.052],[wide,.24*k],[wide*.90,.30*k],[.058,.355*k],[.053,.399*k],[.058,.409*k],[.058,.423*k],[.042,.423*k],[.040,.390*k]],24,[.98,.95,.88]);
  profile(b,M.ceramic,[[wide*.99,.255*k],[wide*.91,.30*k],[.059,.355*k],[.054,.399*k]],24,[.54,.41,.29]);
  const pts=[];for(let j=0;j<=12;j++){const a=-1.24+j/12*4.76;pts.push([wide*.83+Math.cos(a)*.091,.295*k+Math.sin(a)*.105*k,0]);}tube(b,M.ceramic,pts,.022,[.57,.45,.32],6);
  profile(b,M.wood,[[0,.417*k],[.039,.417*k],[.041,.447*k],[.035,.452*k],[0,.452*k]],16,.71);
  return{closed:true};
 }
 const jar=kind==='jar',h=jar?.305+r()*.033:.345+r()*.066,w=jar?.102+r()*.008:.054+r()*.007,k=h/(jar?.33:.39),n=24,tone=jar?[.93,1,.97]:v%3===0?[.82,.92,.77]:[.90,.99,.93];
 if(jar){
  profile(b,M.glass,[[0,.009],[w*.85,.009],[w,.021],[w,.240*k],[w*.91,.267*k],[w*.88,.292*k],[w*.91,.296*k],[w*.91,.306*k],[w*.78,.306*k],[w*.76,.286*k]],n,tone);
  for(const yy of[.287,.298])ring(b,M.glass,yy*k,w*.905,w*.905,.0055,24,tone,0,0,4);
  if(v%3!==1){profile(b,M.iron,[[0,.318*k],[w*.87,.318*k],[w*.93,.310*k],[w*.93,.326*k],[w*.87,.331*k],[0,.331*k]],24,.87);ring(b,M.iron,.314*k,w*.932,w*.932,.0035,24,.73,0,0,4);}
 }else{
  const shoulder=v%2?.63:.59;
  profile(b,M.glass,[[0,.01],[w*.77,.01],[w*.95,.018],[w,.035],[w,h*shoulder],[w*.94,h*(shoulder+.025)],[w*.60,h*.735],[.021,h*.775],[.021,h*.947],[.026,h*.959],[.027,h*.986],[.024,h],[.015,h],[.014,h*.94],[.015,h*.790]],n,tone);
  ring(b,M.glass,.026,w*.94,w*.94,.004,24,tone,0,0,4);
  if(v%4===0)profile(b,M.wood,[[0,h*.99],[.017,h*.99],[.019,h*1.025],[.016,h*1.030],[0,h*1.030]],12,.69);
 }
 return{closed:jar?v%3!==1:v%4===0};
}
// Solid steel ribbon: separate darker back and polished bevel strip, bounded
// thickness on all exposed edges (no single zero-thickness tool silhouettes).
function blade(b,outer,inner,thick=.007){
 for(let i=0;i<outer.length-1;i++){
  const a=outer[i],c=outer[i+1],d=inner[i+1],e=inner[i],lift=p=>[p[0],p[1],p[2]+thick/2],drop=p=>[p[0],p[1],p[2]-thick/2];
  b.face(M.iron,[lift(a),lift(c),lift(d),lift(e)],.89);b.face(M.iron,[drop(e),drop(d),drop(c),drop(a)],.64);
  b.face(M.iron,[drop(a),drop(c),lift(c),lift(a)],.69);b.face(M.iron,[lift(e),lift(d),drop(d),drop(e)],1.15);
 }
 b.face(M.iron,[[...outer[0]].map((x,k)=>x+(k===2?thick/2:0)),[...inner[0]].map((x,k)=>x+(k===2?thick/2:0)),[...inner[0]].map((x,k)=>x-(k===2?thick/2:0)),[...outer[0]].map((x,k)=>x-(k===2?thick/2:0))],.7);
}
function tool(b,r,v,kind){
 const h=1.87+r()*.10,grip=.028+r()*.003;
 if(kind==='sickle'){
  const handle=.32+r()*.025;tube(b,M.wood,[[0,.03,0],[0,.075,0],[.008,.24,0],[.004,handle,0]],[.029,.033,.030,.025],.72,8);
  b.rod(M.iron,[.004,handle-.032,0],[.004,handle+.066,0],.025,.69,.018);
  const outer=[],inner=[];for(let i=0;i<=19;i++){const t=i/19,a=-.11+t*3.12,rad=.248,width=.052*(1-t)**.8+.002;outer.push([-.225+Math.cos(a)*(rad+width),handle+.057+Math.sin(a)*(rad+width),0]);inner.push([-.225+Math.cos(a)*rad,handle+.057+Math.sin(a)*rad,0]);}blade(b,outer,inner,.009);
  return{tool:true,wallContact:[-.225,handle+.334,-.0045]};
 }
 if(kind==='shovel'){
  // Dished round-point blade: central pressed ridge, curled shoulders and
  // a sharpened point. The wooden shaft enters a separate steel socket.
  const levels=[[.006,.008,.068],[.058,.093,.057],[.17,.151,.033],[.30,.150,.006],[.38,.110,-.003]],front=[],back=[];
  for(const [y,w,z]of levels){front.push([[-w,y,z],[0,y,z-.024],[w,y,z]]);back.push([[-w,y,z-.008],[0,y,z-.032],[w,y,z-.008]]);}
  for(let j=0;j<levels.length-1;j++)for(let k=0;k<2;k++){b.face(M.iron,[front[j][k],front[j+1][k],front[j+1][k+1],front[j][k+1]],.88);b.face(M.iron,[back[j][k+1],back[j+1][k+1],back[j+1][k],back[j][k]],.68);}
  for(const k of[0,2])for(let j=0;j<levels.length-1;j++)b.face(M.iron,[front[j][k],back[j][k],back[j+1][k],front[j+1][k]],1.15);
  for(const s of[-1,1])tube(b,M.iron,[[s*.068,.382,-.006],[s*.151,.346,.002],[s*.154,.331,.006]],.012,.66,6);
  tube(b,M.iron,[[0,.29,-.008],[0,.40,-.020],[0,.56,-.018]],[.037,.034,.029],.62,8);
  tube(b,M.wood,[[0,.46,-.018],[.007,.72,-.012],[-.004,1.28,0],[0,h-.03,0]],[.027,.029,.027,grip],.76,8);
  tube(b,M.wood,[[0,h-.095,0],[0,h-.015,0],[0,h,0]],[grip,grip*1.12,grip*.90],.82,8);
  b.rod(M.iron,[-.034,.45,-.015],[.034,.45,-.015],.008,.57);
 }else if(kind==='fork'){
  const tines=v%3===0?5:4,width=tines===5?.38:.33;
  tube(b,M.wood,[[0,.39,-.022],[.012,.72,-.012],[0,1.28,0],[0,h,0]],[.026,.029,.027,grip],.79,8);
  tube(b,M.iron,[[0,.29,.004],[0,.42,-.022],[0,.55,-.023]],[.025,.033,.027],.64,8);
  tube(b,M.iron,[[-width/2,.31,.020],[0,.32,.006],[width/2,.31,.020]],.017,.66,6);
  for(let i=0;i<tines;i++){
   const x=-width/2+i*width/(tines-1);tube(b,M.iron,[[x,.32,.023],[x,.23,.036],[x,.10,.087],[x*.97,.015,.115]],[.013,.012,.010,.003],.77,6);
  }
  b.rod(M.iron,[-.034,.44,-.018],[.034,.44,-.018],.007,.56);
 }else{
  // Long ash snath with double hand grips and curved mowing blade.
  tube(b,M.wood,[[.11,.064,.042],[.025,.38,.028],[.055,.90,.006],[-.035,1.42,0],[0,h,0]],[.031,.032,.033,.031,grip],.72,8);
  for(const [x,y,z]of[[.052,.76,.014],[-.022,1.35,.002]]){
   tube(b,M.iron,[[x-.005,y-.029,z],[x-.005,y+.029,z]],.037,.61,6);
   tube(b,M.wood,[[x,y,z],[x-.16,y+.036,z+.035],[x-.205,y+.13,z+.05]],[.022,.022,.026],.76,6);
  }
  tube(b,M.iron,[[.10,.075,.042],[.046,.13,.035],[.032,.22,.031]],[.04,.036,.032],.67,8);
  // Blade lies nearly flat on ground, sweeping left; bent steel has thickness.
  const outer=[],inner=[];for(let i=0;i<=20;i++){const t=i/20,x=.13-t*.88,z=.064+.19*Math.sin(t*1.72),width=.095*(1-t)**.65+.003;outer.push([x,.031+.02*Math.sin(t*Math.PI),z]);inner.push([x,.031+.02*Math.sin(t*Math.PI),z+width]);}
  for(let i=0;i<20;i++){
   const a=outer[i],c=outer[i+1],d=inner[i+1],e=inner[i],drop=p=>[p[0],p[1]-.008,p[2]];
   b.face(M.iron,[a,c,d,e],.87);b.face(M.iron,[drop(e),drop(d),drop(c),drop(a)],.62);b.face(M.iron,[a,drop(a),drop(c),c],.72);b.face(M.iron,[e,d,drop(d),drop(e)],1.17);
  }
 }
 // Contact is snapped to the actual cached top-back surface vertex below.
 return{tool:true,wallContact:[0,h-.018,-grip],contactHint:[0,h-.018,-grip]};
}
const kinds=['crate','basket','sack','hay','bottle','jar','jug','sickle','shovel','fork','scythe'];
function build(kind,v){
 const seed=(kinds.indexOf(kind)+1)*0x8da6b343^v*0xd8163841,r=random(seed),b=new Batch();let metadata;
 if(kind==='crate')metadata=crate(b,r,v);else if(kind==='basket')metadata=basket(b,r,v);else if(kind==='sack')metadata=sack(b,r,v);else if(kind==='hay')metadata=hay(b,r,v);else if(['bottle','jar','jug'].includes(kind))metadata=vessel(b,r,v,kind);else metadata=tool(b,r,v,kind);
 const out=b.finish(),group=out.group,bounds=new T.Box3().setFromObject(group),center=bounds.getCenter(new T.Vector3()),shift=new T.Vector3(-center.x,-bounds.min.y,-center.z);group.name=`yard-${kind}-${v}`;
 // Bake recentering. Mesh transforms remain identities for later batching.
 for(const mesh of group.children){mesh.geometry.translate(shift.x,shift.y,shift.z);mesh.geometry.computeBoundingBox();mesh.geometry.computeBoundingSphere();}
 bounds.setFromObject(group);const unique=new Map(),points=[];
 for(const mesh of group.children){const a=mesh.geometry.attributes.position;for(let i=0;i<a.count;i++){const p=[a.getX(i),a.getY(i),a.getZ(i)],key=p.map(x=>Math.round(x*1e6)).join(',');if(!unique.has(key)){unique.set(key,p);points.push(p);}}}
 // Lower-envelope candidates include raised lower silhouettes so a rigid lean
 // can choose the correct ground vertex. These are real geometry points.
 const basePoints=points.filter(p=>p[1]<=Math.min(bounds.max.y*.38,.42)+1e-6);
 if(metadata.wallContact){
  const hint=new T.Vector3(...(metadata.contactHint||metadata.wallContact)).add(shift);let best=null,score=Infinity;
  for(const p of points){const s=(p[0]-hint.x)**2+(p[1]-hint.y)**2+(p[2]-hint.z)**2;if(s<score){score=s;best=p;}}
  metadata.wallContact=[...best];delete metadata.contactHint;
 }
 for(const key of['supportPlane','nestPlane'])if(metadata[key])metadata[key]={...metadata[key],height:metadata[key].height+shift.y,centerX:shift.x,centerZ:shift.z};
 group.userData.yardAsset={kind,variant:v,...out.stats};return{group,bounds,basePoints,...metadata,stats:out.stats};
}
export function getYardAsset(kind,variant=0){
 if(!kinds.includes(kind))throw new RangeError(`Unknown yard asset: ${kind}`);
 const v=((Math.trunc(variant)||0)%8+8)%8,key=kind+':'+v;if(!cache.has(key))cache.set(key,build(kind,v));const a=cache.get(key);
 return{...a,group:a.group.clone(true),bounds:a.bounds.clone(),basePoints:a.basePoints.map(p=>[...p]),...(a.wallContact?{wallContact:[...a.wallContact]}:{}),...(a.supportPlane?{supportPlane:{...a.supportPlane}}:{}),...(a.nestPlane?{nestPlane:{...a.nestPlane}}:{}),stats:{...a.stats}};
}
