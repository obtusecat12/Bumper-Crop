import * as T from './vendor/three.module.min.js';
// Separate image files, never a generative contact sheet. Physical UV ratios
// belong to the mesh; discrete low-resolution texels retain the Source/PS1 feel.
export const EXIT_TEXTURES={
 'window-broken':[256,256,false], 'window-ribbon':[384,128,false],
 'window-shop':[256,384,false], 'wall-plaster':[256,256,true],
 'road-asphalt':[256,256,true], 'sidewalk-concrete':[256,256,true],
 notice:[256,384,false], 'street-sign':[384,128,false]
};
export const exitTextures={};
for(const [name,,] of Object.entries(EXIT_TEXTURES)){
 const t=new T.DataTexture(new Uint8Array([100,104,102,255]),1,1);
 t.name='Level 11 / '+name;t.colorSpace=T.SRGBColorSpace;t.generateMipmaps=true;
 t.magFilter=T.NearestFilter;t.minFilter=T.LinearMipmapLinearFilter;t.anisotropy=4;
 t.wrapS=t.wrapT=EXIT_TEXTURES[name][2]?T.MirroredRepeatWrapping:T.ClampToEdgeWrapping;t.needsUpdate=true;exitTextures[name]=t;
}
let loading;
async function decode(url,width,height){
 const r=await fetch(url);if(!r.ok)throw Error('Exit texture '+r.status+': '+url.pathname);
 const bitmap=await createImageBitmap(await r.blob()),canvas=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(width,height):document.createElement('canvas');
 canvas.width=width;canvas.height=height;const c=canvas.getContext('2d',{willReadFrequently:true});c.drawImage(bitmap,0,0,width,height);bitmap.close();
 return {data:new Uint8Array(c.getImageData(0,0,width,height).data),width,height};
}
export function initializeExitTextures(decodeImage=decode){
 if(!loading)loading=Promise.all(Object.entries(EXIT_TEXTURES).map(async([name,[w,h]])=>{exitTextures[name].image=await decodeImage(new URL('./textures/level11-exit-v48/'+name+'.webp',import.meta.url),w,h);exitTextures[name].needsUpdate=true;})).catch(e=>{loading=null;throw e});
 return loading;
}
export const isSharedExitTexture=t=>Object.values(exitTextures).includes(t);
