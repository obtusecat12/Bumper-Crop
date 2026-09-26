import fs from 'node:fs';import {createRequire} from 'node:module';
const {createCanvas,loadImage}=createRequire(import.meta.url)(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas');
const source=process.argv[2],target='dist/textures/urban-v54';fs.mkdirSync(target,{recursive:true});
for(const name of['palm-a','palm-b','prop-terracotta-diffuse','prop-benchwood-diffuse','prop-municipalmetal-diffuse']){const leaf=name.startsWith('palm'),im=await loadImage(source+'/'+name+'.png'),c=createCanvas(leaf?512:256,256);c.getContext('2d').drawImage(im,0,0,c.width,c.height);fs.writeFileSync(target+'/'+name+'.webp',await c.encode('webp',leaf?94:86));console.log(name,c.width,c.height);}
