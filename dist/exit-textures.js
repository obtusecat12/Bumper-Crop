import * as T from './vendor/three.module.min.js';
// Separate image files, never a generative contact sheet. Physical UV ratios
// belong to the mesh; discrete low-resolution texels retain the Source/PS1 feel.
export const EXIT_TEXTURES={
 'window-broken':[256,256,false], 'window-ribbon':[384,128,false],
 'window-shop':[256,384,false], 'wall-plaster':[256,256,true],
 'road-asphalt':[256,256,true], 'sidewalk-concrete':[256,256,true],
 notice:[256,384,false], 'street-sign':[384,128,false],
 travertine:[384,384,true],sandstone:[384,384,true],ribbed:[384,384,true],
 'brick-red':[384,384,true],'brick-ochre':[384,384,true],cinder:[384,384,true],
 steel:[384,384,true],shutter:[384,384,true],glass:[256,256,true]
};
const URBAN_FILES={'wall-plaster':'stucco-offwhite','road-asphalt':'asphalt-charcoal','sidewalk-concrete':'sidewalk-concrete-gray',travertine:'travertine-cream',sandstone:'sandstone-beige-panels',ribbed:'precast-ribbed-gray','brick-red':'brick-splitface-red','brick-ochre':'brick-splitface-ochre',cinder:'cinderblock-lightgray',steel:'steel-corrugated-gray',shutter:'loading-shutter-gray',glass:'glass-blue-black'};
export const exitTextures={};
for(const [name,,] of Object.entries(EXIT_TEXTURES)){
 const t=new T.DataTexture(new Uint8Array([100,104,102,255]),1,1);
 t.name='Level 11 / '+name;t.colorSpace=T.SRGBColorSpace;t.generateMipmaps=true;
 t.magFilter=T.NearestFilter;t.minFilter=T.LinearMipmapLinearFilter;t.anisotropy=4;
 t.wrapS=t.wrapT=EXIT_TEXTURES[name][2]?T.RepeatWrapping:T.ClampToEdgeWrapping;t.needsUpdate=true;exitTextures[name]=t;
}
let loading;
async function decode(url,width,height){
 const r=await fetch(url);if(!r.ok)throw Error('Exit texture '+r.status+': '+url.pathname);
 const bitmap=await createImageBitmap(await r.blob()),canvas=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(width,height):document.createElement('canvas');
 canvas.width=width;canvas.height=height;const c=canvas.getContext('2d',{willReadFrequently:true});c.drawImage(bitmap,0,0,width,height);bitmap.close();
 return {data:new Uint8Array(c.getImageData(0,0,width,height).data),width,height};
}
export function initializeExitTextures(decodeImage=decode){
 if(!loading)loading=Promise.all(Object.entries(EXIT_TEXTURES).map(async([name,[w,h]])=>{const path=URBAN_FILES[name]?'./textures/urban-v49/'+URBAN_FILES[name]+'.webp':'./textures/level11-exit-v48/'+name+'.webp';exitTextures[name].image=await decodeImage(new URL(path,import.meta.url),w,h);exitTextures[name].needsUpdate=true;})).catch(e=>{loading=null;throw e});
 return loading;
}
export const isSharedExitTexture=t=>Object.values(exitTextures).includes(t);
