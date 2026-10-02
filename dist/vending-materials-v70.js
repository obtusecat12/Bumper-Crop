import * as T from './vendor/three.module.min.js';
const textures={},drinkMaps={};
export const VENDING_TEXTURE_SPECS={
 'waterfall-ad':[768,1536],'right-control':[256,2048],'left-control':[256,2048],
 'black-metal':[512,512],'brushed-metal':[512,512],'seat-plastic':[512,512],
 'rubber-mat':[512,512],'notice-board':[1024,768],'scale-dial':[512,512],'stained-steel':[512,512],
 'drink-plastic':[512,512],'pet-label':[1536,512],'can-label':[1024,512],
 'can-top':[512,512],'soy-front':[768,960],'soy-back':[768,960]
};
const surfaces=['black-metal','brushed-metal','stained-steel','seat-plastic','rubber-mat','drink-plastic'];
export async function initializeVendingTextures(decode){
 const loader=new T.TextureLoader();
 const specs={...VENDING_TEXTURE_SPECS};for(const n of surfaces)for(const suffix of['-normal','-roughness'])specs[n+suffix]=[512,512];
 for(const n of['can-top','pet-label','can-label','soy-front','soy-back'])specs[n+'-normal']=VENDING_TEXTURE_SPECS[n];
 await Promise.all(Object.entries(specs).map(async([n,[w,h]])=>{
  const url=new URL('./textures/vending-v70/'+n+'.webp',import.meta.url);let t;
  if(decode){const im=await decode(url,w,h);t=new T.DataTexture(im.data,im.width,im.height);t.flipY=true;t.needsUpdate=true;}else t=await loader.loadAsync(url.href);
  t.name='V70 generated '+n;t.colorSpace=/-normal|-roughness/.test(n)?T.NoColorSpace:T.SRGBColorSpace;
  t.wrapS=t.wrapT=surfaces.some(s=>n.startsWith(s))?T.RepeatWrapping:T.ClampToEdgeWrapping;
  t.anisotropy=4;t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;textures[n]=t;
 }));
 Object.assign(drinkMaps,{petLabel:textures['pet-label'],petNormal:textures['pet-label-normal'],petRoughness:textures['drink-plastic-roughness'],canLabel:textures['can-label'],canNormal:textures['can-label-normal'],canRoughness:textures['brushed-metal-roughness'],canTop:textures['can-top'],canTopNormal:textures['can-top-normal'],soyFront:textures['soy-front'],soyBack:textures['soy-back'],soyNormal:textures['soy-front-normal'],soyRoughness:textures['drink-plastic-roughness'],capNormal:textures['drink-plastic-normal'],plasticBody:textures['drink-plastic'],plastic:textures['drink-plastic'],metal:textures['brushed-metal']});
 Object.assign(drinkMaps,{soyBackNormal:textures['soy-back-normal'],petPlasticNormal:textures['drink-plastic-normal'],petPlasticRoughness:textures['drink-plastic-roughness'],soyPlasticNormal:textures['drink-plastic-normal'],soyPlasticRoughness:textures['drink-plastic-roughness'],canMetalNormal:textures['brushed-metal-normal'],canTopRoughness:textures['brushed-metal-roughness']});
 return textures;
}
export const vendingTextures=()=>textures;
export const vendingDrinkTextures=()=>drinkMaps;
export function createVendingMaterials(){
 const surface=(name,color,roughness,metalness=0,strength=.18)=>new T.MeshStandardMaterial({name:'V70 '+name,map:textures[name],normalMap:textures[name+'-normal'],normalScale:new T.Vector2(strength,strength),roughnessMap:textures[name+'-roughness'],color,roughness,metalness});
 const decal=(name,emissive=0,intensity=0)=>new T.MeshStandardMaterial({name:'V70 '+name,map:textures[name],normalMap:textures['drink-plastic-normal'],normalScale:new T.Vector2(.025,.025),roughnessMap:textures['drink-plastic-roughness'],roughness:.66,emissive,emissiveMap:emissive?textures[name]:null,emissiveIntensity:intensity});
 const m={black:surface('black-metal',0xffffff,.66,.30),steel:surface('brushed-metal',0xe0dfd7,.32,.88),cream:surface('seat-plastic',0xe9e6d9,.69),rubber:surface('rubber-mat',0xc1ccca,.89),plastic:surface('drink-plastic',0xe7e5d9,.61),dark:surface('black-metal',0x1b2422,.85,.12),waterfall:decal('waterfall-ad',0xffffff,.19),right:decal('right-control',0xffffff,.055),left:decal('left-control',0xffffff,.035),notice:decal('notice-board'),dial:decal('scale-dial')};
 m.stainedSteel=surface('stained-steel',0xe0dfd7,.37,.72,.14);m.chrome=surface('brushed-metal',0xe5e9e8,.22,.95,.10);m.blue=surface('drink-plastic',0x194768,.41);m.opal=surface('seat-plastic',0xf3e7cb,.63);m.opal.emissive.setHex(0xfce8c5);m.opal.emissiveIntensity=.68;
 m.led=surface('drink-plastic',0x9dbc4d,.30);m.led.emissive.setHex(0x80b030);m.led.emissiveIntensity=.65;
 m.glass=surface('drink-plastic',0xd7e1df,.18,.10,.045);m.glass.transparent=true;m.glass.opacity=.10;m.glass.depthWrite=false;
 return m;
}
