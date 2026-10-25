import {openPage,root} from './browser.mjs';
import fs from 'node:fs/promises';
const {browser,page,errors}=await openPage('preview.html');
try{await page.waitForFunction(()=>window.qa?.ready,null,{timeout:180000});for(const name of ['pit-close','pit','atrium']){await page.evaluate(n=>qa.view(n),name);await page.screenshot({path:root+'/tests/level0-pit-cycles/results/final-'+name+'.png',timeout:120000});}
const report=await page.evaluate(()=>({stats:qa.stats(),atrium:{hit:__bcAtrium149.hit,miss:__bcAtrium149.miss,filled:__bcAtrium149.filled,error:__bcAtrium149.error}}));report.errors=errors;await fs.writeFile(root+'/tests/level0-pit-cycles/results/final.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));if(errors.length||report.atrium.miss||!report.atrium.filled)throw Error('Capture has missing bake or shader errors');}finally{await browser.close();}
