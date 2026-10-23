// V146 T3 首都街角灰泥联排楼 — the photo's lush summer trees: London planes + common limes, dense enough to press over the sky.
// Each tree = tapered bark trunk + root flare, 4-6 scaffold limbs forking twice (real tubes), then a crown of 70-130 leaf
// clumps; a clump = 3 crossed alpha cards (two vertical + one tilted, plus an underside card on the lower shell) cut from a
// generated foliage photo (pleaf146 plane / lleaf146 lime, own bark pbark146 / lbark146). Cards are emitted double-faced
// with crown-spherical normals (so both faces light alike and the crown reads as one soft mass under the overcast sky), and
// vertex tone falls off with depth into the crown and toward the underside (dark interior, lighter shell).
// Placement follows the reference photo, not the building fronts (the photo shows no trees directly in front of the corner
// house): a mass of trees west of the left terrace and across the street, tall trees in the back gardens behind the left
// terrace, and the two near trees framing the camera corner (upper left / upper right of the photo). Sidewalk trees sit in a
// soil pit (soil146) with a cast-iron grate. Building-local frame of stucco146Task (corner (0,0), y 0 = pavement top).
// Textures bc/tools/stucco146t3_assets.py -> assets/l11-v146.  ?tree146=0 skips this file.
import * as T from './vendor/three.module.min.js';
import {Soup,fbox,face,TILE} from './maltose145-bldg.js?v=145c';
import {shrub131,hedge131} from './shrub131.js?v=131';
const A=new URL('./assets/l11-v146/',import.meta.url).href,TAU=Math.PI*2;
const ON=!/[?&]tree146=0\b/.test(globalThis.location?.search||'');
function tex(n,srgb=true,rep=true){const t=new T.TextureLoader().load(A+n+'.webp?v=146c');if(srgb)t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;t.magFilter=T.NearestFilter;if(rep)t.wrapS=t.wrapT=T.RepeatWrapping;return t;}
let M=null;
function mats(m){if(m.s146pl)return;if(!M){const S=(o)=>new T.MeshStandardMaterial({metalness:0,roughness:1,vertexColors:true,...o});
 const W=(n,o={})=>S({map:tex(n),normalMap:tex(n+'-n',false),roughnessMap:tex(n+'-r',false),...o});
 const L=n=>{const t=tex(n,true,false);t.magFilter=T.LinearFilter;return S({map:t,normalMap:tex(n+'-n',false,false),normalScale:new T.Vector2(.6,.6),alphaTest:.5,roughness:.85});};
 M={s146pb:W('pbark146'),s146lb:W('lbark146'),s146so:W('soil146'),s146pl:L('pleaf146'),s146ll:L('lleaf146')};
 for(const[k,v]of Object.entries(M))v.name='V146 '+k+(k==='s146pl'||k==='s146ll'?' leaf':'');}Object.assign(m,M);}   // T4: ' leaf' keeps the crowns out of the bake targets (soho135-bake MOVING)
Object.assign(TILE,{s146so:[1.2,1.2]});
const V=(x,y,z)=>new T.Vector3(x,y,z);
const KIND={plane:{bark:'s146pb',leaf:'s146pl',asp:.516,clump:2.9,base:.2,n:120,limbs:5,r0:.021},
            lime:{bark:'s146lb',leaf:'s146ll',asp:.641,clump:2.3,base:.16,n:130,limbs:6,r0:.019}};
// leaf buckets: key -> tone level -> {p,n,uv}
class Leaves{constructor(){this.k={};}
 quad(key,tone,P,N,uv){const lv=Math.max(0,Math.min(9,Math.round(tone*10)));const kk=this.k[key]||(this.k[key]={});const s=kk[lv]||(kk[lv]={p:[],n:[],uv:[]});
  for(const i of[0,1,2,0,2,3]){s.p.push(...P[i]);s.n.push(...N[i]);s.uv.push(...uv[i]);}
  for(const i of[0,2,1,0,3,2]){s.p.push(...P[i]);s.n.push(...N[i]);s.uv.push(...uv[i]);}}   // back face, same outward normals
 flush(b){for(const[key,kk]of Object.entries(this.k))for(const[lv,s]of Object.entries(kk)){if(!s.p.length)continue;const g=new T.BufferGeometry();
  g.setAttribute('position',new T.Float32BufferAttribute(s.p,3));g.setAttribute('normal',new T.Float32BufferAttribute(s.n,3));g.setAttribute('uv',new T.Float32BufferAttribute(s.uv,2));
  b.add(g,key,0,0,0,1,1,1,0,0,0,lv/10);g.dispose();}this.k={};}}
function rng(seed){let s=(seed*2654435761)>>>0||1;return()=>((s=(s*1664525+1013904223)>>>0)/4294967296);}
function taper(S,k,A,B,ra,rb,n,v0){const d=B.clone().sub(A),L=d.length();if(L<1e-4)return v0;d.normalize();
 const ref=Math.abs(d.y)<.9?V(0,1,0):V(1,0,0),e1=V().crossVectors(d,ref).normalize(),e2=V().crossVectors(d,e1);
 const ring=(P,r,i)=>{const t=i/n*TAU;return P.clone().addScaledVector(e1,Math.cos(t)*r).addScaledVector(e2,Math.sin(t)*r).toArray();};
 const cu=Math.max(1,Math.round(TAU*ra/.9));for(let i=0;i<n;i++)S.q(k,ring(A,ra,i),ring(A,ra,i+1),ring(B,rb,i+1),ring(B,rb,i),[[i/n*cu,v0],[(i+1)/n*cu,v0],[(i+1)/n*cu,v0+L/1.1],[i/n*cu,v0+L/1.1]]);
 return v0+L/1.1;}
// one tree at (x,z): h total height, cr crown radius
function tree(S,Lv,b,x,z,kind,h,cr,seed,lod){const K=KIND[kind],R=rng(seed),k=K.bark;
 const cb=h*K.base+R()*1.2,ry=(h-cb)/2,cy=cb+ry,C=V(x+(R()-.5)*.8,cy,z+(R()-.5)*.8),r0=Math.max(.16,h*K.r0),ns=lod?5:8;
 // flare + trunk (slight lean toward the crown centre), to the first fork
 const fk=cb+ry*.15,top=V(C.x,fk,C.z);
 taper(S,k,V(x,-.08,z),V(x,.45,z),r0*1.45,r0,ns,0);taper(S,k,V(x,.45,z),V((x+top.x)/2,fk*.55,(z+top.z)/2),r0,r0*.9,ns,.5);taper(S,k,V((x+top.x)/2,fk*.55,(z+top.z)/2),top,r0*.9,r0*.78,ns,fk*.5);
 const tips=[];const nl=K.limbs-(R()<.4?1:0),a0=R()*TAU;
 for(let i=0;i<nl;i++){const az=a0+i/nl*TAU+(R()-.5)*.5,el=.75+R()*.5,d=V(Math.cos(az)*Math.cos(el),Math.sin(el),Math.sin(az)*Math.cos(el));
  const s0=top.clone().add(V(0,-R()*1.2,0)),m=s0.clone().add(V(d.x*cr*.38,d.y*ry*.55,d.z*cr*.38)),rl=r0*.62;
  taper(S,k,s0,m,rl,rl*.75,lod?4:6,0);
  for(let j=0;j<2;j++){const t=(j?1:-1)*(.35+R()*.3),c2=V(Math.cos(az+t)*Math.cos(el*.85),Math.sin(el*.85)+.15,Math.sin(az+t)*Math.cos(el*.85)).normalize();
   const e=m.clone().add(V(c2.x*cr*.42,c2.y*ry*.5,c2.z*cr*.42));taper(S,k,m,e,rl*.7,rl*.42,lod?3:5,0);tips.push(e);
   if(!lod){const e2=e.clone().add(V(c2.x*cr*.18+(R()-.5)*1.2,ry*.25,c2.z*cr*.18+(R()-.5)*1.2));taper(S,k,e,e2,rl*.42,rl*.2,4,0);tips.push(e2);}}}
 // leader up the middle
 const ld=top.clone().add(V((R()-.5)*1.5,ry*1.2,(R()-.5)*1.5));taper(S,k,top,ld,r0*.6,r0*.25,lod?4:6,0);tips.push(ld);
 b.solid(x,z,r0*2.2,r0*2.2);
 // crown: clumps at the limb tips + stratified shell / interior fill
 const N=Math.round(K.n*(lod?.55:1)*(cr/6.5)**1.2),pts=tips.map(p=>p.clone());
 for(let i=0;i<N;i++){let u=R()*2-1,a=R()*TAU;u=u<-.75?-.75+R()*.3:u;const q=Math.sqrt(1-u*u),dir=V(q*Math.cos(a),u,q*Math.sin(a)),t=i%5===0?.3+R()*.35:.68+.32*Math.sqrt(R());
  pts.push(C.clone().add(V(dir.x*cr*t*(1+.12*Math.sin(a*3+seed)),dir.y*ry*t,dir.z*cr*t*(1+.12*Math.cos(a*2+seed)))));}
 for(const P of pts){const rel=V((P.x-C.x)/cr,(P.y-C.y)/ry,(P.z-C.z)/cr),t=Math.min(1.1,rel.length()),nrm=rel.clone().normalize().multiplyScalar(.85).add(V(0,.3,0)).normalize();
  let tone=.5+.5*Math.pow(Math.min(1,t),1.4);if(rel.y<0)tone*=.78+.22*(1+rel.y);tone*=.9+R()*.18;
  const s=K.clump*(t<.6?.8:1)*(.82+R()*.4)*(cr/6.5)**.35,hs=s*K.asp,ya=R()*Math.PI;
  const card=(ax,ay,w,hh)=>{const p0=P.clone().addScaledVector(ax,-w/2).addScaledVector(ay,-hh/2),p1=P.clone().addScaledVector(ax,w/2).addScaledVector(ay,-hh/2),
    p2=P.clone().addScaledVector(ax,w/2).addScaledVector(ay,hh/2),p3=P.clone().addScaledVector(ax,-w/2).addScaledVector(ay,hh/2);
    const nv=[p0,p1,p2,p3].map(p=>V((p.x-C.x)/cr,(p.y-C.y)/ry*.8,(p.z-C.z)/cr).normalize().multiplyScalar(.7).add(nrm).normalize().toArray());
    const f=R()<.5,uv=f?[[1,0],[0,0],[0,1],[1,1]]:[[0,0],[1,0],[1,1],[0,1]];Lv.quad(K.leaf,tone,[p0,p1,p2,p3].map(p=>p.toArray()),nv,uv);};
  for(let j=0;j<2;j++){const a=ya+j*Math.PI/2,tl=(R()-.5)*.5;card(V(Math.cos(a),0,Math.sin(a)),V(-Math.sin(a)*tl,1,Math.cos(a)*tl).normalize(),s,hs);}
  {const a=ya+Math.PI/4,ax=V(Math.cos(a),0,Math.sin(a)),tilt=.9+R()*.5,ay=V(-Math.sin(a)*Math.sin(tilt),Math.cos(tilt),Math.cos(a)*Math.sin(tilt));card(ax,ay,s*.95,s*.95*K.asp*1.3);}
  if(rel.y<-.15&&!lod){const a=ya,ax=V(Math.cos(a),0,Math.sin(a)),ay=V(-Math.sin(a),0,Math.cos(a));card(ax,ay,s*.9,s*.9*K.asp*1.4);}}}
// soil pit + cast-iron grate (sidewalk trees), square w, centred on x,z
function pit(S,x,z,w=1.3){const F=face([x,z],[0,1]),h=w/2;
 S.q('s146so',[x-h,.004,z+h],[x+h,.004,z+h],[x+h,.004,z-h],[x-h,.004,z-h],[[0,0],[w/1.2,0],[w/1.2,w/1.2],[0,w/1.2]]);
 fbox(S,'s146ir',F,-h,h,0,.03,-h,-h+.06,false,'d');fbox(S,'s146ir',F,-h,h,0,.03,h-.06,h,false,'d');
 fbox(S,'s146ir',F,-h,-h+.06,0,.03,-h+.06,h-.06,false,'d');fbox(S,'s146ir',F,h-.06,h,0,.03,-h+.06,h-.06,false,'d');
 for(let i=1;i<9;i++){const u=-h+i*w/9;if(Math.abs(u)<.32)continue;fbox(S,'s146ir',F,u-.012,u+.012,.005,.028,-h+.06,h-.06,false,'d');}
 fbox(S,'s146ir',F,-.36,.36,.005,.03,-.36,-.32,false,'d');fbox(S,'s146ir',F,-.36,.36,.005,.03,.32,.36,false,'d');}
// photo-led placement: [x,z,kind,height,crown radius,pit]
const TREES=[
 // near frame: across the north street (photo upper left) and across the avenue (photo upper right)
 [5.5,21.3,'plane',18,7,1],[21.3,6.5,'plane',17.5,6.8,1],[21.3,-9.5,'lime',16,5.2,1],[-9,21.3,'lime',16.5,5.4,1],
 // mass west of the left terrace (photo left middle) + across the street there, a second row behind it for depth
 [-47,3.4,'plane',20,7.6,1],[-56.5,3.4,'lime',18.5,6.4,1],[-66,3.4,'plane',20,7.6,1],[-42,21.3,'plane',20,7.8,1],[-55,21.3,'lime',19,6.6,1],[-68,21.3,'plane',19,7.4,1],
 [-50,30,'lime',21,7,0],[-63,29,'plane',22,8,0],
 // back gardens: tall trees over the left terrace roofline (x <= -38 so the main building does not hide them from the photo corner)
 [-40,-17,'lime',29,8.5,0],[-51,-21,'plane',28,9,0],[-60,-12,'plane',27,8.6,0],[-25,-24,'plane',23,7.2,0],[-12,-33,'lime',19,5.6,0],
 // further down the avenue on the building side (beyond the main building) and across
 [3.4,-48,'plane',16.5,6.2,1],[21.3,-26,'plane',17,6.5,1]];
export function* stucco146T3Task(b,lod){if(!ON)return;mats(b.mats);const S=new Soup(),Lv=new Leaves();let i=0;
 for(const[x,z,kind,h,cr,p]of TREES){tree(S,Lv,b,x,z,kind,h,cr,0x146c0+i*977,lod);if(p)pit(S,x,z);else if(!lod){S.q('s146so',[x-1.8,.01,z+1.8],[x+1.8,.01,z+1.8],[x+1.8,.01,z-1.8],[x-1.8,.01,z-1.8],[[0,0],[3,0],[3,3],[0,3]]);
   shrub131(b,x+1.6,0,z+.9,{kind:'laurel',seed:i,scale:1.3});shrub131(b,x-1.3,0,z-1.4,{kind:'hydrangea',seed:i+5,scale:1.2});}
  if(++i%4===0){S.flush(b);Lv.flush(b);yield;}}
 S.flush(b);Lv.flush(b);
 // shrubs behind the railing west of the left terrace (photo: dark planting left of the white wall), and a hedge there
 if(!lod){hedge131(b,-62,-42.2,.75,0,{d:1.1,h:1.35,seed:146});for(const[x,k]of[[-43.2,'boxwood'],[-49.5,'laurel'],[-58,'euonymus']])shrub131(b,x,0,1.6,{kind:k,seed:x|0,scale:1.2});}
 yield;}
