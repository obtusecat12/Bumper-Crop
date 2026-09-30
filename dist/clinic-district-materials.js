import {addFountainWaterMaterials} from './fountain-water-v54.js?v=59';
import * as T from './vendor/three.module.min.js';
import {URBAN_TILE_SIZE} from './urban-materials.js?v=59';
export const DISTRICT_TEXTURES={
 mallMosaic:[512,512,true,'../urban-v58/ceramic-mosaic.webp'],payphoneFace:[256,384,false,'../urban-v58/payphone-face.webp'],mallDirectory:[512,768,false,'../urban-v58/palm-court-directory.webp'],colaMachine:[256,512,false,'../urban-v58/sunset-cola-vending.webp'],
 terrazzo:[512,512,true,'../urban-v57/pale-terrazzo-cement.webp'],
 cereal:[384,576,false,'../urban-v57/corn-sun-front.webp'],crackers:[384,576,false,'../urban-v57/saltine-house-front.webp'],chips:[512,512,false,'../urban-v57/golden-valley-chip-front.webp'],juice:[256,512,false,'../urban-v57/orchard-orange-front.webp'],
 burgundyCanvas:[512,512,true,'../urban-v55/patio-burgundy-canvas.webp'],yellowLinen:[512,512,true,'../urban-v55/patio-yellow-linen.webp'],wicker:[512,512,true,'../urban-v55/patio-wicker.webp'],terraceTile:[512,512,true,'../urban-v55/patio-terracotta.webp'],
 pavers:[512,512,true,'plaza-pavers.webp'],poolTile:[512,512,true,'fountain-tile.webp'],palmBark:[512,512,true,'palm-bark.webp'],palmFrond:[512,256,false,'../urban-v54/palm-a.webp'],palmFrondB:[512,256,false,'../urban-v54/palm-b.webp'],
 terracotta:[256,256,true,'../urban-v54/prop-terracotta-diffuse.webp'],benchWood:[256,256,true,'../urban-v57/warm-bench-hardwood-planks.webp'],paintMetal:[256,256,true,'../urban-v57/municipal-green-painted-steel.webp'],
 books:[768,512,false,'el-estudiante.webp'],phones:[768,512,false,'tecnomovil.webp'],travel:[768,512,false,'sol-y-mundo.webp'],
 optica:[1536,384,false,'optica.webp'],pharmacy:[1536,384,false,'pharmacy.webp'],laundry:[1536,384,false,'laundry.webp'],beauty:[1536,384,false,'beauty.webp'],bookSign:[1536,384,false,'bookstore.webp'],phoneSign:[1536,384,false,'phones.webp'],travelSign:[1536,384,false,'travel.webp']
};
export const districtTextures={};
for(const[key,[w,h,repeat]]of Object.entries(DISTRICT_TEXTURES)){const t=new T.DataTexture(new Uint8Array([188,185,170,255]),1,1);t.name='Clinic district / '+key;t.colorSpace=T.SRGBColorSpace;t.flipY=true;t.generateMipmaps=true;t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;t.anisotropy=8;t.wrapS=t.wrapT=repeat?T.RepeatWrapping:T.ClampToEdgeWrapping;t.needsUpdate=true;if(key==='mallMosaic')t.wrapS=t.wrapT=T.MirroredRepeatWrapping;districtTextures[key]=t;}
let pending;
async function decode(url,w,h){const r=await fetch(url);if(!r.ok)throw Error('District texture '+url.pathname+': '+r.status);const im=await createImageBitmap(await r.blob()),c=new OffscreenCanvas(w,h),ctx=c.getContext('2d');ctx.drawImage(im,0,0,w,h);im.close();return{data:new Uint8Array(ctx.getImageData(0,0,w,h).data),width:w,height:h};}
export function initializeDistrictTextures(load=decode){return pending||(pending=Promise.all(Object.entries(DISTRICT_TEXTURES).map(async([key,[w,h,,file]])=>{districtTextures[key].image=await load(new URL('./textures/clinic-v53/'+file,import.meta.url),w,h);districtTextures[key].needsUpdate=true;})).catch(e=>{pending=null;throw e;}));}
export const fountainClock={value:0},fountainCenter={value:new T.Vector2()};
export function addDistrictMaterials(m){
 m.plazaRoof=new T.MeshStandardMaterial({name:"Milky arcade vault / translucent acrylic",color:0xc9d4c9,roughness:.64,metalness:.03,side:T.DoubleSide,vertexColors:true});m.plazaRoof.userData.urbanShared=true;
 for(const[key,t]of Object.entries(districtTextures)){const leaf=key.startsWith('palmFrond'),shop=['books','phones','travel'].includes(key),sign=['optica','pharmacy','laundry','beauty','bookSign','phoneSign','travelSign'].includes(key);m['district:'+key]=new T.MeshStandardMaterial({map:t,color:0xffffff,roughness:shop?.29:leaf?.87:sign?.67:.86,metalness:shop?.12:0,vertexColors:true,side:leaf||shop||sign||['burgundyCanvas','yellowLinen'].includes(key)?T.DoubleSide:T.FrontSide,alphaTest:leaf?.42:0,alphaToCoverage:leaf,...(shop?{emissiveMap:t,emissive:0xffffff,emissiveIntensity:.16}:{})});m['district:'+key].name='Clinic district / '+key;m['district:'+key].userData.urbanShared=true;}
 Object.assign(URBAN_TILE_SIZE,{'district:burgundyCanvas':1,'district:yellowLinen':1.4,'district:wicker':.36,'district:terraceTile':2.0,'district:pavers':3,'district:poolTile':1.28,'district:palmBark':1.5,'district:terracotta':.55,'district:benchWood':1.75,'district:paintMetal':.8,'district:terrazzo':1.1,'district:mallMosaic':.72});
 for(const key of ['colaMachine','mallDirectory']){const a=m['district:'+key];a.emissiveMap=districtTextures[key];a.emissive.set(0xffffff);a.emissiveIntensity=key==='colaMachine'?.16:.045;}
 m.plazaShell=m.photoCream.clone();m.plazaShell.side=T.DoubleSide;m.plazaShell.name='Cream enamel acoustic phone hood';m.plazaShell.userData.urbanShared=true;
 addFountainWaterMaterials(m,{clock:fountainClock,center:fountainCenter});
 return m;
}
