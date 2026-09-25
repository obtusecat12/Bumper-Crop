import * as T from './vendor/three.module.min.js';
// Exact template vertices are fetched by instance variant. Similar vertex counts
// share a pool (<=144, <=288, <=432), so LOD/species do not split draw calls.
// Missing triangles collapse to one point; silhouettes/UV projection stay exact.
export function makeFoliageInstances(items,base,offset){
 const geometries=[...new Set(items.map(r=>r.m.geometry))],width=Math.max(...geometries.map(g=>g.index?.count||g.attributes.position.count)),height=geometries.length;
 const position=new Float32Array(width*height*4),normal=new Float32Array(width*height*4);
 for(let row=0;row<height;row++){
  const g=geometries[row],p=g.attributes.position,n=g.attributes.normal,f=g.attributes.natureFlex,idx=g.index,count=idx?.count||p.count;
  for(let v=0;v<width;v++){const i=v<count?(idx?idx.getX(v):v):0,k=(row*width+v)*4;
   position.set([p.getX(i),p.getY(i),p.getZ(i),f.getX(i)],k);normal.set([n.getX(i),n.getY(i),n.getZ(i),0],k);
  }
 }
 const tex=a=>{const t=new T.DataTexture(a,width,height,T.RGBAFormat,T.FloatType);t.minFilter=t.magFilter=T.NearestFilter;t.generateMipmaps=false;t.needsUpdate=true;return t;},positions=tex(position),normals=tex(normal);
 const count=items.reduce((n,r)=>n+r.m.count,0),geometry=new T.BufferGeometry(),variant=new Float32Array(count),phase=new Float32Array(count);
 geometry.setAttribute('position',new T.Float32BufferAttribute(new Float32Array(width*3),3));geometry.setAttribute('normal',new T.Float32BufferAttribute(new Float32Array(width*3),3));
 geometry.setAttribute('natureFlex',new T.Float32BufferAttribute(new Float32Array(width),1));geometry.setAttribute('batchVariant',new T.InstancedBufferAttribute(variant,1));geometry.setAttribute('batchPhase',new T.InstancedBufferAttribute(phase,1));
 const material=base.clone(),previous=base.onBeforeCompile,key=base.customProgramCacheKey();
 material.onBeforeCompile=function(s,r){
  previous.call(this,s,r);Object.assign(s.uniforms,{uLeafPositions:{value:positions},uLeafNormals:{value:normals}});
  s.vertexShader='uniform highp sampler2D uLeafPositions,uLeafNormals;attribute float batchVariant,batchPhase;\n'+s.vertexShader;
  s.vertexShader=s.vertexShader.replace('void main() {',`void main() {
   vec4 templatePosition=texelFetch(uLeafPositions,ivec2(gl_VertexID,int(batchVariant)),0);
   vec3 templateNormal=texelFetch(uLeafNormals,ivec2(gl_VertexID,int(batchVariant)),0).xyz;`);
  s.vertexShader=s.vertexShader.replace('#include <beginnormal_vertex>','vec3 objectNormal=templateNormal;').replace('#include <begin_vertex>','vec3 transformed=templatePosition.xyz;');
  s.vertexShader=s.vertexShader.replace('vRuralLocal=position;vRuralNormal=normal;','vRuralLocal=templatePosition.xyz;vRuralNormal=templateNormal;').replace('float nphase=instanceMatrix[3].x*.37+instanceMatrix[3].z*.29;','float nphase=batchPhase;').replace('float nflex=natureFlex;','float nflex=templatePosition.w;').replace('nphase+position.y*2.1','nphase+templatePosition.y*2.1');
 };
 material.customProgramCacheKey=()=>key+'|exact-foliage-variant-v38';
 const mesh=new T.InstancedMesh(geometry,material,count),a=new T.Matrix4(),m=new T.Matrix4(),color=new T.Color(),box=new T.Box3(),b=new T.Box3();let at=0;
 for(const {m:source}of items){const id=geometries.indexOf(source.geometry);if(!source.geometry.boundingBox)source.geometry.computeBoundingBox();
  for(let i=0;i<source.count;i++){
   source.getMatrixAt(i,a);phase[at]=a.elements[12]*.37+a.elements[14]*.29;variant[at]=id;m.multiplyMatrices(source.matrixWorld,a);m.elements[12]-=offset.x;m.elements[14]-=offset.z;mesh.setMatrixAt(at,m);
   if(source.instanceColor)source.getColorAt(i,color);else color.setRGB(1,1,1);mesh.setColorAt(at,color);at++;b.copy(source.geometry.boundingBox).applyMatrix4(m);box.union(b);
  }
 }
 mesh.boundingBox=box.expandByScalar(.5);mesh.boundingSphere=box.getBoundingSphere(new T.Sphere());
 // The shadow pass fetches the same template and the same pinned wind motion.
 const depth=new T.MeshDepthMaterial({side:T.DoubleSide,depthPacking:T.RGBADepthPacking});depth.onBeforeCompile=material.onBeforeCompile;depth.customProgramCacheKey=material.customProgramCacheKey;mesh.customDepthMaterial=depth;
 mesh.userData.variantInstances={variants:height,maxVertices:width,instances:count};
 mesh.userData.disposeBatch=()=>{positions.dispose();normals.dispose();geometry.dispose();material.dispose();depth.dispose();};return mesh;
}
