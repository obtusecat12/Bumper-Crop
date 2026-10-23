// V145 M3 Maltose Market (麦芽糖市场): the reference photo is a February morning, so every street tree around the market
// (city x 104..344, z -344..4 = blocks (1..2, -3..-1) and their frontages) is a leafless winter tree instead of the green one.
// Real branch geometry: a tapered bark trunk, 3-5 scaffold limbs and three recursive orders of forking branches (bent mid-way,
// upward bias), ending in crossed alpha twig-spray cards (assets/l11-v145/twig145, cut from a generated twig photo) that give
// the photo's fine twig haze. Mature size ~10.5-13 m like the photo's two plane trees; the trees in front of BEIGE (which the
// photo shows bare of trees) are young 5 m ones. Hooked into urban-props addStreetTree (the iron grate stays). ?malt145=0 off.
import * as T from './vendor/three.module.min.js';
import {setStreetTreeHook} from './urban-props.js?v=132st';
import {worldToCity} from './urban-layout.js?v=145c';
import {MALTOSE145_ON} from './maltose145-layout.js?v=145c';
import {Soup,tex} from './maltose145-bldg.js?v=145c';
const TAU=Math.PI*2;let M=null;
function mats(m){if(m.m145bk)return;if(!M){M={m145bk:new T.MeshStandardMaterial({map:tex('bark145'),normalMap:tex('bark145-n',false),roughnessMap:tex('bark145-r',false),vertexColors:true,roughness:1,metalness:0}),
 m145tw:new T.MeshStandardMaterial({map:tex('twig145',true,false),alphaTest:.5,side:T.DoubleSide,vertexColors:true,roughness:1,metalness:0})};
 M.m145bk.name='V145 m145bk';M.m145tw.name='V145 m145tw';}Object.assign(m,M);}
const V=(x,y,z)=>new T.Vector3(x,y,z);
function perp(d,R){const a=Math.abs(d.y)<.9?V(0,1,0):V(1,0,0),e1=V().crossVectors(d,a).normalize(),e2=V().crossVectors(d,e1);const t=R()*TAU;return e1.multiplyScalar(Math.cos(t)).add(e2.multiplyScalar(Math.sin(t)));}
// tapered tube from A (radius ra) to B (radius rb), n sides, bark uv in metres (u around, v along)
function taper(S,A,B,ra,rb,n,v0){const d=B.clone().sub(A),L=d.length();if(L<1e-4)return v0;d.normalize();
 const ref=Math.abs(d.y)<.9?V(0,1,0):V(1,0,0),e1=V().crossVectors(d,ref).normalize(),e2=V().crossVectors(d,e1);
 const ring=(P,r,i)=>{const t=i/n*TAU;return P.clone().addScaledVector(e1,Math.cos(t)*r).addScaledVector(e2,Math.sin(t)*r).toArray();};
 const cu=TAU*ra/.8;for(let i=0;i<n;i++)S.q('m145bk',ring(A,ra,i),ring(A,ra,i+1),ring(B,rb,i+1),ring(B,rb,i),[[i/n*cu,v0],[(i+1)/n*cu,v0],[(i+1)/n*cu,v0+L/.8],[i/n*cu,v0+L/.8]]);
 return v0+L/.8;}
// two crossed twig cards rooted at P growing along d (card plane contains d), w wide, h tall
function twigs(S,P,d,w,h,R){const a=perp(d,R);for(let j=0;j<2;j++){const s=j?V().crossVectors(d,a).normalize():a.clone(),m=R()<.5;
 const p0=P.clone().addScaledVector(s,-w/2),p1=P.clone().addScaledVector(s,w/2),p2=p1.clone().addScaledVector(d,h),p3=p0.clone().addScaledVector(d,h);
 S.q('m145tw',p0.toArray(),p1.toArray(),p2.toArray(),p3.toArray(),m?[[1,0],[0,0],[0,1],[1,1]]:[[0,0],[1,0],[1,1],[0,1]]);}}
function grow(S,P,d,len,rad,depth,R,k){
 // bent limb: two segments, the second turned a little toward the light
 const bend=perp(d,R).multiplyScalar(.18).add(V(0,.08,0)),mid=P.clone().addScaledVector(d,len*.5),d2=d.clone().add(bend).normalize(),E=mid.clone().addScaledVector(d2,len*.5);
 const n=depth===0?6:depth===1?5:depth===2?4:3;taper(S,P,mid,rad,rad*.86,n,0);taper(S,mid,E,rad*.86,rad*.7,n,len*.5/.8);
 if(depth>=3){twigs(S,E.clone().addScaledVector(d2,-len*.15),d2,len*1.35*k,len*.7*k,R);return;}
 if(depth===2)twigs(S,mid,d.clone().add(V(0,.35,0)).normalize(),len*.85,len*.45,R);   // side spray mid-branch: crown density
 const nc=depth===0?3:2+(R()<.45?1:0);
 for(let i=0;i<nc;i++){const ang=(.38+R()*.32)*(depth===0?1:.9),ax=perp(d2,R);const c=d2.clone().applyAxisAngle(ax,ang).add(V(0,.12+.1*depth,0)).normalize();
  grow(S,E,c,len*(.62+R()*.12),rad*.6,depth+1,R,k);}}
export function winterTree145(S,seed,scale=1,young=false){let s=(seed*2654435761)>>>0||1;const R=()=>((s=(s*1664525+1013904223)>>>0)/4294967296);
 const k=(young?.42:1)*scale/.92*(.92+R()*.18),th=(2.7+R()*.7)*k,lean=V((R()-.5)*.25,1,(R()-.5)*.25).normalize();
 const r0=(young?.09:.24)*Math.max(.7,k);
 // root flare + trunk in two pieces
 const A=V(0,0,0),Bm=A.clone().addScaledVector(lean,th*.55),B=A.clone().addScaledVector(lean,th);
 taper(S,V(0,-.05,0),V(0,.35,0),r0*1.35,r0,7,0);taper(S,V(0,.35,0),Bm,r0,r0*.88,7,.5);taper(S,Bm,B,r0*.88,r0*.75,7,2);
 const ns=3+(R()*2.6|0),a0=R()*TAU;
 for(let i=0;i<ns;i++){const az=a0+i/ns*TAU+(R()-.5)*.6,el=.62+R()*.38,d=V(Math.cos(az)*Math.cos(el),Math.sin(el),Math.sin(az)*Math.cos(el)).normalize();
  const P=B.clone().addScaledVector(lean,-R()*th*.2);grow(S,P,d,(3.3+R()*1.2)*k,r0*.62,0,R,1);}
 // a leader continuing up the middle
 grow(S,B,lean.clone().add(V((R()-.5)*.2,0,(R()-.5)*.2)).normalize(),3.6*k,r0*.55,1,R,1);}
const ZONE=[104,344,-344,4],BEIGE=[172,216,-126,-98];
// V145 M7: a free-standing winter tree at block-local (x,y,z) of the current builder frame (the photo's bare tree in front of the red block)
export function winterTreeAt145(b,x,y,z,seed,scale=1){mats(b.mats);b.push(x,y,z,0);const S=new Soup();winterTree145(S,seed,scale);S.flush(b);b.pop();}
setStreetTreeHook((b,seed,scale)=>{if(!MALTOSE145_ON)return false;const p=b.point(0,0,0),c=worldToCity(p.x,p.z);
 if(c.x<ZONE[0]||c.x>ZONE[1]||c.z<ZONE[2]||c.z>ZONE[3])return false;mats(b.mats);
 const young=c.x>BEIGE[0]&&c.x<BEIGE[1]&&c.z>BEIGE[2]&&c.z<BEIGE[3];const S=new Soup();winterTree145(S,seed,scale,young);S.flush(b);return true;});
