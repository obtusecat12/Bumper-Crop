import {chromium} from '/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core/index.mjs';
import fs from 'node:fs/promises';
export const root=new URL('../..',import.meta.url).pathname.replace(/\/$/,'');
export async function openPage(name,viewport={width:640,height:480}){
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||root+'/../tools/chrome-headless-shell-linux64/chrome-headless-shell',headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport}),errors=[];
 await page.addInitScript(()=>{localStorage.setItem('level10.preferences.v1',JSON.stringify({filter:'native',quality:'low',showfps:false,volume:0}));localStorage.setItem('bumpercrop.intro.v119','1');});
 page.on('pageerror',e=>{errors.push(e.message);console.log(e.message)});page.on('console',m=>{if(m.type()==='error'){errors.push(m.text());console.log(m.text().slice(0,1500))}});
 await page.route('**/*',async r=>{const u=new URL(r.request().url()),file=u.pathname==='/__game.html'?root+'/dist/index.html':u.pathname.startsWith('/__')?root+'/tests/level0-pit-cycles/'+u.pathname.slice(3):root+'/dist'+u.pathname;
 try{let body=await fs.readFile(file);if(u.pathname==='/main.js')body=Buffer.from(body.toString()+`\nwindow.qa149={state,camera,renderer,pitDeath,displayFilter,enterZero,keys,resetCameraRig,animateZero,setPlay,get world(){return zeroWorld},get feet(){return zeroFall},place(x,z){state.x=x;state.z=z;zeroFall=0;state.vy=0;state.grounded=true;state.yaw=0;state.pitch=-.6;state.velocity.set(0,0,0);pitDeath.reset();resetCameraRig();}};`);await r.fulfill({status:200,body,contentType:({html:'text/html',js:'text/javascript',css:'text/css',mjs:'text/javascript',png:'image/png',webp:'image/webp',json:'application/json',woff:'font/woff'})[file.split('.').pop()]||'application/octet-stream'});}catch(e){await r.fulfill({status:404,body:'Missing '+u.pathname});}});
 await page.goto('http://terminal.local/__'+name,{waitUntil:'load',timeout:180000});return{browser,page,errors};
}
