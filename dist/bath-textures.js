import * as T from './vendor/three.module.min.js';
const textures={};
export async function initializeBathTextures(decode){
 const names=['towel-ivory','towel-turquoise','ceramic-tile','impact-spray','foam-ripple','ocean-wall','palm-wall','cloud-ceiling','granite-basin','wood'];
 await Promise.all(names.map(async name=>{const url=new URL(name==='wood'?'./textures/urban-v57/warm-bench-hardwood-planks.webp':'./textures/bath-v59/'+name+'.webp',import.meta.url);let t;
 if(decode){const width=name.endsWith('wall')?1536:512,height=512,im=await decode(url,width,height);t=new T.DataTexture(im.data,im.width,im.height);t.flipY=true;t.needsUpdate=true;}else t=await new T.TextureLoader().loadAsync(url.href);
 t.name='Bath V59 / '+name;t.wrapS=t.wrapT=['ceramic-tile','towel-ivory','granite-basin','wood'].includes(name)?T.RepeatWrapping:T.ClampToEdgeWrapping;t.colorSpace=T.SRGBColorSpace;t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;t.anisotropy=4;textures[name]=t;}));
}
export function bathTextures(){return textures;}
