import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import fs from 'node:fs';
const root=fileURLToPath(new URL('../../',import.meta.url)),results={};
for(const name of ['physics','stick-slip','optics-state','impact','rain','integration']){
 const run=spawnSync(process.execPath,[`tests/water-v26/${name}.mjs`],{cwd:root,encoding:'utf8'});
 if(run.status!==0){console.error(run.stdout,run.stderr);process.exit(run.status||1);}
 results[name]=JSON.parse(run.stdout);
 console.log(`PASS water-v26/${name}`);
}
fs.mkdirSync(new URL('../../docs/weather-v26/',import.meta.url),{recursive:true});
fs.writeFileSync(new URL('../../docs/weather-v26/checks.json',import.meta.url),JSON.stringify(results,null,2)+'\n');
