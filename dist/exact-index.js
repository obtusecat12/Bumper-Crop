// Exact vertex indexing without geometry simplification.
// T is the caller's Three.js namespace. Keeps triangle order and every attribute bit.
export function exactIndexGeometry(g,T){
 if(g.index||Object.keys(g.morphAttributes).length)return false;
 const attrs=Object.entries(g.attributes),count=g.attributes.position?.count;
 if(!count||attrs.some(([,a])=>a.isInterleavedBufferAttribute||a.isInstancedBufferAttribute||a.count!==count))return false;
 const views=attrs.map(([,a])=>new Uint8Array(a.array.buffer,a.array.byteOffset,a.array.byteLength));
 const map=new Map(),source=[],indices=new Array(count);
 for(let i=0;i<count;i++){
  let key='';
  for(let j=0;j<attrs.length;j++){
   const a=attrs[j][1],width=a.itemSize*a.array.BYTES_PER_ELEMENT,view=views[j];
   for(let k=i*width;k<(i+1)*width;k++)key+=String.fromCharCode(view[k]);
  }
  let index=map.get(key);
  if(index===undefined){index=source.length;map.set(key,index);source.push(i)}
  indices[i]=index;
 }
 const oldBytes=attrs.reduce((n,[,a])=>n+a.array.byteLength,0),indexBytes=count*(source.length<65536?2:4);
 if(source.length===count||oldBytes*source.length/count+indexBytes>=oldBytes)return false;
 for(const[name,a]of attrs){
  const array=new a.array.constructor(source.length*a.itemSize);
  const dest=new Uint8Array(array.buffer),width=a.itemSize*a.array.BYTES_PER_ELEMENT;
  const src=new Uint8Array(a.array.buffer,a.array.byteOffset,a.array.byteLength);
  source.forEach((from,to)=>dest.set(src.subarray(from*width,(from+1)*width),to*width));
  const next=new T.BufferAttribute(array,a.itemSize,a.normalized);
  next.name=a.name;next.setUsage(a.usage);next.gpuType=a.gpuType;
  g.setAttribute(name,next);
 }
 g.setIndex(indices);
 // Do not recompute normals, colors, bounds, triangle order, or geometry groups.
 return {before:count,after:source.length,bytesBefore:oldBytes,bytesAfter:oldBytes*source.length/count+indexBytes};
}
