// Level 1 "小径" corridors: behind the halls' push doors. Tight, non-anomalous white-concrete maze,
// dim single tubes, purposeless side rooms (wiki list). One finite complex per door seed.
// Fixed light count (6 point lights re-targeted to the nearest lamps) → no recompiles.
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
import {l1Hash} from './level1-layout.js';
const CELL=3,N=17,HC=2.75,WT=.22;
export function createLevel1Corridors(T,renderer,textures){
 const scene=new T.Scene();scene.background=new T.Color(0x0d0f10);scene.fog=new T.FogExp2(0x101315,.06);
 const lin=c=>new T.Color(c);
 const wallMat=new T.MeshLambertMaterial({map:textures.wall,color:0xf2f4f3}),floorMat=new T.MeshLambertMaterial({map:textures.floor,color:0xb8bab9}),ceilMat=new T.MeshLambertMaterial({map:textures.ceil,color:0xd6d8d8});
 const plain=c=>new T.MeshLambertMaterial({color:c}),glow=new T.MeshBasicMaterial({color:0xf2f8ff,toneMapped:false}),bulbM=new T.MeshBasicMaterial({color:0xfff1c8,toneMapped:false}),exitM=new T.MeshBasicMaterial({color:0x25ff5a,toneMapped:false}),crtM=new T.MeshBasicMaterial({color:0x5f8f86,toneMapped:false});
 const M={door:plain(0x2a2c2e),frame:plain(0x4a4c4c),desk:plain(0x6b5a44),metal:plain(0x7b8184),beige:plain(0xc9bc9c),rubber:plain(0xc8c2b0),brick:plain(0x8a4a36),bed:plain(0xdfe3e2),sheet:plain(0x9fb7b5),mattress:plain(0x9c9078),canvas:plain(0x7a6f58),chair:plain(0x3b3f43),ply:plain(0xa8875a)};
 const amb=new T.HemisphereLight(0xdfe6ea,0xb0b4b4,.45);scene.add(amb);
 const lights=Array.from({length:6},()=>{const l=new T.PointLight(0xe8f0ff,0,9,1.6);scene.add(l);return l;});
 let root=null,grid=null,lamps=[],solids=[],seedNow=0,power=1;
 const tmp=new T.Object3D();
 function geo(list,g,x,y,z,w,h,d,ry=0){tmp.position.set(x,y,z);tmp.rotation.set(0,ry,0);tmp.scale.set(w,h,d);tmp.updateMatrix();const c=g.clone().applyMatrix4(tmp.matrix);
  // world-space UVs so tiled concrete reads at a constant scale
  const p=c.attributes.position,n=c.attributes.normal,uv=c.attributes.uv;for(let i=0;i<p.count;i++){const ax=Math.abs(n.getX(i)),ay=Math.abs(n.getY(i));uv.setXY(i,ay>.5?p.getX(i)*.42:ax>.5?p.getZ(i)*.33:p.getX(i)*.33,ay>.5?p.getZ(i)*.42:p.getY(i)*.31);}list.push(c);}
 const box=new T.BoxGeometry(1,1,1);
 function build(seed){if(root){scene.remove(root);root.traverse(o=>o.geometry?.dispose());}root=new T.Group();scene.add(root);seedNow=seed;lamps=[];solids=[];
  const h=(a,b,s)=>l1Hash(a+seed*131,b-seed*71,s);
  // recursive-backtracker maze on N×N cells; entry at cell (0, N>>1) from the west
  grid=Array.from({length:N*N},()=>({e:false,s:false,v:false,room:null}));const at=(x,z)=>grid[z*N+x];const st=[[0,N>>1]];at(0,N>>1).v=true;let k=0;
  while(st.length){const[x,z]=st[st.length-1];const nb=[[1,0],[-1,0],[0,1],[0,-1]].filter(([dx,dz])=>{const a=x+dx,b=z+dz;return a>=0&&b>=0&&a<N&&b<N&&!at(a,b).v;});
   if(!nb.length){st.pop();continue;}const[dx,dz]=nb[Math.floor(h(x,z,k++)*nb.length)];const a=x+dx,b=z+dz;if(dx===1)at(x,z).e=true;if(dx===-1)at(a,b).e=true;if(dz===1)at(x,z).s=true;if(dz===-1)at(a,b).s=true;at(a,b).v=true;st.push([a,b]);}
  // a few loops so it is labyrinthine rather than a tree
  for(let i=0;i<N*2;i++){const x=Math.floor(h(i,1,90)*(N-1)),z=Math.floor(h(i,2,91)*(N-1));if(h(i,3,92)>.5)at(x,z).e=true;else at(x,z).s=true;}
  const walls=[],floors=[],ceils=[];const W=N*CELL;
  floors.length=0;geo(floors,box,W/2,-.05,W/2,W+1,.1,W+1);geo(ceils,box,W/2,HC+.05,W/2,W+1,.1,W+1);
  const wallX=(x0,x1,z)=>{geo(walls,box,(x0+x1)/2,HC/2,z,x1-x0+WT,HC,WT);solids.push({x:(x0+x1)/2,z,w:x1-x0+WT,d:WT});};
  const wallZ=(x,z0,z1)=>{geo(walls,box,x,HC/2,(z0+z1)/2,WT,HC,z1-z0+WT);solids.push({x,z:(z0+z1)/2,w:WT,d:z1-z0+WT});};
  for(let z=0;z<N;z++)for(let x=0;x<N;x++){const c=at(x,z),X=x*CELL,Z=z*CELL;
   if(!c.e)wallZ(X+CELL,Z,Z+CELL);if(!c.s)wallX(X,X+CELL,Z+CELL);if(x===0&&z!==(N>>1))wallZ(0,Z,Z+CELL);if(z===0)wallX(X,X+CELL,0);
   // tube lamp on ~1/3 of cells
   if(h(x,z,5)>.5||(x<=1&&z===(N>>1))){lamps.push({x:X+CELL/2,z:Z+CELL/2});}}
  // west entry: the push door back to the halls
  geo(walls,box,0,HC/2,(N>>1)*CELL+.15,WT,HC,.3);geo(walls,box,0,HC/2,(N>>1)*CELL+CELL-.15,WT,HC,.3);
  const parts=[];const add=(m,...a)=>{const l=[];geo(l,box,...a);parts.push([m,l[0]]);};
  add(M.door,.08,1.05,(N>>1)*CELL+CELL/2,.06,2.1,1.9);add(exitM,.16,2.45,(N>>1)*CELL+CELL/2,.02,.12,.36);
  // purposeless rooms in dead ends (cells with a single opening)
  const kinds=['office','brick','infirmary','rubber','paintings','mattress','empty','empty'];let ri=0;
  for(let z=1;z<N;z++)for(let x=1;x<N;x++){const c=at(x,z),open=(c.e?1:0)+(c.s?1:0)+(at(x-1,z).e?1:0)+(at(x,z-1).s?1:0);if(open!==1||h(x,z,40)>.55)continue;
   const kind=kinds[Math.floor(h(x,z,41)*kinds.length)],X=x*CELL+CELL/2,Z=z*CELL+CELL/2;ri++;c.room=kind;const openSide=c.e?'+x':c.s?'+z':at(x-1,z).e?'-x':'-z';
   const liner=(m)=>{for(const s of [-1,1]){if(openSide!==(s>0?'+x':'-x')){add(m,X+s*1.32,HC/2,Z,.12,HC,2.7);solids.push({x:X+s*1.32,z:Z,w:.12,d:2.7});}if(openSide!==(s>0?'+z':'-z')){add(m,X,HC/2,Z+s*1.32,2.7,HC,.12);solids.push({x:X,z:Z+s*1.32,w:2.7,d:.12});}}};
   if(kind==='office'){add(M.desk,X,.74,Z-.6,1.3,.05,.65);solids.push({x:X,z:Z-.6,w:1.35,d:.7});add(M.metal,X-.55,.37,Z-.6,.05,.72,.6);add(M.metal,X+.55,.37,Z-.6,.05,.72,.6);add(M.beige,X,1.0,Z-.7,.42,.38,.4);add(crtM,X,1.0,Z-.49,.32,.26,.01);add(M.chair,X,.45,Z+.1,.45,.08,.45);add(M.metal,X,.22,Z+.1,.05,.44,.05);add(bulbM,X,2.2,Z,.09,.12,.09);add(M.frame,X,2.47,Z,.01,.5,.01);lamps.push({x:X,z:Z,bulb:true});}
   else if(kind==='brick'){liner(M.brick);}
   else if(kind==='infirmary'){add(M.metal,X,.32,Z,.9,.04,1.95);add(M.bed,X,.42,Z,.88,.14,1.9);solids.push({x:X,z:Z,w:.95,d:2});add(M.sheet,X,.5,Z+.2,.9,.04,1.2);add(M.bed,X,.55,Z-.82,.6,.16,.3);for(const s of [-1,1])add(M.metal,X+s*1.05,.4,Z,.45,.8,.6);}
   else if(kind==='rubber'){liner(M.rubber);add(M.rubber,X,.02,Z,2.6,.04,2.6);add(M.chair,X,.12,Z,.48,.06,.48);add(M.chair,X+.2,.3,Z,.06,.5,.48);}
   else if(kind==='paintings'){for(let i=0;i<3;i++){const a=h(x,z,50+i);add(M.canvas,X-1.3+.04,1.5,Z-.8+i*.8,.03,.55+a*.3,.45+a*.2);}add(M.canvas,X,.02,Z+.3,.7,.03,.5,.4);add(M.ply,X+1.1,.7,Z-1.1,.03,1.4,.9,.2);}
   else if(kind==='mattress'){for(let i=0;i<3;i++)add(M.mattress,X-.6+i*.6,.1+i*.02,Z+(h(x,z,60+i)-.5),.9,.18,1.9,h(x,z,63+i)*.5);}
  }
  const grp=new Map();for(const[m,g]of parts){if(!grp.has(m))grp.set(m,[]);grp.get(m).push(g);}
  for(const[m,list]of grp){root.add(new T.Mesh(mergeGeometries(list,false),m));list.forEach(g=>g.dispose());}
  root.add(new T.Mesh(mergeGeometries(walls,false),wallMat),new T.Mesh(mergeGeometries(floors,false),floorMat),new T.Mesh(mergeGeometries(ceils,false),ceilMat));
  const tubes=[];for(const l of lamps)if(!l.bulb)geo(tubes,box,l.x,HC-.03,l.z,1.2,.04,.07);if(tubes.length)root.add(new T.Mesh(mergeGeometries(tubes,false),glow));
  [...walls,...floors,...ceils,...tubes].forEach(g=>g.dispose());
  return{x:1.2,z:(N>>1)*CELL+CELL/2,yaw:-Math.PI/2};}
 function blocked(x,z,r=.25){if(x<.2||z<.2||x>N*CELL-.2||z>N*CELL-.2)return true;for(const s of solids)if(Math.abs(x-s.x)<s.w/2+r&&Math.abs(z-s.z)<s.d/2+r)return true;return false;}
 function atDoor(x,z){return x<1.3&&Math.abs(z-((N>>1)*CELL+CELL/2))<1.1;}
 function update(dt,x,z,pw){power=pw;const near=lamps.map(l=>[l,(l.x-x)**2+(l.z-z)**2]).sort((a,b)=>a[1]-b[1]);
  lights.forEach((L,i)=>{const n=near[i];if(!n){L.intensity=0;return;}L.position.set(n[0].x,HC-.55,n[0].z);L.color.set(n[0].bulb?0xffe2b0:0xe8f0ff);L.intensity=(n[0].bulb?4.5:9.5)*pw;});
  glow.color.setScalar(.04+.96*pw);bulbM.color.setRGB(.04+.96*pw,(.04+.96*pw)*.94,(.04+.96*pw)*.78);amb.intensity=.03+.42*pw;}
 function roomAt(x,z){const c=grid?.[Math.floor(z/CELL)*N+Math.floor(x/CELL)];return c?.room||null;}
 function map(ctx,ox,oz,cx,cy,scale,radius){ctx.save();ctx.fillStyle='#141618';ctx.fillRect(cx-radius*scale,cy-radius*scale,radius*2*scale,radius*2*scale);ctx.fillStyle='#d8dcdc';for(const s of solids)ctx.fillRect(cx+(s.x-s.w/2-ox)*scale,cy+(s.z-s.d/2-oz)*scale,Math.max(1.5,s.w*scale),Math.max(1.5,s.d*scale));ctx.fillStyle='#3fd36b';ctx.fillRect(cx+(0-ox)*scale-2,cy+((N>>1)*CELL+CELL/2-oz)*scale-4,4,8);ctx.restore();}
 return{scene,build,blocked,atDoor,update,roomAt,map,get seed(){return seedNow}};
}
