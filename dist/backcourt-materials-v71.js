import * as T from './vendor/three.module.min.js';
const maps={};
const surfaces=['stone','pda-black','steel','cream','rubber'];
export const CORNER_TEXTURE_SPECS={};
for(const name of surfaces)for(const channel of ['basecolor','normal','roughness','metallic','ao','height'])CORNER_TEXTURE_SPECS[name+'-'+channel]=[512,512];
Object.assign(CORNER_TEXTURE_SPECS,{'pda-ui':[768,1024],'crt-ui':[1024,768],'keyboard':[768,1024],'wall-foot':[1024,512],'wall-dust':[512,1024],'water-stain':[512,512]});
export async function initializeCornerTextures(decode){
 const loader=new T.TextureLoader();
 await Promise.all(Object.entries(CORNER_TEXTURE_SPECS).map(async([name,[w,h]])=>{
  const url=new URL('./textures/backcourt-v71/'+name+'.webp',import.meta.url);let t;
  if(decode){const im=await decode(url,w,h);t=new T.DataTexture(im.data,im.width,im.height);t.flipY=true;t.needsUpdate=true;}else t=await loader.loadAsync(url.href);
  t.name='V71 generated '+name;t.colorSpace=/-(normal|roughness|metallic|ao|height)$/.test(name)?T.NoColorSpace:T.SRGBColorSpace;
  t.wrapS=t.wrapT=surfaces.some(s=>name.startsWith(s+'-'))?T.RepeatWrapping:T.ClampToEdgeWrapping;
  // The independently generated atlas edges are not a verified tile. Mirror
  // its stone channels together so adjacent edges meet without a hard seam.
  if(name.startsWith('stone-'))t.wrapS=t.wrapT=T.MirroredRepeatWrapping;
  t.anisotropy=4;t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;maps[name]=t;
 }));return maps;
}
export const cornerTextures=()=>maps;
export function createCornerMaterials(){
 const surface=(name,roughness,metalness=0,strength=.16)=>new T.MeshStandardMaterial({name:'V71 '+name,map:maps[name+'-basecolor'],normalMap:maps[name+'-normal'],normalScale:new T.Vector2(strength,strength),roughnessMap:maps[name+'-roughness'],metalnessMap:maps[name+'-metallic'],aoMap:maps[name+'-ao'],aoMapIntensity:.65,roughness,metalness});
 const m={pdaBlack:surface('pda-black',.95,.08,.12),steel:surface('steel',.55,.88,.12),cream:surface('cream',.95,0,.11),rubber:surface('rubber',.95,0,.12),dark:surface('rubber',.95,0,.08),stone:surface('stone',.88,0,.48)};
 m.dark.color.setHex(0x222927);m.keyboard=m.pdaBlack;
 const screen=name=>{const a=surface('pda-black',.23,0,.008);a.name='V71 '+name;a.map=maps[name];a.emissiveMap=maps[name];a.emissive.setHex(0xffffff);a.emissiveIntensity=.64;a.normalMap=null;a.aoMap=null;a.roughnessMap=null;a.metalnessMap=null;return a;};
 m.screen=screen('pda-ui');m.crtScreen=screen('crt-ui');m.crtScreen.emissiveIntensity=.45;
 m.keyLegends=surface('pda-black',.75,0,.04);m.keyLegends.name='V71 generated keyboard';m.keyLegends.map=maps.keyboard;
 m.glass=surface('pda-black',.15,.08,.004);m.glass.name='V71 display cover glass';m.glass.map=null;m.glass.normalMap=null;m.glass.aoMap=null;m.glass.roughnessMap=null;m.glass.metalnessMap=null;m.glass.transparent=true;m.glass.opacity=.06;m.glass.depthWrite=false;
 m.led=surface('cream',.50,0,.03);m.led.color.setHex(0x829b79);m.led.emissive.setHex(0x94c998);m.led.emissiveIntensity=.40;
 for(const name of ['wall-foot','wall-dust']){const mat=new T.MeshStandardMaterial({name:'V71 generated '+name,map:maps[name],normalMap:maps['stone-normal'],normalScale:new T.Vector2(.025,.025),roughnessMap:maps['stone-roughness'],roughness:.95,metalness:0,transparent:true,opacity:.32,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});m[name]=mat;}
 return m;
}
