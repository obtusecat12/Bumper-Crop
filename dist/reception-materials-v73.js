import * as T from './vendor/three.module.min.js';
const images={};export const RECEPTION_FAMILIES73=['leather','rug','walnut','brass','tiffany','fabric'];
export const RECEPTION_ART73=['fern-fronds','soap-label','watch-face','magazine-weekend-away-1994','magazine-room-home-1997','guest-register-spread','ashtray-contents'];
export async function initializeReceptionTextures73(decode,onProgress=()=>{}){
 const names=[...RECEPTION_FAMILIES73.flatMap(n=>['basecolor','normal','roughness','metallic','ao','height'].map(k=>n+'-'+k)),...RECEPTION_ART73];
 let cursor=0,done=0;const loader=new T.TextureLoader();
 async function worker(){while(cursor<names.length){const name=names[cursor++];if(!images[name]){const url=new URL('./textures/reception-v73/'+name+'.webp',import.meta.url);let t;if(decode){const im=await decode(url,512,512);t=new T.DataTexture(im.data,im.width,im.height);t.flipY=true;t.generateMipmaps=true;t.needsUpdate=true;}else t=await loader.loadAsync(url.href);
   t.name='V73 generated '+name;t.colorSpace=name.endsWith('basecolor')||RECEPTION_ART73.includes(name)?T.SRGBColorSpace:T.NoColorSpace;t.wrapS=t.wrapT=RECEPTION_ART73.includes(name)||name.startsWith('rug')?T.ClampToEdgeWrapping:T.RepeatWrapping;t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;t.anisotropy=4;images[name]=t;}onProgress(++done/names.length);}}
 await Promise.all([worker(),worker(),worker()]);
}
export const receptionTextures73=()=>images;
export function receptionMaterials73(){
 const surface=(n,roughness,normal,metalness=0)=>new T.MeshStandardMaterial({name:'V73 '+n,map:images[n+'-basecolor'],normalMap:images[n+'-normal'],normalScale:new T.Vector2(normal,normal),roughnessMap:images[n+'-roughness'],roughness,metalnessMap:images[n+'-metallic'],metalness,aoMap:images[n+'-ao'],aoMapIntensity:n==='rug'?.15:.30});
 const m={leather:surface('leather',.85,.16),rug:surface('rug',1,.12),walnut:surface('walnut',.81,.16),brass:surface('brass',.64,.17,1),tiffany:surface('tiffany',.65,.12),fabric:surface('fabric',.94,.25)};
 m.leatherShine=m.leather.clone();m.leatherShine.name='V73 contact-polished leather';m.leatherShine.roughness=.42;
 m.tiffany.emissiveMap=images['tiffany-basecolor'];m.tiffany.emissive.set(0xffd9a0);m.tiffany.emissiveIntensity=.88;m.tiffany.side=T.DoubleSide;
 m.fern=new T.MeshStandardMaterial({name:'V73 generated drooping Boston fern',map:images['fern-fronds'],normalMap:images['fabric-normal'],normalScale:new T.Vector2(.05,.05),alphaTest:.42,side:T.DoubleSide,roughness:.94});
 for(const n of RECEPTION_ART73.filter(n=>n!=='fern-fronds'))m[n]=new T.MeshStandardMaterial({name:'V73 generated '+n,map:images[n],normalMap:images['fabric-normal'],normalScale:new T.Vector2(.02,.02),roughness:.88,side:T.DoubleSide});
 m['watch-face'].roughness=.40;m['watch-face'].emissiveMap=images['watch-face'];m['watch-face'].emissive.set(0xffffff);m['watch-face'].emissiveIntensity=.055;m['ashtray-contents'].transparent=true;m['ashtray-contents'].alphaTest=.04;m['ashtray-contents'].depthWrite=false;m['ashtray-contents'].roughness=.6;
 m.glass=new T.MeshPhysicalMaterial({name:'V73 thick ashtray glass',normalMap:images['tiffany-normal'],normalScale:new T.Vector2(.035,.035),color:0xbdc8bf,roughness:.12,metalness:.1,transparent:true,opacity:.22,depthWrite:false,side:T.DoubleSide});
 // No transmission recapture: these small frosted/colored lamp surfaces scatter.
 m.opal=surface('tiffany',.9,.07);m.opal.map=null;m.opal.color.set(0xebe1c8);m.opal.emissive.set(0xffbd69);m.opal.emissiveIntensity=.95;
 m.bankGlass=surface('tiffany',.48,.045);m.bankGlass.map=null;m.bankGlass.color.set(0x0e582b);m.bankGlass.emissive.set(0x225b27);m.bankGlass.emissiveIntensity=.13;m.bankGlass.side=T.DoubleSide;
 return m;
}
