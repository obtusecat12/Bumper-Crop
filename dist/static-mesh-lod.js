import * as T from './vendor/three.module.min.js';
// Immutable index ranges omit subpixel trim faces. Surviving vertices, UVs,
// normals and colours remain EXACTLY at their authored positions. This is done
// once in the worker, never by collapsing vertices in a shader.
export function bakeStaticMeshLOD(mesh){
 const g=mesh.geometry,p=g.attributes.position,count=g.index?.count||p.count;
 if(count<900)return;
 const full=g.index?Array.from(g.index.array):Array.from({length:p.count},(_,i)=>i),indices=[...full],ranges=[{start:0,count:full.length}];
 for(const cell of [.10,.24,.40]){
  const start=indices.length,seen=new Set();
  for(let i=0;i<full.length;i+=3){
   const a=full[i],b=full[i+1],c=full[i+2],key=id=>`${Math.round(p.getX(id)/cell)},${Math.round(p.getY(id)/cell)},${Math.round(p.getZ(id)/cell)}`;
   const ka=key(a),kb=key(b),kc=key(c);if(ka===kb||kb===kc||ka===kc)continue;
   // Collinear quantized points have no silhouette at this LOD's scale.
   const ax=Math.round(p.getX(a)/cell),ay=Math.round(p.getY(a)/cell),az=Math.round(p.getZ(a)/cell),bx=Math.round(p.getX(b)/cell)-ax,by=Math.round(p.getY(b)/cell)-ay,bz=Math.round(p.getZ(b)/cell)-az,cx=Math.round(p.getX(c)/cell)-ax,cy=Math.round(p.getY(c)/cell)-ay,cz=Math.round(p.getZ(c)/cell)-az;
   if((by*cz-bz*cy)**2+(bz*cx-bx*cz)**2+(bx*cy-by*cx)**2===0)continue;
   const normal=g.attributes.normal,face=normal?`${Math.round(normal.getX(a)*2)},${Math.round(normal.getY(a)*2)},${Math.round(normal.getZ(a)*2)}`:'',surface=g.attributes.surfaceParams?.getX(a)||0;
   const signature=[ka,kb,kc].sort().join('|')+':'+face+':'+surface;if(seen.has(signature))continue;seen.add(signature);indices.push(a,b,c);
  }ranges.push({start,count:indices.length-start});
 }
 g.setIndex(new T.BufferAttribute(new (p.count>65535?Uint32Array:Uint16Array)(indices),1));g.setDrawRange(0,full.length);g.userData.staticLOD=ranges;
}
export function bindStaticMeshLOD(mesh){
 const ranges=mesh.geometry.userData.staticLOD;if(!ranges)return;
 let start=0,count=0;
 mesh.onBeforeShadow=(_r,_o,_camera,_shadow,g)=>{start=g.drawRange.start;count=g.drawRange.count;const range=ranges[3];g.setDrawRange(range.start,range.count);};
 mesh.onAfterShadow=(_r,_o,_camera,_shadow,g)=>g.setDrawRange(start,count);
}
export function selectMeshLOD(mesh,distance){
 const ranges=mesh.geometry.userData.staticLOD;if(!ranges)return;
 const range=ranges[distance<32?0:distance<85?1:2];mesh.geometry.setDrawRange(range.start,range.count);
}
