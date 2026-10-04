import {chromium} from '/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core/index.mjs';
import fs from 'node:fs/promises';
const root=new URL('../..',import.meta.url).pathname.replace(/\/$/,''),shots=process.argv.slice(2);if(!shots.length)shots.push('pool','arrival','fountain');
const browser=await chromium.launch({executablePath:'/tmp/tiki80-chrome/chrome-headless-shell-linux64/chrome-headless-shell',headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
 await page.route('**/*',async route=>{const u=new URL(route.request().url()),file=u.pathname==='/__garden.html'?root+'/tests/tiki-garden-v81/preview.html':root+'/dist'+u.pathname;try{const body=await fs.readFile(file),ext=file.split('.').pop();await route.fulfill({status:200,body,contentType:({html:'text/html',js:'text/javascript',json:'application/json',webp:'image/webp',png:'image/png',css:'text/css'})[ext]||'application/octet-stream'});}catch{await route.fulfill({status:404,body:'Missing '+u.pathname});}});
 page.on('pageerror',e=>{errors.push(e.message);console.log('PAGE ERROR',e.message)});page.on('console',m=>{if(m.type()==='error'){errors.push(m.text());console.log('CONSOLE ERROR',m.text().slice(0,2200))}});
 await page.goto('http://terminal.local:4173/__garden.html',{waitUntil:'load'});await page.waitForFunction(()=>window.qa?.ready,{},{timeout:240000});
 await page.evaluate(()=>{document.querySelector('nav')?.remove();document.querySelector('#status')?.remove();});await fs.mkdir(root+'/tests/tiki-garden-v81/results',{recursive:true});
 for(const shot of shots){if(shot==='lights'){await page.evaluate(()=>window.qa.setCamera([5.36,1.4,4.2],[5.36,3.04,5.23]));console.log(await page.evaluate(()=>window.qa.room.object.children.map(o=>({name:o.material.name,count:o.geometry.attributes.position.count}))))}else await page.evaluate(s=>window.qa.pose(s),shot);await page.screenshot({path:root+'/tests/tiki-garden-v81/results/'+shot+'.png'});console.log('Captured',shot);}
 console.log(JSON.stringify({errors,stats:await page.evaluate(()=>window.qa.stats)}));
}finally{await browser.close();}
