import {plantTexture,plantAlpha} from './plant-texture.js?v=49';
import * as T from './vendor/three.module.min.js';
import {bakeStaticSelection} from './static-selection.js?v=49';
const shared=new Set(),geometries=new Map(),materials=new WeakMap();let loading;
const atlas=new T.DataTexture(new Uint8Array([128,128,128,0]),1,1);atlas.name='Four Source-style roadside plants';atlas.colorSpace=T.SRGBColorSpace;atlas.magFilter=T.LinearFilter;atlas.minFilter=T.LinearMipmapLinearFilter;atlas.generateMipmaps=true;atlas.anisotropy=4;shared.add(atlas);
async function decode(url){const r=await fetch(url);if(!r.ok)throw Error('Roadside atlas: '+r.status);const b=await createImageBitmap(await r.blob()),c=document.createElement('canvas');c.width=c.height=1024;const ctx=c.getContext('2d');ctx.drawImage(b,0,0,1024,1024);b.close();return {data:new Uint8Array(ctx.getImageData(0,0,1024,1024).data),width:1024,height:1024};}
export function initializeVergeTextures(decodeImage=decode){return loading||=(decodeImage(new URL('./textures/roadside-atlas-v40.png',import.meta.url)).then(im=>{
 const row=im.width*4,data=new Uint8Array(im.data.length);for(let y=0;y<im.height;y++)data.set(im.data.subarray((im.height-1-y)*row,(im.height-y)*row),y*row);
 const baked=plantTexture(data,im.width,im.height,{columns:2,rows:2,name:atlas.name});atlas.copy(baked);atlas.needsUpdate=true;
}));}
export function plantCardGeometry(kind=0){
 kind=[0,1,3,1,2,0][kind]??kind;
 if(geometries.has(kind))return geometries.get(kind);
 const sizes=[[.29,.27],[.22,.56],[.27,.085],[.21,.20]],p=[],uv=[],n=[],index=[],[w,h]=sizes[kind];
 for(let plane=0;plane<2;plane++){
  const b=p.length/3;for(const [side,y,u,v]of [[-1,0,0,0],[1,0,1,0],[1,1,1,1],[-1,1,0,1]]){
   p.push(plane?0:side*w*.5,y*h,plane?side*w*.5:0);uv.push((kind%2+.012+u*.976)/2,(1-Math.floor(kind/2)+.012+v*.976)/2);
   const normal=new T.Vector3(plane?0:side*.24,.94,plane?side*.24:0).normalize();n.push(...normal.toArray());
  }index.push(b,b+1,b+2,b,b+2,b+3);
 }
 const g=new T.BufferGeometry();g.name='Crossed roadside plant '+kind;g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('normal',new T.Float32BufferAttribute(n,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(index);g.computeBoundingSphere();geometries.set(kind,g);shared.add(g);return g;
}
const still={time:{value:0},strength:{value:.32}};
export function plantCardMaterial(wind=still){
 if(materials.has(wind))return materials.get(wind);
 const m=new T.MeshStandardMaterial({map:atlas,alphaTest:.18,alphaToCoverage:true,side:T.DoubleSide,roughness:1});m.name='Source-style photographic roadside foliage';
 m.onBeforeCompile=s=>{
  s.uniforms.uNatureTime=wind.time;s.uniforms.uNatureWind=wind.strength;
  s.vertexShader='uniform float uNatureTime,uNatureWind;varying float vGrassRoot;\n'+s.vertexShader;
  s.vertexShader=s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   vGrassRoot=uv.y;float flex=position.y*position.y;
   transformed.x+=sin(uNatureTime*1.3+instanceMatrix[3].x*.7+instanceMatrix[3].z*.31)*.09*min(uNatureWind,1.5)*flex;`);
  s.fragmentShader='varying float vGrassRoot;\n'+s.fragmentShader;
  s.fragmentShader=s.fragmentShader.replace('#include <alphatest_fragment>',plantAlpha);
  s.fragmentShader=s.fragmentShader.replace('#include <lights_physical_fragment>','#include <lights_physical_fragment>\nmaterial.specularColor=vec3(0.);material.specularF90=0.;');
  s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb*=mix(.58,1.,smoothstep(0.,.75,vGrassRoot));');
  s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_begin>','#include <normal_fragment_begin>\n#ifdef DOUBLE_SIDED\nnormal*=faceDirection;\n#endif');
 };m.customProgramCacheKey=()=> 'slender-roadside-matte-v40';materials.set(wind,m);shared.add(m);return m;
}
export const isSharedVergeResource=r=>shared.has(r);
let unit;
export function consolidatePlantCards(root,wind){
 const sources=[];root.updateMatrixWorld(true);root.traverse(m=>{if(m.isInstancedMesh&&m.geometry.name.startsWith('Crossed roadside plant '))sources.push(m);});if(!sources.length)return;
 if(!unit){unit=plantCardGeometry(0).clone();const p=unit.attributes.position,u=unit.attributes.uv;for(let i=0;i<p.count;i++){p.setXYZ(i,p.getX(i)/.29,p.getY(i)/.27,p.getZ(i)/.29);u.setXY(i,[0,1,1,0][i%4],i%4>=2?1:0);}unit.computeBoundingSphere();shared.add(unit);}
 const source=plantCardMaterial(wind),mat=source.clone(),previous=source.onBeforeCompile;
 mat.onBeforeCompile=s=>{previous(s);s.vertexShader='flat varying float vPlantKind;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvPlantKind=frozenExtra;');s.fragmentShader='flat varying float vPlantKind;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>','vec2 plantUV=vec2((mod(vPlantKind,2.)+.012+vMapUv.x*.976)/2.,(1.-floor(vPlantKind/2.)+.012+vMapUv.y*.976)/2.);diffuseColor*=texture2D(map,plantUV);');};mat.customProgramCacheKey=()=> 'unified-slender-roadside-v40';
 const count=sources.reduce((n,m)=>n+m.count,0),mesh=new T.InstancedMesh(unit,mat,count),kind=new Uint8Array(count),matrix=new T.Matrix4(),world=new T.Matrix4(),scale=new T.Matrix4(),inverse=root.matrixWorld.clone().invert(),tint=new T.Color();let at=0;
 for(const m of sources){m.geometry.computeBoundingBox();const b=m.geometry.boundingBox,width=b.max.x-b.min.x,height=b.max.y-b.min.y,species=Number(m.geometry.name.split(' ').at(-1));scale.makeScale(width,height,width);world.multiplyMatrices(inverse,m.matrixWorld);
  for(let i=0;i<m.count;i++){m.getMatrixAt(i,matrix);matrix.premultiply(world).multiply(scale);mesh.setMatrixAt(at,matrix);if(m.instanceColor)m.getColorAt(i,tint);else tint.setRGB(1,1,1);mesh.setColorAt(at,tint);kind[at++]=species;}
  m.removeFromParent();m.dispose();
 }
 mesh.name='Unified photographic roadside and bank plants';mesh.receiveShadow=true;mesh.computeBoundingSphere();mesh.boundingSphere.radius+=1.2;bakeStaticSelection(mesh,{radius:34,step:4,padding:1.2,kinds:kind});mat.dispose();root.add(mesh);
}
