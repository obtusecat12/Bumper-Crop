import * as T from './vendor/three.module.min.js';
import {URBAN_TILE_SIZE} from './urban-materials.js?v=57';

export const REFERENCE_TEXTURES={
 'hope-fine-stone':[1024,1024,true], 'hope-sandstone':[1024,1024,true], 'hope-dark-precast':[1024,1024,true],
 'clinic-mosaic-stone':[1024,1024,true], 'clinic-cobble':[1024,1024,true],
 'clinic-blue-canvas':[1024,1024,true], 'hope-asphalt':[1024,1024,true],
 'clinic-sign':[1536,512,false], 'lab-sign':[1536,512,false],
 'marisa-sign':[1536,512,false], 'lab-window':[512,1024,false],
 'ficus-full-a':[1024,1024,false], 'ficus-crown-b':[1024,1024,false], 'ficus-branch-c':[1024,1024,false]
};
export const WINDOW_TEXTURES=Object.freeze(['famima-window','corporate-lobby-door','generic-retail-window','dermica-left-glass','marisa-interior','clinic-frosted']);
export const V51_TEXTURES=Object.freeze([...WINDOW_TEXTURES,'clinic-mosaic-stone','hope-fine-stone']);
for(const key of WINDOW_TEXTURES)REFERENCE_TEXTURES[key]=[1536,1024,false];
export const referenceTextures={};
for(const [key,[w,h,repeat]] of Object.entries(REFERENCE_TEXTURES)){
 const t=new T.DataTexture(new Uint8Array([180,180,180,255]),1,1);t.name='Photographic reference / '+key;t.colorSpace=T.SRGBColorSpace;t.flipY=true;t.generateMipmaps=true;t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.anisotropy=8;t.wrapS=t.wrapT=repeat?T.RepeatWrapping:T.ClampToEdgeWrapping;t.needsUpdate=true;referenceTextures[key]=t;
}
let loading;
async function decode(url,w,h){const r=await fetch(url);if(!r.ok)throw Error('Reference material '+url.pathname+': '+r.status);const im=await createImageBitmap(await r.blob()),c=typeof OffscreenCanvas==='undefined'?document.createElement('canvas'):new OffscreenCanvas(w,h);c.width=w;c.height=h;c.getContext('2d').drawImage(im,0,0,w,h);im.close();return{data:new Uint8Array(c.getContext('2d').getImageData(0,0,w,h).data),width:w,height:h};}
export function initializeReferenceTextures(load=decode){return loading||(loading=Promise.all(Object.entries(REFERENCE_TEXTURES).map(async([key,[w,h]])=>{referenceTextures[key].image=await load(new URL('./textures/'+(V51_TEXTURES.includes(key)?'reference-v51/':'reference-v50/')+key+'.webp',import.meta.url),w,h);referenceTextures[key].needsUpdate=true;})).catch(e=>{loading=null;throw e}));}
function lettering(w,h,draw){const c=typeof OffscreenCanvas==='undefined'?document.createElement('canvas'):new OffscreenCanvas(w,h);c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const p=c.getContext('2d').getImageData(0,0,w,h),t=new T.DataTexture(new Uint8Array(p.data),w,h);t.colorSpace=T.SRGBColorSpace;t.flipY=true;t.generateMipmaps=true;t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.needsUpdate=true;return t;}
export function addReferenceMaterials(m){
 const maps={photoStone:'hope-sandstone',photoPrecast:'hope-dark-precast',photoMosaic:'clinic-mosaic-stone',photoCobble:'clinic-cobble',photoCanvas:'clinic-blue-canvas',photoAsphalt:'hope-asphalt'};
 Object.assign(URBAN_TILE_SIZE,{photoStone:5.6,photoPrecast:3,photoMosaic:3.5,photoCobble:3.2,photoCanvas:3.5,photoAsphalt:4.0});
 for(const [key,map]of Object.entries(maps))m[key]=new T.MeshStandardMaterial({map:referenceTextures[map],color:0xffffff,roughness:.88,vertexColors:true});
 const colors={photoStucco:0xe6e4d7,photoGranite:0x90968e,photoFrame:0x95978d,photoRail:0xd8dfdc,photoBlue:0x0e77c6,photoGlass:0x4c5b57,photoCurtain:0xc1c0ae,photoPodium:0xa5ad9d,photoRedCurb:0x9b312b,photoBronze:0x756d53,photoTrunk:0x817e6c,photoCream:0xc8c7b9,photoSteel:0x606961,photoGlassBlue:0x5b6d7b,photoShade:0x303730,photoFrost:0xb4c7c4};
 for(const [key,color]of Object.entries(colors))m[key]=new T.MeshStandardMaterial({color,roughness:key.includes('Glass')?.23:.85,metalness:key==='photoFrame'?.45:0,vertexColors:true});
 for(const[key,file]of Object.entries({photoClinic:'clinic-sign',photoLab:'lab-sign',photoMarisa:'marisa-sign',photoLabWindow:'lab-window'}))m[key]=new T.MeshStandardMaterial({map:referenceTextures[file],color:0xffffff,roughness:.63,side:T.DoubleSide,vertexColors:true});
 for(const[key,file]of Object.entries({photoTree:'ficus-full-a',photoCrown:'ficus-crown-b',photoLeaf:'ficus-branch-c'}))m[key]=new T.MeshStandardMaterial({map:referenceTextures[file],color:0xe0e7d4,alphaTest:.38,roughness:.95,side:T.DoubleSide,vertexColors:true});
 for(const[key,file]of Object.entries({photoShop:'famima-window',photoLobby:'corporate-lobby-door',photoRetail:'generic-retail-window',photoDermicaGlass:'dermica-left-glass',photoBakeryInside:'marisa-interior',photoClinicInside:'clinic-frosted'}))m[key]=new T.MeshStandardMaterial({map:referenceTextures[file],emissiveMap:referenceTextures[file],emissive:0xffffff,emissiveIntensity:.20,color:0xffffff,roughness:.45,side:T.DoubleSide,vertexColors:true});
 m.photoGranite.map=referenceTextures['hope-fine-stone'];m.photoGranite.color.set(0xdadfd7);m.photoPodium.map=referenceTextures['hope-fine-stone'];m.photoPodium.color.set(0xf5fff0);URBAN_TILE_SIZE.photoGranite=.75;URBAN_TILE_SIZE.photoPodium=.85;
 m.photoStucco.map=m.stucco.map;URBAN_TILE_SIZE.photoStucco=4.2;
 for(const key of ['photoGlass','photoGlassBlue']){const mat=m[key];mat.roughness=.32;mat.metalness=.15;mat.onBeforeCompile=s=>{s.fragmentShader=s.fragmentShader.replace('#include <lights_fragment_end>',`#include <lights_fragment_end>
 vec3 cityRay=inverseTransformDirection(reflect(-geometryViewDir,geometryNormal),viewMatrix);
 vec3 cityReflection=mix(vec3(.065,.075,.062),vec3(.28,.36,.40),smoothstep(-.2,.5,cityRay.y));
 float cityFresnel=.08+.55*pow(1.-max(0.,dot(geometryNormal,geometryViewDir)),5.);
 reflectedLight.indirectSpecular+=cityReflection*cityFresnel;`);};mat.customProgramCacheKey=()=>key+'-bounded-sky-reflection-v51';}
 for(const key of ['photoCrown','photoTree','photoLeaf']){m[key].emissiveMap=m[key].map;m[key].emissive.set(0xffffff);m[key].emissiveIntensity=.045;}
 m.photoCanvas.side=T.DoubleSide;m.photoAsphalt.color.set(0xc4c8c8);
 m.photoDermica=new T.MeshStandardMaterial({map:lettering(1024,256,(c,w,h)=>{c.fillStyle='#116b9c';c.fillRect(0,0,w,h);c.strokeStyle='#e9e7d4';c.lineWidth=8;c.strokeRect(8,8,w-16,h-16);c.fillStyle='#e0e4ce';c.font='180px Arial';c.fillText('dermi',20,199,760);c.fillStyle='#519329';c.fillRect(760,20,244,216);c.fillStyle='#edf0da';c.font='195px Arial';c.fillText('a',800,201);}),roughness:.75,vertexColors:true});
 // Shadows come from the light and caster geometry; there are no hovering shadow cards.
 m.photoBanner=new T.MeshStandardMaterial({map:lettering(512,4096,(c,w,h)=>{c.fillStyle='#ba6c29';c.fillRect(0,0,w,h);c.strokeStyle='#c27c36';c.lineWidth=8;for(const yy of[55,3900])for(let k=0;k<3;k++){c.strokeRect(30+k*17,yy+k*17,w-60-k*34,120-k*25);}c.fillStyle='#dddac9';c.save();c.translate(371,3830);c.rotate(-Math.PI/2);c.font='245px Arial';c.fillText('PEGASUS',0,0,1490);c.restore();c.textAlign='center';c.font='109px Arial';[...'8669979310'].forEach((v,i)=>c.fillText(v,378,515+i*169+(i>2?62:0)+(i>5?62:0)));c.fillStyle='#494e4a';c.save();c.translate(229,2240);c.rotate(-Math.PI/2);c.font='82px Arial';c.fillText('Apartment Residences',720,0,1460);c.restore();}),roughness:.92,side:T.DoubleSide,vertexColors:true});
 m.photoFamima=new T.MeshStandardMaterial({map:lettering(1024,256,(c,w,h)=>{c.fillStyle='#252a25';c.fillRect(0,0,w,h);c.fillStyle='#e7e8dc';c.font='bold 180px Arial';c.fillText('famima!!',18,198,940);}),roughness:.7,vertexColors:true});
 m.photoHope=new T.MeshStandardMaterial({map:lettering(512,160,(c,w,h)=>{c.fillStyle='#245b9e';c.fillRect(0,0,w,h);c.strokeStyle='#aabfc7';c.lineWidth=9;c.strokeRect(7,7,w-14,h-14);c.fillStyle='#e5e5d1';c.font='80px Arial';c.textAlign='center';c.fillText('Hope',w/2,112);}),roughness:.7,vertexColors:true});
 m.photoFamimaRound=new T.MeshStandardMaterial({map:lettering(512,512,(c,w,h)=>{c.fillStyle='#20251f';c.fillRect(0,0,w,h);c.fillStyle='#e3e2d2';c.textAlign='center';c.font='bold 84px Arial';c.fillText('Famima!!',w/2,287,420);}),roughness:.7,vertexColors:true});
 m.photoBus=new T.MeshStandardMaterial({map:lettering(256,384,(c,w,h)=>{c.fillStyle='#d1cbb2';c.fillRect(0,0,w,h);c.fillStyle='#284944';c.font='bold 42px Arial';c.fillText('Metro',29,66);c.fillStyle='#be7933';c.fillRect(12,113,232,12);c.fillStyle='#374642';c.font='bold 67px Arial';c.fillText('20',21,201);c.font='20px Arial';c.fillText('DOWNTOWN',21,245);c.fillRect(24,286,197,5);c.fillRect(24,302,144,5);}),roughness:.8,vertexColors:true});
 m.photoParking=new T.MeshStandardMaterial({map:lettering(256,384,(c,w,h)=>{c.fillStyle='#355b89';c.fillRect(0,0,w,145);c.fillStyle='#dbdcd0';c.fillRect(0,145,w,239);c.textAlign='center';c.fillStyle='#e0e0d5';c.font='64px Arial';c.fillText('707',128,99);c.fillStyle='#384745';c.font='bold 40px Arial';c.fillText('PUBLIC',128,218);c.fillText('PARKING',128,267);c.font='22px Arial';c.fillText('ENTRANCE →',128,325);}),roughness:.8,vertexColors:true});
 m.photoWalkHand=new T.MeshStandardMaterial({map:lettering(128,160,(c,w,h)=>{c.fillStyle='#141b18';c.fillRect(0,0,w,h);c.fillStyle='#ff4020';for(let y=2;y<23;y++)for(let x=2;x<18;x++){const finger=(x>=7&&x<=14&&y>=3+(x%2)&&y<=13),palm=x>=7&&x<=15&&y>=11&&y<=19,thumb=x>=3&&x<=8&&y>=12&&y<=16;if(finger||palm||thumb){c.beginPath();c.arc(x*6,y*6,2.15,0,Math.PI*2);c.fill();}}}),emissive:0xff3b10,emissiveIntensity:.7,roughness:.7,vertexColors:true});m.photoWalkHand.emissiveMap=m.photoWalkHand.map;
 m.photoPole=new T.MeshStandardMaterial({color:0x829081,roughness:.73,metalness:.18,vertexColors:true});
 m.photoSignalHot=new T.MeshBasicMaterial({color:0xffcab0});
 for(const[key,v]of Object.entries(m))if(key.startsWith('photo')){v.name='Reference v51 / '+key;v.userData.urbanShared=true;v.userData.referenceMaterial=true;}
 return m;
}
