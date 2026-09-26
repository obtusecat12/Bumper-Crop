// Runtime game texture encoding. Original imagegen outputs remain unchanged in
// art-source; the browser uses these 384 px diffuse mip sources at metre UV scale.
import {readdir,mkdir,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{createCanvas,loadImage}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas');
await mkdir('dist/textures/urban-v49',{recursive:true});
for(const file of await readdir('art-source/urban-v49')){
 if(!file.endsWith('.png'))continue;
 const im=await loadImage('art-source/urban-v49/'+file),c=createCanvas(384,384),ctx=c.getContext('2d');ctx.drawImage(im,0,0,384,384);
 const out=await c.encode('webp',88);await writeFile('dist/textures/urban-v49/'+file.replace('.png','.webp'),out);
 console.log(file+': '+out.length+' bytes');
}
