import * as T from './vendor/three.module.min.js';
// Immutable instance transforms + immutable, precomputed circle selections.
// The runtime only changes an integer offset and draw count. No matrix copies,
// sorting, vertex collapse, fragment-distance culling, or instance-array scans.
const WIDTH=256;
function texture(data,channels=4){
 const height=Math.max(1,Math.ceil(data.length/(WIDTH*channels))),array=new Float32Array(WIDTH*height*channels);array.set(data);
 const t=new T.DataTexture(array,WIDTH,height,channels===4?T.RGBAFormat:T.RedFormat,T.FloatType);
 t.magFilter=t.minFilter=T.NearestFilter;t.generateMipmaps=false;t.userData.chunkOwned=true;t.needsUpdate=true;return t;
}
export function prepareStaticSelection(matrices,colors,{size=64,step=8,radius=28,padding=.7,limit=Infinity,kinds}={}){
 const originalCount=matrices.length/16;
 // A cell-centred lookup covers the entire camera cell, including the far corner.
 const safeRadius=radius-step/Math.SQRT2-padding,min=-Math.ceil(radius/step),max=Math.ceil((size+radius)/step),side=max-min;
 const selection=new Uint32Array(side*side*2),ids=[],roots=new Float32Array(originalCount*20);
 for(let i=0;i<originalCount;i++){
  roots.set(matrices.subarray(i*16,i*16+16),i*20);
  roots.set(colors?colors.subarray(i*3,i*3+3):[1,1,1],i*20+16);
  roots[i*20+19]=kinds?.[i]||0;
 }
 for(let z=0;z<side;z++)for(let x=0;x<side;x++){
  const cx=(x+min+.5)*step,cz=(z+min+.5)*step,k=(z*side+x)*2,start=ids.length;
  for(let i=0;i<originalCount;i++)if((matrices[i*16+12]-cx)**2+(matrices[i*16+14]-cz)**2<=safeRadius*safeRadius){
   if(ids.length-start>=limit)break;ids.push(i);
  }
  selection[k]=start;selection[k+1]=ids.length-start;
 }
 return {roots,ids:new Float32Array(ids),metadata:{size,step,radius,padding,min,side,selection,originalCount,safeRadius,bytes:roots.byteLength+ids.length*4}};
}
export function bakeStaticSelection(mesh,options={}){return bindStaticSelection(mesh,prepareStaticSelection(mesh.instanceMatrix.array,mesh.instanceColor?.array,options));}
export function bindStaticSelection(mesh,baked,{shadows=false,extraAttribute=false}={}){
 const transforms=texture(baked.roots),indices=texture(baked.ids,1),offset={value:0};
 const decorate=source=>{
 const mat=source.clone(),previous=source.onBeforeCompile,key=source.customProgramCacheKey();
 mat.onBeforeCompile=function(s,r){
  previous.call(this,s,r);
  if(extraAttribute)s.vertexShader=s.vertexShader.replace('vNatureSpecies=natureSpecies;','vNatureSpecies=frozenExtra;');
  Object.assign(s.uniforms,{uStaticRoots:{value:transforms},uStaticIds:{value:indices},uStaticStart:offset});
  s.vertexShader=`uniform highp sampler2D uStaticRoots,uStaticIds;uniform int uStaticStart;
mat4 frozenInstanceMatrix;vec3 frozenInstanceColor;float frozenExtra;
#define instanceMatrix frozenInstanceMatrix
#define instanceColor frozenInstanceColor
vec4 frozenRead(sampler2D t,int n){return texelFetch(t,ivec2(n%256,n/256),0);}
`+s.vertexShader;
  s.vertexShader=s.vertexShader.replace('void main() {',`void main() {
 int frozenId=int(frozenRead(uStaticIds,uStaticStart+gl_InstanceID).r)*5;
 frozenInstanceMatrix=mat4(frozenRead(uStaticRoots,frozenId),frozenRead(uStaticRoots,frozenId+1),frozenRead(uStaticRoots,frozenId+2),frozenRead(uStaticRoots,frozenId+3));
 vec4 frozenTint=frozenRead(uStaticRoots,frozenId+4);frozenInstanceColor=frozenTint.rgb;frozenExtra=frozenTint.a;`);
 };
 mat.customProgramCacheKey=()=>key+'|immutable-circle-selection-v39';
 Object.defineProperty(mat,'staticUniforms',{value:{uStaticStart:offset},configurable:true});
 Object.defineProperty(mat,'staticTextures',{value:[transforms,indices]});
 return mat;};
 mesh.material=decorate(mesh.material);if(shadows&&mesh.customDepthMaterial)mesh.customDepthMaterial=decorate(mesh.customDepthMaterial);
 mesh.instanceMatrix.setUsage(T.StaticDrawUsage);mesh.instanceColor?.setUsage(T.StaticDrawUsage);
 mesh.userData.staticSelection=baked.metadata;
 mesh.count=0;if(!shadows)mesh.castShadow=false;
 return mesh;
}
export function selectStaticInstances(mesh,x,z){
 const d=mesh.userData.staticSelection,ix=Math.floor(x/d.step)-d.min,iz=Math.floor(z/d.step)-d.min;
 if(ix<0||iz<0||ix>=d.side||iz>=d.side){mesh.count=0;mesh.visible=false;return 0;}
 const i=(iz*d.side+ix)*2,count=d.selection[i+1];
 mesh.material.staticUniforms.uStaticStart.value=d.selection[i];mesh.count=count;mesh.visible=count>0;return count;
}
