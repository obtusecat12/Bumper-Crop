import {openPage,root} from '../tests/level0-pit-cycles/browser.mjs';
import fs from 'node:fs/promises';
const {browser,page,errors}=await openPage('export.html?bake=0&atriumBake=0');
try{await page.waitForFunction(()=>window.ready,null,{timeout:180000});const data=await page.evaluate(()=>dump());if(errors.length)throw Error(errors.join('\n'));await fs.writeFile(root+'/art-source/level0-atrium-cycles/scene.json',JSON.stringify(data));console.log(JSON.stringify({meshes:data.meshes.length,vertices:data.meshes.reduce((a,m)=>a+m.count,0),areas:data.areas.length}));}finally{await browser.close();}
