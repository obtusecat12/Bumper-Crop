import {mkdir,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {REFERENCE_TEXTURES,V51_TEXTURES} from '../dist/reference-materials.js';
const {createCanvas,loadImage}=createRequire(import.meta.url)(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas');
await mkdir('dist/textures/reference-v51',{recursive:true});
for(const[key,[w,h]]of Object.entries(REFERENCE_TEXTURES).filter(([key])=>V51_TEXTURES.includes(key))){
 const im=await loadImage('art-source/reference-v51/'+key+'.png'),c=createCanvas(w,h),ctx=c.getContext('2d');
 if(!key.startsWith('ficus')){ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);}ctx.drawImage(im,0,0,w,h);
 const out=await c.encode('webp',93);await writeFile('dist/textures/reference-v51/'+key+'.webp',out);console.log(key+': '+out.length);
}
