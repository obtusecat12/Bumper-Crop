import * as T from './vendor/three.module.min.js';
const textures={};
const names=['spa-mosaic','spa-ivory-tile','spa-stone-wall','spa-sandstone','spa-marble','spa-venice-mural'];
export async function initializeSpaTextures(decode){
 await Promise.all(names.flatMap(n=>(n==='spa-venice-mural'?['']:['','-normal','-roughness','-ao']).map(async suffix=>{
  const key=n+suffix,url=new URL('./textures/spa-v65/'+key+'.webp',import.meta.url);let t;
  if(decode){const size=n==='spa-mosaic'||n==='spa-venice-mural'?1024:512,im=await decode(url,size,size);t=new T.DataTexture(im.data,im.width,im.height);t.flipY=true;t.needsUpdate=true;}else t=await new T.TextureLoader().loadAsync(url.href);
  t.name='Generated V65 / '+key;t.colorSpace=suffix?T.NoColorSpace:T.SRGBColorSpace;t.wrapS=t.wrapT=n==='spa-venice-mural'?T.ClampToEdgeWrapping:T.RepeatWrapping;t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;t.anisotropy=4;textures[key]=t;
 })));
}
export function spaTextures(){return textures;}
export function spaMaterials(){
 const make=(key,r=.7,n=.45)=>new T.MeshStandardMaterial({name:'Spa / '+key,map:textures[key],normalMap:textures[key+'-normal'],normalScale:new T.Vector2(n,n),roughnessMap:textures[key+'-roughness'],aoMap:textures[key+'-ao'],aoMapIntensity:.26,roughness:r});
 const m={mosaic:make('spa-mosaic',.25,.62),wall:make('spa-ivory-tile',.55,.32),stone:make('spa-stone-wall',.77,.7),sandstone:make('spa-sandstone',.75,.62),marble:make('spa-marble',.32,.12),chrome:make('spa-marble',.09,.035),dark:make('spa-sandstone',.80,.1),navy:make('spa-ivory-tile',.32,.22)};
 m.ceiling=m.marble.clone();m.ceiling.name='Spa / pale mineral plaster ceiling';m.ceiling.roughness=.84;m.ceiling.normalScale.set(.16,.16);m.ceiling.color.set(0xcbd2cb);
 m.chrome.color.set(0xd5e3e7);m.chrome.metalness=1;m.chrome.envMapIntensity=1.1;m.dark.color.set(0x26363d);m.navy.color.set(0x12364a);
 m.mural=new T.MeshStandardMaterial({name:'Spa / generated Venice trompe loeil',map:textures['spa-venice-mural'],emissiveMap:textures['spa-venice-mural'],emissive:0xffffff,emissiveIntensity:.11,roughness:.94});
 m.acrylic=new T.MeshPhysicalMaterial({name:'Spa / translucent cyan acrylic outlet',map:textures['spa-marble'],normalMap:textures['spa-marble-normal'],normalScale:new T.Vector2(.03,.03),color:0x65d7df,roughness:.10,metalness:0,ior:1.49,transparent:true,opacity:.57,clearcoat:.6,clearcoatRoughness:.10,side:T.DoubleSide});
 m.glow=new T.MeshStandardMaterial({name:'Spa / hidden cyan opal lamps',map:textures['spa-ivory-tile'],roughness:.55,color:0xa9f2f8,emissive:0x68cfe0,emissiveIntensity:2.6});
 return m;
}
