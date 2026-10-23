// V145 M4 Maltose Market (麦芽糖市场) — stall hardware on the schoolyard (ref files/ref-1023-maltose-market.webp).
// Frame: block-local metres of capital block (1,-1), the same frame as maltose145.js (slab top y .15).
// Real-shape models, each with its own generated texture (bc/tools/maltose145_m4_assets.py -> assets/l11-v145):
//  pop-up peaked canopy tents (telescoping square legs, scissor trusses, rafters, sagging 4-panel roof + valance);
//  folding tables (rounded blow-moulded top with bead edge, U-legs, braces, foot caps) and draped tablecloths
//  (white / red / pink; skirts flare + fold at the corners); rolling garment rack (H feet, casters, chrome rail) with hung
//  Chinese jackets and sweaters (torso + hanging sleeves built from each garment's own silhouette, front + back cells);
//  chrome wire shelving rack on casters; yellow price cards + SALE card (curled cards, own backs); rugs hung on the
//  street / east fences (rug back = mirrored, darker). Placement from the photo camera (see version-history V145 M4).
// Colliders: tent legs, tables, racks. ?malt145=0 off (with the yard).
import * as T from './vendor/three.module.min.js';
const A=new URL('./assets/l11-v145/',import.meta.url).href,PI=Math.PI,Y0=.15;
function tex(n,srgb=true,rep=true){const t=new T.TextureLoader().load(A+n+'.webp?v=145d');if(srgb)t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;t.magFilter=T.NearestFilter;if(rep)t.wrapS=t.wrapT=T.RepeatWrapping;return t;}
const GARM=[{"n":"jk_white","cell":[0,0],"t":[0.323,0.686],"sh":0.127,"col":0.012,"hem":0.933,"asp":2.054,"sl":[{"j":[0.308,0.334],"c":[0.004,0.55],"jw":0.288,"cw":0.113},{"j":[0.7,0.338],"c":[0.996,0.554],"jw":0.281,"cw":0.117}]},{"n":"jk_red","cell":[1,0],"t":[0.316,0.685],"sh":0.122,"col":0.014,"hem":0.932,"asp":2.057,"sl":[{"j":[0.302,0.34],"c":[0.005,0.57],"jw":0.291,"cw":0.119},{"j":[0.699,0.346],"c":[0.995,0.57],"jw":0.291,"cw":0.119}]},{"n":"jk_navy","cell":[2,0],"t":[0.324,0.676],"sh":0.11,"col":0.012,"hem":0.931,"asp":2.089,"sl":[{"j":[0.311,0.308],"c":[0.005,0.461],"jw":0.285,"cw":0.132},{"j":[0.69,0.308],"c":[0.995,0.457],"jw":0.283,"cw":0.137}]},{"n":"jk_plum","cell":[3,0],"t":[0.324,0.681],"sh":0.147,"col":0.015,"hem":0.93,"asp":2.101,"sl":[{"j":[0.31,0.333],"c":[0.005,0.61],"jw":0.294,"cw":0.104},{"j":[0.695,0.333],"c":[0.995,0.586],"jw":0.29,"cw":0.114}]},{"n":"jk_black","cell":[0,2],"t":[0.327,0.675],"sh":0.106,"col":0.011,"hem":0.932,"asp":2.055,"sl":[{"j":[0.313,0.288],"c":[0.005,0.441],"jw":0.269,"cw":0.128},{"j":[0.689,0.289],"c":[0.995,0.438],"jw":0.274,"cw":0.136}]},{"n":"sw_burgundy","cell":[1,2],"t":[0.335,0.657],"sh":0.061,"col":0.019,"hem":0.932,"asp":1.978,"sl":[{"j":[0.322,0.234],"c":[0.004,0.645],"jw":0.268,"cw":0.093},{"j":[0.67,0.227],"c":[0.996,0.645],"jw":0.268,"cw":0.09}]},{"n":"sw_grey","cell":[2,2],"t":[0.35,0.651],"sh":0.059,"col":0.038,"hem":0.932,"asp":2.083,"sl":[{"j":[0.338,0.243],"c":[0.005,0.65],"jw":0.264,"cw":0.081},{"j":[0.663,0.245],"c":[0.995,0.645],"jw":0.264,"cw":0.081}]},{"n":"sw_mustard","cell":[3,2],"t":[0.345,0.656],"sh":0.13,"col":0.011,"hem":0.931,"asp":2.093,"sl":[{"j":[0.333,0.301],"c":[0.005,0.477],"jw":0.273,"cw":0.121},{"j":[0.668,0.301],"c":[0.995,0.484],"jw":0.273,"cw":0.122}]}];
const SIGN=[{"n":"sign_each","asp":1.329},{"n":"sign_range","asp":0.991},{"n":"sign_all10","asp":0.791},{"n":"sign_sale","asp":1.447},{"n":"sign_3for","asp":1.349}];
const RUG=[{"n":"rug1","asp":0.666},{"n":"rug2","asp":0.271},{"n":"rug3","asp":0.591},{"n":"rug4","asp":0.781},{"n":"rug5","asp":0.66}];
let M=null;
function addMats(m){if(m.m145canvas)return;if(!M){const S=(o)=>new T.MeshStandardMaterial({metalness:0,roughness:1,vertexColors:true,...o});
 const tile=(n,o={})=>S({map:tex(n),normalMap:tex(n+'-n',false),roughnessMap:tex(n+'-r',false),...o});
 M={m145canvas:tile('canvas145',{side:T.DoubleSide}),m145canvg:tile('canvas145',{side:T.DoubleSide,color:0xc9dcc0}),
  m145ttop:tile('tabtop145'),m145clw:tile('clw145',{side:T.DoubleSide}),m145clr:tile('clr145',{side:T.DoubleSide}),m145clp:tile('clp145',{side:T.DoubleSide}),
  m145tst:tile('tsteel145',{metalness:.2}),m145dst:tile('dsteel145',{metalness:.45}),m145chr:tile('chrome145',{metalness:.85}),
  m145wire:S({map:tex('wire145'),metalness:.8,roughness:.35,alphaTest:.5,side:T.DoubleSide}),
  m145garm:S({map:tex('garm145',true,false),normalMap:tex('garm145-n',false,false),roughnessMap:tex('garm145-r',false,false),alphaTest:.5,side:T.DoubleSide}),
  m145sign:S({map:tex('sign145',true,false),normalMap:tex('sign145-n',false,false),roughness:.75,alphaTest:.5,side:T.DoubleSide}),
  m145rug:S({map:tex('rug145',true,false),normalMap:tex('rug145-n',false,false),roughness:1,alphaTest:.5,side:T.DoubleSide})};
 for(const[k,v]of Object.entries(M))v.name='V145 '+k;}Object.assign(m,M);}
// ---- indexed soup: every grid keeps its own vertices (smooth normals inside a grid, hard edges between grids)
class G{constructor(){this.p={};this.f=null;}
 at(x,z,ry){this.f={x,z,c:Math.cos(ry),s:Math.sin(ry)};return this;}   // local placement frame (three.js ry convention)
 X(v){const f=this.f;if(!f)return v;return[f.x+v[0]*f.c+v[2]*f.s,v[1],f.z-v[0]*f.s+v[2]*f.c];}
 grid(key,nu,nv,P,UV,tone=1){const s=this.p[key]||(this.p[key]={pos:[],uv:[],col:[],idx:[]}),b=s.pos.length/3;
  for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){const u=i/nu,v=j/nv;s.pos.push(...this.X(P(u,v)));s.uv.push(...UV(u,v));const t=typeof tone==='function'?tone(u,v):tone;s.col.push(t,t,t);}
  for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const a=b+j*(nu+1)+i,c=a+nu+1;s.idx.push(a,a+1,c+1,a,c+1,c);}}
 quad(key,a,b,c,d,uv=[[0,0],[1,0],[1,1],[0,1]],tone=1){const L=(p,q,t)=>p.map((x,k)=>x+(q[k]-x)*t);
  this.grid(key,1,1,(u,v)=>L(L(a,b,u),L(d,c,u),v),(u,v)=>L(L(uv[0],uv[1],u),L(uv[3],uv[2],u),v),tone);}
 // round tube a->b (n sides, smooth) or square tube (sq: 4 flat faces); uv u around (metres / tu), v along (metres / tv)
 tube(key,a,b,r,n=6,tu=.3,tv=.6,sq=false,tone=1){const A=new T.Vector3(...a),B=new T.Vector3(...b),d=B.clone().sub(A),L=d.length();if(L<1e-5)return;d.normalize();
  const ref=Math.abs(d.y)<.9?new T.Vector3(0,1,0):new T.Vector3(1,0,0),e1=new T.Vector3().crossVectors(d,ref).normalize(),e2=new T.Vector3().crossVectors(d,e1);
  const R=(P,t)=>P.clone().addScaledVector(e1,Math.cos(t)*r).addScaledVector(e2,Math.sin(t)*r).toArray(),C=2*PI*r/tu;
  if(sq){for(let k=0;k<4;k++){const t0=PI/4+k*PI/2,t1=t0+PI/2,rr=r*Math.SQRT2;const Q=(P,t)=>P.clone().addScaledVector(e1,Math.cos(t)*rr).addScaledVector(e2,Math.sin(t)*rr).toArray();
    this.quad(key,Q(A,t0),Q(A,t1),Q(B,t1),Q(B,t0),[[k*r*2/tu,0],[(k+1)*r*2/tu,0],[(k+1)*r*2/tu,L/tv],[k*r*2/tu,L/tv]],tone);}return;}
  this.grid(key,n,1,(u,v)=>R(v?B:A,u*2*PI),(u,v)=>[u*C,v*L/tv],tone);}
 cap(key,c,r,n=8,y=0,tone=1){this.grid(key,n,1,(u,v)=>[c[0]+Math.cos(u*2*PI)*r*v,c[1]+y,c[2]+Math.sin(u*2*PI)*r*v],(u,v)=>[.5+Math.cos(u*2*PI)*v*.5,.5+Math.sin(u*2*PI)*v*.5],tone);}
 cyl(key,c,r,h,n=8,tu=.3,tv=.3,tone=1){this.tube(key,c,[c[0],c[1]+h,c[2]],r,n,tu,tv,false,tone);this.cap(key,c,r,n,h,tone);}
 box(key,c,w,h,d,tile=.5,tone=1){const[x,y,z]=c,X0=x-w/2,X1=x+w/2,Y1=y+h,Z0=z-d/2,Z1=z+d/2,U=(a,b)=>[[0,0],[a/tile,0],[a/tile,b/tile],[0,b/tile]];
  this.quad(key,[X0,y,Z1],[X1,y,Z1],[X1,Y1,Z1],[X0,Y1,Z1],U(w,h),tone);this.quad(key,[X1,y,Z0],[X0,y,Z0],[X0,Y1,Z0],[X1,Y1,Z0],U(w,h),tone);
  this.quad(key,[X1,y,Z1],[X1,y,Z0],[X1,Y1,Z0],[X1,Y1,Z1],U(d,h),tone);this.quad(key,[X0,y,Z0],[X0,y,Z1],[X0,Y1,Z1],[X0,Y1,Z0],U(d,h),tone);
  this.quad(key,[X0,Y1,Z1],[X1,Y1,Z1],[X1,Y1,Z0],[X0,Y1,Z0],U(w,d),tone);this.quad(key,[X0,y,Z0],[X1,y,Z0],[X1,y,Z1],[X0,y,Z1],U(w,d),tone*.8);}
 flush(b){for(const[k,s]of Object.entries(this.p)){if(!s.idx.length)continue;const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(s.pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(s.uv,2));
  g.setIndex(s.idx);g.computeVertexNormals();const tone=s.col;const gg=g.toNonIndexed();g.dispose();b.add(gg,k,0,0,0);
  // urban-batch.add writes its own vertex colour (tone .9-1 from the normal); fold our per-vertex tone (rug backs, table undersides) in
  const parts=b.parts.get(k),last=parts[parts.length-1],c=last.attributes.color,ix=s.idx;for(let i=0;i<ix.length;i++){const t=tone[ix[i]*3];c.setXYZ(i,c.getX(i)*t,c.getY(i)*t,c.getZ(i)*t);}
  gg.dispose();}this.p={};}
}
const hash=(i)=>{let x=Math.sin(i*127.1+311.7)*43758.5453;return x-Math.floor(x);};
// ---------------- pop-up peaked canopy tent, 3 x 3 m (legs 1.45 out, eave 2.15, peak 2.95)
function tent(g,b,x,z,ry,{key='m145canvas',lod=false}={}){g.at(x,z,ry);const h=1.45,E=Y0+2.15,P=Y0+2.95,o=1.52;
 const C=[[-h,-h],[h,-h],[h,h],[-h,h]];
 for(const[cx,cz]of C){g.tube('m145tst',[cx,Y0+.008,cz],[cx,Y0+1.3,cz],.019,4,.3,.6,true);g.tube('m145tst',[cx,Y0+1.25,cz],[cx,E,cz],.015,4,.3,.6,true);
  g.box('m145dst',[cx,Y0,cz],.13,.008,.13,.3);if(!lod){g.box('m145tst',[cx,E-.5,cz],.055,.07,.055,.3);g.box('m145dst',[cx,Y0+1.25,cz],.05,.04,.05,.3);}}   // slider + height clamp
 for(let k=0;k<4;k++){const[a0,b0]=C[k],[a1,b1]=C[(k+1)%4],L=(t,y)=>[a0+(a1-a0)*t,y,b0+(b1-b0)*t];
  g.tube('m145tst',L(0,E),L(1,E),.011,4,.2,.5,true);
  if(!lod)for(const[t0,t1]of[[0,.5],[.5,1]]){g.tube('m145tst',L(t0,E),L(t1,E-.42),.008,4,.15,.4,true);g.tube('m145tst',L(t0,E-.42),L(t1,E),.008,4,.15,.4,true);}}
 // rafters: corner -> hub; centre post hub -> peak
 for(const[cx,cz]of C)g.tube('m145tst',[cx,E+.02,cz],[cx*.08,P-.12,cz*.08],.01,4,.2,.5,true);
 g.tube('m145tst',[0,P-.45,0],[0,P-.03,0],.014,4,.2,.4,true);
 // roof: four panels, edge (u along) -> peak (v), slight sag between hips, overhang o beyond the legs
 const pk=[0,P,0],SG=lod?3:8;
 for(let k=0;k<4;k++){const c0=[[-o,-o],[o,-o],[o,o],[-o,o]][k],c1=[[-o,-o],[o,-o],[o,o],[-o,o]][(k+1)%4];
  g.grid(key,SG,SG,(u,v)=>{const ex=c0[0]+(c1[0]-c0[0])*u,ez=c0[1]+(c1[1]-c0[1])*u,sag=.07*Math.sin(PI*u)*Math.sin(PI*Math.min(1,v*1.15));return[ex*(1-v),E+.03+(P-E-.03)*v-sag,ez*(1-v)];},
   (u,v)=>[(u-.5)*2*o*(1-v)/1.5,v*Math.hypot(o,P-E)/1.5]);
  // valance: 0.26 m skirt, faint wave
  g.grid(key,SG,1,(u,v)=>{const ex=c0[0]+(c1[0]-c0[0])*u,ez=c0[1]+(c1[1]-c0[1])*u,f=1+.004*v+.006*Math.sin(u*PI*6)*v;return[ex*f,E+.03-v*.26,ez*f];},(u,v)=>[u*2*o/1.5,-v*.26/1.5]);}
 for(const[cx,cz]of C){const q=g.X([cx,0,cz]);b.circle(q[0],q[2],.06);}
 g.f=null;}
// ---------------- folding table: rounded HDPE top (bead edge), U-legs, braces, rails; optional draped cloth
function rrect(L,W,r,n=4){const P=[],hl=L/2-r,hw=W/2-r;for(const[cx,cz,a0]of[[hl,hw,0],[-hl,hw,PI/2],[-hl,-hw,PI],[hl,-hw,3*PI/2]])for(let i=0;i<=n;i++){const a=a0+i/n*PI/2;P.push([cx+Math.cos(a)*r,cz+Math.sin(a)*r,a]);}return P;}
function table(g,b,x,z,ry,{len=1.83,cloth=null,drop=.55,lod=false,seed=1}={}){g.at(x,z,ry);const W=.76,Ht=Y0+.74,th=.045,O=rrect(len,W,.05,lod?2:4),N=O.length;
 // top: fan (top + underside) and the bead edge as 3 rings
 const fan=(y,s,tone)=>g.grid('m145ttop',N,1,(u,v)=>{const p=O[Math.round(u*N)%N];return[p[0]*v,y,p[1]*v*s];},(u,v)=>{const p=O[Math.round(u*N)%N];return[p[0]*v/.8,p[1]*v/.8];},tone);
 fan(Ht,1,1);fan(Ht-th,-1,.6);
 const ring=[[0,-.004],[.006,-.015],[.004,-.034],[-.01,-th]];
 g.grid('m145ttop',N,ring.length-1,(u,v)=>{const p=O[Math.round(u*N)%N],q=ring[Math.round(v*(ring.length-1))];const l=Math.hypot(p[0],p[1])||1;return[p[0]+Math.cos(p[2])*q[0],Ht+q[1],p[1]+Math.sin(p[2])*q[0]];},(u,v)=>[u*2*(len+W)/.8,v*.06],.92);
 // under-frame: two side rails + legs (folded-out U) + diagonal braces + foot caps
 const yb=Ht-th,ix=len/2-.16,iz=W/2-.06;
 for(const s of[-1,1])g.tube('m145dst',[-len/2+.08,yb-.012,s*iz],[len/2-.08,yb-.012,s*iz],.012,4,.2,.5,true);
 if(!lod)for(const sx of[-1,1]){const fx=sx*(ix+.05);for(const s of[-1,1]){g.tube('m145dst',[sx*ix,yb-.02,s*(iz-.03)],[fx,Y0+.02,s*(iz-.02)],.0125,6,.12,.5);g.cyl('m145dst',[fx,Y0,s*(iz-.02)],.017,.025,6,.1,.1,.5);}
  g.tube('m145dst',[sx*(ix+.04),Y0+.14,-(iz-.02)],[sx*(ix+.04),Y0+.14,iz-.02],.011,6,.12,.5);
  g.tube('m145dst',[sx*(ix+.02),Y0+.38,0],[sx*.12,yb-.025,0],.009,6,.1,.5);g.tube('m145dst',[sx*ix,Y0+.38,-(iz-.03)],[sx*ix,Y0+.38,iz-.03],.009,6,.1,.5);}
 if(cloth){const key={w:'m145clw',r:'m145clr',p:'m145clp'}[cloth],OC=rrect(len+.03,W+.03,.06,lod?2:5),NC=OC.length;let per=[0];for(let i=1;i<=NC;i++){const a=OC[(i-1)%NC],c=OC[i%NC];per.push(per[i-1]+Math.hypot(c[0]-a[0],c[1]-a[1]));}
  const cw=(p)=>{const dx=Math.abs(p[0])-(len/2-.12),dz=Math.abs(p[1])-(W/2-.12);return Math.max(0,Math.min(1,Math.min(dx,dz)/.12+1));};   // corner weight
  g.grid(key,NC,1,(u,v)=>{const p=OC[Math.round(u*NC)%NC];return[p[0]*v,Ht+.004,p[1]*v];},(u,v)=>{const p=OC[Math.round(u*NC)%NC];return[p[0]*v/.6,p[1]*v/.6];});
  const NV=lod?2:6,ph=hash(seed)*6;
  g.grid(key,NC,NV,(u,v)=>{const i=Math.round(u*NC)%NC,p=OC[i],w=cw(p),s=per[Math.round(u*NC)];const t=Math.pow(v,1.15);
   const off=.004+t*(.012+.11*w)+w*t*.03*Math.sin(s/.07+ph)+(1-w)*t*.008*Math.sin(s/.19+ph);
   return[p[0]+Math.cos(p[2])*off,Ht+.002-Math.sin(v*PI/2)*.03-t*(drop-.03)-w*t*.06,p[1]+Math.sin(p[2])*off];},(u,v)=>[per[Math.round(u*NC)]/.6,-v*drop/.6]);}
 b.solid(...(()=>{const q=g.X([0,0,0]);return[q[0],q[2]];})(),len+.04,W+.04,ry);g.f=null;}
// ---------------- hung garment built from its flat-lay silhouette (GARM table); hook at the local origin, faces +z
function garment(g,i,W,{sw=false}={}){const D=GARM[i],[ci,ri]=D.cell,tw=D.t[1]-D.t[0],sU=W/tw,sV=sU/D.asp,uc=(D.t[0]+D.t[1])/2,dep=sw?.05:.055;
 const AU=(u,back)=>(ci+(back?1-u:u))/4,AV=(v,back)=>1-(ri+(back?1:0)+v)/8,yS=-.07;
 const Y=(v)=>yS-(v-D.sh)*sV;
 for(const back of[0,1]){const sg=back?-1:1;
  g.grid('m145garm',10,12,(a,c)=>{const u=D.t[0]-.012+(tw+.024)*a,v=D.col+(D.hem+.03-D.col)*c,xx=(u-uc)/(tw/2+.012),bulge=Math.sqrt(Math.max(0,1-xx*xx));
   return[(u-uc)*sU*(1-.04*c),Y(v),sg*(.006+dep*bulge*(.6+.4*Math.sin(Math.min(1,c*1.4)*PI/2)))];},(a,c)=>{const u=D.t[0]-.012+(tw+.024)*a,v=D.col+(D.hem+.03-D.col)*c;return[AU(u,back),AV(v,back)];});}
 // sleeves hang beside the torso, flat width from the strip across the sleeve in the flat lay
 for(const s of D.sl){const side=s.j[0]<uc?-1:1,J=[s.j[0]*D.asp,s.j[1]],Cc=[s.c[0]*D.asp,s.c[1]],dx=Cc[0]-J[0],dy=Cc[1]-J[1],Ln=Math.hypot(dx,dy),pe=[-dy/Ln,dx/Ln];
  const Lm=Ln*sV,wj=s.jw*sV*.92,x0=side*(W/2-wj*.18),y0=Y(s.j[1])+.02;
  for(const back of[0,1])g.grid('m145garm',4,8,(a,t)=>{const w=(s.jw+(s.cw-s.jw)*t)*sV*.92,th=(back?PI:0)+a*PI;return[x0+side*(.03*t)-Math.cos(th)*w/2*side,y0-t*Lm*.97,.022+.012*t+Math.sin(th)*.045];},
   (a,t)=>{const w=(s.jw+(s.cw-s.jw)*t)*.9,cc=(a*2-1)*(back?-1:1),px=J[0]+dx*t+pe[0]*cc*w/2,py=J[1]+dy*t+pe[1]*cc*w/2;return[AU(px/D.asp,back),AV(py,back)];});}
 // hanger: hook + shoulder bar
 const hk=[];for(let k=0;k<=6;k++){const a=k/6*PI*1.3;hk.push([Math.sin(a)*.022,.035+(1-Math.cos(a))*.022*.9,0]);}
 for(let k=0;k<6;k++)g.tube('m145chr',hk[k],hk[k+1],.002,3,.02,.05);g.tube('m145chr',[0,0,0],[0,.035,0],.0025,3,.02,.05);
 g.tube('m145dst',[-W*.46,yS+.012,0],[0,0,0],.004,4,.05,.2);g.tube('m145dst',[W*.46,yS+.012,0],[0,0,0],.004,4,.05,.2);g.tube('m145dst',[-W*.46,yS+.012,0],[W*.46,yS+.012,0],.003,4,.05,.2);}
// local sub-frame for a garment inside an already placed object frame
function sub(g,ox,oy,oz,ry,fn){const f=g.f,c=Math.cos(ry),s=Math.sin(ry),saved=g.X.bind(g);g.X=(v)=>{const lx=ox+v[0]*c+v[2]*s,lz=oz-v[0]*s+v[2]*c;return saved([lx,v[1]+oy,lz]);};fn();g.X=saved;}
// ---------------- rolling garment rack: rail along local x (length 1.5, height 1.65), garments hang across it (facing +-x)
function garmentRack(g,b,x,z,ry,list,{lod=false}={}){g.at(x,z,ry);const L=1.5,H=Y0+1.5,hd=.26;
 for(const sx of[-1,1]){const ex=sx*L/2;g.tube('m145chr',[ex,Y0+.09,-hd],[ex,Y0+.09,hd],.014,6,.12,.5);
  for(const s of[-1,1]){g.tube('m145dst',[ex-.0125,Y0+.035,s*(hd-.03)],[ex+.0125,Y0+.035,s*(hd-.03)],.035,8,.2,.2);g.tube('m145chr',[ex,Y0+.07,s*(hd-.03)],[ex,Y0+.09,s*(hd-.03)],.008,4,.05,.1);}
  g.tube('m145chr',[ex,Y0+.09,0],[ex,H,0],.0125,6,.08,.6);g.cyl('m145chr',[ex,Y0+1.05,0],.018,.05,6);}
 g.tube('m145chr',[-L/2-.05,H,0],[L/2+.05,H,0],.0125,6,.08,.6);if(!lod)g.tube('m145chr',[-L/2,Y0+.3,0],[L/2,Y0+.3,0],.011,6,.08,.6);
 const n=list.length,sp=(L-.16)/Math.max(1,n-1);
 if(!lod)list.forEach((gi,k)=>{const gx=-L/2+.08+k*sp,r2=k===n-1?-PI/2+.35:(hash(k*7+x)-.5)*.8;sub(g,gx,H-.04,0,PI/2+r2,()=>garment(g,gi,GARM[gi].n.startsWith('sw')?.47:.5,{sw:GARM[gi].n.startsWith('sw')}));});
 const q=g.X([0,0,0]);b.solid(q[0],q[2],L+.1,.6,ry);g.f=null;}
// ---------------- chrome wire shelving on casters (1.22 x 0.46, 4 shelves)
function wireRack(g,b,x,z,ry,{lod=false}={}){g.at(x,z,ry);const w=.61,d=.23,H=Y0+1.75,sh=[.22,.68,1.14,1.6];
 for(const[cx,cz]of[[-w,-d],[w,-d],[w,d],[-w,d]]){g.tube('m145chr',[cx,Y0+.11,cz],[cx,H,cz],.0127,6,.08,.4);g.tube('m145dst',[cx-.012,Y0+.05,cz],[cx+.012,Y0+.05,cz],.048,8,.2,.2);g.box('m145chr',[cx,Y0+.09,cz],.04,.02,.04,.2);}
 for(const yy of sh){const y=Y0+yy;g.quad('m145wire',[-w,y,d],[w,y,d],[w,y,-d],[-w,y,-d],[[0,0],[2*w/.25,0],[2*w/.25,2*d/.25],[0,2*d/.25]]);
  const R=[[-w,y,-d],[w,y,-d],[w,y,d],[-w,y,d]];for(let k=0;k<4;k++)g.tube('m145chr',R[k],R[(k+1)%4],.005,4,.04,.3);
  if(!lod)for(const s of[-1,1]){const zz=s*d;for(let k=0;k<8;k++){const x0=-w+k*w/4,x1=x0+w/4;g.tube('m145chr',[x0,y-(k%2?0:.04),zz],[x1,y-(k%2?.04:0),zz],.003,3,.03,.2);}g.tube('m145chr',[-w,y-.04,zz],[w,y-.04,zz],.003,3,.03,.2);}
  for(const[cx,cz]of[[-w,-d],[w,-d],[w,d],[-w,d]])g.tube('m145chr',[cx,y-.03,cz],[cx,y+.005,cz],.02,6,.06,.1);}
 const q=g.X([0,0,0]);b.solid(q[0],q[2],2*w+.06,2*d+.06,ry);g.f=null;}
// ---------------- sign card: curled grid, front cell i (top row) / back cell (bottom row); centre c, width w, normal yaw ry, roll rz
function sign(g,i,c,w,ry,{rz=0,curl=.03}={}){const h=w/SIGN[i].asp,cs=Math.cos(ry),sn=Math.sin(ry),cr=Math.cos(rz),sr=Math.sin(rz);
 for(const back of[0,1])g.grid('m145sign',5,5,(u,v)=>{const lx=(u-.5)*w,ly=(v-.5)*h,lz=curl*(Math.pow(2*u-1,2)+.6*Math.pow(1-v,3)*u)*(back?1:1)-(back?.0015:0),rx=lx*cr-ly*sr,rY=lx*sr+ly*cr;
  return[c[0]+rx*cs+lz*sn,c[1]+rY,c[2]-rx*sn+lz*cs];},(u,v)=>[(i+(back?1-u:u))/5,(back?0:.5)+v*.5]);}
// ---------------- rug hung from a fence top: width from the rug's aspect, height hgt, slight folds; front faces n (yaw ry)
function rug(g,i,cx,ytop,cz,ry,hgt){const w=hgt*RUG[i].asp,cs=Math.cos(ry),sn=Math.sin(ry),ph=hash(i*3)*6;
 for(const back of[0,1])g.grid('m145rug',8,10,(u,v)=>{const lx=(u-.5)*w,y=ytop-v*hgt,lz=.02+.035*Math.sin(u*PI*3+ph)*Math.pow(v,1.3)+.04*v*v-(back?.006:0);return[cx+lx*cs+lz*sn,y,cz-lx*sn+lz*cs];},
  (u,v)=>[(i+(back?1-u:u))/5,1-v],back?.5:1);
 for(const t of[.08,.5,.92])g.box('m145dst',[cx+(t-.5)*w*cs,ytop-.02,cz-(t-.5)*w*sn],.04,.05,.04,.2);}
// ---------------- the market layout (block-local metres; photo camera at (78, 1.7, 62) looking -z, 12 deg right)
const RF=-12*PI/180;   // "faces the photo camera"
export function* maltose145StallsTask(b,lod){addMats(b.mats);const g=new G();
 // tents (photo: six+ white peaked canopies behind the stalls, one pale green)
 const TENTS=[[74.4,37.4,RF],[79.6,30.2,RF],[84.6,15.6,RF+.05],[84.9,32.2,RF],[88.3,24.8,RF-.1,'m145canvg'],[65.2,19.5,RF],[68.6,29.6,RF+.1],[71.6,16.2,RF]];
 for(const[x,z,r,k]of TENTS)tent(g,b,x,z,r,{key:k||'m145canvas',lod});yield;
 // tables: near row, mid row, left row (along z), right row, one under each tent
 const TB=[[76.2,58.7,RF*.3,2.44,'w'],[78.55,58.75,RF*.6,1.83,null],[80.45,58.3,RF,1.83,'p'],
  [76.2,57.1,RF*.5,1.83,'w'],[78.1,57.15,RF*.5,1.83,'w'],[78.35,52.95,RF,1.83,'r'],[75.6,50.0,RF,1.83,'r'],[77.5,48.9,RF,1.83,'p'],[80.6,47.6,RF,2.44,'w'],[86.2,47.9,RF,1.83,'r'],[82.75,49.4,RF,1.83,'w'],[83.3,55.2,RF-.25,1.83,null],[86.5,50.6,RF,1.83,'w'],[87.1,52.9,RF-.4,1.83,null],
  [88.6,46.2,PI/2,2.44,'w'],[88.6,43.4,PI/2,2.44,'r']];
 for(let k=0;k<7;k++)TB.push([73.9,53.6-k*2.52,PI/2,2.44,['w','r','w',null,'w','r','p'][k]]);
 for(const[x,z,r]of TENTS){const c=Math.cos(r),s=Math.sin(r);TB.push([x,z+.7,r,1.83,['w',null,'r','w','p','w','r','w'][TB.length%8]]);TB.push([x-.8*s+1.05*c,z-.8*c-1.05*s,r+PI/2,1.83,['r','w',null,'w','w','p','w','r'][TB.length%8]]);}
 TB.forEach(([x,z,r,l,c],k)=>table(g,b,x,z,r,{len:l,cloth:c,seed:k,lod,drop:c==='p'?.62:.55}));yield;
 // garment rack (Chinese jackets + sweaters; the white embroidered jacket faces the aisle) and the chrome wire rack
 garmentRack(g,b,79.9,54.0,RF+.12,[1,5,2,3,6,4,7,1,2,0],{lod});
 wireRack(g,b,84.0,50.4,RF,{lod});yield;
 // signs: $5 EACH on a stake behind the brass table, $2-$8 diamond on the rack end, ALL $10 taped on the rack upright,
 // 3 FOR $10 on the right white table, SALE on the wire rack's top shelf
 if(!lod){g.tube('m145dst',[78.0,Y0+.74,52.72],[78.0,Y0+1.3,52.72],.005,4,.05,.3);sign(g,0,[78.0,Y0+1.4,52.75],.36,RF);
  const rq=(lx,ly,lz)=>{const c=Math.cos(RF+.12),s=Math.sin(RF+.12);return[79.9+lx*c+lz*s,Y0+ly,54.0-lx*s+lz*c];};
  sign(g,1,rq(.8,1.67,0),.3,RF,{rz:PI/4,curl:.01});g.tube('m145dst',rq(.76,1.5,0),rq(.8,1.56,0),.002,3,.02,.1);
  sign(g,2,rq(.77,1.1,.03),.2,RF+.3,{curl:.015});
  sign(g,4,[83.0,Y0+.62,55.62],.26,RF-.25,{curl:.01});
  sign(g,3,[84.0,Y0+1.69,50.45],.22,RF,{rz:.05,curl:.02});}
 // rug wall: on the street fence by the east corner, then along the east fence (photo: hung from ~3.8 m down)
 rug(g,0,97.9,3.95,12.62,0,3.3);rug(g,2,95.6,3.85,12.62,0,2.7);
 for(const[i,zz,yt,hh]of[[1,13.35,3.75,3.1],[3,15.05,3.65,2.5],[4,17.35,3.6,2.6]])rug(g,i,99.45,yt,zz,-PI/2,hh);
 g.flush(b);yield;}
