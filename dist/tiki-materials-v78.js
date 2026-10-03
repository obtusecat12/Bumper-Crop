import * as T from './vendor/three.module.min.js';
import {initializeTiki77,tiki77Materials} from './tiki-materials-v77.js';
const additions=new Map();let pending;
export async function initializeTiki78(report=()=>{}){if(pending)return pending;pending=(async()=>{await initializeTiki77(p=>report(p*.74));const manifest=await fetch(new URL('./textures/tiki-v78/manifest.json',import.meta.url)).then(r=>{if(!r.ok)throw new Error('V78 texture manifest unavailable');return r.json();});let cursor=0,done=0;const jobs=Object.entries(manifest.assets);await Promise.all(Array.from({length:4},async()=>{while(cursor<jobs.length){const [id,item]=jobs[cursor++],t=await new T.TextureLoader().loadAsync(new URL('./textures/tiki-v78/'+item.file,import.meta.url).href);t.name='V78 generated '+id;t.colorSpace=item.data?T.NoColorSpace:T.SRGBColorSpace;t.wrapS=t.wrapT=item.repeat?T.RepeatWrapping:T.ClampToEdgeWrapping;t.anisotropy=4;t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;additions.set(id,t);report(.74+.26*++done/jobs.length);}}));})();return pending.catch(e=>{pending=null;throw e;});}
export function tiki78Materials(){const base=tiki77Materials(),m=base.m,tex=id=>additions.get(id)||base.tex(id);
 const photo=(name,rough=.55)=>new T.MeshStandardMaterial({name:'V78 reference '+name,map:tex(name),roughness:rough,side:T.DoubleSide});
 for(let i=0;i<4;i++)m['bottleLabels'+i]=photo('bottleLabels'+i,.55);
 m.mosaicCups=new T.MeshPhysicalMaterial({name:'Two distinct mosaic tumblers',map:tex('mosaicCups'),roughness:.30,clearcoat:.6,clearcoatRoughness:.17,side:T.DoubleSide});
 m.oliveAsh=new T.MeshPhysicalMaterial({name:'Reference olive ashtray',map:tex('oliveAsh'),roughness:.39,clearcoat:.45,clearcoatRoughness:.22,side:T.DoubleSide});
 for(const key of['pineapple','melon','papayaYellow','papayaGreen']){m[key].map=tex(key+'New');m[key].color.setHex(0xffffff);m[key].roughness=.64;m[key].normalScale.set(.14,.14);m[key].clearcoat=.12;}
 m.moai.map=tex('moai/basecolor');m.moai.normalMap=tex('moai/normal');m.moai.roughnessMap=tex('moai/roughness');m.moai.aoMap=tex('moai/ao');m.moai.aoMapIntensity=.28;m.moai.normalScale.set(.30,.30);m.moai.roughness=.72;m.moai.clearcoat=.38;m.moai.clearcoatRoughness=.34;m.moai.metalness=0;m.moai.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=max(.32,roughnessFactor);');};m.moai.customProgramCacheKey=()=>"v78-wet-moai-roughness-floor";
 m.masonry.clearcoat=.10;m.masonry.roughness=.83;m.masonry.aoMapIntensity=.33;
 m.pondBed=m.moai.clone();m.pondBed.color.setHex(0x6f7548);m.pondBed.clearcoat=.3;m.pondBed.roughness=.9;
 m.shelfBack=m.mat.clone();m.shelfBack.color.setHex(0xc8aa87);m.shelfBack.roughness=.90;
 m.pondRed=m.mat.clone();m.pondRed.color.setHex(0xb53425);m.pondRed.roughness=.86;
 m.mat.color.setHex(0xd9cbb6);m.counter.color.setHex(0xd8b591);m.counter.roughness=.59;m.counter.clearcoat=.24;m.counter.clearcoatRoughness=.34;m.counter.normalScale.set(.25,.25);m.floor.roughness=.75;
 m.lanternGlow.emissiveIntensity=.95;m.lanternGlow.color.setHex(0xa83319);m.lanternGlow.emissive.setHex(0xf63b1c);
 m.warmShade=new T.MeshStandardMaterial({name:'Steady aged amber dome',map:m.ivory.map,color:0xffd38a,emissive:0xffbc66,emissiveIntensity:.5,roughness:.63});
 m.barAccents=photo('barAccents',.47);
 for(const key of['dollFaceWhite','dollFacePink','dollTorsoWhite','dollTorsoPink']){m[key]=photo(key,.40);m[key].normalMap=m.porcelain.normalMap;m[key].normalScale=new T.Vector2(.035,.035);}
 m.clay.color.setHex(0xb17749);m.clay.map=tex('moai/basecolor');m.clay.normalScale.set(.035,.035);
 for(const key of['trayFar','trayMiddle','trayNear'])m[key]=photo(key,.55);
 return{...base,m,tex};}
