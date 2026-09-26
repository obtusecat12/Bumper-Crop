import * as T from './vendor/three.module.min.js';
import {URBAN_TILE_SIZE} from './urban-materials.js?v=50';

export const REFERENCE_TEXTURES={
 'hope-sandstone':[1024,1024,true], 'hope-dark-precast':[1024,1024,true],
 'clinic-mosaic-stone':[1024,1024,true], 'clinic-cobble':[1024,1024,true],
 'clinic-blue-canvas':[1024,1024,true], 'hope-asphalt':[1024,1024,true],
 'clinic-sign':[1536,512,false], 'lab-sign':[1536,512,false],
 'marisa-sign':[1536,512,false], 'lab-window':[512,1024,false],
 'ficus-full-a':[1024,1024,false], 'ficus-crown-b':[1024,1024,false], 'ficus-branch-c':[1024,1024,false]
};
export const referenceTextures={};
for(const [key,[w,h,repeat]] of Object.entries(REFERENCE_TEXTURES)){
 const t=new T.DataTexture(new Uint8Array([180,180,180,255]),1,1);t.name='Photographic reference / '+key;t.colorSpace=T.SRGBColorSpace;t.flipY=true;t.generateMipmaps=true;t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.anisotropy=8;t.wrapS=t.wrapT=repeat?T.RepeatWrapping:T.ClampToEdgeWrapping;t.needsUpdate=true;referenceTextures[key]=t;
}
let loading;
async function decode(url,w,h){const r=await fetch(url);if(!r.ok)throw Error('Reference material '+url.pathname+': '+r.status);const im=await createImageBitmap(await r.blob()),c=typeof OffscreenCanvas==='undefined'?document.createElement('canvas'):new OffscreenCanvas(w,h);c.width=w;c.height=h;c.getContext('2d').drawImage(im,0,0,w,h);im.close();return{data:new Uint8Array(c.getContext('2d').getImageData(0,0,w,h).data),width:w,height:h};}
export function initializeReferenceTextures(load=decode){return loading||(loading=Promise.all(Object.entries(REFERENCE_TEXTURES).map(async([key,[w,h]])=>{referenceTextures[key].image=await load(new URL('./textures/reference-v50/'+key+'.webp',import.meta.url),w,h);referenceTextures[key].needsUpdate=true;})).catch(e=>{loading=null;throw e}));}
function lettering(w,h,draw){const c=typeof OffscreenCanvas==='undefined'?document.createElement('canvas'):new OffscreenCanvas(w,h);c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const p=c.getContext('2d').getImageData(0,0,w,h),t=new T.DataTexture(new Uint8Array(p.data),w,h);t.colorSpace=T.SRGBColorSpace;t.flipY=true;t.generateMipmaps=true;t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.needsUpdate=true;return t;}
export function addReferenceMaterials(m){
 const maps={photoStone:'hope-sandstone',photoPrecast:'hope-dark-precast',photoMosaic:'clinic-mosaic-stone',photoCobble:'clinic-cobble',photoCanvas:'clinic-blue-canvas',photoAsphalt:'hope-asphalt'};
 Object.assign(URBAN_TILE_SIZE,{photoStone:5.6,photoPrecast:3,photoMosaic:3.5,photoCobble:3.2,photoCanvas:3.5,photoAsphalt:4.0});
 for(const [key,map]of Object.entries(maps))m[key]=new T.MeshStandardMaterial({map:referenceTextures[map],color:0xffffff,roughness:.88,vertexColors:true});
 const colors={photoStucco:0xe6e4d7,photoGranite:0x979e98,photoFrame:0x95978d,photoRail:0xd8dfdc,photoBlue:0x0574d0,photoGlass:0x172b2c,photoCurtain:0xa5ac9e,photoPodium:0x7e8982,photoRedCurb:0x9b312b,photoBronze:0x756d53,photoTrunk:0x85857c,photoCream:0xc8c7b9,photoSteel:0x606961,photoGlassBlue:0x354857,photoShade:0x202624,photoFrost:0xb4c7c4};
 for(const [key,color]of Object.entries(colors))m[key]=new T.MeshStandardMaterial({color,roughness:key.includes('Glass')?.23:.85,metalness:key==='photoFrame'?.45:0,vertexColors:true});
 for(const[key,file]of Object.entries({photoClinic:'clinic-sign',photoLab:'lab-sign',photoMarisa:'marisa-sign',photoLabWindow:'lab-window'}))m[key]=new T.MeshStandardMaterial({map:referenceTextures[file],color:0xffffff,roughness:.63,side:T.DoubleSide,vertexColors:true});
 for(const[key,file]of Object.entries({photoTree:'ficus-full-a',photoCrown:'ficus-crown-b',photoLeaf:'ficus-branch-c'}))m[key]=new T.MeshStandardMaterial({map:referenceTextures[file],color:0xe0e7d4,alphaTest:.38,roughness:.95,side:T.DoubleSide,vertexColors:true});
 m.photoCanvas.side=T.DoubleSide;m.photoAsphalt.color.set(0xc4c8c8);
 m.photoDermica=new T.MeshStandardMaterial({map:lettering(1024,256,(c,w,h)=>{c.fillStyle='#116b9c';c.fillRect(0,0,w,h);c.strokeStyle='#e9e7d4';c.lineWidth=8;c.strokeRect(8,8,w-16,h-16);c.fillStyle='#e0e4ce';c.font='180px Arial';c.fillText('dermi',20,199,760);c.fillStyle='#519329';c.fillRect(760,20,244,216);c.fillStyle='#edf0da';c.font='195px Arial';c.fillText('a',800,201);}),roughness:.75,vertexColors:true});
 m.photoTreeShadow=new T.MeshBasicMaterial({map:referenceTextures['ficus-crown-b'],color:0x0c1721,transparent:true,opacity:.32,depthWrite:false,side:T.DoubleSide});
 m.photoSoftShadow=new T.MeshBasicMaterial({color:0x102029,transparent:true,opacity:.24,depthWrite:false,side:T.DoubleSide});
 m.photoBanner=new T.MeshStandardMaterial({map:lettering(256,2048,(c,w,h)=>{c.fillStyle='#ae6623';c.fillRect(0,0,w,h);c.fillStyle='#e5decb';c.save();c.translate(w*.71,h*.92);c.rotate(-Math.PI/2);c.font='bold 110px Arial';c.fillText('PEGASUS',0,0,1000);c.restore();c.textAlign='center';c.font='58px Arial';[...'866-997-9310'].forEach((v,i)=>c.fillText(v,w*.72,145+i*64));c.save();c.translate(w*.30,120);c.rotate(Math.PI/2);c.font='39px Arial';c.fillText('Apartment Residences',0,0,830);c.restore();}),roughness:.92,side:T.DoubleSide,vertexColors:true});
 m.photoFamima=new T.MeshStandardMaterial({map:lettering(1024,256,(c,w,h)=>{c.fillStyle='#252a25';c.fillRect(0,0,w,h);c.fillStyle='#e7e8dc';c.font='bold 180px Arial';c.fillText('famima!!',18,198,940);}),roughness:.7,vertexColors:true});
 m.photoHope=new T.MeshStandardMaterial({map:lettering(512,160,(c,w,h)=>{c.fillStyle='#245b9e';c.fillRect(0,0,w,h);c.strokeStyle='#aabfc7';c.lineWidth=9;c.strokeRect(7,7,w-14,h-14);c.fillStyle='#e5e5d1';c.font='80px Arial';c.textAlign='center';c.fillText('Hope',w/2,112);}),roughness:.7,vertexColors:true});
 for(const[key,v]of Object.entries(m))if(key.startsWith('photo')){v.name='Reference v50 / '+key;v.userData.urbanShared=true;v.userData.referenceMaterial=true;}
 return m;
}
