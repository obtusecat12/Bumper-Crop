import * as T from './vendor/three.module.min.js';
import {AD_CATALOG} from './ad-catalog-v55.js?v=59';
export {AD_CATALOG};
export const AD_SIZES={wide:[640,256],tall:[256,768],square:[512,512]};
export const adArrays={};
for(const[group,[w,h]]of Object.entries(AD_SIZES)){const count=AD_CATALOG.filter(a=>a.textureGroup===group).length,data=new Uint8Array(count*4).fill(190),t=new T.DataArrayTexture(data,1,1,count);t.colorSpace=T.SRGBColorSpace;t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.anisotropy=4;t.name='V55 independently generated '+group+' advertising';t.needsUpdate=true;adArrays[group]=t;}
export const heroTexture=new T.DataTexture(new Uint8Array([170,170,170,255]),1,1);heroTexture.colorSpace=T.SRGBColorSpace;heroTexture.flipY=true;heroTexture.generateMipmaps=true;heroTexture.minFilter=T.LinearMipmapLinearFilter;heroTexture.magFilter=T.LinearFilter;heroTexture.anisotropy=8;heroTexture.needsUpdate=true;
let pending;
async function decode(url,w,h){const r=await fetch(url);if(!r.ok)throw Error('Advertisement '+url.pathname+': '+r.status);const im=await createImageBitmap(await r.blob()),c=new OffscreenCanvas(w,h),ctx=c.getContext('2d');ctx.drawImage(im,0,0,w,h);im.close();return{data:new Uint8Array(ctx.getImageData(0,0,w,h).data),width:w,height:h};}
export function initializeAdvertising(load=decode){return pending||(pending=(async()=>{
 for(const[group,[w,h]]of Object.entries(AD_SIZES)){const items=AD_CATALOG.filter(a=>a.textureGroup===group),data=new Uint8Array(w*h*4*items.length);let cursor=0;await Promise.all(Array.from({length:6},async()=>{for(;;){const i=cursor++;if(i>=items.length)return;const p=await load(new URL('./textures/advertising-v55/'+items[i].file,import.meta.url),w,h);data.set(p.data||p,i*w*h*4);}}));adArrays[group].image={data,width:w,height:h,depth:items.length};adArrays[group].needsUpdate=true;}
 heroTexture.image=await load(new URL('./textures/advertising-v57/echo-clothing-1994.webp',import.meta.url),768,2304);heroTexture.needsUpdate=true;
})().catch(e=>{pending=null;throw e;}));}
export function adFor(seed,kind,era){let a=AD_CATALOG.filter(a=>a.id!=='ad-120'&&(!kind||a.kind===kind)&&(!era||a.era===era));if(!a.length)a=AD_CATALOG.filter(a=>a.kind===kind&&a.id!=='ad-120');let h=seed>>>0;h=Math.imul(h^(h>>>16),0x7feb352d);h=Math.imul(h^(h>>>15),0x846ca68b);h=(h^(h>>>16))>>>0;return a[h%a.length]||AD_CATALOG[0];}
export function addAdvertisingMaterials(m){
 for(const[group,t]of Object.entries(adArrays)){const mat=new T.MeshStandardMaterial({color:0xffffff,roughness:.76,metalness:0,vertexColors:true,side:T.FrontSide});mat.onBeforeCompile=s=>{s.uniforms.uAdArray={value:t};s.vertexShader='attribute float assetLayer;varying float vAdLayer;varying vec2 vAdUv;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvAdLayer=assetLayer;vAdUv=uv;');s.fragmentShader='uniform highp sampler2DArray uAdArray;varying float vAdLayer;varying vec2 vAdUv;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>','vec4 adPixel=texture(uAdArray,vec3(clamp(vec2(vAdUv.x,1.-vAdUv.y),vec2(.0015),vec2(.9985)),floor(vAdLayer+.5)));diffuseColor*=adPixel;').replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+=adPixel.rgb*.035;');};mat.customProgramCacheKey=()=> 'period-ad-array-v55-'+group;mat.name='V55 original image advertisements / '+group;mat.userData.urbanShared=true;m['ad:'+group]=mat;}
 m['ad:hero']=new T.MeshStandardMaterial({map:heroTexture,color:0xffffff,roughness:.89,vertexColors:true});m['ad:hero'].name='ECHO / fixed uncanny fashion wallscape';m['ad:hero'].userData.urbanShared=true;
 return m;
}
export function adFace(b,ad,x,y,z,w,h,ry=0){
 if(ad.id==='ad-120')b.plane('ad:hero',x,y,z,w,h,ry);else b.panel('ad:'+ad.textureGroup,ad.layer,x,y,z,w,h,ry);
 const p=b.point(x,y,z);(b.ads||(b.ads=[])).push({id:ad.id,kind:ad.kind,brand:ad.brand,x:p.x,y:p.y,z:p.z,w,h,ry:b.frame.ry+ry});
}
