import fs from 'node:fs';
import {createRequire} from 'node:module';
import {createVhsCore} from '../../../dist/vhs-core.js';
import {VHS_SATURATION} from '../../../dist/vhs-preset.js';

const base=new URL('../../../docs/water-v30/',import.meta.url);
const sharp=createRequire(import.meta.url)('sharp');
const wasm=fs.readFileSync(new URL('../../../dist/vendor/ntsc-rs/ntsc_rs_web_wrapper_bg.wasm',import.meta.url));
const core=await createVhsCore(wasm);
try{
 for(const label of ['under-window','under-bed','shallow-under','splash-above-0.16','splash-above-0.4','splash-under-0.4']){
  const source=fs.readFileSync(new URL(label+'.png',base));
  const {data,info}=await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const pixels=new Uint8Array(data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength));
  for(let i=0;i<pixels.length;i+=4){
   const r=pixels[i],g=pixels[i+1],b=pixels[i+2],l=.299*r+.587*g+.114*b;
   pixels[i]=Math.max(0,Math.min(255,Math.round(l+(r-l)*VHS_SATURATION)));
   pixels[i+1]=Math.max(0,Math.min(255,Math.round(l+(g-l)*VHS_SATURATION)));
   pixels[i+2]=Math.max(0,Math.min(255,Math.round(l+(b-l)*VHS_SATURATION)));
  }
  core.process(pixels.buffer,info.width,info.height,84,{pregradedTopDown:true});
  await sharp(Buffer.from(pixels),{raw:{width:info.width,height:info.height,channels:4}}).png().toFile(new URL(label+'-vhs.png',base).pathname);
  console.log('VHS optical QA frame '+label);
 }
}finally{core.dispose();}
