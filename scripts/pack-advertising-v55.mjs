// Reformat independently generated images for GPU upload; no artwork is drawn here.
import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';
import {AD_CATALOG} from '../dist/ad-catalog-v55.js';
const {createCanvas,loadImage}=createRequire(import.meta.url)(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas');
const root=process.argv[2],target='dist/textures/advertising-v55',source='art-source/advertising-v55';fs.mkdirSync(target,{recursive:true});fs.mkdirSync(source,{recursive:true});
const packed=[];
for(const ad of AD_CATALOG){const file=path.join(root,'group-'+ad.group,ad.id+'.png');if(!fs.existsSync(file))continue;const im=await loadImage(file);let sx=0,sy=0,sw=im.width,sh=im.height;
 // Fascia generators were instructed to keep copy in this central horizontal strip.
 if(ad.kind==='fascia'){const hh=im.width/5;sy=(im.height-hh)/2;sh=hh;}
 const aspect=sw/sh,w=ad.textureGroup==='tall'?384:ad.textureGroup==='square'?512:1024,h=Math.round(w/aspect),c=createCanvas(w,h);c.getContext('2d').drawImage(im,sx,sy,sw,sh,0,0,w,h);fs.writeFileSync(target+'/'+ad.file,await c.encode('webp',91));fs.copyFileSync(file,source+'/'+ad.id+'.png');packed.push({...ad,sourceWidth:im.width,sourceHeight:im.height,w,h,crop:[sx,sy,sw,sh]});
 if(ad.id==='ad-120'){const c=createCanvas(768,2304);c.getContext('2d').drawImage(im,0,0,768,2304);fs.writeFileSync(target+'/ad-120-hero.webp',await c.encode('webp',95));}
}
const materials=['patio-burgundy-canvas','patio-yellow-linen','patio-wicker','patio-terracotta'];fs.mkdirSync('dist/textures/urban-v55',{recursive:true});
for(const name of materials){const file=path.join(root,'group-6',name+'.png');if(!fs.existsSync(file))continue;const im=await loadImage(file),c=createCanvas(512,512);c.getContext('2d').drawImage(im,0,0,512,512);fs.writeFileSync('dist/textures/urban-v55/'+name+'.webp',await c.encode('webp',89));fs.copyFileSync(file,source+'/'+name+'.png');}
fs.writeFileSync(target+'/catalog.json',JSON.stringify(packed,null,2));fs.mkdirSync('docs/urban-v55/prompts',{recursive:true});
for(let group=1;group<=6;group++){const p=path.join(root,'group-'+group,'manifest.json');if(fs.existsSync(p))fs.copyFileSync(p,'docs/urban-v55/prompts/group-'+group+'.json');}
console.log({packed:packed.length,total:AD_CATALOG.length,source});
