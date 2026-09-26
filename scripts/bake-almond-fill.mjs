import fs from 'node:fs';
import {ALMOND_PROFILES,liquidVolume} from '../dist/almond-water-profiles.js';
const tables={};
for(const [kind,p]of Object.entries(ALMOND_PROFILES)){
 const values=[],volume=liquidVolume(p.fill,0,kind);
 for(let i=0;i<65;i++){let a=p.bottom,b=p.top;for(let j=0;j<24;j++){const h=(a+b)*.5;if(liquidVolume(h,i/64,kind)<volume)a=h;else b=h;}values.push(+((a+b)*.5).toFixed(9));}
 values[0]=p.fill;tables[kind]=values;
}
fs.writeFileSync(new URL('../dist/almond-water-fill-tables.js',import.meta.url),'// Baked by scripts/bake-almond-fill.mjs. No integration on startup or per frame.\nexport const almondFillTables='+JSON.stringify(tables)+';\n');
console.log('Baked four 65-sample, volume-conserving liquid profiles.');
