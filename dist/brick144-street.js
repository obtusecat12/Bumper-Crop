// V144 A2 (notes/spec-1022-capital-landmarks.md A, ref files/ref-1022-capital-brickblock.webp right half): the street in front of
// the capital brick slab and the road works east of it. Runs inside brick144Task's frame (origin = slab centre, y 0 = sidewalk
// top, front face z = 12, kerb z = 16.5, road crown z = 24; block-local x = 45 + x). Positions read off the photo
// (photo px -> rectified px ~ x1.2 -> metres). Everything is real geometry with its own texture set (base + roughness + normal)
// from bc/tools/brick144a2_assets.py -> assets/l11-v144/a2_*: GGBotNet cars (car132 geometry + paints; silver = new car5_silver),
// bus shelter (bronze steel frame, glass, bench, KELDA lightbox), STOP / street-name / pedestrian-signal poles, street lights,
// young street trees + a shrub131 bush, and the works: chain-link temporary fence panels on feet, orange/white water-filled
// barriers closing the parking lane, a Type III stripe barricade, cones and a nested cone stack, a painted plywood hoarding
// sheet (raw back), a raw plywood job box and a sheet stack on dunnage, corrugated pipes on chocks, a black wheelie bin,
// the orange diamond work sign on a spring stand, and a dirt lot. The frontage's stock furniture is cleared by
// BRICK144_CLEAR (urban-streets KEEP_CLEAR). Off with the slab (?brick144=0).
import * as T from './vendor/three.module.min.js';
import {CAR132,car132Geometry,car132Material} from './cars132.js?v=133c';
import * as P from './urban-props.js?v=132st';
import {shrub131} from './shrub131.js?v=131';
const A=new URL('./assets/l11-v144/',import.meta.url).href,PI=Math.PI;
function tx(n,srgb=true,rep=true){const t=new T.TextureLoader().load(A+n+'.webp?v=144b');if(srgb)t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;t.magFilter=T.NearestFilter;if(rep)t.wrapS=t.wrapT=T.RepeatWrapping;return t;}
let M=null;
function mats(m){
 if(m.a2ply)return m;
 if(!M){M={};const std=(n,o={})=>new T.MeshStandardMaterial({map:tx(n),normalMap:tx(n+'-n',false),roughnessMap:tx(n+'-r',false),roughness:1,metalness:0,vertexColors:true,...o});
  M.a2ply=std('a2_plyp');M.a2plr=std('a2_plyr');M.a2hdpe=std('a2_hdpe');M.a2hdpw=std('a2_hdpw');M.a2strp=std('a2_strp');
  M.a2sign=std('a2_sign',{metalness:.1});M.a2pipe=std('a2_pipe');M.a2cone=std('a2_cone');M.a2bin=std('a2_bin');M.a2stel=std('a2_stel',{metalness:.55});
  M.a2dirt=std('a2_dirt');for(const k of['a2dirt','a2pipe','a2hdpe','a2hdpw','a2bin','a2stel'])M[k].normalScale=new T.Vector2(.8,.8);
  M.a2post=new T.MeshStandardMaterial({map:tx('a2_post',true,false),emissiveMap:tx('a2_post',true,false),emissive:0xffffff,emissiveIntensity:.55,roughness:.2,metalness:0,vertexColors:true});
  M.a2stop=new T.MeshStandardMaterial({map:tx('a2_stop',true,false),roughness:.45,metalness:.1,vertexColors:true});
  M.a2name=new T.MeshStandardMaterial({map:tx('a2_name',true,false),roughness:.45,metalness:.1,vertexColors:true});
  M.a2ped=new T.MeshStandardMaterial({map:tx('a2_ped',true,false),roughness:.45,metalness:.1,vertexColors:true});
  M.a2chain=new T.MeshStandardMaterial({map:tx('a2_chain'),normalMap:tx('a2_chain-n',false),alphaTest:.5,side:T.DoubleSide,roughness:.5,metalness:.6,vertexColors:true});
  {const t=M.a2chain.map;t.generateMipmaps=false;t.minFilter=T.NearestFilter;}   // keep the wires from mip-fading out of the alpha test
  M.a2glass=new T.MeshStandardMaterial({color:0xa8c4c0,transparent:true,opacity:.26,depthWrite:false,roughness:.05,metalness:.2,side:T.DoubleSide,vertexColors:true});
  M.a2galv=new T.MeshStandardMaterial({color:0xa9aeac,roughness:.42,metalness:.75,vertexColors:true});
  M.a2rub=new T.MeshStandardMaterial({color:0x1d1d1d,roughness:.9,metalness:0,vertexColors:true});
  for(const[k,v]of Object.entries(M))v.name='V144 A2 '+k;}
 return Object.assign(m,M);
}
// ---- quad soup with explicit uvs, auto-oriented by an outward hint
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],crs=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
class Q{constructor(){this.p={};}
 s(k){return this.p[k]||(this.p[k]={pos:[],uv:[]});}
 tri(k,a,b,c,ua,ub,uc,out){if(out&&dot(crs(sub(b,a),sub(c,a)),out)<0){[b,c]=[c,b];[ub,uc]=[uc,ub];}const s=this.s(k);s.pos.push(...a,...b,...c);s.uv.push(...ua,...ub,...uc);}
 q(k,a,b,c,d,uv,out){if(out&&dot(crs(sub(b,a),sub(d,a)),out)<0){[b,d]=[d,b];uv=[uv[0],uv[3],uv[2],uv[1]];}const s=this.s(k);s.pos.push(...a,...b,...c,...a,...c,...d);s.uv.push(...uv[0],...uv[1],...uv[2],...uv[0],...uv[2],...uv[3]);}
 // box; r = one uv rect [u0,v0,u1,v1] for all faces, an array of six rects (+z,-z,+x,-x,+y,-y), or a number = metres per tile
 box(k,x0,x1,y0,y1,z0,z1,r=[0,0,1,1]){const w=x1-x0,h=y1-y0,d=z1-z0;
  const R=(i,a,b)=>typeof r==='number'?[0,0,a/r,b/r]:Array.isArray(r[0])?r[i%r.length]:r,U=([u0,v0,u1,v1])=>[[u0,v0],[u1,v0],[u1,v1],[u0,v1]];
  this.q(k,[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1],U(R(0,w,h)));this.q(k,[x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0],U(R(1,w,h)));
  this.q(k,[x1,y0,z1],[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],U(R(2,d,h)));this.q(k,[x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0],U(R(3,d,h)));
  this.q(k,[x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0],U(R(4,w,d)));this.q(k,[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],U(R(5,w,d)));}
 // tube between two points (n sides), uv u around, v along (tile metres)
 tube(k,a,b,r,n=6,tile=1){const v=sub(b,a),L=Math.hypot(...v),ax=v.map(c=>c/L),up=Math.abs(ax[1])<.9?[0,1,0]:[1,0,0],e1=crs(ax,up),l1=Math.hypot(...e1),u1=e1.map(c=>c/l1),u2=crs(ax,u1);
  for(let i=0;i<n;i++){const t0=i/n*2*PI,t1=(i+1)/n*2*PI,o0=u1.map((c,j)=>(c*Math.cos(t0)+u2[j]*Math.sin(t0))*r),o1=u1.map((c,j)=>(c*Math.cos(t1)+u2[j]*Math.sin(t1))*r);
   this.q(k,a.map((c,j)=>c+o0[j]),a.map((c,j)=>c+o1[j]),b.map((c,j)=>c+o1[j]),b.map((c,j)=>c+o0[j]),[[i/n,0],[(i+1)/n,0],[(i+1)/n,L/tile],[i/n,L/tile]],o0.map((c,j)=>c+o1[j]));}}
 // lathe around y at (cx,cz): prof [[r,y],...] bottom->top, uv u = angle, v from v0..v1 along the profile
 lathe(k,cx,cz,prof,n=12,v0=0,v1=1,a0=0){const L=[0];for(let i=1;i<prof.length;i++)L.push(L[i-1]+Math.hypot(prof[i][0]-prof[i-1][0],prof[i][1]-prof[i-1][1]));
  for(let j=0;j<n;j++){const t0=a0+j/n*2*PI,t1=a0+(j+1)/n*2*PI,P=(p,t)=>[cx+p[0]*Math.cos(t),p[1],cz+p[0]*Math.sin(t)];
   for(let i=0;i<prof.length-1;i++){const va=v0+(v1-v0)*L[i]/L.at(-1),vb=v0+(v1-v0)*L[i+1]/L.at(-1),tm=(t0+t1)/2,dr=prof[i+1][1]-prof[i][1],dy=-(prof[i+1][0]-prof[i][0]);
    this.q(k,P(prof[i],t0),P(prof[i],t1),P(prof[i+1],t1),P(prof[i+1],t0),[[j/n,va],[(j+1)/n,va],[(j+1)/n,vb],[j/n,vb]],[Math.cos(tm)*dr,dy,Math.sin(tm)*dr]);}}}
 flush(b,x=0,y=0,z=0,ry=0){for(const[k,s]of Object.entries(this.p)){if(!s.pos.length)continue;const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(s.pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(s.uv,2));g.computeVertexNormals();b.add(g,k,x,y,z,1,1,1,ry);g.dispose();}this.p={};}
}
const hsh=(a,b=0)=>{let h=Math.imul((a|0)^0x9e3779b9,0x85ebca6b)^Math.imul(b|0,0xc2b2ae35);h^=h>>>15;h=Math.imul(h,0x2c1b3c6d);h^=h>>>12;return(h>>>0)/4294967296;};
const ROAD=-.135;   // parking-lane surface relative to the sidewalk top
// ---- items (each built in its own local frame, then flushed at x,z,ry)
function car(b,id,paint,x,z,ry){const c=CAR132[id],key='car132:'+paint;if(!b.mats[key])b.mats[key]=car132Material(paint,true);
 b.push(x,ROAD+.015,z,ry);b.add(car132Geometry(id),key,0,0,0);b.solid(0,0,c.W*.9,c.L*.97);b.pop();}
// water-filled barrier, 1.83 m long along x, jersey-like profile, fill cap, interlock lugs, forklift slots
const BARP=[[.235,0],[.235,.07],[.17,.32],[.10,.86],[.075,1.0],[.04,1.05],[-.04,1.05],[-.075,1.0],[-.10,.86],[-.17,.32],[-.235,.07],[-.235,0]];
function barrier(S,k,lod){const L=1.83,x0=-L/2,x1=L/2,ar=[0];for(let i=1;i<BARP.length;i++)ar.push(ar[i-1]+Math.hypot(BARP[i][0]-BARP[i-1][0],BARP[i][1]-BARP[i-1][1]));
 for(let i=0;i<BARP.length-1;i++){const[za,ya]=BARP[i],[zb,yb]=BARP[i+1],va=ar[i]/ar.at(-1),vb=ar[i+1]/ar.at(-1);
  S.q(k,[x0,ya,za],[x1,ya,za],[x1,yb,zb],[x0,yb,zb],[[0,va],[1,va],[1,vb],[0,vb]],[0,yb+ya-.9,za+zb]);}
 const nB=BARP.length;for(const[x,s]of[[x0,-1],[x1,1]])for(let i=0;i<nB;i++){const p=BARP[i],q=BARP[(i+1)%nB];S.tri(k,[x,.5,0],[x,p[1],p[0]],[x,q[1],q[0]],[.5,.5],[.5+p[0],p[1]/1.1],[.5+q[0],q[1]/1.1],[s,0,0]);}
 S.lathe(k,-.45,0,[[.075,1.05],[.075,1.09],[0,1.1]],8,.9,1);
 if(!lod){S.box(k,x1-.02,x1+.09,.62,.82,-.06,.06,[.9,.6,1,.8]);S.box(k,x0-.09,x0+.02,.38,.58,-.06,.06,[0,.4,.1,.6]);
  for(const x of[-.45,.45]){S.box('a2rub',x-.17,x+.17,.05,.16,.236,.24);S.box('a2rub',x-.17,x+.17,.05,.16,-.24,-.236);}}}
// Type III barricade: three stripe rails on two galvanized A-frame legs, 2.4 m
function barricade(S,lod){const W=1.2;for(const[i,y]of[[0,.55],[1,.95],[2,1.35]])S.box('a2strp',-W,W,y,y+.2,-.015,.015,[[0,0,1,1],[1,0,0,1],[0,0,.02,1],[0,0,.02,1],[0,0,1,.02],[0,0,1,.02]]);
 for(const x of[-1,1]){const X=x*(W-.2);S.tube('a2galv',[X,0,-.45],[X,1.6,-.03],.025,lod?4:6);S.tube('a2galv',[X,0,.45],[X,1.6,.03],.025,lod?4:6);S.tube('a2galv',[X,.25,-.34],[X,.25,.34],.015,4);S.box('a2rub',X-.08,X+.08,0,.08,-.5,-.38);S.box('a2rub',X-.08,X+.08,0,.08,.38,.5);}}
// traffic cone 0.71 m on a square rubber base; dy stacks them
function cone(S,dy=0,lod){S.box('a2rub',-.19,.19,dy,dy+.035,-.19,.19,.4);S.lathe('a2cone',0,0,[[.155,dy+.035],[.13,dy+.2],[.075,dy+.52],[.03,dy+.7],[0,dy+.71]],lod?8:12);}
// chain-link temporary fence panel w x 1.83 along x at z 0, galvanized frame, two feet
function fence(S,w,lod){const h=1.83,y0=.1;S.q('a2chain',[0,y0,0],[w,y0,0],[w,y0+h,0],[0,y0+h,0],[[0,0],[w/.48,0],[w/.48,h/.48],[0,h/.48]]);
 const n=lod?4:6;S.tube('a2galv',[.02,0,0],[.02,y0+h+.02,0],.022,n);S.tube('a2galv',[w-.02,0,0],[w-.02,y0+h+.02,0],.022,n);
 if(!lod){S.tube('a2galv',[0,y0+h,0],[w,y0+h,0],.018,5);S.tube('a2galv',[0,y0,0],[w,y0,0],.018,5);}
 for(const x of[0,w]){S.box('a2rub',x-.33,x+.33,0,.12,-.1,.1,.6);}}
// plywood sheet 2.44 x 1.22 x 0.018 standing on its long edge (front painted, back raw)
function plySheet(S,front='a2ply'){S.q(front,[-1.22,0,.0095],[1.22,0,.0095],[1.22,1.22,.0095],[-1.22,1.22,.0095],[[0,0],[1,0],[1,1],[0,1]],[0,0,1]);S.box('a2plr',-1.22,1.22,0,1.22,-.009,.008,[[0,0,.02,.02],[0,0,1,1],[0,0,.02,1],[.98,0,1,1],[0,0,1,.02],[0,.98,1,1]]);}
// corrugated pipe r .3, length L along x, hollow
function pipe(S,L,r,lod){const n=lod?8:14,ri=r-.025;for(let j=0;j<n;j++){const t0=j/n*2*PI,t1=(j+1)/n*2*PI,P=(x,t,rr)=>[x,rr*Math.sin(t),rr*Math.cos(t)],tm=(t0+t1)/2,o=[0,Math.sin(tm),Math.cos(tm)];
  S.q('a2pipe',P(0,t0,r),P(L,t0,r),P(L,t1,r),P(0,t1,r),[[0,j/n],[L/1.5,j/n],[L/1.5,(j+1)/n],[0,(j+1)/n]],o);
  S.q('a2pipe',P(0,t0,ri),P(L,t0,ri),P(L,t1,ri),P(0,t1,ri),[[0,j/n],[L/1.5,j/n],[L/1.5,(j+1)/n],[0,(j+1)/n]],o.map(c=>-c));
  for(const[x,s]of[[0,-1],[L,1]])S.q('a2pipe',P(x,t0,ri),P(x,t0,r),P(x,t1,r),P(x,t1,ri),[[0,0],[.02,0],[.02,.1],[0,.1]],[s,0,0]);}}
// black wheelie bin .58 x .72 x 1.0 (tapered), lid, hinge, wheels, handle; each face its own part of the bin sheet
function bin(S,lod){const b0=[.25,.31],t0=[.29,.36],H=.95,P=(sx,sz,y,w)=>[sx*w[0],y,sz*w[1]];
 const F=(a,b,c,d,uv,o)=>S.q('a2bin',a,b,c,d,uv,o);
 F(P(-1,1,.06,b0),P(1,1,.06,b0),P(1,1,H,t0),P(-1,1,H,t0),[[0,0],[.5,0],[.5,.7],[0,.7]],[0,0,1]);F(P(1,-1,.06,b0),P(-1,-1,.06,b0),P(-1,-1,H,t0),P(1,-1,H,t0),[[.5,0],[1,0],[1,.7],[.5,.7]],[0,0,-1]);
 F(P(1,1,.06,b0),P(1,-1,.06,b0),P(1,-1,H,t0),P(1,1,H,t0),[[0,.7],[.5,.7],[.5,1],[0,1]].map(([u,v])=>[v,u]),[1,0,0]);F(P(-1,-1,.06,b0),P(-1,1,.06,b0),P(-1,1,H,t0),P(-1,-1,H,t0),[[.5,.7],[1,.7],[1,1],[.5,1]].map(([u,v])=>[v-.7,u]),[-1,0,0]);
 F(P(-1,-1,.06,b0),P(1,-1,.06,b0),P(1,1,.06,b0),P(-1,1,.06,b0),[[0,0],[.3,0],[.3,.3],[0,.3]],[0,-1,0]);
 S.box('a2bin',-.31,.31,H,H+.05,-.40,.38,[[.6,.7,1,.75],[.6,.75,1,.8],[.2,.8,.6,.85],[.2,.85,.6,.9],[.3,.3,.9,.68],[.3,.3,.9,.4]]);S.box('a2bin',-.27,.27,H+.05,H+.075,-.34,.32,[.32,.32,.8,.62]);
 S.tube('a2bin',[-.28,H-.02,-.41],[.28,H-.02,-.41],.022,5);if(!lod){S.tube('a2rub',[-.34,.1,-.33],[-.27,.1,-.33],.1,8);S.tube('a2rub',[.27,.1,-.33],[.34,.1,-.33],.1,8);S.tube('a2galv',[-.27,.1,-.33],[.27,.1,-.33],.015,4);}}
// raw plywood job box 1.2 x .9 x .95 with a lid lip and hasp, six different parts of the sheet
function jobBox(S){S.box('a2plr',-.6,.6,0,.95,-.45,.45,[[0,0,.5,.39],[.5,0,1,.39],[0,.4,.36,.79],[.36,.4,.72,.79],[0,.6,.5,1],[.5,.6,1,1]]);S.box('a2plr',-.62,.62,.95,1.0,-.47,.47,[[.72,.4,1,.45],[.72,.45,1,.5],[.72,.5,1,.55],[.72,.55,1,.6],[.5,.3,1,.7],[.5,.3,1,.7]]);S.box('a2galv',-.05,.05,.78,.96,.45,.47);}
// orange diamond work sign (0.9 m square at 45 deg) on a spring stand
function diamond(S,lod){const s=.64,cy=1.25,f=.012;S.q('a2sign',[0,cy-s,f],[s,cy,f],[0,cy+s,f],[-s,cy,f],[[.5,0],[1,.5],[.5,1],[0,.5]],[0,0,1]);S.q('a2galv',[0,cy-s,-.002],[s,cy,-.002],[0,cy+s,-.002],[-s,cy,-.002],[[0,0],[1,0],[1,1],[0,1]],[0,0,-1]);
 S.tube('a2galv',[0,cy-s+.05,-.03],[0,cy+s-.05,-.03],.012,4);S.tube('a2galv',[-s+.05,cy,-.03],[s-.05,cy,-.03],.012,4);S.tube('a2galv',[0,.12,-.03],[0,cy-s+.05,-.03],.02,lod?4:6);
 S.box('a2galv',-.02,.02,.08,.22,-.05,-.01);for(const a of[-1,1])S.tube('a2galv',[0,.14,-.03],[a*.55,.02,-.03-.25],.015,4),S.tube('a2galv',[0,.14,-.03],[a*.55,.02,.25],.015,4);}
function stopSign(S){S.tube('a2galv',[0,0,0],[0,2.75,0],.03,6);const r=.38,cy=2.3;for(let i=0;i<8;i++){const t0=PI/8+i*PI/4,t1=t0+PI/4,P=t=>[r*Math.cos(t),cy+r*Math.sin(t),.04],U=t=>[.5+.5/Math.cos(PI/8)*Math.cos(t)*.995,.5+.5/Math.cos(PI/8)*Math.sin(t)*.995];
  S.tri('a2stop',[0,cy,.04],P(t0),P(t1),[.5,.5],U(t0),U(t1),[0,0,1]);S.tri('a2galv',[0,cy,.035],P(t0).map((c,j)=>j===2?.035:c),P(t1).map((c,j)=>j===2?.035:c),[0,0],[1,0],[1,1],[0,0,-1]);}S.box('a2galv',-.05,.05,2.1,2.5,.005,.035);}
function nameSign(S){S.tube('a2galv',[0,0,0],[0,3.15,0],.035,6);S.box('a2name',.03,.95,2.95,3.14,-.008,.008,[[0,.5,1,1],[0,.5,1,1],[0,.5,.01,1],[0,.5,.01,1],[0,.5,1,.52],[0,.5,1,.52]]);
 S.box('a2name',-.008,.008,2.73,2.92,.03,.95,[[0,0,.01,.5],[0,0,.01,.5],[0,0,1,.5],[0,0,1,.5],[0,.48,1,.5],[0,.48,1,.5]]);}
function pedPole(S,lod){S.tube('a2galv',[0,0,0],[0,3.4,0],.075,lod?6:8);S.box('a2galv',-.14,.14,0,.06,-.14,.14);S.box('a2ped',-.23,.23,1.95,2.41,.08,.09,[[0,0,1,1],[0,0,0,0],[0,0,.02,1],[0,0,.02,1],[0,0,1,.02],[0,0,1,.02]]);
 S.box('a2rub',-.17,.17,2.6,3.05,.08,.38);S.box('a2rub',-.2,.2,2.58,2.6,.08,.42);S.box('a2galv',-.06,.06,1.1,1.3,.075,.13);}
// bus shelter 6 x 1.4 x 2.65, open towards the building (-z), glass back to the road, lightbox at the east end
function shelter(S,lod){const x0=-3,x1=3,z0=-.7,z1=.7,H=2.6,st=(a,b,c,d,e,f)=>S.box('a2stel',a,b,c,d,e,f,1.2);
 for(const x of[x0,x1])for(const z of[z0,z1])st(x-.05,x+.05,0,H,z-.05,z+.05);st(-.05,.05,0,H,z1-.05,z1+.05);
 st(x0-.15,x1+.15,H,H+.14,z0-.25,z1+.15);st(x0-.15,x1+.15,H+.14,H+.16,z0-.2,z1+.1);
 for(const[a,c]of[[x0+.05,-.05],[.05,x1-.05]]){S.box('a2glass',a,c,.12,H-.06,z1-.01,z1+.01,[0,0,1,1]);st(a,c,.08,.12,z1-.03,z1+.03);st(a,c,H-.1,H-.06,z1-.03,z1+.03);}
 S.box('a2glass',x0-.01,x0+.01,.12,H-.06,z0+.05,z1-.05,[0,0,1,1]);st(x0-.03,x0+.03,.08,.12,z0+.05,z1-.05);
 // lightbox: steel case, poster both faces
 st(x1-.08,x1+.08,.15,2.25,z0+.06,z1-.06);S.box('a2post',x1+.081,x1+.082,.3,2.1,z0+.16,z1-.16,[[0,0,0,0],[0,0,0,0],[0,0,1,1],[0,0,0,0],[0,0,0,0],[0,0,0,0]]);S.box('a2post',x1-.082,x1-.081,.3,2.1,z0+.16,z1-.16,[[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,1,1],[0,0,0,0],[0,0,0,0]]);
 // bench: four slats on two cantilever legs off the back posts
 for(let i=0;i<4;i++)st(x0+.6,x1-.6,.45,.48,z1-.5+i*.1,z1-.43+i*.1);if(!lod)for(const x of[x0+.9,x1-.9]){st(x-.03,x+.03,0,.45,z1-.45,z1-.39);st(x-.03,x+.03,.4,.45,z1-.5,z1-.05);}}
export function* brick144StreetTask(b,spec,lod){
 mats(b.mats);const S=new Q(),sd=spec.seed|0;
 // ---- cars along the kerb (nose west, right-hand parking): dark saloon, red hatch, silver sedan; white works van in the closed lane
 car(b,'saloon','car2_black',-15.6,18.25,-PI/2);car(b,'hatch','car3_red',-8.7,18.2,-PI/2);car(b,'sedan','car5_silver',-2.3,18.25,-PI/2);car(b,'van','car8',12.9,18.35,-PI/2);yield;
 // ---- poles, light, bush (west of the works)
 stopSign(S);S.flush(b,-14.1,0,16.0,0);b.circle(-14.1,16.0,.08);
 nameSign(S);S.flush(b,-10.7,0,15.95,0);b.circle(-10.7,15.95,.08);
 b.push(-9.7,0,16.05,-PI/2);P.addStreetLight(b,{height:8.6,arm:2.4});b.pop();b.circle(-9.7,16.05,.2);
 b.push(-28.5,0,16.05,-PI/2);P.addStreetLight(b,{height:8.6,arm:2.4});b.pop();b.circle(-28.5,16.05,.2);
 b.push(40,0,16.05,-PI/2);P.addStreetLight(b,{height:8.6,arm:2.4});b.pop();b.circle(40,16.05,.2);
 shrub131(b,-15.9,0,12.75,{seed:sd+5,w:1.5});shrub131(b,-16.9,0,12.7,{seed:sd+9,w:1.1});
 pedPole(S,lod);S.flush(b,9.4,0,16.05,PI);b.circle(9.4,16.05,.12);yield;
 // ---- young street trees in the strip behind the fence
 for(const[x,k]of[[15.2,0],[27.8,1]]){b.push(x,0,12.62,0);P.addStreetTree(b,{seed:sd*7+k*131+3,scale:.52});b.pop();b.circle(x,12.62,.15);}yield;
 // ---- bus shelter at the kerb, bin, plywood hoarding sheet against the fence
 shelter(S,lod);S.flush(b,22.6,0,15.6,0);b.solid(22.6,16.3,6,.12);b.solid(19.6,15.6,.12,1.4);b.solid(25.6,15.6,.16,1.4);
 bin(S,lod);S.flush(b,17.7,0,13.75,PI+.2);b.solid(17.7,13.75,.62,.75,.2);
 plySheet(S);S.flush(b,14.55,0,13.36,0);yield;
 // ---- temporary chain-link fence: sidewalk run z 13.25 (x 10..55.5), returns, and the lot's east/back/west sides
 const run=(xa,za,xb,zb2,step)=>{const L=Math.hypot(xb-xa,zb2-za),n=Math.max(1,Math.round(L/step)),ry=Math.atan2(-(zb2-za),xb-xa);
  for(let i=0;i<n;i++){const t=i/n;fence(S,L/n,lod);S.flush(b,xa+(xb-xa)*t,0,za+(zb2-za)*t,ry);}b.solid((xa+xb)/2,(za+zb2)/2,L,.12,ry);};
 run(10,12,10,13.25,2);run(10,13.25,55.5,13.25,3.5);yield;run(55.5,13.25,55.5,-12,3.6);run(55.5,-12,31,-12,3.5);run(31,-12,31,-4,3.6);yield;
 // dirt lot
 S.q('a2dirt',[31,.012,13.2],[55.5,.012,13.2],[55.5,.012,-12],[31,.012,-12],[[0,0],[24.5/6,0],[24.5/6,25.2/6],[0,25.2/6]],[0,1,0]);S.flush(b);
 // ---- lane closure: barriers along the parking lane edge, taper + Type III + cones at the west end
 for(let i=0;i<8;i++){barrier(S,i%2?'a2hdpw':'a2hdpe',lod);const x=9.55+i*1.86;S.flush(b,x,ROAD,19.95,(hsh(sd,i)-.5)*.05);}
 barrier(S,'a2hdpe',lod);S.flush(b,7.9,ROAD,19.4,.62);b.solid(13.2+3.9,19.95,8*1.86,.48);b.solid(7.9,19.4,1.8,.48,.62);
 barricade(S,lod);S.flush(b,6.3,ROAD,17.85,PI/2);b.solid(6.3,17.85,.5,2.4,PI/2);
 for(const[x,z]of[[5.2,19.6],[3.6,19.2],[2.0,18.8]]){cone(S,0,lod);S.flush(b,x,ROAD,z,hsh(x*10|0,3)*PI);b.circle(x,z,.17);}yield;
 // ---- in the lot: pipes on chocks, cone stacks, job box, plywood stack on dunnage, spare barriers
 for(const x of[37.4,42.6])S.box('a2plr',x-.08,x+.08,.012,.12,9.9,12.4,[.1,.1,.3,.2]);
 for(const[i,z,y]of[[0,10.45,0],[1,11.1,0],[2,11.75,0],[3,10.78,.56],[4,11.43,.56]]){pipe(S,6,.3,lod);S.flush(b,37,.42+y,z,(hsh(sd,40+i)-.5)*.06);}yield;
 for(const[k,x,z]of[[0,46.6,11.8],[1,47.4,11.2]]){for(let i=0;i<(k?3:5);i++)cone(S,i*.075,lod);S.flush(b,x,.012,z,k);b.circle(x,z,.2);}
 jobBox(S);S.flush(b,50.4,.012,11.7,.08);b.solid(50.4,11.7,1.25,.95,.08);
 for(const x of[34.4,35.6])S.box('a2plr',x-.05,x+.05,.012,.1,3.6,6.2,[.4,.4,.6,.45]);
 for(let i=0;i<6;i++){S.box(i===5?'a2plr':'a2ply',-1.22,1.22,.1+i*.018,.118+i*.018,-.61,.61,i===5?[[0,0,1,.02],[0,0,1,.02],[0,0,.02,1],[0,0,.02,1],[0,0,1,1],[0,0,1,1]]:[[0,0,1,.02],[0,.3,1,.32],[0,0,.02,1],[.5,0,.52,1],[0,0,1,1],[0,0,1,1]]);}S.flush(b,35,.012,4.9,PI/2+.04);b.solid(35,4.9,1.3,2.5);
 for(const[i,x]of[[0,45.6],[1,47.5]]){barrier(S,i?'a2hdpw':'a2hdpe',lod);S.flush(b,x,.012,6,.03*i);}b.solid(46.55,6,3.8,.5);
 // ---- the diamond work sign on the sidewalk past the lot, facing the traffic
 diamond(S,lod);S.flush(b,52.6,0,15.75,-.2);b.circle(52.6,15.75,.3);yield;
}
