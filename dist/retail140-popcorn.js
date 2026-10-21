// V140 P5: glass-cabinet popcorn machine on a red cart (bodega counter wall by the storefront, supermarket checkout).
//   glass   = r138g140p MeshPhysicalMaterial transmission 1 / IOR 1.5, transmission + roughness from pop140_g
//             (fingerprints, oily hand smears, butter spatter; one crop per pane), smear-ridge normal, store envMap.
//             Key starts r138g140 -> retail138-bake leaves its lighting alone (like the P2 cooler doors).
//   machine = r138p140q red enamel / stainless / paper: baseColor + roughness (G) + metalness (B, chipped enamel = bare steel)
//             + normal; header sign + warming lamp + pilot glow from pop140_e added after the store bake.
//   popcorn = r138p140c: a heightfield heap (top + skirts seen through the glass) under hundreds of real kernels
//             (each two jittered octahedra, UV = its own small crop of the popcorn photo); warm lamp glow added on top.
//   kettle  = lathe pot hanging from the roof on a shaft, slightly tipped, split lid; boxes = tapered open paper boxes
//             (nested stack + one filled), flat bag stacks in the cart cubby.
// ?pop140=0 -> no popcorn machine.
import * as T from './vendor/three.module.min.js';
import {UVP140,ASPP140} from './retail140-popcorn-uv.js?v=140h';
import {Acc,sub} from './retail140-fixtures.js?v=140d';
export const POP140=!(typeof location!=='undefined'&&/[?&]pop140=0\b/.test(location.search));
const A=new URL('./assets/l11-v140/',import.meta.url).href,V='140h',PI=Math.PI;
function tex(name,srgb,near=true){const t=new T.TextureLoader().load(A+name+'.webp?v='+V);if(srgb)t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;if(near)t.magFilter=T.NearestFilter;return t;}
const NTRICK='vec3 L140=normalize(vec3(-.25,.75,.62));totalEmissiveRadiance*=clamp((.5+.5*dot(normal,L140))/max(.25,.5+.5*dot(nonPerturbedNormal,L140)),.55,1.35);\n';
export function addRetail140Popcorn(m){
 if(m.r138p140q)return m;
 const map=tex('pop140',true),rough=tex('pop140_r'),nrm=tex('pop140_n'),emi=tex('pop140_e',true),env=tex('glass140_env',true,false);
 env.mapping=T.EquirectangularReflectionMapping;
 const q=new T.MeshPhysicalMaterial({map,roughness:1,roughnessMap:rough,metalness:1,metalnessMap:rough,normalMap:nrm,normalScale:new T.Vector2(.9,.9),
  clearcoat:.3,clearcoatRoughness:.3,envMap:env,envMapIntensity:1.25,emissive:0xffffff,emissiveMap:emi,emissiveIntensity:.42,vertexColors:true});
 q.onBeforeCompile=s=>{s.fragmentShader=s.fragmentShader.replace('#include <emissivemap_fragment>','vec3 G140=texture2D(emissiveMap,vEmissiveMapUv).rgb*2.2;\n#include <emissivemap_fragment>')
  .replace('#include <lights_fragment_begin>',NTRICK+'totalEmissiveRadiance+=G140;\n#include <lights_fragment_begin>');};
 q.customProgramCacheKey=()=>'r140q';
 const c=new T.MeshPhysicalMaterial({map,emissive:0xffffff,emissiveMap:map,emissiveIntensity:.42,roughness:1,roughnessMap:rough,metalness:0,
  normalMap:nrm,normalScale:new T.Vector2(1.4,1.4),envMap:env,envMapIntensity:.2,vertexColors:true});
 // warm light of the warming lamp falling on the heap (no real light: stores are at the fragment texture-unit limit)
 c.onBeforeCompile=s=>{s.fragmentShader=s.fragmentShader.replace('#include <lights_fragment_begin>',NTRICK+'totalEmissiveRadiance+=diffuseColor.rgb*vec3(1.,.8,.48)*.5;\n#include <lights_fragment_begin>');};
 c.customProgramCacheKey=()=>'r140c';
 const g=tex('pop140_g',false,false),gn=tex('pop140_gn',false,false);
 const glass=new T.MeshPhysicalMaterial({color:0xffffff,transmission:1,transmissionMap:g,ior:1.5,thickness:.004,roughness:1,roughnessMap:g,metalness:0,
  normalMap:gn,normalScale:new T.Vector2(.4,.4),envMap:env,envMapIntensity:1.8,specularIntensity:1,attenuationColor:new T.Color(0xf4f8f0),attenuationDistance:.5,side:T.FrontSide,vertexColors:true});
 m.r138p140q=q;m.r138p140c=c;m.r138g140p=glass;return m;
}
const rng=seed=>{let s=(seed>>>0)||1;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return((s>>>0)%100000)/100000;};};
const GL={};for(let i=0;i<4;i++){const e=1/512;GL['g'+i]=[(i%2)/2+e,1-((i>>1)+1)/2+e,(i%2+1)/2-e,1-(i>>1)/2-e];}
const nz=v=>{const l=Math.hypot(...v)||1;return[v[0]/l,v[1]/l,v[2]/l];};
// one popped kernel: two overlapping jittered octahedra, each vertex projected into a small crop of the popcorn photo
const OCT=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]],OF=[[0,2,4],[4,2,1],[1,2,5],[5,2,0],[4,3,0],[1,3,4],[5,3,1],[0,3,5]];
function kernel(a,r,x,y,z,s){const P=UVP140[r()<.75?'pile':'pileB'],cu=(P[2]-P[0])*.04,cv=(P[3]-P[1])*.08;
 for(let k=0;k<2;k++){const o=k?[(r()-.5)*s,(r()-.2)*s*.6,(r()-.5)*s]:[0,0,0],sc=k?s*(.6+r()*.3):s;
  const u0=P[0]+cu+r()*(P[2]-P[0]-2*cu),v0=P[1]+cv+r()*(P[3]-P[1]-2*cv);
  const V=OCT.map(d=>{const j=.7+r()*.55,q=[d[0]*sc*j,d[1]*sc*j*.85,d[2]*sc*j];return{p:[x+o[0]+q[0],y+o[1]+q[1],z+o[2]+q[2]],n:nz(q),u:[u0+(q[0]/sc)*cu*.9,v0+(q[2]/sc+q[1]/sc*.5)*cv*.6]};});
  for(const f of OF)for(const i of f)a.v(V[i].p,V[i].n,V[i].u);}}
// heap heightfield over x0..x1, z0..z1 at floor y; peak (px,pz); top + 4 skirts down to the floor
function heap(a,r,x0,x1,z0,z1,y,H,px,pz,nx=10,nzs=8){const P=UVP140.pile,ph=r()*6;
 const h=(x,z)=>H*(.42+.58*Math.exp(-((x-px)**2/.03+(z-pz)**2/.025)))+.008*Math.sin(x*61+ph)*Math.cos(z*47+ph);
 const pt=(i,j)=>{const x=x0+(x1-x0)*i/nx,z=z0+(z1-z0)*j/nzs;return[x,y+h(x,z),z];};
 const uv=(i,j)=>[P[0]+(P[2]-P[0])*i/nx,P[1]+(P[3]-P[1])*j/nzs];
 for(let i=0;i<nx;i++)for(let j=0;j<nzs;j++){const p=[pt(i,j+1),pt(i+1,j+1),pt(i+1,j),pt(i,j)],U=[uv(i,j+1),uv(i+1,j+1),uv(i+1,j),uv(i,j)];
  const e1=[p[1][0]-p[0][0],p[1][1]-p[0][1],p[1][2]-p[0][2]],e2=[p[3][0]-p[0][0],p[3][1]-p[0][1],p[3][2]-p[0][2]],n=nz([e1[1]*e2[2]-e1[2]*e2[1],e1[2]*e2[0]-e1[0]*e2[2],e1[0]*e2[1]-e1[1]*e2[0]]);
  for(const k of[0,1,2,0,2,3])a.v(p[k],n,U[k]);}
 const sk=(pts,n)=>{for(let i=0;i<pts.length-1;i++){const a0=pts[i],a1=pts[i+1],s0=i/(pts.length-1),s1=(i+1)/(pts.length-1),L=Math.max(.05,Math.abs(x1-x0)+Math.abs(z1-z0)-Math.min(Math.abs(x1-x0),Math.abs(z1-z0)));
  const Q=[[a0[0],y,a0[2]],[a1[0],y,a1[2]],a1,a0],t0=Math.min(1,(a0[1]-y)/L*1.35),t1=Math.min(1,(a1[1]-y)/L*1.35);// same texel density as the top
  const U=[[lerp(P[0],P[2],s0),P[1]],[lerp(P[0],P[2],s1),P[1]],[lerp(P[0],P[2],s1),lerp(P[1],P[3],t1)],[lerp(P[0],P[2],s0),lerp(P[1],P[3],t0)]];for(const k of[0,1,2,0,2,3])a.v(Q[k],n,U[k]);}};
 const row=j=>Array.from({length:nx+1},(_,i)=>pt(i,j)),col=i=>Array.from({length:nzs+1},(_,j)=>pt(i,j));
 sk(row(nzs),[0,0,1]);sk(row(0).reverse(),[0,0,-1]);sk(col(nx).reverse(),[1,0,0]);sk(col(0),[-1,0,0]);
 return h;}
const lerp=(a,b,t)=>a+(b-a)*t;
// tapered open paper popcorn box, bottom centre at (x,y,z); filled -> domed popcorn + kernels on top
function popBox(s,c,r,x,y,z,ry,filled){const bw=.062,bd=.044,tw=.084,td=.06,h=.13;s.push(x,y,z,ry);
 const B=[[-bw/2,0,bd/2],[bw/2,0,bd/2],[bw/2,0,-bd/2],[-bw/2,0,-bd/2]],Tp=[[-tw/2,h,td/2],[tw/2,h,td/2],[tw/2,h,-td/2],[-tw/2,h,-td/2]];
 const F=[['boxF',0,1],['boxS',1,2],['boxB',2,3],['boxS',3,0]];
 for(const[cell,i,j]of F){const o=r()*.3,rc=cell==='boxS'?UVP140.boxS:sub(UVP140[cell],o*.4,0,o*.4+.6+.4*(1-o),1);
  s.quad([B[i],B[j],Tp[j],Tp[i]],rc);s.quad([Tp[i],Tp[j],B[j],B[i]].map(p=>[p[0]*.97,p[1],p[2]*.97]),sub(UVP140.boxS,.2,0,.8,1));}
 s.quad([[-bw/2,.002,-bd/2],[bw/2,.002,-bd/2],[bw/2,.002,bd/2],[-bw/2,.002,bd/2]].reverse(),sub(UVP140.boxS,0,0,1,.3));
 if(filled){c.push(x,y,z,ry);heap(c,r,-tw/2+.004,tw/2-.004,-td/2+.004,td/2-.004,h-.03,.055,0,0,4,3);for(let k=0;k<14;k++)kernel(c,r,(r()-.5)*tw*.8,h+.01+r()*.03,(r()-.5)*td*.8,.0105);c.pop();}
 s.pop();}
/** the countertop machine: local origin = centre of its footprint at its feet, front (doors) = +z; W wide */
export function popcornMachine140(b,seed,{W=.58,D=.42}={}){
 const r=rng(seed),s=new Acc(UVP140,ASPP140,addRetail140Popcorn),c=new Acc(UVP140,ASPP140,addRetail140Popcorn),g=new Acc(GL,{g0:1,g1:1,g2:1,g3:1},addRetail140Popcorn);
 const yb=.13,yt=yb+.5,po=.022,R=['redA','redB','redC','redD'],rc=()=>R[(r()*4)|0];
 // base: control panel front, drip deck
 s.box(0,0,0,W,yb,D,{f:'redA',b:'redB',l:'redC',r:'redD',t:'chrome'});
 s.quad([[-.17,.02,D/2+.002],[.17,.02,D/2+.002],[.17,.105,D/2+.002],[-.17,.105,D/2+.002]],UVP140.panel);
 for(const x of[-1,1])for(const z of[-1,1])s.box(x*(W/2-.03),-.012,z*(D/2-.03),.03,.012,.03,{f:'rubber',b:'rubber',l:'rubber',r:'rubber'});
 // corner posts + roof + header sign (both faces)
 for(const x of[-1,1])for(const z of[-1,1])s.box(x*(W/2-po/2),yb,z*(D/2-po/2),po,yt-yb,po,{f:rc(),b:rc(),l:rc(),r:rc()});
 s.box(0,yt,0,W+.01,.045,D+.01,{f:'redB',b:'redA',l:'redD',r:'redC',t:'redC',d:'chrome'});
 s.box(0,yt+.045,0,W-.04,.12,.05,{f:'sign',b:'sign',l:'redB',r:'redB',t:'redD'});
 // warming lamp tube across the front under the roof + its bracket
 s.box(0,yt-.03,D/2-.06,W-.1,.026,.03,{f:'lamp',d:'lamp',b:'chrome',t:'chrome'});
 // kettle on a shaft, tipped a little toward the front; split lid
 const kx=-.03,kz=-.02,ky=yt-.2,tl=.14,w=[0,Math.cos(tl),Math.sin(tl)];
 s.tube([kx,yt,kz],[kx,ky+.12,kz+.012],.006,6,'chrome');
 s.rev([kx,ky,kz],w,[[0,0],[.06,.004],[.082,.02],[.085,.085],[.092,.095],[.07,.096]],12,'kettle');
 s.rev([kx+.0,ky+.1,kz+.013],w,[[.07,0],[.04,.018],[.006,.024],[0,.024]],12,'lid');
 s.tube([kx+.085,ky+.06,kz],[kx+.17,ky+.09,kz],.006,6,'chrome');// dump handle
 // heap: high at the back under the kettle, pouring onto the deck; kernels on top and spilling off the kettle lip
 const ix=W/2-po,iz0=-D/2+po+.006,iz1=D/2-po-.008,hh=heap(c,r,-ix+.004,ix-.004,iz0,iz1,yb+.002,.14,kx,-.08);
 for(let k=0;k<230;k++){const x=lerp(-ix+.02,ix-.02,r()),z=lerp(iz0+.015,iz1-.015,r());kernel(c,r,x,yb+.002+hh(x,z)+.004,z,.0095+r()*.005);}
 for(let k=0;k<10;k++)kernel(c,r,kx+(r()-.5)*.1,ky+.1+r()*.02,kz+.06+r()*.02,.009);
 s.flush(b,'r138p140q');c.flush(b,'r138p140c');
 // glass: back + both sides fixed, two sliding front doors with chrome edges and little knobs
 const y0=yb+.002,y1=yt-.002,x0=-W/2+po,x1=W/2-po,zb=-D/2+po*.5,zf=D/2-po*.5,G=k=>GL['g'+k];
 const xl=-W/2+po*.5,xr=W/2-po*.5;
 g.quad([[xr,y0,zb],[xl,y0,zb],[xl,y1,zb],[xr,y1,zb]],G(r()*4|0));
 g.quad([[xl,y0,zb],[xl,y0,zf],[xl,y1,zf],[xl,y1,zb]],G(r()*4|0));
 g.quad([[xr,y0,zf],[xr,y0,zb],[xr,y1,zb],[xr,y1,zf]],G(r()*4|0));
 const xm=(x0+x1)/2,d0=r()*4|0;
 g.quad([[x0,y0,zf],[xm+.01,y0,zf],[xm+.01,y1,zf],[x0,y1,zf]],G(d0));g.quad([[xm-.01,y0,zf+.006],[x1,y0,zf+.006],[x1,y1,zf+.006],[xm-.01,y1,zf+.006]],G((d0+1)%4));
 g.flush(b,'r138g140p');
 for(const[xe,dz]of[[xm+.01,0],[xm-.01,.006]])s.box(xe,y0,zf+dz,.006,y1-y0,.006,{f:'chrome',l:'chrome',r:'chrome'});
 for(const[kx2,kz2]of[[xm-.03,zf+.006],[xm+.03,zf+.012]])s.tube([kx2,y0+.03,kz2],[kx2,y0+.03,kz2+.012],.007,6,'rubber');// finger pulls low on the doors
 s.flush(b,'r138p140q');
 return{W,D,H:yt+.165};
}
/** red cart with the machine, a nested box stack + one filled box beside it, bag stacks in the open cubby; faces +z, local z = 0 at its back */
export function popcornCart140(b,seed,{w=.8,d=.5,h=.78}={}){
 const r=rng(seed),s=new Acc(UVP140,ASPP140,addRetail140Popcorn),c=new Acc(UVP140,ASPP140,addRetail140Popcorn),zc=d/2;
 // cabinet: back, sides, deck, bottom shelf; front left open (cubby)
 s.box(0,.08,zc-d/2+.01,w,h-.08,.02,{f:'redC',b:'redD'});
 s.box(-w/2+.01,.08,zc,.02,h-.08,d,{l:'redA',r:'redB',f:'redB'});s.box(w/2-.01,.08,zc,.02,h-.08,d,{r:'redA',l:'redB',f:'redA'});
 s.box(0,h-.04,zc,w+.02,.04,d+.02,{t:'redD',f:'redA',b:'redB',l:'redC',r:'redC',d:'redB'});
 s.box(0,.08,zc,w-.04,.03,d-.02,{t:'redC',f:'redD'});s.box(0,.36,zc,w-.04,.02,d-.04,{t:'redB',f:'redC',d:'redA'});
 // casters + push handle
 for(const x of[-1,1])for(const z of[-1,1]){const px=x*(w/2-.05),pz=zc+z*(d/2-.05);s.box(px,.06,pz,.04,.02,.04,{f:'chrome',b:'chrome',l:'chrome',r:'chrome'});s.tube([px-.02,.03,pz],[px+.02,.03,pz],.03,8,'rubber');}
 s.tube([w/2,h-.1,zc-.15],[w/2+.09,h-.06,zc-.15],.01,6,'chrome');s.tube([w/2,h-.1,zc+.15],[w/2+.09,h-.06,zc+.15],.01,6,'chrome');s.tube([w/2+.09,h-.06,zc-.16],[w/2+.09,h-.06,zc+.16],.012,8,'chrome');
 // cubby: flat bag stacks on the bottom shelf, nested boxes on the middle shelf
 for(const[x,n]of[[-.2,8+(r()*6|0)],[.05,4+(r()*6|0)]]){const ht=n*.004;s.box(x,.11,zc+.02,.16,ht,.2,{t:sub(UVP140.bag,0,0,1,1),f:'bagEdge',l:'bagEdge',r:'bagEdge'});}
 for(let k=0;k<5;k++)popBox(s,c,r,.25,.11+k*.016,zc+.02,(r()-.5)*.1,false);
 for(let k=0;k<4;k++)popBox(s,c,r,-.18+k*.012,.38+k*.016,zc,(r()-.5)*.08,false);
 // on the deck: machine to one side, box stack + a full box next to it
 const mW=.58;s.flush(b,'r138p140q');c.flush(b,'r138p140c');
 b.push(-w/2+mW/2+.02,h,zc,0);popcornMachine140(b,seed^0x51d,{W:mW,D:Math.min(.42,d-.06)});b.pop();
 const bx=w/2-.09;for(let k=0;k<6;k++)popBox(s,c,r,bx,h+k*.016,zc-.1,(r()-.5)*.12,false);popBox(s,c,r,bx,h,zc+.1,(r()-.5)*.3,true);
 s.flush(b,'r138p140q');c.flush(b,'r138p140c');
 b.solid(0,zc,w+.12,d+.04);
}
