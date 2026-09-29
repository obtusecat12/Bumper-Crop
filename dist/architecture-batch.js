import {worldSurfaceTextures,isSharedModelResource} from './models.js?v=57';
import {kephartSurfaceTextures} from './kephart-models.js?v=57';
import {landmarkTextures} from './landmark-textures.js?v=57';
import * as T from './vendor/three.module.min.js';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
import {buildingSurfaceTextures} from './buildings.js?v=57';
import {yardSurfaceTextures} from './yard-assets.js?v=57';
import {ruralTextures} from './rural-textures.js?v=57';
// Two shared arrays retain every texel at its original resolution. No palette
// flattening, texture resampling, geometry groups or per-colour draw calls.
let small,large,medium;
function setupPools(){if(small)return;small=[...buildingSurfaceTextures,...yardSurfaceTextures,...worldSurfaceTextures,...kephartSurfaceTextures];large=[ruralTextures.barnRed,ruralTextures.siloMetal];medium=Object.values(landmarkTextures);}
const resources=new Set();let bank;
function array(maps,size){
 const data=new Uint8Array(size*size*4*maps.length);
 maps.forEach((t,i)=>{const im=t.image;if(im.width===size)data.set(im.data,i*size*size*4);else for(let p=0;p<size*size;p++)data.set(im.data.subarray(0,4),(i*size*size+p)*4);});
 const a=new T.DataArrayTexture(data,size,size,maps.length);Object.assign(a,{wrapS:T.RepeatWrapping,wrapT:T.RepeatWrapping,magFilter:T.LinearFilter,minFilter:T.LinearMipmapLinearFilter,generateMipmaps:true,anisotropy:4,colorSpace:T.SRGBColorSpace});a.needsUpdate=true;resources.add(a);return a;
}
function getBank(){
 setupPools();if(bank)return bank;
 const tex128=array(small,128),tex512=array(large,512),tex256=array(medium,256);tex256.magFilter=T.NearestFilter;tex256.anisotropy=2;
 const mat=new T.MeshStandardMaterial({name:'Rural architecture / unified original surfaces',color:0xffffff,vertexColors:true,roughness:1,side:T.DoubleSide});
 mat.userData.architectureBatch=true;
 mat.onBeforeCompile=s=>{
  s.uniforms.uArchitecture128={value:tex128};s.uniforms.uArchitecture512={value:tex512};s.uniforms.uArchitecture256={value:tex256};
  s.vertexShader='attribute vec4 surfaceParams; flat varying vec4 vSurface; varying vec2 vSurfaceUV;\n'+s.vertexShader;
  s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvSurface=surfaceParams;vSurfaceUV=uv;');
  s.fragmentShader='uniform highp sampler2DArray uArchitecture128,uArchitecture512,uArchitecture256; flat varying vec4 vSurface; varying vec2 vSurfaceUV;\n'+s.fragmentShader;
  s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
   float surfaceSide=floor(vSurface.w/2.);
   if((surfaceSide==1.&&!gl_FrontFacing)||(surfaceSide==2.&&gl_FrontFacing))discard;
   if(vSurface.x>=0.){
    vec2 texUV=vSurfaceUV;
    if(mod(vSurface.w,2.)>.5)texUV=1.-abs(mod(texUV,2.)-1.);
    vec2 dx=dFdx(vSurfaceUV),dy=dFdy(vSurfaceUV);
    vec4 texel=vSurface.x<32.?textureGrad(uArchitecture128,vec3(texUV,vSurface.x),dx,dy):vSurface.x<64.?textureGrad(uArchitecture512,vec3(texUV,vSurface.x-32.),dx,dy):textureGrad(uArchitecture256,vec3(texUV,vSurface.x-64.),dx,dy);
    diffuseColor*=texel;
   }`);
  s.fragmentShader=s.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=vSurface.y;');
  s.fragmentShader=s.fragmentShader.replace('#include <metalnessmap_fragment>','#include <metalnessmap_fragment>\nmetalnessFactor=vSurface.z;');
 };
 mat.customProgramCacheKey=()=> 'architecture-original-texture-arrays-v38';resources.add(mat);bank={mat};return bank;
}
export function isSharedArchitectureResource(r){return resources.has(r);}
export function mergeArchitectureParts(parts,group,level){
 setupPools();const opaque=[],remaining=new Map();let triangles=0;
 for(const [mat,list]of parts){
  const layer=mat.map?small.includes(mat.map)?small.indexOf(mat.map):large.includes(mat.map)?32+large.indexOf(mat.map):medium.includes(mat.map)?64+medium.indexOf(mat.map):-2:-1;
  // Independent transparent water/glass keep their original sorting and shaders.
  if(mat.transparent||mat.isShaderMaterial||layer===-2){remaining.set(mat,list);continue;}
  const color=mat.color,mirror=mat.map?.wrapS===T.MirroredRepeatWrapping?1:0;mat.map?.updateMatrix();
  for(const g of list){
   const n=g.attributes.position.count,c=g.attributes.color,uv=g.attributes.uv,parameters=new Float32Array(n*4),mt=mat.map?.matrix.elements;
   for(let i=0;i<n;i++){
    c.setXYZ(i,c.getX(i)*color.r,c.getY(i)*color.g,c.getZ(i)*color.b);
    parameters.set([layer,mat.roughness,mat.metalness,mirror+(mat.side===T.FrontSide?2:mat.side===T.BackSide?4:0)],i*4);
    if(mt){const u=uv.getX(i),v=uv.getY(i);uv.setXY(i,mt[0]*u+mt[3]*v+mt[6],mt[1]*u+mt[4]*v+mt[7]);}
   }
   g.setAttribute('surfaceParams',new T.BufferAttribute(parameters,4));
   if(!g.hasAttribute('rayTwoSided'))g.setAttribute('rayTwoSided',new T.Uint8BufferAttribute(new Uint8Array(n),1));
   opaque.push(g);
  }
 }
 const add=(list,mat)=>{
  if(!list.length)return;const g=mergeGeometries(list,false);if(!g)throw Error('Architecture attributes are incompatible');
  for(const part of list)part.dispose();g.computeBoundingBox();g.computeBoundingSphere();
  const mesh=new T.Mesh(g,mat);mesh.name=mat.name||'Merged rural architecture';mesh.castShadow=level<2&&!mat.transparent;mesh.receiveShadow=true;if(mat.transparent)mesh.renderOrder=1;group.add(mesh);triangles+=g.attributes.position.count/3;
 };
 if(opaque.length)add(opaque,getBank().mat);for(const [mat,list]of remaining)add(list,mat);
 return {triangles,drawCalls:group.children.length};
}
const meanCache=new WeakMap();
export function architectureRayTint(layer){
 setupPools();const t=layer<0?null:layer<32?small[layer]:layer<64?large[layer-32]:medium[layer-64];if(!t)return [1,1,1];if(meanCache.has(t))return meanCache.get(t);
 const im=t.image,step=Math.max(1,Math.floor(Math.sqrt(im.width*im.height/2048))),sum=[0,0,0];let n=0;
 const lin=v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4;
 for(let y=0;y<im.height;y+=step)for(let x=0;x<im.width;x+=step){const k=(y*im.width+x)*4;for(let c=0;c<3;c++)sum[c]+=lin(im.data[k+c]/255);n++;}
 const mean=sum.map(c=>c/n);meanCache.set(t,mean);return mean;
}

export function consolidateStaticArchitecture(root,level,excluded=new Set()){
 setupPools();root.updateMatrixWorld(true);const inverse=root.matrixWorld.clone().invert(),matrix=new T.Matrix4(),parts=new Map(),remove=[];
 root.traverse(o=>{
  if(!o.isMesh||o.isInstancedMesh||o.material?.userData.architectureBatch||o.material?.transparent||!o.material?.isMeshStandardMaterial||o.material.emissive?.getHex()||o.material.onBeforeCompile!==T.Material.prototype.onBeforeCompile)return;
  for(let p=o;p&&p!==root;p=p.parent)if(p.userData.dynamicDoor||excluded.has(p))return;
  if(o.material.map&&![...small,...large,...medium].includes(o.material.map))return;
  const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(matrix.multiplyMatrices(inverse,o.matrixWorld));const count=g.attributes.position.count;
  for(const k of Object.keys(g.attributes))if(!['position','normal','uv','color','rayTwoSided'].includes(k))g.deleteAttribute(k);
  if(!g.hasAttribute('uv'))g.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(count*2),2));
  if(!g.hasAttribute('color')||!o.material.vertexColors)g.setAttribute('color',new T.Float32BufferAttribute(new Float32Array(count*3).fill(1),3));
  if(!parts.has(o.material))parts.set(o.material,[]);parts.get(o.material).push(g);remove.push(o);
 });
 if(!remove.length)return;const group=new T.Group();group.name='Consolidated static structures';mergeArchitectureParts(parts,group,level);root.add(group);
 for(const o of remove){o.removeFromParent();if(!isSharedModelResource(o.geometry))o.geometry.dispose();}
}
