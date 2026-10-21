// V140 P1b-2: supermarket fixture props in real shape (user 10-21 22:30): shipping cases with their own six faces
// (print / label / logo end / taped top, cropped to each face's aspect, never stretched), slatted wooden pallet with open
// display trays of real product, tapered slotted plastic hand baskets with bail handles, wire shopping carts built from
// real wire rods (grid panels, child-seat flap, plastic handle, lathed caster wheels), and checkout parts: rubber belt
// over steel rollers, bioptic scanner (platter + sloped tower window), POS monitor housing with its screen, keyboard
// wedge, cash drawer, receipt printer with paper curl, PIN pad, readable produce price cards.
// Art = assets/l11-v140/fix140*.webp from bc/tools/retail140_p1b2_fixtures.py (baseColor+alpha, roughness/metal, normal).
import * as T from './vendor/three.module.min.js';
import {UVX140,ASPX140} from './retail140-fixtures-uv.js?v=140c';
import {product140,size140} from './retail140-goods.js?v=140b';
const A=new URL('./assets/l11-v140/',import.meta.url).href,V='140c',PI=Math.PI;
function tex(name,srgb){const t=new T.TextureLoader().load(A+name+'.webp?v='+V);if(srgb)t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;t.magFilter=T.NearestFilter;return t;}
export function addRetail140Fixtures(m){
 if(m.r138p140x)return m;
 const map=tex('fix140',true),orm=tex('fix140_r',false),nrm=tex('fix140_n',false);
 const mk=(glow,key)=>{const mat=new T.MeshStandardMaterial({map,emissive:0xffffff,emissiveMap:map,emissiveIntensity:glow,roughness:1,metalness:1,roughnessMap:orm,metalnessMap:orm,
   normalMap:nrm,normalScale:new T.Vector2(.9,.9),vertexColors:true,alphaTest:.5});
  // baked store light rides in emissive: let the normal map shade it against a fixed view-space key light (as retail140-goods)
  mat.onBeforeCompile=s=>{s.fragmentShader=s.fragmentShader.replace('#include <lights_fragment_begin>',
   'vec3 L140=normalize(vec3(-.25,.75,.62));totalEmissiveRadiance*=clamp((.5+.5*dot(normal,L140))/max(.25,.5+.5*dot(nonPerturbedNormal,L140)),.55,1.35);\n#include <lights_fragment_begin>');};
  mat.customProgramCacheKey=()=>key;return mat;};
 m.r138p140x=mk(.22,'r140x');m.r138p140xe=mk(.95,'r140xe'); // props / screens & scanner glass
 return m;
}
const rng=seed=>{let s=(seed>>>0)||1;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return((s>>>0)%100000)/100000;};};
const sub=(rc,s0,t0,s1,t1)=>[rc[0]+(rc[2]-rc[0])*s0,rc[1]+(rc[3]-rc[1])*t0,rc[0]+(rc[2]-rc[0])*s1,rc[1]+(rc[3]-rc[1])*t1];
/** cell rect cropped (centred, or at offset o 0..1) to a face of aspect w/h, so no print is ever stretched */
function fit(name,asp,o=.5){const rc=UVX140[name],A0=ASPX140[name];if(asp<A0){const f=asp/A0,s=(1-f)*o;return sub(rc,s,0,s+f,1);}const f=A0/asp,t=(1-f)*o;return sub(rc,0,t,1,t+f);}
const cell=(c,asp)=>Array.isArray(c)?c:asp?fit(c,asp):UVX140[c];
const nrmz=v=>{const l=Math.hypot(v[0],v[1],v[2])||1;return[v[0]/l,v[1]/l,v[2]/l];};
const crs=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const dif=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
/** accumulator with a local frame (x,y,z,ry) like UrbanBatch.push; flushes straight into one merged part per key */
class Acc{constructor(){this.p=[];this.n=[];this.u=[];this.f=[0,0,0,0];this.st=[];}
 push(x,y,z,ry=0){this.st.push(this.f);const[fx,fy,fz,fr]=this.f,c=Math.cos(fr),s=Math.sin(fr);this.f=[fx+c*x+s*z,fy+y,fz-s*x+c*z,fr+ry];}
 pop(){this.f=this.st.pop();}
 v(p,n,u){const[fx,fy,fz,fr]=this.f,c=Math.cos(fr),s=Math.sin(fr);this.p.push(fx+c*p[0]+s*p[2],fy+p[1],fz-s*p[0]+c*p[2]);this.n.push(c*n[0]+s*n[2],n[1],-s*n[0]+c*n[2]);this.u.push(u[0],u[1]);}
 /** quad p0..p3 counter-clockwise seen from the front; rc = uv rect; normals flat unless ns given */
 quad(P,rc,ns){const n=ns||[nrmz(crs(dif(P[1],P[0]),dif(P[3],P[0])))];const N=i=>ns?ns[i]:n[0];const U=[[rc[0],rc[1]],[rc[2],rc[1]],[rc[2],rc[3]],[rc[0],rc[3]]];
  for(const i of[0,1,2,0,2,3])this.v(P[i],N(i),U[i]);}
 dquad(P,rc){this.quad(P,rc);this.quad([P[1],P[0],P[3],P[2]],[rc[2],rc[1],rc[0],rc[3]]);}// two-sided
 /** box: faces {f,b,l,r,t,d} = cell name (cropped to the face's aspect) or uv rect; missing = skipped */
 box(cx,cy,cz,w,h,d,o){if(o.seg&&w>o.seg*1.2){const n=Math.ceil(w/o.seg),sw=w/n;for(let i=0;i<n;i++){const q={...o,seg:0};if(i)delete q.l;if(i<n-1)delete q.r;this.box(cx-w/2+sw*(i+.5),cy,cz,sw,h,d,q);}return;}
  const x0=cx-w/2,x1=cx+w/2,y0=cy,y1=cy+h,z0=cz-d/2,z1=cz+d/2,F=(k,a)=>o[k]?cell(o[k],a):null;
  let c;if(c=F('f',w/h))this.quad([[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]],c);
  if(c=F('b',w/h))this.quad([[x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0]],c);
  if(c=F('r',d/h))this.quad([[x1,y0,z1],[x1,y0,z0],[x1,y1,z0],[x1,y1,z1]],c);
  if(c=F('l',d/h))this.quad([[x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0]],c);
  if(c=F('t',w/d))this.quad([[x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0]],c);
  if(c=F('d',w/d))this.quad([[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1]],c);}
 /** prism tube a→b, radius r, n sides, smooth normals */
 tube(a,b,r,n,name){const w=nrmz(dif(b,a));const t=Math.abs(w[1])<.9?[0,1,0]:[1,0,0];const u=nrmz(crs(t,w)),v=crs(w,u),rc=UVX140[name];
  for(let i=0;i<n;i++){const f0=i/n*2*PI,f1=(i+1)/n*2*PI,o0=[0,1,2].map(k=>Math.cos(f0)*u[k]+Math.sin(f0)*v[k]),o1=[0,1,2].map(k=>Math.cos(f1)*u[k]+Math.sin(f1)*v[k]);
   const P=(q,o)=>[q[0]+o[0]*r,q[1]+o[1]*r,q[2]+o[2]*r];this.quad([P(a,o0),P(a,o1),P(b,o1),P(b,o0)],sub(rc,i/n,0,(i+1)/n,1),[o0,o1,o1,o0]);}}
 line(pts,r,n,name){for(let i=0;i<pts.length-1;i++)this.tube(pts[i],pts[i+1],r,n,name);}
 /** surface of revolution about axis w through c: prof [[radius,height]...], N segments, caps when radius 0 */
 rev(c,w,prof,N,name){const t=Math.abs(w[1])<.9?[0,1,0]:[1,0,0];const u=nrmz(crs(t,w)),v=crs(w,u),rc=UVX140[name];
  for(let i=0;i<prof.length-1;i++){const[r0,h0]=prof[i],[r1,h1]=prof[i+1],dr=r1-r0,dh=h1-h0,l=Math.hypot(dr,dh)||1;
   for(let j=0;j<N;j++){const f0=j/N*2*PI,f1=(j+1)/N*2*PI,R=f=>[0,1,2].map(k=>Math.cos(f)*u[k]+Math.sin(f)*v[k]);const q0=R(f0),q1=R(f1);
    const P=(r,h,q)=>[0,1,2].map(k=>c[k]+q[k]*r+w[k]*h),Nn=q=>nrmz([0,1,2].map(k=>q[k]*dh/l-w[k]*dr/l));
    this.quad([P(r0,h0,q0),P(r0,h0,q1),P(r1,h1,q1),P(r1,h1,q0)],sub(rc,j/N,i/(prof.length-1),(j+1)/N,(i+1)/(prof.length-1)),[Nn(q0),Nn(q1),Nn(q1),Nn(q0)]);}}}
 flush(b,key){if(!this.p.length)return;addRetail140Fixtures(b.mats);const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(this.p,3));
  g.setAttribute('normal',new T.Float32BufferAttribute(this.n,3));g.setAttribute('uv',new T.Float32BufferAttribute(this.u,2));b.add(g,key,0,0,0);g.dispose();this.p=[];this.n=[];this.u=[];}}
const CASES=['cola','cereal','water','chips'],CASE_SKU={cola:'cola',cereal:'cereal1',water:'water',chips:'chips1'};
function caseInto(a,r,x,y,z,w,h,d,ry,k){k=k||CASES[(r()*4)|0];a.push(x,y,z,ry);const o=r();
 a.box(0,0,0,w,h,d,{f:fit(`case_${k}_f`,w/h,o),b:fit(`case_${k}_b`,w/h,r()),l:`case_${k}_e`,r:`case_${k}_e`,t:fit(`case_${k}_t`,w/d,r())});a.pop();return k;}
/** closed shipping case, bottom centre at (x,y,z): print front (+z), label back, logo ends, taped top */
export function case140(b,r,x,y,z,w,h,d,ry=0,k){const a=new Acc();caseInto(a,r,x,y,z,w,h,d,ry,k);a.flush(b,'r138p140x');}
// ---------------- promo pallet: slatted pallet, closed case tier, open display trays of product ----------------
function pallet(a,r,W=1.04,D=.84){
 for(const z of[-D/2+.05,0,D/2-.05])a.box(0,0,z,W,.02,.1,{f:'wood',b:'wood',l:'wood',r:'wood',t:'wood'});
 for(const x of[-W/2+.05,0,W/2-.05])for(const z of[-D/2+.05,0,D/2-.05])a.box(x,.02,z,.1,.075,.1,{f:'wood',b:'wood',l:'wood',r:'wood'});
 for(const z of[-D/2+.05,0,D/2-.05])a.box(0,.095,z,W,.02,.1,{f:'wood',b:'wood',l:'wood',r:'wood'});
 for(let i=0;i<7;i++){const z=-D/2+.06+i*(D-.12)/6;a.box((r()-.5)*.01,.115,z,W,.018,.1,{f:'wood',b:'wood',l:'wood',r:'wood',t:fit('wood',W/.1,r())});}
 return .133;}
/** open display tray (case cut down to a low front), product rows inside */
function tray(a,b,r,x,y,z,w,d,k){const hb=.12,hf=.05,t=.006,kr='kraftin';a.push(x,y,z,0);
 a.box(0,0,0,w,.006,d,{t:kr});
 a.box(0,0,d/2-t/2,w,hf,t,{f:fit(`case_${k}_f`,w/hf,.5),b:kr,t:'kraft'});a.box(0,0,-d/2+t/2,w,hb,t,{b:fit(`case_${k}_b`,w/hb),f:kr,t:'kraft'});
 for(const s of[-1,1]){const xs=s*(w/2-t/2),P=(zz,yy)=>[xs,yy,zz];// tapered side: low at the front, high at the back
  const q=[P(d/2,0),P(-d/2,0),P(-d/2,hb),P(d/2,hf)];a.quad(s>0?q:[q[1],q[0],q[3],q[2]],UVX140[`case_${k}_e`]);a.quad(s>0?[q[1],q[0],q[3],q[2]]:q,UVX140[kr]);}
 a.pop();
 const sku=CASE_SKU[k],t0=size140(sku),nx=Math.max(1,Math.floor((w-.02)/(t0.w+.006))),nz=Math.max(1,Math.floor((d-.02)/(t0.d+.006)));
 for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){if(r()<.12)continue;// a few already taken
  product140(b,sku,x-(nx-1)*(t0.w+.006)/2+i*(t0.w+.006),y+.006,z-(nz-1)*(t0.d+.006)/2+j*(t0.d+.006),(r()-.5)*.15);}}
export function promo140(b,seed){const r=rng(seed),a=new Acc(),k1=CASES[(seed>>>5)%4],k2=CASES[((seed>>>5)+1+(seed>>>9)%3)%4];
 const y0=pallet(a,r);
 for(let i=0;i<2;i++)for(let j=0;j<2;j++)caseInto(a,r,-.25+i*.5,y0,-.2+j*.4,.48,.3,.38,(r()-.5)*.04,j?k1:k2);
 tray(a,b,r,-.25,y0+.3,.0,.46,.7,k1);tray(a,b,r,.25,y0+.3,.0,.46,.7,k2);
 a.flush(b,'r138p140x');return y0;}
// ---------------- hand baskets (tapered slotted tub, rolled rim, two bail handles), nested on a stand ----------------
function basket(a,blue,up){const tw=.44,td=.30,bw=.38,bd=.24,h=.22,W=blue?'bwallg':'bwall',B='bbase',rim=blue?'greyp':'redp';
 const P=(sx,sz,y)=>{const f=y/h;return[sx*(bw+(tw-bw)*f)/2,y,sz*(bd+(td-bd)*f)/2];};
 const walls=[[[-1,1],[1,1]],[[1,1],[1,-1]],[[1,-1],[-1,-1]],[[-1,-1],[-1,1]]];
 walls.forEach(([p,q],i)=>{const long=i%2===0,rc=long?UVX140[W]:sub(UVX140[W],0,0,.68,1);a.dquad([P(p[0],p[1],0),P(q[0],q[1],0),P(q[0],q[1],h),P(p[0],p[1],h)],rc);});
 a.dquad([P(-1,1,.004),P(1,1,.004),P(1,-1,.004),P(-1,-1,.004)],UVX140[B]);
 const c=[P(-1,1,h),P(1,1,h),P(1,-1,h),P(-1,-1,h),P(-1,1,h)];a.line(c,.011,4,rim);// rolled rim
 for(const s of[-1,1]){// bails pivot mid long wall; up = carrying (meet over the middle), else folded down outside the wall
  const arc=[];for(let i=0;i<=8;i++){const f=(i/8-.5)*PI,c=Math.cos(f);arc.push(up?[.12*Math.sin(f),h+.15*c,s*(td/2-.12*c)]:[.12*Math.sin(f),h-.11*c,s*(td/2+.012+.006*c)]);}
  a.line(arc,.0045,4,'chrome');const m=arc[4];a.tube([m[0]-.055,m[1],m[2]],[m[0]+.055,m[1],m[2]],.013,6,rim);}}
export function baskets140(b,seed,{n=6}){const r=rng(seed),a=new Acc(),blue=r()<.35;
 a.box(0,0,0,.5,.05,.36,{f:'greyp',b:'greyp',l:'greyp',r:'greyp',t:'greyp'});
 for(let i=0;i<n;i++){a.push((r()-.5)*.02,.05+i*.062,(r()-.5)*.012,(r()-.5)*.08);basket(a,blue&&r()<.9,i===n-1);a.pop();}
 a.flush(b,'r138p140x');b.solid(0,0,.52,.38);}
// ---------------- wire shopping cart, nested ----------------
function grid(a,P00,P10,P01,P11,nu,nv,r){const L=(p,q,t)=>[0,1,2].map(k=>p[k]+(q[k]-p[k])*t);
 for(let i=1;i<nu;i++){const t=i/nu;a.tube(L(P00,P10,t),L(P01,P11,t),r,3,'chrome');}
 for(let j=1;j<nv;j++){const t=j/nv;a.tube(L(P00,P01,t),L(P10,P11,t),r,3,'chrome');}}
function cartInto(a){const L=.9,Wb=.52,Wf=.42,y0=.42,y1=.98;const P=(x,y,z)=>[x,y,z],rw=.0035;
 const bb=[P(-L/2,y0,-Wb/2),P(L/2-.1,y0,-Wf/2),P(L/2-.1,y0,Wf/2),P(-L/2,y0,Wb/2)],tt=[P(-L/2-.05,y1,-Wb/2-.02),P(L/2,y1,-Wf/2-.02),P(L/2,y1,Wf/2+.02),P(-L/2-.05,y1,Wb/2+.02)];
 for(let i=0;i<4;i++){a.tube(bb[i],bb[(i+1)%4],.008,6,'chrome');a.tube(tt[i],tt[(i+1)%4],.009,6,'chrome');a.tube(bb[i],tt[i],.008,6,'chrome');}
 grid(a,bb[0],bb[1],tt[0],tt[1],20,6,rw);grid(a,bb[3],bb[2],tt[3],tt[2],20,6,rw);// sides
 grid(a,bb[1],bb[2],tt[1],tt[2],9,6,rw);grid(a,bb[0],bb[3],tt[0],tt[3],11,6,rw);// nose, swing gate
 grid(a,bb[0],bb[1],bb[3],bb[2],18,9,rw);// floor
 // child-seat flap on the gate (folded up) + leg holes edge, plastic handle with chrome arms
 const g=(t,s,y)=>[-L/2-.05*((y-y0)/(y1-y0))+.012,y,s*(Wb/2+.02*((y-y0)/(y1-y0)))*t];
 a.dquad([g(.85,1,.66),g(.85,-1,.66),g(.85,-1,.94),g(.85,1,.94)],fit('redp',1));
 a.tube([-L/2-.14,1.02,-Wb/2-.03],[-L/2-.14,1.02,Wb/2+.03],.017,8,'redp');for(const s of[-1,1])a.tube([-L/2-.05,y1,s*Wb/2],[-L/2-.14,1.02,s*Wb/2],.01,6,'chrome');
 // chassis, lower tray, bumpers, casters
 for(const s of[-1,1]){a.tube([-L/2,y0,s*Wb/2],[-L/2+.05,.1,s*.24],.012,6,'chrome');a.tube([L/2-.1,y0,s*Wf/2],[L/2-.12,.1,s*.2],.012,6,'chrome');a.tube([-L/2+.05,.1,s*.24],[L/2-.12,.1,s*.2],.012,6,'chrome');}
 grid(a,[-L/2+.08,.16,-.2],[L/2-.16,.16,-.17],[-L/2+.08,.16,.2],[L/2-.16,.16,.17],14,6,rw);a.tube([-L/2+.08,.16,-.2],[L/2-.16,.16,-.17],.006,4,'chrome');a.tube([-L/2+.08,.16,.2],[L/2-.16,.16,.17],.006,4,'chrome');
 for(const s of[-1,1])a.box(L/2-.1,y0-.02,s*(Wf/2-.01),.05,.05,.05,{f:'greyp',b:'greyp',l:'greyp',r:'greyp',t:'greyp'});
 for(const[x,z]of[[-L/2+.05,-.24],[-L/2+.05,.24],[L/2-.12,-.2],[L/2-.12,.2]]){
  a.rev([x,.05,z-.016],[0,0,1],[[0,0],[.03,0],[.045,.004],[.05,.016],[.045,.028],[.03,.032],[0,.032]],10,'rubber');
  for(const s of[-1,1])a.box(x,.05,z+s*.022,.03,.065,.006,{f:'greyp',b:'greyp',l:'greyp',r:'greyp'});a.box(x,.11,z,.04,.012,.05,{t:'greyp',f:'greyp',b:'greyp'});}}
export function carts140(b,seed,{n=3}){const r=rng(seed),a=new Acc();for(let i=0;i<n;i++){a.push(i*.26,0,(r()-.5)*.03,(r()-.5)*.04);cartInto(a);a.pop();}
 a.flush(b,'r138p140x');b.solid((n-1)*.13,0,1.0+(n-1)*.26,.62);}
// ---------------- checkout parts (local frame of checkout138: belt along +x, cashier on −z, shopper on +z) ----------------
export function checkoutParts140(b,seed,hh,dz){const r=rng(seed),a=new Acc(),e=new Acc();
 // belt: rubber top in 0.3 m segments (cell never stretched) between two steel rollers, brushed steel rails
 const bx0=-1.62,bx1=.1,bw=dz-.16,n=Math.round((bx1-bx0)/.3),sl=(bx1-bx0)/n,o=r();
 for(let i=0;i<n;i++){const x0=bx0+i*sl,s0=(o+i*.37)%.5;a.quad([[x0,hh+.004,bw/2],[x0+sl,hh+.004,bw/2],[x0+sl,hh+.004,-bw/2],[x0,hh+.004,-bw/2]],sub(UVX140.belt,s0,0,s0+.5,1));}
 for(const x of[bx0,bx1])a.rev([x,hh-.026,-bw/2-.01],[0,0,1],[[0,0],[.03,0],[.03,bw+.02],[0,bw+.02]],10,x===bx0?'steel':'rubber');
 const ST={f:'steel',b:'steel',l:'steel',r:'steel',seg:.35};a.box(-.6,hh-.06,0,2.22,.058,dz,ST);a.box(.75,hh-.06,0,.5,.056,dz,ST);
 for(const s of[-1,1])a.box(-.6,hh-.01,s*(dz/2-.035),2.22,.045,.05,{f:'steel',b:'steel',t:'steel',l:'steel',r:'steel',seg:.35});
 a.push(-.3,hh+.01,.05,0);a.box(0,0,0,.4,.004,.05,{f:'greyp',b:'greyp'});const pr=[[-.2,0,-.025],[.2,0,-.025],[.2,.045,0],[-.2,.045,0]];// divider: triangular prism
 a.quad(pr,fit('greyp',8));a.quad([[.2,0,.025],[-.2,0,.025],[-.2,.045,0],[.2,.045,0]],fit('greyp',8));a.pop();
 // bioptic scanner: platter (weigh plate + window) and a sloped tower with its glass on the cashier side of the bed
 a.box(.75,hh-.004,.02,.42,.014,.24,{t:'scan_top',f:'steel',b:'steel',l:'steel',r:'steel'});
 {const zb=-.25,zf=-.15,y0=hh,y1=hh+.32,xw=.19,G='greyp';const S=(x,y,z)=>[x,y,z];
  a.quad([S(-xw,y0,zf),S(xw,y0,zf),S(xw,y1,zf-.04),S(-xw,y1,zf-.04)].map(p=>[p[0]+.75,p[1],p[2]]),fit(G,1.2));
  a.quad([S(xw,y0,zb),S(-xw,y0,zb),S(-xw,y1,zb),S(xw,y1,zb)].map(p=>[p[0]+.75,p[1],p[2]]),fit(G,1.2));
  for(const s of[-1,1]){const q=[S(s*xw,y0,zf),S(s*xw,y0,zb),S(s*xw,y1,zb),S(s*xw,y1,zf-.04)].map(p=>[p[0]+.75,p[1],p[2]]);a.quad(s>0?q:[q[1],q[0],q[3],q[2]],fit(G,.33));}
  a.quad([S(-xw,y1,zf-.04),S(xw,y1,zf-.04),S(xw,y1,zb),S(-xw,y1,zb)].map(p=>[p[0]+.75,p[1],p[2]]),fit(G,6));
  const gy0=y0+.06,gy1=y1-.06,zz=y=>zf-.04*(y-y0)/(y1-y0)+.003;e.quad([[.75-.13,gy0,zz(gy0)],[.75+.13,gy0,zz(gy0)],[.75+.13,gy1,zz(gy1)],[.75-.13,gy1,zz(gy1)]],UVX140.scan_glass);}
 // POS monitor on a pole, facing the cashier (−z): tapered housing, bezel, screen
 a.tube([.35,hh,-.45],[.35,hh+.28,-.45],.022,8,'chrome');
 a.push(.35,hh+.28,-.45,PI);{const w=.36,h=.28,d=.05,bw2=.26,bh=.18,bd=.11;
  a.box(0,0,0,w,h,d,{f:'greyp',l:'greyp',r:'greyp',t:'greyp',d:'greyp'});
  a.quad([[w/2,0,-d/2],[-w/2,0,-d/2],[-bw2/2,(h-bh)/2,-bd],[bw2/2,(h-bh)/2,-bd]],fit('greyp',2));a.quad([[-w/2,h,-d/2],[w/2,h,-d/2],[bw2/2,(h+bh)/2,-bd],[-bw2/2,(h+bh)/2,-bd]],fit('greyp',2));
  a.quad([[bw2/2,(h-bh)/2,-bd],[-bw2/2,(h-bh)/2,-bd],[-bw2/2,(h+bh)/2,-bd],[bw2/2,(h+bh)/2,-bd]],fit('greyp',1.4));
  for(const sd of[-1,1]){const q=[[sd*w/2,0,-d/2],[sd*bw2/2,(h-bh)/2,-bd],[sd*bw2/2,(h+bh)/2,-bd],[sd*w/2,h,-d/2]];a.quad(sd>0?q:[q[1],q[0],q[3],q[2]],fit('greyp',.6));}
  e.push(.35,hh+.28,-.45,PI);e.quad([[-.15,.025,d/2+.002],[.15,.025,d/2+.002],[.15,.25,d/2+.002],[-.15,.25,d/2+.002]],UVX140.pos_screen);e.pop();}a.pop();
 // keyboard wedge, cash drawer, receipt printer with a paper curl
 a.push(.35,hh+.005,-.5,PI);{const w=.42,d=.2,h0=.02,h1=.045;a.quad([[-w/2,h0,d/2],[w/2,h0,d/2],[w/2,h1,-d/2],[-w/2,h1,-d/2]],fit('pos_keys',w/d));
  a.quad([[-w/2,0,d/2],[w/2,0,d/2],[w/2,h0,d/2],[-w/2,h0,d/2]],fit('beige',20));a.quad([[w/2,0,-d/2],[-w/2,0,-d/2],[-w/2,h1,-d/2],[w/2,h1,-d/2]],fit('beige',10));
  for(const s of[-1,1]){const q=[[s*w/2,0,d/2],[s*w/2,0,-d/2],[s*w/2,h1,-d/2],[s*w/2,h0,d/2]];a.quad(s>0?q:[q[1],q[0],q[3],q[2]],fit('beige',4));}}a.pop();
 a.box(.35,hh-.24,-.47,.44,.16,.42,{f:'greyp',b:'beige',l:'beige',r:'beige'});a.box(.35,hh-.215,-.685,.4,.1,.012,{b:'greyp',l:'greyp',r:'greyp',t:'greyp',d:'greyp'});
 a.push(-.05,hh,-.42,PI);{a.box(0,0,0,.16,.09,.18,{f:'greyp',b:'greyp',l:'greyp',r:'greyp'});
  a.rev([-.08,.09,-.02],[1,0,0],[[0,0],[.06,0],[.06,.16],[0,.16]],8,'greyp');
  const c=[];for(let i=0;i<=5;i++){const t=i/5;c.push([0,.09+.05+.04*Math.sin(t*PI*.8),.06+t*.09]);}
  for(let i=0;i<5;i++)a.dquad([[-.04,c[i][1],c[i][2]],[.04,c[i][1],c[i][2]],[.04,c[i+1][1],c[i+1][2]],[-.04,c[i+1][1],c[i+1][2]]],fit('paper',.6));}a.pop();
 // PIN pad on a short pole facing the shopper (+z), tilted back
 a.tube([.55,hh,.36],[.55,hh+.2,.36],.012,6,'chrome');a.push(.55,hh+.2,.36,-.3);{const w=.1,h=.15,d=.035,tl=.45,cs=Math.cos(tl),sn=Math.sin(tl);
  const R=(x,y,z)=>[x,y*cs-z*sn,y*sn+z*cs];const q=(p)=>p.map(v=>R(...v));
  a.quad(q([[-w/2,0,d],[w/2,0,d],[w/2,h,d],[-w/2,h,d]]),UVX140.pinpad);a.quad(q([[w/2,0,0],[-w/2,0,0],[-w/2,h,0],[w/2,h,0]]),fit('greyp',.7));
  for(const s of[-1,1]){const p=q([[s*w/2,0,d],[s*w/2,0,0],[s*w/2,h,0],[s*w/2,h,d]]);a.quad(s>0?p:[p[1],p[0],p[3],p[2]],fit('greyp',.25));}
  a.quad(q([[-w/2,h,d],[w/2,h,d],[w/2,h,0],[-w/2,h,0]]),fit('greyp',3));}a.pop();
 a.flush(b,'r138p140x');e.flush(b,'r138p140xe');}
/** readable produce price card (front +z), bottom centre at origin */
export function priceCard140(b,r,x,y,z,w=.4){const a=new Acc(),h=w/4,k='card'+((r()*6)|0);a.quad([[x-w/2,y,z],[x+w/2,y,z],[x+w/2,y+h,z],[x-w/2,y+h,z]],UVX140[k]);a.flush(b,'r138p140x');}
