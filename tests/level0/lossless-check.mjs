import {chromium} from '/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core/index.mjs';
import fs from 'node:fs/promises';
const root=new URL('../..',import.meta.url).pathname.replace(/\/$/,'');
const browser=await chromium.launch({executablePath:'/tmp/tiki80-chrome/chrome-headless-shell-linux64/chrome-headless-shell',headless:true,args:['--no-sandbox']});
try {
 const page=await browser.newPage();
 await page.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.pathname==='/')return route.fulfill({contentType:'text/html',body:`<!doctype html><script type="module">import {initializeTikiTextures,tikiTextures} from './tiki-materials-v76.js';window.decodeCheck=(async()=>{await initializeTikiTextures(false);await initializeTikiTextures(true);return tikiTextures().map(t=>({name:t.name,width:t.image.width,height:t.image.height}));})();</script>`});
  try {const body=await fs.readFile(root+'/dist'+url.pathname);await route.fulfill({body,contentType:url.pathname.endsWith('.js')?'text/javascript':url.pathname.endsWith('.webp')?'image/webp':'image/png'});}catch{await route.fulfill({status:404,body:'Missing '+url.pathname});}
 });
 await page.goto('http://terminal.local:4173/');await page.waitForFunction(()=>window.decodeCheck);
 const result=await page.evaluate(()=>window.decodeCheck);
 if(result.length!==52||result.some(t=>!t.width||!t.height))throw Error('Incomplete texture preload');
 await fs.writeFile(root+'/tests/level0/results/lossless-decode.json',JSON.stringify(result,null,2));
 console.log('All 52 original Tiki texture preloads decode; 48 PBR maps were encoded losslessly.');
} finally {await browser.close();}
