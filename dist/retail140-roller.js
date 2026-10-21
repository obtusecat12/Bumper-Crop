// V140 P4: convenience-store roller grill (hot dogs + taquitos) on a small stainless stand, by the bodega counter
// and next to the first supermarket checkout lane.
//   food = lathe pieces whose radius profile and UV edges are traced from their own generated photo (PROFR140),
//          so the casing / tortilla texture wraps without stretching; one oily MeshPhysicalMaterial (clearcoat).
//   rollers + housing = brushed stainless MeshPhysicalMaterial, metalness 1, anisotropy .9 along the roller axis
//          (UV u runs along each roller, three builds the tangent frame from the UVs) so the store envMap highlight
//          stretches into long lines; the heater coils in the gaps under the rollers glow dull dark orange from
//          roll140_e (added on top of the store bake, so the glow survives the baked-diffuse patch).
// ?roll140=0 -> no roller grill.
import * as T from './vendor/three.module.min.js';
import {UVR140,ASPR140,PROFR140} from './retail140-roller-uv.js?v=140g';
import {Acc,sub,priceCard140} from './retail140-fixtures.js?v=140d';
export const ROLL140=!(typeof location!=='undefined'&&/[?&]roll140=0\b/.test(location.search));
const A=new URL('./assets/l11-v140/',import.meta.url).href,V='140g',PI=Math.PI;
function tex(name,srgb){const t=new T.TextureLoader().load(A+name+'.webp?v='+V);if(srgb)t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;t.magFilter=T.NearestFilter;return t;}
const NTRICK='vec3 L140=normalize(vec3(-.25,.75,.62));totalEmissiveRadiance*=clamp((.5+.5*dot(normal,L140))/max(.25,.5+.5*dot(nonPerturbedNormal,L140)),.55,1.35);\n';
export function addRetail140Roller(m){
 if(m.r138p140k)return m;
 const map=tex('roll140',true),rough=tex('roll140_r'),nrm=tex('roll140_n'),emi=tex('roll140_e',true),env=tex('glass140_env',true);
 env.mapping=T.EquirectangularReflectionMapping;env.magFilter=T.LinearFilter;
 // food: casing / tortilla with an oily clearcoat
 const food=new T.MeshPhysicalMaterial({map,emissive:0xffffff,emissiveMap:map,emissiveIntensity:.42,roughness:1,roughnessMap:rough,metalness:0,
  normalMap:nrm,normalScale:new T.Vector2(1.2,1.2),clearcoat:.45,clearcoatRoughness:.22,envMap:env,envMapIntensity:.35,vertexColors:true});
 food.onBeforeCompile=s=>{s.fragmentShader=s.fragmentShader.replace('#include <lights_fragment_begin>',NTRICK+'#include <lights_fragment_begin>');};
 food.customProgramCacheKey=()=>'r140k';
 // steel: brushed stainless, anisotropic highlight along u; heater glow from the emission map added after the bake
 const steel=new T.MeshPhysicalMaterial({map,roughness:1,roughnessMap:rough,metalness:1,metalnessMap:rough,normalMap:nrm,normalScale:new T.Vector2(.8,.8),
  anisotropy:.9,anisotropyRotation:0,envMap:env,envMapIntensity:.85,emissive:0xffffff,emissiveMap:emi,emissiveIntensity:.42,vertexColors:true});
 steel.onBeforeCompile=s=>{s.fragmentShader=s.fragmentShader.replace('#include <emissivemap_fragment>','vec3 G140=texture2D(emissiveMap,vEmissiveMapUv).rgb*3.2;\n#include <emissivemap_fragment>')
  .replace('#include <lights_fragment_begin>',NTRICK+'totalEmissiveRadiance+=G140;\n#include <lights_fragment_begin>');};
 steel.customProgramCacheKey=()=>'r140s';
 m.r138p140k=food;m.r138p140r=steel;return m;
}
const rng=seed=>{let s=(seed>>>0)||1;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return((s>>>0)%100000)/100000;};};
const lerp=(a,b,t)=>a+(b-a)*t;
// explicit per-corner UV quad (u along the roller / piece axis)
function quadUV(a,P,U,N){const n=N||null;for(const i of[0,1,2,0,2,3])a.v(P[i],n?n[i]:nf(P),U[i]);}
const nf=P=>{const e1=[P[1][0]-P[0][0],P[1][1]-P[0][1],P[1][2]-P[0][2]],e2=[P[3][0]-P[0][0],P[3][1]-P[0][1],P[3][2]-P[0][2]];
 const n=[e1[1]*e2[2]-e1[2]*e2[1],e1[2]*e2[0]-e1[0]*e2[2],e1[0]*e2[1]-e1[1]*e2[0]],l=Math.hypot(...n)||1;return[n[0]/l,n[1]/l,n[2]/l];};
function roller(a,x0,x1,y,z,r,N,rc){for(let j=0;j<N;j++){const f0=j/N*2*PI,f1=(j+1)/N*2*PI,c0=Math.cos(f0),s0=Math.sin(f0),c1=Math.cos(f1),s1=Math.sin(f1);
  const v0=lerp(rc[1],rc[3],j/N),v1=lerp(rc[1],rc[3],(j+1)/N);
  quadUV(a,[[x0,y+s0*r,z+c0*r],[x1,y+s0*r,z+c0*r],[x1,y+s1*r,z+c1*r],[x0,y+s1*r,z+c1*r]],[[rc[0],v0],[rc[2],v0],[rc[2],v1],[rc[0],v1]],[[0,s0,c0],[0,s0,c0],[0,s1,c1],[0,s1,c1]]);}}
/** lathe food piece along x, centred at origin, length L, spun by rot about its axis; profile + UV edges traced from the art */
function piece(a,name,L,rot,N=8){const P=PROFR140[name].filter((_,k)=>k%2===0||k===PROFR140[name].length-1),rc=UVR140[name];
 const ring=(p,j)=>{const[s,h,,vb,vt]=p,f=j/N*2*PI+rot,R=h*L,x=(s-.5)*L,cy=Math.cos(f),sz=Math.sin(f);
  return{P:[x,cy*R,sz*R],n:[0,cy,sz],u:[lerp(rc[0],rc[2],s),lerp(rc[1],rc[3],lerp(vt,vb,.07+.86*Math.abs(((j/N+.5)%1)*2-1)))]};};// linear in angle: top of the photo on top, front half mirrored round the back
 for(let i=0;i<P.length-1;i++){const h0=P[i],h1=P[i+1],dr=(h1[1]-h0[1])*L,dx=(h1[0]-h0[0])*L,l=Math.hypot(dr,dx)||1;
  for(let j=0;j<N;j++){const q=[ring(h0,j),ring(h0,j+1),ring(h1,j+1),ring(h1,j)];
   const nn=q.map(o=>{const t=Math.hypot(o.n[1],o.n[2])||1;return[-dr/l,o.n[1]/t*dx/l,o.n[2]/t*dx/l];});
   quadUV(a,[q[0].P,q[1].P,q[2].P,q[3].P],[q[0].u,q[1].u,q[2].u,q[3].u],nn);}}}
// ---- the grill: local origin = centre of its footprint at its feet, front (control panel) = +z ----
const N_ROLL=10,SP=.042,RR=.0135,RL=.62;
export function rollerGrill140(b,seed){
 const r=rng(seed),s=new Acc(UVR140,ASPR140,addRetail140Roller),f=new Acc(UVR140,ASPR140,addRetail140Roller);
 const D=N_ROLL*SP+.05,Wt=.075,W=RL+2*Wt,yb=.075,yr=.105;
 const SS=k=>sub(UVR140.steelSide,r()*.4,0,.6+r()*.4,1),ST=k=>sub(UVR140.steelTop,r()*.3,r()*.3,.7+r()*.3,.7+r()*.3);
 // base pan (front / back / sides), feet, side towers that carry the roller bearings
 s.box(0,.012,0,RL,yb-.012,D,{f:SS(),b:SS(),d:'soot'});
 for(const x of[-1,1])for(const z of[-1,1])s.box(x*(W/2-.03),0,z*(D/2-.03),.03,.012,.03,{f:'knob',b:'knob',l:'knob',r:'knob'});
 for(const sd of[-1,1]){const cx=sd*(RL/2+Wt/2);s.box(cx,.012,0,Wt,.15,D+.01,{f:SS(),b:SS(),l:SS(),r:SS(),t:ST()});}
 // control lip on the front: brand plate, two thermostat knobs (front / rear zone), red pilot lamps
 const zf=D/2+.002;s.quad([[-.16,.02,zf],[.16,.02,zf],[.16,.06,zf],[-.16,.06,zf]],UVR140.plate);
 for(const sd of[-1,1]){const cx=sd*(RL/2+Wt/2),kz=D/2+.006;s.tube([cx,.08,D/2],[cx,.08,kz+.012],.017,8,'steelSide');
  s.quad([[cx-.017,.063,kz+.012],[cx+.017,.063,kz+.012],[cx+.017,.097,kz+.012],[cx-.017,.097,kz+.012]],UVR140.knob);
  s.quad([[cx-.008,.115,zf+.004],[cx+.008,.115,zf+.004],[cx+.008,.131,zf+.004],[cx-.008,.131,zf+.004]],UVR140.pilot);}
 // sooty drip deck + one red-hot element in every gap between the rollers
 s.quad([[-RL/2,yb,D/2-.01],[RL/2,yb,D/2-.01],[RL/2,yb,-D/2+.01],[-RL/2,yb,-D/2+.01]],UVR140.soot);
 const z0=-(N_ROLL-1)*SP/2;
 for(let i=0;i<N_ROLL-1;i++){const z=z0+(i+.5)*SP,w=.0075,hc=sub(UVR140.heater,0,.25+r()*.1,1,.75-r()*.1);
  s.quad([[-RL/2+.01,yb+.004,z+w],[RL/2-.01,yb+.004,z+w],[RL/2-.01,yb+.004,z-w],[-RL/2+.01,yb+.004,z-w]],(r()<.5)?hc:[hc[2],hc[1],hc[0],hc[3]]);}
 // brushed rollers (u along the axis -> anisotropic streak), each with its own crop of the steel sheet
 for(let i=0;i<N_ROLL;i++){const z=z0+i*SP,v=r()*.55;roller(s,-RL/2-.005,RL/2+.005,yr,z,RR,10,sub(UVR140.steelRoll,0,v,1,v+.45));}
 // food: hot dogs in most grooves, taquitos on the rear third; a few gaps where some were sold
 for(let g=0;g<N_ROLL-1;g++){const taq=g>=6,name=taq?'taquito':'hotdog',L=taq?.155:.19,R=PROFR140[name][12][1]*L;
  const y=yr+Math.sqrt(Math.max(0,(RR+R)**2-(SP/2)**2)),z=z0+(g+.5)*SP;let x=-RL/2+.02;
  while(x+L<RL/2-.01){if(r()>.2){f.push(x+L/2+(r()-.5)*.01,y,z,(r()-.5)*.03);piece(f,name,L,r()*2*PI);f.pop();}x+=L+.012+r()*.02;}}
 s.flush(b,'r138p140r');f.flush(b,'r138p140k');
 // acrylic sneeze guard on the side towers: slanted front + flat top
 const gy=.16,gh=.2;b.plane('r138lexan',0,gy+gh*.42,D/2-.05,RL+.02,gh*.9,0,-.55);b.plane('r138lexan',0,gy+gh*.42,D/2-.05,RL+.02,gh*.9,PI,.55);
 b.plane('r138lexan',0,gy+gh*.8,-.06,RL+.02,D-.12,0,-PI/2);b.plane('r138lexan',0,gy+gh*.8-.002,-.06,RL+.02,D-.12,0,PI/2);
 return{W,D};
}
/** small stainless stand with the roller grill, menu card on a post, napkins; faces +z; local z = 0 at its back */
export function rollerStand140(b,seed,{w=.95,d=.52,h=.86}={}){
 const r=rng(seed),zc=d/2;
 b.box('r138coolW',0,h/2-.02,zc,w,h-.04,d);b.box('r138dark',0,.04,zc+.005,w,.08,d);b.box('r138steel',0,h-.01,zc,w+.02,.02,d+.02);
 b.push(0,h,zc,(r()-.5)*.04);rollerGrill140(b,seed^0x7a1);b.pop();
 // menu card on a back post
 const s=new Acc(UVR140,ASPR140,addRetail140Roller);s.tube([w/2-.06,h,.04],[w/2-.06,h+.62,.04],.008,6,'steelSide');s.tube([-w/2+.06,h,.04],[-w/2+.06,h+.62,.04],.008,6,'steelSide');
 const mw=w-.1,mh=mw/ASPR140.menu,y0=h+.62-mh;s.quad([[-mw/2,y0,.05],[mw/2,y0,.05],[mw/2,y0+mh,.05],[-mw/2,y0+mh,.05]],UVR140.menu);
 s.quad([[mw/2,y0,.048],[-mw/2,y0,.048],[-mw/2,y0+mh,.048],[mw/2,y0+mh,.048]],sub(UVR140.steelTop,.1,.1,.9,.9));s.flush(b,'r138p140r');
 b.box('r138dark',w/2-.1,h+.06,zc+.12,.1,.12,.1);b.box('r138coolW',w/2-.1,h+.125,zc+.12,.08,.01,.08);// napkin dispenser
 priceCard140(b,r,0,h-.13,d+.002,.3);
 b.solid(0,zc,w+.04,d+.04);
}
