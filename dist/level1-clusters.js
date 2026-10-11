// Level 1 v3 "小径" clusters: finite corridor complexes embedded in the infinite halls (same scene, same map).
// Each cluster (level1-layout l1Clu) is a w×d-bay block cut into 8/3 m cells (3 per bay): a hashed maze with
// a few rooms, entered through door openings in its outline. Pure + cached; geometry goes through the world's put().
import {l1Hash,l1Clu,l1InClu,l1DoorX,l1DoorZ,L1_BAY as B} from './level1-layout.js?v=113';
export const CS=B/3,HC=2.75,WT=.16;
const KINDS=['office','barber','infirmary','rubber','brick','paintings','storage','empty','empty','boards'];
export function makeL1Clusters(T,{P,G,C,PR,box,vcyl,GLOW}){
 const cache=new Map(),gcylR=new T.CylinderGeometry(1,1,1,8,1,false).rotateZ(Math.PI/2);
 function data(c){let m=cache.get(c.id);if(m)return m;const N=c.w*3,M=c.d*3,h=(a,b,s)=>l1Hash(c.gx*97+a,c.gz*89+b,s),I=(x,z)=>z*N+x;
  const e=new Uint8Array(N*M),s=new Uint8Array(N*M),room=new Int16Array(N*M).fill(-1),vis=new Uint8Array(N*M);
  // rooms first: 1-3 rectangles, internal edges open
  const rooms=[];const nr=1+Math.floor(h(0,0,1)*Math.min(3,(N*M)/14));
  for(let k=0;k<nr*4&&rooms.length<nr;k++){const rw=2+Math.floor(h(k,1,2)*2),rd=2+Math.floor(h(k,2,3)*(k%2?1:2)),rx=Math.floor(h(k,3,4)*(N-rw+1)),rz=Math.floor(h(k,4,5)*(M-rd+1));
   let ok=true;for(let z=rz-1;z<=rz+rd&&ok;z++)for(let x=rx-1;x<=rx+rw;x++)if(x>=0&&z>=0&&x<N&&z<M&&room[I(x,z)]>=0)ok=false;if(!ok)continue;
   const id=rooms.length;rooms.push({x:rx,z:rz,w:rw,d:rd,kind:KINDS[Math.floor(h(k,5,6)*KINDS.length)],lit:h(k,6,7)<.8});
   for(let z=rz;z<rz+rd;z++)for(let x=rx;x<rx+rw;x++){room[I(x,z)]=id;if(x<rx+rw-1)e[I(x,z)]=1;if(z<rz+rd-1)s[I(x,z)]=1;}}
  // DFS maze over every cell (rooms are crossed as ordinary cells, their insides already open)
  const st=[[Math.floor(h(0,9,8)*N),Math.floor(h(9,0,9)*M)]];vis[I(st[0][0],st[0][1])]=1;let n=0;
  while(st.length){const[x,z]=st[st.length-1];const nb=[];for(const[dx,dz]of[[1,0],[-1,0],[0,1],[0,-1]]){const a=x+dx,b=z+dz;if(a>=0&&b>=0&&a<N&&b<M&&!vis[I(a,b)])nb.push([dx,dz]);}
   if(!nb.length){st.pop();continue;}const[dx,dz]=nb[Math.floor(h(x,z,10+(n++&7))*nb.length)];const a=x+dx,b=z+dz;
   // a room is entered through at most one or two doorways
   if(dx===1)e[I(x,z)]=1;if(dx===-1)e[I(a,b)]=1;if(dz===1)s[I(x,z)]=1;if(dz===-1)s[I(a,b)]=1;vis[I(a,b)]=1;st.push([a,b]);}
  for(let j=0;j<Math.floor(N*M/10);j++){const x=Math.floor(h(j,20,21)*(N-1)),z=Math.floor(h(20,j,22)*(M-1));if(room[I(x,z)]>=0)continue;if(h(j,j,23)>.5)e[I(x,z)]=1;else s[I(x,z)]=1;}
  // outline doors (middle cell of a bay side)
  const ext=[];for(let i=0;i<c.w;i++){const ix=c.ox+i;if(l1DoorX(ix,c.oz))ext.push({x:i*3+1,z:0,nx:0,nz:-1});if(l1DoorX(ix,c.oz+c.d))ext.push({x:i*3+1,z:M-1,nx:0,nz:1});}
  for(let j=0;j<c.d;j++){const iz=c.oz+j;if(l1DoorZ(c.ox,iz))ext.push({x:0,z:j*3+1,nx:-1,nz:0});if(l1DoorZ(c.ox+c.w,iz))ext.push({x:N-1,z:j*3+1,nx:1,nz:0});}
  // lamps: rooms one at the centre, corridor cells hashed (some dead)
  const lamps=[];for(const r of rooms)lamps.push({x:c.ox*B+(r.x+r.w/2)*CS,z:c.oz*B+(r.z+r.d/2)*CS,on:r.lit,bulb:r.kind==='office'||r.kind==='barber'||r.kind==='storage',room:true});
  for(let z=0;z<M;z++)for(let x=0;x<N;x++){if(room[I(x,z)]>=0)continue;const q=h(x,z,30);if(q<.42)lamps.push({x:c.ox*B+(x+.5)*CS,z:c.oz*B+(z+.5)*CS,on:q>.07,bulb:false,ax:h(x,z,31)>.5});}
  const wallTex=['form','form','paint','form'][Math.floor(h(1,1,40)*4)];
  m={c,N,M,e,s,room,rooms,ext,lamps,wallTex,I};cache.set(c.id,m);if(cache.size>64)cache.delete(cache.keys().next().value);return m;}
 const at=(x,z)=>{const bx=Math.floor(x/B),bz=Math.floor(z/B);if(!l1InClu(bx,bz))return null;return data(l1Clu(bx,bz));};
 // is the edge east of cell (x,z) closed? (outline handled by the hall walls)
 const closedE=(m,x,z)=>x<m.N-1&&!m.e[m.I(x,z)],closedS=(m,x,z)=>z<m.M-1&&!m.s[m.I(x,z)];
 function wallMat(m,x,z){const a=m.room[m.I(x,z)],r=a>=0?m.rooms[a]:null;
  return r&&r.kind==='rubber'?C.padded:r&&r.kind==='brick'?C.brick:m.wallTex==='paint'?C.cwallP:C.cwall;}
 // ---- geometry for one hall bay that lies inside a cluster ----
 function bay(ix,iz){const c=l1Clu(ix,iz);const m=data(c),x0=(ix-c.ox)*3,z0=(iz-c.oz)*3,OX=c.ox*B,OZ=c.oz*B;
  for(let z=z0;z<z0+3;z++)for(let x=x0;x<x0+3;x++){const cx=OX+(x+.5)*CS,cz=OZ+(z+.5)*CS,hh=(s)=>l1Hash(c.gx*131+x,c.gz*71+z,s);
   P(box,C.cceil,cx,HC+.04,cz,CS,.08,CS);
   // each wall is two half-thickness skins so a room's finish (brick, padding) stays on its own side
   if(closedE(m,x,z)){const wx=OX+(x+1)*CS;P(box,wallMat(m,x,z,x,z),wx-WT/4,HC/2,cz,WT/2,HC,CS+WT);P(box,wallMat(m,x+1,z,x+1,z),wx+WT/4,HC/2,cz,WT/2,HC,CS+WT);}
   if(closedS(m,x,z)){const wz=OZ+(z+1)*CS;P(box,wallMat(m,x,z,x,z),cx,HC/2,wz-WT/4,CS+WT,HC,WT/2);P(box,wallMat(m,x,z+1,x,z+1),cx,HC/2,wz+WT/4,CS+WT,HC,WT/2);}
   // skirting grime strip + the odd conduit along corridors
   if(hh(50)<.25)P(box,C.conduit,cx,HC-.12,cz+CS*.3,CS,.03,.03);}
  // fill the hall-height gap above the low cluster ceiling with a dark plenum lid
  P(box,C.ceil,ix*B+4,HC+.3,iz*B+4,B,.4,B);
  for(const L of m.lamps){if(Math.floor(L.x/B)!==ix||Math.floor(L.z/B)!==iz)continue;
   if(L.bulb){P(box,C.wire,L.x,HC-.3,L.z,.012,.6,.012);G(L.on?GLOW.warm:GLOW.dim,L.x,HC-.62,L.z,.08,.1,.08);}
   else{P(box,C.batten,L.x,HC-.03,L.z,L.ax?1.25:.18,.05,L.ax?.18:1.25);G(L.on?GLOW.tube:GLOW.dim,L.x,HC-.065,L.z,L.ax?1.18:.12,.02,L.ax?.12:1.18);}}
  // rooms whose centre lies in this bay are dressed here
  m.rooms.forEach((r,ri)=>{const rx=OX+(r.x+r.w/2)*CS,rz=OZ+(r.z+r.d/2)*CS;if(Math.floor(rx/B)!==ix||Math.floor(rz/B)!==iz)return;dress(m,r,ri,rx,rz);});
  // dead-end props: boards leaning at corridor ends (image-25), a crate, a chair
  for(let z=z0;z<z0+3;z++)for(let x=x0;x<x0+3;x++){if(m.room[m.I(x,z)]>=0)continue;let open=0,dir=null;const o=[[1,0,!closedE(m,x,z)&&x<m.N-1],[-1,0,x>0&&!closedE(m,x-1,z)],[0,1,!closedS(m,x,z)&&z<m.M-1],[0,-1,z>0&&!closedS(m,x,z-1)]];for(const[dx,dz,op]of o)if(op){open++;dir=[dx,dz];}
   if(open!==1)continue;const q=l1Hash(c.gx*7+x,c.gz*5+z,60),ccx=OX+(x+.5)*CS,ccz=OZ+(z+.5)*CS,ry=Math.atan2(dir[0],dir[1]);
   // image-24: the corridor dies at a pair of black steel doors, a sheet of ply leant on the side wall
   if(q<.7){const out=x-dir[0]<0||x-dir[0]>=m.N||z-dir[1]<0||z-dir[1]>=m.M,ins=CS/2-(out?.15:WT/2)-.025,dx=ccx-dir[0]*ins,dz=ccz-dir[1]*ins,ax=dir[0]===0;
    const D=(c2,u,y,w,h,t,o=0)=>P(box,c2,ax?dx+u:dx+dir[0]*o,y,ax?dz+dir[1]*o:dz+u,ax?w:t,h,ax?t:w);
    // V116: doors with volume: recessed dark reveal, 8×14 cm steel jambs + head standing proud of the wall, 5 cm leaves hung on three knuckle hinges
    D(C.dark,0,1.06,1.6,2.12,.02,-.01);for(const u of[-.84,.84])D(C.frame,u,1.1,.08,2.2,.14,.03);D(C.frame,0,2.2,1.76,.08,.14,.03);for(const u of[-.4,.4])D(C.dark,u,1.04,.78,2.06,.05,.03);
    for(const u of[-.795,.795])for(const y of[.35,1.05,1.75])D(C.chrome,u,y,.03,.12,.07,.045);D(C.steelP,-.06,1.0,.04,.3,.06,.075);D(C.steelP,.06,1.0,.04,.3,.06,.075);D(C.cwallP,0,2.38,1.9,.24,.03);}
   if(q<.45||q>=.7&&q<.85){const sd=l1Hash(c.gx+x,c.gz+z,62)>.5?1:-1,px=ccx+(dir[1]!==0?sd*(CS/2-.35):-dir[0]*.4),pz=ccz+(dir[0]!==0?sd*(CS/2-.35):-dir[1]*.4);PR.place(10,px,pz,Math.atan2(dir[1]!==0?-sd:0,dir[0]!==0?-sd:0),c.gx*13+x*7+z,CS/2-.35-WT/2);}
   else if(q>=.85&&q<.95)PR.place(l1Hash(x,z,63)>.5?1:16,ccx-dir[0]*CS*.25,ccz-dir[1]*CS*.25,ry,c.gx*13+x*7+z);}}
 function dress(m,r,ri,rx,rz){const c=m.c,k=c.gx*31+c.gz*17+ri,hw=r.w*CS/2,hd=r.d*CS/2,wallZ=rz-hd+.45;
  switch(r.kind){
   case 'office':PR.place(22,rx-hw+.4,rz+.2,Math.PI/2,k);if(l1Hash(k,3,65)<.5)PR.place(11,rx+hw-.4,rz+hd-.4,-Math.PI/2,k,.4-WT/2);P(box,C.desk,rx,.38,wallZ+.2,1.4,.05,.7);for(const a of[-.65,.65])P(box,C.steelP,rx+a,.18,wallZ+.2,.04,.36,.66);P(box,C.crt,rx-.2,.6,wallZ+.15,.42,.38,.4);G(GLOW.screen,rx-.2,.62,wallZ+.36,.32,.26,.01);PR.place(6,rx+.3,wallZ+.9,Math.PI+.4,k);PR.place(16,rx+.6,rz+.4,0,k);break;
   case 'barber':{// image-23: two chairs side by side against the back wall, wet-floor sign, AC unit, pipes under the ceiling, a bin
    const bz=rz-hd+.75;PR.place(5,rx-.45,bz,0,k);PR.place(5,rx+.45,bz+.25,-.15,k+1);P(box,C.mirror,rx,1.5,rz-hd+.1,1.6,.7,.02);P(box,C.desk,rx,.95,rz-hd+.2,1.7,.04,.24);
    PR.place(8,rx-.1,bz+1.0,.5,k);PR.place(9,rx+hw-.3,rz+.3,Math.PI/2,k);P(vcyl,C.bucket,rx+.95,.17,bz-.1,.13,.34,.13);
    P(gcylR,C.pipeG,rx,HC-.18,rz-hd+.3,r.w*CS,.05,.05);P(gcylR,C.pipeG,rx,HC-.3,rz-hd+.45,r.w*CS,.035,.035);P(box,C.pipeG,rx+hw-.25,HC-.6,rz-hd+.3,.07,.8,.07);P(box,C.hose,rx+hw-.25,HC-1.05,rz-hd+.3,.14,.18,.14);
    if(l1Hash(k,2,64)<.6)PR.place(6,rx-hw+.5,rz+hd-.6,2.4,k);break;}
   case 'infirmary':P(box,C.steelP,rx-.3,.3,rz,1.0,.06,2.0);P(box,C.mattress,rx-.3,.42,rz,.92,.14,1.9);for(const a of[-.45,.45])for(const b of[-.95,.95])P(box,C.steelP,rx-.3+a,.15,rz+b,.04,.3,.04);P(box,C.desk,rx+.65,.32,rz-.7,.45,.64,.45);PR.place(7,rx+.7,rz+.5,0,k);break;
   case 'rubber':PR.place(6,rx,rz,.7,k);break;
   case 'paintings':for(let i=0;i<4;i++){const cc=C['canvas'+(i%3)];P(box,cc,rx-hw+.8+i*.9,1.5,wallZ-.4,.6,.75,.03);}for(let i=0;i<3;i++){const cc=C['canvas'+((i+1)%3)];P(box,cc,rx-.6+i*.7,.35,rz+.4,.55,.7,.03,(i-1)*.3,-.25);}break;
   case 'storage':PR.place(4,rx-hw+.8,rz+hd-.8,.1,k+3);PR.place(18,rx+hw-.45,rz+.2,-Math.PI/2,k,.45-WT/2);PR.place(0,rx-.6,rz-.5,0,k);PR.place(4,rx+.5,rz+.3,.2,k+1);PR.place(1,rx+.8,rz-.7,.6,k+2);break;
   case 'boards':PR.place(10,rx,wallZ-.2,0,k,.25-WT/2);PR.place(16,rx,rz+.4,0,k);break;
   default:if(l1Hash(k,1,61)<.5)PR.place(16,rx,rz,0,k);}}
 // ---- collision (analytic, from the cached maze) ----
 function blocked(x,z,r){for(const[dx,dz]of[[0,0],[r,0],[-r,0],[0,r],[0,-r]]){const m=at(x+dx,z+dz);if(!m)continue;const c=m.c,lx=(x-c.ox*B)/CS,lz=(z-c.oz*B)/CS,cx=Math.floor(lx),cz=Math.floor(lz),hw=WT/2/CS+r/CS;
   for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){const a=cx+i,b=cz+j;if(a<0||b<0||a>=m.N||b>=m.M)continue;
    if(closedE(m,a,b)&&Math.abs(lx-(a+1))<hw&&lz>b-hw&&lz<b+1+hw)return true;if(closedS(m,a,b)&&Math.abs(lz-(b+1))<hw&&lx>a-hw&&lx<a+1+hw)return true;}
   }return false;}
 function roomAt(x,z){const m=at(x,z);if(!m)return null;const c=m.c,cx=Math.floor((x-c.ox*B)/CS),cz=Math.floor((z-c.oz*B)/CS);if(cx<0||cz<0||cx>=m.N||cz>=m.M)return '';const r=m.room[m.I(cx,cz)];return r>=0?m.rooms[r].kind:'';}
 // nearest live lamps around (x,z) for the shader's fixed point-light slots
 function lampsNear(x,z,n){const out=[],bx=Math.floor(x/B),bz=Math.floor(z/B),seen=new Set();for(let j=-3;j<=3;j++)for(let i=-3;i<=3;i++){const a=bx+i*3,b=bz+j*3;const c=l1Clu(a,b);if(!c||seen.has(c.id))continue;seen.add(c.id);
   if(Math.abs(c.ox*B+c.w*4-x)>c.w*4+30||Math.abs(c.oz*B+c.d*4-z)>c.d*4+30)continue;for(const L of data(c).lamps)if(L.on)out.push([Math.hypot(L.x-x,L.z-z),L]);}
  out.sort((a,b)=>a[0]-b[0]);return out.slice(0,n).map(v=>v[1]);}
 function nearest(x,z){let best=null;const bx=Math.floor(x/B),bz=Math.floor(z/B);for(let j=-12;j<=12;j++)for(let i=-12;i<=12;i++){const c=l1Clu(bx+i*16,bz+j*16);if(!c)continue;const m=data(c);for(const d of m.ext){const px=c.ox*B+(d.x+.5)*CS+d.nx*(CS/2+2.2),pz=c.oz*B+(d.z+.5)*CS+d.nz*(CS/2+2.2),r=Math.hypot(px-x,pz-z);if(!best||r<best.r)best={r,x:px,z:pz,yaw:Math.atan2(d.nx,d.nz)};}}return best;}
 function map(ctx,sx,sz,scale,x0,x1,z0,z1,P={cluBg:'#2a2826',cluRoom:'#3a3530',cluWall:'#e6e0d4'}){const seen=new Set();for(let bz=z0;bz<=z1;bz++)for(let bx=x0;bx<=x1;bx++){if(!l1InClu(bx,bz))continue;const c=l1Clu(bx,bz);if(seen.has(c.id))continue;seen.add(c.id);const m=data(c),OX=c.ox*B,OZ=c.oz*B;
   ctx.fillStyle=P.cluBg;ctx.fillRect(sx(OX),sz(OZ),c.w*B*scale,c.d*B*scale);for(const r of m.rooms){ctx.fillStyle=P.cluRoom;ctx.fillRect(sx(OX+r.x*CS),sz(OZ+r.z*CS),r.w*CS*scale,r.d*CS*scale);}
   ctx.fillStyle=P.cluWall;const t=Math.max(1,WT*scale);for(let z=0;z<m.M;z++)for(let x=0;x<m.N;x++){if(closedE(m,x,z))ctx.fillRect(sx(OX+(x+1)*CS)-t/2,sz(OZ+z*CS),t,CS*scale+t/2);if(closedS(m,x,z))ctx.fillRect(sx(OX+x*CS),sz(OZ+(z+1)*CS)-t/2,CS*scale+t/2,t);}}}
 return{bay,blocked,roomAt,lampsNear,nearest,map,data,at};
}
