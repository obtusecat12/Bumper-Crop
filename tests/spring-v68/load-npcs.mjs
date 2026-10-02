// Node-only decoding adapter. Production uses GLTFLoader.loadAsync directly.
import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
const {createCanvas,loadImage}=createRequire(import.meta.url)(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas');
globalThis.self=globalThis;
globalThis.ProgressEvent=class{constructor(type,init){this.type=type;Object.assign(this,init);}};
globalThis.createImageBitmap=async blob=>{const im=await loadImage(Buffer.from(await blob.arrayBuffer())),c=createCanvas(im.width,im.height);c.getContext('2d').drawImage(im,0,0);c.close=()=>{};return c;};
export async function loadNPC(loader,url){const b=await fs.readFile(url);return loader.parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');}
