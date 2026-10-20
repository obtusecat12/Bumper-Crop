// V137 Q2 (notes/spec-1020-crowd-quality.md): modelled hair for the capital crowd (crowd135.js tiers A/B, sprite bake).
// Each style is a separate low-poly shell fitted to the head mesh of one body type (front photo mesh + head130 rear band,
// ears excluded) by casting rays from the head centre: cap rows from the hairline up to the crown, offset outward by the
// style's thickness, and a lip strip at the hairline back down to the scalp so the hair has visible thickness. Long styles
// add a hanging curtain (outer + inner sheet + bottom/side lips); ponytail = tapered tube, bun = small knot. Geometry is in
// the head-bone bind frame (same frame as the bin's head mesh), indexed, uv = hair137.png (grey strands, tinted per person,
// RepeatWrapping in both axes). Styles in HAIR137_STYLES order; the shader picks one per instance (iCells.z = style + 1).
export const HAIR137_STYLES=['crop','side','curly','bald','bob','long','pony','bun'];
// faces (crowd135 CROWD135_FACES keys) -> style; f8 wears a headscarf (no hair mesh)
export const HAIR137_FACE={m1:'crop',m2:'crop',m3:'side',m4:'curly',m5:'bald',m6:'side',m7:'side',m8:'crop',m9:'side',
 f1:'long',f2:'pony',f3:'long',f4:'curly',f5:'bob',f6:'bun',f7:'long',f8:null,f9:'long',c1:'crop',c2:'bob',c3:'long',c4:'bob',c5:'long',c6:'crop'};
export const HAIR137_HIDES_EARS=s=>s==='bob'||s==='long';
const D2R=Math.PI/180,NP=16;
const h32=(a,b)=>{let h=Math.imul(a|0,0x27d4eb2d)^Math.imul(b|0,0x165667b1);h^=h>>>15;h=Math.imul(h,0x85ebca6b);h^=h>>>13;return((h^(h>>>16))>>>0)/4294967296;};

// head fit: triangles of the given geometries (non-indexed; skip(i) drops a triangle, e.g. the ears)
function headFit(geos){const T=[];let y0=1e9,y1=-1e9,sx=0,sz=0,n=0,zmin=1e9,zmax=-1e9;
 for(const[g,skip]of geos){const p=g.attributes.position;for(let i=0;i+2<p.count;i+=3){if(skip&&skip(i))continue;
  const t=[0,1,2].map(k=>[p.getX(i+k),p.getY(i+k),p.getZ(i+k)]);T.push(t);for(const q of t){y0=Math.min(y0,q[1]);y1=Math.max(y1,q[1]);sx+=q[0];sz+=q[2];n++;zmin=Math.min(zmin,q[2]);zmax=Math.max(zmax,q[2]);}}}
 const H=y1-y0,C=[sx/n,y0+.55*H,(zmin+(zmax-.018*H/.245))/2];
 const ray=(o,d)=>{let best=-1;for(const[a,b,c]of T){const e1=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],e2=[c[0]-a[0],c[1]-a[1],c[2]-a[2]];
   const p=[d[1]*e2[2]-d[2]*e2[1],d[2]*e2[0]-d[0]*e2[2],d[0]*e2[1]-d[1]*e2[0]],det=e1[0]*p[0]+e1[1]*p[1]+e1[2]*p[2];if(Math.abs(det)<1e-12)continue;
   const iv=1/det,s=[o[0]-a[0],o[1]-a[1],o[2]-a[2]],u=(s[0]*p[0]+s[1]*p[1]+s[2]*p[2])*iv;if(u<-1e-4||u>1+1e-4)continue;
   const q=[s[1]*e1[2]-s[2]*e1[1],s[2]*e1[0]-s[0]*e1[2],s[0]*e1[1]-s[1]*e1[0]],v=(d[0]*q[0]+d[1]*q[1]+d[2]*q[2])*iv;if(v<-1e-4||u+v>1+1e-4)continue;
   const t=(e2[0]*q[0]+e2[1]*q[1]+e2[2]*q[2])*iv;if(t>best)best=t;}return best;};
 const dirOf=(ph,el)=>[Math.sin(ph)*Math.cos(el),Math.sin(el),Math.cos(ph)*Math.cos(el)];
 const rCache=new Map();
 // scalp radius from C along (phi, elevation)
 const rad=(ph,el)=>{const k=Math.round(ph*1e4)+','+Math.round(el*1e4);let r=rCache.get(k);if(r===undefined){r=ray(C,dirOf(ph,el));if(r<0)r=.08*H/.245;rCache.set(k,r);}return r;};
 const at=(ph,el,t=0)=>{const d=dirOf(ph,el),r=rad(ph,el)+t;return[C[0]+d[0]*r,C[1]+d[1]*r,C[2]+d[2]*r];};
 // horizontal scalp radius at height y (from the vertical axis through C)
 const radH=(ph,y)=>{if(y<y0||y>y1)return 0;const r=ray([C[0],y,C[2]],[Math.sin(ph),0,Math.cos(ph)]);return Math.max(0,r);};
 // elevation whose scalp point sits at head fraction h
 const elOfH=(ph,h)=>{const yt=y0+h*H;let lo=-70*D2R,hi=88*D2R;for(let i=0;i<22;i++){const m=(lo+hi)/2;if(at(ph,m)[1]<yt)lo=m;else hi=m;}return(lo+hi)/2;};
 return{C,y0,y1,H,rad,at,radH,elOfH,dirOf};}

// hairline as head fraction: front F, sides S (above the ear), back B; phi 0 = face (+z)
const hl=(F,S,B,e=1.6)=>ph=>{const c=Math.cos(ph);return c>0?S+(F-S)*c**e:S+(B-S)*(-c)**1.1;};
const STY={
 crop:{line:hl(.80,.64,.34),t:.010,top:.003},
 side:{line:ph=>hl(Math.sin(ph)>0?.83:.78,.64,.34)(ph),t:.013,top:.009,lean:.006},
 curly:{line:hl(.79,.64,.36),t:.019,top:.008,noise:.006,curly:1},
 bald:{band:[hl(0,.42,.32),hl(0,.60,.56)],from:58,t:.004},
 bob:{line:hl(.83,.52,.36,4),t:.015,top:.006,curtain:{from:58,end:ph=>Math.abs(Math.cos(ph))<.35?.13:.03,flare:.012}},
 long:{line:hl(.85,.52,.40,4),t:.013,top:.005,curtain:{from:62,end:ph=>Math.cos(ph)>-.4?-.12:-.42,flare:.016}},
 pony:{line:hl(.81,.60,.30),t:.009,top:.002,tail:1},
 bun:{line:hl(.81,.60,.30),t:.009,top:.002,bun:1}};

export function buildHair137(T,geos,style){const S=STY[style];if(!S)return null;const fit=headFit(geos),{C,H,y0}=fit,k=H/.245;
 const P=[],U=[],I=[],LIP=[];const US=S.curly?10:4,VS=S.curly?.09:.32;
 const vtx=(p,u,v)=>{P.push(...p);U.push(u,v);return P.length/3-1;};
 const quad=(a,b,c,d)=>{I.push(a,b,c,a,c,d);};
 const yTop=fit.y1+.01;const vOf=p=>(yTop-p[1])/VS;
 const tOf=(ph,el,i,j)=>{let t=(S.t+(S.top||0)*Math.max(0,Math.sin(el)))*k;if(S.lean)t+=S.lean*k*Math.max(0,Math.sin(ph))*Math.max(0,Math.sin(el));
  if(S.noise)t+=(h32(i*31+7,j*17+3)-.5)*2*S.noise*k;return t;};
 const phis=Array.from({length:NP+1},(_,i)=>i*2*Math.PI/NP);
 if(S.band){// bald fringe: horseshoe band round the back, both edges lipped
  const cols=phis.slice(0,NP).map((ph,i)=>[ph,i]).filter(([ph])=>Math.abs(Math.cos(ph))<Math.cos(S.from*D2R)||Math.cos(ph)<0),R=3,G=[];
  for(const[ph,i]of cols){const e0=fit.elOfH(ph,S.band[0](ph)),e1=fit.elOfH(ph,S.band[1](ph)),col=[];
   for(let j=0;j<=R;j++){const el=e0+(e1-e0)*j/R,p=fit.at(ph,el,tOf(ph,el,i,j));col.push(vtx(p,ph/(2*Math.PI)*US,vOf(p)));}G.push({ph,i,col,e0,e1});}
  for(let c=0;c+1<G.length;c++){if(G[c+1].i!==G[c].i+1)continue;for(let j=0;j<R;j++)quad(G[c].col[j],G[c+1].col[j],G[c+1].col[j+1],G[c].col[j+1]);}
  const lip=(ga,gb,el)=>{const a=vtx(fit.at(ga.ph,el(ga),.0015*k),0,0),b=vtx(fit.at(gb.ph,el(gb),.0015*k),0,0);return[a,b];};
  for(let c=0;c+1<G.length;c++){const a=G[c],b=G[c+1];if(b.i!==a.i+1)continue;
   const[i0,i1]=lip(a,b,g=>g.e0);LIP.push(i0,i1,a.col[0],b.col[0]);quad(i0,i1,b.col[0],a.col[0]);const[j0,j1]=lip(a,b,g=>g.e1);LIP.push(j0,j1);quad(a.col[R],b.col[R],j1,j0);}
  return finish(T,P,U,I,LIP,C);}
 // cap grid: rows from the hairline elevation to the crown, one column per phi (+ wrap column for the uv seam)
 const R=6,G=[];
 for(let i=0;i<=NP;i++){const ph=phis[i],e0=fit.elOfH(ph,S.line(ph)),col=[];
  for(let j=0;j<=R;j++){const el=j===R?89.5*D2R:e0+(89.5*D2R-e0)*(1-Math.cos(j/R*Math.PI/2)),p=fit.at(ph,el,tOf(ph,el,i%NP,j));col.push(vtx(p,i/NP*US,vOf(p)));}
  G.push({ph,e0,col});}
 for(let i=0;i<NP;i++)for(let j=0;j<R;j++)quad(G[i].col[j],G[i+1].col[j],G[i+1].col[j+1],G[i].col[j+1]);
 // hairline lip (thickness): outer hairline edge back to just above the scalp
 const inCurt=ph=>S.curtain&&Math.cos(ph)<Math.cos(S.curtain.from*D2R);
 for(let i=0;i<NP;i++){const a=G[i],b=G[i+1];if(inCurt(a.ph)&&inCurt(b.ph))continue;const ia=vtx(fit.at(a.ph,a.e0,.0015*k),i/NP*US,vOf(P.slice(a.col[0]*3,a.col[0]*3+3))+.04),ib=vtx(fit.at(b.ph,b.e0,.0015*k),(i+1)/NP*US,vOf(P.slice(b.col[0]*3,b.col[0]*3+3))+.04);
  quad(ia,ib,b.col[0],a.col[0]);LIP.push(ia,ib);}
 if(S.curtain){const cu=S.curtain,NC=4,IN=.007*k,cols=[];
  for(let i=0;i<=NP;i++){const ph=phis[i];if(!(Math.cos(ph)<Math.cos(cu.from*D2R)))continue;
   // hang from the widest cap row (the skull bulges above the hairline; starting lower left a dark overhang seam)
   let jm=0,wm=-1;for(let j=0;j<R-1;j++){const q=G[i].col[j];const w=Math.hypot(P[q*3]-C[0],P[q*3+2]-C[2]);if(w>wm+1e-5){wm=w;jm=j;}}
   const b0=P.slice(G[i].col[jm]*3,G[i].col[jm]*3+3),sn=Math.sin(ph),cs=Math.cos(ph),r0=Math.hypot(b0[0]-C[0],b0[2]-C[2]),yEnd=y0+cu.end(ph)*H;
   const out=[G[i].col[jm]],inn=[];
   for(let j=0;j<=NC;j++){const y=b0[1]+(yEnd-b0[1])*j/NC,f=j/NC;let r=j===0?r0:Math.max(r0+cu.flare*k*f,fit.radH(ph,y)+S.t*k,r0*.92);
    const p=[C[0]+sn*r,y,C[2]+cs*r],q=[C[0]+sn*(r-IN),y,C[2]+cs*(r-IN)],u=i/NP*US;
    if(j>0)out.push(vtx(p,u,vOf(p)));inn.push(vtx(q,u,vOf(q)));}
   cols.push({i,out,inn});}
  for(let c=0;c+1<cols.length;c++){const a=cols[c],b=cols[c+1];if(b.i!==a.i+1)continue;
   for(let j=0;j<NC;j++){quad(a.out[j],b.out[j],b.out[j+1],a.out[j+1]);quad(b.inn[j],a.inn[j],a.inn[j+1],b.inn[j+1]);}
   const ao=P.slice(a.out[NC]*3,a.out[NC]*3+3),bo=P.slice(b.out[NC]*3,b.out[NC]*3+3);   // bottom lip
   quad(vtx(ao,a.i/NP*US,vOf(ao)),vtx(bo,b.i/NP*US,vOf(bo)),b.inn[NC],a.inn[NC]);}
  // side lips where the curtain starts/ends (wrap column NP duplicates column 0 and is not an edge)
  const edge=[cols[0],cols[cols.length-1]];for(const[e,s]of[[edge[0],1],[edge[1],-1]])for(let j=0;j<NC;j++){
   const cp=q=>vtx(P.slice(q*3,q*3+3),U[q*2],U[q*2+1]);// own vertices: shared ones would drag the sheet normals sideways (dark pinch)
   const o0=cp(e.out[j]),o1=cp(e.out[j+1]),n0=cp(e.inn[j]),n1=cp(e.inn[j+1]);if(s>0)quad(n0,o0,o1,n1);else quad(o0,n0,n1,o1);}}
 if(S.tail){// ponytail: tapered 6-sided tube from the back of the crown, hanging down behind the neck
  const ph=Math.PI,el=fit.elOfH(ph,.62),b=fit.at(ph,el,S.t*k),path=[[0,0,-.004],[0,-.03,-.03],[0,-.07,-.04],[0,-.11,-.036],[0,-.145,-.026]].map(d=>[b[0]+d[0]*k,b[1]+d[1]*k,b[2]+d[2]*k]),rad=[.026,.03,.026,.019,.01].map(r=>r*k),N=6,rings=[];
  path.forEach((c,j)=>{const ring=[];for(let n=0;n<=N;n++){const a=n/N*2*Math.PI,p=[c[0]+Math.cos(a)*rad[j],c[1],c[2]+Math.sin(a)*rad[j]*.8];ring.push(vtx(p,n/N*2,j*.5));}rings.push(ring);});
  for(let j=0;j+1<rings.length;j++)for(let n=0;n<N;n++)quad(rings[j][n],rings[j][n+1],rings[j+1][n+1],rings[j+1][n]);
  const tip=vtx(path[path.length-1].map((v,q)=>q===1?v-.012*k:v),.5,2.4);for(let n=0;n<N;n++)I.push(rings[rings.length-1][n],rings[rings.length-1][n+1],tip);
  // band (scrunchie) as a slightly fatter ring at the root, darker uv rows
 }
 if(S.bun){// knot at the back of the crown: squashed 8 x 4 sphere
  const ph=Math.PI,el=fit.elOfH(ph,.80),d=fit.dirOf(ph,el),b=fit.at(ph,el,S.t*k+.022*k),r=.034*k,NS=8,NR=4,rows=[];
  for(let j=0;j<=NR;j++){const t=-Math.PI/2+j/NR*Math.PI,row=[];for(let n=0;n<=NS;n++){const a=n/NS*2*Math.PI;
   const p=[b[0]+Math.cos(a)*Math.cos(t)*r,b[1]+Math.sin(t)*r*.85,b[2]+Math.sin(a)*Math.cos(t)*r*.8+d[2]*.006*k];row.push(vtx(p,n/NS*3,j*.6));}rows.push(row);}
  for(let j=0;j<NR;j++)for(let n=0;n<NS;n++)quad(rows[j][n],rows[j+1][n],rows[j+1][n+1],rows[j][n+1]);}
 return finish(T,P,U,I,LIP,C);}
function finish(T,P,U,I,LIP=[],C=null){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(P,3));g.setAttribute('uv',new T.Float32BufferAttribute(U,2));g.setIndex(I);
 g.computeVertexNormals();if(C&&LIP.length){const n=g.attributes.normal;for(const i of LIP){const x=P[i*3]-C[0],y=P[i*3+1]-C[1],z=P[i*3+2]-C[2],l=Math.hypot(x,y,z)||1;n.setXYZ(i,x/l,y/l,z/l);}}return g;}
// all styles for one head (front + rear geometry of the type's head, ears skipped by their uv rows like crowd135-far)
export function hairSet137(T,front,rear){const ru=rear.attributes.uv,ear=i=>ru.getY(i)<.285&&ru.getY(i+1)<.285&&ru.getY(i+2)<.285;
 const geos=[[front,null],[rear,ear]];return HAIR137_STYLES.map(s=>buildHair137(T,geos,s));}
