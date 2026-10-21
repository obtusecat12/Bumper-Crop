// V140 P1: real-shape shelf goods for the V138 stores (user 10-21 22:30: no textured boxes standing in for round things,
// no single photo stretched over a shelf). Every product is modelled in its own shape and wears its own printed art:
//   cans / tins (lathed body, rolled rims, pull-tab lid), PET bottles (lathed body showing the drink, label band, ribbed cap),
//   jars (glass + contents, metal lid), yogurt cups (tapered, foil lid), chip / candy bags (puffed pillow with crimped seals),
//   boxes (front art + their own sides, back, top), gable-top milk cartons, detergent jugs (chamfered body, handle, cap).
// Art = assets/l11-v140/goods140*.webp packed by bc/tools/retail140_p1_assets.py from one generated print per product
// (art-v140retail/p1); baseColor + roughness/metalness (G/B) + normal. Geometry takes the art's aspect (no stretching).
// Products are built per shelf run straight into one merged geometry (one b.add per run) so a store stays cheap to build.
import * as T from './vendor/three.module.min.js';
import {UV140,ITEM140,CAT140} from './retail140-goods-uv.js?v=140b';
const A=new URL('./assets/l11-v140/',import.meta.url).href,V='140b',PI=Math.PI;
function tex(name,srgb){const t=new T.TextureLoader().load(A+name+'.webp?v='+V);if(srgb)t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;t.magFilter=T.NearestFilter;return t;}
export function addRetail140Goods(m){
 if(m.r138p140)return m;
 const map=tex('goods140',true),orm=tex('goods140_r',false),nrm=tex('goods140_n',false);
 const mk=glow=>{const mat=new T.MeshStandardMaterial({map,emissive:0xffffff,emissiveMap:map,emissiveIntensity:glow,roughness:1,metalness:1,roughnessMap:orm,metalnessMap:orm,
   normalMap:nrm,normalScale:new T.Vector2(.9,.9),vertexColors:true});
  // the store light is baked (emissive = albedo × bake): let the normal map shade it too, against a fixed key light in view space
  mat.onBeforeCompile=s=>{s.fragmentShader=s.fragmentShader.replace('#include <lights_fragment_begin>',
   'vec3 L140=normalize(vec3(-.25,.75,.62));totalEmissiveRadiance*=clamp((.5+.5*dot(normal,L140))/max(.25,.5+.5*dot(nonPerturbedNormal,L140)),.55,1.35);\n#include <lights_fragment_begin>');};
  mat.customProgramCacheKey=()=>'r140g';return mat;};
 m.r138p140=mk(.24);m.r138p140c=mk(.42); // shelf / inside coolers (lit by the case lamps)
 return m;
}
// ---------------- templates (built once, local frame: bottom centre at origin, front faces +z) ----------------
class Acc{constructor(){this.p=[];this.n=[];this.u=[];}
 v(x,y,z,nx,ny,nz,u,w){this.p.push(x,y,z);this.n.push(nx,ny,nz);this.u.push(u,w);}
 tri(a,b,c){for(const q of[a,b,c])this.v(...q);}
 quad(a,b,c,d){this.tri(a,b,c);this.tri(a,c,d);}
 done(w,d,h){return{p:new Float32Array(this.p),n:new Float32Array(this.n),u:new Float32Array(this.u),w,d,h};}}
const R=k=>UV140[k];
const at=(r,s,t)=>[r[0]+(r[2]-r[0])*s,r[1]+(r[3]-r[1])*t];
const sub=(r,s0,t0,s1,t1)=>[r[0]+(r[2]-r[0])*s0,r[1]+(r[3]-r[1])*t0,r[0]+(r[2]-r[0])*s1,r[1]+(r[3]-r[1])*t1];
/** surface of revolution. prof = [[radius,y,cellRect,t0,t1]...]: segment i→i+1 wears prof[i]'s rect (s around, t0..t1 up).
 *  sx/sz scale (ellipse), phase rotates the seam; s = .5 faces +z. */
function lathe(a,prof,N,{sx=1,sz=1,phase=0}={}){
 for(let i=0;i<prof.length-1;i++){const[r0,y0,rc,t0,t1]=prof[i],[r1,y1]=prof[i+1];if(!rc)continue;const dr=r1-r0,dy=y1-y0,l=Math.hypot(dr,dy)||1,nr=dy/l,ny=-dr/l;
  for(let j=0;j<N;j++){const s0=j/N,s1=(j+1)/N,f0=(s0-.5)*2*PI+phase,f1=(s1-.5)*2*PI+phase;
   const P=(r,y,f,s,t)=>{const nx=Math.sin(f)*nr/sx,nz=Math.cos(f)*nr/sz,nl=Math.hypot(nx,ny,nz);const[u,w]=at(rc,s,t);return[Math.sin(f)*r*sx,y,Math.cos(f)*r*sz,nx/nl,ny/nl,nz/nl,u,w];};
   a.quad(P(r0,y0,f0,s0,t0),P(r0,y0,f1,s1,t0),P(r1,y1,f1,s1,t1),P(r1,y1,f0,s0,t1));}}
}
function disc(a,r,y,rc,N,{sx=1,sz=1,phase=0,down=false}={}){const[cu,cv]=at(rc,.5,.5),hu=(rc[2]-rc[0])*.48,hv=(rc[3]-rc[1])*.48;
 for(let j=0;j<N;j++){const f0=(j/N-.5)*2*PI+phase,f1=((j+1)/N-.5)*2*PI+phase,ny=down?-1:1;
  const P=f=>[Math.sin(f)*r*sx,y,Math.cos(f)*r*sz,0,ny,0,cu+Math.sin(f)*hu,cv-Math.cos(f)*hv];const C=[0,y,0,0,ny,0,cu,cv];
  if(down)a.tri(C,P(f1),P(f0));else a.tri(C,P(f0),P(f1));}}
/** axis-aligned box faces with their own cells: o = {front,back,left,right,top} rects (missing = face skipped) */
function boxF(a,x0,y0,z0,x1,y1,z1,o){
 const F=(rc,pts,n,flipU)=>{if(!rc)return;const q=pts.map(([x,y,z,s,t])=>{const[u,w]=at(rc,flipU?1-s:s,t);return[x,y,z,...n,u,w];});a.quad(...q);};
 F(o.front,[[x0,y0,z1,0,0],[x1,y0,z1,1,0],[x1,y1,z1,1,1],[x0,y1,z1,0,1]],[0,0,1]);
 F(o.back,[[x1,y0,z0,0,0],[x0,y0,z0,1,0],[x0,y1,z0,1,1],[x1,y1,z0,0,1]],[0,0,-1]);
 F(o.right,[[x1,y0,z1,0,0],[x1,y0,z0,1,0],[x1,y1,z0,1,1],[x1,y1,z1,0,1]],[1,0,0]);
 F(o.left,[[x0,y0,z0,0,0],[x0,y0,z1,1,0],[x0,y1,z1,1,1],[x0,y1,z0,0,1]],[-1,0,0]);
 F(o.top,[[x0,y1,z1,0,0],[x1,y1,z1,1,0],[x1,y1,z0,1,1],[x0,y1,z0,0,1]],[0,1,0]);
 F(o.bottom,[[x0,y0,z0,0,0],[x1,y0,z0,1,0],[x1,y0,z1,1,1],[x0,y0,z1,0,1]],[0,-1,0]);
}
/** puffed pillow (chip bag / candy wrapper): front + back grids meeting at the seams, crimped flat bands top & bottom */
function pillow(a,w,h,puff,fr,bk,nu=4,nv=6,crimp=.07){
 const g=v=>v<crimp||v>1-crimp?0:Math.pow(Math.sin(PI*(v-crimp)/(1-2*crimp)),.45);
 const S=(u,v,side)=>{const f=Math.pow(Math.sin(PI*u),.7)*g(v);return[(u-.5)*w*(1-.07*g(v)),v*h,side*puff*f];};
 const N=(u,v,side)=>{const e=.002,p=S(u,v,side),pu=S(Math.min(1,u+e),v,side),pv=S(u,Math.min(1,v+e),side),qu=S(Math.max(0,u-e),v,side),qv=S(u,Math.max(0,v-e),side);
  const du=[pu[0]-qu[0],pu[1]-qu[1],pu[2]-qu[2]],dv=[pv[0]-qv[0],pv[1]-qv[1],pv[2]-qv[2]];let n=[du[1]*dv[2]-du[2]*dv[1],du[2]*dv[0]-du[0]*dv[2],du[0]*dv[1]-du[1]*dv[0]];
  const l=Math.hypot(...n)||1;n=n.map(c=>c/l*side);if(Math.abs(n[2])<.2&&Math.abs(n[0])<.2)n=[0,0,side];return n;};
 const vs=[...new Set([0,crimp,...Array.from({length:nv-1},(_,i)=>crimp+(1-2*crimp)*(i+1)/nv),1-crimp,1])];
 for(const side of[1,-1]){const rc=side>0?fr:bk;
  for(let i=0;i<nu;i++)for(let j=0;j<vs.length-1;j++){const u0=i/nu,u1=(i+1)/nu,v0=vs[j],v1=vs[j+1];
   const P=(u,v)=>{const p=S(u,v,side),n=N(u,v,side),[uu,ww]=at(rc,side>0?u:1-u,v);return[...p,...n,uu,ww];};
   if(side>0)a.quad(P(u0,v0),P(u1,v0),P(u1,v1),P(u0,v1));else a.quad(P(u1,v0),P(u0,v0),P(u0,v1),P(u1,v1));}}
}
function build(key){
 const it=ITEM140[key],a=new Acc(),k=it.kind,L=R(key+':label');
 if(k==='can'){const r=it.r,b0=.008,b1=b0+it.lh,M=sub(R(key+':lid'),.02,.45,.08,.55),rn=Math.min(.027,r*.84),H=b1+.0125;// slim cans get a narrower neck
  lathe(a,[[r*.79,0,M,0,1],[r,b0,L,0,1],[r,b1,M,0,1],[rn,H]],6);
  disc(a,rn,H-.001,R(key+':lid'),6);return a.done(2*r,2*r,H);}
 if(k==='tin'){const r=it.r,b0=.005,b1=b0+it.lh,H=b1+.005,B=R(key+':band');
  lathe(a,[[r-.002,0,B,0,.2],[r,b0,L,0,1],[r,b1,B,0,.2],[r-.002,H]],7);disc(a,r-.002,H-.0005,R(key+':lid'),7);return a.done(2*r,2*r,H);}
 if(k==='pet'){const r=it.r,lh=it.lh,y0=.045,y1=y0+lh,Bd=R(key+':body'),Cs=R(key+':capside');
  lathe(a,[[.022,0,Bd,0,.2],[r,y0,L,0,1],[r,y1,Bd,.3,.7],[r*.6,y1+.065,Bd,.7,1],[.0135,y1+.085]],6);
  const cy=y1+.085;lathe(a,[[.015,cy,Cs,0,1],[.015,cy+.02]],6);disc(a,.015,cy+.02,R(key+':lid'),6);return a.done(2*r,2*r,cy+.02);}
 if(k==='jar'){const r=it.r,lh=it.lh,y0=.018,y1=y0+lh,Bd=R(key+':body'),Cs=R(key+':capside');
  lathe(a,[[r-.006,0,Bd,0,.3],[r,y0,L,0,1],[r,y1,Bd,.7,1],[r-.006,y1+.016]],7);
  const cy=y1+.016;lathe(a,[[r-.004,cy-.002,Cs,0,1],[r-.004,cy+.018]],7);disc(a,r-.004,cy+.018,R(key+':lid'),7);return a.done(2*r,2*r,cy+.019);}
 if(k==='cup'){const r=it.r,lh=it.lh,rb=r*.8,B=R(key+':band');
  lathe(a,[[rb,0,L,0,1],[r,lh,B,0,1],[r+.002,lh+.006]],7);disc(a,r+.002,lh+.006,R(key+':lid'),7);return a.done(2*r+.004,2*r+.004,lh+.01);}
 if(k==='bag'||k==='bar'){const w=it.w,h=it.h,puff=k==='bar'?Math.min(.012,h*.25):Math.min(.06,w*.28);
  pillow(a,w,h,puff,R(key+':front'),R(key+':back'),3,k==='bar'?2:3,k==='bar'?.0:.07);
  if(k==='bar'){/* bar wrappers crimp at the ends (left / right): the art's printed crimps sit there already */}
  return a.done(w,2*puff,h);}
 if(k==='box'){const{w,h,d}=it;boxF(a,-w/2,0,-d/2,w/2,h,d/2,{front:R(key+':front'),back:R(key+':back'),right:R(key+':sideA'),left:R(key+':sideB'),top:R(key+':top')});return a.done(w,d,h);}
 if(k==='carton'){const{w,h,d}=it,g=.045,S=R(key+':sideB'),G=R(key+':gable'),Tp=R(key+':top');
  boxF(a,-w/2,0,-d/2,w/2,h,d/2,{front:R(key+':front'),back:R(key+':back'),right:R(key+':sideA'),left:S});
  const nf=Math.hypot(g,d/2),ny=(d/2)/nf,nz=g/nf;
  for(const sd of[1,-1]){const q=[[-w/2,h,sd*d/2,0,0],[w/2,h,sd*d/2,1,0],[w/2,h+g,0,1,1],[-w/2,h+g,0,0,1]].map(([x,y,z,s,t])=>{const[u,v]=at(G,sd>0?s:1-s,t);return[x,y,z,0,ny,sd*nz,u,v];});
   if(sd>0)a.quad(...q);else a.quad(q[1],q[0],q[3],q[2]);}
  for(const sx of[1,-1]){const P=(z,y,s,t)=>{const[u,v]=at(S,s,t);return[sx*w/2,y,z,sx,0,0,u,v];};const A0=P(d/2,h,0,.85),B0=P(-d/2,h,1,.85),C0=P(0,h+g,.5,1);if(sx>0)a.tri(A0,B0,C0);else a.tri(B0,A0,C0);}
  boxF(a,-w/2+.004,h+g-.002,-.003,w/2-.004,h+g+.014,.003,{front:Tp,back:Tp,top:Tp});return a.done(w,d,h+g+.014);}
 if(k==='jug'){const lw=it.w,lh=it.h,w=lw+.024,d=it.d,H=lh+.1,B=R(key+':body'),c=.012;
  // chamfered body: an octagon swept up with a sloped shoulder; flat front panel carries the label
  const oct=[[w/2-c,d/2],[w/2,d/2-c],[w/2,-d/2+c],[w/2-c,-d/2],[-w/2+c,-d/2],[-w/2,-d/2+c],[-w/2,d/2-c],[-w/2+c,d/2]];
  const rings=[[1,0],[1,lh+.03],[.82,lh+.065],[.5,H-.012]];
  for(let ri=0;ri<rings.length-1;ri++){const[s0,y0]=rings[ri],[s1,y1]=rings[ri+1];for(let i=0;i<8;i++){const p=oct[i],q=oct[(i+1)%8];
   const ex=q[0]-p[0],ez=q[1]-p[1],el=Math.hypot(ex,ez),nx0=-ez/el,nz0=ex/el,sl=(s0-s1)*Math.hypot((p[0]+q[0])/2,(p[1]+q[1])/2)/(y1-y0),nl=Math.hypot(nx0,sl,nz0);
   const V=(pt,s,y,uu,tt)=>{const[u,v]=at(B,uu,tt);return[pt[0]*s,y,pt[1]*s,nx0/nl,sl/nl,nz0/nl,u,v];};
   a.quad(V(p,s0,y0,i/8,ri/3),V(q,s0,y0,i/8+.125,ri/3),V(q,s1,y1,i/8+.125,(ri+1)/3),V(p,s1,y1,i/8,(ri+1)/3));}}
  {const[u,v]=at(B,.5,.5),pts=oct.map(([x,z])=>[x*.5,H-.012,z*.5,0,1,0,u,v]);for(let i=1;i<7;i++)a.tri(pts[0],pts[i],pts[i+1]);}
  const Lf=R(key+':front');boxF(a,-lw/2,.018,d/2,lw/2,.018+lh,d/2+.0015,{front:Lf});
  // cap (front-top) + carry handle (back-top)
  const Cp=R(key+':lid');lathe(a,[[.022,H-.016,sub(Cp,.0,.4,1,.6),0,1],[.022,H+.012]],8,{});disc(a,.022,H+.012,Cp,8);
  for(const x of[-w*.18,w*.18])boxF(a,x-.008,H-.03,-d*.32,x+.008,H+.03,-d*.16,{front:B,back:B,left:B,right:B,top:B});
  boxF(a,-w*.18-.008,H+.02,-d*.32,w*.18+.008,H+.04,-d*.16,{front:B,back:B,left:B,right:B,top:B,bottom:B});
  return a.done(w,d,H+.04);}
 throw Error('r140 kind '+k);
}
const TPL=new Map();const tpl=k=>{if(!TPL.has(k))TPL.set(k,build(k));return TPL.get(k);};
/** the same product lying on its back, front art facing up (+y), bottom toward −z (chest freezers, dump bins).
 *  Round things (cans, cups, tubs) stay upright: tubs sit lid-up in a freezer. */
const FLAT=new Map();
function tplFlat(k){if(FLAT.has(k))return FLAT.get(k);const t=tpl(k);if(STACK.has(ITEM140[k].kind)){FLAT.set(k,t);return t;}
 const p=new Float32Array(t.p.length),n=new Float32Array(t.n.length),d2=t.d/2;
 for(let i=0;i<t.p.length;i+=3){const y=t.p[i+1],z=t.p[i+2];p[i]=t.p[i];p[i+1]=z+d2;p[i+2]=-y+t.h/2;const ny=t.n[i+1],nz=t.n[i+2];n[i]=t.n[i];n[i+1]=nz;n[i+2]=-ny;}
 const f={p,n,u:t.u,w:t.w,d:t.h,h:t.d};FLAT.set(k,f);return f;}
// ---------------- runs ----------------
class Run{constructor(){this.p=[];this.n=[];this.u=[];}
 put(t,x,y,z,ry=0,s=1){const c=Math.cos(ry),sn=Math.sin(ry),P=t.p,N=t.n,U=t.u;
  for(let i=0;i<P.length;i+=3){const px=P[i]*s,pz=P[i+2]*s,nx=N[i],nz=N[i+2];
   this.p.push(x+c*px+sn*pz,y+P[i+1]*s,z-sn*px+c*pz);this.n.push(c*nx+sn*nz,N[i+1],-sn*nx+c*nz);}
  for(let i=0;i<U.length;i++)this.u.push(U[i]);}
 flush(b,key){if(!this.p.length)return;const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(this.p,3));
  g.setAttribute('normal',new T.Float32BufferAttribute(this.n,3));g.setAttribute('uv',new T.Float32BufferAttribute(this.u,2));b.add(g,key,0,0,0);g.dispose();this.p=[];this.n=[];this.u=[];}}
export const ITEMS140=ITEM140;
export function catKey140(cat,G){if(typeof cat==='string')return cat;for(const k of['cool','dairy','frozen','candy','dry'])if(G&&G[k]===cat)return k;return 'dry';}
const STACK=new Set(['can','tin','cup','jar']);
/** one shelf run of real products: x0..x1 along the deck at height y, front edge zFront, deck depth, clearance h.
 *  Facings come in blocks of one SKU (2–7 wide), stacked 2–3 high where they fit, sometimes a sold-out gap; a dark
 *  depth block behind the front row stands in for the rows further back. */
export function goodsRun140(b,r,cat,x0,x1,y,zFront,depth,h,{cold=false,filler=true,lean=0}={}){
 addRetail140Goods(b.mats);const key=cold?'r138p140c':'r138p140',run=new Run();
 let list=(CAT140[cat]||CAT140.dry).filter(k=>tpl(k).h<=h-.015);if(!list.length)list=[(CAT140[cat]||CAT140.dry).reduce((p,q)=>tpl(p).h<tpl(q).h?p:q)];
 let x=x0+.004,maxH=0,gap=r()<.16&&x1-x0>.7?[x0+(x1-x0)*(.2+r()*.5)]:null;if(gap)gap.push(gap[0]+.14+r()*.22);
 while(x<x1-.03){let sku=list[(r()*list.length)|0],t=tpl(sku);const n=2+((r()*6)|0);
  const s=t.h>h-.015?(h-.015)/t.h:1,tw=t.w*s,td=t.d*s,round=STACK.has(ITEM140[sku].kind);
  const tiers=round&&ITEM140[sku].kind!=='can'?Math.max(1,Math.min(2,Math.floor((h-.01)/(t.h*s+.002)))):1;
  for(let i=0;i<n&&x+tw<=x1;i++){
   if(gap&&x+tw>gap[0]&&x<gap[1]){x=gap[1];gap=null;break;}
   const cx=x+tw/2,jz=r()*.012,ry=(r()-.5)*(round?.6:.07);
   for(let k=0;k<tiers;k++){if(k>0&&r()<.12)break;run.put(t,cx+(r()-.5)*.003,y+k*(t.h*s+.002),zFront-td/2-jz,ry+(k?r()-.5:0),s);}
   maxH=Math.max(maxH,tiers*t.h*s);x+=tw+.004+r()*.004;}
  x+=.006;}
 run.flush(b,key);
 if(filler&&depth>.12&&maxH>0)b.box('r138goodsT',(x0+x1)/2,y+maxH*.46,zFront-depth/2-.04,x1-x0-.02,maxH*.9,Math.max(.04,depth-.14));
}
/** a single product (clip strips, counters) */
export function product140(b,sku,x,y,z,ry=0,{cold=false,s=1}={}){addRetail140Goods(b.mats);const run=new Run();run.put(tpl(sku),x,y,z,ry,s);run.flush(b,cold?'r138p140c':'r138p140');}
export function size140(sku){return tpl(sku);}
/** chest-freezer cavity (V140 P1b): real frozen packs lying flat in SKU blocks across the well, two or three layers deep,
 *  tubs upright between them, the top layer picked over (gaps, a few packs askew). Local frame: well centred on x/z, floor y. */
export function chestFill140(b,r,len,D,y,top){
 addRetail140Goods(b.mats);const run=new Run(),list=CAT140.frozen.slice();let x=-len/2+.01;
 while(x<len/2-.06){const sku=list[(r()*list.length)|0],t=tplFlat(sku),n=1+((r()*3)|0),round=STACK.has(ITEM140[sku].kind);
  // a block = one SKU, n columns along x, filled front to back across the well
  for(let c=0;c<n&&x+t.w<=len/2-.005;c++){const cx=x+t.w/2;
   for(let z=-D/2+.01;z+t.d<=D/2-.005;z+=t.d+.006){let lay=Math.max(1,Math.floor((top-y)/(t.h+.003)));
    for(let k=0;k<lay;k++){const last=k===lay-1;if(last&&r()<.3)break;
     const ry=last?(r()-.5)*(round?2:.5):(r()-.5)*.05;run.put(t,cx+(last?(r()-.5)*.02:0),y+k*(t.h+.003),z+t.d/2+(last?(r()-.5)*.02:0),ry);}}
   x+=t.w+.006;}
  x+=.01;}
 run.flush(b,'r138p140c');
}
export function tris140(){const o={};for(const k of Object.keys(ITEM140))o[k]=tpl(k).p.length/9;return o;}
