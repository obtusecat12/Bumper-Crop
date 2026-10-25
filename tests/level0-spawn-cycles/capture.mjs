import {chromium} from '/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core/index.mjs';
import fs from 'node:fs/promises';
const root=new URL('../..',import.meta.url).pathname.replace(/\/$/,''),label=process.argv[2]||'final';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||root+'/../tools/chrome-headless-shell-linux64/chrome-headless-shell',headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const p=await browser.newPage({viewport:{width:640,height:480}}),errors=[];
 p.on('pageerror',e=>{errors.push(e.message);console.log(e.message)});p.on('console',m=>{if(m.type()==='error'){errors.push(m.text());console.log(m.text().slice(0,2000))}});
 await p.route('**/*',async r=>{const u=new URL(r.request().url()),file=u.pathname==='/__spawn.html'?root+'/tests/level0-spawn-cycles/preview.html':root+'/dist'+u.pathname;try{await r.fulfill({status:200,body:await fs.readFile(file),contentType:({html:'text/html',js:'text/javascript',jpg:'image/jpeg',png:'image/png',webp:'image/webp'})[file.split('.').pop()]||'application/octet-stream'});}catch(e){await r.fulfill({status:404,body:'Missing '+u.pathname});}});
 await p.goto('http://terminal.local/__spawn.html',{waitUntil:'load',timeout:120000});await p.waitForFunction(()=>window.qa?.ready,null,{timeout:120000});
 await p.evaluate(()=>qa.draw());await p.screenshot({path:root+'/tests/level0-spawn-cycles/results/'+label+'.png',timeout:120000});
 const stats=await p.evaluate(()=>qa.stats());
 if(label==='final'){console.log('Existing flashlight',await p.evaluate(()=>{qa.turn();return qa.light()}));await p.screenshot({path:root+'/tests/level0-spawn-cycles/results/player-light.png',timeout:120000});}
 const report={label,errors,stats,renderer:'Local Chrome / SwiftShader, native Level 0 world'};await fs.writeFile(root+'/tests/level0-spawn-cycles/results/'+label+'.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await browser.close();}
