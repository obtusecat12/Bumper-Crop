import * as T from './vendor/three.module.min.js';
import {mergeVertices} from './vendor/BufferGeometryUtils.js';
// Worker-only vertex clustering. Every surviving face references the SAME
// welded cluster position as its neighbours. Dropping small triangles while
// retaining their original positions punched holes through sacks and crates.
// Full-resolution geometry is immutable and always used inside the near zone.
export const STATIC_LOD_NEAR=32;
export function bakeStaticMeshLOD(mesh){
 const source=mesh.geometry,count=source.index?.count||source.attributes.position.count;
 if(count<900)return;
 // Merged triangle soups repeat every complete vertex record. Weld identical
 // records before building alternatives; UV/normal/material seams stay split.
 const g=mergeVertices(source,1e-6),p=g.attributes.position;
 mesh.geometry=g;source.dispose();
 const full=g.index?Array.from(g.index.array):Array.from({length:p.count},(_,i)=>i);
 const attributes=Object.entries(g.attributes).filter(([,a])=>!a.isInstancedBufferAttribute);
 const addedSources=[],addedPositions=[];
 const indices=[...full],ranges=[{start:0,count:full.length}];let vertexCount=p.count;
 for(const cell of [.18,.64]){
  const clusters=new Map(),welded=new Array(p.count);
  for(let i=0;i<p.count;i++){
   const x=p.getX(i),y=p.getY(i),z=p.getZ(i),key=`${Math.round(x/cell)},${Math.round(y/cell)},${Math.round(z/cell)}`;
   let cluster=clusters.get(key);if(!cluster){cluster={id:clusters.size,x:0,y:0,z:0,n:0};clusters.set(key,cluster);}
   cluster.x+=x;cluster.y+=y;cluster.z+=z;cluster.n++;welded[i]=cluster;
  }
  for(const c of clusters.values()){c.x/=c.n;c.y/=c.n;c.z/=c.n;}
  const remap=new Map(),start=indices.length;
  function vertex(i){
   if(remap.has(i))return remap.get(i);const id=vertexCount++,c=welded[i];remap.set(i,id);
   addedSources.push(i);addedPositions.push(c.x,c.y,c.z);
   return id;
  }
  for(let j=0;j<full.length;j+=3){
   const ia=full[j],ib=full[j+1],ic=full[j+2],a=welded[ia],b=welded[ib],c=welded[ic];
   if(a===b||b===c||a===c)continue;
   const bx=b.x-a.x,by=b.y-a.y,bz=b.z-a.z,cx=c.x-a.x,cy=c.y-a.y,cz=c.z-a.z;
   if((by*cz-bz*cy)**2+(bz*cx-bx*cz)**2+(bx*cy-by*cx)**2<1e-18)continue;
   indices.push(vertex(ia),vertex(ib),vertex(ic));
  }
  ranges.push({start,count:indices.length-start});
 }
 for(const [name,a]of attributes){
  const out=new a.array.constructor(vertexCount*a.itemSize);out.set(a.array);
  if(name==='position')out.set(addedPositions,a.array.length);
  else for(let i=0;i<addedSources.length;i++){const src=addedSources[i]*a.itemSize,dst=(p.count+i)*a.itemSize;for(let k=0;k<a.itemSize;k++)out[dst+k]=a.array[src+k];}
  g.setAttribute(name,new T.BufferAttribute(out,a.itemSize,a.normalized));
 }
 g.setIndex(new T.BufferAttribute(new (vertexCount>65535?Uint32Array:Uint16Array)(indices),1));
 g.setDrawRange(0,full.length);g.userData.staticLOD=[ranges[0],ranges[1],ranges[1],ranges[2],ranges[2]];g.userData.staticLODTopology='welded-clusters-v43';
}
export function bindStaticMeshLOD(mesh){
 const ranges=mesh.geometry.userData.staticLOD;if(!ranges)return;let start=0,count=0;
 mesh.onBeforeShadow=(_r,_o,_camera,_shadow,g)=>{start=g.drawRange.start;count=g.drawRange.count;const range=ranges.at(-1);g.setDrawRange(range.start,range.count);};
 mesh.onAfterShadow=(_r,_o,_camera,_shadow,g)=>g.setDrawRange(start,count);
}
export function selectMeshLOD(mesh,distance){
 const ranges=mesh.geometry.userData.staticLOD;if(!ranges)return;
 const range=ranges[distance<STATIC_LOD_NEAR?0:distance<95?1:2];mesh.geometry.setDrawRange(range.start,range.count);
}
