import * as T from './vendor/three.module.min.js';

// Shared, mipmapped albedo assets. Mirror-repeat makes opposite edge values
// continuous without four extra texture reads or per-frame canvas processing.
export const RURAL_TEXTURE_FILES={shoreRock:'shore-bedrock-v32',shoreSilt:'shore-silt-gravel-v32',meadow:'meadow-sward-v13',soil:'soil-loamy-earth-v9',path:'path-compacted-fine-gravel-v9',turf:'turf-short-patchy-meadow-v9',bark:'bark-weathered-oak-elm-v9',birch:'bark-pale-birch-aspen-v9',broadleaf:'canopy-small-oak-hawthorn-v9',fineleaf:'canopy-fine-willow-privet-v9'};
const resources=new Set();
export const ruralTextures=Object.fromEntries(Object.keys(RURAL_TEXTURE_FILES).map(key=>{
 const texture=new T.DataTexture(new Uint8Array([128,128,128,255]),1,1);
 texture.name='Generated rural albedo / '+key;
 texture.wrapS=texture.wrapT=T.MirroredRepeatWrapping;
 texture.magFilter=T.LinearFilter;texture.minFilter=T.LinearMipmapLinearFilter;
 texture.generateMipmaps=true;texture.anisotropy=4;texture.colorSpace=T.SRGBColorSpace;texture.needsUpdate=true;
 resources.add(texture);return [key,texture];
}));
let loading;
async function decode(url){
 const response=await fetch(url);if(!response.ok)throw Error('Texture load failed: '+response.status+' '+url.pathname);
 const bitmap=await createImageBitmap(await response.blob());
 const canvas=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(512,512):document.createElement('canvas');
 canvas.width=canvas.height=512;const context=canvas.getContext('2d',{willReadFrequently:true});
 context.drawImage(bitmap,0,0,512,512);bitmap.close();
 return {data:new Uint8Array(context.getImageData(0,0,512,512).data),width:512,height:512};
}
export function initializeRuralTextures(decodeImage=decode){
 if(!loading)loading=Promise.all(Object.entries(RURAL_TEXTURE_FILES).map(async([key,file])=>{
  const pixels=await decodeImage(new URL('./textures/'+file+'.webp',import.meta.url));
  if(!pixels?.data||pixels.width!==512||pixels.height!==512)throw Error('Invalid rural texture '+key);
  ruralTextures[key].image=pixels;ruralTextures[key].needsUpdate=true;
 })).catch(error=>{loading=null;throw error});
 return loading;
}
export const isSharedRuralTexture=resource=>resources.has(resource);

// Preserve original silhouette, alpha coverage, wind and vertex/instance tints.
// Bark projection uses merged object coordinates; no new geometry or draw calls.
export function attachRuralDetail(material,kind='bark'){
 const previous=material.onBeforeCompile,cacheKey=material.customProgramCacheKey.bind(material);
 const oldKey=cacheKey();
 material.onBeforeCompile=shader=>{
  previous.call(material,shader);
  shader.uniforms.uRuralDetail={value:ruralTextures[kind==='bark'?'bark':kind]};
  shader.uniforms.uRuralBirch={value:ruralTextures.birch};
  shader.vertexShader='varying vec3 vRuralLocal;varying vec3 vRuralNormal;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvRuralLocal=position;vRuralNormal=normal;');
  shader.fragmentShader='uniform sampler2D uRuralDetail;uniform sampler2D uRuralBirch;varying vec3 vRuralLocal;varying vec3 vRuralNormal;\n'+shader.fragmentShader;
  const sampling=kind==='bark'?`
   vec2 barkUV=vec2(abs(vRuralNormal.x)>abs(vRuralNormal.z)?vRuralLocal.z:vRuralLocal.x,vRuralLocal.y)*vec2(1.4,.7);
   vec3 ruralTex=texture2D(uRuralDetail,barkUV).rgb;
   #ifdef USE_COLOR
    if(dot(vColor.rgb,vec3(.2126,.7152,.0722))>.42)ruralTex=texture2D(uRuralBirch,barkUV).rgb*.48;
   #endif
   float ruralLuma=dot(ruralTex,vec3(.2126,.7152,.0722));
   diffuseColor.rgb*=clamp(.48+ruralLuma*3.0,.52,1.48);
   diffuseColor.rgb=mix(diffuseColor.rgb,ruralTex,.20);
  `:`
   vec2 leafUV=vec2(vRuralLocal.x+vRuralLocal.z*.57,vRuralLocal.y)*1.3;
   vec3 ruralTex=texture2D(uRuralDetail,leafUV).rgb;
   float ruralLuma=dot(ruralTex,vec3(.2126,.7152,.0722));
   diffuseColor.rgb*=clamp(.70+ruralLuma*2.0,.72,1.22);
  `;
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n'+sampling);
 };
 material.customProgramCacheKey=()=>oldKey+'-generated-v9-'+kind;
 return material;
}
