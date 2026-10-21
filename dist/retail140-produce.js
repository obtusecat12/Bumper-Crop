// V140 P1b: loose fruit & vegetables for the supermarket produce bin and veg rack (user 10-21 22:30: no photo of a fruit
// pile stretched over a slope, no spheres standing in for fruit). Each kind is its own low-poly model — lathed apple with
// stem dimple, oblate tomato with calyx, four-lobed pepper, teardrop onion with root plate, lumpy lying potato, tapered
// carrot with leaf stubs, leafy cabbage head, pointed lemon, orange, curved five-sided bananas in hands — wearing its own
// generated skin (assets/l11-v140/produce140*.webp from bc/tools/retail140_p1b_produce.py: baseColor + roughness + normal).
// Piles are laid fruit by fruit on the display slope (hex packing, jitter, random spin, a partial second layer), merged
// into one geometry per pile.
import * as T from './vendor/three.module.min.js';
import {UVP140} from './retail140-produce-uv.js?v=140b';
const A=new URL('./assets/l11-v140/',import.meta.url).href,V='140b',PI=Math.PI;
function tex(name,srgb){const t=new T.TextureLoader().load(A+name+'.webp?v='+V);if(srgb)t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;t.magFilter=T.NearestFilter;return t;}
export function addRetail140Produce(m){
 if(m.r138p140f)return m;
 const map=tex('produce140',true),orm=tex('produce140_r',false),nrm=tex('produce140_n',false);
 const mat=new T.MeshStandardMaterial({map,emissive:0xffffff,emissiveMap:map,emissiveIntensity:.26,roughness:1,metalness:0,roughnessMap:orm,
  normalMap:nrm,normalScale:new T.Vector2(.8,.8),vertexColors:true});
 // baked store light rides in emissive: let the normal map shade it against a fixed view-space key light (as retail140-goods)
 mat.onBeforeCompile=s=>{s.fragmentShader=s.fragmentShader.replace('#include <lights_fragment_begin>',
  'vec3 L140=normalize(vec3(-.25,.75,.62));totalEmissiveRadiance*=clamp((.5+.5*dot(normal,L140))/max(.25,.5+.5*dot(nonPerturbedNormal,L140)),.55,1.35);\n#include <lights_fragment_begin>');};
 mat.customProgramCacheKey=()=>'r140f';m.r138p140f=mat;return m;
}
const R=k=>UVP140[k],at=(r,s,t)=>[r[0]+(r[2]-r[0])*s,r[1]+(r[3]-r[1])*t];
class Acc{constructor(){this.p=[];this.n=[];this.u=[];}
 v(q){this.p.push(q[0],q[1],q[2]);this.n.push(q[3],q[4],q[5]);this.u.push(q[6],q[7]);}
 quad(a,b,c,d){for(const q of[a,b,c,a,c,d])this.v(q);}
 tri(a,b,c){for(const q of[a,b,c])this.v(q);}
 done(){let x0=1e9,x1=-1e9,y1=0,z0=1e9,z1=-1e9;const P=this.p;for(let i=0;i<P.length;i+=3){x0=Math.min(x0,P[i]);x1=Math.max(x1,P[i]);y1=Math.max(y1,P[i+1]);z0=Math.min(z0,P[i+2]);z1=Math.max(z1,P[i+2]);}
  const cx=(x0+x1)/2,cz=(z0+z1)/2;for(let i=0;i<P.length;i+=3){P[i]-=cx;P[i+2]-=cz;}// recentre on x/z (lying kinds are lathed along +x)
  return{p:new Float32Array(P),n:new Float32Array(this.n),u:new Float32Array(this.u),w:x1-x0,d:z1-z0,h:y1};}}
/** surface F(s,t)->[x,y,z] (s around 0..1 wraps, t along 0..1), cell rc tiled (us × vt) times; normals by finite difference,
 *  flipped outward from the local axis point C(t). */
function surf(a,F,C,rc,ns,nt,us=1,vt=1){
 const N=(s,t0)=>{const e=1e-3,t=Math.min(.985,Math.max(.015,t0)),p=F(s,t)/* poles: take the normal just off the pole */,ps=F(s+e,t),pt=F(s,Math.min(1,t+e)),qt=F(s,Math.max(0,t-e));
  const ds=[ps[0]-p[0],ps[1]-p[1],ps[2]-p[2]],dt=[pt[0]-qt[0],pt[1]-qt[1],pt[2]-qt[2]];
  let n=[ds[1]*dt[2]-ds[2]*dt[1],ds[2]*dt[0]-ds[0]*dt[2],ds[0]*dt[1]-ds[1]*dt[0]];let l=Math.hypot(...n);
  const c=C(t),o=[p[0]-c[0],p[1]-c[1],p[2]-c[2]];
  if(l<1e-9){n=o;l=Math.hypot(...o)||1;}if(n[0]*o[0]+n[1]*o[1]+n[2]*o[2]<0)l=-l;return n.map(v=>v/l);};
 for(let i=0;i<ns;i++)for(let j=0;j<nt;j++){const s0=i/ns,s1=(i+1)/ns,t0=j/nt,t1=(j+1)/nt;
  // keep each quad inside one texture repeat: compute uv locally
  const P=(s,t)=>{const p=F(s,t),n=N(s,t),fs=s*us-Math.floor(s0*us+1e-6),ft=t*vt-Math.floor(t0*vt+1e-6);const[u,w]=at(rc,Math.min(1,fs),Math.min(1,ft));return[...p,...n,u,w];};
  a.quad(P(s0,t0),P(s1,t0),P(s1,t1),P(s0,t1));}
}
const lerpProf=(prof,t)=>{const f=t*(prof.length-1),i=Math.min(prof.length-2,Math.floor(f)),k=f-i;return[prof[i][0]+(prof[i+1][0]-prof[i][0])*k,prof[i][1]+(prof[i+1][1]-prof[i][1])*k];};
/** lathe a [radius,height] profile around y with optional lobes (n, depth) and per-angle noise */
function latheP(a,prof,rc,ns,{lobes=0,ld=0,us=1,vt=1,noise=null,axis='y',lift=0}={}){
 const F=(s,t)=>{const[r0,y]=lerpProf(prof,t),f=s*2*PI;let r=r0*(1+(lobes?ld*Math.cos(lobes*f):0)+(noise?noise(s,t):0));
  const x=Math.sin(f)*r,z=Math.cos(f)*r;return axis==='y'?[x,y,z]:[y,x+lift,z];};
 const C=t=>{const y=lerpProf(prof,t)[1];return axis==='y'?[0,y,0]:[y,lift,0];};
 surf(a,F,C,rc,ns,prof.length-1,us,vt);
}
function cap(a,r,y,rc,n,{down=false}={}){const[cu,cv]=at(rc,.5,.5),hu=(rc[2]-rc[0])*.48,hv=(rc[3]-rc[1])*.48,ny=down?-1:1;
 for(let j=0;j<n;j++){const f0=j/n*2*PI,f1=(j+1)/n*2*PI,P=f=>[Math.sin(f)*r,y,Math.cos(f)*r,0,ny,0,cu+Math.sin(f)*hu,cv+Math.cos(f)*hv],C=[0,y,0,0,ny,0,cu,cv];
  if(down)a.tri(C,P(f1),P(f0));else a.tri(C,P(f0),P(f1));}}
function stem(a,x,y,z,len,r,rc,dx=0,dz=0){const F=(s,t)=>{const f=s*2*PI;return[x+Math.sin(f)*r+dx*t,y+t*len,z+Math.cos(f)*r+dz*t];};surf(a,F,t=>[x+dx*t,y+t*len,z+dz*t],rc,4,1);}
function build(k){const a=new Acc();
 if(k==='apple'){latheP(a,[[0,.009],[.021,.001],[.034,.013],[.038,.032],[.035,.052],[.024,.066],[.008,.062],[0,.056]],R('apple'),8,{lobes:5,ld:.03});stem(a,0,.056,0,.016,.0018,R('stem'),.003,0);}
 else if(k==='orange'){latheP(a,[[0,0],[.019,.005],[.033,.018],[.037,.037],[.033,.056],[.019,.069],[0,.074]],R('orange'),8,{us:2});}
 else if(k==='lemon'){latheP(a,[[0,0],[.006,.004],[.022,.016],[.029,.04],[.022,.064],[.006,.076],[0,.082]],R('lemon'),7,{axis:'x',lift:.029,us:2});}
 else if(k==='tomato'){latheP(a,[[0,.004],[.023,.001],[.034,.016],[.034,.032],[.022,.045],[0,.042]],R('tomato'),8,{lobes:5,ld:.05});cap(a,.016,.0435,R('calyx'),6);stem(a,0,.043,0,.008,.0016,R('stem'));}
 else if(k==='pepper'){latheP(a,[[0,.014],[.025,.002],[.039,.028],[.041,.058],[.035,.079],[.012,.085],[0,.08]],R('pepper'),8,{lobes:4,ld:.13});stem(a,0,.08,0,.02,.004,R('stem'),.003,.002);}
 else if(k==='onion'){latheP(a,[[0,.001],[.02,.004],[.037,.024],[.036,.044],[.02,.064],[.005,.079],[0,.086]],R('onion'),8,{lobes:6,ld:.025});cap(a,.012,.0035,R('root'),5,{down:true});}
 else if(k==='potato'){const p0=1.7,p1=4.1;
  latheP(a,[[0,0],[.016,.008],[.03,.03],[.034,.055],[.03,.08],[.016,.1],[0,.106]],R('potato'),7,{axis:'x',lift:.03,us:2,noise:(s,t)=>.09*Math.sin(s*2*PI*2+p0)*Math.sin(t*PI*3+p1)+.05*Math.cos(s*2*PI*3+t*7)});}
 else if(k==='carrot'){latheP(a,[[0,0],[.011,.003],[.016,.018],[.014,.07],[.01,.12],[.005,.16],[0,.18]],R('carrot'),6,{axis:'x',lift:.016,vt:2});
  for(const dz of[-.004,0,.004])stem(a,-.002,.012,dz,.035,.0025,R('tops'),-.03,dz*2);}
 else if(k==='cabbage'){latheP(a,[[0,.004],[.04,.006],[.068,.035],[.075,.075],[.064,.115],[.035,.14],[0,.148]],R('cabbage'),9,{lobes:6,ld:.06});cap(a,.02,.0045,R('core'),6,{down:true});}
 else if(k==='banana'){// a hand of four: curved pentagonal tubes fanned from a shared crown
  for(let i=0;i<4;i++){const fan=(i-1.5)*.22,L=.19,Rc=.22,rb=.017;
   const F=(s,t)=>{const ang=(t-.5)*L/Rc,c=[Math.sin(ang)*Rc,-(1-Math.cos(ang))*Rc+.045,0],tan=[Math.cos(ang),-Math.sin(ang),0],nrm=[Math.sin(ang),Math.cos(ang),0];
    const taper=Math.pow(Math.sin(PI*Math.min(1,Math.max(0,t*1.04-.02))),.45)*.85+.15,f=s*2*PI,rr=rb*taper,cx=Math.cos(f)*rr,cy=Math.sin(f)*rr;
    let p=[c[0]+nrm[0]*cy,c[1]+nrm[1]*cy,cx];const cf=Math.cos(fan),sf=Math.sin(fan),ox=-.07;// fan around the crown at x=ox
    const X=p[0]-ox,Z=p[2]+i*.002;return[ox+X*cf-Z*sf,p[1]+i*.004,X*sf+Z*cf];};
   const Cn=t=>{const p=F(0,t),q=F(.5,t);return[(p[0]+q[0])/2,(p[1]+q[1])/2,(p[2]+q[2])/2];};
   surf(a,F,Cn,R('banana'),5,6);
   const e=F(.75,1);stem(a,e[0],e[1]-.004,e[2],.006,.003,R('tip'));}
  }
 else throw Error('produce '+k);
 return a.done();}
const TPL=new Map(),tpl=k=>{if(!TPL.has(k))TPL.set(k,build(k));return TPL.get(k);};
export const PRODUCE140={fruit:['apple','orange','lemon','banana'],veg:['tomato','pepper','potato','onion','carrot','cabbage']};
class Run{constructor(){this.p=[];this.n=[];this.u=[];}
 /** place a template: yaw ry, then a small tip (rx about x, rz about z), scale s, on a surface whose normal is tilted by tilt about x */
 put(t,x,y,z,ry,rx,rz,s,tilt=0){const m=new T.Matrix4().makeRotationX(tilt).multiply(new T.Matrix4().makeRotationY(ry)).multiply(new T.Matrix4().makeRotationX(rx)).multiply(new T.Matrix4().makeRotationZ(rz)),e=m.elements;
  const P=t.p,N=t.n;for(let i=0;i<P.length;i+=3){const px=P[i]*s,py=P[i+1]*s,pz=P[i+2]*s,nx=N[i],ny=N[i+1],nz=N[i+2];
   this.p.push(x+e[0]*px+e[4]*py+e[8]*pz,y+e[1]*px+e[5]*py+e[9]*pz,z+e[2]*px+e[6]*py+e[10]*pz);
   this.n.push(e[0]*nx+e[4]*ny+e[8]*nz,e[1]*nx+e[5]*ny+e[9]*nz,e[2]*nx+e[6]*ny+e[10]*nz);}
  for(let i=0;i<t.u.length;i++)this.u.push(t.u[i]);}
 flush(b){if(!this.p.length)return;const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(this.p,3));
  g.setAttribute('normal',new T.Float32BufferAttribute(this.n,3));g.setAttribute('uv',new T.Float32BufferAttribute(this.u,2));b.add(g,'r138p140f',0,0,0);g.dispose();this.p=[];this.n=[];this.u=[];}}
/** a pile on a display slope. x0..x1 across, the slope runs from its front edge (zF,yF) up to its back edge (zB,yB).
 *  The run is split into sections of one kind each (kinds picked by hash from `kinds`). Hex packing + jitter, random spin,
 *  a partial second layer; bananas lie as hands in one layer. */
export function pile140(b,r,kinds,x0,x1,zF,yF,zB,yB,{sections=2,shuffle=true}={}){
 addRetail140Produce(b.mats);const run=new Run(),dz=zB-zF,dy=yB-yF,L=Math.hypot(dz,dy),tilt=Math.atan2(dy,-dz),sw=(x1-x0)/sections;
 const pool=kinds.slice();if(shuffle)for(let i=pool.length-1;i>0;i--){const j=(r()*(i+1))|0;[pool[i],pool[j]]=[pool[j],pool[i]];}
 for(let s=0;s<sections;s++){const k=pool[s%pool.length],t=tpl(k),a=x0+s*sw+.01,c=a+sw-.02,ban=k==='banana',lying=k==='carrot'||k==='potato'||k==='lemon';
  const fw=(ban?.2:lying?Math.max(t.w,t.d)*.75:t.w)*1.0,fd=(ban?.13:t.d)*.92,layers=ban?1:2;
  for(let layer=0;layer<layers;layer++){const off=layer?.5:0;
   for(let v=fd/2+layer*fd*.25,row=0;v<L-fd/2;v+=fd*.87,row++)for(let u=a+fw/2+((row+off)%2?fw/2:0);u<c-fw/2+.001;u+=fw){
    if(layer&&r()<.55)continue;
    const sc=.88+r()*.22,jx=(r()-.5)*fw*.15,jv=(r()-.5)*fd*.12,vv=v+jv,yy=yF+dy*vv/L+layer*t.h*.62*sc,zz=zF+dz*vv/L;
    const ry=r()*2*PI,rx=ban||lying?(r()-.5)*.2:(r()<.25?(r()-.5)*2.4:(r()-.5)*.4),rz=ban||lying?(r()-.5)*.2:(r()-.5)*.4;
    run.put(t,u+jx,yy-(!ban&&!lying&&Math.abs(rx)>.6?t.h*.25:0),zz,ry,rx,rz,sc,tilt);}}}
 run.flush(b);
}
export function produceTris140(){const o={};for(const k of[...PRODUCE140.fruit,...PRODUCE140.veg])o[k]=tpl(k).p.length/9;return o;}
export function produce140(b,k,x,y,z,ry=0){addRetail140Produce(b.mats);const run=new Run();run.put(tpl(k),x,y,z,ry,0,0,1);run.flush(b);}
export function produceSize140(k){return tpl(k);}
