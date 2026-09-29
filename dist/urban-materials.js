import * as T from './vendor/three.module.min.js';
import {addAdvertisingMaterials} from './advertising-assets.js?v=57';
import {addUrbanAssetMaterials,installUrbanGlass} from './urban-assets.js?v=57';
import {exitTextures} from './exit-textures.js?v=57';
import {attachRuralDetail} from './rural-textures.js?v=57';

// Material sizes are metres per tile, not one stretched photo per building.
export const URBAN_TILE_SIZE={concrete:3,stucco:3.2,travertine:3.6,sandstone:3.2,ribbed:2.4,brickRed:2.5,brickOchre:2.5,cinder:3.2,steel:2.2,shutter:2.5,asphalt:3.8,sidewalk:4.8,glass:3.2,glassLight:3.2};
const mapped={concrete:'sidewalk-concrete',stucco:'wall-plaster',travertine:'travertine',sandstone:'sandstone',ribbed:'ribbed',brickRed:'brick-red',brickOchre:'brick-ochre',cinder:'cinder',steel:'steel',shutter:'shutter',asphalt:'road-asphalt',sidewalk:'sidewalk-concrete',glass:'glass',glassLight:'glass'};
const palette={metal:0x525957,dark:0x202b2e,white:0xe3e2d7,yellow:0xe3b735,blue:0x1f5caa,green:0x395b4c,red:0xb44535,rubber:0x343939,foliage:0x365237,bark:0x736d56,rust:0x926951,lamp:0xd8c798,signalRed:0xdc3727};
export const SIGN_SPECS={
 clinic:['CENTRO DERMATOLÓGICO','PIEL · CONSULTAS','#edeade','#326a72'],lab:['is LAB','ANÁLISIS CLÍNICOS','#e6e5de','#27748b'],bakery:['Marisa','PASTELERIA','#d6c4a3','#714d3b'],photo:['FOTO COLOR','PHOTO · REVELADO','#efdeac','#9e4733'],cleaners:['CLEANERS','LAVANDERÍA · DRY CLEANING','#e8e5ce','#305c78'],travel:['VIAJES DEL SOL','TRAVEL SERVICE','#e6d7b5','#286977'],market:['MERCADO','GROCERIES · ABARROTES','#d2d4bf','#384a35'],auto:['AUTO SERVICE','ALIGNMENT · BRAKES','#e0d7be','#9b4737'],pharmacy:['FARMACIA','PHARMACY','#e6e7d9','#387358'],bank:['PACIFIC TRUST','SAVINGS & LOAN','#d3c9b1','#424b4d'],parking:['PARKING','ENTRANCE →','#e6dfc9','#365b72'],pegasus:['PEGASUS','Apartment Residences','866-997-9310','#d2942f','#f5eed5'],tower:['PACIFIC','PLAZA','#d7d7c6','#404e54'],ghost:['WESTERN STORAGE','WAREHOUSE & TRANSFER','#b4afa0','#746e60'],leasing:['OFFICES TO LET','LEASING 555-0188','#d4a144','#473f2e'],hope:['Hope St','','#16335d','#ebe8d8'],olive:['Olive St','','#173861','#ede7d5'],grand:['Grand Ave','','#193752','#eee9d5'],oneway:['ONE WAY','→','#e5c245','#303837'],speed:['SPEED LIMIT','35','#e6e3d5','#303838'],restrict:['NO PARKING','8 AM — 6 PM','#e3dfcf','#9d493e'],pedestrian:['DON’T','WALK','#292d29','#db644c']
};
function signTexture(id){
 const spec=SIGN_SPECS[id]||SIGN_SPECS.market,isBanner=id==='pegasus';
 const canvas=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(isBanner?256:512,isBanner?768:160):document.createElement('canvas');
 canvas.width=isBanner?256:512;canvas.height=isBanner?768:160;const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
 const bg=spec.at(-2),fg=spec.at(-1);c.fillStyle=bg;c.fillRect(0,0,w,h);c.strokeStyle=fg;c.globalAlpha=.30;c.lineWidth=5;c.strokeRect(9,9,w-18,h-18);c.globalAlpha=1;
 c.textAlign='center';c.textBaseline='middle';c.fillStyle=fg;
 if(isBanner){c.font='bold 41px Georgia';c.fillText('PEGASUS',128,116,228);c.font='27px Georgia';c.fillText('Apartment',128,264,222);c.fillText('Residences',128,302,222);c.font='bold 26px sans-serif';c.fillText('866-997-9310',128,584,230);c.fillRect(62,187,132,2);}
 else{c.font=(id==='bakery'?'italic bold 64px Georgia':'bold 45px Arial');c.fillText(spec[0],w/2,spec[1]?60:80,w-32);if(spec[1]){c.font='22px Arial';c.fillText(spec[1],w/2,115,w-32);}}
 // Restrained solar fading on manufactured print. No random illegible lettering.
 c.fillStyle='#e8dec6';c.globalAlpha=.045;for(let k=0;k<8;k++)c.fillRect((k*83)%w,0,1,h);c.globalAlpha=1;
 const image=c.getImageData(0,0,w,h);const t=new T.DataTexture(new Uint8Array(image.data),w,h);t.name='Municipal and commercial lettering / '+id;t.colorSpace=T.SRGBColorSpace;t.flipY=true;t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;return t;
}
export function createUrbanMaterials(){
 const mats={};for(const [key,map]of Object.entries(mapped)){
  mats[key]=new T.MeshStandardMaterial({map:exitTextures[map],color:key==='concrete'?0xc5c6bc:key==='glassLight'?0xaabebc:0xffffff,roughness:key.startsWith('glass')?.27:key==='steel'?.69:.93,metalness:key.startsWith('glass')?.18:key==='steel'?.32:0,vertexColors:true});
 }
 for(const[key,color]of Object.entries(palette))mats[key]=new T.MeshStandardMaterial({color,roughness:key==='metal'?.68:.91,vertexColors:true});
 mats.lamp.emissive.set(0x8a643b);mats.lamp.emissiveIntensity=.42;mats.signalRed.emissive.set(0xed311d);mats.signalRed.emissiveIntensity=.7;
 mats.dishMesh=new T.MeshStandardMaterial({color:0x202a2b,roughness:.75,wireframe:true,vertexColors:true,side:T.DoubleSide});
 mats.letters=new T.MeshStandardMaterial({color:0xdad6c5,emissive:0xb4ad85,emissiveIntensity:.32,roughness:.64,vertexColors:true});
 attachRuralDetail(mats.foliage,'broadleaf');attachRuralDetail(mats.bark,'bark');
 for(const id of Object.keys(SIGN_SPECS)){mats['sign:'+id]=new T.MeshStandardMaterial({map:signTexture(id),roughness:.83,vertexColors:true,side:T.DoubleSide});}
 for(const[key,m]of Object.entries(mats)){m.name='urban49 / '+key;m.userData.urbanShared=true;}
 installUrbanGlass(mats.glass);installUrbanGlass(mats.glassLight);addUrbanAssetMaterials(mats);addAdvertisingMaterials(mats);
 return mats;
}
