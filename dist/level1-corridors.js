// Level 1 "小径" corridors: behind the halls' push doors. Tight, non-anomalous white-concrete maze,
// dim single tubes, purposeless side rooms (wiki list). INFINITE: 8×8-cell (24 m) chunks, each a
// hashed spanning-tree maze; every chunk edge has 1–2 hashed openings shared by both neighbours,
// so the whole plane is one connected labyrinth. 3×3 chunk window, one chunk built per frame.
// Fixed light count (6 point lights re-targeted to the nearest lamps) → no recompiles.
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
import {l1Hash,l1Rebase} from './level1-layout.js?v=108';
const CELL=3,CN=8,CK=CELL*CN,HC=2.75,WT=.22;
const KINDS=['office','brick','infirmary','rubber','paintings','mattress','empty','empty'];
export function createLevel1Corridors(T,renderer,textures){
 const scene=new T.Scene();scene.background=new T.Color(0x0d0f10);scene.fog=new T.FogExp2(0x101315,.06);
 const rebase=l1Rebase(scene);
 const wallMat=new T.MeshLambertMaterial({map:textures.wall,color:0xf2f4f3}),floorMat=new T.MeshLambertMaterial({map:textures.floor,color:0xb8bab9}),ceilMat=new T.MeshLambertMaterial({map:textures.ceil,color:0xd6d8d8});
 const plain=c=>new T.MeshLambertMaterial({color:c}),glow=new T.MeshBasicMaterial({color:0xf2f8ff,toneMapped:false}),bulbM=new T.MeshBasicMaterial({color:0xfff1c8,toneMapped:false}),exitM=new T.MeshBasicMaterial({color:0x25ff5a,toneMapped:false}),crtM=new T.MeshBasicMaterial({color:0x5f8f86,toneMapped:false});
 const M={door:plain(0x2a2c2e),frame:plain(0x4a4c4c),desk:plain(0x6b5a44),metal:plain(0x7b8184),beige:plain(0xc9bc9c),rubber:plain(0xc8c2b0),brick:plain(0x8a4a36),bed:plain(0xdfe3e2),sheet:plain(0x9fb7b5),mattress:plain(0x9c9078),canvas:plain(0x7a6f58),chair:plain(0x3b3f43),ply:plain(0xa8875a),sign:plain(0x1a1e1c)};
 const amb=new T.HemisphereLight(0xdfe6ea,0xb0b4b4,.45);scene.add(amb);
 const lights=Array.from({length:6},()=>{const l=new T.PointLight(0xe8f0ff,0,9,1.6);scene.add(l);return l;});
 let seed=0,power=1;
 const h=(a,b,s)=>l1Hash(a+seed*131,b-seed*71,s);
 // ---------- pure layout (no geometry): maze per chunk, cached ----------
 const mazes=new Map();
 // openings on the edge x=cx*CK (between chunk cx-1 and cx) at chunk row cz: rows 1..6 (corners stay solid)
 const edgeV=(cx,cz)=>{const a=1+Math.floor(h(cx,cz,201)*6),b=1+Math.floor(h(cx,cz,202)*6);return h(cx,cz,203)<.45?[a]:[a,b];};
 const edgeH=(cx,cz)=>{const a=1+Math.floor(h(cx,cz,211)*6),b=1+Math.floor(h(cx,cz,212)*6);return h(cx,cz,213)<.45?[a]:[a,b];};
 function maze(cx,cz){const k=cx+','+cz;let m=mazes.get(k);if(m)return m;
  const e=new Uint8Array(CN*CN),s=new Uint8Array(CN*CN),v=new Uint8Array(CN*CN),i=(x,z)=>z*CN+x;
  const sx=Math.floor(h(cx,cz,100)*CN),sz=Math.floor(h(cx,cz,101)*CN),st=[[sx,sz]];v[i(sx,sz)]=1;let n=0;
  while(st.length){const[x,z]=st[st.length-1];const nb=[];for(const[dx,dz]of[[1,0],[-1,0],[0,1],[0,-1]]){const a=x+dx,b=z+dz;if(a>=0&&b>=0&&a<CN&&b<CN&&!v[i(a,b)])nb.push([dx,dz]);}
   if(!nb.length){st.pop();continue;}const[dx,dz]=nb[Math.floor(h(cx*CN+x,cz*CN+z,102+(n++&7))*nb.length)];const a=x+dx,b=z+dz;
   if(dx===1)e[i(x,z)]=1;if(dx===-1)e[i(a,b)]=1;if(dz===1)s[i(x,z)]=1;if(dz===-1)s[i(a,b)]=1;v[i(a,b)]=1;st.push([a,b]);}
  // a few loops so it is labyrinthine rather than a tree
  for(let j=0;j<5;j++){const x=Math.floor(h(cx,cz,120+j)*(CN-1)),z=Math.floor(h(cx,cz,130+j)*(CN-1));if(h(cx,cz,140+j)>.5)e[i(x,z)]=1;else s[i(x,z)]=1;}
  m={cx,cz,e,s,room:new Array(CN*CN).fill(null),openSide:new Array(CN*CN).fill(null),exit:null};mazes.set(k,m);
  if(mazes.size>400)mazes.delete(mazes.keys().next().value);
  // dead ends → purposeless rooms (wiki list); never the arrival cell
  for(let z=0;z<CN;z++)for(let x=0;x<CN;x++){const gx=cx*CN+x,gz=cz*CN+z;if(gx===0&&gz===0)continue;const o=openings(gx,gz,m);if(o.length!==1||h(gx,gz,40)>.6)continue;
   m.room[i(x,z)]=KINDS[Math.floor(h(gx,gz,41)*KINDS.length)];m.openSide[i(x,z)]=o[0];}
  // ~40 % of chunks get one green-lit exit door back to the Aquila halls, on a closed wall of a plain cell
  if(h(cx,cz,150)<.4&&!(cx===0&&cz===0)){const x=1+Math.floor(h(cx,cz,151)*6),z=1+Math.floor(h(cx,cz,152)*6);if(!m.room[i(x,z)]){const gx=cx*CN+x,gz=cz*CN+z,o=openings(gx,gz,m),sides=['+x','-x','+z','-z'].filter(d=>!o.includes(d));
    if(sides.length){const d=sides[Math.floor(h(cx,cz,153)*sides.length)],X=gx*CELL+CELL/2,Z=gz*CELL+CELL/2,nx=d==='+x'?1:d==='-x'?-1:0,nz=d==='+z'?1:d==='-z'?-1:0;m.exit={x:X+nx*(CELL/2-WT/2),z:Z+nz*(CELL/2-WT/2),nx,nz};}}}
  return m;}
 // wall on the east side of global cell (gx,gz)? / south side?
 function wallE(gx,gz,m){const cx=Math.floor(gx/CN),cz=Math.floor(gz/CN),lx=gx-cx*CN,lz=gz-cz*CN;if(lx===CN-1)return !edgeV(cx+1,cz).includes(lz);m=m&&m.cx===cx&&m.cz===cz?m:maze(cx,cz);return !m.e[lz*CN+lx];}
 function wallS(gx,gz,m){const cx=Math.floor(gx/CN),cz=Math.floor(gz/CN),lx=gx-cx*CN,lz=gz-cz*CN;if(lz===CN-1)return !edgeH(cx,cz+1).includes(lx);m=m&&m.cx===cx&&m.cz===cz?m:maze(cx,cz);return !m.s[lz*CN+lx];}
 // the entry door wall (west of cell 0,0) is always closed: edge rows are 1..6
 function openings(gx,gz,m){const o=[];if(!wallE(gx,gz,m))o.push('+x');if(!wallE(gx-1,gz,m))o.push('-x');if(!wallS(gx,gz,m))o.push('+z');if(!wallS(gx,gz-1,m))o.push('-z');return o;}
 // ---------- geometry ----------
 const tmp=new T.Object3D(),box=new T.BoxGeometry(1,1,1);let ox0=0,oz0=0,ux=[0,0,0],uz=[0,0,0];
 const fr=v=>v-Math.floor(v);
 function geo(list,g,x,y,z,w,hh,d,ry=0){tmp.position.set(x-ox0,y,z-oz0);tmp.rotation.set(0,ry,0);tmp.scale.set(w,hh,d);tmp.updateMatrix();const c=g.clone().applyMatrix4(tmp.matrix);
  // world-space UVs (chunk-local + exact fractional chunk offset) so tiled concrete reads at a constant scale and stays continuous
  const p=c.attributes.position,n=c.attributes.normal,uv=c.attributes.uv;for(let i=0;i<p.count;i++){const ax=Math.abs(n.getX(i)),ay=Math.abs(n.getY(i)),X=p.getX(i),Z=p.getZ(i);
   uv.setXY(i,ay>.5?X*.42+ux[0]:ax>.5?Z*.33+uz[1]:X*.33+ux[1],ay>.5?Z*.42+uz[0]:p.getY(i)*.31);}list.push(c);}
 function buildChunk(cx,cz){const m=maze(cx,cz);ox0=cx*CK;oz0=cz*CK;ux=[fr(ox0*.42),fr(ox0*.33)];uz=[fr(oz0*.42),fr(oz0*.33)];
  const walls=[],floors=[],ceils=[],parts=[],tubes=[],lamps=[],solids=[];
  const add=(mm,...a)=>{const l=[];geo(l,box,...a);parts.push([mm,l[0]]);};
  geo(floors,box,ox0+CK/2,-.05,oz0+CK/2,CK,.1,CK);geo(ceils,box,ox0+CK/2,HC+.05,oz0+CK/2,CK,.1,CK);
  for(let z=0;z<CN;z++)for(let x=0;x<CN;x++){const gx=cx*CN+x,gz=cz*CN+z,X=gx*CELL,Z=gz*CELL;
   if(wallE(gx,gz,m))geo(walls,box,X+CELL,HC/2,Z+CELL/2,WT,HC,CELL+WT);
   if(wallS(gx,gz,m))geo(walls,box,X+CELL/2,HC/2,Z+CELL,CELL+WT,HC,WT);
   if(h(gx,gz,5)>.5||(gx<=1&&gz===0))lamps.push({x:X+CELL/2,z:Z+CELL/2});
   const kind=m.room[z*CN+x];if(kind)room(kind,m.openSide[z*CN+x],gx,gz,X+CELL/2,Z+CELL/2,add,solids,lamps);}
  // arrival door back to the halls (west wall of cell 0,0)
  if(cx===0&&cz===0){add(M.frame,.14,1.1,CELL/2,.04,2.24,2.08);add(M.door,.16,1.05,CELL/2,.06,2.1,1.9);add(M.sign,.15,2.45,CELL/2,.05,.17,.42);add(exitM,.19,2.45,CELL/2,.02,.12,.36);}
  // hashed exit door: dark steel door + lit green EXIT sign, flush on the wall face
  if(m.exit){const{x,z,nx,nz}=m.exit,ax=nx!==0,o=.02;const P=(mm,off,y,w,hh)=>add(mm,x-nx*off,y,z-nz*off,ax?.04:w,hh,ax?w:.04);
   P(M.frame,o+.01,1.1,2.08,2.24);P(M.door,o+.03,1.05,1.9,2.1);P(M.metal,o+.05,1.05,.5,.04);P(M.sign,o+.03,2.45,.42,.17);P(exitM,o+.06,2.45,.36,.12);lamps.push({x:x-nx*.9,z:z-nz*.9,exit:true});}
  const grp=new Map();for(const[mm,g]of parts){if(!grp.has(mm))grp.set(mm,[]);grp.get(mm).push(g);}
  const group=new T.Group();group.position.set(ox0,0,oz0);
  for(const[mm,list]of grp){group.add(new T.Mesh(mergeGeometries(list,false),mm));list.forEach(g=>g.dispose());}
  group.add(new T.Mesh(mergeGeometries(walls,false),wallMat),new T.Mesh(mergeGeometries(floors,false),floorMat),new T.Mesh(mergeGeometries(ceils,false),ceilMat));
  for(const l of lamps)if(!l.bulb&&!l.exit)geo(tubes,box,l.x,HC-.03,l.z,1.2,.04,.07);if(tubes.length)group.add(new T.Mesh(mergeGeometries(tubes,false),glow));
  [...walls,...floors,...ceils,...tubes].forEach(g=>g.dispose());
  return{cx,cz,group,lamps,solids,exit:m.exit};}
 function room(kind,openSide,gx,gz,X,Z,add,solids,lamps){const hr=s=>h(gx,gz,s);
  const liner=(mm)=>{for(const s of [-1,1]){if(openSide!==(s>0?'+x':'-x')){add(mm,X+s*1.32,HC/2,Z,.12,HC,2.7);solids.push({x:X+s*1.32,z:Z,w:.12,d:2.7});}if(openSide!==(s>0?'+z':'-z')){add(mm,X,HC/2,Z+s*1.32,2.7,HC,.12);solids.push({x:X,z:Z+s*1.32,w:2.7,d:.12});}}};
  if(kind==='office'){add(M.desk,X,.74,Z-.6,1.3,.05,.65);solids.push({x:X,z:Z-.6,w:1.35,d:.7});add(M.metal,X-.55,.37,Z-.6,.05,.72,.6);add(M.metal,X+.55,.37,Z-.6,.05,.72,.6);add(M.beige,X,1.0,Z-.7,.42,.38,.4);add(crtM,X,1.0,Z-.49,.32,.26,.01);add(M.chair,X,.45,Z+.1,.45,.08,.45);add(M.metal,X,.22,Z+.1,.05,.44,.05);add(bulbM,X,2.2,Z,.09,.12,.09);add(M.frame,X,2.47,Z,.01,.5,.01);lamps.push({x:X,z:Z,bulb:true});}
  else if(kind==='brick')liner(M.brick);
  else if(kind==='infirmary'){add(M.metal,X,.32,Z,.9,.04,1.95);add(M.bed,X,.42,Z,.88,.14,1.9);solids.push({x:X,z:Z,w:.95,d:2});add(M.sheet,X,.5,Z+.2,.9,.04,1.2);add(M.bed,X,.55,Z-.82,.6,.16,.3);for(const s of [-1,1])add(M.metal,X+s*1.05,.4,Z,.45,.8,.6);}
  else if(kind==='rubber'){liner(M.rubber);add(M.rubber,X,.02,Z,2.6,.04,2.6);add(M.chair,X,.12,Z,.48,.06,.48);add(M.chair,X+.2,.3,Z,.06,.5,.48);}
  else if(kind==='paintings'){for(let i=0;i<3;i++){const a=hr(50+i);add(M.canvas,X-1.3+.04,1.5,Z-.8+i*.8,.03,.55+a*.3,.45+a*.2);}add(M.canvas,X,.02,Z+.3,.7,.03,.5,.4);add(M.ply,X+1.1,.7,Z-1.1,.03,1.4,.9,.2);}
  else if(kind==='mattress'){for(let i=0;i<3;i++)add(M.mattress,X-.6+i*.6,.1+i*.02,Z+(hr(60+i)-.5),.9,.18,1.9,hr(63+i)*.5);}}
 // ---------- streaming ----------
 const chunks=new Map(),key=(a,b)=>a+','+b;let want=[],center='';
 function chunkAt(cx,cz){const k=key(cx,cz);let c=chunks.get(k);if(!c){c=buildChunk(cx,cz);chunks.set(k,c);scene.add(c.group);}return c;}
 function drop(k,c){scene.remove(c.group);c.group.traverse(o=>o.geometry?.dispose());chunks.delete(k);}
 function plan(x,z){const ccx=Math.floor(x/CK),ccz=Math.floor(z/CK),k=key(ccx,ccz);if(k===center)return;center=k;want=[];
  for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++)if(!chunks.has(key(ccx+dx,ccz+dz)))want.push([ccx+dx,ccz+dz]);
  want.sort((a,b)=>Math.abs(a[0]-ccx)+Math.abs(a[1]-ccz)-Math.abs(b[0]-ccx)-Math.abs(b[1]-ccz));
  for(const[k2,c]of chunks)if(Math.abs(c.cx-ccx)>2||Math.abs(c.cz-ccz)>2)drop(k2,c);}
 function ensure(x,z){const cx=Math.floor(x/CK),cz=Math.floor(z/CK);chunkAt(cx,cz);for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++)chunkAt(cx+dx,cz+dz);center='';plan(x,z);}
 // a new door seed = a different endless labyrinth
 function build(s){for(const[k,c]of chunks)drop(k,c);mazes.clear();seed=s;center='';want=[];const p={x:1.2,z:CELL/2,yaw:-Math.PI/2};rebase.update(p.x,p.z);ensure(p.x,p.z);return p;}
 // ---------- collision: walls from the pure layout (works before a chunk is built), props from built chunks ----------
 function blocked(x,z,r=.25){const gx=Math.floor(x/CELL),gz=Math.floor(z/CELL),hw=WT/2+r;
  if(x<hw&&x>-hw&&z>0&&z<CELL)return true; // arrival door wall
  for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){const a=gx+i,b=gz+j,X=a*CELL,Z=b*CELL;
   if(Math.abs(x-(X+CELL))<hw&&z>Z-hw&&z<Z+CELL+hw&&wallE(a,b))return true;
   if(Math.abs(z-(Z+CELL))<hw&&x>X-hw&&x<X+CELL+hw&&wallS(a,b))return true;}
  for(const c of chunks.values()){if(x<c.cx*CK-2||x>c.cx*CK+CK+2||z<c.cz*CK-2||z>c.cz*CK+CK+2)continue;for(const s of c.solids)if(Math.abs(x-s.x)<s.w/2+r&&Math.abs(z-s.z)<s.d/2+r)return true;}return false;}
 function atDoor(x,z){if(x<1.3&&x>-.2&&Math.abs(z-CELL/2)<1.1)return{back:true};
  const m=maze(Math.floor(x/CK),Math.floor(z/CK)),near=[m];for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++)if(i||j)near.push(maze(m.cx+i,m.cz+j));
  for(const n of near){const e=n.exit;if(e&&Math.abs(x-e.x)<(e.nx?1.3:1.1)&&Math.abs(z-e.z)<(e.nz?1.3:1.1))return{back:true,exit:true,label:'E 推开绿灯出口门 · 回到天鹰段'};}return null;}
 let near=[],tick=0;
 function update(dt,x,z,pw){power=pw;if(rebase.update(x,z)){}plan(x,z);if(want.length){const[a,b]=want.shift();chunkAt(a,b);}
  if((tick+=dt)>.1||!near.length){tick=0;const all=[];for(const c of chunks.values())for(const l of c.lamps)all.push([l,(l.x-x)**2+(l.z-z)**2]);all.sort((a,b)=>a[1]-b[1]);near=all.slice(0,6);}
  lights.forEach((L,i)=>{const n=near[i];if(!n){L.intensity=0;return;}const l=n[0];L.position.set(l.x,HC-.55,l.z);L.color.set(l.exit?0x48ff7a:l.bulb?0xffe2b0:0xe8f0ff);L.distance=l.exit?4:9;L.intensity=(l.exit?1.6:l.bulb?4.5:9.5)*(l.exit?1:pw);});
  glow.color.setScalar(.04+.96*pw);bulbM.color.setRGB(.04+.96*pw,(.04+.96*pw)*.94,(.04+.96*pw)*.78);amb.intensity=.03+.42*pw;}
 function roomAt(x,z){const gx=Math.floor(x/CELL),gz=Math.floor(z/CELL),cx=Math.floor(gx/CN),cz=Math.floor(gz/CN);return maze(cx,cz).room[(gz-cz*CN)*CN+(gx-cx*CN)]||null;}
 // map: drawn cell by cell from the pure layout, so it never shows an edge
 function map(ctx,ox,oz,cxp,cyp,scale,radius){ctx.save();ctx.fillStyle='#141618';ctx.fillRect(cxp-radius*scale,cyp-radius*scale,radius*2*scale,radius*2*scale);
  const sx=v=>cxp+(v-ox)*scale,sz=v=>cyp+(v-oz)*scale,g0=Math.floor((ox-radius)/CELL)-1,g1=Math.ceil((ox+radius)/CELL)+1,k0=Math.floor((oz-radius)/CELL)-1,k1=Math.ceil((oz+radius)/CELL)+1,t=Math.max(1.5,WT*scale);
  ctx.fillStyle='#262a2c';for(let b=k0;b<=k1;b++)for(let a=g0;a<=g1;a++){const cx=Math.floor(a/CN),cz=Math.floor(b/CN);if(maze(cx,cz).room[(b-cz*CN)*CN+(a-cx*CN)])ctx.fillRect(sx(a*CELL)+1,sz(b*CELL)+1,CELL*scale-2,CELL*scale-2);}
  ctx.fillStyle='#d8dcdc';for(let b=k0;b<=k1;b++)for(let a=g0;a<=g1;a++){const X=a*CELL,Z=b*CELL;if(wallE(a,b))ctx.fillRect(sx(X+CELL)-t/2,sz(Z)-t/2,t,CELL*scale+t);if(wallS(a,b))ctx.fillRect(sx(X)-t/2,sz(Z+CELL)-t/2,CELL*scale+t,t);}
  ctx.fillStyle='#3fd36b';if(Math.abs(ox)<radius+4&&Math.abs(oz)<radius+4)ctx.fillRect(sx(0)-2,sz(CELL/2)-4,4,8);
  for(let cz=Math.floor(k0/CN);cz<=Math.floor(k1/CN);cz++)for(let cx=Math.floor(g0/CN);cx<=Math.floor(g1/CN);cx++){const e=maze(cx,cz).exit;if(e)ctx.fillRect(sx(e.x)-(e.nx?2:4),sz(e.z)-(e.nz?2:4),e.nx?4:8,e.nz?4:8);}
  ctx.restore();}
 return{scene,build,blocked,atDoor,update,roomAt,map,ensure,get seed(){return seed},stats:()=>({chunks:chunks.size,mazes:mazes.size,origin:{...rebase.o}})};
}
