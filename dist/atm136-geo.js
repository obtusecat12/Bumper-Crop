// V136-atm-lobby: geometry + walk/collider plan of the Hope St ATM building lobby (ref files/uploads/ref-atm-lobby-1019.webp).
// PURE module (no three.js): the same deterministic vertex streams feed the runtime (atm136-lobby.js) and the offline
// Blender Cycles bake (bc/scripts/bake136: node dump -> bake134.py + atm_preset.py -> encode136.py -> assets/atm136/bake136.bin).
// RULE: any geometry edit here changes vertex order -> re-run the bake pipeline (bc/scripts/bake136/run.sh).
// Frame: x east (entrance doors at x=0, sea-side glazing at x=30), z north/south (+-13), y up. GF floor 0, 2F floor 5.85.
export const L136={X0:0,X1:30,Z0:-13,Z1:13,F2:5.85,SOFFIT:5.4,CEIL:10.2,C:[14,0],A:6.5,B:5.5,
 ANNEX:{x0:1.9,x1:18,z0:13,z1:15.4,foot:4,top:15},DOOR:{z:3.6,h:3.4},ARRIVAL:{x:1.6,z:0,yaw:-Math.PI/2,pitch:-.04}};
const {X0,X1,Z0,Z1,F2,SOFFIT,CEIL,A,B}=L136,[CX,CZ]=L136.C,AN=L136.ANNEX;
// trefoil cross-section: three lobes radius r at distance d from the axis
function trefoil(n,r,d,off=0,rot=0){const out=[];for(let i=0;i<n;i++){const f=i/n*Math.PI*2,dx=Math.cos(f),dz=Math.sin(f);let best=0;
  for(let k=0;k<3;k++){const a=rot+Math.PI/2+k*Math.PI*2/3,cx=Math.cos(a)*d,cz=Math.sin(a)*d,b=dx*cx+dz*cz,c=cx*cx+cz*cz-r*r,disc=b*b-c;if(disc>=0)best=Math.max(best,b+Math.sqrt(disc));}
  out.push([dx*(best+off),dz*(best+off)]);}return out;}
export const COLS136=[...[40,140,220,320].map(g=>{const f=g*Math.PI/180,k=1.24/Math.sqrt(Math.cos(f)**2/A**2+Math.sin(f)**2/B**2);return{x:CX+Math.cos(f)*k,z:CZ+Math.sin(f)*k,rot:f};}),{x:24.2,z:-7,rot:.3},{x:24.2,z:7,rot:-.3}];
// ---- stage 2: cylindrical acrylic aquarium on an octagonal dark-wood base + lounge furniture groups ----
export const AQ136={x:5.6,z:-2.4,r:.78,base:.95,top:3.55,water:3.3,bR:1.0};
// groups: [cx,cz,floorY,kind,layout]; kind rattan|fabric; layout 4 = four chairs round a table, 2 = pair facing across, 2s = pair side by side facing +x
export const FURN136=[[25.6,-2.7,0,'rattan',4],[25.6,3.4,0,'fabric',4],[21.4,-10.2,0,'rattan','2s'],[21.4,10,0,'fabric','2s'],[3.6,-9.6,0,'fabric',2],
 [26.4,-9.8,5.85,'rattan',2],[26.4,9.4,5.85,'fabric',2],[9.6,-10.6,5.85,'rattan','2s']];
function furnLayout136(){const out=[];for(const[cx,cz,y,kind,lay]of FURN136){out.push({t:'table',x:cx,z:cz,y,yaw:0,kind});
  const at=(dx,dz)=>({t:'chair',x:cx+dx,z:cz+dz,y,yaw:Math.atan2(-dx,-dz),kind});
  if(lay===4)out.push(at(0,-1.12),at(0,1.12),at(-1.12,0),at(1.12,0));else if(lay===2)out.push(at(-1.1,0),at(1.1,0));else out.push(at(-.95,-.55),at(-.95,.55));}
 return out;}
export const OBST136=[{x:AQ136.x,z:AQ136.z,y:0,r:AQ136.bR+.12},...furnLayout136().map(f=>({x:f.x,z:f.z,y:f.y,r:f.t==='table'?.5:.46}))];
const COL_R=.44,COL_D=.5,COL_RAD=COL_R+COL_D+.02;
function ellipseR(f,k=1){return k/Math.sqrt(Math.cos(f)**2/A**2+Math.sin(f)**2/B**2);}
function ellK(x,z){return Math.hypot((x-CX)/A,(z-CZ)/B);}
function rectR(f,x0,x1,z0,z1){const dx=Math.cos(f),dz=Math.sin(f);let t=1e9;if(dx>1e-9)t=Math.min(t,(x1-CX)/dx);if(dx<-1e-9)t=Math.min(t,(x0-CX)/dx);if(dz>1e-9)t=Math.min(t,(z1-CZ)/dz);if(dz<-1e-9)t=Math.min(t,(z0-CZ)/dz);return t;}
export function buildLobby136(){
 const parts={},lights=[];
 const P=k=>parts[k]||(parts[k]={P:[],N:[],U:[],I:[]});
 const vert=(k,p,n,u)=>{const q=P(k);q.P.push(p[0],p[1],p[2]);q.N.push(n[0],n[1],n[2]);q.U.push(u[0],u[1]);return q.P.length/3-1;};
 const tri=(k,a,b,c)=>{const q=P(k),p=q.P,v=i=>[p[i*3],p[i*3+1],p[i*3+2]];const A0=v(a),B0=v(b),C0=v(c);const u=[B0[0]-A0[0],B0[1]-A0[1],B0[2]-A0[2]],w=[C0[0]-A0[0],C0[1]-A0[1],C0[2]-A0[2]];
  const g=[u[1]*w[2]-u[2]*w[1],u[2]*w[0]-u[0]*w[2],u[0]*w[1]-u[1]*w[0]],n=q.N,s=g[0]*(n[a*3]+n[b*3]+n[c*3])+g[1]*(n[a*3+1]+n[b*3+1]+n[c*3+1])+g[2]*(n[a*3+2]+n[b*3+2]+n[c*3+2]);
  if(Math.hypot(...g)<1e-10)return;s>=0?q.I.push(a,b,c):q.I.push(a,c,b);};
 // generic grid over a parametric patch f(s,t)->{p,n,u}
 const patch=(k,ns,nt,f,skip)=>{const id=[];for(let j=0;j<=nt;j++)for(let i=0;i<=ns;i++){const r=f(i/ns,j/nt);id.push(vert(k,r.p,r.n,r.u));}
  for(let j=0;j<nt;j++)for(let i=0;i<ns;i++){if(skip&&skip((i+.5)/ns,(j+.5)/nt))continue;const a=id[j*(ns+1)+i],b=a+1,c=a+ns+2,d=a+ns+1;tri(k,a,b,c);tri(k,a,c,d);}};
 const seg=(l,m=.7)=>Math.max(1,Math.ceil(Math.abs(l)/m));
 // axis-aligned rectangle: plane 'x'|'y'|'z' at value c, ranges, outward normal sign, uv tile
 const rect=(k,ax,c,a0,a1,b0,b1,sg,tile=2,skip=null,m=.7)=>{const ns=seg(a1-a0,m),nt=seg(b1-b0,m);patch(k,ns,nt,(s,t)=>{const a=a0+(a1-a0)*s,b=b0+(b1-b0)*t;
  if(ax==='y')return{p:[a,c,b],n:[0,sg,0],u:[a/tile,b/tile]};if(ax==='x')return{p:[c,b,a],n:[sg,0,0],u:[a/tile*-sg,b/tile]};return{p:[a,b,c],n:[0,0,sg],u:[a/tile*sg,b/tile]};},skip&&((s,t)=>skip(a0+(a1-a0)*s,b0+(b1-b0)*t)));};
 const box=(k,x0,x1,y0,y1,z0,z1,tile=1,faces='xXyYzZ')=>{if(faces.includes('x'))rect(k,'x',x0,z0,z1,y0,y1,-1,tile);if(faces.includes('X'))rect(k,'x',x1,z0,z1,y0,y1,1,tile);
  if(faces.includes('y'))rect(k,'y',y0,x0,x1,z0,z1,-1,tile);if(faces.includes('Y'))rect(k,'y',y1,x0,x1,z0,z1,1,tile);if(faces.includes('z'))rect(k,'z',z0,x0,x1,y0,y1,-1,tile);if(faces.includes('Z'))rect(k,'z',z1,x0,x1,y0,y1,1,tile);};
 // ---- polar (ellipse-centred) horizontal regions ----
 const NF=112,F=[];for(let i=0;i<NF;i++)F.push(i/NF*Math.PI*2);
 for(const[x,z]of[[X0,Z0],[X1,Z0],[X1,Z1],[X0,Z1]]){let f=Math.atan2(z-CZ,x-CX);if(f<0)f+=Math.PI*2;F.push(f);}F.sort((a,b)=>a-b);
 const ring=(k,y,sg,k0,k1,toRect,tile,rings)=>{const id=[];for(let j=0;j<=rings;j++)for(const f of F){const r0=ellipseR(f,k0),r1=toRect?rectR(f,X0,X1,Z0,Z1):ellipseR(f,k1),r=r0+(r1-r0)*j/rings,x=CX+Math.cos(f)*r,z=CZ+Math.sin(f)*r;id.push(vert(k,[x,y,z],[0,sg,0],[x/tile,z/tile]));}
  const n=F.length;for(let j=0;j<rings;j++)for(let i=0;i<n;i++){const a=id[j*n+i],b=id[j*n+(i+1)%n],c=id[(j+1)*n+(i+1)%n],d=id[(j+1)*n+i];tri(k,a,b,c);tri(k,a,c,d);}};
 const disc=(k,y,sg,k1,tile,rings)=>{const c0=vert(k,[CX,y,CZ],[0,sg,0],[CX/tile,CZ/tile]);const n=F.length;let prev=null;
  for(let j=1;j<=rings;j++){const cur=F.map(f=>{const r=ellipseR(f,k1*j/rings),x=CX+Math.cos(f)*r,z=CZ+Math.sin(f)*r;return vert(k,[x,y,z],[0,sg,0],[x/tile,z/tile]);});
   for(let i=0;i<n;i++){if(!prev)tri(k,c0,cur[i],cur[(i+1)%n]);else{tri(k,prev[i],prev[(i+1)%n],cur[(i+1)%n]);tri(k,prev[i],cur[(i+1)%n],cur[i]);}}prev=cur;}};
 const wallRing=(k,k0,y0,y1,inward,tile,nt=1)=>{const n=F.length,id=[];for(let j=0;j<=nt;j++){let L=0;for(let i=0;i<=n;i++){const f=F[i%n]+(i===n?Math.PI*2:0),r=ellipseR(f,k0),x=CX+Math.cos(f)*r,z=CZ+Math.sin(f)*r;
   if(i){const g=F[(i-1)%n],rp=ellipseR(g,k0);L+=Math.hypot(x-(CX+Math.cos(g)*rp),z-(CZ+Math.sin(g)*rp));}
   const nx=Math.cos(f)/A**2*r,nz=Math.sin(f)/B**2*r,nl=Math.hypot(nx,nz)*(inward?-1:1);id.push(vert(k,[x,y0+(y1-y0)*j/nt,z],[nx/nl,0,nz/nl],[L/tile,(y0+(y1-y0)*j/nt)/tile]));}}
  for(let j=0;j<nt;j++)for(let i=0;i<n;i++){const a=id[j*(n+1)+i],b=a+1,c=b+n+1,d=a+n+1;tri(k,a,b,c);tri(k,a,c,d);}};
 // ---- floors ----
 disc('marble',0,1,.78,2.4,5);ring('inlay',0,1,.78,.86,false,1.2,1);ring('inlay',0,1,1.9,1.98,false,1.2,1);
 ring('marble',0,1,.86,1.9,false,2.4,9);ring('marble',0,1,1.98,0,true,2.4,18);
 rect('marble',"y",0,AN.x0,AN.foot,Z1,AN.z1,1,2.4);
 ring('marble2',F2,1,1.04,0,true,2.4,16);rect('marble2','y',F2,AN.top,AN.x1,Z1,AN.z1,1,2.4);
 // ---- ceilings: GF soffit, 2F ceiling, stepped atrium dome with cove strips and skylight ----
 ring('ceil',SOFFIT,-1,1.06,0,true,2,9);ring('ceil',CEIL,-1,1,0,true,2,9);
 const steps=[[1,10.2,10.85],[.84,10.85,11.5],[.68,11.5,12.15]];
 for(const[k0,y0,y1]of steps){wallRing('ceil',k0,y0,y1,true,2,1);ring('cove',y1-.06,-1,k0-.035,k0,false,1,1);}
 ring('ceil',10.85,-1,.84,1,false,2,1);ring('ceil',11.5,-1,.68,.84,false,2,1);ring('ceil',12.15,-1,.52,.68,false,2,1);
 disc('skylight',12.15,-1,.52,4,3);
 lights.push({kind:'AREA',p:[CX,12.1,CZ],dir:[0,-1,0],w:A*.9,h:B*.9,c:[1,.97,.9],power:2600});
 // ---- atrium edge: dropped curved bulkhead (5.0) + curb + glass rail on 2F ----
 wallRing('ceil',1,5.0,F2+.3,true,2,2);ring('ceil',5.0,-1,1,1.06,false,2,1);wallRing('ceil',1.06,5.0,SOFFIT,false,2,1);
 ring('ceil',F2+.3,1,1,1.04,false,2,1);wallRing('ceil',1.04,F2,F2+.3,false,2,1);
 wallRing('glass',1.02,F2+.3,F2+1.12,true,2,1);
 ring('metal',F2+1.16,1,1.0,1.04,false,1,1);wallRing('metal',1.0,F2+1.12,F2+1.16,true,1,1);wallRing('metal',1.04,F2+1.12,F2+1.16,false,1,1);
 for(let i=0;i<F.length;i+=7){const f=F[i],r=ellipseR(f,1.02),x=CX+Math.cos(f)*r,z=CZ+Math.sin(f)*r;box('metal',x-.03,x+.03,F2+.3,F2+1.12,z-.03,z+.03,1,'xXzZ');}
 // ---- walls (plaster), glazing, doors ----
 const DZ=L136.DOOR.z,DH=L136.DOOR.h;
 for(const[a,b,y0,y1]of[[Z0,-DZ,0,CEIL],[-DZ,DZ,DH,CEIL],[DZ,Z1,0,CEIL]])rect('wall','x',X0,a,b,y0,y1,1,2);   // west, entrance opening
 rect('wall','z',Z0,X0,X1,0,CEIL,1,2);                                                                       // south
 const NW=[[X0,AN.x0,0,CEIL],[AN.x0,AN.foot+.2,SOFFIT,CEIL],[AN.foot+.2,AN.top,0,CEIL],[AN.top,AN.x1,0,F2],[AN.top,AN.x1,CEIL-.4,CEIL],[AN.x1,X1,0,CEIL]];
 for(const[a,b,y0,y1]of NW){rect('wall','z',Z1,a,b,y0,y1,-1,2);if(a>=AN.x0&&b<=AN.x1)rect('wall','z',Z1+.001,a,b,y0,y1,1,2);}   // north + its annex side
 rect('wall','x',AN.x0,Z1,AN.z1,0,CEIL,1,2);rect('wall','x',AN.x1,Z1,AN.z1,0,CEIL,-1,2);rect('wall','z',AN.z1,AN.x0,AN.x1,0,CEIL,-1,2);
 rect('ceil','y',CEIL,AN.x0,AN.x1,Z1,AN.z1,-1,2);
 // slab edges at the openings
 box('wall',AN.x0,AN.foot+.2,SOFFIT,F2,Z1-.02,Z1+.02,2,'y');
 // stair: 40 risers foot -> top along +x, marble2 treads + risers
 {const n=40,h=F2/n,r=(AN.top-AN.foot)/n;for(let i=0;i<n;i++){const x=AN.foot+i*r,y=(i+1)*h;rect('marble2','y',y,x,x+r,Z1,AN.z1,1,2.4,null,3);rect('marble2','x',x,Z1,AN.z1,y-h,y,-1,2.4,null,3);}}
 // east glazing: mullions, transom (slab edge), frame
 for(let z=Z0;z<=Z1+1e-6;z+=2.6)box('metal',X1-.06,X1+.06,0,CEIL,z-.05,z+.05,1,'xzZ');
 box('wall',X1-.12,X1,SOFFIT,F2+.12,Z0,Z1,2,'xy');box('metal',X1-.08,X1,F2+.12,F2+.2,Z0,Z1,1,'xY');
 rect('glass','x',X1,Z0,Z1,0,SOFFIT,-1,4);rect('glass','x',X1,Z0,Z1,F2+.2,CEIL,-1,4);
 rect('sky','x',X1+16,-60,60,-14,34,-1,1,null,6);
 // entrance: three bronze-framed glass door pairs + daylight behind
 for(const zc of[-2.4,0,2.4]){box('metal',X0-.06,X0+.06,0,L136.DOOR.h,zc-1.2,zc-1.12,1,'xXzZ');box('metal',X0-.06,X0+.06,L136.DOOR.h-.12,L136.DOOR.h,zc-1.2,zc+1.2,1,'Xy');rect('door','x',X0-.02,zc-1.12,zc+1.12,0,L136.DOOR.h-.12,1,1,null,3);}
 box('metal',X0-.06,X0+.06,0,L136.DOOR.h,3.52,3.6,1,'xXzZ');rect('street','x',X0-4,-8,8,-1,8,1,1,null,8);
 // ---- trefoil columns: pebble base, white cap ring, cream shaft to the 2F ceiling ----
 for(const c of COLS136){const n=54,sh=trefoil(n,COL_R,COL_D,0,c.rot),bs=trefoil(n,COL_R,COL_D,.12,c.rot),cap=trefoil(n,COL_R,COL_D,.17,c.rot);
  const col=(k,pts,y0,y1,nt,tile,out=1)=>{let L=[0];for(let i=1;i<=n;i++){const a=pts[(i-1)%n],b=pts[i%n];L.push(L[i-1]+Math.hypot(b[0]-a[0],b[1]-a[1]));}
   const nrm=i=>{const a=pts[(i+n-1)%n],b=pts[(i+1)%n],tx=b[0]-a[0],tz=b[1]-a[1],l=Math.hypot(tx,tz)||1;return[tz/l*out,0,-tx/l*out];};
   const nn=nrm(0);const probe=pts[0];if(nn[0]*probe[0]+nn[2]*probe[1]<0)out=-out;
   patch(k,n,nt,(s,t)=>{const i=Math.round(s*n),p=pts[i%n],q=nrm(i%n);return{p:[c.x+p[0],y0+(y1-y0)*t,c.z+p[1]],n:q,u:[L[i]/tile,(y0+(y1-y0)*t)/tile]};});};
  const lid=(k,pts,y,sg,inner)=>{const id=pts.map((p,i)=>vert(k,[c.x+p[0],y,c.z+p[1]],[0,sg,0],[p[0],p[1]])),ii=inner.map(p=>vert(k,[c.x+p[0],y,c.z+p[1]],[0,sg,0],[p[0],p[1]]));for(let i=0;i<n;i++){tri(k,ii[i],id[i],id[(i+1)%n]);tri(k,ii[i],id[(i+1)%n],ii[(i+1)%n]);}};
  col('pebble',bs,0,1.02,2,1.1);lid('column',bs,1.02,1,sh);col('column',cap,1.02,1.2,1,1.8);lid('column',cap,1.2,1,sh);lid('column',cap,1.02,-1,bs);
  col('column',sh,1.2,SOFFIT,6,1.8);col('column',sh,F2,CEIL,6,1.8);col('column',cap,F2,F2+.14,1,1.8);lid('column',cap,F2+.14,1,sh);
  col('column',cap,CEIL-.3,CEIL,1,1.8);lid('column',cap,CEIL-.3,-1,sh);}
 // ---- downlights: small emissive discs in the soffit + 2F ceiling (bake: points; runtime: glow) ----
 for(const[y,yy]of[[SOFFIT-.005,SOFFIT-.4],[CEIL-.005,CEIL-.4]])for(let x=2.5;x<X1-1;x+=3.4)for(let z=-11;z<=11.01;z+=3.6){if(ellK(x,z)<1.25||COLS136.some(c=>Math.hypot(c.x-x,c.z-z)<1.6))continue;
  rect('lamp','y',y,x-.14,x+.14,z-.14,z+.14,-1,1,null,1);lights.push({kind:'POINT',p:[x,yy,z],c:[1,.86,.66],power:y<6?55:40,radius:.12});}
 lights.push({kind:'AREA',p:[X1-.3,SOFFIT/2,0],dir:[-1,0,0],w:2*Z1,h:SOFFIT,c:[1,.86,.74],power:5200});
 lights.push({kind:'AREA',p:[X1-.3,(F2+CEIL)/2,0],dir:[-1,0,0],w:2*Z1,h:CEIL-F2,c:[1,.88,.78],power:3600});
 lights.push({kind:'AREA',p:[X0+.4,1.7,0],dir:[1,0,0],w:7,h:3.2,c:[.9,.94,1],power:500});
 for(let x=3.5;x<AN.x1;x+=4.6){const z=(Z1+AN.z1)/2;rect('lamp','y',CEIL-.005,x-.14,x+.14,z-.14,z+.14,-1,1,null,1);lights.push({kind:'POINT',p:[x,CEIL-.6,z],c:[1,.86,.66],power:60,radius:.12});}

 // ===== stage 2 =====
 // oriented box (local half extents, yaw about +y; local +z = front)
 const obox=(k,cx,cy,cz,hx,hy,hz,yaw,tile=1,faces='xXyYzZ',lx=0,lz=0)=>{const c=Math.cos(yaw),s=Math.sin(yaw),W=(x,y,z)=>[cx+(x+lx)*c+(z+lz)*s,cy+y,cz-(x+lx)*s+(z+lz)*c],R=(x,y,z)=>[x*c+z*s,y,-x*s+z*c];
  const quad=(n,o,a,b,ea,eb)=>{const nw=R(...n);const ns=seg(2*ea,.6),nt=seg(2*eb,.6);patch(k,ns,nt,(u,v)=>{const pa=(u*2-1)*ea,pb=(v*2-1)*eb,l=[o[0]+a[0]*pa+b[0]*pb,o[1]+a[1]*pa+b[1]*pb,o[2]+a[2]*pa+b[2]*pb];return{p:W(...l),n:nw,u:[(pa+ea)/tile,(pb+eb)/tile]};});};
  if(faces.includes('x'))quad([-1,0,0],[-hx,0,0],[0,0,1],[0,1,0],hz,hy);if(faces.includes('X'))quad([1,0,0],[hx,0,0],[0,0,1],[0,1,0],hz,hy);
  if(faces.includes('y'))quad([0,-1,0],[0,-hy,0],[1,0,0],[0,0,1],hx,hz);if(faces.includes('Y'))quad([0,1,0],[0,hy,0],[1,0,0],[0,0,1],hx,hz);
  if(faces.includes('z'))quad([0,0,-1],[0,0,-hz],[1,0,0],[0,1,0],hx,hy);if(faces.includes('Z'))quad([0,0,1],[0,0,hz],[1,0,0],[0,1,0],hx,hy);};
 // vertical prism / cylinder side (n sides), optional lids
 const prism=(k,cx,cz,r,y0,y1,n,rot=0,tile=1,inward=false,smooth=false)=>{const sg=inward?-1:1;
  if(!smooth){for(let i=0;i<n;i++){const f0=rot+i/n*Math.PI*2,f1=rot+(i+1)/n*Math.PI*2,fm=(f0+f1)/2,nn=[Math.cos(fm)*sg,0,Math.sin(fm)*sg],w=2*r*Math.sin(Math.PI/n);   // flat facets
    const ids=[[f0,y0,0],[f1,y0,w],[f1,y1,w],[f0,y1,0]].map(([f,y,u])=>vert(k,[cx+Math.cos(f)*r,y,cz+Math.sin(f)*r],nn,[u/tile,(y-y0)/tile]));tri(k,ids[0],ids[1],ids[2]);tri(k,ids[0],ids[2],ids[3]);}return;}
  const id=[];for(let i=0;i<=n;i++){const f=rot+i/n*Math.PI*2,L=i*2*r*Math.sin(Math.PI/n);for(const y of[y0,y1])id.push(vert(k,[cx+Math.cos(f)*r,y,cz+Math.sin(f)*r],[Math.cos(f)*sg,0,Math.sin(f)*sg],[L/tile,y/tile]));}
  for(let i=0;i<n;i++){const a=id[i*2],b=id[i*2+1],c=id[i*2+3],d=id[i*2+2];tri(k,a,d,c);tri(k,a,c,b);}};
 const lidN=(k,cx,cz,r0,r1,y,sg,n,rot=0,tile=1)=>{const o=[],ii=[];for(let i=0;i<n;i++){const f=rot+i/n*Math.PI*2;o.push(vert(k,[cx+Math.cos(f)*r1,y,cz+Math.sin(f)*r1],[0,sg,0],[Math.cos(f)*r1/tile,Math.sin(f)*r1/tile]));
   ii.push(r0>0?vert(k,[cx+Math.cos(f)*r0,y,cz+Math.sin(f)*r0],[0,sg,0],[Math.cos(f)*r0/tile,Math.sin(f)*r0/tile]):null);}
  const c0=r0>0?null:vert(k,[cx,y,cz],[0,sg,0],[0,0]);for(let i=0;i<n;i++){const j=(i+1)%n;if(c0!==null)tri(k,c0,o[i],o[j]);else{tri(k,ii[i],o[i],o[j]);tri(k,ii[i],o[j],ii[j]);}}};
 // ---- aquarium: octagonal walnut cabinet (plinth, panel body, top moulding) + acrylic cylinder + gravel bed ----
 {const {x,z,r,base,top,bR}=AQ136,rot=Math.PI/8;
  prism('wood',x,z,bR-.05,0,.12,8,rot,1);lidN('wood',x,z,bR-.05,bR,.12,1,8,rot);
  prism('wood',x,z,bR,.12,base-.1,8,rot,1);prism('wood',x,z,bR+.06,base-.1,base,8,rot,1);
  lidN('wood',x,z,bR,bR+.06,base-.1,-1,8,rot);lidN('wood',x,z,r+.02,bR+.06,base,1,8,rot);
  lidN('gravel',x,z,0,r+.02,base+.005,1,40,0,.6);
  prism('acrylic',x,z,r+.015,base,top,48,0,4,false,true);prism('acrylic',x,z,r,base,top,48,0,4,true,true);lidN('acrylic',x,z,r,r+.015,top,1,48);
  lights.push({kind:'POINT',p:[x,top-.15,z],c:[.75,.9,1],power:30,radius:.3});}
 // ---- lounge furniture ----
 for(const f of furnLayout136()){const {x,z,y,yaw}=f;
  if(f.t==='table'){obox('wood',x,y+.4,z,.46,.035,.46,0,1);obox('wood',x,y+.33,z,.41,.035,.41,0,1,'xXzZy');
   for(const[a,b]of[[-1,-1],[1,-1],[1,1],[-1,1]])obox('wood',x,y+.15,z,.03,.15,.03,0,1,'xXzZ',a*.37,b*.37);continue;}
  const fr=f.kind==='rattan'?'rattan':'fabric',cu='fabric';
  if(f.kind==='rattan'){obox(fr,x,y+.06,z,.4,.06,.38,yaw,.5,'xXzZ');obox(fr,x,y+.27,z,.4,.15,.38,yaw,.5,'xXzZY');}
  else{for(const[a,b]of[[-1,-1],[1,-1],[1,1],[-1,1]])obox('wood',x,y+.06,z,.03,.06,.03,yaw,1,'xXzZ',a*.35,b*.33);obox(fr,x,y+.27,z,.4,.15,.38,yaw,.5,'xXzZYy');}
  for(const sx of[-1,1])obox(fr,x,y+.52,z,.07,.1,.38,yaw,.5,'xXyYzZ',sx*.33,0);
  obox(fr,x,y+.6,z,.4,.33,.07,yaw,.5,'xXyYzZ',0,-.31);
  obox(cu,x,y+.48,z,.26,.06,.3,yaw,.6,'xXzZY',0,.05);obox(cu,x,y+.68,z,.26,.19,.06,yaw,.6,'xXzZY',0,-.19);}
 { const s=parts.sky;for(let i=0;i<s.P.length/3;i++){s.U[i*2]=(s.P[i*3+2]+60)/120;s.U[i*2+1]=(s.P[i*3+1]+14)/48;} }
 return{parts,lights};
}
// ---- walking: surfaces at heights, pick the one within a step of the current height ----
const inRect=(x,z,x0,x1,z0,z1)=>x>x0&&x<x1&&z>z0&&z<z1;
const COLS_HIT=(x,z,r)=>COLS136.some(c=>Math.hypot(x-c.x,z-c.z)<COL_RAD+.18+r);
const OB_HIT=(x,z,y)=>OBST136.some(o=>o.y===y&&Math.hypot(x-o.x,z-o.z)<o.r+.22);
export function surfaces136(x,z){const out=[],m=.32,col=COLS_HIT(x,z,0);
 if(!col&&!OB_HIT(x,z,0)&&(inRect(x,z,X0+m,X1-m,Z0+m,Z1-m)||inRect(x,z,AN.x0+m,AN.foot,Z1-m-.01,AN.z1-m)||(x>X0-.6&&x<X0+m+.01&&Math.abs(z)<L136.DOOR.z-.3)))out.push(0);
 if(inRect(x,z,AN.foot-.02,AN.top+.02,Z1+.05,AN.z1-m))out.push(Math.max(0,Math.min(F2,(x-AN.foot)/(AN.top-AN.foot)*F2)));
 if(!col&&!OB_HIT(x,z,F2)&&((inRect(x,z,X0+m,X1-m,Z0+m,Z1-m)&&ellK(x,z)>1.1)||inRect(x,z,AN.top-.02,AN.x1-m,Z1-m-.01,AN.z1-m)))out.push(F2);
 return out;}
export function floorAt136(x,z,h){let best=null,d=.55;for(const s of surfaces136(x,z)){const e=Math.abs(s-h);if(e<d){d=e;best=s;}}return best;}
export function resolve136(st,next){const h=st.floor136??0;
 let y=floorAt136(next.x,next.z,h);if(y!==null)return{x:next.x,z:next.z,y};
 y=floorAt136(next.x,st.z,h);if(y!==null)return{x:next.x,z:st.z,y};
 y=floorAt136(st.x,next.z,h);if(y!==null)return{x:st.x,z:next.z,y};
 return{x:st.x,z:st.z,y:h};}
export function atLobbyExit136(x,z,h){return (h??0)<.5&&x<1.25&&Math.abs(z)<L136.DOOR.z;}
