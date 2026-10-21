// V140 P3: horizontal open-air (air-curtain) butcher / fish case with real modelled fresh meat and fish.
// Pieces take the silhouette traced from their own generated photo (SHAPE140, bc/tools/retail140_p3_meat.py):
//   ribeye / pork chop = domed slab with a rounded cut edge, snapper = per-column elliptic body (fins thin out),
//   salmon fillet = tapered heightfield side, mince = noisy mound, stew = separate jittered cubes; all sit in
//   modelled foam trays (floor, slanted walls, rolled flange) on absorbent pads, with their scale label on top.
// ONE MeshPhysicalMaterial for all of it: dark-red high-roughness base (roughnessMap) + clearcoat 1 with very low
// clearcoatRoughness = the cling film, its clearcoatNormalMap carries the film wrinkles; envMap = the store interior
// (P2 glass140_env) so the wrap throws moving highlights. Diffuse comes from the store bake like every r138p140* part.
// ?meat140=0 -> chest freezers everywhere as before.
import * as T from './vendor/three.module.min.js';
import {UVM140,ASPM140,SHAPE140} from './retail140-meat-uv.js?v=140f';
import {Acc,sub,priceCard140} from './retail140-fixtures.js?v=140d';
export const MEAT140=!(typeof location!=='undefined'&&/[?&]meat140=0\b/.test(location.search));
const A=new URL('./assets/l11-v140/',import.meta.url).href,V='140f',PI=Math.PI;
function tex(name,srgb){const t=new T.TextureLoader().load(A+name+'.webp?v='+V);if(srgb)t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;t.magFilter=T.NearestFilter;return t;}
export function addRetail140Meat(m){
 if(m.r138p140m)return m;
 const map=tex('meat140',true),env=tex('glass140_env',true);env.mapping=T.EquirectangularReflectionMapping;env.magFilter=T.LinearFilter;
 const mat=new T.MeshPhysicalMaterial({map,emissive:0xffffff,emissiveMap:map,emissiveIntensity:.42,roughness:1,roughnessMap:tex('meat140_r'),metalness:0,
  normalMap:tex('meat140_n'),normalScale:new T.Vector2(1,1),clearcoat:1,clearcoatRoughness:.035,clearcoatNormalMap:tex('meat140_cn'),
  clearcoatNormalScale:new T.Vector2(.7,.7),envMap:env,envMapIntensity:.9,vertexColors:true});
 mat.onBeforeCompile=s=>{s.fragmentShader=s.fragmentShader.replace('#include <lights_fragment_begin>',
  'vec3 L140=normalize(vec3(-.25,.75,.62));totalEmissiveRadiance*=clamp((.5+.5*dot(normal,L140))/max(.25,.5+.5*dot(nonPerturbedNormal,L140)),.55,1.35);\n#include <lights_fragment_begin>');};
 mat.customProgramCacheKey=()=>'r140m';m.r138p140m=mat;return m;
}
const rng=seed=>{let s=(seed>>>0)||1;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return((s>>>0)%100000)/100000;};};
const nz=v=>{const l=Math.hypot(v[0],v[1],v[2])||1;return[v[0]/l,v[1]/l,v[2]/l];};
const at=(rc,s,t)=>[rc[0]+(rc[2]-rc[0])*s,rc[1]+(rc[3]-rc[1])*t];
function tri(a,P,U){const e1=[0,1,2].map(k=>P[1][k]-P[0][k]),e2=[0,1,2].map(k=>P[2][k]-P[0][k]);
 const n=nz([e1[1]*e2[2]-e1[2]*e2[1],e1[2]*e2[0]-e1[0]*e2[2],e1[0]*e2[1]-e1[1]*e2[0]]);for(let i=0;i<3;i++)a.v(P[i],n,U[i]);}
const q4=(a,P,U)=>{tri(a,[P[0],P[1],P[2]],[U[0],U[1],U[2]]);tri(a,[P[0],P[2],P[3]],[U[0],U[2],U[3]]);};
// ---- pieces (local: centre of footprint at origin, lying on y = 0, image up = −z) ----
/** traced outline slab: W wide (image x), depth from the art's aspect, thickness th, domed top + rounded cut edge */
function slab(a,name,W,th){const S=SHAPE140[name],rc=UVM140[name],D=W/ASPM140[name],c=S.c,P=S.p,n=P.length;
 const X=(s,t,f)=>[(c[0]+(s-c[0])*f-.5)*W,0,-(c[1]+(t-c[1])*f-.5)*D];
 const rings=[[0,th*1.12],[.55,th*1.06],[.86,th*.96],[.97,th*.7],[1,.002]];
 const pt=(i,j)=>{const[f,h]=rings[j],[s,t]=P[i%n],p=X(s,t,f);p[1]=h;return p;},uv=(i,j)=>{const f=Math.min(rings[j][0],.985),[s,t]=P[i%n];return at(rc,c[0]+(s-c[0])*f,c[1]+(t-c[1])*f);};
 for(let i=0;i<n;i++){tri(a,[pt(0,0),pt(i+1,1),pt(i,1)].map((p,k)=>k?p:[(c[0]-.5)*W,th*1.12,-(c[1]-.5)*D]),[at(rc,c[0],c[1]),uv(i+1,1),uv(i,1)]);
  for(let j=1;j<rings.length-1;j++)q4(a,[pt(i,j),pt(i,j+1),pt(i+1,j+1),pt(i+1,j)],[uv(i,j),uv(i,j+1),uv(i+1,j+1),uv(i+1,j)]);}
 return D;}
/** whole fish lying on its side: per traced column an elliptic half-section, fins (thin column runs) flatten out */
function fishBody(a,L){const S=SHAPE140.snapper.cols,rc=UVM140.snapper,Dz=L/ASPM140.snapper,K=6,secs=[];
 for(const[s,tb,tt]of S){const hw=(tt-tb)/2*Dz,zc=-((tb+tt)/2-.5)*Dz,tail=s>.74?Math.max(.06,1-(s-.74)/.12):1;
  const th=Math.min(hw*.62,L*.075)*tail*Math.min(1,s*9);secs.push({x:(s-.5)*L,s,tb,tt,hw,zc,th});}
 for(let i=0;i<secs.length-1;i++){const A0=secs[i],B0=secs[i+1];
  for(let k=0;k<K;k++){const P=[],U=[];for(const[S0,kk]of[[A0,k],[A0,k+1],[B0,k+1],[B0,k]]){const f=kk/K*PI;
    P.push([S0.x,.004+Math.sin(f)*S0.th,S0.zc+Math.cos(f)*S0.hw]);U.push(at(rc,S0.s,(S0.tb+S0.tt)/2-Math.cos(f)*(S0.tt-S0.tb)/2));}
   q4(a,[P[0],P[3],P[2],P[1]],[U[0],U[3],U[2],U[1]]);}}
 return Dz;}
/** heightfield over W x D (cell window rc), height fn h(u,v) in 0..1 coords; skirt down to 0 all round */
function field(a,rc,W,D,nu,nv,h){const X=(u,v)=>[(u-.5)*W,h(u,v),(v-.5)*D],UV=(u,v)=>at(rc,u,1-v);
 for(let i=0;i<nu;i++)for(let j=0;j<nv;j++){const u0=i/nu,u1=(i+1)/nu,v0=j/nv,v1=(j+1)/nv;q4(a,[X(u0,v1),X(u1,v1),X(u1,v0),X(u0,v0)],[UV(u0,v1),UV(u1,v1),UV(u1,v0),UV(u0,v0)]);}
 const edge=(pts)=>{for(let k=0;k<pts.length-1;k++){const[p0,p1]=[pts[k],pts[k+1]],A0=X(...p0),B0=X(...p1);q4(a,[[A0[0],0,A0[2]],[B0[0],0,B0[2]],B0,A0],[UV(...p0),UV(...p1),UV(...p1),UV(...p0)]);}};
 const L=n=>Array.from({length:n+1},(_,k)=>k/n);edge(L(nu).map(u=>[u,1]));edge(L(nv).map(v=>[1,1-v]));edge(L(nu).map(u=>[1-u,0]));edge(L(nv).map(v=>[0,v]));}
/** foam tray: floor, four walls slanting out, rolled flange; inside + outside */
function tray(a,r,W,D,H,foam){const rc=UVM140[foam],ins=.014,f=.012;
 const w=sub(rc,r()*.3,r()*.3,.7+r()*.3,.7+r()*.3);const U=(x,z)=>at(w,x/W+.5,z/D+.5);
 const b=[[-W/2+ins,0,D/2-ins],[W/2-ins,0,D/2-ins],[W/2-ins,0,-D/2+ins],[-W/2+ins,0,-D/2+ins]],t=[[-W/2,H,D/2],[W/2,H,D/2],[W/2,H,-D/2],[-W/2,H,-D/2]],
  o=[[-W/2-f,H-.003,D/2+f],[W/2+f,H-.003,D/2+f],[W/2+f,H-.003,-D/2-f],[-W/2-f,H-.003,-D/2-f]];
 const UVp=p=>U(p[0],p[2]);
 q4(a,[b[0],b[1],b[2],b[3]].map(p=>[p[0],.003,p[2]]),b.map(UVp));
 for(let i=0;i<4;i++){const j=(i+1)%4;const Ui=[UVp(b[i]),UVp(b[j]),UVp(t[j]),UVp(t[i])];
  q4(a,[[b[i][0],.003,b[i][2]],[b[j][0],.003,b[j][2]],t[j],t[i]],Ui);// inner wall
  q4(a,[t[i],t[j],o[j],o[i]],Ui);// flange top
  q4(a,[o[i],o[j],[b[j][0],0,b[j][2]],[b[i][0],0,b[i][2]]],Ui);}}// outer wall
function pad(a,W,D){const rc=UVM140.pad;q4(a,[[-W/2,.005,D/2],[W/2,.005,D/2],[W/2,.005,-D/2],[-W/2,.005,-D/2]],[[rc[0],rc[1]],[rc[2],rc[1]],[rc[2],rc[3]],[rc[0],rc[3]]]);}
/** scale label lying on the film, corner of the tray, slightly bent over the meat */
function label(a,k,x,y,z,ry){const rc=UVM140['lab_'+k],w=.075,h=w/ASPM140['lab_'+k];a.push(x,y,z,ry);
 q4(a,[[-w/2,0,h/2],[w/2,0,h/2],[w/2,.004,-h/2],[-w/2,.004,-h/2]],[[rc[0],rc[1]],[rc[2],rc[1]],[rc[2],rc[3]],[rc[0],rc[3]]]);a.pop();}
// ---- one packed tray of each kind; returns footprint [W,D] ----
const PACK={
 ribeye:(a,r)=>{const W=.25,D=.18;tray(a,r,W,D,.022,'foamB');a.push(0,.006,0,(r()-.5)*.25);slab(a,'ribeye',.215,.022);a.pop();label(a,'ribeye',W*.22,.036,D*.18,-.2);return[W,D];},
 porkchop:(a,r)=>{const W=.27,D=.2;tray(a,r,W,D,.02,'foamW');pad(a,W-.05,D-.05);for(const s of[-1,1]){a.push(s*.035,.007+(s>0?.012:0),s*.02,(r()-.5)*.2+(s>0?PI:0));slab(a,'porkchop',.18,.016);a.pop();}
  label(a,'porkchop',-W*.2,.044,-D*.15,.15);return[W,D];},
 mince:(a,r)=>{const W=.2,D=.15,k=r()<.5?'mince':'mince2';tray(a,r,W,D,.025,'foamB');const ph=r()*6;
  a.push(0,.004,0,0);field(a,UVM140[k],W-.03,D-.03,7,5,(u,v)=>{const x=2*u-1,z=2*v-1,e=Math.max(0,1-Math.pow(Math.abs(x),3.5)-Math.pow(Math.abs(z),3.5));return .034*Math.pow(e,.35)*(1+.12*Math.sin(u*17+ph)*Math.sin(v*13));});a.pop();
  label(a,'mince',0,.043,D*.1,(r()-.5)*.3);return[W,D];},
 stew:(a,r)=>{const W=.21,D=.16,k=r()<.5?'stewcubes':'stew2',rc=UVM140[k];tray(a,r,W,D,.024,'foamB');
  for(let l=0;l<2;l++)for(let i=0;i<5;i++)for(let j=0;j<3;j++){if(l&&r()<.45)continue;const s=.027+r()*.01,u=r()*.8,v=r()*.8,w=sub(rc,u,v,u+.16,v+.16),w2=sub(rc,v,u,v+.12,u+.12);
   a.push(-W/2+.03+i*.037+(r()-.5)*.008,.004+l*.022,-D/2+.03+j*.042+l*.018+(r()-.5)*.008,r()*PI);a.box(0,0,0,s,s*.85,s*1.1,{t:w,f:w2,b:w2,l:w,r:w2});a.pop();}
  label(a,'stew',W*.2,.06,D*.22,.1);return[W,D];},
 salmon:(a,r)=>{const W=.32,D=.15;tray(a,r,W,D,.02,'foamW');pad(a,W-.04,D-.04);const rc=sub(UVM140.salmon,.03,.04,.97,.96);
  a.push(0,.007,0,(r()-.5)*.08);field(a,rc,W-.035,D-.03,8,4,(u,v)=>{const x=2*u-1;return .03*(1-Math.pow(Math.abs(x),5))*(.35+.65*Math.pow(1-v,.6))*Math.min(1,v*6+.25);});a.pop();
  label(a,'salmon',-W*.28,.04,D*.2,-.1);return[W,D];},
};
// ---- the case ----
/** horizontal open-air meat / fish case (island or wall run), length along x, both long sides shoppable on chest
 *  footprints; local y = 0 floor. fish = crushed-ice bed with whole snappers + salmon trays, else butcher trays. */
export function meatCase140(b,seed,{len=2.0,D=.92,fish=false}={}){
 const r=rng(seed),h=.82,wt=.06,hw=.5,a=new Acc(UVM140,ASPM140,addRetail140Meat);
 b.box('r138dark',0,.07,0,len+.01,.14,D+.01);b.box('r138coolW',0,hw/2,0,len,hw,D);
 for(const s of[-1,1]){b.box('r138coolW',0,hw+(h-hw)/2,s*(D/2-wt/2),len,h-hw,wt);b.box('r138coolW',s*(len/2-wt/2),hw+(h-hw)/2,0,wt,h-hw,D-2*wt);
  b.box('r138steel',s*(len/2-wt/2+.005),h,0,wt+.01,.03,D-2*wt);
  // rounded stainless bumper + black kick stripe on both long faces
  b.box('r138steel',0,.6,s*(D/2+.012),len,.05,.024);b.box('r138dark',0,.3,s*(D/2+.004),len,.03,.008);
  // air-curtain grilles: honeycomb discharge / return along each long rim (dark well + steel slats every 4 cm)
  const gz=s*(D/2-wt-.035);b.box('r138dark',0,h-.012,gz,len-2*wt,.012,.07);b.box('r138steel',0,h,s*(D/2-wt/2),len,.03,wt+.01);
  for(const dz of[-.023,0,.023])b.box('r138steel',0,h-.004,gz+dz,len-2*wt,.006,.004);
  for(let x=-len/2+wt+.04;x<len/2-wt;x+=.04)b.box('r138steel',x,h-.004,gz,.004,.006,.07);}
 // well deck: stepped in two tiers toward each long side (centre high), dark liner
 const iw=len-2*wt,id=D-2*wt-.14,yd=hw+.04;b.box('r138dark',0,yd-.03,0,iw,.03,id+.14);b.box('r138dark',0,yd,0,iw,.06,id*.42);
 // price-card rail on both rims
 for(const s of[-1,1]){b.push(0,0,0,s<0?PI:0);for(let x=-len/2+.25;x<len/2-.2;x+=.5)priceCard140(b,r,x,.5+.12,D/2+.026,.22);b.pop();}
 if(fish){const ice=UVM140.ice;a.push(0,yd-.01,0,0);
  field(a,ice,iw-.01,id+.13,Math.max(6,Math.round(iw/.12)),6,(u,v)=>{const z=2*v-1;return .05+.06*(1-z*z)+.012*Math.sin(u*41+seed)*Math.sin(v*23);});
  // whole snappers bedded in the ice, slanting, both faces of the island
  for(const s of[-1,1])for(let x=-iw/2+.22;x<iw/2-.42;x+=.2+r()*.07){const zz=s*(.1+r()*.1),ry=(s>0?0:PI)+(r()<.5?.45:-.45)+(r()-.5)*.35;a.push(x,.07+.06*(1-Math.pow(zz/((id+.13)/2),2))-.014,zz,ry);fishBody(a,.33+r()*.07);a.pop();}
  a.pop();
  for(const s of[-1,1]){a.push(len/2-wt-.22,yd+.045,s*(id/2-.03),s>0?0:PI);PACK.salmon(a,r);a.pop();}
 }else{const kinds=['ribeye','porkchop','mince','stew','ribeye','mince'];
  for(const s of[-1,1])for(const tier of[0,1]){let x=-iw/2+.02,sec=(seed>>>(s>0?3:5))%kinds.length,run=0;const z=s*(tier?id*.13:id*.36),y=yd+(tier?.03:-.012);
   while(x<iw/2-.2){const k=kinds[sec%kinds.length],[W]=k==='porkchop'?[.27]:k==='ribeye'?[.25]:k==='stew'?[.21]:[.2];if(x+W>iw/2-.01)break;
    a.push(x+W/2,y,z,(s>0?0:PI)+(r()-.5)*.06);a.push(0,0,0,-(tier?.06:.1)*0);PACK[k](a,r);a.pop();a.pop();x+=W+.012;if(++run>=2+((r()*2)|0)){run=0;sec++;}}}}
 a.flush(b,'r138p140m');
 b.solid(0,0,len+.04,D+.04);
}
