import * as T from './vendor/three.module.min.js';
const maps={};
const names=['pool','marble','braid','cord','nocturne','azure','pure-line','sundrop','palm-springs','velvet'];
export async function initializeShowerTextures(decode){
 const loader=new T.TextureLoader();
 await Promise.all(names.flatMap(n=>['','-normal','-roughness','-ao','-height'].map(async suffix=>{
  const key=n+suffix,url=new URL('./textures/bath-v62/'+key+'.webp',import.meta.url);let t;
  if(decode){const im=await decode(url,512,names.indexOf(n)>=4&&n!=='velvet'?1024:512);t=new T.DataTexture(im.data,im.width,im.height);t.flipY=true;t.needsUpdate=true;}else t=await loader.loadAsync(url.href);
  t.colorSpace=suffix?T.NoColorSpace:T.SRGBColorSpace;t.wrapS=t.wrapT=names.indexOf(n)<4?T.RepeatWrapping:T.ClampToEdgeWrapping;t.anisotropy=4;t.minFilter=T.LinearMipmapLinearFilter;t.name='V62 generated '+key;maps[key]=t;
 })));
}
export function showerTextures(){return maps;}
export function showerMaterials(base){
 const surface=(n,color=0xffffff,r=.8,s=.3,metalness=0)=>new T.MeshStandardMaterial({name:'V62 '+n,map:maps[n],normalMap:maps[n+'-normal'],normalScale:new T.Vector2(s,s),roughnessMap:maps[n+'-roughness'],aoMap:maps[n+'-ao'],aoMapIntensity:.25,color,roughness:r,metalness});
 const m={marble:surface('marble',0xf1efdf,.09,.12),braid:surface('braid',0xc9cecf,.20,.42,1),cord:surface('cord',0xede4c9,.96,.42),pool:surface('pool',0xc6c7b9,.67,.82)};
 m.chrome=surface('braid',0xd8e0dd,.17,.09,1);m.darkPlastic=base.plastic.clone();m.darkPlastic.color.set(0x13181a);m.darkPlastic.roughness=.72;
 m.bluePlastic=base.plastic.clone();m.bluePlastic.color.set(0x176aaf);m.bluePlastic.roughness=.23;
 m.whitePlastic=base.plastic.clone();m.whitePlastic.color.set(0xece9dc);m.whitePlastic.roughness=.69;
 m.rubber=base.dark.clone();m.rubber.roughness=.93;m.tealCloth=base.towel;m.wood=base.wood;
 for(const[n,k]of[['nocturne','Nocturne'],['azure','Azure'],['pure-line','Pure'],['sundrop','Sundrop'],['palm-springs','Palm'],['velvet','Velvet']])m['label'+k]=surface(n,0xffffff,.85,.035);
 return m;
}
